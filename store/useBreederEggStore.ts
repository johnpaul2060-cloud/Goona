import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

/**
 * Breeder egg records (Phase 2 — BreederPro).
 * Daily egg collection for breeder flocks ONLY, with optional grading.
 * Fully separate from the layer-level 'eggs' record type in useHistoryStore.
 * KPIs (hen-day %, settable %) are NEVER computed here — components derive
 * them via utils/breederEggs inside useMemo.
 */

export interface BreederEggGrading {
  /** clean / settable eggs (this count feeds the Phase 3 hatch-batch seam) */
  settable?: number
  dirty?: number
  cracked?: number
  small?: number
  doubleYolk?: number
  abnormal?: number
  floor?: number
  rejected?: number
}

export interface BreederEggRecord {
  id: string
  /** breeder flock id */
  batchId: string
  /** local date key, YYYY-MM-DD */
  date: string
  totalEggs: number
  /** optional refinement — total-only logs are valid */
  grading?: BreederEggGrading
  createdAt: number
}

function now(): number {
  return Date.now()
}

function generateId(): string {
  return `b_eg_${now()}_${Math.random().toString(36).slice(2, 9)}`
}

interface BreederEggState {
  eggs: BreederEggRecord[]
  /** single or multiple daily entries, saved in one call */
  addEggRecords: (items: Omit<BreederEggRecord, 'id' | 'createdAt'>[]) => void
}

export const useBreederEggStore = create<BreederEggState>()(
  persist(
    (set) => ({
      eggs: [],

      addEggRecords: (items) => {
        if (!items.length) return
        const stamped: BreederEggRecord[] = items.map((item) => ({
          ...item,
          id: generateId(),
          createdAt: now(),
        }))
        set((s) => ({ eggs: [...s.eggs, ...stamped] }))
      },
    }),
    {
      name: 'goona-breeder-eggs',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ eggs: state.eggs }),
    },
  ),
)