import React, { useState, useMemo, useCallback, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, TextInput, StyleSheet, Keyboard,
} from 'react-native'
import Animated, {
  FadeInUp, Layout, useSharedValue, useAnimatedStyle, withTiming, Easing,
} from 'react-native-reanimated'
import GoonaIcon from './ui/GoonaIcon'
import { Icons } from '../shared/icons'
import { formatInput, parseAmount, formatNaira } from '../utils/format'
import { OPERATING_BUDGET_CATEGORIES } from '../shared/expense-categories'
import {
  smartAllocationPercents, smartAllocationAmounts,
  evenAllocationPercents, evenAllocationAmounts, pctString,
} from '../shared/smart-allocate'
import type { BudgetAllocation } from '../store/useBatchStore'

// Operating budget = cost of running the batch (feed, medication, labour,
// utilities, transport, repairs, other). Purchase is NOT a category here —
// it is captured once by the mandatory Initial Purchase Cost field.
const ALLOCATION_CATEGORIES = OPERATING_BUDGET_CATEGORIES

interface BudgetAllocatorSectionProps {
  model: 'flock' | 'individual' | 'breeder'
  onChange: (allocations: BudgetAllocation[]) => void
}

export default function BudgetAllocatorSection({ model, onChange }: BudgetAllocatorSectionProps) {
  const keys = ALLOCATION_CATEGORIES.map((c) => c.key)

  const [totalBudgetStr, setTotalBudgetStr] = useState('')
  const [allocationMode, setAllocationMode] = useState<'amount' | 'percentage'>('amount')
  const [amounts, setAmounts] = useState<Record<string, number>>(
    Object.fromEntries(keys.map((k) => [k, 0]))
  )
  const [pcts, setPcts] = useState<Record<string, string>>(
    Object.fromEntries(keys.map((k) => [k, '']))
  )

  const totalBudget = parseAmount(totalBudgetStr)

  const zeroAmounts = useMemo(
    () => Object.fromEntries(keys.map((k) => [k, 0])),
    [keys]
  )
  const zeroPcts = useMemo(
    () => Object.fromEntries(keys.map((k) => [k, ''])),
    [keys]
  )

  const allocations = useMemo<BudgetAllocation[]>(() => {
    return ALLOCATION_CATEGORIES.map((c) => {
      const amount = allocationMode === 'percentage'
        ? Math.round(((parseFloat(pcts[c.key]) || 0) / 100) * totalBudget)
        : (amounts[c.key] || 0)
      return { key: c.key, label: c.label, amount: Math.max(0, amount) }
    })
  }, [allocationMode, pcts, amounts, totalBudget])

  const allocated = useMemo(() => allocations.reduce((s, a) => s + a.amount, 0), [allocations])
  const allocatedPct = useMemo(() => {
    if (allocationMode === 'percentage') {
      return Object.values(pcts).reduce((s, v) => s + (parseFloat(v) || 0), 0)
    }
    return totalBudget > 0 ? (allocated / totalBudget) * 100 : 0
  }, [allocationMode, pcts, allocated, totalBudget])
  const remaining = totalBudget - allocated
  const remainingPct = Math.max(0, 100 - allocatedPct)

  useEffect(() => {
    onChange(allocations)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allocations])

  const switchToPct = useCallback(() => {
    const newPcts: Record<string, string> = {}
    for (const k of keys) {
      const amt = amounts[k] || 0
      const pct = totalBudget > 0 ? ((amt / totalBudget) * 100).toFixed(1) : '0'
      newPcts[k] = parseFloat(pct) > 0 ? pct : ''
    }
    setPcts(newPcts)
    setAmounts(zeroAmounts)
    setAllocationMode('percentage')
  }, [keys, amounts, totalBudget, zeroAmounts])

  const switchToAmount = useCallback(() => {
    const newAmounts: Record<string, number> = {}
    for (const k of keys) {
      newAmounts[k] = totalBudget > 0 ? Math.round(((parseFloat(pcts[k]) || 0) / 100) * totalBudget) : 0
    }
    setAmounts(newAmounts)
    setPcts(zeroPcts)
    setAllocationMode('amount')
  }, [keys, pcts, totalBudget, zeroPcts])

  const updateAmount = useCallback((key: string, val: string) => {
    const cleaned = val.replace(/[^0-9]/g, '')
    setAmounts((prev) => ({ ...prev, [key]: cleaned ? parseInt(cleaned, 10) : 0 }))
  }, [])

  const updatePct = useCallback((key: string, val: string) => {
    const cleaned = val.replace(/[^0-9.]/g, '')
    if ((cleaned.match(/\./g) || []).length > 1) return
    setPcts((prev) => ({ ...prev, [key]: cleaned }))
  }, [])

  const allocateEven = useCallback(() => {
    if (allocationMode === 'percentage') {
      const vals = evenAllocationPercents(keys)
      setPcts(Object.fromEntries(keys.map((k) => [k, pctString(vals[k])])))
      setAmounts(zeroAmounts)
    } else {
      setAmounts(evenAllocationAmounts(keys, totalBudget))
      setPcts(zeroPcts)
    }
  }, [allocationMode, keys, totalBudget, zeroAmounts, zeroPcts])

  const allocateSmart = useCallback(() => {
    if (allocationMode === 'percentage') {
      const vals = smartAllocationPercents(model, keys)
      setPcts(Object.fromEntries(keys.map((k) => [k, pctString(vals[k])])))
      setAmounts(zeroAmounts)
    } else {
      setAmounts(smartAllocationAmounts(model, keys, totalBudget))
      setPcts(zeroPcts)
    }
  }, [allocationMode, model, keys, totalBudget, zeroAmounts, zeroPcts])

  const overAllocated = remaining < 0

  const [expanded, setExpanded] = useState(false)
  const [contentH, setContentH] = useState(0)
  const bodyHeight = useSharedValue(0)
  const chevronSpin = useSharedValue(0)

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronSpin.value}deg` }],
  }))

  const bodyStyle = useAnimatedStyle(() => ({
    height: bodyHeight.value,
  }))

  const toggle = useCallback(() => {
    const next = !expanded
    setExpanded(next)
    if (next) {
      // Measured content height, floored so the body can never open at 0
      // if the measurement hasn't landed yet.
      bodyHeight.value = withTiming(Math.max(contentH, 1000), { duration: 320, easing: Easing.inOut(Easing.cubic) })
    } else {
      Keyboard.dismiss()
      bodyHeight.value = withTiming(0, { duration: 240, easing: Easing.inOut(Easing.cubic) })
    }
    chevronSpin.value = withTiming(next ? 180 : 0, { duration: 240, easing: Easing.inOut(Easing.cubic) })
  }, [expanded, contentH, bodyHeight, chevronSpin])

  return (
    <View style={styles.section}>
      {/* ONE unified card: header + animated budget body */}
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.header}
          activeOpacity={0.85}
          onPress={toggle}
          accessibilityRole="button"
          accessibilityState={{ expanded }}
        >
          <View style={styles.headRow}>
            <View style={styles.headIcon}>
              <GoonaIcon icon={Icons.piggyBank} size={17} color="#2E7D32" />
            </View>
            <View style={styles.headTextWrap}>
              <View style={styles.headTitleRow}>
                <Text style={styles.title}>Operating Budget</Text>
                <View style={styles.optionalPill}>
                  <Text style={styles.optionalPillText}>Optional</Text>
                </View>
              </View>
              <Text style={styles.sub} numberOfLines={expanded ? undefined : 2}>
                Set an upfront budget for running the batch (feed, medication, labour, utilities, transport, repairs). Purchase of the animals is priced separately above.
              </Text>
            </View>
            <Animated.View style={[styles.chevronWrap, chevronStyle]}>
              <GoonaIcon icon={Icons.chevronDown} size={15} color="#2E7D32" />
            </Animated.View>
          </View>

          {!expanded && (
            totalBudget > 0 ? (
              <View style={styles.collapsedSummary}>
                <View style={styles.cSumChips}>
                  <View style={styles.cSumChip}>
                    <Text style={styles.cSumChipLbl}>Budget</Text>
                    <Text style={styles.cSumChipVal}>{formatNaira(totalBudget)}</Text>
                  </View>
                  <View style={styles.cSumChip}>
                    <Text style={styles.cSumChipLbl}>Allocated</Text>
                    <Text style={styles.cSumChipVal}>{formatNaira(allocated)}</Text>
                  </View>
                  <View style={styles.cSumChip}>
                    <Text style={styles.cSumChipLbl}>Used</Text>
                    <Text style={[styles.cSumChipVal, overAllocated ? { color: '#EF4444' } : { color: '#2E7D32' }]}>
                      {allocatedPct.toFixed(0)}%
                    </Text>
                  </View>
                </View>
                <View style={styles.cSumBarBg}>
                  <View style={[styles.cSumBarFill, {
                    width: `${allocationMode === 'percentage'
                      ? Math.min(allocatedPct, 100)
                      : totalBudget > 0 ? Math.min((allocated / totalBudget) * 100, 100) : 0}%`,
                    backgroundColor: overAllocated ? '#EF4444' : allocatedPct > 90 ? '#F59E0B' : '#2E7D32',
                  }]} />
                </View>
              </View>
            ) : (
              <View style={styles.collapsedEmpty}>
                <Text style={styles.collapsedEmptyText}>No budget set yet — budgeting is optional</Text>
              </View>
            )
          )}
        </TouchableOpacity>

      {/* Animated body — same card, flows under the header */}
      <Animated.View style={[styles.body, bodyStyle]}>
        <View
          style={styles.bodyInner}
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height
            if (h !== contentH) {
              setContentH(h)
              if (expanded) bodyHeight.value = h
            }
          }}
        >
        <Text style={styles.label}>Total Budget</Text>
        <View style={styles.fieldWrap}>
          <View style={styles.fieldIco}>
            <GoonaIcon icon={Icons.shoppingCart} size={16} color="#A0AEA1" />
          </View>
          <Text style={styles.fieldPrefix}>{'\u20A6'}</Text>
          <View style={styles.fieldInner}>
            <Text style={styles.fieldLbl}>Total Budget</Text>
            <TextInput
              style={styles.fieldInput}
              value={formatInput(totalBudgetStr)}
              onChangeText={(v) => setTotalBudgetStr(v.replace(/\D/g, ''))}
              placeholder="0.00"
              placeholderTextColor="#A0AEA1"
              keyboardType="number-pad"
            />
          </View>
        </View>
        <Text style={styles.note}>The budget the batch should aim to stay within. Leave empty to skip budgeting.</Text>

        {/* Mode toggle */}
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeOption, allocationMode === 'percentage' && styles.modeOptionActive]}
            activeOpacity={0.7}
            onPress={allocationMode === 'amount' ? switchToPct : undefined}
          >
            <View style={[styles.modeRadio, allocationMode === 'percentage' && styles.modeRadioActive]}>
              {allocationMode === 'percentage' && <View style={styles.modeRadioInner} />}
            </View>
            <Text style={[styles.modeLabel, allocationMode === 'percentage' && styles.modeLabelActive]}>Percentage</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeOption, allocationMode === 'amount' && styles.modeOptionActive]}
            activeOpacity={0.7}
            onPress={allocationMode === 'percentage' ? switchToAmount : undefined}
          >
            <View style={[styles.modeRadio, allocationMode === 'amount' && styles.modeRadioActive]}>
              {allocationMode === 'amount' && <View style={styles.modeRadioInner} />}
            </View>
            <Text style={[styles.modeLabel, allocationMode === 'amount' && styles.modeLabelActive]}>Amount</Text>
          </TouchableOpacity>
        </View>

        {/* Summary */}
        <View style={styles.allocSummary}>
          <View style={styles.allocSummaryItem}>
            <Text style={styles.allocSummaryLabel}>Budget</Text>
            <Text style={styles.allocSummaryValue}>{formatNaira(totalBudget)}</Text>
          </View>
          <View style={styles.allocSummaryItem}>
            <Text style={styles.allocSummaryLabel}>Allocated</Text>
            <Text style={styles.allocSummaryValue}>
              {allocationMode === 'percentage' ? `${allocatedPct.toFixed(1)}%` : formatNaira(allocated)}
            </Text>
          </View>
          <View style={styles.allocSummaryItem}>
            <Text style={styles.allocSummaryLabel}>Remaining</Text>
            <Text style={[styles.allocSummaryValue, overAllocated ? { color: '#EF4444' } : { color: '#16A34A' }]}>
              {allocationMode === 'percentage' ? `${remainingPct.toFixed(1)}%` : formatNaira(Math.max(0, remaining))}
            </Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.allocBarBg}>
          <View style={[styles.allocBarFill, {
            width: `${allocationMode === 'percentage'
              ? Math.min(allocatedPct, 100)
              : totalBudget > 0 ? Math.min((allocated / totalBudget) * 100, 100) : 0}%`,
            backgroundColor: overAllocated ? '#EF4444' : allocatedPct > 90 ? '#F59E0B' : '#2E7D32',
          }]} />
        </View>

        {overAllocated && (
          <Animated.View entering={FadeInUp.duration(300).springify()} style={styles.errorCard}>
            <GoonaIcon icon={Icons.alertTriangle} size={14} color="#EF4444" />
            <Text style={styles.errorTextInline}>Allocated exceeds the total budget.</Text>
          </Animated.View>
        )}

        {/* Category rows */}
        {ALLOCATION_CATEGORIES.map((cat, i) => {
          const pctVal = parseFloat(pcts[cat.key] || '0') || 0
          const amtVal = allocationMode === 'percentage'
            ? Math.round((pctVal / 100) * totalBudget)
            : amounts[cat.key] || 0
          return (
            <Animated.View
              key={cat.key}
              entering={FadeInUp.duration(250).delay(150 + i * 40).springify()}
              layout={Layout.springify()}
            >
              <View style={styles.allocRow}>
                <View style={styles.allocLeft}>
                  <View style={[styles.allocIcon, { backgroundColor: cat.color + '15' }]}>
                    <GoonaIcon icon={cat.icon} size={16} color={cat.color} />
                  </View>
                  <Text style={styles.allocLabel} numberOfLines={1}>{cat.label}</Text>
                </View>
                <View style={styles.allocRight}>
                  {allocationMode === 'percentage' ? (
                    <>
                      <View style={styles.pctInputWrap}>
                        <TextInput
                          style={styles.pctInput}
                          value={pcts[cat.key] || ''}
                          onChangeText={(v) => updatePct(cat.key, v)}
                          keyboardType="decimal-pad"
                          placeholder="0"
                          placeholderTextColor="#CBD5E1"
                        />
                        <Text style={styles.pctSuffix}>%</Text>
                      </View>
                      <Text style={styles.pctAmount}>= {formatNaira(amtVal)}</Text>
                    </>
                  ) : (
                    <View style={styles.allocInputWrap}>
                      <Text style={styles.allocCurrency}>{'\u20A6'}</Text>
                      <TextInput
                        style={styles.allocInput}
                        value={amtVal > 0 ? formatInput(String(amtVal)) : ''}
                        onChangeText={(v) => updateAmount(cat.key, v)}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor="#CBD5E1"
                      />
                    </View>
                  )}
                </View>
              </View>
            </Animated.View>
          )
        })}

        {/* Auto-allocate */}
        <View style={styles.allocFooter}>
          <TouchableOpacity
            style={styles.autoAllocBtn}
            activeOpacity={0.7}
            onPress={allocateEven}
          >
            <GoonaIcon icon={Icons.sparkles} size={13} color="#2E7D32" />
            <Text style={styles.autoAllocText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>Allocate Even</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.autoAllocBtn}
            activeOpacity={0.7}
            onPress={allocateSmart}
          >
            <GoonaIcon icon={Icons.brainCircuit} size={13} color="#2E7D32" />
            <Text style={styles.autoAllocText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>Smart Allocate</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.note}>
          Smart Allocate suggests an ideal split for {model === 'flock' ? 'flock' : model === 'breeder' ? 'breeder' : 'herd'} operations —
          edit any category afterwards.
        </Text>
        </View>
      </Animated.View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  section: { marginBottom: 4 },

  card: {
    backgroundColor: '#FFFFFF', borderRadius: 22, padding: 16,
    borderWidth: 1, borderColor: '#E8EFE4',
    shadowColor: '#0F3D22', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.05, shadowRadius: 16, elevation: 2,
  },
  header: { borderRadius: 14, marginHorizontal: -6, paddingHorizontal: 6, paddingVertical: 2 },
  headRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  headIcon: {
    width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#E8F5E9',
  },
  headTextWrap: { flex: 1, minWidth: 0 },
  headTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  title: { fontSize: 15, fontWeight: '800', color: '#1F2937' },
  sub: { fontSize: 11, color: '#94A3B8', lineHeight: 16, marginTop: 3, textAlign: 'justify' },
  optionalPill: { backgroundColor: '#E8F5E9', borderRadius: 100, paddingHorizontal: 8, paddingVertical: 3 },
  optionalPillText: { fontSize: 9, fontWeight: '800', color: '#2E7D32', letterSpacing: 0.6, textTransform: 'uppercase' },
  chevronWrap: {
    width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#E8F5E9', marginTop: 2,
  },

  collapsedSummary: { marginTop: 12, gap: 8 },
  cSumChips: { flexDirection: 'row', gap: 8 },
  cSumChip: {
    flex: 1, backgroundColor: '#F4F8F3', borderRadius: 12,
    paddingVertical: 8, paddingHorizontal: 10, borderWidth: 1, borderColor: '#E8EFE4',
  },
  cSumChipLbl: { fontSize: 9, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.5, textTransform: 'uppercase' },
  cSumChipVal: { fontSize: 13, fontWeight: '800', color: '#1B1B1B', marginTop: 2, fontVariant: ['tabular-nums'] },
  cSumBarBg: { height: 4, borderRadius: 2, backgroundColor: '#E8EFE4', overflow: 'hidden' },
  cSumBarFill: { height: '100%', borderRadius: 2 },

  collapsedEmpty: {
    marginTop: 10, backgroundColor: '#F8FAF7', borderRadius: 12,
    paddingVertical: 9, paddingHorizontal: 12, borderWidth: 1, borderColor: '#E8EFE4',
  },
  collapsedEmptyText: { fontSize: 11, fontWeight: '600', color: '#94A3B8' },

  body: { overflow: 'hidden' },
  bodyInner: {
    borderTopWidth: 1, borderTopColor: '#EEF1EC',
    marginTop: 14, paddingTop: 14,
  },
  label: { fontSize: 13, fontWeight: '700', color: '#1B1B1B', marginBottom: 8 },
  note: { fontSize: 11, color: '#94A3B8', lineHeight: 16, marginTop: 6 },

  fieldWrap: {
    flexDirection: 'row', alignItems: 'center', height: 56, borderRadius: 16,
    backgroundColor: '#F2F6F1', borderWidth: 1.5, borderColor: '#E2E8F0',
    paddingHorizontal: 14, gap: 10,
  },
  fieldIco: { width: 18, height: 18, flexShrink: 0, alignItems: 'center', justifyContent: 'center' },
  fieldInner: { flex: 1, justifyContent: 'center', minWidth: 0 },
  fieldLbl: { fontSize: 10, fontWeight: '500', color: '#A0AEA1', marginBottom: 1 },
  fieldInput: { fontSize: 15, fontWeight: '600', color: '#1B1B1B', padding: 0, margin: 0, fontFamily: 'Inter' },
  fieldPrefix: { fontSize: 16, fontWeight: '600', color: '#1B1B1B', flexShrink: 0 },

  modeToggle: {
    flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 12,
    padding: 3, marginTop: 14, marginBottom: 12,
  },
  modeOption: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 9, borderRadius: 10,
  },
  modeOptionActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  modeRadio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center' },
  modeRadioActive: { borderColor: '#2E7D32' },
  modeRadioInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2E7D32' },
  modeLabel: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  modeLabelActive: { color: '#1B1B1B', fontWeight: '700' },

  allocSummary: {
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: '#F8FAF7', borderRadius: 14, padding: 12,
    marginBottom: 10, borderWidth: 1, borderColor: '#E8EFE4',
  },
  allocSummaryItem: { alignItems: 'center' },
  allocSummaryLabel: { fontSize: 10, fontWeight: '600', color: '#94A3B8', marginBottom: 3 },
  allocSummaryValue: { fontSize: 14, fontWeight: '800', color: '#1B1B1B' },
  allocBarBg: { height: 6, borderRadius: 3, backgroundColor: '#F1F5F9', overflow: 'hidden', marginBottom: 12 },
  allocBarFill: { height: '100%', borderRadius: 3 },

  errorCard: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FEF2F2', borderRadius: 10, padding: 10, marginBottom: 12,
  },
  errorTextInline: { fontSize: 12, fontWeight: '600', color: '#EF4444', flex: 1 },

  allocRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 10,
    marginBottom: 8, borderWidth: 1, borderColor: '#E8EFE4',
  },
  allocLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 },
  allocIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  allocLabel: { flex: 1, minWidth: 0, fontSize: 13, fontWeight: '600', color: '#1B1B1B' },
  allocRight: { flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 8 },

  allocInputWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAF7',
    borderRadius: 10, paddingHorizontal: 10, borderWidth: 1, borderColor: '#E2E8F0',
  },
  allocCurrency: { fontSize: 13, fontWeight: '700', color: '#94A3B8', marginRight: 4 },
  allocInput: {
    fontSize: 13, fontWeight: '700', color: '#1B1B1B',
    textAlign: 'right', minWidth: 74, paddingVertical: 8,
  },

  pctInputWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4',
    borderRadius: 10, paddingHorizontal: 8, borderWidth: 1, borderColor: 'rgba(46,125,50,0.2)',
  },
  pctInput: {
    fontSize: 15, fontWeight: '800', color: '#1B1B1B',
    textAlign: 'right', minWidth: 40, paddingVertical: 6,
  },
  pctSuffix: { fontSize: 12, fontWeight: '700', color: '#2E7D32', marginLeft: 2 },
  pctAmount: { fontSize: 11, fontWeight: '600', color: '#64748B' },

  allocFooter: {
    flexDirection: 'row', gap: 10, marginTop: 4, marginBottom: 10,
  },
  autoAllocBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    paddingVertical: 10, paddingHorizontal: 8, borderRadius: 20,
    backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#2E7D32',
  },
  autoAllocText: { fontSize: 12, fontWeight: '700', color: '#2E7D32', flexShrink: 1 },
})
