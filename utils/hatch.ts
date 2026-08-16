import type { HatchBatch, HatchStatus } from '../store/useHatchStore'

/**
 * Hatch batch derivations (Phase 3 — BreederPro, farmer POV).
 * Pure helpers only: components must call these inside useMemo, never in
 * Zustand selectors, and never persist derived values (expected hatch date,
 * countdown, fertility %, hatch success % all stay live).
 */

const DAY_MS = 24 * 60 * 60 * 1000

/** Species incubation defaults — editable at set-eggs time. */
const INCUBATION_DAYS_DEFAULT = 21
const TURKEY_DAYS = 28

export function incubationDaysFor(livestockType: string): number {
  return /turkey/i.test(livestockType) ? TURKEY_DAYS : INCUBATION_DAYS_DEFAULT
}

/** Local "YYYY-MM-DD" key from a JS Date (safe for lexicographic sort). */
export function isoDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayIso(now: number = Date.now()): string {
  return isoDateStr(new Date(now))
}

/** Parse a "YYYY-MM-DD" key into a LOCAL Date (no UTC shift) at midnight. */
export function parseIsoDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map((v) => parseInt(v, 10))
  if (!y || !m || !d) return new Date()
  return new Date(y, m - 1, d)
}

/** expectedHatchDate = setDate + incubationDays — DERIVED, never stored. */
export function expectedHatchIso(hatch: Pick<HatchBatch, 'setDate' | 'incubationDays'>): string {
  const d = parseIsoDate(hatch.setDate)
  d.setDate(d.getDate() + hatch.incubationDays)
  return isoDateStr(d)
}

/** Calendar days between today and hatch due (0 when due/past). */
export function daysToHatch(hatch: Pick<HatchBatch, 'setDate' | 'incubationDays'>, now: number = Date.now()): number {
  const due = parseIsoDate(expectedHatchIso(hatch)).getTime()
  const today = parseIsoDate(todayIso(now)).getTime()
  return Math.max(0, Math.round((due - today) / DAY_MS))
}

export function countdownLabel(hatch: HatchBatch, now: number = Date.now()): string {
  if (hatch.status === 'hatched') return 'Hatched'
  if (hatch.status === 'failed') return 'Failed'
  const due = parseIsoDate(expectedHatchIso(hatch)).getTime()
  const today = parseIsoDate(todayIso(now)).getTime()
  const diff = Math.round((due - today) / DAY_MS)
  if (diff === 0) return 'Hatch due today'
  if (diff > 0) return `${diff} day${diff === 1 ? '' : 's'} to hatch`
  return `Overdue by ${Math.abs(diff)}d`
}

/**
 * Auto-suggest sequential name "{flock}-H001". Picks up the highest existing
 * "-H###" suffix for the flock so renamed batches don't collide.
 */
export function nextHatchName(existing: HatchBatch[], flockName: string): string {
  let max = 0
  const re = /-H(\d+)$/i
  for (const h of existing) {
    const m = h.name.match(re)
    if (m) max = Math.max(max, parseInt(m[1], 10))
  }
  return `${flockName}-H${String(max + 1).padStart(3, '0')}`
}

export interface HatchKpis {
  expectedHatchDate: string
  /** (eggsSet − clearEggs) / eggsSet × 100 — only when trackFertility + break-out recorded */
  fertilityPct: number | null
  /** chicksHatched / eggsSet × 100 — only once the hatch is recorded */
  hatchSuccessPct: number | null
}

/** ALL divisions zero-guarded. null = not applicable yet (UI shows "—"). */
export function computeHatchKpis(hatch: HatchBatch): HatchKpis {
  let fertilityPct: number | null = null
  let hatchSuccessPct: number | null = null

  if (hatch.trackFertility && hatch.clearEggs != null && hatch.eggsSet > 0) {
    fertilityPct = Math.round(((hatch.eggsSet - hatch.clearEggs) / hatch.eggsSet) * 1000) / 10
  }
  if (hatch.status !== 'incubating' && hatch.chicksHatched != null && hatch.eggsSet > 0) {
    hatchSuccessPct = Math.round((hatch.chicksHatched / hatch.eggsSet) * 1000) / 10
  }

  return { expectedHatchDate: expectedHatchIso(hatch), fertilityPct, hatchSuccessPct }
}

export interface HatchStatusMeta {
  label: string
  color: string
  bg: string
}

export function hatchStatusMeta(status: HatchStatus): HatchStatusMeta {
  switch (status) {
    case 'hatched':
      return { label: 'Hatched', color: '#16A34A', bg: '#F0FDF4' }
    case 'failed':
      return { label: 'Failed', color: '#DC2626', bg: '#FEF2F2' }
    default:
      return { label: 'Incubating', color: '#D97706', bg: '#FFFBEB' }
  }
}