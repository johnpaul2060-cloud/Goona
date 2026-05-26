import React, { useState, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, TextInput, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, Keyboard, Image, Alert,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { router } from 'expo-router'
import { ArrowLeft, Wheat, Skull, Pill, Egg, Droplets, Eye, Calendar, ChevronDown, ClipboardList, Mic, Camera, Upload, CheckCircle, Sparkles, Clock, FileText, X } from 'lucide-react-native'
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, withSequence, withRepeat,
  FadeInUp, FadeIn,
} from 'react-native-reanimated'
import GoonaIcon from '../components/ui/GoonaIcon'
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'
import * as ImagePicker from 'expo-image-picker'
import BottomDock from '../components/navigation/BottomDock'
import BatchPickerModal from '../components/BatchPickerModal'

/* ─── Press Scale ─── */
function usePressScale() {
  const scale = useSharedValue(1)
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
  return {
    style,
    onPressIn: () => { scale.value = withSpring(0.96, { damping: 15, stiffness: 200 }) },
    onPressOut: () => { scale.value = withSpring(1, { damping: 15, stiffness: 200 }) },
  }
}

/* ─── Record type definition ─── */
const RECORD_TYPES = [
  {
    key: 'feed', label: 'Feed Usage',
    icon: Wheat,
    iconBg: '#FFFBEB', iconColor: '#F59E0B',
  },
  {
    key: 'mortality', label: 'Mortality',
    icon: Skull,
    iconBg: '#FFF1F2', iconColor: '#EF4444',
  },
  {
    key: 'medication', label: 'Medication',
    icon: Pill,
    iconBg: '#EEF3FF', iconColor: '#1A56FF',
  },
  {
    key: 'eggs', label: 'Egg Production',
    icon: Egg,
    iconBg: '#F0FDF4', iconColor: '#16A34A',
  },
  {
    key: 'water', label: 'Water',
    icon: Droplets,
    iconBg: '#EEF3FF', iconColor: '#1A56FF',
  },
  {
    key: 'observation', label: 'Observation',
    icon: Eye,
    iconBg: '#F0FDF4', iconColor: '#16A34A',
  },
] as const

type RecordKey = (typeof RECORD_TYPES)[number]['key']

/* ─── Form field ─── */
function FormField({
  label, placeholder, prefix, suffix, icon, value, onChangeText, multiline,
}: {
  label: string
  placeholder?: string
  prefix?: string
  suffix?: string
  icon?: React.ReactNode
  value?: string
  onChangeText?: (v: string) => void
  multiline?: boolean
}) {
  const [focused, setFocused] = useState(false)
  return (
    <View style={ffStyles.group}>
      <View style={[ffStyles.wrap, focused && ffStyles.wrapFocused, multiline && ffStyles.wrapTextarea]}>
        {icon && <View style={ffStyles.ico}>{icon}</View>}
        {prefix && <Text style={ffStyles.prefix}>{prefix}</Text>}
        <View style={ffStyles.inner}>
          <Text style={ffStyles.lbl}>{label}</Text>
          <TextInput
            style={[ffStyles.input, multiline && { minHeight: 60, textAlignVertical: 'top' }]}
            placeholder={placeholder}
            placeholderTextColor="#A0AEA1"
            value={value}
            onChangeText={onChangeText}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            multiline={multiline}
          />
        </View>
        {suffix && <Text style={ffStyles.suffix}>{suffix}</Text>}
      </View>
    </View>
  )
}
const ffStyles = StyleSheet.create({
  group: { marginBottom: 16 },
  wrap: {
    flexDirection: 'row', alignItems: 'center', height: 56,
    borderRadius: 16, backgroundColor: '#F8FAF7',
    borderWidth: 1.5, borderColor: '#E2E8F0',
    paddingHorizontal: 16, gap: 10,
  },
  wrapFocused: { borderColor: '#2E7D32' },
  wrapTextarea: { minHeight: 80, alignItems: 'flex-start', paddingTop: 12 },
  ico: { width: 18, height: 18, flexShrink: 0 },
  inner: { flex: 1, justifyContent: 'center' },
  lbl: { fontSize: 10, fontWeight: '500', color: '#A0AEA1', marginBottom: 1 },
  input: { fontSize: 15, fontWeight: '500', color: '#1B1B1B', padding: 0 },
  prefix: { fontSize: 15, fontWeight: '600', color: '#1B1B1B', flexShrink: 0 },
  suffix: { fontSize: 15, fontWeight: '600', color: '#1B1B1B', flexShrink: 0 },
})

