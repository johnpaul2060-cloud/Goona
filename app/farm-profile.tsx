import React, { useState, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, Pressable, ScrollView,
  StyleSheet, Dimensions, Alert, Modal,
} from 'react-native'
import Svg, { Path } from 'react-native-svg'
import GoonaIcon from '../components/ui/GoonaIcon'
import { Icons } from '../shared/icons'
import { StatusBar } from 'expo-status-bar'
import { router } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence,
  withTiming, withSpring, FadeInUp,
} from 'react-native-reanimated'
import BottomDock from '../components/navigation/BottomDock'

const { width: SCREEN_W } = Dimensions.get('window')

/* ─── Helpers ─── */
function usePressScale() {
  const scale = useSharedValue(1)
  const opacity = useSharedValue(1)
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: opacity.value }))
  return {
    style, onPressIn: () => { scale.value = withSpring(0.96, { damping: 15, stiffness: 200 }); opacity.value = withTiming(0.85, { duration: 80 }) },
    onPressOut: () => { scale.value = withSpring(1, { damping: 15, stiffness: 200 }); opacity.value = withTiming(1, { duration: 100 }) },
  }
}

function PulseDot({ color = '#22C55E', size = 5 }: { color?: string; size?: number }) {
  const opacity = useSharedValue(1)
  useEffect(() => { opacity.value = withRepeat(withSequence(withTiming(0.3, { duration: 1800 }), withTiming(1, { duration: 1800 })), -1, true) }, [])
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }))
  return <Animated.View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }, style]} />
}

function WorkerAvatar({ initials, online, status }: { initials: string; online: boolean; status?: 'active' | 'idle' | 'emergency' | 'offline' }) {
  const dotColor = status === 'emergency' ? '#EF4444' : status === 'idle' ? '#F59E0B' : online ? '#22C55E' : '#94A3B8'
  return (
    <View style={{ width: 40, height: 40, position: 'relative', marginRight: 12 }}>
      <LinearGradient colors={['#0F172A', '#00695C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>{initials}</Text>
      </LinearGradient>
      <View style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: 'white', backgroundColor: dotColor, shadowColor: dotColor, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 4, elevation: 3 }} />
    </View>
  )
}

/* ─── Workers ─── */
interface Worker {
  id: string; initials: string; name: string; role: string; online: boolean
  status: 'active' | 'idle' | 'emergency' | 'offline'; location: string; zone: string
  battery: number; lastSeen: string; checkIn: string; checkOut: string
  tags: string[]; email: string; phone: string; permissions: string[]
  assignedZones: string[]; safetyScore: number; attendanceRate: number
  punctuality: number; tasksCompleted: number
}

const WORKERS: Worker[] = [
  { id: 'w1', initials: 'CO', name: 'Chinedu Okoro', role: 'Senior Farmhand', online: true, status: 'active', location: 'Poultry House A', zone: 'Poultry House A', battery: 87, lastSeen: '2 mins ago', checkIn: '06:12 AM', checkOut: '--', tags: ['Feed', 'Mortality', 'Records'], email: 'chinedu@goona.ag', phone: '+234 801 234 5678', permissions: ['Feed Access', 'Mortality Records', 'Batch Data'], assignedZones: ['Poultry House A', 'Poultry House B', 'Feed Warehouse'], safetyScore: 96, attendanceRate: 98, punctuality: 95, tasksCompleted: 134 },
  { id: 'w2', initials: 'AF', name: 'Aminat Fashola', role: 'Feed Specialist', online: true, status: 'active', location: 'Feed Warehouse', zone: 'Feed Warehouse', battery: 72, lastSeen: '1 min ago', checkIn: '06:30 AM', checkOut: '--', tags: ['Feed', 'Inventory', 'Records'], email: 'aminat@goona.ag', phone: '+234 802 345 6789', permissions: ['Feed Access', 'Inventory', 'Records'], assignedZones: ['Feed Warehouse', 'Storage Facility'], safetyScore: 94, attendanceRate: 100, punctuality: 98, tasksCompleted: 89 },
  { id: 'w3', initials: 'KO', name: 'Kola Ogunleye', role: 'Veterinary Assistant', online: false, status: 'idle', location: 'Hatchery', zone: 'Hatchery', battery: 34, lastSeen: '4h ago', checkIn: '06:45 AM', checkOut: '10:30 AM', tags: ['Health', 'Mortality', 'Records'], email: 'kola@goona.ag', phone: '+234 803 456 7890', permissions: ['Health Records', 'Treatment'], assignedZones: ['Hatchery', 'Poultry House B'], safetyScore: 91, attendanceRate: 94, punctuality: 88, tasksCompleted: 67 },
  { id: 'w4', initials: 'FO', name: 'Funmi Ojo', role: 'Farmhand', online: true, status: 'active', location: 'Fish Pond', zone: 'Fish Pond', battery: 91, lastSeen: 'just now', checkIn: '06:15 AM', checkOut: '--', tags: ['Feeding', 'Water Quality'], email: 'funmi@goona.ag', phone: '+234 804 567 8901', permissions: ['Feeding', 'Water Monitoring'], assignedZones: ['Fish Pond'], safetyScore: 88, attendanceRate: 96, punctuality: 92, tasksCompleted: 45 },
  { id: 'w5', initials: 'TA', name: 'Tunde Adebayo', role: 'Security', online: true, status: 'active', location: 'Main Gate', zone: 'Entry Point', battery: 66, lastSeen: '5 mins ago', checkIn: '06:00 AM', checkOut: '--', tags: ['Patrol', 'Access Control'], email: 'tunde@goona.ag', phone: '+234 805 678 9012', permissions: ['Security', 'Patrol Routes', 'Access Control'], assignedZones: ['Main Gate', 'Perimeter', 'Storage Facility'], safetyScore: 100, attendanceRate: 100, punctuality: 100, tasksCompleted: 212 },
  { id: 'w6', initials: 'BI', name: 'Bisi Ige', role: 'Farmhand', online: false, status: 'offline', location: '--', zone: '--', battery: 12, lastSeen: 'yesterday 5PM', checkIn: '06:20 AM', checkOut: '05:00 PM', tags: ['General', 'Cleaning'], email: 'bisi@goona.ag', phone: '+234 806 789 0123', permissions: ['General Access'], assignedZones: ['Poultry House A', 'Poultry House B'], safetyScore: 85, attendanceRate: 88, punctuality: 80, tasksCompleted: 23 },
  { id: 'w7', initials: 'SE', name: 'Segun Eze', role: 'Veterinary Assistant', online: true, status: 'active', location: 'Poultry House B', zone: 'Poultry House B', battery: 78, lastSeen: '3 mins ago', checkIn: '07:00 AM', checkOut: '--', tags: ['Health', 'Vaccination'], email: 'segun@goona.ag', phone: '+234 807 890 1234', permissions: ['Health Records', 'Treatment', 'Vaccination'], assignedZones: ['Poultry House B', 'Hatchery'], safetyScore: 93, attendanceRate: 92, punctuality: 85, tasksCompleted: 56 },
  { id: 'w8', initials: 'CH', name: 'Chioma Henry', role: 'Feed Specialist', online: false, status: 'offline', location: '--', zone: '--', battery: 5, lastSeen: 'yesterday 6PM', checkIn: '06:10 AM', checkOut: '06:00 PM', tags: ['Feed', 'Mixing'], email: 'chioma@goona.ag', phone: '+234 808 901 2345', permissions: ['Feed Access', 'Mixing'], assignedZones: ['Feed Warehouse'], safetyScore: 90, attendanceRate: 90, punctuality: 86, tasksCompleted: 34 },
  { id: 'w9', initials: 'DE', name: 'Dele Akin', role: 'Farmhand', online: true, status: 'active', location: 'Storage Facility', zone: 'Storage Facility', battery: 55, lastSeen: '8 mins ago', checkIn: '06:35 AM', checkOut: '--', tags: ['Inventory', 'Cleaning'], email: 'dele@goona.ag', phone: '+234 809 012 3456', permissions: ['General Access', 'Inventory'], assignedZones: ['Storage Facility', 'Feed Warehouse'], safetyScore: 87, attendanceRate: 91, punctuality: 83, tasksCompleted: 19 },
  { id: 'w10', initials: 'IF', name: 'Ifeanyi Folarin', role: 'Supervisor', online: true, status: 'active', location: 'Office', zone: 'Admin Block', battery: 94, lastSeen: 'just now', checkIn: '06:00 AM', checkOut: '--', tags: ['Oversight', 'Reports'], email: 'ifeanyi@goona.ag', phone: '+234 810 123 4567', permissions: ['Full Access', 'Supervisor', 'Reports'], assignedZones: ['All Zones'], safetyScore: 98, attendanceRate: 100, punctuality: 99, tasksCompleted: 178 },
  { id: 'w11', initials: 'NO', name: 'Ngozi Okafor', role: 'Farmhand', online: true, status: 'idle', location: 'Break Room', zone: 'Admin Block', battery: 45, lastSeen: '15 mins ago', checkIn: '06:50 AM', checkOut: '--', tags: ['General', 'Cleaning'], email: 'ngozi@goona.ag', phone: '+234 811 234 5678', permissions: ['General Access'], assignedZones: ['Poultry House A'], safetyScore: 82, attendanceRate: 86, punctuality: 78, tasksCompleted: 12 },
  { id: 'w12', initials: 'AD', name: 'Adaobi Duru', role: 'Farmhand', online: false, status: 'offline', location: '--', zone: '--', battery: 0, lastSeen: 'yesterday 4PM', checkIn: '06:15 AM', checkOut: '04:30 PM', tags: ['General'], email: 'adaobi@goona.ag', phone: '+234 812 345 6789', permissions: ['General Access'], assignedZones: ['Poultry House A', 'Fish Pond'], safetyScore: 84, attendanceRate: 82, punctuality: 75, tasksCompleted: 8 },
]

