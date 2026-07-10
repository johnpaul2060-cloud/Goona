import React, { useEffect, useState, useRef } from 'react'
import {
  View, Text, TouchableOpacity, Pressable, ScrollView,
  StyleSheet, Dimensions, Alert,
} from 'react-native'
import Svg, { Path } from 'react-native-svg'
import GoonaIcon from '../../components/ui/GoonaIcon'
import NotificationBadge from '../../components/NotificationBadge'
import { Icons } from '../../shared/icons'
import { StatusBar } from 'expo-status-bar'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence,
  withTiming, withSpring, withDelay, FadeInUp, FadeIn,
} from 'react-native-reanimated'
import BottomDock from '../../components/navigation/BottomDock'
import { FARM_NAME } from '../../constants/farm'

const { width: SCREEN_W } = Dimensions.get('window')

/* ─── Animated pulse dot ─── */
function PulseDot() {
  const opacity = useSharedValue(1)
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(0.3, { duration: 2000 }), withTiming(1, { duration: 2000 })),
      -1, true,
    )
  }, [])
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }))
  return <Animated.View style={[{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#AEEA00' }, style]} />
}

/* ─── Press scale hook ─── */
function usePressScale() {
  const scale = useSharedValue(1)
  const opacity = useSharedValue(1)
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: opacity.value }))
  return {
    style,
    onPressIn: () => {
      scale.value = withSpring(0.96, { damping: 15, stiffness: 200 })
      opacity.value = withTiming(0.85, { duration: 80 })
    },
    onPressOut: () => {
      scale.value = withSpring(1, { damping: 15, stiffness: 200 })
      opacity.value = withTiming(1, { duration: 100 })
    },
  }
}

/* ─── Worker Avatar ─── */
const waStyles = StyleSheet.create({
  wrap: { width: 44, height: 44, position: 'relative', marginRight: 14 },
  grad: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  initials: { color: '#fff', fontWeight: '700', fontSize: 16 },
  dotBase: {
    position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: 5,
    borderWidth: 2, borderColor: 'white',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
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
      <View style={[waStyles.dotBase, { backgroundColor: online ? '#22C55E' : '#94A3B8', shadowColor: online ? '#22C55E' : '#94A3B8' }]} />
    </View>
  )
}

/* ─── Quick Access Card ─── */
function QACard({
  variant, title, desc, tags, icon, onPress,
}: {
  variant: 'dark' | 'light'
  title: string
  desc: string
  tags: string[]
  icon: React.ReactNode
  onPress?: () => void
}) {
  const { style, onPressIn, onPressOut } = usePressScale()
  const isDark = variant === 'dark'
  return (
    <Animated.View style={[style, { flex: 1 }]}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[qaStyles.card, isDark ? qaStyles.dark : qaStyles.light]}
      >
        <View style={[qaStyles.icon, isDark ? qaStyles.iconDark : qaStyles.iconLight]}>
          {icon}
        </View>
        <Text style={[qaStyles.title, isDark ? qaStyles.titleWhite : qaStyles.titleDark]}>{title}</Text>
        <Text style={[qaStyles.desc, isDark ? qaStyles.descWhite : qaStyles.descDark]}>{desc}</Text>
        <View style={qaStyles.tags}>
          {tags.map((t) => (
            <View key={t} style={[
              qaStyles.tag,
              isDark ? qaStyles.tagDarkBg : qaStyles.tagLightBg,
            ]}>
              <Text style={[
                qaStyles.tagText,
                isDark ? qaStyles.tagTextWhite : qaStyles.tagTextDark,
              ]}>{t}</Text>
            </View>
          ))}
        </View>
      </Pressable>
    </Animated.View>
  )
}
const qaStyles = StyleSheet.create({
  card: { borderRadius: 28, padding: 18, overflow: 'hidden' },
  dark: { backgroundColor: '#0F172A' },
  light: { backgroundColor: 'white', borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)' },
  icon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  iconDark: { backgroundColor: 'rgba(255,255,255,0.06)' },
  iconLight: { backgroundColor: '#F1F5F9' },
  title: { fontWeight: '700', fontSize: 15, marginBottom: 3 },
  titleWhite: { color: '#fff' },
  titleDark: { color: '#1B1B1B' },
  desc: { fontSize: 11, lineHeight: 15, marginBottom: 10 },
  descWhite: { color: 'rgba(255,255,255,0.55)' },
  descDark: { color: '#64748B' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  tag: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 50 },
  tagDarkBg: { backgroundColor: 'rgba(255,255,255,0.06)' },
  tagLightBg: { backgroundColor: 'rgba(0,105,92,0.06)' },
  tagText: { fontSize: 8, fontWeight: '600' },
  tagTextWhite: { color: 'rgba(255,255,255,0.5)' },
  tagTextDark: { color: '#00695C' },
})

/* ─── Team Tab ─── */
type TeamTabType = 'workers' | 'supervisors' | 'tasks' | 'reports'

const TABS: { key: TeamTabType; label: string; icon: any }[] = [
  { key: 'workers', label: 'Workers', icon: Icons.users },
  { key: 'supervisors', label: 'Supervisors', icon: Icons.userCheck },
  { key: 'tasks', label: 'Tasks', icon: Icons.listChecks },
  { key: 'reports', label: 'Reports', icon: Icons.barChart3 },
]

