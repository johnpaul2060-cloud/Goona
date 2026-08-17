// Category accent theme — ONE source of truth for batch-category theming.
// Only the ACCENT varies per model; the neutral base (background, cards,
// text, layout) is identical everywhere and untouched by this map.
//
//   flock       → green (existing brand — unchanged)
//   individual  → earthy amber/terracotta (warm, livestock/land)
//   breeder     → deep teal (premium, specialized — BreederPro)
//
// Semantic colors (money red/green by direction, alerts/warnings, egg
// grading, gender coding, per-metric analytics) are NOT driven by this map.

export type BatchModelKey = 'flock' | 'individual' | 'breeder'

export interface CategoryAccent {
  key: BatchModelKey
  label: string
  /** Primary accent — buttons, links, active pills, selected states. */
  accent: string
  /** Darker shade — gradient ends, pressed/filled states. */
  accentDark: string
  /** Light tint — badge / pill / chip backgrounds. */
  accentLight: string
  /** Very light translucent tint — icon chips. */
  accentSoft: string
  /** Text/icon color on accent surfaces (must contrast on accent + gradient). */
  onAccent: string
  /** Bright pop color — hero ring, progress bar, live dot, key highlight numbers. */
  highlight: string
  /** Translucent highlight — ring halo / glow layers. */
  highlightSoft: string
  /** Ambient hero glow. */
  glow: string
  /** Glass-tile shadow tint. */
  shadow: string
  /** Hero gradient surface. */
  gradient: readonly [string, string, string, string]
}

export const CATEGORY_THEME: Record<BatchModelKey, CategoryAccent> = {
  flock: {
    key: 'flock',
    label: 'Flock',
    accent: '#2E7D32',
    accentDark: '#1E7A3D',
    accentLight: '#E8F5E9',
    accentSoft: 'rgba(46,125,50,0.10)',
    onAccent: '#FFFFFF',
    highlight: '#AEEA00',
    highlightSoft: 'rgba(174,234,0,0.18)',
    glow: 'rgba(212,255,77,0.10)',
    shadow: '#062A17',
    gradient: ['#0C3A24', '#17663A', '#2E8B43', '#3FA345'],
  },
  individual: {
    key: 'individual',
    label: 'Individual',
    accent: '#C05F2E',
    accentDark: '#8A4519',
    accentLight: '#FBEADB',
    accentSoft: 'rgba(192,95,46,0.10)',
    onAccent: '#FFFFFF',
    highlight: '#FFC46B',
    highlightSoft: 'rgba(255,196,107,0.20)',
    glow: 'rgba(255,196,107,0.14)',
    shadow: '#2A1708',
    gradient: ['#47260F', '#6E3A16', '#9A5220', '#C06A31'],
  },
  breeder: {
    key: 'breeder',
    label: 'Breeder',
    accent: '#0F766E',
    accentDark: '#0B5B55',
    accentLight: '#E0F4F2',
    accentSoft: 'rgba(15,118,110,0.10)',
    onAccent: '#FFFFFF',
    highlight: '#5EEAD4',
    highlightSoft: 'rgba(94,234,212,0.20)',
    glow: 'rgba(94,234,212,0.12)',
    shadow: '#03201F',
    gradient: ['#052B31', '#0A3D44', '#0F5960', '#16757C'],
  },
}

/** Returns the accent set for a batch model; defaults to the flock (green) base. */
export function categoryTheme(model?: string | null): CategoryAccent {
  return CATEGORY_THEME[model as BatchModelKey] ?? CATEGORY_THEME.flock
}
