'use client'

import { useChat } from '@ai-sdk/react'
import { useEffect, useRef } from 'react'

export function JarvisSidebar() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, error, stop } = useChat({
    api: '/api/jarvis',
  })

  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  return (
    <aside
      className="flex flex-col h-full flex-shrink-0 border-r"
      style={{
        width: 360,
        background: 'var(--bg-surface)',
        borderColor: 'var(--border-default)',
      }}
      aria-label="Jarvis assistant"
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4"
        style={{ height: 48, borderBottom: '1px solid var(--border-subtle)' }}
      >
        <div className="flex items-center gap-2">
          <span
            className="inline-block rounded-full animate-jarvis-pulse"
            style={{
              width: 8,
              height: 8,
              background: 'var(--green)',
              boxShadow: '0 0 8px var(--green)',
            }}
            aria-hidden
          />
          <span
            className="font-display tracking-[0.16em] text-sm"
            style={{ color: 'var(--text-primary)' }}
          >
            JARVIS
          </span>
          <span
            className="font-mono uppercase tracking-[0.18em]"
            style={{ fontSize: 9, color: 'var(--text-muted)' }}
          >
            · online
          </span>
        </div>
        {isLoading ? (
          <button
            onClick={stop}
            className="font-mono uppercase tracking-[0.12em] px-2 py-0.5 rounded transition-colors"
            style={{
              fontSize: 9,
              color: 'var(--text-muted)',
              border: '1px solid var(--border-default)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--red)'
              e.currentTarget.style.borderColor = 'var(--red)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)'
              e.currentTarget.style.borderColor = 'var(--border-default)'
            }}
          >
            Stop
          </button>
        ) : null}
      </div>

      {/* Transcript */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center" style={{ color: 'var(--text-muted)' }}>
            <div
              className="font-mono uppercase tracking-[0.18em] mb-2"
              style={{ fontSize: 10 }}
            >
              At your service, sir.
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Ask about projects, scheduling, federal procurement,
              <br />
              or anything across the NEXUS platform.
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className="text-[13px] leading-relaxed"
              style={{
                color: m.role === 'user' ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}
            >
              <div
                className="font-mono uppercase mb-1"
                style={{
                  fontSize: 9,
                  letterSpacing: '0.16em',
                  color: m.role === 'user' ? 'var(--accent2)' : 'var(--gold)',
                }}
              >
                {m.role === 'user' ? 'You' : 'Jarvis'}
              </div>
              <div className="whitespace-pre-wrap">{m.content}</div>
            </div>
          ))
        )}

        {error ? (
          <div
            className="text-[12px] rounded px-3 py-2"
            style={{
              color: 'var(--red)',
              background: 'rgba(229, 62, 62, 0.08)',
              border: '1px solid rgba(229, 62, 62, 0.25)',
            }}
          >
            Jarvis is momentarily indisposed. {error.message}
          </div>
        ) : null}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="p-3"
        style={{ borderTop: '1px solid var(--border-subtle)' }}
      >
        <div
          className="flex items-end gap-2 rounded-md"
          style={{
            background: 'var(--bg-base)',
            border: '1px solid var(--border-default)',
            padding: '8px 10px',
          }}
        >
          <textarea
            value={input}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                if (!isLoading && input.trim()) {
                  handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>)
                }
              }
            }}
            placeholder="Speak to Jarvis…"
            rows={1}
            disabled={isLoading}
            className="flex-1 bg-transparent resize-none outline-none"
            style={{
              color: 'var(--text-primary)',
              fontSize: 13,
              maxHeight: 120,
              fontFamily: 'var(--font-sans)',
            }}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="font-mono uppercase tracking-[0.12em] px-2 py-1 rounded transition-colors"
            style={{
              fontSize: 10,
              color: isLoading || !input.trim() ? 'var(--text-muted)' : 'var(--accent2)',
              border: `1px solid ${isLoading || !input.trim() ? 'var(--border-default)' : 'rgba(86,207,225,0.35)'}`,
              background: isLoading || !input.trim() ? 'transparent' : 'rgba(47,128,237,0.08)',
              cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            Send
          </button>
        </div>
        <div
          className="font-mono mt-2 px-1"
          style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.04em' }}
        >
          ↵ send · ⇧↵ newline · Groq · Llama 3.3 70B
        </div>
      </form>
    </aside>
  )
}
