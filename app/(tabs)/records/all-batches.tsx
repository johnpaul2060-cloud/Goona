import { memo, useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native'
import { router } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { FadeInUp } from 'react-native-reanimated'
import GoonaIcon from '../../../components/ui/GoonaIcon'
import { Icons } from '../../../shared/icons'
import { Batch, useBatchStore } from '../../../store/useBatchStore'
import { computeFlockStats, formatFlockAgeShort } from '../../../utils/breeder'

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
  typeLabel: string
  typeIcon: typeof Icons.egg
  breederAlivePct?: number
  breederAgeShort?: string
}

const DAY_MS = 24 * 60 * 60 * 1000
const WEEK_MS = 7 * DAY_MS
const NEAR_HARVEST_DAYS = 14

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

function isFish(batch: Batch): boolean {
  const text = `${batch.livestockType} ${batch.batchName}`.toLowerCase()
  return text.includes('fish') || text.includes('catfish')
}

function getCountLabel(batch: Batch): string {
  if (batch.model === 'individual') return 'Animals'
  if (batch.model === 'breeder') return 'Breeders'
  if (isFish(batch)) return 'Fish'
  return 'Birds'
}

function getTypeIcon(batch: Batch): typeof Icons.egg {
  if (batch.model === 'individual') return Icons.user
  if (batch.model === 'breeder') return Icons.egg
  if (isLayer(batch)) return Icons.egg
  return Icons.sprout
}

function getPhaseData(batch: Batch, progress: number): { phases: string[]; phaseIndex: number; phaseName: string } {
  if (batch.model === 'individual' || batch.model === 'breeder') {
    return { phases: [], phaseIndex: -1, phaseName: '' }
  }
  const phases = isLayer(batch) ? ['Brooding', 'Laying', 'Peak', 'Harvest'] : ['Brooding', 'Growing', 'Finishing', 'Harvest']
  const phaseIndex = progress >= 86 ? 3 : progress >= 62 ? 2 : progress >= 25 ? 1 : 0
  return { phases, phaseIndex, phaseName: phases[phaseIndex] }
}

function deriveHealthFlag(batch: Batch, progress: number, currentWeek: number): boolean {
  if (batch.model === 'individual' || batch.model === 'breeder') return false
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
  const isBreeder = batch.model === 'breeder'
  const breederStats = isBreeder ? computeFlockStats(batch) : null
  const isReady = !isBreeder && (daysToHarvest === 0 || progress >= 100)
  const isNearHarvest = !isBreeder && (isReady || daysToHarvest <= NEAR_HARVEST_DAYS || progress >= 85)
  const hasHealthFlag = deriveHealthFlag(batch, progress, currentWeek)
  const phaseData = getPhaseData(batch, progress)
  const typeLabel = batch.livestockType
  const typeIcon = getTypeIcon(batch)
  const isIndiv = batch.model === 'individual'
  const healthTone: HealthTone = hasHealthFlag ? 'red' : isBreeder ? 'green' : isNearHarvest ? 'amber' : 'green'
  const accent = healthTone === 'red' ? '#EF4444' : healthTone === 'amber' ? '#F59E0B' : '#2E7D32'
  let statusText = hasHealthFlag ? 'Attention' : 'Active'
  if (!hasHealthFlag && isNearHarvest) statusText = isIndiv ? 'Near Complete' : 'Near Harvest'
  const statusBg = hasHealthFlag ? 'rgba(239,68,68,0.10)' : isNearHarvest ? 'rgba(245,158,11,0.14)' : 'rgba(46,125,50,0.10)'
  const statusColor = hasHealthFlag ? '#DC2626' : isNearHarvest ? '#B45309' : '#2E7D32'

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
    typeIcon,
    typeLabel,
    ...phaseData,
    breederAlivePct: breederStats?.alivePct,
    breederAgeShort: breederStats ? formatFlockAgeShort(batch) : undefined,
  }
}

function goToBatch(batch: EnrichedBatch) {
  router.push({ pathname: '/batch-details/[id]', params: { id: batch.id } } as any)
}

function Meta({ label, value }: { label: string; value: string }) {
  return <View style={styles.metaBlock}><Text style={styles.metaLabel}>{label}</Text><Text style={styles.metaValue} numberOfLines={1}>{value}</Text></View>
}

function formatDuration(days: number): string {
  if (days === 0) return 'Ready'
  if (days < 90) return `${days} day${days === 1 ? '' : 's'}`
  if (days < 365) {
    const weeks = Math.round(days / 7)
    return `${weeks} wk${weeks === 1 ? '' : 's'}`
  }
  const yrs = Math.round(days / 365.25 * 10) / 10
  return `${yrs} yr${yrs === 1 ? '' : 's'}`
}

