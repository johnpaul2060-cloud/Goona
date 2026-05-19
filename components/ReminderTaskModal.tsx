import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, TextInput, Pressable,
  StyleSheet, Platform, Keyboard, ScrollView,
  KeyboardAvoidingView, Modal,
} from 'react-native'
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg'
import { LinearGradient } from 'expo-linear-gradient'
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'

const CATEGORIES = ['Feeding', 'Medication', 'Mortality', 'Water', 'Records', 'Recap', 'Team', 'General']
const REPEAT_OPTS = ['Once', 'Daily', 'Weekly', 'Monthly']
const BATCHES = ['Broiler Batch A', 'Layer Batch B', 'Turkey Unit', 'All Batches']
const WORKERS = ['Myself', 'Chinedu Okoro', 'Aminat Fashola', 'Kola Ogunleye', 'All Workers']
const PRIORITIES = [
  { label: 'Normal', color: '#1A56FF' },
  { label: 'High', color: '#F59E0B' },
  { label: 'Critical', color: '#EF4444' },
]

function CloseIcon() {
  return <Svg width="20" height="20" viewBox="0 0 20 20" fill="none"><Path d="M7 7L13 13" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" /><Path d="M13 7L7 13" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" /></Svg>
}

function fmtDate(d: Date): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`
}

function fmtTime(d: Date): string {
  const h = d.getHours()
  const m = String(d.getMinutes()).padStart(2, '0')
  const ampm = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${m} ${ampm}`
}

export interface ReminderTask {
  id: string
  type: 'Reminder' | 'Task'
  title: string
  category: string
  date: Date
  time: Date
  repeat: string
  batch: string
  assignedTo: string
  priority: 'Normal' | 'High' | 'Critical'
  notes: string
  status: 'pending' | 'completed'
  createdAt: Date
}