function TeamTabs({ active, onChange }: { active: TeamTabType; onChange: (t: TeamTabType) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={ttStyles.scroll}>
      {TABS.map((tab) => {
        const isActive = active === tab.key
        return (
          <Pressable
            key={tab.key}
            onPress={() => {
              if (tab.key === 'workers' && active !== 'workers') {
                router.push({ pathname: '/worker-detail', params: { id: 'w1' } } as any)
                return
              }
              onChange(tab.key)
            }}
            style={[ttStyles.pill, isActive && ttStyles.pillActive]}
          >
            <GoonaIcon icon={tab.icon} size={14} color={isActive ? '#fff' : '#64748B'} />
            <Text style={[ttStyles.pillText, isActive && ttStyles.pillTextActive]}>{tab.label}</Text>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}
const ttStyles = StyleSheet.create({
  scroll: { paddingBottom: 4, marginBottom: 14 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8, paddingHorizontal: 16, borderRadius: 50,
    backgroundColor: 'white', marginRight: 8,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02, shadowRadius: 6, elevation: 1,
  },
  pillActive: {
    backgroundColor: '#00695C', borderColor: '#00695C',
    shadowColor: '#00695C', shadowOpacity: 0.2, shadowRadius: 12,
  },
  pillText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  pillTextActive: { color: '#fff' },
})

/* ─── Worker Card ─── */
const WORKER_DATA = [
  { initials: 'CO', name: 'Chinedu Okoro', role: 'Senior Farmhand', online: true, lastSeen: 'Last log 12 mins ago', tags: ['Feed', 'Mortality', 'Records', 'Weight'], id: 'w1', location: 'Poultry House A', battery: 87, checkIn: '06:12 AM', checkOut: '--' },
  { initials: 'AF', name: 'Aminat Fashola', role: 'Feed Specialist', online: true, lastSeen: 'Last log 3 mins ago', tags: ['Feed', 'Inventory', 'Records'], id: 'w2', location: 'Feed Warehouse', battery: 72, checkIn: '06:30 AM', checkOut: '--' },
  { initials: 'KO', name: 'Kola Ogunleye', role: 'Veterinary Assistant', online: false, lastSeen: 'Last seen 4h ago', tags: ['Health', 'Mortality', 'Records'], id: 'w3', location: 'Hatchery', battery: 34, checkIn: '06:45 AM', checkOut: '10:30 AM' },
]

const SUPERVISOR_DATA = [
  { initials: 'DO', name: 'David Okafor', role: 'Shift Supervisor', online: true, lastSeen: 'Online now', tags: ['Oversight', 'Reports', 'Scheduling'], id: 's1' },
  { initials: 'FT', name: 'Funmi Towolawi', role: 'Quality Supervisor', online: true, lastSeen: 'Last log 20 mins ago', tags: ['Quality', 'Compliance', 'Training'], id: 's2' },
]

const TASK_DATA = [
  { title: 'Morning feeding Batch A', assignee: 'Chinedu O.', priority: 'high' as const, due: 'Today 7AM' },
  { title: 'Inventory count — feed store', assignee: 'Aminat F.', priority: 'medium' as const, due: 'Today 12PM' },
  { title: 'Health check Batch C', assignee: 'Kola O.', priority: 'high' as const, due: 'Today 10AM' },
  { title: 'Clean drinker lines', assignee: 'Chinedu O.', priority: 'low' as const, due: 'Tomorrow 6AM' },
]

const REPORT_DATA = [
  { title: 'Daily Operations Report', author: 'David Okafor', date: 'Today 8AM', type: 'operations' as const },
  { title: 'Feed Efficiency Analysis', author: 'Aminat F.', date: 'Yesterday 4PM', type: 'feed' as const },
  { title: 'Worker Attendance Summary', author: 'System', date: 'Today 6AM', type: 'attendance' as const },
]

const wcStyles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'white', borderRadius: 18, padding: 16,
    marginBottom: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03, shadowRadius: 24, elevation: 2,
  },
  info: { flex: 1 },
  name: { fontWeight: '600', fontSize: 14, color: '#1B1B1B' },
  role: { fontSize: 12, color: '#64748B', marginTop: 1 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  statusDot: { width: 5, height: 5, borderRadius: 2.5 },
  status: { fontSize: 11, fontWeight: '500' },
  tags: { flexDirection: 'row', gap: 4, flexWrap: 'wrap', marginTop: 4 },
  tag: {
    paddingVertical: 2, paddingHorizontal: 8, borderRadius: 50,
    backgroundColor: 'rgba(0,105,92,0.05)',
  },
  tagText: { fontSize: 9, fontWeight: '600', color: '#00695C' },
})

/* ─── Supervisor Card ─── */
function SupervisorCard({
  initials, name, role, online, lastSeen, tags, index,
}: {
  initials: string; name: string; role: string; online: boolean
  lastSeen: string; tags: string[]; index: number
}) {
  const { style, onPressIn, onPressOut } = usePressScale()
  return (
    <Animated.View entering={FadeInUp.duration(500).delay(500 + index * 80).springify()}>
      <Pressable
        onPress={() => Alert.alert('Supervisor Profile', `${name}\n${role}\n\nSupervisor dashboard and team oversight coming soon.`)}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        <Animated.View style={[style, wcStyles.card, { borderLeftWidth: 3, borderLeftColor: '#00695C' }]}>
          <WorkerAvatar initials={initials} online={online} />
          <View style={wcStyles.info}>
            <Text style={wcStyles.name}>{name}</Text>
            <Text style={wcStyles.role}>{role}</Text>
            <View style={wcStyles.statusRow}>
              <View style={[wcStyles.statusDot, { backgroundColor: online ? '#22C55E' : '#94A3B8' }]} />
              <Text style={[wcStyles.status, { color: online ? '#22C55E' : '#94A3B8' }]}>
                {online ? 'Online' : 'Offline'} &bull; {lastSeen}
              </Text>
            </View>
            <View style={wcStyles.tags}>
              {tags.map((t) => (
                <View key={t} style={[wcStyles.tag, { backgroundColor: 'rgba(0,105,92,0.08)' }]}>
                  <Text style={[wcStyles.tagText, { color: '#0F766E' }]}>{t}</Text>
                </View>
              ))}
            </View>
          </View>
          <Icons.chevronRight size={16} color="#94A3B8" strokeWidth={2} />
        </Animated.View>
      </Pressable>
    </Animated.View>
  )
}

/* ─── Task Card ─── */
function TaskCard({
  title, assignee, priority, due, index,
}: {
  title: string; assignee: string; priority: 'high' | 'medium' | 'low'; due: string; index: number
}) {
  const { style, onPressIn, onPressOut } = usePressScale()
  const pColor = priority === 'high' ? '#EF4444' : priority === 'medium' ? '#F59E0B' : '#22C55E'

  return (
    <Animated.View entering={FadeInUp.duration(500).delay(500 + index * 80).springify()}>
      <Pressable
        onPress={() => Alert.alert('Task Details', `${title}\nAssigned to: ${assignee}\nDue: ${due}\n\nTask management coming soon.`)}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        <Animated.View style={[style, tkStyles.card]}>
          <View style={[tkStyles.priorityDot, { backgroundColor: pColor }]} />
          <View style={tkStyles.body}>
            <Text style={tkStyles.title}>{title}</Text>
            <Text style={tkStyles.meta}>{assignee} &bull; {due}</Text>
          </View>
          <View style={[tkStyles.pill, { backgroundColor: `${pColor}15` }]}>
            <Text style={[tkStyles.pillText, { color: pColor }]}>{priority}</Text>
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  )
}
const tkStyles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'white', borderRadius: 16, padding: 14,
    marginBottom: 8, borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02, shadowRadius: 12, elevation: 1,
  },
  priorityDot: { width: 4, height: 28, borderRadius: 2, flexShrink: 0 },
  body: { flex: 1 },
  title: { fontSize: 13, fontWeight: '600', color: '#1B1B1B' },
  meta: { fontSize: 11, color: '#64748B', marginTop: 2 },
  pill: { paddingVertical: 3, paddingHorizontal: 10, borderRadius: 50 },
  pillText: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
})

