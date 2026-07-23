import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAuthStore } from './useAuthStore'
import { useBatchStore } from './useBatchStore'
import { useWeatherStore } from './useWeatherStore'
import { buildCalendarRecords, computeMonthlyStats } from './useRecoveryStore'
import type { CalendarMeta } from './useRecoveryStore'
import { usePlanStore } from './usePlanStore'
import { useFarmChatStore } from './useFarmChatStore'
import { useNotificationStore } from './useNotificationStore'
import type { Batch } from './useBatchStore'
import type { WeatherDay } from './useWeatherStore'
import type { FeedPost } from './useFarmChatStore'
import type { AppNotification, NotificationPriority } from './useNotificationStore'

/* ══════════════════════════════════════════════════════════════
   FARM PRIORITY ENGINE — Types
   ══════════════════════════════════════════════════════════════ */

export type SignalDomain = 'financial' | 'farm_operations' | 'environment' | 'activity'

export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low'

export type BehavioralRule = 'financial_crisis' | 'health_crisis' | 'cycle_ending' | 'stable'

export interface PrioritySignal {
  id: string
  domain: SignalDomain
  label: string
  summary: string
  score: number
  weight: number
  trend: 'up' | 'down' | 'stable'
}

export interface DomainPriority {
  domain: SignalDomain
  label: string
  averageScore: number
  level: PriorityLevel
  color: string
  signals: PrioritySignal[]
}

export interface DashboardCardPriority {
  id: string
  label: string
  priority: number
  highlight: boolean
  badge: PriorityLevel | null
}

export interface QuickActionPriority {
  label: string
  priority: number
  highlight: boolean
}

export interface PriorityDecision {
  dominantDomain: SignalDomain
  dominantLabel: string
  rule: BehavioralRule
  bannerMessage: string | null
  bannerLevel: PriorityLevel | null
}

export interface PriorityState {
  signals: PrioritySignal[]
  domains: DomainPriority[]
  dashboardCards: DashboardCardPriority[]
  quickActions: QuickActionPriority[]
  pinnedFeedType: FeedPost['type'] | null
  minNotificationLevel: PriorityLevel
  decision: PriorityDecision
  lastUpdated: number
}

/* ══════════════════════════════════════════════════════════════
   Config — Colors & weights
   ══════════════════════════════════════════════════════════════ */

export const PRIORITY_COLORS: Record<PriorityLevel, string> = {
  critical: '#EF4444',
  high: '#F59E0B',
  medium: '#3B82F6',
  low: '#16A34A',
}

export const PRIORITY_LABELS: Record<PriorityLevel, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Stable',
}

const DOMAIN_CONFIG: Record<SignalDomain, { label: string; weight: number }> = {
  financial: { label: 'Financial', weight: 1.0 },
  farm_operations: { label: 'Farm Operations', weight: 1.0 },
  environment: { label: 'Environment', weight: 0.7 },
  activity: { label: 'Activity', weight: 0.5 },
}

/* ══════════════════════════════════════════════════════════════
   Helpers
   ══════════════════════════════════════════════════════════════ */

function scoreToLevel(s: number): PriorityLevel {
  if (s >= 81) return 'critical'
  if (s >= 61) return 'high'
  if (s >= 31) return 'medium'
  return 'low'
}

function domainWeight(domain: SignalDomain, weights: Record<SignalDomain, number>): number {
  return weights[domain] ?? 1
}

function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, v))
}

function trendDir(current: number, prev: number): 'up' | 'down' | 'stable' {
  const diff = current - prev
  if (diff > 5) return 'up'
  if (diff < -5) return 'down'
  return 'stable'
}

/* ══════════════════════════════════════════════════════════════
   Engine Input Data Collector
   ══════════════════════════════════════════════════════════════ */

export interface EngineInputData {
  role: 'Owner' | 'Manager' | 'Worker'
  batches: Batch[]
  todayWeather: WeatherDay | null
  weatherAlerts: { type: string; message: string }[]
  calendarMeta: CalendarMeta
  feedPosts: FeedPost[]
  notifications: AppNotification[]
}

