import React, { useRef, useEffect, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView,
  Animated, Platform, StatusBar, Keyboard } from 'react-native'
import Svg, { Path, Line, Rect, Circle, Defs, RadialGradient, Stop } from 'react-native-svg'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import { router } from 'expo-router'
import AnimatedReanimated, {
  useSharedValue, useAnimatedStyle, withDelay, withTiming,
  withSpring, Easing,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import BottomDock from '../../components/navigation/BottomDock'

/* ── HOOKS ── */
function useStaggerEntry(index: number, baseDelay = 100) {
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(20)
  useEffect(() => {
    const delay = baseDelay + index * 70
    opacity.value = withDelay(delay, withTiming(1, { duration: 450, easing: Easing.out(Easing.cubic) }))
    translateY.value = withDelay(delay, withSpring(0, { damping: 17, stiffness: 130 }))
  }, [])
  return useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: translateY.value }] }))
}

function usePressScale() {
  const scale = useSharedValue(1)
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
  return { style, onPressIn: () => { scale.value = withSpring(0.97, { damping: 15, stiffness: 200 }) }, onPressOut: () => { scale.value = withSpring(1, { damping: 15, stiffness: 200 }) } }
}

/* ── ICONS ── */
function FilterIcon() {
  return (<Svg width="16" height="16" viewBox="0 0 16 16" fill="none"><Path d="M2.5 4.5H13.5" stroke="#1F2937" strokeWidth="1.4" strokeLinecap="round" /><Path d="M5.5 8H10.5" stroke="#1F2937" strokeWidth="1.4" strokeLinecap="round" /><Path d="M7.5 11.5H8.5" stroke="#1F2937" strokeWidth="1.4" strokeLinecap="round" /></Svg>)
}
function PlusIcon() {
  return (<Svg width="18" height="18" viewBox="0 0 18 18" fill="none"><Line x1="9" y1="4.5" x2="9" y2="13.5" stroke="#1B4332" strokeWidth="1.8" strokeLinecap="round" /><Line x1="4.5" y1="9" x2="13.5" y2="9" stroke="#1B4332" strokeWidth="1.8" strokeLinecap="round" /></Svg>)
}
function SendIcon() {
  return (<Svg width="16" height="16" viewBox="0 0 16 16" fill="none"><Path d="M3 8L13.5 2.5L10 13.5L7 9L3 8Z" stroke="#1B4332" strokeWidth="1.5" strokeLinejoin="round" /></Svg>)
}
function LockIconSm() {
  return (<Svg width="10" height="10" viewBox="0 0 10 10" fill="none"><Rect x="2" y="4" width="6" height="4" rx="0.8" stroke="#94A3B8" strokeWidth="0.8" fill="none" /><Path d="M3.5 4V3.2C3.5 2.8 4 2.5 5 2.5C6 2.5 6.5 2.8 6.5 3.2V4" stroke="#94A3B8" strokeWidth="0.8" fill="none" /></Svg>)
}

const CHIPS = ['+ Feed', '+ Medication', '+ Mortality', '+ Weight', '+ Note']

const INSIGHT = {
  headline: 'Mortality rate is 1.2% better than last batch 👏',
  sub: 'Feeding consistency and temperature stability improved flock health this week.',
  bars: [0.30, 0.40, 0.35, 0.50, 0.55, 0.65, 0.80, 0.75, 0.90, 1.00],
}

/* ── CARD ── */
function Card({ index, dotColor = '#2E7D32', children }: { index: number; dotColor?: string; children: React.ReactNode }) {
  const animStyle = useStaggerEntry(index)
  const { style: pressStyle, onPressIn, onPressOut } = usePressScale()
  return (
    <AnimatedReanimated.View style={[animStyle, pressStyle, { marginBottom: 18 }]} onTouchStart={onPressIn} onTouchEnd={onPressOut}>
      <View style={{ backgroundColor: 'white', borderRadius: 28, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.06, shadowRadius: 35, elevation: 3, position: 'relative' }}>
        <View style={{ position: 'absolute', left: 0, top: 28, bottom: -18, width: 2, backgroundColor: '#E8ECEE' }} />
        <View style={{ position: 'absolute', left: -7, top: 28, width: 8, height: 8, borderRadius: 4, backgroundColor: dotColor, borderWidth: 2, borderColor: '#F8F9F5' }} />
        {children}
      </View>
    </AnimatedReanimated.View>
  )
}

