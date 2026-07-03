import { Stack } from 'expo-router'
import { stackGestureDefaults } from '../../../utils/navigationGestures'

export default function ChatLayout() {
  return (
    <Stack screenOptions={stackGestureDefaults}>
      <Stack.Screen name="[id]" />
    </Stack>
  )
}
