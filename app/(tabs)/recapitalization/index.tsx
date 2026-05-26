import React, { useEffect, useState, useCallback, useRef } from 'react'
import {
  View, Text, TouchableOpacity, Pressable, ScrollView,
  StyleSheet, Dimensions, Keyboard, PanResponder, Modal, Platform,
  useWindowDimensions,
} from 'react-native'
import { router } from 'expo-router'
import Svg, { Circle } from 'react-native-svg'
import GoonaIcon from '../../../components/ui/GoonaIcon'
import { Bell, MoreHorizontal, BadgeDollarSign, TrendingUp, TrendingDown, Check, Flame, Sparkles, Plus, ShieldCheck, FileText, Target, ChevronLeft, ChevronRight, X, Info, Wallet } from 'lucide-react-native'
import { BlurView } from 'expo-blur'
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient'
import Animated, {
  useSharedValue, useAnimatedStyle, withDelay, withTiming,
  withSpring, withRepeat, withSequence, Easing,
  FadeInRight, FadeInLeft, SlideInUp,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import BottomDock from '../../../components/navigation/BottomDock'
import RecoveryCheckInModal from '../../../components/RecoveryCheckInModal'
import {
  useRecoveryStore, fmtDateFromParts,
  computeStreak, computeMonthlyStats, generateInsights,
} from '../../../store/useRecoveryStore'

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window')
const IS_SMALL = SCREEN_W < 375
const IS_TABLET = SCREEN_W >= 768
const S = {
  w: SCREEN_W,
  h: SCREEN_H,
  isSmall: IS_SMALL,
  isTablet: IS_TABLET,
  scale: (v: number) => Math.round(v * Math.min(SCREEN_W / 390, 1.3)),
  font: (v: number) => Math.round(v * Math.min(SCREEN_W / 390, 1.15)),
  pad: (v: number) => Math.round(v * Math.min(SCREEN_W / 390, 1.2)),
  cardW: Math.min(SCREEN_W - 40, 500),
}
const CARD_HORIZ_W = IS_SMALL ? 140 : IS_TABLET ? 200 : 160
const CALENDAR_GAP = 4
const CAL_COLS = 7
const CAL_W = (SCREEN_W - 40 - CALENDAR_GAP * (CAL_COLS - 1) - 4) / CAL_COLS

function useStaggerEntry(index: number, baseDelay = 100) {
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(24)
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

function AnimatedProgressFill({ progress, color }: { progress: number; color: string }) {
  const w = useSharedValue(0)
  useEffect(() => { w.value = withTiming(progress, { duration: 1200, easing: Easing.out(Easing.cubic) }) }, [progress])
  const style = useAnimatedStyle(() => ({ width: `${w.value * 100}%` as any }))
  return <Animated.View style={[{ backgroundColor: color }, styles.progressFill, style]} />
}

function AnimatedBell() {
  const records = useRecoveryStore((s) => s.records)
  const now = new Date()
  const todayStr = fmtDateFromParts(now.getFullYear(), now.getMonth(), now.getDate())
  let missedCount = 0
  for (let i = 1; i <= 7; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    const ds = fmtDateFromParts(d.getFullYear(), d.getMonth(), d.getDate())
    if (records[ds]?.status === 'missed') missedCount++
  }
  const todayRec = records[todayStr]
  const isDue = !todayRec || todayRec.status === 'none' || !todayRec.status
  const count = missedCount + (isDue ? 1 : 0)

  const pulse = useSharedValue(1)
  useEffect(() => {
    if (count > 0) {
      pulse.value = withRepeat(withSequence(withTiming(0.4, { duration: 2000 }), withTiming(1, { duration: 2000 })), -1, true)
    } else { pulse.value = 1 }
  }, [count])
  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulse.value }))

  return (
    <View style={{ width: 20, height: 20 }}>
      <Animated.View style={pulseStyle}>
        <GoonaIcon icon={Bell} size={20} color={count > 0 ? '#DC2626' : '#1F2937'} />
      </Animated.View>
      {count > 0 && (
        <View style={bellStyles.badge}>
          <Text style={bellStyles.badgeText}>{count > 9 ? '9+' : count}</Text>
        </View>
      )}
    </View>
  )
}
const bellStyles = StyleSheet.create({
  badge: {
    position: 'absolute', top: -6, right: -6,
    minWidth: 17, height: 17, borderRadius: 8.5,
    backgroundColor: '#DC2626', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
    shadowColor: '#DC2626', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4,
  },
  badgeText: { fontSize: 9, fontWeight: '800', color: '#fff', includeFontPadding: false },
})




const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const GROWTH_TARGETS = [
  { title: 'New Poultry House', target: '₦2.5M', saved: '₦1.2M', progress: 0.48, timeline: 'Q3 2026', color: '#2E7D32' },
  { title: 'Feed Mill Setup', target: '₦1.8M', saved: '₦450k', progress: 0.25, timeline: 'Q1 2027', color: '#1A56FF' },
  { title: 'Cold Storage Unit', target: '₦800k', saved: '₦520k', progress: 0.65, timeline: 'Q4 2026', color: '#F59E0B' },
]

