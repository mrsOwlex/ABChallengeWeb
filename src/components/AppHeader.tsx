import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/state/authStore'
import { useShareStore } from '@/state/shareStore'
import { LanguageToggle } from './LanguageToggle'
import { ThemePicker } from './ThemePicker'
import { ShareSheet } from './ShareSheet'

export function AppHeader() {
  const { t } = useTranslation()
  const { signOut } = useAuthStore()
  const { isPublished } = useShareStore()
  const [shareOpen, setShareOpen] = useState(false)

  return (
    <>
      <header className="px-4 pt-2.5 pb-1 flex items-center justify-between">
        <h1
          className="text-lg font-black tracking-wider uppercase"
          style={{
            background: 'linear-gradient(135deg, var(--theme-g1), var(--theme-g2), var(--theme-g3))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {t('app.title')}
        </h1>

        <div className="flex items-center gap-3">
          {/* Share button */}
          <button
            onClick={() => setShareOpen(true)}
            className="relative p-1.5 rounded-md transition-all text-white/40 hover:text-white/70"
            aria-label={t('share.publishButton')}
            style={isPublished ? { color: 'var(--theme-done)' } : undefined}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            {isPublished && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full" style={{ background: 'var(--theme-done)' }} />
            )}
          </button>

          <ThemePicker />
          <LanguageToggle />
          <button
            onClick={signOut}
            className="text-[0.7rem] text-white/40 hover:text-white/70 px-2 py-0.5 transition-colors"
          >
            {t('auth.logout')}
          </button>
        </div>
      </header>

      <ShareSheet open={shareOpen} onClose={() => setShareOpen(false)} />
    </>
  )
}
