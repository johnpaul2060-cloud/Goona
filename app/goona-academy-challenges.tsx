import React, { useEffect, useState, useRef, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Dimensions, Animated as RNAnimated,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'

import GoonaIcon from '../components/ui/GoonaIcon'
import { Icons } from '../shared/icons'
import { router } from 'expo-router'
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence,
  withTiming, withSpring, FadeInUp, FadeIn,
} from 'react-native-reanimated'

const { width: SW } = Dimensions.get('window')
const HP = 16
const ROUND_TIME = 18000

const C = {
  greenD: '#1E7A3D', green: '#2E7D32', greenL: '#43A047',
  lime: '#AEEA00', limeL: '#D4FF4D',
  ink: '#15291A', ink2: '#2A3D2E',
  mut: '#5C6B5E', mut2: '#8A988C',
  line: '#E5ECE0', line2: '#EEF3EA',
  card: '#FFFFFF', bg: '#F6F9F4',
  red: '#E23B2E', redBg: '#FCEAE7',
  amber: '#E08A12', amberBg: '#FBF1DE',
  blue: '#2C82C9', blueBg: '#E7F0FA',
  greenBg: '#E6F4E9',
}

type QType = 'mc' | 'estimate'

interface Q {
  type: QType; pack: string; q: string
  opts?: string[]; correct?: number; iq: string
  min?: number; max?: number; target?: number; unit?: string; tol?: number
}

interface PackDef { key: string; name: string; bg: string; color: string; locked: boolean; icon: string }

interface SSess {
  queue: Q[]; idx: number; score: number; correct: number
  combo: number; maxCombo: number; source: 'daily' | 'pack'; meta: any; t0: number
}

interface SState {
  streak: number; best: number; xp: number; weekly: number
  completed: string[]; todayDoneKey: string | null; todayScore: number
  packProg: Record<string, number>; youBest: number
}

const PACKS: Record<string, PackDef> = {
  heat: { key: 'heat', name: 'Heat & Climate', bg: '#FBF1DE', color: C.amber, locked: false, icon: '\u2600\uFE0F' },
  disease: { key: 'disease', name: 'Disease & Biosecurity', bg: '#FCEAE7', color: C.red, locked: false, icon: '\u{1F637}' },
  feed: { key: 'feed', name: 'Feed & Nutrition', bg: '#E6F4E9', color: C.green, locked: false, icon: '\u{1F33E}' },
  money: { key: 'money', name: 'Money & Market', bg: '#E7F0FA', color: C.blue, locked: true, icon: '\u{1F4B0}' },
  brooding: { key: 'brooding', name: 'Brooding Basics', bg: '#FFF4E0', color: '#D99412', locked: false, icon: '\u{1F423}' },
}

const BK: Q[] = [
  { type: 'mc', pack: 'heat', q: 'Midday heat. Birds panting with wings held away. Your first move?', opts: ['Add more feed', 'Increase ventilation & airflow', 'Turn on a heat lamp', 'Cut their water'], correct: 1, iq: 'Panting + spread wings = heat stress. Airflow and cooling come first.' },
  { type: 'mc', pack: 'heat', q: 'Hot still night. Catfish gulping at the surface. What is happening?', opts: ['They are hungry', 'Low dissolved oxygen', 'Normal behaviour', 'Water too cold'], correct: 1, iq: 'Gulping at the surface means oxygen is low. Hot still nights crash O2.' },
  { type: 'estimate', pack: 'heat', q: 'Ideal brooding temperature for week-one chicks?', min: 24, max: 40, target: 33, unit: 'C', tol: 3, iq: 'Week-one chicks want about 33C dropping 3C each week.' },
  { type: 'mc', pack: 'heat', q: 'Birds stop eating during a heatwave. What should you add to water?', opts: ['Sugar', 'Electrolytes & vitamins', 'Salt', 'Antibiotics'], correct: 1, iq: 'Electrolytes help replace minerals lost through panting and keep birds drinking.' },
  { type: 'mc', pack: 'disease', q: 'New birds arriving from another farm. Best practice?', opts: ['Mix them right away', 'Quarantine 2 weeks', 'Vaccinate after a month', 'Just wash your hands'], correct: 1, iq: 'New stock can carry disease silently. Quarantine 1-2 weeks first.' },
  { type: 'mc', pack: 'disease', q: 'Sudden egg drop, greenish droppings, some deaths. Likely?', opts: ['Normal molt', 'Too much water', 'Newcastle disease', 'Overfeeding'], correct: 2, iq: 'That cluster points to Newcastle. Isolate and call a vet.' },
  { type: 'estimate', pack: 'disease', q: 'Above what weekly mortality percent is a red-flag emergency?', min: 0, max: 15, target: 5, unit: '%', tol: 2, iq: 'Above ~5% mortality in broilers is a danger threshold.' },
  { type: 'mc', pack: 'disease', q: 'Worker shows up with manure on boots from a neighbours farm. Best action?', opts: ['Wipe it off with a rag', 'Provide boot bath & foot dip station', 'Ignore it', 'Send worker home'], correct: 1, iq: 'Boots tracked between farms spread pathogens. A foot dip station stops cross-contamination.' },
  { type: 'mc', pack: 'disease', q: 'A dead bird found with blood-stained vent area. What is likely?', opts: ['Coccidiosis', 'Heat stress', 'Vitamin deficiency', 'Old age'], correct: 0, iq: 'Bloody droppings and vent staining are classic coccidiosis signs. Check litter moisture and treat fast.' },
  { type: 'mc', pack: 'feed', q: 'Your broilers hit week 5 heading to market. Which feed?', opts: ['Starter crumbs', 'Grower mash', 'Finisher feed', 'Layer mash'], correct: 2, iq: 'Week 5 broilers need Finisher feed for maximum weight gain.' },
  { type: 'mc', pack: 'feed', q: 'Improve FCR. Most reliable lever?', opts: ['Feed much less', 'Consistent feeding + clean water', 'More antibiotics', 'Bigger feeders'], correct: 1, iq: 'FCR improves with consistency: steady feeding, clean water, low stress.' },
  { type: 'estimate', pack: 'feed', q: 'Daily feed for 500 broilers in week 4 (~150g each)?', min: 0, max: 150, target: 75, unit: 'kg', tol: 12, iq: '~150g x 500 birds is about 75kg per day.' },
  { type: 'mc', pack: 'feed', q: 'Birds leaving feed pellets untouched. What to check first?', opts: ['Switch feed brand', 'Check feeder height & adjust', 'Feed less often', 'Add cooking oil'], correct: 1, iq: 'Feeder height matters — birds prefer feed at chest level. Too high or low reduces intake.' },
  { type: 'mc', pack: 'feed', q: 'Which nutrient is most critical for eggshell strength?', opts: ['Protein', 'Calcium', 'Vitamin A', 'Carbohydrates'], correct: 1, iq: 'Calcium is the backbone of eggshell quality. Oyster shell supplement helps layers.' },
  { type: 'mc', pack: 'money', q: 'Feed price jumps 30%. Smartest short-term move?', opts: ['Sell flock today', 'Lock bulk feed order now', 'Stop feeding', 'Switch to scraps'], correct: 1, iq: 'Locking a bulk order at today rate protects your margin.' },
  { type: 'mc', pack: 'money', q: 'Birds at target weight, market price soft. Best call?', opts: ['Hold for months', 'Sell at target', 'Stop feeding but keep them', 'Double flock size'], correct: 1, iq: 'Past target weight extra feed eats your profit.' },
  { type: 'mc', pack: 'money', q: 'Bulk order discount requires 25% upfront. Cash is tight. Best move?', opts: ['Skip the deal', 'Use a short-term supplier credit', 'Borrow from friends', 'Sell birds early'], correct: 1, iq: 'Supplier credit bridges cash gaps without disrupting operations.' },
  { type: 'mc', pack: 'money', q: 'Profit margin per bird drops below 5%. First cost to review?', opts: ['Labour cost', 'Feed conversion ratio', 'Electricity bill', 'Transport'], correct: 1, iq: 'Feed is 60-70% of production cost. Improving FCR has the fastest impact on margin.' },
  { type: 'mc', pack: 'brooding', q: 'Day-old chicks huddled under the heat lamp. What does this mean?', opts: ['Too hot', 'Too cold', 'Just right', 'Just sleeping'], correct: 1, iq: 'Huddling under the lamp = too cold. Nudge temperature up.' },
  { type: 'mc', pack: 'brooding', q: 'Chicks moved to far edges away from heat. This means?', opts: ['Too cold', 'Too hot', 'Sick birds', 'Out of feed'], correct: 1, iq: 'Scattering to edges = too hot. Lower the lamp.' },
  { type: 'mc', pack: 'brooding', q: 'Chicks panting in the first week with litter caking under drinkers. Issue?', opts: ['Normal humidity', 'Ventilation too low', 'Light too bright', 'Feed too coarse'], correct: 1, iq: 'Poor ventilation traps moisture causing litter cake and respiratory stress.' },
  { type: 'mc', pack: 'brooding', q: 'Best drinker height for week-old chicks?', opts: ['At floor level', 'At back height of chicks', 'Head height of adult birds', 'Above head level'], correct: 1, iq: 'Drinkers at chick back height ensures easy access without spillage.' },
]

