import React, { useState, useMemo, useEffect, useRef } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, Alert,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import GoonaIcon from '../../../components/ui/GoonaIcon'
import { Icons } from '../../../shared/icons'
import Animated, { FadeInUp, Layout } from 'react-native-reanimated'
import { formatInput, parseAmount, formatNaira } from '../../../utils/format'
import { useBudgetStore } from '../../../store/useBudgetStore'
import type {
  BudgetSpendingAlerts, BudgetTimelineAlerts,
  BudgetChannelPrefs, BudgetAiAlerts, BudgetAlertFrequency,
} from '../../../store/useBudgetStore'

const DRAFT_KEY = 'goona-budget-draft'
const CUSTOM_COLORS = ['#6366F1', '#EC4899', '#14B8A6', '#F97316', '#E11D48']
let customColorIndex = 0
function nextCustomColor() {
  const c = CUSTOM_COLORS[customColorIndex % CUSTOM_COLORS.length]
  customColorIndex++
  return c
}

const BUDGET_COLORS = [
  '#16A34A', '#1A56FF', '#8B5CF6', '#06B6D4', '#F59E0B',
  '#EF4444', '#EC4899', '#14B8A6', '#F97316', '#6366F1',
]

const BUDGET_ICONS = [
  { key: 'wallet', icon: Icons.wallet },
  { key: 'package', icon: Icons.package },
  { key: 'users', icon: Icons.users },
  { key: 'truck', icon: Icons.truck },
  { key: 'zap', icon: Icons.zap },
  { key: 'receipt', icon: Icons.receipt },
  { key: 'target', icon: Icons.target },
  { key: 'piggyBank', icon: Icons.piggyBank },
  { key: 'trendingUp', icon: Icons.trendingUp },
  { key: 'shoppingCart', icon: Icons.shoppingCart },
]

const CATEGORIES = [
  { key: 'feed', label: 'Feed', icon: Icons.package, color: '#16A34A' },
  { key: 'salaries', label: 'Salaries', icon: Icons.users, color: '#1A56FF' },
  { key: 'medication', label: 'Medication', icon: Icons.receipt, color: '#EF4444' },
  { key: 'transport', label: 'Transport', icon: Icons.truck, color: '#F59E0B' },
  { key: 'utilities', label: 'Utilities', icon: Icons.zap, color: '#8B5CF6' },
  { key: 'repairs', label: 'Repairs', icon: Icons.wrench, color: '#06B6D4' },
  { key: 'other', label: 'Other', icon: Icons.package, color: '#64748B' },
]

const FARM_TEMPLATES = [
  { key: 'broiler', label: 'Broiler Farm', emoji: '\u{1F414}', allocs: { feed: '40', salaries: '20', medication: '15', transport: '8', utilities: '7', repairs: '5', other: '5' } },
  { key: 'layer', label: 'Layer Farm', emoji: '\u{1F95A}', allocs: { feed: '35', salaries: '25', medication: '10', transport: '10', utilities: '8', repairs: '7', other: '5' } },
  { key: 'catfish', label: 'Catfish Farm', emoji: '\u{1F41F}', allocs: { feed: '45', salaries: '15', medication: '20', transport: '5', utilities: '5', repairs: '5', other: '5' } },
  { key: 'goat', label: 'Goat Farm', emoji: '\u{1F410}', allocs: { feed: '30', salaries: '25', medication: '20', transport: '10', utilities: '5', repairs: '5', other: '5' } },
  { key: 'crop', label: 'Crop Farm', emoji: '\u{1F33E}', allocs: { feed: '20', salaries: '30', medication: '10', transport: '15', utilities: '10', repairs: '10', other: '5' } },
]

const CUSTOM_CATEGORY_DEFAULTS = [
  { key: 'equipment', label: 'Equipment', color: '#6366F1' },
  { key: 'marketing', label: 'Marketing', color: '#EC4899' },
  { key: 'maintenance', label: 'Maintenance', color: '#14B8A6' },
  { key: 'insurance', label: 'Insurance', color: '#F97316' },
  { key: 'misc', label: 'Other', color: '#E11D48' },
]

const FREQUENCY_OPTIONS: { key: BudgetAlertFrequency; label: string; desc: string }[] = [
  { key: 'instant', label: 'Instant', desc: 'Real-time notifications' },
  { key: 'daily', label: 'Daily Summary', desc: 'Once per day digest' },
  { key: 'weekly', label: 'Weekly Summary', desc: 'Weekly roundup' },
  { key: 'both', label: 'Instant + Summary', desc: 'Real-time with daily digest' },
]

const STEPS = ['Info', 'Period', 'Amount', 'Allocation', 'Alerts', 'Review']

