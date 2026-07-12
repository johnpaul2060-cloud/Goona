import { useEffect } from 'react'
import { View } from 'react-native'
import { router, useNavigation } from 'expo-router'

export default function ProjectTimelineRedirect() {
  const navigation = useNavigation()
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      router.replace('/(tabs)/recapitalization/timeline-reports?tab=timeline')
    })
    return unsubscribe
  }, [navigation])
  return <View />
}
