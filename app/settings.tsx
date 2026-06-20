import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, Switch, ScrollView,
  StyleSheet, Dimensions, Alert, Modal, TextInput, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from 'react-native'
import GoonaIcon from '../components/ui/GoonaIcon'
import { ArrowLeft, Bell, Clock, Users, Sparkles, BarChart3, RefreshCw, CloudOff, Server, Phone, Key, Smile, FileText, AlertTriangle, Globe, Moon, Wallet, HelpCircle, MessageSquare, Shield, Info, ChevronRight, Pencil, User, X, Check, Sprout, MapPin, Award, Fingerprint, Building2 } from 'lucide-react-native'
import { StatusBar } from 'expo-status-bar'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
  FadeInUp, SlideInUp, FadeIn,
} from 'react-native-reanimated'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import BottomDock from '../components/navigation/BottomDock'
import { useSettingsStore } from '../store/useSettingsStore'
import { useAuthStore } from '../store/useAuthStore'
import { useWalletStore } from '../store/useWalletStore'

const { width: SW } = Dimensions.get('window')
const IS_SMALL = SW < 375



/* ─── Press Scale ─── */
function usePressScale() {
  const scale = useSharedValue(1)
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
  return { style, onPressIn: () => { scale.value = withSpring(0.97, { damping: 15, stiffness: 200 }) }, onPressOut: () => { scale.value = withSpring(1, { damping: 15, stiffness: 200 }) } }
}

/* ─── Toggle ─── */
function StyledSwitch({ value, onToggle }: { value: boolean; onToggle: () => void }) {
  const translateX = useSharedValue(value ? 18 : 0)
  useEffect(() => { translateX.value = withSpring(value ? 18 : 0, { damping: 14, stiffness: 180 }) }, [value])
  const thumbStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }))
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onToggle() }} style={{ width: 42, height: 24, borderRadius: 12, justifyContent: 'center', paddingHorizontal: 3, backgroundColor: value ? '#2E7D32' : '#E2E8F0' }}>
      <Animated.View style={[{ width: 18, height: 18, borderRadius: 9, backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 3, elevation: 2 }, thumbStyle]} />
    </TouchableOpacity>
  )
}

/* ─── Icon Wrapper ─── */
function icBg(color: string, node: React.ReactNode) {
  return <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>{node}</View>
}

/* ─── Setting Row ─── */
function SettingRow({ icon, title, desc, right, onPress }: { icon: React.ReactNode; title: string; desc: string; right: React.ReactNode; onPress?: () => void }) {
  const ps = usePressScale()
  return (
    <Animated.View style={ps.style}>
      <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16, minHeight: 52, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }} activeOpacity={0.7} onPress={onPress} onPressIn={ps.onPressIn} onPressOut={ps.onPressOut}>
        <View style={{ width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</View>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={{ fontSize: IS_SMALL ? 12 : 13, fontWeight: '600', color: '#1B1B1B' }} numberOfLines={1}>{title}</Text>
          <Text style={{ fontSize: IS_SMALL ? 10 : 11, color: '#94A3B8', marginTop: 1 }} numberOfLines={1}>{desc}</Text>
        </View>
        <View style={{ flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 8 }}>{right}</View>
      </TouchableOpacity>
    </Animated.View>
  )
}

/* ─── Section ─── */
function SettingsSection({ title, rows, index }: { title: string; rows: { key: string; icon: React.ReactNode; title: string; desc: string; right: React.ReactNode; onPress?: () => void }[]; index: number }) {
  return (
    <Animated.View entering={FadeInUp.duration(500).delay(300 + index * 100).springify()} style={{ marginTop: IS_SMALL ? 16 : 22 }}>
      <Text style={{ fontWeight: '700', fontSize: IS_SMALL ? 13 : 14, color: '#00695C', marginBottom: 8, paddingHorizontal: 4, letterSpacing: 0.3 }}>{title}</Text>
      <View style={{ backgroundColor: 'white', borderRadius: 22, paddingVertical: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.03, shadowRadius: 20, elevation: 2, overflow: 'hidden' }}>
        {rows.map((row) => (
          <SettingRow key={row.key} icon={row.icon} title={row.title} desc={row.desc} right={row.right} onPress={row.onPress} />
        ))}
      </View>
    </Animated.View>
  )
}

/* ─── Badge ─── */
function Badge({ text }: { text: string }) {
  return <Text style={{ fontSize: 10, color: '#00695C', fontWeight: '600', backgroundColor: 'rgba(0,105,92,0.05)', paddingVertical: 2, paddingHorizontal: 10, borderRadius: 50 }}>{text}</Text>
}

