import React, { useState, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, Switch, ScrollView,
  StyleSheet, Dimensions,
} from 'react-native'
import Svg, { Path, Circle, Rect, Line, Ellipse } from 'react-native-svg'
import { StatusBar } from 'expo-status-bar'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
  FadeInUp, FadeIn,
} from 'react-native-reanimated'
import BottomTabBar from '../components/BottomTabBar'

/* ─── Icons ─── */
function BackIcon() {
  return <Svg width="22" height="22" viewBox="0 0 24 24" fill="none"><Path d="M15 18L9 12L15 6" stroke="#1B1B1B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></Svg>
}
function BellIcon() {
  return <Svg width="16" height="16" viewBox="0 0 16 16" fill="none"><Path d="M8 2C6 2 4.5 3.5 4.5 5.5V9L3 11H13L11.5 9V5.5C11.5 3.5 10 2 8 2Z" stroke="#00695C" strokeWidth="1.3" fill="none" strokeLinejoin="round" /><Path d="M6.5 11C6.5 12 7 12.5 8 12.5C9 12.5 9.5 12 9.5 11" stroke="#00695C" strokeWidth="1.2" strokeLinecap="round" fill="none" /></Svg>
}
function ClockIcon() {
  return <Svg width="16" height="16" viewBox="0 0 16 16" fill="none"><Circle cx="8" cy="8" r="5.5" stroke="#00695C" strokeWidth="1.3" fill="none" /><Path d="M8 5V8.5L10 10" stroke="#00695C" strokeWidth="1.3" strokeLinecap="round" /></Svg>
}
function UsersIcon() {
  return <Svg width="16" height="16" viewBox="0 0 16 16" fill="none"><Circle cx="6" cy="5" r="2" stroke="#00695C" strokeWidth="1.2" fill="none" /><Path d="M3 13C3 11 4.5 10 6 10C7.5 10 9 11 9 13" stroke="#00695C" strokeWidth="1.2" fill="none" strokeLinecap="round" /><Circle cx="11" cy="5" r="2" stroke="#00695C" strokeWidth="1.2" fill="none" /><Path d="M10 13C10 11.5 11 10.5 12 10.5C13 10.5 14 11.5 14 13" stroke="#00695C" strokeWidth="1.2" fill="none" strokeLinecap="round" /></Svg>
}
function SparkleIconSm() {
  return <Svg width="16" height="16" viewBox="0 0 16 16" fill="none"><Path d="M8 3L9 6.5L12.5 7.5L9 8.5L8 12L7 8.5L3.5 7.5L7 6.5L8 3Z" stroke="#00695C" strokeWidth="1.1" strokeLinejoin="round" fill="rgba(0,105,92,0.08)" /></Svg>
}
function ChartIcon() {
  return <Svg width="16" height="16" viewBox="0 0 16 16" fill="none"><Rect x="3" y="9" width="2.5" height="4" rx="0.5" stroke="#00695C" strokeWidth="1.1" fill="none" /><Rect x="6.5" y="6" width="2.5" height="7" rx="0.5" stroke="#00695C" strokeWidth="1.1" fill="none" /><Rect x="10" y="3" width="2.5" height="10" rx="0.5" stroke="#00695C" strokeWidth="1.1" fill="none" /></Svg>
}
function SyncIcon() {
  return <Svg width="16" height="16" viewBox="0 0 16 16" fill="none"><Path d="M4 8C4 5.5 5.5 4 8 4C9.5 4 10.5 4.5 11 5.5" stroke="#64748B" strokeWidth="1.3" strokeLinecap="round" /><Path d="M12 8C12 10.5 10.5 12 8 12C6.5 12 5.5 11.5 5 10.5" stroke="#64748B" strokeWidth="1.3" strokeLinecap="round" /><Path d="M4 5V8H7" stroke="#64748B" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /><Path d="M12 11V8H9" stroke="#64748B" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></Svg>
}
function CloudOffIcon() {
  return <Svg width="16" height="16" viewBox="0 0 16 16" fill="none"><Path d="M4.5 10C3 10 2 9 2 7.5C2 6 3 5 4.5 5C4.5 3.5 6 2.5 8 2.5C9.5 2.5 10.5 3.5 11 4.5" stroke="#64748B" strokeWidth="1.3" fill="none" strokeLinecap="round" /><Path d="M10.5 10.5H12C13 10.5 14 9.5 14 8.5C14 7.5 13 6.5 12 6.5" stroke="#64748B" strokeWidth="1.3" fill="none" strokeLinecap="round" /><Line x1="3" y1="12" x2="13" y2="5" stroke="#64748B" strokeWidth="1.2" strokeLinecap="round" /></Svg>
}
function ServerIcon() {
  return <Svg width="16" height="16" viewBox="0 0 16 16" fill="none"><Rect x="2.5" y="3" width="11" height="4" rx="1" stroke="#64748B" strokeWidth="1.2" fill="none" /><Rect x="2.5" y="9" width="11" height="4" rx="1" stroke="#64748B" strokeWidth="1.2" fill="none" /><Circle cx="5" cy="5" r="0.8" fill="#64748B" /><Circle cx="5" cy="11" r="0.8" fill="#64748B" /></Svg>
}
function SendIcon() {
  return <Svg width="16" height="16" viewBox="0 0 16 16" fill="none"><Path d="M3 8L13 3L10 13L7 9L3 8Z" stroke="#64748B" strokeWidth="1.2" strokeLinejoin="round" fill="none" /></Svg>
}
function PhoneIcon() {
  return <Svg width="16" height="16" viewBox="0 0 16 16" fill="none"><Rect x="4" y="2" width="8" height="12" rx="1.5" stroke="#64748B" strokeWidth="1.2" fill="none" /><Line x1="6.5" y1="3" x2="9.5" y2="3" stroke="#64748B" strokeWidth="1" strokeLinecap="round" /><Circle cx="8" cy="11.5" r="1" fill="#64748B" /></Svg>
}
function KeyIcon() {
  return <Svg width="16" height="16" viewBox="0 0 16 16" fill="none"><Circle cx="5.5" cy="10.5" r="3" stroke="#64748B" strokeWidth="1.2" fill="none" /><Path d="M8 8L12 4" stroke="#64748B" strokeWidth="1.2" strokeLinecap="round" /><Line x1="10" y1="6" x2="11.5" y2="7.5" stroke="#64748B" strokeWidth="1.2" strokeLinecap="round" /></Svg>
}
function FaceIcon() {
  return <Svg width="16" height="16" viewBox="0 0 16 16" fill="none"><Circle cx="8" cy="8" r="5.5" stroke="#6366F1" strokeWidth="1.2" fill="none" /><Circle cx="6" cy="7" r="0.8" fill="#6366F1" /><Circle cx="10" cy="7" r="0.8" fill="#6366F1" /><Path d="M6 10C6.5 10.5 7 11 8 11C9 11 9.5 10.5 10 10" stroke="#6366F1" strokeWidth="1" strokeLinecap="round" fill="none" /></Svg>
}
function FileIcon() {
  return <Svg width="16" height="16" viewBox="0 0 16 16" fill="none"><Path d="M5 3H9L12 6V12.5C12 13.3 11.3 14 10.5 14H5.5C4.7 14 4 13.3 4 12.5V4.5C4 3.7 4.7 3 5.5 3H5Z" stroke="#64748B" strokeWidth="1.2" fill="none" strokeLinejoin="round" /><Line x1="6" y1="8" x2="10" y2="8" stroke="#64748B" strokeWidth="1" strokeLinecap="round" /><Line x1="6" y1="10" x2="9" y2="10" stroke="#64748B" strokeWidth="1" strokeLinecap="round" /></Svg>
}
function WarnIcon() {
  return <Svg width="16" height="16" viewBox="0 0 16 16" fill="none"><Path d="M8 3L2.5 13H13.5L8 3Z" stroke="#DC2626" strokeWidth="1.2" strokeLinejoin="round" fill="rgba(220,38,38,0.06)" /><Line x1="8" y1="6.5" x2="8" y2="9.5" stroke="#DC2626" strokeWidth="1.2" strokeLinecap="round" /><Circle cx="8" cy="11" r="0.8" fill="#DC2626" /></Svg>
}
function StarIconSm() {
  return <Svg width="16" height="16" viewBox="0 0 16 16" fill="none"><Path d="M8 2L9.5 6L13.5 7L10 10L10.5 14L8 12L5.5 14L6 10L2.5 7L6.5 6L8 2Z" stroke="#AEEA00" strokeWidth="1.1" strokeLinejoin="round" fill="rgba(174,234,0,0.08)" /></Svg>
}
function BookIcon() {
  return <Svg width="16" height="16" viewBox="0 0 16 16" fill="none"><Rect x="3" y="3" width="10" height="11" rx="1.5" stroke="#AEEA00" strokeWidth="1.2" fill="none" /><Line x1="6" y1="6" x2="10" y2="6" stroke="#AEEA00" strokeWidth="1" strokeLinecap="round" /><Line x1="6" y1="8.5" x2="9" y2="8.5" stroke="#AEEA00" strokeWidth="1" strokeLinecap="round" /></Svg>
}
function TargetIconSm() {
  return <Svg width="16" height="16" viewBox="0 0 16 16" fill="none"><Circle cx="8" cy="8" r="5.5" stroke="#AEEA00" strokeWidth="1.2" fill="none" /><Circle cx="8" cy="8" r="2.5" stroke="#AEEA00" strokeWidth="1.2" fill="none" /><Circle cx="8" cy="8" r="1" fill="#AEEA00" /></Svg>
}
function CalendarIcon() {
  return <Svg width="16" height="16" viewBox="0 0 16 16" fill="none"><Rect x="2.5" y="3.5" width="11" height="10" rx="1.5" stroke="#AEEA00" strokeWidth="1.2" fill="none" /><Line x1="2.5" y1="7" x2="13.5" y2="7" stroke="#AEEA00" strokeWidth="1" /><Line x1="5" y1="2" x2="5" y2="4" stroke="#AEEA00" strokeWidth="1.2" strokeLinecap="round" /><Line x1="11" y1="2" x2="11" y2="4" stroke="#AEEA00" strokeWidth="1.2" strokeLinecap="round" /></Svg>
}
function TrophyIcon() {
  return <Svg width="16" height="16" viewBox="0 0 16 16" fill="none"><Path d="M5 3H11V6C11 8 9.5 9.5 8 9.5C6.5 9.5 5 8 5 6V3Z" stroke="#AEEA00" strokeWidth="1.2" fill="none" /><Path d="M4.5 3H3V4.5C3 5.8 4 6.5 5 6.5" stroke="#AEEA00" strokeWidth="1.2" fill="none" strokeLinecap="round" /><Path d="M11.5 3H13V4.5C13 5.8 12 6.5 11 6.5" stroke="#AEEA00" strokeWidth="1.2" fill="none" strokeLinecap="round" /><Line x1="8" y1="9.5" x2="8" y2="12" stroke="#AEEA00" strokeWidth="1.2" strokeLinecap="round" /><Path d="M6 12H10L9.5 13.5H6.5L6 12Z" stroke="#AEEA00" strokeWidth="1" fill="none" strokeLinejoin="round" /></Svg>
}
function GlobeIcon() {
  return <Svg width="16" height="16" viewBox="0 0 16 16" fill="none"><Circle cx="8" cy="8" r="5.5" stroke="#64748B" strokeWidth="1.2" fill="none" /><Ellipse cx="8" cy="8" rx="2" ry="5.5" stroke="#64748B" strokeWidth="1" /><Line x1="3" y1="6" x2="13" y2="6" stroke="#64748B" strokeWidth="1" /><Line x1="3" y1="10" x2="13" y2="10" stroke="#64748B" strokeWidth="1" /></Svg>
}
function MoonIcon() {
  return <Svg width="16" height="16" viewBox="0 0 16 16" fill="none"><Path d="M8.5 3C7 3 5.5 4 5.5 6.5C5.5 9 7 11 10 11C11 11 11.5 10.5 12 10C10.5 11 8.5 10.5 7.5 9C6.5 7.5 6.5 5 8.5 3Z" stroke="#64748B" strokeWidth="1.2" strokeLinejoin="round" fill="none" /></Svg>
}
function TextIcon() {
  return <Svg width="16" height="16" viewBox="0 0 16 16" fill="none"><Line x1="3" y1="3.5" x2="13" y2="3.5" stroke="#64748B" strokeWidth="1.2" strokeLinecap="round" /><Line x1="5" y1="7.5" x2="11" y2="7.5" stroke="#64748B" strokeWidth="1" strokeLinecap="round" /><Line x1="6" y1="11.5" x2="10" y2="11.5" stroke="#64748B" strokeWidth="1" strokeLinecap="round" /></Svg>
}
function MoneyIcon() {
  return <Svg width="16" height="16" viewBox="0 0 16 16" fill="none"><Rect x="2.5" y="5" width="11" height="7" rx="1.5" stroke="#00695C" strokeWidth="1.2" fill="none" /><Circle cx="8" cy="8.5" r="1.5" stroke="#00695C" strokeWidth="1" fill="none" /></Svg>
}
function HelpIcon() {
  return <Svg width="16" height="16" viewBox="0 0 16 16" fill="none"><Circle cx="8" cy="8" r="5.5" stroke="#64748B" strokeWidth="1.2" fill="none" /><Path d="M6.5 6.5C6.5 5.5 7 5 8 5C9 5 9.5 5.5 9.5 6.5C9.5 7.5 8.5 8 8.5 8.5" stroke="#64748B" strokeWidth="1.2" strokeLinecap="round" fill="none" /><Circle cx="8" cy="10.5" r="0.6" fill="#64748B" /></Svg>
}
function ChatIcon() {
  return <Svg width="16" height="16" viewBox="0 0 16 16" fill="none"><Path d="M3 8C3 5.5 4.5 3.5 8 3.5C11.5 3.5 13 5.5 13 8C13 10.5 11.5 12.5 8 12.5C7 12.5 6 12 5.5 11.5L3 12.5L4 10.5C3.5 9.5 3 9 3 8Z" stroke="#64748B" strokeWidth="1.2" fill="none" strokeLinejoin="round" /></Svg>
}
function ShieldIcon() {
  return <Svg width="16" height="16" viewBox="0 0 16 16" fill="none"><Path d="M8 2.5L3 4.5V8C3 11 5.5 12.5 8 13.5C10.5 12.5 13 11 13 8V4.5L8 2.5Z" stroke="#64748B" strokeWidth="1.2" strokeLinejoin="round" fill="none" /></Svg>
}
function DocIcon() {
  return <Svg width="16" height="16" viewBox="0 0 16 16" fill="none"><Path d="M5 3H9L12 6V12C12 12.6 11.6 13 11 13H5C4.4 13 4 12.6 4 12V4C4 3.4 4.4 3 5 3Z" stroke="#64748B" strokeWidth="1.2" fill="none" strokeLinejoin="round" /></Svg>
}
function InfoIcon() {
  return <Svg width="16" height="16" viewBox="0 0 16 16" fill="none"><Circle cx="8" cy="8" r="5.5" stroke="#64748B" strokeWidth="1.2" fill="none" /><Line x1="8" y1="7" x2="8" y2="11" stroke="#64748B" strokeWidth="1.2" strokeLinecap="round" /><Circle cx="8" cy="5.5" r="0.6" fill="#64748B" /></Svg>
}
function ChevronIcon() {
  return <Svg width="14" height="14" viewBox="0 0 14 14" fill="none"><Path d="M5 3L9 7L5 11" stroke="#CBD5E1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></Svg>
}
function EditIcon() {
  return <Svg width="16" height="16" viewBox="0 0 16 16" fill="none"><Path d="M11 2.5L13.5 5L7 11.5H4.5V9L11 2.5Z" stroke="#64748B" strokeWidth="1.3" strokeLinejoin="round" fill="none" /></Svg>
}
function ProfileIcon() {
  return <Svg width="18" height="18" viewBox="0 0 18 18" fill="none"><Circle cx="9" cy="6.5" r="2.5" stroke="#1F2937" strokeWidth="1.3" fill="none" /><Path d="M4 14.5C4 12.5 5.5 11 9 11C12.5 11 14 12.5 14 14.5" stroke="#1F2937" strokeWidth="1.3" fill="none" strokeLinecap="round" /></Svg>
}

