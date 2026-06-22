import React, { useEffect, useState, useRef } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Dimensions, TextInput, Keyboard,
  KeyboardAvoidingView, Platform,
} from 'react-native'
import GoonaIcon from '../components/ui/GoonaIcon'
import { Icons } from '../shared/icons'
import Svg, { Path, Circle } from 'react-native-svg'
import { StatusBar } from 'expo-status-bar'
import { router } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence,
  withTiming, withSpring, withDelay, FadeInUp, FadeOut,
  Easing, interpolate, Extrapolation,
} from 'react-native-reanimated'
import BottomDock from '../components/navigation/BottomDock'

const { width: SCREEN_W } = Dimensions.get('window')

/* ─── Seed data ─── */
const INSIGHTS = [
  'Feed consumption increased 8% this week — flock growth is ahead of schedule.',
  'Mortality risk rising due to heat conditions. Consider ventilation adjustments.',
  'Worker efficiency dropped 12% during evening operations last cycle.',
  'Production readiness improving steadily — now at 72% target.',
  'Water intake per bird is 6% below optimal threshold this week.',
  'Batch B mortality rate trending 2.3% lower than batch average.',
  'Feed-to-weight conversion ratio improved 4% from previous cycle.',
  'Egg production forecast up 11% based on current health markers.',
  'Cost per bird reduced 5% through optimized feed allocation.',
  'Evening temperature spikes may affect next 48h mortality risk.',
]

const PREDICTIVE_METRICS = [
  { label: 'Mortality', value: 2.1, unit: '%', status: 'low' as const },
  { label: 'Feed Depletion', value: 14, unit: 'days', status: 'moderate' as const },
  { label: 'Revenue', value: 3.2, unit: 'M', status: 'high' as const },
  { label: 'Stress Index', value: 38, unit: '%', status: 'low' as const },
]

const HEALTH_SEGMENTS = [
  { label: 'Mortality', value: 88, color: '#2E7D32' },
  { label: 'Env Stress', value: 72, color: '#43A047' },
  { label: 'Feed', value: 94, color: '#AEEA00' },
  { label: 'Workers', value: 78, color: '#00695C' },
  { label: 'Sustain', value: 85, color: '#388E3C' },
]

const RECOMMENDATIONS = [
  { icon: 'feed', title: 'Feed Optimization', desc: 'Buying feed 3 days earlier could reduce costs by 11%.', impact: '+₦240k' },
  { icon: 'heart', title: 'Mortality Reduction', desc: 'Assigning an additional worker may reduce mortality risk by 18%.', impact: '-2.1%' },
  { icon: 'users', title: 'Worker Allocation', desc: 'Shift 1 worker from Batch A to Batch C to balance load.', impact: '+14% eff.' },
]

const RISKS = [
  { label: 'Disease', level: 0.25, color: '#F59E0B' },
  { label: 'Heat Risk', level: 0.68, color: '#EF4444' },
  { label: 'Overload', level: 0.42, color: '#F59E0B' },
  { label: 'Feed Shortage', level: 0.18, color: '#22C55E' },
  { label: 'Worker', level: 0.55, color: '#F97316' },
]

const FINANCIALS = [
  { label: 'Profitability', value: '₦1.8M', forecast: '₦2.4M', trend: 0.72 },
  { label: 'Recapt Readiness', value: '72%', forecast: '89%', trend: 0.72 },
  { label: 'Burn Rate', value: '₦420k', forecast: '₦380k', trend: 0.55 },
  { label: 'Cost Pressure', value: '₦187/bird', forecast: '₦165/bird', trend: 0.64 },
  { label: 'Revenue Prob.', value: '76%', forecast: '88%', trend: 0.76 },
]

/* ─── Context-aware AI responses ─── */
const AI_CONTEXT_RESPONSES: Record<string, { insight: string; recommendation: string }> = {
  mortality: {
    insight: 'Mortality probability increased 18% in Batch A due to heat stress and reduced airflow.',
    recommendation: 'Increase ventilation immediately. Reduce stocking density in House 2 by 15%.',
  },
  feed: {
    insight: 'Feed consumption is 8% above projection. Current stock: 340 bags.',
    recommendation: 'Restock in 9 days to avoid shortage. Consider bulk purchasing for 11% cost saving.',
  },
  heat: {
    insight: 'Temperature in House 3 is 4°C above optimal range for broilers.',
    recommendation: 'Activate emergency ventilation. Increase water availability. Monitor mortality closely.',
  },
  profit: {
    insight: 'Current margin per bird is ₦850. Projected margin at harvest: ₦1,020.',
    recommendation: 'Maintain current feed strategy. Consider forward-selling 30% of flock.',
  },
  worker: {
    insight: 'Worker efficiency dropped 12% during evening shifts across all batches.',
    recommendation: 'Reschedule 1 worker from Batch A to Batch C. Add lighting in processing area.',
  },
  recapt: {
    insight: 'Production readiness at 72%. Revenue tracking 8% above target this cycle.',
    recommendation: 'Current pace projects full readiness in 6 weeks. Consider accelerating feed purchases.',
  },
  default: {
    insight: 'All farm operations within normal parameters. No critical alerts detected.',
    recommendation: 'Continue current operational strategy. Next AI review in 3 hours.',
  },
}

type AIState = 'idle' | 'listening' | 'thinking' | 'responding'

