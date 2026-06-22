import React, { useEffect, useState } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Dimensions,
} from 'react-native'
import GoonaIcon from '../../../components/ui/GoonaIcon'
import { Icons } from '../../../shared/icons'
import Animated, {
  useSharedValue, useAnimatedStyle, withDelay, withTiming,
  withSpring, Easing, FadeInUp,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import BottomDock from '../../../components/navigation/BottomDock'

const { width: SCREEN_W } = Dimensions.get('window')
const CARD_HORIZ_W = 148

function useStaggerEntry(index: number, baseDelay = 100) {
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(20)
  useEffect(() => {
    const delay = baseDelay + index * 70
    opacity.value = withDelay(delay, withTiming(1, { duration: 450, easing: Easing.out(Easing.cubic) }))
    translateY.value = withDelay(delay, withSpring(0, { damping: 17, stiffness: 130 }))
  }, [])
  return useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: translateY.value }] }))
}

function usePressScale() {
  const scale = useSharedValue(1)
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
  return {
    style,
    onPressIn: () => { scale.value = withSpring(0.97, { damping: 15, stiffness: 200 }) },
    onPressOut: () => { scale.value = withSpring(1, { damping: 15, stiffness: 200 }) },
  }
}

const ANALYTICS_DATA = [
  {
    label: 'Feed Logs',
    value: '1,250 kg',
    trend: '+12%',
    trendUp: true,
    barColor: '#16A34A',
    bars: [35, 50, 60, 45, 75],
    bg: '#F0FDF4',
    iconColor: '#16A34A',
  },
  {
    label: 'Mortality Reports',
    value: '1.8%',
    trend: '-0.4%',
    trendUp: true,
    barColor: '#EF4444',
    bars: [70, 55, 45, 35, 28],
    bg: '#FFF1F2',
    iconColor: '#EF4444',
  },
  {
    label: 'Weight Records',
    value: '1.84 kg',
    trend: '+6%',
    trendUp: true,
    barColor: '#7C3AED',
    bars: [30, 40, 50, 60, 75],
    bg: '#F3E8FF',
    iconColor: '#7C3AED',
  },
  {
    label: 'Financial Records',
    value: '₦480k',
    trend: '+8%',
    trendUp: true,
    barColor: '#1A56FF',
    bars: [40, 55, 45, 65, 70],
    bg: '#EEF3FF',
    iconColor: '#1A56FF',
  },
]

const ECOSYSTEM_LINKS = [
  {
    id: 'daily-ops',
    icon: '\u{1F4CB}',
    label: 'Daily Operations',
    desc: 'Feed, mortality, medication, water, egg logs',
    route: '/daily-records',
    color: '#16A34A',
    bg: '#F0FDF4',
  },
  {
    id: 'batch-mgmt',
    icon: '\u{1F4E6}',
    label: 'Batch Management',
    desc: 'Active batches, history, performance analytics',
    route: '/records/batch-management',
    color: '#1A56FF',
    bg: '#EEF3FF',
  },
  {
    id: 'sales',
    icon: '\u{1F4B0}',
    label: 'Sales & Revenue',
    desc: 'Revenue tracking, expenses, outstanding balances',
    route: '/records/sales-revenue',
    color: '#F59E0B',
    bg: '#FFFBEB',
  },
  {
    id: 'analytics',
    icon: '\u{1F4CA}',
    label: 'Operational Analytics',
    desc: 'Charts, trends, insights, historical comparisons',
    route: '/records/analytics',
    color: '#0F766E',
    bg: '#DDF5F0',
  },
]

function SummaryCard({
  item,
  index,
}: {
  item: (typeof ANALYTICS_DATA)[0]
  index: number
}) {
  const animStyle = useStaggerEntry(index)
  const { style: pressStyle, onPressIn, onPressOut } = usePressScale()
  return (
    <Animated.View style={[animStyle, pressStyle]} onTouchStart={onPressIn} onTouchEnd={onPressOut}>
      <View style={styles.summaryCard}>
        <View style={styles.summaryTop}>
          <View style={[styles.summaryIconWrap, { backgroundColor: item.bg }]}>
            <GoonaIcon icon={Icons.fileText} size={18} color={item.iconColor} />
          </View>
          <Text style={[styles.summaryTrend, { color: item.trendUp ? '#16A34A' : '#EF4444' }]}>{item.trend}</Text>
        </View>
        <Text style={styles.summaryValue}>{item.value}</Text>
        <Text style={styles.summaryLabel}>{item.label}</Text>
        <View style={styles.summaryChart}>
          {item.bars.map((h, j) => (
            <View
              key={j}
              style={[
                styles.summaryBar,
                {
                  height: `${h}%` as any,
                  backgroundColor: j === item.bars.length - 1 ? item.barColor : '#E2E8E0',
                },
              ]}
            />
          ))}
        </View>
      </View>
    </Animated.View>
  )
}

