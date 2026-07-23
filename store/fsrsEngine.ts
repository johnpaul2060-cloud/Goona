import { useMemo } from 'react'
import { usePlanStore } from './usePlanStore'
import { buildCalendarRecords } from './useRecoveryStore'

/* ══════════════════════════════════════════════════════════════
   Farm Start Readiness Score (FSRS) — Types & Constants
   ══════════════════════════════════════════════════════════════ */

export type FSRSReadinessLevel = 'not_ready' | 'partially_ready' | 'mostly_ready' | 'fully_ready'

export interface FSRSCategoryScore {
  key: string
  label: string
  emoji: string
  maxPoints: number
  earned: number
  details: string
}

export interface FSRSResult {
  totalScore: number
  maxScore: number
  level: FSRSReadinessLevel
  levelLabel: string
  levelColor: string
  levelBg: string
  categories: FSRSCategoryScore[]
  missingFactors: string[]
  insight: string
  restartDate: Date
  restartLabel: string
}

export interface FSRSInput {
  checklist: Record<string, boolean>
  checklistDefs: { key: string; label: string }[]
  totalSaved: number
  target: number
  streak: number
  missedCheckins: number
}

const LEVEL_CONFIG: Record<FSRSReadinessLevel, { label: string; color: string; bg: string }> = {
  not_ready: { label: 'Not Ready', color: '#EF4444', bg: '#FEF2F2' },
  partially_ready: { label: 'Partially Ready', color: '#F59E0B', bg: '#FFFBEB' },
  mostly_ready: { label: 'Mostly Ready', color: '#3B82F6', bg: '#EFF6FF' },
  fully_ready: { label: 'Fully Ready', color: '#16A34A', bg: '#F0FDF4' },
}

function classifyLevel(score: number): FSRSReadinessLevel {
  if (score >= 90) return 'fully_ready'
  if (score >= 75) return 'mostly_ready'
  if (score >= 50) return 'partially_ready'
  return 'not_ready'
}

function computeRestartDate(score: number, missedCheckins: number): Date {
  const delayDays = Math.max(
    score >= 90 ? 1 : score >= 75 ? 7 : score >= 50 ? 21 : 45,
    missedCheckins * 2,
  )
  const d = new Date()
  d.setDate(d.getDate() + delayDays)
  return d
}

