import React, { useState, useMemo, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, Dimensions, useWindowDimensions, Modal,
  KeyboardAvoidingView, Platform, Alert, Pressable,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import { ArrowLeft, Plus, CheckCircle, Mic, Image, FileText } from 'lucide-react-native'
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  withSequence, withRepeat, FadeInUp, FadeIn, Easing,
} from 'react-native-reanimated'
import GoonaIcon from '../components/ui/GoonaIcon'
import { LinearGradient } from 'expo-linear-gradient'
import BottomDock from '../components/navigation/BottomDock'

const { width: SCREEN_W } = Dimensions.get('window')
const H_PAD = 20
const CARD_W = (SCREEN_W - H_PAD * 2 - 12) / 2

/* ─── Types ─── */
type ProductType = 'broilers' | 'layers' | 'eggs' | 'catfish' | 'feed'
type PaymentType = 'cash' | 'transfer' | 'pos' | 'credit'
type CustomerType = 'retail' | 'distributor' | 'market' | 'restaurant' | 'processor'

/* ─── Data ─── */
const PRODUCT_DATA: Record<ProductType, { label: string; price: number; unit: string; icon: string }> = {
  broilers: { label: 'Broilers', price: 4500, unit: 'bird', icon: '\u{1F425}' },
  layers: { label: 'Layers', price: 3200, unit: 'bird', icon: '\u{1F413}' },
  eggs: { label: 'Eggs', price: 350, unit: 'crate', icon: '\u{1F95A}' },
  catfish: { label: 'Catfish', price: 1200, unit: 'kg', icon: '\u{1F41F}' },
  feed: { label: 'Feed', price: 18000, unit: 'bag', icon: '\u{1F33E}' },
}

const CUSTOMER_TYPES: { key: CustomerType; label: string }[] = [
  { key: 'retail', label: 'Retail' },
  { key: 'distributor', label: 'Distributor' },
  { key: 'market', label: 'Market Buyer' },
  { key: 'restaurant', label: 'Restaurant' },
  { key: 'processor', label: 'Processor' },
]

const PAYMENT_METHODS: { key: PaymentType; label: string; icon: string }[] = [
  { key: 'cash', label: 'Cash', icon: '\u{1F4B5}' },
  { key: 'transfer', label: 'Transfer', icon: '\u{1F4B1}' },
  { key: 'pos', label: 'POS', icon: '\u{1F4B3}' },
  { key: 'credit', label: 'Credit', icon: '\u{1F4B0}' },
]

/* ─── Hooks ─── */
function usePressScale(scaleTo = 0.96) {
  const scale = useSharedValue(1)
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
  return {
    style,
    onPressIn: () => { scale.value = withSpring(scaleTo, { damping: 15, stiffness: 200 }) },
    onPressOut: () => { scale.value = withSpring(1, { damping: 15, stiffness: 200 }) },
  }
}

function usePulse() {
  const opacity = useSharedValue(1)
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(0.4, { duration: 1800 }), withTiming(1, { duration: 1800 })),
      -1, true,
    )
  }, [])
  return useAnimatedStyle(() => ({ opacity: opacity.value }))
}



/* ─── Live Dot ─── */
function LiveDot() {
  const pulse = usePulse()
  return <Animated.View style={[{ width: 5, height: 5, borderRadius: 3, backgroundColor: '#16A34A' }, pulse]} />
}