const STORAGE_KEY = 'goona_academy_challenges_v1'
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function todayKey() {
  const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}
function dateLabel() {
  return new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}
function seedState(): SState {
  const done: string[] = []; const d = new Date()
  for (let i = 1; i <= 4; i++) { const x = new Date(d); x.setDate(d.getDate() - i); done.push(`${x.getFullYear()}-${x.getMonth() + 1}-${x.getDate()}`) }
  return { streak: 4, best: 11, xp: 1240, weekly: 2210, completed: done, todayDoneKey: null, todayScore: 0, packProg: { heat: 3, disease: 4, feed: 5, money: 0, brooding: 4 }, youBest: 0 }
}
function hashStr(s: string) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }; return h >>> 0 }
function mulberry32(a: number) {
  return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}
function seededShuffle<T>(arr: T[], rng: () => number): T[] { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t }; return a }
function dailyQueue(): Q[] { const rng = mulberry32(hashStr('goona-daily-' + todayKey())); const pool = seededShuffle(BK, rng); return pool.slice(0, 5) }
function dailyMeta() { const rng = mulberry32(hashStr('meta-' + todayKey())); const titles = ['Heat Wave Triage', 'Biosecurity Drill', 'Feed Math Sprint', 'Brooder Check-Up', 'Market Day Calls', 'Flock Health Round']; const diff = 1 + Math.floor(rng() * 3); return { title: titles[Math.floor(rng() * titles.length)], diff, reward: 40 + diff * 20 } }
function clamp(v: number, a: number, b: number) { return Math.max(a, Math.min(b, v)) }

const LB_DATA = [
  { nm: 'Sunrise Poultry', pts: 2940, av: 'SP' },
  { nm: 'GreenNest Farms', pts: 2610, av: 'GN' },
  { nm: 'Kibo Layers', pts: 2480, av: 'KL' },
]

/* STREAK HERO */

