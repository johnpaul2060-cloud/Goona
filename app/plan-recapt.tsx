import React, { useState, useCallback, useMemo } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, Platform, Keyboard,
} from 'react-native'
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'
import GoonaIcon from '../components/ui/GoonaIcon'
import {
  ArrowLeft, CheckCircle, Target, Calendar, Plus,
} from 'lucide-react-native'
import { StatusBar } from 'expo-status-bar'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated'
import BottomDock from '../components/navigation/BottomDock'

const PROJECTS = [
  { icon: '\u{1F425}', label: 'Restocking', purposes: ['Broilers', 'Layers', 'Fingerlings', 'Livestock replacement'] },
  { icon: '\u{1F33E}', label: 'Feed Purchase', purposes: ['Feed reserve', 'Bulk feed purchase'] },
  { icon: '\u{1F477}', label: 'Staff Salaries', purposes: ['Monthly salaries', 'Casual workers', 'Farm attendants', 'Security personnel'] },
  { icon: '\u{1F3D7}\uFE0F', label: 'Infrastructure', purposes: ['New poultry pen', 'New fish pond', 'Farm fencing', 'Water systems', 'Farm expansion'] },
  { icon: '\u{1F69C}', label: 'Equipment Upgrade', purposes: ['Generators', 'Feeders', 'Drinkers', 'Solar systems', 'Machinery'] },
  { icon: '\u2795', label: 'Custom Project', purposes: [] },
] as const

function calcDaily(amount: number, days: number) {
  if (days <= 0) return 0
  return Math.round(amount / days)
}