/* ─── Report Card ─── */
function ReportCard({
  title, author, date, type, index,
}: {
  title: string; author: string; date: string; type: string; index: number
}) {
  const { style, onPressIn, onPressOut } = usePressScale()
  const typeIcon = type === 'operations' ? Icons.clipboardList : type === 'feed' ? Icons.barChart3 : Icons.calendar

  return (
    <Animated.View entering={FadeInUp.duration(500).delay(500 + index * 80).springify()}>
      <Pressable
        onPress={() => Alert.alert('Report Preview', `${title}\nBy ${author}\n${date}\n\nFull report viewer coming soon.`)}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        <Animated.View style={[style, rpStyles.card]}>
          <View style={rpStyles.iconWrap}>
            <GoonaIcon icon={typeIcon} size={18} color="#00695C" />
          </View>
          <View style={rpStyles.body}>
            <Text style={rpStyles.title}>{title}</Text>
            <Text style={rpStyles.meta}>{author} &bull; {date}</Text>
          </View>
          <Icons.chevronRight size={14} color="#94A3B8" strokeWidth={2} />
        </Animated.View>
      </Pressable>
    </Animated.View>
  )
}
const rpStyles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'white', borderRadius: 16, padding: 14,
    marginBottom: 8, borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02, shadowRadius: 12, elevation: 1,
  },
  iconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(0,105,92,0.08)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  body: { flex: 1 },
  title: { fontSize: 13, fontWeight: '600', color: '#1B1B1B' },
  meta: { fontSize: 11, color: '#64748B', marginTop: 2 },
})

