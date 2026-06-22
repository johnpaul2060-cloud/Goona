import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import GoonaIcon from '../../components/ui/GoonaIcon';
import NotificationBadge from '../../components/NotificationBadge';
import { Icons } from '../../shared/icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import BottomDock from '../../components/navigation/BottomDock';
import { useBatchStore } from '../../store/useBatchStore';
import { useEffect, useState, useMemo } from 'react';
import { useWeatherStore, seedWeatherForecast } from '../../store/useWeatherStore';
import { FARM_NAME } from '../../constants/farm';
import {
  useAdaptiveDashboard,
  useAdaptiveQuickActions,
  usePriorityBanner,
  usePriorityEngine,
  PRIORITY_COLORS,
  type PriorityLevel,
  type DashboardCardPriority,
} from '../../store/farmPriorityEngine';

const { width } = Dimensions.get('window');

function weeksSince(dateStr: string): number {
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diff / (7 * 24 * 60 * 60 * 1000))
}

function parseWeeks(duration: string): number {
  const n = parseInt(duration, 10)
  return isNaN(n) ? 8 : n
}

function computeProgress(startDate: string, duration: string): number {
  const total = parseWeeks(duration)
  const elapsed = weeksSince(startDate)
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)))
}

function usePressScale(scaleTo = 0.96) {
  const scale = useSharedValue(1)
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
  return {
    style,
    onPressIn: () => { scale.value = withSpring(scaleTo, { damping: 15, stiffness: 200 }) },
    onPressOut: () => { scale.value = withSpring(1, { damping: 15, stiffness: 200 }) },
  }
}