/* ─── Attendance ─── */
interface AttendanceRecord {
  id: string; workerId: string; name: string; date: string; checkIn: string
  checkOut: string; status: 'present' | 'absent' | 'late' | 'early' | 'excused'
  zone: string; duration: string
}

function generateAttendance(): AttendanceRecord[] {
  const statuses: AttendanceRecord['status'][] = ['present', 'present', 'present', 'present', 'present', 'present', 'present', 'present', 'present', 'absent', 'late', 'early']
  return WORKERS.map((w, i) => ({
    id: `att-${i}`, workerId: w.id, name: w.name,
    date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    checkIn: w.checkIn, checkOut: w.checkOut,
    status: statuses[i] || 'present',
    zone: w.zone || '--',
    duration: w.checkOut !== '--' ? `${(parseInt(w.checkOut.split(':')[0]) - parseInt(w.checkIn.split(':')[0])).toString()}h` : 'Active',
  }))
}

const ATTENDANCE = generateAttendance()

/* ─── Zones & Geofencing ─── */
interface Zone {
  id: string; name: string; type: 'operational' | 'restricted' | 'boundary'
  color: string; workers: number; status: 'safe' | 'alert' | 'restricted'
}

const ZONES: Zone[] = [
  { id: 'z1', name: 'Poultry House A', type: 'operational', color: '#22C55E', workers: 2, status: 'safe' },
  { id: 'z2', name: 'Poultry House B', type: 'operational', color: '#22C55E', workers: 1, status: 'safe' },
  { id: 'z3', name: 'Hatchery', type: 'operational', color: '#22C55E', workers: 0, status: 'safe' },
  { id: 'z4', name: 'Feed Warehouse', type: 'operational', color: '#22C55E', workers: 1, status: 'safe' },
  { id: 'z5', name: 'Fish Pond', type: 'operational', color: '#22C55E', workers: 1, status: 'safe' },
  { id: 'z6', name: 'Storage Facility', type: 'operational', color: '#22C55E', workers: 1, status: 'safe' },
  { id: 'z7', name: 'Admin Block', type: 'operational', color: '#6366F1', workers: 2, status: 'safe' },
  { id: 'z8', name: 'Chemical Storage', type: 'restricted', color: '#EF4444', workers: 0, status: 'restricted' },
  { id: 'z9', name: 'Generator Room', type: 'restricted', color: '#EF4444', workers: 0, status: 'restricted' },
  { id: 'z10', name: 'Medicine Storage', type: 'restricted', color: '#EF4444', workers: 0, status: 'restricted' },
]

/* ─── SOS / Alerts ─── */
interface SosAlert {
  id: string; workerId: string; workerName: string; initials: string
  timestamp: string; location: string; zone: string; status: 'active' | 'acknowledged' | 'resolved'
  type: 'SOS' | 'restricted_entry' | 'incident' | 'safety'
}

const SOS_ALERTS: SosAlert[] = [
  { id: 'sa1', workerId: 'w3', workerName: 'Kola Ogunleye', initials: 'KO', timestamp: 'Today 09:15 AM', location: 'Hatchery — East Wing', zone: 'Hatchery', status: 'resolved', type: 'safety' },
  { id: 'sa2', workerId: 'w4', workerName: 'Funmi Ojo', initials: 'FO', timestamp: 'Today 07:45 AM', location: 'Fish Pond — Dock Area', zone: 'Fish Pond', status: 'active', type: 'SOS' },
  { id: 'sa3', workerId: 'w6', workerName: 'Bisi Ige', initials: 'BI', timestamp: 'Yesterday 02:30 PM', location: 'Chemical Storage', zone: 'Chemical Storage', status: 'acknowledged', type: 'restricted_entry' },
  { id: 'sa4', workerId: 'w9', workerName: 'Dele Akin', initials: 'DE', timestamp: 'Yesterday 11:00 AM', location: 'Feed Warehouse — Loading Bay', zone: 'Feed Warehouse', status: 'resolved', type: 'incident' },
]

/* ─── Patrols ─── */
interface Checkpoint {
  id: string; name: string; zone: string; status: 'completed' | 'missed' | 'pending'
  time?: string; verifiedBy?: string
}

interface PatrolRoute {
  id: string; name: string; officer: string; date: string; status: 'active' | 'completed' | 'failed'
  checkpoints: Checkpoint[]; completion: number
}

const PATROL_ROUTES: PatrolRoute[] = [
  {
    id: 'p1', name: 'Morning Perimeter', officer: 'Tunde Adebayo', date: 'Today 06:00 AM',
    status: 'active', completion: 75,
    checkpoints: [
      { id: 'cp1', name: 'Main Gate', zone: 'Entry Point', status: 'completed', time: '06:05 AM', verifiedBy: 'Tunde A.' },
      { id: 'cp2', name: 'Poultry House A', zone: 'Poultry House A', status: 'completed', time: '06:20 AM', verifiedBy: 'Tunde A.' },
      { id: 'cp3', name: 'Feed Warehouse', zone: 'Feed Warehouse', status: 'completed', time: '06:35 AM', verifiedBy: 'Tunde A.' },
      { id: 'cp4', name: 'Chemical Storage', zone: 'Chemical Storage', status: 'missed' },
      { id: 'cp5', name: 'Generator Room', zone: 'Generator Room', status: 'pending' },
      { id: 'cp6', name: 'Fish Pond', zone: 'Fish Pond', status: 'pending' },
    ],
  },
  {
    id: 'p2', name: 'Evening Rounds', officer: 'Tunde Adebayo', date: 'Yesterday 06:00 PM',
    status: 'completed', completion: 100,
    checkpoints: [
      { id: 'cp7', name: 'Main Gate', zone: 'Entry Point', status: 'completed', time: '06:02 PM', verifiedBy: 'Tunde A.' },
      { id: 'cp8', name: 'Hatchery', zone: 'Hatchery', status: 'completed', time: '06:18 PM', verifiedBy: 'Tunde A.' },
      { id: 'cp9', name: 'Storage Facility', zone: 'Storage Facility', status: 'completed', time: '06:30 PM', verifiedBy: 'Tunde A.' },
      { id: 'cp10', name: 'Admin Block', zone: 'Admin Block', status: 'completed', time: '06:42 PM', verifiedBy: 'Tunde A.' },
    ],
  },
]

