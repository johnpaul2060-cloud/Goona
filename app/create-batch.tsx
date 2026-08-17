import React, { useState, useRef, useMemo } from 'react'
import {
  View, Text, TouchableOpacity, TextInput, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from 'react-native'
import Svg, { Path, Circle, Rect, Line, Ellipse } from 'react-native-svg'
import { Icons } from '../shared/icons'
import GoonaIcon from '../components/ui/GoonaIcon'
import { StatusBar } from 'expo-status-bar'
import { router } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  FadeInUp,
} from 'react-native-reanimated'
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'
import { useBatchStore } from '../store/useBatchStore'
import type { BudgetAllocation } from '../store/useBatchStore'
import BudgetAllocatorSection from '../components/BudgetAllocatorSection'
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

const FLOCK_TYPES = new Set(['Broilers', 'Layers', 'Fish Farming', 'Turkey', 'Noiler'])
const INDIVIDUAL_TYPES = new Set(['Goat', 'Sheep', 'Cattle', 'Piggery', 'Grasscutter'])
const BREEDER_TYPES = new Set(['Turkey PS', 'Noiler PS', 'ISA Brown PS', 'Broiler PS'])

const TYPE_GROUPS: { key: 'flock' | 'individual' | 'breeder'; title: string; sub: string; tag: string | null; model: 'flock' | 'individual' | 'breeder'; types: Set<string> }[] = [
  {
    key: 'flock',
    title: 'Poultry & Fish (raised in flocks)',
    sub: 'Tracked as a group — feed, mortality, eggs in totals.',
    tag: null,
    model: 'flock',
    types: FLOCK_TYPES,
  },
  {
    key: 'individual',
    title: 'Livestock (tracked individually)',
    sub: 'Each animal has its own profile — breeding, births, weights.',
    tag: null,
    model: 'individual',
    types: INDIVIDUAL_TYPES,
  },
  {
    key: 'breeder',
    title: 'Breeder / Parent Stock',
    sub: 'Parent birds kept for eggs & hatching — track fertility, hatch rate, chicks.',
    tag: 'BreederPro',
    model: 'breeder',
    types: BREEDER_TYPES,
  },
]

function getModel(type: string): 'flock' | 'individual' | 'breeder' {
  if (BREEDER_TYPES.has(type)) return 'breeder'
  return INDIVIDUAL_TYPES.has(type) ? 'individual' : 'flock'
}

function groupKeyLabel(model: 'flock' | 'individual' | 'breeder'): string {
  if (model === 'individual') return 'a herd with individual profiles'
  if (model === 'breeder') return 'a breeder flock with egg & hatch tracking'
  return 'a flock raised as a group'
}

const DURATION_OPTIONS = ['4 Weeks', '6 Weeks', '8 Weeks', 'Custom'] as const

const LIVESTOCK_COLORS: Record<string, string> = {
  Broilers: '#D97706', Layers: '#2563EB', 'Fish Farming': '#0891B2',
  Turkey: '#B45309', Noiler: '#0E7490',
  Goat: '#7C3AED', Sheep: '#8B5CF6', Cattle: '#92400E', Piggery: '#DB2777', Grasscutter: '#0F766E',
  'Turkey PS': '#7C2D12', 'Noiler PS': '#A16207', 'ISA Brown PS': '#92400E', 'Broiler PS': '#D97706',
}

