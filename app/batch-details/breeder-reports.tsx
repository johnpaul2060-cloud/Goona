import React, { useMemo } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { router, useLocalSearchParams } from 'expo-router'
import { Icons } from '../../shared/icons'
import GoonaIcon from '../../components/ui/GoonaIcon'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { FadeInUp } from 'react-native-reanimated'
import { useBatchStore } from '../../store/useBatchStore'
import { useBreederEggStore } from '../../store/useBreederEggStore'
import { useHatchStore } from '../../store/useHatchStore'
import { computeFlockStats, formatFlockAgeShort, getFlockDate } from '../../utils/breeder'
import { buildBreederReport, type WeeklyProduction } from '../../utils/breederReports'
import { hatchStatusMeta } from '../../utils/hatch'
import { CATEGORY_THEME } from '../../shared/category-theme'
import type { IconComponent } from '../../shared/icons'

const t = CATEGORY_THEME.breeder

function fmtDate(dateIso: string): string {
  const d = new Date(`${dateIso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

function barHeight(eggs: number, peak: number): number {
  if (peak <= 0) return 3
  return Math.max(4, Math.min(96, Math.round((eggs / peak) * 96)))
}

function ProductionChart({ weeks }: { weeks: WeeklyProduction[] }) {
  const peak = Math.max(...weeks.map((w) => w.eggs), 1)
  return (
    <>
      <View style={styles.chartLegend}>
        <View style={styles.chartLegendItem}>
          <View style={[styles.chartLegendDot, { backgroundColor: t.accent }]} />
          <Text style={styles.chartLegendText}>Eggs</Text>
        </View>
        <View style={styles.chartLegendItem}>
          <View style={[styles.chartLegendDot, { backgroundColor: '#CBD5E1' }]} />
          <Text style={styles.chartLegendText}>Settable</Text>
        </View>
        <Text style={styles.chartLegendHint}>Weekly totals · W1 = flock placement week</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chartScroller}>
        <View style={styles.chartRow}>
          {weeks.map((w) => (
            <View key={w.weekIndex} style={styles.chartCol}>
              <Text
                style={styles.chartVal}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
              >
                {w.eggs > 0 ? w.eggs.toLocaleString() : ''}
              </Text>
              <View style={styles.chartBarStack}>
                <View style={{ height: barHeight(w.settable, peak), backgroundColor: w.settable > 0 ? '#CBD5E1' : 'transparent', borderRadius: 4 }} />
                <View style={{ height: barHeight(w.eggs, peak), backgroundColor: t.accent, borderRadius: 4, marginTop: 2 }} />
              </View>
              <Text style={styles.chartWk}>W{w.weekIndex}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </>
  )
}

function KpiTile({ icon, iconBg, iconColor, value, label, caption }: {
  icon: IconComponent
  iconBg: string
  iconColor: string
  value: string
  label: string
  caption?: string
}) {
  return (
    <View style={styles.kpiTile}>
      <View style={[styles.kpiIconWrap, { backgroundColor: iconBg }]}>
        <GoonaIcon icon={icon} size={15} color={iconColor} />
      </View>
      <Text style={styles.kpiValue} numberOfLines={1}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
      {caption ? <Text style={styles.kpiCaption} numberOfLines={2}>{caption}</Text> : null}
    </View>
  )
}

function HatchComparison({ report }: { report: ReturnType<typeof buildBreederReport> }) {
  const rows = report.hatches
  const aggregates = report.hatchAggregates
  return (
    <View>
      <View style={styles.aggRow}>
        <View style={styles.aggBlock}>
          <View style={[styles.aggIconWrap, { backgroundColor: t.accentLight }]}>
            <GoonaIcon icon={Icons.checkCircle} size={14} color={t.accent} />
          </View>
          <View style={styles.aggBody}>
            <Text style={styles.aggLabel}>Hatch Success (all batches)</Text>
            <Text style={styles.aggValue}>
              {aggregates.overallHatchSuccessPct != null ? `${aggregates.overallHatchSuccessPct.toFixed(1)}%` : '—'}
              <Text style={styles.aggSub}>  · {aggregates.totalChicks} chicks of {aggregates.totalEggsSet} eggs</Text>
            </Text>
          </View>
        </View>
        <View style={styles.aggBlock}>
          <View style={[styles.aggIconWrap, { backgroundColor: '#EEF3FF' }]}>
            <GoonaIcon icon={Icons.target} size={14} color="#1A56FF" />
          </View>
          <View style={styles.aggBody}>
            <Text style={styles.aggLabel}>Fertility (tracked only)</Text>
            <Text style={styles.aggValue}>
              {aggregates.overallFertilityPct != null ? `${aggregates.overallFertilityPct.toFixed(1)}%` : '—'}
              <Text style={styles.aggSub}>  · {aggregates.trackedBatches} of {aggregates.recordedBatches} batches</Text>
            </Text>
          </View>
        </View>
        <View style={styles.aggBlock}>
          <View style={[styles.aggIconWrap, { backgroundColor: '#FFFBEB' }]}>
            <GoonaIcon icon={Icons.activity} size={14} color="#D97706" />
          </View>
          <View style={styles.aggBody}>
            <Text style={styles.aggLabel}>Hatchability (of fertile)</Text>
            <Text style={styles.aggValue}>
              {aggregates.overallHatchabilityPct != null ? `${aggregates.overallHatchabilityPct.toFixed(1)}%` : '—'}
              <Text style={styles.aggSub}>  · {aggregates.trackedFertileEggs} fertile eggs</Text>
            </Text>
          </View>
        </View>
        <Text style={styles.aggNote}>
          Weighted across batches (Σ chicks ÷ Σ eggs) — never an average of batch percentages. Fertility counts
          only batches with a tracked break-out; missing fertility is never treated as 0.
        </Text>
      </View>

      {rows.map((r) => {
        const meta = hatchStatusMeta(r.status)
        return (
          <View key={r.id} style={styles.compRow}>
            <View style={styles.compTop}>
              <View style={[styles.compStatusDot, { backgroundColor: meta.color }]} />
              <Text style={styles.compName} numberOfLines={1}>{r.name}</Text>
              {r.belowAverage ? (
                <View style={styles.compFlag}>
                  <GoonaIcon icon={Icons.alertTriangle} size={10} color="#B45309" />
                  <Text style={styles.compFlagText}>Below avg</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.compMeta}>
              Set {fmtDate(r.setDate)} · {r.eggsSet} eggs · {r.chicksHatched} chicks
            </Text>
            <View style={styles.compStats}>
              <View style={styles.compStat}>
                <Text style={[styles.compStatV, r.status === 'failed' && styles.compStatVFailed]}>
                  {r.hatchSuccessPct != null ? `${r.hatchSuccessPct.toFixed(1)}%` : '—'}
                </Text>
                <Text style={styles.compStatL}>Success</Text>
              </View>
              <View style={styles.compStat}>
                <Text style={styles.compStatV}>{r.fertilityPct != null ? `${r.fertilityPct.toFixed(1)}%` : '—'}</Text>
                <Text style={styles.compStatL}>Fertility</Text>
              </View>
              <View style={styles.compStat}>
                <Text style={styles.compStatV}>{r.hatchabilityPct != null ? `${r.hatchabilityPct.toFixed(1)}%` : '—'}</Text>
                <Text style={styles.compStatL}>Hatchability</Text>
              </View>
            </View>
          </View>
        )
      })}
    </View>
  )
}

export default function BreederReportsScreen() {
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id: string }>()

  const storeBatch = useBatchStore((s) => s.getBatchById(id ?? ''))
  const flockEggs = useBreederEggStore((s) => s.eggs)
  const flockHatches = useHatchStore((s) => s.hatches)

  const report = useMemo(() => {
    if (!storeBatch || storeBatch.model !== 'breeder') return null
    const stats = computeFlockStats(storeBatch)
    return buildBreederReport(
      flockEggs.filter((r) => r.batchId === storeBatch.id),
      flockHatches.filter((h) => h.breederFlockId === storeBatch.id),
      stats.currentHens,
      getFlockDate(storeBatch),
    )
  }, [storeBatch, flockEggs, flockHatches])

  const flockStats = useMemo(() => (storeBatch && storeBatch.model === 'breeder' ? computeFlockStats(storeBatch) : null), [storeBatch])
  const flockAgeShort = storeBatch && storeBatch.model === 'breeder' ? formatFlockAgeShort(storeBatch) : ''

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 32 + insets.bottom }} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={t.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + 14 }]}
        >
          <View style={styles.heroOrb1} />
          <View style={styles.heroOrb2} />
          <View style={styles.topbar}>
            <TouchableOpacity style={styles.tbBtn} activeOpacity={0.7} onPress={() => router.back()}>
              <GoonaIcon icon={Icons.arrowLeft} size={19} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.tbTitleWrap}>
              <Text style={styles.tbTitle}>Breeder Reports</Text>
              <Text style={styles.tbSub} numberOfLines={1}>{storeBatch?.batchName ?? 'Breeder flock'}</Text>
            </View>
          </View>
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatV} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{flockAgeShort}</Text>
              <Text style={styles.heroStatL}>Age</Text>
            </View>
            <View style={styles.heroStatDiv} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatV} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{flockStats?.currentHens ?? '—'}</Text>
              <Text style={styles.heroStatL}>Hens</Text>
            </View>
            <View style={styles.heroStatDiv} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatV} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{report ? report.lifetime.weeksInProduction : '—'}</Text>
              <Text style={styles.heroStatL}>Weeks</Text>
            </View>
            <View style={styles.heroStatDiv} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatV} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{report ? report.lifetime.activeDays : '—'}</Text>
              <Text style={styles.heroStatL}>Days logged</Text>
            </View>
          </View>
        </LinearGradient>

        {/* lifetime KPIs */}
        <Animated.View entering={FadeInUp.duration(400).delay(80).springify()}>
          <View style={styles.recordsCard}>
            <Text style={styles.secTitle}>Lifetime Egg Performance</Text>
            {report && report.lifetime.totalEggs > 0 ? (
              <View style={styles.kpiGrid}>
                <KpiTile icon={Icons.egg} iconBg={t.accentLight} iconColor={t.accent} value={report.lifetime.totalEggs.toLocaleString()} label="Total eggs" caption="All-time collected" />
                {report.lifetime.activeDays > 1 ? (
                  <KpiTile icon={Icons.clock} iconBg="#EEF3FF" iconColor="#1A56FF" value={String(report.lifetime.avgEggsPerActiveDay)} label="Avg per logging day" />
                ) : (
                  <KpiTile icon={Icons.clock} iconBg="#EEF3FF" iconColor="#1A56FF" value="—" label="Avg per logging day" caption="Shown once 2+ days are logged" />
                )}
                <KpiTile icon={Icons.activity} iconBg="#FFFBEB" iconColor="#D97706" value={report.lifetime.henDayPct != null ? `${report.lifetime.henDayPct.toFixed(1)}%` : '—'} label="Hen-day production" caption="Eggs ÷ (current hens × days in production)" />
                <KpiTile icon={Icons.target} iconBg={t.accentLight} iconColor={t.accent} value={report.lifetime.totalSettable.toLocaleString()} label="Settable eggs" />
                <KpiTile icon={Icons.checkCircle} iconBg="#EEF3FF" iconColor="#1A56FF" value={report.lifetime.settablePct != null ? `${report.lifetime.settablePct.toFixed(1)}%` : '—'} label="Settable rate" caption="Of total eggs collected" />
                <KpiTile icon={Icons.trendingUp} iconBg="#FFFBEB" iconColor="#D97706" value={report.series.peakWeek != null ? `W${report.series.peakWeek}` : '—'} label="Peak week" caption={report.series.peakEggs > 0 ? `${report.series.peakEggs.toLocaleString()} eggs` : undefined} />
              </View>
            ) : (
              <View style={styles.emptyBox}>
                <GoonaIcon icon={Icons.egg} size={22} color="#CBD5E1" />
                <Text style={styles.emptyText}>No egg records yet</Text>
                <Text style={styles.emptyHint}>Log daily collections on Batch Detail to see lifetime KPIs.</Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* production over time */}
        <Animated.View entering={FadeInUp.duration(400).delay(140).springify()}>
          <View style={styles.recordsCard}>
            <Text style={styles.secTitle}>Production Over Time</Text>
            <Text style={styles.secDesc}>Eggs and settable eggs per week, by flock age.</Text>
            {report && report.series.weeks.length > 0 ? (
              <ProductionChart weeks={report.series.weeks} />
            ) : (
              <View style={styles.emptyBox}>
                <GoonaIcon icon={Icons.activity} size={22} color="#CBD5E1" />
                <Text style={styles.emptyText}>No production yet</Text>
                <Text style={styles.emptyHint}>The weekly curve builds automatically from logged egg collections.</Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* hatch performance */}
        <Animated.View entering={FadeInUp.duration(400).delay(200).springify()}>
          <View style={styles.recordsCard}>
            <Text style={styles.secTitle}>Hatch Batch Performance</Text>
            <Text style={styles.secDesc}>Compare runs and spot poor performers.</Text>
            {report ? (
              report.hatches.length > 0 ? (
                <HatchComparison report={report} />
              ) : (
                <View style={styles.emptyBox}>
                  <GoonaIcon icon={Icons.target} size={22} color="#CBD5E1" />
                  <Text style={styles.emptyText}>No hatch batches</Text>
                  <Text style={styles.emptyHint}>Set eggs on Batch Detail to start incubation runs.</Text>
                </View>
              )
            ) : null}
          </View>
        </Animated.View>

        <Text style={styles.footerNote}>
          Read-only view — everything here is derived live from your egg records, hatch batches and flock
          details. Nothing is stored by this report.
        </Text>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F9F4' },

  scroll: { flex: 1 },

  hero: {
    borderRadius: 32, padding: 24, marginTop: 14, overflow: 'hidden',
    shadowColor: t.accentDark, shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.28, shadowRadius: 45, elevation: 8,
  },
  heroOrb1: {
    position: 'absolute', top: -20, right: -10, width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.08)', zIndex: 0,
  },
  heroOrb2: {
    position: 'absolute', bottom: -30, left: -20, width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.05)', zIndex: 0,
  },

  topbar: { flexDirection: 'row', alignItems: 'center', gap: 14, zIndex: 1 },
  tbBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.14)' },
  tbTitleWrap: { flex: 1 },
  tbTitle: { fontFamily: 'Poppins', fontWeight: '700', fontSize: 18, color: '#FFFFFF' },
  tbSub: { fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,0.75)', marginTop: 1 },

  heroStats: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 22, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.14)', zIndex: 1,
  },
  heroStat: { alignItems: 'center', flex: 1 },
  heroStatV: { fontSize: 15, fontWeight: '800', color: '#FFFFFF', fontVariant: ['tabular-nums'] },
  heroStatL: { fontSize: 9, fontWeight: '600', color: 'rgba(255,255,255,0.75)', marginTop: 3, letterSpacing: 0.3, textTransform: 'uppercase' as any, textAlign: 'center' },
  heroStatDiv: { width: 1, height: 26, backgroundColor: 'rgba(255,255,255,0.14)' },

  recordsCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, marginTop: 14,
    borderWidth: 1, borderColor: '#E8EFE6',
    shadowColor: t.accentDark, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 16, elevation: 2,
  },
  secTitle: { fontSize: 14, fontWeight: '800', color: '#15291A' },
  secDesc: { fontSize: 11, fontWeight: '500', color: '#64748B', marginTop: 2 },

  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  kpiTile: {
    flex: 1, minWidth: '44%', backgroundColor: '#F8FAF7', borderRadius: 16,
    padding: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)',
  },
  kpiIconWrap: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  kpiValue: { fontSize: 17, fontWeight: '800', color: '#15291A', marginTop: 8, fontVariant: ['tabular-nums'] },
  kpiLabel: { fontSize: 10, fontWeight: '700', color: '#64748B', marginTop: 1 },
  kpiCaption: { fontSize: 9, fontWeight: '500', color: '#94A3B8', marginTop: 2, lineHeight: 12 },

  chartLegend: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  chartLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  chartLegendDot: { width: 9, height: 9, borderRadius: 3 },
  chartLegendText: { fontSize: 10, fontWeight: '600', color: '#64748B' },
  chartLegendHint: { marginLeft: 'auto', fontSize: 9, fontWeight: '500', color: '#94A3B8' },

  chartScroller: { marginTop: 14, marginHorizontal: -18 },
  chartRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 18, paddingBottom: 4 },
  // fixed-height columns → nothing can spill past the chart bounds
  chartCol: { alignItems: 'center', width: 42, height: 134 },
  chartVal: {
    height: 16, fontSize: 9, fontWeight: '700', color: '#64748B',
    fontVariant: ['tabular-nums'], textAlign: 'center',
  },
  chartBarStack: { justifyContent: 'flex-end', height: 102 },
  chartWk: { height: 16, fontSize: 9, fontWeight: '600', color: '#94A3B8', marginTop: 2 },

  aggregateRow: {},
  aggRow: { gap: 12, marginTop: 14 },
  aggBlock: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  aggIconWrap: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  aggBody: { flex: 1 },
  aggLabel: { fontSize: 10, fontWeight: '700', color: '#64748B', letterSpacing: 0.3, textTransform: 'uppercase' as any },
  aggValue: { fontSize: 18, fontWeight: '800', color: '#15291A', marginTop: 1, fontVariant: ['tabular-nums'] },
  aggSub: { fontSize: 11, fontWeight: '600', color: '#94A3B8' },
  aggNote: { fontSize: 10, fontWeight: '500', color: '#94A3B8', lineHeight: 14, marginTop: 2 },

  compRow: {
    backgroundColor: '#F8FAF7', borderWidth: 1, borderColor: '#E8EFE6', borderRadius: 16,
    padding: 12, marginTop: 10,
  },
  compTop: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  compStatusDot: { width: 8, height: 8, borderRadius: 4 },
  compName: { flex: 1, fontSize: 13, fontWeight: '700', color: '#15291A' },
  compFlag: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FFFBEB', borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 },
  compFlagText: { fontSize: 9, fontWeight: '800', color: '#B45309', letterSpacing: 0.2, textTransform: 'uppercase' as any },
  compMeta: { fontSize: 10.5, fontWeight: '500', color: '#64748B', marginTop: 4 },
  compStats: { flexDirection: 'row', gap: 8, marginTop: 10 },
  compStat: { flex: 1, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8EFE6', borderRadius: 10, paddingVertical: 7, alignItems: 'center' },
  compStatV: { fontSize: 13, fontWeight: '800', color: '#15291A', fontVariant: ['tabular-nums'] },
  compStatVFailed: { color: '#DC2626' },
  compStatL: { fontSize: 9, fontWeight: '600', color: '#94A3B8', marginTop: 1, textTransform: 'uppercase' as any, letterSpacing: 0.3 },

  emptyBox: { alignItems: 'center', paddingVertical: 26, gap: 4, marginTop: 10 },
  emptyText: { fontSize: 13, fontWeight: '700', color: '#64748B', marginTop: 4 },
  emptyHint: { fontSize: 11, fontWeight: '500', color: '#94A3B8', textAlign: 'center', lineHeight: 15 },

  footerNote: { fontSize: 10, fontWeight: '500', color: '#94A3B8', textAlign: 'center', marginTop: 20, lineHeight: 14 },
})