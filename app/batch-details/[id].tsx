import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Dimensions, Modal, TextInput, Alert,
  KeyboardAvoidingView, Platform, AccessibilityInfo,
  Pressable, Keyboard, Switch,
} from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import { StatusBar } from 'expo-status-bar'
import { router, useLocalSearchParams } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { Icons } from '../../shared/icons'
import GoonaIcon from '../../components/ui/GoonaIcon'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, {
  FadeInUp, FadeInDown, SlideInUp,
  useSharedValue, useAnimatedStyle, withSpring, withTiming, Easing,
} from 'react-native-reanimated'
import { useBatchStore, type Batch, type BudgetAllocation } from '../../store/useBatchStore'
import { useHistoryStore } from '../../store/useHistoryStore'
import { useFarmChatStore } from '../../store/useFarmChatStore'
import { useBreederEggStore, type BreederEggRecord } from '../../store/useBreederEggStore'
import { useHatchStore, type HatchBatch } from '../../store/useHatchStore'
import { computeFlockStats, formatFlockAge, formatFlockAgeShort, type FlockStats } from '../../utils/breeder'
import {
  GRADING_FIELDS, isoDateStr, hasGradingBreakdown, computeSettable, summarizeBreederEggs,
  type BreederEggSummary,
} from '../../utils/breederEggs'
import {
  incubationDaysFor, todayIso as hatchTodayIso, expectedHatchIso,
  countdownLabel, nextHatchName, computeHatchKpis, hatchStatusMeta,
} from '../../utils/hatch'
import { computeHatchAggregates } from '../../utils/breederReports'
import DateTimePicker from '@react-native-community/datetimepicker'
import AnimalsSection from '../../components/animals/AnimalsSection'
import BreedingSection from '../../components/animals/BreedingSection'
import SmartInsightsSection from '../../components/SmartInsightsSection'

const { width: SCREEN_W } = Dimensions.get('window')

function weeksSince(dateStr: string): number {
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diff / (7 * 24 * 60 * 60 * 1000))
}

function parseWeeks(duration: string): number {
  const n = parseInt(duration, 10)
  return isNaN(n) ? 8 : n
}

function computeProgress(startDate: string, duration: string): number {
  const total = parseWeeks(duration)
  const elapsed = weeksSince(startDate)
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)))
}

function getBadge(progress: number): { text: string; bg: string; color: string } {
  if (progress > 85) return { text: 'Near Harvest', bg: '#FFFBEB', color: '#F59E0B' }
  if (progress > 50) return { text: 'Healthy', bg: '#F0FDF4', color: '#16A34A' }
  if (progress > 20) return { text: 'Active', bg: '#F0FDF4', color: '#16A34A' }
  return { text: 'Just Started', bg: '#EEF3FF', color: '#1A56FF' }
}

function formatNaira(amount: number): string {
  if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1000) return `₦${(amount / 1000).toFixed(0)}k`
  return `₦${amount.toLocaleString('en-NG')}`
}

function formatNairaFull(amount: number): string {
  if (amount == null || isNaN(amount)) return '\u20A60'
  return `\u20A6${Math.round(Math.abs(amount)).toLocaleString('en-US')}`
}

// ─── RECORDS SECTION ───

