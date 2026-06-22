import React, { useEffect } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Platform,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import GoonaIcon from '../components/ui/GoonaIcon'
import { Icons } from '../shared/icons'
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { useWalletStore, isKycFullyCompleted, getPendingReturnUrl, setPendingReturnUrl } from '../store/useWalletStore'

const STEPS = [
  { icon: Icons.user, label: 'Personal Information', desc: 'Name, Date of Birth', route: '/kyc-step-1', step: 1 },
  { icon: Icons.fingerprint, label: 'BVN Verification', desc: 'Verify your BVN', route: '/kyc-step-2', step: 2 },
  { icon: Icons.shieldCheck, label: 'Identity Verification', desc: 'Verify your NIN', route: '/kyc-step-3', step: 3 },
  { icon: Icons.camera, label: 'Selfie Verification', desc: 'Capture a selfie', route: '/kyc-step-4', step: 4 },
  { icon: Icons.building2, label: 'Business Information', desc: 'Farm name, CAC (Optional)', route: '/kyc-step-5', step: 5 },
]

const BENEFITS = [
  'Save for Farm Projects',
  'Receive Payments',
  'Transfer Funds',
  'Withdraw Funds',
  'Earn Rewards',
]

export default function WalletActivationScreen() {
  const insets = useSafeAreaInsets()
  const kyc = useWalletStore((s) => s.kyc)
  const status = useWalletStore((s) => s.walletStatus)

  const allDone = isKycFullyCompleted(kyc)

  const completedCount = [kyc.step1.completed, kyc.step2.completed, kyc.step3.completed, kyc.step4.completed, kyc.step5.completed].filter(Boolean).length

  const statusLabel = status === 'activated' ? 'Active' : status === 'pending' ? 'Verification Pending' : 'Not Activated'
  const statusColor = status === 'activated' ? '#16A34A' : status === 'pending' ? '#F59E0B' : '#94A3B8'

  useEffect(() => {
    if (status === 'activated') {
      const pending = getPendingReturnUrl()
      if (pending) {
        setPendingReturnUrl(null)
        router.replace(pending)
      }
    }
  }, [status])

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
          <Text style={styles.title}>GOONA Wallet</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(80).springify()} style={styles.statusRow}>
          <Text style={styles.statusLabel}>Status</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </Animated.View>

        {status === 'activated' ? (
          <Animated.View entering={FadeInUp.duration(400).delay(100).springify()} style={styles.activatedCard}>
            <LinearGradient colors={['#2E7D32', '#1B5E20']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.activatedGrad}>
              <View style={styles.activatedIcon}><GoonaIcon icon={Icons.checkCircle} size={40} color="#FFFFFF" /></View>
              <Text style={styles.activatedTitle}>Wallet Activated Successfully</Text>
              <Text style={styles.activatedDesc}>Your identity has been verified and your GOONA Wallet is ready to use.</Text>
              <View style={styles.activatedFeatures}>
                {['Wallet Account Number: 1234 5678 90', 'Balance: \u20A60.00', 'Receive Money', 'Transfer', 'Withdraw', 'Fund Recapt Goals'].map((f, i) => (
                  <View key={i} style={styles.activatedFeatureRow}>
                    <GoonaIcon icon={Icons.check} size={14} color="#AEEA00" />
                    <Text style={styles.activatedFeatureText}>{f}</Text>
                  </View>
                ))}
              </View>
            </LinearGradient>
          </Animated.View>
        ) : (
          <>
            <Animated.View entering={FadeInDown.duration(400).delay(100).springify()} style={styles.benefitsCard}>
              <Text style={styles.benefitsTitle}>Unlock Financial Features</Text>
              {BENEFITS.map((b, i) => (
                <View key={i} style={styles.benefitRow}>
                  <GoonaIcon icon={Icons.check} size={14} color="#2E7D32" />
                  <Text style={styles.benefitText}>{b}</Text>
                </View>
              ))}
              {!allDone && (
                <TouchableOpacity activeOpacity={0.85} style={styles.activateBtn} onPress={() => router.push('/kyc-step-1')}>
                  <LinearGradient colors={['#2E7D32', '#1B5E20']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.activateGrad}>
                    <Text style={styles.activateBtnText}>Activate Wallet</Text>
                    <GoonaIcon icon={Icons.chevronRight} size={18} color="#FFFFFF" />
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </Animated.View>

            <Animated.View entering={FadeInUp.duration(400).delay(160).springify()} style={styles.progressCard}>
              <Text style={styles.progressLabel}>Verification Progress</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${Math.round((completedCount / 5) * 100)}%` }]} />
              </View>
              <Text style={styles.progressText}>{completedCount} of 5 steps completed</Text>
            </Animated.View>

            <Animated.View entering={FadeInUp.duration(400).delay(200).springify()}>
              <Text style={styles.sectionLabel}>Verification Steps</Text>
              {STEPS.map((step) => {
                const stepKey = `step${step.step}` as keyof typeof kyc
                const completed = kyc[stepKey].completed
                return (
                  <TouchableOpacity key={step.step} style={styles.stepCard} activeOpacity={0.7} onPress={() => router.push(step.route as any)}>
                    <View style={[styles.stepIcon, completed && styles.stepIconDone]}>
                      <GoonaIcon icon={completed ? Check : step.icon} size={18} color={completed ? '#FFFFFF' : '#2E7D32'} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.stepLabel}>{step.label}</Text>
                      <Text style={styles.stepDesc}>{step.desc}</Text>
                    </View>
                    {completed ? (
                      <Text style={styles.stepDoneText}>Done</Text>
                    ) : (
                      <GoonaIcon icon={Icons.chevronRight} size={16} color="#94A3B8" />
                    )}
                  </TouchableOpacity>
                )
              })}
            </Animated.View>

            {allDone && (
              <Animated.View entering={FadeInUp.duration(400).springify()} style={{ marginBottom: 24 }}>
                <TouchableOpacity activeOpacity={0.85} style={styles.activateBtn} onPress={() => {
                  useWalletStore.getState().setWalletStatus('activated')
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
                  const pending = getPendingReturnUrl()
                  if (pending) {
                    setPendingReturnUrl(null)
                    router.replace(pending)
                  }
                }}>
                  <LinearGradient colors={['#2E7D32', '#1B5E20']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.activateGrad}>
                    <GoonaIcon icon={Icons.check} size={20} color="#FFFFFF" />
                    <Text style={styles.activateBtnText}>Activate Wallet</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAF7' },
  scroll: { flex: 1 },
  header: { marginBottom: 16 },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 14, elevation: 3 },
  title: { fontSize: 30, fontWeight: '800', color: '#1B1B1B', lineHeight: 37 },

  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 },
  statusLabel: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 14, borderRadius: 100 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13, fontWeight: '700' },

  benefitsCard: { backgroundColor: 'white', borderRadius: 24, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 16, elevation: 2 },
  benefitsTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937', marginBottom: 14 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  benefitText: { fontSize: 14, fontWeight: '500', color: '#4B5563' },
  activateBtn: { borderRadius: 18, overflow: 'hidden', marginTop: 16, shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.3, shadowRadius: 30, elevation: 6 },
  activateGrad: { height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  activateBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },

  progressCard: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 },
  progressLabel: { fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  progressBar: { height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', backgroundColor: '#2E7D32', borderRadius: 3 },
  progressText: { fontSize: 12, fontWeight: '600', color: '#94A3B8' },

  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#1F2937', marginBottom: 12 },
  stepCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: 'white', borderRadius: 18, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  stepIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center' },
  stepIconDone: { backgroundColor: '#2E7D32' },
  stepLabel: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  stepDesc: { fontSize: 11, fontWeight: '500', color: '#94A3B8', marginTop: 1 },
  stepDoneText: { fontSize: 12, fontWeight: '700', color: '#2E7D32' },

  activatedCard: { borderRadius: 24, marginBottom: 24, overflow: 'hidden', shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.3, shadowRadius: 30, elevation: 8 },
  activatedGrad: { padding: 28, alignItems: 'center' },
  activatedIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  activatedTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', textAlign: 'center', marginBottom: 8 },
  activatedDesc: { fontSize: 14, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  activatedFeatures: { width: '100%', gap: 10 },
  activatedFeatureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  activatedFeatureText: { fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.85)' },
})
