import React, { useEffect, useState, useCallback, useRef } from 'react'
import {
  View, Text, TouchableOpacity, Pressable, ScrollView,
  StyleSheet, Dimensions, Keyboard, PanResponder, Modal, Platform,
} from 'react-native'
import { router } from 'expo-router'
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg'
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
  computeStreak, generateInsights,
} from '../../../store/useRecoveryStore'

const { width: SCREEN_W } = Dimensions.get('window')
const CARD_HORIZ_W = 148
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
        <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <Path d="M10 3C7.2 3 5 5.2 5 8V12.5L3.5 15H16.5L15 12.5V8C15 5.2 12.8 3 10 3Z" stroke={count > 0 ? '#DC2626' : '#1F2937'} strokeWidth="1.5" fill="none" />
          <Path d="M8.5 15C8.5 15.8 9.2 16.5 10 16.5C10.8 16.5 11.5 15.8 11.5 15" stroke={count > 0 ? '#DC2626' : '#1F2937'} strokeWidth="1.5" strokeLinecap="round" fill="none" />
        </Svg>
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

function MoreIcon() {
  return (
    <Svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <Circle cx="9" cy="5" r="1.2" fill="#1F2937" />
      <Circle cx="9" cy="9" r="1.2" fill="#1F2937" />
      <Circle cx="9" cy="13" r="1.2" fill="#1F2937" />
    </Svg>
  )
}

function NairaIcon() {
  return (
    <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <Rect x="3" y="4" width="14" height="12" rx="2" stroke="#2E7D32" strokeWidth="1.5" fill="none" />
      <Line x1="7" y1="7" x2="7" y2="13" stroke="#2E7D32" strokeWidth="1.3" strokeLinecap="round" />
      <Line x1="13" y1="7" x2="13" y2="13" stroke="#2E7D32" strokeWidth="1.3" strokeLinecap="round" />
      <Line x1="6" y1="9.5" x2="14" y2="9.5" stroke="#2E7D32" strokeWidth="1.3" strokeLinecap="round" />
      <Line x1="6" y1="11.5" x2="14" y2="11.5" stroke="#2E7D32" strokeWidth="1.3" strokeLinecap="round" />
    </Svg>
  )
}

