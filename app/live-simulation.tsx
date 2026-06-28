import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Dimensions, Animated as RNAnimated, Modal,
  Share,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import AsyncStorage from '@react-native-async-storage/async-storage'
import GoonaIcon from '../components/ui/GoonaIcon'
import { Icons } from '../shared/icons'

const { width: SW } = Dimensions.get('window')
const HP = 16

const STORAGE_KEY = 'goona_live_sim_v1'

type SpeciesKey = 'broiler' | 'layer' | 'catfish'
type LogType = 'good' | 'warn' | 'bad' | 'info'

interface SpeciesData {
  key: SpeciesKey
  label: string
  run: string
  short: string
  weeks: number
  birds: number
  wStart: number
  wTarget: number
  survTarget: number
  feed: number
  cash: number
  price: number
  baseline: number
  unit: string
  feedUnit: string
  wCurve: number[]
  feedWk: number[]
  desc: string
  emoji: string
  color: string
}

const SPECIES: Record<SpeciesKey, SpeciesData> = {
  broiler: {
    key: 'broiler', label: 'Broiler Chicken', run: '6-Week Broiler Run', short: 'Broiler',
    weeks: 6, birds: 4300, wStart: 0.18, wTarget: 2.5, survTarget: 95, feed: 16000, cash: 480000,
    price: 1950, baseline: 17100000, unit: 'birds', feedUnit: 'kg',
    wCurve: [0.18, 0.46, 0.88, 1.35, 1.85, 2.22, 2.5],
    feedWk: [0.22, 0.46, 0.72, 0.98, 1.18, 1.32],
    desc: '4,300 chicks · target 2.5kg · mortality <5%',
    emoji: '\u{1F425}', color: '#F0B43C',
  },
  layer: {
    key: 'layer', label: 'Layer Hen', run: 'Layer Rearing Run', short: 'Layer',
    weeks: 8, birds: 3000, wStart: 0.16, wTarget: 1.6, survTarget: 96, feed: 13000, cash: 520000,
    price: 2100, baseline: 9600000, unit: 'birds', feedUnit: 'kg',
    wCurve: [0.16, 0.33, 0.55, 0.80, 1.05, 1.25, 1.42, 1.52, 1.60],
    feedWk: [0.18, 0.34, 0.50, 0.66, 0.80, 0.90, 0.98, 1.04],
    desc: '3,000 pullets · long cycle · egg-flock build-up',
    emoji: '\u{1F413}', color: '#C2456E',
  },
  catfish: {
    key: 'catfish', label: 'Catfish', run: 'Catfish Pond Cycle', short: 'Catfish',
    weeks: 8, birds: 10000, wStart: 0.05, wTarget: 0.9, survTarget: 82, feed: 14000, cash: 430000,
    price: 1400, baseline: 8500000, unit: 'fish', feedUnit: 'kg',
    wCurve: [0.05, 0.12, 0.22, 0.36, 0.52, 0.66, 0.79, 0.86, 0.90],
    feedWk: [0.06, 0.13, 0.22, 0.32, 0.42, 0.50, 0.56, 0.60],
    desc: '10,000 fingerlings · pond cycle · survival >80%',
    emoji: '\u{1F41F}', color: '#1E6E8C',
  },
}

interface ChoiceDef {
  label: string
  tip: string
  cost: string
}

interface EventChoice {
  label: string
  tip: string
  cost: string
  apply: (S: SimState) => { dSurv?: number; dWeight?: number; dCash?: number; dFeed?: number; grade: string; verdict: string }
}

interface EventDef {
  id: string
  kicker: string
  tone: 'amber' | 'red' | 'green'
  icon: string
  title: string
  desc: string
  choices: EventChoice[]
}

interface LogEntry {
  wk: number
  type: LogType
  title: string
  sub: string
}

interface PendingEvent {
  type: 'calm' | 'event'
  resolved: boolean
  picked?: number | null
  verdict?: string
  grade?: string
  def?: EventDef
  tip?: string
}

interface SimState {
  sp: SpeciesKey
  week: number
  weeks: number
  startBirds: number
  birds: number
  survival: number
  weight: number
  feed: number
  cash: number
  fcr: number
  feedConsumed: number
  xp: number
  sold: number
  soldRevenue: number
  log: LogEntry[]
  pending: PendingEvent | null
  finished: boolean
}

