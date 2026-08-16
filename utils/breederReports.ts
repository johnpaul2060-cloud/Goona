import type { HatchBatch } from '../store/useHatchStore'
import type { BreederEggRecord } from '../store/useBreederEggStore'
import { computeHenDayPct, computeSettable, computeSettablePct, parseIsoDate } from './breederEggs'

/**
 * Breeder flock REPORTS (Phase 4 — BreederPro, farmer POV).
 * READ-ONLY: every value here is derived inside useMemo at component sites —
 * nothing is ever persisted, and no new data model / records are created.
 *
 * Aggregation rules (weighted, never averaged percentages):
 *  - overall hatch success  = Σ chicksHatched / Σ eggsSet × 100  (ALL recorded hatches)
 *  - overall fertility      = Σ fertileEggs / Σ eggsSet × 100    (ONLY batches with
 *    trackFertility + a break-out — success-only batches are excluded entirely;
 *    missing fertility is NEVER treated as 0)
 *  - overall hatchability   = Σ chicksHatched / Σ fertileEggs × 100 (same tracked subset)
 *  - every division is zero-guarded (null = not applicable → UI shows "—")
 */

const DAY_MS = 24 * 60 * 60 * 1000

const round1 = (v: number) => Math.round(v * 10) / 10

/** Fertile eggs for a tracked batch (eggsSet − clear / infertile). */
export function fertileEggs(hatch: HatchBatch): number | null {
  if (!hatch.trackFertility || hatch.clearEggs == null) return null
  return Math.max(0, hatch.eggsSet - hatch.clearEggs)
}

export interface WeightedHatchAggregates {
  /** batches with a recorded outcome (hatched + failed) */
  recordedBatches: number
  /** recorded batches where fertility was tracked (break-out entered) */
  trackedBatches: number
  totalEggsSet: number
  totalChicks: number
  overallHatchSuccessPct: number | null
  overallFertilityPct: number | null
  overallHatchabilityPct: number | null
  /** denominators of the tracked-only aggregates (for captions) */
  trackedEggsSet: number
  trackedFertileEggs: number
}

/** Weighted hatch aggregates across a flock's hatch batches. */
export function computeHatchAggregates(hatches: HatchBatch[]): WeightedHatchAggregates {
  let recordedBatches = 0
  let trackedBatches = 0
  let totalEggsSet = 0
  let totalChicks = 0
  let trackedEggsSet = 0
  let trackedFertileEggs = 0
  let trackedChicks = 0

  for (const h of hatches) {
    if (h.status === 'incubating') continue
    recordedBatches++
    totalEggsSet += h.eggsSet
    totalChicks += h.chicksHatched ?? 0

    const fertile = fertileEggs(h)
    if (fertile != null) {
      trackedBatches++
      trackedEggsSet += h.eggsSet
      trackedFertileEggs += fertile
      trackedChicks += h.chicksHatched ?? 0
    }
  }

  return {
    recordedBatches,
    trackedBatches,
    totalEggsSet,
    totalChicks,
    overallHatchSuccessPct: totalEggsSet > 0 ? round1((totalChicks / totalEggsSet) * 100) : null,
    overallFertilityPct: trackedEggsSet > 0 ? round1((trackedFertileEggs / trackedEggsSet) * 100) : null,
    overallHatchabilityPct: trackedFertileEggs > 0 ? round1((trackedChicks / trackedFertileEggs) * 100) : null,
    trackedEggsSet,
    trackedFertileEggs,
  }
}

export interface HatchComparisonRow {
  id: string
  name: string
  setDate: string
  status: 'incubating' | 'hatched' | 'failed'
  eggsSet: number
  chicksHatched: number
  hatchSuccessPct: number | null
  fertilityPct: number | null
  hatchabilityPct: number | null
  /** hatched and below the flock's weighted overall hatch success */
  belowAverage: boolean
}

export interface HatchComparison {
  /** newest set first — for spotting poor performers */
  rows: HatchComparisonRow[]
  aggregates: WeightedHatchAggregates
}

export function buildHatchComparison(hatches: HatchBatch[]): HatchComparison {
  const aggregates = computeHatchAggregates(hatches)
  const rows: HatchComparisonRow[] = hatches
    .map((h) => {
      const fertile = fertileEggs(h)
      const hatchSuccessPct =
        h.status !== 'incubating' && h.eggsSet > 0
          ? round1(((h.chicksHatched ?? 0) / h.eggsSet) * 100)
          : null
      const fertilityPct =
        fertile != null && h.eggsSet > 0 ? round1((fertile / h.eggsSet) * 100) : null
      const hatchabilityPct =
        fertile != null && fertile > 0 ? round1(((h.chicksHatched ?? 0) / fertile) * 100) : null
      return {
        id: h.id,
        name: h.name,
        setDate: h.setDate,
        status: h.status,
        eggsSet: h.eggsSet,
        chicksHatched: h.chicksHatched ?? 0,
        hatchSuccessPct,
        fertilityPct,
        hatchabilityPct,
        belowAverage:
          h.status === 'hatched' &&
          hatchSuccessPct != null &&
          aggregates.overallHatchSuccessPct != null &&
          hatchSuccessPct < aggregates.overallHatchSuccessPct,
      }
    })
    .sort((a, b) => (a.setDate === b.setDate ? 0 : a.setDate < b.setDate ? 1 : -1))
  return { rows, aggregates }
}

