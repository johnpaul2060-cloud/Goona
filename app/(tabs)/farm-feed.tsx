import React, { useRef, useEffect, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView,
  Animated, Platform, StatusBar, Keyboard, Image } from 'react-native'
import Svg, { Rect, Defs, RadialGradient, Stop } from 'react-native-svg'
import GoonaIcon from '../../components/ui/GoonaIcon'
import { ArrowLeft, Send, Lock, Sparkles, FileText, AlertCircle, Check, Activity, Camera, Mic, AlertTriangle, Users, Bell, ChevronRight, Clock, MapPin, Paperclip, X } from 'lucide-react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import { router } from 'expo-router'
import AnimatedReanimated, {
  useSharedValue, useAnimatedStyle, withDelay, withTiming,
  withSpring, Easing,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import BottomDock from '../../components/navigation/BottomDock'
import * as ImagePicker from 'expo-image-picker'
import { Audio } from 'expo-av'
import * as Location from 'expo-location'
import * as DocumentPicker from 'expo-document-picker'

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
  const [sosOpen, setSosOpen] = useState(false)
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [audioUri, setAudioUri] = useState<string | null>(null)
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [document, setDocument] = useState<{ name: string; uri: string } | null>(null)
  const recordingRef = useRef<Audio.Recording | null>(null)
  const insets = useSafeAreaInsets()

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.2, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    )
    pulseLoop.start()
    const eventShow = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow'
    const eventHide = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide'
    const showSub = Keyboard.addListener(eventShow, e => setKeyboardH(e.endCoordinates.height))
    const hideSub = Keyboard.addListener(eventHide, () => setKeyboardH(0))
    return () => { pulseLoop.stop(); showSub.remove(); hideSub.remove() }
  }, [])

  const TOP_BAR = 52
  const SCROLL_TOP = insets.top + TOP_BAR
  const NAV_H = 64
  const TAB_H = 76
  const composerBottom = keyboardH > 0 ? keyboardH + 4 : insets.bottom + TAB_H + 20

  async function handleCamera() {
    console.log('Camera pressed')
    const perm = await ImagePicker.requestCameraPermissionsAsync()
    if (!perm.granted) return
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8, mediaTypes: ['images'] })
    if (!result.canceled) {
      setImageUri(result.assets[0].uri)
      console.log('Image captured:', result.assets[0].uri)
    }
  }

  async function handleVoice() {
    console.log('Voice pressed')
    if (isRecording) {
      console.log('Stopping recording...')
      try {
        await recordingRef.current?.stopAndUnloadAsync()
        const uri = recordingRef.current?.getURI()
        if (uri) setAudioUri(uri)
        console.log('Recording saved:', uri)
      } catch (e) {
        console.log('Stop error:', e)
      }
      recordingRef.current = null
      setIsRecording(false)
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: false })
      return
    }
    if (recordingRef.current) {
      try { await recordingRef.current.stopAndUnloadAsync() } catch (_) {}
      recordingRef.current = null
    }
    const perm = await Audio.requestPermissionsAsync()
    if (!perm.granted) { console.log('Permission denied'); return }
    console.log('Permission granted')
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
      interruptionModeIOS: 0,
      interruptionModeAndroid: 1,
    })
    console.log('Audio mode configured')
    try {
      const { recording } = await Audio.Recording.createAsync()
      recordingRef.current = recording
      setIsRecording(true)
      console.log('Recording started')
    } catch (e) {
      console.log('Recording create error:', e)
      recordingRef.current = null
    }
  }

  async function handleLocation() {
    console.log('Location pressed')
    const perm = await Location.requestForegroundPermissionsAsync()
    if (!perm.granted) return
    const loc = await Location.getCurrentPositionAsync({})
    setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude })
    console.log('Location set:', loc.coords.latitude, loc.coords.longitude)
  }

  async function handleDocument() {
    console.log('Attachment pressed')
    const result = await DocumentPicker.getDocumentAsync({ type: '*/*' })
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setDocument({ name: result.assets[0].name, uri: result.assets[0].uri })
      console.log('Document attached:', result.assets[0].name)
    }
  }

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
        {/* ── AI SUMMARY ── */}
        <AnimatedReanimated.View style={useStaggerEntry(0)}>
          <LinearGradient colors={['#2E7D32', '#1B5E20']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 20, padding: 16, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 4 }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}>
              <GoonaIcon icon={Sparkles} size={18} color="#AEEA00" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.85)', lineHeight: 18 }}>
                Feeding completed. No mortality reported today.
              </Text>
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 3 }}>GOONA IQ • 2 min ago</Text>
            </View>
            <ChevronRight size={16} color="rgba(255,255,255,0.4)" />
          </LinearGradient>
        </AnimatedReanimated.View>

        {/* ── STATUS STRIP ── */}
        <AnimatedReanimated.View style={[useStaggerEntry(1), { flexDirection: 'row', gap: 8, marginBottom: 18 }]}>
          {[
            { icon: Users, label: 'Workers Online', value: '6', color: '#2E7D32', bg: '#F0FDF4' },
            { icon: Clock, label: 'Updates Today', value: '12', color: '#0F766E', bg: '#DDF5F0' },
            { icon: Bell, label: 'Alerts', value: '2', color: '#DC2626', bg: '#FFF1F2' },
            { icon: Check, label: 'Active Batch', value: '#A-392', color: '#1A56FF', bg: '#EEF3FF' },
          ].map((item, i) => (
            <View key={i} style={{ flex: 1, backgroundColor: item.bg, borderRadius: 14, padding: 10, alignItems: 'center', gap: 4 }}>
              <GoonaIcon icon={item.icon} size={14} color={item.color} />
              <Text style={{ fontSize: 14, fontWeight: '800', color: item.color }}>{item.value}</Text>
              <Text style={{ fontSize: 9, fontWeight: '500', color: item.color, opacity: 0.7, textAlign: 'center' }}>{item.label}</Text>
            </View>
          ))}
        </AnimatedReanimated.View>

        {/* SYSTEM LOG */}
        <Card index={2}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: '#94A3B8' }}>10:32 AM</Text>
            <View style={{ paddingVertical: 3, paddingHorizontal: 10, borderRadius: 100, backgroundColor: '#DDF5F0' }}>
              <Text style={{ fontSize: 10, fontWeight: '600', color: '#0F766E' }}>System Log</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginTop: 14 }}>
            <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: '#DDF5F0', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <GoonaIcon icon={FileText} size={24} color="#0F766E" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#1F2937' }}>15 bags of Topfeed Grower added</Text>
              <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 2 }}>Quantity: 45kg • Cost: ₦28,500</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 }}>
                <GoonaIcon icon={Lock} size={10} color="#94A3B8" />
                <Text style={{ fontSize: 12, color: '#94A3B8' }}>Cannot be edited</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* WORKER POST */}
        <Card index={3} dotColor="#16A34A">
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
        <Card index={4} dotColor="#EF4444">
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: '#94A3B8' }}>8:15 AM</Text>
            <View style={{ paddingVertical: 3, paddingHorizontal: 10, borderRadius: 100, backgroundColor: '#FFF1F2' }}>
              <Text style={{ fontSize: 10, fontWeight: '600', color: '#DC2626' }}>Alert</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 12 }}>
            <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: '#FFF1F2', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <GoonaIcon icon={AlertCircle} size={18} color="#EF4444" />
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
        <Card index={5} dotColor="#F59E0B">
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
            <GoonaIcon icon={Check} size={12} color="#94A3B8" />
            <Text style={{ fontSize: 10, fontWeight: '500', color: '#94A3B8' }}>Camera Upload • Worker Submission</Text>
          </View>
        </Card>

        {/* SYSTEM LOG 2 */}
        <Card index={6} dotColor="#1A56FF">
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: '#94A3B8' }}>Yesterday, 2:15 PM</Text>
            <View style={{ paddingVertical: 3, paddingHorizontal: 10, borderRadius: 100, backgroundColor: '#DDF5F0' }}>
              <Text style={{ fontSize: 10, fontWeight: '600', color: '#0F766E' }}>System Log</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginTop: 14 }}>
            <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: '#EEF3FF', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <GoonaIcon icon={FileText} size={24} color="#1A56FF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#1F2937' }}>Vaccination recorded for Batch A-392</Text>
              <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 2 }}>Newcastle vaccine — 241 doses administered</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 }}>
                <GoonaIcon icon={Lock} size={10} color="#94A3B8" />
                <Text style={{ fontSize: 12, color: '#94A3B8' }}>Immutable record</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* WEIGHT CHECK */}
        <Card index={7} dotColor="#8B5CF6">
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: '#94A3B8' }}>Yesterday, 10:00 AM</Text>
            <View style={{ paddingVertical: 3, paddingHorizontal: 10, borderRadius: 100, backgroundColor: '#F3E8FF' }}>
              <Text style={{ fontSize: 10, fontWeight: '600', color: '#7C3AED' }}>Weight Check</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginTop: 14 }}>
            <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: '#F3E8FF', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <GoonaIcon icon={Activity} size={24} color="#7C3AED" />
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
              <GoonaIcon icon={ArrowLeft} size={22} color="#1F2937" />
            </TouchableOpacity>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#1F2937' }}>Farm Feed</Text>
          </View>
        </View>
      </BlurView>

      {/* ── SOS OPTIONS ── */}
      {sosOpen && (
        <View style={{ position: 'absolute', bottom: composerBottom + 120, left: 16, right: 16, zIndex: 20 }}>
          <TouchableOpacity style={{ position: 'absolute', top: -400, left: -16, right: -16, bottom: -100 }} activeOpacity={1} onPress={() => setSosOpen(false)} />
          <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.15, shadowRadius: 40, elevation: 10 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#DC2626', marginBottom: 12 }}>Send SOS Alert</Text>
            {['Medical', 'Security', 'Equipment Failure', 'Fire'].map((opt, i) => (
              <TouchableOpacity key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: '#F1F5F9' }} activeOpacity={0.7} onPress={() => { setComposer(prev => prev + `🚨 ${opt}: `); setSosOpen(false) }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: i === 0 ? '#FFF1F2' : i === 1 ? '#FEF3C7' : i === 2 ? '#EEF3FF' : '#F0FDF4', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 14 }}>{['🚑', '🛡️', '🔧', '🔥'][i]}</Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#1F2937' }}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* ── COMPOSER ── */}
      <BlurView intensity={55} tint="light" style={{ position: 'absolute', bottom: composerBottom, left: 0, right: 0, zIndex: 5, paddingVertical: 8, paddingHorizontal: 12, paddingBottom: 6, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.04)' }}>
        <AnimatedReanimated.View style={useStaggerEntry(8)}>
          <View style={{ backgroundColor: 'white', borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 20, elevation: 3, borderWidth: 1, borderColor: '#EEF2F7', overflow: 'hidden' }}>
            <TextInput
              style={{ fontSize: 14, color: '#1B1B1B', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8, minHeight: 40, maxHeight: 100 }}
              placeholder="What's happening on the farm?"
              placeholderTextColor="#A0AEA1"
              value={composer}
              onChangeText={setComposer}
              multiline
            />
            {/* ATTACHMENT PREVIEWS */}
            {(imageUri || audioUri || location || document) && (
              <View style={{ flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingBottom: 6, flexWrap: 'wrap' }}>
                {imageUri && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', borderRadius: 10, paddingVertical: 4, paddingLeft: 4, paddingRight: 8, gap: 4 }}>
                    <Image source={{ uri: imageUri }} style={{ width: 22, height: 22, borderRadius: 6 }} />
                    <Text style={{ fontSize: 11, color: '#2E7D32', fontWeight: '500' }}>Photo</Text>
                    <TouchableOpacity onPress={() => setImageUri(null)}><GoonaIcon icon={X} size={12} color="#6B7280" /></TouchableOpacity>
                  </View>
                )}
                {audioUri && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#DDF5F0', borderRadius: 10, paddingVertical: 4, paddingLeft: 8, paddingRight: 8, gap: 4 }}>
                    <GoonaIcon icon={Mic} size={12} color="#0F766E" />
                    <Text style={{ fontSize: 11, color: '#0F766E', fontWeight: '500' }}>Voice note</Text>
                    <TouchableOpacity onPress={() => setAudioUri(null)}><GoonaIcon icon={X} size={12} color="#6B7280" /></TouchableOpacity>
                  </View>
                )}
                {location && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF3FF', borderRadius: 10, paddingVertical: 4, paddingLeft: 8, paddingRight: 8, gap: 4 }}>
                    <GoonaIcon icon={MapPin} size={12} color="#1A56FF" />
                    <Text style={{ fontSize: 11, color: '#1A56FF', fontWeight: '500' }}>{location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</Text>
                    <TouchableOpacity onPress={() => setLocation(null)}><GoonaIcon icon={X} size={12} color="#6B7280" /></TouchableOpacity>
                  </View>
                )}
                {document && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3E8FF', borderRadius: 10, paddingVertical: 4, paddingLeft: 8, paddingRight: 8, gap: 4 }}>
                    <GoonaIcon icon={Paperclip} size={12} color="#7C3AED" />
                    <Text style={{ fontSize: 11, color: '#7C3AED', fontWeight: '500' }} numberOfLines={1}>{document.name}</Text>
                    <TouchableOpacity onPress={() => setDocument(null)}><GoonaIcon icon={X} size={12} color="#6B7280" /></TouchableOpacity>
                  </View>
                )}
              </View>
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6, paddingBottom: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                <TouchableOpacity style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }} activeOpacity={0.6} onPress={handleCamera}>
                  <GoonaIcon icon={Camera} size={18} color="#2E7D32" />
                </TouchableOpacity>
                <TouchableOpacity style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }} activeOpacity={0.6} onPress={handleVoice}>
                  <GoonaIcon icon={Mic} size={18} color={isRecording ? '#DC2626' : '#0F766E'} />
                </TouchableOpacity>
                <TouchableOpacity style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }} activeOpacity={0.6} onPress={handleLocation}>
                  <GoonaIcon icon={MapPin} size={18} color="#1A56FF" />
                </TouchableOpacity>
                <TouchableOpacity style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }} activeOpacity={0.6} onPress={handleDocument}>
                  <GoonaIcon icon={Paperclip} size={18} color="#7C3AED" />
                </TouchableOpacity>
                <TouchableOpacity style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }} activeOpacity={0.6} onPress={() => setSosOpen(true)}>
                  <GoonaIcon icon={AlertTriangle} size={18} color="#DC2626" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#AEEA00', alignItems: 'center', justifyContent: 'center', shadowColor: '#AEEA00', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.30, shadowRadius: 20, elevation: 4 }} activeOpacity={0.8} onPress={() => setComposer('')}>
                <GoonaIcon icon={Send} size={15} color="#1B4332" />
              </TouchableOpacity>
            </View>
          </View>
        </AnimatedReanimated.View>
      </BlurView>

      <BottomDock hidden={keyboardH > 0} />
    </View>
  )
}


