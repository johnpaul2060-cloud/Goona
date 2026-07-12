import { useState } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Dimensions,
} from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import GoonaIcon from '../../../../components/ui/GoonaIcon'
import { Icons } from '../../../../shared/icons'
import Animated, { FadeInUp } from 'react-native-reanimated'
import BottomDock from '../../../../components/navigation/BottomDock'

const { width: SCREEN_W } = Dimensions.get('window')

const CATEGORIES = [
  { label: 'Feed', icon: Icons.package, color: '#16A34A', bg: '#F0FDF4', count: 24, amount: '₦185,000' },
  { label: 'Transport', icon: Icons.truck, color: '#F59E0B', bg: '#FFFBEB', count: 8, amount: '₦42,500' },
  { label: 'Medication', icon: Icons.receipt, color: '#EF4444', bg: '#FFF1F2', count: 12, amount: '₦67,000' },
  { label: 'Salaries', icon: Icons.users, color: '#1A56FF', bg: '#EEF3FF', count: 6, amount: '₦540,000' },
  { label: 'Utilities', icon: Icons.zap, color: '#8B5CF6', bg: '#F5F3FF', count: 4, amount: '₦28,000' },
  { label: 'Repairs', icon: Icons.wrench, color: '#06B6D4', bg: '#ECFEFF', count: 3, amount: '₦15,500' },
]

export default function CategoriesScreen() {
  const insets = useSafeAreaInsets()
  const [editing, setEditing] = useState(false)

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
            onPress={() => { if (router.canGoBack()) { router.back() } else { router.replace('/records/sales-revenue' as any) } }}
          >
            <GoonaIcon icon={Icons.arrowLeft} size={24} color="#1B1B1B" />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Categories</Text>
          <TouchableOpacity
            style={styles.navAction}
            activeOpacity={0.7}
            onPress={() => setEditing(!editing)}
          >
            <GoonaIcon icon={editing ? Icons.edit3 : Icons.moreHorizontal} size={20} color="#1F2937" />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(80).springify()} style={styles.headerSection}>
          <Text style={styles.headerLabel}>Expense Categories</Text>
          <Text style={styles.headerTitle}>Organise{"\n"}Spending</Text>
          <Text style={styles.headerSub}>{CATEGORIES.length} categories · ₦878k total</Text>
        </Animated.View>

        {CATEGORIES.map((c, i) => (
          <Animated.View
            key={c.label}
            entering={FadeInUp.duration(400).delay(140 + i * 60).springify()}
          >
            <View style={styles.categoryRow}>
              <View style={[styles.categoryIcon, { backgroundColor: c.bg }]}>
                <GoonaIcon icon={c.icon} size={18} color={c.color} />
              </View>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryLabel}>{c.label}</Text>
                <Text style={styles.categoryMeta}>{c.count} entries</Text>
              </View>
              <Text style={styles.categoryAmount}>{c.amount}</Text>
              {editing && (
                <TouchableOpacity style={styles.deleteBtn} activeOpacity={0.7}>
                  <GoonaIcon icon={Icons.trash2} size={16} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        ))}

        <Animated.View entering={FadeInUp.duration(500).delay(420).springify()}>
          <TouchableOpacity style={styles.addBtn} activeOpacity={0.7}>
            <GoonaIcon icon={Icons.plus} size={18} color="#2E7D32" />
            <Text style={styles.addText}>Add Custom Category</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(480).springify()} style={styles.insightCard}>
          <Text style={styles.insightTitle}>GOONA IQ</Text>
          <Text style={styles.insightText}>
            Feed is your highest expense category at 38% of total. Consider bulk purchase agreements to reduce costs by up to 15%.
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
    paddingBottom: 24,
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
  headerSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  categoryRow: {
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
  categoryIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryInfo: {
    flex: 1,
    gap: 2,
  },
  categoryLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1B1B1B',
  },
  categoryMeta: {
    fontSize: 12,
    color: '#94A3B8',
  },
  categoryAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1B1B1B',
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: 'rgba(46,125,50,0.2)',
    borderStyle: 'dashed',
  },
  addText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
  },
  insightCard: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: '#F0FDF4',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(46,125,50,0.12)',
  },
  insightTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1B5E20',
    marginBottom: 6,
  },
  insightText: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
  },
})
