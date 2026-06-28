import React, { useEffect, useState, useRef, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Dimensions, Modal,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useFocusEffect } from '@react-navigation/native'
import GoonaIcon from '../components/ui/GoonaIcon'
import { Icons } from '../shared/icons'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence,
  withTiming, FadeInUp,
} from 'react-native-reanimated'

const { width: SW } = Dimensions.get('window')
const HP = 16
const STORAGE_KEY = 'goona_academy_tycoon_v1'
const CAP_MIN = 480
const TICK_MS = 250

/* ─── TYPES ─── */

interface Unit {
  id: string; name: string; icon: string; bg: string; col: string
  baseRate: number; level: number; baseCost: number; costMult: number
  unlocked: boolean; unlockCost?: number; unlockedByExp?: string
  kind: 'poultry' | 'infra' | 'fish'; capBoost?: number
}

interface Expansion {
  id: string; name: string; desc: string; cost: number; mult: string
  icon: string; bg: string; col: string; bought: boolean
  flat?: number; gmult?: number; solar?: boolean
}

interface Worker {
  id: string; name: string; role: string; cost: number; hired: boolean
  boostKind?: 'poultry'; boost?: number; clears?: string
  gboost?: number; gmult?: number; autoCollect?: boolean
  icon: string; bg: string; col: string
}

interface Milestone {
  id: string; label: string; type: 'cash' | 'birds' | 'units'; target: number
  reward: number; rewardLab: string; claimed: boolean; tier?: string; permMult?: number
}

interface Penalty {
  mult: number; until: number
}

interface EventDef {
  id: string; good: boolean; kicker: string; title: string
  icon: string; col: string; bg: string; desc: string
  a: { lab: string; fn: () => { msg: string; cost?: number; penalty?: Penalty } }
  b: { lab: string; fn: () => { msg: string; cost?: number; penalty?: Penalty } }
}

interface GameState {
  farmName: string; cash: number; pile: number; birds: number
  units: Unit[]; expansions: Expansion[]; workers: Worker[]
  milestones: Milestone[]; tier: string; prestigeMult: number
  lastSeen: number; firstOpen: boolean; penalties: Penalty[]
}

/* ─── DEFAULTS ─── */

const TIERS = [
  { name: 'Smallholder', min: 0 },
  { name: 'Commercial', min: 100000 },
  { name: 'Agribusiness', min: 5000000 },
  { name: 'Tycoon', min: 50000000 },
]

function defaultUnits(): Unit[] {
  return [
    { id: 'pen1', name: 'Layer Pen', icon: '\u{1F413}', bg: '#E6F4E9', col: '#2E7D32', baseRate: 120, level: 1, baseCost: 1400, costMult: 1.55, unlocked: true, kind: 'poultry' },
    { id: 'hatch', name: 'Hatchery', icon: '\u{1F95A}', bg: '#FBF1DE', col: '#E08A12', baseRate: 90, level: 1, baseCost: 1100, costMult: 1.55, unlocked: true, kind: 'poultry' },
    { id: 'pen2', name: 'Broiler Pen', icon: '\u{1F414}', bg: '#E6F4E9', col: '#2E7D32', baseRate: 210, level: 0, baseCost: 4200, costMult: 1.6, unlocked: false, unlockCost: 6500, kind: 'poultry' },
    { id: 'mill', name: 'Feed Mill', icon: '\u{1F33E}', bg: '#FFF4E0', col: '#D99412', baseRate: 320, level: 0, baseCost: 9000, costMult: 1.6, unlocked: false, unlockCost: 22000, kind: 'infra' },
    { id: 'store', name: 'Egg Store', icon: '\u{1F9EA}', bg: '#E7F0FA', col: '#2C82C9', baseRate: 260, level: 0, baseCost: 14000, costMult: 1.6, unlocked: false, unlockCost: 48000, kind: 'infra', capBoost: 240 },
    { id: 'pond', name: 'Catfish Pond', icon: '\u{1F41F}', bg: '#E2F0F2', col: '#1E6E8C', baseRate: 540, level: 0, baseCost: 30000, costMult: 1.62, unlocked: false, unlockedByExp: 'expPond', kind: 'fish' },
  ]
}

function defaultExpansions(): Expansion[] {
  return [
    { id: 'house3', name: 'Add Poultry House', desc: '+3 pen glyphs \u00B7 big flat output', cost: 38000, mult: '+700/min', icon: '\u{1F3E0}', bg: '#E6F4E9', col: '#2E7D32', bought: false, flat: 700 },
    { id: 'expPond', name: 'Build Catfish Pond', desc: 'Unlocks the Catfish Pond unit', cost: 24000, mult: 'unlock', icon: '\u{1F41F}', bg: '#E2F0F2', col: '#1E6E8C', bought: false },
    { id: 'autofeed', name: 'Automatic Feeders', desc: 'All production', cost: 90000, mult: '\u00D71.8', icon: '\u2699\uFE0F', bg: '#FFF4E0', col: '#D99412', bought: false, gmult: 1.8 },
    { id: 'solar', name: 'Solar Power', desc: 'Cuts running cost', cost: 160000, mult: '+15% net', icon: '\u2600\uFE0F', bg: '#FBF1DE', col: '#E08A12', bought: false, solar: true },
  ]
}

function defaultWorkers(): Worker[] {
  return [
    { id: 'feedhand', name: 'Feed Hand', role: '+25% poultry, stops feed warnings', cost: 26000, hired: false, boostKind: 'poultry', boost: 1.25, clears: 'feed', icon: '\u{1F468}\u200D\u{1F33E}', bg: '#E6F4E9', col: '#2E7D32' },
    { id: 'vet', name: 'Farm Vet', role: 'Prevents disease losses', cost: 72000, hired: false, clears: 'disease', gboost: 1.1, icon: '\u{1FA7A}', bg: '#FCEAE7', col: '#E23B2E' },
    { id: 'manager', name: 'Farm Manager', role: 'Auto-collects +10% all output', cost: 220000, hired: false, autoCollect: true, gmult: 1.1, icon: '\u{1F454}', bg: '#E7F0FA', col: '#2C82C9' },
  ]
}

function defaultMilestones(): Milestone[] {
  return [
    { id: 'm1', label: 'Reach \u20A6100,000', type: 'cash', target: 100000, reward: 25000, rewardLab: '\u20A625k bonus', claimed: false, tier: 'Commercial' },
    { id: 'm2', label: 'Own 5 farm units', type: 'units', target: 5, reward: 40000, rewardLab: '\u20A640k bonus', claimed: false },
    { id: 'm3', label: 'Raise 250,000 birds', type: 'birds', target: 250000, reward: 60000, rewardLab: '\u20A660k bonus', claimed: false },
    { id: 'm4', label: 'Reach \u20A65,000,000', type: 'cash', target: 5000000, reward: 400000, rewardLab: '\u20A6400k bonus', claimed: false, tier: 'Agribusiness' },
    { id: 'm5', label: 'Reach \u20A650,000,000', type: 'cash', target: 50000000, reward: 0, rewardLab: 'Tycoon tier', claimed: false, tier: 'Tycoon' },
  ]
}

