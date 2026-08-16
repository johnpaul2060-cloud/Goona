import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

/**
 * Hatch batches (Phase 3 — BreederPro, farmer POV).
 * SUB-ENTITIES of a breeder flock: keyed by breederFlockId. NOT top-level
 * batches, NOT a new batch.model, NOT in the All Batches list.
 * Chicks hatched are a SOLD OUTPUT (count), never tracked animals.
 * Incubation countdown, fertility % and hatch success % are NEVER stored —
 * they stay derived via utils/hatch inside useMemo.
 */

export type HatchStatus = 'incubating' | 'hatched' | 'failed'

export interface HatchBatch {
  id: string
  /** parent breeder flock id */
  breederFlockId: string
  /** auto-suggest sequential ("{flock}-H001"), editable */
  name: string
  eggsSet: number
  /** local YYYY-MM-DD */
  setDate: string
  /** species default (21 / 28), editable — expectedHatchDate is DERIVED from this */
  incubationDays: number
  /** per-batch: TRUE → simple break-out (clear / infertile count only) */
  trackFertility: boolean
  status: HatchStatus
  /** local YYYY-MM-DD — set when the hatch is recorded */
  hatchDate?: string
  /** chicks hatched — sold output, never animal profiles */
  chicksHatched?: number
  /** simple break-out — clear / infertile eggs (only with trackFertility) */
  clearEggs?: number
  notes?: string
  createdAt: number
}

function now(): number {
  return Date.now()
}

function generateId(): string {
  return `b_h_${now()}_${Math.random().toString(36).slice(2, 9)}`
}

interface HatchState {
  hatches: HatchBatch[]
  addHatch: (h: Omit<HatchBatch, 'id' | 'createdAt'>) => string
  updateHatch: (id: string, patch: Partial<HatchBatch>) => void
}

export const useHatchStore = create<HatchState>()(
  persist(
    (set) => ({
      hatches: [],

      addHatch: (h) => {
        const id = generateId()
        set((s) => ({ hatches: [...s.hatches, { ...h, id, createdAt: now() }] }))
        return id
      },

      updateHatch: (id, patch) => {
        set((s) => ({
          hatches: s.hatches.map((h) => (h.id === id ? { ...h, ...patch } : h)),
        }))
      },
    }),
    {
      name: 'goona-hatch-batches',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ hatches: state.hatches }),
    },
  ),
)