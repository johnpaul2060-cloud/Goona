import React, { useState, useRef } from 'react'
import {
  View, Text, TouchableOpacity, TextInput, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform,
  Modal, Dimensions,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { router } from 'expo-router'
import { Icons } from '../shared/icons'
import Animated, {
  FadeInUp, FadeInDown,
} from 'react-native-reanimated'
import GoonaIcon from '../components/ui/GoonaIcon'
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'
import BottomDock from '../components/navigation/BottomDock'
import BatchPickerModal from '../components/BatchPickerModal'

const RECORD_TYPES = [
  { key: 'feed' as const, label: 'Feed', icon: Icons.wheat, iconBg: '#FFFBEB', iconColor: '#F59E0B', emoji: '\uD83C\uDF3D' },
  { key: 'mortality' as const, label: 'Mortality', icon: Icons.skull, iconBg: '#FFF1F2', iconColor: '#EF4444', emoji: '\uD83D\uDC80' },
  { key: 'medication' as const, label: 'Medication', icon: Icons.pill, iconBg: '#EEF3FF', iconColor: '#1A56FF', emoji: '\uD83D\uDC8A' },
  { key: 'eggs' as const, label: 'Eggs', icon: Icons.egg, iconBg: '#F0FDF4', iconColor: '#16A34A', emoji: '\uD83E\uDD5A' },
  { key: 'water' as const, label: 'Water', icon: Icons.droplets, iconBg: '#EEF3FF', iconColor: '#0EA5E9', emoji: '\uD83D\uDCA7' },
  { key: 'observation' as const, label: 'Notes', icon: Icons.eye, iconBg: '#F5F3FF', iconColor: '#8B5CF6', emoji: '\uD83D\uDCDD' },
] as const

type RecordKey = (typeof RECORD_TYPES)[number]['key']

const SNAPSHOT_METRICS = [
  { label: 'Feed Logged', value: '120 kg', icon: Icons.wheat, color: '#F59E0B', bg: '#FFFBEB', trend: 'up' as const, change: '+8% vs yesterday' },
  { label: 'Water Logged', value: '80 L', icon: Icons.droplets, color: '#0EA5E9', bg: '#EEF3FF', trend: 'up' as const, change: '+12% vs yesterday' },
  { label: 'Mortality', value: '2 birds', icon: Icons.skull, color: '#EF4444', bg: '#FFF1F2', trend: 'down' as const, change: '-1 vs yesterday' },
  { label: 'Egg Production', value: '360 eggs', icon: Icons.egg, color: '#16A34A', bg: '#F0FDF4', trend: 'up' as const, change: '+5% vs yesterday' },
]

const DAILY_LOGS = [
  { key: 'feed', label: 'Feed Logged', done: true },
  { key: 'water', label: 'Water Logged', done: true },
  { key: 'mortality', label: 'Mortality', done: true },
  { key: 'medication', label: 'Medication', done: false },
  { key: 'eggs', label: 'Egg Production', done: true },
  { key: 'observation', label: 'Notes', done: false },
]

const PROGRESS_PCT = Math.round((DAILY_LOGS.filter(l => l.done).length / DAILY_LOGS.length) * 100)

const RECENT_ACTIVITY = [
  { icon: Icons.wheat, iconBg: '#FFFBEB', iconColor: '#F59E0B', title: '120kg Feed Logged', time: 'Today, 8:30 AM', batch: 'Broiler Batch A', date: '20 Jun 2026' },
  { icon: Icons.pill, iconBg: '#EEF3FF', iconColor: '#1A56FF', title: 'Medication — Newcastle vaccine', time: 'Today, 7:15 AM', batch: '420 broilers', date: '20 Jun 2026' },
  { icon: Icons.egg, iconBg: '#F0FDF4', iconColor: '#16A34A', title: '360 Eggs Collected', time: 'Yesterday, 4:00 PM', batch: 'Layer Batch B', date: '19 Jun 2026' },
  { icon: Icons.droplets, iconBg: '#EEF3FF', iconColor: '#0EA5E9', title: '80L Water Consumed', time: 'Yesterday, 3:00 PM', batch: 'Broiler Batch A', date: '19 Jun 2026' },
  { icon: Icons.skull, iconBg: '#FFF1F2', iconColor: '#EF4444', title: '2 Mortality Recorded', time: 'Yesterday, 2:15 PM', batch: 'Broiler Batch A', date: '19 Jun 2026' },
]

const IQ_INSIGHTS = [
  { icon: Icons.trendingUp, color: '#F59E0B', bg: '#FFFBEB', title: 'Feed Consumption', desc: 'Feed consumption is 12% below expected for this cycle. Consider reviewing feed formulation.', severity: 'low' as const },
  { icon: Icons.trendingDown, color: '#16A34A', bg: '#F0FDF4', title: 'Mortality Trend', desc: 'Mortality trend is normal at 0.4% — well below the 2% threshold. Continue current practices.', severity: 'normal' as const },
  { icon: Icons.alertTriangle, color: '#EF4444', bg: '#FEF2F2', title: 'Water Usage Alert', desc: 'Water usage elevated by 8% today. Check for leaks or adjust drinker pressure.', severity: 'elevated' as const },
]

const SCREEN_W = Dimensions.get('window').width

/* ─── Form Field ─── */
function FormField({
  label, placeholder, prefix, suffix, icon, value, onChangeText, multiline, autoFocus, onFocus,
}: {
  label: string; placeholder?: string; prefix?: string; suffix?: string
  icon?: React.ReactNode; value?: string; onChangeText?: (v: string) => void; multiline?: boolean; autoFocus?: boolean; onFocus?: () => void
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
            onFocus={() => { setFocused(true); onFocus?.() }}
            onBlur={() => setFocused(false)}
            multiline={multiline}
            autoFocus={autoFocus}
          />
        </View>
        {suffix && <Text style={ffStyles.suffix}>{suffix}</Text>}
      </View>
    </View>
  )
}
const ffStyles = StyleSheet.create({
  group: { marginBottom: 14 },
  wrap: { flexDirection: 'row', alignItems: 'center', height: 50, borderRadius: 14, backgroundColor: '#F8FAF7', borderWidth: 1.5, borderColor: '#E2E8F0', paddingHorizontal: 14, gap: 8 },
  wrapFocused: { borderColor: '#2E7D32' },
  wrapTextarea: { minHeight: 72, alignItems: 'flex-start', paddingTop: 10 },
  ico: { width: 16, height: 16, flexShrink: 0 },
  inner: { flex: 1, justifyContent: 'center' },
  lbl: { fontSize: 10, fontWeight: '500', color: '#A0AEA1', marginBottom: 1 },
  input: { fontSize: 14, fontWeight: '500', color: '#1B1B1B', padding: 0 },
  prefix: { fontSize: 14, fontWeight: '600', color: '#1B1B1B', flexShrink: 0 },
  suffix: { fontSize: 14, fontWeight: '600', color: '#1B1B1B', flexShrink: 0 },
})

/* ─── Quick Log Bottom Sheet (keyboard-aware) ─── */
function QuickLogSheet({
  visible, type, onClose, batch, dateStr, onSave,
}: {
  visible: boolean; type: RecordKey; onClose: () => void
  batch: string; dateStr: string; onSave?: () => void
}) {
  const scrollRef = useRef<ScrollView>(null)

  const scrollToInput = () => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true })
    }, 150)
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={qsStyles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <TouchableOpacity style={qsStyles.backdrop} activeOpacity={1} onPress={onClose} />
        <Animated.View entering={FadeInDown.duration(350).springify()} style={qsStyles.sheet}>
          <View style={qsStyles.handle} />
          <View style={qsStyles.contextPill}>
            <GoonaIcon icon={Icons.calendar} size={12} color="#2E7D32" />
            <Text style={qsStyles.contextText}>{dateStr}  •  {batch}</Text>
          </View>
          <ScrollView
            ref={scrollRef}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={qsStyles.scrollContent}
          >
            {type === 'feed' && (
              <View>
                <Text style={qsStyles.sheetTitle}>Log Feed Usage</Text>
                <FormField label="Feed Type" placeholder="e.g. Grower feed" icon={<GoonaIcon icon={Icons.wheat} size={16} color="#A0AEA1" />} autoFocus />
                <FormField label="Quantity" placeholder="0 kg" suffix="kg" />
                <FormField label="Cost" placeholder="0.00" prefix={'\u20A6'} onFocus={scrollToInput} />
                <FormField label="Time" placeholder="e.g. 8:30 AM" icon={<GoonaIcon icon={Icons.clock} size={16} color="#A0AEA1" />} onFocus={scrollToInput} />
                <FormField label="Notes" placeholder="Optional..." icon={<GoonaIcon icon={Icons.fileText} size={16} color="#A0AEA1" />} multiline onFocus={scrollToInput} />
              </View>
            )}
            {type === 'mortality' && (
              <View>
                <Text style={qsStyles.sheetTitle}>Log Mortality</Text>
                <FormField label="Number of Birds Lost" placeholder="0" autoFocus />
                <FormField label="Suspected Cause" placeholder="e.g. Heat stress" icon={<GoonaIcon icon={Icons.fileText} size={16} color="#A0AEA1" />} onFocus={scrollToInput} />
                <FormField label="Notes" placeholder="Optional..." icon={<GoonaIcon icon={Icons.fileText} size={16} color="#A0AEA1" />} multiline onFocus={scrollToInput} />
              </View>
            )}
            {type === 'medication' && (
              <View>
                <Text style={qsStyles.sheetTitle}>Log Medication</Text>
                <FormField label="Medication Name" placeholder="e.g. Newcastle vaccine" icon={<GoonaIcon icon={Icons.pill} size={16} color="#A0AEA1" />} autoFocus />
                <FormField label="Quantity Administered" placeholder="e.g. 1 vial (500 doses)" onFocus={scrollToInput} />
                <FormField label="Notes" placeholder="Optional..." icon={<GoonaIcon icon={Icons.fileText} size={16} color="#A0AEA1" />} multiline onFocus={scrollToInput} />
              </View>
            )}
            {type === 'eggs' && (
              <View>
                <Text style={qsStyles.sheetTitle}>Log Egg Production</Text>
                <FormField label="Eggs Collected" placeholder="0 eggs" suffix="eggs" autoFocus />
                <FormField label="Estimated Value" placeholder="0.00" prefix={'\u20A6'} onFocus={scrollToInput} />
                <FormField label="Notes" placeholder="Optional..." icon={<GoonaIcon icon={Icons.fileText} size={16} color="#A0AEA1" />} multiline onFocus={scrollToInput} />
              </View>
            )}
            {type === 'water' && (
              <View>
                <Text style={qsStyles.sheetTitle}>Log Water Usage</Text>
                <FormField label="Water Used" placeholder="0 litres" suffix="L" autoFocus />
                <FormField label="Notes" placeholder="Optional..." icon={<GoonaIcon icon={Icons.fileText} size={16} color="#A0AEA1" />} multiline onFocus={scrollToInput} />
              </View>
            )}
            {type === 'observation' && (
              <View>
                <Text style={qsStyles.sheetTitle}>Add Observation Note</Text>
                <FormField label="Notes" placeholder="Describe what you observed..." icon={<GoonaIcon icon={Icons.eye} size={16} color="#A0AEA1" />} multiline autoFocus />
              </View>
            )}
          </ScrollView>
          <TouchableOpacity style={qsStyles.saveBtn} activeOpacity={0.9} onPress={onSave}>
            <GoonaIcon icon={Icons.checkCircle} size={18} color="white" />
            <Text style={qsStyles.saveText}>Save Record</Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  )
}
const qsStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: { backgroundColor: 'white', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20, maxHeight: '85%' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB', alignSelf: 'center', marginBottom: 12 },
  contextPill: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#F0FDF4', borderRadius: 100, paddingVertical: 6, paddingHorizontal: 14, marginBottom: 14, alignSelf: 'center' },
  contextText: { fontSize: 12, fontWeight: '600', color: '#2E7D32' },
  scrollContent: { paddingBottom: 12 },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: '#1B1B1B', marginBottom: 18 },
  saveBtn: { height: 52, borderRadius: 16, backgroundColor: '#2E7D32', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 },
  saveText: { fontSize: 15, fontWeight: '600', color: 'white' },
})