/* ─── Tab Content ─── */
function WorkerGateway() {
  const present = WORKER_DATA.filter((w) => w.online).length
  const locations = new Set(WORKER_DATA.map((w) => w.location).filter(Boolean)).size
  return (
    <Animated.View entering={FadeInUp.duration(500).delay(120).springify()}>
      <View style={wgStyles.card}>
        <View style={wgStyles.icon}>
          <GoonaIcon icon={Icons.users} size={21} color="#00695C" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={wgStyles.title}>Personnel</Text>
          <Text style={wgStyles.body}>All worker activity, tasks, attendance and messages live in Worker Detail.</Text>
          <View style={wgStyles.stats}>
            <Text style={wgStyles.stat}>{present} present</Text>
            <Text style={wgStyles.dot}>-</Text>
            <Text style={wgStyles.stat}>{locations} active locations</Text>
            <Text style={wgStyles.dot}>-</Text>
            <Text style={wgStyles.stat}>1 alert</Text>
          </View>
        </View>
      </View>
      {WORKER_DATA.map((w, i) => (
        <Pressable
          key={w.id}
          onPress={() => router.push({ pathname: '/worker-detail', params: { id: w.id } } as any)}
          style={({ pressed }) => [wgStyles.workerRow, pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] }]}
        >
          <WorkerAvatar initials={w.initials} online={w.online} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={wgStyles.workerName}>{w.name}</Text>
            <Text style={wgStyles.workerMeta} numberOfLines={1}>{w.role} - {w.location} - {w.lastSeen}</Text>
          </View>
          <Text style={[wgStyles.workerState, { color: w.online ? '#22C55E' : '#94A3B8' }]}>{w.online ? 'On site' : 'Off site'}</Text>
          <GoonaIcon icon={Icons.chevronRight} size={16} color="#94A3B8" />
        </Pressable>
      ))}
    </Animated.View>
  )
}

const wgStyles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 13,
    backgroundColor: 'white', borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03, shadowRadius: 24, elevation: 2,
  },
  icon: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: 'rgba(0,105,92,0.08)', alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 14, fontWeight: '800', color: '#1B1B1B' },
  body: { fontSize: 11.5, lineHeight: 16, color: '#64748B', marginTop: 3 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 5, marginTop: 8 },
  stat: { fontSize: 10, fontWeight: '800', color: '#00695C' },
  dot: { fontSize: 10, color: '#CBD5E1' },
  workerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'white', borderRadius: 16, padding: 12,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)',
    marginTop: 9,
  },
  workerName: { fontSize: 13, fontWeight: '800', color: '#1B1B1B' },
  workerMeta: { fontSize: 10.5, color: '#64748B', marginTop: 2, fontWeight: '600' },
  workerState: { fontSize: 9.5, fontWeight: '900' },
})

function TabContent({ tab }: { tab: TeamTabType }) {
  switch (tab) {
    case 'workers':
      return <WorkerGateway />
    case 'supervisors':
      return (
        <>
          {SUPERVISOR_DATA.map((s, i) => (
            <SupervisorCard key={s.initials} {...s} index={i} />
          ))}
        </>
      )
    case 'tasks':
      return (
        <>
          {TASK_DATA.map((t, i) => (
            <TaskCard key={t.title} {...t} index={i} />
          ))}
        </>
      )
    case 'reports':
      return (
        <>
          {REPORT_DATA.map((r, i) => (
            <ReportCard key={r.title} {...r} index={i} />
          ))}
        </>
      )
  }
}

/* ─── Insight Item ─── */
function InsightItem({ text, index, onPress }: { text: string; index: number; onPress?: () => void }) {
  const { style, onPressIn, onPressOut } = usePressScale()
  return (
    <Animated.View entering={FadeInUp.duration(500).delay(700 + index * 80).springify()}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        <Animated.View style={[style, isStyles.item]}>
          <GoonaIcon icon={Icons.sparkles} size={16} color="#00695C" style={{ marginTop: 1, flexShrink: 0 }} />
          <Text style={isStyles.text}>{text}</Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  )
}
const isStyles = StyleSheet.create({
  item: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: 'white', borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02, shadowRadius: 16, elevation: 1,
  },
  text: { fontSize: 13, lineHeight: 18, color: '#1B1B1B', flex: 1 },
})

/* ─── Activity Feed ─── */
const ACTIVITY_ITEMS = [
  { icon: Icons.clock, text: 'Chinedu checked in at Poultry House A.', color: '#00695C' },
  { icon: Icons.clipboardList, text: 'Aminat entered Feed Warehouse zone.', color: '#0F766E' },
  { icon: Icons.user, text: 'Kola completed morning health check route.', color: '#22C55E' },
  { icon: Icons.refreshCw, text: 'Attendance synced — 9 present, 2 absent.', color: '#0891B2' },
  { icon: Icons.bell, text: 'SOS drill completed — all workers responded.', color: '#F59E0B' },
  { icon: Icons.check, text: 'Checkpoint 4 verified by security patrol.', color: '#16A34A' },
  { icon: Icons.users, text: 'Worker exited farm geofence — auto check-out.', color: '#6366F1' },
  { icon: Icons.shield, text: 'Restricted zone alert — no unauthorized entry.', color: '#2E7D32' },
]

