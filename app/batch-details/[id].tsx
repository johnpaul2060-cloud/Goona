import React, { useMemo } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Dimensions,
} from 'react-native'
import Svg, { Path, Circle, Rect, Line, Ellipse } from 'react-native-svg'
import { StatusBar } from 'expo-status-bar'
import { router, useLocalSearchParams } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
  FadeInUp,
} from 'react-native-reanimated'
import BottomTabBar from '../../components/BottomTabBar'
import { useBatchStore } from '../../store/useBatchStore'

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
  return `₦${amount.toLocaleString('en-US')}`
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
  reinvest: {
    pct: number
    goal: string
    saved: string
    weekly: string
    readiness: string
  }
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
      { metric: '84%', label: 'Feed Efficiency', trend: '↑ +12%', trendColor: '#16A34A', iconBg: '#F0FDF4', iconColor: '#16A34A', bars: [40, 55, 70, 60, 85], activeBars: [2, 4], icon: (c) => <Svg width="16" height="16" viewBox="0 0 16 16" fill="none"><Rect x="3" y="4" width="10" height="8" rx="1.5" stroke={c} strokeWidth="1.3" fill="none" /><Line x1="6" y1="8" x2="10" y2="8" stroke={c} strokeWidth="1.2" strokeLinecap="round" /></Svg> },
      { metric: '98.2%', label: 'Survival Rate', trend: '↑ +1.4%', trendColor: '#16A34A', iconBg: '#EEF3FF', iconColor: '#1A56FF', bars: [60, 70, 80, 85, 90], activeBars: [2, 3, 4], icon: (c) => <Svg width="16" height="16" viewBox="0 0 16 16" fill="none"><Path d="M8 3L5 5V8C5 10 8 11.5 8 11.5C8 11.5 11 10 11 8V5L8 3Z" stroke={c} strokeWidth="1.3" fill="none" /><Path d="M6.5 8L7.5 9L10 6.5" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" /></Svg> },
      { metric: '+18%', label: 'Growth Trend', trend: '', trendColor: '#F59E0B', iconBg: '#FFFBEB', iconColor: '#F59E0B', bars: [30, 45, 60, 75, 90], activeBars: [2, 3, 4], icon: (c) => <Svg width="16" height="16" viewBox="0 0 16 16" fill="none"><Path d="M3 13H13" stroke={c} strokeWidth="1.3" strokeLinecap="round" /><Path d="M5 10L7 6L9 8L13 3" stroke={c} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></Svg> },
      { metric: '₦820k', label: 'Est. Profit', trend: '↑ +24%', trendColor: '#16A34A', iconBg: '#F0FDF4', iconColor: '#16A34A', bars: [35, 50, 65, 75, 90], activeBars: [2, 3, 4], icon: (c) => <Svg width="16" height="16" viewBox="0 0 16 16" fill="none"><Path d="M3 12H13" stroke={c} strokeWidth="1.3" strokeLinecap="round" /><Rect x="5" y="7" width="6" height="5" rx="1.2" stroke={c} strokeWidth="1.3" fill="none" /><Path d="M7 7V6C7 5 7.5 4.5 8 4.5C8.5 4.5 9 5 9 6V7" stroke={c} strokeWidth="1.3" fill="none" /></Svg> },
    ],
    reinvest: { pct: 72, goal: '₦350,000', saved: '₦252,000', weekly: '₦18,000', readiness: '3 weeks' },
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
      { metric: '91%', label: 'Feed Efficiency', trend: '↑ +8%', trendColor: '#16A34A', iconBg: '#F0FDF4', iconColor: '#16A34A', bars: [50, 65, 75, 85, 91], activeBars: [2, 3, 4], icon: (c) => <Svg width="16" height="16" viewBox="0 0 16 16" fill="none"><Rect x="3" y="4" width="10" height="8" rx="1.5" stroke={c} strokeWidth="1.3" fill="none" /><Line x1="6" y1="8" x2="10" y2="8" stroke={c} strokeWidth="1.2" strokeLinecap="round" /></Svg> },
      { metric: '97.6%', label: 'Survival Rate', trend: '↑ +0.8%', trendColor: '#16A34A', iconBg: '#EEF3FF', iconColor: '#1A56FF', bars: [70, 75, 85, 90, 97.6], activeBars: [2, 3, 4], icon: (c) => <Svg width="16" height="16" viewBox="0 0 16 16" fill="none"><Path d="M8 3L5 5V8C5 10 8 11.5 8 11.5C8 11.5 11 10 11 8V5L8 3Z" stroke={c} strokeWidth="1.3" fill="none" /><Path d="M6.5 8L7.5 9L10 6.5" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" /></Svg> },
      { metric: '+22%', label: 'Egg Production', trend: '', trendColor: '#F59E0B', iconBg: '#FFFBEB', iconColor: '#F59E0B', bars: [40, 55, 70, 85, 95], activeBars: [2, 3, 4], icon: (c) => <Svg width="16" height="16" viewBox="0 0 16 16" fill="none"><Ellipse cx="8" cy="9" rx="3.5" ry="4.5" stroke={c} strokeWidth="1.3" fill="none" /></Svg> },
      { metric: '₦1.2M', label: 'Est. Profit', trend: '↑ +18%', trendColor: '#16A34A', iconBg: '#F0FDF4', iconColor: '#16A34A', bars: [40, 55, 70, 85, 95], activeBars: [2, 3, 4], icon: (c) => <Svg width="16" height="16" viewBox="0 0 16 16" fill="none"><Path d="M3 12H13" stroke={c} strokeWidth="1.3" strokeLinecap="round" /><Rect x="5" y="7" width="6" height="5" rx="1.2" stroke={c} strokeWidth="1.3" fill="none" /><Path d="M7 7V6C7 5 7.5 4.5 8 4.5C8.5 4.5 9 5 9 6V7" stroke={c} strokeWidth="1.3" fill="none" /></Svg> },
    ],
    reinvest: { pct: 85, goal: '₦420,000', saved: '₦357,000', weekly: '₦22,000', readiness: '2 weeks' },
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
      { metric: '62%', label: 'Feed Efficiency', trend: '↓ -4%', trendColor: '#EF4444', iconBg: '#FFF1F2', iconColor: '#EF4444', bars: [55, 60, 62, 58, 55], activeBars: [2], icon: (c) => <Svg width="16" height="16" viewBox="0 0 16 16" fill="none"><Rect x="3" y="4" width="10" height="8" rx="1.5" stroke={c} strokeWidth="1.3" fill="none" /><Line x1="6" y1="8" x2="10" y2="8" stroke={c} strokeWidth="1.2" strokeLinecap="round" /></Svg> },
      { metric: '95.8%', label: 'Survival Rate', trend: '↓ -1.2%', trendColor: '#EF4444', iconBg: '#FFF1F2', iconColor: '#EF4444', bars: [85, 88, 92, 95.8, 94], activeBars: [3], icon: (c) => <Svg width="16" height="16" viewBox="0 0 16 16" fill="none"><Path d="M8 3L5 5V8C5 10 8 11.5 8 11.5C8 11.5 11 10 11 8V5L8 3Z" stroke={c} strokeWidth="1.3" fill="none" /><Path d="M6.5 8L7.5 9L10 6.5" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" /></Svg> },
      { metric: '+8%', label: 'Growth Trend', trend: '', trendColor: '#F59E0B', iconBg: '#FFFBEB', iconColor: '#F59E0B', bars: [25, 35, 50, 60, 70], activeBars: [3, 4], icon: (c) => <Svg width="16" height="16" viewBox="0 0 16 16" fill="none"><Path d="M3 13H13" stroke={c} strokeWidth="1.3" strokeLinecap="round" /><Path d="M5 10L7 6L9 8L13 3" stroke={c} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></Svg> },
      { metric: '₦380k', label: 'Est. Profit', trend: '↓ -6%', trendColor: '#EF4444', iconBg: '#FFF1F2', iconColor: '#EF4444', bars: [30, 45, 55, 50, 45], activeBars: [2], icon: (c) => <Svg width="16" height="16" viewBox="0 0 16 16" fill="none"><Path d="M3 12H13" stroke={c} strokeWidth="1.3" strokeLinecap="round" /><Rect x="5" y="7" width="6" height="5" rx="1.2" stroke={c} strokeWidth="1.3" fill="none" /><Path d="M7 7V6C7 5 7.5 4.5 8 4.5C8.5 4.5 9 5 9 6V7" stroke={c} strokeWidth="1.3" fill="none" /></Svg> },
    ],
    reinvest: { pct: 45, goal: '₦280,000', saved: '₦126,000', weekly: '₦14,000', readiness: '6 weeks' },
    insights: [
      { bg: '#FFFBEB', iconColor: '#F59E0B', text: 'Mortality risk elevated. Temperature monitoring recommended.' },
      { bg: '#E3F2FD', iconColor: '#1A56FF', text: 'Feed adjustment showing early signs of recovery.' },
    ],
  },
}

