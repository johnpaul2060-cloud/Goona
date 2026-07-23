import React, { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'expo-router'
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, Platform, Keyboard,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import GoonaIcon from '../components/ui/GoonaIcon'
import { Icons } from '../shared/icons'
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated'
import Svg, { Circle } from 'react-native-svg'
import { useWalletStore, setPendingReturnUrl } from '../store/useWalletStore'
import { usePlanStore } from '../store/usePlanStore'
import { formatInput, parseAmount, formatNaira } from '../utils/format'

const QUICK_AMOUNTS = [5000, 10000, 20000, 50000, 100000]

type TabType = 'history' | 'upcoming'

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
  const [activeTab, setActiveTab] = useState<TabType>('history')
  const walletStatus = useWalletStore((s) => s.walletStatus)
  const plans = usePlanStore((s) => s.plans)
  const activePlans = useMemo(() => plans.filter((p) => p.status === 'active'), [plans])
  const completedPlans = useMemo(() => plans.filter((p) => p.status === 'completed'), [plans])

  const allContributions = useMemo(() => {
    const entries: Array<{ date: string; project: string; amount: number }> = []
    for (const plan of plans) {
      for (const c of plan.contributions) {
        entries.push({ date: c.date, project: plan.name, amount: c.amount })
      }
    }
    return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [plans])

  const totalSaved = useMemo(
    () => activePlans.reduce((sum, p) => sum + p.saved, 0),
    [activePlans],
  )

  const activeProjects = activePlans.length
  const completedProjects = completedPlans.length

  const totalTarget = useMemo(
    () => activePlans.reduce((sum, p) => sum + p.target, 0),
    [activePlans],
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

  const handleFundProject = useCallback((planId: string) => {
    if (walletStatus !== 'activated') {
      setPendingReturnUrl('/fund-recapt')
      router.push('/wallet-activation')
      return
    }
    router.push(`/fund-project?planId=${planId}`)
  }, [walletStatus])

  const upcoming = useMemo(() => {
    return activePlans
      .filter((p) => p.contributions.length > 0 || p.saved > 0)
      .map((p) => {
        const perContribution = Math.round(p.target / Math.max(1, p.contributions.length + 1))
        return {
          project: p.name,
          amount: perContribution,
        }
      })
  }, [activePlans])

  function formatDateDisplay(iso: string): string {
    const d = new Date(iso)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    if (diff < 86400000 && d.getDate() === now.getDate()) return 'Today'
    if (diff < 172800000 && d.getDate() === now.getDate() - 1) return 'Yesterday'
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const renderTabToggle = () => (
    <View style={styles.tabRow}>
      {(['history', 'upcoming'] as TabType[]).map((tab) => {
        const active = activeTab === tab
        return (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, active && styles.tabBtnActive]}
            activeOpacity={0.7}
            onPress={() => setActiveTab(tab)}
          >
            <GoonaIcon
              icon={tab === 'history' ? Icons.clock : Icons.calendar}
              size={16}
              color={active ? '#FFF' : '#64748B'}
            />
            <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
              {tab === 'history' ? 'HISTORY' : 'UPCOMING'}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollInner,
          { paddingBottom: 40 },
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
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/recapitalization' as any)}
          >
            <GoonaIcon icon={Icons.arrowLeft} size={20} color="#1F2937" />
          </TouchableOpacity>

          <Text style={styles.heroTitle}>Add Contribution</Text>
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
            <GoonaIcon icon={Icons.clock} size={14} color="rgba(255,255,255,0.6)" />
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
            {activePlans.length === 0 ? (
              <View style={styles.emptyCard}>
                <GoonaIcon icon={Icons.target} size={24} color="#CBD5E1" />
                <Text style={styles.emptyText}>No active projects yet</Text>
                <Text style={styles.emptySub}>Create a plan to get started.</Text>
              </View>
            ) : (activePlans.map((plan, idx) => {
              const progress = plan.target > 0
                ? Math.min(1, plan.saved / plan.target)
                : 0
              return (
                <Animated.View
                  key={plan.id}
                  entering={FadeInUp.duration(350).delay(idx * 80).springify()}
                  style={styles.projectCard}
                >
                  <View style={styles.projectHead}>
                    <Text style={styles.projectIcon}>{plan.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.projectName}>{plan.name}</Text>
                      <View style={styles.projectTargetRow}>
                        <View style={styles.projectTargetItem}>
                          <Text style={styles.projectTargetLabel}>Target</Text>
                          <Text style={styles.projectTargetValue}>
                            {formatCurrency(plan.target)}
                          </Text>
                        </View>
                        <View style={styles.projectTargetItem}>
                          <Text style={styles.projectTargetLabel}>Saved</Text>
                          <Text style={[styles.projectTargetValue, { color: '#2E7D32' }]}>
                            {formatCurrency(plan.saved)}
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
                    onPress={() => handleFundProject(plan.id)}
                  >
                    <GoonaIcon icon={Icons.wallet} size={16} color="#FFFFFF" />
                    <Text style={styles.fundBtnText}>Fund Project</Text>
                  </TouchableOpacity>
                </Animated.View>
              )
            }))}
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
                  if (activePlans.length > 0) {
                    router.push(`/fund-project?planId=${activePlans[0].id}&amount=${customAmount}`)
                  }
                }}
              >
                <Text style={styles.quickFundBtnText}>Add</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* ── TAB TOGGLE + CONTRIBUTION TABLE ── */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(260).springify()}
        >
          {renderTabToggle()}

          {activeTab === 'history' ? (
            <View style={styles.historyCard}>
              {allContributions.length === 0 ? (
                <View style={styles.emptySubRow}>
                  <Text style={styles.emptySubText}>No contributions yet</Text>
                </View>
              ) : (allContributions.slice(0, 20).map((item, idx) => (
                <View key={idx}>
                  {idx > 0 && <View style={styles.historyDivider} />}
                  <View style={styles.historyRow}>
                    <View style={styles.historyLeft}>
                      <Text style={styles.historyDate}>{formatDateDisplay(item.date)}</Text>
                      <Text style={styles.historyProject}>{item.project}</Text>
                    </View>
                    <View style={styles.historyRight}>
                      <Text style={styles.historyAmount}>
                        {formatCurrency(item.amount)}
                      </Text>
                      <View style={styles.historyStatusBadge}>
                        <Text style={styles.historyStatusText}>Successful</Text>
                      </View>
                    </View>
                  </View>
                </View>
              )))}
            </View>
          ) : (
            <View style={styles.upcomingCard}>
              {upcoming.length === 0 ? (
                <View style={styles.emptySubRow}>
                  <Text style={styles.emptySubText}>No upcoming contributions</Text>
                </View>
              ) : (upcoming.map((item, idx) => (
                <View key={idx}>
                  {idx > 0 && <View style={styles.historyDivider} />}
                  <View style={styles.upcomingRow}>
                    <Text style={styles.upcomingProject}>{item.project}</Text>
                    <View style={styles.upcomingRight}>
                      <Text style={styles.upcomingAmount}>
                        {formatCurrency(item.amount)}
                      </Text>
                    </View>
                  </View>
                </View>
              )))}
            </View>
          )}
        </Animated.View>
      </ScrollView>
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

  /* ── Tab Toggle ── */
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 4,
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: '#2E7D32',
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  tabLabelActive: {
    color: '#FFFFFF',
  },

  /* ── Empty States ── */
  emptyCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#94A3B8',
  },
  emptySub: {
    fontSize: 13,
    color: '#CBD5E1',
  },
  emptySubRow: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptySubText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
})
