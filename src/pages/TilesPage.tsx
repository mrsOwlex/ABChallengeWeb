import { useEffect } from 'react'
import { useTilesStore } from '@/state/tilesStore'
import { AppHeader } from '@/components/AppHeader'
import { AutoThemeWatcher } from '@/components/AutoThemeWatcher'
import { OfflineBanner } from '@/components/OfflineBanner'
import { TileGrid } from '@/components/TileGrid'

export default function TilesPage() {
  const { initialize, isInitialized, error, clearError, saveStatus, tiles } = useTilesStore()

  useEffect(() => {
    if (!isInitialized) {
      initialize()
    }
  }, [initialize, isInitialized])

  const completedCount = tiles.filter(tile => tile.thumbFileId).length

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden">
      <AppHeader />
      <AutoThemeWatcher />
      <OfflineBanner />

      {/* Progress bar */}
      <div className="px-4 pt-1.5 pb-2.5 flex-shrink-0">
        <div className="max-w-6xl mx-auto flex items-center gap-2.5">
          <div className="flex-1 h-1 bg-white/[0.08] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(completedCount / 26) * 100}%`,
                background: 'linear-gradient(90deg, var(--theme-g1), var(--theme-g2), var(--theme-g3))',
                boxShadow: '0 0 12px rgba(var(--theme-g2-rgb),0.4)',
              }}
            />
          </div>
          <span className="text-[0.7rem] font-bold text-white/[0.35] tabular-nums">{completedCount} / 26</span>

          {/* Save status indicator */}
          {saveStatus === 'saving' && (
            <svg className="animate-spin h-3.5 w-3.5 text-white/30" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}
          {saveStatus === 'saved' && (
            <svg className="h-3.5 w-3.5" style={{ color: 'var(--theme-done)', opacity: 0.6 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          {saveStatus === 'error' && (
            <svg className="h-3.5 w-3.5 text-red-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="px-4 pb-2">
          <div className="max-w-6xl mx-auto p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center justify-between">
            <p className="text-red-300 text-xs">{error}</p>
            <button onClick={clearError} className="text-red-400 hover:text-red-300">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 px-2.5 pb-2.5 flex flex-col min-h-0">
        <div className="max-w-6xl w-full mx-auto flex-1 min-h-0">
          <TileGrid />
        </div>
      </main>
    </div>
  )
}