/* ─── Animated wrapper ─── */
function AnimatedCard({ children, delay }: { children: React.ReactNode; delay?: number }) {
  return (
    <Animated.View entering={FadeInUp.duration(400).delay(delay ?? 0).springify()}>
      {children}
    </Animated.View>
  )
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatDate(d: Date): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

/* ─── MAIN ─── */
export default function DailyRecordsScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState('Layer Batch A')
  const [showBatchPicker, setShowBatchPicker] = useState(false)
  const [quickLogType, setQuickLogType] = useState<RecordKey | null>(null)

  const dateStr = formatDate(selectedDate)

  const onDateChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false)
    if (date) setSelectedDate(date)
  }

  const openQuickLog = (key: RecordKey) => setQuickLogType(key)
  const closeQuickLog = () => setQuickLogType(null)

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

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
          {/* ─── TOP NAV ─── */}
          <AnimatedCard>
            <View style={styles.topNav}>
              <TouchableOpacity style={styles.navBack} activeOpacity={0.7} onPress={() => router.back()}>
                <GoonaIcon icon={Icons.arrowLeft} size={22} color="#1B1B1B" />
              </TouchableOpacity>
              <Text style={styles.topTitle}>Farm Operations</Text>
              <View style={styles.spacer} />
            </View>
          </AnimatedCard>

          {/* ─── 1. HEADER ─── */}
          <AnimatedCard delay={80}>
            <View style={styles.headerSection}>
              <Text style={styles.headerLabel}>Farm Operations Command</Text>
              <Text style={styles.headerTitle}>Operations{'\n'}Dashboard</Text>
            </View>
          </AnimatedCard>

          {/* ─── 2. BATCH + DATE CONTEXT BANNER ─── */}
          <AnimatedCard delay={130}>
            <TouchableOpacity activeOpacity={0.85} onLongPress={() => {}}>
              <View style={styles.contextBanner}>
                <TouchableOpacity
                  style={styles.contextSection}
                  activeOpacity={0.7}
                  onPress={() => setShowBatchPicker(true)}
                >
                  <GoonaIcon icon={Icons.clipboardList} size={14} color="#2E7D32" />
                  <Text style={styles.contextText} numberOfLines={1}>{selectedBatch}</Text>
                  <Icons.chevronDown size={10} color="#2E7D32" />
                </TouchableOpacity>
                <View style={styles.contextDivider} />
                <TouchableOpacity
                  style={styles.contextSection}
                  activeOpacity={0.7}
                  onPress={() => setShowDatePicker(true)}
                >
                  <GoonaIcon icon={Icons.calendar} size={14} color="#2E7D32" />
                  <Text style={styles.contextText}>{dateStr}</Text>
                  <Icons.chevronDown size={10} color="#2E7D32" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </AnimatedCard>

          {/* ─── DATE PICKER ─── */}
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
                <TouchableOpacity style={styles.dateDoneBtn} activeOpacity={0.85} onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.dateDoneText}>Done</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* ─── 3. QUICK FARM LOGS ─── */}
          <AnimatedCard delay={180}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Quick Farm Logs</Text>
            </View>
          </AnimatedCard>
          <AnimatedCard delay={220}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillScroll}>
              {RECORD_TYPES.map((r) => (
                <TouchableOpacity
                  key={r.key}
                  style={[styles.pillCard, { backgroundColor: r.iconBg, borderColor: r.iconColor + '30' }]}
                  activeOpacity={0.7}
                  onPress={() => openQuickLog(r.key)}
                >
                  <Text style={styles.pillEmoji}>{r.emoji}</Text>
                  <Text style={[styles.pillLabel, { color: r.iconColor }]}>{r.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </AnimatedCard>

          {/* ─── 4. TODAY'S SNAPSHOT ─── */}
          <AnimatedCard delay={280}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Today's Snapshot</Text>
            </View>
          </AnimatedCard>
          <View style={styles.snapshotGrid}>
            {SNAPSHOT_METRICS.map((m, i) => {
              const IconComp = m.icon
              const TrendIcon = m.trend === 'up' ? Icons.trendingUp : Icons.trendingDown
              return (
                <AnimatedCard key={m.label} delay={320 + i * 50}>
                  <View style={[styles.snapCard, { borderLeftColor: m.color }]}>
                    <View style={[styles.snapIcon, { backgroundColor: m.bg }]}>
                      <GoonaIcon icon={IconComp} size={18} color={m.color} />
                    </View>
                    <View style={styles.snapContent}>
                      <Text style={styles.snapValue}>{m.value}</Text>
                      <Text style={styles.snapLabel}>{m.label}</Text>
                    </View>
                    <View style={styles.snapTrend}>
                      <GoonaIcon icon={TrendIcon} size={10} color={m.color} />
                      <Text style={[styles.snapChange, { color: m.color }]}>{m.change}</Text>
                    </View>
                  </View>
                </AnimatedCard>
              )
            })}
          </View>

          {/* ─── 5. DAILY PROGRESS ─── */}
          <AnimatedCard delay={520}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Daily Progress</Text>
            </View>
          </AnimatedCard>
          <AnimatedCard delay={560}>
            <View style={styles.progressCard}>
              <View style={styles.progressTop}>
                <Text style={styles.progressPct}>{PROGRESS_PCT}% Complete</Text>
                <Text style={styles.progressCount}>
                  {DAILY_LOGS.filter(l => l.done).length} of {DAILY_LOGS.length} daily logs submitted
                </Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${PROGRESS_PCT}%` }]} />
              </View>
              <View style={styles.progressLogs}>
                {DAILY_LOGS.map((log) => (
                  <View key={log.key} style={styles.progressLogItem}>
                    <View style={[styles.progressDot, { backgroundColor: log.done ? '#16A34A' : '#D1D5DB' }]} />
                    <Text style={[styles.progressLogLabel, log.done && styles.progressLogDone]}>
                      {log.label}
                    </Text>
                    {log.done && <GoonaIcon icon={Icons.checkCircle} size={10} color="#16A34A" />}
                  </View>
                ))}
              </View>
            </View>
          </AnimatedCard>

          {/* ─── 6. GOONA IQ INSIGHTS ─── */}
          <AnimatedCard delay={640}>
            <View style={styles.sectionHeader}>
              <GoonaIcon icon={Icons.sparkles} size={16} color="#2E7D32" />
              <Text style={[styles.sectionTitle, { marginLeft: 6 }]}>GOONA IQ Insights</Text>
            </View>
          </AnimatedCard>
          {IQ_INSIGHTS.map((ins, i) => {
            const IconComp = ins.icon
            const severityColor = ins.severity === 'elevated' ? '#EF4444' : ins.severity === 'low' ? '#F59E0B' : '#16A34A'
            return (
              <AnimatedCard key={ins.title} delay={680 + i * 80}>
                <View style={[styles.iqCard, { backgroundColor: ins.bg }]}>
                  <View style={[styles.iqIcon, { backgroundColor: severityColor + '20' }]}>
                    <GoonaIcon icon={IconComp} size={18} color={severityColor} />
                  </View>
                  <View style={styles.iqContent}>
                    <View style={styles.iqTop}>
                      <Text style={styles.iqTitle}>{ins.title}</Text>
                      <View style={[styles.iqBadge, { backgroundColor: severityColor + '20' }]}>
                        <Text style={[styles.iqBadgeText, { color: severityColor }]}>
                          {ins.severity === 'elevated' ? 'Alert' : ins.severity === 'low' ? 'Review' : 'Normal'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.iqDesc}>{ins.desc}</Text>
                  </View>
                </View>
              </AnimatedCard>
            )
          })}

          {/* ─── 7. RECENT ACTIVITY ─── */}
          <AnimatedCard delay={920}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
            </View>
          </AnimatedCard>
          <View style={styles.activityList}>
            {RECENT_ACTIVITY.map((act, i) => {
              const IconComp = act.icon
              return (
                <AnimatedCard key={i} delay={960 + i * 60}>
                  <View style={styles.activityCard}>
                    <View style={[styles.activityIcon, { backgroundColor: act.iconBg }]}>
                      <GoonaIcon icon={IconComp} size={18} color={act.iconColor} />
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityContext}>{act.date}  •  {act.batch}</Text>
                      <Text style={styles.activityTitle}>{act.title}</Text>
                      <Text style={styles.activityTime}>{act.time}</Text>
                    </View>
                  </View>
                </AnimatedCard>
              )
            })}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {quickLogType && (
        <QuickLogSheet
          visible={!!quickLogType}
          type={quickLogType}
          batch={selectedBatch}
          dateStr={dateStr}
          onClose={closeQuickLog}
          onSave={closeQuickLog}
        />
      )}

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

  bgGlow: { position: 'absolute', top: -40, right: -40, width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(232,245,233,0.3)', zIndex: 0 },
  bgContour1: { position: 'absolute', top: '5%', left: '-10%', width: 320, height: 100, zIndex: 0, borderWidth: 1, borderColor: 'rgba(46,125,50,0.04)', borderTopLeftRadius: 160, borderTopRightRadius: 160, borderBottomWidth: 0, transform: [{ rotate: '6deg' }] },
  bgContour2: { position: 'absolute', bottom: '10%', right: '-10%', width: 250, height: 80, zIndex: 0, borderWidth: 1, borderColor: 'rgba(46,125,50,0.04)', borderBottomLeftRadius: 125, borderBottomRightRadius: 125, borderTopWidth: 0, transform: [{ rotate: '-8deg' }] },

  scroll: { flex: 1, zIndex: 1 },
  scrollInner: { paddingHorizontal: 20, paddingTop: 0 },

  topNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 54 },
  navBack: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  topTitle: { fontWeight: '700', fontSize: 20, color: '#1B1B1B' },
  spacer: { width: 36 },

  headerSection: { marginTop: 10 },
  headerLabel: { fontSize: 11, fontWeight: '600', color: '#2E7D32', letterSpacing: 2, textTransform: 'uppercase' },
  headerTitle: { fontWeight: '800', fontSize: 30, lineHeight: 38, color: '#1B1B1B', marginTop: 4 },

  /* ─── CONTEXT BANNER ─── */
  contextBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F0FDF4', borderRadius: 14,
    paddingVertical: 10, paddingHorizontal: 16, marginTop: 12,
    borderWidth: 1, borderColor: '#DCFCE7',
  },
  contextSection: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'center' },
  contextDivider: { width: 1, height: 20, backgroundColor: '#DCFCE7', marginHorizontal: 8 },
  contextText: { fontSize: 13, fontWeight: '600', color: '#166534' },

  /* date picker */
  datePickerWrap: { backgroundColor: 'white', borderRadius: 24, marginTop: 12, paddingTop: 8, overflow: 'hidden' },
  dateDoneBtn: { height: 48, alignItems: 'center', justifyContent: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9', marginHorizontal: 16 },
  dateDoneText: { fontSize: 15, fontWeight: '600', color: '#2E7D32' },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 22, marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1B1B1B' },

  /* ─── PILLS ─── */
  pillScroll: { gap: 12, paddingRight: 20, paddingVertical: 2 },
  pillCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 18, paddingHorizontal: 24, borderRadius: 18,
    borderWidth: 1.5, minHeight: 72,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  pillEmoji: { fontSize: 28 },
  pillLabel: { fontSize: 16, fontWeight: '700' },

  /* ─── SNAPSHOT ─── */
  snapshotGrid: { gap: 8 },
  snapCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 16,
    padding: 14, borderLeftWidth: 3, borderLeftColor: '#16A34A',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  snapIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12, flexShrink: 0 },
  snapContent: { flex: 1 },
  snapValue: { fontSize: 18, fontWeight: '800', color: '#1B1B1B' },
  snapLabel: { fontSize: 11, fontWeight: '500', color: '#94A3B8', marginTop: 1 },
  snapTrend: { flexDirection: 'row', alignItems: 'center', gap: 3, flexShrink: 0 },
  snapChange: { fontSize: 10, fontWeight: '600' },

  /* ─── PROGRESS ─── */
  progressCard: { backgroundColor: 'white', borderRadius: 20, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  progressPct: { fontSize: 20, fontWeight: '800', color: '#1B1B1B' },
  progressCount: { fontSize: 11, fontWeight: '500', color: '#94A3B8' },
  progressBarBg: { height: 8, borderRadius: 4, backgroundColor: '#F1F5F9', overflow: 'hidden', marginBottom: 14 },
  progressBarFill: { height: '100%', borderRadius: 4, backgroundColor: '#2E7D32' },
  progressLogs: { gap: 6 },
  progressLogItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressDot: { width: 8, height: 8, borderRadius: 4 },
  progressLogLabel: { fontSize: 12, fontWeight: '500', color: '#94A3B8', flex: 1 },
  progressLogDone: { color: '#1B1B1B', fontWeight: '600' },

  /* ─── IQ INSIGHTS ─── */
  iqCard: { flexDirection: 'row', gap: 12, borderRadius: 16, padding: 14, marginBottom: 8 },
  iqIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  iqContent: { flex: 1 },
  iqTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  iqTitle: { fontSize: 14, fontWeight: '700', color: '#1B1B1B', flex: 1 },
  iqBadge: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 6, marginLeft: 8 },
  iqBadgeText: { fontSize: 10, fontWeight: '700' },
  iqDesc: { fontSize: 12, color: '#64748B', lineHeight: 16 },

  /* ─── ACTIVITY ─── */
  activityList: { gap: 8 },
  activityCard: {
    flexDirection: 'row', gap: 12,
    backgroundColor: 'white', borderRadius: 16, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  activityIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  activityContent: { flex: 1 },
  activityContext: { fontSize: 11, fontWeight: '600', color: '#2E7D32', marginBottom: 2 },
  activityTitle: { fontSize: 14, fontWeight: '700', color: '#1B1B1B' },
  activityTime: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
})
