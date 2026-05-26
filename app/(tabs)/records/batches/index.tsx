import { useState } from 'react'
import {
  View, Text, ScrollView,
  StyleSheet, useWindowDimensions,
} from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import GoonaIcon from '../../../../components/ui/GoonaIcon'
import { ArrowLeft, Search, Plus, TrendingUp, Users, AlertCircle, ShieldCheck, Egg, Wheat, Sparkles, Clock, Calendar, BarChart3, FileText, ClipboardList } from 'lucide-react-native'
import Animated, { FadeInUp } from 'react-native-reanimated'
import { Pressable } from 'react-native'
import BottomDock from '../../../../components/navigation/BottomDock'
import { useBatchStore } from '../../../../store/useBatchStore'

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

function getBadge(progress: number): { text: string; bg: string; color: string } {
  if (progress > 85) return { text: 'Near Harvest', bg: '#FFFBEB', color: '#F59E0B' }
  if (progress > 50) return { text: 'Healthy', bg: '#F0FDF4', color: '#16A34A' }
  if (progress > 20) return { text: 'Active', bg: '#F0FDF4', color: '#16A34A' }
  return { text: 'Just Started', bg: '#EEF3FF', color: '#1A56FF' }
}

const QUICK_ACTIONS = [
  { label: 'New Batch', icon: Plus, bg: '#F0FDF4', color: '#16A34A', route: '/create-batch' },
  { label: 'Records', icon: ClipboardList, bg: '#EEF3FF', color: '#1A56FF', route: '/daily-records' },
  { label: 'Reports', icon: BarChart3, bg: '#FFFBEB', color: '#F59E0B', route: '/batches' },
  { label: 'Feed', icon: Wheat, bg: '#F5F3FF', color: '#7C3AED', route: '/daily-records' },
]