function joinList(items: string[]): string {
  if (items.length === 0) return ''
  if (items.length === 1) return items[0]
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`
}

/* ══════════════════════════════════════════════════════════════
   Pure FSRS Computation
   ══════════════════════════════════════════════════════════════ */

export function computeFSRS(input: FSRSInput): FSRSResult {
  const { checklist, checklistDefs, totalSaved, target, streak, missedCheckins } = input

  const checklistMap: Record<string, boolean> = {}
  for (const c of checklistDefs) checklistMap[c.key] = checklist[c.key] ?? false

  const completedCount = checklistDefs.filter(d => checklistMap[d.key]).length
  const totalChecklist = checklistDefs.length

  /* ── 10 Category Scoring ── */

  const categories: FSRSCategoryScore[] = []

  /* 1. Financial Readiness (15 pts) */
  const fundingPct = target > 0 ? Math.min(totalSaved / target, 1) : 0
  const financialScore = fundingPct >= 1 ? 15 : fundingPct >= 0.5 ? 8 : 0
  categories.push({
    key: 'financial',
    label: 'Financial Readiness',
    emoji: '\uD83D\uDCB0',
    maxPoints: 15,
    earned: financialScore,
    details: fundingPct >= 1
      ? 'Budget fully secured'
      : fundingPct >= 0.5
        ? `Partially ready (${Math.round(fundingPct * 100)}% funded)`
        : 'Not ready — funding below 50% target',
  })

  /* 2. Feed Supply Readiness (10 pts) */
  const feedReady = checklistMap['feed']
  const feedScore = feedReady ? 10 : 5
  categories.push({
    key: 'feed_supply',
    label: 'Feed Supply Readiness',
    emoji: '\uD83C\uDF3D',
    maxPoints: 10,
    earned: feedScore,
    details: feedReady ? 'Fully secured supply chain' : 'Not yet confirmed',
  })

  /* 3. Biosecurity & Cleaning (10 pts) */
  const housingReady = checklistMap['housing']
  const bioScore = housingReady ? 10 : 0
  categories.push({
    key: 'biosecurity',
    label: 'Biosecurity & Cleaning',
    emoji: '\uD83E\uDDFC',
    maxPoints: 10,
    earned: bioScore,
    details: housingReady ? 'Housing disinfected and ready' : 'Not completed',
  })

  /* 4. Stock Quality (10 pts) */
  const chicksReady = checklistMap['chicks']
  const stockScore = chicksReady ? 10 : 0
  categories.push({
    key: 'stock_quality',
    label: 'Stock Quality',
    emoji: '\uD83D\uDC24',
    maxPoints: 10,
    earned: stockScore,
    details: chicksReady ? 'Stock reserved from verified source' : 'Not reserved',
  })

  /* 5. Workforce Readiness (10 pts) */
  const staffReady = checklistMap['staff']
  const workforceScore = staffReady ? 10 : 0
  categories.push({
    key: 'workforce',
    label: 'Workforce Readiness',
    emoji: '\uD83D\uDC65',
    maxPoints: 10,
    earned: workforceScore,
    details: staffReady ? 'Staff available and trained' : 'Not confirmed',
  })

  /* 6. Environmental Readiness (10 pts) */
  const waterReady = checklistMap['water']
  const envFactors = [housingReady, waterReady].filter(Boolean).length
  const envScore = envFactors >= 2 ? 10 : envFactors >= 1 ? 5 : 0
  categories.push({
    key: 'environmental',
    label: 'Environmental Readiness',
    emoji: '\uD83C\uDF21\uFE0F',
    maxPoints: 10,
    earned: envScore,
    details: envFactors >= 2
      ? 'Housing and water systems optimized'
      : envFactors >= 1
        ? 'Partially ready'
        : 'Not ready',
  })

  /* 7. Health & Vaccination Plan (10 pts) */
  const vaxReady = checklistMap['vaccination']
  const healthScore = vaxReady ? 10 : 0
  categories.push({
    key: 'health_vaccination',
    label: 'Health & Vaccination Plan',
    emoji: '\uD83D\uDC89',
    maxPoints: 10,
    earned: healthScore,
    details: vaxReady ? 'Vaccines and medication available' : 'No plan in place',
  })

  /* 8. Monitoring System (10 pts) */
  const streakWeeks = Math.floor(streak / 7)
  const consistencyGood = missedCheckins <= 5
  const monitoringScore = consistencyGood && streakWeeks >= 4 ? 10 : consistencyGood ? 5 : 0
  categories.push({
    key: 'monitoring',
    label: 'Monitoring System',
    emoji: '\uD83D\uDCCA',
    maxPoints: 10,
    earned: monitoringScore,
    details: monitoringScore >= 10
      ? 'Full tracking system active'
      : monitoringScore >= 5
        ? 'Manual tracking only'
        : 'No consistent tracking',
  })

  /* 9. Emergency Preparedness (10 pts) */
  const prepScore = totalChecklist > 0
    ? Math.round((completedCount / totalChecklist) * 10)
    : 0
  categories.push({
    key: 'emergency',
    label: 'Emergency Preparedness',
    emoji: '\uD83D\uDEA8',
    maxPoints: 10,
    earned: prepScore,
    details: prepScore >= 8
      ? 'Fully prepared'
      : prepScore >= 4
        ? 'Basic plan in place'
        : 'Not addressed',
  })

  /* 10. Cycle Restart Readiness (15 pts) */
  const allChecklistDone = completedCount === totalChecklist
  const cycleScore = allChecklistDone && fundingPct >= 1 ? 15 : allChecklistDone ? 8 : 0
  categories.push({
    key: 'cycle_restart',
    label: 'Cycle Restart Readiness',
    emoji: '\uD83D\uDD04',
    maxPoints: 15,
    earned: cycleScore,
    details: cycleScore >= 15
      ? 'Recap and budget fully approved'
      : cycleScore >= 8
        ? 'Checklist complete, funding gap remains'
        : `${totalChecklist - completedCount} items pending`,
  })

  const totalScore = categories.reduce((s, c) => s + c.earned, 0)
  const maxScore = categories.reduce((s, c) => s + c.maxPoints, 0)
  const level = classifyLevel(totalScore)
  const restartDate = computeRestartDate(totalScore, missedCheckins)

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const restartLabel = `${restartDate.getDate()} ${months[restartDate.getMonth()]} ${restartDate.getFullYear()}`

  /* ── Missing Factors ── */
  const missingFactors: string[] = categories
    .filter(c => c.earned < c.maxPoints)
    .map(c => c.label)

  /* ── AI Insights ── */
  const topMissing = categories.filter(c => c.earned === 0)
  const partialMissing = categories.filter(c => c.earned > 0 && c.earned < c.maxPoints)

  let insight: string
  if (level === 'fully_ready') {
    insight = `Farm is ${totalScore}% ready — all categories optimal. Recommend immediate cycle start. Estimated restart: ${restartLabel}`
  } else if (level === 'mostly_ready') {
    const primaryGap = partialMissing.length > 0 ? partialMissing[0].label : ''
    const gapDetail = primaryGap ? ` — ${primaryGap} is the main gap` : ''
    insight = `Farm is ${totalScore}% ready${gapDetail}. Cycle start recommended within 3 days`
  } else if (level === 'partially_ready') {
    const reasons: string[] = []
    if (topMissing.length > 0) reasons.push(`${topMissing[0].label.toLowerCase()} not completed`)
    if (partialMissing.length > 0) reasons.push(`${partialMissing[0].label.toLowerCase()} needs attention`)
    insight = `Farm is ${totalScore}% ready — ${reasons.join(', ')}. Start only with caution. Target: ${restartLabel}`
  } else {
    const criticalMissing = topMissing.length > 0 ? topMissing.map(c => c.label.toLowerCase()).slice(0, 2) : ['multiple categories']
    insight = `High risk: ${joinList(criticalMissing)} not completed. Score: ${totalScore}%. Estimated restart: ${restartLabel}`
  }

  return {
    totalScore,
    maxScore,
    level,
    levelLabel: LEVEL_CONFIG[level].label,
    levelColor: LEVEL_CONFIG[level].color,
    levelBg: LEVEL_CONFIG[level].bg,
    categories,
    missingFactors,
    insight,
    restartDate,
    restartLabel,
  }
}

/* ══════════════════════════════════════════════════════════════
   React Hook — useFSRS
   ══════════════════════════════════════════════════════════════ */

const DEFAULT_CHECKLIST: Record<string, boolean> = {}

export function useFSRS(
  checklist: Record<string, boolean> = DEFAULT_CHECKLIST,
  checklistDefs: { key: string; label: string }[] = [],
  target = 2500000,
): FSRSResult {
  const plans = usePlanStore((s) => s.plans)
  const calendarMeta = useMemo(() => buildCalendarRecords(plans), [plans])
  const { totalSaved, streak, missedCount: missedCheckins } = calendarMeta

  return useMemo(
    () => computeFSRS({ checklist, checklistDefs, totalSaved, target, streak, missedCheckins }),
    [checklist, checklistDefs, totalSaved, target, streak, missedCheckins],
  )
}
