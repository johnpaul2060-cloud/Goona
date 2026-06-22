import { useEffect, useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Animated, { FadeInUp, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, withDelay, Easing, interpolate, Extrapolation } from 'react-native-reanimated'
import { Icons } from '../shared/icons'
import GoonaIcon from './ui/GoonaIcon'
import { generateForecastReport, generate3DayForecast, type ForecastReport, type ThreeDayForecast, type DayForecast } from '../utils/weatherIntelligence'

/* ── Condition icon map ── */
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

/* ── Current Metric Tile ── */
function CurrentMetricTile({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <View style={iqwsStyles.metricTile}>
      <View style={[iqwsStyles.metricIconWrap, { backgroundColor: `${color}12` }]}>
        <GoonaIcon icon={Icon} size={16} color={color} />
      </View>
      <Text style={iqwsStyles.metricValue}>{value}</Text>
      <Text style={iqwsStyles.metricLabel}>{label}</Text>
    </View>
  )
}

/* ── Day Forecast Card ── */
function DayForecastCard({ forecast, index }: { forecast: DayForecast; index: number }) {
  const pulseAnim = useSharedValue(1)

  useEffect(() => {
    if (forecast.risk === 'high') {
      pulseAnim.value = withRepeat(
        withSequence(
          withDelay(index * 400, withTiming(1.04, { duration: 1200, easing: Easing.inOut(Easing.sin) })),
          withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
        ),
        -1, true,
      )
    }
  }, [forecast.risk])

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }))

  const borderColor = forecast.risk === 'high' ? 'rgba(239,68,68,0.15)' : 'rgba(0,0,0,0.04)'
  const riskDot = forecast.risk === 'high' ? '#EF4444' : forecast.risk === 'medium' ? '#F59E0B' : '#16A34A'

  return (
    <Animated.View
      entering={FadeInUp.duration(500).delay(700 + index * 100).springify()}
      style={[iqwsStyles.dayCard, { borderColor }, forecast.risk === 'high' && iqwsStyles.dayCardHigh]}
    >
      <Animated.View style={animStyle}>
        <View style={iqwsStyles.dayHeader}>
          <Text style={iqwsStyles.dayName}>{forecast.day}</Text>
          <Text style={iqwsStyles.dayDate}>{forecast.date}</Text>
        </View>

        <View style={iqwsStyles.dayCondition}>
          <ConditionIcon condition={forecast.condition} size={24} />
          <Text style={iqwsStyles.dayTemp}>
            {forecast.tempHigh}°<Text style={iqwsStyles.dayTempUnit}>/{forecast.tempLow}°</Text>
          </Text>
        </View>

        <View style={iqwsStyles.dayDetails}>
          <View style={iqwsStyles.dayDetailRow}>
            <GoonaIcon icon={Icons.droplets} size={10} color="#64748B" />
            <Text style={iqwsStyles.dayDetailText}>{forecast.humidity}%</Text>
          </View>
          <View style={iqwsStyles.dayDetailRow}>
            <GoonaIcon icon={Icons.cloudRain} size={10} color="#64748B" />
            <Text style={iqwsStyles.dayDetailText}>{forecast.rainProb}%</Text>
          </View>
          <View style={iqwsStyles.dayDetailRow}>
            <GoonaIcon icon={Icons.wind} size={10} color="#64748B" />
            <Text style={iqwsStyles.dayDetailText}>{forecast.windSpeed}</Text>
          </View>
        </View>

        <View style={iqwsStyles.dayRiskRow}>
          <View style={[iqwsStyles.dayRiskDot, { backgroundColor: riskDot }]} />
          <Text style={[iqwsStyles.dayRiskText, { color: riskDot }]}>
            {forecast.risk === 'high' ? 'High Risk' : forecast.risk === 'medium' ? 'Moderate' : 'Low Risk'}
          </Text>
        </View>

        <Text style={iqwsStyles.dayRec} numberOfLines={2}>{forecast.recommendation}</Text>
      </Animated.View>
    </Animated.View>
  )
}

/* ── AI Recommendation Banner ── */
function AIRecommendationBanner({ text, color }: { text: string; color: string }) {
  return (
    <View style={[iqwsStyles.aiBanner, { borderColor: `${color}20`, backgroundColor: `${color}06` }]}>
      <View style={[iqwsStyles.aiBannerIcon, { backgroundColor: `${color}15` }]}>
        <GoonaIcon icon={Icons.lightbulb} size={14} color={color} />
      </View>
      <Text style={[iqwsStyles.aiBannerText, { color }]} numberOfLines={3}>{text}</Text>
    </View>
  )
}

