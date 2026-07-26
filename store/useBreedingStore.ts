import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

export type MatingStatus = 'mated' | 'pregnant' | 'delivered' | 'failed'

export interface MatingRecord {
  id: string
  batchId: string
  damId: string
  sireId: string | null
  sireTag?: string
  matingDate: string
  expectedDueDate: string
  gestationDays: number
  status: MatingStatus
  birthEventId?: string
  notes?: string
  createdAt: number
  updatedAt?: number
}

export interface BirthEvent {
  id: string
  breedingId: string
  batchId: string
  damId: string
  sireId: string | null
  birthDate: string
  offspringCount: number
  offspringIds: string[]
  notes?: string
  createdAt: number
}

export const GESTATION_DEFAULTS: Record<string, number> = {
  Goat: 150,
  Sheep: 150,
  Piggery: 114,
  Grasscutter: 150,
}

function computeDueDate(matingDate: string, gestationDays: number): string {
  const d = new Date(matingDate)
  d.setDate(d.getDate() + gestationDays)
  return d.toISOString()
}

let nextBreedingId = 1
let nextBirthId = 1

interface BreedingState {
  matings: MatingRecord[]
  birthEvents: BirthEvent[]
  addMating: (data: Omit<MatingRecord, 'id' | 'expectedDueDate' | 'createdAt'>) => MatingRecord
  updateMating: (id: string, updates: Partial<MatingRecord>) => void
  deleteMating: (id: string) => void
  addBirthEvent: (data: Omit<BirthEvent, 'id' | 'createdAt'>) => BirthEvent
  getMatingsByBatchId: (batchId: string) => MatingRecord[]
  getBirthEventsByBatchId: (batchId: string) => BirthEvent[]
  getMatingsByDamId: (damId: string) => MatingRecord[]
}

export const useBreedingStore = create<BreedingState>()(
  persist(
    (set, get) => ({
      matings: [],
      birthEvents: [],
      addMating: (data) => {
        const now = Date.now()
        const dueDate = computeDueDate(data.matingDate, data.gestationDays)
        const mating: MatingRecord = {
          ...data,
          id: `mating_${now}_${nextBreedingId++}`,
          expectedDueDate: dueDate,
          createdAt: now,
        }
        set((state) => ({ matings: [...state.matings, mating] }))
        return mating
      },
      updateMating: (id, updates) => {
        set((state) => ({
          matings: state.matings.map((m) =>
            m.id === id ? { ...m, ...updates, updatedAt: Date.now() } : m
          ),
        }))
      },
      deleteMating: (id) => {
        set((state) => ({
          matings: state.matings.filter((m) => m.id !== id),
        }))
      },
      addBirthEvent: (data) => {
        const now = Date.now()
        const birth: BirthEvent = {
          ...data,
          id: `birth_${now}_${nextBirthId++}`,
          createdAt: now,
        }
        set((state) => ({ birthEvents: [...state.birthEvents, birth] }))
        return birth
      },
      getMatingsByBatchId: (batchId) =>
        get().matings.filter((m) => m.batchId === batchId),
      getBirthEventsByBatchId: (batchId) =>
        get().birthEvents.filter((b) => b.batchId === batchId),
      getMatingsByDamId: (damId) =>
        get().matings.filter((m) => m.damId === damId),
    }),
    {
      name: 'goona-breeding',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
