export type BatchModelKey = 'flock' | 'individual' | 'breeder'

// Ideal percentage suggestion per batch model across the OPERATING budget
// categories only (feed, medication, labour, utilities, transport, repairs,
// other). Stock purchase is a separate one-time cost and has no weight here.
// Every row sums to exactly 100 for each model.
export const SMART_ALLOCATION_WEIGHTS: Record<BatchModelKey, Record<string, number>> = {
  flock: { feed: 50, medication: 10, labour: 10, utilities: 8, transport: 10, repairs: 7, other: 5 },
  individual: { feed: 35, medication: 12, labour: 12, utilities: 8, transport: 13, repairs: 10, other: 10 },
  breeder: { feed: 40, medication: 12, labour: 10, utilities: 8, transport: 12, repairs: 8, other: 10 },
}

export function smartAllocationPercents(model: BatchModelKey, keys: string[]): Record<string, number> {
  const weights = SMART_ALLOCATION_WEIGHTS[model] ?? SMART_ALLOCATION_WEIGHTS.flock
  const result: Record<string, number> = {}
  for (const k of keys) result[k] = weights[k] ?? 0
  return result
}

export function smartAllocationAmounts(model: BatchModelKey, keys: string[], total: number): Record<string, number> {
  const weights = smartAllocationPercents(model, keys)
  return distributeAmounts(keys, total, (k) => (weights[k] || 0) / 100)
}

export function evenAllocationPercents(keys: string[]): Record<string, number> {
  const result: Record<string, number> = {}
  if (keys.length === 0) return result
  const per = 100 / keys.length
  for (const k of keys) result[k] = per
  return result
}

export function evenAllocationAmounts(keys: string[], total: number): Record<string, number> {
  return distributeAmounts(keys, total, () => 1 / Math.max(1, keys.length))
}

// Round-robins a total across keys so the sum is EXACTLY `total` (or all zeros
// when total is 0/negative). Never produces NaN / Infinity.
function distributeAmounts(keys: string[], total: number, ratio: (key: string) => number): Record<string, number> {
  const result: Record<string, number> = {}
  if (!(total > 0) || keys.length === 0) {
    for (const k of keys) result[k] = 0
    return result
  }
  let sum = 0
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i]
    if (i < keys.length - 1) {
      const val = Math.round(total * Math.max(0, ratio(k)))
      result[k] = Math.max(0, val)
      sum += result[k]
    } else {
      result[k] = Math.max(0, total - sum)
    }
  }
  return result
}

export function pctString(val: number): string {
  if (!(val > 0)) return ''
  return Number.isInteger(val) ? String(val) : val.toFixed(1)
}
