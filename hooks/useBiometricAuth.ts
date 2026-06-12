import { useState, useEffect, useCallback, useRef } from 'react'
import * as LocalAuthentication from 'expo-local-authentication'
import { Platform } from 'react-native'

export type BiometricType = 'FaceID' | 'Fingerprint' | 'TouchID' | 'deviceBiometrics' | null

export interface BiometricAuthState {
  isAvailable: boolean
  biometricType: BiometricType
  isEnrolled: boolean
  hardwareAvailable: boolean
}

export interface AuthResult {
  success: boolean
  error?: string
}

export function useBiometricAuth() {
  const [state, setState] = useState<BiometricAuthState>({
    isAvailable: false,
    biometricType: null,
    isEnrolled: false,
    hardwareAvailable: false,
  })

  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => {
    checkBiometrics()
  }, [])

  const checkBiometrics = async (): Promise<BiometricAuthState> => {
    try {
      const [hasHardware, enrolled, types] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
        LocalAuthentication.supportedAuthenticationTypesAsync(),
      ])

      let bioType: BiometricType = null
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        bioType = Platform.OS === 'ios' ? 'FaceID' : 'deviceBiometrics'
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        bioType = Platform.OS === 'ios' ? 'TouchID' : 'Fingerprint'
      } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        bioType = 'deviceBiometrics'
      }

      const newState: BiometricAuthState = {
        hardwareAvailable: hasHardware,
        isEnrolled: enrolled,
        isAvailable: hasHardware,
        biometricType: bioType,
      }
      setState(newState)
      return newState
    } catch {
      const errorState: BiometricAuthState = { isAvailable: false, biometricType: null, isEnrolled: false, hardwareAvailable: false }
      setState(errorState)
      return errorState
    }
  }

  const authenticate = useCallback(async (options?: { promptMessage?: string; fallbackLabel?: string }): Promise<AuthResult> => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: options?.promptMessage ?? 'Authenticate to continue',
        fallbackLabel: options?.fallbackLabel ?? 'Use Password Instead',
        disableDeviceFallback: true,
        cancelLabel: 'Cancel',
      })
      if (result.success) {
        return { success: true }
      }
      return { success: false, error: result.error }
    } catch (e: any) {
      return { success: false, error: e?.message ?? 'Authentication failed' }
    }
  }, [])

  const getBiometricLabel = useCallback((): string => {
    switch (state.biometricType) {
      case 'FaceID':
        return 'Face ID'
      case 'TouchID':
        return 'Touch ID'
      case 'Fingerprint':
        return 'Fingerprint'
      case 'deviceBiometrics':
        return 'Device Biometrics'
      default:
        return 'Biometrics'
    }
  }, [state.biometricType])

  const getBiometricIcon = useCallback((): string => {
    switch (state.biometricType) {
      case 'FaceID':
        return 'FaceID'
      case 'TouchID':
      case 'Fingerprint':
        return 'Fingerprint'
      default:
        return 'deviceBiometrics'
    }
  }, [state.biometricType])

  return {
    ...state,
    checkBiometrics,
    authenticate,
    getBiometricLabel,
    getBiometricIcon,
  }
}
