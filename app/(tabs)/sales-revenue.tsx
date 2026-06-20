import React, { useEffect } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Dimensions, useWindowDimensions,
} from 'react-native'
import GoonaIcon from '../../components/ui/GoonaIcon'
import { ArrowLeft, Plus, BarChart3, TrendingUp, Sparkles, Calendar, Receipt, ShieldCheck, Users, FileText } from 'lucide-react-native'
import { StatusBar } from 'expo-status-bar'
import { router, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withRepeat,
  withSequence, withTiming, FadeInUp, FadeIn, Easing,
} from 'react-native-reanimated'
import BottomDock from '../../components/navigation/BottomDock'

const { width: SCREEN_W } = Dimensions.get('window')
const CARD_W = (SCREEN_W - 52) / 2

/* ─── Press Scale Hook ─── */
function usePressScale(scaleTo = 0.96) {
  const scale = useSharedValue(1)
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
  return {
    style,
    onPressIn: () => { scale.value = withSpring(scaleTo, { damping: 15, stiffness: 200 }) },
    onPressOut: () => { scale.value = withSpring(1, { damping: 15, stiffness: 200 }) },
  }
}

/* ─── FAB Float Hook ─── */
function useFabFloat() {
  const translateY = useSharedValue(0)
  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
      ),
      -1, true,
    )
  }, [])
  return useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }))
}

