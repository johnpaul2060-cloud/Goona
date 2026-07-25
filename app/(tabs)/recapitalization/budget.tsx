import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Platform, AccessibilityInfo, Animated as RNAnimated,
} from 'react-native'
import * as Haptics from 'expo-haptics'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import GoonaIcon from '../../../components/ui/GoonaIcon'
import { Icons } from '../../../shared/icons'
import Animated, { FadeInDown, FadeInUp, Layout } from 'react-native-reanimated'
import { formatNaira } from '../../../utils/format'
import { useBudgetStore, type Budget } from '../../../store/useBudgetStore'
import { useBatchStore } from '../../../store/useBatchStore'
import { useHistoryStore } from '../../../store/useHistoryStore'

function getBudgetStatus(b: Budget) {
  const used = b.spent > 0 ? (b.spent / b.totalAmount) * 100 : 0
  switch (b.status) {
    case 'completed': return { label: 'Completed', color: '#64748B', bg: '#F1F5F9' }
    case 'archived': return { label: 'Archived', color: '#94A3B8', bg: '#F1F5F9' }
    case 'cancelled': return { label: 'Cancelled', color: '#EF4444', bg: '#FEF2F2' }
    case 'scheduled': return { label: 'Scheduled', color: '#3B82F6', bg: '#EFF6FF' }
    case 'near_expiry': return { label: 'Ending Soon', color: '#F59E0B', bg: '#FFFBEB' }
    default: {
      if (b.spent > b.totalAmount) return { label: 'Exceeded', color: '#EF4444', bg: '#FEF2F2' }
      if (used > 80) return { label: 'Near Limit', color: '#F59E0B', bg: '#FFFBEB' }
      return { label: 'On Track', color: '#16A34A', bg: '#F0FDF4' }
    }
  }
}

function AnimatedCard({ children, delay }: { children: React.ReactNode; delay?: number }) {
  return (
    <Animated.View entering={FadeInUp.duration(400).delay(delay ?? 0).springify()}>
      {children}
    </Animated.View>
  )
}

function StatusBadge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <View style={[s.badge, { backgroundColor: bg, borderColor: color + '30' }]}>
      <View style={[s.badgeDot, { backgroundColor: color }]} />
      <Text style={[s.badgeText, { color }]}>{label}</Text>
    </View>
  )
}

function SectionHeader({ title, count, onPress }: { title: string; count?: string; onPress?: () => void }) {
  const content = (
    <View style={s.sectionHeader}>
      <Text style={s.sectionTitle}>{title}</Text>
      {count && <View style={s.sectionCountWrap}><Text style={s.sectionCount}>{count}</Text></View>}
      {onPress && <GoonaIcon icon={Icons.chevronRight} size={16} color="#94A3B8" />}
    </View>
  )
  if (onPress) return <TouchableOpacity activeOpacity={0.7} onPress={onPress}>{content}</TouchableOpacity>
  return content
}

// ─── SUMMARY HERO ───

