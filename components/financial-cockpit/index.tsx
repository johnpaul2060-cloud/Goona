import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated as RNAnimated } from 'react-native'
import ReAnimated, {
  useSharedValue, useAnimatedStyle, withSpring, withRepeat,
  withSequence, FadeIn, FadeOut, Layout as ReLayout,
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import type { PriorityLevel } from '../../store/farmPriorityEngine'

/* ══════════════════════════════════════════════════════════════
   AnimatedMetricValue — count-up spring animation for numbers
   ══════════════════════════════════════════════════════════════ */

function formatNaira(n: number): string {
  if (n >= 1000000) return `₦${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `₦${(n / 1000).toFixed(0)}K`
  return `₦${n}`
}

function formatInt(n: number): string {
  return n.toLocaleString('en-NG')
}

interface MetricValueProps {
  value: number
  prefix?: string
  suffix?: string
  variant?: 'compact' | 'full'
  formatter?: (n: number) => string
}

export function AnimatedMetricValue({ value, prefix = '', suffix = '', variant = 'full', formatter }: MetricValueProps) {
  const anim = useRef(new RNAnimated.Value(0)).current
  const [display, setDisplay] = useState(value)

  useEffect(() => {
    const listenerId = anim.addListener(({ value: v }) => {
      setDisplay(Math.round(v))
    })
    RNAnimated.spring(anim, {
      toValue: value,
      damping: 25,
      stiffness: 120,
      useNativeDriver: false,
    }).start()
    return () => anim.removeListener(listenerId)
  }, [value])

  const fmt = formatter
    ? formatter(display)
    : variant === 'compact'
      ? formatNaira(display)
      : `₦${formatInt(display)}`

  return (
    <Text style={cockpitStyles.metricValue} numberOfLines={1} adjustsFontSizeToFit>
      {prefix}{fmt}{suffix}
    </Text>
  )
}

/* ══════════════════════════════════════════════════════════════
   AnimatedProgressBar — gradient flow + spring width
   ══════════════════════════════════════════════════════════════ */

interface ProgressBarProps {
  progress: number
  colors?: string[]
  height?: number
}

export function AnimatedProgressBar({ progress, colors, height = 8 }: ProgressBarProps) {
  const widthSv = useSharedValue(0)

  useEffect(() => {
    widthSv.value = withSpring(progress, { damping: 22, stiffness: 130 })
  }, [progress])

  const barStyle = useAnimatedStyle(() => ({
    width: `${Math.min(Math.max(widthSv.value, 0), 100)}%`,
  }))

  const defaultColors: [string, string] = useMemo(() => {
    if (colors && colors.length >= 2) return colors as [string, string]
    if (progress >= 90) return ['#EF4444', '#DC2626']
    if (progress >= 70) return ['#F59E0B', '#D97706']
    return ['#16A34A', '#15803D']
  }, [progress, colors])

  return (
    <View style={[cockpitStyles.progressBarBg, { height }]}>
      <ReAnimated.View style={[cockpitStyles.progressBarFill, barStyle]}>
        <LinearGradient
          colors={defaultColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[cockpitStyles.progressGradient, { height }]}
        />
      </ReAnimated.View>
    </View>
  )
}

/* ══════════════════════════════════════════════════════════════
   AnimatedKpiCard — live metric tile
   ══════════════════════════════════════════════════════════════ */

interface KpiCardProps {
  label: string
  value: number
  progress?: number
  color: string
  bg: string
  formatter?: (n: number) => string
  risk?: PriorityLevel
}

export function AnimatedKpiCard({ label, value, progress, color, bg, formatter, risk }: KpiCardProps) {
  const pulse = useSharedValue(1)
  const isActive = risk === 'critical' || risk === 'high'

  useEffect(() => {
    if (isActive) {
      pulse.value = withRepeat(
        withSequence(
          withSpring(0.7, { damping: 8, stiffness: 80 }),
          withSpring(1, { damping: 8, stiffness: 80 }),
        ),
        -1, true,
      )
    } else {
      pulse.value = 1
    }
  }, [isActive])

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }))

  return (
    <ReAnimated.View
      entering={FadeIn.duration(300)}
      style={[cockpitStyles.kpiCard, { backgroundColor: bg }]}
    >
      <Text style={[cockpitStyles.kpiLabel, { color }]}>{label}</Text>
      <ReAnimated.View style={isActive ? pulseStyle : undefined}>
        <AnimatedMetricValue value={value} variant="compact" formatter={formatter} />
      </ReAnimated.View>
      {progress !== undefined && (
        <View style={cockpitStyles.kpiProgressWrap}>
          <AnimatedProgressBar progress={progress} height={4} />
        </View>
      )}
    </ReAnimated.View>
  )
}

/* ══════════════════════════════════════════════════════════════
   AnimatedStatusBar — live status header with pulse
   ══════════════════════════════════════════════════════════════ */

type CockpitStatus = 'on_track' | 'at_risk' | 'critical'

const STATUS_CONFIG: Record<CockpitStatus, { label: string; color: string; bg: string }> = {
  on_track: { label: 'On Track', color: '#16A34A', bg: '#F0FDF4' },
  at_risk: { label: 'At Risk', color: '#F59E0B', bg: '#FFFBEB' },
  critical: { label: 'Critical', color: '#EF4444', bg: '#FEF2F2' },
}

interface StatusBarProps {
  status: CockpitStatus
  title: string
  subtitle?: string
  lastUpdated?: string
}

export function AnimatedStatusBar({ status, title, subtitle, lastUpdated }: StatusBarProps) {
  const cfg = STATUS_CONFIG[status]
  const pulse = useSharedValue(1)

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withSpring(0.5, { damping: 6, stiffness: 60 }),
        withSpring(1, { damping: 6, stiffness: 60 }),
      ),
      -1, true,
    )
  }, [])

  const dotPulse = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }))

  return (
    <View style={[cockpitStyles.statusBar, { backgroundColor: cfg.bg, borderColor: cfg.color + '30' }]}>
      <View style={cockpitStyles.statusLeft}>
        <ReAnimated.View style={[cockpitStyles.statusDot, { backgroundColor: cfg.color }, dotPulse]} />
        <View>
          <View style={cockpitStyles.statusRow}>
            <Text style={[cockpitStyles.statusLabel, { color: cfg.color }]}>{cfg.label}</Text>
            <View style={cockpitStyles.liveBadge}>
              <Text style={cockpitStyles.liveBadgeText}>LIVE</Text>
            </View>
          </View>
          <Text style={cockpitStyles.statusTitle}>{title}</Text>
          {subtitle && <Text style={cockpitStyles.statusSub}>{subtitle}</Text>}
        </View>
      </View>
      {lastUpdated && (
        <Text style={cockpitStyles.statusTimestamp}>{lastUpdated}</Text>
      )}
    </View>
  )
}

/* ══════════════════════════════════════════════════════════════
   Driver item data types
   ══════════════════════════════════════════════════════════════ */

export interface DriverItem {
  emoji: string
  label: string
  pct: number
  funded: number
  remaining: number
  target: number
  color: string
  bg: string
}

export interface BudgetItem {
  emoji: string
  label: string
  pct: number
  allocated: number
  spent: number
  remaining: number
  budget: number
  color: string
  bg: string
}

/* ══════════════════════════════════════════════════════════════
   AnimatedDriverRow — single animated recap driver item
   ══════════════════════════════════════════════════════════════ */

function AnimatedDriverRow({ item, pct: pctOverride }: { item: DriverItem; pct?: number }) {
  const pct = pctOverride ?? item.pct
  const riskLevel: CockpitStatus = pct >= 100 ? 'on_track' : pct >= 80 ? 'at_risk' : pct >= 60 ? 'at_risk' : 'critical'

  return (
    <ReAnimated.View
      entering={FadeIn.duration(300)}
      layout={ReLayout.springify()}
      style={[
        cockpitStyles.driverRowCard,
        riskLevel === 'critical' && cockpitStyles.driverCritical,
      ]}
    >
      <View style={cockpitStyles.driverTop}>
        <View style={cockpitStyles.driverLabelRow}>
          <Text style={cockpitStyles.driverEmoji}>{item.emoji}</Text>
          <Text style={cockpitStyles.driverLabel}>{item.label}</Text>
        </View>
        <AnimatedMetricValue value={pct} suffix="%" variant="full" formatter={(n) => String(n)} />
      </View>
      <AnimatedProgressBar progress={pct} />
      <View style={cockpitStyles.driverAmounts}>
        <Text style={cockpitStyles.driverAmountLabel}>
          ₦{item.funded.toLocaleString('en-NG')} funded
        </Text>
        <Text style={[cockpitStyles.driverAmountRemain, { color: item.remaining <= 0 ? '#16A34A' : '#94A3B8' }]}>
          {item.remaining <= 0 ? 'Complete' : `₦${item.remaining.toLocaleString('en-NG')} remaining`}
        </Text>
      </View>
    </ReAnimated.View>
  )
}

/* ══════════════════════════════════════════════════════════════
   AnimatedBudgetRow — single animated budget item
   ══════════════════════════════════════════════════════════════ */

function AnimatedBudgetRow({ item }: { item: BudgetItem }) {
  const pct = item.pct
  const overspent = pct > 100
  const riskLevel: CockpitStatus = overspent ? 'critical' : pct >= 85 ? 'at_risk' : 'on_track'

  return (
    <ReAnimated.View
      entering={FadeIn.duration(300)}
      layout={ReLayout.springify()}
      style={[
        cockpitStyles.driverRowCard,
        riskLevel === 'critical' && cockpitStyles.driverCritical,
      ]}
    >
      <View style={cockpitStyles.driverTop}>
        <View style={cockpitStyles.driverLabelRow}>
          <Text style={cockpitStyles.driverEmoji}>{item.emoji}</Text>
          <Text style={cockpitStyles.driverLabel}>{item.label}</Text>
        </View>
        <AnimatedMetricValue value={Math.min(pct, 100)} suffix="%" variant="full" formatter={(n) => String(n)} />
      </View>
      <AnimatedProgressBar progress={Math.min(pct, 100)} />
      <View style={cockpitStyles.driverAmounts}>
        <Text style={cockpitStyles.driverAmountLabel}>
          ₦{item.spent.toLocaleString('en-NG')} used of ₦{item.budget.toLocaleString('en-NG')}
        </Text>
        <Text style={[cockpitStyles.driverAmountRemain, { color: overspent ? '#EF4444' : '#94A3B8' }]}>
          {overspent ? `Overspent by ₦${Math.abs(item.remaining).toLocaleString('en-NG')}` : `₦${item.remaining.toLocaleString('en-NG')} left`}
        </Text>
      </View>
    </ReAnimated.View>
  )
}

/* ══════════════════════════════════════════════════════════════
   RecapFundingCockpit — Full Recap Funding Module
   ══════════════════════════════════════════════════════════════ */

interface RecapCockpitProps {
  items: DriverItem[]
}

export function RecapFundingCockpit({ items }: RecapCockpitProps) {
  const totalFunded = useMemo(() => items.reduce((s, i) => s + i.funded, 0), [items])
  const totalTarget = useMemo(() => items.reduce((s, i) => s + i.target, 0), [items])
  const totalRemaining = useMemo(() => items.reduce((s, i) => s + i.remaining, 0), [items])
  const totalSpent = totalFunded - totalRemaining

  const overallPct = totalTarget > 0 ? Math.round((totalFunded / totalTarget) * 100) : 0
  const status: CockpitStatus = overallPct >= 90 ? 'on_track' : overallPct >= 60 ? 'at_risk' : 'critical'

  return (
    <ReAnimated.View entering={FadeIn.duration(400)} layout={ReLayout.springify()} style={cockpitStyles.cockpitCard}>
      <AnimatedStatusBar
        status={status}
        title="Cycle Intelligence"
        subtitle={`${overallPct}% funded toward next cycle`}
        lastUpdated="Updated just now"
      />

      <View style={cockpitStyles.kpiRow}>
        <AnimatedKpiCard label="Total Funded" value={totalFunded} color="#16A34A" bg="#F0FDF4" risk={status === 'critical' ? 'critical' : undefined} />
        <AnimatedKpiCard label="Total Spent" value={totalSpent} color="#F59E0B" bg="#FFFBEB" />
        <AnimatedKpiCard label="Remaining" value={totalRemaining} color="#1A56FF" bg="#EEF3FF" progress={overallPct} risk={totalRemaining <= 0 ? 'critical' : undefined} />
      </View>

      <View style={cockpitStyles.driversList}>
        {items.map((item) => (
          <AnimatedDriverRow key={item.label} item={item} />
        ))}
      </View>
    </ReAnimated.View>
  )
}

/* ══════════════════════════════════════════════════════════════
   BudgetFundingCockpit — Full Budget Funding Module
   ══════════════════════════════════════════════════════════════ */

interface BudgetCockpitProps {
  items: BudgetItem[]
}

export function BudgetFundingCockpit({ items }: BudgetCockpitProps) {
  const totalBudget = useMemo(() => items.reduce((s, i) => s + i.budget, 0), [items])
  const totalSpent = useMemo(() => items.reduce((s, i) => s + i.spent, 0), [items])
  const totalRemaining = useMemo(() => items.reduce((s, i) => s + i.remaining, 0), [items])

  const overallPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0
  const status: CockpitStatus = overallPct >= 90 ? 'critical' : overallPct >= 70 ? 'at_risk' : 'on_track'

  return (
    <ReAnimated.View entering={FadeIn.duration(400)} layout={ReLayout.springify()} style={cockpitStyles.cockpitCard}>
      <AnimatedStatusBar
        status={status}
        title="Operational Cashflow"
        subtitle={`${overallPct}% utilized · ₦${formatInt(totalSpent)} spent of ₦${formatInt(totalBudget)}`}
        lastUpdated="Updated just now"
      />

      <View style={cockpitStyles.kpiRow}>
        <AnimatedKpiCard label="Total Budget" value={totalBudget} color="#7C3AED" bg="#F3E8FF" />
        <AnimatedKpiCard label="Total Spent" value={totalSpent} color="#EF4444" bg="#FEF2F2" progress={overallPct} risk={overallPct >= 90 ? 'critical' : undefined} />
        <AnimatedKpiCard label="Remaining" value={totalRemaining} color="#16A34A" bg="#F0FDF4" risk={totalRemaining <= 0 ? 'critical' : undefined} />
      </View>

      <View style={cockpitStyles.driversList}>
        {items.map((item) => (
          <AnimatedBudgetRow key={item.label} item={item} />
        ))}
      </View>
    </ReAnimated.View>
  )
}

/* ══════════════════════════════════════════════════════════════
   Collapsed Summary Components
   ══════════════════════════════════════════════════════════════ */

function useInsight(items: DriverItem[] | BudgetItem[], isBudget?: boolean): string {
  return useMemo(() => {
    if (isBudget) {
      const bItems = items as BudgetItem[]
      const totalBudget = bItems.reduce((s, i) => s + i.budget, 0)
      const totalSpent = bItems.reduce((s, i) => s + i.spent, 0)
      const pct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0
      const critical = bItems.filter(i => i.pct > 90)
      if (critical.length > 0) return `Budget usage high — monitor ${critical[0].label.toLowerCase()}`
      if (pct > 80) return `${pct}% utilized — review spending soon`
      return `Remaining ₦${(totalBudget - totalSpent).toLocaleString('en-NG')} available`
    }
    const dItems = items as DriverItem[]
    const total = dItems.reduce((s, i) => s + i.target, 0)
    const funded = dItems.reduce((s, i) => s + i.funded, 0)
    const pct = total > 0 ? Math.round((funded / total) * 100) : 0
    const remaining = dItems.reduce((s, i) => s + i.remaining, 0)
    if (pct >= 90) return `Cycle ${pct}% funded — On track for next cycle`
    if (pct >= 60) return `Cycle ${pct}% funded — Keep building reserves`
    return `Remaining ₦${remaining.toLocaleString('en-NG')} until next cycle stability`
  }, [items, isBudget])
}

/* ─── Collapsed Recap Summary ─── */

export function CollapsedRecapSummary({ items }: { items: DriverItem[] }) {
  const total = useMemo(() => items.reduce((s, i) => s + i.target, 0), [items])
  const funded = useMemo(() => items.reduce((s, i) => s + i.funded, 0), [items])
  const pct = total > 0 ? Math.round((funded / total) * 100) : 0
  const remaining = useMemo(() => items.reduce((s, i) => s + i.remaining, 0), [items])
  const status: CockpitStatus = pct >= 90 ? 'on_track' : pct >= 60 ? 'at_risk' : 'critical'
  const cfg = STATUS_CONFIG[status]
  const insight = useInsight(items, false)

  return (
    <View style={[cockpitStyles.collapsedCard, { borderLeftColor: cfg.color }]}>
      <View style={cockpitStyles.collapsedRow}>
        <View style={cockpitStyles.collapsedTitleRow}>
          <Text style={cockpitStyles.collapsedTitle}>Recap Funding</Text>
          <View style={[cockpitStyles.collapsedChip, { backgroundColor: cfg.bg, borderColor: cfg.color + '40' }]}>
            <View style={[cockpitStyles.collapsedChipDot, { backgroundColor: cfg.color }]} />
            <Text style={[cockpitStyles.collapsedChipText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>
        <View style={cockpitStyles.collapsedMeta}>
          <View style={cockpitStyles.collapsedPctRow}>
            <AnimatedMetricValue value={pct} suffix="%" variant="full" formatter={(n) => String(n)} />
            <View style={cockpitStyles.collapsedMiniBar}>
              <AnimatedProgressBar progress={pct} height={4} />
            </View>
          </View>
          <View style={cockpitStyles.collapsedKpiRow}>
            <Text style={cockpitStyles.collapsedKpi}>
              <Text style={{ fontWeight: '700' }}>₦{formatNaira(funded)}</Text> funded
            </Text>
            <Text style={cockpitStyles.collapsedKpiSep}>·</Text>
            <Text style={cockpitStyles.collapsedKpi}>
              <Text style={{ fontWeight: '700' }}>₦{formatNaira(remaining)}</Text> remaining
            </Text>
          </View>
        </View>
      </View>
      <View style={cockpitStyles.collapsedInsightRow}>
        <Text style={cockpitStyles.collapsedInsightText}>{insight}</Text>
      </View>
    </View>
  )
}

/* ─── Collapsed Budget Summary ─── */

export function CollapsedBudgetSummary({ items }: { items: BudgetItem[] }) {
  const totalBudget = useMemo(() => items.reduce((s, i) => s + i.budget, 0), [items])
  const totalSpent = useMemo(() => items.reduce((s, i) => s + i.spent, 0), [items])
  const pct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0
  const remaining = totalBudget - totalSpent
  const status: CockpitStatus = pct >= 90 ? 'critical' : pct >= 70 ? 'at_risk' : 'on_track'
  const cfg = STATUS_CONFIG[status]
  const insight = useInsight(items, true)
  const overspent = pct > 100

  return (
    <View style={[cockpitStyles.collapsedCard, { borderLeftColor: overspent ? '#EF4444' : cfg.color }]}>
      <View style={cockpitStyles.collapsedRow}>
        <View style={cockpitStyles.collapsedTitleRow}>
          <Text style={cockpitStyles.collapsedTitle}>Budget Funding</Text>
          <View style={[cockpitStyles.collapsedChip, { backgroundColor: cfg.bg, borderColor: cfg.color + '40' }]}>
            <View style={[cockpitStyles.collapsedChipDot, { backgroundColor: overspent ? '#EF4444' : cfg.color }]} />
            <Text style={[cockpitStyles.collapsedChipText, { color: overspent ? '#EF4444' : cfg.color }]}>
              {overspent ? 'Overspent' : cfg.label}
            </Text>
          </View>
        </View>
        <View style={cockpitStyles.collapsedMeta}>
          <View style={cockpitStyles.collapsedPctRow}>
            <AnimatedMetricValue value={Math.min(pct, 100)} suffix="%" variant="full" formatter={(n) => String(n)} />
            <View style={cockpitStyles.collapsedMiniBar}>
              <AnimatedProgressBar progress={Math.min(pct, 100)} height={4} />
            </View>
          </View>
          <View style={cockpitStyles.collapsedKpiRow}>
            <Text style={cockpitStyles.collapsedKpi}>
              <Text style={{ fontWeight: '700' }}>₦{formatNaira(totalSpent)}</Text> spent
            </Text>
            <Text style={cockpitStyles.collapsedKpiSep}>·</Text>
            <Text style={cockpitStyles.collapsedKpi}>
              <Text style={{ fontWeight: '700' }}>₦{formatNaira(Math.abs(remaining))}</Text> {overspent ? 'over' : 'left'}
            </Text>
          </View>
        </View>
      </View>
      <View style={cockpitStyles.collapsedInsightRow}>
        <Text style={cockpitStyles.collapsedInsightText}>{insight}</Text>
      </View>
    </View>
  )
}

/* ══════════════════════════════════════════════════════════════
   NextCycleCockpit — Collapsible Readiness Intelligence Module
   Powered by FSRS (Farm Start Readiness Score) engine
   ══════════════════════════════════════════════════════════════ */

import type { FSRSResult } from '../../store/fsrsEngine'

const FSRS_EMOJI_MAP: Record<string, string> = {
  fully_ready: '\u2705',
  mostly_ready: '\u2705',
  partially_ready: '\u26A0\uFE0F',
  not_ready: '\uD83D\uDD34',
}

interface NextCycleCockpitProps {
  expanded: boolean
  onToggle: () => void
  items: Record<string, boolean>
  onItemToggle: (key: string) => void
  checklistDefs: { key: string; label: string; emoji: string }[]
  fsrs: FSRSResult
}

export function NextCycleCockpit({
  expanded, onToggle, items, onItemToggle, checklistDefs,
  fsrs,
}: NextCycleCockpitProps) {
  const completed = checklistDefs.filter(d => items[d.key]).length
  const total = checklistDefs.length
  const allComplete = completed === total
  const missingCount = total - completed
  const cfg = { label: fsrs.levelLabel, color: fsrs.levelColor, bg: fsrs.levelBg }

  return (
    <ReAnimated.View layout={ReLayout.springify()} style={cockpitStyles.nextCycleCard}>
      {/* ─── Collapsed Summary ─── */}
      {!expanded && (
        <TouchableOpacity activeOpacity={0.7} onPress={onToggle}>
          <View style={[cockpitStyles.nextCycleCollapsed, { borderLeftColor: cfg.color }]}>
            <View style={cockpitStyles.collapsedRow}>
              <View style={cockpitStyles.collapsedTitleRow}>
                <View style={[cockpitStyles.collapsedChip, { backgroundColor: cfg.bg, borderColor: cfg.color + '40' }]}>
                  <View style={[cockpitStyles.collapsedChipDot, { backgroundColor: cfg.color }]} />
                  <Text style={[cockpitStyles.collapsedChipText, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
              </View>
              <View style={cockpitStyles.collapsedMeta}>
                <View style={cockpitStyles.collapsedPctRow}>
                  <AnimatedMetricValue value={fsrs.totalScore} suffix="%" variant="full" formatter={(n) => String(n)} />
                  <View style={cockpitStyles.collapsedMiniBar}>
                    <AnimatedProgressBar progress={fsrs.totalScore} height={4} />
                  </View>
                </View>
                <View style={cockpitStyles.collapsedKpiRow}>
                  <Text style={cockpitStyles.collapsedKpi}>
                    <Text style={{ fontWeight: '700' }}>{completed}/{total}</Text> items
                  </Text>
                  <Text style={cockpitStyles.collapsedKpiSep}>·</Text>
                  <Text style={cockpitStyles.collapsedKpi}>
                    <Text style={{ fontWeight: '700' }}>{fsrs.restartLabel}</Text>
                  </Text>
                  {missingCount > 0 && (
                    <>
                      <Text style={cockpitStyles.collapsedKpiSep}>·</Text>
                      <Text style={[cockpitStyles.collapsedKpi, { color: fsrs.level === 'not_ready' ? '#EF4444' : '#F59E0B' }]}>
                        {missingCount} pending
                      </Text>
                    </>
                  )}
                </View>
              </View>
            </View>
            <View style={cockpitStyles.collapsedInsightRow}>
              <Text style={cockpitStyles.collapsedInsightText}>{fsrs.insight}</Text>
            </View>
          </View>
        </TouchableOpacity>
      )}

      {/* ─── Expanded Full Cockpit ─── */}
      {expanded && (
        <ReAnimated.View entering={FadeIn.duration(300)} layout={ReLayout.springify()}>
          {/* Header */}
          <TouchableOpacity activeOpacity={0.7} onPress={onToggle}>
            <View style={[cockpitStyles.nextCycleHeader, { borderBottomColor: cfg.color + '20' }]}>
              <View style={cockpitStyles.nextCycleHeaderLeft}>
                <View style={cockpitStyles.nextCycleScoreRing}>
                  <AnimatedMetricValue value={fsrs.totalScore} suffix="%" variant="full" formatter={(n) => String(n)} />
                </View>
                <View>
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 0 }}>
                    <View style={[cockpitStyles.collapsedChip, { backgroundColor: cfg.bg, borderColor: cfg.color + '40' }]}>
                      <View style={[cockpitStyles.collapsedChipDot, { backgroundColor: cfg.color }]} />
                      <Text style={[cockpitStyles.collapsedChipText, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>
                    <View style={[cockpitStyles.collapsedChip, { backgroundColor: '#EEF3FF', borderColor: '#1A56FF40' }]}>
                      <Text style={[cockpitStyles.collapsedChipText, { color: '#1A56FF' }]}>Restart: {fsrs.restartLabel}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </TouchableOpacity>

          {/* KPI Row */}
          <View style={cockpitStyles.kpiRow}>
            <View style={[cockpitStyles.kpiCard, { backgroundColor: '#FAFAFA' }]}>
              <Text style={[cockpitStyles.kpiLabel, { color: '#94A3B8' }]}>COMPLETION</Text>
              <Text style={cockpitStyles.metricValue}>{completed}/{total}</Text>
            </View>
            <View style={[cockpitStyles.kpiCard, { backgroundColor: '#FAFAFA' }]}>
              <Text style={[cockpitStyles.kpiLabel, { color: '#94A3B8' }]}>MISSING</Text>
              <Text style={[cockpitStyles.metricValue, { color: missingCount > 0 ? '#F59E0B' : '#16A34A' }]}>{missingCount}</Text>
            </View>
            <View style={[cockpitStyles.kpiCard, { backgroundColor: '#FAFAFA' }]}>
              <Text style={[cockpitStyles.kpiLabel, { color: '#94A3B8' }]}>RESTART</Text>
              <Text style={[cockpitStyles.metricValue, { fontSize: 14 }]}>{fsrs.restartLabel}</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={cockpitStyles.nextCycleProgressSection}>
            <View style={cockpitStyles.nextCycleProgressHeader}>
              <Text style={cockpitStyles.nextCycleProgressLabel}>Readiness Progress</Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: cfg.color }}>{fsrs.totalScore}%</Text>
            </View>
            <AnimatedProgressBar progress={fsrs.totalScore} />
          </View>

          {/* Insight */}
          <View style={cockpitStyles.nextCycleInsightBox}>
            <Text style={cockpitStyles.nextCycleInsightIcon}>{FSRS_EMOJI_MAP[fsrs.level] ?? '\u26A0\uFE0F'}</Text>
            <Text style={cockpitStyles.nextCycleInsightText}>{fsrs.insight}</Text>
          </View>

          {/* Missing Categories Summary */}
          {fsrs.missingFactors.length > 0 && (
            <View style={cockpitStyles.nextCycleMissingSection}>
              <View style={cockpitStyles.nextCycleMissingHeader}>
                <Text style={cockpitStyles.nextCycleMissingTitle}>Key Missing Factors</Text>
                <Text style={cockpitStyles.nextCycleMissingCount}>{fsrs.missingFactors.length}</Text>
              </View>
              {fsrs.missingFactors.slice(0, 4).map((factor) => (
                <View key={factor} style={cockpitStyles.nextCycleMissingRow}>
                  <View style={cockpitStyles.nextCycleMissingDot} />
                  <Text style={cockpitStyles.nextCycleMissingFactor}>{factor}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Checklist */}
          <View style={cockpitStyles.nextCycleChecklist}>
            {allComplete ? (
              <View style={cockpitStyles.nextCycleCompleteBox}>
                <Text style={cockpitStyles.nextCycleCompleteIcon}>✅</Text>
                <Text style={cockpitStyles.nextCycleCompleteTitle}>All Items Complete</Text>
                <Text style={cockpitStyles.nextCycleCompleteDesc}>Your farm is financially and operationally prepared for the next production cycle.</Text>
              </View>
            ) : (
              checklistDefs.map((def) => {
                const done = items[def.key]
                return (
                  <TouchableOpacity key={def.key} style={[cockpitStyles.nextCycleRow, done && cockpitStyles.nextCycleRowDone]} activeOpacity={0.7} onPress={() => onItemToggle(def.key)}>
                    <View style={[cockpitStyles.nextCycleCheck, done && cockpitStyles.nextCycleCheckDone]}>
                      {done && <Text style={{ color: 'white', fontSize: 12, fontWeight: '800' }}>✓</Text>}
                    </View>
                    <Text style={cockpitStyles.nextCycleCheckEmoji}>{def.emoji}</Text>
                    <Text style={[cockpitStyles.nextCycleCheckLabel, done && cockpitStyles.nextCycleCheckLabelDone]}>{def.label}</Text>
                  </TouchableOpacity>
                )
              })
            )}
          </View>
        </ReAnimated.View>
      )}
    </ReAnimated.View>
  )
}

/* ══════════════════════════════════════════════════════════════
   Cockpit Styles
   ══════════════════════════════════════════════════════════════ */

const cockpitStyles = StyleSheet.create({
  cockpitCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 2,
  },

  /* Status Bar */
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  liveBadge: {
    backgroundColor: '#EF444420',
    paddingHorizontal: 5, paddingVertical: 1,
    borderRadius: 4,
  },
  liveBadgeText: { fontSize: 8, fontWeight: '800', color: '#EF4444', letterSpacing: 1 },
  statusTitle: { fontSize: 16, fontWeight: '700', color: '#1B1B1B', marginTop: 1 },
  statusSub: { fontSize: 11, color: '#64748B', marginTop: 1 },
  statusTimestamp: { fontSize: 10, color: '#94A3B8', flexShrink: 0 },

  /* KPI Row */
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  kpiCard: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  kpiLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  metricValue: { fontSize: 18, fontWeight: '800', color: '#1B1B1B' },
  kpiProgressWrap: { width: '100%', marginTop: 4 },

  /* Progress Bar */
  progressBarBg: {
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressGradient: {
    width: '100%',
    borderRadius: 4,
  },

  /* Driver List */
  driversList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
  },
  driverRowCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  driverCritical: {
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  driverTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  driverLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  driverEmoji: { fontSize: 16 },
  driverLabel: { fontSize: 13, fontWeight: '600', color: '#1B1B1B' },
  driverAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  driverAmountLabel: { fontSize: 10, fontWeight: '500', color: '#94A3B8' },
  driverAmountRemain: { fontSize: 10, fontWeight: '600' },

  /* ─── Collapsed State ─── */
  collapsedCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 14,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 4,
  },
  collapsedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  collapsedTitleRow: {
    flexDirection: 'column',
    gap: 6,
    flexShrink: 0,
  },
  collapsedTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  collapsedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  collapsedChipDot: { width: 6, height: 6, borderRadius: 3 },
  collapsedChipText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  collapsedMeta: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 4,
  },
  collapsedPctRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  collapsedMiniBar: {
    width: 60,
  },
  collapsedKpiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  collapsedKpi: {
    fontSize: 11,
    color: '#64748B',
  },
  collapsedKpiSep: {
    fontSize: 11,
    color: '#CBD5E1',
  },
  collapsedInsightRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  collapsedInsightText: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
  },

  /* ─── Next Cycle Cockpit ─── */
  nextCycleCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 2,
  },
  nextCycleCollapsed: {
    padding: 14,
    borderLeftWidth: 4,
    borderRadius: 20,
  },
  nextCycleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  nextCycleHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nextCycleScoreRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#16A34A',
  },
  nextCycleProgressSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  nextCycleProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  nextCycleProgressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  nextCycleInsightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
  },
  nextCycleInsightIcon: { fontSize: 16 },
  nextCycleInsightText: {
    flex: 1,
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
    fontStyle: 'italic',
  },
  nextCycleChecklist: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 8,
  },
  nextCycleCompleteBox: {
    alignItems: 'center',
    padding: 20,
    gap: 8,
  },
  nextCycleCompleteIcon: { fontSize: 32 },
  nextCycleCompleteTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16A34A',
  },
  nextCycleCompleteDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  nextCycleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  nextCycleRowDone: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  nextCycleCheck: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextCycleCheckDone: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  nextCycleCheckEmoji: { fontSize: 16 },
  nextCycleCheckLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  nextCycleCheckLabelDone: {
    color: '#16A34A',
    textDecorationLine: 'line-through',
  },

  /* Missing Factors Section */
  nextCycleMissingSection: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  nextCycleMissingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  nextCycleMissingTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  nextCycleMissingCount: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F59E0B',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    overflow: 'hidden',
  },
  nextCycleMissingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 3,
  },
  nextCycleMissingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
  },
  nextCycleMissingFactor: {
    fontSize: 11,
    color: '#78350F',
  },
})
