import React, { useState, useMemo } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import GoonaIcon from '../../../../components/ui/GoonaIcon'
import { Icons } from '../../../../shared/icons'
import Animated, { FadeInUp } from 'react-native-reanimated'
import { formatInput, parseAmount, formatNaira } from '../../../../utils/format'

const PERIODS = ['Weekly', 'Monthly', 'Quarterly', 'Production Cycle', 'Custom'] as const

const CATEGORIES = [
  { key: 'feed', label: 'Feed', icon: Icons.package, color: '#16A34A' },
  { key: 'salaries', label: 'Salaries', icon: Icons.users, color: '#1A56FF' },
  { key: 'medication', label: 'Medication', icon: Icons.receipt, color: '#EF4444' },
  { key: 'transport', label: 'Transport', icon: Icons.truck, color: '#F59E0B' },
  { key: 'utilities', label: 'Utilities', icon: Icons.zap, color: '#8B5CF6' },
  { key: 'repairs', label: 'Repairs', icon: Icons.wrench, color: '#06B6D4' },
  { key: 'other', label: 'Other', icon: Icons.package, color: '#64748B' },
] as const

const FARM_TEMPLATES = [
  { key: 'broiler', label: 'Broiler Farm', emoji: '\u{1F414}', allocs: { feed: '40', salaries: '20', medication: '15', transport: '8', utilities: '7', repairs: '5', other: '5' } },
  { key: 'layer', label: 'Layer Farm', emoji: '\u{1F95A}', allocs: { feed: '35', salaries: '25', medication: '10', transport: '10', utilities: '8', repairs: '7', other: '5' } },
  { key: 'catfish', label: 'Catfish Farm', emoji: '\u{1F41F}', allocs: { feed: '45', salaries: '15', medication: '20', transport: '5', utilities: '5', repairs: '5', other: '5' } },
  { key: 'crop', label: 'Crop Farm', emoji: '\u{1F33E}', allocs: { feed: '20', salaries: '30', medication: '10', transport: '15', utilities: '10', repairs: '10', other: '5' } },
] as const

const ALERTS = [
  { key: 'eighty', label: '80% spent', desc: 'Get notified when 80% of a category is used' },
  { key: 'ninety', label: '90% spent', desc: 'Warning when approaching budget limit' },
  { key: 'exceeded', label: 'Budget exceeded', desc: 'Alert when any category overspends' },
  { key: 'overspend', label: 'Overspending detected', desc: 'Detect unusual spending patterns' },
] as const

const STEPS = ['Period', 'Amount', 'Allocate', 'Alerts', 'Review']

