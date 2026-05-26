import React, { useEffect, useState } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView, Pressable,
  StyleSheet, Dimensions, Linking, Share,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import GoonaIcon from '../components/ui/GoonaIcon'
import { ArrowLeft, Sprout } from 'lucide-react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence,
  withTiming, withSpring, FadeInUp,
  interpolate, Easing,
} from 'react-native-reanimated'
import BottomDock from '../components/navigation/BottomDock'
import DailyChallenge from '../components/DailyChallenge'

const { width: SCREEN_W } = Dimensions.get('window')
const H_PADDING = 24

/* ─── Data ─── */
type SimType = 'broiler' | 'layer' | 'catfish'

const SIM_DATA: Record<SimType, {
  name: string; weeks: number; current: number; birds: number; feed: string
  survival: number; cash: number; projection: number; weight: string; status: string
  icon: string; difficulty: string; diffColor: string; xp: number
}> = {
  broiler: {
    name: '6-Week Broiler Run', weeks: 6, current: 2, birds: 4280, feed: '6.2',
    survival: 97.2, cash: 2.4, projection: 3.8, weight: '2.1', status: 'Your flock is growing steadily.',
    icon: '\u{1F425}', difficulty: 'Intermediate', diffColor: '#D97706', xp: 450,
  },
  layer: {
    name: '18-Month Layer Marathon', weeks: 72, current: 16, birds: 3200, feed: '11.8',
    survival: 93.5, cash: 5.1, projection: 12.6, weight: '1.8', status: 'Peak production phase engaged.',
    icon: '\u{1F413}', difficulty: 'Advanced', diffColor: '#DC2626', xp: 1200,
  },
  catfish: {
    name: '6-Month Catfish Cycle', weeks: 24, current: 5, birds: 8700, feed: '4.5',
    survival: 88.4, cash: 1.8, projection: 4.2, weight: '0.9', status: 'Fingerlings adapting well to pond conditions.',
    icon: '\u{1F41F}', difficulty: 'Intermediate', diffColor: '#D97706', xp: 600,
  },
}

const DECISION_RESPONSES: Record<number, { text: string; confidence: string }> = {
  1: { text: 'Anti-stress vitamins help maintain feed intake during heat stress. Projected mortality reduction of 8%, but adds \u20A642,000 to operational costs.', confidence: '87% confidence' },
  2: { text: 'Improving ventilation increases operational cost slightly but reduces projected mortality by 14%. Best long-term ROI for heat events.', confidence: '92% confidence' },
  3: { text: 'Reducing feeding during heat lowers metabolic heat production but reduces weight gain by 11%. Net profit impact: -6%.', confidence: '78% confidence' },
  4: { text: 'Doing nothing risks a 22% spike in mortality and 15% drop in feed conversion efficiency. Not recommended.', confidence: '94% confidence' },
}

const LEADERBOARD = [
  { rank: 1, name: 'Adewale Farms', detail: '98% Survival Rate', region: 'Western', color: '#F59E0B' },
  { rank: 2, name: 'GreenNest Farms', detail: '42% Profit Margin', region: 'Eastern', color: '#94A3B8' },
  { rank: 3, name: 'Ifeanyi Poultry', detail: 'Lowest Mortality Record', region: 'Central', color: '#CD7F32' },
]

/* ─── Hooks ─── */
function usePressScale(scaleTo = 0.97) {
  const scale = useSharedValue(1)
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
  return {
    style, onPressIn: () => { scale.value = withSpring(scaleTo, { damping: 15, stiffness: 200 }) },
    onPressOut: () => { scale.value = withSpring(1, { damping: 15, stiffness: 200 }) },
  }
}

function PulseDot({ color = '#AEEA00', size = 5 }: { color?: string; size?: number }) {
  const opacity = useSharedValue(1)
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(0.3, { duration: 2000 }), withTiming(1, { duration: 2000 })),
      -1, true,
    )
  }, [])
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }))
  return <Animated.View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }, style]} />
}

function useMetricPulse() {
  const pulse = useSharedValue(1)
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1.04, { duration: 800 }), withTiming(1, { duration: 800 })),
      -1, true,
    )
  }, [])
  return useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }))
}



