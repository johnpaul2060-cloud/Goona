import { Stack } from 'expo-router'

export default function RecordsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="daily-operations" />
      <Stack.Screen name="batch-management" />
      <Stack.Screen name="sales-revenue" />
      <Stack.Screen name="analytics" />
      <Stack.Screen name="expenses" />
    </Stack>
  )
}
