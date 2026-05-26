import React, { useEffect, useState, useRef, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView, Pressable,
  StyleSheet, Dimensions, Modal, TextInput, Alert, Platform,
} from 'react-native'
import GoonaIcon from '../components/ui/GoonaIcon'
import { ArrowLeft, Clock, User, ClipboardList, AlertCircle, FileText, ChevronRight, RefreshCw, TriangleAlert, Mic, Square, Camera, CheckCircle } from 'lucide-react-native'
import { StatusBar } from 'expo-status-bar'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import * as ImagePicker from 'expo-image-picker'
import { Audio } from 'expo-av'
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence,
  withTiming, withSpring, withDelay, FadeInUp, FadeIn,
  interpolate, Extrapolation, Easing, useDerivedValue,
} from 'react-native-reanimated'
import BottomDock from '../components/navigation/BottomDock'

const { width: SCREEN_W } = Dimensions.get('window')
const H_PADDING = 24
const CONTENT_W = SCREEN_W - H_PADDING * 2

type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue'
type PriorityLevel = 'critical' | 'urgent' | 'routine' | 'scheduled'

function usePressScale(scaleTo = 0.97) {
  const scale = useSharedValue(1)
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
  return {
    style,
    onPressIn: () => { scale.value = withSpring(scaleTo, { damping: 15, stiffness: 200 }) },
    onPressOut: () => { scale.value = withSpring(1, { damping: 15, stiffness: 200 }) },
  }
}

function PulseDot({ color = '#AEEA00', size = 5 }: { color?: string; size?: number }) {
  const opacity = useSharedValue(1)
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(0.3, { duration: 1800 }), withTiming(1, { duration: 1800 })),
      -1, true,
    )
  }, [])
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }))
  return <Animated.View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }, style]} />
}

function UrgencyPulse({ color }: { color: string }) {
  const scale = useSharedValue(1)
  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 1000 }),
        withTiming(1, { duration: 1000 }),
      ),
      -1, true,
    )
  }, [])
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    shadowOpacity: interpolate(scale.value, [1, 1.04], [0.15, 0.35], Extrapolation.CLAMP),
  }))
  return <Animated.View style={[StyleSheet.absoluteFill, { borderRadius: 30, borderWidth: 1.5, borderColor: color, opacity: 0.3 }, style]} pointerEvents="none" />
}

/* ─── Priority config ─── */
const PRIORITY_CONFIG: Record<PriorityLevel, { label: string; color: string; bg: string; glow: string }> = {
  critical: { label: 'Critical', color: '#DC2626', bg: '#FEF2F2', glow: '#DC2626' },
  urgent: { label: 'Urgent', color: '#F59E0B', bg: '#FFFBEB', glow: '#F59E0B' },
  routine: { label: 'Routine', color: '#16A34A', bg: '#F0FDF4', glow: '#16A34A' },
  scheduled: { label: 'Scheduled', color: '#1A56FF', bg: '#EEF3FF', glow: '#1A56FF' },
}

/* ─── Back Icon ─── */
function BackIcon() {
  return <GoonaIcon icon={ArrowLeft} size={22} color="#1B1B1B" />
}

