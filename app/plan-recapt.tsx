import React, { useState, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, KeyboardAvoidingView, Platform, Keyboard,
} from 'react-native'
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg'
import { StatusBar } from 'expo-status-bar'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming,
  FadeInDown, FadeInUp,
} from 'react-native-reanimated'
import BottomDock from '../components/navigation/BottomDock'

function BackIcon() {
  return (
    <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <Path d="M13 16L8 10L13 4" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

function PulseDot({ color }: { color: string }) {
  const opacity = useSharedValue(1)
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(0.3, { duration: 2200 }), withTiming(1, { duration: 2200 })),
      -1, true
    )
  }, [])
  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }))
  return <Animated.View style={[{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: color }, animStyle]} />
}

const RECOVERY_OPTIONS = ['Daily', 'Weekly', 'Monthly']
const TIMELINE_OPTIONS = ['8 weeks', '12 weeks', '16 weeks', 'Custom']

const ALLOCATION_ITEMS = [
  { key: 'feed', label: 'Feed Budget', color: '#2E7D32' },
  { key: 'medication', label: 'Medication', color: '#16A34A' },
  { key: 'doc', label: 'DOC Purchase', color: '#2563EB' },
  { key: 'workers', label: 'Workers', color: '#F59E0B' },
  { key: 'utilities', label: 'Utilities', color: '#8B5CF6' },
  { key: 'infrastructure', label: 'Infrastructure', color: '#EC4899' },
  { key: 'emergency', label: 'Emergency Reserve', color: '#EF4444' },
]

