import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

export interface Contribution {
  id: string
  amount: number
  date: string
  notes?: string
}

export interface CompletionSummary {
  totalContributed: number
  finalCount?: number
}

export interface Plan {
  id: string
  icon: string
  name: string
  target: number
  saved: number
  schedule: 'Daily' | 'Weekly' | 'Monthly'
  targetDate: string
  status: 'active' | 'completed'
  createdAt: string
  completedAt?: string
  completionSummary?: CompletionSummary
  contributions: Contribution[]
}

interface PlanState {
  plans: Plan[]
  createPlan: (data: {
    icon: string
    name: string
    target: number
    schedule: 'Daily' | 'Weekly' | 'Monthly'
    targetDate: string
  }) => Plan
  getPlanById: (id: string) => Plan | undefined
  recordContribution: (planId: string, amount: number, notes?: string) => void
  completePlan: (planId: string, summary?: CompletionSummary) => void
  restorePlan: (planId: string) => void
  getActivePlans: () => Plan[]
  getCompletedPlans: () => Plan[]
}

let nextId = 1

export const usePlanStore = create<PlanState>()(
  persist(
    (set, get) => ({
      plans: [],

      createPlan: (data) => {
        const plan: Plan = {
          id: `plan_${Date.now()}_${nextId++}`,
          icon: data.icon,
          name: data.name,
          target: data.target,
          saved: 0,
          schedule: data.schedule,
          targetDate: data.targetDate,
          status: 'active',
          createdAt: new Date().toISOString(),
          contributions: [],
        }
        set((state) => ({ plans: [...state.plans, plan] }))
        return plan
      },

      getPlanById: (id) => get().plans.find((p) => p.id === id),

      recordContribution: (planId, amount, notes) => {
        set((state) => ({
          plans: state.plans.map((p) =>
            p.id === planId
              ? {
                  ...p,
                  saved: p.saved + amount,
                  contributions: [
                    ...p.contributions,
                    {
                      id: `contrib_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
                      amount,
                      date: new Date().toISOString(),
                      notes,
                    },
                  ],
                }
              : p
          ),
        }))
      },

      completePlan: (planId, summary) => {
        set((state) => ({
          plans: state.plans.map((p) =>
            p.id === planId
              ? {
                  ...p,
                  status: 'completed' as const,
                  completedAt: new Date().toISOString(),
                  completionSummary: summary || { totalContributed: p.saved },
                }
              : p
          ),
        }))
      },

      restorePlan: (planId) => {
        set((state) => ({
          plans: state.plans.map((p) =>
            p.id === planId
              ? {
                  ...p,
                  status: 'active' as const,
                  completedAt: undefined,
                  completionSummary: undefined,
                }
              : p
          ),
        }))
      },

      getActivePlans: () => get().plans.filter((p) => p.status === 'active'),

      getCompletedPlans: () => get().plans.filter((p) => p.status === 'completed'),
    }),
    {
      name: 'goona-plans',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
