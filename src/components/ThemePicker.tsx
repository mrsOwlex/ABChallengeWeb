import { useTilesStore } from '@/state/tilesStore'
import { useAutoThemeStore } from '@/state/autoThemeStore'
import { THEMES, THEME_IDS } from '@/models/theme'

export function ThemePicker() {
  const { theme, setTheme } = useTilesStore()
  const autoTheme = useAutoThemeStore(s => s.autoTheme)
  const hasImages = useTilesStore(s => s.tiles.some(t => t.thumbFileId))

  const autoIsActive = theme === 'auto'
  const autoSwatch = autoTheme
    ? `linear-gradient(135deg, ${autoTheme.swatch[0]}, ${autoTheme.swatch[1]})`
    : 'conic-gradient(from 0deg, #f472b6, #fbbf24, #34d399, #60a5fa, #a78bfa, #f472b6)'

  return (
    <div className="flex items-center gap-1.5">
      {THEME_IDS.map((id) => {
        const t = THEMES[id]
        const isActive = theme === id
        return (
          <button
            key={id}
            onClick={() => setTheme(id)}
            className={`w-5 h-5 rounded-full transition-all duration-200 ${
              isActive ? 'ring-2 ring-white/40 ring-offset-1 ring-offset-transparent scale-110' : 'opacity-50 hover:opacity-80'
            }`}
            style={{
              background: `linear-gradient(135deg, ${t.swatch[0]}, ${t.swatch[1]})`,
            }}
            aria-label={id}
          />
        )
      })}

      {/* Auto theme swatch */}
      <button
        onClick={() => setTheme('auto')}
        disabled={!hasImages}
        className={`w-5 h-5 rounded-full transition-all duration-200 relative ${
          autoIsActive
            ? 'ring-2 ring-white/40 ring-offset-1 ring-offset-transparent scale-110'
            : hasImages
              ? 'opacity-50 hover:opacity-80'
              : 'opacity-20 cursor-not-allowed'
        }`}
        style={{ background: autoSwatch }}
        aria-label="auto"
      >
        {/* Sparkle indicator */}
        <span className="absolute -top-0.5 -right-0.5 text-[6px] leading-none">
          ✦
        </span>
      </button>
    </div>
  )
}
