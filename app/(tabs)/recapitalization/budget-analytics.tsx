import React, { useMemo } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet,
} from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import GoonaIcon from '../../../components/ui/GoonaIcon'
import { Icons } from '../../../shared/icons'
import Animated, { FadeInUp } from 'react-native-reanimated'
import { formatNaira } from '../../../utils/format'
import { useBudgetStore, type Budget } from '../../../store/useBudgetStore'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'Draft', color: '#94A3B8', bg: '#F1F5F9' },
  scheduled: { label: 'Scheduled', color: '#3B82F6', bg: '#EFF6FF' },
  active: { label: 'Active', color: '#16A34A', bg: '#F0FDF4' },
  near_expiry: { label: 'Near Expiry', color: '#F59E0B', bg: '#FFFBEB' },
  completed: { label: 'Completed', color: '#64748B', bg: '#F1F5F9' },
  archived: { label: 'Archived', color: '#8B5CF6', bg: '#F5F3FF' },
  cancelled: { label: 'Cancelled', color: '#EF4444', bg: '#FEF2F2' },
}

const FALLBACK_STATUS = { label: 'Unknown', color: '#94A3B8', bg: '#F1F5F9' }

function getStatusConfig(status: string | undefined): { label: string; color: string; bg: string } {
  return STATUS_CONFIG[status ?? ''] ?? FALLBACK_STATUS
}

function StatusDot({ status }: { status: string }) {
  return <View style={[s.statusDot, { backgroundColor: getStatusConfig(status).color }]} />
}

function AnimatedCard({ children, delay }: { children: React.ReactNode; delay?: number }) {
  return (
    <Animated.View entering={FadeInUp.duration(400).delay(delay ?? 0).springify()}>
      {children}
    </Animated.View>
  )
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionTitle}>{title}</Text>
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
    <View style={[s.wlBadge, { backgroundColor: config.bg }]}>
      <View style={[s.wlDot, { backgroundColor: config.dot }]} />
      <Text style={[s.wlBadgeText, { color: config.text }]}>{config.label}</Text>
    </View>
  )
}

function CategoryIcon({ label }: { label: string }) {
  const iconMap: Record<string, any> = {
    Feed: Icons.package,
    Salaries: Icons.users,
    Medication: Icons.receipt,
    Transport: Icons.truck,
    Utilities: Icons.zap,
    Repairs: Icons.wrench,
    Other: Icons.package,
  }
  return <GoonaIcon icon={iconMap[label] ?? Icons.package} size={16} color="#64748B" />
}

