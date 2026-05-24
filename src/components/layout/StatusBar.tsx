'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { SessionUser } from '@/types/database'

interface Props {
  session: SessionUser
}

const VERSION = 'v0.1.0-alpha'
const BUILD_TS = process.env.NEXT_PUBLIC_BUILD_TIMESTAMP ?? 'dev'
const COMMIT_SHA = (process.env.NEXT_PUBLIC_COMMIT_SHA ?? '').slice(0, 7) || 'local'

export function StatusBar({ session }: Props) {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <footer
      className="flex items-center justify-between px-4 flex-shrink-0"
      style={{
        height: 36,
        background: 'rgba(13, 17, 23, 0.85)',
        borderTop: '1px solid var(--border-default)',
        backdropFilter: 'blur(6px)',
      }}
      role="contentinfo"
    >
      {/* Left cluster */}
      <div
        className="flex items-center font-mono uppercase tracking-[0.14em]"
        style={{ fontSize: 9, color: 'var(--text-muted)', gap: 14 }}
      >
        <span style={{ color: 'var(--text-secondary)' }}>{VERSION}</span>
        <Sep />
        <span title="Build timestamp">{BUILD_TS}</span>
        <Sep />
        <span title="Commit SHA">#{COMMIT_SHA}</span>
      </div>

      {/* Right cluster */}
      <div
        className="flex items-center font-mono uppercase tracking-[0.14em]"
        style={{ fontSize: 9, color: 'var(--text-muted)', gap: 12 }}
      >
        <span
          className="inline-flex items-center"
          style={{ gap: 6, color: 'var(--text-secondary)' }}
        >
          <span
            className="inline-block rounded-full animate-jarvis-pulse"
            style={{
              width: 6,
              height: 6,
              background: 'var(--green)',
              boxShadow: '0 0 6px var(--green)',
            }}
            aria-hidden
          />
          Jarvis Online
        </span>
        <Sep />
        <span style={{ color: 'var(--text-secondary)', textTransform: 'none', letterSpacing: 0 }}>
          {session.email}
        </span>
        <Sep />
        <button
          onClick={handleSignOut}
          className="font-mono uppercase tracking-[0.14em] transition-colors"
          style={{
            fontSize: 9,
            color: 'var(--text-muted)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 6px',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--red)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          Sign out
        </button>
      </div>
    </footer>
  )
}

function Sep() {
  return (
    <span aria-hidden style={{ color: 'var(--border-strong)' }}>
      ·
    </span>
  )
}
