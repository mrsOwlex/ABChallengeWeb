/** Canvas-based dominant color extraction using median-cut quantization */

type RGB = [number, number, number]

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

function samplePixels(img: HTMLImageElement, maxSamples: number): RGB[] {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  ctx.drawImage(img, 0, 0)

  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
  const totalPixels = data.length / 4
  const step = Math.max(1, Math.floor(totalPixels / maxSamples))

  const pixels: RGB[] = []
  for (let i = 0; i < data.length; i += step * 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const a = data[i + 3]

    // Skip transparent pixels
    if (a < 128) continue

    // Skip near-black and near-white
    const lightness = (r + g + b) / 3
    if (lightness < 25 || lightness > 230) continue

    pixels.push([r, g, b])
  }
  return pixels
}

function colorRange(pixels: RGB[], channel: 0 | 1 | 2): number {
  let min = 255, max = 0
  for (const p of pixels) {
    if (p[channel] < min) min = p[channel]
    if (p[channel] > max) max = p[channel]
  }
  return max - min
}

function averageColor(pixels: RGB[]): RGB {
  let r = 0, g = 0, b = 0
  for (const p of pixels) {
    r += p[0]; g += p[1]; b += p[2]
  }
  const n = pixels.length
  return [Math.round(r / n), Math.round(g / n), Math.round(b / n)]
}

function medianCut(pixels: RGB[], depth: number): RGB[] {
  if (depth === 0 || pixels.length === 0) {
    return pixels.length > 0 ? [averageColor(pixels)] : []
  }

  // Find channel with greatest range
  const rRange = colorRange(pixels, 0)
  const gRange = colorRange(pixels, 1)
  const bRange = colorRange(pixels, 2)

  let channel: 0 | 1 | 2 = 0
  if (gRange >= rRange && gRange >= bRange) channel = 1
  else if (bRange >= rRange && bRange >= gRange) channel = 2

  // Sort by that channel and split at median
  pixels.sort((a, b) => a[channel] - b[channel])
  const mid = Math.floor(pixels.length / 2)

  return [
    ...medianCut(pixels.slice(0, mid), depth - 1),
    ...medianCut(pixels.slice(mid), depth - 1),
  ]
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')
}

/**
 * Extract dominant colors from a list of image blob URLs.
 * Returns hex color strings sorted by vibrancy (saturation * lightness balance).
 */
export async function extractDominantColors(
  imageUrls: string[],
  count = 6,
): Promise<string[]> {
  if (imageUrls.length === 0) return []

  const allPixels: RGB[] = []
  const samplesPerImage = Math.max(500, Math.floor(2000 / imageUrls.length))

  const results = await Promise.allSettled(
    imageUrls.map(async url => {
      const img = await loadImage(url)
      return samplePixels(img, samplesPerImage)
    }),
  )

  for (const r of results) {
    if (r.status === 'fulfilled') {
      allPixels.push(...r.value)
    }
  }

  if (allPixels.length === 0) return []

  // Median cut depth: 2^depth = target colors, we want more than count then pick best
  const depth = Math.ceil(Math.log2(count * 2))
  const palette = medianCut(allPixels, depth)

  // Score by vibrancy: prefer saturated, mid-lightness colors
  const scored = palette.map(([r, g, b]) => {
    const max = Math.max(r, g, b) / 255
    const min = Math.min(r, g, b) / 255
    const l = (max + min) / 2
    const s = max === min ? 0 : l > 0.5
      ? (max - min) / (2 - max - min)
      : (max - min) / (max + min)
    // Prefer saturated colors with lightness 0.3-0.7
    const lightnessBonus = 1 - Math.abs(l - 0.5) * 2
    const score = s * 0.7 + lightnessBonus * 0.3
    return { rgb: [r, g, b] as RGB, score }
  })

  scored.sort((a, b) => b.score - a.score)

  return scored
    .slice(0, count)
    .map(({ rgb }) => rgbToHex(rgb[0], rgb[1], rgb[2]))
}
