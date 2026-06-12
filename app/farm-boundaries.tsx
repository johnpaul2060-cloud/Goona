import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, Pressable, ScrollView,
  StyleSheet, Dimensions, Alert,
} from 'react-native'
import Svg, { Path } from 'react-native-svg'
import GoonaIcon from '../components/ui/GoonaIcon'
import { ArrowLeft, MapPin, ShieldAlert, Plus, Pencil, Trash2, Check, X, ChevronRight, Navigation, Radio } from 'lucide-react-native'
import { StatusBar } from 'expo-status-bar'
import { router } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, FadeInUp } from 'react-native-reanimated'
import BottomDock from '../components/navigation/BottomDock'

const { width: SCREEN_W } = Dimensions.get('window')

function usePressScale() {
  const scale = useSharedValue(1); const opacity = useSharedValue(1)
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: opacity.value }))
  return { style, onPressIn: () => { scale.value = withSpring(0.96); opacity.value = withTiming(0.85) }, onPressOut: () => { scale.value = withSpring(1); opacity.value = withTiming(1) } }
}

interface FarmZone {
  id: string; name: string; type: 'operational' | 'restricted'; color: string; workers: number; coordinates: string
}

const INITIAL_ZONES: FarmZone[] = [
  { id: 'z1', name: 'Poultry House A', type: 'operational', color: '#22C55E', workers: 2, coordinates: '7.5°N, 3.9°E' },
  { id: 'z2', name: 'Poultry House B', type: 'operational', color: '#22C55E', workers: 1, coordinates: '7.5°N, 3.91°E' },
  { id: 'z3', name: 'Hatchery', type: 'operational', color: '#22C55E', workers: 0, coordinates: '7.51°N, 3.89°E' },
  { id: 'z4', name: 'Feed Warehouse', type: 'operational', color: '#22C55E', workers: 1, coordinates: '7.49°N, 3.92°E' },
  { id: 'z5', name: 'Fish Pond', type: 'operational', color: '#22C55E', workers: 1, coordinates: '7.48°N, 3.9°E' },
  { id: 'z6', name: 'Storage Facility', type: 'operational', color: '#22C55E', workers: 1, coordinates: '7.49°N, 3.88°E' },
  { id: 'z7', name: 'Chemical Storage', type: 'restricted', color: '#EF4444', workers: 0, coordinates: '7.5°N, 3.87°E' },
  { id: 'z8', name: 'Generator Room', type: 'restricted', color: '#EF4444', workers: 0, coordinates: '7.51°N, 3.88°E' },
  { id: 'z9', name: 'Medicine Storage', type: 'restricted', color: '#EF4444', workers: 0, coordinates: '7.48°N, 3.87°E' },
]