export function collectEngineData(): EngineInputData {
  const auth = useAuthStore.getState()
  const batchStore = useBatchStore.getState()
  const weatherStore = useWeatherStore.getState()
  const plans = usePlanStore.getState().plans
  const calendarMeta = buildCalendarRecords(plans)
  const chatStore = useFarmChatStore.getState()
  const notifStore = useNotificationStore.getState()

  return {
    role: auth.role,
    batches: batchStore.batches,
    todayWeather: weatherStore.getToday(),
    weatherAlerts: weatherStore.getAlerts(),
    calendarMeta,
    feedPosts: chatStore.feedPosts,
    notifications: notifStore.notifications,
  }
}

/* ══════════════════════════════════════════════════════════════
   FarmPriorityEngine — Core Scoring Engine
   ══════════════════════════════════════════════════════════════ */

export class FarmPriorityEngine {
  private prevSignals: Map<string, number> = new Map()

  compute(data: EngineInputData): PriorityState {
    const signals = this.collectSignals(data)
    const domainMap = this.groupByDomain(signals)
    const domains = this.computeDomainPriorities(domainMap)
    const { decision, cards, actions, pinnedFeed, minNotif } = this.applyRules(domains, data)

    this.prevSignals.clear()
    for (const s of signals) this.prevSignals.set(s.id, s.score)

    return {
      signals,
      domains,
      dashboardCards: cards,
      quickActions: actions,
      pinnedFeedType: pinnedFeed,
      minNotificationLevel: minNotif,
      decision,
      lastUpdated: Date.now(),
    }
  }

  /* ── Signal Collection ── */

  private collectSignals(data: EngineInputData): PrioritySignal[] {
    return [
      ...this.financialSignals(data),
      ...this.farmOperationSignals(data),
      ...this.environmentSignals(data),
      ...this.activitySignals(data),
    ]
  }

  private financialSignals(data: EngineInputData): PrioritySignal[] {
    const { batches, calendarMeta } = data
    const { records: recoveryRecords, streak: recoveryStreak } = calendarMeta
    const totalFeedCost = batches.reduce((s, b) => s + b.feedCost, 0)
    const totalMedCost = batches.reduce((s, b) => s + b.medicationCost, 0)
    const totalCost = batches.reduce((s, b) => s + b.purchaseCost + b.feedCost + b.medicationCost, 0)
    const avgBatchCost = batches.length > 0 ? totalCost / batches.length : 0

    const now = new Date()
    const monthStats = computeMonthlyStats(recoveryRecords, now.getFullYear(), now.getMonth())
    const completionRate = monthStats.total > 0 ? (monthStats.completed + monthStats.exceeded) / monthStats.total : 0.5
    const missedFraction = monthStats.total > 0 ? monthStats.missed / monthStats.total : 0

    const budgetUsageScore = clamp(Math.round((totalFeedCost / Math.max(avgBatchCost, 1)) * 50))
    const cashflowScore = clamp(Math.round((1 - completionRate) * 100))
    const feedExpenditureScore = clamp(Math.round((totalFeedCost / Math.max(totalCost, 1)) * 70))
    const salaryPressureScore = clamp(Math.round(missedFraction * 100))
    const recapReadinessScore = clamp(Math.round((1 - (recoveryStreak / 60)) * 100))

    return [
      {
        id: 'budget_usage', domain: 'financial', weight: 0.25,
        label: 'Budget Usage Level',
        summary: `${totalFeedCost.toLocaleString()} spent on feed across ${batches.length} batches`,
        score: budgetUsageScore,
        trend: trendDir(budgetUsageScore, this.prevSignals.get('budget_usage') ?? 50),
      },
      {
        id: 'cashflow', domain: 'financial', weight: 0.2,
        label: 'Cashflow Status',
        summary: `Recap completion rate: ${Math.round(completionRate * 100)}%`,
        score: cashflowScore,
        trend: trendDir(cashflowScore, this.prevSignals.get('cashflow') ?? 30),
      },
      {
        id: 'feed_expenditure', domain: 'financial', weight: 0.2,
        label: 'Feed Expenditure Rate',
        summary: `₦${totalFeedCost.toLocaleString()} total feed cost`,
        score: feedExpenditureScore,
        trend: trendDir(feedExpenditureScore, this.prevSignals.get('feed_expenditure') ?? 40),
      },
      {
        id: 'salary_pressure', domain: 'financial', weight: 0.15,
        label: 'Salary Pressure',
        summary: `${monthStats.missed} missed check-ins this month`,
        score: salaryPressureScore,
        trend: trendDir(salaryPressureScore, this.prevSignals.get('salary_pressure') ?? 20),
      },
      {
        id: 'recap_readiness', domain: 'financial', weight: 0.2,
        label: 'Recapitalization Readiness',
        summary: `${recoveryStreak}-day streak · ${Math.round(completionRate * 100)}% completion`,
        score: recapReadinessScore,
        trend: trendDir(recapReadinessScore, this.prevSignals.get('recap_readiness') ?? 40),
      },
    ]
  }

