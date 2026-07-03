import { Stack } from 'expo-router';
import { gestureDisabledOptions } from '../../utils/navigationGestures';

export default function SetupLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, ...gestureDisabledOptions }}>
      <Stack.Screen name="farm-setup" />
      <Stack.Screen name="farm-structure" />
    </Stack>
  );
}
