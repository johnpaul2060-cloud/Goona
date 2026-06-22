import { useState } from 'react'
import {
  View, Text, ScrollView,
  StyleSheet, useWindowDimensions,
} from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import GoonaIcon from '../../../components/ui/GoonaIcon'
import { Icons } from '../../../shared/icons'
import Animated, { FadeInUp } from 'react-native-reanimated'
import { Pressable } from 'react-native'
import BottomDock from '../../../components/navigation/BottomDock'

const METRICS = [
  { label: 'Avg Mortality Rate', value: '2.1%', trend: '-0.3%', up: true, icon: Icons.skull, color: '#EF4444', bg: '#FFF1F2' },
  { label: 'Feed Efficiency', value: '86%', trend: '+4%', up: true, icon: Icons.wheat, color: '#16A34A', bg: '#F0FDF4' },
  { label: 'Revenue Trend', value: '+18%', trend: '+6%', up: true, icon: Icons.trendingUp, color: '#F59E0B', bg: '#FFFBEB' },
  { label: 'Prod. Performance', value: '92%', trend: '+2%', up: true, icon: Icons.activity, color: '#1A56FF', bg: '#EEF3FF' },
]

const BATCH_COMPARISON = [
  { name: 'Broiler Batch A', birds: 420, mortality: '1.8%', feedEff: '84%', revenue: '₦2.4M', color: '#16A34A' },
  { name: 'Layer Batch B', birds: 350, mortality: '2.3%', feedEff: '79%', revenue: '₦1.8M', color: '#1A56FF' },
  { name: 'Broiler Cycle 2', birds: 280, mortality: '1.5%', feedEff: '91%', revenue: '₦1.6M', color: '#F59E0B' },
]

const WORKER_PROD = [
  { task: 'Feeding', rate: '95%', icon: Icons.wheat },
  { task: 'Cleaning', rate: '88%', icon: Icons.activity },
  { task: 'Medication', rate: '92%', icon: Icons.shieldCheck },
  { task: 'Harvesting', rate: '78%', icon: Icons.egg },
]

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets()
  const { width: SCREEN_W } = useWindowDimensions()
  const CARD_W = (SCREEN_W - 52) / 2 - 4

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollInner, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInUp.duration(500).springify()} style={styles.topNav}>
          <Pressable
            style={styles.navBack}
            onPress={() => router.canGoBack() ? router.back() : router.replace('/records' as any)}
          >
            <GoonaIcon icon={Icons.arrowLeft} size={24} color="#1B1B1B" />
          </Pressable>
          <Text style={styles.topTitle}>Analytics</Text>
          <Pressable style={styles.navBtn}>
            <GoonaIcon icon={Icons.barChart3} size={20} color="#1F2937" />
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(80).springify()} style={styles.headerSection}>
          <Text style={styles.headerLabel}>Operational Analytics</Text>
          <Text style={styles.headerTitle}>Data-Driven{"\n"}Farm Insights</Text>
          <Text style={styles.headerSub}>Mortality, feed efficiency, revenue trends, and operational performance across all batches.</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(120).springify()} style={styles.metricsGrid}>
          {METRICS.map((m, i) => (
            <Animated.View
              key={m.label}
              entering={FadeInUp.duration(400).delay(160 + i * 60).springify()}
              style={[styles.metricCard, { width: CARD_W }]}
            >
              <View style={[styles.metricIcon, { backgroundColor: m.bg }]}>
                <GoonaIcon icon={m.icon} size={16} color={m.color} />
              </View>
              <Text style={styles.metricValue}>{m.value}</Text>
              <Text style={styles.metricLabel}>{m.label}</Text>
              <View style={styles.metricTrendRow}>
                <GoonaIcon icon={m.up ? Icons.trendingUp : Icons.trendingDown} size={11} color={m.up ? '#16A34A' : '#EF4444'} />
                <Text style={[styles.metricTrend, { color: m.up ? '#16A34A' : '#EF4444' }]}>{m.trend}</Text>
              </View>
            </Animated.View>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(300).springify()} style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Batch Comparison</Text>
        </Animated.View>
        {BATCH_COMPARISON.map((b, i) => (
          <Animated.View
            key={b.name}
            entering={FadeInUp.duration(400).delay(340 + i * 70).springify()}
            style={styles.batchRow}
          >
            <View style={[styles.batchDot, { backgroundColor: b.color }]} />
            <View style={styles.batchInfo}>
              <Text style={styles.batchName}>{b.name}</Text>
              <Text style={styles.batchStats}>{b.birds} birds · {b.mortality} mortality · {b.feedEff} feed eff</Text>
            </View>
            <Text style={styles.batchRevenue}>{b.revenue}</Text>
          </Animated.View>
        ))}

        <Animated.View entering={FadeInUp.duration(500).delay(420).springify()} style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Worker Productivity</Text>
        </Animated.View>
        <View style={styles.prodGrid}>
          {WORKER_PROD.map((w, i) => (
            <Animated.View
              key={w.task}
              entering={FadeInUp.duration(400).delay(460 + i * 60).springify()}
              style={styles.prodCard}
            >
              <GoonaIcon icon={w.icon} size={18} color="#1F2937" />
              <Text style={styles.prodTask}>{w.task}</Text>
              <Text style={styles.prodRate}>{w.rate}</Text>
            </Animated.View>
          ))}
        </View>

        <Animated.View entering={FadeInUp.duration(500).delay(520).springify()}>
          <Pressable style={styles.insightCard} onPress={() => router.push('/goona-iq' as any)}>
            <View style={styles.insightHeader}>
              <GoonaIcon icon={Icons.sparkles} size={16} color="#2E7D32" />
              <Text style={styles.insightTitle}>GOONA IQ Forecast</Text>
            </View>
            <Text style={styles.insightText}>
              Mortality trend is declining across all batches. Feed efficiency improved 4% this cycle. Revenue projection for Q3 is ₦8.2M based on current batch performance. Consider adjusting feed ratios for optimal growth.
            </Text>
            <Text style={styles.insightFooter}>Tap for full GOONA IQ analysis</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>

      <BottomDock />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF7',
  },
  scroll: {
    flex: 1,
  },
  scrollInner: {
    paddingBottom: 160,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 52,
  },
  navBack: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B1B1B',
    letterSpacing: -0.3,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  headerLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2E7D32',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1B1B1B',
    letterSpacing: -0.8,
    lineHeight: 34,
  },
  headerSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 10,
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1B1B1B',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
  },
  metricTrendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricTrend: {
    fontSize: 11,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1B1B1B',
  },
  batchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  batchDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  batchInfo: {
    flex: 1,
    gap: 2,
  },
  batchName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1B1B1B',
  },
  batchStats: {
    fontSize: 12,
    color: '#94A3B8',
  },
  batchRevenue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1B1B1B',
  },
  prodGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
  },
  prodCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  prodTask: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  prodRate: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1B1B1B',
  },
  insightCard: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
    backgroundColor: '#F0FDF4',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(46,125,50,0.12)',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  insightTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1B5E20',
  },
  insightText: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
  },
  insightFooter: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8,
  },
})

