import React, { useMemo, useState } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Dimensions, Modal, TextInput, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import { StatusBar } from 'expo-status-bar'
import { router, useLocalSearchParams } from 'expo-router'
import { Icons } from '../../shared/icons'
import GoonaIcon from '../../components/ui/GoonaIcon'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { FadeInUp, SlideInUp } from 'react-native-reanimated'
import { useBatchStore } from '../../store/useBatchStore'
import { useFarmChatStore } from '../../store/useFarmChatStore'

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

export default function BatchDetailsScreen() {
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id: string }>()
  const storeBatch = useBatchStore((s) => s.getBatchById(id ?? ''))
  const completeBatch = useBatchStore((s) => s.completeBatch)
  const restoreBatch = useBatchStore((s) => s.restoreBatch)
  const addFeedPost = useFarmChatStore((s) => s.addFeedPost)

  const isCompleted = storeBatch?.status === 'completed'

  const [showCompleteSheet, setShowCompleteSheet] = useState(false)
  const [harvestFinalCount, setHarvestFinalCount] = useState('')
  const [harvestRevenue, setHarvestRevenue] = useState('')
  const [harvestNotes, setHarvestNotes] = useState('')

  const batch = useMemo(() => {
    if (!id) return BATCH_DETAILS.batch_a
    if (BATCH_DETAILS[id]) return BATCH_DETAILS[id]
    if (storeBatch) return deriveBatchDetail(storeBatch)
    return BATCH_DETAILS.batch_a
  }, [id, storeBatch])

  const displayProgress = isCompleted ? 100 : batch.progress

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
    setShowCompleteSheet(false)
    if (router.canGoBack()) {
      router.back()
    } else {
      router.replace('/(tabs)/records/batch-management' as any)
    }
  }

  function handleRestore() {
    if (!id) return
    restoreBatch(id)
    if (router.canGoBack()) {
      router.back()
    } else {
      router.replace('/(tabs)/records/batch-management' as any)
    }
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
              <Text style={styles.hstatV}>{batch.mortality}</Text>
              <Text style={styles.hstatL}>Mortality</Text>
            </View>
            <View style={styles.hstat}>
              <Text style={styles.hstatV}>{batch.feedUsed}</Text>
              <Text style={styles.hstatL}>Feed Used</Text>
            </View>
            <View style={styles.hstat}>
              <Text style={[styles.hstatV, styles.hstatVLime]}>{batch.revenue}</Text>
              <Text style={styles.hstatL}>Revenue</Text>
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

        {/* PRODUCTION ANALYTICS */}
        <Animated.View entering={FadeInUp.duration(500).delay(140).springify()}>
          <View style={styles.sec}>
            <Text style={styles.secTitle}>Production Analytics</Text>
            <TouchableOpacity>
              <Text style={styles.secLink}>Full Report</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <View style={styles.analytics}>
          {batch.analytics.map((a, i) => {
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

        {/* SMART INSIGHTS */}
        <Animated.View entering={FadeInUp.duration(500).delay(360).springify()}>
          <View style={styles.sec}>
            <Text style={styles.secTitle}>Smart Insights</Text>
            <Text style={styles.secMeta}>GOONA IQ</Text>
          </View>
        </Animated.View>

        {batch.insights.map((ins, i) => (
          <Animated.View
            key={i}
            entering={FadeInUp.duration(500).delay(400 + i * 80).springify()}
            style={[styles.ins, i % 2 === 0 ? styles.insGreen : styles.insBlue]}
          >
            <View style={styles.iIco}>
              <Text style={{ fontSize: 18 }}>{i % 2 === 0 ? '\uD83D\uDCC8' : '\uD83C\uDF3E'}</Text>
            </View>
            <Text style={styles.iTxt}>
              {ins.text.split(/(\d+%|\d+\.?\d*%)/).map((part, j) => (
                /\d/.test(part) ? <Text key={j} style={styles.iBold}>{part}</Text> : part
              ))}
            </Text>
          </Animated.View>
        ))}

        {/* COMPLETE CYCLE / RESTORE (BOTTOM) */}
        <Animated.View entering={FadeInUp.duration(500).delay(460).springify()}>
          {isCompleted ? (
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
                <Text style={styles.cTitle}>Complete Cycle / Harvest</Text>
                <Text style={styles.cSub}>Move to Farm History · restore anytime</Text>
              </View>
              <GoonaIcon icon={Icons.chevronRight} size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <Text style={styles.completeNote}>
            {isCompleted
              ? 'Batch is in Farm History — all records preserved.'
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
              <Text style={styles.sheetTitle}>Complete This Cycle?</Text>
              <Text style={styles.sheetDesc}>
                {batch.name} will move to Farm History and leave Active Batches. You can restore it anytime.
              </Text>
            </View>

            <View style={styles.sheetBody}>
              <Text style={styles.sheetSectionTitle}>Harvest Summary (optional)</Text>

              <Text style={styles.sheetInputLabel}>Final Bird Count</Text>
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
                <Text style={styles.sheetConfirmText}>Complete Cycle</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
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
  hstatV: { fontSize: 22, fontWeight: '800', color: 'white' },
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
})
