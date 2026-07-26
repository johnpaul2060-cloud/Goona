import React, { useState, useCallback, useMemo, useRef } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Platform, KeyboardAvoidingView, Alert,
} from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import GoonaIcon from '../../../../components/ui/GoonaIcon'
import { Icons } from '../../../../shared/icons'
import Animated, { FadeInUp, Layout } from 'react-native-reanimated'
import DateTimePicker from '@react-native-community/datetimepicker'
import { formatInput, parseAmount, formatNaira } from '../../../../utils/format'
import { useHistoryStore } from '../../../../store/useHistoryStore'
import { useFarmChatStore } from '../../../../store/useFarmChatStore'
import { useBatchStore } from '../../../../store/useBatchStore'
import {
  EXPENSE_CATEGORIES,
  isBatchLinked,
  getCategoryLabel,
  getCategoryColor,
  getCategoryIcon,
} from '../../../../shared/expense-categories'

const CATEGORIES = EXPENSE_CATEGORIES

interface LineItem {
  id: string
  amount: number
  category: string
  vendor: string
  notes: string
}

let lineIdCounter = 0
function nextLineId(): string {
  return `line_${Date.now()}_${lineIdCounter++}`
}

function formatNairaShort(amount: number): string {
  if (amount >= 1_000_000) return `\u20A6${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `\u20A6${(amount / 1_000).toFixed(0)}k`
  return `\u20A6${amount.toLocaleString('en-NG')}`
}

export default function CreateExpenseScreen() {
  const insets = useSafeAreaInsets()
  const storeBatches = useBatchStore((s) => s.batches)

  const batchItems = useMemo(() => {
    if (storeBatches.length > 0) {
      return storeBatches.map((b) => ({ name: b.batchName, id: b.id }))
    }
    return [
      { name: 'Broiler Batch A', id: 'batch_a' },
      { name: 'Layer Batch B', id: 'batch_b' },
      { name: 'Starter Pen C', id: '' },
      { name: 'Turkey Unit', id: '' },
      { name: 'Poultry Expansion Batch', id: '' },
    ]
  }, [storeBatches])

  const [mode, setMode] = useState<'single' | 'batch'>('single')
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const [selectedCategory, setSelectedCategory] = useState('')
  const [amountRaw, setAmountRaw] = useState('')
  const [vendor, setVendor] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [savingAll, setSavingAll] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState(batchItems[0]?.name ?? '')
  const [selectedBatchId, setSelectedBatchId] = useState(batchItems[0]?.id ?? '')
  const [showBatchOptions, setShowBatchOptions] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedTime, setSelectedTime] = useState(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const scrollRef = useRef<ScrollView>(null)

  const showBatch = isBatchLinked(selectedCategory)

  const amountNum = parseAmount(amountRaw)
  const displayAmount = formatInput(amountRaw)
  const dateStr = selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const timeStr = selectedTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  const lineTotal = useMemo(
    () => lineItems.reduce((s, l) => s + l.amount, 0),
    [lineItems]
  )

  const resetInputs = useCallback(() => {
    setAmountRaw('')
    setSelectedCategory('')
    setVendor('')
    setNotes('')
    setEditingIndex(null)
  }, [])

  const addLine = useCallback(() => {
    if (!amountNum || !selectedCategory) return
    const item: LineItem = {
      id: nextLineId(),
      amount: amountNum,
      category: selectedCategory,
      vendor,
      notes,
    }
    setLineItems((prev) => {
      if (editingIndex != null) {
        const copy = [...prev]
        copy.splice(editingIndex, 0, item)
        return copy
      }
      return [...prev, item]
    })
    resetInputs()
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)
  }, [amountNum, selectedCategory, vendor, notes, editingIndex, resetInputs])

  const startEdit = useCallback(
    (index: number) => {
      const item = lineItems[index]
      setAmountRaw(String(item.amount))
      setSelectedCategory(item.category)
      setVendor(item.vendor)
      setNotes(item.notes)
      setLineItems((prev) => prev.filter((_, i) => i !== index))
      setEditingIndex(index)
    },
    [lineItems]
  )

  const removeLine = useCallback((index: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index))
    if (editingIndex === index) {
      resetInputs()
    }
  }, [editingIndex, resetInputs])

  const handleBack = useCallback(() => {
    if (mode === 'batch' && lineItems.length > 0) {
      Alert.alert(
        'Discard lines?',
        `You have ${lineItems.length} expense line${lineItems.length === 1 ? '' : 's'} that ${lineItems.length === 1 ? 'has' : 'have'} not been saved. Discard them?`,
        [
          { text: 'Keep Editing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => router.replace('/(tabs)/records/sales-revenue' as any),
          },
        ]
      )
    } else {
      router.replace('/(tabs)/records/sales-revenue' as any)
    }
  }, [mode, lineItems])

  const catLabel = getCategoryLabel(selectedCategory)
  const handleSave = useCallback(() => {
    if (!amountNum || !selectedCategory) return
    setSaving(true)
    try {
      const recordId = useHistoryStore.getState().addRecord({
        type: 'expense',
        timestamp: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), selectedTime.getHours(), selectedTime.getMinutes()).getTime(),
        batch: selectedBatch,
        batchId: showBatch ? (selectedBatchId || undefined) : undefined,
        cost: amountNum,
        notes: `${catLabel} \u00B7 ${vendor || 'Unknown'}${notes ? ' \u00B7 ' + notes : ''}`,
        itemName: selectedCategory,
        supplier: vendor || undefined,
      })
      if (showBatch && selectedBatchId) {
        useBatchStore.getState().touchBatch(selectedBatchId)
      }
      useFarmChatStore.getState().addFeedPost({
        id: `feed-${recordId}`,
        type: 'feed_record',
        timestamp: Date.now(),
        actorName: 'Farm Records',
        actorRole: 'System',
        actorInitials: 'FR',
        actorColor: '#16A34A',
        detail: `Expense recorded: ${catLabel} \u2014 \u20A6${amountNum.toLocaleString('en-NG')}`,
        highlight: `-\u20A6${amountNum.toLocaleString('en-NG')}`,
        tags: ['Expense', catLabel],
      })
      setSaving(false)
      if (router.canGoBack()) { router.back() } else { router.replace('/records/sales-revenue' as any) }
    } catch (err) {
      setSaving(false)
      Alert.alert('Save Failed', 'Unable to record expense. Your data is intact. Would you like to retry?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Retry', onPress: () => handleSave() },
      ])
    }
  }, [amountNum, selectedCategory, selectedBatch, selectedBatchId, selectedDate, selectedTime, vendor, notes, showBatch])

  const handleSaveAll = useCallback(async () => {
    if (lineItems.length === 0) return
    setSavingAll(true)
    const timestamp = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), selectedTime.getHours(), selectedTime.getMinutes()).getTime()
    const saved: number[] = []
    const errors: { category: string; amount: number }[] = []

    for (let i = 0; i < lineItems.length; i++) {
      const line = lineItems[i]
      const lineCat = getCategoryLabel(line.category)
      try {
        const recordId = useHistoryStore.getState().addRecord({
          type: 'expense',
          timestamp,
          batch: selectedBatch,
          batchId: isBatchLinked(line.category) ? (selectedBatchId || undefined) : undefined,
          cost: line.amount,
          notes: `${lineCat} \u00B7 ${line.vendor || 'Unknown'}${line.notes ? ' \u00B7 ' + line.notes : ''}`,
          itemName: line.category,
          supplier: line.vendor || undefined,
        })
        saved.push(i)
        if (i === 0) {
          useFarmChatStore.getState().addFeedPost({
            id: `feed-${recordId}`,
            type: 'feed_record',
            timestamp: Date.now(),
            actorName: 'Farm Records',
            actorRole: 'System',
            actorInitials: 'FR',
            actorColor: '#16A34A',
            detail: `${lineItems.length} expense${lineItems.length === 1 ? '' : 's'} logged \u2014 \u20A6${lineTotal.toLocaleString('en-NG')} total`,
            highlight: `-\u20A6${lineTotal.toLocaleString('en-NG')}`,
            tags: ['Expense', ...new Set(lineItems.map((l) => getCategoryLabel(l.category)))],
          })
        }
      } catch {
        errors.push({ category: line.category, amount: line.amount })
      }
    }

    if (saved.length > 0 && selectedBatchId) {
      useBatchStore.getState().touchBatch(selectedBatchId)
    }

    setSavingAll(false)

    if (errors.length === 0) {
      if (router.canGoBack()) { router.back() } else { router.replace('/(tabs)/records/sales-revenue' as any) }
    } else {
      const savedCount = saved.length
      const failedCount = errors.length
      const keptLines = errors.map(
        (e) => ({ id: nextLineId(), amount: e.amount, category: e.category, vendor: '', notes: '' } as LineItem)
      )
      setLineItems(keptLines)
      Alert.alert(
        'Partially Saved',
        `${savedCount} of ${lineItems.length} expenses saved. ${failedCount} failed.\n\nUnsaved lines are still here so you can retry.`,
        [{ text: 'OK' }]
      )
    }
  }, [lineItems, selectedBatch, selectedBatchId, selectedDate, selectedTime, lineTotal])

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[styles.scrollInner, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ─── HEADER ─── */}
        <Animated.View entering={FadeInUp.duration(500).springify()} style={styles.topNav}>
          <TouchableOpacity
            style={styles.navBack}
            activeOpacity={0.7}
            onPress={handleBack}
          >
            <GoonaIcon icon={Icons.arrowLeft} size={24} color="#1B1B1B" />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Record Expense</Text>
          <View style={styles.navSpacer} />
        </Animated.View>

        {/* ─── MODE TOGGLE ─── */}
        <Animated.View entering={FadeInUp.duration(500).delay(30).springify()} style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeOption, mode === 'single' && styles.modeOptionActive]}
            activeOpacity={0.7}
            onPress={() => { setMode('single'); resetInputs() }}
          >
            <Text style={[styles.modeText, mode === 'single' && styles.modeTextActive]}>Single Entry</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeOption, mode === 'batch' && styles.modeOptionActive]}
            activeOpacity={0.7}
            onPress={() => setMode('batch')}
          >
            <Text style={[styles.modeText, mode === 'batch' && styles.modeTextActive]}>Multiple Entry</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* ─── LOG CONTEXT ─── */}
        <Animated.View entering={FadeInUp.duration(500).delay(80).springify()} style={styles.logContextCard}>
          <Text style={styles.logContextTitle}>Log Context</Text>
          <Text style={styles.logContextHint}>
            {mode === 'batch'
              ? 'Set once \u2014 applies to all lines'
              : 'Batch, date, and time for this expense'}
          </Text>
          <View style={styles.logContextGrid}>
            <TouchableOpacity style={[styles.logContextField, styles.logContextFieldWide]} activeOpacity={0.75} onPress={() => setShowBatchOptions(!showBatchOptions)}>
              <GoonaIcon icon={Icons.clipboardList} size={16} color="#2E7D32" />
              <View style={styles.logContextFieldText}><Text style={styles.logContextLabel}>Batch</Text><Text style={styles.logContextValue}>{selectedBatch}</Text></View>
              <GoonaIcon icon={Icons.chevronDown} size={13} color="#2E7D32" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.logContextField} activeOpacity={0.75} onPress={() => setShowDatePicker(true)}>
              <GoonaIcon icon={Icons.calendar} size={16} color="#2E7D32" />
              <View style={styles.logContextFieldText}><Text style={styles.logContextLabel}>Date</Text><Text style={styles.logContextValue}>{dateStr}</Text></View>
              <GoonaIcon icon={Icons.chevronDown} size={13} color="#2E7D32" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.logContextField} activeOpacity={0.75} onPress={() => setShowTimePicker(true)}>
              <GoonaIcon icon={Icons.clock} size={16} color="#2E7D32" />
              <View style={styles.logContextFieldText}><Text style={styles.logContextLabel}>Time</Text><Text style={styles.logContextValue}>{timeStr}</Text></View>
              <GoonaIcon icon={Icons.chevronDown} size={13} color="#2E7D32" />
            </TouchableOpacity>
          </View>
          {showBatchOptions && (
            <View style={styles.batchOptions}>
              {batchItems.map((item) => (
                <TouchableOpacity key={item.name} style={[styles.batchOption, item.name === selectedBatch && styles.batchOptionActive]} activeOpacity={0.75} onPress={() => { setSelectedBatch(item.name); setSelectedBatchId(item.id); setShowBatchOptions(false) }}>
                  <Text style={[styles.batchOptionText, item.name === selectedBatch && styles.batchOptionTextActive]}>{item.name}</Text>
                  {item.name === selectedBatch ? <GoonaIcon icon={Icons.check} size={14} color="#2E7D32" /> : null}
                </TouchableOpacity>
              ))}
            </View>
          )}
          {showDatePicker && (
            <View style={styles.inlinePicker}>
              <DateTimePicker value={selectedDate} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(_event, date) => { if (Platform.OS === 'android') setShowDatePicker(false); if (date) setSelectedDate(date) }} themeVariant="light" />
              {Platform.OS === 'ios' && <TouchableOpacity style={styles.inlineDone} onPress={() => setShowDatePicker(false)}><Text style={styles.inlineDoneText}>Done</Text></TouchableOpacity>}
            </View>
          )}
          {showTimePicker && (
            <View style={styles.inlinePicker}>
              <DateTimePicker value={selectedTime} mode="time" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(_event, date) => { if (Platform.OS === 'android') setShowTimePicker(false); if (date) setSelectedTime(date) }} themeVariant="light" />
              {Platform.OS === 'ios' && <TouchableOpacity style={styles.inlineDone} onPress={() => setShowTimePicker(false)}><Text style={styles.inlineDoneText}>Done</Text></TouchableOpacity>}
            </View>
          )}

          {/* ─── Divider ─── */}
          <View style={styles.logContextDivider} />

          {/* ─── Amount ─── */}
          <Text style={styles.entryLabel}>Amount ({'\u20A6'})</Text>
          <View style={styles.amountRow}>
            <Text style={styles.amountPrefix}>{'\u20A6'}</Text>
            <TextInput
              style={[styles.amountInput, amountNum > 0 && styles.amountInputValid]}
              placeholder="0"
              placeholderTextColor="#CBD5E1"
              keyboardType="numeric"
              value={displayAmount}
              onChangeText={(v) => setAmountRaw(prev => { const c = v.replace(/[^0-9]/g, ''); return prev === c ? prev : c })}
            />
          </View>

          {/* ─── Category (horizontal scroll) ─── */}
          <Text style={[styles.entryLabel, { marginTop: 12 }]}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow} keyboardShouldPersistTaps="handled">
            {CATEGORIES.map((c) => {
              const active = selectedCategory === c.key
              return (
                <TouchableOpacity
                  key={c.key}
                  style={[styles.categoryChip, active && { backgroundColor: c.color + '18', borderColor: c.color }]}
                  activeOpacity={0.7}
                  onPress={() => setSelectedCategory(c.key)}
                >
                  <GoonaIcon icon={c.icon} size={14} color={active ? c.color : '#64748B'} />
                  <Text style={[styles.categoryLabel, active && { color: c.color, fontWeight: '700' }]}>
                    {c.label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </ScrollView>

          {/* ─── Vendor ─── */}
          <Text style={[styles.entryLabel, { marginTop: 12 }]}>Vendor / Payee</Text>
          <TextInput
            style={styles.entryInput}
            placeholder="Enter vendor name"
            placeholderTextColor="#CBD5E1"
            value={vendor}
            onChangeText={setVendor}
          />

          {/* ─── Notes ─── */}
          <Text style={[styles.entryLabel, { marginTop: 12 }]}>Notes</Text>
          <TextInput
            style={[styles.entryInput, styles.notesInput]}
            placeholder="Add notes about this expense"
            placeholderTextColor="#CBD5E1"
            multiline
            numberOfLines={3}
            value={notes}
            onChangeText={setNotes}
          />

          {/* ─── Attach Receipt ─── */}
          <TouchableOpacity style={styles.receiptBtn} activeOpacity={0.7}>
            <GoonaIcon icon={Icons.camera} size={16} color="#2E7D32" />
            <Text style={styles.receiptText}>Attach Receipt</Text>
          </TouchableOpacity>

          {/* ─── Add Line (batch) / Save (single) ─── */}
          {mode === 'batch' ? (
            <TouchableOpacity
              style={[styles.addLineBtn, (!amountNum || !selectedCategory) && styles.addLineBtnDisabled]}
              activeOpacity={0.8}
              onPress={addLine}
              disabled={!amountNum || !selectedCategory}
            >
              <GoonaIcon icon={editingIndex != null ? Icons.check : Icons.plus} size={18} color="#FFF" />
              <Text style={styles.addLineText}>
                {editingIndex != null ? 'Update Line' : 'Add Line'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.saveBtn, (!amountNum || !selectedCategory) && styles.saveBtnDisabled]}
              activeOpacity={0.8}
              onPress={handleSave}
              disabled={!amountNum || !selectedCategory || saving}
            >
              <GoonaIcon icon={saving ? Icons.check : Icons.plus} size={18} color="#FFF" />
              <Text style={styles.saveText}>{saving ? 'Saving...' : 'Record Expense'}</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* ─── LINE ITEMS (batch mode only) ─── */}
        {mode === 'batch' && (
          <Animated.View entering={FadeInUp.duration(500).delay(120).springify()} style={styles.linesSection}>
            <View style={styles.linesHeader}>
              <Text style={styles.linesTitle}>
                Line Items
                {lineItems.length > 0 && (
                  <Text style={styles.linesCount}> \u00B7 {lineItems.length}</Text>
                )}
              </Text>
              {lineItems.length > 0 && (
                <View style={styles.linesTotalBadge}>
                  <Text style={styles.linesTotalText}>{formatNaira(lineTotal)}</Text>
                </View>
              )}
            </View>

            {lineItems.length === 0 ? (
              <View style={styles.linesEmpty}>
                <GoonaIcon icon={Icons.receipt} size={24} color="#CBD5E1" />
                <Text style={styles.linesEmptyText}>No lines added yet</Text>
                <Text style={styles.linesEmptyHint}>Fill in the fields above and tap Add Line</Text>
              </View>
            ) : (
              <>
                {lineItems.map((item, i) => {
                  const catColor = getCategoryColor(item.category)
                  const catIcon = getCategoryIcon(item.category)
                  const catLabel = getCategoryLabel(item.category)
                  return (
                    <Animated.View
                      key={item.id}
                      entering={FadeInUp.duration(250).springify()}
                      layout={Layout.springify()}
                    >
                      <View style={styles.lineCard}>
                        <View style={[styles.lineCatIcon, { backgroundColor: catColor + '15' }]}>
                          <GoonaIcon icon={catIcon} size={14} color={catColor} />
                        </View>
                        <View style={styles.lineBody}>
                          <View style={styles.lineTop}>
                            <Text style={[styles.lineCategory, { color: catColor }]}>{catLabel}</Text>
                            <Text style={styles.lineAmount}>{formatNairaShort(item.amount)}</Text>
                          </View>
                          {item.vendor ? (
                            <Text style={styles.lineVendor}>{item.vendor}</Text>
                          ) : null}
                        </View>
                        <View style={styles.lineActions}>
                          <TouchableOpacity
                            style={styles.lineEditBtn}
                            activeOpacity={0.7}
                            onPress={() => startEdit(i)}
                          >
                            <GoonaIcon icon={Icons.edit3} size={14} color="#64748B" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.lineRemoveBtn}
                            activeOpacity={0.7}
                            onPress={() => removeLine(i)}
                          >
                            <GoonaIcon icon={Icons.x} size={14} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </Animated.View>
                  )
                })}

                {/* Running total card */}
                <Animated.View
                  entering={FadeInUp.duration(300).springify()}
                  style={styles.lineTotalCard}
                >
                  <Text style={styles.lineTotalLabel}>Total ({lineItems.length} line{lineItems.length === 1 ? '' : 's'})</Text>
                  <View style={styles.lineTotalValueRow}>
                    <Text style={styles.lineTotalValue}>{formatNaira(lineTotal)}</Text>
                  </View>
                  <View style={styles.lineTotalBar}>
                    <View style={[styles.lineTotalBarFill, { width: `${Math.min(lineTotal / Math.max(lineTotal, 1) * 100, 100)}%` }]} />
                  </View>
                </Animated.View>

                {/* Save All */}
                <TouchableOpacity
                  style={[styles.saveAllBtn, savingAll && styles.saveAllBtnDisabled]}
                  activeOpacity={0.85}
                  onPress={handleSaveAll}
                  disabled={lineItems.length === 0 || savingAll}
                >
                  <GoonaIcon icon={savingAll ? Icons.check : Icons.save} size={18} color="#FFF" />
                  <Text style={styles.saveAllText}>
                    {savingAll ? 'Saving...' : `Save All (${lineItems.length})`}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
        )}

        {/* Batch hint when in batch mode with no lines */}
        {mode === 'batch' && lineItems.length === 0 && (
          <Animated.View entering={FadeInUp.duration(500).delay(160).springify()} style={styles.batchHintCard}>
            <GoonaIcon icon={Icons.info} size={14} color="#2E7D32" />
            <Text style={styles.batchHintText}>
              Add expenses one by one, then tap Save All to persist them together.
            </Text>
          </Animated.View>
        )}
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAF7' },
  flex: { flex: 1 },
  scroll: { flex: 1 },
  scrollInner: { paddingBottom: 60 },

  // ─── HEADER ───
  topNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, height: 52,
  },
  navBack: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center',
  },
  topTitle: { fontSize: 18, fontWeight: '700', color: '#1B1B1B', letterSpacing: -0.3 },
  navSpacer: { width: 40 },

  // ─── MODE TOGGLE ───
  modeToggle: {
    flexDirection: 'row', marginHorizontal: 20, marginBottom: 12,
    backgroundColor: '#F1F5F9', borderRadius: 12, padding: 3,
  },
  modeOption: {
    flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10,
  },
  modeOptionActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  modeText: { fontSize: 14, fontWeight: '600', color: '#94A3B8' },
  modeTextActive: { color: '#1B1B1B', fontWeight: '700' },

  // ─── LOG CONTEXT ───
  logContextCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, marginHorizontal: 20,
    marginBottom: 16, padding: 20,
    borderWidth: 1, borderColor: '#E2E8F0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  logContextTitle: {
    fontSize: 12, fontWeight: '700', color: '#2E7D32',
    letterSpacing: 0.4, textTransform: 'uppercase',
  },
  logContextHint: {
    fontSize: 11, fontWeight: '500', color: '#94A3B8', marginBottom: 12, marginTop: 2,
  },
  logContextDivider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 14 },
  logContextGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  logContextField: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F0FDF4', borderRadius: 12, paddingVertical: 12,
    paddingHorizontal: 14, minWidth: 100,
  },
  logContextFieldWide: { flex: 2, minWidth: '100%' },
  logContextFieldText: { flex: 1 },
  logContextLabel: {
    fontSize: 10, fontWeight: '600', color: '#6B7280',
    letterSpacing: 0.3, textTransform: 'uppercase',
  },
  logContextValue: { fontSize: 13, fontWeight: '700', color: '#1B1B1B', marginTop: 1 },
  batchOptions: {
    marginTop: 10, backgroundColor: '#F9FAFB', borderRadius: 14,
    borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden',
  },
  batchOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  batchOptionActive: { backgroundColor: '#F0FDF4' },
  batchOptionText: { fontSize: 14, fontWeight: '500', color: '#374151' },
  batchOptionTextActive: { color: '#2E7D32', fontWeight: '700' },
  inlinePicker: {
    marginTop: 10, backgroundColor: '#F9FAFB', borderRadius: 14,
    overflow: 'hidden', alignItems: 'center',
  },
  inlineDone: { paddingVertical: 8, paddingHorizontal: 20, alignSelf: 'flex-end' },
  inlineDoneText: { fontSize: 15, fontWeight: '700', color: '#2E7D32' },

  // ─── INPUT FIELDS ───
  entryLabel: { fontSize: 12, fontWeight: '600', color: '#6B7280', letterSpacing: 0.2, marginBottom: 6 },
  amountRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB',
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 4,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  amountPrefix: { fontSize: 22, fontWeight: '800', color: '#1B1B1B', marginRight: 6 },
  amountInput: {
    flex: 1, fontSize: 26, fontWeight: '800', color: '#1B1B1B',
    textAlign: 'center', letterSpacing: -0.5, paddingVertical: 8,
  },
  amountInputValid: { color: '#2E7D32' },
  categoryRow: { flexDirection: 'row', gap: 8, paddingRight: 8 },
  categoryChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0',
  },
  categoryLabel: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  entryInput: {
    backgroundColor: '#F9FAFB', borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 11, fontSize: 14, color: '#1B1B1B',
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  notesInput: { height: 72, textAlignVertical: 'top' },
  receiptBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: 14, paddingVertical: 12, borderRadius: 12,
    backgroundColor: '#F0FDF4', borderWidth: 1,
    borderColor: 'rgba(46,125,50,0.2)', borderStyle: 'dashed',
  },
  receiptText: { fontSize: 13, fontWeight: '600', color: '#2E7D32' },

  // ─── ADD LINE (batch mode) ───
  addLineBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#2E7D32', borderRadius: 14, paddingVertical: 14, marginTop: 16,
    shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 4,
  },
  addLineBtnDisabled: { opacity: 0.5 },
  addLineText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },

  // ─── SAVE (single mode) ───
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#2E7D32', borderRadius: 14, paddingVertical: 14, marginTop: 16,
    shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 4,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },

  // ─── LINE ITEMS SECTION ───
  linesSection: { marginHorizontal: 20, marginBottom: 16 },
  linesHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 12,
  },
  linesTitle: { fontSize: 16, fontWeight: '800', color: '#1B1B1B' },
  linesCount: { fontSize: 14, fontWeight: '600', color: '#94A3B8' },
  linesTotalBadge: {
    backgroundColor: '#F0FDF4', paddingVertical: 4, paddingHorizontal: 12,
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(46,125,50,0.2)',
  },
  linesTotalText: { fontSize: 13, fontWeight: '800', color: '#2E7D32' },
  linesEmpty: {
    alignItems: 'center', paddingVertical: 32, gap: 6,
    backgroundColor: '#FFFFFF', borderRadius: 18,
    borderWidth: 1, borderColor: '#E2E8F0', borderStyle: 'dashed',
  },
  linesEmptyText: { fontSize: 14, fontWeight: '600', color: '#94A3B8', marginTop: 6 },
  linesEmptyHint: { fontSize: 11, fontWeight: '500', color: '#CBD5E1' },

  // ─── LINE CARD ───
  lineCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: '#E2E8F0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  lineCatIcon: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  lineBody: { flex: 1 },
  lineTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  lineCategory: { fontSize: 13, fontWeight: '700' },
  lineAmount: { fontSize: 15, fontWeight: '800', color: '#1B1B1B' },
  lineVendor: { fontSize: 11, fontWeight: '500', color: '#94A3B8', marginTop: 2 },
  lineActions: { flexDirection: 'row', gap: 4 },
  lineEditBtn: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center',
  },
  lineRemoveBtn: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center',
  },

  // ─── RUNNING TOTAL ───
  lineTotalCard: {
    backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18, marginTop: 4, marginBottom: 12,
    borderWidth: 1, borderColor: '#E2E8F0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  lineTotalLabel: { fontSize: 11, fontWeight: '600', color: '#94A3B8', marginBottom: 4 },
  lineTotalValueRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 8 },
  lineTotalValue: { fontSize: 28, fontWeight: '900', color: '#1B1B1B', letterSpacing: -0.8 },
  lineTotalBar: {
    height: 4, borderRadius: 2, backgroundColor: '#F1F5F9', overflow: 'hidden',
  },
  lineTotalBarFill: { height: '100%', borderRadius: 2, backgroundColor: '#2E7D32' },

  // ─── SAVE ALL ───
  saveAllBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#1A56FF', borderRadius: 18, paddingVertical: 16,
    shadowColor: '#1A56FF', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 5,
  },
  saveAllBtnDisabled: { opacity: 0.5 },
  saveAllText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },

  // ─── BATCH HINT ───
  batchHintCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 20, paddingVertical: 12, paddingHorizontal: 16,
    backgroundColor: '#F0FDF4', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(46,125,50,0.2)',
  },
  batchHintText: { fontSize: 12, fontWeight: '500', color: '#2E7D32', flex: 1 },
})
