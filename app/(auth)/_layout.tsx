import { Stack } from 'expo-router';
import { gestureDisabledOptions } from '../../utils/navigationGestures';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, ...gestureDisabledOptions }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="register" />
      <Stack.Screen name="create-account" />
    </Stack>
  );
}