export default function SalesRevenueScreen() {
  const insets = useSafeAreaInsets()
  const { width: winW } = useWindowDimensions()
  const cardW = (winW - 52) / 2
  const fabFloat = useFabFloat()
  const backPress = usePressScale()
  const params = useLocalSearchParams<{ openAddSale?: string }>()

  useEffect(() => {
    if (params.openAddSale === 'true') {
      router.replace('/record-sale' as any)
    }
  }, [params.openAddSale])

  const QA_ACTIONS = [
    { label: 'Record Sale', bg: '#F0FDF4', iconColor: '#16A34A', route: '/record-sale' as const },
    { label: 'Expenses', bg: '#FFFBEB', iconColor: '#F59E0B', route: '/(tabs)/records/expenses' as const },
    { label: 'Reports', bg: '#EEF3FF', iconColor: '#1A56FF', route: '/sales-reports' as const },
    { label: 'Invoices', bg: '#F0FDF4', iconColor: '#16A34A', route: undefined },
  ]
  const qaPress = QA_ACTIONS.map(() => usePressScale())

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.glowBg} pointerEvents="none" />
      <View style={styles.contour1} pointerEvents="none" />
      <View style={styles.contour2} pointerEvents="none" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollInner, { paddingTop: insets.top + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* TOP NAV */}
        <Animated.View entering={FadeInUp.duration(500).springify()} style={styles.topNav}>
          <Animated.View style={backPress.style}>
            <TouchableOpacity
              style={styles.navBack}
              activeOpacity={0.7}
               onPress={() => router.canGoBack() ? router.back() : router.replace('/records' as any)}
              onPressIn={backPress.onPressIn}
              onPressOut={backPress.onPressOut}
            >
              <GoonaIcon icon={ArrowLeft} size={24} color="#1B1B1B" />
            </TouchableOpacity>
          </Animated.View>
          <Text style={styles.topTitle}>Sales & Revenue</Text>
          <TouchableOpacity style={styles.chartBtn} activeOpacity={0.8}>
            <GoonaIcon icon={BarChart3} size={20} color="#1F2937" />
          </TouchableOpacity>
        </Animated.View>

        {/* HEADER */}
        <Animated.View entering={FadeInUp.duration(500).delay(80).springify()} style={styles.headerSection}>
          <Text style={styles.headerLabel}>Financial Overview</Text>
          <Text style={styles.headerTitle}>Track Farm{"\n"}Revenue</Text>
            <Text style={styles.headerSub}>Monitor livestock sales, operational expenses, profitability, and reinvestment growth.</Text>
        </Animated.View>

        {/* REVENUE HERO */}
        <Animated.View entering={FadeInUp.duration(500).delay(130).springify()} style={styles.heroCard}>
          <View style={styles.heroDots} pointerEvents="none" />
          <View style={styles.heroGl} pointerEvents="none" />
          <View style={[styles.heroCc, { width: 280, height: 90, top: -10, right: -30 }]} pointerEvents="none" />
          <View style={[styles.heroCc, { width: 200, height: 70, bottom: 10, left: -20 }]} pointerEvents="none" />

          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroLabel}>TOTAL FARM REVENUE</Text>
              <Text style={styles.heroAmount}>₦4.8M</Text>
            </View>
            <View style={styles.heroPill}>
              <Text style={styles.heroPillText}>+18% Growth</Text>
            </View>
          </View>

          <View style={styles.heroMetrics}>
            <View style={styles.heroMetric}>
              <Text style={styles.heroMetricVal}>₦820k</Text>
              <Text style={styles.heroMetricLbl}>Sales This Week</Text>
            </View>
            <View style={styles.heroMetric}>
              <Text style={styles.heroMetricVal}>₦120k</Text>
              <Text style={styles.heroMetricLbl}>Outstanding</Text>
            </View>
            <View style={[styles.heroMetric, styles.heroMetricLast]}>
              <Text style={styles.heroMetricVal}>₦1.4M</Text>
              <Text style={styles.heroMetricLbl}>Net Profit</Text>
            </View>
          </View>

          <View style={styles.heroChart}>
            {[30, 45, 55, 40, 60, 75, 90, 65, 80, 95].map((h, i) => (
              <View key={i} style={[styles.heroBar, { height: `${h}%` as any }]} />
            ))}
          </View>
        </Animated.View>

        {/* QUICK ACTIONS */}
        <Animated.View entering={FadeInUp.duration(500).delay(180).springify()}>
          <View style={styles.secHead}>
            <Text style={styles.secTitle}>Quick Actions</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(200).springify()}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.qaScroll} contentContainerStyle={{ gap: 12 }}>
            {QA_ACTIONS.map((a, i) => {
              const p = qaPress[i]
              return (
                <Animated.View key={a.label} style={p.style}>
                  <TouchableOpacity
                    style={styles.qaCard}
                    activeOpacity={0.85}
                    onPress={() => a.route && router.push(a.route as any)}
                    onPressIn={p.onPressIn}
                    onPressOut={p.onPressOut}
                  >
                    <View style={[styles.qaIcon, { backgroundColor: a.bg }]}>
                      {i === 0 && <GoonaIcon icon={Plus} size={20} color={a.iconColor} />}
                      {i === 1 && <GoonaIcon icon={Calendar} size={20} color={a.iconColor} />}
                      {i === 2 && <GoonaIcon icon={BarChart3} size={20} color={a.iconColor} />}
                      {i === 3 && <GoonaIcon icon={FileText} size={20} color={a.iconColor} />}
                    </View>
                    <Text style={styles.qaLabel}>{a.label}</Text>
                  </TouchableOpacity>
                </Animated.View>
              )
            })}
          </ScrollView>
        </Animated.View>

        {/* SALES ANALYTICS */}
        <Animated.View entering={FadeInUp.duration(500).delay(230).springify()}>
          <View style={styles.secHead}>
            <Text style={styles.secTitle}>Sales Analytics</Text>
            <TouchableOpacity><Text style={styles.secLink}>View Reports</Text></TouchableOpacity>
          </View>
        </Animated.View>

        <View style={styles.analyticsGrid}>
          {[
            { metric: '₦820k', label: 'Weekly Revenue', trend: '↑ +12%', trendColor: '#16A34A', bg: '#F0FDF4', iconColor: '#16A34A', bars: [35, 50, 65, 55, 80], barActive: [2, 4] },
            { metric: '₦480k', label: 'Avg. Batch Profit', trend: '↑ +8%', trendColor: '#16A34A', bg: '#EEF3FF', iconColor: '#1A56FF', bars: [40, 55, 70, 65, 85], barActive: [2, 4] },
            { metric: 'Layer B', label: 'Top Selling Batch', trend: 'Best Performer', trendColor: '#16A34A', bg: '#FFFBEB', iconColor: '#F59E0B', bars: [] },
            { metric: '₦120k', label: 'Pending Expenses', trend: '3 Creditors', trendColor: '#F59E0B', bg: '#FFF1F2', iconColor: '#EF4444', bars: [] },
          ].map((a, i) => (
            <Animated.View key={i} entering={FadeInUp.duration(500).delay(280 + i * 60).springify()} style={styles.analyticsCard}>
              <View style={[styles.anIcon, { backgroundColor: a.bg }]}>
                {i === 0 && <GoonaIcon icon={TrendingUp} size={16} color={a.iconColor} />}
                {i === 1 && <GoonaIcon icon={ShieldCheck} size={16} color={a.iconColor} />}
                {i === 2 && <GoonaIcon icon={Users} size={16} color={a.iconColor} />}
                {i === 3 && <GoonaIcon icon={Receipt} size={16} color={a.iconColor} />}
              </View>
              <Text style={styles.anMetric}>{a.metric}</Text>
              <Text style={styles.anLabel}>{a.label}</Text>
              <Text style={[styles.anTrend, { color: a.trendColor }]}>{a.trend}</Text>
              {a.bars.length > 0 && (
                <View style={styles.miniChart}>
                  {a.bars.map((h, j) => (
                    <View key={j} style={[styles.miniBar, { height: `${h}%` as any, backgroundColor: (a.barActive as number[]).includes(j) ? a.iconColor : '#E2E8E0' }]} />
                  ))}
                </View>
              )}
            </Animated.View>
          ))}
        </View>

        {/* RECENT TRANSACTIONS */}
        <Animated.View entering={FadeInUp.duration(500).delay(350).springify()}>
          <View style={styles.secHead}>
            <Text style={styles.secTitle}>Recent Transactions</Text>
          </View>
        </Animated.View>

        {[
          { name: 'FreshMart Poultry Ltd', amount: '₦320,000', meta: 'Broiler Batch A • Today, 10:42 AM', badge: 'Paid', badgeBg: '#F0FDF4', badgeColor: '#16A34A' },
          { name: 'AgroMax Farms', amount: '₦180,000', meta: 'Layer Batch B • Today, 9:15 AM', badge: 'Pending', badgeBg: '#FFFBEB', badgeColor: '#F59E0B' },
          { name: 'Daily Protein Market', amount: '₦95,000', meta: 'Broiler Batch C • Yesterday, 3:30 PM', badge: 'Paid', badgeBg: '#F0FDF4', badgeColor: '#16A34A' },
        ].map((tx, i) => (
          <Animated.View key={i} entering={FadeInUp.duration(500).delay(380 + i * 60).springify()} style={styles.txCard}>
            <View style={styles.txTop}>
              <Text style={styles.txName}>{tx.name}</Text>
              <Text style={styles.txAmount}>{tx.amount}</Text>
            </View>
            <View style={styles.txBottom}>
              <Text style={styles.txMeta}>{tx.meta}</Text>
              <View style={[styles.txBadge, { backgroundColor: tx.badgeBg }]}>
                <Text style={[styles.txBadgeText, { color: tx.badgeColor }]}>{tx.badge}</Text>
              </View>
            </View>
          </Animated.View>
        ))}

        {/* CUSTOMER INSIGHTS */}
        <Animated.View entering={FadeInUp.duration(500).delay(450).springify()}>
          <View style={styles.secHead}>
            <Text style={styles.secTitle}>Customer Insights</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(480).springify()} style={styles.customerCard}>
          {[
            { initial: 'F', color: '#16A34A', name: 'FreshMart Poultry', spend: '₦320k', spendColor: '#16A34A' },
            { initial: 'A', color: '#1A56FF', name: 'AgroMax Farms', spend: '₦180k', spendColor: '#F59E0B' },
            { initial: 'D', color: '#F59E0B', name: 'Daily Protein Market', spend: '₦95k', spendColor: '#1F2937' },
          ].map((c, i) => (
            <View key={i} style={[styles.custRow, i < 2 && styles.custRowBorder]}>
              <View style={styles.custInfo}>
                <View style={[styles.custAvatar, { backgroundColor: c.color }]}>
                  <Text style={styles.custAvatarText}>{c.initial}</Text>
                </View>
                <Text style={styles.custName}>{c.name}</Text>
              </View>
              <Text style={[styles.custSpend, { color: c.spendColor }]}>{c.spend}</Text>
            </View>
          ))}
          <View style={styles.custChart}>
            {[100, 60, 35].map((h, i) => (
              <View key={i} style={[styles.custBar, { height: `${h}%` as any, backgroundColor: ['#16A34A', '#F59E0B', '#2E7D32'][i] }]} />
            ))}
          </View>
        </Animated.View>

        {/* SMART INSIGHTS */}
        <Animated.View style={{ marginTop: 18 }} entering={FadeInUp.duration(500).delay(600).springify()}>
          <View style={styles.secHead}>
            <Text style={styles.secTitle}>Smart Insights</Text>
          </View>
        </Animated.View>

        {[
          { text: 'Your sales this month have increased by 18% compared to last cycle.', bg: '#E8F5E9', bg2: '#F0FDF4', iconColor: '#F9A825' },
          { text: 'Layer Batch B currently has the highest profitability margin.', bg: '#E3F2FD', bg2: '#EFF6FF', iconColor: '#1A56FF' },
          { text: 'You are projected to fully secure your next production cycle in 3 weeks.', bg: '#FFFBEB', bg2: '#FFF8E1', iconColor: '#F59E0B' },
        ].map((ins, i) => (
          <Animated.View key={i} entering={FadeInUp.duration(500).delay(640 + i * 70).springify()} style={[styles.insightCard, { backgroundColor: ins.bg }]}>
            <View style={styles.insightIcon}>
              <GoonaIcon icon={Sparkles} size={18} color={ins.iconColor} />
            </View>
            <Text style={styles.insightText}>
              {ins.text.split(/(\d+%|\d+ weeks?)/).map((part, j) => (
                /\d/.test(part) ? <Text key={j} style={{ fontWeight: '700', color: '#2E7D32' }}>{part}</Text> : part
              ))}
            </Text>
          </Animated.View>
        ))}

        <View style={{ height: 160 }} />
      </ScrollView>

      {/* FAB */}
      <Animated.View style={[styles.fab, { bottom: insets.bottom + 100 }, fabFloat]}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push('/create-batch')}
          onPressIn={backPress.onPressIn}
          onPressOut={backPress.onPressOut}
          style={styles.fabTouch}
        >
          <GoonaIcon icon={Plus} size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>

      <BottomDock />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAF7' },
  glowBg: { position: 'absolute', top: -50, right: -50, width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(232,245,233,0.3)', zIndex: 0 },
  contour1: { position: 'absolute', top: '5%', left: '-10%', width: 350, height: 110, zIndex: 0, borderWidth: 1, borderColor: 'rgba(46,125,50,0.04)', borderTopLeftRadius: 175, borderTopRightRadius: 175, borderBottomWidth: 0, transform: [{ rotate: '6deg' }] },
  contour2: { position: 'absolute', bottom: '15%', right: '-10%', width: 280, height: 90, zIndex: 0, borderWidth: 1, borderColor: 'rgba(46,125,50,0.04)', borderBottomLeftRadius: 140, borderBottomRightRadius: 140, borderTopWidth: 0, transform: [{ rotate: '-8deg' }] },
  scroll: { flex: 1, zIndex: 1 },
  scrollInner: { paddingHorizontal: 20, paddingTop: 6 },

  /* top nav */
  topNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6 },
  navBack: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  topTitle: { fontWeight: '700', fontSize: 20, color: '#1B1B1B' },
  chartBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 14, elevation: 3 },

  /* header */
  headerSection: { marginTop: 10 },
  headerLabel: { fontSize: 11, fontWeight: '600', color: '#2E7D32', letterSpacing: 2, textTransform: 'uppercase' },
  headerTitle: { fontWeight: '800', fontSize: 32, lineHeight: 40, color: '#1B1B1B', marginTop: 4 },
  headerSub: { fontSize: 14, lineHeight: 24, color: '#616161', marginTop: 4 },

  /* hero card */
  heroCard: { backgroundColor: '#2E7D32', borderRadius: 32, padding: 24, marginTop: 18, overflow: 'hidden', shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.25, shadowRadius: 45, elevation: 8 },
  heroDots: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.04, zIndex: 0 },
  heroGl: { position: 'absolute', top: -20, right: -10, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.08)', pointerEvents: 'none' },
  heroCc: { position: 'absolute', borderRadius: 50, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 1 },
  heroLabel: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.7)', letterSpacing: 1 },
  heroAmount: { fontWeight: '800', fontSize: 36, color: 'white', marginTop: -2, letterSpacing: -1 },
  heroPill: { paddingVertical: 4, paddingHorizontal: 14, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.15)' },
  heroPillText: { fontSize: 11, fontWeight: '600', color: 'white' },
  heroMetrics: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18, zIndex: 1 },
  heroMetric: { flex: 1, alignItems: 'center', borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.1)' },
  heroMetricLast: { borderRightWidth: 0 },
  heroMetricVal: { fontSize: 18, fontWeight: '800', color: 'white' },
  heroMetricLbl: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 1 },
  heroChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 5, height: 40, marginTop: 18, zIndex: 1 },
  heroBar: { flex: 1, borderRadius: 3, backgroundColor: 'rgba(174,234,0,0.5)' },

  /* section */
  secHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 22, marginBottom: 12 },
  secTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  secLink: { fontSize: 13, fontWeight: '500', color: '#2E7D32' },

  /* quick actions */
  qaScroll: { paddingBottom: 4 },
  qaCard: { minWidth: 110, backgroundColor: 'white', borderRadius: 22, paddingVertical: 18, paddingHorizontal: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 2 },
  qaIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  qaLabel: { fontSize: 13, fontWeight: '600', color: '#1F2937' },

  /* analytics */
  analyticsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  analyticsCard: { width: CARD_W, backgroundColor: 'white', borderRadius: 24, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 2 },
  anIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  anMetric: { fontSize: 22, fontWeight: '800', color: '#1F2937', marginTop: 8, letterSpacing: -0.3 },
  anLabel: { fontSize: 11, color: '#64748B', marginTop: 1 },
  anTrend: { fontSize: 11, fontWeight: '600', marginTop: 4 },
  miniChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 24, marginTop: 8 },
  miniBar: { width: 5, borderRadius: 2 },

  /* transactions */
  txCard: { backgroundColor: 'white', borderRadius: 24, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 16, elevation: 2 },
  txTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  txName: { fontSize: 15, fontWeight: '600', color: '#1F2937', flex: 1 },
  txAmount: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  txBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  txMeta: { fontSize: 12, color: '#94A3B8' },
  txBadge: { paddingVertical: 2, paddingHorizontal: 10, borderRadius: 100 },
  txBadgeText: { fontSize: 10, fontWeight: '600' },

  /* customer */
  customerCard: { backgroundColor: 'white', borderRadius: 24, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 2 },
  custRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  custRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  custInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  custAvatar: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  custAvatarText: { fontSize: 12, fontWeight: '700', color: 'white' },
  custName: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  custSpend: { fontSize: 14, fontWeight: '600' },
  custChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 20, marginTop: 12 },
  custBar: { flex: 1, borderRadius: 2 },

  /* insight */
  insightCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, borderRadius: 24, padding: 18, marginBottom: 10 },
  insightIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', flexShrink: 0, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 },
  insightText: { fontSize: 13, lineHeight: 20, color: '#1F2937', flex: 1 },

  /* fab */
  fab: {
    position: 'absolute', right: 20, zIndex: 15,
    shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 30, elevation: 8,
  },
  fabTouch: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#2E7D32',
    alignItems: 'center', justifyContent: 'center',
  },
})


