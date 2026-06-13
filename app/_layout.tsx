import { useEffect, useState, useRef, Component, type ReactNode } from 'react'
import { View, Text, StyleSheet, AppState, type AppStateStatus } from 'react-native'
import { Stack, router } from 'expo-router'
import * as Notifications from 'expo-notifications'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import BiometricGate from '../components/Biometric/BiometricGate'
import { useAuthStore } from '../store/useAuthStore'
import { useSettingsStore } from '../store/useSettingsStore'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

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

export default function RootLayout() {
  useEffect(() => {
    Notifications.requestPermissionsAsync()
  }, [])

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <BiometricGateManager>
          <Stack screenOptions={{ headerShown: false, gestureEnabled: false }} />
        </BiometricGateManager>
      </GestureHandlerRootView>
    </ErrorBoundary>
  )
}
