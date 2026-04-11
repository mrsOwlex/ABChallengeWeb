import { Tile } from '@/models/tile'
import { ViewTileCard } from './ViewTileCard'

interface ViewTileGridProps {
  tiles: Tile[]
  fillerText: string
}

function ViewFillerTile({ text }: { text: string }) {
  return (
    <div
      className="col-span-2 sm:col-span-4 rounded-[14px] flex items-center justify-center"
      style={{ border: '1.5px dashed rgba(255,255,255,0.06)' }}
    >
      <span
        className="text-[0.5rem] sm:text-[0.65rem] lg:text-xs font-bold tracking-[0.15em] uppercase"
        style={{
          background: 'linear-gradient(135deg, rgba(var(--theme-g1-rgb),0.4), rgba(var(--theme-g2-rgb),0.4), rgba(var(--theme-g3-rgb),0.4))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        {text}
      </span>
    </div>
  )
}

export function ViewTileGrid({ tiles, fillerText }: ViewTileGridProps) {
  const gridClass = "grid grid-cols-4 sm:grid-cols-6 grid-rows-7 sm:grid-rows-5 gap-1 sm:gap-1.5 h-full"

  if (tiles.length < 26) {
    return (
      <div className={gridClass}>
        {Array.from({ length: 26 }).map((_, i) => (
          <div key={i} className="rounded-[14px] animate-pulse" style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.08)' }} />
        ))}
      </div>
    )
  }

  const before = tiles.slice(0, 12)  // A-L
  const tileM = tiles[12]            // M
  const tileN = tiles[13]            // N
  const after = tiles.slice(14)      // O-Z

  return (
    <div className={gridClass}>
      {before.map((tile, i) => (
        <ViewTileCard key={tile.id} tile={tile} index={i} />
      ))}
      <ViewTileCard key={tileM.id} tile={tileM} index={12} />
      <ViewFillerTile text={fillerText} />
      <ViewTileCard key={tileN.id} tile={tileN} index={13} />
      {after.map((tile, i) => (
        <ViewTileCard key={tile.id} tile={tile} index={14 + i} />
      ))}
    </div>
  )
}