/* ─── Smart insight per type ─── */
const INSIGHT_MAP: Record<string, { text: string; bars: number[] }> = {
  feed: { text: 'Feed efficiency is projected to improve by 6% based on today\'s feeding consistency.', bars: [40, 55, 70, 85] },
  mortality: { text: 'Mortality rates are trending 12% below target this cycle.', bars: [80, 70, 55, 40] },
  medication: { text: 'Medication adherence is at 94% — keep up the consistent schedule.', bars: [60, 75, 85, 94] },
  eggs: { text: 'Egg production is 8% above forecast for this batch.', bars: [50, 60, 75, 90] },
  water: { text: 'Water consumption is within optimal range for current stocking density.', bars: [65, 70, 72, 68] },
  observation: { text: 'Regular observations improve early detection by 40%.', bars: [30, 50, 70, 85] },
}



/* ─── MAIN ─── */
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatDate(d: Date): string {
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`
}

export default function DailyRecordsScreen() {
  const [selected, setSelected] = useState<RecordKey>('feed')
  const [focused, setFocused] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState('Broiler Batch A')
  const [showBatchPicker, setShowBatchPicker] = useState(false)

  const insight = INSIGHT_MAP[selected]

  const [feedType, setFeedType] = useState('')
  const [feedQty, setFeedQty] = useState('')
  const [feedCost, setFeedCost] = useState('')
  const [feedTime, setFeedTime] = useState('')
  const [feedNote, setFeedNote] = useState('')
  const [mortCount, setMortCount] = useState('')
  const [mortCause, setMortCause] = useState('')
  const [medName, setMedName] = useState('')
  const [medQty, setMedQty] = useState('')
  const [eggCount, setEggCount] = useState('')
  const [eggValue, setEggValue] = useState('')
  const [waterUsed, setWaterUsed] = useState('')
  const [obsNote, setObsNote] = useState('')

  type RecordingState = 'idle' | 'listening' | 'processing'
  const [recordingState, setRecordingState] = useState<RecordingState>('idle')
  const [images, setImages] = useState<string[]>([])

  const onDateChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false)
    if (date) setSelectedDate(date)
  }

  const handleVoiceDictation = () => {
    if (recordingState !== 'idle') return
    setRecordingState('listening')

    setTimeout(() => {
      setRecordingState('processing')
      setTimeout(() => {
        setRecordingState('idle')
        const transcribed = 'Observed consistent feeding activity across all pens. Birds showing healthy appetite and normal water consumption.'
        if (selected === 'feed') setFeedNote(transcribed)
        else if (selected === 'mortality') setMortCause(transcribed)
        else if (selected === 'observation') setObsNote(transcribed)
        else if (selected === 'medication') setMedName(transcribed)
      }, 1000)
    }, 2000)
  }

  const handleCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera access is needed to take photos.')
      return
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    })
    if (!result.canceled && result.assets.length > 0) {
      setImages((prev) => [...prev, result.assets[0].uri])
    }
  }

  const handleUpload = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Gallery access is needed to upload photos.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    })
    if (!result.canceled && result.assets.length > 0) {
      setImages((prev) => [...prev, result.assets[0].uri])
    }
  }

  const removeImage = (uri: string) => {
    setImages((prev) => prev.filter((u) => u !== uri))
  }

  /* pulse animation */
  const pulseScale = useSharedValue(1)
  const pulseOpacity = useSharedValue(0)
  const pulseAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }))

  useEffect(() => {
    if (recordingState === 'listening') {
      pulseScale.value = withRepeat(withSequence(withTiming(1.35, { duration: 900 }), withTiming(1, { duration: 900 })), -1, true)
      pulseOpacity.value = withRepeat(withSequence(withTiming(0.35, { duration: 900 }), withTiming(0, { duration: 900 })), -1, true)
    } else {
      pulseScale.value = withTiming(1)
      pulseOpacity.value = withTiming(0)
    }
  }, [recordingState])

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* bg */}
      <View style={styles.bgGlow} pointerEvents="none" />
      <View style={styles.bgContour1} pointerEvents="none" />
      <View style={styles.bgContour2} pointerEvents="none" />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollInner, { paddingBottom: 140 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* TOP NAV */}
          <Animated.View entering={FadeInUp.duration(500).springify()} style={styles.topNav}>
            <TouchableOpacity style={styles.navBack} activeOpacity={0.7} onPress={() => router.back()}>
              <GoonaIcon icon={ArrowLeft} size={22} color="#1B1B1B" />
            </TouchableOpacity>
            <Text style={styles.topTitle}>Daily Farm Records</Text>
            <View style={styles.calBtn}>
              <GoonaIcon icon={Calendar} size={20} color="#1F2937" />
            </View>
          </Animated.View>

          {/* HEADER */}
          <Animated.View entering={FadeInUp.duration(500).delay(80).springify()} style={styles.headerSection}>
            <Text style={styles.headerLabel}>Daily Operations</Text>
            <Text style={styles.headerTitle}>Log Today{'\u2019'}s{"\n"}Farm Activity</Text>
            <Text style={styles.headerSub}>Quickly update feeding, mortality, medication, and production records.</Text>
          </Animated.View>

          {/* SELECTORS */}
          <Animated.View entering={FadeInUp.duration(500).delay(150).springify()} style={styles.selectorRow}>
            <TouchableOpacity style={styles.selectorCard} activeOpacity={0.85} onPress={() => setShowDatePicker(true)}>
              <View style={[styles.selIcon, { backgroundColor: '#EEF3FF' }]}>
                <GoonaIcon icon={Calendar} size={18} color="#1A56FF" />
              </View>
              <View style={styles.selInfo}>
                <Text style={styles.selLbl}>Date</Text>
                <Text style={styles.selVal}>{formatDate(selectedDate)}</Text>
              </View>
              <ChevronDown size={14} color="#CBD5E1" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.selectorCard} activeOpacity={0.85} onPress={() => setShowBatchPicker(true)}>
              <View style={[styles.selIcon, { backgroundColor: '#F0FDF4' }]}>
                <GoonaIcon icon={ClipboardList} size={18} color="#16A34A" />
              </View>
              <View style={styles.selInfo}>
                <Text style={styles.selLbl}>Batch</Text>
                <Text style={styles.selVal} numberOfLines={1}>{selectedBatch}</Text>
              </View>
              <ChevronDown size={14} color="#CBD5E1" />
            </TouchableOpacity>
          </Animated.View>

          {/* DATE PICKER */}
          {showDatePicker && (
            <View style={styles.datePickerWrap}>
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDateChange}
                themeVariant="light"
              />
              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  style={styles.dateDoneBtn}
                  activeOpacity={0.85}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={styles.dateDoneText}>Done</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* RECORD TYPE GRID */}
          <Animated.View entering={FadeInUp.duration(500).delay(200).springify()}>
            <Text style={styles.secTitle}>What would you like to record?</Text>
          </Animated.View>

          <View style={styles.recordGrid}>
            {RECORD_TYPES.map((r, i) => {
              const active = selected === r.key
              return (
                <Animated.View
                  key={r.key}
                  entering={FadeInUp.duration(400).delay(250 + i * 60).springify()}
                  style={[styles.recordCard, active && styles.recordCardActive]}
                >
                  <TouchableOpacity
                    style={styles.recordCardTouch}
                    activeOpacity={0.85}
                    onPress={() => setSelected(r.key)}
                  >
                    <View style={[styles.rcIcon, active ? styles.rcIconActive : { backgroundColor: r.iconBg }]}>
                      <GoonaIcon icon={r.icon} size={20} color={active ? 'white' : r.iconColor} />
                    </View>
                    <Text style={[styles.rcLabel, active && styles.rcLabelActive]} numberOfLines={2}>{r.label}</Text>
                  </TouchableOpacity>
                </Animated.View>
              )
            })}
          </View>

          {/* DYNAMIC FORM */}
          <Animated.View key={selected} entering={FadeIn.duration(300)} style={styles.formCard}>
            {/* Feed Usage */}
            {selected === 'feed' && (
              <>
                <Text style={styles.formTitle}>Feed Usage Entry</Text>
                <FormField label="Feed Type" placeholder="Select feed type" icon={<GoonaIcon icon={Wheat} size={18} color="#A0AEA1" />} value={feedType} onChangeText={setFeedType} />
                <FormField label="Quantity Used" placeholder="0 kg" suffix="kg" value={feedQty} onChangeText={setFeedQty} />
                <FormField label="Feed Cost" placeholder="0.00" prefix={'\u20A6'} value={feedCost} onChangeText={setFeedCost} />
                <FormField label="Time of Feeding" placeholder="Select time" icon={<GoonaIcon icon={Clock} size={18} color="#A0AEA1" />} value={feedTime} onChangeText={setFeedTime} />
                <FormField label="Notes" placeholder="Add observations\u2026" icon={<GoonaIcon icon={FileText} size={18} color="#A0AEA1" />} multiline value={feedNote} onChangeText={setFeedNote} />
              </>
            )}
            {/* Mortality */}
            {selected === 'mortality' && (
              <>
                <Text style={styles.formTitle}>Mortality Log</Text>
                <FormField label="Number of Birds Lost" placeholder="0" value={mortCount} onChangeText={setMortCount} />
                <FormField label="Suspected Cause" placeholder="e.g. Heat stress" icon={<GoonaIcon icon={FileText} size={18} color="#A0AEA1" />} value={mortCause} onChangeText={setMortCause} />
              </>
            )}
            {/* Medication */}
            {selected === 'medication' && (
              <>
                <Text style={styles.formTitle}>Medication Record</Text>
                <FormField label="Medication / Vaccine Name" placeholder="e.g. Newcastle vaccine" value={medName} onChangeText={setMedName} />
                <FormField label="Quantity Administered" placeholder="e.g. 1 vial (500 doses)" value={medQty} onChangeText={setMedQty} />
              </>
            )}
            {/* Eggs */}
            {selected === 'eggs' && (
              <>
                <Text style={styles.formTitle}>Egg Production</Text>
                <FormField label="Number of Eggs Collected" placeholder="0 eggs" value={eggCount} onChangeText={setEggCount} />
                <FormField label="Estimated Value" placeholder="0.00" prefix={'\u20A6'} value={eggValue} onChangeText={setEggValue} />
              </>
            )}
            {/* Water */}
            {selected === 'water' && (
              <>
                <Text style={styles.formTitle}>Water Consumption</Text>
                <FormField label="Water Used" placeholder="0 litres" suffix="L" value={waterUsed} onChangeText={setWaterUsed} />
              </>
            )}
            {/* Observation */}
            {selected === 'observation' && (
              <>
                <Text style={styles.formTitle}>Farm Observation</Text>
                <FormField label="Observation Notes" placeholder="Describe what you observed\u2026" multiline value={obsNote} onChangeText={setObsNote} />
              </>
            )}
          </Animated.View>

          {/* SMART INSIGHT */}
          <Animated.View entering={FadeInUp.duration(500).delay(450).springify()} style={styles.smartCard}>
            <View style={styles.smartIcon}>
              <GoonaIcon icon={Sparkles} size={18} color="#F9A825" />
            </View>
            <Text style={styles.smartText}>{insight.text}</Text>
            <View style={styles.smartChart}>
              {insight.bars.map((h, i) => (
                <View key={i} style={[styles.smartBar, { height: `${h}%` as any, backgroundColor: i >= insight.bars.length - 2 ? '#16A34A' : '#E2E8E0' }]} />
              ))}
            </View>
          </Animated.View>

          {/* VOICE INPUT */}
          <Animated.View entering={FadeInUp.duration(500).delay(500).springify()} style={[styles.voiceRow, recordingState !== 'idle' && styles.voiceRowActive]}>
            <TouchableOpacity
              style={styles.voiceBtnWrap}
              activeOpacity={0.85}
              onPress={handleVoiceDictation}
              disabled={recordingState !== 'idle'}
            >
              <Animated.View style={[styles.voicePulseRing, pulseAnimStyle]} />
              <View style={[styles.voiceBtn, recordingState !== 'idle' && styles.voiceBtnActive]}>
                {recordingState !== 'idle' ? (
                  <GoonaIcon icon={Mic} size={20} color="white" />
                ) : (
                  <GoonaIcon icon={Mic} size={20} color="white" />
                )}
              </View>
            </TouchableOpacity>
            <Text style={[styles.voiceText, recordingState !== 'idle' && styles.voiceTextActive]}>
              {recordingState === 'idle' && 'Tap to dictate notes'}
              {recordingState === 'listening' && 'Listening...'}
              {recordingState === 'processing' && 'Converting speech to notes...'}
            </Text>
            {recordingState !== 'idle' && (
              <Animated.View entering={FadeIn.duration(200)}>
                <View style={styles.voiceWaveform}>
                  {[1, 2, 3, 4].map((_, i) => (
                    <View key={i} style={[styles.voiceWaveBar, { height: `${6 + Math.random() * 14}%` as any }]} />
                  ))}
                </View>
              </Animated.View>
            )}
          </Animated.View>

          {/* PHOTO ATTACH */}
          <Animated.View entering={FadeInUp.duration(500).delay(550).springify()} style={styles.photoRow}>
            <TouchableOpacity style={styles.photoBtn} activeOpacity={0.85} onPress={handleCamera}>
              <GoonaIcon icon={Camera} size={16} color="#1F2937" />
              <Text style={styles.photoBtnText}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoBtn} activeOpacity={0.85} onPress={handleUpload}>
              <GoonaIcon icon={Upload} size={16} color="#1F2937" />
              <Text style={styles.photoBtnText}>Upload Photo</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* IMAGE PREVIEW */}
          {images.length > 0 && (
            <Animated.View entering={FadeInUp.duration(400).springify()} style={styles.imagePreviewRow}>
              {images.map((uri) => (
                <View key={uri} style={styles.imagePreviewCard}>
                  <Image source={{ uri }} style={styles.imagePreviewImg} />
                  <TouchableOpacity
                    style={styles.imageRemoveBtn}
                    activeOpacity={0.7}
                    onPress={() => removeImage(uri)}
                  >
                    <GoonaIcon icon={X} size={12} color="white" />
                  </TouchableOpacity>
                </View>
              ))}
            </Animated.View>
          )}

          {/* OFFLINE CHIP */}
          <Animated.View entering={FadeInUp.duration(500).delay(600).springify()} style={styles.offlineChip}>
            <GoonaIcon icon={CheckCircle} size={14} color="#2E7D32" />
            <Text style={styles.offlineText}>Offline Sync Enabled</Text>
          </Animated.View>

          {/* SAVE */}
          <TouchableOpacity style={styles.saveBtn} activeOpacity={0.9}>
            <GoonaIcon icon={CheckCircle} size={20} color="white" />
            <Text style={styles.saveBtnText}>Save Daily Record</Text>
          </TouchableOpacity>

          {/* RECENT ENTRIES */}
          <Text style={[styles.secTitle, { marginTop: 24 }]}>Recent Entries</Text>

          {[
            { iconBg: '#FFFBEB', icon: Wheat, iconColor: '#F59E0B', title: 'Feed Entry \u2014 8 bags grower feed', meta: 'Today, 8:30 AM  |  Broiler Batch A' },
            { iconBg: '#EEF3FF', icon: Pill, iconColor: '#1A56FF', title: 'Medication \u2014 Newcastle vaccine', meta: 'Today, 7:15 AM  |  420 broilers' },
            { iconBg: '#F0FDF4', icon: Egg, iconColor: '#16A34A', title: 'Egg Count \u2014 360 eggs (12 crates)', meta: 'Yesterday, 4:00 PM  |  Layer Batch B' },
          ].map((entry, i) => (
            <Animated.View key={i} entering={FadeInUp.duration(500).delay(650 + i * 80).springify()} style={styles.entryCard}>
              <View style={[styles.entryIcon, { backgroundColor: entry.iconBg }]}>
                <GoonaIcon icon={entry.icon} size={18} color={entry.iconColor} />
              </View>
              <View style={styles.entryInfo}>
                <Text style={styles.entryTitle}>{entry.title}</Text>
                <Text style={styles.entryMeta}>{entry.meta}</Text>
              </View>
              <View style={styles.entrySync}>
                <CheckCircle size={10} color="#16A34A" />
                <Text style={styles.entrySyncText}>Synced</Text>
              </View>
            </Animated.View>
          ))}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <BatchPickerModal
        visible={showBatchPicker}
        selected={selectedBatch}
        onSelect={setSelectedBatch}
        onClose={() => setShowBatchPicker(false)}
      />

      <BottomDock />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAF7' },

  /* bg */
  bgGlow: { position: 'absolute', top: -40, right: -40, width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(232,245,233,0.3)', zIndex: 0 },
  bgContour1: { position: 'absolute', top: '5%', left: '-10%', width: 320, height: 100, zIndex: 0, borderWidth: 1, borderColor: 'rgba(46,125,50,0.04)', borderTopLeftRadius: 160, borderTopRightRadius: 160, borderBottomWidth: 0, transform: [{ rotate: '6deg' }] },
  bgContour2: { position: 'absolute', bottom: '10%', right: '-10%', width: 250, height: 80, zIndex: 0, borderWidth: 1, borderColor: 'rgba(46,125,50,0.04)', borderBottomLeftRadius: 125, borderBottomRightRadius: 125, borderTopWidth: 0, transform: [{ rotate: '-8deg' }] },

  /* scroll */
  scroll: { flex: 1, zIndex: 1 },
  scrollInner: { paddingHorizontal: 20, paddingTop: 0 },

  /* top nav */
  topNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 54 },
  navBack: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  topTitle: { fontWeight: '700', fontSize: 20, color: '#1B1B1B' },
  calBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 14, elevation: 3 },

  /* header */
  headerSection: { marginTop: 10 },
  headerLabel: { fontSize: 11, fontWeight: '600', color: '#2E7D32', letterSpacing: 2, textTransform: 'uppercase' },
  headerTitle: { fontWeight: '800', fontSize: 30, lineHeight: 38, color: '#1B1B1B', marginTop: 4 },
  headerSub: { fontSize: 14, color: '#616161', marginTop: 4 },

  /* selectors */
  selectorRow: { flexDirection: 'row', gap: 12, marginTop: 18 },
  selectorCard: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'white', borderRadius: 20, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 2 },
  selIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  selInfo: { flex: 1 },
  selLbl: { fontSize: 10, fontWeight: '500', color: '#94A3B8' },
  selVal: { fontSize: 14, fontWeight: '600', color: '#1F2937', marginTop: -1 },

  /* date picker */
  datePickerWrap: { backgroundColor: 'white', borderRadius: 24, marginTop: 12, paddingTop: 8, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 2 },
  dateDoneBtn: { height: 48, alignItems: 'center', justifyContent: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9', marginHorizontal: 16 },
  dateDoneText: { fontSize: 15, fontWeight: '600', color: '#2E7D32' },

  /* section title */
  secTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginTop: 22, marginBottom: 12 },

  /* record grid */
  recordGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16 },
  recordCard: { width: '47%', height: 140, borderRadius: 24, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, borderWidth: 2, borderColor: 'transparent', backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 30, elevation: 2 },
  recordCardActive: { borderColor: '#2E7D32', backgroundColor: '#2E7D32' },
  recordCardTouch: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  rcIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  rcIconActive: { backgroundColor: 'rgba(255,255,255,0.15)' },
  rcLabel: { fontSize: 20, fontWeight: '600', color: '#1F2937', textAlign: 'center', lineHeight: 24 },
  rcLabelActive: { color: 'white' },

  /* form card */
  formCard: { backgroundColor: 'white', borderRadius: 28, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 15 }, shadowOpacity: 0.06, shadowRadius: 40, elevation: 4, marginTop: 16 },
  formTitle: { fontSize: 17, fontWeight: '700', color: '#1F2937', marginBottom: 18 },

  /* smart insight */
  smartCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#E8F5E9', borderRadius: 22, padding: 16, marginTop: 16 },
  smartIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  smartText: { fontSize: 13, lineHeight: 19, color: '#1F2937', flex: 1 },
  smartChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 24, flexShrink: 0 },
  smartBar: { width: 4, borderRadius: 2 },

  /* voice */
  voiceRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 16, paddingVertical: 12, paddingHorizontal: 16, backgroundColor: 'white', borderRadius: 100, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 14, elevation: 2 },
  voiceRowActive: { borderWidth: 1, borderColor: 'rgba(46,125,50,0.2)', backgroundColor: '#F0FDF4' },
  voiceBtnWrap: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  voiceBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2E7D32', alignItems: 'center', justifyContent: 'center', shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 14, elevation: 4 },
  voiceBtnActive: { backgroundColor: '#EF4444' },
  voicePulseRing: { position: 'absolute', width: 44, height: 44, borderRadius: 22, backgroundColor: '#2E7D32' },
  voiceText: { fontSize: 14, fontWeight: '500', color: '#64748B', flex: 1 },
  voiceTextActive: { color: '#2E7D32', fontWeight: '600' },
  voiceWaveform: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 20, flexShrink: 0 },
  voiceWaveBar: { width: 3, borderRadius: 2, backgroundColor: '#2E7D32' },

  /* photo */
  photoRow: { flexDirection: 'row', gap: 12, marginTop: 14 },
  photoBtn: { flex: 1, height: 48, borderRadius: 14, borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: 'white', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  photoBtnText: { fontSize: 13, fontWeight: '500', color: '#1F2937' },
  imagePreviewRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  imagePreviewCard: { width: 72, height: 72, borderRadius: 14, overflow: 'hidden', backgroundColor: '#F1F5F9', position: 'relative', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 },
  imagePreviewImg: { width: '100%', height: '100%', resizeMode: 'cover' as const },
  imageRemoveBtn: { position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },

  /* offline */
  offlineChip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16 },
  offlineText: { fontSize: 12, fontWeight: '500', color: '#94A3B8' },

  /* save */
  saveBtn: { height: 58, borderRadius: 20, backgroundColor: '#2E7D32', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 16, shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.3, shadowRadius: 35, elevation: 6 },
  saveBtnText: { fontWeight: '600', fontSize: 16, color: 'white' },

  /* entries */
  entryCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: 'white', borderRadius: 20, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 14, elevation: 2 },
  entryIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  entryInfo: { flex: 1 },
  entryTitle: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  entryMeta: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
  entrySync: { flexDirection: 'row', alignItems: 'center', gap: 3, flexShrink: 0 },
  entrySyncText: { fontSize: 10, fontWeight: '500', color: '#16A34A' },
})


