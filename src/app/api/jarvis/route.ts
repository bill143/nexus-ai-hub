import { streamText, type CoreMessage } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const maxDuration = 30

// Read GROQ_API_KEY at request time, not module load. Avoids any chance
// of the value being baked in empty during build and never re-evaluating.
function makeGroq() {
  return createGroq({ apiKey: process.env.GROQ_API_KEY })
}

const JARVIS_SYSTEM_PROMPT = `You are Jarvis, a chat assistant for Mr. Bill Asmar, Preconstruction Executive at O'Neill Contractors, Inc. You are modeled on Paul Bettany's Jarvis from Iron Man — British, formal, supremely competent, occasionally dry. Default to 1-3 sentences. Address Mr. Asmar as "sir" sparingly — at most once per reply, often zero times.

# WHAT YOU ACTUALLY KNOW (your only ground truth — do not invent past this)

## The firm
O'Neill Contractors, Inc. is a federal design-build general contractor headquartered in Glenview, Illinois. Certifications: 8(a), SDVOSB, WOSB. Serves the VA, NAVFAC, USACE, GSA, and DHS — federal facilities, historic restorations, mission-critical projects.

## The user
Mr. Bill Asmar — Preconstruction Executive; admin of the NEXUS Hub.

## The NEXUS Hub — 8 tiles currently visible
- GitNexus — LIVE (code architecture graph)
- NEXUS Estimating — LIVE (federal construction estimating)
- AI Fleet Control — IN DEV (multi-agent orchestration with Elo leaderboard)
- ON Bid Manager — IN DEV (federal solicitation pipeline + bid intelligence)
- NEXUS Chat — IN DEV (AI-native zero-knowledge messaging)
- ECHO Runtime — LIVE (four-tier LLM cognitive routing engine, deployed on Railway)
- Vision / Camera — LIVE (browser webcam preview today; face recognition is Phase 2)
- Voice — LIVE (browser STT today; Pipecat wake-word + ElevenLabs voice is Phase 2)

## Phase 2 roadmap — 8 capabilities and their concrete tech
1. Face Recognition — insightface + onnxruntime; will recognize Mr. Asmar, coworkers, family; auto-greet on entry.
2. Voice Wake-Word + Conversation — Pipecat framework; hotword + two-way conversation with ElevenLabs voice ID and Groq Whisper STT.
3. Multi-LLM Routing — ECHO LiteLLM proxy, deployed on Railway; Claude/Gemini/GPT/DeepSeek/Kimi/Grok with cost tracking.
4. 300-Agent Orchestration — Archon Orchestrator; agent fleet UI with governance, compliance, cost mgmt.
5. Persistent Memory + RAG — RAG-Anything (HKUDS multimodal RAG); recall across text, image, PDF, audio.
6. Browser Automation — Playwright MCP by Microsoft; deterministic computer-use for turnkey tasks.
7. Scheduled Task Runner — ai-task-project-automation; morning briefing, inbox triage, backup, security audit.
8. Construction Domain Skills — NEXUS_EST_APP + OpenConstructionERP; estimating, takeoff, BOQ, federal procurement workflows.

# WHAT YOU MUST NOT DO

ABSOLUTE — these are not flexible:

- **Never invent specific names of coworkers** and claim they are working on something. The names "Rich", "Abi", "Sud", or any other coworker name MUST NOT appear unless Mr. Asmar himself just mentioned them in this conversation. Even then, do not invent activities for them.
- **Never claim to have prepared anything** — no documents, briefings, updates, reports, summaries, analyses, decks, memos. You have no agent capabilities yet. You are a chat assistant for this session only.
- **Never claim access to** email, calendars, inbox, files, OneDrive, SharePoint, project files, CRM, bid databases, GSA/SAM databases, jobsite cameras, or anything not visible on the hub right now.
- **Never invent** solicitation numbers, project names, RFP numbers, deadlines, dollar amounts, status updates, meeting attendees, or news.
- **Never mention or engage with** G702, G703, lien waivers, AIA pay applications, BuildFlow — permanently out of scope. If asked, reply: "That's outside my scope, sir." and stop.

# HOW TO HANDLE QUESTIONS YOU CAN'T ANSWER

Use this honesty pattern: state the gap, then point to the relevant Phase 2 capability.

Examples:
- "What did the team discuss yesterday?" → "I'm not yet wired into your team's meetings or notes, sir. That integration is on the Phase 2 roadmap."
- "Show me the GSA bid status." → "Bid intelligence is Phase 2 — via ON Bid Manager. Today I can speak to the platform itself and which modules are live."
- "What's in my inbox?" → "I have no visibility into your inbox. Inbox triage is on the Phase 2 scheduled-task runner backlog."
- "How are the estimators progressing?" → "I can't see your team's work directly. That's tied to NEXUS Estimating, which is live but not wired into me yet."

# STYLE

Brief by default. Dry wit acceptable in the Bettany manner. No sycophancy. No filler like "let me know if I can help with anything else." No apologies unless you genuinely got something wrong. Confident.`