/* ─── Animated primitives ─── */
function PulseDot({ color = '#AEEA00', size = 6 }: { color?: string; size?: number }) {
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

function usePressScale() {
  const scale = useSharedValue(1)
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
  return {
    style,
    onPressIn: () => { scale.value = withSpring(0.97, { damping: 15, stiffness: 200 }) },
    onPressOut: () => { scale.value = withSpring(1, { damping: 15, stiffness: 200 }) },
  }
}

/* ─── MAIN SCREEN ─── */
export default function GOONAIQScreen() {
  const [visibleInsights, setVisibleInsights] = useState(INSIGHTS.slice(0, 4))

  const [currentTip, setCurrentTip] = useState(0)
  const [aiState, setAiState] = useState<AIState>('idle')
  const [aiQuery, setAiQuery] = useState('')
  const [aiResponse, setAiResponse] = useState<{ insight: string; recommendation: string } | null>(null)
  const insightIdx = useRef(4)
  const inputRef = useRef<TextInput>(null)

  /* ─── cycle insights ─── */
  useEffect(() => {
    const t = setInterval(() => {
      const next = insightIdx.current % INSIGHTS.length
      setVisibleInsights((prev) => [...prev.slice(1), INSIGHTS[next]])
      insightIdx.current += 1
    }, 4000)
    return () => clearInterval(t)
  }, [])

  /* ─── cycle AI assistant tips ─── */
  const TIPS = [
    'Increase ventilation immediately due to rising heat stress in Batch A.',
    'Feed shortage predicted in 3 days. Consider restocking early.',
    'Reassign 1 worker to Batch C for optimal operational balance.',
    'Current feed strategy projects 11% improved profitability.',
    'Abnormal mortality pattern detected. Monitor Batch A closely.',
  ]

  useEffect(() => {
    const t = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % TIPS.length)
    }, 6000)
    return () => clearInterval(t)
  }, [])

  /* ─── AI query handler ─── */
  const handleSend = (query?: string) => {
    const q = (query || aiQuery).trim().toLowerCase()
    if (!q) return
    Keyboard.dismiss()
    setAiQuery('')
    setAiState('thinking')
    setAiResponse(null)

    setTimeout(() => {
      let key = 'default'
      if (q.includes('mortal') || q.includes('death') || q.includes('die')) key = 'mortality'
      else if (q.includes('feed') || q.includes('food') || q.includes('eat')) key = 'feed'
      else if (q.includes('heat') || q.includes('temper') || q.includes('hot') || q.includes('vent')) key = 'heat'
      else if (q.includes('profit') || q.includes('money') || q.includes('revenue') || q.includes('cost')) key = 'profit'
      else if (q.includes('worker') || q.includes('staff') || q.includes('employ') || q.includes('team')) key = 'worker'
      else if (q.includes('recap') || q.includes('capital') || q.includes('invest')) key = 'recapt'

      const resp = AI_CONTEXT_RESPONSES[key] || AI_CONTEXT_RESPONSES.default
      setAiResponse(resp)
      setAiState('responding')
    }, 1800)
  }

  const handleDismiss = () => {
    setAiState('idle')
    setAiResponse(null)
  }

  const handleMic = () => {
    setAiState('listening')
    setAiResponse(null)
    inputRef.current?.blur()
    setTimeout(() => {
      setAiState('thinking')
      setTimeout(() => {
        const keys = Object.keys(AI_CONTEXT_RESPONSES).filter((k) => k !== 'default')
        const key = keys[Math.floor(Math.random() * keys.length)]
        const resp = AI_CONTEXT_RESPONSES[key]
        setAiResponse(resp)
        setAiQuery('')
        setAiState('responding')
      }, 2000)
    }, 2500)
  }

  const { style: backStyle, onPressIn: backIn, onPressOut: backOut } = usePressScale()

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* ─── background ─── */}
      <View style={styles.bgBlob} pointerEvents="none">
        <View style={styles.bgBlobInner} />
      </View>
      <View style={styles.bgGlow} pointerEvents="none" />
      <View style={styles.bgContour1} pointerEvents="none" />
      <View style={styles.bgContour2} pointerEvents="none" />
      <View style={styles.bgDotGrid} pointerEvents="none">
        {Array.from({ length: 50 }).map((_, i) => (
          <View key={i} style={[styles.bgDot, { left: `${(i % 10) * 11 + 3}%`, top: `${Math.floor(i / 10) * 14 + 5}%` }]} />
        ))}
      </View>

      <KeyboardAvoidingView
        style={styles.kavContent}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 15 : 0}
      >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollInner, { paddingBottom: 180 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ─── TOP NAV ─── */}
        <Animated.View entering={FadeInUp.duration(500).springify()} style={styles.topNav}>
          <Animated.View style={backStyle}>
            <TouchableOpacity
              onPress={() => router.back()}
              onPressIn={backIn}
              onPressOut={backOut}
              style={styles.navBack}
              activeOpacity={0.7}
            >
              <GoonaIcon icon={Icons.arrowLeft} size={22} color="#1B1B1B" />
            </TouchableOpacity>
          </Animated.View>
          <View style={styles.navLogo}>
            <GoonaIcon icon={Icons.sprout} size={22} color="#2E7D32" />
            <Text style={styles.navLogoText}>GOONA</Text>
          </View>
          <Text style={styles.navLabel}>IQ</Text>
        </Animated.View>

        {/* ─── 1. AI INTELLIGENCE HEADER ─── */}
        <Animated.View entering={FadeInUp.duration(600).delay(80).springify()}>
          <LinearGradient
            colors={['#0F172A', '#1B5E20']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroGlow1} pointerEvents="none" />
            <View style={styles.heroGlow2} pointerEvents="none" />

            <View style={styles.heroLabel}>
              <PulseDot color="#AEEA00" size={6} />
              <Text style={styles.heroLabelText}>GOONA IQ ONLINE</Text>
              <View style={styles.heroStatusBadge}>
                <Text style={styles.heroStatusText}>Sync Live</Text>
              </View>
            </View>

            <Text style={styles.heroTitle}>Operational Intelligence Active</Text>
            <Text style={styles.heroSub} numberOfLines={1}>Monitoring 4 batches &bull; 3 workers &bull; 12 metrics</Text>

            <View style={styles.heroMetrics}>
              <View style={styles.heroMetric}>
                <Text style={styles.heroMetricVal}>94</Text>
                <Text style={styles.heroMetricLbl} numberOfLines={1}>IQ Score</Text>
              </View>
              <View style={styles.heroMetric}>
                <Text style={[styles.heroMetricVal, { color: '#AEEA00' }]}>87%</Text>
                <Text style={styles.heroMetricLbl} numberOfLines={1}>Accuracy</Text>
              </View>
              <View style={styles.heroMetric}>
                <Text style={[styles.heroMetricVal, { color: '#4ADE80' }]}>12</Text>
                <Text style={styles.heroMetricLbl} numberOfLines={1}>Active Insights</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ─── 2. LIVE AI INSIGHT STREAM ─── */}
        <Animated.View entering={FadeInUp.duration(500).delay(150).springify()} style={styles.sectionHdr}>
          <Text style={styles.sectionTitle}>Live Intelligence</Text>
          <View style={styles.sectionBadge}>
            <PulseDot color="#22C55E" size={4} />
            <Text style={styles.sectionBadgeText}>Streaming</Text>
          </View>
        </Animated.View>

        <View style={styles.insightStream}>
          {visibleInsights.map((text, i) => {
            const isWeather = /heat|temperature|humidity|ventilation|weather|climate|rain|wind|storm|flood/i.test(text)
            return (
            <TouchableOpacity
              key={`${text.slice(0, 10)}-${i}`}
              activeOpacity={isWeather ? 0.8 : 1}
              onPress={isWeather ? () => router.navigate({ pathname: '/weather-details' as any } as any) : undefined}
            >
              <Animated.View
                entering={FadeInUp.duration(500).delay(i * 80).springify()}
                style={[styles.insightCard, i === visibleInsights.length - 1 && styles.insightCardLatest]}
              >
                <GoonaIcon icon={Icons.sparkles} size={16} color={i === visibleInsights.length - 1 ? '#AEEA00' : '#2E7D32'} />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.insightText, i === visibleInsights.length - 1 && styles.insightTextLatest]}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {text}
                  </Text>
                  {isWeather && (
                    <Text style={styles.insightWeatherLink}>View Weather →</Text>
                  )}
                </View>
                {i === visibleInsights.length - 1 && <View style={styles.insightLatestDot} />}
              </Animated.View>
            </TouchableOpacity>
            )
          })}
        </View>

        {/* ─── 3. PREDICTIVE INTELLIGENCE ENGINE ─── */}
        <Animated.View entering={FadeInUp.duration(500).delay(200).springify()} style={styles.sectionHdr}>
          <Text style={styles.sectionTitle}>Predictive Engine</Text>
        </Animated.View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.predictiveScroll}>
          {PREDICTIVE_METRICS.map((m, i) => (
            <PredictiveGauge key={m.label} {...m} index={i} />
          ))}
        </ScrollView>

        {/* ─── 4. FARM HEALTH FORECAST ─── */}
        <Animated.View entering={FadeInUp.duration(500).delay(250).springify()} style={styles.sectionHdr}>
          <Text style={styles.sectionTitle}>Farm Health Radar</Text>
          <Text style={styles.sectionSub} numberOfLines={1}>Predictive health assessment</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(600).delay(300).springify()} style={styles.healthCard}>
          <HealthRadar segments={HEALTH_SEGMENTS} />
        </Animated.View>

        {/* ─── 5. AI OPERATIONAL ASSISTANT ─── */}
        <Animated.View entering={FadeInUp.duration(500).delay(350).springify()} style={styles.sectionHdr}>
          <Text style={styles.sectionTitle}>AI Assistant</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(600).delay(400).springify()}>
          <LinearGradient
            colors={['#0F172A', '#1B5E20']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.assistantCard}
          >
            <View style={styles.assistantGlow} pointerEvents="none" />
            <View style={styles.assistantHead}>
              <View style={styles.assistantIcon}>
                <GoonaIcon icon={Icons.sparkles} size={18} color="#AEEA00" />
              </View>
              <Text style={styles.assistantLabel}>PROACTIVE RECOMMENDATION</Text>
            </View>
            <Text style={styles.assistantText}>{TIPS[currentTip]}</Text>
            <View style={styles.assistantActions}>
              <TouchableOpacity style={styles.assistantBtnPrimary} activeOpacity={0.8}>
                <Text style={styles.assistantBtnPrimaryText}>Apply</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.assistantBtnSecondary} activeOpacity={0.8}>
                <Text style={styles.assistantBtnSecondaryText}>Ignore</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.assistantBtnSecondary} activeOpacity={0.8}>
                <Text style={styles.assistantBtnSecondaryText}>Explain</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ─── 6. SMART RECOMMENDATIONS ─── */}
        <Animated.View entering={FadeInUp.duration(500).delay(450).springify()} style={styles.sectionHdr}>
          <Text style={styles.sectionTitle}>Smart Recommendations</Text>
        </Animated.View>

        {RECOMMENDATIONS.map((r, i) => (
          <RecommendationCard key={r.title} {...r} index={i} />
        ))}

        {/* ─── 7. RISK DETECTION CENTER ─── */}
        <Animated.View entering={FadeInUp.duration(500).delay(550).springify()} style={styles.sectionHdr}>
          <Text style={styles.sectionTitle}>Risk Detection</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(600).delay(600).springify()} style={styles.riskGrid}>
          {RISKS.map((r, i) => (
            <RiskIndicator key={r.label} {...r} index={i} />
          ))}
        </Animated.View>

        {/* ─── 8. FINANCIAL FORECASTING ─── */}
        <Animated.View entering={FadeInUp.duration(500).delay(650).springify()} style={styles.sectionHdr}>
          <Text style={styles.sectionTitle}>Financial Forecast</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(600).delay(700).springify()} style={styles.financialGrid}>
          {FINANCIALS.map((f, i) => (
            <FinancialMetric key={f.label} {...f} index={i} />
          ))}
        </Animated.View>

        {/* ─── 9. ASK GOONA AI — VOICE-ENABLED ASSISTANT ─── */}
        <Animated.View entering={FadeInUp.duration(500).delay(850).springify()} style={styles.sectionHdr}>
          <Text style={styles.sectionTitle}>Ask GOONA AI</Text>
          <View style={styles.aiStatusBadge}>
            <PulseDot color="#22C55E" size={4} />
            <Text style={styles.aiStatusText}>Online</Text>
          </View>
        </Animated.View>

        <AIInteractionBar
          aiState={aiState}
          aiQuery={aiQuery}
          aiResponse={aiResponse}
          onQueryChange={setAiQuery}
          onSend={handleSend}
          onMic={handleMic}
          onDismiss={handleDismiss}
          inputRef={inputRef}
        />
      </ScrollView>

      </KeyboardAvoidingView>

      <BottomDock />
    </View>
  )
}

