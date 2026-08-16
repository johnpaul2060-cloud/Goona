import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { EXPENSE_CATEGORIES } from '../shared/expense-categories'

export interface BudgetAllocation {
  key: string
  label: string
  amount: number
}

export interface HarvestSummary {
  finalCount?: number
  totalRevenue?: number
  notes?: string
}

export type BatchModel = 'flock' | 'individual' | 'breeder'

export interface Batch {
  id: string
  batchName: string
  livestockType: string
  model?: BatchModel
  quantity: number
  purchaseCost: number
  feedCost: number
  medicationCost: number
  startDate: string
  duration: string
  status: 'active' | 'completed'
  createdAt: string
  completedAt?: string
  harvestSummary?: HarvestSummary
  budgetAllocations: BudgetAllocation[]
  lastActivityAt?: number
  breed?: string
  sexDistribution?: string
  herdNotes?: string
  // ─── breeder flock (model === 'breeder') ───
  totalBreeders?: number
  hens?: number
  cocks?: number
  // exactly one of datePlaced / dateHatched is set (the farmer's flock date)
  datePlaced?: string
  dateHatched?: string
  house?: string
  // flock mortality/culls, added over time (cumulative totals)
  femaleDeaths?: number
  maleDeaths?: number
  culledFemales?: number
  culledMales?: number
  // Reserved seams: egg records (P2), hatch batches (P3), breeder reports (P4)
  // are NOT implemented in Phase 1. Chicken(s)/eggs/offspring are never tracked
  // animals here — chicks are a sold OUTPUT of later phases.
}

interface BatchState {
  batches: Batch[]
  addBatch: (batch: Omit<Batch, 'id' | 'status' | 'createdAt' | 'budgetAllocations'>) => Batch
  getBatchById: (id: string) => Batch | undefined
  updateBatch: (id: string, updates: Partial<Batch>) => void
  completeBatch: (id: string, summary?: HarvestSummary) => void
  restoreBatch: (id: string) => void
  deleteBatch: (id: string) => void
  updateBudgetAllocations: (id: string, allocations: BudgetAllocation[]) => void
  touchBatch: (id: string) => void
}

function weeksAgo(weeks: number): string {
  return new Date(Date.now() - weeks * 7 * 24 * 60 * 60 * 1000).toISOString()
}

function seedAllocations(pc: number, fc: number, mc: number): BudgetAllocation[] {
  const expCategories = EXPENSE_CATEGORIES.map((c) => ({
    key: c.key,
    label: c.label,
    amount: c.key === 'feed' ? fc : c.key === 'medication' ? mc : 0,
  }))
  return [
    { key: 'purchase', label: 'Purchase', amount: pc },
    ...expCategories,
  ]
}

const SEED_BATCHES: Batch[] = [
  {
    id: 'batch_a',
    batchName: 'Broiler Batch A',
    livestockType: 'Broilers',
    model: 'flock',
    quantity: 500,
    purchaseCost: 150000,
    feedCost: 850000,
    medicationCost: 45000,
    startDate: weeksAgo(4),
    duration: '8 Weeks',
    status: 'active',
    createdAt: weeksAgo(4),
    lastActivityAt: Date.now() - 3600000,
    budgetAllocations: seedAllocations(150000, 850000, 45000),
  },
  {
    id: 'batch_b',
    batchName: 'Layer Batch B',
    livestockType: 'Layers',
    model: 'flock',
    quantity: 350,
    purchaseCost: 180000,
    feedCost: 920000,
    medicationCost: 38000,
    startDate: weeksAgo(8),
    duration: '8 Weeks',
    status: 'active',
    createdAt: weeksAgo(8),
    lastActivityAt: Date.now() - 7200000,
    budgetAllocations: seedAllocations(180000, 920000, 38000),
  },
  {
    id: 'batch_c',
    batchName: 'Broiler Batch C',
    livestockType: 'Broilers',
    model: 'flock',
    quantity: 350,
    purchaseCost: 105000,
    feedCost: 620000,
    medicationCost: 32000,
    startDate: weeksAgo(3),
    duration: '8 Weeks',
    status: 'active',
    createdAt: weeksAgo(3),
    lastActivityAt: Date.now() - 86400000,
    budgetAllocations: seedAllocations(105000, 620000, 32000),
  },
]

let nextId = 4

export const useBatchStore = create<BatchState>()(
  persist(
    (set, get) => ({
      batches: SEED_BATCHES,
      addBatch: (data) => {
        const now = Date.now()
        const batch: Batch = {
          ...data,
          id: `batch_${now}_${nextId++}`,
          status: 'active',
          createdAt: new Date(now).toISOString(),
          lastActivityAt: now,
          budgetAllocations: seedAllocations(data.purchaseCost, data.feedCost, data.medicationCost),
        }
        set((state) => ({ batches: [...state.batches, batch] }))
        return batch
      },
      getBatchById: (id: string) => get().batches.find((b) => b.id === id),
      updateBatch: (id: string, updates: Partial<Batch>) => {
        set((state) => ({
          batches: state.batches.map((b) =>
            b.id === id ? { ...b, ...updates } : b
          ),
        }))
      },
      updateBudgetAllocations: (id, allocations) => {
        set((state) => ({
          batches: state.batches.map((b) =>
            b.id === id ? { ...b, budgetAllocations: allocations } : b
          ),
        }))
      },
      completeBatch: (id: string, summary?: HarvestSummary) => {
        const now = new Date().toISOString()
        set((state) => ({
          batches: state.batches.map((b) =>
            b.id === id
              ? {
                  ...b,
                  status: 'completed' as const,
                  completedAt: now,
                  lastActivityAt: Date.now(),
                  harvestSummary: summary || b.harvestSummary,
                }
              : b
          ),
        }))
      },
      restoreBatch: (id: string) => {
        set((state) => ({
          batches: state.batches.map((b) =>
            b.id === id
              ? {
                  ...b,
                  status: 'active' as const,
                  lastActivityAt: Date.now(),
                }
              : b
          ),
        }))
      },
      deleteBatch: (id: string) => {
        set((state) => ({
          batches: state.batches.filter((b) => b.id !== id),
        }))
      },
      touchBatch: (id: string) => {
        set((state) => ({
          batches: state.batches.map((b) =>
            b.id === id ? { ...b, lastActivityAt: Date.now() } : b
          ),
        }))
      },
    }),
    {
      name: 'goona-batches',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
