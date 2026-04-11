import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useShareStore } from '@/state/shareStore'

interface ShareSheetProps {
  open: boolean
  onClose: () => void
}

export function ShareSheet({ open, onClose }: ShareSheetProps) {
  const { t } = useTranslation()
  const { isPublished, isPublishing, shareUrl, publish, unpublish, copyShareUrl } = useShareStore()
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const handlePublish = async () => {
    setError(null)
    try {
      await publish()
    } catch {
      setError(t('share.error'))
    }
  }

  const handleUnpublish = async () => {
    setError(null)
    try {
      await unpublish()
    } catch {
      setError(t('share.error'))
    }
  }

  const handleCopy = async () => {
    await copyShareUrl()
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleNativeShare = async () => {
    if (shareUrl && navigator.share) {
      try {
        await navigator.share({
          title: 'ABC Challenge',
          url: shareUrl,
        })
      } catch {
        // User cancelled — ignore
      }
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-6 pt-3 rounded-t-2xl max-w-lg mx-auto"
        style={{
          background: 'linear-gradient(180deg, rgba(30,27,75,0.98) 0%, rgba(15,23,42,0.99) 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderBottom: 'none',
        }}
      >
        {/* Drag handle */}
        <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-4" />

        <h2 className="text-base font-bold text-white/90 mb-1.5">
          {isPublished ? t('share.published') : t('share.publishButton')}
        </h2>
        <p className="text-xs text-white/40 mb-4 leading-relaxed">
          {t('share.description')}
        </p>

        {error && (
          <div className="mb-3 p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-300 text-xs">{error}</p>
          </div>
        )}

        {!isPublished ? (
          /* Publish button */
          <button
            onClick={handlePublish}
            disabled={isPublishing}
            className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, var(--theme-g1), var(--theme-g2))',
            }}
          >
            {isPublishing ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {t('share.publishing')}
              </span>
            ) : (
              t('share.publishButton')
            )}
          </button>
        ) : (
          /* Published state — show URL + actions */
          <div className="space-y-3">
            {/* URL display */}
            <div
              className="flex items-center gap-2 p-2.5 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              <span className="flex-1 text-xs text-white/60 truncate font-mono">
                {shareUrl}
              </span>
              <button
                onClick={handleCopy}
                className="flex-shrink-0 px-3 py-1.5 rounded-md text-xs font-bold text-white transition-all"
                style={{
                  background: copied
                    ? 'rgba(var(--theme-done-rgb), 0.3)'
                    : 'rgba(var(--theme-g2-rgb), 0.2)',
                }}
              >
                {copied ? t('share.linkCopied') : t('share.copyLink')}
              </button>
            </div>

            {/* Native share (mobile) */}
            {typeof navigator.share === 'function' && (
              <button
                onClick={handleNativeShare}
                className="w-full py-2.5 rounded-xl text-sm font-bold text-white/80 transition-all"
                style={{ background: 'rgba(var(--theme-g2-rgb), 0.15)' }}
              >
                {t('share.shareVia')}
              </button>
            )}

            {/* Unpublish */}
            <button
              onClick={handleUnpublish}
              disabled={isPublishing}
              className="w-full py-2.5 rounded-xl text-xs text-white/40 hover:text-red-400 transition-colors disabled:opacity-50"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            >
              {isPublishing ? t('share.publishing') : t('share.unpublish')}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