export interface WeeklyProduction {
  /** 1-based production week (W1 = week of the flock date) */
  weekIndex: number
  fromDate: string
  toDate: string
  eggs: number
  settable: number
  /** distinct days logged that week */
  daysActive: number
}

export interface ProductionSeries {
  /** continuous weeks 1..max logged week (gaps zero-filled so the chart reads over time) */
  weeks: WeeklyProduction[]
  activeWeeks: number
  totalEggs: number
  totalSettable: number
  peakWeek: number | null
  peakEggs: number
}

function weekIndexFor(dateIso: string, flockDate: string): number {
  const days = Math.floor((parseIsoDate(dateIso).getTime() - parseIsoDate(flockDate).getTime()) / DAY_MS)
  return Math.max(1, Math.floor(days / 7) + 1)
}

/** Weekly egg production aligned to flock age (week 1 = flock placed). */
export function buildProductionSeries(
  records: BreederEggRecord[],
  flockDate: string,
): ProductionSeries {
  const weeks = new Map<number, WeeklyProduction>()
  let maxWeek = 0
  let totalEggs = 0
  let totalSettable = 0

  for (const r of records) {
    const w = weekIndexFor(r.date, flockDate)
    maxWeek = Math.max(maxWeek, w)
    totalEggs += r.totalEggs
    totalSettable += computeSettable(r)
    let bucket = weeks.get(w)
    if (!bucket) {
      bucket = {
        weekIndex: w,
        fromDate: '',
        toDate: '',
        eggs: 0,
        settable: 0,
        daysActive: 0,
      }
      weeks.set(w, bucket)
    }
    bucket.eggs += r.totalEggs
    bucket.settable += computeSettable(r)
    bucket.daysActive++
  }

  const list: WeeklyProduction[] = []
  const flockStart = parseIsoDate(flockDate).getTime()
  if (maxWeek > 0) {
    for (let w = 1; w <= maxWeek; w++) {
      const bucket = weeks.get(w)
      const from = new Date(flockStart + (w - 1) * 7 * DAY_MS)
      const to = new Date(from.getTime() + 6 * DAY_MS)
      list.push(
        bucket ?? {
          weekIndex: w,
          fromDate: iso(from),
          toDate: iso(to),
          eggs: 0,
          settable: 0,
          daysActive: 0,
        },
      )
    }
  }

  let peakWeek: number | null = null
  let peakEggs = 0
  for (const w of list) {
    if (w.eggs > peakEggs) {
      peakEggs = w.eggs
      peakWeek = w.weekIndex
    }
  }

  return {
    weeks: list.map((w) => ({
      ...w,
      fromDate: iso(new Date(flockStart + (w.weekIndex - 1) * 7 * DAY_MS)),
      toDate: iso(new Date(flockStart + (w.weekIndex - 1) * 7 * DAY_MS + 6 * DAY_MS)),
    })),
    activeWeeks: list.filter((w) => w.daysActive > 0).length,
    totalEggs,
    totalSettable,
    peakWeek,
    peakEggs,
  }
}

function iso(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export interface FlockLifetimeKpis {
  flockDate: string
  daysInProduction: number
  weeksInProduction: number
  /** distinct days with an egg record (drives avg eggs per logging day) */
  activeDays: number
  totalEggs: number
  totalSettable: number
  settablePct: number | null
  avgEggsPerActiveDay: number | null
  /** totalEggs / (currentHens × daysInProduction) × 100 — calendar period, never days logged */
  henDayPct: number | null
}

export function buildLifetimeKpis(
  records: BreederEggRecord[],
  currentHens: number,
  flockDate: string,
  now: number = Date.now(),
): FlockLifetimeKpis {
  let totalEggs = 0
  let totalSettable = 0
  const activeDates = new Set<string>()

  for (const r of records) {
    totalEggs += r.totalEggs
    totalSettable += computeSettable(r)
    activeDates.add(r.date)
  }

  const daysInProduction = flockDate
    ? Math.max(1, Math.floor((now - parseIsoDate(flockDate).getTime()) / DAY_MS) + 1)
    : 0
  const activeDays = activeDates.size

  return {
    flockDate,
    daysInProduction,
    weeksInProduction: Math.max(0, Math.floor(daysInProduction / 7)),
    activeDays,
    totalEggs,
    totalSettable,
    settablePct: totalEggs > 0 ? computeSettablePct(totalEggs, totalSettable) : null,
    avgEggsPerActiveDay: activeDays > 0 ? round1(totalEggs / activeDays) : null,
    henDayPct:
      totalEggs > 0 && daysInProduction > 0
        ? computeHenDayPct(currentHens, totalEggs, daysInProduction)
        : null,
  }
}

export interface BreederReport {
  series: ProductionSeries
  lifetime: FlockLifetimeKpis
  hatches: HatchComparisonRow[]
  hatchAggregates: WeightedHatchAggregates
}

/** One-shot report builder — call inside useMemo, never persist the result. */
export function buildBreederReport(
  records: BreederEggRecord[],
  hatches: HatchBatch[],
  currentHens: number,
  flockDate: string,
  now: number = Date.now(),
): BreederReport {
  const comparison = buildHatchComparison(hatches)
  return {
    series: buildProductionSeries(records, flockDate),
    lifetime: buildLifetimeKpis(records, currentHens, flockDate, now),
    hatches: comparison.rows,
    hatchAggregates: comparison.aggregates,
  }
}
