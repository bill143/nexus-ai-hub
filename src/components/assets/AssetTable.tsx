'use client'

import { useState, useCallback, useRef } from 'react'
import type { Asset, AssetCategory, AssetStage, AssetPriority, SessionUser, Profile } from '@/types/database'

const CAT_BADGE: Record<string, { bg: string; color: string; border: string }> = {
  'RAG / Pipeline': { bg: 'rgba(15,184,114,0.1)', color: 'var(--green)', border: 'rgba(15,184,114,0.25)' },
  'MCP':           { bg: 'rgba(159,122,234,0.1)', color: 'var(--purple)', border: 'rgba(159,122,234,0.25)' },
  'LLM':           { bg: 'rgba(47,128,237,0.1)',  color: 'var(--accent2)', border: 'rgba(47,128,237,0.25)' },
  'Eval':          { bg: 'rgba(212,168,67,0.1)',  color: 'var(--gold)', border: 'rgba(212,168,67,0.25)' },
  'Agentic':       { bg: 'rgba(246,173,85,0.1)',  color: 'var(--amber)', border: 'rgba(246,173,85,0.25)' },
  'Utility':       { bg: 'rgba(122,143,166,0.1)', color: 'var(--text-secondary)', border: 'var(--border-default)' },
}

const PRI_COLOR: Record<string, string> = {
  HIGH: 'var(--green)',
  MED: 'var(--amber)',
  LOW: 'var(--text-muted)',
}

const STAGE_ORDER: Record<string, number> = { BACKLOG: 0, EVAL: 1, PILOT: 2, LIVE: 3 }
const STAGES = ['BACKLOG', 'EVAL', 'PILOT', 'LIVE'] as const
const CATEGORIES: AssetCategory[] = ['RAG / Pipeline', 'MCP', 'LLM', 'Agentic', 'Eval', 'Utility']
const PROJECTS = ['NEXUS_EST_APP', 'ON Bid Manager', 'ECHO', 'NEXUS Chat', 'NEXUS Voice Agent', 'NEXUS Meeting Notes', 'DocForge AI', "O'Neill Internal Tools"]

interface Props {
  initialAssets: Asset[]
  totalCount: number
  session: SessionUser
  members: Partial<Profile>[]
}

function StageDots({ stage }: { stage: AssetStage }) {
  const idx = STAGE_ORDER[stage] ?? 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      {STAGES.map((s, i) => {
        const isLive = s === 'LIVE' && i === idx
        const isDone = i <= idx
        return (
          <div key={s} style={{
            width: 6, height: 6, borderRadius: '50%',
            background: isLive ? 'var(--green)' : isDone ? 'var(--accent)' : 'var(--border-strong)',
            boxShadow: isLive ? '0 0 5px var(--green)' : 'none',
            transition: 'background 0.2s',
          }} title={s} />
        )
      })}
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 9,
        color: stage === 'LIVE' ? 'var(--green)' : 'var(--text-muted)',
        marginLeft: 6, letterSpacing: '0.06em',
      }}>
        {stage}
      </span>
    </div>
  )
}

