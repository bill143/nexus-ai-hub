import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import { writeAuditLog } from '@/lib/audit'
import type { AssetFilters } from '@/types/database'

const PAGE_LIMIT = 50

// GET /api/assets — list assets with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    const supabase = createClient()

    if (!session.org) {
      return NextResponse.json(
        { error: 'No organization found. Contact your administrator.' },
        { status: 403 }
      )
    }

    const { searchParams } = request.nextUrl
    const filters: AssetFilters = {
      category: (searchParams.get('category') as AssetFilters['category']) ?? 'all',
      priority: searchParams.get('priority') as AssetFilters['priority'] ?? undefined,
      stage: searchParams.get('stage') as AssetFilters['stage'] ?? undefined,
      project: searchParams.get('project') ?? undefined,
      search: searchParams.get('search') ?? undefined,
      page: parseInt(searchParams.get('page') ?? '1', 10),
      limit: Math.min(parseInt(searchParams.get('limit') ?? '50', 10), PAGE_LIMIT),
    }

    let query = supabase
      .from('assets')
      .select('*, owner:owner_id(id, full_name, avatar_url, role)', { count: 'exact' })
      .eq('org_id', session.org.id)
      .order('created_at', { ascending: false })

    if (filters.category && filters.category !== 'all') {
      query = query.eq('category', filters.category)
    }
    if (filters.priority) {
      query = query.eq('priority', filters.priority)
    }
    if (filters.stage) {
      query = query.eq('stage', filters.stage)
    }
    if (filters.project) {
      query = query.eq('project', filters.project)
    }
    if (filters.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,fit.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`
      )
    }

    const page = filters.page ?? 1
    const limit = filters.limit ?? PAGE_LIMIT
    const from = (page - 1) * limit
    const to = from + limit - 1

    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('[GET /api/assets]', error.message)
      return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 })
    }

    return NextResponse.json({
      data: data ?? [],
      count: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    })
  } catch (err) {
    console.error('[GET /api/assets] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/assets — create asset (editor/admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()

    if (!session.org) {
      return NextResponse.json({ error: 'No organization' }, { status: 403 })
    }

    if (!['admin', 'editor'].includes(session.profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()

    // Validate required fields
    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }
    if (!body.category) {
      return NextResponse.json({ error: 'category is required' }, { status: 400 })
    }

    const supabase = createClient()

    const { data, error } = await supabase
      .from('assets')
      .insert({
        org_id: session.org.id,
        name: body.name.trim(),
        category: body.category,
        priority: body.priority ?? 'LOW',
        stage: body.stage ?? 'BACKLOG',
        fit: body.fit ?? null,
        project: body.project ?? null,
        owner_id: body.owner_id ?? null,
        repo_url: body.repo_url ?? null,
        training_docs: body.training_docs ?? null,
        requirements: body.requirements ?? null,
        notes: body.notes ?? null,
        last_reviewed: body.last_reviewed ?? null,
        created_by: session.id,
      })
      .select()
      .single()

    if (error) {
      console.error('[POST /api/assets]', error.message)
      return NextResponse.json({ error: 'Failed to create asset' }, { status: 500 })
    }

    await writeAuditLog({
      orgId: session.org.id,
      userId: session.id,
      action: 'asset.created',
      entityType: 'asset',
      entityId: data.id,
      newData: data,
    })

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('[POST /api/assets] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
