import React, { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'expo-router'
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, Platform, Keyboard,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import GoonaIcon from '../components/ui/GoonaIcon'
import {
  ArrowLeft, Clock, Plus, Calendar, Wallet,
} from 'lucide-react-native'
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated'
import Svg, { Circle } from 'react-native-svg'
import BottomDock from '../components/navigation/BottomDock'
import { useWalletStore, setPendingReturnUrl } from '../store/useWalletStore'
import { formatInput, parseAmount, formatNaira } from '../utils/format'

const DEMO_PROJECTS = [
  { id: 1, icon: '\u{1F33E}', name: 'Feed Purchase', target: 500000, saved: 250000 },
  { id: 2, icon: '\u{1F477}', name: 'Staff Salaries', target: 300000, saved: 120000 },
  { id: 3, icon: '\u{1F3D7}\uFE0F', name: 'Infrastructure', target: 3000000, saved: 900000 },
  { id: 4, icon: '\u{1F425}', name: 'Restocking', target: 800000, saved: 580000 },
] as const

const DEMO_HISTORY = [
  { date: 'Today', project: 'Feed Purchase', amount: 10000, status: 'Successful' },
  { date: 'Yesterday', project: 'Staff Salaries', amount: 20000, status: 'Successful' },
  { date: '18 Jun 2026', project: 'Infrastructure', amount: 50000, status: 'Successful' },
  { date: '15 Jun 2026', project: 'Feed Purchase', amount: 15000, status: 'Successful' },
  { date: '12 Jun 2026', project: 'Restocking', amount: 25000, status: 'Successful' },
] as const

const DEMO_UPCOMING = [
  { project: 'Staff Salaries', due: 'Friday', amount: 10000 },
  { project: 'Feed Purchase', due: 'Monday', amount: 15000 },
  { project: 'Infrastructure', due: '1 Jul 2026', amount: 50000 },
] as const

const QUICK_AMOUNTS = [5000, 10000, 20000, 50000, 100000]

function formatCurrency(n: number) {
  return formatNaira(n)
}

function formatCompactCurrency(n: number) {
  if (n >= 1000000) return '\u20A6' + (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return '\u20A6' + (n / 1000).toFixed(0) + 'k'
  return '\u20A6' + n.toLocaleString('en-NG')
}

export default function FundRecaptScreen() {
  const router = useRouter()
  const [quickAmount, setQuickAmount] = useState<number | null>(null)
  const [customAmountStr, setCustomAmountStr] = useState('')

  const totalSaved = useMemo(
    () => DEMO_PROJECTS.reduce((sum, p) => sum + p.saved, 0),
    [],
  )

  const activeProjects = DEMO_PROJECTS.length
  const completedProjects = 2

  const totalTarget = useMemo(
    () => DEMO_PROJECTS.reduce((sum, p) => sum + p.target, 0),
    [],
  )

  const overallProgress = totalTarget > 0
    ? Math.round((totalSaved / totalTarget) * 100)
    : 0

  const customAmount = parseAmount(customAmountStr)
  const customAmountDisplay = formatInput(customAmountStr)

  const handleQuickAmount = useCallback((amount: number) => {
    setQuickAmount(amount)
    setCustomAmountStr('')
  }, [])

  const handleCustomAmountChange = useCallback((v: string) => {
    setCustomAmountStr(v.replace(/[^0-9]/g, ''))
    setQuickAmount(null)
  }, [])

  const walletStatus = useWalletStore((s) => s.walletStatus)

  const handleFundProject = useCallback((projectId: number) => {
    if (walletStatus !== 'activated') {
      setPendingReturnUrl('/fund-recapt')
      router.push('/wallet-activation')
      return
    }
    router.push(`/fund-project?id=${projectId}`)
  }, [walletStatus])

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollInner,
          { paddingBottom: Platform.OS === 'ios' ? 190 : 160 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── HERO HEADER ── */}
        <Animated.View
          entering={FadeInDown.duration(600).springify()}
          style={[styles.heroSection, { paddingTop: Platform.OS === 'ios' ? 60 : 20 }]}
        >
          <TouchableOpacity
            style={styles.backBtn}
            activeOpacity={0.7}
            onPress={() => router.push('/recapitalization')}
          >
            <GoonaIcon icon={ArrowLeft} size={20} color="#1F2937" />
          </TouchableOpacity>

          <Text style={styles.heroTitle}>Fund Recapt</Text>
          <Text style={styles.heroSub}>
            Add money to your projects and track your progress.
          </Text>
        </Animated.View>

        {/* ── FUNDING OVERVIEW ── */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(80).springify()}
          style={styles.heroCard}
        >
          <Text style={styles.heroCardLabel}>Funding Overview</Text>

          <View style={styles.ringSection}>
            <View style={styles.ringContainer}>
              <Svg width={110} height={110} viewBox="0 0 110 110">
                <Circle
                  cx="55"
                  cy="55"
                  r="46"
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth="8"
                  fill="none"
                />
                <Circle
                  cx="55"
                  cy="55"
                  r="46"
                  stroke="#AEEA00"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={2 * Math.PI * 46}
                  strokeDashoffset={2 * Math.PI * 46 * (1 - overallProgress / 100)}
                  strokeLinecap="round"
                  transform="rotate(-90, 55, 55)"
                />
              </Svg>
              <View style={styles.ringCenter} pointerEvents="none">
                <Text style={styles.ringPercent}>{overallProgress}%</Text>
              </View>
            </View>

            <View style={styles.ringInfo}>
              <Text style={styles.ringBalance}>{formatCompactCurrency(totalSaved)}</Text>
              <Text style={styles.ringGoal}>
                Saved of {formatCurrency(totalTarget)} Goal
              </Text>
            </View>
          </View>

          <View style={styles.heroDivider} />

          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatLabel}>Active Projects</Text>
              <Text style={styles.heroStatValue}>{activeProjects}</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatLabel}>Completed</Text>
              <Text style={styles.heroStatValue}>{completedProjects}</Text>
            </View>
          </View>

          <View style={styles.heroDivider} />

          <View style={styles.heroNextRow}>
            <GoonaIcon icon={Clock} size={14} color="rgba(255,255,255,0.6)" />
            <Text style={styles.heroNextText}>
              Next Contribution: <Text style={{ fontWeight: '800', color: '#FFFFFF' }}>Tomorrow</Text>
            </Text>
          </View>
        </Animated.View>

        {/* ── ACTIVE PROJECTS ── */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(140).springify()}
        >
          <Text style={styles.sectionLabel}>Active Projects</Text>
          <View style={styles.projectStack}>
            {DEMO_PROJECTS.map((project, idx) => {
              const progress = project.target > 0
                ? Math.min(1, project.saved / project.target)
                : 0
              return (
                <Animated.View
                  key={project.id}
                  entering={FadeInUp.duration(350).delay(idx * 80).springify()}
                  style={styles.projectCard}
                >
                  <View style={styles.projectHead}>
                    <Text style={styles.projectIcon}>{project.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.projectName}>{project.name}</Text>
                      <View style={styles.projectTargetRow}>
                        <View style={styles.projectTargetItem}>
                          <Text style={styles.projectTargetLabel}>Target</Text>
                          <Text style={styles.projectTargetValue}>
                            {formatCurrency(project.target)}
                          </Text>
                        </View>
                        <View style={styles.projectTargetItem}>
                          <Text style={styles.projectTargetLabel}>Saved</Text>
                          <Text style={[styles.projectTargetValue, { color: '#2E7D32' }]}>
                            {formatCurrency(project.saved)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View style={styles.projectProgressSection}>
                    <View style={styles.projectProgressHead}>
                      <Text style={styles.projectProgressPct}>
                        {Math.round(progress * 100)}%
                      </Text>
                    </View>
                    <View style={styles.projectProgressTrack}>
                      <View
                        style={[
                          styles.projectProgressFill,
                          { width: `${progress * 100}%` },
                        ]}
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.fundBtn}
                    activeOpacity={0.8}
                    onPress={() => handleFundProject(project.id)}
                  >
                    <GoonaIcon icon={Wallet} size={16} color="#FFFFFF" />
                    <Text style={styles.fundBtnText}>Fund Project</Text>
                  </TouchableOpacity>
                </Animated.View>
              )
            })}
          </View>
        </Animated.View>

        {/* ── QUICK FUND ── */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(200).springify()}
        >
          <Text style={styles.sectionLabel}>Quick Fund</Text>
          <View style={styles.quickAmountRow}>
            {QUICK_AMOUNTS.map((amount) => {
              const active = quickAmount === amount
              return (
                <TouchableOpacity
                  key={amount}
                  activeOpacity={0.8}
                  style={[styles.quickChip, active && styles.quickChipActive]}
                  onPress={() => handleQuickAmount(amount)}
                >
                  <Text
                    style={[
                      styles.quickChipText,
                      active && styles.quickChipTextActive,
                    ]}
                  >
                    {formatCurrency(amount)}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>

          <View style={styles.quickCustomRow}>
            <Text style={styles.quickCustomPrefix}>{'\u20A6'}</Text>
            <TextInput
              style={styles.quickCustomInput}
              value={customAmountDisplay}
              onChangeText={handleCustomAmountChange}
              keyboardType="numeric"
              placeholder="Custom amount"
              placeholderTextColor="#CBD5E1"
            />
            {customAmount > 0 && (
              <TouchableOpacity
                style={styles.quickFundBtn}
                activeOpacity={0.8}
                onPress={() => {
                  if (walletStatus !== 'activated') {
                    setPendingReturnUrl('/fund-recapt')
                    router.push('/wallet-activation')
                    return
                  }
                  router.push('/fund-project?id=1')
                }}
              >
                <Text style={styles.quickFundBtnText}>Add</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* ── CONTRIBUTION HISTORY ── */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(260).springify()}
        >
          <Text style={styles.sectionLabel}>Contribution History</Text>
          <View style={styles.historyCard}>
            {DEMO_HISTORY.map((item, idx) => (
              <View key={idx}>
                {idx > 0 && <View style={styles.historyDivider} />}
                <View style={styles.historyRow}>
                  <View style={styles.historyLeft}>
                    <Text style={styles.historyDate}>{item.date}</Text>
                    <Text style={styles.historyProject}>{item.project}</Text>
                  </View>
                  <View style={styles.historyRight}>
                    <Text style={styles.historyAmount}>
                      {formatCurrency(item.amount)}
                    </Text>
                    <View style={styles.historyStatusBadge}>
                      <Text style={styles.historyStatusText}>{item.status}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* ── UPCOMING CONTRIBUTIONS ── */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(320).springify()}
        >
          <Text style={styles.sectionLabel}>Upcoming Contributions</Text>
          <View style={styles.upcomingCard}>
            {DEMO_UPCOMING.map((item, idx) => (
              <View key={idx}>
                {idx > 0 && <View style={styles.historyDivider} />}
                <View style={styles.upcomingRow}>
                  <Text style={styles.upcomingProject}>{item.project}</Text>
                  <View style={styles.upcomingRight}>
                    <View style={styles.upcomingDue}>
                      <GoonaIcon icon={Calendar} size={12} color="#94A3B8" />
                      <Text style={styles.upcomingDueText}>{item.due}</Text>
                    </View>
                    <Text style={styles.upcomingAmount}>
                      {formatCurrency(item.amount)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>
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

  /* ── Funding Overview ── */
  heroCard: {
    borderRadius: 24,
    padding: 24,
    paddingTop: 26,
    marginBottom: 24,
    backgroundColor: '#2E7D32',
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 8,
  },
  heroCardLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 20,
  },
  ringSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 20,
  },
  ringContainer: {
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringPercent: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  ringInfo: {
    flex: 1,
  },
  ringBalance: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 40,
    marginBottom: 4,
  },
  ringGoal: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 18,
  },
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 14,
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  heroStatItem: {
    flex: 1,
  },
  heroStatValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  heroStatLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.5)',
  },
  heroStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginHorizontal: 12,
  },
  heroNextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroNextText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },

  /* ── Active Projects ── */
  projectStack: { gap: 12, marginBottom: 24 },
  projectCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },
  projectHead: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  projectIcon: {
    fontSize: 28,
    marginTop: 2,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  projectTargetRow: {
    flexDirection: 'row',
    gap: 20,
  },
  projectTargetItem: {
    gap: 2,
  },
  projectTargetLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  projectTargetValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  projectProgressSection: {
    marginBottom: 12,
  },
  projectProgressHead: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 6,
  },
  projectProgressPct: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2E7D32',
  },
  projectProgressTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  projectProgressFill: {
    height: '100%',
    backgroundColor: '#2E7D32',
    borderRadius: 3,
  },
  fundBtn: {
    height: 42,
    borderRadius: 12,
    backgroundColor: '#2E7D32',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  fundBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* ── Quick Fund ── */
  quickAmountRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  quickChip: {
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 100,
    backgroundColor: 'white',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  quickChipActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#2E7D32',
  },
  quickChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  quickChipTextActive: {
    color: '#2E7D32',
  },
  quickCustomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    height: 52,
  },
  quickCustomPrefix: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2E7D32',
    marginRight: 8,
  },
  quickCustomInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    height: '100%',
  },
  quickFundBtn: {
    backgroundColor: '#2E7D32',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  quickFundBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* ── Contribution History ── */
  historyCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  historyLeft: {
    gap: 2,
  },
  historyDate: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  historyProject: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  historyRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  historyAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1B1B1B',
  },
  historyStatusBadge: {
    backgroundColor: '#F0FDF4',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  historyStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2E7D32',
  },
  historyDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },

  /* ── Upcoming Contributions ── */
  upcomingCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },
  upcomingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  upcomingProject: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  upcomingRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  upcomingDue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  upcomingDueText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  upcomingAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1B1B1B',
  },
})
