'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { SessionUser, Profile, OrgInvite, AuditLog, UserRole } from '@/types/database'

interface Props {
  session: SessionUser
  members: Partial<Profile>[]
  invites: Partial<OrgInvite>[]
  auditLogs: Partial<AuditLog>[]
}

const TABS = ['Profile', 'Organization', 'Members', 'Audit Log'] as const
type Tab = typeof TABS[number]

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', fontSize: 13,
  border: '1px solid var(--border-default)', borderRadius: 6,
  background: 'var(--bg-elevated)', color: 'var(--text-primary)',
  fontFamily: 'var(--font-sans)', outline: 'none',
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontFamily: 'var(--font-mono)', fontSize: 9,
  letterSpacing: '0.15em', textTransform: 'uppercase' as const,
  color: 'var(--text-muted)', marginBottom: 6,
}

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
  borderRadius: 8, padding: '1.5rem', marginBottom: '1.25rem',
}

const sectionLabel: React.CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em',
  textTransform: 'uppercase' as const, color: 'var(--text-muted)',
  marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8,
}

const ROLE_COLORS: Record<string, string> = {
  admin: 'var(--gold)',
  editor: 'var(--accent2)',
  viewer: 'var(--text-muted)',
}

export function SettingsTabs({ session, members, invites, auditLogs }: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('Profile')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<UserRole>('viewer')
  const [inviting, setInviting] = useState(false)
  const [fullName, setFullName] = useState(session.profile.full_name ?? '')
  const [savingProfile, setSavingProfile] = useState(false)
  const [orgName, setOrgName] = useState(session.org?.name ?? '')
  const [savingOrg, setSavingOrg] = useState(false)
  const isAdmin = session.profile.role === 'admin'

  async function saveProfile() {
    if (savingProfile) return
    const trimmed = fullName.trim()
    if (!trimmed) {
      toast.error('Full name cannot be empty')
      return
    }
    setSavingProfile(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: trimmed })
      .eq('id', session.id)
    setSavingProfile(false)
    if (error) {
      toast.error(error.message || 'Save failed')
      return
    }
    toast.success('Profile updated')
    router.refresh()
  }

  async function saveOrg() {
    if (savingOrg || !isAdmin || !session.org?.id) return
    const trimmed = orgName.trim()
    if (!trimmed) {
      toast.error('Organization name cannot be empty')
      return
    }
    setSavingOrg(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('organizations')
      .update({ name: trimmed })
      .eq('id', session.org.id)
    setSavingOrg(false)
    if (error) {
      toast.error(error.message || 'Save failed')
      return
    }
    toast.success('Organization updated')
    router.refresh()
  }

  async function sendInvite() {
    if (!inviteEmail) return
    setInviting(true)
    try {
      const res = await fetch('/api/orgs/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      })
      if (res.ok) {
        setInviteEmail('')
        toast.success(`Invite sent to ${inviteEmail}`)
        router.refresh()
      } else {
        const err = await res.json()
        toast.error(err.error ?? 'Invite failed')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setInviting(false)
    }
  }

  async function updateRole(userId: string, role: UserRole) {
    if (!isAdmin) return
    const res = await fetch('/api/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role }),
    })
    if (res.ok) {
      toast.success('Role updated')
      router.refresh()
    } else {
      toast.error('Failed to update role')
    }
  }

  async function removeMember(userId: string) {
    if (!isAdmin || userId === session.id) return
    if (!confirm('Remove this member from the organization?')) return
    const res = await fetch(`/api/users?userId=${userId}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Member removed')
      router.refresh()
    } else {
      toast.error('Failed to remove member')
    }
  }

  return (
    <div>
      {/* Tab nav */}
      <div style={{
        display: 'flex', gap: 3, marginBottom: '1.5rem',
        background: 'var(--bg-surface)', padding: 3,
        borderRadius: 7, border: '1px solid var(--border-default)',
        width: 'fit-content',
      }}>
        {TABS.filter((t) => t !== 'Audit Log' || isAdmin).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '7px 16px', cursor: 'pointer',
              background: activeTab === tab ? 'var(--bg-elevated)' : 'transparent',
              color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-muted)',
              fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.06em',
              borderRadius: 5,
              border: activeTab === tab ? '1px solid var(--border-default)' : '1px solid transparent',
              transition: 'all 0.15s',
            }}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {activeTab === 'Profile' && (
        <div>
          <div style={sectionLabel}>
            User Profile
            <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
          </div>
          <div style={cardStyle}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>Full Name</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={inputStyle}
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input value={session.email} readOnly style={{ ...inputStyle, opacity: 0.6, cursor: 'not-allowed' }} />
              </div>
              <div>
                <label style={labelStyle}>Role</label>
                <div style={{
                  padding: '8px 12px', borderRadius: 6,
                  background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                  fontFamily: 'var(--font-mono)', fontSize: 12,
                  color: ROLE_COLORS[session.profile.role],
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                }}>
                  {session.profile.role}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Member Since</label>
                <div style={{ ...inputStyle, lineHeight: '20px', opacity: 0.7 }}>
                  {new Date(session.profile.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            </div>
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={saveProfile}
                disabled={savingProfile}
                style={{
                  padding: '8px 20px',
                  background: savingProfile ? 'var(--border-strong)' : 'var(--accent)',
                  border: 'none',
                  color: '#fff',
                  borderRadius: 6,
                  cursor: savingProfile ? 'not-allowed' : 'pointer',
                  fontSize: 12,
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {savingProfile ? 'Saving…' : 'Save Profile'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Organization tab */}
      {activeTab === 'Organization' && (
        <div>
          <div style={sectionLabel}>
            Organization Settings
            <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
          </div>
          <div style={cardStyle}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>Organization Name</label>
                <input
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  readOnly={!isAdmin}
                  style={{ ...inputStyle, opacity: isAdmin ? 1 : 0.6 }}
                />
              </div>
              <div>
                <label style={labelStyle}>Slug</label>
                <input defaultValue={session.org?.slug ?? ''} readOnly style={{ ...inputStyle, opacity: 0.6, cursor: 'not-allowed', fontFamily: 'var(--font-mono)', fontSize: 12 }} />
              </div>
              <div>
                <label style={labelStyle}>Plan</label>
                <div style={{
                  padding: '8px 12px', borderRadius: 6, background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)', fontFamily: 'var(--font-mono)',
                  fontSize: 11, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.08em',
                }}>
                  {session.org?.plan ?? 'free'}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Organization ID</label>
                <div style={{ ...inputStyle, fontFamily: 'var(--font-mono)', fontSize: 10, opacity: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: '20px' }}>
                  {session.org?.id ?? 'n/a'}
                </div>
              </div>
            </div>
            {isAdmin && (
              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={saveOrg}
                  disabled={savingOrg}
                  style={{
                    padding: '8px 20px',
                    background: savingOrg ? 'var(--border-strong)' : 'var(--accent)',
                    border: 'none',
                    color: '#fff',
                    borderRadius: 6,
                    cursor: savingOrg ? 'not-allowed' : 'pointer',
                    fontSize: 12,
                  }}
                >
                  {savingOrg ? 'Saving…' : 'Save Organization'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Members tab */}
      {activeTab === 'Members' && (
        <div>
          {isAdmin && (
            <>
              <div style={sectionLabel}>
                Invite Member
                <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
              </div>
              <div style={cardStyle}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Email Address</label>
                    <input
                      type="email"
                      placeholder="colleague@company.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendInvite()}
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ width: 140 }}>
                    <label style={labelStyle}>Role</label>
                    <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as UserRole)} style={inputStyle}>
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <button
                    onClick={sendInvite}
                    disabled={inviting || !inviteEmail}
                    style={{
                      padding: '8px 20px', background: inviting ? 'var(--border-strong)' : 'var(--accent)',
                      border: 'none', color: '#fff', borderRadius: 6,
                      cursor: inviting ? 'not-allowed' : 'pointer', fontSize: 12, whiteSpace: 'nowrap',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    {inviting ? 'Sendingâ€¦' : 'Send Invite'}
                  </button>
                </div>
              </div>
            </>
          )}

          <div style={sectionLabel}>
            Current Members ({members.length})
            <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
          </div>
          <div style={cardStyle}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  {['Member', 'Role', 'Joined', ...(isAdmin ? ['Actions'] : [])].map((h) => (
                    <th key={h} style={{
                      textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: 9,
                      color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em',
                      padding: '8px 12px', borderBottom: '1px solid var(--border-default)',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%',
                          background: 'var(--accent-glow)', border: '1px solid rgba(47,128,237,0.3)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent2)',
                          flexShrink: 0,
                        }}>
                          {m.full_name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) ?? '?'}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>
                            {m.full_name ?? 'Unknown'}
                          </div>
                          {m.id === session.id && (
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>you</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      {isAdmin && m.id !== session.id ? (
                        <select
                          value={m.role ?? 'viewer'}
                          onChange={(e) => updateRole(m.id!, e.target.value as UserRole)}
                          style={{ ...inputStyle, width: 'auto', padding: '4px 8px', fontSize: 11 }}
                        >
                          <option value="viewer">Viewer</option>
                          <option value="editor">Editor</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: 10,
                          color: ROLE_COLORS[m.role ?? 'viewer'],
                          textTransform: 'uppercase', letterSpacing: '0.08em',
                        }}>
                          {m.role ?? 'viewer'}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                      {m.created_at ? new Date(m.created_at).toLocaleDateString() : 'â€”'}
                    </td>
                    {isAdmin && (
                      <td style={{ padding: '10px 12px' }}>
                        {m.id !== session.id && (
                          <button
                            onClick={() => removeMember(m.id!)}
                            style={{
                              background: 'transparent', border: '1px solid rgba(229,62,62,0.3)',
                              color: 'var(--red)', padding: '3px 10px', borderRadius: 4,
                              fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-mono)',
                            }}
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {invites.length > 0 && isAdmin && (
            <>
              <div style={sectionLabel}>
                Pending Invites ({invites.length})
                <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
              </div>
              <div style={cardStyle}>
                {invites.map((inv) => (
                  <div key={inv.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div>
                      <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{inv.email}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                        {inv.role?.toUpperCase()} Â· Expires {inv.expires_at ? new Date(inv.expires_at).toLocaleDateString() : 'â€”'}
                      </div>
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--amber)', fontFamily: 'var(--font-mono)' }}>PENDING</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Audit Log tab â€” admin only */}
      {activeTab === 'Audit Log' && isAdmin && (
        <div>
          <div style={sectionLabel}>
            Audit Log â€” Last 50 Events
            <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
          </div>
          <div style={cardStyle}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  {['Action', 'Entity', 'User', 'Timestamp'].map((h) => (
                    <th key={h} style={{
                      textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: 9,
                      color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em',
                      padding: '8px 12px', borderBottom: '1px solid var(--border-default)',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '9px 12px' }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: 10,
                        color: log.action?.startsWith('asset') ? 'var(--accent2)' : 'var(--amber)',
                      }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: '9px 12px', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
                      {log.entity_type}
                    </td>
                    <td style={{ padding: '9px 12px', fontSize: 12, color: 'var(--text-secondary)' }}>
                      {(log.user as any)?.full_name ?? 'System'}
                    </td>
                    <td style={{ padding: '9px 12px', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
                      {log.created_at ? new Date(log.created_at).toLocaleString() : 'â€”'}
                    </td>
                  </tr>
                ))}
                {auditLogs.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                      No audit events recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Toasts are rendered by <Toaster /> in src/app/layout.tsx via sonner. */}
    </div>
  )
}
