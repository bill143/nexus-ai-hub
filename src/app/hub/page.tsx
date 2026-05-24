import { requireAuth } from '@/lib/auth'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { TileGrid } from '@/components/hub/TileGrid'

export const dynamic = 'force-dynamic'

export default async function HubPage() {
  const session = await requireAuth()

  return (
    <DashboardShell session={session}>
      <TileGrid />
    </DashboardShell>
  )
}