/* ─── Tab system ─── */
type WfTabType = 'overview' | 'members' | 'attendance' | 'safety' | 'patrols' | 'analytics'

interface TabDef { key: WfTabType; label: string; icon: any }
const WF_TABS: TabDef[] = [
  { key: 'overview', label: 'Overview', icon: Icons.activity },
  { key: 'members', label: 'Members', icon: Icons.users },
  { key: 'attendance', label: 'Attendance', icon: Icons.clock },
  { key: 'safety', label: 'Safety', icon: Icons.shieldAlert },
  { key: 'patrols', label: 'Patrols', icon: Icons.target },
  { key: 'analytics', label: 'Analytics', icon: Icons.barChart3 },
]

function WfTabs({ active, onChange }: { active: WfTabType; onChange: (t: WfTabType) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingBottom: 4, marginBottom: 14 }}>
      {WF_TABS.map((tab) => {
        const isActive = active === tab.key
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 6,
              paddingVertical: 8, paddingHorizontal: 16, borderRadius: 50,
              backgroundColor: isActive ? '#00695C' : 'white', marginRight: 8,
              borderWidth: 1, borderColor: isActive ? '#00695C' : 'rgba(0,0,0,0.04)',
              shadowColor: isActive ? '#00695C' : '#000', shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isActive ? 0.2 : 0.02, shadowRadius: isActive ? 12 : 6, elevation: 1,
            }}
          >
            <GoonaIcon icon={tab.icon} size={14} color={isActive ? '#fff' : '#64748B'} />
            <Text style={{ fontSize: 12, fontWeight: '600', color: isActive ? '#fff' : '#475569' }}>{tab.label}</Text>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}

