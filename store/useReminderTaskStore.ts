import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'

export type Priority = 'critical' | 'high' | 'medium' | 'low'
export type TaskStatus = 'pending' | 'in_progress' | 'completed'
export type ItemType = 'task' | 'reminder'
export type Visibility = 'all' | 'management'
export type SortKey = 'urgency' | 'batch' | 'created'
export type RepeatFrequency = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly'

export interface TaggedUser {
  id: string
  name: string
  initials: string
  avatarColor?: string
}

export interface Attachment {
  id: string
  name: string
  type: 'document' | 'photo' | 'voice_note'
  uri: string
  createdAt: string
}

export interface ReminderTaskItem {
  id: string
  type: ItemType
  title: string
  description: string
  priority: Priority
  status: TaskStatus
  progress: number
  assignedTo: TaggedUser[]
  batchId?: string
  batchName?: string
  dueDate: string
  dueTime?: string
  completedAt?: string
  createdAt: string
  visibility: Visibility
  attachments: Attachment[]
  creatorId: string
  creatorName: string
  feedPostId?: string
  repeatFrequency?: RepeatFrequency
}

export const TEAM_MEMBERS: TaggedUser[] = [
  { id: 'w1', name: 'Chinedu Okoro', initials: 'CO', avatarColor: '#00695C' },
  { id: 'w2', name: 'Aminat Fashola', initials: 'AF', avatarColor: '#6366F1' },
  { id: 'w3', name: 'Kola Ogunleye', initials: 'KO', avatarColor: '#F59E0B' },
  { id: 'w4', name: 'David Okafor', initials: 'DO', avatarColor: '#16A34A' },
  { id: 'w5', name: 'Funmi Towolawi', initials: 'FT', avatarColor: '#3B82F6' },
  { id: 'owner', name: 'Farm Owner', initials: 'FO', avatarColor: '#8B5CF6' },
]

