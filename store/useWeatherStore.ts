import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

export interface WeatherDay {
  date: string
  rainProbability: number
  tempHigh: number
  tempLow: number
  humidity: number
  windSpeed: number
  condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'heatwave'
  floodRisk: 'none' | 'low' | 'medium' | 'high'
}

interface WeatherState {
  forecast: WeatherDay[]
  lastSync: number | null
  updateForecast: (days: WeatherDay[]) => void
  getToday: () => WeatherDay | null
  getWeek: () => WeatherDay[]
  getAlerts: () => { type: string; message: string }[]
  isStale: () => boolean
}

function generateDemoForecast(): WeatherDay[] {
  const days: WeatherDay[] = []
  const now = new Date()
  const conditions: WeatherDay['condition'][] = ['sunny', 'cloudy', 'rainy', 'stormy', 'heatwave']

  for (let i = 0; i < 7; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() + i)
    const dateStr = d.toISOString().split('T')[0]
    const isRainy = Math.random() > 0.6

    days.push({
      date: dateStr,
      rainProbability: Math.round(Math.random() * 100),
      tempHigh: Math.round(28 + Math.random() * 14),
      tempLow: Math.round(18 + Math.random() * 8),
      humidity: Math.round(40 + Math.random() * 50),
      windSpeed: Math.round(5 + Math.random() * 30),
      condition: isRainy ? 'rainy' : conditions[Math.floor(Math.random() * 4)],
      floodRisk: Math.random() > 0.85 ? 'high' : Math.random() > 0.7 ? 'medium' : 'none',
    })
  }
  return days
}

export const useWeatherStore = create<WeatherState>()(
  persist(
    (set, get) => ({
      forecast: [],
      lastSync: null,

      updateForecast: (days) => {
        set({ forecast: days, lastSync: Date.now() })
      },

      getToday: () => {
        const today = new Date().toISOString().split('T')[0]
        return get().forecast.find((d) => d.date === today) || null
      },

      getWeek: () => {
        return get().forecast
      },

      getAlerts: () => {
        const alerts: { type: string; message: string }[] = []
        const week = get().forecast

        for (const day of week) {
          if (day.rainProbability >= 70) {
            alerts.push({ type: 'rain', message: `Rain expected: ${day.rainProbability}% chance on ${day.date}` })
          }
          if (day.tempHigh >= 40) {
            alerts.push({ type: 'heatwave', message: `Heatwave warning: ${day.tempHigh}°C on ${day.date}` })
          }
          if (day.floodRisk === 'high') {
            alerts.push({ type: 'flood', message: `Flood risk: High on ${day.date}. Secure drainage.` })
          }
          if (day.windSpeed >= 25) {
            alerts.push({ type: 'wind', message: `High wind: ${day.windSpeed} km/h on ${day.date}. Secure structures.` })
          }
        }
        return alerts
      },

      isStale: () => {
        const lastSync = get().lastSync
        if (!lastSync) return true
        return Date.now() - lastSync > 6 * 60 * 60 * 1000
      },
    }),
    {
      name: 'goona-weather',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)

export function seedWeatherForecast() {
  const store = useWeatherStore.getState()
  if (store.forecast.length === 0 || store.isStale()) {
    store.updateForecast(generateDemoForecast())
  }
}
