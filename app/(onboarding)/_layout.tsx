import { Stack } from 'expo-router';
import { gestureDisabledOptions } from '../../utils/navigationGestures';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, ...gestureDisabledOptions }}>
      <Stack.Screen name="splash" />
      <Stack.Screen name="onboarding-1" />
    </Stack>
  );
}