/* ── MAIN ── */
export default function FarmFeedScreen() {
  const pulse = useRef(new Animated.Value(1)).current
  const [composer, setComposer] = useState('')
  const [keyboardH, setKeyboardH] = useState(0)
  const insets = useSafeAreaInsets()

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.2, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    )
    pulseLoop.start()
    const showSub = Keyboard.addListener('keyboardWillShow', e => setKeyboardH(e.endCoordinates.height))
    const hideSub = Keyboard.addListener('keyboardWillHide', () => setKeyboardH(0))
    return () => { pulseLoop.stop(); showSub.remove(); hideSub.remove() }
  }, [])

  const TOP_BAR = 52
  const SCROLL_TOP = insets.top + TOP_BAR
  const BATCH_TOP = insets.top + TOP_BAR + 2
  const NAV_H = 64
  const composerBottom = keyboardH > 0 ? keyboardH + 4 : 100

  return (
    <View style={{ flex: 1, backgroundColor: '#F8F9F5' }}>
      <StatusBar barStyle="dark-content" />

      {/* BACKGROUND */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} pointerEvents="none">
        <Svg width="100%" height="100%" style={{ position: 'absolute' }}>
          <Defs>
            <RadialGradient id="r1" cx="0.2" cy="0.08" r="0.55">
              <Stop offset="0" stopColor="#E8F5E9" stopOpacity="0.35" />
              <Stop offset="1" stopColor="#E8F5E9" stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="r2" cx="0.9" cy="0.92" r="0.5">
              <Stop offset="0" stopColor="#E0F2EF" stopOpacity="0.2" />
              <Stop offset="1" stopColor="#E0F2EF" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#r1)" />
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#r2)" />
        </Svg>
        <View style={{ position: 'absolute', top: 80, left: -24, width: 320, height: 100, borderRadius: 200, borderWidth: 1, borderColor: 'rgba(46,125,50,0.05)', transform: [{ rotate: '6deg' }], borderBottomWidth: 0 }} />
        <View style={{ position: 'absolute', bottom: 80, right: -30, width: 250, height: 80, borderRadius: 200, borderWidth: 1, borderColor: 'rgba(46,125,50,0.04)', transform: [{ rotate: '-8deg' }], borderTopWidth: 0 }} />
        <View style={{ position: 'absolute', top: -60, right: -60, width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(232,245,233,0.25)' }} />
      </View>

      {/* SCROLL */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: SCROLL_TOP + 52, paddingBottom: keyboardH > 0 ? keyboardH + 100 : 200, paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* INSIGHT */}
        <AnimatedReanimated.View style={useStaggerEntry(0)}>
          <LinearGradient colors={['#2E7D32', '#43A047']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 28, padding: 22, marginBottom: 18, overflow: 'hidden', shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.20, shadowRadius: 35, elevation: 6 }}>
            <View style={{ position: 'absolute', top: -20, right: -20, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.06)' }} pointerEvents="none" />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 17, fontWeight: '700', color: 'white', flex: 1 }}>{INSIGHT.headline}</Text>
              <Svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0, marginLeft: 10 }}>
                <Path d="M10 3L8.5 7.5L4 9L8.5 10.5L10 15L11.5 10.5L16 9L11.5 7.5L10 3Z" fill="rgba(255,255,255,0.3)" stroke="white" strokeWidth="1.3" strokeLinejoin="round" />
              </Svg>
            </View>
            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 6, lineHeight: 20 }}>{INSIGHT.sub}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 32, marginTop: 14 }}>
              {INSIGHT.bars.map((h: number, i: number) => (
                <View key={i} style={{ flex: 1, borderRadius: 3, backgroundColor: h >= 0.55 ? '#AEEA00' : 'rgba(255,255,255,0.15)', height: `${h * 100}%` as any, minHeight: 4 }} />
              ))}
            </View>
          </LinearGradient>
        </AnimatedReanimated.View>

        {/* SYSTEM LOG */}
        <Card index={1}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: '#94A3B8' }}>10:32 AM</Text>
            <View style={{ paddingVertical: 3, paddingHorizontal: 10, borderRadius: 100, backgroundColor: '#DDF5F0' }}>
              <Text style={{ fontSize: 10, fontWeight: '600', color: '#0F766E' }}>System Log</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginTop: 14 }}>
            <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: '#DDF5F0', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none"><Rect x="5" y="5" width="14" height="14" rx="3" stroke="#0F766E" strokeWidth="1.6" fill="none" /><Path d="M9 5V4C9 3 9.5 2.5 12 2.5C14.5 2.5 15 3 15 4V5" stroke="#0F766E" strokeWidth="1.6" fill="none" /><Line x1="9" y1="10" x2="15" y2="10" stroke="#0F766E" strokeWidth="1.4" strokeLinecap="round" /></Svg>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#1F2937' }}>15 bags of Topfeed Grower added</Text>
              <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 2 }}>Quantity: 45kg • Cost: ₦28,500</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 }}>
                <LockIconSm />
                <Text style={{ fontSize: 12, color: '#94A3B8' }}>Cannot be edited</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* WORKER POST */}
        <Card index={2} dotColor="#16A34A">
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: '#94A3B8' }}>just now</Text>
            <View style={{ paddingVertical: 3, paddingHorizontal: 10, borderRadius: 100, backgroundColor: '#E8F5E9' }}>
              <Text style={{ fontSize: 10, fontWeight: '600', color: '#2E7D32' }}>Worker Post</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14 }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#D4A574', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: 'white' }}>CN</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#1F2937' }}>Chinedu</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ paddingVertical: 1, paddingHorizontal: 8, borderRadius: 100, backgroundColor: '#E8F5E9' }}>
                  <Text style={{ fontSize: 9, fontWeight: '500', color: '#2E7D32' }}>Feed Supervisor</Text>
                </View>
                <Text style={{ fontSize: 12, color: '#94A3B8' }}>• just now</Text>
              </View>
            </View>
          </View>
          <Text style={{ fontSize: 15, color: '#374151', lineHeight: 22, marginTop: 12 }}>Morning feeding completed. All birds active ✅</Text>
          <View style={{ width: '100%', height: 160, borderRadius: 22, marginTop: 12, backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <Text style={{ fontSize: 40 }}>🐓🌿</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' }}>
            {['❤️ 4', '👍 2', '💬 1'].map((r, i) => (
              <TouchableOpacity key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }} activeOpacity={0.7}>
                <Text style={{ fontSize: 13, color: '#64748B', fontWeight: '500' }}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* ALERT */}
        <Card index={3} dotColor="#EF4444">
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: '#94A3B8' }}>8:15 AM</Text>
            <View style={{ paddingVertical: 3, paddingHorizontal: 10, borderRadius: 100, backgroundColor: '#FFF1F2' }}>
              <Text style={{ fontSize: 10, fontWeight: '600', color: '#DC2626' }}>Alert</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 12 }}>
            <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: '#FFF1F2', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Svg width="18" height="18" viewBox="0 0 18 18" fill="none"><Circle cx="9" cy="9" r="6" stroke="#EF4444" strokeWidth="1.5" fill="none" /><Line x1="9" y1="6" x2="9" y2="10" stroke="#EF4444" strokeWidth="1.3" strokeLinecap="round" /><Circle cx="9" cy="12.5" r="0.6" fill="#EF4444" /></Svg>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#DC2626' }}>3 mortalities reported</Text>
              <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 2 }}>Possible heat stress — temperature spiked overnight</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            {[{ label: 'Investigate', bg: '#F0FDF4', text: '#16A34A', border: '#DCFCE7' }, { label: 'Assign Vet', bg: '#EEF3FF', text: '#1A56FF', border: '#DBEAFE' }, { label: 'Add Note', bg: '#F8FAF7', text: '#64748B', border: '#E2E8F0' }].map((a, i) => (
              <TouchableOpacity key={i} style={{ paddingVertical: 7, paddingHorizontal: 16, borderRadius: 100, backgroundColor: a.bg, borderWidth: 1, borderColor: a.border }} activeOpacity={0.7}>
                <Text style={{ fontSize: 12, fontWeight: '500', color: a.text }}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* MEDIA GRID */}
        <Card index={4} dotColor="#F59E0B">
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: '#94A3B8' }}>Yesterday, 4:20 PM</Text>
            <View style={{ paddingVertical: 3, paddingHorizontal: 10, borderRadius: 100, backgroundColor: '#FFFBEB' }}>
              <Text style={{ fontSize: 10, fontWeight: '600', color: '#F59E0B' }}>Media</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <View style={{ width: '48%', aspectRatio: 0.7, borderRadius: 18, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' }}>
              <Text style={{ fontSize: 28 }}>🐓</Text>
            </View>
            <View style={{ width: '48%', gap: 8 }}>
              <View style={{ flex: 1, borderRadius: 18, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' }}>
                <Text style={{ fontSize: 28 }}>🌾</Text>
              </View>
              <View style={{ flex: 1, borderRadius: 18, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' }}>
                <Text style={{ fontSize: 28 }}>📋</Text>
              </View>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 }}>
            <Svg width="12" height="12" viewBox="0 0 12 12" fill="none"><Path d="M2 8L4 5L6 7L10 3" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></Svg>
            <Text style={{ fontSize: 10, fontWeight: '500', color: '#94A3B8' }}>Camera Upload • Worker Submission</Text>
          </View>
        </Card>

        {/* SYSTEM LOG 2 */}
        <Card index={5} dotColor="#1A56FF">
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: '#94A3B8' }}>Yesterday, 2:15 PM</Text>
            <View style={{ paddingVertical: 3, paddingHorizontal: 10, borderRadius: 100, backgroundColor: '#DDF5F0' }}>
              <Text style={{ fontSize: 10, fontWeight: '600', color: '#0F766E' }}>System Log</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginTop: 14 }}>
            <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: '#EEF3FF', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none"><Rect x="6" y="4" width="12" height="16" rx="2" stroke="#1A56FF" strokeWidth="1.6" fill="none" /><Line x1="9" y1="9" x2="15" y2="9" stroke="#1A56FF" strokeWidth="1.4" strokeLinecap="round" /><Line x1="9" y1="13" x2="13" y2="13" stroke="#1A56FF" strokeWidth="1.4" strokeLinecap="round" /></Svg>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#1F2937' }}>Vaccination recorded for Batch A-392</Text>
              <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 2 }}>Newcastle vaccine — 241 doses administered</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 }}>
                <LockIconSm />
                <Text style={{ fontSize: 12, color: '#94A3B8' }}>Immutable record</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* WEIGHT CHECK */}
        <Card index={6} dotColor="#8B5CF6">
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: '#94A3B8' }}>Yesterday, 10:00 AM</Text>
            <View style={{ paddingVertical: 3, paddingHorizontal: 10, borderRadius: 100, backgroundColor: '#F3E8FF' }}>
              <Text style={{ fontSize: 10, fontWeight: '600', color: '#7C3AED' }}>Weight Check</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginTop: 14 }}>
            <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: '#F3E8FF', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none"><Path d="M5 20H19" stroke="#7C3AED" strokeWidth="1.6" strokeLinecap="round" /><Rect x="8" y="6" width="8" height="14" rx="2" stroke="#7C3AED" strokeWidth="1.6" fill="none" /></Svg>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#1F2937' }}>Sampled weight: 1.84 kg avg</Text>
              <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 2 }}>20 birds sampled • Growth rate +6% vs target</Text>
            </View>
          </View>
        </Card>
      </ScrollView>

      {/* ── APP BAR ── */}
      <BlurView intensity={45} tint="light" style={{ position: 'absolute', top: insets.top, left: 0, right: 0, height: TOP_BAR, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.04)', zIndex: 5 }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity style={{ width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }} activeOpacity={0.7} onPress={() => router.back()}>
              <Svg width="22" height="22" viewBox="0 0 22 22" fill="none"><Path d="M14 17L9 11L14 5" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></Svg>
            </TouchableOpacity>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#1F2937' }}>Farm Feed</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.8)', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 }}>
              <FilterIcon />
            </View>
            <TouchableOpacity style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#AEEA00', alignItems: 'center', justifyContent: 'center', shadowColor: '#AEEA00', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.35, shadowRadius: 30, elevation: 4 }} activeOpacity={0.8}>
              <PlusIcon />
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>

      {/* ── BATCH HEADER ── */}
      <View style={{ position: 'absolute', top: BATCH_TOP, left: 16, right: 16, zIndex: 4, backgroundColor: '#E0F2EF', borderRadius: 20, paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 14, elevation: 2 }}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <Text numberOfLines={1} ellipsizeMode="tail" style={{ fontSize: 14, fontWeight: '700', color: '#1B4332' }}>Cobb 500 Broilers • Batch #A-392</Text>
          <Text style={{ fontSize: 10, fontWeight: '400', color: '#0F766E', marginTop: 1 }}>Production Cycle Active</Text>
        </View>
        <View style={{ flexShrink: 0, alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#1B4332' }}>Day 18 • 241 Birds</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2, justifyContent: 'flex-end' }}>
            <Animated.View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#2E7D32', opacity: pulse }} />
            <Text style={{ fontSize: 10, fontWeight: '500', color: '#2E7D32' }}>Live</Text>
          </View>
        </View>
      </View>

      {/* ── COMPOSER ── */}
      <BlurView intensity={55} tint="light" style={{ position: 'absolute', bottom: composerBottom, left: 0, right: 0, zIndex: 5, paddingVertical: 10, paddingHorizontal: 16, paddingBottom: 6, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.04)' }}>
        <AnimatedReanimated.View style={useStaggerEntry(8)}>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 26, padding: 3, paddingLeft: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 20, elevation: 3, borderWidth: 1, borderColor: '#EEF2F7' }}>
            <TextInput
              style={{ flex: 1, fontSize: 14, color: '#1B1B1B', paddingVertical: 8 }}
              placeholder="What happened on the farm?"
              placeholderTextColor="#A0AEA1"
              value={composer}
              onChangeText={setComposer}
            />
            <TouchableOpacity
              style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#AEEA00', alignItems: 'center', justifyContent: 'center', shadowColor: '#AEEA00', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.30, shadowRadius: 20, elevation: 4 }}
              activeOpacity={0.8}
              onPress={() => setComposer('')}
            >
              <SendIcon />
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginTop: 6, paddingLeft: 2 }} style={{ overflow: 'visible' }}>
            {CHIPS.map((chip) => (
              <TouchableOpacity key={chip} style={{ paddingVertical: 4, paddingHorizontal: 12, borderRadius: 100, backgroundColor: 'white', borderWidth: 1, borderColor: '#E2E8F0' }} activeOpacity={0.7}>
                <Text style={{ fontSize: 11, fontWeight: '500', color: '#64748B' }}>{chip}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </AnimatedReanimated.View>
      </BlurView>

      <BottomDock hidden={keyboardH > 0} />
    </View>
  )
}


