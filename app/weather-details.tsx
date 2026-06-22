import React, { useEffect, useMemo, useState } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Dimensions, Modal, Platform,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import GoonaIcon from '../components/ui/GoonaIcon'
import { Icons } from '../shared/icons'
import Animated, { FadeInUp, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, withSpring, Easing } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { generateForecastReport, generate3DayForecast, type ForecastReport, type ThreeDayForecast, type DayForecast } from '../utils/weatherIntelligence'

const { width: SCREEN_W } = Dimensions.get('window')

const DAY_LABELS = ['Today', 'Tomorrow']
function actualDayName(index: number): string {
  if (index < DAY_LABELS.length) return DAY_LABELS[index]
  const d = new Date(); d.setDate(d.getDate() + index)
  return d.toLocaleDateString('en-US', { weekday: 'long' })
}
function forecastSummary(days: DayForecast[]): string {
  const parts: string[] = []
  if (days.some(d => d.risk === 'high')) parts.push('elevated operational risk')
  if (days.some(d => d.humidity > 70)) parts.push('high humidity')
  if (days.some(d => d.rainProb > 50)) parts.push('rainfall expected')
  if (days.some(d => d.tempHigh > 34)) parts.push('extreme heat')
  if (parts.length === 0) return 'Conditions are stable over the next few days.'
  return parts.length === 1
    ? `${parts[0].charAt(0).toUpperCase() + parts[0].slice(1)} is expected over the next 48 hours.`
    : `${parts.slice(0, -1).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(', ')} and ${parts[parts.length - 1]} are expected over the next 48 hours.`
}
function forecastActions(days: DayForecast[]): string[] {
  const actions: string[] = []
  if (days.some(d => d.humidity > 70)) actions.push('Increase ventilation — monitor litter moisture')
  if (days.some(d => d.rainProb > 50)) actions.push('Secure feed storage — check drainage systems')
  if (days.some(d => d.rainProb > 50)) actions.push('Delay litter turning until conditions improve')
  if (days.some(d => d.tempHigh > 34)) actions.push('Activate emergency ventilation protocols')
  if (days.some(d => parseInt(d.windSpeed) > 25)) actions.push('Secure netting and portable equipment')
  return actions.length > 0 ? actions : ['Maintain standard operational protocols']
}

/* ─── Weather Explanation Data ─── */
function getTempExplanation(temp: number) {
  const hot = temp > 34
  const warm = temp > 30
  return {
    whatItMeans: hot ? 'Today will be very hot. Birds will feel the heat strongly.' : warm ? 'Today will be warm. Birds may start to feel uncomfortable.' : 'The temperature is mild. Birds will be comfortable.',
    icon: Icons.thermometer, iconColor: hot ? '#EF4444' : warm ? '#F59E0B' : '#2E7D32',
    severity: hot ? 'High Risk' as const : warm ? 'Moderate Risk' as const : 'Low Risk' as const,
    severityColor: hot ? '#EF4444' : warm ? '#F59E0B' : '#2E7D32',
    impact: hot ? [
      'Birds will drink much more water than usual.',
      'Heat stress risk is high — birds may pant heavily.',
      'Feed intake will drop during hot afternoon hours.',
      'Egg production and weight gain may slow down.',
    ] : warm ? [
      'Birds may drink more water than normal.',
      'Mild heat stress possible during peak hours.',
      'Feed conversion may decrease slightly.',
    ] : [
      'No heat stress expected.',
      'Normal feeding and drinking patterns.',
      'Comfortable conditions for poultry.',
    ],
    actions: hot ? [
      'Turn on fans and open ventilation fully.',
      'Provide cool, clean drinking water at all times.',
      'Reduce bird density if possible.',
      'Feed during early morning or late evening when it is cooler.',
      'Watch for signs of heat stress: panting, spreading wings, lethargy.',
    ] : warm ? [
      'Check ventilation systems are working properly.',
      'Provide extra drinking water points.',
      'Avoid handling birds during the hottest part of the day.',
    ] : [
      'Maintain standard ventilation.',
      'Normal feeding schedule applies.',
      'No special precautions needed.',
    ],
    voiceText: `Today's temperature is ${Math.round(temp)} degrees Celsius. ${hot ? 'Conditions may be very hot. Ensure birds have sufficient drinking water and proper ventilation. Watch for signs of heat stress.' : warm ? 'Conditions are warm. Monitor birds for signs of heat stress and provide extra water.' : 'Temperatures are mild. No special precautions needed for your birds.'}`,
  }
}

function getHumidityExplanation(humidity: number) {
  const high = humidity > 75
  const medium = humidity > 60
  return {
    whatItMeans: high ? 'The air contains a lot of moisture. This can affect bird health and litter quality.' : medium ? 'The air is somewhat moist. Keep an eye on litter conditions.' : 'The air is dry enough. Conditions are good for bird health.',
    icon: Icons.droplets, iconColor: high ? '#0891B2' : medium ? '#0EA5E9' : '#2E7D32',
    severity: high ? 'High Risk' as const : medium ? 'Moderate Risk' as const : 'Low Risk' as const,
    severityColor: high ? '#EF4444' : medium ? '#F59E0B' : '#2E7D32',
    impact: high ? [
      'Wet litter may develop faster than usual.',
      'Disease organisms may survive longer in damp conditions.',
      'Ammonia buildup can increase, affecting bird breathing.',
      'Bacterial and respiratory risks go up.',
    ] : medium ? [
      'Litter moisture should be monitored closely.',
      'Mild risk of ammonia buildup.',
      'Check for signs of respiratory stress.',
    ] : [
      'Litter conditions should remain dry.',
      'Low risk of respiratory issues.',
      'Normal ventilation is sufficient.',
    ],
    actions: high ? [
      'Check litter condition twice daily.',
      'Improve airflow and ventilation.',
      'Monitor bird behaviour for coughing or sneezing.',
      'Turn litter more frequently to keep it dry.',
      'Reduce water spillage from drinkers.',
    ] : medium ? [
      'Monitor litter moisture levels.',
      'Ensure ventilation is adequate.',
      'Check birds for respiratory signs.',
    ] : [
      'Maintain current ventilation.',
      'Continue normal litter management.',
    ],
    voiceText: `Humidity is at ${humidity} percent. ${high ? 'The air is very moist. This can lead to wet litter and increase the risk of disease. Improve ventilation and check litter conditions.' : medium ? 'The air is slightly moist. Keep an eye on litter conditions and ventilation.' : 'Humidity levels are good. No action needed.'}`,
  }
}

