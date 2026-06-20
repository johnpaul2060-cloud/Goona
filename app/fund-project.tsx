import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, Platform, Keyboard, KeyboardAvoidingView,
} from 'react-native'
import GoonaIcon from '../components/ui/GoonaIcon'
import {
  ArrowLeft, CheckCircle, CreditCard, Wallet, Building, Smartphone,
} from 'lucide-react-native'
import { StatusBar } from 'expo-status-bar'
import { router, useLocalSearchParams, usePathname } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useWalletStore, setPendingReturnUrl } from '../store/useWalletStore'
import { formatInput, parseAmount, formatNaira } from '../utils/format'

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
  return formatNaira(n)
}

function formatCompactCurrency(n: number) {
  if (n >= 1000000) return '\u20A6' + (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return '\u20A6' + (n / 1000).toFixed(0) + 'k'
  return '\u20A6' + n.toLocaleString('en-NG')
}

export default function FundProjectScreen() {
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<{
    id: string
    name?: string
    target?: string
    saved?: string
    plan?: string
    amount?: string
    contributionType?: string
  }>()
  const pathname = usePathname()
  const walletStatus = useWalletStore((s) => s.walletStatus)
  const hasRedirected = useRef(false)

  useEffect(() => {
    if (walletStatus !== 'activated' && !hasRedirected.current) {
      hasRedirected.current = true
      const qs = Object.entries(params)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
        .join('&')
      setPendingReturnUrl(`${pathname}?${qs}`)
      router.replace('/wallet-activation')
    }
  }, [walletStatus])

  const project = useMemo(() => {
    if (params.name) {
      const target = parseInt(params.target || '0', 10)
      const saved = parseInt(params.saved || '0', 10)
      return {
        id: 0,
        icon: '\u{1F4B0}',
        name: params.name,
        target,
        saved,
      }
    }
    return PROJECTS.find(p => p.id === parseInt(params.id || '1', 10)) || PROJECTS[0]
  }, [params])

  const [amountStr, setAmountStr] = useState(
    params.amount ? parseInt(params.amount, 10).toString() : '',
  )
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  const amount = parseAmount(amountStr)
  const displayAmount = formatInput(amountStr)
  const isQuickFund = !!params.amount
  const contributionTypeLabel = params.plan
    ? `${params.plan} Contribution`
    : 'Contribution'

  const handleQuickAmount = useCallback((val: number) => {
    setAmountStr(val.toString())
  }, [])

  const handleAmountChange = useCallback((v: string) => {
    setAmountStr(v.replace(/[^0-9]/g, ''))
  }, [])

  const handleSubmit = useCallback(() => {
    Keyboard.dismiss()
    setShowSuccess(true)
  }, [])

  useEffect(() => {
    if (!showSuccess) return
    const t = setTimeout(() => {
      router.replace('/(tabs)/recapitalization')
    }, 2500)
    return () => clearTimeout(t)
  }, [showSuccess])

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />

      {showSuccess ? (
          /* ── SUCCESS ── */
          <View style={styles.successWrap}>
            <Animated.View
              entering={FadeInDown.duration(400).springify()}
              style={styles.successCard}
            >
              <View style={styles.successIcon}>
                <GoonaIcon icon={CheckCircle} size={48} color="#2E7D32" />
              </View>
              <Text style={styles.successTitle}>Payment Successful</Text>
              <Text style={styles.successSub}>
                Your contribution of {formatCurrency(amount)} has been applied to {project.name}.
              </Text>

              <View style={styles.successDetails}>
                <View style={styles.successRow}>
                  <Text style={styles.successLabel}>Amount</Text>
                  <Text style={styles.successValue}>{formatCurrency(amount)}</Text>
                </View>
                <View style={styles.successDivider} />
                <View style={styles.successRow}>
                  <Text style={styles.successLabel}>Method</Text>
                  <Text style={styles.successValue}>
                    {PAYMENT_METHODS.find(m => m.id === selectedMethod)?.label}
                  </Text>
                </View>
                <View style={styles.successDivider} />
                <View style={styles.successRow}>
                  <Text style={styles.successLabel}>Status</Text>
                  <Text style={[styles.successValue, { color: '#2E7D32' }]}>Successful</Text>
                </View>
              </View>
            </Animated.View>

            <TouchableOpacity
              style={styles.successBtn}
              activeOpacity={0.85}
              onPress={() => router.replace('/(tabs)/recapitalization')}
            >
              <Text style={styles.successBtnText}>Return to Recapitalization</Text>
            </TouchableOpacity>
          </View>
        ) : (
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

              <Text style={styles.heroTitle}>
                {isQuickFund ? 'Activate Project' : 'Fund Project'}
              </Text>
              <Text style={styles.heroSub}>
                {isQuickFund ? 'Confirm your contribution to activate this project.' : 'Add money to your project and track your funding.'}
              </Text>
            </Animated.View>

            {/* ── AMOUNT SECTION ── */}
            <Animated.View
              entering={FadeInDown.duration(400).delay(80).springify()}
            >
              {isQuickFund ? (
                <>
                  <Text style={styles.sectionLabel}>{contributionTypeLabel}</Text>
                  <View style={styles.quickAmountCard}>
                    <Text style={styles.quickAmountLabel}>Amount</Text>
                    <Text style={styles.quickAmountValue}>{formatCurrency(amount)}</Text>
                  </View>
                </>
              ) : (
                <>
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
                </>
              )}
            </Animated.View>

            {/* ── PAYMENT METHOD ── */}
            <Animated.View
              entering={FadeInDown.duration(400).delay(140).springify()}
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

            {/* ── COMPACT SUMMARY + CONFIRM ── */}
            {selectedMethod && (
              <Animated.View
                entering={FadeInDown.duration(400).delay(200).springify()}
              >
                <View style={styles.compactSummary}>
                  <Text style={styles.compactSummaryText}>
                    {project.icon} {project.name} • {formatCurrency(amount)} • {PAYMENT_METHODS.find(m => m.id === selectedMethod)?.label}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.submitBtn}
                  activeOpacity={0.85}
                  onPress={handleSubmit}
                >
                  <GoonaIcon icon={CheckCircle} size={20} color="#FFFFFF" />
                  <Text style={styles.submitText}>Confirm Payment</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </ScrollView>
        )}
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

  /* ── Quick Amount Display ── */
  quickAmountCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },
  quickAmountLabel: {
    fontSize: 12, fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  quickAmountValue: {
    fontSize: 36, fontWeight: '800',
    color: '#1F2937', lineHeight: 42,
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

  /* ── Compact Summary ── */
  compactSummary: {
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D4EDDA',
  },
  compactSummaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },

  /* ── Confirm Button ── */
  submitBtn: {
    height: 54,
    borderRadius: 16,
    backgroundColor: '#2E7D32',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 6,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* ── Success ── */
  successWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  successCard: {
    backgroundColor: 'white',
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 32,
    elevation: 6,
  },
  successIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#F0FDF4',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 22, fontWeight: '800',
    color: '#1B1B1B', marginBottom: 8,
  },
  successSub: {
    fontSize: 15, color: '#64748B',
    textAlign: 'center', lineHeight: 22,
    marginBottom: 24,
  },
  successDetails: {
    width: '100%',
    backgroundColor: '#F8FAF7',
    borderRadius: 16,
    padding: 16,
  },
  successRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  successDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  successLabel: {
    fontSize: 13, color: '#94A3B8',
  },
  successValue: {
    fontSize: 14, fontWeight: '700', color: '#1F2937',
  },
  successBtn: {
    height: 54,
    borderRadius: 16,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 20,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 6,
  },
  successBtnText: {
    fontSize: 16, fontWeight: '700', color: '#FFFFFF',
  },
})