function formatDate(ts: number) {
  const d = new Date(ts)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[d.getMonth()]} ${d.getDate()}`
}

function daysBetween(a: number, b: number) {
  return Math.max(1, Math.round(Math.abs(b - a) / 86400000))
}

function AlertCard({ icon, iconColor, bgColor, title, desc, value, onToggle }: {
  icon: any; iconColor: string; bgColor: string;
  title: string; desc: string; value: boolean; onToggle: () => void;
}) {
  return (
    <View style={[alertStyles.card, { borderLeftColor: iconColor }]}>
      <View style={[alertStyles.iconWrap, { backgroundColor: bgColor }]}>
        <GoonaIcon icon={icon} size={16} color={iconColor} />
      </View>
      <View style={alertStyles.body}>
        <Text style={alertStyles.title}>{title}</Text>
        <Text style={alertStyles.desc}>{desc}</Text>
      </View>
      <View style={alertStyles.switchWrap}>
        <View
          style={[alertStyles.switch, value ? { backgroundColor: iconColor } : { backgroundColor: '#E2E8F0' }]}
        >
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onToggle}
            style={[
              alertStyles.switchThumb,
              value ? { transform: [{ translateX: 18 }], backgroundColor: '#FFFFFF' } : { transform: [{ translateX: 2 }], backgroundColor: '#FFFFFF' },
            ]}
          />
        </View>
      </View>
    </View>
  )
}

function ChannelChip({ label, icon, selected, onPress }: {
  label: string; icon: any; selected: boolean; onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[alertStyles.channelChip, selected && alertStyles.channelChipActive]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <GoonaIcon icon={icon} size={14} color={selected ? '#2E7D32' : '#94A3B8'} />
      <Text style={[alertStyles.channelText, selected && alertStyles.channelTextActive]}>{label}</Text>
    </TouchableOpacity>
  )
}

const alertStyles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: '#F1F5F9', borderLeftWidth: 3,
  },
  iconWrap: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  body: { flex: 1, marginRight: 8 },
  title: { fontSize: 14, fontWeight: '700', color: '#1B1B1B', marginBottom: 2 },
  desc: { fontSize: 11, fontWeight: '500', color: '#94A3B8', lineHeight: 15 },
  switchWrap: { width: 44, alignItems: 'center' },
  switch: {
    width: 40, height: 22, borderRadius: 11, padding: 2,
    justifyContent: 'center',
  },
  switchThumb: {
    width: 18, height: 18, borderRadius: 9, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 2, elevation: 2,
  },
  channelChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0',
  },
  channelChipActive: { backgroundColor: '#F0FDF4', borderColor: '#2E7D32' },
  channelText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  channelTextActive: { color: '#2E7D32', fontWeight: '700' },
})

export default function BudgetSetupScreen() {
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id: string }>()
  const budgets = useBudgetStore((s) => s.budgets)
  const setBudget = useBudgetStore((s) => s.setBudget)
  const updateBudget = useBudgetStore((s) => s.updateBudget)
  const existingBudget = id ? budgets.find((b) => b.id === id) : undefined
  const isEditing = !!existingBudget

  const [step, setStep] = useState(1)

  // Step 1: Basic Info
  const [name, setName] = useState(existingBudget?.name ?? '')
  const [description, setDescription] = useState(existingBudget?.description ?? '')
  const [color, setColor] = useState(existingBudget?.color ?? BUDGET_COLORS[0])
  const [iconKey, setIconKey] = useState(existingBudget?.icon ?? 'wallet')

  // Step 2: Period
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const [startDate, setStartDate] = useState(existingBudget?.startDate ?? today.getTime())
  const [endDate, setEndDate] = useState(existingBudget?.endDate ?? today.getTime() + 30 * 86400000)
  const [showStartPicker, setShowStartPicker] = useState(false)
  const [showEndPicker, setShowEndPicker] = useState(false)

  // Step 3: Amount
  const initAmt = existingBudget ? String(existingBudget.totalAmount) : ''
  const [totalRaw, setTotalRaw] = useState(initAmt)
  const [notes, setNotes] = useState(existingBudget?.notes ?? '')

  // Step 4: Categories
  const initCategories = existingBudget
    ? Object.fromEntries(CATEGORIES.map(c => [c.key, String(existingBudget.allocations.find(a => a.key === c.key)?.amount ?? '')]))
    : Object.fromEntries(CATEGORIES.map(c => [c.key, '']))
  const initCatPcts = existingBudget && existingBudget.totalAmount > 0
    ? Object.fromEntries(CATEGORIES.map(c => {
        const amt = existingBudget.allocations.find(a => a.key === c.key)?.amount ?? 0
        return [c.key, amt > 0 ? ((amt / existingBudget.totalAmount) * 100).toFixed(1) : '']
      }))
    : Object.fromEntries(CATEGORIES.map(c => [c.key, '']))
  const [categories, setCategories] = useState<Record<string, string>>(initCategories)
  const [categoryPcts, setCategoryPcts] = useState<Record<string, string>>(initCatPcts)
  const [allocationMode, setAllocationMode] = useState<'amount' | 'percentage'>('amount')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const initCustom = existingBudget
    ? existingBudget.allocations
        .filter(a => !CATEGORIES.find(c => c.key === a.key))
        .map(a => ({ key: a.key, label: a.label, color: nextCustomColor() }))
    : []
  const [customCategories, setCustomCategories] = useState<Array<{ key: string; label: string; color: string }>>(initCustom)
  const initCustomAmts = Object.fromEntries(initCustom.map(c => [c.key, String(existingBudget?.allocations.find(a => a.key === c.key)?.amount ?? '')]))
  const initCustomPcts = existingBudget && existingBudget.totalAmount > 0
    ? Object.fromEntries(initCustom.map(c => {
        const amt = existingBudget.allocations.find(a => a.key === c.key)?.amount ?? 0
        return [c.key, amt > 0 ? ((amt / existingBudget.totalAmount) * 100).toFixed(1) : '']
      }))
    : Object.fromEntries(initCustom.map(c => [c.key, '']))
  const [customCatInputs, setCustomCatInputs] = useState<Record<string, string>>(initCustomAmts)
  const [customCatPcts, setCustomCatPcts] = useState<Record<string, string>>(initCustomPcts)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [validationError, setValidationError] = useState('')
  const [draftRestored, setDraftRestored] = useState(false)
  const draftRestoredRef = useRef(false)

  const addCustomCategory = (name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    const exists = [...CATEGORIES, ...customCategories].some(c => c.label.toLowerCase() === trimmed.toLowerCase())
    if (exists) {
      Alert.alert('Duplicate', 'A category with this name already exists.')
      return
    }
    const key = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    const color = nextCustomColor()
    setCustomCategories(prev => [...prev, { key, label: trimmed, color }])
    setCustomCatInputs(prev => ({ ...prev, [key]: '' }))
    setCustomCatPcts(prev => ({ ...prev, [key]: '' }))
    setNewCategoryName('')
    setShowAddCategory(false)
  }

  const removeCustomCategory = (key: string) => {
    setCustomCategories(prev => prev.filter(c => c.key !== key))
    setCustomCatInputs(prev => {
      const next = { ...prev }
      delete next[key]
      return next
    })
    setCustomCatPcts(prev => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const allCategories = useMemo(() => {
    const custom = customCategories.map(c => {
      const found = CUSTOM_CATEGORY_DEFAULTS.find(d => d.key === c.key)
      return { ...c, icon: found ? Icons[found.key as keyof typeof Icons] ?? Icons.package : Icons.package }
    })
    return [...CATEGORIES, ...custom]
  }, [customCategories])

  const handleAutoAllocate = () => {
    const keys = allCategories.map(c => c.key)
    const allocatedKeys = keys.filter(k => {
      const amt = allocationMode === 'percentage'
        ? parseFloat(categoryPcts[k] || customCatPcts[k] || '0')
        : parseAmount(categories[k] || customCatInputs[k] || '0')
      return amt > 0
    })
    const unallocatedKeys = keys.filter(k => !allocatedKeys.includes(k))
    if (unallocatedKeys.length === 0) {
      Alert.alert('All Allocated', 'All categories already have allocations.')
      return
    }

    const totalAllocatedAmt = allocatedKeys.reduce((sum, k) => {
      const amt = allocationMode === 'percentage'
        ? Math.round((parseFloat(categoryPcts[k] || customCatPcts[k] || '0') / 100) * totalBudget)
        : parseAmount(categories[k] || customCatInputs[k] || '0')
      return sum + amt
    }, 0)

    const remainingAmt = Math.max(0, totalBudget - totalAllocatedAmt)
    const perCategory = Math.floor(remainingAmt / unallocatedKeys.length)

    if (allocationMode === 'percentage') {
      const newPcts: Record<string, string> = {}
      const remainingPct = 100 - allocatedKeys.reduce((s, k) => s + (parseFloat(categoryPcts[k] || customCatPcts[k] || '0') || 0), 0)
      const perPct = unallocatedKeys.length > 0 ? (remainingPct / unallocatedKeys.length).toFixed(1) : '0'
      for (const k of unallocatedKeys) {
        const isPredefined = !!CATEGORIES.find(c => c.key === k)
        if (isPredefined) {
          newPcts[k] = perPct
        } else {
          newPcts[k] = perPct
        }
      }
      setCategoryPcts(prev => ({ ...prev, ...newPcts }))

      const customNewPcts: Record<string, string> = {}
      for (const k of unallocatedKeys) {
        const isCustom = customCategories.some(c => c.key === k)
        if (isCustom) customNewPcts[k] = perPct
      }
      setCustomCatPcts(prev => ({ ...prev, ...customNewPcts }))
    } else {
      const newAmts: Record<string, string> = {}
      for (const k of unallocatedKeys) {
        const isPredefined = !!CATEGORIES.find(c => c.key === k)
        if (isPredefined) {
          newAmts[k] = String(perCategory)
        } else {
          newAmts[k] = String(perCategory)
        }
      }
      setCategories(prev => ({ ...prev, ...newAmts }))

      const customNewAmts: Record<string, string> = {}
      for (const k of unallocatedKeys) {
        const isCustom = customCategories.some(c => c.key === k)
        if (isCustom) customNewAmts[k] = String(perCategory)
      }
      setCustomCatInputs(prev => ({ ...prev, ...customNewAmts }))
    }
  }

  const handleSaveDraft = async () => {
    try {
      const draft = {
        name, description, color, iconKey,
        startDate, endDate,
        totalRaw, notes,
        categories, categoryPcts, allocationMode, selectedTemplate,
        customCategories, customCatInputs, customCatPcts, step,
        spendingAlerts, timelineAlerts, categoryAlertKeys,
        alertFrequency, channels, aiAlerts,
      }
      await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
      Alert.alert('Draft Saved', 'Your budget draft has been saved. You can continue later.', [
        { text: 'OK', onPress: () => router.back() }
      ])
    } catch {
      Alert.alert('Error', 'Failed to save draft.')
    }
  }

  const restoreDraft = async () => {
    if (draftRestoredRef.current || existingBudget) return
    try {
      const raw = await AsyncStorage.getItem(DRAFT_KEY)
      if (!raw) return
      const draft = JSON.parse(raw)
      setName(draft.name ?? '')
      setDescription(draft.description ?? '')
      setColor(draft.color ?? BUDGET_COLORS[0])
      setIconKey(draft.iconKey ?? 'wallet')
      setStartDate(draft.startDate ?? today.getTime())
      setEndDate(draft.endDate ?? today.getTime() + 30 * 86400000)
      setTotalRaw(draft.totalRaw ?? '')
      setNotes(draft.notes ?? '')
      setCategories(draft.categories ?? Object.fromEntries(CATEGORIES.map(c => [c.key, ''])))
      setCategoryPcts(draft.categoryPcts ?? Object.fromEntries(CATEGORIES.map(c => [c.key, ''])))
      setAllocationMode(draft.allocationMode ?? 'amount')
      setSelectedTemplate(draft.selectedTemplate ?? null)
      setCustomCategories(draft.customCategories ?? [])
      setCustomCatInputs(draft.customCatInputs ?? {})
      setCustomCatPcts(draft.customCatPcts ?? {})
      if (draft.spendingAlerts) setSpendingAlerts(draft.spendingAlerts)
      if (draft.timelineAlerts) setTimelineAlerts(draft.timelineAlerts)
      if (draft.categoryAlertKeys) setCategoryAlertKeys(draft.categoryAlertKeys)
      if (draft.alertFrequency) setAlertFrequency(draft.alertFrequency)
      if (draft.channels) setChannels(draft.channels)
      if (draft.aiAlerts) setAiAlerts(draft.aiAlerts)
      setStep(draft.step ?? 1)
      draftRestoredRef.current = true
      setDraftRestored(true)
    } catch {
      // ignore corrupt draft
    }
  }

  useEffect(() => {
    restoreDraft()
  }, [])

  // Step 5: Alerts
  const existingAlerts = existingBudget?.alerts
  const [spendingAlerts, setSpendingAlerts] = useState<BudgetSpendingAlerts>(
    existingAlerts?.spending ?? { at80: true, at90: false, exceeded: true, unusual: false }
  )
  const [timelineAlerts, setTimelineAlerts] = useState<BudgetTimelineAlerts>(
    existingAlerts?.timeline ?? { starts: false, endingSoon: true, endsTomorrow: false, completed: true }
  )
  const [categoryAlertKeys, setCategoryAlertKeys] = useState<string[]>(
    existingAlerts?.categoryAlerts ?? []
  )
  const [alertFrequency, setAlertFrequency] = useState<BudgetAlertFrequency>(
    existingAlerts?.frequency ?? 'instant'
  )
  const [channels, setChannels] = useState<BudgetChannelPrefs>(
    existingAlerts?.channels ?? { inApp: true, push: true, email: false, sms: false }
  )
  const [aiAlerts, setAiAlerts] = useState<BudgetAiAlerts>(
    existingAlerts?.ai ?? { costSaving: false, reallocation: false, trends: false, savingsOpportunities: false }
  )

  const toggleSpending = (key: keyof BudgetSpendingAlerts) => {
    setSpendingAlerts(prev => ({ ...prev, [key]: !prev[key] }))
  }
  const toggleTimeline = (key: keyof BudgetTimelineAlerts) => {
    setTimelineAlerts(prev => ({ ...prev, [key]: !prev[key] }))
  }
  const toggleCategoryAlert = (key: string) => {
    setCategoryAlertKeys(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])
  }
  const toggleChannel = (key: keyof BudgetChannelPrefs) => {
    setChannels(prev => ({ ...prev, [key]: !prev[key] }))
  }
  const toggleAi = (key: keyof BudgetAiAlerts) => {
    setAiAlerts(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const totalBudget = parseAmount(totalRaw)
  const duration = daysBetween(startDate, endDate)

  const allocated = useMemo(() => {
    if (allocationMode === 'percentage') {
      let sum = 0
      for (const key of Object.keys(categoryPcts)) {
        sum += ((parseFloat(categoryPcts[key]) || 0) / 100) * totalBudget
      }
      for (const key of Object.keys(customCatPcts)) {
        sum += ((parseFloat(customCatPcts[key]) || 0) / 100) * totalBudget
      }
      return Math.round(sum)
    }
    let sum = 0
    for (const key of Object.keys(categories)) {
      sum += parseAmount(categories[key])
    }
    for (const key of Object.keys(customCatInputs)) {
      sum += parseAmount(customCatInputs[key])
    }
    return sum
  }, [categories, categoryPcts, customCatInputs, customCatPcts, allocationMode, totalBudget])

  const allocatedPct = useMemo(() => {
    if (allocationMode === 'percentage') {
      const pctSum = Object.values(categoryPcts).reduce((s, v) => s + (parseFloat(v) || 0), 0) +
        Object.values(customCatPcts).reduce((s, v) => s + (parseFloat(v) || 0), 0)
      return pctSum
    }
    return totalBudget > 0 ? (allocated / totalBudget) * 100 : 0
  }, [categoryPcts, customCatPcts, allocationMode, allocated, totalBudget])

  const remaining = totalBudget - allocated

  const canProceed = () => {
    switch (step) {
      case 1: return name.trim().length > 0
      case 2: return endDate > startDate
      case 3: return totalBudget > 0
      case 4:
        if (allocationMode === 'percentage') return allocatedPct > 0 && allocatedPct <= 100
        return allocated > 0 && remaining >= 0
      case 5: return true
      case 6: return true
      default: return false
    }
  }

  useEffect(() => {
    if (step === 4) {
      if (remaining < 0) {
        setValidationError('Allocated amount exceeds the available budget.')
      } else if (allocated <= 0) {
        setValidationError('')
      } else if (allocationMode === 'percentage' && allocatedPct > 100) {
        setValidationError('Allocated percentage exceeds 100%.')
      } else {
        setValidationError('')
      }
    } else {
      setValidationError('')
    }
  }, [allocated, remaining, allocatedPct, step, allocationMode])

  const isCustomKey = (key: string) => customCategories.some(c => c.key === key)

  const updateCategory = (key: string, val: string) => {
    const cleaned = val.replace(/[^0-9]/g, '')
    if (isCustomKey(key)) {
      setCustomCatInputs(prev => ({ ...prev, [key]: cleaned }))
    } else {
      setCategories(prev => ({ ...prev, [key]: cleaned }))
    }
  }

  const updateCategoryPct = (key: string, val: string) => {
    const cleaned = val.replace(/[^0-9.]/g, '')
    if ((cleaned.match(/\./g) || []).length > 1) return
    if (isCustomKey(key)) {
      setCustomCatPcts(prev => ({ ...prev, [key]: cleaned }))
    } else {
      setCategoryPcts(prev => ({ ...prev, [key]: cleaned }))
    }
    setSelectedTemplate(null)
  }

  const switchToPct = () => {
    const predefinedKeys = Object.keys(categories)
    const customKeys = Object.keys(customCatInputs)

    const newPredefinedPcts: Record<string, string> = {}
    for (const key of predefinedKeys) {
      const amt = parseAmount(categories[key])
      const pct = totalBudget > 0 ? ((amt / totalBudget) * 100).toFixed(1) : ''
      newPredefinedPcts[key] = pct === '0.0' ? '' : pct
    }

    const newCustomPcts: Record<string, string> = {}
    for (const key of customKeys) {
      const amt = parseAmount(customCatInputs[key])
      const pct = totalBudget > 0 ? ((amt / totalBudget) * 100).toFixed(1) : ''
      newCustomPcts[key] = pct === '0.0' ? '' : pct
    }

    setCategoryPcts(newPredefinedPcts)
    setCustomCatPcts(newCustomPcts)
    setCategories(Object.fromEntries(predefinedKeys.map(k => [k, ''])))
    setCustomCatInputs(Object.fromEntries(customKeys.map(k => [k, ''])))
    setAllocationMode('percentage')
  }

  const switchToAmount = () => {
    const predefinedPctKeys = Object.keys(categoryPcts)
    const customPctKeys = Object.keys(customCatPcts)

    const newPredefinedAmts: Record<string, string> = {}
    for (const key of predefinedPctKeys) {
      const pct = parseFloat(categoryPcts[key]) || 0
      const amt = totalBudget > 0 ? Math.round((pct / 100) * totalBudget) : 0
      newPredefinedAmts[key] = amt > 0 ? String(amt) : ''
    }

    const newCustomAmts: Record<string, string> = {}
    for (const key of customPctKeys) {
      const pct = parseFloat(customCatPcts[key]) || 0
      const amt = totalBudget > 0 ? Math.round((pct / 100) * totalBudget) : 0
      newCustomAmts[key] = amt > 0 ? String(amt) : ''
    }

    setCategories(newPredefinedAmts)
    setCustomCatInputs(newCustomAmts)
    setCategoryPcts(Object.fromEntries(predefinedPctKeys.map(k => [k, ''])))
    setCustomCatPcts(Object.fromEntries(customPctKeys.map(k => [k, ''])))
    setAllocationMode('amount')
  }

  const applyTemplate = (templateKey: string) => {
    const tmpl = FARM_TEMPLATES.find(t => t.key === templateKey)
    if (!tmpl) return
    setSelectedTemplate(templateKey)
    setCustomCategories([])
    setCustomCatInputs({})
    setCustomCatPcts({})
    if (allocationMode === 'percentage') {
      setCategoryPcts({ ...tmpl.allocs } as Record<string, string>)
      setCategories(Object.fromEntries(CATEGORIES.map(c => [c.key, ''])))
    } else {
      const newAmts: Record<string, string> = {}
      for (const key of Object.keys(tmpl.allocs)) {
        const pct = parseFloat((tmpl.allocs as any)[key]) || 0
        const amt = totalBudget > 0 ? Math.round((pct / 100) * totalBudget) : 0
        newAmts[key] = amt > 0 ? String(amt) : ''
      }
      setCategories(newAmts)
      setCategoryPcts(Object.fromEntries(CATEGORIES.map(c => [c.key, ''])))
    }
  }

  const handleSave = () => {
    setSaving(true)

    const predefinedAllocations = CATEGORIES.map(c => {
      const amount = allocationMode === 'percentage'
        ? Math.round((parseFloat(categoryPcts[c.key]) || 0) / 100 * totalBudget)
        : parseAmount(categories[c.key])
      return { key: c.key, label: c.label, amount }
    }).filter(c => c.amount > 0)

    const customAllocations = customCategories.map(c => {
      const amount = allocationMode === 'percentage'
        ? Math.round((parseFloat(customCatPcts[c.key]) || 0) / 100 * totalBudget)
        : parseAmount(customCatInputs[c.key] || '0')
      return { key: c.key, label: c.label, amount }
    }).filter(c => c.amount > 0)

    const allocations = [...predefinedAllocations, ...customAllocations]

    const iconEntry = BUDGET_ICONS.find(i => i.key === iconKey)
    const iconName = iconEntry ? iconEntry.key : 'wallet'

    setTimeout(async () => {
      const data: Parameters<typeof setBudget>[0] = {
        name: name.trim(),
        description: description.trim(),
        color,
        icon: iconName,
        period: `${formatDate(startDate)} – ${formatDate(endDate)}`,
        totalAmount: totalBudget,
        allocations: allocations.length > 0 ? allocations : CATEGORIES.map(c => ({ key: c.key, label: c.label, amount: 0 })),
        alerts: {
          spending: spendingAlerts,
          timeline: timelineAlerts,
          categoryAlerts: categoryAlertKeys,
          frequency: alertFrequency,
          channels,
          ai: aiAlerts,
        },
        startDate,
        endDate,
        notes: notes.trim(),
        spent: existingBudget?.spent ?? 0,
      }

      if (isEditing && existingBudget) {
        updateBudget(existingBudget.id, data)
      } else {
        setBudget(data)
      }

      await AsyncStorage.removeItem(DRAFT_KEY)

      setSaving(false)
      setSaved(true)
    }, 400)
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

  const renderInfoStep = () => (
    <Animated.View entering={FadeInUp.duration(400).springify()} style={styles.stepContent}>
      <Text style={styles.stepTitle}>Basic Information</Text>
      <Text style={styles.stepSub}>Give your budget a name and identity</Text>

      <View style={styles.fieldCard}>
        <Text style={styles.fieldLabel}>Budget Name *</Text>
        <TextInput
          style={styles.textInput}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Poultry Feed Budget"
          placeholderTextColor="#CBD5E1"
          autoFocus
        />
      </View>

      <View style={styles.fieldCard}>
        <Text style={styles.fieldLabel}>Description (optional)</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="What is this budget for?"
          placeholderTextColor="#CBD5E1"
          multiline
          numberOfLines={3}
        />
      </View>

      <Text style={styles.sectionLabel}>Budget Color</Text>
      <View style={styles.colorGrid}>
        {BUDGET_COLORS.map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.colorSwatch, { backgroundColor: c }, color === c && styles.colorSwatchActive]}
            activeOpacity={0.7}
            onPress={() => setColor(c)}
          >
            {color === c && <GoonaIcon icon={Icons.check} size={14} color="#FFF" />}
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Budget Icon</Text>
      <View style={styles.iconGrid}>
        {BUDGET_ICONS.map((ic) => {
          const active = iconKey === ic.key
          const IconComp = ic.icon
          return (
            <TouchableOpacity
              key={ic.key}
              style={[styles.iconOption, active && styles.iconOptionActive]}
              activeOpacity={0.7}
              onPress={() => setIconKey(ic.key)}
            >
              <GoonaIcon icon={IconComp} size={20} color={active ? color : '#64748B'} />
            </TouchableOpacity>
          )
        })}
      </View>
    </Animated.View>
  )

  const renderPeriodStep = () => (
    <Animated.View entering={FadeInUp.duration(400).springify()} style={styles.stepContent}>
      <Text style={styles.stepTitle}>Budget Period</Text>
      <Text style={styles.stepSub}>Set the start and end dates</Text>

      <View style={styles.dateCard}>
        <View style={styles.dateRow}>
          <View style={styles.dateCol}>
            <Text style={styles.dateLabel}>Start Date</Text>
            <TouchableOpacity
              style={styles.dateBtn}
              activeOpacity={0.7}
              onPress={() => setShowStartPicker(true)}
            >
              <GoonaIcon icon={Icons.calendar} size={16} color="#2E7D32" />
              <Text style={styles.dateBtnText}>{formatDate(startDate)}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.dateArrow}>
            <GoonaIcon icon={Icons.arrowRight} size={16} color="#CBD5E1" />
          </View>
          <View style={styles.dateCol}>
            <Text style={styles.dateLabel}>End Date</Text>
            <TouchableOpacity
              style={styles.dateBtn}
              activeOpacity={0.7}
              onPress={() => setShowEndPicker(true)}
            >
              <GoonaIcon icon={Icons.calendar} size={16} color="#EF4444" />
              <Text style={styles.dateBtnText}>{formatDate(endDate)}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.durationBadge}>
          <GoonaIcon icon={Icons.clock} size={14} color="#2E7D32" />
          <Text style={styles.durationText}>{duration} day{duration > 1 ? 's' : ''}</Text>
        </View>
      </View>

      {showStartPicker && (
        <View style={styles.quickDateGrid}>
          {[-14, -7, 0, 7, 14].map(offset => {
            const d = new Date(today.getTime() + offset * 86400000)
            const label = offset === 0 ? 'Today' : offset < 0 ? `${Math.abs(offset)}d ago` : `${offset}d later`
            return (
              <TouchableOpacity
                key={String(offset)}
                style={[styles.quickDateBtn, startDate === d.getTime() && styles.quickDateBtnActive]}
                onPress={() => {
                  setStartDate(d.getTime())
                  if (endDate <= d.getTime()) setEndDate(d.getTime() + 30 * 86400000)
                  setShowStartPicker(false)
                }}
              >
                <Text style={[styles.quickDateText, startDate === d.getTime() && styles.quickDateTextActive]}>{label}</Text>
                <Text style={[styles.quickDateSub, startDate === d.getTime() && styles.quickDateTextActive]}>{formatDate(d.getTime())}</Text>
              </TouchableOpacity>
            )
          })}
        </View>
      )}

      {showEndPicker && (
        <View style={styles.quickDateGrid}>
          {[7, 14, 30, 60, 90].map(offset => {
            const d = new Date(startDate + offset * 86400000)
            return (
              <TouchableOpacity
                key={String(offset)}
                style={[styles.quickDateBtn, endDate === d.getTime() && styles.quickDateBtnActive]}
                onPress={() => { setEndDate(d.getTime()); setShowEndPicker(false) }}
              >
                <Text style={[styles.quickDateText, endDate === d.getTime() && styles.quickDateTextActive]}>{offset} days</Text>
                <Text style={[styles.quickDateSub, endDate === d.getTime() && styles.quickDateTextActive]}>{formatDate(d.getTime())}</Text>
              </TouchableOpacity>
            )
          })}
        </View>
      )}
    </Animated.View>
  )

  const renderAmountStep = () => (
    <Animated.View entering={FadeInUp.duration(400).springify()} style={styles.stepContent}>
      <Text style={styles.stepTitle}>Budget Amount</Text>
      <Text style={styles.stepSub}>Set your total budget for this period</Text>

      <View style={styles.fieldCard}>
        <Text style={styles.fieldLabel}>Total Budget</Text>
        <View style={styles.amountRow}>
          <Text style={styles.amountPrefix}>{'\u20A6'}</Text>
          <TextInput
            style={[styles.amountInput, totalBudget > 0 && styles.amountInputValid]}
            value={formatInput(totalRaw)}
            onChangeText={(v) => setTotalRaw(v.replace(/[^0-9]/g, ''))}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#CBD5E1"
          />
        </View>
      </View>

      <View style={styles.fieldCard}>
        <Text style={styles.fieldLabel}>Notes (optional)</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Add notes about this budget"
          placeholderTextColor="#CBD5E1"
          multiline
          numberOfLines={3}
        />
      </View>

      {totalBudget > 0 && (
        <View style={styles.amountHint}>
          <GoonaIcon icon={Icons.target} size={14} color="#2E7D32" />
          <Text style={styles.amountHintText}>
            {formatNaira(totalBudget)} over {duration} days = {formatNaira(Math.round(totalBudget / duration))}/day
          </Text>
        </View>
      )}
    </Animated.View>
  )

  const renderCategoryStep = () => (
    <Animated.View entering={FadeInUp.duration(400).springify()} style={styles.stepContent}>
      <View style={styles.stepHeaderRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.stepTitle}>Budget Categories</Text>
          <Text style={styles.stepSub}>Allocate funds across expense categories</Text>
        </View>
        <TouchableOpacity
          style={styles.skipBtn}
          activeOpacity={0.7}
          onPress={() => setStep(Math.min(6, step + 1))}
        >
          <Text style={styles.skipBtnText}>Skip</Text>
        </TouchableOpacity>
      </View>
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

          <View style={styles.allocBarBg}>
            <View style={[styles.allocBarFill, {
              width: `${allocationMode === 'percentage' ? Math.min(allocatedPct, 100) : totalBudget > 0 ? Math.min((allocated / totalBudget) * 100, 100) : 0}%`,
              backgroundColor: remaining < 0 ? '#EF4444' : allocatedPct > 90 ? '#F59E0B' : '#2E7D32',
            }]} />
          </View>

          {allCategories.map((cat, i) => {
            const isCustom = isCustomKey(cat.key)
            const pctVal = parseFloat(isCustom ? customCatPcts[cat.key] || '0' : categoryPcts[cat.key] || '0') || 0
            const amtVal = allocationMode === 'percentage'
              ? Math.round((pctVal / 100) * totalBudget)
              : parseAmount(isCustom ? customCatInputs[cat.key] || '0' : categories[cat.key] || '0')
            const IconComp = cat.icon
            return (
              <Animated.View key={cat.key} entering={FadeInUp.duration(250).delay(100 + i * 50).springify()} layout={Layout.springify()}>
                <View style={styles.allocRow}>
                  <View style={styles.allocLeft}>
                    <View style={[styles.allocIcon, { backgroundColor: cat.color + '15' }]}>
                      <GoonaIcon icon={IconComp} size={16} color={cat.color} />
                    </View>
                    <Text style={styles.allocLabel}>{cat.label}</Text>
                    {isCustom && (
                      <TouchableOpacity
                        style={styles.removeCatBtn}
                        activeOpacity={0.6}
                        onPress={() => removeCustomCategory(cat.key)}
                      >
                        <GoonaIcon icon={Icons.x} size={12} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                  <View style={styles.allocRight}>
                    {allocationMode === 'percentage' ? (
                      <>
                        <View style={styles.pctInputWrap}>
                          <TextInput
                            style={styles.pctInput}
                            value={isCustom ? customCatPcts[cat.key] || '' : categoryPcts[cat.key]}
                            onChangeText={(v) => updateCategoryPct(cat.key, v)}
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
                          value={formatInput(isCustom ? customCatInputs[cat.key] || '' : categories[cat.key])}
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

          {/* Add Category */}
          <Animated.View entering={FadeInUp.duration(300).springify()}>
            {showAddCategory ? (
              <View style={styles.addCatCard}>
                <TextInput
                  style={styles.addCatInput}
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                  placeholder="Category name"
                  placeholderTextColor="#CBD5E1"
                  autoFocus
                />
                <View style={styles.addCatActions}>
                  <TouchableOpacity
                    style={styles.addCatCancelBtn}
                    activeOpacity={0.7}
                    onPress={() => { setShowAddCategory(false); setNewCategoryName('') }}
                  >
                    <Text style={styles.addCatCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.addCatConfirmBtn, !newCategoryName.trim() && { opacity: 0.5 }]}
                    activeOpacity={0.8}
                    disabled={!newCategoryName.trim()}
                    onPress={() => addCustomCategory(newCategoryName)}
                  >
                    <GoonaIcon icon={Icons.plus} size={14} color="#FFF" />
                    <Text style={styles.addCatConfirmText}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addCatBtn}
                activeOpacity={0.7}
                onPress={() => setShowAddCategory(true)}
              >
                <View style={styles.addCatBtnIcon}>
                  <GoonaIcon icon={Icons.plus} size={16} color="#2E7D32" />
                </View>
                <Text style={styles.addCatBtnText}>Add Category</Text>
              </TouchableOpacity>
            )}
          </Animated.View>

          {/* Auto Allocate + Error */}
          <View style={styles.allocFooter}>
            <TouchableOpacity
              style={styles.autoAllocBtn}
              activeOpacity={0.7}
              onPress={handleAutoAllocate}
            >
              <GoonaIcon icon={Icons.sparkles} size={14} color="#2E7D32" />
              <Text style={styles.autoAllocText}>Auto Allocate</Text>
            </TouchableOpacity>
          </View>

          {validationError ? (
            <Animated.View entering={FadeInUp.duration(300).springify()} style={styles.errorCard}>
              <GoonaIcon icon={Icons.alertTriangle} size={16} color="#EF4444" />
              <Text style={styles.errorText}>{validationError}</Text>
            </Animated.View>
          ) : null}
    </Animated.View>
  )

  const renderAlertsStep = () => (
    <Animated.View entering={FadeInUp.duration(400).springify()} style={styles.stepContent}>
      <Text style={styles.stepTitle}>Alerts & Reminders</Text>
      <Text style={styles.stepSub}>Configure how you want to monitor this budget</Text>

      {/* Spending Alerts */}
      <Text style={styles.alertSectionTitle}>
        <GoonaIcon icon={Icons.trendingUp} size={14} color="#1B1B1B" /> Spending Alerts
      </Text>
      <Text style={styles.alertSectionSub}>Get notified as spending approaches your limits</Text>

      <AlertCard
        icon={Icons.barChart} iconColor="#16A34A" bgColor="#F0FDF4"
        title="80% Budget Used"
        desc="Notify me when spending reaches 80% of this budget."
        value={spendingAlerts.at80}
        onToggle={() => toggleSpending('at80')}
      />
      <AlertCard
        icon={Icons.alertTriangle} iconColor="#F59E0B" bgColor="#FFFBEB"
        title="90% Budget Used"
        desc="Warn me before the budget limit is reached."
        value={spendingAlerts.at90}
        onToggle={() => toggleSpending('at90')}
      />
      <AlertCard
        icon={Icons.alertOctagon} iconColor="#EF4444" bgColor="#FEF2F2"
        title="Budget Exceeded"
        desc="Alert me immediately when spending exceeds the allocated budget."
        value={spendingAlerts.exceeded}
        onToggle={() => toggleSpending('exceeded')}
      />
      <AlertCard
        icon={Icons.search} iconColor="#8B5CF6" bgColor="#F5F3FF"
        title="Unusual Spending"
        desc="Detect abnormal or unexpected spending patterns."
        value={spendingAlerts.unusual}
        onToggle={() => toggleSpending('unusual')}
      />

      {/* Timeline Reminders */}
      <Text style={[styles.alertSectionTitle, { marginTop: 24 }]}>
        <GoonaIcon icon={Icons.clock} size={14} color="#1B1B1B" /> Schedule Reminders
      </Text>
      <Text style={styles.alertSectionSub}>Get reminders based on your budget timeline</Text>

      <AlertCard
        icon={Icons.play} iconColor="#3B82F6" bgColor="#EFF6FF"
        title="Budget Starts Today"
        desc="Notify me when this budget becomes active."
        value={timelineAlerts.starts}
        onToggle={() => toggleTimeline('starts')}
      />
      <AlertCard
        icon={Icons.clock} iconColor="#F59E0B" bgColor="#FFFBEB"
        title="Budget Ending Soon"
        desc="Remind me 7 days before the budget ends."
        value={timelineAlerts.endingSoon}
        onToggle={() => toggleTimeline('endingSoon')}
      />
      <AlertCard
        icon={Icons.alertCircle} iconColor="#EF4444" bgColor="#FEF2F2"
        title="Budget Ends Tomorrow"
        desc="Send a reminder one day before the budget expires."
        value={timelineAlerts.endsTomorrow}
        onToggle={() => toggleTimeline('endsTomorrow')}
      />
      <AlertCard
        icon={Icons.checkCircle} iconColor="#16A34A" bgColor="#F0FDF4"
        title="Budget Completed"
        desc="Notify me when the budget reaches its end date."
        value={timelineAlerts.completed}
        onToggle={() => toggleTimeline('completed')}
      />

      {/* Category Monitoring */}
      {allCategories.length > 0 && (
        <>
          <Text style={[styles.alertSectionTitle, { marginTop: 24 }]}>
            <GoonaIcon icon={Icons.listChecks} size={14} color="#1B1B1B" /> Category Monitoring
          </Text>
          <Text style={styles.alertSectionSub}>Track individual expense categories</Text>
          {allCategories.map((cat) => (
            <AlertCard
              key={cat.key}
              icon={cat.icon} iconColor={cat.color} bgColor={cat.color + '15'}
              title={cat.label}
              desc={`Get notified when ${cat.label.toLowerCase()} approaches its limit.`}
              value={categoryAlertKeys.includes(cat.key)}
              onToggle={() => toggleCategoryAlert(cat.key)}
            />
          ))}
        </>
      )}

      {/* Notification Preferences */}
      <Text style={[styles.alertSectionTitle, { marginTop: 24 }]}>
        <GoonaIcon icon={Icons.bell} size={14} color="#1B1B1B" /> Notification Preferences
      </Text>
      <Text style={styles.alertSectionSub}>Choose how often you want to receive updates</Text>

      <View style={styles.freqGrid}>
        {FREQUENCY_OPTIONS.map((opt) => {
          const active = alertFrequency === opt.key
          return (
            <TouchableOpacity
              key={opt.key}
              style={[styles.freqCard, active && styles.freqCardActive]}
              activeOpacity={0.7}
              onPress={() => setAlertFrequency(opt.key)}
            >
              <View style={[styles.freqRadio, active && styles.freqRadioActive]}>
                {active && <View style={styles.freqRadioInner} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.freqLabel, active && styles.freqLabelActive]}>{opt.label}</Text>
                <Text style={styles.freqDesc}>{opt.desc}</Text>
              </View>
            </TouchableOpacity>
          )
        })}
      </View>

      <Text style={[styles.alertSectionSub, { marginTop: 16 }]}>Delivery channels</Text>
      <View style={styles.channelGrid}>
        <ChannelChip label="In-App" icon={Icons.smartphone} selected={channels.inApp} onPress={() => toggleChannel('inApp')} />
        <ChannelChip label="Push" icon={Icons.bell} selected={channels.push} onPress={() => toggleChannel('push')} />
        <ChannelChip label="Email" icon={Icons.mail} selected={channels.email} onPress={() => toggleChannel('email')} />
        <ChannelChip label="SMS" icon={Icons.messageSquare} selected={channels.sms} onPress={() => toggleChannel('sms')} />
      </View>

      {/* Smart AI Insights */}
      <Text style={[styles.alertSectionTitle, { marginTop: 24 }]}>
        <GoonaIcon icon={Icons.sparkles} size={14} color="#1B1B1B" /> Goona Smart Budget Assistant
      </Text>
      <Text style={styles.alertSectionSub}>AI-powered insights to optimize your budget</Text>

      <AlertCard
        icon={Icons.lightbulb} iconColor="#F59E0B" bgColor="#FFFBEB"
        title="Suggest Cost-Saving Opportunities"
        desc="Identify areas where you can reduce spending."
        value={aiAlerts.costSaving}
        onToggle={() => toggleAi('costSaving')}
      />
      <AlertCard
        icon={Icons.refreshCw} iconColor="#8B5CF6" bgColor="#F5F3FF"
        title="Recommend Budget Reallocations"
        desc="Get suggestions to rebalance your categories."
        value={aiAlerts.reallocation}
        onToggle={() => toggleAi('reallocation')}
      />
      <AlertCard
        icon={Icons.trendingUp} iconColor="#3B82F6" bgColor="#EFF6FF"
        title="Notify Me of Spending Trends"
        desc="Alert me when spending patterns change significantly."
        value={aiAlerts.trends}
        onToggle={() => toggleAi('trends')}
      />
      <AlertCard
        icon={Icons.target} iconColor="#16A34A" bgColor="#F0FDF4"
        title="Alert Me When Savings Are Detected"
        desc="Notify me when there are opportunities to save money."
        value={aiAlerts.savingsOpportunities}
        onToggle={() => toggleAi('savingsOpportunities')}
      />
    </Animated.View>
  )

  const renderReviewStep = () => {
    const dailySpend = duration > 0 ? Math.round(totalBudget / duration) : totalBudget

    return (
      <Animated.View entering={FadeInUp.duration(400).springify()} style={styles.stepContent}>
        <Text style={styles.stepTitle}>Review Budget</Text>
        <Text style={styles.stepSub}>Confirm your budget setup</Text>

        <View style={styles.reviewCard}>
          <View style={[styles.reviewColorBar, { backgroundColor: color }]} />
          <View style={styles.reviewBody}>
            <View style={styles.reviewHeaderRow}>
              <GoonaIcon icon={BUDGET_ICONS.find(i => i.key === iconKey)?.icon ?? Icons.wallet} size={20} color={color} />
              <Text style={styles.reviewName}>{name}</Text>
            </View>

            {description ? <Text style={styles.reviewDesc}>{description}</Text> : null}

            <View style={styles.reviewDivider} />

            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Period</Text>
              <Text style={styles.reviewValue}>{formatDate(startDate)} — {formatDate(endDate)}</Text>
            </View>
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Duration</Text>
              <Text style={styles.reviewValue}>{duration} days</Text>
            </View>
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Total Budget</Text>
              <Text style={styles.reviewValue}>{formatNaira(totalBudget)}</Text>
            </View>
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Allocated</Text>
              <Text style={styles.reviewValue}>{formatNaira(allocated)}</Text>
            </View>
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Categories</Text>
              <Text style={styles.reviewValue}>
                {`${allCategories.filter(c => {
                const isCustom = isCustomKey(c.key)
                const amt = isCustom ? parseAmount(customCatInputs[c.key] || '0') : parseAmount(categories[c.key] || '0')
                const pct = isCustom ? parseFloat(customCatPcts[c.key] || '0') : parseFloat(categoryPcts[c.key] || '0')
                return amt > 0 || pct > 0
              }).length} categories`}
              </Text>
            </View>
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Alerts</Text>
              <Text style={styles.reviewValue}>
                {[spendingAlerts.at80 && '80%', spendingAlerts.at90 && '90%', spendingAlerts.exceeded && 'Exceeded', spendingAlerts.unusual && 'Unusual']
                  .filter(Boolean).length + timelineAlerts.endingSoon + timelineAlerts.completed ? 'Active' : 'Minimal'}
              </Text>
            </View>
            <View style={styles.reviewDivider} />
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Est. Daily Spending</Text>
              <Text style={[styles.reviewValue, { color: '#2E7D32' }]}>{formatNaira(dailySpend)}/day</Text>
            </View>
          </View>
        </View>
      </Animated.View>
    )
  }

  if (saved) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
        <Animated.View entering={FadeInUp.duration(500).springify()} style={styles.successWrap}>
          <View style={[styles.successIcon, { backgroundColor: color + '20' }]}>
            <GoonaIcon icon={Icons.checkCircle} size={40} color={color} />
          </View>
          <Text style={styles.successTitle}>{isEditing ? 'Budget Updated!' : 'Budget Created!'}</Text>
          <Text style={styles.successSub}>{isEditing ? `${name} has been updated.` : `${name} is now active.`}</Text>

          <View style={styles.successSummary}>
            <View style={styles.successItem}>
              <Text style={styles.successLabel}>Amount</Text>
              <Text style={styles.successValue}>{formatNaira(totalBudget)}</Text>
            </View>
            <View style={styles.successItem}>
              <Text style={styles.successLabel}>Duration</Text>
              <Text style={styles.successValue}>{duration} days</Text>
            </View>
            <View style={styles.successItem}>
              <Text style={styles.successLabel}>Status</Text>
              <Text style={[styles.successValue, { color: '#16A34A' }]}>Active</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.successBtn, { backgroundColor: color }]}
            activeOpacity={0.8}
            onPress={() => router.back()}
          >
            <Text style={styles.successBtnText}>Back to Budget</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    )
  }

  const renderStep = () => {
    switch (step) {
      case 1: return renderInfoStep()
      case 2: return renderPeriodStep()
      case 3: return renderAmountStep()
      case 4: return renderCategoryStep()
      case 5: return renderAlertsStep()
      case 6: return renderReviewStep()
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
        <Animated.View entering={FadeInUp.duration(500).springify()} style={styles.topNav}>
          <TouchableOpacity
            style={styles.navBack}
            activeOpacity={0.7}
            onPress={() => { if (step > 1) setStep(step - 1); else router.back() }}
          >
            <GoonaIcon icon={Icons.arrowLeft} size={22} color="#1B1B1B" />
          </TouchableOpacity>
          <Text style={styles.topTitle}>{isEditing ? 'Edit Budget' : 'Create Budget'}</Text>
          <View style={{ width: 38 }} />
        </Animated.View>

        {renderStepIndicator()}

        {draftRestored && (
          <Animated.View entering={FadeInUp.duration(400).springify()} style={styles.draftBanner}>
            <GoonaIcon icon={Icons.save} size={14} color="#2E7D32" />
            <Text style={styles.draftBannerText}>Draft restored — continue where you left off.</Text>
            <TouchableOpacity onPress={() => setDraftRestored(false)}>
              <GoonaIcon icon={Icons.x} size={14} color="#2E7D32" />
            </TouchableOpacity>
          </Animated.View>
        )}

        {renderStep()}
      </ScrollView>

      <Animated.View entering={FadeInUp.duration(400).springify()} style={[styles.bottomNav, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.backStepBtn, step === 1 && styles.backStepBtnHidden]}
          activeOpacity={0.7}
          onPress={() => setStep(Math.max(1, step - 1))}
        >
          <Text style={styles.backStepText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.saveDraftBtn}
          activeOpacity={0.7}
          onPress={handleSaveDraft}
        >
          <GoonaIcon icon={Icons.save} size={14} color="#64748B" />
          <Text style={styles.saveDraftText}>Save Draft</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: color }, !canProceed() && styles.nextBtnDisabled]}
          activeOpacity={0.8}
          disabled={!canProceed()}
          onPress={() => { if (step < 6) setStep(step + 1); else handleSave() }}
        >
          <Text style={styles.nextBtnText}>
            {step < 6 ? 'Continue' : saving ? 'Saving...' : isEditing ? 'Update Budget' : 'Create Budget'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAF7' },
  scroll: { flex: 1 },
  scrollInner: { paddingBottom: 120 },

  topNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, height: 48, marginBottom: 4,
  },
  navBack: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center',
  },
  topTitle: { fontSize: 18, fontWeight: '700', color: '#1B1B1B', letterSpacing: -0.3 },

  stepRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 12, paddingHorizontal: 8 },
  stepGroup: { flexDirection: 'row', alignItems: 'center', flexShrink: 0 },
  stepDot: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: '#F1F5F1',
    alignItems: 'center', justifyContent: 'center',
  },
  stepDotActive: { backgroundColor: '#2E7D32' },
  stepDotDone: { backgroundColor: '#16A34A' },
  stepDotNum: { fontSize: 11, fontWeight: '700', color: '#94A3B8' },
  stepDotNumActive: { color: '#FFF' },
  stepDotDoneText: { fontSize: 11, fontWeight: '700', color: '#FFF' },
  stepLabel: { fontSize: 11, fontWeight: '600', color: '#94A3B8', marginLeft: 4 },
  stepLabelActive: { color: '#2E7D32' },
  stepLabelDone: { color: '#16A34A' },
  stepLine: { flex: 1, height: 2, backgroundColor: '#F1F5F1', marginHorizontal: 4 },
  stepLineDone: { backgroundColor: '#16A34A' },

  draftBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F0FDF4', borderRadius: 12, padding: 10,
    marginHorizontal: 20, marginBottom: 8,
  },
  draftBannerText: { fontSize: 12, fontWeight: '600', color: '#2E7D32', flex: 1 },

  stepContent: { paddingHorizontal: 20, paddingBottom: 20 },
  stepTitle: { fontSize: 22, fontWeight: '800', color: '#1B1B1B', marginBottom: 4 },
  stepSub: { fontSize: 14, color: '#64748B', marginBottom: 20, lineHeight: 20 },
  stepHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },

  fieldCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 14,
  },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#475569', marginBottom: 8 },
  textInput: {
    fontSize: 16, fontWeight: '600', color: '#1B1B1B',
    paddingVertical: 4, paddingHorizontal: 0,
  },
  textArea: { minHeight: 60, textAlignVertical: 'top' },

  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#1B1B1B', marginBottom: 12, marginTop: 4 },

  colorGrid: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  colorSwatch: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  colorSwatchActive: { borderWidth: 3, borderColor: '#1B1B1B' },

  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  iconOption: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#E2E8F0',
  },
  iconOptionActive: { borderColor: '#2E7D32', backgroundColor: '#F0FDF4' },

  dateCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 14,
  },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dateCol: { flex: 1 },
  dateLabel: { fontSize: 12, fontWeight: '600', color: '#94A3B8', marginBottom: 6 },
  dateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F8FAF7', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  dateBtnText: { fontSize: 15, fontWeight: '700', color: '#1B1B1B' },
  dateArrow: { paddingTop: 18 },
  durationBadge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: 14,
    backgroundColor: '#F0FDF4', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 14,
    alignSelf: 'center',
  },
  durationText: { fontSize: 13, fontWeight: '700', color: '#2E7D32' },

  quickDateGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 12,
    borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 14,
  },
  quickDateBtn: {
    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10,
    backgroundColor: '#F8FAF7', borderWidth: 1, borderColor: '#E2E8F0',
    alignItems: 'center', minWidth: 70,
  },
  quickDateBtnActive: { borderColor: '#2E7D32', backgroundColor: '#F0FDF4' },
  quickDateText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  quickDateSub: { fontSize: 10, color: '#94A3B8', marginTop: 2 },
  quickDateTextActive: { color: '#2E7D32' },

  amountRow: { flexDirection: 'row', alignItems: 'center' },
  amountPrefix: { fontSize: 28, fontWeight: '800', color: '#1B1B1B', marginRight: 8 },
  amountInput: {
    flex: 1, fontSize: 28, fontWeight: '800', color: '#1B1B1B',
    letterSpacing: -0.5, textAlign: 'center',
  },
  amountInputValid: { color: '#2E7D32' },
  amountHint: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F0FDF4', borderRadius: 12, padding: 12,
  },
  amountHintText: { fontSize: 12, color: '#2E7D32', fontWeight: '600', flex: 1 },

  skipBtn: {
    paddingVertical: 6, paddingHorizontal: 14, borderRadius: 10,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  skipBtnText: { fontSize: 12, fontWeight: '700', color: '#64748B' },

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

  templateScroll: { marginBottom: 14, marginHorizontal: -20 },
  templateContent: { paddingHorizontal: 20, gap: 8, flexDirection: 'row' },
  templateChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0',
  },
  templateChipActive: { backgroundColor: '#F0FDF4', borderColor: '#2E7D32' },
  templateEmoji: { fontSize: 16 },
  templateLabel: { fontSize: 12, fontWeight: '600', color: '#475569' },
  templateLabelActive: { color: '#2E7D32', fontWeight: '700' },

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

  allocRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 12,
    marginBottom: 8, borderWidth: 1, borderColor: '#E2E8F0',
  },
  allocLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  allocIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  allocLabel: { fontSize: 14, fontWeight: '600', color: '#1B1B1B' },
  allocRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  allocInputWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAF7',
    borderRadius: 10, paddingHorizontal: 10, borderWidth: 1, borderColor: '#E2E8F0',
  },
  allocCurrency: { fontSize: 14, fontWeight: '700', color: '#94A3B8', marginRight: 4 },
  allocInput: {
    fontSize: 14, fontWeight: '700', color: '#1B1B1B',
    textAlign: 'right', minWidth: 80, paddingVertical: 8,
  },
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

  alertSectionTitle: {
    fontSize: 16, fontWeight: '800', color: '#1B1B1B', marginBottom: 4,
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  alertSectionSub: { fontSize: 12, color: '#94A3B8', marginBottom: 12, lineHeight: 16 },

  freqGrid: { gap: 8, marginBottom: 12 },
  freqCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  freqCardActive: { borderColor: '#2E7D32', backgroundColor: '#F0FDF4' },
  freqRadio: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2,
    borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center',
  },
  freqRadioActive: { borderColor: '#2E7D32' },
  freqRadioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#2E7D32' },
  freqLabel: { fontSize: 14, fontWeight: '600', color: '#1B1B1B' },
  freqLabelActive: { fontWeight: '800', color: '#2E7D32' },
  freqDesc: { fontSize: 11, color: '#94A3B8', marginTop: 1 },

  channelGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  reviewCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16,
  },
  reviewColorBar: { height: 6 },
  reviewBody: { padding: 18 },
  reviewHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  reviewName: { fontSize: 18, fontWeight: '800', color: '#1B1B1B' },
  reviewDesc: { fontSize: 13, color: '#64748B', marginBottom: 12 },
  reviewDivider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 10 },
  reviewRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 6,
  },
  reviewLabel: { fontSize: 14, color: '#64748B' },
  reviewValue: { fontSize: 14, fontWeight: '700', color: '#1B1B1B' },

  successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  successIcon: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  successTitle: { fontSize: 24, fontWeight: '800', color: '#1B1B1B', marginBottom: 8 },
  successSub: { fontSize: 15, color: '#64748B', textAlign: 'center', marginBottom: 24 },
  successSummary: {
    flexDirection: 'row', justifyContent: 'space-around', width: '100%',
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 24,
  },
  successItem: { alignItems: 'center' },
  successLabel: { fontSize: 11, fontWeight: '600', color: '#94A3B8', marginBottom: 4 },
  successValue: { fontSize: 16, fontWeight: '800', color: '#1B1B1B' },
  successBtn: { width: '100%', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  successBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },

  removeCatBtn: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center',
    marginLeft: 4,
  },

  addCatCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: '#E2E8F0', borderStyle: 'dashed',
  },
  addCatInput: {
    fontSize: 15, fontWeight: '600', color: '#1B1B1B',
    paddingVertical: 8, paddingHorizontal: 0, borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0', marginBottom: 10,
  },
  addCatActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  addCatCancelBtn: {
    paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  addCatCancelText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  addCatConfirmBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10,
    backgroundColor: '#2E7D32',
  },
  addCatConfirmText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  addCatBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 8,
    borderWidth: 1.5, borderColor: '#E2E8F0', borderStyle: 'dashed',
  },
  addCatBtnIcon: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center',
  },
  addCatBtnText: { fontSize: 14, fontWeight: '700', color: '#2E7D32' },

  allocFooter: {
    flexDirection: 'row', justifyContent: 'center', marginBottom: 10,
  },
  autoAllocBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 10, paddingHorizontal: 18, borderRadius: 20,
    backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#2E7D32',
  },
  autoAllocText: { fontSize: 13, fontWeight: '700', color: '#2E7D32' },

  errorCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FEF2F2', borderRadius: 12, padding: 12, marginBottom: 8,
  },
  errorText: { fontSize: 13, fontWeight: '600', color: '#EF4444', flex: 1 },

  bottomNav: {
    flexDirection: 'row', paddingHorizontal: 20, paddingTop: 12,
    backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F1F5F9', gap: 12,
  },
  backStepBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center',
  },
  backStepBtnHidden: { opacity: 0 },
  backStepText: { fontSize: 15, fontWeight: '700', color: '#64748B' },
  saveDraftBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 14, paddingHorizontal: 12, borderRadius: 14,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  saveDraftText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  nextBtn: { flex: 2, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  nextBtnDisabled: { opacity: 0.5 },
  nextBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
})