function getRainExplanation(prob: number, timing: string) {
  const likely = prob > 60
  const possible = prob > 30
  return {
    whatItMeans: likely ? 'Rain is likely. Prepare your farm for wet conditions.' : possible ? 'Rain is possible but not guaranteed. Stay prepared.' : 'Rain is unlikely. Conditions should stay dry.',
    icon: Icons.cloudRain, iconColor: likely ? '#1A56FF' : possible ? '#6366F1' : '#94A3B8',
    severity: likely ? 'Moderate Risk' as const : 'Low Risk' as const,
    severityColor: likely ? '#F59E0B' : '#2E7D32',
    impact: likely ? [
      'Outdoor activities may be affected.',
      'Feed storage must remain protected from moisture.',
      'Drainage systems should be ready.',
      'Pond levels may rise.',
    ] : possible ? [
      'Outdoor work may be interrupted briefly.',
      'Feed storage should remain covered.',
      'No major disruptions expected.',
    ] : [
      'No rain-related disruptions expected.',
      'Normal outdoor activities can continue.',
    ],
    actions: likely ? [
      'Secure feed storage areas.',
      'Check and clean drainage channels.',
      'Delay litter turning until conditions improve.',
      'Cover any exposed equipment.',
      'Monitor pond water levels if applicable.',
    ] : possible ? [
      'Keep feed storage covered.',
      'Have drainage channels clear.',
    ] : [
      'No special precautions needed.',
    ],
    voiceText: `Rain chance is ${prob} percent. ${likely ? 'Rain is likely. Secure your feed storage and check drainage systems before the rain arrives.' : possible ? 'Rain is possible. Keep feed storage covered and be prepared.' : 'Rain is unlikely. You can continue outdoor activities as normal.'}`,
  }
}

function getWindExplanation(speed: string) {
  const num = parseInt(speed) || 0
  const strong = num > 30
  const moderate = num > 20
  return {
    whatItMeans: strong ? 'Strong wind expected. This can affect open-sided poultry houses.' : moderate ? 'Moderate wind. Loose materials may shift.' : 'Light wind. Conditions are calm.',
    icon: Icons.wind, iconColor: strong ? '#EF4444' : moderate ? '#6366F1' : '#2E7D32',
    severity: strong ? 'High Risk' as const : moderate ? 'Moderate Risk' as const : 'Low Risk' as const,
    severityColor: strong ? '#EF4444' : moderate ? '#F59E0B' : '#2E7D32',
    impact: strong ? [
      'Loose equipment and materials may be blown away.',
      'Open-sided poultry houses may experience drafts.',
      'Curtains and ventilation panels need securing.',
      'Feed shed roofs should be checked.',
    ] : moderate ? [
      'Light materials may shift in outdoor areas.',
      'Poultry house curtains may need adjustment.',
    ] : [
      'No wind-related concerns.',
      'Good conditions for outdoor work.',
    ],
    actions: strong ? [
      'Secure all loose equipment and materials.',
      'Check and fasten curtains and ventilation panels.',
      'Inspect feed storage roofs for damage.',
      'Avoid working at heights during windy conditions.',
      'Monitor birds for draft stress.',
    ] : moderate ? [
      'Secure any loose items in outdoor areas.',
      'Check poultry house curtains.',
    ] : [
      'No wind-related actions needed.',
    ],
    voiceText: `Wind speed is ${speed}. ${strong ? 'Strong winds expected. Secure all loose equipment and check poultry house curtains and ventilation panels.' : moderate ? 'Moderate wind conditions. Secure any loose items in outdoor areas.' : 'Light winds. Conditions are calm and safe for outdoor work.'}`,
  }
}

const GOONA_WEATHER_QUESTIONS = [
  { q: 'Will my birds be stressed today?', key: 'stress' },
  { q: 'Is today good for vaccination?', key: 'vaccination' },
  { q: 'Should I feed early today?', key: 'feed' },
  { q: 'Will rain affect my pond?', key: 'pond' },
]

function getGoonaAnswer(question: string, report: ForecastReport): string {
  const q = question.toLowerCase()
  if (q.includes('stress') || q.includes('stressed')) {
    const risk = report.temperature.current > 32 || report.humidity.risk === 'high'
    return risk
      ? 'Yes, birds may be stressed today due to heat and humidity. Increase ventilation, provide extra water, and avoid handling birds during peak heat hours.'
      : 'Your birds should be fine today. Conditions are within their comfort range. Continue normal monitoring.'
  }
  if (q.includes('vaccin') || q.includes('vaccination')) {
    return report.temperature.current > 34
      ? 'It is not recommended to vaccinate today. The heat will add extra stress on the birds. Wait for a cooler day or vaccinate early in the morning.'
      : 'Conditions are suitable for vaccination today. Perform the procedure early in the morning or late evening when temperatures are cooler to minimise stress.'
  }
  if (q.includes('feed') || q.includes('early')) {
    return report.temperature.current > 32
      ? 'Yes, feed early today. Birds eat more during cooler hours. Shift feeding to early morning (5-7 AM) and late evening (6-8 PM) for best results.'
      : 'Normal feeding times are fine today. No need to adjust the schedule.'
  }
  if (q.includes('pond') || q.includes('rain')) {
    return report.rainfall.expected
      ? `Yes, rain is expected ${report.rainfall.timing.toLowerCase()}. Pond water levels may rise. Check overflow channels and monitor fish behaviour after rainfall. Reduce feeding during heavy rain.`
      : 'Rain is not expected today. Your pond should be fine. Continue normal pond management.'
  }
  return 'Based on current weather data, your farm operations should proceed as normal. Monitor birds closely and adjust as needed based on conditions.'
}

function ConditionIcon({ condition, size = 18 }: { condition: DayForecast['condition']; size?: number }) {
  const map: Record<DayForecast['condition'], { icon: any; color: string }> = {
    sunny: { icon: Icons.sun, color: '#F59E0B' },
    cloudy: { icon: Icons.cloudSun, color: '#94A3B8' },
    rainy: { icon: Icons.cloudRain, color: '#1A56FF' },
    stormy: { icon: Icons.cloudLightning, color: '#6366F1' },
    humid: { icon: Icons.droplets, color: '#0891B2' },
  }
  const m = map[condition]
  return <GoonaIcon icon={m.icon} size={size} color={m.color} />
}

function usePressScale(scaleTo = 0.96) {
  const scale = useSharedValue(1)
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
  return {
    style,
    onPressIn: () => { scale.value = withSpring(scaleTo, { damping: 15, stiffness: 200 }) },
    onPressOut: () => { scale.value = withSpring(1, { damping: 15, stiffness: 200 }) },
    scale,
  }
}

