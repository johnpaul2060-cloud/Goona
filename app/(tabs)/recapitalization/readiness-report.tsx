import React, { useMemo } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Platform,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import GoonaIcon from '../../../components/ui/GoonaIcon'
import { formatNaira } from '../../../utils/format'
import {
  ArrowLeft, TrendingUp, TrendingDown, Target, Award,
  Lightbulb, AlertTriangle, CheckCircle, Clock, BarChart,
} from 'lucide-react-native'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, { FadeInDown } from 'react-native-reanimated'
import {
  useRecoveryStore, fmtDateFromParts,
  computeStreak, computeMonthlyStats, generateInsights,
} from '../../../store/useRecoveryStore'

const PRODUCTION_GOALS = [
  { title: 'Broiler Restocking', target: '\u20A62.5M', saved: '\u20A61.2M', progress: 0.48, timeline: 'Q3 2026', color: '#2E7D32' },
  { title: 'Feed Reserve', target: '\u20A61.8M', saved: '\u20A6450k', progress: 0.25, timeline: 'Q1 2027', color: '#1A56FF' },
  { title: 'Emergency Reserve', target: '\u20A6800k', saved: '\u20A6520k', progress: 0.65, timeline: 'Q4 2026', color: '#F59E0B' },
]

function formatCurrency(n: number) {
  return formatNaira(n)
}