/* ─── KPI Card ─── */
function KpiCard({ label, value, icon, color, trend, subtitle }: {
  label: string; value: string; icon: any; color: string; trend?: { dir: 'up' | 'down'; pct: string }; subtitle?: string
}) {
  const { style, onPressIn, onPressOut } = usePressScale()
  return (
    <Pressable onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={[style, {
        flex: 1, backgroundColor: 'white', borderRadius: 20, padding: 16,
        borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03, shadowRadius: 16, elevation: 2,
      }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${color}12`, alignItems: 'center', justifyContent: 'center' }}>
            <GoonaIcon icon={icon} size={18} color={color} />
          </View>
          {trend && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, marginLeft: 'auto', backgroundColor: trend.dir === 'up' ? '#22C55E15' : '#EF444415', paddingVertical: 2, paddingHorizontal: 6, borderRadius: 50 }}>
              <GoonaIcon icon={trend.dir === 'up' ? TrendingUp : TrendingDown} size={10} color={trend.dir === 'up' ? '#22C55E' : '#EF4444'} />
              <Text style={{ fontSize: 9, fontWeight: '700', color: trend.dir === 'up' ? '#22C55E' : '#EF4444' }}>{trend.pct}</Text>
            </View>
          )}
        </View>
        <Text style={{ fontSize: 26, fontWeight: '800', color: '#1B1B1B', lineHeight: 30 }}>{value}</Text>
        <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{label}</Text>
        {subtitle && <Text style={{ fontSize: 10, color: '#94A3B8', marginTop: 1 }}>{subtitle}</Text>}
      </Animated.View>
    </Pressable>
  )
}

/* ─── OVERVIEW TAB ─── */
function OverviewTab() {
  const present = WORKERS.filter(w => w.online && w.status === 'active').length
  const absent = WORKERS.filter(w => !w.online).length
  const activeAlerts = SOS_ALERTS.filter(a => a.status === 'active').length
  const safetyScore = Math.round(WORKERS.reduce((s, w) => s + w.safetyScore, 0) / WORKERS.length)
  const attendanceRate = Math.round(WORKERS.reduce((s, w) => s + w.attendanceRate, 0) / WORKERS.length)

  const kpis = [
    { label: 'Total Workers', value: WORKERS.length.toString(), icon: Icons.users, color: '#00695C', trend: { dir: 'up' as const, pct: '+2' }, subtitle: '3 supervisors' },
    { label: 'Present Today', value: present.toString(), icon: Icons.userCheck, color: '#22C55E', trend: { dir: 'up' as const, pct: '+1' } },
    { label: 'Absent', value: absent.toString(), icon: Icons.userX, color: '#EF4444' },
    { label: 'Active Alerts', value: activeAlerts.toString(), icon: Icons.bell, color: '#F59E0B' },
    { label: 'Safety Score', value: `${safetyScore}%`, icon: Icons.shield, color: '#00695C', trend: { dir: 'up' as const, pct: '+3%' } },
    { label: 'Attendance Rate', value: `${attendanceRate}%`, icon: Icons.checkCircle, color: '#22C55E', trend: { dir: 'up' as const, pct: '+2%' } },
  ]

  return (
    <View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {kpis.map((kpi, i) => (
          <View key={kpi.label} style={{ width: (SCREEN_W - 58) / 2 }}>
            <Animated.View entering={FadeInUp.duration(400).delay(i * 60).springify()}>
              <KpiCard {...kpi} />
            </Animated.View>
          </View>
        ))}
      </View>

      <Animated.View entering={FadeInUp.duration(500).delay(400).springify()} style={{ marginTop: 20 }}>
        <LinearGradient colors={['#00695C', '#0F766E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{ borderRadius: 24, padding: 20, overflow: 'hidden' }}>
          <View style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.06)' }} />
          <View style={{ position: 'absolute', bottom: -20, left: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(174,234,0,0.06)' }} />
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 4 }}>WORKFORCE SUMMARY</Text>
          <View style={{ flexDirection: 'row', gap: 16, marginTop: 8 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 32, fontWeight: '800', color: '#AEEA00' }}>{present}/{WORKERS.length}</Text>
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Workers Present</Text>
            </View>
            <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.1)' }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 32, fontWeight: '800', color: '#fff' }}>{safetyScore}%</Text>
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Safety Score</Text>
            </View>
            <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.1)' }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 32, fontWeight: '800', color: '#fff' }}>{activeAlerts}</Text>
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Alerts</Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    </View>
  )
}

/* ─── WORKFORCE PROFILE MODAL ─── */
function WorkforceProfileModal({ worker, visible, onClose }: { worker: Worker | null; visible: boolean; onClose: () => void }) {
  if (!worker) return null
  const locColor = worker.status === 'active' ? '#22C55E' : worker.status === 'idle' ? '#F59E0B' : worker.status === 'emergency' ? '#EF4444' : '#94A3B8'

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <Animated.View entering={FadeInUp.duration(300).springify()} style={{
          backgroundColor: '#F8F9F5', borderTopLeftRadius: 40, borderTopRightRadius: 40,
          paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40, maxHeight: '85%',
        }}>
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB' }} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Profile Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <LinearGradient colors={['#0F172A', '#00695C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={{ width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 22 }}>{worker.initials}</Text>
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '800', fontSize: 20, color: '#1B1B1B' }}>{worker.name}</Text>
                <Text style={{ fontSize: 13, color: '#64748B' }}>{worker.role}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <PulseDot color={locColor} size={6} />
                  <Text style={{ fontSize: 12, fontWeight: '600', color: locColor, textTransform: 'capitalize' }}>{worker.status}</Text>
                  <Text style={{ fontSize: 12, color: '#94A3B8' }}>&bull; {worker.lastSeen}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' }}>
                <GoonaIcon icon={Icons.x} size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Location */}
            <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 16, marginBottom: 12 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#94A3B8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Current Location</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(0,105,92,0.08)', alignItems: 'center', justifyContent: 'center' }}>
                  <GoonaIcon icon={Icons.mapPin} size={18} color="#00695C" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '600', fontSize: 14, color: '#1B1B1B' }}>{worker.location}</Text>
                  <Text style={{ fontSize: 12, color: '#64748B' }}>Zone: {worker.zone}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: worker.battery > 20 ? '#22C55E15' : '#EF444415', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 50 }}>
                  <GoonaIcon icon={Icons.battery} size={12} color={worker.battery > 20 ? '#22C55E' : '#EF4444'} />
                  <Text style={{ fontSize: 11, fontWeight: '700', color: worker.battery > 20 ? '#22C55E' : '#EF4444' }}>{worker.battery}%</Text>
                </View>
              </View>
            </View>

            {/* Permissions */}
            <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 16, marginBottom: 12 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#94A3B8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Permissions</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {worker.permissions.map(p => (
                  <View key={p} style={{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: 50, backgroundColor: 'rgba(0,105,92,0.06)' }}>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: '#00695C' }}>{p}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Assigned Zones */}
            <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 16, marginBottom: 12 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#94A3B8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Assigned Zones</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {worker.assignedZones.map(z => (
                  <View key={z} style={{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: 50, backgroundColor: 'rgba(99,102,241,0.06)' }}>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: '#6366F1' }}>{z}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Performance */}
            <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 16, marginBottom: 12 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#94A3B8', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Performance Metrics</Text>
              {[
                { label: 'Safety Score', value: `${worker.safetyScore}%`, color: '#22C55E' },
                { label: 'Attendance Rate', value: `${worker.attendanceRate}%`, color: '#00695C' },
                { label: 'Punctuality', value: `${worker.punctuality}%`, color: '#6366F1' },
                { label: 'Tasks Completed', value: worker.tasksCompleted.toString(), color: '#F59E0B' },
              ].map(m => (
                <View key={m.label} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6 }}>
                  <Text style={{ flex: 1, fontSize: 13, color: '#475569' }}>{m.label}</Text>
                  <View style={{ width: 100, height: 6, borderRadius: 3, backgroundColor: '#F1F5F9', marginRight: 10 }}>
                    <View style={{ width: `${parseInt(m.value)}%`, height: 6, borderRadius: 3, backgroundColor: m.color }} />
                  </View>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#1B1B1B', minWidth: 40, textAlign: 'right' }}>{m.value}</Text>
                </View>
              ))}
            </View>

            {/* Contact */}
            <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 16, marginBottom: 12 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#94A3B8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Contact</Text>
              <Text style={{ fontSize: 13, color: '#475569' }}>{worker.email}</Text>
              <Text style={{ fontSize: 13, color: '#475569', marginTop: 2 }}>{worker.phone}</Text>
            </View>

            {/* Actions */}
            <Pressable
              onPress={() => { onClose(); Alert.alert('Live Location', `Tracking ${worker.name}'s live location on the farm map.\n\nFeature integrates with geofencing and real-time GPS.`) }}
              style={({ pressed }) => [{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                backgroundColor: '#00695C', borderRadius: 16, paddingVertical: 14,
                shadowColor: '#00695C', shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.2, shadowRadius: 20, elevation: 4,
              }, pressed && { opacity: 0.9 }]}
            >
              <GoonaIcon icon={Navigation} size={18} color="#fff" />
              <Text style={{ fontWeight: '700', fontSize: 14, color: '#fff' }}>View Live Location</Text>
            </Pressable>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  )
}

/* ─── MEMBERS TAB ─── */
function MembersTab({ onSelectWorker }: { onSelectWorker: (w: Worker) => void }) {
  const [search, setSearch] = useState('')
  const filtered = search.trim() ? WORKERS.filter(w => w.name.toLowerCase().includes(search.toLowerCase()) || w.role.toLowerCase().includes(search.toLowerCase())) : WORKERS

  return (
    <View>
      {/* Search */}
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)' }}>
        <GoonaIcon icon={Search} size={16} color="#94A3B8" />
        <Text style={{ flex: 1, marginLeft: 8, fontSize: 13, color: '#1B1B1B' }} onPress={() => Alert.alert('Search Workers', 'Search by name or role.')}>{search || 'Search workers...'}</Text>
        <Pressable onPress={() => Alert.alert('Filter', 'Filter by status, zone, or role.')}>
          <GoonaIcon icon={Filter} size={16} color="#94A3B8" />
        </Pressable>
      </View>

      {/* Online count */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <PulseDot size={6} />
        <Text style={{ fontSize: 12, fontWeight: '600', color: '#22C55E' }}>{WORKERS.filter(w => w.online).length} online</Text>
        <Text style={{ fontSize: 12, color: '#94A3B8' }}>&bull; {WORKERS.filter(w => !w.online).length} offline</Text>
      </View>

      {/* Worker cards */}
      {filtered.map((w, i) => {
        const { style, onPressIn, onPressOut } = usePressScale()
        const locColor = w.status === 'active' ? '#22C55E' : w.status === 'idle' ? '#F59E0B' : w.status === 'emergency' ? '#EF4444' : '#94A3B8'
        return (
          <Animated.View key={w.id} entering={FadeInUp.duration(400).delay(i * 50).springify()}>
            <Pressable
              onPress={() => onSelectWorker(w)}
              onPressIn={onPressIn}
              onPressOut={onPressOut}
            >
              <Animated.View style={[style, {
                flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 18,
                padding: 14, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)',
                shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.02, shadowRadius: 12, elevation: 1,
              }]}>
                <WorkerAvatar initials={w.initials} online={w.online} status={w.status} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '600', fontSize: 14, color: '#1B1B1B' }}>{w.name}</Text>
                  <Text style={{ fontSize: 12, color: '#64748B' }}>{w.role}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                      <GoonaIcon icon={Icons.mapPin} size={10} color="#94A3B8" />
                      <Text style={{ fontSize: 10, color: '#94A3B8' }}>{w.location}</Text>
                    </View>
                    <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#D1D5DB' }} />
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                      <GoonaIcon icon={Icons.battery} size={10} color={w.battery > 20 ? '#22C55E' : '#EF4444'} />
                      <Text style={{ fontSize: 10, color: '#94A3B8' }}>{w.battery}%</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                    <Text style={{ fontSize: 10, color: '#94A3B8' }}>In: {w.checkIn}</Text>
                    {w.checkOut !== '--' && <Text style={{ fontSize: 10, color: '#94A3B8' }}>Out: {w.checkOut}</Text>}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, marginLeft: 'auto' }}>
                      <PulseDot color={locColor} size={5} />
                      <Text style={{ fontSize: 10, color: locColor, textTransform: 'capitalize' }}>{w.status}</Text>
                    </View>
                  </View>
                </View>
                <Icons.chevronRight size={14} color="#94A3B8" strokeWidth={2} />
              </Animated.View>
            </Pressable>
          </Animated.View>
        )
      })}
    </View>
  )
}

