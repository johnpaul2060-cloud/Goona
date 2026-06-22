import { memo, useEffect, useRef, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, interpolate, Extrapolation } from 'react-native-reanimated'
import { Icons } from '../shared/icons'
import type { WeatherAlert } from '../utils/weatherIntelligence'
import { LinearGradient } from 'expo-linear-gradient'
import GoonaIcon from './ui/GoonaIcon'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { generateForecastReport, ForecastReport } from '../utils/weatherIntelligence'

interface GoonaWeatherPanelProps {
  visible: boolean
  onClose: () => void
}

function RiskBadge({ score }: { score: number }) {
  const color = score > 65 ? '#EF4444' : score > 35 ? '#F59E0B' : '#16A34A'
  const bgColor = score > 65 ? '#FEF2F2' : score > 35 ? '#FFFBEB' : '#F0FDF4'
  const label = score > 65 ? 'High Risk' : score > 35 ? 'Moderate' : 'Low Risk'
  return (
    <View style={[styles.riskBadge, { backgroundColor: bgColor, borderColor: color }]}>
      <GoonaIcon icon={Icons.alertTriangle} size={12} color={color} />
      <Text style={[styles.riskBadgeText, { color }]}>{label}</Text>
    </View>
  )
}

function MetricTile({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <View style={[styles.metricTile, { borderColor: `${color}20` }]}>
      <GoonaIcon icon={Icon} size={18} color={color} />
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  )
}

function GoonaWeatherPanel({ visible, onClose }: GoonaWeatherPanelProps) {
  const [report, setReport] = useState<ForecastReport | null>(null)
  const insets = useSafeAreaInsets()
  const panelAnim = useSharedValue(0)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (visible) {
      if (!report) setReport(generateForecastReport())
      panelAnim.value = withTiming(1, {
        duration: 450,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      })
    } else if (report) {
      panelAnim.value = withTiming(0, {
        duration: 350,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      })
      closeTimer.current = setTimeout(() => setReport(null), 400)
    }
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current)
    }
  }, [visible])

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(panelAnim.value, [0, 1], [0, 0.3], Extrapolation.CLAMP),
    pointerEvents: panelAnim.value > 0.5 ? 'auto' : ('none' as any),
  }))

  const panelStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(panelAnim.value, [0, 1], [500, 0], Extrapolation.CLAMP) },
    ],
    opacity: panelAnim.value,
  }))

  if (!report) return null

  const totalAlerts = report.alerts.filter((a: WeatherAlert) => a.severity === 'high').length

  return (
    <>
      <Animated.View style={[styles.overlay, overlayStyle]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
      </Animated.View>

      <Animated.View style={[styles.panel, panelStyle, { paddingBottom: insets.bottom + 16 }]}>
        <LinearGradient
          colors={['rgba(255,255,255,0.95)', 'rgba(248,250,252,0.98)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: 28 }]}
          pointerEvents="none"
        />

        <TouchableOpacity onPress={onClose} style={styles.handleWrap}>
          <View style={styles.handle} />
        </TouchableOpacity>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <GoonaIcon icon={Icons.thermometer} size={22} color="#2E7D32" />
              <Text style={styles.headerTitle}>Weather Intelligence</Text>
            </View>
            <RiskBadge score={report.operationalRisk.score} />
          </View>

          <View style={styles.metricsGrid}>
            <MetricTile
              icon={Icons.thermometer}
              label="Temperature"
              value={`${report.temperature.current}°C`}
              color={report.temperature.current > 34 ? '#EF4444' : '#F59E0B'}
            />
            <MetricTile
              icon={Icons.droplets}
              label="Humidity"
              value={`${report.humidity.current}%`}
              color={report.humidity.risk === 'high' ? '#0891B2' : '#0EA5E9'}
            />
            <MetricTile
              icon={Icons.cloudRain}
              label="Rainfall"
              value={`${report.rainfall.probability}%`}
              color={report.rainfall.expected ? '#1A56FF' : '#6366F1'}
            />
            <MetricTile
              icon={Icons.wind}
              label="Wind"
              value={report.wind.speed}
              color={report.wind.risk === 'high' ? '#EF4444' : '#6366F1'}
            />
          </View>

          {report.recommendations.length > 0 && (
            <View style={styles.recommendationsSection}>
              <View style={styles.sectionHeader}>
                <GoonaIcon icon={Icons.lightbulb} size={16} color="#2E7D32" />
                <Text style={styles.sectionTitle}>GOONA IQ Recommendations</Text>
              </View>
              {report.recommendations.map((rec: string, i: number) => (
                <View key={i} style={styles.recommendationRow}>
                  <View style={styles.bullet} />
                  <Text style={styles.recommendationText}>{rec}</Text>
                </View>
              ))}
            </View>
          )}

          {report.alerts.length > 0 && (
            <View style={styles.alertsSection}>
              <View style={styles.sectionHeader}>
                <GoonaIcon icon={Icons.alertTriangle} size={16} color={totalAlerts > 0 ? '#EF4444' : '#2E7D32'} />
                <Text style={styles.sectionTitle}>Active Alerts ({report.alerts.length})</Text>
              </View>
              {report.alerts.map((alert: WeatherAlert, i: number) => {
                const high = alert.severity === 'high'
                return (
                  <View key={i} style={[styles.alertRow, high && styles.alertRowHigh]}>
                    <GoonaIcon icon={alert.icon} size={14} color={alert.color} />
                    <Text style={[styles.alertText, high && styles.alertTextHigh]} numberOfLines={2}>
                      {alert.message}
                    </Text>
                  </View>
                )
              })}
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </>
  )
}

export default memo(GoonaWeatherPanel)

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: 520,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    zIndex: 999,
    elevation: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    overflow: 'hidden',
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingTop: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B5E20',
    letterSpacing: -0.3,
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  riskBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  metricTile: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.6)',
    gap: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginTop: 4,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#64748B',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  recommendationsSection: {
    marginBottom: 16,
    backgroundColor: 'rgba(232,245,233,0.6)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(46,125,50,0.15)',
  },
  alertsSection: {
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1B5E20',
    letterSpacing: 0.1,
  },
  recommendationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2E7D32',
    marginTop: 6,
    flexShrink: 0,
  },
  recommendationText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
    flex: 1,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  alertRowHigh: {
    backgroundColor: 'rgba(254,242,242,0.8)',
    borderColor: 'rgba(239,68,68,0.2)',
  },
  alertText: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 16,
    flex: 1,
  },
  alertTextHigh: {
    color: '#991B1B',
    fontWeight: '500',
  },
})
