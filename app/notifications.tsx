import React, { useState, useCallback, useRef } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Platform,
} from 'react-native'
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg'
import { LinearGradient } from 'expo-linear-gradient'
import { StatusBar } from 'expo-status-bar'
import { router } from 'expo-router'
import * as Notifications from 'expo-notifications'
import Animated, { FadeInUp, FadeIn, FadeOutDown } from 'react-native-reanimated'
import BottomDock from '../components/navigation/BottomDock'
import ReminderTaskModal, { ReminderTask } from '../components/ReminderTaskModal'

const FILTERS = ['All', 'Critical', 'Operations', 'Financial', 'AI', 'Team']

const ALERTS = [
  {
    type: 'Critical' as const, iconBg: '#FFF1F2', iconColor: '#EF4444',
    title: 'Mortality risk increased in Batch B',
    desc: '3 birds lost in last 12 hours. Investigate immediately.',
    time: '15 min ago',
  },
  {
    type: 'Operations' as const, iconBg: '#EEF3FF', iconColor: '#1A56FF',
    title: 'Feed refill due in 2 hours',
    desc: 'Broiler Batch A will run out of grower feed by 2:00 PM.',
    time: '1 hour ago',
  },
  {
    type: 'Financial' as const, iconBg: '#F0FDF4', iconColor: '#16A34A',
    title: 'Revenue target exceeded',
    desc: 'This month\'s sales are 18% above forecast.',
    time: '2 hours ago',
  },
  {
    type: 'AI' as const, iconBg: '#FFFBEB', iconColor: '#F59E0B',
    title: 'Feed efficiency improved by 8%',
    desc: 'Your feeding consistency is trending positively.',
    time: '3 hours ago',
  },
  {
    type: 'Operations' as const, iconBg: '#EEF3FF', iconColor: '#1A56FF',
    title: 'Vaccination scheduled tomorrow',
    desc: 'Layer Batch B due for Newcastle vaccine at 7:00 AM.',
    time: '5 hours ago',
  },
  {
    type: 'Team' as const, iconBg: '#F0FDF4', iconColor: '#16A34A',
    title: 'Worker attendance logged',
    desc: '8 of 10 staff checked in for morning shift.',
    time: '6 hours ago',
  },
  {
    type: 'AI' as const, iconBg: '#FFFBEB', iconColor: '#F59E0B',
    title: 'Recovery consistency dropped this week',
    desc: 'Your capital recovery streak may be at risk. Stay on track.',
    time: '8 hours ago',
  },
]

const REMINDERS = [
  { label: 'Recovery contribution due Friday', done: false },
  { label: 'Submit weekly medication log', done: false },
  { label: 'Review batch performance report', done: true },
]

const QUICK_TASKS = [
  { label: 'Feed Batch A', color: '#F59E0B' },
  { label: 'Record Mortality', color: '#EF4444' },
  { label: 'Check Water Supply', color: '#1A56FF' },
  { label: 'Submit Medication Log', color: '#16A34A' },
]

function BellIcon() {
  return <Svg width="16" height="16" viewBox="0 0 16 16" fill="none"><Path d="M8 2C5.8 2 4 3.8 4 6V9.5L2.5 11H13.5L12 9.5V6C12 3.8 10.2 2 8 2Z" stroke="#1F2937" strokeWidth="1.3" fill="none" /><Path d="M6.5 11C6.5 12 7 12.5 8 12.5C9 12.5 9.5 12 9.5 11" stroke="#1F2937" strokeWidth="1.3" strokeLinecap="round" fill="none" /></Svg>
}

