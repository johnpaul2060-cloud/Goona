import { Stack } from 'expo-router'

export default function ExpensesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="create" />
      <Stack.Screen name="categories" />
      <Stack.Screen name="reports" />
      <Stack.Screen name="budget" />
    </Stack>
  )
}
