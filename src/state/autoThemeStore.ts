import { create } from 'zustand'
import type { Tile } from '@/models/tile'
import type { ThemeConfig } from '@/models/theme'
import { applyTheme } from '@/models/theme'
import { loadThumbUrl } from '@/services/thumbCache'
import { extractDominantColors } from '@/utils/colorExtract'
import { generateAutoTheme } from '@/utils/autoTheme'

interface AutoThemeState {
  autoTheme: ThemeConfig | null
  isComputing: boolean
  lastFingerprint: string
  computeAutoTheme: (tiles: Tile[], activeTheme: string) => Promise<void>
}

export const useAutoThemeStore = create<AutoThemeState>((set, get) => ({
  autoTheme: null,
  isComputing: false,
  lastFingerprint: '',

  computeAutoTheme: async (tiles, activeTheme) => {
    const thumbIds = tiles
      .map(t => t.thumbFileId)
      .filter((id): id is string => id !== null)

    const fingerprint = thumbIds.sort().join(',')

    // Skip if nothing changed
    if (fingerprint === get().lastFingerprint && get().autoTheme) return
    if (thumbIds.length === 0) {
      set({ autoTheme: null, lastFingerprint: '' })
      return
    }

    // Prevent concurrent computations
    if (get().isComputing) return
    set({ isComputing: true })

    try {
      // Load ALL thumbnails (fetches from Drive if not cached yet)
      const results = await Promise.allSettled(
        thumbIds.map(id => loadThumbUrl(id)),
      )

      const urls: string[] = []
      for (const r of results) {
        if (r.status === 'fulfilled' && r.value) {
          urls.push(r.value)
        }
      }

      if (urls.length === 0) {
        set({ isComputing: false })
        return
      }

      const colors = await extractDominantColors(urls)
      if (colors.length === 0) {
        set({ isComputing: false })
        return
      }

      const theme = generateAutoTheme(colors)
      set({ autoTheme: theme, isComputing: false, lastFingerprint: fingerprint })

      // Apply immediately if auto theme is active
      if (activeTheme === 'auto') {
        applyTheme('auto', theme)
      }
    } catch (error) {
      console.error('Failed to compute auto theme:', error)
      set({ isComputing: false })
    }
  },
}))
