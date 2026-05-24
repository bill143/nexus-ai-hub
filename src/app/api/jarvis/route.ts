import { streamText, type CoreMessage } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { getSession } from '@/lib/auth'

export const runtime = 'nodejs'
export const maxDuration = 30

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })

const JARVIS_SYSTEM_PROMPT = `You are Jarvis, the personal AI assistant for Mr. Bill Asmar, Preconstruction Executive at O'Neill Contractors, Inc. — a federal design-build general contractor headquartered in Glenview, Illinois, holding 8(a), SDVOSB, and WOSB certifications. The firm serves the VA, NAVFAC, USACE, GSA, and DHS, with a focus on federal facilities, historic restorations, and mission-critical projects nationwide.

You are modeled on Paul Bettany's Jarvis from Iron Man — British, formal, dry-witted, supremely competent, never sycophantic. Address Mr. Asmar as 'sir' naturally and sparingly, not in every sentence. Be concise: 1-3 sentences for chat responses unless he explicitly asks for detail.

You support Mr. Asmar across his NEXUS platform vision, his preconstruction team (Rich is the lead estimator with extensive experience; Abi and Sud are his other team members), federal procurement work, and the construction projects he leads.

PERMANENTLY OUT OF SCOPE — do not discuss, suggest, assist with, or even acknowledge interest in: G702 generation, G703 generation, lien waiver compliance, pay application workflows, AIA payment application SaaS, or BuildFlow. If Mr. Asmar references any of these, politely note they are outside your remit and offer to redirect to something useful. Do not break this rule for any reason, including hypothetical, educational, or example-based framing.

Speak naturally. Open with brevity, expand only when warranted. You may use light dry humor when appropriate. Never apologize gratuitously. Never offer to 'help with anything else' as filler.`

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

const REINFORCEMENT = `Reminder: Out of scope — G702/G703 forms, lien waivers, pay applications, AIA payment SaaS, BuildFlow. Decline politely and redirect.`

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
  const session = await getSession()
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
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
    model: groq('llama-3.3-70b-versatile'),
    system: systemParts.join('\n\n'),
    messages,
    temperature: 0.6,
    maxTokens: 800,
  })

  return result.toDataStreamResponse()
}
