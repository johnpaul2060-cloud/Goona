import { Stack } from 'expo-router'
import { stackGestureDefaults } from '../../../utils/navigationGestures'

export default function FarmChatLayout() {
  return (
    <Stack screenOptions={stackGestureDefaults}>
      <Stack.Screen name="index" />
      <Stack.Screen name="chat/[id]" />
    </Stack>
  )
}
