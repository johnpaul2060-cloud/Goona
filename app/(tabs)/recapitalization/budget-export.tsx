import { useState } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet,
} from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import GoonaIcon from '../../../components/ui/GoonaIcon'
import { Icons } from '../../../shared/icons'
import Animated, { FadeInUp } from 'react-native-reanimated'

const EXPORT_OPTIONS = [
  { id: 'pdf', label: 'PDF Report', desc: 'Full budget report with charts', icon: Icons.fileText, color: '#EF4444', bg: '#FEF2F2' },
  { id: 'csv', label: 'CSV Spreadsheet', desc: 'Raw data for Excel / Sheets', icon: Icons.fileSpreadsheet, color: '#16A34A', bg: '#F0FDF4' },
  { id: 'print', label: 'Print', desc: 'Send to a connected printer', icon: Icons.printer, color: '#1A56FF', bg: '#EEF3FF' },
  { id: 'share', label: 'Share', desc: 'Share via email or messaging', icon: Icons.share2, color: '#8B5CF6', bg: '#F5F3FF' },
]

export default function BudgetExportScreen() {
  const insets = useSafeAreaInsets()
  const [selected, setSelected] = useState<string | null>(null)
  const [exported, setExported] = useState(false)

  const handleExport = () => {
    if (!selected) return
    setTimeout(() => setExported(true), 1000)
  }

  if (exported) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
        <Animated.View entering={FadeInUp.duration(500).springify()} style={styles.successWrap}>
          <View style={styles.successIcon}>
            <GoonaIcon icon={Icons.checkCircle} size={40} color="#16A34A" />
          </View>
          <Text style={styles.successTitle}>Export started</Text>
          <Text style={styles.successSub}>Your budget report is being generated. You will be notified when ready.</Text>
          <TouchableOpacity
            style={styles.successBtn}
            activeOpacity={0.8}
            onPress={() => router.back()}
          >
            <Text style={styles.successBtnText}>Back to Budget</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    )
  }

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
            onPress={() => router.back()}
          >
            <GoonaIcon icon={Icons.arrowLeft} size={24} color="#1B1B1B" />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Export Budget</Text>
          <View style={{ width: 40 }} />
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(80).springify()} style={styles.heroSection}>
          <Text style={styles.heroLabel}>Budget Summary</Text>
          <Text style={styles.heroTitle}>Export farm budget{'\n'}as a report</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(140).springify()} style={styles.exportList}>
          {EXPORT_OPTIONS.map((opt, i) => {
            const active = selected === opt.id
            const IconComp = opt.icon
            return (
              <Animated.View key={opt.id} entering={FadeInUp.duration(350).delay(180 + i * 80).springify()}>
                <TouchableOpacity
                  style={[styles.exportCard, active && styles.exportCardActive]}
                  activeOpacity={0.7}
                  onPress={() => setSelected(opt.id)}
                >
                  <View style={[styles.exportIcon, { backgroundColor: opt.bg }]}>
                    <GoonaIcon icon={IconComp} size={22} color={opt.color} />
                  </View>
                  <View style={styles.exportContent}>
                    <Text style={styles.exportLabel}>{opt.label}</Text>
                    <Text style={styles.exportDesc}>{opt.desc}</Text>
                  </View>
                  <View style={[styles.exportRadio, active && { borderColor: opt.color, backgroundColor: opt.color }]}>
                    {active && <GoonaIcon icon={Icons.checkCircle} size={14} color="#FFF" />}
                  </View>
                </TouchableOpacity>
              </Animated.View>
            )
          })}
        </Animated.View>
      </ScrollView>

      <Animated.View entering={FadeInUp.duration(400).springify()} style={[styles.bottomNav, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.exportBtn, !selected && styles.exportBtnDisabled]}
          activeOpacity={0.8}
          disabled={!selected}
          onPress={handleExport}
        >
          <GoonaIcon icon={Icons.download} size={18} color="#FFF" />
          <Text style={styles.exportBtnText}>
            {selected ? `Export as ${EXPORT_OPTIONS.find(o => o.id === selected)?.label.split(' ')[0]}` : 'Select format'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
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
    paddingBottom: 120,
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
  heroSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  heroLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2E7D32',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1B1B1B',
    letterSpacing: -0.8,
    lineHeight: 34,
  },
  exportList: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  exportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  exportCardActive: {
    borderColor: '#2E7D32',
    backgroundColor: '#F8FAF7',
  },
  exportIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportContent: {
    flex: 1,
    marginLeft: 14,
  },
  exportLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1B1B1B',
  },
  exportDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  exportRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomNav: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#2E7D32',
    borderRadius: 16,
    paddingVertical: 16,
  },
  exportBtnDisabled: {
    opacity: 0.5,
  },
  exportBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  successWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1B1B1B',
    marginBottom: 8,
  },
  successSub: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  successBtn: {
    width: '100%',
    backgroundColor: '#2E7D32',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  successBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
})
