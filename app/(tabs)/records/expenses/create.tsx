import { useState, useCallback } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Platform, KeyboardAvoidingView, Alert,
} from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import GoonaIcon from '../../../../components/ui/GoonaIcon'
import { Icons } from '../../../../shared/icons'
import Animated, { FadeInUp } from 'react-native-reanimated'
import DateTimePicker from '@react-native-community/datetimepicker'
import { formatInput, parseAmount } from '../../../../utils/format'
import { useHistoryStore } from '../../../../store/useHistoryStore'
import { useFarmChatStore } from '../../../../store/useFarmChatStore'

const CATEGORIES = [
  { label: 'Feed', icon: Icons.package, color: '#16A34A' },
  { label: 'Transport', icon: Icons.truck, color: '#F59E0B' },
  { label: 'Medication', icon: Icons.receipt, color: '#EF4444' },
  { label: 'Salaries', icon: Icons.users, color: '#1A56FF' },
  { label: 'Utilities', icon: Icons.zap, color: '#8B5CF6' },
  { label: 'Repairs', icon: Icons.wrench, color: '#06B6D4' },
]

const BATCHES = [
  'Broiler Batch A', 'Layer Batch B', 'Starter Pen C',
  'Turkey Unit', 'Poultry Expansion Batch',
]