/* ─── Press Scale ─── */
function usePressScale() {
  const scale = useSharedValue(1)
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
  return {
    style,
    onPressIn: () => { scale.value = withSpring(0.97, { damping: 15, stiffness: 200 }) },
    onPressOut: () => { scale.value = withSpring(1, { damping: 15, stiffness: 200 }) },
  }
}

/* ─── Setting Row ─── */
function SettingRow({
  icon, title, desc, right, onPress,
}: {
  icon: React.ReactNode
  title: string
  desc: string
  right: React.ReactNode
  onPress?: () => void
}) {
  const { style, onPressIn, onPressOut } = usePressScale()
  return (
    <Animated.View style={style}>
      <TouchableOpacity
        style={srStyles.row}
        activeOpacity={0.7}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        <View style={srStyles.icon}>{icon}</View>
        <View style={srStyles.content}>
          <Text style={srStyles.title}>{title}</Text>
          <Text style={srStyles.desc}>{desc}</Text>
        </View>
        <View style={srStyles.right}>{right}</View>
      </TouchableOpacity>
    </Animated.View>
  )
}
const srStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: 16, minHeight: 52,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  icon: {
    width: 28, height: 28, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  content: { flex: 1 },
  title: { fontSize: 13, fontWeight: '600', color: '#1B1B1B' },
  desc: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
  right: { flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 8 },
})

