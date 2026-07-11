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
import { router, useLocalSearchParams } from 'expo-router'
import {
  useHistoryStore, rangeForPreset, isMoneyType,
  type RecordType, type DatePreset, type HistoryRecord,
} from '../../../../store/useHistoryStore'
import BottomDock from '../../../../components/navigation/BottomDock'

const { width: SCREEN_W } = Dimensions.get('window')

const CATEGORY_META: Record<string, { label: string; icon: string; color: string; bg: string; unit: string; isMoney: boolean }> = {
  feed: { label: 'Feed Records', icon: '\u{1F4E6}', color: '#16A34A', bg: '#F0FDF4', unit: 'kg', isMoney: false },
  eggs: { label: 'Egg Records', icon: '\u{1F95A}', color: '#F59E0B', bg: '#FFFBEB', unit: 'eggs', isMoney: false },
  water: { label: 'Water Records', icon: '\u{1F4A7}', color: '#0EA5E9', bg: '#E0F2FE', unit: 'L', isMoney: false },
  medication: { label: 'Medication Records', icon: '\u{1F48A}', color: '#7C3AED', bg: '#F3E8FF', unit: 'vials', isMoney: true },
  mortality: { label: 'Mortality Records', icon: '\u{1F480}', color: '#EF4444', bg: '#FFF1F2', unit: 'birds', isMoney: false },
  sale: { label: 'Sales Records', icon: '\u{1F4B0}', color: '#F59E0B', bg: '#FFFBEB', unit: 'units', isMoney: true },
  expense: { label: 'Expense Records', icon: '\u{1F4B5}', color: '#DC2626', bg: '#FEF2F2', unit: 'units', isMoney: true },
  observation: { label: 'Observations', icon: '\u{1F4DD}', color: '#0F766E', bg: '#DDF5F0', unit: '', isMoney: false },
  inventory: { label: 'Inventory/Stock Records', icon: '\u{1F4E6}', color: '#0F766E', bg: '#DDF5F0', unit: 'kg', isMoney: true },
}

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

function TrendChart({ data, color }: { data: { period: string; total: number }[]; color: string }) {
  const max = Math.max(...data.map((d) => d.total), 1)
  return (
    <View style={styles.trendChart}>
      {data.map((d, i) => {
        const h = (d.total / max) * 100
        return (
          <View key={d.period} style={styles.trendBarCol}>
            <View style={[styles.trendBar, { height: `${Math.max(h, 4)}%` as any, backgroundColor: color }]} />
            <Text style={styles.trendBarLabel}>{d.period.slice(-2)}</Text>
          </View>
        )
      })}
    </View>
  )
}

function formatValue(record: HistoryRecord, meta: typeof CATEGORY_META[string]): string {
  if (record.type === 'inventory') {
    const parts: string[] = []
    if (record.quantity != null) parts.push(`${record.quantity.toLocaleString()} ${record.unit ?? 'kg'}`)
    if (record.cost != null) parts.push(`\u20A6${record.cost.toLocaleString()}`)
    return parts.join(' · ')
  }
  if (record.cost != null) return `\u20A6${record.cost.toLocaleString()}`
  if (record.quantity != null) return `${record.quantity.toLocaleString()} ${record.unit ?? ''}`
  return ''
}

