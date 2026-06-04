import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useTilesStore } from '@/state/tilesStore'
import { AppHeader } from '@/components/AppHeader'
import { OfflineBanner } from '@/components/OfflineBanner'
import { TileDetailForm } from '@/components/TileDetailForm'
import { ImageUploader } from '@/components/ImageUploader'
import { SaveIndicator } from '@/components/SaveIndicator'
import { getTileState, TileState } from '@/utils/tileState'

const STATE_CONFIG: Record<TileState, { icon: string; badgeClass: string; hintKey: string }> = {
  done: { icon: '✓', badgeClass: 'state-badge-done', hintKey: 'tileDetail.hintDone' },
  planned: { icon: '📅', badgeClass: 'state-badge-planned', hintKey: 'tileDetail.hintPlanned' },
  idea: { icon: '💡', badgeClass: 'state-badge-idea', hintKey: 'tileDetail.hintIdea' },
  incomplete: { icon: '—', badgeClass: 'state-badge-incomplete', hintKey: 'tileDetail.hintIncomplete' },
}

const STATE_LABEL_KEYS: Record<TileState, string> = {
  done: 'tileDetail.stateDone',
  planned: 'tileDetail.statePlanned',
  idea: 'tileDetail.stateIdea',
  incomplete: 'tileDetail.stateIncomplete',
}

function getStateColor(state: TileState): string {
  switch (state) {
    case 'done': return 'var(--theme-done)'
    case 'planned': return 'var(--theme-g2)'
    case 'idea': return 'var(--theme-idea)'
    default: return 'rgba(255,255,255,0.2)'
  }
}

export default function TileDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getTileById, isInitialized, initialize } = useTilesStore()

  useEffect(() => {
    if (!isInitialized) {
      initialize()
    }
  }, [isInitialized, initialize])

  const tileId = id?.toUpperCase()
  const tile = tileId && isInitialized ? getTileById(tileId) : undefined

  useEffect(() => {
    if (isInitialized && tileId && !tile) {
      navigate('/tiles')
    }
  }, [isInitialized, tileId, tile, navigate])

  if (!tile) {
    return (
      <div className="min-h-[100dvh] flex flex-col">
        <AppHeader />
        <OfflineBanner />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-white/50">{t('app.loading')}</div>
        </main>
      </div>
    )
  }

  const state = getTileState(tile)
  const config = STATE_CONFIG[state]

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <AppHeader />
      <OfflineBanner />

      <main className="flex-1 p-4">
        <div className="max-w-2xl mx-auto space-y-5">

          {/* Hero Header */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/tiles')}
              className="p-2 -ml-2 text-white/60 hover:text-white transition-colors"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <h1
              className="text-4xl font-black"
              style={{
                color: getStateColor(state),
                textShadow: state !== 'incomplete'
                  ? `0 0 24px ${getStateColor(state)}40`
                  : 'none',
              }}
            >
              {tile.id}
            </h1>

            <SaveIndicator />
          </div>

          {/* State Badge + Hint */}
          <div className="text-center space-y-2">
            <span className={`state-badge ${config.badgeClass}`}>
              <span>{config.icon}</span>
              <span>{t(STATE_LABEL_KEYS[state])}</span>
            </span>
            <p className="text-xs text-white/40">{t(config.hintKey)}</p>
          </div>

          {/* Image (highest priority state trigger) */}
          <ImageUploader tile={tile} />

          {/* Date + Note */}
          <TileDetailForm tile={tile} />
        </div>
      </main>
    </div>
  )
}
