import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import { writeAuditLog } from '@/lib/audit'
import type { UserRole } from '@/types/database'

// POST /api/orgs/invite — send invite (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    if (!session.org) return NextResponse.json({ error: 'No organization' }, { status: 403 })

    if (session.profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin required' }, { status: 403 })
    }

    const body = await request.json()
    const { email, role } = body as { email: string; role: UserRole }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }

    if (!['admin', 'editor', 'viewer'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const supabase = createClient()

    const { data: invite, error } = await supabase
      .from('org_invites')
      .insert({
        org_id: session.org.id,
        email: email.toLowerCase().trim(),
        role,
        invited_by: session.id,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'An active invite already exists for this email' },
          { status: 409 }
        )
      }
      return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 })
    }

    // TODO Phase 2: Send invite email via Resend
    // await sendInviteEmail({ email, orgName: session.org.name, token: invite.token, role })

    await writeAuditLog({
      orgId: session.org.id,
      userId: session.id,
      action: 'user.invited',
      entityType: 'org_invite',
      entityId: invite.id,
      newData: { email, role },
    })

    return NextResponse.json({ id: invite.id, email, role }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/orgs/invite?token=xxx — accept invite
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    const token = request.nextUrl.searchParams.get('token')

    if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 })

    const admin = createAdminClient()

    const { data: invite, error } = await admin
      .from('org_invites')
      .select('*')
      .eq('token', token)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (error || !invite) {
      return NextResponse.json(
        { error: 'Invite not found or has expired' },
        { status: 404 }
      )
    }

    if (invite.email !== session.email) {
      return NextResponse.json(
        { error: 'This invite is for a different email address' },
        { status: 403 }
      )
    }

    // Link user to org and set role
    const { error: profileError } = await admin
      .from('profiles')
      .update({ org_id: invite.org_id, role: invite.role })
      .eq('id', session.id)

    if (profileError) {
      return NextResponse.json({ error: 'Failed to join organization' }, { status: 500 })
    }

    // Mark invite accepted
    await admin
      .from('org_invites')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invite.id)

    return NextResponse.json({ success: true, orgId: invite.org_id })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