export default function WeatherDetailsScreen() {
  const insets = useSafeAreaInsets()
  const [report, setReport] = useState<ForecastReport | null>(null)
  const [forecast, setForecast] = useState<ThreeDayForecast | null>(null)
  const [selectedMetric, setSelectedMetric] = useState<{ type: string; data: any } | null>(null)
  const [selectedDay, setSelectedDay] = useState<DayForecast | null>(null)
  const [selectedDayIndex, setSelectedDayIndex] = useState(0)
  const [voicePlaying, setVoicePlaying] = useState<string | null>(null)
  const [advisorQuery, setAdvisorQuery] = useState<string | null>(null)
  const [advisorAnswer, setAdvisorAnswer] = useState<string | null>(null)

  useEffect(() => {
    setReport(generateForecastReport())
    setForecast(generate3DayForecast())
  }, [])

  const hours = useMemo(() => {
    if (!report) return []
    const base = Math.round(report.temperature.current)
    const now = new Date()
    const h = now.getHours()
    return Array.from({ length: 6 }, (_, i) => {
      const hour = (h + i) % 24
      const label = i === 0 ? 'Now' : `${hour.toString().padStart(2, '0')}:00`
      const variation = Math.round((Math.sin(i * 0.8) * 2) + (i === 3 ? -2 : i === 4 ? -3 : 0))
      const temp = base + variation
      const icon = temp > 33 ? Icons.sun : temp > 30 ? Icons.cloudSun : temp > 27 ? Icons.cloud : Icons.cloudRain
      const color = temp > 33 ? '#F59E0B' : temp > 30 ? '#94A3B8' : '#1A56FF'
      return { time: label, temp: `${temp}°`, icon, color }
    })
  }, [report])

  const heading = report?.temperature.trend === 'rising' ? 'Temperatures Rising' 
    : report?.temperature.trend === 'falling' ? 'Temperatures Dropping'
    : 'Conditions Stable'

  const handleVoice = (text: string, type: string) => {
    setVoicePlaying(type)
    setTimeout(() => setVoicePlaying(null), 1500)
  }

  const handleMetricPress = (type: string, data: any) => {
    setSelectedMetric({ type, data })
  }

  const handleDayPress = (day: DayForecast, index: number) => {
    setSelectedDay(day)
    setSelectedDayIndex(index)
  }

  const handleAdvisorAsk = (question: string) => {
    if (!report) return
    setAdvisorQuery(question)
    setAdvisorAnswer(getGoonaAnswer(question, report))
  }

  if (!report || !forecast) return null

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.blobTop} pointerEvents="none" />
      <View style={styles.blobBottom} pointerEvents="none" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollInner, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <Animated.View entering={FadeInUp.duration(500).springify()} style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/dashboard' as any)}>
            <GoonaIcon icon={Icons.arrowLeft} size={24} color="#1B1B1B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Weather Center</Text>
          <View style={styles.headerRisk}>
            <View style={[styles.riskBadge, { backgroundColor: `${report.operationalRisk.color}15` }]}>
              <Text style={[styles.riskBadgeText, { color: report.operationalRisk.color }]}>{report.operationalRisk.label}</Text>
            </View>
          </View>
        </Animated.View>

        {/* CURRENT WEATHER HERO */}
        <PulseHero report={report} />

        {/* HOURLY FORECAST */}
        <Animated.View entering={FadeInUp.duration(500).delay(140).springify()} style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Hourly Forecast</Text>
            <Text style={styles.sectionSub}>{heading}</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hourlyScroll}>
            {hours.map((h, i) => (
              <View key={i} style={[styles.hourItem, i === 0 && styles.hourItemActive]}>
                <Text style={[styles.hourTime, i === 0 && { color: '#2E7D32', fontWeight: '700' }]}>{h.time}</Text>
                <GoonaIcon icon={h.icon} size={20} color={i === 0 ? '#2E7D32' : h.color} />
                <Text style={[styles.hourTemp, i === 0 && { color: '#2E7D32', fontWeight: '700' }]}>{h.temp}</Text>
              </View>
            ))}
          </ScrollView>
        </Animated.View>

        {/* DETAILED METRICS */}
        <Animated.View entering={FadeInUp.duration(500).delay(200).springify()} style={styles.metricsGrid}>
          <WeatherMetricCard
            icon={Icons.thermometer}
            label="Temperature"
            value={`${report.temperature.current}°C`}
            note={`H: ${Math.round(report.temperature.high)}° L: ${Math.round(report.temperature.low)}°`}
            color="#F59E0B"
            riskColor={report.temperature.current > 34 ? '#EF4444' : report.temperature.current > 30 ? '#F59E0B' : '#2E7D32'}
            riskLabel={report.temperature.current > 34 ? 'High' : report.temperature.current > 30 ? 'Moderate' : 'Low'}
            voiceText={`Today's temperature is ${Math.round(report.temperature.current)} degrees Celsius. ${report.temperature.current > 34 ? 'Conditions may be very hot. Ensure birds have sufficient drinking water and proper ventilation.' : report.temperature.current > 30 ? 'Conditions are warm. Monitor birds for heat stress.' : 'Temperatures are mild. No special precautions needed.'}`}
            onPress={() => handleMetricPress('temperature', getTempExplanation(report.temperature.current))}
            onVoice={() => handleVoice('temperature', 'temp')}
            voiceActive={voicePlaying === 'temp'}
          />
          <WeatherMetricCard
            icon={Icons.droplets}
            label="Humidity"
            value={`${report.humidity.current}%`}
            note={report.humidity.risk === 'high' ? 'High' : report.humidity.risk === 'medium' ? 'Moderate' : 'Normal'}
            color="#0891B2"
            riskColor={report.humidity.risk === 'high' ? '#EF4444' : report.humidity.risk === 'medium' ? '#F59E0B' : '#2E7D32'}
            riskLabel={report.humidity.risk === 'high' ? 'High' : report.humidity.risk === 'medium' ? 'Moderate' : 'Low'}
            voiceText={`Humidity is at ${report.humidity.current} percent. ${report.humidity.risk === 'high' ? 'The air is very moist. This can lead to wet litter. Improve ventilation and check litter conditions.' : report.humidity.risk === 'medium' ? 'The air is slightly moist. Keep an eye on litter conditions.' : 'Humidity levels are good.'}`}
            onPress={() => handleMetricPress('humidity', getHumidityExplanation(report.humidity.current))}
            onVoice={() => handleVoice('humidity', 'hum')}
            voiceActive={voicePlaying === 'hum'}
          />
          <WeatherMetricCard
            icon={Icons.cloudRain}
            label="Rainfall"
            value={`${report.rainfall.probability}%`}
            note={report.rainfall.expected ? report.rainfall.timing : 'Not expected'}
            color={report.rainfall.expected ? '#1A56FF' : '#94A3B8'}
            riskColor={report.rainfall.probability > 60 ? '#F59E0B' : '#2E7D32'}
            riskLabel={report.rainfall.probability > 60 ? 'Moderate' : 'Low'}
            voiceText={`Rain chance is ${report.rainfall.probability} percent. ${report.rainfall.probability > 60 ? 'Rain is likely. Secure your feed storage and check drainage systems.' : report.rainfall.probability > 30 ? 'Rain is possible. Keep feed storage covered.' : 'Rain is unlikely. Outdoor activities can continue as normal.'}`}
            onPress={() => handleMetricPress('rainfall', getRainExplanation(report.rainfall.probability, report.rainfall.timing))}
            onVoice={() => handleVoice('rainfall', 'rain')}
            voiceActive={voicePlaying === 'rain'}
          />
          <WeatherMetricCard
            icon={Icons.wind}
            label="Wind Speed"
            value={report.wind.speed}
            note={report.wind.risk === 'high' ? 'Gusty' : report.wind.risk === 'medium' ? 'Moderate' : 'Light'}
            color={report.wind.risk === 'high' ? '#EF4444' : report.wind.risk === 'medium' ? '#6366F1' : '#2E7D32'}
            riskColor={report.wind.risk === 'high' ? '#EF4444' : report.wind.risk === 'medium' ? '#F59E0B' : '#2E7D32'}
            riskLabel={report.wind.risk === 'high' ? 'High' : report.wind.risk === 'medium' ? 'Moderate' : 'Low'}
            voiceText={`Wind speed is ${report.wind.speed}. ${report.wind.risk === 'high' ? 'Strong winds expected. Secure all loose equipment and check poultry house curtains.' : report.wind.risk === 'medium' ? 'Moderate wind conditions. Secure any loose items in outdoor areas.' : 'Light winds. Conditions are calm.'}`}
            onPress={() => handleMetricPress('wind', getWindExplanation(report.wind.speed))}
            onVoice={() => handleVoice('wind', 'wind')}
            voiceActive={voicePlaying === 'wind'}
          />
        </Animated.View>

        {/* 3-DAY FORECAST */}
        <Animated.View entering={FadeInUp.duration(500).delay(260).springify()} style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>3-Day Forecast</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.forecastScroll}>
            {forecast.days.map((d, i) => (
              <TouchableOpacity key={d.day} activeOpacity={0.8} onPress={() => handleDayPress(d, i)} style={styles.forecastCard}>
                <View style={styles.forecastCardHeader}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.forecastCardDay} numberOfLines={1}>{actualDayName(i)}</Text>
                    <TouchableOpacity onPress={() => { handleVoice(`forecast-${i}`, `fc-${i}`); setTimeout(() => setVoicePlaying(null), 1500) }} style={styles.forecastVoiceBtn}>
                      <GoonaIcon icon={Icons.volume2} size={14} color={voicePlaying === `fc-${i}` ? '#2E7D32' : '#94A3B8'} />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.forecastCardDate}>{d.date}</Text>
                </View>
                <View style={styles.forecastCardIcon}>
                  <ConditionIcon condition={d.condition} size={32} />
                  <Text style={styles.forecastCardCondition}>{d.condition.charAt(0).toUpperCase() + d.condition.slice(1)}</Text>
                </View>
                <View style={styles.forecastCardTempRow}>
                  <Text style={styles.forecastCardTemp}>{d.tempHigh}°C</Text>
                  <Text style={styles.forecastCardTempLow}>{d.tempLow}°C</Text>
                </View>
                <View style={styles.forecastCardMetrics}>
                  <View style={styles.forecastCardMetric}>
                    <GoonaIcon icon={Icons.droplets} size={14} color="#0891B2" />
                    <Text style={styles.forecastCardMetricText}>{d.humidity}%</Text>
                  </View>
                  <View style={styles.forecastCardMetricDiv} />
                  <View style={styles.forecastCardMetric}>
                    <GoonaIcon icon={Icons.cloudRain} size={14} color="#1A56FF" />
                    <Text style={styles.forecastCardMetricText}>{d.rainProb}%</Text>
                  </View>
                </View>
                <ForecastRiskBadge level={d.risk} />
              </TouchableOpacity>
            ))}
          </ScrollView>
          <ForecastAlert days={forecast.days} />
        </Animated.View>

        {/* FARM IMPACT ANALYSIS */}
        {report.alerts.length > 0 && (
          <Animated.View entering={FadeInUp.duration(500).delay(320).springify()} style={styles.impactCard}>
            <View style={styles.impactHeader}>
              <GoonaIcon icon={Icons.shieldCheck} size={18} color="#2E7D32" />
              <Text style={styles.impactTitle}>Farm Impact Analysis</Text>
            </View>
            {report.alerts.slice(0, 4).map((alert, i) => (
              <View key={i} style={styles.impactRow}>
                <View style={[styles.impactIconWrap, { backgroundColor: `${alert.color}15` }]}>
                  <GoonaIcon icon={alert.icon} size={12} color={alert.color} />
                </View>
                <View style={styles.impactContent}>
                  <Text style={styles.impactText} numberOfLines={2}>{alert.message}</Text>
                  <View style={styles.impactMeta}>
                    <View style={[styles.severityBadge, { backgroundColor: alert.severity === 'high' ? '#FEF2F2' : alert.severity === 'medium' ? '#FFFBEB' : '#F0FDF4' }]}>
                      <Text style={[styles.severityText, { color: alert.severity === 'high' ? '#EF4444' : alert.severity === 'medium' ? '#F59E0B' : '#2E7D32' }]}>
                        {alert.severity === 'high' ? 'High' : alert.severity === 'medium' ? 'Moderate' : 'Low'}
                      </Text>
                    </View>
                    <Text style={styles.impactCategory}>{alert.category.charAt(0).toUpperCase() + alert.category.slice(1)}</Text>
                  </View>
                </View>
              </View>
            ))}
          </Animated.View>
        )}

        {/* WEATHER ALERTS */}
        {report.alerts.filter(a => a.severity === 'high').length > 0 && (
          <Animated.View entering={FadeInUp.duration(500).delay(380).springify()} style={styles.alertsCard}>
            <View style={styles.alertsHeader}>
              <GoonaIcon icon={Icons.alertTriangle} size={18} color="#EF4444" />
              <Text style={styles.alertsTitle}>Active Weather Alerts</Text>
              <View style={styles.alertsCount}>
                <Text style={styles.alertsCountText}>{report.alerts.filter(a => a.severity === 'high').length}</Text>
              </View>
            </View>
            {report.alerts.filter(a => a.severity === 'high').map((alert, i) => (
              <View key={i} style={styles.alertRow}>
                <GoonaIcon icon={alert.icon} size={14} color={alert.color} />
                <Text style={styles.alertText} numberOfLines={2}>{alert.message}</Text>
              </View>
            ))}
          </Animated.View>
        )}

        {/* AI RECOMMENDATIONS */}
        {report.recommendations.length > 0 && (
          <Animated.View entering={FadeInUp.duration(500).delay(440).springify()} style={styles.recsCard}>
            <View style={styles.recsHeader}>
              <GoonaIcon icon={Icons.sparkles} size={16} color="#2E7D32" />
              <Text style={styles.recsTitle}>AI Recommendations</Text>
            </View>
            {report.recommendations.map((rec, i) => (
              <View key={i} style={styles.recRow}>
                <View style={styles.recBullet} />
                <Text style={styles.recText}>{rec}</Text>
              </View>
            ))}
          </Animated.View>
        )}

        {/* FARM PRODUCTION IMPACT */}
        <Animated.View entering={FadeInUp.duration(500).delay(500).springify()} style={styles.productionCard}>
          <View style={styles.productionHeader}>
            <GoonaIcon icon={Icons.sprout} size={18} color="#2E7D32" />
            <Text style={styles.productionTitle}>Production Impact</Text>
          </View>
          <View style={styles.productionGrid}>
            <View style={styles.productionMetric}>
              <Text style={styles.productionLabel}>Feed Conversion</Text>
              <Text style={styles.productionImpact}>
                {report.temperature.current > 32 ? 'May worsen 8-12%' : 'Normal'}
              </Text>
              <View style={[styles.productionDot, { backgroundColor: report.temperature.current > 32 ? '#EF4444' : '#2E7D32' }]} />
            </View>
            <View style={styles.productionMetric}>
              <Text style={styles.productionLabel}>Water Intake</Text>
              <Text style={styles.productionImpact}>
                {report.temperature.current > 30 ? 'Expected +18-25%' : 'Normal range'}
              </Text>
              <View style={[styles.productionDot, { backgroundColor: report.temperature.current > 30 ? '#F59E0B' : '#2E7D32' }]} />
            </View>
            <View style={styles.productionMetric}>
              <Text style={styles.productionLabel}>Ventilation</Text>
              <Text style={styles.productionImpact}>
                {report.humidity.risk === 'high' ? 'Increase capacity' : report.temperature.current > 32 ? 'Monitor closely' : 'Standard'}
              </Text>
              <View style={[styles.productionDot, { backgroundColor: report.humidity.risk === 'high' ? '#EF4444' : '#2E7D32' }]} />
            </View>
            <View style={styles.productionMetric}>
              <Text style={styles.productionLabel}>Stocking Density</Text>
              <Text style={styles.productionImpact}>
                {report.temperature.current > 34 ? 'Reduce 15% advised' : report.operationalRisk.score > 50 ? 'Monitor stress' : 'Optimal'}
              </Text>
              <View style={[styles.productionDot, { backgroundColor: report.temperature.current > 34 ? '#EF4444' : '#2E7D32' }]} />
            </View>
          </View>
        </Animated.View>

        {/* GOONA AI WEATHER ADVISOR */}
        <Animated.View entering={FadeInUp.duration(500).delay(560).springify()} style={styles.advisorCard}>
          <View style={styles.advisorHeader}>
            <GoonaIcon icon={Icons.sparkles} size={18} color="#2E7D32" />
            <Text style={styles.advisorTitle}>Ask GOONA About Today's Weather</Text>
          </View>
          <Text style={styles.advisorSub}>Get plain-language answers about how weather affects your farm today.</Text>
          <View style={styles.advisorQuestions}>
            {GOONA_WEATHER_QUESTIONS.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[styles.advisorQuestionChip, advisorQuery === item.q && styles.advisorQuestionChipActive]}
                onPress={() => handleAdvisorAsk(item.q)}
                activeOpacity={0.8}
              >
                <Text style={[styles.advisorQuestionText, advisorQuery === item.q && styles.advisorQuestionTextActive]}>{item.q}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {advisorAnswer && (
            <Animated.View entering={FadeInUp.duration(400).springify()} style={styles.advisorAnswer}>
              <View style={styles.advisorAnswerHead}>
                <GoonaIcon icon={Icons.messageCircle} size={14} color="#2E7D32" />
                <Text style={styles.advisorAnswerLabel}>GOONA Says:</Text>
              </View>
              <Text style={styles.advisorAnswerText}>{advisorAnswer}</Text>
            </Animated.View>
          )}
        </Animated.View>

        {/* VIEW FULL ANALYSIS */}
        <Animated.View entering={FadeInUp.duration(500).delay(620).springify()}>
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={() => router.navigate({ pathname: '/goona-iq' as any } as any)}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#2E7D32', '#1B5E20']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
              borderRadius={20}
            />
            <GoonaIcon icon={Icons.eye} size={18} color="white" />
            <Text style={styles.ctaText}>View Full GOONA IQ Analysis</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* OFFLINE BANNER */}
        <Animated.View entering={FadeInUp.duration(500).delay(680).springify()} style={styles.offlineBanner}>
          <GoonaIcon icon={Icons.cloudSun} size={14} color="#64748B" />
          <Text style={styles.offlineBannerText}>Last updated just now. Weather data is cached for offline use.</Text>
        </Animated.View>

        {/* MODALS */}
        <WeatherExplanationModal
          visible={selectedMetric !== null}
          data={selectedMetric?.data || null}
          onClose={() => setSelectedMetric(null)}
          voiceText={(metric: any) => metric?.voiceText || ''}
          onVoice={(text: string) => { setVoicePlaying('modal'); setTimeout(() => setVoicePlaying(null), 1500) }}
          voicePlaying={voicePlaying === 'modal'}
        />
        <ForecastDayModal
          visible={selectedDay !== null}
          day={selectedDay}
          index={selectedDayIndex}
          onClose={() => setSelectedDay(null)}
          dayName={(i: number) => actualDayName(i)}
        />

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