/* ─── Data ─── */
type RowDef = {
  key: string
  icon: React.ReactNode
  title: string
  desc: string
  type: 'toggle' | 'chevron' | 'badge'
  defaultOn?: boolean
  badgeText?: string
}

function iconBg(color: string, children: React.ReactNode) {
  return <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>{children}</View>
}

const NOTIF_ROWS: RowDef[] = [
  { key: 'push', icon: iconBg('rgba(0,105,92,0.06)', <BellIcon />), title: 'Push Notifications', desc: 'Receive alerts on your device', type: 'toggle', defaultOn: true },
  { key: 'reminder', icon: iconBg('rgba(0,105,92,0.06)', <ClockIcon />), title: 'Reminder Alerts', desc: 'Feeding, health, and task reminders', type: 'toggle', defaultOn: true },
  { key: 'worker', icon: iconBg('rgba(0,105,92,0.06)', <UsersIcon />), title: 'Worker Activity Updates', desc: 'Get notified when workers log changes', type: 'toggle', defaultOn: true },
  { key: 'iq', icon: iconBg('rgba(0,105,92,0.06)', <SparkleIconSm />), title: 'GOONA IQ Insights', desc: 'AI-powered operational notifications', type: 'toggle', defaultOn: false },
  { key: 'batch', icon: iconBg('rgba(0,105,92,0.06)', <ChartIcon />), title: 'Batch Health Alerts', desc: 'Critical batch health notifications', type: 'toggle', defaultOn: true },
]

