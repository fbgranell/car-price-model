import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'

interface InfoTooltipProps {
  en: string
  es: string
  lang?: 'en' | 'es'
}

export default function InfoTooltip({ en, es, lang = 'en' }: InfoTooltipProps) {
  const [visible, setVisible] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const ref = useRef<HTMLSpanElement>(null)

  const handleMouseEnter = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect()
      setCoords({ top: rect.bottom + 8, left: rect.left + rect.width / 2 })
    }
    setVisible(true)
  }

  return (
    <span
      ref={ref}
      className="inline-flex items-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setVisible(false)}
    >
      <span
        className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full text-[9px] italic font-semibold leading-none cursor-help select-none shrink-0"
        style={{ border: '1px solid rgba(148,163,184,0.25)', color: 'rgba(148,163,184,0.4)' }}
      >
        i
      </span>

      {visible && createPortal(
        <div
          className="pointer-events-none w-56 rounded-xl p-3"
          style={{
            position: 'fixed',
            top: coords.top,
            left: coords.left,
            transform: 'translateX(-50%)',
            zIndex: 9999,
            background: 'rgba(4,9,20,0.97)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(14px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          <p className="text-xs text-slate-300 leading-snug">
            {lang === 'en' ? en : es}
          </p>
        </div>,
        document.body
      )}
    </span>
  )
}
