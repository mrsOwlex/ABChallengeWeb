import { memo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tile } from '@/models/tile'
import { useThumbnail } from '@/services/thumbCache'

interface TileCardProps {
  tile: Tile
  index: number
}

export const TileCard = memo(function TileCard({ tile, index }: TileCardProps) {
  const navigate = useNavigate()
  const { url } = useThumbnail(tile.thumbFileId)
  const [imgLoaded, setImgLoaded] = useState(false)

  const isDone = !!tile.thumbFileId
  const isPlanned = !isDone && !!(tile.dateEnabled && tile.date)
  const hasIdea = !isDone && !isPlanned && !!(tile.note && tile.note.trim().length > 0)

  const handleClick = () => {
    navigate(`/tiles/${tile.id}`)
  }

  return (
    <button
      onClick={handleClick}
      className={`
        w-full h-full relative overflow-hidden flex items-center justify-center
        transition-all duration-200 active:scale-[0.93] animate-tile-in
        ${isDone ? 'tile-complete' : isPlanned ? 'tile-planned' : hasIdea ? 'tile-idea' : 'tile-incomplete'}
      `}
      style={{
        animationDelay: `${index * 25}ms`,
      }}
      aria-label={`Tile ${tile.id}`}
    >
      {/* Thumbnail background */}
      {url && (
        <img
          src={url}
          alt=""
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            imgLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {/* Dark overlay for readability on images */}
      {url && imgLoaded && (
        <div className="absolute inset-0 bg-black/40" />
      )}

      {/* The Letter — hero element */}
      <span
        className={`
          relative z-10 font-black leading-none select-none
          ${url && imgLoaded ? 'text-white drop-shadow-lg' : ''}
          ${!isDone && !isPlanned && !hasIdea ? 'text-white/[0.15]' : ''}
        `}
        style={{
          fontSize: 'clamp(1.3rem, 5.5vw, 3rem)',
          ...(!url || !imgLoaded ? {
            color: isDone ? 'var(--theme-done)' : isPlanned ? 'var(--theme-g2)' : hasIdea ? 'var(--theme-idea)' : undefined,
            textShadow: isDone ? '0 0 24px rgba(var(--theme-done-rgb),0.4)' :
                        isPlanned ? '0 0 20px rgba(var(--theme-g2-rgb),0.3)' :
                        hasIdea ? '0 0 20px rgba(var(--theme-idea-rgb),0.3)' : 'none',
          } : {
            textShadow: 'none',
          }),
        }}
      >
        {tile.id}
      </span>

      {/* Status indicator */}
      {isDone && (
        <div
          className="absolute bottom-1.5 right-1.5 w-3.5 h-3.5 rounded-full flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, var(--theme-done), var(--theme-g2))`,
            boxShadow: '0 0 8px rgba(var(--theme-done-rgb),0.4)',
          }}
        >
          <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
      {isPlanned && (
        <span className="absolute bottom-1 right-1 text-[10px] leading-none" style={{ filter: `drop-shadow(0 0 4px rgba(var(--theme-g2-rgb),0.5))` }}>📅</span>
      )}
      {hasIdea && (
        <span className="absolute bottom-1 right-1 text-[10px] leading-none" style={{ filter: `drop-shadow(0 0 4px rgba(var(--theme-idea-rgb),0.5))` }}>💡</span>
      )}
    </button>
  )
})