export default function CreateExpenseScreen() {
  const insets = useSafeAreaInsets()
  const [selectedCategory, setSelectedCategory] = useState('')
  const [amountRaw, setAmountRaw] = useState('')
  const [vendor, setVendor] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState(BATCHES[0])
  const [showBatchOptions, setShowBatchOptions] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedTime, setSelectedTime] = useState(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)

  const batchlessCategories = ['Salaries', 'Utilities', 'Transport', 'Repairs']
  const showBatch = !batchlessCategories.includes(selectedCategory)

  const amountNum = parseAmount(amountRaw)
  const displayAmount = formatInput(amountRaw)
  const dateStr = selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const timeStr = selectedTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  const handleSave = useCallback(() => {
    if (!amountNum || !selectedCategory) return
    setSaving(true)
    try {
      const recordId = useHistoryStore.getState().addRecord({
        type: 'expense',
        timestamp: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), selectedTime.getHours(), selectedTime.getMinutes()).getTime(),
        batch: selectedBatch,
        cost: amountNum,
        notes: `${selectedCategory} · ${vendor || 'Unknown'}${notes ? ' · ' + notes : ''}`,
        itemName: selectedCategory,
        supplier: vendor || undefined,
      })
      useFarmChatStore.getState().addFeedPost({
        id: `feed-${recordId}`,
        type: 'feed_record',
        timestamp: Date.now(),
        actorName: 'Farm Records',
        actorRole: 'System',
        actorInitials: 'FR',
        actorColor: '#16A34A',
        detail: `Expense recorded: ${selectedCategory} — ₦${amountNum.toLocaleString('en-NG')}`,
        highlight: `-₦${amountNum.toLocaleString('en-NG')}`,
        tags: ['Expense', selectedCategory],
      })
      setSaving(false)
      if (router.canGoBack()) { router.back() } else { router.replace('/records/sales-revenue' as any) }
    } catch (err) {
      setSaving(false)
      Alert.alert('Save Failed', 'Unable to record expense. Your data is intact. Would you like to retry?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Retry', onPress: () => handleSave() },
      ])
    }
  }, [amountNum, selectedCategory, selectedBatch, selectedDate, selectedTime, vendor, notes])

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollInner, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeInUp.duration(500).springify()} style={styles.topNav}>
          <TouchableOpacity
            style={styles.navBack}
            activeOpacity={0.7}
            onPress={() => router.replace('/(tabs)/records/sales-revenue' as any)}
          >
            <GoonaIcon icon={Icons.arrowLeft} size={24} color="#1B1B1B" />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Record Expense</Text>
          <View style={styles.navSpacer} />
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(80).springify()} style={styles.logContextCard}>
          <Text style={styles.logContextTitle}>Details</Text>
          <View style={styles.logContextGrid}>
            {showBatch ? (
              <TouchableOpacity style={[styles.logContextField, styles.logContextFieldWide]} activeOpacity={0.75} onPress={() => setShowBatchOptions(!showBatchOptions)}>
                <GoonaIcon icon={Icons.clipboardList} size={16} color="#2E7D32" />
                <View style={styles.logContextFieldText}><Text style={styles.logContextLabel}>Batch</Text><Text style={styles.logContextValue}>{selectedBatch}</Text></View>
                <GoonaIcon icon={Icons.chevronDown} size={13} color="#2E7D32" />
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={styles.logContextField} activeOpacity={0.75} onPress={() => setShowDatePicker(true)}>
              <GoonaIcon icon={Icons.calendar} size={16} color="#2E7D32" />
              <View style={styles.logContextFieldText}><Text style={styles.logContextLabel}>Date</Text><Text style={styles.logContextValue}>{dateStr}</Text></View>
              <GoonaIcon icon={Icons.chevronDown} size={13} color="#2E7D32" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.logContextField} activeOpacity={0.75} onPress={() => setShowTimePicker(true)}>
              <GoonaIcon icon={Icons.clock} size={16} color="#2E7D32" />
              <View style={styles.logContextFieldText}><Text style={styles.logContextLabel}>Time</Text><Text style={styles.logContextValue}>{timeStr}</Text></View>
              <GoonaIcon icon={Icons.chevronDown} size={13} color="#2E7D32" />
            </TouchableOpacity>
          </View>
          {showBatchOptions && (
            <View style={styles.batchOptions}>
              {BATCHES.map((item) => (
                <TouchableOpacity key={item} style={[styles.batchOption, item === selectedBatch && styles.batchOptionActive]} activeOpacity={0.75} onPress={() => { setSelectedBatch(item); setShowBatchOptions(false) }}>
                  <Text style={[styles.batchOptionText, item === selectedBatch && styles.batchOptionTextActive]}>{item}</Text>
                  {item === selectedBatch ? <GoonaIcon icon={Icons.check} size={14} color="#2E7D32" /> : null}
                </TouchableOpacity>
              ))}
            </View>
          )}
          {showDatePicker && (
            <View style={styles.inlinePicker}>
              <DateTimePicker value={selectedDate} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(_event, date) => { if (Platform.OS === 'android') setShowDatePicker(false); if (date) setSelectedDate(date) }} themeVariant="light" />
              {Platform.OS === 'ios' && <TouchableOpacity style={styles.inlineDone} onPress={() => setShowDatePicker(false)}><Text style={styles.inlineDoneText}>Done</Text></TouchableOpacity>}
            </View>
          )}
          {showTimePicker && (
            <View style={styles.inlinePicker}>
              <DateTimePicker value={selectedTime} mode="time" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(_event, date) => { if (Platform.OS === 'android') setShowTimePicker(false); if (date) setSelectedTime(date) }} themeVariant="light" />
              {Platform.OS === 'ios' && <TouchableOpacity style={styles.inlineDone} onPress={() => setShowTimePicker(false)}><Text style={styles.inlineDoneText}>Done</Text></TouchableOpacity>}
            </View>
          )}

          {/* ─── Divider ─── */}
          <View style={styles.logContextDivider} />

          {/* ─── Amount ─── */}
          <Text style={styles.entryLabel}>Amount ({'\u20A6'})</Text>
          <View style={styles.amountRow}>
            <Text style={styles.amountPrefix}>{'\u20A6'}</Text>
            <TextInput
              style={[styles.amountInput, amountNum > 0 && styles.amountInputValid]}
              placeholder="0"
              placeholderTextColor="#CBD5E1"
              keyboardType="numeric"
              value={displayAmount}
              onChangeText={(v) => setAmountRaw(prev => { const c = v.replace(/[^0-9]/g, ''); return prev === c ? prev : c })}
            />
          </View>

          {/* ─── Category (horizontal scroll) ─── */}
          <Text style={[styles.entryLabel, { marginTop: 12 }]}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow} keyboardShouldPersistTaps="handled">
            {CATEGORIES.map((c) => {
              const active = selectedCategory === c.label
              return (
                <TouchableOpacity
                  key={c.label}
                  style={[styles.categoryChip, active && { backgroundColor: c.color + '18', borderColor: c.color }]}
                  activeOpacity={0.7}
                  onPress={() => setSelectedCategory(c.label)}
                >
                  <GoonaIcon icon={c.icon} size={14} color={active ? c.color : '#64748B'} />
                  <Text style={[styles.categoryLabel, active && { color: c.color, fontWeight: '700' }]}>
                    {c.label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </ScrollView>

          {/* ─── Vendor ─── */}
          <Text style={[styles.entryLabel, { marginTop: 12 }]}>Vendor / Payee</Text>
          <TextInput
            style={styles.entryInput}
            placeholder="Enter vendor name"
            placeholderTextColor="#CBD5E1"
            value={vendor}
            onChangeText={setVendor}
          />

          {/* ─── Notes ─── */}
          <Text style={[styles.entryLabel, { marginTop: 12 }]}>Notes</Text>
          <TextInput
            style={[styles.entryInput, styles.notesInput]}
            placeholder="Add notes about this expense"
            placeholderTextColor="#CBD5E1"
            multiline
            numberOfLines={3}
            value={notes}
            onChangeText={setNotes}
          />

          {/* ─── Attach Receipt ─── */}
          <TouchableOpacity style={styles.receiptBtn} activeOpacity={0.7}>
            <GoonaIcon icon={Icons.camera} size={16} color="#2E7D32" />
            <Text style={styles.receiptText}>Attach Receipt</Text>
          </TouchableOpacity>

          {/* ─── Save ─── */}
          <TouchableOpacity
            style={[styles.saveBtn, (!amountNum || !selectedCategory) && styles.saveBtnDisabled]}
            activeOpacity={0.8}
            onPress={handleSave}
            disabled={!amountNum || !selectedCategory || saving}
          >
            <GoonaIcon icon={saving ? Icons.check : Icons.plus} size={18} color="#FFF" />
            <Text style={styles.saveText}>{saving ? 'Saving...' : 'Record Expense'}</Text>
          </TouchableOpacity>
        </Animated.View>

      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF7',
  },
  flex: { flex: 1 },
  scroll: {
    flex: 1,
  },
  scrollInner: {
    paddingBottom: 60,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 52,
  },
  navBack: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B1B1B',
    letterSpacing: -0.3,
  },
  navSpacer: {
    width: 40,
  },
  entryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 0.2,
    marginBottom: 6,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  amountPrefix: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1B1B1B',
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    fontSize: 26,
    fontWeight: '800',
    color: '#1B1B1B',
    textAlign: 'center',
    letterSpacing: -0.5,
    paddingVertical: 8,
  },
  amountInputValid: {
    color: '#2E7D32',
  },
  categoryRow: {
    flexDirection: 'row', gap: 8, paddingRight: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  entryInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#1B1B1B',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  notesInput: {
    height: 72,
    textAlignVertical: 'top',
  },
  receiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: 'rgba(46,125,50,0.2)',
    borderStyle: 'dashed',
  },
  receiptText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2E7D32',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2E7D32',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 16,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  logContextCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  logContextTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2E7D32',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  logContextDivider: {
    height: 1, backgroundColor: '#E5E7EB', marginVertical: 14,
  },
  logContextGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  logContextField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    minWidth: 100,
  },
  logContextFieldWide: {
    flex: 2,
    minWidth: '100%',
  },
  logContextFieldText: {
    flex: 1,
  },
  logContextLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  logContextValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1B1B1B',
    marginTop: 1,
  },
  batchOptions: {
    marginTop: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  batchOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  batchOptionActive: {
    backgroundColor: '#F0FDF4',
  },
  batchOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  batchOptionTextActive: {
    color: '#2E7D32',
    fontWeight: '700',
  },
  inlinePicker: {
    marginTop: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    overflow: 'hidden',
    alignItems: 'center',
  },
  inlineDone: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    alignSelf: 'flex-end',
  },
  inlineDoneText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2E7D32',
  },
})
