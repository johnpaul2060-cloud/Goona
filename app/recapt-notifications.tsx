import React, { useEffect, useState, useMemo } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Dimensions,
} from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming,
  withSpring, withRepeat, withSequence, withDelay,
  FadeInUp, FadeIn, FadeOutDown, Easing,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import BottomDock from '../components/navigation/BottomDock'
import {
  useRecoveryStore, fmtDateFromParts, DayRecord,
  computeStreak, computeMonthlyStats, generateInsights,
} from '../store/useRecoveryStore'

const { width: SCREEN_W } = Dimensions.get('window')

type NotifPriority = 'urgent' | 'upcoming' | 'insight' | 'achievement'
type NotifActionType = 'save' | 'complete' | 'snooze' | 'reschedule' | 'view_plan' | 'apply' | 'dismiss'

type NotifAction = {
  label: string
  action: NotifActionType
  primary?: boolean
}

type NotifItem = {
  id: string
  type: string
  priority: NotifPriority
  icon: string
  title: string
  desc: string
  time: string
  actions: NotifAction[]
}

const PRIORITY_LABELS: Record<NotifPriority, string> = {
  urgent: 'Urgent',
  upcoming: 'Upcoming',
  insight: 'Insight',
  achievement: 'Achievement',
}

const PRIORITY_COLORS: Record<NotifPriority, string> = {
  urgent: '#DC2626',
  upcoming: '#D97706',
  insight: '#1A56FF',
  achievement: '#16A34A',
}

const PRIORITY_BGS: Record<NotifPriority, string> = {
  urgent: 'rgba(220,38,38,0.08)',
  upcoming: 'rgba(217,119,6,0.08)',
  insight: 'rgba(26,86,255,0.08)',
  achievement: 'rgba(22,163,74,0.08)',
}

const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'urgent', label: 'Urgent' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'insight', label: 'Insights' },
  { key: 'achievement', label: 'Achievements' },
] as const

type FilterKey = (typeof FILTER_TABS)[number]['key']

/* ─── Helpers ─── */
function computeReadiness(records: Record<string, DayRecord>): number {
  const now = new Date()
  const totalDays = now.getDate()
  if (totalDays === 0) return 0
  let weightedSum = 0
  let maxSum = 0
  for (let d = 1; d <= totalDays; d++) {
    const ds = fmtDateFromParts(now.getFullYear(), now.getMonth(), d)
    const r = records[ds]
    const weight = 1 + (d / totalDays)
    maxSum += weight
    if (r?.status === 'completed') weightedSum += weight
    else if (r?.status === 'exceeded') weightedSum += weight * 1.2
    else if (r?.status === 'partial') weightedSum += weight * 0.5
  }
  const base = maxSum > 0 ? weightedSum / maxSum : 0
  const streak = computeStreak(records)
  return Math.min(base + Math.min(streak * 0.015, 0.15), 1)
}

