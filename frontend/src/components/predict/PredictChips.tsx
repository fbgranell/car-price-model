interface Option<T> {
  value: T
  label: string
}

interface PredictChipsProps<T extends string> {
  options: Option<T>[]
  value: T
  onChange: (v: T) => void
}

export default function PredictChips<T extends string>({ options, value, onChange }: PredictChipsProps<T>) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map((opt) => {
        const active = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className="px-3.5 py-1.5 rounded-full text-xs font-medium transition-all"
            style={
              active
                ? {
                    background: 'linear-gradient(135deg,rgba(0,212,255,0.22),rgba(0,136,255,0.12))',
                    border: '1px solid rgba(0,212,255,0.4)',
                    color: '#00D4FF',
                    boxShadow: '0 0 12px rgba(0,212,255,0.15), inset 0 1px 0 rgba(0,212,255,0.1)',
                  }
                : {
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(148,163,184,1)',
                  }
            }
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