export function AssetTable({ initialAssets, totalCount, session, members }: Props) {
  const [assets, setAssets] = useState<Asset[]>(initialAssets)
  const [filter, setFilter] = useState<string>('all')
  const [hiOnly, setHiOnly] = useState(false)
  const [search, setSearch] = useState('')
  const [openAsset, setOpenAsset] = useState<Asset | null>(null)
  const [saving, setSaving] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [editData, setEditData] = useState<Partial<Asset>>({})
  const searchRef = useRef<HTMLInputElement>(null)
  const canEdit = ['admin', 'editor'].includes(session.profile.role)

  const filtered = assets.filter((a) => {
    if (filter !== 'all' && a.category !== filter) return false
    if (hiOnly && a.priority !== 'HIGH') return false
    if (search) {
      const hay = `${a.name} ${a.category} ${a.fit} ${a.project} ${a.notes}`.toLowerCase()
      if (!hay.includes(search.toLowerCase())) return false
    }
    return true
  })

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2500)
  }

  function openSlideOver(asset: Asset) {
    setOpenAsset(asset)
    setEditData({
      project: asset.project ?? '',
      stage: asset.stage,
      owner_id: asset.owner_id ?? '',
      repo_url: asset.repo_url ?? '',
      training_docs: asset.training_docs ?? '',
      requirements: asset.requirements ?? '',
      notes: asset.notes ?? '',
      last_reviewed: asset.last_reviewed ?? '',
    })
  }

  async function saveAsset() {
    if (!openAsset || !canEdit) return
    setSaving(true)
    try {
      const res = await fetch(`/api/assets/${openAsset.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      })
      if (!res.ok) {
        const err = await res.json()
        showToast(err.error ?? 'Save failed', 'error')
        return
      }
      const updated: Asset = await res.json()
      setAssets((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
      setOpenAsset(updated)
      setSavedId(updated.id)
      showToast('Asset saved')
      setTimeout(() => setSavedId(null), 2200)
    } catch {
      showToast('Network error', 'error')
    } finally {
      setSaving(false)
    }
  }

  const fieldStyle: React.CSSProperties = {
    width: '100%', padding: '7px 10px', fontSize: 12,
    border: '1px solid var(--border-default)', borderRadius: 5,
    background: 'var(--bg-elevated)', color: 'var(--text-primary)',
    fontFamily: 'var(--font-sans)', outline: 'none',
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)', fontSize: 9,
    letterSpacing: '0.15em', textTransform: 'uppercase' as const,
    color: 'var(--text-muted)', marginBottom: 5, display: 'block',
  }

  return (
    <div>
      {/* Filter bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem', flexWrap: 'wrap' }}>
        <input
          ref={searchRef}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search assets..."
          style={{
            flex: 1, minWidth: 200, padding: '7px 12px',
            border: '1px solid var(--border-default)', borderRadius: 6,
            background: 'var(--bg-elevated)', color: 'var(--text-primary)',
            fontSize: 13, fontFamily: 'var(--font-sans)', outline: 'none',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-default)')}
        />

        {['all', ...CATEGORIES].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.06em',
              padding: '4px 12px', borderRadius: 4,
              border: `1px solid ${filter === cat ? 'rgba(47,128,237,0.4)' : 'var(--border-default)'}`,
              background: filter === cat ? 'var(--accent-glow)' : 'transparent',
              color: filter === cat ? 'var(--accent2)' : 'var(--text-muted)',
              cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
            }}
          >
            {cat === 'all' ? 'All' : cat.replace(' / Pipeline', '')}
          </button>
        ))}

        <button
          onClick={() => setHiOnly(!hiOnly)}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, padding: '4px 12px',
            borderRadius: 4, cursor: 'pointer', whiteSpace: 'nowrap',
            border: `1px solid ${hiOnly ? 'rgba(15,184,114,0.5)' : 'rgba(15,184,114,0.3)'}`,
            background: hiOnly ? 'rgba(15,184,114,0.12)' : 'transparent',
            color: 'var(--green)', transition: 'all 0.15s',
          }}
        >
          ● High Priority
        </button>

        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>
          {filtered.length} / {totalCount} assets
        </span>
      </div>

      {/* Table */}
      <div style={{ border: '1px solid var(--border-default)', borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
          <thead style={{ background: 'var(--bg-elevated)', position: 'sticky', top: 0, zIndex: 2 }}>
            <tr>
              {['Asset', 'Category', 'Priority', 'Stage', 'Project', 'Construction Fit'].map((h) => (
                <th key={h} style={{
                  textAlign: 'left', fontFamily: 'var(--font-mono)',
                  fontSize: 9, color: 'var(--text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.12em',
                  padding: '10px 12px', borderBottom: '1px solid var(--border-default)',
                  whiteSpace: 'nowrap',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div style={{ fontFamily: 'var(--font-bebas)', fontSize: 20, letterSpacing: '0.1em', marginBottom: 8 }}>
                    No Assets Found
                  </div>
                  <div style={{ fontSize: 12 }}>No assets match your current filters.</div>
                  <button
                    onClick={() => { setFilter('all'); setHiOnly(false); setSearch('') }}
                    style={{
                      marginTop: 16, padding: '7px 16px',
                      border: '1px solid var(--border-default)', borderRadius: 5,
                      background: 'transparent', color: 'var(--text-secondary)',
                      fontSize: 12, cursor: 'pointer',
                    }}
                  >
                    Clear filters
                  </button>
                </td>
              </tr>
            ) : (
              filtered.map((a, i) => {
                const catStyle = CAT_BADGE[a.category] ?? CAT_BADGE['Utility']
                return (
                  <tr
                    key={a.id}
                    onClick={() => openSlideOver(a)}
                    style={{
                      cursor: 'pointer',
                      animation: `rowIn 0.3s ease ${Math.min(i * 15, 300)}ms both`,
                      background: openAsset?.id === a.id ? 'rgba(47,128,237,0.06)' : 'transparent',
                    }}
                    onMouseEnter={(e) => { if (openAsset?.id !== a.id) e.currentTarget.style.background = 'var(--bg-hover)' }}
                    onMouseLeave={(e) => { if (openAsset?.id !== a.id) e.currentTarget.style.background = 'transparent' }}
                  >
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--text-primary)', fontWeight: 500 }}>
                        {a.name}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
                      <span style={{
                        display: 'inline-block', fontSize: 9, padding: '2px 8px',
                        borderRadius: 3, fontFamily: 'var(--font-mono)', fontWeight: 500,
                        letterSpacing: '0.06em', whiteSpace: 'nowrap',
                        background: catStyle.bg, color: catStyle.color, border: `1px solid ${catStyle.border}`,
                      }}>
                        {a.category.replace(' / Pipeline', '')}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: 4, height: 4, borderRadius: '50%', background: PRI_COLOR[a.priority], flexShrink: 0 }} />
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: PRI_COLOR[a.priority], fontWeight: 500 }}>
                          {a.priority}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
                      <StageDots stage={a.stage} />
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-subtle)', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
                      {a.project ?? '—'}
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-subtle)', fontSize: 11.5, color: 'var(--text-secondary)', maxWidth: 260, lineHeight: 1.4 }}>
                      {a.fit}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Slide-over backdrop */}
      {openAsset && (
        <div
          onClick={() => setOpenAsset(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            background: 'rgba(7,10,18,0.6)',
            animation: 'fadeIn 0.2s ease',
          }}
        />
      )}

      {/* Slide-over panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0,
        width: 480, maxWidth: '100vw', height: '100vh',
        zIndex: 51, background: 'var(--bg-surface)',
        borderLeft: '1px solid var(--border-default)',
        display: 'flex', flexDirection: 'column',
        transform: openAsset ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
        overflow: 'hidden',
      }}>
        {openAsset && (
          <>
            {/* Header */}
            <div style={{
              padding: '1.25rem 1.5rem', background: 'var(--bg-elevated)',
              borderBottom: '1px solid var(--border-default)',
              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
              flexShrink: 0,
            }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                  {openAsset.name}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {(() => {
                    const cs = CAT_BADGE[openAsset.category] ?? CAT_BADGE['Utility']
                    return (
                      <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 3, fontFamily: 'var(--font-mono)', background: cs.bg, color: cs.color, border: `1px solid ${cs.border}` }}>
                        {openAsset.category}
                      </span>
                    )
                  })()}
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: PRI_COLOR[openAsset.priority] }}>
                    {openAsset.priority} priority
                  </span>
                </div>
              </div>
              <button onClick={() => setOpenAsset(null)} style={{
                background: 'transparent', border: '1px solid var(--border-default)',
                color: 'var(--text-muted)', cursor: 'pointer',
                width: 28, height: 28, borderRadius: 5,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, flexShrink: 0, marginLeft: 12,
              }}>✕</button>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: '1.25rem' }}>
                <div>
                  <label style={labelStyle}>Project</label>
                  <select
                    value={editData.project ?? ''}
                    onChange={(e) => setEditData((p) => ({ ...p, project: e.target.value }))}
                    disabled={!canEdit}
                    style={fieldStyle}
                  >
                    <option value="">— Unassigned —</option>
                    {PROJECTS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Stage</label>
                  <select
                    value={editData.stage ?? openAsset.stage}
                    onChange={(e) => setEditData((p) => ({ ...p, stage: e.target.value as AssetStage }))}
                    disabled={!canEdit}
                    style={fieldStyle}
                  >
                    {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Owner</label>
                  <select
                    value={editData.owner_id ?? ''}
                    onChange={(e) => setEditData((p) => ({ ...p, owner_id: e.target.value || null }))}
                    disabled={!canEdit}
                    style={fieldStyle}
                  >
                    <option value="">— Unassigned —</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>{m.full_name ?? m.id}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Last Reviewed</label>
                  <input
                    type="date"
                    value={editData.last_reviewed ?? ''}
                    onChange={(e) => setEditData((p) => ({ ...p, last_reviewed: e.target.value }))}
                    disabled={!canEdit}
                    style={fieldStyle}
                  />
                </div>
              </div>

              {[
                { label: 'Construction Fit', key: 'fit', readOnly: true, value: openAsset.fit ?? '' },
                { label: 'Repo / Source URL', key: 'repo_url', readOnly: false, value: editData.repo_url ?? '' },
                { label: 'Team Training Required', key: 'training_docs', readOnly: false, value: editData.training_docs ?? '' },
                { label: 'Infrastructure Requirements', key: 'requirements', readOnly: false, value: editData.requirements ?? '' },
                { label: 'Notes / Status', key: 'notes', readOnly: false, value: editData.notes ?? '' },
              ].map(({ label, key, readOnly, value }) => (
                <div key={key} style={{ marginTop: '1.25rem' }}>
                  <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {label}
                    <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
                  </label>
                  {readOnly ? (
                    <div style={{ ...fieldStyle, minHeight: 44, lineHeight: 1.55 }}>{value}</div>
                  ) : key === 'repo_url' ? (
                    <input
                      type="text"
                      placeholder="https://github.com/..."
                      value={value}
                      onChange={(e) => setEditData((p) => ({ ...p, [key]: e.target.value }))}
                      disabled={!canEdit}
                      style={fieldStyle}
                    />
                  ) : (
                    <textarea
                      value={value}
                      onChange={(e) => setEditData((p) => ({ ...p, [key]: e.target.value }))}
                      disabled={!canEdit}
                      placeholder={`Enter ${label.toLowerCase()}...`}
                      style={{ ...fieldStyle, minHeight: 68, resize: 'vertical', lineHeight: 1.5 }}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{
              padding: '1rem 1.5rem', background: 'var(--bg-elevated)',
              borderTop: '1px solid var(--border-default)',
              display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0,
            }}>
              <span style={{ fontSize: 11, color: 'var(--green)', marginRight: 'auto', opacity: savedId === openAsset.id ? 1 : 0, transition: 'opacity 0.2s' }}>
                ✓ Saved
              </span>
              <button onClick={() => setOpenAsset(null)} style={{
                fontSize: 12, padding: '7px 14px', borderRadius: 5,
                border: '1px solid var(--border-default)', background: 'transparent',
                color: 'var(--text-secondary)', cursor: 'pointer',
              }}>
                Cancel
              </button>
              {canEdit && (
                <button
                  onClick={saveAsset}
                  disabled={saving}
                  style={{
                    fontSize: 12, padding: '7px 14px', borderRadius: 5,
                    background: saving ? 'var(--border-strong)' : 'var(--accent)',
                    border: 'none', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  {saving ? 'Saving…' : 'Save Asset'}
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 200,
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
          borderRadius: 6, padding: '10px 14px',
          fontSize: 12, color: 'var(--text-primary)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          animation: 'toastIn 0.25s cubic-bezier(0.4,0,0.2,1)',
          minWidth: 220,
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: toast.type === 'success' ? 'var(--green)' : 'var(--red)',
            boxShadow: `0 0 6px ${toast.type === 'success' ? 'var(--green)' : 'var(--red)'}`,
            flexShrink: 0,
          }} />
          {toast.msg}
        </div>
      )}
    </div>
  )
}