function SummaryHero() {
  const allBudgets = useBudgetStore((s) => s.budgets)
  const activeBudgets = useMemo(() =>
    allBudgets.filter((b) => b.status === 'active' || b.status === 'near_expiry'),
    [allBudgets]
  )

  const summary = useMemo(() => {
    if (activeBudgets.length === 0) return null
    const totalBudget = activeBudgets.reduce((sum, b) => sum + b.totalAmount, 0)
    const totalSpent = activeBudgets.reduce((sum, b) => sum + (b.spent ?? 0), 0)
    const totalAllocated = activeBudgets.reduce((sum, b) => sum + b.allocations.reduce((s, a) => s + a.amount, 0), 0)
    const allCatKeys = new Set(activeBudgets.flatMap((b) => b.allocations.map((a) => a.key)))
    const remaining = totalBudget - totalSpent
    const progress = totalBudget > 0 ? Math.min(totalSpent / totalBudget, 1) : 0
    return { totalBudget, totalSpent, totalAllocated, remaining, progress, catCount: allCatKeys.size, count: activeBudgets.length }
  }, [activeBudgets])

  if (!summary) {
    return (
      <AnimatedCard delay={60}>
        <LinearGradient colors={['#0F3D2E', '#1A6B4A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.heroCard}>
          <View style={s.heroEmpty}>
            <View style={s.heroEmptyIcon}>
              <GoonaIcon icon={Icons.wallet} size={28} color="#16A34A" />
            </View>
            <Text style={s.heroEmptyTitle}>No Active Budget</Text>
            <Text style={s.heroEmptyDesc}>Create your first budget to start tracking farm finances.</Text>
            <TouchableOpacity
              style={s.heroEmptyBtn}
              activeOpacity={0.8}
              onPress={() => router.push('/(tabs)/recapitalization/budget-setup')}
            >
              <GoonaIcon icon={Icons.plus} size={16} color="#FFF" />
              <Text style={s.heroEmptyBtnText}>Create Budget</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </AnimatedCard>
    )
  }

  const statusColor = summary.remaining < 0 ? '#EF4444' : '#BBF7D0'

  return (
    <AnimatedCard delay={60}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => {
          if (activeBudgets.length === 1) {
            router.push(`/(tabs)/recapitalization/budget-details?id=${activeBudgets[0].id}`)
          }
        }}
      >
        <LinearGradient colors={['#0F3D2E', '#1A6B4A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.heroCard}>
          <View style={s.heroTop}>
            <View>
              <Text style={s.heroLabel}>
                {summary.count === 1 ? 'Active Budget' : `${summary.count} Active Budgets`}
              </Text>
              <Text style={s.heroAmount}>{formatNaira(summary.totalBudget)}</Text>
            </View>
            <View style={s.heroBadgeWrap}>
              <StatusBadge
                label={summary.remaining < 0 ? 'Exceeded' : summary.progress > 0.8 ? 'Near Limit' : 'On Track'}
                color={summary.remaining < 0 ? '#EF4444' : summary.progress > 0.8 ? '#F59E0B' : '#16A34A'}
                bg={summary.remaining < 0 ? '#FEF2F2' : summary.progress > 0.8 ? '#FFFBEB' : '#F0FDF4'}
              />
            </View>
          </View>

          <View style={s.heroBarBg}>
            <Animated.View
              entering={FadeInUp.duration(800).springify()}
              style={[s.heroBarFill, { width: `${summary.progress * 100}%`, backgroundColor: summary.remaining < 0 ? '#EF4444' : '#16A34A' }]}
            />
          </View>

          <View style={s.heroFooter}>
            <View style={s.heroFooterItem}>
              <Text style={s.heroFooterLabel}>Spent</Text>
              <Text style={s.heroFooterValue}>{formatNaira(summary.totalSpent)}</Text>
            </View>
            <View style={s.heroFooterItem}>
              <Text style={s.heroFooterLabel}>Remaining</Text>
              <Text style={[s.heroFooterValue, { color: statusColor }]}>
                {summary.remaining < 0 ? `-${formatNaira(Math.abs(summary.remaining))}` : formatNaira(summary.remaining)}
              </Text>
            </View>
            <View style={s.heroFooterItem}>
              <Text style={s.heroFooterLabel}>Categories</Text>
              <Text style={s.heroFooterValue}>{summary.catCount}</Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </AnimatedCard>
  )
}

// ─── ACTIVE BUDGETS ───

function ActiveBudgetList() {
  const allBudgets = useBudgetStore((s) => s.budgets)
  const activeBudgets = useMemo(() =>
    allBudgets.filter((b) => b.status === 'active' || b.status === 'near_expiry'),
    [allBudgets]
  )

  if (activeBudgets.length === 0) return null

  return (
    <AnimatedCard delay={100}>
      <SectionHeader
        title="Active Budgets"
        count={String(activeBudgets.length)}
      />
      {activeBudgets.map((b, i) => (
        <BudgetRow key={b.id} budget={b} index={i} />
      ))}
    </AnimatedCard>
  )
}

function BudgetRow({ budget: b, index }: { budget: Budget; index: number }) {
  const totalAllocated = b.allocations.reduce((s, a) => s + a.amount, 0)
  const used = b.spent > 0 ? (b.spent / b.totalAmount) * 100 : 0
  const progress = b.totalAmount > 0 ? Math.min(b.spent / b.totalAmount, 1) : 0
  const status = getBudgetStatus(b)

  return (
    <Animated.View entering={FadeInUp.duration(300).delay(100 + index * 80).springify()} layout={Layout.springify()}>
      <View style={s.budgetCard}>
        <View style={s.budgetCardTop}>
          <View style={s.budgetCardLeft}>
            <Text style={s.budgetPeriod}>{b.name || b.period}</Text>
            <Text style={s.budgetAmount}>{formatNaira(b.totalAmount)}</Text>
          </View>
          <StatusBadge {...status} />
        </View>

        <View style={s.budgetBarBg}>
          <View style={[s.budgetBarFill, { width: `${progress * 100}%`, backgroundColor: status.color }]} />
        </View>

        <View style={s.budgetMeta}>
          <Text style={s.budgetMetaText}>{used.toFixed(0)}% used</Text>
          <Text style={s.budgetMetaText}>{b.allocations.length} categor{(b.allocations.length === 1 ? 'y' : 'ies')}</Text>
          <Text style={s.budgetMetaText}>{b.period}</Text>
        </View>

        <View style={s.budgetCardBottom}>
          <Text style={s.budgetRemaining}>
            {formatNaira(Math.max(0, b.totalAmount - b.spent))} remaining
          </Text>
          <TouchableOpacity
            style={s.budgetViewBtn}
            activeOpacity={0.7}
            onPress={() => router.push(`/(tabs)/recapitalization/budget-details?id=${b.id}`)}
          >
            <Text style={s.budgetViewBtnText}>View Details</Text>
            <GoonaIcon icon={Icons.chevronRight} size={12} color="#2E7D32" />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  )
}

// ─── QUICK ACTIONS (lean) ───

function QuickActions() {
  return (
    <AnimatedCard delay={180}>
      <SectionHeader title="Quick Actions" />
      <View style={s.actionsRow}>
        <TouchableOpacity
          style={[s.actionCard, { backgroundColor: '#EEF3FF' }]}
          activeOpacity={0.7}
          onPress={() => router.push('/records/expenses/reports' as any)}
        >
          <View style={[s.actionIcon, { backgroundColor: '#1A56FF15' }]}>
            <GoonaIcon icon={Icons.fileText} size={18} color="#1A56FF" />
          </View>
          <Text style={[s.actionLabel, { color: '#1A56FF' }]}>Spending Report</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.actionCard, { backgroundColor: '#F5F3FF' }]}
          activeOpacity={0.7}
          onPress={() => router.push('/(tabs)/recapitalization/budget-export')}
        >
          <View style={[s.actionIcon, { backgroundColor: '#8B5CF615' }]}>
            <GoonaIcon icon={Icons.arrowUpRight} size={18} color="#8B5CF6" />
          </View>
          <Text style={[s.actionLabel, { color: '#8B5CF6' }]}>Export</Text>
        </TouchableOpacity>
      </View>
    </AnimatedCard>
  )
}

// ─── BATCH BUDGET LIST ───

function formatNairaFull(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`
}

function BatchBudgetCard({ batch }: { batch: import('../../../store/useBatchStore').Batch }) {
  const records = useHistoryStore((s) => s.records)
  const allocations = batch.budgetAllocations ?? []
  const totalBudget = allocations.reduce((s, a) => s + a.amount, 0)

  const spendByCategory = useMemo(() => {
    const batchRecords = records.filter(
      (r) => (r.batchId === batch.id || r.batch === batch.batchName) && r.type === 'expense' && r.cost
    )
    const result: Record<string, number> = {}
    for (const r of batchRecords) {
      const cat = r.itemName || ''
      result[cat] = (result[cat] || 0) + (r.cost || 0)
    }
    return result
  }, [records, batch.id, batch.batchName])

  const totalSpent = useMemo(() => {
    let spent = 0
    for (const a of allocations) {
      spent += spendByCategory[a.key] || 0
    }
    return spent
  }, [allocations, spendByCategory])

  const remaining = totalBudget - totalSpent
  const pct = totalBudget > 0 ? Math.min(totalSpent / totalBudget, 1) : 0
  let statusColor = '#16A34A'
  let statusLabel = 'On Track'
  if (totalBudget > 0 && totalSpent > totalBudget) {
    statusColor = '#EF4444'; statusLabel = 'Over Budget'
  } else if (totalBudget > 0 && totalSpent / totalBudget > 0.8) {
    statusColor = '#F59E0B'; statusLabel = 'Near Limit'
  }

  return (
    <Animated.View entering={FadeInUp.duration(300).springify()}>
      <TouchableOpacity
        style={s.batchBudgetCard}
        activeOpacity={0.7}
        onPress={() => router.push(`/batch-details/${batch.id}` as any)}
      >
        <View style={s.batchBudgetTop}>
          <View style={s.batchBudgetLeft}>
            <Text style={s.batchBudgetName}>{batch.batchName}</Text>
            <Text style={s.batchBudgetMeta}>{batch.livestockType} · {batch.quantity} heads</Text>
          </View>
          <View style={[s.batchBudgetStatus, { backgroundColor: statusColor + '15' }]}>
            <Text style={[s.batchBudgetStatusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>

        <View style={s.batchBudgetAmounts}>
          <View style={s.batchBudgetAmountItem}>
            <Text style={s.batchBudgetAmountLabel}>Budget</Text>
            <Text style={s.batchBudgetAmountValue}>{formatNaira(totalBudget)}</Text>
          </View>
          <View style={s.batchBudgetAmountItem}>
            <Text style={s.batchBudgetAmountLabel}>Spent</Text>
            <Text style={[s.batchBudgetAmountValue, { color: '#EF4444' }]}>{formatNaira(totalSpent)}</Text>
          </View>
          <View style={s.batchBudgetAmountItem}>
            <Text style={s.batchBudgetAmountLabel}>Remaining</Text>
            <Text style={[s.batchBudgetAmountValue, { color: remaining < 0 ? '#EF4444' : '#16A34A' }]}>
              {formatNaira(Math.max(0, remaining))}
            </Text>
          </View>
        </View>

        <View style={s.batchBudgetBar}>
          <View style={s.batchBudgetTrack}>
            <View style={[s.batchBudgetFill, { width: `${pct * 100}%`, backgroundColor: statusColor }]} />
          </View>
          <Text style={[s.batchBudgetPct, { color: statusColor }]}>
            {totalBudget > 0 ? `${Math.round(pct * 100)}%` : '—'}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

function BatchBudgetList() {
  const batches = useBatchStore((s) => s.batches)
  const activeBatches = useMemo(() => batches.filter((b) => b.status === 'active'), [batches])

  if (activeBatches.length === 0) return null

  return (
    <AnimatedCard delay={0}>
      <SectionHeader title="Batch Budgets" count={String(activeBatches.length)} />
      {activeBatches.map((b, i) => (
        <View key={b.id} style={{ marginBottom: 10 }}>
          <BatchBudgetCard batch={b} />
        </View>
      ))}
    </AnimatedCard>
  )
}

// ─── ENTRY LINKS ───

function EntryLink({ icon, iconBg, iconColor, title, desc, route, delay }: {
  icon: any; iconBg: string; iconColor: string;
  title: string; desc: string; route: string; delay: number;
}) {
  return (
    <AnimatedCard delay={delay}>
      <TouchableOpacity
        style={s.entryCard}
        activeOpacity={0.7}
        onPress={() => router.push(route as any)}
      >
        <View style={[s.entryIcon, { backgroundColor: iconBg }]}>
          <GoonaIcon icon={icon} size={18} color={iconColor} />
        </View>
        <View style={s.entryBody}>
          <Text style={s.entryTitle}>{title}</Text>
          <Text style={s.entryDesc}>{desc}</Text>
        </View>
        <GoonaIcon icon={Icons.chevronRight} size={18} color="#E2E8F0" />
      </TouchableOpacity>
    </AnimatedCard>
  )
}

// ─── BUDGET HISTORY (COLLAPSIBLE) ───

function BudgetHistorySection() {
  const allBudgets = useBudgetStore((s) => s.budgets)
  const allBatches = useBatchStore((s) => s.batches)
  const records = useHistoryStore((s) => s.records)

  const completedBudgets = useMemo(() =>
    allBudgets.filter((b) => b.status === 'completed' || b.status === 'archived' || b.status === 'cancelled'),
    [allBudgets]
  )
  const completedBatches = useMemo(() =>
    allBatches.filter((b) => b.status === 'completed'),
    [allBatches]
  )
  const totalCount = completedBudgets.length + completedBatches.length
  const [expanded, setExpanded] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)
  const chevronRotate = useRef(new RNAnimated.Value(0)).current

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion)
  }, [])

  const toggle = useCallback(() => {
    const next = !expanded
    setExpanded(next)
    RNAnimated.spring(chevronRotate, {
      toValue: next ? 1 : 0,
      useNativeDriver: true,
      ...(reduceMotion ? { speed: 0 } : {}),
    }).start()
  }, [expanded, chevronRotate, reduceMotion])

  if (totalCount === 0) return null

  const chevronStyle = {
    transform: [{
      rotate: chevronRotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg'],
      }),
    }],
  }

  return (
    <AnimatedCard delay={320}>
      <TouchableOpacity activeOpacity={0.7} onPress={toggle}>
        <View style={s.historyHeaderBar}>
          <View style={s.historyHeaderLeft}>
            <Text style={s.historyHeaderTitle}>Budget History</Text>
            <View style={s.historyHeaderCount}>
              <Text style={s.historyHeaderCountText}>{totalCount}</Text>
            </View>
          </View>
          <RNAnimated.View style={chevronStyle}>
            <GoonaIcon icon={Icons.chevronDown} size={16} color="#94A3B8" />
          </RNAnimated.View>
        </View>
      </TouchableOpacity>

      {expanded && (
        <Animated.View entering={reduceMotion ? undefined : FadeInDown.duration(300).springify()}>
          {/* Completed standalone budgets */}
          {completedBudgets.map((b, i) => (
            <HistoryRow key={b.id} budget={b} index={i} />
          ))}
          {/* Completed batch cards */}
          {completedBatches.map((b, i) => (
            <CompletedBatchCard key={b.id} batch={b} index={completedBudgets.length + i} />
          ))}
        </Animated.View>
      )}
    </AnimatedCard>
  )
}

function CompletedBatchCard({ batch, index }: { batch: import('../../../store/useBatchStore').Batch; index: number }) {
  const records = useHistoryStore((s) => s.records)
  const allocations = batch.budgetAllocations ?? []
  const totalBudget = allocations.reduce((s, a) => s + a.amount, 0)

  const totalSpent = useMemo(() => {
    const batchRecords = records.filter(
      (r) => (r.batchId === batch.id || r.batch === batch.batchName) && r.type === 'expense' && r.cost
    )
    let spent = 0
    for (const a of allocations) {
      for (const r of batchRecords) {
        const cat = r.itemName || ''
        if (a.key === cat) spent += r.cost || 0
      }
    }
    return spent
  }, [records, batch.id, batch.batchName, allocations])

  return (
    <Animated.View entering={FadeInUp.duration(250).delay(100 + index * 50).springify()}>
      <TouchableOpacity
        style={s.historyCard}
        activeOpacity={0.7}
        onPress={() => router.push(`/batch-details/${batch.id}` as any)}
      >
        <View style={s.historyTop}>
          <View style={s.historyLeft}>
            <Text style={s.historyName}>{batch.batchName}</Text>
            <Text style={s.historyAmount}>{formatNaira(totalBudget)}</Text>
          </View>
          <View style={[s.badge, { backgroundColor: '#F1F5F9', borderColor: '#94A3B830' }]}>
            <View style={[s.badgeDot, { backgroundColor: '#94A3B8' }]} />
            <Text style={[s.badgeText, { color: '#94A3B8' }]}>Completed</Text>
          </View>
        </View>

        <View style={s.historyMeta}>
          <Text style={s.historyMetaText}>{batch.livestockType}</Text>
          <Text style={s.historyMetaText}>{batch.quantity} heads</Text>
          <Text style={s.historyMetaText}>{formatNaira(totalSpent)} spent</Text>
        </View>

        <View style={s.historyBottom}>
          <View style={s.historyViewWrap}>
            <Text style={s.historyViewText}>View Batch</Text>
            <GoonaIcon icon={Icons.chevronRight} size={12} color="#2E7D32" />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

function HistoryRow({ budget: b, index }: { budget: Budget; index: number }) {
  const totalAllocated = b.allocations.reduce((s, a) => s + a.amount, 0)
  const progress = b.totalAmount > 0 ? Math.min(totalAllocated / b.totalAmount, 1) : 0
  const status = getBudgetStatus(b)
  const setBudgetStatus = useBudgetStore((s) => s.setBudgetStatus)

  const canRestore = b.status === 'archived' || b.status === 'completed' || b.status === 'cancelled'

  return (
    <Animated.View entering={FadeInUp.duration(250).delay(100 + index * 50).springify()}>
      <TouchableOpacity
        style={s.historyCard}
        activeOpacity={0.7}
        onPress={() => router.push(`/(tabs)/recapitalization/budget-details?id=${b.id}`)}
      >
        <View style={s.historyTop}>
          <View style={s.historyLeft}>
            <Text style={s.historyName}>{b.name || b.period}</Text>
            <Text style={s.historyAmount}>{formatNaira(b.totalAmount)}</Text>
          </View>
          <StatusBadge {...status} />
        </View>

        <View style={s.historyBarBg}>
          <View style={[s.historyBarFill, { width: `${progress * 100}%`, backgroundColor: status.color }]} />
        </View>

        <View style={s.historyMeta}>
          <Text style={s.historyMetaText}>{b.period}</Text>
          <Text style={s.historyMetaText}>{b.allocations.length} categor{(b.allocations.length === 1 ? 'y' : 'ies')}</Text>
          <Text style={s.historyMetaText}>{Math.round(progress * 100)}% allocated</Text>
        </View>

        <View style={s.historyBottom}>
          {canRestore && (
            <TouchableOpacity
              style={s.historyRestoreBtn}
              activeOpacity={0.7}
              onPress={(e) => {
                e.stopPropagation()
                setBudgetStatus(b.id, 'active')
              }}
            >
              <GoonaIcon icon={Icons.refreshCw} size={12} color="#2E7D32" />
              <Text style={s.historyRestoreText}>Restore</Text>
            </TouchableOpacity>
          )}
          <View style={s.historyViewWrap}>
            <Text style={s.historyViewText}>View Details</Text>
            <GoonaIcon icon={Icons.chevronRight} size={12} color="#2E7D32" />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

// ─── FLOATING ACTION BUTTON ───

function CreateBudgetFAB({ insets }: { insets: { bottom: number } }) {
  const mounted = useRef(new RNAnimated.Value(0)).current
  const scale = useRef(new RNAnimated.Value(1)).current
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion)
    RNAnimated.spring(mounted, {
      toValue: 1,
      useNativeDriver: true,
      ...(reduceMotion ? { speed: 0 } : {}),
    }).start()
  }, [])

  const handlePress = useCallback(() => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    router.push('/(tabs)/recapitalization/budget-setup')
  }, [])

  const handlePressIn = useCallback(() => {
    RNAnimated.spring(scale, { toValue: 0.88, useNativeDriver: true }).start()
  }, [scale])

  const handlePressOut = useCallback(() => {
    RNAnimated.spring(scale, { toValue: 1, useNativeDriver: true }).start()
  }, [scale])

  const translateY = mounted.interpolate({
    inputRange: [0, 1],
    outputRange: [60, 0],
  })

  const animStyle = {
    opacity: mounted,
    transform: [{ translateY }, { scale }],
  }

  return (
    <RNAnimated.View style={[fabStyles.fab, { bottom: insets.bottom + 24, right: 20 }, animStyle]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <LinearGradient
          colors={['#16A34A', '#0F6B32']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={fabStyles.fabGradient}
        >
          <GoonaIcon icon={Icons.plus} size={20} color="#FFFFFF" />
          <Text style={styles.fabBottom}>Budget</Text>
        </LinearGradient>
      </TouchableOpacity>
    </RNAnimated.View>
  )
}

// ─── MAIN SCREEN ───

export default function BudgetScreen() {
  const insets = useSafeAreaInsets()

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollInner, { paddingTop: insets.top + 12, paddingBottom: 100 }]}
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
          <Text style={styles.topTitle}>Budget</Text>
          <View style={{ width: 38 }} />
        </Animated.View>

        {/* ─── SUMMARY HERO ─── */}
        <SummaryHero />

        {/* ─── BATCH BUDGETS ─── */}
        <BatchBudgetList />

        {/* ─── ACTIVE BUDGETS ─── */}
        <ActiveBudgetList />

        {/* ─── QUICK ACTIONS ─── */}
        <QuickActions />

        {/* ─── ANALYTICS ─── */}
        <EntryLink
          icon={Icons.barChart}
          iconBg="#F0FDF4"
          iconColor="#2E7D32"
          title="Budget Analytics"
          desc="View breakdowns, trends, and insights"
          route="/(tabs)/recapitalization/budget-analytics"
          delay={240}
        />

        {/* ─── CALENDAR ─── */}
        <EntryLink
          icon={Icons.calendar}
          iconBg="#FEF3C7"
          iconColor="#D97706"
          title="Budget Calendar"
          desc="View budgets on a timeline by month"
          route="/(tabs)/recapitalization/budget-calendar"
          delay={280}
        />

        {/* ─── BUDGET HISTORY ─── */}
        <BudgetHistorySection />

        <View style={{ height: 40 }} />
      </ScrollView>
      <CreateBudgetFAB insets={insets} />
    </View>
  )
}

const s = StyleSheet.create({
  // ─── BADGE ───
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20,
    borderWidth: 1, alignSelf: 'flex-start',
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 11, fontWeight: '700' },

  // ─── SECTION HEADER ───
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 24, paddingBottom: 14,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1B1B1B', letterSpacing: -0.3 },
  sectionCountWrap: {
    backgroundColor: '#F1F5F9', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8,
  },
  sectionCount: { fontSize: 12, fontWeight: '700', color: '#94A3B8' },

  // ─── HERO ───
  heroCard: {
    marginHorizontal: 16, borderRadius: 24, padding: 24,
  },
  heroTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20,
  },
  heroLabel: {
    fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.65)', marginBottom: 4,
  },
  heroAmount: {
    fontSize: 32, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.8,
  },
  heroBadgeWrap: { paddingTop: 4 },
  heroBarBg: {
    height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden', marginBottom: 20,
  },
  heroBarFill: { height: '100%', borderRadius: 5 },
  heroFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  heroFooterItem: { alignItems: 'center', flex: 1 },
  heroFooterLabel: {
    fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginBottom: 4,
  },
  heroFooterValue: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },

  // ─── HERO EMPTY ───
  heroEmpty: { alignItems: 'center', paddingVertical: 8 },
  heroEmptyIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(22,163,74,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  heroEmptyTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', marginBottom: 8 },
  heroEmptyDesc: {
    fontSize: 13, color: 'rgba(255,255,255,0.65)', textAlign: 'center',
    lineHeight: 18, marginBottom: 24, paddingHorizontal: 12,
  },
  heroEmptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#16A34A', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 14,
  },
  heroEmptyBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },

  // ─── BUDGET ROW ───
  budgetCard: {
    marginHorizontal: 16, marginBottom: 10,
    backgroundColor: '#FFFFFF', borderRadius: 22, padding: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  budgetCardTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14,
  },
  budgetCardLeft: {},
  budgetPeriod: { fontSize: 12, fontWeight: '600', color: '#94A3B8', marginBottom: 2 },
  budgetAmount: { fontSize: 22, fontWeight: '800', color: '#1B1B1B', letterSpacing: -0.5 },
  budgetBarBg: {
    height: 8, borderRadius: 4, backgroundColor: '#F1F5F9',
    overflow: 'hidden', marginBottom: 10,
  },
  budgetBarFill: { height: '100%', borderRadius: 4 },
  budgetMeta: {
    flexDirection: 'row', gap: 12, marginBottom: 12,
  },
  budgetMetaText: { fontSize: 11, fontWeight: '600', color: '#94A3B8' },
  budgetCardBottom: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9',
  },
  budgetRemaining: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  budgetViewBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  budgetViewBtnText: { fontSize: 12, fontWeight: '700', color: '#2E7D32' },

  // ─── QUICK ACTIONS ───
  actionsRow: {
    flexDirection: 'row', marginHorizontal: 16, gap: 10, paddingBottom: 4,
  },
  actionCard: {
    flex: 1, borderRadius: 18, paddingVertical: 18, alignItems: 'center', gap: 10,
  },
  actionIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 11, fontWeight: '700' },

  // ─── ENTRY LINK ───
  entryCard: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, backgroundColor: '#FFFFFF',
    borderRadius: 20, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },
  entryIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  entryBody: { flex: 1 },
  entryTitle: { fontSize: 14, fontWeight: '700', color: '#1B1B1B' },
  entryDesc: { fontSize: 11, color: '#94A3B8', marginTop: 2 },

  // ─── HISTORY ───
  historyHeaderBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14, paddingBottom: 8,
  },
  historyHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  historyHeaderTitle: { fontSize: 18, fontWeight: '800', color: '#1B1B1B', letterSpacing: -0.3 },
  historyHeaderCount: {
    backgroundColor: '#F1F5F9', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2,
  },
  historyHeaderCountText: { fontSize: 12, fontWeight: '700', color: '#94A3B8' },

  historyCard: {
    marginHorizontal: 16, marginBottom: 10,
    backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  historyTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12,
  },
  historyLeft: {},
  historyName: { fontSize: 14, fontWeight: '700', color: '#1B1B1B', marginBottom: 2 },
  historyAmount: { fontSize: 18, fontWeight: '800', color: '#1B1B1B', letterSpacing: -0.3 },
  historyBarBg: {
    height: 6, borderRadius: 3, backgroundColor: '#F1F5F9',
    overflow: 'hidden', marginBottom: 10,
  },
  historyBarFill: { height: '100%', borderRadius: 3 },
  historyMeta: {
    flexDirection: 'row', gap: 12, marginBottom: 12,
  },
  historyMetaText: { fontSize: 11, fontWeight: '600', color: '#94A3B8' },
  historyBottom: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9',
  },
  historyRestoreBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F0FDF4', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8,
  },
  historyRestoreText: { fontSize: 11, fontWeight: '700', color: '#2E7D32' },
  historyViewWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  historyViewText: { fontSize: 12, fontWeight: '700', color: '#2E7D32' },

  // ─── BATCH BUDGET CARD ───
  batchBudgetCard: {
    marginHorizontal: 16, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  batchBudgetTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12,
  },
  batchBudgetLeft: {},
  batchBudgetName: { fontSize: 15, fontWeight: '700', color: '#1B1B1B' },
  batchBudgetMeta: { fontSize: 12, fontWeight: '500', color: '#94A3B8', marginTop: 1 },
  batchBudgetStatus: {
    paddingVertical: 3, paddingHorizontal: 10, borderRadius: 12,
  },
  batchBudgetStatusText: { fontSize: 11, fontWeight: '700' },
  batchBudgetAmounts: {
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: '#F8FAF7', borderRadius: 14, padding: 12, marginBottom: 10,
  },
  batchBudgetAmountItem: { alignItems: 'center', flex: 1 },
  batchBudgetAmountLabel: { fontSize: 10, fontWeight: '600', color: '#94A3B8', marginBottom: 2 },
  batchBudgetAmountValue: { fontSize: 15, fontWeight: '800', color: '#1B1B1B' },
  batchBudgetBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  batchBudgetTrack: {
    flex: 1, height: 6, borderRadius: 3, backgroundColor: '#F1F5F9', overflow: 'hidden',
  },
  batchBudgetFill: { height: '100%', borderRadius: 3 },
  batchBudgetPct: { fontSize: 12, fontWeight: '700', width: 36, textAlign: 'right' },
})

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAF7' },
  scroll: { flex: 1 },
  scrollInner: { paddingBottom: 40 },

  topNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, height: 48, marginBottom: 8,
  },
  navBack: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center',
  },
  topTitle: { fontSize: 18, fontWeight: '700', color: '#1B1B1B', letterSpacing: -0.3 },
  fabBottom: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
})

const fabStyles = StyleSheet.create({
  fab: {
    position: 'absolute',
    zIndex: 100,
  },
  fabGradient: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 14, paddingHorizontal: 22,
    borderRadius: 28,
    shadowColor: '#16A34A', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 16, elevation: 8,
  },
})
