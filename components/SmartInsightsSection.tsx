import React, { useMemo, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet,
} from 'react-native'
import { router } from 'expo-router'
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import GoonaIcon from './ui/GoonaIcon'
import { Icons } from '../shared/icons'
import type { Batch } from '../store/useBatchStore'
import type { HistoryRecord } from '../store/useHistoryStore'
import type { Animal } from '../store/useAnimalStore'
import { useHistoryStore } from '../store/useHistoryStore'
import { useAnimalStore } from '../store/useAnimalStore'

type InsightSeverity = 'positive' | 'opportunity' | 'action' | 'alert'

const SEVERITY_CONFIG: Record<InsightSeverity, { label: string; color: string; accent: string; bg: string; glow: string }> = {
  positive: { label: 'Positive', color: '#2E7D32', accent: '#43A047', bg: '#F0FDF4', glow: 'rgba(46,125,50,0.12)' },
  opportunity: { label: 'Opportunity', color: '#AEEA00', accent: '#C6FF00', bg: '#F7FEE7', glow: 'rgba(174,234,0,0.15)' },
  action: { label: 'Action', color: '#F59E0B', accent: '#F59E0B', bg: '#FFFBEB', glow: 'rgba(245,158,11,0.12)' },
  alert: { label: 'Alert', color: '#EF4444', accent: '#EF4444', bg: '#FEF2F2', glow: 'rgba(239,68,68,0.12)' },
}

interface InsightCTA {
  label: string
  route: string
  params?: Record<string, string>
}

interface Insight {
  id: string
  severity: InsightSeverity
  icon: any
  title: string
  body: string
  metric?: { label: string; value: string }
  cta?: InsightCTA
}

