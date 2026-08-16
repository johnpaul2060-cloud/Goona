import type { Batch } from '../store/useBatchStore'

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Breeder flock derivations (Phase 1 — BreederPro).
 * Pure helpers only: components must call these inside useMemo, never in
 * Zustand selectors, and never persist derived values (flock age and the
 * female:male ratio stay live).
 */

export function getFlockDate(batch: Batch): string {
  return (batch.datePlaced ?? batch.dateHatched) || batch.startDate || ''
}

export function isBreeder(batch: Batch): boolean {
  return batch.model === 'breeder'
}

/** Live flock age, e.g. "34 weeks 3 days". Always current — never stored. */
export function formatFlockAge(batch: Batch): string {
  return formatFlockAgeFrom(getFlockDate(batch))
}

export function formatFlockAgeFrom(dateStr: string): string {
  if (!dateStr) return '—'
  const time = new Date(dateStr).getTime()
  if (!Number.isFinite(time)) return '—'
  const days = Math.max(0, Math.floor((Date.now() - time) / DAY_MS))
  return formatAgeFromDays(days)
}

export function formatAgeFromDays(days: number): string {
  if (days <= 0) return 'Day 1'
  const w = Math.floor(days / 7)
  const d = days % 7
  if (w > 0) return `${w} week${w === 1 ? '' : 's'} ${d} day${d === 1 ? '' : 's'}`
  return `${d} day${d === 1 ? '' : 's'}`
}

/** Compact age for cards, e.g. "34w 3d". */
export function formatFlockAgeShort(batch: Batch): string {
  const dateStr = getFlockDate(batch)
  if (!dateStr) return '—'
  const time = new Date(dateStr).getTime()
  if (!Number.isFinite(time)) return '—'
  const days = Math.max(0, Math.floor((Date.now() - time) / DAY_MS))
  if (days <= 0) return 'Day 1'
  const w = Math.floor(days / 7)
  const d = days % 7
  return w > 0 ? `${w}w ${d}d` : `${d}d`
}

export interface FlockStats {
  hens: number
  cocks: number
  openingTotal: number
  currentPopulation: number
  currentHens: number
  currentCocks: number
  totalLosses: number
  /** females per male (0 when no cocks) */
  femalePerMale: number
  /** display ratio "12 : 1" (F : M), or "—" when no cocks */
  ratioLabel: string
  alivePct: number
}

export function computeFlockStats(batch: Batch): FlockStats {
  const hens = Math.max(0, batch.hens ?? 0)
  const cocks = Math.max(0, batch.cocks ?? 0)
  const openingTotal = Math.max(0, batch.totalBreeders ?? batch.quantity ?? hens + cocks)
  const femaleDeaths = Math.max(0, batch.femaleDeaths ?? 0)
  const maleDeaths = Math.max(0, batch.maleDeaths ?? 0)
  const culledFemales = Math.max(0, batch.culledFemales ?? 0)
  const culledMales = Math.max(0, batch.culledMales ?? 0)
  const totalLosses = femaleDeaths + maleDeaths + culledFemales + culledMales
  const currentPopulation = Math.max(0, openingTotal - totalLosses)
  const currentHens = Math.max(0, hens - femaleDeaths - culledFemales)
  const currentCocks = Math.max(0, cocks - maleDeaths - culledMales)
  const femalePerMale = cocks > 0 ? hens / cocks : 0
  const ratioLabel = cocks > 0 ? `${(hens / cocks).toFixed(1)} : 1` : '—'
  const alivePct = openingTotal > 0 ? Math.min(100, Math.round((currentPopulation / openingTotal) * 100)) : 100
  return {
    hens,
    cocks,
    openingTotal,
    currentPopulation,
    currentHens,
    currentCocks,
    totalLosses,
    femalePerMale,
    ratioLabel,
    alivePct,
  }
}