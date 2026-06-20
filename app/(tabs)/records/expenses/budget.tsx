import { useState } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Dimensions,
} from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import GoonaIcon from '../../../../components/ui/GoonaIcon'
import { ArrowLeft, PiggyBank, TrendingUp, TrendingDown, Settings, Sparkles, Target, AlertTriangle, Package, Truck, Users, Wrench, Zap, Receipt } from 'lucide-react-native'
import Animated, { FadeInUp } from 'react-native-reanimated'
import BottomDock from '../../../../components/navigation/BottomDock'

const { width: SCREEN_W } = Dimensions.get('window')

const BUDGET_ITEMS = [
  { label: 'Feed', limit: '₦200,000', spent: '₦185,000', pct: 92.5, color: '#16A34A', icon: Package, bg: '#F0FDF4' },
  { label: 'Salaries', limit: '₦600,000', spent: '₦540,000', pct: 90, color: '#1A56FF', bg: '#EEF3FF', icon: Users },
  { label: 'Medication', limit: '₦80,000', spent: '₦67,000', pct: 83.75, color: '#EF4444', bg: '#FFF1F2', icon: Receipt },
  { label: 'Transport', limit: '₦50,000', spent: '₦42,500', pct: 85, color: '#F59E0B', bg: '#FFFBEB', icon: Truck },
  { label: 'Utilities', limit: '₦35,000', spent: '₦28,000', pct: 80, color: '#8B5CF6', bg: '#F5F3FF', icon: Zap },
  { label: 'Repairs', limit: '₦25,000', spent: '₦15,500', pct: 62, color: '#06B6D4', bg: '#ECFEFF', icon: Wrench },
]

export default function BudgetScreen() {
  const insets = useSafeAreaInsets()

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollInner, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInUp.duration(500).springify()} style={styles.topNav}>
          <TouchableOpacity
            style={styles.navBack}
            activeOpacity={0.7}
            onPress={() => { if (router.canGoBack()) { router.back() } else { router.replace('/records/expenses' as any) } }}
          >
            <GoonaIcon icon={ArrowLeft} size={24} color="#1B1B1B" />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Budget</Text>
          <TouchableOpacity style={styles.navAction} activeOpacity={0.7}>
            <GoonaIcon icon={Settings} size={20} color="#1F2937" />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(80).springify()} style={styles.headerSection}>
          <Text style={styles.headerLabel}>Budget Planner</Text>
          <Text style={styles.headerTitle}>Manage{"\n"}Spending Limits</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(120).springify()} style={styles.overviewCard}>
          <View style={styles.overviewRow}>
            <View style={styles.overviewLeft}>
              <GoonaIcon icon={PiggyBank} size={24} color="#2E7D32" />
              <View>
                <Text style={styles.overviewLabel}>Monthly Budget</Text>
                <Text style={styles.overviewValue}>₦990,000</Text>
              </View>
            </View>
            <View style={styles.overviewRight}>
              <Text style={styles.overviewSpentLabel}>Spent</Text>
              <Text style={styles.overviewSpent}>₦878,000</Text>
            </View>
          </View>
          <View style={styles.overviewBarBg}>
            <View style={[styles.overviewBarFill, { width: '88.7%' }]} />
          </View>
          <View style={styles.overviewMeta}>
            <Text style={styles.overviewMetaText}>
              <GoonaIcon icon={AlertTriangle} size={12} color="#F59E0B" /> 88.7% used · ₦112k remaining
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(180).springify()} style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Category Allocation</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.sectionAction}>Adjust</Text>
          </TouchableOpacity>
        </Animated.View>

        {BUDGET_ITEMS.map((b, i) => (
          <Animated.View
            key={b.label}
            entering={FadeInUp.duration(400).delay(220 + i * 60).springify()}
          >
            <View style={styles.budgetRow}>
              <View style={styles.budgetTop}>
                <View style={styles.budgetLeft}>
                  <View style={[styles.bgIcon, { backgroundColor: b.bg }]}>
                    <GoonaIcon icon={b.icon} size={16} color={b.color} />
                  </View>
                  <View>
                    <Text style={styles.bgLabel}>{b.label}</Text>
                    <Text style={styles.bgMeta}>{b.spent} / {b.limit}</Text>
                  </View>
                </View>
                <Text style={[styles.bgPct, b.pct > 90 && { color: '#EF4444' }]}>{b.pct}%</Text>
              </View>
              <View style={styles.bgBarBg}>
                <View
                  style={[
                    styles.bgBarFill,
                    {
                      width: `${b.pct}%`,
                      backgroundColor: b.pct > 90 ? '#EF4444' : b.color,
                    },
                  ]}
                />
              </View>
            </View>
          </Animated.View>
        ))}

        <Animated.View entering={FadeInUp.duration(500).delay(480).springify()} style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <GoonaIcon icon={Sparkles} size={16} color="#2E7D32" />
            <Text style={styles.insightTitle}>GOONA IQ Recommendation</Text>
          </View>
          <Text style={styles.insightText}>
            Feed budget is at 92.5% with 2 weeks remaining. Consider reallocating 10% from the repairs budget to cover potential overage.
          </Text>
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
  navAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2E7D32',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1B1B1B',
    letterSpacing: -0.8,
    lineHeight: 34,
  },
  overviewCard: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  overviewLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  overviewLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  overviewValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1B1B1B',
  },
  overviewRight: {
    alignItems: 'flex-end',
  },
  overviewSpentLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  overviewSpent: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B1B1B',
  },
  overviewBarBg: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  overviewBarFill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: '#F59E0B',
  },
  overviewMeta: {
    marginTop: 8,
  },
  overviewMetaText: {
    fontSize: 12,
    color: '#F59E0B',
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
  budgetRow: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  budgetTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  budgetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bgIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1B1B1B',
  },
  bgMeta: {
    fontSize: 12,
    color: '#94A3B8',
  },
  bgPct: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1B1B1B',
  },
  bgBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  bgBarFill: {
    height: '100%',
    borderRadius: 3,
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
})
