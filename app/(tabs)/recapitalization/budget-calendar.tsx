import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, useWindowDimensions, AccessibilityInfo,
} from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import GoonaIcon from '../../../components/ui/GoonaIcon'
import { Icons } from '../../../shared/icons'
import Animated, {
  FadeInDown, FadeInUp, FadeInRight, FadeInLeft,
  useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming,
} from 'react-native-reanimated'
import { formatNaira } from '../../../utils/format'
import { useBudgetStore, type Budget } from '../../../store/useBudgetStore'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const COLS = 7

function getBudgetStatusColor(b: Budget): string {
  if (b.status === 'completed' || b.status === 'archived' || b.status === 'cancelled') return '#94A3B8'
  if (b.status === 'scheduled') return '#3B82F6'
  const used = b.spent > 0 ? (b.spent / b.totalAmount) * 100 : 0
  if (used > 100) return '#EF4444'
  if (used > 80) return '#F59E0B'
  return '#16A34A'
}

function getStatusBadge(b: Budget): { label: string; color: string; bg: string } {
  const used = b.spent > 0 ? (b.spent / b.totalAmount) * 100 : 0
  switch (b.status) {
    case 'completed': return { label: 'Completed', color: '#64748B', bg: '#F1F5F9' }
    case 'archived': return { label: 'Archived', color: '#94A3B8', bg: '#F1F5F9' }
    case 'cancelled': return { label: 'Cancelled', color: '#EF4444', bg: '#FEF2F2' }
    case 'scheduled': return { label: 'Scheduled', color: '#3B82F6', bg: '#EFF6FF' }
    case 'near_expiry': return { label: 'Ending Soon', color: '#F59E0B', bg: '#FFFBEB' }
    default: {
      if (used > 100) return { label: 'Exceeded', color: '#EF4444', bg: '#FEF2F2' }
      if (used > 80) return { label: 'Near Limit', color: '#F59E0B', bg: '#FFFBEB' }
      return { label: 'Active', color: '#16A34A', bg: '#F0FDF4' }
    }
  }
}

interface DayInfo {
  day: number
  isToday: boolean
  isPast: boolean
  budgets: {
    budget: Budget
    isStart: boolean
    isEnd: boolean
    statusColor: string
    hasSpending: boolean
  }[]
}

