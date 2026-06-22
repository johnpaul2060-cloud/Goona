import React, { useEffect, useState, useCallback, useRef } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Dimensions, Keyboard, PanResponder, Modal, Platform,
  useWindowDimensions,
} from 'react-native'
import { router } from 'expo-router'
import Svg, { Circle, Text as SvgText } from 'react-native-svg'
import GoonaIcon from '../../../components/ui/GoonaIcon'
import { Icons } from '../../../shared/icons'
import { BlurView } from 'expo-blur'
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient'
import Animated, {
  useSharedValue, useAnimatedStyle, withDelay, withTiming,
  withSpring, withRepeat, withSequence, Easing,
  FadeInRight, FadeInLeft, FadeInUp, FadeInDown, SlideInUp,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import BottomDock from '../../../components/navigation/BottomDock'
import RecoveryCheckInModal from '../../../components/RecoveryCheckInModal'
import {
  useRecoveryStore, fmtDateFromParts,
  computeStreak,
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
        <GoonaIcon icon={Icons.bell} size={20} color={count > 0 ? '#EF4444' : '#1B1B1B'} />
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
    backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
    shadowColor: '#EF4444', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4,
  },
  badgeText: { fontSize: 9, fontWeight: '800', color: '#fff', includeFontPadding: false },
})

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

/* ─── Animated Card Wrapper ─── */
function AnimatedCard({ children, delay }: { children: React.ReactNode; delay?: number }) {
  return (
    <Animated.View entering={FadeInUp.duration(400).delay(delay ?? 0).springify()}>
      {children}
    </Animated.View>
  )
}

/* ─── 1. PRODUCTION READINESS HERO ─── */
function ProductionReadinessHero({ index }: { index: number }) {
  const animStyle = useStaggerEntry(index)
  const { style: pressStyle, onPressIn, onPressOut } = usePressScale()
  const records = useRecoveryStore((s) => s.records)

  let totalSaved = 0
  for (const key in records) {
    const r = records[key]
    if (r.amount && (r.status === 'completed' || r.status === 'exceeded')) totalSaved += r.amount
  }
  const target = 2500000
  const progress = Math.min(totalSaved / target, 1)
  const ringCircumference = 2 * Math.PI * 38
  const strokeDashoffset = ringCircumference * (1 - progress)
  const ringAnim = useSharedValue(ringCircumference)
  useEffect(() => {
    ringAnim.value = withTiming(strokeDashoffset, { duration: 1500, easing: Easing.out(Easing.cubic) })
  }, [totalSaved])

  const streak = computeStreak(records)
  const streakWeeks = Math.max(1, Math.floor(streak / 7))
  const readinessPct = Math.min(Math.round(progress * 100) + streakWeeks * 2, 100)
  const statusLabel = readinessPct >= 80 ? 'On Track' : readinessPct >= 50 ? 'Building' : 'Just Started'
  const restartEstimate = new Date()
  restartEstimate.setDate(restartEstimate.getDate() + Math.max(14, Math.round((1 - progress) * 60)))

  const restartStr = `${restartEstimate.getDate()} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][restartEstimate.getMonth()]} ${restartEstimate.getFullYear()}`

  return (
    <Animated.View style={[animStyle, pressStyle]} onTouchStart={onPressIn} onTouchEnd={onPressOut}>
      <ExpoLinearGradient
colors={['#065F46', '#047857']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <View style={styles.heroBgCircle1} pointerEvents="none" />
        <View style={styles.heroBgCircle2} pointerEvents="none" />

        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroLabel}>PRODUCTION READINESS</Text>
            <Text style={styles.heroPct}>{readinessPct}% Ready</Text>
            <Text style={styles.heroAmount}>
              {'\u20A6'}{totalSaved.toLocaleString('en-NG')} of {'\u20A6'}{target.toLocaleString('en-NG')} Target
            </Text>
          </View>
          <View style={styles.heroRingWrap}>
            <Svg width="88" height="88" viewBox="0 0 88 88">
              <Circle cx="44" cy="44" r="38" stroke="rgba(255,255,255,0.12)" strokeWidth="5" fill="none" />
              <Circle
                cx="44" cy="44" r="38" stroke="#AEEA00" strokeWidth="5"
                fill="none" strokeLinecap="round"
                strokeDasharray={`${ringCircumference}`}
                strokeDashoffset={strokeDashoffset}
              />
              <SvgText x="44" y="48" textAnchor="middle" fontSize={16} fontWeight="800" fill="#AEEA00">{Math.round(progress * 100)}%</SvgText>
            </Svg>
          </View>
        </View>

        <View style={styles.heroMeta}>
          <View style={styles.heroMetaItem}>
            <Text style={styles.heroMetaLabel}>Status</Text>
            <View style={styles.heroMetaStatusRow}>
              <View style={[styles.heroStatusDot, { backgroundColor: readinessPct >= 50 ? '#AEEA00' : '#F59E0B' }]} />
              <Text style={styles.heroMetaValue}>{statusLabel}</Text>
            </View>
          </View>
          <View style={styles.heroMetaDiv} />
          <View style={styles.heroMetaItem}>
            <Text style={styles.heroMetaLabel}>Est. Restart</Text>
            <Text style={styles.heroMetaValue}>{restartStr}</Text>
          </View>
          <View style={styles.heroMetaDiv} />
          <View style={styles.heroMetaItem}>
            <Text style={styles.heroMetaLabel}>Streak</Text>
            <View style={styles.heroMetaStreak}>
              <GoonaIcon icon={Icons.flame} size={12} color="#F59E0B" />
              <Text style={[styles.heroMetaValue, { color: '#F59E0B' }]}>{streakWeeks}w</Text>
            </View>
          </View>
        </View>

        <View style={styles.heroGlow} pointerEvents="none" />
      </ExpoLinearGradient>
    </Animated.View>
  )
}

