import React, { useState, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, Platform,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import GoonaIcon from '../components/ui/GoonaIcon'
import {
  ArrowLeft, ChevronRight, Calendar,
} from 'lucide-react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useWalletStore } from '../store/useWalletStore'
import * as Haptics from 'expo-haptics'
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatDob(date: Date): string {
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`
}

const EIGHTEEN_YEARS_MS = 18 * 365.25 * 24 * 60 * 60 * 1000

export default function KycStep1Screen() {
  const insets = useSafeAreaInsets()
  const existing = useWalletStore((s) => s.kyc.step1)
  const setKycStep1 = useWalletStore((s) => s.setKycStep1)

  const [firstName, setFirstName] = useState(existing.firstName)
  const [lastName, setLastName] = useState(existing.lastName)
  const [dob, setDob] = useState(existing.dateOfBirth)
  const [showPicker, setShowPicker] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
    if (!existing.dateOfBirth) return null
    const d = new Date(existing.dateOfBirth)
    return isNaN(d.getTime()) ? null : d
  })

  const isValid = firstName.trim().length > 0 && lastName.trim().length > 0 && dob.length > 0

  const handleSubmit = () => {
    if (!isValid) return
    setKycStep1({ firstName: firstName.trim(), lastName: lastName.trim(), dateOfBirth: dob, completed: true })
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    router.push('/kyc-step-2')
  }

  const handleDateChange = useCallback((event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false)
    }
    if (event.type === 'set' && date) {
      setSelectedDate(date)
      setDob(formatDob(date))
    }
  }, [])

  const handleDoneIOS = useCallback(() => {
    setShowPicker(false)
  }, [])

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[{ paddingHorizontal: 20, paddingBottom: insets.bottom + 140 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(600).springify()} style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.7} onPress={() => router.back()}>
            <GoonaIcon icon={ArrowLeft} size={20} color="#1F2937" />
          </TouchableOpacity>
          <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>Step 1 of 5</Text></View>
          <Text style={styles.title}>Personal Information</Text>
          <Text style={styles.subtitle}>Tell us about yourself to get started.</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(80).springify()} style={styles.formCard}>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>First Name</Text>
            <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="Enter your first name" placeholderTextColor="#CBD5E1" />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Last Name</Text>
            <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholder="Enter your last name" placeholderTextColor="#CBD5E1" />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Date of Birth</Text>
            <TouchableOpacity
              style={[styles.input, { flexDirection: 'row', alignItems: 'center', gap: 10 }]}
              activeOpacity={0.8}
              onPress={() => setShowPicker(true)}
            >
              <GoonaIcon icon={Calendar} size={18} color={dob ? '#2E7D32' : '#94A3B8'} />
              <Text style={[{ fontSize: 16, fontWeight: '600', color: '#1F2937', flex: 1 }, !dob && { color: '#CBD5E1', fontWeight: '400' }]}>
                {dob || 'Select Date of Birth'}
              </Text>
            </TouchableOpacity>
          </View>
          {showPicker && (
            <View style={{ backgroundColor: '#F8FAF7', borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0', marginTop: -8, marginBottom: 4 }}>
              {Platform.OS === 'ios' && (
                <TouchableOpacity style={{ alignSelf: 'flex-end', paddingHorizontal: 16, paddingVertical: 8 }} onPress={handleDoneIOS}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#2E7D32' }}>Done</Text>
                </TouchableOpacity>
              )}
              <DateTimePicker
                value={selectedDate || new Date(1990, 0, 1)}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                maximumDate={new Date(Date.now() - EIGHTEEN_YEARS_MS)}
                onChange={handleDateChange}
              />
            </View>
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(140).springify()}>
          <TouchableOpacity activeOpacity={0.85} style={[styles.submitBtn, !isValid && styles.submitBtnDisabled]} disabled={!isValid} onPress={handleSubmit}>
            <LinearGradient colors={['#2E7D32', '#1B5E20']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.submitGrad}>
              <Text style={styles.submitText}>Continue</Text>
              <GoonaIcon icon={ChevronRight} size={18} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAF7' },
  scroll: { flex: 1 },
  header: { marginBottom: 24 },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 14, elevation: 3 },
  stepBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(0,105,92,0.08)', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 100, marginBottom: 12 },
  stepBadgeText: { fontSize: 11, fontWeight: '700', color: '#00695C' },
  title: { fontSize: 30, fontWeight: '800', color: '#1B1B1B', lineHeight: 37 },
  subtitle: { fontSize: 15, color: '#94A3B8', marginTop: 6, lineHeight: 22 },
  formCard: { backgroundColor: 'white', borderRadius: 24, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 16, elevation: 2 },
  fieldGroup: { marginBottom: 20 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: '#F8FAF7', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, fontWeight: '600', color: '#1F2937', borderWidth: 1, borderColor: '#E2E8F0' },
  submitBtn: { borderRadius: 18, overflow: 'hidden', shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.3, shadowRadius: 30, elevation: 6 },
  submitBtnDisabled: { opacity: 0.4 },
  submitGrad: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  submitText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
})