  private farmOperationSignals(data: EngineInputData): PrioritySignal[] {
    const { batches, feedPosts, calendarMeta } = data
    const { streak: recoveryStreak } = calendarMeta
    const now = Date.now()

    const healthReports = feedPosts.filter(p => p.type === 'health_report')
    const recentHealth = healthReports.filter(p => now - p.timestamp < 86400000)
    const healthAlert = feedPosts.some(p => p.type === 'health_report' && p.isAlert)

    const totalQuantity = batches.reduce((s, b) => s + b.quantity, 0)
    const totalFeedCost = batches.reduce((s, b) => s + b.feedCost, 0)
    const avgFeedPerBird = totalQuantity > 0 ? totalFeedCost / totalQuantity : 0

    const oldestBatch = batches.length > 0
      ? batches.reduce((a, b) => new Date(a.startDate) < new Date(b.startDate) ? a : b)
      : null
    const batchAgeDays = oldestBatch
      ? (now - new Date(oldestBatch.startDate).getTime()) / 86400000
      : 0
    const cycleProgress = oldestBatch
      ? Math.min(batchAgeDays / 56, 1)
      : 0

    const healthScore = healthAlert ? 85 : recentHealth.length > 0 ? 45 : 15
    const mortalityScore = clamp(Math.round(Math.random() * 30 + 10))
    const productionScore = clamp(Math.round((1 - cycleProgress) * 60 + 20))
    const feedConsumptionScore = clamp(Math.round((avgFeedPerBird / 2000) * 100))
    const batchPerfScore = clamp(Math.round(Math.random() * 25 + 60))

    return [
      {
        id: 'mortality_rate', domain: 'farm_operations', weight: 0.25,
        label: 'Mortality Rate',
        summary: `Tracking across ${batches.length} active batches`,
        score: mortalityScore,
        trend: trendDir(mortalityScore, this.prevSignals.get('mortality_rate') ?? 20),
      },
      {
        id: 'production_rate', domain: 'farm_operations', weight: 0.2,
        label: 'Production Rate',
        summary: `Cycle ${Math.round(cycleProgress * 100)}% complete`,
        score: productionScore,
        trend: 'stable',
      },
      {
        id: 'batch_performance', domain: 'farm_operations', weight: 0.2,
        label: 'Batch Performance',
        summary: `${batches.length} active batches · ${totalQuantity} birds`,
        score: batchPerfScore,
        trend: trendDir(batchPerfScore, this.prevSignals.get('batch_performance') ?? 70),
      },
      {
        id: 'feed_consumption', domain: 'farm_operations', weight: 0.15,
        label: 'Feed Consumption',
        summary: `₦${Math.round(avgFeedPerBird).toLocaleString()}/bird`,
        score: feedConsumptionScore,
        trend: trendDir(feedConsumptionScore, this.prevSignals.get('feed_consumption') ?? 30),
      },
      {
        id: 'health_alerts', domain: 'farm_operations', weight: 0.2,
        label: 'Health Alerts',
        summary: `${recentHealth.length} reports today · ${healthAlert ? '⚠ Alert active' : 'All clear'}`,
        score: healthScore,
        trend: trendDir(healthScore, this.prevSignals.get('health_alerts') ?? 20),
      },
    ]
  }

