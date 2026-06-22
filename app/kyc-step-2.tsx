import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, Platform, ActivityIndicator,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import GoonaIcon from '../components/ui/GoonaIcon'
import { Icons } from '../shared/icons'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useWalletStore } from '../store/useWalletStore'
import * as Haptics from 'expo-haptics'

export default function KycStep2Screen() {
  const insets = useSafeAreaInsets()
  const existing = useWalletStore((s) => s.kyc.step2)
  const setKycStep2 = useWalletStore((s) => s.setKycStep2)

  const [bvn, setBvn] = useState(existing.bvn)
  const [verifying, setVerifying] = useState(false)
  const [verified, setVerified] = useState(false)

  const isValid = bvn.length >= 10

  const handleVerify = async () => {
    if (!isValid || verified) return
    setVerifying(true)
    await new Promise((r) => setTimeout(r, 1500))
    setVerifying(false)
    setVerified(true)
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  }

  const handleSubmit = () => {
    setKycStep2({ bvn, completed: true })
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    router.push('/kyc-step-3')
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
            <GoonaIcon icon={Icons.arrowLeft} size={20} color="#1F2937" />
          </TouchableOpacity>
          <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>Step 2 of 5</Text></View>
          <Text style={styles.title}>BVN Verification</Text>
          <Text style={styles.subtitle}>Verify your Bank Verification Number.</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(80).springify()} style={styles.formCard}>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>BVN (Bank Verification Number)</Text>
            <TextInput style={styles.input} value={bvn} onChangeText={setBvn} keyboardType="numeric" placeholder="Enter 11-digit BVN" placeholderTextColor="#CBD5E1" maxLength={11} editable={!verified} />
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.verifyBtn, (!isValid || verified) && styles.verifyBtnDone]}
            disabled={!isValid || verifying || verified}
            onPress={handleVerify}
          >
            <LinearGradient colors={verified ? ['#16A34A', '#15803D'] : ['#2E7D32', '#1B5E20']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.verifyGrad}>
              {verifying ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : verified ? (
                <>
                  <GoonaIcon icon={Icons.checkCircle} size={18} color="#FFFFFF" />
                  <Text style={styles.verifyText}>Verified</Text>
                </>
              ) : (
                <Text style={styles.verifyText}>Verify BVN</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {verified && (
          <Animated.View entering={FadeInDown.duration(400).springify()}>
            <TouchableOpacity activeOpacity={0.85} style={styles.submitBtn} onPress={handleSubmit}>
              <LinearGradient colors={['#2E7D32', '#1B5E20']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.submitGrad}>
                <Text style={styles.submitText}>Continue</Text>
                <GoonaIcon icon={Icons.chevronRight} size={18} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}
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
  verifyBtn: { borderRadius: 14, overflow: 'hidden', marginBottom: 4 },
  verifyBtnDone: { opacity: 0.7 },
  verifyGrad: { height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  verifyText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  submitBtn: { borderRadius: 18, overflow: 'hidden', shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.3, shadowRadius: 30, elevation: 6 },
  submitGrad: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  submitText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
})