const SYNC_ROWS: RowDef[] = [
  { key: 'autosync', icon: iconBg('#F1F5F9', <SyncIcon />), title: 'Auto Sync', desc: 'Automatically sync farm data', type: 'toggle', defaultOn: true },
  { key: 'offline', icon: iconBg('#F1F5F9', <CloudOffIcon />), title: 'Offline Mode', desc: 'Work without internet connection', type: 'toggle', defaultOn: false },
  { key: 'backup', icon: iconBg('#F1F5F9', <ServerIcon />), title: 'Data Backup Status', desc: 'Last backup 15 mins ago', type: 'badge', badgeText: 'Up to date' },
  { key: 'syncrecovery', icon: iconBg('#F1F5F9', <SendIcon />), title: 'Sync Recovery', desc: 'Resolve sync conflicts', type: 'chevron' },
]

const SEC_ROWS: RowDef[] = [
  { key: 'devices', icon: iconBg('#F1F5F9', <PhoneIcon />), title: 'Device Management', desc: '2 connected devices', type: 'chevron' },
  { key: 'permissions', icon: iconBg('#F1F5F9', <KeyIcon />), title: 'Permissions & Access', desc: 'Role-based access control', type: 'chevron' },
  { key: 'faceid', icon: iconBg('rgba(99,102,241,0.06)', <FaceIcon />), title: 'Face ID / Biometrics', desc: 'Use biometrics for quick access', type: 'toggle', defaultOn: true },
  { key: 'sessions', icon: iconBg('#F1F5F9', <FileIcon />), title: 'Login Sessions', desc: 'Manage active sessions', type: 'chevron' },
  { key: 'killswitch', icon: iconBg('rgba(239,68,68,0.06)', <WarnIcon />), title: 'Remote Kill Switch', desc: 'Revoke all device access', type: 'chevron' },
]