export default function BatchManagementScreen() {
  const insets = useSafeAreaInsets()
  const { width: SCREEN_W } = useWindowDimensions()
  const QA_W = (SCREEN_W - 52) / 4 - 4
  const CARD_W = (SCREEN_W - 52) / 2 - 4
  const batches = useBatchStore((s) => s.batches)
  const active = batches.filter((b) => b.status === 'active')
  const totalBirds = active.reduce((sum, b) => sum + b.quantity, 0)
  const avgProgress = active.length > 0 ? Math.round(active.reduce((sum, b) => sum + computeProgress(b.startDate, b.duration), 0) / active.length) : 0

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
            onPress={() => router.replace('/(tabs)/records' as any)}
          >
            <GoonaIcon icon={ArrowLeft} size={24} color="#1B1B1B" />
          </Pressable>
          <Text style={styles.topTitle}>Batch Management</Text>
          <Pressable style={styles.navBtn}>
            <GoonaIcon icon={Search} size={20} color="#1F2937" />
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(80).springify()} style={styles.headerSection}>
          <Text style={styles.headerLabel}>Production Cycles</Text>
          <Text style={styles.headerTitle}>Manage{"\n"}All Batches</Text>
          <Text style={styles.headerSub}>{active.length} active batches · {totalBirds} total birds · {avgProgress}% average progress</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(120).springify()} style={styles.overviewGrid}>
          <View style={[styles.overviewCard, { backgroundColor: '#F0FDF4', width: CARD_W }]}>
            <GoonaIcon icon={Egg} size={18} color="#16A34A" />
            <Text style={styles.ovValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{active.length}</Text>
            <Text style={styles.ovLabel}>Active</Text>
          </View>
          <View style={[styles.overviewCard, { backgroundColor: '#EEF3FF', width: CARD_W }]}>
            <GoonaIcon icon={Users} size={18} color="#1A56FF" />
            <Text style={styles.ovValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{totalBirds.toLocaleString()}</Text>
            <Text style={styles.ovLabel}>Birds</Text>
          </View>
          <View style={[styles.overviewCard, { backgroundColor: '#FFFBEB', width: CARD_W }]}>
            <GoonaIcon icon={TrendingUp} size={18} color="#F59E0B" />
            <Text style={styles.ovValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{avgProgress}%</Text>
            <Text style={styles.ovLabel}>Avg Progress</Text>
          </View>
          <View style={[styles.overviewCard, { backgroundColor: '#F5F3FF', width: CARD_W }]}>
            <GoonaIcon icon={ShieldCheck} size={18} color="#7C3AED" />
            <Text style={styles.ovValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{active.filter((b) => computeProgress(b.startDate, b.duration) < 85).length}</Text>
            <Text style={styles.ovLabel}>Healthy</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(180).springify()} style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </Animated.View>

        <View style={styles.qaGrid}>
          {QUICK_ACTIONS.map((qa, i) => (
            <Animated.View
              key={qa.label}
              entering={FadeInUp.duration(400).delay(220 + i * 60).springify()}
              style={{ width: QA_W }}
            >
              <Pressable
                style={[styles.qaCard, { backgroundColor: qa.bg }]}
                onPress={() => router.push(qa.route as any)}
              >
                <GoonaIcon icon={qa.icon} size={22} color={qa.color} />
                <Text style={[styles.qaLabel, { color: qa.color }]}>{qa.label}</Text>
              </Pressable>
            </Animated.View>
          ))}
        </View>

        <Animated.View entering={FadeInUp.duration(500).delay(360).springify()} style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Batches</Text>
          <Pressable onPress={() => router.push('/(tabs)/batches' as any)}>
            <Text style={styles.sectionAction}>See All</Text>
          </Pressable>
        </Animated.View>

        {active.length === 0 && (
          <Animated.View entering={FadeInUp.duration(400).delay(400).springify()} style={styles.emptyState}>
            <GoonaIcon icon={ClipboardList} size={40} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Active Batches</Text>
            <Text style={styles.emptyDesc}>Create your first production batch to start tracking.</Text>
            <Pressable
              style={styles.emptyCta}
              onPress={() => router.push('/create-batch' as any)}
            >
              <GoonaIcon icon={Plus} size={18} color="#FFF" />
              <Text style={styles.emptyCtaText}>Create Batch</Text>
            </Pressable>
          </Animated.View>
        )}

        {active.map((batch, i) => {
          const prog = computeProgress(batch.startDate, batch.duration)
          const badge = getBadge(prog)
          const weeks = weeksSince(batch.startDate)
          const totalW = parseWeeks(batch.duration)
          return (
            <Animated.View
              key={batch.id}
              entering={FadeInUp.duration(400).delay(400 + i * 80).springify()}
            >
              <Pressable
                style={[styles.batchCard, { borderLeftColor: badge.color }]}
                onPress={() => router.push({ pathname: '/batch-details/[id]', params: { id: batch.id } } as any)}
              >
                <View style={styles.batchTop}>
                  <View style={styles.batchNameRow}>
                    <GoonaIcon icon={Egg} size={16} color={badge.color} />
                    <Text style={styles.batchName}>{batch.batchName}</Text>
                  </View>
                  <View style={[styles.batchBadge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.batchBadgeText, { color: badge.color }]}>{badge.text}</Text>
                  </View>
                </View>
                <View style={styles.batchMeta}>
                  <View>
                    <Text style={styles.batchMetaLbl}>{batch.livestockType}</Text>
                    <Text style={styles.batchMetaVal}>{batch.quantity.toLocaleString()} birds</Text>
                  </View>
                  <View>
                    <Text style={styles.batchMetaLbl}>Week</Text>
                    <Text style={styles.batchMetaVal}>{Math.min(weeks + 1, totalW)}/{totalW}</Text>
                  </View>
                  <View>
                    <Text style={styles.batchMetaLbl}>Progress</Text>
                    <Text style={styles.batchMetaVal}>{prog}%</Text>
                  </View>
                </View>
                <View style={styles.batchProgressBar}>
                  <View style={[styles.batchProgressFill, { width: `${prog}%`, backgroundColor: badge.color }]} />
                </View>
              </Pressable>
            </Animated.View>
          )
        })}

        <Animated.View entering={FadeInUp.duration(500).delay(500).springify()} style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <GoonaIcon icon={Sparkles} size={16} color="#2E7D32" />
            <Text style={styles.insightTitle}>GOONA IQ Batch Insight</Text>
          </View>
          <Text style={styles.insightText}>
            {active.length > 0
              ? `Batch "${active[0].batchName}" is at ${computeProgress(active[0].startDate, active[0].duration)}% completion. Feed conversion ratio is optimal. Consider preparing for ${computeProgress(active[0].startDate, active[0].duration) > 80 ? 'harvest' : 'next growth phase'}.`
              : 'No active batches to analyze. Start a new batch to receive intelligent production insights.'}
          </Text>
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
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 10,
  },
  overviewCard: {
    borderRadius: 16,
    padding: 14,
    gap: 6,
    alignItems: 'center',
  },
  ovValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1B1B1B',
  },
  ovLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
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
  sectionAction: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2E7D32',
  },
  qaGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
  },
  qaCard: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 8,
  },
  qaLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyState: {
    marginHorizontal: 16,
    padding: 32,
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B1B1B',
  },
  emptyDesc: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
  },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2E7D32',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 8,
  },
  emptyCtaText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  batchCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  batchTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  batchNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  batchName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  batchBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 100,
  },
  batchBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  batchMeta: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 10,
  },
  batchMetaLbl: {
    fontSize: 11,
    color: '#94A3B8',
  },
  batchMetaVal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  batchProgressBar: {
    height: 5,
    backgroundColor: '#F1F5F9',
    borderRadius: 100,
    overflow: 'hidden',
  },
  batchProgressFill: {
    height: '100%',
    borderRadius: 100,
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
})
