import { useEffect, useRef } from 'react'
import { useNotificationStore } from '../store/useNotificationStore'
import { seedWeatherForecast } from '../store/useWeatherStore'
import WeatherNotificationSync from './WeatherNotificationSync'

export default function NotificationInitializer() {
  const seeded = useRef(false)

  useEffect(() => {
    if (seeded.current) return
    seeded.current = true
    useNotificationStore.getState().seedDemoNotifications()
    seedWeatherForecast()
  }, [])

  return <WeatherNotificationSync />
}