/* ─── Notification Overlay ─── */
function PushNotificationOverlay({
  visible, onViewTask, onSnooze,
}: {
  visible: boolean; onViewTask: () => void; onSnooze: () => void
}) {
  const translateY = useSharedValue(-300)
  const opacity = useSharedValue(0)

  useEffect(() => {
    if (visible) {
      translateY.value = withDelay(600, withSpring(0, { damping: 18, stiffness: 160 }))
      opacity.value = withDelay(600, withTiming(1, { duration: 300 }))
    } else {
      translateY.value = withTiming(-300, { duration: 300 })
      opacity.value = withTiming(0, { duration: 200 })
    }
  }, [visible])

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }))
  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }))

  if (!visible) return null

  return (
    <Animated.View style={[notifStyles.overlay, overlayStyle]} pointerEvents="box-none">
      <Animated.View style={[notifStyles.card, containerStyle]}>
        <BlurView intensity={48} tint="light" style={notifStyles.blur} />
        <View style={notifStyles.content}>
          <View style={notifStyles.top}>
            <View style={notifStyles.urgencyRow}>
              <PulseDot color="#F59E0B" size={5} />
              <Text style={notifStyles.urgencyLabel}>NEW URGENT TASK</Text>
            </View>
            <TouchableOpacity onPress={onSnooze} activeOpacity={0.7} style={notifStyles.snoozeBtn}>
              <GoonaIcon icon={Clock} size={16} color="#64748B" />
            </TouchableOpacity>
          </View>
          <Text style={notifStyles.taskTitle}>Morning Feeding \u2014 Pen A</Text>
          <Text style={notifStyles.assignedBy}>Assigned by: Chinedu Okoro (Supervisor)</Text>
          <View style={notifStyles.metaRow}>
            <View style={notifStyles.badge}>
              <Text style={notifStyles.badgeText}>Due: 7:30 AM</Text>
            </View>
            <View style={[notifStyles.badge, { backgroundColor: 'rgba(245,158,11,0.15)' }]}>
              <Text style={[notifStyles.badgeText, { color: '#F59E0B' }]}>Urgent</Text>
            </View>
          </View>
          <View style={notifStyles.actions}>
            <TouchableOpacity style={notifStyles.viewBtn} activeOpacity={0.85} onPress={onViewTask}>
              <Text style={notifStyles.viewBtnText}>View Task</Text>
            </TouchableOpacity>
            <TouchableOpacity style={notifStyles.snoozeTextBtn} activeOpacity={0.7} onPress={onSnooze}>
              <Text style={notifStyles.snoozeText}>Snooze</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </Animated.View>
  )
}
const notifStyles = StyleSheet.create({
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100,
    paddingTop: 54, paddingHorizontal: 16,
  },
  card: {
    borderRadius: 26, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.12, shadowRadius: 40, elevation: 12,
    backgroundColor: 'rgba(255,255,255,0.65)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  blur: { ...StyleSheet.absoluteFillObject, borderRadius: 26 },
  content: { padding: 20 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  urgencyRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  urgencyLabel: {
    fontSize: 10, fontWeight: '700', color: '#F59E0B',
    letterSpacing: 0.8,
  },
  snoozeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.03)', alignItems: 'center', justifyContent: 'center' },
  taskTitle: { fontSize: 18, fontWeight: '800', color: '#1B1B1B', marginTop: 8 },
  assignedBy: { fontSize: 12, color: '#64748B', marginTop: 2 },
  metaRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  badge: { paddingVertical: 4, paddingHorizontal: 12, borderRadius: 50, backgroundColor: 'rgba(0,0,0,0.04)' },
  badgeText: { fontSize: 10, fontWeight: '600', color: '#64748B' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  viewBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 14,
    backgroundColor: '#00695C', alignItems: 'center',
  },
  viewBtnText: { fontSize: 14, fontWeight: '700', color: 'white' },
  snoozeTextBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 14,
    borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center',
  },
  snoozeText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
})

