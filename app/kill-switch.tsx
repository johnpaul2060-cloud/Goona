import React, { useState, useMemo, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions,
  TextInput, Modal, KeyboardAvoidingView, Platform,
} from 'react-native'
import GoonaIcon from '../components/ui/GoonaIcon'
import { Icons } from '../shared/icons'
import { StatusBar } from 'expo-status-bar'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import Animated, { FadeInUp, SlideInUp } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import BottomDock from '../components/navigation/BottomDock'
import { useAuthStore } from '../store/useAuthStore'
import { useSettingsStore } from '../store/useSettingsStore'
import UserAccessCard, { type FarmUser } from '../components/KillSwitch/UserAccessCard'
import SecurityAuditLog, { type AuditEntry } from '../components/KillSwitch/SecurityAuditLog'
import BiometricGate from '../components/Biometric/BiometricGate'

const { width: SW } = Dimensions.get('window')
const IS_SMALL = SW < 375

const MOCK_USERS: FarmUser[] = [
  { id: '1', name: 'Adewale Johnson', email: 'adewale@goona.farm', role: 'Owner', status: 'Active' },
  { id: '2', name: 'Chidi Okonkwo', email: 'chidi@goona.farm', role: 'Manager', status: 'Active' },
  { id: '3', name: 'Fatima Bello', email: 'fatima@goona.farm', role: 'Manager', status: 'Active' },
  { id: '4', name: 'Emeka Okafor', email: 'emeka@goona.farm', role: 'Worker', status: 'Active' },
  { id: '5', name: 'Ngozi Eze', email: 'ngozi@goona.farm', role: 'Worker', status: 'Active' },
  { id: '6', name: 'Tunde Balogun', email: 'tunde@goona.farm', role: 'Worker', status: 'Active' },
  { id: '7', name: 'Mary Smith', email: 'mary@goona.farm', role: 'Worker', status: 'Suspended' },
  { id: '8', name: 'John Doe', email: 'john@goona.farm', role: 'Worker', status: 'Revoked' },
]

const MOCK_AUDIT: AuditEntry[] = [
  { id: 'a1', userName: 'John Doe', action: 'Access Revoked', date: '12 June 2026', time: '10:42 AM' },
  { id: 'a2', userName: 'Mary Smith', action: 'Access Suspended', date: '10 June 2026', time: '3:20 PM' },
]

type FilterType = 'All Users' | 'Active' | 'Suspended' | 'Revoked' | 'Managers' | 'Workers'

const FILTERS: FilterType[] = ['All Users', 'Active', 'Suspended', 'Revoked', 'Managers', 'Workers']

