import {
  Network,
  Calculator,
  Bot,
  Briefcase,
  MessageSquare,
  Cpu,
  TrendingUp,
  FileSearch,
  ExternalLink,
  type LucideIcon,
} from 'lucide-react'

type TileStatus = 'LIVE' | 'IN DEV' | 'PHASE 3'

interface Tile {
  name: string
  status: TileStatus
  url: string | null
  description: string
  Icon: LucideIcon
  tooltip?: string
}

const TILES: Tile[] = [
  {
    name: 'GitNexus',
    status: 'LIVE',
    url: 'https://git.nexus-elite.net',
    description: 'Visualize your code architecture as a graph',
    Icon: Network,
  },
  {
    name: 'NEXUS Estimating',
    status: 'LIVE',
    url: 'https://nexus-est-app.vercel.app',
    description: 'Federal construction estimating platform',
    Icon: Calculator,
  },
  {
    name: 'AI Fleet Control',
    status: 'IN DEV',
    url: null,
    description: 'Multi-agent orchestration with Elo leaderboard',
    Icon: Bot,
    tooltip: 'Coming in Phase 2',
  },
  {
    name: 'ON Bid Manager',
    status: 'IN DEV',
    url: null,
    description: 'Federal solicitation pipeline + bid intelligence',
    Icon: Briefcase,
    tooltip: 'Coming in Phase 2',
  },
  {
    name: 'NEXUS Chat',
    status: 'IN DEV',
    url: null,
    description: 'AI-native zero-knowledge messaging',
    Icon: MessageSquare,
    tooltip: 'Coming in Phase 2',
  },
  {
    name: 'ECHO Runtime',
    status: 'IN DEV',
    url: null,
    description: 'Four-tier LLM cognitive routing engine',
    Icon: Cpu,
    tooltip: 'Coming in Phase 2',
  },
  {
    name: 'Trading Console',
    status: 'IN DEV',
    url: null,
    description: 'ORB strategy automation + risk monitoring',
    Icon: TrendingUp,
    tooltip: 'Coming in Phase 2',
  },
  {
    name: 'Documents',
    status: 'PHASE 3',
    url: null,
    description: 'Unified OneDrive + Drive search via Jarvis',
    Icon: FileSearch,
    tooltip: 'Planned for Phase 3 (document intelligence)',
  },
]

const STATUS_STYLE: Record<TileStatus, { color: string; bg: string; border: string }> = {
  LIVE: {
    color: '#0FB872',
    bg: 'rgba(15, 184, 114, 0.10)',
    border: 'rgba(15, 184, 114, 0.30)',
  },
  'IN DEV': {
    color: '#F6AD55',
    bg: 'rgba(246, 173, 85, 0.10)',
    border: 'rgba(246, 173, 85, 0.30)',
  },
  'PHASE 3': {
    color: '#7A8FA6',
    bg: 'rgba(122, 143, 166, 0.10)',
    border: 'rgba(122, 143, 166, 0.30)',
  },
}

export function TileGrid() {
  return (
    <div className="p-6 md:p-8">
      <header className="mb-6">
        <h1
          className="font-display tracking-[0.08em] text-3xl"
          style={{ color: 'var(--text-primary)' }}
        >
          NEXUS <span style={{ color: 'var(--accent2)' }}>HUB</span>
        </h1>
        <p
          className="font-mono uppercase mt-1"
          style={{
            fontSize: 10,
            letterSpacing: '0.18em',
            color: 'var(--text-muted)',
          }}
        >
          Command Surface · 8 Modules · 2 Live
        </p>
      </header>

      <ul className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {TILES.map((tile) => {
          const isLive = tile.status === 'LIVE'
          const style = STATUS_STYLE[tile.status]
          return (
            <li key={tile.name}>
              <Tile tile={tile} statusStyle={style} isLive={isLive} />
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function Tile({
  tile,
  statusStyle,
  isLive,
}: {
  tile: Tile
  statusStyle: { color: string; bg: string; border: string }
  isLive: boolean
}) {
  const { Icon } = tile

  return (
    <article
      className="group relative flex flex-col rounded-lg overflow-hidden transition-all"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        minHeight: 200,
      }}
    >
      {/* Subtle accent at top, brighter for LIVE */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background: isLive
            ? 'linear-gradient(90deg, transparent, var(--green), transparent)'
            : 'linear-gradient(90deg, transparent, var(--border-strong), transparent)',
          opacity: isLive ? 0.8 : 0.4,
        }}
      />

      <div className="flex-1 p-5">
        <div className="flex items-start justify-between mb-3">
          <div
            className="flex items-center justify-center rounded-md"
            style={{
              width: 36,
              height: 36,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              color: isLive ? 'var(--accent2)' : 'var(--text-secondary)',
            }}
          >
            <Icon size={18} strokeWidth={1.5} />
          </div>
          <span
            className="font-mono uppercase tracking-[0.14em] rounded"
            style={{
              fontSize: 9,
              padding: '3px 7px',
              color: statusStyle.color,
              background: statusStyle.bg,
              border: `1px solid ${statusStyle.border}`,
            }}
          >
            {tile.status}
          </span>
        </div>

        <h2
          className="text-base font-medium leading-tight mb-1.5"
          style={{ color: 'var(--text-primary)' }}
        >
          {tile.name}
        </h2>
        <p
          className="leading-snug"
          style={{ fontSize: 12, color: 'var(--text-secondary)' }}
        >
          {tile.description}
        </p>
      </div>

      <div
        className="px-5 py-3 flex items-center justify-between"
        style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-base)' }}
      >
        {isLive && tile.url ? (
          <a
            href={tile.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono uppercase tracking-[0.14em] inline-flex items-center gap-1.5 rounded transition-colors"
            style={{
              fontSize: 10,
              color: 'var(--accent2)',
              padding: '5px 10px',
              border: '1px solid rgba(86,207,225,0.30)',
              background: 'rgba(47,128,237,0.06)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(47,128,237,0.14)'
              e.currentTarget.style.borderColor = 'rgba(86,207,225,0.55)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(47,128,237,0.06)'
              e.currentTarget.style.borderColor = 'rgba(86,207,225,0.30)'
            }}
          >
            Open
            <ExternalLink size={11} strokeWidth={2} />
          </a>
        ) : (
          <button
            type="button"
            disabled
            title={tile.tooltip}
            aria-disabled
            className="font-mono uppercase tracking-[0.14em] rounded cursor-not-allowed"
            style={{
              fontSize: 10,
              padding: '5px 10px',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-subtle)',
              background: 'transparent',
            }}
          >
            {tile.status === 'PHASE 3' ? 'Phase 3' : 'Locked'}
          </button>
        )}

        <span
          className="font-mono uppercase"
          style={{
            fontSize: 9,
            letterSpacing: '0.18em',
            color: 'var(--text-muted)',
          }}
        >
          /{tile.name.toLowerCase().replace(/\s+/g, '-')}
        </span>
      </div>
    </article>
  )
}