function generateNotifications(records: Record<string, DayRecord>): NotifItem[] {
  const list: NotifItem[] = []
  const now = new Date()
  const todayStr = fmtDateFromParts(now.getFullYear(), now.getMonth(), now.getDate())
  const todayRec = records[todayStr]
  const todayChecked = todayRec && todayRec.status !== 'none' && todayRec.status !== undefined

  /* 1. Urgent: savings due today */
  if (!todayChecked) {
    const streak = computeStreak(records)
    list.push({
      id: 'save-today', type: 'savings_reminder', priority: 'urgent',
      icon: '\u{1F4B0}', title: 'Weekly savings contribution due today',
      desc: `Your \u20A685,000 weekly recapitalization target is due. Save now to maintain your ${streak}-day streak.`,
      time: 'Today',
      actions: [
        { label: 'Save Now', action: 'save', primary: true },
        { label: 'Snooze', action: 'snooze' },
        { label: 'Reschedule', action: 'reschedule' },
      ],
    })
  }

  /* 2. Urgent: missed contributions (last 7 days) */
  for (let i = 1; i <= 7; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    const ds = fmtDateFromParts(d.getFullYear(), d.getMonth(), d.getDate())
    if (records[ds]?.status === 'missed') {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      list.push({
        id: `missed-${ds}`, type: 'missed_contribution', priority: 'urgent',
        icon: '\u23F0', title: `Missed contribution \u2014 ${dayNames[d.getDay()]}`,
        desc: `You missed your scheduled \u20A685,000 recapitalization contribution. Catch up to avoid delaying your production cycle.`,
        time: i === 1 ? 'Yesterday' : `${i} days ago`,
        actions: [
          { label: 'Save Now', action: 'save', primary: true },
          { label: 'Dismiss', action: 'dismiss' },
        ],
      })
      break
    }
  }

  /* 3. Insight: recovery tracking */
  const progress = computeReadiness(records)
  list.push({
    id: 'recovery-track', type: 'recovery_tracking', priority: 'insight',
    icon: '\u{1F4CA}', title: `${Math.round(progress * 100)}% of next production cycle target achieved`,
    desc: `Estimated farm restart readiness based on your current recovery pace. Consistent weekly savings accelerate your timeline.`,
    time: 'Updated today',
    actions: [{ label: 'View Plan', action: 'view_plan' }],
  })

  /* 4. Insight: GOONA IQ financial insights */
  const insights = generateInsights(records)
  insights.slice(0, 2).forEach((msg, i) => {
    list.push({
      id: `iq-${i}`, type: 'goona_iq_insight', priority: 'insight',
      icon: '\u{1F9E0}', title: i === 0 ? 'GOONA IQ Financial Insight' : 'GOONA IQ Recommendation',
      desc: msg,
      time: 'AI-generated',
      actions: [
        { label: 'Apply', action: 'apply', primary: true },
        { label: 'Dismiss', action: 'dismiss' },
      ],
    })
  })

  /* 5. Achievement: streak milestones */
  const streak = computeStreak(records)
  if (streak >= 7) {
    list.push({
      id: 'streak-milestone', type: 'achievement_streak', priority: 'achievement',
      icon: '\u{1F3C6}', title: `${streak}-Day Recovery Streak!`,
      desc: `You've maintained consistent capital recovery for ${streak} consecutive days. Exceptional financial discipline keeps you on track.`,
      time: 'Active',
      actions: [{ label: 'Dismiss', action: 'dismiss' }],
    })
  }

  /* 6. Achievement: recovery milestone */
  if (progress >= 0.5) {
    list.push({
      id: 'recovery-milestone', type: 'achievement_milestone', priority: 'achievement',
      icon: '\u{1F389}', title: `${Math.round(progress * 100)}% Recovery Milestone Reached`,
      desc: `Over half of your recapitalization target is achieved. Your next production cycle is within sight.`,
      time: 'This month',
      actions: [{ label: 'Dismiss', action: 'dismiss' }],
    })
  }

  /* 7. Achievement: exceeded target */
  const stats = computeMonthlyStats(records, now.getFullYear(), now.getMonth())
  if (stats.exceeded >= 3) {
    list.push({
      id: 'exceeded-goal', type: 'achievement_exceeded', priority: 'achievement',
      icon: '\u{1F3AF}', title: `Exceeded Recovery Target ${stats.exceeded}x This Month`,
      desc: `You've surpassed your weekly recovery goal multiple times this month. Strong financial momentum toward your production cycle.`,
      time: 'This month',
      actions: [{ label: 'Dismiss', action: 'dismiss' }],
    })
  }

  /* 8. Upcoming: next savings due */
  if (todayChecked) {
    list.push({
      id: 'due-tomorrow', type: 'savings_upcoming', priority: 'upcoming',
      icon: '\u{1F4C5}', title: 'Next savings contribution due tomorrow',
      desc: 'Your \u20A685,000 weekly recapitalization target resets tomorrow. Early payments build consistency.',
      time: 'Tomorrow',
      actions: [
        { label: 'Save Now', action: 'save', primary: true },
        { label: 'Snooze', action: 'snooze' },
      ],
    })
  }

  return list
}

