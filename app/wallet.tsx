import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Platform, Alert,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import GoonaIcon from '../components/ui/GoonaIcon'
import { formatNaira } from '../utils/format'
import {
  ArrowLeft, Wallet, ArrowUpRight, ArrowDownLeft,
  Copy, Share2, Plus, Send, Landmark, Smartphone,
  CreditCard, ChevronRight, Check,
} from 'lucide-react-native'
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated'
import { useWalletStore, setPendingReturnUrl } from '../store/useWalletStore'

const QUICK_ACTIONS = [
  { icon: Plus, label: 'Add Money', color: '#2E7D32' },
  { icon: Send, label: 'Transfer', color: '#00695C' },
  { icon: ArrowUpRight, label: 'Withdraw', color: '#1B5E20' },
  { icon: Landmark, label: 'Account', color: '#0F766E' },
]

const DEMO_TRANSACTIONS = [
  {
    type: 'credit' as const,
    amount: 250000,
    description: 'Egg Sales Payment',
    date: 'Today',
    balance: 1250000,
  },
  {
    type: 'debit' as const,
    amount: 50000,
    description: 'Transfer to Supplier',
    date: 'Yesterday',
    balance: 1000000,
  },
  {
    type: 'credit' as const,
    amount: 350000,
    description: 'Bird Sales',
    date: '15 Jun 2026',
    balance: 1050000,
  },
  {
    type: 'debit' as const,
    amount: 100000,
    description: 'Fund Recapt — Feed Purchase',
    date: '12 Jun 2026',
    balance: 700000,
  },
  {
    type: 'credit' as const,
    amount: 500000,
    description: 'Customer Payment — Broilers',
    date: '10 Jun 2026',
    balance: 800000,
  },
]

const PAYMENT_METHODS = [
  { icon: CreditCard, label: 'Card', desc: 'Visa, Mastercard, Verve' },
  { icon: Landmark, label: 'Bank Transfer', desc: 'Transfer from your bank' },
  { icon: Smartphone, label: 'USSD', desc: 'Pay with USSD code' },
  { icon: Wallet, label: 'Wallet Balance', desc: 'Use GOONA balance' },
]

function formatCurrency(n: number) {
  return formatNaira(n)
}

