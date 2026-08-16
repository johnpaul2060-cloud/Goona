import type { BreederEggRecord } from '../store/useBreederEggStore'

/**
 * Breeder egg derivations (Phase 2 — BreederPro).
 * Pure helpers only: components must call these inside useMemo, never in
 * Zustand selectors, and never persist derived values (hen-day %, settable %,
 * weekly totals all stay live).
 *
 * Denomination rules:
 *  - hen-day production ALWAYS divides by (mortality-adjusted currentHens ×
 *    daysInPeriod) — the calendar days the egg total spans, never hens alone.
 *    Weekly card = × 7; single day = × 1; a custom range = its day count.
 *  - settable eggs: grading.settable when the farmer graded, else totalEggs.
 *  - every division is zero-guarded (no NaN / Infinity).
 */

export interface BreederEggGradingFields {
  key: 'settable' | 'dirty' | 'cracked' | 'small' | 'doubleYolk' | 'abnormal' | 'floor' | 'rejected'
  label: string
}

export const GRADING_FIELDS: BreederEggGradingFields[] = [
  { key: 'settable', label: 'Settable / Clean' },
  { key: 'dirty', label: 'Dirty' },
  { key: 'cracked', label: 'Cracked' },
  { key: 'small', label: 'Small' },
  { key: 'doubleYolk', label: 'Double Yolk' },
  { key: 'abnormal', label: 'Abnormal' },
  { key: 'floor', label: 'Floor' },
  { key: 'rejected', label: 'Rejected' },
]

/** Local "YYYY-MM-DD" date key from a JS Date (safe for lexicographic sort). */
export function isoDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayIso(now: number = Date.now()): string {
  return isoDateStr(new Date(now))
}

/** Local Date from a "YYYY-MM-DD" key (no UTC shift). */
export function parseIsoDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map((v) => parseInt(v, 10))
  if (!y || !m || !d) return new Date()
  return new Date(y, m - 1, d)
}

/** Monday of the current week, as "YYYY-MM-DD" (mirrors the this-week preset). */
export function weekStartIso(now: number = Date.now()): string {
  const d = new Date(now)
  const dow = d.getDay()
  const diff = d.getDate() - dow + (dow === 0 ? -6 : 1)
  return isoDateStr(new Date(d.getFullYear(), d.getMonth(), diff))
}

/** Whether the farmer entered a grading breakdown (used for the "graded" tag). */
export function hasGradingBreakdown(record: BreederEggRecord): boolean {
  const g = record.grading
  if (!g) return false
  return Object.values(g).some((v) => (v ?? 0) > 0)
}

/**
 * Settable eggs for a record: the graded clean/settable count when grading
 * was entered, otherwise the total. This is the reserved Phase 3 seam feed.
 */
export function computeSettable(record: BreederEggRecord): number {
  const settable = record.grading?.settable
  return settable != null ? Math.max(0, settable) : record.totalEggs
}

/** settable / totalEggs × 100 — zero-guarded. */
export function computeSettablePct(totalEggs: number, settable: number): number {
  if (totalEggs <= 0) return 0
  return Math.round((settable / totalEggs) * 1000) / 10
}

/**
 * Hen-day production %.
 * Single day = eggs / currentHens × 100.
 * Period     = periodEggs / (currentHens × daysInPeriod) × 100.
 * Always currentHens (mortality-adjusted), never the opening hen count —
 * and always the CALENDAR period length, never "days with records": a single
 * day's log must not inflate a weekly figure (× 1 instead of × 7).
 */
export function computeHenDayPct(currentHens: number, eggs: number, daysInPeriod: number): number {
  if (currentHens <= 0 || eggs <= 0 || daysInPeriod <= 0) return 0
  return Math.round((eggs / (currentHens * daysInPeriod)) * 1000) / 10
}

/** Calendar days in the "this week" window (Mon → Sun) — the hen-day period
 *  denominator on the weekly card, regardless of how many days were logged. */
const WEEK_HEN_DAY_DAYS = 7

export interface BreederEggSummary {
  /** eggs collected within the current week (Mon → today) */
  weeklyEggs: number
  /** distinct days with a record in the current week (display guard only) */
  weeklyDaysActive: number
  /** periodEggs / (currentHens × 7) × 100 — calendar week, never days logged */
  weeklyHenDayPct: number
  weeklySettable: number
  weeklySettablePct: number
  /** all-time totals for the flock */
  totalEggs: number
  /** reserved seam: running settable total → Phase 3 hatch batches */
  totalSettable: number
  /** newest first — for the daily record list */
  list: BreederEggRecord[]
}

export function summarizeBreederEggs(
  records: BreederEggRecord[],
  currentHens: number,
  now: number = Date.now(),
): BreederEggSummary {
  const start = weekStartIso(now)
  const end = todayIso(now)

  let weeklyEggs = 0
  let weeklySettable = 0
  let totalEggs = 0
  let totalSettable = 0
  const weeklyDates = new Set<string>()

  for (const r of records) {
    const settable = computeSettable(r)
    totalEggs += r.totalEggs
    totalSettable += settable
    if (r.date >= start && r.date <= end) {
      weeklyEggs += r.totalEggs
      weeklySettable += settable
      weeklyDates.add(r.date)
    }
  }

  const weeklyDaysActive = weeklyDates.size

  return {
    weeklyEggs,
    weeklyDaysActive,
    weeklyHenDayPct: computeHenDayPct(currentHens, weeklyEggs, WEEK_HEN_DAY_DAYS),
    weeklySettable,
    weeklySettablePct: computeSettablePct(weeklyEggs, weeklySettable),
    totalEggs,
    totalSettable,
    list: [...records].sort((a, b) => (a.date === b.date ? b.createdAt - a.createdAt : b.date < a.date ? -1 : 1)),
  }
}