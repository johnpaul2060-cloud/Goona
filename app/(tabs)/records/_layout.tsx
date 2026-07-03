import { Stack } from 'expo-router'
import { gestureDisabledOptions, stackGestureDefaults } from '../../../utils/navigationGestures'

export default function RecordsLayout() {
  return (
    <Stack
      screenOptions={{
        ...stackGestureDefaults,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" options={gestureDisabledOptions} />
      <Stack.Screen name="daily-operations" options={gestureDisabledOptions} />
      <Stack.Screen name="batch-management" />
      <Stack.Screen name="sales-revenue" />
      <Stack.Screen name="analytics" />
      <Stack.Screen name="expenses" />
    </Stack>
  )
}
