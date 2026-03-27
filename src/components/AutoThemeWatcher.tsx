import { useEffect } from 'react'
import { useTilesStore } from '@/state/tilesStore'
import { useAutoThemeStore } from '@/state/autoThemeStore'

/**
 * Triggers auto-theme computation when the theme is 'auto' and images change.
 * Loads all thumbnails before computing — result is deterministic regardless of load order.
 * Renders nothing — pure side-effect component.
 */
export function AutoThemeWatcher() {
  const tiles = useTilesStore(s => s.tiles)
  const theme = useTilesStore(s => s.theme)
  const computeAutoTheme = useAutoThemeStore(s => s.computeAutoTheme)

  const imageFingerprint = tiles
    .map(t => t.thumbFileId || '')
    .filter(Boolean)
    .sort()
    .join(',')

  useEffect(() => {
    if (theme !== 'auto' || !imageFingerprint) return
    computeAutoTheme(tiles, theme)
  }, [theme, imageFingerprint, tiles, computeAutoTheme])

  return null
}
