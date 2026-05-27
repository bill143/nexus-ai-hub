'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Mic, MicOff } from 'lucide-react'

type RecState = 'idle' | 'listening' | 'denied' | 'unsupported' | 'error'

// Minimal typing for SpeechRecognition — the Web Speech API isn't in lib.dom.d.ts.
interface SR extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((this: SR, ev: SRResultEvent) => void) | null
  onerror: ((this: SR, ev: SRErrorEvent) => void) | null
  onend: ((this: SR, ev: Event) => void) | null
}
interface SRResult {
  isFinal: boolean
  0: { transcript: string; confidence: number }
}
interface SRResultEvent extends Event {
  resultIndex: number
  results: ArrayLike<SRResult>
}
interface SRErrorEvent extends Event {
  error: string
  message?: string
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SR
    webkitSpeechRecognition?: new () => SR
  }
}

export const JARVIS_VOICE_EVENT = 'jarvis:voice-utterance'

export function VoiceTile() {
  const [state, setState] = useState<RecState>('idle')
  const [interim, setInterim] = useState('')
  const [finalText, setFinalText] = useState('')
  const recRef = useRef<SR | null>(null)
  const supportedRef = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Ctor) {
      setState('unsupported')
      return
    }
    supportedRef.current = true
    const rec = new Ctor()
    rec.continuous = false
    rec.interimResults = true
    rec.lang = 'en-US'
    rec.onresult = (ev) => {
      let pieceInterim = ''
      let pieceFinal = ''
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const r = ev.results[i]
        const text = r[0].transcript
        if (r.isFinal) pieceFinal += text
        else pieceInterim += text
      }
      if (pieceInterim) setInterim(pieceInterim)
      if (pieceFinal) {
        setFinalText(pieceFinal.trim())
        setInterim('')
        dispatchToJarvis(pieceFinal.trim())
      }
    }
    rec.onerror = (ev) => {
      if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') {
        setState('denied')
      } else if (ev.error === 'no-speech') {
        setState('idle')
      } else {
        setState('error')
      }
    }
    rec.onend = () => {
      setState((s) => (s === 'listening' ? 'idle' : s))
    }
    recRef.current = rec
    return () => {
      try {
        rec.abort()
      } catch {
        /* noop */
      }
      recRef.current = null
    }
  }, [])

  const dispatchToJarvis = useCallback((text: string) => {
    if (!text) return
    const ev = new CustomEvent<{ text: string }>(JARVIS_VOICE_EVENT, { detail: { text } })
    window.dispatchEvent(ev)
  }, [])

  const start = () => {
    if (!recRef.current) return
    setFinalText('')
    setInterim('')
    try {
      recRef.current.start()
      setState('listening')
    } catch {
      // already started — fine
      setState('listening')
    }
  }

  const stop = () => {
    if (!recRef.current) return
    try {
      recRef.current.stop()
    } catch {
      /* noop */
    }
    setState('idle')
  }

  const isListening = state === 'listening'
  const statusColor =
    state === 'listening'
      ? 'var(--red)'
      : state === 'denied' || state === 'unsupported' || state === 'error'
      ? 'var(--text-muted)'
      : 'var(--green)'

  return (
    <article
      className="group relative flex flex-col rounded-lg overflow-hidden"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        minHeight: 200,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background:
            'linear-gradient(90deg, transparent, var(--green), transparent)',
          opacity: 0.7,
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
              color: 'var(--accent2)',
            }}
          >
            <Mic size={18} strokeWidth={1.5} />
          </div>
          <span
            className="font-mono uppercase tracking-[0.14em] rounded inline-flex items-center gap-1.5"
            style={{
              fontSize: 9,
              padding: '3px 7px',
              color: statusColor,
              background:
                state === 'listening'
                  ? 'rgba(229, 62, 62, 0.10)'
                  : 'rgba(15, 184, 114, 0.10)',
              border: `1px solid ${
                state === 'listening'
                  ? 'rgba(229, 62, 62, 0.30)'
                  : 'rgba(15, 184, 114, 0.30)'
              }`,
            }}
          >
            <span
              className={isListening ? 'animate-jarvis-pulse' : ''}
              style={{
                display: 'inline-block',
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: statusColor,
              }}
            />
            {state === 'listening'
              ? 'REC'
              : state === 'denied'
              ? 'BLOCKED'
              : state === 'unsupported'
              ? 'N/A'
              : state === 'error'
              ? 'ERROR'
              : 'LIVE'}
          </span>
        </div>

        <h2
          className="text-base font-medium leading-tight mb-1.5"
          style={{ color: 'var(--text-primary)' }}
        >
          Voice · Speech-to-Jarvis
        </h2>

        <div
          className="mt-3 flex flex-col items-center justify-center text-center"
          style={{ minHeight: 110 }}
        >
          <button
            type="button"
            onClick={isListening ? stop : start}
            disabled={state === 'unsupported' || state === 'denied'}
            aria-label={isListening ? 'Stop listening' : 'Start listening'}
            className="rounded-full flex items-center justify-center transition-all"
            style={{
              width: 56,
              height: 56,
              background: isListening
                ? 'rgba(229, 62, 62, 0.15)'
                : 'rgba(47,128,237,0.10)',
              border: `1px solid ${
                isListening ? 'rgba(229, 62, 62, 0.55)' : 'rgba(86,207,225,0.45)'
              }`,
              color: isListening ? 'var(--red)' : 'var(--accent2)',
              cursor:
                state === 'unsupported' || state === 'denied' ? 'not-allowed' : 'pointer',
              boxShadow: isListening ? '0 0 12px rgba(229, 62, 62, 0.45)' : 'none',
            }}
          >
            {isListening ? <MicOff size={22} strokeWidth={1.7} /> : <Mic size={22} strokeWidth={1.7} />}
          </button>
          <p
            className="font-mono uppercase tracking-[0.16em] mt-2"
            style={{ fontSize: 9, color: 'var(--text-muted)' }}
          >
            {state === 'unsupported'
              ? 'Browser not supported · use Chrome or Edge'
              : state === 'denied'
              ? 'Mic blocked · enable in browser settings'
              : isListening
              ? 'Listening… click to stop'
              : 'Click and speak to Jarvis'}
          </p>
          <p
            className="mt-2 px-2"
            style={{
              fontSize: 11,
              color: 'var(--text-secondary)',
              minHeight: 18,
            }}
          >
            {interim ? <em style={{ opacity: 0.7 }}>{interim}</em> : finalText || ''}
          </p>
        </div>
      </div>

      <div
        className="px-5 py-3"
        style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-base)' }}
      >
        <span
          className="font-mono"
          style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.04em' }}
        >
          Phase 1: browser STT · Phase 2: Pipecat wake-word + ElevenLabs voice
        </span>
      </div>
    </article>
  )
}