/* ─── AI INTERACTION BAR ─── */
function AIInteractionBar({
  aiState, aiQuery, aiResponse,
  onQueryChange, onSend, onMic, onDismiss, inputRef,
}: {
  aiState: AIState
  aiQuery: string
  aiResponse: { insight: string; recommendation: string } | null
  onQueryChange: (v: string) => void
  onSend: () => void
  onMic: () => void
  onDismiss: () => void
  inputRef: React.RefObject<TextInput>
}) {
  const micPulse = useSharedValue(1)
  const scanWidth = useSharedValue(0)
  const orbPulse = useSharedValue(1)
  const orbGlow = useSharedValue(1)

  useEffect(() => {
    if (aiState === 'listening') {
      micPulse.value = withRepeat(
        withSequence(
          withTiming(1.25, { duration: 600, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.sin) }),
        ),
        -1, true,
      )
    } else {
      micPulse.value = withTiming(1, { duration: 300 })
    }
  }, [aiState])

  useEffect(() => {
    if (aiState === 'thinking') {
      scanWidth.value = withRepeat(
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        -1, true,
      )
      orbPulse.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 400, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: 400, easing: Easing.inOut(Easing.sin) }),
        ),
        -1, true,
      )
      orbGlow.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 800 }), withTiming(1, { duration: 800 }),
        ),
        -1, true,
      )
    } else {
      scanWidth.value = withTiming(0, { duration: 300 })
      orbPulse.value = withTiming(1, { duration: 300 })
      orbGlow.value = withTiming(1, { duration: 300 })
    }
  }, [aiState])

  const micStyle = useAnimatedStyle(() => ({
    transform: [{ scale: micPulse.value }],
  }))

  const scanStyle = useAnimatedStyle(() => ({
    width: `${interpolate(scanWidth.value, [0, 0.5, 1], [0, 60, 0])}%`,
    opacity: interpolate(scanWidth.value, [0, 0.5, 1], [0, 0.5, 0]),
  }))

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: orbPulse.value }],
  }))

  const orbGlowStyle = useAnimatedStyle(() => ({
    opacity: orbGlow.value,
  }))

  const micColor = aiState === 'listening' ? '#AEEA00' : aiState === 'thinking' ? '#2E7D32' : '#94A3B8'

  return (
    <View style={aiBarStyles.container}>
      <LinearGradient
        colors={['rgba(255,255,255,0.78)', 'rgba(248,250,252,0.52)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: 28 }]}
        pointerEvents="none"
      />

      {/* ─── AI response card ─── */}
      {(aiState === 'thinking' || aiState === 'responding') && (
        <Animated.View
          entering={FadeInUp.duration(400).springify()}
          exiting={FadeOut.duration(250)}
          style={aiBarStyles.responseCard}
        >
          {aiState === 'thinking' ? (
            <>
              <View style={aiBarStyles.thinkingRow}>
                <Animated.View style={[aiBarStyles.thinkingOrb, orbStyle]}>
                  <LinearGradient
                    colors={['#2E7D32', '#1B5E20']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[StyleSheet.absoluteFill, { borderRadius: 12 }]}
                  />
                </Animated.View>
                <View style={aiBarStyles.thinkingContent}>
                  <Text style={aiBarStyles.thinkingText}>GOONA IQ analyzing operations...</Text>
                  <View style={aiBarStyles.scanTrack}>
                    <Animated.View style={[aiBarStyles.scanFill, scanStyle]} />
                  </View>
                </View>
              </View>
            </>
          ) : (
            <View style={aiBarStyles.responseContent}>
              <View style={aiBarStyles.responseHead}>
                <View style={aiBarStyles.responseOrb}>
                  <LinearGradient
                    colors={['#2E7D32', '#1B5E20']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[StyleSheet.absoluteFill, { borderRadius: 10 }]}
                  />
                  <GoonaIcon icon={Icons.sparkles} size={12} color="rgba(174,234,0,0.5)" />
                </View>
                <Text style={aiBarStyles.responseLabel}>GOONA IQ</Text>
              </View>
              {aiResponse && (
                <>
                  <Text style={aiBarStyles.responseInsight} numberOfLines={2} ellipsizeMode="tail">
                    {aiResponse.insight}
                  </Text>
                  <Text style={aiBarStyles.responseRec} numberOfLines={2} ellipsizeMode="tail">
                    Recommendation: {aiResponse.recommendation}
                  </Text>
                </>
              )}
              <View style={aiBarStyles.responseActions}>
                <TouchableOpacity style={aiBarStyles.respBtn} activeOpacity={0.8}>
                  <Text style={aiBarStyles.respBtnText}>Apply</Text>
                </TouchableOpacity>
                <TouchableOpacity style={aiBarStyles.respBtnOutline} onPress={onDismiss} activeOpacity={0.8}>
                  <Text style={aiBarStyles.respBtnOutlineText}>Dismiss</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Animated.View>
      )}

      {/* ─── input row ─── */}
      <View style={aiBarStyles.inputRow}>
        {/* AI Orb indicator */}
        <Animated.View style={[aiBarStyles.orbIndicator, orbGlowStyle]}>
          <Animated.View style={[aiBarStyles.orbSmall, orbStyle]}>
            <LinearGradient
              colors={['#2E7D32', '#1B5E20']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[StyleSheet.absoluteFill, { borderRadius: 10 }]}
            />
          </Animated.View>
        </Animated.View>

        {/* Mic button */}
        <TouchableOpacity
          onPress={onMic}
          style={aiBarStyles.micBtn}
          activeOpacity={0.7}
        >
          <Animated.View style={[aiBarStyles.micInner, micStyle]}>
            <GoonaIcon icon={Icons.mic} size={18} color={micColor} />
          </Animated.View>
        </TouchableOpacity>

        {/* Text input */}
        <TextInput
          ref={inputRef}
          style={aiBarStyles.input}
          placeholder={aiState === 'listening' ? 'Listening...' : 'Ask GOONA IQ anything...'}
          placeholderTextColor={aiState === 'listening' ? '#AEEA00' : '#94A3B8'}
          value={aiQuery}
          onChangeText={onQueryChange}
          onSubmitEditing={onSend}
          returnKeyType="send"
          editable={aiState !== 'thinking' && aiState !== 'listening'}
        />

        {/* Send button */}
        <TouchableOpacity
          onPress={onSend}
          style={[aiBarStyles.sendBtn, !aiQuery.trim() && { opacity: 0.4 }]}
          activeOpacity={0.7}
          disabled={!aiQuery.trim()}
        >
          <LinearGradient
            colors={['#2E7D32', '#1B5E20']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={aiBarStyles.sendGrad}
          >
            <GoonaIcon icon={Icons.send} size={16} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const aiBarStyles = StyleSheet.create({
  container: {
    marginHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.58)',
    borderRadius: 30,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)',
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12, shadowRadius: 36,
    elevation: 12,
    paddingTop: 8,
  },
  responseCard: {
    marginHorizontal: 12,
    marginBottom: 8,
    backgroundColor: '#F5FBF5',
    borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(46,125,50,0.12)',
    padding: 16,
  },
  thinkingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  thinkingOrb: {
    width: 28, height: 28, borderRadius: 14,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 14, elevation: 6,
  },
  thinkingContent: { flex: 1 },
  thinkingText: { fontSize: 13, fontWeight: '600', color: '#2E7D32', marginBottom: 8 },
  scanTrack: {
    height: 4, backgroundColor: 'rgba(6,95,70,0.08)',
    borderRadius: 100, overflow: 'hidden',
  },
  scanFill: {
    height: '100%', backgroundColor: '#2E7D32',
    borderRadius: 100,
  },
  responseContent: { gap: 8 },
  responseHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  responseOrb: {
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  responseLabel: { fontSize: 11, fontWeight: '700', color: '#2E7D32', letterSpacing: 0.4 },
  responseInsight: { fontSize: 13, lineHeight: 18, color: '#1F2937', fontWeight: '500' },
  responseRec: { fontSize: 12, lineHeight: 17, color: '#64748B' },
  responseActions: { flexDirection: 'row', gap: 8, marginTop: 6 },
  respBtn: {
    paddingVertical: 8, paddingHorizontal: 16, borderRadius: 50,
    backgroundColor: '#2E7D32',
  },
  respBtnText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  respBtnOutline: {
    paddingVertical: 8, paddingHorizontal: 16, borderRadius: 50,
    borderWidth: 1, borderColor: 'rgba(6,95,70,0.15)',
  },
  respBtnOutlineText: { fontSize: 11, fontWeight: '600', color: '#64748B' },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 12, gap: 10,
  },
  orbIndicator: { width: 24, height: 24, borderRadius: 12 },
  orbSmall: { width: 24, height: 24, borderRadius: 12 },
  micBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.03)',
    alignItems: 'center', justifyContent: 'center',
  },
  micInner: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  input: {
    flex: 1, height: 38, fontSize: 14, color: '#1B1B1B',
    paddingHorizontal: 12, borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  sendBtn: { width: 38, height: 38, borderRadius: 14, overflow: 'hidden' },
  sendGrad: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
})

/* ─── Predictive Gauge ─── */
function PredictiveGauge({
  label, value, unit, status, index,
}: {
  label: string; value: number; unit: string; status: 'low' | 'moderate' | 'high'; index: number
}) {
  const anim = useSharedValue(0)
  const SIZE = 100
  const STROKE = 5
  const R = (SIZE - STROKE * 2) / 2
  const CIRC = 2 * Math.PI * R
  const progress = status === 'low' ? 0.3 : status === 'moderate' ? 0.55 : 0.78
  const color = status === 'low' ? '#22C55E' : status === 'moderate' ? '#F59E0B' : '#2E7D32'

  useEffect(() => {
    anim.value = withTiming(1, { duration: 1200 + index * 200, easing: Easing.out(Easing.cubic) })
  }, [])

  const gaugeStyle = useAnimatedStyle(() => ({
    opacity: anim.value,
    transform: [{ scale: interpolate(anim.value, [0, 1], [0.7, 1]) }],
  }))

  return (
    <Animated.View entering={FadeInUp.duration(500).delay(250 + index * 80).springify()} style={pgStyles.wrap}>
      <Animated.View style={[pgStyles.gauge, gaugeStyle]}>
        <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <Circle cx={SIZE / 2} cy={SIZE / 2} r={R} stroke="rgba(0,0,0,0.04)" strokeWidth={STROKE} fill="none" />
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            stroke={color}
            strokeWidth={STROKE}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC * (1 - progress)}
          />
        </Svg>
        <View style={pgStyles.gaugeInner}>
          <Text style={[pgStyles.gaugeVal, { color }]}>{value}</Text>
          <Text style={pgStyles.gaugeUnit}>{unit}</Text>
        </View>
      </Animated.View>
      <Text style={pgStyles.gaugeLabel} numberOfLines={1} ellipsizeMode="tail">{label}</Text>
    </Animated.View>
  )
}

const pgStyles = StyleSheet.create({
  wrap: { alignItems: 'center', marginRight: 16, minWidth: 100 },
  gauge: { width: 100, height: 100, alignItems: 'center', justifyContent: 'center' },
  gaugeInner: { position: 'absolute', alignItems: 'center' },
  gaugeVal: { fontSize: 22, fontWeight: '800' },
  gaugeUnit: { fontSize: 10, fontWeight: '500', color: '#94A3B8', marginTop: -2 },
  gaugeLabel: { fontSize: 11, fontWeight: '600', color: '#64748B', marginTop: 6, maxWidth: 100 },
})

/* ─── Health Radar ─── */
function HealthRadar({ segments }: { segments: typeof HEALTH_SEGMENTS }) {
  const CHART_SIZE = Math.min(150, Math.max(120, (SCREEN_W - 96) * 0.45))
  const CX = CHART_SIZE / 2
  const CY = CHART_SIZE / 2
  const R = CHART_SIZE * 0.373
  const PULSE_SIZE = CHART_SIZE * 0.8
  const pulse = useSharedValue(1)

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(0.92, { duration: 2000 }), withTiming(1, { duration: 2000 })),
      -1, true,
    )
  }, [])

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: interpolate(pulse.value, [0.92, 1], [0.6, 0.9]),
  }))

  const angleStep = 360 / segments.length
  const gaps = 4

  return (
    <View style={hrStyles.wrap}>
      <View style={hrStyles.radarCol}>
        <View style={[hrStyles.radarWrap, { width: CHART_SIZE, height: CHART_SIZE }]}>
          <Svg width={CHART_SIZE} height={CHART_SIZE} viewBox={`0 0 ${CHART_SIZE} ${CHART_SIZE}`}>
            <Circle cx={CX} cy={CY} r={R} stroke="rgba(0,0,0,0.04)" strokeWidth={1} fill="none" />
            <Circle cx={CX} cy={CY} r={R * 0.7} stroke="rgba(0,0,0,0.03)" strokeWidth={0.5} fill="none" />
            <Circle cx={CX} cy={CY} r={R * 0.4} stroke="rgba(0,0,0,0.02)" strokeWidth={0.5} fill="none" />
            {segments.map((seg, i) => {
              const angle = (angleStep * i * Math.PI) / 180 - Math.PI / 2
              const nextAngle = (angleStep * (i + 1) * Math.PI) / 180 - Math.PI / 2 - (gaps * Math.PI) / 180
              const r1 = R * (seg.value / 100)
              const x1 = CX + r1 * Math.cos(angle)
              const y1 = CY + r1 * Math.sin(angle)
              const x2 = CX + r1 * Math.cos(nextAngle)
              const y2 = CY + r1 * Math.sin(nextAngle)
              const largeArc = seg.value > 50 ? 1 : 0
              return (
                <Path
                  key={seg.label}
                  d={`M${CX} ${CY} L${x1} ${y1} A${r1} ${r1} 0 ${largeArc} 1 ${x2} ${y2} Z`}
                  fill={seg.color}
                  fillOpacity={0.15 + (seg.value / 100) * 0.35}
                  stroke={seg.color}
                  strokeWidth={0.5}
                  strokeOpacity={0.4}
                />
              )
            })}
            <Circle cx={CX} cy={CY} r={Math.max(2, CHART_SIZE * 0.02)} fill="#2E7D32" />
          </Svg>
          <Animated.View style={[hrStyles.radarPulse, { width: PULSE_SIZE, height: PULSE_SIZE, borderRadius: PULSE_SIZE / 2 }, pulseStyle]} pointerEvents="none" />
        </View>
      </View>
      <View style={hrStyles.labels}>
        {segments.map((seg) => (
          <View key={seg.label} style={hrStyles.labelRow}>
            <View style={[hrStyles.labelDot, { backgroundColor: seg.color }]} />
            <Text style={hrStyles.labelText} numberOfLines={1} ellipsizeMode="tail">{seg.label}</Text>
            <Text style={[hrStyles.labelVal, { color: seg.color }]}>{seg.value}%</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

const hrStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
  },
  radarCol: { alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  radarWrap: { alignItems: 'center', justifyContent: 'center' },
  radarPulse: {
    position: 'absolute',
    backgroundColor: 'rgba(6,95,70,0.04)',
  },
  labels: {
    flex: 1, marginLeft: 16, gap: 8,
    justifyContent: 'center',
  },
  labelRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  labelDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  labelText: { fontSize: 14, fontWeight: '500', color: '#64748B', flex: 1 },
  labelVal: { fontSize: 14, fontWeight: '700', flexShrink: 0 },
})

/* ─── Recommendation Card ─── */
function RecommendationCard({
  icon, title, desc, impact, index,
}: {
  icon: string; title: string; desc: string; impact: string; index: number
}) {
  const { style, onPressIn, onPressOut } = usePressScale()
  const iconComp = icon === 'feed'
    ? Icons.package
    : icon === 'heart'
      ? Icons.heart
      : Icons.mapPin

  return (
    <Animated.View entering={FadeInUp.duration(500).delay(500 + index * 80).springify()} style={[style, { marginBottom: 10 }]}>
      <TouchableOpacity style={styles.recCard} onPressIn={onPressIn} onPressOut={onPressOut} activeOpacity={0.92}>
        <View style={styles.recIcon}>
          <GoonaIcon icon={iconComp} size={20} color="#2E7D32" />
        </View>
        <View style={styles.recBody}>
          <View style={styles.recHead}>
            <Text style={styles.recTitle} numberOfLines={1} ellipsizeMode="tail">{title}</Text>
            <View style={styles.recBadge}>
              <Text style={styles.recBadgeText}>{impact}</Text>
            </View>
          </View>
          <Text style={styles.recDesc} numberOfLines={2} ellipsizeMode="tail">{desc}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

/* ─── Risk Indicator ─── */
function RiskIndicator({
  label, level, color, index,
}: {
  label: string; level: number; color: string; index: number
}) {
  const pulse = useSharedValue(1)
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1 + level * 0.15, { duration: 1500 + index * 300 }),
        withTiming(1, { duration: 1500 + index * 300 }),
      ),
      -1, true,
    )
  }, [])

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }))

  const alertColor = level > 0.6 ? '#EF4444' : level > 0.4 ? '#F59E0B' : '#22C55E'

  return (
    <View style={riStyles.wrap}>
      <Animated.View style={[riStyles.ring, style, { borderColor: alertColor }]}>
        <View style={[riStyles.dot, { backgroundColor: alertColor }]} />
      </Animated.View>
      <Text style={riStyles.label} numberOfLines={1} ellipsizeMode="tail">{label}</Text>
      <Text style={[riStyles.level, { color: alertColor }]}>{Math.round(level * 100)}%</Text>
    </View>
  )
}

