import { create } from 'zustand'
import { TilesData } from '@/models/tile'
import { useTilesStore } from './tilesStore'
import { driveStorage } from '@/services/driveStorage'

interface ShareState {
  isPublished: boolean
  isPublishing: boolean
  shareUrl: string | null

  initFromTilesData: (sharing?: { published: boolean; publishedAt?: string }) => void
  publish: () => Promise<void>
  unpublish: () => Promise<void>
  copyShareUrl: () => Promise<void>
}

function buildShareUrl(): string | null {
  const fileId = driveStorage.getTilesFileId()
  if (!fileId) return null
  return `${window.location.origin}/view/${fileId}`
}

function buildTilesData(sharing: TilesData['sharing']): TilesData {
  const { tiles, fillerText, theme } = useTilesStore.getState()
  return { version: 2, tiles, fillerText, theme, sharing }
}

export const useShareStore = create<ShareState>((set, get) => ({
  isPublished: false,
  isPublishing: false,
  shareUrl: null,

  initFromTilesData: (sharing) => {
    const published = sharing?.published ?? false
    set({
      isPublished: published,
      shareUrl: published ? buildShareUrl() : null,
    })
  },

  publish: async () => {
    set({ isPublishing: true })

    try {
      const { tiles } = useTilesStore.getState()
      await driveStorage.shareAllPublic(tiles)
      await driveStorage.saveData(buildTilesData({ published: true, publishedAt: new Date().toISOString() }))

      set({
        isPublished: true,
        isPublishing: false,
        shareUrl: buildShareUrl(),
      })
    } catch (error) {
      console.error('Failed to publish:', error)
      set({ isPublishing: false })
      throw error
    }
  },

  unpublish: async () => {
    set({ isPublishing: true })

    try {
      const { tiles } = useTilesStore.getState()
      await driveStorage.unshareAll(tiles)
      await driveStorage.saveData(buildTilesData({ published: false }))

      set({
        isPublished: false,
        isPublishing: false,
        shareUrl: null,
      })
    } catch (error) {
      console.error('Failed to unpublish:', error)
      set({ isPublishing: false })
      throw error
    }
  },

  copyShareUrl: async () => {
    const { shareUrl } = get()
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl)
    }
  },
}))
