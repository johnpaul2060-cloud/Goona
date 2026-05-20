import React, { useState, useMemo } from 'react'
import {
  View, Text, TouchableOpacity, TextInput, ScrollView,
  StyleSheet, Dimensions,
} from 'react-native'
import Svg, { Path, Circle, Rect, Line, Ellipse } from 'react-native-svg'
import { StatusBar } from 'expo-status-bar'
import { router } from 'expo-router'
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
  FadeInUp,
} from 'react-native-reanimated'
import BottomTabBar from '../components/BottomTabBar'
import { useBatchStore, Batch } from '../store/useBatchStore'

const { width: SCREEN_W } = Dimensions.get('window')

function usePressScale() {
  const scale = useSharedValue(1)
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
  return {
    style,
    onPressIn: () => { scale.value = withSpring(0.96, { damping: 15, stiffness: 200 }) },
    onPressOut: () => { scale.value = withSpring(1, { damping: 15, stiffness: 200 }) },
  }
}

const FILTERS = ['All', 'Active', 'Near Harvest', 'Completed', 'High Risk'] as const

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

function weeksLabel(weeks: number): string {
  if (weeks === 0) return 'Just started'
  return `Started ${weeks} week${weeks === 1 ? '' : 's'} ago`
}

function getBadge(progress: number, batchName: string): { text: string; bg: string; color: string } {
  if (progress > 85) return { text: 'Near Harvest', bg: '#FFFBEB', color: '#F59E0B' }
  if (progress > 50) return { text: 'Healthy', bg: '#F0FDF4', color: '#16A34A' }
  if (progress > 20) return { text: 'Active', bg: '#F0FDF4', color: '#16A34A' }
  return { text: 'Just Started', bg: '#EEF3FF', color: '#1A56FF' }
}

function getAccentColors(progress: number): readonly [string, string] {
  if (progress > 85) return ['#F59E0B', '#D97706']
  return ['#16A34A', '#2E7D32']
}

function estimateFeedKg(batch: Batch): string {
  const weeks = weeksSince(batch.startDate)
  const isLayer = batch.livestockType === 'Layers'
  const dailyRate = isLayer ? 0.12 : 0.09
  const total = Math.round(batch.quantity * weeks * 7 * dailyRate)
  return total > 1000 ? `${(total / 1000).toFixed(1)}t` : `${total}kg`
}

function estimateExpectedRevenue(batch: Batch): number {
  const totalCost = batch.purchaseCost + batch.feedCost + batch.medicationCost
  return Math.round(totalCost * 2.12)
}

const ALERTS_DATA = [
  {
    bg: '#FFFBEB',
    iconBg: '#FEF3C7',
    iconColor: '#F59E0B',
    icon: (c: string) => (
      <Svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <Path d="M9 3L3 15H15L9 3Z" stroke={c} strokeWidth="1.4" strokeLinejoin="round" fill="none" />
        <Line x1="9" y1="7" x2="9" y2="11" stroke={c} strokeWidth="1.3" strokeLinecap="round" />
        <Circle cx="9" cy="13" r="0.5" fill={c} />
      </Svg>
    ),
    text: 'Batch C mortality increased by 2.1% this week.',
    cta: 'Review Details',
    ctaColor: '#F59E0B',
  },
  {
    bg: '#FFF1F2',
    iconBg: '#FECACA',
    iconColor: '#EF4444',
    icon: (c: string) => (
      <Svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <Rect x="3" y="5" width="12" height="10" rx="2" stroke={c} strokeWidth="1.4" fill="none" />
        <Path d="M6 5V4C6 3 7 2.5 9 2.5C11 2.5 12 3 12 4V5" stroke={c} strokeWidth="1.4" fill="none" />
      </Svg>
    ),
    text: 'Feed inventory for Layer Batch B is running low.',
    cta: 'Order Now',
    ctaColor: '#EF4444',
  },
] as const