function RecapitalizationHeroCard({ index }: { index: number }) {
  const animStyle = useStaggerEntry(index)
  const { style: pressStyle, onPressIn, onPressOut } = usePressScale()
  const records = useRecoveryStore((s) => s.records)
  const now = new Date()

  let totalSaved = 0
  for (const key in records) {
    const r = records[key]
    if (r.amount && (r.status === 'completed' || r.status === 'exceeded')) totalSaved += r.amount
  }
  const totalTarget = 2500000
  const progress = Math.min(totalSaved / totalTarget, 1)
  const ringCircumference = 2 * Math.PI * 38
  const strokeDashoffset = ringCircumference * (1 - progress)
  const ringAnim = useSharedValue(ringCircumference)
  useEffect(() => {
    ringAnim.value = withTiming(strokeDashoffset, { duration: 1500, easing: Easing.out(Easing.cubic) })
  }, [totalSaved])

  const streak = computeStreak(records)
  const statusLabel = progress >= 0.9 ? 'Nearly Ready' : progress >= 0.6 ? 'On Track' : progress >= 0.3 ? 'Building' : 'Just Started'

  return (
    <Animated.View style={[animStyle, pressStyle]} onTouchStart={onPressIn} onTouchEnd={onPressOut}>
      <ExpoLinearGradient
        colors={['#2E7D32', '#1B5E20']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <View style={styles.heroBgCircle1} pointerEvents="none" />
        <View style={styles.heroBgCircle2} pointerEvents="none" />

        <View style={styles.heroHead}>
          <View>
            <Text style={styles.heroLabel}>CAPITAL READINESS</Text>
            <Text style={styles.heroAmount}>₦{totalSaved.toLocaleString()}</Text>
          </View>
          <View style={styles.heroRingWrap}>
            <Svg width="88" height="88" viewBox="0 0 88 88">
              <Circle cx="44" cy="44" r="38" stroke="rgba(255,255,255,0.12)" strokeWidth="5" fill="none" />
              <Animated.View>
                <Svg width="88" height="88" viewBox="0 0 88 88">
                  <Circle
                    cx="44" cy="44" r="38" stroke="#AEEA00" strokeWidth="5"
                    fill="none" strokeLinecap="round"
                    strokeDasharray={`${ringCircumference}`}
                    strokeDashoffset={strokeDashoffset}
                  />
                </Svg>
              </Animated.View>
              <Text style={styles.heroRingText}>{Math.round(progress * 100)}%</Text>
            </Svg>
          </View>
        </View>

        <Text style={styles.heroStatus}>{'\u25CF'} {statusLabel} — {Math.round(progress * 100)}% of recapitalization goal</Text>

        <View style={styles.heroPills}>
          <View style={styles.heroPill}>
            <Text style={styles.heroPillText}>Weekly: ₦85k recovery</Text>
          </View>
          <View style={[styles.heroPill, { backgroundColor: 'rgba(174,234,0,0.18)' }]}>
            <Text style={[styles.heroPillText, { color: '#AEEA00' }]}>Streak: {streak}w</Text>
          </View>
          <View style={[styles.heroPill, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
            <Text style={styles.heroPillText}>Target: ₦2.5M</Text>
          </View>
        </View>

        <View style={styles.heroGlow} pointerEvents="none" />
      </ExpoLinearGradient>
    </Animated.View>
  )
}

function FinancialOverviewCard({
  item, index,
}: {
  item: { label: string; value: string; trend: string; trendUp: boolean; color: string; bars: number[]; bg: string }
  index: number
}) {
  const animStyle = useStaggerEntry(index, 50)
  const { style: pressStyle, onPressIn, onPressOut } = usePressScale()
  return (
    <Animated.View style={[animStyle, pressStyle]} onTouchStart={onPressIn} onTouchEnd={onPressOut}>
      <TouchableOpacity activeOpacity={0.9} style={styles.finCard}>
        <View style={styles.finCardTop}>
          <View style={[styles.finIconWrap, { backgroundColor: item.bg }]}>
            <GoonaIcon icon={FileText} size={16} color={item.color} />
          </View>
          <Text style={[styles.finTrend, { color: item.trendUp ? '#16A34A' : '#EF4444' }]}>{item.trend}</Text>
        </View>
        <Text style={styles.finValue}>{item.value}</Text>
        <Text style={styles.finLabel}>{item.label}</Text>
        <View style={styles.finBars}>
          {item.bars.map((h, j) => (
            <View key={j} style={[styles.finBar, { height: `${h}%` as any, backgroundColor: j === item.bars.length - 1 ? item.color : '#E2E8E0' }]} />
          ))}
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

function RecoveryTrackerCalendar({ index, onDayPress }: { index: number; onDayPress: (d: Date) => void }) {
  const animStyle = useStaggerEntry(index, 80)
  const records = useRecoveryStore((s) => s.records)
  const now = new Date()
  const todayStr = fmtDateFromParts(now.getFullYear(), now.getMonth(), now.getDate())
  const streak = computeStreak(records)

  const { width: winW } = useWindowDimensions()
  const calCellW = (winW - 40 - CALENDAR_GAP * (CAL_COLS - 1) - (S.isSmall ? 8 : 4)) / CAL_COLS

  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [navDir, setNavDir] = useState<'next' | 'prev'>('next')
  const [detailDate, setDetailDate] = useState<Date | null>(null)
  const [showDetail, setShowDetail] = useState(false)

  const isCurMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstDow = new Date(viewYear, viewMonth, 1).getDay()
  const monthName = MONTHS[viewMonth]

  const goPrev = () => {
    setNavDir('prev')
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  const goNext = () => {
    setNavDir('next')
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  const handleDayTap = (day: number) => {
    const d = new Date(viewYear, viewMonth, day)
    setDetailDate(d)
    setShowDetail(true)
  }

  const stateColors: Record<string, string> = {
    completed: '#2E7D32', exceeded: '#AEEA00',
    partial: '#F59E0B', missed: '#EF4444',
    upcoming: '#D97706', forecast: '#D1D5DB', none: '#F1F5F9',
  }

  const pulse = useSharedValue(1)
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(0.35, { duration: 2000 }), withTiming(1, { duration: 2000 })),
      -1, true,
    )
  }, [])
  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulse.value }))

  /* Readiness */
  const computeReadiness = (recs: Record<string, DayRecord>): number => {
    const cStreak = computeStreak(recs)
    const td = now.getDate()
    if (td === 0) return 0
    let ws = 0, ms = 0
    for (let d = 1; d <= td; d++) {
      const ds = fmtDateFromParts(now.getFullYear(), now.getMonth(), d)
      const r = recs[ds]
      const w = 1 + d / td
      ms += w
      if (r?.status === 'completed') ws += w
      else if (r?.status === 'exceeded') ws += w * 1.2
      else if (r?.status === 'partial') ws += w * 0.5
    }
    return Math.min((ms > 0 ? ws / ms : 0) + Math.min(cStreak * 0.015, 0.15), 1)
  }
  const readiness = computeReadiness(records)
  const weeksToRestart = Math.max(Math.round((1 - readiness) * 40), 1)

  /* Swipe */
  const panResp = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 10 && Math.abs(gs.dy) < 20,
      onPanResponderRelease: (_, gs) => {
        if (gs.dx > 60) goPrev()
        else if (gs.dx < -60) goNext()
      },
    }),
  ).current

  return (
    <Animated.View style={[animStyle, styles.calCard]}>
      {/* Navigation Header */}
      <View style={styles.calNavRow}>
        <TouchableOpacity onPress={goPrev} style={styles.calNavBtn} activeOpacity={0.7}>
          <GoonaIcon icon={ChevronLeft} size={16} color="#1F2937" />
        </TouchableOpacity>
        <TouchableOpacity onPress={goNext} style={styles.calNavBtn} activeOpacity={0.7}>
          <GoonaIcon icon={ChevronRight} size={16} color="#1F2937" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.calTitle}>{monthName} {viewYear}</Text>
          <Text style={styles.calSub}>Capital Recovery</Text>
        </View>
        <View style={styles.calStreak}>
          <GoonaIcon icon={Flame} size={16} color="#F59E0B" />
          <Text style={styles.calStreakText} numberOfLines={1}>{streak}d</Text>
        </View>
      </View>

      {/* Timeline Info */}
      <View style={styles.calTimeline}>
        <View style={styles.calTimelineItem}>
          <Text style={styles.calTimelineValue}>{Math.round(readiness * 100)}%</Text>
          <Text style={styles.calTimelineLabel}>Readiness</Text>
        </View>
        <View style={styles.calTimelineDivider} />
        <View style={styles.calTimelineItem}>
          <Text style={styles.calTimelineValue}>{weeksToRestart}wk</Text>
          <Text style={styles.calTimelineLabel}>Est. Restart</Text>
        </View>
        <View style={styles.calTimelineDivider} />
        <View style={styles.calTimelineItem}>
          <Text style={styles.calTimelineValue}>{streak}d</Text>
          <Text style={styles.calTimelineLabel}>Streak</Text>
        </View>
      </View>

      {/* Calendar Grid with Swipe */}
      <Animated.View
        key={`cal-${viewYear}-${viewMonth}`}
        entering={navDir === 'next' ? FadeInRight.duration(350).springify().damping(18) : FadeInLeft.duration(350).springify().damping(18)}
        {...panResp.panHandlers}
      >
        <View style={styles.calDayLabels}>
          {DAY_LABELS.map((d, i) => (
            <Text key={i} style={[styles.calDayLabel, { width: calCellW }]}>{d}</Text>
          ))}
        </View>

        <View style={styles.calGrid}>
          {(() => {
            const blanks = firstDow === 0 ? 6 : firstDow - 1
            const allDays = Array.from({ length: daysInMonth }, (_, i) => i + 1)
            const totalSlots = blanks + daysInMonth
            const weeks = Math.ceil(totalSlots / 7)
            const trailing = weeks * 7 - totalSlots
            const cells: (number | null)[] = [
              ...Array(blanks).fill(null),
              ...allDays,
              ...Array(trailing).fill(null),
            ]
            return Array.from({ length: weeks }, (_, w) => (
              <View key={w} style={{ flexDirection: 'row' }}>
                {cells.slice(w * 7, w * 7 + 7).map((cell, i) => {
                  if (cell === null) return <View key={`e-${w}-${i}`} style={[styles.calDayCell, { width: calCellW }]} />
                  const day = cell
                  const date = new Date(viewYear, viewMonth, day)
                  const dateStr = fmtDateFromParts(viewYear, viewMonth, day)
                  const record = records[dateStr]
                  const isToday = dateStr === todayStr
                  const isFuture = date > now

                  let status = 'none'
                  if (isFuture) status = day % 7 === 1 ? 'upcoming' : 'forecast'
                  else if (record) status = record.status

                  return (
                    <TouchableOpacity
                      key={day}
                      style={[styles.calDayCell, { width: calCellW }, isToday && styles.calDayCellToday]}
                      activeOpacity={0.7}
                      onPress={() => handleDayTap(day)}
                    >
                      {isToday && <Animated.View style={[styles.calDayPulse, pulseStyle]} />}
                      <View style={[
                        styles.calDayDot,
                        { backgroundColor: stateColors[status] },
                        (status === 'none' || status === 'forecast') && { opacity: 0.12 },
                      ]} />
                      <Text style={[
                        styles.calDayNum,
                        isToday && styles.calDayNumToday,
                        isFuture && { opacity: 0.5 },
                        status === 'missed' && { color: '#DC2626' },
                        status === 'upcoming' && { color: '#D97706', fontWeight: '600' },
                      ]}>{day}</Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            ))
          })()}
        </View>
      </Animated.View>

      {/* Legend */}
      <View style={styles.calLegend}>
        {[
          { k: 'completed', l: 'Saved' },
          { k: 'exceeded', l: 'Exceeded' },
          { k: 'partial', l: 'Partial' },
          { k: 'missed', l: 'Missed' },
          ...(isCurMonth ? [{ k: 'upcoming' as string, l: 'Upcoming' }] : []),
        ].map(({ k, l }) => (
          <View key={k} style={styles.calLegendItem}>
            <View style={[styles.calLegendDot, { backgroundColor: stateColors[k] }]} />
            <Text style={styles.calLegendText}>{l}</Text>
          </View>
        ))}
      </View>

      {/* Detail Modal */}
      <DayDetailModal
        visible={showDetail}
        date={detailDate}
        records={records}
        onClose={() => setShowDetail(false)}
        onCheckIn={onDayPress}
      />
    </Animated.View>
  )
}

/* ─── Day Detail Modal ─── */
function DayDetailModal({
  visible, date, records, onClose, onCheckIn,
}: {
  visible: boolean; date: Date | null; records: Record<string, DayRecord>
  onClose: () => void; onCheckIn: (d: Date) => void
}) {
  if (!visible || !date) return null

  const now = new Date()
  const todayStr = fmtDateFromParts(now.getFullYear(), now.getMonth(), now.getDate())
  const dateStr = fmtDateFromParts(date.getFullYear(), date.getMonth(), date.getDate())
  const record = records[dateStr]
  const isToday = dateStr === todayStr
  const isPast = date < new Date(now.getFullYear(), now.getMonth(), now.getDate()) && !isToday
  const isFuture = date > now

  const status = record?.status || (isFuture ? 'upcoming' : 'none')
  const amount = record?.amount
  const expected = 85000
  const streak = computeStreak(records)

  const sc: Record<string, string> = {
    completed: '#2E7D32', exceeded: '#AEEA00',
    partial: '#F59E0B', missed: '#EF4444',
    upcoming: '#D97706', forecast: '#D1D5DB', none: '#94A3B8',
  }
  const sl: Record<string, string> = {
    completed: 'Saved Successfully', exceeded: 'Exceeded Target',
    partial: 'Partial Contribution', missed: 'Missed Contribution',
    upcoming: 'Upcoming Savings', forecast: 'Forecast Day', none: 'No Record',
  }

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  let insight = ''
  if (status === 'missed') insight = 'This missed contribution may delay your production cycle restart by approximately 3 days.'
  else if (status === 'completed' && streak > 7) insight = 'Your consistency is building strong financial runway for the next batch.'
  else if (status === 'exceeded') insight = 'Over-contributing accelerates your recapitalization timeline. Excellent discipline.'
  else if (status === 'partial') insight = 'Partial contributions help, but try to meet the full target for optimal recovery pacing.'
  else if (isFuture) insight = 'Scheduled savings day. Early contributions reduce financial pressure later in the week.'
  else insight = 'Every recovery day brings you closer to your next production cycle. Stay consistent.'

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <Animated.View entering={SlideInUp.duration(300).springify().damping(18)} style={styles.modalSheet}>
          <View style={styles.modalHandleRow}>
            <View style={styles.modalHandle} />
          </View>
          <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose} activeOpacity={0.7}>
            <GoonaIcon icon={X} size={18} color="#1F2937" />
          </TouchableOpacity>

          <View style={styles.modalDateHead}>
            <Text style={styles.modalDateDay}>{dayNames[date.getDay()]}</Text>
            <Text style={styles.modalDateFull}>{monthShort[date.getMonth()]} {date.getDate()}, {date.getFullYear()}</Text>
            <View style={[styles.modalStatusBadge, { backgroundColor: `${sc[status]}18` as any }]}>
              <Text style={[styles.modalStatusText, { color: sc[status] }]}>{sl[status]}</Text>
            </View>
          </View>

          <View style={styles.modalAmountSection}>
            <View style={styles.modalAmountRow}>
              <Text style={styles.modalAmountLabel}>Expected Contribution</Text>
              <Text style={styles.modalAmountValue}>{'\u20A6'}{expected.toLocaleString()}</Text>
            </View>
            {amount !== undefined && (
              <View style={styles.modalAmountRow}>
                <Text style={styles.modalAmountLabel}>Actual Saved</Text>
                <Text style={[styles.modalAmountValue, { color: sc[status] }]}>
                  {'\u20A6'}{amount.toLocaleString()}
                </Text>
              </View>
            )}
            {isFuture && (
              <View style={styles.modalAmountRow}>
                <Text style={styles.modalAmountLabel}>Status</Text>
                <Text style={[styles.modalAmountValue, { color: '#D97706', fontSize: 13 }]}>Scheduled</Text>
              </View>
            )}
          </View>

          <View style={styles.modalInsight}>
            <View style={styles.modalInsightHeader}>
              <GoonaIcon icon={Info} size={14} color="#2E7D32" />
              <Text style={styles.modalInsightLabel}>GOONA IQ</Text>
            </View>
            <Text style={styles.modalInsightText}>{insight}</Text>
          </View>

          {(isToday || isPast) && (
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.modalActionBtn}
              onPress={() => { onCheckIn(date); onClose() }}
            >
              <LinearGradient colors={['#2E7D32', '#1B5E20']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.modalActionGrad}>
                <Text style={styles.modalActionText}>{isToday ? 'Check In Today' : 'Check In'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>
    </Modal>
  )
}

function RecapitalizationProgressCard({ index }: { index: number }) {
  const animStyle = useStaggerEntry(index, 100)
  const records = useRecoveryStore((s) => s.records)
  const now = new Date()
  const todayStr = fmtDateFromParts(now.getFullYear(), now.getMonth(), now.getDate())
  const streak = computeStreak(records)
  const stats = computeMonthlyStats(records, now.getFullYear(), now.getMonth())

  let totalSaved = 0
  let totalMissed = 0
  for (const key in records) {
    const r = records[key]
    if (r.amount && (r.status === 'completed' || r.status === 'exceeded')) totalSaved += r.amount
    if (r.status === 'missed') totalMissed++
  }
  const totalTarget = 2500000
  const overallProgress = Math.min(totalSaved / totalTarget, 1)

  const dynamicSteps = [
    { label: 'Next Cycle Capital', value: `\u20A6${Math.min(totalSaved, 1800000).toLocaleString()}`, progress: Math.min(totalSaved / 1800000, 1), color: '#2E7D32' },
    { label: 'Feed & Medication Fund', value: `\u20A6${Math.min(Math.round(totalSaved * 0.4), 950000).toLocaleString()}`, progress: Math.min((totalSaved * 0.4) / 950000, 1), color: '#16A34A' },
    { label: 'Infrastructure Budget', value: `\u20A6${Math.min(Math.round(totalSaved * 0.2), 420000).toLocaleString()}`, progress: Math.min((totalSaved * 0.2) / 420000, 1), color: '#1A56FF' },
    { label: 'Emergency Reserve', value: `\u20A6${Math.min(Math.round(totalSaved * 0.15), 500000).toLocaleString()}`, progress: Math.min((totalSaved * 0.15) / 500000, 1), color: '#7C3AED' },
  ]

  return (
    <Animated.View style={[animStyle, styles.reinvestCard]}>
      <View style={styles.secHead}>
        <Text style={styles.secTitle}>Recapitalization Progress</Text>
        <Text style={styles.secLink}>{Math.round(overallProgress * 100)}%</Text>
      </View>

      <View style={{ marginBottom: S.pad(16) }}>
        <View style={{ height: S.scale(8), backgroundColor: '#F1F5F9', borderRadius: 100, overflow: 'hidden' }}>
          <AnimatedProgressFill progress={overallProgress} color="#2E7D32" />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
          <Text style={styles.overallText}>{'\u20A6'}{totalSaved.toLocaleString()} saved</Text>
          <Text style={styles.overallTargetText}>Target: {'\u20A6'}2,500,000</Text>
        </View>
      </View>

      {dynamicSteps.map((step, i) => {
        const isLast = i === dynamicSteps.length - 1
        return (
          <View key={step.label} style={styles.reinvestRow}>
            <View style={styles.reinvestLeft}>
              <View style={[styles.reinvestDot, { backgroundColor: step.color }]} />
              {!isLast && <View style={styles.reinvestLine} />}
            </View>
            <View style={styles.reinvestContent}>
              <View style={styles.reinvestTop}>
                <Text style={styles.reinvestLabel} numberOfLines={1}>{step.label}</Text>
                <Text style={styles.reinvestValue}>{step.value}</Text>
              </View>
              <View style={styles.reinvestTrack}>
                <AnimatedProgressFill progress={step.progress} color={step.color} />
              </View>
              <Text style={styles.reinvestPercent}>{Math.round(step.progress * 100)}% funded</Text>
            </View>
          </View>
        )
      })}

      <View style={{ flexDirection: 'row', gap: S.pad(8), marginTop: S.pad(4) }}>
        <View style={[styles.summaryChip, { backgroundColor: '#F0FDF4' }]}>
          <Text style={[styles.summaryChipValue, { color: '#166534' }]}>{streak}d</Text>
          <Text style={[styles.summaryChipLabel, { color: '#16A34A' }]}>Streak</Text>
        </View>
        <View style={[styles.summaryChip, { backgroundColor: '#FFF1F2' }]}>
          <Text style={[styles.summaryChipValue, { color: '#991B1B' }]}>{totalMissed}</Text>
          <Text style={[styles.summaryChipLabel, { color: '#EF4444' }]}>Missed</Text>
        </View>
        <View style={[styles.summaryChip, { backgroundColor: '#F0FDF4' }]}>
          <Text style={[styles.summaryChipValue, { color: '#166534' }]}>{stats.exceeded}</Text>
          <Text style={[styles.summaryChipLabel, { color: '#16A34A' }]}>Exceeded</Text>
        </View>
      </View>
    </Animated.View>
  )
}

function TransactionCard({ index }: { index: number }) {
  const animStyle = useStaggerEntry(index, 90)
  const { style: pressStyle, onPressIn, onPressOut } = usePressScale()
  const records = useRecoveryStore((s) => s.records)
  const now = new Date()

  /* Build activity list from store records */
  const activity = Object.entries(records)
    .filter(([dateStr]) => {
      const [y, m, d] = dateStr.split('-').map(Number)
      const dDate = new Date(y, m - 1, d)
      return dDate <= now && dDate >= new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
    })
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 5)
    .map(([dateStr, rec]) => {
      const [y, m, d] = dateStr.split('-').map(Number)
      const date = new Date(y, m - 1, d)
      const dayDiff = Math.floor((now.getTime() - date.getTime()) / 86400000)
      const timeStr = dayDiff === 0 ? 'Today' : dayDiff === 1 ? 'Yesterday' : `${dayDiff} days ago`
      if (rec.status === 'completed') {
        return { title: `Weekly savings contribution`, amount: `+${rec.amount ? '\u20A6' + rec.amount.toLocaleString() : ''}`, positive: true, status: 'Verified', time: timeStr }
      }
      if (rec.status === 'exceeded') {
        return { title: `Extra savings added to recovery`, amount: `+${rec.amount ? '\u20A6' + rec.amount.toLocaleString() : ''}`, positive: true, status: 'Verified', time: timeStr }
      }
      if (rec.status === 'partial') {
        return { title: `Partial contribution`, amount: `+${rec.amount ? '\u20A6' + rec.amount.toLocaleString() : ''}`, positive: true, status: 'Pending', time: timeStr }
      }
      if (rec.status === 'missed') {
        return { title: `Missed contribution`, amount: '-₦85,000', positive: false, status: 'Missed', time: timeStr }
      }
      return null
    })
    .filter(Boolean) as { title: string; amount: string; positive: boolean; status: string; time: string }[]

  if (activity.length === 0) return null

  const statusColors: Record<string, { bg: string; text: string }> = {
    Verified: { bg: '#E8F5E9', text: '#2E7D32' },
    Pending: { bg: '#FFFBEB', text: '#F59E0B' },
    Missed: { bg: '#FFF1F2', text: '#EF4444' },
  }

  return (
    <Animated.View style={[animStyle, pressStyle, styles.txCard]} onTouchStart={onPressIn} onTouchEnd={onPressOut}>
      <View style={styles.secHead}>
        <Text style={styles.secTitle}>Capital Activity</Text>
        <Text style={styles.secLink}>{activity.length} entries</Text>
      </View>

      {activity.map((tx, i) => {
        const sc = statusColors[tx.status] || { bg: '#F1F5F9', text: '#64748B' }
        return (
          <View key={i} style={[styles.txRow, i === activity.length - 1 && { borderBottomWidth: 0 }]}>
            <View style={styles.txLeft}>
              <Text style={styles.txTitle} numberOfLines={1}>{tx.title}</Text>
              <View style={styles.txMeta}>
                <Text style={styles.txTime}>{tx.time}</Text>
                <View style={[styles.txStatusPill, { backgroundColor: sc.bg }]}>
                  <Text style={[styles.txStatusText, { color: sc.text }]}>{tx.status}</Text>
                </View>
              </View>
            </View>
            <Text style={[styles.txAmount, { color: tx.positive ? '#16A34A' : '#EF4444' }]}>{tx.amount}</Text>
          </View>
        )
      })}
    </Animated.View>
  )
}



function GrowthTargetCard({ index }: { index: number }) {
  const animStyle = useStaggerEntry(index, 100)
  const { style: pressStyle, onPressIn, onPressOut } = usePressScale()
  const records = useRecoveryStore((s) => s.records)

  let totalSaved = 0
  for (const key in records) {
    const r = records[key]
    if (r.amount && (r.status === 'completed' || r.status === 'exceeded')) totalSaved += r.amount
  }

  const targets = GROWTH_TARGETS.map((g) => {
    const saved = Math.round(totalSaved * (g.progress * 0.3 + 0.1))
    const progress = Math.min(saved / parseInt(g.target.replace(/[^0-9]/g, '')), 1)
    return { ...g, saved: '\u20A6' + saved.toLocaleString(), progress }
  })

  return (
    <Animated.View style={[animStyle, pressStyle, styles.goalCard]} onTouchStart={onPressIn} onTouchEnd={onPressOut}>
      <View style={styles.secHead}>
        <Text style={styles.secTitle}>Growth Targets</Text>
        <Text style={styles.secLink}>See All</Text>
      </View>

      {targets.map((goal, i) => (
        <View key={goal.title} style={[styles.goalRow, i === targets.length - 1 && { borderBottomWidth: 0 }]}>
          <View style={styles.goalTop}>
            <View style={styles.goalHeadLeft}>
              <View style={[styles.goalIconWrap, { backgroundColor: `${goal.color}15` as any }]}>
                <GoonaIcon icon={Target} size={18} color="#2E7D32" />
              </View>
              <View style={styles.goalInfo}>
                <Text style={styles.goalTitle}>{goal.title}</Text>
                <Text style={styles.goalTimeline}>{goal.timeline}</Text>
              </View>
            </View>
            <Text style={styles.goalPercent}>{Math.round(goal.progress * 100)}%</Text>
          </View>
          <View style={styles.goalTrack}>
            <AnimatedProgressFill progress={goal.progress} color={goal.color} />
          </View>
          <View style={styles.goalMeta}>
            <Text style={styles.goalSaved}>{goal.saved} recovered</Text>
            <Text style={styles.goalTarget}>Target: {goal.target}</Text>
          </View>
        </View>
      ))}
    </Animated.View>
  )
}

function QuickActionButton({ label, icon, index, onPress }: { label: string; icon: React.ReactNode; index: number; onPress?: () => void }) {
  const animStyle = useStaggerEntry(index, 60)
  const s1 = useSharedValue(1)
  const o1 = useSharedValue(1)
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: s1.value }], opacity: o1.value }))
  return (
    <Animated.View style={[animStyle, pressStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => { s1.value = withSpring(0.96, { damping: 15, stiffness: 200 }); o1.value = withTiming(0.85, { duration: 100 }) }}
        onPressOut={() => { s1.value = withSpring(1, { damping: 15, stiffness: 200 }); o1.value = withTiming(1, { duration: 100 }) }}
        style={styles.quickAction}
      >
        <View style={styles.quickActionIcon}>
          {icon}
        </View>
        <Text style={styles.quickActionLabel}>{label}</Text>
      </Pressable>
    </Animated.View>
  )
}