/* ─── Animated AI Orb ─── */
function AIOrb() {
  const rotation = useSharedValue(0)
  const pulse = useSharedValue(1)

  useEffect(() => {
    rotation.value = withRepeat(withTiming(360, { duration: 6000, easing: Easing.linear }), -1)
    pulse.value = withRepeat(
      withSequence(withTiming(1.12, { duration: 1500 }), withTiming(1, { duration: 1500 })),
      -1, true,
    )
  }, [])

  const ring1Style = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }))
  const ring2Style = useAnimatedStyle(() => ({ transform: [{ rotate: `${-rotation.value * 0.75}deg` }] }))
  const coreStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }], opacity: interpolate(pulse.value, [1, 1.12], [0.7, 1]) }))

  return (
    <View style={orbStyles.container}>
      <Animated.View style={[orbStyles.ring, { width: 80, height: 80, borderRadius: 40, borderColor: 'rgba(174,234,0,0.15)' }, ring1Style]} />
      <Animated.View style={[orbStyles.ring, { width: 66, height: 66, borderRadius: 33, borderColor: 'rgba(174,234,0,0.08)', position: 'absolute' }, ring2Style]} />
      <Animated.View style={[orbStyles.ring, { width: 52, height: 52, borderRadius: 26, borderColor: 'rgba(255,255,255,0.06)', position: 'absolute' }]} />
      <Animated.View style={[orbStyles.core, coreStyle]} />
    </View>
  )
}
const orbStyles = StyleSheet.create({
  container: { width: 80, height: 80, alignItems: 'center', justifyContent: 'center' },
  ring: { borderWidth: 1.5, position: 'absolute' as const },
  core: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(174,234,0,0.3)',
    shadowColor: '#AEEA00', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 6,
  },
})

/* ─── Section Header ─── */
function SectionHeader({ title, tag, tagColor, tagBg }: { title: string; tag?: string; tagColor?: string; tagBg?: string }) {
  return (
    <View style={shStyles.row}>
      <Text style={shStyles.title}>{title}</Text>
      {tag && <Text style={[shStyles.tag, { color: tagColor || '#2E7D32', backgroundColor: tagBg || 'rgba(46,125,50,0.06)' }]}>{tag}</Text>}
    </View>
  )
}
const shStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 12, zIndex: 5 },
  title: { fontSize: 18, fontWeight: '700', color: '#1B1B1B' },
  tag: { fontSize: 10, fontWeight: '600', paddingVertical: 3, paddingHorizontal: 10, borderRadius: 50 },
})

