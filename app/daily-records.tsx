import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, TextInput, ScrollView, Alert, ToastAndroid,
  StyleSheet, KeyboardAvoidingView, Platform,
  Modal, Pressable,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { router } from 'expo-router'
import { Icons } from '../shared/icons'
import Animated, {
  FadeInUp, FadeInDown, useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import GoonaIcon from '../components/ui/GoonaIcon'
import DateTimePicker from '@react-native-community/datetimepicker'
import * as Haptics from 'expo-haptics'
import { useFarmChatStore, type FeedPost } from '../store/useFarmChatStore'
import { useHistoryStore } from '../store/useHistoryStore'

const RECORD_TYPES = [
  { key: 'feed' as const, label: 'Feed + Water', icon: Icons.wheat, iconBg: '#FFFBEB', iconColor: '#F59E0B', emoji: '\uD83C\uDF3D' },
  { key: 'eggs' as const, label: 'Egg production', icon: Icons.egg, iconBg: '#F0FDF4', iconColor: '#16A34A', emoji: '\uD83E\uDD5A' },
  { key: 'mortality' as const, label: 'Mortality', icon: Icons.skull, iconBg: '#FFF1F2', iconColor: '#EF4444', emoji: '\uD83D\uDC80' },
  { key: 'medication' as const, label: 'Medication', icon: Icons.pill, iconBg: '#EEF3FF', iconColor: '#1A56FF', emoji: '\uD83D\uDC8A' },
  { key: 'inventory' as const, label: 'Stock Purchase', icon: Icons.package, iconBg: '#DDF5F0', iconColor: '#0F766E', emoji: '\uD83D\uDCE6' },
  { key: 'observation' as const, label: 'Note', icon: Icons.eye, iconBg: '#F5F3FF', iconColor: '#8B5CF6', emoji: '\uD83D\uDCDD' },
] as const

const BATCHES = [
  'Broiler Batch A',
  'Layer Batch B',
  'Starter Pen C',
  'Turkey Unit',
  'Poultry Expansion Batch',
]

const BATCH_META: Record<string, { birds: number; activeFeedType: string }> = {
  'Broiler Batch A': { birds: 500, activeFeedType: 'Grower' },
  'Layer Batch B': { birds: 350, activeFeedType: 'Layer Mash' },
  'Starter Pen C': { birds: 220, activeFeedType: 'Starter' },
  'Turkey Unit': { birds: 90, activeFeedType: 'Grower' },
  'Poultry Expansion Batch': { birds: 300, activeFeedType: 'Finisher' },
}

const FEED_TYPES = ['Starter', 'Grower', 'Finisher', 'Layer Mash'] as const
type RecordKey = (typeof RECORD_TYPES)[number]['key']
type QuickLogValues = Record<string, string>

const SNAPSHOT_METRICS = [
  { label: 'Feed Logged', value: '120 kg', icon: Icons.wheat, color: '#F59E0B', bg: '#FFFBEB', trend: 'up' as const, change: '+8% vs yesterday' },
  { label: 'Mortality', value: '2 birds', icon: Icons.skull, color: '#EF4444', bg: '#FFF1F2', trend: 'down' as const, change: '-1 vs yesterday' },
  { label: 'Egg Production', value: '360 eggs', icon: Icons.egg, color: '#16A34A', bg: '#F0FDF4', trend: 'up' as const, change: '+5% vs yesterday' },
  { label: 'Stock Balance', value: '0 kg', icon: Icons.package, color: '#0F766E', bg: '#DDF5F0', trend: 'up' as const, change: 'Feed stock' },
]

const DAILY_LOGS = [
  { key: 'feed', label: 'Feed + Water', done: true },
  { key: 'mortality', label: 'Mortality', done: true },
  { key: 'medication', label: 'Medication', done: false },
  { key: 'eggs', label: 'Egg Production', done: true },
  { key: 'inventory', label: 'Stock Purchase', done: false },
  { key: 'observation', label: 'Notes', done: false },
]


const IQ_INSIGHTS = [
  { icon: Icons.trendingUp, color: '#F59E0B', bg: '#FFFBEB', title: 'Feed Consumption', desc: 'Feed consumption is 12% below expected for this cycle. Consider reviewing feed formulation.', severity: 'low' as const },
  { icon: Icons.trendingDown, color: '#16A34A', bg: '#F0FDF4', title: 'Mortality Trend', desc: 'Mortality trend is normal at 0.4% — well below the 2% threshold. Continue current practices.', severity: 'normal' as const },
  { icon: Icons.alertTriangle, color: '#EF4444', bg: '#FEF2F2', title: 'Water Usage Alert', desc: 'Water usage elevated by 8% today. Check for leaks or adjust drinker pressure.', severity: 'elevated' as const },
]


/* ─── Form Field ─── */
function parseFormattedNumber(value?: string) {
  if (!value) return 0
  return Number(value.replace(/,/g, '')) || 0
}

function formatNumberWithCommas(raw: string, decimals = 0) {
  const cleaned = raw.replace(/[^\d.]/g, '')
  const [whole = '', ...decimalParts] = cleaned.split('.')
  const normalizedWhole = whole.replace(/^0+(?=\d)/, '')
  const formattedWhole = normalizedWhole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  if (decimals <= 0) return formattedWhole
  if (!decimalParts.length) return formattedWhole
  const decimal = decimalParts.join('').slice(0, decimals)
  return `${formattedWhole || '0'}.${decimal}`
}

function FormField({
  label, placeholder, prefix, suffix, icon, value, onChangeText, multiline, autoFocus, onFocus, formatNumber, numericDecimals = 0, error, showError = true,
}: {
  label: string; placeholder?: string; prefix?: string; suffix?: string
  icon?: React.ReactNode; value?: string; onChangeText?: (v: string) => void; multiline?: boolean; autoFocus?: boolean; onFocus?: () => void; formatNumber?: boolean; numericDecimals?: number; error?: string; showError?: boolean
}) {
  const [focused, setFocused] = useState(false)
  const [localValue, setLocalValue] = useState(value ?? '')
  const displayValue = value ?? localValue
  const handleChangeText = (next: string) => {
    const formatted = formatNumber ? formatNumberWithCommas(next, numericDecimals) : next
    if (value === undefined) setLocalValue(formatted)
    onChangeText?.(formatted)
  }

  return (
    <View style={ffStyles.group}>
      <View style={[ffStyles.wrap, focused && ffStyles.wrapFocused, error && showError && ffStyles.wrapError, multiline && ffStyles.wrapTextarea]}>
        {icon ? <View style={ffStyles.ico}>{icon}</View> : null}
        {prefix ? <Text style={ffStyles.prefix}>{prefix}</Text> : null}
        <View style={ffStyles.inner}>
          {focused || displayValue ? <Text style={ffStyles.lbl}>{label}</Text> : null}
          <TextInput
            style={ffStyles.input}
            placeholder={placeholder}
            placeholderTextColor="#B0BEC5"
            value={displayValue}
            onChangeText={handleChangeText}
            onFocus={() => { setFocused(true); onFocus?.() }}
            onBlur={() => setFocused(false)}
            keyboardType={formatNumber ? 'decimal-pad' : 'default'}
            multiline={multiline}
            autoFocus={autoFocus}
            textAlignVertical={multiline ? 'top' : 'center'}
          />
        </View>
        {suffix ? <Text style={ffStyles.suffix}>{suffix}</Text> : null}
      </View>
      {error && showError ? <Text style={ffStyles.errorText}>{error}</Text> : null}
    </View>
  )
}
const ffStyles = StyleSheet.create({
  group: { marginBottom: 14 },
  wrap: { flexDirection: 'row', alignItems: 'center', height: 50, borderRadius: 14, backgroundColor: '#F8FAF7', borderWidth: 1.5, borderColor: '#E2E8F0', paddingHorizontal: 14, gap: 8 },
  wrapFocused: { borderColor: '#2E7D32' },
  wrapError: { borderColor: '#EF4444', backgroundColor: '#FFF7F7' },
  wrapTextarea: { minHeight: 72, alignItems: 'flex-start', paddingTop: 10 },
  ico: { width: 16, height: 16, flexShrink: 0 },
  inner: { flex: 1, minWidth: 0, justifyContent: 'center' },
  lbl: { fontSize: 10, fontWeight: '500', color: '#A0AEA1', marginBottom: 1 },
  input: { minWidth: 0, fontSize: 14, fontWeight: '500', color: '#1B1B1B', padding: 0, paddingVertical: 0, includeFontPadding: false },
  prefix: { fontSize: 14, lineHeight: 18, fontWeight: '700', color: '#1B1B1B', flexShrink: 0, alignSelf: 'center' },
  suffix: { fontSize: 14, fontWeight: '600', color: '#1B1B1B', flexShrink: 0 },
  errorText: { marginTop: 6, marginBottom: 10, fontSize: 11, fontWeight: '700', color: '#EF4444' },
})

/* ─── Quick Log Bottom Sheet (keyboard-aware) ─── */
function QuickLogSheet({
  visible, type, onClose, batch, dateStr, timeStr, selectedDate, selectedTime, lastFeedType, onTypeChange, onBatchSelect, onDateSelect, onTimeSelect, onSave,
}: {
  visible: boolean; type: RecordKey; onClose: () => void
  batch: string; dateStr: string; timeStr: string; selectedDate: Date; selectedTime: Date; lastFeedType?: string
  onTypeChange: (type: RecordKey) => void; onBatchSelect: (batch: string) => void; onDateSelect: (date: Date) => void; onTimeSelect: (date: Date) => void; onSave?: (values: QuickLogValues) => void
}) {
  const scrollRef = useRef<ScrollView>(null)
  const [showBatchOptions, setShowBatchOptions] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [values, setValues] = useState<QuickLogValues>({})
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Set<string>>(new Set())
  const [formWarning, setFormWarning] = useState('')
  const batchInfo = BATCH_META[batch] ?? { birds: 0, activeFeedType: 'Grower' }

  const qty = parseFormattedNumber(values.quantity || values.water || values.eggs || values.mortality)
  const feedQty = parseFormattedNumber(values.quantity)
  const waterQty = parseFormattedNumber(values.water)
  const realisticFeedMax = Math.max(50, Math.ceil(batchInfo.birds * 0.25))
  const feedType = values.feedType || lastFeedType || batchInfo.activeFeedType
  const balance = useHistoryStore.getState().getFeedStockBalance()
  const stockWarning = balance.remainingKg > 0 && feedQty > balance.remainingKg
  const saveDisabled = Object.keys(fieldErrors).length > 0 || (type === 'feed' && (!feedType || feedQty <= 0)) || (type === 'eggs' && qty <= 0) || (type === 'mortality' && values.mortality === undefined) || (type === 'medication' && !values.medication?.trim()) || (type === 'inventory' && (!values.itemName?.trim() || feedQty <= 0 || parseFormattedNumber(values.cost) <= 0)) || (type === 'observation' && !values.notes?.trim())

  useEffect(() => {
    if (!visible) return
    const initialFeedType = lastFeedType || (BATCH_META[batch]?.activeFeedType ?? 'Grower')
    setValues(type === 'feed' ? { feedType: initialFeedType } : {})
    setFieldErrors({})
    setTouched(new Set())
    setFormWarning('')
    setShowBatchOptions(false)
    setShowDatePicker(false)
    setShowTimePicker(false)
  }, [visible, type, batch, lastFeedType])

  const validate = (next: QuickLogValues) => {
    const errors: Record<string, string> = {}
    const nextFeedQty = parseFormattedNumber(next.quantity)
    const nextWater = parseFormattedNumber(next.water)
    const nextEggs = parseFormattedNumber(next.eggs)
    const nextMortality = parseFormattedNumber(next.mortality)
    let warning = ''

    if (type === 'feed') {
      if (!next.feedType?.trim()) errors.feedType = 'Choose a feed type.'
      if (nextFeedQty <= 0) errors.quantity = 'Enter feed used in kg.'
      else if (nextFeedQty > realisticFeedMax) warning = 'That quantity looks high for this batch. Please confirm before saving.'
    }
    if (type === 'eggs' && nextEggs <= 0) errors.eggs = 'Enter eggs collected.'
    if (type === 'mortality' && next.mortality !== undefined && nextMortality > batchInfo.birds) errors.mortality = 'Mortality cannot exceed batch size.'
    if (type === 'medication' && next.medication !== undefined && !next.medication.trim()) errors.medication = 'Enter medication name.'
    if (type === 'inventory') {
      if (!next.itemName?.trim()) errors.itemName = 'Enter item name.'
      if (nextFeedQty <= 0) errors.quantity = 'Enter quantity in kg.'
      if (parseFormattedNumber(next.cost) <= 0) errors.cost = 'Enter amount paid.'
    }
    if (type === 'observation' && next.notes !== undefined && !next.notes.trim()) errors.notes = 'Enter a note before saving.'

    setFieldErrors(errors)
    setFormWarning(warning)
    return { errors, warning }
  }

  const setField = (key: string, value: string) => {
    setTouched((prev) => new Set(prev).add(key))
    setValues((current) => {
      const next = { ...current, [key]: value }
      validate(next)
      return next
    })
  }

  const handleCancel = () => {
    const dirty = Object.values(values).some((v) => v?.trim())
    if (!dirty) { onClose(); return }
    Alert.alert('Discard log?', 'Your entered log details will be lost.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: onClose },
    ])
  }

  const handleSave = () => {
    const allKeys = Object.keys(values)
    setTouched(new Set(allKeys))
    const { errors, warning } = validate(values)
    if (Object.keys(errors).length > 0) return
    if (warning && !values.confirmedHigh) {
      setValues((current) => ({ ...current, confirmedHigh: 'true' }))
      setFormWarning(`${warning} Tap Save again to confirm.`)
      return
    }
    onSave?.(values)
  }

  const scrollToInput = () => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150)

  const handleTypeChange = (nextType: RecordKey) => {
    if (nextType === type) return
    setShowBatchOptions(false)
    setShowDatePicker(false)
    setShowTimePicker(false)
    setFieldErrors({})
    setFormWarning('')
    scrollRef.current?.scrollTo({ y: 0, animated: true })
    onTypeChange(nextType)
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleCancel}>
      <KeyboardAvoidingView style={qsStyles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <TouchableOpacity style={qsStyles.backdrop} activeOpacity={1} onPress={handleCancel} />
        <Animated.View entering={FadeInDown.duration(350).springify()} style={qsStyles.sheet}>
          <View style={qsStyles.handle} />
          <ScrollView ref={scrollRef} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={qsStyles.scrollContent}>
            <View style={qsStyles.logContext}>
              <Text style={qsStyles.contextTitle}>Log Context</Text>
              <View style={qsStyles.contextGrid}>
                <TouchableOpacity style={[qsStyles.contextField, qsStyles.contextFieldWide]} activeOpacity={0.75} onPress={() => setShowBatchOptions(!showBatchOptions)}><GoonaIcon icon={Icons.clipboardList} size={18} color="#2E7D32" /><View style={qsStyles.contextFieldText}><Text style={qsStyles.contextLabel}>Batch</Text><Text style={qsStyles.contextValue}>{batch}</Text></View><GoonaIcon icon={Icons.chevronDown} size={14} color="#2E7D32" /></TouchableOpacity>
                <TouchableOpacity style={qsStyles.contextField} activeOpacity={0.75} onPress={() => setShowDatePicker(true)}><GoonaIcon icon={Icons.calendar} size={18} color="#2E7D32" /><View style={qsStyles.contextFieldText}><Text style={qsStyles.contextLabel}>Date</Text><Text style={qsStyles.contextValue}>{dateStr}</Text></View><GoonaIcon icon={Icons.chevronDown} size={14} color="#2E7D32" /></TouchableOpacity>
                <TouchableOpacity style={qsStyles.contextField} activeOpacity={0.75} onPress={() => setShowTimePicker(true)}><GoonaIcon icon={Icons.clock} size={18} color="#2E7D32" /><View style={qsStyles.contextFieldText}><Text style={qsStyles.contextLabel}>Time</Text><Text style={qsStyles.contextValue}>{timeStr}</Text></View><GoonaIcon icon={Icons.chevronDown} size={14} color="#2E7D32" /></TouchableOpacity>
              </View>

            <LogTypeSelector types={RECORD_TYPES} activeKey={type} onSelect={handleTypeChange} />
              {showBatchOptions && <View style={qsStyles.batchOptions}>{BATCHES.map((item) => <TouchableOpacity key={item} style={[qsStyles.batchOption, item === batch && qsStyles.batchOptionActive]} activeOpacity={0.75} onPress={() => { onBatchSelect(item); setShowBatchOptions(false) }}><Text style={[qsStyles.batchOptionText, item === batch && qsStyles.batchOptionTextActive]}>{item}</Text>{item === batch ? <GoonaIcon icon={Icons.check} size={14} color="#2E7D32" /> : null}</TouchableOpacity>)}</View>}
              {showDatePicker && <View style={qsStyles.inlinePicker}><DateTimePicker value={selectedDate} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(_event, date) => { if (Platform.OS === 'android') setShowDatePicker(false); if (date) onDateSelect(date) }} themeVariant="light" />{Platform.OS === 'ios' && <TouchableOpacity style={qsStyles.inlineDone} onPress={() => setShowDatePicker(false)}><Text style={qsStyles.inlineDoneText}>Done</Text></TouchableOpacity>}</View>}
              {showTimePicker && <View style={qsStyles.inlinePicker}><DateTimePicker value={selectedTime} mode="time" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(_event, date) => { if (Platform.OS === 'android') setShowTimePicker(false); if (date) onTimeSelect(date) }} themeVariant="light" />{Platform.OS === 'ios' && <TouchableOpacity style={qsStyles.inlineDone} onPress={() => setShowTimePicker(false)}><Text style={qsStyles.inlineDoneText}>Done</Text></TouchableOpacity>}</View>}
            </View>

    {type === 'feed' && (
              <View>
                <Text style={qsStyles.sheetTitle}>Log Feed + Water</Text>
                {balance.remainingKg > 0 && (
                  <View style={qsStyles.stockInfo}>
                    <Text style={qsStyles.stockInfoText}>
                      Feed stock: {balance.remainingKg.toLocaleString()} kg remaining
                    </Text>
                  </View>
                )}
                <Text style={qsStyles.fieldLabel}>Feed Type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={qsStyles.chipRail}>
                  {FEED_TYPES.map((item) => (
                    <TouchableOpacity key={item} activeOpacity={0.8} style={[qsStyles.choiceChip, feedType === item && qsStyles.choiceChipActive]} onPress={() => setField('feedType', item)}>
                      <Text style={[qsStyles.choiceChipText, feedType === item && qsStyles.choiceChipTextActive]}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <FormField label="Feed Given (required)" placeholder="0.0 kg" suffix="kg" value={values.quantity} onChangeText={(v) => setField('quantity', v)} formatNumber numericDecimals={1} error={fieldErrors.quantity} showError={touched.has('quantity')} />
                <FormField label="Water Used (optional)" placeholder="0 L" suffix="L" value={values.water} onChangeText={(v) => setField('water', v)} formatNumber numericDecimals={1} />
                {stockWarning && <Text style={qsStyles.warnText}>Feed given exceeds remaining stock ({balance.remainingKg.toLocaleString()} kg). Purchase more feed first.</Text>}
                {formWarning ? <Text style={qsStyles.warnText}>{formWarning}</Text> : null}
                <FormField label="Notes" placeholder="Optional..." value={values.notes} onChangeText={(v) => setField('notes', v)} icon={<GoonaIcon icon={Icons.fileText} size={16} color="#A0AEA1" />} multiline onFocus={scrollToInput} />
              </View>
            )}
            {type === 'mortality' && <View><Text style={qsStyles.sheetTitle}>Log Mortality</Text><FormField label="Number of Birds Lost" placeholder="0" value={values.mortality} onChangeText={(v) => setField('mortality', v)} formatNumber numericDecimals={0} autoFocus error={fieldErrors.mortality} /><FormField label="Suspected Cause" placeholder="e.g. Heat stress" value={values.cause} onChangeText={(v) => setField('cause', v)} icon={<GoonaIcon icon={Icons.fileText} size={16} color="#A0AEA1" />} onFocus={scrollToInput} /><FormField label="Notes" placeholder="Optional..." value={values.notes} onChangeText={(v) => setField('notes', v)} icon={<GoonaIcon icon={Icons.fileText} size={16} color="#A0AEA1" />} multiline onFocus={scrollToInput} /></View>}
            {type === 'medication' && <View><Text style={qsStyles.sheetTitle}>Log Medication</Text><FormField label="Medication Name" placeholder="e.g. Newcastle vaccine" value={values.medication} onChangeText={(v) => setField('medication', v)} icon={<GoonaIcon icon={Icons.pill} size={16} color="#A0AEA1" />} autoFocus error={fieldErrors.medication} /><FormField label="Quantity Administered" placeholder="e.g. 1 vial (500 doses)" value={values.dose} onChangeText={(v) => setField('dose', v)} onFocus={scrollToInput} /><FormField label="Notes" placeholder="Optional..." value={values.notes} onChangeText={(v) => setField('notes', v)} icon={<GoonaIcon icon={Icons.fileText} size={16} color="#A0AEA1" />} multiline onFocus={scrollToInput} /></View>}
            {type === 'eggs' && <View><Text style={qsStyles.sheetTitle}>Log Egg Production</Text><FormField label="Eggs Collected" placeholder="0 eggs" suffix="eggs" value={values.eggs} onChangeText={(v) => setField('eggs', v)} formatNumber numericDecimals={0} autoFocus error={fieldErrors.eggs} showError={touched.has('eggs')} /><FormField label="Estimated Value" placeholder="0" prefix={'\u20A6'} value={values.value} onChangeText={(v) => setField('value', v)} formatNumber numericDecimals={0} onFocus={scrollToInput} /><FormField label="Notes" placeholder="Optional..." value={values.notes} onChangeText={(v) => setField('notes', v)} icon={<GoonaIcon icon={Icons.fileText} size={16} color="#A0AEA1" />} multiline onFocus={scrollToInput} /></View>}
            {type === 'water' && <View><Text style={qsStyles.sheetTitle}>Log Water Usage</Text><FormField label="Water Used" placeholder="0 litres" suffix="L" value={values.water} onChangeText={(v) => setField('water', v)} formatNumber numericDecimals={1} autoFocus error={fieldErrors.water} /><FormField label="Notes" placeholder="Optional..." value={values.notes} onChangeText={(v) => setField('notes', v)} icon={<GoonaIcon icon={Icons.fileText} size={16} color="#A0AEA1" />} multiline onFocus={scrollToInput} /></View>}
            {type === 'inventory' && (
              <View>
                <Text style={qsStyles.sheetTitle}>Log Stock Purchase</Text>
                <FormField label="Item Name" placeholder="e.g. Broiler Starter Feed" value={values.itemName} onChangeText={(v) => setField('itemName', v)} autoFocus error={fieldErrors.itemName} showError={touched.has('itemName')} />
                <FormField label="Quantity Purchased" placeholder="0 kg" suffix="kg" value={values.quantity} onChangeText={(v) => setField('quantity', v)} formatNumber numericDecimals={1} error={fieldErrors.quantity} showError={touched.has('quantity')} />
                <FormField label="Amount Paid" placeholder="0" prefix={'\u20A6'} value={values.cost} onChangeText={(v) => setField('cost', v)} formatNumber numericDecimals={0} onFocus={scrollToInput} error={fieldErrors.cost} showError={touched.has('cost')} />
                <FormField label="Supplier" placeholder="Optional" value={values.supplier} onChangeText={(v) => setField('supplier', v)} icon={<GoonaIcon icon={Icons.building2} size={16} color="#A0AEA1" />} />
                <FormField label="Notes" placeholder="Optional..." value={values.notes} onChangeText={(v) => setField('notes', v)} icon={<GoonaIcon icon={Icons.fileText} size={16} color="#A0AEA1" />} multiline onFocus={scrollToInput} />
              </View>
            )}
            {type === 'observation' && <View><Text style={qsStyles.sheetTitle}>Add Observation Note</Text><FormField label="Notes" placeholder="Describe what you observed..." value={values.notes} onChangeText={(v) => setField('notes', v)} icon={<GoonaIcon icon={Icons.eye} size={16} color="#A0AEA1" />} multiline autoFocus error={fieldErrors.notes} /></View>}
          </ScrollView>
          <View style={qsStyles.actionRow}><TouchableOpacity style={qsStyles.cancelBtn} activeOpacity={0.85} onPress={handleCancel}><Text style={qsStyles.cancelText}>Cancel</Text></TouchableOpacity><TouchableOpacity style={[qsStyles.saveBtn, saveDisabled && qsStyles.saveBtnDisabled]} activeOpacity={0.9} disabled={saveDisabled} onPress={handleSave}><GoonaIcon icon={Icons.checkCircle} size={18} color="white" /><Text style={qsStyles.saveText}>Save Record</Text></TouchableOpacity></View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  )
}
/* ─── Premium Log-Type Selector ─── */
function TypePill({
  type: record, active, onPress, onLayout,
}: {
  type: typeof RECORD_TYPES[number]
  active: boolean
  onPress: () => void
  onLayout?: (w: number) => void
}) {
  const scale = useSharedValue(1)

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const handlePressIn = () => {
    scale.value = withSpring(active ? 1.06 : 0.94, { damping: 14, stiffness: 200 })
  }
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 14, stiffness: 200 })
  }

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          onPress()
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLayout={(e) => onLayout?.(e.nativeEvent.layout.width)}
        style={({ pressed }) => [
          tStyles.typeChip,
          active ? tStyles.typeChipActiveOuter : tStyles.typeChipInactive,
          pressed && !active && tStyles.typeChipPressed,
        ]}
      >
        {active ? (
          <LinearGradient
            colors={['#2E7D32', '#1B5E20']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={tStyles.typeChipGradient}
          />
        ) : null}
        <GoonaIcon
          icon={record.icon}
          size={15}
          color={active ? '#FFFFFF' : record.iconColor}
        />
        <Text
          style={[tStyles.typeChipText, active && tStyles.typeChipTextActive]}
          numberOfLines={1}
        >
          {record.label}
        </Text>
      </Pressable>
    </Animated.View>
  )
}

