import { Icons } from './icons'

export interface ExpenseCategory {
  key: string
  label: string
  icon: any
  color: string
  batchLinked: boolean
}

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { key: 'feed', label: 'Feed', icon: Icons.package, color: '#16A34A', batchLinked: true },
  { key: 'medication', label: 'Medication', icon: Icons.pill, color: '#EF4444', batchLinked: true },
  { key: 'labour', label: 'Labour', icon: Icons.users, color: '#1A56FF', batchLinked: false },
  { key: 'utilities', label: 'Utilities', icon: Icons.zap, color: '#8B5CF6', batchLinked: false },
  { key: 'transport', label: 'Transport', icon: Icons.truck, color: '#F59E0B', batchLinked: false },
  { key: 'repairs', label: 'Repairs', icon: Icons.wrench, color: '#06B6D4', batchLinked: false },
  { key: 'other', label: 'Other', icon: Icons.moreHorizontal, color: '#64748B', batchLinked: false },
]

export const EXPENSE_CATEGORY_KEYS = EXPENSE_CATEGORIES.map((c) => c.key)

export const BUDGET_ALLOCATION_CATEGORIES: ExpenseCategory[] = [
  { key: 'purchase', label: 'Purchase', icon: Icons.shoppingCart, color: '#8B5CF6', batchLinked: true },
  ...EXPENSE_CATEGORIES,
]

export const BUDGET_ALLOCATION_KEYS = BUDGET_ALLOCATION_CATEGORIES.map((c) => c.key)

export function getCategoryByKey(key: string): ExpenseCategory | undefined {
  return EXPENSE_CATEGORIES.find((c) => c.key === key)
}

export function getCategoryLabel(key: string): string {
  return getCategoryByKey(key)?.label ?? key
}

export function getCategoryColor(key: string): string {
  return getCategoryByKey(key)?.color ?? '#64748B'
}

export function getCategoryIcon(key: string): any {
  return getCategoryByKey(key)?.icon ?? Icons.receipt
}

export function isBatchLinked(key: string): boolean {
  return getCategoryByKey(key)?.batchLinked ?? false
}

const OLD_TO_NEW_LABEL_MAP: Record<string, string> = {
  Feed: 'feed',
  Transport: 'transport',
  Medication: 'medication',
  Salaries: 'labour',
  Utilities: 'utilities',
  Repairs: 'repairs',
  'Vet visit': 'medication',
  Labour: 'labour',
  Other: 'other',
}

export function migrateItemName(oldName: string | undefined): string {
  if (!oldName) return ''
  if (EXPENSE_CATEGORY_KEYS.includes(oldName)) return oldName
  return OLD_TO_NEW_LABEL_MAP[oldName] ?? 'other'
}
