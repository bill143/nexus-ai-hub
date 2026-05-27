'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, CameraOff } from 'lucide-react'

type CamState = 'idle' | 'requesting' | 'live' | 'denied' | 'error'

export function CameraTile() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [state, setState] = useState<CamState>('idle')
  const [errMsg, setErrMsg] = useState('')

  const start = async () => {
    setState('requesting')
    setErrMsg('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 360 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => {})
      }
      setState('live')
    } catch (e) {
      const err = e as DOMException
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setState('denied')
        setErrMsg('Camera permission was blocked. Click below to retry.')
      } else if (err.name === 'NotFoundError' || err.name === 'OverconstrainedError') {
        setState('error')
        setErrMsg('No camera detected on this device.')
      } else {
        setState('error')
        setErrMsg(err.message || 'Unable to start camera.')
      }
    }
  }

  useEffect(() => {
    start()
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isLive = state === 'live'
  const statusColor = isLive ? 'var(--green)' : 'var(--text-muted)'

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
            <Camera size={18} strokeWidth={1.5} />
          </div>
          <span
            className="font-mono uppercase tracking-[0.14em] rounded inline-flex items-center gap-1.5"
            style={{
              fontSize: 9,
              padding: '3px 7px',
              color: statusColor,
              background: isLive ? 'rgba(15, 184, 114, 0.10)' : 'rgba(122, 143, 166, 0.10)',
              border: `1px solid ${isLive ? 'rgba(15, 184, 114, 0.30)' : 'rgba(122, 143, 166, 0.30)'}`,
            }}
          >
            <span
              className={isLive ? 'animate-jarvis-pulse' : ''}
              style={{
                display: 'inline-block',
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: statusColor,
              }}
            />
            {isLive ? 'LIVE' : state === 'denied' ? 'BLOCKED' : state === 'error' ? 'ERROR' : '…'}
          </span>
        </div>

        <h2
          className="text-base font-medium leading-tight mb-1.5"
          style={{ color: 'var(--text-primary)' }}
        >
          Vision · Camera
        </h2>

        <div
          className="relative rounded overflow-hidden mt-2"
          style={{
            aspectRatio: '16 / 9',
            background: 'var(--bg-base)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: isLive ? 'block' : 'none',
            }}
          />
          {!isLive ? (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center text-center px-3"
              style={{ color: 'var(--text-muted)' }}
            >
              <CameraOff size={26} strokeWidth={1.2} />
              <p
                className="font-mono uppercase tracking-[0.14em] mt-2"
                style={{ fontSize: 10, color: 'var(--text-secondary)' }}
              >
                {state === 'requesting' ? 'Awaiting permission…' : 'Camera off'}
              </p>
              {errMsg ? (
                <p style={{ fontSize: 11, marginTop: 6, color: 'var(--text-muted)' }}>{errMsg}</p>
              ) : null}
              {(state === 'denied' || state === 'error' || state === 'idle') && (
                <button
                  type="button"
                  onClick={start}
                  className="font-mono uppercase tracking-[0.14em] rounded mt-3"
                  style={{
                    fontSize: 10,
                    padding: '6px 12px',
                    color: 'var(--accent2)',
                    border: '1px solid rgba(86,207,225,0.35)',
                    background: 'rgba(47,128,237,0.08)',
                  }}
                >
                  Click to enable camera
                </button>
              )}
            </div>
          ) : null}
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
          Phase 1: live preview · Phase 2: face recognition (insightface ready)
        </span>
      </div>
    </article>
  )
}
