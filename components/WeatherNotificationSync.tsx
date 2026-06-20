import { useEffect, useRef } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useWeatherStore, seedWeatherForecast } from '../store/useWeatherStore'
import { useNotificationStore } from '../store/useNotificationStore'

const WEATHER_ALERT_IDS_KEY = 'goona-weather-alert-ids'

async function getProcessedAlerts(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(WEATHER_ALERT_IDS_KEY)
    return new Set(raw ? JSON.parse(raw) : [])
  } catch {
    return new Set()
  }
}

async function saveProcessedAlerts(ids: Set<string>) {
  try {
    await AsyncStorage.setItem(WEATHER_ALERT_IDS_KEY, JSON.stringify([...ids]))
  } catch {}
}

export default function WeatherNotificationSync() {
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    seedWeatherForecast()

    const checkWeather = async () => {
      const weatherStore = useWeatherStore.getState()
      const notifStore = useNotificationStore.getState()
      const alerts = weatherStore.getAlerts()
      const processed = await getProcessedAlerts()
      let changed = false

      for (const alert of alerts) {
        const id = `weather-${alert.type}-${alert.message.slice(0, 20)}`
        if (processed.has(id)) continue

        const priority = alert.type === 'flood' || alert.type === 'heatwave' ? 'critical' as const : 'warning' as const
        notifStore.addNotification({
          category: 'weather',
          priority,
          title: alert.type === 'rain' ? 'Rain expected' :
                 alert.type === 'heatwave' ? 'Heatwave warning' :
                 alert.type === 'flood' ? 'Flood risk' :
                 'High wind warning',
          description: alert.message,
          pinned: priority === 'critical',
        })
        processed.add(id)
        changed = true
      }
      if (changed) await saveProcessedAlerts(processed)
    }

    checkWeather()
    const interval = setInterval(checkWeather, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  return null
}