const riStyles = StyleSheet.create({
  wrap: { alignItems: 'center', width: (SCREEN_W - 72) / 5 },
  ring: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  label: { fontSize: 9, fontWeight: '600', color: '#64748B', marginTop: 4, textAlign: 'center', maxWidth: (SCREEN_W - 72) / 5 - 4 },
  level: { fontSize: 10, fontWeight: '700', marginTop: 1 },
})

/* ─── Financial Metric ─── */
function FinancialMetric({
  label, value, forecast, trend, index,
}: {
  label: string; value: string; forecast: string; trend: number; index: number
}) {
  const barAnim = useSharedValue(0)
  useEffect(() => {
    barAnim.value = withDelay(index * 100, withTiming(1, { duration: 1000, easing: Easing.out(Easing.cubic) }))
  }, [])

  const barStyle = useAnimatedStyle(() => ({
    width: `${trend * 100}%`,
    opacity: barAnim.value,
  }))

  return (
    <View style={fmStyles.card}>
      <Text style={fmStyles.label} numberOfLines={1} ellipsizeMode="tail">{label}</Text>
      <View style={fmStyles.values}>
        <Text style={fmStyles.current}>{value}</Text>
        <GoonaIcon icon={Icons.trendingUp} size={14} color="#22C55E" />
        <Text style={fmStyles.forecast}>{forecast}</Text>
      </View>
      <View style={fmStyles.track}>
        <Animated.View style={[fmStyles.fill, barStyle, { backgroundColor: '#2E7D32' }]} />
      </View>
    </View>
  )
}

