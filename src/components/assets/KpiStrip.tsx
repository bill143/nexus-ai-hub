'use client'

import { useEffect, useRef } from 'react'

interface Kpis {
  total: number
  high: number
  live: number
  unassigned: number
}

function AnimatedNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const el = ref.current
    const dur = 600
    const step = 16
    const inc = value / (dur / step)
    let cur = 0
    const timer = setInterval(() => {
      cur += inc
      if (cur >= value) {
        el.textContent = String(value)
        clearInterval(timer)
      } else {
        el.textContent = String(Math.round(cur))
      }
    }, step)
    return () => clearInterval(timer)
  }, [value])

  return <span ref={ref}>0</span>
}

interface KpiCardProps {
  label: string
  value: number
  delta: string
  accent: string
}

function KpiCard({ label, value, delta, accent }: KpiCardProps) {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-default)',
      borderRadius: 8,
      padding: '1rem 1.125rem',
      position: 'relative',
      overflow: 'hidden',
      transition: 'border-color 0.2s',
    }}>
      {/* Top accent line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        background: `linear-gradient(90deg, ${accent}, transparent)`,
      }} />

      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 9,
        letterSpacing: '0.18em', textTransform: 'uppercase',
        color: 'var(--text-muted)', marginBottom: 8,
      }}>
        {label}
      </div>

      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 600,
        lineHeight: 1, color: accent, fontVariantNumeric: 'tabular-nums',
      }}>
        <AnimatedNumber value={value} />
      </div>

      <div style={{
        fontSize: 11, color: 'var(--text-muted)',
        marginTop: 4, fontFamily: 'var(--font-mono)',
      }}>
        {delta}
      </div>
    </div>
  )
}

export function KpiStrip({ kpis }: { kpis: Kpis }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
      gap: 10,
    }}>
      <KpiCard label="Total Assets" value={kpis.total} delta="catalogued" accent="var(--accent2)" />
      <KpiCard label="High Priority" value={kpis.high} delta="immediate action" accent="var(--green)" />
      <KpiCard label="Live / Pilot" value={kpis.live} delta="deployed" accent="var(--gold)" />
      <KpiCard label="Unassigned" value={kpis.unassigned} delta="need project" accent="var(--red)" />
    </div>
  )
}