export default function BudgetSetupScreen() {
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<{ from?: string }>()
  const fromRecapitalization = params.from === 'recapitalization'
  const [step, setStep] = useState(1)

  const [period, setPeriod] = useState<typeof PERIODS[number] | null>(null)
  const [totalRaw, setTotalRaw] = useState('')
  const [categories, setCategories] = useState<Record<string, string>>({
    feed: '', salaries: '', medication: '', transport: '', utilities: '', repairs: '', other: '',
  })
  const [alerts, setAlerts] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [allocationMode, setAllocationMode] = useState<'amount' | 'percentage'>('amount')
  const [categoryPcts, setCategoryPcts] = useState<Record<string, string>>({
    feed: '', salaries: '', medication: '', transport: '', utilities: '', repairs: '', other: '',
  })
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  const totalBudget = parseAmount(totalRaw)
  const totalDisplay = formatInput(totalRaw)

  const allocated = useMemo(() => {
    if (allocationMode === 'percentage') {
      let sum = 0
      for (const key of Object.keys(categoryPcts)) {
        const pct = parseFloat(categoryPcts[key]) || 0
        sum += (pct / 100) * totalBudget
      }
      return Math.round(sum)
    }
    let sum = 0
    for (const key of Object.keys(categories)) {
      sum += parseAmount(categories[key])
    }
    return sum
  }, [categories, categoryPcts, allocationMode, totalBudget])

  const allocatedPct = useMemo(() => {
    if (allocationMode === 'percentage') {
      let sum = 0
      for (const key of Object.keys(categoryPcts)) {
        sum += parseFloat(categoryPcts[key]) || 0
      }
      return sum
    }
    return totalBudget > 0 ? (allocated / totalBudget) * 100 : 0
  }, [categoryPcts, allocationMode, allocated, totalBudget])

  const remaining = totalBudget - allocated
  const remainingPct = Math.max(0, 100 - allocatedPct)

  const canProceed = () => {
    switch (step) {
      case 1: return period !== null
      case 2: return totalBudget > 0
      case 3: return allocationMode === 'percentage' ? allocatedPct > 0 && allocatedPct <= 100 : allocated > 0 && remaining >= 0
      case 4: return alerts.length > 0
      case 5: return true
      default: return false
    }
  }

  const updateCategory = (key: string, val: string) => {
    setCategories(prev => ({ ...prev, [key]: val.replace(/[^0-9]/g, '') }))
  }

  const updateCategoryPct = (key: string, val: string) => {
    const cleaned = val.replace(/[^0-9.]/g, '')
    if ((cleaned.match(/\./g) || []).length > 1) return
    setCategoryPcts(prev => ({ ...prev, [key]: cleaned }))
    setSelectedTemplate(null)
  }

  const switchToPct = () => {
    const newPcts: Record<string, string> = {}
    for (const key of Object.keys(categories)) {
      const amt = parseAmount(categories[key])
      const pct = totalBudget > 0 ? ((amt / totalBudget) * 100).toFixed(1) : ''
      newPcts[key] = pct === '0.0' ? '' : pct
    }
    setCategoryPcts(newPcts)
    setCategories(Object.fromEntries(Object.keys(categories).map(k => [k, ''])))
    setAllocationMode('percentage')
  }

  const switchToAmount = () => {
    const newAmts: Record<string, string> = {}
    for (const key of Object.keys(categoryPcts)) {
      const pct = parseFloat(categoryPcts[key]) || 0
      const amt = totalBudget > 0 ? Math.round((pct / 100) * totalBudget) : 0
      newAmts[key] = amt > 0 ? String(amt) : ''
    }
    setCategories(newAmts)
    setCategoryPcts(Object.fromEntries(Object.keys(categoryPcts).map(k => [k, ''])))
    setAllocationMode('amount')
  }

  const applyTemplate = (templateKey: string) => {
    const tmpl = FARM_TEMPLATES.find(t => t.key === templateKey)
    if (!tmpl) return
    setCategoryPcts({ ...tmpl.allocs })
    setSelectedTemplate(templateKey)
    if (allocationMode === 'amount') {
      const newAmts: Record<string, string> = {}
      for (const key of Object.keys(tmpl.allocs) as (keyof typeof tmpl.allocs)[]) {
        const pct = parseFloat(tmpl.allocs[key]) || 0
        const amt = totalBudget > 0 ? Math.round((pct / 100) * totalBudget) : 0
        newAmts[key] = amt > 0 ? String(amt) : ''
      }
      setCategories(newAmts)
    }
  }

  const toggleAlert = (key: string) => {
    setAlerts(prev => prev.includes(key) ? prev.filter(a => a !== key) : [...prev, key])
  }

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      setSaved(true)
    }, 1200)
  }

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

  const renderPeriodStep = () => (
    <Animated.View entering={FadeInUp.duration(400).springify()} style={styles.stepContent}>
      <Text style={styles.stepTitle}>Select budget period</Text>
      <Text style={styles.stepSub}>How often does this budget repeat?</Text>
      <View style={styles.periodGrid}>
        {PERIODS.map((p) => {
          const active = period === p
          return (
            <TouchableOpacity
              key={p}
              style={[styles.periodCard, active && styles.periodCardActive]}
              activeOpacity={0.7}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.periodLabel, active && styles.periodLabelActive]}>{p}</Text>
              {active && (
                <View style={styles.periodCheck}>
                  <GoonaIcon icon={Icons.check} size={12} color="#FFF" />
                </View>
              )}
            </TouchableOpacity>
          )
        })}
      </View>
    </Animated.View>
  )

  const renderAmountStep = () => (
    <Animated.View entering={FadeInUp.duration(400).springify()} style={styles.stepContent}>
      <Text style={styles.stepTitle}>Enter total budget</Text>
      <Text style={styles.stepSub}>Set your overall budget for this period</Text>
      <View style={styles.amountCard}>
        <Text style={styles.amountLabel}>Budget Amount ({'\u20A6'})</Text>
        <View style={styles.amountRow}>
          <Text style={styles.amountPrefix}>{'\u20A6'}</Text>
          <TextInput
            style={[styles.amountInput, totalBudget > 0 && styles.amountInputValid]}
            value={totalDisplay}
            onChangeText={(v) => setTotalRaw(v.replace(/[^0-9]/g, ''))}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#CBD5E1"
            autoFocus
          />
        </View>
      </View>
      <View style={styles.amountHint}>
        <GoonaIcon icon={Icons.target} size={14} color="#2E7D32" />
        <Text style={styles.amountHintText}>
          {period ? `Your ${period.toLowerCase()} budget will be ${formatNaira(totalBudget || 0)}` : 'Select a period first'}
        </Text>
      </View>
    </Animated.View>
  )

  const renderAllocateStep = () => (
    <Animated.View entering={FadeInUp.duration(400).springify()} style={styles.stepContent}>
      <Text style={styles.stepTitle}>Allocate budget</Text>
      <Text style={styles.stepSub}>Distribute across farm expense categories</Text>

      {/* ─── ALLOCATION MODE SELECTOR ─── */}
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

      {/* ─── FARM TEMPLATES ─── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templateScroll} contentContainerStyle={styles.templateContent}>
        {FARM_TEMPLATES.map((t) => {
          const active = selectedTemplate === t.key
          return (
            <TouchableOpacity
              key={t.key}
              style={[styles.templateChip, active && styles.templateChipActive]}
              activeOpacity={0.7}
              onPress={() => applyTemplate(t.key)}
            >
              <Text style={styles.templateEmoji}>{t.emoji}</Text>
              <Text style={[styles.templateLabel, active && styles.templateLabelActive]}>{t.label}</Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>

      {/* ─── LIVE SUMMARY ─── */}
      <View style={styles.allocSummary}>
        <View style={styles.allocSummaryItem}>
          <Text style={styles.allocSummaryLabel}>Budget</Text>
          <Text style={styles.allocSummaryValue}>{formatNaira(totalBudget)}</Text>
        </View>
        <View style={styles.allocSummaryItem}>
          <Text style={styles.allocSummaryLabel}>
            {allocationMode === 'percentage' ? 'Allocated' : 'Allocated'}
          </Text>
          <Text style={styles.allocSummaryValue}>
            {allocationMode === 'percentage' ? `${allocatedPct.toFixed(1)}%` : formatNaira(allocated)}
          </Text>
        </View>
        <View style={styles.allocSummaryItem}>
          <Text style={styles.allocSummaryLabel}>Remaining</Text>
          <Text style={[styles.allocSummaryValue, remaining < 0 || allocatedPct > 100 ? { color: '#EF4444' } : { color: '#16A34A' }]}>
            {allocationMode === 'percentage' ? `${remainingPct.toFixed(1)}%` : formatNaira(Math.max(0, remaining))}
          </Text>
        </View>
      </View>

      <View style={styles.allocBarBg}>
        <View style={[styles.allocBarFill, {
          width: `${allocationMode === 'percentage' ? Math.min(allocatedPct, 100) : totalBudget > 0 ? Math.min((allocated / totalBudget) * 100, 100) : 0}%`,
          backgroundColor: allocationMode === 'percentage' ? (allocatedPct > 100 ? '#EF4444' : allocatedPct > 90 ? '#F59E0B' : '#2E7D32') : (remaining < 0 ? '#EF4444' : '#2E7D32'),
        }]} />
      </View>

      {allocationMode === 'percentage' && allocatedPct > 100 && (
        <View style={styles.allocWarning}>
          <GoonaIcon icon={Icons.alertTriangle} size={14} color="#EF4444" />
          <Text style={styles.allocWarningText}>Allocation exceeds 100% by {(allocatedPct - 100).toFixed(1)}%</Text>
        </View>
      )}

      {allocationMode === 'amount' && remaining < 0 && (
        <View style={styles.allocWarning}>
          <GoonaIcon icon={Icons.alertTriangle} size={14} color="#EF4444" />
          <Text style={styles.allocWarningText}>Allocation exceeds budget by {formatNaira(Math.abs(remaining))}</Text>
        </View>
      )}

      {/* ─── CATEGORIES ─── */}
      {CATEGORIES.map((cat, i) => {
        const pctVal = parseFloat(categoryPcts[cat.key]) || 0
        const amtVal = allocationMode === 'percentage'
          ? Math.round((pctVal / 100) * totalBudget)
          : parseAmount(categories[cat.key])
        const IconComp = cat.icon
        return (
          <Animated.View key={cat.key} entering={FadeInUp.duration(300).delay(100 + i * 60).springify()}>
            <View style={styles.allocRow}>
              <View style={styles.allocLeft}>
                <View style={[styles.allocIcon, { backgroundColor: cat.color + '15' }]}>
                  <GoonaIcon icon={IconComp} size={16} color={cat.color} />
                </View>
                <Text style={styles.allocLabel}>{cat.label}</Text>
              </View>
              <View style={styles.allocRight}>
                {allocationMode === 'percentage' ? (
                  <>
                    <View style={styles.pctInputWrap}>
                      <TextInput
                        style={styles.pctInput}
                        value={categoryPcts[cat.key]}
                        onChangeText={(v) => updateCategoryPct(cat.key, v)}
                        keyboardType="decimal-pad"
                        placeholder="0"
                        placeholderTextColor="#CBD5E1"
                      />
                      <Text style={styles.pctSuffix}>%</Text>
                    </View>
                    <Text style={styles.pctAmount}>
                      = {formatNaira(amtVal)}
                    </Text>
                  </>
                ) : (
                  <View style={styles.allocInputWrap}>
                    <Text style={styles.allocCurrency}>{'\u20A6'}</Text>
                    <TextInput
                      style={styles.allocInput}
                      value={formatInput(categories[cat.key])}
                      onChangeText={(v) => updateCategory(cat.key, v)}
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
    </Animated.View>
  )

  const renderAlertsStep = () => (
    <Animated.View entering={FadeInUp.duration(400).springify()} style={styles.stepContent}>
      <Text style={styles.stepTitle}>Configure alerts</Text>
      <Text style={styles.stepSub}>Get notified when spending patterns change</Text>
      {ALERTS.map((a, i) => {
        const active = alerts.includes(a.key)
        return (
          <Animated.View key={a.key} entering={FadeInUp.duration(300).delay(100 + i * 80).springify()}>
            <TouchableOpacity
              style={[styles.alertCard, active && styles.alertCardActive]}
              activeOpacity={0.7}
              onPress={() => toggleAlert(a.key)}
            >
              <View style={styles.alertLeft}>
                <View style={[styles.alertCheckbox, active && styles.alertCheckboxActive]}>
                  {active && <GoonaIcon icon={Icons.check} size={12} color="#FFF" />}
                </View>
                <View>
                  <Text style={styles.alertLabel}>{a.label}</Text>
                  <Text style={styles.alertDesc}>{a.desc}</Text>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        )
      })}
    </Animated.View>
  )

  const renderReviewStep = () => (
    <Animated.View entering={FadeInUp.duration(400).springify()} style={styles.stepContent}>
      <Text style={styles.stepTitle}>Review budget</Text>
      <Text style={styles.stepSub}>Confirm your budget setup</Text>

      <View style={styles.reviewCard}>
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>Period</Text>
          <Text style={styles.reviewValue}>{period}</Text>
        </View>
        <View style={styles.reviewDivider} />
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>Total Budget</Text>
          <Text style={styles.reviewValue}>{formatNaira(totalBudget)}</Text>
        </View>
        <View style={styles.reviewDivider} />
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>Allocated</Text>
          <Text style={styles.reviewValue}>{formatNaira(allocated)}</Text>
        </View>
        <View style={styles.reviewDivider} />
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>Unallocated</Text>
          <Text style={[styles.reviewValue, { color: remaining > 0 ? '#F59E0B' : '#94A3B8' }]}>
            {formatNaira(Math.max(0, remaining))}
          </Text>
        </View>
        <View style={styles.reviewDivider} />
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>Alerts</Text>
          <Text style={styles.reviewValue}>{alerts.length} active</Text>
        </View>
      </View>

      <Text style={styles.reviewNote}>
        Your {period?.toLowerCase()} budget of {formatNaira(totalBudget)} will be saved and tracked automatically.
      </Text>
    </Animated.View>
  )

  if (saved) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
        <Animated.View entering={FadeInUp.duration(500).springify()} style={styles.successWrap}>
          <View style={styles.successIcon}>
            <GoonaIcon icon={Icons.checkCircle} size={40} color="#16A34A" />
          </View>
          <Text style={styles.successTitle}>Budget saved!</Text>
          <Text style={styles.successSub}>Your {period?.toLowerCase()} budget is now active.</Text>

          <View style={styles.successSummary}>
            <View style={styles.successItem}>
              <Text style={styles.successLabel}>{period}</Text>
              <Text style={styles.successValue}>{formatNaira(totalBudget)}</Text>
            </View>
            <View style={styles.successItem}>
              <Text style={styles.successLabel}>Categories</Text>
              <Text style={styles.successValue}>{Object.keys(categories).filter(k => parseAmount(categories[k]) > 0).length}</Text>
            </View>
            <View style={styles.successItem}>
              <Text style={styles.successLabel}>Alerts</Text>
              <Text style={styles.successValue}>{alerts.length}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.successBtn}
            activeOpacity={0.8}
            onPress={() => fromRecapitalization ? router.replace('/(tabs)/recapitalization' as any) : router.back()}
          >
            <Text style={styles.successBtnText}>{fromRecapitalization ? 'Back to Recapitalization' : 'Back to Budget'}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    )
  }

  const renderStep = () => {
    switch (step) {
      case 1: return renderPeriodStep()
      case 2: return renderAmountStep()
      case 3: return renderAllocateStep()
      case 4: return renderAlertsStep()
      case 5: return renderReviewStep()
      default: return null
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollInner, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ─── HEADER ─── */}
        <Animated.View entering={FadeInUp.duration(500).springify()} style={styles.topNav}>
          <TouchableOpacity
            style={styles.navBack}
            activeOpacity={0.7}
            onPress={() => {
              if (step > 1) {
                setStep(step - 1)
              } else if (fromRecapitalization) {
                router.replace('/(tabs)/recapitalization' as any)
              } else if (router.canGoBack()) {
                router.back()
              } else {
                router.replace('/records/expenses/budget' as any)
              }
            }}
          >
            <GoonaIcon icon={Icons.arrowLeft} size={24} color="#1B1B1B" />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Set Budget</Text>
          <View style={{ width: 40 }} />
        </Animated.View>

        {/* ─── STEP INDICATOR ─── */}
        {renderStepIndicator()}

        {/* ─── STEP CONTENT ─── */}
        {renderStep()}
      </ScrollView>

      {/* ─── BOTTOM NAV ─── */}
      <Animated.View entering={FadeInUp.duration(400).springify()} style={[styles.bottomNav, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.backStepBtn, step === 1 && styles.backStepBtnHidden]}
          activeOpacity={0.7}
          onPress={() => setStep(Math.max(1, step - 1))}
        >
          <Text style={styles.backStepText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.nextBtn, !canProceed() && styles.nextBtnDisabled]}
          activeOpacity={0.8}
          disabled={!canProceed()}
          onPress={() => {
            if (step < 5) setStep(step + 1)
            else handleSave()
          }}
        >
          <Text style={styles.nextBtnText}>
            {step < 5 ? 'Continue' : saving ? 'Saving...' : 'Save Budget'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF7',
  },
  scroll: {
    flex: 1,
  },
  scrollInner: {
    paddingBottom: 120,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 52,
  },
  navBack: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B1B1B',
    letterSpacing: -0.3,
  },

  // ─── STEP INDICATOR ───
  stepRow: {
    flexDirection: 'row', alignItems: 'center', marginVertical: 16, paddingHorizontal: 8,
  },
  stepGroup: {
    flexDirection: 'row', alignItems: 'center', flexShrink: 0,
  },
  stepDot: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#F1F5F1',
    alignItems: 'center', justifyContent: 'center',
  },
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

  // ─── STEP CONTENT ───
  stepContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1B1B1B',
    marginBottom: 6,
  },
  stepSub: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
    lineHeight: 20,
  },

  // ─── PERIOD STEP ───
  periodGrid: {
    gap: 10,
  },
  periodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  periodCardActive: {
    borderColor: '#2E7D32',
    backgroundColor: '#F0FDF4',
  },
  periodLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B1B1B',
  },
  periodLabelActive: {
    color: '#2E7D32',
  },
  periodCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ─── AMOUNT STEP ───
  amountCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  amountLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 12,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountPrefix: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1B1B1B',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '800',
    color: '#1B1B1B',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  amountInputValid: {
    color: '#2E7D32',
  },
  amountHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 12,
  },
  amountHintText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '600',
    flex: 1,
  },

  // ─── ALLOCATE STEP ───
  allocSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  allocSummaryItem: {
    alignItems: 'center',
  },
  allocSummaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 4,
  },
  allocSummaryValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1B1B1B',
  },
  allocBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
    marginBottom: 12,
  },
  allocBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#2E7D32',
  },
  allocWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  allocWarningText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
    flex: 1,
  },
  allocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  allocLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  allocIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allocLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1B1B1B',
  },
  allocInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAF7',
    borderRadius: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  allocCurrency: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8',
    marginRight: 4,
  },
  allocInput: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1B1B1B',
    textAlign: 'right',
    minWidth: 80,
    paddingVertical: 8,
  },
  allocRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pctInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(46,125,50,0.2)',
  },
  pctInput: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1B1B1B',
    textAlign: 'right',
    minWidth: 44,
    paddingVertical: 6,
  },
  pctSuffix: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2E7D32',
    marginLeft: 2,
  },
  pctAmount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },

  // ─── MODE TOGGLE ───
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
  },
  modeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modeOptionActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  modeRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeRadioActive: {
    borderColor: '#2E7D32',
  },
  modeRadioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2E7D32',
  },
  modeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  modeLabelActive: {
    color: '#1B1B1B',
    fontWeight: '700',
  },

  // ─── FARM TEMPLATES ───
  templateScroll: {
    marginBottom: 16,
    marginHorizontal: -20,
  },
  templateContent: {
    paddingHorizontal: 20,
    gap: 8,
    flexDirection: 'row',
  },
  templateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  templateChipActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#2E7D32',
  },
  templateEmoji: {
    fontSize: 16,
  },
  templateLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  templateLabelActive: {
    color: '#2E7D32',
    fontWeight: '700',
  },

  // ─── ALERTS STEP ───
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  alertCardActive: {
    borderColor: '#2E7D32',
    backgroundColor: '#F0FDF4',
  },
  alertLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  alertCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertCheckboxActive: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  alertLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1B1B1B',
  },
  alertDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },

  // ─── REVIEW STEP ───
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  reviewLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  reviewValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1B1B1B',
  },
  reviewDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  reviewNote: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 10,
  },

  // ─── SUCCESS ───
  successWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1B1B1B',
    marginBottom: 8,
  },
  successSub: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  successSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
  },
  successItem: {
    alignItems: 'center',
  },
  successLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 4,
  },
  successValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1B1B1B',
  },
  successBtn: {
    width: '100%',
    backgroundColor: '#2E7D32',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  successBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ─── BOTTOM NAV ───
  bottomNav: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 12,
  },
  backStepBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  backStepBtnHidden: {
    opacity: 0,
  },
  backStepText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748B',
  },
  nextBtn: {
    flex: 2,
    backgroundColor: '#2E7D32',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  nextBtnDisabled: {
    opacity: 0.5,
  },
  nextBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
})