function PulseHero({ report }: { report: ForecastReport }) {
  const pulse = useSharedValue(1)

  useEffect(() => {
    if (report.operationalRisk.score > 50) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.02, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        ),
        -1, true,
      )
    }
  }, [report.operationalRisk.score])

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }))

  const conditionIcon = report.temperature.current > 34 ? Icons.thermometer
    : report.rainfall.expected ? Icons.cloudRain
    : report.humidity.risk === 'high' ? Icons.droplets
    : Icons.sun

  const conditionColor = report.temperature.current > 34 ? '#EF4444'
    : report.rainfall.expected ? '#1A56FF'
    : report.humidity.risk === 'high' ? '#0891B2'
    : '#FFD700'

  const conditionText = report.temperature.current > 34 ? 'Heat Stress Risk'
    : report.rainfall.expected ? `Rain expected — ${report.rainfall.timing}`
    : report.humidity.risk === 'high' ? 'High Humidity Advisory'
    : 'Clear conditions'

  return (
    <Animated.View entering={FadeInUp.duration(500).delay(80).springify()} style={styles.heroCard}>
      <LinearGradient colors={['#2E7D32', '#1B5E20']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} borderRadius={28} />
      <Animated.View style={[styles.heroPulse, pulseStyle]} pointerEvents="none" />
      <View style={styles.heroContent}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroLocation}>Lagos, Nigeria</Text>
            <Text style={styles.heroDate}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </Text>
          </View>
          <View style={styles.heroIconWrap}>
            <GoonaIcon icon={conditionIcon} size={40} color={conditionColor} />
          </View>
        </View>
        <View style={styles.heroTempRow}>
          <Text style={styles.heroTemp}>{Math.round(report.temperature.current)}°</Text>
          <Text style={styles.heroUnit}>C</Text>
        </View>
        <Text style={styles.heroCondition}>{conditionText} — Feels like {Math.round(report.temperature.current + 2)}°C</Text>
        <View style={styles.heroMetrics}>
          <View style={styles.heroMetric}>
            <GoonaIcon icon={Icons.thermometer} size={14} color="rgba(255,255,255,0.7)" />
            <Text style={styles.heroMetricLbl}>H: {Math.round(report.temperature.high)}° L: {Math.round(report.temperature.low)}°</Text>
          </View>
          <View style={styles.heroMetric}>
            <GoonaIcon icon={Icons.droplets} size={14} color="rgba(255,255,255,0.7)" />
            <Text style={styles.heroMetricLbl}>Humidity {report.humidity.current}%</Text>
          </View>
          <View style={styles.heroMetric}>
            <GoonaIcon icon={Icons.wind} size={14} color="rgba(255,255,255,0.7)" />
            <Text style={styles.heroMetricLbl}>Wind {report.wind.speed}</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  )
}

