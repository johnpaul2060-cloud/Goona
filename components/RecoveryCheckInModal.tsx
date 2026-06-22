import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, Pressable, TextInput,
  StyleSheet, Platform, Keyboard,
} from 'react-native'
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
} from 'react-native-reanimated'
import { useRecoveryStore, CheckInStatus } from '../store/useRecoveryStore'
import GoonaIcon from './ui/GoonaIcon'
import { Icons } from '../shared/icons'
import { formatInput, parseAmount } from '../utils/format'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

type ActiveStatus = Exclude<CheckInStatus, 'none'>

const STATUS_CONFIG: { key: ActiveStatus; label: string; description: string; icon: any }[] = [
  { key: 'completed', label: 'Completed', description: 'You met your recovery target', icon: Icons.check },
  { key: 'partial', label: 'Partial', description: 'You recovered some of the target', icon: Icons.minus },
  { key: 'missed', label: 'Missed', description: 'You skipped this period', icon: Icons.x },
  { key: 'exceeded', label: 'Exceeded', description: 'You recovered more than planned', icon: Icons.star },
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
  const [amountRaw, setAmountRaw] = useState('')
  const [isVisible, setIsVisible] = useState(false)
  const amountDisplay = formatInput(amountRaw)

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
      setAmountRaw(currentRecord.amount ? String(currentRecord.amount) : '')
    } else if (visible) {
      setSelectedStatus(null)
      setAmountRaw('')
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
    const parsedAmount = amountRaw ? parseAmount(amountRaw) : undefined
    checkIn(dateStr, selectedStatus, parsedAmount)
    Keyboard.dismiss()
    onClose()
  }, [selectedStatus, dateStr, amountRaw, checkIn, onClose])

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

  const statusColor = (key: ActiveStatus) => {
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
              <GoonaIcon icon={Icons.circleCheck} size={20} color="#2E7D32" />
            </View>
            <Text style={styles.sheetTitle}>Recovery Check-in</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.sheetCloseBtn} activeOpacity={0.7}>
            <GoonaIcon icon={Icons.x} size={20} color="#94A3B8" />
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
                  <GoonaIcon icon={IconComp} size={18} color={statusColor(opt.key)} strokeWidth={1.5} />
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
                  {active && <GoonaIcon icon={Icons.check} size={10} color="white" strokeWidth={3} />}
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
              value={amountDisplay}
              onChangeText={(v) => setAmountRaw(v.replace(/[^0-9]/g, ''))}
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
  sheetTitleIcon: { width: 20, height: 20 },
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
