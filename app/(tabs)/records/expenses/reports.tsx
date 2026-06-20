import { useState, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Dimensions,
} from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import GoonaIcon from '../../../../components/ui/GoonaIcon'
import { ArrowLeft, TrendingUp, TrendingDown, Download, BarChart3, PieChart, Calendar, Sparkles, Package, Users, Zap, Wrench, Truck, Receipt } from 'lucide-react-native'
import Animated, { FadeInUp } from 'react-native-reanimated'

const { width: SCREEN_W } = Dimensions.get('window')

const TABS = ['Weekly', 'Monthly', 'Quarterly']
const BAR_W = (SCREEN_W - 72) / 7

const WEEKLY_DATA = [
  { day: 'Mon', value: 45 }, { day: 'Tue', value: 38 },
  { day: 'Wed', value: 62 }, { day: 'Thu', value: 41 },
  { day: 'Fri', value: 55 }, { day: 'Sat', value: 29 },
  { day: 'Sun', value: 33 },
]

const BREAKDOWN = [
  { label: 'Feed', value: 38, color: '#16A34A', icon: Package },
  { label: 'Salaries', value: 28, color: '#1A56FF', icon: Users },
  { label: 'Medication', value: 12, color: '#EF4444', icon: Receipt },
  { label: 'Transport', value: 8, color: '#F59E0B', icon: Truck },
  { label: 'Utilities', value: 8, color: '#8B5CF6', icon: Zap },
  { label: 'Repairs', value: 6, color: '#06B6D4', icon: Wrench },
]

export default function ReportsScreen() {
  const insets = useSafeAreaInsets()
  const [activeTab, setActiveTab] = useState(0)

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
          <Text style={styles.topTitle}>Reports</Text>
          <TouchableOpacity style={styles.navAction} activeOpacity={0.7}>
            <GoonaIcon icon={Download} size={20} color="#1F2937" />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(80).springify()} style={styles.headerSection}>
          <Text style={styles.headerLabel}>Expense Analytics</Text>
          <Text style={styles.headerTitle}>Spending{"\n"}Reports</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(120).springify()} style={styles.tabRow}>
          {TABS.map((t, i) => (
            <TouchableOpacity
              key={t}
              style={[styles.tab, i === activeTab && styles.tabActive]}
              activeOpacity={0.7}
              onPress={() => setActiveTab(i)}
            >
              <Text style={[styles.tabLabel, i === activeTab && styles.tabLabelActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(160).springify()} style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summaryLabel}>Total Spending</Text>
              <Text style={styles.summaryValue}>₦348,000</Text>
            </View>
            <View style={styles.summaryBadge}>
              <GoonaIcon icon={TrendingUp} size={14} color="#EF4444" />
              <Text style={styles.summaryTrend}>+8.2%</Text>
            </View>
          </View>
          <View style={styles.chartContainer}>
            {WEEKLY_DATA.map((d, i) => (
              <View key={d.day} style={styles.barCol}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: d.value * 2.4,
                      backgroundColor: i === 2 || i === 4 ? '#2E7D32' : '#E8F5E9',
                    },
                  ]}
                />
                <Text style={styles.barLabel}>{d.day}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(220).springify()} style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Expense Breakdown</Text>
        </Animated.View>
        {BREAKDOWN.map((b, i) => (
          <Animated.View
            key={b.label}
            entering={FadeInUp.duration(400).delay(260 + i * 60).springify()}
            style={styles.breakdownRow}
          >
            <View style={[styles.bdIcon, { backgroundColor: b.color + '15' }]}>
              <GoonaIcon icon={b.icon} size={16} color={b.color} />
            </View>
            <View style={styles.bdInfo}>
              <Text style={styles.bdLabel}>{b.label}</Text>
              <View style={styles.bdBarBg}>
                <View style={[styles.bdBarFill, { width: `${b.value}%`, backgroundColor: b.color }]} />
              </View>
            </View>
            <Text style={styles.bdValue}>{b.value}%</Text>
          </Animated.View>
        ))}

        <Animated.View entering={FadeInUp.duration(500).delay(460).springify()} style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <GoonaIcon icon={Sparkles} size={16} color="#2E7D32" />
            <Text style={styles.insightTitle}>GOONA IQ Analysis</Text>
          </View>
          <Text style={styles.insightText}>
            Weekly burn rate increased 8.2%. Feed costs remain the largest expense at 38%. Consider negotiating bulk pricing to reduce overall operational costs.
          </Text>
        </Animated.View>
      </ScrollView>
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
    paddingBottom: 8,
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
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    marginHorizontal: 20,
    padding: 3,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  tabLabelActive: {
    color: '#1B1B1B',
  },
  summaryCard: {
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
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1B1B1B',
  },
  summaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  summaryTrend: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 140,
  },
  barCol: {
    alignItems: 'center',
    gap: 6,
  },
  bar: {
    width: BAR_W,
    borderRadius: 6,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1B1B1B',
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 12,
  },
  bdIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bdInfo: {
    flex: 1,
    gap: 6,
  },
  bdLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1B1B1B',
  },
  bdBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  bdBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  bdValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1B1B1B',
    width: 36,
    textAlign: 'right',
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