const IQ_ROWS: RowDef[] = [
  { key: 'aiprefs', icon: iconBg('rgba(174,234,0,0.06)', <StarIconSm />), title: 'AI Preferences', desc: 'Coach tone, insight frequency', type: 'chevron' },
  { key: 'academy', icon: iconBg('rgba(174,234,0,0.06)', <BookIcon />), title: 'Academy Settings', desc: 'Course and simulation preferences', type: 'chevron' },
  { key: 'simdiff', icon: iconBg('rgba(174,234,0,0.06)', <TargetIconSm />), title: 'Simulation Difficulty', desc: 'Current: Intermediate', type: 'chevron' },
  { key: 'dailychallenge', icon: iconBg('rgba(174,234,0,0.06)', <CalendarIcon />), title: 'Daily Challenge Notifications', desc: 'Get daily operational scenarios', type: 'toggle', defaultOn: true },
  { key: 'leaderboard', icon: iconBg('rgba(174,234,0,0.06)', <TrophyIcon />), title: 'Leaderboard Visibility', desc: 'Show your farm on rankings', type: 'toggle', defaultOn: true },
]

const PREF_ROWS: RowDef[] = [
  { key: 'lang', icon: iconBg('#F1F5F9', <GlobeIcon />), title: 'Language', desc: 'English', type: 'chevron' },
  { key: 'theme', icon: iconBg('#F1F5F9', <MoonIcon />), title: 'Theme Mode', desc: 'Light', type: 'chevron' },
  { key: 'font', icon: iconBg('#F1F5F9', <TextIcon />), title: 'Font Size', desc: 'Medium', type: 'chevron' },
  { key: 'region', icon: iconBg('rgba(0,105,92,0.06)', <MoneyIcon />), title: 'Region & Currency', desc: 'Nigeria', type: 'chevron' },
]

