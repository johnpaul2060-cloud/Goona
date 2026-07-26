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
import { useAnimalStore, type AnimalSex } from '../../store/useAnimalStore'
import {
  useBreedingStore,
  type MatingRecord,
} from '../../store/useBreedingStore'

interface OffspringEntry {
  tag: string
  sex: AnimalSex
}

interface Props {
  visible: boolean
  onClose: () => void
  batchId: string
  preSelectedDamId?: string
  preSelectedMatingId?: string
}

function formatDate(d: Date): string {
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear()
  return `${day} / ${month} / ${year}`
}

export default function BirthSheet({ visible, onClose, batchId, preSelectedDamId, preSelectedMatingId }: Props) {
  const animals = useAnimalStore((s) => s.animals)
  const addAnimal = useAnimalStore((s) => s.addAnimal)
  const updateAnimal = useAnimalStore((s) => s.updateAnimal)
  const matings = useBreedingStore((s) => s.matings)
  const addBirthEvent = useBreedingStore((s) => s.addBirthEvent)
  const updateMating = useBreedingStore((s) => s.updateMating)

  const batchAnimals = useMemo(() => animals.filter((a) => a.batchId === batchId), [animals, batchId])
  const batchFemales = useMemo(() => batchAnimals.filter((a) => a.sex === 'female' && a.status === 'active'), [batchAnimals])

  const pregnantMatings = useMemo(
    () => matings.filter((m) => m.batchId === batchId && m.status === 'pregnant'),
    [matings, batchId]
  )

  const getAnimalTag = useCallback((id: string) => {
    const a = animals.find((x) => x.id === id)
    return a?.tag ?? 'Unknown'
  }, [animals])

  const [selectedMatingId, setSelectedMatingId] = useState<string | null>(preSelectedMatingId ?? null)
  const [showMatingPicker, setShowMatingPicker] = useState(false)
  const [damId, setDamId] = useState<string | null>(preSelectedDamId ?? null)
  const [showDamPicker, setShowDamPicker] = useState(false)
  const [birthDate, setBirthDate] = useState(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [offspring, setOffspring] = useState<OffspringEntry[]>([{ tag: '', sex: 'female' }])
  const [notes, setNotes] = useState('')

  const selectedMating = useMemo(
    () => matings.find((m) => m.id === selectedMatingId),
    [matings, selectedMatingId]
  )

  const selectedDamId = selectedMating ? selectedMating.damId : damId
  const selectedSireId = selectedMating ? selectedMating.sireId : null

  const selectedDam = useMemo(
    () => batchAnimals.find((a) => a.id === selectedDamId),
    [batchAnimals, selectedDamId]
  )

  const handleDateChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false)
    if (date) setBirthDate(date)
  }

  const updateOffspring = useCallback((index: number, updates: Partial<OffspringEntry>) => {
    setOffspring((prev) => prev.map((o, i) => (i === index ? { ...o, ...updates } : o)))
  }, [])

  const addOffspringRow = useCallback(() => {
    setOffspring((prev) => [...prev, { tag: '', sex: 'female' }])
  }, [])

  const removeOffspringRow = useCallback((index: number) => {
    setOffspring((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleSave = () => {
    const finalDamId = selectedDamId
    if (!finalDamId) return
    if (offspring.length === 0) return

    // Create offspring animals
    const offspringIds: string[] = []
    for (const kid of offspring) {
      const animal = addAnimal({
        batchId,
        tag: kid.tag.trim() || `Kid #${offspringIds.length + 1}`,
        dateOfBirth: birthDate.toISOString(),
        sex: kid.sex,
        status: 'active',
        damId: finalDamId,
        sireId: selectedSireId ?? undefined,
      })
      offspringIds.push(animal.id)
    }

    // Update dam's offspringIds
    const dam = batchAnimals.find((a) => a.id === finalDamId)
    if (dam) {
      updateAnimal(finalDamId, {
        offspringIds: [...(dam.offspringIds || []), ...offspringIds],
      })
    }

    // Update sire's offspringIds
    if (selectedSireId) {
      const sire = batchAnimals.find((a) => a.id === selectedSireId)
      if (sire) {
        updateAnimal(selectedSireId, {
          offspringIds: [...(sire.offspringIds || []), ...offspringIds],
        })
      }
    }

    // Update mating status to delivered
    if (selectedMatingId) {
      updateMating(selectedMatingId, { status: 'delivered' })
    }

    // Create birth event
    addBirthEvent({
      breedingId: selectedMatingId ?? `direct_${Date.now()}`,
      batchId,
      damId: finalDamId,
      sireId: selectedSireId,
      birthDate: birthDate.toISOString(),
      offspringCount: offspring.length,
      offspringIds,
      notes: notes.trim() || undefined,
    })

    onClose()
  }

  const disabled = !selectedDamId || offspring.length === 0

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
                <GoonaIcon icon={Icons.userPlus} size={24} color="#7C3AED" />
              </View>
              <Text style={styles.title}>Record Birth</Text>
              <Text style={styles.desc}>
                Log a birth and auto-create offspring profiles in this herd.
              </Text>
            </View>

            {/* LINK TO MATING (optional) */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Link to Pregnancy Record (optional)</Text>
              <Text style={styles.hintText}>
                Select a pregnancy to auto-fill dam details. Leave unlinked to enter directly.
              </Text>
              <TouchableOpacity style={styles.selectorBtn} activeOpacity={0.85} onPress={() => setShowMatingPicker(!showMatingPicker)}>
                <GoonaIcon icon={Icons.heart} size={18} color={selectedMating ? '#E11D48' : '#A0AEA1'} />
                <Text style={[styles.selectorText, !selectedMating && styles.selectorPlaceholder]}>
                  {selectedMating
                    ? `${getAnimalTag(selectedMating.damId)} — Due ${formatDate(new Date(selectedMating.expectedDueDate))}`
                    : 'None (enter dam manually below)'}
                </Text>
                <GoonaIcon icon={Icons.chevronDown} size={14} color="#94A3B8" />
              </TouchableOpacity>
              {showMatingPicker && (
                <View style={styles.pickerList}>
                  <TouchableOpacity
                    style={styles.pickerItem}
                    activeOpacity={0.7}
                    onPress={() => { setSelectedMatingId(null); setShowMatingPicker(false) }}
                  >
                    <GoonaIcon icon={Icons.x} size={16} color="#94A3B8" />
                    <Text style={styles.pickerItemText}>None — enter dam manually</Text>
                  </TouchableOpacity>
                  {pregnantMatings.length === 0 ? (
                    <Text style={styles.pickerEmpty}>No pregnant records in this herd.</Text>
                  ) : (
                    pregnantMatings.map((m) => {
                      const dam = batchAnimals.find((a) => a.id === m.damId)
                      return (
                        <TouchableOpacity
                          key={m.id}
                          style={[styles.pickerItem, selectedMatingId === m.id && styles.pickerItemActive]}
                          activeOpacity={0.7}
                          onPress={() => { setSelectedMatingId(m.id); setShowMatingPicker(false) }}
                        >
                          <GoonaIcon icon={Icons.userCheck} size={16} color={selectedMatingId === m.id ? '#FFFFFF' : '#7C3AED'} />
                          <Text style={[styles.pickerItemText, selectedMatingId === m.id && styles.pickerItemTextActive]}>
                            {dam ? dam.tag : 'Unknown dam'}
                          </Text>
                          <Text style={styles.pickerItemMeta}>
                            Due: {formatDate(new Date(m.expectedDueDate))}
                          </Text>
                        </TouchableOpacity>
                      )
                    })
                  )}
                </View>
              )}
            </View>

            {/* DAM SELECTION (when no mating linked) */}
            {!selectedMating && (
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Dam <Text style={styles.required}>*</Text></Text>
                <TouchableOpacity style={styles.selectorBtn} activeOpacity={0.85} onPress={() => setShowDamPicker(!showDamPicker)}>
                  <GoonaIcon icon={Icons.userCheck} size={18} color={selectedDam ? '#7C3AED' : '#A0AEA1'} />
                  <Text style={[styles.selectorText, !selectedDam && styles.selectorPlaceholder]}>
                    {selectedDam ? selectedDam.tag : 'Select female animal'}
                  </Text>
                  <GoonaIcon icon={Icons.chevronDown} size={14} color="#94A3B8" />
                </TouchableOpacity>
                {showDamPicker && (
                  <View style={styles.pickerList}>
                    {batchFemales.length === 0 ? (
                      <Text style={styles.pickerEmpty}>No females in this herd.</Text>
                    ) : (
                      batchFemales.map((f) => (
                        <TouchableOpacity
                          key={f.id}
                          style={[styles.pickerItem, damId === f.id && styles.pickerItemActive]}
                          activeOpacity={0.7}
                          onPress={() => { setDamId(f.id); setShowDamPicker(false) }}
                        >
                          <GoonaIcon icon={Icons.userCheck} size={16} color={damId === f.id ? '#FFFFFF' : '#7C3AED'} />
                          <Text style={[styles.pickerItemText, damId === f.id && styles.pickerItemTextActive]}>{f.tag}</Text>
                          {f.breed ? <Text style={styles.pickerItemMeta}>{f.breed}</Text> : null}
                        </TouchableOpacity>
                      ))
                    )}
                  </View>
                )}
              </View>
            )}
            {selectedMating && (
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Dam</Text>
                <View style={styles.fieldWrap}>
                  <GoonaIcon icon={Icons.userCheck} size={17} color="#7C3AED" />
                  <Text style={styles.fieldInputText}>{selectedDam ? selectedDam.tag : 'Unknown'}</Text>
                </View>
              </View>
            )}

            {/* BIRTH DATE */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Birth Date <Text style={styles.required}>*</Text></Text>
              <TouchableOpacity
                style={styles.fieldWrap}
                activeOpacity={0.85}
                onPress={() => setShowDatePicker(true)}
              >
                <GoonaIcon icon={Icons.calendar} size={17} color="#A0AEA1" />
                <Text style={styles.fieldInputText}>{formatDate(birthDate)}</Text>
              </TouchableOpacity>
              {showDatePicker && (
                <View style={styles.datePickerWrap}>
                  <DateTimePicker
                    value={birthDate}
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

            {/* OFFSPRING */}
            <View style={styles.formSection}>
              <View style={styles.offspringHeader}>
                <Text style={styles.formLabel}>Offspring <Text style={styles.required}>*</Text></Text>
                <TouchableOpacity style={styles.addKidBtn} activeOpacity={0.85} onPress={addOffspringRow}>
                  <GoonaIcon icon={Icons.plus} size={14} color="#FFFFFF" />
                  <Text style={styles.addKidText}>Add</Text>
                </TouchableOpacity>
              </View>

              {offspring.map((kid, index) => (
                <View key={index} style={styles.offspringRow}>
                  <View style={styles.offspringNum}>
                    <Text style={styles.offspringNumText}>{index + 1}</Text>
                  </View>
                  <View style={styles.offspringFields}>
                    <TextInput
                      value={kid.tag}
                      onChangeText={(v) => updateOffspring(index, { tag: v })}
                      placeholder="Tag / name"
                      placeholderTextColor="#A0AEA1"
                      style={styles.offspringTagInput}
                    />
                    <View style={styles.offspringSexRow}>
                      <TouchableOpacity
                        style={[styles.offspringSexBtn, kid.sex === 'male' && styles.offspringSexMale]}
                        activeOpacity={0.85}
                        onPress={() => updateOffspring(index, { sex: 'male' })}
                      >
                        <Text style={[styles.offspringSexText, kid.sex === 'male' && styles.offspringSexTextActive]}>
                          Male
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.offspringSexBtn, kid.sex === 'female' && styles.offspringSexFemale]}
                        activeOpacity={0.85}
                        onPress={() => updateOffspring(index, { sex: 'female' })}
                      >
                        <Text style={[styles.offspringSexText, kid.sex === 'female' && styles.offspringSexTextActive]}>
                          Female
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  {offspring.length > 1 && (
                    <TouchableOpacity style={styles.offspringRemove} activeOpacity={0.7} onPress={() => removeOffspringRow(index)}>
                      <GoonaIcon icon={Icons.x} size={14} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>

            {/* NOTES */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Notes (optional)</Text>
              <View style={[styles.fieldWrap, styles.notesWrap]}>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Birth observations, complications..."
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
              <LinearGradient colors={['#7C3AED', '#5B21B6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
              <Text style={styles.saveText}>Save Birth</Text>
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
  headerIconWrap: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#F5F3FF', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
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
  fieldInputText: { fontSize: 15, fontWeight: '500', color: '#1B1B1B' },
  hintText: { fontSize: 12, fontWeight: '500', color: '#94A3B8', marginBottom: 8, lineHeight: 16 },
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
  pickerItemActive: { backgroundColor: '#7C3AED' },
  pickerItemText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1B1B1B' },
  pickerItemTextActive: { color: '#FFFFFF' },
  pickerItemMeta: { fontSize: 12, fontWeight: '500', color: '#94A3B8' },
  pickerEmpty: { padding: 16, textAlign: 'center', fontSize: 13, fontWeight: '500', color: '#94A3B8' },
  datePickerWrap: { backgroundColor: 'white', borderRadius: 16, marginTop: 8, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 2 },
  dateDoneBtn: { height: 44, alignItems: 'center', justifyContent: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  dateDoneText: { fontSize: 15, fontWeight: '600', color: '#7C3AED' },
  offspringHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  addKidBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#7C3AED', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  addKidText: { fontSize: 12, fontWeight: '800', color: '#FFFFFF' },
  offspringRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 12 },
  offspringNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  offspringNumText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  offspringFields: { flex: 1, gap: 6 },
  offspringTagInput: {
    height: 40, borderRadius: 10, backgroundColor: '#F2F6F1',
    borderWidth: 1.5, borderColor: '#E2E8F0', paddingHorizontal: 12,
    fontSize: 14, fontWeight: '500', color: '#1B1B1B',
  },
  offspringSexRow: { flexDirection: 'row', gap: 6 },
  offspringSexBtn: {
    flex: 1, height: 34, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0',
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#F2F6F1',
  },
  offspringSexMale: { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
  offspringSexFemale: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  offspringSexText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  offspringSexTextActive: { color: '#FFFFFF' },
  offspringRemove: { padding: 8, marginTop: 14 },
  notesWrap: { height: 80, alignItems: 'flex-start', paddingTop: 12 },
  notesInput: { flex: 1, fontSize: 14, fontWeight: '500', color: '#1B1B1B', padding: 0, margin: 0, width: '100%' },
  actions: { flexDirection: 'row', gap: 12, paddingHorizontal: 24, paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  cancelBtn: { flex: 1, height: 50, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  cancelText: { fontSize: 15, fontWeight: '700', color: '#64748B' },
  saveBtn: { flex: 1, height: 50, borderRadius: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  saveBtnDisabled: { opacity: 0.5 },
  saveText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
})
