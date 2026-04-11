import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Tile } from '@/models/tile'
import { getTileState } from '@/utils/tileState'
import { ViewDiaryEntry } from '@/components/ViewDiaryEntry'

interface ViewDiaryTimelineProps {
  tiles: Tile[]
}

export function ViewDiaryTimeline({ tiles }: ViewDiaryTimelineProps) {
  const { t } = useTranslation()

  const { datedTiles, ideaTiles } = useMemo(() => {
    const activeTiles = tiles.filter(tile => getTileState(tile) !== 'incomplete')

    const dated = activeTiles
      .filter(tile => tile.date)
      .sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0
        const dateB = b.date ? new Date(b.date).getTime() : 0
        return dateB - dateA // newest first
      })

    const ideas = activeTiles
      .filter(tile => !tile.date)
      .sort((a, b) => a.id.localeCompare(b.id))

    return { datedTiles: dated, ideaTiles: ideas }
  }, [tiles])

  const isEmpty = datedTiles.length === 0 && ideaTiles.length === 0

  if (isEmpty) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
        <h2
          className="text-xl font-bold mb-2"
          style={{
            background: 'linear-gradient(135deg, var(--theme-g1), var(--theme-g2), var(--theme-g3))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {t('diary.emptyTitle')}
        </h2>
        <p className="text-sm text-white/40 max-w-xs">
          {t('diary.emptySubtitle')}
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-4 relative">
      {/* Vertical timeline line */}
      <div
        className="absolute w-px top-4 bottom-4"
        style={{
          left: '1.5rem',
          background: 'rgba(255, 255, 255, 0.06)',
        }}
      />

      {/* Dated entries */}
      {datedTiles.map((tile, index) => (
        <ViewDiaryEntry key={tile.id} tile={tile} index={index} />
      ))}

      {/* Ideas section */}
      {ideaTiles.length > 0 && (
        <>
          <div className="diary-section-divider">
            <span>{t('diary.ideasSection')}</span>
          </div>
          {ideaTiles.map((tile, index) => (
            <ViewDiaryEntry
              key={tile.id}
              tile={tile}
              index={datedTiles.length + index}
            />
          ))}
        </>
      )}
    </div>
  )
}