  private environmentSignals(data: EngineInputData): PrioritySignal[] {
    const { todayWeather, weatherAlerts } = data
    const now = new Date()
    const month = now.getMonth()

    let weatherRiskScore = 10
    let diseaseRiskScore = 20
    let seasonalScore = 15

    if (todayWeather) {
      const condScore: Record<string, number> = { sunny: 5, cloudy: 15, rainy: 40, stormy: 80, heatwave: 70 }
      weatherRiskScore = condScore[todayWeather.condition] ?? 10
      weatherRiskScore += todayWeather.floodRisk === 'high' ? 30 : todayWeather.floodRisk === 'medium' ? 15 : 0
      weatherRiskScore = clamp(weatherRiskScore + (todayWeather.rainProbability > 60 ? 15 : 0))

      if (todayWeather.humidity > 75) diseaseRiskScore += 30
      if (todayWeather.condition === 'rainy' || todayWeather.condition === 'stormy') diseaseRiskScore += 25
      if (todayWeather.tempHigh > 36) diseaseRiskScore += 15
      diseaseRiskScore = clamp(diseaseRiskScore)
    }

    const rainAlerts = weatherAlerts.filter(a => a.type === 'rain').length
    const stormAlerts = weatherAlerts.filter(a => a.type === 'stormy').length
    if (rainAlerts > 0) weatherRiskScore = clamp(weatherRiskScore + 15)
    if (stormAlerts > 0) weatherRiskScore = clamp(weatherRiskScore + 20)

    if (month >= 3 && month <= 5) seasonalScore = 40
    else if (month >= 6 && month <= 9) seasonalScore = 60
    else if (month >= 10 && month <= 11) seasonalScore = 30

    return [
      {
        id: 'weather_risk', domain: 'environment', weight: 0.4,
        label: 'Weather Risk',
        summary: todayWeather
          ? `${todayWeather.condition} · ${todayWeather.tempHigh}°C · ${todayWeather.rainProbability}% rain`
          : 'No forecast data',
        score: weatherRiskScore,
        trend: trendDir(weatherRiskScore, this.prevSignals.get('weather_risk') ?? 20),
      },
      {
        id: 'disease_probability', domain: 'environment', weight: 0.35,
        label: 'Disease Outbreak Probability',
        summary: todayWeather && todayWeather.humidity > 75 ? 'High humidity alert' : 'Conditions normal',
        score: diseaseRiskScore,
        trend: trendDir(diseaseRiskScore, this.prevSignals.get('disease_probability') ?? 20),
      },
      {
        id: 'seasonal_patterns', domain: 'environment', weight: 0.25,
        label: 'Seasonal Patterns',
        summary: `${['Dry', 'Early Wet', 'Peak Wet', 'Late Wet'][Math.floor(month / 3)]} season`,
        score: seasonalScore,
        trend: 'stable',
      },
    ]
  }

  private activitySignals(data: EngineInputData): PrioritySignal[] {
    const { feedPosts } = data
    const now = Date.now()

    const recentPosts = feedPosts.filter(p => now - p.timestamp < 86400000)
    const postsToday = recentPosts.length

    const aiPosts = recentPosts.filter(p => p.type === 'ai_insight' || p.type === 'ai_alert')
    const workerPosts = recentPosts.filter(p => p.type === 'feed_record' || p.type === 'health_report')
    const fundingPosts = recentPosts.filter(p => p.type === 'funding')

    const activityScore = clamp(Math.round((1 - Math.min(postsToday / 10, 1)) * 100))
    const missingScore = postsToday < 3 ? clamp(Math.round((3 - postsToday) * 25)) : 10
    const delayedScore = clamp(Math.round(Math.random() * 40 + 10))

    return [
      {
        id: 'worker_activity', domain: 'activity', weight: 0.4,
        label: 'Worker Activity',
        summary: `${postsToday} updates today · ${workerPosts.length} operational`,
        score: activityScore,
        trend: trendDir(activityScore, this.prevSignals.get('worker_activity') ?? 30),
      },
      {
        id: 'missing_updates', domain: 'activity', weight: 0.35,
        label: 'Missing Updates',
        summary: `${Math.max(0, 3 - postsToday)} key updates not yet logged`,
        score: missingScore,
        trend: trendDir(missingScore, this.prevSignals.get('missing_updates') ?? 30),
      },
      {
        id: 'delayed_operations', domain: 'activity', weight: 0.25,
        label: 'Delayed Operations',
        summary: `${aiPosts.length} AI insights pending review`,
        score: delayedScore,
        trend: 'stable',
      },
    ]
  }

  /* ── Domain Aggregation ── */

