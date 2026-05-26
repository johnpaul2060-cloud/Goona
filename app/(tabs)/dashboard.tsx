import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import GoonaIcon from '../../components/ui/GoonaIcon';
import { Bell, BarChart3, ClipboardList, Sparkles, FileText, Receipt, Award, ShoppingCart } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import BottomDock from '../../components/navigation/BottomDock';
import { useBatchStore } from '../../store/useBatchStore';

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

export default function DashboardScreen() {
  const router = useRouter();
  const batches = useBatchStore((s) => s.batches)
  const pressScales = [usePressScale(), usePressScale(), usePressScale(), usePressScale()]
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.blob} pointerEvents="none" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollInner}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.greeting}>
          <View>
            <Text style={styles.greetingSub}>Good Morning 👋</Text>
            <Text style={styles.greetingName}>James</Text>
            <Text style={styles.greetingStatus}>Your farm is performing well today.</Text>
          </View>
          <TouchableOpacity style={styles.notifBtn} onPress={() => router.push('/notifications')}>
            <GoonaIcon icon={Bell} size={22} color="#1F2937" />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroHead}>
            <View>
              <Text style={styles.heroLabel}>ACTIVE FARM</Text>
              <Text style={styles.heroFarmName}>Green Valley Poultry</Text>
            </View>
            <TouchableOpacity style={styles.heroChartBtn}>
              <GoonaIcon icon={BarChart3} size={22} color="#FFFFFF" />
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
        </View>

        <View style={styles.secHead}>
          <Text style={styles.secTitle}>Quick Actions</Text>
        </View>

        <View style={styles.actionsGrid}>
          {[
            { label: 'Record Sale', color: '#F0FDF4', iconColor: '#16A34A', route: '/(tabs)/records/sales' as any, params: { openAddSale: 'true' }, icon: (c: string) => <GoonaIcon icon={ShoppingCart} size={24} color={c} /> },
            { label: 'Farm Expenses', color: '#FFF1F2', iconColor: '#EF4444', route: '/(tabs)/records/expenses' as const, icon: (c: string) => <GoonaIcon icon={Receipt} size={24} color={c} /> },
            { label: 'Daily Records', color: '#EEF3FF', iconColor: '#1A56FF', route: '/(tabs)/records/daily-operations' as const, icon: (c: string) => <GoonaIcon icon={ClipboardList} size={24} color={c} /> },
            { label: 'Daily Challenge', color: '#F0FDF4', iconColor: '#16A34A', route: '/academy/daily-challenge' as const, icon: (c: string) => <GoonaIcon icon={Award} size={24} color={c} /> },
          ].map((a: any, i) => {
            const p = pressScales[i]
            return (
              <Animated.View key={i} style={[p.style, { position: 'relative' }]}>
                <TouchableOpacity
                  style={[styles.actionCard]}
                  activeOpacity={0.9}
                  onPress={() => router.push({ pathname: a.route, params: a.params })}
                  onPressIn={p.onPressIn}
                  onPressOut={p.onPressOut}
                >
                  <View style={[styles.actionIcon, { backgroundColor: a.color }]}>
                    {a.icon(a.iconColor)}
                  </View>
                  <Text style={styles.actionLabel}>{a.label}</Text>
                </TouchableOpacity>
              </Animated.View>
            )
          })}
        </View>

        <View style={styles.secHead}>
          <Text style={styles.secTitle}>Farm Analytics</Text>
          <TouchableOpacity><Text style={styles.secLink}>View All</Text></TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.analyticsScroll}>
          {[
            { metric: '1,250kg', label: 'Feed Usage', trend: '↑ +12%', trendColor: '#16A34A', bars: [40, 55, 70, 50, 80], barColor: '#16A34A' },
            { metric: '1.8%', label: 'Mortality Rate', trend: '↓ -0.4%', trendColor: '#16A34A', bars: [70, 55, 45, 35, 30], barColor: '#EF4444' },
            { metric: '8,420', label: 'Egg Production', trend: '↑ +18%', trendColor: '#16A34A', bars: [30, 45, 55, 70, 85], barColor: '#F59E0B' },
            { metric: '₦480k', label: 'Expenses', trend: '↑ +6%', trendColor: '#EF4444', bars: [40, 55, 50, 65, 75], barColor: '#1A56FF' },
          ].map((a, i) => (
            <View key={i} style={styles.analyticsCard}>
              <Text style={styles.analyticsMetric}>{a.metric}</Text>
              <Text style={styles.analyticsLabel}>{a.label}</Text>
              <Text style={[styles.analyticsTrend, { color: a.trendColor }]}>{a.trend}</Text>
              <View style={styles.miniChart}>
                {a.bars.map((h, j) => (
                  <View key={j} style={[styles.miniBar, { height: `${h}%`, backgroundColor: j === a.bars.length - 1 ? a.barColor : '#E2E8E0' }]} />
                ))}
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.secHead}>
          <Text style={styles.secTitle}>Active Batches</Text>
          <TouchableOpacity onPress={() => router.push('/batches')}><Text style={styles.secLink}>See All</Text></TouchableOpacity>
        </View>

        {batches.slice(0, 2).map((b) => {
          const prog = computeProgress(b.startDate, b.duration)
          const badgeClr = prog > 80 ? '#F59E0B' : prog > 40 ? '#16A34A' : '#1A56FF'
          const badgeBg = prog > 80 ? '#FFFBEB' : prog > 40 ? '#F0FDF4' : '#EEF3FF'
          const badgeTxt = prog > 80 ? 'Near Harvest' : prog > 40 ? 'Active' : 'Early Stage'
          const borderClr = prog > 80 ? '#F59E0B' : '#16A34A'
          const weeks = weeksSince(b.startDate)
          const totalW = parseWeeks(b.duration)
          return (
          <TouchableOpacity
            key={b.id}
            style={[styles.batchCard, { borderLeftColor: borderClr }]}
            activeOpacity={0.85}
            onPress={() => router.push({ pathname: '/batch-details/[id]', params: { id: b.id } })}
          >
            <View style={styles.batchTop}>
              <Text style={styles.batchName}>{b.batchName}</Text>
              <View style={[styles.batchBadge, { backgroundColor: badgeBg }]}>
                <Text style={[styles.batchBadgeText, { color: badgeClr }]}>{badgeTxt}</Text>
              </View>
            </View>
            <View style={styles.batchDetails}>
              <View><Text style={styles.batchDetailLbl}>Type</Text><Text style={styles.batchDetailVal}>{b.livestockType}</Text></View>
              <View><Text style={styles.batchDetailLbl}>Birds</Text><Text style={styles.batchDetailVal}>{b.quantity}</Text></View>
              <View><Text style={styles.batchDetailLbl}>Week</Text><Text style={styles.batchDetailVal}>{Math.min(weeks + 1, totalW)}/{totalW}</Text></View>
            </View>
            <View style={styles.batchProgress}>
              <View style={styles.batchProgHead}>
                <Text style={{ fontSize: 11, color: '#94A3B8' }}>Feed Cycle Progress</Text>
                <Text style={{ fontSize: 11, color: '#94A3B8' }}>{prog}%</Text>
              </View>
              <View style={styles.batchProgTrack}>
                <View style={[styles.batchProgFill, { width: `${prog}%`, backgroundColor: borderClr }]} />
              </View>
            </View>
          </TouchableOpacity>
          )
        })}

        <View style={styles.secHead}>
          <Text style={styles.secTitle}>Smart Insights</Text>
        </View>

        <TouchableOpacity style={styles.insightCard} activeOpacity={0.8}>
          <View style={styles.insightIconBig}>
            <GoonaIcon icon={Sparkles} size={22} color="#F9A825" />
          </View>
          <View style={styles.insightBody}>
            <Text style={styles.insightText}>
              Mortality has reduced by <Text style={{ fontWeight: '700' }}>12%</Text> this month. Your feeding consistency is improving.
            </Text>
            <Text style={styles.insightCta}>View Insights →</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.secHead}>
          <Text style={styles.secTitle}>Recent Activity</Text>
          <TouchableOpacity><Text style={styles.secLink}>View all</Text></TouchableOpacity>
        </View>

        <View style={styles.feedCard}>
          {[
            { icon: '#F0FDF4', iconColor: '#16A34A', title: 'Fed Layer Farm Batch A', desc: '8 bags of grower feed', time: '8:30 AM' },
            { icon: '#EEF3FF', iconColor: '#1A56FF', title: 'Vaccination Recorded', desc: 'Newcastle vaccine given to 420 broilers', time: '7:15 AM' },
            { icon: '#FFFBEB', iconColor: '#F59E0B', title: 'Eggs Collected', desc: '12 crates — 360 eggs collected', time: 'Yesterday' },
            { icon: '#F0FDF4', iconColor: '#16A34A', title: 'Staff Attendance', desc: '8 of 10 workers checked in', time: 'Yesterday' },
          ].map((f, i) => (
            <TouchableOpacity key={i} style={styles.feedRow} activeOpacity={0.7}>
              <View style={[styles.feedIcon, { backgroundColor: f.icon }]}>
                <GoonaIcon icon={FileText} size={18} color={f.iconColor} />
              </View>
              <View style={styles.feedInfo}>
                <Text style={styles.feedTitle}>{f.title}</Text>
                <Text style={styles.feedDesc}>{f.desc}</Text>
              </View>
              <Text style={styles.feedTime}>{f.time}</Text>
            </TouchableOpacity>
          ))}
        </View>

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
  notifDot: { position: 'absolute', top: 10, right: 10, width: 10, height: 10, borderRadius: 5, backgroundColor: '#16A34A', borderWidth: 2, borderColor: 'white' },
  heroCard: {
    backgroundColor: '#2E7D32', borderRadius: 30, padding: 24, marginTop: 18, overflow: 'hidden',
    shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 18 }, shadowOpacity: 0.25, shadowRadius: 40, elevation: 8,
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
  heroProgress: { marginTop: 20, zIndex: 1 },
  heroProgHead: { flexDirection: 'row', justifyContent: 'space-between' },
  heroProgTrack: { height: 8, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 100, marginTop: 6, overflow: 'hidden' },
  heroProgFill: { height: '100%', width: '72%', borderRadius: 100, backgroundColor: '#AEEA00' },
  secHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 14, zIndex: 5 },
  secTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  secLink: { fontSize: 13, fontWeight: '500', color: '#2E7D32' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, zIndex: 5 },
  actionCard: {
    width: (width - 64) / 2, backgroundColor: 'white', borderRadius: 22, padding: 20,
    alignItems: 'center',
    shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08, shadowRadius: 24, elevation: 4,
    borderWidth: 1, borderColor: 'rgba(46,125,50,0.06)',
  },
  actionIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  actionLabel: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
  analyticsScroll: { paddingBottom: 4, zIndex: 5 },
  analyticsCard: {
    minWidth: 150, backgroundColor: 'white', borderRadius: 22, padding: 16,
    marginRight: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05, shadowRadius: 20, elevation: 2,
  },
  analyticsMetric: { fontSize: 22, fontWeight: '800', color: '#1F2937', marginTop: 0 },
  analyticsLabel: { fontSize: 12, color: '#64748B', marginTop: 1 },
  analyticsTrend: { fontSize: 11, fontWeight: '600', marginTop: 6 },
  miniChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 28, marginTop: 8 },
  miniBar: { width: 6, borderRadius: 2 },
  batchCard: {
    backgroundColor: 'white', borderRadius: 24, padding: 18, marginBottom: 12,
    borderLeftWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05, shadowRadius: 20, elevation: 2,
  },
  batchTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  batchName: { fontSize: 17, fontWeight: '700', color: '#1F2937' },
  batchBadge: { paddingHorizontal: 12, paddingVertical: 3, borderRadius: 100 },
  batchBadgeText: { fontSize: 11, fontWeight: '600' },
  batchDetails: { flexDirection: 'row', gap: 20, marginTop: 10 },
  batchDetailLbl: { fontSize: 11, color: '#94A3B8' },
  batchDetailVal: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  batchProgress: { marginTop: 12 },
  batchProgHead: { flexDirection: 'row', justifyContent: 'space-between' },
  batchProgTrack: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 100, marginTop: 4, overflow: 'hidden' },
  batchProgFill: { height: '100%', borderRadius: 100 },
  insightCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    backgroundColor: '#E8F5E9', borderRadius: 24, padding: 18,
    shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 1,
  },
  insightIconBig: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: 'white',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },
  insightBody: { flex: 1 },
  insightText: { fontSize: 13, lineHeight: 20, color: '#1F2937' },
  insightCta: { fontSize: 12, fontWeight: '600', color: '#2E7D32', marginTop: 6 },
  feedCard: { backgroundColor: 'white', borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 16, elevation: 2 },
  feedRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  feedIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  feedInfo: { flex: 1, minWidth: 0 },
  feedTitle: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  feedDesc: { fontSize: 12, color: '#64748B', marginTop: 1 },
  feedTime: { fontSize: 11, color: '#94A3B8', flexShrink: 0 },
});