/* ─── Priority Hero Card ─── */
function PriorityHeroCard({ status, priority }: { status: TaskStatus; priority: PriorityLevel }) {
  const cfg = PRIORITY_CONFIG[priority]
  const isCritical = priority === 'critical'
  const isUrgent = priority === 'urgent'
  const statusLabel = status === 'pending' ? 'Pending' : status === 'in_progress' ? 'In Progress' : status === 'completed' ? 'Completed' : 'Overdue'
  const statusColor = status === 'pending' ? '#F59E0B' : status === 'in_progress' ? '#1A56FF' : status === 'completed' ? '#16A34A' : '#DC2626'

  return (
    <Animated.View entering={FadeInUp.duration(600).delay(80).springify()}>
      <LinearGradient
        colors={isCritical ? ['#DC2626', '#B91C1C', '#991B1B'] : isUrgent ? ['#F59E0B', '#D97706', '#B45309'] : ['#00695C', '#0F766E', '#2E7D32']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={heroStyles.card}
      >
        {(isCritical || isUrgent) && <UrgencyPulse color={isCritical ? '#EF4444' : '#FBBF24'} />}
        <View style={heroStyles.glow1} pointerEvents="none" />
        <View style={heroStyles.glow2} pointerEvents="none" />

        <View style={heroStyles.topRow}>
          <View style={[heroStyles.statusBadge, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
            <PulseDot color={statusColor} />
            <Text style={heroStyles.statusText}>{statusLabel}</Text>
          </View>
          <View style={[heroStyles.priorityBadge, { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.15)' }]}>
            <Text style={heroStyles.priorityText}>{cfg.label}</Text>
          </View>
        </View>

        <Text style={heroStyles.taskTitle}>Morning Feeding</Text>
        <Text style={heroStyles.taskSub}>Broiler Batch A \u2022 Pen A \u2022 480 birds</Text>

        <View style={heroStyles.metaRow}>
          <View style={heroStyles.metaItem}>
            <GoonaIcon icon={Clock} size={14} color="rgba(255,255,255,0.5)" />
            <Text style={heroStyles.metaText}>Due: 7:30 AM</Text>
          </View>
          <View style={heroStyles.metaItem}>
            <GoonaIcon icon={User} size={14} color="rgba(255,255,255,0.5)" />
            <Text style={heroStyles.metaText}>Supervisor: Chinedu</Text>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  )
}
const heroStyles = StyleSheet.create({
  card: {
    borderRadius: 30, padding: 24, overflow: 'hidden',
    shadowColor: '#00695C', shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25, shadowRadius: 50, elevation: 10,
  },
  glow1: {
    position: 'absolute', top: '-30%', right: '-10%',
    width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  glow2: {
    position: 'absolute', bottom: '-12%', left: '-6%',
    width: 150, height: 150, borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 50, paddingVertical: 5, paddingHorizontal: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  statusText: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.9)', letterSpacing: 0.4 },
  priorityBadge: {
    borderRadius: 50, paddingVertical: 5, paddingHorizontal: 14,
    borderWidth: 1,
  },
  priorityText: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
  taskTitle: { fontSize: 28, fontWeight: '800', color: '#fff', marginTop: 14, zIndex: 1 },
  taskSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2, zIndex: 1 },
  metaRow: { flexDirection: 'row', gap: 20, marginTop: 16, zIndex: 1 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.75)' },
})

/* ─── Task Details Row ─── */
function DetailRow({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <View style={drStyles.row}>
      <Text style={drStyles.label}>{label}</Text>
      <Text style={[drStyles.value, accent ? { color: accent } : undefined]}>{value}</Text>
    </View>
  )
}
const drStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  label: { fontSize: 13, color: '#64748B' },
  value: { fontSize: 13, fontWeight: '600', color: '#1B1B1B' },
})

/* ─── Instructions Section ─── */
function InstructionsSection() {
  return (
    <Animated.View entering={FadeInUp.duration(500).delay(250).springify()}>
      <View style={instrStyles.card}>
        <View style={instrStyles.header}>
          <GoonaIcon icon={ClipboardList} size={18} color="#2E7D32" />
          <Text style={instrStyles.headerText}>Operational Instructions</Text>
        </View>

        <View style={instrStyles.item}>
          <View style={instrStyles.dot} />
          <Text style={instrStyles.text}>Mix 8 bags of grower feed with 120L of water in the feeding troughs for Pen A.</Text>
        </View>
        <View style={instrStyles.item}>
          <View style={instrStyles.dot} />
          <Text style={instrStyles.text}>Ensure feed is distributed evenly across all 8 trough sections.</Text>
        </View>
        <View style={instrStyles.item}>
          <View style={[instrStyles.dot, { backgroundColor: '#EF4444' }]} />
          <Text style={[instrStyles.text, { color: '#DC2626' }]}>Safety: Wear gloves and boots. Do not exceed 45kg per trough.</Text>
        </View>
        <View style={instrStyles.item}>
          <View style={instrStyles.dot} />
          <Text style={instrStyles.text}>Record any birds showing signs of illness in the mortality log immediately.</Text>
        </View>

        <View style={instrStyles.notice}>
          <GoonaIcon icon={AlertCircle} size={14} color="#F59E0B" />
          <Text style={instrStyles.noticeText}>Batch warning: Low feed inventory — report to supervisor after completion.</Text>
        </View>
      </View>
    </Animated.View>
  )
}
const instrStyles = StyleSheet.create({
  card: {
    backgroundColor: 'white', borderRadius: 24, padding: 20,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04, shadowRadius: 20, elevation: 2,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  headerText: { fontSize: 15, fontWeight: '700', color: '#1B1B1B' },
  item: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#2E7D32', marginTop: 5 },
  text: { fontSize: 13, lineHeight: 19, color: '#475569', flex: 1 },
  notice: {
    flexDirection: 'row', gap: 8, marginTop: 12, padding: 14,
    backgroundColor: '#FFFBEB', borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.15)',
  },
  noticeText: { fontSize: 12, lineHeight: 17, color: '#92400E', flex: 1 },
})

/* ─── Attachment Card ─── */
function AttachmentCard({ title, type, pages, onPress }: { title: string; type: string; pages: string; onPress: () => void }) {
  const { style, onPressIn, onPressOut } = usePressScale()
  return (
    <Animated.View style={style}>
      <Pressable
        style={attStyles.card}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        <View style={attStyles.iconWrap}>
          <GoonaIcon icon={FileText} size={20} color="#2E7D32" />
        </View>
        <View style={attStyles.info}>
          <Text style={attStyles.title} numberOfLines={1}>{title}</Text>
          <Text style={attStyles.meta}>{type} \u2022 {pages}</Text>
        </View>
        <GoonaIcon icon={ChevronRight} size={16} color="#94A3B8" />
      </Pressable>
    </Animated.View>
  )
}
const attStyles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'white', borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03, shadowRadius: 8, elevation: 1,
  },
  iconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center',
  },
  info: { flex: 1 },
  title: { fontSize: 13, fontWeight: '600', color: '#1B1B1B' },
  meta: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
})