  private groupByDomain(signals: PrioritySignal[]): Record<SignalDomain, PrioritySignal[]> {
    const map: Record<SignalDomain, PrioritySignal[]> = {
      financial: [],
      farm_operations: [],
      environment: [],
      activity: [],
    }
    for (const s of signals) map[s.domain].push(s)
    return map
  }

  private computeDomainPriorities(grouped: Record<SignalDomain, PrioritySignal[]>): DomainPriority[] {
    return (Object.entries(grouped) as [SignalDomain, PrioritySignal[]][]).map(([domain, signals]) => {
      const totalWeight = signals.reduce((s, sig) => s + sig.weight, 0)
      const avgScore = totalWeight > 0
        ? Math.round(signals.reduce((s, sig) => s + sig.score * sig.weight, 0) / totalWeight)
        : 0
      return {
        domain,
        label: DOMAIN_CONFIG[domain].label,
        averageScore: avgScore,
        level: scoreToLevel(avgScore),
        color: PRIORITY_COLORS[scoreToLevel(avgScore)],
        signals,
      }
    })
  }

  /* ── Behavioral Rules Engine ── */

  private applyRules(
    domains: DomainPriority[],
    data: EngineInputData,
  ): {
    decision: PriorityDecision
    cards: DashboardCardPriority[]
    actions: QuickActionPriority[]
    pinnedFeed: FeedPost['type'] | null
    minNotif: PriorityLevel
  } {
    const fin = domains.find(d => d.domain === 'financial')!
    const ops = domains.find(d => d.domain === 'farm_operations')!
    const env = domains.find(d => d.domain === 'environment')!
    const act = domains.find(d => d.domain === 'activity')!

    const sorted = [...domains].sort((a, b) => b.averageScore - a.averageScore)
    const dominant = sorted[0]

    let rule: BehavioralRule = 'stable'
    let bannerMessage: string | null = null
    let bannerLevel: PriorityLevel | null = null
    let pinnedFeed: FeedPost['type'] | null = null

    const { batches } = data
    const now = Date.now()

    const oldestBatchEnd = batches.length > 0
      ? Math.max(...batches.map(b => new Date(b.startDate).getTime() + parseInt(b.duration) * 7 * 86400000))
      : 0
    const daysUntilCycleEnd = Math.max(0, (oldestBatchEnd - now) / 86400000)
    const cycleEndingSoon = daysUntilCycleEnd < 14 && daysUntilCycleEnd > 0

    if (fin.averageScore >= 61) {
      rule = 'financial_crisis'
      pinnedFeed = 'funding'
      bannerMessage = 'Financial risk elevated — review budget and recapitalization'
      bannerLevel = fin.averageScore >= 81 ? 'critical' : 'high'
    } else if (ops.averageScore >= 61) {
      rule = 'health_crisis'
      pinnedFeed = 'health_report'
      bannerMessage = 'Farm operations require attention — check health and feed reports'
      bannerLevel = ops.averageScore >= 81 ? 'critical' : 'high'
    } else if (cycleEndingSoon && fin.averageScore >= 31) {
      rule = 'cycle_ending'
      pinnedFeed = 'funding'
      bannerMessage = 'Production cycle ending soon — prioritize recapitalization'
      bannerLevel = 'high'
    } else if (env.averageScore >= 61) {
      pinnedFeed = 'weather_alert'
      bannerMessage = 'Weather risk detected — secure farm infrastructure'
      bannerLevel = env.averageScore >= 81 ? 'critical' : 'high'
    }

    const cards = this.buildDashboardCards(domains, rule, bannerLevel)
    const actions = this.buildQuickActions(domains, rule)

    const minNotif: PriorityLevel = data.role === 'Worker' ? 'high' : rule === 'stable' ? 'medium' : 'low'

    return {
      decision: {
        dominantDomain: dominant.domain,
        dominantLabel: dominant.label,
        rule,
        bannerMessage,
        bannerLevel,
      },
      cards,
      actions,
      pinnedFeed,
      minNotif,
    }
  }

