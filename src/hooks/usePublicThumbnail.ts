import { useState, useEffect } from 'react'
import { getFileBlobPublic } from '@/services/driveApi'

/** In-memory cache for publicly loaded thumbnails (viewer only). */
const publicCache = new Map<string, string>()

export function usePublicThumbnail(fileId: string | null): {
  url: string | null
  loading: boolean
} {
  const [state, setState] = useState<{ url: string | null; loading: boolean }>({
    url: fileId ? publicCache.get(fileId) ?? null : null,
    loading: !!fileId && !publicCache.has(fileId),
  })

  useEffect(() => {
    if (!fileId) {
      setState({ url: null, loading: false })
      return
    }

    // Already cached
    if (publicCache.has(fileId)) {
      setState({ url: publicCache.get(fileId)!, loading: false })
      return
    }

    let cancelled = false

    async function load() {
      try {
        setState(prev => ({ ...prev, loading: true }))
        const blob = await getFileBlobPublic(fileId!)
        const objectUrl = URL.createObjectURL(blob)
        publicCache.set(fileId!, objectUrl)
        if (!cancelled) setState({ url: objectUrl, loading: false })
      } catch {
        if (!cancelled) setState({ url: null, loading: false })
      }
    }

    load()
    return () => { cancelled = true }
  }, [fileId])

  return state
}