function daysBetween(target: Date) {
  const now = new Date()
  const diff = target.getTime() - now.getTime()
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

function formatCurrency(n: number) {
  return '\u20A6' + n.toLocaleString()
}

function formatDateDisplay(date: Date) {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function getNextContributionDate(plan: 'Daily' | 'Weekly' | 'Monthly'): Date {
  const now = new Date()
  switch (plan) {
    case 'Daily': {
      const d = new Date(now)
      d.setDate(d.getDate() + 1)
      return d
    }
    case 'Weekly': {
      const d = new Date(now)
      const daysUntilFriday = (5 - d.getDay() + 7) % 7
      d.setDate(d.getDate() + (daysUntilFriday === 0 ? 7 : daysUntilFriday))
      return d
    }
    case 'Monthly': {
      return new Date(now.getFullYear(), now.getMonth() + 1, 1)
    }
  }
}

export default function PlanRecaptScreen() {
  const insets = useSafeAreaInsets()

  const [goalName, setGoalName] = useState('')
  const [amountRaw, setAmountRaw] = useState('')
  const [targetDate, setTargetDate] = useState<Date | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [tempDate, setTempDate] = useState<Date | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<'Daily' | 'Weekly' | 'Monthly'>('Weekly')
  const [showSummary, setShowSummary] = useState(false)

  const targetAmount = Math.max(0, parseInt(amountRaw || '0', 10))
  const displayAmount = amountRaw ? targetAmount.toLocaleString() : ''
  const daysLeft = targetDate ? daysBetween(targetDate) : 0

  const dailyReq = targetAmount > 0 && daysLeft > 0 ? calcDaily(targetAmount, daysLeft) : 0
  const weeklyReq = Math.round(dailyReq * 7)
  const monthlyReq = Math.round(dailyReq * 30.44)

  const selectedProject = useMemo(
    () => PROJECTS.find(p => p.label === goalName) || null,
    [goalName],
  )

  const recommendedPlan = useMemo(() => {
    if (targetAmount <= 0 || daysLeft <= 0) return 'Monthly'
    const weeklyAmount = Math.round(targetAmount / daysLeft * 7)
    if (weeklyAmount < 10000) return 'Daily'
    if (weeklyAmount > 100000) return 'Monthly'
    return 'Weekly'
  }, [targetAmount, daysLeft])

  const recommendationReason = useMemo(() => {
    switch (recommendedPlan) {
      case 'Daily': return 'This provides the highest chance of reaching the target consistently.'
      case 'Weekly': return 'Balanced weekly contributions align with market schedules.'
      case 'Monthly': return 'Best for predictable farm income cycles.'
    }
  }, [recommendedPlan])

  const recommendedAmount = recommendedPlan === 'Daily'
    ? dailyReq
    : recommendedPlan === 'Weekly'
      ? weeklyReq
      : monthlyReq

  const canSubmit =
    goalName.trim().length > 0 &&
    targetAmount > 0 &&
    targetDate !== null &&
    targetDate > new Date()

  const handleChipPress = useCallback((label: string) => {
    if (label === 'Custom Project') setGoalName('')
    else setGoalName(label)
  }, [])

  const onDateChange = useCallback(
    (_event: DateTimePickerEvent, date?: Date) => {
      if (Platform.OS === 'android') {
        setShowDatePicker(false)
        if (_event.type === 'set' && date) setTargetDate(date)
      } else {
        if (date) setTempDate(date)
      }
    },
    [],
  )

  const handleCreate = () => {
    if (!canSubmit) return
    Keyboard.dismiss()
    setShowSummary(true)
  }

  const nextAmount =
    selectedPlan === 'Daily'
      ? dailyReq
      : selectedPlan === 'Weekly'
        ? weeklyReq
        : monthlyReq

  const progress = 0.28
  const savedAmount = 850000

  const dueLabels: Record<string, string> = {
    Daily: 'Tomorrow',
    Weekly: 'Friday',
    Monthly: '1st of next month',
  }

  const nextContributionDate = useMemo(
    () => getNextContributionDate(selectedPlan),
    [selectedPlan],
  )

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollInner,
          { paddingBottom: insets.bottom + 140 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── HERO HEADER ── */}
        <Animated.View
          entering={FadeInDown.duration(600).springify()}
          style={[styles.heroSection, { paddingTop: insets.top + 16 }]}
        >
          <TouchableOpacity
            style={styles.backBtn}
            activeOpacity={0.7}
            onPress={() => router.back()}
          >
            <GoonaIcon icon={ArrowLeft} size={20} color="#1F2937" />
          </TouchableOpacity>

          <Text style={styles.heroTitle}>Plan Next Project</Text>
          <Text style={styles.heroSub}>
            Save towards your next farm expenditure.
          </Text>
        </Animated.View>

        {showSummary ? (
          /* ── SUMMARY VIEW ── */
          <>
            <Animated.View
              entering={FadeInUp.duration(400).springify()}
              style={styles.summaryCard}
            >
              <LinearGradient
                colors={['#2E7D32', '#1B5E20']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.summaryGradient}
              >
                <View style={styles.summaryGlow1} pointerEvents="none" />
                <View style={styles.summaryGlow2} pointerEvents="none" />

                <View style={styles.summaryHead}>
                  <View style={styles.summaryIcon}>
                    <GoonaIcon icon={Target} size={18} color="#2E7D32" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.summaryPre}>Project</Text>
                    <Text style={styles.summaryName}>{goalName}</Text>
                  </View>
                </View>

                <View style={styles.summaryDivider} />

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Target Amount</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(targetAmount)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Contribution Plan</Text>
                  <Text style={styles.summaryValue}>{selectedPlan}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Target Date</Text>
                  <Text style={styles.summaryValue}>
                    {targetDate ? formatDateDisplay(targetDate) : ''}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Projected Completion</Text>
                  <Text style={styles.summaryValue}>
                    {targetDate ? formatDateDisplay(targetDate) : ''}
                  </Text>
                </View>

                <View style={styles.summaryDivider} />

                <View style={styles.summaryProgressSection}>
                  <View style={styles.summaryProgressHead}>
                    <Text style={styles.summaryProgressLabel}>Progress</Text>
                    <Text style={styles.summaryProgressPct}>
                      {Math.round(progress * 100)}%
                    </Text>
                  </View>
                  <View style={styles.summaryProgressTrack}>
                    <View
                      style={[
                        styles.summaryProgressFill,
                        { width: `${progress * 100}%` },
                      ]}
                    />
                  </View>
                </View>

                <View style={styles.summaryDetailGrid}>
                  <View style={styles.summaryDetailItem}>
                    <Text style={styles.summaryDetailLabel}>Saved</Text>
                    <Text style={styles.summaryDetailValue}>{formatCurrency(savedAmount)}</Text>
                  </View>
                  <View style={styles.summaryDetailDivider} />
                  <View style={styles.summaryDetailItem}>
                    <Text style={styles.summaryDetailLabel}>Next</Text>
                    <Text style={styles.summaryDetailValue}>{formatCurrency(nextAmount)}</Text>
                  </View>
                  <View style={styles.summaryDetailDivider} />
                  <View style={styles.summaryDetailItem}>
                    <Text style={styles.summaryDetailLabel}>Due</Text>
                    <Text style={styles.summaryDetailValue}>{dueLabels[selectedPlan]}</Text>
                  </View>
                </View>
              </LinearGradient>
            </Animated.View>

            <Animated.View
              entering={FadeInUp.duration(400).delay(100).springify()}
              style={styles.summaryAction}
            >
              <TouchableOpacity style={styles.confirmBtn} activeOpacity={0.85}>
                <GoonaIcon icon={CheckCircle} size={20} color="#FFFFFF" />
                <Text style={styles.confirmBtnText}>Confirm Project Plan</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.editBtn}
                activeOpacity={0.7}
                onPress={() => setShowSummary(false)}
              >
                <Text style={styles.editBtnText}>Edit Plan</Text>
              </TouchableOpacity>
            </Animated.View>
          </>
        ) : (
          /* ── FORM VIEW ── */
          <>
            {/* Project Selection Cards */}
            <Animated.View
              entering={FadeInDown.duration(400).delay(80).springify()}
            >
              <Text style={styles.sectionLabel}>Select Project</Text>
              <View style={styles.projectRow}>
                {PROJECTS.map((project) => {
                  const active = goalName === project.label
                  return (
                    <TouchableOpacity
                      key={project.label}
                      activeOpacity={0.85}
                      style={[styles.projectCard, active && styles.projectCardActive]}
                      onPress={() => handleChipPress(project.label)}
                    >
                      <Text style={styles.projectEmoji}>{project.icon}</Text>
                      <Text
                        style={[
                          styles.projectLabel,
                          active && styles.projectLabelActive,
                        ]}
                        numberOfLines={2}
                      >
                        {project.label}
                      </Text>
                      {active && (
                        <View style={styles.projectCheck}>
                          <GoonaIcon icon={CheckCircle} size={16} color="#2E7D32" />
                        </View>
                      )}
                    </TouchableOpacity>
                  )
                })}
              </View>
            </Animated.View>

            {/* Category Purposes */}
            {selectedProject && selectedProject.purposes.length > 0 && (
              <Animated.View
                entering={FadeInDown.duration(300).springify()}
                style={styles.purposesCard}
              >
                <Text style={styles.purposesTitle}>What this covers</Text>
                <View style={styles.purposesList}>
                  {selectedProject.purposes.map((purpose) => (
                    <Text key={purpose} style={styles.purposeItem}>
                      • {purpose}
                    </Text>
                  ))}
                </View>
              </Animated.View>
            )}

            {/* Custom Project Name */}
            <Animated.View
              entering={FadeInDown.duration(400).delay(120).springify()}
              style={styles.fieldCard}
            >
              <Text style={styles.fieldLabel}>Project Name</Text>
              <TextInput
                style={styles.fieldInput}
                value={goalName}
                onChangeText={setGoalName}
                placeholder="e.g. Broiler Batch 6"
                placeholderTextColor="#CBD5E1"
              />
            </Animated.View>

            {/* Target Amount — Premium Input */}
            <Animated.View
              entering={FadeInDown.duration(400).delay(160).springify()}
              style={styles.amountCard}
            >
              <Text style={styles.fieldLabel}>Target Amount</Text>
              <View style={styles.amountRow}>
                <Text style={styles.amountPrefix}>₦</Text>
                <TextInput
                  style={styles.amountInput}
                  value={displayAmount}
                  onChangeText={(v) => setAmountRaw(v.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                  placeholder="3,000,000"
                  placeholderTextColor="#CBD5E1"
                />
              </View>
            </Animated.View>

            {/* Target Date — Premium Picker */}
            <Animated.View
              entering={FadeInDown.duration(400).delay(200).springify()}
              style={styles.fieldCard}
            >
              <Text style={styles.fieldLabel}>Target Date</Text>
              <TouchableOpacity
                style={styles.dateSelector}
                activeOpacity={0.7}
                onPress={() => {
                  setShowDatePicker(true)
                  if (targetDate) setTempDate(new Date(targetDate))
                  else setTempDate(null)
                }}
              >
                <GoonaIcon icon={Calendar} size={20} color="#2E7D32" />
                <Text
                  style={[
                    styles.dateText,
                    !targetDate && styles.datePlaceholder,
                  ]}
                >
                  {targetDate
                    ? formatDateDisplay(targetDate)
                    : 'Select target date'}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <View style={styles.pickerWrap}>
                  <DateTimePicker
                    value={tempDate || targetDate || new Date()}
                    mode="date"
                    minimumDate={new Date()}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onDateChange}
                    themeVariant="light"
                  />
                  {Platform.OS === 'ios' && (
                    <TouchableOpacity
                      style={styles.confirmDateBtn}
                      activeOpacity={0.8}
                      onPress={() => {
                        if (tempDate) setTargetDate(tempDate)
                        setShowDatePicker(false)
                        setTempDate(null)
                      }}
                    >
                      <GoonaIcon icon={CheckCircle} size={16} color="#FFFFFF" />
                      <Text style={styles.confirmDateText}>Confirm Date</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </Animated.View>

            {/* GOONA Recommendation Card */}
            {targetAmount > 0 && daysLeft > 0 && (
              <Animated.View
                entering={FadeInUp.duration(500).springify()}
                style={styles.recCard}
              >
                <LinearGradient
                  colors={[
                    'rgba(46,125,50,0.06)',
                    'rgba(46,125,50,0.02)',
                    '#FFFFFF',
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.recGradient}
                >
                  <View style={styles.recBadge}>
                    <LinearGradient
                      colors={['#2E7D32', '#1B5E20']}
                      style={styles.recBadgeGrad}
                    >
                      <GoonaIcon icon={Target} size={12} color="#FFFFFF" />
                    </LinearGradient>
                    <Text style={styles.recBadgeText}>GOONA Recommendation</Text>
                  </View>

                  <View style={styles.recRows}>
                    <View style={styles.recTargetRow}>
                      <Text style={styles.recTargetLabel}>Target</Text>
                      <Text style={styles.recTargetValue}>
                        {formatCurrency(targetAmount)}
                      </Text>
                    </View>
                    <View style={styles.recDivider} />
                    <View style={styles.recRow}>
                      <Text style={styles.recLabel}>Daily</Text>
                      <Text style={styles.recValue}>{formatCurrency(dailyReq)}</Text>
                    </View>
                    <View style={styles.recRow}>
                      <Text style={styles.recLabel}>Weekly</Text>
                      <Text style={styles.recValue}>{formatCurrency(weeklyReq)}</Text>
                    </View>
                    <View style={styles.recRow}>
                      <Text style={styles.recLabel}>Monthly</Text>
                      <Text style={styles.recValue}>{formatCurrency(monthlyReq)}</Text>
                    </View>
                  </View>

                  <View style={styles.recDivider} />

                  <View style={styles.recRecommended}>
                    <View style={styles.recRecommendedBadge}>
                      <GoonaIcon icon={CheckCircle} size={12} color="#FFFFFF" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.recRecommendedLabel}>Recommended: {recommendedPlan}</Text>
                      <Text style={styles.recRecommendedAmount}>
                        {formatCurrency(recommendedAmount)} /{recommendedPlan.toLowerCase()}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.recRecommendedReason}>{recommendationReason}</Text>

                  <Text style={styles.recFootnote}>
                    Based on {daysLeft} days until target date
                  </Text>
                </LinearGradient>
              </Animated.View>
            )}

            {/* Schedule Selector */}
            <Animated.View
              entering={FadeInUp.duration(400).delay(250).springify()}
            >
              <Text style={styles.sectionLabel}>Contribution Schedule</Text>
              <View style={styles.scheduleRow}>
                {(['Daily', 'Weekly', 'Monthly'] as const).map((plan) => {
                  const active = plan === selectedPlan
                  return (
                    <TouchableOpacity
                      key={plan}
                      activeOpacity={0.8}
                      style={[styles.schedulePill, active && styles.schedulePillActive]}
                      onPress={() => setSelectedPlan(plan)}
                    >
                      <Text
                        style={[
                          styles.schedulePillText,
                          active && styles.schedulePillTextActive,
                        ]}
                      >
                        {plan}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </Animated.View>

            {/* Selected Schedule Card */}
            <Animated.View
              entering={FadeInUp.duration(400).delay(300).springify()}
              style={styles.selectedScheduleCard}
            >
              <View style={styles.selectedScheduleRow}>
                <Text style={styles.selectedScheduleLabel}>Selected Schedule</Text>
                <Text style={styles.selectedScheduleValue}>{selectedPlan}</Text>
              </View>
              <View style={styles.selectedScheduleDivider} />
              <View style={styles.selectedScheduleRow}>
                <Text style={styles.selectedScheduleLabel}>Next Contribution Date</Text>
                <Text style={styles.selectedScheduleValue}>
                  {formatDateDisplay(nextContributionDate)}
                </Text>
              </View>
            </Animated.View>

            {/* Create Button */}
            <Animated.View
              entering={FadeInUp.duration(400).delay(350).springify()}
              style={styles.actionWrap}
            >
              <TouchableOpacity
                style={[
                  styles.createBtn,
                  !canSubmit && styles.createBtnDisabled,
                ]}
                activeOpacity={0.85}
                disabled={!canSubmit}
                onPress={handleCreate}
              >
                <LinearGradient
                  colors={['#2E7D32', '#1B5E20']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.createBtnGrad}
                >
                  <GoonaIcon icon={Target} size={20} color="#FFFFFF" />
                  <Text style={styles.createBtnText}>Create Project Plan</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </>
        )}
      </ScrollView>

      <BottomDock />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAF7' },
  scroll: { flex: 1 },
  scrollInner: { paddingHorizontal: 20 },

  /* ── HERO ── */
  heroSection: { marginBottom: 24 },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'white',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 14,
    elevation: 3,
  },
  heroTitle: {
    fontSize: 30, fontWeight: '800',
    color: '#1B1B1B', lineHeight: 37,
  },
  heroSub: {
    fontSize: 15, color: '#94A3B8', marginTop: 6,
  },

  /* ── Section Label ── */
  sectionLabel: {
    fontSize: 13, fontWeight: '700',
    color: '#1F2937', marginBottom: 12, marginTop: 4,
  },

  /* ── Project Selection Cards ── */
  projectRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  projectCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 18,
    paddingTop: 20,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
    position: 'relative',
  },
  projectCardActive: {
    borderColor: '#2E7D32',
    backgroundColor: '#F0FDF4',
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 4,
  },
  projectEmoji: {
    fontSize: 28,
    marginBottom: 10,
  },
  projectLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
    lineHeight: 18,
  },
  projectLabelActive: {
    color: '#2E7D32',
  },
  projectCheck: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  purposesCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  purposesTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  purposesList: {
    gap: 6,
  },
  purposeItem: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
    lineHeight: 20,
  },

  /* ── Fields ── */
  fieldCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },
  fieldLabel: {
    fontSize: 12, fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  fieldInput: {
    fontSize: 17, fontWeight: '600',
    color: '#1F2937', paddingVertical: 4,
  },

  /* ── Amount Card ── */
  amountCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
    borderLeftWidth: 3,
    borderLeftColor: '#2E7D32',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountPrefix: {
    fontSize: 28, fontWeight: '700',
    color: '#2E7D32', marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 28, fontWeight: '800',
    color: '#1B1B1B', paddingVertical: 4,
  },

  /* ── Date Selector ── */
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  dateText: {
    fontSize: 17, fontWeight: '600', color: '#1F2937',
  },
  datePlaceholder: { color: '#CBD5E1' },
  pickerWrap: {
    marginTop: 12,
    alignItems: 'center',
  },
  confirmDateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    backgroundColor: '#2E7D32',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
    width: '100%',
  },
  confirmDateText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* ── GOONA Recommendation Card ── */
  recCard: {
    borderRadius: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 3,
    overflow: 'hidden',
  },
  recGradient: { padding: 20 },
  recBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 18,
  },
  recBadgeGrad: {
    width: 24, height: 24, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  recBadgeText: {
    fontSize: 13, fontWeight: '700', color: '#2E7D32',
  },
  recRows: { gap: 10 },
  recTargetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  recTargetLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  recTargetValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1B1B1B',
  },
  recDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  recRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  recLabel: {
    fontSize: 14, color: '#64748B',
  },
  recValue: {
    fontSize: 17, fontWeight: '800', color: '#1B1B1B',
  },
  recRecommended: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 14,
    marginTop: 2,
  },
  recRecommendedBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recRecommendedLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  recRecommendedAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2E7D32',
  },
  recRecommendedReason: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 12,
    marginBottom: -4,
  },
  recFootnote: {
    fontSize: 11, color: '#94A3B8',
    textAlign: 'center', marginTop: 16,
  },

  /* ── Schedule Selector ── */
  scheduleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  schedulePill: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: 'white',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  schedulePillActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#2E7D32',
  },
  schedulePillText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8',
  },
  schedulePillTextActive: {
    color: '#2E7D32',
  },
  selectedScheduleCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
    borderLeftWidth: 3,
    borderLeftColor: '#2E7D32',
  },
  selectedScheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  selectedScheduleDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  selectedScheduleLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#94A3B8',
  },
  selectedScheduleValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },

  /* ── Create Button ── */
  actionWrap: { marginBottom: 24 },
  createBtn: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 6,
  },
  createBtnGrad: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  createBtnDisabled: { opacity: 0.4 },
  createBtnText: {
    fontSize: 16, fontWeight: '700', color: 'white',
  },

  /* ── Summary Card ── */
  summaryCard: {
    borderRadius: 28,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.25,
    shadowRadius: 40,
    elevation: 8,
  },
  summaryGradient: {
    padding: 24,
    position: 'relative',
  },
  summaryGlow1: {
    position: 'absolute', top: -30, right: -30,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  summaryGlow2: {
    position: 'absolute', bottom: -40, left: -20,
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(174,234,0,0.06)',
  },
  summaryHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  summaryIcon: {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  summaryPre: {
    fontSize: 11, color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  summaryName: {
    fontSize: 22, fontWeight: '800',
    color: 'white', marginTop: 2,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 13, color: 'rgba(255,255,255,0.6)',
  },
  summaryValue: {
    fontSize: 15, fontWeight: '700', color: 'white',
  },
  summaryProgressSection: { marginBottom: 16 },
  summaryProgressHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryProgressLabel: {
    fontSize: 12, color: 'rgba(255,255,255,0.6)',
  },
  summaryProgressPct: {
    fontSize: 12, fontWeight: '700', color: '#AEEA00',
  },
  summaryProgressTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  summaryProgressFill: {
    height: '100%',
    backgroundColor: '#AEEA00',
    borderRadius: 3,
  },
  summaryDetailGrid: {
    flexDirection: 'row',
  },
  summaryDetailItem: {
    flex: 1, alignItems: 'center',
  },
  summaryDetailLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  summaryDetailValue: {
    fontSize: 16, fontWeight: '800', color: 'white',
  },
  summaryDetailDivider: {
    width: 1, height: 28,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignSelf: 'center',
  },

  /* ── Summary Actions ── */
  summaryAction: { marginTop: 20, gap: 12, marginBottom: 24 },
  confirmBtn: {
    height: 54, borderRadius: 18,
    backgroundColor: '#2E7D32',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 6,
  },
  confirmBtnText: {
    fontSize: 16, fontWeight: '700', color: 'white',
  },
  editBtn: {
    height: 48, borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtnText: {
    fontSize: 14, fontWeight: '600', color: '#94A3B8',
  },
})