type PrioritySeverity = 'info' | 'attention' | 'urgent'
const SEVERITY_COLORS: Record<PrioritySeverity, { text: string; bg: string; border: string; dot: string }> = {
  info:      { text: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0', dot: '#16A34A' },
  attention: { text: '#D97706', bg: '#FFFBEB', border: '#FDE68A', dot: '#F59E0B' },
  urgent:    { text: '#DC2626', bg: '#FEF2F2', border: '#FECACA', dot: '#EF4444' },
}
const TODAY_PRIORITIES: { icon: any; label: string; desc: string; severity: PrioritySeverity }[] = [
  { icon: Icons.clock, label: 'Medication due today', desc: 'Newcastle vaccine scheduled for Batch A — 420 broilers', severity: 'urgent' },
  { icon: Icons.alertCircle, label: 'Feed stock running low', desc: 'Grower feed at 15% reserve — order within 48 hours', severity: 'attention' },
  { icon: Icons.clipboardList, label: 'Water log not submitted', desc: 'Yesterday\'s water consumption record is missing', severity: 'info' },
]

type HealthStatus = 'ok' | 'warning' | 'info'
const HEALTH_ITEMS: { icon: any; label: string; status: string; type: HealthStatus }[] = [
  { icon: Icons.checkCircle, label: 'Feed', status: 'Logged Today', type: 'ok' },
  { icon: Icons.checkCircle, label: 'Water', status: 'Logged Today', type: 'ok' },
  { icon: Icons.alertCircle, label: 'Medication', status: 'Due Today', type: 'warning' },
  { icon: Icons.shield, label: 'Mortality', status: '2 Birds Reported', type: 'info' },
]

const ACTION_ICONS: Record<string, { icon: any; color: string; bg: string; route: string }> = {
  'Record Sale': { icon: Icons.shoppingCart, color: '#16A34A', bg: '#F0FDF4', route: '/record-sale' },
  'Expenses': { icon: Icons.banknote, color: '#EF4444', bg: '#FFF1F2', route: '/(tabs)/records/expenses' },
  'Daily Records': { icon: Icons.clipboardList, color: '#1A56FF', bg: '#EEF3FF', route: '/(tabs)/records/daily-operations' },
  'Budget': { icon: Icons.barChart3, color: '#F59E0B', bg: '#FFFBEB', route: '/(tabs)/records/expenses/budget' },
  'Reports': { icon: Icons.fileText, color: '#8B5CF6', bg: '#F5F3FF', route: '/(tabs)/records/expenses/reports' },
  'Academy': { icon: Icons.graduationCap, color: '#F97316', bg: '#FFF7ED', route: '/goona-academy' },
}

const PULSES = [
  { icon: Icons.trendingUp, color: '#16A34A', bg: '#F0FDF4', label: 'Farm performing above target', badge: '+12%', badgeColor: '#16A34A' },
  { icon: Icons.trendingDown, color: '#F59E0B', bg: '#FFFBEB', label: 'Feed conversion declining', badge: '-8%', badgeColor: '#D97706' },
  { icon: Icons.activity, color: '#16A34A', bg: '#F0FDF4', label: 'Production efficiency improved', badge: '+8%', badgeColor: '#16A34A' },
]

function PriorityBannerCard({ message, level }: { message: string; level: PriorityLevel }) {
  const bc = PRIORITY_COLORS[level]
  return (
    <Animated.View entering={FadeIn.duration(400)} style={[styles.bannerCard, { backgroundColor: bc + '15', borderColor: bc + '40' }]}>
      <View style={[styles.bannerDot, { backgroundColor: bc }]} />
      <GoonaIcon icon={Icons.shieldAlert} size={18} color={bc} />
      <Text style={[styles.bannerText, { color: bc }]}>{message}</Text>
    </Animated.View>
  )
}

const ROUTE_FALLBACKS: Record<string, string> = {
  '/(tabs)/records/expenses/budget': '/(tabs)/records/expenses',
  '/(tabs)/records/expenses/reports': '/(tabs)/records/expenses',
}

type SectionEntry = { id: string; render: () => React.ReactNode; priority: number; highlight: boolean; badge: string | null }

export default function DashboardScreen() {
  const router = useRouter();
  const batches = useBatchStore((s) => s.batches)
  const weatherStore = useWeatherStore()
  const [pulseIdx, setPulseIdx] = useState(0)

  const cardPriorities = useAdaptiveDashboard()
  const adaptiveActions = useAdaptiveQuickActions()
  const banner = usePriorityBanner()
  const engineState = usePriorityEngine()

  const cardLookup = useMemo(() => {
    const map: Record<string, DashboardCardPriority> = {}
    for (const c of cardPriorities) map[c.id] = c
    return map
  }, [cardPriorities])

  const getCard = (id: string): DashboardCardPriority =>
    cardLookup[id] ?? { id, label: '', priority: 50, highlight: false, badge: null }

  const navigateSafe = (route: string) => {
    const fallback = ROUTE_FALLBACKS[route]
    if (fallback) {
      try { router.push(route as any) } catch { router.push(fallback as any) }
    } else {
      router.push(route as any)
    }
  }

  const navigateToWeather = () => {
    try {
      router.push('/weather-details' as any)
    } catch {
      if (__DEV__) console.log('Weather Intelligence route not found')
    }
  }

  useEffect(() => {
    seedWeatherForecast()
    const interval = setInterval(() => {
      setPulseIdx(i => (i + 1) % PULSES.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [])

  const today = weatherStore.getToday()
  const temp = today?.tempHigh ?? 31
  const humidity = today?.humidity ?? 68
  const rainProb = today?.rainProbability ?? 15

  const pulse = PULSES[pulseIdx]

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.blob} pointerEvents="none" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollInner}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── GREETING ─── */}
        <View style={styles.greeting}>
          <View>
            <Text style={styles.greetingSub}>Good Morning 👋</Text>
            <Text style={styles.greetingName}>Paul</Text>
            <Text style={styles.greetingStatus}>Your farm is performing well today.</Text>
          </View>
          <TouchableOpacity style={styles.notifBtn} onPress={() => router.push('/notifications')}>
            <GoonaIcon icon={Icons.bell} size={22} color="#1F2937" />
            <NotificationBadge />
          </TouchableOpacity>
        </View>

        {/* ─── PRIORITY BANNER ─── */}
        {banner.message && banner.level && <PriorityBannerCard message={banner.message} level={banner.level} />}

        {/* ─── HERO FARM CARD ─── */}
        <Animated.View entering={FadeIn.duration(400)} style={[styles.heroCard, getCard('hero').highlight && styles.heroCardHighlight]}>
          <LinearGradient
            colors={['#065F46', '#047857']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: 30 }]}
            pointerEvents="none"
          />
          <View style={styles.heroSparkle} pointerEvents="none" />

          <View style={styles.heroHead}>
            <View style={styles.heroHeadLeft}>
              <View style={styles.heroStatusRow}>
                <Text style={styles.heroLabel}>ACTIVE FARM</Text>
                <View style={styles.heroBadge}>
                  <View style={styles.heroBadgeDot} />
                  <Text style={styles.heroBadgeText}>High Performing Farm</Text>
                </View>
              </View>
              <Text style={styles.heroFarmName}>{FARM_NAME}</Text>
            </View>
            <TouchableOpacity style={styles.heroChartBtn}>
              <GoonaIcon icon={Icons.barChart3} size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.heroMetrics}>
            <View style={styles.heroMetric}>
              <Text style={styles.heroMetricVal}>1,240</Text>
              <Text style={styles.heroMetricLbl}>Bird Count</Text>
            </View>
            <View style={styles.heroMetric}>
              <Text style={styles.heroMetricVal}>98%</Text>
              <Text style={styles.heroMetricLbl}>Survival Rate</Text>
            </View>
            <View style={styles.heroMetric}>
              <Text style={styles.heroMetricVal}>₦2.4M</Text>
              <Text style={styles.heroMetricLbl}>Revenue</Text>
            </View>
          </View>

          <View style={styles.heroProgress}>
            <View style={styles.heroProgHead}>
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>Next Production Cycle Savings</Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: 'white' }}>72%</Text>
            </View>
            <View style={styles.heroProgTrack}>
              <View style={styles.heroProgFill} />
            </View>
          </View>
        </Animated.View>

        {/* ─── TODAY'S PRIORITIES ─── */}
        <View style={styles.secHead}>
          <Text style={styles.secTitle}>Today's Priorities</Text>
        </View>
        {TODAY_PRIORITIES.slice(0, 3).map((p, i) => {
          const c = SEVERITY_COLORS[p.severity]
          return (
            <Animated.View key={i} entering={FadeIn.duration(400).delay(i * 80)} style={[styles.priorityCard, { backgroundColor: c.bg, borderColor: c.border }]}>
              <View style={[styles.priorityDot, { backgroundColor: c.dot }]} />
              <View style={[styles.priorityIconWrap, { backgroundColor: c.dot + '18' }]}>
                <GoonaIcon icon={p.icon} size={18} color={c.text} />
              </View>
              <View style={styles.priorityInfo}>
                <Text style={[styles.priorityLabel, { color: c.text }]}>{p.label}</Text>
                <Text style={styles.priorityDesc}>{p.desc}</Text>
              </View>
            </Animated.View>
          )
        })}

        {/* ─── FARM HEALTH SNAPSHOT ─── */}
        <View style={styles.secHead}>
          <Text style={styles.secTitle}>Farm Health Snapshot</Text>
        </View>
        <View style={styles.healthGrid}>
          {HEALTH_ITEMS.map((h, i) => {
            const dotColor = h.type === 'ok' ? '#16A34A' : h.type === 'warning' ? '#F59E0B' : '#1A56FF'
            const textColor = h.type === 'ok' ? '#16A34A' : h.type === 'warning' ? '#D97706' : '#1A56FF'
            return (
              <View key={i} style={styles.healthChip}>
                <GoonaIcon icon={h.icon} size={14} color={dotColor} />
                <View style={styles.healthInfo}>
                  <Text style={styles.healthLabel}>{h.label}</Text>
                  <Text style={[styles.healthStatus, { color: textColor }]}>{h.status}</Text>
                </View>
              </View>
            )
          })}
        </View>

        {/* ─── QUICK ACTIONS ─── */}
        <View style={styles.secHead}>
          <Text style={styles.secTitle}>Quick Actions</Text>
            {engineState.decision.bannerLevel && (
            <Text style={[styles.secLink, { color: PRIORITY_COLORS[engineState.decision.bannerLevel] }]}>
              {engineState.decision.dominantLabel} Focus
            </Text>
          )}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.qaScroll}>
          {adaptiveActions.map((a, i) => {
            const config = ACTION_ICONS[a.label]
            if (!config) return null
            return (
              <TouchableOpacity
                key={a.label}
                style={[styles.qaCard, a.highlight && { borderWidth: 2, borderColor: '#F59E0B', backgroundColor: '#FFFBEB' }]}
                activeOpacity={0.85}
                onPress={() => navigateSafe(config.route)}
              >
                <View style={[styles.qaIcon, { backgroundColor: config.bg }]}>
                  <GoonaIcon icon={config.icon} size={26} color={config.color} />
                </View>
                <Text style={styles.qaLabel}>{a.label}</Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>

        {/* ─── GOONA IQ RECOMMENDATION ─── */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.iqCard}>
          <View style={styles.iqHead}>
            <View style={styles.iqBadgeRow}>
              <GoonaIcon icon={Icons.sparkles} size={14} color="#2E7D32" />
              <Text style={styles.iqBadgeText}>GOONA IQ</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/goona-iq')}>
              <Text style={styles.iqCta}>Details</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.iqRecommendation}>
            <GoonaIcon icon={Icons.brainCircuit} size={22} color="#2E7D32" />
            <Text style={styles.iqRecText}>
              Save ₦85,000 this week to remain on track for your next production cycle.
            </Text>
          </View>
        </Animated.View>

        {/* ─── WEATHER INTELLIGENCE ─── */}
        <TouchableOpacity activeOpacity={0.8} onPress={navigateToWeather}>
          <Animated.View entering={FadeIn.duration(400)} style={styles.weatherCard}>
            <View style={styles.weatherHead}>
              <GoonaIcon icon={Icons.cloudSun} size={18} color="#2E7D32" />
              <Text style={styles.weatherTitle}>Weather Intelligence</Text>
            </View>
            <View style={styles.weatherBody}>
              <View style={styles.weatherMain}>
                <View style={styles.weatherRow}>
                  <View style={styles.weatherStat}>
                    <GoonaIcon icon={Icons.thermometer} size={14} color="#F59E0B" />
                    <Text style={styles.weatherVal}>{temp}°C</Text>
                    <Text style={styles.weatherLbl}>Temperature</Text>
                  </View>
                  <View style={styles.weatherDiv} />
                  <View style={styles.weatherStat}>
                    <GoonaIcon icon={Icons.droplets} size={14} color="#1A56FF" />
                    <Text style={styles.weatherVal}>{humidity}%</Text>
                    <Text style={styles.weatherLbl}>Humidity</Text>
                  </View>
                  <View style={styles.weatherDiv} />
                  <View style={styles.weatherStat}>
                    <GoonaIcon icon={Icons.cloudRain} size={14} color="#6366F1" />
                    <Text style={styles.weatherVal}>{rainProb}%</Text>
                    <Text style={styles.weatherLbl}>Rain</Text>
                  </View>
                </View>
              </View>
              <View style={styles.weatherRec}>
                <GoonaIcon icon={Icons.brainCircuit} size={12} color="#2E7D32" />
                <Text style={styles.weatherRecText}>
                  {rainProb > 50 ? 'Prepare drainage before expected rainfall today.' : 'Reduce litter moisture monitoring today.'}
                </Text>
              </View>
            </View>
          </Animated.View>
        </TouchableOpacity>

        {/* ─── PRODUCTION PULSE ─── */}
        <Animated.View key={pulseIdx} entering={FadeIn.duration(500)} style={[styles.pulseCard, { backgroundColor: pulse.bg }]}>
          <View style={styles.pulseRow}>
            <View style={[styles.pulseIconWrap, { backgroundColor: pulse.color + '20' }]}>
              <GoonaIcon icon={pulse.icon} size={20} color={pulse.color} />
            </View>
            <View style={styles.pulseInfo}>
              <Text style={[styles.pulseLabel, { color: pulse.color }]}>{pulse.label}</Text>
            </View>
            <View style={[styles.pulseBadge, { backgroundColor: pulse.color + '20' }]}>
              <Text style={[styles.pulseBadgeText, { color: pulse.badgeColor }]}>{pulse.badge}</Text>
            </View>
          </View>
        </Animated.View>

        {/* ─── ACTIVE BATCHES ─── */}
        {batches.length > 0 && (
          <>
            <View style={styles.secHead}>
              <Text style={styles.secTitle}>Active Batches</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/batches' as any)}><Text style={styles.secLink}>See All</Text></TouchableOpacity>
            </View>
            {batches.slice(0, 2).map((b) => {
              const prog = computeProgress(b.startDate, b.duration)
              const borderClr = prog > 80 ? '#F59E0B' : '#16A34A'
              return (
                <TouchableOpacity key={b.id} style={[styles.batchCard, { borderLeftColor: borderClr }]} activeOpacity={0.85}
                  onPress={() => router.push({ pathname: '/batch-details/[id]', params: { id: b.id } })}
                >
                  <View style={styles.batchTop}>
                    <Text style={styles.batchName}>{b.batchName}</Text>
                  </View>
                  <View style={styles.batchDetails}>
                    <View><Text style={styles.batchDetailLbl}>Type</Text><Text style={styles.batchDetailVal}>{b.livestockType}</Text></View>
                    <View><Text style={styles.batchDetailLbl}>Birds</Text><Text style={styles.batchDetailVal}>{b.quantity}</Text></View>
                  </View>
                  <View style={styles.batchProgress}>
                    <View style={styles.batchProgTrack}>
                      <View style={[styles.batchProgFill, { width: `${prog}%`, backgroundColor: borderClr }]} />
                    </View>
                  </View>
                </TouchableOpacity>
              )
            })}
          </>
        )}

        {/* ─── DAILY CHALLENGE ─── */}
        <TouchableOpacity style={styles.challengeCard} activeOpacity={0.8} onPress={() => router.push('/academy/daily-challenge')}>
          <View style={styles.challengeIconWrap}>
            <GoonaIcon icon={Icons.award} size={18} color="#F97316" />
          </View>
          <Text style={styles.challengeText}>Daily Challenge</Text>
          <GoonaIcon icon={Icons.chevronRight} size={16} color="#94A3B8" />
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomDock />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAF7' },
  blob: {
    position: 'absolute', top: -80, right: -80, width: 300, height: 300,
    borderRadius: 150, backgroundColor: 'rgba(232,245,233,0.3)', zIndex: 0,
  },
  scroll: { flex: 1 },
  scrollInner: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 100 },
  greeting: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 5 },
  greetingSub: { fontSize: 14, fontWeight: '500', color: '#616161' },
  greetingName: { fontSize: 30, fontWeight: '800', color: '#1B1B1B', marginTop: -2 },
  greetingStatus: { fontSize: 13, color: '#A0AEA1', marginTop: 0 },
  notifBtn: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: 'white',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 14, elevation: 3,
  },
  heroCard: {
    backgroundColor: '#065F46', borderRadius: 30, padding: 24, marginTop: 18, overflow: 'hidden',
    shadowColor: '#065F46', shadowOffset: { width: 0, height: 18 }, shadowOpacity: 0.25, shadowRadius: 40, elevation: 8,
  },
  heroHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 1 },
  heroLabel: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.75)', letterSpacing: 1 },
  heroFarmName: { fontSize: 24, fontWeight: '700', color: 'white', marginTop: 2 },
  heroChartBtn: {
    width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroMetrics: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, zIndex: 1 },
  heroMetric: { flex: 1, alignItems: 'center' },
  heroMetricVal: { fontSize: 24, fontWeight: '800', color: 'white' },
  heroMetricLbl: { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  heroSparkle: {
    position: 'absolute', top: -30, right: -30, width: 160, height: 160,
    borderRadius: 80, backgroundColor: 'rgba(174,234,0,0.06)', zIndex: 0,
  },
  heroHeadLeft: { flex: 1 },
  heroStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  heroBadgeDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#AEEA00' },
  heroBadgeText: { fontSize: 9, fontWeight: '600', color: 'white', letterSpacing: 0.3 },
  heroProgress: { marginTop: 20, zIndex: 1 },
  heroProgHead: { flexDirection: 'row', justifyContent: 'space-between' },
  heroProgTrack: { height: 8, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 100, marginTop: 6, overflow: 'hidden' },
  heroProgFill: { height: '100%', width: '72%', borderRadius: 100, backgroundColor: '#AEEA00' },
  secHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 14, zIndex: 5 },
  secTitle: { fontSize: 20, fontWeight: '800', color: '#1F2937' },
  secLink: { fontSize: 13, fontWeight: '500', color: '#2E7D32' },

  /* ─── TODAY'S PRIORITIES ─── */
  priorityCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 16, padding: 14, marginBottom: 8,
    borderWidth: 1, overflow: 'hidden',
  },
  priorityDot: { width: 4, height: '100%', position: 'absolute', left: 0, top: 0, bottom: 0, borderTopLeftRadius: 16, borderBottomLeftRadius: 16 },
  priorityIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  priorityInfo: { flex: 1 },
  priorityLabel: { fontSize: 14, fontWeight: '700' },
  priorityDesc: { fontSize: 11, color: '#64748B', marginTop: 1, lineHeight: 15 },

  /* ─── FARM HEALTH SNAPSHOT ─── */
  healthGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
  },
  healthChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'white', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)',
    width: (width - 48) / 2,
  },
  healthInfo: { flex: 1 },
  healthLabel: { fontSize: 11, fontWeight: '600', color: '#94A3B8' },
  healthStatus: { fontSize: 12, fontWeight: '700', marginTop: 1 },

  /* ─── QUICK ACTIONS ─── */
  qaScroll: { paddingBottom: 4, zIndex: 5 },
  qaCard: {
    width: 86, height: 96,
    backgroundColor: 'white', borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', gap: 8,
    marginRight: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05, shadowRadius: 20, elevation: 2,
  },
  qaIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  qaLabel: { fontSize: 11, fontWeight: '600', color: '#1B1B1B' },

  /* ─── GOONA IQ RECOMMENDATION ─── */
  iqCard: {
    backgroundColor: 'white', borderRadius: 24, padding: 18, marginTop: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04, shadowRadius: 16, elevation: 2,
    borderWidth: 1, borderColor: 'rgba(46,125,50,0.08)',
  },
  iqHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  iqBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  iqBadgeText: { fontSize: 11, fontWeight: '700', color: '#2E7D32', letterSpacing: 0.5 },
  iqCta: { fontSize: 12, fontWeight: '600', color: '#2E7D32' },
  iqRecommendation: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iqRecText: { fontSize: 14, color: '#374151', lineHeight: 20, flex: 1 },

  /* ─── WEATHER INTELLIGENCE ─── */
  weatherCard: {
    backgroundColor: 'white', borderRadius: 24, padding: 18, marginTop: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04, shadowRadius: 16, elevation: 2,
    borderWidth: 1, borderColor: 'rgba(46,125,50,0.08)',
  },
  weatherHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  weatherTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  weatherBody: {},
  weatherMain: { marginBottom: 12 },
  weatherRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  weatherStat: { alignItems: 'center', flex: 1, gap: 4 },
  weatherVal: { fontSize: 18, fontWeight: '800', color: '#1F2937' },
  weatherLbl: { fontSize: 10, color: '#94A3B8' },
  weatherDiv: { width: 1, height: 28, backgroundColor: '#E2E8F0' },
  weatherRec: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#F0FDF4', borderRadius: 12, padding: 10,
  },
  weatherRecText: { fontSize: 12, color: '#374151', flex: 1, lineHeight: 16 },

  /* ─── PRODUCTION PULSE ─── */
  pulseCard: {
    borderRadius: 20, padding: 16, marginTop: 16,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)',
  },
  pulseRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pulseIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  pulseInfo: { flex: 1 },
  pulseLabel: { fontSize: 14, fontWeight: '600' },
  pulseBadge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6 },
  pulseBadgeText: { fontSize: 11, fontWeight: '700' },

  /* ─── ACTIVE BATCHES ─── */
  batchCard: {
    backgroundColor: 'white', borderRadius: 24, padding: 18, marginBottom: 12,
    borderLeftWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05, shadowRadius: 20, elevation: 2,
  },
  batchTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  batchName: { fontSize: 17, fontWeight: '700', color: '#1F2937' },
  batchDetails: { flexDirection: 'row', gap: 20, marginTop: 10 },
  batchDetailLbl: { fontSize: 11, color: '#94A3B8' },
  batchDetailVal: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  batchProgress: { marginTop: 12 },
  batchProgTrack: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 100, overflow: 'hidden' },
  batchProgFill: { height: '100%', borderRadius: 100 },

  /* ─── DAILY CHALLENGE ─── */
  challengeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'white', borderRadius: 16, padding: 14, marginTop: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04, shadowRadius: 12, elevation: 1,
  },
  challengeIconWrap: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFF7ED',
    alignItems: 'center', justifyContent: 'center',
  },
  challengeText: { fontSize: 14, fontWeight: '600', color: '#1F2937', flex: 1 },

  /* ─── PRIORITY BANNER ─── */
  bannerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 16, padding: 14, marginTop: 12,
    borderWidth: 1, overflow: 'hidden',
  },
  bannerDot: { width: 4, height: '100%', position: 'absolute', left: 0, top: 0, bottom: 0, borderTopLeftRadius: 16, borderBottomLeftRadius: 16 },
  bannerText: { fontSize: 13, fontWeight: '600', flex: 1, lineHeight: 18 },
  heroCardHighlight: {
    shadowColor: '#EF4444', shadowOpacity: 0.3, shadowRadius: 24,
    borderWidth: 2, borderColor: '#EF444480',
  },
});