function LogTypeSelector({
  types, activeKey, onSelect,
}: {
  types: typeof RECORD_TYPES
  activeKey: string
  onSelect: (key: RecordKey) => void
}) {
  const scrollRef = useRef<ScrollView>(null)
  const widths = useRef<Record<string, number>>({})
  const activeIndex = types.findIndex((t) => t.key === activeKey)

  const getOffset = useCallback((idx: number) => {
    let offset = 0
    for (let i = 0; i < idx; i++) {
      offset += (widths.current[types[i].key] ?? 100) + 8
    }
    return offset
  }, [types])

  useEffect(() => {
    if (activeIndex < 0) return
    const timer = setTimeout(() => {
      const offset = getOffset(activeIndex) - 16
      scrollRef.current?.scrollTo({ x: Math.max(0, offset), animated: true })
    }, 100)
    return () => clearTimeout(timer)
  }, [activeKey, activeIndex, getOffset])

  return (
    <View style={tStyles.wrapper}>
      <View style={tStyles.divider} />
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        decelerationRate="fast"
        contentContainerStyle={tStyles.rail}
      >
        {types.map((record) => (
          <TypePill
            key={record.key}
            type={record}
            active={record.key === activeKey}
            onPress={() => onSelect(record.key)}
            onLayout={(w) => { widths.current[record.key] = w }}
          />
        ))}
      </ScrollView>
      <LinearGradient
        start={{ x: 0.85, y: 0 }}
        end={{ x: 1, y: 0 }}
        colors={['transparent', '#F0FDF4']}
        style={tStyles.edgeFade}
        pointerEvents="none"
      />
    </View>
  )
}

