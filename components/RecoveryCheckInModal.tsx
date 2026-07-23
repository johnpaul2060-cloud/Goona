import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  View, Text, TouchableOpacity, TextInput,
  StyleSheet, Platform, Keyboard, ScrollView,
} from 'react-native'
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
} from 'react-native-reanimated'
import { usePlanStore } from '../store/usePlanStore'
import GoonaIcon from './ui/GoonaIcon'
import { Icons } from '../shared/icons'
import { formatInput, parseAmount } from '../utils/format'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

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
  const plans = usePlanStore((s) => s.plans)
  const recordContribution = usePlanStore((s) => s.recordContribution)
  const activePlans = useMemo(() => plans.filter((p) => p.status === 'active'), [plans])

  const dateStr = date ? fmtDate(date) : ''

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
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
    if (visible) {
      setSelectedPlanId(activePlans.length === 1 ? activePlans[0].id : null)
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
    if (!dateStr) return
    Keyboard.dismiss()
    if (selectedPlanId && amountRaw) {
      const parsedAmount = parseAmount(amountRaw)
      if (parsedAmount > 0) {
        recordContribution(selectedPlanId, parsedAmount)
      }
    }
    onClose()
  }, [selectedPlanId, dateStr, amountRaw, recordContribution, onClose])

  if (!isVisible) return null

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
          Record a contribution for this day.
        </Text>

        {date && (
          <View style={styles.dateBadge}>
            <Text style={styles.dateBadgeText}>
              {MONTHS[date.getMonth()]} {date.getDate()}, {date.getFullYear()}
            </Text>
          </View>
        )}

        {activePlans.length === 0 ? (
          <View style={styles.noPlansBanner}>
            <GoonaIcon icon={Icons.target} size={20} color="#94A3B8" />
            <Text style={styles.noPlansText}>No active plans. Create a plan first.</Text>
          </View>
        ) : (
          <>
            {activePlans.length > 1 && (
              <>
                <Text style={styles.sectionLabel}>Select Plan</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.planScroll}>
                  {activePlans.map((p) => {
                    const active = selectedPlanId === p.id
                    return (
                      <TouchableOpacity
                        key={p.id}
                        activeOpacity={0.8}
                        onPress={() => setSelectedPlanId(p.id)}
                        style={[styles.planChip, active && styles.planChipActive]}
                      >
                        <Text style={styles.planChipIcon}>{p.icon || '\u{1F4B0}'}</Text>
                        <Text style={[styles.planChipLabel, active && styles.planChipLabelActive]}>{p.name}</Text>
                      </TouchableOpacity>
                    )
                  })}
                </ScrollView>
              </>
            )}
            {activePlans.length === 1 && (
              <View style={styles.singlePlanRow}>
                <Text style={styles.singlePlanIcon}>{activePlans[0].icon || '\u{1F4B0}'}</Text>
                <Text style={styles.singlePlanName}>{activePlans[0].name}</Text>
              </View>
            )}

            <View style={styles.amountSection}>
              <Text style={styles.amountLabel}>Contribution Amount</Text>
              <View style={styles.amountInputRow}>
                <Text style={styles.amountPrefix}>{'\u20A6'}</Text>
                <TextInput
                  style={styles.amountInput}
                  value={amountDisplay}
                  onChangeText={(v) => setAmountRaw(v.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#CBD5E1"
                />
              </View>
            </View>
          </>
        )}

        <TouchableOpacity
          style={[styles.confirmBtn, (!selectedPlanId || !amountRaw) && styles.confirmBtnDisabled]}
          activeOpacity={0.85}
          onPress={handleConfirm}
          disabled={!selectedPlanId || !amountRaw}
        >
          <Text style={[styles.confirmBtnText, (!selectedPlanId || !amountRaw) && styles.confirmBtnTextDisabled]}>
            {selectedPlanId && amountRaw ? 'Record Contribution' : 'Enter amount to contribute'}
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

  noPlansBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F1F5F9', borderRadius: 14,
    padding: 16, marginTop: 16,
  },
  noPlansText: { fontSize: 13, fontWeight: '600', color: '#94A3B8', flex: 1 },

  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#1F2937', marginTop: 16, marginBottom: 10 },
  planScroll: { marginBottom: 4 },
  planChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: 100, backgroundColor: '#F1F5F9',
    marginRight: 8, borderWidth: 1.5, borderColor: 'transparent',
  },
  planChipActive: { backgroundColor: '#F0FDF4', borderColor: '#2E7D32' },
  planChipIcon: { fontSize: 16 },
  planChipLabel: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  planChipLabelActive: { color: '#2E7D32' },
  singlePlanRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F0FDF4', borderRadius: 14,
    padding: 14, marginTop: 14,
    borderWidth: 1, borderColor: '#D4EDDA',
  },
  singlePlanIcon: { fontSize: 20 },
  singlePlanName: { fontSize: 15, fontWeight: '700', color: '#1F2937' },

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