function seedState(): GameState {
  return {
    farmName: 'Greenvale Farm', cash: 15000, pile: 0, birds: 0,
    units: defaultUnits(), expansions: defaultExpansions(), workers: defaultWorkers(),
    milestones: defaultMilestones(), tier: 'Smallholder', prestigeMult: 1,
    lastSeen: Date.now() - (3 * 3600 + 12 * 60) * 1000,
    firstOpen: true, penalties: [],
  }
}

/* ─── EVENTS ─── */

const EVENTS: EventDef[] = [
  {
    id: 'festive', good: true, kicker: 'Festive Demand', title: 'Holiday demand spike',
    icon: '\u{1F389}', col: '#2E7D32', bg: '#E6F4E9',
    desc: 'Prices are surging for the festive season. Sell a batch high or keep building?',
    a: { lab: 'Sell high', fn: () => ({ msg: 'Sold at peak!' }) },
    b: { lab: 'Keep building', fn: () => ({ msg: 'Flock kept', penalty: { mult: 1.15, until: Date.now() + 45000 } }) },
  },
  {
    id: 'disease', good: false, kicker: 'Disease Scare', title: 'Disease in the region',
    icon: '\u{2620}\uFE0F', col: '#E23B2E', bg: '#FCEAE7',
    desc: 'An outbreak is spreading nearby. Pay for biosecurity, or risk a temporary output hit?',
    a: { lab: 'Pay up', fn: () => ({ msg: 'Protected', cost: 3000 }) },
    b: { lab: 'Risk it', fn: () => ({ msg: 'Output -18% for a while', penalty: { mult: 0.82, until: Date.now() + 50000 } }) },
  },
  {
    id: 'feedjump', good: false, kicker: 'Feed Price Jump', title: 'Feed prices spike',
    icon: '\u{1F33E}', col: '#E08A12', bg: '#FBF1DE',
    desc: 'Feed costs jumped this week. Stock up now to lock the rate, or ride it out?',
    a: { lab: 'Stock up', fn: () => ({ msg: 'Locked feed rate', cost: 2500 }) },
    b: { lab: 'Ride it out', fn: () => ({ msg: 'Output -10%', penalty: { mult: 0.9, until: Date.now() + 40000 } }) },
  },
]

/* ─── HELPERS ─── */

function fmt(n: number): string {
  const neg = n < 0; const a = Math.abs(n)
  let s: string
  if (a >= 1e9) s = (a / 1e9).toFixed(2) + 'B'
  else if (a >= 1e6) s = (a / 1e6).toFixed(a >= 1e7 ? 1 : 2) + 'M'
  else if (a >= 1e5) s = Math.round(a / 1e3) + 'k'
  else if (a >= 1e3) s = (a / 1e3).toFixed(1) + 'k'
  else s = '' + Math.round(a)
  return (neg ? '-' : '') + s
}

function money(n: number): string {
  return '\u20A6' + fmt(n)
}

function getUnitCost(u: Unit): number {
  return Math.round(u.baseCost * Math.pow(u.costMult, u.level - 1))
}

function grossRate(S: GameState): number {
  let r = 0
  S.units.forEach((u) => { if (u.unlocked) r += u.baseRate * u.level })
  S.expansions.forEach((e) => { if (e.bought && e.flat) r += e.flat })
  return r
}

function globalMult(S: GameState): number {
  let m = S.prestigeMult
  S.expansions.forEach((e) => { if (e.bought && e.gmult) m *= e.gmult })
  S.workers.forEach((w) => { if (w.hired && w.gmult) m *= w.gmult; if (w.hired && w.gboost) m *= w.gboost })
  S.milestones.forEach((ms) => { if (ms.claimed && ms.permMult) m *= ms.permMult })
  const solar = S.expansions.some((e) => e.id === 'solar' && e.bought)
  if (!solar) m *= 0.92
  const now = Date.now()
  S.penalties = S.penalties.filter((p) => p.until > now)
  S.penalties.forEach((p) => { m *= p.mult })
  return m
}

function poultryBoost(S: GameState): number {
  let b = 1
  S.workers.forEach((w) => { if (w.hired && w.boostKind === 'poultry') b *= w.boost! })
  return b
}

function netRate(S: GameState): number {
  let r = 0
  S.units.forEach((u) => {
    if (u.unlocked) {
      let ur = u.baseRate * u.level
      if (u.kind === 'poultry') ur *= poultryBoost(S)
      r += ur
    }
  })
  S.expansions.forEach((e) => { if (e.bought && e.flat) r += e.flat })
  return r * globalMult(S)
}

function capMinutes(S: GameState): number {
  let m = CAP_MIN
  S.units.forEach((u) => { if (u.unlocked && u.capBoost) m += u.capBoost * Math.max(1, u.level) })
  return m
}

function capacity(S: GameState): number {
  return netRate(S) * capMinutes(S)
}

function currentTier(S: GameState): { name: string; min: number } {
  let t = TIERS[0]
  for (let i = 0; i < TIERS.length; i++) { if (S.cash >= TIERS[i].min) t = TIERS[i] }
  return t
}

function nextTier(S: GameState): { name: string; min: number } | null {
  const c = currentTier(S)
  const idx = TIERS.indexOf(c)
  return idx + 1 < TIERS.length ? TIERS[idx + 1] : null
}

function msProgress(S: GameState, ms: Milestone): number {
  if (ms.type === 'cash') return Math.max(S.cash, S.cash)
  if (ms.type === 'birds') return S.birds
  if (ms.type === 'units') {
    let c = 0
    S.units.forEach((u) => { if (u.unlocked) c++ })
    if (S.expansions.some((e) => e.id === 'house3' && e.bought)) c += 1
    return c
  }
  return 0
}

function unitCount(S: GameState): number {
  let c = 0
  S.units.forEach((u) => { if (u.unlocked) c++ })
  return c
}

/* ─── SUB-COMPONENTS ─── */

function PulseDot({ color = '#D4FF4D', size = 7 }: { color?: string; size?: number }) {
  const opacity = useSharedValue(1)
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(0.3, { duration: 1800 }), withTiming(1, { duration: 1800 })),
      -1, true,
    )
  }, [])
  const aStyle = useAnimatedStyle(() => ({ opacity: opacity.value, shadowOpacity: opacity.value * 0.6 }))
  return (
    <Animated.View
      style={[
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
        aStyle,
        { shadowColor: color, shadowOffset: { width: 0, height: 0 }, shadowRadius: 8, elevation: 2 },
      ]}
    />
  )
}

function OfflineBadge() {
  return (
    <View style={obStyles.badge}>
      <GoonaIcon icon={Icons.cloudOff} size={11} color="#1E7A3D" />
      <Text style={obStyles.text}>Offline-ready</Text>
    </View>
  )
}
const obStyles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E6F4E9', borderWidth: 1, borderColor: '#CFE6D4', paddingVertical: 5, paddingHorizontal: 8, borderRadius: 20 },
  text: { fontSize: 9.5, fontWeight: '800', color: '#1E7A3D', letterSpacing: 0.2 },
})