/* ─── ATTENDANCE TAB ─── */
function AttendanceTab() {
  const present = ATTENDANCE.filter(a => a.status === 'present').length
  const absent = ATTENDANCE.filter(a => a.status === 'absent').length
  const late = ATTENDANCE.filter(a => a.status === 'late').length
  const early = ATTENDANCE.filter(a => a.status === 'early').length
  const rate = Math.round((present / ATTENDANCE.length) * 100)

  const metrics = [
    { label: 'Present', value: present.toString(), color: '#22C55E', icon: Icons.userCheck },
    { label: 'Absent', value: absent.toString(), color: '#EF4444', icon: Icons.userX },
    { label: 'Late', value: late.toString(), color: '#F59E0B', icon: Icons.clock },
    { label: 'Early Departure', value: early.toString(), color: '#6366F1', icon: Icons.flag },
  ]

  return (
    <View>
      {/* Metrics row */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
        {metrics.map((m, i) => (
          <Animated.View key={m.label} entering={FadeInUp.duration(400).delay(i * 60).springify()} style={{ flex: 1 }}>
            <View style={{
              backgroundColor: 'white', borderRadius: 16, padding: 12, alignItems: 'center',
              borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)',
              shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.02, shadowRadius: 8, elevation: 1,
            }}>
              <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: `${m.color}12`, alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                <GoonaIcon icon={m.icon} size={16} color={m.color} />
              </View>
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#1B1B1B' }}>{m.value}</Text>
              <Text style={{ fontSize: 9, color: '#94A3B8', marginTop: 1 }}>{m.label}</Text>
            </View>
          </Animated.View>
        ))}
      </View>

      {/* Rate */}
      <Animated.View entering={FadeInUp.duration(500).delay(250).springify()} style={{
        backgroundColor: 'white', borderRadius: 20, padding: 18, marginBottom: 16,
        borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.02, shadowRadius: 12, elevation: 1,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontWeight: '600', fontSize: 14, color: '#1B1B1B' }}>Attendance Rate</Text>
          <Text style={{ fontWeight: '800', fontSize: 28, color: rate >= 80 ? '#22C55E' : '#F59E0B' }}>{rate}%</Text>
        </View>
        <View style={{ width: '100%', height: 8, borderRadius: 4, backgroundColor: '#F1F5F9', marginTop: 8 }}>
          <View style={{ width: `${rate}%`, height: 8, borderRadius: 4, backgroundColor: rate >= 80 ? '#22C55E' : '#F59E0B' }} />
        </View>
        <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>Auto-generated from geofence activity</Text>
      </Animated.View>

      {/* Auto attendance note */}
      <Animated.View entering={FadeInUp.duration(500).delay(300).springify()}>
        <LinearGradient colors={['#E8F5E9', '#F0FDF4']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{ borderRadius: 18, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(46,125,50,0.06)' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <GoonaIcon icon={Radio} size={18} color="#2E7D32" />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '600', fontSize: 12, color: '#1F2937' }}>Auto Attendance Active</Text>
              <Text style={{ fontSize: 11, color: '#64748B' }}>Check-in/out is automatic based on geofence entry and exit.</Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Today's Log */}
      <Text style={{ fontWeight: '700', fontSize: 15, color: '#1B1B1B', marginBottom: 10 }}>Today's Log</Text>
      {ATTENDANCE.map((a, i) => {
        const statusColor = a.status === 'present' ? '#22C55E' : a.status === 'absent' ? '#EF4444' : a.status === 'late' ? '#F59E0B' : a.status === 'early' ? '#6366F1' : '#94A3B8'
        const statusLabel = a.status.charAt(0).toUpperCase() + a.status.slice(1)
        return (
          <Animated.View key={a.id} entering={FadeInUp.duration(300).delay(i * 30).springify()}
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 14, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)' }}>
            <WorkerAvatar initials={WORKERS.find(w => w.id === a.workerId)?.initials || ''} online={a.status === 'present' || a.status === 'late'} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '600', fontSize: 13, color: '#1B1B1B' }}>{a.name}</Text>
              <Text style={{ fontSize: 11, color: '#94A3B8' }}>{a.checkIn} — {a.checkOut} &bull; {a.zone}</Text>
            </View>
            <View style={{ paddingVertical: 3, paddingHorizontal: 10, borderRadius: 50, backgroundColor: `${statusColor}12` }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: statusColor }}>{statusLabel}</Text>
            </View>
          </Animated.View>
        )
      })}
    </View>
  )
}

