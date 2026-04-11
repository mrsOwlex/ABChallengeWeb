import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Tile } from '@/models/tile'
import { getTileState } from '@/utils/tileState'
import { getStateColor, STATE_CONFIG, ACCENT_CLASS } from '@/utils/tileStateConfig'
import { formatDate } from '@/utils/date'
import { usePublicThumbnail } from '@/hooks/usePublicThumbnail'

interface ViewDiaryEntryProps {
  tile: Tile
  index: number
}

export const ViewDiaryEntry = memo(function ViewDiaryEntry({ tile, index }: ViewDiaryEntryProps) {
  const { t } = useTranslation()
  const { url: thumbUrl } = usePublicThumbnail(tile.thumbFileId)
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

      {/* Card — read-only, no click handler */}
      <div className={`diary-card ${ACCENT_CLASS[state] || ''}`}>
        {/* Image variant */}
        {hasImage && (
          <div className="relative aspect-video overflow-hidden max-w-md mx-auto">
            <img
              src={thumbUrl}
              alt={tile.id}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
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