/* ─── Upload Button ─── */
function UploadButton({
  label, icon, gradient, onPress,
}: {
  label: string; icon: React.ReactNode; gradient: readonly [string, string, ...string[]]; onPress: () => void
}) {
  const { style, onPressIn, onPressOut } = usePressScale(0.94)
  return (
    <Animated.View style={[style, { flex: 1 }]}>
      <Pressable
        style={upStyles.card}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={upStyles.iconWrap}
        >
          {icon}
        </LinearGradient>
        <Text style={upStyles.label}>{label}</Text>
      </Pressable>
    </Animated.View>
  )
}
const upStyles = StyleSheet.create({
  card: {
    backgroundColor: 'white', borderRadius: 20, padding: 16,
    alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04, shadowRadius: 18, elevation: 2,
  },
  iconWrap: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  label: { fontSize: 13, fontWeight: '600', color: '#1B1B1B' },
})

/* ─── Action Button ─── */
function ActionButton({
  label, variant, onPress, disabled,
}: {
  label: string; variant: 'primary' | 'danger' | 'ghost'; onPress: () => void; disabled?: boolean
}) {
  const { style, onPressIn, onPressOut } = usePressScale()
  const isPrimary = variant === 'primary'
  const isDanger = variant === 'danger'
  const isGhost = variant === 'ghost'

  return (
    <Animated.View style={style}>
      <Pressable
        disabled={disabled}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[
          abStyles.btn,
          isPrimary && abStyles.primary,
          isDanger && abStyles.danger,
          isGhost && abStyles.ghost,
          disabled && abStyles.disabled,
        ]}
      >
        <Text style={[
          abStyles.text,
          isPrimary && abStyles.textPrimary,
          isDanger && abStyles.textDanger,
          isGhost && abStyles.textGhost,
          disabled && abStyles.textDisabled,
        ]}>{label}</Text>
      </Pressable>
    </Animated.View>
  )
}
const abStyles = StyleSheet.create({
  btn: { paddingVertical: 15, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  primary: { backgroundColor: '#00695C' },
  danger: { backgroundColor: '#FEF2F2', borderWidth: 1.5, borderColor: '#FECACA' },
  ghost: { backgroundColor: 'white', borderWidth: 1.5, borderColor: '#E2E8F0' },
  disabled: { opacity: 0.5 },
  text: { fontSize: 15, fontWeight: '700' },
  textPrimary: { color: 'white' },
  textDanger: { color: '#DC2626' },
  textGhost: { color: '#1B1B1B' },
  textDisabled: { color: '#94A3B8' },
})

/* ─── Sync Bar ─── */
function SyncBar() {
  return (
    <Animated.View entering={FadeInUp.duration(500).delay(700).springify()}>
      <View style={syncStyles.card}>
        <LinearGradient
          colors={['#F0FDF4', '#E8F5E9']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
          pointerEvents="none"
        />
        <View style={syncStyles.content}>
          <View style={syncStyles.left}>
            <View style={syncStyles.iconWrap}>
              <GoonaIcon icon={RefreshCw} size={16} color="#2E7D32" />
            </View>
            <View>
              <Text style={syncStyles.title}>Offline Queued</Text>
              <Text style={syncStyles.sub}>Will sync when online</Text>
            </View>
          </View>
          <Text style={syncStyles.tag}>2 pending</Text>
        </View>
      </View>
    </Animated.View>
  )
}
const syncStyles = StyleSheet.create({
  card: {
    borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(46,125,50,0.08)',
  },
  content: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  iconWrap: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: 'rgba(46,125,50,0.1)', alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 14, fontWeight: '700', color: '#1B1B1B' },
  sub: { fontSize: 11, color: '#64748B', marginTop: 1 },
  tag: { fontSize: 11, fontWeight: '600', color: '#2E7D32', backgroundColor: 'rgba(46,125,50,0.08)', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 50 },
})

/* ─── Escalation Warning ─── */
function EscalationWarning() {
  const pulse = useSharedValue(1)
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 1200 }),
        withTiming(1, { duration: 1200 }),
      ),
      -1, true,
    )
  }, [])
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    shadowOpacity: interpolate(pulse.value, [1, 1.02], [0.08, 0.2], Extrapolation.CLAMP),
  }))
  return (
    <Animated.View entering={FadeInUp.duration(500).delay(600).springify()}>
      <Animated.View style={[escStyles.card, animStyle]}>
        <View style={escStyles.content}>
          <View style={escStyles.iconWrap}>
            <GoonaIcon icon={TriangleAlert} size={20} color="#DC2626" />
          </View>
          <View style={escStyles.textWrap}>
            <Text style={escStyles.title}>Overdue by 25 minutes</Text>
            <Text style={escStyles.sub}>This task has been escalated to your supervisor.</Text>
          </View>
        </View>
      </Animated.View>
    </Animated.View>
  )
}
const escStyles = StyleSheet.create({
  card: {
    borderRadius: 20, overflow: 'hidden',
    backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA',
    shadowColor: '#DC2626', shadowOffset: { width: 0, height: 6 }, shadowRadius: 20, elevation: 4,
  },
  content: { flexDirection: 'row', gap: 12, padding: 16, alignItems: 'flex-start' },
  iconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(220,38,38,0.08)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  textWrap: { flex: 1 },
  title: { fontSize: 15, fontWeight: '700', color: '#991B1B' },
  sub: { fontSize: 12, color: '#B91C1C', marginTop: 2, lineHeight: 17 },
})

