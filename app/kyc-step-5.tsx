import React, { useState } from 'react'
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
  ArrowLeft, ChevronRight, Building2, Check,
} from 'lucide-react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useWalletStore } from '../store/useWalletStore'
import * as Haptics from 'expo-haptics'

export default function KycStep5Screen() {
  const insets = useSafeAreaInsets()
  const existing = useWalletStore((s) => s.kyc.step5)
  const setKycStep5 = useWalletStore((s) => s.setKycStep5)

  const [farmName, setFarmName] = useState(existing.farmName)
  const [businessType, setBusinessType] = useState(existing.businessType)
  const [cacNumber, setCacNumber] = useState(existing.cacNumber)

  const handleSubmit = () => {
    setKycStep5({ farmName: farmName.trim(), businessType: businessType.trim(), cacNumber: cacNumber.trim(), completed: true })
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    router.push('/wallet-activation')
  }

  const handleSkip = () => {
    setKycStep5({ farmName: '', businessType: '', cacNumber: '', completed: true })
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    router.push('/wallet-activation')
  }

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
          <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>Step 5 of 5</Text></View>
          <Text style={styles.title}>Business Information</Text>
          <Text style={styles.subtitle}>Tell us about your farm business (optional for smaller farms).</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(80).springify()} style={styles.optionalCard}>
          <GoonaIcon icon={Building2} size={20} color="#2E7D32" />
          <View style={{ flex: 1 }}>
            <Text style={styles.optionalTitle}>Optional Step</Text>
            <Text style={styles.optionalDesc}>You can skip this and come back later.</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(120).springify()} style={styles.formCard}>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Farm Name</Text>
            <TextInput style={styles.input} value={farmName} onChangeText={setFarmName} placeholder="e.g. Adewale Farms" placeholderTextColor="#CBD5E1" />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Business Type</Text>
            <TextInput style={styles.input} value={businessType} onChangeText={setBusinessType} placeholder="e.g. Poultry Farming" placeholderTextColor="#CBD5E1" />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>CAC Registration Number (Optional)</Text>
            <TextInput style={styles.input} value={cacNumber} onChangeText={setCacNumber} placeholder="RC-123456" placeholderTextColor="#CBD5E1" />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(160).springify()} style={styles.actionStack}>
          <TouchableOpacity activeOpacity={0.85} style={styles.submitBtn} onPress={handleSubmit}>
            <LinearGradient colors={['#2E7D32', '#1B5E20']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.submitGrad}>
              <Text style={styles.submitText}>Save & Continue</Text>
              <GoonaIcon icon={ChevronRight} size={18} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.skipBtn} activeOpacity={0.7} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip this Step</Text>
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
  optionalCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F0FDF4', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#D4EDDA' },
  optionalTitle: { fontSize: 14, fontWeight: '700', color: '#166534' },
  optionalDesc: { fontSize: 12, color: '#16A34A', marginTop: 2 },
  formCard: { backgroundColor: 'white', borderRadius: 24, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 16, elevation: 2 },
  fieldGroup: { marginBottom: 20 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: '#F8FAF7', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, fontWeight: '600', color: '#1F2937', borderWidth: 1, borderColor: '#E2E8F0' },
  actionStack: { gap: 16 },
  submitBtn: { borderRadius: 18, overflow: 'hidden', shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.3, shadowRadius: 30, elevation: 6 },
  submitGrad: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  submitText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  skipBtn: { alignItems: 'center', paddingVertical: 12 },
  skipText: { fontSize: 14, fontWeight: '600', color: '#94A3B8' },
})