/* ── Risk Score Ring ── */
function RiskScoreRing({ score }: { score: number }) {
  const anim = useSharedValue(0)
  const color = score > 65 ? '#EF4444' : score > 35 ? '#F59E0B' : '#16A34A'
  const label = score > 65 ? 'High Risk' : score > 35 ? 'Moderate' : 'Low Risk'

  useEffect(() => {
    anim.value = withTiming(1, { duration: 1500, easing: Easing.out(Easing.cubic) })
  }, [])

  const dashOffset = 283 - (283 * score) / 100

  const ringStyle = useAnimatedStyle(() => ({
    opacity: anim.value,
    transform: [{ scale: interpolate(anim.value, [0, 1], [0.6, 1]) }],
  }))

  const Svg = require('react-native-svg').default
  const Circle = require('react-native-svg').Circle

  return (
    <Animated.View style={[iqwsStyles.riskRing, ringStyle]}>
      <Svg width={60} height={60} viewBox="0 0 60 60">
        <Circle cx={30} cy={30} r={26} stroke="rgba(0,0,0,0.04)" strokeWidth={4} fill="none" />
        <Circle
          cx={30} cy={30} r={26}
          stroke={color}
          strokeWidth={4}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={283}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 30 30)"
        />
      </Svg>
      <View style={iqwsStyles.riskRingInner}>
        <Text style={[iqwsStyles.riskRingScore, { color }]}>{score}</Text>
      </View>
    </Animated.View>
  )
}

/* ── Main Weather Section ── */
export default function GoonaIQWeatherSection() {
  const [report, setReport] = useState<ForecastReport | null>(null)
  const [forecast, setForecast] = useState<ThreeDayForecast | null>(null)

  useEffect(() => {
    setReport(generateForecastReport())
    setForecast(generate3DayForecast())
  }, [])

  if (!report || !forecast) return null

  return (
    <View style={iqwsStyles.section}>
      {/* Header */}
      <Animated.View entering={FadeInUp.duration(500).delay(550).springify()} style={iqwsStyles.headerRow}>
        <View style={iqwsStyles.headerLeft}>
          <View style={iqwsStyles.headerIcon}>
            <GoonaIcon icon={Icons.sprout} size={16} color="#2E7D32" />
          </View>
          <Text style={iqwsStyles.headerTitle}>Weather Intelligence</Text>
        </View>
        <View style={[iqwsStyles.headerRisk, { backgroundColor: `${report.operationalRisk.color}15` }]}>
          <Text style={[iqwsStyles.headerRiskText, { color: report.operationalRisk.color }]}>{report.operationalRisk.label}</Text>
        </View>
      </Animated.View>

      {/* Current Conditions */}
      <Animated.View entering={FadeInUp.duration(500).delay(600).springify()} style={iqwsStyles.currentGrid}>
        <CurrentMetricTile icon={Icons.thermometer} label="Temperature" value={`${report.temperature.current}°C`} color="#F59E0B" />
        <CurrentMetricTile icon={Icons.droplets} label="Humidity" value={`${report.humidity.current}%`} color="#0891B2" />
        <CurrentMetricTile icon={Icons.cloudRain} label="Rainfall" value={`${report.rainfall.probability}%`} color="#1A56FF" />
        <CurrentMetricTile icon={Icons.wind} label="Wind" value={report.wind.speed} color="#6366F1" />
      </Animated.View>

      {/* Risk + Key Insight */}
      <Animated.View entering={FadeInUp.duration(500).delay(650).springify()} style={iqwsStyles.insightRow}>
        <RiskScoreRing score={report.operationalRisk.score} />
        <View style={iqwsStyles.insightContent}>
          <View style={iqwsStyles.insightHead}>
            <GoonaIcon icon={Icons.alertTriangle} size={12} color={report.operationalRisk.color} />
            <Text style={[iqwsStyles.insightHeadText, { color: report.operationalRisk.color }]}>Operational Risk</Text>
          </View>
          <Text style={iqwsStyles.insightBody} numberOfLines={3}>{forecast.keyInsight}</Text>
        </View>
      </Animated.View>

      {/* 3-Day Forecast */}
      <Animated.View entering={FadeInUp.duration(500).delay(700).springify()}>
        <View style={iqwsStyles.forecastRow}>
          {forecast.days.map((day: DayForecast, i: number) => (
            <DayForecastCard key={day.day} forecast={day} index={i} />
          ))}
        </View>
      </Animated.View>

      {/* AI Recommendations */}
      {report.recommendations.length > 0 && (
        <Animated.View entering={FadeInUp.duration(500).delay(800).springify()} style={iqwsStyles.recommendationsSection}>
          <View style={iqwsStyles.recSectionHead}>
            <GoonaIcon icon={Icons.lightbulb} size={14} color="#2E7D32" />
            <Text style={iqwsStyles.recSectionTitle}>AI Operational Recommendations</Text>
          </View>
          {report.recommendations.map((rec: string, i: number) => (
            <AIRecommendationBanner key={i} text={rec} color={rec.toLowerCase().includes('emergency') || rec.toLowerCase().includes('strong') ? '#EF4444' : '#2E7D32'} />
          ))}
        </Animated.View>
      )}
    </View>
  )
}