function SectionLabel({ title, tag }: { title: string; tag?: string }) {
  return (
    <View style={slStyles.row}>
      <Text style={slStyles.title}>{title.toUpperCase()}</Text>
      <View style={slStyles.line} />
      {tag && <Text style={slStyles.tag}>{tag}</Text>}
    </View>
  )
}
const slStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20, marginBottom: 11 },
  title: { fontSize: 12, fontWeight: '700', color: '#5C6B5E', letterSpacing: 0.7 },
  line: { flex: 1, height: 1, backgroundColor: '#E5ECE0' },
  tag: { fontSize: 10, fontWeight: '800', color: '#1E7A3D', backgroundColor: '#E6F4E9', paddingVertical: 2, paddingHorizontal: 8, borderRadius: 8, overflow: 'hidden' },
})

function Toast({ msg, visible }: { msg: string; visible: boolean }) {
  if (!visible) return null
  return (
    <View style={toastStyles.wrap}>
      <GoonaIcon icon={Icons.check} size={16} color="#AEEA00" />
      <Text style={toastStyles.text}>{msg}</Text>
    </View>
  )
}
const toastStyles = StyleSheet.create({
  wrap: {
    position: 'absolute', bottom: 30, left: 32, right: 32, zIndex: 120,
    backgroundColor: '#15291A', borderRadius: 14, paddingVertical: 11, paddingHorizontal: 17,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 24, elevation: 10,
  },
  text: { fontSize: 12.5, fontWeight: '600', color: '#fff', flex: 1 },
})

/* ─── MAIN SCREEN ─── */