export default function ReminderTaskModal({
  visible, onClose, onSave,
}: {
  visible: boolean
  onClose: () => void
  onSave: (item: ReminderTask) => void
}) {
  const [type, setType] = useState<'Reminder' | 'Task'>('Reminder')
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('General')
  const [date, setDate] = useState(new Date())
  const [time, setTime] = useState(new Date())
  const [repeat, setRepeat] = useState('Once')
  const [batch, setBatch] = useState('All Batches')
  const [assignedTo, setAssignedTo] = useState('Myself')
  const [priority, setPriority] = useState<'Normal' | 'High' | 'Critical'>('Normal')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)

  const handleSave = async () => {
    Keyboard.dismiss()
    setSaving(true)
    await new Promise((r) => setTimeout(r, 400))
    const item: ReminderTask = {
      id: Date.now().toString(),
      type,
      title: title.trim() || (type === 'Reminder' ? 'Farm Reminder' : 'Farm Task'),
      category,
      date,
      time,
      repeat,
      batch,
      assignedTo,
      priority,
      notes,
      status: 'pending',
      createdAt: new Date(),
    }
    onSave(item)
    setSaving(false)
    onClose()
  }

  const resetForm = () => {
    setType('Reminder')
    setTitle('')
    setCategory('General')
    setDate(new Date())
    setTime(new Date())
    setRepeat('Once')
    setBatch('All Batches')
    setAssignedTo('Myself')
    setPriority('Normal')
    setNotes('')
    setSaving(false)
    setShowDatePicker(false)
    setShowTimePicker(false)
  }

  const handleClose = () => {
    Keyboard.dismiss()
    resetForm()
    onClose()
  }

  const canSave = title.trim().length > 0
  const btnLabel = saving
    ? (type === 'Reminder' ? 'Scheduling…' : 'Publishing…')
    : (type === 'Reminder' ? 'Schedule Reminder' : 'Publish Task')

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.kav}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} />

        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Create Reminder / Task</Text>
            <TouchableOpacity onPress={handleClose} style={styles.sheetCloseBtn} activeOpacity={0.7}>
              <CloseIcon />
            </TouchableOpacity>
          </View>
          <Text style={styles.sheetSub}>Schedule an operation or assign work to your farm team.</Text>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollInner}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Type */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Type</Text>
              <View style={styles.segmented}>
                {(['Reminder', 'Task'] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.segBtn, type === t && styles.segBtnActive]}
                    activeOpacity={0.8}
                    onPress={() => setType(t)}
                  >
                    <Text style={[styles.segText, type === t && styles.segTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Title */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Title</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Feed Batch A"
                  placeholderTextColor="#CBD5E1"
                  value={title}
                  onChangeText={setTitle}
                />
              </View>
            </View>

            {/* Category */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Category</Text>
              <View style={styles.chipRow}>
                {CATEGORIES.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.chip, category === c && styles.chipActive]}
                    activeOpacity={0.8}
                    onPress={() => setCategory(c)}
                  >
                    <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Date */}
            <View style={styles.fieldRow}>
              <View style={styles.fieldHalf}>
                <Text style={styles.fieldLabel}>Date</Text>
                <TouchableOpacity style={styles.pickerBtn} activeOpacity={0.8} onPress={() => setShowDatePicker(true)}>
                  <Svg width="14" height="14" viewBox="0 0 14 14" fill="none"><Rect x="2" y="3" width="10" height="9" rx="1.5" stroke="#1F2937" strokeWidth="1.3" fill="none" /><Line x1="2" y1="6" x2="12" y2="6" stroke="#1F2937" strokeWidth="1.2" /></Svg>
                  <Text style={styles.pickerText}>{fmtDate(date)}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.fieldHalf}>
                <Text style={styles.fieldLabel}>Time</Text>
                <TouchableOpacity style={styles.pickerBtn} activeOpacity={0.8} onPress={() => setShowTimePicker(true)}>
                  <Svg width="14" height="14" viewBox="0 0 14 14" fill="none"><Circle cx="7" cy="7" r="4.5" stroke="#1F2937" strokeWidth="1.3" fill="none" /><Path d="M7 5V7L8.5 8.5" stroke="#1F2937" strokeWidth="1.2" strokeLinecap="round" /></Svg>
                  <Text style={styles.pickerText}>{fmtTime(time)}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {showDatePicker && (
              <View style={styles.inlinePicker}>
                <DateTimePicker value={date} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(_e: DateTimePickerEvent, d?: Date) => { if (d) setDate(d); if (Platform.OS === 'android') setShowDatePicker(false) }} themeVariant="light" />
                {Platform.OS === 'ios' && <TouchableOpacity style={styles.pickerDone} onPress={() => setShowDatePicker(false)}><Text style={styles.pickerDoneText}>Done</Text></TouchableOpacity>}
              </View>
            )}
            {showTimePicker && (
              <View style={styles.inlinePicker}>
                <DateTimePicker value={time} mode="time" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(_e: DateTimePickerEvent, t?: Date) => { if (t) setTime(t); if (Platform.OS === 'android') setShowTimePicker(false) }} themeVariant="light" />
                {Platform.OS === 'ios' && <TouchableOpacity style={styles.pickerDone} onPress={() => setShowTimePicker(false)}><Text style={styles.pickerDoneText}>Done</Text></TouchableOpacity>}
              </View>
            )}

            {/* Repeat */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Repeat</Text>
              <View style={styles.chipRow}>
                {REPEAT_OPTS.map((r) => (
                  <TouchableOpacity key={r} style={[styles.chip, repeat === r && styles.chipActive]} activeOpacity={0.8} onPress={() => setRepeat(r)}>
                    <Text style={[styles.chipText, repeat === r && styles.chipTextActive]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Batch */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Batch</Text>
              <View style={styles.chipRow}>
                {BATCHES.map((b) => (
                  <TouchableOpacity key={b} style={[styles.chip, batch === b && styles.chipActive]} activeOpacity={0.8} onPress={() => setBatch(b)}>
                    <Text style={[styles.chipText, batch === b && styles.chipTextActive]}>{b}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Assign To */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Assign To</Text>
              <View style={styles.chipRow}>
                {WORKERS.map((w) => (
                  <TouchableOpacity key={w} style={[styles.chip, assignedTo === w && styles.chipActive]} activeOpacity={0.8} onPress={() => setAssignedTo(w)}>
                    <Text style={[styles.chipText, assignedTo === w && styles.chipTextActive]}>{w}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Priority */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Priority</Text>
              <View style={styles.chipRow}>
                {PRIORITIES.map((p) => (
                  <TouchableOpacity
                    key={p.label}
                    style={[styles.chip, priority === p.label && { borderColor: p.color, backgroundColor: `${p.color}12` }]}
                    activeOpacity={0.8}
                    onPress={() => setPriority(p.label as typeof priority)}
                  >
                    <View style={[styles.priorityDot, { backgroundColor: p.color }]} />
                    <Text style={[styles.chipText, priority === p.label && { color: p.color, fontWeight: '600' }]}>{p.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Notes */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Notes</Text>
              <View style={[styles.inputWrap, { minHeight: 60 }]}>
                <TextInput
                  style={[styles.input, { minHeight: 40 }]}
                  placeholder="Optional notes..."
                  placeholderTextColor="#CBD5E1"
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                />
              </View>
            </View>
          </ScrollView>

          {/* STICKY ACTION BAR */}
          <View style={styles.actionBar}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleSave}
              disabled={!canSave || saving}
            >
              <LinearGradient
                colors={canSave && !saving ? ['#1B5E20', '#2E7D32', '#388E3C'] : ['#E2E8F0', '#E2E8F0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.saveBtn, (!canSave || saving) && styles.saveBtnDisabled]}
              >
                <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <Circle cx="10" cy="10" r="6" stroke={canSave && !saving ? 'white' : '#94A3B8'} strokeWidth="1.5" fill="none" />
                  <Path d="M7 10L9 12L13 8" stroke={canSave && !saving ? 'white' : '#94A3B8'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
                <Text style={[styles.saveBtnText, (!canSave || saving) && { color: '#94A3B8' }]}>
                  {btnLabel}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  kav: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '90%',
  },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', alignSelf: 'center', marginTop: 10, marginBottom: 6 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: '#1B1B1B' },
  sheetCloseBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  sheetSub: { fontSize: 13, color: '#94A3B8', lineHeight: 19, marginTop: 8, marginBottom: 4 },
  scroll: { maxHeight: 380 },
  scrollInner: { paddingTop: 8, paddingBottom: 4 },

  fieldGroup: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#1F2937', marginBottom: 6 },
  fieldRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  fieldHalf: { flex: 1 },

  segmented: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 12, padding: 3 },
  segBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  segBtnActive: { backgroundColor: '#2E7D32' },
  segText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  segTextActive: { color: 'white' },

  inputWrap: { backgroundColor: '#F8FAF7', borderRadius: 14, paddingHorizontal: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  input: { fontSize: 15, fontWeight: '500', color: '#1B1B1B', paddingVertical: 12, paddingHorizontal: 0 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 100, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: 'transparent' },
  chipActive: { backgroundColor: 'rgba(46,125,50,0.08)', borderColor: '#2E7D32' },
  chipText: { fontSize: 12, fontWeight: '500', color: '#64748B' },
  chipTextActive: { color: '#2E7D32', fontWeight: '600' },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },

  pickerBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F8FAF7', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  pickerText: { fontSize: 14, fontWeight: '500', color: '#1F2937' },
  inlinePicker: { backgroundColor: 'white', borderRadius: 14, marginBottom: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0' },
  pickerDone: { height: 40, alignItems: 'center', justifyContent: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9', marginHorizontal: 14 },
  pickerDoneText: { fontSize: 14, fontWeight: '600', color: '#2E7D32' },

  actionBar: { paddingTop: 10, paddingBottom: 2 },
  saveBtn: { height: 56, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 24, elevation: 6 },
  saveBtnDisabled: { shadowOpacity: 0, elevation: 0 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: 'white' },
})
