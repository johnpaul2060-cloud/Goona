import React from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Dimensions,
} from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Circle as SvgCircle } from 'react-native-svg'
import GoonaIcon from '../../../../components/ui/GoonaIcon'
import { Icons } from '../../../../shared/icons'
import Animated, { FadeInUp } from 'react-native-reanimated'
import BottomDock from '../../../../components/navigation/BottomDock'
import { formatNaira } from '../../../../utils/format'

const { width: SCREEN_W } = Dimensions.get('window')

const MONTHLY_BUDGET = 990000
const SPENT = 878000
const REMAINING = MONTHLY_BUDGET - SPENT
const PROJECTED = 945000
const HEALTH_SCORE = 72

const WATCHLIST = [
  { label: 'Feed', status: 'over', spent: 185000, limit: 200000, color: '#EF4444', icon: Icons.package },
  { label: 'Salaries', status: 'at_risk', spent: 540000, limit: 600000, color: '#F59E0B', icon: Icons.users },
  { label: 'Receipts', status: 'at_risk', spent: 28000, limit: 35000, color: '#8B5CF6', icon: Icons.receipt },
]

const WEEKLY_FORECAST = [
  { label: 'Wk 1', value: 210000 },
  { label: 'Wk 2', value: 195000 },
  { label: 'Wk 3', value: 225000 },
  { label: 'Wk 4', value: 240000 },
]

const MAX_FORECAST = Math.max(...WEEKLY_FORECAST.map(w => w.value))

const BREAKDOWN = [
  { label: 'Feed', amount: 185000, pct: 21.1, color: '#16A34A' },
  { label: 'Salaries', amount: 540000, pct: 61.5, color: '#1A56FF' },
  { label: 'Medication', amount: 67000, pct: 7.6, color: '#EF4444' },
  { label: 'Utilities', amount: 28000, pct: 3.2, color: '#8B5CF6' },
  { label: 'Transport', amount: 42500, pct: 4.8, color: '#F59E0B' },
  { label: 'Other', amount: 15500, pct: 1.8, color: '#06B6D4' },
]

const CYCLE_BUDGET = 2500000
const CYCLE_SPENT = 1800000
const CYCLE_PCT = (CYCLE_SPENT / CYCLE_BUDGET) * 100

const INSIGHTS = [
  { icon: Icons.trendingUp, color: '#EF4444', bg: '#FEF2F2', title: 'Feed costs up 12%', desc: 'Prices increased this month. Consider bulk purchasing with other farmers.', impact: '-₦22,000' },
  { icon: Icons.sparkles, color: '#16A34A', bg: '#F0FDF4', title: 'Save ₦18,500', desc: 'Switch to Sunshine Feeds — same quality, 10% cheaper per bag.', impact: '+₦18,500' },
  { icon: Icons.target, color: '#1A56FF', bg: '#EEF3FF', title: '+₦42,000 profit impact', desc: 'Reallocating 15% of repairs budget could cover feed shortfall.', impact: '+₦42,000' },
]

const QUICK_ACTIONS = [
  { icon: Icons.fileText, label: 'Spending Report', route: '/records/expenses/reports' as const, color: '#1A56FF', bg: '#EEF3FF' },
  { icon: Icons.settings, label: 'Set Budget', route: '/records/expenses/budget-setup' as const, color: '#F59E0B', bg: '#FFFBEB' },
  { icon: Icons.arrowUpRight, label: 'Export', route: '/records/expenses/budget-export' as const, color: '#8B5CF6', bg: '#F5F3FF' },
]

function BudgetGauge({ score }: { score: number }) {
  const size = 80
  const cx = size / 2
  const cy = size / 2
  const r = 34
  const circumference = 2 * Math.PI * r
  const filled = (score / 100) * circumference
  const gap = 8
  const dashArray = `${Math.max(0, filled - gap)} ${circumference - filled}`
  const color = score >= 80 ? '#16A34A' : score >= 50 ? '#F59E0B' : '#EF4444'

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <SvgCircle cx={cx} cy={cy} r={r} stroke="#F1F5F9" strokeWidth={6} fill="none" />
        <SvgCircle
          cx={cx} cy={cy} r={r}
          stroke={color}
          strokeWidth={6}
          fill="none"
          strokeDasharray={dashArray}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        <Text style={{ fontSize: 20, fontWeight: '800', color }}>{score}</Text>
        <Text style={{ fontSize: 8, fontWeight: '600', color: '#94A3B8', marginTop: -1 }}>/100</Text>
      </View>
    </View>
  )
}