export default function RecapitalizationDashboardScreen() {
  const insets = useSafeAreaInsets()
  const [keyboardH, setKeyboardH] = useState(0)

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardWillShow', e => setKeyboardH(e.endCoordinates.height))
    const hideSub = Keyboard.addListener('keyboardWillHide', () => setKeyboardH(0))
    return () => { showSub.remove(); hideSub.remove() }
  }, [])

  const TOP = insets.top
  const TOP_BAR_H = 56

  const [checkInDate, setCheckInDate] = useState<Date | null>(null)
  const [showCheckIn, setShowCheckIn] = useState(false)
  const handleDayPress = useCallback((d: Date) => {
    setCheckInDate(d)
    setShowCheckIn(true)
  }, [])

  const records = useRecoveryStore((s) => s.records)
  const now = new Date()
  let totalSaved = 0
  let totalExceeded = 0
  let totalPartial = 0
  let missedCount = 0
  for (const key in records) {
    const r = records[key]
    if (r.amount) {
      if (r.status === 'completed') totalSaved += r.amount
      else if (r.status === 'exceeded') { totalSaved += r.amount; totalExceeded += r.amount }
      else if (r.status === 'partial') totalPartial += r.amount
    }
    if (r.status === 'missed') missedCount++
  }
  const weekRecovery = Math.round(totalSaved / Math.max(1, missedCount + 1))
  const finItems = [
    { label: 'Weekly Capital Recovery', value: `₦${weekRecovery.toLocaleString()}`, trend: '+12%', trendUp: true, color: '#16A34A', bars: [30, 45, 55, 40, 65], bg: '#F0FDF4' },
    { label: 'Allocated Capital', value: `₦${totalSaved.toLocaleString()}`, trend: '+8%', trendUp: true, color: '#1A56FF', bars: [50, 60, 45, 55, 70], bg: '#EEF3FF' },
    { label: 'Partial Contributions', value: `₦${totalPartial.toLocaleString()}`, trend: '+2%', trendUp: true, color: '#F59E0B', bars: [40, 35, 50, 45, 30], bg: '#FFFBEB' },
    { label: 'Operational Reserve', value: `₦${Math.round(totalSaved * 0.25).toLocaleString()}`, trend: '+5%', trendUp: true, color: '#7C3AED', bars: [20, 35, 40, 50, 65], bg: '#F3E8FF' },
  ]

  return (
    <View style={styles.container}>
      <BlurView
        intensity={55}
        tint="light"
        style={[styles.headerBlur, { paddingTop: TOP + 8 }]}
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1, marginRight: S.pad(12) }}>
            <Text style={styles.headerTitle}>Recapitalization</Text>
            <Text style={styles.headerSub}>Plan your production capital recovery</Text>
          </View>
          <TouchableOpacity style={styles.headerBtn} activeOpacity={0.7} onPress={() => router.push('/recapt-notifications')}>
            <AnimatedBell />
          </TouchableOpacity>
        </View>
      </BlurView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollInner,
          { paddingTop: TOP + TOP_BAR_H + S.pad(28), paddingBottom: Math.max(keyboardH, insets.bottom + 140) },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <RecapitalizationHeroCard index={0} />

        <View style={styles.sectionHead}>
          <Text style={styles.secTitle}>Financial Overview</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizScrollInner}
        >
          {finItems.map((item, i) => (
            <FinancialOverviewCard key={item.label} item={item} index={i} />
          ))}
        </ScrollView>

        <View style={styles.sectionHead}>
          <Text style={styles.secTitle}>Quick Actions</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizScrollInner}
        >
          <QuickActionButton label="Plan Recapt" icon={<GoonaIcon icon={Plus} size={18} color="#16A34A" />} index={0} onPress={() => router.push('/plan-recapt')} />
          <QuickActionButton label="Allocate Profit" icon={<GoonaIcon icon={ShieldCheck} size={18} color="#2E7D32" />} index={1} />
          <QuickActionButton label="View Forecast" icon={<GoonaIcon icon={TrendingUp} size={18} color="#2E7D32" />} index={2} />
          <QuickActionButton label="Generate Report" icon={<GoonaIcon icon={FileText} size={18} color="#2E7D32" />} index={3} />
        </ScrollView>

        <RecoveryTrackerCalendar index={1} onDayPress={handleDayPress} />
        <RecapitalizationProgressCard index={2} />
        <TransactionCard index={3} />

        <GoonaIqRecoveryInsight index={4} />

        <GrowthTargetCard index={5} />
      </ScrollView>

      <RecoveryCheckInModal
        visible={showCheckIn}
        date={checkInDate}
        onClose={() => setShowCheckIn(false)}
      />

      <BottomDock hidden={keyboardH > 0} />
    </View>
  )
}