function StreakHero({ state }: { state: SState }) {
  const today = todayKey()
  const atRisk = state.todayDoneKey !== today
  const days: { label: string; done: boolean; isToday: boolean }[] = []
  const d = new Date()
  for (let i = 6; i >= 0; i--) {
    const day = new Date(d); day.setDate(d.getDate() - i)
    const key = `${day.getFullYear()}-${day.getMonth() + 1}-${day.getDate()}`
    const isToday = i === 0
    const done = state.completed.indexOf(key) > -1 || (isToday && state.todayDoneKey === today)
    days.push({ label: DAY_LABELS[day.getDay()], done, isToday })
  }

  return (
    <Animated.View entering={FadeInUp.duration(500).springify()}>
      <LinearGradient colors={['#249049', '#1E7A3D', '#155C2E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
        <View style={s.heroBgGlow} pointerEvents="none" />
        <View style={s.heroTop}>
          <View style={s.flame}>
            <GoonaIcon icon={Icons.zap} size={34} color="#FFD66B" />
            <View style={s.fnum}><Text style={s.fnumText}>{state.streak}</Text></View>
          </View>
          <View style={s.heroMeta}>
            <Text style={s.hk}>Current Streak</Text>
            <Text style={s.hbig}>{state.streak} <Text style={s.hbigSpan}>days</Text></Text>
            <View style={s.hbest}>
              <GoonaIcon icon={Icons.star} size={13} color="#D4FF4D" />
              <Text style={s.hbestText}>Best streak: <Text style={{ fontWeight: '700' }}>{state.best}</Text> days</Text>
            </View>
          </View>
        </View>
        <View style={s.daystrip}>
          {days.map((day, i) => (
            <View key={i} style={[s.day, day.isToday && s.dayToday]}>
              <View style={[s.ddot, day.done && s.ddotDone, day.isToday && !day.done && s.ddotToday]}>
                {day.done ? <GoonaIcon icon={Icons.check} size={14} color={day.isToday ? C.greenD : '#15291A'} />
                  : day.isToday ? <View style={s.todayDot} /> : null}
              </View>
              <Text style={[s.dlab, day.isToday && s.dlabToday]}>{day.label}</Text>
            </View>
          ))}
        </View>
        {atRisk && (
          <View style={s.nudge}>
            <GoonaIcon icon={Icons.alertTriangle} size={16} color="#FFD66B" />
            <Text style={s.ntx}><Text style={{ fontWeight: '700', color: '#FFE08A' }}>Streak at risk. </Text>Play today challenge to keep your {state.streak}-day run alive.</Text>
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  )
}

/* TODAY CARD */

function TodayCard({ state, onPlay, meta }: { state: SState; onPlay: () => void; meta: ReturnType<typeof dailyMeta> }) {
  const done = state.todayDoneKey === todayKey()

  if (done) {
    return (
      <Animated.View entering={FadeInUp.duration(500).springify()} style={s.tcBorder}>
        <View style={s.tcIn}>
          <View style={s.tcTop}><Text style={s.tcEyebrow}>Today - {dateLabel()}</Text></View>
          <Text style={s.tcTitle}>{meta.title}</Text>
          <View style={s.tcDone}>
            <View style={s.tcCheck}><GoonaIcon icon={Icons.checkCheck} size={22} color="#fff" /></View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700', fontSize: 15, color: C.ink }}>Challenge complete!</Text>
              <Text style={{ fontSize: 12, color: C.mut }}>Come back tomorrow for a new one</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontWeight: '700', fontSize: 22, color: C.greenD, lineHeight: 22 }}>{state.todayScore}</Text>
              <Text style={{ fontSize: 10, color: C.mut, fontWeight: '700', letterSpacing: 0.3 }}>POINTS</Text>
            </View>
          </View>
        </View>
      </Animated.View>
    )
  }

  return (
    <Animated.View entering={FadeInUp.duration(500).springify()} style={s.tcBorder}>
      <LinearGradient colors={['#1E7A3D', '#43A047', '#AEEA00']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 24, padding: 3 }}>
        <View style={s.tcIn}>
          <View style={s.tcTop}>
            <Text style={s.tcEyebrow}>Today - {dateLabel()}</Text>
            <View style={s.tcDiff}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: C.amber }}>{['Easy', 'Medium', 'Hard'][meta.diff - 1]}</Text>
              <View style={{ flexDirection: 'row', gap: 3 }}>
                {[0, 1, 2].map((i) => <View key={i} style={[s.diffDot, i >= meta.diff && s.diffDotOff]} />)}
              </View>
            </View>
          </View>
          <Text style={s.tcTitle}>{meta.title}</Text>
           <Text style={s.tcSub}>5 quick rounds of multiple choice & estimates. Keep your streak alive.</Text>
          <View style={s.tcFoot}>
            <View style={s.reward}>
              <GoonaIcon icon={Icons.star} size={15} color={C.green} />
              <Text style={{ fontSize: 13, fontWeight: '700', color: C.greenD }}>+{meta.reward} XP</Text>
            </View>
            <TouchableOpacity activeOpacity={0.85} onPress={onPlay} style={s.playBtn}>
              <GoonaIcon icon={Icons.play} size={16} color="#fff" />
              <Text style={s.playBtnText}>Play - 60s</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  )
}

/* PACK CARD */

function PackCard({ pack, progress, onPress }: { pack: PackDef; progress: number; onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[s.pack, pack.locked && s.packLocked]}>
      {pack.locked && <View style={s.packLock}><GoonaIcon icon={Icons.lock} size={13} color={C.mut} /></View>}
      <View style={[s.pkIc, { backgroundColor: pack.bg }]}><Text style={{ fontSize: 18 }}>{pack.icon}</Text></View>
      <Text style={s.pkName}>{pack.name}</Text>
      <View style={s.pkProg}>
        <View style={s.pkBar}><View style={[s.pkBarFill, { width: `${(progress / 10) * 100}%` }]} /></View>
        <Text style={s.pkX}>{progress}/10</Text>
      </View>
    </TouchableOpacity>
  )
}

/* HEAD TO HEAD */

function HeadToHead({ state }: { state: SState }) {
  const rivalScore = 820
  const beat = state.youBest >= rivalScore
  return (
    <Animated.View entering={FadeInUp.duration(500).springify()} style={s.h2h}>
      <View style={s.h2hTop}>
        <Text style={s.vsTag}>Beat this score</Text>
        <Text style={s.h2hTitle}>Today rival</Text>
      </View>
      <View style={s.h2hRow}>
        <View style={s.h2hSide}>
          <LinearGradient colors={['#43A047', '#1E7A3D']} style={s.av}><Text style={s.avText}>YO</Text></LinearGradient>
          <Text style={s.nm}>You</Text>
          <Text style={[s.sc, { color: state.youBest > 0 ? C.greenD : C.mut2 }]}>{state.youBest > 0 ? state.youBest : '-'}</Text>
          <Text style={s.scLabel}>your best</Text>
        </View>
        <Text style={s.vs}>VS</Text>
        <View style={s.h2hSide}>
          <LinearGradient colors={['#4FB0C8', '#1E6E8C']} style={s.av}><Text style={s.avText}>GN</Text></LinearGradient>
          <Text style={s.nm}>GreenNest Farms</Text>
          <Text style={[s.sc, { color: C.greenD }]}>{rivalScore}</Text>
          <Text style={s.scLabel}>to beat</Text>
        </View>
      </View>
      {state.youBest > 0 && (
        <View style={[s.h2hResult, { borderTopColor: C.line2 }]}>
          {beat
            ? <Text style={{ color: C.greenD, fontWeight: '700', fontSize: 13 }}>You beat GreenNest by {state.youBest - rivalScore} points!</Text>
            : <Text style={{ color: C.amber, fontWeight: '700', fontSize: 13 }}>{rivalScore - state.youBest} points behind. Replay to take the lead.</Text>}
        </View>
      )}
    </Animated.View>
  )
}

/* LEADERBOARD */

function Leaderboard({ state }: { state: SState }) {
  const all = [...LB_DATA, { nm: 'You', pts: state.weekly, av: 'YO', you: true }]
  all.sort((a, b) => b.pts - a.pts)
  return (
    <Animated.View entering={FadeInUp.duration(500).springify()} style={s.lb}>
      {all.map((r, i) => (
        <View key={r.nm} style={[s.lbRow, (r as any).you && s.lbRowYou]}>
          <Text style={s.lbRank}>{['1st', '2nd', '3rd'][i] || `#${i + 1}`}</Text>
          <LinearGradient colors={['#43A047', '#1E7A3D']} style={s.lbAv}><Text style={s.lbAvText}>{r.av}</Text></LinearGradient>
          <Text style={s.lbNm}>{(r as any).you ? 'You' : r.nm}</Text>
          <Text style={s.lbPts}>{r.pts.toLocaleString()} <Text style={{ fontSize: 10, color: C.mut, fontWeight: '600' }}>pts</Text></Text>
        </View>
      ))}
    </Animated.View>
  )
}

/* QUIZ OVERLAY */