function EcosystemCard({ item, index }: { item: (typeof ECOSYSTEM_LINKS)[0]; index: number }) {
  const animStyle = useStaggerEntry(index, 300)
  const { style: pressStyle, onPressIn, onPressOut } = usePressScale()
  return (
    <Animated.View style={[animStyle, pressStyle]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => router.push(item.route as any)}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={styles.ecosystemCard}
      >
        <View style={[styles.ecosystemIcon, { backgroundColor: item.bg }]}>
          <Text style={styles.ecosystemEmoji}>{item.icon}</Text>
        </View>
        <View style={styles.ecosystemInfo}>
          <Text style={styles.ecosystemLabel}>{item.label}</Text>
          <Text style={styles.ecosystemDesc}>{item.desc}</Text>
        </View>
        <GoonaIcon icon={Icons.chevronRight} size={16} color="#94A3B8" />
      </TouchableOpacity>
    </Animated.View>
  )
}

export default function RecordsDashboardScreen() {
  const insets = useSafeAreaInsets()
  const [headerH, setHeaderH] = useState(0)
  const TOP = insets.top

  return (
    <View style={styles.container}>
      <View
        onLayout={(e) => { if (headerH === 0) setHeaderH(e.nativeEvent.layout.height) }}
        style={[styles.headerBlock, { paddingTop: TOP + 8 }]}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Records</Text>
            <Text style={styles.headerSub}>Farm analytics & management</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollInner,
          { paddingTop: headerH ? headerH + 12 : TOP + 100, paddingBottom: 160 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Analytics Cards */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.analyticsScroll}
          contentContainerStyle={styles.analyticsScrollInner}
        >
          {ANALYTICS_DATA.map((item, i) => (
            <SummaryCard key={item.label} item={item} index={i} />
          ))}
        </ScrollView>

        {/* Records Ecosystem */}
        <Animated.View entering={FadeInUp.duration(500).delay(100).springify()} style={styles.ecosystemSection}>
          <View style={styles.ecosystemHeader}>
            <Text style={styles.ecosystemTitle}>Records Ecosystem</Text>
            <Text style={styles.ecosystemSub}>Quick access to every operational records module</Text>
          </View>
          {ECOSYSTEM_LINKS.map((item, i) => (
            <EcosystemCard key={item.id} item={item} index={i} />
          ))}
        </Animated.View>
      </ScrollView>

      <BottomDock />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAF7' },

  /* HEADER */
  headerBlock: { paddingHorizontal: 20, paddingBottom: 12, backgroundColor: '#F8FAF7' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#1B1B1B' },
  headerSub: { fontSize: 13, color: '#A0AEA1', marginTop: 1 },

  /* SCROLL */
  scroll: { flex: 1 },
  scrollInner: { paddingHorizontal: 20 },

  /* ANALYTICS */
  analyticsScroll: { marginBottom: 24, zIndex: 5 },
  analyticsScrollInner: { paddingRight: 0, paddingVertical: 4, gap: 12 },
  summaryCard: {
    width: CARD_HORIZ_W, backgroundColor: 'white', borderRadius: 24, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05, shadowRadius: 20, elevation: 2,
  },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  summaryIconWrap: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  summaryTrend: { fontSize: 11, fontWeight: '700' },
  summaryValue: { fontSize: 20, fontWeight: '800', color: '#1F2937', marginTop: 8 },
  summaryLabel: { fontSize: 11, color: '#64748B', marginTop: 1 },
  summaryChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 24, marginTop: 8 },
  summaryBar: { width: 5, borderRadius: 2 },

  /* ECOSYSTEM HUB */
  ecosystemSection: { marginBottom: 20 },
  ecosystemHeader: { marginBottom: 12 },
  ecosystemTitle: { fontSize: 18, fontWeight: '700', color: '#1B1B1B' },
  ecosystemSub: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  ecosystemCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: 'white', borderRadius: 20, padding: 14,
    marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 14, elevation: 2,
  },
  ecosystemIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  ecosystemEmoji: { fontSize: 18 },
  ecosystemInfo: { flex: 1 },
  ecosystemLabel: { fontSize: 14, fontWeight: '700', color: '#1B1B1B' },
  ecosystemDesc: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
})
