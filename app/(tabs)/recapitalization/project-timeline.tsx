import React, { useEffect, useState, useCallback, useMemo } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Platform,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import GoonaIcon from '../../../components/ui/GoonaIcon'
import { formatNaira } from '../../../utils/format'
import { Icons } from '../../../shared/icons'
import { BlurView } from 'expo-blur'
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated'
import { useRecoveryStore, fmtDateFromParts, computeStreak } from '../../../store/useRecoveryStore'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatCurrency(n: number) {
  return formatNaira(n)
}

const MILESTONES = [
  { title: 'Broiler Restocking', target: 'Restock 500 birds', progress: 0.65, due: 'Q3 2026', status: 'on_track' as const },
  { title: 'Feed Reserve', target: 'Purchase 50 bags', progress: 0.4, due: 'Q1 2027', status: 'at_risk' as const },
  { title: 'Equipment Upgrade', target: 'Replace feeders', progress: 0.2, due: 'Q4 2026', status: 'behind' as const },
]

const UPCOMING = [
  { project: 'Feed Purchase', due: 'Monday', amount: 15000 },
  { project: 'Staff Salaries', due: 'Friday', amount: 10000 },
  { project: 'Infrastructure', due: '1 Jul 2026', amount: 50000 },
]

export default function ProjectTimelineScreen() {
  const insets = useSafeAreaInsets()
  const records = useRecoveryStore((s) => s.records)
  const now = new Date()
  const streak = computeStreak(records)

  const activity = useMemo(() => {
    return Object.entries(records)
      .filter(([dateStr]) => {
        const [y, m, d] = dateStr.split('-').map(Number)
        const dDate = new Date(y, m - 1, d)
        return dDate <= now && dDate >= new Date(now.getFullYear(), now.getMonth() - 2, now.getDate())
      })
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 10)
      .map(([dateStr, rec]) => {
        const [y, m, d] = dateStr.split('-').map(Number)
        const date = new Date(y, m - 1, d)
        const dayDiff = Math.floor((now.getTime() - date.getTime()) / 86400000)
        const timeStr = dayDiff === 0 ? 'Today' : dayDiff === 1 ? 'Yesterday' : `${dayDiff} days ago`
        return { date: timeStr, dateObj: date, ...rec }
      })
  }, [records])

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <BlurView intensity={55} tint="light" style={[styles.headerBlur, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.7} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/recapitalization' as any)}>
            <GoonaIcon icon={Icons.arrowLeft} size={20} color="#1F2937" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Project Timeline</Text>
            <Text style={styles.headerSub}>Track recapt activity and milestones</Text>
          </View>
        </View>
      </BlurView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: insets.top + 90, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Streak Card */}
        <Animated.View entering={FadeInDown.duration(400).springify()} style={styles.streakCard}>
          <LinearGradient colors={['#2E7D32', '#1B5E20']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.streakGrad}>
            <View style={styles.streakRow}>
              <View>
                <Text style={styles.streakLabel}>Current Streak</Text>
                <Text style={styles.streakValue}>{streak} days</Text>
              </View>
              <View style={styles.streakBadge}>
                <GoonaIcon icon={Icons.trendingUp} size={20} color="#AEEA00" />
              </View>
            </View>
            <Text style={styles.streakSub}>Keep up the momentum! {activity.filter(a => a.amount).length} contributions this period.</Text>
          </LinearGradient>
        </Animated.View>

        {/* Recapt Activity */}
        <Animated.View entering={FadeInDown.duration(400).delay(60).springify()} style={styles.card}>
          <View style={styles.cardHead}>
            <Text style={styles.cardTitle}>Recapt Activity</Text>
            <Text style={styles.cardCount}>{activity.length} entries</Text>
          </View>
          {activity.length === 0 ? (
            <Text style={styles.emptyText}>No activity recorded yet.</Text>
          ) : (
            activity.map((item, i) => (
              <View key={i} style={[styles.activityRow, i === activity.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={[styles.activityDot, {
                  backgroundColor: item.status === 'completed' || item.status === 'exceeded' ? '#16A34A'
                    : item.status === 'partial' ? '#F59E0B'
                    : item.status === 'missed' ? '#EF4444' : '#E2E8F0',
                }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.activityTitle}>
                    {item.status === 'completed' ? 'Weekly contribution'
                      : item.status === 'exceeded' ? 'Extra contribution'
                      : item.status === 'partial' ? 'Partial contribution'
                      : item.status === 'missed' ? 'Missed contribution' : 'No activity'}
                  </Text>
                  <Text style={styles.activityDate}>{item.date}</Text>
                </View>
                {item.amount ? (
                  <Text style={[styles.activityAmount, {
                    color: item.status === 'completed' || item.status === 'exceeded' ? '#16A34A' : '#EF4444',
                  }]}>
                    {item.status === 'missed' ? '-₦85,000' : `+${formatCurrency(item.amount)}`}
                  </Text>
                ) : null}
              </View>
            ))
          )}
        </Animated.View>

        {/* Upcoming Contributions */}
        <Animated.View entering={FadeInDown.duration(400).delay(120).springify()} style={styles.card}>
          <View style={styles.cardHead}>
            <Text style={styles.cardTitle}>Upcoming Contributions</Text>
          </View>
          {UPCOMING.map((item, i) => (
            <View key={i} style={[styles.upcomingRow, i === UPCOMING.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={styles.upcomingLeft}>
                <View style={styles.upcomingIcon}>
                  <GoonaIcon icon={Icons.calendar} size={14} color="#2E7D32" />
                </View>
                <View>
                  <Text style={styles.upcomingProject}>{item.project}</Text>
                  <Text style={styles.upcomingDue}>Due {item.due}</Text>
                </View>
              </View>
              <Text style={styles.upcomingAmount}>{formatCurrency(item.amount)}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Milestones */}
        <Animated.View entering={FadeInDown.duration(400).delay(180).springify()} style={styles.card}>
          <View style={styles.cardHead}>
            <Text style={styles.cardTitle}>Milestones</Text>
          </View>
          {MILESTONES.map((item, i) => {
            const statusColor = item.status === 'on_track' ? '#16A34A' : item.status === 'at_risk' ? '#F59E0B' : '#EF4444'
            const statusLabel = item.status === 'on_track' ? 'On Track' : item.status === 'at_risk' ? 'At Risk' : 'Behind'
            return (
              <View key={i} style={[styles.milestoneRow, i === MILESTONES.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={styles.milestoneHead}>
                  <View style={styles.milestoneTitleRow}>
                    <GoonaIcon icon={Icons.flag} size={16} color="#2E7D32" />
                    <Text style={styles.milestoneTitle}>{item.title}</Text>
                  </View>
                  <View style={[styles.milestoneBadge, { backgroundColor: statusColor + '15' }]}>
                    <Text style={[styles.milestoneBadgeText, { color: statusColor }]}>{statusLabel}</Text>
                  </View>
                </View>
                <Text style={styles.milestoneTarget}>{item.target}</Text>
                <View style={styles.milestoneTrack}>
                  <View style={[styles.milestoneFill, { width: `${item.progress * 100}%`, backgroundColor: statusColor }]} />
                </View>
                <View style={styles.milestoneMeta}>
                  <Text style={styles.milestoneProgress}>{Math.round(item.progress * 100)}% complete</Text>
                  <Text style={styles.milestoneDue}>Due {item.due}</Text>
                </View>
              </View>
            )
          })}
        </Animated.View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAF7' },
  headerBlur: { position: 'absolute', left: 0, right: 0, zIndex: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.04)', paddingBottom: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20 },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 14, elevation: 3 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1B1B1B' },
  headerSub: { fontSize: 13, color: '#94A3B8', marginTop: 1 },
  scroll: { flex: 1 },
  streakCard: { borderRadius: 24, marginBottom: 20, overflow: 'hidden', shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 24, elevation: 6 },
  streakGrad: { padding: 20 },
  streakRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  streakLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  streakValue: { fontSize: 32, fontWeight: '800', color: '#FFFFFF', marginTop: 2 },
  streakBadge: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  streakSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 18 },
  card: { backgroundColor: 'white', borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  cardCount: { fontSize: 12, fontWeight: '600', color: '#94A3B8' },
  emptyText: { fontSize: 14, color: '#94A3B8', textAlign: 'center', paddingVertical: 20 },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  activityDot: { width: 10, height: 10, borderRadius: 5 },
  activityTitle: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  activityDate: { fontSize: 12, color: '#94A3B8', marginTop: 1 },
  activityAmount: { fontSize: 14, fontWeight: '700' },
  upcomingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  upcomingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  upcomingIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center' },
  upcomingProject: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  upcomingDue: { fontSize: 12, color: '#94A3B8', marginTop: 1 },
  upcomingAmount: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  milestoneRow: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  milestoneHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  milestoneTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  milestoneTitle: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  milestoneBadge: { paddingVertical: 3, paddingHorizontal: 10, borderRadius: 100 },
  milestoneBadgeText: { fontSize: 11, fontWeight: '700' },
  milestoneTarget: { fontSize: 13, color: '#64748B', marginBottom: 10 },
  milestoneTrack: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  milestoneFill: { height: '100%', borderRadius: 3 },
  milestoneMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  milestoneProgress: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  milestoneDue: { fontSize: 12, color: '#94A3B8' },
})
