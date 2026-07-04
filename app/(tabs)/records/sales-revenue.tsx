import React from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Dimensions,
} from 'react-native'
import GoonaIcon from '../../../components/ui/GoonaIcon'
import { Icons } from '../../../shared/icons'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Circle as SvgCircle } from 'react-native-svg'
import Animated, { FadeInUp } from 'react-native-reanimated'

const { width: SCREEN_W } = Dimensions.get('window')

const REVENUE = 4800000
const EXPENSES = 2100000
const PROFIT = REVENUE - EXPENSES
const PROFIT_MARGIN = (PROFIT / REVENUE) * 100
const HEALTH_SCORE = 88
const OUTSTANDING_BALANCE = 120000
const OUTSTANDING_COUNT = 3

const RECENT_TX = [
  { type: 'sale', name: 'FreshMart Poultry Ltd', amount: 320000, time: 'Today, 10:42 AM', status: 'paid' },
  { type: 'expense', name: 'Feed Purchase — 50 bags', amount: -85000, time: 'Today, 9:30 AM', status: 'completed' },
  { type: 'sale', name: 'AgroMax Farms', amount: 180000, time: 'Today, 9:15 AM', status: 'pending' },
  { type: 'sale', name: 'Daily Protein Market', amount: 95000, time: 'Yesterday, 3:30 PM', status: 'paid' },
  { type: 'expense', name: 'Vaccination — Layer Batch B', amount: -32000, time: 'Yesterday, 11:00 AM', status: 'completed' },
]

const TRANSACTIONS = [
  { label: 'Sales This Month', value: REVENUE, icon: Icons.trendingUp, color: '#16A34A', bg: '#F0FDF4' },
  { label: 'Expenses This Month', value: EXPENSES, icon: Icons.trendingDown, color: '#EF4444', bg: '#FEF2F2' },
  { label: 'Net Profit', value: PROFIT, icon: Icons.dollarSign, color: '#1A56FF', bg: '#EEF3FF' },
]

const QUICK_ACTIONS = [
  { icon: Icons.receipt, label: 'Record Sale', route: '/record-sale' as const, color: '#16A34A', bg: '#F0FDF4' },
  { icon: Icons.trendingDown, label: 'Record Expense', route: '/records/expenses/create' as const, color: '#EF4444', bg: '#FEF2F2' },
  { icon: Icons.sparkles, label: 'Insights', route: undefined as never, color: '#8B5CF6', bg: '#F5F3FF' },
]

const INSIGHTS = [
  { icon: Icons.trendingUp, color: '#16A34A', bg: '#F0FDF4', title: 'Top Revenue Source', desc: 'Broilers are your highest revenue contributor at 42% of total sales this month.', impact: '₦2.0M' },
  { icon: Icons.trendingDown, color: '#EF4444', bg: '#FEF2F2', title: 'Expense Trend', desc: 'Feed costs increased 15% this month. Consider bulk purchasing.', impact: '+₦85k' },
  { icon: Icons.target, color: '#1A56FF', bg: '#EEF3FF', title: 'Profit Recommendation', desc: 'Increasing Layer production by 20% could add ₦240k to monthly profit.', impact: '+₦240k' },
]