function ForecastRiskBadge({ level }: { level: 'low' | 'medium' | 'high' }) {
  const cfg = level === 'high'
    ? { bg: '#FEF2F2', text: '#EF4444', label: 'HIGH RISK' }
    : level === 'medium'
      ? { bg: '#FFFBEB', text: '#F59E0B', label: 'MODERATE' }
      : { bg: '#F0FDF4', text: '#2E7D32', label: 'LOW RISK' }
  return (
    <View style={[fstyles.riskBadge, { backgroundColor: cfg.bg }]}>
      <View style={[fstyles.riskDot, { backgroundColor: cfg.text }]} />
      <Text style={[fstyles.riskLabel, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  )
}

function ForecastAlert({ days }: { days: DayForecast[] }) {
  const summary = forecastSummary(days)
  const actions = forecastActions(days)
  const isWarning = days.some(d => d.risk === 'high' || d.risk === 'medium')
  if (!isWarning) return null

  return (
    <View style={fstyles.alertWrap}>
      <View style={fstyles.alertHeader}>
        <GoonaIcon icon={Icons.alertTriangle} size={20} color="#EF4444" />
        <Text style={fstyles.alertTitle}>Operational Alert</Text>
      </View>
      <Text style={fstyles.alertDesc}>{summary}</Text>
      {actions.length > 0 && (
        <View style={fstyles.alertActions}>
          {actions.map((a, i) => (
            <View key={i} style={fstyles.alertActionRow}>
              <View style={fstyles.alertBullet} />
              <Text style={fstyles.alertActionText}>{a}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

function WeatherMetricCard({
  icon: Icon, label, value, note, color, riskColor, riskLabel,
  voiceText, onPress, onVoice, voiceActive,
}: {
  icon: any; label: string; value: string; note: string; color: string
  riskColor: string; riskLabel: string
  voiceText: string; onPress: () => void; onVoice: () => void; voiceActive: boolean
}) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.metricCard}>
      <View style={styles.metricCardTop}>
        <View style={[styles.metricIcon, { backgroundColor: `${color}12` }]}>
          <GoonaIcon icon={Icon} size={20} color={color} />
        </View>
        <TouchableOpacity onPress={onVoice} style={styles.metricVoiceBtn}>
          <GoonaIcon icon={Icons.volume2} size={16} color={voiceActive ? '#2E7D32' : '#94A3B8'} />
        </TouchableOpacity>
      </View>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricNote}>{note}</Text>
      <View style={styles.metricRiskRow}>
        <View style={[styles.metricRiskDot, { backgroundColor: riskColor }]} />
        <Text style={[styles.metricRiskText, { color: riskColor }]}>{riskLabel} Risk</Text>
      </View>
    </TouchableOpacity>
  )
}

function WeatherExplanationModal({ visible, data, onClose, voiceText, onVoice, voicePlaying }: {
  visible: boolean; data: any; onClose: () => void
  voiceText: (d: any) => string; onVoice: (t: string) => void; voicePlaying: boolean
}) {
  if (!visible || !data) return null
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={mstyles.overlay}>
        <TouchableOpacity style={mstyles.backdrop} onPress={onClose} activeOpacity={1} />
        <Animated.View entering={FadeInUp.duration(400).springify()} style={mstyles.sheet}>
          <View style={mstyles.handleWrap}>
            <View style={mstyles.handle} />
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={mstyles.scrollContent}>
            <View style={mstyles.sheetHeader}>
              <View style={[mstyles.sheetIcon, { backgroundColor: `${data.iconColor}15` }]}>
                <GoonaIcon icon={data.icon} size={24} color={data.iconColor} />
              </View>
              <TouchableOpacity onPress={() => onVoice(data.voiceText || '')} style={mstyles.voiceBtn}>
                <GoonaIcon icon={Icons.volume2} size={20} color={voicePlaying ? '#2E7D32' : '#1F2937'} />
              </TouchableOpacity>
            </View>

            <View style={mstyles.severityRow}>
              <View style={[mstyles.severityBadge, { backgroundColor: `${data.severityColor}15` }]}>
                <View style={[mstyles.severityDot, { backgroundColor: data.severityColor }]} />
                <Text style={[mstyles.severityLabel, { color: data.severityColor }]}>{data.severity}</Text>
              </View>
            </View>

            <Text style={mstyles.sectionLabel}>What This Means</Text>
            <Text style={mstyles.sectionBody}>{data.whatItMeans}</Text>

            <Text style={mstyles.sectionLabel}>Impact on Poultry</Text>
            {data.impact.map((item: string, i: number) => (
              <View key={i} style={mstyles.bulletRow}>
                <Text style={mstyles.bullet}>•</Text>
                <Text style={mstyles.bulletText}>{item}</Text>
              </View>
            ))}

            <Text style={mstyles.sectionLabel}>Recommended Action</Text>
            {data.actions.map((item: string, i: number) => (
              <View key={i} style={mstyles.actionRow}>
                <Text style={mstyles.actionCheck}>✓</Text>
                <Text style={mstyles.actionText}>{item}</Text>
              </View>
            ))}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  )
}

function ForecastDayModal({ visible, day, index, onClose, dayName }: {
  visible: boolean; day: DayForecast | null; index: number; onClose: () => void; dayName: (i: number) => string
}) {
  const [fcVoiceActive, setFcVoiceActive] = useState(false)
  if (!visible || !day) return null

  const fcDesc = day.risk === 'high' ? 'Challenging conditions expected. Take precautions to protect your birds.'
    : day.risk === 'medium' ? 'Mixed conditions. Monitor your farm closely.'
    : 'Good conditions expected. No major concerns.'

  const fcActions: string[] = []
  if (day.risk === 'high' || day.risk === 'medium') {
    if (day.humidity > 70) fcActions.push('Check litter moisture and increase ventilation.')
    if (day.rainProb > 50) fcActions.push('Secure feed storage and inspect drainage systems.')
    if (day.tempHigh > 34) fcActions.push('Activate heat stress protocols. Provide extra water.')
    if (day.risk === 'high') fcActions.push('Monitor birds closely throughout the day.')
  } else {
    fcActions.push('No special precautions needed.')
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={mstyles.overlay}>
        <TouchableOpacity style={mstyles.backdrop} onPress={onClose} activeOpacity={1} />
        <Animated.View entering={FadeInUp.duration(400).springify()} style={mstyles.sheet}>
          <View style={mstyles.handleWrap}>
            <View style={mstyles.handle} />
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={mstyles.scrollContent}>
            <View style={mstyles.sheetHeader}>
              <View>
                <Text style={mstyles.fcDay}>{dayName(index)}</Text>
                <Text style={mstyles.fcDate}>{day.date}</Text>
              </View>
              <TouchableOpacity onPress={() => { setFcVoiceActive(true); setTimeout(() => setFcVoiceActive(false), 1500) }} style={mstyles.voiceBtn}>
                <GoonaIcon icon={Icons.volume2} size={20} color={fcVoiceActive ? '#2E7D32' : '#1F2937'} />
              </TouchableOpacity>
            </View>

            <View style={mstyles.fcConditions}>
              <ConditionIcon condition={day.condition} size={36} />
              <Text style={mstyles.fcConditionLabel}>{day.condition.charAt(0).toUpperCase() + day.condition.slice(1)}</Text>
            </View>

            <View style={mstyles.fcTempRow}>
              <Text style={mstyles.fcTempHigh}>{day.tempHigh}°C</Text>
              <Text style={mstyles.fcTempLow}>{day.tempLow}°C</Text>
            </View>

            <View style={mstyles.fcMetricsRow}>
              <View style={mstyles.fcMetric}>
                <GoonaIcon icon={Icons.droplets} size={16} color="#0891B2" />
                <Text style={mstyles.fcMetricLabel}>Humidity</Text>
                <Text style={mstyles.fcMetricValue}>{day.humidity}%</Text>
              </View>
              <View style={mstyles.fcMetric}>
                <GoonaIcon icon={Icons.cloudRain} size={16} color="#1A56FF" />
                <Text style={mstyles.fcMetricLabel}>Rain</Text>
                <Text style={mstyles.fcMetricValue}>{day.rainProb}%</Text>
              </View>
              <View style={mstyles.fcMetric}>
                <GoonaIcon icon={Icons.wind} size={16} color="#6366F1" />
                <Text style={mstyles.fcMetricLabel}>Wind</Text>
                <Text style={mstyles.fcMetricValue}>{day.windSpeed}</Text>
              </View>
            </View>

            <View style={[mstyles.severityRow, { marginTop: 8 }]}>
              <View style={[mstyles.severityBadge, {
                backgroundColor: day.risk === 'high' ? '#FEF2F2' : day.risk === 'medium' ? '#FFFBEB' : '#F0FDF4'
              }]}>
                <View style={[mstyles.severityDot, {
                  backgroundColor: day.risk === 'high' ? '#EF4444' : day.risk === 'medium' ? '#F59E0B' : '#2E7D32'
                }]} />
                <Text style={[mstyles.severityLabel, {
                  color: day.risk === 'high' ? '#EF4444' : day.risk === 'medium' ? '#F59E0B' : '#2E7D32'
                }]}>
                  {day.risk === 'high' ? 'High Risk' : day.risk === 'medium' ? 'Moderate Risk' : 'Low Risk'}
                </Text>
              </View>
            </View>

            <Text style={mstyles.sectionLabel}>Expected Conditions</Text>
            <Text style={mstyles.sectionBody}>{fcDesc}</Text>

            <Text style={mstyles.sectionLabel}>Recommended Actions</Text>
            {fcActions.map((a, i) => (
              <View key={i} style={mstyles.actionRow}>
                <Text style={mstyles.actionCheck}>✓</Text>
                <Text style={mstyles.actionText}>{a}</Text>
              </View>
            ))}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAF7' },
  blobTop: { position: 'absolute', top: -60, right: -60, width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(232,245,233,0.35)' },
  blobBottom: { position: 'absolute', bottom: -40, left: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(232,245,233,0.25)' },
  scroll: { flex: 1 },
  scrollInner: { paddingHorizontal: 20 },

  /* header */
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 5 },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1B1B1B' },
  headerRisk: { flexShrink: 0 },
  riskBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 50 },
  riskBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.2 },

  /* hero */
  heroCard: { borderRadius: 28, marginTop: 18, overflow: 'hidden', shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.25, shadowRadius: 40, elevation: 8 },
  heroPulse: { position: 'absolute', top: '-20%', right: '-10%', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.04)' },
  heroContent: { padding: 24, zIndex: 1 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroLocation: { fontSize: 16, fontWeight: '600', color: 'rgba(255,255,255,0.9)' },
  heroDate: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  heroIconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  heroTempRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 16 },
  heroTemp: { fontSize: 64, fontWeight: '800', color: 'white', letterSpacing: -2 },
  heroUnit: { fontSize: 24, fontWeight: '600', color: 'rgba(255,255,255,0.7)', marginTop: 8 },
  heroCondition: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: -4 },
  heroMetrics: { flexDirection: 'row', gap: 16, marginTop: 16 },
  heroMetric: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroMetricLbl: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },

  /* section card */
  sectionCard: { backgroundColor: 'white', borderRadius: 24, padding: 20, marginTop: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 16, elevation: 2 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  sectionSub: { fontSize: 11, fontWeight: '500', color: '#94A3B8' },

  /* hourly */
  hourlyScroll: { gap: 12, paddingBottom: 4 },
  hourItem: { alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16, backgroundColor: '#F8FAF7', minWidth: 64 },
  hourItemActive: { backgroundColor: 'rgba(46,125,50,0.08)', borderWidth: 1, borderColor: 'rgba(46,125,50,0.2)' },
  hourTime: { fontSize: 11, fontWeight: '500', color: '#94A3B8' },
  hourTemp: { fontSize: 14, fontWeight: '600', color: '#1F2937' },

  /* metrics grid */
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16 },
  metricCard: { width: (SCREEN_W - 52) / 2, backgroundColor: 'white', borderRadius: 20, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 16, elevation: 2 },
  metricCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  metricIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  metricVoiceBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAF7' },
  metricLabel: { fontSize: 11, color: '#94A3B8' },
  metricValue: { fontSize: 22, fontWeight: '800', color: '#1F2937', marginTop: 2 },
  metricNote: { fontSize: 11, color: '#64748B', marginTop: 1 },
  metricRiskRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  metricRiskDot: { width: 8, height: 8, borderRadius: 4 },
  metricRiskText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },

  /* forecast */
  forecastScroll: { gap: 14, paddingBottom: 4 },
  forecastCard: {
    width: 160,
    backgroundColor: '#F8FAF7',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    marginRight: 14,
  },
  forecastCardHeader: { marginBottom: 12 },
  forecastCardDay: { fontSize: 16, fontWeight: '700', color: '#1F2937', flex: 1 },
  forecastVoiceBtn: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  forecastCardDate: { fontSize: 12, fontWeight: '500', color: '#94A3B8', marginTop: 1 },
  forecastCardIcon: { alignItems: 'center', marginBottom: 14 },
  forecastCardCondition: { fontSize: 11, fontWeight: '600', color: '#64748B', marginTop: 6 },
  forecastCardTempRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 4, marginBottom: 14 },
  forecastCardTemp: { fontSize: 28, fontWeight: '800', color: '#1F2937', letterSpacing: -1 },
  forecastCardTempLow: { fontSize: 16, fontWeight: '600', color: '#94A3B8' },
  forecastCardMetrics: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 14 },
  forecastCardMetric: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  forecastCardMetricDiv: { width: 1, height: 14, backgroundColor: '#E2E8F0', marginHorizontal: 8 },
  forecastCardMetricText: { fontSize: 14, fontWeight: '600', color: '#64748B' },

  /* farm impact */
  impactCard: { backgroundColor: '#F8FAF7', borderRadius: 24, padding: 20, marginTop: 16, borderWidth: 1, borderColor: 'rgba(46,125,50,0.08)' },
  impactHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  impactTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  impactRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  impactIconWrap: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  impactContent: { flex: 1 },
  impactText: { fontSize: 12, lineHeight: 17, color: '#64748B', fontWeight: '500' },
  impactMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  severityBadge: { paddingVertical: 2, paddingHorizontal: 6, borderRadius: 50 },
  severityText: { fontSize: 9, fontWeight: '700' },
  impactCategory: { fontSize: 9, fontWeight: '500', color: '#94A3B8', textTransform: 'capitalize' },

  /* alerts */
  alertsCard: { backgroundColor: '#FEF2F2', borderRadius: 24, padding: 20, marginTop: 16, borderWidth: 1, borderColor: 'rgba(239,68,68,0.15)' },
  alertsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  alertsTitle: { fontSize: 16, fontWeight: '700', color: '#991B1B', flex: 1 },
  alertsCount: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' },
  alertsCountText: { fontSize: 11, fontWeight: '700', color: '#EF4444' },
  alertRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: 'white', borderRadius: 12, marginBottom: 6, borderWidth: 1, borderColor: 'rgba(239,68,68,0.1)' },
  alertText: { fontSize: 11, lineHeight: 16, color: '#64748B', flex: 1 },

  /* recommendations */
  recsCard: { backgroundColor: '#F0FDF4', borderRadius: 24, padding: 20, marginTop: 16, borderWidth: 1, borderColor: 'rgba(46,125,50,0.12)' },
  recsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  recsTitle: { fontSize: 16, fontWeight: '700', color: '#1B5E20' },
  recRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  recBullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#2E7D32', marginTop: 6, flexShrink: 0 },
  recText: { fontSize: 12, color: '#64748B', lineHeight: 17, flex: 1 },

  /* production impact */
  productionCard: { backgroundColor: 'white', borderRadius: 24, padding: 20, marginTop: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 16, elevation: 2 },
  productionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  productionTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  productionGrid: { gap: 12 },
  productionMetric: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  productionLabel: { fontSize: 12, fontWeight: '600', color: '#64748B', width: 90 },
  productionImpact: { fontSize: 12, fontWeight: '500', color: '#64748B', flex: 1 },
  productionDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },

  /* goona advisor */
  advisorCard: { backgroundColor: 'white', borderRadius: 24, padding: 20, marginTop: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 16, elevation: 2, borderWidth: 1, borderColor: 'rgba(46,125,50,0.08)' },
  advisorHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  advisorTitle: { fontSize: 16, fontWeight: '700', color: '#1B5E20', flex: 1 },
  advisorSub: { fontSize: 12, fontWeight: '500', color: '#64748B', marginBottom: 14, lineHeight: 17 },
  advisorQuestions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  advisorQuestionChip: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 50, backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: 'rgba(46,125,50,0.12)' },

  advisorAnswer: { marginTop: 16, backgroundColor: '#F0FDF4', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(46,125,50,0.12)' },
  advisorAnswerHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  advisorAnswerLabel: { fontSize: 12, fontWeight: '700', color: '#2E7D32' },
  advisorAnswerText: { fontSize: 14, fontWeight: '500', color: '#64748B', lineHeight: 21 },

  /* offline banner */
  offlineBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 16, marginTop: 16, borderRadius: 16, backgroundColor: '#F8FAF7' },
  offlineBannerText: { fontSize: 12, fontWeight: '500', color: '#64748B', flex: 1 },

  /* cta */
  ctaBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 20, marginTop: 16, overflow: 'hidden', shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 6 },
  ctaText: { fontSize: 14, fontWeight: '700', color: 'white' },
})