export default function BatchesScreen() {
  const [activeFilter, setActiveFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  const batches = useBatchStore((s) => s.batches)

  const pressScale = usePressScale()

  const overviewCards = useMemo(() => {
    const active = batches.length
    const totalBirds = batches.reduce((sum, b) => sum + b.quantity, 0)
    const totalRevenue = batches.reduce((sum, b) => sum + estimateExpectedRevenue(b), 0)
    const avgMortality = 'Low'

    return [
      {
        metric: `${active}`, label: 'Active Batches',
        bg: '#F0FDF4', stroke: '#16A34A',
        icon: (c: string) => (
          <Svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <Rect x="3" y="3" width="12" height="12" rx="2" stroke={c} strokeWidth="1.4" fill="none" />
            <Line x1="6" y1="7" x2="12" y2="7" stroke={c} strokeWidth="1.2" strokeLinecap="round" />
            <Line x1="6" y1="10" x2="10" y2="10" stroke={c} strokeWidth="1.2" strokeLinecap="round" />
          </Svg>
        ),
      },
      {
        metric: totalBirds > 1000 ? `${(totalBirds / 1000).toFixed(1)}k` : `${totalBirds}`, label: 'Total Birds',
        bg: '#EEF3FF', stroke: '#1A56FF',
        icon: (c: string) => (
          <Svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <Ellipse cx="9" cy="12" rx="5" ry="3" stroke={c} strokeWidth="1.4" fill="none" />
            <Circle cx="9" cy="7" r="3" stroke={c} strokeWidth="1.4" fill="none" />
          </Svg>
        ),
      },
      {
        metric: avgMortality, label: 'Mortality Risk',
        bg: '#FFFBEB', stroke: '#F59E0B',
        icon: (c: string) => (
          <Svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <Circle cx="9" cy="9" r="5.5" stroke={c} strokeWidth="1.4" fill="none" />
            <Line x1="9" y1="6" x2="9" y2="10" stroke={c} strokeWidth="1.3" strokeLinecap="round" />
            <Circle cx="9" cy="12.5" r="0.6" fill={c} />
          </Svg>
        ),
      },
      {
        metric: totalRevenue >= 1_000_000 ? `₦${(totalRevenue / 1_000_000).toFixed(1)}M` : `₦${(totalRevenue / 1000).toFixed(0)}k`, label: 'Projected Revenue',
        bg: '#F0FDF4', stroke: '#16A34A',
        icon: (c: string) => (
          <Svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <Path d="M4 14H14" stroke={c} strokeWidth="1.4" strokeLinecap="round" />
            <Rect x="6" y="8" width="6" height="6" rx="1.5" stroke={c} strokeWidth="1.4" fill="none" />
            <Path d="M8 8V6C8 5 8.5 4.5 9 4.5C9.5 4.5 10 5 10 6V8" stroke={c} strokeWidth="1.4" fill="none" />
          </Svg>
        ),
      },
    ] as const
  }, [batches])

  const filteredBatches = useMemo(() => {
    let list = [...batches]

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        (b) =>
          b.batchName.toLowerCase().includes(q) ||
          b.livestockType.toLowerCase().includes(q)
      )
    }

    if (activeFilter !== 'All') {
      list = list.filter((b) => {
        const prog = computeProgress(b.startDate, b.duration)
        switch (activeFilter) {
          case 'Active':
            return prog < 85
          case 'Near Harvest':
            return prog >= 85
          case 'Completed':
            return false
          case 'High Risk':
            return false
          default:
            return true
        }
      })
    }

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return list
  }, [batches, searchQuery, activeFilter])

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
        {/* HEADER */}
        <Animated.View entering={FadeInUp.duration(500).springify()} style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerLabel}>Batch Management</Text>
            <Text style={styles.headerTitle}>Livestock{'\n'}Batches</Text>
            <Text style={styles.headerSub}>Track performance across all active production cycles.</Text>
          </View>
          <TouchableOpacity style={styles.filterBtn} activeOpacity={0.85}>
            <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <Path d="M3 5H17" stroke="#1F2937" strokeWidth="1.5" strokeLinecap="round" />
              <Path d="M6 10H14" stroke="#1F2937" strokeWidth="1.5" strokeLinecap="round" />
              <Path d="M9 15H11" stroke="#1F2937" strokeWidth="1.5" strokeLinecap="round" />
            </Svg>
          </TouchableOpacity>
        </Animated.View>

        {/* SEARCH */}
        <Animated.View entering={FadeInUp.duration(500).delay(60).springify()} style={styles.searchWrap}>
          <View style={styles.searchIcon}>
            <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <Circle cx="9" cy="9" r="5" stroke="#A0AEA1" strokeWidth="1.5" fill="none" />
              <Path d="M13 13L17 17" stroke="#A0AEA1" strokeWidth="1.5" strokeLinecap="round" />
            </Svg>
          </View>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search batches..."
            placeholderTextColor="#A0AEA1"
          />
          <TouchableOpacity style={styles.filterIcon} activeOpacity={0.85}>
            <Svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <Path d="M3 5H15" stroke="#A0AEA1" strokeWidth="1.4" strokeLinecap="round" />
              <Path d="M6 9H12" stroke="#A0AEA1" strokeWidth="1.4" strokeLinecap="round" />
              <Path d="M8.5 13H9.5" stroke="#A0AEA1" strokeWidth="1.4" strokeLinecap="round" />
            </Svg>
          </TouchableOpacity>
        </Animated.View>

        {/* FILTER PILLS */}
        <Animated.View entering={FadeInUp.duration(500).delay(100).springify()}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
            contentContainerStyle={styles.filterScrollInner}
          >
            {FILTERS.map((f) => {
              const active = activeFilter === f
              return (
                <TouchableOpacity
                  key={f}
                  activeOpacity={0.85}
                  onPress={() => setActiveFilter(f)}
                  style={[styles.filterPill, active && styles.filterPillActive]}
                >
                  <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>{f}</Text>
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        </Animated.View>

        {/* OVERVIEW CARDS */}
        <Animated.View entering={FadeInUp.duration(500).delay(140).springify()}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.overviewScroll}
            contentContainerStyle={styles.overviewScrollInner}
          >
            {overviewCards.map((card, i) => (
              <View key={i} style={styles.overviewCard}>
                <View style={[styles.ovIcon, { backgroundColor: card.bg }]}>
                  {card.icon(card.stroke)}
                </View>
                <Text style={styles.ovMetric}>{card.metric}</Text>
                <Text style={styles.ovLabel}>{card.label}</Text>
              </View>
            ))}
          </ScrollView>
        </Animated.View>

        {/* SECTION HEADER */}
        <Animated.View entering={FadeInUp.duration(500).delay(180).springify()}>
          <View style={styles.secHead}>
            <Text style={styles.secTitle}>Active Production Cycles</Text>
            <TouchableOpacity>
              <Text style={styles.secLink}>View Analytics</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* BATCH CARDS */}
        {filteredBatches.length === 0 && batches.length === 0 && (
          <Animated.View entering={FadeInUp.duration(500).springify()} style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <Rect x="8" y="12" width="32" height="24" rx="4" stroke="#A0AEA1" strokeWidth="2" fill="none" />
                <Line x1="16" y1="20" x2="32" y2="20" stroke="#A0AEA1" strokeWidth="1.5" strokeLinecap="round" />
                <Line x1="16" y1="26" x2="28" y2="26" stroke="#A0AEA1" strokeWidth="1.5" strokeLinecap="round" />
              </Svg>
            </View>
            <Text style={styles.emptyTitle}>No production batches yet</Text>
            <Text style={styles.emptySub}>Create your first batch to start tracking livestock growth, feeding, and profitability.</Text>
            <TouchableOpacity
              style={styles.emptyCta}
              activeOpacity={0.85}
              onPress={() => router.push('/create-batch')}
            >
              <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <Line x1="10" y1="5" x2="10" y2="15" stroke="white" strokeWidth="2" strokeLinecap="round" />
                <Line x1="5" y1="10" x2="15" y2="10" stroke="white" strokeWidth="2" strokeLinecap="round" />
              </Svg>
              <Text style={styles.emptyCtaText}>Create First Batch</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
        {filteredBatches.length === 0 && batches.length > 0 && (
          <Animated.View entering={FadeInUp.duration(500).springify()} style={styles.emptyState}>
            <Text style={styles.emptyText}>No batches match your search</Text>
          </Animated.View>
        )}

        {filteredBatches.map((batch, i) => {
          const prog = computeProgress(batch.startDate, batch.duration)
          const badge = getBadge(prog, batch.batchName)
          const accent = getAccentColors(prog)
          const feedEst = estimateFeedKg(batch)
          const mortalityEst = batch.id === 'batch_c' ? '4.2%' : batch.id === 'batch_b' ? '2.4%' : '1.8%'
          const subtitle = weeksLabel(weeksSince(batch.startDate))

          return (
          <Animated.View
            key={batch.id}
            entering={FadeInUp.duration(500).delay(220 + i * 100).springify()}
          >
            <TouchableOpacity
              style={styles.batchCard}
              activeOpacity={0.95}
              onPress={() => router.push({ pathname: '/batch-details/[id]', params: { id: batch.id } })}
            >
              <View style={[styles.batchAccent, { backgroundColor: accent[0] }]} />
              <View style={styles.batchDots} pointerEvents="none" />

              <View style={styles.batchTop}>
                <View>
                  <Text style={styles.batchName}>{batch.batchName}</Text>
                  <Text style={styles.batchSub}>{subtitle}</Text>
                </View>
                <View style={[styles.batchBadge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.batchBadgeText, { color: badge.color }]}>{badge.text}</Text>
                </View>
              </View>

              <View style={styles.batchMetrics}>
                <View style={[styles.batchMetric, styles.batchMetricBorder]}>
                  <Text style={styles.batchMetricVal}>{batch.quantity}</Text>
                  <Text style={styles.batchMetricLbl}>Bird Count</Text>
                </View>
                <View style={[styles.batchMetric, styles.batchMetricBorder]}>
                  <Text style={styles.batchMetricVal}>{feedEst}</Text>
                  <Text style={styles.batchMetricLbl}>Feed Used</Text>
                </View>
                <View style={styles.batchMetric}>
                  <Text style={styles.batchMetricVal}>{mortalityEst}</Text>
                  <Text style={styles.batchMetricLbl}>Mortality</Text>
                </View>
              </View>

              <View style={styles.batchProgress}>
                <View style={styles.batchProgHead}>
                  <Text style={styles.batchProgLabel}>Production Progress</Text>
                  <Text style={styles.batchProgPct}>{prog}%</Text>
                </View>
                <View style={styles.batchProgTrack}>
                  <View style={[styles.batchProgFill, { width: `${prog}%` as any }]} />
                </View>
              </View>

              <View style={styles.batchActions}>
                <TouchableOpacity
                  style={styles.batchAction}
                  activeOpacity={0.85}
                  onPress={() => router.push({ pathname: '/batch-details/[id]', params: { id: batch.id } })}
                >
                  <Text style={styles.batchActionText}>View Details</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.batchAction, { backgroundColor: badge.bg, borderColor: badge.text === 'Warning' ? '#FECACA' : '#DCFCE7' }]}
                  activeOpacity={0.85}
                  onPress={() => router.push('/daily-records')}
                >
                  <Text style={[styles.batchActionText, { color: badge.color }]}>Add Record</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.batchAction, { backgroundColor: '#EEF3FF', borderColor: '#DBEAFE' }]}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.batchActionText, { color: '#1A56FF' }]}>Analytics</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Animated.View>
          )
        })}

        {/* OPERATIONAL ALERTS */}
        <Animated.View entering={FadeInUp.duration(500).delay(520).springify()}>
          <View style={styles.secHead}>
            <Text style={styles.secTitle}>Operational Alerts</Text>
          </View>
        </Animated.View>

        {ALERTS_DATA.map((alert, i) => (
          <Animated.View
            key={i}
            entering={FadeInUp.duration(500).delay(560 + i * 80).springify()}
          >
            <TouchableOpacity style={[styles.alertCard, { backgroundColor: alert.bg }]} activeOpacity={0.95}>
              <View style={[styles.alertIcon, { backgroundColor: alert.iconBg }]}>
                {alert.icon(alert.iconColor)}
              </View>
              <View style={styles.alertBody}>
                <Text style={styles.alertText}>
                  {alert.text.split(/(\d+\.?\d*%)/).map((part, j) => (
                    /\d/.test(part) ? <Text key={j} style={{ fontWeight: '700' }}>{part}</Text> : part
                  ))}
                </Text>
                <Text style={[styles.alertCta, { color: alert.ctaColor }]}>{alert.cta} →</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}

        <View style={{ height: 160 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => router.push('/create-batch')}
      >
        <Svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <Line x1="14" y1="8" x2="14" y2="20" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          <Line x1="8" y1="14" x2="20" y2="14" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        </Svg>
      </TouchableOpacity>

      <BottomTabBar />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAF7' },

  /* bg */
  glowBg: {
    position: 'absolute', top: -40, right: -40, width: 260, height: 260,
    borderRadius: 130, backgroundColor: 'rgba(232,245,233,0.35)', zIndex: 0,
  },
  contour1: {
    position: 'absolute', width: 350, height: 110, top: '5%', left: '-10%',
    borderWidth: 1, borderColor: '#2E7D32', borderBottomWidth: 0,
    borderTopLeftRadius: 175, borderTopRightRadius: 175, opacity: 0.04,
    transform: [{ rotate: '6deg' }], zIndex: 0,
  },
  contour2: {
    position: 'absolute', width: 280, height: 90, bottom: '15%', right: '-10%',
    borderWidth: 1, borderColor: '#2E7D32', borderTopWidth: 0,
    borderBottomLeftRadius: 140, borderBottomRightRadius: 140, opacity: 0.04,
    transform: [{ rotate: '-8deg' }], zIndex: 0,
  },

  /* scroll */
  scroll: { flex: 1, zIndex: 1 },
  scrollInner: { paddingHorizontal: 20, paddingTop: 6 },

  /* header */
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: 6 },
  headerLeft: { flex: 1 },
  headerLabel: { fontSize: 11, fontWeight: '600', color: '#2E7D32', letterSpacing: 2, textTransform: 'uppercase' },
  headerTitle: { fontFamily: 'Poppins', fontWeight: '800', fontSize: 30, color: '#1B1B1B', letterSpacing: -0.5 },
  headerSub: { fontSize: 14, fontWeight: '400', color: '#616161', marginTop: 1 },
  filterBtn: {
    width: 48, height: 48, borderRadius: 18, backgroundColor: 'white',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 14, elevation: 3,
  },

  /* search */
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', height: 56,
    backgroundColor: 'white', borderRadius: 20, paddingHorizontal: 18, gap: 12,
    marginTop: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 2,
  },
  searchIcon: { alignItems: 'center', justifyContent: 'center' },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '400', color: '#1B1B1B', padding: 0, margin: 0 },
  filterIcon: { alignItems: 'center', justifyContent: 'center' },

  /* filter pills */
  filterScroll: { marginTop: 14, paddingBottom: 4 },
  filterScrollInner: { gap: 10 },
  filterPill: {
    paddingVertical: 8, paddingHorizontal: 20, borderRadius: 100,
    backgroundColor: 'white', borderWidth: 1, borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: '#2E7D32', borderColor: 'transparent',
    shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 14, elevation: 4,
  },
  filterPillText: { fontSize: 13, fontWeight: '500', color: '#64748B' },
  filterPillTextActive: { color: 'white' },

  /* overview cards */
  overviewScroll: { marginTop: 20, paddingBottom: 4 },
  overviewScrollInner: { gap: 12 },
  overviewCard: {
    minWidth: 140, backgroundColor: 'white', borderRadius: 24, padding: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 2,
  },
  ovIcon: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  ovMetric: { fontSize: 24, fontWeight: '800', color: '#1F2937', marginTop: 10, letterSpacing: -0.3 },
  ovLabel: { fontSize: 12, fontWeight: '400', color: '#64748B', marginTop: 1 },

  /* section header */
  secHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 26, marginBottom: 14 },
  secTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  secLink: { fontSize: 13, fontWeight: '500', color: '#2E7D32' },

  /* batch card */
  batchCard: {
    backgroundColor: 'white', borderRadius: 28, padding: 22,
    marginBottom: 14, position: 'relative', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 15 }, shadowOpacity: 0.06, shadowRadius: 35, elevation: 4,
  },
  batchAccent: { position: 'absolute', top: 0, left: 0, width: 4, height: '100%' },
  batchDots: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.02, zIndex: 0,
  },
  batchTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 },
  batchName: { fontFamily: 'Poppins', fontWeight: '700', fontSize: 20, color: '#1F2937' },
  batchSub: { fontSize: 12, fontWeight: '400', color: '#94A3B8', marginTop: -1 },
  batchBadge: { paddingVertical: 4, paddingHorizontal: 12, borderRadius: 100 },
  batchBadgeText: { fontSize: 11, fontWeight: '600' },

  /* batch metrics */
  batchMetrics: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, zIndex: 1 },
  batchMetric: { flex: 1, alignItems: 'center' },
  batchMetricBorder: { borderRightWidth: 1, borderRightColor: '#F1F5F9' },
  batchMetricVal: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  batchMetricLbl: { fontSize: 11, fontWeight: '400', color: '#94A3B8', marginTop: 1 },

  /* batch progress */
  batchProgress: { marginTop: 16, zIndex: 1 },
  batchProgHead: { flexDirection: 'row', justifyContent: 'space-between' },
  batchProgLabel: { fontSize: 12, color: '#64748B' },
  batchProgPct: { fontSize: 12, fontWeight: '600', color: '#1F2937' },
  batchProgTrack: { width: '100%', height: 8, backgroundColor: '#F1F5F9', borderRadius: 100, marginTop: 6, overflow: 'hidden' },
  batchProgFill: { height: '100%', borderRadius: 100, backgroundColor: '#2E7D32' },

  /* batch actions */
  batchActions: { flexDirection: 'row', gap: 10, marginTop: 16, zIndex: 1 },
  batchAction: {
    paddingVertical: 8, paddingHorizontal: 16, borderRadius: 100,
    backgroundColor: '#F8FAF7', borderWidth: 1, borderColor: '#E2E8F0',
  },
  batchActionText: { fontSize: 12, fontWeight: '500', color: '#1F2937' },

  /* alerts */
  alertCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    borderRadius: 22, padding: 16, marginBottom: 10,
  },
  alertIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  alertBody: { flex: 1 },
  alertText: { fontSize: 13, lineHeight: 20, color: '#1F2937' },
  alertCta: { fontSize: 12, fontWeight: '600', marginTop: 4 },

  /* empty state */
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  emptyIcon: { marginBottom: 4 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#1F2937' },
  emptySub: { fontSize: 14, color: '#94A3B8', textAlign: 'center', maxWidth: 280, lineHeight: 22, marginTop: 4 },
  emptyText: { fontSize: 15, fontWeight: '500', color: '#A0AEA1' },
  emptyCta: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20,
    backgroundColor: '#2E7D32', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 100,
    shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 24, elevation: 6,
  },
  emptyCtaText: { fontSize: 15, fontWeight: '600', color: 'white' },

  /* fab */
  fab: {
    position: 'absolute', bottom: 96, right: 20, zIndex: 15,
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#2E7D32',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 30, elevation: 8,
  },
})
