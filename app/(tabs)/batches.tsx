import React, { useState, useMemo } from 'react'
import {
  View, Text, TouchableOpacity, TextInput, ScrollView,
  StyleSheet, Dimensions, Modal,
} from 'react-native'
import Svg, { Path, Circle, Rect, Line, Ellipse } from 'react-native-svg'
import { StatusBar } from 'expo-status-bar'
import { router } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  FadeInUp, FadeIn,
} from 'react-native-reanimated'
import BottomTabBar from '../../components/BottomTabBar'
import { useBatchStore, Batch } from '../../store/useBatchStore'

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

function getBadge(progress: number): { text: string; bg: string; color: string } {
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

const OVERVIEW_ICONS = [
  (c: string) => (
    <Svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <Rect x="3" y="3" width="12" height="12" rx="2" stroke={c} strokeWidth="1.4" fill="none" />
      <Line x1="6" y1="7" x2="12" y2="7" stroke={c} strokeWidth="1.2" strokeLinecap="round" />
      <Line x1="6" y1="10" x2="10" y2="10" stroke={c} strokeWidth="1.2" strokeLinecap="round" />
    </Svg>
  ),
  (c: string) => (
    <Svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <Ellipse cx="9" cy="12" rx="5" ry="3" stroke={c} strokeWidth="1.4" fill="none" />
      <Circle cx="9" cy="7" r="3" stroke={c} strokeWidth="1.4" fill="none" />
    </Svg>
  ),
  (c: string) => (
    <Svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <Circle cx="9" cy="9" r="5.5" stroke={c} strokeWidth="1.4" fill="none" />
      <Line x1="9" y1="6" x2="9" y2="10" stroke={c} strokeWidth="1.3" strokeLinecap="round" />
      <Circle cx="9" cy="12.5" r="0.6" fill={c} />
    </Svg>
  ),
  (c: string) => (
    <Svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <Path d="M4 14H14" stroke={c} strokeWidth="1.4" strokeLinecap="round" />
      <Rect x="6" y="8" width="6" height="6" rx="1.5" stroke={c} strokeWidth="1.4" fill="none" />
      <Path d="M8 8V6C8 5 8.5 4.5 9 4.5C9.5 4.5 10 5 10 6V8" stroke={c} strokeWidth="1.4" fill="none" />
    </Svg>
  ),
]

const FAB_ACTIONS = [
  { label: 'Create Batch', icon: (c: string) => <Svg width="20" height="20" viewBox="0 0 20 20" fill="none"><Line x1="10" y1="5" x2="10" y2="15" stroke={c} strokeWidth="2" strokeLinecap="round" /><Line x1="5" y1="10" x2="15" y2="10" stroke={c} strokeWidth="2" strokeLinecap="round" /></Svg>, route: '/create-batch' as const },
  { label: 'Add Record', icon: (c: string) => <Svg width="20" height="20" viewBox="0 0 20 20" fill="none"><Rect x="4" y="3" width="12" height="14" rx="2" stroke={c} strokeWidth="1.5" fill="none" /><Line x1="7" y1="7" x2="13" y2="7" stroke={c} strokeWidth="1.3" strokeLinecap="round" /><Line x1="7" y1="10" x2="11" y2="10" stroke={c} strokeWidth="1.3" strokeLinecap="round" /></Svg>, route: '/daily-records' as const },
  { label: 'Feed Entry', icon: (c: string) => <Svg width="20" height="20" viewBox="0 0 20 20" fill="none"><Rect x="4" y="5" width="12" height="10" rx="2" stroke={c} strokeWidth="1.5" fill="none" /><Path d="M7 5V4C7 3 8 2.5 10 2.5C12 2.5 13 3 13 4V5" stroke={c} strokeWidth="1.5" fill="none" /></Svg>, route: '/daily-records' as const },
  { label: 'Mortality Log', icon: (c: string) => <Svg width="20" height="20" viewBox="0 0 20 20" fill="none"><Circle cx="10" cy="10" r="6" stroke={c} strokeWidth="1.5" fill="none" /><Line x1="10" y1="7" x2="10" y2="11" stroke={c} strokeWidth="1.3" strokeLinecap="round" /><Circle cx="10" cy="13" r="0.5" fill={c} /></Svg>, route: '/daily-records' as const },
  { label: 'Revenue Entry', icon: (c: string) => <Svg width="20" height="20" viewBox="0 0 20 20" fill="none"><Circle cx="10" cy="10" r="6" stroke={c} strokeWidth="1.5" fill="none" /><Path d="M10 7V10L12 12" stroke={c} strokeWidth="1.3" strokeLinecap="round" /></Svg>, route: '/(tabs)/sales-revenue' as const },
]

export default function BatchesScreen() {
  const [activeFilter, setActiveFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [fabOpen, setFabOpen] = useState(false)

  const batches = useBatchStore((s) => s.batches)

  const fabScale = useSharedValue(0)
  const fabRotate = useSharedValue(0)
  React.useEffect(() => {
    fabScale.value = withTiming(fabOpen ? 1 : 0, { duration: 250 })
    fabRotate.value = withSpring(fabOpen ? 45 : 0, { damping: 18, stiffness: 200 })
  }, [fabOpen])

  const fabOverlayStyle = useAnimatedStyle(() => ({
    opacity: fabScale.value,
  }))

  const fabMenuStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
    opacity: fabScale.value,
  }))

  const fabIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${fabRotate.value}deg` }],
  }))

  const overviewData = useMemo(() => {
    const active = batches.length
    const totalBirds = batches.reduce((sum, b) => sum + b.quantity, 0)
    const totalRevenue = batches.reduce((sum, b) => sum + estimateExpectedRevenue(b), 0)
    return [
      { metric: `${active}`, label: 'Active Batches', bg: '#F0FDF4', stroke: '#16A34A' },
      { metric: totalBirds > 1000 ? `${(totalBirds / 1000).toFixed(1)}k` : `${totalBirds}`, label: 'Total Birds', bg: '#EEF3FF', stroke: '#1A56FF' },
      { metric: 'Low', label: 'Mortality Risk', bg: '#FFFBEB', stroke: '#F59E0B' },
      { metric: totalRevenue >= 1_000_000 ? `₦${(totalRevenue / 1_000_000).toFixed(1)}M` : `₦${(totalRevenue / 1000).toFixed(0)}k`, label: 'Projected Revenue', bg: '#F0FDF4', stroke: '#16A34A' },
    ] as const
  }, [batches])

  const filteredBatches = useMemo(() => {
    let list = [...batches]
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter((b) => b.batchName.toLowerCase().includes(q) || b.livestockType.toLowerCase().includes(q))
    }
    if (activeFilter !== 'All') {
      list = list.filter((b) => {
        const prog = computeProgress(b.startDate, b.duration)
        switch (activeFilter) {
          case 'Active': return prog < 85
          case 'Near Harvest': return prog >= 85
          case 'Completed': return false
          case 'High Risk': return false
          default: return true
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
            <Text style={styles.headerLabel}>GOONA</Text>
            <Text style={styles.headerTitle}>Livestock{'\n'}Batches</Text>
            <Text style={styles.headerSub}>Monitor all production cycles, track performance, and manage operations.</Text>
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
            placeholder="Search batches by name, type, or status..."
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
                >
                  {active ? (
                    <LinearGradient
                      colors={['#2E7D32', '#43A047']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.filterPillActive}
                    >
                      <Text style={styles.filterPillTextActive}>{f}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={styles.filterPill}>
                      <Text style={styles.filterPillText}>{f}</Text>
                    </View>
                  )}
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
            {overviewData.map((card, i) => (
              <View key={i} style={styles.overviewCard}>
                <View style={[styles.ovIconWrap, { backgroundColor: card.bg }]}>
                  {OVERVIEW_ICONS[i](card.stroke)}
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

        {/* EMPTY STATE */}
        {filteredBatches.length === 0 && batches.length === 0 && (
          <Animated.View entering={FadeInUp.duration(500).springify()} style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <Ellipse cx="16" cy="21" rx="10" ry="7" stroke="#A0AEA1" strokeWidth="1.8" fill="none" />
                <Circle cx="16" cy="12" r="6" stroke="#A0AEA1" strokeWidth="1.8" fill="none" />
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

        {/* BATCH CARDS */}
        {filteredBatches.map((batch, i) => {
          const prog = computeProgress(batch.startDate, batch.duration)
          const badge = getBadge(prog)
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
                  <View style={styles.batchTopLeft}>
                    <Text style={styles.batchName}>{batch.batchName}</Text>
                    <Text style={styles.batchSub}>{subtitle}</Text>
                  </View>
                  <LinearGradient
                    colors={accent}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.batchBadge}
                  >
                    <Text style={styles.batchBadgeText}>{badge.text}</Text>
                  </LinearGradient>
                </View>

                <View style={styles.batchMetrics}>
                  <View style={styles.batchMetric}>
                    <Text style={styles.batchMetricVal}>{batch.quantity}</Text>
                    <Text style={styles.batchMetricLbl}>Bird Count</Text>
                  </View>
                  <View style={styles.batchMetricDivider} />
                  <View style={styles.batchMetric}>
                    <Text style={styles.batchMetricVal}>{feedEst}</Text>
                    <Text style={styles.batchMetricLbl}>Feed Used</Text>
                  </View>
                  <View style={styles.batchMetricDivider} />
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
                    style={[styles.batchAction, { backgroundColor: badge.bg, borderColor: '#DCFCE7' }]}
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

        <View style={{ height: 160 }} />
      </ScrollView>

      {/* FAB */}
      <Animated.View style={[styles.fabOverlay, fabOverlayStyle]} pointerEvents={fabOpen ? 'auto' : 'none'}>
        <TouchableOpacity style={styles.fabOverlayTouch} activeOpacity={1} onPress={() => setFabOpen(false)} />
      </Animated.View>

      <Animated.View style={[styles.fabMenu, fabMenuStyle]} pointerEvents={fabOpen ? 'auto' : 'none'}>
        {FAB_ACTIONS.map((action, i) => (
          <TouchableOpacity
            key={action.label}
            style={styles.fabMenuItem}
            activeOpacity={0.85}
            onPress={() => {
              setFabOpen(false)
              router.push(action.route)
            }}
          >
            <View style={styles.fabMenuIcon}>
              {action.icon('#2E7D32')}
            </View>
            <Text style={styles.fabMenuLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </Animated.View>

      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => setFabOpen(!fabOpen)}
      >
        <Animated.View style={fabIconStyle}>
          <Svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <Line x1="14" y1="8" x2="14" y2="20" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            <Line x1="8" y1="14" x2="20" y2="14" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          </Svg>
        </Animated.View>
      </TouchableOpacity>

      <BottomTabBar />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAF7' },

  glowBg: {
    position: 'absolute', top: -50, right: -50, width: 300, height: 300,
    borderRadius: 150, backgroundColor: 'rgba(232,245,233,0.25)', zIndex: 0,
  },
  contour1: {
    position: 'absolute', width: 350, height: 110, top: '4%', left: '-10%',
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

  scroll: { flex: 1, zIndex: 1 },
  scrollInner: { paddingHorizontal: 20, paddingTop: 6 },

  /* header */
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: 6 },
  headerLeft: { flex: 1 },
  headerLabel: { fontSize: 11, fontWeight: '600', color: '#2E7D32', letterSpacing: 2, textTransform: 'uppercase' },
  headerTitle: { fontFamily: 'Poppins', fontWeight: '800', fontSize: 30, color: '#1B1B1B', letterSpacing: -0.5, marginTop: 2 },
  headerSub: { fontSize: 14, fontWeight: '400', color: '#616161', marginTop: 4, lineHeight: 20 },
  filterBtn: {
    width: 48, height: 48, borderRadius: 18, backgroundColor: 'white',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 14, elevation: 3,
  },

  /* search */
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', height: 56,
    backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 20, paddingHorizontal: 18, gap: 12,
    marginTop: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 24, elevation: 3,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
  },
  searchIcon: { alignItems: 'center', justifyContent: 'center' },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '400', color: '#1B1B1B', padding: 0, margin: 0 },
  filterIcon: { alignItems: 'center', justifyContent: 'center' },

  /* filter pills */
  filterScroll: { marginTop: 16, paddingBottom: 4 },
  filterScrollInner: { gap: 10 },
  filterPill: {
    paddingVertical: 10, paddingHorizontal: 22, borderRadius: 100,
    backgroundColor: 'white', borderWidth: 1, borderColor: '#E2E8F0',
  },
  filterPillActive: {
    paddingVertical: 10, paddingHorizontal: 22, borderRadius: 100,
    shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 5,
  },
  filterPillText: { fontSize: 13, fontWeight: '500', color: '#64748B' },
  filterPillTextActive: { fontSize: 13, fontWeight: '600', color: 'white' },

  /* overview cards */
  overviewScroll: { marginTop: 20, paddingBottom: 4 },
  overviewScrollInner: { gap: 12 },
  overviewCard: {
    minWidth: 148, backgroundColor: 'white', borderRadius: 26, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 24, elevation: 3,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  ovIconWrap: { width: 42, height: 42, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  ovMetric: { fontSize: 26, fontWeight: '800', color: '#1F2937', marginTop: 12, letterSpacing: -0.3 },
  ovLabel: { fontSize: 13, fontWeight: '400', color: '#64748B', marginTop: 2 },

  /* section header */
  secHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, marginBottom: 16 },
  secTitle: { fontSize: 19, fontWeight: '700', color: '#1F2937' },
  secLink: { fontSize: 13, fontWeight: '500', color: '#2E7D32' },

  /* batch card */
  batchCard: {
    backgroundColor: 'white', borderRadius: 30, padding: 22,
    marginBottom: 16, position: 'relative', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.06, shadowRadius: 40, elevation: 5,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  batchAccent: { position: 'absolute', top: 0, left: 0, width: 5, height: '100%', borderTopLeftRadius: 30, borderBottomLeftRadius: 30 },
  batchDots: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.015, zIndex: 0,
  },
  batchTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 },
  batchTopLeft: { flex: 1 },
  batchName: { fontFamily: 'Poppins', fontWeight: '700', fontSize: 20, color: '#1F2937' },
  batchSub: { fontSize: 12, fontWeight: '400', color: '#94A3B8', marginTop: -1 },
  batchBadge: { paddingVertical: 5, paddingHorizontal: 14, borderRadius: 100, flexShrink: 0, marginLeft: 10 },
  batchBadgeText: { fontSize: 11, fontWeight: '600', color: 'white' },

  /* batch metrics */
  batchMetrics: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8FAF7', borderRadius: 18, paddingVertical: 14, paddingHorizontal: 8,
    marginTop: 16, zIndex: 1,
  },
  batchMetric: { flex: 1, alignItems: 'center' },
  batchMetricDivider: { width: 1, height: 28, backgroundColor: '#E2E8F0' },
  batchMetricVal: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  batchMetricLbl: { fontSize: 11, fontWeight: '400', color: '#94A3B8', marginTop: 1 },

  /* batch progress */
  batchProgress: { marginTop: 16, zIndex: 1 },
  batchProgHead: { flexDirection: 'row', justifyContent: 'space-between' },
  batchProgLabel: { fontSize: 12, color: '#64748B' },
  batchProgPct: { fontSize: 12, fontWeight: '600', color: '#1F2937' },
  batchProgTrack: {
    width: '100%', height: 8, backgroundColor: '#F1F5F9', borderRadius: 100, marginTop: 6, overflow: 'hidden',
  },
  batchProgFill: { height: '100%', borderRadius: 100, backgroundColor: '#2E7D32' },

  /* batch actions */
  batchActions: { flexDirection: 'row', gap: 10, marginTop: 16, zIndex: 1 },
  batchAction: {
    paddingVertical: 9, paddingHorizontal: 18, borderRadius: 100,
    backgroundColor: '#F8FAF7', borderWidth: 1, borderColor: '#E2E8F0',
  },
  batchActionText: { fontSize: 12, fontWeight: '500', color: '#1F2937' },

  /* empty state */
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  emptyIconCircle: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: '#F0FDF4',
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#1F2937' },
  emptySub: { fontSize: 14, color: '#94A3B8', textAlign: 'center', maxWidth: 300, lineHeight: 22, marginTop: 4 },
  emptyText: { fontSize: 15, fontWeight: '500', color: '#A0AEA1' },
  emptyCta: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20,
    backgroundColor: '#2E7D32', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 100,
    shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 24, elevation: 6,
  },
  emptyCtaText: { fontSize: 15, fontWeight: '600', color: 'white' },

  /* fab */
  fabOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50,
  },
  fabOverlayTouch: { flex: 1 },
  fabMenu: {
    position: 'absolute', bottom: 180, right: 20, zIndex: 60, gap: 8,
  },
  fabMenuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'white', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 24, elevation: 6,
    minWidth: 180,
  },
  fabMenuIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center' },
  fabMenuLabel: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  fab: {
    position: 'absolute', bottom: 100, right: 20, zIndex: 55,
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#2E7D32',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 30, elevation: 10,
  },
})
