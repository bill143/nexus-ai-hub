import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import { writeAuditLog } from '@/lib/audit'

interface Params {
  params: { id: string }
}

// GET /api/assets/[id]
export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth()
    if (!session.org) return NextResponse.json({ error: 'No organization' }, { status: 403 })

    const supabase = createClient()
    const { data, error } = await supabase
      .from('assets')
      .select('*, owner:owner_id(id, full_name, avatar_url, role)')
      .eq('id', params.id)
      .eq('org_id', session.org.id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/assets/[id] — partial update (editor/admin only)
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth()
    if (!session.org) return NextResponse.json({ error: 'No organization' }, { status: 403 })

    if (!['admin', 'editor'].includes(session.profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const supabase = createClient()

    // Fetch current state for audit diff
    const { data: current, error: fetchError } = await supabase
      .from('assets')
      .select('*')
      .eq('id', params.id)
      .eq('org_id', session.org.id)
      .single()

    if (fetchError || !current) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    // Whitelist updatable fields
    const allowed = [
      'name', 'category', 'priority', 'stage', 'fit', 'project',
      'owner_id', 'repo_url', 'training_docs', 'requirements',
      'notes', 'last_reviewed',
    ]

    const updates: Record<string, unknown> = {}
    for (const key of allowed) {
      if (key in body) updates[key] = body[key]
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('assets')
      .update(updates)
      .eq('id', params.id)
      .eq('org_id', session.org.id)
      .select()
      .single()

    if (error) {
      console.error('[PATCH /api/assets/[id]]', error.message)
      return NextResponse.json({ error: 'Failed to update asset' }, { status: 500 })
    }

    await writeAuditLog({
      orgId: session.org.id,
      userId: session.id,
      action: 'asset.updated',
      entityType: 'asset',
      entityId: params.id,
      oldData: current,
      newData: data,
    })

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/assets/[id] — admin only
export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth()
    if (!session.org) return NextResponse.json({ error: 'No organization' }, { status: 403 })

    if (session.profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin required to delete assets' }, { status: 403 })
    }

    const supabase = createClient()

    // Fetch for audit record before deletion
    const { data: current } = await supabase
      .from('assets')
      .select('*')
      .eq('id', params.id)
      .eq('org_id', session.org.id)
      .single()

    if (!current) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    const { error } = await supabase
      .from('assets')
      .delete()
      .eq('id', params.id)
      .eq('org_id', session.org.id)

    if (error) {
      console.error('[DELETE /api/assets/[id]]', error.message)
      return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 })
    }

    await writeAuditLog({
      orgId: session.org.id,
      userId: session.id,
      action: 'asset.deleted',
      entityType: 'asset',
      entityId: params.id,
      oldData: current,
    })

    return new NextResponse(null, { status: 204 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
