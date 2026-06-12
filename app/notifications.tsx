import React, { useState, useCallback, useRef } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Platform,
} from 'react-native'
import GoonaIcon from '../components/ui/GoonaIcon'
import { ArrowLeft, Bell, Check, X, Plus, AlertCircle, ClipboardList, TrendingUp, Sparkles, Users, CheckCircle, MapPin, Radio, ShieldAlert, Navigation } from 'lucide-react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { StatusBar } from 'expo-status-bar'
import { router } from 'expo-router'
import * as Notifications from 'expo-notifications'
import Animated, { FadeInUp, FadeIn, FadeOutDown } from 'react-native-reanimated'
import ReminderTaskModal, { ReminderTask } from '../components/ReminderTaskModal'

const FILTERS = ['All', 'Critical', 'Operations', 'Financial', 'AI', 'Workforce', 'Safety', 'Geofence']

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

  /* ─── WORKFORCE ─── */
  {
    type: 'Workforce' as const, iconBg: '#F0F4FF', iconColor: '#00695C',
    title: 'Worker Check-In',
    desc: 'Aminat checked into Feed Warehouse.',
    time: '8 mins ago',
  },
  {
    type: 'Workforce' as const, iconBg: '#F0F4FF', iconColor: '#00695C',
    title: 'Worker Check-Out',
    desc: 'Kola signed out from Hatchery. Hours logged: 7.5.',
    time: '28 mins ago',
  },
  {
    type: 'Workforce' as const, iconBg: '#FFF8F0', iconColor: '#F59E0B',
    title: 'Worker Offline',
    desc: 'Ngozi has been offline for 4 hours. Location: Break Room.',
    time: '1 hour ago',
  },
  {
    type: 'Workforce' as const, iconBg: '#F0F4FF', iconColor: '#00695C',
    title: 'Worker Location Update',
    desc: 'Segun moved to Poultry House B from Feed Warehouse.',
    time: '12 mins ago',
  },
  {
    type: 'Workforce' as const, iconBg: '#F0FDF4', iconColor: '#16A34A',
    title: 'Attendance Reminder',
    desc: 'Funmi and 2 others have not checked in for morning shift.',
    time: '2 hours ago',
  },

  /* ─── SAFETY ─── */
  {
    type: 'Safety' as const, iconBg: '#FFF1F2', iconColor: '#EF4444',
    title: 'SOS Alert',
    desc: 'Chinedu triggered emergency alert in Poultry House A.',
    time: '2 mins ago',
  },
  {
    type: 'Safety' as const, iconBg: '#FFF1F2', iconColor: '#EF4444',
    title: 'Worker Distress Signal',
    desc: 'Musa sent a distress signal from Chemical Storage area.',
    time: '6 mins ago',
  },
  {
    type: 'Safety' as const, iconBg: '#FFFBEB', iconColor: '#F59E0B',
    title: 'Safety Incident Reported',
    desc: 'Slip hazard reported near Fish Pond. Area cordoned off.',
    time: '18 mins ago',
  },
  {
    type: 'Safety' as const, iconBg: '#F0FDF4', iconColor: '#16A34A',
    title: 'Emergency Drill Complete',
    desc: 'All 9 workers responded within 90 seconds. Drill passed.',
    time: '45 mins ago',
  },

  /* ─── GEOFENCE ─── */
  {
    type: 'Geofence' as const, iconBg: '#EEF3FF', iconColor: '#1A56FF',
    title: 'Restricted Zone Entry',
    desc: 'Musa entered Chemical Storage — a restricted area.',
    time: '5 mins ago',
  },
  {
    type: 'Geofence' as const, iconBg: '#F0F4FF', iconColor: '#00695C',
    title: 'Zone Entry',
    desc: 'Chinedu entered Poultry House A — operational zone.',
    time: '2 mins ago',
  },
  {
    type: 'Geofence' as const, iconBg: '#F0F4FF', iconColor: '#00695C',
    title: 'Zone Exit',
    desc: 'Aminat exited Feed Warehouse — geofence logged.',
    time: '8 mins ago',
  },
  {
    type: 'Geofence' as const, iconBg: '#FFF1F2', iconColor: '#EF4444',
    title: 'Boundary Breach',
    desc: 'Unknown device detected at north perimeter. Investigation needed.',
    time: '22 mins ago',
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
            <GoonaIcon icon={ArrowLeft} size={22} color="#1B1B1B" />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Notifications</Text>
<TouchableOpacity style={styles.navAction} activeOpacity={0.7}>
             <GoonaIcon icon={CheckCircle} size={20} color="#1F2937" />
            </TouchableOpacity>
        </Animated.View>

        {/* HERO INTELLIGENCE CARD */}
        <Animated.View entering={FadeInUp.duration(500).delay(80).springify()} style={styles.heroCard}>
          <View style={styles.heroDots} pointerEvents="none" />
          <View style={styles.heroTop}>
            <View style={styles.heroIconWrap}>
              <GoonaIcon icon={Sparkles} size={24} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>GOONA Unified{'\n'}Notification Center</Text>
              <Text style={styles.heroSub}><Text style={{ fontWeight: '700' }}>6 unread</Text> alerts across operations, workforce, safety, and geofence</Text>
            </View>
          </View>
          <View style={styles.heroMetrics}>
            <View style={styles.heroMetric}><Text style={styles.heroMetricVal}>3</Text><Text style={styles.heroMetricLbl}>Critical</Text></View>
            <View style={styles.heroMetric}><Text style={styles.heroMetricVal}>14</Text><Text style={styles.heroMetricLbl}>Active</Text></View>
            <View style={[styles.heroMetric, styles.heroMetricLast]}><Text style={styles.heroMetricVal}>5</Text><Text style={styles.heroMetricLbl}>Categories</Text></View>
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
            <GoonaIcon icon={Plus} size={14} color="#2E7D32" />
             <Text style={styles.qaBtnText}>Mark All Read</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.qaBtn} activeOpacity={0.85}>
