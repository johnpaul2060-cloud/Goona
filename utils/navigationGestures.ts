import { Platform } from 'react-native'

export const stackGestureDefaults = {
  headerShown: false,
  gestureEnabled: true,
  gestureDirection: 'horizontal' as const,
  fullScreenGestureEnabled: Platform.OS === 'ios',
}

export const edgeGestureOptions = {
  gestureEnabled: true,
  gestureDirection: 'horizontal' as const,
  fullScreenGestureEnabled: false,
}

export const gestureDisabledOptions = {
  gestureEnabled: false,
  fullScreenGestureEnabled: false,
}

export const modalGestureOptions = {
  presentation: 'modal' as const,
  gestureEnabled: true,
  gestureDirection: 'vertical' as const,
  fullScreenGestureEnabled: false,
}