const QA_ACTIONS = [
  { label: 'Daily Record', bg: '#F0FDF4', iconColor: '#16A34A', route: '/daily-records' as const },
  { label: 'Feed Entry', bg: '#FFFBEB', iconColor: '#F59E0B', route: '/daily-records' as const },
  { label: 'Mortality', bg: '#FFF1F2', iconColor: '#EF4444', route: '/daily-records' as const },
  { label: 'Sales Entry', bg: '#EEF3FF', iconColor: '#1A56FF', route: '/(tabs)/sales-revenue' as const },
  { label: 'Reports', bg: '#F0FDF4', iconColor: '#16A34A', route: undefined },
] as const

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
      { metric: '—', label: 'Feed Efficiency', trend: '', trendColor: '#16A34A', iconBg: '#F0FDF4', iconColor: '#16A34A', bars: [40, 55, 70, 60, 50], activeBars: [2, 4], icon: (c: string) => <Svg width="16" height="16" viewBox="0 0 16 16" fill="none"><Rect x="3" y="4" width="10" height="8" rx="1.5" stroke={c} strokeWidth="1.3" fill="none" /><Line x1="6" y1="8" x2="10" y2="8" stroke={c} strokeWidth="1.2" strokeLinecap="round" /></Svg> },
      { metric: '—', label: 'Survival Rate', trend: '', trendColor: '#16A34A', iconBg: '#EEF3FF', iconColor: '#1A56FF', bars: [60, 70, 80, 85, 90], activeBars: [2, 3], icon: (c: string) => <Svg width="16" height="16" viewBox="0 0 16 16" fill="none"><Path d="M8 3L5 5V8C5 10 8 11.5 8 11.5C8 11.5 11 10 11 8V5L8 3Z" stroke={c} strokeWidth="1.3" fill="none" /><Path d="M6.5 8L7.5 9L10 6.5" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" /></Svg> },
      { metric: '—', label: 'Growth Trend', trend: '', trendColor: '#F59E0B', iconBg: '#FFFBEB', iconColor: '#F59E0B', bars: [30, 45, 60, 75, 90], activeBars: [2], icon: (c: string) => <Svg width="16" height="16" viewBox="0 0 16 16" fill="none"><Path d="M3 13H13" stroke={c} strokeWidth="1.3" strokeLinecap="round" /><Path d="M5 10L7 6L9 8L13 3" stroke={c} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></Svg> },
      { metric: formatNaira(estRevenue), label: 'Est. Revenue', trend: '', trendColor: '#16A34A', iconBg: '#F0FDF4', iconColor: '#16A34A', bars: [35, 50, 65, 75, 90], activeBars: [2], icon: (c: string) => <Svg width="16" height="16" viewBox="0 0 16 16" fill="none"><Path d="M3 12H13" stroke={c} strokeWidth="1.3" strokeLinecap="round" /><Rect x="5" y="7" width="6" height="5" rx="1.2" stroke={c} strokeWidth="1.3" fill="none" /><Path d="M7 7V6C7 5 7.5 4.5 8 4.5C8.5 4.5 9 5 9 6V7" stroke={c} strokeWidth="1.3" fill="none" /></Svg> },
    ],
    reinvest: {
      pct: 45,
      goal: formatNaira(Math.round(totalCost * 0.5)),
      saved: formatNaira(Math.round(totalCost * 0.2)),
      weekly: formatNaira(Math.round(totalCost * 0.02)),
      readiness: 'In progress',
    },
    insights: [
      { bg: '#E8F5E9', iconColor: '#F9A825', text: 'Batch is being actively tracked. Add daily records to get detailed insights.' },
      { bg: '#E3F2FD', iconColor: '#1A56FF', text: 'Complete feed and medication entries for accurate profitability forecasts.' },
    ],
  }
}

