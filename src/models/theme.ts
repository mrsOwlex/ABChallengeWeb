export type ThemeId = 'aurora' | 'sunset' | 'ocean' | 'blossom' | 'auto'

export interface ThemeConfig {
  id: ThemeId
  labelKey: string
  // Three gradient stops (hex) — used for header, progress bar, filler, accents
  gradient: [string, string, string]
  // Completed tile accent (hex)
  done: string
  // Idea tile accent (hex)
  idea: string
  // Body background gradient (three hex stops)
  bg: [string, string, string]
  // Preview swatch colors for the picker
  swatch: [string, string]
}

type StaticThemeId = Exclude<ThemeId, 'auto'>
export const THEMES: Record<StaticThemeId, ThemeConfig> = {
  aurora: {
    id: 'aurora',
    labelKey: 'theme.aurora',
    gradient: ['#a78bfa', '#60a5fa', '#34d399'],
    done: '#34d399',
    idea: '#fbbf24',
    bg: ['#0f172a', '#1e1b4b', '#172554'],
    swatch: ['#a78bfa', '#34d399'],
  },
  sunset: {
    id: 'sunset',
    labelKey: 'theme.sunset',
    gradient: ['#fb923c', '#f472b6', '#a78bfa'],
    done: '#fb923c',
    idea: '#fde047',
    bg: ['#1a0e0a', '#2d1320', '#1a0e1a'],
    swatch: ['#fb923c', '#f472b6'],
  },
  ocean: {
    id: 'ocean',
    labelKey: 'theme.ocean',
    gradient: ['#22d3ee', '#3b82f6', '#6366f1'],
    done: '#22d3ee',
    idea: '#fbbf24',
    bg: ['#0a1628', '#0c2d4a', '#0f172a'],
    swatch: ['#22d3ee', '#3b82f6'],
  },
  blossom: {
    id: 'blossom',
    labelKey: 'theme.blossom',
    gradient: ['#f472b6', '#e879f9', '#a78bfa'],
    done: '#f472b6',
    idea: '#fde68a',
    bg: ['#1a0a1e', '#2d1242', '#1e1b4b'],
    swatch: ['#f472b6', '#e879f9'],
  },
}

export const DEFAULT_THEME: ThemeId = 'aurora'
export const THEME_IDS = Object.keys(THEMES) as StaticThemeId[]

/** Convert hex to "r, g, b" string for use in rgba() */
export function hexToRgb(hex: string): string {
  const n = parseInt(hex.slice(1), 16)
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`
}

/** Apply theme as CSS custom properties on document.body */
export function applyTheme(id: ThemeId, override?: ThemeConfig): void {
  const t = id === 'auto' ? override! : THEMES[id as StaticThemeId]
  if (!t) return
  const s = document.body.style

  s.setProperty('--theme-g1', t.gradient[0])
  s.setProperty('--theme-g2', t.gradient[1])
  s.setProperty('--theme-g3', t.gradient[2])
  s.setProperty('--theme-done', t.done)
  s.setProperty('--theme-done-rgb', hexToRgb(t.done))
  s.setProperty('--theme-idea', t.idea)
  s.setProperty('--theme-idea-rgb', hexToRgb(t.idea))
  s.setProperty('--theme-g1-rgb', hexToRgb(t.gradient[0]))
  s.setProperty('--theme-g2-rgb', hexToRgb(t.gradient[1]))
  s.setProperty('--theme-g3-rgb', hexToRgb(t.gradient[2]))

  s.background = `linear-gradient(145deg, ${t.bg[0]} 0%, ${t.bg[1]} 40%, ${t.bg[2]} 100%)`
}