export default function FarmTycoonScreen() {
  const insets = useSafeAreaInsets()
  const [S, setS] = useState<GameState>(seedState())
  const [loaded, setLoaded] = useState(false)
  const [dispCash, setDispCash] = useState(15000)
  const [showAway, setShowAway] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [toastVisible, setToastVisible] = useState(false)
  const [activeEvent, setActiveEvent] = useState<EventDef | null>(null)
  const [eventResolved, setEventResolved] = useState(false)
  const [awayData, setAwayData] = useState({ cash: 0, rate: 0, birds: 0, hours: 0, mins: 0, capped: false })
  const [pendingCost, setPendingCost] = useState(0)
  const [warnings, setWarnings] = useState<{ cls: string; msg: string; fix: string }[]>([])
  const stateRef = useRef(S)
  const dispRef = useRef(dispCash)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const eventTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scrollRef = useRef<ScrollView>(null)

  useEffect(() => { stateRef.current = S }, [S])
  useEffect(() => { dispRef.current = dispCash }, [dispCash])

  const showToast = useCallback((m: string) => {
    setToastMsg(m); setToastVisible(true)
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToastVisible(false), 1900)
  }, [])

  const persist = useCallback(async () => {
    try {
      const snap = stateRef.current
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...snap,
        penalties: snap.penalties.filter((p) => p.until > Date.now()),
        lastSeen: Date.now(),
      }))
    } catch { /* ignore */ }
  }, [])

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY)
      if (raw) {
        const data: GameState = JSON.parse(raw)
        if (!data.penalties) data.penalties = []
        setS(data)
        setDispCash(data.cash)
      }
    } catch { /* ignore */ }
    setLoaded(true)
  }, [])

  // Milestone check
  const checkMilestones = useCallback((state: GameState): GameState => {
    const next = { ...state }
    let changed = false
    next.milestones = state.milestones.map((ms) => {
      if (ms.claimed) return ms
      const prog = msProgress(state, ms)
      if (prog >= ms.target) {
        changed = true
        return { ...ms, claimed: true }
      }
      return ms
    })
    if (changed) {
      let bonus = 0
      next.milestones.forEach((ms) => {
        const old = state.milestones.find((o) => o.id === ms.id)
        if (!old?.claimed && ms.claimed && ms.reward > 0) {
          bonus += ms.reward
        }
      })
      if (bonus > 0) {
        next.cash += bonus
        showToast('Milestone claimed!')
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 1800)
      }
    }
    return next
  }, [showToast])

  // Offline
  const runOfflineCatchUp = useCallback((state: GameState) => {
    const now = Date.now()
    const elapsedMin = (now - state.lastSeen) / 60000
    if (elapsedMin < 1 && !state.firstOpen) return state

    const rate = netRate(state)
    const earnMin = Math.min(elapsedMin, capMinutes(state))
    const earned = Math.round(rate * earnMin)
    const birds = Math.round(rate * earnMin / 60 * 2)

    if (earned < 1) return { ...state, lastSeen: now, firstOpen: false }

    const h = Math.floor(elapsedMin / 60)
    const m = Math.floor(elapsedMin % 60)
    setAwayData({
      cash: earned, rate, birds,
      hours: h, mins: m,
      capped: elapsedMin > capMinutes(state),
    })
    setShowAway(true)
    return state
  }, [])

  // Warnings
  const computeWarnings = useCallback((state: GameState) => {
    const w: { cls: string; msg: string; fix: string }[] = []
    const hasFeedHand = state.workers.some((x) => x.id === 'feedhand' && x.hired)
    const hasVet = state.workers.some((x) => x.id === 'vet' && x.hired)
    const hasMill = state.units.some((u) => u.id === 'mill' && u.unlocked)
    const pCount = state.units.filter((u) => u.unlocked && u.kind === 'poultry').length

    if (pCount >= 2 && !hasFeedHand && !hasMill) {
      w.push({ cls: 'amber', msg: 'Feeding by hand. Output capped \u2014 hire a Feed Hand or build a Feed Mill.', fix: 'feedhand' })
    }
    if (state.cash >= 40000 && !hasVet) {
      w.push({ cls: 'red', msg: 'No vet on staff. Disease events can cut output. Hire a Farm Vet.', fix: 'vet' })
    }
    setWarnings(w)
  }, [])

  // Load and boot
  useFocusEffect(
    useCallback(() => {
      load()
      return () => {
        if (tickRef.current) clearInterval(tickRef.current)
        if (eventTimerRef.current) clearTimeout(eventTimerRef.current)
        persist()
      }
    }, [load, persist]),
  )

  // After loaded, handle offline and start tick
  useEffect(() => {
    if (!loaded) return
    let state = stateRef.current

    // Offline
    const result = runOfflineCatchUp(state)
    if (result !== state) {
      setS(result)
      state = result
    }
    setDispCash(state.cash)

    // Tick
    tickRef.current = setInterval(() => {
      setS((prev) => {
        const rate = netRate(prev)
        const perSec = rate / 60
        const cap = capacity(prev)
        const pile = Math.min(cap, prev.pile + perSec * (TICK_MS / 1000))
        const birds = prev.birds + rate * (TICK_MS / 1000) / 60 * 2

        // Manager auto-collect
        const mgr = prev.workers.some((w) => w.id === 'manager' && w.hired)
        let cash = prev.cash
        let finalPile = pile
        if (mgr && pile > 0) {
          cash += pile
          finalPile = 0
        }

        const next: GameState = { ...prev, cash, pile: finalPile, birds }

        // Smooth display
        setDispCash((d) => d + (next.cash - d) * 0.25)

        return next
      })
    }, TICK_MS)

    // Events
    const scheduleEvent = () => {
      eventTimerRef.current = setTimeout(() => {
        setActiveEvent(EVENTS[Math.floor(Math.random() * EVENTS.length)])
        setEventResolved(false)
        scheduleEvent()
      }, (38 + Math.random() * 40) * 1000)
    }
    scheduleEvent()

    return () => {
      if (tickRef.current) clearInterval(tickRef.current)
      if (eventTimerRef.current) clearTimeout(eventTimerRef.current)
      persist()
    }
  }, [loaded, runOfflineCatchUp, persist])

  // Periodic renders
  useEffect(() => {
    if (!loaded) return
    const h = setInterval(() => {
      const state = stateRef.current
      computeWarnings(state)
      // Tier check
      const ct = currentTier(state)
      if (ct.name !== state.tier) {
        setS((prev) => ({ ...prev, tier: ct.name }))
      }
    }, 5000)
    return () => clearInterval(h)
  }, [loaded, computeWarnings])

  // Collect
  const handleCollect = useCallback(() => {
    setS((prev) => {
      if (prev.pile < 1) { showToast('Nothing to collect yet'); return prev }
      const cash = prev.cash + prev.pile
      const pile = 0
      setDispCash(cash)
      return { ...prev, cash, pile }
    })
  }, [showToast])

  // Away collect
  const handleAwayCollect = useCallback(() => {
    setS((prev) => {
      const cash = prev.cash + awayData.cash
      const birds = prev.birds + awayData.birds
      setDispCash(cash)
      return { ...prev, cash, birds, lastSeen: Date.now(), firstOpen: false }
    })
    setShowAway(false)
  }, [awayData])

  // Buy/Upgrade
  const handleUpgradeUnit = useCallback((id: string) => {
    setS((prev) => {
      const idx = prev.units.findIndex((u) => u.id === id)
      if (idx === -1 || !prev.units[idx].unlocked) return prev
      const u = prev.units[idx]
      const cost = getUnitCost(u)
      if (prev.cash < cost) { showToast('Not enough cash'); return prev }
      const next = [...prev.units]
      next[idx] = { ...u, level: u.level + 1 }
      const cash = prev.cash - cost
      setDispCash(cash)
      showToast(`Upgraded ${u.name}`)
      return { ...prev, units: next, cash }
    })
  }, [showToast])

  const handleUnlockUnit = useCallback((id: string) => {
    setS((prev) => {
      const idx = prev.units.findIndex((u) => u.id === id)
      if (idx === -1 || prev.units[idx].unlocked) return prev
      const u = prev.units[idx]
      const cost = u.unlockCost || 0
      if (prev.cash < cost) { showToast('Not enough cash'); return prev }
      const next = [...prev.units]
      next[idx] = { ...u, unlocked: true, level: 1 }
      const cash = prev.cash - cost
      setDispCash(cash)
      showToast(`${u.name} unlocked!`)
      return { ...prev, units: next, cash }
    })
  }, [showToast])

  const handleBuyExpansion = useCallback((id: string) => {
    setS((prev) => {
      const idx = prev.expansions.findIndex((e) => e.id === id)
      if (idx === -1 || prev.expansions[idx].bought) return prev
      const e = prev.expansions[idx]
      if (prev.cash < e.cost) { showToast('Not enough cash'); return prev }
      const next = [...prev.expansions]
      next[idx] = { ...e, bought: true }
      const cash = prev.cash - e.cost
      setDispCash(cash)
      showToast(`${e.name} \u2014 done!`)
      return { ...prev, expansions: next, cash }
    })
  }, [showToast])

  const handleHireWorker = useCallback((id: string) => {
    setS((prev) => {
      const idx = prev.workers.findIndex((w) => w.id === id)
      if (idx === -1 || prev.workers[idx].hired) return prev
      const w = prev.workers[idx]
      if (prev.cash < w.cost) { showToast('Not enough cash'); return prev }
      const next = [...prev.workers]
      next[idx] = { ...w, hired: true }
      const cash = prev.cash - w.cost
      setDispCash(cash)
      showToast(`${w.name} hired!`)
      return { ...prev, workers: next, cash }
    })
  }, [showToast])

  const handleClaimMilestone = useCallback(() => {
    setS((prev) => checkMilestones(prev))
  }, [checkMilestones])

  // Event choice
  const handleEventChoice = useCallback((choice: 'a' | 'b') => {
    if (!activeEvent || eventResolved) return
    setEventResolved(true)
    const result = activeEvent[choice].fn()
    setS((prev) => {
      let cash = prev.cash
      if (result.cost && cash >= result.cost) cash -= result.cost
      const penalties = [...prev.penalties]
      if (result.penalty) penalties.push(result.penalty)
      return { ...prev, cash, penalties }
    })
    showToast(result.msg)
    setTimeout(() => setActiveEvent(null), 500)
  }, [activeEvent, eventResolved, showToast])

  // Prestige
  const handlePrestige = useCallback(() => {
    setS((prev) => {
      if (prev.cash < 50000000) return prev
      const newMult = prev.prestigeMult + 0.5
      const name = prev.farmName
      const fresh = seedState()
      fresh.farmName = name
      fresh.prestigeMult = newMult
      fresh.lastSeen = Date.now()
      fresh.firstOpen = false
      setDispCash(fresh.cash)
      showToast(`Prestige! All earnings now \u00D7${newMult.toFixed(1)} forever`)
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 1800)
      return fresh
    })
  }, [showToast])

  // Reset
  const handleReset = useCallback(() => {
    const fresh = seedState()
    fresh.lastSeen = Date.now()
    fresh.firstOpen = false
    setS(fresh)
    setDispCash(fresh.cash)
    showToast('Farm reset to a single pen')
  }, [showToast])

  if (!loaded) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: '#8A988C' }}>Loading...</Text>
      </View>
    )
  }

  const state = stateRef.current
  const ct = currentTier(state)
  const nt = nextTier(state)
  const rate = netRate(state)
  const cap = capacity(state)
  const capM = capMinutes(state)
  const pilePct = cap > 0 ? Math.min(state.pile / cap * 100, 100) : 0
  const uCount = unitCount(state)
  const tierPct = nt ? Math.min((state.cash - ct.min) / (nt.min - ct.min) * 100, 100) : 100
  const glyphCount = Math.min(uCount + (state.expansions.some((e) => e.id === 'house3' && e.bought) ? 3 : 0), 9)

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.scrollWrap}>
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={[styles.scrollInner, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 130 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* ─── TOP NAV ─── */}
          <Animated.View entering={FadeInUp.duration(500).springify()} style={styles.topNav}>
            <TouchableOpacity onPress={() => { persist(); router.back() }} style={styles.navBack} activeOpacity={0.7}>
              <GoonaIcon icon={Icons.arrowLeft} size={20} color="#15291A" />
            </TouchableOpacity>
            <View style={styles.navTitle}>
              <Text style={styles.navTitleBold}>Farm Tycoon</Text>
              <Text style={styles.navTitleSub}>GOONA Academy</Text>
            </View>
            <OfflineBadge />
            <TouchableOpacity onPress={handleReset} style={styles.navReset} activeOpacity={0.7}>
              <GoonaIcon icon={Icons.refreshCw} size={17} color="#15291A" />
            </TouchableOpacity>
          </Animated.View>

          {/* ─── HERO ─── */}
          <Animated.View entering={FadeInUp.duration(500).delay(50).springify()} style={styles.hero}>
            <View style={styles.heroGlow} pointerEvents="none" />
            <View style={styles.heroTop}>
              <View>
                <Text style={styles.heroFarmName}>{state.farmName}</Text>
                <View style={styles.tierPill}>
                  <GoonaIcon icon={Icons.star} size={13} color="#D4FF4D" />
                  <Text style={styles.tierPillText}>{ct.name}</Text>
                </View>
              </View>
            </View>
            <Text style={styles.heroCash}>
              <Text style={styles.heroCashNse}>{'\u20A6'}</Text>
              <Text>{fmt(dispCash)}</Text>
            </Text>
            <View style={styles.heroRate}>
              <PulseDot color="#D4FF4D" size={7} />
              <Text style={styles.heroRateText}>
                Earning <Text style={styles.heroRateVal}>{money(rate)}</Text> / min
              </Text>
            </View>

            {/* Glyphs */}
            <View style={styles.farmRow}>
              {Array.from({ length: glyphCount }).map((_, i) => (
                <View key={i} style={[styles.glyph, { animationDelay: `${i * 0.05}s` }]}>
                  <Text style={styles.glyphText}>{'\u{1F3E0}'}</Text>
                </View>
              ))}
              {uCount + (state.expansions.some((e) => e.id === 'house3' && e.bought) ? 3 : 0) > 9 && (
                <Text style={styles.glyphMore}>+{(uCount + (state.expansions.some((e) => e.id === 'house3' && e.bought) ? 3 : 0)) - 9}</Text>
              )}
            </View>

            {/* Tier progress */}
            <View style={styles.tierProg}>
              <View style={styles.tierBar}>
                <View style={[styles.tierBarFill, { width: `${tierPct}%` }]} />
              </View>
              <View style={styles.tierTx}>
                <Text style={styles.tierTxText}>{ct.name}</Text>
                <Text style={styles.tierTxText}>
                  {nt ? `${nt.name} \u00B7 ${money(nt.min)}` : 'Tycoon reached!'}
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* ─── COLLECT ─── */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleCollect}
            style={[styles.collect, state.pile >= 1 ? styles.collectReady : styles.collectEmpty]}
          >
            <View style={[styles.collectIcon, state.pile < 1 && { backgroundColor: '#EEF3EA' }]}>
              <GoonaIcon icon={Icons.shoppingCart} size={22} color={state.pile >= 1 ? '#15291A' : '#8A988C'} />
            </View>
            <View style={styles.collectTx}>
              <Text style={[styles.collectAmt, state.pile < 1 && { color: '#8A988C' }]}>
                {state.pile >= 1 ? money(state.pile) : '\u20A60'}
              </Text>
              <Text style={styles.collectLab}>
                {state.pile >= 1 ? (pilePct >= 99 ? 'Storage full \u2014 collect!' : 'Tap to bank production') : 'Production banked \u2014 building\u2026'}
              </Text>
            </View>
            <View style={styles.collectCap}>
              <View style={styles.capBar}>
                <View style={[styles.capBarFill, { width: `${pilePct}%` }]} />
              </View>
              <Text style={styles.capLab}>{(capM / 60).toFixed(0)}h store</Text>
            </View>
          </TouchableOpacity>

          {/* ─── EVENT ─── */}
          {activeEvent && !eventResolved && (
            <Animated.View entering={FadeInUp.duration(300).springify()} style={[styles.eventCard, activeEvent.good && styles.eventCardGood]}>
              <View style={styles.eventIn}>
                <View style={styles.evTop}>
                  <View style={[styles.evIc, { backgroundColor: activeEvent.bg }]}>
                    <Text style={{ fontSize: 20 }}>{activeEvent.icon}</Text>
                  </View>
                  <View style={styles.evMeta}>
                    <Text style={[styles.evKicker, { color: activeEvent.good ? '#1E7A3D' : '#E08A12' }]}>{activeEvent.kicker}</Text>
                    <Text style={styles.evTitle}>{activeEvent.title}</Text>
                  </View>
                </View>
                <Text style={styles.evDesc}>{activeEvent.desc}</Text>
                <View style={styles.evActs}>
                  <TouchableOpacity style={styles.evBtnPrimary} activeOpacity={0.85} onPress={() => handleEventChoice('a')}>
                    <Text style={styles.evBtnText}>{activeEvent.a.lab}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.evBtnGhost} activeOpacity={0.85} onPress={() => handleEventChoice('b')}>
                    <Text style={styles.evBtnGhostText}>{activeEvent.b.lab}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          )}

          {/* ─── WARNINGS ─── */}
          {warnings.map((w, i) => (
            <View key={i} style={[styles.warn, w.cls === 'red' ? styles.warnRed : styles.warnAmber]}>
              <GoonaIcon icon={w.cls === 'red' ? Icons.alertTriangle : Icons.alertCircle} size={17} color={w.cls === 'red' ? '#9A3422' : '#8A5A12'} />
              <Text style={[styles.warnText, { flex: 1 }]}>{w.msg}</Text>
              <TouchableOpacity
                style={styles.warnFix}
                activeOpacity={0.7}
                onPress={() => showToast('Hire from Workers below')}
              >
                <Text style={styles.warnFixText}>Hire</Text>
              </TouchableOpacity>
            </View>
          ))}

          {/* ─── YOUR FARM ─── */}
          <SectionLabel title="Your Farm" tag={`${uCount} unit${uCount !== 1 ? 's' : ''}`} />
          {state.units.map((u, i) => {
            const cost = getUnitCost(u)
            const canAfford = state.cash >= cost
            const locked = !u.unlocked
            const checkExp = u.unlockedByExp ? state.expansions.some((e) => e.id === u.unlockedByExp && e.bought) : true
            const rate = u.baseRate * Math.max(1, u.level) * (u.kind === 'poultry' ? poultryBoost(state) : 1)
            return (
              <Animated.View key={u.id} entering={FadeInUp.duration(500).delay(150 + i * 60).springify()}>
                <View style={[cardStyles.unitCard, locked && cardStyles.unitCardLocked]}>
                  <View style={[cardStyles.uIc, { backgroundColor: locked ? `${u.bg}99` : u.bg }]}>
                    <Text style={{ fontSize: 22 }}>{u.icon}</Text>
                    {u.unlocked && (
                      <View style={cardStyles.uLv}>
                        <Text style={cardStyles.uLvText}>{u.level}</Text>
                      </View>
                    )}
                  </View>
                  <View style={cardStyles.uMeta}>
                    <Text style={cardStyles.uName}>{u.name}</Text>
                    <Text style={cardStyles.uRate}>
                      {u.unlocked
                        ? `${money(rate)}/min \u00B7 Lv ${u.level}`
                        : !checkExp
                          ? 'Requires Catfish Pond'
                          : `Locked \u00B7 ${money(u.baseRate)}/min`
                      }
                    </Text>
                  </View>
                  {u.unlocked ? (
                    <TouchableOpacity
                      style={[cardStyles.uUp, canAfford && cardStyles.uUpAfford, !canAfford && cardStyles.uUpPoor]}
                      activeOpacity={0.85}
                      disabled={!canAfford}
                      onPress={() => handleUpgradeUnit(u.id)}
                    >
                      <Text style={cardStyles.uUpLabel}>UPGRADE</Text>
                      <Text style={[cardStyles.uUpCost, !canAfford && { color: '#8A988C' }]}>{money(cost)}</Text>
                    </TouchableOpacity>
                  ) : (
                    !checkExp ? (
                      <View style={cardStyles.lockBadge}>
                        <GoonaIcon icon={Icons.lock} size={11} color="#8A988C" />
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[cardStyles.uUp, cardStyles.uUpUnlock, state.cash >= (u.unlockCost || 0) && cardStyles.uUpAfford, state.cash < (u.unlockCost || 0) && cardStyles.uUpPoor]}
                        activeOpacity={0.85}
                        disabled={state.cash < (u.unlockCost || 0)}
                        onPress={() => handleUnlockUnit(u.id)}
                      >
                        <Text style={cardStyles.uUpLabel}>UNLOCK</Text>
                        <Text style={cardStyles.uUpCost}>{money(u.unlockCost || 0)}</Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>
              </Animated.View>
            )
          })}

          {/* ─── INVEST & EXPAND ─── */}
          <SectionLabel title="Invest &amp; Expand" />
          {state.expansions.map((e, i) => {
            const canBuy = state.cash >= e.cost && !e.bought
            return (
              <Animated.View key={e.id} entering={FadeInUp.duration(500).delay(200 + i * 60).springify()}>
                <View style={cardStyles.buyCard}>
                  <View style={[cardStyles.bIc, { backgroundColor: e.bg }]}>
                    <Text style={{ fontSize: 20 }}>{e.icon}</Text>
                  </View>
                  <View style={cardStyles.bMeta}>
                    <Text style={cardStyles.bName}>{e.name}</Text>
                    <Text style={cardStyles.bDesc}>{e.desc} \u00B7 <Text style={cardStyles.bMult}>{e.mult}</Text></Text>
                  </View>
                  {e.bought ? (
                    <View style={cardStyles.bBtnOwned}>
                      <GoonaIcon icon={Icons.check} size={14} color="#1E7A3D" />
                      <Text style={cardStyles.bBtnOwnedText}>Owned</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[cardStyles.bBtn, canBuy && cardStyles.bBtnAfford, !canBuy && cardStyles.bBtnPoor]}
                      activeOpacity={0.85}
                      disabled={!canBuy}
                      onPress={() => handleBuyExpansion(e.id)}
                    >
                      <Text style={[cardStyles.bBtnText, !canBuy && { color: '#8A988C' }]}>{money(e.cost)}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </Animated.View>
            )
          })}

          {/* ─── WORKERS ─── */}
          <SectionLabel title="Workers &amp; Managers" tag="TeamHub" />
          {state.workers.map((w, i) => {
            const canHire = state.cash >= w.cost && !w.hired
            return (
              <Animated.View key={w.id} entering={FadeInUp.duration(500).delay(250 + i * 60).springify()}>
                <View style={cardStyles.buyCard}>
                  <View style={[cardStyles.bIc, { backgroundColor: w.bg }]}>
                    <Text style={{ fontSize: 20 }}>{w.icon}</Text>
                  </View>
                  <View style={cardStyles.bMeta}>
                    <Text style={cardStyles.bName}>{w.name}</Text>
                    <Text style={cardStyles.bDesc}>{w.role}</Text>
                  </View>
                  {w.hired ? (
                    <View style={cardStyles.bBtnOwned}>
                      <GoonaIcon icon={Icons.check} size={14} color="#1E7A3D" />
                      <Text style={cardStyles.bBtnOwnedText}>Hired</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[cardStyles.bBtn, canHire && cardStyles.bBtnAfford, !canHire && cardStyles.bBtnPoor]}
                      activeOpacity={0.85}
                      disabled={!canHire}
                      onPress={() => handleHireWorker(w.id)}
                    >
                      <Text style={[cardStyles.bBtnText, !canHire && { color: '#8A988C' }]}>{money(w.cost)}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </Animated.View>
            )
          })}

          {/* ─── MILESTONES ─── */}
          <SectionLabel title="Milestones" />
          {state.milestones.map((ms, i) => {
            const prog = msProgress(state, ms)
            const pct = Math.min(prog / ms.target * 100, 100)
            const done = prog >= ms.target
            return (
              <Animated.View key={ms.id} entering={FadeInUp.duration(500).delay(300 + i * 60).springify()}>
                <View style={[cardStyles.mileCard, ms.claimed && cardStyles.mileCardDone]}>
                  <View style={[cardStyles.mIc, ms.claimed && { backgroundColor: '#43A047' }]}>
                    <GoonaIcon
                      icon={ms.claimed ? Icons.check : Icons.star}
                      size={19}
                      color={ms.claimed ? '#fff' : '#1E7A3D'}
                    />
                  </View>
                  <View style={cardStyles.mMeta}>
                    <Text style={cardStyles.mLabel}>{ms.label}</Text>
                    <Text style={cardStyles.mProg}>{fmt(Math.min(prog, ms.target))} / {fmt(ms.target)}</Text>
                    <View style={cardStyles.mBar}>
                      <View style={[cardStyles.mBarFill, { width: `${pct}%`, backgroundColor: ms.claimed ? '#2E7D32' : '#AEEA00' }]} />
                    </View>
                  </View>
                  {ms.claimed ? (
                    <Text style={cardStyles.mReward}>✓ {ms.rewardLab}</Text>
                  ) : done ? (
                    <TouchableOpacity style={cardStyles.mClaim} activeOpacity={0.85} onPress={handleClaimMilestone}>
                      <Text style={cardStyles.mClaimText}>Claim</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={[cardStyles.mClaim, cardStyles.mClaimLocked]}>
                      <Text style={cardStyles.mClaimLockedText}>{ms.rewardLab}</Text>
                    </View>
                  )}
                </View>
              </Animated.View>
            )
          })}

          {/* ─── PRESTIGE ─── */}
          <SectionLabel title="Prestige" />
          <Animated.View entering={FadeInUp.duration(500).delay(400).springify()}>
            <View style={[cardStyles.prestige, state.cash < 50000000 && cardStyles.prestigeLocked]}>
              <View style={cardStyles.prestigeGlow} pointerEvents="none" />
              <View style={cardStyles.prTop}>
                <View style={cardStyles.prIc}>
                  <GoonaIcon icon={Icons.award} size={21} color="#D4FF4D" />
                </View>
                <Text style={cardStyles.prTitle}>Become a Tycoon</Text>
              </View>
              <Text style={cardStyles.prDesc}>
                Reach the <Text style={cardStyles.prDescBold}>Tycoon</Text> tier to reset your farm for a permanent <Text style={cardStyles.prDescBold}>\u00D7{(state.prestigeMult + 0.5).toFixed(1)}</Text> earnings multiplier.
              </Text>
              <TouchableOpacity
                style={[cardStyles.prBtn, state.cash >= 50000000 ? cardStyles.prBtnReady : cardStyles.prBtnLocked]}
                activeOpacity={0.85}
                disabled={state.cash < 50000000}
                onPress={handlePrestige}
              >
                <Text style={[cardStyles.prBtnText, state.cash >= 50000000 ? { color: '#15291A' } : { color: 'rgba(255,255,255,0.6)' }]}>
                  {state.cash >= 50000000
                    ? `Prestige now \u2192 \u00D7${(state.prestigeMult + 0.5).toFixed(1)} forever`
                    : `Reach Tycoon (\u20A650M) to unlock`
                  }
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>

      {/* TOAST */}
      <Toast msg={toastMsg} visible={toastVisible} />

      {/* AWAY MODAL */}
      <Modal visible={showAway} transparent animationType="fade">
        <View style={awayStyles.overlay}>
          <Animated.View entering={FadeInUp.duration(400).springify()} style={awayStyles.modal}>
            <View style={awayStyles.awayHero}>
              <View style={awayStyles.moon}>
                <GoonaIcon icon={Icons.moon} size={28} color="#D4FF4D" />
              </View>
              <Text style={awayStyles.awayTitle}>While you were away\u2026</Text>
              <Text style={awayStyles.awayTime}>
                Your farm ran for {awayData.hours > 0 ? `${awayData.hours}h ` : ''}{awayData.mins}m
                {awayData.capped ? ` (capped at ${(capM / 60).toFixed(0)}h)` : ''}
              </Text>
              <Text style={awayStyles.awayAmt}>{money(awayData.cash)}</Text>
              <Text style={awayStyles.awayLab}>Produced offline</Text>
            </View>
            <View style={awayStyles.awayDetail}>
              <View style={awayStyles.ad}>
                <Text style={awayStyles.adVal}>{money(awayData.rate)}</Text>
                <Text style={awayStyles.adLab}>per min</Text>
              </View>
              <View style={awayStyles.ad}>
                <Text style={awayStyles.adVal}>{fmt(awayData.birds)}</Text>
                <Text style={awayStyles.adLab}>birds raised</Text>
              </View>
              <View style={awayStyles.ad}>
                <Text style={awayStyles.adVal}>{(capM / 60).toFixed(0)}h</Text>
                <Text style={awayStyles.adLab}>storage</Text>
              </View>
            </View>
            <TouchableOpacity style={awayStyles.awayBtn} activeOpacity={0.85} onPress={handleAwayCollect}>
              <GoonaIcon icon={Icons.shoppingCart} size={18} color="#15291A" />
              <Text style={awayStyles.awayBtnText}>Collect {money(awayData.cash)}</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {/* CONFETTI */}
      {showConfetti && (
        <View style={confettiStyles.wrap} pointerEvents="none">
          {Array.from({ length: 20 }).map((_, i) => (
            <View
              key={i}
              style={[
                confettiStyles.piece,
                {
                  left: `${Math.random() * 100}%`,
                  backgroundColor: ['#AEEA00', '#43A047', '#D4FF4D', '#2E7D32', '#E0A82E'][i % 5],
                  animationDelay: `${Math.random() * 0.4}s`,
                  transform: [{ rotate: `${Math.random() * 360}deg` }],
                },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  )
}

/* ─── STYLES ─── */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F9F4' },
  scrollWrap: { flex: 1 },
  scroll: { flex: 1 },
  scrollInner: { paddingHorizontal: HP },

  topNav: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  navBack: { width: 38, height: 38, borderRadius: 13, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5ECE0', alignItems: 'center', justifyContent: 'center', shadowColor: '#142819', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  navTitle: { flex: 1, alignItems: 'center' },
  navTitleBold: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
  navTitleSub: { fontSize: 10, color: '#5C6B5E', fontWeight: '600', letterSpacing: 0.3 },
  navReset: { width: 38, height: 38, borderRadius: 13, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5ECE0', alignItems: 'center', justifyContent: 'center' },

  hero: { borderRadius: 28, padding: 18, overflow: 'hidden', marginTop: 4, backgroundColor: '#1E7A3D', shadowColor: '#145A2E', shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.34, shadowRadius: 34, elevation: 8 },
  heroGlow: { position: 'absolute', width: 260, height: 260, borderRadius: 130, right: -90, top: -110, backgroundColor: 'rgba(174,234,0,0.3)' },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start' },
  heroFarmName: { fontSize: 19, fontWeight: '700', color: '#fff', letterSpacing: -0.3 },
  tierPill: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, backgroundColor: 'rgba(255,255,255,0.16)', paddingVertical: 5, paddingHorizontal: 11, borderRadius: 20, alignSelf: 'flex-start' },
  tierPillText: { fontSize: 11, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  heroCash: { fontSize: 42, fontWeight: '700', color: '#fff', letterSpacing: -1.5, marginTop: 16, fontVariantNumeric: ['tabular-nums'] },
  heroCashNse: { fontSize: 24, opacity: 0.8 },
  heroRate: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 7 },
  heroRateText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
  heroRateVal: { color: '#D4FF4D', fontWeight: '700' },

  farmRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginTop: 16, height: 46, overflow: 'hidden' },
  glyph: {},
  glyphText: { fontSize: 32, lineHeight: 42 },
  glyphMore: { alignSelf: 'center', fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '700', marginLeft: 4 },

  tierProg: { marginTop: 14 },
  tierBar: { height: 6, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.18)', overflow: 'hidden' },
  tierBarFill: { height: '100%', borderRadius: 4, backgroundColor: '#AEEA00' },
  tierTx: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  tierTxText: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.78)', letterSpacing: 0.2 },

  collect: { borderRadius: 20, padding: 16, marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 14, overflow: 'hidden' },
  collectEmpty: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5ECE0', shadowColor: '#142819', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  collectReady: { backgroundColor: '#AEEA00', shadowColor: '#7BC400', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 24, elevation: 6 },
  collectIcon: { width: 46, height: 46, borderRadius: 14, backgroundColor: 'rgba(21,41,26,0.14)', alignItems: 'center', justifyContent: 'center' },
  collectTx: { flex: 1 },
  collectAmt: { fontSize: 20, fontWeight: '700', color: '#15291A', fontVariantNumeric: ['tabular-nums'] },
  collectLab: { fontSize: 11, fontWeight: '700', color: 'rgba(21,41,26,0.65)', letterSpacing: 0.2, marginTop: 1 },
  collectCap: { alignItems: 'flex-end' },
  capBar: { width: 54, height: 5, borderRadius: 4, backgroundColor: 'rgba(21,41,26,0.18)', overflow: 'hidden', marginBottom: 4 },
  capBarFill: { height: '100%', backgroundColor: '#15291A', borderRadius: 4 },
  capLab: { fontSize: 9, fontWeight: '700', color: 'rgba(21,41,26,0.6)', fontVariantNumeric: ['tabular-nums'] },

  eventCard: { borderRadius: 20, padding: 3, backgroundColor: 'transparent', borderWidth: 0.5, borderColor: '#C77F12', marginBottom: 2, marginTop: 10 },
  eventCardGood: { borderColor: '#43A047' },
  eventIn: { backgroundColor: '#fff', borderRadius: 17, padding: 15 },
  evTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  evIc: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  evMeta: { flex: 1 },
  evKicker: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase' },
  evTitle: { fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
  evDesc: { fontSize: 12.5, color: '#2A3D2E', lineHeight: 17.5, marginTop: 11, marginHorizontal: 1 },
  evActs: { flexDirection: 'row', gap: 9, marginTop: 13 },
  evBtnPrimary: { flex: 1, backgroundColor: '#1E7A3D', borderRadius: 13, paddingVertical: 12, alignItems: 'center', shadowColor: '#1E7A3D', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.26, shadowRadius: 14, elevation: 4 },
  evBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  evBtnGhost: { flex: 1, backgroundColor: '#F6F9F4', borderWidth: 1, borderColor: '#E5ECE0', borderRadius: 13, paddingVertical: 12, alignItems: 'center' },
  evBtnGhostText: { fontSize: 13, fontWeight: '700', color: '#15291A' },

  warn: { flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 6, marginTop: 2 },
  warnAmber: { backgroundColor: '#FBF1DE', borderWidth: 1, borderColor: '#F2D9B0' },
  warnRed: { backgroundColor: '#FCEAE7', borderWidth: 1, borderColor: '#F4CFC6' },
  warnText: { fontSize: 12, fontWeight: '600', color: '#5C6B5E', flexShrink: 1 },
  warnFix: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 9, backgroundColor: '#fff', borderWidth: 1, borderColor: 'currentColor' },
  warnFixText: { fontSize: 11, fontWeight: '700', color: '#5C6B5E' },
} as any)

const cardStyles = StyleSheet.create({
  unitCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5ECE0', borderRadius: 18, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10, shadowColor: '#142819', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  unitCardLocked: { opacity: 0.96 },
  uIc: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  uLv: { position: 'absolute', bottom: -4, right: -4, backgroundColor: '#1E7A3D', minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  uLvText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  uMeta: { flex: 1 },
  uName: { fontSize: 14.5, fontWeight: '700', letterSpacing: -0.2 },
  uRate: { fontSize: 11.5, color: '#5C6B5E', fontWeight: '600', marginTop: 1, fontVariantNumeric: ['tabular-nums'] },
  uUp: { borderRadius: 13, paddingVertical: 10, paddingHorizontal: 14, alignItems: 'center', minWidth: 84 },
  uUpAfford: { backgroundColor: '#1E7A3D', shadowColor: '#1E7A3D', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.28, shadowRadius: 14, elevation: 3 },
  uUpPoor: { backgroundColor: '#EEF3EA' },
  uUpUnlock: { backgroundColor: '#C77F12' },
  uUpLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.2, marginBottom: 2, opacity: 0.85, color: '#fff' },
  uUpCost: { fontSize: 12.5, fontWeight: '700', color: '#fff' },

  lockBadge: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },

  buyCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5ECE0', borderRadius: 18, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10, shadowColor: '#142819', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  bIc: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  bMeta: { flex: 1 },
  bName: { fontSize: 14, fontWeight: '700', letterSpacing: -0.2 },
  bDesc: { fontSize: 11.5, color: '#5C6B5E', fontWeight: '600' },
  bMult: { color: '#1E7A3D', fontWeight: '700' },
  bBtn: { borderRadius: 13, paddingVertical: 11, paddingHorizontal: 15, alignItems: 'center', minWidth: 90 },
  bBtnAfford: { backgroundColor: '#1E7A3D', shadowColor: '#1E7A3D', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.28, shadowRadius: 14, elevation: 3 },
  bBtnPoor: { backgroundColor: '#EEF3EA' },
  bBtnText: { fontSize: 12.5, fontWeight: '700', color: '#fff' },
  bBtnOwned: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#E6F4E9', paddingVertical: 11, paddingHorizontal: 15, borderRadius: 13 },
  bBtnOwnedText: { fontSize: 12.5, fontWeight: '700', color: '#1E7A3D' },

  mileCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5ECE0', borderRadius: 16, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10, shadowColor: '#142819', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  mileCardDone: { borderColor: 'rgba(46,125,50,0.2)' },
  mIc: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#E6F4E9', alignItems: 'center', justifyContent: 'center' },
  mMeta: { flex: 1 },
  mLabel: { fontSize: 13.5, fontWeight: '700' },
  mProg: { fontSize: 11, color: '#5C6B5E', fontWeight: '600', marginTop: 1 },
  mBar: { height: 5, borderRadius: 4, backgroundColor: '#EEF3EA', overflow: 'hidden', marginTop: 6 },
  mBarFill: { height: '100%', borderRadius: 4 },
  mReward: { fontSize: 11, fontWeight: '700', color: '#1E7A3D' },
  mClaim: { borderRadius: 11, paddingVertical: 9, paddingHorizontal: 13, backgroundColor: '#AEEA00', shadowColor: '#AEEA00', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 6, elevation: 2 },
  mClaimText: { fontSize: 12, fontWeight: '700', color: '#15291A' },
  mClaimLocked: { backgroundColor: '#EEF3EA', shadowOpacity: 0 },
  mClaimLockedText: { fontSize: 12, fontWeight: '700', color: '#8A988C' },

  prestige: { borderRadius: 20, padding: 16, backgroundColor: '#15291A', overflow: 'hidden', marginBottom: 10, shadowColor: '#142819', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 3 },
  prestigeLocked: { opacity: 0.65 },
  prestigeGlow: { position: 'absolute', width: 160, height: 160, borderRadius: 80, right: -50, top: -60, backgroundColor: 'rgba(174,234,0,0.2)' },
  prTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  prIc: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(174,234,0,0.18)', alignItems: 'center', justifyContent: 'center' },
  prTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  prDesc: { fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 16.8, marginTop: 11 },
  prDescBold: { color: '#D4FF4D', fontWeight: '700' },
  prBtn: { marginTop: 13, borderRadius: 14, paddingVertical: 13, alignItems: 'center', width: '100%' },
  prBtnReady: { backgroundColor: '#AEEA00', shadowColor: '#7BC400', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 18, elevation: 5 },
  prBtnLocked: { backgroundColor: 'rgba(255,255,255,0.12)' },
  prBtnText: { fontSize: 14, fontWeight: '700' },
} as any)

/* ─── AWAY MODAL STYLES ─── */

const awayStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(12,28,16,0.55)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modal: { backgroundColor: '#F6F9F4', borderRadius: 26, paddingBottom: 22, width: '100%', maxWidth: 330, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 30, elevation: 10, overflow: 'hidden' },
  awayHero: { borderRadius: 20, paddingVertical: 22, paddingHorizontal: 18, alignItems: 'center', backgroundColor: '#1E7A3D', overflow: 'hidden', marginHorizontal: 0 },
  moon: { width: 54, height: 54, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  awayTitle: { fontSize: 20, fontWeight: '700', color: '#fff', textAlign: 'center' },
  awayTime: { fontSize: 12, color: 'rgba(255,255,255,0.82)', fontWeight: '600', marginTop: 4, textAlign: 'center' },
  awayAmt: { fontSize: 40, fontWeight: '700', color: '#D4FF4D', letterSpacing: -1.5, marginTop: 12, fontVariantNumeric: ['tabular-nums'] },
  awayLab: { fontSize: 10, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  awayDetail: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 14, paddingHorizontal: 10 },
  ad: { alignItems: 'center' },
  adVal: { fontSize: 16, fontWeight: '700' },
  adLab: { fontSize: 10, color: '#5C6B5E', fontWeight: '700', letterSpacing: 0.2, textTransform: 'uppercase', marginTop: 2 },
  awayBtn: { marginHorizontal: 20, marginTop: 16, borderRadius: 16, paddingVertical: 15, backgroundColor: '#AEEA00', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: '#7BC400', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 18, elevation: 5 },
  awayBtnText: { fontSize: 15, fontWeight: '700', color: '#15291A' },
} as any)

/* ─── CONFETTI STYLES ─── */

const confettiStyles = StyleSheet.create({
  wrap: { position: 'absolute', inset: 0, zIndex: 118, overflow: 'hidden' },
  piece: { position: 'absolute', width: 8, height: 12, borderRadius: 2, top: -20 },
})
