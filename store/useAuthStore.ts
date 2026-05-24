import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface AuthState {
  isLoggedIn: boolean
  userName: string
  email: string
  login: (name: string, email: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isLoggedIn: true,
      userName: 'Adewale Johnson',
      email: 'adewale@example.com',
      login: (name, email) => set({ isLoggedIn: true, userName: name, email }),
      logout: () => set({ isLoggedIn: false, userName: '', email: '' }),
    }),
    {
      name: 'goona-auth',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
)
