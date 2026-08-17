import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, Alert,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import GoonaIcon from '../../components/ui/GoonaIcon'
import { Icons } from '../../shared/icons'
import Animated, { FadeInUp, Layout } from 'react-native-reanimated'
import { formatInput, parseAmount, formatNaira } from '../../utils/format'
import { useBatchStore, type BudgetAllocation } from '../../store/useBatchStore'
import { BUDGET_ALLOCATION_CATEGORIES } from '../../shared/expense-categories'
import {
  smartAllocationPercents, smartAllocationAmounts,
  evenAllocationPercents, evenAllocationAmounts, pctString,
} from '../../shared/smart-allocate'

const ALLOCATION_CATEGORIES = BUDGET_ALLOCATION_CATEGORIES

export default function BatchBudgetSetupScreen() {
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id: string }>()
  const storeBatch = useBatchStore((s) => s.getBatchById(id ?? ''))
  const updateBudgetAllocations = useBatchStore((s) => s.updateBudgetAllocations)

  const existingAllocs = storeBatch?.budgetAllocations ?? []
  const totalBudget = existingAllocs.reduce((s, a) => s + a.amount, 0)

  const initAmounts = Object.fromEntries(
    ALLOCATION_CATEGORIES.map((c) => [
      c.key,
      existingAllocs.find((a) => a.key === c.key)?.amount ?? 0,
    ])
  )
  const initPcts = Object.fromEntries(
    ALLOCATION_CATEGORIES.map((c) => {
      const amt = existingAllocs.find((a) => a.key === c.key)?.amount ?? 0
      return [c.key, totalBudget > 0 && amt > 0 ? ((amt / totalBudget) * 100).toFixed(1) : '']
    })
  )

  const [allocationMode, setAllocationMode] = useState<'amount' | 'percentage'>('amount')
  const [amounts, setAmounts] = useState<Record<string, number>>(initAmounts)
  const [pcts, setPcts] = useState<Record<string, string>>(initPcts)

  const allocated = useMemo(() => {
    if (allocationMode === 'percentage') {
      let sum = 0
      for (const key of Object.keys(pcts)) {
        sum += ((parseFloat(pcts[key]) || 0) / 100) * totalBudget
      }
      return Math.round(sum)
    }
    return Object.values(amounts).reduce((s, v) => s + v, 0)
  }, [amounts, pcts, allocationMode, totalBudget])

  const allocatedPct = useMemo(() => {
    if (allocationMode === 'percentage') {
      return Object.values(pcts).reduce((s, v) => s + (parseFloat(v) || 0), 0)
    }
    return totalBudget > 0 ? (allocated / totalBudget) * 100 : 0
  }, [pcts, allocationMode, allocated, totalBudget])

  const remaining = totalBudget - allocated

  const switchToPct = useCallback(() => {
    const newPcts: Record<string, string> = {}
    for (const key of Object.keys(amounts)) {
      const amt = amounts[key]
      const pct = totalBudget > 0 ? ((amt / totalBudget) * 100).toFixed(1) : ''
      newPcts[key] = pct === '0.0' ? '' : pct
    }
    setPcts(newPcts)
    setAmounts(Object.fromEntries(Object.keys(amounts).map((k) => [k, 0])))
    setAllocationMode('percentage')
  }, [amounts, totalBudget])

  const switchToAmount = useCallback(() => {
    const newAmounts: Record<string, number> = {}
    for (const key of Object.keys(pcts)) {
      const pct = parseFloat(pcts[key]) || 0
      newAmounts[key] = totalBudget > 0 ? Math.round((pct / 100) * totalBudget) : 0
    }
    setAmounts(newAmounts)
    setPcts(Object.fromEntries(Object.keys(pcts).map((k) => [k, ''])))
    setAllocationMode('amount')
  }, [pcts, totalBudget])

  const updateAmount = useCallback((key: string, val: string) => {
    const cleaned = val.replace(/[^0-9]/g, '')
    setAmounts((prev) => ({ ...prev, [key]: cleaned ? parseInt(cleaned, 10) : 0 }))
  }, [])

  const updatePct = useCallback((key: string, val: string) => {
    const cleaned = val.replace(/[^0-9.]/g, '')
    if ((cleaned.match(/\./g) || []).length > 1) return
    setPcts((prev) => ({ ...prev, [key]: cleaned }))
  }, [])

  const autoAllocate = useCallback((mode: 'even' | 'smart') => {
    const keys = ALLOCATION_CATEGORIES.map((c) => c.key)

    if (mode === 'smart') {
      const batchModel = storeBatch
        && (storeBatch.model === 'individual' || storeBatch.model === 'breeder')
        ? storeBatch.model
        : 'flock'
      if (allocationMode === 'percentage') {
        const vals = smartAllocationPercents(batchModel, keys)
        const newPcts: Record<string, string> = {}
        for (const k of keys) newPcts[k] = pctString(vals[k])
        setPcts(newPcts)
        setAmounts(Object.fromEntries(keys.map((k) => [k, 0])))
      } else {
        setAmounts(smartAllocationAmounts(batchModel, keys, totalBudget))
        setPcts(Object.fromEntries(keys.map((k) => [k, ''])))
      }
      return
    }

    if (allocationMode === 'percentage') {
      const vals = evenAllocationPercents(keys)
      const newPcts: Record<string, string> = {}
      for (const k of keys) newPcts[k] = pctString(vals[k])
      setPcts(newPcts)
      setAmounts(Object.fromEntries(keys.map((k) => [k, 0])))
    } else {
      setAmounts(evenAllocationAmounts(keys, totalBudget))
      setPcts(Object.fromEntries(keys.map((k) => [k, ''])))
    }
  }, [allocationMode, totalBudget, storeBatch])

  const handleSave = useCallback(() => {
    if (!id) return
    if (allocated <= 0) {
      Alert.alert('Invalid', 'Please allocate at least some budget before saving.')
      return
    }
    const result: BudgetAllocation[] = ALLOCATION_CATEGORIES.map((c) => {
      const amount = allocationMode === 'percentage'
        ? Math.round((parseFloat(pcts[c.key]) || 0) / 100 * totalBudget)
        : (amounts[c.key] || 0)
      return { key: c.key, label: c.label, amount: Math.max(0, amount) }
    })
    updateBudgetAllocations(id, result)
    Alert.alert('Budget Updated', 'The batch budget has been saved.', [
      { text: 'OK', onPress: () => router.back() },
    ])
  }, [id, allocationMode, pcts, amounts, totalBudget, allocated, updateBudgetAllocations])

  if (!storeBatch) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.errorText}>Batch not found</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollInner, { paddingTop: insets.top + 12 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInUp.duration(500).springify()} style={styles.topNav}>
          <TouchableOpacity
            style={styles.navBack}
            activeOpacity={0.7}
            onPress={() => router.back()}
          >
            <GoonaIcon icon={Icons.arrowLeft} size={22} color="#1B1B1B" />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Set Budget</Text>
          <View style={{ width: 38 }} />
        </Animated.View>

        {/* Batch info */}
        <Animated.View entering={FadeInUp.duration(500).delay(60).springify()} style={styles.batchInfo}>
          <Text style={styles.batchName}>{storeBatch.batchName}</Text>
          <Text style={styles.batchMeta}>{storeBatch.livestockType} · {storeBatch.quantity} heads</Text>
        </Animated.View>

        {/* Allocation card */}
        <Animated.View entering={FadeInUp.duration(500).delay(100).springify()} style={styles.formCard}>
          <Text style={styles.formTitle}>Budget Allocations</Text>
          <Text style={styles.formSubtitle}>Allocate your total batch budget across categories</Text>

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
              <Text style={[styles.allocSummaryValue, remaining < 0 ? { color: '#EF4444' } : { color: '#16A34A' }]}>
                {allocationMode === 'percentage' ? `${Math.max(0, 100 - allocatedPct).toFixed(1)}%` : formatNaira(Math.max(0, remaining))}
              </Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.allocBarBg}>
            <View style={[styles.allocBarFill, {
              width: `${allocationMode === 'percentage' ? Math.min(allocatedPct, 100) : totalBudget > 0 ? Math.min((allocated / totalBudget) * 100, 100) : 0}%`,
              backgroundColor: remaining < 0 ? '#EF4444' : allocatedPct > 90 ? '#F59E0B' : '#2E7D32',
            }]} />
          </View>

          {/* Validation error */}
          {remaining < 0 && (
            <Animated.View entering={FadeInUp.duration(300).springify()} style={styles.errorCard}>
              <GoonaIcon icon={Icons.alertTriangle} size={14} color="#EF4444" />
              <Text style={styles.errorTextInline}>Allocated exceeds the batch budget total.</Text>
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
                entering={FadeInUp.duration(250).delay(150 + i * 50).springify()}
                layout={Layout.springify()}
              >
                <View style={styles.allocRow}>
                  <View style={styles.allocLeft}>
                    <View style={[styles.allocIcon, { backgroundColor: cat.color + '15' }]}>
                      <GoonaIcon icon={cat.icon} size={16} color={cat.color} />
                    </View>
                    <Text style={styles.allocLabel}>{cat.label}</Text>
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
              onPress={() => autoAllocate('even')}
            >
              <GoonaIcon icon={Icons.sparkles} size={14} color="#2E7D32" />
              <Text style={styles.autoAllocText}>Allocate Even</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.autoAllocBtn}
              activeOpacity={0.7}
              onPress={() => autoAllocate('smart')}
            >
              <GoonaIcon icon={Icons.brainCircuit} size={14} color="#2E7D32" />
              <Text style={styles.autoAllocText}>Smart Allocate</Text>
            </TouchableOpacity>
          </View>

          {/* Total */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Budget</Text>
            <Text style={styles.totalValue}>{formatNaira(totalBudget)}</Text>
          </View>
        </Animated.View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.cancelBtn}
            activeOpacity={0.7}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.saveBtn}
            activeOpacity={0.8}
            onPress={handleSave}
          >
            <Text style={styles.saveText}>Save Budget</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAF7' },
  scroll: { flex: 1 },
  scrollInner: { paddingBottom: 40 },

  topNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, height: 48, marginBottom: 8,
  },
  navBack: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center',
  },
  topTitle: { fontSize: 18, fontWeight: '700', color: '#1B1B1B', letterSpacing: -0.3 },
  errorText: { fontSize: 13, color: '#EF4444', textAlign: 'center', marginTop: 40 },

  batchInfo: { marginHorizontal: 20, marginBottom: 12 },
  batchName: { fontSize: 22, fontWeight: '800', color: '#1B1B1B' },
  batchMeta: { fontSize: 13, color: '#94A3B8', marginTop: 2 },

  formCard: {
    marginHorizontal: 16, backgroundColor: '#FFFFFF', borderRadius: 22,
    padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  formTitle: { fontSize: 17, fontWeight: '800', color: '#1B1B1B' },
  formSubtitle: { fontSize: 12, color: '#94A3B8', marginTop: 2, marginBottom: 16 },

  // Mode toggle
  modeToggle: {
    flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 12,
    padding: 3, marginBottom: 14,
  },
  modeOption: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 10, borderRadius: 10,
  },
  modeOptionActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  modeRadio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center' },
  modeRadioActive: { borderColor: '#2E7D32' },
  modeRadioInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2E7D32' },
  modeLabel: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  modeLabelActive: { color: '#1B1B1B', fontWeight: '700' },

  // Summary
  allocSummary: {
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0',
  },
  allocSummaryItem: { alignItems: 'center' },
  allocSummaryLabel: { fontSize: 11, fontWeight: '600', color: '#94A3B8', marginBottom: 4 },
  allocSummaryValue: { fontSize: 15, fontWeight: '800', color: '#1B1B1B' },
  allocBarBg: { height: 6, borderRadius: 3, backgroundColor: '#F1F5F9', overflow: 'hidden', marginBottom: 12 },
  allocBarFill: { height: '100%', borderRadius: 3 },

  // Error
  errorCard: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FEF2F2', borderRadius: 10, padding: 10, marginBottom: 12,
  },
  errorTextInline: { fontSize: 12, fontWeight: '600', color: '#EF4444', flex: 1 },

  // Category rows
  allocRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 12,
    marginBottom: 8, borderWidth: 1, borderColor: '#E2E8F0',
  },
  allocLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  allocIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  allocLabel: { fontSize: 14, fontWeight: '600', color: '#1B1B1B' },
  allocRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  // Amount input
  allocInputWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAF7',
    borderRadius: 10, paddingHorizontal: 10, borderWidth: 1, borderColor: '#E2E8F0',
  },
  allocCurrency: { fontSize: 14, fontWeight: '700', color: '#94A3B8', marginRight: 4 },
  allocInput: {
    fontSize: 14, fontWeight: '700', color: '#1B1B1B',
    textAlign: 'right', minWidth: 80, paddingVertical: 8,
  },

  // Percentage input
  pctInputWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4',
    borderRadius: 10, paddingHorizontal: 8, borderWidth: 1, borderColor: 'rgba(46,125,50,0.2)',
  },
  pctInput: {
    fontSize: 16, fontWeight: '800', color: '#1B1B1B',
    textAlign: 'right', minWidth: 44, paddingVertical: 6,
  },
  pctSuffix: { fontSize: 13, fontWeight: '700', color: '#2E7D32', marginLeft: 2 },
  pctAmount: { fontSize: 12, fontWeight: '600', color: '#64748B' },

  // Auto allocate
  allocFooter: {
    flexDirection: 'row', gap: 10, marginTop: 4, marginBottom: 12,
  },
  autoAllocBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20,
    backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#2E7D32',
  },
  autoAllocText: { fontSize: 12, fontWeight: '700', color: '#2E7D32' },

  // Total
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9',
  },
  totalLabel: { fontSize: 15, fontWeight: '700', color: '#1B1B1B' },
  totalValue: { fontSize: 18, fontWeight: '800', color: '#16A34A' },

  // Actions
  actions: {
    flexDirection: 'row', gap: 12,
    marginHorizontal: 16, marginTop: 20,
  },
  cancelBtn: {
    flex: 1, height: 50, borderRadius: 16,
    borderWidth: 1, borderColor: '#E2E8F0',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  cancelText: { fontSize: 15, fontWeight: '700', color: '#64748B' },
  saveBtn: {
    flex: 1, height: 50, borderRadius: 16,
    backgroundColor: '#16A34A', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#16A34A', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 3,
  },
  saveText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
})
