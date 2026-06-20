import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

export type NotificationCategory = 'operations' | 'team' | 'weather' | 'wallet' | 'iq' | 'security'
export type NotificationPriority = 'info' | 'success' | 'warning' | 'critical'
export type NotificationStatus = 'unread' | 'read' | 'archived'

export interface AppNotification {
  id: string
  category: NotificationCategory
  priority: NotificationPriority
  status: NotificationStatus
  title: string
  description: string
  timestamp: number
  pinned?: boolean
  sourceId?: string
  sourceType?: string
  actionable?: boolean
  actionLabel?: string
  actionRoute?: string
}

export const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  all: { label: 'All', color: '#1B1B1B' },
  operations: { label: 'Operations', color: '#1A56FF' },
  team: { label: 'Team', color: '#16A34A' },
  weather: { label: 'Weather', color: '#06B6D4' },
  wallet: { label: 'Wallet', color: '#F59E0B' },
  iq: { label: 'GOONA IQ', color: '#8B5CF6' },
  security: { label: 'Security', color: '#EF4444' },
}

export const PRIORITY_CONFIG: Record<NotificationPriority, { label: string; color: string }> = {
  info: { label: 'Info', color: '#64748B' },
  success: { label: 'Success', color: '#16A34A' },
  warning: { label: 'Warning', color: '#F59E0B' },
  critical: { label: 'Critical', color: '#EF4444' },
}

interface NotificationState {
  notifications: AppNotification[]
  addNotification: (n: Omit<AppNotification, 'id' | 'timestamp' | 'status'>) => string
  markAsRead: (id: string) => void
  markAllAsRead: (category?: NotificationCategory) => void
  archiveNotification: (id: string) => void
  clearArchived: () => void
  unreadCount: (category?: NotificationCategory) => number
  totalUnread: () => number
  seedDemoNotifications: () => void
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

const DEMO_NOTIFICATIONS: Omit<AppNotification, 'id'>[] = [
  { category: 'operations', priority: 'warning', status: 'unread', title: 'Feed inventory low', description: 'Feed stock will last approximately 2 days. Order replacement soon.', timestamp: Date.now() - 600000, pinned: false },
  { category: 'operations', priority: 'info', status: 'unread', title: 'Vaccination due tomorrow', description: 'Layer Batch B due for Newcastle vaccine at 7:00 AM.', timestamp: Date.now() - 1200000, pinned: false },
  { category: 'weather', priority: 'warning', status: 'unread', title: 'Heavy rain expected', description: 'Expected rainfall between 2 PM and 8 PM. Secure open feed storage.', timestamp: Date.now() - 1800000, pinned: false },
  { category: 'wallet', priority: 'success', status: 'unread', title: 'Wallet funded', description: '₦150,000 received successfully. Available balance: ₦1,250,000.', timestamp: Date.now() - 3600000, pinned: false },
  { category: 'team', priority: 'info', status: 'read', title: 'Worker checked in', description: '8 of 10 staff checked in for morning shift.', timestamp: Date.now() - 7200000, pinned: false },
  { category: 'iq', priority: 'info', status: 'read', title: 'Feed efficiency improving', description: 'Your feeding consistency is trending positively this week.', timestamp: Date.now() - 10800000, pinned: false },
  { category: 'security', priority: 'critical', status: 'unread', title: 'SOS activated', description: 'Immediate attention required at your farm location.', timestamp: Date.now() - 14400000, pinned: true },
  { category: 'operations', priority: 'info', status: 'read', title: 'Batch milestone reached', description: 'Broiler Batch A reached 4-week growth target.', timestamp: Date.now() - 18000000, pinned: false },
  { category: 'weather', priority: 'info', status: 'read', title: 'Clear skies expected', description: 'No rain expected for the next 3 days. Good for fieldwork.', timestamp: Date.now() - 21600000, pinned: false },
  { category: 'wallet', priority: 'success', status: 'read', title: 'Recapt contribution completed', description: 'Weekly recapt of ₦12,500 applied successfully.', timestamp: Date.now() - 25200000, pinned: false },
  { category: 'team', priority: 'warning', status: 'unread', title: 'Attendance issue detected', description: '3 workers missed check-in this morning.', timestamp: Date.now() - 28800000, pinned: false },
  { category: 'iq', priority: 'warning', status: 'unread', title: 'Mortality prediction alert', description: 'Batch B mortality risk elevated. Review ventilation and feeding.', timestamp: Date.now() - 32400000, pinned: false },
  { category: 'security', priority: 'warning', status: 'read', title: 'Login from new device', description: 'Your account was accessed from a new phone. Verify if this was you.', timestamp: Date.now() - 36000000, pinned: false },
  { category: 'operations', priority: 'success', status: 'read', title: 'Water consumption normal', description: 'All batches showing healthy water intake levels.', timestamp: Date.now() - 39600000, pinned: false },
  { category: 'wallet', priority: 'warning', status: 'unread', title: 'Low balance alert', description: 'Wallet balance below ₦10,000. Fund your wallet soon.', timestamp: Date.now() - 43200000, pinned: false },
]

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],

      addNotification: (n) => {
        const id = generateId()
        const notification: AppNotification = {
          ...n,
          id,
          timestamp: Date.now(),
          status: 'unread',
        }
        set((s) => ({ notifications: [notification, ...s.notifications] }))
        return id
      },

      markAsRead: (id) => {
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, status: 'read' as const } : n
          ),
        }))
      },

      markAllAsRead: (category) => {
        set((s) => ({
          notifications: s.notifications.map((n) =>
            (n.status === 'unread' && (!category || n.category === category))
              ? { ...n, status: 'read' as const }
              : n
          ),
        }))
      },

      archiveNotification: (id) => {
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, status: 'archived' as const } : n
          ),
        }))
      },

      clearArchived: () => {
        set((s) => ({
          notifications: s.notifications.filter((n) => n.status !== 'archived'),
        }))
      },

      unreadCount: (category) => {
        return get().notifications.filter((n) =>
          n.status === 'unread' && (!category || n.category === category)
        ).length
      },

      totalUnread: () => {
        return get().notifications.filter((n) => n.status === 'unread').length
      },

      seedDemoNotifications: () => {
        const existing = get().notifications
        if (existing.length > 0) return
        const seeded = DEMO_NOTIFICATIONS.map((n) => ({ ...n, id: generateId() }))
        set({ notifications: seeded })
      },
    }),
    {
      name: 'goona-notifications',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