/* ─── Simulation Card ─── */
function SimCard({ type, index, onPress }: { type: SimType; index: number; onPress: () => void }) {
  const data = SIM_DATA[type]
  const { style, onPressIn, onPressOut } = usePressScale()
  return (
    <Animated.View entering={FadeInUp.duration(500).delay(300 + index * 80).springify()} style={style}>
      <Pressable style={simStyles.card} onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
        <LinearGradient colors={['#2E7D32', '#43A047']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={simStyles.icon}>
          <Text style={simStyles.iconText}>{data.icon}</Text>
        </LinearGradient>
        <View style={simStyles.body}>
          <Text style={simStyles.title}>{data.name}</Text>
          <Text style={simStyles.desc} numberOfLines={2}>{type === 'broiler' ? 'Manage a realistic broiler cycle from day-old chicks to market.' : type === 'layer' ? 'Build a sustainable egg production operation from pullets to peak lay.' : 'Optimize feeding and survival in aquaculture operations.'}</Text>
          <View style={simStyles.meta}>
            <Text style={simStyles.metaItem}>Feed: <Text style={simStyles.metaVal}>{data.feed}t</Text></Text>
            <Text style={simStyles.metaItem}>Survival: <Text style={simStyles.metaVal}>{'<'}{Math.round(data.survival)}%</Text></Text>
          </View>
        </View>
        <View style={simStyles.right}>
          <Text style={[simStyles.diff, { color: data.diffColor, backgroundColor: data.diffColor + '18' }]}>{data.difficulty}</Text>
          <Text style={simStyles.xp}>+{data.xp} XP</Text>
          <Text style={simStyles.startBtn}>Start</Text>
        </View>
      </Pressable>
    </Animated.View>
  )
}
const simStyles = StyleSheet.create({
  card: { flexDirection: 'row', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E8ECEE', gap: 14, alignItems: 'flex-start' },
  icon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  iconText: { fontSize: 20 },
  body: { flex: 1 },
  title: { fontWeight: '700', fontSize: 14, color: '#1B1B1B' },
  desc: { fontSize: 11, color: '#616161', marginTop: 2, lineHeight: 15 },
  meta: { flexDirection: 'row', gap: 10, marginTop: 4, flexWrap: 'wrap' },
  metaItem: { fontSize: 10, color: '#94A3B8' },
  metaVal: { fontWeight: '600', color: '#1B1B1B' },
  right: { alignItems: 'flex-end', gap: 4, flexShrink: 0 },
  diff: { fontSize: 9, fontWeight: '700', paddingVertical: 2, paddingHorizontal: 10, borderRadius: 50, overflow: 'hidden' },
  xp: { fontSize: 9, fontWeight: '700', paddingVertical: 2, paddingHorizontal: 10, borderRadius: 50, backgroundColor: 'rgba(174,234,0,0.12)', color: '#3B7A00', overflow: 'hidden' },
  startBtn: { fontSize: 12, fontWeight: '700', color: '#2E7D32', marginTop: 4 },
})

/* ─── Live Dashboard ─── */
function LiveDashboard({ simType }: { simType: SimType }) {
  const data = SIM_DATA[simType]
  const pulseStyle = useMetricPulse()

  const MetricCell = ({ value, label }: { value: string; label: string }) => (
    <View style={ldStyles.cell}>
      <Animated.Text style={[ldStyles.cellValue, pulseStyle]}>{value}</Animated.Text>
      <Text style={ldStyles.cellLabel}>{label}</Text>
    </View>
  )

  return (
    <Animated.View entering={FadeInUp.duration(500).delay(400).springify()}>
      <LinearGradient colors={['#0a1628', '#0f1f3a']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={ldStyles.card}>
        <View style={ldStyles.glowBg} pointerEvents="none" />
        <View style={ldStyles.header}>
          <Text style={ldStyles.week}>Week {data.current} of {data.weeks}</Text>
          <View style={ldStyles.liveBadge}>
            <PulseDot color="#EF4444" size={4} />
            <Text style={ldStyles.liveText}>LIVE</Text>
          </View>
        </View>
        <Text style={ldStyles.status}>{data.status}</Text>
        <View style={ldStyles.grid}>
          <MetricCell value={data.birds.toLocaleString()} label="Bird Count" />
          <MetricCell value={`${data.feed}t`} label="Feed" />
          <MetricCell value={`${data.survival}%`} label="Survival" />
          <MetricCell value={`\u20A6${data.cash}M`} label="Cash" />
          <MetricCell value={`\u20A6${data.projection}M`} label="Profit Proj." />
          <MetricCell value={`${data.weight}kg`} label="Weight Avg" />
        </View>
      </LinearGradient>
    </Animated.View>
  )
}
const ldStyles = StyleSheet.create({
  card: { borderRadius: 28, padding: 20, position: 'relative', overflow: 'hidden' },
  glowBg: {
    position: 'absolute', top: '-30%', right: '-20%', width: 200, height: 200,
    borderRadius: 100, backgroundColor: 'rgba(174,234,0,0.04)',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  week: { fontWeight: '700', fontSize: 16, color: '#fff' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(239,68,68,0.12)', paddingVertical: 3, paddingHorizontal: 10, borderRadius: 50 },
  liveText: { fontSize: 9, fontWeight: '600', color: '#FCA5A5' },
  status: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4, marginBottom: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  cell: { width: (SCREEN_W - H_PADDING * 2 - 40 - 12) / 3, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center' },
  cellValue: { fontWeight: '700', fontSize: 14, color: '#AEEA00' },
  cellLabel: { fontSize: 9, color: 'rgba(255,255,255,0.35)', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
})

/* ─── Decision Engine ─── */
function DecisionEngine() {
  const [selected, setSelected] = useState<number | null>(null)
  const [showResponse, setShowResponse] = useState(false)

  const handleSelect = (opt: number) => {
    if (selected !== null) return
    setSelected(opt)
    setTimeout(() => setShowResponse(true), 300)
  }

  const options = ['Buy Anti-Stress Vitamins', 'Improve Ventilation', 'Reduce Feeding', 'Do Nothing']

  return (
    <Animated.View entering={FadeInUp.duration(500).delay(500).springify()}>
      <View style={deStyles.card}>
        <Text style={deStyles.event}>{'\u26A0\uFE0F'} Operational Alert</Text>
        <Text style={deStyles.title}>Heatwave Hits Your Region</Text>
        <Text style={deStyles.desc}>Temperatures increased significantly this week. Birds may experience stress and lower feed intake.</Text>
        <Text style={deStyles.question}>What should you do?</Text>
        {options.map((opt, i) => {
          const num = i + 1
          const isSelected = selected === num
          return (
            <TouchableOpacity
              key={num}
              activeOpacity={0.9}
              onPress={() => handleSelect(num)}
              style={[deStyles.opt, isSelected && deStyles.optSelected]}
            >
              <View style={[deStyles.optNum, isSelected && deStyles.optNumSelected]}>
                <Text style={[deStyles.optNumText, isSelected && { color: '#fff' }]}>{num}</Text>
              </View>
              <Text style={[deStyles.optText, isSelected && { fontWeight: '600' }]}>{opt}</Text>
            </TouchableOpacity>
          )
        })}
        {showResponse && selected && (
          <Animated.View entering={FadeInUp.duration(400).springify()} style={deStyles.response}>
            <View style={deStyles.respHeader}>
              <Text style={deStyles.aiBadge}>GOONA IQ</Text>
              <Text style={deStyles.confidence}>{DECISION_RESPONSES[selected].confidence}</Text>
            </View>
            <Text style={deStyles.respText}>{DECISION_RESPONSES[selected].text}</Text>
          </Animated.View>
        )}
      </View>
    </Animated.View>
  )
}
const deStyles = StyleSheet.create({
  card: { backgroundColor: 'white', borderRadius: 28, padding: 24 },
  event: { fontSize: 10, fontWeight: '700', color: '#2E7D32', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  title: { fontWeight: '700', fontSize: 16, color: '#1B1B1B', marginBottom: 4 },
  desc: { fontSize: 12, color: '#616161', lineHeight: 18, marginBottom: 2 },
  question: { fontWeight: '600', fontSize: 13, color: '#1B1B1B', marginBottom: 10, marginTop: 6 },
  opt: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14, backgroundColor: '#F8FAF7', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 14, marginBottom: 6 },
  optSelected: { borderColor: '#2E7D32', backgroundColor: 'rgba(46,125,50,0.04)' },
  optNum: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#E8ECEE', alignItems: 'center', justifyContent: 'center' },
  optNumSelected: { backgroundColor: '#2E7D32' },
  optNumText: { fontSize: 11, fontWeight: '700', color: '#94A3B8' },
  optText: { fontSize: 13, fontWeight: '500', color: '#1B1B1B', flex: 1 },
  response: { marginTop: 10, padding: 14, backgroundColor: 'rgba(46,125,50,0.04)', borderLeftWidth: 3, borderLeftColor: '#2E7D32', borderRadius: 12 },
  respHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  aiBadge: { fontSize: 9, fontWeight: '700', backgroundColor: '#2E7D32', color: '#fff', paddingVertical: 2, paddingHorizontal: 8, borderRadius: 50, overflow: 'hidden' },
  confidence: { fontSize: 9, color: '#2E7D32', fontWeight: '600' },
  respText: { fontSize: 12, color: '#1B1B1B', lineHeight: 18 },
})

/* ─── Coach Message ─── */
function CoachMsg({ text, index }: { text: string; index: number }) {
  const parts = text.split(/(<strong>|<\/strong>)/g)
  const rendered = parts.map((p, i) => {
    if (p === '<strong>' || p === '</strong>') return null
    const prev = parts[i - 1]
    const next = parts[i + 1]
    const isBold = prev === '<strong>' || next === '</strong>'
    return <Text key={i} style={isBold ? { color: '#2E7D32', fontWeight: '700' } : undefined}>{p}</Text>
  })
  return (
    <Animated.View entering={FadeInUp.duration(400).delay(600 + index * 80).springify()} style={cmStyles.row}>
      <LinearGradient colors={['#2E7D32', '#AEEA00']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={cmStyles.avatar}>
        <Text style={cmStyles.avatarText}>G</Text>
      </LinearGradient>
      <View style={cmStyles.bubble}>
        <Text style={cmStyles.text}>{rendered}</Text>
      </View>
    </Animated.View>
  )
}
const cmStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: 8 },
  avatar: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', shadowColor: '#AEEA00', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 3 },
  avatarText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  bubble: { backgroundColor: 'white', borderRadius: 14, borderBottomLeftRadius: 4, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1, flex: 1 },
  text: { fontSize: 13, lineHeight: 19, color: '#1B1B1B' },
})

/* ─── Mastery Card ─── */
function MasteryCard() {
  return (
    <Animated.View entering={FadeInUp.duration(500).delay(700).springify()}>
      <LinearGradient colors={['#2E7D32', '#388E3C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={mcStyles.card}>
        <View style={mcStyles.header}>
          <Text style={mcStyles.level}>Farm Mastery Level 8</Text>
          <Text style={mcStyles.pct}>72%</Text>
        </View>
        <View style={mcStyles.bar}>
          <View style={mcStyles.fill} />
        </View>
        <View style={mcStyles.badges}>
          {['Mortality Strategist', 'Feed Optimizer', 'Savings Expert', 'Operational Leader', 'Crisis Manager'].map((b) => (
            <View key={b} style={mcStyles.badge}>
              <Text style={mcStyles.badgeText}>{'\u{1F3C6}'} {b}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>
    </Animated.View>
  )
}
const mcStyles = StyleSheet.create({
  card: { borderRadius: 28, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  level: { fontWeight: '700', fontSize: 16, color: '#fff' },
  pct: { fontWeight: '700', fontSize: 14, color: '#AEEA00' },
  bar: { height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, overflow: 'hidden', marginBottom: 12 },
  fill: { height: '100%', width: '72%', backgroundColor: '#AEEA00', borderRadius: 10 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  badge: { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingVertical: 3, paddingHorizontal: 10, borderRadius: 50 },
  badgeText: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
})

/* ─── Leaderboard Row ─── */
function LBRow({ item, index }: { item: typeof LEADERBOARD[0]; index: number }) {
  return (
    <Animated.View entering={FadeInUp.duration(400).delay(800 + index * 60).springify()} style={lbStyles.row}>
      <Text style={[lbStyles.rank, { color: item.color }]}>{item.rank}</Text>
      <View style={lbStyles.info}>
        <Text style={lbStyles.name}>{item.name}</Text>
        <Text style={lbStyles.detail}>{item.detail}</Text>
      </View>
      <Text style={lbStyles.region}>{item.region}</Text>
    </Animated.View>
  )
}
const lbStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14, backgroundColor: '#F8FAF7', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 14, marginBottom: 6 },
  rank: { fontWeight: '800', fontSize: 18, width: 24, textAlign: 'center' },
  info: { flex: 1 },
  name: { fontWeight: '600', fontSize: 13, color: '#1B1B1B' },
  detail: { fontSize: 11, color: '#616161', marginTop: 1 },
  region: { fontSize: 9, fontWeight: '600', paddingVertical: 2, paddingHorizontal: 8, borderRadius: 50, backgroundColor: 'rgba(46,125,50,0.05)', color: '#2E7D32' },
})

/* ─── Certification Card ─── */
function CertCard() {
  return (
    <Animated.View entering={FadeInUp.duration(500).delay(850).springify()}>
      <LinearGradient colors={['#1A1A2E', '#16213E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={certStyles.card}>
        <View style={certStyles.glowBg} pointerEvents="none" />
        <Text style={certStyles.seal}>{'\u{1F3C6}'}</Text>
        <Text style={certStyles.title}>GOONA IQ Certified{'\n'}Poultry Strategist</Text>
        <Text style={certStyles.issued}>Issued May 2026</Text>
        <View style={certStyles.grid}>
          {[{ v: '94%', l: 'Survival Score' }, { v: '82%', l: 'Profitability' }, { v: '88%', l: 'Operational' }, { v: '91%', l: 'Discipline' }].map((c) => (
            <View key={c.l} style={certStyles.cell}>
              <Text style={certStyles.cellVal}>{c.v}</Text>
              <Text style={certStyles.cellLabel}>{c.l}</Text>
            </View>
          ))}
        </View>
        <View style={certStyles.actions}>
          <TouchableOpacity activeOpacity={0.85} style={certStyles.dlBtn} onPress={() => alert('Certificate downloaded')}>
            <Text style={certStyles.dlText}>Download</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.85} style={certStyles.shareBtn} onPress={() => Share.share({ message: 'I earned my GOONA IQ Certified Poultry Strategist badge!' })}>
            <Text style={certStyles.shareText}>Share</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  )
}
const certStyles = StyleSheet.create({
  card: { borderRadius: 28, padding: 24, alignItems: 'center', position: 'relative', overflow: 'hidden' },
  glowBg: { position: 'absolute', top: '-30%', right: '-20%', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(174,234,0,0.04)' },
  seal: { fontSize: 28, marginBottom: 6 },
  title: { fontWeight: '700', fontSize: 15, color: '#fff', textAlign: 'center', marginBottom: 2 },
  issued: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  cell: { width: (SCREEN_W - H_PADDING * 2 - 48 - 6) / 2, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  cellVal: { fontWeight: '700', fontSize: 18, color: '#AEEA00' },
  cellLabel: { fontSize: 9, color: 'rgba(255,255,255,0.35)' },
  actions: { flexDirection: 'row', gap: 8, width: '100%' },
  dlBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: '#AEEA00', alignItems: 'center' },
  dlText: { fontWeight: '600', fontSize: 12, color: '#1A1A2E' },
  shareBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center' },
  shareText: { fontWeight: '600', fontSize: 12, color: '#fff' },
})

/* ─── WhatsApp Share Card ─── */
function ShareCard() {
  const handleShare = () => {
    const msg = encodeURIComponent('I completed the GOONA 6-Week Broiler Challenge!%0A%0ASurvival Rate: 98%%0ASimulated Profit Margin: +42%%0A%0ACan you beat my score?')
    Linking.openURL(`https://wa.me/?text=${msg}`).catch(() => Share.share({ message: 'I completed the GOONA 6-Week Broiler Challenge!\n\nSurvival Rate: 98%\nSimulated Profit Margin: +42%\n\nCan you beat my score?' }))
  }

  return (
    <Animated.View entering={FadeInUp.duration(500).delay(900).springify()}>
      <LinearGradient colors={['#075E54', '#128C7E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={shareStyles.card}>
        <View style={shareStyles.header}>
          <View style={shareStyles.waIcon}>
            <Text style={shareStyles.waIconText}>{'\u{1F4AC}'}</Text>
          </View>
          <Text style={shareStyles.waName}>GOONA Academy</Text>
          <Text style={shareStyles.waTime}>Now</Text>
        </View>
        <View style={shareStyles.body}>
          <Text style={shareStyles.bodyText}>I completed the <Text style={{ fontWeight: '700' }}>GOONA 6-Week Broiler Challenge!</Text></Text>
          <View style={shareStyles.stats}>
            <Text style={shareStyles.stat}>Survival: <Text style={{ fontWeight: '700', color: '#AEEA00' }}>98%</Text></Text>
            <Text style={shareStyles.stat}>Profit: <Text style={{ fontWeight: '700', color: '#AEEA00' }}>+42%</Text></Text>
          </View>
          <Text style={shareStyles.challenge}>Can you beat my score?</Text>
        </View>
        <TouchableOpacity style={shareStyles.whatsappBtn} activeOpacity={0.85} onPress={handleShare}>
          <Text style={shareStyles.whatsappText}>{'\u{1F4AC}'} Share to WhatsApp</Text>
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  )
}
const shareStyles = StyleSheet.create({
  card: { borderRadius: 28, padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  waIcon: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#25D366', alignItems: 'center', justifyContent: 'center' },
  waIconText: { fontSize: 12 },
  waName: { fontWeight: '600', fontSize: 13, color: '#fff' },
  waTime: { fontSize: 10, color: 'rgba(255,255,255,0.4)', marginLeft: 'auto' },
  body: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 14, marginBottom: 10 },
  bodyText: { fontSize: 13, lineHeight: 19, color: '#fff', marginBottom: 8 },
  stats: { flexDirection: 'row', gap: 14, marginBottom: 6 },
  stat: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  challenge: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  whatsappBtn: { paddingVertical: 12, backgroundColor: '#25D366', borderRadius: 14, alignItems: 'center' },
  whatsappText: { fontWeight: '700', fontSize: 13, color: '#fff' },
})



/* ─── MAIN SCREEN ─── */
export default function GoonaAcademyScreen() {
  const insets = useSafeAreaInsets()
  const [activeSim, setActiveSim] = useState<SimType>('broiler')

  return (
    <View style={s.container}>
      <StatusBar style="dark" />

      <View style={s.bgBlob} pointerEvents="none" />
      <View style={s.bgGlow} pointerEvents="none" />
      <View style={s.bgContour1} pointerEvents="none" />
      <View style={s.bgContour2} pointerEvents="none" />
      <View style={s.bgDotGrid} pointerEvents="none">
        {Array.from({ length: 36 }).map((_, i) => (
          <View key={i} style={[s.bgDot, { left: `${(i % 6) * 17 + 5}%`, top: `${Math.floor(i / 6) * 18 + 5}%` }]} />
        ))}
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollInner, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 130 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── TOP NAV ─── */}
        <Animated.View entering={FadeInUp.duration(500).springify()} style={s.topNav}>
          <TouchableOpacity style={s.navBack} onPress={() => router.back()} activeOpacity={0.7}>
            <GoonaIcon icon={ArrowLeft} size={22} color="#1B1B1B" />
          </TouchableOpacity>
          <View style={s.navLogo}>
            <GoonaIcon icon={Sprout} size={22} color="#2E7D32" />
            <Text style={s.navLogoText}>GOONA</Text>
          </View>
          <Text style={s.navLabel}>Academy</Text>
        </Animated.View>

        {/* ─── HEADER ─── */}
        <Animated.View entering={FadeInUp.duration(500).delay(50).springify()} style={s.header}>
          <Text style={s.headerLabel}>Agribusiness Simulation Lab</Text>
          <Text style={s.headerTitle}>GOONA Academy</Text>
          <Text style={s.headerSub}>Run realistic livestock simulations and train like a professional agricultural operator.</Text>
        </Animated.View>

        {/* ─── HERO ─── */}
        <Animated.View entering={FadeInUp.duration(600).delay(100).springify()}>
          <LinearGradient colors={['#2E7D32', '#388E3C', '#AEEA00']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.heroCard}>
            <View style={s.heroGlow1} pointerEvents="none" />
            <View style={s.heroGlow2} pointerEvents="none" />
            <View style={s.heroLabel}>
              <PulseDot />
              <Text style={s.heroLabelText}>GOONA IQ TRAINING ACTIVE</Text>
            </View>
            <Text style={s.heroTitle}>Master Modern{"\n"}Farm Operations.</Text>
            <Text style={s.heroSub}>AI-powered simulation, coaching and operational intelligence.</Text>
            <View style={s.heroStats}>
              {[{ l: 'XP Level', v: '8' }, { l: 'Rank', v: 'Strategist' }, { l: 'Survival', v: '94%' }, { l: 'Profit', v: '+42%' }].map((st) => (
                <View key={st.l} style={s.heroStat}>
                  <Text style={s.heroStatLabel}>{st.l} </Text>
                  <Text style={s.heroStatValue}>{st.v}</Text>
                </View>
              ))}
            </View>
            <View style={s.heroOrb}>
              <AIOrb />
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ─── SIMULATION SELECTION ─── */}
        <SectionHeader title="Choose Your Challenge" tag="View All" />
        <Animated.View entering={FadeInUp.duration(500).delay(200).springify()} style={s.simCard}>
          <SimCard type="broiler" index={0} onPress={() => setActiveSim('broiler')} />
          <SimCard type="layer" index={1} onPress={() => setActiveSim('layer')} />
          <SimCard type="catfish" index={2} onPress={() => setActiveSim('catfish')} />
        </Animated.View>

        {/* ─── LIVE SIMULATION DASHBOARD ─── */}
        <SectionHeader title="Live Simulation" tag={SIM_DATA[activeSim].name} tagColor="#616161" tagBg="transparent" />
        <LiveDashboard simType={activeSim} />

        {/* ─── DECISION ENGINE ─── */}
        <SectionHeader title="Decision Engine" tag="CRITICAL" tagColor="#DC2626" tagBg="rgba(239,68,68,0.08)" />
        <DecisionEngine />

        {/* ─── GOONA IQ COACH ─── */}
        <SectionHeader title="GOONA IQ Coach" tag="AI ACTIVE" tagColor="#3B7A00" tagBg="rgba(174,234,0,0.12)" />
        <Animated.View entering={FadeInUp.duration(500).delay(600).springify()} style={s.coachCard}>
          <CoachMsg text="Your mortality rate is lower than 82% of simulated farms." index={0} />
          <CoachMsg text="Your savings discipline is excellent. Expansion readiness improved." index={1} />
          <CoachMsg text="Feed conversion efficiency is above benchmark standards. Top 15% of operators." index={2} />
        </Animated.View>

        {/* ─── FARM MASTERY ─── */}
        <SectionHeader title="Farm Mastery" />
        <MasteryCard />

        {/* ─── LEADERBOARD ─── */}
        <SectionHeader title="Top Virtual Poultry Operators" />
        {LEADERBOARD.map((item, i) => <LBRow key={item.name} item={item} index={i} />)}

        {/* ─── CERTIFICATION ─── */}
        <SectionHeader title="Certification" />
        <CertCard />

        {/* ─── WHATSAPP SHARE ─── */}
        <SectionHeader title="Share Achievement" />
        <ShareCard />

        {/* ─── DAILY CHALLENGE ─── */}
        <SectionHeader title="Daily Challenge" tag="+150 XP" tagColor="#92400E" tagBg="rgba(234,179,8,0.1)" />
        <DailyChallenge />

        <View style={{ height: 20 }} />
      </ScrollView>

      <BottomDock />
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAF7' },

  bgBlob: { position: 'absolute', top: -50, right: -50, width: 320, height: 320, borderRadius: 160, backgroundColor: 'rgba(232,245,233,0.35)', zIndex: 0 },
  bgGlow: { position: 'absolute', top: '35%', left: '50%', width: 240, height: 240, marginLeft: -120, marginTop: -120, borderRadius: 120, backgroundColor: 'rgba(232,245,233,0.2)', zIndex: 0 },
  bgContour1: { position: 'absolute', top: '10%', right: '-15%', width: 380, height: 130, zIndex: 0, borderWidth: 1, borderColor: 'rgba(46,125,50,0.06)', borderTopLeftRadius: 190, borderTopRightRadius: 190, borderBottomWidth: 0, transform: [{ rotate: '10deg' }] },
  bgContour2: { position: 'absolute', bottom: '20%', left: '-10%', width: 300, height: 100, zIndex: 0, borderWidth: 1, borderColor: 'rgba(46,125,50,0.06)', borderBottomLeftRadius: 150, borderBottomRightRadius: 150, borderTopWidth: 0, transform: [{ rotate: '-8deg' }] },
  bgDotGrid: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, opacity: 0.4 },
  bgDot: { position: 'absolute', width: 2, height: 2, borderRadius: 1, backgroundColor: 'rgba(46,125,50,0.1)' },

  scroll: { flex: 1, zIndex: 1 },
  scrollInner: { paddingHorizontal: H_PADDING },

  topNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 5 },
  navBack: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  navLogo: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  navLogoText: { fontWeight: '700', fontSize: 14, color: '#1B1B1B' },
  navLabel: { fontSize: 14, fontWeight: '500', color: '#616161' },

  header: { marginTop: 16, zIndex: 5 },
  headerLabel: { fontSize: 11, fontWeight: '600', color: '#2E7D32', letterSpacing: 2, textTransform: 'uppercase' },
  headerTitle: { fontWeight: '800', fontSize: 30, lineHeight: 38, color: '#1B1B1B', marginTop: 6 },
  headerSub: { fontSize: 14, lineHeight: 22, color: '#616161', marginTop: 6 },

  heroCard: { borderRadius: 28, padding: 24, marginTop: 20, overflow: 'hidden', shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 24 }, shadowOpacity: 0.25, shadowRadius: 60, elevation: 8, position: 'relative' },
  heroGlow1: { position: 'absolute', top: '-40%', right: '-20%', width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(174,234,0,0.10)' },
  heroGlow2: { position: 'absolute', bottom: '-15%', left: '-10%', width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.04)' },
  heroLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', paddingVertical: 5, paddingHorizontal: 14, borderRadius: 50, marginBottom: 12 },
  heroLabelText: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.85)', letterSpacing: 0.5 },
  heroTitle: { fontWeight: '800', fontSize: 28, lineHeight: 30, color: '#fff' },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 6 },
  heroStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 14 },
  heroStat: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 50, paddingVertical: 5, paddingHorizontal: 12 },
  heroStatLabel: { fontSize: 10, fontWeight: '500', color: 'rgba(255,255,255,0.7)' },
  heroStatValue: { fontSize: 10, fontWeight: '700', color: '#AEEA00' },
  heroOrb: { position: 'absolute', right: 16, top: '50%', marginTop: -40 },

  simCard: { backgroundColor: 'white', borderRadius: 28, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 24, elevation: 3, zIndex: 5, overflow: 'hidden' },

  coachCard: { backgroundColor: 'white', borderRadius: 28, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 18, elevation: 2, zIndex: 5 },
})
