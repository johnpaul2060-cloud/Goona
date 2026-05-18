import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: 'none',
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tabs.Screen name="dashboard" />
      <Tabs.Screen name="farm-feed" />
      <Tabs.Screen name="records" />
      <Tabs.Screen name="savings" />
      <Tabs.Screen name="team" />
    </Tabs>
  );
}