/* ─── 3. QUICK ACTIONS RAIL ─── */
const ACTION_RAIL = [
  { emoji: '\u2795', label: 'Fund', color: '#2E7D32', bg: '#F0FDF4', route: '/fund-recapt' as const },
  { emoji: '\uD83D\uDCC5', label: 'Plan', color: '#F59E0B', bg: '#FFFBEB', route: '/plan-recapt' as const },
  { emoji: '\uD83D\uDCC8', label: 'Timeline', color: '#1A56FF', bg: '#EEF3FF', route: '/recapitalization/project-timeline' as const },
  { emoji: '\uD83D\uDCCA', label: 'Report', color: '#8B5CF6', bg: '#F5F3FF', route: '/recapitalization/readiness-report' as const },
]

function ActionRail({ index }: { index: number }) {
  const animStyle = useStaggerEntry(index, 60)

  return (
    <Animated.View style={animStyle}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionRailScroll}>
        {ACTION_RAIL.map((a) => (
          <TouchableOpacity
            key={a.label}
            style={styles.actionRailCard}
            activeOpacity={0.7}
            onPress={() => router.push(a.route as any)}
          >
            <Text style={styles.actionRailEmoji}>{a.emoji}</Text>
            <Text style={styles.actionRailLabel}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Animated.View>
  )
}

/* ─── 4. FUNDING BREAKDOWN ─── */
const DRIVER_ITEMS = [
  { emoji: '\uD83D\uDC23', label: 'Restocking Fund', pct: 100, funded: 1200000, remaining: 0, target: 1200000, color: '#2E7D32', bg: '#F0FDF4' },
  { emoji: '\uD83C\uDF3D', label: 'Feed Reserve', pct: 82, funded: 820000, remaining: 180000, target: 1000000, color: '#F59E0B', bg: '#FFFBEB' },
  { emoji: '\uD83D\uDC8A', label: 'Medication Fund', pct: 67, funded: 503000, remaining: 247000, target: 750000, color: '#1A56FF', bg: '#EEF3FF' },
  { emoji: '\uD83D\uDEA8', label: 'Emergency Buffer', pct: 54, funded: 325000, remaining: 275000, target: 600000, color: '#EF4444', bg: '#FEF2F2' },
]

function FundingBreakdown({ index }: { index: number }) {
  const animStyle = useStaggerEntry(index, 70)

  return (
    <Animated.View style={[animStyle, styles.driversCard]}>
      <View style={styles.driversList}>
        {DRIVER_ITEMS.map((item) => (
          <View key={item.label} style={styles.driverRow}>
            <View style={styles.driverTop}>
              <View style={styles.driverLabelRow}>
                <Text style={styles.driverEmoji}>{item.emoji}</Text>
                <Text style={styles.driverLabel}>{item.label}</Text>
              </View>
              <Text style={[styles.driverPct, { color: item.color }]}>{item.pct}%</Text>
            </View>
            <View style={styles.driverBarBg}>
              <View style={[styles.driverBarFill, { width: `${item.pct}%`, backgroundColor: item.color }]} />
            </View>
            <View style={styles.driverAmounts}>
              <Text style={styles.driverFunded}>{'\u20A6'}{item.funded.toLocaleString('en-NG')} funded</Text>
              {item.remaining > 0 && (
                <Text style={styles.driverRemaining}>{'\u20A6'}{item.remaining.toLocaleString('en-NG')} remaining</Text>
              )}
            </View>
          </View>
        ))}
      </View>
    </Animated.View>
  )
}

/* ─── 5. READY FOR NEXT CYCLE CHECKLIST ─── */
type ChecklistKey = 'housing' | 'feed' | 'water' | 'chicks' | 'vaccination' | 'staff'
const CHECKLIST_DEFS: { key: ChecklistKey; label: string; emoji: string }[] = [
  { key: 'housing', label: 'Housing Prepared', emoji: '\uD83C\uDFE0' },
  { key: 'feed', label: 'Feed Available', emoji: '\uD83C\uDF3D' },
  { key: 'water', label: 'Water System Ready', emoji: '\uD83D\uDCA7' },
  { key: 'chicks', label: 'Chicks/Fingerlings/Seed Reserved', emoji: '\uD83D\uDC24' },
  { key: 'vaccination', label: 'Vaccines & Medication Available', emoji: '\uD83D\uDC89' },
  { key: 'staff', label: 'Staff & Equipment Ready', emoji: '\uD83D\uDC65' },
]

function ReadyForNextCycleChecklist({
  index, items, onToggle,
}: {
  index: number; items: Record<ChecklistKey, boolean>; onToggle: (key: ChecklistKey) => void
}) {
  const animStyle = useStaggerEntry(index, 80)
  const records = useRecoveryStore((s) => s.records)

  const completed = CHECKLIST_DEFS.filter(d => items[d.key]).length
  const total = CHECKLIST_DEFS.length
  const opsPct = Math.round((completed / total) * 100)
  const allComplete = completed === total

  let totalSaved = 0
  for (const key in records) {
    const r = records[key]
    if (r.amount && (r.status === 'completed' || r.status === 'exceeded')) totalSaved += r.amount
  }
  const target = 2500000
  const progress = Math.min(totalSaved / target, 1)
  const streak = computeStreak(records)
  const streakWeeks = Math.max(1, Math.floor(streak / 7))
  const readinessPct = Math.min(Math.round(progress * 100) + streakWeeks * 2, 100)
  const restartDate = new Date()
  restartDate.setDate(restartDate.getDate() + Math.max(14, Math.round((1 - progress) * 60)))
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const restartStr = `${restartDate.getDate()} ${months[restartDate.getMonth()]} ${restartDate.getFullYear()}`

  /* ─── Success state ─── */
  if (allComplete) {
    return (
      <Animated.View style={[animStyle, styles.rfncCard, styles.rfncComplete]}>
        <View style={styles.rfncCheckBig}>
          <GoonaIcon icon={Icons.check} size={28} color="#2E7D32" />
        </View>
        <Text style={styles.rfncReadyLabel}>READY TO START</Text>
        <Text style={styles.rfncReadyDesc}>
          Your farm is financially and operationally prepared for the next production cycle.
        </Text>
        <View style={styles.rfncReadyMeta}>
          <View style={styles.rfncMetaItem}>
            <GoonaIcon icon={Icons.calendar} size={14} color="#2E7D32" />
            <Text style={styles.rfncMetaLabel}>Recommended Start Date</Text>
            <Text style={styles.rfncMetaValue}>{restartStr}</Text>
          </View>
          <View style={styles.rfncMetaDivider} />
          <View style={styles.rfncMetaItem}>
            <GoonaIcon icon={Icons.trendingUp} size={14} color="#2E7D32" />
            <Text style={styles.rfncMetaLabel}>Est. Production Capacity</Text>
            <Text style={styles.rfncMetaValue}>{Math.round(1200000 / 2500)} birds per cycle</Text>
          </View>
          <View style={styles.rfncMetaDivider} />
          <View style={styles.rfncMetaItem}>
            <GoonaIcon icon={Icons.target} size={14} color="#2E7D32" />
            <Text style={styles.rfncMetaLabel}>Readiness Score</Text>
            <Text style={styles.rfncMetaValue}>{readinessPct}%</Text>
          </View>
        </View>
      </Animated.View>
    )
  }

  return (
    <Animated.View style={[animStyle, styles.rfncCard]}>
      <Text style={styles.rfncTitle}>Ready for Next Cycle?</Text>
      <Text style={styles.rfncHelper}>
        Tick each item as it becomes available. This helps GOONA determine whether your farm is fully prepared to begin the next production cycle. Completing all items improves your readiness score and unlocks a restart recommendation from GOONA IQ.
      </Text>

      <View style={styles.rfncProgressRow}>
        <View style={styles.rfncProgressBg}>
          <View style={[styles.rfncProgressFill, { width: `${opsPct}%` }]} />
        </View>
        <Text style={styles.rfncProgressText}>{completed}/{total}</Text>
      </View>

      <View style={styles.rfncItems}>
        {CHECKLIST_DEFS.map((def) => {
          const done = items[def.key]
          return (
            <TouchableOpacity key={def.key} style={[styles.rfncRow, done && styles.rfncRowDone]} activeOpacity={0.7} onPress={() => onToggle(def.key)}>
              <View style={[styles.rfncCheck, done && styles.rfncCheckDone]}>
                {done && <GoonaIcon icon={Icons.check} size={16} color="white" />}
              </View>
              <Text style={styles.rfncEmoji}>{def.emoji}</Text>
              <Text style={[styles.rfncLabel, done && styles.rfncLabelDone]}>{def.label}</Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </Animated.View>
  )
}

/* ─── 5. CONTRIBUTION CALENDAR ─── */
function RecoveryTrackerCalendar({ index, onDayPress }: { index: number; onDayPress: (d: Date) => void }) {
  const animStyle = useStaggerEntry(index, 90)
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
  const [expanded, setExpanded] = useState(true)

  const isCurMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstDow = new Date(viewYear, viewMonth, 1).getDay()
  const monthName = MONTHS[viewMonth]

  /* ─── Calendar Analytics ─── */
  let completedCount = 0
  let missedCount = 0
  let upcomingDue = 0
  for (const key in records) {
    const r = records[key]
    if (r.status === 'completed' || r.status === 'exceeded') completedCount++
    if (r.status === 'missed') missedCount++
  }
  const totalDays = completedCount + missedCount
  const consistencyScore = totalDays > 0 ? Math.round((completedCount / totalDays) * 100) : 0
  for (let i = 1; i <= 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i)
    const ds = fmtDateFromParts(d.getFullYear(), d.getMonth(), d.getDate())
    if (!records[ds]) upcomingDue++
  }

  const delayedDays = missedCount
  const restartDelay = Math.min(delayedDays * 3, 30)
  const adjustedRestartDate = new Date()
  adjustedRestartDate.setDate(adjustedRestartDate.getDate() + Math.max(14, restartDelay))

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
    upcoming: '#F59E0B', forecast: '#D1D5DB', none: '#F1F5F9',
  }

  const pulse = useSharedValue(1)
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(0.35, { duration: 2000 }), withTiming(1, { duration: 2000 })),
      -1, true,
    )
  }, [])
  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulse.value }))

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
      {/* Collapsed Header */}
      <TouchableOpacity activeOpacity={0.7} onPress={() => setExpanded(!expanded)}>
        <View style={styles.calCollapsed}>
          <View style={styles.calCollapsedLeft}>
            <GoonaIcon icon={Icons.calendar} size={16} color="#2E7D32" />
            <Text style={styles.calCollapsedMonth}>{monthName} {viewYear}</Text>
          </View>
          <View style={styles.calCollapsedRight}>
            {missedCount > 0 && (
              <View style={styles.calMissedBadge}>
                <Text style={styles.calMissedBadgeText}>{missedCount} missed</Text>
              </View>
            )}
            <GoonaIcon icon={Icons.flame} size={14} color="#F59E0B" />
            <Text style={styles.calCollapsedStreak}>{streak}d</Text>
            {consistencyScore > 0 && (
              <Text style={styles.calConsistency}>{consistencyScore}%</Text>
            )}
            <GoonaIcon icon={Icons.chevronDown} size={14} color="#94A3B8" style={{ transform: expanded ? [{ rotate: '180deg' }] : [] }} />
          </View>
        </View>

        {/* Quick Stats Row (always visible) */}
        <View style={styles.calQuickStats}>
          <View style={styles.calQuickStat}>
            <Text style={styles.calQuickStatValue}>{completedCount}</Text>
            <Text style={styles.calQuickStatLabel}>Done</Text>
          </View>
          <View style={styles.calQuickStatDiv} />
          <View style={styles.calQuickStat}>
            <Text style={[styles.calQuickStatValue, missedCount > 0 && { color: '#EF4444' }]}>{missedCount}</Text>
            <Text style={styles.calQuickStatLabel}>Missed</Text>
          </View>
          <View style={styles.calQuickStatDiv} />
          <View style={styles.calQuickStat}>
            <Text style={[styles.calQuickStatValue, { color: consistencyScore >= 80 ? '#2E7D32' : '#F59E0B' }]}>{consistencyScore}%</Text>
            <Text style={styles.calQuickStatLabel}>Consistency</Text>
          </View>
          {upcomingDue > 0 && (
            <>
              <View style={styles.calQuickStatDiv} />
              <View style={styles.calQuickStat}>
                <Text style={[styles.calQuickStatValue, { color: '#F59E0B' }]}>{upcomingDue}</Text>
                <Text style={styles.calQuickStatLabel}>Due Soon</Text>
              </View>
            </>
          )}
        </View>
      </TouchableOpacity>

      {expanded && (
        <Animated.View entering={FadeInDown.duration(300).springify()}>
          {/* Navigation */}
          <View style={styles.calNavRow}>
            <TouchableOpacity onPress={goPrev} style={styles.calNavBtn} activeOpacity={0.7}>
              <GoonaIcon icon={Icons.chevronLeft} size={16} color="#1B1B1B" />
            </TouchableOpacity>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={styles.calTitle}>{monthName} {viewYear}</Text>
            </View>
            <TouchableOpacity onPress={goNext} style={styles.calNavBtn} activeOpacity={0.7}>
              <GoonaIcon icon={Icons.chevronRight} size={16} color="#1B1B1B" />
            </TouchableOpacity>
          </View>

          {/* Grid with Swipe */}
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

                      const isDueSoon = isFuture && day % 7 === 1 && day - now.getDate() <= 3 && day - now.getDate() >= 0

                      return (
                        <TouchableOpacity
                          key={day}
                          style={[styles.calDayCell, { width: calCellW }, isToday && styles.calDayCellToday]}
                          activeOpacity={0.7}
                          onPress={() => handleDayTap(day)}
                        >
                          {isToday && <Animated.View style={[styles.calDayPulse, pulseStyle]} />}
                          {isDueSoon && <View style={styles.calReminderDot} />}
                          <View style={[
                            styles.calDayDot,
                            { backgroundColor: stateColors[status] },
                            (status === 'none' || status === 'forecast') && { opacity: 0.12 },
                          ]} />
                          <Text style={[
                            styles.calDayNum,
                            isToday && styles.calDayNumToday,
                            isFuture && { opacity: 0.5 },
                            status === 'missed' && { color: '#EF4444' },
                            status === 'upcoming' && { color: '#F59E0B', fontWeight: '600' },
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
              { k: 'completed', l: 'Completed' },
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
        </Animated.View>
      )}

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
    upcoming: '#F59E0B', forecast: '#D1D5DB', none: '#94A3B8',
  }
  const sl: Record<string, string> = {
    completed: 'Recapt Completed', exceeded: 'Exceeded Target',
    partial: 'Partial Contribution', missed: 'Missed Contribution',
    upcoming: 'Upcoming Recapt', forecast: 'Forecast Day', none: 'No Record',
  }

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  let insight = ''
  if (status === 'missed') insight = 'This missed contribution may delay your production cycle restart by approximately 3 days.'
  else if (status === 'completed' && streak > 7) insight = 'Your consistency is building strong preparation for the next batch.'
  else if (status === 'exceeded') insight = 'Over-contributing accelerates your production readiness timeline. Excellent discipline.'
  else if (status === 'partial') insight = 'Partial contributions help, but try to meet the full target for optimal readiness pacing.'
  else if (isFuture) insight = 'Scheduled recapt day. Early contributions reduce pressure later in the cycle.'
  else insight = 'Every recapt day brings you closer to your next production cycle. Stay consistent.'

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <Animated.View entering={SlideInUp.duration(300).springify().damping(18)} style={styles.modalSheet}>
          <View style={styles.modalHandleRow}>
            <View style={styles.modalHandle} />
          </View>
          <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose} activeOpacity={0.7}>
            <GoonaIcon icon={Icons.x} size={18} color="#1B1B1B" />
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
              <Text style={styles.modalAmountValue}>{'\u20A6'}{expected.toLocaleString('en-NG')}</Text>
            </View>
            {amount !== undefined && (
              <View style={styles.modalAmountRow}>
                <Text style={styles.modalAmountLabel}>Actual Saved</Text>
                <Text style={[styles.modalAmountValue, { color: sc[status] }]}>
                  {'\u20A6'}{amount.toLocaleString('en-NG')}
                </Text>
              </View>
            )}
            {isFuture && (
              <View style={styles.modalAmountRow}>
                <Text style={styles.modalAmountLabel}>Status</Text>
                <Text style={[styles.modalAmountValue, { color: '#F59E0B', fontSize: 13 }]}>Scheduled</Text>
              </View>
            )}
          </View>

          <View style={styles.modalInsight}>
            <View style={styles.modalInsightHeader}>
              <GoonaIcon icon={Icons.info} size={14} color="#2E7D32" />
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
              <ExpoLinearGradient colors={['#2E7D32', '#1B5E20']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.modalActionGrad}>
                <Text style={styles.modalActionText}>{isToday ? 'Check In Today' : 'Check In'}</Text>
              </ExpoLinearGradient>
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>
    </Modal>
  )
}