const CIRCUMFERENCE = 2 * Math.PI * 30

export default function BatchDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const storeBatch = useBatchStore((s) => s.getBatchById(id ?? ''))

  const batch = useMemo(() => {
    if (!id) return BATCH_DETAILS.batch_a
    if (BATCH_DETAILS[id]) return BATCH_DETAILS[id]
    if (storeBatch) return deriveBatchDetail(storeBatch)
    return BATCH_DETAILS.batch_a
  }, [id, storeBatch])

  const ringOffset = CIRCUMFERENCE - (batch.progress / 100) * CIRCUMFERENCE

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.glowBg} pointerEvents="none" />
      <View style={styles.contour1} pointerEvents="none" />
      <View style={styles.contour2} pointerEvents="none" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollInner}
        showsVerticalScrollIndicator={false}
      >
        {/* TOP NAV */}
        <Animated.View entering={FadeInUp.duration(500).springify()} style={styles.topNav}>
          <TouchableOpacity style={styles.navBack} activeOpacity={0.7} onPress={() => router.back()}>
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <Path d="M15 18L9 12L15 6" stroke="#1B1B1B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.topTitle}>{batch.name}</Text>
          <TouchableOpacity style={styles.menuBtn} activeOpacity={0.85}>
            <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <Circle cx="10" cy="5" r="1.5" fill="#1F2937" />
              <Circle cx="10" cy="10" r="1.5" fill="#1F2937" />
              <Circle cx="10" cy="15" r="1.5" fill="#1F2937" />
            </Svg>
          </TouchableOpacity>
        </Animated.View>

        {/* HERO CARD */}
        <Animated.View entering={FadeInUp.duration(500).delay(80).springify()}>
          <LinearGradient
            colors={['#2E7D32', '#43A047']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroDots} pointerEvents="none" />
            <View style={[styles.heroCc, { width: 280, height: 90, top: -10, right: -30 }]} pointerEvents="none" />
            <View style={[styles.heroCc, { width: 200, height: 70, bottom: 10, left: -20 }]} pointerEvents="none" />
            <View style={styles.heroGl} pointerEvents="none" />

            <View style={styles.heroTop}>
              <View>
                <Text style={styles.heroLabel}>ACTIVE PRODUCTION</Text>
                <Text style={styles.heroMainTitle}>{batch.birdCount} {batch.type}</Text>
                <Text style={styles.heroSub}>{batch.week}</Text>
              </View>
              <View style={styles.heroRing}>
                <Svg width="72" height="72" viewBox="0 0 72 72">
                  <Circle cx="36" cy="36" r="30" stroke="rgba(255,255,255,0.15)" strokeWidth="5" fill="none" />
                  <Circle
                    cx="36" cy="36" r="30"
                    stroke="#AEEA00" strokeWidth="5" fill="none"
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={ringOffset}
                    strokeLinecap="round"
                  />
                </Svg>
                <View style={styles.heroRingText}>
                  <Text style={styles.heroRingPct}>{batch.progress}%</Text>
                  <Text style={styles.heroRingLbl}>Done</Text>
                </View>
              </View>
            </View>

            <View style={styles.heroMetrics}>
              <View style={styles.heroMetric}>
                <Text style={styles.heroMetricVal}>{batch.mortality}</Text>
                <Text style={styles.heroMetricLbl}>Mortality</Text>
              </View>
              <View style={styles.heroMetric}>
                <Text style={styles.heroMetricVal}>{batch.feedUsed}</Text>
                <Text style={styles.heroMetricLbl}>Feed Used</Text>
              </View>
              <View style={styles.heroMetric}>
                <Text style={styles.heroMetricVal}>{batch.revenue}</Text>
                <Text style={styles.heroMetricLbl}>Revenue</Text>
              </View>
            </View>

            <View style={styles.heroProgress}>
              <View style={styles.heroProgHead}>
                <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Production Cycle Progress</Text>
                <Text style={{ fontSize: 12, fontWeight: '600', color: 'white' }}>{batch.progress}%</Text>
              </View>
              <View style={styles.heroProgTrack}>
                <View style={[styles.heroProgFill, { width: `${batch.progress}%` as any }]} />
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* QUICK ACTIONS */}
        <Animated.View entering={FadeInUp.duration(500).delay(130).springify()}>
          <View style={styles.secHead}>
            <Text style={styles.secTitle}>Quick Actions</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(160).springify()}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.qaScroll}
            contentContainerStyle={{ gap: 12 }}
          >
            {QA_ACTIONS.map((a, i) => (
              <TouchableOpacity
                key={i}
                style={styles.qaCard}
                activeOpacity={0.85}
                onPress={a.route ? () => router.push(a.route) : undefined}
              >
                <View style={[styles.qaIcon, { backgroundColor: a.bg }]}>
                  {i === 0 && <Svg width="20" height="20" viewBox="0 0 20 20" fill="none"><Rect x="4" y="3" width="12" height="14" rx="2" stroke={a.iconColor} strokeWidth="1.5" fill="none" /><Line x1="7" y1="7" x2="13" y2="7" stroke={a.iconColor} strokeWidth="1.3" strokeLinecap="round" /><Line x1="7" y1="10" x2="11" y2="10" stroke={a.iconColor} strokeWidth="1.3" strokeLinecap="round" /></Svg>}
                  {i === 1 && <Svg width="20" height="20" viewBox="0 0 20 20" fill="none"><Rect x="4" y="5" width="12" height="10" rx="2" stroke={a.iconColor} strokeWidth="1.5" fill="none" /><Path d="M7 5V4C7 3 8 2.5 10 2.5C12 2.5 13 3 13 4V5" stroke={a.iconColor} strokeWidth="1.5" fill="none" /></Svg>}
                  {i === 2 && <Svg width="20" height="20" viewBox="0 0 20 20" fill="none"><Circle cx="10" cy="10" r="6" stroke={a.iconColor} strokeWidth="1.5" fill="none" /><Line x1="10" y1="7" x2="10" y2="11" stroke={a.iconColor} strokeWidth="1.3" strokeLinecap="round" /><Circle cx="10" cy="13" r="0.5" fill={a.iconColor} /></Svg>}
                  {i === 3 && <Svg width="20" height="20" viewBox="0 0 20 20" fill="none"><Circle cx="10" cy="10" r="6" stroke={a.iconColor} strokeWidth="1.5" fill="none" /><Path d="M10 7V10L12 12" stroke={a.iconColor} strokeWidth="1.3" strokeLinecap="round" /></Svg>}
                  {i === 4 && <Svg width="20" height="20" viewBox="0 0 20 20" fill="none"><Path d="M3 14H17" stroke={a.iconColor} strokeWidth="1.5" strokeLinecap="round" /><Path d="M5 11L7 7L9 9L13 4" stroke={a.iconColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></Svg>}
                </View>
                <Text style={styles.qaLabel}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* ANALYTICS */}
        <Animated.View entering={FadeInUp.duration(500).delay(200).springify()}>
          <View style={styles.secHead}>
            <Text style={styles.secTitle}>Production Analytics</Text>
            <TouchableOpacity>
              <Text style={styles.secLink}>Full Report</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <View style={styles.analyticsGrid}>
          {batch.analytics.map((a, i) => (
            <Animated.View
              key={i}
              entering={FadeInUp.duration(500).delay(240 + i * 60).springify()}
              style={styles.analyticsCard}
            >
              <View style={[styles.anIcon, { backgroundColor: a.iconBg }]}>
                {a.icon(a.iconColor)}
              </View>
              <Text style={styles.anMetric}>{a.metric}</Text>
              <Text style={styles.anLabel}>{a.label}</Text>
              {a.trend ? <Text style={[styles.anTrend, { color: a.trendColor }]}>{a.trend}</Text> : <View style={{ height: 16 }} />}
              <View style={styles.miniChart}>
                {a.bars.map((h, j) => (
                  <View
                    key={j}
                    style={[styles.miniBar, { height: `${h}%` as any, backgroundColor: a.activeBars.includes(j) ? a.iconColor : '#E2E8E0' }]}
                  />
                ))}
              </View>
            </Animated.View>
          ))}
        </View>

        {/* TIMELINE */}
        <Animated.View entering={FadeInUp.duration(500).delay(380).springify()}>
          <View style={styles.secHead}>
            <Text style={styles.secTitle}>Production Timeline</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(420).springify()} style={styles.timeline}>
          {batch.timeline.map((item, i) => (
            <View key={i} style={styles.tlItem}>
              <View style={[styles.tlDot, item.warn && styles.tlDotWarn]} />
              <Text style={styles.tlTitle}>{item.title}</Text>
              <Text style={styles.tlDesc}>{item.desc}</Text>
              <Text style={styles.tlTime}>{item.time}</Text>
            </View>
          ))}
        </Animated.View>

        {/* REINVESTMENT TRACKER */}
        <Animated.View entering={FadeInUp.duration(500).delay(460).springify()}>
          <View style={styles.secHead}>
            <Text style={styles.secTitle}>Reinvestment Tracker</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(500).springify()} style={styles.reinvestCard}>
          <View style={styles.reinvestHead}>
            <Text style={styles.reinvestTitle}>Next Production Cycle Savings</Text>
            <View style={styles.reinvestBadge}>
              <Text style={styles.reinvestBadgeText}>On Track</Text>
            </View>
          </View>

          <View style={styles.reinvestRingWrap}>
            <View style={styles.reinvestRing}>
              <Svg width="80" height="80" viewBox="0 0 80 80">
                <Circle cx="40" cy="40" r="34" stroke="#E2E8F0" strokeWidth="5" fill="none" />
                <Circle
                  cx="40" cy="40" r="34" stroke="#2E7D32" strokeWidth="5" fill="none"
                  strokeDasharray="213.6"
                  strokeDashoffset={213.6 - (batch.reinvest.pct / 100) * 213.6}
                  strokeLinecap="round"
                />
              </Svg>
              <View style={styles.reinvestRingText}>
                <Text style={styles.reinvestRingPct}>{batch.reinvest.pct}%</Text>
                <Text style={styles.reinvestRingLbl}>Saved</Text>
              </View>
            </View>

            <View style={styles.reinvestMetrics}>
              <View style={styles.reinvestRow}>
                <Text style={styles.reinvestRowLbl}>Goal Amount</Text>
                <Text style={styles.reinvestRowVal}>{batch.reinvest.goal}</Text>
              </View>
              <View style={styles.reinvestRow}>
                <Text style={styles.reinvestRowLbl}>Amount Saved</Text>
                <Text style={styles.reinvestRowVal}>{batch.reinvest.saved}</Text>
              </View>
              <View style={styles.reinvestRow}>
                <Text style={styles.reinvestRowLbl}>Weekly Target</Text>
                <Text style={styles.reinvestRowVal}>{batch.reinvest.weekly}</Text>
              </View>
              <View style={styles.reinvestRow}>
                <Text style={styles.reinvestRowLbl}>Est. Readiness</Text>
                <Text style={[styles.reinvestRowVal, { color: '#16A34A' }]}>{batch.reinvest.readiness}</Text>
              </View>
            </View>
          </View>

          <View style={styles.reinvestChart}>
            {[30, 38, 35, 50, 55, 60, 72, 68, 75, 82].map((h, i) => (
              <View
                key={i}
                style={[styles.reinvestBar, { height: `${h}%` as any, backgroundColor: i >= 4 ? '#2E7D32' : '#E2E8E0' }]}
              />
            ))}
          </View>
        </Animated.View>

        {/* SMART INSIGHTS */}
        <Animated.View style={{ marginTop: 18 }} entering={FadeInUp.duration(500).delay(540).springify()}>
          <View style={styles.secHead}>
            <Text style={styles.secTitle}>Smart Insights</Text>
          </View>
        </Animated.View>

        {batch.insights.map((ins, i) => (
          <Animated.View
            key={i}
            entering={FadeInUp.duration(500).delay(580 + i * 80).springify()}
            style={[styles.insightCard, { backgroundColor: ins.bg }]}
          >
            <View style={styles.insightIcon}>
              <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <Path d="M10 3L8 8L3 9.5L8 11L10 16L12 11L17 9.5L12 8L10 3Z" fill={ins.iconColor} fillOpacity="0.2" stroke={ins.iconColor} strokeWidth="1.3" strokeLinejoin="round" />
              </Svg>
            </View>
            <Text style={styles.insightText}>
              {ins.text.split(/(\d+%|\d+\.?\d*%)/).map((part, j) => (
                /\d/.test(part) ? <Text key={j} style={{ fontWeight: '700', color: '#2E7D32' }}>{part}</Text> : part
              ))}
            </Text>
          </Animated.View>
        ))}

        <View style={{ height: 160 }} />
      </ScrollView>

      <BottomTabBar />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAF7' },

  /* bg */
  glowBg: { position: 'absolute', top: -50, right: -50, width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(232,245,233,0.30)', zIndex: 0 },
  contour1: { position: 'absolute', width: 350, height: 110, top: '5%', left: '-10%', borderWidth: 1, borderColor: '#2E7D32', borderBottomWidth: 0, borderTopLeftRadius: 175, borderTopRightRadius: 175, opacity: 0.04, transform: [{ rotate: '6deg' }], zIndex: 0 },
  contour2: { position: 'absolute', width: 280, height: 90, bottom: '15%', right: '-10%', borderWidth: 1, borderColor: '#2E7D32', borderTopWidth: 0, borderBottomLeftRadius: 140, borderBottomRightRadius: 140, opacity: 0.04, transform: [{ rotate: '-8deg' }], zIndex: 0 },

  /* scroll */
  scroll: { flex: 1, zIndex: 1 },
  scrollInner: { paddingHorizontal: 20, paddingTop: 6 },

  /* top nav */
  topNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6 },
  navBack: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  topTitle: { fontFamily: 'Poppins', fontWeight: '700', fontSize: 20, color: '#1B1B1B' },
  menuBtn: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: 'white',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 14, elevation: 3,
  },

  /* hero card */
  heroCard: {
    borderRadius: 32, padding: 24, marginTop: 14, overflow: 'hidden',
    shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.28, shadowRadius: 45, elevation: 8,
  },
  heroDots: {
    position: 'absolute', inset: 0, opacity: 0.04, zIndex: 0,
  },
  heroCc: { position: 'absolute', borderRadius: 50, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  heroGl: {
    position: 'absolute', top: -20, right: -10, width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.08)', zIndex: 0,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 1 },
  heroLabel: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.7)', letterSpacing: 1 },
  heroMainTitle: { fontFamily: 'Poppins', fontWeight: '800', fontSize: 30, color: 'white', marginTop: 0 },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: -2 },
  heroRing: { width: 72, height: 72, position: 'relative', flexShrink: 0 },
  heroRingText: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  heroRingPct: { fontSize: 16, fontWeight: '800', color: 'white' },
  heroRingLbl: { fontSize: 7, fontWeight: '500', color: 'rgba(255,255,255,0.6)' },
  heroMetrics: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, zIndex: 1 },
  heroMetric: { flex: 1, alignItems: 'center' },
  heroMetricVal: { fontSize: 22, fontWeight: '800', color: 'white' },
  heroMetricLbl: { fontSize: 11, fontWeight: '400', color: 'rgba(255,255,255,0.6)', marginTop: 1 },
  heroProgress: { marginTop: 18, zIndex: 1 },
  heroProgHead: { flexDirection: 'row', justifyContent: 'space-between' },
  heroProgTrack: { width: '100%', height: 8, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 100, marginTop: 6, overflow: 'hidden' },
  heroProgFill: { height: '100%', borderRadius: 100, backgroundColor: '#F9A825' },

  /* section */
  secHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 22, marginBottom: 12 },
  secTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  secLink: { fontSize: 13, fontWeight: '500', color: '#2E7D32' },

  /* quick actions */
  qaScroll: { paddingBottom: 4 },
  qaCard: {
    minWidth: 110, backgroundColor: 'white', borderRadius: 22, paddingVertical: 18, paddingHorizontal: 12,
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 2,
  },
  qaIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  qaLabel: { fontSize: 13, fontWeight: '600', color: '#1F2937' },

  /* analytics */
  analyticsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  analyticsCard: {
    width: (SCREEN_W - 52) / 2, backgroundColor: 'white', borderRadius: 24, padding: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 2,
  },
  anIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  anMetric: { fontSize: 22, fontWeight: '800', color: '#1F2937', marginTop: 8, letterSpacing: -0.3 },
  anLabel: { fontSize: 11, color: '#64748B', marginTop: 1 },
  anTrend: { fontSize: 11, fontWeight: '600', marginTop: 4 },
  miniChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 24, marginTop: 8 },
  miniBar: { width: 5, borderRadius: 2 },

  /* timeline */
  timeline: { paddingLeft: 20, position: 'relative' },
  tlItem: { paddingLeft: 16, paddingBottom: 18, position: 'relative' },
  tlDot: {
    position: 'absolute', left: -16, top: 3, width: 12, height: 12, borderRadius: 6,
    borderWidth: 2.5, borderColor: 'white',
    shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 0,
    backgroundColor: '#2E7D32', elevation: 4,
  },
  tlDotWarn: {
    backgroundColor: '#F59E0B',
    shadowColor: '#F59E0B',
  },
  tlTitle: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  tlDesc: { fontSize: 12, color: '#64748B', marginTop: 1 },
  tlTime: { fontSize: 11, color: '#94A3B8', marginTop: 2 },

  /* reinvestment */
  reinvestCard: {
    backgroundColor: '#E8F5E9', borderRadius: 28, padding: 22,
    borderWidth: 1, borderColor: 'rgba(46,125,50,0.06)',
    shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 24, elevation: 2,
  },
  reinvestHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reinvestTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  reinvestBadge: { paddingVertical: 3, paddingHorizontal: 12, borderRadius: 100, backgroundColor: '#DCFCE7' },
  reinvestBadgeText: { fontSize: 11, fontWeight: '600', color: '#16A34A' },
  reinvestRingWrap: { flexDirection: 'row', alignItems: 'center', gap: 24, marginTop: 16 },
  reinvestRing: { width: 80, height: 80, position: 'relative', flexShrink: 0 },
  reinvestRingText: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  reinvestRingPct: { fontSize: 18, fontWeight: '800', color: '#1F2937' },
  reinvestRingLbl: { fontSize: 7, fontWeight: '500', color: '#94A3B8' },
  reinvestMetrics: { flex: 1 },
  reinvestRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  reinvestRowLbl: { fontSize: 13, color: '#64748B' },
  reinvestRowVal: { fontSize: 13, fontWeight: '600', color: '#1F2937' },
  reinvestChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 32, marginTop: 14 },
  reinvestBar: { flex: 1, borderRadius: 3 },

  /* insight */
  insightCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, borderRadius: 24, padding: 18, marginBottom: 10 },
  insightIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', flexShrink: 0, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 },
  insightText: { fontSize: 13, lineHeight: 20, color: '#1F2937', flex: 1 },
})
