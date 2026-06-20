import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, TextInput, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from 'react-native'
import Svg, { Path, Circle, Rect, Line, Ellipse } from 'react-native-svg'
import { ArrowLeft, CheckCircle, TrendingUp } from 'lucide-react-native'
import GoonaIcon from '../components/ui/GoonaIcon'
import { StatusBar } from 'expo-status-bar'
import { router } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  FadeInUp, FadeIn,
} from 'react-native-reanimated'
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'
import { useBatchStore } from '../store/useBatchStore'
import { formatInput, parseAmount } from '../utils/format'

function usePressScale() {
  const scale = useSharedValue(1)
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
  return {
    style,
    onPressIn: () => { scale.value = withSpring(0.96, { damping: 15, stiffness: 200 }) },
    onPressOut: () => { scale.value = withSpring(1, { damping: 15, stiffness: 200 }) },
  }
}

const LIVESTOCK_TYPES = ['Broilers', 'Layers', 'Fish Farming', 'Goat/Sheep', 'Piggery', 'Mixed Farming'] as const

const DURATION_OPTIONS = ['4 Weeks', '6 Weeks', '8 Weeks', 'Custom'] as const

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatDate(d: Date): string {
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear()
  return `${day} / ${month} / ${year}`
}

function parseNumeric(val: string): number {
  return parseAmount(val)
}

function LivestockIcon({ type, selected }: { type: string; selected: boolean }) {
  const c = selected ? 'white' : '#1B1B1B'
  const opacity = selected ? 1 : 0.3
  switch (type) {
    case 'Broilers':
      return (
        <Svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <Ellipse cx="14" cy="18" rx="7" ry="5" fill={selected ? 'rgba(255,255,255,0.15)' : '#D4C9B8'} fillOpacity={opacity} />
          <Circle cx="14" cy="13" r="4" fill={selected ? 'rgba(255,255,255,0.15)' : '#D4C9B8'} fillOpacity={opacity} />
          <Circle cx="14" cy="12.5" r="1" fill={c} />
          <Path d="M13 10L15 9" stroke="#F9A825" strokeWidth="1.2" strokeLinecap="round" />
        </Svg>
      )
    case 'Layers':
      return (
        <Svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <Ellipse cx="14" cy="18" rx="7" ry="5" fill={selected ? 'rgba(255,255,255,0.15)' : '#D4C9B8'} fillOpacity={opacity} />
          <Circle cx="14" cy="13" r="4" fill={selected ? 'rgba(255,255,255,0.15)' : '#D4C9B8'} fillOpacity={opacity} />
          <Circle cx="14" cy="12.5" r="1" fill={c} />
        </Svg>
      )
    case 'Fish Farming':
      return (
        <Svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <Ellipse cx="14" cy="18" rx="6" ry="4" fill="#B8D8E8" fillOpacity={selected ? 0.15 : opacity} />
          <Path d="M10 16L8 15" stroke={c} strokeWidth="1.2" strokeLinecap="round" />
          <Path d="M18 16L20 15" stroke={c} strokeWidth="1.2" strokeLinecap="round" />
        </Svg>
      )
    case 'Goat/Sheep':
      return (
        <Svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <Path d="M10 20C10 20 9 16 14 16C19 16 18 20 18 20" stroke={c} strokeWidth="1.5" fill="none" />
          <Circle cx="14" cy="12" r="4.5" stroke={c} strokeWidth="1.5" fill="none" />
          <Circle cx="12.5" cy="11" r="1" fill={c} />
        </Svg>
      )
    case 'Piggery':
      return (
        <Svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <Ellipse cx="14" cy="18" rx="8" ry="6" fill={selected ? 'rgba(255,255,255,0.15)' : '#E8D5C4'} fillOpacity={opacity} />
          <Ellipse cx="14" cy="18" rx="8" ry="6" stroke={c} strokeWidth="1.3" fill="none" />
          <Circle cx="14" cy="13" r="5" stroke={c} strokeWidth="1.3" fill="none" />
          <Circle cx="12.5" cy="12" r="0.8" fill={c} />
          <Circle cx="15.5" cy="12" r="0.8" fill={c} />
        </Svg>
      )
    case 'Mixed Farming':
      return (
        <Svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <Ellipse cx="14" cy="18" rx="9" ry="6" fill={selected ? 'rgba(255,255,255,0.15)' : '#E8F5E9'} fillOpacity={opacity} />
          <Path d="M8 14C10 12 12 14 14 12C16 14 18 12 20 14" stroke={c} strokeWidth="1.2" fill="none" />
          <Circle cx="10" cy="16" r="1.5" fill="#F5F5F0" stroke="#D4C9B8" strokeWidth="0.6" />
          <Circle cx="18" cy="16" r="1.5" fill="#F5F5F0" stroke="#D4C9B8" strokeWidth="0.6" />
        </Svg>
      )
    default:
      return null
  }
}

