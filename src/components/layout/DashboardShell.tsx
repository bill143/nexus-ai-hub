import type { SessionUser } from '@/types/database'
import type { ReactNode } from 'react'
import { JarvisSidebar } from '@/components/jarvis/JarvisSidebar'
import { StatusBar } from '@/components/layout/StatusBar'
import { TopBar } from '@/components/layout/TopBar'

interface Props {
  session: SessionUser
  children: ReactNode
}

export function DashboardShell({ session, children }: Props) {
  return (
    <div
      className="flex flex-col"
      style={{ height: '100vh', overflow: 'hidden', position: 'relative', zIndex: 1 }}
    >
      <TopBar session={session} />

      <div className="flex flex-1" style={{ minHeight: 0 }}>
        <JarvisSidebar />
        <main
          className="flex-1 overflow-y-auto overflow-x-hidden"
          style={{ background: 'var(--bg-base)' }}
        >
          {children}
        </main>
      </div>

      <StatusBar session={session} />
    </div>
  )
}
