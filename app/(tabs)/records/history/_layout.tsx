import { Stack } from 'expo-router'
import { gestureDisabledOptions, stackGestureDefaults } from '../../../../utils/navigationGestures'

export default function HistoryLayout() {
  return (
    <Stack
      screenOptions={{
        ...stackGestureDefaults,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" options={gestureDisabledOptions} />
      <Stack.Screen name="[category]" />
    </Stack>
  )
}
