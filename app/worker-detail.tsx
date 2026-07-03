import React from 'react'
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { router, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { FadeInUp, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated'
import GoonaIcon from '../components/ui/GoonaIcon'
import BottomDock from '../components/navigation/BottomDock'
import { Icons } from '../shared/icons'
import { useFarmChatStore } from '../store/useFarmChatStore'

type WorkerStatus = 'onsite' | 'offsite' | 'idle' | 'restricted' | 'signal'
type WorkerDetail = {
  id: string
  initials: string
  name: string
  role: string
  status: WorkerStatus
  online: boolean
  lastLog: string
  location: string
  zone: string
  battery: number
  phone: string
  chatUserId: string
  arrived: string
  checkedOut: string
  onsiteToday: string
  schedule: string
  attendanceRate: number
  punctuality: number
  safetyScore: number
  tasksCompleted: number
  tasks: { title: string; due: string; status: 'done' | 'active' | 'pending'; metric: string }[]
  performance: { label: string; value: string; delta: string; icon: keyof typeof Icons; color: string }[]
  logs: { title: string; time: string; detail?: string; tone?: 'ok' | 'warn' | 'bad' }[]
  week: { day: string; hours: string }[]
}

const C = { bg: '#F6F9F4', card: '#fff', ink: '#15291A', mut: '#5C6B5E', mut2: '#8A988C', line: '#E5ECE0', green: '#1E7A3D', green2: '#43A047', lime: '#AEEA00', red: '#E23B2E', amber: '#E08A12', blue: '#2C82C9' }

const WORKERS: WorkerDetail[] = [
  {
    id: 'w1', initials: 'CO', name: 'Chinedu Okoro', role: 'Senior Farmhand', status: 'onsite', online: true,
    lastLog: 'Last log 12 mins ago', location: 'Poultry House A', zone: 'Poultry House A', battery: 87,
    phone: '+2348010000001', chatUserId: 'chinedu', arrived: '06:55', checkedOut: '--', onsiteToday: '6h 12m',
    schedule: '07:00-16:00', attendanceRate: 98, punctuality: 95, safetyScore: 96, tasksCompleted: 134,
    tasks: [
      { title: 'Morning feed Batch A', due: '07:00', status: 'done', metric: 'Feed' },
      { title: 'Record mortality count', due: '10:30', status: 'done', metric: 'Mortality' },
      { title: 'Weight sample Batch C', due: '15:00', status: 'active', metric: 'Weight' },
    ],
    performance: [
      { label: 'Feed accuracy', value: '96%', delta: '+4%', icon: 'wheat', color: C.green },
      { label: 'Mortality logs', value: '0 late', delta: 'clean', icon: 'heart', color: C.red },
      { label: 'Avg weight', value: '1.8kg', delta: '+0.2', icon: 'scale', color: C.blue },
      { label: 'Health checks', value: '12', delta: 'today', icon: 'shieldCheck', color: C.green2 },
    ],
    logs: [
      { title: 'Entered farm boundary', time: '06:55' },
      { title: 'Entered Poultry House A', time: '07:08', detail: 'Geofence check-in' },
      { title: 'Feed record submitted', time: '09:42', detail: 'Batch A: 75kg' },
      { title: 'Weight sample synced', time: '13:20', detail: 'Batch C: 1.8kg', tone: 'ok' },
    ],
    week: [{ day: 'MON', hours: '7.8h' }, { day: 'TUE', hours: '7.9h' }, { day: 'WED', hours: '8.1h' }, { day: 'THU', hours: '7.5h' }, { day: 'FRI', hours: '6.7h' }],
  },
  {
    id: 'w2', initials: 'AF', name: 'Aminat Fashola', role: 'Feed Specialist', status: 'onsite', online: true,
    lastLog: 'Last log 3 mins ago', location: 'Feed Warehouse', zone: 'Feed Warehouse', battery: 72,
    phone: '+2348010000002', chatUserId: 'aminat', arrived: '06:48', checkedOut: '--', onsiteToday: '6h 20m',
    schedule: '07:00-16:00', attendanceRate: 100, punctuality: 98, safetyScore: 94, tasksCompleted: 89,
    tasks: [
      { title: 'Feed store inventory', due: '12:00', status: 'active', metric: 'Feed' },
      { title: 'Confirm delivery bags', due: '14:00', status: 'pending', metric: 'Inventory' },
    ],
    performance: [
      { label: 'Feed variance', value: '1.5%', delta: 'tight', icon: 'wheat', color: C.green },
      { label: 'Inventory sync', value: '99%', delta: '+2%', icon: 'clipboardList', color: C.blue },
      { label: 'Records', value: '18', delta: 'today', icon: 'fileText', color: C.green2 },
      { label: 'Safety', value: '94%', delta: 'stable', icon: 'shieldCheck', color: C.green },
    ],
    logs: [
      { title: 'Entered farm boundary', time: '06:48' },
      { title: 'Entered Feed Warehouse', time: '07:02' },
      { title: 'Inventory update synced', time: '12:04' },
    ],
    week: [{ day: 'MON', hours: '8.0h' }, { day: 'TUE', hours: '7.7h' }, { day: 'WED', hours: '8.2h' }, { day: 'THU', hours: '7.9h' }, { day: 'FRI', hours: '6.9h' }],
  },
  {
    id: 'w3', initials: 'KO', name: 'Kola Ogunleye', role: 'Veterinary Assistant', status: 'idle', online: false,
    lastLog: 'Last seen 4h ago', location: 'Hatchery', zone: 'Hatchery', battery: 34,
    phone: '+2348010000003', chatUserId: 'kola', arrived: '06:45', checkedOut: '10:30', onsiteToday: '3h 45m',
    schedule: '07:00-16:00', attendanceRate: 94, punctuality: 88, safetyScore: 91, tasksCompleted: 67,
    tasks: [
      { title: 'Batch C health check', due: '10:00', status: 'done', metric: 'Health' },
      { title: 'Treatment follow-up', due: '15:30', status: 'pending', metric: 'Health' },
    ],
    performance: [
      { label: 'Health checks', value: '8', delta: 'today', icon: 'heart', color: C.red },
      { label: 'Mortality logs', value: '1', delta: 'review', icon: 'alertTriangle', color: C.amber },
      { label: 'Treatment sync', value: '92%', delta: '+3%', icon: 'pill', color: C.blue },
      { label: 'Safety', value: '91%', delta: 'stable', icon: 'shieldCheck', color: C.green },
    ],
    logs: [
      { title: 'Entered farm boundary', time: '06:45' },
      { title: 'Entered Hatchery', time: '07:11' },
      { title: 'Checked out', time: '10:30', tone: 'warn' },
    ],
    week: [{ day: 'MON', hours: '7.1h' }, { day: 'TUE', hours: '7.4h' }, { day: 'WED', hours: '6.8h' }, { day: 'THU', hours: '7.0h' }, { day: 'FRI', hours: '3.8h' }],
  },
  {
    id: 'w9', initials: 'DE', name: 'Dele Akin', role: 'Farmhand', status: 'restricted', online: true,
    lastLog: 'Flagged 8 mins ago', location: 'Chemical Storage', zone: 'Chemical Storage', battery: 55,
    phone: '+2348010000009', chatUserId: 'dele', arrived: '06:35', checkedOut: '--', onsiteToday: '6h 30m',
    schedule: '07:00-16:00', attendanceRate: 91, punctuality: 83, safetyScore: 87, tasksCompleted: 19,
    tasks: [
      { title: 'Storage cleanup', due: '11:00', status: 'done', metric: 'Tasks' },
      { title: 'Restricted-zone review', due: 'now', status: 'active', metric: 'Safety' },
    ],
    performance: [
      { label: 'Safety', value: '87%', delta: 'review', icon: 'shieldAlert', color: C.red },
      { label: 'Tasks', value: '19', delta: 'week', icon: 'listChecks', color: C.green },
      { label: 'Records', value: '6', delta: 'today', icon: 'fileText', color: C.blue },
      { label: 'Attendance', value: '91%', delta: '-2%', icon: 'clock', color: C.amber },
    ],
    logs: [
      { title: 'Entered farm boundary', time: '06:35' },
      { title: 'Entered Storage Facility', time: '07:18' },
      { title: 'Restricted zone entry', time: '12:58', detail: 'Chemical Storage', tone: 'bad' },
    ],
    week: [{ day: 'MON', hours: '7.0h' }, { day: 'TUE', hours: '7.4h' }, { day: 'WED', hours: '6.9h' }, { day: 'THU', hours: '7.1h' }, { day: 'FRI', hours: '6.4h' }],
  },
]

function getWorker(id?: string | string[]) {
  const key = Array.isArray(id) ? id[0] : id
  return WORKERS.find((w) => w.id === key) || WORKERS[0]
}
function statusColor(status: WorkerStatus) {
  return status === 'restricted' ? C.red : status === 'signal' ? C.amber : status === 'offsite' ? C.blue : status === 'idle' ? '#94A3B8' : C.green2
}
function statusLabel(status: WorkerStatus) {
  return status === 'onsite' ? 'On site' : status === 'offsite' ? 'Off site' : status === 'signal' ? 'Signal lost' : status === 'restricted' ? 'Restricted' : 'Idle'
}
function usePressScale() {
  const scale = useSharedValue(1)
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
  return { style, onPressIn: () => { scale.value = withSpring(0.97) }, onPressOut: () => { scale.value = withTiming(1) } }
}
function Section({ title, tag }: { title: string; tag?: string }) {
  return <View style={s.section}><Text style={s.sectionTitle}>{title}</Text><View style={s.sectionLine} />{tag ? <Text style={s.sectionTag}>{tag}</Text> : null}</View>
}
function MetricCard({ label, value, delta, icon, color }: WorkerDetail['performance'][number]) {
  const I = Icons[icon]
  return <View style={s.metricCard}><View style={[s.metricIcon, { backgroundColor: color + '18' }]}><GoonaIcon icon={I} size={17} color={color} /></View><Text style={s.metricValue}>{value}</Text><Text style={s.metricLabel}>{label}</Text><Text style={[s.metricDelta, { color }]}>{delta}</Text></View>
}
function ActionButton({ icon, label, onPress, badge }: { icon: any; label: string; onPress: () => void; badge?: number }) {
  const p = usePressScale()
  return <Animated.View style={[p.style, { flex: 1 }]}><TouchableOpacity activeOpacity={0.78} onPress={onPress} onPressIn={p.onPressIn} onPressOut={p.onPressOut} style={s.actionBtn}><View><GoonaIcon icon={icon} size={16} color={C.green} />{badge ? <Text style={s.badge}>{badge}</Text> : null}</View><Text style={s.actionText}>{label}</Text></TouchableOpacity></Animated.View>
}

export default function WorkerDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>()
  const insets = useSafeAreaInsets()
  const worker = getWorker(params.id)
  const seedDemoData = useFarmChatStore((state) => state.seedDemoData)
  const createConversation = useFarmChatStore((state) => state.createConversation)
  const conversations = useFarmChatStore((state) => state.conversations)
  React.useEffect(() => { seedDemoData() }, [seedDemoData])
  const conv = conversations.find((c) => c.type === 'direct' && c.participants.some((p) => p.id === worker.chatUserId))
  const openDm = React.useCallback(() => {
    seedDemoData()
    const convId = conv?.id || createConversation(worker.chatUserId)
    if (!convId) { Alert.alert('FarmChat unavailable', 'No FarmChat contact found for ' + worker.name + '.'); return }
    router.push(('/(tabs)/chat/' + convId) as any)
  }, [conv?.id, createConversation, seedDemoData, worker.chatUserId, worker.name])
  const callWorker = React.useCallback(() => { openDm() }, [openDm])
  const viewLiveMap = React.useCallback(() => {
    router.push({ pathname: '/workforce-live', params: { tab: 'live' } } as any)
  }, [])
  const backToParent = () => {
    if (router.canGoBack()) router.back()
    else router.replace({ pathname: '/workforce-live', params: { tab: 'live' } } as any)
  }
  const criticalAlerts = [
    worker.status === 'restricted' ? 'Restricted area entry needs manager review.' : null,
    worker.status === 'signal' ? 'Signal lost. Using last known location until device reconnects.' : null,
    worker.battery <= 20 ? 'Low battery may interrupt live tracking.' : null,
  ].filter(Boolean) as string[]
  const activityRows = [
    ...worker.logs.map((log) => ({
      ...log,
      kind: log.title.includes('Entered') || log.title.includes('Checked') || log.title.includes('GPS') || log.title.includes('Restricted') ? 'Movement' : 'Work',
    })),
    ...(worker.checkedOut === '--'
      ? [{ title: 'Still active on farm', detail: worker.location + ' - live route updating', time: 'Now', tone: 'warn' as const, kind: 'Live' }]
      : worker.logs.some((log) => log.title.includes('Checked') || log.title.includes('Exited'))
        ? []
        : [{ title: 'Exited farm boundary', detail: 'Auto check-out completed', time: worker.checkedOut, tone: 'bad' as const, kind: 'Movement' }]),
  ]

  return (
    <View style={s.wrap}>
      <StatusBar style="dark" />
      <View style={[s.top, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity activeOpacity={0.75} onPress={backToParent} style={s.iconBtn}><GoonaIcon icon={Icons.chevronLeft} size={19} color={C.ink} /></TouchableOpacity>
        <Text style={s.topTitle}>Worker Detail</Text>
        <TouchableOpacity activeOpacity={0.75} onPress={viewLiveMap} style={s.iconBtn}><GoonaIcon icon={Icons.mapPin} size={18} color={C.ink} /></TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.content, { paddingBottom: 116 + insets.bottom }]}>
        <Animated.View entering={FadeInUp.duration(360).springify()} style={s.profileRow}>
          <View style={[s.avatar, { borderColor: statusColor(worker.status) }]}><Text style={s.avatarText}>{worker.initials}</Text></View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={s.name}>{worker.name}</Text>
            <Text style={s.role}>{worker.role}</Text>
            <View style={s.statusRow}><View style={[s.statusDot, { backgroundColor: statusColor(worker.status) }]} /><Text style={[s.statusText, { color: statusColor(worker.status) }]}>{statusLabel(worker.status)} - {worker.lastLog}</Text></View>
          </View>
        </Animated.View>
        <Animated.View entering={FadeInUp.duration(360).delay(60).springify()} style={s.summaryGrid}>
          <View style={s.summaryCard}><Text style={s.summaryLabel}>ON SITE TODAY</Text><Text style={s.summaryValue}>{worker.onsiteToday}</Text></View>
          <View style={s.summaryCard}><Text style={s.summaryLabel}>ARRIVED</Text><Text style={s.summaryValue}>{worker.arrived}</Text></View>
        </Animated.View>
        <View style={s.shiftPill}><View style={s.shiftLeft}><GoonaIcon icon={Icons.clock} size={13} color={C.green} /><Text style={s.shiftText}>Scheduled {worker.schedule}</Text></View><Text style={s.onTime}>{worker.checkedOut === '--' ? 'On shift' : 'Checked out'}</Text></View>
        <View style={s.locationCard}><View style={s.locationIcon}><GoonaIcon icon={Icons.navigation} size={18} color={C.green} /></View><View style={{ flex: 1 }}><Text style={s.locationTitle}>{worker.location}</Text><Text style={s.locationSub}>{worker.zone} - Battery {worker.battery}% - Geofence active</Text></View></View>
        {criticalAlerts.length ? <View style={s.alertCard}><GoonaIcon icon={Icons.alertTriangle} size={17} color={C.red} /><View style={{ flex: 1 }}>{criticalAlerts.map((alert) => <Text key={alert} style={s.alertText}>{alert}</Text>)}</View></View> : null}
        <Section title="Communication" tag={conv?.unreadCount ? String(conv.unreadCount) + ' unread' : undefined} />
        <View style={s.actions}><ActionButton icon={Icons.phone} label="Call" onPress={callWorker} /><ActionButton icon={Icons.messageCircle} label="Message" onPress={openDm} badge={conv?.unreadCount} /><ActionButton icon={Icons.mapPin} label="Live map" onPress={viewLiveMap} /></View>
        <Section title="Today's activity" tag={worker.checkedOut === '--' ? 'Live route' : 'Complete'} />
        <View style={s.liveMap}>
          <View style={s.boundaryDash} />
          <View style={[s.mapBlock, { left: '12%', top: '14%', width: '31%', height: '28%' }]} />
          <View style={[s.mapBlock, { left: '49%', top: '12%', width: '29%', height: '31%' }]} />
          <View style={[s.mapBlock, { left: '17%', top: '62%', width: '22%', height: '22%' }]} />
          <View style={[s.mapBlock, { left: '45%', top: '60%', width: '29%', height: '24%' }]} />
          <View style={s.restrictedBlock} />
          <View style={s.liveRoute} />
          <View style={[s.routeDot, { left: '17%', top: '57%' }]} />
          <View style={[s.routeDot, { left: '27%', top: '57%' }]} />
          <View style={[s.routeDot, { left: '36%', top: '57%' }]} />
          <View style={[s.routeDot, { left: '56%', top: '51%' }]} />
          <View style={[s.routeDot, { left: '70%', top: '45%' }]} />
          <View style={[s.livePulse, { borderColor: statusColor(worker.status) }]} />
          <View style={[s.livePin, { backgroundColor: statusColor(worker.status) }]} />
          <View style={s.liveLabel}><Text style={s.liveLabelText}>Live</Text></View>
        </View>
        <View style={s.timelineCard}>{activityRows.map((log, i) => <View key={log.title + log.time} style={s.timelineRow}><View style={s.timelineRail}><View style={[s.timelineDot, log.kind === 'Work' && { backgroundColor: C.blue }, log.kind === 'Live' && { backgroundColor: C.green2 }, log.tone === 'bad' && { backgroundColor: C.red }, log.tone === 'warn' && { backgroundColor: C.amber }]} />{i < activityRows.length - 1 ? <View style={s.timelineLine} /> : null}</View><View style={{ flex: 1 }}><View style={s.activityTitleRow}><Text style={[s.timelineTitle, log.tone === 'bad' && { color: C.red }]}>{log.title}</Text><Text style={[s.activityKind, log.kind === 'Work' && s.activityKindWork, log.kind === 'Live' && s.activityKindLive]}>{log.kind}</Text></View>{log.detail ? <Text style={s.timelineSub}>{log.detail}</Text> : null}</View><Text style={s.timelineTime}>{log.time}</Text></View>)}</View>
        <View style={s.lastKnown}><GoonaIcon icon={Icons.cloudOff} size={15} color={C.mut} /><Text style={s.lastKnownText}>Last known: {worker.location} - {worker.lastLog}</Text></View>
        <Section title="Task assignments" tag={String(worker.tasks.length)} />
        {worker.tasks.map((task) => <View key={task.title} style={s.taskRow}><View style={[s.taskState, task.status === 'done' && { backgroundColor: C.green2 }, task.status === 'active' && { backgroundColor: C.amber }]} /><View style={{ flex: 1 }}><Text style={s.taskTitle}>{task.title}</Text><Text style={s.taskMeta}>{task.metric} - Due {task.due}</Text></View><Text style={[s.taskBadge, task.status === 'active' && { color: C.amber }, task.status === 'done' && { color: C.green }]}>{task.status}</Text></View>)}
        <Section title="Performance metrics" />
        <View style={s.metrics}>{worker.performance.map((m) => <MetricCard key={m.label} {...m} />)}</View>
        <View style={s.kpiStrip}><View style={s.kpi}><Text style={s.kpiValue}>{worker.attendanceRate}%</Text><Text style={s.kpiLabel}>Attendance</Text></View><View style={s.kpiSep} /><View style={s.kpi}><Text style={s.kpiValue}>{worker.punctuality}%</Text><Text style={s.kpiLabel}>Punctuality</Text></View><View style={s.kpiSep} /><View style={s.kpi}><Text style={s.kpiValue}>{worker.tasksCompleted}</Text><Text style={s.kpiLabel}>Tasks</Text></View></View>
        <Section title="This week" tag="38.0h total" />
        <View style={s.weekGrid}>{worker.week.map((d) => <View key={d.day} style={s.weekCard}><Text style={s.weekDay}>{d.day}</Text><Text style={s.weekHours}>{d.hours}</Text></View>)}</View>
      </ScrollView>
      <BottomDock hidden={false} />
    </View>
  )
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 8 },
  iconBtn: { width: 38, height: 38, borderRadius: 13, backgroundColor: C.card, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center', shadowColor: '#142819', shadowOpacity: .05, shadowRadius: 8, elevation: 2 },
  topTitle: { fontSize: 14, fontWeight: '900', color: '#000' },
  content: { paddingHorizontal: 22, paddingBottom: 28 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  avatar: { width: 52, height: 52, borderRadius: 14, backgroundColor: '#35A66F', borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 17, fontWeight: '900' },
  name: { fontSize: 19, fontWeight: '900', color: '#07180C' },
  role: { fontSize: 12, color: C.mut, fontWeight: '700' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 10.5, fontWeight: '900' },
  summaryGrid: { flexDirection: 'row', gap: 9, marginTop: 16 },
  summaryCard: { flex: 1, backgroundColor: C.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: C.line, shadowColor: '#142819', shadowOpacity: .08, shadowRadius: 10, elevation: 2 },
  summaryLabel: { fontSize: 8, color: C.ink, fontWeight: '900' },
  summaryValue: { marginTop: 4, fontSize: 18, color: C.ink, fontWeight: '900' },
  shiftPill: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, backgroundColor: C.card, borderRadius: 12, padding: 11, borderWidth: 1, borderColor: C.line, shadowColor: '#142819', shadowOpacity: .05, shadowRadius: 8, elevation: 1 },
  shiftLeft: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  shiftText: { fontSize: 11, color: C.ink, fontWeight: '800' },
  onTime: { fontSize: 9, color: C.green, fontWeight: '900', backgroundColor: '#E6F4E9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  locationCard: { flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: C.card, borderRadius: 14, padding: 13, borderWidth: 1, borderColor: C.line, marginTop: 10 },
  locationIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#E6F4E9', alignItems: 'center', justifyContent: 'center' },
  locationTitle: { fontSize: 14, fontWeight: '900', color: C.ink },
  locationSub: { fontSize: 11, color: C.mut, fontWeight: '700', marginTop: 2 },
  alertCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, backgroundColor: '#FCEAE7', borderRadius: 14, borderWidth: 1, borderColor: '#F3C5BE', padding: 12, marginTop: 10 },
  alertText: { fontSize: 11.5, color: C.red, fontWeight: '800', lineHeight: 16 },
  section: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20, marginBottom: 10 },
  sectionTitle: { fontSize: 12, fontWeight: '900', letterSpacing: .7, textTransform: 'uppercase', color: C.mut },
  sectionLine: { flex: 1, height: 1, backgroundColor: C.line },
  sectionTag: { fontSize: 10, fontWeight: '900', color: C.green, backgroundColor: '#E6F4E9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  actions: { flexDirection: 'row', gap: 9 },
  actionBtn: { alignItems: 'center', gap: 5, backgroundColor: C.card, borderRadius: 12, paddingVertical: 12, borderWidth: 1, borderColor: C.line, shadowColor: '#142819', shadowOpacity: .06, shadowRadius: 8, elevation: 1 },
  actionText: { fontSize: 10, color: C.ink, fontWeight: '900' },
  badge: { position: 'absolute', right: -9, top: -8, minWidth: 15, height: 15, borderRadius: 8, backgroundColor: C.red, color: '#fff', fontSize: 8, fontWeight: '900', textAlign: 'center', overflow: 'hidden' },
  timelineCard: { backgroundColor: C.card, borderRadius: 13, padding: 13, borderWidth: 1, borderColor: C.line, shadowColor: '#142819', shadowOpacity: .08, shadowRadius: 12, elevation: 2 },
  timelineRow: { flexDirection: 'row', minHeight: 42 },
  timelineRail: { width: 16, alignItems: 'center' },
  timelineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#9BB5AF', borderWidth: 2, borderColor: '#EEF7EF' },
  timelineLine: { flex: 1, width: 2, backgroundColor: '#CAD8CE', marginTop: 2 },
  activityTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  activityKind: { fontSize: 7.5, color: C.green, fontWeight: '900', textTransform: 'uppercase', backgroundColor: '#E6F4E9', borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2 },
  activityKindWork: { color: C.blue, backgroundColor: '#E7F0FA' },
  activityKindLive: { color: C.green, backgroundColor: '#DDF5D0' },
  timelineTitle: { fontSize: 11, color: C.ink, fontWeight: '900' },
  timelineSub: { fontSize: 9, color: C.mut, marginTop: 2 },
  timelineTime: { fontSize: 8, color: C.mut, fontWeight: '800' },
  liveMap: { width: '100%', aspectRatio: 1.6, borderRadius: 14, backgroundColor: '#E4F0DD', overflow: 'hidden', marginBottom: 10, position: 'relative' },
  breadcrumbMap: { height: 170, borderRadius: 14, backgroundColor: '#E4F0DD', overflow: 'hidden', marginBottom: 10, position: 'relative' },
  boundaryDash: { position: 'absolute', left: '4%', right: '4%', top: '7%', bottom: '7%', borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.green, borderRadius: 8 },
  mapBlock: { position: 'absolute', backgroundColor: '#CFE5C9', borderWidth: 1, borderColor: '#B9DAB6', transform: [{ rotate: '-4deg' }] },
  restrictedBlock: { position: 'absolute', right: '22%', top: '42%', width: '14%', height: '20%', backgroundColor: '#EBD9C8', borderWidth: 1, borderColor: '#E6B59D' },
  liveRoute: { position: 'absolute', left: '18%', right: '24%', top: '58%', height: 2, backgroundColor: C.blue, transform: [{ rotate: '-8deg' }] },
  routeDot: { position: 'absolute', width: 7, height: 7, borderRadius: 4, borderWidth: 1.3, borderColor: C.blue, backgroundColor: '#F6F9F4' },
  livePulse: { position: 'absolute', right: '23%', top: '41%', width: 26, height: 26, borderRadius: 13, borderWidth: 2, opacity: .2 },
  livePin: { position: 'absolute', right: '26%', top: '45%', width: 13, height: 13, borderRadius: 7, borderWidth: 2, borderColor: '#fff' },
  liveLabel: { position: 'absolute', right: '18%', top: '28%', backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderColor: C.line },
  liveLabelText: { fontSize: 8, fontWeight: '900', color: C.green },
  pathLine: { position: 'absolute', left: 43, top: 93, width: 46, height: 2, backgroundColor: '#35A66F' },
  pathStart: { position: 'absolute', left: 39, top: 89, width: 7, height: 7, borderRadius: 4, borderWidth: 1, borderColor: '#1B8F58', backgroundColor: '#fff' },
  pathMid: { position: 'absolute', left: 64, top: 91, width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff', borderWidth: 1, borderColor: '#1B8F58' },
  pathEnd: { position: 'absolute', left: 82, top: 86, width: 12, height: 12, borderRadius: 6, backgroundColor: '#35A66F' },
  lastKnown: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: C.line, marginBottom: 10 },
  lastKnownText: { fontSize: 11, color: '#00150A', fontWeight: '800' },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.line, padding: 12, marginBottom: 8 },
  taskState: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.mut2 },
  taskTitle: { fontSize: 13, color: C.ink, fontWeight: '900' },
  taskMeta: { fontSize: 10.5, color: C.mut, fontWeight: '700', marginTop: 2 },
  taskBadge: { fontSize: 10, color: C.mut, fontWeight: '900', textTransform: 'uppercase' },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  metricCard: { width: '48.5%', backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.line, padding: 12, minHeight: 112 },
  metricIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  metricValue: { fontSize: 18, color: C.ink, fontWeight: '900' },
  metricLabel: { fontSize: 10.5, color: C.mut, fontWeight: '800', marginTop: 2 },
  metricDelta: { fontSize: 10, fontWeight: '900', marginTop: 5 },
  kpiStrip: { flexDirection: 'row', backgroundColor: C.card, borderRadius: 15, borderWidth: 1, borderColor: C.line, padding: 13, marginTop: 10 },
  kpi: { flex: 1, alignItems: 'center' },
  kpiValue: { fontSize: 18, fontWeight: '900', color: C.green },
  kpiLabel: { fontSize: 10, color: C.mut, fontWeight: '800', marginTop: 2 },
  kpiSep: { width: 1, backgroundColor: C.line },
  weekGrid: { flexDirection: 'row', gap: 8 },
  weekCard: { flex: 1, backgroundColor: C.card, borderRadius: 12, borderWidth: 1, borderColor: C.line, alignItems: 'center', paddingVertical: 11 },
  weekDay: { fontSize: 8, color: C.mut, fontWeight: '900' },
  weekHours: { fontSize: 12, color: C.ink, fontWeight: '900', marginTop: 5 },
})
