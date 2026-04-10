import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Tile } from '@/models/tile'
import { getTileState, TileState } from '@/utils/tileState'
import { formatDate } from '@/utils/date'
import { useThumbnail } from '@/services/thumbCache'

function getStateColor(state: TileState): string {
  switch (state) {
    case 'done': return 'var(--theme-done)'
    case 'planned': return 'var(--theme-g2)'
    case 'idea': return 'var(--theme-idea)'
    default: return 'rgba(255,255,255,0.2)'
  }
}

const STATE_CONFIG: Record<TileState, { icon: string; badgeClass: string; labelKey: string }> = {
  done: { icon: '\u2713', badgeClass: 'state-badge-done', labelKey: 'tileDetail.stateDone' },
  planned: { icon: '\uD83D\uDCC5', badgeClass: 'state-badge-planned', labelKey: 'tileDetail.statePlanned' },
  idea: { icon: '\uD83D\uDCA1', badgeClass: 'state-badge-idea', labelKey: 'tileDetail.stateIdea' },
  incomplete: { icon: '\u2014', badgeClass: 'state-badge-incomplete', labelKey: 'tileDetail.stateIncomplete' },
}

const ACCENT_CLASS: Record<string, string> = {
  done: 'card-accent-done',
  planned: 'card-accent-planned',
  idea: 'card-accent-idea',
}

interface DiaryEntryProps {
  tile: Tile
  index: number
}

export const DiaryEntry = memo(function DiaryEntry({ tile, index }: DiaryEntryProps) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { url: thumbUrl } = useThumbnail(tile.thumbFileId)
  const state = getTileState(tile)
  const config = STATE_CONFIG[state]
  const stateColor = getStateColor(state)
  const hasImage = state === 'done' && thumbUrl

  return (
    <div
      className="relative animate-diary-in"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Timeline dot */}
      <div
        className="diary-timeline-dot"
        style={{
          background: stateColor,
          top: hasImage ? '1.5rem' : '1.25rem',
        }}
      />

      {/* Card */}
      <div
        className={`diary-card ${ACCENT_CLASS[state] || ''}`}
        onClick={() => navigate(`/tiles/${tile.id}`)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            navigate(`/tiles/${tile.id}`)
          }
        }}
      >
        {/* Image variant */}
        {hasImage && (
          <div className="relative aspect-video overflow-hidden max-w-md mx-auto">
            <img
              src={thumbUrl}
              alt={tile.id}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {/* Dark gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            {/* Letter badge on image */}
            <span
              className="absolute top-3 left-3 text-3xl font-black drop-shadow-lg"
              style={{ color: 'white', textShadow: `0 0 20px ${stateColor}60` }}
            >
              {tile.id}
            </span>
          </div>
        )}

        {/* Content area */}
        <div className="p-4">
          {/* Header row: letter (if no image), badge, date */}
          <div className="flex items-center gap-3">
            {!hasImage && (
              <span
                className="text-2xl font-black"
                style={{
                  color: stateColor,
                  textShadow: state !== 'incomplete' ? `0 0 16px ${stateColor}40` : 'none',
                }}
              >
                {tile.id}
              </span>
            )}

            <span className={`state-badge ${config.badgeClass} text-xs`}>
              <span>{config.icon}</span>
              <span>{t(config.labelKey)}</span>
            </span>

            {tile.date && (
              <span className="ml-auto text-xs text-white/40 tabular-nums">
                {formatDate(tile.date)}
              </span>
            )}
          </div>

          {/* Note */}
          {tile.note && tile.note.trim() && (
            <p className="mt-2.5 text-sm text-white/60 leading-relaxed line-clamp-3">
              {tile.note}
            </p>
          )}
        </div>
      </div>
    </div>
  )
})
