import { Icons } from '../shared/icons'

/* ── Types ── */
export interface WeatherAlert {
  message: string
  icon: any
  color: string
  severity: 'low' | 'medium' | 'high'
  category: 'heat' | 'rain' | 'humidity' | 'water' | 'feed' | 'safety' | 'insight'
}

export interface ForecastReport {
  temperature: { current: number; high: number; low: number; trend: 'rising' | 'falling' | 'stable' }
  humidity: { current: number; risk: 'low' | 'medium' | 'high' }
  rainfall: { probability: number; expected: boolean; timing: string }
  wind: { speed: string; risk: 'low' | 'medium' | 'high' }
  operationalRisk: { score: number; label: string; color: string }
  recommendations: string[]
  alerts: WeatherAlert[]
}

/* ── HEAT STRESS FORECASTS ── */
const HEAT: WeatherAlert[] = [
  { message: 'High heat stress risk detected for Batch A — increase ventilation immediately. Poultry will reduce feed intake above 32°C.', icon: Icons.thermometer, color: '#EF4444', severity: 'high', category: 'heat' },
  { message: 'Afternoon temperatures may exceed safe poultry threshold by 4°C. Activate emergency ventilation protocols and monitor water consumption hourly.', icon: Icons.thermometer, color: '#EF4444', severity: 'high', category: 'heat' },
  { message: 'Heat stress forecast for fish pond — oxygen levels may drop. Increase aeration and reduce feeding during peak heat hours.', icon: Icons.sun, color: '#F59E0B', severity: 'high', category: 'heat' },
  { message: 'Midday heat wave expected — reduce stocking density stress by 15% where possible. Defer handling and transport to cooler evening hours.', icon: Icons.sun, color: '#F59E0B', severity: 'medium', category: 'heat' },
  { message: 'Warm conditions may reduce egg production by 8-12% this week. Ensure calcium supplementation and cool water availability.', icon: Icons.cloudSun, color: '#F59E0B', severity: 'medium', category: 'heat' },
  { message: 'Temperature fluctuation alert — brooder temperature regulation critical for day-old chicks this week.', icon: Icons.thermometer, color: '#EF4444', severity: 'high', category: 'heat' },
]

/* ── RAINFALL IMPACT FORECASTS ── */
const RAIN: WeatherAlert[] = [
  { message: 'Heavy rainfall expected tomorrow morning — secure feed storage areas and check roof drainage. Pond levels may rise 15-20cm.', icon: Icons.cloudRain, color: '#1A56FF', severity: 'high', category: 'rain' },
  { message: 'Rain forecast for this evening — check drainage systems around poultry houses. Standing water increases disease vectors and ammonia levels.', icon: Icons.cloudRain, color: '#1A56FF', severity: 'medium', category: 'rain' },
  { message: 'Prolonged rain may cause feed spoilage in open storage. Move bags to elevated platforms and inspect for moisture damage.', icon: Icons.droplets, color: '#1A56FF', severity: 'high', category: 'rain' },
  { message: 'Rainy conditions expected — transport routes may become impassable. Schedule feed deliveries 24 hours earlier than usual.', icon: Icons.cloudLightning, color: '#6366F1', severity: 'medium', category: 'rain' },
  { message: 'Light showers likely — ideal for pond water top-up. Capture runoff for irrigation and check water quality post-rain.', icon: Icons.cloudRain, color: '#1A56FF', severity: 'low', category: 'rain' },
  { message: 'Flooding risk elevated in low-lying areas — move portable equipment to higher ground and verify drainage channel capacity.', icon: Icons.cloudLightning, color: '#6366F1', severity: 'high', category: 'rain' },
]

