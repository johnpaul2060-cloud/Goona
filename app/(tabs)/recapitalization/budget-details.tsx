import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Alert,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import GoonaIcon from '../../../components/ui/GoonaIcon'
import { Icons } from '../../../shared/icons'
import Animated, { FadeInUp, Layout } from 'react-native-reanimated'
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

function daysBetween(a: number, b: number) {
  return Math.max(1, Math.round(Math.abs(b - a) / 86400000))
}

function StatusBadge({ status }: { status: string }) {
  const cfg = getStatusConfig(status)
  return (
    <View style={[s.badge, { backgroundColor: cfg.bg, borderColor: cfg.color + '30' }]}>
      <View style={[s.badgeDot, { backgroundColor: cfg.color }]} />
      <Text style={[s.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  )
}

function IconResolver({ iconKey, color, size }: { iconKey: string; color: string; size?: number }) {
  const IconComp = (Icons as any)[iconKey] ?? Icons.wallet
  return <GoonaIcon icon={IconComp} size={size ?? 22} color={color} />
}

function formatDate(ts: number) {
  const d = new Date(ts)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionTitle}>{title}</Text>
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

function isTerminal(status: string) {
  return status === 'completed' || status === 'archived' || status === 'cancelled'
}

function isMutable(status: string) {
  return !isTerminal(status)
}

// ─── HERO CARD ───

function HeroCard({ budget }: { budget: Budget }) {
  const totalAllocated = budget.allocations.reduce((s, a) => s + a.amount, 0)
  const remaining = budget.totalAmount - totalAllocated
  const progress = budget.totalAmount > 0 ? Math.min(totalAllocated / budget.totalAmount, 1) : 0
  const duration = daysBetween(budget.startDate, budget.endDate)
  const dailySpend = duration > 0 ? Math.round(budget.totalAmount / duration) : budget.totalAmount
  const daysLeft = Math.max(0, Math.round((budget.endDate - Date.now()) / 86400000))
  const cfg = getStatusConfig(budget.status)

  return (
    <LinearGradient colors={['#0F3D2E', '#1A6B4A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.heroCard}>
      <View style={s.heroTop}>
        <View style={s.heroIconWrap}>
          <IconResolver iconKey={budget.icon} color="#FFFFFF" size={24} />
        </View>
        <View style={s.heroTopRight}>
          <StatusBadge status={budget.status} />
        </View>
      </View>

      <Text style={s.heroName}>{budget.name}</Text>
      {budget.description ? <Text style={s.heroDesc}>{budget.description}</Text> : null}

      <View style={s.heroAmountRow}>
        <Text style={s.heroAmount}>{formatNaira(budget.totalAmount)}</Text>
        <Text style={s.heroDaily}>{formatNaira(dailySpend)}/day</Text>
      </View>

      <View style={s.heroBarBg}>
        <Animated.View
          entering={FadeInUp.duration(800).springify()}
          style={[s.heroBarFill, { width: `${progress * 100}%`, backgroundColor: cfg.color }]}
        />
      </View>

      <View style={s.heroFooter}>
        <View style={s.heroFooterItem}>
          <Text style={s.heroFooterLabel}>Allocated</Text>
          <Text style={s.heroFooterValue}>{formatNaira(totalAllocated)}</Text>
        </View>
        <View style={s.heroFooterItem}>
          <Text style={s.heroFooterLabel}>Remaining</Text>
          <Text style={[s.heroFooterValue, { color: remaining < 0 ? '#FCA5A5' : '#BBF7D0' }]}>
            {remaining < 0 ? `-${formatNaira(Math.abs(remaining))}` : formatNaira(remaining)}
          </Text>
        </View>
        <View style={s.heroFooterItem}>
          <Text style={s.heroFooterLabel}>Days Left</Text>
          <Text style={s.heroFooterValue}>{daysLeft}d</Text>
        </View>
      </View>
    </LinearGradient>
  )
}

// ─── TIMELINE ───

function TimelineCard({ budget }: { budget: Budget }) {
  const duration = daysBetween(budget.startDate, budget.endDate)
  const daysLeft = Math.max(0, Math.round((budget.endDate - Date.now()) / 86400000))
  const elapsed = duration - daysLeft
  const pct = duration > 0 ? Math.min(elapsed / duration, 1) * 100 : 0

  return (
    <View style={s.timelineCard}>
      <View style={s.timelineRow}>
        <View style={s.timelineDate}>
          <Text style={s.timelineDateLabel}>Start</Text>
          <Text style={s.timelineDateValue}>{formatDate(budget.startDate)}</Text>
        </View>
        <View style={s.timelineArrow}>
          <GoonaIcon icon={Icons.arrowRight} size={16} color="#94A3B8" />
        </View>
        <View style={s.timelineDate}>
          <Text style={s.timelineDateLabel}>End</Text>
          <Text style={s.timelineDateValue}>{formatDate(budget.endDate)}</Text>
        </View>
      </View>

      <View style={s.timelineBarBg}>
        <View style={[s.timelineBarFill, { width: `${pct}%` }]} />
      </View>

      <View style={s.timelineMeta}>
        <Text style={s.timelineMetaText}>{elapsed}d elapsed of {duration}d</Text>
        {daysLeft > 0 && <Text style={s.timelineMetaText}>{daysLeft}d remaining</Text>}
      </View>
    </View>
  )
}

// ─── CATEGORIES ───

function CategoriesCard({ budget }: { budget: Budget }) {
  if (budget.allocations.length === 0) {
    return (
      <View style={s.categoriesEmpty}>
        <GoonaIcon icon={Icons.listChecks} size={20} color="#94A3B8" />
        <Text style={s.categoriesEmptyText}>No categories allocated</Text>
      </View>
    )
  }

  const totalAllocated = budget.allocations.reduce((s, a) => s + a.amount, 0)

  return (
    <View>
      <View style={s.categoriesSummary}>
        <Text style={s.categoriesSummaryLabel}>{budget.allocations.length} category{budget.allocations.length > 1 ? 'ies' : 'y'}</Text>
        <Text style={s.categoriesSummaryValue}>{formatNaira(totalAllocated)}</Text>
      </View>
      {budget.allocations.map((a, i) => {
        const pct = budget.totalAmount > 0 ? (a.amount / budget.totalAmount) * 100 : 0
        return (
          <Animated.View
            key={a.key}
            entering={FadeInUp.duration(250).delay(100 + i * 50).springify()}
            layout={Layout.springify()}
          >
            <View style={s.categoryRow}>
              <View style={s.categoryLeft}>
                <Text style={s.categoryLabel}>{a.label}</Text>
              </View>
              <View style={s.categoryRight}>
                <Text style={s.categoryAmount}>{formatNaira(a.amount)}</Text>
                <Text style={s.categoryPct}>{pct.toFixed(1)}%</Text>
              </View>
            </View>
          </Animated.View>
        )
      })}
    </View>
  )
}

// ─── NOTES ───

function NotesCard({ budget }: { budget: Budget }) {
  if (!budget.notes) return null
  return (
    <View style={s.notesCard}>
      <View style={s.notesHeader}>
        <GoonaIcon icon={Icons.fileText} size={16} color="#64748B" />
        <Text style={s.notesTitle}>Notes</Text>
      </View>
      <Text style={s.notesText}>{budget.notes}</Text>
    </View>
  )
}

// ─── ACTIVITY (PLACEHOLDER) ───

function ActivityCard() {
  return (
    <View style={s.activityCard}>
      <GoonaIcon icon={Icons.clock} size={20} color="#CBD5E1" />
      <Text style={s.activityTitle}>Transaction Tracking</Text>
      <Text style={s.activityDesc}>Spending against this budget will appear here once you start recording transactions.</Text>
    </View>
  )
}

// ─── ACTIONS ───

function ActionsCard({ budget, onAction }: { budget: Budget; onAction: (action: string) => void }) {
  const mutable = isMutable(budget.status)

  return (
    <View style={s.actionsCard}>
      {mutable && (
        <TouchableOpacity
          style={s.actionBtnPrimary}
          activeOpacity={0.8}
          onPress={() => onAction('edit')}
        >
          <GoonaIcon icon={Icons.edit3} size={16} color="#FFFFFF" />
          <Text style={s.actionBtnPrimaryText}>Edit Budget</Text>
        </TouchableOpacity>
      )}

      <View style={s.actionsRow}>
        {budget.status === 'active' && (
          <TouchableOpacity
            style={s.actionBtnSecondary}
            activeOpacity={0.7}
            onPress={() => onAction('complete')}
          >
            <GoonaIcon icon={Icons.checkCircle} size={16} color="#16A34A" />
            <Text style={[s.actionBtnSecondaryText, { color: '#16A34A' }]}>Mark Complete</Text>
          </TouchableOpacity>
        )}

        {mutable && budget.status !== 'active' && (
          <TouchableOpacity
            style={s.actionBtnSecondary}
            activeOpacity={0.7}
            onPress={() => onAction('activate')}
          >
            <GoonaIcon icon={Icons.play} size={16} color="#3B82F6" />
            <Text style={[s.actionBtnSecondaryText, { color: '#3B82F6' }]}>Activate</Text>
          </TouchableOpacity>
        )}

        {!isTerminal(budget.status) && (
          <TouchableOpacity
            style={s.actionBtnSecondary}
            activeOpacity={0.7}
            onPress={() => onAction('archive')}
          >
            <GoonaIcon icon={Icons.save} size={16} color="#8B5CF6" />
            <Text style={[s.actionBtnSecondaryText, { color: '#8B5CF6' }]}>Archive</Text>
          </TouchableOpacity>
        )}

        {!isTerminal(budget.status) && (
          <TouchableOpacity
            style={[s.actionBtnSecondary, s.actionBtnDanger]}
            activeOpacity={0.7}
            onPress={() => onAction('cancel')}
          >
            <GoonaIcon icon={Icons.xCircle} size={16} color="#EF4444" />
            <Text style={[s.actionBtnSecondaryText, { color: '#EF4444' }]}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

// ─── MAIN SCREEN ───

function isValidBudget(b: Budget | undefined): b is Budget {
  if (!b) return false
  if (!b.id || !b.name) return false
  if (typeof b.totalAmount !== 'number' || typeof b.startDate !== 'number') return false
  return true
}

export default function BudgetDetailsScreen() {
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id: string }>()
  const budget = useBudgetStore((s) => s.budgets.find((b) => b.id === id))
  const updateBudget = useBudgetStore((s) => s.updateBudget)
  const setBudgetStatus = useBudgetStore((s) => s.setBudgetStatus)

  if (!isValidBudget(budget)) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
        <View style={styles.topNav}>
          <TouchableOpacity style={styles.navBack} activeOpacity={0.7} onPress={() => router.back()}>
            <GoonaIcon icon={Icons.arrowLeft} size={22} color="#1B1B1B" />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Budget Not Found</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={s.notFound}>
          <GoonaIcon icon={Icons.alertCircle} size={32} color="#94A3B8" />
          <Text style={s.notFoundText}>This budget could not be found or has invalid data.</Text>
        </View>
      </View>
    )
  }

  const handleAction = (action: string) => {
    switch (action) {
      case 'edit':
        router.push(`/(tabs)/recapitalization/budget-setup?id=${budget.id}`)
        break
      case 'complete':
        Alert.alert(
          'Mark as Complete',
          'This will mark the budget as completed. Continue?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Complete', style: 'default', onPress: () => setBudgetStatus(budget.id, 'completed') },
          ]
        )
        break
      case 'activate':
        Alert.alert(
          'Activate Budget',
          'This will set the budget to active status.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Activate', style: 'default', onPress: () => setBudgetStatus(budget.id, 'active') },
          ]
        )
        break
      case 'archive':
        Alert.alert(
          'Archive Budget',
          'Archived budgets are hidden from the main view but kept for history.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Archive', style: 'default', onPress: () => setBudgetStatus(budget.id, 'archived') },
          ]
        )
        break
      case 'cancel':
        Alert.alert(
          'Cancel Budget',
          'This will cancel the budget and mark it as cancelled. Continue?',
          [
            { text: 'No', style: 'cancel' },
            { text: 'Yes, Cancel', style: 'destructive', onPress: () => setBudgetStatus(budget.id, 'cancelled') },
          ]
        )
        break
    }
  }

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
          <Text style={styles.topTitle} numberOfLines={1}>{budget.name}</Text>
          <View style={{ width: 38 }} />
        </Animated.View>

        {/* ─── HERO ─── */}
        <View style={s.heroWrapper}>
          <HeroCard budget={budget} />
        </View>

        {/* ─── TIMELINE ─── */}
        <AnimatedCard delay={100}>
          <SectionHeader title="Timeline" />
          <TimelineCard budget={budget} />
        </AnimatedCard>

        {/* ─── CATEGORIES ─── */}
        <AnimatedCard delay={160}>
          <SectionHeader title="Categories" />
          <CategoriesCard budget={budget} />
        </AnimatedCard>

        {/* ─── NOTES ─── */}
        {budget.notes ? (
          <AnimatedCard delay={220}>
            <NotesCard budget={budget} />
          </AnimatedCard>
        ) : null}

        {/* ─── ACTIVITY ─── */}
        <AnimatedCard delay={280}>
          <SectionHeader title="Activity" />
          <ActivityCard />
        </AnimatedCard>

        {/* ─── ACTIONS ─── */}
        <AnimatedCard delay={340}>
          <ActionsCard budget={budget} onAction={handleAction} />
        </AnimatedCard>

        {/* ─── BUDGET ID (subtle) ─── */}
        <Text style={s.budgetId}>{budget.id}</Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  // ─── BADGE ───
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 11, fontWeight: '700' },

  // ─── SECTION HEADER ───
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

  // ─── NOT FOUND ───
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  notFoundText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600',
  },

  // ─── HERO ───
  heroWrapper: { paddingHorizontal: 16 },
  heroCard: {
    borderRadius: 24,
    padding: 22,
    marginTop: 8,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  heroIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTopRight: {},
  heroName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  heroDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 18,
    marginBottom: 16,
  },
  heroAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
    marginBottom: 16,
  },
  heroAmount: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.8,
  },
  heroDaily: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
  },
  heroBarBg: {
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
    marginBottom: 16,
  },
  heroBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  heroFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroFooterItem: { alignItems: 'center', flex: 1 },
  heroFooterLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 4,
  },
  heroFooterValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // ─── TIMELINE ───
  timelineCard: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  timelineDate: { flex: 1 },
  timelineDateLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 4,
  },
  timelineDateValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1B1B1B',
  },
  timelineArrow: { paddingTop: 12, marginHorizontal: 8 },
  timelineBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
    marginBottom: 10,
  },
  timelineBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#2E7D32',
  },
  timelineMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timelineMetaText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },

  // ─── CATEGORIES ───
  categoriesEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  categoriesEmptyText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
  },
  categoriesSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: '#F8FAF7',
    borderRadius: 12,
    padding: 12,
  },
  categoriesSummaryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  categoriesSummaryValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1B1B1B',
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  categoryLeft: {},
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1B1B1B',
  },
  categoryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1B1B1B',
  },
  categoryPct: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    minWidth: 40,
    textAlign: 'right',
  },

  // ─── NOTES ───
  notesCard: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1B1B1B',
  },
  notesText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },

  // ─── ACTIVITY ───
  activityCard: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1B1B1B',
  },
  activityDesc: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
  },

  // ─── ACTIONS ───
  actionsCard: {
    marginHorizontal: 16,
    gap: 10,
    paddingBottom: 4,
  },
  actionBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2E7D32',
    borderRadius: 16,
    paddingVertical: 14,
  },
  actionBtnPrimaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionBtnSecondaryText: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionBtnDanger: {
    borderColor: '#FECACA',
  },

  // ─── BUDGET ID ───
  budgetId: {
    fontSize: 10,
    color: '#E2E8F0',
    textAlign: 'center',
    marginTop: 20,
  },
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF7',
  },
  scroll: { flex: 1 },
  scrollInner: {
    paddingBottom: 40,
  },
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
  topTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B1B1B',
    letterSpacing: -0.3,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
})
