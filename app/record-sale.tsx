import React, { useState, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, Dimensions, Modal, KeyboardAvoidingView, Platform, Alert,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react-native'
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  withSequence, withRepeat, FadeInUp, FadeIn, Easing,
} from 'react-native-reanimated'
import GoonaIcon from '../components/ui/GoonaIcon'
import BottomDock from '../components/navigation/BottomDock'
import { formatInput, parseAmount, formatNaira } from '../utils/format'

const { width: SCREEN_W } = Dimensions.get('window')
const H_PAD = 20

type ProductType = 'broilers' | 'layers' | 'eggs' | 'catfish' | 'feed' | 'other'
type PaymentType = 'cash' | 'transfer' | 'pos' | 'credit'

type ProductConfig = {
  label: string; emoji: string; price: number; unit: string; qtyLabel: string; priceLabel: string
}

const PRODUCTS: Record<ProductType, ProductConfig> = {
  broilers: { label: 'Broilers', emoji: '\u{1F425}', price: 4500, unit: 'bird', qtyLabel: 'Birds Sold', priceLabel: 'Price Per Bird' },
  layers:  { label: 'Layers', emoji: '\u{1F413}', price: 3200, unit: 'bird', qtyLabel: 'Birds Sold', priceLabel: 'Price Per Bird' },
  eggs:    { label: 'Eggs', emoji: '\u{1F95A}', price: 3500, unit: 'crate', qtyLabel: 'Crates Sold', priceLabel: 'Price Per Crate' },
  catfish: { label: 'Catfish', emoji: '\u{1F41F}', price: 1200, unit: 'kg', qtyLabel: 'Weight Sold (kg)', priceLabel: 'Price Per Kg' },
  feed:    { label: 'Feed', emoji: '\u{1F33E}', price: 18000, unit: 'bag', qtyLabel: 'Bags Sold', priceLabel: 'Price Per Bag' },
  other:   { label: 'Custom Product', emoji: '\u{2795}', price: 0, unit: 'unit', qtyLabel: 'Quantity', priceLabel: 'Price Per Unit' },
}

const PAYMENTS: { key: PaymentType; emoji: string; label: string }[] = [
  { key: 'cash', emoji: '\u{1F4B5}', label: 'Cash' },
  { key: 'transfer', emoji: '\u{1F4B1}', label: 'Transfer' },
  { key: 'pos', emoji: '\u{1F4B3}', label: 'POS' },
  { key: 'credit', emoji: '\u{1F4B0}', label: 'Credit' },
]

const STEPS = ['Product', 'Quantity', 'Payment', 'Save']
const PRODUCT_LIST = Object.keys(PRODUCTS) as ProductType[]

const UNIT_OPTIONS = ['Bags', 'Kg', 'Tonnes', 'Crates', 'Pieces', 'Litres', 'Sacks', 'Units', 'Custom']

function usePressScale(scaleTo = 0.96) {
  const scale = useSharedValue(1)
  return {
    style: useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] })),
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

function LiveDot() {
  const pulse = usePulse()
  return <Animated.View style={[{ width: 5, height: 5, borderRadius: 3, backgroundColor: '#16A34A' }, pulse]} />
}