function SegmentedControl({
  options, selected, onSelect,
}: {
  options: string[]
  selected: string
  onSelect: (v: string) => void
}) {
  return (
    <View style={styles.segWrap}>
      {options.map((opt) => {
        const active = opt === selected
        return (
          <TouchableOpacity
            key={opt}
            style={[styles.segBtn, active && styles.segBtnActive]}
            activeOpacity={0.85}
            onPress={() => onSelect(opt)}
          >
            <Text style={[styles.segBtnText, active && styles.segBtnTextActive]}>{opt}</Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

export default function PlanRecaptScreen() {
  const insets = useSafeAreaInsets()
  const [keyboardH, setKeyboardH] = useState(0)

  useEffect(() => {
    const show = Keyboard.addListener('keyboardWillShow', e => setKeyboardH(e.endCoordinates.height))
    const hide = Keyboard.addListener('keyboardWillHide', () => setKeyboardH(0))
    return () => { show.remove(); hide.remove() }
  }, [])

  const [prevBatchCost, setPrevBatchCost] = useState('')
  const [targetCapital, setTargetCapital] = useState('')
  const [birdQty, setBirdQty] = useState('')
  const [prodDuration, setProdDuration] = useState('')

  const [alloc, setAlloc] = useState<Record<string, string>>({
    feed: '', medication: '', doc: '', workers: '',
    utilities: '', infrastructure: '', emergency: '',
  })

  const [recoveryPref, setRecoveryPref] = useState('Weekly')
  const [timelinePref, setTimelinePref] = useState('12 weeks')

  const [feedPriceInc, setFeedPriceInc] = useState('5')
  const [mortalityAllow, setMortalityAllow] = useState('3')
  const [emergencyBuffer, setEmergencyBuffer] = useState('10')

  const [focusedField, setFocusedField] = useState<string | null>(null)

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollInner,
            { paddingBottom: keyboardH > 0 ? keyboardH + 100 : 100 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── HERO SECTION ── */}
          <View style={[styles.heroSection, { paddingTop: insets.top + 20 }]}>
            <View style={styles.heroGlow} pointerEvents="none">
              <ExpoLinearGradient
                colors={['rgba(46,125,50,0.10)', 'transparent']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
              />
            </View>
            <View style={styles.heroOrb1} pointerEvents="none" />
            <View style={styles.heroOrb2} pointerEvents="none" />

            <TouchableOpacity style={styles.heroBack} activeOpacity={0.7} onPress={() => router.back()}>
              <BackIcon />
            </TouchableOpacity>

            <Animated.View entering={FadeInDown.duration(700).springify()}>
              <Text style={styles.heroPreTitle}>Capital Planning</Text>
              <Text style={styles.heroTitle}>Plan your{'\n'}Recapitalization</Text>
              <Text style={styles.heroSub}>
                AI-powered capital intelligence for your next production cycle.
              </Text>
            </Animated.View>
          </View>

          {/* ── FORECAST PREVIEW ── */}
          <Animated.View entering={FadeInUp.duration(700).delay(200).springify()} style={styles.forecastOuter}>
            <BlurView intensity={45} tint="light" style={styles.forecastBlur}>
              <ExpoLinearGradient
                colors={['rgba(255,255,255,0.85)', 'rgba(240,253,244,0.5)']}
                style={styles.forecastBg}
              >
                <View style={styles.forecastContent}>
                  <View style={styles.forecastCol}>
                    <View style={styles.forecastLabelRow}>
                      <PulseDot color="#2E7D32" />
                      <Text style={styles.forecastLabel}>Capital Readiness</Text>
                    </View>
                    <Text style={styles.forecastValue}>~11 weeks</Text>
                    <Text style={styles.forecastSub}>Based on current inputs</Text>
                  </View>
                  <View style={styles.forecastDivider} />
                  <View style={styles.forecastCol}>
                    <View style={styles.forecastLabelRow}>
                      <PulseDot color="#16A34A" />
                      <Text style={styles.forecastLabel}>Weekly Recovery</Text>
                    </View>
                    <Text style={styles.forecastValue}>₦108,000</Text>
                    <Text style={styles.forecastSub}>Estimated per cycle</Text>
                  </View>
                </View>
                <View style={styles.forecastGlow} pointerEvents="none" />
              </ExpoLinearGradient>
            </BlurView>
          </Animated.View>

          {/* ── PRODUCTION SETUP ── */}
          <Animated.View entering={FadeInUp.duration(700).delay(350).springify()}>
            <View style={styles.secHeadModern}>
              <View style={styles.secAccent} />
              <Text style={styles.secTitleModern}>Production Setup</Text>
            </View>
            <View style={styles.groupCard}>
              <View style={[styles.groupField, focusedField === 'birdQty' && styles.groupFieldFocused]}>
                <Text style={styles.groupFieldLabel}>Bird Quantity</Text>
                <View style={styles.groupFieldRow}>
                  <TextInput
                    style={styles.groupFieldInput}
                    value={birdQty}
                    onChangeText={setBirdQty}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#CBD5E1"
                    onFocus={() => setFocusedField('birdQty')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </View>
              <View style={[styles.groupField, styles.groupFieldLast, focusedField === 'prodDuration' && styles.groupFieldFocused]}>
                <Text style={styles.groupFieldLabel}>Production Duration</Text>
                <View style={styles.groupFieldRow}>
                  <TextInput
                    style={styles.groupFieldInput}
                    value={prodDuration}
                    onChangeText={setProdDuration}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#CBD5E1"
                    onFocus={() => setFocusedField('prodDuration')}
                    onBlur={() => setFocusedField(null)}
                  />
                  <Text style={styles.groupFieldSuffix}>weeks</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* ── CAPITAL PLANNING ── */}
          <Animated.View entering={FadeInUp.duration(700).delay(500).springify()}>
            <View style={styles.secHeadModern}>
              <View style={[styles.secAccent, { backgroundColor: '#2563EB' }]} />
              <Text style={styles.secTitleModern}>Capital Planning</Text>
            </View>
            <View style={styles.groupCard}>
              <View style={[styles.groupField, focusedField === 'prevBatchCost' && styles.groupFieldFocused]}>
                <Text style={styles.groupFieldLabel}>Previous Batch Cost</Text>
                <View style={styles.groupFieldRow}>
                  <Text style={styles.groupFieldPrefix}>₦</Text>
                  <TextInput
                    style={styles.groupFieldInput}
                    value={prevBatchCost}
                    onChangeText={setPrevBatchCost}
                    keyboardType="numeric"
                    placeholder="0.00"
                    placeholderTextColor="#CBD5E1"
                    onFocus={() => setFocusedField('prevBatchCost')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </View>
              <View style={[styles.groupField, styles.groupFieldLast, focusedField === 'targetCapital' && styles.groupFieldFocused]}>
                <Text style={styles.groupFieldLabel}>Target Capital</Text>
                <View style={styles.groupFieldRow}>
                  <Text style={styles.groupFieldPrefix}>₦</Text>
                  <TextInput
                    style={styles.groupFieldInput}
                    value={targetCapital}
                    onChangeText={setTargetCapital}
                    keyboardType="numeric"
                    placeholder="0.00"
                    placeholderTextColor="#CBD5E1"
                    onFocus={() => setFocusedField('targetCapital')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </View>
            </View>
          </Animated.View>

          {/* ── OPERATIONAL ALLOCATION ── */}
          <Animated.View entering={FadeInUp.duration(700).delay(650).springify()}>
            <View style={styles.secHeadModern}>
              <View style={[styles.secAccent, { backgroundColor: '#16A34A' }]} />
              <Text style={styles.secTitleModern}>Operational Allocation</Text>
            </View>
            <View style={styles.allocCard}>
              {ALLOCATION_ITEMS.map((item) => (
                <View key={item.key} style={styles.allocRow}>
                  <View style={styles.allocLeft}>
                    <View style={[styles.allocDot, { backgroundColor: item.color }]} />
                    <Text style={styles.allocLabel}>{item.label}</Text>
                  </View>
                  <View style={styles.allocInputGroup}>
                    <Text style={styles.allocPrefix}>₦</Text>
                    <TextInput
                      style={styles.allocInput}
                      value={alloc[item.key]}
                      onChangeText={(v) => setAlloc(prev => ({ ...prev, [item.key]: v }))}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="#CBD5E1"
                    />
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* ── RECOVERY PREFERENCE ── */}
          <View style={styles.secHead}>
            <Text style={styles.secTitle}>Recovery Preference</Text>
          </View>
          <SegmentedControl options={RECOVERY_OPTIONS} selected={recoveryPref} onSelect={setRecoveryPref} />

          {/* ── TIMELINE PREFERENCE ── */}
          <View style={styles.secHead}>
            <Text style={styles.secTitle}>Timeline Preference</Text>
          </View>
          <SegmentedControl options={TIMELINE_OPTIONS} selected={timelinePref} onSelect={setTimelinePref} />

          {/* ── PLANNING ASSUMPTIONS ── */}
          <View style={styles.secHead}>
            <Text style={styles.secTitle}>Planning Assumptions</Text>
          </View>
          <View style={styles.assumptionsCard}>
            <View style={styles.assumptionRow}>
              <Text style={styles.assumptionLabel}>Feed Price Increase</Text>
              <View style={styles.assumptionInputGroup}>
                <TextInput
                  style={styles.assumptionInput}
                  value={feedPriceInc}
                  onChangeText={setFeedPriceInc}
                  keyboardType="numeric"
                  placeholder="5"
                  placeholderTextColor="#CBD5E1"
                />
                <Text style={styles.assumptionSuffix}>%</Text>
              </View>
            </View>
            <View style={styles.assumptionRow}>
              <Text style={styles.assumptionLabel}>Mortality Allowance</Text>
              <View style={styles.assumptionInputGroup}>
                <TextInput
                  style={styles.assumptionInput}
                  value={mortalityAllow}
                  onChangeText={setMortalityAllow}
                  keyboardType="numeric"
                  placeholder="3"
                  placeholderTextColor="#CBD5E1"
                />
                <Text style={styles.assumptionSuffix}>%</Text>
              </View>
            </View>
            <View style={styles.assumptionRow}>
              <Text style={styles.assumptionLabel}>Emergency Buffer</Text>
              <View style={styles.assumptionInputGroup}>
                <TextInput
                  style={styles.assumptionInput}
                  value={emergencyBuffer}
                  onChangeText={setEmergencyBuffer}
                  keyboardType="numeric"
                  placeholder="10"
                  placeholderTextColor="#CBD5E1"
                />
                <Text style={styles.assumptionSuffix}>%</Text>
              </View>
            </View>
          </View>

          {/* ── ACTION AREA ── */}
          <View style={styles.actionArea}>
            <TouchableOpacity style={styles.btnPrimary} activeOpacity={0.85}>
              <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <Circle cx="10" cy="10" r="6" stroke="white" strokeWidth="1.5" fill="none" />
                <Path d="M7 10L9 12L13 8" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </Svg>
              <Text style={styles.btnPrimaryText}>Generate Plan</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnSecondary} activeOpacity={0.85}>
              <Svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <Path d="M5 13H14" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
                <Rect x="5" y="4" width="8" height="10" rx="1.5" stroke="#94A3B8" strokeWidth="1.5" fill="none" />
                <Path d="M5 7L13 7" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
              </Svg>
              <Text style={styles.btnSecondaryText}>Save Draft</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomDock hidden={keyboardH > 0} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAF7' },

  /* SCROLL */
  scroll: { flex: 1 },
  scrollInner: { paddingHorizontal: 0, paddingTop: 0, paddingBottom: 20 },

  /* ── HERO ── */
  heroSection: {
    paddingHorizontal: 20, paddingBottom: 4,
    position: 'relative', overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: 280,
  },
  heroOrb1: {
    position: 'absolute', top: -30, right: -50,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(46,125,50,0.04)',
  },
  heroOrb2: {
    position: 'absolute', top: 70, left: -40,
    width: 130, height: 130, borderRadius: 65,
    backgroundColor: 'rgba(37,99,235,0.03)',
  },
  heroBack: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'white', alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 14, elevation: 3,
  },
  heroPreTitle: {
    fontSize: 12, fontWeight: '600', color: '#2E7D32',
    letterSpacing: 1.4, marginBottom: 8,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 30, fontWeight: '800', color: '#1B1B1B',
    lineHeight: 37,
  },
  heroSub: {
    fontSize: 14, color: '#94A3B8', lineHeight: 22,
    marginTop: 12, maxWidth: '90%',
  },

  /* ── FORECAST ── */
  forecastOuter: {
    marginHorizontal: 20, marginTop: 16,
    borderRadius: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06, shadowRadius: 28, elevation: 4,
  },
  forecastBlur: {
    borderRadius: 24, overflow: 'hidden',
  },
  forecastBg: {
    padding: 18, position: 'relative',
  },
  forecastContent: {
    flexDirection: 'row', alignItems: 'center',
  },
  forecastCol: { flex: 1 },
  forecastLabelRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: 4,
  },
  forecastLabel: { fontSize: 11, fontWeight: '500', color: '#64748B' },
  forecastValue: {
    fontSize: 20, fontWeight: '800', color: '#1B1B1B',
    marginBottom: 2,
  },
  forecastSub: { fontSize: 11, color: '#94A3B8' },
  forecastDivider: {
    width: 1, height: 44,
    backgroundColor: '#E2E8F0', marginHorizontal: 16,
  },
  forecastGlow: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 60,
    backgroundColor: 'rgba(46,125,50,0.02)',
  },

  /* ── SECTION HEADERS (MODERN) ── */
  secHeadModern: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 28, marginBottom: 12, paddingHorizontal: 20,
  },
  secAccent: {
    width: 3, height: 16, borderRadius: 2,
    backgroundColor: '#2E7D32',
  },
  secTitleModern: {
    fontSize: 15, fontWeight: '700', color: '#1B1B1B',
  },

  /* ── GROUP CARD ── */
  groupCard: {
    backgroundColor: 'white', marginHorizontal: 20,
    borderRadius: 24, padding: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05, shadowRadius: 24, elevation: 3,
  },
  groupField: {
    paddingVertical: 14, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  groupFieldLast: { borderBottomWidth: 0 },
  groupFieldFocused: {
    borderBottomColor: 'rgba(46,125,50,0.15)',
    backgroundColor: 'rgba(240,253,244,0.3)',
  },
  groupFieldLabel: {
    fontSize: 12, fontWeight: '500', color: '#94A3B8',
    marginBottom: 6,
  },
  groupFieldRow: {
    flexDirection: 'row', alignItems: 'center',
  },
  groupFieldPrefix: {
    fontSize: 17, fontWeight: '700', color: '#94A3B8',
    marginRight: 8,
  },
  groupFieldInput: {
    flex: 1, fontSize: 17, fontWeight: '700', color: '#1F2937',
    paddingVertical: 2,
  },
  groupFieldSuffix: {
    fontSize: 13, fontWeight: '500', color: '#94A3B8',
    marginLeft: 6,
  },

  /* ── SECTION HEADERS (LEGACY) ── */
  secHead: { marginTop: 20, marginBottom: 10, paddingHorizontal: 20 },
  secTitle: { fontSize: 17, fontWeight: '700', color: '#1B1B1B' },

  /* ── OPERATIONAL ALLOCATION ── */
  allocCard: {
    backgroundColor: 'white', marginHorizontal: 20,
    borderRadius: 24, padding: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05, shadowRadius: 24, elevation: 3,
  },
  allocRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  allocLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  allocDot: { width: 8, height: 8, borderRadius: 4 },
  allocLabel: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  allocInputGroup: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8FAF7', borderRadius: 12, paddingHorizontal: 12, height: 40,
    minWidth: 120,
  },
  allocPrefix: { fontSize: 14, fontWeight: '600', color: '#94A3B8', marginRight: 4 },
  allocInput: {
    flex: 1, fontSize: 15, fontWeight: '600', color: '#1F2937',
    paddingVertical: 0, textAlign: 'right',
  },

  /* ── SEGMENTED CONTROL ── */
  segWrap: {
    flexDirection: 'row', backgroundColor: '#F1F5F9',
    borderRadius: 14, padding: 3, marginHorizontal: 20,
  },
  segBtn: {
    flex: 1, paddingVertical: 10, alignItems: 'center', justifyContent: 'center',
    borderRadius: 12,
  },
  segBtnActive: {
    backgroundColor: 'white',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  segBtnText: { fontSize: 13, fontWeight: '500', color: '#94A3B8' },
  segBtnTextActive: { fontWeight: '700', color: '#2E7D32' },

  /* ── PLANNING ASSUMPTIONS ── */
  assumptionsCard: {
    backgroundColor: 'white', marginHorizontal: 20,
    borderRadius: 24, padding: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05, shadowRadius: 24, elevation: 3,
  },
  assumptionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  assumptionLabel: { fontSize: 14, fontWeight: '500', color: '#1F2937', flex: 1 },
  assumptionInputGroup: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8FAF7', borderRadius: 12, paddingHorizontal: 12, height: 42,
    minWidth: 80, justifyContent: 'flex-end',
  },
  assumptionInput: {
    fontSize: 15, fontWeight: '600', color: '#1F2937',
    paddingVertical: 0, textAlign: 'right', minWidth: 40,
  },
  assumptionSuffix: { fontSize: 13, fontWeight: '600', color: '#94A3B8', marginLeft: 4 },

  /* ── ACTION AREA ── */
  actionArea: { marginTop: 24, gap: 10, paddingBottom: 8, paddingHorizontal: 20 },
  btnPrimary: {
    height: 54, borderRadius: 18, backgroundColor: '#2E7D32',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3, shadowRadius: 30, elevation: 6,
  },
  btnPrimaryText: { fontSize: 16, fontWeight: '700', color: 'white' },
  btnSecondary: {
    height: 50, borderRadius: 16, borderWidth: 1.5, borderColor: '#E2E8F0',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: 'white',
  },
  btnSecondaryText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
})


