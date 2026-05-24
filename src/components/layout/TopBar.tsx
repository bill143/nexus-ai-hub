'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { SessionUser } from '@/types/database'

interface Props {
  session: SessionUser
}

const NAV = [
  { href: '/hub', label: 'Hub' },
  { href: '/settings', label: 'Settings' },
]

const ENV_LABEL =
  process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'
    ? 'PROD'
    : process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview'
    ? 'PREVIEW'
    : 'LOCAL'

export function TopBar({ session }: Props) {
  const pathname = usePathname()

  const initials = session.profile.full_name
    ? session.profile.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : session.email[0].toUpperCase()

  return (
    <header
      className="flex items-center px-5 flex-shrink-0 relative"
      style={{
        height: 56,
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-default)',
      }}
    >
      {/* Animated accent slide on mount */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: 1,
          width: 0,
          background:
            'linear-gradient(90deg, var(--accent), var(--accent2), transparent)',
          animation: 'accentSlide 1.2s cubic-bezier(0.4,0,0.2,1) 0.2s forwards',
        }}
      />

      {/* Brand */}
      <Link
        href="/hub"
        className="flex items-baseline gap-2 mr-8"
        style={{ textDecoration: 'none' }}
      >
        <span
          className="font-display tracking-[0.10em]"
          style={{ fontSize: 22, color: 'var(--text-primary)', lineHeight: 1 }}
        >
          NEXUS <span style={{ color: 'var(--accent2)' }}>HUB</span>
        </span>
        <span
          className="font-mono uppercase"
          style={{
            fontSize: 9,
            letterSpacing: '0.18em',
            color: 'var(--text-muted)',
          }}
        >
          {session.org?.name ?? 'No Org'}
        </span>
      </Link>

      {/* Nav */}
      <nav className="flex items-center gap-1">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className="font-mono uppercase tracking-[0.14em] rounded px-3 py-1.5 transition-colors"
              style={{
                fontSize: 10,
                color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: active ? 'var(--accent-glow)' : 'transparent',
                border: `1px solid ${active ? 'rgba(47,128,237,0.25)' : 'transparent'}`,
                textDecoration: 'none',
              }}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="flex-1" />

      {/* Env badge */}
      <span
        className="font-mono uppercase tracking-[0.18em] mr-4 rounded"
        style={{
          fontSize: 9,
          padding: '3px 8px',
          color: ENV_LABEL === 'PROD' ? 'var(--green)' : ENV_LABEL === 'PREVIEW' ? 'var(--amber)' : 'var(--text-muted)',
          background:
            ENV_LABEL === 'PROD'
              ? 'rgba(15,184,114,0.10)'
              : ENV_LABEL === 'PREVIEW'
              ? 'rgba(246,173,85,0.10)'
              : 'transparent',
          border: `1px solid ${
            ENV_LABEL === 'PROD'
              ? 'rgba(15,184,114,0.30)'
              : ENV_LABEL === 'PREVIEW'
              ? 'rgba(246,173,85,0.30)'
              : 'var(--border-default)'
          }`,
        }}
      >
        {ENV_LABEL}
      </span>

      {/* User avatar */}
      <div className="flex items-center gap-2.5">
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            background: 'var(--accent-glow)',
            border: '1px solid rgba(47,128,237,0.30)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--accent2)',
          }}
          title={session.email}
        >
          {initials}
        </div>
        <div className="leading-tight" style={{ minWidth: 0 }}>
          <div
            style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}
          >
            {session.profile.full_name ?? session.email.split('@')[0]}
          </div>
          <div
            className="font-mono uppercase tracking-[0.10em]"
            style={{ fontSize: 9, color: 'var(--text-muted)' }}
          >
            {session.profile.role}
          </div>
        </div>
      </div>
    </header>
  )
}
