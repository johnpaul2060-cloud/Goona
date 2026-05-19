import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, Pressable, TextInput,
  StyleSheet, Platform, Keyboard,
} from 'react-native'
import Svg, { Path, Circle } from 'react-native-svg'
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
} from 'react-native-reanimated'
import { useRecoveryStore, CheckInStatus } from '../store/useRecoveryStore'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

type ActiveStatus = Exclude<CheckInStatus, 'none'>

function CheckIcon() {
  return (
    <Svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <Circle cx="9" cy="9" r="7" stroke="#2E7D32" strokeWidth="1.5" fill="rgba(46,125,50,0.08)" />
      <Path d="M6 9L8 11L12 7" stroke="#2E7D32" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

function XIcon() {
  return (
    <Svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <Circle cx="9" cy="9" r="7" stroke="#EF4444" strokeWidth="1.5" fill="rgba(239,68,68,0.08)" />
      <Path d="M6.5 6.5L11.5 11.5" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M11.5 6.5L6.5 11.5" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  )
}

function HalfIcon() {
  return (
    <Svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <Circle cx="9" cy="9" r="7" stroke="#F59E0B" strokeWidth="1.5" fill="rgba(245,158,11,0.08)" />
      <Circle cx="9" cy="9" r="7" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="22 22" />
    </Svg>
  )
}

function StarIcon() {
  return (
    <Svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <Circle cx="9" cy="9" r="7" stroke="#AEEA00" strokeWidth="1.5" fill="rgba(174,234,0,0.08)" />
      <Path d="M9 4L10.5 7.5L14 8L11.5 10.5L12 14L9 12L6 14L6.5 10.5L4 8L7.5 7.5L9 4Z" stroke="#AEEA00" strokeWidth="1.2" strokeLinejoin="round" />
    </Svg>
  )
}

function CloseIcon() {
  return (
    <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <Path d="M7 7L13 13" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M13 7L7 13" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  )
}

const STATUS_CONFIG: { key: ActiveStatus; label: string; description: string; icon: React.FC }[] = [
  { key: 'completed', label: 'Completed', description: 'You met your recovery target', icon: CheckIcon },
  { key: 'partial', label: 'Partial', description: 'You recovered some of the target', icon: HalfIcon },
  { key: 'missed', label: 'Missed', description: 'You skipped this period', icon: XIcon },
  { key: 'exceeded', label: 'Exceeded', description: 'You recovered more than planned', icon: StarIcon },
]

function fmtDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function RecoveryCheckInModal({
  visible, date, onClose,
}: {
  visible: boolean
  date: Date | null
  onClose: () => void
}) {
  const records = useRecoveryStore((s) => s.records)
  const checkIn = useRecoveryStore((s) => s.checkIn)

  const dateStr = date ? fmtDate(date) : ''
  const currentRecord = dateStr ? records[dateStr] : undefined

  const [selectedStatus, setSelectedStatus] = useState<ActiveStatus | null>(null)
  const [amount, setAmount] = useState('')
  const [isVisible, setIsVisible] = useState(false)

  const translateY = useSharedValue(600)
  const backdropOpacity = useSharedValue(0)

  useEffect(() => {
    if (visible) {
      setIsVisible(true)
      translateY.value = withSpring(0, { damping: 28, stiffness: 200 })
      backdropOpacity.value = withTiming(1, { duration: 250 })
    } else {
      translateY.value = withTiming(600, { duration: 220 })
      backdropOpacity.value = withTiming(0, { duration: 200 })
      setTimeout(() => setIsVisible(false), 250)
    }
  }, [visible])

  useEffect(() => {
    if (visible && currentRecord) {
      setSelectedStatus(currentRecord.status as ActiveStatus)
      setAmount(currentRecord.amount ? String(currentRecord.amount) : '')
    } else if (visible) {
      setSelectedStatus(null)
      setAmount('')
    }
  }, [visible, dateStr])

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }))

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }))

  const handleConfirm = useCallback(() => {
    if (!selectedStatus || !dateStr) return
    const parsedAmount = amount ? parseFloat(amount.replace(/,/g, '')) : undefined
    checkIn(dateStr, selectedStatus, parsedAmount)
    Keyboard.dismiss()
    onClose()
  }, [selectedStatus, dateStr, amount, checkIn, onClose])

  if (!isVisible) return null

  const selectedBg = (key: ActiveStatus) => {
    switch (key) {
      case 'completed': return 'rgba(46,125,50,0.08)'
      case 'partial': return 'rgba(245,158,11,0.08)'
      case 'missed': return 'rgba(239,68,68,0.08)'
      case 'exceeded': return 'rgba(174,234,0,0.12)'
    }
  }

  const selectedBorder = (key: ActiveStatus) => {
    switch (key) {
      case 'completed': return '#2E7D32'
      case 'partial': return '#F59E0B'
      case 'missed': return '#EF4444'
      case 'exceeded': return '#AEEA00'
    }
  }

  return (
    <View style={styles.overlay}>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[styles.sheet, sheetStyle]}>
        <View style={styles.sheetHandle} />

        <View style={styles.sheetHeader}>
          <View style={styles.sheetTitleRow}>
            <View style={styles.sheetTitleIcon}>
              <Circle cx="10" cy="10" r="10" fill="#F0FDF4" />
              <Path d="M7 10L9 12L13 8" stroke="#2E7D32" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" transform="translate(-3,-3)" />
            </View>
            <Text style={styles.sheetTitle}>Recovery Check-in</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.sheetCloseBtn} activeOpacity={0.7}>
            <CloseIcon />
          </TouchableOpacity>
        </View>

        <Text style={styles.sheetSub}>
          Did you complete your recovery target for this period?
        </Text>

        {date && (
          <View style={styles.dateBadge}>
            <Text style={styles.dateBadgeText}>
              {MONTHS[date.getMonth()]} {date.getDate()}, {date.getFullYear()}
            </Text>
          </View>
        )}

        <View style={styles.optionsGroup}>
          {STATUS_CONFIG.map((opt) => {
            const active = selectedStatus === opt.key
            const IconComp = opt.icon
            return (
              <Pressable
                key={opt.key}
                onPress={() => setSelectedStatus(opt.key)}
                style={[
                  styles.optionRow,
                  active && {
                    backgroundColor: selectedBg(opt.key),
                    borderColor: selectedBorder(opt.key),
                  },
                ]}
              >
                <View style={[styles.optionIcon, active && { opacity: 1 }]}>
                  <IconComp />
                </View>
                <View style={styles.optionContent}>
                  <Text style={[styles.optionLabel, active && { color: selectedBorder(opt.key) }]}>
                    {opt.label}
                  </Text>
                  <Text style={styles.optionDesc}>{opt.description}</Text>
                </View>
                <View style={[
                  styles.optionRadio,
                  active && { borderColor: selectedBorder(opt.key), backgroundColor: selectedBorder(opt.key) },
                ]}>
                  {active && (
                    <Path d="M4 7L6 9L10 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  )}
                </View>
              </Pressable>
            )
          })}
        </View>

        <View style={styles.amountSection}>
          <Text style={styles.amountLabel}>Amount Recovered</Text>
          <View style={styles.amountInputRow}>
            <Text style={styles.amountPrefix}>₦</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#CBD5E1"
            />
          </View>
          <Text style={styles.amountHint}>Optional — helps track recovery accuracy</Text>
        </View>

        <TouchableOpacity
          style={[styles.confirmBtn, !selectedStatus && styles.confirmBtnDisabled]}
          activeOpacity={0.85}
          onPress={handleConfirm}
          disabled={!selectedStatus}
        >
          <Text style={[styles.confirmBtnText, !selectedStatus && styles.confirmBtnTextDisabled]}>
            Confirm Check-in
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingHorizontal: 24,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.08,
    shadowRadius: 32,
    elevation: 12,
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center', marginTop: 10, marginBottom: 6,
  },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: 8,
  },
  sheetTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sheetTitleIcon: { width: 10, height: 10 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: '#1B1B1B' },
  sheetCloseBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center',
  },
  sheetSub: {
    fontSize: 13, color: '#94A3B8', lineHeight: 19,
    marginTop: 8,
  },
  dateBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0FDF4', borderRadius: 100,
    paddingVertical: 5, paddingHorizontal: 14, marginTop: 14,
  },
  dateBadgeText: { fontSize: 12, fontWeight: '600', color: '#2E7D32' },

  optionsGroup: { marginTop: 18, gap: 8 },
  optionRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#F8FAF7',
    borderWidth: 1, borderColor: 'transparent',
  },
  optionIcon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', opacity: 0.7 },
  optionContent: { flex: 1, marginLeft: 10 },
  optionLabel: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  optionDesc: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
  optionRadio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: '#D1D5DB',
    alignItems: 'center', justifyContent: 'center',
  },

  amountSection: { marginTop: 20 },
  amountLabel: { fontSize: 13, fontWeight: '600', color: '#1F2937' },
  amountInputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8FAF7', borderRadius: 14,
    paddingHorizontal: 14, height: 48, marginTop: 8,
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  amountPrefix: { fontSize: 18, fontWeight: '700', color: '#94A3B8', marginRight: 8 },
  amountInput: { flex: 1, fontSize: 17, fontWeight: '700', color: '#1F2937' },
  amountHint: { fontSize: 11, color: '#CBD5E1', marginTop: 4 },

  confirmBtn: {
    height: 52, borderRadius: 16,
    backgroundColor: '#2E7D32', alignItems: 'center', justifyContent: 'center',
    marginTop: 22,
    shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, shadowRadius: 20, elevation: 4,
  },
  confirmBtnDisabled: { backgroundColor: '#E2E8F0', shadowOpacity: 0 },
  confirmBtnText: { fontSize: 16, fontWeight: '700', color: 'white' },
  confirmBtnTextDisabled: { color: '#94A3B8' },
})
