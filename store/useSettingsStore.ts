import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

export interface ProfileData {
  name: string
  role: string
  farmName: string
  email: string
  phone: string
  location: string
  farmType: string
  productionSize: string
}

export interface NotificationPrefs {
  push: boolean
  reminder: boolean
  worker: boolean
  iq: boolean
  batch: boolean
  recapReminders: boolean
  taskReminders: boolean
  iqAlerts: boolean
  workerAlerts: boolean
  financialNotifications: boolean
  simulationNotifications: boolean
  recoveryNotifications: boolean
}

export interface RecaptReminders {
  enabled: boolean
  frequency: 'daily' | 'weekly' | 'monthly'
}

export interface SecurityPrefs {
  biometric: boolean
  pinProtection: boolean
  pinCode: string
  sessionTimeout: number
}

export interface IqPrefs {
  dailychallenge: boolean
  leaderboard: boolean
  aiSensitivity: number
  recommendationFrequency: number
  predictionIntensity: number
  financialForecasting: boolean
  operationalAlerts: boolean
  coachingMode: boolean
}

export interface DataPrefs {
  autosync: boolean
  offline: boolean
  lastSync: string
  offlineQueue: number
}

export interface WorkerPermissions {
  workerPermissions: boolean
  supervisorPermissions: boolean
  roleManagement: boolean
  workforceVisibility: boolean
}

export interface SimulationPrefs {
  difficulty: string
  aiCoachingIntensity: number
  speed: number
  trainingRealism: number
}

export interface ThemePrefs {
  animationIntensity: number
  reducedMotion: boolean
  darkMode: boolean
  uiDensity: string
  language: string
  theme: string
  fontSize: string
  region: string
  currency: string
}

interface SettingsState {
  profile: ProfileData
  notifications: NotificationPrefs
  recaptReminders: RecaptReminders
  security: SecurityPrefs
  iq: IqPrefs
  data: DataPrefs
  workerPermissions: WorkerPermissions
  simulation: SimulationPrefs
  theme: ThemePrefs
  forceSync: number

  updateProfile: (data: Partial<ProfileData>) => void
  toggleNotif: (key: keyof NotificationPrefs) => void
  setRecaptFrequency: (freq: 'daily' | 'weekly' | 'monthly') => void
  setRecaptEnabled: (v: boolean) => void
  toggleSecurity: (key: keyof SecurityPrefs) => void
  setPinCode: (code: string) => void
  toggleIq: (key: keyof IqPrefs) => void
  setIqPref: (key: 'aiSensitivity' | 'recommendationFrequency' | 'predictionIntensity', value: number) => void
  toggleData: (key: keyof DataPrefs) => void
  setLastSync: (val: string) => void
  setOfflineQueue: (v: number) => void
  toggleWorkerPermission: (key: keyof WorkerPermissions) => void
  setSimulationPref: (key: keyof SimulationPrefs, value: number | string) => void
  setThemePref: (key: keyof ThemePrefs, value: number | boolean | string) => void
  triggerSync: () => void
  resetAll: () => void
}

const defaultProfile: ProfileData = {
  name: 'Adewale Johnson', role: 'Farm Owner & Operations Lead',
  farmName: 'Adewale Farms', email: 'adewale@example.com',
  phone: '+234 800 000 0000', location: 'Oyo State, Nigeria',
  farmType: 'Poultry', productionSize: 'Medium (500-2000 birds)',
}
const defaultNotif: NotificationPrefs = {
  push: true, reminder: true, worker: true, iq: false, batch: true,
  recapReminders: true, taskReminders: true, iqAlerts: true,
  workerAlerts: true, financialNotifications: true,
  simulationNotifications: false, recoveryNotifications: true,
}
const defaultRecapt: RecaptReminders = { enabled: true, frequency: 'weekly' }
const defaultSecurity: SecurityPrefs = { biometric: true, pinProtection: false, pinCode: '', sessionTimeout: 30 }
const defaultIq: IqPrefs = {
  dailychallenge: true, leaderboard: true,
  aiSensitivity: 3, recommendationFrequency: 3, predictionIntensity: 3,
  financialForecasting: true, operationalAlerts: true, coachingMode: true,
}
const defaultData: DataPrefs = { autosync: true, offline: false, lastSync: new Date().toISOString(), offlineQueue: 0 }
const defaultWorker: WorkerPermissions = {
  workerPermissions: true, supervisorPermissions: true,
  roleManagement: false, workforceVisibility: true,
}
const defaultSimulation: SimulationPrefs = { difficulty: 'Intermediate', aiCoachingIntensity: 3, speed: 3, trainingRealism: 3 }
const defaultTheme: ThemePrefs = {
  animationIntensity: 3, reducedMotion: false, darkMode: false,
  uiDensity: 'Medium', language: 'English', theme: 'Light',
  fontSize: 'Medium', region: 'Nigeria', currency: '\u20A6',
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      profile: defaultProfile, notifications: defaultNotif, recaptReminders: defaultRecapt,
      security: defaultSecurity, iq: defaultIq, data: defaultData,
      workerPermissions: defaultWorker, simulation: defaultSimulation, theme: defaultTheme,
      forceSync: 0,

      updateProfile: (data) => set((s) => ({ profile: { ...s.profile, ...data } })),
      toggleNotif: (key) => set((s) => ({ notifications: { ...s.notifications, [key]: !s.notifications[key] } })),
      setRecaptFrequency: (freq) => set((s) => ({ recaptReminders: { ...s.recaptReminders, frequency: freq } })),
      setRecaptEnabled: (v) => set((s) => ({ recaptReminders: { ...s.recaptReminders, enabled: v } })),
      toggleSecurity: (key) => set((s) => ({ security: { ...s.security, [key]: !s.security[key] } })),
      setPinCode: (code) => set((s) => ({ security: { ...s.security, pinCode: code } })),
      toggleIq: (key) => set((s) => ({ iq: { ...s.iq, [key]: !s.iq[key] } })),
      setIqPref: (key, value) => set((s) => ({ iq: { ...s.iq, [key]: value } })),
      toggleData: (key) => set((s) => ({ data: { ...s.data, [key]: !s.data[key] } })),
      setLastSync: (val) => set((s) => ({ data: { ...s.data, lastSync: val } })),
      setOfflineQueue: (v) => set((s) => ({ data: { ...s.data, offlineQueue: v } })),
      toggleWorkerPermission: (key) => set((s) => ({ workerPermissions: { ...s.workerPermissions, [key]: !s.workerPermissions[key] } })),
      setSimulationPref: (key, value) => set((s) => ({ simulation: { ...s.simulation, [key]: value as never } })),
      setThemePref: (key, value) => set((s) => ({ theme: { ...s.theme, [key]: value as never } })),
      triggerSync: () => set((s) => ({ forceSync: s.forceSync + 1, data: { ...s.data, lastSync: new Date().toISOString() } })),
      resetAll: () => set({
        profile: defaultProfile, notifications: defaultNotif, recaptReminders: defaultRecapt,
        security: defaultSecurity, iq: defaultIq, data: defaultData,
        workerPermissions: defaultWorker, simulation: defaultSimulation, theme: defaultTheme, forceSync: 0,
      }),
    }),
    {
      name: 'goona-settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
)
