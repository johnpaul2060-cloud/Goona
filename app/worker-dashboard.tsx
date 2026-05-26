import React, { useEffect, useState } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Dimensions, Alert,
} from 'react-native'
import GoonaIcon from '../components/ui/GoonaIcon'
import { Bell, ChevronRight, Package, RefreshCw, FileText, XCircle, Camera, ClipboardCheck, Clock, Cloud } from 'lucide-react-native'
import Svg, { Circle } from 'react-native-svg'
import { StatusBar } from 'expo-status-bar'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence,
  withTiming, withSpring, withDelay, FadeInUp, interpolate, Extrapolation, Easing,
} from 'react-native-reanimated'
import BottomDock from '../components/navigation/BottomDock'

const { width: SCREEN_W } = Dimensions.get('window')

const CARD_GAP = 12
const H_PADDING = 24
const CONTENT_W = SCREEN_W - H_PADDING * 2
const HALF_GAP = CARD_GAP / 2

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function PulseDot({ color = '#AEEA00', size = 5 }: { color?: string; size?: number }) {
  const opacity = useSharedValue(1)
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(0.3, { duration: 2000 }), withTiming(1, { duration: 2000 })),
      -1, true,
    )
  }, [])
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }))
  return <Animated.View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }, style]} />
}

function usePressScale(scaleTo = 0.97) {
  const scale = useSharedValue(1)
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
  return {
    style,
    onPressIn: () => { scale.value = withSpring(scaleTo, { damping: 15, stiffness: 200 }) },
    onPressOut: () => { scale.value = withSpring(1, { damping: 15, stiffness: 200 }) },
  }
}

const waStyles = StyleSheet.create({
  wrap: { width: 48, height: 48, position: 'relative' },
  grad: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  initials: { color: '#fff', fontWeight: '700', fontSize: 17 },
  dot: {
    position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6,
    borderWidth: 2.5, borderColor: '#F8F9F5',
  },
})

