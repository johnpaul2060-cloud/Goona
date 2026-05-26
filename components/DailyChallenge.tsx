import React, { useEffect, useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
} from 'react-native'
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSequence, withDelay,
  withSpring, FadeInUp, FadeIn, interpolate, Extrapolation, Easing,
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'

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

const OPT_LETTERS = ['A', 'B', 'C', 'D']

export default function DailyChallenge() {
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
      <Animated.View entering={FadeInUp.duration(500).springify()}>
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
          <View style={dcStyles.rsCircle}>
            <Text style={dcStyles.rsCirclePct}>{pct}%</Text>
            <Text style={dcStyles.rsCircleLabel}>Score</Text>
          </View>
          <View style={dcStyles.rsStars}>
            {[1, 2, 3, 4, 5].map(s => (
              <Animated.Text key={s} entering={FadeInUp.duration(300).delay(200 + s * 100).springify()} style={[dcStyles.rsStar, { opacity: s <= stars ? 1 : 0.2 }]}>{'\u2B50'}</Animated.Text>
            ))}
          </View>
          <Text style={dcStyles.rsScoreText}>{correctCount} of {TOTAL} correct</Text>
          <View style={dcStyles.rsXpRow}>
            <Text style={dcStyles.rsXpLabel}>Total XP Earned</Text>
            <Text style={dcStyles.rsXpValue}>+{totalXp}</Text>
          </View>
          {perfBonus > 0 && (
            <Animated.View entering={FadeInUp.duration(400).delay(600).springify()} style={dcStyles.rsPerfBadge}>
              <Text style={dcStyles.rsPerfText}>{'\u{1F3C6}'} Perfect Score Bonus +{perfBonus} XP</Text>
            </Animated.View>
          )}
          <View style={dcStyles.rsRow}>
            <Text style={dcStyles.rsRowIcon}>{'\u{1F3C6}'}</Text>
            <Text style={dcStyles.rsRowText}>{rankMsg}</Text>
          </View>
          <View style={dcStyles.rsRow}>
            <Text style={dcStyles.rsRowIcon}>{'\u{1F4A1}'}</Text>
            <Text style={dcStyles.rsRowText}>{insight}</Text>
          </View>
          <View style={dcStyles.rsRow}>
            <Text style={dcStyles.rsRowIcon}>{'\u{1F4CB}'}</Text>
            <Text style={dcStyles.rsRowText}>{reco}</Text>
          </View>
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
    <Animated.View entering={FadeInUp.duration(500).springify()}>
      <LinearGradient colors={['#FEF9C3', '#FFF7ED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={dcStyles.card}>
        <View style={dcStyles.progressRow}>
          <View style={dcStyles.progressTrack}>
            <Animated.View style={[dcStyles.progressFill, barStyle]} />
          </View>
          <Text style={dcStyles.progressNum}>{qIdx + 1} of {TOTAL}</Text>
        </View>
        <View style={dcStyles.catRow}>
          <View style={dcStyles.catBadge}>
            <Text style={dcStyles.catBadgeText}>{q?.cat}</Text>
          </View>
        </View>
        <Animated.View key={qIdx} entering={FadeInUp.duration(400).springify().damping(15)}>
          <Text style={dcStyles.questionText}>{q?.q}</Text>
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
        {showExp && (
          <Animated.View entering={FadeInUp.duration(300).springify()} style={dcStyles.feedback}>
            <View style={dcStyles.feedbackHeader}>
              <Text style={dcStyles.feedbackLabel}>GOONA IQ</Text>
              <Text style={dcStyles.feedbackScore}>{answers[qIdx] === q.correct ? 'Correct' : 'Incorrect'}</Text>
            </View>
            <Text style={dcStyles.feedbackText}>{q.exp}</Text>
          </Animated.View>
        )}
        <Animated.View style={[dcStyles.xpNotif, xpPopStyle]} pointerEvents="none">
          <Text style={dcStyles.xpNotifText}>{'\u26A1'} +15 STREAK BONUS</Text>
        </Animated.View>
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
