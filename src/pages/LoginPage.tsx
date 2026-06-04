import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/state/authStore'
import { LanguageToggle } from '@/components/LanguageToggle'

export default function LoginPage() {
  const { t } = useTranslation()
  const { signIn, isLoading, error, clearError, initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  const handleSignIn = () => {
    clearError()
    signIn()
  }

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <header className="p-4 flex items-center justify-between">
        <span
          className="text-sm font-bold tracking-wider uppercase"
          style={{
            background: 'linear-gradient(135deg, rgba(var(--theme-g1-rgb),0.7), rgba(var(--theme-g2-rgb),0.7), rgba(var(--theme-g3-rgb),0.7))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {t('app.title')}
        </span>
        <LanguageToggle />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-12">
        {/* Hero */}
        <div className="text-center mb-10 max-w-lg">
          <h1
            className="text-3xl sm:text-4xl font-black tracking-tight mb-3"
            style={{
              background: 'linear-gradient(135deg, var(--theme-g1), var(--theme-g2), var(--theme-g3))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {t('landing.headline')}
          </h1>
          <p className="text-white/50 text-sm sm:text-base font-medium tracking-wide">
            {t('landing.subline')}
          </p>
        </div>

        {/* Info sections */}
        <div className="w-full max-w-lg space-y-4 mb-10">
          {/* What is it */}
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5">
            <h2 className="text-sm font-bold text-white/70 uppercase tracking-wider mb-2">
              {t('landing.whatIsIt')}
            </h2>
            <p className="text-white/40 text-sm leading-relaxed">
              {t('landing.whatIsItText')}
            </p>
            <p className="text-white/30 text-xs mt-3 italic">
              {t('landing.examples')}
            </p>
          </div>

          {/* Why track here */}
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5">
            <h2 className="text-sm font-bold text-white/70 uppercase tracking-wider mb-2">
              {t('landing.whyTitle')}
            </h2>
            <p className="text-white/40 text-sm leading-relaxed">
              {t('landing.whyText')}
            </p>
          </div>

          {/* Privacy */}
          <div className="rounded-xl p-5" style={{ background: 'rgba(var(--theme-done-rgb),0.04)', border: '1px solid rgba(var(--theme-done-rgb),0.1)' }}>
            <h2 className="text-sm font-bold uppercase tracking-wider mb-2 flex items-center gap-2" style={{ color: 'rgba(var(--theme-done-rgb),0.7)' }}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              {t('landing.privacyTitle')}
            </h2>
            <p className="text-white/40 text-sm leading-relaxed">
              {t('landing.privacyText')}
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="w-full max-w-lg">
          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-400/20 rounded-xl">
              <p className="text-red-400 text-sm">{t('auth.loginError')}</p>
              <p className="text-red-400/60 text-xs mt-1">{error}</p>
            </div>
          )}

          <button
            onClick={handleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, rgba(var(--theme-g1-rgb),0.25), rgba(var(--theme-g2-rgb),0.25), rgba(var(--theme-g3-rgb),0.25))',
              border: '1.5px solid rgba(var(--theme-g1-rgb),0.2)',
            }}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {t('auth.loggingIn')}
              </>
            ) : (
              <>
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                {t('auth.loginWithGoogle')}
              </>
            )}
          </button>

          <p className="text-white/25 text-xs text-center mt-3">
            {t('landing.ctaSubtext')}
          </p>
        </div>
      </main>
    </div>
  )
}