/* ─── LOCATIONS TAB ─── */
function LocationsTab() {
  const [selectedZone, setSelectedZone] = useState<string | null>(null)
  const activeWorkers = WORKERS.filter(w => w.online)

  return (
    <View>
      {/* Map visualization */}
      <Animated.View entering={FadeInUp.duration(500).springify()} style={{
        backgroundColor: '#0F172A', borderRadius: 24, padding: 16, marginBottom: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1, shadowRadius: 24, elevation: 4,
      }}>
        {/* Grid dots */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.1 }}>
          {Array.from({ length: 30 }).map((_, i) => (
            <View key={i} style={{
              position: 'absolute', width: 2, height: 2, borderRadius: 1,
              backgroundColor: '#AEEA00',
              left: `${(i % 6) * 18 + 5}%`, top: `${Math.floor(i / 6) * 18 + 5}%`,
            }} />
          ))}
        </View>

        <Text style={{ fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.5)', marginBottom: 12, letterSpacing: 0.5 }}>WORKFORCE MAP</Text>

        {/* Zones grid */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
          {ZONES.filter(z => z.type === 'operational').map(z => (
            <Pressable
              key={z.id}
              onPress={() => setSelectedZone(selectedZone === z.id ? null : z.id)}
              style={[{
                paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12,
                backgroundColor: selectedZone === z.id ? z.color : 'rgba(255,255,255,0.06)',
                borderWidth: 1, borderColor: selectedZone === z.id ? z.color : 'rgba(255,255,255,0.08)',
              }]}
            >
              <Text style={{ fontSize: 11, fontWeight: '600', color: selectedZone === z.id ? '#fff' : 'rgba(255,255,255,0.7)' }}>{z.name}</Text>
              {z.workers > 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 }}>
                  <PulseDot size={4} />
                  <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>{z.workers} worker{z.workers > 1 ? 's' : ''}</Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>

        {/* Restricted zones */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
          {ZONES.filter(z => z.type === 'restricted').map(z => (
            <View key={z.id} style={{
              paddingVertical: 6, paddingHorizontal: 10, borderRadius: 12,
              backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <GoonaIcon icon={Icons.shieldAlert} size={10} color="#EF4444" />
                <Text style={{ fontSize: 10, fontWeight: '600', color: '#EF4444' }}>{z.name}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Legend */}
        <View style={{ flexDirection: 'row', gap: 16 }}>
          {[
            { label: 'Active', color: '#22C55E' },
            { label: 'Idle', color: '#F59E0B' },
            { label: 'Emergency', color: '#EF4444' },
            { label: 'Offline', color: '#94A3B8' },
          ].map(l => (
            <View key={l.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: l.color }} />
              <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>{l.label}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      {/* Active Workers */}
      <Text style={{ fontWeight: '700', fontSize: 15, color: '#1B1B1B', marginBottom: 10 }}>Live Workers</Text>
      {activeWorkers.map((w, i) => {
        const { style, onPressIn, onPressOut } = usePressScale()
        const locColor = w.status === 'active' ? '#22C55E' : w.status === 'idle' ? '#F59E0B' : '#EF4444'
        return (
          <Animated.View key={w.id} entering={FadeInUp.duration(300).delay(i * 40).springify()}>
            <Pressable
              onPressIn={onPressIn}
              onPressOut={onPressOut}
              onPress={() => Alert.alert(`${w.name}`, `Location: ${w.location}\nZone: ${w.zone}\nBattery: ${w.battery}%\nLast Update: ${w.lastSeen}\nCurrent Zone: ${w.zone}`)}
            >
              <Animated.View style={[style, {
                flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 16,
                padding: 12, marginBottom: 6, borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)',
              }]}>
                <WorkerAvatar initials={w.initials} online={w.online} status={w.status} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '600', fontSize: 13, color: '#1B1B1B' }}>{w.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 }}>
                    <GoonaIcon icon={Icons.mapPin} size={10} color="#64748B" />
                    <Text style={{ fontSize: 11, color: '#64748B' }}>{w.location}</Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 3 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <GoonaIcon icon={Icons.battery} size={11} color={w.battery > 20 ? '#22C55E' : '#EF4444'} />
                    <Text style={{ fontSize: 10, fontWeight: '600', color: '#64748B' }}>{w.battery}%</Text>
                  </View>
                  <PulseDot color={locColor} size={5} />
                </View>
              </Animated.View>
            </Pressable>
          </Animated.View>
        )
      })}
    </View>
  )
}

/* ─── SAFETY TAB ─── */
function SafetyTab() {
  const [sosFilter, setSosFilter] = useState<SosAlert['status'] | 'all'>('all')
  const filtered = sosFilter === 'all' ? SOS_ALERTS : SOS_ALERTS.filter(a => a.status === sosFilter)

  const activeSos = SOS_ALERTS.filter(a => a.status === 'active').length
  const restricted = SOS_ALERTS.filter(a => a.type === 'restricted_entry').length
  const incidents = SOS_ALERTS.filter(a => a.type === 'incident').length

  return (
    <View>
      {/* Summary */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
        {[
    { label: 'Active SOS', value: activeSos.toString(), color: '#EF4444', icon: Icons.alertTriangle },
    { label: 'Restricted Entries', value: restricted.toString(), color: '#F59E0B', icon: Icons.shieldAlert },
    { label: 'Incidents', value: incidents.toString(), color: '#6366F1', icon: Icons.alertOctagon },
        ].map((m, i) => (
          <Animated.View key={m.label} entering={FadeInUp.duration(400).delay(i * 60).springify()} style={{ flex: 1 }}>
            <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)' }}>
              <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: `${m.color}12`, alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                <GoonaIcon icon={m.icon} size={16} color={m.color} />
              </View>
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#1B1B1B' }}>{m.value}</Text>
              <Text style={{ fontSize: 9, color: '#94A3B8', marginTop: 1 }}>{m.label}</Text>
            </View>
          </Animated.View>
        ))}
      </View>

      {/* Restricted Zones */}
      <Animated.View entering={FadeInUp.duration(500).delay(200).springify()} style={{ marginBottom: 16 }}>
        <Text style={{ fontWeight: '700', fontSize: 15, color: '#1B1B1B', marginBottom: 8 }}>Restricted Zones</Text>
        {ZONES.filter(z => z.type === 'restricted').map(z => (
          <View key={z.id} style={{
            flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 14,
            padding: 12, marginBottom: 6, borderWidth: 1, borderColor: 'rgba(239,68,68,0.08)',
            borderLeftWidth: 3, borderLeftColor: '#EF4444',
          }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(239,68,68,0.08)', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
              <GoonaIcon icon={Icons.shieldAlert} size={18} color="#EF4444" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '600', fontSize: 13, color: '#1B1B1B' }}>{z.name}</Text>
              <Text style={{ fontSize: 11, color: '#94A3B8' }}>Authorized personnel only</Text>
            </View>
            <GoonaIcon icon={Icons.alertTriangle} size={14} color="#EF4444" />
          </View>
        ))}
      </Animated.View>

      {/* SOS Alerts */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <Text style={{ fontWeight: '700', fontSize: 15, color: '#1B1B1B' }}>SOS Alerts</Text>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {(['all', 'active', 'acknowledged', 'resolved'] as const).map(f => (
            <Pressable key={f} onPress={() => setSosFilter(f)}
              style={{ paddingVertical: 3, paddingHorizontal: 10, borderRadius: 50, backgroundColor: sosFilter === f ? '#00695C' : 'rgba(0,0,0,0.04)' }}>
              <Text style={{ fontSize: 9, fontWeight: '600', color: sosFilter === f ? '#fff' : '#64748B', textTransform: 'capitalize' }}>{f}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {filtered.map((alert, i) => {
        const statusColor = alert.status === 'active' ? '#EF4444' : alert.status === 'acknowledged' ? '#F59E0B' : '#22C55E'
        return (
          <Animated.View key={alert.id} entering={FadeInUp.duration(300).delay(i * 40).springify()}
            style={{ backgroundColor: 'white', borderRadius: 16, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)', borderLeftWidth: 3, borderLeftColor: statusColor }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${statusColor}12`, alignItems: 'center', justifyContent: 'center' }}>
                <GoonaIcon icon={alert.type === 'SOS' ? Bell : alert.type === 'restricted_entry' ? ShieldAlert : AlertTriangle} size={16} color={statusColor} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontWeight: '600', fontSize: 13, color: '#1B1B1B' }}>{alert.workerName}</Text>
                  <View style={{ paddingVertical: 2, paddingHorizontal: 8, borderRadius: 50, backgroundColor: `${statusColor}12` }}>
                    <Text style={{ fontSize: 9, fontWeight: '700', color: statusColor, textTransform: 'capitalize' }}>{alert.status}</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>{alert.timestamp} &bull; {alert.location}</Text>
                <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>Zone: {alert.zone}</Text>
              </View>
              <Pressable onPress={() => Alert.alert(
                alert.type === 'SOS' ? 'Emergency Alert' : 'Safety Alert',
                `Worker: ${alert.workerName}\nTime: ${alert.timestamp}\nLocation: ${alert.location}\nZone: ${alert.zone}\nType: ${alert.type}\nStatus: ${alert.status}\n\nPush notification sent to farm owner.`
              )}>
                <GoonaIcon icon={Eye} size={16} color="#94A3B8" />
              </Pressable>
            </View>
          </Animated.View>
        )
      })}
    </View>
  )
}

/* ─── PATROLS TAB ─── */
function PatrolsTab() {
  const [selectedRoute, setSelectedRoute] = useState<string>(PATROL_ROUTES[0].id)
  const route = PATROL_ROUTES.find(r => r.id === selectedRoute) || PATROL_ROUTES[0]

  return (
    <View>
      {/* Route selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
        {PATROL_ROUTES.map(r => (
          <Pressable
            key={r.id}
            onPress={() => setSelectedRoute(r.id)}
            style={{
              paddingVertical: 8, paddingHorizontal: 16, borderRadius: 50,
              backgroundColor: selectedRoute === r.id ? '#00695C' : 'white', marginRight: 8,
              borderWidth: 1, borderColor: selectedRoute === r.id ? '#00695C' : 'rgba(0,0,0,0.04)',
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: selectedRoute === r.id ? '#fff' : '#475569' }}>{r.name}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Route info */}
      <Animated.View key={route.id} entering={FadeInUp.duration(300).springify()}>
        <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <View>
              <Text style={{ fontWeight: '700', fontSize: 16, color: '#1B1B1B' }}>{route.name}</Text>
              <Text style={{ fontSize: 12, color: '#64748B' }}>{route.officer} &bull; {route.date}</Text>
            </View>
            <View style={{ paddingVertical: 4, paddingHorizontal: 12, borderRadius: 50, backgroundColor: route.status === 'active' ? '#22C55E15' : route.status === 'completed' ? '#00695C15' : '#EF444415' }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: route.status === 'active' ? '#22C55E' : route.status === 'completed' ? '#00695C' : '#EF4444', textTransform: 'uppercase' }}>{route.status}</Text>
            </View>
          </View>

          {/* Progress */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: '#F1F5F9' }}>
              <View style={{ width: `${route.completion}%`, height: 6, borderRadius: 3, backgroundColor: route.completion === 100 ? '#22C55E' : '#00695C' }} />
            </View>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#1B1B1B' }}>{route.completion}%</Text>
          </View>
        </View>

        {/* Checkpoints */}
        <Text style={{ fontWeight: '700', fontSize: 15, color: '#1B1B1B', marginBottom: 8 }}>Checkpoints</Text>
        {route.checkpoints.map((cp, i) => {
          const isCompleted = cp.status === 'completed'
          const isMissed = cp.status === 'missed'
          return (
            <Animated.View key={cp.id} entering={FadeInUp.duration(300).delay(i * 40).springify()}
              style={{
                flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 14,
                padding: 12, marginBottom: 6, borderWidth: 1,
                borderColor: isCompleted ? 'rgba(34,197,94,0.08)' : isMissed ? 'rgba(239,68,68,0.08)' : 'rgba(0,0,0,0.02)',
              }}>
              {/* Step indicator */}
              <View style={{ alignItems: 'center', marginRight: 12 }}>
                <View style={{
                  width: 28, height: 28, borderRadius: 14,
                  backgroundColor: isCompleted ? '#22C55E' : isMissed ? '#EF4444' : '#F1F5F9',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  {isCompleted ? (
                    <GoonaIcon icon={Icons.checkCircle} size={14} color="#fff" />
                  ) : isMissed ? (
                    <GoonaIcon icon={Icons.x} size={14} color="#fff" />
                  ) : (
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#94A3B8' }}>{i + 1}</Text>
                  )}
                </View>
                {i < route.checkpoints.length - 1 && (
                  <View style={{ width: 2, height: 20, backgroundColor: isCompleted ? '#22C55E' : '#E2E8F0', marginVertical: 2 }} />
                )}
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '600', fontSize: 13, color: '#1B1B1B' }}>{cp.name}</Text>
                <Text style={{ fontSize: 11, color: '#94A3B8' }}>{cp.zone}</Text>
                {cp.time && <Text style={{ fontSize: 10, color: '#22C55E', marginTop: 1 }}>{cp.time} &bull; {cp.verifiedBy}</Text>}
              </View>

              <Pressable onPress={() => {
                if (cp.status === 'pending') {
                  Alert.alert('Verify Checkpoint', `Scan QR code at ${cp.name} to verify.\n\nCamera access required for QR scanning.`)
                } else {
                  Alert.alert('Checkpoint Details', `${cp.name}\nZone: ${cp.zone}\nStatus: ${cp.status}\n${cp.time ? `Time: ${cp.time}\nVerified by: ${cp.verifiedBy}` : ''}`)
                }
              }}>
                <GoonaIcon icon={isMissed ? AlertTriangle : isCompleted ? CheckCircle : Smartphone} size={16} color={isCompleted ? '#22C55E' : isMissed ? '#EF4444' : '#94A3B8'} />
              </Pressable>
            </Animated.View>
          )
        })}
      </Animated.View>

      {/* Generate Report */}
      <Pressable
        onPress={() => Alert.alert('Patrol Report', `Route: ${route.name}\nDate: ${route.date}\nOfficer: ${route.officer}\nCheckpoints: ${route.checkpoints.filter(c => c.status === 'completed').length}/${route.checkpoints.length}\nCompletion: ${route.completion}%\n\nFull report generation coming soon.`)}
        style={({ pressed }) => [{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
          backgroundColor: '#00695C', borderRadius: 16, paddingVertical: 14, marginTop: 20,
        }, pressed && { opacity: 0.9 }]}
      >
        <GoonaIcon icon={BarChart3} size={16} color="#fff" />
        <Text style={{ fontWeight: '700', fontSize: 14, color: '#fff' }}>Generate Patrol Report</Text>
      </Pressable>
    </View>
  )
}

/* ─── ANALYTICS TAB ─── */
function AnalyticsTab() {
  const attendanceRate = Math.round(WORKERS.reduce((s, w) => s + w.attendanceRate, 0) / WORKERS.length)
  const safetyScore = Math.round(WORKERS.reduce((s, w) => s + w.safetyScore, 0) / WORKERS.length)
  const punctuality = Math.round(WORKERS.reduce((s, w) => s + w.punctuality, 0) / WORKERS.length)
  const present = WORKERS.filter(w => w.online && w.status === 'active').length

  const insights = [
    { text: 'Attendance improved by 12% this cycle — 9 of 12 workers consistently on time.', type: 'positive' as const },
    { text: 'No safety incidents recorded in the last 7 days.', type: 'positive' as const },
    { text: 'Worker productivity score is 87% — above farm average by 5%.', type: 'positive' as const },
    { text: 'Punctuality rate at 84% — recommend morning briefings to improve.', type: 'neutral' as const },
    { text: 'Emergency response time averages 3 min — within safety threshold.', type: 'positive' as const },
  ]

  return (
    <View>
      {/* Key trends */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
        {[
          { label: 'Attendance', value: `${attendanceRate}%`, color: '#22C55E', trend: '+12%' },
          { label: 'Safety', value: `${safetyScore}%`, color: '#00695C', trend: '+5%' },
          { label: 'Punctuality', value: `${punctuality}%`, color: '#6366F1', trend: '+3%' },
          { label: 'Efficiency', value: '87%', color: '#F59E0B', trend: '+8%' },
        ].map((m, i) => (
          <Animated.View key={m.label} entering={FadeInUp.duration(400).delay(i * 60).springify()} style={{ flex: 1 }}>
            <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)' }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: m.color }}>{m.value}</Text>
              <Text style={{ fontSize: 9, color: '#94A3B8', marginTop: 1 }}>{m.label}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 }}>
                <GoonaIcon icon={TrendingUp} size={10} color="#22C55E" />
                <Text style={{ fontSize: 9, fontWeight: '700', color: '#22C55E' }}>{m.trend}</Text>
              </View>
            </View>
          </Animated.View>
        ))}
      </View>

      {/* Engagement score */}
      <Animated.View entering={FadeInUp.duration(500).delay(250).springify()}>
        <LinearGradient colors={['#00695C', '#0F766E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{ borderRadius: 24, padding: 20, marginBottom: 16, overflow: 'hidden' }}>
          <View style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.06)' }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.6)', letterSpacing: 1, marginBottom: 4 }}>WORKFORCE ENGAGEMENT</Text>
              <Text style={{ fontSize: 34, fontWeight: '800', color: '#AEEA00' }}>89%</Text>
              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{present} of {WORKERS.length} workers active</Text>
            </View>
            <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(174,234,0,0.1)', alignItems: 'center', justifyContent: 'center' }}>
              <GoonaIcon icon={Activity} size={30} color="#AEEA00" />
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* GOONA IQ Insights */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <GoonaIcon icon={Zap} size={16} color="#00695C" />
        <Text style={{ fontWeight: '700', fontSize: 15, color: '#1B1B1B' }}>GOONA IQ Recommendations</Text>
      </View>

      {insights.map((insight, i) => (
        <Animated.View key={i} entering={FadeInUp.duration(300).delay(i * 60 + 300).springify()}>
          <Pressable
            onPress={() => Alert.alert('GOONA IQ Insight', `${insight.text}\n\nRecommendation generated from workforce analytics.`)}
            style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: 'white', borderRadius: 16, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)' }}
          >
            <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: insight.type === 'positive' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <GoonaIcon icon={insight.type === 'positive' ? TrendingUp : Zap} size={14} color={insight.type === 'positive' ? '#22C55E' : '#F59E0B'} />
            </View>
            <Text style={{ fontSize: 13, lineHeight: 18, color: '#1B1B1B', flex: 1 }}>{insight.text}</Text>
          </Pressable>
        </Animated.View>
      ))}

      {/* Safety metrics */}
      <Animated.View entering={FadeInUp.duration(500).delay(500).springify()} style={{ marginTop: 8 }}>
        <LinearGradient colors={['#E8F5E9', '#F0FDF4']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{ borderRadius: 20, padding: 18, borderWidth: 1, borderColor: 'rgba(46,125,50,0.06)' }}>
          <Text style={{ fontWeight: '700', fontSize: 15, color: '#1F2937', marginBottom: 8 }}>Safety Overview</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 22, fontWeight: '800', color: '#2E7D32' }}>0</Text>
              <Text style={{ fontSize: 11, color: '#64748B' }}>Incidents this week</Text>
            </View>
            <View style={{ width: 1, backgroundColor: 'rgba(0,0,0,0.06)' }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 22, fontWeight: '800', color: '#2E7D32' }}>{safetyScore}%</Text>
              <Text style={{ fontSize: 11, color: '#64748B' }}>Safety Score</Text>
            </View>
            <View style={{ width: 1, backgroundColor: 'rgba(0,0,0,0.06)' }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 22, fontWeight: '800', color: '#2E7D32' }}>7</Text>
              <Text style={{ fontSize: 11, color: '#64748B' }}>Days safe</Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    </View>
  )
}