export default function BudgetAnalyticsScreen() {
  const insets = useSafeAreaInsets()
  const budgets = useBudgetStore((s) => s.budgets)

  const active = useMemo(() => budgets.filter((b) => b.status === 'active' || b.status === 'near_expiry'), [budgets])
  const current = active[0] ?? budgets[0]
  const totalAllocated = current ? current.allocations.reduce((s, a) => s + a.amount, 0) : 0
  const remaining = current ? current.totalAmount - totalAllocated : 0
  const progress = current && current.totalAmount > 0 ? totalAllocated / current.totalAmount : 0

  const breakdown = useMemo(() => {
    if (!current) return []
    return current.allocations
      .sort((a, b) => b.amount - a.amount)
      .map((a) => ({
        label: a.label,
        amount: a.amount,
        pct: current.totalAmount > 0 ? (a.amount / current.totalAmount) * 100 : 0,
        color: '#2E7D32',
      }))
  }, [current])

  const watchlist = useMemo(() => {
    if (!current) return []
    return current.allocations.map((a) => {
      const pct = a.amount / current.totalAmount
      const status = a.amount > current.totalAmount ? 'over' : pct > 0.8 ? 'at_risk' : 'healthy'
      return { label: a.label, status, spent: a.amount, limit: Math.round(a.amount * 1.2), color: '#64748B' }
    })
  }, [current])

  const hasData = budgets.length > 0

  const totalBudgeted = budgets.reduce((s, b) => s + b.totalAmount, 0)
  const totalSpent = budgets.reduce((s, b) => s + b.allocations.reduce((s2, a) => s2 + a.amount, 0), 0)
  const cyclePct = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0

  const monthlyTrend = useMemo(() => {
    if (budgets.length === 0) return []
    const now = Date.now()
    return [0, 1, 2, 3].map((offset) => {
      const start = new Date(now)
      start.setMonth(start.getMonth() - 3 + offset)
      const end = new Date(start)
      end.setMonth(end.getMonth() + 1)
      const monthBudgets = budgets.filter((b) => b.startDate >= start.getTime() && b.startDate < end.getTime())
      const total = monthBudgets.reduce((s, b) => s + b.totalAmount, 0)
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      return { label: months[start.getMonth()], value: total }
    })
  }, [budgets])

  const maxTrend = Math.max(...monthlyTrend.map((w) => w.value), 1)

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollInner, { paddingTop: insets.top + 12 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── HEADER ─── */}
        <Animated.View entering={FadeInUp.duration(500).springify()} style={styles.topNav}>
          <TouchableOpacity
            style={styles.navBack}
            activeOpacity={0.7}
            onPress={() => router.back()}
          >
            <GoonaIcon icon={Icons.arrowLeft} size={22} color="#1B1B1B" />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Budget Analytics</Text>
          <View style={{ width: 38 }} />
        </Animated.View>

        {!hasData ? (
          <View style={s.empty}>
            <View style={s.emptyIconWrap}>
              <GoonaIcon icon={Icons.barChart} size={32} color="#94A3B8" />
            </View>
            <Text style={s.emptyTitle}>No Data Yet</Text>
            <Text style={s.emptyDesc}>
              Create a budget first to see analytics and breakdowns.
            </Text>
          </View>
        ) : (
          <>
            {/* ─── EXPENSE BREAKDOWN ─── */}
            <AnimatedCard delay={60}>
              <SectionHeader title="Expense Breakdown" />
              <View style={styles.card}>
                {breakdown.length > 0 ? (
                  <>
                    <View style={s.breakdownStacked}>
                      {breakdown.map((b) => (
                        <View key={b.label} style={[s.breakdownSegment, { flex: Math.max(b.pct, 1), backgroundColor: b.color }]} />
                      ))}
                    </View>
                    <View style={s.breakdownList}>
                      {breakdown.map((b) => (
                        <View key={b.label} style={s.breakdownRow}>
                          <View style={s.breakdownLeft}>
                            <View style={[s.breakdownDot, { backgroundColor: b.color }]} />
                            <Text style={s.breakdownLabel}>{b.label}</Text>
                          </View>
                          <Text style={s.breakdownValue}>{formatNaira(b.amount)}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                ) : (
                  <Text style={s.noDataText}>No categories allocated yet.</Text>
                )}
              </View>
            </AnimatedCard>

            {/* ─── MONTHLY TREND ─── */}
            <AnimatedCard delay={120}>
              <SectionHeader title="Monthly Budget Trend" />
              <View style={styles.card}>
                <View style={s.forecastBars}>
                  {monthlyTrend.map((w, i) => {
                    const barH = (w.value / maxTrend) * 120
                    const isHighest = w.value === maxTrend
                    return (
                      <View key={w.label} style={s.forecastBarCol}>
                        <Text style={s.forecastBarValue}>{formatNaira(w.value)}</Text>
                        <View style={[s.forecastBar, { height: Math.max(barH, 8), backgroundColor: isHighest ? '#2E7D32' : '#E2E8F0' }]} />
                        <Text style={[s.forecastBarLabel, isHighest && { color: '#2E7D32', fontWeight: '700' }]}>{w.label}</Text>
                      </View>
                    )
                  })}
                </View>
                <Text style={s.forecastNote}>
                  {current ? `Current budget: ${current.name}` : 'Create budgets to see trends'}
                </Text>
              </View>
            </AnimatedCard>

            {/* ─── EXPENSE WATCHLIST ─── */}
            <AnimatedCard delay={180}>
              <SectionHeader title="Expense Watchlist" />
              {watchlist.length > 0 ? (
                watchlist.map((w, i) => (
                  <Animated.View key={w.label} entering={FadeInUp.duration(250).delay(200 + i * 60).springify()}>
                    <View style={s.wlCard}>
                      <View style={s.wlLeft}>
                        <View style={[s.wlIcon, { backgroundColor: '#F1F5F9' }]}>
                          <CategoryIcon label={w.label} />
                        </View>
                        <View>
                          <Text style={s.wlLabel}>{w.label}</Text>
                          <Text style={s.wlMeta}>{formatNaira(w.spent)} / {formatNaira(w.limit)}</Text>
                        </View>
                      </View>
                      <WatchlistBadge status={w.status} />
                    </View>
                  </Animated.View>
                ))
              ) : (
                <View style={s.noDataBlock}>
                  <Text style={s.noDataText}>Add allocations to track category spending.</Text>
                </View>
              )}
            </AnimatedCard>

            {/* ─── ALL BUDGETS STATUS ─── */}
            <AnimatedCard delay={260}>
              <SectionHeader title="All Budgets" />
              {budgets.map((b, i) => (
                <Animated.View key={b.id} entering={FadeInUp.duration(250).delay(300 + i * 60).springify()}>
                  <TouchableOpacity
                    style={s.budgetStatusCard}
                    activeOpacity={0.7}
                    onPress={() => router.push(`/(tabs)/recapitalization/budget-details?id=${b.id}`)}
                  >
                    <View style={s.budgetStatusLeft}>
                      <StatusDot status={b.status} />
                      <View>
                        <Text style={s.budgetStatusName}>{b.name}</Text>
                        <Text style={s.budgetStatusAmount}>{formatNaira(b.totalAmount)}</Text>
                      </View>
                    </View>
                    <View style={s.budgetStatusRight}>
                      <Text style={[s.budgetStatusLabel, { color: getStatusConfig(b.status).color }]}>
                        {getStatusConfig(b.status).label}
                      </Text>
                      <GoonaIcon icon={Icons.chevronRight} size={14} color="#CBD5E1" />
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </AnimatedCard>

            {/* ─── OVERALL BUDGET SUMMARY ─── */}
            <AnimatedCard delay={380}>
              <SectionHeader title="Overall Summary" />
              <View style={styles.card}>
                <View style={s.cycleRow}>
                  <View style={s.cycleCol}>
                    <Text style={s.cycleLabel}>Total Budgeted</Text>
                    <Text style={s.cycleValue}>{formatNaira(totalBudgeted)}</Text>
                  </View>
                  <View style={s.cycleCol}>
                    <Text style={s.cycleLabel}>Total Allocated</Text>
                    <Text style={s.cycleValue}>{formatNaira(totalSpent)}</Text>
                  </View>
                </View>
                <View style={s.cycleBarBg}>
                  <View style={[s.cycleBarFill, { width: `${Math.min(cyclePct, 100)}%`, backgroundColor: cyclePct > 80 ? '#EF4444' : cyclePct > 60 ? '#F59E0B' : '#16A34A' }]} />
                </View>
                <View style={s.cycleMeta}>
                  <Text style={s.cycleMetaText}>{cyclePct.toFixed(0)}% allocated</Text>
                  <Text style={s.cycleMetaText}>{budgets.length} budget{budgets.length > 1 ? 's' : ''}</Text>
                </View>
              </View>
            </AnimatedCard>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  empty: { alignItems: 'center', paddingHorizontal: 40, paddingTop: 60 },
  emptyIconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#1B1B1B', marginBottom: 8 },
  emptyDesc: { fontSize: 13, color: '#94A3B8', textAlign: 'center', lineHeight: 18 },

  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1B1B1B',
    letterSpacing: -0.3,
  },

  // ─── BREAKDOWN ───
  breakdownStacked: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 16,
  },
  breakdownSegment: { height: '100%' },
  breakdownList: { gap: 10 },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  breakdownDot: { width: 8, height: 8, borderRadius: 4 },
  breakdownLabel: { fontSize: 14, fontWeight: '600', color: '#1B1B1B' },
  breakdownValue: { fontSize: 14, fontWeight: '700', color: '#1B1B1B' },

  // ─── FORECAST ───
  forecastBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 160,
    marginBottom: 12,
  },
  forecastBarCol: { alignItems: 'center', flex: 1 },
  forecastBarValue: { fontSize: 10, fontWeight: '700', color: '#64748B', marginBottom: 6 },
  forecastBar: { width: 32, borderRadius: 6, minHeight: 8 },
  forecastBarLabel: { fontSize: 11, fontWeight: '600', color: '#94A3B8', marginTop: 6 },
  forecastNote: { fontSize: 12, fontWeight: '600', color: '#64748B', textAlign: 'center' },

  // ─── WATCHLIST ───
  wlBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  wlDot: { width: 6, height: 6, borderRadius: 3 },
  wlBadgeText: { fontSize: 11, fontWeight: '700' },
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
  wlLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  wlIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  wlLabel: { fontSize: 14, fontWeight: '700', color: '#1B1B1B' },
  wlMeta: { fontSize: 12, color: '#94A3B8', marginTop: 1 },

  // ─── BUDGET STATUS LIST ───
  budgetStatusCard: {
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
  budgetStatusLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  budgetStatusName: { fontSize: 14, fontWeight: '700', color: '#1B1B1B' },
  budgetStatusAmount: { fontSize: 12, color: '#94A3B8', marginTop: 1 },
  budgetStatusRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  budgetStatusLabel: { fontSize: 12, fontWeight: '700' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },

  // ─── CYCLE ───
  cycleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  cycleCol: {},
  cycleLabel: { fontSize: 12, fontWeight: '600', color: '#94A3B8', marginBottom: 4 },
  cycleValue: { fontSize: 20, fontWeight: '800', color: '#1B1B1B' },
  cycleBarBg: { height: 10, borderRadius: 5, backgroundColor: '#F1F5F9', overflow: 'hidden', marginBottom: 8 },
  cycleBarFill: { height: '100%', borderRadius: 5 },
  cycleMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  cycleMetaText: { fontSize: 12, fontWeight: '600', color: '#64748B' },

  // ─── NO DATA ───
  noDataBlock: { marginHorizontal: 16, marginBottom: 8 },
  noDataText: { fontSize: 13, color: '#94A3B8', textAlign: 'center', paddingVertical: 20 },
})

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAF7' },
  scroll: { flex: 1 },
  scrollInner: { paddingBottom: 40 },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 48,
    marginBottom: 8,
  },
  navBack: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: { fontSize: 18, fontWeight: '700', color: '#1B1B1B', letterSpacing: -0.3 },
  card: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
})