const DURATION_COLORS: Record<string, string> = {
  '4 Weeks': '#16A34A', '6 Weeks': '#2563EB', '8 Weeks': '#D97706', Custom: '#7C3AED',
}

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
  const isPS = type === 'Turkey PS' || type === 'Noiler PS' || type === 'ISA Brown PS' || type === 'Broiler PS'
  return (
    <Svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      {isPS && (
        <>
          <Ellipse cx="11" cy="14" rx="6" ry="4.5" fill={selected ? 'rgba(255,255,255,0.15)' : '#D4C9B8'} fillOpacity={opacity} />
          <Circle cx="11" cy="10" r="3.5" fill={selected ? 'rgba(255,255,255,0.15)' : '#D4C9B8'} fillOpacity={opacity} />
          <Circle cx="10.5" cy="9.5" r="1" fill={c} />
          <Ellipse cx="14.5" cy="16.5" rx="1.7" ry="2.2" fill={c} opacity={0.8} />
          <Path d="M9.5 6.5L11.5 6" stroke="#F9A825" strokeWidth="1.2" strokeLinecap="round" />
        </>
      )}
      {type === 'Broilers' && (
        <>
          <Ellipse cx="11" cy="14" rx="6" ry="4.5" fill={selected ? 'rgba(255,255,255,0.15)' : '#D4C9B8'} fillOpacity={opacity} />
          <Circle cx="11" cy="10" r="3.5" fill={selected ? 'rgba(255,255,255,0.15)' : '#D4C9B8'} fillOpacity={opacity} />
          <Circle cx="11" cy="9.5" r="1" fill={c} />
          <Path d="M9.5 7L11.5 6" stroke="#F9A825" strokeWidth="1.2" strokeLinecap="round" />
        </>
      )}
      {type === 'Layers' && (
        <>
          <Ellipse cx="11" cy="14" rx="6" ry="4.5" fill={selected ? 'rgba(255,255,255,0.15)' : '#D4C9B8'} fillOpacity={opacity} />
          <Circle cx="11" cy="10" r="3.5" fill={selected ? 'rgba(255,255,255,0.15)' : '#D4C9B8'} fillOpacity={opacity} />
          <Circle cx="11" cy="9.5" r="1" fill={c} />
          <Path d="M8 16L10 18L14 15" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </>
      )}
      {type === 'Fish Farming' && (
        <>
          <Ellipse cx="11" cy="14" rx="5" ry="3.5" fill="#B8D8E8" fillOpacity={selected ? 0.15 : opacity} />
          <Path d="M7 12.5L6 12" stroke={c} strokeWidth="1.2" strokeLinecap="round" />
          <Path d="M15 12.5L16 12" stroke={c} strokeWidth="1.2" strokeLinecap="round" />
        </>
      )}
      {type === 'Turkey' && (
        <>
          <Ellipse cx="11" cy="14" rx="6" ry="4.5" fill={selected ? 'rgba(255,255,255,0.15)' : '#D4C9B8'} fillOpacity={opacity} />
          <Circle cx="11" cy="10" r="3.5" fill={selected ? 'rgba(255,255,255,0.15)' : '#D4C9B8'} fillOpacity={opacity} />
          <Circle cx="10.5" cy="9.5" r="1" fill={c} />
          <Path d="M9 6.5L9.3 7.6" stroke="#F9A825" strokeWidth="1.2" strokeLinecap="round" />
          <Path d="M13.2 8.5C14.6 9.8 14.7 12.3 13.4 14.8" stroke={c} strokeWidth="1.1" fill="none" strokeLinecap="round" />
          <Path d="M6 10.5C5.5 13 7.5 17 11 17C14.5 17 16.5 13 16 10.5" stroke={c} strokeWidth="1.1" fill="none" strokeLinecap="round" />
        </>
      )}
      {type === 'Noiler' && (
        <>
          <Ellipse cx="11" cy="14" rx="6" ry="4.5" fill={selected ? 'rgba(255,255,255,0.15)' : '#D4C9B8'} fillOpacity={opacity} />
          <Circle cx="11" cy="10" r="3.5" fill={selected ? 'rgba(255,255,255,0.15)' : '#D4C9B8'} fillOpacity={opacity} />
          <Circle cx="11" cy="9.5" r="1" fill={c} />
          <Path d="M10 11.5L8.5 10.5" stroke="#F9A825" strokeWidth="1.2" strokeLinecap="round" />
          <Path d="M8.7 8.6C9.1 7.6 10.5 7.6 10.9 8.4" stroke={c} strokeWidth="1" fill="none" strokeLinecap="round" />
          <Path d="M10.9 8.4C11.3 7.4 12.7 7.5 13.1 8.7" stroke={c} strokeWidth="1" fill="none" strokeLinecap="round" />
        </>
      )}
      {type === 'Goat' && (
        <>
          <Path d="M8 16C8 16 7 12 11 12C15 12 14 16 14 16" stroke={c} strokeWidth="1.3" fill="none" strokeLinecap="round" />
          <Circle cx="11" cy="9" r="4" stroke={c} strokeWidth="1.3" fill="none" />
          <Circle cx="10" cy="8" r="0.8" fill={c} />
          <Path d="M13 8L14.5 7" stroke={c} strokeWidth="1.2" strokeLinecap="round" />
        </>
      )}
      {type === 'Sheep' && (
        <>
          <Ellipse cx="11" cy="14" rx="6.5" ry="4.5" fill={selected ? 'rgba(255,255,255,0.15)' : '#D4C9B8'} fillOpacity={opacity} />
          <Circle cx="11" cy="9.5" r="4" fill={selected ? 'rgba(255,255,255,0.15)' : '#D4C9B8'} fillOpacity={opacity} />
          <Circle cx="10" cy="9" r="0.8" fill={c} />
          <Circle cx="12.4" cy="9.2" r="0.8" fill={c} />
        </>
      )}
      {type === 'Cattle' && (
        <>
          <Ellipse cx="11" cy="14" rx="6.5" ry="4.5" fill={selected ? 'rgba(255,255,255,0.15)' : '#D4C9B8'} fillOpacity={opacity} />
          <Circle cx="11" cy="9" r="4" stroke={c} strokeWidth="1.2" fill="none" />
          <Circle cx="10" cy="8.5" r="0.8" fill={c} />
          <Circle cx="12.3" cy="8.6" r="0.8" fill={c} />
          <Path d="M8 6L6.5 4L7.5 3.5" stroke={c} strokeWidth="1.2" strokeLinecap="round" fill="none" />
          <Path d="M14 6L15.5 4L14.5 3.5" stroke={c} strokeWidth="1.2" strokeLinecap="round" fill="none" />
          <Path d="M9 10.8C9.6 11.7 12.4 11.7 13 10.8" stroke={c} strokeWidth="1" fill="none" strokeLinecap="round" />
        </>
      )}
      {type === 'Piggery' && (
        <>
          <Ellipse cx="11" cy="14" rx="7" ry="5" fill={selected ? 'rgba(255,255,255,0.15)' : '#E8D5C4'} fillOpacity={opacity} />
          <Ellipse cx="11" cy="14" rx="7" ry="5" stroke={c} strokeWidth="1.2" fill="none" />
          <Circle cx="11" cy="10" r="4.5" stroke={c} strokeWidth="1.2" fill="none" />
          <Circle cx="9.5" cy="9.5" r="0.7" fill={c} />
          <Circle cx="12.5" cy="9.5" r="0.7" fill={c} />
        </>
      )}
      {type === 'Grasscutter' && (
        <>
          <Ellipse cx="11" cy="14" rx="5" ry="4" fill={selected ? 'rgba(255,255,255,0.15)' : '#D4C9B8'} fillOpacity={opacity} />
          <Circle cx="11" cy="9" r="4.5" stroke={c} strokeWidth="1.2" fill="none" />
          <Circle cx="9.5" cy="8.5" r="0.7" fill={c} />
          <Circle cx="12.5" cy="8.5" r="0.7" fill={c} />
          <Path d="M7 12.5L8 14L14 14L15 12.5" stroke={c} strokeWidth="1" fill="none" strokeLinecap="round" />
        </>
      )}
    </Svg>
  )
}