<GoonaIcon icon={X} size={14} color="#94A3B8" />
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
{alert.type === 'Critical' && <GoonaIcon icon={AlertCircle} size={16} color={alert.iconColor} />}
                {alert.type === 'Operations' && <GoonaIcon icon={ClipboardList} size={16} color={alert.iconColor} />}
                {alert.type === 'Financial' && <GoonaIcon icon={TrendingUp} size={16} color={alert.iconColor} />}
                {alert.type === 'AI' && <GoonaIcon icon={Sparkles} size={16} color={alert.iconColor} />}
                {alert.type === 'Workforce' && <GoonaIcon icon={Users} size={16} color={alert.iconColor} />}
                {alert.type === 'Safety' && <GoonaIcon icon={ShieldAlert} size={16} color={alert.iconColor} />}
                {alert.type === 'Geofence' && <GoonaIcon icon={MapPin} size={16} color={alert.iconColor} />}
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
                {r.done && <GoonaIcon icon={Check} size={10} color="#FFFFFF" />}
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
                <GoonaIcon icon={Check} size={12} color="#16A34A" />
              )}
            </TouchableOpacity>
          ))}
        </Animated.View>

        <View style={{ height: 100 }} />
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
<GoonaIcon icon={Plus} size={28} color="#FFFFFF" strokeWidth={3} />
        </LinearGradient>
      </TouchableOpacity>

      {/* TOAST */}
      {toast.visible && (
        <Animated.View entering={FadeInUp.duration(300).springify()} exiting={FadeOutDown.duration(250)} style={styles.toast}>
          <GoonaIcon icon={Check} size={16} color="#FFFFFF" />
          <Text style={styles.toastText}>{toast.message}</Text>
        </Animated.View>
      )}

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
    bottom: Platform.OS === 'ios' ? 36 : 24,
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
    bottom: Platform.OS === 'ios' ? 100 : 80,
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