export default function WalletScreen() {
  const insets = useSafeAreaInsets()
  const [showAccount, setShowAccount] = useState(false)
  const [copied, setCopied] = useState(false)
  const walletStatus = useWalletStore((s) => s.walletStatus)

  const balance = 1250000

  const handleCopy = () => {
    setCopied(true)
    Alert.alert('Copied', 'Account number copied to clipboard.')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleAction = (label: string) => {
    if (label === 'Account') {
      setShowAccount(!showAccount)
      return
    }
    if (walletStatus !== 'activated') {
      setPendingReturnUrl('/wallet')
      router.push('/wallet-activation')
      return
    }
    switch (label) {
      case 'Add Money':
        Alert.alert('Add Money', 'Fund your wallet via:\n\n• Card\n• Bank Transfer\n• USSD')
        break
      case 'Transfer':
        Alert.alert('Transfer', 'Send money to:\n\n• Bank Account\n• Worker\n• Supplier')
        break
      case 'Withdraw':
        Alert.alert('Withdraw', 'Withdraw to your bank account.\n\nFeature coming soon.')
        break
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollInner,
          { paddingBottom: insets.bottom + 140 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HEADER ── */}
        <Animated.View
          entering={FadeInDown.duration(600).springify()}
          style={[styles.header, { paddingTop: insets.top + 16 }]}
        >
          <TouchableOpacity
            style={styles.backBtn}
            activeOpacity={0.7}
            onPress={() => router.back()}
          >
            <GoonaIcon icon={ArrowLeft} size={20} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.title}>GOONA Wallet</Text>
          <Text style={styles.subtitle}>Receive, save and pay for farm operations.</Text>
        </Animated.View>

        {/* ── BALANCE CARD ── */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(80).springify()}
          style={styles.balanceCard}
        >
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>{formatCurrency(balance)}</Text>

          <View style={styles.balanceDivider} />

          <View style={styles.balanceMeta}>
            <View style={styles.balanceMetaItem}>
              <Text style={styles.balanceMetaLabel}>Account Name</Text>
              <Text style={styles.balanceMetaValue}>Adewale Farms</Text>
            </View>
            <View style={styles.balanceMetaItem}>
              <Text style={styles.balanceMetaLabel}>Account Number</Text>
              <Text style={styles.balanceMetaValue}>1234 5678 90</Text>
            </View>
          </View>
        </Animated.View>

        {/* ── QUICK ACTIONS ── */}
        <Animated.View
          entering={FadeInUp.duration(400).delay(140).springify()}
          style={styles.actionsGrid}
        >
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.actionCard}
              activeOpacity={0.7}
              onPress={() => handleAction(action.label)}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.color + '15' }]}>
                <GoonaIcon icon={action.icon} size={20} color={action.color} />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* ── ACCOUNT DETAILS ── */}
        {showAccount && (
          <Animated.View
            entering={FadeInDown.duration(300).springify()}
            style={styles.accountSection}
          >
            <Text style={styles.sectionTitle}>Account Details</Text>

            <View style={styles.accountCard}>
              <View style={styles.accountRow}>
                <Text style={styles.accountLabel}>Account Name</Text>
                <Text style={styles.accountValue}>Adewale Farms</Text>
              </View>
              <View style={styles.accountRow}>
                <Text style={styles.accountLabel}>Account Number</Text>
                <Text style={styles.accountValue}>1234567890</Text>
              </View>
              <View style={styles.accountRow}>
                <Text style={styles.accountLabel}>Bank Name</Text>
                <Text style={styles.accountValue}>GOONA Financial Services</Text>
              </View>

              <View style={styles.accountActions}>
                <TouchableOpacity
                  style={styles.accountBtn}
                  activeOpacity={0.7}
                  onPress={handleCopy}
                >
                  <GoonaIcon icon={copied ? Check : Copy} size={16} color="#2E7D32" />
                  <Text style={styles.accountBtnText}>
                    {copied ? 'Copied' : 'Copy'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.accountBtn, styles.accountBtnOutline]}
                  activeOpacity={0.7}
                  onPress={() => Alert.alert('Share', 'Share account details via:\n\n• WhatsApp\n• SMS\n• Email')}
                >
                  <GoonaIcon icon={Share2} size={16} color="#2E7D32" />
                  <Text style={[styles.accountBtnText, { color: '#2E7D32' }]}>Share</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        )}

        {/* ── PAYMENT METHODS ── */}
        <Animated.View
          entering={FadeInUp.duration(400).delay(200).springify()}
          style={styles.paymentSection}
        >
          <Text style={styles.sectionTitle}>Payment Methods</Text>
          {PAYMENT_METHODS.map((method) => (
            <TouchableOpacity
              key={method.label}
              style={styles.paymentCard}
              activeOpacity={0.7}
              onPress={() => Alert.alert(method.label, method.desc + '\n\nFeature coming soon.')}
            >
              <View style={styles.paymentIcon}>
                <GoonaIcon icon={method.icon} size={18} color="#2E7D32" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.paymentLabel}>{method.label}</Text>
                <Text style={styles.paymentDesc}>{method.desc}</Text>
              </View>
              <GoonaIcon icon={ChevronRight} size={16} color="#94A3B8" />
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* ── TRANSACTION HISTORY ── */}
        <Animated.View
          entering={FadeInUp.duration(400).delay(260).springify()}
          style={styles.txSection}
        >
          <Text style={styles.sectionTitle}>Transaction History</Text>

          {DEMO_TRANSACTIONS.map((tx, idx) => (
            <Animated.View
              key={idx}
              entering={FadeInUp.duration(350).delay(idx * 60).springify()}
              style={styles.txCard}
            >
              <View style={[styles.txIcon, {
                backgroundColor: tx.type === 'credit' ? '#F0FDF4' : '#FEF2F2',
              }]}>
                <GoonaIcon
                  icon={tx.type === 'credit' ? ArrowDownLeft : ArrowUpRight}
                  size={16}
                  color={tx.type === 'credit' ? '#2E7D32' : '#DC2626'}
                />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.txHead}>
                  <Text style={[styles.txType, {
                    color: tx.type === 'credit' ? '#2E7D32' : '#DC2626',
                  }]}>
                    {tx.type === 'credit' ? 'Credit' : 'Debit'}
                  </Text>
                  <Text style={styles.txAmount}>
                    {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </Text>
                </View>
                <Text style={styles.txDesc}>{tx.description}</Text>
                <View style={styles.txFoot}>
                  <Text style={styles.txDate}>{tx.date}</Text>
                  <Text style={styles.txBalance}>
                    Balance After: {formatCurrency(tx.balance)}
                  </Text>
                </View>
              </View>
            </Animated.View>
          ))}
        </Animated.View>
      </ScrollView>

    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAF7' },
  scroll: { flex: 1 },
  scrollInner: { paddingHorizontal: 20 },

  /* ── Header ── */
  header: { marginBottom: 24 },
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
  title: {
    fontSize: 30, fontWeight: '800',
    color: '#1B1B1B', lineHeight: 37,
  },
  subtitle: {
    fontSize: 15, color: '#94A3B8', marginTop: 6,
  },

  /* ── Balance Card ── */
  balanceCard: {
    backgroundColor: '#2E7D32',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 8,
  },
  balanceLabel: {
    fontSize: 12, fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 40, fontWeight: '800',
    color: '#FFFFFF', lineHeight: 46,
    marginBottom: 20,
  },
  balanceDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 16,
  },
  balanceMeta: {
    flexDirection: 'row',
    gap: 20,
  },
  balanceMetaItem: {
    flex: 1,
  },
  balanceMetaLabel: {
    fontSize: 10, fontWeight: '600',
    color: 'rgba(255,255,255,0.45)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  balanceMetaValue: {
    fontSize: 14, fontWeight: '700',
    color: '#FFFFFF',
  },

  /* ── Quick Actions ── */
  actionsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  actionCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  actionIcon: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 13, fontWeight: '600',
    color: '#1F2937', textAlign: 'center',
  },

  /* ── Account Details ── */
  accountSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13, fontWeight: '700',
    color: '#1F2937', marginBottom: 12, marginTop: 4,
  },
  accountCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  accountLabel: {
    fontSize: 13, fontWeight: '500',
    color: '#94A3B8',
  },
  accountValue: {
    fontSize: 14, fontWeight: '700',
    color: '#1F2937',
  },
  accountActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  accountBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F0FDF4',
  },
  accountBtnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#2E7D32',
  },
  accountBtnText: {
    fontSize: 13, fontWeight: '700',
    color: '#1F2937',
  },

  /* ── Payment Methods ── */
  paymentSection: {
    marginBottom: 24,
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  paymentIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#F0FDF4',
    alignItems: 'center', justifyContent: 'center',
  },
  paymentLabel: {
    fontSize: 14, fontWeight: '700',
    color: '#1F2937',
  },
  paymentDesc: {
    fontSize: 11, fontWeight: '500',
    color: '#94A3B8', marginTop: 1,
  },

  /* ── Transaction History ── */
  txSection: {
    marginBottom: 24,
  },
  txCard: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  txIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 2,
  },
  txHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  txType: {
    fontSize: 12, fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  txAmount: {
    fontSize: 15, fontWeight: '800',
    color: '#1F2937',
  },
  txDesc: {
    fontSize: 13, fontWeight: '500',
    color: '#1F2937', marginBottom: 6,
  },
  txFoot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txDate: {
    fontSize: 11, fontWeight: '500',
    color: '#94A3B8',
  },
  txBalance: {
    fontSize: 11, fontWeight: '600',
    color: '#94A3B8',
  },
})