/* ─── Recording Modal ─── */
function RecordingModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const startRecording = useCallback(async () => {
    try {
      const perm = await Audio.requestPermissionsAsync()
      if (!perm.granted) {
        Alert.alert('Permission required', 'Microphone access is needed to record voice notes.')
        return
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true })
      const { recording: newRec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      )
      setRecording(newRec)
      setIsRecording(true)
      setDuration(0)
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000)
    } catch {
      Alert.alert('Error', 'Could not start recording.')
    }
  }, [])

  const stopRecording = useCallback(async () => {
    if (recording) {
      try {
        await recording.stopAndUnloadAsync()
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false })
      } catch {}
    }
    if (timerRef.current) clearInterval(timerRef.current)
    setIsRecording(false)
    setRecording(null)
    Alert.alert('Voice Note', `Recording saved (${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')})`)
    setDuration(0)
    onClose()
  }, [recording, duration, onClose])

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <BlurView intensity={32} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={modalStyles.card}>
          <View style={modalStyles.indicator}>
            {isRecording && <PulseDot color="#EF4444" size={8} />}
            <Text style={modalStyles.indicatorText}>{isRecording ? 'Recording...' : 'Voice Note'}</Text>
          </View>
          <Text style={modalStyles.duration}>{formatDuration(duration)}</Text>
          <View style={modalStyles.actions}>
            {!isRecording ? (
              <TouchableOpacity style={modalStyles.recordBtn} activeOpacity={0.85} onPress={startRecording}>
                <GoonaIcon icon={Mic} size={24} color="#FFFFFF" />
                <Text style={modalStyles.recordBtnText}>Start Recording</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={modalStyles.stopBtn} activeOpacity={0.85} onPress={stopRecording}>
                <GoonaIcon icon={Square} size={24} color="#FFFFFF" />
                <Text style={modalStyles.recordBtnText}>Stop & Save</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={modalStyles.cancelBtn} activeOpacity={0.7} onPress={onClose}>
              <Text style={modalStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}
const modalStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  card: {
    width: '100%', maxWidth: 320, backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 28, padding: 28, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15, shadowRadius: 40, elevation: 12,
  },
  indicator: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  indicatorText: { fontSize: 15, fontWeight: '700', color: '#1B1B1B' },
  duration: { fontSize: 42, fontWeight: '800', color: '#1B1B1B', marginVertical: 16, fontVariant: ['tabular-nums'] },
  actions: { gap: 10, width: '100%' },
  recordBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#2E7D32', paddingVertical: 14, borderRadius: 16,
  },
  stopBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#DC2626', paddingVertical: 14, borderRadius: 16,
  },
  recordBtnText: { fontSize: 15, fontWeight: '700', color: 'white' },
  cancelBtn: { paddingVertical: 10, alignItems: 'center' },
  cancelText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
})