export default function RecordSaleScreen() {
  const insets = useSafeAreaInsets()
  const ps = usePressScale()
  const btnPs = usePressScale(0.97)

  const [step, setStep] = useState(1)
  const [product, setProduct] = useState<ProductType | null>(null)
  const [quantity, setQuantity] = useState('')
  const [pricePerUnitRaw, setPricePerUnitRaw] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentType | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showBuyer, setShowBuyer] = useState(false)
  const [buyerName, setBuyerName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [customerType, setCustomerType] = useState<string | null>(null)
  const [customProductName, setCustomProductName] = useState('')
  const [unitType, setUnitType] = useState('Units')
  const [customUnit, setCustomUnit] = useState('')
  const productScales = PRODUCT_LIST.map(() => usePressScale())
  const paymentScales = PAYMENTS.map(() => usePressScale())

  const qty = parseFloat(quantity) || 0
  const ppu = parseAmount(pricePerUnitRaw) || (product ? PRODUCTS[product].price : 0)
  const pricePerUnitDisplay = formatInput(pricePerUnitRaw)
  const total = qty * ppu

  useEffect(() => {
    if (product && product !== 'other' && !pricePerUnitRaw) {
      setPricePerUnitRaw(String(PRODUCTS[product].price))
    }
    if (product && product === 'other' && !pricePerUnitRaw) {
      setPricePerUnitRaw('')
    }
  }, [product])

  const selectProduct = (p: ProductType) => {
    setProduct(p)
    setQuantity('')
    setPricePerUnitRaw(p !== 'other' ? String(PRODUCTS[p].price) : '')
    setStep(2)
  }

  const customValid = product === 'other' ? customProductName.trim().length > 0 && qty > 0 && ppu > 0 : true
  const canProceedToPayment = qty > 0 && ppu > 0 && (product !== 'other' || customValid)
  const displayUnit = product === 'other'
    ? (unitType === 'Custom' ? customUnit.trim() || 'unit' : unitType.toLowerCase())
    : product
      ? PRODUCTS[product].unit + '(s)'
      : 'units'
  const canSave = paymentMethod !== null

  const handleSave = () => {
    if (!canSave) return
    setSubmitting(true)
    setTimeout(() => {
      setSubmitting(false)
      setShowSuccess(true)
    }, 1200)
  }

  const resetForm = () => {
    setStep(1)
    setProduct(null)
    setQuantity('')
    setPricePerUnitRaw('')
    setPaymentMethod(null)
    setBuyerName('')
    setPhoneNumber('')
    setCustomerType(null)
    setCustomProductName('')
    setUnitType('Units')
    setCustomUnit('')
    setShowBuyer(false)
  }

  const txId = `GOONA-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`

  const renderStepIndicator = () => (
    <View style={styles.stepRow}>
      {STEPS.map((s, i) => {
        const active = step === i + 1
        const done = step > i + 1
        return (
          <React.Fragment key={s}>
            <View style={styles.stepGroup}>
              <View style={[styles.stepDot, active && styles.stepDotActive, done && styles.stepDotDone]}>
                {done ? <Text style={styles.stepDotDoneText}>{'\u2713'}</Text> : <Text style={[styles.stepDotNum, active && styles.stepDotNumActive]}>{i + 1}</Text>}
              </View>
              <Text numberOfLines={1} style={[styles.stepLabel, active && styles.stepLabelActive, done && styles.stepLabelDone]}>{s}</Text>
            </View>
            {i < STEPS.length - 1 && <View style={[styles.stepLine, done && styles.stepLineDone]} />}
          </React.Fragment>
        )
      })}
    </View>
  )

  const renderProductStep = () => (
    <Animated.View entering={FadeInUp.duration(400).springify()} style={styles.stepContent}>
      <Text style={styles.stepTitle}>What are you selling?</Text>
      <Text style={styles.stepSub}>Select a product to continue</Text>
      <View style={styles.productGrid}>
        {PRODUCT_LIST.map((p, idx) => {
          const pr = PRODUCTS[p]
          const cps = productScales[idx]
          return (
            <Animated.View key={p} style={cps.style}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => selectProduct(p)}
                onPressIn={cps.onPressIn}
                onPressOut={cps.onPressOut}
                style={[styles.productCard, product === p && styles.productCardSelected]}
              >
                <View style={[styles.productIconWrap, product === p && styles.productIconWrapSelected]}>
                  <Text style={styles.productEmoji}>{pr.emoji}</Text>
                </View>
                <Text style={[styles.productLabel, product === p && styles.productLabelSelected]}>{pr.label}</Text>
                {p !== 'other' && <Text style={styles.productPrice}>&#x20A6;{pr.price.toLocaleString('en-NG')}/{pr.unit}</Text>}
              </TouchableOpacity>
            </Animated.View>
          )
        })}
      </View>
    </Animated.View>
  )

  const renderQuantityStep = () => (
    <Animated.View entering={FadeInUp.duration(400).springify()} style={styles.stepContent}>
      <Text style={styles.stepTitle}>Enter quantity</Text>
      <Text style={styles.stepSub}>{product === 'other' ? (customProductName || 'Custom Product') : product ? PRODUCTS[product].label : ''}</Text>

      {product === 'other' && (
        <Animated.View entering={FadeInUp.duration(300).springify()} style={styles.customNameCard}>
          <Text style={styles.quantityLabel}>Product Name</Text>
          <TextInput
            style={styles.customNameInput}
            value={customProductName}
            onChangeText={setCustomProductName}
            placeholder="e.g. Poultry Manure"
            placeholderTextColor="#CBD5E1"
          />
        </Animated.View>
      )}

      <View style={styles.quantityCard}>
        <Text style={styles.quantityLabel}>{product ? PRODUCTS[product].qtyLabel : 'Quantity'}</Text>
        <View style={styles.quantityRow}>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => setQuantity(String(Math.max(0, qty - 1)))}
          >
            <Text style={styles.qtyBtnText}>-</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.quantityInput}
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#CBD5E1"
          />
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => setQuantity(String(qty + 1))}
          >
            <Text style={styles.qtyBtnText}>+</Text>
          </TouchableOpacity>
        </View>
        {product && product !== 'other' && <Text style={styles.quantityUnit}>{PRODUCTS[product].unit + '(s)'}</Text>}
      </View>

      {product === 'other' && (
        <Animated.View entering={FadeInUp.duration(300).springify()} style={styles.quantityCard}>
          <Text style={styles.quantityLabel}>Unit</Text>
          <View style={styles.unitGrid}>
            {UNIT_OPTIONS.map((u) => {
              const sel = unitType === u
              return (
                <TouchableOpacity
                  key={u}
                  style={[styles.unitChip, sel && styles.unitChipSelected]}
                  onPress={() => setUnitType(u)}
                >
                  <Text style={[styles.unitChipText, sel && styles.unitChipTextSelected]}>{u}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
          {unitType === 'Custom' && (
            <TextInput
              style={styles.customUnitInput}
              value={customUnit}
              onChangeText={setCustomUnit}
              placeholder="e.g. Truckloads, Bundles"
              placeholderTextColor="#CBD5E1"
            />
          )}
        </Animated.View>
      )}

      <View style={styles.priceCard}>
        <Text style={styles.priceLabel}>{product ? PRODUCTS[product].priceLabel : 'Price Per Unit'}</Text>
        <View style={styles.priceInputRow}>
          <Text style={styles.priceCurrency}>&#x20A6;</Text>
          <TextInput
            style={styles.priceInput}
            value={pricePerUnitDisplay}
            onChangeText={(v) => setPricePerUnitRaw(v.replace(/[^0-9]/g, ''))}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#CBD5E1"
          />
        </View>
        {qty > 0 && ppu > 0 && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.totalPreview}>
            <Text style={styles.totalPreviewLabel}>Total</Text>
            <Text style={styles.totalPreviewValue}>&#x20A6;{total.toLocaleString('en-NG')}</Text>
          </Animated.View>
        )}
      </View>

      <TouchableOpacity
        style={[styles.continueBtn, !canProceedToPayment && styles.continueBtnDisabled]}
        disabled={!canProceedToPayment}
        onPress={() => setStep(3)}
      >
        <Text style={[styles.continueBtnText, !canProceedToPayment && styles.continueBtnTextDisabled]}>Continue</Text>
      </TouchableOpacity>
    </Animated.View>
  )

  const renderPaymentStep = () => (
    <Animated.View entering={FadeInUp.duration(400).springify()} style={styles.stepContent}>
      <Text style={styles.stepTitle}>Payment method</Text>
      <Text style={styles.stepSub}>Select how the customer paid</Text>

      <View style={styles.paymentGrid}>
        {PAYMENTS.map((pm, idx) => {
          const sel = paymentMethod === pm.key
          const pps = paymentScales[idx]
          return (
            <Animated.View key={pm.key} style={pps.style}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => setPaymentMethod(pm.key)}
                onPressIn={pps.onPressIn}
                onPressOut={pps.onPressOut}
                style={[styles.paymentCard, sel && styles.paymentCardSelected]}
              >
                <View style={[styles.paymentIconWrap, sel && styles.paymentIconWrapSelected]}>
                  <Text style={styles.paymentEmoji}>{pm.emoji}</Text>
                </View>
                <Text style={[styles.paymentLabel, sel && styles.paymentLabelSelected]}>{pm.label}</Text>
              </TouchableOpacity>
            </Animated.View>
          )
        })}
      </View>

      <TouchableOpacity
        style={[styles.continueBtn, !canSave && styles.continueBtnDisabled]}
        disabled={!canSave}
        onPress={() => setStep(4)}
      >
        <Text style={[styles.continueBtnText, !canSave && styles.continueBtnTextDisabled]}>Review Sale</Text>
      </TouchableOpacity>
    </Animated.View>
  )

  const renderSummaryStep = () => (
    <Animated.View entering={FadeInUp.duration(400).springify()} style={styles.stepContent}>
      <Text style={styles.stepTitle}>Sale summary</Text>
      <Text style={styles.stepSub}>Confirm details before saving</Text>

      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Product</Text>
          <Text style={styles.summaryValue}>
            {product === 'other'
              ? '\u{2795} ' + (customProductName || 'Custom Product')
              : product
                ? PRODUCTS[product].emoji + ' ' + PRODUCTS[product].label
                : '-'}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Quantity</Text>
          <Text style={styles.summaryValue}>{qty} {displayUnit}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Unit Price</Text>
          <Text style={styles.summaryValue}>&#x20A6;{ppu.toLocaleString('en-NG')}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Payment</Text>
          <Text style={styles.summaryValue}>{PAYMENTS.find(p => p.key === paymentMethod)?.emoji} {PAYMENTS.find(p => p.key === paymentMethod)?.label}</Text>
        </View>
        <View style={styles.summaryTotalRow}>
          <Text style={styles.summaryTotalLabel}>Total Revenue</Text>
          <Text style={styles.summaryTotalValue}>&#x20A6;{total.toLocaleString('en-NG')}</Text>
        </View>
      </View>

      {/* Optional Buyer Details */}
      <TouchableOpacity style={styles.buyerToggle} onPress={() => setShowBuyer(!showBuyer)}>
        <Text style={styles.buyerToggleText}>{showBuyer ? 'Hide' : '+ Add'} Buyer Details (Optional)</Text>
        <GoonaIcon icon={showBuyer ? ChevronUp : ChevronDown} size={16} color="#2E7D32" />
      </TouchableOpacity>

      {showBuyer && (
        <Animated.View entering={FadeInUp.duration(300).springify()} style={styles.buyerSection}>
          <View style={styles.buyerInputWrap}>
            <Text style={styles.buyerInputLabel}>Buyer Name</Text>
            <TextInput
              style={styles.buyerInput}
              value={buyerName}
              onChangeText={setBuyerName}
              placeholder="Enter buyer name"
              placeholderTextColor="#94A3B8"
            />
          </View>
          <View style={styles.buyerInputWrap}>
            <Text style={styles.buyerInputLabel}>Phone Number</Text>
            <TextInput
              style={styles.buyerInput}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="+234 XXX XXX XXXX"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
            />
          </View>
          <View style={styles.buyerInputWrap}>
            <Text style={styles.buyerInputLabel}>Customer Type</Text>
            <View style={styles.buyerTypeRow}>
              {['Retail', 'Distributor', 'Market', 'Restaurant'].map((t) => {
                const sel = customerType === t
                return (
                  <TouchableOpacity
                    key={t}
                    style={[styles.buyerTypeChip, sel && styles.buyerTypeChipSelected]}
                    onPress={() => setCustomerType(t)}
                  >
                    <Text style={[styles.buyerTypeChipText, sel && styles.buyerTypeChipTextSelected]}>{t}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        </Animated.View>
      )}

      <Animated.View style={btnPs.style}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleSave}
          onPressIn={btnPs.onPressIn}
          onPressOut={btnPs.onPressOut}
          disabled={submitting}
          style={[styles.saveBtn, submitting && styles.saveBtnDisabled]}
        >
          {submitting ? (
            <Text style={styles.saveBtnText}>Recording...</Text>
          ) : (
            <>
              <GoonaIcon icon={CheckCircle} size={22} color="#FFF" />
              <Text style={styles.saveBtnText}>Record Sale</Text>
            </>
          )}
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  )

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollInner, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 160 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Animated.View entering={FadeInUp.duration(500).springify()} style={styles.topNav}>
            <Animated.View style={ps.style}>
              <TouchableOpacity
                style={styles.navBack}
                activeOpacity={0.7}
                onPress={() => {
                  if (step > 1) { setStep(step - 1); return }
                  router.canGoBack() ? router.back() : router.replace('/records' as any)
                }}
                onPressIn={ps.onPressIn}
                onPressOut={ps.onPressOut}
              >
                <GoonaIcon icon={ArrowLeft} size={22} color="#1B1B1B" />
              </TouchableOpacity>
            </Animated.View>
            <View style={styles.navCenter}>
              <Text style={styles.topTitle}>Record Sale</Text>
              <View style={styles.liveRow}>
                <LiveDot />
                <Text style={styles.liveText}>Record First. Analyze Later.</Text>
              </View>
            </View>
          </Animated.View>

          {/* Metrics Strip */}
          <Animated.View entering={FadeInUp.duration(500).delay(40).springify()} style={styles.metricsStrip}>
            <View style={styles.metricCell}>
              <Text style={styles.metricValue}>&#x20A6;820k</Text>
              <Text style={styles.metricLabel}>Today's Sales</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricCell}>
              <Text style={styles.metricValue}>14</Text>
              <Text style={styles.metricLabel}>Transactions</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricCell}>
              <Text style={styles.metricValue}>Broilers</Text>
              <Text style={styles.metricLabel}>Top Product</Text>
            </View>
          </Animated.View>

          {/* Step Indicator */}
          {step > 1 && renderStepIndicator()}

          {/* Step Content */}
          {step === 1 && renderProductStep()}
          {step === 2 && renderQuantityStep()}
          {step === 3 && renderPaymentStep()}
          {step === 4 && renderSummaryStep()}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Success Modal */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View entering={FadeInUp.duration(500).springify()} style={styles.modalCard}>
            <View style={styles.modalSuccessIcon}>
              <GoonaIcon icon={CheckCircle} size={48} color="#AEEA00" />
            </View>
            <Text style={styles.modalTitle}>Sale Recorded{'\n'}Successfully</Text>
            <Text style={styles.modalAmount}>&#x20A6;{total.toLocaleString('en-NG')}</Text>
            <View style={styles.modalMeta}>
              <View style={styles.modalMetaRow}>
                <Text style={styles.modalMetaLabel}>Transaction ID</Text>
                <Text style={styles.modalMetaVal}>{txId}</Text>
              </View>
              <View style={styles.modalMetaRow}>
                <Text style={styles.modalMetaLabel}>Product</Text>
                <Text style={styles.modalMetaVal}>{product === 'other' ? (customProductName || 'Custom') : product ? PRODUCTS[product].label : '-'}</Text>
              </View>
              <View style={styles.modalMetaRow}>
                <Text style={styles.modalMetaLabel}>Quantity</Text>
                <Text style={styles.modalMetaVal}>{qty} {displayUnit}</Text>
              </View>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtn} activeOpacity={0.85} onPress={() => { setShowSuccess(false); resetForm() }}>
                <Text style={styles.modalBtnText}>Record Another Sale</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnOutline} activeOpacity={0.85} onPress={() => {
                setShowSuccess(false)
                router.push('/records/sales-revenue' as any)
              }}>
                <Text style={styles.modalBtnOutlineText}>View Sales Analytics</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      <BottomDock />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAF7' },
  flex: { flex: 1 },
  scroll: { flex: 1 },
  scrollInner: { paddingHorizontal: H_PAD },

  /* Header */
  topNav: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  navBack: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  navCenter: { flex: 1 },
  topTitle: { fontWeight: '800', fontSize: 22, color: '#1B1B1B' },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  liveText: { fontSize: 10, fontWeight: '600', color: '#16A34A', letterSpacing: 0.3 },

  /* Metrics Strip */
  metricsStrip: {
    flexDirection: 'row', backgroundColor: 'white', borderRadius: 20, padding: 14,
    marginTop: 8, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
  },
  metricCell: { flex: 1, alignItems: 'center' },
  metricDivider: { width: 1, backgroundColor: '#F1F5F1', marginVertical: 4 },
  metricValue: { fontSize: 16, fontWeight: '800', color: '#1B1B1B' },
  metricLabel: { fontSize: 10, fontWeight: '500', color: '#94A3B8', marginTop: 1 },

  /* Step Indicator */
  stepRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 16, paddingHorizontal: 8 },
  stepGroup: { flexDirection: 'row', alignItems: 'center', flexShrink: 0 },
  stepDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F1F5F1', alignItems: 'center', justifyContent: 'center' },
  stepDotActive: { backgroundColor: '#2E7D32' },
  stepDotDone: { backgroundColor: '#16A34A' },
  stepDotNum: { fontSize: 12, fontWeight: '700', color: '#94A3B8' },
  stepDotNumActive: { color: '#FFF' },
  stepDotDoneText: { fontSize: 12, fontWeight: '700', color: '#FFF' },
  stepLabel: { fontSize: 12, fontWeight: '600', color: '#94A3B8', marginLeft: 5 },
  stepLabelActive: { color: '#2E7D32' },
  stepLabelDone: { color: '#16A34A' },
  stepLine: { flex: 1, height: 2, backgroundColor: '#F1F5F1', marginHorizontal: 6 },
  stepLineDone: { backgroundColor: '#16A34A' },

  /* Step Content */
  stepContent: { paddingTop: 4 },
  stepTitle: { fontSize: 24, fontWeight: '800', color: '#1B1B1B', letterSpacing: -0.5 },
  stepSub: { fontSize: 14, color: '#94A3B8', marginTop: 2, marginBottom: 20 },

  /* Product Grid */
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  productCard: {
    width: (SCREEN_W - H_PAD * 2 - 10) / 2, backgroundColor: 'white', borderRadius: 22, padding: 18, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#E8ECEE',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 1,
  },
  productCardSelected: { borderColor: '#2E7D32', backgroundColor: '#FAFDF8' },
  productIconWrap: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#F8FAF7', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  productIconWrapSelected: { backgroundColor: 'rgba(46,125,50,0.08)' },
  productEmoji: { fontSize: 24 },
  productLabel: { fontSize: 15, fontWeight: '700', color: '#1B1B1B', marginBottom: 2 },
  productLabelSelected: { color: '#2E7D32' },
  productPrice: { fontSize: 11, fontWeight: '600', color: '#94A3B8' },

  /* Custom Product */
  customNameCard: { backgroundColor: 'white', borderRadius: 24, padding: 20, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 },
  customNameInput: { fontSize: 18, fontWeight: '700', color: '#1B1B1B', paddingVertical: 8, borderBottomWidth: 2, borderBottomColor: '#E8ECEE' },
  unitGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  unitChip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 50, backgroundColor: '#F1F5F1', borderWidth: 1.5, borderColor: '#E2E8E0' },
  unitChipSelected: { backgroundColor: 'rgba(46,125,50,0.08)', borderColor: '#2E7D32' },
  unitChipText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  unitChipTextSelected: { color: '#2E7D32' },
  customUnitInput: { fontSize: 16, fontWeight: '600', color: '#1B1B1B', paddingVertical: 10, marginTop: 10, borderBottomWidth: 2, borderBottomColor: '#E8ECEE' },

  /* Quantity */
  quantityCard: { backgroundColor: 'white', borderRadius: 24, padding: 20, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 },
  quantityLabel: { fontSize: 13, fontWeight: '600', color: '#64748B', marginBottom: 12 },
  quantityRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F1F5F1', alignItems: 'center', justifyContent: 'center' },
  qtyBtnText: { fontSize: 22, fontWeight: '700', color: '#1B1B1B' },
  quantityInput: { flex: 1, fontSize: 32, fontWeight: '800', color: '#1B1B1B', textAlign: 'center', paddingVertical: 8 },
  quantityUnit: { fontSize: 12, fontWeight: '600', color: '#94A3B8', textAlign: 'center', marginTop: 8 },

  /* Price */
  priceCard: { backgroundColor: 'white', borderRadius: 24, padding: 20, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 },
  priceLabel: { fontSize: 13, fontWeight: '600', color: '#64748B', marginBottom: 8 },
  priceInputRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  priceCurrency: { fontSize: 24, fontWeight: '800', color: '#1B1B1B' },
  priceInput: { flex: 1, fontSize: 24, fontWeight: '800', color: '#1B1B1B', paddingVertical: 4 },
  totalPreview: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F1' },
  totalPreviewLabel: { fontSize: 13, fontWeight: '500', color: '#94A3B8' },
  totalPreviewValue: { fontSize: 18, fontWeight: '800', color: '#2E7D32' },

  /* Payment */
  paymentGrid: { flexDirection: 'row', gap: 8 },
  paymentCard: {
    flex: 1, backgroundColor: 'white', borderRadius: 20, padding: 16, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#E8ECEE',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 1,
  },
  paymentCardSelected: { borderColor: '#2E7D32', backgroundColor: '#FAFDF8' },
  paymentIconWrap: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#F8FAF7', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  paymentIconWrapSelected: { backgroundColor: 'rgba(46,125,50,0.08)' },
  paymentEmoji: { fontSize: 22 },
  paymentLabel: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  paymentLabelSelected: { color: '#2E7D32' },

  /* Summary */
  summaryCard: { backgroundColor: 'white', borderRadius: 24, padding: 20, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  summaryDivider: { height: 1, backgroundColor: '#F1F5F1' },
  summaryLabel: { fontSize: 14, color: '#64748B' },
  summaryValue: { fontSize: 14, fontWeight: '700', color: '#1B1B1B' },
  summaryTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, marginTop: 4, borderTopWidth: 2, borderTopColor: '#2E7D32' },
  summaryTotalLabel: { fontSize: 16, fontWeight: '700', color: '#1B1B1B' },
  summaryTotalValue: { fontSize: 22, fontWeight: '900', color: '#2E7D32', letterSpacing: -0.5 },

  /* Continue Button */
  continueBtn: { paddingVertical: 16, borderRadius: 16, backgroundColor: '#2E7D32', alignItems: 'center', marginTop: 16 },
  continueBtnDisabled: { backgroundColor: '#E2E8E0' },
  continueBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  continueBtnTextDisabled: { color: '#94A3B8' },

  /* Buyer Details Toggle */
  buyerToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, marginBottom: 8 },
  buyerToggleText: { fontSize: 13, fontWeight: '600', color: '#2E7D32' },

  /* Buyer Section */
  buyerSection: { backgroundColor: 'white', borderRadius: 24, padding: 18, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 },
  buyerInputWrap: { marginBottom: 12 },
  buyerInputLabel: { fontSize: 11, fontWeight: '600', color: '#64748B', marginBottom: 4, letterSpacing: 0.3 },
  buyerInput: { backgroundColor: '#F8FAF7', borderRadius: 14, padding: 14, fontSize: 15, fontWeight: '600', color: '#1B1B1B', borderWidth: 1.5, borderColor: '#E8ECEE' },
  buyerTypeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  buyerTypeChip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 50, backgroundColor: '#F1F5F1', borderWidth: 1.5, borderColor: '#E2E8E0' },
  buyerTypeChipSelected: { backgroundColor: 'rgba(46,125,50,0.08)', borderColor: '#2E7D32' },
  buyerTypeChipText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  buyerTypeChipTextSelected: { color: '#2E7D32' },

  /* Save */
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    paddingVertical: 18, borderRadius: 20, backgroundColor: '#2E7D32', marginTop: 8,
    shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 24, elevation: 6,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontWeight: '700', fontSize: 17, color: '#FFF' },

  /* Modal */
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
  modalBtnText: { fontWeight: '700', fontSize: 14, color: '#FFF' },
  modalBtnOutline: { paddingVertical: 14, borderRadius: 16, borderWidth: 1.5, borderColor: '#E2E8E0', alignItems: 'center' },
  modalBtnOutlineText: { fontWeight: '600', fontSize: 14, color: '#1B1B1B' },
})