/* ─── Form Input ─── */
function FormInput({ label, value, onChange, placeholder, keyboardType, multiline }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; keyboardType?: 'default' | 'numeric' | 'phone-pad'; multiline?: boolean
}) {
  const [focused, setFocused] = useState(false)
  return (
    <View style={[fiStyles.wrap, focused && fiStyles.wrapFocused]}>
      <Text style={fiStyles.label}>{label}</Text>
      <TextInput
        style={[fiStyles.input, multiline && fiStyles.inputMultiline]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        keyboardType={keyboardType || 'default'}
        multiline={multiline}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  )
}
const fiStyles = StyleSheet.create({
  wrap: { backgroundColor: 'white', borderRadius: 20, padding: 14, borderWidth: 1.5, borderColor: '#E8ECEE', marginBottom: 10 },
  wrapFocused: { borderColor: '#2E7D32', backgroundColor: '#FAFDF8' },
  label: { fontSize: 11, fontWeight: '600', color: '#64748B', marginBottom: 4, letterSpacing: 0.3 },
  input: { fontSize: 16, fontWeight: '600', color: '#1B1B1B', paddingVertical: 2 },
  inputMultiline: { minHeight: 60, textAlignVertical: 'top' },
})

/* ─── Section Header ─── */
function SecHead({ title }: { title: string }) {
  return (
    <View style={shStyles.row}>
      <Text style={shStyles.title}>{title}</Text>
    </View>
  )
}
const shStyles = StyleSheet.create({
  row: { marginTop: 22, marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '700', color: '#1B1B1B' },
})

/* ─── MAIN SCREEN ─── */
export default function RecordSaleScreen() {
  const insets = useSafeAreaInsets()
  const { width: winW } = useWindowDimensions()
  const backPress = usePressScale()
  const submitPress = usePressScale(0.97)

  /* ── State ── */
  const [buyerName, setBuyerName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [customerType, setCustomerType] = useState<CustomerType | null>(null)
  const [product, setProduct] = useState<ProductType | null>(null)
  const [quantity, setQuantity] = useState('')
  const [avgWeight, setAvgWeight] = useState('')
  const [pricePerUnit, setPricePerUnit] = useState('')
  const [discount, setDiscount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentType | null>(null)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [attachmentCount, setAttachmentCount] = useState(0)

  /* ── Computed Values ── */
  const qty = parseFloat(quantity) || 0
  const avgW = parseFloat(avgWeight) || 0
  const ppu = parseFloat(pricePerUnit) || (product ? PRODUCT_DATA[product].price : 0)
  const disc = parseFloat(discount) || 0

  const totalWeight = qty * avgW
  const grossRevenue = qty * ppu
  const netRevenue = Math.max(0, grossRevenue - disc)
  const estimatedExpenses = grossRevenue * 0.10
  const estimatedProfit = netRevenue - estimatedExpenses
  const reinvestSuggestion = estimatedProfit * 0.20
  const outstandingBalance = paymentMethod === 'credit' ? netRevenue : 0

  /* auto-fill price when product changes */
  useEffect(() => {
    if (product && !pricePerUnit) {
      setPricePerUnit(String(PRODUCT_DATA[product].price))
    }
  }, [product])

  /* ── Image Picker ── */
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    })
    if (!result.canceled) {
      setAttachmentCount((c) => c + 1)
    }
  }

  /* ── Submit ── */
  const handleSubmit = () => {
    if (!buyerName) { Alert.alert('Missing Info', 'Please enter buyer name.'); return }
    if (!product) { Alert.alert('Missing Info', 'Please select a product.'); return }
    if (!quantity || qty <= 0) { Alert.alert('Missing Info', 'Please enter a valid quantity.'); return }
    if (!paymentMethod) { Alert.alert('Missing Info', 'Please select a payment method.'); return }

    setSubmitting(true)
    setTimeout(() => {
      setSubmitting(false)
      setShowSuccess(true)
    }, 1500)
  }

  const resetForm = () => {
    setBuyerName('')
    setPhoneNumber('')
    setCustomerType(null)
    setProduct(null)
    setQuantity('')
    setAvgWeight('')
    setPricePerUnit('')
    setDiscount('')
    setPaymentMethod(null)
    setNotes('')
    setAttachmentCount(0)
  }

  /* ── Transaction ID ── */
  const txId = useMemo(() => `GOONA-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`, [showSuccess])

  /* ── Product Card ── */
  type ProductCardProps = { p: ProductType; selected: boolean; onSelect: () => void }
  function ProductCard({ p, selected, onSelect }: ProductCardProps) {
    const pr = PRODUCT_DATA[p]
    const ps = usePressScale()
    return (
      <Animated.View style={ps.style}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={onSelect}
          onPressIn={ps.onPressIn}
          onPressOut={ps.onPressOut}
          style={[prodStyles.card, selected && prodStyles.cardSelected]}
        >
          <LinearGradient
            colors={selected ? ['#2E7D32', '#43A047'] : ['#F8FAF7', '#F1F5F1']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={prodStyles.icon}
          >
            <Text style={prodStyles.iconText}>{pr.icon}</Text>
          </LinearGradient>
          <Text style={[prodStyles.label, selected && prodStyles.labelSelected]}>{pr.label}</Text>
          <Text style={prodStyles.price}>&#x20A6;{pr.price.toLocaleString()}/{pr.unit}</Text>
        </TouchableOpacity>
      </Animated.View>
    )
  }

  return (
    <View style={s.container}>
      <StatusBar style="dark" />

      <View style={s.bgGlow} pointerEvents="none" />
      <View style={s.bgContour1} pointerEvents="none" />
      <View style={s.bgContour2} pointerEvents="none" />

      <KeyboardAvoidingView
        style={s.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          style={s.scroll}
          contentContainerStyle={[s.scrollInner, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 160 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ═══ 1. REVENUE HEADER ═══ */}
          <Animated.View entering={FadeInUp.duration(500).springify()} style={s.topNav}>
            <Animated.View style={backPress.style}>
              <TouchableOpacity
                style={s.navBack}
                activeOpacity={0.7}
                onPress={() => router.canGoBack() ? router.back() : router.replace('/records' as any)}
                onPressIn={backPress.onPressIn}
                onPressOut={backPress.onPressOut}
              >
                <GoonaIcon icon={ArrowLeft} size={22} color="#1B1B1B" />
              </TouchableOpacity>
            </Animated.View>
            <View style={s.navCenter}>
              <Text style={s.topTitle}>Record Sale</Text>
              <View style={s.liveRow}>
                <LiveDot />
                <Text style={s.liveText}>Live Revenue Capture</Text>
              </View>
            </View>
            <View style={s.navSpacer} />
          </Animated.View>

          {/* ═══ 2. QUICK REVENUE SUMMARY ═══ */}
          <Animated.View entering={FadeInUp.duration(500).delay(60).springify()}>
            <LinearGradient colors={['#2E7D32', '#388E3C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.summaryCard}>
              <View style={s.summaryGlow} pointerEvents="none" />
              <View style={s.summaryGrid}>
                {[
                  { label: "Today's Sales", val: '\u20A6820k' },
                  { label: 'Pending', val: '\u20A6120k' },
                  { label: 'Weekly Revenue', val: '\u20A64.8M' },
                ].map((sm, i) => (
                  <View key={i} style={[s.summaryCell, i < 2 && { borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.08)' }]}>
                    <Text style={s.summaryVal}>{sm.val}</Text>
                    <Text style={s.summaryLabel}>{sm.label}</Text>
                  </View>
                ))}
              </View>
            </LinearGradient>
          </Animated.View>

          {/* ═══ 3. BUYER INFORMATION ═══ */}
          <SecHead title="Buyer Information" />
          <Animated.View entering={FadeInUp.duration(500).delay(100).springify()}>
            <View style={s.buyerCard}>
              <FormInput label="Buyer Name" value={buyerName} onChange={setBuyerName} placeholder="Enter buyer name" />
              <FormInput label="Phone Number" value={phoneNumber} onChange={setPhoneNumber} placeholder="+234 XXX XXX XXXX" keyboardType="phone-pad" />
              <Text style={fiStyles.label}>Customer Type</Text>
              <View style={s.typeRow}>
                {CUSTOMER_TYPES.map((ct) => {
                  const sel = customerType === ct.key
                  const ctPress = usePressScale()
                  return (
                    <Animated.View key={ct.key} style={ctPress.style}>
                      <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => setCustomerType(ct.key)}
                        onPressIn={ctPress.onPressIn}
                        onPressOut={ctPress.onPressOut}
                        style={[s.typeChip, sel && s.typeChipSelected]}
                      >
                        <Text style={[s.typeChipText, sel && s.typeChipTextSelected]}>{ct.label}</Text>
                      </TouchableOpacity>
                    </Animated.View>
                  )
                })}
              </View>
            </View>
          </Animated.View>

          {/* ═══ 4. PRODUCT SELECTION ═══ */}
          <SecHead title="Product Selection" />
          <Animated.View entering={FadeInUp.duration(500).delay(140).springify()} style={s.prodGrid}>
            {(Object.keys(PRODUCT_DATA) as ProductType[]).map((p) => (
              <ProductCard key={p} p={p} selected={product === p} onSelect={() => setProduct(p)} />
            ))}
          </Animated.View>

          {/* ═══ 5. QUANTITY & WEIGHT ═══ */}
          <SecHead title="Quantity & Weight" />
          <Animated.View entering={FadeInUp.duration(500).delay(180).springify()}>
            <View style={s.qwCard}>
              <View style={s.qwRow}>
                <View style={s.qwHalf}>
                  <FormInput label="Quantity Sold" value={quantity} onChange={setQuantity} placeholder="0" keyboardType="numeric" />
                </View>
                <View style={s.qwHalf}>
                  {product && PRODUCT_DATA[product].unit !== 'crate' && PRODUCT_DATA[product].unit !== 'bag' ? (
                    <FormInput label="Avg Weight (kg)" value={avgWeight} onChange={setAvgWeight} placeholder="0.0" keyboardType="numeric" />
                  ) : (
                    <View style={[fiStyles.wrap, { opacity: 0.5 }]}>
                      <Text style={fiStyles.label}>Avg Weight (kg)</Text>
                      <Text style={[fiStyles.input, { color: '#94A3B8' }]}>N/A for {product ? PRODUCT_DATA[product].unit : 'item'}</Text>
                    </View>
                  )}
                </View>
              </View>
              {qty > 0 && (
                  <Animated.View entering={FadeIn.duration(300)} style={s.qwCalc}>
                    <GoonaIcon icon={Plus} size={16} color="#2E7D32" />
                  <Text style={s.qwCalcText}>
                    {qty} {product ? PRODUCT_DATA[product].unit + '(s)' : 'units'}
                    {totalWeight > 0 ? ` \u00D7 ${avgW}kg = ${totalWeight.toFixed(1)}kg` : ''}
                  </Text>
                </Animated.View>
              )}
            </View>
          </Animated.View>

          {/* ═══ 6. PRICING ENGINE ═══ */}
          <SecHead title="Pricing Engine" />
          <Animated.View entering={FadeInUp.duration(500).delay(220).springify()}>
            <View style={s.pricingCard}>
              <View style={s.pricingRow}>
                <Text style={s.pricingLabel}>Price Per Unit</Text>
                <View style={s.pricingInputRow}>
                  <Text style={s.pricingCurrency}>&#x20A6;</Text>
                  <TextInput
                    style={s.pricingInput}
                    value={pricePerUnit}
                    onChangeText={setPricePerUnit}
                    keyboardType="numeric"
                    placeholder={product ? String(PRODUCT_DATA[product].price) : '0'}
                    placeholderTextColor="#94A3B8"
                  />
                  <Text style={s.pricingUnit}>/{product ? PRODUCT_DATA[product].unit : 'unit'}</Text>
                </View>
              </View>
              <View style={s.pricingDivider} />
              <View style={s.pricingRow}>
                <Text style={s.pricingLabel}>Total Revenue</Text>
                <Text style={s.pricingTotal}>&#x20A6;{grossRevenue.toLocaleString()}</Text>
              </View>
              <View style={s.pricingRow}>
                <Text style={s.pricingLabel}>Discount</Text>
                <View style={s.pricingInputRow}>
                  <Text style={s.pricingCurrency}>&#x20A6;</Text>
                  <TextInput
                    style={[s.pricingInput, { width: 80 }]}
                    value={discount}
                    onChangeText={setDiscount}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>
              <View style={s.pricingRow}>
                <Text style={s.pricingLabel}>Outstanding Balance</Text>
                <Text style={[s.pricingTotal, { color: outstandingBalance > 0 ? '#F59E0B' : '#16A34A' }]}>
                  &#x20A6;{outstandingBalance.toLocaleString()}
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* ═══ 7. PAYMENT METHOD ═══ */}
          <SecHead title="Payment Method" />
          <Animated.View entering={FadeInUp.duration(500).delay(260).springify()} style={s.payRow}>
            {PAYMENT_METHODS.map((pm) => {
              const sel = paymentMethod === pm.key
              const pPress = usePressScale()
              return (
                <Animated.View key={pm.key} style={pPress.style}>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => setPaymentMethod(pm.key)}
                    onPressIn={pPress.onPressIn}
                    onPressOut={pPress.onPressOut}
                    style={[s.payCard, sel && s.payCardSelected]}
                  >
                    <View style={[s.payIcon, sel && s.payIconSelected]}>
                      <Text style={s.payIconText}>{pm.icon}</Text>
                    </View>
                    <Text style={[s.payLabel, sel && s.payLabelSelected]}>{pm.label}</Text>
                  </TouchableOpacity>
                </Animated.View>
              )
            })}
          </Animated.View>

          {/* ═══ 8. REVENUE BREAKDOWN ═══ */}
          <SecHead title="Revenue Breakdown" />
          <Animated.View entering={FadeInUp.duration(500).delay(300).springify()}>
            <LinearGradient colors={['#0a1628', '#0f1f3a']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.breakdownCard}>
              <View style={s.breakdownGlow} pointerEvents="none" />
              {[
                { label: 'Gross Revenue', val: grossRevenue, color: '#fff' },
                { label: 'Expenses (est.)', val: estimatedExpenses, color: '#EF4444' },
                { label: 'Estimated Profit', val: estimatedProfit, color: '#AEEA00' },
              ].map((b, i) => (
                <View key={i} style={[s.bdRow, i < 2 && s.bdRowBorder]}>
                  <Text style={s.bdLabel}>{b.label}</Text>
                  <Text style={[s.bdValue, { color: b.color }]}>&#x20A6;{b.val.toLocaleString()}</Text>
                </View>
              ))}
              <View style={s.iqSuggestion}>
                <View style={s.iqBadge}>
                  <Text style={s.iqBadgeText}>GOONA IQ</Text>
                </View>
                <Text style={s.iqText}>
                  Reinvest &#x20A6;{reinvestSuggestion.toLocaleString()} into feed inventory to optimize next production cycle.
                </Text>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* ═══ 9. NOTES & ATTACHMENTS ═══ */}
          <SecHead title="Notes & Attachments" />
          <Animated.View entering={FadeInUp.duration(500).delay(340).springify()}>
            <View style={s.notesCard}>
              <FormInput label="Operational Notes" value={notes} onChange={setNotes} placeholder="Add notes about this sale..." multiline />
              <View style={s.attachRow}>
                <TouchableOpacity style={s.attachBtn} activeOpacity={0.85} onPress={pickImage}>
                  <GoonaIcon icon={Image} size={18} color="#2E7D32" />
                  <Text style={s.attachText}>Image</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.attachBtn} activeOpacity={0.85} onPress={() => Alert.alert('Coming Soon', 'Voice recording will be available soon.')}>
                  <GoonaIcon icon={Mic} size={18} color="#2E7D32" />
                  <Text style={s.attachText}>Voice</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.attachBtn} activeOpacity={0.85} onPress={pickImage}>
                  <GoonaIcon icon={FileText} size={18} color="#2E7D32" />
                  <Text style={s.attachText}>Invoice</Text>
                </TouchableOpacity>
              </View>
              {attachmentCount > 0 && (
                <Animated.View entering={FadeIn.duration(300)} style={s.attachBadge}>
                  <Text style={s.attachBadgeText}>{attachmentCount} file(s) attached</Text>
                </Animated.View>
              )}
            </View>
          </Animated.View>

          {/* ═══ 10. SUBMIT SALE BUTTON ═══ */}
          <Animated.View entering={FadeInUp.duration(500).delay(380).springify()} style={s.submitWrap}>
            <Animated.View style={submitPress.style}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleSubmit}
                onPressIn={submitPress.onPressIn}
                onPressOut={submitPress.onPressOut}
                disabled={submitting}
                style={s.submitBtn}
              >
                <LinearGradient colors={['#2E7D32', '#1B5E20']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.submitGrad}>
                  {submitting ? (
                    <Text style={s.submitText}>Recording...</Text>
                  ) : (
                    <>
                      <GoonaIcon icon={CheckCircle} size={20} color="white" />
                      <Text style={s.submitText}>Record Revenue</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ═══ 11. SUCCESS MODAL ═══ */}
      <Modal visible={showSuccess} transparent animationType="fade" onRequestClose={() => setShowSuccess(false)}>
        <View style={s.modalOverlay}>
          <Animated.View entering={FadeInUp.duration(500).springify().springify()} style={s.modalCard}>
            <View style={s.modalSuccessIcon}>
              <GoonaIcon icon={CheckCircle} size={48} color="#AEEA00" />
            </View>
            <Text style={s.modalTitle}>Sale Recorded{'\n'}Successfully</Text>
            <Text style={s.modalAmount}>&#x20A6;{netRevenue.toLocaleString()}</Text>
            <View style={s.modalMeta}>
              <View style={s.modalMetaRow}>
                <Text style={s.modalMetaLabel}>Transaction ID</Text>
                <Text style={s.modalMetaVal}>{txId}</Text>
              </View>
              <View style={s.modalMetaRow}>
                <Text style={s.modalMetaLabel}>Timestamp</Text>
                <Text style={s.modalMetaVal}>{new Date().toLocaleString()}</Text>
              </View>
              <View style={s.modalMetaRow}>
                <Text style={s.modalMetaLabel}>Updated Revenue</Text>
                <Text style={[s.modalMetaVal, { color: '#AEEA00' }]}>&#x20A6;5.6M</Text>
              </View>
            </View>
            <View style={s.modalActions}>
              <TouchableOpacity style={s.modalBtn} activeOpacity={0.85} onPress={() => {
                setShowSuccess(false)
                resetForm()
              }}>
                <Text style={s.modalBtnText}>Record Another Sale</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalBtnOutline} activeOpacity={0.85} onPress={() => {
                setShowSuccess(false)
                router.push('/records/sales-revenue' as any)
              }}>
                <Text style={s.modalBtnOutlineText}>View Reports</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={s.modalClose} activeOpacity={0.7} onPress={() => {
              setShowSuccess(false)
              resetForm()
            }}>
              <Text style={s.modalCloseText}>Share Receipt</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {/* ═══ 12. GOONA DOCK ═══ */}
      <BottomDock />
    </View>
  )
}

