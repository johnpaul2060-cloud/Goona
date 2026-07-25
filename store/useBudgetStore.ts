import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

export interface BudgetAllocation {
  key: string
  label: string
  amount: number
}

export type BudgetStatus = 'draft' | 'scheduled' | 'active' | 'near_expiry' | 'completed' | 'archived' | 'cancelled'

export interface BudgetSpendingAlerts {
  at80: boolean
  at90: boolean
  exceeded: boolean
  unusual: boolean
}

export interface BudgetTimelineAlerts {
  starts: boolean
  endingSoon: boolean
  endsTomorrow: boolean
  completed: boolean
}

export interface BudgetChannelPrefs {
  inApp: boolean
  push: boolean
  email: boolean
  sms: boolean
}

export interface BudgetAiAlerts {
  costSaving: boolean
  reallocation: boolean
  trends: boolean
  savingsOpportunities: boolean
}

export type BudgetAlertFrequency = 'instant' | 'daily' | 'weekly' | 'both'

export interface BudgetAlert {
  spending: BudgetSpendingAlerts
  timeline: BudgetTimelineAlerts
  categoryAlerts: string[]
  frequency: BudgetAlertFrequency
  channels: BudgetChannelPrefs
  ai: BudgetAiAlerts
}

export interface Budget {
  id: string
  name: string
  description: string
  color: string
  icon: string
  period: string
  totalAmount: number
  allocations: BudgetAllocation[]
  alerts: BudgetAlert
  startDate: number
  endDate: number
  status: BudgetStatus
  notes: string
  spent: number
  createdAt: number
}

interface BudgetState {
  budgets: Budget[]
  lastSet: number

  setBudget: (data: Omit<Budget, 'id' | 'createdAt' | 'status'>) => void
  updateBudget: (id: string, data: Partial<Omit<Budget, 'id' | 'createdAt'>>) => void
  setBudgetStatus: (id: string, status: BudgetStatus) => void
  getActiveBudgets: () => Budget[]
  getBuddyById: (id: string) => Budget | undefined
  getBudgetsByStatus: (...statuses: BudgetStatus[]) => Budget[]
  refreshStatuses: () => void
}

function computeStatus(b: Budget): BudgetStatus {
  const now = Date.now()
  if (b.status === 'archived' || b.status === 'cancelled') return b.status
  if (b.status === 'completed') return b.status
  if (now < b.startDate) return 'scheduled'
  if (now > b.endDate) return 'completed'
  const daysLeft = (b.endDate - now) / 86400000
  if (daysLeft <= 3) return 'near_expiry'
  return 'active'
}

function ensureValidBudget(b: Partial<Budget>): Budget {
  const now = Date.now()
  const budget: Budget = {
    id: b.id ?? `budget_${now}`,
    name: b.name ?? '',
    description: b.description ?? '',
    color: b.color ?? '#16A34A',
    icon: b.icon ?? 'wallet',
    period: b.period ?? '',
    totalAmount: b.totalAmount ?? 0,
    allocations: b.allocations ?? [],
    alerts: b.alerts ?? {
      spending: { at80: true, at90: false, exceeded: true, unusual: false },
      timeline: { starts: false, endingSoon: true, endsTomorrow: false, completed: true },
      categoryAlerts: [],
      frequency: 'instant',
      channels: { inApp: true, push: true, email: false, sms: false },
      ai: { costSaving: false, reallocation: false, trends: false, savingsOpportunities: false },
    },
    startDate: b.startDate ?? now,
    endDate: b.endDate ?? now,
    status: b.status ?? 'draft',
    notes: b.notes ?? '',
    spent: b.spent ?? 0,
    createdAt: b.createdAt ?? now,
  }
  budget.status = computeStatus(budget)
  return budget
}

export const useBudgetStore = create<BudgetState>()(
  persist(
    (set, get) => ({
      budgets: [],
      lastSet: 0,

      setBudget: (data) => {
        const budget: Budget = {
          ...data,
          status: 'active',
          id: `budget_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          createdAt: Date.now(),
        }
        budget.status = computeStatus(budget)
        set((s) => ({
          budgets: [budget, ...s.budgets],
          lastSet: Date.now(),
        }))
      },

      updateBudget: (id, data) => {
        set((s) => ({
          budgets: s.budgets.map((b) =>
            b.id === id ? ensureValidBudget({ ...b, ...data }) : b
          ),
          lastSet: Date.now(),
        }))
      },

      setBudgetStatus: (id, status) => {
        set((s) => ({
          budgets: s.budgets.map((b) => (b.id === id ? { ...b, status: computeStatus({ ...b, status }) } : b)),
          lastSet: Date.now(),
        }))
      },

      getActiveBudgets: () => {
        const { budgets } = get()
        return budgets.filter((b) => b.status === 'active' || b.status === 'near_expiry')
      },

      getBuddyById: (id) => {
        return get().budgets.find((b) => b.id === id)
      },

      getBudgetsByStatus: (...statuses) => {
        return get().budgets.filter((b) => statuses.includes(b.status))
      },

      getCompletedBudgets: () => {
        const { budgets } = get()
        return budgets.filter((b) => b.status === 'completed' || b.status === 'archived')
      },

      refreshStatuses: () => {
        set((s) => ({
          budgets: s.budgets.map((b) => ({ ...b, status: computeStatus(b) })),
        }))
      },
    }),
    {
      name: 'goona-budgets',
      storage: createJSONStorage(() => AsyncStorage),
      merge: (persisted, current) => {
        const p = persisted as Partial<{ budgets: Partial<Budget>[] }> | null
        if (!p?.budgets || !Array.isArray(p.budgets)) return current
        return {
          ...current,
          budgets: p.budgets.map((b) => ensureValidBudget(b)),
          lastSet: Date.now(),
        }
      },
    },
  ),
)
