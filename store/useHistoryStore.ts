import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

export type RecordType = 'feed' | 'eggs' | 'water' | 'medication' | 'mortality' | 'observation' | 'sale' | 'expense' | 'inventory'

export interface HistoryRecord {
  id: string
  type: RecordType
  timestamp: number
  batch: string
  quantity?: number
  unit?: string
  cost?: number
  notes?: string
  metadata?: Record<string, unknown>
  feedPostId?: string
  loggedBy?: string
  waterL?: number
  itemName?: string
  supplier?: string
}

export type DatePreset = 'today' | 'this-week' | 'this-month' | 'last-month' | 'this-quarter' | 'this-year' | 'last-year' | 'custom'

export interface DateRange {
  start: number
  end: number
  preset: DatePreset
}

export interface AggregatedMetric {
  total: number
  count: number
  avg: number
  min: number
  max: number
  isMoney: boolean
}

export interface PeriodAggregation {
  period: string
  total: number
  count: number
}

export interface Forecast {
  metric: string
  direction: 'up' | 'down' | 'stable'
  pctChange: number
  confidence: 'high' | 'medium' | 'low'
  basis: string
  suggestion: string
  actionLabel: string
  comparablePeriod: { label: string; value: number }
  currentPeriod: { label: string; value: number }
}

function now() { return Date.now() }

