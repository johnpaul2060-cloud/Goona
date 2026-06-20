import React from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Platform,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import GoonaIcon from '../components/ui/GoonaIcon'
import {
  ArrowLeft, Check, X, Mail, Phone, Fingerprint,
  ShieldCheck, Building2, Camera, User, Award,
} from 'lucide-react-native'
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { useWalletStore, getVerificationScore, getVerifiedCount } from '../store/useWalletStore'

const VERIFICATION_ITEMS = [
  { key: 'email', label: 'Email Verified', icon: Mail },
  { key: 'phone', label: 'Phone Verified', icon: Phone },
  { key: 'bvn', label: 'BVN Verified', icon: Fingerprint },
  { key: 'nin', label: 'NIN Verified', icon: ShieldCheck },
  { key: 'selfie', label: 'Selfie Verified', icon: Camera },
  { key: 'business', label: 'Business Verified', icon: Building2 },
]

export default function VerificationCenterScreen() {
  const insets = useSafeAreaInsets()
  const kyc = useWalletStore((s) => s.kyc)
  const status = useWalletStore((s) => s.walletStatus)

  const score = getVerificationScore(kyc)
  const verified = getVerifiedCount(kyc)

  const itemStatus: Record<string, boolean> = {
    email: true,
    phone: true,
    bvn: kyc.step2.completed,
    nin: kyc.step3.completed,
    selfie: kyc.step4.completed,
    business: kyc.step5.completed,
  }

  const getScoreColor = (s: number) => {
    if (s >= 80) return '#16A34A'
    if (s >= 50) return '#F59E0B'
    return '#94A3B8'
  }

  const statusLabel = status === 'activated' ? 'Active' : status === 'pending' ? 'Verification Pending' : 'Not Activated'
  const statusColor = status === 'activated' ? '#16A34A' : status === 'pending' ? '#F59E0B' : '#94A3B8'

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
            <GoonaIcon icon={ArrowLeft} size={20} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.title}>Verification Center</Text>
          <Text style={styles.subtitle}>Track your identity verification progress.</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(80).springify()} style={styles.scoreCard}>
          <LinearGradient colors={['#2E7D32', '#1B5E20']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.scoreGradient}>
            <Text style={styles.scoreLabel}>Verification Progress</Text>
            <Text style={[styles.scoreValue, { color: getScoreColor(score) }]}>{score}%</Text>
            <View style={styles.scoreBar}>
              <View style={[styles.scoreFill, { width: `${score}%`, backgroundColor: getScoreColor(score) }]} />
            </View>
            <Text style={styles.scoreSub}>{verified.completed} of {verified.total} steps completed</Text>

            <View style={styles.scoreDivider} />

            <View style={styles.walletStatusRow}>
              <Text style={styles.walletStatusLabel}>Wallet Status</Text>
              <View style={[styles.walletStatusBadge, { backgroundColor: statusColor + '15' }]}>
                <View style={[styles.walletStatusDot, { backgroundColor: statusColor }]} />
                <Text style={[styles.walletStatusText, { color: statusColor }]}>{statusLabel}</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(140).springify()}>
          <Text style={styles.sectionLabel}>Verification Status</Text>
          <View style={styles.statusCard}>
            {VERIFICATION_ITEMS.map((item, idx) => {
              const done = itemStatus[item.key]
              return (
                <View key={item.key} style={[styles.statusRow, idx === VERIFICATION_ITEMS.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={[styles.statusIcon, done && styles.statusIconDone]}>
                    <GoonaIcon icon={item.icon} size={16} color={done ? '#FFFFFF' : '#94A3B8'} />
                  </View>
                  <Text style={[styles.statusLabel, done && styles.statusLabelDone]}>{item.label}</Text>
                  <View style={[styles.statusBadge, done ? styles.statusBadgeDone : styles.statusBadgePending]}>
                    {done ? <GoonaIcon icon={Check} size={12} color="#16A34A" /> : <GoonaIcon icon={X} size={12} color="#94A3B8" />}
                    <Text style={[styles.statusBadgeText, { color: done ? '#16A34A' : '#94A3B8' }]}>{done ? 'Verified' : 'Pending'}</Text>
                  </View>
                </View>
              )
            })}
          </View>
        </Animated.View>

        {status === 'not_activated' && (
          <Animated.View entering={FadeInUp.duration(400).delay(200).springify()}>
            <TouchableOpacity style={styles.activateLink} activeOpacity={0.7} onPress={() => router.push('/wallet-activation')}>
              <GoonaIcon icon={Award} size={16} color="#2E7D32" />
              <Text style={styles.activateLinkText}>Continue Wallet Activation</Text>
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
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 14, elevation: 3 },
  title: { fontSize: 30, fontWeight: '800', color: '#1B1B1B', lineHeight: 37 },
  subtitle: { fontSize: 15, color: '#94A3B8', marginTop: 6, lineHeight: 22 },

  scoreCard: { borderRadius: 24, marginBottom: 24, overflow: 'hidden', shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.3, shadowRadius: 30, elevation: 8 },
  scoreGradient: { padding: 24, alignItems: 'center' },
  scoreLabel: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  scoreValue: { fontSize: 48, fontWeight: '800', marginBottom: 16 },
  scoreBar: { width: '100%', height: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 3, overflow: 'hidden', marginBottom: 12 },
  scoreFill: { height: '100%', borderRadius: 3 },
  scoreSub: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
  scoreDivider: { width: '100%', height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 16 },
  walletStatusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  walletStatusLabel: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  walletStatusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 14, borderRadius: 100 },
  walletStatusDot: { width: 8, height: 8, borderRadius: 4 },
  walletStatusText: { fontSize: 13, fontWeight: '700' },

  statusSection: { marginBottom: 24 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#1F2937', marginBottom: 12, marginTop: 4 },
  statusCard: { backgroundColor: 'white', borderRadius: 20, padding: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 16, elevation: 2 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  statusIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  statusIconDone: { backgroundColor: '#2E7D32' },
  statusLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: '#94A3B8' },
  statusLabelDone: { color: '#1F2937' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 100 },
  statusBadgeDone: { backgroundColor: '#F0FDF4' },
  statusBadgePending: { backgroundColor: '#F1F5F9' },
  statusBadgeText: { fontSize: 11, fontWeight: '600' },
  activateLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, backgroundColor: 'white', borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 },
  activateLinkText: { fontSize: 14, fontWeight: '700', color: '#2E7D32' },
})