function GoonaIqRecoveryInsight({ index }: { index: number }) {
  const animStyle = useStaggerEntry(index, 105)
  const records = useRecoveryStore((s) => s.records)
  const messages = generateInsights(records)
  const streak = computeStreak(records)
  const now = new Date()
  const stats = computeMonthlyStats(records, now.getFullYear(), now.getMonth())
  const totalDays = now.getDate()
  const completedDays = stats.completed + stats.exceeded
  const consistency = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0

  if (messages.length === 0 && streak === 0) return null
  return (
    <Animated.View style={[animStyle, styles.behaviorCard]}>
      <View style={styles.secHead}>
        <Text style={styles.secTitle}>{'\u{1F9E0}'} GOONA IQ Recovery Insight</Text>
      </View>
      <View style={styles.insightMetaRow}>
        <View style={[styles.behaviorChip, { backgroundColor: '#F0FDF4' }]}>
          <Text style={[styles.behaviorChipValue, { color: '#166534' }]}>{consistency}%</Text>
          <Text style={[styles.behaviorChipLabel, { color: '#16A34A' }]}>Consistency</Text>
        </View>
        <View style={[styles.behaviorChip, { backgroundColor: '#FFFBEB' }]}>
          <Text style={[styles.behaviorChipValue, { color: '#92400E' }]}>{streak}d</Text>
          <Text style={[styles.behaviorChipLabel, { color: '#D97706' }]}>Streak</Text>
        </View>
        <View style={[styles.behaviorChip, { backgroundColor: '#FFF1F2' }]}>
          <Text style={[styles.behaviorChipValue, { color: '#991B1B' }]}>{stats.missed}</Text>
          <Text style={[styles.behaviorChipLabel, { color: '#EF4444' }]}>Missed</Text>
        </View>
      </View>
      {messages.map((msg, i) => (
        <View key={i} style={[styles.behaviorRow, i === messages.length - 1 && { borderBottomWidth: 0 }]}>
          <View style={styles.behaviorIconWrap}>
            <GoonaIcon icon={Sparkles} size={16} color="#2E7D32" />
          </View>
          <Text style={styles.behaviorText}>{msg}</Text>
        </View>
      ))}
      {consistency >= 80 && (
        <View style={[styles.achievementBanner, { backgroundColor: '#F0FDF4', borderLeftColor: '#16A34A' }]}>
          <Text style={[styles.achievementText, { color: '#166534' }]}>{'\u{1F3C6}'} Strong recovery discipline. You are on track for timely production cycle restart.</Text>
        </View>
      )}
      {stats.missed > 0 && (
        <View style={[styles.warningBanner, { backgroundColor: '#FFF1F2', borderLeftColor: '#EF4444' }]}>
          <Text style={[styles.warningText, { color: '#991B1B' }]}>{'\u26A0\uFE0F'} Missing contributions delays your restart timeline. Try to stay consistent.</Text>
        </View>
      )}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAF7' },
  progressFill: { height: '100%', borderRadius: 100 },

  headerBlur: {
    position: 'absolute', left: 0, right: 0, zIndex: 10,
    borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.04)',
    paddingBottom: S.pad(12),
  },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: S.pad(20),
  },
  headerTitle: { fontSize: S.font(S.isSmall ? 22 : 28), fontWeight: '800', color: '#1B1B1B' },
  headerSub: { fontSize: S.font(S.isSmall ? 11 : 13), color: '#A0AEA1', marginTop: 1 },
  headerBtn: {
    width: S.scale(42), height: S.scale(42), borderRadius: S.scale(21), backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 14, elevation: 3,
  },

  scroll: { flex: 1 },
  scrollInner: { paddingHorizontal: S.pad(20) },
  sectionHead: { marginTop: S.pad(S.isSmall ? 16 : 22), marginBottom: S.pad(S.isSmall ? 8 : 12) },
  horizScrollInner: { gap: S.pad(12), paddingRight: S.pad(20), paddingVertical: S.pad(4) },

  secHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: S.pad(14) },
  secTitle: { fontSize: S.font(S.isSmall ? 16 : 18), fontWeight: '700', color: '#1F2937' },
  secLink: { fontSize: S.font(S.isSmall ? 11 : 13), fontWeight: '500', color: '#2E7D32' },

  heroCard: {
    borderRadius: S.scale(30), padding: S.pad(S.isSmall ? 18 : 24), marginTop: S.pad(6), overflow: 'hidden',
    shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 18 }, shadowOpacity: 0.25, shadowRadius: 40, elevation: 8,
  },
  heroBgCircle1: {
    position: 'absolute', top: -30, right: -30, width: S.scale(180), height: S.scale(180),
    borderRadius: S.scale(90), backgroundColor: 'rgba(255,255,255,0.04)',
  },
  heroBgCircle2: {
    position: 'absolute', bottom: -40, left: -20, width: S.scale(140), height: S.scale(140),
    borderRadius: S.scale(70), backgroundColor: 'rgba(174,234,0,0.06)',
  },
  heroHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 },
  heroLabel: { fontSize: S.font(11), fontWeight: '600', color: 'rgba(255,255,255,0.7)', letterSpacing: 1.2 },
  heroAmount: { fontSize: S.font(S.isSmall ? 26 : 32), fontWeight: '800', color: 'white', marginTop: 2, flexShrink: 1 },
  heroRingWrap: { width: S.scale(88), height: S.scale(88), alignItems: 'center', justifyContent: 'center' },
  heroRingText: {
    position: 'absolute', fontSize: S.font(S.isSmall ? 14 : 16), fontWeight: '800', color: '#AEEA00',
    textAlign: 'center', width: S.scale(88), top: S.scale(34),
  },
  heroStatus: { fontSize: S.font(S.isSmall ? 11 : 13), color: 'rgba(255,255,255,0.75)', marginTop: S.pad(14), zIndex: 1 },
  heroPills: { flexDirection: 'row', gap: S.pad(8), marginTop: S.pad(14), zIndex: 1, flexWrap: 'wrap' },
  heroPill: {
    paddingVertical: S.pad(5), paddingHorizontal: S.pad(14), borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  heroPillText: { fontSize: S.font(S.isSmall ? 10 : 11), fontWeight: '600', color: 'rgba(255,255,255,0.9)' },
  heroGlow: {
    position: 'absolute', bottom: -40, right: -20,
    width: S.scale(200), height: S.scale(200), borderRadius: S.scale(100),
    backgroundColor: 'rgba(174,234,0,0.08)',
  },

  finCard: {
    width: CARD_HORIZ_W, backgroundColor: 'white', borderRadius: S.scale(24), padding: S.pad(16),
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05, shadowRadius: 20, elevation: 2,
  },
  finCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  finIconWrap: { width: S.scale(34), height: S.scale(34), borderRadius: S.scale(12), alignItems: 'center', justifyContent: 'center' },
  finTrend: { fontSize: S.font(11), fontWeight: '700' },
  finValue: { fontSize: S.font(18), fontWeight: '800', color: '#1F2937', marginTop: S.pad(8) },
  finLabel: { fontSize: S.font(11), color: '#64748B', marginTop: 1 },
  finBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: S.scale(22), marginTop: S.pad(8) },
  finBar: { width: 5, borderRadius: 2 },

  quickAction: {
    width: S.isSmall ? 90 : S.isTablet ? 120 : 100, height: S.isSmall ? 80 : S.isTablet ? 100 : 90,
    backgroundColor: 'white', borderRadius: S.scale(22),
    alignItems: 'center', justifyContent: 'center', padding: S.pad(12),
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05, shadowRadius: 20, elevation: 2,
  },
  quickActionIcon: {
    width: S.scale(40), height: S.scale(40), borderRadius: S.scale(14), backgroundColor: '#F0FDF4',
    alignItems: 'center', justifyContent: 'center',
  },
  quickActionLabel: { fontSize: S.font(S.isSmall ? 10 : 11), fontWeight: '600', color: '#1F2937', marginTop: S.pad(8), textAlign: 'center' },

  calCard: {
    backgroundColor: 'white', borderRadius: S.scale(28), padding: S.pad(S.isSmall ? 16 : 20), marginTop: S.pad(6),
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06, shadowRadius: 28, elevation: 3,
  },
  calNavRow: { flexDirection: 'row', alignItems: 'center', gap: S.pad(8) },
  calNavBtn: { width: S.scale(32), height: S.scale(32), borderRadius: S.scale(16), backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  calTitle: { fontSize: S.font(S.isSmall ? 14 : 16), fontWeight: '700', color: '#1F2937' },
  calSub: { fontSize: S.font(11), color: '#94A3B8', marginTop: 1 },
  calStreak: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FFFBEB', paddingVertical: S.pad(4), paddingHorizontal: S.pad(8), borderRadius: 100, flexShrink: 1 },
  calStreakText: { fontSize: S.font(S.isSmall ? 10 : 11), fontWeight: '600', color: '#F59E0B' },
  calTimeline: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    marginTop: S.pad(14), marginBottom: S.pad(6),
    backgroundColor: '#F8FAF7', borderRadius: S.scale(14), paddingVertical: S.pad(10), paddingHorizontal: S.pad(6),
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)',
  },
  calTimelineItem: { alignItems: 'center', flex: 1 },
  calTimelineDivider: { width: 1, height: S.scale(24), backgroundColor: '#E2E8E0' },
  calTimelineValue: { fontSize: S.font(S.isSmall ? 14 : 16), fontWeight: '800', color: '#1F2937' },
  calTimelineLabel: { fontSize: S.font(S.isSmall ? 8 : 9), color: '#94A3B8', marginTop: 1, textTransform: 'uppercase', letterSpacing: 0.3 },
  calDayLabels: { flexDirection: 'row', marginTop: S.pad(12), marginBottom: S.pad(6) },
  calDayLabel: { width: CAL_W, textAlign: 'center', fontSize: S.font(S.isSmall ? 9 : 10), color: '#94A3B8', fontWeight: '500' },
  calGrid: {},
  calDayCell: {
    width: CAL_W, height: S.isSmall ? 30 : 34, alignItems: 'center', justifyContent: 'center',
    borderRadius: S.scale(8),
  },
  calDayCellToday: { backgroundColor: '#E8F5E9' },
  calDayDot: { width: 5, height: 5, borderRadius: 2.5, position: 'absolute', top: 2 },
  calDayNum: { fontSize: S.font(S.isSmall ? 11 : 12), fontWeight: '500', color: '#1F2937' },
  calDayNumToday: { color: '#2E7D32', fontWeight: '700' },
  calDayPulse: {
    position: 'absolute', width: S.scale(30), height: S.scale(30), borderRadius: S.scale(15),
    borderWidth: 2, borderColor: 'rgba(46,125,50,0.2)',
  },
  calLegend: { flexDirection: 'row', gap: S.pad(10), marginTop: S.pad(10), flexWrap: 'wrap' },
  calLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  calLegendDot: { width: S.scale(6), height: S.scale(6), borderRadius: 3 },
  calLegendText: { fontSize: S.font(S.isSmall ? 8 : 9), color: '#94A3B8' },

  /* Day Detail Modal */
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' },
  modalSheet: {
    backgroundColor: 'white', borderTopLeftRadius: S.scale(28), borderTopRightRadius: S.scale(28),
    padding: S.pad(20), paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.08, shadowRadius: 30, elevation: 10,
  },
  modalHandleRow: { alignItems: 'center', marginBottom: S.pad(8) },
  modalHandle: { width: S.scale(40), height: 4, borderRadius: 2, backgroundColor: '#D1D5DB' },
  modalCloseBtn: {
    position: 'absolute', top: S.pad(16), right: S.pad(16),
    width: S.scale(32), height: S.scale(32), borderRadius: S.scale(16),
    backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center',
  },
  modalDateHead: { alignItems: 'center', marginBottom: S.pad(16) },
  modalDateDay: { fontSize: S.font(14), fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: 1 },
  modalDateFull: { fontSize: S.font(22), fontWeight: '800', color: '#1F2937', marginTop: S.pad(2) },
  modalStatusBadge: { paddingVertical: S.pad(4), paddingHorizontal: S.pad(14), borderRadius: 50, marginTop: S.pad(8) },
  modalStatusText: { fontSize: S.font(12), fontWeight: '700' },
  modalAmountSection: {
    backgroundColor: '#F8FAF7', borderRadius: S.scale(16), padding: S.pad(16), marginBottom: S.pad(14),
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)',
  },
  modalAmountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: S.pad(4) },
  modalAmountLabel: { fontSize: S.font(12), color: '#64748B' },
  modalAmountValue: { fontSize: S.font(15), fontWeight: '700', color: '#1F2937' },
  modalInsight: {
    backgroundColor: '#F0FDF4', borderRadius: S.scale(16), padding: S.pad(14), marginBottom: S.pad(16),
    borderLeftWidth: 3, borderLeftColor: '#2E7D32',
  },
  modalInsightHeader: { flexDirection: 'row', alignItems: 'center', gap: S.pad(6), marginBottom: S.pad(6) },
  modalInsightLabel: { fontSize: S.font(10), fontWeight: '700', color: '#2E7D32' },
  modalInsightText: { fontSize: S.font(12), color: '#374151', lineHeight: 18 },
  modalActionBtn: { borderRadius: S.scale(14), overflow: 'hidden' },
  modalActionGrad: { paddingVertical: S.pad(14), alignItems: 'center' },
  modalActionText: { fontSize: S.font(15), fontWeight: '700', color: '#fff' },

  reinvestCard: {
    backgroundColor: 'white', borderRadius: S.scale(28), padding: S.pad(S.isSmall ? 16 : 20), marginTop: S.pad(18),
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06, shadowRadius: 28, elevation: 3,
  },
  reinvestRow: { flexDirection: 'row', marginBottom: S.pad(20) },
  reinvestLeft: { width: 20, alignItems: 'center', position: 'relative' },
  reinvestDot: { width: S.scale(10), height: S.scale(10), borderRadius: S.scale(5), marginTop: S.pad(4), borderWidth: 2, borderColor: '#F8FAF7', zIndex: 1 },
  reinvestLine: { position: 'absolute', top: S.pad(14), bottom: -S.pad(20), width: 2, backgroundColor: '#E8ECEE' },
  reinvestContent: { flex: 1, marginLeft: S.pad(10) },
  reinvestTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reinvestLabel: { fontSize: S.font(S.isSmall ? 13 : 14), fontWeight: '600', color: '#1F2937', flex: 1 },
  reinvestValue: { fontSize: S.font(S.isSmall ? 13 : 14), fontWeight: '800', color: '#1F2937', flexShrink: 0, marginLeft: S.pad(4) },
  reinvestTrack: { height: S.scale(6), backgroundColor: '#F1F5F9', borderRadius: 100, marginTop: S.pad(6), overflow: 'hidden' },
  reinvestFill: { height: '100%', borderRadius: 100 },
  reinvestPercent: { fontSize: S.font(11), color: '#94A3B8', marginTop: S.pad(3) },

  txCard: {
    backgroundColor: 'white', borderRadius: S.scale(28), padding: S.pad(S.isSmall ? 16 : 20), marginTop: S.pad(18),
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06, shadowRadius: 28, elevation: 3,
  },
  txRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: S.pad(12), borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  txLeft: { flex: 1, marginRight: S.pad(12) },
  txTitle: { fontSize: S.font(S.isSmall ? 13 : 14), fontWeight: '600', color: '#1F2937' },
  txMeta: { flexDirection: 'row', alignItems: 'center', gap: S.pad(4), marginTop: S.pad(4) },
  txTime: { fontSize: S.font(11), color: '#94A3B8' },
  txStatusPill: { paddingVertical: 1, paddingHorizontal: S.pad(8), borderRadius: 100 },
  txStatusText: { fontSize: S.font(9), fontWeight: '600' },
  txAmount: { fontSize: S.font(15), fontWeight: '700', flexShrink: 0 },

  goalCard: {
    backgroundColor: 'white', borderRadius: S.scale(28), padding: S.pad(S.isSmall ? 16 : 20), marginTop: S.pad(18),
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06, shadowRadius: 28, elevation: 3,
  },
  goalRow: {
    paddingVertical: S.pad(14), borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  goalTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  goalHeadLeft: { flexDirection: 'row', alignItems: 'center', gap: S.pad(10), flex: 1 },
  goalIconWrap: { width: S.scale(36), height: S.scale(36), borderRadius: S.scale(12), alignItems: 'center', justifyContent: 'center' },
  goalInfo: { flex: 1 },
  goalTitle: { fontSize: S.font(S.isSmall ? 13 : 14), fontWeight: '600', color: '#1F2937' },
  goalTimeline: { fontSize: S.font(11), color: '#94A3B8', marginTop: 1 },
  goalPercent: { fontSize: S.font(16), fontWeight: '800', color: '#1F2937' },
  goalTrack: { height: S.scale(6), backgroundColor: '#F1F5F9', borderRadius: 100, marginTop: S.pad(10), overflow: 'hidden' },
  goalFill: { height: '100%', borderRadius: 100 },
  goalMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: S.pad(6) },
  goalSaved: { fontSize: S.font(11), color: '#64748B' },
  goalTarget: { fontSize: S.font(11), color: '#94A3B8' },

  behaviorCard: {
    backgroundColor: 'white', borderRadius: S.scale(28), padding: S.pad(S.isSmall ? 16 : 20), marginTop: S.pad(18),
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06, shadowRadius: 28, elevation: 3,
  },
  behaviorRow: {
    flexDirection: 'row', gap: S.pad(10),
    paddingVertical: S.pad(12), borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
    alignItems: 'flex-start',
  },
  behaviorIconWrap: { width: 20, height: 20, marginTop: S.pad(1) },
  behaviorText: { fontSize: S.font(S.isSmall ? 12 : 13), fontWeight: '500', color: '#1F2937', lineHeight: 19, flex: 1 },
  behaviorChip: {
    flex: 1, borderRadius: S.scale(12), padding: S.pad(10), alignItems: 'center',
  },
  behaviorChipValue: { fontSize: S.font(S.isSmall ? 16 : 18), fontWeight: '800' },
  behaviorChipLabel: { fontSize: S.font(S.isSmall ? 8 : 9), fontWeight: '600' },
  achievementBanner: { marginTop: S.pad(10), padding: S.pad(10), borderRadius: S.scale(12), borderLeftWidth: 3 },
  achievementText: { fontSize: S.font(11), fontWeight: '600' },
  warningBanner: { marginTop: S.pad(10), padding: S.pad(10), borderRadius: S.scale(12), borderLeftWidth: 3 },
  warningText: { fontSize: S.font(11), fontWeight: '600' },
  overallText: { fontSize: S.font(11), color: '#64748B' },
  overallTargetText: { fontSize: S.font(11), color: '#94A3B8' },
  summaryChip: { flex: 1, borderRadius: S.scale(10), padding: S.pad(8), alignItems: 'center' },
  summaryChipValue: { fontSize: S.font(13), fontWeight: '700' },
  summaryChipLabel: { fontSize: S.font(9) },
  insightMetaRow: { flexDirection: 'row', gap: S.pad(8), marginBottom: S.pad(14) },
})


