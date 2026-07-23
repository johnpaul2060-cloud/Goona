import type { Plan } from './usePlanStore'

export type CheckInStatus = 'completed' | 'partial' | 'missed' | 'exceeded' | 'none'

export interface DayRecord {
  date: string
  status: CheckInStatus
  amount?: number
}

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

export function computeStreakByDay(records: Record<string, DayRecord>): number {
  const today = new Date()
  let streak = 0
  for (let i = 0; i < 365; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i)
    const ds = fmtDateFromParts(d.getFullYear(), d.getMonth(), d.getDate())
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

/* ─── Build calendar records from plan contributions ─── */

export interface CalendarMeta {
  records: Record<string, DayRecord>
  totalSaved: number
  totalTarget: number
  activePlanCount: number
  missedCount: number
  streak: number
}

function fmtDate(d: Date): string {
  return fmtDateFromParts(d.getFullYear(), d.getMonth(), d.getDate())
}

function daysUntilNextSchedule(schedule: 'Daily' | 'Weekly' | 'Monthly', ref: Date): number {
  switch (schedule) {
    case 'Daily': return 1
    case 'Weekly': {
      const day = ref.getDay()
      const daysUntilFriday = (5 - day + 7) % 7
      return daysUntilFriday === 0 ? 7 : daysUntilFriday
    }
    case 'Monthly': {
      const nextMonth = new Date(ref.getFullYear(), ref.getMonth() + 1, 1)
      return Math.ceil((nextMonth.getTime() - ref.getTime()) / 86400000)
    }
  }
}

function perContributionAmount(plan: Plan): number {
  const totalContributions = plan.contributions.length
  const remaining = plan.target - plan.saved
  const expectedCount = Math.max(1, totalContributions + 1)
  if (remaining > 0) {
    const daysLeft = Math.max(1, Math.ceil((new Date(plan.targetDate).getTime() - Date.now()) / 86400000))
    switch (plan.schedule) {
      case 'Daily': return Math.round(Math.max(remaining / daysLeft, 1))
      case 'Weekly': return Math.round(Math.max((remaining / daysLeft) * 7, 1))
      case 'Monthly': return Math.round(Math.max((remaining / daysLeft) * 30.44, 1))
    }
  }
  return Math.round(plan.target / expectedCount)
}

export function buildCalendarRecords(plans: Plan[]): CalendarMeta {
  const records: Record<string, DayRecord> = {}
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const activePlans = plans.filter((p) => p.status === 'active')

  /* ── Aggregate contributions from all plans ── */
  for (const plan of plans) {
    for (const c of plan.contributions) {
      const cDate = new Date(c.date)
      const ds = fmtDate(cDate)
      const existing = records[ds]
      const perAmt = perContributionAmount(plan)
      const isExceeded = c.amount > perAmt
      if (!existing) {
        records[ds] = {
          date: ds,
          status: isExceeded ? 'exceeded' : 'completed',
          amount: c.amount,
        }
      } else {
        existing.amount = (existing.amount ?? 0) + c.amount
        if (isExceeded && existing.status !== 'exceeded') existing.status = 'exceeded'
      }
    }
  }

  /* ── Mark missed days for active plans ── */
  const startDate = new Date(today.getFullYear(), today.getMonth(), 1)
  startDate.setMonth(startDate.getMonth() - 1)
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  for (const plan of activePlans) {
    const d = new Date(startDate)
    while (d <= endDate) {
      const ds = fmtDate(d)
      if (d <= today && !records[ds]) {
        const gap = daysUntilNextSchedule(plan.schedule, d)
        if (gap <= 1) {
          records[ds] = { date: ds, status: 'missed' }
        }
      }
      d.setDate(d.getDate() + 1)
    }
  }

  /* ── Compute metrics ── */
  let completedCount = 0
  let missedCount = 0
  let totalSaved = 0
  for (const key in records) {
    const r = records[key]
    if (r.status === 'completed' || r.status === 'exceeded') {
      completedCount++
      totalSaved += r.amount ?? 0
    }
    if (r.status === 'missed') missedCount++
  }

  const streak = computeStreakByDay(records)
  const totalTarget = activePlans.reduce((sum, p) => sum + p.target, 0)

  return {
    records,
    totalSaved,
    totalTarget,
    activePlanCount: activePlans.length,
    missedCount,
    streak,
  }
}

export function getExpectedAmountForDay(plans: Plan[], dateStr: string): number {
  const d = new Date(dateStr + 'T12:00:00')
  const ds = fmtDate(d)
  let total = 0
  for (const plan of plans) {
    if (plan.status !== 'active') continue
    const gap = daysUntilNextSchedule(plan.schedule, d)
    if (gap <= 1) {
      total += perContributionAmount(plan)
    }
  }
  return total || 0
}

export function generateInsights(records: Record<string, DayRecord>, activePlanCount: number): string[] {
  const streak = computeStreakByDay(records)
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

  if (activePlanCount === 0) {
    messages.push('Create a plan to start tracking your recapt consistency.')
  } else if (messages.length === 0 && stats.total > 0) {
    messages.push('Every recapt brings you closer to your next production cycle.')
  }

  if (messages.length === 0) {
    messages.push('Start tracking your recapt today to unlock personalized insights.')
  }

  return messages.slice(0, 3)
}