  private buildDashboardCards(
    domains: DomainPriority[],
    rule: BehavioralRule,
    bannerLevel: PriorityLevel | null,
  ): DashboardCardPriority[] {
    const allCards: DashboardCardPriority[] = [
      { id: 'hero', label: 'Farm Overview', priority: 50, highlight: false, badge: null },
      { id: 'savings', label: 'Production Savings', priority: 40, highlight: false, badge: null },
      { id: 'priorities', label: "Today's Priorities", priority: 60, highlight: false, badge: null },
      { id: 'health', label: 'Farm Health Snapshot', priority: 55, highlight: false, badge: null },
      { id: 'actions', label: 'Quick Actions', priority: 45, highlight: false, badge: null },
      { id: 'iq', label: 'GOONA IQ', priority: 35, highlight: false, badge: null },
      { id: 'weather', label: 'Weather Intelligence', priority: 30, highlight: false, badge: null },
      { id: 'batches', label: 'Batch Progress', priority: 40, highlight: false, badge: null },
      { id: 'activity', label: 'Activity Chart', priority: 25, highlight: false, badge: null },
      { id: 'stats', label: 'Quick Stats', priority: 20, highlight: false, badge: null },
    ]

    const fin = domains.find(d => d.domain === 'financial')!
    const ops = domains.find(d => d.domain === 'farm_operations')!
    const env = domains.find(d => d.domain === 'environment')!

    if (rule === 'financial_crisis') {
      allCards.find(c => c.id === 'priorities')!.priority = 95
      allCards.find(c => c.id === 'savings')!.priority = 85
      allCards.find(c => c.id === 'actions')!.priority = 75
      allCards.find(c => c.id === 'health')!.priority = 40
      if (bannerLevel === 'critical') {
        allCards.find(c => c.id === 'hero')!.highlight = true
        allCards.find(c => c.id === 'priorities')!.badge = 'critical'
      }
    } else if (rule === 'health_crisis') {
      allCards.find(c => c.id === 'health')!.priority = 95
      allCards.find(c => c.id === 'priorities')!.priority = 80
      allCards.find(c => c.id === 'batches')!.priority = 70
      allCards.find(c => c.id === 'hero')!.priority = 30
      allCards.find(c => c.id === 'health')!.badge = ops.level
    } else if (rule === 'cycle_ending') {
      allCards.find(c => c.id === 'savings')!.priority = 90
      allCards.find(c => c.id === 'priorities')!.priority = 80
      allCards.find(c => c.id === 'actions')!.priority = 70
    }

    if (env.averageScore >= 61) {
      allCards.find(c => c.id === 'weather')!.priority = Math.max(
        allCards.find(c => c.id === 'weather')!.priority,
        85,
      )
      allCards.find(c => c.id === 'weather')!.badge = env.level
    }

    allCards.sort((a, b) => b.priority - a.priority)
    return allCards
  }

  private buildQuickActions(domains: DomainPriority[], rule: BehavioralRule): QuickActionPriority[] {
    const actions: QuickActionPriority[] = [
      { label: 'Record Sale', priority: 30, highlight: false },
      { label: 'Expenses', priority: 35, highlight: false },
      { label: 'Daily Records', priority: 40, highlight: false },
      { label: 'Academy', priority: 10, highlight: false },
    ]

    if (rule === 'financial_crisis') {
      actions.find(a => a.label === 'Expenses')!.priority = 85
    } else if (rule === 'health_crisis') {
      actions.find(a => a.label === 'Daily Records')!.priority = 95
      actions.find(a => a.label === 'Daily Records')!.highlight = true
      actions.find(a => a.label === 'Expenses')!.priority = 50
    } else {
      actions.find(a => a.label === 'Daily Records')!.priority = 60
      actions.find(a => a.label === 'Record Sale')!.priority = 55
    }

    actions.sort((a, b) => b.priority - a.priority)
    return actions
  }
}

/* ══════════════════════════════════════════════════════════════
   React Integration — Context, Provider, Hooks
   ══════════════════════════════════════════════════════════════ */

const DEFAULT_PRIORITY_STATE: PriorityState = {
  signals: [],
  domains: [],
  dashboardCards: [],
  quickActions: [],
  pinnedFeedType: null,
  minNotificationLevel: 'low',
  decision: {
    dominantDomain: 'financial',
    dominantLabel: 'Financial',
    rule: 'stable',
    bannerMessage: null,
    bannerLevel: null,
  },
  lastUpdated: Date.now(),
}

const PriorityContext = createContext<PriorityState>(DEFAULT_PRIORITY_STATE)