function QuizOverlay({ session, onClose, onEnd }: { session: SSess; onClose: () => void; onEnd: (final: SSess) => void }) {
  const [idx, setIdx] = useState(session.idx)
  const [score, setScore] = useState(session.score)
  const [correct, setCorrect] = useState(session.correct)
  const [combo, setCombo] = useState(session.combo)
  const [showIq, setShowIq] = useState(false)
  const [answered, setAnswered] = useState(false)
  const [timerFrac, setTimerFrac] = useState(1)
  const [timerMode, setTimerMode] = useState<'normal' | 'warn' | 'danger'>('normal')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const t0Ref = useRef(Date.now())
  const comboAnim = useRef(new RNAnimated.Value(0)).current
  const q = session.queue[idx]
  const totalQ = session.queue.length

  useEffect(() => {
    t0Ref.current = Date.now(); setTimerFrac(1); setTimerMode('normal'); setShowIq(false); setAnswered(false)
    timerRef.current = setInterval(() => {
      const el = Date.now() - t0Ref.current; const frac = clamp(1 - el / ROUND_TIME, 0, 1)
      setTimerFrac(frac)
      if (frac <= 0.22) setTimerMode('danger')
      else if (frac <= 0.5) setTimerMode('warn')
      if (frac <= 0) { clearInterval(timerRef.current!); timeOut() }
    }, 100)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [idx])

  const flashCombo = (mult: number) => { comboAnim.setValue(0); RNAnimated.timing(comboAnim, { toValue: 1, duration: 900, useNativeDriver: true }).start() }

  const applyScore = (isCorrect: boolean, speedFrac: number, accuracy: number) => {
    if (isCorrect) {
      const newCombo = combo + 1; setCombo(newCombo)
      const mult = newCombo >= 4 ? 2.5 : newCombo >= 3 ? 2 : newCombo >= 2 ? 1.5 : 1
      const base = q.type === 'estimate' ? Math.round(100 * accuracy) : 100
      const speed = q.type === 'estimate' ? 0 : Math.round(80 * speedFrac)
      const pts = Math.round((base + speed) * mult)
      setScore(score + pts); setCorrect(correct + 1)
      if (mult > 1) flashCombo(mult)
    } else { setCombo(0) }
  }

  const timeOut = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setAnswered(true); setShowIq(true)
    if (q.type === 'estimate') { handleEstimateLock(Math.round((q.min! + q.max!) / 2)); return }
  }

  const handleMcAnswer = (i: number) => {
    if (answered) return
    if (timerRef.current) clearInterval(timerRef.current)
    setAnswered(true); applyScore(i === q.correct, timerFrac, 1); setShowIq(true)
  }

  const [estGuess, setEstGuess] = useState(Math.round(((q.min || 0) + (q.max || 100)) / 2))
  const handleEstimateLock = (guess?: number) => {
    const val = guess ?? estGuess
    if (answered && !guess) return
    if (timerRef.current) clearInterval(timerRef.current)
    if (!answered) setAnswered(true)
    const err = Math.abs(val - (q.target || 50))
    const accuracy = clamp(1 - err / ((q.tol || 3) * 3), 0, 1)
    const good = err <= (q.tol || 3)
    applyScore(good, 0, accuracy); setShowIq(true)
  }

  const handleNext = () => {
    const nextIdx = idx + 1
    if (nextIdx >= session.queue.length) { session.score = score; session.correct = correct; session.combo = combo; onEnd(session); return }
    setIdx(nextIdx)
  }

  const comboAnimStyle = {
    opacity: comboAnim.interpolate({ inputRange: [0, 0.3, 0.7, 1], outputRange: [0, 1, 1, 0] }),
    transform: [
      { scale: comboAnim.interpolate({ inputRange: [0, 0.3, 0.7, 1], outputRange: [0.5, 1.15, 1, 1] }) },
      { translateY: comboAnim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 0, -20] }) },
    ],
  }

  const pack = PACKS[q.pack]

  return (
    <View style={s.play}>
      <RNAnimated.View style={[{ position: 'absolute', top: 100, left: 0, right: 0, zIndex: 110, alignItems: 'center', opacity: 0, transform: [{ scale: 0.6 }] }, comboAnimStyle]} pointerEvents="none">
        <Text style={s.comboText}>COMBO x{combo}</Text>
      </RNAnimated.View>

      <View style={s.playHead}>
        <View style={s.phTop}>
          <TouchableOpacity activeOpacity={0.85} onPress={onClose} style={s.phClose}>
            <GoonaIcon icon={Icons.x} size={17} color={C.ink} />
          </TouchableOpacity>
          <View style={s.phProg}>
            <View style={s.phDots}>{session.queue.map((_, i) => <View key={i} style={[s.phDot, i < idx && s.phDotDone, i === idx && s.phDotCur]} />)}</View>
          </View>
          <View style={s.phScore}>
            <Text style={s.phScoreVal}>{score.toLocaleString()}</Text>
            <Text style={s.phScoreLabel}>points</Text>
          </View>
        </View>
        <View style={s.timerTrack}>
          <View style={[s.timerBar, { width: `${timerFrac * 100}%` }, timerMode === 'warn' && s.timerWarn, timerMode === 'danger' && s.timerDanger]} />
        </View>
      </View>

      <ScrollView style={s.playBody} contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
        <View style={s.qKicker}>
          <View style={[s.qkIc, { backgroundColor: pack.bg }]}><Text style={{ fontSize: 16 }}>{pack.icon}</Text></View>
          <Text style={s.qkTx}>{pack.name}</Text>
          <Text style={s.qkType}>{q.type === 'mc' ? 'Multiple Choice' : 'Estimate'}</Text>
        </View>
        <Text style={s.qTitle}>{q.q}</Text>

        {q.type === 'mc' && q.opts && (
          <View style={s.opts}>
            {q.opts.map((opt, i) => {
              let optStyle: any = s.opt; let keyStyle: any = s.okKey; let mark: React.ReactNode = null
              if (answered) {
                if (i === q.correct) { optStyle = [s.opt, s.optCorrect]; keyStyle = [s.okKey, s.okKeyCorrect]; mark = <GoonaIcon icon={Icons.check} size={18} color={C.green} /> }
                else { optStyle = [s.opt, s.optDim] }
              }
              return (
                <TouchableOpacity key={i} activeOpacity={0.9} onPress={() => handleMcAnswer(i)} style={optStyle} disabled={answered}>
                  <View style={keyStyle}><Text style={[s.okKeyText, answered && i === q.correct && { color: '#fff' }]}>{String.fromCharCode(65 + i)}</Text></View>
                  <Text style={s.okTx}>{opt}</Text>
                  <View style={{ width: 22, alignItems: 'center' }}>{mark}</View>
                </TouchableOpacity>
              )
            })}
          </View>
        )}

        {q.type === 'estimate' && (
          <View style={s.estWrap}>
            <View style={s.estReadout}>
              <Text style={s.estVal}>{estGuess}</Text>
              <Text style={s.estUnit}>{q.unit}</Text>
            </View>
            <TouchableOpacity
              activeOpacity={1}
              onPressIn={(e: any) => {
                const touch = e.nativeEvent.locationX; const total = SW - HP * 2 - 36; const pct = clamp(touch / total, 0, 1)
                const val = Math.round((q.min || 0) + pct * ((q.max || 100) - (q.min || 0)))
                setEstGuess(clamp(val, q.min || 0, q.max || 100))
              }}
              style={{ position: 'relative', height: 40, justifyContent: 'center' }}
            >
              <View style={s.estTrackBg} />
              <View style={[s.estTrackFill, { width: `${((estGuess - (q.min || 0)) / ((q.max || 100) - (q.min || 0))) * 100}%` }]} />
              <View style={[s.estThumb, { left: `${((estGuess - (q.min || 0)) / ((q.max || 100) - (q.min || 0))) * 100}%`, marginLeft: -16 }]} />
            </TouchableOpacity>
            <View style={s.estScale}>
              <Text style={s.estScaleText}>{q.min}{q.unit}</Text>
              <Text style={s.estScaleText}>{q.max}{q.unit}</Text>
            </View>
            {answered && (
              <View style={{ marginTop: 12 }}>
                {Math.abs(estGuess - (q.target || 50)) <= (q.tol || 3)
                  ? <Text style={{ textAlign: 'center', fontSize: 13, fontWeight: '700' }}>Spot on! Actual: <Text style={{ color: C.greenD }}>{q.target}{q.unit}</Text></Text>
                  : <Text style={{ textAlign: 'center', fontSize: 13, fontWeight: '700' }}>Actual: <Text style={{ color: C.greenD }}>{q.target}{q.unit}</Text> (you guessed {estGuess}{q.unit})</Text>}
              </View>
            )}
          </View>
        )}

        {showIq && (
          <Animated.View entering={FadeIn.duration(300)} style={[s.iq, !answered && s.iqWrong]}>
            <View style={s.iqIc}><GoonaIcon icon={Icons.sparkles} size={15} color="#D4FF4D" /></View>
            <View style={s.iqTx}>
              <Text style={s.iqLabel}>GOONA IQ</Text>
              <Text style={{ fontSize: 12.5, lineHeight: 17.5, color: '#fff' }}>{q.iq}</Text>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      <View style={s.playFoot}>
        {q.type === 'estimate' && !answered && (
          <TouchableOpacity activeOpacity={0.85} onPress={() => handleEstimateLock()} style={s.estLock}>
            <Text style={{ fontWeight: '700', fontSize: 16, color: '#fff' }}>Lock in answer</Text>
          </TouchableOpacity>
        )}
        {(q.type !== 'estimate' || answered) && (
          <TouchableOpacity activeOpacity={0.85} onPress={handleNext} style={[s.nextBtn, showIq && s.nextBtnShow]}>
            <Text style={s.nextBtnText}>{idx < totalQ - 1 ? 'Next' : 'See results'}</Text>
            <GoonaIcon icon={Icons.arrowRight} size={16} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

/* RESULTS OVERLAY */

function ResultsOverlay({ session, state, onDone, onReplay, onShare }: { session: SSess; state: SState; onDone: () => void; onReplay: () => void; onShare: () => void }) {
  const total = session.queue.length; const acc = Math.round(session.correct / total * 100)
  const stars = acc >= 90 ? 3 : acc >= 60 ? 2 : acc >= 30 ? 1 : 0
  const timeSec = Math.round((Date.now() - session.t0) / 1000)
  const xpGain = Math.round(session.score / 8) + session.correct * 10
  const heroBg = stars >= 3 ? ['#249049', '#155C2E'] as const : stars >= 2 ? ['#2E7D32', '#1E5C2E'] as const : ['#5C6B5E', '#3A463C'] as const
  const titleText = stars >= 3 ? 'Outstanding!' : stars >= 2 ? 'Nice round!' : stars >= 1 ? 'Keep practising' : 'Tough one'
  const msgText = stars >= 3 ? "You nailed it. The flock next door doesn't stand a chance." : stars >= 2 ? 'Solid work - a couple of slips to tidy up.' : "Review the GOONA IQ tips and run it again."
  return (
    <View style={s.overlay}>
      <View style={s.sheet}>
        <View style={s.grab} />
        <LinearGradient colors={heroBg} style={s.resHero}>
          <View style={s.resStars}>{[0, 1, 2].map((i) => <Animated.View key={i} entering={FadeInUp.duration(400).delay(i * 120).springify()}><GoonaIcon icon={Icons.star} size={28} color={i < stars ? '#D4FF4D' : 'rgba(255,255,255,.25)'} /></Animated.View>)}</View>
          <Text style={s.resTitle}>{titleText}</Text>
          <Text style={s.resScore}>{session.score.toLocaleString()}</Text>
          <Text style={s.resMsg}>{msgText}</Text>
        </LinearGradient>
        <View style={s.resStats}>
          <View style={s.rstat}><Text style={s.rstatLabel}>Accuracy</Text><Text style={[s.rstatVal, { color: acc >= 60 ? C.green : C.amber }]}>{acc}%</Text></View>
          <View style={s.rstat}><Text style={s.rstatLabel}>Correct</Text><Text style={s.rstatVal}>{session.correct}/{total}</Text></View>
          <View style={s.rstat}><Text style={s.rstatLabel}>Time</Text><Text style={s.rstatVal}>{timeSec}s</Text></View>
        </View>
        <View style={s.resStreak}>
          {session.source === 'daily' && (
            <View style={s.resChip}>
              <View style={[s.rcIc, { backgroundColor: '#FFF0D6' }]}><GoonaIcon icon={Icons.zap} size={18} color={C.amber} /></View>
              <View><Text style={{ fontWeight: '700', fontSize: 16, color: C.ink, lineHeight: 16 }}>{state.streak} days</Text><Text style={s.resChipLabel}>Streak +1</Text></View>
            </View>
          )}
          <View style={s.resChip}>
            <View style={[s.rcIc, { backgroundColor: '#E6F4E9' }]}><GoonaIcon icon={Icons.star} size={18} color={C.green} /></View>
            <View><Text style={{ fontWeight: '700', fontSize: 16, color: C.ink, lineHeight: 16 }}>+{xpGain}</Text><Text style={s.resChipLabel}>XP earned</Text></View>
          </View>
        </View>
        <View style={s.resActs}>
          <TouchableOpacity activeOpacity={0.85} onPress={onReplay} style={[s.resBtn, s.resBtnGhost]}><GoonaIcon icon={Icons.refreshCw} size={15} color={C.ink} /><Text style={s.resBtnText}>Replay</Text></TouchableOpacity>
          <TouchableOpacity activeOpacity={0.85} onPress={onShare} style={[s.resBtn, { backgroundColor: '#25D366', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }]}><GoonaIcon icon={Icons.share2} size={15} color="#fff" /><Text style={{ fontWeight: '700', fontSize: 14, color: '#fff' }}>Share</Text></TouchableOpacity>
          <TouchableOpacity activeOpacity={0.85} onPress={onDone} style={[s.resBtn, s.resBtnGhost]}><Text style={s.resBtnText}>{session.source === 'daily' ? 'Done' : 'Next pack'}</Text></TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

/* MAIN SCREEN */

export default function GoonaAcademyChallengesScreen() {
  const insets = useSafeAreaInsets()
  const [state, setState] = useState<SState>(seedState)
  const [loaded, setLoaded] = useState(false)
  const [showPlay, setShowPlay] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [session, setSession] = useState<SSess | null>(null)
  const [toastMsg, setToastMsg] = useState('')
  const toastAnim = useRef(new RNAnimated.Value(0)).current
  const currentMeta = useRef(dailyMeta())

  const load = useCallback(async () => {
    try { const raw = await AsyncStorage.getItem(STORAGE_KEY); if (raw) setState(JSON.parse(raw)) } catch {}
    setLoaded(true)
  }, [])
  const persist = useCallback(async (s: SState) => { try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(s)) } catch {} }, [])
  useEffect(() => { load() }, [])

  const toast = (msg: string) => {
    setToastMsg(msg)
    RNAnimated.sequence([
      RNAnimated.timing(toastAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      RNAnimated.delay(1600),
      RNAnimated.timing(toastAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start()
  }

  const handleStartDaily = () => {
    const queue = dailyQueue()
    setSession({ queue, idx: 0, score: 0, correct: 0, combo: 0, maxCombo: 0, source: 'daily', meta: currentMeta.current, t0: Date.now() })
    setShowPlay(true)
  }

  const handleStartPack = (packKey: string) => {
    const p = PACKS[packKey]
    if (p.locked) { toast('Reach a 7-day streak to unlock'); return }
    const qs = BK.filter((qq) => qq.pack === packKey)
    if (!qs.length) { toast('Pack coming soon'); return }
    const rng = mulberry32(hashStr(packKey + '-' + Date.now()))
    const shuffled = seededShuffle(qs, rng).slice(0, Math.min(5, qs.length))
    setSession({ queue: shuffled, idx: 0, score: 0, correct: 0, combo: 0, maxCombo: 0, source: 'pack', meta: { packKey, title: p.name }, t0: Date.now() })
    setShowPlay(true)
  }

  const handleQuizEnd = (final: SSess) => {
    const ns = { ...state }; const xpGain = Math.round(final.score / 8) + final.correct * 10; ns.xp += xpGain
    if (final.source === 'daily') {
      if (ns.todayDoneKey !== todayKey()) { ns.streak += 1; ns.best = Math.max(ns.best, ns.streak); ns.completed.push(todayKey()) }
      ns.todayDoneKey = todayKey(); ns.todayScore = Math.max(ns.todayScore, final.score); ns.weekly += final.score; ns.youBest = Math.max(ns.youBest, final.score)
    } else {
      const pk = (final.meta as any).packKey; ns.packProg[pk] = Math.min(10, (ns.packProg[pk] || 0) + final.correct); ns.weekly += Math.round(final.score * 0.5)
    }
    setState(ns); persist(ns); setShowResults(true)
  }

  const handleClosePlay = () => { setShowPlay(false); setTimeout(() => setSession(null), 300) }
  const handleCloseResults = () => { setShowResults(false); setShowPlay(false); setTimeout(() => setSession(null), 300) }
  const handleReplay = () => {
    if (!session) return; setShowResults(false)
    setSession({ queue: session.queue, idx: 0, score: 0, correct: 0, combo: 0, maxCombo: 0, source: session.source, meta: session.meta, t0: Date.now() })
  }
  const handleShare = () => { toast('Score ready to share') }

  const toastStyle = {
    opacity: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
    transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
  }

  if (!loaded) return <View style={[s.container, { alignItems: 'center', justifyContent: 'center' }]}><Text style={{ color: C.mut }}>Loading...</Text></View>

  return (
    <View style={s.container}>
      <StatusBar style="dark" />
      <View style={[s.topBar, { paddingTop: insets.top + 4 }]}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => router.navigate('/goona-academy')} style={s.iconBtn}><GoonaIcon icon={Icons.arrowLeft} size={19} color={C.ink} /></TouchableOpacity>
        <View style={s.topTitle}><Text style={s.topTitleText}>Challenges</Text><Text style={s.topTitleSub}>GOONA Academy</Text></View>
        <TouchableOpacity activeOpacity={0.7} onPress={() => toast('Play daily to keep your streak')} style={s.iconBtn}><GoonaIcon icon={Icons.info} size={19} color={C.ink} /></TouchableOpacity>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={[s.scrollInner, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
        <StreakHero state={state} />
        <TodayCard state={state} onPlay={handleStartDaily} meta={currentMeta.current} />

        <View style={s.seclabel}><Text style={s.seclabelText}>Challenge Packs</Text><View style={s.seclabelLine} /><Text style={s.seclabelTag}>5 sets</Text></View>
        <View style={s.packs}>{Object.keys(PACKS).map((k) => <PackCard key={k} pack={PACKS[k]} progress={state.packProg[k] || 0} onPress={() => handleStartPack(k)} />)}</View>

        <View style={s.seclabel}><Text style={s.seclabelText}>Head-to-Head</Text><View style={s.seclabelLine} /></View>
        <HeadToHead state={state} />

        <View style={s.seclabel}><Text style={s.seclabelText}>This Week</Text><View style={s.seclabelLine} /><Text style={s.seclabelTag}>Leaderboard</Text></View>
        <Leaderboard state={state} />

        <View style={{ height: 20 }} />
      </ScrollView>

      <RNAnimated.View style={[s.toast, toastStyle]} pointerEvents="none">
        <GoonaIcon icon={Icons.check} size={15} color={C.limeL} />
        <Text style={{ fontSize: 12.5, fontWeight: '600', color: '#fff' }}>{toastMsg}</Text>
      </RNAnimated.View>

      {showPlay && session && <QuizOverlay session={session} onClose={handleClosePlay} onEnd={handleQuizEnd} />}
      {showResults && session && <ResultsOverlay session={session} state={state} onDone={handleCloseResults} onReplay={handleReplay} onShare={handleShare} />}
    </View>
  )
}

/* STYLES */

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: HP, paddingBottom: 8 },
  iconBtn: { width: 38, height: 38, borderRadius: 13, backgroundColor: C.card, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  topTitle: { flex: 1, alignItems: 'center' },
  topTitleText: { fontWeight: '700', fontSize: 16, color: C.ink, letterSpacing: -0.2 },
  topTitleSub: { fontSize: 10, color: C.mut, fontWeight: '600', letterSpacing: 0.3 },

  scroll: { flex: 1 },
  scrollInner: { paddingHorizontal: HP, paddingTop: 4, paddingBottom: 28 },

  seclabel: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 14 },
  seclabelText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.7, textTransform: 'uppercase', color: C.mut, margin: 0 },
  seclabelLine: { flex: 1, height: 1, backgroundColor: C.line },
  seclabelTag: { fontSize: 10, fontWeight: '800', color: C.greenD, backgroundColor: C.greenBg, paddingVertical: 2, paddingHorizontal: 8, borderRadius: 8, overflow: 'hidden' },

  hero: { borderRadius: 28, padding: 18, position: 'relative', overflow: 'hidden', backgroundColor: '#1E7A3D', shadowColor: '#145A2E', shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.34, shadowRadius: 34, elevation: 6 },
  heroBgGlow: { position: 'absolute', width: 240, height: 240, borderRadius: 120, right: -80, top: -90, backgroundColor: 'rgba(174,234,0,.32)' },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  flame: { width: 64, height: 64, borderRadius: 20, backgroundColor: 'rgba(255,255,255,.15)', alignItems: 'center', justifyContent: 'center' },
  fnum: { position: 'absolute', bottom: -6, right: -6, backgroundColor: C.lime, width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#1E7A3D' },
  fnumText: { fontWeight: '700', fontSize: 14, color: C.ink },
  heroMeta: { flex: 1 },
  hk: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', color: 'rgba(255,255,255,.78)' },
  hbig: { fontSize: 34, fontWeight: '700', letterSpacing: -1, lineHeight: 34, color: '#fff', marginTop: 2 },
  hbigSpan: { fontSize: 16, fontWeight: '600', color: 'rgba(255,255,255,.82)' },
  hbest: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  hbestText: { fontSize: 11.5, color: 'rgba(255,255,255,.78)', fontWeight: '600' },

  daystrip: { flexDirection: 'row', gap: 7, marginTop: 14 },
  day: { flex: 1, alignItems: 'center', gap: 5 },
  dayToday: {},
  ddot: { width: '100%', height: 34, borderRadius: 11, backgroundColor: 'rgba(255,255,255,.13)', borderWidth: 1, borderColor: 'rgba(255,255,255,.14)', alignItems: 'center', justifyContent: 'center' },
  ddotDone: { backgroundColor: C.lime, borderColor: C.lime },
  ddotToday: { borderStyle: 'dashed' as any, borderColor: 'rgba(255,255,255,.6)', backgroundColor: 'rgba(255,255,255,.08)' },
  todayDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  dlab: { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,.7)', letterSpacing: 0.3 },
  dlabToday: { color: '#fff' },

  nudge: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 14, backgroundColor: 'rgba(224,138,18,.22)', borderWidth: 1, borderColor: 'rgba(255,200,80,.4)', borderRadius: 14, padding: 10, paddingHorizontal: 13 },
  ntx: { fontSize: 12, fontWeight: '600', lineHeight: 15.6, color: 'rgba(255,255,255,.9)', flex: 1 },

  tcBorder: { marginTop: 4 },
  tcIn: { backgroundColor: C.card, borderRadius: 21, padding: 17 },
  tcTop: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  tcEyebrow: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase', color: C.greenD, backgroundColor: C.greenBg, paddingVertical: 5, paddingHorizontal: 9, borderRadius: 8, overflow: 'hidden' },
  tcDiff: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 4 },
  diffDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.amber },
  diffDotOff: { backgroundColor: C.line },
  tcTitle: { fontSize: 21, fontWeight: '700', letterSpacing: -0.4, lineHeight: 23.5, color: C.ink, marginTop: 13, marginHorizontal: 1 },
  tcSub: { fontSize: 13, color: C.mut, lineHeight: 18.2, marginTop: 7, marginHorizontal: 1 },
  tcFoot: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 15 },
  reward: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  playBtn: { marginLeft: 'auto', borderRadius: 15, paddingVertical: 13, paddingHorizontal: 22, backgroundColor: '#1E7A3D', flexDirection: 'row', alignItems: 'center', gap: 8, shadowColor: '#1E7A3D', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.32, shadowRadius: 18, elevation: 6 },
  playBtnText: { fontWeight: '700', fontSize: 15, color: '#fff' },
  tcDone: { flexDirection: 'row', alignItems: 'center', gap: 13, marginTop: 15, backgroundColor: C.greenBg, borderWidth: 1, borderColor: '#CFE6D4', borderRadius: 16, padding: 14 },
  tcCheck: { width: 42, height: 42, borderRadius: 13, backgroundColor: C.greenL, alignItems: 'center', justifyContent: 'center' },

  packs: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pack: { width: (SW - HP * 2 - 10) / 2, backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 18, padding: 14, position: 'relative', overflow: 'hidden' },
  packLocked: { opacity: 0.62 },
  packLock: { position: 'absolute', top: 13, right: 13, width: 24, height: 24, borderRadius: 8, backgroundColor: C.line2, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  pkIc: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 11 },
  pkName: { fontWeight: '700', fontSize: 14.5, color: C.ink, letterSpacing: -0.2, lineHeight: 16.7 },
  pkProg: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 9 },
  pkBar: { flex: 1, height: 5, borderRadius: 4, backgroundColor: C.line2, overflow: 'hidden' },
  pkBarFill: { height: '100%', borderRadius: 4, backgroundColor: C.greenL },
  pkX: { fontFamily: 'monospace', fontSize: 10, fontWeight: '700', color: C.mut },

  h2h: { backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 20, padding: 16 },
  h2hTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  vsTag: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase', color: C.blue, backgroundColor: C.blueBg, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 7, overflow: 'hidden' },
  h2hTitle: { fontWeight: '700', fontSize: 14, color: C.ink },
  h2hRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  h2hSide: { flex: 1, alignItems: 'center' },
  av: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 7 },
  avText: { fontWeight: '700', fontSize: 15, color: '#fff' },
  nm: { fontSize: 12, fontWeight: '700', color: C.ink },
  sc: { fontWeight: '700', fontSize: 22, marginTop: 2, lineHeight: 22 },
  scLabel: { fontSize: 9.5, color: C.mut, fontWeight: '700', letterSpacing: 0.3, textTransform: 'uppercase' },
  vs: { fontWeight: '700', color: C.mut2, fontSize: 14 },
  h2hResult: { borderTopWidth: 1, marginTop: 13, paddingTop: 13, alignItems: 'center' },

  lb: { backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  lbRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.line2 },
  lbRowYou: { marginHorizontal: -16, paddingHorizontal: 16, backgroundColor: C.greenBg, borderBottomColor: 'transparent' },
  lbRank: { fontSize: 16, minWidth: 34, textAlign: 'center', color: C.mut2 },
  lbAv: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  lbAvText: { fontWeight: '700', fontSize: 13, color: '#fff' },
  lbNm: { flex: 1, fontSize: 13.5, fontWeight: '700', color: C.ink },
  lbPts: { fontWeight: '700', fontSize: 15, color: C.greenD },

  toast: { position: 'absolute', bottom: 40, left: 40, right: 40, backgroundColor: C.ink, borderRadius: 14, paddingVertical: 11, paddingHorizontal: 17, flexDirection: 'row', alignItems: 'center', gap: 8, zIndex: 120, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.22, shadowRadius: 40, elevation: 10 },

  play: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, backgroundColor: C.bg },
  playHead: { paddingTop: 54, paddingHorizontal: 18, paddingBottom: 10 },
  phTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  phClose: { width: 34, height: 34, borderRadius: 11, backgroundColor: C.card, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  phProg: { flex: 1 },
  phDots: { flexDirection: 'row', gap: 5 },
  phDot: { flex: 1, height: 5, borderRadius: 3, backgroundColor: C.line },
  phDotDone: { backgroundColor: C.greenL },
  phDotCur: { backgroundColor: C.lime },
  phScore: { alignItems: 'flex-end' },
  phScoreVal: { fontWeight: '700', fontSize: 18, color: C.ink, lineHeight: 18 },
  phScoreLabel: { fontSize: 9, color: C.mut, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase' },
  timerTrack: { height: 6, borderRadius: 4, backgroundColor: C.line, overflow: 'hidden', marginTop: 13 },
  timerBar: { height: '100%', borderRadius: 4, backgroundColor: C.greenL },
  timerWarn: { backgroundColor: C.amber },
  timerDanger: { backgroundColor: C.red },
  comboText: { fontWeight: '700', fontSize: 30, color: C.greenD, textShadowColor: 'rgba(174,234,0,.4)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8 },

  playBody: { flex: 1, paddingHorizontal: 18, paddingVertical: 14 },
  qKicker: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  qkIc: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  qkTx: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase', color: C.mut },
  qkType: { marginLeft: 'auto', fontFamily: 'monospace', fontSize: 9.5, fontWeight: '700', color: C.mut2, backgroundColor: C.line2, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 7, letterSpacing: 0.3, textTransform: 'uppercase' },
  qTitle: { fontSize: 21, fontWeight: '700', letterSpacing: -0.4, lineHeight: 25.2, color: C.ink },

  opts: { gap: 10, marginTop: 18 },
  opt: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15, borderRadius: 16, backgroundColor: C.card, borderWidth: 1.5, borderColor: C.line },
  optCorrect: { borderColor: C.greenL, backgroundColor: C.greenBg },
  optDim: { opacity: 0.5 },
  okKey: { width: 30, height: 30, borderRadius: 9, backgroundColor: C.bg, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  okKeyCorrect: { backgroundColor: C.greenL, borderColor: C.greenL },
  okKeyText: { fontWeight: '700', fontSize: 13, color: C.mut },
  okTx: { flex: 1, fontSize: 14.5, fontWeight: '600', color: C.ink, lineHeight: 18.1 },

  estWrap: { marginTop: 22 },
  estReadout: { alignItems: 'center', marginBottom: 8 },
  estVal: { fontWeight: '700', fontSize: 46, letterSpacing: -1, lineHeight: 46, color: C.greenD },
  estUnit: { fontSize: 18, fontWeight: '600', color: C.mut },
  estTrackBg: { height: 10, borderRadius: 6, backgroundColor: C.greenL, opacity: 0.3 },
  estTrackFill: { position: 'absolute', left: 0, top: 0, height: 10, borderRadius: 6, backgroundColor: C.greenL },
  estThumb: { position: 'absolute', width: 32, height: 32, borderRadius: 16, backgroundColor: '#fff', borderWidth: 3, borderColor: C.greenD, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 10, elevation: 4, top: -11 },
  estScale: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  estScaleText: { fontFamily: 'monospace', fontSize: 10, color: C.mut2, fontWeight: '700' },

  iq: { flexDirection: 'row', gap: 11, marginTop: 18, borderRadius: 16, padding: 14, backgroundColor: '#0E5E34' },
  iqWrong: { backgroundColor: '#7A2A1F' },
  iqIc: { width: 28, height: 28, borderRadius: 9, backgroundColor: 'rgba(255,255,255,.16)', alignItems: 'center', justifyContent: 'center' },
  iqTx: { flex: 1 },
  iqLabel: { fontFamily: 'monospace', fontSize: 9, color: 'rgba(255,255,255,.6)', fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 2 },

  playFoot: { paddingHorizontal: 18, paddingBottom: 28, paddingTop: 12 },
  nextBtn: { borderRadius: 17, paddingVertical: 16, backgroundColor: '#1E7A3D', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: 0, transform: [{ translateY: 8 }] },
  nextBtnShow: { opacity: 1, transform: [{ translateY: 0 }] },
  nextBtnText: { fontWeight: '700', fontSize: 16, color: '#fff' },
  estLock: { borderRadius: 17, paddingVertical: 16, backgroundColor: '#1E7A3D', alignItems: 'center', justifyContent: 'center', shadowColor: '#1E7A3D', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 18, elevation: 6 },

  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 115, backgroundColor: 'rgba(12,28,16,.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.bg, borderRadius: 28, paddingHorizontal: 18, paddingTop: 8, paddingBottom: 26, maxHeight: '92%' },
  grab: { width: 38, height: 5, borderRadius: 5, backgroundColor: C.line, alignSelf: 'center', marginBottom: 14 },

  resHero: { borderRadius: 22, padding: 20, alignItems: 'center', overflow: 'hidden' },
  resStars: { flexDirection: 'row', gap: 7, marginBottom: 10 },
  resTitle: { fontSize: 26, fontWeight: '700', color: '#fff', letterSpacing: -0.4 },
  resScore: { fontWeight: '700', fontSize: 54, letterSpacing: -1.5, lineHeight: 54, color: C.limeL, marginTop: 6 },
  resMsg: { fontSize: 13, color: 'rgba(255,255,255,.85)', lineHeight: 18.2, marginTop: 6, textAlign: 'center' },

  resStats: { flexDirection: 'row', gap: 9, marginTop: 14 },
  rstat: { flex: 1, backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 15, paddingVertical: 13, paddingHorizontal: 8, alignItems: 'center' },
  rstatLabel: { fontSize: 9.5, fontWeight: '700', color: C.mut, letterSpacing: 0.2, textTransform: 'uppercase' },
  rstatVal: { fontWeight: '700', fontSize: 19, marginTop: 3 },

  resStreak: { flexDirection: 'row', gap: 10, marginTop: 12 },
  resChip: { flex: 1, backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 15, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  rcIc: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  resChipLabel: { fontSize: 10, color: C.mut, fontWeight: '700', letterSpacing: 0.2, textTransform: 'uppercase' },

  resActs: { flexDirection: 'row', gap: 9, marginTop: 16 },
  resBtn: { flex: 1, borderRadius: 16, paddingVertical: 15, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  resBtnGhost: { backgroundColor: C.card, borderWidth: 1, borderColor: C.line },
  resBtnText: { fontWeight: '700', fontSize: 14, color: C.ink },
})
