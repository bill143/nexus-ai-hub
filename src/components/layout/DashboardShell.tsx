'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { SessionUser } from '@/types/database'
import type { ReactNode } from 'react'

interface Props {
  session: SessionUser
  children: ReactNode
}

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Asset Center', icon: '⬡' },
  { href: '/dashboard?tab=samref', label: 'SAM-A Reference', icon: '◈' },
  { href: '/settings', label: 'Settings', icon: '⚙' },
]

const CATEGORY_FILTERS = [
  { label: 'All Assets', value: 'all' },
  { label: 'RAG / Pipeline', value: 'RAG / Pipeline' },
  { label: 'MCP Servers', value: 'MCP' },
  { label: 'LLM / Model', value: 'LLM' },
  { label: 'Agentic', value: 'Agentic' },
  { label: 'Eval / Obs', value: 'Eval' },
  { label: 'Utility', value: 'Utility' },
]

export function DashboardShell({ session, children }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const initials = session.profile.full_name
    ? session.profile.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : session.email[0].toUpperCase()

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', position: 'relative', zIndex: 1 }}>

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: 'var(--sidebar-w, 220px)',
        flexShrink: 0,
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-default)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'relative',
      }}>
        {/* Left accent line */}
        <div style={{
          position: 'absolute', top: 0, left: 0,
          width: 1, height: '100%',
          background: 'linear-gradient(180deg, var(--accent) 0%, transparent 60%)',
          opacity: 0.4,
        }} />

        {/* Logo */}
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ fontFamily: 'var(--font-bebas)', fontSize: 26, letterSpacing: '0.08em', color: '#fff', lineHeight: 1 }}>
            NEXUS <span style={{ color: 'var(--accent2)' }}>AI</span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.18em', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 2 }}>
            {session.org?.name ?? 'No Organization'}
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0.75rem' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)', padding: '1rem 0.5rem 0.4rem' }}>
            Workspace
          </div>

          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link key={item.href} href={item.href} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px', borderRadius: 6, marginBottom: 2,
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: isActive ? 'var(--accent-glow)' : 'transparent',
                border: isActive ? '1px solid rgba(47,128,237,0.25)' : '1px solid transparent',
                fontSize: 13, fontWeight: 500, textDecoration: 'none',
                transition: 'all 0.15s',
                position: 'relative',
              }}>
                {isActive && (
                  <div style={{
                    position: 'absolute', left: -13, top: '50%', transform: 'translateY(-50%)',
                    width: 2, height: '60%', background: 'var(--accent)', borderRadius: '0 2px 2px 0',
                  }} />
                )}
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            )
          })}

          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)', padding: '1rem 0.5rem 0.4rem' }}>
            Categories
          </div>

          {CATEGORY_FILTERS.map((cat) => (
            <div key={cat.value} style={{
              padding: '4px 12px 4px 20px', borderRadius: 6, cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: 12, marginBottom: 1,
              transition: 'color 0.15s',
            }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              {cat.label}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
          {/* User avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'var(--accent-glow)',
              border: '1px solid rgba(47,128,237,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent2)',
              flexShrink: 0,
            }}>
              {initials}
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500, lineHeight: 1.2 }}>
                {session.profile.full_name ?? session.email.split('@')[0]}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {session.profile.role}
              </div>
            </div>
          </div>

          {/* Sync indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
            <div style={{
              width: 5, height: 5, borderRadius: '50%',
              background: 'var(--green)',
              boxShadow: '0 0 6px var(--green)',
              animation: 'blink 2s ease-in-out infinite',
            }} />
            LIVE · {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </div>

          <button
            onClick={handleSignOut}
            style={{
              marginTop: 8, width: '100%', padding: '5px 0',
              background: 'transparent', border: '1px solid var(--border-default)',
              borderRadius: 5, color: 'var(--text-muted)', fontSize: 11,
              cursor: 'pointer', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--red)'
              e.currentTarget.style.color = 'var(--red)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-default)'
              e.currentTarget.style.color = 'var(--text-muted)'
            }}
          >
            SIGN OUT
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        {/* Topbar */}
        <div style={{
          height: 'var(--header-h, 56px)',
          borderBottom: '1px solid var(--border-default)',
          display: 'flex', alignItems: 'center',
          padding: '0 1.5rem', gap: 12, flexShrink: 0,
          background: 'var(--bg-surface)', position: 'relative',
        }}>
          {/* Accent line animation */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0,
            height: 1, width: 0,
            background: 'linear-gradient(90deg, var(--accent), var(--accent2), transparent)',
            animation: 'accentSlide 1.2s cubic-bezier(0.4,0,0.2,1) 0.3s forwards',
          }} />

          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>NEXUS</span>
            <span style={{ color: 'var(--border-strong)' }}>›</span>
            <span style={{ color: 'var(--text-secondary)' }}>
              {pathname === '/dashboard' ? 'Asset Control Center' : 'Settings'}
            </span>
          </div>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Last synced */}
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
            Last synced: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          {children}
        </div>
      </div>

      {/* ── MOBILE BOTTOM NAV ── */}
      <style>{`
        @media (max-width: 768px) {
          aside { display: none !important; }
          .mobile-nav { display: flex !important; }
        }
      `}</style>
      <nav className="mobile-nav" style={{
        display: 'none',
        position: 'fixed', bottom: 0, left: 0, right: 0,
        height: 56, background: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-default)',
        justifyContent: 'space-around', alignItems: 'center',
        zIndex: 100,
      }}>
        {NAV_ITEMS.map((item) => (
          <Link key={item.href} href={item.href} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            color: pathname === item.href ? 'var(--accent2)' : 'var(--text-muted)',
            textDecoration: 'none', fontSize: 10, fontFamily: 'var(--font-mono)',
            letterSpacing: '0.06em', minWidth: 44, padding: '4px 0',
          }}>
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            <span>{item.label.split(' ')[0]}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
