import React, { useEffect, useState, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, Pressable, ScrollView,
  StyleSheet, Dimensions, Keyboard,
} from 'react-native'
import { router } from 'expo-router'
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg'
import { BlurView } from 'expo-blur'
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient'
import Animated, {
  useSharedValue, useAnimatedStyle, withDelay, withTiming,
  withSpring, withRepeat, withSequence, Easing,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import BottomTabBar from '../../../components/BottomTabBar'
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

function BellIcon() {
  return (
    <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <Path d="M10 3C7.2 3 5 5.2 5 8V12.5L3.5 15H16.5L15 12.5V8C15 5.2 12.8 3 10 3Z" stroke="#1F2937" strokeWidth="1.5" fill="none" />
      <Path d="M8.5 15C8.5 15.8 9.2 16.5 10 16.5C10.8 16.5 11.5 15.8 11.5 15" stroke="#1F2937" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <Circle cx="15.5" cy="4.5" r="2.5" fill="#EF4444" stroke="white" strokeWidth="1.5" />
    </Svg>
  )
}

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

  const pulse = useSharedValue(1)
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(0.35, { duration: 2000 }), withTiming(1, { duration: 2000 })),
      -1, true,
    )
  }, [])
  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulse.value }))

  const stateColors: Record<string, string> = {
    completed: '#2E7D32', exceeded: '#AEEA00',
    partial: '#F59E0B', missed: '#EF4444', none: '#F1F5F9',
  }
  const stateLabels: Record<string, string> = {
    completed: 'Completed', exceeded: 'Exceeded',
    partial: 'Partial', missed: 'Missed',
  }

  const days = Array.from({ length: 28 }, (_, i) => i + 1)

  return (
    <Animated.View style={[animStyle, styles.calCard]}>
      <View style={styles.calHead}>
        <View>
          <Text style={styles.calTitle}>Recovery Tracker</Text>
          <Text style={styles.calSub}>{MONTHS[now.getMonth()]} {now.getFullYear()} — Capital Recovery</Text>
        </View>
        <View style={styles.calStreak}>
          <FlameIcon />
          <Text style={styles.calStreakText} numberOfLines={1}>{streak}d streak</Text>
        </View>
      </View>

      <View style={styles.calDayLabels}>
        {DAY_LABELS.map((d, i) => (
          <Text key={i} style={styles.calDayLabel}>{d}</Text>
        ))}
      </View>

      <View style={styles.calGrid}>
        {Array.from({ length: 4 }).map((_, weekIdx) => (
          <View key={weekIdx} style={styles.calWeekRow}>
            {days.slice(weekIdx * 7, weekIdx * 7 + 7).map((dayNum) => {
              const date = new Date(now.getFullYear(), now.getMonth(), dayNum)
              const dateStr = fmtDateFromParts(now.getFullYear(), now.getMonth(), dayNum)
              const record = records[dateStr]
              const status = record?.status || 'none'
              const isToday = dateStr === todayStr
              const isFuture = date > now

              return (
                <TouchableOpacity
                  key={dayNum}
                  style={[styles.calDayCell, isToday && styles.calDayCellToday]}
                  activeOpacity={0.7}
                  onPress={() => { if (!isFuture) onDayPress(date) }}
                  disabled={isFuture}
                >
                  {isToday && <Animated.View style={[styles.calDayPulse, pulseStyle]} />}
                  <View style={[
                    styles.calDayDot,
                    { backgroundColor: stateColors[status] },
                    status === 'none' && { opacity: 0.15 },
                  ]} />
                  <Text style={[
                    styles.calDayNum,
                    isToday && styles.calDayNumToday,
                    isFuture && { opacity: 0.25 },
                  ]}>{dayNum}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        ))}
      </View>

      <View style={styles.calLegend}>
        {['completed', 'exceeded', 'partial', 'missed'].map((key) => (
          <View key={key} style={styles.calLegendItem}>
            <View style={[styles.calLegendDot, { backgroundColor: stateColors[key] }]} />
            <Text style={styles.calLegendText}>{stateLabels[key]}</Text>
          </View>
        ))}
      </View>
    </Animated.View>
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
          <TouchableOpacity style={styles.headerBtn} activeOpacity={0.7}>
            <BellIcon />
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

      <BottomTabBar hidden={keyboardH > 0} />
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
  calHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  calTitle: { fontSize: 17, fontWeight: '700', color: '#1F2937' },
  calSub: { fontSize: 12, color: '#64748B', marginTop: 1 },
  calStreak: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FFFBEB', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 100, flexShrink: 1, maxWidth: '45%' },
  calStreakText: { fontSize: 11, fontWeight: '600', color: '#F59E0B' },
  calDayLabels: { flexDirection: 'row', marginTop: 16, marginBottom: 8 },
  calDayLabel: { width: CAL_W, textAlign: 'center', fontSize: 11, color: '#94A3B8', fontWeight: '500' },
  calGrid: {},
  calWeekRow: { flexDirection: 'row', marginBottom: 4 },
  calDayCell: {
    width: CAL_W, height: 36, alignItems: 'center', justifyContent: 'center',
    borderRadius: 10,
  },
  calDayCellToday: { backgroundColor: '#E8F5E9' },
  calDayDot: { width: 6, height: 6, borderRadius: 3, position: 'absolute', top: 2 },
  calDayNum: { fontSize: 12, fontWeight: '500', color: '#1F2937' },
  calDayNumToday: { color: '#2E7D32', fontWeight: '700' },
  calDayPulse: {
    position: 'absolute', width: 34, height: 34, borderRadius: 17,
    borderWidth: 2, borderColor: 'rgba(46,125,50,0.25)',
  },
  calLegend: { flexDirection: 'row', gap: 14, marginTop: 12, flexWrap: 'wrap' },
  calLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  calLegendDot: { width: 7, height: 7, borderRadius: 3.5 },
  calLegendText: { fontSize: 10, color: '#94A3B8' },

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