/* ─── Styles ─── */
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAF7' },
  kav: { flex: 1 },
  scroll: { flex: 1 },
  scrollInner: { paddingHorizontal: H_PAD },

  /* bg */
  bgGlow: { position: 'absolute', top: -60, right: -60, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(232,245,233,0.3)', zIndex: 0 },
  bgContour1: { position: 'absolute', top: '8%', left: '-8%', width: 320, height: 100, zIndex: 0, borderWidth: 1, borderColor: 'rgba(46,125,50,0.04)', borderTopLeftRadius: 160, borderTopRightRadius: 160, borderBottomWidth: 0, transform: [{ rotate: '5deg' }] },
  bgContour2: { position: 'absolute', bottom: '20%', right: '-12%', width: 260, height: 80, zIndex: 0, borderWidth: 1, borderColor: 'rgba(46,125,50,0.04)', borderBottomLeftRadius: 130, borderBottomRightRadius: 130, borderTopWidth: 0, transform: [{ rotate: '-7deg' }] },

  /* 1. header */
  topNav: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  navBack: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  navCenter: { flex: 1 },
  topTitle: { fontWeight: '800', fontSize: 22, color: '#1B1B1B' },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  liveText: { fontSize: 10, fontWeight: '600', color: '#16A34A', letterSpacing: 0.3 },
  navSpacer: { width: 38 },

  /* 2. summary */
  summaryCard: { borderRadius: 28, padding: 18, overflow: 'hidden', shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.2, shadowRadius: 40, elevation: 6 },
  summaryGlow: { position: 'absolute', top: '-40%', right: '-20%', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(174,234,0,0.08)' },
  summaryGrid: { flexDirection: 'row' },
  summaryCell: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  summaryVal: { fontWeight: '800', fontSize: 20, color: '#fff', letterSpacing: -0.3 },
  summaryLabel: { fontSize: 10, fontWeight: '500', color: 'rgba(255,255,255,0.6)', marginTop: 1 },

  /* 3. buyer */
  buyerCard: { backgroundColor: 'white', borderRadius: 28, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 18, elevation: 2 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  typeChip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 50, backgroundColor: '#F1F5F1', borderWidth: 1.5, borderColor: '#E2E8E0' },
  typeChipSelected: { backgroundColor: 'rgba(46,125,50,0.08)', borderColor: '#2E7D32' },
  typeChipText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  typeChipTextSelected: { color: '#2E7D32' },

  /* 4. product */
  prodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  /* product card styles inline in component */

  /* 5. quantity & weight */
  qwCard: { backgroundColor: 'white', borderRadius: 28, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 18, elevation: 2 },
  qwRow: { flexDirection: 'row', gap: 10 },
  qwHalf: { flex: 1 },
  qwCalc: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, backgroundColor: '#F0FDF4', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12 },
  qwCalcText: { fontSize: 12, fontWeight: '600', color: '#2E7D32' },

  /* 6. pricing */
  pricingCard: { backgroundColor: 'white', borderRadius: 28, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 18, elevation: 2 },
  pricingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  pricingDivider: { height: 1, backgroundColor: '#F1F5F1', marginVertical: 2 },
  pricingLabel: { fontSize: 13, fontWeight: '500', color: '#64748B' },
  pricingInputRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  pricingCurrency: { fontSize: 16, fontWeight: '700', color: '#1B1B1B' },
  pricingInput: { fontSize: 16, fontWeight: '700', color: '#1B1B1B', textAlign: 'right', minWidth: 60, paddingVertical: 2, borderBottomWidth: 1.5, borderBottomColor: '#E8ECEE' },
  pricingUnit: { fontSize: 12, fontWeight: '500', color: '#94A3B8' },
  pricingTotal: { fontSize: 16, fontWeight: '800', color: '#1B1B1B' },

  /* 7. payment */
  payRow: { flexDirection: 'row', gap: 8 },
  payCard: { flex: 1, backgroundColor: 'white', borderRadius: 20, padding: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#E8ECEE', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 1 },
  payCardSelected: { borderColor: '#2E7D32', backgroundColor: '#FAFDF8' },
  payIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#F8FAF7', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  payIconSelected: { backgroundColor: 'rgba(46,125,50,0.08)' },
  payIconText: { fontSize: 18 },
  payLabel: { fontSize: 11, fontWeight: '600', color: '#64748B' },
  payLabelSelected: { color: '#2E7D32' },

  /* 8. breakdown */
  breakdownCard: { borderRadius: 28, padding: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 30, elevation: 4 },
  breakdownGlow: { position: 'absolute', top: '-30%', right: '-15%', width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(174,234,0,0.03)' },
  bdRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  bdRowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  bdLabel: { fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.6)' },
  bdValue: { fontSize: 16, fontWeight: '800' },
  iqSuggestion: { marginTop: 14, padding: 14, backgroundColor: 'rgba(174,234,0,0.04)', borderRadius: 16, borderLeftWidth: 3, borderLeftColor: '#AEEA00' },
  iqBadge: { alignSelf: 'flex-start', backgroundColor: '#2E7D32', paddingVertical: 2, paddingHorizontal: 8, borderRadius: 50, marginBottom: 6 },
  iqBadgeText: { fontSize: 9, fontWeight: '700', color: '#fff' },
  iqText: { fontSize: 12, lineHeight: 18, color: 'rgba(255,255,255,0.8)' },

  /* 9. notes */
  notesCard: { backgroundColor: 'white', borderRadius: 28, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 18, elevation: 2 },
  attachRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  attachBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 14, backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: 'rgba(46,125,50,0.1)' },
  attachText: { fontSize: 12, fontWeight: '600', color: '#2E7D32' },
  attachBadge: { marginTop: 8, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#F0FDF4', borderRadius: 50, alignSelf: 'flex-start' },
  attachBadgeText: { fontSize: 11, fontWeight: '600', color: '#2E7D32' },

  /* 10. submit */
  submitWrap: { marginTop: 24, marginBottom: 8 },
  submitBtn: { borderRadius: 20, overflow: 'hidden', shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 24, elevation: 6 },
  submitGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18 },
  submitText: { fontWeight: '700', fontSize: 17, color: '#fff' },

  /* 11. modal */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { width: '100%', maxWidth: 360, backgroundColor: '#F8FAF7', borderRadius: 40, padding: 28, alignItems: 'center' },
  modalSuccessIcon: { marginBottom: 16 },
  modalTitle: { fontWeight: '800', fontSize: 22, color: '#1B1B1B', textAlign: 'center', lineHeight: 28 },
  modalAmount: { fontWeight: '900', fontSize: 36, color: '#2E7D32', marginTop: 8, letterSpacing: -1 },
  modalMeta: { width: '100%', backgroundColor: 'white', borderRadius: 20, padding: 16, marginTop: 16 },
  modalMetaRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  modalMetaLabel: { fontSize: 12, color: '#94A3B8' },
  modalMetaVal: { fontSize: 12, fontWeight: '600', color: '#1B1B1B' },
  modalActions: { width: '100%', gap: 8, marginTop: 16 },
  modalBtn: { paddingVertical: 14, borderRadius: 16, backgroundColor: '#2E7D32', alignItems: 'center' },
  modalBtnText: { fontWeight: '700', fontSize: 14, color: '#fff' },
  modalBtnOutline: { paddingVertical: 14, borderRadius: 16, borderWidth: 1.5, borderColor: '#E2E8E0', alignItems: 'center' },
  modalBtnOutlineText: { fontWeight: '600', fontSize: 14, color: '#1B1B1B' },
  modalClose: { marginTop: 12, paddingVertical: 6 },
  modalCloseText: { fontSize: 13, fontWeight: '500', color: '#2E7D32' },
})

/* ─── Product card styles (needed outside component) ─── */
const prodStyles = StyleSheet.create({
  card: { width: (SCREEN_W - H_PAD * 2 - 10) / 2, backgroundColor: 'white', borderRadius: 22, padding: 16, alignItems: 'center', borderWidth: 1.5, borderColor: '#E8ECEE', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 1 },
  cardSelected: { borderColor: '#2E7D32', backgroundColor: '#FAFDF8' },
  icon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  iconText: { fontSize: 20 },
  label: { fontSize: 13, fontWeight: '700', color: '#1B1B1B', marginBottom: 2 },
  labelSelected: { color: '#2E7D32' },
  price: { fontSize: 11, fontWeight: '600', color: '#64748B' },
})
