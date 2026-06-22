import React from 'react'
import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import GoonaIcon from '../components/ui/GoonaIcon'
import { Icons } from '../shared/icons'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { FadeInUp } from 'react-native-reanimated'
import { StatusBar } from 'expo-status-bar'

function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = []
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size))
  return result
}

const MANAGEMENT_SECTIONS = [
  { icon: Icons.users, label: 'Workforce', color: '#2E7D32', desc: 'Manage team members' },
  { icon: Icons.calendar, label: 'Attendance', color: '#0F766E', desc: 'Daily roll call & logs' },
  { icon: Icons.mapPin, label: 'Live Locations', color: '#1A56FF', desc: 'Real-time tracking' },
  { icon: Icons.listChecks, label: 'Tasks', color: '#7C3AED', desc: 'Assign & monitor' },
  { icon: Icons.bell, label: 'Alerts', color: '#DC2626', desc: 'Security & incidents' },
  { icon: Icons.barChart3, label: 'Reports', color: '#F59E0B', desc: 'Analytics & exports' },
  { icon: Icons.activity, label: 'Performance', color: '#0891B2', desc: 'Productivity metrics' },
]

const QUICK_STATS = [
  { label: 'Total Workers', value: '14', icon: Icons.users, color: '#2E7D32', bg: '#F0FDF4' },
  { label: 'On Duty', value: '8', icon: Icons.clock, color: '#0F766E', bg: '#DDF5F0' },
  { label: 'Suspended', value: '2', icon: Icons.userMinus, color: '#DC2626', bg: '#FFF1F2' },
  { label: 'Pending Review', value: '1', icon: Icons.refreshCw, color: '#F59E0B', bg: '#FFFBEB' },
]

export default function FarmManagementScreen() {
  const insets = useSafeAreaInsets()

  return (
    <View style={{ flex: 1, backgroundColor: '#F8F9F5' }}>
      <StatusBar style="dark" />

      {/* HEADER */}
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            <TouchableOpacity style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }} onPress={() => router.back()} activeOpacity={0.7}>
              <GoonaIcon icon={Icons.arrowLeft} size={20} color="#1F2937" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} ellipsizeMode="tail" style={{ fontSize: 18, fontWeight: '700', color: '#1F2937' }}>Adewale Farms</Text>
              <Text style={{ fontSize: 12, color: '#2E7D32', fontWeight: '500' }}>Farm Management Center</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* QUICK STATS */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, marginTop: 16, marginBottom: 20 }}>
          {QUICK_STATS.map((s, i) => (
            <Animated.View key={i} entering={FadeInUp.delay(i * 80).duration(400)} style={{ width: '48%', backgroundColor: s.bg, borderRadius: 14, padding: 12, alignItems: 'center', gap: 4 }}>
              <GoonaIcon icon={s.icon} size={16} color={s.color} />
              <Text style={{ fontSize: 16, fontWeight: '800', color: s.color }}>{s.value}</Text>
              <Text style={{ fontSize: 9, fontWeight: '500', color: s.color, opacity: 0.7, textAlign: 'center' }}>{s.label}</Text>
            </Animated.View>
          ))}
        </View>

        {/* MANAGEMENT SECTIONS */}
        <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#1F2937', marginBottom: 12 }}>Management Console</Text>
          <View style={{ gap: 8 }}>
            {chunk(MANAGEMENT_SECTIONS, 2).map((row, ri) => (
              <View key={ri} style={{ flexDirection: 'row', gap: 8 }}>
                {row.map((s, i) => (
                  <Animated.View key={i} entering={FadeInUp.delay((ri * 2 + i) * 60).duration(400)} style={{ flex: 1 }}>
                    <TouchableOpacity style={{ backgroundColor: 'white', borderRadius: 16, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 }} activeOpacity={0.7}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${s.color}12`, alignItems: 'center', justifyContent: 'center' }}>
                          <GoonaIcon icon={s.icon} size={17} color={s.color} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text numberOfLines={1} ellipsizeMode="tail" style={{ fontSize: 13, fontWeight: '600', color: '#1F2937' }}>{s.label}</Text>
                          <Text style={{ fontSize: 10, color: '#94A3B8', marginTop: 1 }}>{s.desc}</Text>
                        </View>
                        <Icons.chevronRight size={14} color="#CBD5E1" />
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            ))}
          </View>
        </View>

      </ScrollView>
    </View>
  )
}
