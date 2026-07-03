interface Option<T> {
  value: T
  label: string
}

interface PredictChipsProps<T extends string> {
  options: Option<T>[]
  /** Pass null while no option should read as active - e.g. a selection is pending confirmation
   *  and shouldn't look committed to either the old or the new option. */
  value: T | null
  onChange: (v: T) => void
  /** Option currently being prepared in the background (e.g. an asset still downloading) -
   *  shown with a spinner instead of being selectable, rather than the pill just going active
   *  immediately. */
  loadingValue?: T
}

export default function PredictChips<T extends string>({ options, value, onChange, loadingValue }: PredictChipsProps<T>) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map((opt) => {
        const active = value === opt.value
        const isLoading = loadingValue === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            disabled={isLoading}
            className="px-3.5 py-1.5 rounded-full text-xs font-medium transition-all inline-flex items-center gap-1.5 disabled:cursor-wait"
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
            {isLoading && (
              <span
                className="h-2.5 w-2.5 rounded-full animate-spin shrink-0"
                style={{ border: '1.5px solid rgba(0,212,255,0.25)', borderTopColor: '#00D4FF' }}
              />
            )}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
