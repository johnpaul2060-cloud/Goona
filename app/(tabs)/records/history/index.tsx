import React, { useState, useMemo } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Dimensions,
} from 'react-native'
import GoonaIcon from '../../../../components/ui/GoonaIcon'
import { Icons } from '../../../../shared/icons'
import Animated, {
  useSharedValue, useAnimatedStyle, withDelay, withTiming,
  withSpring, Easing, FadeInUp,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useHistoryStore, rangeForPreset, isMoneyType, type RecordType, type DatePreset } from '../../../../store/useHistoryStore'
import BottomDock from '../../../../components/navigation/BottomDock'

const { width: SCREEN_W } = Dimensions.get('window')

const CATEGORIES: { type: RecordType; label: string; icon: string; color: string; bg: string; unitLabel: string }[] = [
  { type: 'sale', label: 'Sales Records', icon: '\u{1F4B0}', color: '#F59E0B', bg: '#FFFBEB', unitLabel: 'revenue' },
  { type: 'expense', label: 'Expenses Records', icon: '\u{1F4B5}', color: '#DC2626', bg: '#FEF2F2', unitLabel: 'spent' },
  { type: 'eggs', label: 'Egg Records', icon: '\u{1F95A}', color: '#F59E0B', bg: '#FFFBEB', unitLabel: 'eggs' },
  { type: 'feed', label: 'Feed Records', icon: '\u{1F4E6}', color: '#16A34A', bg: '#F0FDF4', unitLabel: 'kg' },
  { type: 'water', label: 'Water Records', icon: '\u{1F4A7}', color: '#0EA5E9', bg: '#E0F2FE', unitLabel: 'L' },
  { type: 'mortality', label: 'Mortality Records', icon: '\u{1F480}', color: '#EF4444', bg: '#FFF1F2', unitLabel: 'birds' },
  { type: 'medication', label: 'Medication Records', icon: '\u{1F48A}', color: '#7C3AED', bg: '#F3E8FF', unitLabel: 'vials' },
  { type: 'inventory', label: 'Inventory/Stock Records', icon: '\u{1F4E6}', color: '#0F766E', bg: '#DDF5F0', unitLabel: 'stock' },
]

const PRESETS: { key: DatePreset; label: string }[] = [
  { key: 'this-week', label: 'This Week' },
  { key: 'this-month', label: 'This Month' },
  { key: 'last-month', label: 'Last Month' },
  { key: 'this-quarter', label: 'This Quarter' },
  { key: 'this-year', label: 'This Year' },
  { key: 'last-year', label: 'Last Year' },
]