const HELP_ROWS: RowDef[] = [
  { key: 'helpcenter', icon: iconBg('#F1F5F9', <HelpIcon />), title: 'Help Center', desc: 'Guides and FAQs', type: 'chevron' },
  { key: 'support', icon: iconBg('#F1F5F9', <ChatIcon />), title: 'Contact Support', desc: 'Reach our team', type: 'chevron' },
  { key: 'privacy', icon: iconBg('#F1F5F9', <ShieldIcon />), title: 'Privacy Policy', desc: 'How we handle your data', type: 'chevron' },
  { key: 'terms', icon: iconBg('#F1F5F9', <DocIcon />), title: 'Terms & Conditions', desc: 'Service agreement', type: 'chevron' },
  { key: 'version', icon: iconBg('#F1F5F9', <InfoIcon />), title: 'App Version', desc: 'GOONA v2.4.1', type: 'chevron' },
]

/* ─── Section Renderer ─── */
function SettingsSection({
  title, rows, index, toggles, onToggle, onRowPress,
}: {
  title: string
  rows: RowDef[]
  index: number
  toggles: Record<string, boolean>
  onToggle: (key: string) => void
  onRowPress?: (key: string) => void
}) {
  return (
    <Animated.View entering={FadeInUp.duration(500).delay(300 + index * 100).springify()} style={sgStyles.group}>
      <Text style={sgStyles.title}>{title}</Text>
      <View style={sgStyles.card}>
        {rows.map((row) => (
          <SettingRow
            key={row.key}
            icon={row.icon}
            title={row.title}
            desc={row.desc}
            onPress={() => {
              if (row.type === 'toggle') onToggle(row.key)
              else if (onRowPress) onRowPress(row.key)
            }}
            right={
              row.type === 'toggle' ? (
                <Switch
                  value={toggles[row.key] ?? row.defaultOn ?? false}
                  onValueChange={() => onToggle(row.key)}
                  trackColor={{ false: '#E2E8F0', true: '#2E7D32' }}
                  thumbColor="white"
                  ios_backgroundColor="#E2E8F0"
                />
              ) : row.type === 'badge' ? (
                <Text style={sgStyles.badge}>{row.badgeText}</Text>
              ) : (
                <ChevronIcon />
              )
            }
          />
        ))}
      </View>
    </Animated.View>
  )
}
const sgStyles = StyleSheet.create({
  group: { marginTop: 22 },
  title: { fontWeight: '700', fontSize: 14, color: '#00695C', marginBottom: 8, paddingHorizontal: 4, letterSpacing: 0.3 },
  card: { backgroundColor: 'white', borderRadius: 22, paddingVertical: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.03, shadowRadius: 20, elevation: 2, overflow: 'hidden' },
  badge: { fontSize: 10, color: '#00695C', fontWeight: '600', backgroundColor: 'rgba(0,105,92,0.05)', paddingVertical: 2, paddingHorizontal: 10, borderRadius: 50 },
})