const tStyles = StyleSheet.create({
  wrapper: { position: 'relative', marginTop: 14, marginBottom: 6 },
  divider: { height: 1, backgroundColor: '#D8ECD8', marginBottom: 14 },
  rail: { gap: 8, paddingLeft: 2, paddingRight: 36, paddingVertical: 4 },
  typeChip: {
    position: 'relative',
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  typeChipActiveOuter: {
    backgroundColor: '#2E7D32',
    borderWidth: 1,
    borderColor: '#1B5E20',
    shadowColor: '#1B5E20',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  typeChipInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8ECD8',
  },
  typeChipPressed: {
    backgroundColor: '#E8F5E9',
  },
  typeChipGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
  },
  typeChipText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#64748B',
  },
  typeChipTextActive: {
    color: '#FFFFFF',
  },
  edgeFade: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 48,
    borderTopRightRadius: 999,
    borderBottomRightRadius: 999,
  },
})

const qsStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: { backgroundColor: 'white', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20, maxHeight: '85%' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB', alignSelf: 'center', marginBottom: 12 },
  logContext: { backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#B7E4C7', borderRadius: 18, padding: 14, marginBottom: 20 },
  contextTitle: { fontSize: 11, fontWeight: '800', color: '#166534', letterSpacing: 1.6, textTransform: 'uppercase', marginBottom: 10 },
  contextGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  contextField: { flex: 1, minWidth: '46%', minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'white', borderRadius: 14, borderWidth: 1, borderColor: '#D8ECD8', paddingHorizontal: 12, paddingVertical: 10 },
  contextFieldWide: { minWidth: '100%' },
  contextFieldText: { flex: 1 },
  contextLabel: { fontSize: 9, fontWeight: '800', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 },
  contextValue: { fontSize: 14, fontWeight: '800', color: '#166534' },
  batchOptions: { backgroundColor: 'white', borderRadius: 14, borderWidth: 1, borderColor: '#D8ECD8', marginTop: 10, overflow: 'hidden' },
  batchOption: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  batchOptionActive: { backgroundColor: '#F0FDF4' },
  batchOptionText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  batchOptionTextActive: { color: '#166534' },
  inlinePicker: { backgroundColor: 'white', borderRadius: 14, marginTop: 10, overflow: 'hidden' },
  inlineDone: { height: 42, alignItems: 'center', justifyContent: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  inlineDoneText: { fontSize: 14, fontWeight: '800', color: '#2E7D32' },
  errorText: { fontSize: 12, fontWeight: '700', color: '#EF4444', marginTop: -10, marginBottom: 12 },
  scrollContent: { paddingBottom: 12 },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: '#1B1B1B', marginBottom: 18 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, height: 52, borderRadius: 16, backgroundColor: '#F8FAF7', borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: 15, fontWeight: '800', color: '#64748B' },
  saveBtn: { flex: 1.35, height: 52, borderRadius: 16, backgroundColor: '#2E7D32', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  saveBtnDisabled: { opacity: 0.42 },
  fieldLabel: { fontSize: 10, fontWeight: '800', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },

  chipRail: { gap: 8, paddingRight: 20, paddingBottom: 2, marginBottom: 14 },
  choiceChip: { minHeight: 38, borderRadius: 999, borderWidth: 1, borderColor: '#D8ECD8', backgroundColor: '#fff', paddingHorizontal: 13, alignItems: 'center', justifyContent: 'center' },
  choiceChipActive: { backgroundColor: '#E6F4E9', borderColor: '#2E7D32' },
  choiceChipText: { fontSize: 12, fontWeight: '800', color: '#64748B' },
  choiceChipTextActive: { color: '#166534' },
  liveReadout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, backgroundColor: '#F8FAF7', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12, marginTop: -4, marginBottom: 12 },
  liveReadoutText: { fontSize: 13, fontWeight: '800', color: '#166534' },
  stockInfo: { backgroundColor: '#E6F4E9', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, marginBottom: 12 },
  stockInfoText: { fontSize: 13, fontWeight: '700', color: '#166534' },
  warnText: { fontSize: 12, fontWeight: '700', color: '#B45309', backgroundColor: '#FFFBEB', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10, marginBottom: 12 },  saveText: { fontSize: 15, fontWeight: '600', color: 'white' },
})