function HealthGauge({ score }: { score: number }) {
  const size = 72
  const cx = size / 2
  const cy = size / 2
  const r = 30
  const circumference = 2 * Math.PI * r
  const filled = (score / 100) * circumference
  const gap = 6
  const dashArray = `${Math.max(0, filled - gap)} ${circumference - filled}`
  const color = score >= 80 ? '#16A34A' : score >= 50 ? '#F59E0B' : '#EF4444'

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <SvgCircle cx={cx} cy={cy} r={r} stroke="#F1F5F9" strokeWidth={5} fill="none" />
        <SvgCircle
          cx={cx} cy={cy} r={r}
          stroke={color}
          strokeWidth={5}
          fill="none"
          strokeDasharray={dashArray}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        <Text style={{ fontSize: 18, fontWeight: '800', color }}>{score}</Text>
        <Text style={{ fontSize: 7, fontWeight: '600', color: '#94A3B8', marginTop: -1 }}>/100</Text>
      </View>
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

export default function SalesRevenueScreen() {
  const insets = useSafeAreaInsets()

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollInner, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── TOP NAV ─── */}
        <AnimatedCard>
          <View style={styles.topNav}>
            <TouchableOpacity
              style={styles.navBack}
              activeOpacity={0.7}
              onPress={() => router.canGoBack() ? router.back() : router.replace('/records' as any)}
            >
              <GoonaIcon icon={Icons.arrowLeft} size={24} color="#1B1B1B" />
            </TouchableOpacity>
            <Text style={styles.topTitle}>Sales & Revenue</Text>
            <TouchableOpacity style={styles.chartBtn} activeOpacity={0.8} onPress={() => router.push('/records/sales-revenue' as any)}>
              <GoonaIcon icon={Icons.barChart3} size={20} color="#1F2937" />
            </TouchableOpacity>
          </View>
        </AnimatedCard>

        {/* ─── HEADER ─── */}
        <AnimatedCard delay={80}>
          <View style={styles.headerSection}>
            <Text style={styles.headerLabel}>Farm Financial Command</Text>
            <Text style={styles.headerTitle}>Financial Health{'\n'}Dashboard</Text>
          </View>
        </AnimatedCard>

        {/* ─── FINANCIAL HEALTH HERO ─── */}
        <AnimatedCard delay={140}>
          <View style={styles.heroCard}>
            <View style={styles.heroTop}>
              <View style={styles.heroHealth}>
                <HealthGauge score={HEALTH_SCORE} />
                <View style={styles.heroHealthText}>
                  <Text style={styles.heroHealthLabel}>Financial Health</Text>
                  <Text style={[styles.heroHealthScore, { color: '#16A34A' }]}>
                    {HEALTH_SCORE}/100 Excellent
                  </Text>
                  <Text style={styles.heroHealthSub}>Your farm finances are in strong shape</Text>
                </View>
              </View>
            </View>
            <View style={styles.heroMetrics}>
              <View style={styles.heroMetricCol}>
                <Text style={styles.heroMetricLabel}>Revenue</Text>
                <Text style={styles.heroMetricValue}>₦4.8M</Text>
              </View>
              <View style={styles.heroMetricDiv} />
              <View style={styles.heroMetricCol}>
                <Text style={styles.heroMetricLabel}>Profit</Text>
                <Text style={styles.heroMetricValue}>₦2.7M</Text>
              </View>
              <View style={styles.heroMetricDiv} />
              <View style={styles.heroMetricCol}>
                <Text style={styles.heroMetricLabel}>Margin</Text>
                <Text style={styles.heroMetricValue}>{PROFIT_MARGIN.toFixed(0)}%</Text>
              </View>
              <View style={styles.heroMetricDiv} />
              <View style={styles.heroMetricCol}>
                <Text style={styles.heroMetricLabel}>Cashflow</Text>
                <Text style={[styles.heroMetricValue, { color: '#16A34A' }]}>Positive</Text>
              </View>
            </View>
            <View style={styles.heroIqBar}>
              <GoonaIcon icon={Icons.sparkles} size={14} color="#D97706" />
              <Text style={styles.heroIqText}>GOONA IQ: Revenue up 18% this cycle. Keep up the momentum.</Text>
            </View>
          </View>
        </AnimatedCard>

        {/* ─── QUICK ACTIONS ─── */}
        <AnimatedCard delay={200}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>
        </AnimatedCard>
        <AnimatedCard delay={240}>
          <View style={styles.qaGrid}>
            {QUICK_ACTIONS.map((a) => (
              <TouchableOpacity
                key={a.label}
                style={[styles.qaCard, { backgroundColor: a.bg }]}
                activeOpacity={0.7}
                onPress={() => a.route && router.push(a.route as any)}
              >
                <GoonaIcon icon={a.icon} size={22} color={a.color} />
                <Text style={[styles.qaLabel, { color: a.color }]}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </AnimatedCard>

        {/* ─── MONEY IN VS MONEY OUT ─── */}
        <AnimatedCard delay={300}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Money In vs Money Out</Text>
          </View>
        </AnimatedCard>
        {TRANSACTIONS.map((t, i) => {
          const IconComp = t.icon
          return (
            <AnimatedCard key={t.label} delay={340 + i * 60}>
              <View style={styles.moneyCard}>
                <View style={[styles.moneyIcon, { backgroundColor: t.bg }]}>
                  <GoonaIcon icon={IconComp} size={18} color={t.color} />
                </View>
                <View style={styles.moneyContent}>
                  <Text style={styles.moneyLabel}>{t.label}</Text>
                  <Text style={[styles.moneyValue, { color: t.color }]}>
                    {t.value < 0 ? '-' : ''}₦{Math.abs(t.value).toLocaleString('en-NG')}
                  </Text>
                </View>
                <View style={[styles.moneyBar, { backgroundColor: t.bg }]}>
                  <View style={[styles.moneyBarFill, {
                    width: `${(t.value / REVENUE) * 100}%`,
                    backgroundColor: t.color,
                  }]} />
                </View>
              </View>
            </AnimatedCard>
          )
        })}

        {/* ─── PROFIT BAR ─── */}
        <AnimatedCard delay={520}>
          <View style={styles.profitCard}>
            <View style={styles.profitRow}>
              <Text style={styles.profitLabel}>Profit Margin</Text>
              <Text style={styles.profitValue}>{PROFIT_MARGIN.toFixed(1)}%</Text>
            </View>
            <View style={styles.profitBarBg}>
              <View style={[styles.profitBarFill, { width: `${PROFIT_MARGIN}%` }]} />
            </View>
            <Text style={styles.profitNote}>Revenue is {formatNaira(PROFIT)} ahead of expenses this month</Text>
          </View>
        </AnimatedCard>

        {/* ─── OUTSTANDING PAYMENTS ─── */}
        <AnimatedCard delay={580}>
          <TouchableOpacity style={styles.outstandingCard} activeOpacity={0.7}>
            <View style={styles.outstandingLeft}>
              <View style={styles.outstandingIcon}>
                <GoonaIcon icon={Icons.users} size={20} color="#F59E0B" />
              </View>
              <View>
                <Text style={styles.outstandingLabel}>Outstanding Payments</Text>
                <Text style={styles.outstandingCount}>{OUTSTANDING_COUNT} customers owe</Text>
              </View>
            </View>
            <View style={styles.outstandingRight}>
              <Text style={styles.outstandingAmount}>₦{OUTSTANDING_BALANCE.toLocaleString('en-NG')}</Text>
              <View style={styles.outstandingAction}>
                <Text style={styles.outstandingActionText}>View details</Text>
                <GoonaIcon icon={Icons.chevronRight} size={14} color="#2E7D32" />
              </View>
            </View>
          </TouchableOpacity>
        </AnimatedCard>

        {/* ─── RECENT TRANSACTIONS ─── */}
        <AnimatedCard delay={640}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
          </View>
        </AnimatedCard>
        {RECENT_TX.map((tx, i) => (
          <AnimatedCard key={i} delay={680 + i * 50}>
            <View style={styles.txCard}>
              <View style={styles.txLeft}>
                <View style={[styles.txIcon, { backgroundColor: tx.type === 'sale' ? '#F0FDF4' : '#FEF2F2' }]}>
                  <GoonaIcon icon={tx.type === 'sale' ? Icons.trendingUp : Icons.trendingDown} size={16} color={tx.type === 'sale' ? '#16A34A' : '#EF4444'} />
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txName}>{tx.name}</Text>
                  <Text style={styles.txTime}>{tx.time}</Text>
                </View>
              </View>
              <View style={styles.txRight}>
                <Text style={[styles.txAmount, { color: tx.type === 'sale' ? '#16A34A' : '#EF4444' }]}>
                  {tx.type === 'sale' ? '+' : ''}₦{Math.abs(tx.amount).toLocaleString('en-NG')}
                </Text>
                <View style={[styles.txBadge, { backgroundColor: tx.status === 'paid' || tx.status === 'completed' ? '#F0FDF4' : '#FFFBEB' }]}>
                  <Text style={[styles.txBadgeText, { color: tx.status === 'paid' || tx.status === 'completed' ? '#16A34A' : '#D97706' }]}>
                    {tx.status === 'paid' ? 'Paid' : tx.status === 'completed' ? 'Done' : 'Pending'}
                  </Text>
                </View>
              </View>
            </View>
          </AnimatedCard>
        ))}

        {/* ─── GOONA IQ BUSINESS INSIGHTS ─── */}
        <AnimatedCard delay={860}>
          <View style={styles.sectionHeader}>
            <GoonaIcon icon={Icons.sparkles} size={16} color="#2E7D32" />
            <Text style={[styles.sectionTitle, { marginLeft: 6 }]}>GOONA IQ Insights</Text>
          </View>
        </AnimatedCard>
        {INSIGHTS.map((ins, i) => {
          const IconComp = ins.icon
          return (
            <AnimatedCard key={ins.title} delay={900 + i * 80}>
              <TouchableOpacity style={[styles.insightCard, { backgroundColor: ins.bg }]} activeOpacity={0.7}>
                <View style={[styles.insightIconWrap, { backgroundColor: ins.color + '20' }]}>
                  <GoonaIcon icon={IconComp} size={18} color={ins.color} />
                </View>
                <View style={styles.insightContent}>
                  <View style={styles.insightTop}>
                    <Text style={styles.insightTitle}>{ins.title}</Text>
                    <Text style={[styles.insightImpact, { color: ins.color }]}>{ins.impact}</Text>
                  </View>
                  <Text style={styles.insightDesc}>{ins.desc}</Text>
                </View>
              </TouchableOpacity>
            </AnimatedCard>
          )
        })}

        {/* ─── REPORTS ─── */}
        <AnimatedCard delay={1080}>
          <TouchableOpacity style={styles.reportsCard} activeOpacity={0.7} onPress={() => router.push('/records/analytics' as any)}>
            <View style={styles.reportsLeft}>
              <View style={styles.reportsIcon}>
                <GoonaIcon icon={Icons.fileText} size={20} color="#1A56FF" />
              </View>
              <View>
                <Text style={styles.reportsLabel}>Sales Reports</Text>
                <Text style={styles.reportsDesc}>View detailed analytics and export data</Text>
              </View>
            </View>
            <GoonaIcon icon={Icons.chevronRight} size={18} color="#94A3B8" />
          </TouchableOpacity>
        </AnimatedCard>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  )
}

function formatNaira(n: number) {
  return '₦' + n.toLocaleString('en-NG')
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
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
  },
  navBack: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  topTitle: {
    fontWeight: '700',
    fontSize: 20,
    color: '#1B1B1B',
  },
  chartBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSection: {
    marginTop: 8,
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2E7D32',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  headerTitle: {
    fontWeight: '800',
    fontSize: 28,
    lineHeight: 34,
    color: '#1B1B1B',
    letterSpacing: -0.8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1B1B1B',
  },

  // ─── HERO ───
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  heroHealth: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  heroHealthText: {},
  heroHealthLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroHealthScore: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 1,
  },
  heroHealthSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  heroMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  heroMetricCol: {
    flex: 1,
    alignItems: 'center',
  },
  heroMetricLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  heroMetricValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1B1B1B',
  },
  heroMetricDiv: {
    width: 1,
    height: 28,
    backgroundColor: '#F1F5F9',
  },
  heroIqBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 12,
  },
  heroIqText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
    flex: 1,
    lineHeight: 16,
  },

  // ─── QUICK ACTIONS ───
  qaGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  qaCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 8,
  },
  qaLabel: {
    fontSize: 12,
    fontWeight: '700',
  },

  // ─── MONEY ───
  moneyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  moneyIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  moneyContent: {
    flex: 1,
  },
  moneyLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 2,
  },
  moneyValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  moneyBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  moneyBarFill: {
    height: '100%',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },

  // ─── PROFIT ───
  profitCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
  },
  profitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  profitLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1B1B1B',
  },
  profitValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A56FF',
  },
  profitBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EEF3FF',
    overflow: 'hidden',
    marginBottom: 8,
  },
  profitBarFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#1A56FF',
  },
  profitNote: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },

  // ─── OUTSTANDING ───
  outstandingCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FFFBEB',
  },
  outstandingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  outstandingIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFBEB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outstandingLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1B1B1B',
  },
  outstandingCount: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  outstandingRight: {
    alignItems: 'flex-end',
  },
  outstandingAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#D97706',
  },
  outstandingAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  outstandingActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2E7D32',
  },

  // ─── TRANSACTIONS ───
  txCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  txIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: {
    flex: 1,
  },
  txName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1B1B1B',
  },
  txTime: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '800',
  },
  txBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginTop: 4,
  },
  txBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },

  // ─── INSIGHTS ───
  insightCard: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
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

  // ─── REPORTS ───
  reportsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
  },
  reportsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reportsIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EEF3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1B1B1B',
  },
  reportsDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
})
