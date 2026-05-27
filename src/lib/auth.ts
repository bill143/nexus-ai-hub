import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { SessionUser } from '@/types/database'

// Get the current session user with profile + org
// Redirects to /auth/login if not authenticated
export async function requireAuth(): Promise<SessionUser> {
  const supabase = createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/auth/login')
  }

  let { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Self-heal: if the auth.users → profiles trigger didn't fire (or RLS
  // hides the row), insert it ourselves with the admin client. This kills
  // the middleware ↔ requireAuth redirect loop at the source: never again
  // can a half-authed state (session valid, profile missing) bounce the
  // user between /hub and /auth/login.
  if (profileError || !profile) {
    const admin = createAdminClient()
    const fullName =
      (user.user_metadata as Record<string, unknown> | null)?.full_name as string | undefined
    const avatarUrl =
      (user.user_metadata as Record<string, unknown> | null)?.avatar_url as string | undefined
    const { data: created } = await admin
      .from('profiles')
      .upsert(
        {
          id: user.id,
          full_name: fullName ?? user.email ?? 'New User',
          avatar_url: avatarUrl ?? null,
        },
        { onConflict: 'id' },
      )
      .select('*')
      .single()
    profile = created
    if (!profile) {
      redirect('/auth/login')
    }
  }

  let org = null
  if (profile.org_id) {
    const { data: orgData } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', profile.org_id)
      .single()
    org = orgData
  }

  return {
    id: user.id,
    email: user.email!,
    profile,
    org,
  }
}

// Require a specific role — redirects to dashboard if insufficient
export async function requireRole(
  minRole: 'admin' | 'editor',
  user?: SessionUser
): Promise<SessionUser> {
  const sessionUser = user ?? await requireAuth()

  const roleHierarchy = { admin: 3, editor: 2, viewer: 1 }
  const userLevel = roleHierarchy[sessionUser.profile.role]
  const requiredLevel = roleHierarchy[minRole]

  if (userLevel < requiredLevel) {
    redirect('/hub')
  }

  return sessionUser
}

// Get session without redirecting — returns null if not authenticated
export async function getSession(): Promise<SessionUser | null> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!profile) return null

    let org = null
    if (profile.org_id) {
      const { data: orgData } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', profile.org_id)
        .single()
      org = orgData
    }

    return { id: user.id, email: user.email!, profile, org }
  } catch {
    return null
  }
}