interface ReminderTaskState {
  items: ReminderTaskItem[]
  sortKey: SortKey
  initialized: boolean
  setSortKey: (key: SortKey) => void
  addItem: (item: Omit<ReminderTaskItem, 'id' | 'createdAt'>) => void
  updateItem: (id: string, updates: Partial<ReminderTaskItem>) => void
  deleteItem: (id: string) => void
  completeItem: (id: string) => void
  addAttachment: (itemId: string, attachment: Attachment) => void
  removeAttachment: (itemId: string, attachmentId: string) => void
  getFilteredItems: (role: string, tab: 'all' | 'tasks' | 'reminders') => ReminderTaskItem[]
  getSortedItems: (items: ReminderTaskItem[]) => ReminderTaskItem[]
  loadFromStorage: () => Promise<void>
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

const STORAGE_KEY = 'goona-reminder-tasks'

function migrateItem(item: any): ReminderTaskItem {
  if (typeof item.assignedTo === 'string') {
    const name = item.assignedTo
    const found = TEAM_MEMBERS.find(
      (m) => m.name.toLowerCase() === name.toLowerCase()
    )
    item.assignedTo = found ? [found] : [{ id: 'unknown', name, initials: name.slice(0, 2).toUpperCase(), avatarColor: '#94A3B8' }]
  }
  if (!Array.isArray(item.assignedTo)) {
    item.assignedTo = []
  }
  if (!item.creatorId) item.creatorId = 'owner'
  if (!item.creatorName) item.creatorName = 'Farm Owner'
  if (!item.visibility) item.visibility = 'all'
  if (!item.attachments) item.attachments = []
  if (!item.repeatFrequency) item.repeatFrequency = 'none'
  return item as ReminderTaskItem
}

const SEED_ITEMS: ReminderTaskItem[] = [
  {
    id: generateId(), type: 'task', title: 'Morning feeding — Broiler Batch A',
    description: 'Distribute 80kg of starter feed across all pens. Record consumption.',
    priority: 'critical', status: 'pending', progress: 0,
    assignedTo: [TEAM_MEMBERS[0]],
    batchId: 'batch_a', batchName: 'Broiler Batch A',
    dueDate: new Date(Date.now() + 3600000).toISOString(),
    createdAt: new Date().toISOString(), visibility: 'all',
    attachments: [], creatorId: 'owner', creatorName: 'Farm Owner',
  },
  {
    id: generateId(), type: 'task', title: 'Health check — Layer Batch B',
    description: 'Inspect all 300 layers for signs of illness. Report any abnormal mortality.',
    priority: 'high', status: 'in_progress', progress: 45,
    assignedTo: [TEAM_MEMBERS[2]],
    batchId: 'batch_b', batchName: 'Layer Batch B',
    dueDate: new Date(Date.now() + 7200000).toISOString(),
    createdAt: new Date().toISOString(), visibility: 'all',
    attachments: [], creatorId: 'w4', creatorName: 'David Okafor',
  },
  {
      id: generateId(), type: 'reminder', title: 'Inventory count — feed store',
    description: 'Weekly feed inventory audit. Check all feed types and record remaining stock.',
    priority: 'medium', status: 'pending', progress: 0,
    assignedTo: [TEAM_MEMBERS[1]],
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
    createdAt: new Date().toISOString(), visibility: 'all',
    attachments: [], creatorId: 'owner', creatorName: 'Farm Owner',
    repeatFrequency: 'weekly',
  },
  {
    id: generateId(), type: 'reminder', title: 'Clean drinker lines — All batches',
    description: 'Weekly sanitation of all drinker lines to prevent bacterial growth and ensure water quality.',
    priority: 'low', status: 'completed', progress: 100,
    assignedTo: [TEAM_MEMBERS[0], TEAM_MEMBERS[2]],
    dueDate: new Date(Date.now() - 86400000).toISOString(),
    completedAt: new Date().toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    visibility: 'all', attachments: [], creatorId: 'w4', creatorName: 'David Okafor',
  },
  {
    id: generateId(), type: 'task', title: 'Prepare weekly production report',
    description: 'Compile egg production and feed conversion data for management review.',
    priority: 'medium', status: 'pending', progress: 0,
    assignedTo: [TEAM_MEMBERS[3], TEAM_MEMBERS[4]],
    dueDate: new Date(Date.now() + 86400000 * 5).toISOString(),
    createdAt: new Date().toISOString(), visibility: 'management',
    attachments: [], creatorId: 'owner', creatorName: 'Farm Owner',
  },
  {
    id: generateId(), type: 'reminder', title: 'Vaccination schedule — Broiler Batch C',
    description: 'Day 14 vaccination due for all birds. Prepare vaccine and equipment.',
    priority: 'high', status: 'pending', progress: 0,
    assignedTo: [TEAM_MEMBERS[2]],
    batchId: 'batch_c', batchName: 'Broiler Batch C',
    dueDate: new Date(Date.now() + 86400000).toISOString(),
    createdAt: new Date().toISOString(), visibility: 'all',
    attachments: [], creatorId: 'owner', creatorName: 'Farm Owner',
  },
]

export const useReminderTaskStore = create<ReminderTaskState>((set, get) => ({
  items: [],
  sortKey: 'urgency',
  initialized: false,

  setSortKey: (key) => set({ sortKey: key }),

  addItem: (item) => {
    const newItem: ReminderTaskItem = {
      ...item,
      id: generateId(),
      createdAt: new Date().toISOString(),
    }
    set((s) => ({ items: [newItem, ...s.items] }))
    persistToStorage()
  },

  updateItem: (id, updates) => {
    set((s) => ({
      items: s.items.map((i) => (i.id === id ? { ...i, ...updates } : i)),
    }))
    persistToStorage()
  },

  deleteItem: (id) => {
    set((s) => ({ items: s.items.filter((i) => i.id !== id) }))
    persistToStorage()
  },

  completeItem: (id) => {
    set((s) => ({
      items: s.items.map((i) =>
        i.id === id
          ? { ...i, status: 'completed' as TaskStatus, progress: 100, completedAt: new Date().toISOString() }
          : i
      ),
    }))
    persistToStorage()
  },

  addAttachment: (itemId, attachment) => {
    set((s) => ({
      items: s.items.map((i) =>
        i.id === itemId ? { ...i, attachments: [...(i.attachments || []), attachment] } : i
      ),
    }))
    persistToStorage()
  },

  removeAttachment: (itemId, attachmentId) => {
    set((s) => ({
      items: s.items.map((i) =>
        i.id === itemId
          ? { ...i, attachments: (i.attachments || []).filter((a) => a.id !== attachmentId) }
          : i
      ),
    }))
    persistToStorage()
  },

  getFilteredItems: (role, tab) => {
    const { items } = get()

    const isManagement = role === 'Owner' || role === 'Manager'

    let filtered = items.filter((item) => {
      if (item.visibility === 'management' && !isManagement) return false
      return true
    })

    if (tab === 'tasks') filtered = filtered.filter((i) => i.type === 'task')
    else if (tab === 'reminders') filtered = filtered.filter((i) => i.type === 'reminder')

    return filtered
  },

  getSortedItems: (items) => {
    const { sortKey } = get()
    const sorted = [...items]

    switch (sortKey) {
      case 'urgency':
        sorted.sort((a, b) => {
          const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
          const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
          if (pDiff !== 0) return pDiff
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        })
        break
      case 'batch':
        sorted.sort((a, b) => (a.batchName ?? '').localeCompare(b.batchName ?? ''))
        break
      case 'created':
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
    }

    return sorted
  },

  loadFromStorage: async () => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY)
      if (json) {
        const parsed = JSON.parse(json)
        const migrated = (Array.isArray(parsed) ? parsed : []).map(migrateItem)
        set({ items: migrated, initialized: true })
      } else {
        set({ items: SEED_ITEMS, initialized: true })
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_ITEMS))
      }
    } catch {
      set({ items: SEED_ITEMS, initialized: true })
    }
  },
}))

async function persistToStorage() {
  try {
    const items = useReminderTaskStore.getState().items
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {}
}