function LivestockTile({ type, selected, accent, onSelect }: { type: string; selected: boolean; accent: string; onSelect: () => void }) {
  const ps = usePressScale()
  return (
    <Animated.View style={ps.style}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onSelect}
        onPressIn={ps.onPressIn}
        onPressOut={ps.onPressOut}
        style={styles.typeCardWrap}
      >
        <View style={[styles.typeCard, { borderColor: selected ? accent : accent + '30' }, selected && { backgroundColor: '#FAFDF8' }]}>
          {selected && (
            <View style={[styles.typeCheck, { backgroundColor: accent }]}>
              <GoonaIcon icon={Icons.check} size={12} color="#FFF" />
            </View>
          )}
          <LinearGradient
            colors={selected ? [accent + 'E0', accent + '99'] : [accent + '15', accent + '08']}
            style={[styles.typeIcon, selected && styles.typeIconSelected]}
          >
            <LivestockIcon type={type} selected={selected} />
          </LinearGradient>
          <Text style={[styles.typeName, { color: selected ? accent : '#1F2937' }]} numberOfLines={1}>{type}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

function OthersTile({ selected, onSelect }: { selected: boolean; onSelect: () => void }) {
  const ps = usePressScale()
  return (
    <Animated.View style={[ps.style, styles.othersWrap]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onSelect}
        onPressIn={ps.onPressIn}
        onPressOut={ps.onPressOut}
        style={styles.othersCardWrap}
      >
        <View style={[styles.othersCard, selected && styles.othersCardSelected]}>
          {selected && (
            <View style={[styles.typeCheck, { backgroundColor: '#17663A' }]}>
              <GoonaIcon icon={Icons.check} size={12} color="#FFF" />
            </View>
          )}
          <View style={[styles.othersChip, selected && styles.othersChipSelected]}>
            <GoonaIcon icon={Icons.plus} size={18} color={selected ? '#FFFFFF' : '#17663A'} />
          </View>
          <View style={styles.othersBody}>
            <Text style={[styles.othersName, selected && styles.othersNameSelected]}>Others</Text>
            <Text style={styles.othersHint}>{selected ? 'Name your animal' : 'Custom animal'}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

function TypeRow({ group, selectedType, othersGroupKey, onSelectType, onSelectOthers }: {
  group: (typeof TYPE_GROUPS)[number]
  selectedType: string
  othersGroupKey: string | null
  onSelectType: (t: string) => void
  onSelectOthers: () => void
}) {
  const [layoutW, setLayoutW] = useState(0)
  const [contentW, setContentW] = useState(0)
  const [offsetX, setOffsetX] = useState(0)
  const fadeTo = group.tag ? '#F0F7F6' : '#FFFFFF'
  const showFade = contentW > layoutW + 4 && offsetX < contentW - layoutW - 8
  return (
    <View style={styles.typeGroupRowWrap} onLayout={(e) => setLayoutW(e.nativeEvent.layout.width)}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        style={styles.typeGroupRow}
        contentContainerStyle={styles.typeGroupRowInner}
        scrollEventThrottle={16}
        onContentSizeChange={(w) => setContentW(w)}
        onScroll={(e) => setOffsetX(e.nativeEvent.contentOffset.x)}
      >
        {[...group.types].map((type) => (
          <LivestockTile
            key={type}
            type={type}
            selected={othersGroupKey === null && selectedType === type}
            accent={LIVESTOCK_COLORS[type]}
            onSelect={() => onSelectType(type)}
          />
        ))}
        <OthersTile selected={othersGroupKey === group.key} onSelect={onSelectOthers} />
      </ScrollView>
      {showFade ? (
        <LinearGradient
          pointerEvents="none"
          colors={[fadeTo + '00', fadeTo]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.typeGroupFade}
        />
      ) : null}
    </View>
  )
}

function DurationPill({ opt, selected, accent, onSelect }: { opt: string; selected: boolean; accent: string; onSelect: () => void }) {
  const ps = usePressScale()
  return (
    <Animated.View style={ps.style}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onSelect}
        onPressIn={ps.onPressIn}
        onPressOut={ps.onPressOut}
        style={styles.durationPillWrap}
      >
        <View style={[styles.durationPill, { borderColor: selected ? accent : accent + '30' }, selected && { backgroundColor: '#FAFDF8' }]}>
          {selected && (
            <View style={[styles.durationCheck, { backgroundColor: accent }]}>
              <GoonaIcon icon={Icons.check} size={10} color="#FFF" />
            </View>
          )}
          <LinearGradient
            colors={selected ? [accent + 'E0', accent + '99'] : [accent + '15', accent + '08']}
            style={[styles.durationPillBg, selected && styles.durationPillBgSelected]}
          >
            <Text style={[styles.durationPillText, { color: selected ? '#FFF' : '#1F2937' }]}>{opt}</Text>
          </LinearGradient>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

export default function CreateBatchScreen() {
  const [batchName, setBatchName] = useState('')
  const [selectedType, setSelectedType] = useState<string>('Broilers')
  const [othersGroupKey, setOthersGroupKey] = useState<string | null>(null)
  const [customTypeName, setCustomTypeName] = useState('')
  const [customTypeTouched, setCustomTypeTouched] = useState(false)
  const [quantityStr, setQuantityStr] = useState('')
  const [purchaseCost, setPurchaseCost] = useState('')
  const [budgetAllocs, setBudgetAllocs] = useState<BudgetAllocation[]>([])
  const [startDate, setStartDate] = useState(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [duration, setDuration] = useState('6 Weeks')
  const [customDurationVal, setCustomDurationVal] = useState('')
  const [customDurationUnit, setCustomDurationUnit] = useState<'weeks' | 'months'>('weeks')
  const [customDurationTouched, setCustomDurationTouched] = useState(false)
  const [breed, setBreed] = useState('')
  const [sexDistribution, setSexDistribution] = useState('')
  const [herdNotes, setHerdNotes] = useState('')
  const [hensStr, setHensStr] = useState('')
  const [cocksStr, setCocksStr] = useState('')
  const [flockDateKind, setFlockDateKind] = useState<'placed' | 'hatched'>('placed')
  const [house, setHouse] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  const othersGroup = TYPE_GROUPS.find((g) => g.key === othersGroupKey) ?? null
  const model = othersGroup ? othersGroup.model : getModel(selectedType)
  const effectiveType = othersGroup ? customTypeName.trim() : selectedType
  const hens = parseNumeric(hensStr)
  const cocks = parseNumeric(cocksStr)
  const stepperValueFont = (raw: string) => {
    const digits = raw.replace(/[^0-9]/g, '').length
    if (digits <= 4) return 20
    if (digits <= 6) return 18
    if (digits <= 8) return 16
    return 14
  }
  const ratioPreview = useMemo(() => {
    if (model !== 'breeder') return ''
    if (cocks > 0) return `${(hens / cocks).toFixed(1)} : 1`
    return '—'
  }, [model, hens, cocks])

  const addBatch = useBatchStore((s) => s.addBatch)

  const pressScale = usePressScale()

  const quantityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const quantityIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const adjustQuantity = (delta: number) => {
    setQuantityStr(prev => {
      const current = parseInt(prev || '0', 10) || 0
      let next = current + delta
      if (next < 1) next = 1
      if (next > 100000) next = 100000
      return String(next)
    })
  }

  const handleQuantityPressIn = (direction: 'up' | 'down') => {
    const delta = direction === 'up' ? 1 : -1
    adjustQuantity(delta)
    quantityTimerRef.current = setTimeout(() => {
      let step = 1
      quantityIntervalRef.current = setInterval(() => {
        adjustQuantity(delta * step)
        step = Math.min(step + 10, 100)
      }, 80)
    }, 400)
  }

  const handleQuantityPressOut = () => {
    if (quantityTimerRef.current) {
      clearTimeout(quantityTimerRef.current)
      quantityTimerRef.current = null
    }
    if (quantityIntervalRef.current) {
      clearInterval(quantityIntervalRef.current)
      quantityIntervalRef.current = null
    }
  }

  const purchaseVal = parseNumeric(purchaseCost)
  const feedVal = budgetAllocs.find((a) => a.key === 'feed')?.amount ?? 0
  const medicationVal = budgetAllocs.find((a) => a.key === 'medication')?.amount ?? 0
  const totalCost = purchaseVal + feedVal + medicationVal
  const expectedRevenue = Math.round(totalCost * 2.12)
  const forecastProfit = expectedRevenue - totalCost
  const reinvestmentGoal = Math.round(forecastProfit * 0.3)

  const resolvedDuration = useMemo(() => {
    if (duration !== 'Custom') return duration
    const num = parseInt(customDurationVal, 10)
    if (!num || num < 1) return ''
    return customDurationUnit === 'months'
      ? `${num * 4} Weeks`
      : `${num} Weeks`
  }, [duration, customDurationVal, customDurationUnit])

  const resolvedDurationDisplay = useMemo(() => {
    if (duration !== 'Custom') return ''
    const num = parseInt(customDurationVal, 10)
    if (!num || num < 1) return ''
    const weeks = customDurationUnit === 'months' ? num * 4 : num
    const months = customDurationUnit === 'months' ? num : Math.round(num / 4.33)
    if (weeks >= 12) {
      const yrs = Math.floor(months / 12)
      const remMonths = months % 12
      const yearsStr = yrs > 0 ? `${yrs} yr${yrs > 1 ? 's' : ''}` : ''
      const monthsStr = remMonths > 0 ? ` ${remMonths} mo` : ''
      return `${weeks} weeks (${yearsStr}${monthsStr})`.trim()
    }
    return `${weeks} weeks`
  }, [duration, customDurationVal, customDurationUnit])

  const isCustomValid = duration !== 'Custom' || (parseInt(customDurationVal, 10) >= 1)

  const onDateChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false)
    if (date) setStartDate(date)
  }

  const handleCreateBatch = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    if (!batchName.trim()) {
      Alert.alert('Required', 'Please enter a batch name.')
      return
    }
    if (othersGroup) {
      setCustomTypeTouched(true)
      if (!customTypeName.trim()) {
        Alert.alert('Required', 'Please name the animal you are rearing.')
        return
      }
    } else if (!selectedType) {
      Alert.alert('Required', 'Please select a livestock type.')
      return
    }
    if (!quantityStr || parseInt(quantityStr, 10) < 1) {
      Alert.alert('Required', 'Please enter a valid livestock quantity.')
      return
    }
    if (!purchaseVal || purchaseVal < 1) {
      Alert.alert('Required', 'Please enter the initial purchase cost — it is required to create the batch.')
      return
    }
    if (model === 'breeder') {
      if (hens < 1 || cocks < 1) {
        Alert.alert('Required', 'Please enter the number of hens and cocks for this breeder flock.')
        return
      }
    }
    if (duration === 'Custom') {
      setCustomDurationTouched(true)
      const num = parseInt(customDurationVal, 10)
      if (!num || num < 1) {
        Alert.alert('Required', 'Please enter a valid custom duration (minimum 1).')
        return
      }
    }

    const batchData: Parameters<typeof addBatch>[0] = {
      batchName: batchName.trim(),
      livestockType: effectiveType,
      model,
      quantity: parseInt(quantityStr, 10),
      purchaseCost: purchaseVal,
      budgetAllocations: budgetAllocs,
      startDate: startDate.toISOString(),
      duration: resolvedDuration,
    }
    if (model === 'individual') {
      batchData.breed = breed.trim() || undefined
      batchData.sexDistribution = sexDistribution || undefined
      batchData.herdNotes = herdNotes.trim() || undefined
    }
    if (model === 'breeder') {
      batchData.breed = breed.trim() || undefined
      batchData.totalBreeders = parseInt(quantityStr, 10)
      batchData.hens = hens
      batchData.cocks = cocks
      batchData.house = house.trim() || undefined
      batchData.startDate = startDate.toISOString()
      if (flockDateKind === 'placed') {
        batchData.datePlaced = startDate.toISOString()
      } else {
        batchData.dateHatched = startDate.toISOString()
      }
    }
    addBatch(batchData)

    setShowSuccess(true)
    setTimeout(() => {
      setShowSuccess(false)
      router.replace('/(tabs)/records/all-batches' as any)
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
              <GoonaIcon icon={Icons.arrowLeft} size={24} color="#1B1B1B" />
            </TouchableOpacity>
            <Text style={styles.topTitle}>Create New Batch</Text>
            <View style={styles.progressPill}>
              <Text style={styles.progressPillText}>Batch Setup</Text>
            </View>
          </Animated.View>

          {/* HEADER */}
          <Animated.View entering={FadeInUp.duration(500).delay(80).springify()} style={styles.headerSection}>
            <Text style={styles.headerLabel}>Production Setup</Text>
            <Text style={styles.headerTitle}>
              {model === 'individual'
                ? 'Register a New\nHerd Group'
                : model === 'breeder'
                  ? 'Register a New\nBreeder Flock'
                  : 'Start a New\nLivestock Cycle'}
            </Text>
            <Text style={styles.headerSub}>
              {model === 'individual'
                ? 'Create a new herd batch to track individual animals, breeding, and lineage.'
                : model === 'breeder'
                  ? 'Create a parent-stock breeder flock to track hens, cocks, flock age, and live population.'
                  : 'Create a new batch to track livestock growth, feeding, expenses, and profitability.'}
            </Text>
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
              <TextInput
                value={batchName}
                onChangeText={setBatchName}
                placeholder="e.g. Broiler Batch A"
                placeholderTextColor="#A0AEA1"
                style={styles.batchNameInput}
              />
            </View>

            {/* LIVESTOCK TYPE */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Livestock Type</Text>
              {TYPE_GROUPS.map((group) => (
                <View key={group.key} style={[styles.typeGroup, group.tag && styles.typeGroupBreeder]}>
                  <View style={styles.typeGroupHead}>
                    <View style={[styles.typeGroupDot, { backgroundColor: group.model === 'breeder' ? '#0F766E' : group.model === 'individual' ? '#C05F2E' : '#2E7D32' }]} />
                    <Text style={styles.typeGroupTitle}>{group.title}</Text>
                    {group.tag ? (
                      <LinearGradient
                        colors={['#0F766E', '#0B5B55']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.typeGroupBadge}
                      >
                        <Text style={styles.typeGroupBadgeText}>{group.tag}</Text>
                      </LinearGradient>
                    ) : null}
                  </View>
                  <Text style={styles.typeGroupSub}>{group.sub}</Text>
                  <TypeRow
                    group={group}
                    selectedType={selectedType}
                    othersGroupKey={othersGroupKey}
                    onSelectType={(t) => {
                      setSelectedType(t)
                      setOthersGroupKey(null)
                    }}
                    onSelectOthers={() => setOthersGroupKey(group.key)}
                  />
                  {group.key === othersGroupKey && (
                    <View style={styles.othersInputWrap}>
                      <Text style={styles.othersInputLabel}>What animal are you rearing?</Text>
                      <TextInput
                        value={customTypeName}
                        onChangeText={(v) => {
                          setCustomTypeName(v)
                          if (v.trim()) setCustomTypeTouched(false)
                        }}
                        placeholder="e.g. Ducks, Rabbits, Snails"
                        placeholderTextColor="#A0AEA1"
                        autoCapitalize="words"
                        maxLength={28}
                        style={[styles.othersInput, customTypeTouched && !customTypeName.trim() && styles.othersInputError]}
                      />
                      {customTypeTouched && !customTypeName.trim() ? (
                        <Text style={styles.othersErrorText}>Please name the animal before continuing.</Text>
                      ) : (
                        <Text style={styles.othersInputHint}>Tracks as a {groupKeyLabel(group.model)} — exactly like the types above.</Text>
                      )}
                    </View>
                  )}
                </View>
              ))}
            </View>

            {/* INITIAL QUANTITY */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>{model === 'breeder' ? 'Total Breeders' : 'Initial Livestock Quantity'}</Text>
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
                  onPressIn={() => handleQuantityPressIn('down')}
                  onPressOut={handleQuantityPressOut}
                >
                  <Text style={styles.stepperBtnText}>−</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.stepperInput}
                  value={formatInput(quantityStr)}
                  onChangeText={(v) => setQuantityStr(v.replace(/\D/g, ''))}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor="#A0AEA1"
                />
                <TouchableOpacity
                  style={styles.stepperBtn}
                  activeOpacity={0.85}
                  onPressIn={() => handleQuantityPressIn('up')}
                  onPressOut={handleQuantityPressOut}
                >
                  <Text style={styles.stepperBtnText}>+</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.formNote}>{model === 'breeder' ? 'Opening breeder flock size — mortality and culls reduce this over time.' : 'Estimated mortality projections will be based on this quantity.'}</Text>
            </View>

            {/* PURCHASE COST */}
            <View style={styles.formSection}>
              <View style={styles.requiredLabelRow}>
                <Text style={styles.formLabel}>Initial Purchase Cost</Text>
                <View style={styles.requiredPill}>
                  <Text style={styles.requiredPillText}>Required</Text>
                </View>
              </View>
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
              <Text style={styles.formNote}>Required — used for profitability and reinvestment calculations.</Text>
            </View>

            {/* START DATE / FLOCK DATE */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>
                {model === 'breeder' ? 'Flock Start Date' : 'Production Start Date'}
              </Text>
              {model === 'breeder' && (
                <View style={styles.flockKindRow}>
                  {(['placed', 'hatched'] as const).map((kind) => (
                    <TouchableOpacity
                      key={kind}
                      activeOpacity={0.85}
                      style={[
                        styles.flockKindBtn,
                        flockDateKind === kind && styles.flockKindBtnActive,
                      ]}
                      onPress={() => setFlockDateKind(kind)}
                    >
                      <Text
                        style={[
                          styles.flockKindText,
                          flockDateKind === kind && styles.flockKindTextActive,
                        ]}
                      >
                        {kind === 'placed' ? 'Date Placed' : 'Date Hatched'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
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
                  <Text style={styles.fieldLbl}>{model === 'breeder' ? 'Flock Date' : 'Start Date'}</Text>
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
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                style={styles.durationScroll}
                contentContainerStyle={styles.durationScrollInner}
                snapToInterval={112}
                decelerationRate="fast"
              >
                {DURATION_OPTIONS.map((opt) => (
                  <DurationPill
                    key={opt}
                    opt={opt}
                    selected={duration === opt}
                    accent={DURATION_COLORS[opt]}
                    onSelect={() => {
                      setDuration(opt)
                      if (opt !== 'Custom') {
                        setCustomDurationTouched(false)
                      }
                    }}
                  />
                ))}
              </ScrollView>
            </View>

            {/* CUSTOM DURATION INPUT */}
            {duration === 'Custom' && (
              <View style={styles.customDurationSection}>
                <View style={styles.customDurationRow}>
                  <TextInput
                    style={[
                      styles.customDurationInput,
                      customDurationTouched && !isCustomValid && styles.customDurationInputError,
                    ]}
                    value={customDurationVal}
                    onChangeText={(v) => {
                      setCustomDurationVal(v.replace(/\D/g, ''))
                      setCustomDurationTouched(true)
                    }}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor="#A0AEA1"
                  />
                  <View style={styles.customDurationUnitRow}>
                    {(['weeks', 'months'] as const).map((unit) => (
                      <TouchableOpacity
                        key={unit}
                        activeOpacity={0.85}
                        style={[
                          styles.customDurationUnitBtn,
                          customDurationUnit === unit && styles.customDurationUnitBtnActive,
                        ]}
                        onPress={() => setCustomDurationUnit(unit)}
                      >
                        <Text
                          style={[
                            styles.customDurationUnitText,
                            customDurationUnit === unit && styles.customDurationUnitTextActive,
                          ]}
                        >
                          {unit === 'weeks' ? 'Weeks' : 'Months'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                {customDurationTouched && !isCustomValid && (
                  <Text style={styles.customDurationError}>Enter a whole number (minimum 1)</Text>
                )}
                {resolvedDurationDisplay ? (
                  <Text style={styles.customDurationResolved}>{resolvedDurationDisplay}</Text>
                ) : null}
              </View>
            )}

            {/* INDIVIDUAL-MODEL FIELDS */}
            {model === 'individual' && (
              <>
                <Animated.View entering={FadeInUp.duration(500).delay(260).springify()} style={styles.formSection}>
                  <Text style={styles.formLabel}>Breed (optional)</Text>
                  <TextInput
                    value={breed}
                    onChangeText={setBreed}
                    placeholder="e.g. Boer, Duroc, Nigerian Dwarf"
                    placeholderTextColor="#A0AEA1"
                    style={styles.batchNameInput}
                  />
                  <Text style={styles.formNote}>Helps track lineage and breed-specific performance.</Text>
                </Animated.View>

                <Animated.View entering={FadeInUp.duration(500).delay(280).springify()} style={styles.formSection}>
                  <Text style={styles.formLabel}>Sex Distribution (optional)</Text>
                  <View style={styles.fieldWrap}>
                    <View style={styles.fieldIco}>
                      <GoonaIcon icon={Icons.users} size={17} color="#A0AEA1" />
                    </View>
                    <View style={styles.fieldInner}>
                      <Text style={styles.fieldLbl}>Male / Female split</Text>
                      <TextInput
                        value={sexDistribution}
                        onChangeText={setSexDistribution}
                        placeholder="e.g. 2 males, 8 females"
                        placeholderTextColor="#A0AEA1"
                        style={[styles.fieldInput, { padding: 0 }]}
                      />
                    </View>
                  </View>
                </Animated.View>

                <Animated.View entering={FadeInUp.duration(500).delay(300).springify()} style={styles.formSection}>
                  <Text style={styles.formLabel}>Herd Notes (optional)</Text>
                  <View style={[styles.fieldWrap, { height: 88, alignItems: 'flex-start', paddingTop: 16 }]}>
                    <View style={styles.fieldIco}>
                      <GoonaIcon icon={Icons.fileText} size={17} color="#A0AEA1" />
                    </View>
                    <View style={[styles.fieldInner, { justifyContent: 'flex-start' }]}>
                      <TextInput
                        value={herdNotes}
                        onChangeText={setHerdNotes}
                        placeholder="Any additional details about this herd..."
                        placeholderTextColor="#A0AEA1"
                        multiline
                        style={[styles.fieldInput, { padding: 0, height: 60 }]}
                      />
                    </View>
                  </View>
                </Animated.View>
              </>
            )}

            {/* BREEDER FLOCK FIELDS */}
            {model === 'breeder' && (
              <>
                <Animated.View entering={FadeInUp.duration(500).delay(260).springify()} style={styles.formSection}>
                  <Text style={styles.formLabel}>Breed / Strain</Text>
                  <TextInput
                    value={breed}
                    onChangeText={setBreed}
                    placeholder="e.g. Turkey PS, Noiler, ISA Brown"
                    placeholderTextColor="#A0AEA1"
                    style={styles.batchNameInput}
                  />
                  <Text style={styles.formNote}>Parent-stock strain or line identification.</Text>
                </Animated.View>

                <Animated.View entering={FadeInUp.duration(500).delay(280).springify()} style={styles.formSection}>
                  <Text style={styles.formLabel}>Flock Composition</Text>
                  <View style={styles.breederSplitRow}>
                    <Text style={styles.breederLabelTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>Hens (female)</Text>
                    <View style={[styles.stepperWrap, styles.breederStepper]}>
                      <TouchableOpacity
                        style={styles.stepperBtnCompact}
                        activeOpacity={0.85}
                        onPress={() => setHensStr(String(Math.max(0, (hens - 1))))}
                      >
                        <Text style={styles.stepperBtnTextCompact}>−</Text>
                      </TouchableOpacity>
                      <TextInput
                        style={[styles.stepperInputCompact, { fontSize: stepperValueFont(hensStr) }]}
                        value={formatInput(hensStr)}
                        onChangeText={(v) => setHensStr(v.replace(/\D/g, ''))}
                        keyboardType="number-pad"
                        placeholder="0"
                        placeholderTextColor="#A0AEA1"/>
                      <TouchableOpacity
                        style={styles.stepperBtnCompact}
                        activeOpacity={0.85}
                        onPress={() => setHensStr(String(hens + 1))}
                      >
                        <Text style={styles.stepperBtnTextCompact}>+</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.breederLabelTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>Cocks (male)</Text>
                    <View style={[styles.stepperWrap, styles.breederStepper]}>
                      <TouchableOpacity
                        style={styles.stepperBtnCompact}
                        activeOpacity={0.85}
                        onPress={() => setCocksStr(String(Math.max(0, (cocks - 1))))}
                      >
                        <Text style={styles.stepperBtnTextCompact}>−</Text>
                      </TouchableOpacity>
                      <TextInput
                        style={[styles.stepperInputCompact, { fontSize: stepperValueFont(cocksStr) }]}
                        value={formatInput(cocksStr)}
                        onChangeText={(v) => setCocksStr(v.replace(/\D/g, ''))}
                        keyboardType="number-pad"
                        placeholder="0"
                        placeholderTextColor="#A0AEA1"/>
                      <TouchableOpacity
                        style={styles.stepperBtnCompact}
                        activeOpacity={0.85}
                        onPress={() => setCocksStr(String(cocks + 1))}
                      >
                        <Text style={styles.stepperBtnTextCompact}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={[styles.ratioChip, { opacity: hens > 0 || cocks > 0 ? 1 : 0.45 }]}>
                    <GoonaIcon icon={Icons.users} size={13} color="#2E7D32" />
                    <Text style={styles.ratioChipText}>
                      Female : Male ratio (auto) — {ratioPreview}
                    </Text>
                  </View>
                </Animated.View>

                <Animated.View entering={FadeInUp.duration(500).delay(300).springify()} style={styles.formSection}>
                  <Text style={styles.formLabel}>House / Pen</Text>
                  <View style={styles.fieldWrap}>
                    <View style={styles.fieldIco}>
                      <GoonaIcon icon={Icons.house} size={17} color="#A0AEA1" />
                    </View>
                    <View style={styles.fieldInner}>
                      <Text style={styles.fieldLbl}>House / Pen</Text>
                      <TextInput
                        value={house}
                        onChangeText={setHouse}
                        placeholder="e.g. Pen A, House 2"
                        placeholderTextColor="#A0AEA1"
                        style={[styles.fieldInput, { padding: 0 }]}
                      />
                    </View>
                  </View>
                </Animated.View>
              </>
            )}

            {/* BUDGET ALLOCATIONS (OPTIONAL) */}
            <Animated.View entering={FadeInUp.duration(500).delay(300).springify()} style={styles.formSection}>
              <BudgetAllocatorSection model={model} onChange={setBudgetAllocs} />
            </Animated.View>

            {/* FORECAST CARD */}
            <Animated.View entering={FadeInUp.duration(500).delay(320).springify()} style={styles.forecastCard}>
              <LinearGradient colors={['#E8F5E9', '#F0FDF4']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />
              <View style={styles.forecastHead}>
                <Text style={styles.forecastTitle}>Projected Production Summary</Text>
                <View style={styles.forecastIcon}>
                  <GoonaIcon icon={Icons.trendingUp} size={18} color="#16A34A" />
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
                  <Text style={styles.forecastLbl}>Cycle Length</Text>
                  <Text style={styles.forecastVal}>
                    {duration === 'Custom'
                      ? resolvedDurationDisplay || '—'
                      : duration
                    }
                  </Text>
                </View>
                <View>
                  <Text style={styles.forecastLbl}>Reinvestment Goal</Text>
                  <Text style={[styles.forecastVal, { color: '#2E7D32' }]}>₦{reinvestmentGoal.toLocaleString('en-NG')}</Text>
                </View>
              </View>
            </Animated.View>

            {/* OFFLINE CHIP */}
            <Animated.View entering={FadeInUp.duration(500).delay(400).springify()} style={styles.offlineChip}>
              <GoonaIcon icon={Icons.checkCircle} size={14} color="#2E7D32" />
              <Text style={styles.offlineText}>Offline Sync Ready</Text>
            </Animated.View>

            {/* CTA */}
            <Animated.View entering={FadeInUp.duration(500).delay(450).springify()}>
              <TouchableOpacity
                style={styles.primaryBtn}
                activeOpacity={0.9}
                onPress={handleCreateBatch}
              >
                <LinearGradient colors={['#2E7D32', '#43A047']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />
                <GoonaIcon icon={Icons.checkCircle} size={20} color="white" />
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
              <GoonaIcon icon={Icons.checkCircle} size={28} color="white" />
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
    backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 34, padding: 24, marginTop: 18,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.08, shadowRadius: 50, elevation: 6,
  },
  formSection: { marginBottom: 20 },
  formLabel: { fontSize: 14, fontWeight: '600', color: '#1F2937', marginBottom: 8 },
  formNote: { fontSize: 12, fontWeight: '400', color: '#94A3B8', marginTop: 6, lineHeight: 18 },

  requiredLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  requiredPill: {
    backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA',
    borderRadius: 100, paddingHorizontal: 9, paddingVertical: 3,
  },
  requiredPillText: { fontSize: 9, fontWeight: '800', color: '#DC2626', letterSpacing: 0.6, textTransform: 'uppercase' },

  /* field */
  fieldWrap: {
    flexDirection: 'row', alignItems: 'center', height: 60, borderRadius: 20,
    backgroundColor: '#F2F6F1', borderWidth: 1.5, borderColor: '#E2E8F0',
    paddingHorizontal: 16, gap: 12,
  },
  fieldWrapFocused: {
    borderColor: '#2E7D32',
    backgroundColor: '#EBF5EB',
    shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 2,
  },
  fieldIco: { width: 20, height: 20, flexShrink: 0, alignItems: 'center', justifyContent: 'center' },
  fieldInner: { flex: 1, justifyContent: 'center', minWidth: 0 },
  fieldLbl: { fontSize: 10, fontWeight: '500', color: '#A0AEA1', marginBottom: 1 },
  fieldInput: { fontSize: 15, fontWeight: '500', color: '#1B1B1B', padding: 0, margin: 0, fontFamily: 'Inter' },
  batchNameInput: {
    height: 60, borderRadius: 20, backgroundColor: '#F2F6F1',
    borderWidth: 1.5, borderColor: '#E2E8F0', paddingHorizontal: 16,
    fontSize: 15, fontWeight: '500', color: '#1B1B1B', fontFamily: 'Inter',
  },
  fieldInputText: { fontSize: 15, fontWeight: '500', color: '#1B1B1B' },
  fieldPrefix: { fontSize: 16, fontWeight: '600', color: '#1B1B1B', flexShrink: 0 },
  fieldRight: { flexShrink: 0, alignItems: 'center', justifyContent: 'center' },

  /* type groups (Step 1 — poultry/livestock/breeder sections) */
  typeGroup: {
    marginTop: 16, padding: 16, borderRadius: 22,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8EFE4',
    shadowColor: '#0F3D22', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.05, shadowRadius: 16, elevation: 2,
  },
  typeGroupBreeder: { backgroundColor: '#F0F7F6', borderColor: '#A9D4CF' },
  typeGroupHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typeGroupDot: { width: 6, height: 6, borderRadius: 3 },
  typeGroupTitle: { fontSize: 13.5, fontWeight: '700', color: '#15291A', flexShrink: 1 },
  typeGroupBadge: {
    borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4,
    shadowColor: '#0B5B55', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 2,
  },
  typeGroupBadgeText: { fontSize: 9, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.7, textTransform: 'uppercase' as any },
  typeGroupSub: { fontSize: 11, color: '#64748B', marginTop: 4, lineHeight: 16, paddingLeft: 14 },
  typeGroupRowWrap: { position: 'relative', marginTop: 16 },
  typeGroupRow: { marginHorizontal: -16 },
  typeGroupRowInner: { paddingHorizontal: 16, gap: 12 },
  typeGroupFade: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 44 },
  typeCardWrap: { width: 122, flexShrink: 0 },
  typeCard: {
    borderRadius: 20, borderWidth: 1.5, overflow: 'hidden',
    backgroundColor: 'white', paddingVertical: 14, paddingHorizontal: 8, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 2,
  },
  typeCheck: {
    position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center', zIndex: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.18, shadowRadius: 4, elevation: 3,
  },
  typeIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  typeIconSelected: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.14, shadowRadius: 8, elevation: 4 },
  typeName: { fontSize: 12, fontWeight: '700', textAlign: 'center' },

  /* Others tile (custom animal per group) */
  othersWrap: { width: 170, flexShrink: 0 },
  othersCardWrap: { flex: 1 },
  othersCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 18, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#B7C9B3',
    backgroundColor: 'rgba(255,255,255,0.7)', paddingVertical: 12, paddingHorizontal: 14,
  },
  othersCardSelected: { borderStyle: 'solid', borderColor: '#17663A', backgroundColor: '#F0F7F1' },
  othersChip: {
    width: 36, height: 36, borderRadius: 12, backgroundColor: '#E8F3EA',
    alignItems: 'center', justifyContent: 'center',
  },
  othersChipSelected: { backgroundColor: '#17663A' },
  othersBody: { flex: 1, minWidth: 0 },
  othersName: { fontSize: 13, fontWeight: '800', color: '#17663A' },
  othersNameSelected: { color: '#0E4D2A' },
  othersHint: { fontSize: 10, fontWeight: '600', color: '#7A9C81', marginTop: 1 },
  othersInputWrap: { marginTop: 14 },
  othersInputLabel: { fontSize: 12, fontWeight: '700', color: '#1B1B1B', marginBottom: 8 },
  othersInput: {
    height: 48, borderRadius: 16, borderWidth: 1.5, borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF', paddingHorizontal: 14,
    fontSize: 14, fontWeight: '500', color: '#1B1B1B',
  },
  othersInputError: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  othersErrorText: { marginTop: 6, fontSize: 11, fontWeight: '700', color: '#EF4444' },
  othersInputHint: { marginTop: 6, fontSize: 11, fontWeight: '500', color: '#7A9C81' },

  /* stepper */
  stepperWrap: {
    flexDirection: 'row', alignItems: 'center', height: 60, borderRadius: 20,
    backgroundColor: '#F2F6F1', borderWidth: 1.5, borderColor: '#E2E8F0',
    paddingHorizontal: 6, gap: 6,
  },
  stepperBtn: {
    width: 46, height: 46, borderRadius: 16, backgroundColor: 'white',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  stepperBtnText: { fontSize: 22, fontWeight: '600', color: '#1B1B1B' },
  stepperVal: {
    flex: 1, textAlign: 'center', fontSize: 24, fontWeight: '800', color: '#1B1B1B',
  },
  stepperInput: {
    flex: 1, textAlign: 'center', fontSize: 24, fontWeight: '800', color: '#1B1B1B',
    padding: 0, margin: 0, fontFamily: 'Inter',
  },
  /* compact variant for the breeder flock composition steppers (full-width rows, fixed buttons, value takes the rest) */
  breederStepper: { height: 56, paddingHorizontal: 6, gap: 8, borderRadius: 18 },
  stepperBtnCompact: {
    width: 42, height: 42, borderRadius: 14, backgroundColor: 'white',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  stepperBtnTextCompact: { fontSize: 19, fontWeight: '600', color: '#1B1B1B' },
  stepperInputCompact: {
    flex: 1, minWidth: 0, textAlign: 'center', fontSize: 20, fontWeight: '800', color: '#1B1B1B',
    padding: 0, margin: 0, fontFamily: 'Inter',
  },

  /* duration pills */
  durationScroll: { marginBottom: 4 },
  durationScrollInner: { gap: 10 },
  durationPillWrap: { width: 100 },
  durationPill: {
    borderRadius: 16, borderWidth: 1.5, overflow: 'hidden',
    backgroundColor: 'white', paddingVertical: 3, paddingHorizontal: 3, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  durationCheck: {
    position: 'absolute', top: 2, right: 2, width: 14, height: 14, borderRadius: 7,
    alignItems: 'center', justifyContent: 'center', zIndex: 2,
  },
  durationPillBg: { height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  durationPillBgSelected: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  durationPillText: { fontSize: 11, fontWeight: '700', textAlign: 'center' },

  /* custom duration */
  customDurationSection: { marginTop: -12, marginBottom: 20 },
  customDurationRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  customDurationInput: {
    flex: 1, height: 52, borderRadius: 16, backgroundColor: '#F2F6F1',
    borderWidth: 1.5, borderColor: '#E2E8F0', paddingHorizontal: 16,
    fontSize: 18, fontWeight: '700', color: '#1B1B1B', fontFamily: 'Inter',
  },
  customDurationInputError: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  customDurationUnitRow: { flexDirection: 'row', gap: 6 },
  customDurationUnitBtn: {
    paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12,
    backgroundColor: '#F2F6F1', borderWidth: 1.5, borderColor: '#E2E8F0',
  },
  customDurationUnitBtnActive: { backgroundColor: '#17663A', borderColor: '#17663A' },
  customDurationUnitText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  customDurationUnitTextActive: { color: '#FFFFFF' },
  customDurationError: { fontSize: 12, fontWeight: '500', color: '#EF4444', marginTop: 6 },
  customDurationResolved: { fontSize: 12, fontWeight: '600', color: '#16A34A', marginTop: 6 },

  /* forecast card */
  forecastCard: {
    borderRadius: 26, padding: 22, marginTop: 4, overflow: 'hidden',
    backgroundColor: '#F0FDF4',
    borderWidth: 1, borderColor: 'rgba(46,125,50,0.15)',
    shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 28, elevation: 4,
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
    width: '100%', height: 60, borderRadius: 22,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 18, overflow: 'hidden',
    shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.35, shadowRadius: 40, elevation: 8,
  },
  primaryBtnText: { fontWeight: '600', fontSize: 16, color: 'white' },

  /* footer */
  footerNote: { textAlign: 'center', fontSize: 12, color: '#A0AEA1', marginTop: 14, paddingBottom: 20 },

  /* date picker */
  datePickerWrap: { backgroundColor: 'white', borderRadius: 24, marginTop: 8, paddingTop: 8, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 2 },
  dateDoneBtn: { height: 48, alignItems: 'center', justifyContent: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9', marginHorizontal: 16 },
  dateDoneText: { fontSize: 15, fontWeight: '600', color: '#2E7D32' },

  /* flock date kind toggle */
  flockKindRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  flockKindBtn: {
    flex: 1, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F2F6F1', borderWidth: 1.5, borderColor: '#E2E8F0',
  },
  flockKindBtnActive: { backgroundColor: '#17663A', borderColor: '#17663A' },
  flockKindText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  flockKindTextActive: { color: '#FFFFFF' },

  /* breeder flock composition */
  breederSplitRow: { gap: 12 },
  breederLabelTitle: { fontSize: 13, fontWeight: '700', color: '#1B1B1B' },
  ratioChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12,
    backgroundColor: '#E8F5E9', borderRadius: 100, paddingHorizontal: 12, paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  ratioChipText: { fontSize: 12, fontWeight: '600', color: '#2E7D32' },

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