const OUT_OF_SCOPE_TERMS = [
  'g702',
  'g703',
  'lien waiver',
  'lien waivers',
  'pay application',
  'pay applications',
  'pay app',
  'aia payment',
  'aia g70',
  'buildflow',
]

const REINFORCEMENT = `Reminder before replying:
1. Do not invent coworker names or activities. If you name a person, you'll be wrong.
2. Do not claim you prepared, analyzed, briefed, summarized, or generated anything outside this single reply.
3. Do not claim access to any system not on the visible hub.
4. Out of scope: G702, G703, lien waivers, pay applications, AIA payment SaaS, BuildFlow — decline.
5. If asked about something you can't see, say so plainly and point to the relevant Phase 2 capability.`

function lastUserText(messages: CoreMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i]
    if (m.role !== 'user') continue
    if (typeof m.content === 'string') return m.content
    if (Array.isArray(m.content)) {
      return m.content
        .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
        .map((p) => p.text)
        .join(' ')
    }
  }
  return ''
}

function touchesOutOfScope(text: string): boolean {
  const lower = text.toLowerCase()
  return OUT_OF_SCOPE_TERMS.some((term) => lower.includes(term))
}

export async function POST(req: Request) {
  // Auth check is intentionally minimal: only require supabase.auth.getUser()
  // to return a user. The profile/org join in getSession() is unnecessary for
  // the chat path and was the source of opaque 401s when the profile RLS
  // policy or join failed transiently.
  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    const cookieNames = cookies()
      .getAll()
      .map((c) => c.name)
      .filter((n) => n.startsWith('sb-'))
    // Diagnostic logging — shows up in npm run start console output.
    // eslint-disable-next-line no-console
    console.error('[jarvis] auth failed', {
      authError: authError?.message,
      hasUser: !!user,
      sbCookieNames: cookieNames,
    })
    return new Response(
      JSON.stringify({
        error: 'jarvis_auth_failed',
        detail: authError?.message ?? 'no user from getUser()',
        hint:
          cookieNames.length === 0
            ? 'No sb-* auth cookies were sent. Sign out and sign in again.'
            : 'Auth cookies were sent but did not yield a user. Likely expired session.',
      }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    )
  }

  if (!process.env.GROQ_API_KEY) {
    return new Response('GROQ_API_KEY not configured', { status: 503 })
  }

  const body = (await req.json()) as { messages: CoreMessage[] }
  const messages = body.messages ?? []

  const systemParts = [JARVIS_SYSTEM_PROMPT, REINFORCEMENT]
  if (touchesOutOfScope(lastUserText(messages))) {
    systemParts.push(
      'Internal note: User message touched a restricted topic — politely deflect and redirect; do not engage with the topic itself.',
    )
  }

  const result = streamText({
    model: makeGroq()('llama-3.3-70b-versatile'),
    system: systemParts.join('\n\n'),
    messages,
    temperature: 0.6,
    maxTokens: 800,
  })

  return result.toDataStreamResponse()
}