/* ── HUMIDITY IMPACT FORECASTS ── */
const HUMIDITY: WeatherAlert[] = [
  { message: 'Humidity levels rising above 75% — monitor litter conditions and ammonia hourly. Bacterial growth risk increases significantly in warm, humid conditions.', icon: Icons.droplets, color: '#0891B2', severity: 'high', category: 'humidity' },
  { message: 'High humidity forecast for 48 hours — coccidiosis risk elevated. Increase litter turning frequency and check bird droppings for signs.', icon: Icons.droplets, color: '#0891B2', severity: 'high', category: 'humidity' },
  { message: 'Humidity spike detected — respiratory disease risk increasing. Boost ventilation capacity 2 hours earlier than current schedule.', icon: Icons.wind, color: '#0891B2', severity: 'medium', category: 'humidity' },
  { message: 'Morning condensation alert — check bedding moisture in brooder areas. Wet litter increases pododermatitis risk in broilers.', icon: Icons.droplets, color: '#0891B2', severity: 'medium', category: 'humidity' },
  { message: 'Prolonged humidity may reduce feed intake. Adjust feed formulation with mould inhibitors and verify storage seals.', icon: Icons.droplets, color: '#0891B2', severity: 'medium', category: 'humidity' },
  { message: 'Humidity and heat combined — dangerous for poultry. Increase air movement with circulation fans and reduce bird density in affected zones.', icon: Icons.wind, color: '#EF4444', severity: 'high', category: 'humidity' },
]

/* ── WATER CONSUMPTION FORECASTS ── */
const WATER: WeatherAlert[] = [
  { message: 'Hot weather may increase bird water consumption by 18-25% — top up drinkers 3x daily and check flow rates on all nipple lines.', icon: Icons.droplets, color: '#0EA5E9', severity: 'high', category: 'water' },
  { message: 'Elevated temperatures expected — each bird may need an extra 50ml per hour. Verify backup water supply tanks are full and operational.', icon: Icons.thermometer, color: '#0EA5E9', severity: 'medium', category: 'water' },
  { message: 'Water consumption trending up 12% — flush drinker lines to prevent biofilm and check for leaks that may indicate nipple valve issues.', icon: Icons.droplets, color: '#0EA5E9', severity: 'low', category: 'water' },
  { message: 'Dehydration risk for day-old chicks during transport today. Ensure electrolyte supplements in first drinking water upon arrival.', icon: Icons.droplets, color: '#EF4444', severity: 'high', category: 'water' },
  { message: 'Water quality alert — high temperatures may promote algal growth in storage tanks. Treat with approved sanitiser and check pH levels.', icon: Icons.droplets, color: '#0EA5E9', severity: 'medium', category: 'water' },
]

/* ── FEED EFFICIENCY FORECASTS ── */
const FEED: WeatherAlert[] = [
  { message: 'Feed efficiency forecast: Conversion ratio may worsen 8% due to heat. Shift feeding to 6 AM and 6 PM when temperatures are cooler.', icon: Icons.cloudSun, color: '#D97706', severity: 'medium', category: 'feed' },
  { message: 'Appetite reduction expected — birds consume 12% less feed above 30°C. Supplement with vitamins and electrolytes in drinking water.', icon: Icons.sun, color: '#D97706', severity: 'high', category: 'feed' },
  { message: 'Heat-related feed conversion decline predicted. Increase dietary fat by 2% to maintain energy intake during hot periods.', icon: Icons.thermometer, color: '#D97706', severity: 'medium', category: 'feed' },
  { message: 'Feed spoilage risk elevated in humid conditions. Add mould inhibitor to feed and clean troughs daily to prevent mycotoxin exposure.', icon: Icons.droplets, color: '#D97706', severity: 'high', category: 'feed' },
  { message: 'Climate-adjusted feeding recommended — early morning feeding may improve weight gain by 4% compared to midday feeding in current conditions.', icon: Icons.cloudSun, color: '#2E7D32', severity: 'low', category: 'feed' },
]

