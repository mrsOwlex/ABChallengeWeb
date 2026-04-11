import { create } from 'zustand'
import { Tile, DEFAULT_FILLER_TEXT, updateTile } from '@/models/tile'
import { ThemeId, DEFAULT_THEME, applyTheme } from '@/models/theme'
import { useAutoThemeStore } from '@/state/autoThemeStore'
import { useShareStore } from '@/state/shareStore'
import { driveStorage } from '@/services/driveStorage'
import { debounce } from '@/utils/debounce'
import { offlineQueue } from '@/services/offlineQueue'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface TilesState {
  tiles: Tile[]
  fillerText: string
  theme: ThemeId
  isLoading: boolean
  isInitialized: boolean
  saveStatus: SaveStatus
  offline: boolean
  pendingChanges: boolean
  error: string | null

  // Actions
  initialize: () => Promise<void>
  loadTiles: () => Promise<void>
  updateTile: (tileUpdate: Partial<Tile> & { id: string }) => void
  setFillerText: (text: string) => void
  setTheme: (theme: ThemeId) => void
  saveTiles: () => Promise<void>
  getTileById: (id: string) => Tile | undefined
  clearError: () => void
}

const DEBOUNCE_DELAY = 800

export const useTilesStore = create<TilesState>((set, get) => {
  // Debounced save function
  const debouncedSave = debounce(async () => {
    const { tiles, fillerText, theme } = get()
    const { isPublished } = useShareStore.getState()

    set({ saveStatus: 'saving' })

    try {
      const sharing = isPublished ? { published: true } : undefined
      await driveStorage.saveData({ version: 2, tiles, fillerText, theme, sharing })
      set({ saveStatus: 'saved', offline: false, pendingChanges: false })
      offlineQueue.clear()

      // Reset to idle after showing "saved" for a moment
      setTimeout(() => {
        set(state => ({ saveStatus: state.saveStatus === 'saved' ? 'idle' : state.saveStatus }))
      }, 2000)
    } catch (error) {
      console.error('Failed to save tiles:', error)

      // Store for offline sync
      offlineQueue.enqueue(tiles, fillerText, theme)

      set({
        saveStatus: 'error',
        offline: true,
        pendingChanges: true,
        error: error instanceof Error ? error.message : 'Failed to save'
      })
    }
  }, DEBOUNCE_DELAY)

  return {
    tiles: [],
    fillerText: DEFAULT_FILLER_TEXT,
    theme: DEFAULT_THEME,
    isLoading: false,
    isInitialized: false,
    saveStatus: 'idle',
    offline: false,
    pendingChanges: false,
    error: null,

    initialize: async () => {
      set({ isLoading: true, error: null })

      try {
        await driveStorage.initialize()
        const data = await driveStorage.loadData()
        const theme = (data.theme as ThemeId) || DEFAULT_THEME
        // For 'auto', apply fallback until auto-theme is computed
        if (theme === 'auto') {
          applyTheme(DEFAULT_THEME)
        } else {
          applyTheme(theme)
        }

        // Check for pending offline changes
        const pending = offlineQueue.getPending()
        if (pending) {
          set({
            tiles: data.tiles,
            fillerText: data.fillerText,
            theme,
            isLoading: false,
            isInitialized: true,
            pendingChanges: true
          })
        } else {
          set({ tiles: data.tiles, fillerText: data.fillerText, theme, isLoading: false, isInitialized: true })
        }

        useShareStore.getState().initFromTilesData(data.sharing)
      } catch (error) {
        console.error('Failed to initialize tiles:', error)

        // Try to load from offline queue
        const pending = offlineQueue.getPending()
        if (pending) {
          const theme = (pending.theme as ThemeId) || DEFAULT_THEME
          applyTheme(theme)
          set({
            tiles: pending.tiles,
            fillerText: pending.fillerText,
            theme,
            isLoading: false,
            isInitialized: true,
            offline: true,
            pendingChanges: true
          })
        } else {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to load tiles'
          })
        }
      }
    },

    loadTiles: async () => {
      set({ isLoading: true, error: null })

      try {
        const data = await driveStorage.loadData()
        const theme = (data.theme as ThemeId) || DEFAULT_THEME
        if (theme === 'auto') {
          applyTheme(DEFAULT_THEME)
        } else {
          applyTheme(theme)
        }
        set({ tiles: data.tiles, fillerText: data.fillerText, theme, isLoading: false })
      } catch (error) {
        set({
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load tiles'
        })
      }
    },

    updateTile: (tileUpdate) => {
      const { tiles } = get()
      const updatedTiles = updateTile(tiles, tileUpdate)

      set({ tiles: updatedTiles, saveStatus: 'saving' })
      debouncedSave()
    },

    setFillerText: (text: string) => {
      set({ fillerText: text, saveStatus: 'saving' })
      debouncedSave()
    },

    setTheme: (newTheme: ThemeId) => {
      if (newTheme === 'auto') {
        const autoTheme = useAutoThemeStore.getState().autoTheme
        if (autoTheme) applyTheme('auto', autoTheme)
        else applyTheme(DEFAULT_THEME) // Fallback until computed
      } else {
        applyTheme(newTheme)
      }
      set({ theme: newTheme, saveStatus: 'saving' })
      debouncedSave()
    },

    saveTiles: async () => {
      const { tiles, fillerText, theme } = get()
      const { isPublished } = useShareStore.getState()

      set({ saveStatus: 'saving' })

      try {
        const sharing = isPublished ? { published: true } : undefined
        await driveStorage.saveData({ version: 2, tiles, fillerText, theme, sharing })
        set({ saveStatus: 'saved', offline: false, pendingChanges: false })
        offlineQueue.clear()
      } catch (error) {
        offlineQueue.enqueue(tiles, fillerText, theme)
        set({
          saveStatus: 'error',
          offline: true,
          pendingChanges: true,
          error: error instanceof Error ? error.message : 'Failed to save'
        })
      }
    },

    getTileById: (id) => {
      return get().tiles.find(tile => tile.id === id)
    },

    clearError: () => set({ error: null }),
  }
})