/* ─── MAIN SCREEN ─── */
export default function WorkforceHubScreen() {
  const [activeTab, setActiveTab] = useState<WfTabType>('overview')
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null)
  const [profileVisible, setProfileVisible] = useState(false)

  const handleSelectWorker = (w: Worker) => {
    setSelectedWorker(w)
    setProfileVisible(true)
  }

  const activeAlerts = SOS_ALERTS.filter(a => a.status === 'active').length

  return (
    <View style={s.container}>
      <StatusBar style="dark" />

      {/* Background */}
      <View style={s.bgBlob} pointerEvents="none" />
      <View style={s.bgGlowCenter} pointerEvents="none" />
      <View style={s.bgDotGrid} pointerEvents="none">
        {Array.from({ length: 40 }).map((_, i) => (
          <View key={i} style={[s.bgDot, { left: `${(i % 8) * 13 + 3}%`, top: `${Math.floor(i / 8) * 14 + 5}%` }]} />
        ))}
      </View>
      <View style={s.bgContour1} pointerEvents="none" />
      <View style={s.bgContour2} pointerEvents="none" />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollInner, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* App Bar */}
        <Animated.View entering={FadeInUp.duration(500).springify()} style={s.topNav}>
          <TouchableOpacity style={s.navBack} onPress={() => router.back()} activeOpacity={0.7}>
            <GoonaIcon icon={Icons.arrowLeft} size={22} color="#1B1B1B" />
          </TouchableOpacity>
          <View style={s.navLogo}>
            <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <Path d="M12 2C12 2 7 8 7 12C7 14.5 8.5 17 10 18.5C9.5 17 9 16 9 15C9 11.5 11 7 12 2Z" fill="#00695C" />
              <Path d="M12 2C12 2 17 8 17 12C17 14.5 15.5 17 14 18.5C14.5 17 15 16 15 15C15 11.5 13 7 12 2Z" fill="#0F766E" />
            </Svg>
            <Text style={s.navLogoText}>GOONA</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <PulseDot color={activeAlerts > 0 ? '#EF4444' : '#22C55E'} size={5} />
            <Text style={s.navLabel}>Team Hub</Text>
          </View>
        </Animated.View>

        {/* Header */}
        <Animated.View entering={FadeInUp.duration(500).delay(80).springify()} style={s.headerSection}>
          <View style={s.headerLeft}>
            <Text style={s.headerTitle}>Team Hub</Text>
            <Text style={s.headerSub}>Manage your operational ecosystem.</Text>
          </View>
          <View style={{ backgroundColor: activeAlerts > 0 ? '#EF4444' : '#22C55E', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 50, alignItems: 'center' }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: '#fff' }}>{activeAlerts > 0 ? `${activeAlerts} Alert${activeAlerts > 1 ? 's' : ''}` : 'All Clear'}</Text>
          </View>
        </Animated.View>

        {/* Tabs */}
        <Animated.View entering={FadeInUp.duration(500).delay(300).springify()}>
          <WfTabs active={activeTab} onChange={setActiveTab} />
        </Animated.View>

        {/* Tab Content */}
        <Animated.View key={activeTab} entering={FadeInUp.duration(400).springify()}>
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'members' && <MembersTab onSelectWorker={handleSelectWorker} />}
          {activeTab === 'attendance' && <AttendanceTab />}
          {activeTab === 'safety' && <SafetyTab />}
          {activeTab === 'patrols' && <PatrolsTab />}
          {activeTab === 'analytics' && <AnalyticsTab />}
        </Animated.View>

        {/* Offline indicator */}
        <Animated.View entering={FadeInUp.duration(500).delay(800).springify()} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 24, paddingVertical: 8, backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: 50 }}>
          <GoonaIcon icon={Wifi} size={12} color="#22C55E" />
          <Text style={{ fontSize: 10, color: '#94A3B8' }}>Online &bull; Auto-sync active &bull; Geofence monitoring</Text>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Workforce Profile Modal */}
      <WorkforceProfileModal worker={selectedWorker} visible={profileVisible} onClose={() => setProfileVisible(false)} />

      <BottomDock hidden={false} />
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9F5' },
  bgBlob: { position: 'absolute', top: -60, right: -60, width: 320, height: 320, borderRadius: 160, backgroundColor: 'rgba(0,105,92,0.08)', zIndex: 0 },
  bgGlowCenter: { position: 'absolute', top: '30%', left: '50%', width: 240, height: 240, marginLeft: -120, marginTop: -120, borderRadius: 120, backgroundColor: 'rgba(0,105,92,0.05)', zIndex: 0 },
  bgDotGrid: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, opacity: 0.4 },
  bgDot: { position: 'absolute', width: 2, height: 2, borderRadius: 1, backgroundColor: 'rgba(0,105,92,0.12)' },
  bgContour1: { position: 'absolute', top: '8%', right: '-15%', width: 380, height: 130, borderWidth: 1, borderColor: 'rgba(46,125,50,0.05)', borderTopLeftRadius: 190, borderTopRightRadius: 190, borderBottomWidth: 0, transform: [{ rotate: '10deg' }], zIndex: 0 },
  bgContour2: { position: 'absolute', bottom: '20%', left: '-10%', width: 300, height: 100, borderWidth: 1, borderColor: 'rgba(46,125,50,0.05)', borderBottomLeftRadius: 150, borderBottomRightRadius: 150, borderTopWidth: 0, transform: [{ rotate: '-8deg' }], zIndex: 0 },
  scroll: { flex: 1, zIndex: 1 },
  scrollInner: { paddingHorizontal: 24 },
  topNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 54 },
  navBack: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  navLogo: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  navLogoText: { fontWeight: '700', fontSize: 14, color: '#1B1B1B' },
  navLabel: { fontSize: 13, fontWeight: '500', color: '#616161' },
  headerSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 20 },
  headerLeft: { flex: 1 },
  headerTitle: { fontWeight: '800', fontSize: 32, lineHeight: 36, color: '#1B1B1B' },
  headerSub: { fontSize: 14, color: '#64748B', marginTop: 1 },
})
