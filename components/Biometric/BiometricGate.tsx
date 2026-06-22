import React, { useState, useEffect, useRef, useCallback } from 'react'
import { View, Text, TouchableOpacity, Keyboard } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Icons } from '../../shared/icons'
import GoonaIcon from '../ui/GoonaIcon'
import { useBiometricAuth } from '../../hooks/useBiometricAuth'
import { useAuthStore } from '../../store/useAuthStore'

interface BiometricGateProps {
  onAuthenticated: () => void
  onFallback: () => void
  onClose: () => void
  visible: boolean
  title?: string
  subtitle?: string
}

const BADGE_SIZE = 80

export default function BiometricGate({ onAuthenticated, onFallback, onClose, visible, title, subtitle }: BiometricGateProps) {
  const insets = useSafeAreaInsets()
  const { hardwareAvailable, isEnrolled, biometricType, authenticate, getBiometricLabel } = useBiometricAuth()
  const setAuthenticatedSession = useAuthStore((s) => s.setAuthenticatedSession)
  const [failed, setFailed] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [authenticating, setAuthenticating] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)
  const mountedRef = useRef(true)
  const authInFlightRef = useRef(false)
  const autoTriggeredRef = useRef(false)

  useEffect(() => {
    return () => { mountedRef.current = false }
  }, [])

  const doAuthenticate = useCallback(async () => {
    if (authInFlightRef.current) return
    Keyboard.dismiss()
    authInFlightRef.current = true
    setAuthenticating(true)
    setFailed(false)
    setLastError(null)
    const result = await authenticate({
      promptMessage: title ?? 'Authenticate to continue',
      fallbackLabel: 'Use Password Instead',
    })
    authInFlightRef.current = false
    if (mountedRef.current) {
      setAuthenticating(false)
      if (result.success) {
        setFailed(false)
        setAttempts(0)
        setLastError(null)
        setAuthenticatedSession(true)
        onAuthenticated()
      } else if (result.error === 'user_fallback') {
        setFailed(false)
        setAttempts(0)
        setLastError(null)
        onFallback()
      } else {
        setFailed(true)
        setLastError(result.error ?? 'authentication_failed')
        setAttempts((p) => p + 1)
      }
    }
  }, [authenticate, title, onAuthenticated, onFallback, setAuthenticatedSession])

  useEffect(() => {
    if (!visible) {
      autoTriggeredRef.current = false
      return
    }
    if (visible && hardwareAvailable && isEnrolled && !autoTriggeredRef.current) {
      autoTriggeredRef.current = true
      doAuthenticate()
    }
  }, [visible, hardwareAvailable, isEnrolled, doAuthenticate])

  if (!visible) return null

  const bioLabel = getBiometricLabel()
  const isFaceId = biometricType === 'FaceID'
  const errorMsg = !hardwareAvailable
    ? 'Biometric authentication is not available on this device.'
    : !isEnrolled
    ? `${bioLabel} is not configured on this device. Please enable ${bioLabel} in device settings.`
    : lastError === 'lockout'
    ? 'Too many failed attempts. Biometric authentication is locked. Please use your password.'
    : lastError === 'not_enrolled'
    ? `${bioLabel} is not configured on this device. Please enable ${bioLabel} in device settings.`
    : lastError === 'not_available'
    ? 'Biometric authentication is not available right now.'
    : lastError === 'system_cancel'
    ? 'Authentication was interrupted. Please try again.'
    : attempts >= 3
    ? 'Too many failed attempts. Please use your password.'
    : 'Please try again or use your password.'

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#F8FAF7', zIndex: 9999, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
      <View style={{ alignItems: 'center', width: '100%', maxWidth: 340 }}>
        <View style={{ width: BADGE_SIZE, height: BADGE_SIZE, borderRadius: BADGE_SIZE / 2, backgroundColor: 'rgba(99,102,241,0.08)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
          {isFaceId ? (
            <GoonaIcon icon={Icons.scanFace} size={36} color="#6366F1" />
          ) : (
            <GoonaIcon icon={Icons.fingerprintPattern} size={36} color="#6366F1" />
          )}
        </View>

        <Text style={{ fontSize: 22, fontWeight: '800', color: '#1F2937', textAlign: 'center' }}>
          {title ?? 'Authenticate to Continue'}
        </Text>
        <Text style={{ fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 8, lineHeight: 20 }}>
          {subtitle ?? `Use your ${bioLabel} to access GOONA.`}
        </Text>

        {(failed || !hardwareAvailable || !isEnrolled) && (
          <View style={{ marginTop: 16, backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: 12, padding: 14, width: '100%', alignItems: 'center' }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#DC2626' }}>Authentication Failed</Text>
            <Text style={{ fontSize: 12, color: '#B91C1C', marginTop: 2, textAlign: 'center' }}>{errorMsg}</Text>
          </View>
        )}

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={doAuthenticate}
          disabled={authenticating}
          style={{
            width: '100%',
            paddingVertical: 16,
            borderRadius: 18,
            backgroundColor: '#2E7D32',
            alignItems: 'center',
            marginTop: 24,
            opacity: authenticating ? 0.6 : 1,
            shadowColor: '#2E7D32',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.25,
            shadowRadius: 16,
            elevation: 4,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '700', color: 'white' }}>
            {authenticating ? 'Authenticating...' : `Authenticate with ${bioLabel}`}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onFallback}
          style={{ paddingVertical: 14, paddingHorizontal: 24, marginTop: 12 }}
        >
          <Text style={{ fontSize: 14, fontWeight: '500', color: '#64748B' }}>Use Password Instead</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onClose}
        style={{ position: 'absolute', top: insets.top + 12, right: 16, padding: 8 }}
      >
        <GoonaIcon icon={Icons.shield} size={20} color="#CBD5E1" />
      </TouchableOpacity>
    </View>
  )
}