function fmtDateStr(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

// ─── DAY DETAIL PANEL ───

function DayDetailPanel({ dayInfo, year, month }: { dayInfo: DayInfo; year: number; month: number }) {
  if (dayInfo.budgets.length === 0) {
    return (
      <Animated.View entering={FadeInDown.duration(250).springify()} style={s.detailCard}>
        <View style={s.detailEmpty}>
          <GoonaIcon icon={Icons.calendar} size={20} color="#D1D5DB" />
          <Text style={s.detailEmptyText}>Nothing scheduled or spent on this day</Text>
        </View>
      </Animated.View>
    )
  }

  return (
    <Animated.View entering={FadeInDown.duration(250).springify()} style={s.detailCard}>
      {dayInfo.budgets.map((bd, i) => {
        const badge = getStatusBadge(bd.budget)
        return (
          <TouchableOpacity
            key={bd.budget.id}
            style={[s.detailRow, i < dayInfo.budgets.length - 1 && s.detailRowBorder]}
            activeOpacity={0.7}
            onPress={() => router.push(`/(tabs)/recapitalization/budget-details?id=${bd.budget.id}`)}
          >
            <View style={s.detailRowLeft}>
              <View style={[s.detailDot, { backgroundColor: bd.statusColor }]} />
              <View style={s.detailRowInfo}>
                <View style={s.detailRowTop}>
                  <Text style={s.detailBudgetName} numberOfLines={1}>{bd.budget.name || bd.budget.period}</Text>
                  <Text style={s.detailBudgetAmount}>{formatNaira(bd.budget.totalAmount)}</Text>
                </View>
                <View style={s.detailRowMeta}>
                  {bd.isStart && <View style={[s.detailMetaBadge, { backgroundColor: '#F0FDF4' }]}><Text style={[s.detailMetaText, { color: '#16A34A' }]}>Starts</Text></View>}
                  {bd.isEnd && <View style={[s.detailMetaBadge, { backgroundColor: '#FFFBEB' }]}><Text style={[s.detailMetaText, { color: '#D97706' }]}>Ends</Text></View>}
                  <View style={[s.detailMetaBadge, { backgroundColor: badge.bg }]}>
                    <Text style={[s.detailMetaText, { color: badge.color }]}>{badge.label}</Text>
                  </View>
                  {bd.hasSpending && <Text style={s.detailSpentText}>₦{formatNaira(bd.budget.spent)} spent</Text>}
                </View>
              </View>
            </View>
            <GoonaIcon icon={Icons.chevronRight} size={14} color="#D1D5DB" />
          </TouchableOpacity>
        )
      })}
    </Animated.View>
  )
}

// ─── LEGEND ───

function Legend() {
  const items = [
    { label: 'On Track', color: '#16A34A' },
    { label: 'Near Limit', color: '#F59E0B', dot: true },
    { label: 'Exceeded', color: '#EF4444', dot: true },
    { label: 'Budget Period', color: '#16A34A', isBar: true },
    { label: 'Start', color: '#16A34A', isRing: true },
    { label: 'End', color: '#D97706', isRing: true },
  ]
  return (
    <View style={s.legend}>
      {items.map((item) => (
        <View key={item.label} style={s.legendItem}>
          {item.isBar ? (
            <View style={s.legendBarWrap}><View style={[s.legendBar, { backgroundColor: item.color }]} /></View>
          ) : item.isRing ? (
            <View style={[s.legendRing, { borderColor: item.color }]} />
          ) : (
            <View style={[s.legendDot, { backgroundColor: item.color }, item.dot && { width: 8, height: 8, borderRadius: 4 }]} />
          )}
          <Text style={s.legendLabel}>{item.label}</Text>
        </View>
      ))}
    </View>
  )
}

// ─── MAIN SCREEN ───

export default function BudgetCalendarScreen() {
  const insets = useSafeAreaInsets()
  const budgets = useBudgetStore((s) => s.budgets)
  const now = new Date()
  const todayStr = fmtDateStr(now.getFullYear(), now.getMonth(), now.getDate())

  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [reduceMotion, setReduceMotion] = useState(false)
  const navDir = useRef<'next' | 'prev'>('next')

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion)
  }, [])

  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstDow = new Date(viewYear, viewMonth, 1).getDay()
  const monthName = MONTHS[viewMonth]

  const goPrev = useCallback(() => {
    navDir.current = 'prev'
    setSelectedDay(null)
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }, [viewMonth])

  const goNext = useCallback(() => {
    navDir.current = 'next'
    setSelectedDay(null)
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }, [viewMonth])

  const goToday = useCallback(() => {
    setViewYear(now.getFullYear())
    setViewMonth(now.getMonth())
    setSelectedDay(now.getDate())
  }, [])

  const { width: winW } = useWindowDimensions()
  const calPadding = 20
  const gapTotal = (COLS - 1) * 2
  const cellW = (winW - calPadding * 2 - gapTotal) / COLS

  // Compute per-day budget data
  const daysData = useMemo(() => {
    const result: DayInfo[] = []
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(viewYear, viewMonth, d)
      const dateStr = fmtDateStr(viewYear, viewMonth, d)
      const isToday = dateStr === todayStr
      const isPast = date < now

      const dayBudgets = budgets
        .filter((b) => {
          const bStart = new Date(b.startDate)
          const bEnd = new Date(b.endDate)
          bEnd.setHours(23, 59, 59, 999)
          return date >= bStart && date <= bEnd
        })
        .map((b) => ({
          budget: b,
          isStart: isSameDay(date, new Date(b.startDate)),
          isEnd: isSameDay(date, new Date(b.endDate)),
          statusColor: getBudgetStatusColor(b),
          hasSpending: (b.spent ?? 0) > 0,
        }))

      result.push({ day: d, isToday, isPast, budgets: dayBudgets })
    }
    return result
  }, [budgets, viewYear, viewMonth, daysInMonth, todayStr])

  const selectedDayInfo = selectedDay ? daysData[selectedDay - 1] ?? null : null

  // Pulse animation for today
  const pulse = useSharedValue(1)
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(0.4, { duration: 2000 }), withTiming(1, { duration: 2000 })),
      -1, true,
    )
  }, [])
  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulse.value }))

  // Build grid cells
  const blanks = firstDow
  const totalSlots = blanks + daysInMonth
  const weeks = Math.ceil(totalSlots / 7)
  const trailing = weeks * 7 - totalSlots
  const cells: (number | null)[] = [
    ...Array(blanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ...Array(trailing).fill(null),
  ]

  const handleDayPress = useCallback((day: number) => {
    setSelectedDay(prev => prev === day ? null : day)
  }, [])

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollInner, { paddingTop: insets.top + 12 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── HEADER ─── */}
        <Animated.View entering={FadeInUp.duration(500).springify()} style={styles.topNav}>
          <TouchableOpacity
            style={styles.navBack}
            activeOpacity={0.7}
            onPress={() => router.back()}
          >
            <GoonaIcon icon={Icons.arrowLeft} size={22} color="#1B1B1B" />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Budget Calendar</Text>
          <View style={{ width: 38 }} />
        </Animated.View>

        {/* ─── MONTH NAVIGATION ─── */}
        <Animated.View entering={FadeInUp.duration(400).springify()} style={s.navBar}>
          <TouchableOpacity onPress={goPrev} style={s.navBtn} activeOpacity={0.7}>
            <GoonaIcon icon={Icons.chevronLeft} size={18} color="#1B1B1B" />
          </TouchableOpacity>

          <TouchableOpacity onPress={goToday} activeOpacity={0.7}>
            <Text style={s.navTitle}>{monthName} {viewYear}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={goNext} style={s.navBtn} activeOpacity={0.7}>
            <GoonaIcon icon={Icons.chevronRight} size={18} color="#1B1B1B" />
          </TouchableOpacity>
        </Animated.View>

        {/* ─── TODAY QUICK JUMP ─── */}
        {!isCurrentMonth && (
          <TouchableOpacity style={s.todayJump} activeOpacity={0.7} onPress={goToday}>
            <GoonaIcon icon={Icons.calendar} size={12} color="#16A34A" />
            <Text style={s.todayJumpText}>Jump to Today</Text>
          </TouchableOpacity>
        )}

        {/* ─── CALENDAR GRID ─── */}
        <Animated.View
          key={`cal-${viewYear}-${viewMonth}`}
          entering={
            reduceMotion ? undefined :
            navDir.current === 'next'
              ? FadeInRight.duration(350).springify().damping(18)
              : FadeInLeft.duration(350).springify().damping(18)
          }
          style={s.calCard}
        >
          {/* Weekday labels */}
          <View style={s.weekdayRow}>
            {WEEKDAYS.map((d, i) => (
              <Text key={i} style={[s.weekdayLabel, { width: cellW }]}>{d}</Text>
            ))}
          </View>

          {/* Day grid */}
          <View style={s.grid}>
            {Array.from({ length: weeks }, (_, w) => (
              <View key={w} style={s.gridRow}>
                {cells.slice(w * 7, w * 7 + 7).map((cell, ci) => {
                  if (cell === null) return <View key={`e-${w}-${ci}`} style={[s.dayCell, { width: cellW }]} />

                  const dayInfo = daysData[cell - 1]
                  const isSelected = selectedDay === cell
                  const hasBudgets = dayInfo.budgets.length > 0
                  const uniqueColors = [...new Set(dayInfo.budgets.map(bd => bd.statusColor))]
                  const hasOverBudget = dayInfo.budgets.some(bd => bd.statusColor === '#EF4444')
                  const hasNearLimit = dayInfo.budgets.some(bd => bd.statusColor === '#F59E0B')
                  const hasStart = dayInfo.budgets.some(bd => bd.isStart)
                  const hasEnd = dayInfo.budgets.some(bd => bd.isEnd)

                  return (
                    <TouchableOpacity
                      key={cell}
                      style={[
                        s.dayCell,
                        { width: cellW },
                        isSelected && s.dayCellSelected,
                        dayInfo.isToday && s.dayCellToday,
                      ]}
                      activeOpacity={0.6}
                      onPress={() => handleDayPress(cell)}
                    >
                      {/* Period band (colored strip at bottom if budgets active) */}
                      {hasBudgets && (
                        <View style={s.dayPeriodBands}>
                          {uniqueColors.map((c, i) => (
                            <View
                              key={i}
                              style={[
                                s.dayPeriodBand,
                                { backgroundColor: c, width: `${100 / uniqueColors.length}%` },
                                hasOverBudget && uniqueColors.length <= 2 ? { opacity: 0.7 } : undefined,
                              ]}
                            />
                          ))}
                        </View>
                      )}

                      {/* Today pulse ring */}
                      {dayInfo.isToday && (
                        <Animated.View style={[s.todayPulse, pulseStyle]} />
                      )}

                      {/* Start/end dots */}
                      <View style={s.dayMarkerRow}>
                        {hasStart && <View style={s.dayStartDot} />}
                        {hasEnd && <View style={s.dayEndDot} />}
                      </View>

                      {/* Day number */}
                      <Text style={[
                        s.dayNum,
                        dayInfo.isToday && s.dayNumToday,
                        !dayInfo.isPast && !dayInfo.isToday && s.dayNumFuture,
                        !hasBudgets && dayInfo.isPast && s.dayNumInactive,
                        isSelected && s.dayNumSelected,
                      ]}>{cell}</Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            ))}
          </View>
        </Animated.View>

        {/* ─── DAY DETAIL ─── */}
        {selectedDayInfo && (
          <View style={s.detailSection}>
            <View style={s.detailHeader}>
              <GoonaIcon icon={Icons.calendar} size={14} color="#16A34A" />
              <Text style={s.detailDate}>
                {WEEKDAYS[new Date(viewYear, viewMonth, selectedDayInfo.day).getDay()]},{' '}
                {monthName} {selectedDayInfo.day}, {viewYear}
              </Text>
              <TouchableOpacity activeOpacity={0.7} onPress={() => setSelectedDay(null)}>
                <GoonaIcon icon={Icons.x} size={16} color="#94A3B8" />
              </TouchableOpacity>
            </View>
            <DayDetailPanel dayInfo={selectedDayInfo} year={viewYear} month={viewMonth} />
          </View>
        )}

        {/* ─── LEGEND ─── */}
        <Legend />

        {/* ─── EMPTY STATE ─── */}
        {budgets.length === 0 && (
          <View style={s.empty}>
            <View style={s.emptyIconWrap}>
              <GoonaIcon icon={Icons.calendar} size={32} color="#16A34A" />
            </View>
            <Text style={s.emptyTitle}>No Budgets Yet</Text>
            <Text style={s.emptyDesc}>
              Create a budget to see your financial schedule on a monthly calendar with smart markers.
            </Text>
            <TouchableOpacity
              style={s.emptyBtn}
              activeOpacity={0.8}
              onPress={() => router.push('/(tabs)/recapitalization/budget-setup')}
            >
              <GoonaIcon icon={Icons.plus} size={16} color="#FFF" />
              <Text style={s.emptyBtnText}>Create a Budget</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  // ─── NAV BAR ───
  navBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 20, marginBottom: 8,
    backgroundColor: '#FFFFFF', borderRadius: 16, paddingVertical: 10, paddingHorizontal: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  navBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center',
  },
  navTitle: {
    fontSize: 17, fontWeight: '800', color: '#1B1B1B', letterSpacing: -0.3,
  },

  // ─── TODAY JUMP ───
  todayJump: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center',
    backgroundColor: '#F0FDF4', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20,
    marginBottom: 8,
  },
  todayJumpText: { fontSize: 12, fontWeight: '700', color: '#16A34A' },

  // ─── CALENDAR CARD ───
  calCard: {
    marginHorizontal: 16, backgroundColor: '#FFFFFF', borderRadius: 22,
    padding: 16, paddingTop: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },

  // ─── WEEKDAY LABELS ───
  weekdayRow: {
    flexDirection: 'row', marginBottom: 8,
  },
  weekdayLabel: {
    textAlign: 'center', fontSize: 11, fontWeight: '700', color: '#94A3B8',
  },

  // ─── GRID ───
  grid: { gap: 0 },
  gridRow: { flexDirection: 'row' },

  // ─── DAY CELL ───
  dayCell: {
    height: 44, alignItems: 'center', justifyContent: 'center',
    position: 'relative', marginVertical: 1,
    borderRadius: 10,
  },
  dayCellToday: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5, borderColor: '#16A34A',
  },
  dayCellSelected: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1.5, borderColor: '#2E7D32',
  },

  // ─── DAY PERIOD BANDS ───
  dayPeriodBands: {
    position: 'absolute', bottom: 2, left: 4, right: 4,
    height: 3, flexDirection: 'row', borderRadius: 1.5, overflow: 'hidden', gap: 1,
  },
  dayPeriodBand: { height: '100%', borderRadius: 1.5 },

  // ─── DAY MARKERS ───
  dayMarkerRow: {
    position: 'absolute', top: 3, flexDirection: 'row', gap: 2,
  },
  dayStartDot: {
    width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#16A34A',
  },
  dayEndDot: {
    width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#D97706',
  },

  // ─── TODAY PULSE ───
  todayPulse: {
    position: 'absolute', top: -2, right: -2, bottom: -2, left: -2,
    borderRadius: 12, borderWidth: 2, borderColor: '#16A34A',
  },

  // ─── DAY NUMBER ───
  dayNum: {
    fontSize: 14, fontWeight: '600', color: '#1B1B1B',
  },
  dayNumToday: {
    fontSize: 15, fontWeight: '800', color: '#16A34A',
  },
  dayNumFuture: {
    opacity: 0.5,
  },
  dayNumInactive: {
    color: '#D1D5DB',
  },
  dayNumSelected: {
    color: '#2E7D32',
  },

  // ─── DAY DETAIL ───
  detailSection: {
    marginHorizontal: 16, marginTop: 12,
  },
  detailHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 4, paddingBottom: 8,
  },
  detailDate: {
    fontSize: 14, fontWeight: '700', color: '#1B1B1B', flex: 1,
  },
  detailCard: {
    backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  detailEmpty: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 8,
  },
  detailEmptyText: {
    fontSize: 13, color: '#94A3B8', fontWeight: '500',
  },
  detailRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10,
  },
  detailRowBorder: {
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  detailRowLeft: {
    flexDirection: 'row', alignItems: 'flex-start', flex: 1, gap: 10,
  },
  detailDot: {
    width: 8, height: 8, borderRadius: 4, marginTop: 5,
  },
  detailRowInfo: { flex: 1 },
  detailRowTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  detailBudgetName: {
    fontSize: 14, fontWeight: '700', color: '#1B1B1B', flex: 1, marginRight: 8,
  },
  detailBudgetAmount: {
    fontSize: 14, fontWeight: '800', color: '#1B1B1B',
  },
  detailRowMeta: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6,
  },
  detailMetaBadge: {
    paddingVertical: 2, paddingHorizontal: 6, borderRadius: 6,
  },
  detailMetaText: {
    fontSize: 10, fontWeight: '700',
  },
  detailSpentText: {
    fontSize: 11, fontWeight: '600', color: '#64748B',
  },

  // ─── LEGEND ───
  legend: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 20, gap: 14, marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
  },
  legendDot: {
    width: 7, height: 7, borderRadius: 3.5,
  },
  legendBarWrap: {
    width: 18, height: 3, borderRadius: 1.5, overflow: 'hidden',
  },
  legendBar: {
    height: '100%', borderRadius: 1.5,
  },
  legendRing: {
    width: 8, height: 8, borderRadius: 4, borderWidth: 2,
  },
  legendLabel: {
    fontSize: 11, fontWeight: '600', color: '#64748B',
  },

  // ─── EMPTY ───
  empty: {
    alignItems: 'center', paddingHorizontal: 40, paddingTop: 40,
  },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20, fontWeight: '800', color: '#1B1B1B', marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 13, color: '#94A3B8', textAlign: 'center', lineHeight: 18, marginBottom: 24,
  },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#16A34A', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 14,
  },
  emptyBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
})

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAF7' },
  scroll: { flex: 1 },
  scrollInner: { paddingBottom: 40 },
  topNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, height: 48, marginBottom: 8,
  },
  navBack: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center',
  },
  topTitle: {
    fontSize: 18, fontWeight: '700', color: '#1B1B1B', letterSpacing: -0.3,
  },
})