export default function FarmBoundariesScreen() {
  const [zones, setZones] = useState<FarmZone[]>(INITIAL_ZONES)
  const [filter, setFilter] = useState<'all' | 'operational' | 'restricted'>('all')
  const filtered = filter === 'all' ? zones : zones.filter(z => z.type === filter)

  const handleDelete = (id: string) => {
    Alert.alert('Delete Zone', 'Are you sure? This will remove the geofence and all associated data.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => setZones(prev => prev.filter(z => z.id !== id)) },
    ])
  }

  return (
    <View style={s.container}>
      <StatusBar style="dark" />
      <View style={s.bgBlob} pointerEvents="none" />
      <View style={s.bgDotGrid} pointerEvents="none">
        {Array.from({ length: 30 }).map((_, i) => (
          <View key={i} style={[s.bgDot, { left: `${(i % 8) * 13 + 3}%`, top: `${Math.floor(i / 8) * 14 + 5}%` }]} />
        ))}
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* App Bar */}
        <Animated.View entering={FadeInUp.duration(500).springify()} style={s.topNav}>
          <TouchableOpacity style={s.navBack} onPress={() => router.back()} activeOpacity={0.7}>
            <GoonaIcon icon={ArrowLeft} size={22} color="#1B1B1B" />
          </TouchableOpacity>
          <Text style={s.navTitle}>Farm Boundaries</Text>
          <TouchableOpacity style={s.navBack} onPress={() => router.push('/geofence-editor' as any)} activeOpacity={0.7}>
            <Plus size={22} color="#00695C" strokeWidth={2.5} />
          </TouchableOpacity>
        </Animated.View>

        {/* Header */}
        <Animated.View entering={FadeInUp.duration(500).delay(80).springify()} style={{ marginTop: 20 }}>
          <Text style={s.headerTitle}>Farm Boundaries</Text>
          <Text style={s.headerSub}>Create and manage geofence zones, operational areas, and restricted zones.</Text>
        </Animated.View>

        {/* Boundary summary */}
        <Animated.View entering={FadeInUp.duration(500).delay(120).springify()}>
          <LinearGradient colors={['#00695C', '#0F766E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={s.summaryCard}>
            <View style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.06)' }} />
            <Text style={{ fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.6)', letterSpacing: 0.5, marginBottom: 6 }}>FARM BOUNDARY</Text>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#AEEA00' }}>Adewale Farms — 12.4 hectares</Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>Boundary set &bull; Geofence active</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }}
                onPress={() => Alert.alert('Edit Boundary', 'Drag the boundary corners on the map to adjust the farm perimeter.\n\nGeofence Editor coming soon.')}>
                <GoonaIcon icon={Pencil} size={12} color="#fff" />
                <Text style={{ fontSize: 11, fontWeight: '600', color: '#fff' }}>Edit Boundary</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }}
                onPress={() => router.push('/geofence-editor' as any)}>
                <GoonaIcon icon={Plus} size={12} color="#fff" />
                <Text style={{ fontSize: 11, fontWeight: '600', color: '#fff' }}>Add Zone</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Filter pills */}
        <Animated.View entering={FadeInUp.duration(500).delay(160).springify()} style={{ flexDirection: 'row', gap: 6, marginTop: 20, marginBottom: 14 }}>
          {(['all', 'operational', 'restricted'] as const).map(f => (
            <Pressable key={f} onPress={() => setFilter(f)} style={{ paddingVertical: 6, paddingHorizontal: 14, borderRadius: 50, backgroundColor: filter === f ? '#00695C' : 'white', borderWidth: 1, borderColor: filter === f ? '#00695C' : 'rgba(0,0,0,0.04)' }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: filter === f ? '#fff' : '#475569', textTransform: 'capitalize' }}>{f}</Text>
            </Pressable>
          ))}
        </Animated.View>

        {/* Zone cards */}
        {filtered.map((zone, i) => {
          const { style, onPressIn, onPressOut } = usePressScale()
          return (
            <Animated.View key={zone.id} entering={FadeInUp.duration(300).delay(200 + i * 50).springify()}>
              <Pressable
                onPressIn={onPressIn} onPressOut={onPressOut}
                onPress={() => Alert.alert(
                  zone.name,
                  `Type: ${zone.type === 'operational' ? 'Operational Zone' : 'Restricted Area'}\nWorkers: ${zone.workers}\nCoordinates: ${zone.coordinates}\n\nTap "Edit" to modify this zone.`
                )}
              >
                <Animated.View style={[style, s.zoneCard, { borderLeftColor: zone.color, borderLeftWidth: 3 }]}>
                  <View style={[s.zoneIcon, { backgroundColor: `${zone.color}12` }]}>
                    <GoonaIcon icon={zone.type === 'restricted' ? ShieldAlert : MapPin} size={18} color={zone.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={s.zoneName}>{zone.name}</Text>
                      <View style={[s.zoneTypeBadge, { backgroundColor: zone.type === 'restricted' ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)' }]}>
                        <Text style={[s.zoneTypeText, { color: zone.type === 'restricted' ? '#EF4444' : '#22C55E' }]}>{zone.type === 'restricted' ? 'Restricted' : 'Operational'}</Text>
                      </View>
                    </View>
                    <Text style={s.zoneCoords}>{zone.coordinates}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                        <GoonaIcon icon={MapPin} size={10} color="#94A3B8" />
                        <Text style={{ fontSize: 10, color: '#94A3B8' }}>{zone.workers} workers</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                        <GoonaIcon icon={Radio} size={10} color="#22C55E" />
                        <Text style={{ fontSize: 10, color: '#22C55E' }}>Active</Text>
                      </View>
                    </View>
                  </View>
                  <View style={{ gap: 6 }}>
                    <TouchableOpacity onPress={() => router.push('/geofence-editor' as any)} style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}>
                      <GoonaIcon icon={Pencil} size={14} color="#64748B" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(zone.id)} style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(239,68,68,0.06)', alignItems: 'center', justifyContent: 'center' }}>
                      <GoonaIcon icon={Trash2} size={14} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              </Pressable>
            </Animated.View>
          )
        })}

        {/* Add zone button */}
        <Animated.View entering={FadeInUp.duration(500).delay(600).springify()}>
          <TouchableOpacity
            onPress={() => router.push('/geofence-editor' as any)}
            style={s.addZoneBtn}
            activeOpacity={0.8}
          >
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(0,105,92,0.08)', alignItems: 'center', justifyContent: 'center' }}>
              <GoonaIcon icon={Plus} size={20} color="#00695C" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '600', fontSize: 14, color: '#1B1B1B' }}>Create New Zone</Text>
              <Text style={{ fontSize: 11, color: '#64748B' }}>Add operational or restricted area</Text>
            </View>
            <ChevronRight size={16} color="#94A3B8" strokeWidth={2} />
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
      <BottomDock hidden={false} />
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9F5' },
  bgBlob: { position: 'absolute', top: -50, right: -50, width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(0,105,92,0.06)', zIndex: 0 },
  bgDotGrid: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, opacity: 0.3 },
  bgDot: { position: 'absolute', width: 2, height: 2, borderRadius: 1, backgroundColor: 'rgba(0,105,92,0.1)' },
  scroll: { flex: 1, zIndex: 1 },
  topNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 54 },
  navBack: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  navTitle: { fontWeight: '700', fontSize: 16, color: '#1B1B1B' },
  headerTitle: { fontWeight: '800', fontSize: 30, lineHeight: 34, color: '#1B1B1B' },
  headerSub: { fontSize: 13, color: '#64748B', marginTop: 2 },
  summaryCard: { borderRadius: 24, padding: 20, marginTop: 14, overflow: 'hidden', shadowColor: '#00695C', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 24, elevation: 4 },
  zoneCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 18, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.02, shadowRadius: 12, elevation: 1 },
  zoneIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  zoneName: { fontWeight: '600', fontSize: 14, color: '#1B1B1B' },
  zoneTypeBadge: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 50 },
  zoneTypeText: { fontSize: 9, fontWeight: '700' },
  zoneCoords: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
  addZoneBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'white', borderRadius: 18, padding: 16, marginTop: 14, borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)', borderStyle: 'dashed', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.02, shadowRadius: 12, elevation: 1 },
})