/* ─── Modal Shell ─── */
function ModalShell({ visible, onClose, title, children }: { visible: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
          <Animated.View entering={SlideInUp.duration(350).springify().damping(20)} style={{ backgroundColor: 'white', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, maxHeight: '85%' }}>
            <View style={{ alignItems: 'center', marginBottom: 8 }}><View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB' }} /></View>
            <TouchableOpacity onPress={onClose} style={{ position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}><GoonaIcon icon={X} size={18} color="#94A3B8" /></TouchableOpacity>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#1F2937', marginBottom: 20 }}>{title}</Text>
            {children}
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

/* ─── Save Button ─── */
function SaveButton({ onPress, label = 'Save Changes' }: { onPress: () => void; label?: string }) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={{ borderRadius: 14, overflow: 'hidden', marginTop: 8 }}>
      <LinearGradient colors={['#2E7D32', '#1B5E20']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 14, alignItems: 'center' }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>{label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  )
}

/* ─── Field ─── */
function FormField({ label, value, onChange, secure, multiline, keyboardType }: { label: string; value: string; onChange: (t: string) => void; secure?: boolean; multiline?: boolean; keyboardType?: 'default' | 'phone-pad' | 'email-address' }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 4 }}>{label}</Text>
      <TextInput style={{ backgroundColor: '#F8FAF7', borderRadius: 12, paddingHorizontal: 14, paddingVertical: multiline ? 10 : 12, fontSize: 15, color: '#1F2937', borderWidth: 1, borderColor: '#E2E8F0', minHeight: multiline ? 60 : undefined, textAlignVertical: multiline ? 'top' : undefined }} value={value} onChangeText={onChange} secureTextEntry={secure} multiline={multiline} keyboardType={keyboardType} placeholderTextColor="#CBD5E1" />
    </View>
  )
}