function WorkerAvatar({ initials, online }: { initials: string; online: boolean }) {
  return (
    <View style={waStyles.wrap}>
      <LinearGradient
        colors={['#0F172A', '#00695C']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={waStyles.grad}
      >
        <Text style={waStyles.initials}>{initials}</Text>
      </LinearGradient>
      <View
        style={[
          waStyles.dot,
          { backgroundColor: online ? '#22C55E' : '#94A3B8' },
          { shadowColor: online ? '#22C55E' : '#94A3B8', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 6, elevation: 4 },
        ]}
      />
    </View>
  )
}

function NotifIcon({ hasDot }: { hasDot?: boolean }) {
  return (
    <View>
      <GoonaIcon icon={Bell} size={22} color="#1F2937" />
      {hasDot && <View style={{ position: 'absolute', top: 1, right: 1, width: 8, height: 8, borderRadius: 4, backgroundColor: '#16A34A', borderWidth: 1.5, borderColor: 'white' }} />}
    </View>
  )
}

function CompletionRing({ progress, size = 72, strokeWidth = 5 }: { progress: number; size?: number; strokeWidth?: number }) {
  const r = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - progress / 100)
  const half = size / 2
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle cx={half} cy={half} r={r} stroke="rgba(255,255,255,0.12)" strokeWidth={strokeWidth} fill="none" />
      <Circle
        cx={half} cy={half} r={r}
        stroke="#AEEA00" strokeWidth={strokeWidth} fill="none"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${half} ${half})`}
      />
    </Svg>
  )
}

function OperationalTag({ label, glow }: { label: string; glow?: boolean }) {
  const pulse = useSharedValue(1)
  useEffect(() => {
    if (glow) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.04, { duration: 800 }),
          withTiming(1, { duration: 800 }),
        ),
        -1, true,
      )
    }
  }, [glow])
  const animStyle = useAnimatedStyle(() => ({
    shadowOpacity: glow ? interpolate(pulse.value, [1, 1.04], [0.15, 0.35], Extrapolation.CLAMP) : 0.1,
    transform: glow ? [{ scale: pulse.value }] : [],
  }))
  return (
    <Animated.View style={[otStyles.tag, animStyle, glow && otStyles.tagGlow]}>
      <Text style={otStyles.tagText}>{label}</Text>
    </Animated.View>
  )
}
const otStyles = StyleSheet.create({
  tag: {
    paddingVertical: 5, paddingHorizontal: 14, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#AEEA00', shadowOffset: { width: 0, height: 0 }, shadowRadius: 10, elevation: 2,
  },
  tagGlow: {
    backgroundColor: 'rgba(174,234,0,0.08)',
    borderColor: 'rgba(174,234,0,0.2)',
  },
  tagText: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.9)', letterSpacing: 0.3 },
})

function StatusPill({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <View style={spStyles.pill}>
      <Text style={spStyles.label}>{label}</Text>
      <Text style={[spStyles.value, accent ? { color: accent } : undefined]}>{value}</Text>
    </View>
  )
}
const spStyles = StyleSheet.create({
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 50,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 5, paddingHorizontal: 12,
  },
  label: { fontSize: 10, fontWeight: '500', color: 'rgba(255,255,255,0.65)' },
  value: { fontSize: 10, fontWeight: '700', color: '#AEEA00' },
})

function MiniProgress({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={mpStyles.row}>
      <View style={mpStyles.labelRow}>
        <Text style={mpStyles.label}>{label}</Text>
        <Text style={mpStyles.val}>{value}%</Text>
      </View>
      <View style={mpStyles.track}>
        <View style={[mpStyles.fill, { width: `${value}%`, backgroundColor: color }]} />
      </View>
    </View>
  )
}
const mpStyles = StyleSheet.create({
  row: { marginBottom: 8 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { fontSize: 11, color: '#64748B', fontWeight: '500' },
  val: { fontSize: 11, fontWeight: '600', color: '#1B1B1B' },
  track: { height: 5, backgroundColor: '#F1F5F9', borderRadius: 10, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 10 },
})

function QuickLogCard({
  icon, label, desc, gradient, onPress,
}: {
  icon: React.ReactNode; label: string; desc: string; gradient: readonly [string, string, ...string[]]; onPress?: () => void
}) {
  const { style, onPressIn, onPressOut } = usePressScale(0.95)
  return (
    <Animated.View style={style}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={qlStyles.card}
      >
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={qlStyles.iconWrap}
        >
          {icon}
        </LinearGradient>
        <Text style={qlStyles.label}>{label}</Text>
        <Text style={qlStyles.desc}>{desc}</Text>
      </TouchableOpacity>
    </Animated.View>
  )
}
const qlStyles = StyleSheet.create({
  card: {
    backgroundColor: 'white', borderRadius: 24, padding: 18,
    alignItems: 'center', flex: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05, shadowRadius: 24, elevation: 3,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)',
  },
  iconWrap: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  label: { fontSize: 14, fontWeight: '700', color: '#1B1B1B', marginBottom: 2 },
  desc: { fontSize: 10, color: '#94A3B8', textAlign: 'center' },
})

type TaskStatus = 'idle' | 'started' | 'completed' | 'uploading'

function TaskCard({
  title, priority, deadline, action, index,
}: {
  title: string; priority: 'High' | 'Medium' | 'Routine'; deadline: string; action: 'Start Task' | 'Mark Complete' | 'Upload'; index: number
}) {
  const [status, setStatus] = useState<TaskStatus>('idle')
  const { style, onPressIn, onPressOut } = usePressScale()

  const priorityColor = priority === 'High' ? '#EF4444' : priority === 'Medium' ? '#F59E0B' : '#16A34A'
  const priorityBg = priority === 'High' ? '#FEF2F2' : priority === 'Medium' ? '#FFFBEB' : '#F0FDF4'

  const handleAction = () => {
    if (action === 'Start Task') {
      setStatus('started')
      setTimeout(() => setStatus('completed'), 2000)
    } else if (action === 'Mark Complete') {
      setStatus('completed')
    } else if (action === 'Upload') {
      setStatus('uploading')
      setTimeout(() => setStatus('completed'), 2500)
    }
  }

  const buttonLabel = status === 'idle' ? action
    : status === 'started' ? 'Started \u2713'
    : status === 'uploading' ? 'Uploading\u2026'
    : '\u2713 Completed'

  const isComplete = status === 'completed'

  return (
    <Animated.View entering={FadeInUp.duration(500).delay(600 + index * 80).springify()} style={style}>
      <View style={[tkStyles.card, isComplete && tkStyles.completedCard]}>
        <View style={tkStyles.left}>
          <View style={[tkStyles.priorityDot, { backgroundColor: priorityColor }]} />
          <View style={tkStyles.info}>
            <Text style={[tkStyles.title, isComplete && tkStyles.completedText]}>{title}</Text>
            <View style={tkStyles.meta}>
              <View style={[tkStyles.priorityBadge, { backgroundColor: priorityBg }]}>
                <Text style={[tkStyles.priorityText, { color: priorityColor }]}>{priority}</Text>
              </View>
              <Text style={tkStyles.deadline}>{deadline}</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleAction}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          disabled={isComplete}
          style={[
            tkStyles.actionBtn,
            isComplete ? tkStyles.actionDone : priority === 'High' ? tkStyles.actionHigh : tkStyles.actionDefault,
          ]}
        >
          <Text style={[
            tkStyles.actionText,
            isComplete && tkStyles.actionTextDone,
            priority === 'High' && !isComplete && { color: 'white' },
          ]}>{buttonLabel}</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  )
}
const tkStyles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'white', borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04, shadowRadius: 20, elevation: 2,
    minHeight: 72,
  },
  completedCard: { opacity: 0.6 },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
  priorityDot: { width: 4, height: 32, borderRadius: 2, marginRight: 12 },
  info: { flex: 1 },
  title: { fontSize: 14, fontWeight: '600', color: '#1B1B1B', marginBottom: 4 },
  completedText: { textDecorationLine: 'line-through', color: '#94A3B8' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  priorityBadge: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 50 },
  priorityText: { fontSize: 10, fontWeight: '600' },
  deadline: { fontSize: 11, color: '#94A3B8' },
  actionBtn: {
    paddingVertical: 8, paddingHorizontal: 16, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  actionHigh: { backgroundColor: '#00695C' },
  actionDefault: { backgroundColor: '#F1F5F9' },
  actionDone: { backgroundColor: '#F0FDF4' },
  actionText: { fontSize: 12, fontWeight: '600', color: '#1F2937' },
  actionTextDone: { color: '#16A34A' },
})

function BatchCard({ index }: { index: number }) {
  return (
    <Animated.View entering={FadeInUp.duration(500).delay(850 + index * 80).springify()}>
      <LinearGradient
        colors={['#FFFFFF', '#F8FAF7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={bcStyles.card}
      >
        <View style={bcStyles.header}>
          <View style={bcStyles.headerLeft}>
            <View style={bcStyles.batchIcon}>
              <GoonaIcon icon={Package} size={18} color="#2E7D32" />
            </View>
            <View>
              <Text style={bcStyles.batchName}>Broiler Batch A</Text>
              <Text style={bcStyles.batchSub}>480 birds \u2022 Day 24 \u2022 Health: Good</Text>
            </View>
          </View>
          <View style={bcStyles.healthBadge}>
            <PulseDot color="#22C55E" size={4} />
            <Text style={bcStyles.healthText}>Good</Text>
          </View>
        </View>

        <View style={bcStyles.divider} />

        <View style={bcStyles.metrics}>
          <MiniProgress label="Feed" value={72} color="#2E7D32" />
          <MiniProgress label="Mortality" value={3.2} color="#EF4444" />
          <MiniProgress label="Avg Weight" value={84} color="#1A56FF" />
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          style={bcStyles.viewBtn}
          onPress={() => router.push({ pathname: '/batch-details/[id]', params: { id: 'batch-a' } })}
        >
          <Text style={bcStyles.viewBtnText}>View Batch Details</Text>
          <GoonaIcon icon={ChevronRight} size={14} color="#2E7D32" />
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  )
}
const bcStyles = StyleSheet.create({
  card: {
    borderRadius: 24, padding: 20,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04, shadowRadius: 24, elevation: 3,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  batchIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center',
  },
  batchName: { fontWeight: '700', fontSize: 16, color: '#1B1B1B' },
  batchSub: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
  healthBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F0FDF4', borderRadius: 50,
    paddingVertical: 4, paddingHorizontal: 10,
  },
  healthText: { fontSize: 10, fontWeight: '600', color: '#16A34A' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 14 },
  metrics: {},
  viewBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, marginTop: 4,
    backgroundColor: '#F0FDF4', borderRadius: 14,
  },
  viewBtnText: { fontSize: 13, fontWeight: '600', color: '#2E7D32' },
})

function FeedItem({
  icon, iconBg, iconColor, text, time, synced, index,
}: {
  icon: React.ReactNode; iconBg: string; iconColor: string; text: string; time: string; synced: boolean; index: number
}) {
  return (
    <Animated.View entering={FadeInUp.duration(400).delay(900 + index * 60).springify()}>
      <View style={fiStyles.row}>
        <View style={[fiStyles.icon, { backgroundColor: iconBg }]}>
          {icon}
        </View>
        <View style={fiStyles.content}>
          <Text style={fiStyles.text} numberOfLines={2}>{text}</Text>
          <View style={fiStyles.bottom}>
            <Text style={fiStyles.time}>{time}</Text>
            <View style={fiStyles.syncRow}>
              <View style={[fiStyles.syncDot, { backgroundColor: synced ? '#16A34A' : '#F59E0B' }]} />
              <Text style={[fiStyles.syncText, { color: synced ? '#16A34A' : '#F59E0B' }]}>
                {synced ? 'Synced' : 'Pending'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  )
}
const fiStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    paddingVertical: 12, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  icon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  content: { flex: 1 },
  text: { fontSize: 13, lineHeight: 18, color: '#1B1B1B', fontWeight: '500' },
  bottom: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  time: { fontSize: 11, color: '#94A3B8' },
  syncRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  syncDot: { width: 5, height: 5, borderRadius: 2.5 },
  syncText: { fontSize: 10, fontWeight: '500' },
})

function SyncBar() {
  const pulseGlow = useSharedValue(1)
  useEffect(() => {
    pulseGlow.value = withRepeat(
      withSequence(
        withTiming(1.03, { duration: 1200 }),
        withTiming(1, { duration: 1200 }),
      ),
      -1, true,
    )
  }, [])

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseGlow.value }],
    shadowOpacity: interpolate(pulseGlow.value, [1, 1.03], [0.1, 0.3], Extrapolation.CLAMP),
  }))

  return (
    <Animated.View entering={FadeInUp.duration(500).delay(1100).springify()}>
      <Animated.View style={[sbStyles.card, glowStyle]}>
        <LinearGradient
          colors={['#F0FDF4', '#E8F5E9']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: 22 }]}
          pointerEvents="none"
        />
        <View style={sbStyles.content}>
          <View style={sbStyles.left}>
            <View style={sbStyles.iconWrap}>
              <GoonaIcon icon={RefreshCw} size={18} color="#2E7D32" />
            </View>
            <View>
              <Text style={sbStyles.title}>Offline Sync Ready</Text>
              <Text style={sbStyles.sub}>3 pending \u2022 Last synced 2 min ago</Text>
            </View>
          </View>
          <View style={sbStyles.badge}>
            <PulseDot color="#16A34A" size={4} />
            <Text style={sbStyles.badgeText}>Live</Text>
          </View>
        </View>
      </Animated.View>
    </Animated.View>
  )
}
const sbStyles = StyleSheet.create({
  card: {
    borderRadius: 22, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(46,125,50,0.08)',
    shadowColor: '#16A34A', shadowOffset: { width: 0, height: 4 }, shadowRadius: 16, elevation: 3,
  },
  content: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 18,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconWrap: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(46,125,50,0.1)', alignItems: 'center', justifyContent: 'center',
  },
  title: { fontWeight: '700', fontSize: 15, color: '#1B1B1B' },
  sub: { fontSize: 11, color: '#64748B', marginTop: 1 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(22,163,74,0.08)', borderRadius: 50,
    paddingVertical: 4, paddingHorizontal: 10,
  },
  badgeText: { fontSize: 10, fontWeight: '600', color: '#16A34A' },
})

export default function WorkerDashboardScreen() {
  const insets = useSafeAreaInsets()
  const greeting = getGreeting()

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.bgBlob} pointerEvents="none" />
      <View style={styles.bgGlow} pointerEvents="none" />
      <View style={styles.bgContour1} pointerEvents="none" />
      <View style={styles.bgContour2} pointerEvents="none" />
      <View style={styles.bgDotGrid} pointerEvents="none">
        {Array.from({ length: 40 }).map((_, i) => (
          <View key={i} style={[styles.bgDot, {
            left: `${(i % 8) * 13 + 4}%`,
            top: `${Math.floor(i / 8) * 16 + 4}%`,
          }]} />
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollInner,
          { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 130 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── WORKER HEADER ─── */}
        <Animated.View entering={FadeInUp.duration(500).springify()} style={styles.header}>
          <View style={styles.headerLeft}>
            <WorkerAvatar initials="CO" online />
            <View style={styles.headerInfo}>
              <Text style={styles.greeting}>{greeting}, Chinedu</Text>
              <View style={styles.roleRow}>
                <Text style={styles.role}>Senior Farmhand</Text>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Online</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            style={styles.notifBtn}
            activeOpacity={0.8}
            onPress={() => router.push('/notifications')}
          >
            <NotifIcon hasDot />
          </TouchableOpacity>
        </Animated.View>

        {/* ─── DAILY OPERATIONS HERO CARD ─── */}
        <Animated.View entering={FadeInUp.duration(600).delay(100).springify()}>
          <LinearGradient
            colors={['#00695C', '#0F766E', '#2E7D32']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroGlow1} pointerEvents="none" />
            <View style={styles.heroGlow2} pointerEvents="none" />

            <View style={styles.heroTop}>
              <View style={styles.heroTopLeft}>
                <View style={styles.heroLabelRow}>
                  <PulseDot color="#AEEA00" />
                  <Text style={styles.heroLabel}>DAILY OPERATIONS</Text>
                </View>
                <Text style={styles.heroTitle}>8 Tasks Pending</Text>
                <Text style={styles.heroSub}>3 urgent \u2022 5 routine activities</Text>
              </View>
              <View style={styles.heroRingWrap}>
                <CompletionRing progress={65} size={68} strokeWidth={5} />
                <Text style={styles.heroRingText}>65%</Text>
              </View>
            </View>

            <View style={styles.heroTags}>
              <OperationalTag label="Feed" glow />
              <OperationalTag label="Mortality" glow />
              <OperationalTag label="Weight" />
              <OperationalTag label="Sync" glow />
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ─── QUICK LOG ACTIONS ─── */}
        <Animated.View entering={FadeInUp.duration(500).delay(200).springify()}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Log</Text>
            <Text style={styles.sectionSub}>Tap to record farm activity</Text>
          </View>
        </Animated.View>

        <View style={styles.qlGrid}>
          <View style={styles.qlRow}>
            <QuickLogCard
              label="Add Feed Log"
              desc="Record feed consumption"
              gradient={['#2E7D32', '#1B5E20']}
              icon={
                <GoonaIcon icon={FileText} size={20} color="#FFFFFF" />
              }
              onPress={() => Alert.alert('Feed Log', 'Feed consumption log opened')}
            />
            <View style={{ width: CARD_GAP }} />
            <QuickLogCard
              label="Report Mortality"
              desc="Log bird losses"
              gradient={['#DC2626', '#991B1B']}
              icon={
                <GoonaIcon icon={XCircle} size={20} color="#FFFFFF" />
              }
              onPress={() => Alert.alert('Mortality', 'Mortality report form opened')}
            />
          </View>
          <View style={{ height: CARD_GAP }} />
          <View style={styles.qlRow}>
            <QuickLogCard
              label="Record Weight"
              desc="Log batch weight data"
              gradient={['#1A56FF', '#1E3A8A']}
              icon={
                <GoonaIcon icon={Package} size={20} color="#FFFFFF" />
              }
              onPress={() => Alert.alert('Weight', 'Weight recording opened')}
            />
            <View style={{ width: CARD_GAP }} />
            <QuickLogCard
              label="Upload Photo"
              desc="Capture batch photos"
              gradient={['#7C3AED', '#4C1D95']}
              icon={
                <GoonaIcon icon={Camera} size={20} color="#FFFFFF" />
              }
              onPress={() => Alert.alert('Camera', 'Camera will open for batch photos')}
            />
          </View>
        </View>

        {/* ─── ASSIGNED TASKS ─── */}
        <Animated.View entering={FadeInUp.duration(500).delay(300).springify()}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Assigned Tasks</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.sectionLink}>See All</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <View style={styles.tasksList}>
          <TaskCard
            title="Morning Feed \u2014 Pen A"
            priority="High"
            deadline="Due: 7:30 AM"
            action="Start Task"
            index={0}
          />
          <View style={{ height: 10 }} />
          <TaskCard
            title="Vaccination Check"
            priority="Medium"
            deadline="Due: 10:00 AM"
            action="Mark Complete"
            index={1}
          />
          <View style={{ height: 10 }} />
          <TaskCard
            title="Clean Water Troughs"
            priority="Routine"
            deadline="Due: 12:00 PM"
            action="Upload"
            index={2}
          />
        </View>

        {/* ─── BATCH STATUS ─── */}
        <Animated.View entering={FadeInUp.duration(500).delay(400).springify()}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Batch Status</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/batches')}>
              <Text style={styles.sectionLink}>Manage</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <BatchCard index={0} />

        {/* ─── ACTIVITY FEED ─── */}
        <Animated.View entering={FadeInUp.duration(500).delay(500).springify()}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Activity Feed</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.sectionLink}>View All</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.duration(500).delay(550).springify()}
          style={styles.feedCard}
        >
          <FeedItem
            icon={<GoonaIcon icon={ClipboardCheck} size={16} color="#16A34A" />}
            iconBg="#F0FDF4" iconColor="#16A34A"
            text="Feed log submitted \u2014 8 bags of grower feed for Pen A"
            time="2 min ago"
            synced
            index={0}
          />
          <FeedItem
            icon={<GoonaIcon icon={Clock} size={16} color="#1A56FF" />}
            iconBg="#EEF3FF" iconColor="#1A56FF"
            text="Mortality report synced \u2014 2 birds recorded in Pen B"
            time="15 min ago"
            synced
            index={1}
          />
          <FeedItem
            icon={<GoonaIcon icon={Cloud} size={16} color="#F59E0B" />}
            iconBg="#FFFBEB" iconColor="#F59E0B"
            text="Supervisor commented on your feed efficiency report"
            time="1h ago"
            synced={false}
            index={2}
          />
        </Animated.View>

        {/* ─── OFFLINE SYNC ─── */}
        <View style={{ marginTop: 24 }}>
          <SyncBar />
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      <BottomDock />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9F5' },

  /* background */
  bgBlob: {
    position: 'absolute', top: -60, right: -60,
    width: 300, height: 300, borderRadius: 150,
    backgroundColor: 'rgba(0,105,92,0.06)', zIndex: 0,
  },
  bgGlow: {
    position: 'absolute', top: '25%', left: '50%',
    width: 200, height: 200, marginLeft: -100, marginTop: -100,
    borderRadius: 100, backgroundColor: 'rgba(0,105,92,0.05)', zIndex: 0,
  },
  bgContour1: {
    position: 'absolute', top: '8%', right: '-12%',
    width: 340, height: 120, zIndex: 0,
    borderWidth: 1, borderColor: 'rgba(46,125,50,0.06)',
    borderTopLeftRadius: 170, borderTopRightRadius: 170,
    borderBottomWidth: 0,
    transform: [{ rotate: '8deg' }],
  },
  bgContour2: {
    position: 'absolute', bottom: '25%', left: '-8%',
    width: 260, height: 90, zIndex: 0,
    borderWidth: 1, borderColor: 'rgba(46,125,50,0.06)',
    borderBottomLeftRadius: 130, borderBottomRightRadius: 130,
    borderTopWidth: 0,
    transform: [{ rotate: '-6deg' }],
  },
  bgDotGrid: { position: 'absolute', inset: 0, zIndex: 0, opacity: 0.4 },
  bgDot: {
    position: 'absolute', width: 2, height: 2,
    borderRadius: 1, backgroundColor: 'rgba(0,105,92,0.1)',
  },

  /* scroll */
  scroll: { flex: 1, zIndex: 1 },
  scrollInner: { paddingHorizontal: H_PADDING },

  /* header */
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', zIndex: 5,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  headerInfo: { flex: 1 },
  greeting: { fontSize: 20, fontWeight: '800', color: '#1B1B1B', lineHeight: 24 },
  roleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  role: { fontSize: 13, fontWeight: '500', color: '#64748B' },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E' },
  statusText: { fontSize: 12, fontWeight: '500', color: '#22C55E' },
  notifBtn: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: 'white',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 14, elevation: 3,
  },

  /* hero card */
  heroCard: {
    borderRadius: 34, padding: 24, marginTop: 20, overflow: 'hidden',
    shadowColor: '#00695C', shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.24, shadowRadius: 60, elevation: 8,
  },
  heroGlow1: {
    position: 'absolute', top: '-35%', right: '-15%',
    width: 240, height: 240, borderRadius: 120,
    backgroundColor: 'rgba(174,234,0,0.08)',
  },
  heroGlow2: {
    position: 'absolute', bottom: '-10%', left: '-8%',
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  heroTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', zIndex: 1,
  },
  heroTopLeft: { flex: 1, marginRight: 16 },
  heroLabelRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 50,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 4, paddingHorizontal: 12, marginBottom: 10,
  },
  heroLabel: {
    fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.5,
  },
  heroTitle: { fontWeight: '800', fontSize: 28, color: '#fff', lineHeight: 30 },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  heroRingWrap: {
    position: 'relative',
    alignItems: 'center', justifyContent: 'center',
    width: 68, height: 68, flexShrink: 0,
  },
  heroRingText: {
    position: 'absolute', fontSize: 12, fontWeight: '700', color: '#AEEA00',
  },
  heroTags: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18, zIndex: 1,
  },

  /* section headers */
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: 24, marginBottom: 14, zIndex: 5,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1B1B1B' },
  sectionSub: { fontSize: 12, color: '#94A3B8', marginTop: 0 },
  sectionLink: { fontSize: 13, fontWeight: '600', color: '#2E7D32' },

  /* quick log */
  qlGrid: { zIndex: 5 },
  qlRow: { flexDirection: 'row' },

  /* tasks */
  tasksList: { zIndex: 5 },

  /* feed card */
  feedCard: {
    backgroundColor: 'white', borderRadius: 22, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 16, elevation: 2,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)',
    zIndex: 5,
  },
})