function ActivityFeed() {
  const [current, setCurrent] = useState(0)
  const opacity = useSharedValue(1)

  useEffect(() => {
    const t = setInterval(() => {
      opacity.value = withSequence(
        withTiming(0, { duration: 300 }),
        withDelay(50, withTiming(1, { duration: 300 })),
      )
      setTimeout(() => {
        setCurrent((prev) => (prev + 1) % ACTIVITY_ITEMS.length)
      }, 350)
    }, 4000)
    return () => clearInterval(t)
  }, [])

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }))
  const item = ACTIVITY_ITEMS[current]

  return (
    <Animated.View style={[afStyles.card, animStyle]}>
      <View style={afStyles.row}>
        <View style={[afStyles.iconWrap, { backgroundColor: `${item.color}12` }]}>
          <GoonaIcon icon={item.icon} size={14} color={item.color} />
        </View>
        <Text style={afStyles.text}>{item.text}</Text>
      </View>
      <View style={afStyles.dots}>
        {ACTIVITY_ITEMS.map((_, i) => (
          <View key={i} style={[afStyles.dot, i === current && { backgroundColor: '#00695C', width: 12 }]} />
        ))}
      </View>
    </Animated.View>
  )
}
const afStyles = StyleSheet.create({
  card: {
    backgroundColor: 'white', borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02, shadowRadius: 16, elevation: 1,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  text: { fontSize: 13, color: '#1B1B1B', flex: 1, lineHeight: 18 },
  dots: { flexDirection: 'row', gap: 4, marginTop: 10, justifyContent: 'center' },
  dot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#D1D5DB' },
})

/* ─── Hero Card ─── */
function HeroCard() {
  const { style: farmPress, onPressIn: farmIn, onPressOut: farmOut } = usePressScale()

  return (
    <Animated.View entering={FadeInUp.duration(600).delay(250).springify()}>
      <Pressable
        onPress={() => router.push('/workforce-live' as any)}
        onPressIn={farmIn}
        onPressOut={farmOut}
      >
      <Animated.View style={[farmPress]}>
      <LinearGradient
        colors={['#00695C', '#0F766E', '#AEEA00']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={heroStyles.card}
      >
        <View style={heroStyles.glow1} pointerEvents="none" />
        <View style={heroStyles.glow2} pointerEvents="none" />

        <View style={heroStyles.label}>
          <PulseDot />
          <Text style={heroStyles.labelText}>WORKFORCE OPERATIONS ACTIVE</Text>
        </View>

        <Text style={heroStyles.farmName}>Operational Summary</Text>
        <Text style={heroStyles.subtext}>{FARM_NAME} - live presence and operations summary</Text>

        <View style={heroStyles.walletStrip}>
          <GoonaIcon icon={Icons.users} size={13} color="rgba(255,255,255,0.6)" />
          <Text style={heroStyles.walletLabel}>Present 7</Text>
          <Text style={heroStyles.walletAmount}>Breaches 1</Text>
          <Text style={heroStyles.walletAmount}>Signals 1</Text>
        </View>
      </LinearGradient>
      </Animated.View>
      </Pressable>
    </Animated.View>
  )
}

const heroStyles = StyleSheet.create({
  card: {
    borderRadius: 34, padding: 28, marginTop: 20, overflow: 'hidden',
    shadowColor: '#00695C', shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.24, shadowRadius: 60, elevation: 8,
  },
  glow1: {
    position: 'absolute', top: '-40%', right: '-20%',
    width: 260, height: 260, borderRadius: 130,
    backgroundColor: 'rgba(174,234,0,0.10)',
  },
  glow2: {
    position: 'absolute', bottom: '-15%', left: '-10%',
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  label: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 50,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 5, paddingHorizontal: 14, marginBottom: 12,
  },
  labelText: {
    fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.5,
  },
  farmName: {
    fontWeight: '800', fontSize: 30, color: '#fff', lineHeight: 32,
  },
  subtext: {
    fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2,
  },
  walletStrip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 50,
    paddingVertical: 8, paddingHorizontal: 14,
    alignSelf: 'flex-start',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  walletLabel: {
    fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.6)',
  },
  walletAmount: {
    fontSize: 13, fontWeight: '800', color: '#AEEA00', marginLeft: 4,
  },
  nodes: {
    position: 'absolute', right: 14, top: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center',
  },
  node: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  nodeText: { fontSize: 8, fontWeight: '700', color: '#AEEA00' },
  nodeGlow: {
    position: 'absolute', top: -3, right: -3,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#22C55E',
    borderWidth: 2, borderColor: 'rgba(0,105,92,0.6)',
    shadowColor: '#22C55E', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6, shadowRadius: 8, elevation: 4,
  },
  nodeLine: { width: 1.5, height: 10, backgroundColor: 'rgba(255,255,255,0.12)' },
})

/* ─── Floating trust chips ─── */
function TrustChips() {
  const items: { label: string; style: Record<string, number>; icon: React.ReactNode }[] = [
    { label: 'Workforce Live', style: { top: 160, right: 10 }, icon: <GoonaIcon icon={Icons.shield} size={14} color="#00695C" /> },
    { label: '9 Present', style: { bottom: 320, left: 8 }, icon: <GoonaIcon icon={Icons.refreshCw} size={14} color="#00695C" /> },
    { label: 'All Zones Safe', style: { bottom: 240, right: 12 }, icon: <GoonaIcon icon={Icons.check} size={14} color="#00695C" /> },
  ]
  return (
    <>
      {items.map((item) => (
        <View key={item.label} style={[tcStyles.chip, item.style]} pointerEvents="none">
          {item.icon}
          <Text style={tcStyles.label}>{item.label}</Text>
        </View>
      ))}
    </>
  )
}
const tcStyles = StyleSheet.create({
  chip: {
    position: 'absolute', backgroundColor: 'white', borderRadius: 100,
    paddingVertical: 6, paddingHorizontal: 14,
    flexDirection: 'row', alignItems: 'center', gap: 7, zIndex: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 16, elevation: 3,
  },
  label: { fontSize: 11, fontWeight: '500', color: '#475569' },
})

/* ─── MAIN SCREEN ─── */
export default function TeamScreen() {
  const insets = useSafeAreaInsets()
  const [activeTab, setActiveTab] = useState<TeamTabType>('workers')
  const [insightIndex, setInsightIndex] = useState(0)

  const INSIGHTS = [
    { text: 'Attendance improved by 12% this week — 9 of 12 workers on time.', route: 'accountability' },
    { text: 'No safety incidents recorded in the last 7 days.', route: 'feed' },
    { text: 'Worker productivity score is 87% — above farm average.', route: 'academy' },
  ]

  /* cycle insights */
  useEffect(() => {
    const t = setInterval(() => {
      setInsightIndex((prev) => (prev + 1) % INSIGHTS.length)
    }, 5000)
    return () => clearInterval(t)
  }, [])

  const w1 = useSharedValue(0)
  const w2 = useSharedValue(0)
  const r1 = useSharedValue(0)
  useEffect(() => {
    w1.value = withTiming(1, { duration: 1400 })
    w2.value = withDelay(800, withTiming(1, { duration: 1400 }))
    r1.value = withRepeat(
      withSequence(withTiming(0.5, { duration: 2000 }), withTiming(1, { duration: 2000 })),
      -1, true,
    )
  }, [])

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* ─── background decorations ─── */}
      <View style={styles.bgBlob} pointerEvents="none">
        <View style={styles.bgBlobInner} />
      </View>
      <View style={styles.bgGlowCenter} pointerEvents="none" />
      <View style={styles.bgDotGrid} pointerEvents="none">
        {Array.from({ length: 60 }).map((_, i) => (
          <View key={i} style={[styles.bgDot, {
            left: `${(i % 10) * 11 + 3}%`,
            top: `${Math.floor(i / 10) * 14 + 5}%`,
          }]} />
        ))}
      </View>

      {/* ─── trust chips ─── */}
      <TrustChips />

      {/* ─── background contours ─── */}
      <View style={styles.bgContour1} pointerEvents="none" />
      <View style={styles.bgContour2} pointerEvents="none" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollInner,
          { paddingBottom: 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── TOP NAV ─── */}
        <Animated.View entering={FadeInUp.duration(500).springify()} style={styles.topNav}>
          <TouchableOpacity style={styles.navBack} onPress={() => router.back()} activeOpacity={0.7}>
            <GoonaIcon icon={Icons.arrowLeft} size={22} color="#1B1B1B" />
          </TouchableOpacity>
          <View style={styles.navLogo}>
            <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <Path d="M12 2C12 2 7 8 7 12C7 14.5 8.5 17 10 18.5C9.5 17 9 16 9 15C9 11.5 11 7 12 2Z" fill="#00695C" />
              <Path d="M12 2C12 2 17 8 17 12C17 14.5 15.5 17 14 18.5C14.5 17 15 16 15 15C15 11.5 13 7 12 2Z" fill="#0F766E" />
            </Svg>
            <Text style={styles.navLogoText}>GOONA</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={styles.navLabel}>Team Hub</Text>
            <Pressable
              onPress={() => router.push('/notifications' as any)}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, position: 'relative' })}
            >
              <GoonaIcon icon={Icons.bell} size={18} color="#1B1B1B" />
              <NotificationBadge size={16} />
            </Pressable>
          </View>
        </Animated.View>

        {/* ─── HEADER ─── */}
        <Animated.View entering={FadeInUp.duration(500).delay(80).springify()} style={styles.headerSection}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Team Hub</Text>
            <Text style={styles.headerSub}>Manage your operational ecosystem.</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.addBtn, pressed && { transform: [{ scale: 0.92 }] }]}
            onPress={() => {
              switch (activeTab) {
                case 'workers': Alert.alert('Add Worker', 'Worker onboarding form coming soon.') ; break
                case 'supervisors': Alert.alert('Add Supervisor', 'Supervisor invitation form coming soon.') ; break
                case 'tasks': Alert.alert('New Task', 'Task creation form coming soon.') ; break
                case 'reports': Alert.alert('New Report', 'Report generator coming soon.') ; break
              }
            }}
          >
            <Text style={styles.addBtnText}>+</Text>
          </Pressable>
        </Animated.View>

        {/* ─── WORKFORCE STATUS STRIP ─── */}
        <Animated.View entering={FadeInUp.duration(500).delay(130).springify()} style={wssStyles.strip}>
          <View style={wssStyles.left}>
            <PulseDot />
            <Text style={wssStyles.workers}>7 Present</Text>
            <View style={wssStyles.divider} />
            <GoonaIcon icon={Icons.mapPin} size={12} color="#64748B" />
            <Text style={wssStyles.locations}>3 Active Locations</Text>
          </View>
        </Animated.View>

        {/* ─── HERO CARD ─── */}
        <HeroCard />

        {/* ─── QUICK ACCESS ─── */}
        <Animated.View entering={FadeInUp.duration(500).delay(350).springify()} style={styles.sectionHdr}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(400).springify()} style={styles.qaGrid}>
          <View style={styles.qaRow}>
            <QACard
              variant="dark"
              title="GOONA IQ"
              desc="AI forecasts, insights, and operational intelligence."
              tags={['Forecasts', 'AI Coach', 'Insights']}
              icon={
                <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: 'rgba(174,234,0,0.3)', alignItems: 'center', justifyContent: 'center' }}>
                  <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: 'rgba(174,234,0,0.3)' }} />
                </View>
              }
              onPress={() => router.push('/goona-iq' as any)}
            />
            <View style={{ width: 14 }} />
            <QACard
              variant="dark"
              title="Academy"
              desc="Train with realistic farm simulations."
              tags={['Simulations', 'Challenges', 'XP']}
              icon={
                <GoonaIcon icon={Icons.book} size={20} color="rgba(255,255,255,0.5)" />
              }
              onPress={() => router.push('/goona-academy')}
            />
          </View>
          <View style={{ height: 14 }} />
          <View style={styles.qaRow}>
            <QACard
              variant="light"
              title="GOONA Wallet"
              desc="Receive, save and pay for farm operations."
              tags={['Transfers', 'Pay Workers', 'Recapt']}
              icon={
                <GoonaIcon icon={Icons.wallet} size={20} color="#2E7D32" />
              }
              onPress={() => router.push('/wallet')}
            />
            <View style={{ width: 14 }} />
            <QACard
              variant="light"
              title="Workforce Live"
              desc="Live workers, geofencing, attendance, safety and alerts."
              tags={['Geofencing', 'Live Map', 'Safety']}
              icon={
                <GoonaIcon icon={Icons.mapPin} size={20} color="#00695C" />
              }
              onPress={() => router.push('/workforce-live')}
            />
          </View>
          <View style={{ height: 14 }} />
          <View style={styles.qaRow}>
            <QACard
              variant="light"
              title="Reminders & Tasks"
              desc="Create tasks, set reminders, and assign team members."
              tags={['Tasks', 'Reminders']}
              icon={
                <GoonaIcon icon={Icons.bell} size={20} color="#00695C" />
              }
              onPress={() => router.push('/reminder-tasks' as any)}
            />
            <View style={{ width: 14 }} />
            <QACard
              variant="light"
              title="Settings"
              desc="Notifications, security, sync, and preferences."
              tags={['Security', 'Offline', 'AI Prefs']}
              icon={
                <GoonaIcon icon={Icons.settings} size={20} color="#00695C" />
              }
              onPress={() => router.push('/settings' as any)}
            />
          </View>
        </Animated.View>

        {/* ─── TEAM TABS ─── */}
        <Animated.View entering={FadeInUp.duration(500).delay(450).springify()} style={styles.sectionHdr}>
          <Text style={styles.sectionTitle}>Personnel</Text>
        </Animated.View>

        <TeamTabs active={activeTab} onChange={setActiveTab} />

        <TabContent tab={activeTab} />

        {/* ─── INVITE CARD ─── */}
        <Animated.View entering={FadeInUp.duration(500).delay(700).springify()}>
          <LinearGradient
            colors={['#AEEA00', '#8BC300']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={invStyles.card}
          >
            <Text style={invStyles.title}>Grow Your Workforce</Text>
            <Text style={invStyles.sub}>Invite workers, assign zones, and manage attendance from one place.</Text>
            <View style={invStyles.acts}>
              <Pressable
                style={({ pressed }) => [invStyles.btnPrimary, pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] }]}
                onPress={() => Alert.alert('QR Invite', 'Share your farm QR code with new team members.\n\nFeature coming soon.')}
              >
                <Text style={invStyles.btnPrimaryText}>Share QR Invite</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [invStyles.btnSecondary, pressed && { opacity: 0.7 }]}
                onPress={() => Alert.alert('WhatsApp Invite', 'Send an invitation link via WhatsApp.\n\nFeature coming soon.')}
              >
                <Text style={invStyles.btnSecondaryText}>{'\uD83D\uDCAC'} WhatsApp Invite</Text>
              </Pressable>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ─── ACTIVITY FEED ─── */}
        <Animated.View entering={FadeInUp.duration(500).delay(700).springify()} style={[styles.sectionHdr, { marginTop: 24 }]}>
          <Text style={styles.sectionTitle}>Workforce Feed</Text>
        </Animated.View>

        <ActivityFeed />

        {/* ─── INSIGHTS ─── */}
        <Animated.View entering={FadeInUp.duration(500).delay(700).springify()} style={[styles.sectionHdr, { marginTop: 24 }]}>
          <Text style={styles.sectionTitle}>GOONA IQ Insights</Text>
        </Animated.View>

        <View style={styles.insightsList}>
          {INSIGHTS.map((insight, i) => (
            <InsightItem
              key={insight.text}
              text={insight.text}
              index={i}
              onPress={() => {
                if (insight.route === 'accountability') Alert.alert('Accountability Insight', insight.text + '\n\nWorker performance analytics coming soon.')
                else if (insight.route === 'feed') Alert.alert('Feed Efficiency', insight.text + '\n\nFeed analytics dashboard coming soon.')
                else Alert.alert('Academy Score', insight.text + '\n\nLeaderboard and rankings coming soon.')
              }}
            />
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <BottomDock hidden={false} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9F5' },

  /* background */
  bgBlob: {
    position: 'absolute', top: -50, right: -50, width: 320, height: 320, zIndex: 0,
  },
  bgBlobInner: {
    width: 320, height: 320, borderRadius: 160,
    backgroundColor: 'rgba(0,105,92,0.08)',
  },
  bgGlowCenter: {
    position: 'absolute', top: '35%', left: '50%',
    width: 240, height: 240, marginLeft: -120, marginTop: -120,
    borderRadius: 120, zIndex: 0,
    backgroundColor: 'rgba(0,105,92,0.06)',
  },
  bgDotGrid: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, opacity: 0.5,
  },
  bgDot: {
    position: 'absolute', width: 2, height: 2,
    borderRadius: 1, backgroundColor: 'rgba(0,105,92,0.12)',
  },
  bgContour1: {
    position: 'absolute', top: '10%', right: '-15%',
    width: 380, height: 130, zIndex: 0,
    borderWidth: 1, borderColor: 'rgba(46,125,50,0.06)',
    borderTopLeftRadius: 190, borderTopRightRadius: 190,
    borderBottomWidth: 0,
    transform: [{ rotate: '10deg' }],
  },
  bgContour2: {
    position: 'absolute', bottom: '20%', left: '-10%',
    width: 300, height: 100, zIndex: 0,
    borderWidth: 1, borderColor: 'rgba(46,125,50,0.06)',
    borderBottomLeftRadius: 150, borderBottomRightRadius: 150,
    borderTopWidth: 0,
    transform: [{ rotate: '-8deg' }],
  },

  /* scroll */
  scroll: { flex: 1, zIndex: 1 },
  scrollInner: { paddingHorizontal: 24, paddingTop: 0 },

  /* top nav */
  topNav: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingTop: 54,
  },
  navBack: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  navLogo: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  navLogoText: { fontWeight: '700', fontSize: 14, color: '#1B1B1B' },
  navLabel: { fontSize: 14, fontWeight: '500', color: '#616161' },

  /* header */
  headerSection: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginTop: 20,
  },
  headerLeft: { flex: 1 },
  headerTitle: { fontWeight: '800', fontSize: 32, lineHeight: 36, color: '#1B1B1B' },
  headerSub: { fontSize: 14, color: '#64748B', marginTop: 1 },
  headerRight: { flexShrink: 0 },
  addBtn: {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
  },
  addBtnText: { fontSize: 24, color: '#1F2937', lineHeight: 26 },

  /* section header */
  sectionHdr: { marginTop: 24, marginBottom: 14 },
  sectionTitle: { fontWeight: '800', fontSize: 20, color: '#1B1B1B' },

  /* quick access grid */
  qaGrid: {},
  qaRow: { flexDirection: 'row' },

  /* insights list */
  insightsList: { gap: 8 },
})

