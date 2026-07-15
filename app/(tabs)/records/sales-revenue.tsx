import React, { useState, useMemo, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Dimensions, Platform,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import GoonaIcon from '../../../components/ui/GoonaIcon'
import { Icons } from '../../../shared/icons'
import { router, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Circle as SvgCircle } from 'react-native-svg'
import Animated, { FadeInUp } from 'react-native-reanimated'
import { useHistoryStore, rangeForPreset, type DatePreset } from '../../../store/useHistoryStore'

const { width: SCREEN_W } = Dimensions.get('window')

const EXPENSE_ANALYTICS = [
  { label: 'Feed Costs', value: '₦185k', trend: '+12%', trendUp: false, color: '#16A34A', icon: Icons.package },
  { label: 'Staff Expenses', value: '₦94k', trend: '–2%', trendUp: true, color: '#1A56FF', icon: Icons.users },
  { label: 'Burn Rate', value: '₦42k/wk', trend: '+5%', trendUp: false, color: '#F59E0B', icon: Icons.zap },
  { label: 'Utilities', value: '₦28k', trend: '–8%', trendUp: true, color: '#EF4444', icon: Icons.wrench },
]

const SALES_INSIGHTS = [
  { icon: Icons.trendingUp, color: '#16A34A', bg: '#F0FDF4', title: 'Top Revenue Source', desc: 'Broilers are your highest revenue contributor at 42% of total sales this month.', impact: '₦2.0M' },
  { icon: Icons.target, color: '#1A56FF', bg: '#EEF3FF', title: 'Outstanding Opportunity', desc: 'Collecting ₦120k in outstanding payments could improve cash flow by 12%.', impact: '+₦120k' },
  { icon: Icons.barChart3, color: '#8B5CF6', bg: '#F5F3FF', title: 'Sales Forecast', desc: 'Based on current trends, next month revenue is projected at ₦5.2M.', impact: '+₦400k' },
]

const EXPENSE_INSIGHTS = [
  { icon: Icons.trendingDown, color: '#EF4444', bg: '#FEF2F2', title: 'Expense Trend', desc: 'Feed costs increased 15% this month. Consider bulk purchasing.', impact: '+₦85k' },
  { icon: Icons.zap, color: '#F59E0B', bg: '#FFFBEB', title: 'Cost Saving Opportunity', desc: 'Utility costs dropped 8%. Current efficiency measures are working.', impact: '-₦28k' },
  { icon: Icons.package, color: '#16A34A', bg: '#F0FDF4', title: 'Feed Efficiency', desc: 'Feed conversion ratio improved 5% this month, reducing overall costs.', impact: '₦32k saved' },
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

type TabType = 'sales' | 'expenses'

export default function SalesRevenueScreen() {
  const insets = useSafeAreaInsets()
  const { tab: tabParam } = useLocalSearchParams<{ tab?: string }>()
  const [activeTab, setActiveTab] = useState<TabType>(
    tabParam === 'expenses' ? 'expenses' : 'sales'
  )

  const records = useHistoryStore((s) => s.records)
  const thisMonth = useMemo(() => rangeForPreset('this-month'), [])

  const last24h = useMemo(() => {
    const now = Date.now()
    return { start: now - 86400000, end: now, preset: 'custom' as DatePreset }
  }, [])

  const salesTotal = useMemo(() => {
    return records
      .filter((r) => r.type === 'sale' && r.timestamp >= thisMonth.start && r.timestamp <= thisMonth.end)
      .reduce((sum, r) => sum + (r.cost ?? 0), 0)
  }, [records, thisMonth])

  const expenseTotal = useMemo(() => {
    return records
      .filter((r) => r.type === 'expense' && r.timestamp >= thisMonth.start && r.timestamp <= thisMonth.end)
      .reduce((sum, r) => sum + (r.cost ?? 0), 0)
  }, [records, thisMonth])

  const profit = salesTotal - expenseTotal
  const profitMargin = salesTotal > 0 ? (profit / salesTotal) * 100 : 0
  const HEALTH_SCORE = 88

  const recentSales = useMemo(() => {
    return records
      .filter((r) => r.type === 'sale' && r.timestamp >= last24h.start && r.timestamp <= last24h.end)
      .sort((a, b) => b.timestamp - a.timestamp)
  }, [records, last24h])

  const recentExpenses = useMemo(() => {
    return records
      .filter((r) => r.type === 'expense' && r.timestamp >= last24h.start && r.timestamp <= last24h.end)
      .sort((a, b) => b.timestamp - a.timestamp)
  }, [records, last24h])

  const outstandingBalance = 120000
  const outstandingCount = 3

  function formatTime(ts: number) {
    const d = new Date(ts)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    if (diff < 86400000 && d.getDate() === now.getDate()) return `Today, ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
    if (diff < 172800000 && d.getDate() === now.getDate() - 1) return `Yesterday, ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const renderTabToggle = () => (
    <View style={styles.tabRow}>
      {(['sales', 'expenses'] as TabType[]).map((tab) => {
        const active = activeTab === tab
        return (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, active && styles.tabBtnActive]}
            activeOpacity={0.7}
            onPress={() => setActiveTab(tab)}
          >
            <GoonaIcon
              icon={tab === 'sales' ? Icons.trendingUp : Icons.trendingDown}
              size={16}
              color={active ? '#FFF' : '#64748B'}
            />
            <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
              {tab === 'sales' ? 'SALES' : 'EXPENSES'}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )

  const renderSalesTab = () => (
    <View>
      {/* Sales This Month */}
      <AnimatedCard delay={100}>
        <View style={styles.statCard}>
          <View style={styles.statIconWrap}>
            <GoonaIcon icon={Icons.trendingUp} size={20} color="#16A34A" />
          </View>
          <View style={styles.statContent}>
            <Text style={styles.statLabel}>Sales This Month</Text>
            <Text style={[styles.statValue, { color: '#16A34A' }]}>₦{salesTotal.toLocaleString('en-NG')}</Text>
          </View>
        </View>
      </AnimatedCard>

      {/* Outstanding Payments */}
      <AnimatedCard delay={140}>
        <TouchableOpacity style={styles.outstandingCard} activeOpacity={0.7}>
          <View style={styles.outstandingLeft}>
            <View style={styles.outstandingIcon}>
              <GoonaIcon icon={Icons.users} size={20} color="#F59E0B" />
            </View>
            <View>
              <Text style={styles.outstandingLabel}>Outstanding Payments</Text>
              <Text style={styles.outstandingCount}>{outstandingCount} customers owe</Text>
            </View>
          </View>
          <View style={styles.outstandingRight}>
            <Text style={styles.outstandingAmount}>₦{outstandingBalance.toLocaleString('en-NG')}</Text>
            <View style={styles.outstandingAction}>
              <Text style={styles.outstandingActionText}>View details</Text>
              <GoonaIcon icon={Icons.chevronRight} size={14} color="#2E7D32" />
            </View>
          </View>
        </TouchableOpacity>
      </AnimatedCard>

      {/* Sales Transactions (24h only) */}
      <AnimatedCard delay={180}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Sales</Text>
          <Text style={styles.sectionCount}>{recentSales.length}</Text>
        </View>
      </AnimatedCard>
      {recentSales.length === 0 ? (
        <AnimatedCard delay={220}>
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No sales yet today</Text>
          </View>
        </AnimatedCard>
      ) : (
        recentSales.map((tx, i) => (
          <AnimatedCard key={tx.id} delay={220 + i * 40}>
            <View style={styles.txCard}>
              <View style={styles.txLeft}>
                <View style={[styles.txIcon, { backgroundColor: '#F0FDF4' }]}>
                  <GoonaIcon icon={Icons.trendingUp} size={16} color="#16A34A" />
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txName}>{tx.batch}</Text>
                  <Text style={styles.txTime}>{formatTime(tx.timestamp)}</Text>
                </View>
              </View>
              <View style={styles.txRight}>
                <Text style={[styles.txAmount, { color: '#16A34A' }]}>
                  +₦{(tx.cost ?? 0).toLocaleString('en-NG')}
                </Text>
                {tx.metadata?.paymentMethod === 'credit' ? (
                  <View style={[styles.txBadge, { backgroundColor: '#FFFBEB' }]}>
                    <Text style={[styles.txBadgeText, { color: '#D97706' }]}>Pending</Text>
                  </View>
                ) : (
                  <View style={[styles.txBadge, { backgroundColor: '#F0FDF4' }]}>
                    <Text style={[styles.txBadgeText, { color: '#16A34A' }]}>Paid</Text>
                  </View>
                )}
              </View>
            </View>
          </AnimatedCard>
        ))
      )}

      {/* View all in Farm History link */}
      <AnimatedCard delay={recentSales.length > 0 ? 220 + recentSales.length * 40 : 260}>
        <TouchableOpacity style={styles.historyLink} activeOpacity={0.7} onPress={() => router.push('/records/history/sale' as any)}>
          <GoonaIcon icon={Icons.clock} size={16} color="#2E7D32" />
          <Text style={styles.historyLinkText}>View all in Farm History <Text style={styles.historyLinkArrow}>{'\u2192'}</Text></Text>
        </TouchableOpacity>
      </AnimatedCard>

      {/* Sales GOONA IQ */}
      <AnimatedCard delay={400}>
        <View style={styles.sectionHeader}>
          <GoonaIcon icon={Icons.sparkles} size={16} color="#2E7D32" />
          <Text style={[styles.sectionTitle, { marginLeft: 6 }]}>GOONA IQ Insights</Text>
        </View>
      </AnimatedCard>
      {SALES_INSIGHTS.map((ins, i) => {
        const IconComp = ins.icon
        return (
          <AnimatedCard key={ins.title} delay={440 + i * 60}>
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

    </View>
  )

  const renderExpensesTab = () => (
    <View>
      {/* Expense Analytics */}
      <AnimatedCard delay={100}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Expense Analytics</Text>
        </View>
      </AnimatedCard>
      <AnimatedCard delay={120}>
        <View style={styles.expenseAnalyticsGrid}>
          {EXPENSE_ANALYTICS.map((a) => (
            <View key={a.label} style={styles.expenseAnalyticsCard}>
              <View style={[styles.expenseAnalyticsIcon, { backgroundColor: a.color + '15' }]}>
                <GoonaIcon icon={a.icon} size={16} color={a.color} />
              </View>
              <Text style={styles.expenseAnalyticsValue}>{a.value}</Text>
              <Text style={styles.expenseAnalyticsLabel}>{a.label}</Text>
              <View style={styles.expenseAnalyticsTrendRow}>
                <GoonaIcon icon={a.trendUp ? Icons.trendingUp : Icons.trendingDown} size={12} color={a.trendUp ? '#16A34A' : '#EF4444'} />
                <Text style={[styles.expenseAnalyticsTrend, { color: a.trendUp ? '#16A34A' : '#EF4444' }]}>{a.trend}</Text>
              </View>
            </View>
          ))}
        </View>
      </AnimatedCard>

      {/* Expenses This Month */}
      <AnimatedCard delay={180}>
        <View style={styles.statCard}>
          <View style={[styles.statIconWrap, { backgroundColor: '#FEF2F2' }]}>
            <GoonaIcon icon={Icons.trendingDown} size={20} color="#EF4444" />
          </View>
          <View style={styles.statContent}>
            <Text style={styles.statLabel}>Expenses This Month</Text>
            <Text style={[styles.statValue, { color: '#EF4444' }]}>₦{expenseTotal.toLocaleString('en-NG')}</Text>
          </View>
        </View>
      </AnimatedCard>

      {/* Expense Transactions (24h only) */}
      <AnimatedCard delay={220}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Expenses</Text>
          <Text style={styles.sectionCount}>{recentExpenses.length}</Text>
        </View>
      </AnimatedCard>
      {recentExpenses.length === 0 ? (
        <AnimatedCard delay={260}>
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No expenses yet today</Text>
          </View>
        </AnimatedCard>
      ) : (
        recentExpenses.map((tx, i) => (
          <AnimatedCard key={tx.id} delay={260 + i * 40}>
            <View style={styles.txCard}>
              <View style={styles.txLeft}>
                <View style={[styles.txIcon, { backgroundColor: '#FEF2F2' }]}>
                  <GoonaIcon icon={Icons.trendingDown} size={16} color="#EF4444" />
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txName}>{tx.notes || tx.batch}</Text>
                  <Text style={styles.txTime}>{formatTime(tx.timestamp)}</Text>
                </View>
              </View>
              <View style={styles.txRight}>
                <Text style={[styles.txAmount, { color: '#EF4444' }]}>
                  -₦{(tx.cost ?? 0).toLocaleString('en-NG')}
                </Text>
                <View style={[styles.txBadge, { backgroundColor: '#F0FDF4' }]}>
                  <Text style={[styles.txBadgeText, { color: '#16A34A' }]}>Done</Text>
                </View>
              </View>
            </View>
          </AnimatedCard>
        ))
      )}

      {/* View all in Farm History link */}
      <AnimatedCard delay={recentExpenses.length > 0 ? 260 + recentExpenses.length * 40 : 300}>
        <TouchableOpacity style={styles.historyLink} activeOpacity={0.7} onPress={() => router.push('/records/history/expense' as any)}>
          <GoonaIcon icon={Icons.clock} size={16} color="#2E7D32" />
          <Text style={styles.historyLinkText}>View all in Farm History <Text style={styles.historyLinkArrow}>{'\u2192'}</Text></Text>
        </TouchableOpacity>
      </AnimatedCard>

      {/* Expense GOONA IQ */}
      <AnimatedCard delay={480}>
        <View style={styles.sectionHeader}>
          <GoonaIcon icon={Icons.sparkles} size={16} color="#2E7D32" />
          <Text style={[styles.sectionTitle, { marginLeft: 6 }]}>GOONA IQ Insights</Text>
        </View>
      </AnimatedCard>
      {EXPENSE_INSIGHTS.map((ins, i) => {
        const IconComp = ins.icon
        return (
          <AnimatedCard key={ins.title} delay={520 + i * 60}>
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

    </View>
  )

  const handleRecord = useCallback(() => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
    if (activeTab === 'sales') router.push('/record-sale' as any)
    else router.push('/records/expenses/create' as any)
  }, [activeTab])

  const isSale = activeTab === 'sales'

  const barHeight = 72

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollInner, { paddingTop: insets.top + 16, paddingBottom: barHeight + insets.bottom + 12 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── TOP NAV ─── */}
        <AnimatedCard>
          <View style={styles.topNav}>
            <TouchableOpacity
              style={styles.navBack}
              activeOpacity={0.7}
              onPress={() => router.replace('/(tabs)/records' as any)}
            >
              <GoonaIcon icon={Icons.arrowLeft} size={24} color="#1B1B1B" />
            </TouchableOpacity>
            <Text style={styles.topTitle}>Sales & Revenue</Text>
          </View>
        </AnimatedCard>

        {/* ─── HEADER ─── */}
        <AnimatedCard delay={80}>
          <View style={styles.headerSection}>
            <Text style={styles.headerLabel}>Farm Financial Command</Text>
            <Text style={styles.headerTitle}>Financial Health{'\n'}Dashboard</Text>
          </View>
        </AnimatedCard>

        {/* ─── FINANCIAL HEALTH HERO (shared) ─── */}
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
                <Text style={styles.heroMetricValue}>₦{(salesTotal / 1000000).toFixed(1)}M</Text>
              </View>
              <View style={styles.heroMetricDiv} />
              <View style={styles.heroMetricCol}>
                <Text style={styles.heroMetricLabel}>Profit</Text>
                <Text style={styles.heroMetricValue}>₦{(profit / 1000000).toFixed(1)}M</Text>
              </View>
              <View style={styles.heroMetricDiv} />
              <View style={styles.heroMetricCol}>
                <Text style={styles.heroMetricLabel}>Margin</Text>
                <Text style={styles.heroMetricValue}>{profitMargin.toFixed(0)}%</Text>
              </View>
              <View style={styles.heroMetricDiv} />
              <View style={styles.heroMetricCol}>
                <Text style={styles.heroMetricLabel}>Cashflow</Text>
                <Text style={[styles.heroMetricValue, { color: profit >= 0 ? '#16A34A' : '#EF4444' }]}>
                  {profit >= 0 ? 'Positive' : 'Negative'}
                </Text>
              </View>
            </View>
            <View style={styles.heroIqBar}>
              <GoonaIcon icon={Icons.sparkles} size={14} color="#D97706" />
              <Text style={styles.heroIqText}>GOONA IQ: Revenue up 18% this cycle. Keep up the momentum.</Text>
            </View>
          </View>
        </AnimatedCard>

        {/* ─── TAB TOGGLE ─── */}
        <AnimatedCard delay={200}>
          {renderTabToggle()}
        </AnimatedCard>

        {/* ─── TAB CONTENT ─── */}
        {activeTab === 'sales' ? renderSalesTab() : renderExpensesTab()}

        <View style={{ height: 8 }} />
      </ScrollView>

      {/* ─── STICKY BOTTOM ACTION BAR ─── */}
      <View style={[styles.stickyBar, { paddingBottom: insets.bottom + 8 }]}>
        <TouchableOpacity
          style={styles.stickyBtn}
          activeOpacity={0.85}
          onPress={handleRecord}
        >
          <LinearGradient
            colors={isSale ? ['#2E7D32', '#17663A'] : ['#DC2626', '#B91C1C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.stickyGradient}
          >
            <GoonaIcon icon={Icons.plus} size={22} color="#FFF" />
            <Text style={styles.stickyText}>{isSale ? 'Record Sale' : 'Record Expense'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  sectionCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
    marginLeft: 'auto',
  },

  // ─── TAB TOGGLE ───
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
  },
  tabBtnActive: {
    backgroundColor: '#2E7D32',
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  tabLabelActive: {
    color: '#FFFFFF',
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

  // ─── STAT CARD ───
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },

  // ─── EXPENSE ANALYTICS ───
  expenseAnalyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 4,
  },
  expenseAnalyticsCard: {
    width: (SCREEN_W - 42) / 2,
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
  expenseAnalyticsIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  expenseAnalyticsValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B1B1B',
  },
  expenseAnalyticsLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  expenseAnalyticsTrendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expenseAnalyticsTrend: {
    fontSize: 12,
    fontWeight: '600',
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

  // ─── STICKY BOTTOM BAR ───
  stickyBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: '#F8FAF7',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)',
  },
  stickyBtn: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
  },
  stickyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  stickyText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  // ─── EMPTY ───
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },

  // ─── HISTORY LINK ───
  historyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#F0FDF4',
    marginBottom: 8,
  },
  historyLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
  },
  historyLinkArrow: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2E7D32',
  },
})