export default function CreateBatchScreen() {
  const [batchName, setBatchName] = useState('')
  const [livestockType, setLivestockType] = useState<string>('Broilers')
  const [quantity, setQuantity] = useState(500)
  const [purchaseCost, setPurchaseCost] = useState('')
  const [feedCost, setFeedCost] = useState('')
  const [medicationCost, setMedicationCost] = useState('')
  const [startDate, setStartDate] = useState(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [duration, setDuration] = useState('6 Weeks')
  const [showSuccess, setShowSuccess] = useState(false)

  const addBatch = useBatchStore((s) => s.addBatch)

  const pressScale = usePressScale()

  const purchaseVal = parseNumeric(purchaseCost)
  const feedVal = parseNumeric(feedCost)
  const medicationVal = parseNumeric(medicationCost)
  const totalCost = purchaseVal + feedVal + medicationVal
  const expectedRevenue = Math.round(totalCost * 2.12)
  const forecastProfit = expectedRevenue - totalCost
  const reinvestmentGoal = Math.round(forecastProfit * 0.3)

  const onDateChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false)
    if (date) setStartDate(date)
  }

  const handleCreateBatch = () => {
    if (!batchName.trim()) {
      Alert.alert('Required', 'Please enter a batch name.')
      return
    }
    if (!livestockType) {
      Alert.alert('Required', 'Please select a livestock type.')
      return
    }

    addBatch({
      batchName: batchName.trim(),
      livestockType,
      quantity,
      purchaseCost: purchaseVal,
      feedCost: feedVal,
      medicationCost: medicationVal,
      startDate: startDate.toISOString(),
      duration,
    })

    setShowSuccess(true)
    setTimeout(() => {
      setShowSuccess(false)
      router.push('/batches')
    }, 2200)
  }

  const successScale = useSharedValue(0)
  const successOpacity = useSharedValue(0)
  React.useEffect(() => {
    if (showSuccess) {
      successScale.value = withTiming(1, { duration: 400 })
      successOpacity.value = withTiming(1, { duration: 300 })
    } else {
      successScale.value = withTiming(0)
      successOpacity.value = withTiming(0)
    }
  }, [showSuccess])

  const successAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: successScale.value }],
    opacity: successOpacity.value,
  }))

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.blob} pointerEvents="none" />
      <View style={styles.contour1} pointerEvents="none" />
      <View style={styles.contour2} pointerEvents="none" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollInner}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* TOP NAV */}
          <Animated.View entering={FadeInUp.duration(500).springify()} style={styles.topNav}>
            <TouchableOpacity style={styles.navBack} activeOpacity={0.7} onPress={() => router.back()}>
              <GoonaIcon icon={ArrowLeft} size={24} color="#1B1B1B" />
            </TouchableOpacity>
            <Text style={styles.topTitle}>Create New Batch</Text>
            <View style={styles.progressPill}>
              <Text style={styles.progressPillText}>Step 1 of 2</Text>
            </View>
          </Animated.View>

          {/* HEADER */}
          <Animated.View entering={FadeInUp.duration(500).delay(80).springify()} style={styles.headerSection}>
            <Text style={styles.headerLabel}>Production Setup</Text>
            <Text style={styles.headerTitle}>Start a New{'\n'}Livestock Cycle</Text>
            <Text style={styles.headerSub}>Create a new batch to track livestock growth, feeding, expenses, and profitability.</Text>
          </Animated.View>

          {/* ILLUSTRATION */}
          <Animated.View entering={FadeInUp.duration(500).delay(130).springify()} style={styles.illWrap}>
            <View style={styles.illGlow} pointerEvents="none" />
            <Svg width="200" height="100" viewBox="0 0 200 100" fill="none">
              <Rect x="30" y="20" width="50" height="50" rx="10" fill="white" stroke="#E2E8F0" strokeWidth="0.8" />
              <Rect x="40" y="30" width="30" height="8" rx="3" fill="#E8F5E9" />
              <Rect x="40" y="42" width="22" height="4" rx="2" fill="#F1F5F9" />
              <Rect x="40" y="50" width="28" height="4" rx="2" fill="#F1F5F9" />
              <Path d="M95 70C95 70 98 58 104 58C110 58 113 70 113 70H95Z" stroke="#2E7D32" strokeWidth="1" fill="none" opacity="0.4" />
              <Circle cx="104" cy="54" r="5" fill="#F5F5F0" stroke="#D4C9B8" strokeWidth="0.5" opacity="0.5" />
              <Rect x="130" y="30" width="40" height="30" rx="8" fill="white" stroke="#E2E8F0" strokeWidth="0.8" />
              <Rect x="138" y="38" width="24" height="3" rx="1.5" fill="#E8F5E9" />
              <Path d="M138 46L146 50L154 44L162 48" stroke="#2E7D32" strokeWidth="1.2" strokeLinecap="round" fill="none" />
              <Rect x="20" y="72" width="12" height="12" rx="3" fill="#E8F5E9" stroke="#2E7D32" strokeWidth="0.6" />
              <Rect x="56" y="76" width="10" height="8" rx="2" fill="#E8F5E9" stroke="#2E7D32" strokeWidth="0.5" opacity="0.5" />
            </Svg>
            <View style={[styles.illChip, { top: '6%', left: 2 }]}>
              <Svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <Circle cx="5" cy="5" r="3.5" stroke="#16A34A" strokeWidth="1.2" fill="none" />
                <Path d="M3.5 5L4.5 6L7 3.5" stroke="#16A34A" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </Svg>
              <Text style={styles.illChipText}>Batch Active</Text>
            </View>
            <View style={[styles.illChip, { bottom: '4%', left: 14 }]}>
              <Svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <Path d="M2 7C2 5 3 4 5 4C7 4 8 5 8 7" stroke="#2E7D32" strokeWidth="1.2" strokeLinecap="round" />
              </Svg>
              <Text style={styles.illChipText}>Growth Tracking</Text>
            </View>
            <View style={[styles.illChip, { top: '4%', right: 0 }]}>
              <Svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <Path d="M2 8H8" stroke="#2E7D32" strokeWidth="1.2" strokeLinecap="round" />
                <Rect x="3.5" y="5" width="3" height="3" rx="0.8" stroke="#2E7D32" strokeWidth="1" fill="none" />
              </Svg>
              <Text style={styles.illChipText}>Revenue Forecast</Text>
            </View>
          </Animated.View>

          {/* FORM CARD */}
          <Animated.View entering={FadeInUp.duration(500).delay(180).springify()} style={styles.formCard}>
            {/* BATCH NAME */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Batch Name</Text>
              <View style={[styles.fieldWrap, batchName.length > 0 && styles.fieldWrapFocused]}>
                <View style={styles.fieldIco}>
                  <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <Line x1="4" y1="10" x2="16" y2="10" stroke="#A0AEA1" strokeWidth="1.4" strokeLinecap="round" />
                    <Line x1="4" y1="6" x2="11" y2="6" stroke="#A0AEA1" strokeWidth="1.4" strokeLinecap="round" />
                    <Line x1="4" y1="14" x2="13" y2="14" stroke="#A0AEA1" strokeWidth="1.4" strokeLinecap="round" />
                  </Svg>
                </View>
                <View style={styles.fieldInner}>
                  <Text style={styles.fieldLbl}>Batch Name</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={batchName}
                    onChangeText={setBatchName}
                    placeholder="e.g. Broiler Batch A"
                    placeholderTextColor="#A0AEA1"
                  />
                </View>
              </View>
            </View>

            {/* LIVESTOCK TYPE */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Livestock Type</Text>
              <View style={styles.typeGrid}>
                {LIVESTOCK_TYPES.map((type) => {
                  const selected = livestockType === type
                  return (
                    <TouchableOpacity
                      key={type}
                      activeOpacity={0.85}
                      onPress={() => setLivestockType(type)}
                      style={styles.typeCardWrap}
                    >
                      {selected ? (
                        <LinearGradient
                          colors={['#2E7D32', '#43A047']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.typeCardSelected}
                        >
                          <View style={styles.typeIcon}>
                            <LivestockIcon type={type} selected />
                          </View>
                          <Text style={styles.typeNameSelected}>{type}</Text>
                        </LinearGradient>
                      ) : (
                        <View style={styles.typeCard}>
                          <View style={styles.typeIcon}>
                            <LivestockIcon type={type} selected={false} />
                          </View>
                          <Text style={styles.typeName}>{type}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>

            {/* INITIAL QUANTITY */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Initial Livestock Quantity</Text>
              <View style={styles.stepperWrap}>
                <View style={styles.fieldIco}>
                  <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <Ellipse cx="10" cy="13" rx="4" ry="3" stroke="#A0AEA1" strokeWidth="1.4" fill="none" />
                    <Circle cx="10" cy="8" r="3" stroke="#A0AEA1" strokeWidth="1.4" fill="none" />
                  </Svg>
                </View>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  activeOpacity={0.85}
                  onPress={() => setQuantity(Math.max(10, quantity - 50))}
                >
                  <Text style={styles.stepperBtnText}>−</Text>
                </TouchableOpacity>
                <Animated.Text
                  key={quantity}
                  entering={FadeIn.duration(150)}
                  style={styles.stepperVal}
                >
                  {quantity}
                </Animated.Text>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  activeOpacity={0.85}
                  onPress={() => setQuantity(Math.min(100000, quantity + 50))}
                >
                  <Text style={styles.stepperBtnText}>+</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.formNote}>Estimated mortality projections will be based on this quantity.</Text>
            </View>

            {/* PURCHASE COST */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Initial Purchase Cost</Text>
              <View style={styles.fieldWrap}>
                <View style={styles.fieldIco}>
                  <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <Circle cx="10" cy="10" r="6" stroke="#A0AEA1" strokeWidth="1.4" fill="none" />
                    <Line x1="10" y1="7" x2="10" y2="13" stroke="#A0AEA1" strokeWidth="1.3" strokeLinecap="round" />
                    <Line x1="7" y1="10" x2="13" y2="10" stroke="#A0AEA1" strokeWidth="1.3" strokeLinecap="round" />
                  </Svg>
                </View>
                <Text style={styles.fieldPrefix}>₦</Text>
                <View style={styles.fieldInner}>
                  <Text style={styles.fieldLbl}>Purchase Cost</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={formatInput(purchaseCost)}
                    onChangeText={(v) => setPurchaseCost(v.replace(/\D/g, ''))}
                    placeholder="0.00"
                    placeholderTextColor="#A0AEA1"
                    keyboardType="number-pad"
                  />
                </View>
              </View>
              <Text style={styles.formNote}>Used for profitability and reinvestment calculations.</Text>
            </View>

            {/* FEED COST */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Estimated Feed Cost</Text>
              <View style={styles.fieldWrap}>
                <View style={styles.fieldIco}>
                  <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <Rect x="4" y="5" width="12" height="10" rx="2" stroke="#A0AEA1" strokeWidth="1.4" fill="none" />
                    <Path d="M7 5V4C7 3 8 2.5 10 2.5C12 2.5 13 3 13 4V5" stroke="#A0AEA1" strokeWidth="1.4" fill="none" />
                  </Svg>
                </View>
                <Text style={styles.fieldPrefix}>₦</Text>
                <View style={styles.fieldInner}>
                  <Text style={styles.fieldLbl}>Feed Cost</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={formatInput(feedCost)}
                    onChangeText={(v) => setFeedCost(v.replace(/\D/g, ''))}
                    placeholder="0.00"
                    placeholderTextColor="#A0AEA1"
                    keyboardType="number-pad"
                  />
                </View>
              </View>
            </View>

            {/* MEDICATION COST */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Estimated Medication Cost</Text>
              <View style={styles.fieldWrap}>
                <View style={styles.fieldIco}>
                  <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <Rect x="7" y="3" width="6" height="14" rx="2" stroke="#A0AEA1" strokeWidth="1.4" fill="none" />
                    <Line x1="7" y1="7" x2="13" y2="7" stroke="#A0AEA1" strokeWidth="1.2" strokeLinecap="round" />
                  </Svg>
                </View>
                <Text style={styles.fieldPrefix}>₦</Text>
                <View style={styles.fieldInner}>
                  <Text style={styles.fieldLbl}>Medication Cost</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={formatInput(medicationCost)}
                    onChangeText={(v) => setMedicationCost(v.replace(/\D/g, ''))}
                    placeholder="0.00"
                    placeholderTextColor="#A0AEA1"
                    keyboardType="number-pad"
                  />
                </View>
              </View>
            </View>

            {/* START DATE */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Production Start Date</Text>
              <TouchableOpacity
                style={styles.fieldWrap}
                activeOpacity={0.85}
                onPress={() => setShowDatePicker(true)}
              >
                <View style={styles.fieldIco}>
                  <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <Rect x="3" y="4" width="14" height="13" rx="2" stroke="#A0AEA1" strokeWidth="1.4" fill="none" />
                    <Line x1="3" y1="8" x2="17" y2="8" stroke="#A0AEA1" strokeWidth="1.2" />
                    <Line x1="7" y1="2" x2="7" y2="5" stroke="#A0AEA1" strokeWidth="1.2" strokeLinecap="round" />
                    <Line x1="13" y1="2" x2="13" y2="5" stroke="#A0AEA1" strokeWidth="1.2" strokeLinecap="round" />
                  </Svg>
                </View>
                <View style={styles.fieldInner}>
                  <Text style={styles.fieldLbl}>Start Date</Text>
                  <Text style={styles.fieldInputText}>{formatDate(startDate)}</Text>
                </View>
                <View style={styles.fieldRight}>
                  <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <Path d="M4 6L8 10L12 6" stroke="#A0AEA1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                </View>
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <View style={styles.datePickerWrap}>
                <DateTimePicker
                  value={startDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onDateChange}
                  themeVariant="light"
                />
                {Platform.OS === 'ios' && (
                  <TouchableOpacity
                    style={styles.dateDoneBtn}
                    activeOpacity={0.85}
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Text style={styles.dateDoneText}>Done</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* DURATION */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Expected Production Duration</Text>
              <View style={styles.durationRow}>
                {DURATION_OPTIONS.map((opt) => {
                  const selected = duration === opt
                  return (
                    <TouchableOpacity
                      key={opt}
                      activeOpacity={0.85}
                      onPress={() => setDuration(opt)}
                      style={styles.durationPillWrap}
                    >
                      {selected ? (
                        <LinearGradient
                          colors={['#2E7D32', '#43A047']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.durationPillSelected}
                        >
                          <Text style={styles.durationPillSelectedText}>{opt}</Text>
                        </LinearGradient>
                      ) : (
                        <View style={styles.durationPill}>
                          <Text style={styles.durationPillText}>{opt}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>

            {/* FORECAST CARD */}
            <Animated.View entering={FadeInUp.duration(500).delay(300).springify()} style={styles.forecastCard}>
              <View style={styles.forecastHead}>
                <Text style={styles.forecastTitle}>Projected Production Summary</Text>
                <View style={styles.forecastIcon}>
                  <GoonaIcon icon={TrendingUp} size={18} color="#16A34A" />
                </View>
              </View>
              <View style={styles.forecastGrid}>
                <View>
                  <Text style={styles.forecastLbl}>Est. Total Cost</Text>
                  <Text style={styles.forecastVal}>₦{totalCost.toLocaleString('en-NG')}</Text>
                </View>
                <View>
                  <Text style={styles.forecastLbl}>Expected Revenue</Text>
                  <Text style={styles.forecastVal}>₦{expectedRevenue.toLocaleString('en-NG')}</Text>
                </View>
                <View>
                  <Text style={styles.forecastLbl}>Forecast Profit</Text>
                  <Text style={[styles.forecastVal, { color: '#16A34A' }]}>₦{forecastProfit.toLocaleString('en-NG')}</Text>
                </View>
                <View>
                  <Text style={styles.forecastLbl}>Reinvestment Goal</Text>
                  <Text style={[styles.forecastVal, { color: '#2E7D32' }]}>₦{reinvestmentGoal.toLocaleString('en-NG')}</Text>
                </View>
              </View>
            </Animated.View>

            {/* OFFLINE CHIP */}
            <Animated.View entering={FadeInUp.duration(500).delay(400).springify()} style={styles.offlineChip}>
              <GoonaIcon icon={CheckCircle} size={14} color="#2E7D32" />
              <Text style={styles.offlineText}>Offline Sync Ready</Text>
            </Animated.View>

            {/* CTA */}
            <Animated.View entering={FadeInUp.duration(500).delay(450).springify()}>
              <TouchableOpacity
                style={styles.primaryBtn}
                activeOpacity={0.9}
                onPress={handleCreateBatch}
              >
                <GoonaIcon icon={CheckCircle} size={20} color="white" />
                <Text style={styles.primaryBtnText}>Create Batch</Text>
              </TouchableOpacity>
            </Animated.View>

            <Text style={styles.footerNote}>GOONA automatically tracks this batch's performance and reinvestment cycle.</Text>

          </Animated.View>

          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* SUCCESS OVERLAY */}
      {showSuccess && (
        <Animated.View style={[styles.successOverlay, successAnimStyle]}>
          <View style={styles.successCard}>
            <View style={styles.successIconCircle}>
              <GoonaIcon icon={CheckCircle} size={28} color="white" />
            </View>
            <Text style={styles.successTitle}>Batch created successfully</Text>
            <Text style={styles.successSub}>Opening Batch Manager...</Text>
          </View>
        </Animated.View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAF7' },

  /* bg */
  blob: {
    position: 'absolute', top: -50, right: -50, width: 300, height: 300,
    borderRadius: 150, backgroundColor: 'rgba(232,245,233,0.35)', zIndex: 0,
  },
  contour1: {
    position: 'absolute', width: 350, height: 110, top: '8%', left: '-10%',
    borderWidth: 1, borderColor: '#2E7D32', borderBottomWidth: 0,
    borderTopLeftRadius: 175, borderTopRightRadius: 175, opacity: 0.05,
    transform: [{ rotate: '6deg' }], zIndex: 0,
  },
  contour2: {
    position: 'absolute', width: 280, height: 90, bottom: '15%', right: '-10%',
    borderWidth: 1, borderColor: '#2E7D32', borderTopWidth: 0,
    borderBottomLeftRadius: 140, borderBottomRightRadius: 140, opacity: 0.05,
    transform: [{ rotate: '-8deg' }], zIndex: 0,
  },

  /* scroll */
  scroll: { flex: 1, zIndex: 1 },
  scrollInner: { paddingHorizontal: 24, paddingTop: 0 },

  /* top nav */
  topNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 58 },
  navBack: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  topTitle: { fontFamily: 'Poppins', fontWeight: '700', fontSize: 20, color: '#1B1B1B' },
  progressPill: { backgroundColor: '#E8F5E9', borderRadius: 100, paddingHorizontal: 12, paddingVertical: 5 },
  progressPillText: { fontSize: 12, fontWeight: '600', color: '#2E7D32' },

  /* header */
  headerSection: { marginTop: 20 },
  headerLabel: { fontSize: 11, fontWeight: '600', color: '#2E7D32', letterSpacing: 2, textTransform: 'uppercase' },
  headerTitle: { fontFamily: 'Poppins', fontWeight: '800', fontSize: 32, lineHeight: 40, color: '#1B1B1B', marginTop: 6 },
  headerSub: { fontSize: 15, lineHeight: 24, color: '#616161', marginTop: 8, maxWidth: 330 },

  /* illustration */
  illWrap: { alignItems: 'center', marginTop: 18, position: 'relative', minHeight: 110 },
  illGlow: {
    position: 'absolute', top: '50%', left: '50%', width: 160, height: 160,
    transform: [{ translateX: -80 }, { translateY: -80 }], borderRadius: 80,
    backgroundColor: 'rgba(232,245,233,0.50)', zIndex: 0,
  },
  illChip: {
    position: 'absolute', backgroundColor: 'white', borderRadius: 100, paddingHorizontal: 12,
    paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 14, elevation: 3,
  },
  illChipText: { fontSize: 10, fontWeight: '500', color: '#475569' },

  /* form card */
  formCard: {
    backgroundColor: 'white', borderRadius: 30, padding: 24, marginTop: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 15 }, shadowOpacity: 0.06, shadowRadius: 40, elevation: 4,
  },
  formSection: { marginBottom: 20 },
  formLabel: { fontSize: 14, fontWeight: '600', color: '#1F2937', marginBottom: 8 },
  formNote: { fontSize: 12, fontWeight: '400', color: '#94A3B8', marginTop: 6, lineHeight: 18 },

  /* field */
  fieldWrap: {
    flexDirection: 'row', alignItems: 'center', height: 58, borderRadius: 18,
    backgroundColor: '#F8FAF7', borderWidth: 1.5, borderColor: '#E2E8F0',
    paddingHorizontal: 16, gap: 12,
  },
  fieldWrapFocused: { borderColor: '#2E7D32' },
  fieldIco: { width: 20, height: 20, flexShrink: 0, alignItems: 'center', justifyContent: 'center' },
  fieldInner: { flex: 1, justifyContent: 'center', minWidth: 0 },
  fieldLbl: { fontSize: 10, fontWeight: '500', color: '#A0AEA1', marginBottom: 1 },
  fieldInput: { fontSize: 15, fontWeight: '500', color: '#1B1B1B', padding: 0, margin: 0, fontFamily: 'Inter' },
  fieldInputText: { fontSize: 15, fontWeight: '500', color: '#1B1B1B' },
  fieldPrefix: { fontSize: 16, fontWeight: '600', color: '#1B1B1B', flexShrink: 0 },
  fieldRight: { flexShrink: 0, alignItems: 'center', justifyContent: 'center' },

  /* type grid */
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  typeCardWrap: { width: '48%' },
  typeCard: {
    borderRadius: 20, borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: 'white',
    paddingVertical: 16, paddingHorizontal: 8, alignItems: 'center', gap: 8,
  },
  typeCardSelected: {
    borderRadius: 20, paddingVertical: 16, paddingHorizontal: 8, alignItems: 'center', gap: 8,
    shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 24, elevation: 6,
  },
  typeIcon: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  typeName: { fontSize: 13, fontWeight: '600', color: '#1F2937', textAlign: 'center' },
  typeNameSelected: { fontSize: 13, fontWeight: '600', color: 'white', textAlign: 'center' },

  /* stepper */
  stepperWrap: {
    flexDirection: 'row', alignItems: 'center', height: 58, borderRadius: 18,
    backgroundColor: '#F8FAF7', borderWidth: 1.5, borderColor: '#E2E8F0',
    paddingHorizontal: 6, gap: 6,
  },
  stepperBtn: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: 'white',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  stepperBtnText: { fontSize: 20, fontWeight: '500', color: '#1B1B1B' },
  stepperVal: {
    flex: 1, textAlign: 'center', fontSize: 22, fontWeight: '700', color: '#1B1B1B',
  },

  /* duration pills */
  durationRow: { flexDirection: 'row', gap: 10 },
  durationPillWrap: { flex: 1 },
  durationPill: {
    height: 50, borderRadius: 14, borderWidth: 1.5, borderColor: '#E2E8F0',
    backgroundColor: 'white', alignItems: 'center', justifyContent: 'center',
  },
  durationPillText: { fontSize: 14, fontWeight: '500', color: '#1F2937' },
  durationPillSelected: {
    height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 4,
  },
  durationPillSelectedText: { fontSize: 14, fontWeight: '500', color: 'white' },

  /* forecast card */
  forecastCard: {
    backgroundColor: '#E8F5E9', borderRadius: 24, padding: 20, marginTop: 4,
    shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 20, elevation: 1,
  },
  forecastHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  forecastTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  forecastIcon: {
    width: 36, height: 36, borderRadius: 12, backgroundColor: 'white',
    alignItems: 'center', justifyContent: 'center',
  },
  forecastGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 16 },
  forecastLbl: { fontSize: 11, color: '#64748B' },
  forecastVal: { fontSize: 17, fontWeight: '800', color: '#1F2937', marginTop: 1 },

  /* offline chip */
  offlineChip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16 },
  offlineText: { fontSize: 12, fontWeight: '500', color: '#94A3B8' },

  /* primary btn */
  primaryBtn: {
    width: '100%', height: 58, borderRadius: 20,
    backgroundColor: '#2E7D32',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 18,
    shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.3, shadowRadius: 35, elevation: 6,
  },
  primaryBtnText: { fontWeight: '600', fontSize: 16, color: 'white' },

  /* footer */
  footerNote: { textAlign: 'center', fontSize: 12, color: '#A0AEA1', marginTop: 14, paddingBottom: 20 },

  /* date picker */
  datePickerWrap: { backgroundColor: 'white', borderRadius: 24, marginTop: 8, paddingTop: 8, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 2 },
  dateDoneBtn: { height: 48, alignItems: 'center', justifyContent: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9', marginHorizontal: 16 },
  dateDoneText: { fontSize: 15, fontWeight: '600', color: '#2E7D32' },

  /* success overlay */
  successOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.25)', zIndex: 50,
    alignItems: 'center', justifyContent: 'center',
  },
  successCard: {
    backgroundColor: 'white', borderRadius: 32, paddingVertical: 32, paddingHorizontal: 36,
    alignItems: 'center', gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.12, shadowRadius: 50, elevation: 10,
  },
  successIconCircle: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: '#2E7D32',
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  successTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  successSub: { fontSize: 13, color: '#94A3B8' },
})
