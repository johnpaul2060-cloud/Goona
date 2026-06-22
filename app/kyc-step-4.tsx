import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Platform, Alert, Image,
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
import * as ImagePicker from 'expo-image-picker'

export default function KycStep4Screen() {
  const insets = useSafeAreaInsets()
  const existing = useWalletStore((s) => s.kyc.step4)
  const setKycStep4 = useWalletStore((s) => s.setKycStep4)

  const [selfieUri, setSelfieUri] = useState<string | null>(existing.selfieUri)

  const handleTakeSelfie = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera access is needed for selfie verification.')
      return
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: true, aspect: [4, 3] })
    if (!result.canceled && result.assets?.[0]?.uri) {
      setSelfieUri(result.assets[0].uri)
    }
  }

  const handleSubmit = () => {
    if (!selfieUri) return
    setKycStep4({ selfieUri, completed: true })
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    router.push('/kyc-step-5')
  }

  const isDone = selfieUri !== null

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[{ paddingHorizontal: 20, paddingBottom: insets.bottom + 140 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(600).springify()} style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.7} onPress={() => router.back()}>
            <GoonaIcon icon={Icons.arrowLeft} size={20} color="#1F2937" />
          </TouchableOpacity>
          <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>Step 4 of 5</Text></View>
          <Text style={styles.title}>Selfie Verification</Text>
          <Text style={styles.subtitle}>Take a clear selfie to verify your identity.</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(80).springify()} style={styles.selfieCard}>
          <Text style={styles.fieldLabel}>Selfie</Text>
          <Text style={styles.selfieDesc}>Ensure good lighting, face forward, and no obstructions.</Text>
          {selfieUri ? (
            <View style={styles.previewWrap}>
              <Image source={{ uri: selfieUri }} style={styles.preview} />
              <TouchableOpacity style={styles.retakeBtn} activeOpacity={0.7} onPress={handleTakeSelfie}>
                <Text style={styles.retakeText}>Retake</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.captureBtn} activeOpacity={0.85} onPress={handleTakeSelfie}>
              <View style={styles.captureIcon}><GoonaIcon icon={Icons.camera} size={32} color="#2E7D32" /></View>
              <Text style={styles.captureText}>Take Selfie</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        {isDone && (
          <Animated.View entering={FadeInDown.duration(400).delay(120).springify()}>
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
  selfieCard: { backgroundColor: 'white', borderRadius: 24, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 16, elevation: 2 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  selfieDesc: { fontSize: 13, color: '#94A3B8', marginBottom: 16, lineHeight: 18 },
  captureBtn: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, borderRadius: 16, borderWidth: 2, borderColor: '#E2E8F0', borderStyle: 'dashed', backgroundColor: '#F8FAF7' },
  captureIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  captureText: { fontSize: 15, fontWeight: '700', color: '#2E7D32' },
  previewWrap: { alignItems: 'center' },
  preview: { width: 200, height: 250, borderRadius: 16, marginBottom: 12 },
  retakeBtn: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 100, backgroundColor: '#F1F5F9' },
  retakeText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  submitBtn: { borderRadius: 18, overflow: 'hidden', shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.3, shadowRadius: 30, elevation: 6 },
  submitGrad: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  submitText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
})
