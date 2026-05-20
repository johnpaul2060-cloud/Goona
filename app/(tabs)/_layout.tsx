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
      <Tabs.Screen name="batches" />
      <Tabs.Screen name="farm-feed" />
      <Tabs.Screen name="records" />
      <Tabs.Screen name="sales-revenue" />
      <Tabs.Screen name="recapitalization" />
      <Tabs.Screen name="team" />
    </Tabs>
  );
}
