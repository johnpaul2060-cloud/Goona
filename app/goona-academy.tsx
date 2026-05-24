import React, { useEffect, useState } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView, Pressable,
  StyleSheet, Dimensions, Linking, Share,
} from 'react-native'
import Svg, { Path, Circle, Rect, Line, G } from 'react-native-svg'
import { StatusBar } from 'expo-status-bar'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence,
  withTiming, withSpring, withDelay, FadeInUp, FadeIn,
  interpolate, Extrapolation, Easing,
} from 'react-native-reanimated'
import BottomDock from '../components/navigation/BottomDock'

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

type ChallengeQ = { id: number; cat: string; q: string; opts: string[]; correct: number; exp: string; xp: number }
const CHALLENGE_QUESTIONS: ChallengeQ[] = [
  { id: 1, cat: 'Poultry', q: 'What is the ideal broiler temperature during week 1?', opts: ['18°C', '24°C', '32°C', '40°C'], correct: 3, exp: 'Broiler chicks require 32-33°C during week 1, reduced by about 3°C each subsequent week.', xp: 30 },
  { id: 2, cat: 'Poultry', q: 'At what age do layer pullets typically start laying?', opts: ['12 weeks', '16 weeks', '18-20 weeks', '26 weeks'], correct: 3, exp: 'Layer pullets reach sexual maturity at 18-20 weeks of age, depending on breed and management.', xp: 30 },
  { id: 3, cat: 'Poultry', q: 'Recommended broiler stocking density per m²?', opts: ['8-10 birds', '14-18 birds', '22-25 birds', '30-35 birds'], correct: 2, exp: 'Standard broiler density is 14-18 birds per m² depending on climate and ventilation.', xp: 30 },
  { id: 4, cat: 'Feed Mgmt', q: 'Primary factor affecting feed conversion ratio (FCR)?', opts: ['Breed genetics', 'House temperature', 'Feed quality and formulation', 'Lighting schedule'], correct: 3, exp: 'Feed quality and formulation is the primary FCR driver — balanced nutrition = optimal growth with minimal waste.', xp: 30 },
  { id: 5, cat: 'Biosecurity', q: 'Minimum recommended downtime between flock cycles?', opts: ['3-5 days', '7-10 days', '14-21 days', '30 days'], correct: 3, exp: '14-21 days downtime breaks disease cycles, allows full cleaning, disinfection, and environment recovery.', xp: 30 },
  { id: 6, cat: 'Farm Finance', q: 'Feed as a percentage of total poultry production cost?', opts: ['30-40%', '50-55%', '60-70%', '75-85%'], correct: 3, exp: 'Feed accounts for 60-70% of total production costs, making it the most critical financial variable.', xp: 30 },
  { id: 7, cat: 'Workforce', q: 'Typical workers needed per 10,000 broiler birds?', opts: ['1-2 workers', '3-4 workers', '5-6 workers', '7-8 workers'], correct: 1, exp: 'Modern semi-automated operations need only 1-2 workers per 10,000 broilers for daily routines.', xp: 30 },
  { id: 8, cat: 'Recapitalization', q: 'Recommended savings rate from each cycle profit?', opts: ['5-10%', '15-20%', '30-40%', '50-60%'], correct: 2, exp: 'Setting aside 15-20% per cycle ensures sustainable growth and covers equipment replacement.', xp: 30 },
  { id: 9, cat: 'Operations', q: 'First action when daily mortality spikes above 3%?', opts: ['Increase medication', 'Quarantine and investigate', 'Reduce feeding', 'Cull all affected birds'], correct: 2, exp: 'Immediately quarantine and investigate. Identify the root cause before implementing treatment.', xp: 30 },
  { id: 10, cat: 'Operations', q: 'Adequate summer ventilation rate for broilers (m³/hr per kg)?', opts: ['0.5 m³/hr', '1-2 m³/hr', '3-5 m³/hr', '8-10 m³/hr'], correct: 4, exp: 'Peak summer requires 8-10 m³/hr per kg of body weight for proper heat dissipation.', xp: 30 },
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

/* ─── Back Icon ─── */
function BackIcon() {
  return (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <Path d="M15 18L9 12L15 6" stroke="#1B1B1B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
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

/* ─── Daily Challenge ─── */
const OPT_LETTERS = ['A', 'B', 'C', 'D']

function DailyChallenge() {
  const [phase, setPhase] = useState<'intro' | 'quiz' | 'results'>('intro')
  const [questions, setQuestions] = useState<ChallengeQ[]>([])
  const [qIdx, setQIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [showExp, setShowExp] = useState(false)
  const [xpEarned, setXpEarned] = useState(0)
  const [streak, setStreak] = useState(0)

  const TOTAL = 5
  const correctCount = questions.filter((q, i) => answers[i] === q.correct).length
  const pct = Math.round((correctCount / TOTAL) * 100)
  const answered = answers[qIdx] !== undefined
  const q = questions[qIdx]
  const isLast = qIdx === TOTAL - 1
  const compBonus = 50
  const perfBonus = correctCount === TOTAL ? 100 : 0
  const totalXp = xpEarned + compBonus + perfBonus

  const progressAnim = useSharedValue(0)
  useEffect(() => { progressAnim.value = withTiming((qIdx + 1) / TOTAL, { duration: 400, easing: Easing.out(Easing.cubic) }) }, [qIdx])
  const barStyle = useAnimatedStyle(() => ({ width: `${progressAnim.value * 100}%` }))

  const xpPop = useSharedValue(0)
  const xpPopStyle = useAnimatedStyle(() => ({
    opacity: xpPop.value, transform: [{ scale: interpolate(xpPop.value, [0, 1], [0.6, 1], Extrapolation.CLAMP) }],
  }))

  const start = () => {
    const shuffled = [...CHALLENGE_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, TOTAL)
    setQuestions(shuffled); setQIdx(0); setAnswers({}); setShowExp(false); setXpEarned(0); setStreak(0); setPhase('quiz')
  }

  const selectAnswer = (opt: number) => {
    if (answered) return
    setAnswers(prev => ({ ...prev, [qIdx]: opt }))
    setShowExp(true)
    if (opt === q.correct) {
      const bonus = streak >= 2 ? 15 : 0
      setXpEarned(prev => prev + q.xp + bonus)
      setStreak(prev => prev + 1)
      if (bonus > 0) {
        xpPop.value = withSequence(withTiming(1, { duration: 200 }), withDelay(1200, withTiming(0, { duration: 300 })))
      }
    } else {
      setStreak(0)
    }
  }

  const goNext = () => { setQIdx(prev => prev + 1); setShowExp(false) }
  const goPrev = () => { setQIdx(prev => prev - 1); setShowExp(answers[qIdx - 1] !== undefined) }
  const finish = () => setPhase('results')
  const restart = () => setPhase('intro')

  /* Intro */
  if (phase === 'intro') {
    return (
      <Animated.View entering={FadeInUp.duration(500).delay(950).springify()}>
        <LinearGradient colors={['#FEF9C3', '#FFF7ED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={dcStyles.card}>
          <View style={dcStyles.introHeader}>
            <View style={dcStyles.introIcon}>
              <Text style={dcStyles.introEmoji}>{'\u{1F9E0}'}</Text>
            </View>
            <View style={dcStyles.introHeaderText}>
              <Text style={dcStyles.title}>Daily Challenge</Text>
              <Text style={dcStyles.subtitle}>Test your operational intelligence</Text>
            </View>
          </View>
          <View style={dcStyles.introBadges}>
            <View style={dcStyles.introBadge}><Text style={dcStyles.introBadgeText}>{'\u{1F3C6}'} 5 Questions</Text></View>
            <View style={dcStyles.introBadge}><Text style={dcStyles.introBadgeText}>{'\u26A1'} Mix of Categories</Text></View>
            <View style={dcStyles.introBadge}><Text style={dcStyles.introBadgeText}>{'\u2728'} Up to +250 XP</Text></View>
          </View>
          <Text style={dcStyles.introDesc}>Answer operational scenarios across poultry, feed management, biosecurity, finance, workforce, and more. Each correct answer earns XP and streaks multiply your rewards.</Text>
          <View style={dcStyles.introCats}>
            {['Poultry', 'Feed', 'Biosecurity', 'Finance', 'Workforce', 'Recap', 'Ops'].map(c => (
              <View key={c} style={dcStyles.catTag}><Text style={dcStyles.catTagText}>{c}</Text></View>
            ))}
          </View>
          <TouchableOpacity activeOpacity={0.85} onPress={start} style={dcStyles.startBtn}>
            <LinearGradient colors={['#D97706', '#B45309']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={dcStyles.startBtnGrad}>
              <Text style={dcStyles.startBtnText}>Start Challenge {'\u2192'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>
    )
  }

  /* Results */
  if (phase === 'results') {
    const stars = pct >= 90 ? 5 : pct >= 70 ? 4 : pct >= 50 ? 3 : pct >= 30 ? 2 : 1
    const rankMsg = pct >= 80 ? 'Rank +2 — Strong operational intelligence.' : pct >= 50 ? 'Rank +1 — Keep building your skills.' : 'No rank change. Review the feedback below.'
    const insight = pct >= 80 ? 'You demonstrate strong operational awareness across multiple farm domains.' : pct >= 50 ? 'You have solid foundational knowledge in key areas. Focus on your weak spots.' : 'Review the fundamentals in each category to build your operational base.'
    const reco = pct >= 80 ? 'Try the Advanced Simulation for a harder challenge.' : pct >= 50 ? 'Focus on Biosecurity and Farm Finance categories.' : 'Start with Poultry 101 and work your way up.'
    return (
      <Animated.View entering={FadeInUp.duration(500).delay(300).springify()}>
        <LinearGradient colors={['#F0FDF4', '#FFF7ED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={dcStyles.rsCard}>
          {/* Score Circle */}
          <View style={dcStyles.rsCircle}>
            <Text style={dcStyles.rsCirclePct}>{pct}%</Text>
            <Text style={dcStyles.rsCircleLabel}>Score</Text>
          </View>
          {/* Stars */}
          <View style={dcStyles.rsStars}>
            {[1, 2, 3, 4, 5].map(s => (
              <Animated.Text key={s} entering={FadeInUp.duration(300).delay(200 + s * 100).springify()} style={[dcStyles.rsStar, { opacity: s <= stars ? 1 : 0.2 }]}>{'\u2B50'}</Animated.Text>
            ))}
          </View>
          <Text style={dcStyles.rsScoreText}>{correctCount} of {TOTAL} correct</Text>
          {/* XP Earned */}
          <View style={dcStyles.rsXpRow}>
            <Text style={dcStyles.rsXpLabel}>Total XP Earned</Text>
            <Text style={dcStyles.rsXpValue}>+{totalXp}</Text>
          </View>
          {perfBonus > 0 && (
            <Animated.View entering={FadeInUp.duration(400).delay(600).springify()} style={dcStyles.rsPerfBadge}>
              <Text style={dcStyles.rsPerfText}>{'\u{1F3C6}'} Perfect Score Bonus +{perfBonus} XP</Text>
            </Animated.View>
          )}
          {/* Rank */}
          <View style={dcStyles.rsRow}>
            <Text style={dcStyles.rsRowIcon}>{'\u{1F3C6}'}</Text>
            <Text style={dcStyles.rsRowText}>{rankMsg}</Text>
          </View>
          {/* Insight */}
          <View style={dcStyles.rsRow}>
            <Text style={dcStyles.rsRowIcon}>{'\u{1F4A1}'}</Text>
            <Text style={dcStyles.rsRowText}>{insight}</Text>
          </View>
          {/* Recommendation */}
          <View style={dcStyles.rsRow}>
            <Text style={dcStyles.rsRowIcon}>{'\u{1F4CB}'}</Text>
            <Text style={dcStyles.rsRowText}>{reco}</Text>
          </View>
          {/* Score Breakdown */}
          <View style={dcStyles.rsBreakdown}>
            <Text style={dcStyles.rsBdTitle}>Breakdown</Text>
            {questions.slice(0, 5).map((qItem, i) => (
              <View key={i} style={dcStyles.rsBdRow}>
                <Text style={dcStyles.rsBdDot}>{answers[i] === qItem.correct ? '\u2705' : '\u274C'}</Text>
                <Text style={dcStyles.rsBdQ} numberOfLines={1}>{qItem.q}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity activeOpacity={0.85} onPress={restart} style={dcStyles.tryBtn}>
            <Text style={dcStyles.tryBtnText}>Try Again {'\u21BB'}</Text>
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>
    )
  }

  /* Quiz */
  return (
    <Animated.View entering={FadeInUp.duration(500).delay(950).springify()}>
      <LinearGradient colors={['#FEF9C3', '#FFF7ED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={dcStyles.card}>
        {/* Progress */}
        <View style={dcStyles.progressRow}>
          <View style={dcStyles.progressTrack}>
            <Animated.View style={[dcStyles.progressFill, barStyle]} />
          </View>
          <Text style={dcStyles.progressNum}>{qIdx + 1} of {TOTAL}</Text>
        </View>
        {/* Category */}
        <View style={dcStyles.catRow}>
          <View style={dcStyles.catBadge}>
            <Text style={dcStyles.catBadgeText}>{q?.cat}</Text>
          </View>
        </View>
        {/* Question */}
        <Animated.View key={qIdx} entering={FadeInUp.duration(400).springify().damping(15)}>
          <Text style={dcStyles.questionText}>{q?.q}</Text>
          {/* Options */}
          {q?.opts.map((optText, i) => {
            const optNum = i + 1
            const isSel = answers[qIdx] === optNum
            const isCorr = q.correct === optNum
            let bg = 'rgba(255,255,255,0.5)'
            let bc = 'rgba(234,179,8,0.2)'
            let lbg = '#E8ECEE'
            let lc = '#94A3B8'
            let tc = '#1B1B1B'
            let op: any = 1
            if (answered) {
              if (isCorr) { bg = 'rgba(22,163,74,0.08)'; bc = '#16A34A'; lbg = '#16A34A'; lc = '#fff'; tc = '#166534' }
              else if (isSel) { bg = 'rgba(239,68,68,0.08)'; bc = '#EF4444'; lbg = '#EF4444'; lc = '#fff'; tc = '#991B1B' }
              else { op = 0.45 }
            }
            const isDimmed = answered && !isSel && !isCorr
            return (
              <TouchableOpacity
                key={i}
                activeOpacity={0.85}
                onPress={() => selectAnswer(optNum)}
                style={[dcStyles.opt, { backgroundColor: bg, borderColor: bc, opacity: op }]}
                disabled={answered}
              >
                <View style={[dcStyles.optLetter, { backgroundColor: lbg }]}>
                  <Text style={[dcStyles.optLetterText, { color: lc }]}>{OPT_LETTERS[i]}</Text>
                </View>
                <Text style={[dcStyles.optText, { color: tc }]}>{optText}</Text>
                {answered && isCorr && <Text style={dcStyles.optIcon}>{'\u2713'}</Text>}
                {answered && isSel && !isCorr && <Text style={[dcStyles.optIcon, { color: '#EF4444' }]}>{'\u2717'}</Text>}
              </TouchableOpacity>
            )
          })}
        </Animated.View>
        {/* GOONA IQ Feedback */}
        {showExp && (
          <Animated.View entering={FadeInUp.duration(300).springify()} style={dcStyles.feedback}>
            <View style={dcStyles.feedbackHeader}>
              <Text style={dcStyles.feedbackLabel}>GOONA IQ</Text>
              <Text style={dcStyles.feedbackScore}>{answers[qIdx] === q.correct ? 'Correct' : 'Incorrect'}</Text>
            </View>
            <Text style={dcStyles.feedbackText}>{q.exp}</Text>
          </Animated.View>
        )}
        {/* XP Notification */}
        <Animated.View style={[dcStyles.xpNotif, xpPopStyle]} pointerEvents="none">
          <Text style={dcStyles.xpNotifText}>{'\u26A1'} +15 STREAK BONUS</Text>
        </Animated.View>
        {/* Navigation */}
        <View style={dcStyles.navRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={goPrev}
            style={[dcStyles.navBtn, dcStyles.navPrev, { opacity: qIdx === 0 ? 0.3 : 1 }]}
            disabled={qIdx === 0}
          >
            <Text style={dcStyles.navPrevText}>{'\u2190'} Previous</Text>
          </TouchableOpacity>
          {isLast ? (
            <TouchableOpacity activeOpacity={0.85} onPress={finish} style={[dcStyles.navBtn, dcStyles.navFinish]}>
              <LinearGradient colors={['#D97706', '#B45309']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={dcStyles.navFinishGrad}>
                <Text style={dcStyles.navFinishText}>Finish {'\u2192'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity activeOpacity={0.85} onPress={goNext} style={[dcStyles.navBtn, dcStyles.navNext]}>
              <Text style={dcStyles.navNextText}>Next {'\u2192'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    </Animated.View>
  )
}
const dcStyles = StyleSheet.create({
  card: { borderRadius: 28, padding: 20, borderWidth: 1, borderColor: 'rgba(234,179,8,0.15)' },
  title: { fontWeight: '700', fontSize: 17, color: '#92400E' },
  subtitle: { fontSize: 12, color: '#A16207', marginTop: 1 },
  /* Intro */
  introHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  introIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(234,179,8,0.12)', alignItems: 'center', justifyContent: 'center' },
  introEmoji: { fontSize: 20 },
  introHeaderText: { flex: 1 },
  introBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 10 },
  introBadge: { backgroundColor: 'rgba(234,179,8,0.08)', borderWidth: 1, borderColor: 'rgba(234,179,8,0.15)', paddingVertical: 3, paddingHorizontal: 10, borderRadius: 50 },
  introBadgeText: { fontSize: 9, fontWeight: '600', color: '#92400E' },
  introDesc: { fontSize: 13, color: '#78350F', lineHeight: 19, marginBottom: 12 },
  introCats: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 14 },
  catTag: { backgroundColor: 'rgba(46,125,50,0.06)', paddingVertical: 3, paddingHorizontal: 10, borderRadius: 50, borderWidth: 1, borderColor: 'rgba(46,125,50,0.1)' },
  catTagText: { fontSize: 9, fontWeight: '600', color: '#2E7D32' },
  startBtn: { borderRadius: 14, overflow: 'hidden', shadowColor: '#D97706', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 4 },
  startBtnGrad: { paddingVertical: 14, alignItems: 'center' },
  startBtnText: { fontWeight: '700', fontSize: 15, color: '#fff' },
  /* Quiz */
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  progressTrack: { flex: 1, height: 5, backgroundColor: 'rgba(234,179,8,0.15)', borderRadius: 10, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#D97706', borderRadius: 10 },
  progressNum: { fontSize: 11, fontWeight: '600', color: '#92400E', width: 46, textAlign: 'right' },
  catRow: { marginBottom: 8 },
  catBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(46,125,50,0.08)', borderWidth: 1, borderColor: 'rgba(46,125,50,0.12)', paddingVertical: 3, paddingHorizontal: 12, borderRadius: 50 },
  catBadgeText: { fontSize: 9, fontWeight: '700', color: '#2E7D32', letterSpacing: 0.5, textTransform: 'uppercase' },
  questionText: { fontWeight: '600', fontSize: 15, color: '#1B1B1B', lineHeight: 22, marginBottom: 12 },
  opt: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, paddingHorizontal: 14, borderWidth: 1.5, borderRadius: 14, marginBottom: 7, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  optLetter: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  optLetterText: { fontSize: 11, fontWeight: '700' },
  optText: { fontSize: 13, fontWeight: '500', flex: 1, lineHeight: 18 },
  optIcon: { fontSize: 16, fontWeight: '700', color: '#16A34A' },
  feedback: { marginTop: 8, padding: 12, backgroundColor: 'rgba(46,125,50,0.04)', borderLeftWidth: 3, borderLeftColor: '#2E7D32', borderRadius: 12 },
  feedbackHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  feedbackLabel: { fontSize: 9, fontWeight: '700', backgroundColor: '#2E7D32', color: '#fff', paddingVertical: 2, paddingHorizontal: 8, borderRadius: 50, overflow: 'hidden' },
  feedbackScore: { fontSize: 10, fontWeight: '600', color: '#2E7D32' },
  feedbackText: { fontSize: 12, color: '#1B1B1B', lineHeight: 18 },
  xpNotif: { position: 'absolute', top: 8, right: 12, backgroundColor: '#D97706', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 50, zIndex: 10 },
  xpNotifText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, gap: 8 },
  navBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12 },
  navPrev: { backgroundColor: 'rgba(255,255,255,0.6)', borderWidth: 1, borderColor: 'rgba(234,179,8,0.15)' },
  navPrevText: { fontSize: 13, fontWeight: '600', color: '#92400E' },
  navNext: { backgroundColor: 'rgba(234,179,8,0.08)', borderWidth: 1, borderColor: 'rgba(234,179,8,0.2)' },
  navNextText: { fontSize: 13, fontWeight: '600', color: '#92400E' },
  navFinish: { overflow: 'hidden', borderWidth: 0, shadowColor: '#D97706', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
  navFinishGrad: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12 },
  navFinishText: { fontWeight: '700', fontSize: 14, color: '#fff' },
  /* Results */
  rsCard: { borderRadius: 28, padding: 24, borderWidth: 1, borderColor: 'rgba(46,125,50,0.12)', alignItems: 'center' },
  rsCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F0FDF4', borderWidth: 3, borderColor: '#16A34A', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  rsCirclePct: { fontWeight: '800', fontSize: 22, color: '#166534' },
  rsCircleLabel: { fontSize: 9, fontWeight: '600', color: '#16A34A', marginTop: -1 },
  rsStars: { flexDirection: 'row', gap: 4, marginBottom: 6 },
  rsStar: { fontSize: 20 },
  rsScoreText: { fontSize: 13, fontWeight: '600', color: '#166534', marginBottom: 12 },
  rsXpRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(234,179,8,0.06)', borderWidth: 1, borderColor: 'rgba(234,179,8,0.12)', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 14, marginBottom: 10, width: '100%' },
  rsXpLabel: { fontSize: 12, fontWeight: '500', color: '#92400E' },
  rsXpValue: { fontWeight: '800', fontSize: 18, color: '#D97706' },
  rsPerfBadge: { backgroundColor: 'rgba(22,163,74,0.08)', borderWidth: 1, borderColor: '#16A34A', borderRadius: 50, paddingVertical: 4, paddingHorizontal: 14, marginBottom: 10 },
  rsPerfText: { fontSize: 11, fontWeight: '700', color: '#166534' },
  rsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8, width: '100%' },
  rsRowIcon: { fontSize: 14, marginTop: 1 },
  rsRowText: { fontSize: 12, color: '#1B1B1B', lineHeight: 18, flex: 1 },
  rsBreakdown: { width: '100%', marginTop: 6, marginBottom: 14 },
  rsBdTitle: { fontSize: 12, fontWeight: '700', color: '#1B1B1B', marginBottom: 6 },
  rsBdRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  rsBdDot: { fontSize: 12 },
  rsBdQ: { fontSize: 11, color: '#616161', flex: 1 },
  tryBtn: { paddingVertical: 12, paddingHorizontal: 32, backgroundColor: '#16A34A', borderRadius: 14, shadowColor: '#16A34A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 4 },
  tryBtnText: { fontWeight: '700', fontSize: 14, color: '#fff' },
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
            <BackIcon />
          </TouchableOpacity>
          <View style={s.navLogo}>
            <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <Path d="M12 2C12 2 7 8 7 12C7 14.5 8.5 17 10 18.5C9.5 17 9 16 9 15C9 11.5 11 7 12 2Z" fill="#2E7D32" />
              <Path d="M12 2C12 2 17 8 17 12C17 14.5 15.5 17 14 18.5C14.5 17 15 16 15 15C15 11.5 13 7 12 2Z" fill="#388E3C" />
            </Svg>
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
