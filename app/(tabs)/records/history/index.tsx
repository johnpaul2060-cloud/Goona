import React, { useState, useMemo, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Alert, Platform, Share, LayoutAnimation,
} from 'react-native'
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'
import GoonaIcon from '../../../../components/ui/GoonaIcon'
import { Icons } from '../../../../shared/icons'
import Animated, {
  useSharedValue, useAnimatedStyle, withDelay, withTiming,
  withSpring, Easing, FadeInUp,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import {
  useHistoryStore, rangeForPreset, isMoneyType,
  type RecordType, type DatePreset, type DateRange, type HistoryRecord, type AggregatedMetric,
} from '../../../../store/useHistoryStore'
import { useBatchStore, Batch } from '../../../../store/useBatchStore'
import { usePlanStore } from '../../../../store/usePlanStore'
import BottomDock from '../../../../components/navigation/BottomDock'

const RECORD_TYPES: { type: RecordType; label: string; icon: string; color: string; bg: string; unitLabel: string }[] = [
  { type: 'sale', label: 'Sales', icon: '\u{1F4B0}', color: '#F59E0B', bg: '#FFFBEB', unitLabel: 'revenue' },
  { type: 'expense', label: 'Expenses', icon: '\u{1F4B5}', color: '#DC2626', bg: '#FEF2F2', unitLabel: 'spent' },
  { type: 'eggs', label: 'Eggs', icon: '\u{1F95A}', color: '#F59E0B', bg: '#FFFBEB', unitLabel: 'eggs' },
  { type: 'feed', label: 'Feed', icon: '\u{1F4E6}', color: '#16A34A', bg: '#F0FDF4', unitLabel: 'kg' },
  { type: 'water', label: 'Water', icon: '\u{1F4A7}', color: '#0EA5E9', bg: '#E0F2FE', unitLabel: 'L' },
  { type: 'mortality', label: 'Mortality', icon: '\u{1F480}', color: '#EF4444', bg: '#FFF1F2', unitLabel: 'birds' },
  { type: 'medication', label: 'Medication', icon: '\u{1F48A}', color: '#7C3AED', bg: '#F3E8FF', unitLabel: 'vials' },
  { type: 'inventory', label: 'Inventory', icon: '\u{1F4E6}', color: '#0F766E', bg: '#DDF5F0', unitLabel: 'stock' },
]

const PRESETS: { key: DatePreset; label: string }[] = [
  { key: 'last-week', label: 'Last Week' },
  { key: 'this-week', label: 'This Week' },
  { key: 'this-month', label: 'This Month' },
  { key: 'last-month', label: 'Last Month' },
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

function startOfDay(ts: number): number {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function endOfDay(ts: number): number {
  const d = new Date(ts)
  d.setHours(23, 59, 59, 999)
  return d.getTime()
}

function formatDateLabel(d: Date): string {
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatShortDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0')
  const mon = String(d.getMonth() + 1).padStart(2, '0')
  const yr = String(d.getFullYear()).slice(-2)
  return `${day}.${mon}.${yr}`
}

function formatMetricValue(type: RecordType, metric: AggregatedMetric): string {
  if (metric.count === 0) return 'No records'
  if (isMoneyType(type)) return `\u20A6${metric.total.toLocaleString()}`
  if (type === 'eggs') return `${metric.total.toLocaleString()} eggs`
  if (type === 'inventory') return `${metric.total.toLocaleString()} kg`
  const meta = RECORD_TYPES.find((r) => r.type === type)
  return `${metric.total.toLocaleString()} ${meta?.unitLabel ?? ''}`
}

function formatEntryValue(record: HistoryRecord): string {
  if (record.type === 'inventory') {
    const parts: string[] = []
    if (record.quantity != null) parts.push(`${record.quantity.toLocaleString()} ${record.unit ?? 'kg'}`)
    if (record.cost != null) parts.push(`\u20A6${record.cost.toLocaleString()}`)
    return parts.join(' \u00B7 ')
  }
  if (record.cost != null) return `\u20A6${record.cost.toLocaleString()}`
  if (record.quantity != null) return `${record.quantity.toLocaleString()} ${record.unit ?? ''}`
  return ''
}

function EmptyState({ type, icon }: { type: string; icon: string }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyText}>No {type} records in this period</Text>
    </View>
  )
}

function RecordRow({ record, meta }: { record: HistoryRecord; meta: typeof RECORD_TYPES[0] }) {
  const date = new Date(record.timestamp).toLocaleDateString('en-NG', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
  const valueStr = formatEntryValue(record)
  const extraLine = record.type === 'inventory' && record.supplier ? record.supplier : undefined

  return (
    <View style={styles.recordRow}>
      <View style={styles.recordLeft}>
        <Text style={styles.recordDate}>{date}</Text>
        <Text style={styles.recordBatch}>{record.batch}</Text>
        {record.notes ? <Text style={styles.recordNotes}>{record.notes}</Text> : null}
        {extraLine ? <Text style={styles.recordNotes}>{extraLine}</Text> : null}
      </View>
      <Text style={[styles.recordValue, { color: meta.color }]}>{valueStr}</Text>
    </View>
  )
}

export default function FarmHistoryHomeScreen() {
  const insets = useSafeAreaInsets()
  const [selectedPreset, setSelectedPreset] = useState<DatePreset>('this-month')
  const [customStart, setCustomStart] = useState<Date | null>(null)
  const [customEnd, setCustomEnd] = useState<Date | null>(null)
  const [showStartPicker, setShowStartPicker] = useState(false)
  const [showEndPicker, setShowEndPicker] = useState(false)
  const [selectedTypes, setSelectedTypes] = useState<RecordType[]>([])

  const getRecords = useHistoryStore((s) => s.getRecords)
  const getMetric = useHistoryStore((s) => s.getMetric)
  const batches = useBatchStore((s) => s.batches)
  const restoreBatch = useBatchStore((s) => s.restoreBatch)

  const isCustom = selectedPreset === 'custom'

  const range = useMemo((): DateRange => {
    if (isCustom) {
      if (customStart && customEnd) {
        return {
          start: startOfDay(customStart.getTime()),
          end: endOfDay(customEnd.getTime()),
          preset: 'custom',
        }
      }
      return { start: 0, end: 0, preset: 'custom' }
    }
    return rangeForPreset(selectedPreset)
  }, [selectedPreset, customStart, customEnd])

  const [expandedTypes, setExpandedTypes] = useState<Set<RecordType>>(new Set())

  React.useEffect(() => {
    setExpandedTypes(new Set())
  }, [range])

  const toggleExpand = useCallback((type: RecordType, hasRecords: boolean) => {
    if (!hasRecords) return
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setExpandedTypes((prev) => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }, [])

  const activeTypes = useMemo(() => {
    if (selectedTypes.length === 0) return RECORD_TYPES.map((r) => r.type)
    return selectedTypes
  }, [selectedTypes])

  const typeResults = useMemo(() => {
    return activeTypes.map((type) => {
      const records = getRecords({ type, range })
      const metric = getMetric({ type, range })
      const meta = RECORD_TYPES.find((r) => r.type === type)!
      return { type, meta, records, metric }
    })
  }, [activeTypes, range])

  const completedBatches = useMemo(() => {
    return batches
      .filter((b) => b.status === 'completed')
      .sort((a, b) => new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime())
  }, [batches])

  const completedPlans = usePlanStore((s) => s.plans)
  const completedPlanList = useMemo(() => completedPlans.filter((p) => p.status === 'completed'), [completedPlans])

  const totalRecords = useMemo(() => {
    return typeResults.reduce((sum, r) => sum + r.records.length, 0)
  }, [typeResults])

  const handlePickPreset = useCallback((key: DatePreset) => {
    if (key === 'custom') {
      setSelectedPreset('custom')
    } else {
      setSelectedPreset(key)
      setCustomStart(null)
      setCustomEnd(null)
    }
  }, [])

  const handleStartDateChange = useCallback((_event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setShowStartPicker(false)
    if (date) {
      setCustomStart(date)
      if (customEnd && date > customEnd) {
        setCustomEnd(null)
      }
    }
  }, [customEnd])

  const handleEndDateChange = useCallback((_event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setShowEndPicker(false)
    if (date) {
      setCustomEnd(date)
    }
  }, [])

  const clearCustomRange = useCallback(() => {
    setCustomStart(null)
    setCustomEnd(null)
    setSelectedPreset('this-month')
  }, [])

  const toggleType = useCallback((type: RecordType) => {
    setSelectedTypes((prev) => {
      if (prev.includes(type)) {
        const next = prev.filter((t) => t !== type)
        return next
      }
      return [...prev, type]
    })
  }, [])

  const selectAllTypes = useCallback(() => {
    setSelectedTypes([])
  }, [])

  const formatDate = useCallback((iso: string): string => {
    const d = new Date(iso)
    return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
  }, [])

  const calcCycleLength = useCallback((start: string, end?: string): string => {
    const s = new Date(start).getTime()
    const e = end ? new Date(end).getTime() : Date.now()
    const days = Math.floor((e - s) / (24 * 60 * 60 * 1000))
    const w = Math.floor(days / 7)
    const d = days % 7
    return w > 0 ? `${w}wk ${d}d` : `${d} days`
  }, [])

  const handleRestore = useCallback((b: Batch) => {
    Alert.alert(
      'Restore to Active',
      `"${b.batchName}" will return to Active Batches with all its data preserved.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Restore', style: 'default', onPress: () => restoreBatch(b.id) },
      ]
    )
  }, [restoreBatch])

  const formatNaira = useCallback((amount?: number): string => {
    if (!amount) return '\u2014'
    return `\u20A6${amount.toLocaleString('en-NG')}`
  }, [])

  const handleExport = useCallback(async () => {
    const csv = useHistoryStore.getState().exportCSV({ range })
    try {
      const { writeAsStringAsync, documentDirectory } = await import('expo-file-system/legacy')
      const rangeStr = isCustom && customStart && customEnd
        ? `${formatShortDate(customStart)}-${formatShortDate(customEnd)}`
        : selectedPreset
      const typesStr = activeTypes.length === RECORD_TYPES.length ? 'all' : activeTypes.join('-')
      const path = `${documentDirectory}goona_farm_report_${rangeStr}_${typesStr}_${Date.now()}.csv`
      await writeAsStringAsync(path, csv, { encoding: 'utf8' })
      await Share.share({
        url: Platform.OS === 'ios' ? path : undefined,
        message: Platform.OS === 'ios' ? `Farm Report: ${rangeStr}` : csv,
        title: `Farm Report ${rangeStr}`,
      })
    } catch {
      Alert.alert('Export Error', 'Could not export the report.')
    }
  }, [range, isCustom, customStart, customEnd, activeTypes])

  const rangeLabel = useMemo(() => {
    if (isCustom && customStart && customEnd) {
      if (startOfDay(customStart.getTime()) === startOfDay(customEnd.getTime())) {
        return formatShortDate(customStart)
      }
      return `${formatShortDate(customStart)}\u2013${formatShortDate(customEnd)}`
    }
    const p = PRESETS.find((pr) => pr.key === selectedPreset)
    return p ? p.label : ''
  }, [isCustom, customStart, customEnd, selectedPreset])

  return (
    <View style={styles.container}>
      <View style={[styles.headerBlock, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <GoonaIcon icon={Icons.chevronLeft} size={20} color="#1B1B1B" />
          </TouchableOpacity>
          <View style={styles.headerTitles}>
            <Text style={styles.headerTitle}>Farm History</Text>
            <Text style={styles.headerSub}>
              {isCustom && !customStart
                ? 'Select From date above'
                : isCustom && !customEnd
                  ? 'Select To date above'
                  : isCustom && customStart && customEnd
                    ? `${rangeLabel} \u00B7 ${totalRecords} records`
                    : totalRecords > 0
                      ? `${totalRecords} records`
                      : 'Browse past records'}
            </Text>
          </View>
          <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
            <GoonaIcon icon={Icons.download} size={18} color="#16A34A" />
          </TouchableOpacity>
        </View>

        {/* Date Presets row */}
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
                onPress={() => handlePickPreset(p.key)}
                style={[styles.presetChip, active && styles.presetChipActive]}
              >
                <Text style={[styles.presetLabel, active && styles.presetLabelActive]}>{p.label}</Text>
              </TouchableOpacity>
            )
          })}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handlePickPreset('custom')}
            style={[styles.presetChip, isCustom && styles.presetChipActiveCustom]}
          >
            <GoonaIcon icon={Icons.calendar} size={14} color={isCustom ? 'white' : '#64748B'} />
            <Text style={[styles.presetLabel, isCustom && styles.presetLabelActive, { marginLeft: 4 }]}>
              {isCustom && customStart ? rangeLabel : 'Custom'}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Custom date range controls */}
        {isCustom && (
          <View style={styles.customDateRow}>
            <TouchableOpacity
              style={styles.customDateBtn}
              onPress={() => setShowStartPicker(true)}
            >
              <Text style={styles.customDateLabel}>From</Text>
              <Text style={styles.customDateValue}>
                {customStart ? formatDateLabel(customStart) : 'Pick date'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.customDateSep}>{'\u2192'}</Text>
            <TouchableOpacity
              style={styles.customDateBtn}
              onPress={() => setShowEndPicker(true)}
            >
              <Text style={styles.customDateLabel}>To</Text>
              <Text style={styles.customDateValue}>
                {customEnd ? formatDateLabel(customEnd) : 'Pick date'}
              </Text>
            </TouchableOpacity>
            {customStart && customEnd && (
              <TouchableOpacity style={styles.customDateClear} onPress={clearCustomRange}>
                <GoonaIcon icon={Icons.x} size={16} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Native date pickers */}
        {showStartPicker && (
          <View style={styles.datePickerWrap}>
            <DateTimePicker
              value={customStart || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              maximumDate={new Date()}
              onChange={handleStartDateChange}
              themeVariant="light"
            />
            {Platform.OS === 'ios' && (
              <TouchableOpacity style={styles.datePickerDone} onPress={() => setShowStartPicker(false)}>
                <Text style={styles.datePickerDoneText}>Done</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        {showEndPicker && customStart && (
          <View style={styles.datePickerWrap}>
            <DateTimePicker
              value={customEnd || customStart}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              minimumDate={customStart}
              maximumDate={new Date()}
              onChange={handleEndDateChange}
              themeVariant="light"
            />
            {Platform.OS === 'ios' && (
              <TouchableOpacity style={styles.datePickerDone} onPress={() => setShowEndPicker(false)}>
                <Text style={styles.datePickerDoneText}>Done</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Record Type Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.typeScroll}
          contentContainerStyle={styles.typeScrollInner}
        >
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={selectAllTypes}
            style={[styles.typeChip, selectedTypes.length === 0 && styles.typeChipActive]}
          >
            <Text style={[styles.typeChipLabel, selectedTypes.length === 0 && styles.typeChipLabelActive]}>All</Text>
          </TouchableOpacity>
          {RECORD_TYPES.map((rt) => {
            const active = selectedTypes.includes(rt.type)
            return (
              <TouchableOpacity
                key={rt.type}
                activeOpacity={0.7}
                onPress={() => toggleType(rt.type)}
                style={[styles.typeChip, active && { backgroundColor: rt.bg, borderColor: rt.color }]}
              >
                <Text style={styles.typeChipEmoji}>{rt.icon}</Text>
                <Text style={[styles.typeChipLabel, active && { color: rt.color }]}>{rt.label}</Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollInner, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* === RESULTS: grouped by type === */}
        {typeResults.length > 0 && (
          <Animated.View entering={FadeInUp.duration(400).springify()}>
            {/* Range header */}
            {totalRecords > 0 && (
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsHeaderTitle}>
                  {rangeLabel}
                  {isCustom && customStart && customEnd && startOfDay(customStart.getTime()) !== startOfDay(customEnd.getTime())
                    ? ` (${Math.round((endOfDay(customEnd.getTime()) - startOfDay(customStart.getTime())) / 86400000) + 1} days)`
                    : ''}
                </Text>
                <Text style={styles.resultsHeaderCount}>{totalRecords} record{totalRecords !== 1 ? 's' : ''}</Text>
              </View>
            )}

            {typeResults.map((result, i) => {
              const meta = RECORD_TYPES.find((r) => r.type === result.type)!
              const summaryStr = formatMetricValue(result.type, result.metric)
              const avgStr = result.metric.count > 0
                ? isMoneyType(result.type)
                  ? `Avg \u20A6${Math.round(result.metric.avg).toLocaleString()}`
                  : `Avg ${Math.round(result.metric.avg).toLocaleString()} ${meta.unitLabel}`
                : ''
              const isExpanded = expandedTypes.has(result.type)
              return (
                <Animated.View key={result.type} entering={FadeInUp.duration(400).delay(80 + i * 60).springify()}>
                  {/* Type header card with summary — tappable to expand/collapse */}
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => toggleExpand(result.type, result.records.length > 0)}
                    style={[styles.typeResultCard, { borderLeftColor: meta.color }]}
                  >
                    <View style={styles.typeResultTop}>
                      <View style={styles.typeResultTopLeft}>
                        <Text style={styles.typeResultEmoji}>{meta.icon}</Text>
                        <View>
                          <Text style={styles.typeResultName}>{meta.label}</Text>
                          <Text style={styles.typeResultCount}>
                            {result.records.length === 0 ? 'No records' : `${result.metric.count} ${result.metric.count === 1 ? 'entry' : 'entries'}`}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.typeResultRight}>
                        <Text style={[styles.typeResultTotal, { color: meta.color }]}>{summaryStr}</Text>
                        {result.records.length > 0 && (
                          <View style={[styles.typeChevron, isExpanded && styles.typeChevronOpen]}>
                            <GoonaIcon icon={Icons.chevronRight} size={16} color="#94A3B8" />
                          </View>
                        )}
                      </View>
                    </View>
                    {avgStr ? (
                      <Text style={styles.typeResultAvg}>{avgStr} / entry</Text>
                    ) : null}
                  </TouchableOpacity>

                  {/* Entries list — shown only when expanded */}
                  {isExpanded && result.records.length > 0 && (
                    <>
                      {result.records.slice(0, 10).map((record) => (
                        <View key={record.id} style={styles.recordRow}>
                          <View style={styles.recordLeft}>
                            <Text style={styles.recordDate}>
                              {new Date(record.timestamp).toLocaleDateString('en-NG', {
                                day: 'numeric', month: 'short',
                              })}
                            </Text>
                            <Text style={styles.recordBatch}>{record.batch}</Text>
                            {record.notes ? <Text style={styles.recordNotes}>{record.notes}</Text> : null}
                          </View>
                          <Text style={[styles.recordValue, { color: meta.color }]}>
                            {formatEntryValue(record)}
                          </Text>
                        </View>
                      ))}

                      {result.records.length > 10 && (
                        <TouchableOpacity
                          style={styles.viewAllBtn}
                          onPress={() => router.push(`/records/history/${result.type}`)}
                        >
                          <Text style={styles.viewAllText}>View all {result.metric.count} {meta.label.toLowerCase()} records</Text>
                          <GoonaIcon icon={Icons.chevronRight} size={14} color="#17663A" />
                        </TouchableOpacity>
                      )}
                    </>
                  )}
                </Animated.View>
              )
            })}
          </Animated.View>
        )}

        {/* === COMPLETED BATCHES === */}
        {completedBatches.length > 0 && (
          <Animated.View entering={FadeInUp.duration(400).delay(200).springify()} style={styles.completedSection}>
            <View style={styles.completedSectionHead}>
              <View style={styles.completedSectionHeadLeft}>
                <GoonaIcon icon={Icons.clipboardCheck} size={18} color="#2E7D32" />
                <Text style={styles.completedSectionTitle}>Completed Batches</Text>
              </View>
              <View style={styles.completedCountBadge}>
                <Text style={styles.completedCountText}>{completedBatches.length}</Text>
              </View>
            </View>
            {completedBatches.map((b) => (
              <View key={b.id} style={styles.completedCard}>
                <TouchableOpacity
                  style={styles.completedCardBody}
                  activeOpacity={0.9}
                  onPress={() => router.push({ pathname: '/batch-details/[id]', params: { id: b.id } } as any)}
                >
                  <View style={styles.completedCardTop}>
                    <Text style={styles.completedCardName}>{b.batchName}</Text>
                    <View style={styles.completedCardBadge}>
                      <Text style={styles.completedCardBadgeText}>{b.livestockType}</Text>
                    </View>
                  </View>
                  <View style={styles.completedCardMeta}>
                    <View style={styles.completedMetaItem}>
                      <Text style={styles.completedMetaVal}>{b.harvestSummary?.finalCount || b.quantity}</Text>
                      <Text style={styles.completedMetaLbl}>Final Count</Text>
                    </View>
                    <View style={styles.completedMetaDivider} />
                    <View style={styles.completedMetaItem}>
                      <Text style={styles.completedMetaVal}>{calcCycleLength(b.startDate, b.completedAt)}</Text>
                      <Text style={styles.completedMetaLbl}>Cycle Length</Text>
                    </View>
                    <View style={styles.completedMetaDivider} />
                    <View style={styles.completedMetaItem}>
                      <Text style={styles.completedMetaVal}>{formatNaira(b.harvestSummary?.totalRevenue)}</Text>
                      <Text style={styles.completedMetaLbl}>Revenue</Text>
                    </View>
                  </View>
                  <Text style={styles.completedDate}>
                    Completed {b.completedAt ? formatDate(b.completedAt) : ''}
                  </Text>
                  {b.harvestSummary?.notes && (
                    <Text style={styles.completedNotes} numberOfLines={2}>{b.harvestSummary.notes}</Text>
                  )}
                </TouchableOpacity>
                <View style={styles.completedCardDivider} />
                <TouchableOpacity
                  style={styles.restoreRow}
                  activeOpacity={0.7}
                  onPress={() => handleRestore(b)}
                >
                  <GoonaIcon icon={Icons.refreshCw} size={16} color="#2E7D32" />
                  <Text style={styles.restoreRowText}>Restore to Active</Text>
                </TouchableOpacity>
              </View>
            ))}
          </Animated.View>
        )}

        {/* === COMPLETED PLANS === */}
        {completedPlanList.length > 0 && (
          <Animated.View entering={FadeInUp.duration(400).delay(250).springify()} style={styles.completedSection}>
            <View style={styles.completedSectionHead}>
              <View style={styles.completedSectionHeadLeft}>
                <GoonaIcon icon={Icons.target} size={18} color="#2E7D32" />
                <Text style={styles.completedSectionTitle}>Completed Plans</Text>
              </View>
              <View style={styles.completedCountBadge}>
                <Text style={styles.completedCountText}>{completedPlanList.length}</Text>
              </View>
            </View>
            {completedPlanList.map((p) => (
              <View key={p.id} style={styles.completedCard}>
                <View style={styles.completedCardBody}>
                  <View style={styles.completedCardTop}>
                    <Text style={styles.completedCardName}>{p.name}</Text>
                    <View style={styles.completedCardBadge}>
                      <Text style={styles.completedCardBadgeText}>{p.schedule}</Text>
                    </View>
                  </View>
                  <View style={styles.completedCardMeta}>
                    <View style={styles.completedMetaItem}>
                      <Text style={styles.completedMetaVal}>{formatNaira(p.completionSummary?.totalContributed ?? p.saved)}</Text>
                      <Text style={styles.completedMetaLbl}>Total Saved</Text>
                    </View>
                    <View style={styles.completedMetaDivider} />
                    <View style={styles.completedMetaItem}>
                      <Text style={styles.completedMetaVal}>{formatNaira(p.target)}</Text>
                      <Text style={styles.completedMetaLbl}>Target</Text>
                    </View>
                    <View style={styles.completedMetaDivider} />
                    <View style={styles.completedMetaItem}>
                      <Text style={styles.completedMetaVal}>{p.contributions.length}</Text>
                      <Text style={styles.completedMetaLbl}>Contributions</Text>
                    </View>
                  </View>
                  <Text style={styles.completedDate}>
                    Completed {p.completedAt ? formatDate(p.completedAt) : ''}
                  </Text>
                </View>
                <View style={styles.completedCardDivider} />
                <TouchableOpacity
                  style={styles.restoreRow}
                  activeOpacity={0.7}
                  onPress={() => {
                    const restorePlan = usePlanStore.getState().restorePlan
                    restorePlan(p.id)
                  }}
                >
                  <GoonaIcon icon={Icons.refreshCw} size={16} color="#2E7D32" />
                  <Text style={styles.restoreRowText}>Restore to Active</Text>
                </TouchableOpacity>
              </View>
            ))}
          </Animated.View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <BottomDock hidden />
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
  datePickerWrap: { backgroundColor: 'white', borderRadius: 24, marginTop: 8, paddingTop: 8, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 2 },
  datePickerDone: { height: 48, alignItems: 'center', justifyContent: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9', marginHorizontal: 16 },
  datePickerDoneText: { fontSize: 15, fontWeight: '600', color: '#2E7D32' },
  scroll: { flex: 1 },
  scrollInner: { paddingHorizontal: 20, paddingTop: 12 },
  presetScroll: { marginBottom: 4, zIndex: 5 },
  presetScrollInner: { gap: 8, paddingVertical: 4 },
  presetChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#F1F5F1', flexDirection: 'row', alignItems: 'center',
  },
  presetChipActive: { backgroundColor: '#16A34A' },
  presetChipActiveCustom: { backgroundColor: '#0C3A24' },
  presetLabel: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  presetLabelActive: { color: 'white' },

  /* custom date */
  customDateRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 8, marginBottom: 4,
  },
  customDateBtn: {
    flex: 1, backgroundColor: 'white', borderRadius: 12,
    paddingVertical: 10, paddingHorizontal: 12,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  customDateLabel: { fontSize: 10, fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase' },
  customDateValue: { fontSize: 13, fontWeight: '700', color: '#1F2937', marginTop: 2 },
  customDateSep: { fontSize: 16, color: '#94A3B8', marginTop: 12 },
  customDateClear: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F1',
    alignItems: 'center', justifyContent: 'center', marginTop: 12,
  },

  /* type filter chips */
  typeScroll: { marginBottom: 4, zIndex: 5 },
  typeScrollInner: { gap: 6, paddingVertical: 4 },
  typeChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    backgroundColor: '#F1F5F1', flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: 'transparent',
  },
  typeChipActive: { backgroundColor: '#0C3A24' },
  typeChipLabel: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  typeChipLabelActive: { color: 'white' },
  typeChipEmoji: { fontSize: 14 },

  /* results header */
  resultsHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 12,
  },
  resultsHeaderTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  resultsHeaderCount: { fontSize: 12, fontWeight: '600', color: '#94A3B8' },

  /* type result card */
  typeResultCard: {
    backgroundColor: 'white', borderRadius: 16, padding: 16,
    marginBottom: 4, marginTop: 8,
    borderLeftWidth: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03, shadowRadius: 8, elevation: 1,
  },
  typeResultTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  typeResultTopLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  typeResultEmoji: { fontSize: 22 },
  typeResultName: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  typeResultCount: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
  typeResultTotal: { fontSize: 18, fontWeight: '800' },
  typeResultRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  typeChevron: { transform: [{ rotate: '0deg' }] },
  typeChevronOpen: { transform: [{ rotate: '90deg' }] },
  typeResultAvg: { fontSize: 11, color: '#94A3B8', marginTop: 6, marginLeft: 32 },

  /* records list */
  recordRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'white', borderRadius: 12, padding: 12, marginTop: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02, shadowRadius: 4, elevation: 1,
  },
  recordLeft: { flex: 1 },
  recordDate: { fontSize: 13, fontWeight: '600', color: '#1F2937' },
  recordBatch: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
  recordNotes: { fontSize: 11, color: '#64748B', marginTop: 2, fontStyle: 'italic' },
  recordValue: { fontSize: 15, fontWeight: '700', textAlign: 'right' },

  viewAllBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    paddingVertical: 10, marginBottom: 8,
  },
  viewAllText: { fontSize: 12, fontWeight: '600', color: '#17663A' },

  /* completed batches */
  completedSection: { marginTop: 16 },
  completedSectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, marginTop: 4 },
  completedSectionHeadLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  completedSectionTitle: { fontSize: 18, fontWeight: '800', color: '#1B1B1B' },
  completedCountBadge: {
    minWidth: 26, height: 26, borderRadius: 13, backgroundColor: '#E8F5E9',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8,
  },
  completedCountText: { fontSize: 12, fontWeight: '800', color: '#2E7D32' },
  completedCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, marginBottom: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: '#E8F5E9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 14, elevation: 2,
  },
  completedCardBody: { padding: 16 },
  completedCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  completedCardName: { fontSize: 16, fontWeight: '800', color: '#1F2937', flex: 1 },
  completedCardBadge: { paddingVertical: 3, paddingHorizontal: 10, borderRadius: 100, backgroundColor: '#F0FDF4', marginLeft: 8 },
  completedCardBadgeText: { fontSize: 11, fontWeight: '600', color: '#2E7D32' },
  completedCardMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 14, backgroundColor: '#F8FAF7', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 8 },
  completedMetaItem: { flex: 1, alignItems: 'center' },
  completedMetaDivider: { width: 1, height: 24, backgroundColor: '#E2E8F0' },
  completedMetaVal: { fontSize: 16, fontWeight: '800', color: '#1F2937' },
  completedMetaLbl: { fontSize: 10, color: '#94A3B8', marginTop: 1, fontWeight: '500' },
  completedDate: { fontSize: 12, color: '#94A3B8', marginTop: 8 },
  completedNotes: { fontSize: 12, color: '#64748B', marginTop: 4, lineHeight: 17 },
  completedCardDivider: { height: 1, backgroundColor: '#F1F5F9', marginHorizontal: 16 },
  restoreRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center',
    paddingVertical: 14, backgroundColor: '#F8FAF7',
  },
  restoreRowText: { fontSize: 13, fontWeight: '700', color: '#2E7D32' },

  /* empty state */
  emptyState: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 16, paddingHorizontal: 12,
  },
  emptyIcon: { fontSize: 20 },
  emptyText: { fontSize: 13, color: '#94A3B8', flex: 1 },
})
