'use client'

import { useState } from 'react'
import {
  ChevronDown,
  Eye,
  Mic2,
  Cpu,
  Users,
  Brain,
  MousePointer2,
  Clock,
  HardHat,
  type LucideIcon,
} from 'lucide-react'

type RoadmapStatus = 'DEPLOYED' | 'INSTALLED' | 'STAGED' | 'ACTIVE'

interface Card {
  title: string
  status: RoadmapStatus
  component: string
  path: string
  description: string
  Icon: LucideIcon
}

const CARDS: Card[] = [
  {
    title: 'Face Recognition',
    status: 'INSTALLED',
    component: 'insightface + onnxruntime',
    path: 'Repository: jarvis-core/vision_identity',
    description: 'Recognize Bill, coworkers, family. Auto-greet on entry.',
    Icon: Eye,
  },
  {
    title: 'Voice Wake-Word + Conversation',
    status: 'STAGED',
    component: 'Pipecat framework',
    path: 'Framework: Pipecat (staged integration)',
    description:
      'Hotword detection, two-way conversation with ElevenLabs voice ID, Groq Whisper STT.',
    Icon: Mic2,
  },
  {
    title: 'Multi-LLM Routing',
    status: 'DEPLOYED',
    component: 'ECHO LiteLLM proxy',
    path: 'Service: echo-litellm.up.railway.app',
    description: 'Claude, Gemini, GPT, DeepSeek, Kimi, Grok — unified with cost tracking.',
    Icon: Cpu,
  },
  {
    title: '300-Agent Orchestration',
    status: 'STAGED',
    component: 'Archon Orchestrator',
    path: 'Repository: archon-orchestrator',
    description: 'Agent fleet management UI with governance, compliance, cost mgmt.',
    Icon: Users,
  },
  {
    title: 'Persistent Memory + RAG',
    status: 'STAGED',
    component: 'RAG-Anything (HKUDS multimodal)',
    path: 'Framework: RAG-Anything (HKUDS multimodal)',
    description: 'Text, image, PDF, and audio recall across the platform.',
    Icon: Brain,
  },
  {
    title: 'Browser Automation',
    status: 'INSTALLED',
    component: 'Playwright MCP (Microsoft)',
    path: 'Framework: Playwright MCP (Microsoft)',
    description: 'Deterministic computer-use for turnkey tasks.',
    Icon: MousePointer2,
  },
  {
    title: 'Scheduled Task Runner',
    status: 'STAGED',
    component: 'ai-task-project-automation',
    path: 'Repository: ai-task-automation',
    description: 'morning_briefing · inbox_triage · backup · security_audit.',
    Icon: Clock,
  },
  {
    title: 'Construction Domain Skills',
    status: 'ACTIVE',
    component: 'NEXUS_EST_APP + OpenConstructionERP',
    path: 'Services: nexus-est-app.vercel.app + openconstruction-erp',
    description: 'Estimating, takeoff, BOQ, federal procurement workflows.',
    Icon: HardHat,
  },
]

const STATUS_STYLE: Record<RoadmapStatus, { color: string; bg: string; border: string }> = {
  DEPLOYED: {
    color: '#0FB872',
    bg: 'rgba(15, 184, 114, 0.12)',
    border: 'rgba(15, 184, 114, 0.35)',
  },
  ACTIVE: {
    color: '#0FB872',
    bg: 'rgba(15, 184, 114, 0.12)',
    border: 'rgba(15, 184, 114, 0.35)',
  },
  INSTALLED: {
    color: '#56CFE1',
    bg: 'rgba(86, 207, 225, 0.12)',
    border: 'rgba(86, 207, 225, 0.35)',
  },
  STAGED: {
    color: '#F6AD55',
    bg: 'rgba(246, 173, 85, 0.12)',
    border: 'rgba(246, 173, 85, 0.35)',
  },
}

export function RoadmapPanel() {
  const [open, setOpen] = useState(false)
  return (
    <section className="px-6 md:px-8 pb-8">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between rounded-lg transition-colors"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          padding: '14px 18px',
        }}
      >
        <div className="flex items-center gap-3">
          <span
            className="font-display tracking-[0.10em]"
            style={{ fontSize: 14, color: 'var(--text-primary)' }}
          >
            Phase 2 Roadmap
          </span>
          <span
            className="font-mono uppercase tracking-[0.16em]"
            style={{ fontSize: 10, color: 'var(--text-muted)' }}
          >
            · Next Sprint · 8 capabilities
          </span>
        </div>
        <ChevronDown
          size={16}
          strokeWidth={1.5}
          style={{
            color: 'var(--text-secondary)',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.18s ease',
          }}
        />
      </button>

      {open ? (
        <ul className="grid gap-3 mt-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
          {CARDS.map((c) => {
            const style = STATUS_STYLE[c.status]
            const { Icon } = c
            return (
              <li
                key={c.title}
                className="rounded-lg p-4 flex gap-3"
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                }}
              >
                <div
                  className="flex items-center justify-center rounded-md flex-shrink-0"
                  style={{
                    width: 36,
                    height: 36,
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    color: style.color,
                  }}
                >
                  <Icon size={18} strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3
                      className="text-sm font-medium leading-tight"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {c.title}
                    </h3>
                    <span
                      className="font-mono uppercase tracking-[0.14em] rounded"
                      style={{
                        fontSize: 9,
                        padding: '2px 6px',
                        color: style.color,
                        background: style.bg,
                        border: `1px solid ${style.border}`,
                        flexShrink: 0,
                      }}
                    >
                      {c.status}
                    </span>
                  </div>
                  <p
                    className="leading-snug mb-2"
                    style={{ fontSize: 12, color: 'var(--text-secondary)' }}
                  >
                    {c.description}
                  </p>
                  <div
                    className="font-mono"
                    style={{ fontSize: 10, color: 'var(--text-muted)' }}
                  >
                    {c.component}
                  </div>
                  <div
                    className="font-mono mt-0.5 truncate"
                    style={{ fontSize: 10, color: 'var(--text-muted)' }}
                    title={c.path}
                  >
                    {c.path}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      ) : null}
    </section>
  )
}