/* ─── MAIN ─── */
export default function SettingsScreen() {
  const insets = useSafeAreaInsets()

  const [toggles, setToggles] = useState<Record<string, boolean>>({
    push: true, reminder: true, worker: true, iq: false, batch: true,
    autosync: true, offline: false,
    faceid: true,
    dailychallenge: true, leaderboard: true,
  })

  const handleToggle = (key: string) => setToggles((prev) => ({ ...prev, [key]: !prev[key] }))

  const handleRowPress = (key: string) => {
    const routes: Record<string, string> = {
      devices: '/device-management',
      permissions: '/permissions',
      sessions: '/login-sessions',
      killswitch: '/remote-kill-switch',
      aiprefs: '/goona-iq-settings',
      academy: '/academy-settings',
      simdiff: '/simulation-difficulty',
      helpcenter: '/help',
      support: '/contact-support',
      privacy: '/privacy-policy',
      terms: '/terms',
      lang: '/language',
      theme: '/theme',
      font: '/font-size',
      region: '/region-currency',
    }
    const route = routes[key]
    if (route) router.push(route as any)
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* background */}
      <View style={styles.bgBlob} pointerEvents="none">
        <View style={styles.bgBlobInner} />
      </View>
      <View style={styles.bgContour1} pointerEvents="none" />
      <View style={styles.bgContour2} pointerEvents="none" />
      <View style={styles.bgDotGrid} pointerEvents="none">
        {Array.from({ length: 45 }).map((_, i) => (
          <View key={i} style={[styles.bgDot, { left: `${(i % 9) * 12 + 2}%`, top: `${Math.floor(i / 9) * 16 + 4}%` }]} />
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollInner, { paddingBottom: 110 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* TOP NAV */}
        <Animated.View entering={FadeInUp.duration(500).springify()} style={styles.topNav}>
          <TouchableOpacity style={styles.navBack} activeOpacity={0.7} onPress={() => router.back()}>
            <BackIcon />
          </TouchableOpacity>
          <View style={styles.navLogo}>
            <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <Path d="M12 2C12 2 7 8 7 12C7 14.5 8.5 17 10 18.5C9.5 17 9 16 9 15C9 11.5 11 7 12 2Z" fill="#00695C" />
              <Path d="M12 2C12 2 17 8 17 12C17 14.5 15.5 17 14 18.5C14.5 17 15 16 15 15C15 11.5 13 7 12 2Z" fill="#0F766E" />
            </Svg>
            <Text style={styles.navLogoText}>GOONA</Text>
          </View>
          <Text style={styles.navLabel}>Settings</Text>
        </Animated.View>

        {/* HEADER */}
        <Animated.View entering={FadeInUp.duration(500).delay(80).springify()} style={styles.headerSection}>
          <Text style={styles.headerTitle}>Settings</Text>
          <TouchableOpacity style={styles.headerBtn} activeOpacity={0.85}>
            <ProfileIcon />
          </TouchableOpacity>
        </Animated.View>

        {/* PROFILE */}
        <Animated.View entering={FadeInUp.duration(500).delay(150).springify()} style={styles.profileCard}>
          <View style={styles.profAv}>
            <Text style={styles.profAvText}>AJ</Text>
            <View style={styles.profBadge}>
              <Text style={styles.profBadgeText}>{'\u2714'}</Text>
            </View>
          </View>
          <View style={styles.profInfo}>
            <Text style={styles.profName}>Adewale Johnson</Text>
            <Text style={styles.profRole}>Farm Owner & Operations Lead</Text>
            <Text style={styles.profFarm}>Adewale Farms</Text>
          </View>
          <TouchableOpacity style={styles.profEdit} activeOpacity={0.7}>
            <EditIcon />
          </TouchableOpacity>
        </Animated.View>

        {/* NOTIFICATIONS */}
        <SettingsSection title="Notifications" rows={NOTIF_ROWS} index={0} toggles={toggles} onToggle={handleToggle} />

        {/* OFFLINE & SYNC */}
        <SettingsSection title="Offline & Sync" rows={SYNC_ROWS} index={1} toggles={toggles} onToggle={handleToggle} onRowPress={handleRowPress} />

        {/* SECURITY & ACCESS */}
        <SettingsSection title="Security & Access" rows={SEC_ROWS} index={2} toggles={toggles} onToggle={handleToggle} onRowPress={handleRowPress} />

        {/* GOONA IQ */}
        <SettingsSection title="GOONA IQ" rows={IQ_ROWS} index={3} toggles={toggles} onToggle={handleToggle} onRowPress={handleRowPress} />

        {/* PREFERENCES */}
        <SettingsSection title="Preferences" rows={PREF_ROWS} index={4} toggles={toggles} onToggle={handleToggle} onRowPress={handleRowPress} />

        {/* HELP & SUPPORT */}
        <SettingsSection title="Help & Support" rows={HELP_ROWS} index={5} toggles={toggles} onToggle={handleToggle} onRowPress={handleRowPress} />

        {/* DANGER ZONE */}
        <Animated.View entering={FadeInUp.duration(500).delay(900).springify()} style={styles.dangerCard}>
          <Text style={styles.dangerTitle}>Account</Text>
          <View style={styles.dangerRow}>
            <Text style={styles.dangerLabel}>Logout</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.dangerAction}>Logout</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.dangerRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.dangerLabel}>Delete Account</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.dangerAction}>Delete</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <BottomTabBar />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9F5' },

  /* bg */
  bgBlob: { position: 'absolute', top: -50, right: -50, width: 320, height: 320, zIndex: 0 },
  bgBlobInner: { width: 320, height: 320, borderRadius: 160, backgroundColor: 'rgba(0,105,92,0.08)' },
  bgContour1: { position: 'absolute', top: '10%', right: '-15%', width: 380, height: 130, zIndex: 0, borderWidth: 1, borderColor: 'rgba(46,125,50,0.05)', borderTopLeftRadius: 190, borderTopRightRadius: 190, borderBottomWidth: 0, transform: [{ rotate: '10deg' }] },
  bgContour2: { position: 'absolute', bottom: '20%', left: '-10%', width: 300, height: 100, zIndex: 0, borderWidth: 1, borderColor: 'rgba(46,125,50,0.05)', borderBottomLeftRadius: 150, borderBottomRightRadius: 150, borderTopWidth: 0, transform: [{ rotate: '-8deg' }] },
  bgDotGrid: { position: 'absolute', inset: 0, zIndex: 0, opacity: 0.4 },
  bgDot: { position: 'absolute', width: 2, height: 2, borderRadius: 1, backgroundColor: 'rgba(0,105,92,0.1)' },

  /* scroll */
  scroll: { flex: 1, zIndex: 1 },
  scrollInner: { paddingHorizontal: 24, paddingTop: 0 },

  /* top nav */
  topNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 54 },
  navBack: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  navLogo: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  navLogoText: { fontWeight: '700', fontSize: 14, color: '#1B1B1B' },
  navLabel: { fontSize: 14, fontWeight: '500', color: '#616161' },

  /* header */
  headerSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 },
  headerTitle: { fontWeight: '800', fontSize: 30, lineHeight: 36, color: '#1F2937' },
  headerBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.7)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 },

  /* profile card */
  profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 30, padding: 22, shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.04, shadowRadius: 36, elevation: 3, marginTop: 20 },
  profAv: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#00695C', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' },
  profAvText: { color: '#fff', fontWeight: '700', fontSize: 22 },
  profBadge: { position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, borderRadius: 9, backgroundColor: '#AEEA00', borderWidth: 2, borderColor: 'white', alignItems: 'center', justifyContent: 'center' },
  profBadgeText: { fontSize: 8, color: '#1A2E00', fontWeight: '800' },
  profInfo: { flex: 1, marginLeft: 16 },
  profName: { fontWeight: '700', fontSize: 16, color: '#1B1B1B' },
  profRole: { fontSize: 12, color: '#64748B', marginTop: 1 },
  profFarm: { fontSize: 12, color: '#00695C', fontWeight: '600', marginTop: 2 },
  profEdit: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },

  /* danger */
  dangerCard: { borderRadius: 24, backgroundColor: 'rgba(254,202,202,0.15)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.06)', padding: 16, marginTop: 22 },
  dangerTitle: { fontWeight: '700', fontSize: 13, color: '#991B1B', marginBottom: 4, paddingHorizontal: 4 },
  dangerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: 'rgba(239,68,68,0.06)' },
  dangerLabel: { fontSize: 13, fontWeight: '600', color: '#991B1B' },
  dangerAction: { fontSize: 12, color: '#DC2626', fontWeight: '500', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 8, overflow: 'hidden' },
})