function formatNaira(amount: number): string {
  if (amount >= 1_000_000) return `\u20A6${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1000) return `\u20A6${(amount / 1000).toFixed(0)}k`
  return `\u20A6${Math.round(amount).toLocaleString('en-NG')}`
}

function weeksSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (7 * 24 * 60 * 60 * 1000))
}

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (24 * 60 * 60 * 1000))
}

interface Props {
  storeBatch: Batch | undefined
}

export default function SmartInsightsSection({ storeBatch }: Props) {
  const records = useHistoryStore((s) => s.records)
  const animals = useAnimalStore((s) => s.animals)

  const deriveInsights = useCallback((batch: Batch): Insight[] => {
    try {
      const result: Insight[] = []
      const isIndividual = batch.model === 'individual'
      const isBreeder = batch.model === 'breeder'
      const isFlock = !isIndividual && !isBreeder
      const daysActive = batch.startDate ? daysSince(batch.startDate) : 0
      const batchRecords = records.filter(
        (r) => r.batchId === batch.id || r.batch === batch.batchName
      )
      const uniqueDaysWithRecords = new Set(
        batchRecords.map((r) => new Date(r.timestamp).toDateString())
      ).size
      const completenessRatio = daysActive > 0 ? Math.min(1, uniqueDaysWithRecords / daysActive) : 0
      const recordCount = batchRecords.length
      const totalCost = (batch.purchaseCost ?? 0) + (batch.feedCost ?? 0) + (batch.medicationCost ?? 0)
      const estRevenue = totalCost > 0 ? Math.round(totalCost * 2.12) : 0
      const feedRecords = batchRecords.filter((r) => r.type === 'feed')
      const mortalityRecords = batchRecords.filter((r) => r.type === 'mortality')
      const totalMortality = mortalityRecords.reduce((s, r) => s + (r.quantity || 0), 0)
      const expenseRecords = batchRecords.filter((r) => r.type === 'expense')
      const totalSpent = expenseRecords.reduce((s, r) => s + (r.cost || 0), 0)
      const elapsedWeeks = batch.startDate ? weeksSince(batch.startDate) : 0
      const totalWeeks = Math.max(parseInt(batch.duration ?? '0', 10) || 1, 1)
      const progress = Math.min(100, Math.round((elapsedWeeks / totalWeeks) * 100))
      const batchAnimals = animals.filter((a) => a.batchId === batch.id)
      const profiledCount = batchAnimals.length
      const livestockLabel = (batch.livestockType ?? '').toLowerCase() || 'batch'
      const unitLabel = isIndividual ? 'animals' : isBreeder ? 'breeders' : 'birds'

      // HERO INSIGHT: highest priority, most important
      if (recordCount === 0) {
        result.push({
          id: 'hero-start',
          severity: 'opportunity',
          icon: Icons.sparkles,
          title: `Ready to track ${batch.batchName}`,
          body: `Your ${livestockLabel} batch was started ${daysActive > 0 ? `${daysActive} day${daysActive === 1 ? '' : 's'}` : 'today'} ago. Log your first feed or medication entry to unlock tracking insights.`,
          metric: { label: 'Days active', value: `${daysActive}d` },
          cta: { label: 'Log Feed', route: '/daily-records', params: { batchId: batch.id } },
        })
      } else if (daysActive <= 3) {
        result.push({
          id: 'hero-early',
          severity: 'positive',
          icon: Icons.trendingUp,
          title: 'Off to a good start',
          body: `${recordCount} record${recordCount === 1 ? '' : 's'} logged in ${daysActive} day${daysActive === 1 ? '' : 's'}. Consistent daily logs build accurate growth and cost projections.`,
          metric: { label: 'Records', value: `${recordCount}` },
          cta: { label: 'Log Today', route: '/daily-records', params: { batchId: batch.id } },
        })
      } else if (completenessRatio < 0.3 && daysActive > 7) {
        result.push({
          id: 'hero-gap',
          severity: 'action',
          icon: Icons.bell,
          title: 'Logging gap detected',
          body: `Records logged on ${uniqueDaysWithRecords} of ${daysActive} days. Regular entries improve profit forecasts and early warning detection.`,
          metric: { label: 'Coverage', value: `${Math.round(completenessRatio * 100)}%` },
          cta: { label: 'Catch Up', route: '/daily-records', params: { batchId: batch.id } },
        })
      } else if (!isIndividual && feedRecords.length === 0 && daysActive > 3) {
        result.push({
          id: 'hero-feed',
          severity: 'action',
          icon: Icons.wheat,
          title: 'Feed tracking not started',
          body: `Feed is your largest variable cost. Log feed entries to track efficiency and cost per ${unitLabel}.`,
          cta: { label: 'Log Feed', route: '/daily-records', params: { batchId: batch.id } },
        })
      } else if (estRevenue > 0 && progress < 90) {
        result.push({
          id: 'hero-revenue',
          severity: 'positive',
          icon: Icons.trendingUp,
          title: `Projected revenue ${formatNaira(estRevenue)}`,
          body: `Based on total investment of ${formatNaira(totalCost)} and current market conditions. Final returns depend on feed efficiency and mortality.`,
          metric: { label: 'Investment', value: formatNaira(totalCost) },
        })
      } else if (progress >= 90) {
        result.push({
          id: 'hero-harvest',
          severity: 'positive',
          icon: Icons.checkCheck,
          title: isFlock ? 'Approaching harvest window' : 'Approaching cycle end',
          body: `Batch is at ${progress}% of its cycle. Start planning sales channels and completing your final records for a full cycle review.`,
          metric: { label: 'Progress', value: `${progress}%` },
        })
      } else {
        result.push({
          id: 'hero-default',
          severity: 'positive',
          icon: Icons.shieldCheck,
          title: `${batch.batchName} is on track`,
          body: `${recordCount} records tracked across ${uniqueDaysWithRecords} day${uniqueDaysWithRecords === 1 ? '' : 's'}. Keep logging daily for the best insights.`,
          metric: { label: 'Records', value: `${recordCount}` },
          cta: { label: 'Log Today', route: '/daily-records', params: { batchId: batch.id } },
        })
      }

      // SECONDARY INSIGHTS (sorted by severity)
      if (isFlock && totalMortality > 0) {
        const mortalityRate = batch.quantity > 0 ? ((totalMortality / batch.quantity) * 100).toFixed(1) : '0'
        const isHigh = parseFloat(mortalityRate) > 5
        result.push({
          id: 'mortality',
          severity: isHigh ? 'alert' : 'action',
          icon: Icons.skull,
          title: `Mortality ${mortalityRate}%`,
          body: `${totalMortality} ${unitLabel} lost${isHigh ? ' — above typical range. Review ventilation, temperature, and feed quality.' : ' — within expected range.'}`,
          metric: { label: 'Lost', value: `${totalMortality}` },
          cta: isHigh ? { label: 'Review', route: '/daily-records', params: { batchId: batch.id } } : undefined,
        })
      }

      if (!isIndividual && feedRecords.length === 0 && daysActive > 2) {
        result.push({
          id: 'feed-onboarding',
          severity: 'opportunity',
          icon: Icons.wheat,
          title: 'Track feed efficiency',
          body: 'Log feed quantities to unlock cost-per-kilogram insights and compare against industry benchmarks.',
          cta: { label: 'Start Feed Log', route: '/daily-records', params: { batchId: batch.id } },
        })
      } else if (feedRecords.length > 0) {
        const totalFeed = feedRecords.reduce((s, r) => s + (r.quantity || 0), 0)
        result.push({
          id: 'feed-tracked',
          severity: 'positive',
          icon: Icons.wheat,
          title: `Feed tracked: ${totalFeed > 1000 ? `${(totalFeed / 1000).toFixed(1)}t` : `${totalFeed}kg`}`,
          body: `${feedRecords.length} feed entr${feedRecords.length === 1 ? 'y' : 'ies'} recorded. Consistent logging builds the feed conversion graph.`,
        })
      }

      if (estRevenue > 0 && totalSpent > 0 && (batch.budgetAllocations ?? []).length > 0) {
        const margin = estRevenue - totalSpent
        const marginPct = totalSpent > 0 ? Math.round((margin / totalSpent) * 100) : 0
        result.push({
          id: 'margin',
          severity: margin > 0 ? 'positive' : 'alert',
          icon: margin > 0 ? Icons.barChart : Icons.trendingDown,
          title: `${margin > 0 ? '' : 'Negative '}Margin ${marginPct}%`,
          body: margin > 0
            ? `Estimated profit of ${formatNaira(margin)} against total spend of ${formatNaira(totalSpent)}.`
            : `Estimated loss of ${formatNaira(Math.abs(margin))}. Review feed costs and pricing strategy.`,
          metric: { label: 'Est. Profit', value: margin > 0 ? formatNaira(margin) : `-${formatNaira(Math.abs(margin))}` },
          cta: margin < 0 ? { label: 'Review Budget', route: '/daily-records', params: { batchId: batch.id } } : undefined,
        })
      }

      if (isIndividual && profiledCount > 0) {
        const activeAnimals = batchAnimals.filter((a) => a.status === 'active').length
        const matedCount = batchAnimals.filter((a) => a.damId || a.sireId).length
        if (matedCount === 0 && daysActive > 7) {
          result.push({
            id: 'breeding-start',
            severity: 'opportunity',
            icon: Icons.heart,
            title: 'Begin breeding records',
            body: `${profiledCount} animal${profiledCount === 1 ? '' : 's'} profiled. Record your first mating to track lineage and plan production cycles.`,
            metric: { label: 'Animals', value: `${activeAnimals} active` },
          })
        }
      }

      if (expenseRecords.length === 0 && daysActive > 5) {
        result.push({
          id: 'expense-tracking',
          severity: 'opportunity',
          icon: Icons.receipt,
          title: 'Track expenses',
          body: 'Log medication, feed purchases, and other costs to see your true cost structure and profit margins.',
          cta: { label: 'Add Expense', route: '/daily-records', params: { batchId: batch.id } },
        })
      }

      return result
    } catch {
      return [{
        id: 'hero-start',
        severity: 'opportunity',
        icon: Icons.sparkles,
        title: `Ready to track ${batch?.batchName ?? 'batch'}`,
        body: 'Log your first entry to unlock tracking insights.',
        metric: { label: 'Status', value: 'Cold start' },
        cta: { label: 'Log Feed', route: '/daily-records', params: { batchId: batch?.id } },
      }]
    }
  }, [records, animals])

  const allInsights = useMemo(() => {
    if (!storeBatch) return []
    return deriveInsights(storeBatch)
  }, [storeBatch, deriveInsights])

  const sortedInsights = useMemo(() => {
    const severityRank: Record<InsightSeverity, number> = { alert: 0, action: 1, opportunity: 2, positive: 3 }
    return [...allInsights].sort((a, b) => severityRank[a.severity] - severityRank[b.severity])
  }, [allInsights])

  const heroInsight = sortedInsights[0] ?? null
  const secondaryInsights = sortedInsights.slice(1)

  const daysActive = storeBatch ? daysSince(storeBatch.startDate) : 0
  const recordCount = storeBatch
    ? records.filter((r) => r.batchId === storeBatch.id || r.batch === storeBatch.batchName).length
    : 0
  const uniqueDays = storeBatch
    ? new Set(
        records
          .filter((r) => r.batchId === storeBatch.id || r.batch === storeBatch.batchName)
          .map((r) => new Date(r.timestamp).toDateString())
      ).size
    : 0
  const completenessPct = daysActive > 0 ? Math.min(100, Math.round((uniqueDays / daysActive) * 100)) : 0

  const handleCta = useCallback((cta: InsightCTA) => {
    const params = new URLSearchParams(cta.params ?? {}).toString()
    const path = params ? `${cta.route}?${params}` : cta.route
    router.push(path as any)
  }, [])

  if (!storeBatch) return null

  return (
    <Animated.View entering={FadeInUp.duration(500).delay(400).springify()}>
      <View style={styles.iqHeader}>
        <View style={styles.iqHeaderLeft}>
          <View style={styles.iqHeaderIcon}>
            <GoonaIcon icon={Icons.sparkles} size={16} color="#17663A" />
          </View>
          <Text style={styles.secTitle}>Smart Insights</Text>
          <Text style={styles.secMeta}>GOONA IQ</Text>
        </View>
        <View style={styles.completenessBadge}>
          <View style={styles.completenessTrack}>
            <View style={[styles.completenessFill, { width: `${completenessPct}%` }]} />
          </View>
          <Text style={styles.completenessText}>{completenessPct}%</Text>
        </View>
      </View>
      <Text style={styles.iqSub}>
        {completenessPct < 30
          ? 'Insights sharpen as you log more data'
          : completenessPct < 70
            ? 'Good data flow — insights becoming more accurate'
            : 'Strong data foundation — insights at full power'}
      </Text>

      {/* HERO INSIGHT */}
      {heroInsight && (
        <HeroInsightCard insight={heroInsight} onCta={handleCta} />
      )}

      {/* SECONDARY INSIGHTS */}
      {secondaryInsights.length > 0 && (
        <View style={styles.secondaryStack}>
          {secondaryInsights.map((insight, i) => (
            <SecondaryInsightCard
              key={insight.id}
              insight={insight}
              index={i}
              onCta={handleCta}
            />
          ))}
        </View>
      )}
    </Animated.View>
  )
}

function HeroInsightCard({ insight, onCta }: { insight: Insight; onCta: (cta: InsightCTA) => void }) {
  const cfg = SEVERITY_CONFIG[insight.severity]
  return (
    <Animated.View entering={FadeInUp.duration(550).springify()} style={styles.heroWrap}>
      <LinearGradient
        colors={[cfg.bg, '#FFFFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.heroAccent, { backgroundColor: cfg.color }]} />
      <View style={styles.heroBody}>
        <View style={styles.heroTop}>
          <View style={[styles.heroIconWrap, { backgroundColor: cfg.color + '18' }]}>
            <GoonaIcon icon={insight.icon} size={20} color={cfg.color} />
          </View>
          <View style={styles.heroTopText}>
            <Text style={styles.heroTitle}>{insight.title}</Text>
            {insight.metric && (
              <View style={[styles.metricBadge, { backgroundColor: cfg.color + '12' }]}>
                <Text style={[styles.metricBadgeText, { color: cfg.color }]}>
                  {insight.metric.label}: {insight.metric.value}
                </Text>
              </View>
            )}
          </View>
        </View>
        <Text style={styles.heroBodyText}>{insight.body}</Text>
        {insight.cta && (
          <TouchableOpacity
            style={[styles.heroCta, { backgroundColor: cfg.color }]}
            activeOpacity={0.85}
            onPress={() => onCta(insight.cta!)}
          >
            <Text style={styles.heroCtaText}>{insight.cta.label}</Text>
            <GoonaIcon icon={Icons.chevronRight} size={14} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  )
}

function SecondaryInsightCard({ insight, index, onCta }: { insight: Insight; index: number; onCta: (cta: InsightCTA) => void }) {
  const cfg = SEVERITY_CONFIG[insight.severity]
  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(200 + index * 80).springify()}
      style={[styles.secondaryCard, { borderLeftColor: cfg.color }]}
    >
      <View style={styles.secondaryTop}>
        <View style={[styles.secondaryIconWrap, { backgroundColor: cfg.color + '14' }]}>
          <GoonaIcon icon={insight.icon} size={16} color={cfg.color} />
        </View>
        <View style={styles.secondaryTopText}>
          <Text style={styles.secondaryTitle}>{insight.title}</Text>
          {insight.metric && (
            <Text style={[styles.secondaryMetric, { color: cfg.color }]}>{insight.metric.value}</Text>
          )}
        </View>
      </View>
      <Text style={styles.secondaryBody}>{insight.body}</Text>
      {insight.cta && (
        <TouchableOpacity
          style={styles.secondaryCta}
          activeOpacity={0.7}
          onPress={() => onCta(insight.cta!)}
        >
          <Text style={[styles.secondaryCtaText, { color: cfg.color }]}>{insight.cta.label}</Text>
          <GoonaIcon icon={Icons.chevronRight} size={12} color={cfg.color} />
        </TouchableOpacity>
      )}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  /* Header */
  iqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 22, marginBottom: 4 },
  iqHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iqHeaderIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center' },
  secTitle: { fontSize: 18, fontWeight: '700', color: '#15291A' },
  secMeta: { fontSize: 11, fontWeight: '500', color: '#94A3B8', letterSpacing: 0.5 },
  completenessBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  completenessTrack: { width: 48, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', overflow: 'hidden' },
  completenessFill: { height: '100%', borderRadius: 2, backgroundColor: '#17663A' },
  completenessText: { fontSize: 10, fontWeight: '700', color: '#17663A', minWidth: 28, textAlign: 'right' },
  iqSub: { fontSize: 11, fontWeight: '500', color: '#94A3B8', marginBottom: 14 },

  /* Hero card */
  heroWrap: {
    borderRadius: 28, overflow: 'hidden', marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 28, elevation: 6,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)',
    flexDirection: 'row',
  },
  heroAccent: { width: 6 },
  heroBody: { flex: 1, padding: 20, paddingLeft: 16 },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  heroIconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  heroTopText: { flex: 1 },
  heroTitle: { fontSize: 17, fontWeight: '800', color: '#15291A', marginBottom: 4 },
  metricBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  metricBadgeText: { fontSize: 10, fontWeight: '700' },
  heroBodyText: { fontSize: 13, lineHeight: 20, color: '#475569', marginBottom: 12 },
  heroCta: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 4,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
  },
  heroCtaText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },

  /* Secondary cards */
  secondaryStack: { gap: 8, marginTop: 4, marginBottom: 6 },
  secondaryCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, borderLeftWidth: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },
  secondaryTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  secondaryIconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  secondaryTopText: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  secondaryTitle: { fontSize: 14, fontWeight: '700', color: '#1B1B1B', flex: 1 },
  secondaryMetric: { fontSize: 13, fontWeight: '800' },
  secondaryBody: { fontSize: 12, lineHeight: 18, color: '#64748B', marginBottom: 8, paddingLeft: 42 },
  secondaryCta: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 2, paddingLeft: 42 },
  secondaryCtaText: { fontSize: 12, fontWeight: '700' },
})
