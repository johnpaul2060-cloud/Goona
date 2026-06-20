import { useState, useCallback } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Dimensions, Platform,
} from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import GoonaIcon from '../../../../components/ui/GoonaIcon'
import { ArrowLeft, Plus, Package, Truck, Users, Wrench, Zap, ShoppingCart, Camera, Check, X, Receipt } from 'lucide-react-native'
import Animated, { FadeInUp } from 'react-native-reanimated'
import BottomDock from '../../../../components/navigation/BottomDock'
import { formatInput, parseAmount } from '../../../../utils/format'

const { width: SCREEN_W } = Dimensions.get('window')

const CATEGORIES = [
  { label: 'Feed', icon: Package, color: '#16A34A' },
  { label: 'Transport', icon: Truck, color: '#F59E0B' },
  { label: 'Medication', icon: Receipt, color: '#EF4444' },
  { label: 'Salaries', icon: Users, color: '#1A56FF' },
  { label: 'Utilities', icon: Zap, color: '#8B5CF6' },
  { label: 'Repairs', icon: Wrench, color: '#06B6D4' },
]

export default function CreateExpenseScreen() {
  const insets = useSafeAreaInsets()
  const [selectedCategory, setSelectedCategory] = useState('')
  const [amountRaw, setAmountRaw] = useState('')
  const [vendor, setVendor] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const amountNum = parseAmount(amountRaw)
  const displayAmount = formatInput(amountRaw)

  const handleSave = useCallback(() => {
    if (!amountNum || !selectedCategory) return
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
if (router.canGoBack()) { router.back() } else { router.replace('/records/expenses' as any) }
    }, 800)
  }, [amountNum, selectedCategory])

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
            onPress={() => { if (router.canGoBack()) { router.back() } else { router.replace('/(tabs)/records/expenses' as any) } }}
          >
            <GoonaIcon icon={ArrowLeft} size={24} color="#1B1B1B" />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Record Expense</Text>
          <View style={styles.navSpacer} />
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(80).springify()} style={styles.headerSection}>
          <Text style={styles.headerLabel}>New Entry</Text>
          <Text style={styles.headerTitle}>Log Farm{"\n"}Expense</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(140).springify()} style={styles.amountCard}>
          <Text style={styles.amountCardLabel}>Amount ({'\u20A6'})</Text>
          <View style={styles.amountInputRow}>
            <Text style={styles.amountPrefix}>{'\u20A6'}</Text>
            <TextInput
              style={[styles.amountInput, amountNum > 0 && styles.amountInputValid]}
              placeholder="0"
              placeholderTextColor="#CBD5E1"
              keyboardType="numeric"
              value={displayAmount}
              onChangeText={(v) => setAmountRaw(v.replace(/[^0-9]/g, ''))}
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(180).springify()} style={styles.formSection}>
          <Text style={styles.formLabel}>Category</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((c) => {
              const active = selectedCategory === c.label
              return (
                <TouchableOpacity
                  key={c.label}
                  style={[styles.categoryChip, active && { backgroundColor: c.color + '18', borderColor: c.color }]}
                  activeOpacity={0.7}
                  onPress={() => setSelectedCategory(c.label)}
                >
                  <GoonaIcon icon={c.icon} size={16} color={active ? c.color : '#64748B'} />
                  <Text style={[styles.categoryLabel, active && { color: c.color, fontWeight: '700' }]}>
                    {c.label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(220).springify()} style={styles.formSection}>
          <Text style={styles.formLabel}>Vendor / Payee</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter vendor name"
            placeholderTextColor="#CBD5E1"
            value={vendor}
            onChangeText={setVendor}
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(260).springify()} style={styles.formSection}>
          <Text style={styles.formLabel}>Notes</Text>
          <TextInput
            style={[styles.textInput, styles.notesInput]}
            placeholder="Add notes about this expense"
            placeholderTextColor="#CBD5E1"
            multiline
            numberOfLines={3}
            value={notes}
            onChangeText={setNotes}
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(300).springify()}>
          <TouchableOpacity style={styles.receiptBtn} activeOpacity={0.7}>
            <GoonaIcon icon={Camera} size={18} color="#2E7D32" />
            <Text style={styles.receiptText}>Attach Receipt</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(360).springify()} style={styles.saveSection}>
          <TouchableOpacity
            style={[styles.saveBtn, (!amountNum || !selectedCategory) && styles.saveBtnDisabled]}
            activeOpacity={0.8}
            onPress={handleSave}
            disabled={!amountNum || !selectedCategory || saving}
          >
            <GoonaIcon icon={saving ? Check : Plus} size={20} color="#FFF" />
            <Text style={styles.saveText}>{saving ? 'Saving...' : 'Record Expense'}</Text>
          </TouchableOpacity>
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
  navSpacer: {
    width: 40,
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
    fontSize: 28,
    fontWeight: '800',
    color: '#1B1B1B',
    letterSpacing: -0.8,
    lineHeight: 34,
  },
  formSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  amountCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  amountCardLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    letterSpacing: 0.2,
    marginBottom: 12,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountPrefix: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1B1B1B',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '800',
    color: '#1B1B1B',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  amountInputValid: {
    color: '#2E7D32',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1B1B1B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  receiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: 'rgba(46,125,50,0.2)',
    borderStyle: 'dashed',
  },
  receiptText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
  },
  saveSection: {
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 8,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#2E7D32',
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
})
