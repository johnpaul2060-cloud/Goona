import { Stack } from 'expo-router';

export default function SetupLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="farm-setup" />
      <Stack.Screen name="farm-structure" />
    </Stack>
  );
}
