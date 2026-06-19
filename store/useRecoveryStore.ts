import { create } from 'zustand'

export type CheckInStatus = 'completed' | 'partial' | 'missed' | 'exceeded' | 'none'
type ActiveStatus = Exclude<CheckInStatus, 'none'>

export interface DayRecord {
  date: string
  status: CheckInStatus
  amount?: number
}

function fmtDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function generateMockRecords(): Record<string, DayRecord> {
  const records: Record<string, DayRecord> = {}
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  // last 5 days of previous month — all completed (streak continuity)
  const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0)
  for (let i = 4; i >= 0; i--) {
    const d = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), prevMonth.getDate() - i)
    records[fmtDate(d)] = { date: fmtDate(d), status: 'completed', amount: 85000 }
  }

  // current month — varied states up to today
  const statuses: ActiveStatus[] = [
    'completed', 'completed', 'exceeded', 'completed', 'missed',
    'completed', 'partial', 'completed', 'exceeded', 'completed',
    'completed', 'missed', 'completed', 'partial', 'completed',
    'completed', 'exceeded', 'completed',
  ]
  for (let i = 1; i <= 28; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), i)
    if (d > today) break
    const status = statuses[(i - 1) % statuses.length]
    const amt =
      status === 'exceeded' ? 95000 + Math.floor(Math.random() * 15000) :
      status === 'completed' ? 80000 + Math.floor(Math.random() * 10000) :
      status === 'partial' ? 35000 + Math.floor(Math.random() * 20000) :
      undefined
    records[fmtDate(d)] = { date: fmtDate(d), status, amount: amt }
  }

  return records
}

interface RecoveryState {
  records: Record<string, DayRecord>
  checkIn: (dateStr: string, status: ActiveStatus, amount?: number) => void
}

export const useRecoveryStore = create<RecoveryState>((set) => ({
  records: generateMockRecords(),
  checkIn: (dateStr, status, amount) =>
    set((state) => ({
      records: {
        ...state.records,
        [dateStr]: { date: dateStr, status, amount: amount ?? state.records[dateStr]?.amount },
      },
    })),
}))

/* ── helpers ─────────────────────────────────────── */

export function fmtDateFromParts(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export function getStatusColor(status: CheckInStatus): string {
  switch (status) {
    case 'completed': return '#2E7D32'
    case 'exceeded': return '#AEEA00'
    case 'partial': return '#F59E0B'
    case 'missed': return '#EF4444'
    default: return '#F1F5F9'
  }
}

export function getStatusLabel(status: CheckInStatus): string {
  switch (status) {
    case 'completed': return 'Completed'
    case 'exceeded': return 'Exceeded'
    case 'partial': return 'Partial'
    case 'missed': return 'Missed'
    default: return 'None'
  }
}

export function computeStreak(records: Record<string, DayRecord>): number {
  const today = new Date()
  let streak = 0
  for (let i = 0; i < 365; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i)
    const ds = fmtDate(d)
    const r = records[ds]
    if (!r) break
    if (r.status === 'completed' || r.status === 'exceeded') {
      streak++
    } else if (r.status === 'partial') {
      streak++
    } else {
      break
    }
  }
  return streak
}

export function computeMonthlyStats(records: Record<string, DayRecord>, year: number, month: number) {
  const stats = { completed: 0, partial: 0, missed: 0, exceeded: 0, total: 0 }
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = fmtDateFromParts(year, month, d)
    const r = records[ds]
    if (r && r.status !== 'none') {
      stats.total++
      if (r.status === 'completed') stats.completed++
      else if (r.status === 'exceeded') stats.exceeded++
      else if (r.status === 'partial') stats.partial++
      else if (r.status === 'missed') stats.missed++
    }
  }
  return stats
}

export function generateInsights(records: Record<string, DayRecord>): string[] {
  const streak = computeStreak(records)
  const now = new Date()
  const stats = computeMonthlyStats(records, now.getFullYear(), now.getMonth())
  const messages: string[] = []

  if (streak >= 7) {
    messages.push(`You've maintained recapt consistency for ${streak} days. Keep it up!`)
  } else if (streak >= 3) {
    messages.push(`${streak}-day recapt streak — building strong preparation discipline.`)
  }

  if (stats.missed >= 2) {
    messages.push('Missed recapt periods may delay your next production cycle.')
  }

  if (stats.exceeded >= 3) {
    const pct = Math.round((stats.exceeded / Math.max(stats.total, 1)) * 100)
    messages.push(`You exceeded your recapt target ${stats.exceeded}x this month (${pct}% of check-ins).`)
  }

  if (messages.length === 0 && stats.total > 0) {
    messages.push('Every recapt brings you closer to your next production cycle.')
  }

  if (messages.length === 0) {
    messages.push('Start tracking your recapt today to unlock personalized insights.')
  }

  return messages.slice(0, 3)
}