function RecordsSection({ batch }: { batch: import('../../store/useBatchStore').Batch }) {
  const records = useHistoryStore((s) => s.records)
  const [expanded, setExpanded] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion)
  }, [])

  const batchRecords = useMemo(() => {
    return records
      .filter((r) => (r.batchId === batch.id || r.batch === batch.batchName))
      // breeder eggs live ONLY in the breeder Egg Records system (Phase 2) —
      // the old layer "eggs" record type must not surface on breeder batches.
      .filter((r) => !(batch.model === 'breeder' && r.type === 'eggs'))
      .sort((a, b) => b.timestamp - a.timestamp)
  }, [records, batch.id, batch.batchName, batch.model])

  const grouped = useMemo(() => {
    const groups: Record<string, import('../../store/useHistoryStore').HistoryRecord[]> = {}
    for (const r of batchRecords) {
      if (!groups[r.type]) groups[r.type] = []
      groups[r.type].push(r)
    }
    return groups
  }, [batchRecords])

  const summaries = useMemo(() => {
    const result: { key: string; label: string; icon: any; color: string; value: string }[] = []
    if (grouped.feed) {
      const total = grouped.feed.reduce((s, r) => s + (r.quantity || 0), 0)
      result.push({ key: 'feed', label: 'Feed', icon: Icons.wheat, color: '#F59E0B', value: `${total.toLocaleString()} kg` })
    }
    if (grouped.water) {
      const total = grouped.water.reduce((s, r) => s + (r.quantity || 0), 0)
      result.push({ key: 'water', label: 'Water', icon: Icons.droplets, color: '#0EA5E9', value: `${total.toLocaleString()} L` })
    }
    if (grouped.mortality) {
      const total = grouped.mortality.reduce((s, r) => s + (r.quantity || 0), 0)
      result.push({ key: 'mortality', label: 'Mortality', icon: Icons.skull, color: '#EF4444', value: `${total} ${batch.model === 'breeder' ? 'breeders' : 'birds'}` })
    }
    if (grouped.eggs) {
      const total = grouped.eggs.reduce((s, r) => s + (r.quantity || 0), 0)
      result.push({ key: 'eggs', label: 'Eggs', icon: Icons.egg, color: '#16A34A', value: `${total.toLocaleString()} eggs` })
    }
    if (grouped.medication) {
      result.push({ key: 'medication', label: 'Medication', icon: Icons.pill, color: '#1A56FF', value: `${grouped.medication.length} logs` })
    }
    if (grouped.expense) {
      const total = grouped.expense.reduce((s, r) => s + (r.cost || 0), 0)
      result.push({ key: 'expense', label: 'Spent', icon: Icons.receipt, color: '#EF4444', value: formatNairaFull(total) })
    }
    if (grouped.sale) {
      const total = grouped.sale.reduce((s, r) => s + (r.cost || 0), 0)
      result.push({ key: 'sale', label: 'Sales', icon: Icons.trendingUp, color: '#2E7D32', value: formatNairaFull(total) })
    }
    if (grouped.inventory) {
      const total = grouped.inventory.reduce((s, r) => s + (r.cost || 0), 0)
      result.push({ key: 'inventory', label: 'Stock', icon: Icons.package, color: '#EF4444', value: formatNairaFull(total) })
    }
    return result
  }, [grouped])

  const recent = batchRecords.slice(0, 20)
  const toggleExpand = useCallback(() => setExpanded((v) => !v), [])

  return (
    <Animated.View entering={FadeInUp.duration(500).delay(420).springify()}>
      <View style={styles.recordsCard}>
        {/* Header with chevron */}
        <TouchableOpacity style={styles.recordsHeader} activeOpacity={0.7} onPress={toggleExpand}>
          <View style={styles.recordsHeaderLeft}>
            <Text style={styles.secTitle}>Records</Text>
            <View style={styles.recordsCountBadge}>
              <Text style={styles.recordsCountText}>{batchRecords.length}</Text>
            </View>
          </View>
          <View style={styles.recordsHeaderRight}>
            <View style={[styles.recordsChevron, expanded && styles.recordsChevronOpen]}>
              <GoonaIcon icon={Icons.chevronDown} size={16} color="#64748B" />
            </View>
          </View>
        </TouchableOpacity>

        {/* Premium summary pills (always visible) */}
        {summaries.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recordsChips} decelerationRate="fast" snapToInterval={140}>
            {summaries.map((s) => (
              <TouchableOpacity
                key={s.key}
                activeOpacity={0.8}
                style={[styles.recordsChipPremium, { backgroundColor: s.color + '0D', borderColor: s.color + '25' }]}
                onPress={() => { if (!expanded) setExpanded(true) }}
              >
                <View style={[styles.recordsChipIcon, { backgroundColor: s.color + '18' }]}>
                  <GoonaIcon icon={s.icon} size={14} color={s.color} />
                </View>
                <View style={styles.recordsChipBody}>
                  <Text style={[styles.recordsChipLabel, { color: s.color }]}>{s.label}</Text>
                  <Text style={[styles.recordsChipValue, { color: s.color }]}>{s.value}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Expanded timeline */}
        {expanded && (
          <Animated.View entering={reduceMotion ? undefined : FadeInDown.duration(250).springify()}>
            <View style={styles.recordsDivider} />

            {recent.map((r) => {
              const ts = new Date(r.timestamp)
              const dateStr = `${ts.getDate()} ${ts.toLocaleString('en-US', { month: 'short' })}`
              const timeStr = ts.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

              let icon: any = Icons.clipboardList
              let color = '#64748B'
              let label = r.type
              let detail = ''

              switch (r.type) {
                case 'feed':
                  icon = Icons.wheat; color = '#F59E0B'; label = 'Feed'
                  detail = r.metadata?.feedType ? `${r.metadata.feedType} \u00B7 ` : ''
                  detail += `${(r.quantity || 0).toLocaleString()} kg`
                  break
                case 'water':
                  icon = Icons.droplets; color = '#0EA5E9'; label = 'Water'
                  detail = `${(r.quantity || 0).toLocaleString()} L`
                  break
                case 'eggs':
                  icon = Icons.egg; color = '#16A34A'; label = 'Eggs'
                  detail = `${(r.quantity || 0).toLocaleString()} eggs`
                  if (r.cost) detail += ` \u00B7 ${formatNairaFull(r.cost)}`
                  break
                case 'mortality':
                  icon = Icons.skull; color = '#EF4444'; label = 'Mortality'
                  detail = `${(r.quantity || 0)} bird${r.quantity === 1 ? '' : 's'}`
                  break
                case 'medication':
                  icon = Icons.pill; color = '#1A56FF'; label = 'Medication'
                  detail = r.metadata?.cause ? `\u2014 ${r.metadata.cause}` : 'Logged'
                  break
                case 'expense':
                  icon = Icons.receipt; color = '#EF4444'; label = 'Expense'
                  detail = r.itemName ? `${r.itemName} \u00B7 ` : ''
                  detail += formatNairaFull(r.cost || 0)
                  break
                case 'sale':
                  icon = Icons.trendingUp; color = '#16A34A'; label = 'Sale'
                  detail = formatNairaFull(r.cost || 0)
                  break
                case 'inventory':
                  icon = Icons.package; color = '#0F766E'; label = 'Stock'
                  detail = r.itemName || 'Item'
                  if (r.quantity) detail += ` \u00B7 ${r.quantity} kg`
                  break
                case 'observation':
                  icon = Icons.eye; color = '#8B5CF6'; label = 'Note'
                  detail = r.notes?.slice(0, 50) || ''
                  break
              }

              return (
                <View key={r.id} style={styles.recordsRow}>
                  <View style={[styles.recordsRowIcon, { backgroundColor: color + '15' }]}>
                    <GoonaIcon icon={icon} size={13} color={color} />
                  </View>
                  <View style={styles.recordsRowBody}>
                    <View style={styles.recordsRowTop}>
                      <Text style={[styles.recordsRowLabel, { color }]}>{label}</Text>
                      <Text style={styles.recordsRowDetail}>{detail}</Text>
                    </View>
                    {r.notes ? <Text style={styles.recordsRowNotes}>{r.notes}</Text> : null}
                  </View>
                  <Text style={styles.recordsRowTime}>{dateStr}<Text style={styles.recordsRowTimeSep}> </Text>{timeStr}</Text>
                </View>
              )
            })}

            {batchRecords.length > 20 && (
              <TouchableOpacity
                style={styles.recordsViewAll}
                activeOpacity={0.7}
                onPress={() => router.push(`/(tabs)/records/sales-revenue?batchFilter=${encodeURIComponent(batch.batchName)}` as any)}
              >
                <Text style={styles.recordsViewAllText}>View all {batchRecords.length} records \u2192</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        )}
      </View>
    </Animated.View>
  )
}

function estimateFeedKgStr(quantity: number, livestockType: string, weeks: number): string {
  const isLayer = livestockType === 'Layers'
  const dailyRate = isLayer ? 0.12 : 0.09
  const total = Math.round(quantity * weeks * 7 * dailyRate)
  return total > 1000 ? `${(total / 1000).toFixed(1)}t` : `${total}kg`
}

const BATCH_DETAILS: Record<string, {
  id: string
  name: string
  subtitle: string
  type: string
  week: string
  totalWeeks: number
  progress: number
  mortality: string
  feedUsed: string
  revenue: string
  birdCount: string
  badge: string
  badgeBg: string
  badgeColor: string
  timeline: { title: string; desc: string; time: string; warn?: boolean }[]
  analytics: {
    metric: string
    label: string
    trend: string
    trendColor: string
    iconBg: string
    iconColor: string
    bars: number[]
    activeBars: number[]
    icon: (c: string) => React.ReactNode
  }[]
  insights: { bg: string; iconColor: string; text: string }[]
}> = {
  batch_a: {
    id: 'batch_a',
    name: 'Broiler Batch A',
    subtitle: 'Started 4 weeks ago',
    type: 'Broilers',
    week: 'Week 4 of 8',
    totalWeeks: 8,
    progress: 68,
    mortality: '1.8%',
    feedUsed: '1,240kg',
    revenue: '₦2.4M',
    birdCount: '420',
    badge: 'Healthy',
    badgeBg: '#F0FDF4',
    badgeColor: '#16A34A',
    timeline: [
      { title: 'Batch Created', desc: 'Broiler Batch A — 500 day-old chicks', time: '4 weeks ago' },
      { title: 'Vaccination Completed', desc: 'Newcastle + Gumboro vaccines administered', time: '2 weeks ago' },
      { title: 'Feed Restocked', desc: '15 bags of grower feed (675kg) delivered', time: '1 week ago' },
      { title: 'Mortality Alert Resolved', desc: 'Heat stress spike addressed — 8 birds lost', time: '4 days ago', warn: true },
      { title: 'Sales Recorded', desc: '12 crates of eggs — ₦54,000 revenue', time: '2 days ago' },
    ],
    analytics: [
      { metric: '84%', label: 'Feed Efficiency', trend: '↑ +12%', trendColor: '#16A34A', iconBg: '#F0FDF4', iconColor: '#16A34A', bars: [40, 55, 70, 60, 85], activeBars: [2, 4], icon: (c: string) => <GoonaIcon icon={Icons.wheat} size={16} color={c} /> },
      { metric: '98.2%', label: 'Survival Rate', trend: '↑ +1.4%', trendColor: '#16A34A', iconBg: '#EEF3FF', iconColor: '#1A56FF', bars: [60, 70, 80, 85, 90], activeBars: [2, 3, 4], icon: (c: string) => <GoonaIcon icon={Icons.shieldCheck} size={16} color={c} /> },
      { metric: '+18%', label: 'Growth Trend', trend: '', trendColor: '#F59E0B', iconBg: '#FFFBEB', iconColor: '#F59E0B', bars: [30, 45, 60, 75, 90], activeBars: [2, 3, 4], icon: (c: string) => <GoonaIcon icon={Icons.trendingUp} size={16} color={c} /> },
      { metric: '₦820k', label: 'Est. Profit', trend: '↑ +24%', trendColor: '#16A34A', iconBg: '#F0FDF4', iconColor: '#16A34A', bars: [35, 50, 65, 75, 90], activeBars: [2, 3, 4], icon: (c: string) => <GoonaIcon icon={Icons.shield} size={16} color={c} /> },
    ],
    insights: [
      { bg: '#E8F5E9', iconColor: '#F9A825', text: 'Feed consistency has improved production efficiency by 14%.' },
      { bg: '#E3F2FD', iconColor: '#1A56FF', text: 'This batch is projected to exceed last cycle profitability by 24%.' },
    ],
  },
  batch_b: {
    id: 'batch_b',
    name: 'Layer Batch B',
    subtitle: 'Started 8 weeks ago',
    type: 'Layers',
    week: 'Week 8 of 8',
    totalWeeks: 8,
    progress: 92,
    mortality: '2.4%',
    feedUsed: '2,180kg',
    revenue: '₦3.1M',
    birdCount: '310',
    badge: 'Near Harvest',
    badgeBg: '#FFFBEB',
    badgeColor: '#F59E0B',
    timeline: [
      { title: 'Batch Created', desc: 'Layer Batch B — 350 pullets', time: '8 weeks ago' },
      { title: 'Vaccination Completed', desc: 'All standard vaccines administered', time: '6 weeks ago' },
      { title: 'Egg Production Started', desc: 'First eggs collected at week 18', time: '3 weeks ago' },
      { title: 'Feed Restocked', desc: '25 bags of layer feed (1,125kg)', time: '1 week ago' },
      { title: 'Bulk Egg Sale', desc: '48 crates — ₦216,000 revenue', time: '3 days ago' },
    ],
    analytics: [
      { metric: '91%', label: 'Feed Efficiency', trend: '↑ +8%', trendColor: '#16A34A', iconBg: '#F0FDF4', iconColor: '#16A34A', bars: [50, 65, 75, 85, 91], activeBars: [2, 3, 4], icon: (c: string) => <GoonaIcon icon={Icons.wheat} size={16} color={c} /> },
      { metric: '97.6%', label: 'Survival Rate', trend: '↑ +0.8%', trendColor: '#16A34A', iconBg: '#EEF3FF', iconColor: '#1A56FF', bars: [70, 75, 85, 90, 97.6], activeBars: [2, 3, 4], icon: (c: string) => <GoonaIcon icon={Icons.shieldCheck} size={16} color={c} /> },
      { metric: '+22%', label: 'Egg Production', trend: '', trendColor: '#F59E0B', iconBg: '#FFFBEB', iconColor: '#F59E0B', bars: [40, 55, 70, 85, 95], activeBars: [2, 3, 4], icon: (c: string) => <GoonaIcon icon={Icons.egg} size={16} color={c} /> },
      { metric: '₦1.2M', label: 'Est. Profit', trend: '↑ +18%', trendColor: '#16A34A', iconBg: '#F0FDF4', iconColor: '#16A34A', bars: [40, 55, 70, 85, 95], activeBars: [2, 3, 4], icon: (c: string) => <GoonaIcon icon={Icons.shield} size={16} color={c} /> },
    ],
    insights: [
      { bg: '#E8F5E9', iconColor: '#F9A825', text: 'Egg production exceeded targets by 12% this cycle.' },
      { bg: '#E3F2FD', iconColor: '#1A56FF', text: 'Feed-to-egg conversion ratio is at optimal levels.' },
    ],
  },
  batch_c: {
    id: 'batch_c',
    name: 'Broiler Batch C',
    subtitle: 'Started 3 weeks ago',
    type: 'Broilers',
    week: 'Week 3 of 8',
    totalWeeks: 8,
    progress: 44,
    mortality: '4.2%',
    feedUsed: '890kg',
    revenue: '₦1.1M',
    birdCount: '280',
    badge: 'Warning',
    badgeBg: '#FFF1F2',
    badgeColor: '#EF4444',
    timeline: [
      { title: 'Batch Created', desc: 'Broiler Batch C — 350 day-old chicks', time: '3 weeks ago' },
      { title: 'Vaccination Completed', desc: 'Newcastle vaccine administered', time: '2 weeks ago' },
      { title: 'Heat Stress Incident', desc: 'Temperature spike — 15 birds lost', time: '1 week ago', warn: true },
      { title: 'Feed Adjusted', desc: 'Increased feed formulation density', time: '5 days ago' },
      { title: 'Mortality Monitoring', desc: 'Increased monitoring schedule implemented', time: '2 days ago' },
    ],
    analytics: [
      { metric: '62%', label: 'Feed Efficiency', trend: '↓ -4%', trendColor: '#EF4444', iconBg: '#FFF1F2', iconColor: '#EF4444', bars: [55, 60, 62, 58, 55], activeBars: [2], icon: (c: string) => <GoonaIcon icon={Icons.wheat} size={16} color={c} /> },
      { metric: '95.8%', label: 'Survival Rate', trend: '↓ -1.2%', trendColor: '#EF4444', iconBg: '#FFF1F2', iconColor: '#EF4444', bars: [85, 88, 92, 95.8, 94], activeBars: [3], icon: (c: string) => <GoonaIcon icon={Icons.shieldCheck} size={16} color={c} /> },
      { metric: '+8%', label: 'Growth Trend', trend: '', trendColor: '#F59E0B', iconBg: '#FFFBEB', iconColor: '#F59E0B', bars: [25, 35, 50, 60, 70], activeBars: [3, 4], icon: (c: string) => <GoonaIcon icon={Icons.trendingUp} size={16} color={c} /> },
      { metric: '₦380k', label: 'Est. Profit', trend: '↓ -6%', trendColor: '#EF4444', iconBg: '#FFF1F2', iconColor: '#EF4444', bars: [30, 45, 55, 50, 45], activeBars: [2], icon: (c: string) => <GoonaIcon icon={Icons.shield} size={16} color={c} /> },
    ],
    insights: [
      { bg: '#FFFBEB', iconColor: '#F59E0B', text: 'Mortality risk elevated. Temperature monitoring recommended.' },
      { bg: '#E3F2FD', iconColor: '#1A56FF', text: 'Feed adjustment showing early signs of recovery.' },
    ],
  },
}

function deriveBreederDetail(batch: import('../../store/useBatchStore').Batch) {
  const stats = computeFlockStats(batch)
  const age = formatFlockAge(batch)
  const totalCost = batch.purchaseCost + batch.feedCost + batch.medicationCost
  const estRevenue = Math.round(totalCost * 2.12)
  const ageShort = formatFlockAgeShort(batch)

  return {
    id: batch.id,
    name: batch.batchName,
    subtitle: `Breeder flock · ${stats.openingTotal} breeders placed`,
    type: batch.livestockType,
    week: `Flock age · ${age}`,
    totalWeeks: 0,
    progress: stats.alivePct,
    mortality: `${stats.totalLosses} lost`,
    feedUsed: `${stats.currentHens} hens`,
    revenue: formatNaira(estRevenue),
    birdCount: `${stats.currentPopulation}`,
    badge: 'Breeder Flock',
    badgeBg: '#F0FDF4',
    badgeColor: '#16A34A',
    timeline: [
      { title: 'Flock Created', desc: `${batch.batchName} — ${stats.openingTotal} breeders placed`, time: `${ageShort} ago`, warn: false },
      { title: 'Breeder Flock Active', desc: `${stats.currentHens} hens / ${stats.currentCocks} cocks under management`, time: 'ongoing', warn: false },
      { title: 'Population Tracking Active', desc: 'Log mortality and culls to keep population live', time: 'ongoing', warn: false },
    ],
    analytics: [
      { metric: `${stats.currentHens}`, label: 'Hens (current)', trend: '', trendColor: '#16A34A', iconBg: '#F0FDF4', iconColor: '#16A34A', bars: [40, 55, 70, 60, 50], activeBars: [2, 4], icon: (c: string) => <GoonaIcon icon={Icons.users} size={16} color={c} /> },
      { metric: `${stats.currentCocks}`, label: 'Cocks (current)', trend: '', trendColor: '#16A34A', iconBg: '#EEF3FF', iconColor: '#1A56FF', bars: [60, 70, 80, 85, 90], activeBars: [2, 3], icon: (c: string) => <GoonaIcon icon={Icons.user} size={16} color={c} /> },
      { metric: stats.ratioLabel, label: 'F : M Ratio', trend: '', trendColor: '#F59E0B', iconBg: '#FFFBEB', iconColor: '#F59E0B', bars: [30, 45, 60, 75, 90], activeBars: [2], icon: (c: string) => <GoonaIcon icon={Icons.heart} size={16} color={c} /> },
      { metric: ageShort, label: 'Flock Age', trend: '', trendColor: '#16A34A', iconBg: '#F0FDF4', iconColor: '#16A34A', bars: [35, 50, 65, 75, 90], activeBars: [2], icon: (c: string) => <GoonaIcon icon={Icons.calendar} size={16} color={c} /> },
    ],
    insights: [
      { bg: '#E8F5E9', iconColor: '#F9A825', text: 'Breeder flock is being tracked. Log mortality and culls to keep the live population accurate.' },
      { bg: '#E3F2FD', iconColor: '#1A56FF', text: 'Add feed, medication, and expense records for accurate breeder profitability forecasts.' },
    ],
  }
}

function deriveBatchDetail(batch: import('../../store/useBatchStore').Batch) {
  const prog = computeProgress(batch.startDate, batch.duration)
  const weeks = weeksSince(batch.startDate)
  const totalWeeks = parseWeeks(batch.duration)
  const badge = getBadge(prog)
  const totalCost = batch.purchaseCost + batch.feedCost + batch.medicationCost
  const estRevenue = Math.round(totalCost * 2.12)
  const feedUsed = estimateFeedKgStr(batch.quantity, batch.livestockType, Math.max(1, weeks))

  return {
    id: batch.id,
    name: batch.batchName,
    subtitle: `Started ${weeks} week${weeks === 1 ? '' : 's'} ago`,
    type: batch.livestockType,
    week: `Week ${Math.min(weeks + 1, totalWeeks)} of ${totalWeeks}`,
    totalWeeks,
    progress: prog,
    mortality: '—',
    feedUsed,
    revenue: formatNaira(estRevenue),
    birdCount: `${batch.quantity}`,
    badge: badge.text,
    badgeBg: badge.bg,
    badgeColor: badge.color,
    timeline: [
      { title: 'Batch Created', desc: `${batch.batchName} — ${batch.quantity} ${batch.livestockType.toLowerCase()}`, time: `${weeks} week${weeks === 1 ? '' : 's'} ago`, warn: false },
      { title: 'Production In Progress', desc: 'Batch is being monitored and tracked', time: `${Math.max(1, weeks - 1)} week${weeks - 1 === 1 ? '' : 's'} ago`, warn: false },
      { title: 'Performance Tracking Active', desc: 'Feed, medication, and growth data being recorded', time: `${Math.max(0, weeks - 2)} week${weeks - 2 === 1 ? '' : 's'} ago`, warn: false },
    ],
    analytics: [
      { metric: '—', label: 'Feed Efficiency', trend: '', trendColor: '#16A34A', iconBg: '#F0FDF4', iconColor: '#16A34A', bars: [40, 55, 70, 60, 50], activeBars: [2, 4], icon: (c: string) => <GoonaIcon icon={Icons.wheat} size={16} color={c} /> },
      { metric: '—', label: 'Survival Rate', trend: '', trendColor: '#16A34A', iconBg: '#EEF3FF', iconColor: '#1A56FF', bars: [60, 70, 80, 85, 90], activeBars: [2, 3], icon: (c: string) => <GoonaIcon icon={Icons.shieldCheck} size={16} color={c} /> },
      { metric: '—', label: 'Growth Trend', trend: '', trendColor: '#F59E0B', iconBg: '#FFFBEB', iconColor: '#F59E0B', bars: [30, 45, 60, 75, 90], activeBars: [2], icon: (c: string) => <GoonaIcon icon={Icons.trendingUp} size={16} color={c} /> },
      { metric: formatNaira(estRevenue), label: 'Est. Revenue', trend: '', trendColor: '#16A34A', iconBg: '#F0FDF4', iconColor: '#16A34A', bars: [35, 50, 65, 75, 90], activeBars: [2], icon: (c: string) => <GoonaIcon icon={Icons.shield} size={16} color={c} /> },
    ],
    insights: [
      { bg: '#E8F5E9', iconColor: '#F9A825', text: 'Batch is being actively tracked. Add daily records to get detailed insights.' },
      { bg: '#E3F2FD', iconColor: '#1A56FF', text: 'Complete feed and medication entries for accurate profitability forecasts.' },
    ],
  }
}

// ─── BUDGET SECTION ───

function BudgetSection({ batch, batchRevenue }: { batch: import('../../store/useBatchStore').Batch; batchRevenue?: number }) {
  const records = useHistoryStore((s) => s.records)
  const updateBudgetAllocations = useBatchStore((s) => s.updateBudgetAllocations)
  const [expanded, setExpanded] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion)
  }, [])

  const allocations = batch.budgetAllocations ?? []
  const totalBudget = allocations.reduce((s, a) => s + a.amount, 0)

  // Compute spend per category from expense + inventory records
  const spendByCategory = useMemo(() => {
    const batchRecords = records.filter(
      (r) => (r.batchId === batch.id || r.batch === batch.batchName) && r.cost
    )
    const result: Record<string, number> = {}
    for (const r of batchRecords) {
      if (r.type === 'expense') {
        const cat = r.itemName || ''
        result[cat] = (result[cat] || 0) + (r.cost || 0)
      } else if (r.type === 'inventory') {
        result['purchase'] = (result['purchase'] || 0) + (r.cost || 0)
      }
    }
    return result
  }, [records, batch.id, batch.batchName])

  // Map allocation categories to their spend (direct key match)
  const allocSpend = useMemo(() => {
    return allocations.map((a) => {
      const spent = spendByCategory[a.key] || 0
      const remaining = a.amount - spent
      let status: 'on_track' | 'near_limit' | 'over_budget' | 'none' = 'none'
      let statusColor = '#94A3B8'
      if (a.amount > 0) {
        const pct = spent / a.amount
        if (pct > 1) { status = 'over_budget'; statusColor = '#EF4444' }
        else if (pct > 0.8) { status = 'near_limit'; statusColor = '#F59E0B' }
        else if (pct > 0) { status = 'on_track'; statusColor = '#16A34A' }
      }
      return { ...a, spent, remaining, status, statusColor }
    })
  }, [allocations, spendByCategory])

  const totalSpent = allocSpend.reduce((s, a) => s + a.spent, 0)
  const totalRemaining = totalBudget - totalSpent
  const overallPct = totalBudget > 0 ? Math.min(totalSpent / totalBudget, 1) : 0
  let overallStatus = '#16A34A'
  if (totalBudget > 0 && totalSpent > totalBudget) overallStatus = '#EF4444'
  else if (totalBudget > 0 && totalSpent / totalBudget > 0.8) overallStatus = '#F59E0B'

  let statusLabel = 'On Track'
  let overallStatusLabelColor = '#16A34A'
  if (totalBudget > 0 && totalSpent > totalBudget) {
    overallStatusLabelColor = '#EF4444'; statusLabel = 'Over Budget'
  } else if (totalBudget > 0 && totalSpent / totalBudget > 0.8) {
    overallStatusLabelColor = '#F59E0B'; statusLabel = 'Near Limit'
  }

  const progressAnim = useSharedValue(0)

  useEffect(() => {
    progressAnim.value = withTiming(overallPct, { duration: 800, easing: Easing.out(Easing.cubic) })
  }, [overallPct])

  const animatedFillStyle = useAnimatedStyle(() => ({
    width: `${progressAnim.value * 100}%`,
    backgroundColor: overallStatus,
  }))

  const toggleExpand = useCallback(() => setExpanded((v) => !v), [])

  return (
    <Animated.View entering={FadeInUp.duration(500).delay(360).springify()}>
      <View style={styles.budgetCard}>
        {/* Header with chevron */}
        <TouchableOpacity style={styles.budgetHeader} activeOpacity={0.7} onPress={toggleExpand}>
          <View style={styles.budgetHeaderLeft}>
            <Text style={styles.secTitle}>Batch Budget</Text>
            {totalBudget > 0 && (
              <View style={[styles.budgetStatusChip, { backgroundColor: overallStatusLabelColor + '15', borderColor: overallStatusLabelColor + '30' }]}>
                <View style={[styles.budgetStatusDot, { backgroundColor: overallStatusLabelColor }]} />
                <Text style={[styles.budgetStatusText, { color: overallStatusLabelColor }]}>{statusLabel}</Text>
              </View>
            )}
          </View>
          <View style={styles.budgetHeaderRight}>
            <Pressable
              onPress={() => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(`/batch-details/budget-setup?id=${batch.id}` as any) }}
              style={({ pressed }) => [styles.budgetEditBtn, { transform: [{ scale: pressed ? 0.95 : 1 }] }]}
            >
              <GoonaIcon icon={Icons.edit3} size={14} color="#17663A" />
            </Pressable>
            <View style={[styles.budgetChevron, expanded && styles.budgetChevronOpen]}>
              <GoonaIcon icon={Icons.chevronDown} size={16} color="#64748B" />
            </View>
          </View>
        </TouchableOpacity>

        {/* Compact premium summary (always visible) */}
        {totalBudget > 0 && (
          <>
            <View style={styles.budgetSummaryCompact}>
              <View style={styles.budgetCompactItem}>
                <Text style={styles.budgetCompactLabel}>Allocated</Text>
                <Text style={styles.budgetCompactValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>{formatNairaFull(totalBudget)}</Text>
              </View>
              <View style={styles.budgetCompactItem}>
                <Text style={styles.budgetCompactLabel}>Spent</Text>
                <Text style={[styles.budgetCompactValue, { color: '#EF4444' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>{formatNairaFull(totalSpent)}</Text>
              </View>
              <View style={styles.budgetCompactItem}>
                <Text style={styles.budgetCompactLabel}>Remaining</Text>
                <Text style={[styles.budgetCompactValue, { color: totalRemaining < 0 ? '#EF4444' : '#16A34A' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>{formatNairaFull(Math.max(0, totalRemaining))}</Text>
              </View>
            </View>

            {/* Slim animated progress bar */}
            <View style={styles.budgetOverallCompactBar}>
              <View style={styles.budgetOverallCompactTrack}>
                <Animated.View style={[styles.budgetOverallCompactFill, animatedFillStyle]} />
              </View>
              <Text style={[styles.budgetOverallCompactPct, { color: overallStatus }]}>{Math.round(overallPct * 100)}%</Text>
            </View>

            {/* Category status pills (horizontal scroll) */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.budgetCatPills} decelerationRate="fast">
              {allocSpend.map((a) => {
                const pct = a.amount > 0 ? Math.round((a.spent / a.amount) * 100) : 0
                return (
                  <TouchableOpacity
                    key={a.key}
                    activeOpacity={0.8}
                    style={[styles.budgetCatPill, { backgroundColor: a.statusColor + '0D', borderColor: a.statusColor + '25' }]}
                    onPress={() => { if (!expanded) setExpanded(true) }}
                  >
                    <View style={[styles.budgetCatPillDot, { backgroundColor: a.statusColor }]} />
                    <Text style={styles.budgetCatPillLabel}>{a.label}</Text>
                    <Text style={[styles.budgetCatPillValue, { color: a.statusColor }]}>{pct}%</Text>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          </>
        )}

        {totalBudget === 0 && (
          <View style={styles.budgetEmptyCompact}>
            <Text style={styles.budgetEmptyText}>No budget set for this batch yet</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.budgetSetBtn}
              onPress={() => router.push(`/batch-details/budget-setup?id=${batch.id}` as any)}
            >
              <Text style={styles.budgetSetBtnText}>Set Batch Budget</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Expanded detail */}
        {expanded && totalBudget > 0 && (
          <Animated.View entering={reduceMotion ? undefined : FadeInDown.duration(250).springify()}>
            <View style={styles.budgetDivider} />

            {/* Per-category breakdown */}
            <View style={styles.budgetCategories}>
              {allocSpend.map((a) => (
                <View key={a.key} style={styles.budgetCatRow}>
                  <View style={styles.budgetCatLeft}>
                    <View style={[styles.budgetCatDot, { backgroundColor: a.statusColor }]} />
                    <Text style={styles.budgetCatLabel}>{a.label}</Text>
                  </View>
                  <View style={styles.budgetCatRight}>
                    <View style={styles.budgetCatAmounts}>
                      <Text style={styles.budgetCatAlloc} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>{formatNairaFull(a.amount)}</Text>
                      <Text style={[styles.budgetCatSpent, { color: a.statusColor }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>{formatNairaFull(a.spent)}</Text>
                    </View>
                    <View style={styles.budgetCatBar}>
                      <View
                        style={[styles.budgetCatBarFill, {
                          width: `${a.amount > 0 ? Math.min(a.spent / a.amount, 1) * 100 : 0}%`,
                          backgroundColor: a.statusColor,
                        }]}
                      />
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* Revenue & Profit */}
            {batchRevenue != null && (
              <>
                <View style={styles.budgetDivider} />
                <View style={styles.revenueSection}>
                  <Text style={styles.revenueSectionTitle}>Revenue & Profit</Text>
                  <View style={styles.revenueGrid}>
                    <View style={styles.revenueItem}>
                      <Text style={styles.revenueLabel}>Revenue</Text>
                      <Text style={[styles.revenueValue, { color: '#2E7D32' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>{formatNairaFull(batchRevenue)}</Text>
                    </View>
                    <View style={styles.revenueItem}>
                      <Text style={styles.revenueLabel}>Spent</Text>
                      <Text style={[styles.revenueValue, { color: '#EF4444' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>{formatNairaFull(totalSpent)}</Text>
                    </View>
                    <View style={styles.revenueItem}>
                      <Text style={styles.revenueLabel}>Profit</Text>
                      <Text style={[styles.revenueValue, { color: batchRevenue - totalSpent >= 0 ? '#2E7D32' : '#EF4444' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
                        {batchRevenue - totalSpent >= 0 ? '' : '-'}{formatNairaFull(Math.abs(batchRevenue - totalSpent))}
                      </Text>
                    </View>
                  </View>
                  {totalBudget > 0 && (
                    <View style={styles.marginRow}>
                      <Text style={styles.marginLabel}>Margin</Text>
                      <View style={[styles.marginBadge, { backgroundColor: batchRevenue - totalSpent >= 0 ? '#F0FDF4' : '#FEF2F2' }]}>
                        <Text style={[styles.marginText, { color: batchRevenue - totalSpent >= 0 ? '#2E7D32' : '#EF4444' }]}>
                          {totalSpent > 0
                            ? `${((batchRevenue - totalSpent) / totalSpent * 100).toFixed(0)}%`
                            : batchRevenue > 0 ? '∞' : '—'}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </>
            )}
          </Animated.View>
        )}
      </View>
    </Animated.View>
  )
}

// ─── BREEDER HERO ───

function BreederHero({ batch, stats, flockAge, isCompleted, eggSummary }: {
  batch: Batch
  stats: FlockStats
  flockAge: string
  isCompleted: boolean
  eggSummary: BreederEggSummary | null
}) {
  return (
    <Animated.View entering={FadeInUp.duration(500).delay(80).springify()} style={styles.hero}>
      <LinearGradient
        colors={isCompleted ? ['#374151', '#4B5563', '#6B7280'] : ['#0C3A24', '#17663A', '#2E8B43', '#3FA345']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.heroOrb1} pointerEvents="none" />
      <View style={styles.heroOrb2} pointerEvents="none" />
      <View style={styles.heroSheen} pointerEvents="none" />
      <View style={styles.heroRinglines} pointerEvents="none" />

      <View style={styles.heroTop}>
        <View>
          <View style={styles.heroEyebrow}>
            <View style={styles.heroLiveDot} />
            <Text style={styles.heroEyebrowText}>{isCompleted ? 'Flock Closed' : 'Breeder Flock · Active'}</Text>
          </View>
          <Text style={styles.heroCount}>
            {stats.currentPopulation} <Text style={styles.heroCountSmall}>{batch.livestockType}</Text>
          </Text>
          <Text style={styles.heroWeek}>Flock age · {flockAge || '—'}</Text>
          <View style={styles.heroChips}>
            <View style={[styles.heroChip, styles.heroChipHot]}>
              <Text style={styles.heroChipHotText}>F : M {stats.ratioLabel}</Text>
            </View>
            <View style={styles.heroChip}>
              <Text style={styles.heroChipText} numberOfLines={1}>{batch.breed || batch.livestockType}</Text>
            </View>
          </View>
        </View>

        {/* ring */}
        <View style={styles.ringWrap}>
          <Svg width="96" height="96" viewBox="0 0 96 96">
            <Circle cx="48" cy="48" r="40" fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="8" />
            <Circle
              cx="48" cy="48" r="40" fill="none"
              stroke={isCompleted ? '#9CA3AF' : '#AEEA00'}
              strokeWidth="8" strokeLinecap="round"
              strokeDasharray="251.2"
              strokeDashoffset={251.2 - (stats.alivePct / 100) * 251.2}
            />
          </Svg>
          <View style={styles.ringCenter}>
            <Text style={[styles.ringPct, isCompleted && { color: '#D1D5DB' }]}>{stats.alivePct}%</Text>
            <Text style={styles.ringLbl}>Alive</Text>
          </View>
        </View>
      </View>

      {/* stat cells */}
      <View style={styles.heroStats}>
        <View style={styles.hstat}>
          <Text style={styles.hstatV} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>{stats.currentHens}</Text>
          <Text style={styles.hstatL}>Hens</Text>
        </View>
        <View style={styles.hstat}>
          <Text style={styles.hstatV} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>{stats.currentCocks}</Text>
          <Text style={styles.hstatL}>Cocks</Text>
        </View>
        <View style={styles.hstat}>
          <Text style={[styles.hstatV, styles.hstatVLime]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>{stats.currentPopulation}</Text>
          <Text style={styles.hstatL}>Population now</Text>
        </View>
      </View>

      {/* laying performance — Phase 2 */}
      {eggSummary ? (
        <View style={styles.heroEggWrap}>
          <Text style={styles.heroEggTitle}>
            Laying · this week{' '}
            <Text style={styles.heroEggSub}> · hen-day on {stats.currentHens} hens</Text>
          </Text>
          <View style={styles.heroEggRow}>
            <View style={styles.heroEggCell}>
              <Text style={styles.heroEggV} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{eggSummary.weeklyEggs.toLocaleString()}</Text>
              <Text style={styles.heroEggL}>Eggs</Text>
            </View>
            <View style={styles.heroEggCell}>
              <Text style={styles.heroEggV} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
                {eggSummary.weeklyDaysActive > 0 && stats.currentHens > 0 ? `${eggSummary.weeklyHenDayPct.toFixed(1)}%` : '—'}
              </Text>
              <Text style={styles.heroEggL}>Hen-day</Text>
            </View>
            <View style={styles.heroEggCell}>
              <Text style={styles.heroEggV} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
                {eggSummary.weeklyEggs > 0 ? `${eggSummary.weeklySettablePct.toFixed(1)}%` : '—'}
              </Text>
              <Text style={styles.heroEggL}>Settable</Text>
            </View>
          </View>
        </View>
      ) : null}

      {/* population bar */}
      <View style={styles.heroProg}>
        <View style={styles.heroProgRow}>
          <Text style={styles.heroProgLabel}>{isCompleted ? 'Flock closed' : `Live population · of ${stats.openingTotal} placed`}</Text>
          <Text style={styles.heroProgVal}>{stats.alivePct}%</Text>
        </View>
        <View style={styles.heroTrack}>
          <View style={[styles.heroTrackFill, { width: `${stats.alivePct}%` as any }]} />
        </View>
      </View>
    </Animated.View>
  )
}

// ─── BREEDER FLOCK MORTALITY / CULLS ───

function MortalityCullsCard({ batch }: { batch: Batch }) {
  const updateBatch = useBatchStore((s) => s.updateBatch)
  const [femaleDeaths, setFemaleDeaths] = useState('')
  const [maleDeaths, setMaleDeaths] = useState('')
  const [culledFemales, setCulledFemales] = useState('')
  const [culledMales, setCulledMales] = useState('')

  const stats = useMemo(() => computeFlockStats(batch), [batch])

  const num = (v: string) => parseInt(v, 10) || 0
  const totalNew = num(femaleDeaths) + num(maleDeaths) + num(culledFemales) + num(culledMales)

  const handleAdd = () => {
    if (totalNew < 1) return
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    updateBatch(batch.id, {
      femaleDeaths: (batch.femaleDeaths ?? 0) + num(femaleDeaths),
      maleDeaths: (batch.maleDeaths ?? 0) + num(maleDeaths),
      culledFemales: (batch.culledFemales ?? 0) + num(culledFemales),
      culledMales: (batch.culledMales ?? 0) + num(culledMales),
    })
    setFemaleDeaths('')
    setMaleDeaths('')
    setCulledFemales('')
    setCulledMales('')
  }

  const entry = (label: string, value: string, set: (v: string) => void, accent: string) => (
    <View style={styles.mortFieldWrap}>
      <View style={[styles.mortFieldDot, { backgroundColor: accent }]} />
      <View style={styles.mortFieldBody}>
        <Text style={styles.mortFieldLabel}>{label}</Text>
        <TextInput
          style={styles.mortInput}
          value={value}
          onChangeText={(v) => set(v.replace(/\D/g, ''))}
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor="#94A3B8"
        />
      </View>
    </View>
  )

  return (
    <Animated.View entering={FadeInUp.duration(500).delay(380).springify()}>
      <View style={styles.recordsCard}>
        <View style={styles.recordsHeader}>
          <View style={styles.recordsHeaderLeft}>
            <Text style={styles.secTitle}>Flock Mortality / Culls</Text>
          </View>
        </View>

        {/* single compact figure — heroes owns population/hens/cocks */}
        <View style={styles.mortSummaryLine}>
          <GoonaIcon icon={Icons.skull} size={13} color="#DC2626" />
          <Text style={styles.mortSummaryLineText}>
            Lost to date — <Text style={styles.mortSummaryLineValue}>{stats.totalLosses}</Text> of {stats.openingTotal} placed
          </Text>
        </View>

        {batch.house ? (
          <View style={styles.mortHouseRow}>
            <GoonaIcon icon={Icons.house} size={13} color="#17663A" />
            <Text style={styles.mortHouse}>House / Pen — {batch.house}</Text>
          </View>
        ) : null}

        {/* add losses */}
        <Text style={styles.mortGridLabel}>Add mortality or culls</Text>
        <View style={styles.mortGrid}>
          {entry('Female deaths', femaleDeaths, setFemaleDeaths, '#EF4444')}
          {entry('Male deaths', maleDeaths, setMaleDeaths, '#EF4444')}
          {entry('Culled females', culledFemales, setCulledFemales, '#F59E0B')}
          {entry('Culled males', culledMales, setCulledMales, '#F59E0B')}
        </View>

        <TouchableOpacity
          style={[styles.mortAddBtn, totalNew < 1 && styles.mortAddBtnDisabled]}
          activeOpacity={0.85}
          onPress={handleAdd}
        >
          <GoonaIcon icon={Icons.minus} size={16} color="#FFFFFF" />
          <Text style={styles.mortAddText}>Add losses — update population</Text>
        </TouchableOpacity>
        <Text style={styles.mortNote}>
          Losses are recorded on the flock record, so population and hen count update live. (currentHens is the reserved hen-day denominator for egg records — Phase 2.)
        </Text>
      </View>
    </Animated.View>
  )
}

// ─── BREEDER EGG RECORDS (PHASE 2) ───

function formatEggDate(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })
}

let eggLineIdCounter = 0
function nextEggLineId(): string {
  return `beg_${Date.now()}_${eggLineIdCounter++}`
}

/** Keyboard-aware bottom sheet helper: shrink-and-scroll body, scroll focused fields into view. */
function useSheetKeyboard() {
  const [keyboardOpen, setKeyboardOpen] = useState(false)
  const scrollRef = useRef<ScrollView>(null)
  const fieldY = useRef<Record<string, number>>({})

  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardOpen(true))
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardOpen(false))
    return () => { show.remove(); hide.remove() }
  }, [])

  /** capture a field's Y (fields must be direct children of the sheet's ScrollView) */
  const captureY = (key: string) => (e: { nativeEvent: { layout: { y: number } } }) => {
    fieldY.current[key] = e.nativeEvent.layout.y
  }

  /** onFocus: scroll the focused field above the keyboard */
  const focusScroll = (key: string) => () => {
    setTimeout(() => {
      const y = fieldY.current[key]
      if (y != null && y > 0) scrollRef.current?.scrollTo({ y: Math.max(0, y - 96), animated: true })
    }, 150)
  }

  const resetKeyboard = useCallback(() => setKeyboardOpen(false), [])

  return { keyboardOpen, scrollRef, captureY, focusScroll, resetKeyboard }
}

function EggRecordsSection({ records, currentHens, eggSummary, onLogEggs }: {
  records: BreederEggRecord[]
  currentHens: number
  eggSummary: BreederEggSummary | null
  onLogEggs: () => void
}) {
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion)
  }, [])

  const summary = useMemo(
    () => eggSummary ?? summarizeBreederEggs(records, currentHens),
    [records, currentHens, eggSummary],
  )

  return (
    <Animated.View entering={FadeInUp.duration(500).delay(380).springify()}>
      <View style={styles.recordsCard}>
        <View style={styles.recordsHeader}>
          <View style={styles.recordsHeaderLeft}>
            <Text style={styles.secTitle}>Egg Records</Text>
            <View style={styles.recordsCountBadge}>
              <Text style={styles.recordsCountText}>{records.length}</Text>
            </View>
          </View>
          <View style={styles.recordsHeaderRight}>
            <TouchableOpacity style={styles.eggLogBtn} activeOpacity={0.85} onPress={onLogEggs}>
              <GoonaIcon icon={Icons.plus} size={14} color="#FFFFFF" />
              <Text style={styles.eggLogBtnText}>Log Eggs</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.recordsDivider} />

        {/* daily list — the weekly hens/egg/settable trio lives in the hero */}
        {summary.list.length === 0 ? (
          <View style={styles.recordsEmpty}>
            <GoonaIcon icon={Icons.egg} size={24} color="#CBD5E1" />
            <Text style={styles.recordsEmptyText}>No egg records yet</Text>
            <Text style={styles.recordsEmptyHint}>Tap Log Eggs to record daily collection</Text>
          </View>
        ) : (
          <Animated.View entering={reduceMotion ? undefined : FadeInDown.duration(250).springify()}>
            {summary.list.map((r) => {
              const graded = hasGradingBreakdown(r)
              return (
                <View key={r.id} style={styles.eggRow}>
                  <View style={styles.eggRowDateWrap}>
                    <Text style={styles.eggRowDate}>{formatEggDate(r.date)}</Text>
                  </View>
                  <View style={styles.eggRowBody}>
                    <View style={styles.eggRowTop}>
                      <Text style={styles.eggRowTotal}>{r.totalEggs.toLocaleString()} eggs</Text>
                      {graded && (
                        <View style={styles.eggGradedTag}>
                          <Text style={styles.eggGradedText}>graded</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.eggRowDetail}>
                      {graded
                        ? `${GRADING_FIELDS.filter((f) => (r.grading?.[f.key] ?? 0) > 0).map((f) => f.label).join(' · ')}`
                        : 'Total only — settable defaults to total'}
                    </Text>
                  </View>
                  <View style={styles.eggRowRight}>
                    <Text style={styles.eggRowSettable}>{computeSettable(r).toLocaleString()}</Text>
                    <Text style={styles.eggRowSettableLabel}>settable</Text>
                  </View>
                </View>
              )
            })}
          </Animated.View>
        )}

        {/* settable feed — the only seam this section owns */}
        <View style={styles.eggSeamNote}>
          <GoonaIcon icon={Icons.egg} size={12} color="#94A3B8" />
          <Text style={styles.eggSeamText}>
            {summary.totalSettable.toLocaleString()} settable eggs tracked — available for hatch batches
          </Text>
        </View>
      </View>
    </Animated.View>
  )
}

// ─── BREEDER LOG EGGS SHEET (records add pattern — single / multiple-day) ───

function LogEggsSheet({ visible, batchId, batchName, currentHens, onClose }: {
  visible: boolean
  batchId: string
  batchName: string
  currentHens: number
  onClose: () => void
}) {
  const addEggRecords = useBreederEggStore((s) => s.addEggRecords)

  const [mode, setMode] = useState<'single' | 'multiple'>('single')
  const [lineItems, setLineItems] = useState<{ id: string; date: string; totalEggs: number; grading?: import('../../store/useBreederEggStore').BreederEggGrading }[]>([])
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const [date, setDate] = useState(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [totalStr, setTotalStr] = useState('')
  const [gradingVisible, setGradingVisible] = useState(false)
  const [grading, setGrading] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [keyboardOpen, setKeyboardOpen] = useState(false)

  const scrollRef = useRef<ScrollView>(null)
  const totalWrapY = useRef(0)
  const gridY = useRef(0)
  const fieldY = useRef<Record<string, number>>({})

  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardOpen(true))
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardOpen(false))
    return () => { show.remove(); hide.remove() }
  }, [])

  useEffect(() => {
    if (!visible) return
    setMode('single')
    setLineItems([])
    setEditingIndex(null)
    setDate(new Date())
    setShowDatePicker(false)
    setTotalStr('')
    setGradingVisible(false)
    setGrading({})
    setErrors({})
    setKeyboardOpen(false)
  }, [visible])

  const focusScroll = (key: string) => () => {
    setTimeout(() => {
      const y = key === 'total' ? totalWrapY.current : gridY.current + (fieldY.current[key] ?? 0)
      if (y > 0) scrollRef.current?.scrollTo({ y: Math.max(0, y - 96), animated: true })
    }, 150)
  }

  const num = (v: string) => parseInt(v, 10) || 0
  const totalEggs = num(totalStr)
  const gradingSum = GRADING_FIELDS.reduce((s, f) => s + num(grading[f.key]), 0)

  const validate = () => {
    const next: Record<string, string> = {}
    if (totalEggs < 1) next.total = 'Enter eggs collected.'
    else if (gradingSum > totalEggs) next.total = `Grading breakdown (${gradingSum}) exceeds total eggs (${totalEggs}).`
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const buildGrading = () => {
    const g: import('../../store/useBreederEggStore').BreederEggGrading = {}
    let has = false
    for (const f of GRADING_FIELDS) {
      const v = num(grading[f.key])
      if (v > 0) {
        g[f.key] = v
        has = true
      }
    }
    return has ? g : undefined
  }

  const setGrade = (key: string, value: string) => {
    setGrading((cur) => ({ ...cur, [key]: value.replace(/\D/g, '') }))
  }

  const addEntry = () => {
    if (!validate()) return
    const item = { id: nextEggLineId(), date: isoDateStr(date), totalEggs, grading: buildGrading() }
    setLineItems((prev) => {
      if (editingIndex != null && editingIndex >= 0 && editingIndex < prev.length) {
        const copy = [...prev]
        copy[editingIndex] = item
        return copy
      }
      return [...prev, item]
    })
    setEditingIndex(null)
    setDate(new Date())
    setTotalStr('')
    setGrading({})
    setGradingVisible(false)
    setErrors({})
  }

  const saveRows = (rows: { date: string; totalEggs: number; grading?: import('../../store/useBreederEggStore').BreederEggGrading }[]) => {
    if (!rows.length) return
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    addEggRecords(rows.map((r) => ({ batchId, date: r.date, totalEggs: r.totalEggs, grading: r.grading })))
    onClose()
    Alert.alert(
      'Eggs Saved',
      `${rows.length} day${rows.length === 1 ? '' : 's'} of eggs logged for ${batchName}. Hen-day % now reflects ${currentHens} hens.`,
    )
  }

  const handleSaveSingle = () => {
    if (!validate()) return
    saveRows([{ date: isoDateStr(date), totalEggs, grading: buildGrading() }])
  }

  const handleSaveAll = () => {
    if (!lineItems.length) return
    saveRows(lineItems)
  }

  const startEdit = (index: number) => {
    const item = lineItems[index]
    if (!item) return
    setEditingIndex(index)
    setDate(new Date(`${item.date}T00:00:00`))
    setTotalStr(String(item.totalEggs))
    const g: Record<string, string> = {}
    for (const f of GRADING_FIELDS) {
      const v = item.grading?.[f.key]
      if (v) g[f.key] = String(v)
    }
    setGrading(g)
    setErrors({})
    setLineItems((prev) => prev.filter((_, i) => i !== index))
  }

  const removeLine = (index: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index))
    setEditingIndex(null)
  }

  const handleCancel = () => {
    const dirty = totalStr.trim() !== '' || Object.values(grading).some((v) => (v ?? '') !== '') || lineItems.length > 0
    if (!dirty) { onClose(); return }
    Alert.alert('Discard egg log?', 'Your entered egg details will be lost.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: onClose },
    ])
  }

  const primaryDisabled = totalEggs < 1 || Object.keys(errors).length > 0

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleCancel}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetOverlay}>
        <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={handleCancel} />
        <Animated.View entering={SlideInUp.duration(350).springify().damping(20)} style={[styles.sheet, styles.eggSheet]}>
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeader}>
            <View style={styles.sheetIconWrap}>
              <GoonaIcon icon={Icons.egg} size={28} color="#17663A" />
            </View>
            <Text style={styles.sheetTitle}>Log Eggs</Text>
            <Text style={styles.sheetDesc}>
              Daily collection for {batchName} · hen-day % divides by {currentHens} hens (mortality-adjusted)
            </Text>
          </View>

          {/* mode toggle — records add pattern */}
          <View style={styles.eggModeToggle}>
            <TouchableOpacity style={[styles.eggModeOption, mode === 'single' && styles.eggModeOptionActive]} activeOpacity={0.7} onPress={() => { setMode('single'); setEditingIndex(null) }}>
              <Text style={[styles.eggModeText, mode === 'single' && styles.eggModeTextActive]}>Single</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.eggModeOption, mode === 'multiple' && styles.eggModeOptionActive]} activeOpacity={0.7} onPress={() => setMode('multiple')}>
              <Text style={[styles.eggModeText, mode === 'multiple' && styles.eggModeTextActive]}>Multiple</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={scrollRef}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={styles.eggScroll}
            contentContainerStyle={[styles.eggSheetBody, keyboardOpen && styles.eggSheetBodyKbOpen]}
          >
            {/* date */}
            <Text style={styles.eggFieldLabel}>Collection Date</Text>
            <TouchableOpacity style={styles.eggDateField} activeOpacity={0.75} onPress={() => setShowDatePicker(!showDatePicker)}>
              <GoonaIcon icon={Icons.calendar} size={18} color="#17663A" />
              <Text style={styles.eggDateValue}>{date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
              <GoonaIcon icon={Icons.chevronDown} size={14} color="#17663A" />
            </TouchableOpacity>
            {showDatePicker && (
              <View style={styles.eggInlinePicker}>
                <DateTimePicker
                  value={date}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  maximumDate={new Date()}
                  onChange={(_event, picked) => {
                    if (Platform.OS === 'android') setShowDatePicker(false)
                    if (picked) setDate(picked)
                  }}
                  themeVariant="light"
                />
                {Platform.OS === 'ios' && (
                  <TouchableOpacity style={styles.eggInlineDone} onPress={() => setShowDatePicker(false)}>
                    <Text style={styles.eggInlineDoneText}>Done</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* total */}
            <View onLayout={(e) => { totalWrapY.current = e.nativeEvent.layout.y }}>
              <Text style={styles.eggFieldLabel}>Total Eggs Collected (required)</Text>
              <TextInput
                style={styles.eggInput}
                value={totalStr}
                onChangeText={(v) => {
                  const clean = v.replace(/\D/g, '')
                  setTotalStr(clean)
                  if (Object.keys(errors).length > 0) setErrors({})
                }}
                onFocus={focusScroll('total')}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* optional grading */}
            <TouchableOpacity style={styles.eggGradeToggle} activeOpacity={0.75} onPress={() => setGradingVisible((v) => !v)}>
              <View style={styles.eggGradeToggleLeft}>
                <GoonaIcon icon={Icons.egg} size={15} color="#17663A" />
                <Text style={styles.eggGradeToggleText}>Grading (optional)</Text>
              </View>
              <View style={[styles.recordsChevron, gradingVisible && styles.recordsChevronOpen]}>
                <GoonaIcon icon={Icons.chevronDown} size={14} color="#64748B" />
              </View>
            </TouchableOpacity>
            {gradingVisible && (
              <View style={styles.eggGradeGrid} onLayout={(e) => { gridY.current = e.nativeEvent.layout.y }}>
                {GRADING_FIELDS.map((f) => (
                  <View key={f.key} style={styles.eggGradeField} onLayout={(e) => { fieldY.current[f.key] = e.nativeEvent.layout.y }}>
                    <Text style={styles.eggGradeLabel}>{f.label}</Text>
                    <TextInput
                      style={styles.eggGradeInput}
                      value={grading[f.key] ?? ''}
                      onChangeText={(v) => setGrade(f.key, v.replace(/\D/g, ''))}
                      onFocus={focusScroll(f.key)}
                      keyboardType="number-pad"
                      placeholder="0"
                      placeholderTextColor="#B0BEC5"
                    />
                  </View>
                ))}
              </View>
            )}

            {errors.total ? <Text style={styles.eggErrorText}>{errors.total}</Text> : null}

            {/* multiple-day line items */}
            {mode === 'multiple' && (
              <View style={styles.eggLinesSection}>
                <View style={styles.eggLinesHeader}>
                  <Text style={styles.eggLinesTitle}>Line Items{lineItems.length > 0 ? ` · ${lineItems.length}` : ''}</Text>
                </View>
                {lineItems.length === 0 ? (
                  <View style={styles.eggLinesEmpty}>
                    <GoonaIcon icon={Icons.receipt} size={20} color="#CBD5E1" />
                    <Text style={styles.eggLinesEmptyText}>No days added yet</Text>
                    <Text style={styles.eggLinesEmptyHint}>Fill the fields and tap Add Entry</Text>
                  </View>
                ) : (
                  <>
                    {lineItems.map((item, i) => (
                      <View key={item.id} style={styles.eggLineCard}>
                        <View style={styles.eggLineIcon}>
                          <GoonaIcon icon={Icons.egg} size={14} color="#16A34A" />
                        </View>
                        <View style={styles.eggLineBody}>
                          <Text style={styles.eggLineDate}>{formatEggDate(item.date)}</Text>
                          <Text style={styles.eggLineMeta}>{item.totalEggs.toLocaleString()} eggs · {item.grading ? 'graded' : 'total only'}</Text>
                        </View>
                        <View style={styles.eggLineActions}>
                          <TouchableOpacity style={styles.eggLineBtn} activeOpacity={0.7} onPress={() => startEdit(i)}>
                            <GoonaIcon icon={Icons.edit3} size={13} color="#64748B" />
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.eggLineBtn} activeOpacity={0.7} onPress={() => removeLine(i)}>
                            <GoonaIcon icon={Icons.x} size={13} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                    <TouchableOpacity
                      style={[styles.eggSaveAllBtn, lineItems.length === 0 && styles.eggSaveAllBtnDisabled]}
                      activeOpacity={0.85}
                      onPress={handleSaveAll}
                      disabled={lineItems.length === 0}
                    >
                      <GoonaIcon icon={Icons.save} size={16} color="#FFFFFF" />
                      <Text style={styles.eggSaveAllText}>Save All ({lineItems.length})</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}
          </ScrollView>

          <View style={styles.sheetActions}>
            <TouchableOpacity style={styles.sheetCancelBtn} activeOpacity={0.85} onPress={handleCancel}>
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sheetConfirmBtn, primaryDisabled && styles.eggConfirmBtnDisabled]}
              activeOpacity={0.85}
              disabled={primaryDisabled}
              onPress={mode === 'multiple' ? addEntry : handleSaveSingle}
            >
              <LinearGradient
                colors={primaryDisabled ? ['#A7BFAE', '#A7BFAE'] : ['#17663A', '#2E7D32']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.sheetConfirmText}>{mode === 'multiple' ? 'Add Entry' : 'Save Record'}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

// ─── BREEDER HATCH BATCHES (PHASE 3) ───

function HatchBatchesSection({ hatchBatches, onSetEggs, onRecord }: {
  hatchBatches: HatchBatch[]
  onSetEggs: () => void
  onRecord: (h: HatchBatch) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion)
  }, [])

  const kpis = useMemo(() => {
    let incubating = 0
    let hatched = 0
    let chicks = 0
    for (const h of hatchBatches) {
      if (h.status === 'incubating') incubating++
      else if (h.status === 'hatched') hatched++
      chicks += h.chicksHatched ?? 0
    }
    return { incubating, hatched, chicks }
  }, [hatchBatches])

  const sorted = useMemo(
    () => [...hatchBatches].sort((a, b) => (a.setDate === b.setDate ? a.createdAt - b.createdAt : a.setDate < b.setDate ? -1 : 1)),
    [hatchBatches],
  )

  return (
    <Animated.View entering={FadeInUp.duration(500).delay(400).springify()}>
      <View style={styles.recordsCard}>
        <View style={styles.recordsHeader}>
          <TouchableOpacity style={styles.recordsHeaderLeft} activeOpacity={0.7} onPress={() => setExpanded((v) => !v)}>
            <Text style={styles.secTitle}>Hatch Batches</Text>
            <View style={styles.recordsCountBadge}>
              <Text style={styles.recordsCountText}>{hatchBatches.length}</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.recordsHeaderRight}>
            <TouchableOpacity style={styles.eggLogBtn} activeOpacity={0.85} onPress={onSetEggs}>
              <GoonaIcon icon={Icons.plus} size={14} color="#FFFFFF" />
              <Text style={styles.eggLogBtnText}>Set Eggs</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.recordsChevron, expanded && styles.recordsChevronOpen]} activeOpacity={0.8} onPress={() => setExpanded((v) => !v)}>
              <GoonaIcon icon={Icons.chevronDown} size={16} color="#64748B" />
            </TouchableOpacity>
          </View>
        </View>

        {/* collapsed KPIs */}
        <View style={styles.eggKpis}>
          <View style={styles.eggKpiItem}>
            <Text style={styles.eggKpiValue}>{kpis.incubating}</Text>
            <Text style={styles.eggKpiLabel}>Incubating</Text>
          </View>
          <View style={styles.eggKpiItem}>
            <Text style={styles.eggKpiValue}>{kpis.hatched}</Text>
            <Text style={styles.eggKpiLabel}>Hatched</Text>
          </View>
          <View style={styles.eggKpiItem}>
            <Text style={styles.eggKpiValue}>{kpis.chicks.toLocaleString()}</Text>
            <Text style={styles.eggKpiLabel}>Chicks out</Text>
          </View>
        </View>

        {/* expanded list */}
        {expanded && (
          <Animated.View entering={reduceMotion ? undefined : FadeInDown.duration(250).springify()}>
            <View style={styles.recordsDivider} />
            {sorted.length === 0 ? (
              <View style={styles.recordsEmpty}>
                <GoonaIcon icon={Icons.egg} size={24} color="#CBD5E1" />
                <Text style={styles.recordsEmptyText}>No hatch batches yet</Text>
                <Text style={styles.recordsEmptyHint}>Tap Set Eggs to start an incubation run</Text>
              </View>
            ) : (
              sorted.map((h) => {
                const meta = hatchStatusMeta(h.status)
                const kpi = computeHatchKpis(h)
                const upcoming = h.status === 'incubating' ? ` · due ${formatEggDate(kpi.expectedHatchDate)}` : ''
                return (
                  <View key={h.id} style={styles.hbRow}>
                    <View style={[styles.hbRowIcon, { backgroundColor: meta.bg }]}>
                      <GoonaIcon
                        icon={h.status === 'incubating' ? Icons.flame : h.status === 'hatched' ? Icons.egg : Icons.x}
                        size={16}
                        color={meta.color}
                      />
                    </View>
                    <View style={styles.hbRowBody}>
                      <View style={styles.hbRowTop}>
                        <Text style={styles.hbRowName} numberOfLines={1}>{h.name}</Text>
                        <View style={[styles.hbStatusPill, { backgroundColor: meta.bg }]}>
                          <Text style={[styles.hbStatusText, { color: meta.color }]}>{meta.label}</Text>
                        </View>
                      </View>
                      <Text style={styles.hbRowMeta}>
                        {h.status === 'incubating'
                          ? `${countdownLabel(h, Date.now())}${upcoming} · ${h.eggsSet} eggs set`
                          : `${kpi.hatchSuccessPct != null ? `${kpi.hatchSuccessPct.toFixed(1)}% hatch · ` : ''}${h.chicksHatched ?? 0} chicks from ${h.eggsSet} eggs`
                        }
                      </Text>
                    </View>
                    <View style={styles.hbRowRight}>
                      {h.status === 'incubating' ? (
                        <TouchableOpacity style={styles.hbRecordBtn} activeOpacity={0.85} onPress={() => onRecord(h)}>
                          <GoonaIcon icon={Icons.checkCircle} size={13} color="#FFFFFF" />
                          <Text style={styles.hbRecordText}>Record</Text>
                        </TouchableOpacity>
                      ) : (h.chicksHatched ?? 0) > 0 ? (
                        <TouchableOpacity
                          style={styles.hbSellBtn}
                          activeOpacity={0.85}
                          onPress={() => {
                            if (Platform.OS !== 'web') Haptics.selectionAsync()
                            router.push('/record-sale' as never)
                          }}
                        >
                          <GoonaIcon icon={Icons.wallet} size={13} color="#FFFFFF" />
                          <Text style={styles.hbRecordText}>Sell chicks</Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.hbRowRightMeta}>
                          <Text style={styles.hbRowChickV}>0</Text>
                          <Text style={styles.hbRowChickL}>chicks</Text>
                        </View>
                      )}
                    </View>
                  </View>
                )
              })
            )}
          </Animated.View>
        )}

        {/* Phase 4 seam */}
        <View style={styles.eggSeamNote}>
          <GoonaIcon icon={Icons.flame} size={12} color="#94A3B8" />
          <Text style={styles.eggSeamText}>
            Chicks are a sold output (no animal profiles) · hatch KPIs feed Breeder Reports (Phase 4)
          </Text>
        </View>
      </View>
    </Animated.View>
  )
}

// ─── SET EGGS SHEET (create hatch batch) ───

function SetEggsSheet({ visible, flockId, flockName, livestockType, hatchBatches, availableSettable, onClose }: {
  visible: boolean
  flockId: string
  flockName: string
  livestockType: string
  hatchBatches: HatchBatch[]
  availableSettable: number
  onClose: () => void
}) {
  const addHatch = useHatchStore((s) => s.addHatch)
  const kb = useSheetKeyboard()
  const resetKeyboard = kb.resetKeyboard

  const [nameStr, setNameStr] = useState('')
  const [date, setDate] = useState(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [eggsStr, setEggsStr] = useState('')
  const [incubationStr, setIncubationStr] = useState('21')
  const [trackFertility, setTrackFertility] = useState(false)
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!visible) return
    const suggested = nextHatchName(hatchBatches, flockName)
    setNameStr(suggested)
    setDate(new Date())
    setShowDatePicker(false)
    setEggsStr('')
    setIncubationStr(String(incubationDaysFor(livestockType)))
    setTrackFertility(false)
    setNotes('')
    setErrors({})
    resetKeyboard()
  }, [visible, hatchBatches, flockName, livestockType, resetKeyboard])

  const num = (v: string) => parseInt(v, 10) || 0
  const eggsSet = num(eggsStr)
  const incubationDays = num(incubationStr)
  const setDateIso = isoDateStr(date)
  const expected = incubationDays >= 1 ? expectedHatchIso({ setDate: setDateIso, incubationDays }) : ''
  const eggsWarn = eggsStr.trim() !== '' && eggsSet > availableSettable

  const validate = () => {
    const next: Record<string, string> = {}
    if (!nameStr.trim()) next.name = 'Enter a hatch batch name.'
    if (eggsSet < 1) next.eggs = 'Enter eggs set to incubate.'
    if (incubationDays < 1) next.days = 'Enter incubation days (21 for chicken, 28 for turkey).'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    addHatch({
      breederFlockId: flockId,
      name: nameStr.trim(),
      eggsSet,
      setDate: setDateIso,
      incubationDays,
      trackFertility,
      status: 'incubating',
      notes: notes.trim() || undefined,
    })
    onClose()
    Alert.alert('Incubation Started', `${nameStr.trim()} set with ${eggsSet} eggs · hatches ${formatEggDate(expected)}.`)
  }

  const handleCancel = () => {
    const dirty = nameStr.trim() !== '' || eggsStr.trim() !== '' || notes.trim() !== ''
    if (!dirty) { onClose(); return }
    Alert.alert('Discard hatch batch?', 'Your entered batch details will be lost.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: onClose },
    ])
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleCancel}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetOverlay}>
        <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={handleCancel} />
        <Animated.View entering={SlideInUp.duration(350).springify().damping(20)} style={[styles.sheet, styles.eggSheet]}>
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeader}>
            <View style={styles.sheetIconWrap}>
              <GoonaIcon icon={Icons.egg} size={28} color="#17663A" />
            </View>
            <Text style={styles.sheetTitle}>Set Eggs to Incubate</Text>
            <Text style={styles.sheetDesc}>
              {flockName} · available settable eggs: {availableSettable.toLocaleString()}
            </Text>
          </View>

          <ScrollView
            ref={kb.scrollRef}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={styles.eggScroll}
            contentContainerStyle={[styles.eggSheetBody, kb.keyboardOpen && styles.eggSheetBodyKbOpen]}
          >
            <View onLayout={kb.captureY('name')}>
              <Text style={styles.eggFieldLabel}>Hatch Batch Name</Text>
              <TextInput
                style={styles.eggInput}
                value={nameStr}
                onChangeText={(v) => {
                  setNameStr(v)
                  if (errors.name) setErrors((cur) => ({ ...cur, name: '' }))
                }}
                onFocus={kb.focusScroll('name')}
                placeholder={`e.g. ${nextHatchName(hatchBatches, flockName)}`}
                placeholderTextColor="#94A3B8"
              />
              {errors.name ? <Text style={styles.eggErrorText}>{errors.name}</Text> : null}
            </View>

            <View onLayout={kb.captureY('date')}>
              <Text style={styles.eggFieldLabel}>Set Date</Text>
              <TouchableOpacity style={styles.eggDateField} activeOpacity={0.75} onPress={() => setShowDatePicker(!showDatePicker)}>
                <GoonaIcon icon={Icons.calendar} size={18} color="#17663A" />
                <Text style={styles.eggDateValue}>{date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                <GoonaIcon icon={Icons.chevronDown} size={14} color="#17663A" />
              </TouchableOpacity>
              {showDatePicker && (
                <View style={styles.eggInlinePicker}>
                  <DateTimePicker
                    value={date}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    maximumDate={new Date()}
                    onChange={(_event, picked) => {
                      if (Platform.OS === 'android') setShowDatePicker(false)
                      if (picked) setDate(picked)
                    }}
                    themeVariant="light"
                  />
                  {Platform.OS === 'ios' && (
                    <TouchableOpacity style={styles.eggInlineDone} onPress={() => setShowDatePicker(false)}>
                      <Text style={styles.eggInlineDoneText}>Done</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            <View onLayout={kb.captureY('eggs')}>
              <Text style={styles.eggFieldLabel}>Eggs Set (required)</Text>
              <TextInput
                style={styles.eggInput}
                value={eggsStr}
                onChangeText={(v) => {
                  setEggsStr(v.replace(/\D/g, ''))
                  if (errors.eggs) setErrors((cur) => ({ ...cur, eggs: '' }))
                }}
                onFocus={kb.focusScroll('eggs')}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor="#94A3B8"
              />
              {errors.eggs ? <Text style={styles.eggErrorText}>{errors.eggs}</Text> : null}
            </View>

            {eggsWarn && (
              <View style={styles.eggWarnBox}>
                <GoonaIcon icon={Icons.alertTriangle} size={14} color="#D97706" />
                <Text style={styles.eggWarnText}>
                  You have {availableSettable.toLocaleString()} settable eggs on record — {eggsSet.toLocaleString()} set exceeds this. Continue only if using stored or home-produced eggs. (Not blocked — your choice.)
                </Text>
              </View>
            )}

            <View onLayout={kb.captureY('days')}>
              <Text style={styles.eggFieldLabel}>Incubation Days (required)</Text>
              <TextInput
                style={styles.eggInput}
                value={incubationStr}
                onChangeText={(v) => {
                  setIncubationStr(v.replace(/\D/g, ''))
                  if (errors.days) setErrors((cur) => ({ ...cur, days: '' }))
                }}
                onFocus={kb.focusScroll('days')}
                keyboardType="number-pad"
                placeholder="21"
                placeholderTextColor="#94A3B8"
              />
              {errors.days ? <Text style={styles.eggErrorText}>{errors.days}</Text> : null}
              {expected ? (
                <Text style={styles.eggExpectedNote}>Expected hatch — {formatEggDate(expected)} ({countdownDaysLabel(expected)})</Text>
              ) : null}
            </View>

            <View style={styles.eggToggleRow}>
              <View style={styles.eggToggleBody}>
                <Text style={styles.eggToggleLabel}>Track fertility (true fertility)</Text>
                <Text style={styles.eggToggleDesc}>Adds a simple break-out — count clear / infertile eggs when recording the hatch.</Text>
              </View>
              <Switch
                value={trackFertility}
                onValueChange={(v) => setTrackFertility(v)}
                trackColor={{ false: '#E2E8F0', true: '#2E7D32' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View onLayout={kb.captureY('notes')}>
              <Text style={styles.eggFieldLabel}>Notes (optional)</Text>
              <TextInput
                style={[styles.eggInput, styles.eggNotesInput]}
                value={notes}
                onChangeText={setNotes}
                onFocus={kb.focusScroll('notes')}
                multiline
                numberOfLines={3}
                placeholder="Any notes…"
                placeholderTextColor="#94A3B8"
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          <View style={styles.sheetActions}>
            <TouchableOpacity style={styles.sheetCancelBtn} activeOpacity={0.85} onPress={handleCancel}>
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sheetConfirmBtn, (eggsSet < 1 || incubationDays < 1 || !nameStr.trim()) && styles.eggConfirmBtnDisabled]}
              activeOpacity={0.85}
              disabled={eggsSet < 1 || incubationDays < 1 || !nameStr.trim()}
              onPress={handleSave}
            >
              <LinearGradient
                colors={eggsSet < 1 || incubationDays < 1 || !nameStr.trim() ? ['#A7BFAE', '#A7BFAE'] : ['#17663A', '#2E7D32']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.sheetConfirmText}>Set Eggs</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

function countdownDaysLabel(expectedIso: string): string {
  const due = new Date(`${expectedIso}T00:00:00`).getTime()
  const nowMid = new Date(); nowMid.setHours(0, 0, 0, 0)
  const diff = Math.round((due - nowMid.getTime()) / (24 * 60 * 60 * 1000))
  if (diff === 0) return 'hatch due today'
  if (diff > 0) return `${diff} day${diff === 1 ? '' : 's'} from now`
  return `${Math.abs(diff)} day${Math.abs(diff) === 1 ? '' : 's'} overdue`
}

// ─── RECORD HATCH SHEET ───

function RecordHatchSheet({ visible, hatch, onClose }: {
  visible: boolean
  hatch: HatchBatch | null
  onClose: () => void
}) {
  const updateHatch = useHatchStore((s) => s.updateHatch)
  const kb = useSheetKeyboard()
  const resetKeyboard = kb.resetKeyboard

  const [chicksStr, setChicksStr] = useState('')
  const [clearStr, setClearStr] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!visible) return
    setChicksStr('')
    setClearStr('')
    setNotes('')
    setErrors({})
    resetKeyboard()
  }, [visible, hatch?.id, resetKeyboard])

  const num = (v: string) => parseInt(v, 10) || 0
  const chicks = num(chicksStr)
  const clearEggs = num(clearStr)
  const kpi = useMemo(() => (hatch ? computeHatchKpis(hatch) : null), [hatch])
  const due = hatch ? new Date(`${kpi?.expectedHatchDate ?? ''}T00:00:00`) : null

  const validate = () => {
    const next: Record<string, string> = {}
    if (chicksStr.trim() === '') next.chicks = 'Enter chicks hatched (0 marks the batch failed).'
    else if (clearStr.trim() !== '' && clearEggs > hatch!.eggsSet) next.clear = `Break-out (${clearEggs}) exceeds eggs set (${hatch!.eggsSet}).`
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSave = () => {
    if (!hatch) return
    if (!validate()) return
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    const status = chicks > 0 ? 'hatched' : 'failed'
    updateHatch(hatch.id, {
      status,
      hatchDate: hatchTodayIso(),
      chicksHatched: chicks,
      clearEggs: hatch.trackFertility && clearStr.trim() !== '' ? clearEggs : undefined,
      notes: notes.trim() || undefined,
    })
    onClose()
    Alert.alert(
      chicks > 0 ? 'Hatch Recorded' : 'Hatch Failed',
      chicks > 0
        ? `${chicks} chicks hatched from ${hatch.name} — record sales via the Sales flow to capture revenue.`
        : `${hatch.name} recorded as failed — no chicks.`,
    )
  }

  const handleCancel = () => {
    const dirty = chicksStr.trim() !== '' || clearStr.trim() !== '' || notes.trim() !== ''
    if (!dirty) { onClose(); return }
    Alert.alert('Discard hatch record?', 'Your entered hatch details will be lost.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: onClose },
    ])
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleCancel}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetOverlay}>
        <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={handleCancel} />
        <Animated.View entering={SlideInUp.duration(350).springify().damping(20)} style={[styles.sheet, styles.eggSheet]}>
          <View style={styles.sheetHandle} />

          {hatch ? (
            <>
              <View style={styles.sheetHeader}>
                <View style={styles.sheetIconWrap}>
                  <GoonaIcon icon={Icons.egg} size={28} color="#17663A" />
                </View>
                <Text style={styles.sheetTitle}>Record Hatch</Text>
                <Text style={styles.sheetDesc}>
                  {hatch.name} · {hatch.eggsSet} eggs set · expected {due ? due.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                </Text>
              </View>

              <ScrollView
                ref={kb.scrollRef}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                style={styles.eggScroll}
                contentContainerStyle={[styles.eggSheetBody, kb.keyboardOpen && styles.eggSheetBodyKbOpen]}
              >
                <View onLayout={kb.captureY('chicks')}>
                  <Text style={styles.eggFieldLabel}>Chicks Hatched (required)</Text>
                  <TextInput
                    style={styles.eggInput}
                    value={chicksStr}
                    onChangeText={(v) => {
                      setChicksStr(v.replace(/\D/g, ''))
                      if (errors.chicks) setErrors((cur) => ({ ...cur, chicks: '' }))
                    }}
                    onFocus={kb.focusScroll('chicks')}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor="#94A3B8"
                  />
                  <Text style={styles.eggHintText}>0 chicks marks this batch as failed.</Text>
                  {errors.chicks ? <Text style={styles.eggErrorText}>{errors.chicks}</Text> : null}
                </View>

                {hatch.trackFertility && (
                  <View onLayout={kb.captureY('clear')}>
                    <Text style={styles.eggFieldLabel}>Clear / Infertile Eggs — break-out (optional)</Text>
                    <TextInput
                      style={styles.eggInput}
                      value={clearStr}
                      onChangeText={(v) => {
                        setClearStr(v.replace(/\D/g, ''))
                        if (errors.clear) setErrors((cur) => ({ ...cur, clear: '' }))
                      }}
                      onFocus={kb.focusScroll('clear')}
                      keyboardType="number-pad"
                      placeholder="0"
                      placeholderTextColor="#94A3B8"
                    />
                    {errors.clear ? <Text style={styles.eggErrorText}>{errors.clear}</Text> : null}
                    {hatch.trackFertility && clearStr.trim() !== '' && clearEggs <= hatch.eggsSet && hatch.eggsSet > 0 ? (
                      <Text style={styles.eggExpectedNote}>
                        Fertility — {Math.round(((hatch.eggsSet - clearEggs) / hatch.eggsSet) * 1000) / 10}%
                      </Text>
                    ) : null}
                  </View>
                )}

                <View onLayout={kb.captureY('notes')}>
                  <Text style={styles.eggFieldLabel}>Notes (optional)</Text>
                  <TextInput
                    style={[styles.eggInput, styles.eggNotesInput]}
                    value={notes}
                    onChangeText={setNotes}
                    onFocus={kb.focusScroll('notes')}
                    multiline
                    numberOfLines={3}
                    placeholder="Any hatch notes…"
                    placeholderTextColor="#94A3B8"
                    textAlignVertical="top"
                  />
                </View>
              </ScrollView>

              <View style={styles.sheetActions}>
                <TouchableOpacity style={styles.sheetCancelBtn} activeOpacity={0.85} onPress={handleCancel}>
                  <Text style={styles.sheetCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sheetConfirmBtn, chicksStr.trim() === '' && styles.eggConfirmBtnDisabled]}
                  activeOpacity={0.85}
                  disabled={chicksStr.trim() === ''}
                  onPress={handleSave}
                >
                  <LinearGradient
                    colors={chicksStr.trim() === '' ? ['#A7BFAE', '#A7BFAE'] : ['#17663A', '#2E7D32']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <Text style={styles.sheetConfirmText}>Record Hatch{chicks > 0 ? '' : ' — Failed'}</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : null}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

export default function BatchDetailsScreen() {
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id: string }>()
  const storeBatch = useBatchStore((s) => s.getBatchById(id ?? ''))
  const completeBatch = useBatchStore((s) => s.completeBatch)
  const restoreBatch = useBatchStore((s) => s.restoreBatch)
  const deleteBatch = useBatchStore((s) => s.deleteBatch)
  const updateBatch = useBatchStore((s) => s.updateBatch)
  const addFeedPost = useFarmChatStore((s) => s.addFeedPost)

  const isCompleted = storeBatch?.status === 'completed'

  const records = useHistoryStore((s) => s.records)
  const batchRevenue = useMemo(() => {
    if (!storeBatch) return 0
    return records
      .filter((r) => (r.batchId === storeBatch.id || r.batch === storeBatch.batchName) && r.type === 'sale')
      .reduce((sum, r) => sum + (r.cost || 0), 0)
  }, [records, storeBatch?.id, storeBatch?.batchName])

  const [showCompleteSheet, setShowCompleteSheet] = useState(false)
  const [harvestFinalCount, setHarvestFinalCount] = useState('')
  const [harvestRevenue, setHarvestRevenue] = useState('')
  const [harvestNotes, setHarvestNotes] = useState('')

  const [showEggSheet, setShowEggSheet] = useState(false)
  const [showSetEggsSheet, setShowSetEggsSheet] = useState(false)
  const [recordHatchTarget, setRecordHatchTarget] = useState<HatchBatch | null>(null)

  const batch = useMemo(() => {
    if (!id) return BATCH_DETAILS.batch_a
    if (BATCH_DETAILS[id]) return BATCH_DETAILS[id]
    if (storeBatch) {
      if (storeBatch.model === 'breeder') return deriveBreederDetail(storeBatch)
      return deriveBatchDetail(storeBatch)
    }
    return BATCH_DETAILS.batch_a
  }, [id, storeBatch])

  const isBreeder = storeBatch?.model === 'breeder'

  const breederStats = useMemo(
    () => (storeBatch && isBreeder ? computeFlockStats(storeBatch) : null),
    [storeBatch, isBreeder]
  )
  const flockAge = useMemo(
    () => (storeBatch && isBreeder ? formatFlockAge(storeBatch) : ''),
    [storeBatch, isBreeder]
  )

  const breedEggs = useBreederEggStore((s) => s.eggs)
  const batchEggRecords = useMemo(
    () => breedEggs.filter((r) => r.batchId === (storeBatch?.id ?? '')),
    [breedEggs, storeBatch?.id]
  )
  const eggSummary = useMemo(
    () => (isBreeder && breederStats ? summarizeBreederEggs(batchEggRecords, breederStats.currentHens) : null),
    [batchEggRecords, isBreeder, breederStats]
  )

  const hatchBatches = useHatchStore((s) => s.hatches)
  const flockHatches = useMemo(
    () => (storeBatch ? hatchBatches.filter((h) => h.breederFlockId === storeBatch.id) : []),
    [hatchBatches, storeBatch]
  )

  /** Production Analytics for breeders = PERFORMANCE (never repeats the hero's flock stats). */
  const breederPerformance = useMemo(() => {
    if (!isBreeder) return []
    const agg = computeHatchAggregates(flockHatches)
    const pct = (v: number | null) => (v != null ? `${v.toFixed(1)}%` : '—')
    return [
      {
        metric: pct(agg.overallHatchSuccessPct),
        label: 'Hatch Success',
        trend: 'weighted',
        trendColor: '#2E7D32' as string,
        iconBg: '#F0FDF4',
        iconColor: '#16A34A',
        bars: [40, 55, 70, 60, 50],
        activeBars: [2, 4],
        icon: (c: string) => <GoonaIcon icon={Icons.checkCircle} size={16} color={c} />,
      },
      {
        metric: pct(agg.overallFertilityPct),
        label: 'Fertility',
        trend: `tracked ${agg.trackedBatches}/${agg.recordedBatches}`,
        trendColor: '#3B66D6' as string,
        iconBg: '#EEF3FF',
        iconColor: '#1A56FF',
        bars: [60, 70, 80, 85, 90],
        activeBars: [2, 3],
        icon: (c: string) => <GoonaIcon icon={Icons.target} size={16} color={c} />,
      },
      {
        metric: pct(agg.overallHatchabilityPct),
        label: 'Hatchability',
        trend: 'of fertile',
        trendColor: '#D97706' as string,
        iconBg: '#FFFBEB',
        iconColor: '#D97706',
        bars: [30, 45, 60, 75, 90],
        activeBars: [2],
        icon: (c: string) => <GoonaIcon icon={Icons.activity} size={16} color={c} />,
      },
      {
        metric: eggSummary ? eggSummary.totalEggs.toLocaleString() : '—',
        label: 'Total Eggs',
        trend: 'all-time',
        trendColor: '#7C3AD6' as string,
        iconBg: 'rgba(124,58,214,0.10)',
        iconColor: '#7C3AD6',
        bars: [35, 50, 65, 75, 90],
        activeBars: [2],
        icon: (c: string) => <GoonaIcon icon={Icons.egg} size={16} color={c} />,
      },
    ]
  }, [isBreeder, flockHatches, eggSummary])

  const displayProgress = isCompleted ? 100 : isBreeder ? (breederStats?.alivePct ?? 100) : batch.progress

  function handleOpenCompleteSheet() {
    const qty = storeBatch?.quantity ?? (parseInt(batch.birdCount, 10) || 0)
    setHarvestFinalCount(String(qty))
    setHarvestRevenue('')
    setHarvestNotes('')
    setShowCompleteSheet(true)
  }

  function handleConfirmComplete() {
    if (!id || !storeBatch) return
    const finalCount = parseInt(harvestFinalCount) || storeBatch.quantity
    const totalRevenue = parseInt(harvestRevenue) || 0
    completeBatch(id, {
      finalCount,
      totalRevenue: totalRevenue || undefined,
      notes: harvestNotes.trim() || undefined,
    })
    if (storeBatch.model === 'breeder') {
      addFeedPost({
        id: `harvest-${Date.now()}`,
        type: 'announcement',
        timestamp: Date.now(),
        actorName: 'GOONA Flock',
        actorRole: 'Auto · Module',
        actorInitials: 'GF',
        actorColor: '#2E7D32',
        detail: `${storeBatch.batchName} breeder flock closed — ${finalCount} breeders`,
        highlight: `${finalCount} breeders`,
        tags: [storeBatch.batchName],
        batch: storeBatch.batchName,
      })
    } else {
      addFeedPost({
        id: `harvest-${Date.now()}`,
        type: 'announcement',
        timestamp: Date.now(),
        actorName: 'GOONA Harvest',
        actorRole: 'Auto · Module',
        actorInitials: 'GH',
        actorColor: '#2E7D32',
        detail: `${storeBatch.batchName} cycle completed — ${finalCount} ${storeBatch.livestockType.toLowerCase()} harvested`,
        highlight: `${finalCount} birds`,
        tags: [storeBatch.batchName],
        batch: storeBatch.batchName,
      })
    }
    setShowCompleteSheet(false)
    if (router.canGoBack()) {
      router.back()
    } else {
      router.replace('/(tabs)/records/all-batches' as any)
    }
  }

  function handleRestore() {
    if (!id) return
    restoreBatch(id)
    if (router.canGoBack()) {
      router.back()
    } else {
      router.replace('/(tabs)/records/all-batches' as any)
    }
  }

  function handleDelete() {
    if (!id) return
    Alert.alert(
      'Delete Batch Permanently?',
      `"${storeBatch?.batchName || batch.name}" and all its records will be permanently deleted. This cannot be undone. Linked history records will be detached (not deleted).`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {
          deleteBatch(id)
          if (router.canGoBack()) {
            router.back()
          } else {
            router.replace('/(tabs)/records/all-batches' as any)
          }
        }},
      ]
    )
  }

  function formatDate(iso: string): string {
    const d = new Date(iso)
    return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  function calcCycleLength(start: string, end?: string): string {
    const s = new Date(start).getTime()
    const e = end ? new Date(end).getTime() : Date.now()
    const days = Math.floor((e - s) / (24 * 60 * 60 * 1000))
    const w = Math.floor(days / 7)
    const d = days % 7
    return w > 0 ? `${w}wk ${d}d` : `${d} days`
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.glowBg} pointerEvents="none" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollInner, { paddingTop: insets.top + 8 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* TOP BAR */}
        <Animated.View entering={FadeInUp.duration(500).springify()} style={styles.topbar}>
          <TouchableOpacity style={styles.tbBtn} activeOpacity={0.7} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/records/batch-management' as any)}>
            <GoonaIcon icon={Icons.arrowLeft} size={22} color="#15291A" />
          </TouchableOpacity>
          <Text style={styles.tbTitle}>{batch.name}</Text>
          <TouchableOpacity style={styles.tbBtn} activeOpacity={0.85}>
            <GoonaIcon icon={Icons.moreHorizontal} size={22} color="#15291A" />
          </TouchableOpacity>
        </Animated.View>

        {/* ===== PREMIUM HERO ===== */}
        {isBreeder && storeBatch && breederStats ? (
          <BreederHero batch={storeBatch} stats={breederStats} flockAge={flockAge} isCompleted={isCompleted} eggSummary={eggSummary} />
        ) : (
        <Animated.View entering={FadeInUp.duration(500).delay(80).springify()} style={styles.hero}>
          <LinearGradient
            colors={isCompleted ? ['#374151', '#4B5563', '#6B7280'] : ['#0C3A24', '#17663A', '#2E8B43', '#3FA345']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {/* depth layers */}
          <View style={styles.heroOrb1} pointerEvents="none" />
          <View style={styles.heroOrb2} pointerEvents="none" />
          <View style={styles.heroSheen} pointerEvents="none" />
          <View style={styles.heroRinglines} pointerEvents="none" />

          <View style={styles.heroTop}>
            <View>
              <View style={styles.heroEyebrow}>
                <View style={styles.heroLiveDot} />
                <Text style={styles.heroEyebrowText}>{isCompleted ? 'Cycle Completed' : 'Active Production'}</Text>
              </View>
              <Text style={styles.heroCount}>
                {batch.birdCount} <Text style={styles.heroCountSmall}>{batch.type}</Text>
              </Text>
              <Text style={styles.heroWeek}>
                {isCompleted
                  ? `Completed ${storeBatch?.completedAt ? formatDate(storeBatch.completedAt) : ''}`
                  : batch.totalWeeks - weeksSince(storeBatch?.startDate || '') <= 1
                    ? `${batch.week} · final week`
                    : batch.week
                }
              </Text>
              <View style={styles.heroChips}>
                <View style={[styles.heroChip, styles.heroChipHot]}>
                  <Text style={styles.heroChipHotText}>{batch.badge}</Text>
                </View>
                <View style={styles.heroChip}>
                  <Text style={styles.heroChipText}>{batch.type}</Text>
                </View>
              </View>
            </View>

            {/* ring */}
            <View style={styles.ringWrap}>
              <Svg width="96" height="96" viewBox="0 0 96 96">
                <Circle cx="48" cy="48" r="40" fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="8" />
                <Circle
                  cx="48" cy="48" r="40" fill="none"
                  stroke={isCompleted ? '#9CA3AF' : '#AEEA00'}
                  strokeWidth="8" strokeLinecap="round"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (displayProgress / 100) * 251.2}
                />
              </Svg>
              <View style={styles.ringCenter}>
                <Text style={[styles.ringPct, isCompleted && { color: '#D1D5DB' }]}>{displayProgress}%</Text>
                <Text style={styles.ringLbl}>Done</Text>
              </View>
            </View>
          </View>

          {/* stat cells */}
          <View style={styles.heroStats}>
            <View style={styles.hstat}>
              <Text style={styles.hstatV} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>{batch.mortality}</Text>
              <Text style={styles.hstatL}>Mortality</Text>
            </View>
            <View style={styles.hstat}>
              <Text style={styles.hstatV} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>{batch.feedUsed}</Text>
              <Text style={styles.hstatL}>Feed Used</Text>
            </View>
            <View style={styles.hstat}>
              <Text style={[styles.hstatV, styles.hstatVLime]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>{batchRevenue > 0 ? formatNairaFull(batchRevenue) : batch.revenue}</Text>
              <Text style={styles.hstatL}>{batchRevenue > 0 ? 'Revenue (actual)' : 'Est. Revenue'}</Text>
            </View>
          </View>

          {/* progress bar */}
          <View style={styles.heroProg}>
            <View style={styles.heroProgRow}>
              <Text style={styles.heroProgLabel}>{isCompleted ? 'Cycle Completed' : 'Production cycle progress'}</Text>
              <Text style={styles.heroProgVal}>{displayProgress}%</Text>
            </View>
            <View style={styles.heroTrack}>
              <View style={[styles.heroTrackFill, { width: `${displayProgress}%` as any }]} />
            </View>
          </View>
        </Animated.View>
        )}

        {/* PRODUCTION ANALYTICS */}
        <Animated.View entering={FadeInUp.duration(500).delay(140).springify()}>
          <View style={styles.sec}>
            <Text style={styles.secTitle}>Production Analytics</Text>
            <TouchableOpacity
              onPress={
                isBreeder
                  ? () => router.push(`/batch-details/breeder-reports?id=${encodeURIComponent(storeBatch?.id ?? '')}` as never)
                  : undefined
              }
            >
              <Text style={styles.secLink}>{isBreeder ? 'Open Report' : 'Full Report'}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <View style={styles.analytics}>
          {(isBreeder && storeBatch ? breederPerformance : batch.analytics).map((a, i) => {
            const colorClass = i === 0 ? 'green' : i === 1 ? 'blue' : i === 2 ? 'amber' : 'purple'
            const iconBgMap: Record<string, string> = { green: 'rgba(46,125,50,0.10)', blue: 'rgba(59,102,214,0.10)', amber: 'rgba(217,119,6,0.12)', purple: 'rgba(124,58,214,0.10)' }
            const iconColorMap: Record<string, string> = { green: '#2E7D32', blue: '#3B66D6', amber: '#D97706', purple: '#7C3AD6' }
            const trendColorMap: Record<string, string> = { green: '#2E7D32', blue: '#3B66D6', amber: '#D97706', purple: '#7C3AD6' }
            return (
              <Animated.View
                key={i}
                entering={FadeInUp.duration(500).delay(180 + i * 60).springify()}
                style={styles.an}
              >
                <View style={[styles.anIco, { backgroundColor: iconBgMap[colorClass] }]}>
                  {a.icon(iconColorMap[colorClass])}
                </View>
                <Text style={styles.anV}>{a.metric}</Text>
                <Text style={styles.anL}>{a.label}</Text>
                {a.trend ? (
                  <Text style={[styles.anD, { color: trendColorMap[colorClass] }]}>{a.trend}</Text>
                ) : null}
              </Animated.View>
            )
          })}
        </View>

        {/* CYCLE TIMELINE */}
        <Animated.View entering={FadeInUp.duration(500).delay(280).springify()}>
          <View style={styles.sec}>
            <Text style={styles.secTitle}>Cycle Timeline</Text>
            <Text style={styles.secMeta}>this batch</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(320).springify()} style={styles.tl}>
          {batch.timeline.map((item, i) => (
            <View key={i} style={styles.tlItem}>
              <View style={[styles.tlDot, item.warn && styles.tlDotWarn]} />
              <View style={styles.tlBody}>
                <Text style={styles.tlTitle}>{item.title}</Text>
                <Text style={styles.tlDesc}>{item.desc}</Text>
                <Text style={styles.tlAgo}>{item.time}</Text>
              </View>
            </View>
          ))}
        </Animated.View>

        {/* BUDGET */}
        {storeBatch && storeBatch.budgetAllocations && storeBatch.budgetAllocations.length > 0 && (
          <BudgetSection batch={storeBatch} batchRevenue={batchRevenue} />
        )}

        {/* RECORDS */}
        {storeBatch && <RecordsSection batch={storeBatch} />}

        {/* BREEDER FLOCK MORTALITY / CULLS */}
        {storeBatch && storeBatch.model === 'breeder' && <MortalityCullsCard batch={storeBatch} />}

        {/* BREEDER EGG RECORDS (PHASE 2) */}
{storeBatch && isBreeder && (
          <EggRecordsSection
            records={batchEggRecords}
            currentHens={breederStats?.currentHens ?? 0}
            eggSummary={eggSummary}
            onLogEggs={() => setShowEggSheet(true)}
          />
        )}

{storeBatch && isBreeder && (
          <HatchBatchesSection
            hatchBatches={flockHatches}
            onSetEggs={() => setShowSetEggsSheet(true)}
            onRecord={(h) => setRecordHatchTarget(h)}
          />
        )}

        {/* ANIMALS */}
        {storeBatch && storeBatch.model === 'individual' && <AnimalsSection batch={storeBatch} />}

        {/* BREEDING */}
        {storeBatch && storeBatch.model === 'individual' && (
          <BreedingSection batchId={storeBatch.id} livestockType={storeBatch.livestockType} />
        )}

        {/* SMART INSIGHTS */}
        <SmartInsightsSection storeBatch={storeBatch ?? undefined} />

        {/* COMPLETE CYCLE / RESTORE (BOTTOM) */}
        <Animated.View entering={FadeInUp.duration(500).delay(460).springify()}>
          {isCompleted ? (
            <>
              <TouchableOpacity
              style={styles.restoreBtn}
              activeOpacity={0.85}
              onPress={() => {
                const name = batch.name
                Alert.alert(
                  'Restore to Active',
                  `"${name}" will return to Active Batches with all its data preserved. You can complete the cycle again later.`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Restore', style: 'default', onPress: handleRestore },
                  ]
                )
              }}
            >
              <View style={styles.restoreIconWrap}>
                <GoonaIcon icon={Icons.refreshCw} size={20} color="#2E7D32" />
              </View>
              <View style={styles.restoreTextWrap}>
                <Text style={styles.restoreTitle}>Restore to Active</Text>
                <Text style={styles.restoreSub}>Move batch back to Active Batches</Text>
              </View>
              <GoonaIcon icon={Icons.chevronRight} size={18} color="#2E7D32" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteBtn}
              activeOpacity={0.85}
              onPress={handleDelete}
            >
              <View style={styles.deleteIconWrap}>
                <GoonaIcon icon={Icons.trash2} size={20} color="#EF4444" />
              </View>
              <View style={styles.deleteTextWrap}>
                <Text style={styles.deleteTitle}>Delete Batch</Text>
                <Text style={styles.deleteSub}>Permanently delete batch and all records</Text>
              </View>
              <GoonaIcon icon={Icons.chevronRight} size={18} color="#EF4444" />
            </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={styles.complete} activeOpacity={0.85} onPress={handleOpenCompleteSheet}>
              <LinearGradient
                colors={['#E8890C', '#F5A623', '#F7B733']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.completeGlow} pointerEvents="none" />
              <View style={styles.cIco}>
                <GoonaIcon icon={Icons.checkCheck} size={24} color="#FFFFFF" />
              </View>
              <View style={styles.cBody}>
                <Text style={styles.cTitle}>{isBreeder ? 'Close Flock / Sell Out' : 'Complete Cycle / Harvest'}</Text>
                <Text style={styles.cSub}>{isBreeder ? 'Archive the breeder flock to Farm History · restore anytime' : 'Move to Farm History · restore anytime'}</Text>
              </View>
              <GoonaIcon icon={Icons.chevronRight} size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <Text style={styles.completeNote}>
            {isCompleted
              ? 'Batch is in Farm History — all records preserved.'
              : isBreeder
                ? 'This archives the flock to Farm History — it won\'t delete your records.'
                : 'This archives the batch to Farm History — it won\'t delete your records.'
            }
          </Text>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* COMPLETE CYCLE CONFIRMATION SHEET */}
      <Modal visible={showCompleteSheet} transparent animationType="slide" onRequestClose={() => setShowCompleteSheet(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetOverlay}>
          <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={() => setShowCompleteSheet(false)} />
          <Animated.View entering={SlideInUp.duration(350).springify().damping(20)} style={styles.sheet}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
<View style={styles.sheetIconWrap}>
                <GoonaIcon icon={Icons.checkCheck} size={28} color="#F59E0B" />
              </View>
              <Text style={styles.sheetTitle}>{isBreeder ? 'Close This Flock?' : 'Complete This Cycle?'}</Text>
              <Text style={styles.sheetDesc}>
                {batch.name} will move to Farm History and leave Active Batches. You can restore it anytime.
              </Text>
            </View>

            <View style={styles.sheetBody}>
              <Text style={styles.sheetSectionTitle}>{isBreeder ? 'Close-out Summary (optional)' : 'Harvest Summary (optional)'}</Text>
              <Text style={styles.sheetInputLabel}>{isBreeder ? 'Final Breeder Count' : 'Final Bird Count'}</Text>
              <TextInput
                style={styles.sheetInput}
                value={harvestFinalCount}
                onChangeText={setHarvestFinalCount}
                keyboardType="number-pad"
                placeholder="e.g. 420"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.sheetInputLabel}>Total Revenue (₦)</Text>
              <TextInput
                style={styles.sheetInput}
                value={harvestRevenue}
                onChangeText={setHarvestRevenue}
                keyboardType="number-pad"
                placeholder="e.g. 2400000"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.sheetInputLabel}>Notes</Text>
              <TextInput
                style={[styles.sheetInput, styles.sheetInputTextArea]}
                value={harvestNotes}
                onChangeText={setHarvestNotes}
                multiline
                numberOfLines={3}
                placeholder="Any harvest notes…"
                placeholderTextColor="#94A3B8"
                textAlignVertical="top"
              />
            </View>

            <View style={styles.sheetActions}>
              <TouchableOpacity
                style={styles.sheetCancelBtn}
                activeOpacity={0.85}
                onPress={() => setShowCompleteSheet(false)}
              >
                <Text style={styles.sheetCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sheetConfirmBtn}
                activeOpacity={0.85}
                onPress={handleConfirmComplete}
              >
                <LinearGradient
                  colors={['#F59E0B', '#D97706']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={styles.sheetConfirmText}>{isBreeder ? 'Close Flock' : 'Complete Cycle'}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>

      {/* BREEDER LOG EGGS SHEET (PHASE 2) */}
      {storeBatch && isBreeder && (
        <LogEggsSheet
          visible={showEggSheet}
          batchId={storeBatch.id}
          batchName={storeBatch.batchName}
          currentHens={breederStats?.currentHens ?? 0}
          onClose={() => setShowEggSheet(false)}
        />
      )}

      {/* BREEDER SET EGGS SHEET (PHASE 3) */}
      {storeBatch && isBreeder && (
        <SetEggsSheet
          visible={showSetEggsSheet}
          flockId={storeBatch.id}
          flockName={storeBatch.batchName}
          livestockType={storeBatch.livestockType}
          hatchBatches={flockHatches}
          availableSettable={eggSummary?.totalSettable ?? 0}
          onClose={() => setShowSetEggsSheet(false)}
        />
      )}

      {/* BREEDER RECORD HATCH SHEET (PHASE 3) */}
      {storeBatch && isBreeder && (
        <RecordHatchSheet
          visible={recordHatchTarget !== null}
          hatch={recordHatchTarget}
          onClose={() => setRecordHatchTarget(null)}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F9F4' },

  glowBg: { position: 'absolute', top: -50, right: -50, width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(232,245,233,0.30)', zIndex: 0 },

  scroll: { flex: 1, zIndex: 1 },
  scrollInner: { paddingHorizontal: 20, paddingTop: 6 },

  /* top nav */
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6 },
  tbBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  tbTitle: { fontFamily: 'Poppins', fontWeight: '700', fontSize: 20, color: '#15291A' },

  /* hero card */
  hero: {
    borderRadius: 32, padding: 24, marginTop: 14, overflow: 'hidden',
    shadowColor: '#0C3A24', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.28, shadowRadius: 45, elevation: 8,
  },
  heroOrb1: {
    position: 'absolute', top: -20, right: -10, width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.08)', zIndex: 0,
  },
  heroOrb2: {
    position: 'absolute', bottom: -30, left: -20, width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.05)', zIndex: 0,
  },
  heroSheen: {
    position: 'absolute', top: '10%', left: '-20%', width: '60%', height: '30%',
    backgroundColor: 'rgba(255,255,255,0.04)', zIndex: 0, transform: [{ rotate: '-20deg' }],
  },
  heroRinglines: {
    position: 'absolute', top: '5%', right: '-15%', width: '70%', height: '90%',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)', borderRadius: 200, zIndex: 0,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 1 },
  heroEyebrow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  heroLiveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#AEEA00' },
  heroEyebrowText: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.8)', letterSpacing: 1, textTransform: 'uppercase' },
  heroCount: { fontFamily: 'Poppins', fontWeight: '800', fontSize: 30, color: 'white', marginTop: 0, lineHeight: 36 },
  heroCountSmall: { fontSize: 16, fontWeight: '500', color: 'rgba(255,255,255,0.65)' },
  heroWeek: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: -2 },
  heroChips: { flexDirection: 'row', gap: 8, marginTop: 8 },
  heroChip: { paddingVertical: 4, paddingHorizontal: 12, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.12)' },
  heroChipHot: { backgroundColor: '#FFFBEB' },
  heroChipHotText: { fontSize: 11, fontWeight: '600', color: '#F59E0B' },
  heroChipText: { fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,0.8)' },

  ringWrap: { width: 96, height: 96, position: 'relative', flexShrink: 0 },
  ringCenter: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  ringPct: { fontSize: 16, fontWeight: '800', color: 'white' },
  ringLbl: { fontSize: 7, fontWeight: '500', color: 'rgba(255,255,255,0.6)' },

  heroStats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, zIndex: 1, gap: 10 },
  hstat: {
    flex: 1, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16, paddingVertical: 12, paddingHorizontal: 8,
  },
  hstatV: { fontSize: 18, fontWeight: '800', color: 'white' },
  hstatVLime: { color: '#AEEA00' },
  hstatL: { fontSize: 11, fontWeight: '400', color: 'rgba(255,255,255,0.6)', marginTop: 1 },

  heroProg: { marginTop: 18, zIndex: 1 },
  heroProgRow: { flexDirection: 'row', justifyContent: 'space-between' },
  heroProgLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  heroProgVal: { fontSize: 12, fontWeight: '700', color: 'white' },
  heroTrack: { width: '100%', height: 8, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 100, marginTop: 6, overflow: 'hidden' },
  heroTrackFill: { height: '100%', borderRadius: 100, backgroundColor: '#AEEA00' },

  /* section headers */
  sec: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 22, marginBottom: 12 },
  secTitle: { fontSize: 18, fontWeight: '700', color: '#15291A' },
  secLink: { fontSize: 13, fontWeight: '500', color: '#17663A' },
  secMeta: { fontSize: 11, fontWeight: '500', color: '#94A3B8', letterSpacing: 0.5 },

  /* analytics grid */
  analytics: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  an: {
    width: (SCREEN_W - 52) / 2, backgroundColor: 'white', borderRadius: 24, padding: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 2,
  },
  anIco: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  anV: { fontSize: 22, fontWeight: '800', color: '#15291A', marginTop: 8, letterSpacing: -0.3 },
  anL: { fontSize: 11, color: '#64748B', marginTop: 1 },
  anD: { fontSize: 11, fontWeight: '600', marginTop: 4 },

  /* timeline */
  tl: { paddingLeft: 20, position: 'relative', backgroundColor: 'white', borderRadius: 24, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 16, elevation: 1 },
  tlItem: { paddingLeft: 16, paddingBottom: 18, position: 'relative' },
  tlDot: {
    position: 'absolute', left: 0, top: 3, width: 12, height: 12, borderRadius: 6,
    borderWidth: 2.5, borderColor: 'white',
    backgroundColor: '#17663A', elevation: 4, zIndex: 2,
  },
  tlDotWarn: { backgroundColor: '#F59E0B' },
  tlBody: { flex: 1 },
  tlTitle: { fontSize: 14, fontWeight: '600', color: '#15291A' },
  tlDesc: { fontSize: 12, color: '#64748B', marginTop: 1 },
  tlAgo: { fontSize: 11, color: '#94A3B8', marginTop: 2 },

  /* insights */
  ins: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, borderRadius: 24, padding: 18, marginBottom: 10 },
  insGreen: { backgroundColor: '#E8F5E9' },
  insBlue: { backgroundColor: '#E3F2FD' },
  iIco: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', flexShrink: 0, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 },
  iTxt: { fontSize: 13, lineHeight: 20, color: '#15291A', flex: 1 },
  iBold: { fontWeight: '700', color: '#15291A' },

  /* complete cycle */
  complete: {
    borderRadius: 22, marginTop: 16, overflow: 'hidden',
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 18, paddingHorizontal: 22,
    shadowColor: '#D97706', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 24, elevation: 5,
  },
  completeGlow: { position: 'absolute', top: -30, right: -20, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.12)', zIndex: 0 },
  cIco: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  cBody: { flex: 1, zIndex: 1 },
  cTitle: { fontSize: 17, fontWeight: '800', color: '#FFFFFF' },
  cSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 1 },
  completeNote: { fontSize: 11, color: '#94A3B8', textAlign: 'center', marginTop: 10, marginBottom: 4 },

  /* restore button */
  restoreBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#FFFFFF', borderRadius: 22, paddingVertical: 18, paddingHorizontal: 22, marginTop: 16,
    borderWidth: 1.5, borderColor: '#17663A',
    shadowColor: '#17663A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 3,
  },
  restoreIconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center' },
  restoreTextWrap: { flex: 1 },
  restoreTitle: { fontSize: 16, fontWeight: '800', color: '#15291A' },
  restoreSub: { fontSize: 12, color: '#64748B', marginTop: 1 },

  /* delete button */
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#FFFFFF', borderRadius: 22, paddingVertical: 18, paddingHorizontal: 22, marginTop: 8,
    borderWidth: 1.5, borderColor: '#FCA5A5',
    shadowColor: '#EF4444', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 20, elevation: 2,
  },
  deleteIconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' },
  deleteTextWrap: { flex: 1 },
  deleteTitle: { fontSize: 16, fontWeight: '800', color: '#991B1B' },
  deleteSub: { fontSize: 12, color: '#EF4444', marginTop: 1 },

  /* completion sheet */
  sheetOverlay: { flex: 1, justifyContent: 'flex-end' },
  sheetBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 32, borderTopRightRadius: 32,
    paddingHorizontal: 24, paddingBottom: 40,
    shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.08, shadowRadius: 30, elevation: 15,
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB', alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  sheetHeader: { alignItems: 'center', paddingVertical: 12 },
  sheetIconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFFBEB', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: '#15291A', textAlign: 'center' },
  sheetDesc: { fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 8, lineHeight: 20, paddingHorizontal: 8 },
  sheetBody: { paddingVertical: 8 },
  sheetSectionTitle: { fontSize: 14, fontWeight: '700', color: '#15291A', marginBottom: 16 },
  sheetInputLabel: { fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 6, marginTop: 12 },
  sheetInput: {
    height: 48, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0',
    paddingHorizontal: 16, fontSize: 15, color: '#15291A', backgroundColor: '#F8FAF7',
  },
  sheetInputTextArea: { height: 80, paddingTop: 14 },
  sheetActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  sheetCancelBtn: {
    flex: 1, height: 52, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0',
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF',
  },
  sheetCancelText: { fontSize: 15, fontWeight: '700', color: '#64748B' },
  sheetConfirmBtn: { flex: 1, height: 52, borderRadius: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  sheetConfirmText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },

  /* budget section */
  budgetCard: {
    backgroundColor: '#FFFFFF', borderRadius: 28, padding: 20, marginTop: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 20, elevation: 2,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)',
  },
  budgetHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 14,
  },
  budgetHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  budgetHeaderRight: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, flex: 1 },
  budgetChevron: {
    width: 26, height: 26, borderRadius: 8, backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center',
  },
  budgetChevronOpen: { transform: [{ rotate: '180deg' }] },
  budgetEditBtn: {
    width: 28, height: 28, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(23,102,58,0.2)',
    backgroundColor: 'rgba(23,102,58,0.06)',
  },
  budgetStatusChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: 4, paddingHorizontal: 11, borderRadius: 999,
    borderWidth: 1.5,
  },
  budgetStatusDot: { width: 7, height: 7, borderRadius: 3.5 },
  budgetStatusText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  budgetSummaryCompact: {
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: '#F2F6F1', borderRadius: 20, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)',
  },
  budgetCompactItem: { alignItems: 'center', flex: 1 },
  budgetCompactLabel: { fontSize: 10, fontWeight: '500', color: '#64748B', marginBottom: 4, letterSpacing: 0.5, textTransform: 'uppercase' as any },
  budgetCompactValue: { fontSize: 17, fontWeight: '800', color: '#1B1B1B', fontVariant: ['tabular-nums'] },
  budgetOverallCompactBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14,
  },
  budgetOverallCompactTrack: {
    flex: 1, height: 10, borderRadius: 5, backgroundColor: '#E8EDE7', overflow: 'hidden',
  },
  budgetOverallCompactFill: { height: '100%', borderRadius: 5 },
  budgetOverallCompactPct: { fontSize: 12, fontWeight: '700', width: 38, textAlign: 'right', fontVariant: ['tabular-nums'] },
  budgetCatPills: { flexDirection: 'row', gap: 8, paddingRight: 48, paddingBottom: 2 },
  budgetCatPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999,
    borderWidth: 1,
  },
  budgetCatPillDot: { width: 7, height: 7, borderRadius: 3.5 },
  budgetCatPillLabel: { fontSize: 11, fontWeight: '600', color: '#475569' },
  budgetCatPillValue: { fontSize: 11, fontWeight: '800' },
  budgetEmptyCompact: { alignItems: 'center', paddingVertical: 12, gap: 8 },
  budgetEmptyText: { fontSize: 12, fontWeight: '600', color: '#94A3B8' },
  budgetSetBtn: {
    backgroundColor: '#17663A', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 16,
  },
  budgetSetBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  budgetCategories: { gap: 10 },
  budgetCatRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F8FAF7',
  },
  budgetCatLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, width: 100 },
  budgetCatDot: { width: 7, height: 7, borderRadius: 3.5 },
  budgetCatLabel: { fontSize: 13, fontWeight: '600', color: '#1B1B1B' },
  budgetCatRight: { flex: 1 },
  budgetCatAmounts: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4,
  },
  budgetCatAlloc: { fontSize: 11, fontWeight: '600', color: '#94A3B8' },
  budgetCatSpent: { fontSize: 11, fontWeight: '700' },
  budgetCatBar: {
    height: 4, borderRadius: 2, backgroundColor: '#F1F5F9', overflow: 'hidden',
  },
  budgetCatBarFill: { height: '100%', borderRadius: 2 },

  /* Revenue & Profit */
  budgetDivider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 16 },
  revenueSection: {},
  revenueSectionTitle: { fontSize: 14, fontWeight: '700', color: '#1B1B1B', marginBottom: 12 },
  revenueGrid: {
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: '#F8FAF7', borderRadius: 16, padding: 14, marginBottom: 10,
  },
  revenueItem: { alignItems: 'center', flex: 1 },
  revenueLabel: { fontSize: 10, fontWeight: '600', color: '#94A3B8', marginBottom: 4 },
  revenueValue: { fontSize: 14, fontWeight: '800', color: '#1B1B1B' },
  marginRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 },
  marginLabel: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  marginBadge: { paddingVertical: 4, paddingHorizontal: 12, borderRadius: 8 },
  marginText: { fontSize: 14, fontWeight: '800' },

  /* records section */
  recordsCard: {
    backgroundColor: '#FFFFFF', borderRadius: 28, padding: 20, marginTop: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 20, elevation: 2,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)',
  },
  recordsEmpty: { alignItems: 'center', paddingVertical: 28, gap: 6 },
  recordsEmptyText: { fontSize: 14, fontWeight: '600', color: '#94A3B8', marginTop: 4 },
  recordsEmptyHint: { fontSize: 11, fontWeight: '500', color: '#CBD5E1' },
  recordsHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 14,
  },
  recordsHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recordsCountBadge: {
    backgroundColor: '#15291A', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 2,
  },
  recordsCountText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF' },
  recordsHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recordsChevron: {
    width: 26, height: 26, borderRadius: 8, backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center',
  },
  recordsChevronOpen: { transform: [{ rotate: '180deg' }] },
  recordsChips: {
    flexDirection: 'row', gap: 10, paddingRight: 20, paddingBottom: 2,
  },
  recordsChipPremium: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 14,
    borderWidth: 1, minWidth: 130,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  recordsChipIcon: {
    width: 28, height: 28, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  recordsChipBody: {},
  recordsChipLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.3 },
  recordsChipValue: { fontSize: 13, fontWeight: '800', marginTop: 1 },
  recordsDivider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 12 },
  recordsRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F8FAF7',
  },
  recordsRowIcon: {
    width: 30, height: 30, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  recordsRowBody: { flex: 1, minWidth: 0 },
  recordsRowTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  recordsRowLabel: { fontSize: 12, fontWeight: '700' },
  recordsRowDetail: { fontSize: 11, fontWeight: '600', color: '#1B1B1B', flexShrink: 1 },
  recordsRowNotes: { fontSize: 10, fontWeight: '500', color: '#94A3B8', marginTop: 1 },
  recordsRowTime: { fontSize: 10, fontWeight: '500', color: '#94A3B8', flexShrink: 0 },
  recordsRowTimeSep: { fontSize: 8, color: '#CBD5E1' },
  recordsViewAll: { alignItems: 'center', paddingVertical: 12, marginTop: 4 },
  recordsViewAllText: { fontSize: 13, fontWeight: '700', color: '#17663A' },

  /* breeder mortality / culls */
  mortSummaryLine: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F2F6F1', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12,
    marginBottom: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)',
  },
  mortSummaryLineText: { flex: 1, fontSize: 11.5, fontWeight: '600', color: '#64748B' },
  mortSummaryLineValue: { fontSize: 13, fontWeight: '800', color: '#DC2626', fontVariant: ['tabular-nums'] },
  mortHouseRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  mortHouse: { fontSize: 12, fontWeight: '600', color: '#17663A' },
  mortGridLabel: { fontSize: 12, fontWeight: '700', color: '#1B1B1B', marginBottom: 8 },
  mortGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mortFieldWrap: {
    flex: 1, minWidth: '45%', flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F8FAF7', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 14,
    paddingHorizontal: 12, height: 52,
  },
  mortFieldDot: { width: 7, height: 7, borderRadius: 3.5, flexShrink: 0 },
  mortFieldBody: { flex: 1, minWidth: 0 },
  mortFieldLabel: { fontSize: 10, fontWeight: '600', color: '#64748B' },
  mortInput: { fontSize: 15, fontWeight: '700', color: '#1B1B1B', padding: 0, margin: 0, fontFamily: 'Inter' },
  mortAddBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 50, borderRadius: 16, marginTop: 12,
    backgroundColor: '#17663A',
  },
  mortAddBtnDisabled: { backgroundColor: '#A7BFAE' },
  mortAddText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  mortNote: { fontSize: 11, fontWeight: '500', color: '#94A3B8', marginTop: 10, lineHeight: 16 },

  /* breeder hero laying strip (Phase 2) */
  heroEggWrap: { marginTop: 16 },
  heroEggTitle: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.85)', letterSpacing: 0.3, marginBottom: 8 },
  heroEggSub: { fontSize: 10, fontWeight: '500', color: 'rgba(255,255,255,0.65)' },
  heroEggRow: { flexDirection: 'row', gap: 8 },
  heroEggCell: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 14,
    paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)',
  },
  heroEggV: { fontSize: 16, fontWeight: '800', color: '#FFFFFF', fontVariant: ['tabular-nums'] },
  heroEggL: { fontSize: 9.5, fontWeight: '600', color: 'rgba(255,255,255,0.78)', marginTop: 2, textTransform: 'uppercase' as any, letterSpacing: 0.4 },

  /* egg records section (Phase 2) */
  eggLogBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#17663A', borderRadius: 999, paddingVertical: 7, paddingHorizontal: 13,
  },
  eggLogBtnText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  eggKpis: {
    flexDirection: 'row', justifyContent: 'space-between', gap: 8,
    backgroundColor: '#F2F6F1', borderRadius: 20, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)',
  },
  eggKpiItem: { alignItems: 'center', flex: 1 },
  eggKpiValue: { fontSize: 17, fontWeight: '800', color: '#15291A', fontVariant: ['tabular-nums'] },
  eggKpiLabel: { fontSize: 9, fontWeight: '600', color: '#64748B', marginTop: 3, letterSpacing: 0.3, textTransform: 'uppercase' as any },
  eggSeamNote: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  eggSeamText: { fontSize: 10.5, fontWeight: '500', color: '#94A3B8', lineHeight: 15 },
  eggRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F8FAF7',
  },
  eggRowDateWrap: {
    width: 52, height: 44, borderRadius: 12, backgroundColor: '#F2F6F1',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  eggRowDate: { fontSize: 12, fontWeight: '800', color: '#17663A' },
  eggRowBody: { flex: 1, minWidth: 0 },
  eggRowTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  eggRowTotal: { fontSize: 13, fontWeight: '700', color: '#1B1B1B' },
  eggGradedTag: { backgroundColor: '#F0FDF4', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1.5 },
  eggGradedText: { fontSize: 9, fontWeight: '800', color: '#16A34A', letterSpacing: 0.3, textTransform: 'uppercase' as any },
  eggRowDetail: { fontSize: 10, fontWeight: '500', color: '#94A3B8', marginTop: 2 },
  eggRowRight: { alignItems: 'flex-end', flexShrink: 0 },
  eggRowSettable: { fontSize: 14, fontWeight: '800', color: '#15291A', fontVariant: ['tabular-nums'] },
  eggRowSettableLabel: { fontSize: 9, fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase' as any, letterSpacing: 0.4 },

  /* log eggs sheet (Phase 2) */
  eggSheet: { maxHeight: '88%' },
  eggSheetBody: { paddingVertical: 4, paddingBottom: 12 },
  /* lets the scroll area shrink (and scroll) when the keyboard reduces the sheet — content is never squeezed or clipped */
  eggScroll: { flexShrink: 1 },
  /* keeps the last fields + line items scrollable above the action row while the keyboard is up */
  eggSheetBodyKbOpen: { paddingBottom: 160 },
  eggFieldLabel: { fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 6, marginTop: 12 },
  eggDateField: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    height: 50, borderRadius: 14, backgroundColor: '#F8FAF7', borderWidth: 1.5, borderColor: '#E2E8F0',
    paddingHorizontal: 14,
  },
  eggDateValue: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1B1B1B' },
  eggInlinePicker: { borderRadius: 14, backgroundColor: '#F8FAF7', borderWidth: 1.5, borderColor: '#E2E8F0', overflow: 'hidden', marginTop: 8 },
  eggInlineDone: { alignItems: 'center', paddingVertical: 10 },
  eggInlineDoneText: { fontSize: 14, fontWeight: '700', color: '#17663A' },
  eggInput: {
    height: 50, borderRadius: 14, backgroundColor: '#F8FAF7', borderWidth: 1.5, borderColor: '#E2E8F0',
    paddingHorizontal: 14, fontSize: 15, fontWeight: '700', color: '#1B1B1B', fontVariant: ['tabular-nums'],
  },
  eggGradeToggle: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 14, paddingVertical: 8, paddingHorizontal: 2,
  },
  eggGradeToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eggGradeToggleText: { fontSize: 13, fontWeight: '700', color: '#15291A' },
  eggGradeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  eggGradeField: {
    flex: 1, minWidth: '45%', backgroundColor: '#F8FAF7', borderWidth: 1.5, borderColor: '#E2E8F0',
    borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, height: 54, justifyContent: 'center',
  },
  eggGradeLabel: { fontSize: 10, fontWeight: '600', color: '#64748B' },
  eggGradeInput: { fontSize: 14, fontWeight: '700', color: '#1B1B1B', padding: 0, margin: 0 },
  eggErrorText: { marginTop: 8, fontSize: 11, fontWeight: '700', color: '#EF4444' },
  eggConfirmBtnDisabled: { opacity: 0.6 },
  eggModeToggle: {
    flexDirection: 'row', gap: 8, backgroundColor: '#F1F5F9', borderRadius: 14, padding: 4,
    marginTop: 16, marginBottom: 4,
  },
  eggModeOption: {
    flex: 1, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center',
  },
  eggModeOptionActive: { backgroundColor: '#17663A' },
  eggModeText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  eggModeTextActive: { color: '#FFFFFF' },
  eggLinesSection: { marginTop: 18 },
  eggLinesHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  eggLinesTitle: { fontSize: 13, fontWeight: '700', color: '#15291A' },
  eggLinesEmpty: { alignItems: 'center', paddingVertical: 22, gap: 4, backgroundColor: '#F8FAF7', borderRadius: 16 },
  eggLinesEmptyText: { fontSize: 12, fontWeight: '600', color: '#94A3B8', marginTop: 2 },
  eggLinesEmptyHint: { fontSize: 10, fontWeight: '500', color: '#CBD5E1' },
  eggLineCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#F8FAF7', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14,
    padding: 10, marginBottom: 8,
  },
  eggLineIcon: {
    width: 30, height: 30, borderRadius: 10, backgroundColor: '#F0FDF4',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  eggLineBody: { flex: 1, minWidth: 0 },
  eggLineDate: { fontSize: 13, fontWeight: '700', color: '#1B1B1B' },
  eggLineMeta: { fontSize: 10, fontWeight: '500', color: '#94A3B8', marginTop: 1 },
  eggLineActions: { flexDirection: 'row', gap: 8 },
  eggLineBtn: {
    width: 28, height: 28, borderRadius: 8, backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center',
  },
  eggSaveAllBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 50, borderRadius: 16, marginTop: 8, backgroundColor: '#17663A',
  },
  eggSaveAllBtnDisabled: { backgroundColor: '#A7BFAE' },
  eggSaveAllText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },

  /* hatch batches section (Phase 3) */
  hbRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  hbRowIcon: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  hbRowBody: { flex: 1, minWidth: 0 },
  hbRowTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hbRowName: { flex: 1, fontSize: 13, fontWeight: '700', color: '#15291A' },
  hbStatusPill: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  hbStatusText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.3, textTransform: 'uppercase' as any },
  hbRowMeta: { fontSize: 11, fontWeight: '500', color: '#64748B', marginTop: 3 },
  hbRowRight: { flexShrink: 0 },
  hbRecordBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#17663A', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7,
  },
  hbSellBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#2E7D32', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7,
  },
  hbRecordText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
  hbRowRightMeta: { alignItems: 'flex-end' },
  hbRowChickV: { fontSize: 14, fontWeight: '800', color: '#15291A', fontVariant: ['tabular-nums'] },
  hbRowChickL: { fontSize: 9, fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase' as any, letterSpacing: 0.4 },

  /* hatch sheets (Phase 3) */
  eggWarnBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A', borderRadius: 12,
    padding: 10, marginTop: 12,
  },
  eggWarnText: { flex: 1, fontSize: 11, fontWeight: '600', color: '#92400E', lineHeight: 16 },
  eggExpectedNote: { marginTop: 8, fontSize: 11, fontWeight: '600', color: '#17663A' },
  eggHintText: { marginTop: 6, fontSize: 11, fontWeight: '500', color: '#94A3B8' },
  eggToggleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginTop: 14, paddingVertical: 12, paddingHorizontal: 14,
    backgroundColor: '#F8FAF7', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14,
  },
  eggToggleBody: { flex: 1 },
  eggToggleLabel: { fontSize: 13, fontWeight: '700', color: '#15291A' },
  eggToggleDesc: { fontSize: 10.5, fontWeight: '500', color: '#64748B', marginTop: 2, lineHeight: 14 },
  eggNotesInput: { height: 84, paddingTop: 12 },
})
