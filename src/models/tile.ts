export const DEFAULT_FILLER_TEXT = 'ABC Challenge'

export interface TilesData {
  version: 2
  tiles: Tile[]
  fillerText: string
  theme?: string
  sharing?: { published: boolean; publishedAt?: string }
}

export interface Tile {
  id: string
  note: string
  dateEnabled: boolean
  date: string | null
  thumbFileId: string | null
  updatedAt: string
}

export const TILE_IDS = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)) // A-Z

export function createEmptyTile(id: string): Tile {
  return {
    id,
    note: '',
    dateEnabled: false,
    date: null,
    thumbFileId: null,
    updatedAt: new Date().toISOString(),
  }
}

export function createInitialTiles(): Tile[] {
  return TILE_IDS.map(createEmptyTile)
}

export function updateTile(tiles: Tile[], updatedTile: Partial<Tile> & { id: string }): Tile[] {
  return tiles.map(tile => 
    tile.id === updatedTile.id 
      ? { ...tile, ...updatedTile, updatedAt: new Date().toISOString() }
      : tile
  )
}
