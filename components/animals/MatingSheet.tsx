import React, { useState, useMemo, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, TextInput, ScrollView,
  StyleSheet, Platform, Modal, KeyboardAvoidingView,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, { SlideInUp } from 'react-native-reanimated'
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'
import GoonaIcon from '../ui/GoonaIcon'
import { Icons } from '../../shared/icons'
import { useAnimalStore, type Animal } from '../../store/useAnimalStore'
import {
  useBreedingStore,
  GESTATION_DEFAULTS,
  type MatingRecord,
} from '../../store/useBreedingStore'

interface Props {
  visible: boolean
  onClose: () => void
  batchId: string
  livestockType: string
  editMating?: MatingRecord
}

function formatDate(d: Date): string {
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear()
  return `${day} / ${month} / ${year}`
}

export default function MatingSheet({ visible, onClose, batchId, livestockType, editMating }: Props) {
  const animals = useAnimalStore((s) => s.animals)
  const addMating = useBreedingStore((s) => s.addMating)
  const updateMating = useBreedingStore((s) => s.updateMating)

  const batchAnimals = useMemo(() => animals.filter((a) => a.batchId === batchId), [animals, batchId])
  const females = useMemo(() => batchAnimals.filter((a) => a.sex === 'female' && a.status === 'active'), [batchAnimals])
  const males = useMemo(() => batchAnimals.filter((a) => a.sex === 'male' && a.status === 'active'), [batchAnimals])

  const defaultGestation = GESTATION_DEFAULTS[livestockType] ?? 150

  const [damId, setDamId] = useState<string | null>(editMating?.damId ?? null)
  const [sireId, setSireId] = useState<string | null>(editMating?.sireId ?? null)
  const [sireTag, setSireTag] = useState(editMating?.sireTag ?? '')
  const [matingDate, setMatingDate] = useState(editMating ? new Date(editMating.matingDate) : new Date())
  const [gestationDays, setGestationDays] = useState(String(editMating?.gestationDays ?? defaultGestation))
  const [notes, setNotes] = useState(editMating?.notes ?? '')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showDamPicker, setShowDamPicker] = useState(false)
  const [showSirePicker, setShowSirePicker] = useState(false)

  const isEditing = !!editMating
  const isExternal = sireId === '__external__'

  const dueDate = useMemo(() => {
    const gDays = parseInt(gestationDays, 10)
    if (isNaN(gDays) || gDays < 1) return null
    const d = new Date(matingDate)
    d.setDate(d.getDate() + gDays)
    return d
  }, [matingDate, gestationDays])

  const selectedDam = useMemo(() => batchAnimals.find((a) => a.id === damId), [batchAnimals, damId])
  const selectedSire = useMemo(() => batchAnimals.find((a) => a.id === sireId), [batchAnimals, sireId])

  const handleDateChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false)
    if (date) setMatingDate(date)
  }

  const handleSave = () => {
    if (!damId) return
    const gDays = parseInt(gestationDays, 10)
    const finalSireId = isExternal ? null : sireId

    if (isEditing && editMating) {
      updateMating(editMating.id, {
        damId,
        sireId: finalSireId,
        sireTag: isExternal ? sireTag.trim() || undefined : undefined,
        matingDate: matingDate.toISOString(),
        gestationDays: isNaN(gDays) ? defaultGestation : gDays,
        notes: notes.trim() || undefined,
      })
    } else {
      addMating({
        batchId,
        damId,
        sireId: finalSireId,
        sireTag: isExternal ? sireTag.trim() || undefined : undefined,
        matingDate: matingDate.toISOString(),
        gestationDays: isNaN(gDays) ? defaultGestation : gDays,
        status: 'mated',
        notes: notes.trim() || undefined,
      })
    }
    onClose()
  }

  const disabled = !damId

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <Animated.View entering={SlideInUp.duration(350).springify().damping(20)} style={styles.sheet}>
          <View style={styles.handle} />
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollInner}
          >
            <View style={styles.header}>
              <View style={styles.headerIconWrap}>
                <GoonaIcon icon={Icons.heart} size={24} color="#E11D48" />
              </View>
              <Text style={styles.title}>{isEditing ? 'Edit Mating' : 'Record Mating'}</Text>
              <Text style={styles.desc}>
                Log a mating event between a female and a male in this herd.
              </Text>
            </View>

            {/* DAM SELECTION */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Dam (Female) <Text style={styles.required}>*</Text></Text>
              <TouchableOpacity style={styles.selectorBtn} activeOpacity={0.85} onPress={() => setShowDamPicker(!showDamPicker)}>
                <GoonaIcon icon={Icons.userCheck} size={18} color={selectedDam ? '#7C3AED' : '#A0AEA1'} />
                <Text style={[styles.selectorText, !selectedDam && styles.selectorPlaceholder]}>
                  {selectedDam ? selectedDam.tag : 'Select female animal'}
                </Text>
                <GoonaIcon icon={Icons.chevronDown} size={14} color="#94A3B8" />
              </TouchableOpacity>
              {showDamPicker && (
                <View style={styles.pickerList}>
                  {females.length === 0 ? (
                    <Text style={styles.pickerEmpty}>No active females in this herd.</Text>
                  ) : (
                    females.map((f) => (
                      <TouchableOpacity
                        key={f.id}
                        style={[styles.pickerItem, damId === f.id && styles.pickerItemActive]}
                        activeOpacity={0.7}
                        onPress={() => { setDamId(f.id); setShowDamPicker(false) }}
                      >
                        <GoonaIcon icon={Icons.userCheck} size={16} color={damId === f.id ? '#FFFFFF' : '#7C3AED'} />
                        <Text style={[styles.pickerItemText, damId === f.id && styles.pickerItemTextActive]}>
                          {f.tag}
                        </Text>
                        {f.breed ? <Text style={styles.pickerItemMeta}>{f.breed}</Text> : null}
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}
            </View>

            {/* SIRE SELECTION */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Sire (Male)</Text>
              <TouchableOpacity style={styles.selectorBtn} activeOpacity={0.85} onPress={() => setShowSirePicker(!showSirePicker)}>
                <GoonaIcon icon={Icons.user} size={18} color={selectedSire || isExternal ? '#2E7D32' : '#A0AEA1'} />
                <Text style={[styles.selectorText, !selectedSire && !isExternal && styles.selectorPlaceholder]}>
                  {selectedSire ? selectedSire.tag : isExternal ? `External: ${sireTag || 'Unknown'}` : 'Select male animal'}
                </Text>
                <GoonaIcon icon={Icons.chevronDown} size={14} color="#94A3B8" />
              </TouchableOpacity>
              {showSirePicker && (
                <View style={styles.pickerList}>
                  <TouchableOpacity
                    style={[styles.pickerItem, isExternal && styles.pickerItemActive]}
                    activeOpacity={0.7}
                    onPress={() => { setSireId('__external__'); setShowSirePicker(false) }}
                  >
                    <GoonaIcon icon={Icons.globe} size={16} color={isExternal ? '#FFFFFF' : '#64748B'} />
                    <Text style={[styles.pickerItemText, isExternal && styles.pickerItemTextActive]}>External / Unknown</Text>
                  </TouchableOpacity>
                  {males.length === 0 ? (
                    <Text style={styles.pickerEmpty}>No active males in this herd.</Text>
                  ) : (
                    males.map((m) => (
                      <TouchableOpacity
                        key={m.id}
                        style={[styles.pickerItem, sireId === m.id && styles.pickerItemActive]}
                        activeOpacity={0.7}
                        onPress={() => { setSireId(m.id); setShowSirePicker(false) }}
                      >
                        <GoonaIcon icon={Icons.user} size={16} color={sireId === m.id ? '#FFFFFF' : '#2E7D32'} />
                        <Text style={[styles.pickerItemText, sireId === m.id && styles.pickerItemTextActive]}>{m.tag}</Text>
                        {m.breed ? <Text style={styles.pickerItemMeta}>{m.breed}</Text> : null}
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}
              {isExternal && (
                <TextInput
                  value={sireTag}
                  onChangeText={setSireTag}
                  placeholder="External sire name/tag (optional)"
                  placeholderTextColor="#A0AEA1"
                  style={styles.externalInput}
                />
              )}
            </View>

            {/* MATING DATE */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Mating Date</Text>
              <TouchableOpacity
                style={styles.fieldWrap}
                activeOpacity={0.85}
                onPress={() => setShowDatePicker(true)}
              >
                <GoonaIcon icon={Icons.calendar} size={17} color="#A0AEA1" />
                <Text style={styles.fieldInputText}>{formatDate(matingDate)}</Text>
              </TouchableOpacity>
              {showDatePicker && (
                <View style={styles.datePickerWrap}>
                  <DateTimePicker
                    value={matingDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                    themeVariant="light"
                  />
                  {Platform.OS === 'ios' && (
                    <TouchableOpacity style={styles.dateDoneBtn} activeOpacity={0.85} onPress={() => setShowDatePicker(false)}>
                      <Text style={styles.dateDoneText}>Done</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            {/* GESTATION */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Gestation Period (days)</Text>
              <View style={styles.fieldWrap}>
                <GoonaIcon icon={Icons.clock} size={17} color="#A0AEA1" />
                <TextInput
                  value={gestationDays}
                  onChangeText={(v) => setGestationDays(v.replace(/[^0-9]/g, ''))}
                  keyboardType="number-pad"
                  placeholder={String(defaultGestation)}
                  placeholderTextColor="#A0AEA1"
                  style={styles.fieldInput}
                />
              </View>
              {dueDate && (
                <View style={styles.dueDatePreview}>
                  <GoonaIcon icon={Icons.calendar} size={14} color="#16A34A" />
                  <Text style={styles.dueDateText}>
                    Expected due date: {formatDate(dueDate)}
                  </Text>
                </View>
              )}
            </View>

            {/* NOTES */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Notes (optional)</Text>
              <View style={[styles.fieldWrap, styles.notesWrap]}>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Observations, conditions..."
                  placeholderTextColor="#A0AEA1"
                  multiline
                  style={styles.notesInput}
                />
              </View>
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} activeOpacity={0.85} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, disabled && styles.saveBtnDisabled]}
              activeOpacity={0.85}
              onPress={handleSave}
              disabled={disabled}
            >
              <LinearGradient colors={['#16A34A', '#0F6B32']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
              <Text style={styles.saveText}>{isEditing ? 'Update' : 'Save Mating'}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 32, borderTopRightRadius: 32,
    maxHeight: '90%',
    shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.08, shadowRadius: 30, elevation: 15,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB', alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  scrollInner: { paddingHorizontal: 24, paddingBottom: 20 },
  header: { alignItems: 'center', paddingVertical: 12 },
  headerIconWrap: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#FFF1F2', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '800', color: '#15291A', textAlign: 'center' },
  desc: { fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 6, lineHeight: 20, paddingHorizontal: 8 },
  formSection: { marginBottom: 16 },
  formLabel: { fontSize: 13, fontWeight: '700', color: '#1F2937', marginBottom: 6 },
  required: { color: '#EF4444' },
  fieldWrap: {
    flexDirection: 'row', alignItems: 'center', height: 52, borderRadius: 16,
    backgroundColor: '#F2F6F1', borderWidth: 1.5, borderColor: '#E2E8F0',
    paddingHorizontal: 14, gap: 10,
  },
  fieldInput: { flex: 1, fontSize: 15, fontWeight: '500', color: '#1B1B1B', padding: 0, margin: 0 },
  fieldInputText: { fontSize: 15, fontWeight: '500', color: '#1B1B1B' },
  selectorBtn: {
    flexDirection: 'row', alignItems: 'center', height: 52, borderRadius: 16,
    backgroundColor: '#F2F6F1', borderWidth: 1.5, borderColor: '#E2E8F0',
    paddingHorizontal: 14, gap: 10,
  },
  selectorText: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1B1B1B' },
  selectorPlaceholder: { color: '#A0AEA1', fontWeight: '500' },
  pickerList: { backgroundColor: '#FFFFFF', borderRadius: 16, marginTop: 8, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' },
  pickerItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  pickerItemActive: { backgroundColor: '#2E7D32' },
  pickerItemText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1B1B1B' },
  pickerItemTextActive: { color: '#FFFFFF' },
  pickerItemMeta: { fontSize: 12, fontWeight: '500', color: '#94A3B8' },
  pickerEmpty: { padding: 16, textAlign: 'center', fontSize: 13, fontWeight: '500', color: '#94A3B8' },
  externalInput: {
    marginTop: 8, height: 44, borderRadius: 12, backgroundColor: '#F2F6F1',
    borderWidth: 1.5, borderColor: '#E2E8F0', paddingHorizontal: 14,
    fontSize: 14, fontWeight: '500', color: '#1B1B1B',
  },
  datePickerWrap: { backgroundColor: 'white', borderRadius: 16, marginTop: 8, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 2 },
  dateDoneBtn: { height: 44, alignItems: 'center', justifyContent: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  dateDoneText: { fontSize: 15, fontWeight: '600', color: '#2E7D32' },
  dueDatePreview: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, paddingHorizontal: 4 },
  dueDateText: { fontSize: 13, fontWeight: '600', color: '#16A34A' },
  notesWrap: { height: 80, alignItems: 'flex-start', paddingTop: 12 },
  notesInput: { flex: 1, fontSize: 14, fontWeight: '500', color: '#1B1B1B', padding: 0, margin: 0, width: '100%' },
  actions: { flexDirection: 'row', gap: 12, paddingHorizontal: 24, paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  cancelBtn: { flex: 1, height: 50, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  cancelText: { fontSize: 15, fontWeight: '700', color: '#64748B' },
  saveBtn: { flex: 1, height: 50, borderRadius: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  saveBtnDisabled: { opacity: 0.5 },
  saveText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
})
