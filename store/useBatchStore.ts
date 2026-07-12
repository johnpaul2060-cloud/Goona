import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

export interface HarvestSummary {
  finalCount?: number
  totalRevenue?: number
  notes?: string
}

export interface Batch {
  id: string
  batchName: string
  livestockType: string
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
}

interface BatchState {
  batches: Batch[]
  addBatch: (batch: Omit<Batch, 'id' | 'status' | 'createdAt'>) => Batch
  getBatchById: (id: string) => Batch | undefined
  updateBatch: (id: string, updates: Partial<Batch>) => void
  completeBatch: (id: string, summary?: HarvestSummary) => void
  restoreBatch: (id: string) => void
}

function weeksAgo(weeks: number): string {
  return new Date(Date.now() - weeks * 7 * 24 * 60 * 60 * 1000).toISOString()
}

const SEED_BATCHES: Batch[] = [
  {
    id: 'batch_a',
    batchName: 'Broiler Batch A',
    livestockType: 'Broilers',
    quantity: 500,
    purchaseCost: 150000,
    feedCost: 850000,
    medicationCost: 45000,
    startDate: weeksAgo(4),
    duration: '8 Weeks',
    status: 'active',
    createdAt: weeksAgo(4),
  },
  {
    id: 'batch_b',
    batchName: 'Layer Batch B',
    livestockType: 'Layers',
    quantity: 350,
    purchaseCost: 180000,
    feedCost: 920000,
    medicationCost: 38000,
    startDate: weeksAgo(8),
    duration: '8 Weeks',
    status: 'active',
    createdAt: weeksAgo(8),
  },
  {
    id: 'batch_c',
    batchName: 'Broiler Batch C',
    livestockType: 'Broilers',
    quantity: 350,
    purchaseCost: 105000,
    feedCost: 620000,
    medicationCost: 32000,
    startDate: weeksAgo(3),
    duration: '8 Weeks',
    status: 'active',
    createdAt: weeksAgo(3),
  },
]

let nextId = 4

export const useBatchStore = create<BatchState>()(
  persist(
    (set, get) => ({
      batches: SEED_BATCHES,
      addBatch: (data) => {
        const batch: Batch = {
          ...data,
          id: `batch_${Date.now()}_${nextId++}`,
          status: 'active',
          createdAt: new Date().toISOString(),
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
      completeBatch: (id: string, summary?: HarvestSummary) => {
        set((state) => ({
          batches: state.batches.map((b) =>
            b.id === id
              ? {
                  ...b,
                  status: 'completed' as const,
                  completedAt: new Date().toISOString(),
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
                }
              : b
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
