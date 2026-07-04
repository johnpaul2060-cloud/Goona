import React, { useState, useCallback, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions,
  KeyboardAvoidingView, Platform, Alert, Modal, Keyboard
} from 'react-native'
import GoonaIcon from '../components/ui/GoonaIcon'
import { Icons } from '../shared/icons'
import { StatusBar } from 'expo-status-bar'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import Animated, { useSharedValue, useAnimatedStyle, withSpring, FadeInUp, SlideInUp, FadeIn } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import BottomDock from '../components/navigation/BottomDock'
import { useAuthStore, type RegisteredDevice } from '../store/useAuthStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { useBiometricAuth } from '../hooks/useBiometricAuth'
import { clearBiometricCredential, createBiometricToken, saveBiometricCredential } from '../utils/biometricCredentials'
import BiometricGate from '../components/Biometric/BiometricGate'

const { width: SW } = Dimensions.get('window')
const IS_SMALL = SW < 375

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

export default function BiometricAuthScreen() {
  const insets = useSafeAreaInsets()
  const authStore = useAuthStore()
  const settingsStore = useSettingsStore()
  const { isAvailable, biometricType, getBiometricLabel, authenticate, checkBiometrics } = useBiometricAuth()

  const [showBioGate, setShowBioGate] = useState(false)
  const [showDisableConfirm, setShowDisableConfirm] = useState(false)
  const [showRemoveDevice, setShowRemoveDevice] = useState<RegisteredDevice | null>(null)

  const bioLabel = getBiometricLabel()
  const isEnabled = settingsStore.security.biometric && authStore.biometricEnrolled

  const handleToggleBiometric = useCallback(async () => {
    Keyboard.dismiss()
    if (isEnabled) {
      setShowDisableConfirm(true)
    } else {
      const bioState = await checkBiometrics()
      if (!bioState.isEnrolled) {
        Alert.alert('Biometrics Not Set Up', 'Please enable Face ID or Fingerprint in your device settings first.')
        return
      }
      const result = await authenticate({ promptMessage: 'Enable biometric login', fallbackLabel: 'Cancel' })
      if (result.success) {
        await saveBiometricCredential({
          token: createBiometricToken(),
          email: authStore.email || 'adewale@example.com',
          userName: authStore.userName || 'Adewale Johnson',
          role: authStore.role,
          createdAt: new Date().toISOString(),
        })
        authStore.setBiometricEnrolled(true, 'secure-store')
        authStore.setAuthenticatedSession(true)
        if (!settingsStore.security.biometric) settingsStore.toggleSecurity('biometric')
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      }
    }
  }, [isEnabled, checkBiometrics, authenticate, authStore, settingsStore])

  const confirmDisable = useCallback(async () => {
    await clearBiometricCredential()
    authStore.setBiometricEnrolled(false)
    if (settingsStore.security.biometric) settingsStore.toggleSecurity('biometric')
    settingsStore.setSecurityPref('requireBiometricAtLaunch', false)
    settingsStore.setSecurityPref('requireBiometricAfterInactivity', false)
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
    setShowDisableConfirm(false)
  }, [authStore, settingsStore])

  const handleRemoveDevice = useCallback((device: RegisteredDevice) => {
    authStore.removeDevice(device.id)
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    setShowRemoveDevice(null)
  }, [authStore])

  const handleOwnerGate = useCallback(() => {
    setShowBioGate(true)
  }, [])

  const bioTypeLabel = biometricType === 'FaceID' ? 'Face ID' : biometricType === 'Fingerprint' || biometricType === 'TouchID' ? 'Fingerprint' : 'Device Biometrics'

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: '#F8F9F5' }}>
      <StatusBar style="dark" />
      <View style={{ position: 'absolute', top: -50, right: -50, width: 320, height: 320, zIndex: 0 }} pointerEvents="none">
        <View style={{ width: 320, height: 320, borderRadius: 160, backgroundColor: 'rgba(99,102,241,0.05)' }} />
      </View>

      <ScrollView style={{ flex: 1, zIndex: 1 }} contentContainerStyle={{ paddingHorizontal: IS_SMALL ? 16 : 24, paddingTop: 0, paddingBottom: insets.bottom + 120 }} showsVerticalScrollIndicator={false}>
        {/* TOP NAV */}
        <Animated.View entering={FadeInUp.duration(500).springify()} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: IS_SMALL ? 44 : 54 }}>
          <TouchableOpacity style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10 }} activeOpacity={0.7} onPress={() => router.back()}><GoonaIcon icon={Icons.arrowLeft} size={22} color="#1B1B1B" /></TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <GoonaIcon icon={Icons.sprout} size={22} color="#00695C" />
            <Text style={{ fontWeight: '700', fontSize: 14, color: '#1B1B1B' }}>GOONA</Text>
          </View>
          <Text style={{ fontSize: 14, fontWeight: '500', color: '#616161' }}>Biometric Auth</Text>
        </Animated.View>

        {/* HEADER */}
        <Animated.View entering={FadeInUp.duration(500).delay(80).springify()} style={{ marginTop: IS_SMALL ? 14 : 20 }}>
          <Text style={{ fontWeight: '800', fontSize: IS_SMALL ? 26 : 30, lineHeight: IS_SMALL ? 32 : 36, color: '#1F2937' }}>Biometric Authentication</Text>
          <Text style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Manage Face ID and fingerprint security settings.</Text>
        </Animated.View>

        {/* STATUS CARD */}
        <Animated.View entering={FadeInUp.duration(500).delay(160).springify()} style={{ marginTop: 20, backgroundColor: 'white', borderRadius: 22, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.03, shadowRadius: 20, elevation: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: isEnabled ? 'rgba(22,163,74,0.08)' : 'rgba(148,163,184,0.08)', alignItems: 'center', justifyContent: 'center' }}>
              <GoonaIcon icon={Icons.shield} size={24} color={isEnabled ? '#16A34A' : '#94A3B8'} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#1F2937' }}>Current Status</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: isEnabled ? '#16A34A' : '#94A3B8' }} />
                <Text style={{ fontSize: 13, fontWeight: '500', color: isEnabled ? '#16A34A' : '#94A3B8' }}>{isEnabled ? 'Enabled' : 'Disabled'}</Text>
              </View>
            </View>
            {!isAvailable && (
              <View style={{ paddingVertical: 4, paddingHorizontal: 10, backgroundColor: 'rgba(245,158,11,0.08)', borderRadius: 50 }}>
                <Text style={{ fontSize: 10, fontWeight: '600', color: '#F59E0B' }}>Not available</Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* AUTH TYPE */}
        {isAvailable && (
          <Animated.View entering={FadeInUp.duration(500).delay(200).springify()} style={{ marginTop: 16, backgroundColor: 'white', borderRadius: 22, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.03, shadowRadius: 20, elevation: 2 }}>
            <Text style={{ fontWeight: '600', fontSize: 12, color: '#64748B', marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' }}>Authentication Type</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(99,102,241,0.08)', alignItems: 'center', justifyContent: 'center' }}>
                <GoonaIcon icon={biometricType === 'FaceID' ? Icons.scanFace : Icons.fingerprintPattern} size={18} color="#6366F1" />
              </View>
              <View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#1F2937' }}>{bioTypeLabel}</Text>
                <Text style={{ fontSize: 12, color: '#64748B' }}>Supported by your device</Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* SETTINGS TOGGLES */}
        <Animated.View entering={FadeInUp.duration(500).delay(240).springify()} style={{ marginTop: IS_SMALL ? 16 : 22 }}>
          <Text style={{ fontWeight: '700', fontSize: IS_SMALL ? 13 : 14, color: '#00695C', marginBottom: 8, paddingHorizontal: 4, letterSpacing: 0.3 }}>Settings</Text>
          <View style={{ backgroundColor: 'white', borderRadius: 22, paddingVertical: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.03, shadowRadius: 20, elevation: 2, overflow: 'hidden' }}>
            <SettingRow
              icon={<GoonaIcon icon={Icons.shield} size={16} color="#6366F1" />}
              title="Enable Biometric Login"
              desc={isEnabled ? `${bioLabel} login is active` : 'Use Face ID or fingerprint to log in'}
              right={<StyledSwitch value={isEnabled} onToggle={handleToggleBiometric} />}
            />
            {isEnabled && (
              <>
                <SettingRow
                  icon={<GoonaIcon icon={Icons.scanFace} size={16} color="#64748B" />}
                  title="Require at App Launch"
                  desc="Authenticate when opening the app"
                  right={<StyledSwitch value={settingsStore.security.requireBiometricAtLaunch} onToggle={() => settingsStore.setSecurityPref('requireBiometricAtLaunch', !settingsStore.security.requireBiometricAtLaunch)} />}
                />
                <SettingRow
                  icon={<GoonaIcon icon={Icons.smartphone} size={16} color="#64748B" />}
                  title="Require After Inactivity"
                  desc={`After ${settingsStore.security.inactivityTimeoutMinutes} min of inactivity`}
                  right={<StyledSwitch value={settingsStore.security.requireBiometricAfterInactivity} onToggle={() => settingsStore.setSecurityPref('requireBiometricAfterInactivity', !settingsStore.security.requireBiometricAfterInactivity)} />}
                />
              </>
            )}
          </View>
        </Animated.View>

        {/* REGISTERED DEVICES */}
        <Animated.View entering={FadeInUp.duration(500).delay(320).springify()} style={{ marginTop: IS_SMALL ? 16 : 22 }}>
          <Text style={{ fontWeight: '700', fontSize: IS_SMALL ? 13 : 14, color: '#00695C', marginBottom: 8, paddingHorizontal: 4, letterSpacing: 0.3 }}>Registered Devices</Text>
          <View style={{ backgroundColor: 'white', borderRadius: 22, paddingVertical: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.03, shadowRadius: 20, elevation: 2, overflow: 'hidden' }}>
            {authStore.registeredDevices.length === 0 ? (
              <View style={{ padding: 24, alignItems: 'center' }}>
                <GoonaIcon icon={Icons.smartphone} size={24} color="#CBD5E1" />
                <Text style={{ fontSize: 13, color: '#94A3B8', marginTop: 8 }}>No devices registered yet</Text>
              </View>
            ) : (
              authStore.registeredDevices.map((device, index) => (
                <View key={device.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: index < authStore.registeredDevices.length - 1 ? 1 : 0, borderBottomColor: '#F1F5F9' }}>
                  <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(99,102,241,0.06)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <GoonaIcon icon={Icons.smartphone} size={16} color="#6366F1" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#1B1B1B' }}>{device.name}</Text>
                    <Text style={{ fontSize: 11, color: '#94A3B8' }}>Last login: {device.lastLogin}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: device.biometricStatus === 'Active' ? '#16A34A' : '#94A3B8' }} />
                      <Text style={{ fontSize: 10, color: device.biometricStatus === 'Active' ? '#16A34A' : '#94A3B8', fontWeight: '500' }}>{device.biometricStatus}</Text>
                    </View>
                  </View>
                  <TouchableOpacity activeOpacity={0.7} onPress={() => setShowRemoveDevice(device)} style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(220,38,38,0.06)', alignItems: 'center', justifyContent: 'center' }}>
                    <GoonaIcon icon={Icons.trash2} size={14} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </Animated.View>

        {/* SECURITY NOTE */}
        <Animated.View entering={FadeInUp.duration(500).delay(400).springify()} style={{ marginTop: 16, backgroundColor: 'rgba(99,102,241,0.04)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(99,102,241,0.08)' }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#4338CA', marginBottom: 4 }}>Security Note</Text>
          <Text style={{ fontSize: 11, color: '#6366F1', lineHeight: 18 }}>
            Your biometric data (Face ID / fingerprint data) is never stored by GOONA. We only store a secure authentication token on this device using native platform security APIs.
          </Text>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <BottomDock />

      {/* DISABLE CONFIRMATION */}
      <ModalShell visible={showDisableConfirm} onClose={() => setShowDisableConfirm(false)} title="Disable Biometrics">
        <Text style={{ fontSize: 14, color: '#4B5563', lineHeight: 22 }}>
          Are you sure you want to disable biometric login? You will need to use your password to log in.
        </Text>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
          <TouchableOpacity activeOpacity={0.7} onPress={() => setShowDisableConfirm(false)} style={{ flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#F1F5F9', alignItems: 'center' }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#64748B' }}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.85} onPress={confirmDisable} style={{ flex: 1, borderRadius: 14, overflow: 'hidden' }}>
            <LinearGradient colors={['#DC2626', '#B91C1C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 14, alignItems: 'center' }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>Disable</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ModalShell>

      {/* REMOVE DEVICE CONFIRMATION */}
      <ModalShell visible={showRemoveDevice !== null} onClose={() => setShowRemoveDevice(null)} title="Remove Device">
        {showRemoveDevice && (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12, backgroundColor: '#F8FAF7', borderRadius: 12, padding: 12 }}>
              <GoonaIcon icon={Icons.smartphone} size={20} color="#6366F1" />
              <View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#1F2937' }}>{showRemoveDevice.name}</Text>
                <Text style={{ fontSize: 12, color: '#64748B' }}>Last login: {showRemoveDevice.lastLogin}</Text>
              </View>
            </View>
            <Text style={{ fontSize: 14, color: '#4B5563', lineHeight: 22 }}>
              This will remove this device from your trusted devices. Biometric login will be deactivated on this device.
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
              <TouchableOpacity activeOpacity={0.7} onPress={() => setShowRemoveDevice(null)} style={{ flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#F1F5F9', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#64748B' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.85} onPress={() => handleRemoveDevice(showRemoveDevice)} style={{ flex: 1, borderRadius: 14, overflow: 'hidden' }}>
                <LinearGradient colors={['#DC2626', '#B91C1C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 14, alignItems: 'center' }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>Remove</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ModalShell>
    </KeyboardAvoidingView>
  )
}

function SettingRow({ icon, title, desc, right }: { icon: React.ReactNode; title: string; desc: string; right: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16, minHeight: 52 }}>
      <View style={{ width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</View>
      <View style={{ flex: 1, marginRight: 8 }}>
        <Text style={{ fontSize: IS_SMALL ? 12 : 13, fontWeight: '600', color: '#1B1B1B' }} numberOfLines={1}>{title}</Text>
        <Text style={{ fontSize: IS_SMALL ? 10 : 11, color: '#94A3B8', marginTop: 1 }} numberOfLines={1}>{desc}</Text>
      </View>
      <View style={{ flexShrink: 0 }}>{right}</View>
    </View>
  )
}