function startOfDay(ts: number): number {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function periodKey(ts: number, granularity: 'month' | 'quarter' | 'year'): string {
  const d = new Date(ts)
  if (granularity === 'year') return `${d.getFullYear()}`
  if (granularity === 'quarter') return `${d.getFullYear()}-Q${Math.floor(d.getMonth() / 3) + 1}`
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${d.getFullYear()}-${m}`
}

function rangeForPreset(preset: DatePreset): DateRange {
  const d = new Date()
  const y = d.getFullYear()
  const m = d.getMonth()
  let start: number, end: number
  switch (preset) {
    case 'today':
      start = startOfDay(now())
      end = now()
      break
    case 'this-week': {
      const dow = d.getDay()
      const diff = d.getDate() - dow + (dow === 0 ? -6 : 1)
      start = startOfDay(new Date(y, m, diff).getTime())
      end = now()
      break
    }
    case 'this-month':
      start = startOfDay(new Date(y, m, 1).getTime())
      end = now()
      break
    case 'last-month': {
      const lm = new Date(y, m - 1, 1)
      start = startOfDay(lm.getTime())
      end = startOfDay(new Date(y, m, 0).getTime())
      break
    }
    case 'this-quarter': {
      const q = Math.floor(m / 3) * 3
      start = startOfDay(new Date(y, q, 1).getTime())
      end = now()
      break
    }
    case 'this-year':
      start = startOfDay(new Date(y, 0, 1).getTime())
      end = now()
      break
    case 'last-year':
      start = startOfDay(new Date(y - 1, 0, 1).getTime())
      end = startOfDay(new Date(y, 0, 1).getTime()) - 1
      break
    default:
      start = startOfDay(new Date(y, 0, 1).getTime())
      end = now()
  }
  return { start, end, preset }
}

function generateId(): string {
  return `hist_${now()}_${Math.random().toString(36).slice(2, 9)}`
}

/* ─── Which types are money records ─── */
function isMoneyType(type: RecordType): boolean {
  return type === 'sale' || type === 'expense' || type === 'inventory'
}

/* ─── Seed data builder ─── */
function buildSeedRecords(): HistoryRecord[] {
  const records: HistoryRecord[] = []
  const batches = ['Broiler Batch A', 'Layer Batch B', 'Broiler Batch C']
  const nowTs = now()
  const day = 86400000

  for (let daysAgo = 0; daysAgo < 180; daysAgo++) {
    const ts = nowTs - daysAgo * day
    const batch = batches[daysAgo % 3]

    if (daysAgo % 2 === 0) {
      records.push({
        id: generateId(), type: 'feed', timestamp: ts, batch,
        quantity: Math.round(40 + Math.random() * 60),
        unit: 'kg',
        notes: daysAgo === 0 ? 'Morning feeding' : undefined,
      })
    }
    if (daysAgo % 3 === 0) {
      records.push({
        id: generateId(), type: 'water', timestamp: ts, batch,
        quantity: Math.round(80 + Math.random() * 40),
        unit: 'L',
      })
    }
    if (daysAgo % 5 === 0) {
      records.push({
        id: generateId(), type: 'eggs', timestamp: ts, batch,
        quantity: Math.round(200 + Math.random() * 150),
        unit: 'eggs',
      })
    }
    if (daysAgo % 7 === 0 && daysAgo > 0) {
      records.push({
        id: generateId(), type: 'mortality', timestamp: ts, batch,
        quantity: Math.round(1 + Math.random() * 3),
        unit: 'birds',
      })
    }
    if (daysAgo % 10 === 0) {
      records.push({
        id: generateId(), type: 'medication', timestamp: ts, batch,
        quantity: Math.round(1 + Math.random() * 2),
        unit: 'vials', cost: Math.round(5000 + Math.random() * 15000),
        notes: 'Routine vaccination',
      })
    }
  }

  for (let daysAgo = 0; daysAgo < 90; daysAgo++) {
    const ts = nowTs - daysAgo * day
    records.push({
      id: generateId(), type: 'sale', timestamp: ts, batch: batches[daysAgo % 3],
      quantity: Math.round(50 + Math.random() * 200),
      unit: daysAgo % 2 === 0 ? 'eggs' : 'kg',
      cost: Math.round(40000 + Math.random() * 80000),
    })
    if (daysAgo % 3 === 0) {
      records.push({
        id: generateId(), type: 'expense', timestamp: ts, batch: batches[daysAgo % 3],
        cost: Math.round(5000 + Math.random() * 30000),
        notes: ['Transport', 'Vet visit', 'Utilities', 'Repairs', 'Labour'][daysAgo % 5],
      })
    }
  }

  for (let daysAgo = 0; daysAgo < 30; daysAgo += 14) {
    const ts = nowTs - daysAgo * day
    records.push({
      id: generateId(), type: 'inventory', timestamp: ts, batch: batches[0],
      quantity: Math.round(2000 + Math.random() * 3000),
      unit: 'kg',
      cost: Math.round(150000 + Math.random() * 100000),
      itemName: 'Broiler Starter Feed',
      supplier: 'Agro Feed Ltd',
      notes: 'Bulk purchase',
    })
  }

  return records
}

interface HistoryState {
  records: HistoryRecord[]
  seeded: boolean
  addRecord: (r: Omit<HistoryRecord, 'id'>) => string
  getRecords: (opts: { type?: RecordType; range: DateRange; batch?: string; search?: string }) => HistoryRecord[]
  getAggregation: (opts: { type: RecordType; range: DateRange; granularity: 'month' | 'quarter' | 'year' }) => PeriodAggregation[]
  getMetric: (opts: { type: RecordType; range: DateRange }) => AggregatedMetric
  getFeedStockBalance: () => { purchasedKg: number; consumedKg: number; remainingKg: number }
  getCostOfFeedConsumed: (range: DateRange) => number
  getForecasts: () => Forecast[]
  exportCSV: (opts: { type?: RecordType; range: DateRange }) => string
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      records: [],
      seeded: false,

      addRecord: (r) => {
        const id = generateId()
        set((s) => ({ records: [...s.records, { ...r, id }] }))
        return id
      },

      getRecords: ({ type, range, batch, search }) => {
        let results = get().records.filter(
          (r) => r.timestamp >= range.start && r.timestamp <= range.end,
        )
        if (type) results = results.filter((r) => r.type === type)
        if (batch) results = results.filter((r) => r.batch === batch)
        if (search) {
          const q = search.toLowerCase()
          results = results.filter(
            (r) =>
              r.batch.toLowerCase().includes(q) ||
              (r.notes?.toLowerCase().includes(q)) ||
              r.id.includes(q),
          )
        }
        return results.sort((a, b) => b.timestamp - a.timestamp)
      },

      getAggregation: ({ type, range, granularity }) => {
        const records = get().records.filter(
          (r) => r.type === type && r.timestamp >= range.start && r.timestamp <= range.end,
        )
        const map = new Map<string, { total: number; count: number }>()
        for (const r of records) {
          const pk = periodKey(r.timestamp, granularity)
          const existing = map.get(pk) ?? { total: 0, count: 0 }
          existing.total += isMoneyType(type) ? (r.cost ?? 0) : (r.quantity ?? 0)
          existing.count++
          map.set(pk, existing)
        }
        return Array.from(map.entries()).map(([period, v]) => ({
          period, total: v.total, count: v.count,
        })).sort((a, b) => a.period.localeCompare(b.period))
      },

      getMetric: ({ type, range }) => {
        const records = get().records.filter(
          (r) => r.type === type && r.timestamp >= range.start && r.timestamp <= range.end,
        )
        const isMoney = isMoneyType(type)
        const values = records.map((r) => isMoney ? (r.cost ?? 0) : (r.quantity ?? 0))
        const total = values.reduce((a, b) => a + b, 0)
        const count = values.length
        return {
          total, count, isMoney,
          avg: count > 0 ? total / count : 0,
          min: count > 0 ? Math.min(...values) : 0,
          max: count > 0 ? Math.max(...values) : 0,
        }
      },

      getFeedStockBalance: () => {
        const records = get().records
        const allTime = { start: 0, end: now(), preset: 'custom' as DatePreset }
        const purchases = records.filter(
          (r) => r.type === 'inventory' && r.quantity != null,
        )
        const consumption = records.filter(
          (r) => r.type === 'feed' && r.quantity != null,
        )
        const purchasedKg = purchases.reduce((sum, r) => sum + r.quantity!, 0)
        const consumedKg = consumption.reduce((sum, r) => sum + r.quantity!, 0)
        return { purchasedKg, consumedKg, remainingKg: Math.max(0, purchasedKg - consumedKg) }
      },

      getCostOfFeedConsumed: (range) => {
        const records = get().records
        const purchases = records.filter(
          (r) => r.type === 'inventory' && r.quantity != null && r.cost != null,
        )
        const totalPurchasedKg = purchases.reduce((s, r) => s + r.quantity!, 0)
        const totalCost = purchases.reduce((s, r) => s + r.cost!, 0)
        const costPerKg = totalPurchasedKg > 0 ? totalCost / totalPurchasedKg : 0

        const consumption = records.filter(
          (r) => r.type === 'feed' && r.timestamp >= range.start && r.timestamp <= range.end && r.quantity != null,
        )
        const consumedKg = consumption.reduce((s, r) => s + r.quantity!, 0)
        return Math.round(consumedKg * costPerKg)
      },

      getForecasts: () => {
        const records = get().records
        const forecasts: Forecast[] = []
        const nowTs = now()
        const thisYear = new Date(nowTs).getFullYear()
        const lastYear = thisYear - 1

        const thisYearStart = startOfDay(new Date(thisYear, 0, 1).getTime())
        const lastYearStart = startOfDay(new Date(lastYear, 0, 1).getTime())
        const lastYearEnd = thisYearStart - 1

        function totalFor(records: HistoryRecord[], type: RecordType, start: number, end: number): number {
          return records
            .filter((r) => r.type === type && r.timestamp >= start && r.timestamp <= end)
            .reduce((sum, r) => sum + (isMoneyType(type) ? (r.cost ?? 0) : (r.quantity ?? 0)), 0)
        }

        function countFor(records: HistoryRecord[], type: RecordType, start: number, end: number): number {
          return records.filter((r) => r.type === type && r.timestamp >= start && r.timestamp <= end).length
        }

        const eggLY = totalFor(records, 'eggs', lastYearStart, lastYearEnd)
        const eggTY = totalFor(records, 'eggs', thisYearStart, nowTs)
        if (eggLY > 0 && eggTY > 0) {
          const pct = Math.round(((eggTY - eggLY) / eggLY) * 100)
          forecasts.push({
            metric: 'Egg Production',
            direction: pct >= 0 ? 'up' : 'down',
            pctChange: Math.abs(pct),
            confidence: countFor(records, 'eggs', lastYearStart, lastYearEnd) > 30 ? 'high' : 'medium',
            basis: `Last year same period: ${eggLY.toLocaleString()} eggs. Current: ${eggTY.toLocaleString()} eggs.`,
            suggestion: pct < 0
              ? 'Production declining YoY. Review layer nutrition and lighting schedule.'
              : 'Production stable. Maintain current feeding and health protocols.',
            actionLabel: 'View Egg Records',
            comparablePeriod: { label: `Last year (${lastYear})`, value: eggLY },
            currentPeriod: { label: `This year (${thisYear})`, value: eggTY },
          })
        }

        const feedConsumedLY = totalFor(records, 'feed', lastYearStart, lastYearEnd)
        const feedConsumedTY = totalFor(records, 'feed', thisYearStart, nowTs)
        if (feedConsumedLY > 0 && feedConsumedTY > 0) {
          const pct = Math.round(((feedConsumedTY - feedConsumedLY) / feedConsumedLY) * 100)
          forecasts.push({
            metric: 'Feed Consumption',
            direction: pct > 0 ? 'up' : pct < 0 ? 'down' : 'stable',
            pctChange: Math.abs(pct),
            confidence: countFor(records, 'feed', lastYearStart, lastYearEnd) > 60 ? 'high' : 'medium',
            basis: `Last year: ${feedConsumedLY.toLocaleString()} kg. Current: ${feedConsumedTY.toLocaleString()} kg.`,
            suggestion: pct > 0
              ? 'Feed consumption rising — monitor stock levels and consider bulk purchasing.'
              : 'Feed consumption stable — current inventory strategy is adequate.',
            actionLabel: 'View Feed Records',
            comparablePeriod: { label: `Last year (${lastYear})`, value: feedConsumedLY },
            currentPeriod: { label: `This year (${thisYear})`, value: feedConsumedTY },
          })
        }

        const revenueLY = totalFor(records, 'sale', lastYearStart, lastYearEnd)
        const revenueTY = totalFor(records, 'sale', thisYearStart, nowTs)
        if (revenueLY > 0 && revenueTY > 0) {
          const pct = Math.round(((revenueTY - revenueLY) / revenueLY) * 100)
          forecasts.push({
            metric: 'Sales Revenue',
            direction: pct >= 0 ? 'up' : 'down',
            pctChange: Math.abs(pct),
            confidence: countFor(records, 'sale', lastYearStart, lastYearEnd) > 20 ? 'high' : 'medium',
            basis: `Last year revenue: \u20A6${revenueLY.toLocaleString()}. Current: \u20A6${revenueTY.toLocaleString()}.`,
            suggestion: pct < 0
              ? 'Revenue trending down. Identify top customers and increase outreach.'
              : 'Revenue growing. Consider expanding into new channels.',
            actionLabel: 'View Sales Records',
            comparablePeriod: { label: `Last year (${lastYear})`, value: revenueLY },
            currentPeriod: { label: `This year (${thisYear})`, value: revenueTY },
          })
        }

        const mortLY = totalFor(records, 'mortality', lastYearStart, lastYearEnd)
        const mortTY = totalFor(records, 'mortality', thisYearStart, nowTs)
        if (mortLY > 0 && mortTY > 0) {
          const pct = Math.round(((mortTY - mortLY) / mortLY) * 100)
          forecasts.push({
            metric: 'Mortality',
            direction: pct > 0 ? 'up' : 'down',
            pctChange: Math.abs(pct),
            confidence: countFor(records, 'mortality', lastYearStart, lastYearEnd) > 12 ? 'high' : 'medium',
            basis: `Last year: ${mortLY} birds lost. Current: ${mortTY} birds lost.`,
            suggestion: pct > 0
              ? 'Mortality increasing. Review biosecurity and ventilation protocols.'
              : 'Mortality declining. Continue current health management practices.',
            actionLabel: 'View Mortality Records',
            comparablePeriod: { label: `Last year (${lastYear})`, value: mortLY },
            currentPeriod: { label: `This year (${thisYear})`, value: mortTY },
          })
        }

        return forecasts
      },

      exportCSV: ({ type, range }) => {
        const records = get().records.filter(
          (r) => (!type || r.type === type) && r.timestamp >= range.start && r.timestamp <= range.end,
        ).sort((a, b) => a.timestamp - b.timestamp)

        const header = 'Date,Type,Batch,Quantity,Unit,Cost,Notes,Item,Supplier'
        const rows = records.map((r) => {
          const d = new Date(r.timestamp).toISOString().split('T')[0]
          const cost = r.cost != null ? `\u20A6${r.cost.toLocaleString()}` : ''
          return [
            d, r.type, r.batch, r.quantity ?? '', r.unit ?? '', cost,
            r.notes ?? '', r.itemName ?? '', r.supplier ?? '',
          ].join(',')
        })
        return [header, ...rows].join('\n')
      },
    }),
    {
      name: 'goona-history',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ records: state.records, seeded: state.seeded }),
      onRehydrateStorage: () => (state) => {
        if (state && !state.seeded) {
          state.records = buildSeedRecords()
          state.seeded = true
        }
      },
    },
  ),
)

export { rangeForPreset, periodKey, isMoneyType }
