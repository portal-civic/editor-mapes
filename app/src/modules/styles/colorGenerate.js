// HSL color generation helpers

function hexToHsl(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return [h * 360, s * 100, l * 100]
}

function hslToHex(h, s, l) {
  h /= 360; s /= 100; l /= 100
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  let r, g, b
  if (s === 0) {
    r = g = b = l
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }
  return '#' + [r, g, b].map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('')
}

// Approximate perceptual distance between two HSL colors [0..1]
function hslDist(a, b) {
  const dh = Math.min(Math.abs(a[0] - b[0]), 360 - Math.abs(a[0] - b[0])) / 360
  const ds = Math.abs(a[1] - b[1]) / 100
  const dl = Math.abs(a[2] - b[2]) / 100
  return Math.sqrt(dh * dh * 4 + ds * ds + dl * dl)
}

const INTENSITY_PRESETS = {
  soft:      { minDist: 0.06, lRange: [38, 62], sRange: [38, 68] },
  balanced:  { minDist: 0.10, lRange: [30, 65], sRange: [45, 80] },
  contrast:  { minDist: 0.15, lRange: [25, 70], sRange: [55, 90] },
}

/**
 * Given an array of seed hex colors and a target total count,
 * returns a new array of `count` colors. Seed colors are kept first;
 * additional colors are generated to harmonise and stay visually distinct.
 */
export function generateHarmoniousColors(seedColors, count, intensity = 'balanced') {
  if (count <= 0) return []
  const preset = INTENSITY_PRESETS[intensity] ?? INTENSITY_PRESETS.balanced
  const { minDist, lRange, sRange } = preset

  const validSeeds = seedColors.filter((c) => /^#[0-9a-f]{6}$/i.test(c))
  if (validSeeds.length === 0) validSeeds.push('#3b82f6')

  if (count <= validSeeds.length) return validSeeds.slice(0, count)

  const allHsl = validSeeds.map(hexToHsl)
  const result = [...validSeeds]
  const toGenerate = count - validSeeds.length

  // Phase 1: try random candidates with distance constraint
  let attempts = 0
  while (result.length < count && attempts < 2000) {
    attempts++
    const h = Math.random() * 360
    const s = sRange[0] + Math.random() * (sRange[1] - sRange[0])
    const l = lRange[0] + Math.random() * (lRange[1] - lRange[0])
    const candidate = [h, s, l]
    const minDistFromExisting = allHsl.reduce((m, e) => Math.min(m, hslDist(candidate, e)), Infinity)
    if (minDistFromExisting >= minDist) {
      allHsl.push(candidate)
      result.push(hslToHex(h, s, l))
    }
  }

  // Phase 2: golden-angle fallback for remaining slots (relaxed constraints)
  const baseIdx = result.length
  while (result.length < count) {
    const idx = baseIdx + (result.length - baseIdx)
    const h = ((validSeeds.length * 137.508 + idx * 137.508)) % 360
    const s = (sRange[0] + sRange[1]) / 2
    const l = (lRange[0] + lRange[1]) / 2 + (idx % 2 === 0 ? 8 : -8)
    result.push(hslToHex(h, Math.max(sRange[0], Math.min(sRange[1], s)), Math.max(lRange[0], Math.min(lRange[1], l))))
  }

  return result
}