/* ── OPERATIONAL RISK FORECASTS ── */
const SAFETY: WeatherAlert[] = [
  { message: 'Strong winds expected this evening — secure poultry house netting and feed shed roofs. Icons.wind chill may affect brooder temperature regulation.', icon: Icons.wind, color: '#6366F1', severity: 'high', category: 'safety' },
  { message: 'Lightning risk in the area — disconnect non-essential electrical equipment. Surge protection recommended for ventilation controllers and monitoring systems.', icon: Icons.cloudLightning, color: '#6366F1', severity: 'high', category: 'safety' },
  { message: 'Storm approach within 12 hours — move portable feeders and drinkers to sheltered storage. Verify generator fuel levels and backup power readiness.', icon: Icons.wind, color: '#6366F1', severity: 'medium', category: 'safety' },
  { message: 'High-risk production day forecast — weather-related operational stress expected. Consider reduced staffing for field tasks and focus on indoor operations.', icon: Icons.alertTriangle, color: '#F59E0B', severity: 'high', category: 'safety' },
  { message: 'Disease exposure warning — wet and windy conditions may increase pathogen spread. Restrict farm access and enhance biosecurity protocols today.', icon: Icons.shieldCheck, color: '#6366F1', severity: 'medium', category: 'safety' },
  { message: 'Extreme weather watch — monitor local forecasts hourly. Prepare emergency feed and water supplies for 72-hour autonomous farm operation.', icon: Icons.cloudLightning, color: '#EF4444', severity: 'high', category: 'safety' },
]

/* ── GOONA IQ FORECAST INSIGHTS ── */
const INSIGHTS: WeatherAlert[] = [
  { message: 'GOONA IQ predicts feed efficiency may drop 6-10% over next 3 days due to rising temperatures. Pre-emptive ventilation adjustment recommended.', icon: Icons.cloudSun, color: '#2E7D32', severity: 'medium', category: 'insight' },
  { message: 'GOONA IQ: Shift feeding schedule to 5 AM - 9 AM window for optimal conversion. Birds consume 22% more during cooler morning periods.', icon: Icons.sun, color: '#2E7D32', severity: 'low', category: 'insight' },
  { message: 'Climate trend analysis detected — adjusting ventilation 2 hours earlier daily can reduce heat stress mortality by 15% based on your batch data.', icon: Icons.wind, color: '#2E7D32', severity: 'medium', category: 'insight' },
  { message: 'GOONA IQ: Your Batch A is entering peak heat sensitivity window. Activate heat stress protocol — increase air speed to 2.5m/s across bird level.', icon: Icons.thermometer, color: '#2E7D32', severity: 'high', category: 'insight' },
  { message: 'Weather pattern shift detected — consider advancing Batch B harvest by 4 days to avoid forecasted storm window. Estimated revenue impact: minimal.', icon: Icons.cloudLightning, color: '#2E7D32', severity: 'medium', category: 'insight' },
  { message: 'GOONA IQ operational forecast: Today is a high-risk production day. Prioritise essential tasks and monitor bird behaviour every 3 hours.', icon: Icons.alertTriangle, color: '#2E7D32', severity: 'high', category: 'insight' },
  { message: 'AI analysis: Your farm\'s current climate conditions match pre-outbreak patterns. Preemptive probiotic supplementation recommended for respiratory health.', icon: Icons.shieldCheck, color: '#2E7D32', severity: 'medium', category: 'insight' },
]

const ALL_ALERTS = [...HEAT, ...RAIN, ...HUMIDITY, ...WATER, ...FEED, ...SAFETY, ...INSIGHTS]

