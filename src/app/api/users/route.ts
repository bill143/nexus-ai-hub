import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import { writeAuditLog } from '@/lib/audit'
import type { UserRole } from '@/types/database'

// GET /api/users — list all members of the current org
export async function GET() {
  try {
    const session = await requireAuth()
    if (!session.org) return NextResponse.json({ error: 'No organization' }, { status: 403 })

    const supabase = createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, role, created_at, updated_at')
      .eq('org_id', session.org.id)
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })
    }

    return NextResponse.json(data ?? [])
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/users — update member role (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth()
    if (!session.org) return NextResponse.json({ error: 'No organization' }, { status: 403 })

    if (session.profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin required' }, { status: 403 })
    }

    const body = await request.json()
    const { userId, role } = body as { userId: string; role: UserRole }

    if (!userId || !['admin', 'editor', 'viewer'].includes(role)) {
      return NextResponse.json({ error: 'Invalid userId or role' }, { status: 400 })
    }

    // Prevent admin from demoting themselves
    if (userId === session.id && role !== 'admin') {
      return NextResponse.json({ error: 'Cannot change your own admin role' }, { status: 400 })
    }

    const supabase = createClient()

    const { data: oldProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .eq('org_id', session.org.id)
      .single()

    if (!oldProfile) {
      return NextResponse.json({ error: 'User not found in this organization' }, { status: 404 })
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId)
      .eq('org_id', session.org.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to update role' }, { status: 500 })
    }

    await writeAuditLog({
      orgId: session.org.id,
      userId: session.id,
      action: 'user.role_changed',
      entityType: 'profile',
      entityId: userId,
      oldData: { role: oldProfile.role },
      newData: { role },
    })

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/users — remove member from org (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth()
    if (!session.org) return NextResponse.json({ error: 'No organization' }, { status: 403 })

    if (session.profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin required' }, { status: 403 })
    }

    const { searchParams } = request.nextUrl
    const userId = searchParams.get('userId')

    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })
    if (userId === session.id) {
      return NextResponse.json({ error: 'Cannot remove yourself' }, { status: 400 })
    }

    const supabase = createClient()

    const { error } = await supabase
      .from('profiles')
      .update({ org_id: null, role: 'viewer' })
      .eq('id', userId)
      .eq('org_id', session.org.id)

    if (error) {
      return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 })
    }

    await writeAuditLog({
      orgId: session.org.id,
      userId: session.id,
      action: 'user.removed',
      entityType: 'profile',
      entityId: userId,
    })

    return new NextResponse(null, { status: 204 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
