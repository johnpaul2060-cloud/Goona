import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

export type AnimalSex = 'male' | 'female'
export type AnimalStatus = 'active' | 'sold' | 'deceased'

export interface Animal {
  id: string
  batchId: string
  tag: string
  dateOfBirth: string
  sex: AnimalSex
  breed?: string
  weight?: number
  height?: number
  status: AnimalStatus
  notes?: string
  damId?: string
  sireId?: string
  offspringIds?: string[]
  createdAt: number
  updatedAt?: number
}

interface AnimalState {
  animals: Animal[]
  addAnimal: (data: Omit<Animal, 'id' | 'createdAt'>) => Animal
  updateAnimal: (id: string, updates: Partial<Animal>) => void
  deleteAnimal: (id: string) => void
  getAnimalsByBatchId: (batchId: string) => Animal[]
}

let nextAnimalId = 1

export const useAnimalStore = create<AnimalState>()(
  persist(
    (set, get) => ({
      animals: [],
      addAnimal: (data) => {
        const now = Date.now()
        const animal: Animal = {
          ...data,
          id: `animal_${now}_${nextAnimalId++}`,
          createdAt: now,
        }
        set((state) => ({ animals: [...state.animals, animal] }))
        return animal
      },
      updateAnimal: (id, updates) => {
        set((state) => ({
          animals: state.animals.map((a) =>
            a.id === id ? { ...a, ...updates, updatedAt: Date.now() } : a
          ),
        }))
      },
      deleteAnimal: (id) => {
        set((state) => ({
          animals: state.animals.filter((a) => a.id !== id),
        }))
      },
      getAnimalsByBatchId: (batchId) =>
        get().animals.filter((a) => a.batchId === batchId),
    }),
    {
      name: 'goona-animals',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