/* ─── Animated wrapper ─── */
function AnimatedCard({ children, delay }: { children: React.ReactNode; delay?: number }) {
  return (
    <Animated.View entering={FadeInUp.duration(400).delay(delay ?? 0).springify()}>
      {children}
    </Animated.View>
  )
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatDate(d: Date): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}
function buildFarmFeedPost(type: RecordKey, values: QuickLogValues, batch: string, dateStr: string, timeStr: string): FeedPost {
  const amount = (v?: string) => (v && v.trim() ? v.trim() : '0')
  const note = values.notes?.trim()
  const meta = `${batch} � ${dateStr} � ${timeStr}`
  const id = `quick-log-${type}-${Date.now()}`

  if (type === 'feed') {
    const qty = amount(values.quantity)
    const water = values.water?.trim()
    const feedName = values.feedType?.trim()
    const waterPart = water ? ` + ${water}L water` : ''
    return { id, type: 'feed_record', timestamp: Date.now(), actorName: 'GOONA Records', actorRole: 'Farm Operations', actorInitials: 'GR', actorColor: '#F59E0B', detail: `${qty}kg feed${waterPart} recorded for ${batch}${feedName ? ` \u2022 ${feedName}` : ''}.${note ? ` ${note}` : ''}`, highlight: `${qty}kg`, tags: [batch, dateStr, timeStr], batch, likes: 0, comments: 0 }
  }

  if (type === 'eggs') {
    const eggs = amount(values.eggs)
    const value = values.value?.trim()
    return { id, type: 'announcement', timestamp: Date.now(), actorName: 'GOONA Records', actorRole: 'Egg Production', actorInitials: 'GR', actorColor: '#16A34A', detail: `${eggs} eggs collected for ${batch}${value ? ` � \u20A6${value}` : ''}.${note ? ` ${note}` : ''}`, highlight: `${eggs} eggs`, tags: [batch, dateStr, timeStr], batch, likes: 0, comments: 0 }
  }

  if (type === 'water') {
    const water = amount(values.water)
    return { id, type: 'announcement', timestamp: Date.now(), actorName: 'GOONA Records', actorRole: 'Water Log', actorInitials: 'GR', actorColor: '#0EA5E9', detail: `${water}L water usage logged for ${batch}.${note ? ` ${note}` : ''}`, highlight: `${water}L`, tags: [batch, dateStr, timeStr], batch, likes: 0, comments: 0 }
  }

  if (type === 'medication') {
    const med = values.medication?.trim() || 'Medication'
    return { id, type: 'medication', timestamp: Date.now(), actorName: 'GOONA Meds', actorRole: 'Farm Operations', actorInitials: 'GM', actorColor: '#1A56FF', detail: `${med} logged for ${batch}${values.dose ? ` � ${values.dose}` : ''}.${note ? ` ${note}` : ''}`, highlight: med, tags: [batch, dateStr, timeStr], batch, likes: 0, comments: 0 }
  }

  if (type === 'mortality') {
    const lost = amount(values.mortality)
    return { id, type: 'health_report', timestamp: Date.now(), actorName: 'GOONA Health', actorRole: 'Mortality Log', actorInitials: 'GH', actorColor: '#EF4444', detail: `${lost} mortality recorded for ${batch}${values.cause ? ` \u2022 ${values.cause}` : ''}.${note ? ` ${note}` : ''}`, highlight: `${lost} birds`, tags: [batch, dateStr, timeStr], batch, likes: 0, comments: 0, isAlert: lost !== '0', alertColor: '#EF4444' }
  }

  if (type === 'inventory') {
    const item = values.itemName?.trim() || 'Stock item'
    const qty = amount(values.quantity)
    const cost = values.cost?.trim()
    return { id, type: 'announcement', timestamp: Date.now(), actorName: 'GOONA Stock', actorRole: 'Inventory', actorInitials: 'GS', actorColor: '#0F766E', detail: `${item} purchased: ${qty}kg \u2022 \u20A6${cost} for ${batch}.${note ? ` ${note}` : ''}`, highlight: `${qty}kg`, tags: [batch, dateStr, timeStr], batch, likes: 0, comments: 0 }
  }

  return { id, type: 'announcement', timestamp: Date.now(), actorName: 'GOONA Records', actorRole: 'Farm Note', actorInitials: 'GR', actorColor: '#8B5CF6', detail: `${note || 'Farm note added'} \u2022 ${meta}`, highlight: 'Note', tags: [batch, dateStr, timeStr], batch, likes: 0, comments: 0 }
}

