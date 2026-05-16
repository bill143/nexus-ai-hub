import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { KpiStrip } from '@/components/assets/KpiStrip'
import { AssetTable } from '@/components/assets/AssetTable'
import type { Asset } from '@/types/database'

export default async function DashboardPage() {
  const session = await requireAuth()
  const supabase = createClient()

  // Fetch initial page of assets + counts for KPIs
  const [
    { data: assets, count: totalCount },
    { count: highCount },
    { count: liveCount },
    { count: unassignedCount },
    { data: members },
  ] = await Promise.all([
    supabase
      .from('assets')
      .select('*, owner:owner_id(id, full_name, avatar_url)', { count: 'exact' })
      .eq('org_id', session.org?.id ?? '')
      .order('created_at', { ascending: false })
      .range(0, 49),

    supabase
      .from('assets')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', session.org?.id ?? '')
      .eq('priority', 'HIGH'),

    supabase
      .from('assets')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', session.org?.id ?? '')
      .in('stage', ['LIVE', 'PILOT']),

    supabase
      .from('assets')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', session.org?.id ?? '')
      .is('project', null),

    supabase
      .from('profiles')
      .select('id, full_name, avatar_url, role')
      .eq('org_id', session.org?.id ?? ''),
  ])

  const kpis = {
    total: totalCount ?? 0,
    high: highCount ?? 0,
    live: liveCount ?? 0,
    unassigned: unassignedCount ?? 0,
  }

  return (
    <DashboardShell session={session}>
      <div className="p-6 space-y-6">
        <KpiStrip kpis={kpis} />
        <AssetTable
          initialAssets={(assets as Asset[]) ?? []}
          totalCount={totalCount ?? 0}
          session={session}
          members={members ?? []}
        />
      </div>
    </DashboardShell>
  )
}