function formatCycleLabel(batch: EnrichedBatch): { label: string; value: string } {
  if (batch.model === 'breeder') return { label: 'F : M', value: `${batch.hens ?? 0}:${batch.cocks ?? 0}` }
  if (batch.isReady) return { label: 'Ready', value: 'Ready' }
  const value = formatDuration(batch.daysToHarvest)
  if (batch.model === 'individual') return { label: 'Cycle', value }
  return { label: 'To harvest', value }
}

const BatchCard = memo(function BatchCard({ batch, index }: { batch: EnrichedBatch; index: number }) {
  const healthDot = batch.healthTone === 'red' ? '#EF4444' : batch.healthTone === 'amber' ? '#F59E0B' : '#22C55E'
  const trackColor = batch.isNearHarvest ? '#F59E0B' : '#2E7D32'
  const countLabel = getCountLabel(batch)
  const cycleLabel = formatCycleLabel(batch)
  const isIndiv = batch.model === 'individual'
  const isBreeder = batch.model === 'breeder'
  const displayProgress = isBreeder ? (batch.breederAlivePct ?? 100) : batch.progress
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
          <Meta label={countLabel} value={isBreeder ? ((batch.hens ?? 0) + (batch.cocks ?? 0)).toLocaleString() : batch.quantity.toLocaleString()} />
          <Meta label={isBreeder ? 'Flock age' : 'Week'} value={isBreeder ? (batch.breederAgeShort ?? '—') : `${batch.currentWeek}/${batch.totalWeeks}`} />
          <View style={styles.harvestMeta}><Text style={styles.metaLabel}>{cycleLabel.label}</Text><Text style={[styles.metaValue, { color: batch.isNearHarvest ? '#B45309' : '#2E7D32' }]}>{cycleLabel.value}</Text></View>
        </View>
        <View style={styles.phaseWrap}>
          {isBreeder ? (
            <View style={styles.phaseLabels}>
              <Text style={[styles.phaseLabel, styles.phaseCurrent]}>Flock age</Text>
            </View>
          ) : isIndiv ? (
            <View style={styles.phaseLabels}>
              <Text style={[styles.phaseLabel, styles.phaseCurrent]}>Cycle</Text>
            </View>
          ) : (
            <View style={styles.phaseLabels}>
              {batch.phases.map((phase, phaseIndex) => (
                <Text key={phase} style={[styles.phaseLabel, phaseIndex < batch.phaseIndex && styles.phaseDone, phaseIndex === batch.phaseIndex && styles.phaseCurrent, phaseIndex === 0 && styles.phaseFirst, phaseIndex === batch.phases.length - 1 && styles.phaseLast]} numberOfLines={1}>{phase}</Text>
              ))}
            </View>
          )}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${displayProgress}%`, backgroundColor: trackColor }]} />
            {!isBreeder && [25, 50, 75].map((point) => <View key={point} style={[styles.progressNode, { left: `${point}%` }]} />)}
          </View>
          <View style={styles.progressLine}>
            <Text style={styles.progressHint} numberOfLines={1}>{batch.hasHealthFlag ? 'Cycle progress - health review due' : isBreeder ? `Flock age · ${batch.breederAgeShort ?? '—'}` : 'Cycle progress'}</Text>
            <Text style={styles.progressPct}>{displayProgress}%</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  )
})

function EmptyBatches() {
  return (
    <View style={styles.emptyState}>
      <GoonaIcon icon={Icons.clipboardList} size={34} color="#8A988C" />
      <Text style={styles.emptyTitle}>No active batches</Text>
      <Text style={styles.emptyDesc}>All production cycles are complete or archived.</Text>
      <Pressable style={styles.emptyCta} onPress={() => router.push('/create-batch' as any)}>
        <GoonaIcon icon={Icons.plus} size={17} color="#FFF" />
        <Text style={styles.emptyCtaText}>New Batch</Text>
      </Pressable>
    </View>
  )
}

export default function AllBatchesScreen() {
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const batches = useBatchStore((s) => s.batches)
  const [search, setSearch] = useState('')

  const enriched = useMemo(() => batches
    .filter((batch) => batch.status === 'active')
    .map(enrichBatch)
    .sort((a, b) => (b.lastActivityAt ?? 0) - (a.lastActivityAt ?? 0) || b.createdAt.localeCompare(a.createdAt)),
  [batches])

  const filtered = useMemo(() => {
    if (!search.trim()) return enriched
    const q = search.toLowerCase()
    return enriched.filter((b) => b.batchName.toLowerCase().includes(q) || b.typeLabel.toLowerCase().includes(q))
  }, [enriched, search])

  return (
    <View style={styles.container}>
      <View style={styles.bgGlow} pointerEvents="none" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }]}
      >
        <Animated.View entering={FadeInUp.duration(420).springify()} style={styles.topNav}>
          <Pressable style={styles.navButton} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/records/batch-management' as any)}>
            <GoonaIcon icon={Icons.arrowLeft} size={22} color="#15291A" />
          </Pressable>
          <Text style={styles.topTitle}>All Batches</Text>
          <View style={styles.badge}><Text style={styles.badgeText}>{enriched.length}</Text></View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(420).delay(70).springify()} style={styles.header}>
          <Text style={styles.eyebrow}>Active Production Cycles</Text>
          <Text style={styles.headerTitle}>All Batches</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(420).delay(110).springify()} style={styles.searchWrap}>
          <GoonaIcon icon={Icons.search} size={17} color="#8A988C" />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search batches..."
            placeholderTextColor="#8A988C"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} style={styles.searchClear}>
              <GoonaIcon icon={Icons.x} size={16} color="#8A988C" />
            </Pressable>
          )}
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(420).delay(140).springify()} style={styles.summaryRow}>
          <Text style={styles.summaryText}>{filtered.length} of {enriched.length} active batch{enriched.length === 1 ? '' : 'es'}</Text>
        </Animated.View>

        {filtered.length > 0 ? (
          <View style={styles.batchList}>
            {filtered.map((batch, index) => (
              <BatchCard key={batch.id} batch={batch} index={index} />
            ))}
          </View>
        ) : (
          <EmptyBatches />
        )}

        {filtered.length > 0 && (
          <Animated.View entering={FadeInUp.duration(420).delay(300).springify()}>
            <Pressable style={styles.createCard} onPress={() => router.push('/create-batch' as any)}>
              <View style={styles.createIcon}>
                <GoonaIcon icon={Icons.plus} size={20} color="#2E7D32" />
              </View>
              <Text style={styles.createText}>Create new batch</Text>
              <GoonaIcon icon={Icons.chevronRight} size={18} color="#8A988C" />
            </Pressable>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F9F4' },
  bgGlow: { position: 'absolute', top: -80, right: -90, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(174,234,0,0.12)' },
  listContent: { paddingHorizontal: 22 },
  topNav: { height: 46, flexDirection: 'row', alignItems: 'center', gap: 10 },
  navButton: { width: 40, height: 40, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.86)', alignItems: 'center', justifyContent: 'center', shadowColor: '#142819', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  topTitle: { fontSize: 17, fontWeight: '800', color: '#15291A', letterSpacing: -0.2 },
  badge: { minWidth: 24, height: 24, borderRadius: 12, backgroundColor: '#2E7D32', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeText: { fontSize: 12, fontWeight: '900', color: '#FFFFFF' },
  header: { marginTop: 18 },
  eyebrow: { fontSize: 11, fontWeight: '800', color: '#2E7D32', letterSpacing: 1.6, textTransform: 'uppercase' },
  headerTitle: { fontSize: 32, lineHeight: 36, fontWeight: '900', color: '#15291A', marginTop: 8, letterSpacing: -0.9 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', height: 48, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E3EBDD', paddingHorizontal: 14, gap: 10, marginTop: 18, shadowColor: '#142819', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '600', color: '#15291A', padding: 0, margin: 0 },
  searchClear: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F2F6F1', alignItems: 'center', justifyContent: 'center' },
  summaryRow: { marginTop: 14, marginBottom: 4 },
  summaryText: { fontSize: 13, color: '#8A988C', fontWeight: '600' },
  batchList: { gap: 14, marginTop: 10 },
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
  emptyState: { alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 22, padding: 28, borderWidth: 1, borderColor: '#E5ECE0', marginTop: 20 },
  emptyTitle: { fontSize: 17, fontWeight: '900', color: '#15291A', marginTop: 10 },
  emptyDesc: { fontSize: 13, color: '#5C6B5E', textAlign: 'center', marginTop: 4 },
  emptyCta: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#2E7D32', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, marginTop: 16 },
  emptyCtaText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  createCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E3EBDD', padding: 16, marginTop: 24, shadowColor: '#142819', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.05, shadowRadius: 16, elevation: 2 },
  createIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: '#EAF6EC', alignItems: 'center', justifyContent: 'center' },
  createText: { flex: 1, fontSize: 15, fontWeight: '900', color: '#15291A' },
})