/* ─── Notes Modal ─── */
function NotesModal({ visible, onClose, onSave }: { visible: boolean; onClose: () => void; onSave: (text: string) => void }) {
  const [text, setText] = useState('')
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <BlurView intensity={32} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={notesModStyles.card}>
          <Text style={notesModStyles.title}>Quick Note</Text>
          <TextInput
            style={notesModStyles.input}
            placeholder="Type your operational note..."
            placeholderTextColor="#94A3B8"
            multiline
            value={text}
            onChangeText={setText}
            textAlignVertical="top"
          />
          <View style={notesModStyles.actions}>
            <TouchableOpacity
              style={notesModStyles.saveBtn}
              activeOpacity={0.85}
              onPress={() => { onSave(text); setText(''); onClose() }}
            >
              <Text style={notesModStyles.saveText}>Save Note</Text>
            </TouchableOpacity>
            <TouchableOpacity style={notesModStyles.cancelBtn} activeOpacity={0.7} onPress={onClose}>
              <Text style={notesModStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}
const notesModStyles = StyleSheet.create({
  card: {
    width: '100%', maxWidth: 340, backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 28, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15, shadowRadius: 40, elevation: 12,
  },
  title: { fontSize: 18, fontWeight: '800', color: '#1B1B1B', marginBottom: 14 },
  input: {
    backgroundColor: '#F8F9FA', borderRadius: 16, padding: 16,
    fontSize: 14, color: '#1B1B1B', minHeight: 120,
    borderWidth: 1, borderColor: '#E2E8F0',
    lineHeight: 20,
  },
  actions: { gap: 8, marginTop: 16 },
  saveBtn: { backgroundColor: '#00695C', paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
  saveText: { fontSize: 15, fontWeight: '700', color: 'white' },
  cancelBtn: { paddingVertical: 10, alignItems: 'center' },
  cancelText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
})

/* ─── MAIN SCREEN ─── */
export default function WorkerAlertsScreen() {
  const insets = useSafeAreaInsets()
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('pending')
  const [showNotification, setShowNotification] = useState(true)
  const [showRecording, setShowRecording] = useState(false)
  const [showNotes, setShowNotes] = useState(false)

  const handleViewTask = () => {
    setShowNotification(false)
  }

  const handleSnooze = () => {
    setShowNotification(false)
  }

  const handlePhotoUpload = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Gallery access is required.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    })
    if (!result.canceled) {
      Alert.alert('Photo Selected', `Image captured: ${result.assets[0].fileName || 'photo.jpg'}`)
    }
  }

  const handleCameraUpload = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync()
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Camera access is required.')
      return
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    })
    if (!result.canceled) {
      Alert.alert('Photo Captured', `Image saved: ${result.assets[0].fileName || 'capture.jpg'}`)
    }
  }

  const handlePhotoPress = () => {
    Alert.alert('Upload Photo', 'Choose source', [
      { text: 'Camera', onPress: handleCameraUpload },
      { text: 'Gallery', onPress: handlePhotoUpload },
      { text: 'Cancel', style: 'cancel' },
    ])
  }

  const handleVoicePress = () => {
    setShowRecording(true)
  }

  const handleNotesSave = (text: string) => {
    if (text.trim()) {
      Alert.alert('Note Saved', text.length > 50 ? text.substring(0, 50) + '...' : text)
    }
  }

  const handleStartTask = () => {
    if (taskStatus === 'pending') {
      setTaskStatus('in_progress')
    }
  }

  const handleReportIssue = () => {
    Alert.alert('Report Issue', 'Issue has been reported to your supervisor.')
  }

  const handleMarkComplete = () => {
    if (taskStatus === 'in_progress') {
      setTaskStatus('completed')
    }
  }

  const isOverdue = taskStatus === 'pending' || taskStatus === 'in_progress'
  const showEscalation = isOverdue && !showNotification

  return (
    <View style={s.container}>
      <StatusBar style="dark" />

      {/* background */}
      <View style={s.bgBlob} pointerEvents="none" />
      <View style={s.bgGlow} pointerEvents="none" />
      <View style={s.bgContour1} pointerEvents="none" />
      <View style={s.bgContour2} pointerEvents="none" />
      <View style={s.bgDotGrid} pointerEvents="none">
        {Array.from({ length: 36 }).map((_, i) => (
          <View key={i} style={[s.bgDot, { left: `${(i % 6) * 17 + 5}%`, top: `${Math.floor(i / 6) * 18 + 5}%` }]} />
        ))}
      </View>

      {/* push notification overlay */}
      <PushNotificationOverlay
        visible={showNotification}
        onViewTask={handleViewTask}
        onSnooze={handleSnooze}
      />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[
          s.scrollInner,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 130 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── HEADER ─── */}
        <Animated.View entering={FadeInUp.duration(500).springify()} style={s.header}>
          <View style={s.headerLeft}>
            <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
              <BackIcon />
            </TouchableOpacity>
            <Text style={s.headerTitle}>My Tasks</Text>
          </View>
          <View style={s.activeBadge}>
            <Text style={s.activeText}>3 Active</Text>
          </View>
        </Animated.View>

        {/* ─── PRIORITY HERO TASK CARD ─── */}
        <PriorityHeroCard
          status={taskStatus}
          priority={taskStatus === 'overdue' ? 'critical' : taskStatus === 'in_progress' ? 'urgent' : 'urgent'}
        />

        {/* ─── TASK DETAILS ─── */}
        <Animated.View entering={FadeInUp.duration(500).delay(150).springify()}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Task Details</Text>
          </View>
          <View style={s.detailsCard}>
            <DetailRow label="Batch" value="Broiler Batch A — Pen A" />
            <DetailRow label="Due Time" value={taskStatus === 'overdue' ? '7:30 AM (Overdue)' : '7:30 AM'} accent={taskStatus === 'overdue' ? '#DC2626' : undefined} />
            <DetailRow label="Recurring" value="Daily — Morning Shift" />
            <DetailRow
              label="Priority"
              value={taskStatus === 'overdue' ? 'Critical' : 'Urgent'}
              accent={taskStatus === 'overdue' ? '#DC2626' : '#F59E0B'}
            />
            <DetailRow
              label="Status"
              value={taskStatus === 'pending' ? 'Pending' : taskStatus === 'in_progress' ? 'In Progress' : taskStatus === 'completed' ? 'Completed' : 'Overdue'}
              accent={taskStatus === 'completed' ? '#16A34A' : taskStatus === 'overdue' ? '#DC2626' : taskStatus === 'in_progress' ? '#1A56FF' : '#F59E0B'}
            />
          </View>
        </Animated.View>

        {/* ─── INSTRUCTIONS ─── */}
        <Animated.View entering={FadeInUp.duration(500).delay(200).springify()}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Instructions</Text>
          </View>
        </Animated.View>
        <InstructionsSection />

        {/* ─── FILE ATTACHMENTS ─── */}
        <Animated.View entering={FadeInUp.duration(500).delay(300).springify()}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Attachments</Text>
          </View>
        </Animated.View>
        <View style={s.attachmentsList}>
          <AttachmentCard title="Feeding Schedule Q2.pdf" type="PDF" pages="3 pages" onPress={() => Alert.alert('PDF', 'Opening Feeding Schedule...')} />
          <View style={{ height: 8 }} />
          <AttachmentCard title="SOP — Morning Feed.docx" type="SOP Document" pages="12 pages" onPress={() => Alert.alert('SOP', 'Opening SOP Document...')} />
          <View style={{ height: 8 }} />
          <AttachmentCard title="Farm Layout & Access.pdf" type="Farm Instructions" pages="5 pages" onPress={() => Alert.alert('Farm Instructions', 'Opening Farm Layout...')} />
          <View style={{ height: 8 }} />
          <AttachmentCard title="Feed Mix Chart v3.xlsx" type="Feed Chart" pages="2 pages" onPress={() => Alert.alert('Feed Chart', 'Opening Feed Mix Chart...')} />
        </View>

        {/* ─── UPLOAD PROOF ─── */}
        <Animated.View entering={FadeInUp.duration(500).delay(400).springify()}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Upload Proof</Text>
            <Text style={s.sectionSub}>Attach evidence of completion</Text>
          </View>
        </Animated.View>
        <View style={s.uploadRow}>
          <UploadButton
            label="Photo"
            gradient={['#2E7D32', '#1B5E20']}
            icon={
              <GoonaIcon icon={Camera} size={20} color="#FFFFFF" />
            }
            onPress={handlePhotoPress}
          />
          <View style={{ width: 10 }} />
          <UploadButton
            label="Voice"
            gradient={['#7C3AED', '#4C1D95']}
            icon={
              <GoonaIcon icon={Mic} size={20} color="#FFFFFF" />
            }
            onPress={handleVoicePress}
          />
          <View style={{ width: 10 }} />
          <UploadButton
            label="Notes"
            gradient={['#1A56FF', '#1E3A8A']}
            icon={
              <GoonaIcon icon={FileText} size={20} color="#FFFFFF" />
            }
            onPress={() => setShowNotes(true)}
          />
        </View>

        {/* ─── TASK ACTION BUTTONS ─── */}
        <View style={s.actionsSection}>
          {taskStatus === 'pending' && (
            <ActionButton label="Start Task" variant="primary" onPress={handleStartTask} />
          )}
          {taskStatus === 'in_progress' && (
            <>
              <ActionButton label="Mark Complete" variant="primary" onPress={handleMarkComplete} />
              <View style={{ height: 10 }} />
              <ActionButton label="Report Issue" variant="danger" onPress={handleReportIssue} />
            </>
          )}
          {taskStatus === 'completed' && (
            <View style={s.completedBanner}>
              <GoonaIcon icon={CheckCircle} size={24} color="#16A34A" />
              <Text style={s.completedText}>Task Completed</Text>
              <Text style={s.completedSub}>Proof has been queued for sync</Text>
            </View>
          )}
          {taskStatus === 'overdue' && (
            <>
              <ActionButton label="Start Task" variant="danger" onPress={handleStartTask} />
              <View style={{ height: 10 }} />
              <ActionButton label="Report Issue" variant="ghost" onPress={handleReportIssue} />
            </>
          )}
        </View>

        {/* ─── SYNC STATUS ─── */}
        <SyncBar />

        {/* ─── ESCALATION WARNING ─── */}
        {showEscalation && <View style={{ marginTop: 12 }}><EscalationWarning /></View>}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* recording modal */}
      <RecordingModal visible={showRecording} onClose={() => setShowRecording(false)} />

      {/* notes modal */}
      <NotesModal visible={showNotes} onClose={() => setShowNotes(false)} onSave={handleNotesSave} />

      <BottomDock />
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9F5' },

  bgBlob: {
    position: 'absolute', top: -60, left: -60,
    width: 280, height: 280, borderRadius: 140,
    backgroundColor: 'rgba(0,105,92,0.06)', zIndex: 0,
  },
  bgGlow: {
    position: 'absolute', top: '20%', right: '5%',
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(0,105,92,0.04)', zIndex: 0,
  },
  bgContour1: {
    position: 'absolute', top: '5%', right: '-10%',
    width: 320, height: 110, zIndex: 0,
    borderWidth: 1, borderColor: 'rgba(46,125,50,0.06)',
    borderTopLeftRadius: 160, borderTopRightRadius: 160,
    borderBottomWidth: 0,
    transform: [{ rotate: '6deg' }],
  },
  bgContour2: {
    position: 'absolute', bottom: '30%', left: '-6%',
    width: 240, height: 80, zIndex: 0,
    borderWidth: 1, borderColor: 'rgba(46,125,50,0.06)',
    borderBottomLeftRadius: 120, borderBottomRightRadius: 120,
    borderTopWidth: 0,
    transform: [{ rotate: '-5deg' }],
  },
  bgDotGrid: { position: 'absolute', inset: 0, zIndex: 0, opacity: 0.35 },
  bgDot: {
    position: 'absolute', width: 2, height: 2,
    borderRadius: 1, backgroundColor: 'rgba(0,105,92,0.1)',
  },

  scroll: { flex: 1, zIndex: 1 },
  scrollInner: { paddingHorizontal: H_PADDING },

  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', zIndex: 5,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.02)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#1B1B1B' },
  activeBadge: {
    backgroundColor: '#F0FDF4', borderRadius: 50,
    paddingVertical: 5, paddingHorizontal: 14,
    borderWidth: 1, borderColor: 'rgba(22,163,74,0.15)',
  },
  activeText: { fontSize: 12, fontWeight: '600', color: '#16A34A' },

  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: 24, marginBottom: 12, zIndex: 5,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#1B1B1B' },
  sectionSub: { fontSize: 12, color: '#94A3B8' },

  detailsCard: {
    backgroundColor: 'white', borderRadius: 22, padding: 18,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04, shadowRadius: 18, elevation: 2,
    zIndex: 5,
  },

  attachmentsList: { zIndex: 5 },

  uploadRow: { flexDirection: 'row', zIndex: 5 },

  actionsSection: { marginTop: 24, gap: 0, zIndex: 5 },

  completedBanner: {
    alignItems: 'center', paddingVertical: 24, gap: 6,
    backgroundColor: '#F0FDF4', borderRadius: 22,
    borderWidth: 1, borderColor: 'rgba(22,163,74,0.15)',
  },
  completedText: { fontSize: 16, fontWeight: '700', color: '#16A34A' },
  completedSub: { fontSize: 13, color: '#64748B' },
})
