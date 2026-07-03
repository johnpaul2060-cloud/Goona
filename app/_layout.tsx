import { useEffect, useState, useRef, Component, type ReactNode } from 'react'
import { View, Text, StyleSheet, AppState, type AppStateStatus, Platform } from 'react-native'
import { Stack, router } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import Constants from 'expo-constants'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { enableScreens } from 'react-native-screens'
import BiometricGate from '../components/Biometric/BiometricGate'
import { useAuthStore } from '../store/useAuthStore'
import { useSettingsStore } from '../store/useSettingsStore'
import NotificationInitializer from '../components/NotificationInitializer'
import { PriorityProvider } from '../store/farmPriorityEngine'
import {
  edgeGestureOptions,
  gestureDisabledOptions,
  modalGestureOptions,
  stackGestureDefaults,
} from '../utils/navigationGestures'

const isExpoGo = Constants.executionEnvironment === 'storeClient'

enableScreens(true)
SplashScreen.preventAutoHideAsync()

console.log('[Startup] App Started')
console.log('[Startup] Platform:', Platform.OS, Platform.Version)
console.log('[Startup] Expo Go:', isExpoGo)
console.log('[Startup] ExecutionEnvironment:', Constants.executionEnvironment)

if (isExpoGo) {
  console.log('[Notifications] Running in Expo Go — Push Registration Skipped')
} else {
  console.log('[Notifications] Running in Development Build — Push Registration Enabled')
}

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.container}>
          <Text style={errorStyles.title}>Something went wrong</Text>
          <Text style={errorStyles.message}>{this.state.error?.message}</Text>
        </View>
      )
    }
    return this.props.children
  }
}

const errorStyles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#F8FAF7' },
  title: { fontSize: 20, fontWeight: '700', color: '#1B1B1B', marginBottom: 8 },
  message: { fontSize: 14, color: '#616161', textAlign: 'center' },
})

function BiometricGateManager({ children }: { children: ReactNode }) {
  const [showGate, setShowGate] = useState(false)
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const biometricEnrolled = useAuthStore((s) => s.biometricEnrolled)
  const bioSetting = useSettingsStore((s) => s.security.biometric)
  const requireAtLaunch = useSettingsStore((s) => s.security.requireBiometricAtLaunch)
  const authenticatedSession = useAuthStore((s) => s.authenticatedSession)
  const setAuthenticatedSession = useAuthStore((s) => s.setAuthenticatedSession)
  const appStateRef = useRef<AppStateStatus>(AppState.currentState)

  useEffect(() => {
    if (isLoggedIn && biometricEnrolled && bioSetting && requireAtLaunch && !authenticatedSession) {
      setShowGate(true)
    }
  }, [])

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextState === 'active' &&
        isLoggedIn &&
        biometricEnrolled &&
        bioSetting &&
        requireAtLaunch &&
        !authenticatedSession
      ) {
        setShowGate(true)
      }
      appStateRef.current = nextState
    })
    return () => sub.remove()
  }, [isLoggedIn, biometricEnrolled, bioSetting, requireAtLaunch, authenticatedSession])

  const handleAuthenticated = () => {
    setShowGate(false)
    setAuthenticatedSession(true)
  }

  const handleFallback = () => {
    setShowGate(false)
    setAuthenticatedSession(true)
    router.replace('/(auth)/login')
  }

  return (
    <View style={{ flex: 1 }}>
      {children}
      <BiometricGate
        visible={showGate}
        onAuthenticated={handleAuthenticated}
        onFallback={handleFallback}
        onClose={() => setShowGate(false)}
        title="Authenticate to Continue"
        subtitle="Use your Face ID or Fingerprint to access GOONA."
      />
    </View>
  )
}

function useStartupManager() {
  const [ready, setReady] = useState(false)
  const [_error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let hideTimer: ReturnType<typeof setTimeout> | null = null

    async function init() {
      try {
        console.log('[Startup] Checking Updates')
        console.log('[Startup] Update check skipped (expo-updates not available)')

        console.log('[Startup] Authentication Check')
        const isLoggedIn = useAuthStore.getState().isLoggedIn
        console.log('[Startup] isLoggedIn:', isLoggedIn)

        if (!isExpoGo) {
          console.log('[Notifications] Initializing push notifications')
          const Notifications = await import('expo-notifications')
          Notifications.setNotificationHandler({
            handleNotification: async () => ({
              shouldShowAlert: true,
              shouldShowBanner: true,
              shouldShowList: true,
              shouldPlaySound: true,
              shouldSetBadge: false,
            }),
          })
          Notifications.requestPermissionsAsync()
        }

        console.log('[Startup] Loading Dashboard')
        await new Promise((r) => setTimeout(r, 100))

        if (!cancelled) {
          console.log('[Startup] Splash Hidden')
          setReady(true)
        }
      } catch (e) {
        console.log('[Startup] Error during init:', e)
        if (!cancelled) {
          setError(String(e))
          setReady(true)
        }
      }
    }

    init()

    hideTimer = setTimeout(() => {
      if (!cancelled) {
        console.log('[Startup] Force hide splash (timeout)')
        setReady(true)
      }
    }, 10000)

    return () => {
      cancelled = true
      if (hideTimer) clearTimeout(hideTimer)
    }
  }, [])

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync().catch((e) => {
        console.log('[Startup] SplashScreen.hideAsync error:', e)
      })
    }
  }, [ready])

  return { error: _error, ready }
}

export default function RootLayout() {
  const { ready } = useStartupManager()

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <BiometricGateManager>
          <PriorityProvider>
            <NotificationInitializer />
            {ready ? (
              <Stack screenOptions={stackGestureDefaults}>
                <Stack.Screen name="index" options={gestureDisabledOptions} />
                <Stack.Screen name="(tabs)" options={gestureDisabledOptions} />
                <Stack.Screen name="(auth)" options={gestureDisabledOptions} />
                <Stack.Screen name="(onboarding)" options={gestureDisabledOptions} />
                <Stack.Screen name="(setup)" options={gestureDisabledOptions} />
                <Stack.Screen name="modal" options={modalGestureOptions} />
                <Stack.Screen name="workforce-live" options={edgeGestureOptions} />
                <Stack.Screen name="goona-academy-challenges" options={edgeGestureOptions} />
                <Stack.Screen name="goona-academy-tycoon" options={edgeGestureOptions} />
                <Stack.Screen name="live-simulation" options={edgeGestureOptions} />
                <Stack.Screen name="geofence-editor" options={gestureDisabledOptions} />
                <Stack.Screen name="farm-setup" options={gestureDisabledOptions} />
                <Stack.Screen name="farm-structure" options={gestureDisabledOptions} />
                <Stack.Screen name="create-batch" options={gestureDisabledOptions} />
                <Stack.Screen name="daily-records" options={gestureDisabledOptions} />
                <Stack.Screen name="record-sale" options={gestureDisabledOptions} />
                <Stack.Screen name="kyc-step-1" options={gestureDisabledOptions} />
                <Stack.Screen name="kyc-step-2" options={gestureDisabledOptions} />
                <Stack.Screen name="kyc-step-3" options={gestureDisabledOptions} />
                <Stack.Screen name="kyc-step-4" options={gestureDisabledOptions} />
                <Stack.Screen name="kyc-step-5" options={gestureDisabledOptions} />
              </Stack>
            ) : (
              <View style={{ flex: 1, backgroundColor: '#F8FAF7' }} />
            )}
          </PriorityProvider>
        </BiometricGateManager>
      </GestureHandlerRootView>
    </ErrorBoundary>
  )
}
