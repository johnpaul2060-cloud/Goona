import { useBatchStore } from './useBatchStore'
import type { FeedPost } from './useFarmChatStore'

export interface GoonaIQInsight {
  id: string
  title: string
  detail: string
  highlight?: string
  riskLevel: 'low' | 'medium' | 'high'
  riskReason: string
  aiAction: string
  batchName?: string
  tags?: string[]
  timestamp: number
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

function minsAgo(m: number) { return Date.now() - m * 60000 }

function hoursAgo(h: number) { return Date.now() - h * 3600000 }

export function generateGoonaIQInsights(): GoonaIQInsight[] {
  const batches = useBatchStore.getState().batches
  const insights: GoonaIQInsight[] = []

  for (const batch of batches) {
    if (batch.status !== 'active') continue

    const startDate = new Date(batch.startDate)
    const dayOfCycle = Math.floor((Date.now() - startDate.getTime()) / 86400000)
    const weeksElapsed = Math.floor(dayOfCycle / 7)
    const totalWeeks = parseInt(batch.duration) || 8
    const progressPct = Math.min(100, Math.round((dayOfCycle / (totalWeeks * 7)) * 100))

    const isBroiler = batch.livestockType === 'Broilers'

    if (isBroiler) {
      const expectedWeight = 1.5
      const achievedWeight = expectedWeight * (0.85 + (progressPct / 100) * 0.25)
      const weightGap = ((achievedWeight - expectedWeight) / expectedWeight) * 100
      const onTrack = achievedWeight >= expectedWeight * 0.92

      insights.push({
        id: generateId(),
        title: `Bird Growth Insight — ${batch.batchName}`,
        detail: onTrack
          ? `${batch.batchName} birds averaging ${achievedWeight.toFixed(2)} kg at day ${dayOfCycle}. Growth trajectory is within targets.`
          : `${batch.batchName} birds averaging ${achievedWeight.toFixed(2)} kg at day ${dayOfCycle}. Below target of ${expectedWeight} kg.`,
        highlight: `${achievedWeight.toFixed(2)} kg avg`,
        riskLevel: onTrack ? 'low' : 'medium',
        riskReason: onTrack
          ? `Weight gain on track at ${weightGap.toFixed(1)}% of target.`
          : `Weight at ${achievedWeight.toFixed(2)} kg is below ${expectedWeight} kg target (${Math.abs(weightGap).toFixed(1)}% gap).`,
        aiAction: onTrack
          ? 'Continue current feeding regimen. Schedule next weight sample for day 25.'
          : 'Increase feed supplementation by 10%. Add protein boost to drinking water for 3 days.',
        batchName: batch.batchName,
        tags: ['Weight', 'Growth', `${progressPct}% Cycle`],
        timestamp: minsAgo(30),
      })
    }

    if ((dayOfCycle === 7 || dayOfCycle === 14 || dayOfCycle === 21 || dayOfCycle === 28) && progressPct < 100) {
      const dailyFeed = isBroiler ? 0.09 : 0.12
      const totalFeedSoFar = Math.round(batch.quantity * dailyFeed * dayOfCycle)
      const projectedTotal = Math.round(batch.quantity * dailyFeed * (totalWeeks * 7))

      insights.push({
        id: generateId(),
        title: `Feed Intake Milestone — ${batch.batchName}`,
        detail: `Day ${dayOfCycle} feed check: ~${totalFeedSoFar} kg consumed. ${progressPct}% through cycle. Projected total: ~${projectedTotal} kg.`,
        highlight: `${totalFeedSoFar} kg consumed`,
        riskLevel: 'low',
        riskReason: `Feed consumption at ${Math.round((totalFeedSoFar / projectedTotal) * 100)}% of projected total. Consumption pattern is normal.`,
        aiAction: `Verify feed inventory. Ensure at least ${Math.round(projectedTotal - totalFeedSoFar)} kg remaining for rest of cycle.`,
        batchName: batch.batchName,
        tags: ['Feed', 'Consumption', `${dayOfCycle}d`],
        timestamp: minsAgo(15),
      })
    }

    if (!isBroiler && dayOfCycle >= 119 && dayOfCycle % 7 === 0) {
      insights.push({
        id: generateId(),
        title: `Expected Laying Week — ${batch.batchName}`,
        detail: `${batch.batchName} at week ${weeksElapsed} of ${totalWeeks}. Peak laying period: monitor egg production rates and shell quality daily.`,
        highlight: `Week ${weeksElapsed} · Layer`,
        riskLevel: 'low',
        riskReason: `Standard laying cycle. Expected production rate: 75-85% at this stage.`,
        aiAction: 'Increase calcium supplementation. Collect eggs 3x daily to prevent breakage. Monitor shell thickness.',
        batchName: batch.batchName,
        tags: ['Laying', 'Production', `Week ${weeksElapsed}`],
        timestamp: hoursAgo(1),
      })
    }

    if (dayOfCycle > 0 && dayOfCycle % 14 === 0) {
      const expectedMortality = Math.round(batch.quantity * 0.03)
      const currentMortRate = (1.5 + Math.random() * 3.5)
      const withinThreshold = currentMortRate <= 3

      insights.push({
        id: generateId(),
        title: `Mortality Review — ${batch.batchName}`,
        detail: withinThreshold
          ? `Mortality rate at ${currentMortRate.toFixed(1)}% for ${batch.batchName}. Within the 3% threshold. Cumulative: ~${expectedMortality} birds.`
          : `Mortality rate at ${currentMortRate.toFixed(1)}% for ${batch.batchName}. Exceeds 3% threshold. Investigate causes.`,
        highlight: `${currentMortRate.toFixed(1)}% rate`,
        riskLevel: withinThreshold ? 'low' : 'high',
        riskReason: withinThreshold
          ? `Mortality within expected range. Continue standard monitoring.`
          : `Mortality above threshold. Check ventilation, water quality, and disease signs.`,
        aiAction: withinThreshold
          ? 'Continue regular mortality monitoring. Log any unusual deaths immediately.'
          : 'Quarantine affected area. Check feed and water. Consult veterinarian if rate continues rising.',
        batchName: batch.batchName,
        tags: ['Mortality', batch.livestockType, `${currentMortRate.toFixed(1)}%`],
        timestamp: hoursAgo(2),
      })
    }
  }

  return insights
}

export function insightsToFeedPosts(insights: GoonaIQInsight[]): FeedPost[] {
  return insights.map((i) => ({
    id: i.id,
    type: 'ai_insight',
    timestamp: i.timestamp,
    actorName: 'GOONA IQ',
    actorRole: 'Predictive Intelligence',
    actorInitials: 'GI',
    actorColor: '#20C997',
    detail: i.detail,
    highlight: i.highlight,
    tags: i.tags,
    likes: 0,
    liked: false,
    saved: false,
    comments: 0,
    batch: i.batchName,
    riskLevel: i.riskLevel,
    riskReason: i.riskReason,
    aiAction: i.aiAction,
    visibility: 'all',
  }))
}
