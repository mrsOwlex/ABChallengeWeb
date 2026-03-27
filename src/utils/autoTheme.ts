import type { ThemeConfig } from '@/models/theme'
import { rgbToHex } from './colorExtract'

type HSL = [number, number, number]

function hexToRgbTuple(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function rgbToHsl(r: number, g: number, b: number): HSL {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else h = ((r - g) / d + 4) / 6
  return [h * 360, s, l]
}

function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let r = 0, g = 0, b = 0
  if (h < 60) { r = c; g = x }
  else if (h < 120) { r = x; g = c }
  else if (h < 180) { g = c; b = x }
  else if (h < 240) { g = x; b = c }
  else if (h < 300) { r = x; b = c }
  else { r = c; b = x }
  return rgbToHex(
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  )
}

/** Find the color closest to a target hue range, or shift the most saturated color */
function findOrShift(
  colors: Array<{ hex: string; hsl: HSL }>,
  hueMin: number,
  hueMax: number,
  fallbackSaturation: number,
): string {
  // Look for a color in the hue range
  const inRange = colors.filter(c => c.hsl[0] >= hueMin && c.hsl[0] <= hueMax)
  if (inRange.length > 0) {
    // Pick the most saturated one in range
    inRange.sort((a, b) => b.hsl[1] - a.hsl[1])
    const [h, s, l] = inRange[0].hsl
    return hslToHex(h, Math.max(s, 0.5), Math.min(Math.max(l, 0.4), 0.6))
  }

  // Shift the most vibrant color toward target hue
  const targetHue = (hueMin + hueMax) / 2
  const best = colors.reduce((a, b) => b.hsl[1] > a.hsl[1] ? b : a)
  return hslToHex(targetHue, Math.max(best.hsl[1], fallbackSaturation, 0.5), 0.5)
}

/** Pad colors array to at least `count` by hue-shifting existing colors */
function padColors(hexColors: string[], count: number): string[] {
  const result = [...hexColors]
  if (result.length === 0) return []
  let i = 0
  while (result.length < count) {
    const [r, g, b] = hexToRgbTuple(result[i % hexColors.length])
    const [h, s, l] = rgbToHsl(r, g, b)
    result.push(hslToHex(h + 60 * (result.length - hexColors.length + 1), s, l))
    i++
  }
  return result
}

/**
 * Generate a full ThemeConfig from dominant colors extracted from images.
 * Returns a config compatible with the existing theme system.
 */
export function generateAutoTheme(dominantColors: string[]): ThemeConfig {
  const padded = padColors(dominantColors, 5)

  const analyzed = padded.map(hex => {
    const [r, g, b] = hexToRgbTuple(hex)
    return { hex, hsl: rgbToHsl(r, g, b) }
  })

  // Sort by hue for gradient coherence
  const byHue = [...analyzed].sort((a, b) => a.hsl[0] - b.hsl[0])

  // Pick 3 well-spaced colors for gradient
  const gradient: [string, string, string] = byHue.length >= 3
    ? [
        hslToHex(byHue[0].hsl[0], Math.max(byHue[0].hsl[1], 0.5), Math.min(Math.max(byHue[0].hsl[2], 0.45), 0.65)),
        hslToHex(byHue[Math.floor(byHue.length / 2)].hsl[0], Math.max(byHue[Math.floor(byHue.length / 2)].hsl[1], 0.5), Math.min(Math.max(byHue[Math.floor(byHue.length / 2)].hsl[2], 0.45), 0.65)),
        hslToHex(byHue[byHue.length - 1].hsl[0], Math.max(byHue[byHue.length - 1].hsl[1], 0.5), Math.min(Math.max(byHue[byHue.length - 1].hsl[2], 0.45), 0.65)),
      ]
    : [padded[0], padded[1] || padded[0], padded[2] || padded[0]]

  // Done color: green-ish (hue 90-160)
  const done = findOrShift(analyzed, 90, 160, 0.6)

  // Idea color: amber-ish (hue 30-60)
  const idea = findOrShift(analyzed, 30, 60, 0.6)

  // Background: darkened versions of gradient
  const bg: [string, string, string] = gradient.map((hex, i) => {
    const [r, g, b] = hexToRgbTuple(hex)
    const [h, s] = rgbToHsl(r, g, b)
    const lOffset = [0, 0.02, 0.04][i]
    return hslToHex(h, s * 0.4, 0.08 + lOffset)
  }) as [string, string, string]

  return {
    id: 'auto' as ThemeConfig['id'],
    labelKey: 'theme.auto',
    gradient,
    done,
    idea,
    bg,
    swatch: [gradient[0], gradient[2]],
  }
}
