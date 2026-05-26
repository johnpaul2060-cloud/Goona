import { useState, useCallback } from 'react'
import {
  View, Text, ScrollView,
  StyleSheet, useWindowDimensions,
} from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import GoonaIcon from '../../../../components/ui/GoonaIcon'
import { ArrowLeft, Search, Receipt, TrendingUp, TrendingDown, Users, Zap, Sparkles, Plus, Wallet, PiggyBank, FileText, Truck, Package, Wrench, CreditCard, AlertTriangle } from 'lucide-react-native'
import Animated, {
  useSharedValue, useAnimatedStyle, withDelay, withTiming,
  withSpring, Easing, FadeInUp,
} from 'react-native-reanimated'
import { Pressable } from 'react-native'
import BottomDock from '../../../../components/navigation/BottomDock'

function useStaggerEntry(index: number, baseDelay = 100) {
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(20)
  const effect = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }))
  useState(() => {
    const delay = baseDelay + index * 70
    opacity.value = withDelay(delay, withTiming(1, { duration: 450, easing: Easing.out(Easing.cubic) }))
    translateY.value = withDelay(delay, withSpring(0, { damping: 17, stiffness: 130 }))
  })
  return effect
}

function usePressScale() {
  const scale = useSharedValue(1)
  const opacity = useSharedValue(1)
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))
  return {
    style,
    onPressIn: () => {
      scale.value = withSpring(0.95, { damping: 15, stiffness: 200 })
      opacity.value = withTiming(0.85, { duration: 80 })
    },
    onPressOut: () => {
      scale.value = withSpring(1, { damping: 12, stiffness: 250 })
      opacity.value = withTiming(1, { duration: 100 })
    },
  }
}

const ANALYTICS = [
  { label: 'Feed Costs', value: '₦185k', trend: '+12%', trendUp: false, color: '#16A34A', icon: Package },
  { label: 'Staff Expenses', value: '₦94k', trend: '–2%', trendUp: true, color: '#1A56FF', icon: Users },
  { label: 'Burn Rate', value: '₦42k/wk', trend: '+5%', trendUp: false, color: '#F59E0B', icon: Zap },
  { label: 'Utilities', value: '₦28k', trend: '–8%', trendUp: true, color: '#EF4444', icon: Wrench },
]

interface QuickAction {
  label: string
  bg: string
  color: string
  icon: any
  route: any
  badge?: string
  badgeColor?: string
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: 'Record Expense', bg: '#F0FDF4', color: '#16A34A', icon: Plus, route: '/records/expenses/create' },
  { label: 'Categories', bg: '#EEF3FF', color: '#1A56FF', icon: Wallet, route: '/records/expenses/categories', badge: '6', badgeColor: '#1A56FF' },
  { label: 'Reports', bg: '#FFFBEB', color: '#F59E0B', icon: FileText, route: '/records/expenses/reports', badge: '3', badgeColor: '#F59E0B' },
  { label: 'Budget', bg: '#F5F3FF', color: '#7C3AED', icon: PiggyBank, route: '/records/expenses/budget', badge: '88%', badgeColor: '#F59E0B' },
]

const RECENT_EXPENSES = [
  { category: 'Feed', amount: '₦85,000', vendor: 'AgroFeed Ltd', date: 'Today, 9:30 AM', icon: Package, color: '#16A34A', bg: '#F0FDF4' },
  { category: 'Transport', amount: '₦12,500', vendor: 'Logistics Co', date: 'Yesterday', icon: Truck, color: '#F59E0B', bg: '#FFFBEB' },
  { category: 'Medication', amount: '₦24,000', vendor: 'VetMart', date: '2 days ago', icon: Receipt, color: '#EF4444', bg: '#FFF1F2' },
  { category: 'Salary', amount: '₦180,000', vendor: 'Farm Staff (6)', date: '3 days ago', icon: Users, color: '#1A56FF', bg: '#EEF3FF' },
]