function ArrowUpIcon() {
  return (
    <Svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <Path d="M7 11V3" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M3.5 6.5L7 3L10.5 6.5" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

function ArrowDownIcon() {
  return (
    <Svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <Path d="M7 3V11" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M10.5 7.5L7 11L3.5 7.5" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

function LockSmallIcon() {
  return (
    <Svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <Rect x="2" y="4.5" width="6" height="4" rx="0.8" stroke="#94A3B8" strokeWidth="0.8" fill="none" />
      <Path d="M3.5 4.5V3.5C3.5 2.8 4 2.5 5 2.5C6 2.5 6.5 2.8 6.5 3.5V4.5" stroke="#94A3B8" strokeWidth="0.8" fill="none" />
    </Svg>
  )
}

function CheckSmallIcon() {
  return (
    <Svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <Circle cx="6" cy="6" r="4.5" stroke="#0F766E" strokeWidth="1" fill="none" />
      <Path d="M4 6L5.5 7.5L8 4.5" stroke="#0F766E" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

function FlameIcon() {
  return (
    <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <Path d="M8 14C10.5 14 12.5 11.5 12.5 9C12.5 6.5 10 4 8 2C6 4 3.5 6.5 3.5 9C3.5 11.5 5.5 14 8 14Z" stroke="#F59E0B" strokeWidth="1.3" strokeLinejoin="round" fill="#FFFBEB" />
    </Svg>
  )
}

function SparkleIcon() {
  return (
    <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <Path d="M8 2L9.5 6.5L14 8L9.5 9.5L8 14L6.5 9.5L2 8L6.5 6.5L8 2Z" stroke="#2E7D32" strokeWidth="1.2" strokeLinejoin="round" fill="rgba(46,125,50,0.08)" />
    </Svg>
  )
}

function AddIcon() {
  return (
    <Svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <Line x1="9" y1="4.5" x2="9" y2="13.5" stroke="#16A34A" strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="4.5" y1="9" x2="13.5" y2="9" stroke="#16A34A" strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  )
}

function ProfitIcon() {
  return (
    <Svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <Rect x="3" y="8" width="12" height="7" rx="1.5" stroke="#2E7D32" strokeWidth="1.4" fill="none" />
      <Path d="M6 8V6C6 4.3 7.3 3 9 3C10.7 3 12 4.3 12 6V8" stroke="#2E7D32" strokeWidth="1.4" fill="none" />
    </Svg>
  )
}

function ForecastIcon() {
  return (
    <Svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <Line x1="3" y1="15" x2="15" y2="15" stroke="#2E7D32" strokeWidth="1.4" strokeLinecap="round" />
      <Path d="M5 12L7.5 8L10 10L13 5" stroke="#2E7D32" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="14" cy="4" r="1.2" stroke="#2E7D32" strokeWidth="1" />
    </Svg>
  )
}

function ReportIcon() {
  return (
    <Svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <Rect x="4" y="3" width="10" height="12" rx="1.5" stroke="#2E7D32" strokeWidth="1.4" fill="none" />
      <Line x1="6.5" y1="6.5" x2="11.5" y2="6.5" stroke="#2E7D32" strokeWidth="1.2" strokeLinecap="round" />
      <Line x1="6.5" y1="9" x2="10" y2="9" stroke="#2E7D32" strokeWidth="1.2" strokeLinecap="round" />
      <Line x1="6.5" y1="11.5" x2="9" y2="11.5" stroke="#2E7D32" strokeWidth="1.2" strokeLinecap="round" />
    </Svg>
  )
}

function TargetIcon() {
  return (
    <Svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <Circle cx="9" cy="9" r="6" stroke="#2E7D32" strokeWidth="1.4" fill="none" />
      <Circle cx="9" cy="9" r="3" stroke="#2E7D32" strokeWidth="1.2" fill="none" />
      <Circle cx="9" cy="9" r="1.2" fill="#2E7D32" />
    </Svg>
  )
}

const FINANCIAL_OVERVIEW = [
  { label: 'Weekly Capital Recovery', value: '₦85,000', trend: '+12%', trendUp: true, color: '#16A34A', bars: [30, 45, 55, 40, 65], bg: '#F0FDF4' },
  { label: 'Allocated Capital', value: '₦240,000', trend: '+8%', trendUp: true, color: '#1A56FF', bars: [50, 60, 45, 55, 70], bg: '#EEF3FF' },
  { label: 'Feed Budget', value: '₦128,000', trend: '-3%', trendUp: false, color: '#F59E0B', bars: [40, 35, 50, 45, 30], bg: '#FFFBEB' },
  { label: 'Operational Reserve', value: '₦500,000', trend: '+5%', trendUp: true, color: '#7C3AED', bars: [20, 35, 40, 50, 65], bg: '#F3E8FF' },
]

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const RECAPITALIZATION_STEPS = [
  { label: 'Next Cycle Capital', value: '₦1.8M', progress: 1, color: '#2E7D32' },
  { label: 'Feed & Medication Fund', value: '₦950k', progress: 0.72, color: '#16A34A' },
  { label: 'Infrastructure Budget', value: '₦420k', progress: 0.45, color: '#1A56FF' },
  { label: 'Emergency Reserve', value: '₦500k', progress: 0.88, color: '#7C3AED' },
]

const TRANSACTIONS = [
  { title: 'Weekly capital recovery deposit', amount: '+₦85,000', positive: true, status: 'Verified', time: 'Today, 9:00 AM', immutable: true },
  { title: 'Feed budget allocation', amount: '-₦128,000', positive: false, status: 'Synced', time: 'Yesterday, 2:15 PM', immutable: true },
  { title: 'Cycle profit allocation', amount: '+₦200,000', positive: true, status: 'Verified', time: 'Yesterday, 10:30 AM', immutable: true },
  { title: 'Operational reserve top-up', amount: '+₦50,000', positive: true, status: 'Pending', time: '2 days ago', immutable: false },
]

const INSIGHTS = [
  { headline: 'Capital recovery is 18% ahead of target', sub: 'Consistent weekly recovery is building strong financial runway for the next batch.', barColor: '#16A34A', bars: [0.3, 0.45, 0.5, 0.6, 0.75, 0.85, 0.95] },
  { headline: 'Feed costs projected to drop 5% next month', sub: 'Market analysis shows declining grain prices — accelerate capital recovery.', barColor: '#1A56FF', bars: [0.6, 0.55, 0.5, 0.45, 0.4, 0.35, 0.3] },
]

const GROWTH_TARGETS = [
  { title: 'New Poultry House', target: '₦2.5M', saved: '₦1.2M', progress: 0.48, timeline: 'Q3 2026', color: '#2E7D32' },
  { title: 'Feed Mill Setup', target: '₦1.8M', saved: '₦450k', progress: 0.25, timeline: 'Q1 2027', color: '#1A56FF' },
  { title: 'Cold Storage Unit', target: '₦800k', saved: '₦520k', progress: 0.65, timeline: 'Q4 2026', color: '#F59E0B' },
]

const AI_INSIGHTS = [
  { type: 'readiness', icon: '📊', headline: 'At your current pace, your next batch capital will be ready in 11 weeks.', sub: 'Weekly recovery of ₦85,000 puts you on track for Q3 readiness.' },
  { type: 'efficiency', icon: '⚡', headline: 'Reducing feed waste by 4% could accelerate recapitalization by 9 days.', sub: 'Optimize portioning to close the capital gap faster.' },
  { type: 'forecast', icon: '🎯', headline: 'You are 72% prepared for your next production cycle.', sub: 'Feed (85%), Medication (60%), DOC (70%), Staffing (50%).' },
]

function RecapitalizationHeroCard({ index }: { index: number }) {
  const animStyle = useStaggerEntry(index)
  const { style: pressStyle, onPressIn, onPressOut } = usePressScale()
  const progress = 0.72
  const ringCircumference = 2 * Math.PI * 38
  const strokeDashoffset = ringCircumference * (1 - progress)
  const ringAnim = useSharedValue(ringCircumference)
  useEffect(() => {
    ringAnim.value = withTiming(strokeDashoffset, { duration: 1500, easing: Easing.out(Easing.cubic) })
  }, [])

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
            <Text style={styles.heroAmount}>₦1,845,000</Text>
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

        <Text style={styles.heroStatus}>● On Track — 72% of recapitalization goal</Text>

        <View style={styles.heroPills}>
          <View style={styles.heroPill}>
            <Text style={styles.heroPillText}>Weekly: ₦85k recovery</Text>
          </View>
          <View style={[styles.heroPill, { backgroundColor: 'rgba(174,234,0,0.18)' }]}>
            <Text style={[styles.heroPillText, { color: '#AEEA00' }]}>Streak: 12w</Text>
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
  item: (typeof FINANCIAL_OVERVIEW)[0]
  index: number
}) {
  const animStyle = useStaggerEntry(index, 50)
  const { style: pressStyle, onPressIn, onPressOut } = usePressScale()
  return (
    <Animated.View style={[animStyle, pressStyle]} onTouchStart={onPressIn} onTouchEnd={onPressOut}>
      <TouchableOpacity activeOpacity={0.9} style={styles.finCard}>
        <View style={styles.finCardTop}>
          <View style={[styles.finIconWrap, { backgroundColor: item.bg }]}>
            <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <Rect x="3" y="4" width="10" height="8" rx="1.5" stroke={item.color} strokeWidth="1.3" fill="none" />
              <Line x1="5.5" y1="7" x2="10.5" y2="7" stroke={item.color} strokeWidth="1.1" strokeLinecap="round" />
            </Svg>
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
          <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <Path d="M10 12L6 8L10 4" stroke="#1F2937" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>
        <TouchableOpacity onPress={goNext} style={styles.calNavBtn} activeOpacity={0.7}>
          <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <Path d="M6 4L10 8L6 12" stroke="#1F2937" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.calTitle}>{monthName} {viewYear}</Text>
          <Text style={styles.calSub}>Capital Recovery</Text>
        </View>
        <View style={styles.calStreak}>
          <FlameIcon />
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
            <Text key={i} style={styles.calDayLabel}>{d}</Text>
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
                  if (cell === null) return <View key={`e-${w}-${i}`} style={styles.calDayCell} />
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
                      style={[styles.calDayCell, isToday && styles.calDayCellToday]}
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
            <Svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <Line x1="4" y1="4" x2="14" y2="14" stroke="#1F2937" strokeWidth="1.5" strokeLinecap="round" />
              <Line x1="14" y1="4" x2="4" y2="14" stroke="#1F2937" strokeWidth="1.5" strokeLinecap="round" />
            </Svg>
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
              <Svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <Circle cx="7" cy="7" r="5.5" stroke="#2E7D32" strokeWidth="1.2" fill="none" />
                <Line x1="7" y1="5" x2="7" y2="8" stroke="#2E7D32" strokeWidth="1.2" strokeLinecap="round" />
                <Circle cx="7" cy="10.5" r="0.6" fill="#2E7D32" />
              </Svg>
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
  return (
    <Animated.View style={[animStyle, styles.reinvestCard]}>
      <View style={styles.secHead}>
        <Text style={styles.secTitle}>Recapitalization Progress</Text>
      </View>

      {RECAPITALIZATION_STEPS.map((step, i) => {
        const isLast = i === RECAPITALIZATION_STEPS.length - 1
        return (
          <View key={step.label} style={styles.reinvestRow}>
            <View style={styles.reinvestLeft}>
              <View style={[styles.reinvestDot, { backgroundColor: step.color }]} />
              {!isLast && <View style={styles.reinvestLine} />}
            </View>
            <View style={styles.reinvestContent}>
              <View style={styles.reinvestTop}>
                <Text style={styles.reinvestLabel}>{step.label}</Text>
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
    </Animated.View>
  )
}

function TransactionCard({ index }: { index: number }) {
  const animStyle = useStaggerEntry(index, 90)
  const { style: pressStyle, onPressIn, onPressOut } = usePressScale()
  const statusColors: Record<string, { bg: string; text: string }> = {
    Verified: { bg: '#E8F5E9', text: '#2E7D32' },
    Synced: { bg: '#DDF5F0', text: '#0F766E' },
    Pending: { bg: '#FFFBEB', text: '#F59E0B' },
  }
  return (
    <Animated.View style={[animStyle, pressStyle, styles.txCard]} onTouchStart={onPressIn} onTouchEnd={onPressOut}>
      <View style={styles.secHead}>
        <Text style={styles.secTitle}>Capital Activity</Text>
        <TouchableOpacity><Text style={styles.secLink}>See All</Text></TouchableOpacity>
      </View>

      {TRANSACTIONS.map((tx, i) => {
        const sc = statusColors[tx.status] || { bg: '#F1F5F9', text: '#64748B' }
        return (
          <View key={i} style={[styles.txRow, i === TRANSACTIONS.length - 1 && { borderBottomWidth: 0 }]}>
            <View style={styles.txLeft}>
              <Text style={styles.txTitle} numberOfLines={1}>{tx.title}</Text>
              <View style={styles.txMeta}>
                {tx.immutable && <LockSmallIcon />}
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

function InsightCard({ index }: { index: number }) {
  const animStyle = useStaggerEntry(index, 110)
  const { style: pressStyle, onPressIn, onPressOut } = usePressScale()
  return (
    <Animated.View style={[animStyle, pressStyle]} onTouchStart={onPressIn} onTouchEnd={onPressOut}>
      <TouchableOpacity activeOpacity={0.9} style={styles.insightOuter}>
        {INSIGHTS.map((ins, i) => (
          <View key={i} style={[styles.insightCard, i === 0 && { marginBottom: 12 }]}>
            <View style={styles.insightTop}>
              <SparkleIcon />
              <View style={styles.insightMiniChart}>
                {ins.bars.map((h, j) => (
                  <View key={j} style={[styles.insightMiniBar, { height: `${h * 100}%` as any, backgroundColor: j === ins.bars.length - 1 ? ins.barColor : '#E2E8E0' }]} />
                ))}
              </View>
            </View>
            <Text style={styles.insightHeadline}>{ins.headline}</Text>
            <Text style={styles.insightSub}>{ins.sub}</Text>
          </View>
        ))}
        <View style={styles.insightCtaRow}>
          <Text style={styles.insightCta}>View All Insights →</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

function AISmartInsightCard({ index }: { index: number }) {
  const animStyle = useStaggerEntry(index, 105)
  return (
    <Animated.View style={[animStyle, styles.aiCard]}>
      <View style={styles.secHead}>
        <Text style={styles.secTitle}>GOONA IQ Insights</Text>
      </View>

      {AI_INSIGHTS.map((ins, i) => (
        <View key={i} style={[styles.aiRow, i === AI_INSIGHTS.length - 1 && { borderBottomWidth: 0 }]}>
          <Text style={styles.aiIcon}>{ins.icon}</Text>
          <View style={styles.aiContent}>
            <Text style={styles.aiHeadline}>{ins.headline}</Text>
            <Text style={styles.aiSub}>{ins.sub}</Text>
          </View>
        </View>
      ))}
    </Animated.View>
  )
}

function GrowthTargetCard({ index }: { index: number }) {
  const animStyle = useStaggerEntry(index, 100)
  const { style: pressStyle, onPressIn, onPressOut } = usePressScale()
  return (
    <Animated.View style={[animStyle, pressStyle, styles.goalCard]} onTouchStart={onPressIn} onTouchEnd={onPressOut}>
      <View style={styles.secHead}>
        <Text style={styles.secTitle}>Growth Targets</Text>
        <TouchableOpacity><Text style={styles.secLink}>See All</Text></TouchableOpacity>
      </View>

      {GROWTH_TARGETS.map((goal, i) => {
        return (
          <View key={goal.title} style={[styles.goalRow, i === GROWTH_TARGETS.length - 1 && { borderBottomWidth: 0 }]}>
            <View style={styles.goalTop}>
              <View style={styles.goalHeadLeft}>
                <View style={[styles.goalIconWrap, { backgroundColor: `${goal.color}15` as any }]}>
                  <TargetIcon />
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
        )
      })}
    </Animated.View>
  )
}

function QuickActionButton({ label, icon: Icon, index, onPress }: { label: string; icon: React.FC; index: number; onPress?: () => void }) {
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
          <Icon />
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

  const behavioralMessages = generateInsights(useRecoveryStore.getState().records)

  return (
    <View style={styles.container}>
      <BlurView
        intensity={55}
        tint="light"
        style={[styles.headerBlur, { paddingTop: TOP + 8 }]}
      >
        <View style={styles.headerRow}>
          <View>
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
          { paddingTop: TOP + TOP_BAR_H + 28, paddingBottom: keyboardH > 0 ? keyboardH + 140 : 160 },
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
          {FINANCIAL_OVERVIEW.map((item, i) => (
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
          <QuickActionButton label="Plan Recapt" icon={AddIcon} index={0} onPress={() => router.push('/plan-recapt')} />
          <QuickActionButton label="Allocate Profit" icon={ProfitIcon} index={1} />
          <QuickActionButton label="View Forecast" icon={ForecastIcon} index={2} />
          <QuickActionButton label="Generate Report" icon={ReportIcon} index={3} />
        </ScrollView>

        <RecoveryTrackerCalendar index={1} onDayPress={handleDayPress} />
        <RecapitalizationProgressCard index={2} />
        <TransactionCard index={3} />

        <AISmartInsightCard index={4} />

        <BehavioralInsightsCard index={5} messages={behavioralMessages} />

        <View style={styles.sectionHead}>
          <Text style={styles.secTitle}>GOONA IQ Insights</Text>
        </View>
        <InsightCard index={6} />

        <GrowthTargetCard index={6} />
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

function BehavioralInsightsCard({ index, messages }: { index: number; messages: string[] }) {
  const animStyle = useStaggerEntry(index, 105)
  if (messages.length === 0) return null
  return (
    <Animated.View style={[animStyle, styles.behaviorCard]}>
      <View style={styles.secHead}>
        <Text style={styles.secTitle}>Recovery Discipline</Text>
      </View>
      {messages.map((msg, i) => (
        <View key={i} style={[styles.behaviorRow, i === messages.length - 1 && { borderBottomWidth: 0 }]}>
          <View style={styles.behaviorIconWrap}>
            <SparkleIcon />
          </View>
          <Text style={styles.behaviorText}>{msg}</Text>
        </View>
      ))}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAF7' },
  progressFill: { height: '100%', borderRadius: 100 },

  headerBlur: {
    position: 'absolute', left: 0, right: 0, zIndex: 10,
    borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.04)',
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 20,
  },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#1B1B1B' },
  headerSub: { fontSize: 13, color: '#A0AEA1', marginTop: 1 },
  headerBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 14, elevation: 3,
  },

  scroll: { flex: 1 },
  scrollInner: { paddingHorizontal: 20 },
  sectionHead: { marginTop: 22, marginBottom: 12 },
  horizScrollInner: { gap: 12, paddingRight: 20, paddingVertical: 4 },

  secHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  secTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  secLink: { fontSize: 13, fontWeight: '500', color: '#2E7D32' },

  heroCard: {
    borderRadius: 30, padding: 24, marginTop: 6, overflow: 'hidden',
    shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 18 }, shadowOpacity: 0.25, shadowRadius: 40, elevation: 8,
  },
  heroBgCircle1: {
    position: 'absolute', top: -30, right: -30, width: 180, height: 180,
    borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.04)',
  },
  heroBgCircle2: {
    position: 'absolute', bottom: -40, left: -20, width: 140, height: 140,
    borderRadius: 70, backgroundColor: 'rgba(174,234,0,0.06)',
  },
  heroHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 },
  heroLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.7)', letterSpacing: 1.2 },
  heroAmount: { fontSize: 32, fontWeight: '800', color: 'white', marginTop: 2 },
  heroRingWrap: { width: 88, height: 88, alignItems: 'center', justifyContent: 'center' },
  heroRingText: {
    position: 'absolute', fontSize: 16, fontWeight: '800', color: '#AEEA00',
    textAlign: 'center', width: 88, top: 34,
  },
  heroStatus: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 14, zIndex: 1 },
  heroPills: { flexDirection: 'row', gap: 8, marginTop: 14, zIndex: 1, flexWrap: 'wrap' },
  heroPill: {
    paddingVertical: 5, paddingHorizontal: 14, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  heroPillText: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.9)' },
  heroGlow: {
    position: 'absolute', bottom: -40, right: -20,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(174,234,0,0.08)',
  },

  finCard: {
    width: CARD_HORIZ_W, backgroundColor: 'white', borderRadius: 24, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05, shadowRadius: 20, elevation: 2,
  },
  finCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  finIconWrap: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  finTrend: { fontSize: 11, fontWeight: '700' },
  finValue: { fontSize: 18, fontWeight: '800', color: '#1F2937', marginTop: 8 },
  finLabel: { fontSize: 11, color: '#64748B', marginTop: 1 },
  finBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 22, marginTop: 8 },
  finBar: { width: 5, borderRadius: 2 },

  quickAction: {
    width: 100, height: 90, backgroundColor: 'white', borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', padding: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05, shadowRadius: 20, elevation: 2,
  },
  quickActionIcon: {
    width: 40, height: 40, borderRadius: 14, backgroundColor: '#F0FDF4',
    alignItems: 'center', justifyContent: 'center',
  },
  quickActionLabel: { fontSize: 11, fontWeight: '600', color: '#1F2937', marginTop: 8, textAlign: 'center' },

  calCard: {
    backgroundColor: 'white', borderRadius: 28, padding: 20, marginTop: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06, shadowRadius: 28, elevation: 3,
  },
  calNavRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  calNavBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  calTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  calSub: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
  calStreak: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FFFBEB', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 100, flexShrink: 1 },
  calStreakText: { fontSize: 11, fontWeight: '600', color: '#F59E0B' },
  calTimeline: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    marginTop: 14, marginBottom: 6,
    backgroundColor: '#F8FAF7', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 6,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)',
  },
  calTimelineItem: { alignItems: 'center', flex: 1 },
  calTimelineDivider: { width: 1, height: 24, backgroundColor: '#E2E8E0' },
  calTimelineValue: { fontSize: 16, fontWeight: '800', color: '#1F2937' },
  calTimelineLabel: { fontSize: 9, color: '#94A3B8', marginTop: 1, textTransform: 'uppercase', letterSpacing: 0.3 },
  calDayLabels: { flexDirection: 'row', marginTop: 12, marginBottom: 6 },
  calDayLabel: { width: CAL_W, textAlign: 'center', fontSize: 10, color: '#94A3B8', fontWeight: '500' },
  calGrid: {},
  calDayCell: {
    width: CAL_W, height: 34, alignItems: 'center', justifyContent: 'center',
    borderRadius: 8,
  },
  calDayCellToday: { backgroundColor: '#E8F5E9' },
  calDayDot: { width: 5, height: 5, borderRadius: 2.5, position: 'absolute', top: 2 },
  calDayNum: { fontSize: 12, fontWeight: '500', color: '#1F2937' },
  calDayNumToday: { color: '#2E7D32', fontWeight: '700' },
  calDayPulse: {
    position: 'absolute', width: 30, height: 30, borderRadius: 15,
    borderWidth: 2, borderColor: 'rgba(46,125,50,0.2)',
  },
  calLegend: { flexDirection: 'row', gap: 10, marginTop: 10, flexWrap: 'wrap' },
  calLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  calLegendDot: { width: 6, height: 6, borderRadius: 3 },
  calLegendText: { fontSize: 9, color: '#94A3B8' },

  /* Day Detail Modal */
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' },
  modalSheet: {
    backgroundColor: 'white', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 20, paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.08, shadowRadius: 30, elevation: 10,
  },
  modalHandleRow: { alignItems: 'center', marginBottom: 8 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB' },
  modalCloseBtn: {
    position: 'absolute', top: 16, right: 16,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center',
  },
  modalDateHead: { alignItems: 'center', marginBottom: 16 },
  modalDateDay: { fontSize: 14, fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: 1 },
  modalDateFull: { fontSize: 22, fontWeight: '800', color: '#1F2937', marginTop: 2 },
  modalStatusBadge: { paddingVertical: 4, paddingHorizontal: 14, borderRadius: 50, marginTop: 8 },
  modalStatusText: { fontSize: 12, fontWeight: '700' },
  modalAmountSection: {
    backgroundColor: '#F8FAF7', borderRadius: 16, padding: 16, marginBottom: 14,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)',
  },
  modalAmountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  modalAmountLabel: { fontSize: 12, color: '#64748B' },
  modalAmountValue: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  modalInsight: {
    backgroundColor: '#F0FDF4', borderRadius: 16, padding: 14, marginBottom: 16,
    borderLeftWidth: 3, borderLeftColor: '#2E7D32',
  },
  modalInsightHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  modalInsightLabel: { fontSize: 10, fontWeight: '700', color: '#2E7D32' },
  modalInsightText: { fontSize: 12, color: '#374151', lineHeight: 18 },
  modalActionBtn: { borderRadius: 14, overflow: 'hidden' },
  modalActionGrad: { paddingVertical: 14, alignItems: 'center' },
  modalActionText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  reinvestCard: {
    backgroundColor: 'white', borderRadius: 28, padding: 20, marginTop: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06, shadowRadius: 28, elevation: 3,
  },
  reinvestRow: { flexDirection: 'row', marginBottom: 20 },
  reinvestLeft: { width: 20, alignItems: 'center', position: 'relative' },
  reinvestDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4, borderWidth: 2, borderColor: '#F8FAF7', zIndex: 1 },
  reinvestLine: { position: 'absolute', top: 14, bottom: -20, width: 2, backgroundColor: '#E8ECEE' },
  reinvestContent: { flex: 1, marginLeft: 10 },
  reinvestTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reinvestLabel: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  reinvestValue: { fontSize: 14, fontWeight: '800', color: '#1F2937' },
  reinvestTrack: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 100, marginTop: 6, overflow: 'hidden' },
  reinvestFill: { height: '100%', borderRadius: 100 },
  reinvestPercent: { fontSize: 11, color: '#94A3B8', marginTop: 3 },

  txCard: {
    backgroundColor: 'white', borderRadius: 28, padding: 20, marginTop: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06, shadowRadius: 28, elevation: 3,
  },
  txRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  txLeft: { flex: 1, marginRight: 12 },
  txTitle: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  txMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  txTime: { fontSize: 11, color: '#94A3B8' },
  txStatusPill: { paddingVertical: 1, paddingHorizontal: 8, borderRadius: 100 },
  txStatusText: { fontSize: 9, fontWeight: '600' },
  txAmount: { fontSize: 15, fontWeight: '700', flexShrink: 0 },

  insightOuter: {
    backgroundColor: 'white', borderRadius: 28, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06, shadowRadius: 28, elevation: 3,
  },
  insightCard: {
    backgroundColor: '#F0FDF4', borderRadius: 20, padding: 16,
  },
  insightTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  insightMiniChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 20 },
  insightMiniBar: { width: 4, borderRadius: 2 },
  insightHeadline: { fontSize: 14, fontWeight: '700', color: '#1F2937', marginTop: 8 },
  insightSub: { fontSize: 12, color: '#64748B', marginTop: 4, lineHeight: 18 },
  insightCtaRow: { marginTop: 12 },
  insightCta: { fontSize: 13, fontWeight: '600', color: '#2E7D32' },

  aiCard: {
    backgroundColor: 'white', borderRadius: 28, padding: 20, marginTop: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06, shadowRadius: 28, elevation: 3,
  },
  aiRow: {
    flexDirection: 'row', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  aiIcon: { fontSize: 20, marginTop: 2 },
  aiContent: { flex: 1 },
  aiHeadline: { fontSize: 14, fontWeight: '700', color: '#1F2937', lineHeight: 20 },
  aiSub: { fontSize: 12, color: '#64748B', marginTop: 4, lineHeight: 16 },

  goalCard: {
    backgroundColor: 'white', borderRadius: 28, padding: 20, marginTop: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06, shadowRadius: 28, elevation: 3,
  },
  goalRow: {
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  goalTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  goalHeadLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  goalIconWrap: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  goalInfo: { flex: 1 },
  goalTitle: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  goalTimeline: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
  goalPercent: { fontSize: 16, fontWeight: '800', color: '#1F2937' },
  goalTrack: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 100, marginTop: 10, overflow: 'hidden' },
  goalFill: { height: '100%', borderRadius: 100 },
  goalMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  goalSaved: { fontSize: 11, color: '#64748B' },
  goalTarget: { fontSize: 11, color: '#94A3B8' },

  behaviorCard: {
    backgroundColor: 'white', borderRadius: 28, padding: 20, marginTop: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06, shadowRadius: 28, elevation: 3,
  },
  behaviorRow: {
    flexDirection: 'row', gap: 10,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
    alignItems: 'flex-start',
  },
  behaviorIconWrap: { width: 20, height: 20, marginTop: 1 },
  behaviorText: { fontSize: 13, fontWeight: '500', color: '#1F2937', lineHeight: 19, flex: 1 },
})


