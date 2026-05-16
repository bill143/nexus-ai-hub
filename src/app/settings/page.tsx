import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { SettingsTabs } from '@/components/settings/SettingsTabs'

export default async function SettingsPage() {
  const session = await requireAuth()
  const supabase = createClient()

  const [{ data: members }, { data: invites }, { data: auditLogs }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, avatar_url, role, created_at')
      .eq('org_id', session.org?.id ?? '')
      .order('created_at', { ascending: true }),

    // Only visible to admin
    session.profile.role === 'admin'
      ? supabase
          .from('org_invites')
          .select('id, email, role, expires_at, created_at')
          .eq('org_id', session.org?.id ?? '')
          .is('accepted_at', null)
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),

    session.profile.role === 'admin'
      ? supabase
          .from('audit_logs')
          .select('id, action, entity_type, entity_id, created_at, user:user_id(id, full_name)')
          .eq('org_id', session.org?.id ?? '')
          .order('created_at', { ascending: false })
          .limit(50)
      : Promise.resolve({ data: [] }),
  ])

  return (
    <DashboardShell session={session}>
      <div className="p-6">
        <SettingsTabs
          session={session}
          members={members ?? []}
          invites={invites ?? []}
          auditLogs={auditLogs ?? []}
        />
      </div>
    </DashboardShell>
  )
}
