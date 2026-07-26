import React, { useState, useMemo, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, TextInput, ScrollView,
  StyleSheet, Platform, Modal, KeyboardAvoidingView,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, { SlideInUp, FadeInUp } from 'react-native-reanimated'
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'
import GoonaIcon from '../ui/GoonaIcon'
import { Icons } from '../../shared/icons'
import { useAnimalStore, type Animal, type AnimalSex } from '../../store/useAnimalStore'

export interface AnimalFormData {
  tag: string
  dateOfBirth: Date
  sex: AnimalSex
  breed: string
  weight: string
  height: string
  notes: string
}

interface Props {
  visible: boolean
  onClose: () => void
  batchId: string
  editAnimal?: Animal
}

const emptyForm: AnimalFormData = {
  tag: '',
  dateOfBirth: new Date(),
  sex: 'female',
  breed: '',
  weight: '',
  height: '',
  notes: '',
}

function formatDate(d: Date): string {
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear()
  return `${day} / ${month} / ${year}`
}

function computeAge(dob: Date): string {
  const now = Date.now()
  const diff = now - dob.getTime()
  const years = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000))
  const months = Math.floor((diff % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000))
  if (years > 0) return `${years}y ${months}m`
  if (months > 0) return `${months}m`
  const days = Math.floor(diff / (24 * 60 * 60 * 1000))
  return `${days}d`
}