function ModalShell({ visible, onClose, title, children }: { visible: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
          <Animated.View entering={SlideInUp.duration(350).springify().damping(20)} style={{ backgroundColor: 'white', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, maxHeight: '85%' }}>
            <View style={{ alignItems: 'center', marginBottom: 8 }}><View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB' }} /></View>
            <TouchableOpacity onPress={onClose} style={{ position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}><GoonaIcon icon={Icons.x} size={18} color="#94A3B8" /></TouchableOpacity>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#1F2937', marginBottom: 20 }}>{title}</Text>
            {children}
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

export default function KillSwitchScreen() {
  const insets = useSafeAreaInsets()
  const authRole = useAuthStore((s) => s.role)
  const isOwner = authRole === 'Owner'
  const bioEnrolled = useAuthStore((s) => s.biometricEnrolled)
  const authenticatedSession = useAuthStore((s) => s.authenticatedSession)
  const setAuthenticatedSession = useAuthStore((s) => s.setAuthenticatedSession)
  const bioSetting = useSettingsStore((s) => s.security.biometric)

  const [showBioGate, setShowBioGate] = useState(false)
  const [bioGatePassed, setBioGatePassed] = useState(authenticatedSession)

  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterType>('All Users')
  const [users, setUsers] = useState<FarmUser[]>(MOCK_USERS)
  const [auditLog, setAuditLog] = useState<AuditEntry[]>(MOCK_AUDIT)

  const [selectedUser, setSelectedUser] = useState<FarmUser | null>(null)
  const [showSuspendModal, setShowSuspendModal] = useState(false)
  const [showRevokeModal, setShowRevokeModal] = useState(false)
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [revokeTyped, setRevokeTyped] = useState('')
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  useEffect(() => {
    if (isOwner && bioEnrolled && bioSetting && !bioGatePassed) {
      setShowBioGate(true)
    } else {
      setBioGatePassed(true)
    }
  }, [])

  const filteredUsers = useMemo(() => {
    let result = [...users]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((u) =>
        u.name.toLowerCase().includes(q) || u.role.toLowerCase().includes(q)
      )
    }

    switch (activeFilter) {
      case 'Active':
        result = result.filter((u) => u.status === 'Active')
        break
      case 'Suspended':
        result = result.filter((u) => u.status === 'Suspended')
        break
      case 'Revoked':
        result = result.filter((u) => u.status === 'Revoked')
        break
      case 'Managers':
        result = result.filter((u) => u.role === 'Manager')
        break
      case 'Workers':
        result = result.filter((u) => u.role === 'Worker')
        break
    }
    return result
  }, [users, search, activeFilter])

  const stats = useMemo(() => {
    const activeWorkers = users.filter((u) => u.role === 'Worker' && u.status === 'Active').length
    const activeManagers = users.filter((u) => u.role === 'Manager' && u.status === 'Active').length
    const suspended = users.filter((u) => u.status === 'Suspended').length
    const revoked = users.filter((u) => u.status === 'Revoked').length
    return { activeWorkers, activeManagers, suspended, revoked }
  }, [users])

  const handleSuspend = (user: FarmUser) => {
    setSelectedUser(user)
    setShowSuspendModal(true)
  }

  const confirmSuspend = () => {
    if (!selectedUser) return
    setUsers((prev) =>
      prev.map((u) => (u.id === selectedUser.id ? { ...u, status: 'Suspended' as const } : u))
    )
    const now = new Date()
    setAuditLog((prev) => [
      { id: `a${Date.now()}`, userName: selectedUser.name, action: 'Access Suspended', date: now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), time: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) },
      ...prev,
    ])
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    setShowSuspendModal(false)
    setSelectedUser(null)
  }

  const handleRevoke = (user: FarmUser) => {
    setSelectedUser(user)
    setShowRevokeModal(true)
    setRevokeTyped('')
  }

  const proceedToRevokeConfirm = () => {
    setShowRevokeModal(false)
    setShowRevokeConfirm(true)
    setRevokeTyped('')
  }

  const confirmRevoke = () => {
    if (!selectedUser) return
    setUsers((prev) =>
      prev.map((u) => (u.id === selectedUser.id ? { ...u, status: 'Revoked' as const } : u))
    )
    const now = new Date()
    setAuditLog((prev) => [
      { id: `a${Date.now()}`, userName: selectedUser.name, action: 'Access Revoked', date: now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), time: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) },
      ...prev,
    ])
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    setShowRevokeConfirm(false)
    setSelectedUser(null)
    setRevokeTyped('')
    setShowSuccessModal(true)
  }

  const handleViewDetails = (user: FarmUser) => {
    setSelectedUser(user)
    setShowDetailsModal(true)
  }

  if (!isOwner) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F8F9F5' }}>
        <StatusBar style="dark" />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <GoonaIcon icon={Icons.shield} size={48} color="#CBD5E1" />
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#1F2937', marginTop: 16 }}>Access Restricted</Text>
          <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 8 }}>Only farm owners can access the Kill Switch.</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.back()} style={{ marginTop: 24, paddingVertical: 12, paddingHorizontal: 32, backgroundColor: '#00695C', borderRadius: 12 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: 'white' }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const needsBioGate = isOwner && bioEnrolled && bioSetting && !bioGatePassed

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: '#F8F9F5' }}>
      <StatusBar style="dark" />
      <View style={{ position: 'absolute', top: -50, right: -50, width: 320, height: 320, zIndex: 0 }} pointerEvents="none">
        <View style={{ width: 320, height: 320, borderRadius: 160, backgroundColor: 'rgba(220,38,38,0.05)' }} />
      </View>

      <View style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1, zIndex: 1 }} contentContainerStyle={{ paddingHorizontal: IS_SMALL ? 16 : 24, paddingTop: 0, paddingBottom: insets.bottom + 120 }} showsVerticalScrollIndicator={false}>
        {/* TOP NAV */}
        <Animated.View entering={FadeInUp.duration(500).springify()} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: IS_SMALL ? 44 : 54 }}>
          <TouchableOpacity style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10 }} activeOpacity={0.7} onPress={() => router.back()}><GoonaIcon icon={Icons.arrowLeft} size={22} color="#1B1B1B" /></TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <GoonaIcon icon={Icons.sprout} size={22} color="#00695C" />
            <Text style={{ fontWeight: '700', fontSize: 14, color: '#1B1B1B' }}>GOONA</Text>
          </View>
          <Text style={{ fontSize: 14, fontWeight: '500', color: '#616161' }}>Kill Switch</Text>
        </Animated.View>

        {/* HEADER */}
        <Animated.View entering={FadeInUp.duration(500).delay(80).springify()} style={{ marginTop: IS_SMALL ? 14 : 20 }}>
          <Text style={{ fontWeight: '800', fontSize: IS_SMALL ? 26 : 30, lineHeight: IS_SMALL ? 32 : 36, color: '#1F2937' }}>Kill Switch</Text>
          <Text style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Manage farm access and protect farm data.</Text>
        </Animated.View>

        {/* SECURITY OVERVIEW */}
        <Animated.View entering={FadeInUp.duration(500).delay(160).springify()} style={{ marginTop: 20, backgroundColor: 'white', borderRadius: 22, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.03, shadowRadius: 20, elevation: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <Text style={{ fontWeight: '700', fontSize: 13, color: '#1F2937' }}>Security Overview</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(22,163,74,0.08)', paddingVertical: 3, paddingHorizontal: 10, borderRadius: 50 }}>
              <GoonaIcon icon={Icons.shieldCheck} size={12} color="#16A34A" />
              <Text style={{ fontSize: 10, fontWeight: '600', color: '#16A34A' }}>Farm Secure</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <StatBox icon={<GoonaIcon icon={Icons.users} size={16} color="#00695C" />} label="Active Workers" value={String(stats.activeWorkers)} color="#00695C" />
            <StatBox icon={<GoonaIcon icon={Icons.userCheck} size={16} color="#6366F1" />} label="Active Managers" value={String(stats.activeManagers)} color="#6366F1" />
            <StatBox icon={<GoonaIcon icon={Icons.alertTriangle} size={16} color="#F59E0B" />} label="Suspended" value={String(stats.suspended)} color="#F59E0B" />
            <StatBox icon={<GoonaIcon icon={Icons.userX} size={16} color="#DC2626" />} label="Revoked" value={String(stats.revoked)} color="#DC2626" />
          </View>
        </Animated.View>

        {/* SEARCH + FILTERS */}
        <Animated.View entering={FadeInUp.duration(500).delay(240).springify()} style={{ marginTop: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 14, paddingHorizontal: 14, height: 44, gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 8, elevation: 1 }}>
            <GoonaIcon icon={Icons.search} size={16} color="#94A3B8" />
            <TextInput
              style={{ flex: 1, fontSize: 14, color: '#1F2937', paddingVertical: 0 }}
              placeholder="Search by name or role..."
              placeholderTextColor="#CBD5E1"
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <GoonaIcon icon={Icons.x} size={16} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }} contentContainerStyle={{ gap: 6 }}>
            {FILTERS.map((f) => (
              <TouchableOpacity
                key={f}
                activeOpacity={0.7}
                onPress={() => setActiveFilter(f)}
                style={{
                  paddingVertical: 6,
                  paddingHorizontal: 14,
                  borderRadius: 50,
                  backgroundColor: activeFilter === f ? '#00695C' : 'white',
                  borderWidth: 1,
                  borderColor: activeFilter === f ? '#00695C' : '#E2E8F0',
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: activeFilter === f ? 'white' : '#64748B' }}>{f}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* USER LIST */}
        <Animated.View entering={FadeInUp.duration(500).delay(320).springify()} style={{ marginTop: 16 }}>
          <Text style={{ fontWeight: '700', fontSize: 13, color: '#00695C', marginBottom: 8, paddingHorizontal: 4, letterSpacing: 0.3 }}>Farm Users ({filteredUsers.length})</Text>
          {filteredUsers.length === 0 ? (
            <View style={{ backgroundColor: 'white', borderRadius: 22, padding: 32, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.03, shadowRadius: 20, elevation: 2 }}>
              <GoonaIcon icon={Icons.users} size={28} color="#CBD5E1" />
              <Text style={{ fontSize: 13, color: '#94A3B8', marginTop: 8 }}>No users match your search.</Text>
            </View>
          ) : (
            filteredUsers.map((user) => (
              <UserAccessCard
                key={user.id}
                user={user}
                isOwner={isOwner}
                onViewDetails={handleViewDetails}
                onSuspend={handleSuspend}
                onRevoke={handleRevoke}
              />
            ))
          )}
        </Animated.View>

        {/* AUDIT LOG */}
        <SecurityAuditLog entries={auditLog} />

        <View style={{ height: 40 }} />
      </ScrollView>

      {needsBioGate && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 }}>
          <BiometricGate
            visible
            onAuthenticated={() => { setShowBioGate(false); setBioGatePassed(true); setAuthenticatedSession(true) }}
            onFallback={() => { setShowBioGate(false); setBioGatePassed(true); setAuthenticatedSession(true) }}
            onClose={() => { setShowBioGate(false); setBioGatePassed(true); setAuthenticatedSession(true) }}
            title="Authenticate to Continue"
            subtitle="Verify your identity to access the Kill Switch."
          />
        </View>
      )}
      </View>

      <BottomDock />

      {/* SUSPEND MODAL */}
      <ModalShell visible={showSuspendModal} onClose={() => { setShowSuspendModal(false); setSelectedUser(null) }} title="Suspend Access">
        {selectedUser && (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16, backgroundColor: '#F8FAF7', borderRadius: 12, padding: 12 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#00695C', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>{selectedUser.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}</Text>
              </View>
              <View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#1F2937' }}>{selectedUser.name}</Text>
                <Text style={{ fontSize: 12, color: '#64748B' }}>{selectedUser.role}</Text>
              </View>
            </View>
            <Text style={{ fontSize: 14, color: '#4B5563', lineHeight: 22 }}>Are you sure you want to suspend this user?</Text>
            <View style={{ marginTop: 8, backgroundColor: 'rgba(245,158,11,0.08)', borderRadius: 10, padding: 12 }}>
              <Text style={{ fontSize: 12, color: '#92400E', lineHeight: 18 }}>
                Result: Status becomes Suspended. User login disabled. Active sessions terminated.
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
              <TouchableOpacity activeOpacity={0.7} onPress={() => { setShowSuspendModal(false); setSelectedUser(null) }} style={{ flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#F1F5F9', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#64748B' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.85} onPress={confirmSuspend} style={{ flex: 1, borderRadius: 14, overflow: 'hidden' }}>
                <LinearGradient colors={['#F59E0B', '#D97706']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 14, alignItems: 'center' }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>Suspend User</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ModalShell>

      {/* REVOKE MODAL - FIRST */}
      <ModalShell visible={showRevokeModal} onClose={() => { setShowRevokeModal(false); setSelectedUser(null); setRevokeTyped('') }} title="Revoke Farm Access">
        {selectedUser && (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16, backgroundColor: '#F8FAF7', borderRadius: 12, padding: 12 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#DC2626', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>{selectedUser.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}</Text>
              </View>
              <View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#1F2937' }}>{selectedUser.name}</Text>
                <Text style={{ fontSize: 12, color: '#64748B' }}>{selectedUser.role}</Text>
              </View>
            </View>
            <Text style={{ fontSize: 14, color: '#4B5563', lineHeight: 22 }}>This action removes the user from farm access immediately.</Text>
            <View style={{ marginTop: 12, backgroundColor: 'rgba(220,38,38,0.06)', borderRadius: 10, padding: 12 }}>
              <Text style={{ fontSize: 12, color: '#991B1B', fontWeight: '500', marginBottom: 6 }}>The user loses access to:</Text>
              {['Farm records', 'Reports', 'Analytics', 'Assigned tasks'].map((item) => (
                <View key={item} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <Text style={{ fontSize: 10, color: '#DC2626' }}>{'\u2B24'}</Text>
                  <Text style={{ fontSize: 12, color: '#991B1B' }}>{item}</Text>
                </View>
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
              <TouchableOpacity activeOpacity={0.7} onPress={() => { setShowRevokeModal(false); setSelectedUser(null); setRevokeTyped('') }} style={{ flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#F1F5F9', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#64748B' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.85} onPress={proceedToRevokeConfirm} style={{ flex: 1, borderRadius: 14, overflow: 'hidden' }}>
                <LinearGradient colors={['#DC2626', '#B91C1C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 14, alignItems: 'center' }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>Continue</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ModalShell>

      {/* REVOKE MODAL - SECOND CONFIRMATION */}
      <ModalShell visible={showRevokeConfirm} onClose={() => { setShowRevokeConfirm(false); setSelectedUser(null); setRevokeTyped('') }} title="Confirm Revocation">
        {selectedUser && (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16, backgroundColor: '#FEF2F2', borderRadius: 12, padding: 12 }}>
              <GoonaIcon icon={Icons.alertTriangle} size={22} color="#DC2626" />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#991B1B' }}>Final Confirmation Required</Text>
                <Text style={{ fontSize: 12, color: '#B91C1C' }}>This action cannot be undone</Text>
              </View>
            </View>
            <Text style={{ fontSize: 14, color: '#4B5563', lineHeight: 22 }}>Type <Text style={{ fontWeight: '700', color: '#DC2626' }}>REVOKE</Text> below to confirm:</Text>
            <TextInput
              style={{ backgroundColor: '#F8FAF7', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: '#1F2937', borderWidth: 1, borderColor: revokeTyped === 'REVOKE' ? '#DC2626' : '#E2E8F0', marginTop: 12, textAlign: 'center', fontWeight: '700', letterSpacing: 2 }}
              value={revokeTyped}
              onChangeText={setRevokeTyped}
              placeholder="Type REVOKE"
              placeholderTextColor="#CBD5E1"
              autoCapitalize="characters"
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
              <TouchableOpacity activeOpacity={0.7} onPress={() => { setShowRevokeConfirm(false); setSelectedUser(null); setRevokeTyped('') }} style={{ flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#F1F5F9', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#64748B' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={confirmRevoke}
                style={{ flex: 1, borderRadius: 14, overflow: 'hidden', opacity: revokeTyped === 'REVOKE' ? 1 : 0.4 }}
                disabled={revokeTyped !== 'REVOKE'}
              >
                <LinearGradient colors={['#DC2626', '#B91C1C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 14, alignItems: 'center' }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>Revoke Access</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ModalShell>

      {/* SUCCESS MODAL */}
      <ModalShell visible={showSuccessModal} onClose={() => setShowSuccessModal(false)} title="Access Revoked Successfully">
        <View style={{ alignItems: 'center', paddingVertical: 16 }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(220,38,38,0.08)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <GoonaIcon icon={Icons.shieldCheck} size={28} color="#DC2626" />
          </View>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 8 }}>Access Revoked Successfully</Text>
          <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 20 }}>User access has been removed.</Text>
          <TouchableOpacity activeOpacity={0.85} onPress={() => setShowSuccessModal(false)} style={{ borderRadius: 14, overflow: 'hidden', marginTop: 20, width: '100%' }}>
            <LinearGradient colors={['#00695C', '#004D40']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 14, alignItems: 'center' }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>Done</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ModalShell>

      {/* DETAILS MODAL */}
      <ModalShell visible={showDetailsModal} onClose={() => { setShowDetailsModal(false); setSelectedUser(null) }} title="User Details">
        {selectedUser && (
          <>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: selectedUser.role === 'Owner' ? '#00695C' : selectedUser.role === 'Manager' ? '#6366F1' : '#64748B', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                <Text style={{ color: 'white', fontWeight: '700', fontSize: 22 }}>{selectedUser.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}</Text>
              </View>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#1F2937' }}>{selectedUser.name}</Text>
              <Text style={{ fontSize: 13, color: '#64748B' }}>{selectedUser.email}</Text>
            </View>
            <DetailRow label="Role" value={selectedUser.role} />
            <DetailRow label="Status" value={selectedUser.status} />
            <DetailRow label="User ID" value={selectedUser.id} />
            <Text style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center', marginTop: 16 }}>Joined • Farm member since 2024</Text>
          </>
        )}
      </ModalShell>
    </KeyboardAvoidingView>
  )
}

function StatBox({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAF7', borderRadius: 14, padding: 10, alignItems: 'center', gap: 4 }}>
      {icon}
      <Text style={{ fontSize: IS_SMALL ? 16 : 18, fontWeight: '800', color }}>{value}</Text>
      <Text style={{ fontSize: 9, color: '#94A3B8', textAlign: 'center', lineHeight: 12 }}>{label}</Text>
    </View>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
      <Text style={{ fontSize: 13, color: '#64748B' }}>{label}</Text>
      <Text style={{ fontSize: 13, fontWeight: '600', color: '#1F2937' }}>{value}</Text>
    </View>
  )
}