/* ─── Components ─── */
function BackIcon() {
  return (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <Path d="M15 18L9 12L15 6" stroke="#1B1B1B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

function NotifCard({
  item, index, onAction,
}: {
  item: NotifItem; index: number; onAction: (id: string, action: NotifActionType) => void
}) {
  const pc = PRIORITY_COLORS[item.priority]
  const pb = PRIORITY_BGS[item.priority]
  const entering = FadeInUp.duration(400).delay(100 + index * 60).springify().damping(16)

  return (
    <Animated.View entering={entering} exiting={FadeOutDown.duration(250)}>
      <View style={ncStyles.card}>
        {/* Priority bar */}
        <View style={[ncStyles.priorityBar, { backgroundColor: pc }]} />

        {/* Header */}
        <View style={ncStyles.header}>
          <View style={[ncStyles.iconWrap, { backgroundColor: pb }]}>
            <Text style={ncStyles.icon}>{item.icon}</Text>
          </View>
          <View style={ncStyles.headerContent}>
            <View style={ncStyles.priorityRow}>
              <View style={[ncStyles.priorityTag, { backgroundColor: pb }]}>
                <Text style={[ncStyles.priorityText, { color: pc }]}>{PRIORITY_LABELS[item.priority]}</Text>
              </View>
              <Text style={ncStyles.time}>{item.time}</Text>
            </View>
            <Text style={ncStyles.title} numberOfLines={2}>{item.title}</Text>
          </View>
        </View>

        {/* Description */}
        <Text style={ncStyles.desc} numberOfLines={3}>{item.desc}</Text>

        {/* Actions */}
        {item.actions.length > 0 && (
          <View style={ncStyles.actions}>
            {item.actions.map((a) => (
              <TouchableOpacity
                key={a.action}
                activeOpacity={0.85}
                onPress={() => onAction(item.id, a.action)}
                style={[
                  ncStyles.actionBtn,
                  a.primary ? { backgroundColor: pc, borderColor: pc } : { backgroundColor: 'rgba(255,255,255,0.6)', borderColor: 'rgba(0,0,0,0.06)' },
                ]}
              >
                <Text style={[ncStyles.actionText, { color: a.primary ? '#fff' : '#1F2937' }]}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </Animated.View>
  )
}

const ncStyles = StyleSheet.create({
  card: {
    backgroundColor: 'white', borderRadius: 24, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05, shadowRadius: 20, elevation: 2,
    overflow: 'hidden',
  },
  priorityBar: { height: 3 },
  header: { flexDirection: 'row', padding: 16, paddingBottom: 0, gap: 12 },
  iconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  icon: { fontSize: 16 },
  headerContent: { flex: 1 },
  priorityRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  priorityTag: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 50 },
  priorityText: { fontSize: 9, fontWeight: '700' },
  time: { fontSize: 10, color: '#94A3B8' },
  title: { fontSize: 14, fontWeight: '700', color: '#1F2937', lineHeight: 19 },
  desc: { fontSize: 12, color: '#64748B', lineHeight: 18, paddingHorizontal: 16, marginTop: 8 },
  actions: { flexDirection: 'row', gap: 8, padding: 16, paddingTop: 10, flexWrap: 'wrap' },
  actionBtn: {
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10,
    borderWidth: 1.5,
  },
  actionText: { fontSize: 12, fontWeight: '700' },
})

/* ─── Main Screen ─── */
export default function RecaptNotificationsScreen() {
  const insets = useSafeAreaInsets()
  const records = useRecoveryStore((s) => s.records)
  const checkIn = useRecoveryStore((s) => s.checkIn)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<FilterKey>('all')
  const [savedMsg, setSavedMsg] = useState('')

  const allNotifs = useMemo(() => generateNotifications(records), [records])
  const activeNotifs = allNotifs.filter((n) => !dismissed.has(n.id))
  const filteredNotifs = activeNotifs.filter((n) => filter === 'all' || n.priority === filter)

  const handleAction = (id: string, action: NotifActionType) => {
    const now = new Date()
    const todayStr = fmtDateFromParts(now.getFullYear(), now.getMonth(), now.getDate())

    switch (action) {
      case 'save':
      case 'complete':
        checkIn(todayStr, 'completed', 85000)
        setSavedMsg('Savings recorded! +85,000')
        setTimeout(() => setSavedMsg(''), 2500)
        setDismissed((prev) => new Set(prev).add(id))
        break
      case 'snooze':
      case 'dismiss':
      case 'reschedule':
        setDismissed((prev) => new Set(prev).add(id))
        break
      case 'view_plan':
        router.push('/plan-recapt')
        break
      case 'apply':
        setDismissed((prev) => new Set(prev).add(id))
        break
    }
  }

  /* ── Header ── */
  const TOP = insets.top

  return (
    <View style={s.container}>
      <StatusBar style="dark" />

      {/* Background decoration */}
      <View style={s.bgBlob} pointerEvents="none" />
      <View style={s.bgGlow} pointerEvents="none" />

      {/* Header */}
      <BlurView intensity={55} tint="light" style={[s.headerBlur, { paddingTop: TOP + 8 }]}>
        <View style={s.headerRow}>
          <TouchableOpacity style={s.backBtn} activeOpacity={0.7} onPress={() => router.back()}>
            <BackIcon />
          </TouchableOpacity>
          <View style={s.headerText}>
            <Text style={s.headerTitle}>Notifications</Text>
            <Text style={s.headerSub}>Recovery & Savings Center</Text>
          </View>
          <View style={s.headerCount}>
            <Text style={s.headerCountText}>{activeNotifs.length}</Text>
          </View>
        </View>
      </BlurView>

      {/* Saved confirmation toast */}
      {savedMsg !== '' && (
        <Animated.View entering={FadeIn.duration(200)} style={[s.toast, { top: TOP + 66 }]}>
          <LinearGradient colors={['#16A34A', '#15803D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.toastGrad}>
            <Text style={s.toastText}>{'\u2713'} {savedMsg}</Text>
          </LinearGradient>
        </Animated.View>
      )}

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollInner, { paddingTop: TOP + 100, paddingBottom: insets.bottom + 130 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.filterRow}
        >
          {FILTER_TABS.map((tab) => {
            const isActive = filter === tab.key
            const count = tab.key === 'all' ? activeNotifs.length : activeNotifs.filter((n) => n.priority === tab.key).length
            return (
              <TouchableOpacity
                key={tab.key}
                activeOpacity={0.85}
                onPress={() => setFilter(tab.key)}
                style={[s.filterTab, isActive && s.filterTabActive]}
              >
                <Text style={[s.filterText, isActive && s.filterTextActive]}>
                  {tab.label}
                </Text>
                {count > 0 && (
                  <View style={[s.filterCount, isActive && s.filterCountActive]}>
                    <Text style={[s.filterCountText, isActive && { color: '#fff' }]}>{count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            )
          })}
        </ScrollView>

        {/* Notification List */}
        {filteredNotifs.length === 0 ? (
          <Animated.View entering={FadeInUp.duration(400).springify()} style={s.emptyState}>
            <Text style={s.emptyIcon}>{'\u2705'}</Text>
            <Text style={s.emptyTitle}>All Clear</Text>
            <Text style={s.emptyDesc}>
              {filter === 'all' ? 'No pending notifications. Your recovery tracking is up to date.' : `No ${PRIORITY_LABELS[filter as NotifPriority].toLowerCase()} notifications.`}
            </Text>
          </Animated.View>
        ) : (
          filteredNotifs.map((item, i) => (
            <NotifCard key={item.id} item={item} index={i} onAction={handleAction} />
          ))
        )}

        {/* Smart Summary */}
        {activeNotifs.length > 0 && (
          <Animated.View entering={FadeInUp.duration(500).delay(400).springify()} style={s.summaryCard}>
            <LinearGradient colors={['#F0FDF4', '#DDF5F0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.summaryGrad}>
              <Text style={s.summaryTitle}>GOONA IQ Summary</Text>
              <Text style={s.summaryText}>
                You have <Text style={{ fontWeight: '700' }}>{activeNotifs.length} notification{activeNotifs.length !== 1 ? 's' : ''}</Text> pending.
                Your recovery readiness is at <Text style={{ fontWeight: '700' }}>{Math.round(computeReadiness(records) * 100)}%</Text>.
                {computeStreak(records) >= 7 ? ' Strong streak momentum. Keep it up!' : ' Consistent savings accelerate your timeline.'}
              </Text>
            </LinearGradient>
          </Animated.View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      <BottomDock />
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAF7' },
  bgBlob: {
    position: 'absolute', top: -40, right: -40, width: 280, height: 280,
    borderRadius: 140, backgroundColor: 'rgba(232,245,233,0.35)', zIndex: 0,
  },
  bgGlow: {
    position: 'absolute', top: '30%', left: '50%', width: 200, height: 200,
    marginLeft: -100, marginTop: -100, borderRadius: 100,
    backgroundColor: 'rgba(232,245,233,0.15)', zIndex: 0,
  },

  headerBlur: {
    position: 'absolute', left: 0, right: 0, zIndex: 10,
    borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.04)',
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1B1B1B' },
  headerSub: { fontSize: 12, color: '#A0AEA1', marginTop: 1 },
  headerCount: {
    minWidth: 28, height: 28, borderRadius: 14,
    backgroundColor: '#DC2626', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 6,
  },
  headerCountText: { fontSize: 13, fontWeight: '800', color: '#fff' },

  toast: { position: 'absolute', left: 20, right: 20, zIndex: 20, borderRadius: 14, overflow: 'hidden' },
  toastGrad: { paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center' },
  toastText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  scroll: { flex: 1, zIndex: 1 },
  scrollInner: { paddingHorizontal: 20 },

  filterRow: { gap: 8, marginBottom: 16, paddingVertical: 4 },
  filterTab: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 7, paddingHorizontal: 14,
    borderRadius: 50, backgroundColor: 'white',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
  },
  filterTabActive: { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
  filterText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  filterTextActive: { color: '#fff' },
  filterCount: {
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterCountActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  filterCountText: { fontSize: 10, fontWeight: '700', color: '#64748B' },

  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#1F2937', marginBottom: 6 },
  emptyDesc: { fontSize: 13, color: '#94A3B8', textAlign: 'center', lineHeight: 20, paddingHorizontal: 40 },

  summaryCard: { borderRadius: 24, marginTop: 8, overflow: 'hidden' },
  summaryGrad: { padding: 18 },
  summaryTitle: { fontSize: 14, fontWeight: '700', color: '#166534', marginBottom: 4 },
  summaryText: { fontSize: 12, color: '#374151', lineHeight: 19 },
})
