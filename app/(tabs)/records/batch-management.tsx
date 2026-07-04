import { memo, useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import { router } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { FadeInUp } from 'react-native-reanimated'
import GoonaIcon from '../../../components/ui/GoonaIcon'
import { Icons } from '../../../shared/icons'
import { Batch, useBatchStore } from '../../../store/useBatchStore'

type FilterKey = 'all' | 'active' | 'harvest' | 'attention'
type PriorityKind = 'harvest' | 'health' | 'phase'
type HealthTone = 'green' | 'amber' | 'red'

type EnrichedBatch = Batch & {
  elapsedWeeks: number
  currentWeek: number
  totalWeeks: number
  progress: number
  daysToHarvest: number
  isReady: boolean
  isNearHarvest: boolean
  hasHealthFlag: boolean
  phaseIndex: number
  phaseName: string
  phases: string[]
  healthTone: HealthTone
  statusText: string
  statusColor: string
  statusBg: string
  accent: string
  actionScore: number
  priorityReason?: string
  typeLabel: string
  typeIcon: typeof Icons.egg
}

type AttentionItem = {
  id: string
  kind: PriorityKind
  batch: EnrichedBatch
  reason: string
  title: string
  detail: string
  action: string
  icon: typeof Icons.egg
  color: string
  bg: string
}

const DAY_MS = 24 * 60 * 60 * 1000
const WEEK_MS = 7 * DAY_MS
const NEAR_HARVEST_DAYS = 14

const FILTER_LABELS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'harvest', label: 'Near Harvest' },
  { key: 'attention', label: 'Attention' },
]

const QUICK_ACTIONS = [
  { label: 'New Batch', icon: Icons.plus, bg: '#EAF6EC', color: '#2E7D32', route: '/create-batch' },
  { label: 'Records', icon: Icons.clipboardList, bg: '#EAF0FB', color: '#3B66D6', route: '/daily-records' },
  { label: 'Reports', icon: Icons.barChart3, bg: '#FBF2E3', color: '#C2740A', route: '/batches' },
  { label: 'Feed', icon: Icons.wheat, bg: '#F0EAFB', color: '#7C3AD6', route: '/daily-records' },
] as const

