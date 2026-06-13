import React from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Dimensions,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import GoonaIcon from '../components/ui/GoonaIcon'
import { ArrowLeft, CloudSun, Droplets, Thermometer, Wind, Sun, Cloud, CloudRain, CloudSnow, CloudLightning, Navigation } from 'lucide-react-native'
import Animated, { FadeInUp } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'

const { width } = Dimensions.get('window')

const FORECAST = [
  { day: 'Today', temp: '32°C', icon: Sun, color: '#F59E0B', high: '34°', low: '26°' },
  { day: 'Mon', temp: '30°C', icon: CloudSun, color: '#F59E0B', high: '32°', low: '24°' },
  { day: 'Tue', temp: '28°C', icon: Cloud, color: '#94A3B8', high: '30°', low: '23°' },
  { day: 'Wed', temp: '27°C', icon: CloudRain, color: '#1A56FF', high: '29°', low: '22°' },
  { day: 'Thu', temp: '29°C', icon: CloudSun, color: '#F59E0B', high: '31°', low: '24°' },
  { day: 'Fri', temp: '31°C', icon: Sun, color: '#F59E0B', high: '33°', low: '25°' },
]

const HOURS = [
  { time: 'Now', temp: '32°', icon: Sun, color: '#F59E0B' },
  { time: '13:00', temp: '33°', icon: Sun, color: '#F59E0B' },
  { time: '14:00', temp: '34°', icon: CloudSun, color: '#F59E0B' },
  { time: '15:00', temp: '32°', icon: Cloud, color: '#94A3B8' },
  { time: '16:00', temp: '30°', icon: CloudRain, color: '#1A56FF' },
  { time: '17:00', temp: '28°', icon: CloudRain, color: '#1A56FF' },
]

function usePressScale(scaleTo = 0.96) {
  const scale = React.useRef(new Animated.SharedValue(1)).current
  const style = React.useRef(Animated.useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))).current
  return {
    style,
    onPressIn: () => { scale.value = Animated.withSpring(scaleTo, { damping: 15, stiffness: 200 }) },
    onPressOut: () => { scale.value = Animated.withSpring(1, { damping: 15, stiffness: 200 }) },
    scale,
  }
}