const EVENTS: EventDef[] = [
  {
    id: 'heatwave', kicker: 'Weather Event', tone: 'amber',
    icon: '\u2600\uFE0F',
    title: 'Heatwave warning',
    desc: 'A 3-day heat spike is forecast. Birds are heat-sensitive — uncontrolled, you could lose stock fast.',
    choices: [
      { label: 'Run extra ventilation', tip: 'Fans + open curtains', cost: '\u20A670k',
        apply: (S) => { S.cash -= 70000; return { dSurv: +1, dWeight: -0.02, dCash: -70000, grade: 'good', verdict: 'Smart. Airflow held core temp down — mortality stayed flat through the spike.' } } },
      { label: 'Add electrolytes to water', tip: 'Cheaper, partial relief', cost: '\u20A630k',
        apply: (S) => { S.cash -= 30000; return { dSurv: -1.5, dWeight: -0.04, dCash: -30000, grade: 'ok', verdict: 'A reasonable budget move — birds coped, but weight gain dipped slightly from the stress.' } } },
      { label: 'Do nothing', tip: 'Save the cash, take the risk', cost: 'Free',
        apply: (S) => { return { dSurv: -5, dWeight: -0.08, dCash: 0, grade: 'bad', verdict: 'Risky. Heat stress cut into the flock — survival dropped ~5%. Ventilation pays for itself.' } } },
    ],
  },
  {
    id: 'disease', kicker: 'Health Alert', tone: 'red',
    icon: '\u{1F637}',
    title: 'Disease outbreak risk',
    desc: 'Birds in House 2 show early signs of a respiratory infection. It can spread within days.',
    choices: [
      { label: 'Vaccinate + medicate now', tip: 'Full intervention', cost: '\u20A6120k',
        apply: (S) => { S.cash -= 120000; return { dSurv: +2, dWeight: 0, dCash: -120000, grade: 'good', verdict: 'Decisive. You contained it early — survival actually improved vs. the natural baseline.' } } },
      { label: 'Isolate affected pen', tip: "Contain, don't treat", cost: '\u20A625k',
        apply: (S) => { S.cash -= 25000; return { dSurv: -4, dWeight: -0.03, dCash: -25000, grade: 'ok', verdict: 'Partial fix. Isolation slowed spread but some loss still slipped through.' } } },
      { label: 'Wait and watch', tip: 'Hope it passes', cost: 'Free',
        apply: (S) => { return { dSurv: -9, dWeight: -0.06, dCash: 0, grade: 'bad', verdict: 'Costly gamble. The infection spread — survival fell ~9%. In poultry, early action wins.' } } },
    ],
  },
  {
    id: 'feeddelay', kicker: 'Supply Disruption', tone: 'amber',
    icon: '\u{1F69A}',
    title: 'Feed delivery delayed',
    desc: "Your supplier's truck is stuck — the next feed drop is 4 days late. Your store may not bridge the gap.",
    choices: [
      { label: 'Buy emergency feed', tip: '+2,000kg at a premium', cost: '\u20A6140k',
        apply: (S) => { S.cash -= 140000; S.feed += 2000; return { dSurv: 0, dWeight: +0.02, dCash: -140000, dFeed: +2000, grade: 'good', verdict: 'Steady. You kept troughs full — growth never stalled despite the delay.' } } },
      { label: 'Ration the current store', tip: 'Stretch what you have', cost: 'Free',
        apply: (S) => { return { dSurv: -1, dWeight: -0.1, dCash: 0, grade: 'ok', verdict: 'Birds went a little hungry — weight gain slowed. Acceptable if feed arrives soon.' } } },
      { label: 'Do nothing', tip: 'Assume it works out', cost: 'Free',
        apply: (S) => { return { dSurv: -3, dWeight: -0.14, dCash: 0, grade: 'bad', verdict: 'Underfed birds lose condition fast — weight and survival both dipped.' } } },
    ],
  },
  {
    id: 'market', kicker: 'Market Swing', tone: 'green',
    icon: '\u{1F4C8}',
    title: 'Live price surges',
    desc: 'Market price for your stock jumped 18% this week on tight supply. Sell a portion early, or hold?',
    choices: [
      { label: 'Sell 600 early at peak', tip: 'Lock in the high price', cost: '+cash',
        apply: (S, sp) => { const n = Math.min(600, Math.floor(S.birds * 0.2)); const rev = Math.round(n * S.weight * sp.price * 1.18); S.birds -= n; S.startBirds -= n; S.sold += n; S.soldRevenue += rev; S.cash += rev; return { dCash: +rev, grade: 'good', verdict: `Opportunistic — you banked \u20A6${Math.round(rev / 1000)}k at the peak.` } } },
      { label: 'Hold the whole flock', tip: 'Bet on more weight', cost: 'Free',
        apply: (S) => { return { dWeight: +0.03, grade: 'ok', verdict: 'You held for growth. Fine if prices stay firm — but you passed on a peak.' } } },
    ],
  },
  {
    id: 'predator', kicker: 'Biosecurity', tone: 'red',
    icon: '\u{1F6E1}\uFE0F',
    title: 'Predator breach',
    desc: 'A gap in the perimeter let a predator in overnight. Reinforce now, or risk repeat losses?',
    choices: [
      { label: 'Reinforce housing tonight', tip: 'Seal every gap', cost: '\u20A660k',
        apply: (S) => { S.cash -= 60000; return { dSurv: -1, dCash: -60000, grade: 'good', verdict: 'Locked down. One bad night, then secure — minimal loss and no repeat.' } } },
      { label: 'Patch it tomorrow', tip: "Save tonight's labour", cost: 'Free',
        apply: (S) => { return { dSurv: -5, grade: 'bad', verdict: "A second night of losses — survival took a 5% hit. Biosecurity can't wait." } } },
    ],
  },
  {
    id: 'vaccine', kicker: 'Schedule Due', tone: 'green',
    icon: '\u{1F48A}',
    title: 'Vaccination scheduled',
    desc: "The flock is due for its routine vaccination. On schedule it's cheap insurance; skip it and you gamble.",
    choices: [
      { label: 'Vaccinate on schedule', tip: 'Routine protection', cost: '\u20A650k',
        apply: (S) => { S.cash -= 50000; return { dSurv: +1.5, dCash: -50000, grade: 'good', verdict: 'Textbook. Protected for the weeks ahead — exactly what a healthy run looks like.' } } },
      { label: 'Skip to save cash', tip: 'Risk it this cycle', cost: 'Free',
        apply: (S) => { return { dSurv: -4, grade: 'bad', verdict: 'Short-term saving, long-term risk — unprotected birds took losses later.' } } },
    ],
  },
]

function clamp(v: number, a: number, b: number) { return Math.max(a, Math.min(b, v)) }
function fmtInt(n: number) { return Math.round(n).toLocaleString('en-US') }
function fmtMoney(n: number) {
  const neg = n < 0; n = Math.abs(Math.round(n))
  let s: string
  if (n >= 1e6) s = (n / 1e6).toFixed(n >= 1e7 ? 1 : 2) + 'M'
  else if (n >= 1e3) s = Math.round(n / 1e3) + 'k'
  else s = '' + n
  return (neg ? '-\u20A6' : '\u20A6') + s
}

function newRun(sp: SpeciesKey): SimState {
  const d = SPECIES[sp]
  return {
    sp, week: 0, weeks: d.weeks,
    startBirds: d.birds, birds: d.birds, survival: 100,
    weight: d.wStart, feed: d.feed, cash: d.cash, fcr: 0,
    feedConsumed: 0, xp: 0, sold: 0, soldRevenue: 0,
    log: [{ wk: 0, type: 'info', title: 'Flock placed', sub: fmtInt(d.birds) + ' ' + d.unit + ' settled in \u00B7 cycle begins' }],
    pending: null, finished: false,
  }
}