/* ─── 6. GOONA IQ INSIGHTS ─── */
function GoonaIqInsights({ index, opsCompleted }: { index: number; opsCompleted: number }) {
  const animStyle = useStaggerEntry(index, 110)
  const records = useRecoveryStore((s) => s.records)
  const opsTotal = CHECKLIST_DEFS.length

  let totalSaved = 0
  let missedCount = 0
  for (const key in records) {
    const r = records[key]
    if (r.amount && (r.status === 'completed' || r.status === 'exceeded')) totalSaved += r.amount
    if (r.status === 'missed') missedCount++
  }
  const target = 2500000
  const gap = target - totalSaved

  const insights: {
    icon: any; color: string; bg: string; title: string; desc: string
  }[] = []

  if (missedCount > 0) {
    insights.push({
      icon: Icons.trendingDown,
      color: missedCount > 3 ? '#EF4444' : '#F59E0B',
      bg: missedCount > 3 ? '#FEF2F2' : '#FFFBEB',
      title: 'Contribution Alert',
      desc: missedCount > 3
        ? `You've missed ${missedCount} contributions, adding a ${missedCount * 3}-day delay to your restart timeline. Catch up to stay on schedule.`
        : `You've missed ${missedCount} contribution${missedCount > 1 ? 's' : ''}. Every missed day pushes your production restart further back.`,
    })
  }

  if (opsCompleted < opsTotal) {
    insights.push({
      icon: Icons.target, color: '#F59E0B', bg: '#FFFBEB',
      title: 'Complete Your Checklist',
      desc: `Finish your Ready for Next Cycle checklist — ${opsTotal - opsCompleted} item${opsTotal - opsCompleted > 1 ? 's' : ''} remaining. GOONA will generate a restart recommendation once all items are completed.`,
    })
  } else {
    insights.push({
      icon: Icons.target, color: '#2E7D32', bg: '#EEF3FF',
      title: 'Restart Recommendation',
      desc: gap > 0
        ? `Close the funding gap of ${'\u20A6'}{gap.toLocaleString('en-NG')} to unlock your full production budget.`
        : `Everything looks good. You're on track for a smooth production restart.`,
    })
  }

  if (gap > 500000) {
    insights.push({
      icon: Icons.trendingUp, color: '#2E7D32', bg: '#F0FDF4',
      title: 'Savings Opportunity',
      desc: `Increasing contributions by even ${'\u20A6'}5,000 per cycle could cut your restart timeline by weeks.`,
    })
  } else if (totalSaved >= target) {
    insights.push({
      icon: Icons.sparkles, color: '#2E7D32', bg: '#F0FDF4',
      title: 'Fully Funded',
      desc: 'You\'ve reached your funding target. Any additional savings accelerate your restart timeline or provide extra working capital.',
    })
  }

  return (
    <Animated.View style={animStyle}>
      <View style={styles.iqSectionHead}>
        <GoonaIcon icon={Icons.sparkles} size={16} color="#2E7D32" />
        <Text style={styles.iqTitle}>GOONA IQ Insights</Text>
      </View>
      {insights.map((ins, i) => {
        const IconComp = ins.icon
        return (
          <AnimatedCard key={i} delay={i * 60}>
            <View style={[styles.iqCard, { backgroundColor: ins.bg }]}>
              <View style={[styles.iqIconWrap, { backgroundColor: ins.color + '20' }]}>
                <GoonaIcon icon={IconComp} size={18} color={ins.color} />
              </View>
              <View style={styles.iqContent}>
                <View style={styles.iqTop}>
                  <Text style={styles.iqCardTitle}>{ins.title}</Text>
                </View>
                <Text style={styles.iqDesc}>{ins.desc}</Text>
              </View>
            </View>
          </AnimatedCard>
        )
      })}
    </Animated.View>
  )
}