export default function ExpensesScreen() {
  const insets = useSafeAreaInsets()
  const { width: SCREEN_W } = useWindowDimensions()
  const CARD_W = (SCREEN_W - 52) / 2
  const QA_W = (SCREEN_W - 52) / 4 - 4

  const qaPress = QUICK_ACTIONS.map(() => usePressScale())
  const backPress = usePressScale()

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollInner, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInUp.duration(500).springify()} style={styles.topNav}>
          <Animated.View style={backPress.style}>
            <Pressable
              style={styles.navBtn}
               onPress={() => router.replace('/(tabs)/records' as any)}
              onPressIn={backPress.onPressIn}
              onPressOut={backPress.onPressOut}
            >
              <GoonaIcon icon={ArrowLeft} size={24} color="#1B1B1B" />
            </Pressable>
          </Animated.View>
          <Text style={styles.topTitle}>Farm Expenses</Text>
          <Pressable style={styles.navBtn}>
            <GoonaIcon icon={Search} size={20} color="#1F2937" />
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(80).springify()} style={styles.headerSection}>
          <Text style={styles.headerLabel}>Operational Costs</Text>
          <Text style={styles.headerTitle}>Track Farm{"\n"}Expenses</Text>
          <Text style={styles.headerSub}>Monitor feed, staff, transport, and operational spending across all batches.</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(140).springify()} style={styles.analyticsGrid}>
          {ANALYTICS.map((a, i) => {
            const entry = useStaggerEntry(i, 180)
            return (
              <Animated.View key={a.label} style={[styles.analyticsCard, { width: CARD_W }, entry]}>
                <View style={[styles.anIcon, { backgroundColor: a.color + '15' }]}>
                  <GoonaIcon icon={a.icon} size={16} color={a.color} />
                </View>
                <Text style={styles.anValue}>{a.value}</Text>
                <Text style={styles.anLabel}>{a.label}</Text>
                <View style={styles.anTrendRow}>
                  <GoonaIcon icon={a.trendUp ? TrendingUp : TrendingDown} size={12} color={a.trendUp ? '#16A34A' : '#EF4444'} />
                  <Text style={[styles.anTrend, { color: a.trendUp ? '#16A34A' : '#EF4444' }]}>{a.trend}</Text>
                </View>
              </Animated.View>
            )
          })}
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(300).springify()} style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </Animated.View>

        <View style={[styles.qaGrid, { paddingHorizontal: 16 }]}>
          {QUICK_ACTIONS.map((qa, i) => {
            const ps = qaPress[i]
            return (
              <Animated.View
                key={qa.label}
                entering={FadeInUp.duration(400).delay(340 + i * 60).springify()}
                style={ps.style}
              >
                <Pressable
                  style={[styles.qaCard, { backgroundColor: qa.bg, width: QA_W }]}
                  onPress={() => router.push(qa.route as any)}
                  onPressIn={ps.onPressIn}
                  onPressOut={ps.onPressOut}
                >
                  <View style={styles.qaIconWrap}>
                    <GoonaIcon icon={qa.icon} size={24} color={qa.color} />
                    {qa.badge && (
                      <View style={[styles.qaBadge, { backgroundColor: qa.badgeColor }]}>
                        <Text style={styles.qaBadgeText}>{qa.badge}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.qaLabel, { color: qa.color }]}>{qa.label}</Text>
                </Pressable>
              </Animated.View>
            )
          })}
        </View>

        <Animated.View entering={FadeInUp.duration(500).delay(420).springify()} style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Expenses</Text>
          <Pressable onPress={() => router.push('/records/expenses/categories' as any)}>
            <Text style={styles.sectionAction}>See All</Text>
          </Pressable>
        </Animated.View>

        {RECENT_EXPENSES.map((e, i) => {
          const rowPress = usePressScale()
          return (
            <Animated.View
              key={i}
              entering={FadeInUp.duration(400).delay(460 + i * 80).springify()}
              style={rowPress.style}
            >
              <Pressable
                style={styles.expenseRow}
                onPress={() => router.push('/records/expenses/create' as any)}
                onPressIn={rowPress.onPressIn}
                onPressOut={rowPress.onPressOut}
              >
                <View style={[styles.expenseIcon, { backgroundColor: e.bg }]}>
                  <GoonaIcon icon={e.icon} size={18} color={e.color} />
                </View>
                <View style={styles.expenseInfo}>
                  <Text style={styles.expenseCategory}>{e.category}</Text>
                  <Text style={styles.expenseVendor}>{e.vendor} · {e.date}</Text>
                </View>
                <Text style={styles.expenseAmount}>{e.amount}</Text>
              </Pressable>
            </Animated.View>
          )
        })}

        <Animated.View entering={FadeInUp.duration(500).delay(600).springify()}>
          <Pressable
            style={styles.insightCard}
            onPress={() => router.push('/records/expenses/reports' as any)}
          >
            <View style={styles.insightHeader}>
              <GoonaIcon icon={Sparkles} size={16} color="#2E7D32" />
              <Text style={styles.insightTitle}>GOONA IQ Expense Insight</Text>
            </View>
            <Text style={styles.insightText}>
              Feed expenses increased 12% this week. Consider bulk purchasing to reduce per-bag costs. Staff costs are within projected range.
            </Text>
            <Text style={styles.insightFooter}>Operational burn rate is improving · ₦42k/week</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>

      <BottomDock />
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
    paddingBottom: 160,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 52,
  },
  navBtn: {
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
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  headerLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2E7D32',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#1B1B1B',
    letterSpacing: -0.8,
    lineHeight: 36,
  },
  headerSub: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginTop: 8,
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 10,
  },
  analyticsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  anIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  anValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B1B1B',
  },
  anLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  anTrendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  anTrend: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1B1B1B',
  },
  sectionAction: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2E7D32',
  },
  qaGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  qaCard: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 8,
  },
  qaIconWrap: {
    position: 'relative',
  },
  qaBadge: {
    position: 'absolute',
    top: -6,
    right: -10,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 18,
    alignItems: 'center',
  },
  qaBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  qaLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  expenseIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expenseInfo: {
    flex: 1,
    gap: 2,
  },
  expenseCategory: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1B1B1B',
  },
  expenseVendor: {
    fontSize: 12,
    color: '#94A3B8',
  },
  expenseAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1B1B1B',
  },
  insightCard: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
    backgroundColor: '#F0FDF4',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(46,125,50,0.12)',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  insightTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1B5E20',
  },
  insightText: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
  },
  insightFooter: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8,
  },
})