function WatchlistBadge({ status }: { status: string }) {
  const config = status === 'over'
    ? { label: 'Over budget', bg: '#FEF2F2', text: '#DC2626', dot: '#EF4444' }
    : status === 'at_risk'
      ? { label: 'At risk', bg: '#FFFBEB', text: '#D97706', dot: '#F59E0B' }
      : { label: 'Healthy', bg: '#F0FDF4', text: '#16A34A', dot: '#16A34A' }
  return (
    <View style={[gs.wlBadge, { backgroundColor: config.bg }]}>
      <View style={[gs.wlDot, { backgroundColor: config.dot }]} />
      <Text style={[gs.wlBadgeText, { color: config.text }]}>{config.label}</Text>
    </View>
  )
}

function AnimatedCard({ children, delay }: { children: React.ReactNode; delay?: number }) {
  return (
    <Animated.View entering={FadeInUp.duration(400).delay(delay ?? 0).springify()}>
      {children}
    </Animated.View>
  )
}

export default function BudgetScreen() {
  const insets = useSafeAreaInsets()

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollInner, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── HEADER ─── */}
        <Animated.View entering={FadeInUp.duration(500).springify()} style={styles.topNav}>
          <TouchableOpacity
            style={styles.navBack}
            activeOpacity={0.7}
            onPress={() => { if (router.canGoBack()) { router.back() } else { router.replace('/records/expenses' as any) } }}
          >
            <GoonaIcon icon={Icons.arrowLeft} size={24} color="#1B1B1B" />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Budget</Text>
          <View style={{ width: 40 }} />
        </Animated.View>

        {/* ─── HEALTH SCORE + FINANCIAL HERO ─── */}
        <AnimatedCard delay={80}>
          <View style={styles.heroCard}>
            <View style={styles.heroTop}>
              <View style={styles.heroHealth}>
                <BudgetGauge score={HEALTH_SCORE} />
                <View style={styles.heroHealthText}>
                  <Text style={styles.heroHealthLabel}>Budget Health</Text>
                  <Text style={[styles.heroHealthStatus, HEALTH_SCORE >= 80 ? { color: '#16A34A' } : HEALTH_SCORE >= 50 ? { color: '#F59E0B' } : { color: '#EF4444' }]}>
                    {HEALTH_SCORE >= 80 ? 'On track' : HEALTH_SCORE >= 50 ? 'Needs attention' : 'Critical'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.heroAction} activeOpacity={0.7}>
                <Text style={styles.heroActionText}>Adjust</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.heroMetrics}>
              <View style={styles.heroMetric}>
                <Text style={styles.heroMetricLabel}>Budget</Text>
                <Text style={styles.heroMetricValue}>{formatNaira(MONTHLY_BUDGET)}</Text>
              </View>
              <View style={styles.heroMetricDivider} />
              <View style={styles.heroMetric}>
                <Text style={styles.heroMetricLabel}>Spent</Text>
                <Text style={styles.heroMetricValue}>{formatNaira(SPENT)}</Text>
              </View>
              <View style={styles.heroMetricDivider} />
              <View style={styles.heroMetric}>
                <Text style={styles.heroMetricLabel}>Remaining</Text>
                <Text style={[styles.heroMetricValue, REMAINING > 0 ? { color: '#16A34A' } : { color: '#EF4444' }]}>{formatNaira(REMAINING)}</Text>
              </View>
            </View>
            <View style={styles.heroProjected}>
              <View style={styles.heroProjectedRow}>
                <Text style={styles.heroProjectedLabel}>Projected month-end</Text>
                <Text style={styles.heroProjectedValue}>{formatNaira(PROJECTED)}</Text>
              </View>
              <View style={styles.heroBarBg}>
                <View style={[styles.heroBarFill, { width: `${(PROJECTED / MONTHLY_BUDGET) * 100}%`, backgroundColor: '#F59E0B' }]} />
              </View>
              <Text style={styles.heroBarNote}>{Math.round((PROJECTED / MONTHLY_BUDGET) * 100)}% of budget</Text>
            </View>
          </View>
        </AnimatedCard>

        {/* ─── EXPENSE WATCHLIST ─── */}
        <AnimatedCard delay={160}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Expense Watchlist</Text>
          </View>
          {WATCHLIST.map((w, i) => (
            <Animated.View key={w.label} entering={FadeInUp.duration(350).delay(200 + i * 80).springify()}>
              <View style={styles.wlCard}>
                <View style={styles.wlLeft}>
                  <View style={[styles.wlIcon, { backgroundColor: w.color + '15' }]}>
                    <GoonaIcon icon={w.icon} size={16} color={w.color} />
                  </View>
                  <View>
                    <Text style={styles.wlLabel}>{w.label}</Text>
                    <Text style={styles.wlMeta}>{formatNaira(w.spent)} / {formatNaira(w.limit)}</Text>
                  </View>
                </View>
                <WatchlistBadge status={w.status} />
              </View>
            </Animated.View>
          ))}
        </AnimatedCard>

        {/* ─── WEEKLY SPENDING FORECAST ─── */}
        <AnimatedCard delay={320}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Weekly Spending Forecast</Text>
          </View>
          <View style={styles.forecastCard}>
            <View style={styles.forecastBars}>
              {WEEKLY_FORECAST.map((w, i) => {
                const barH = (w.value / MAX_FORECAST) * 120
                const isHighest = w.value === MAX_FORECAST
                return (
                  <View key={w.label} style={styles.forecastBarCol}>
                    <Text style={styles.forecastBarValue}>{formatNaira(w.value)}</Text>
                    <View style={[styles.forecastBar, { height: barH, backgroundColor: isHighest ? '#2E7D32' : '#E2E8F0' }]} />
                    <Text style={[styles.forecastBarLabel, isHighest && { color: '#2E7D32', fontWeight: '700' }]}>{w.label}</Text>
                  </View>
                )
              })}
            </View>
            <Text style={styles.forecastNote}>Week 4 trending higher — review feed orders</Text>
          </View>
        </AnimatedCard>

        {/* ─── EXPENSE BREAKDOWN ─── */}
        <AnimatedCard delay={400}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Expense Breakdown</Text>
          </View>
          <View style={styles.breakdownCard}>
            <View style={styles.breakdownStacked}>
              {BREAKDOWN.map((b) => (
                <View key={b.label} style={[styles.breakdownSegment, { flex: b.pct, backgroundColor: b.color }]} />
              ))}
            </View>
            <View style={styles.breakdownList}>
              {BREAKDOWN.map((b) => (
                <View key={b.label} style={styles.breakdownRow}>
                  <View style={styles.breakdownLeft}>
                    <View style={[styles.breakdownDot, { backgroundColor: b.color }]} />
                    <Text style={styles.breakdownLabel}>{b.label}</Text>
                  </View>
                  <Text style={styles.breakdownValue}>{formatNaira(b.amount)}</Text>
                </View>
              ))}
            </View>
          </View>
        </AnimatedCard>

        {/* ─── GOONA BUDGET INSIGHTS ─── */}
        <AnimatedCard delay={480}>
          <View style={styles.sectionHeader}>
            <GoonaIcon icon={Icons.sparkles} size={16} color="#2E7D32" />
            <Text style={[styles.sectionTitle, { marginLeft: 6 }]}>GOONA Budget Insights</Text>
          </View>
          {INSIGHTS.map((ins, i) => {
            const IconComp = ins.icon
            return (
              <Animated.View key={ins.title} entering={FadeInUp.duration(350).delay(520 + i * 100).springify()}>
                <TouchableOpacity style={[styles.insightCard, { backgroundColor: ins.bg }]} activeOpacity={0.7}>
                  <View style={styles.insightRow}>
                    <View style={[styles.insightIconWrap, { backgroundColor: ins.color + '20' }]}>
                      <GoonaIcon icon={IconComp} size={18} color={ins.color} />
                    </View>
                    <View style={styles.insightContent}>
                      <View style={styles.insightTop}>
                        <Text style={styles.insightTitle}>{ins.title}</Text>
                        <Text style={[styles.insightImpact, ins.color === '#EF4444' ? { color: '#EF4444' } : { color: '#16A34A' }]}>{ins.impact}</Text>
                      </View>
                      <Text style={styles.insightDesc}>{ins.desc}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            )
          })}
        </AnimatedCard>

        {/* ─── PRODUCTION CYCLE BUDGET ─── */}
        <AnimatedCard delay={620}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Production Cycle Budget</Text>
          </View>
          <View style={styles.cycleCard}>
            <View style={styles.cycleRow}>
              <View style={styles.cycleCol}>
                <Text style={styles.cycleLabel}>Cycle Budget</Text>
                <Text style={styles.cycleValue}>{formatNaira(CYCLE_BUDGET)}</Text>
              </View>
              <View style={styles.cycleCol}>
                <Text style={styles.cycleLabel}>Cycle Spent</Text>
                <Text style={styles.cycleValue}>{formatNaira(CYCLE_SPENT)}</Text>
              </View>
            </View>
            <View style={styles.cycleBarBg}>
              <View style={[styles.cycleBarFill, { width: `${CYCLE_PCT}%`, backgroundColor: CYCLE_PCT > 80 ? '#EF4444' : CYCLE_PCT > 60 ? '#F59E0B' : '#16A34A' }]} />
            </View>
            <View style={styles.cycleMeta}>
              <Text style={styles.cycleMetaText}>{CYCLE_PCT.toFixed(0)}% used</Text>
              <Text style={styles.cycleMetaText}>{formatNaira(CYCLE_BUDGET - CYCLE_SPENT)} remaining</Text>
            </View>
          </View>
        </AnimatedCard>

        {/* ─── SAVINGS OPPORTUNITY + PROFIT IMPACT ─── */}
        <AnimatedCard delay={700}>
          <View style={styles.dualGrid}>
            <TouchableOpacity style={styles.oppCard} activeOpacity={0.7}>
              <View style={styles.oppIconWrap}>
                <GoonaIcon icon={Icons.piggyBank} size={22} color="#2E7D32" />
              </View>
              <Text style={styles.oppLabel}>Savings Opportunity</Text>
              <Text style={styles.oppAmount}>₦18,500</Text>
              <Text style={styles.oppDesc}>Switch feed supplier</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.oppCard} activeOpacity={0.7}>
              <View style={[styles.oppIconWrap, { backgroundColor: '#EEF3FF' }]}>
                <GoonaIcon icon={Icons.trendingUp} size={22} color="#1A56FF" />
              </View>
              <Text style={styles.oppLabel}>Profit Impact</Text>
              <Text style={[styles.oppAmount, { color: '#1A56FF' }]}>+₦42,000</Text>
              <Text style={styles.oppDesc}>Budget optimization</Text>
            </TouchableOpacity>
          </View>
        </AnimatedCard>

        {/* ─── QUICK ACTIONS ─── */}
        <AnimatedCard delay={780}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>
          <View style={styles.actionsGrid}>
            {QUICK_ACTIONS.map((a) => (
              <TouchableOpacity
                key={a.label}
                style={[styles.actionCard, { backgroundColor: a.bg }]}
                activeOpacity={0.7}
                onPress={() => router.push(a.route as any)}
              >
                <GoonaIcon icon={a.icon} size={20} color={a.color} />
                <Text style={[styles.actionLabel, { color: a.color }]}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </AnimatedCard>

        <View style={{ height: 32 }} />
      </ScrollView>

      <BottomDock />
    </View>
  )
}

const gs = StyleSheet.create({
  wlBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  wlDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  wlBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
})

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

  // ─── HERO CARD ───
  heroCard: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  heroHealth: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroHealthText: {},
  heroHealthLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  heroHealthStatus: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  heroAction: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#F0FDF4',
  },
  heroActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2E7D32',
  },
  heroMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroMetric: {
    flex: 1,
    alignItems: 'center',
  },
  heroMetricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 4,
  },
  heroMetricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1B1B1B',
    letterSpacing: -0.3,
  },
  heroMetricDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#F1F5F9',
  },
  heroProjected: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 14,
  },
  heroProjectedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  heroProjectedLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
  },
  heroProjectedValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1B1B1B',
  },
  heroBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FDE68A',
    overflow: 'hidden',
    marginBottom: 6,
  },
  heroBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  heroBarNote: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D97706',
  },

  // ─── SECTION ───
  sectionHeader: {
    flexDirection: 'row',
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

  // ─── WATCHLIST ───
  wlCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  wlLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  wlIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wlLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1B1B1B',
  },
  wlMeta: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 1,
  },

  // ─── FORECAST ───
  forecastCard: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  forecastBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 160,
    marginBottom: 12,
  },
  forecastBarCol: {
    alignItems: 'center',
    flex: 1,
  },
  forecastBarValue: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
  },
  forecastBar: {
    width: 32,
    borderRadius: 6,
    minHeight: 8,
  },
  forecastBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 6,
  },
  forecastNote: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
    textAlign: 'center',
  },

  // ─── BREAKDOWN ───
  breakdownCard: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  breakdownStacked: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 16,
  },
  breakdownSegment: {
    height: '100%',
  },
  breakdownList: {
    gap: 10,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  breakdownDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  breakdownLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1B1B1B',
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1B1B1B',
  },

  // ─── INSIGHTS ───
  insightCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
    padding: 14,
  },
  insightRow: {
    flexDirection: 'row',
    gap: 12,
  },
  insightIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightContent: {
    flex: 1,
  },
  insightTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1B1B1B',
    flex: 1,
  },
  insightImpact: {
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 8,
  },
  insightDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },

  // ─── CYCLE ───
  cycleCard: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cycleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  cycleCol: {},
  cycleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 4,
  },
  cycleValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1B1B1B',
  },
  cycleBarBg: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
    marginBottom: 8,
  },
  cycleBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  cycleMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cycleMetaText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },

  // ─── OPPORTUNITY DUAL ───
  dualGrid: {
    flexDirection: 'row',
    marginHorizontal: 16,
    gap: 10,
  },
  oppCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  oppIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  oppLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 4,
  },
  oppAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: '#16A34A',
    marginBottom: 4,
  },
  oppDesc: {
    fontSize: 12,
    color: '#64748B',
  },

  // ─── QUICK ACTIONS ───
  actionsGrid: {
    flexDirection: 'row',
    marginHorizontal: 16,
    gap: 10,
  },
  actionCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 8,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
})