function genWeekEvent(S: SimState): PendingEvent {
  const roll = Math.random()
  const eventChance = S.week === 0 ? 0.55 : 0.72
  if (roll > eventChance) {
    const tips = [
      'Weigh a sample of birds weekly — catching a slow week early saves the whole batch.',
      'Keep water cool and clean; intake drives feed intake, which drives growth.',
      'Walk the houses at night — quiet breathing means a calm, healthy flock.',
      'Log everything. The farms that win track their own numbers.',
      'Consistent feed times reduce stress and improve your FCR over the cycle.',
    ]
    return { type: 'calm', resolved: true, tip: tips[Math.floor(Math.random() * tips.length)] }
  }
  const def = EVENTS[Math.floor(Math.random() * EVENTS.length)]
  return { type: 'event', def, resolved: false, picked: null, verdict: null }
}

/* ─── Sub-components ─── */

function GaugeRing({ pct, size = 48, stroke = 5, color = '#AEEA00', text }: { pct: number; size?: number; stroke?: number; color?: string; text?: string }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - clamp(pct, 0, 1))
  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: size * 0.26, fontWeight: '700', color: text ? '#fff' : 'rgba(255,255,255,0.9)' }}>{text || Math.round(pct * 100) + '%'}</Text>
      </View>
    </View>
  )
}

function HealthDot({ color }: { color: string }) {
  const anim = useRef(new RNAnimated.Value(1)).current
  useEffect(() => {
    RNAnimated.loop(RNAnimated.sequence([
      RNAnimated.timing(anim, { toValue: 0.3, duration: 1500, useNativeDriver: true }),
      RNAnimated.timing(anim, { toValue: 1, duration: 1500, useNativeDriver: true }),
    ])).start()
  }, [])
  return <RNAnimated.View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, shadowColor: color, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 8, elevation: 4, opacity: anim }} />
}

function HealthState(survival: number) {
  if (survival >= 94) return { label: 'Thriving', dot: '#D4FF4D', cls: 'ok' }
  if (survival >= 85) return { label: 'Stable', dot: '#AEEA00', cls: 'ok' }
  if (survival >= 72) return { label: 'At Risk', dot: '#FFC83D', cls: 'warn' }
  return { label: 'Critical', dot: '#FF7A6B', cls: 'bad' }
}

function BirdIcon({ emoji, alive = true }: { emoji: string; alive?: boolean }) {
  return (
    <View style={{ opacity: alive ? 1 : 0.26 }}>
      <Text style={{ fontSize: 18 }}>{emoji}</Text>
    </View>
  )
}

