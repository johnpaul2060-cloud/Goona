import { Stack } from 'expo-router'
import { gestureDisabledOptions, stackGestureDefaults } from '../../../../utils/navigationGestures'

export default function ExpensesLayout() {
  return (
    <Stack
      screenOptions={{
        ...stackGestureDefaults,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" options={gestureDisabledOptions} />
      <Stack.Screen name="create" options={gestureDisabledOptions} />
      <Stack.Screen name="categories" />
      <Stack.Screen name="reports" />
      <Stack.Screen name="budget" />
      <Stack.Screen name="budget-setup" />
      <Stack.Screen name="budget-export" />
    </Stack>
  )
}
