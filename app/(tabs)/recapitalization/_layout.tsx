import { Stack } from 'expo-router'
import { gestureDisabledOptions, stackGestureDefaults } from '../../../utils/navigationGestures'

export default function RecapitalizationLayout() {
  return (
    <Stack screenOptions={stackGestureDefaults}>
      <Stack.Screen name="index" options={gestureDisabledOptions} />
      <Stack.Screen name="project-timeline" />
      <Stack.Screen name="readiness-report" />
      <Stack.Screen name="timeline-reports" />
    </Stack>
  )
}
