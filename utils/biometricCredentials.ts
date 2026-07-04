import * as SecureStore from 'expo-secure-store'

const SERVICE = 'goona.biometric.login'
const CREDENTIAL_KEY = 'goona.biometric.credential.v1'

export interface BiometricCredential {
  token: string
  email: string
  userName: string
  role: 'Owner' | 'Manager' | 'Worker'
  createdAt: string
}

const secureOptions = {
  keychainService: SERVICE,
  requireAuthentication: true,
  authenticationPrompt: 'Unlock GOONA with Face ID',
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
}

export function createBiometricToken() {
  return `goona-bio-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`
}

export async function saveBiometricCredential(credential: BiometricCredential) {
  const available = await SecureStore.isAvailableAsync()
  if (!available) throw new Error('Secure storage is not available on this device.')

  await SecureStore.setItemAsync(CREDENTIAL_KEY, JSON.stringify(credential), secureOptions)
}

export async function getBiometricCredential() {
  const available = await SecureStore.isAvailableAsync()
  if (!available) return null

  const raw = await SecureStore.getItemAsync(CREDENTIAL_KEY, {
    ...secureOptions,
    authenticationPrompt: 'Sign in to GOONA with Face ID',
  })
  if (!raw) return null

  try {
    return JSON.parse(raw) as BiometricCredential
  } catch {
    await clearBiometricCredential()
    return null
  }
}

export async function hasBiometricCredential() {
  const credential = await SecureStore.getItemAsync(CREDENTIAL_KEY, {
    keychainService: SERVICE,
  })
  return Boolean(credential)
}

export async function clearBiometricCredential() {
  await SecureStore.deleteItemAsync(CREDENTIAL_KEY, { keychainService: SERVICE })
}