function parseWeeks(duration: string): number {
  const parsed = parseInt(duration, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 8
}

function elapsedWeeks(startDate: string): number {
  const time = new Date(startDate).getTime()
  if (!Number.isFinite(time)) return 0
  return Math.max(0, Math.floor((Date.now() - time) / WEEK_MS))
}

function elapsedDays(startDate: string): number {
  const time = new Date(startDate).getTime()
  if (!Number.isFinite(time)) return 0
  return Math.max(0, Math.floor((Date.now() - time) / DAY_MS))
}

function isLayer(batch: Batch): boolean {
  const text = `${batch.livestockType} ${batch.batchName}`.toLowerCase()
  return text.includes('layer') || text.includes('egg') || text.includes('pullet')
}

function getPhaseData(batch: Batch, progress: number): { phases: string[]; phaseIndex: number; phaseName: string } {
  const phases = isLayer(batch) ? ['Brooding', 'Laying', 'Peak', 'Harvest'] : ['Brooding', 'Growing', 'Finishing', 'Harvest']
  const phaseIndex = progress >= 86 ? 3 : progress >= 62 ? 2 : progress >= 25 ? 1 : 0
  return { phases, phaseIndex, phaseName: phases[phaseIndex] }
}

function deriveHealthFlag(batch: Batch, progress: number, currentWeek: number): boolean {
  const medPerBird = batch.quantity > 0 ? batch.medicationCost / batch.quantity : 0
  const feedPerBird = batch.quantity > 0 ? batch.feedCost / batch.quantity : 0
  const broilerGrowthCheck = !isLayer(batch) && currentWeek >= 4 && currentWeek <= 5 && progress < 60
  return medPerBird > 90 || feedPerBird > 2500 || broilerGrowthCheck
}

function enrichBatch(batch: Batch): EnrichedBatch {
  const totalWeeks = parseWeeks(batch.duration)
  const elapsed = elapsedWeeks(batch.startDate)
  const daysElapsed = elapsedDays(batch.startDate)
  const cycleDays = totalWeeks * 7
  const progress = Math.min(100, Math.max(0, Math.round((daysElapsed / Math.max(cycleDays, 1)) * 100)))
  const daysToHarvest = Math.max(0, cycleDays - daysElapsed)
  const currentWeek = Math.min(totalWeeks, Math.max(1, elapsed + 1))
  const isReady = daysToHarvest === 0 || progress >= 100
  const isNearHarvest = isReady || daysToHarvest <= NEAR_HARVEST_DAYS || progress >= 85
  const hasHealthFlag = deriveHealthFlag(batch, progress, currentWeek)
  const phaseData = getPhaseData(batch, progress)
  const typeLayer = isLayer(batch)
  const typeLabel = typeLayer ? 'Layers' : 'Broilers'
  const typeIcon = typeLayer ? Icons.egg : Icons.sprout
  const healthTone: HealthTone = hasHealthFlag ? 'red' : isNearHarvest ? 'amber' : 'green'
  const accent = healthTone === 'red' ? '#EF4444' : healthTone === 'amber' ? '#F59E0B' : '#2E7D32'
  const statusText = hasHealthFlag ? 'Attention' : isNearHarvest ? 'Near Harvest' : 'Active'
  const statusBg = hasHealthFlag ? 'rgba(239,68,68,0.10)' : isNearHarvest ? 'rgba(245,158,11,0.14)' : 'rgba(46,125,50,0.10)'
  const statusColor = hasHealthFlag ? '#DC2626' : isNearHarvest ? '#B45309' : '#2E7D32'
  const phaseBoundary = !isReady && [25, 62, 86].some((point) => Math.abs(progress - point) <= 3)
  const actionScore = (isReady ? 400 : 0) + (isNearHarvest ? 220 : 0) + (hasHealthFlag ? 180 : 0) + (phaseBoundary ? 80 : 0) + progress

  return {
    ...batch,
    elapsedWeeks: elapsed,
    currentWeek,
    totalWeeks,
    progress,
    daysToHarvest,
    isReady,
    isNearHarvest,
    hasHealthFlag,
    healthTone,
    statusText,
    statusColor,
    statusBg,
    accent,
    actionScore,
    priorityReason: hasHealthFlag ? 'Water and medication metrics need a health check' : undefined,
    typeIcon,
    typeLabel,
    ...phaseData,
  }
}

function buildAttention(enriched: EnrichedBatch[]): AttentionItem[] {
  const items: AttentionItem[] = []
  enriched.forEach((batch) => {
    if (batch.isNearHarvest) {
      items.push({
        id: `${batch.id}-harvest`,
        kind: 'harvest',
        batch,
        reason: batch.isReady ? 'Ready to harvest' : 'Harvest window',
        title: `${batch.batchName} - Week ${batch.currentWeek}/${batch.totalWeeks}`,
        detail: batch.isReady ? 'Cycle complete - harvest window open now' : `${batch.daysToHarvest} days to harvest - prepare sales and logistics`,
        action: batch.isReady ? 'Log' : 'Plan',
        icon: Icons.egg,
        color: '#F59E0B',
        bg: '#FFF6E6',
      })
    }
    if (batch.hasHealthFlag) {
      items.push({
        id: `${batch.id}-health`,
        kind: 'health',
        batch,
        reason: 'Health check',
        title: batch.batchName,
        detail: batch.priorityReason || 'Health metrics need review before the next phase',
        action: 'View',
        icon: Icons.droplets,
        color: '#EF4444',
        bg: '#FDEDED',
      })
    }
    const onPhaseBoundary = !batch.isReady && batch.progress > 0 && [25, 62, 86].some((point) => Math.abs(batch.progress - point) <= 3)
    if (onPhaseBoundary) {
      items.push({
        id: `${batch.id}-phase`,
        kind: 'phase',
        batch,
        reason: 'Phase transition',
        title: `${batch.batchName} entering ${batch.phaseName}`,
        detail: 'Review feed schedule and update production tasks',
        action: 'Open',
        icon: Icons.trendingUp,
        color: '#2E7D32',
        bg: '#EAF6EC',
      })
    }
  })
  const rank = { harvest: 0, health: 1, phase: 2 }
  return items.sort((a, b) => rank[a.kind] - rank[b.kind] || b.batch.actionScore - a.batch.actionScore).slice(0, 3)
}

function filterBatch(batch: EnrichedBatch, filter: FilterKey): boolean {
  if (filter === 'all') return true
  if (filter === 'active') return batch.status === 'active' && !batch.isNearHarvest && !batch.hasHealthFlag
  if (filter === 'harvest') return batch.isNearHarvest
  return batch.hasHealthFlag
}

function goToBatch(batch: EnrichedBatch) {
  router.push({ pathname: '/batch-details/[id]', params: { id: batch.id } } as any)
}

function runPriorityAction(item: AttentionItem) {
  if (item.kind === 'harvest') {
    router.push({ pathname: '/daily-records', params: { batch: item.batch.batchName, intent: 'harvest' } } as any)
    return
  }
  goToBatch(item.batch)
}

function formatStatusLine(ready: number, attention: number, avgProgress: number): string {
  if (ready > 0) return `Updated just now - ${ready} batch${ready === 1 ? '' : 'es'} ready to harvest`
  if (attention > 0) return `Updated just now - ${attention} batch${attention === 1 ? '' : 'es'} need attention`
  return `Updated just now - average cycle progress ${avgProgress}%`
}

function formatHarvest(batch: EnrichedBatch): string {
  if (batch.isReady) return 'Ready'
  return `${batch.daysToHarvest} day${batch.daysToHarvest === 1 ? '' : 's'}`
}

function StatTile({ label, value, icon, colors, iconColor, active, badge, onPress }: {
  label: string
  value: string
  icon: typeof Icons.egg
  colors: [string, string]
  iconColor: string
  active: boolean
  badge?: { text: string; color: string; bg: string }
  onPress: () => void
}) {
  return (
    <Pressable onPress={onPress} style={[styles.statTile, active && styles.statTileActive]}>
      <LinearGradient colors={colors} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      {badge && <View style={[styles.statBadge, { backgroundColor: badge.bg }]}><Text style={[styles.statBadgeText, { color: badge.color }]}>{badge.text}</Text></View>}
      <View style={[styles.statIcon, { backgroundColor: `${iconColor}1F` }]}><GoonaIcon icon={icon} size={19} color={iconColor} /></View>
      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Pressable>
  )
}

function SectionHeader({ title, right }: { title: string; right?: string }) {
  return <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{title}</Text>{!!right && <Text style={styles.sectionRight}>{right}</Text>}</View>
}

function AttentionRow({ item }: { item: AttentionItem }) {
  return (
    <Pressable onPress={() => runPriorityAction(item)} style={styles.attentionWrap}>
      <LinearGradient colors={[item.bg, '#FFFDF8']} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      <View style={[styles.attentionRail, { backgroundColor: item.color }]} />
      <View style={[styles.attentionIcon, { backgroundColor: `${item.color}20` }]}><GoonaIcon icon={item.icon} size={20} color={item.color} /></View>
      <View style={styles.attentionBody}>
        <Text style={[styles.attentionReason, { color: item.color }]}>{item.reason}</Text>
        <Text style={styles.attentionTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.attentionDetail} numberOfLines={2}>{item.detail}</Text>
      </View>
      <View style={[styles.attentionButton, { backgroundColor: item.color }]}><Text style={styles.attentionButtonText}>{item.action}</Text></View>
    </Pressable>
  )
}

function FilterChip({ filter, label, count, selected, onPress }: { filter: FilterKey; label: string; count: number; selected: boolean; onPress: (filter: FilterKey) => void }) {
  return (
    <Pressable onPress={() => onPress(filter)} style={[styles.chip, selected && styles.chipActive]}>
      <Text style={[styles.chipText, selected && styles.chipTextActive]}>{label}</Text>
      <Text style={[styles.chipCount, selected && styles.chipCountActive]}>{count}</Text>
    </Pressable>
  )
}

const BatchCard = memo(function BatchCard({ batch, index }: { batch: EnrichedBatch; index: number }) {
  const healthDot = batch.healthTone === 'red' ? '#EF4444' : batch.healthTone === 'amber' ? '#F59E0B' : '#22C55E'
  const trackColor = batch.isNearHarvest ? '#F59E0B' : '#2E7D32'
  return (
    <Animated.View entering={FadeInUp.duration(380).delay(Math.min(index * 45, 240)).springify()}>
      <Pressable onPress={() => goToBatch(batch)} style={[styles.batchCard, { borderLeftColor: batch.accent }, batch.isNearHarvest && styles.batchCardPop]}>
        {batch.isNearHarvest && <View style={styles.batchGlow} pointerEvents="none" />}
        <View style={styles.batchHeader}>
          <View style={[styles.batchTypeIcon, { backgroundColor: `${batch.accent}1F` }]}><GoonaIcon icon={batch.typeIcon} size={16} color={batch.accent} /></View>
          <Text style={styles.batchName} numberOfLines={1}>{batch.batchName}</Text>
          <View style={[styles.healthDot, { backgroundColor: healthDot, shadowColor: healthDot }]} />
          <View style={[styles.batchStatus, { backgroundColor: batch.statusBg }]}><Text style={[styles.batchStatusText, { color: batch.statusColor }]}>{batch.statusText}</Text></View>
        </View>
        <View style={styles.batchMetaRow}>
          <Meta label="Type" value={batch.typeLabel} />
          <Meta label="Birds" value={batch.quantity.toLocaleString()} />
          <Meta label="Week" value={`${batch.currentWeek}/${batch.totalWeeks}`} />
          <View style={styles.harvestMeta}><Text style={styles.metaLabel}>{batch.isReady ? 'Harvest' : 'To harvest'}</Text><Text style={[styles.metaValue, { color: batch.isNearHarvest ? '#B45309' : '#2E7D32' }]}>{formatHarvest(batch)}</Text></View>
        </View>
        <View style={styles.phaseWrap}>
          <View style={styles.phaseLabels}>
            {batch.phases.map((phase, phaseIndex) => (
              <Text key={phase} style={[styles.phaseLabel, phaseIndex < batch.phaseIndex && styles.phaseDone, phaseIndex === batch.phaseIndex && styles.phaseCurrent, phaseIndex === 0 && styles.phaseFirst, phaseIndex === batch.phases.length - 1 && styles.phaseLast]} numberOfLines={1}>{phase}</Text>
            ))}
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${batch.progress}%`, backgroundColor: trackColor }]} />
            {[25, 50, 75].map((point) => <View key={point} style={[styles.progressNode, { left: `${point}%` }]} />)}
          </View>
          <View style={styles.progressLine}>
            <Text style={styles.progressHint} numberOfLines={1}>{batch.hasHealthFlag ? 'Cycle progress - health review due' : 'Cycle progress'}</Text>
            <Text style={styles.progressPct}>{batch.progress}%</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  )
})

function Meta({ label, value }: { label: string; value: string }) {
  return <View style={styles.metaBlock}><Text style={styles.metaLabel}>{label}</Text><Text style={styles.metaValue} numberOfLines={1}>{value}</Text></View>
}

function EmptyBatches({ hasBatches, filter }: { hasBatches: boolean; filter: FilterKey }) {
  return (
    <View style={styles.emptyState}>
      <GoonaIcon icon={hasBatches ? Icons.filter : Icons.clipboardList} size={34} color="#8A988C" />
      <Text style={styles.emptyTitle}>{hasBatches ? 'No batches match this filter' : 'No production batches yet'}</Text>
      <Text style={styles.emptyDesc}>{hasBatches ? `Switch from ${filter} or create a new batch.` : 'Create your first production batch to start tracking.'}</Text>
      {!hasBatches && <Pressable style={styles.emptyCta} onPress={() => router.push('/create-batch' as any)}><GoonaIcon icon={Icons.plus} size={17} color="#FFF" /><Text style={styles.emptyCtaText}>Create Batch</Text></Pressable>}
    </View>
  )
}

function GoonaIQ({ item }: { item?: AttentionItem }) {
  const batch = item?.batch
  const text = batch
    ? batch.isNearHarvest
      ? `${batch.batchName} has reached ${batch.progress}% of its cycle. Prepare harvest actions now to protect margin and avoid holding costs.`
      : `${batch.batchName} is the current priority. Review the ${item?.reason.toLowerCase()} workflow before the next production checkpoint.`
    : 'No active batch needs attention right now. Keep logging feed, medication, mortality, and sales records for sharper recommendations.'
  return (
    <LinearGradient colors={['#1E7A3D', '#2E8B43', '#43A047']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.iqCard}>
      <View style={styles.iqGlow} pointerEvents="none" />
      <View style={styles.iqHeader}><GoonaIcon icon={Icons.sparkles} size={16} color="#D4FF4D" /><Text style={styles.iqTitle}>Batch Insight</Text><View style={styles.iqTag}><Text style={styles.iqTagText}>Priority</Text></View></View>
      <Text style={styles.iqText}>{text}</Text>
      <Pressable
        style={styles.iqCta}
        onPress={() => {
          if (batch?.isNearHarvest) {
            router.push({ pathname: '/reminder-tasks', params: { batchId: batch.id, batchName: batch.batchName, intent: 'plan-harvest' } } as any)
            return
          }
          if (item) {
            runPriorityAction(item)
            return
          }
          router.push('/create-batch' as any)
        }}
      >
        <Text style={styles.iqCtaText}>{batch?.isNearHarvest ? 'Plan Harvest' : batch ? 'Open batch' : 'Create batch'}</Text>
        <GoonaIcon icon={Icons.chevronRight} size={15} color="#1E3A0E" />
      </Pressable>
    </LinearGradient>
  )
}

export default function BatchManagementScreen() {
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const [filter, setFilter] = useState<FilterKey>('all')
  const batches = useBatchStore((s) => s.batches)

  const enriched = useMemo(() => batches.filter((batch) => batch.status === 'active').map(enrichBatch).sort((a, b) => b.actionScore - a.actionScore), [batches])
  const attention = useMemo(() => buildAttention(enriched), [enriched])
  const filtered = useMemo(() => enriched.filter((batch) => filterBatch(batch, filter)), [enriched, filter])
  const counts = useMemo(() => {
    const attentionCount = enriched.filter((batch) => batch.hasHealthFlag).length
    const harvestCount = enriched.filter((batch) => batch.isNearHarvest).length
    const avgProgress = enriched.length > 0 ? Math.round(enriched.reduce((sum, batch) => sum + batch.progress, 0) / enriched.length) : 0
    return {
      all: enriched.length,
      active: enriched.filter((batch) => filterBatch(batch, 'active')).length,
      harvest: harvestCount,
      attention: attentionCount,
      birds: enriched.reduce((sum, batch) => sum + batch.quantity, 0),
      avgProgress,
    }
  }, [enriched])

  const contentWidth = Math.min(width, 430) - 44
  const statWidth = Math.max(150, (contentWidth - 11) / 2)
  const quickWidth = Math.max(74, (contentWidth - 30) / 4)
  const priorityItem = attention[0]
  const statusLine = formatStatusLine(counts.harvest, counts.attention, counts.avgProgress)

  return (
    <View style={styles.container}>
      <View style={styles.bgGlow} pointerEvents="none" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }]}
      >
        <Animated.View entering={FadeInUp.duration(420).springify()} style={styles.topNav}>
          <Pressable style={styles.navButton} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/records' as any)}>
            <GoonaIcon icon={Icons.arrowLeft} size={22} color="#15291A" />
          </Pressable>
          <Text style={styles.topTitle}>Batch Management</Text>
          <Pressable style={styles.navButton} onPress={() => router.push('/(tabs)/batches' as any)}>
            <GoonaIcon icon={Icons.search} size={20} color="#15291A" />
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(420).delay(70).springify()} style={styles.header}>
          <Text style={styles.eyebrow}>Production Cycles</Text>
          <Text style={styles.headerTitle}>Manage{`\n`}All Batches</Text>
          <Text style={styles.liveLine}>{statusLine}</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(420).delay(110).springify()} style={styles.statsGrid}>
          <View style={{ width: statWidth }}><StatTile label="Active batches" value={`${counts.all}`} icon={Icons.egg} colors={['#EAF6EC', '#F4FBF3']} iconColor="#2E7D32" active={filter === 'active'} onPress={() => setFilter('active')} /></View>
          <View style={{ width: statWidth }}><StatTile label="Total birds" value={counts.birds.toLocaleString()} icon={Icons.users} colors={['#EAF0FB', '#F5F8FE']} iconColor="#3B66D6" active={filter === 'all'} onPress={() => setFilter('all')} /></View>
          <View style={{ width: statWidth }}><StatTile label="Needs attention" value={`${counts.attention}`} icon={Icons.triangleAlert} colors={['#FBEAEA', '#FEF5F5']} iconColor="#DC2626" active={filter === 'attention'} onPress={() => setFilter('attention')} badge={counts.attention > 0 ? { text: 'Action', color: '#DC2626', bg: 'rgba(239,68,68,0.12)' } : undefined} /></View>
          <View style={{ width: statWidth }}><StatTile label="Near harvest" value={`${counts.harvest}`} icon={Icons.arrowUpRight} colors={['#FBF2E3', '#FEFAF2']} iconColor="#D97706" active={filter === 'harvest'} onPress={() => setFilter('harvest')} badge={counts.harvest > 0 ? { text: 'Ready', color: '#B45309', bg: 'rgba(245,158,11,0.16)' } : undefined} /></View>
        </Animated.View>

        {attention.length > 0 && (
          <Animated.View entering={FadeInUp.duration(420).delay(150).springify()}>
            <SectionHeader title="Needs attention" right={`${attention.length} item${attention.length === 1 ? '' : 's'}`} />
            <View style={styles.attentionList}>{attention.map((item) => <AttentionRow key={item.id} item={item} />)}</View>
          </Animated.View>
        )}

        <Animated.View entering={FadeInUp.duration(420).delay(190).springify()}>
          <SectionHeader title="Quick actions" />
          <View style={styles.quickActions}>
            {QUICK_ACTIONS.map((action) => (
              <Pressable key={action.label} style={[styles.quickAction, { width: quickWidth, backgroundColor: action.bg }]} onPress={() => router.push(action.route as any)}>
                <View style={[styles.quickIcon, { backgroundColor: `${action.color}1F` }]}><GoonaIcon icon={action.icon} size={20} color={action.color} /></View>
                <Text style={[styles.quickLabel, { color: action.color }]}>{action.label}</Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(420).delay(230).springify()}>
          <SectionHeader title="Active batches" right={`${filtered.length} shown`} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={styles.chipsRow}>
            {FILTER_LABELS.map((chip) => <FilterChip key={chip.key} filter={chip.key} label={chip.label} count={counts[chip.key]} selected={filter === chip.key} onPress={setFilter} />)}
          </ScrollView>
          {filtered.length === 0 ? (
            <EmptyBatches hasBatches={enriched.length > 0} filter={filter} />
          ) : (
            <View style={styles.batchList}>{filtered.map((batch, index) => <BatchCard key={batch.id} batch={batch} index={index} />)}</View>
          )}
        </Animated.View>

        <GoonaIQ item={priorityItem} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F9F4' },
  bgGlow: { position: 'absolute', top: -80, right: -90, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(174,234,0,0.12)' },
  listContent: { paddingHorizontal: 22 },
  topNav: { height: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navButton: { width: 40, height: 40, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.86)', alignItems: 'center', justifyContent: 'center', shadowColor: '#142819', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  topTitle: { fontSize: 17, fontWeight: '800', color: '#15291A', letterSpacing: -0.2 },
  header: { marginTop: 18 },
  eyebrow: { fontSize: 11, fontWeight: '800', color: '#2E7D32', letterSpacing: 1.6, textTransform: 'uppercase' },
  headerTitle: { fontSize: 32, lineHeight: 36, fontWeight: '900', color: '#15291A', marginTop: 8, letterSpacing: -0.9 },
  liveLine: { fontSize: 13, color: '#5C6B5E', marginTop: 8, fontWeight: '500' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 11, marginTop: 20 },
  statTile: { minHeight: 142, borderRadius: 20, padding: 16, overflow: 'hidden', borderWidth: 1.5, borderColor: 'transparent', shadowColor: '#142819', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 24, elevation: 2 },
  statTileActive: { borderColor: '#2E7D32' },
  statIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 26, lineHeight: 30, fontWeight: '900', color: '#15291A', marginTop: 10 },
  statLabel: { fontSize: 12, color: '#5C6B5E', fontWeight: '600', marginTop: 4 },
  statBadge: { position: 'absolute', top: 14, right: 14, borderRadius: 50, paddingHorizontal: 8, paddingVertical: 3 },
  statBadgeText: { fontSize: 9, fontWeight: '800' },
  sectionHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 26, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#15291A', letterSpacing: -0.2 },
  sectionRight: { fontSize: 12, color: '#8A988C', fontWeight: '700' },
  attentionList: { gap: 10 },
  attentionWrap: { minHeight: 86, borderRadius: 20, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 13, overflow: 'hidden', shadowColor: '#142819', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.06, shadowRadius: 26, elevation: 2 },
  attentionRail: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  attentionIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  attentionBody: { flex: 1, minWidth: 0 },
  attentionReason: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.7 },
  attentionTitle: { fontSize: 15, color: '#15291A', fontWeight: '900', marginTop: 3 },
  attentionDetail: { fontSize: 12, lineHeight: 17, color: '#5C6B5E', marginTop: 2, fontWeight: '600' },
  attentionButton: { minWidth: 58, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  attentionButtonText: { color: '#fff', fontSize: 13, fontWeight: '900' },
  quickActions: { flexDirection: 'row', gap: 10 },
  quickAction: { minHeight: 90, borderRadius: 20, alignItems: 'center', justifyContent: 'center', padding: 10, shadowColor: '#142819', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.04, shadowRadius: 20, elevation: 2 },
  quickIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  quickLabel: { fontSize: 12, fontWeight: '900', textAlign: 'center' },
  chipsScroll: { marginBottom: 14 },
  chipsRow: { gap: 9, paddingRight: 16 },
  chip: { height: 38, borderRadius: 19, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E3EBDD' },
  chipActive: { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
  chipText: { fontSize: 13, color: '#5C6B5E', fontWeight: '800' },
  chipTextActive: { color: '#FFFFFF' },
  chipCount: { fontSize: 12, color: '#8A988C', fontWeight: '900' },
  chipCountActive: { color: 'rgba(255,255,255,0.82)' },
  batchList: { gap: 12 },
  batchCard: { borderRadius: 22, backgroundColor: '#FFFFFF', padding: 18, borderLeftWidth: 4, overflow: 'hidden', shadowColor: '#142819', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.07, shadowRadius: 26, elevation: 3 },
  batchCardPop: { shadowColor: '#F59E0B', shadowOpacity: 0.12 },
  batchGlow: { position: 'absolute', top: -70, right: -50, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(245,158,11,0.12)' },
  batchHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  batchTypeIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  batchName: { flex: 1, color: '#15291A', fontSize: 18, fontWeight: '900', letterSpacing: -0.35 },
  healthDot: { width: 9, height: 9, borderRadius: 5, shadowOpacity: 0.35, shadowRadius: 8 },
  batchStatus: { borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5 },
  batchStatusText: { fontSize: 11, fontWeight: '900' },
  batchMetaRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 18 },
  metaBlock: { flex: 1, minWidth: 0 },
  harvestMeta: { flex: 1.2, minWidth: 0, alignItems: 'flex-end' },
  metaLabel: { fontSize: 11, color: '#8A988C', fontWeight: '800' },
  metaValue: { fontSize: 18, color: '#15291A', fontWeight: '900', marginTop: 2 },
  phaseWrap: { marginTop: 18 },
  phaseLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  phaseLabel: { flex: 1, fontSize: 9.5, color: '#B7C2B7', fontWeight: '900', textTransform: 'uppercase', textAlign: 'center' },
  phaseFirst: { textAlign: 'left' },
  phaseLast: { textAlign: 'right' },
  phaseDone: { color: '#2E7D32' },
  phaseCurrent: { color: '#15291A' },
  progressTrack: { height: 8, borderRadius: 6, backgroundColor: '#EAF0E7', overflow: 'hidden', position: 'relative' },
  progressFill: { height: '100%', borderRadius: 6 },
  progressNode: { position: 'absolute', top: 2.5, width: 3, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.9)' },
  progressLine: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, gap: 10 },
  progressHint: { flex: 1, fontSize: 12.5, color: '#8A988C', fontWeight: '800' },
  progressPct: { fontSize: 12.5, color: '#15291A', fontWeight: '900' },
  emptyState: { alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 22, padding: 28, borderWidth: 1, borderColor: '#E5ECE0' },
  emptyTitle: { fontSize: 17, fontWeight: '900', color: '#15291A', marginTop: 10 },
  emptyDesc: { fontSize: 13, color: '#5C6B5E', textAlign: 'center', marginTop: 4 },
  emptyCta: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#2E7D32', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, marginTop: 16 },
  emptyCtaText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  iqCard: { borderRadius: 24, padding: 20, marginTop: 26, overflow: 'hidden', shadowColor: '#1E7A3D', shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.22, shadowRadius: 30, elevation: 6 },
  iqGlow: { position: 'absolute', right: -45, top: -45, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(174,234,0,0.15)' },
  iqHeader: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  iqTitle: { flex: 1, color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  iqTag: { borderRadius: 14, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  iqTagText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
  iqText: { color: '#FFFFFF', fontSize: 15, lineHeight: 22, fontWeight: '700', marginTop: 14 },
  iqCta: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#AEEA00', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 13, marginTop: 18 },
  iqCtaText: { color: '#1E3A0E', fontSize: 14, fontWeight: '900' },
})