export default function ReadinessReportScreen() {
  const insets = useSafeAreaInsets()
  const records = useRecoveryStore((s) => s.records)
  const now = new Date()
  const todayStr = fmtDateFromParts(now.getFullYear(), now.getMonth(), now.getDate())
  const streak = computeStreak(records)
  const stats = computeMonthlyStats(records, now.getFullYear(), now.getMonth())
  const insights = generateInsights(records)

  let totalSaved = 0
  let totalMissed = 0
  for (const key in records) {
    const r = records[key]
    if (r.amount && (r.status === 'completed' || r.status === 'exceeded')) totalSaved += r.amount
    if (r.status === 'missed') totalMissed++
  }
  const totalTarget = 2500000
  const overallProgress = Math.min(totalSaved / totalTarget, 1)

  const todayRec = records[todayStr]
  const isDue = !todayRec || todayRec.status === 'none' || !todayRec.status

  const consistencyRate = stats.total > 0
    ? Math.round(((stats.completed + stats.exceeded) / stats.total) * 100)
    : 0

  const forecast = [
    { month: 'Jul', projection: totalSaved * 1.12, optimistic: totalSaved * 1.2, pessimistic: totalSaved * 0.95 },
    { month: 'Aug', projection: totalSaved * 1.25, optimistic: totalSaved * 1.4, pessimistic: totalSaved * 1.05 },
    { month: 'Sep', projection: totalSaved * 1.4, optimistic: totalSaved * 1.6, pessimistic: totalSaved * 1.15 },
  ]

  const recommendations = [
    { icon: Clock, text: 'Increase daily contribution by \u20A65,000 to meet Q3 target', color: '#2E7D32' },
    { icon: Target, text: totalMissed > 3 ? 'You\'ve missed {totalMissed} days. Set up auto-save to stay consistent.' : 'Great consistency! Consider increasing your target.', color: totalMissed > 3 ? '#F59E0B' : '#16A34A' },
    { icon: TrendingUp, text: 'Allocate 20% of monthly profits to emergency reserve', color: '#1A56FF' },
  ]

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <BlurView intensity={55} tint="light" style={[styles.headerBlur, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.7} onPress={() => router.push('/recapitalization')}>
            <GoonaIcon icon={ArrowLeft} size={20} color="#1F2937" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Readiness Report</Text>
            <Text style={styles.headerSub}>Production readiness and insights</Text>
          </View>
        </View>
      </BlurView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: insets.top + 90, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Overall Progress */}
        <Animated.View entering={FadeInDown.duration(400).springify()} style={styles.progressCard}>
          <LinearGradient colors={['#2E7D32', '#1B5E20']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.progressGrad}>
            <Text style={styles.progressLabel}>Production Readiness</Text>
            <Text style={styles.progressPercent}>{Math.round(overallProgress * 100)}%</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${overallProgress * 100}%` }]} />
            </View>
            <View style={styles.progressMeta}>
              <Text style={styles.progressSaved}>{formatCurrency(totalSaved)} recapt</Text>
              <Text style={styles.progressTarget}>Target: {formatCurrency(totalTarget)}</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Consistency Metrics */}
        <Animated.View entering={FadeInDown.duration(400).delay(50).springify()} style={styles.metricsRow}>
          <View style={[styles.metricCard, { backgroundColor: '#F0FDF4' }]}>
            <Text style={[styles.metricValue, { color: '#166534' }]}>{consistencyRate}%</Text>
            <Text style={[styles.metricLabel, { color: '#16A34A' }]}>Consistency</Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: '#FFFBEB' }]}>
            <Text style={[styles.metricValue, { color: '#92400E' }]}>{streak}d</Text>
            <Text style={[styles.metricLabel, { color: '#F59E0B' }]}>Streak</Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: '#FFF1F2' }]}>
            <Text style={[styles.metricValue, { color: '#991B1B' }]}>{totalMissed}</Text>
            <Text style={[styles.metricLabel, { color: '#EF4444' }]}>Missed</Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: '#EEF3FF' }]}>
            <Text style={[styles.metricValue, { color: '#1E40AF' }]}>{stats.exceeded}</Text>
            <Text style={[styles.metricLabel, { color: '#1A56FF' }]}>Exceeded</Text>
          </View>
        </Animated.View>

        {/* Production Goals */}
        <Animated.View entering={FadeInDown.duration(400).delay(100).springify()} style={styles.card}>
          <View style={styles.cardHead}>
            <Text style={styles.cardTitle}>Production Goals</Text>
          </View>
          {PRODUCTION_GOALS.map((goal, i) => (
            <View key={goal.title} style={[styles.goalRow, i === PRODUCTION_GOALS.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={styles.goalTop}>
                <View style={styles.goalTitleRow}>
                  <View style={[styles.goalDot, { backgroundColor: goal.color }]} />
                  <Text style={styles.goalTitle}>{goal.title}</Text>
                </View>
                <Text style={styles.goalPercent}>{Math.round(goal.progress * 100)}%</Text>
              </View>
              <View style={styles.goalTrack}>
                <View style={[styles.goalFill, { width: `${goal.progress * 100}%`, backgroundColor: goal.color }]} />
              </View>
              <View style={styles.goalMeta}>
                <Text style={styles.goalSaved}>{goal.saved} saved</Text>
                <Text style={styles.goalTarget}>Target: {goal.target}</Text>
                <Text style={styles.goalTimeline}>{goal.timeline}</Text>
              </View>
            </View>
          ))}
        </Animated.View>

        {/* GOONA IQ Insights */}
        {insights.length > 0 && (
          <Animated.View entering={FadeInDown.duration(400).delay(150).springify()} style={styles.insightCard}>
            <View style={styles.cardHead}>
              <View style={styles.insightTitleRow}>
                <GoonaIcon icon={Lightbulb} size={16} color="#F59E0B" />
                <Text style={styles.cardTitle}>GOONA IQ Insights</Text>
              </View>
            </View>
            {insights.map((msg, i) => (
              <View key={i} style={styles.insightRow}>
                <GoonaIcon icon={msg.includes('missed') || msg.includes('Missed') ? AlertTriangle : CheckCircle} size={14} color={msg.includes('missed') || msg.includes('Missed') ? '#F59E0B' : '#16A34A'} />
                <Text style={styles.insightText}>{msg}</Text>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Forecast */}
        <Animated.View entering={FadeInDown.duration(400).delay(200).springify()} style={styles.card}>
          <View style={styles.cardHead}>
            <View style={styles.insightTitleRow}>
              <GoonaIcon icon={BarChart} size={16} color="#1A56FF" />
              <Text style={styles.cardTitle}>Forecast</Text>
            </View>
          </View>
          <View style={styles.forecastTable}>
            <View style={styles.forecastHeader}>
              <Text style={styles.forecastHeaderText}>Month</Text>
              <Text style={styles.forecastHeaderText}>Projected</Text>
              <Text style={styles.forecastHeaderText}>Optimistic</Text>
              <Text style={styles.forecastHeaderText}>Pessimistic</Text>
            </View>
            {forecast.map((f, i) => (
              <View key={f.month} style={[styles.forecastRow, i === forecast.length - 1 && { borderBottomWidth: 0 }]}>
                <Text style={styles.forecastMonth}>{f.month}</Text>
                <Text style={styles.forecastValue}>{formatCurrency(Math.round(f.projection))}</Text>
                <Text style={[styles.forecastValue, { color: '#16A34A' }]}>{formatCurrency(Math.round(f.optimistic))}</Text>
                <Text style={[styles.forecastValue, { color: '#EF4444' }]}>{formatCurrency(Math.round(f.pessimistic))}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Recommendations */}
        <Animated.View entering={FadeInDown.duration(400).delay(250).springify()} style={styles.card}>
          <View style={styles.cardHead}>
            <View style={styles.insightTitleRow}>
              <GoonaIcon icon={Award} size={16} color="#2E7D32" />
              <Text style={styles.cardTitle}>Recommendations</Text>
            </View>
          </View>
          {recommendations.map((rec, i) => (
            <View key={i} style={styles.recRow}>
              <View style={[styles.recIcon, { backgroundColor: rec.color + '15' }]}>
                <GoonaIcon icon={rec.icon} size={16} color={rec.color} />
              </View>
              <Text style={styles.recText}>{rec.text}</Text>
            </View>
          ))}
        </Animated.View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAF7' },
  headerBlur: { position: 'absolute', left: 0, right: 0, zIndex: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.04)', paddingBottom: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20 },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 14, elevation: 3 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1B1B1B' },
  headerSub: { fontSize: 13, color: '#94A3B8', marginTop: 1 },
  scroll: { flex: 1 },
  progressCard: { borderRadius: 24, marginBottom: 16, overflow: 'hidden', shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 24, elevation: 6 },
  progressGrad: { padding: 24 },
  progressLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  progressPercent: { fontSize: 48, fontWeight: '800', color: '#FFFFFF', marginVertical: 8 },
  progressTrack: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 100, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', backgroundColor: '#AEEA00', borderRadius: 100 },
  progressMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  progressSaved: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  progressTarget: { fontSize: 14, color: 'rgba(255,255,255,0.6)' },
  metricsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  metricCard: { flex: 1, borderRadius: 14, padding: 12, alignItems: 'center' },
  metricValue: { fontSize: 20, fontWeight: '800' },
  metricLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  card: { backgroundColor: 'white', borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  insightCard: { backgroundColor: '#FFFBEB', borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#FDE68A' },
  insightTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  insightRow: { flexDirection: 'row', gap: 10, paddingVertical: 8, alignItems: 'flex-start' },
  insightText: { fontSize: 13, color: '#92400E', flex: 1, lineHeight: 18 },
  goalRow: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  goalTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  goalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  goalDot: { width: 10, height: 10, borderRadius: 5 },
  goalTitle: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  goalPercent: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  goalTrack: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  goalFill: { height: '100%', borderRadius: 3 },
  goalMeta: { flexDirection: 'row', gap: 12 },
  goalSaved: { fontSize: 12, fontWeight: '600', color: '#16A34A' },
  goalTarget: { fontSize: 12, color: '#64748B' },
  goalTimeline: { fontSize: 12, color: '#94A3B8', marginLeft: 'auto' },
  forecastTable: { gap: 0 },
  forecastHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  forecastHeaderText: { fontSize: 12, fontWeight: '700', color: '#64748B', flex: 1, textAlign: 'center' },
  forecastRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  forecastMonth: { fontSize: 14, fontWeight: '700', color: '#1F2937', flex: 1, textAlign: 'center' },
  forecastValue: { fontSize: 13, fontWeight: '600', color: '#64748B', flex: 1, textAlign: 'center' },
  recRow: { flexDirection: 'row', gap: 12, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  recIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  recText: { flex: 1, fontSize: 13, color: '#4B5563', lineHeight: 18 },
})
