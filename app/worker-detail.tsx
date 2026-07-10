import React from 'react'
import { AccessibilityInfo, Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { router, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { Easing, FadeInUp, interpolate, useAnimatedProps, useAnimatedStyle, useSharedValue, withRepeat, withSpring, withTiming } from 'react-native-reanimated'
import Svg, { Circle, Defs, G, Line, LinearGradient as SvgLinearGradient, Path, Polygon, Rect, Stop, Text as SvgText } from 'react-native-svg'
import GoonaIcon from '../components/ui/GoonaIcon'
import BottomDock from '../components/navigation/BottomDock'
import { Icons } from '../shared/icons'
import { useFarmChatStore } from '../store/useFarmChatStore'

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

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
    id: 'w4', initials: 'FO', name: 'Funmi Ojo', role: 'Farmhand', status: 'onsite', online: true,
    lastLog: 'Last log 2 mins ago', location: 'Fish Pond', zone: 'Fish Pond', battery: 91,
    phone: '+2348010000004', chatUserId: 'funmi', arrived: '06:50', checkedOut: '--', onsiteToday: '6h 05m',
    schedule: '07:00-16:00', attendanceRate: 97, punctuality: 92, safetyScore: 95, tasksCompleted: 76,
    tasks: [
      { title: 'Check pond water level', due: '08:00', status: 'done', metric: 'Water' },
      { title: 'Fish feed observation', due: '13:00', status: 'active', metric: 'Feed' },
    ],
    performance: [
      { label: 'Water checks', value: '6', delta: 'today', icon: 'droplets', color: C.blue },
      { label: 'Feed logs', value: '4', delta: 'synced', icon: 'wheat', color: C.green },
      { label: 'Safety', value: '95%', delta: 'stable', icon: 'shieldCheck', color: C.green2 },
      { label: 'Attendance', value: '97%', delta: '+2%', icon: 'clock', color: C.amber },
    ],
    logs: [
      { title: 'Entered farm boundary', time: '06:50' },
      { title: 'Entered Fish Pond', time: '07:04', detail: 'Geofence check-in' },
      { title: 'Water condition submitted', time: '10:18', detail: 'Pond A: normal' },
    ],
    week: [{ day: 'MON', hours: '7.6h' }, { day: 'TUE', hours: '8.0h' }, { day: 'WED', hours: '7.8h' }, { day: 'THU', hours: '7.4h' }, { day: 'FRI', hours: '6.5h' }],
  },
  {
    id: 'w5', initials: 'TA', name: 'Tunde Adebayo', role: 'Security', status: 'onsite', online: true,
    lastLog: 'Last log 5 mins ago', location: 'Main Gate', zone: 'Main Gate', battery: 66,
    phone: '+2348010000005', chatUserId: 'tunde-worker', arrived: '06:30', checkedOut: '--', onsiteToday: '6h 45m',
    schedule: '06:30-18:00', attendanceRate: 99, punctuality: 96, safetyScore: 98, tasksCompleted: 52,
    tasks: [
      { title: 'Perimeter checkpoint', due: '09:00', status: 'done', metric: 'Security' },
      { title: 'Visitor log review', due: '15:00', status: 'active', metric: 'Records' },
    ],
    performance: [
      { label: 'Patrols', value: '5', delta: 'today', icon: 'shield', color: C.green },
      { label: 'Incidents', value: '0', delta: 'clean', icon: 'shieldCheck', color: C.green2 },
      { label: 'Response', value: '98%', delta: '+1%', icon: 'radio', color: C.blue },
      { label: 'Attendance', value: '99%', delta: 'steady', icon: 'clock', color: C.amber },
    ],
    logs: [
      { title: 'Entered farm boundary', time: '06:30' },
      { title: 'Entered Main Gate', time: '06:36' },
      { title: 'Perimeter checkpoint completed', time: '12:38', detail: 'West gate verified', tone: 'ok' },
    ],
    week: [{ day: 'MON', hours: '8.4h' }, { day: 'TUE', hours: '8.5h' }, { day: 'WED', hours: '8.2h' }, { day: 'THU', hours: '8.6h' }, { day: 'FRI', hours: '6.9h' }],
  },
  {
    id: 'w6', initials: 'BN', name: 'Blessing Nwosu', role: 'Farmhand', status: 'offsite', online: false,
    lastLog: 'Last seen 18 mins ago', location: 'Off farm route', zone: 'Off farm', battery: 52,
    phone: '+2348010000006', chatUserId: 'blessing', arrived: '06:42', checkedOut: '12:25', onsiteToday: '5h 43m',
    schedule: '07:00-16:00', attendanceRate: 93, punctuality: 89, safetyScore: 92, tasksCompleted: 41,
    tasks: [
      { title: 'Supply run receipt', due: '13:30', status: 'active', metric: 'Inventory' },
      { title: 'Return gate check-in', due: '14:00', status: 'pending', metric: 'Attendance' },
    ],
    performance: [
      { label: 'Supply runs', value: '3', delta: 'week', icon: 'truck', color: C.blue },
      { label: 'Records', value: '9', delta: 'today', icon: 'fileText', color: C.green },
      { label: 'Safety', value: '92%', delta: 'stable', icon: 'shieldCheck', color: C.green2 },
      { label: 'Attendance', value: '93%', delta: '-1%', icon: 'clock', color: C.amber },
    ],
    logs: [
      { title: 'Entered farm boundary', time: '06:42' },
      { title: 'Entered Poultry House B', time: '07:16' },
      { title: 'Exited farm boundary', time: '12:25', detail: 'Supply run', tone: 'warn' },
    ],
    week: [{ day: 'MON', hours: '7.5h' }, { day: 'TUE', hours: '7.2h' }, { day: 'WED', hours: '7.9h' }, { day: 'THU', hours: '6.8h' }, { day: 'FRI', hours: '5.7h' }],
  },
  {
    id: 'w7', initials: 'SE', name: 'Segun Eze', role: 'Vet Assistant', status: 'onsite', online: true,
    lastLog: 'Last log 3 mins ago', location: 'Poultry House B', zone: 'Poultry House B', battery: 78,
    phone: '+2348010000007', chatUserId: 'segun', arrived: '06:52', checkedOut: '--', onsiteToday: '6h 09m',
    schedule: '07:00-16:00', attendanceRate: 96, punctuality: 94, safetyScore: 93, tasksCompleted: 58,
    tasks: [
      { title: 'Vaccination spot check', due: '09:30', status: 'done', metric: 'Health' },
      { title: 'Poultry House B review', due: '14:30', status: 'active', metric: 'Health' },
    ],
    performance: [
      { label: 'Health checks', value: '10', delta: 'today', icon: 'heart', color: C.red },
      { label: 'Treatment sync', value: '96%', delta: '+2%', icon: 'pill', color: C.blue },
      { label: 'Safety', value: '93%', delta: 'stable', icon: 'shieldCheck', color: C.green },
      { label: 'Attendance', value: '96%', delta: '+1%', icon: 'clock', color: C.amber },
    ],
    logs: [
      { title: 'Entered farm boundary', time: '06:52' },
      { title: 'Entered Poultry House B', time: '07:06', detail: 'Geofence check-in' },
      { title: 'Health record submitted', time: '09:48', detail: 'Batch B: normal' },
    ],
    week: [{ day: 'MON', hours: '7.7h' }, { day: 'TUE', hours: '7.6h' }, { day: 'WED', hours: '8.0h' }, { day: 'THU', hours: '7.8h' }, { day: 'FRI', hours: '6.6h' }],
  },
  {
    id: 'w8', initials: 'MJ', name: 'Mary James', role: 'Store Clerk', status: 'signal', online: false,
    lastLog: 'Signal lost 12 mins ago', location: 'Storage Facility', zone: 'Storage Facility', battery: 11,
    phone: '+2348010000008', chatUserId: 'mary-workforce', arrived: '06:57', checkedOut: '--', onsiteToday: '5h 58m',
    schedule: '07:00-16:00', attendanceRate: 95, punctuality: 91, safetyScore: 90, tasksCompleted: 33,
    tasks: [
      { title: 'Inventory count', due: '11:00', status: 'done', metric: 'Inventory' },
      { title: 'Charge tracking device', due: 'now', status: 'active', metric: 'Signal' },
    ],
    performance: [
      { label: 'Inventory sync', value: '88%', delta: 'offline', icon: 'clipboardList', color: C.blue },
      { label: 'Battery', value: '11%', delta: 'critical', icon: 'battery', color: C.red },
      { label: 'Records', value: '12', delta: 'today', icon: 'fileText', color: C.green },
      { label: 'Safety', value: '90%', delta: 'review', icon: 'shieldCheck', color: C.amber },
    ],
    logs: [
      { title: 'Entered farm boundary', time: '06:57' },
      { title: 'Entered Storage Facility', time: '07:10' },
      { title: 'GPS signal lost', time: '12:41', detail: 'Last known Storage Facility', tone: 'warn' },
    ],
    week: [{ day: 'MON', hours: '7.3h' }, { day: 'TUE', hours: '7.5h' }, { day: 'WED', hours: '7.1h' }, { day: 'THU', hours: '7.2h' }, { day: 'FRI', hours: '6.0h' }],
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
  {
    id: 'w10', initials: 'IF', name: 'Ifeanyi Folarin', role: 'Supervisor', status: 'onsite', online: true,
    lastLog: 'Online now', location: 'Admin Block', zone: 'Admin Block', battery: 94,
    phone: '+2348010000010', chatUserId: 'ifeanyi', arrived: '06:40', checkedOut: '--', onsiteToday: '6h 22m',
    schedule: '07:00-17:00', attendanceRate: 99, punctuality: 97, safetyScore: 99, tasksCompleted: 121,
    tasks: [
      { title: 'Review daily operations', due: '12:00', status: 'active', metric: 'Reports' },
      { title: 'Approve restricted-zone exception', due: 'now', status: 'pending', metric: 'Safety' },
    ],
    performance: [
      { label: 'Approvals', value: '7', delta: 'today', icon: 'clipboardCheck', color: C.green },
      { label: 'Team coverage', value: '100%', delta: 'live', icon: 'users', color: C.blue },
      { label: 'Safety', value: '99%', delta: 'clean', icon: 'shieldCheck', color: C.green2 },
      { label: 'Attendance', value: '99%', delta: '+1%', icon: 'clock', color: C.amber },
    ],
    logs: [
      { title: 'Entered farm boundary', time: '06:40' },
      { title: 'Entered Admin Block', time: '06:48' },
      { title: 'Operations review opened', time: '11:55', detail: 'Team summary checked', tone: 'ok' },
    ],
    week: [{ day: 'MON', hours: '8.2h' }, { day: 'TUE', hours: '8.3h' }, { day: 'WED', hours: '8.1h' }, { day: 'THU', hours: '8.4h' }, { day: 'FRI', hours: '6.8h' }],
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
function useReduceMotionPreference() {
  const [reduced, setReduced] = React.useState(false)
  React.useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduced)
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced)
    return () => sub.remove()
  }, [])
  return reduced
}
function PremiumRouteMap({ worker, onRecenter }: { worker: WorkerDetail; onRecenter: () => void }) {
  const reducedMotion = useReduceMotionPreference()
  const pulse = useSharedValue(0)
  const move = useSharedValue(0)
  const zone = worker.location
  React.useEffect(() => {
    if (reducedMotion) {
      pulse.value = 0
      move.value = 0
      return
    }
    pulse.value = withRepeat(withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }), -1, false)
    move.value = withRepeat(withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.ease) }), -1, true)
  }, [move, pulse, reducedMotion])
  const pinProps = useAnimatedProps(() => ({ cx: interpolate(move.value, [0, 1], [294, 306]), cy: interpolate(move.value, [0, 1], [135, 127]) }))
  const ringA = useAnimatedProps(() => ({ cx: interpolate(move.value, [0, 1], [294, 306]), cy: interpolate(move.value, [0, 1], [135, 127]), r: interpolate(pulse.value, [0, 1], [7, 27]), opacity: interpolate(pulse.value, [0, 1], [.34, 0]) }))
  const ringB = useAnimatedProps(() => ({ cx: interpolate(move.value, [0, 1], [294, 306]), cy: interpolate(move.value, [0, 1], [135, 127]), r: interpolate(pulse.value, [0, 1], [14, 38]), opacity: interpolate(pulse.value, [0, 1], [.2, 0]) }))
  const isCurrent = (name: string) => zone.toLowerCase().includes(name.toLowerCase())
  return (
    <View style={s.liveMap}>
      <Svg width="100%" height="100%" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid meet">
        <Defs>
          <SvgLinearGradient id="routeGrad" x1="58" y1="170" x2="306" y2="127" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={C.green2} />
            <Stop offset=".55" stopColor={C.green} />
            <Stop offset="1" stopColor={C.blue} />
          </SvgLinearGradient>
          <SvgLinearGradient id="fieldBg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#EEF6E8" />
            <Stop offset="1" stopColor="#DCECD4" />
          </SvgLinearGradient>
        </Defs>
        <Rect x="0" y="0" width="400" height="250" rx="18" fill="url(#fieldBg)" />
        {[50, 100, 150, 200, 250, 300, 350].map((x) => <Line key={'vx' + x} x1={x} y1="0" x2={x} y2="250" stroke="#CFE2C8" strokeWidth="1" opacity=".42" />)}
        {[42, 84, 126, 168, 210].map((y) => <Line key={'hy' + y} x1="0" y1={y} x2="400" y2={y} stroke="#CFE2C8" strokeWidth="1" opacity=".38" />)}
        <Polygon points="35,24 362,18 374,106 338,226 73,229 20,116" fill="rgba(67,160,71,.045)" stroke={C.green} strokeWidth="2.6" strokeDasharray="8 7" strokeLinecap="round" strokeLinejoin="round" />
        <G opacity=".18"><Path d="M60 80h285M44 160h288" stroke="#fff" strokeWidth="16" strokeLinecap="round" /></G>
        <G>
          <Rect x="72" y="54" width="105" height="62" rx="8" fill={isCurrent('Poultry House A') ? '#D9F0D1' : '#CFE5C9'} stroke={isCurrent('Poultry House A') ? C.green : '#B5D7AE'} strokeWidth={isCurrent('Poultry House A') ? 2.8 : 1.4} />
          <SvgText x="84" y="84" fontSize="12" fontWeight="700" fill={C.green}>Poultry House A</SvgText>
          <Rect x="196" y="48" width="100" height="68" rx="8" fill={isCurrent('Poultry House B') ? '#D9F0D1' : '#CFE5C9'} stroke={isCurrent('Poultry House B') ? C.green : '#B5D7AE'} strokeWidth={isCurrent('Poultry House B') ? 2.8 : 1.4} />
          <SvgText x="207" y="82" fontSize="12" fontWeight="700" fill={C.green}>Poultry House B</SvgText>
          <Rect x="76" y="154" width="86" height="44" rx="8" fill={isCurrent('Hatchery') ? '#D9F0D1' : '#CFE5C9'} stroke={isCurrent('Hatchery') ? C.green : '#B5D7AE'} strokeWidth={isCurrent('Hatchery') ? 2.8 : 1.4} />
          <SvgText x="94" y="181" fontSize="12" fontWeight="700" fill={C.green}>Hatchery</SvgText>
          <Rect x="190" y="147" width="108" height="58" rx="8" fill={isCurrent('Feed Warehouse') ? '#DDEDF8' : '#D8E8F4'} stroke={isCurrent('Feed Warehouse') ? C.blue : '#B8D3E6'} strokeWidth={isCurrent('Feed Warehouse') ? 2.8 : 1.4} />
          <SvgText x="205" y="179" fontSize="12" fontWeight="700" fill={C.blue}>Feed Warehouse</SvgText>
          <Rect x="302" y="158" width="54" height="38" rx="8" fill={isCurrent('Fish Pond') ? '#D9F0D1' : '#CFE5C9'} stroke={isCurrent('Fish Pond') ? C.green : '#B5D7AE'} strokeWidth={isCurrent('Fish Pond') ? 2.8 : 1.4} />
          <SvgText x="310" y="182" fontSize="11" fontWeight="700" fill={C.green}>Fish Pond</SvgText>
          <Rect x="304" y="91" width="50" height="49" rx="7" fill={isCurrent('Chemical Storage') ? '#F6D5D1' : '#EBD9C8'} stroke={isCurrent('Chemical Storage') ? C.red : '#E7B2A4'} strokeWidth={isCurrent('Chemical Storage') ? 2.8 : 1.4} />
          <SvgText x="309" y="116" fontSize="10.5" fontWeight="700" fill={C.red}>Medicine</SvgText>
        </G>
        <Path d="M58 174 C95 174, 118 170, 148 168 S203 158, 226 151 S270 146, 306 127" stroke={C.green} strokeWidth="10" opacity=".12" fill="none" strokeLinecap="round" />
        <Path d="M58 174 C95 174, 118 170, 148 168 S203 158, 226 151 S270 146, 306 127" stroke="url(#routeGrad)" strokeWidth="4" fill="none" strokeLinecap="round" />
        {[
          [58, 174, .42],
          [92, 173, .52],
          [128, 169, .64],
          [168, 164, .75],
          [226, 151, .88],
          [274, 142, 1],
        ].map(([x, y, opacity], i) => <Circle key={'crumb' + i} cx={x} cy={y} r="4.5" fill="#fff" stroke={i > 3 ? C.blue : C.green} strokeWidth="2" opacity={opacity} />)}
        {!reducedMotion ? <><AnimatedCircle animatedProps={ringB} fill="none" stroke={C.green2} strokeWidth="2" /><AnimatedCircle animatedProps={ringA} fill="none" stroke={C.green} strokeWidth="2.5" /></> : null}
        <AnimatedCircle animatedProps={pinProps} r="8" fill={statusColor(worker.status)} stroke="#fff" strokeWidth="3" />
        <Rect x="318" y="105" width="46" height="23" rx="11.5" fill="rgba(255,255,255,.92)" stroke="#DCE8D8" />
        <Circle cx="330" cy="116.5" r="3.5" fill={statusColor(worker.status)} />
        <SvgText x="338" y="120" fontSize="10" fontWeight="800" fill={C.green}>Live</SvgText>
      </Svg>
      <TouchableOpacity activeOpacity={0.75} onPress={onRecenter} style={s.mapRecenter} accessibilityRole="button" accessibilityLabel="Open live map">
        <GoonaIcon icon={Icons.target} size={15} color={C.ink} />
      </TouchableOpacity>
      <View style={s.mapLegend}>
        <View style={[s.legendDot, { backgroundColor: C.green2 }]} /><Text style={s.legendText}>Operational</Text>
        <View style={[s.legendDot, { backgroundColor: C.red }]} /><Text style={s.legendText}>Restricted</Text>
        <View style={[s.legendDot, { backgroundColor: C.blue }]} /><Text style={s.legendText}>Route</Text>
      </View>
    </View>
  )
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
  const callWorker = React.useCallback(async () => {
    const url = 'tel:' + worker.phone
    const supported = await Linking.canOpenURL(url)
    if (supported) { await Linking.openURL(url); return }
    Alert.alert('Call unavailable', 'Your device cannot start a phone call right now.')
  }, [worker.phone])
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
        <View style={s.actions}><ActionButton icon={Icons.phone} label="Call" onPress={callWorker} /><ActionButton icon={Icons.messageCircle} label="Message" onPress={openDm} badge={conv?.unreadCount} /><ActionButton icon={Icons.calendar} label="View week" onPress={() => Alert.alert('Weekly attendance', worker.name + ' has logged ' + worker.week.map((d) => d.hours).join(', ') + ' this week.')} /><ActionButton icon={Icons.mapPin} label="Live map" onPress={viewLiveMap} /></View>
        <Section title="Today's activity" tag={worker.checkedOut === '--' ? 'Live route' : 'Complete'} />
        <PremiumRouteMap worker={worker} onRecenter={viewLiveMap} />
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
  mapRecenter: { position: 'absolute', right: 10, top: 10, width: 34, height: 34, borderRadius: 12, backgroundColor: 'rgba(255,255,255,.92)', borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center', shadowColor: '#142819', shadowOpacity: .08, shadowRadius: 8, elevation: 2 },
  mapLegend: { position: 'absolute', left: 10, bottom: 10, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,.9)', borderRadius: 12, borderWidth: 1, borderColor: C.line, paddingHorizontal: 8, paddingVertical: 6 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendText: { fontSize: 8.5, color: C.mut, fontWeight: '800' },
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