export default function WeatherDetailsScreen() {
  const insets = useSafeAreaInsets()

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
            <GoonaIcon icon={ArrowLeft} size={24} color="#1B1B1B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Weather Details</Text>
          <View style={styles.backBtn} />
        </Animated.View>

        {/* CURRENT WEATHER HERO */}
        <Animated.View entering={FadeInUp.duration(500).delay(80).springify()} style={styles.heroCard}>
          <LinearGradient colors={['#2E7D32', '#1B5E20']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} borderRadius={28} />
          <View style={styles.heroContent}>
            <View style={styles.heroTop}>
              <View>
                <Text style={styles.heroLocation}>Lagos, Nigeria</Text>
                <Text style={styles.heroDate}>Saturday, 13 June 2026</Text>
              </View>
              <View style={styles.heroIconWrap}>
                <GoonaIcon icon={Sun} size={40} color="#FFD700" />
              </View>
            </View>
            <View style={styles.heroTempRow}>
              <Text style={styles.heroTemp}>32°</Text>
              <Text style={styles.heroUnit}>C</Text>
            </View>
            <Text style={styles.heroCondition}>Sunny — Feels like 34°C</Text>
            <View style={styles.heroMetrics}>
              <View style={styles.heroMetric}>
                <GoonaIcon icon={Thermometer} size={14} color="rgba(255,255,255,0.7)" />
                <Text style={styles.heroMetricLbl}>H: 35° L: 24°</Text>
              </View>
              <View style={styles.heroMetric}>
                <GoonaIcon icon={Droplets} size={14} color="rgba(255,255,255,0.7)" />
                <Text style={styles.heroMetricLbl}>Humidity 68%</Text>
              </View>
              <View style={styles.heroMetric}>
                <GoonaIcon icon={Wind} size={14} color="rgba(255,255,255,0.7)" />
                <Text style={styles.heroMetricLbl}>Wind 12 km/h</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* HOURLY FORECAST */}
        <Animated.View entering={FadeInUp.duration(500).delay(140).springify()} style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Hourly Forecast</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hourlyScroll}>
            {HOURS.map((h, i) => (
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
          <View style={styles.metricCard}>
            <View style={styles.metricIcon}>
              <GoonaIcon icon={Droplets} size={20} color="#1A56FF" />
            </View>
            <Text style={styles.metricLabel}>Humidity</Text>
            <Text style={styles.metricValue}>68%</Text>
            <Text style={styles.metricNote}>Moderate</Text>
          </View>
          <View style={styles.metricCard}>
            <View style={styles.metricIcon}>
              <GoonaIcon icon={Wind} size={20} color="#6366F1" />
            </View>
            <Text style={styles.metricLabel}>Wind Speed</Text>
            <Text style={styles.metricValue}>12 km/h</Text>
            <Text style={styles.metricNote}>Light breeze</Text>
          </View>
          <View style={styles.metricCard}>
            <View style={styles.metricIcon}>
              <GoonaIcon icon={CloudRain} size={20} color="#1A56FF" />
            </View>
            <Text style={styles.metricLabel}>Rainfall</Text>
            <Text style={styles.metricValue}>15 mm</Text>
            <Text style={styles.metricNote}>Today</Text>
          </View>
          <View style={styles.metricCard}>
            <View style={styles.metricIcon}>
              <GoonaIcon icon={Navigation} size={20} color="#16A34A" />
            </View>
            <Text style={styles.metricLabel}>UV Index</Text>
            <Text style={styles.metricValue}>7</Text>
            <Text style={styles.metricNote}>High</Text>
          </View>
        </Animated.View>

        {/* 6-DAY FORECAST */}
        <Animated.View entering={FadeInUp.duration(500).delay(260).springify()} style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>6-Day Forecast</Text>
          {FORECAST.map((d, i) => (
            <View key={i} style={[styles.forecastRow, i < FORECAST.length - 1 && styles.forecastRowBorder]}>
              <Text style={styles.forecastDay}>{d.day}</Text>
              <GoonaIcon icon={d.icon} size={20} color={d.color} />
              <Text style={styles.forecastTemp}>{d.temp}</Text>
              <View style={styles.forecastRange}>
                <Text style={styles.forecastHigh}>{d.high}</Text>
                <View style={styles.forecastBar}>
                  <View style={[styles.forecastBarFill, { width: i === 0 ? '70%' : i === 1 ? '60%' : i === 2 ? '50%' : i === 3 ? '40%' : i === 4 ? '55%' : '65%' }]} />
                </View>
                <Text style={styles.forecastLow}>{d.low}</Text>
              </View>
            </View>
          ))}
        </Animated.View>

        {/* FARM IMPACT */}
        <Animated.View entering={FadeInUp.duration(500).delay(320).springify()} style={styles.impactCard}>
          <Text style={styles.impactTitle}>Farm Impact</Text>
          <View style={styles.impactRow}>
            <View style={styles.impactDot} />
            <Text style={styles.impactText}>Moderate heat expected. Ensure adequate ventilation in poultry houses.</Text>
          </View>
          <View style={styles.impactRow}>
            <View style={[styles.impactDot, { backgroundColor: '#1A56FF' }]} />
            <Text style={styles.impactText}>Rain expected Wednesday. Plan feed deliveries accordingly.</Text>
          </View>
          <View style={styles.impactRow}>
            <View style={[styles.impactDot, { backgroundColor: '#16A34A' }]} />
            <Text style={styles.impactText}>Favorable conditions for vaccination schedules this week.</Text>
          </View>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
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

  /* hero */
  heroCard: { borderRadius: 28, marginTop: 18, overflow: 'hidden', shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.25, shadowRadius: 40, elevation: 8 },
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
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 16 },

  /* hourly */
  hourlyScroll: { gap: 12, paddingBottom: 4 },
  hourItem: { alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16, backgroundColor: '#F8FAF7', minWidth: 64 },
  hourItemActive: { backgroundColor: 'rgba(46,125,50,0.08)', borderWidth: 1, borderColor: 'rgba(46,125,50,0.2)' },
  hourTime: { fontSize: 11, fontWeight: '500', color: '#94A3B8' },
  hourTemp: { fontSize: 14, fontWeight: '600', color: '#1F2937' },

  /* metrics grid */
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16 },
  metricCard: { width: (width - 52) / 2, backgroundColor: 'white', borderRadius: 20, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 16, elevation: 2 },
  metricIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#F8FAF7', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  metricLabel: { fontSize: 11, color: '#94A3B8' },
  metricValue: { fontSize: 22, fontWeight: '800', color: '#1F2937', marginTop: 2 },
  metricNote: { fontSize: 11, color: '#64748B', marginTop: 1 },

  /* forecast */
  forecastRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  forecastRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  forecastDay: { fontSize: 14, fontWeight: '500', color: '#1F2937', width: 44 },
  forecastTemp: { fontSize: 14, fontWeight: '600', color: '#1F2937', width: 40, textAlign: 'right' },
  forecastRange: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  forecastHigh: { fontSize: 11, fontWeight: '600', color: '#1F2937', width: 24 },
  forecastBar: { flex: 1, height: 4, backgroundColor: '#F1F5F9', borderRadius: 2, overflow: 'hidden' },
  forecastBarFill: { height: '100%', backgroundColor: '#2E7D32', borderRadius: 2 },
  forecastLow: { fontSize: 11, color: '#94A3B8', width: 24, textAlign: 'right' },

  /* impact */
  impactCard: { backgroundColor: '#E8F5E9', borderRadius: 24, padding: 20, marginTop: 16 },
  impactTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 12 },
  impactRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  impactDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#F59E0B', marginTop: 5 },
  impactText: { fontSize: 13, color: '#374151', flex: 1, lineHeight: 18 },
})