/* ─── MAIN ─── */
export default function DailyRecordsScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedBatch, setSelectedBatch] = useState('Layer Batch B')
  const [selectedTime, setSelectedTime] = useState(new Date())
  const [quickLogType, setQuickLogType] = useState<RecordKey | null>(null)
  const [loggedToday, setLoggedToday] = useState<RecordKey[]>(['feed', 'mortality', 'eggs'])
  const [snapshotOverrides, setSnapshotOverrides] = useState<Record<string, string>>({})
  const [lastFeedByBatch, setLastFeedByBatch] = useState<Record<string, string>>({})
  const [toastMsg, setToastMsg] = useState('')
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const addFeedPost = useFarmChatStore((s) => s.addFeedPost)

  const dateStr = formatDate(selectedDate)
  const timeStr = formatTime(selectedTime)
  const openQuickLog = (key: RecordKey) => setQuickLogType(key)
  const closeQuickLog = () => setQuickLogType(null)
  const showToast = (msg: string) => {
    setToastMsg(msg)
    if (Platform.OS === 'android') ToastAndroid.show(msg, ToastAndroid.SHORT)
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToastMsg(''), 1900)
  }
  const dashboardLogs = useMemo(() => DAILY_LOGS.map((log) => ({ ...log, done: log.done || loggedToday.includes(log.key as RecordKey) })), [loggedToday])
  const progressPct = Math.round((dashboardLogs.filter(l => l.done).length / dashboardLogs.length) * 100)
  const snapshotMetrics = useMemo(() => {
    const balance = useHistoryStore.getState().getFeedStockBalance()
    return SNAPSHOT_METRICS.map((metric) => {
      if (metric.label === 'Stock Balance') {
        return { ...metric, value: `${balance.remainingKg.toLocaleString()} kg` }
      }
      return { ...metric, value: snapshotOverrides[metric.label] ?? metric.value }
    })
  }, [snapshotOverrides])
  const handleQuickLogSave = (values: QuickLogValues) => {
    if (!quickLogType) return
    const ts = new Date(selectedDate)
    ts.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0)
    const timestamp = ts.getTime()

    let recordId: string | undefined
    let feedPosted = false

    try {
      if (quickLogType === 'feed') {
        const qty = parseFormattedNumber(values.quantity)
        const feedName = values.feedType
        recordId = useHistoryStore.getState().addRecord({
          type: 'feed', batch: selectedBatch, timestamp,
          quantity: qty, unit: 'kg',
          notes: values.notes?.trim(),
          metadata: { feedType: feedName },
        })
        const waterQty = parseFormattedNumber(values.water)
        if (waterQty > 0) {
          useHistoryStore.getState().addRecord({
            type: 'water', batch: selectedBatch, timestamp,
            quantity: waterQty, unit: 'L',
            notes: values.notes?.trim(),
            feedPostId: recordId,
          })
        }
        setSnapshotOverrides((current) => ({ ...current, 'Feed Logged': `${formatNumberWithCommas(String(qty), 1)} kg` }))
        if (feedName) setLastFeedByBatch((current) => ({ ...current, [selectedBatch]: feedName }))
      }
      if (quickLogType === 'water') {
        recordId = useHistoryStore.getState().addRecord({
          type: 'water', batch: selectedBatch, timestamp,
          quantity: parseFormattedNumber(values.water), unit: 'L',
          notes: values.notes?.trim(),
        })
        setSnapshotOverrides((current) => ({ ...current, 'Water Logged': `${formatNumberWithCommas(String(parseFormattedNumber(values.water)), 1)} L` }))
      }
      if (quickLogType === 'eggs') {
        recordId = useHistoryStore.getState().addRecord({
          type: 'eggs', batch: selectedBatch, timestamp,
          quantity: parseFormattedNumber(values.eggs), unit: 'eggs',
          cost: parseFormattedNumber(values.value) || undefined,
          notes: values.notes?.trim(),
        })
        setSnapshotOverrides((current) => ({ ...current, 'Egg Production': `${formatNumberWithCommas(String(parseFormattedNumber(values.eggs)))} eggs` }))
      }
      if (quickLogType === 'mortality') {
        recordId = useHistoryStore.getState().addRecord({
          type: 'mortality', batch: selectedBatch, timestamp,
          quantity: parseFormattedNumber(values.mortality), unit: 'birds',
          notes: values.notes?.trim(),
          metadata: { cause: values.cause?.trim() },
        })
        setSnapshotOverrides((current) => ({ ...current, Mortality: `${formatNumberWithCommas(String(parseFormattedNumber(values.mortality)))} birds` }))
      }
      if (quickLogType === 'inventory') {
        const qty = parseFormattedNumber(values.quantity)
        const cost = parseFormattedNumber(values.cost)
        recordId = useHistoryStore.getState().addRecord({
          type: 'inventory', batch: selectedBatch, timestamp,
          quantity: qty, unit: 'kg', cost,
          itemName: values.itemName?.trim(),
          supplier: values.supplier?.trim(),
          notes: values.notes?.trim(),
        })
      }
    } catch (dbErr) {
      console.error('DB write failed:', dbErr)
      showToast('Failed to save record. Please try again.')
      return
    }

    setLoggedToday((current) => current.includes(quickLogType) ? current : [...current, quickLogType])

    try {
      const post = buildFarmFeedPost(quickLogType, values, selectedBatch, dateStr, timeStr)
      addFeedPost(post)
      feedPosted = true
    } catch (feedErr) {
      console.error('Farm Feed post failed:', feedErr)
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
    showToast(feedPosted ? 'Record saved \u00B7 shared to Farm Feed' : 'Record saved (feed update pending)')
    closeQuickLog()
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.bgGlow} pointerEvents="none" />
      <View style={styles.bgContour1} pointerEvents="none" />
      <View style={styles.bgContour2} pointerEvents="none" />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollInner, { paddingBottom: 32 }]}
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

          {/* ─── 2. QUICK FARM LOGS ─── */}
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
              <Text style={styles.sectionTitle}>{"Today's Snapshot"}</Text>
            </View>
          </AnimatedCard>
          <View style={styles.snapshotGrid}>
            {snapshotMetrics.map((m, i) => {
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
                <Text style={styles.progressPct}>{progressPct}% Complete</Text>
                <Text style={styles.progressCount}>
                  {dashboardLogs.filter(l => l.done).length} of {dashboardLogs.length} daily logs submitted
                </Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
              </View>
              <View style={styles.progressLogs}>
                {dashboardLogs.map((log) => (
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
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {quickLogType && (
        <QuickLogSheet
          visible={!!quickLogType}
          type={quickLogType}
          batch={selectedBatch}
          dateStr={dateStr}
          timeStr={timeStr}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          lastFeedType={lastFeedByBatch[selectedBatch]}
          onTypeChange={setQuickLogType}
          onBatchSelect={setSelectedBatch}
          onDateSelect={setSelectedDate}
          onTimeSelect={setSelectedTime}
          onClose={closeQuickLog}
          onSave={handleQuickLogSave}
        />
      )}

      {toastMsg ? <View style={styles.toast}><GoonaIcon icon={Icons.checkCircle} size={16} color="#D4FF4D" /><Text style={styles.toastText}>{toastMsg}</Text></View> : null}
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
  toast: { position: 'absolute', left: 24, right: 24, bottom: 34, zIndex: 50, backgroundColor: '#15291A', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.18, shadowRadius: 24, elevation: 8 },
  toastText: { fontSize: 13, fontWeight: '800', color: '#fff' },
})













