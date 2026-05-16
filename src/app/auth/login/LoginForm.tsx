'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/dashboard'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !password) { setError('Email and password are required.'); return }
    setLoading(true); setError(null)
    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) { setError(authError.message); setLoading(false); return }
    router.push(next)
    router.refresh()
  }

  async function handleGoogle() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback?next=${next}` } })
  }

  const inp = { width: '100%', padding: '10px 14px', fontSize: 14, border: '1px solid var(--border-default)', borderRadius: 7, background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', outline: 'none' }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontFamily: 'var(--font-bebas)', fontSize: 36, letterSpacing: '0.1em', color: '#fff' }}>NEXUS <span style={{ color: 'var(--accent2)' }}>AI</span></div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.2em', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 4 }}>Sign in to your workspace</div>
        </div>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 12, padding: '2rem' }}>
          {error && <div style={{ background: 'rgba(229,62,62,0.1)', border: '1px solid rgba(229,62,62,0.3)', borderRadius: 6, padding: '10px 14px', fontSize: 13, color: 'var(--red)', marginBottom: '1.25rem' }}>{error}</div>}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" style={inp} />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Password</label>
                <Link href="/auth/reset-password" style={{ fontSize: 11, color: 'var(--accent2)', textDecoration: 'none' }}>Forgot?</Link>
              </div>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={inp} />
            </div>
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '11px', background: loading ? 'var(--border-strong)' : 'var(--accent)', border: 'none', borderRadius: 7, color: '#fff', fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer' }}>{loading ? 'Signing in…' : 'Sign In'}</button>
          </form>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '1.25rem 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>OR</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
          </div>
          <button onClick={handleGoogle} style={{ width: '100%', padding: '11px', background: 'transparent', border: '1px solid var(--border-default)', borderRadius: 7, color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>Continue with Google</button>
          <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: 12, color: 'var(--text-muted)' }}>
            Don&apos;t have an account?{' '}<Link href="/auth/signup" style={{ color: 'var(--accent2)', textDecoration: 'none' }}>Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