export default function AddAnimalSheet({ visible, onClose, batchId, editAnimal }: Props) {
  const addAnimal = useAnimalStore((s) => s.addAnimal)
  const updateAnimal = useAnimalStore((s) => s.updateAnimal)

  const [tag, setTag] = useState(editAnimal?.tag ?? '')
  const [dateOfBirth, setDateOfBirth] = useState(editAnimal ? new Date(editAnimal.dateOfBirth) : new Date())
  const [sex, setSex] = useState<AnimalSex>(editAnimal?.sex ?? 'female')
  const [breed, setBreed] = useState(editAnimal?.breed ?? '')
  const [weight, setWeight] = useState(editAnimal?.weight != null ? String(editAnimal.weight) : '')
  const [height, setHeight] = useState(editAnimal?.height != null ? String(editAnimal.height) : '')
  const [notes, setNotes] = useState(editAnimal?.notes ?? '')
  const [showDatePicker, setShowDatePicker] = useState(false)

  const isEditing = !!editAnimal

  const reset = useCallback(() => {
    setTag('')
    setDateOfBirth(new Date())
    setSex('female')
    setBreed('')
    setWeight('')
    setHeight('')
    setNotes('')
  }, [])

  const ageDisplay = useMemo(() => computeAge(dateOfBirth), [dateOfBirth])

  const handleDateChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false)
    if (date) setDateOfBirth(date)
  }

  const handleSave = () => {
    const trimmedTag = tag.trim()
    if (!trimmedTag) return

    const parsedWeight = weight ? parseFloat(weight) : undefined
    const parsedHeight = height ? parseFloat(height) : undefined

    if (isEditing && editAnimal) {
      updateAnimal(editAnimal.id, {
        tag: trimmedTag,
        dateOfBirth: dateOfBirth.toISOString(),
        sex,
        breed: breed.trim() || undefined,
        weight: parsedWeight && !isNaN(parsedWeight) ? parsedWeight : undefined,
        height: parsedHeight && !isNaN(parsedHeight) ? parsedHeight : undefined,
        notes: notes.trim() || undefined,
      })
    } else {
      addAnimal({
        batchId,
        tag: trimmedTag,
        dateOfBirth: dateOfBirth.toISOString(),
        sex,
        breed: breed.trim() || undefined,
        weight: parsedWeight && !isNaN(parsedWeight) ? parsedWeight : undefined,
        height: parsedHeight && !isNaN(parsedHeight) ? parsedHeight : undefined,
        status: 'active',
        notes: notes.trim() || undefined,
      })
    }
    reset()
    onClose()
  }

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
                <GoonaIcon icon={Icons.userPlus} size={24} color="#2E7D32" />
              </View>
              <Text style={styles.title}>{isEditing ? 'Edit Animal' : 'Add Animal'}</Text>
              <Text style={styles.desc}>
                {isEditing ? 'Update this animal\'s profile.' : 'Create a profile for an animal in this herd.'}
              </Text>
            </View>

            {/* TAG / NAME */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Tag / Name <Text style={styles.required}>*</Text></Text>
              <View style={styles.fieldWrap}>
                <View style={styles.fieldIco}>
                  <GoonaIcon icon={Icons.fingerprint} size={17} color="#A0AEA1" />
                </View>
                <View style={styles.fieldInner}>
                  <Text style={styles.fieldLbl}>Animal identifier</Text>
                  <TextInput
                    value={tag}
                    onChangeText={setTag}
                    placeholder="e.g. Goat #12"
                    placeholderTextColor="#A0AEA1"
                    style={styles.fieldInput}
                  />
                </View>
              </View>
            </View>

            {/* DATE OF BIRTH */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Date of Birth <Text style={styles.required}>*</Text></Text>
              <TouchableOpacity
                style={styles.fieldWrap}
                activeOpacity={0.85}
                onPress={() => setShowDatePicker(true)}
              >
                <View style={styles.fieldIco}>
                  <GoonaIcon icon={Icons.calendar} size={17} color="#A0AEA1" />
                </View>
                <View style={styles.fieldInner}>
                  <Text style={styles.fieldLbl}>Birth date</Text>
                  <Text style={styles.fieldInputText}>{formatDate(dateOfBirth)}</Text>
                </View>
                <View style={styles.fieldRight}>
                  <Text style={styles.ageBadge}>{ageDisplay}</Text>
                </View>
              </TouchableOpacity>
              {showDatePicker && (
                <View style={styles.datePickerWrap}>
                  <DateTimePicker
                    value={dateOfBirth}
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

            {/* SEX */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Sex <Text style={styles.required}>*</Text></Text>
              <View style={styles.sexRow}>
                <TouchableOpacity
                  style={[styles.sexBtn, sex === 'male' && styles.sexBtnActive]}
                  activeOpacity={0.85}
                  onPress={() => setSex('male')}
                >
                  <GoonaIcon icon={Icons.user} size={18} color={sex === 'male' ? '#FFFFFF' : '#64748B'} />
                  <Text style={[styles.sexBtnText, sex === 'male' && styles.sexBtnTextActive]}>Male</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sexBtn, sex === 'female' && styles.sexBtnFemaleActive]}
                  activeOpacity={0.85}
                  onPress={() => setSex('female')}
                >
                  <GoonaIcon icon={Icons.user} size={18} color={sex === 'female' ? '#FFFFFF' : '#64748B'} />
                  <Text style={[styles.sexBtnText, sex === 'female' && styles.sexBtnTextActive]}>Female</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* BREED */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Breed (optional)</Text>
              <View style={styles.fieldWrap}>
                <View style={styles.fieldIco}>
                  <GoonaIcon icon={Icons.book} size={17} color="#A0AEA1" />
                </View>
                <View style={styles.fieldInner}>
                  <Text style={styles.fieldLbl}>Breed</Text>
                  <TextInput
                    value={breed}
                    onChangeText={setBreed}
                    placeholder="e.g. Boer, Duroc"
                    placeholderTextColor="#A0AEA1"
                    style={styles.fieldInput}
                  />
                </View>
              </View>
            </View>

            {/* WEIGHT & HEIGHT */}
            <View style={styles.formRow}>
              <View style={[styles.formSection, { flex: 1 }]}>
                <Text style={styles.formLabel}>Weight (kg)</Text>
                <View style={styles.fieldWrap}>
                  <TextInput
                    value={weight}
                    onChangeText={(v) => setWeight(v.replace(/[^0-9.]/g, ''))}
                    keyboardType="decimal-pad"
                    placeholder="0.0"
                    placeholderTextColor="#A0AEA1"
                    style={styles.fieldInputSingle}
                  />
                </View>
              </View>
              <View style={[styles.formSection, { flex: 1 }]}>
                <Text style={styles.formLabel}>Height (cm)</Text>
                <View style={styles.fieldWrap}>
                  <TextInput
                    value={height}
                    onChangeText={(v) => setHeight(v.replace(/[^0-9.]/g, ''))}
                    keyboardType="decimal-pad"
                    placeholder="0.0"
                    placeholderTextColor="#A0AEA1"
                    style={styles.fieldInputSingle}
                  />
                </View>
              </View>
            </View>

            {/* NOTES */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Notes (optional)</Text>
              <View style={[styles.fieldWrap, styles.notesWrap]}>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Health notes, markings, observations..."
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
              style={[styles.saveBtn, !tag.trim() && styles.saveBtnDisabled]}
              activeOpacity={0.85}
              onPress={handleSave}
              disabled={!tag.trim()}
            >
              <LinearGradient
                colors={['#16A34A', '#0F6B32']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.saveText}>{isEditing ? 'Update' : 'Save Animal'}</Text>
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
  headerIconWrap: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '800', color: '#15291A', textAlign: 'center' },
  desc: { fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 6, lineHeight: 20, paddingHorizontal: 8 },
  formSection: { marginBottom: 16 },
  formRow: { flexDirection: 'row', gap: 12 },
  formLabel: { fontSize: 13, fontWeight: '700', color: '#1F2937', marginBottom: 6 },
  required: { color: '#EF4444' },
  fieldWrap: {
    flexDirection: 'row', alignItems: 'center', height: 52, borderRadius: 16,
    backgroundColor: '#F2F6F1', borderWidth: 1.5, borderColor: '#E2E8F0',
    paddingHorizontal: 14, gap: 10,
  },
  fieldIco: { width: 20, height: 20, flexShrink: 0, alignItems: 'center', justifyContent: 'center' },
  fieldInner: { flex: 1, justifyContent: 'center', minWidth: 0 },
  fieldLbl: { fontSize: 10, fontWeight: '500', color: '#A0AEA1', marginBottom: 1 },
  fieldInput: { fontSize: 15, fontWeight: '500', color: '#1B1B1B', padding: 0, margin: 0 },
  fieldInputText: { fontSize: 15, fontWeight: '500', color: '#1B1B1B' },
  fieldInputSingle: { flex: 1, fontSize: 15, fontWeight: '500', color: '#1B1B1B', padding: 0, margin: 0, textAlign: 'center' },
  fieldRight: { flexShrink: 0 },
  ageBadge: { fontSize: 12, fontWeight: '700', color: '#16A34A', backgroundColor: '#F0FDF4', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, overflow: 'hidden' },
  datePickerWrap: { backgroundColor: 'white', borderRadius: 16, marginTop: 8, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 2 },
  dateDoneBtn: { height: 44, alignItems: 'center', justifyContent: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  dateDoneText: { fontSize: 15, fontWeight: '600', color: '#2E7D32' },
  sexRow: { flexDirection: 'row', gap: 10 },
  sexBtn: {
    flex: 1, height: 48, borderRadius: 14, borderWidth: 1.5, borderColor: '#E2E8F0',
    backgroundColor: '#F2F6F1', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  sexBtnActive: { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
  sexBtnFemaleActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  sexBtnText: { fontSize: 14, fontWeight: '700', color: '#64748B' },
  sexBtnTextActive: { color: '#FFFFFF' },
  notesWrap: { height: 80, alignItems: 'flex-start', paddingTop: 12 },
  notesInput: { flex: 1, fontSize: 14, fontWeight: '500', color: '#1B1B1B', padding: 0, margin: 0, width: '100%' },
  actions: { flexDirection: 'row', gap: 12, paddingHorizontal: 24, paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  cancelBtn: { flex: 1, height: 50, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  cancelText: { fontSize: 15, fontWeight: '700', color: '#64748B' },
  saveBtn: { flex: 1, height: 50, borderRadius: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  saveBtnDisabled: { opacity: 0.5 },
  saveText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
})