/* ─── MAIN SCREEN ─── */
export default function LiveSimulationScreen() {
  const insets = useSafeAreaInsets()

  const [S, setS] = useState<SimState | null>(null)
  const [showSpecies, setShowSpecies] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [selectedSp, setSelectedSp] = useState<SpeciesKey>('broiler')
  const [toastMsg, setToastMsg] = useState('')
  const [toastBad, setToastBad] = useState(false)
  const tTimer = useRef<ReturnType<typeof setTimeout>>()

  const showToast = useCallback((msg: string, bad = false) => {
    setToastMsg(msg); setToastBad(bad)
    clearTimeout(tTimer.current)
    tTimer.current = setTimeout(() => setToastMsg(''), 1900)
  }, [])

  const persist = useCallback(async (state: SimState) => {
    try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch { /* in-memory ok */ }
  }, [])

  const loadSim = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed: SimState = JSON.parse(raw)
        if (parsed && parsed.sp && SPECIES[parsed.sp]) {
          if (!parsed.pending && parsed.week < parsed.weeks) {
            parsed.pending = genWeekEvent(parsed)
          }
          setS(parsed)
          return
        }
      }
    } catch { /* fall through */ }
    const fresh = newRun('broiler')
    fresh.pending = genWeekEvent(fresh)
    setS(fresh)
    setShowSpecies(true)
  }, [])

  useEffect(() => { loadSim() }, [])

  const stateRef = useRef<SimState>(S)
  stateRef.current = S

  const updateState = useCallback((next: SimState) => {
    setS(next)
    persist(next)
  }, [persist])

  const startFresh = (sp: SpeciesKey) => {
    const run = newRun(sp)
    run.pending = genWeekEvent(run)
    updateState(run)
    setShowSpecies(false)
    setShowResult(false)
    showToast(`New ${SPECIES[sp].short} run started`)
  }

  if (!S) {
    return <View style={{ flex: 1, backgroundColor: '#1E7A3D', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Loading simulation...</Text>
    </View>
  }

  const sp = SPECIES[S.sp]
  const health = HealthState(S.survival)
  const progress = S.week / S.weeks
  const lvl = Math.floor(S.xp / 500) + 1
  const xpInLvl = (S.xp % 500) / 500
  const feedNeed = S.week < S.weeks ? Math.round(S.birds * sp.feedWk[S.week]) : 0

  const projectedProfit = () => {
    const endWeight = Math.max(S.weight, sp.wTarget)
    const flockValue = S.birds * endWeight * sp.price
    return S.cash + flockValue + S.soldRevenue - sp.baseline
  }

  const advanceWeek = () => {
    if (S.pending && !S.pending.resolved) return
    if (S.finished || S.week >= S.weeks) {
      finishRun()
      return
    }
    const next = { ...S }
    const need = Math.round(next.birds * sp.feedWk[next.week])
    let deficit = 0
    if (next.feed >= need) { next.feed -= need }
    else { deficit = (need - next.feed) / need; next.feed = 0 }
    next.feedConsumed += Math.min(need, need - deficit * need)

    const natural = 0.5 + Math.random() * 0.6
    const deficitMort = deficit * 5.5
    next.survival = clamp(next.survival - natural - deficitMort, 0, 100)

    const targetW = sp.wCurve[next.week + 1]
    const gain = (targetW - next.weight) * (1 - deficit * 0.7)
    next.weight = Math.max(next.weight, next.weight + Math.max(0, gain))
    next.birds = Math.round(next.startBirds * next.survival / 100)
    const liveMassGain = Math.max(1, (next.birds * next.weight) - (next.startBirds * sp.wStart))
    next.fcr = clamp(next.feedConsumed / liveMassGain, 1.1, 3)
    next.xp += 80 + Math.round(next.survival)
    next.week++

    const dtype: LogType = deficit > 0.1 ? 'bad' : (next.survival >= sp.survTarget ? 'good' : 'warn')
    const sub = deficit > 0.1
      ? `Feed short — ${next.survival.toFixed(1)}% survival`
      : `+${Math.round(gain * 1000)}g avg \u00B7 ${fmtInt(need)}kg feed used`
    next.log = [{ wk: next.week, type: dtype, title: `Week ${next.week} grown`, sub }, ...next.log]

    if (next.week < next.weeks) { next.pending = genWeekEvent(next) }
    else { next.pending = null }

    updateState(next)
    if (next.week >= next.weeks) {
      setTimeout(() => finishRun(), 650)
    }
  }

  const resolveChoice = (i: number) => {
    const ev = { ...S.pending }
    if (!ev || ev.type !== 'event' || ev.resolved || !ev.def) return
    const def = ev.def
    const choice = def.choices[i]
    const result = choice.apply({ ...S })
    const next = { ...S }
    if (result.dSurv) next.survival = clamp(next.survival + result.dSurv, 0, 100)
    if (result.dWeight) next.weight = Math.max(sp.wStart, next.weight + result.dWeight)
    if (result.dFeed) next.feed = Math.max(0, next.feed + (result.dFeed || 0))
    next.birds = Math.round(next.startBirds * next.survival / 100)
    ev.picked = i; ev.resolved = true; ev.verdict = result.verdict; ev.grade = result.grade
    next.xp += result.grade === 'good' ? 120 : result.grade === 'ok' ? 60 : 20
    next.log = [{ wk: next.week + 1, type: result.grade === 'good' ? 'good' : result.grade === 'ok' ? 'warn' : 'bad', title: `${def.title} \u2014 ${choice.label}`, sub: result.verdict.replace(/<[^>]+>/g, '') }, ...next.log]
    next.pending = ev
    updateState(next)
  }

  const finishRun = () => {
    const next = { ...S, finished: true }
    updateState(next)
    setShowResult(true)
  }

  const buyFeed = () => {
    if (S.finished) return
    if (S.cash < 130000) { showToast('Not enough cash for feed', true); return }
    const next = { ...S }
    next.cash -= 130000; next.feed += 2500
    next.log = [{ wk: next.week, type: 'info', title: 'Bought feed', sub: '+2,500kg to store \u2212\u20A6130k' }, ...next.log]
    updateState(next)
    showToast('Feed topped up \u00B7 +2,500kg')
  }

  const medicate = () => {
    if (S.finished) return
    if (S.cash < 80000) { showToast('Not enough cash to medicate', true); return }
    if (S.survival >= 99.5) { showToast('Flock already at peak health', false); return }
    const next = { ...S }
    next.cash -= 80000; next.survival = clamp(next.survival + 2, 0, 100)
    next.birds = Math.round(next.startBirds * next.survival / 100); next.xp += 40
    next.log = [{ wk: next.week, type: 'info', title: 'Preventive medication', sub: 'Survival +2% \u2212\u20A680k' }, ...next.log]
    updateState(next)
    showToast('Flock medicated \u00B7 survival +2%')
  }

  const sellBatch = () => {
    if (S.finished) return
    const n = Math.min(500, Math.floor(S.birds * 0.15))
    if (n < 50) { showToast('Too few birds left to sell', true); return }
    const rev = Math.round(n * S.weight * sp.price)
    const next = { ...S }
    next.birds -= n; next.startBirds -= n; next.sold += n; next.soldRevenue += rev; next.cash += rev; next.xp += 30
    next.log = [{ wk: next.week, type: 'good', title: `Sold ${fmtInt(n)} ${sp.unit}`, sub: `Banked ${fmtMoney(rev)} at market` }, ...next.log]
    updateState(next)
    showToast(`Sold ${fmtInt(n)} \u00B7 +${fmtMoney(rev)}`)
  }

  const profit = projectedProfit()

  return (
    <View style={{ flex: 1, backgroundColor: '#F6F9F4' }}>
      <StatusBar style="dark" />

      {/* Top bar */}
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: HP, backgroundColor: '#F6F9F4' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 10 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ width: 38, height: 38, borderRadius: 13, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5ECE0', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }}>
            <GoonaIcon icon={Icons.chevronLeft} size={19} color="#15291A" />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontWeight: '700', fontSize: 16, fontFamily: 'Poppins' }}>Live Simulation</Text>
            <Text style={{ fontSize: 10, color: '#5C6B5E', fontWeight: '600', letterSpacing: 0.3 }}>GOONA Academy</Text>
          </View>
          <TouchableOpacity onPress={() => { setShowSpecies(true) }} style={{ width: 38, height: 38, borderRadius: 13, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5ECE0', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }}>
            <GoonaIcon icon={Icons.refreshCw} size={19} color="#15291A" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: HP, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Flock Hero */}
        <View style={heroStyles.card}>
          <View style={heroStyles.glow1} pointerEvents="none" />
          <View style={heroStyles.top}>
            <View style={heroStyles.spIc}>
              <Text style={{ fontSize: 24 }}>{sp.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={heroStyles.name}>{sp.run}</Text>
              <Text style={heroStyles.week}>Week {S.week} of {sp.weeks} \u00B7 {sp.short}</Text>
            </View>
            <View style={heroStyles.healthTag}>
              <HealthDot color={health.dot} />
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#fff' }}>{health.label}</Text>
            </View>
          </View>

          {/* Bird grid */}
          <View style={{ height: 120, alignItems: 'center', justifyContent: 'center', marginVertical: 10 }}>
            <View style={[heroStyles.aura, { backgroundColor: health.dot + '55' }]} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 4, maxWidth: 280 }}>
              {Array.from({ length: 24 }).map((_, i) => {
                const aliveCount = Math.round(24 * S.survival / 100)
                return <BirdIcon key={i} emoji={sp.emoji} alive={i < aliveCount} />
              })}
            </View>
          </View>

          {/* Progress */}
          <View style={heroStyles.progressWrap}>
            <GaugeRing pct={progress} size={48} stroke={5} text={`${Math.round(progress * 100)}%`} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700', fontSize: 14, color: '#fff' }}>Cycle progress</Text>
              <Text style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.78)', fontWeight: '600', marginTop: 2 }}>
                {S.week >= sp.weeks ? 'Cycle finished \u2014 ready to harvest' : `Day ${S.week * 7 + 1} \u00B7 target ${sp.wTarget}kg by week ${sp.weeks}`}
              </Text>
            </View>
          </View>
          <View style={heroStyles.pbar}><RNAnimated.View style={[heroStyles.pbarFill, { width: `${progress * 100}%` }]} /></View>
        </View>

        {/* Vitals */}
        <View style={sectStyles.label}><Text style={sectStyles.title}>Live Vitals</Text></View>
        <View style={vitalsStyles.grid}>
          {[
            { v: 'birds', label: 'Birds', val: fmtInt(S.birds), icon: Icons.users, cls: S.survival >= sp.survTarget ? 'ok' : S.survival >= 80 ? 'warn' : 'bad', foot: `${fmtInt(S.startBirds - S.birds)} lost` },
            { v: 'survival', label: 'Survival', val: `${S.survival.toFixed(1)}%`, icon: Icons.shieldCheck, cls: S.survival >= sp.survTarget ? 'ok' : S.survival >= 80 ? 'warn' : 'bad', foot: S.survival >= sp.survTarget ? 'on target' : 'below target' },
            { v: 'weight', label: 'Avg Wt', val: `${S.weight.toFixed(2)}kg`, icon: Icons.scale, cls: 'ok', foot: `+${Math.round((S.weight - sp.wStart) * 1000)}g total` },
            { v: 'feed', label: 'Feed', val: fmtInt(S.feed) + 'kg', icon: Icons.package, cls: S.feed < feedNeed ? 'bad' : S.feed < feedNeed * 2 ? 'warn' : 'ok', foot: S.feed < feedNeed ? 'low \u2014 refill' : 'in store' },
            { v: 'cash', label: 'Cash', val: fmtMoney(S.cash), icon: Icons.wallet, cls: S.cash < 80000 ? 'bad' : S.cash < 200000 ? 'warn' : 'ok', foot: 'buffer' },
            { v: 'fcr', label: 'FCR', val: S.fcr === 0 ? '\u2014' : S.fcr.toFixed(2), icon: Icons.barChart3, cls: S.fcr === 0 ? 'ok' : S.fcr < 1.7 ? 'ok' : S.fcr < 2 ? 'warn' : 'bad', foot: S.fcr === 0 ? 'building' : 'feed ratio' },
          ].map((m) => (
            <View key={m.v} style={[vitalsStyles.cell, { borderLeftWidth: 3, borderLeftColor: m.cls === 'ok' ? '#43A047' : m.cls === 'warn' ? '#E08A12' : '#E23B2E' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <GoonaIcon icon={m.icon} size={12} color="#8A988C" />
                <Text style={vitalsStyles.clabel}>{m.label}</Text>
              </View>
              <Text style={vitalsStyles.cval}>{m.val}</Text>
              <Text style={vitalsStyles.cfoot}>{m.foot}</Text>
            </View>
          ))}
        </View>

        {/* This Week */}
        <View style={sectStyles.label}><Text style={sectStyles.title}>This Week</Text></View>
        {S.pending && S.pending.type === 'calm' ? (
          <View style={weekStyles.card}>
            <View style={weekStyles.head}>
              <View style={[weekStyles.ic, { backgroundColor: '#E6F4E9' }]}>
                <GoonaIcon icon={Icons.check} size={22} color="#2E7D32" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[weekStyles.kicker, { color: '#43A047' }]}>All Calm</Text>
                <Text style={weekStyles.title}>A quiet week</Text>
              </View>
            </View>
            <Text style={weekStyles.desc}>No incidents this week \u2014 the flock is doing its thing.</Text>
            <View style={weekStyles.tip}>
              <GoonaIcon icon={Icons.lightbulb} size={18} color="#2E7D32" />
              <Text style={{ fontSize: 12, color: '#2A3D2E', flex: 1, lineHeight: 17 }}>
                <Text style={{ fontWeight: '700', color: '#2E7D32' }}>GOONA IQ tip: </Text>
                {S.pending.tip}
              </Text>
            </View>
          </View>
        ) : S.pending && S.pending.type === 'event' && S.pending.def ? (
          <View style={[weekStyles.card, { borderColor: '#F2D9B0' }]}>
            <View style={weekStyles.head}>
              <View style={[weekStyles.ic, { backgroundColor: S.pending.def.tone === 'red' ? '#FCEAE7' : S.pending.def.tone === 'amber' ? '#FBF1DE' : '#E6F4E9' }]}>
                <Text style={{ fontSize: 22 }}>{S.pending.def.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[weekStyles.kicker, { color: S.pending.def.tone === 'red' ? '#E23B2E' : '#E08A12' }]}>{S.pending.def.kicker}</Text>
                <Text style={weekStyles.title}>{S.pending.def.title}</Text>
              </View>
            </View>
            <Text style={weekStyles.desc}>{S.pending.def.desc}</Text>
            <View style={{ gap: 9, marginTop: 14 }}>
              {S.pending.def.choices.map((c, i) => (
                <TouchableOpacity key={i} activeOpacity={0.85}
                  onPress={() => resolveChoice(i)}
                  disabled={S.pending?.resolved}
                  style={[weekStyles.choice, S.pending?.picked === i && weekStyles.choicePicked]}
                >
                  <View style={[weekStyles.chIc, S.pending?.picked === i && { backgroundColor: '#43A047', borderColor: '#43A047' }]}>
                    <GoonaIcon icon={S.pending?.picked === i ? Icons.check : Icons.arrowRight} size={16} color={S.pending?.picked === i ? '#fff' : '#2E7D32'} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13.5, fontWeight: '700', color: '#15291A' }}>{c.label}</Text>
                    <Text style={{ fontSize: 11, color: '#5C6B5E', fontWeight: '500' }}>{c.tip}</Text>
                  </View>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#5C6B5E' }}>{c.cost}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {S.pending.verdict && (
              <View style={weekStyles.verdict}>
                <View style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' }}>
                  <GoonaIcon icon={Icons.sparkles} size={15} color="#D4FF4D" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.6)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 3 }}>GOONA IQ \u00B7 Verdict</Text>
                  <Text style={{ fontSize: 12, color: '#fff', lineHeight: 17 }}>{S.pending.verdict.replace(/<[^>]+>/g, '')}</Text>
                </View>
              </View>
            )}
          </View>
        ) : null}

        {/* Action Dock */}
        <View style={{ flexDirection: 'row', gap: 9, marginTop: 14 }}>
          <ActionBtn icon={Icons.package} label="Buy Feed" sub={S.finished ? '' : `+2.5t \u00B7 ${fmtMoney(130000)}`} color="#E08A12" bg="#FBF1DE" onPress={buyFeed} />
          <ActionBtn icon={Icons.pill} label="Medicate" sub={S.finished ? '' : `+2% \u00B7 ${fmtMoney(80000)}`} color="#2C82C9" bg="#E7F0FA" onPress={medicate} />
          <ActionBtn icon={Icons.dollarSign} label="Sell Batch" sub={S.finished ? '' : `${Math.min(500, Math.floor(S.birds * 0.15))} ${sp.unit}`} color="#2E7D32" bg="#E6F4E9" onPress={sellBatch} />
        </View>

        {/* Advance */}
        <TouchableOpacity activeOpacity={0.85} onPress={advanceWeek}
          style={[advStyles.btn, S.pending && !S.pending.resolved && advStyles.btnLocked]}
        >
          {!S.pending?.resolved && S.pending?.type !== 'calm' && <View style={advStyles.glint} pointerEvents="none" />}
          <GoonaIcon icon={Icons.arrowRight} size={20} color={S.pending && !S.pending.resolved ? '#8A988C' : '#fff'} />
          <Text style={[advStyles.btnText, { color: S.pending && !S.pending.resolved ? '#8A988C' : '#fff' }]}>
            {S.pending && !S.pending.resolved ? 'Make a decision first' : S.week >= S.weeks ? 'Finish & Harvest' : `Advance to Week ${S.week + 1}`}
          </Text>
        </TouchableOpacity>

        {/* Run Log */}
        <View style={[sectStyles.label, { marginTop: 24 }]}>
          <Text style={sectStyles.title}>Run Log</Text>
          <Text style={{ fontSize: 10, fontWeight: '800', color: '#2E7D32', backgroundColor: '#E6F4E9', paddingVertical: 2, paddingHorizontal: 8, borderRadius: 8 }}>
            {S.log.length} {S.log.length === 1 ? 'entry' : 'entries'}
          </Text>
        </View>
        <View style={logStyles.container}>
          {S.log.slice(0, 40).map((entry, i) => (
            <View key={i} style={logStyles.row}>
              <View style={[logStyles.dot, {
                backgroundColor: entry.type === 'good' ? '#43A047' : entry.type === 'warn' ? '#E08A12' : entry.type === 'bad' ? '#E23B2E' : '#2C82C9'
              }]} />
              <View style={logStyles.line} />
              <View style={{ flex: 1 }}>
                <Text style={logStyles.wk}>WEEK {entry.wk}</Text>
                <Text style={logStyles.ltitle}> {entry.title}</Text>
                <Text style={logStyles.lsub}>{entry.sub}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Score Footer */}
        <View style={scoreStyles.card}>
          <View style={scoreStyles.xpRing}>
            <GaugeRing pct={xpInLvl} size={50} stroke={4.5} color="#AEEA00" text={`Lv${lvl}`} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={scoreStyles.xpVal}>{fmtInt(S.xp)} XP</Text>
            <Text style={scoreStyles.xpLab}>Run score</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[scoreStyles.profitVal, { color: profit >= 0 ? '#D4FF4D' : '#FF8A7A' }]}>
              {profit >= 0 ? '' : '-'}{fmtMoney(Math.abs(profit))}
            </Text>
            <Text style={scoreStyles.profitLab}>Projected profit</Text>
          </View>
        </View>
      </ScrollView>

      {/* Toast */}
      {toastMsg !== '' && (
        <View style={[toastStyles.box, toastBad && toastStyles.boxBad]}>
          <GoonaIcon icon={toastBad ? Icons.alertCircle : Icons.check} size={16} color={toastBad ? '#FF8A7A' : '#D4FF4D'} />
          <Text style={toastStyles.text}>{toastMsg}</Text>
        </View>
      )}

      {/* Species Overlay */}
      <Modal visible={showSpecies} transparent animationType="slide" onRequestClose={() => setShowSpecies(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(12,28,16,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#F6F9F4', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 8, paddingHorizontal: 18, paddingBottom: 34, maxHeight: '85%' }}>
            <View style={{ width: 38, height: 5, borderRadius: 5, backgroundColor: '#E5ECE0', alignSelf: 'center', marginVertical: 6, marginBottom: 14 }} />
            <Text style={{ fontSize: 23, fontWeight: '700', fontFamily: 'Poppins' }}>Start a new run</Text>
            <Text style={{ fontSize: 13, color: '#5C6B5E', marginTop: 2, marginBottom: 16, lineHeight: 18 }}>
              Pick a species and run a full cycle week by week. Your progress saves on-device.
            </Text>
            {(Object.keys(SPECIES) as SpeciesKey[]).map((k) => {
              const d = SPECIES[k]
              const sel = selectedSp === k
              return (
                <TouchableOpacity key={k} activeOpacity={0.85}
                  onPress={() => setSelectedSp(k)}
                  style={[spStyles.row, sel && spStyles.rowSel]}
                >
                  <View style={[spStyles.av, { backgroundColor: d.color }]}>
                    <Text style={{ fontSize: 24 }}>{d.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '700', fontSize: 16 }}>{d.label}</Text>
                    <Text style={{ fontSize: 11.5, color: '#5C6B5E', fontWeight: '500' }}>{d.desc}</Text>
                  </View>
                  <Text style={spStyles.badge}>{d.weeks} wks</Text>
                </TouchableOpacity>
              )
            })}
            <TouchableOpacity activeOpacity={0.85} onPress={() => startFresh(selectedSp)}
              style={spStyles.startBtn}>
              <Text style={{ fontFamily: 'Poppins', fontSize: 16, fontWeight: '700', color: '#fff' }}>Start Simulation</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Result Overlay */}
      <Modal visible={showResult} transparent animationType="slide" onRequestClose={() => setShowResult(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(12,28,16,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#F6F9F4', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 8, paddingHorizontal: 18, paddingBottom: 34, maxHeight: '85%' }}>
            <View style={{ width: 38, height: 5, borderRadius: 5, backgroundColor: '#E5ECE0', alignSelf: 'center', marginVertical: 6, marginBottom: 14 }} />

            <View style={[resStyles.hero, { backgroundColor: profit >= 0 ? '#1E7A3D' : '#5C6B5E' }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 10 }}>
                {[0, 1, 2].map((i) => {
                  const on = i < (S.survival >= sp.survTarget ? 1 : 0) + (profit > 0 ? 1 : 0) + (S.survival >= sp.survTarget + 2 && profit > sp.baseline * 0.12 ? 1 : 0)
                  return (
                    <View key={i} style={{ width: 30, height: 30 }}>
                      <Text style={{ fontSize: 24 }}>{on ? '\u2B50' : '\u2606'}</Text>
                    </View>
                  )
                })}
              </View>
              <Text style={resStyles.heroTitle}>
                {profit >= 0 ? 'Cycle Successful!' : 'Tough cycle'}
              </Text>
              <Text style={resStyles.heroMsg}>
                {profit >= 0
                  ? `Strong run. You brought ${S.survival.toFixed(1)}% of the flock to market in profit.`
                  : `The numbers didn't come together this time. Review the log and run it again.`}
              </Text>
              {(S.survival >= sp.survTarget + 2 && profit > sp.baseline * 0.12) && (
                <View style={resStyles.cert}>
                  <GoonaIcon icon={Icons.star} size={15} color="#D4FF4D" />
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#fff' }}>GOONA Certified</Text>
                </View>
              )}
            </View>

            <View style={resStyles.statsGrid}>
              {[
                { l: 'Final survival', v: `${S.survival.toFixed(1)}%`, c: S.survival >= sp.survTarget ? '#2E7D32' : '#E23B2E' },
                { l: 'Avg weight', v: `${S.weight.toFixed(2)}kg`, c: '#15291A' },
                { l: profit >= 0 ? 'Net profit' : 'Net loss', v: `${profit >= 0 ? '' : '-'}${fmtMoney(Math.abs(profit))}`, c: profit >= 0 ? '#2E7D32' : '#E23B2E' },
                { l: 'Run score', v: `${fmtInt(S.xp)} XP`, c: '#15291A' },
              ].map((r, i) => (
                <View key={i} style={resStyles.rstat}>
                  <Text style={resStyles.rstatL}>{r.l}</Text>
                  <Text style={[resStyles.rstatV, { color: r.c }]}>{r.v}</Text>
                </View>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <TouchableOpacity activeOpacity={0.85} onPress={() => {
                const txt = `GOONA Academy \u00B7 ${sp.run} \u2014 ${S.survival.toFixed(1)}% survival, ${fmtMoney(profit)} profit, ${fmtInt(S.xp)} XP.`
                Share.share({ message: txt })
              }} style={[resStyles.actBtn, { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5ECE0' }]}>
                <GoonaIcon icon={Icons.share2} size={17} color="#15291A" />
                <Text style={{ fontFamily: 'Poppins', fontSize: 14.5, fontWeight: '700', color: '#15291A' }}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.85} onPress={() => { setShowResult(false); setShowSpecies(true) }}
                style={[resStyles.actBtn, { backgroundColor: '#2E7D32' }]}>
                <GoonaIcon icon={Icons.plus} size={17} color="#fff" />
                <Text style={{ fontFamily: 'Poppins', fontSize: 14.5, fontWeight: '700', color: '#fff' }}>New Run</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

/* ─── Action Dock Button ─── */
function ActionBtn({ icon, label, sub, color, bg, onPress }: {
  icon: any; label: string; sub: string; color: string; bg: string; onPress: () => void
}) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress}
      style={{ flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5ECE0', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 6, alignItems: 'center', gap: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }}>
      <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
        <GoonaIcon icon={icon} size={19} color={color} />
      </View>
      <Text style={{ fontSize: 12, fontWeight: '700', color: '#15291A' }}>{label}</Text>
      <Text style={{ fontSize: 9.5, color: '#5C6B5E', fontWeight: '600' }}>{sub}</Text>
    </TouchableOpacity>
  )
}

/* ─── Styles ─── */
const heroStyles = StyleSheet.create({
  card: { borderRadius: 28, padding: 18, paddingBottom: 20, overflow: 'hidden', backgroundColor: '#1E7A3D', shadowColor: '#145A2E', shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.34, shadowRadius: 34, elevation: 8 },
  glow1: { position: 'absolute', right: -70, top: -90, width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(174,234,0,0.15)' },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  spIc: { width: 42, height: 42, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 18, fontWeight: '700', color: '#fff' },
  week: { fontSize: 11.5, color: 'rgba(255,255,255,0.8)', fontWeight: '600', marginTop: 2 },
  healthTag: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 11, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.16)' },
  aura: { position: 'absolute', width: 200, height: 200, borderRadius: 100, opacity: 0.5 },
  progressWrap: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', borderRadius: 16, padding: 11, paddingHorizontal: 13, marginTop: 8 },
  pbar: { height: 6, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.2)', marginTop: 7, overflow: 'hidden' },
  pbarFill: { height: '100%', borderRadius: 4, backgroundColor: '#AEEA00' },
})

const sectStyles = StyleSheet.create({
  label: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18, marginBottom: 9 },
  title: { fontSize: 12, fontWeight: '700', letterSpacing: 0.7, textTransform: 'uppercase', color: '#5C6B5E' },
})

const vitalsStyles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  cell: { width: (SW - HP * 2 - 18) / 3, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5ECE0', borderRadius: 16, padding: 11, paddingBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  clabel: { fontSize: 9.5, fontWeight: '700', color: '#5C6B5E', letterSpacing: 0.2, textTransform: 'uppercase', flex: 1 },
  cval: { fontSize: 17, fontWeight: '700', marginTop: 5, letterSpacing: -0.5 },
  cfoot: { fontSize: 9.5, fontWeight: '700', marginTop: 3 },
})

const weekStyles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5ECE0', borderRadius: 22, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  ic: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  kicker: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
  title: { fontSize: 17, fontWeight: '700', marginTop: 2 },
  desc: { fontSize: 13, lineHeight: 19, color: '#2A3D2E', marginTop: 11, marginHorizontal: 1 },
  choice: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 12, paddingHorizontal: 13, backgroundColor: '#F6F9F4', borderWidth: 1.5, borderColor: '#E5ECE0', borderRadius: 15 },
  choicePicked: { borderColor: '#43A047', backgroundColor: '#E6F4E9' },
  chIc: { width: 30, height: 30, borderRadius: 9, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5ECE0', alignItems: 'center', justifyContent: 'center' },
  tip: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: '#E6F4E9', borderWidth: 1, borderColor: '#CFE6D4', borderRadius: 15, padding: 12, paddingHorizontal: 13, marginTop: 13 },
  verdict: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginTop: 13, borderRadius: 15, padding: 12,
    paddingHorizontal: 13, backgroundColor: '#0E5E34', overflow: 'hidden',
  },
})

const advStyles = StyleSheet.create({
  btn: {
    marginTop: 11, borderRadius: 18, padding: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9,
    backgroundColor: '#2E7D32', shadowColor: '#1E7A3D', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.36, shadowRadius: 24, elevation: 6, overflow: 'hidden',
    position: 'relative',
  },
  btnLocked: { backgroundColor: '#E5ECE0', shadowOpacity: 0, elevation: 0 },
  btnText: { fontSize: 16, fontWeight: '700' },
  glint: { position: 'absolute', top: 0, bottom: 0, width: '50%', left: '-60%', backgroundColor: 'rgba(255,255,255,0.28)' },
})

const logStyles = StyleSheet.create({
  container: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5ECE0', borderRadius: 18, padding: 4, paddingHorizontal: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  row: { flexDirection: 'row', gap: 11, padding: 11, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#EEF3EA', position: 'relative' },
  dot: { width: 9, height: 9, borderRadius: 4.5, marginTop: 4, zIndex: 2 },
  line: { position: 'absolute', left: 16, top: 14, bottom: -1, width: 1, backgroundColor: '#E5ECE0' },
  wk: { fontSize: 9.5, fontWeight: '700', color: '#8A988C', letterSpacing: 0.4 },
  ltitle: { fontSize: 12.5, fontWeight: '700' },
  lsub: { fontSize: 11.5, color: '#5C6B5E', marginTop: 1 },
})

const scoreStyles = StyleSheet.create({
  card: { marginTop: 13, borderRadius: 20, padding: 15, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#15291A', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 18, elevation: 4 },
  xpRing: { width: 50, height: 50 },
  xpVal: { fontSize: 19, fontWeight: '700', color: '#fff' },
  xpLab: { fontSize: 10.5, color: 'rgba(255,255,255,0.6)', fontWeight: '600', letterSpacing: 0.3, textTransform: 'uppercase' },
  profitVal: { fontSize: 18, fontWeight: '700' },
  profitLab: { fontSize: 9.5, color: 'rgba(255,255,255,0.6)', fontWeight: '600', letterSpacing: 0.3, textTransform: 'uppercase' },
})

const toastStyles = StyleSheet.create({
  box: {
    position: 'absolute', left: 24, right: 24, bottom: 30, zIndex: 95,
    backgroundColor: '#15291A', borderRadius: 14, padding: 11, paddingHorizontal: 17,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 30, elevation: 8,
  },
  boxBad: { backgroundColor: '#2A1215' },
  text: { fontSize: 12.5, fontWeight: '600', color: '#fff', flex: 1 },
})

const spStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 13, padding: 14, borderRadius: 18, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E5ECE0', marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  rowSel: { borderColor: '#43A047', backgroundColor: '#E6F4E9' },
  av: { width: 50, height: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  badge: { fontSize: 9, fontWeight: '800', color: '#2E7D32', backgroundColor: '#E6F4E9', borderWidth: 1, borderColor: '#CFE6D4', padding: 3, paddingHorizontal: 7, borderRadius: 8 },
  startBtn: { marginTop: 16, borderRadius: 17, padding: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2E7D32', shadowColor: '#1E7A3D', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.34, shadowRadius: 24, elevation: 6 },
})

const resStyles = StyleSheet.create({
  hero: { borderRadius: 22, padding: 20, alignItems: 'center', overflow: 'hidden', marginBottom: 4 },
  heroTitle: { fontSize: 25, fontWeight: '700', color: '#fff', marginTop: 0 },
  heroMsg: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 6, textAlign: 'center', lineHeight: 18 },
  cert: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, backgroundColor: 'rgba(255,255,255,0.16)', padding: 7, paddingHorizontal: 13, borderRadius: 20 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 14 },
  rstat: { width: (SW - HP * 2 - 36 - 9) / 2, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5ECE0', borderRadius: 15, padding: 13, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  rstatL: { fontSize: 10, fontWeight: '700', color: '#5C6B5E', letterSpacing: 0.2, textTransform: 'uppercase' },
  rstatV: { fontSize: 21, fontWeight: '700', marginTop: 3 },
  actBtn: { flex: 1, borderRadius: 16, padding: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
})