/* ─── Styles ─── */
const iqwsStyles = StyleSheet.create({
  section: {
    marginTop: 10,
  },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 14, marginTop: 16,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerIcon: {
    width: 30, height: 30, borderRadius: 10,
    backgroundColor: 'rgba(46,125,50,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1B1B1B' },
  headerRisk: {
    paddingVertical: 4, paddingHorizontal: 10, borderRadius: 50,
  },
  headerRiskText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.2 },

  /* Current Conditions */
  currentGrid: {
    flexDirection: 'row', gap: 8,
  },
  metricTile: {
    flex: 1, alignItems: 'center',
    backgroundColor: 'white', borderRadius: 16, paddingVertical: 14,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02, shadowRadius: 12, elevation: 1,
    gap: 4,
  },
  metricIconWrap: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', marginBottom: 2,
  },
  metricValue: { fontSize: 16, fontWeight: '700', color: '#1B1B1B' },
  metricLabel: { fontSize: 9, fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.3 },

  /* Risk Insight Row */
  insightRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: 'white', borderRadius: 20, padding: 16, marginTop: 10,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02, shadowRadius: 12, elevation: 1,
  },
  riskRing: { width: 60, height: 60, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  riskRingInner: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  riskRingScore: { fontSize: 16, fontWeight: '800' },
  insightContent: { flex: 1, gap: 4 },
  insightHead: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  insightHeadText: { fontSize: 11, fontWeight: '600' },
  insightBody: { fontSize: 12, lineHeight: 17, color: '#475569' },

  /* 3-Day Forecast */
  forecastRow: {
    flexDirection: 'row', gap: 8, marginTop: 10,
  },
  dayCard: {
    flex: 1, backgroundColor: 'white', borderRadius: 18, padding: 14,
    borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02, shadowRadius: 12, elevation: 1,
  },
  dayCardHigh: {
    backgroundColor: '#FFFBFB',
    shadowColor: '#EF4444', shadowOpacity: 0.04,
  },
  dayHeader: { marginBottom: 8 },
  dayName: { fontSize: 13, fontWeight: '700', color: '#1B1B1B' },
  dayDate: { fontSize: 9, fontWeight: '500', color: '#94A3B8', marginTop: 1 },
  dayCondition: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  dayTemp: { fontSize: 18, fontWeight: '800', color: '#1B1B1B' },
  dayTempUnit: { fontSize: 12, fontWeight: '500', color: '#94A3B8' },
  dayDetails: { gap: 3, marginBottom: 8 },
  dayDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dayDetailText: { fontSize: 9, fontWeight: '500', color: '#64748B' },
  dayRiskRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  dayRiskDot: { width: 5, height: 5, borderRadius: 2.5 },
  dayRiskText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.2 },
  dayRec: { fontSize: 9, lineHeight: 13, color: '#64748B', fontWeight: '500' },

  /* Recommendations */
  recommendationsSection: {
    marginTop: 14,
    backgroundColor: 'rgba(232,245,233,0.5)',
    borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: 'rgba(46,125,50,0.12)',
  },
  recSectionHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  recSectionTitle: { fontSize: 13, fontWeight: '700', color: '#1B5E20' },
  aiBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    paddingVertical: 10, paddingHorizontal: 12,
    borderRadius: 14, marginBottom: 6,
    borderWidth: 1,
  },
  aiBannerIcon: {
    width: 26, height: 26, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
  },
  aiBannerText: { flex: 1, fontSize: 11, lineHeight: 16, fontWeight: '500' },
})
