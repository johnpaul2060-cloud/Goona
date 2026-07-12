import { useEffect } from 'react'
import { View } from 'react-native'
import { router, useNavigation } from 'expo-router'

export default function ReadinessReportRedirect() {
  const navigation = useNavigation()
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      router.replace('/(tabs)/recapitalization/timeline-reports?tab=reports')
    })
    return unsubscribe
  }, [navigation])
  return <View />
}
