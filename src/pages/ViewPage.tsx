import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Tile, TilesData, DEFAULT_FILLER_TEXT } from '@/models/tile'
import { ThemeId, DEFAULT_THEME, applyTheme } from '@/models/theme'
import { getFileContentPublic, PublicApiError } from '@/services/driveApi'
import { ViewTileGrid } from '@/components/ViewTileGrid'
import { ViewDiaryTimeline } from '@/components/ViewDiaryTimeline'
import { ViewToggle } from '@/components/ViewToggle'
import { LanguageToggle } from '@/components/LanguageToggle'

type ViewMode = 'grid' | 'diary'
type LoadState = 'loading' | 'ok' | 'not-found' | 'private' | 'error'

export default function ViewPage() {
  const { fileId } = useParams<{ fileId: string }>()
  const { t } = useTranslation()

  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [tiles, setTiles] = useState<Tile[]>([])
  const [fillerText, setFillerText] = useState(DEFAULT_FILLER_TEXT)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  const handleViewChange = useCallback((mode: ViewMode) => {
    setViewMode(mode)
  }, [])

  useEffect(() => {
    if (!fileId) {
      setLoadState('not-found')
      return
    }

    let cancelled = false

    async function load() {
      try {
        const content = await getFileContentPublic(fileId!)
        if (cancelled) return

        const data: TilesData = JSON.parse(content)

        // Apply theme
        const theme = (data.theme as ThemeId) || DEFAULT_THEME
        if (theme === 'auto') {
          applyTheme(DEFAULT_THEME)
        } else {
          applyTheme(theme)
        }

        setTiles(data.tiles || [])
        setFillerText(data.fillerText || DEFAULT_FILLER_TEXT)
        setLoadState('ok')
      } catch (error) {
        if (cancelled) return
        if (error instanceof PublicApiError) {
          setLoadState(error.status === 404 ? 'not-found' : error.status === 403 ? 'private' : 'error')
        } else {
          setLoadState('error')
        }
      }
    }

    load()
    return () => { cancelled = true }
  }, [fileId])

  // Error / loading states
  if (loadState === 'loading') {
    return (
      <div className="h-[100dvh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 mx-auto mb-4 border-2 border-white/20 border-t-white/60 rounded-full" />
          <p className="text-sm text-white/40">{t('app.loading')}</p>
        </div>
      </div>
    )
  }

  if (loadState !== 'ok') {
    return (
      <div className="h-[100dvh] flex items-center justify-center">
        <div className="text-center px-6 max-w-sm">
          <h2 className="text-xl font-bold text-white/70 mb-2">
            {loadState === 'not-found' && t('viewer.notFound')}
            {loadState === 'private' && t('viewer.private')}
            {loadState === 'error' && t('viewer.loadError')}
          </h2>
          <p className="text-sm text-white/40 mb-6">
            {loadState === 'private'
              ? t('viewer.privateDescription')
              : t('viewer.errorDescription')}
          </p>
          <Link
            to="/login"
            className="inline-block px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
            style={{
              background: 'linear-gradient(135deg, var(--theme-g1), var(--theme-g2))',
            }}
          >
            {t('viewer.startYourOwn')}
          </Link>
        </div>
      </div>
    )
  }

  const completedCount = tiles.filter(tile => tile.thumbFileId).length

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden">
      {/* Viewer header */}
      <header className="px-4 pt-2.5 pb-1 flex items-center justify-between">
        <h1
          className="text-lg font-black tracking-wider uppercase"
          style={{
            background: 'linear-gradient(135deg, var(--theme-g1), var(--theme-g2), var(--theme-g3))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {fillerText}
        </h1>
        <LanguageToggle />
      </header>

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
          <ViewToggle view={viewMode} onChange={handleViewChange} />
        </div>
      </div>

      {/* Content */}
      <main className={`flex-1 px-2.5 pb-2.5 flex flex-col min-h-0 ${viewMode === 'diary' ? 'overflow-y-auto' : ''}`}>
        <div className="max-w-6xl w-full mx-auto flex-1 min-h-0">
          {viewMode === 'grid'
            ? <ViewTileGrid tiles={tiles} fillerText={fillerText} />
            : <ViewDiaryTimeline tiles={tiles} />
          }
        </div>
      </main>

      {/* CTA footer */}
      <div className="px-4 py-2 flex-shrink-0 text-center">
        <Link
          to="/login"
          className="text-xs text-white/30 hover:text-white/50 transition-colors"
        >
          {t('viewer.startYourOwn')}
        </Link>
      </div>
    </div>
  )
}