const fmStyles = StyleSheet.create({
  card: {
    backgroundColor: 'white', borderRadius: 18, padding: 14,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04, shadowRadius: 16, elevation: 2,
  },
  label: { fontSize: 11, fontWeight: '600', color: '#64748B', marginBottom: 4 },
  values: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  current: { fontSize: 16, fontWeight: '700', color: '#1B1B1B' },
  forecast: { fontSize: 13, fontWeight: '600', color: '#22C55E' },
  track: { height: 4, backgroundColor: '#F1F5F9', borderRadius: 100, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 100 },
})

/* ─── Styles ─── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAF7' },
  kavContent: { flex: 1, zIndex: 1 },

  /* background */
  bgBlob: { position: 'absolute', top: -60, right: -60, width: 340, height: 340, zIndex: 0 },
  bgBlobInner: { width: 340, height: 340, borderRadius: 170, backgroundColor: 'rgba(6,95,70,0.06)' },
  bgGlow: { position: 'absolute', top: '30%', left: '50%', width: 200, height: 200, marginLeft: -100, marginTop: -100, borderRadius: 100, backgroundColor: 'rgba(6,95,70,0.04)', zIndex: 0 },
  bgContour1: { position: 'absolute', top: '12%', right: '-20%', width: 400, height: 140, borderWidth: 1, borderColor: 'rgba(6,95,70,0.05)', borderTopLeftRadius: 200, borderTopRightRadius: 200, borderBottomWidth: 0, transform: [{ rotate: '8deg' }], zIndex: 0 },
  bgContour2: { position: 'absolute', bottom: '15%', left: '-15%', width: 320, height: 110, borderWidth: 1, borderColor: 'rgba(6,95,70,0.05)', borderBottomLeftRadius: 160, borderBottomRightRadius: 160, borderTopWidth: 0, transform: [{ rotate: '-10deg' }], zIndex: 0 },
  bgDotGrid: { position: 'absolute', inset: 0, zIndex: 0, opacity: 0.4 },
  bgDot: { position: 'absolute', width: 2, height: 2, borderRadius: 1, backgroundColor: 'rgba(6,95,70,0.1)' },

  /* scroll */
  scroll: { flex: 1, zIndex: 1 },
  scrollInner: { paddingHorizontal: 24, paddingTop: 0 },

  /* top nav */
  topNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 54 },
  navBack: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  navLogo: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  navLogoText: { fontWeight: '700', fontSize: 14, color: '#1B1B1B' },
  navLabel: { fontSize: 14, fontWeight: '500', color: '#64748B' },

  /* hero card */
  heroCard: {
    borderRadius: 34, padding: 28, marginTop: 20, overflow: 'hidden',
    shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.24, shadowRadius: 60, elevation: 8,
  },
  heroGlow1: {
    position: 'absolute', top: '-30%', right: '-15%', width: 220, height: 220,
    borderRadius: 110, backgroundColor: 'rgba(174,234,0,0.06)',
  },
  heroGlow2: {
    position: 'absolute', bottom: '-10%', left: '-10%', width: 160, height: 160,
    borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.03)',
  },
  heroLabel: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 50,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 5, paddingHorizontal: 14, marginBottom: 14,
  },
  heroLabelText: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.85)', letterSpacing: 0.5 },
  heroStatusBadge: {
    backgroundColor: 'rgba(74,222,128,0.15)', borderRadius: 50,
    paddingVertical: 2, paddingHorizontal: 8,
  },
  heroStatusText: { fontSize: 8, fontWeight: '700', color: '#4ADE80' },
  heroTitle: { fontWeight: '800', fontSize: 28, color: '#fff', lineHeight: 32 },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  heroMetrics: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 24 },
  heroMetric: { alignItems: 'center' },
  heroMetricVal: { fontSize: 28, fontWeight: '800', color: 'white' },
  heroMetricLbl: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2, maxWidth: 80 },

  /* section header */
  sectionHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 26, marginBottom: 14 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#1B1B1B' },
  sectionSub: { fontSize: 12, fontWeight: '500', color: '#94A3B8', flexShrink: 1 },
  sectionBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(34,197,94,0.08)', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 50, flexShrink: 0 },
  sectionBadgeText: { fontSize: 9, fontWeight: '700', color: '#22C55E' },

  /* insight stream */
  insightStream: { gap: 8 },
  insightCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: 'white', borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04, shadowRadius: 16, elevation: 1,
  },
  insightCardLatest: {
    borderColor: 'rgba(46,125,50,0.15)',
    backgroundColor: '#F5FBF5',
    shadowColor: '#2E7D32', shadowOpacity: 0.06, shadowRadius: 20,
  },
  insightText: { fontSize: 13, lineHeight: 18, color: '#64748B', flex: 1 },
  insightTextLatest: { color: '#1B1B1B', fontWeight: '500' },
  insightLatestDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: '#AEEA00',
    marginTop: 4, flexShrink: 0,
  },
  insightWeatherLink: {
    fontSize: 11, fontWeight: '600', color: '#2E7D32', marginTop: 4,
    textDecorationLine: 'underline',
  },

  /* predictive scroll */
  predictiveScroll: { paddingBottom: 4, marginBottom: 0 },

  /* health radar */
  healthCard: {
    backgroundColor: 'white', borderRadius: 26, padding: 24,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04, shadowRadius: 24, elevation: 2,
  },

  /* assistant */
  assistantCard: {
    borderRadius: 32, padding: 28, overflow: 'hidden',
    shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.22, shadowRadius: 48, elevation: 8,
  },
  assistantGlow: {
    position: 'absolute', bottom: '-20%', right: '-10%', width: 260, height: 260,
    borderRadius: 130, backgroundColor: 'rgba(174,234,0,0.05)',
  },
  assistantHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  assistantIcon: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center',
  },
  assistantLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(174,234,0,0.75)', letterSpacing: 0.6 },
  assistantText: { fontSize: 18, fontWeight: '600', color: '#fff', lineHeight: 26, marginBottom: 20 },
  assistantActions: { flexDirection: 'row', gap: 10 },
  assistantBtnPrimary: {
    flex: 1, paddingVertical: 14, borderRadius: 16,
    backgroundColor: '#AEEA00', alignItems: 'center',
  },
  assistantBtnPrimaryText: { fontWeight: '700', fontSize: 14, color: '#1A2E00' },
  assistantBtnSecondary: {
    flex: 1, paddingVertical: 14, borderRadius: 16,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)', alignItems: 'center',
  },
  assistantBtnSecondaryText: { fontWeight: '600', fontSize: 14, color: 'rgba(255,255,255,0.7)' },

  /* recommendations */
  recCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    backgroundColor: 'white', borderRadius: 22, padding: 18,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04, shadowRadius: 16, elevation: 2,
  },
  recIcon: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  recBody: { flex: 1 },
  recHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  recTitle: { fontSize: 14, fontWeight: '700', color: '#1B1B1B', flexShrink: 1 },
  recBadge: {
    backgroundColor: '#F0FDF4', borderRadius: 50,
    paddingVertical: 2, paddingHorizontal: 8, flexShrink: 0,
  },
  recBadgeText: { fontSize: 9, fontWeight: '700', color: '#2E7D32' },
  recDesc: { fontSize: 12, lineHeight: 16, color: '#64748B' },

  /* risk grid */
  riskGrid: {
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: 'white', borderRadius: 26, padding: 20,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04, shadowRadius: 24, elevation: 2,
  },

  /* financial grid */
  financialGrid: { gap: 8 },

  /* ask goona ai */
  aiStatusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(34,197,94,0.08)', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 50, flexShrink: 0 },
  aiStatusText: { fontSize: 9, fontWeight: '700', color: '#22C55E' },
  aiSuggestionGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  aiSuggestionChip: {
    flexBasis: '47%', paddingVertical: 14, paddingHorizontal: 14,
    backgroundColor: 'white', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03, shadowRadius: 12, elevation: 2,
    borderLeftWidth: 3, borderLeftColor: '#2E7D32',
  },
  aiSuggestionText: { fontSize: 12, fontWeight: '600', color: '#1B1B1B', lineHeight: 17 },
})