export default function NotificationsScreen() {
  const [activeFilter, setActiveFilter] = useState('All')
  const [reminders, setReminders] = useState(REMINDERS)
  const [tasks, setTasks] = useState(QUICK_TASKS.map((t) => ({ ...t, done: false })))
  const [showCreate, setShowCreate] = useState(false)
  const [createdItems, setCreatedItems] = useState<ReminderTask[]>([])
  const [toast, setToast] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' })
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = (message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ visible: true, message })
    toastTimer.current = setTimeout(() => setToast({ visible: false, message: '' }), 3000)
  }

  const handleCreateItem = useCallback(async (item: ReminderTask) => {
    if (item.type === 'Reminder') {
      setReminders((prev) => [...prev, { label: item.title, done: false }])
    } else {
      setTasks((prev) => [...prev, { label: item.title, color: '#2E7D32', done: false }])
    }
    setCreatedItems((prev) => [...prev, item])

    try {
      const { status } = await Notifications.requestPermissionsAsync()
      if (status !== 'granted') return

      const triggerDate = new Date(item.date)
      triggerDate.setHours(item.time.getHours(), item.time.getMinutes(), 0, 0)

      if (triggerDate <= new Date()) return

      let repeats: boolean | undefined
      let interval: number | undefined
      switch (item.repeat) {
        case 'Daily': repeats = true; interval = 86400; break
        case 'Weekly': repeats = true; interval = 604800; break
        case 'Monthly': repeats = true; interval = 2592000; break
      }

      if (interval) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: item.type === 'Reminder' ? '🔔 Reminder' : '📋 Task',
            body: item.title,
            data: { id: item.id, type: item.type, category: item.category, priority: item.priority },
          },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: interval, repeats: true },
        })
      } else {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: item.type === 'Reminder' ? '🔔 Reminder' : '📋 Task',
            body: item.title,
            data: { id: item.id, type: item.type, category: item.category, priority: item.priority },
          },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate },
        })
      }
    } catch {
      // silently fail - notification not critical
    }

    const msg = item.type === 'Reminder'
      ? 'Reminder scheduled successfully'
      : 'Task published to farm team'
    showToast(msg)
  }, [])

  const toggleReminder = (i: number) => {
    setReminders((prev) => prev.map((r, j) => j === i ? { ...r, done: !r.done } : r))
  }

  const toggleTask = (i: number) => {
    setTasks((prev) => prev.map((t, j) => j === i ? { ...t, done: !t.done } : t))
  }

  const filteredAlerts = activeFilter === 'All' ? ALERTS : ALERTS.filter((a) => a.type === activeFilter)

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.glowBg} pointerEvents="none" />
      <View style={styles.contour1} pointerEvents="none" />
      <View style={styles.contour2} pointerEvents="none" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollInner}
        showsVerticalScrollIndicator={false}
      >
        {/* TOP NAV */}
        <Animated.View entering={FadeInUp.duration(500).springify()} style={styles.topNav}>
          <TouchableOpacity style={styles.navBack} activeOpacity={0.7} onPress={() => router.back()}>
            <Svg width="22" height="22" viewBox="0 0 24 24" fill="none"><Path d="M15 18L9 12L15 6" stroke="#1B1B1B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></Svg>
          </TouchableOpacity>
          <Text style={styles.topTitle}>Notifications</Text>
          <TouchableOpacity style={styles.navAction} activeOpacity={0.7}>
            <Svg width="20" height="20" viewBox="0 0 20 20" fill="none"><Circle cx="10" cy="10" r="6" stroke="#1F2937" strokeWidth="1.5" fill="none" /><Path d="M7 10L9 12L13 8" stroke="#1F2937" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" /></Svg>
          </TouchableOpacity>
        </Animated.View>

        {/* HERO INTELLIGENCE CARD */}
        <Animated.View entering={FadeInUp.duration(500).delay(80).springify()} style={styles.heroCard}>
          <View style={styles.heroDots} pointerEvents="none" />
          <View style={styles.heroTop}>
            <View style={styles.heroIconWrap}>
              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none"><Path d="M12 3L10.5 7.5L6 9L10.5 10.5L12 15L13.5 10.5L18 9L13.5 7.5L12 3Z" fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth="1.5" strokeLinejoin="round" /></Svg>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>Operational{'\n'}Awareness Center</Text>
              <Text style={styles.heroSub}>You have <Text style={{ fontWeight: '700' }}>4 unread</Text> alerts requiring attention</Text>
            </View>
          </View>
          <View style={styles.heroMetrics}>
            <View style={styles.heroMetric}><Text style={styles.heroMetricVal}>2</Text><Text style={styles.heroMetricLbl}>Critical</Text></View>
            <View style={styles.heroMetric}><Text style={styles.heroMetricVal}>5</Text><Text style={styles.heroMetricLbl}>Active</Text></View>
            <View style={[styles.heroMetric, styles.heroMetricLast]}><Text style={styles.heroMetricVal}>3</Text><Text style={styles.heroMetricLbl}>Reminders</Text></View>
          </View>
        </Animated.View>

        {/* FILTER PILLS */}
        <Animated.View entering={FadeInUp.duration(500).delay(130).springify()} style={styles.filterRow}>
          {FILTERS.map((f) => {
            const active = activeFilter === f
            return (
              <TouchableOpacity
                key={f}
                style={[styles.filterPill, active && styles.filterPillActive]}
                activeOpacity={0.8}
                onPress={() => setActiveFilter(f)}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>{f}</Text>
              </TouchableOpacity>
            )
          })}
        </Animated.View>

        {/* QUICK ACTIONS */}
        <Animated.View entering={FadeInUp.duration(500).delay(160).springify()} style={styles.quickActions}>
          <TouchableOpacity style={styles.qaBtn} activeOpacity={0.85}>
            <Svg width="14" height="14" viewBox="0 0 14 14" fill="none"><Path d="M3 7H11" stroke="#2E7D32" strokeWidth="1.5" strokeLinecap="round" /><Path d="M7 3V11" stroke="#2E7D32" strokeWidth="1.5" strokeLinecap="round" /></Svg>
            <Text style={styles.qaBtnText}>Mark All Read</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.qaBtn} activeOpacity={0.85}>
            <Svg width="14" height="14" viewBox="0 0 14 14" fill="none"><Path d="M3 3L11 11" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" /><Path d="M11 3L3 11" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" /></Svg>
            <Text style={[styles.qaBtnText, { color: '#94A3B8' }]}>Clear Resolved</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* SMART ALERTS FEED */}
        <Animated.View entering={FadeInUp.duration(500).delay(200).springify()}>
          <Text style={styles.sectionTitle}>Smart Alerts</Text>
        </Animated.View>

        {filteredAlerts.length === 0 && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.emptyState}>
            <Text style={styles.emptyText}>No {activeFilter} alerts right now</Text>
          </Animated.View>
        )}

        {filteredAlerts.map((alert, i) => (
          <Animated.View key={i} entering={FadeInUp.duration(400).delay(230 + i * 50).springify()} style={styles.alertCard}>
            <View style={[styles.alertIcon, { backgroundColor: alert.iconBg }]}>
              <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                {alert.type === 'Critical' && <><Circle cx="8" cy="8" r="5" stroke={alert.iconColor} strokeWidth="1.3" fill="none" /><Line x1="8" y1="6" x2="8" y2="9" stroke={alert.iconColor} strokeWidth="1.2" strokeLinecap="round" /><Circle cx="8" cy="11" r="0.5" fill={alert.iconColor} /></>}
                {alert.type === 'Operations' && <><Path d="M4 10H12" stroke={alert.iconColor} strokeWidth="1.3" strokeLinecap="round" /><Rect x="5" y="4" width="6" height="8" rx="1.5" stroke={alert.iconColor} strokeWidth="1.3" fill="none" /></>}
                {alert.type === 'Financial' && <><Path d="M3 12H13" stroke={alert.iconColor} strokeWidth="1.3" strokeLinecap="round" /><Path d="M5 9L7 5L9 7L13 3" stroke={alert.iconColor} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></>}
                {alert.type === 'AI' && <><Path d="M8 3L7 6.5L3.5 7.5L7 8.5L8 12L9 8.5L12.5 7.5L9 6.5L8 3Z" stroke={alert.iconColor} strokeWidth="1.3" strokeLinejoin="round" fill="none" /></>}
                {alert.type === 'Team' && <><Circle cx="6" cy="6" r="2" stroke={alert.iconColor} strokeWidth="1.3" fill="none" /><Path d="M3 12C3 10 4.5 9 6 9C7.5 9 9 10 9 12" stroke={alert.iconColor} strokeWidth="1.3" strokeLinecap="round" fill="none" /></>}
              </Svg>
            </View>
            <View style={styles.alertContent}>
              <View style={styles.alertTop}>
                <View style={[styles.alertTypeBadge, { backgroundColor: alert.iconBg }]}>
                  <Text style={[styles.alertTypeText, { color: alert.iconColor }]}>{alert.type}</Text>
                </View>
                <Text style={styles.alertTime}>{alert.time}</Text>
              </View>
              <Text style={styles.alertTitle}>{alert.title}</Text>
              <Text style={styles.alertDesc}>{alert.desc}</Text>
            </View>
          </Animated.View>
        ))}

        {/* LIGHTWEIGHT REMINDERS */}
        <Animated.View entering={FadeInUp.duration(500).delay(450).springify()}>
          <Text style={styles.sectionTitle}>Reminders</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(480).springify()} style={styles.reminderCard}>
          {reminders.map((r, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.reminderRow, i < reminders.length - 1 && styles.reminderBorder]}
              activeOpacity={0.7}
              onPress={() => toggleReminder(i)}
            >
              <View style={[styles.reminderCheck, r.done && styles.reminderCheckDone]}>
                {r.done && <Svg width="10" height="10" viewBox="0 0 10 10" fill="none"><Path d="M2.5 5L4.5 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></Svg>}
              </View>
              <Text style={[styles.reminderLabel, r.done && styles.reminderLabelDone]}>{r.label}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* QUICK TASKS */}
        <Animated.View entering={FadeInUp.duration(500).delay(520).springify()}>
          <Text style={styles.sectionTitle}>Quick Tasks</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(550).springify()} style={styles.tasksRow}>
          {tasks.map((t, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.taskChip, t.done && styles.taskChipDone]}
              activeOpacity={0.8}
              onPress={() => toggleTask(i)}
            >
              <View style={[styles.taskDot, { backgroundColor: t.done ? '#CBD5E1' : t.color }]} />
              <Text style={[styles.taskLabel, t.done && styles.taskLabelDone]}>{t.label}</Text>
              {t.done && (
                <Svg width="12" height="12" viewBox="0 0 12 12" fill="none"><Path d="M3 6L5 8L9 4" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></Svg>
              )}
            </TouchableOpacity>
          ))}
        </Animated.View>

        <View style={{ height: 140 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fabShell}
        activeOpacity={0.85}
        onPress={() => setShowCreate(true)}
      >
        <LinearGradient
          colors={['#1B5E20', '#2E7D32', '#388E3C']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <Svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <Path d="M6 14H22" stroke="white" strokeWidth="3" strokeLinecap="round" />
            <Path d="M14 6V22" stroke="white" strokeWidth="3" strokeLinecap="round" />
          </Svg>
        </LinearGradient>
      </TouchableOpacity>

      {/* TOAST */}
      {toast.visible && (
        <Animated.View entering={FadeInUp.duration(300).springify()} exiting={FadeOutDown.duration(250)} style={styles.toast}>
          <Svg width="16" height="16" viewBox="0 0 16 16" fill="none"><Circle cx="8" cy="8" r="5" stroke="white" strokeWidth="1.3" fill="none" /><Path d="M5 8L7 10L11 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></Svg>
          <Text style={styles.toastText}>{toast.message}</Text>
        </Animated.View>
      )}

      <BottomDock />

      <ReminderTaskModal visible={showCreate} onClose={() => setShowCreate(false)} onSave={handleCreateItem} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAF7' },
  glowBg: { position: 'absolute', top: -50, right: -50, width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(232,245,233,0.3)', zIndex: 0 },
  contour1: { position: 'absolute', top: '5%', left: '-10%', width: 320, height: 100, zIndex: 0, borderWidth: 1, borderColor: 'rgba(46,125,50,0.04)', borderTopLeftRadius: 160, borderTopRightRadius: 160, borderBottomWidth: 0, transform: [{ rotate: '6deg' }] },
  contour2: { position: 'absolute', bottom: '10%', right: '-10%', width: 250, height: 80, zIndex: 0, borderWidth: 1, borderColor: 'rgba(46,125,50,0.04)', borderBottomLeftRadius: 125, borderBottomRightRadius: 125, borderTopWidth: 0, transform: [{ rotate: '-8deg' }] },
  scroll: { flex: 1, zIndex: 1 },
  scrollInner: { paddingHorizontal: 20, paddingTop: 0 },

  /* top nav */
  topNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 54 },
  navBack: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  topTitle: { fontWeight: '700', fontSize: 20, color: '#1B1B1B' },
  navAction: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },

  /* hero */
  heroCard: {
    backgroundColor: '#2E7D32', borderRadius: 28, padding: 22, marginTop: 14, overflow: 'hidden',
    shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.2, shadowRadius: 30, elevation: 6,
  },
  heroDots: { position: 'absolute', inset: 0 },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, zIndex: 1 },
  heroIconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  heroTitle: { fontWeight: '800', fontSize: 22, lineHeight: 28, color: 'white' },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 6 },
  heroMetrics: { flexDirection: 'row', marginTop: 18, zIndex: 1 },
  heroMetric: { flex: 1, alignItems: 'center', borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.1)' },
  heroMetricLast: { borderRightWidth: 0 },
  heroMetricVal: { fontSize: 22, fontWeight: '800', color: 'white' },
  heroMetricLbl: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 0 },

  /* filter */
  filterRow: { flexDirection: 'row', gap: 8, marginTop: 18 },
  filterPill: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 100, backgroundColor: 'white', borderWidth: 1, borderColor: '#E2E8F0' },
  filterPillActive: { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
  filterText: { fontSize: 12, fontWeight: '500', color: '#64748B' },
  filterTextActive: { color: 'white' },

  /* quick actions */
  quickActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  qaBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 14, backgroundColor: '#F8FAF7', borderRadius: 100, borderWidth: 1, borderColor: '#E2E8F0' },
  qaBtnText: { fontSize: 12, fontWeight: '500', color: '#2E7D32' },

  /* section */
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginTop: 22, marginBottom: 12 },

  /* empty */
  emptyState: { paddingVertical: 24, alignItems: 'center' },
  emptyText: { fontSize: 13, color: '#94A3B8' },

  /* alerts */
  alertCard: { flexDirection: 'row', gap: 14, backgroundColor: 'white', borderRadius: 22, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 14, elevation: 2 },
  alertIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
  alertContent: { flex: 1 },
  alertTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  alertTypeBadge: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 100 },
  alertTypeText: { fontSize: 10, fontWeight: '600' },
  alertTime: { fontSize: 11, color: '#94A3B8' },
  alertTitle: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  alertDesc: { fontSize: 12, color: '#64748B', marginTop: 2, lineHeight: 17 },

  /* reminders */
  reminderCard: { backgroundColor: 'white', borderRadius: 22, padding: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 14, elevation: 2 },
  reminderRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14 },
  reminderBorder: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  reminderCheck: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center' },
  reminderCheckDone: { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
  reminderLabel: { fontSize: 14, fontWeight: '500', color: '#1F2937', flex: 1 },
  reminderLabelDone: { textDecorationLine: 'line-through', color: '#94A3B8' },

  /* tasks */
  tasksRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  taskChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 14, backgroundColor: 'white', borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 },
  taskChipDone: { backgroundColor: '#F8FAF7' },
  taskDot: { width: 8, height: 8, borderRadius: 4 },
  taskLabel: { fontSize: 13, fontWeight: '500', color: '#1F2937' },
  taskLabelDone: { color: '#94A3B8', textDecorationLine: 'line-through' },

  /* fab */
  fabShell: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 112 : 92,
    right: 20,
    zIndex: 50,
  },
  fabGradient: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 10,
  },

  /* toast */
  toast: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 180 : 156,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 22,
    backgroundColor: '#1F2937',
    borderRadius: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 100,
  },
  toastText: { fontSize: 14, fontWeight: '600', color: 'white' },
})


