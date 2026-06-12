import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

export interface RegisteredDevice {
  id: string
  name: string
  lastLogin: string
  biometricStatus: 'Active' | 'Inactive'
}

interface AuthState {
  isLoggedIn: boolean
  userName: string
  email: string
  role: 'Owner' | 'Manager' | 'Worker'
  biometricEnrolled: boolean
  biometricToken: string | null
  registeredDevices: RegisteredDevice[]
  authenticatedSession: boolean
  login: (name: string, email: string, role?: 'Owner' | 'Manager' | 'Worker') => void
  logout: () => void
  setBiometricEnrolled: (enrolled: boolean, token?: string) => void
  addDevice: (device: RegisteredDevice) => void
  removeDevice: (deviceId: string) => void
  setAuthenticatedSession: (value: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isLoggedIn: true,
      userName: 'Adewale Johnson',
      email: 'adewale@example.com',
      role: 'Owner',
      biometricEnrolled: false,
      biometricToken: null,
      registeredDevices: [],
      authenticatedSession: false,
      login: (name, email, role) => set({ isLoggedIn: true, userName: name, email, role: role ?? 'Owner', authenticatedSession: false }),
      logout: () => set({ isLoggedIn: false, userName: '', email: '', role: 'Owner', biometricEnrolled: false, biometricToken: null, authenticatedSession: false }),
      setBiometricEnrolled: (enrolled, token) => set({ biometricEnrolled: enrolled, biometricToken: token ?? null }),
      addDevice: (device) => set((s) => ({ registeredDevices: [...s.registeredDevices.filter((d) => d.id !== device.id), device] })),
      removeDevice: (deviceId) => set((s) => ({ registeredDevices: s.registeredDevices.filter((d) => d.id !== deviceId) })),
      setAuthenticatedSession: (value) => set({ authenticatedSession: value }),
    }),
    {
      name: 'goona-auth',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
)
