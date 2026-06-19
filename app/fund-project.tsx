import React, { useState, useMemo, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, Platform, Keyboard, KeyboardAvoidingView,
} from 'react-native'
import GoonaIcon from '../components/ui/GoonaIcon'
import {
  ArrowLeft, CheckCircle, CreditCard, Wallet, Building, Smartphone,
} from 'lucide-react-native'
import { StatusBar } from 'expo-status-bar'
import { router, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, { FadeInDown } from 'react-native-reanimated'
import BottomDock from '../components/navigation/BottomDock'

const PROJECTS = [
  { id: 1, icon: '\u{1F33E}', name: 'Feed Purchase', target: 500000, saved: 250000 },
  { id: 2, icon: '\u{1F477}', name: 'Staff Salaries', target: 300000, saved: 120000 },
  { id: 3, icon: '\u{1F3D7}\uFE0F', name: 'Infrastructure', target: 3000000, saved: 900000 },
  { id: 4, icon: '\u{1F425}', name: 'Restocking', target: 800000, saved: 580000 },
] as const

const QUICK_AMOUNTS = [5000, 10000, 20000, 50000, 100000]

const PAYMENT_METHODS = [
  { id: 'card', label: 'Card', desc: 'Visa, Mastercard, Verve', icon: CreditCard },
  { id: 'bank-transfer', label: 'Bank Transfer', desc: 'Transfer directly from your bank account', icon: Building },
  { id: 'ussd', label: 'USSD', desc: 'Pay using your bank USSD code', icon: Smartphone },
  { id: 'wallet', label: 'Wallet Balance', desc: 'Use available GOONA balance', icon: Wallet },
]

/* Backend processor mapping (internal — not exposed to users):
   Card        → Paystack
   Bank Transfer → Flutterwave
   USSD        → Flutterwave
   Wallet      → PiggyVest (future)
*/

function formatCurrency(n: number) {
  return '\u20A6' + n.toLocaleString()
}

function formatCompactCurrency(n: number) {
  if (n >= 1000000) return '\u20A6' + (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return '\u20A6' + (n / 1000).toFixed(0) + 'k'
  return '\u20A6' + n.toLocaleString()
}

export default function FundProjectScreen() {
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id: string }>()

  const project = useMemo(
    () => PROJECTS.find(p => p.id === parseInt(id || '1', 10)) || PROJECTS[0],
    [id],
  )

  const [amountStr, setAmountStr] = useState('')
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)

  const amount = Math.max(0, parseInt(amountStr.replace(/[^0-9]/g, ''), 10) || 0)
  const displayAmount = amount ? amount.toLocaleString() : ''
  const remaining = project.target - project.saved
  const progress = project.target > 0 ? Math.min(1, project.saved / project.target) : 0

  const canSubmit = amount > 0 && selectedMethod !== null

  const handleQuickAmount = useCallback((val: number) => {
    setAmountStr(val.toString())
  }, [])

  const handleAmountChange = useCallback((v: string) => {
    setAmountStr(v.replace(/[^0-9]/g, ''))
  }, [])

  const handleSubmit = useCallback(() => {
    Keyboard.dismiss()
    router.back()
  }, [])

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollInner,
          { paddingBottom: insets.bottom + 140 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── HERO HEADER ── */}
        <Animated.View
          entering={FadeInDown.duration(600).springify()}
          style={[styles.heroSection, { paddingTop: insets.top + 16 }]}
        >
          <TouchableOpacity
            style={styles.backBtn}
            activeOpacity={0.7}
            onPress={() => router.back()}
          >
            <GoonaIcon icon={ArrowLeft} size={20} color="#1F2937" />
          </TouchableOpacity>

          <Text style={styles.heroTitle}>Fund Project</Text>
          <Text style={styles.heroSub}>
            Add money to your project and track your funding.
          </Text>
        </Animated.View>

        {/* ── PROJECT DETAILS ── */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(80).springify()}
          style={styles.projectCard}
        >
          <View style={styles.projectHead}>
            <Text style={styles.projectIcon}>{project.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.projectName}>{project.name}</Text>
              <View style={styles.projectMetaRow}>
                <View style={styles.projectMetaItem}>
                  <Text style={styles.projectMetaLabel}>Target</Text>
                  <Text style={styles.projectMetaValue}>{formatCurrency(project.target)}</Text>
                </View>
                <View style={styles.projectMetaDivider} />
                <View style={styles.projectMetaItem}>
                  <Text style={styles.projectMetaLabel}>Saved</Text>
                  <Text style={[styles.projectMetaValue, { color: '#2E7D32' }]}>
                    {formatCurrency(project.saved)}
                  </Text>
                </View>
                <View style={styles.projectMetaDivider} />
                <View style={styles.projectMetaItem}>
                  <Text style={styles.projectMetaLabel}>Remaining</Text>
                  <Text style={[styles.projectMetaValue, { color: '#D97706' }]}>
                    {formatCurrency(remaining)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.projectProgressSection}>
            <View style={styles.projectProgressHead}>
              <Text style={styles.projectProgressPct}>
                {Math.round(progress * 100)}% Funded
              </Text>
            </View>
            <View style={styles.projectProgressTrack}>
              <View
                style={[
                  styles.projectProgressFill,
                  { width: `${progress * 100}%` },
                ]}
              />
            </View>
          </View>
        </Animated.View>

        {/* ── AMOUNT SECTION ── */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(140).springify()}
        >
          <Text style={styles.sectionLabel}>Amount to Fund</Text>

          <View style={styles.amountCard}>
            <View style={styles.amountRow}>
              <Text style={styles.amountPrefix}>₦</Text>
              <TextInput
                style={styles.amountInput}
                value={displayAmount}
                onChangeText={handleAmountChange}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#CBD5E1"
                autoFocus
              />
            </View>
          </View>

          <View style={styles.quickRow}>
            {QUICK_AMOUNTS.map((val) => {
              const active = amount === val
              return (
                <TouchableOpacity
                  key={val}
                  style={[styles.quickChip, active && styles.quickChipActive]}
                  activeOpacity={0.8}
                  onPress={() => handleQuickAmount(val)}
                >
                  <Text
                    style={[styles.quickChipText, active && styles.quickChipTextActive]}
                  >
                    {formatCompactCurrency(val)}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </Animated.View>

        {/* ── PAYMENT METHOD ── */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(200).springify()}
        >
          <Text style={styles.sectionLabel}>Payment Method</Text>
          <View style={styles.methodStack}>
            {PAYMENT_METHODS.map((method) => {
              const active = selectedMethod === method.id
              return (
                <TouchableOpacity
                  key={method.id}
                  style={[styles.methodCard, active && styles.methodCardActive]}
                  activeOpacity={0.85}
                  onPress={() => setSelectedMethod(method.id)}
                >
                  <View style={styles.methodLeft}>
                    <View style={styles.methodIconWrap}>
                      <GoonaIcon icon={method.icon} size={16} color="#2E7D32" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.methodName}>{method.label}</Text>
                      <Text style={styles.methodDesc}>{method.desc}</Text>
                    </View>
                  </View>
                  {active && <GoonaIcon icon={CheckCircle} size={18} color="#2E7D32" />}
                </TouchableOpacity>
              )
            })}
          </View>
        </Animated.View>

        {/* ── SUMMARY & CONFIRM ── */}
        {amount > 0 && selectedMethod && (
          <Animated.View
            entering={FadeInDown.duration(400).delay(260).springify()}
          >
            <LinearGradient
              colors={['#2E7D32', '#1B5E20']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.summaryCard}
            >
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Project</Text>
                <Text style={styles.summaryValue}>
                  {project.icon} {project.name}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Funding Amount</Text>
                <Text style={styles.summaryValueLarge}>{formatCurrency(amount)}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Payment Method</Text>
                <Text style={styles.summaryValue}>
                  {PAYMENT_METHODS.find(m => m.id === selectedMethod)?.label}
                </Text>
              </View>
            </LinearGradient>

            <TouchableOpacity
              style={styles.submitBtn}
              activeOpacity={0.85}
              onPress={handleSubmit}
            >
              <LinearGradient
                colors={['#2E7D32', '#1B5E20']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.submitGrad}
              >
                <GoonaIcon icon={CheckCircle} size={20} color="#FFFFFF" />
                <Text style={styles.submitText}>Confirm Payment</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>

      <BottomDock />
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAF7' },
  scroll: { flex: 1 },
  scrollInner: { paddingHorizontal: 20 },

  /* ── HERO ── */
  heroSection: { marginBottom: 24 },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'white',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 14,
    elevation: 3,
  },
  heroTitle: {
    fontSize: 30, fontWeight: '800',
    color: '#1B1B1B', lineHeight: 37,
  },
  heroSub: {
    fontSize: 15, color: '#94A3B8', marginTop: 6,
  },

  /* ── Section Label ── */
  sectionLabel: {
    fontSize: 13, fontWeight: '700',
    color: '#1F2937', marginBottom: 12, marginTop: 4,
  },

  /* ── Project Details ── */
  projectCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },
  projectHead: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  projectIcon: {
    fontSize: 32,
    marginTop: 2,
  },
  projectName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 10,
  },
  projectMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  projectMetaItem: {
    flex: 1,
  },
  projectMetaLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  projectMetaValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  projectMetaDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 8,
  },
  projectProgressSection: {
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  projectProgressHead: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 6,
  },
  projectProgressPct: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2E7D32',
  },
  projectProgressTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  projectProgressFill: {
    height: '100%',
    backgroundColor: '#2E7D32',
    borderRadius: 3,
  },

  /* ── Amount Card ── */
  amountCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#2E7D32',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountPrefix: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2E7D32',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '800',
    color: '#1B1B1B',
    paddingVertical: 4,
  },

  /* ── Quick Amounts ── */
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  quickChip: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 100,
    backgroundColor: 'white',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  quickChipActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#2E7D32',
  },
  quickChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  quickChipTextActive: {
    color: '#2E7D32',
  },

  /* ── Payment Method ── */
  methodStack: {
    gap: 10,
    marginBottom: 20,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  methodCardActive: {
    borderColor: '#2E7D32',
    backgroundColor: '#F0FDF4',
  },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  methodIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  methodDesc: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
  },

  /* ── Summary Card ── */
  summaryCard: {
    borderRadius: 20,
    padding: 20,
    gap: 12,
    marginBottom: 16,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  summaryValueLarge: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },

  /* ── Submit Button ── */
  submitBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 6,
    marginBottom: 24,
  },
  submitGrad: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
})
