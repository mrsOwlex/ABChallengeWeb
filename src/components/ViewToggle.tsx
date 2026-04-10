import { useTranslation } from 'react-i18next'

type ViewMode = 'grid' | 'diary'

interface ViewToggleProps {
  view: ViewMode
  onChange: (view: ViewMode) => void
}

export function ViewToggle({ view, onChange }: ViewToggleProps) {
  const { t } = useTranslation()

  return (
    <div className="bg-white/[0.06] rounded-lg p-0.5 flex gap-0.5">
      <button
        onClick={() => onChange('grid')}
        aria-label={t('diary.toggleGrid')}
        className={`p-1.5 rounded-md transition-all duration-200 ${
          view === 'grid'
            ? 'text-white'
            : 'text-white/30 hover:text-white/50'
        }`}
        style={
          view === 'grid'
            ? { background: 'rgba(var(--theme-g2-rgb), 0.2)' }
            : undefined
        }
      >
        {/* Grid icon (2x2 squares) */}
        <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
          <rect x="1" y="1" width="6" height="6" rx="1" />
          <rect x="9" y="1" width="6" height="6" rx="1" />
          <rect x="1" y="9" width="6" height="6" rx="1" />
          <rect x="9" y="9" width="6" height="6" rx="1" />
        </svg>
      </button>

      <button
        onClick={() => onChange('diary')}
        aria-label={t('diary.toggleDiary')}
        className={`p-1.5 rounded-md transition-all duration-200 ${
          view === 'diary'
            ? 'text-white'
            : 'text-white/30 hover:text-white/50'
        }`}
        style={
          view === 'diary'
            ? { background: 'rgba(var(--theme-g2-rgb), 0.2)' }
            : undefined
        }
      >
        {/* Journal/list icon */}
        <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <line x1="5" y1="3" x2="14" y2="3" />
          <line x1="5" y1="8" x2="14" y2="8" />
          <line x1="5" y1="13" x2="14" y2="13" />
          <circle cx="2" cy="3" r="1" fill="currentColor" stroke="none" />
          <circle cx="2" cy="8" r="1" fill="currentColor" stroke="none" />
          <circle cx="2" cy="13" r="1" fill="currentColor" stroke="none" />
        </svg>
      </button>
    </div>
  )
}