/* ─── MAIN ─── */
export default function SettingsScreen() {
  const insets = useSafeAreaInsets()
  const store = useSettingsStore()
  const authRole = useAuthStore((s) => s.role)
  const walletStatus = useWalletStore((s) => s.walletStatus)
  const kyc = useWalletStore((s) => s.kyc)

  /* modal visibility */
  const [modals, setModals] = useState({ profile: false, pin: false, iq: false, recapt: false, worker: false, sim: false, theme: false })

  const open = (key: string) => setModals((p) => ({ ...p, [key]: true }))
  const close = (key: string) => setModals((p) => ({ ...p, [key]: false }))

  /* sync state */
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'done' | 'error'>('idle')
  const [backupState, setBackupState] = useState<'idle' | 'backing' | 'done'>('idle')

  const handleSync = async () => {
    setSyncState('syncing')
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    await new Promise((r) => setTimeout(r, 2000))
    store.triggerSync()
    setSyncState('done')
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    setTimeout(() => setSyncState('idle'), 1500)
  }

  const handleBackup = async () => {
    setBackupState('backing')
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    await new Promise((r) => setTimeout(r, 1500))
    setBackupState('done')
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    setTimeout(() => setBackupState('idle'), 1500)
  }

  const initials = store.profile.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  const lastSyncAgo = store.data.lastSync ? Math.floor((Date.now() - new Date(store.data.lastSync).getTime()) / 60000) : 0
  const syncBadge = lastSyncAgo < 2 ? 'Up to date' : `${lastSyncAgo}m ago`

  /* ─── Row builders ─── */
  const notifRows = [
    { key: 'push', icon: icBg('rgba(0,105,92,0.06)', <GoonaIcon icon={Bell} size={16} color="#00695C" />), title: 'Push Notifications', desc: 'Receive alerts on your device', right: <StyledSwitch value={store.notifications.push} onToggle={() => store.toggleNotif('push')} /> },
    { key: 'reminder', icon: icBg('rgba(0,105,92,0.06)', <GoonaIcon icon={Clock} size={16} color="#00695C" />), title: 'Reminder Alerts', desc: 'Feeding, health, and task reminders', right: <StyledSwitch value={store.notifications.reminder} onToggle={() => store.toggleNotif('reminder')} /> },
    { key: 'recapReminders', icon: icBg('rgba(0,105,92,0.06)', <GoonaIcon icon={Wallet} size={16} color="#00695C" />), title: 'Recapt Reminders', desc: 'Weekly recapt contribution alerts', right: <StyledSwitch value={store.notifications.recapReminders} onToggle={() => store.toggleNotif('recapReminders')} /> },
    { key: 'recovery', icon: icBg('rgba(0,105,92,0.06)', <GoonaIcon icon={Bell} size={16} color="#00695C" />), title: 'Recapt Notifications', desc: 'Contribution tracking and readiness alerts', right: <StyledSwitch value={store.notifications.recoveryNotifications} onToggle={() => store.toggleNotif('recoveryNotifications')} /> },
    { key: 'financial', icon: icBg('rgba(0,105,92,0.06)', <GoonaIcon icon={Wallet} size={16} color="#00695C" />), title: 'Financial Notifications', desc: 'Sales, expenses, and profit alerts', right: <StyledSwitch value={store.notifications.financialNotifications} onToggle={() => store.toggleNotif('financialNotifications')} /> },
    { key: 'iqAlerts', icon: icBg('rgba(0,105,92,0.06)', <GoonaIcon icon={Sparkles} size={16} color="#00695C" />), title: 'GOONA IQ Alerts', desc: 'AI-powered operational insights', right: <StyledSwitch value={store.notifications.iqAlerts} onToggle={() => store.toggleNotif('iqAlerts')} /> },
    { key: 'worker', icon: icBg('rgba(0,105,92,0.06)', <GoonaIcon icon={Users} size={16} color="#00695C" />), title: 'Worker Activity Updates', desc: 'Get notified when workers log changes', right: <StyledSwitch value={store.notifications.worker} onToggle={() => store.toggleNotif('worker')} /> },
    { key: 'batch', icon: icBg('rgba(0,105,92,0.06)', <GoonaIcon icon={BarChart3} size={16} color="#00695C" />), title: 'Batch Health Alerts', desc: 'Critical batch health notifications', right: <StyledSwitch value={store.notifications.batch} onToggle={() => store.toggleNotif('batch')} /> },
  ]

  const recaptRows = [
    { key: 'recaptEnabled', icon: icBg('#F1F5F9', <GoonaIcon icon={Clock} size={16} color="#00695C" />), title: 'Recapt Reminders', desc: store.recaptReminders.enabled ? 'Enabled' : 'Disabled', right: <StyledSwitch value={store.recaptReminders.enabled} onToggle={() => store.setRecaptEnabled(!store.recaptReminders.enabled)} /> },
    { key: 'recaptFreq', icon: icBg('#F1F5F9', <GoonaIcon icon={Bell} size={16} color="#00695C" />), title: 'Reminder Frequency', desc: `Current: ${store.recaptReminders.frequency}`, right: <Text style={{ fontSize: 12, fontWeight: '600', color: '#2E7D32' }} onPress={() => open('recapt')}>{store.recaptReminders.frequency}</Text>, onPress: () => open('recapt') },
  ]

  const secRows = [
    { key: 'changepin', icon: icBg('#F1F5F9', <GoonaIcon icon={Key} size={16} color="#64748B" />), title: 'Change PIN', desc: store.security.pinProtection ? 'PIN enabled' : 'Set up PIN protection', right: <Text style={{ fontSize: 12, fontWeight: '600', color: '#2E7D32' }} onPress={() => open('pin')}>Change</Text>, onPress: () => open('pin') },
    { key: 'biometric', icon: icBg('rgba(99,102,241,0.06)', <GoonaIcon icon={Smile} size={16} color="#6366F1" />), title: 'Biometric Authentication', desc: store.security.biometric ? 'Face ID / Fingerprint enabled' : 'Set up biometric login', right: <GoonaIcon icon={ChevronRight} size={14} color="#CBD5E1" />, onPress: () => router.push('/biometric-auth' as any) },
    { key: 'pinProtection', icon: icBg('#F1F5F9', <GoonaIcon icon={Shield} size={16} color="#64748B" />), title: 'PIN Protection', desc: 'Require PIN to open app', right: <StyledSwitch value={store.security.pinProtection} onToggle={() => store.toggleSecurity('pinProtection')} /> },
    { key: 'devices', icon: icBg('#F1F5F9', <GoonaIcon icon={Phone} size={16} color="#64748B" />), title: 'Device Management', desc: 'Manage connected devices', right: <GoonaIcon icon={ChevronRight} size={14} color="#CBD5E1" />, onPress: () => Alert.alert('Device Management', 'You have 2 connected devices.\n\n• iPhone 15 Pro\n• Samsung Galaxy Tab') },
    { key: 'sessions', icon: icBg('#F1F5F9', <GoonaIcon icon={FileText} size={16} color="#64748B" />), title: 'Login Sessions', desc: 'Manage active sessions', right: <GoonaIcon icon={ChevronRight} size={14} color="#CBD5E1" />, onPress: () => Alert.alert('Active Sessions', '1 active session\nLast login: Today 9:30 AM') },
    ...(authRole === 'Owner' ? [{ key: 'killswitch', icon: icBg('rgba(239,68,68,0.06)', <GoonaIcon icon={AlertTriangle} size={16} color="#DC2626" />), title: 'Remote Kill Switch', desc: 'Revoke all device access', right: <GoonaIcon icon={ChevronRight} size={14} color="#CBD5E1" />, onPress: () => router.push('/kill-switch' as any) }] : []),
  ]

  const walletLabel = walletStatus === 'activated' ? 'Activated' : walletStatus === 'pending' ? 'Verification Pending' : 'Not Activated'
  const walletIcon = walletStatus === 'activated' ? Check : walletStatus === 'pending' ? Clock : Wallet

  const walletRows = [
    { key: 'wallet', icon: icBg('rgba(0,105,92,0.06)', <GoonaIcon icon={Wallet} size={16} color="#00695C" />), title: 'GOONA Wallet', desc: `Status: ${walletLabel}`, right: <Text style={{ fontSize: 12, fontWeight: '600', color: '#2E7D32' }} onPress={() => router.push('/wallet-activation')}>{walletStatus === 'activated' ? 'Manage' : 'Activate'}</Text>, onPress: () => router.push('/wallet-activation') },
    { key: 'verification', icon: icBg('rgba(0,105,92,0.06)', <GoonaIcon icon={Award} size={16} color="#00695C" />), title: 'Verification Center', desc: `${kyc.step1.completed ? '\u2713 ' : ''}${kyc.step2.completed ? 'BVN ' : ''}${kyc.step3.completed ? 'NIN ' : ''}${kyc.step4.completed ? 'Selfie ' : ''}${kyc.step5.completed ? 'Biz' : ''}`.trim() || 'Not started', right: <GoonaIcon icon={ChevronRight} size={14} color="#CBD5E1" />, onPress: () => router.push('/verification-center') },
  ]

  const dataRows = [
    { key: 'autosync', icon: icBg('#F1F5F9', <GoonaIcon icon={RefreshCw} size={16} color="#64748B" />), title: 'Auto Sync', desc: 'Automatically sync farm data', right: <StyledSwitch value={store.data.autosync} onToggle={() => store.toggleData('autosync')} /> },
    { key: 'offline', icon: icBg('#F1F5F9', <GoonaIcon icon={CloudOff} size={16} color="#64748B" />), title: 'Offline Mode', desc: store.data.offline ? `${store.data.offlineQueue} items in queue` : 'Work without internet', right: <StyledSwitch value={store.data.offline} onToggle={() => store.toggleData('offline')} /> },
    { key: 'syncnow', icon: icBg('#F1F5F9', <GoonaIcon icon={RefreshCw} size={16} color="#64748B" />), title: 'Sync Now', desc: `Last sync: ${syncBadge}`, right: syncState === 'syncing' ? <ActivityIndicator size="small" color="#2E7D32" /> : syncState === 'done' ? <GoonaIcon icon={Check} size={18} color="#16A34A" /> : <Text style={{ fontSize: 12, fontWeight: '600', color: '#2E7D32' }} onPress={handleSync}>Sync</Text>, onPress: syncState === 'idle' ? handleSync : undefined },
    { key: 'backup', icon: icBg('#F1F5F9', <GoonaIcon icon={Server} size={16} color="#64748B" />), title: 'Backup Data', desc: backupState === 'done' ? 'Backup complete' : 'Create a backup of all farm data', right: backupState === 'backing' ? <ActivityIndicator size="small" color="#2E7D32" /> : backupState === 'done' ? <GoonaIcon icon={Check} size={18} color="#16A34A" /> : <Text style={{ fontSize: 12, fontWeight: '600', color: '#2E7D32' }} onPress={handleBackup}>Back Up</Text>, onPress: backupState === 'idle' ? handleBackup : undefined },
  ]

  const iqRows = [
    { key: 'dailychallenge', icon: icBg('rgba(174,234,0,0.06)', <GoonaIcon icon={Clock} size={16} color="#AEEA00" />), title: 'Daily Challenges', desc: 'Get daily operational scenarios', right: <StyledSwitch value={store.iq.dailychallenge} onToggle={() => store.toggleIq('dailychallenge')} /> },
    { key: 'leaderboard', icon: icBg('rgba(174,234,0,0.06)', <GoonaIcon icon={Sparkles} size={16} color="#AEEA00" />), title: 'Leaderboard Visibility', desc: 'Show your farm on rankings', right: <StyledSwitch value={store.iq.leaderboard} onToggle={() => store.toggleIq('leaderboard')} /> },
    { key: 'aiprefs', icon: icBg('rgba(174,234,0,0.06)', <GoonaIcon icon={BarChart3} size={16} color="#AEEA00" />), title: 'AI Preferences', desc: `Sensitivity ${store.iq.aiSensitivity}/5 · Freq ${store.iq.recommendationFrequency}/5`, right: <Text style={{ fontSize: 12, fontWeight: '600', color: '#2E7D32' }} onPress={() => open('iq')}>Configure</Text>, onPress: () => open('iq') },
  ]

  const workerRows = [
    { key: 'wp', icon: icBg('#F1F5F9', <GoonaIcon icon={Users} size={16} color="#00695C" />), title: 'Worker Permissions', desc: store.workerPermissions.workerPermissions ? 'Enabled' : 'Disabled', right: <StyledSwitch value={store.workerPermissions.workerPermissions} onToggle={() => store.toggleWorkerPermission('workerPermissions')} /> },
    { key: 'sp', icon: icBg('#F1F5F9', <GoonaIcon icon={Shield} size={16} color="#64748B" />), title: 'Supervisor Permissions', desc: store.workerPermissions.supervisorPermissions ? 'Enabled' : 'Disabled', right: <StyledSwitch value={store.workerPermissions.supervisorPermissions} onToggle={() => store.toggleWorkerPermission('supervisorPermissions')} /> },
    { key: 'rm', icon: icBg('#F1F5F9', <GoonaIcon icon={FileText} size={16} color="#64748B" />), title: 'Role Management', desc: store.workerPermissions.roleManagement ? 'Enabled' : 'Disabled', right: <StyledSwitch value={store.workerPermissions.roleManagement} onToggle={() => store.toggleWorkerPermission('roleManagement')} /> },
    { key: 'wv', icon: icBg('#F1F5F9', <GoonaIcon icon={Globe} size={16} color="#64748B" />), title: 'Workforce Visibility', desc: store.workerPermissions.workforceVisibility ? 'Visible on dashboard' : 'Hidden', right: <StyledSwitch value={store.workerPermissions.workforceVisibility} onToggle={() => store.toggleWorkerPermission('workforceVisibility')} /> },
  ]

  const helpRows = [
    { key: 'helpcenter', icon: icBg('#F1F5F9', <GoonaIcon icon={HelpCircle} size={16} color="#64748B" />), title: 'Help Center', desc: 'Guides and FAQs', right: <GoonaIcon icon={ChevronRight} size={14} color="#CBD5E1" />, onPress: () => router.push('/goona-academy' as any) },
    { key: 'support', icon: icBg('#F1F5F9', <GoonaIcon icon={MessageSquare} size={16} color="#64748B" />), title: 'Contact Support', desc: 'support@goona.farm', right: <GoonaIcon icon={ChevronRight} size={14} color="#CBD5E1" />, onPress: () => Alert.alert('Contact Support', 'Email: support@goona.farm\nResponse time: within 24 hours') },
    { key: 'privacy', icon: icBg('#F1F5F9', <GoonaIcon icon={Shield} size={16} color="#64748B" />), title: 'Privacy Policy', desc: 'How we handle your data', right: <GoonaIcon icon={ChevronRight} size={14} color="#CBD5E1" />, onPress: () => Alert.alert('Privacy Policy', 'Your farm data is encrypted end-to-end. We never share your data with third parties.') },
    { key: 'terms', icon: icBg('#F1F5F9', <GoonaIcon icon={FileText} size={16} color="#64748B" />), title: 'Terms & Conditions', desc: 'Service agreement', right: <GoonaIcon icon={ChevronRight} size={14} color="#CBD5E1" />, onPress: () => Alert.alert('Terms & Conditions', 'GOONA Farm Operating System v2.4.1\nLicensed to you. All rights reserved.') },
    { key: 'version', icon: icBg('#F1F5F9', <GoonaIcon icon={Info} size={16} color="#64748B" />), title: 'App Version', desc: 'GOONA v2.4.1', right: <Badge text="v2.4.1" /> },
  ]

  const themeRows = [
    { key: 'reducedMotion', icon: icBg('#F1F5F9', <GoonaIcon icon={Moon} size={16} color="#64748B" />), title: 'Reduced Motion', desc: 'Minimize animations', right: <StyledSwitch value={store.theme.reducedMotion} onToggle={() => store.setThemePref('reducedMotion', !store.theme.reducedMotion)} /> },
    { key: 'darkMode', icon: icBg('#F1F5F9', <GoonaIcon icon={Moon} size={16} color="#64748B" />), title: 'Dark Mode', desc: 'Use dark color scheme', right: <StyledSwitch value={store.theme.darkMode} onToggle={() => store.setThemePref('darkMode', !store.theme.darkMode)} /> },
    { key: 'theme', icon: icBg('#F1F5F9', <GoonaIcon icon={Moon} size={16} color="#64748B" />), title: 'Theme Settings', desc: `Animation: ${store.theme.animationIntensity}/5 · Density: ${store.theme.uiDensity}`, right: <Text style={{ fontSize: 12, fontWeight: '600', color: '#2E7D32' }} onPress={() => open('theme')}>Configure</Text>, onPress: () => open('theme') },
  ]

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => { store.resetAll(); useAuthStore.getState().logout(); router.replace('/(auth)/login') } },
    ])
  }

  const handleDeleteAccount = () => {
    Alert.alert('Delete Account', 'This action is irreversible. All your farm data will be permanently deleted.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete Everything', style: 'destructive', onPress: () => { store.resetAll(); useAuthStore.getState().logout(); router.replace('/(auth)/register') } },
    ])
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: '#F8F9F5' }}>
      <StatusBar style="dark" />
      <View style={{ position: 'absolute', top: -50, right: -50, width: 320, height: 320, zIndex: 0 }} pointerEvents="none">
        <View style={{ width: 320, height: 320, borderRadius: 160, backgroundColor: 'rgba(0,105,92,0.08)' }} />
      </View>

      <ScrollView style={{ flex: 1, zIndex: 1 }} contentContainerStyle={{ paddingHorizontal: IS_SMALL ? 16 : 24, paddingTop: 0, paddingBottom: insets.bottom + 120 }} showsVerticalScrollIndicator={false}>
        {/* TOP NAV */}
        <Animated.View entering={FadeInUp.duration(500).springify()} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: IS_SMALL ? 44 : 54 }}>
          <TouchableOpacity style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10 }} activeOpacity={0.7} onPress={() => router.back()}><GoonaIcon icon={ArrowLeft} size={22} color="#1B1B1B" /></TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <GoonaIcon icon={Sprout} size={22} color="#00695C" />
            <Text style={{ fontWeight: '700', fontSize: 14, color: '#1B1B1B' }}>GOONA</Text>
          </View>
          <Text style={{ fontSize: 14, fontWeight: '500', color: '#616161' }}>Settings</Text>
        </Animated.View>

        {/* HEADER */}
        <Animated.View entering={FadeInUp.duration(500).delay(80).springify()} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: IS_SMALL ? 14 : 20 }}>
          <Text style={{ fontWeight: '800', fontSize: IS_SMALL ? 26 : 30, lineHeight: IS_SMALL ? 32 : 36, color: '#1F2937' }}>Settings</Text>
          <TouchableOpacity activeOpacity={0.85} onPress={() => open('profile')} style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.7)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 }}>
            <GoonaIcon icon={User} size={18} color="#1F2937" />
          </TouchableOpacity>
        </Animated.View>

        {/* PROFILE */}
        <BlurView intensity={20} tint="light" style={{ borderRadius: 30, overflow: 'hidden', marginTop: 20 }}>
          <TouchableOpacity activeOpacity={0.9} onPress={() => open('profile')} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 30, padding: IS_SMALL ? 18 : 22 }}>
            <View style={{ width: IS_SMALL ? 50 : 56, height: IS_SMALL ? 50 : 56, borderRadius: IS_SMALL ? 25 : 28, backgroundColor: '#00695C', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: IS_SMALL ? 20 : 22 }}>{initials}</Text>
              <View style={{ position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, borderRadius: 9, backgroundColor: '#AEEA00', borderWidth: 2, borderColor: 'white', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 8, color: '#1A2E00', fontWeight: '800' }}>{'\u2714'}</Text>
              </View>
            </View>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={{ fontWeight: '700', fontSize: IS_SMALL ? 15 : 16, color: '#1B1B1B' }}>{store.profile.name}</Text>
              <Text style={{ fontSize: 12, color: '#64748B', marginTop: 1 }}>{store.profile.role}</Text>
              <Text style={{ fontSize: 12, color: '#00695C', fontWeight: '600', marginTop: 2 }}>{store.profile.farmName}</Text>
            </View>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><GoonaIcon icon={Pencil} size={16} color="#64748B" /></View>
          </TouchableOpacity>
        </BlurView>

        <SettingsSection title="Notifications" rows={notifRows} index={0} />
        <SettingsSection title="Recapt & Readiness" rows={recaptRows} index={1} />
        <SettingsSection title="Workforce & Permissions" rows={workerRows} index={2} />
        <SettingsSection title="Data & Sync" rows={dataRows} index={3} />
        <SettingsSection title="Security & Access" rows={secRows} index={4} />
        <SettingsSection title="GOONA Wallet" rows={walletRows} index={5} />
        <SettingsSection title="Farm Boundaries" rows={[
          { key: 'boundaries', icon: icBg('rgba(0,105,92,0.06)', <GoonaIcon icon={MapPin} size={16} color="#00695C" />), title: 'Farm Boundaries', desc: 'Manage geofences, zones, and restricted areas', right: <GoonaIcon icon={ChevronRight} size={14} color="#CBD5E1" />, onPress: () => router.push('/farm-boundaries' as any) },
        ]} index={6} />
        <SettingsSection title="GOONA IQ" rows={iqRows} index={7} />
        <SettingsSection title="Theme & Experience" rows={themeRows} index={8} />
        <SettingsSection title="Help & Support" rows={helpRows} index={9} />

        {/* DANGER ZONE */}
        <Animated.View entering={FadeInUp.duration(500).delay(900).springify()} style={{ borderRadius: 24, backgroundColor: 'rgba(254,202,202,0.15)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.06)', padding: 16, marginTop: 22 }}>
          <Text style={{ fontWeight: '700', fontSize: 13, color: '#991B1B', marginBottom: 4, paddingHorizontal: 4 }}>Account</Text>
          {[
            { label: 'Logout', action: handleLogout, color: '#DC2626' },
            { label: 'Delete Account', action: handleDeleteAccount, color: '#DC2626' },
          ].map((item) => (
            <View key={item.label} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: 'rgba(239,68,68,0.06)' }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#991B1B' }}>{item.label}</Text>
              <TouchableOpacity activeOpacity={0.7} onPress={item.action}>
                <Text style={{ fontSize: 12, color: item.color, fontWeight: '500', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 8, overflow: 'hidden' }}>{item.label === 'Logout' ? 'Logout' : 'Delete'}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <BottomDock />

      {/* ─── PROFILE EDIT MODAL ─── */}
      <ModalShell visible={modals.profile} onClose={() => close('profile')} title="Edit Profile">
        {(() => {
          const [form, setForm] = useState(store.profile)
          useEffect(() => { setForm(store.profile) }, [modals.profile])
          return (<>
            <FormField label="Full Name" value={form.name} onChange={(t) => setForm({ ...form, name: t })} />
            <FormField label="Role / Title" value={form.role} onChange={(t) => setForm({ ...form, role: t })} />
            <FormField label="Farm Name" value={form.farmName} onChange={(t) => setForm({ ...form, farmName: t })} />
            <FormField label="Email" value={form.email} onChange={(t) => setForm({ ...form, email: t })} keyboardType="email-address" />
            <FormField label="Phone" value={form.phone} onChange={(t) => setForm({ ...form, phone: t })} keyboardType="phone-pad" />
            <FormField label="Location" value={form.location} onChange={(t) => setForm({ ...form, location: t })} />
            <SaveButton onPress={() => { store.updateProfile(form); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); close('profile') }} />
          </>)
        })()}
      </ModalShell>

      {/* ─── CHANGE PIN MODAL ─── */}
      <ModalShell visible={modals.pin} onClose={() => close('pin')} title="Change PIN">
        {(() => {
          const [currentPin, setCurrentPin] = useState('')
          const [newPin, setNewPin] = useState('')
          const [confirmPin, setConfirmPin] = useState('')
          const [pinError, setPinError] = useState('')
          return (<>
            <FormField label={store.security.pinCode ? 'Current PIN' : 'Set New PIN'} value={currentPin} onChange={(t) => { setCurrentPin(t); setPinError('') }} secure />
            <FormField label="New PIN" value={newPin} onChange={(t) => { setNewPin(t); setPinError('') }} secure />
            <FormField label="Confirm New PIN" value={confirmPin} onChange={(t) => { setConfirmPin(t); setPinError('') }} secure />
            {pinError ? <Text style={{ color: '#DC2626', fontSize: 12, marginBottom: 8 }}>{pinError}</Text> : null}
            <SaveButton label="Update PIN" onPress={() => {
              if (store.security.pinCode && currentPin !== store.security.pinCode) { setPinError('Current PIN is incorrect'); return }
              if (newPin.length < 4) { setPinError('PIN must be at least 4 digits'); return }
              if (newPin !== confirmPin) { setPinError('PINs do not match'); return }
              store.setPinCode(newPin)
              store.toggleSecurity('pinProtection')
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
              close('pin')
              setCurrentPin(''); setNewPin(''); setConfirmPin('')
            }} />
          </>)
        })()}
      </ModalShell>

      {/* ─── GOONA IQ MODAL ─── */}
      <ModalShell visible={modals.iq} onClose={() => close('iq')} title="GOONA IQ Preferences">
        {(() => {
          const iq = useSettingsStore((s) => s.iq)
          return (<>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontSize: 13, fontWeight: '500', color: '#1F2937' }}>AI Sensitivity</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#2E7D32' }}>{iq.aiSensitivity}/5</Text>
            </View>
            <SliderBar value={iq.aiSensitivity} max={5} onChange={(v) => store.setIqPref('aiSensitivity', v)} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontSize: 13, fontWeight: '500', color: '#1F2937' }}>Recommendation Frequency</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#2E7D32' }}>{iq.recommendationFrequency}/5</Text>
            </View>
            <SliderBar value={iq.recommendationFrequency} max={5} onChange={(v) => store.setIqPref('recommendationFrequency', v)} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontSize: 13, fontWeight: '500', color: '#1F2937' }}>Prediction Intensity</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#2E7D32' }}>{iq.predictionIntensity}/5</Text>
            </View>
            <SliderBar value={iq.predictionIntensity} max={5} onChange={(v) => store.setIqPref('predictionIntensity', v)} />
            <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12 }}>
              <ToggleRow label="Financial Forecasting" value={iq.financialForecasting} onToggle={() => store.toggleIq('financialForecasting')} />
              <ToggleRow label="Operational Alerts" value={iq.operationalAlerts} onToggle={() => store.toggleIq('operationalAlerts')} />
              <ToggleRow label="Coaching Mode" last value={iq.coachingMode} onToggle={() => store.toggleIq('coachingMode')} />
            </View>
            <SaveButton label="Done" onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); close('iq') }} />
          </>)
        })()}
      </ModalShell>

      {/* ─── RECAPT REMINDER MODAL ─── */}
      <ModalShell visible={modals.recapt} onClose={() => close('recapt')} title="Reminder Frequency">
        <Text style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>Choose how often you want recapt reminders.</Text>
        {(['daily', 'weekly', 'monthly'] as const).map((f) => (
          <TouchableOpacity key={f} activeOpacity={0.7} onPress={() => { store.setRecaptFrequency(f); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) }} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
            <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: store.recaptReminders.frequency === f ? '#2E7D32' : '#D1D5DB', alignItems: 'center', justifyContent: 'center' }}>
              {store.recaptReminders.frequency === f && <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#2E7D32' }} />}
            </View>
            <Text style={{ fontSize: 15, fontWeight: '500', color: '#1F2937', textTransform: 'capitalize' }}>{f}</Text>
          </TouchableOpacity>
        ))}
        <SaveButton label="Save" onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); close('recapt') }} />
      </ModalShell>

      {/* ─── THEME MODAL ─── */}
      <ModalShell visible={modals.theme} onClose={() => close('theme')} title="Theme & Experience">
        {(() => {
          const theme = useSettingsStore((s) => s.theme)
          return (<>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontSize: 13, fontWeight: '500', color: '#1F2937' }}>Animation Intensity</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#2E7D32' }}>{theme.animationIntensity}/5</Text>
            </View>
            <SliderBar value={theme.animationIntensity} max={5} onChange={(v) => store.setThemePref('animationIntensity', v)} />
            <ToggleRow label="Reduced Motion" value={theme.reducedMotion} onToggle={() => store.setThemePref('reducedMotion', !theme.reducedMotion)} />
            <ToggleRow label="Dark Mode" value={theme.darkMode} onToggle={() => store.setThemePref('darkMode', !theme.darkMode)} />
            <View style={{ marginTop: 12 }}>
              <Text style={{ fontSize: 13, fontWeight: '500', color: '#1F2937', marginBottom: 8 }}>UI Density</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {['Compact', 'Medium', 'Comfortable'].map((d) => (
                  <TouchableOpacity key={d} activeOpacity={0.7} onPress={() => store.setThemePref('uiDensity', d)} style={{ flex: 1, paddingVertical: 8, borderRadius: 100, backgroundColor: theme.uiDensity === d ? '#2E7D32' : '#F1F5F9', alignItems: 'center' }}>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: theme.uiDensity === d ? '#fff' : '#64748B' }}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <SaveButton label="Done" onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); close('theme') }} />
          </>)
        })()}
      </ModalShell>
    </KeyboardAvoidingView>
  )
}

/* ─── Slider ─── */
function SliderBar({ value, max, onChange }: { value: number; max: number; onChange: (v: number) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6, marginBottom: 14 }}>
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
        <TouchableOpacity key={n} activeOpacity={0.7} onPress={() => onChange(n)} style={{ flex: 1, height: 28, borderRadius: 6, backgroundColor: n <= value ? '#2E7D32' : '#E2E8F0', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: n <= value ? '#fff' : '#94A3B8' }}>{n}</Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

/* ─── ToggleRow ─── */
function ToggleRow({ label, value, onToggle, last }: { label: string; value: boolean; onToggle: () => void; last?: boolean }) {
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onToggle} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: last ? 0 : 1, borderBottomColor: '#F1F5F9' }}>
      <Text style={{ fontSize: 14, fontWeight: '500', color: '#1F2937' }}>{label}</Text>
      <StyledSwitch value={value} onToggle={onToggle} />
    </TouchableOpacity>
  )
}