function useStaggerEntry(index: number, baseDelay = 100) {
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(20)
  React.useEffect(() => {
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

function formatMetric(cat: typeof CATEGORIES[0], metric: { total: number; isMoney: boolean; count: number }) {
  if (metric.count === 0) return 'No records'
  if (cat.type === 'inventory') {
    return `${metric.total.toLocaleString()} kg`
  }
  if (metric.isMoney) {
    return `\u20A6${metric.total.toLocaleString()}`
  }
  if (cat.type === 'eggs') {
    return `${metric.total.toLocaleString()} eggs`
  }
  const unitLabel = cat.unitLabel
  return `${metric.total.toLocaleString()} ${unitLabel}`
}

function handleExport() {
  const range = rangeForPreset('this-year')
  const csv = useHistoryStore.getState().exportCSV({ range })
  const share = async () => {
    const { shareAsync } = await import('expo-file-system')
    const { writeAsStringAsync, documentDirectory } = await import('expo-file-system')
    const path = `${documentDirectory}goona_farm_history_${Date.now()}.csv`
    await writeAsStringAsync(path, csv, { encoding: 'utf8' })
    await shareAsync(path, { mimeType: 'text/csv' })
  }
  share()
}

export default function FarmHistoryHomeScreen() {
  const insets = useSafeAreaInsets()
  const [selectedPreset, setSelectedPreset] = useState<DatePreset>('this-month')
  const range = useMemo(() => rangeForPreset(selectedPreset), [selectedPreset])
  const getMetric = useHistoryStore((s) => s.getMetric)

  const categoryMetrics = useMemo(() => {
    return CATEGORIES.map((cat) => {
      const metric = getMetric({ type: cat.type, range })
      return { ...cat, metric }
    })
  }, [selectedPreset])

  return (
    <View style={styles.container}>
      <View style={[styles.headerBlock, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <GoonaIcon icon={Icons.chevronLeft} size={20} color="#1B1B1B" />
          </TouchableOpacity>
          <View style={styles.headerTitles}>
            <Text style={styles.headerTitle}>Farm History</Text>
            <Text style={styles.headerSub}>Browse past records & trends</Text>
          </View>
          <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
            <GoonaIcon icon={Icons.download} size={18} color="#16A34A" />
          </TouchableOpacity>
        </View>
        {/* Date Presets — directly under header, no gap */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.presetScroll}
          contentContainerStyle={styles.presetScrollInner}
        >
          {PRESETS.map((p) => {
            const active = selectedPreset === p.key
            return (
              <TouchableOpacity
                key={p.key}
                activeOpacity={0.7}
                onPress={() => setSelectedPreset(p.key)}
                style={[styles.presetChip, active && styles.presetChipActive]}
              >
                <Text style={[styles.presetLabel, active && styles.presetLabelActive]}>{p.label}</Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollInner}
        showsVerticalScrollIndicator={false}
      >
        {/* Category Grid */}
        <View style={styles.grid}>
          {categoryMetrics.map((cat, i) => {
            const animStyle = useStaggerEntry(i)
            const { style: pressStyle, onPressIn, onPressOut } = usePressScale()
            return (
              <Animated.View key={cat.type} style={[animStyle, pressStyle]}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => router.push(`/records/history/${cat.type}`)}
                  onPressIn={onPressIn}
                  onPressOut={onPressOut}
                  style={[styles.categoryCard, { backgroundColor: cat.bg }]}
                >
                  <View style={styles.categoryTop}>
                    <Text style={styles.categoryEmoji}>{cat.icon}</Text>
                    <GoonaIcon icon={Icons.chevronRight} size={14} color={cat.color} />
                  </View>
                  <Text style={[styles.categoryLabel, { color: cat.color }]}>{cat.label}</Text>
                  <Text style={styles.categoryTotal}>
                    {formatMetric(cat, cat.metric)}
                  </Text>
                  <Text style={styles.categoryCount}>
                    {cat.metric.count} {cat.metric.count === 1 ? 'entry' : 'entries'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            )
          })}
        </View>
      </ScrollView>

      <BottomDock />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAF7' },
  headerBlock: { paddingHorizontal: 20, paddingBottom: 0, backgroundColor: '#F8FAF7' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#F1F5F1', alignItems: 'center', justifyContent: 'center' },
  headerTitles: { flex: 1 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1B1B1B' },
  headerSub: { fontSize: 12, color: '#A0AEA1', marginTop: 1 },
  exportBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollInner: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 160 },
  presetScroll: { marginBottom: 8, zIndex: 5 },
  presetScrollInner: { gap: 8, paddingVertical: 4 },
  presetChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#F1F5F1',
  },
  presetChipActive: { backgroundColor: '#16A34A' },
  presetLabel: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  presetLabelActive: { color: 'white' },
  grid: { gap: 12 },
  categoryCard: {
    borderRadius: 20, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04, shadowRadius: 14, elevation: 2,
  },
  categoryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  categoryEmoji: { fontSize: 24 },
  categoryLabel: { fontSize: 15, fontWeight: '700', marginTop: 8 },
  categoryTotal: { fontSize: 20, fontWeight: '800', color: '#1F2937', marginTop: 4 },
  categoryCount: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
})