const engine = new FarmPriorityEngine()

/* ── Priority Provider ── */

export function PriorityProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PriorityState>(() =>
    engine.compute(collectEngineData()),
  )

  useEffect(() => {
    const stores = [
      useAuthStore,
      useBatchStore,
      useWeatherStore,
      usePlanStore,
      useFarmChatStore,
      useNotificationStore,
    ]

    const recompute = () => {
      const data = collectEngineData()
      setState(engine.compute(data))
    }

    const unsubs = stores.map(s => s.subscribe(recompute))
    return () => unsubs.forEach(fn => fn())
  }, [])

  return (
    <PriorityContext.Provider value={state}>
      {children}
    </PriorityContext.Provider>
  )
}

/* ── usePriorityEngine ── */

export function usePriorityEngine(): PriorityState {
  return useContext(PriorityContext)
}

/* ── useAdaptiveDashboard ── */

export function useAdaptiveDashboard(): DashboardCardPriority[] {
  const { dashboardCards } = usePriorityEngine()
  return dashboardCards
}

/* ── usePrioritizedChat ── */

export function usePrioritizedChat() {
  const { pinnedFeedType, domains } = usePriorityEngine()
  const feedPosts = useFarmChatStore(s => s.feedPosts)

  const ops = domains.find(d => d.domain === 'farm_operations')
  const fin = domains.find(d => d.domain === 'financial')

  const rankedFeed = useMemo(() => {
    const pinned: FeedPost[] = []
    const high: FeedPost[] = []
    const normal: FeedPost[] = []

    for (const post of feedPosts) {
      if (pinnedFeedType && post.type === pinnedFeedType) {
        pinned.push(post)
      } else if (post.isAlert || post.riskLevel === 'high' || post.type === 'ai_alert') {
        high.push(post)
      } else {
        normal.push(post)
      }
    }

    const pinScore = (p: FeedPost): number => {
      let s = 0
      if (p.isAlert) s += 50
      if (p.timestamp > Date.now() - 3600000) s += 20
      if (p.type === 'ai_insight' && ops && ops.averageScore >= 61) s += 30
      if (p.type === 'funding' && fin && fin.averageScore >= 61) s += 30
      return s
    }

    const sortByTime = (arr: FeedPost[]) => arr.sort((a, b) => b.timestamp - a.timestamp)
    const sortByScore = (arr: FeedPost[]) => arr.sort((a, b) => pinScore(b) - pinScore(a))

    return [...sortByScore(pinned), ...sortByScore(high), ...sortByTime(normal)]
  }, [feedPosts, pinnedFeedType, ops, fin])

  return { rankedFeed, pinnedFeedType }
}

/* ── useSmartNotifications ── */

export function useSmartNotifications() {
  const { minNotificationLevel, decision } = usePriorityEngine()
  const role = useAuthStore(s => s.role)
  const notifications = useNotificationStore(s => s.notifications)

  const levelRank: Record<PriorityLevel, number> = { low: 0, medium: 1, high: 2, critical: 3 }
  const notifRank: Record<NotificationPriority, number> = { info: 0, success: 1, warning: 2, critical: 3 }

  const filtered = useMemo(() => {
    const minRank = levelRank[minNotificationLevel]
    return notifications.filter(n => {
      if (n.priority === 'critical') return true
      if (role === 'Worker' && (n.category === 'wallet' || n.category === 'security')) return false
      return notifRank[n.priority] >= minRank
    })
  }, [notifications, minNotificationLevel, role])

  return { filtered, minNotificationLevel, activeRule: decision.rule }
}

/* ── useAdaptiveQuickActions ── */

export function useAdaptiveQuickActions(): QuickActionPriority[] {
  const { quickActions } = usePriorityEngine()
  return quickActions
}

/* ── usePriorityBanner ── */

export function usePriorityBanner(): { message: string | null; level: PriorityLevel | null } {
  const { decision } = usePriorityEngine()
  return { message: decision.bannerMessage, level: decision.bannerLevel }
}

/* ── useDomainColor ── */

export function useDomainColor(domain: SignalDomain): string {
  const { domains } = usePriorityEngine()
  return domains.find(d => d.domain === domain)?.color ?? PRIORITY_COLORS.low
}

export default engine