/* ─── Notification badge ─── */
const s = StyleSheet.create({
  bellBadge: {
    position: 'absolute', top: -4, right: -6,
    minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
  },
  bellBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff' },
})

/* ─── Workforce status strip styles ─── */
const wssStyles = StyleSheet.create({
  strip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'white', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 16,
    marginTop: 14, borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03, shadowRadius: 12, elevation: 2,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  divider: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB' },
  workers: { fontSize: 12, fontWeight: '700', color: '#22C55E' },
  locations: { fontSize: 12, fontWeight: '600', color: '#64748B' },
})

/* ─── Invite card styles ─── */
const invStyles = StyleSheet.create({
  card: {
    borderRadius: 28, padding: 24, marginTop: 14,
    shadowColor: '#AEEA00', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15, shadowRadius: 36, elevation: 6,
  },
  title: { fontWeight: '700', fontSize: 17, color: '#1A2E00' },
  sub: { fontSize: 12, color: 'rgba(26,46,0,0.55)', marginTop: 2, marginBottom: 14 },
  acts: { flexDirection: 'row', gap: 8 },
  btnPrimary: {
    flex: 1, paddingVertical: 11, borderRadius: 14,
    backgroundColor: '#1A2E00', alignItems: 'center',
  },
  btnPrimaryText: { fontWeight: '600', fontSize: 12, color: '#fff' },
  btnSecondary: {
    flex: 1, paddingVertical: 11, borderRadius: 14,
    borderWidth: 1.5, borderColor: 'rgba(26,46,0,0.2)',
    alignItems: 'center',
  },
  btnSecondaryText: { fontWeight: '600', fontSize: 12, color: '#1A2E00' },
})