/* ── Seeded pseudo-random (deterministic within same second) ── */
function seededRandom(): number {
  const now = new Date()
  const seed = now.getHours() * 10000 + now.getMinutes() * 100 + now.getSeconds()
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

/* ── Pick alert weighted by severity (high appears 3x more) ── */
function pickWeighted(): WeatherAlert {
  const weights = { high: 3, medium: 2, low: 1 }
  const total = ALL_ALERTS.reduce((s, a) => s + weights[a.severity], 0)
  let r = seededRandom() * total
  for (const alert of ALL_ALERTS) {
    r -= weights[alert.severity]
    if (r <= 0) return alert
  }
  return ALL_ALERTS[0]
}

/* ── Generate N unique weather alert messages for the ticker ── */
export function generateWeatherAlerts(count = 4): string[] {
  const selected: string[] = []
  const used = new Set<number>()
  for (let i = 0; i < count; i++) {
    let alert: WeatherAlert
    let attempts = 0
    do {
      alert = pickWeighted()
      attempts++
    } while (used.has(ALL_ALERTS.indexOf(alert)) && attempts < 20)
    used.add(ALL_ALERTS.indexOf(alert))
    selected.push(alert.message)
  }
  return selected
}

/* ── Given a message, return matching weather icon + color ── */
export function getWeatherInfo(message: string): { icon: any; color: string } {
  const lower = message.toLowerCase()
  if (lower.includes('heat stress') || lower.includes('dehydration') || lower.includes('oxygen')) return { icon: Icons.thermometer, color: '#EF4444' }
  if (lower.includes('heat') || lower.includes('temperature') || lower.includes('warm')) {
    if (lower.includes('high') || lower.includes('exceed') || lower.includes('wave')) return { icon: Icons.thermometer, color: '#EF4444' }
    return { icon: Icons.cloudSun, color: '#F59E0B' }
  }
  if (lower.includes('flood') || lower.includes('heavy rain') || lower.includes('prolonged rain')) return { icon: Icons.cloudLightning, color: '#6366F1' }
  if (lower.includes('rain') || lower.includes('rainfall') || lower.includes('shower')) return { icon: Icons.cloudRain, color: '#1A56FF' }
  if (lower.includes('coccidiosis') || lower.includes('respiratory') || lower.includes('bacterial')) return { icon: Icons.droplets, color: '#0891B2' }
  if (lower.includes('humidity') || lower.includes('litter') || lower.includes('ammonia') || lower.includes('condensation')) return { icon: Icons.droplets, color: '#0891B2' }
  if (lower.includes('water') || lower.includes('drinker') || lower.includes('nipple') || lower.includes('dehydration')) return { icon: Icons.droplets, color: '#0EA5E9' }
  if (lower.includes('feed') || lower.includes('appetite') || lower.includes('conversion')) return { icon: Icons.cloudSun, color: '#D97706' }
  if (lower.includes('wind') || lower.includes('storm') || lower.includes('lightning')) return { icon: Icons.wind, color: '#6366F1' }
  if (lower.includes('disease') || lower.includes('biosecurity')) return { icon: Icons.shieldCheck, color: '#6366F1' }
  if (lower.includes('goona iq') || lower.includes('climate') || lower.includes('insight') || lower.includes('ai analysis')) return { icon: Icons.sun, color: '#2E7D32' }
  if (lower.includes('ventilation') || lower.includes('airflow') || lower.includes('respiratory') || lower.includes('circulation')) return { icon: Icons.wind, color: '#0891B2' }
  if (lower.includes('risk') || lower.includes('alert') || lower.includes('watch')) return { icon: Icons.alertTriangle, color: '#F59E0B' }
  return { icon: Icons.cloudSun, color: '#2E7D32' }
}

/* ── Check if message is weather-related ── */
/* ── 3-Day Forecast types ── */
export interface DayForecast {
  day: string
  date: string
  tempHigh: number
  tempLow: number
  condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'humid'
  humidity: number
  rainProb: number
  windSpeed: string
  risk: 'low' | 'medium' | 'high'
  recommendation: string
}

export interface ThreeDayForecast {
  days: DayForecast[]
  overallRisk: { score: number; label: string; color: string }
  keyInsight: string
}

export function generate3DayForecast(): ThreeDayForecast {
  const days: DayForecast[] = []
  const conditions: DayForecast['condition'][] = ['sunny', 'cloudy', 'rainy', 'stormy', 'humid']
  const dayNames = ['Today', 'Tomorrow', 'Day 3']

  for (let i = 0; i < 3; i++) {
    const r = seededRandom() * 0.8 + 0.1 * (i + 1)
    const condIdx = Math.floor((r * conditions.length * 0.8 + i * 0.4) % conditions.length)
    const condition = conditions[condIdx]
    const tempHigh = Math.round(28 + r * 12 + i * 1.5)
    const tempLow = Math.round(22 + r * 6 + i)
    const hum = Math.round(50 + r * 35 + i * 3)
    const rain = Math.round((r * 70 + i * 8) % 100)

    const risk: 'low' | 'medium' | 'high' = condition === 'stormy' ? 'high'
      : condition === 'rainy' || condition === 'humid' ? (tempHigh > 34 ? 'high' : 'medium')
      : tempHigh > 36 ? 'medium' : 'low'

    const recommendations: Record<DayForecast['condition'], string> = {
      sunny: 'Optimal conditions. Standard ventilation. Monitor water intake.',
      cloudy: 'Mild conditions. Good for outdoor access. Check forecast updates.',
      rainy: 'Secure feed storage. Check drainage. Delay litter turning.',
      stormy: 'Secure structures. Disconnect non-essential electrics. Monitor birds.',
      humid: 'Increase ventilation. Monitor litter moisture. Check for respiratory signs.',
    }

    const now = new Date()
    const date = new Date(now)
    date.setDate(date.getDate() + i)
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

    days.push({
      day: dayNames[i],
      date: dateStr,
      tempHigh,
      tempLow,
      condition,
      humidity: hum,
      rainProb: rain,
      windSpeed: `${Math.round(10 + r * 30 + i * 2)} km/h`,
      risk,
      recommendation: recommendations[condition],
    })
  }

  const riskScore = Math.round(
    days.reduce((s, d) => s + (d.risk === 'high' ? 40 : d.risk === 'medium' ? 20 : 5), 0) / 3
  )
  const riskLabel = riskScore > 35 ? 'Moderate Risk' : 'Low Risk'
  const riskColor = riskScore > 35 ? '#F59E0B' : '#16A34A'

  const highRiskDays = days.filter((d) => d.risk === 'high')
  const keyInsight = highRiskDays.length > 0
    ? `⚠️ ${highRiskDays.length} day(s) with elevated operational risk. ${highRiskDays[0].recommendation}`
    : `✅ Weather stable for next 3 days. Maintain standard protocols.`

  return { days, overallRisk: { score: riskScore, label: riskLabel, color: riskColor }, keyInsight }
}

export function isWeatherMessage(message: string): boolean {
  const tokens = ['heat', 'temperature', 'rain', 'rainfall', 'humidity', 'wind', 'storm', 'lightning',
    'water consumption', 'drinker', 'ventilation', 'airflow', 'litter', 'weather', 'climate',
    'goona iq', 'warm', 'hot', 'shower', 'pond', 'drainage', 'feed efficiency', 'appetite',
    'conversion', 'disease', 'biosecurity', 'flood', 'stress', 'oxygen', 'dehydration', 'egg',
    'brooder', 'poultry', 'batch', 'harvest', 'operational risk']
  const lower = message.toLowerCase()
  return tokens.some((t) => lower.includes(t))
}

/* ── Check if message is high severity ── */
export function isHighSeverity(message: string): boolean {
  const high = ['heat stress', 'exceed', 'heavy rainfall', 'humidity rising', 'strong wind',
    'lightning risk', 'storm approach', 'water consumption', 'exceed safe', 'flood',
    'coccidiosis', 'bacterial', 'dehydration risk', 'respiratory disease', 'mortality',
    'extreme weather', 'high-risk', 'emergency', 'spoilage', 'oxygen']
  const lower = message.toLowerCase()
  return high.some((h) => lower.includes(h))
}

/* ── Generate full forecast report for the weather panel ── */
export function generateForecastReport(): ForecastReport {
  const r = seededRandom()

  const tempBase = 30 + r * 10
  const temp = {
    current: Math.round(tempBase * 10) / 10,
    high: Math.round((tempBase + 2 + r * 4) * 10) / 10,
    low: Math.round((tempBase - 4 + r * 3) * 10) / 10,
    trend: (r < 0.33 ? 'rising' : r < 0.66 ? 'falling' : 'stable') as 'rising' | 'falling' | 'stable',
  }

  const humBase = 55 + r * 35
  const humidity = {
    current: Math.round(humBase),
    risk: (humBase > 75 ? 'high' : humBase > 60 ? 'medium' : 'low') as 'low' | 'medium' | 'high',
  }

  const rainfallProb = Math.round(r * 100)
  const rainfall = {
    probability: rainfallProb,
    expected: rainfallProb > 30,
    timing: rainfallProb > 70 ? 'Tomorrow morning' : rainfallProb > 40 ? 'Afternoon' : 'Evening',
  }

  const windSpeed = Math.round(10 + r * 35)
  const wind = {
    speed: `${windSpeed} km/h`,
    risk: (windSpeed > 35 ? 'high' : windSpeed > 20 ? 'medium' : 'low') as 'low' | 'medium' | 'high',
  }

  const heatScore = temp.current > 35 ? 40 : temp.current > 32 ? 25 : 10
  const rainScore = rainfall.expected ? 25 : 0
  const humidityScore = humidity.risk === 'high' ? 25 : humidity.risk === 'medium' ? 12 : 0
  const windScore = wind.risk === 'high' ? 20 : wind.risk === 'medium' ? 10 : 0
  const totalScore = Math.min(100, heatScore + rainScore + humidityScore + windScore)

  const riskLabel = totalScore > 65 ? 'High Risk' : totalScore > 35 ? 'Moderate Risk' : 'Low Risk'
  const riskColor = totalScore > 65 ? '#EF4444' : totalScore > 35 ? '#F59E0B' : '#16A34A'

  const recommendations: string[] = []
  if (temp.current > 34) recommendations.push('Activate emergency ventilation protocols — bird heat stress threshold approaching.')
  if (temp.trend === 'rising') recommendations.push('Shift feeding to cooler morning hours (5-9 AM) for optimal feed conversion.')
  if (humidity.risk === 'high') recommendations.push('Increase litter turning frequency — bacterial growth risk elevated above 75% humidity.')
  if (rainfall.expected) recommendations.push(`${rainfall.timing} rainfall expected. Secure feed storage and check drainage systems.`)
  if (wind.risk === 'high') recommendations.push('Strong winds forecast. Secure netting, roofs, and portable equipment.')
  if (temp.current > 32) recommendations.push('Supplement water with electrolytes — birds will consume 18-25% more water today.')
  if (recommendations.length === 0) recommendations.push('Current conditions are favourable for normal farm operations.')

  const alertCount = Math.min(3, Math.max(1, Math.ceil(totalScore / 30)))
  const alerts: WeatherAlert[] = []
  const usedAlert = new Set<number>()
  for (let i = 0; i < alertCount; i++) {
    let alert: WeatherAlert
    let attempts = 0
    do {
      alert = pickWeighted()
      attempts++
    } while (usedAlert.has(ALL_ALERTS.indexOf(alert)) && attempts < 20)
    usedAlert.add(ALL_ALERTS.indexOf(alert))
    alerts.push(alert)
  }

  return { temperature: temp, humidity, rainfall, wind, operationalRisk: { score: totalScore, label: riskLabel, color: riskColor }, recommendations, alerts }
}