const fstyles = StyleSheet.create({
  /* forecast risk badge */
  riskBadge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 6, paddingHorizontal: 14,
    borderRadius: 50, flexShrink: 0, alignSelf: 'stretch',
  },
  riskDot: { width: 8, height: 8, borderRadius: 4 },
  riskLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },

  /* forecast operational alert */
  alertWrap: {
    marginTop: 20,
    backgroundColor: '#FEF2F2',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.15)',
  },
  alertHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  alertTitle: { fontSize: 17, fontWeight: '800', color: '#991B1B' },
  alertDesc: { fontSize: 14, fontWeight: '500', color: '#7F1D1D', lineHeight: 22, marginBottom: 14, paddingHorizontal: 2 },
  alertActions: { gap: 10 },
  alertActionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 2 },
  alertBullet: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: '#EF4444', marginTop: 7, flexShrink: 0,
  },
  alertActionText: { fontSize: 14, fontWeight: '500', color: '#64748B', lineHeight: 20, flex: 1 },
})

const mstyles = StyleSheet.create({
  /* modal sheet */
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '85%',
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    elevation: 20,
  },
  handleWrap: { alignItems: 'center', paddingTop: 12, paddingBottom: 8 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB' },
  scrollContent: { paddingBottom: 20 },

  /* sheet header */
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  sheetIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  voiceBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F8FAF7', alignItems: 'center', justifyContent: 'center' },

  /* severity */
  severityRow: { flexDirection: 'row', marginBottom: 20 },
  severityBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 14, borderRadius: 50 },
  severityDot: { width: 8, height: 8, borderRadius: 4 },
  severityLabel: { fontSize: 13, fontWeight: '800', letterSpacing: 0.3 },

  /* sections */
  sectionLabel: { fontSize: 15, fontWeight: '700', color: '#1F2937', marginBottom: 8, marginTop: 4 },
  sectionBody: { fontSize: 14, fontWeight: '500', color: '#64748B', lineHeight: 21, marginBottom: 16 },

  /* bullet list */
  bulletRow: { flexDirection: 'row', gap: 8, marginBottom: 8, paddingLeft: 4 },
  bullet: { fontSize: 14, color: '#64748B', width: 12 },
  bulletText: { fontSize: 14, fontWeight: '500', color: '#64748B', lineHeight: 20, flex: 1 },

  /* action list */
  actionRow: { flexDirection: 'row', gap: 8, marginBottom: 10, paddingLeft: 4 },
  actionCheck: { fontSize: 14, fontWeight: '700', color: '#2E7D32', width: 16 },
  actionText: { fontSize: 14, fontWeight: '500', color: '#64748B', lineHeight: 20, flex: 1 },

  /* forecast day modal */
  fcDay: { fontSize: 22, fontWeight: '800', color: '#1F2937' },
  fcDate: { fontSize: 13, fontWeight: '500', color: '#94A3B8', marginTop: 2 },
  fcConditions: { alignItems: 'center', marginBottom: 16 },
  fcConditionLabel: { fontSize: 14, fontWeight: '600', color: '#64748B', marginTop: 8 },
  fcTempRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'baseline', gap: 8, marginBottom: 20 },
  fcTempHigh: { fontSize: 36, fontWeight: '800', color: '#1F2937', letterSpacing: -1 },
  fcTempLow: { fontSize: 18, fontWeight: '600', color: '#94A3B8' },
  fcMetricsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  fcMetric: { alignItems: 'center', gap: 4 },
  fcMetricLabel: { fontSize: 11, fontWeight: '600', color: '#94A3B8', marginTop: 2 },
  fcMetricValue: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
})