/* ─── MAIN ─── */
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
  const streak = computeStreak(records)
  let totalSaved = 0
  for (const key in records) {
    const r = records[key]
    if (r.amount && (r.status === 'completed' || r.status === 'exceeded')) totalSaved += r.amount
  }

  /* ─── Checklist State ─── */
  const [checklist, setChecklist] = useState<Record<ChecklistKey, boolean>>({
    housing: false, feed: false, water: false, chicks: false, vaccination: false, staff: false,
  })
  const toggleChecklist = (key: ChecklistKey) => setChecklist(prev => ({ ...prev, [key]: !prev[key] }))
  const opsCompleted = CHECKLIST_DEFS.filter(d => checklist[d.key]).length

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
            <Text style={styles.headerSub}>Production Readiness Command</Text>
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
        {/* ─── HERO ─── */}
        <ProductionReadinessHero index={0} />

        {/* ─── QUICK ACTIONS ─── */}
        <View style={[styles.sectionHead, { marginTop: S.pad(14) }]}>
          <Text style={styles.secTitle}>Quick Actions</Text>
        </View>
        <ActionRail index={1} />

        {/* ─── CONTRIBUTION CALENDAR ─── */}
        <View style={styles.sectionHead}>
          <Text style={styles.secTitle}>Contribution Calendar</Text>
        </View>
        <RecoveryTrackerCalendar index={2} onDayPress={handleDayPress} />

        {/* ─── FUNDING BREAKDOWN ─── */}
        <View style={styles.sectionHead}>
          <Text style={styles.secTitle}>Funding Breakdown</Text>
        </View>
        <FundingBreakdown index={3} />

        {/* ─── READY FOR NEXT CYCLE ─── */}
        <View style={styles.sectionHead}>
          <Text style={styles.secTitle}>Ready for Next Cycle?</Text>
        </View>
        <ReadyForNextCycleChecklist index={4} items={checklist} onToggle={toggleChecklist} />

        {/* ─── GOONA IQ INSIGHTS ─── */}
        <GoonaIqInsights index={5} opsCompleted={opsCompleted} />

        <View style={{ height: 40 }} />
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAF7' },

  /* ─── HEADER ─── */
  headerBlur: {
    position: 'absolute', left: 0, right: 0, zIndex: 10,
    borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.04)',
    paddingBottom: S.pad(12),
  },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: S.pad(20),
  },
  headerTitle: { fontSize: S.font(S.isSmall ? 22 : 28), fontWeight: '800', color: '#111827' },
  headerSub: { fontSize: S.font(S.isSmall ? 11 : 13), color: '#6B7280', marginTop: 1 },
  headerBtn: {
    width: S.scale(42), height: S.scale(42), borderRadius: S.scale(21), backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 14, elevation: 3,
  },

  scroll: { flex: 1 },
  scrollInner: { paddingHorizontal: S.pad(20) },
  sectionHead: { marginTop: S.pad(S.isSmall ? 16 : 22), marginBottom: S.pad(S.isSmall ? 8 : 12) },

  secTitle: { fontSize: S.font(S.isSmall ? 18 : 20), fontWeight: '800', color: '#1F2937' },

  /* ─── HERO ─── */
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
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 1 },
  heroLabel: { fontSize: S.font(11), fontWeight: '600', color: 'rgba(255,255,255,0.7)', letterSpacing: 1.2 },
  heroPct: { fontSize: S.font(S.isSmall ? 30 : 38), fontWeight: '800', color: 'white', marginTop: 2 },
  heroAmount: { fontSize: S.font(S.isSmall ? 12 : 14), color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  heroRingWrap: { width: S.scale(88), height: S.scale(88), alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  heroMeta: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: S.pad(16), zIndex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: S.scale(14),
    paddingVertical: S.pad(10), paddingHorizontal: S.pad(6),
  },
  heroMetaItem: { flex: 1, alignItems: 'center' },
  heroMetaLabel: { fontSize: S.font(9), fontWeight: '600', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 0.3 },
  heroMetaStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  heroStatusDot: { width: 6, height: 6, borderRadius: 3 },
  heroMetaValue: { fontSize: S.font(S.isSmall ? 12 : 14), fontWeight: '700', color: 'white', marginTop: 2 },
  heroMetaStreak: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  heroMetaDiv: { width: 1, height: S.scale(24), backgroundColor: 'rgba(255,255,255,0.12)' },
  heroGlow: {
    position: 'absolute', bottom: -40, right: -20,
    width: S.scale(200), height: S.scale(200), borderRadius: S.scale(100),
    backgroundColor: 'rgba(174,234,0,0.08)',
  },

  /* ─── ACTION RAIL ─── */
  actionRailScroll: { gap: S.pad(10), paddingVertical: S.pad(4), paddingRight: S.pad(20) },
  actionRailCard: {
    flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
    width: S.isSmall ? 78 : 86, height: S.isSmall ? 86 : 96,
    backgroundColor: 'white', borderRadius: S.scale(20),
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05, shadowRadius: 20, elevation: 2,
  },
  actionRailEmoji: { fontSize: S.font(26) },
  actionRailLabel: { fontSize: S.font(S.isSmall ? 11 : 12), fontWeight: '700', color: '#1B1B1B' },

  /* ─── READINESS DRIVERS ─── */
  driversCard: {
    backgroundColor: 'white', borderRadius: S.scale(24), padding: S.pad(18),
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06, shadowRadius: 20, elevation: 2,
  },
  driversList: { gap: S.pad(14) },
  driverRow: {},
  driverTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  driverLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  driverEmoji: { fontSize: S.font(16) },
  driverLabel: { fontSize: S.font(13), fontWeight: '600', color: '#1B1B1B' },
  driverPct: { fontSize: S.font(15), fontWeight: '800' },
  driverBarBg: { height: 6, borderRadius: 3, backgroundColor: '#F1F5F9', overflow: 'hidden' },
  driverBarFill: { height: '100%', borderRadius: 3 },
  driverAmounts: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  driverFunded: { fontSize: S.font(10), fontWeight: '500', color: '#94A3B8' },
  driverRemaining: { fontSize: S.font(10), fontWeight: '600', color: '#EF4444' },

  /* ─── READY FOR NEXT CYCLE ─── */
  rfncCard: {
    backgroundColor: 'white', borderRadius: S.scale(24), padding: S.pad(18),
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06, shadowRadius: 20, elevation: 2,
  },
  rfncComplete: {
    backgroundColor: '#F0FDF4', borderWidth: 1.5, borderColor: '#BBF7D0',
  },
  rfncTitle: { fontSize: S.font(18), fontWeight: '700', color: '#1B1B1B', marginBottom: S.pad(6) },
  rfncHelper: {
    fontSize: S.font(12), color: '#64748B', lineHeight: S.font(18),
    marginBottom: S.pad(14),
  },
  rfncProgressRow: { flexDirection: 'row', alignItems: 'center', gap: S.pad(10), marginBottom: S.pad(16) },
  rfncProgressBg: {
    flex: 1, height: 8, borderRadius: 4, backgroundColor: '#F1F5F9', overflow: 'hidden',
  },
  rfncProgressFill: { height: '100%', borderRadius: 4, backgroundColor: '#2E7D32' },
  rfncProgressText: { fontSize: S.font(13), fontWeight: '700', color: '#1B1B1B' },
  rfncProgressText: { fontSize: S.font(13), fontWeight: '700', color: '#1B1B1B' },
  rfncItems: { gap: S.pad(10) },
  rfncRow: {
    flexDirection: 'row', alignItems: 'center', gap: S.pad(12),
    paddingVertical: S.pad(12), paddingHorizontal: S.pad(14),
    backgroundColor: '#FAFBFC', borderRadius: S.scale(14),
  },
  rfncRowDone: { backgroundColor: '#F0FDF4' },
  rfncCheck: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#D1D5DB',
    alignItems: 'center', justifyContent: 'center',
  },
  rfncCheckDone: { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
  rfncEmoji: { fontSize: S.font(18) },
  rfncLabel: { fontSize: S.font(14), fontWeight: '500', color: '#64748B', flex: 1 },
  rfncLabelDone: { color: '#1B1B1B', fontWeight: '600' },
  rfncCheckBig: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center',
    marginBottom: S.pad(12),
  },
  rfncReadyLabel: { fontSize: S.font(20), fontWeight: '800', color: '#2E7D32', marginBottom: S.pad(4) },
  rfncReadyDesc: { fontSize: S.font(13), color: '#64748B', lineHeight: S.font(19), marginBottom: S.pad(16) },
  rfncReadyMeta: {
    backgroundColor: 'white', borderRadius: S.scale(16), padding: S.pad(14),
    borderWidth: 1, borderColor: '#DCFCE7',
  },
  rfncMetaItem: { flexDirection: 'row', alignItems: 'center', gap: S.pad(8), paddingVertical: S.pad(8) },
  rfncMetaDivider: { height: 1, backgroundColor: '#DCFCE7', marginVertical: S.pad(2) },
  rfncMetaLabel: { fontSize: S.font(11), color: '#64748B', flex: 1 },
  rfncMetaValue: { fontSize: S.font(13), fontWeight: '700', color: '#1B1B1B' },

  /* ─── CALENDAR ─── */
  calCard: {
    backgroundColor: 'white', borderRadius: S.scale(28), padding: S.pad(S.isSmall ? 16 : 20),
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06, shadowRadius: 28, elevation: 3,
  },
  calCollapsed: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  calCollapsedLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  calCollapsedMonth: { fontSize: S.font(15), fontWeight: '700', color: '#1B1B1B' },
  calCollapsedRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  calCollapsedStreak: { fontSize: S.font(12), fontWeight: '600', color: '#F59E0B' },
  calMissedBadge: {
    paddingVertical: 2, paddingHorizontal: 6, borderRadius: 4, backgroundColor: '#FEF2F2',
  },
  calMissedBadgeText: { fontSize: S.font(9), fontWeight: '700', color: '#EF4444' },
  calConsistency: { fontSize: S.font(11), fontWeight: '700', color: '#2E7D32' },

  calQuickStats: {
    flexDirection: 'row', alignItems: 'center', marginTop: S.pad(8),
    paddingTop: S.pad(8), borderTopWidth: 1, borderTopColor: '#F1F5F9',
  },
  calQuickStat: { flex: 1, alignItems: 'center' },
  calQuickStatValue: { fontSize: S.font(15), fontWeight: '800', color: '#1B1B1B' },
  calQuickStatLabel: { fontSize: S.font(8), fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.3 },
  calQuickStatDiv: { width: 1, height: 16, backgroundColor: '#F1F5F9' },

  calNavRow: { flexDirection: 'row', alignItems: 'center', gap: S.pad(8), marginTop: S.pad(14) },
  calNavBtn: { width: S.scale(32), height: S.scale(32), borderRadius: S.scale(16), backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  calTitle: { fontSize: S.font(S.isSmall ? 14 : 16), fontWeight: '700', color: '#1B1B1B' },
  calDayLabels: { flexDirection: 'row', marginTop: S.pad(12), marginBottom: S.pad(6) },
  calDayLabel: { width: CAL_W, textAlign: 'center', fontSize: S.font(S.isSmall ? 9 : 10), color: '#94A3B8', fontWeight: '500' },
  calGrid: {},
  calDayCell: {
    width: CAL_W, height: S.isSmall ? 30 : 34, alignItems: 'center', justifyContent: 'center',
    borderRadius: S.scale(8),
  },
  calDayCellToday: { backgroundColor: '#E8F5E9' },
  calDayDot: { width: 5, height: 5, borderRadius: 2.5, position: 'absolute', top: 2 },
  calReminderDot: {
    position: 'absolute', top: 1, right: 1, width: 6, height: 6, borderRadius: 3,
    backgroundColor: '#F59E0B', zIndex: 2,
  },
  calDayNum: { fontSize: S.font(S.isSmall ? 11 : 12), fontWeight: '500', color: '#1B1B1B' },
  calDayNumToday: { color: '#2E7D32', fontWeight: '700' },
  calDayPulse: {
    position: 'absolute', width: S.scale(30), height: S.scale(30), borderRadius: S.scale(15),
    borderWidth: 2, borderColor: 'rgba(46,125,50,0.2)',
  },
  calLegend: { flexDirection: 'row', gap: S.pad(10), marginTop: S.pad(10), flexWrap: 'wrap' },
  calLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  calLegendDot: { width: S.scale(6), height: S.scale(6), borderRadius: 3 },
  calLegendText: { fontSize: S.font(S.isSmall ? 8 : 9), color: '#94A3B8' },

  /* ─── DETAIL MODAL ─── */
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
  modalInsightText: { fontSize: S.font(12), color: '#64748B', lineHeight: 18 },
  modalActionBtn: { borderRadius: S.scale(14), overflow: 'hidden' },
  modalActionGrad: { paddingVertical: S.pad(14), alignItems: 'center' },
  modalActionText: { fontSize: S.font(15), fontWeight: '700', color: '#fff' },

  /* ─── GOONA IQ ─── */
  iqSectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: S.pad(22), marginBottom: S.pad(12) },
  iqTitle: { fontSize: S.font(16), fontWeight: '700', color: '#1B1B1B' },
  iqCard: { flexDirection: 'row', gap: 12, borderRadius: 16, padding: S.pad(14), marginBottom: 8 },
  iqIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  iqContent: { flex: 1 },
  iqTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  iqCardTitle: { fontSize: 14, fontWeight: '700', color: '#1B1B1B', flex: 1 },
  iqBadge: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 6, marginLeft: 8 },
  iqBadgeText: { fontSize: 10, fontWeight: '700' },
  iqDesc: { fontSize: S.font(12), color: '#64748B', lineHeight: 16 },
})
