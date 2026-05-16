import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'

// GET /api/audit — paginated audit log (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    if (!session.org) return NextResponse.json({ error: 'No organization' }, { status: 403 })

    if (session.profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin required' }, { status: 403 })
    }

    const { searchParams } = request.nextUrl
    const page = parseInt(searchParams.get('page') ?? '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '25', 10), 100)
    const from = (page - 1) * limit
    const to = from + limit - 1

    const supabase = createClient()

    const { data, error, count } = await supabase
      .from('audit_logs')
      .select('*, user:user_id(id, full_name, avatar_url)', { count: 'exact' })
      .eq('org_id', session.org.id)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch audit log' }, { status: 500 })
    }

    return NextResponse.json({
      data: data ?? [],
      count: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
