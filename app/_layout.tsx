import { useEffect } from 'react'
import { Stack } from 'expo-router'
import * as Notifications from 'expo-notifications'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

export default function RootLayout() {
  useEffect(() => {
    Notifications.requestPermissionsAsync()
  }, [])

  return (
    <Stack screenOptions={{ headerShown: false }} />
  )
}