function RecordRow({ record }: { record: HistoryRecord }) {
  const catRecord = CATEGORY_META[record.type]
  const meta = catRecord ?? { label: 'Records', icon: '\u{1F4CB}', color: '#16A34A', bg: '#F0FDF4', unit: '', isMoney: false }
  const date = new Date(record.timestamp).toLocaleDateString('en-NG', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
  const valueStr = formatValue(record, meta)
  const extraLine = record.type === 'inventory' && record.supplier ? record.supplier : undefined

  return (
    <View style={styles.recordRow}>
      <View style={styles.recordLeft}>
        <Text style={styles.recordDate}>{date}</Text>
        <Text style={styles.recordBatch}>{record.batch}</Text>
        {record.notes ? <Text style={styles.recordNotes}>{record.notes}</Text> : null}
        {extraLine ? <Text style={styles.recordNotes}>{extraLine}</Text> : null}
      </View>
      <Text style={[styles.recordValue, { color: meta.color, fontSize: record.type === 'inventory' ? 11 : 15 }]}>{valueStr}</Text>
    </View>
  )
}

function formatSummary(meta: typeof CATEGORY_META[string], metric: { total: number; count: number; avg: number }) {
  if (metric.count === 0) return { total: 'No data', entries: '', avg: '' }

  let totalStr: string
  if (meta.isMoney) {
    totalStr = `\u20A6${metric.total.toLocaleString()}`
  } else {
    totalStr = `${metric.total.toLocaleString()} ${meta.unit}`
  }

  const entriesStr = `${metric.count} ${metric.count === 1 ? 'entry' : 'entries'}`

  let avgStr: string
  if (meta.isMoney) {
    avgStr = `Avg \u20A6${Math.round(metric.avg).toLocaleString()} / entry`
  } else {
    avgStr = `Avg ${Math.round(metric.avg).toLocaleString()} ${meta.unit} / entry`
  }

  return { total: totalStr, entries: entriesStr, avg: avgStr }
}

export default function CategoryHistoryScreen() {
  const { category } = useLocalSearchParams<{ category: string }>()
  const insets = useSafeAreaInsets()
  const [selectedPreset, setSelectedPreset] = useState<DatePreset>('this-month')
  const range = React.useMemo(() => rangeForPreset(selectedPreset), [selectedPreset])
  const getRecords = useHistoryStore((s) => s.getRecords)
  const getMetric = useHistoryStore((s) => s.getMetric)
  const getAggregation = useHistoryStore((s) => s.getAggregation)

  const meta = CATEGORY_META[category] ?? { label: 'Records', icon: '\u{1F4CB}', color: '#16A34A', bg: '#F0FDF4', unit: '', isMoney: false }

  const records = useMemo(
    () => getRecords({ type: category as RecordType, range }),
    [category, selectedPreset],
  )
  const metric = useMemo(
    () => getMetric({ type: category as RecordType, range }),
    [category, selectedPreset],
  )
  const aggregation = useMemo(
    () => getAggregation({ type: category as RecordType, range, granularity: 'month' }),
    [category, selectedPreset],
  )

  const summary = useMemo(() => formatSummary(meta, metric), [meta, metric])

  return (
    <View style={styles.container}>
      <View style={[styles.headerBlock, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <GoonaIcon icon={Icons.chevronLeft} size={20} color="#1B1B1B" />
          </TouchableOpacity>
          <View style={styles.headerTitles}>
            <Text style={styles.headerTitle}>{meta.label}</Text>
            <Text style={styles.headerSub}>{meta.icon} {records.length} records found</Text>
          </View>
        </View>
        {/* Date Presets directly under header */}
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
        {/* Summary Header */}
        {metric.count > 0 && (
          <Animated.View entering={FadeInUp.duration(400).springify()} style={[styles.summaryCard, { backgroundColor: meta.bg }]}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatLabel}>Total</Text>
                <Text style={styles.summaryStatValue}>{summary.total}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatLabel}>Entries</Text>
                <Text style={styles.summaryStatValue}>{summary.entries}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatLabel}>Average</Text>
                <Text style={styles.summaryStatValue}>{summary.avg}</Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Trend Chart */}
        {aggregation.length > 1 && (
          <Animated.View entering={FadeInUp.duration(400).delay(200).springify()} style={styles.chartCard}>
            <Text style={styles.chartTitle}>Monthly Trend</Text>
            <TrendChart data={aggregation} color={meta.color} />
          </Animated.View>
        )}

        {/* Records List */}
        <View style={styles.listSection}>
          <Text style={styles.listTitle}>
            All Entries
            {records.length > 0 && ` (${records.length})`}
          </Text>
          {records.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>{meta.icon}</Text>
              <Text style={styles.emptyText}>No records found for this period</Text>
            </View>
          ) : (
            records.map((record, i) => {
              const animStyle = useStaggerEntry(i)
              return (
                <Animated.View key={record.id} style={animStyle}>
                  <RecordRow record={record} />
                </Animated.View>
              )
            })
          )}
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
  scroll: { flex: 1 },
  scrollInner: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 160 },
  presetScroll: { marginBottom: 8, zIndex: 5 },
  presetScrollInner: { gap: 8, paddingVertical: 4 },
  presetChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F1F5F1' },
  presetChipActive: { backgroundColor: '#16A34A' },
  presetLabel: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  presetLabelActive: { color: 'white' },
  summaryCard: {
    borderRadius: 20, padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04, shadowRadius: 14, elevation: 2,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryStat: { alignItems: 'center', flex: 1 },
  summaryDivider: { width: 1, height: 32, backgroundColor: 'rgba(0,0,0,0.06)' },
  summaryStatLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase' },
  summaryStatValue: { fontSize: 13, fontWeight: '700', color: '#1F2937', marginTop: 2, textAlign: 'center' },
  chartCard: {
    backgroundColor: 'white', borderRadius: 20, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04, shadowRadius: 14, elevation: 2,
  },
  chartTitle: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  trendChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 100, marginTop: 8 },
  trendBarCol: { flex: 1, alignItems: 'center' },
  trendBar: { width: '100%', borderRadius: 4, minHeight: 4 },
  trendBarLabel: { fontSize: 9, color: '#94A3B8', marginTop: 4 },
  listSection: { marginTop: 4 },
  listTitle: { fontSize: 16, fontWeight: '700', color: '#1B1B1B', marginBottom: 12 },
  recordRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'white', borderRadius: 16, padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03, shadowRadius: 8, elevation: 1,
  },
  recordLeft: { flex: 1 },
  recordDate: { fontSize: 13, fontWeight: '600', color: '#1F2937' },
  recordBatch: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
  recordNotes: { fontSize: 11, color: '#64748B', marginTop: 2, fontStyle: 'italic' },
  recordValue: { fontSize: 15, fontWeight: '700', textAlign: 'right' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#94A3B8' },
})
