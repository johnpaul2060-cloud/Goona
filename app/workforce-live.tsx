import React, { useState, useEffect, useRef } from 'react'
import {
  View, Text, TouchableOpacity, Pressable, ScrollView,
  StyleSheet, Dimensions, Alert,
} from 'react-native'
import GoonaIcon from '../components/ui/GoonaIcon'
import { Icons } from '../shared/icons'
import { StatusBar } from 'expo-status-bar'
import { router } from 'expo-router'
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence,
  withTiming, withSpring, FadeInUp,
} from 'react-native-reanimated'
import MapView, { Marker, Polygon, Circle } from 'react-native-maps'
import BottomDock from '../components/navigation/BottomDock'
import { FARM_NAME } from '../constants/farm'

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window')

/* ─── Error boundary wrapper ─── */
class MapErrorBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  render() { return this.state.hasError ? this.props.fallback : this.props.children }
}

function usePressScale() {
  const scale = useSharedValue(1); const opacity = useSharedValue(1)
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: opacity.value }))
  return { style, onPressIn: () => { scale.value = withSpring(0.96); opacity.value = withTiming(0.85) }, onPressOut: () => { scale.value = withSpring(1); opacity.value = withTiming(1) } }
}

function PulseDot({ color = '#22C55E', size = 5 }: { color?: string; size?: number }) {
  const opacity = useSharedValue(1)
  useEffect(() => { opacity.value = withRepeat(withSequence(withTiming(0.3, { duration: 1800 }), withTiming(1, { duration: 1800 })), -1, true) }, [])
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }))
  return <Animated.View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }, style]} />
}

/* ─── Coordinates (simulated for Oyo State, Nigeria) ─── */
const FARM_CENTER = { latitude: 7.5, longitude: 3.9 }

const WORKER_POSITIONS = [
  { id: 'w1', initials: 'CO', name: 'Chinedu Okoro', role: 'Senior Farmhand', status: 'active' as const, location: 'Poultry House A', battery: 87, lastSeen: '2 min ago', coordinate: { latitude: 7.502, longitude: 3.902 } },
  { id: 'w2', initials: 'AF', name: 'Aminat Fashola', role: 'Feed Specialist', status: 'active' as const, location: 'Feed Warehouse', battery: 72, lastSeen: '1 min ago', coordinate: { latitude: 7.498, longitude: 3.905 } },
  { id: 'w3', initials: 'KO', name: 'Kola Ogunleye', role: 'Veterinary Assistant', status: 'idle' as const, location: 'Hatchery', battery: 34, lastSeen: '4h ago', coordinate: { latitude: 7.505, longitude: 3.895 } },
  { id: 'w4', initials: 'FO', name: 'Funmi Ojo', role: 'Farmhand', status: 'active' as const, location: 'Fish Pond', battery: 91, lastSeen: 'just now', coordinate: { latitude: 7.495, longitude: 3.898 } },
  { id: 'w5', initials: 'TA', name: 'Tunde Adebayo', role: 'Security', status: 'active' as const, location: 'Main Gate', battery: 66, lastSeen: '5 min ago', coordinate: { latitude: 7.500, longitude: 3.892 } },
  { id: 'w7', initials: 'SE', name: 'Segun Eze', role: 'Vet Assistant', status: 'active' as const, location: 'Poultry House B', battery: 78, lastSeen: '3 min ago', coordinate: { latitude: 7.503, longitude: 3.906 } },
  { id: 'w9', initials: 'DE', name: 'Dele Akin', role: 'Farmhand', status: 'active' as const, location: 'Storage Facility', battery: 55, lastSeen: '8 min ago', coordinate: { latitude: 7.497, longitude: 3.893 } },
  { id: 'w10', initials: 'IF', name: 'Ifeanyi Folarin', role: 'Supervisor', status: 'active' as const, location: 'Admin Block', battery: 94, lastSeen: 'just now', coordinate: { latitude: 7.501, longitude: 3.896 } },
  { id: 'w11', initials: 'NO', name: 'Ngozi Okafor', role: 'Farmhand', status: 'idle' as const, location: 'Break Room', battery: 45, lastSeen: '15 min ago', coordinate: { latitude: 7.499, longitude: 3.897 } },
]

/* ─── Zones as map polygons ─── */
const ZONE_POLYGONS = [
  { id: 'zp1', name: 'Poultry House A', color: '#22C55E', coordinates: [{ latitude: 7.504, longitude: 3.900 }, { latitude: 7.504, longitude: 3.904 }, { latitude: 7.500, longitude: 3.904 }, { latitude: 7.500, longitude: 3.900 }] },
  { id: 'zp2', name: 'Poultry House B', color: '#22C55E', coordinates: [{ latitude: 7.505, longitude: 3.905 }, { latitude: 7.505, longitude: 3.909 }, { latitude: 7.501, longitude: 3.909 }, { latitude: 7.501, longitude: 3.905 }] },
  { id: 'zp3', name: 'Feed Warehouse', color: '#22C55E', coordinates: [{ latitude: 7.496, longitude: 3.904 }, { latitude: 7.496, longitude: 3.908 }, { latitude: 7.492, longitude: 3.908 }, { latitude: 7.492, longitude: 3.904 }] },
  { id: 'zp4', name: 'Fish Pond', color: '#22C55E', coordinates: [{ latitude: 7.493, longitude: 3.896 }, { latitude: 7.493, longitude: 3.900 }, { latitude: 7.489, longitude: 3.900 }, { latitude: 7.489, longitude: 3.896 }] },
  { id: 'zp5', name: 'Hatchery', color: '#22C55E', coordinates: [{ latitude: 7.507, longitude: 3.893 }, { latitude: 7.507, longitude: 3.897 }, { latitude: 7.503, longitude: 3.897 }, { latitude: 7.503, longitude: 3.893 }] },
  { id: 'zp6', name: 'Storage Facility', color: '#22C55E', coordinates: [{ latitude: 7.495, longitude: 3.891 }, { latitude: 7.495, longitude: 3.895 }, { latitude: 7.491, longitude: 3.895 }, { latitude: 7.491, longitude: 3.891 }] },
  { id: 'zp7', name: 'Chemical Storage', color: '#EF4444', coordinates: [{ latitude: 7.499, longitude: 3.888 }, { latitude: 7.499, longitude: 3.892 }, { latitude: 7.495, longitude: 3.892 }, { latitude: 7.495, longitude: 3.888 }] },
  { id: 'zp8', name: 'Generator Room', color: '#EF4444', coordinates: [{ latitude: 7.503, longitude: 3.889 }, { latitude: 7.503, longitude: 3.893 }, { latitude: 7.499, longitude: 3.893 }, { latitude: 7.499, longitude: 3.889 }] },
  { id: 'zp9', name: 'Medicine Storage', color: '#EF4444', coordinates: [{ latitude: 7.491, longitude: 3.889 }, { latitude: 7.491, longitude: 3.893 }, { latitude: 7.487, longitude: 3.893 }, { latitude: 7.487, longitude: 3.889 }] },
]

/* ─── Farm boundary (outer perimeter) ─── */
const FARM_BOUNDARY = [
  { latitude: 7.510, longitude: 3.885 },
  { latitude: 7.510, longitude: 3.912 },
  { latitude: 7.485, longitude: 3.912 },
  { latitude: 7.485, longitude: 3.885 },
]

/* ─── Status helpers ─── */
const statusColor = (status: string) => status === 'active' ? '#22C55E' : status === 'idle' ? '#F59E0B' : status === 'emergency' ? '#EF4444' : '#94A3B8'

/* ─── Worker Pin ─── */
function WorkerPin({ worker, onPress }: { worker: typeof WORKER_POSITIONS[0]; onPress: () => void }) {
  const { style, onPressIn, onPressOut } = usePressScale()
  const color = statusColor(worker.status)
  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={[style, { alignItems: 'center', width: 50 }]}>
        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: color }}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 10 }}>{worker.initials}</Text>
        </View>
        <PulseDot color={color} size={5} />
      </Animated.View>
    </Pressable>
  )
}

/* ─── MapFallback (card-based map replacement) ─── */
function MapFallback({ selectedWorker, onSelectWorker }: {
  selectedWorker: typeof WORKER_POSITIONS[0] | null
  onSelectWorker: (w: typeof WORKER_POSITIONS[0] | null) => void
}) {
  return (
    <View style={s.fallbackContainer}>
      {/* Map header bar */}
      <View style={s.fallbackHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icons.mapPin size={14} color="#00695C" strokeWidth={2.5} />
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#334155' }}>Farm Layout</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E' }} />
          <Text style={{ fontSize: 9, color: '#64748B' }}>Operational</Text>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444', marginLeft: 8 }} />
          <Text style={{ fontSize: 9, color: '#64748B' }}>Restricted</Text>
        </View>
      </View>

      {/* Grid: zone cards as a 'map' */}
      <View style={s.fallbackGrid}>
        {ZONE_POLYGONS.map(zone => {
          const zoneWorkers = WORKER_POSITIONS.filter(w => zone.name.toLowerCase().includes(w.location.toLowerCase().split(' ').slice(0,2).join(' ')))
          const isSelected = selectedWorker && zoneWorkers.some(w => w.id === selectedWorker.id)
          return (
            <TouchableOpacity
              key={zone.id}
              activeOpacity={0.7}
              onPress={() => {
                if (zoneWorkers.length > 0) onSelectWorker(zoneWorkers[0])
                else Alert.alert(zone.name, `${zone.color === '#EF4444' ? 'Restricted Area' : 'Operational Zone'}`)
              }}
              style={[
                s.fallbackZoneCard,
                {
                  borderColor: zone.color,
                  backgroundColor: zone.color === '#EF4444' ? 'rgba(239,68,68,0.04)' : 'rgba(34,197,94,0.04)',
                },
                isSelected && { borderWidth: 2.5, shadowColor: zone.color, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
              ]}
            >
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: zone.color }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#1B1B1B' }} numberOfLines={1}>{zone.name}</Text>
                <Text style={{ fontSize: 8, color: zone.color === '#EF4444' ? '#EF4444' : '#22C55E', fontWeight: '500' }}>
                  {zone.color === '#EF4444' ? 'Restricted' : 'Operational'}
                </Text>
              </View>
              {zoneWorkers.length > 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                  {zoneWorkers.slice(0, 2).map(w => (
                    <View key={w.id} style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: statusColor(w.status), alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: '#fff', fontSize: 7, fontWeight: '800' }}>{w.initials}</Text>
                    </View>
                  ))}
                  {zoneWorkers.length > 2 && (
                    <Text style={{ fontSize: 8, color: '#94A3B8' }}>+{zoneWorkers.length - 2}</Text>
                  )}
                </View>
              )}
            </TouchableOpacity>
          )
        })}
      </View>

      {/* Worker dots row */}
      <View style={s.fallbackWorkerRow}>
        {WORKER_POSITIONS.map(w => (
          <TouchableOpacity key={w.id} onPress={() => onSelectWorker(selectedWorker?.id === w.id ? null : w)} activeOpacity={0.7}>
            <View style={[s.fallbackDot, { borderColor: statusColor(w.status), backgroundColor: selectedWorker?.id === w.id ? statusColor(w.status) : '#0F172A' }]}>
              <Text style={{ color: '#fff', fontSize: 7, fontWeight: '800' }}>{w.initials}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Fallback footer */}
      <View style={s.fallbackFooter}>
        <Icons.radio size={12} color="#22C55E" strokeWidth={2} />
        <Text style={{ fontSize: 10, color: '#64748B' }}>Map unavailable — showing farm layout</Text>
        <View style={{ flex: 1 }} />
        <Text style={{ fontSize: 9, color: '#94A3B8' }}>{present} workers</Text>
      </View>
    </View>
  )
}

const activeWorkers = WORKER_POSITIONS.filter(w => w.status === 'active')
const present = WORKER_POSITIONS.length
const activeLocations = [...new Set(WORKER_POSITIONS.filter(w => w.status === 'active').map(w => w.location))].length

const GEOFENCE_EVENTS = [
  { text: 'Chinedu entered Poultry House A', time: '2 min ago', icon: Icons.navigation, color: '#22C55E' },
  { text: 'Aminat exited Feed Warehouse', time: '8 min ago', icon: Icons.mapPin, color: '#F59E0B' },
  { text: 'Funmi entered Fish Pond zone', time: '15 min ago', icon: Icons.navigation, color: '#22C55E' },
  { text: 'Tunde completed perimeter checkpoint', time: '22 min ago', icon: Icons.target, color: '#6366F1' },
  { text: 'Segun moved to Poultry House B', time: '30 min ago', icon: Icons.radio, color: '#00695C' },
]

export default function WorkforceLiveScreen() {
  const [selectedWorker, setSelectedWorker] = useState<typeof WORKER_POSITIONS[0] | null>(null)
  const mapRef = useRef<MapView>(null)

  const fitToMarkers = () => {
    if (mapRef.current) {
      mapRef.current.fitToCoordinates(WORKER_POSITIONS.map(w => w.coordinate), { edgePadding: { top: 60, right: 60, bottom: 60, left: 60 }, animated: true })
    }
  }

  return (
    <View style={s.container}>
      <StatusBar style="dark" />

      <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false} bounces={false}>
        {/* App Bar */}
        <Animated.View entering={FadeInUp.duration(500).springify()} style={s.topNav}>
          <TouchableOpacity style={s.navBack} onPress={() => router.back()} activeOpacity={0.7}>
            <GoonaIcon icon={Icons.arrowLeft} size={22} color="#1B1B1B" />
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <PulseDot color="#22C55E" size={5} />
            <Text style={s.navLabel}>Workforce Live</Text>
          </View>
          <TouchableOpacity style={s.navBack} onPress={fitToMarkers}>
            <GoonaIcon icon={Icons.target} size={18} color="#00695C" />
          </TouchableOpacity>
        </Animated.View>

        {/* Header */}
        <Animated.View entering={FadeInUp.duration(500).delay(60).springify()} style={{ paddingHorizontal: 24 }}>
          <Text style={s.headerTitle}>Workforce Live</Text>
          <Text style={s.headerSub}>Real-time worker locations, geofence zones, and attendance.</Text>
        </Animated.View>

        {/* ─── INTERACTIVE MAP (with fallback) ─── */}
        <Animated.View entering={FadeInUp.duration(600).delay(100).springify()} style={s.mapWrapper}>
          <MapErrorBoundary fallback={<MapFallback selectedWorker={selectedWorker} onSelectWorker={setSelectedWorker} />}>
            <MapView
              ref={mapRef}
              style={s.map}
              initialRegion={{
                latitude: FARM_CENTER.latitude,
                longitude: FARM_CENTER.longitude,
                latitudeDelta: 0.025,
                longitudeDelta: 0.025,
              }}
              showsUserLocation={false}
              showsCompass={true}
              showsScale={true}
              rotateEnabled={true}
              zoomEnabled={true}
              scrollEnabled={true}
              mapType="satellite"
            >
              {/* Farm boundary */}
              <Polygon
                coordinates={FARM_BOUNDARY}
                strokeColor="#AEEA00"
                strokeWidth={2}
                fillColor="rgba(174,234,0,0.04)"
              />

              {/* Zone polygons */}
              {ZONE_POLYGONS.map(zone => (
                <Polygon
                  key={zone.id}
                  coordinates={zone.coordinates}
                  strokeColor={zone.color}
                  strokeWidth={2}
                  fillColor={zone.color === '#EF4444' ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.06)'}
                  tappable={true}
                  onPress={() => Alert.alert(zone.name, `${zone.color === '#EF4444' ? 'Restricted Area' : 'Operational Zone'}\n\nTap a worker pin for details.`)}
                />
              ))}

              {/* Worker markers */}
              {WORKER_POSITIONS.map(worker => (
                <Marker
                  key={worker.id}
                  coordinate={worker.coordinate}
                  onPress={() => setSelectedWorker(selectedWorker?.id === worker.id ? null : worker)}
                  tracksViewChanges={false}
                >
                  <WorkerPin worker={worker} onPress={() => setSelectedWorker(selectedWorker?.id === worker.id ? null : worker)} />
                </Marker>
              ))}

              {/* Farm center circle */}
              <Circle
                center={FARM_CENTER}
                radius={1200}
                strokeColor="rgba(174,234,0,0.3)"
                fillColor="rgba(174,234,0,0.02)"
                strokeWidth={1}
              />
            </MapView>

            {/* Callout overlay */}
            {selectedWorker && (
              <Animated.View entering={FadeInUp.duration(200).springify()} style={s.callout}>
                <View style={s.calloutContent}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={[s.calloutAvatar, { borderColor: statusColor(selectedWorker.status) }]}>
                      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>{selectedWorker.initials}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: '700', fontSize: 14, color: '#1B1B1B' }}>{selectedWorker.name}</Text>
                      <Text style={{ fontSize: 11, color: '#64748B' }}>{selectedWorker.role}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setSelectedWorker(null)} style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 12, color: '#94A3B8', fontWeight: '600' }}>X</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={s.calloutDetails}>
                    <View style={s.calloutRow}>
                      <GoonaIcon icon={Icons.mapPin} size={12} color="#64748B" />
                      <Text style={s.calloutText}>{selectedWorker.location} — {selectedWorker.lastSeen}</Text>
                    </View>
                    <View style={s.calloutRow}>
                      <Icons.battery size={12} color={selectedWorker.battery > 20 ? '#22C55E' : '#EF4444'} strokeWidth={2} />
                      <Text style={s.calloutText}>Battery: {selectedWorker.battery}%</Text>
                    </View>
                    <View style={s.calloutRow}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: statusColor(selectedWorker.status) }} />
                      <Text style={{ fontSize: 11, color: '#64748B', textTransform: 'capitalize' }}>{selectedWorker.status}</Text>
                    </View>
                  </View>
                </View>
              </Animated.View>
            )}

            {/* Map overlay buttons */}
            <View style={s.mapOverlayBtn}>
              <TouchableOpacity style={s.mapBtn} onPress={fitToMarkers}>
                <Icons.target size={16} color="#00695C" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </MapErrorBoundary>
        </Animated.View>

        {/* ─── LIVE STATUS STRIP ─── */}
        <View style={{ paddingHorizontal: 24 }}>
          <Animated.View entering={FadeInUp.duration(500).delay(200).springify()} style={s.statusStrip}>
            <View style={s.statusItem}>
              <PulseDot color="#22C55E" size={6} />
              <Text style={s.statusValue}>{present}</Text>
              <Text style={s.statusLabel}>Present</Text>
            </View>
            <View style={s.statusDiv} />
            <View style={s.statusItem}>
              <GoonaIcon icon={Icons.mapPin} size={14} color="#00695C" />
              <Text style={s.statusValue}>{ZONE_POLYGONS.length}</Text>
              <Text style={s.statusLabel}>Zones</Text>
            </View>
            <View style={s.statusDiv} />
            <View style={s.statusItem}>
              <GoonaIcon icon={Icons.bell} size={14} color="#EF4444" />
              <Text style={s.statusValue}>1</Text>
              <Text style={s.statusLabel}>Alert</Text>
            </View>
            <View style={s.statusDiv} />
            <View style={s.statusItem}>
              <Icons.radio size={14} color="#22C55E" strokeWidth={2} />
              <Text style={[s.statusLabel, { color: '#22C55E', fontWeight: '600' }]}>Active</Text>
            </View>
          </Animated.View>

          {/* ─── ZONE SUMMARY ─── */}
          <Animated.View entering={FadeInUp.duration(500).delay(240).springify()} style={{ marginTop: 16 }}>
            <Text style={s.sectionTitle}>Zones</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
              {ZONE_POLYGONS.map(zone => (
                <TouchableOpacity
                  key={zone.id}
                  onPress={() => Alert.alert(zone.name, `${zone.color === '#EF4444' ? 'Restricted' : 'Operational'} zone.\n\nPart of the ${FARM_NAME} geofence.`)}
                  style={[s.zoneChip, { borderColor: zone.color, backgroundColor: `${zone.color}10` }]}
                >
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: zone.color }} />
                  <Text style={[s.zoneChipText, { color: zone.color }]}>{zone.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>

          {/* ─── GEOFENCE EVENTS ─── */}
          <Animated.View entering={FadeInUp.duration(500).delay(280).springify()} style={{ marginTop: 20 }}>
            <Text style={s.sectionTitle}>Attendance Events</Text>
            {GEOFENCE_EVENTS.map((evt, i) => (
              <Animated.View key={i} entering={FadeInUp.duration(300).delay(300 + i * 50).springify()} style={s.eventItem}>
                <View style={[s.eventIcon, { backgroundColor: `${evt.color}12` }]}>
                  <GoonaIcon icon={evt.icon} size={12} color={evt.color} />
                </View>
                <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={s.eventText}>{evt.text}</Text>
                  <Text style={s.eventTime}>{evt.time}</Text>
                </View>
              </Animated.View>
            ))}
          </Animated.View>

          {/* ─── WORKER ACTIVITY ─── */}
          <Animated.View entering={FadeInUp.duration(500).delay(500).springify()} style={{ marginTop: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={s.sectionTitle}>Worker Activity</Text>
              <Text style={{ fontSize: 11, color: '#22C55E', fontWeight: '600' }}>{activeWorkers.length} active</Text>
            </View>
            {WORKER_POSITIONS.map((w, i) => {
              const { style, onPressIn, onPressOut } = usePressScale()
              const color = statusColor(w.status)
              return (
                <Animated.View key={w.id} entering={FadeInUp.duration(300).delay(530 + i * 40).springify()}>
                  <Pressable onPressIn={onPressIn} onPressOut={onPressOut}
                    onPress={() => setSelectedWorker(selectedWorker?.id === w.id ? null : w)}
                  >
                    <Animated.View style={[style, s.workerCard]}>
                      <View style={{ alignItems: 'center', marginRight: 10 }}>
                        <View style={[s.workerAvatar, { borderColor: color }]}>
                          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>{w.initials}</Text>
                        </View>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: '600', fontSize: 13, color: '#1B1B1B' }}>{w.name}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 }}>
                          <GoonaIcon icon={Icons.mapPin} size={10} color="#64748B" />
                          <Text style={{ fontSize: 10, color: '#64748B' }}>{w.location}</Text>
                          <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#D1D5DB', marginHorizontal: 4 }} />
                          <Icons.battery size={10} color={w.battery > 20 ? '#22C55E' : '#EF4444'} strokeWidth={2} />
                          <Text style={{ fontSize: 10, color: '#94A3B8' }}>{w.battery}%</Text>
                        </View>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 2 }}>
                        <View style={[s.workerBadge, { backgroundColor: `${color}15` }]}>
                          <Text style={[s.workerBadgeText, { color }]}>{w.status}</Text>
                        </View>
                        <Text style={{ fontSize: 9, color: '#94A3B8' }}>{w.lastSeen}</Text>
                      </View>
                    </Animated.View>
                  </Pressable>
                </Animated.View>
              )
            })}
          </Animated.View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <BottomDock hidden={false} />
    </View>
  )
}

const mapHeight = SCREEN_H * 0.42

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9F5' },
  scroll: { flex: 1, zIndex: 1 },
  topNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 54, paddingHorizontal: 24 },
  navBack: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  navLabel: { fontSize: 13, fontWeight: '500', color: '#616161' },
  headerTitle: { fontWeight: '800', fontSize: 30, lineHeight: 34, color: '#1B1B1B' },
  headerSub: { fontSize: 13, color: '#64748B', marginTop: 1 },

  /* ─── Map ─── */
  mapWrapper: { height: mapHeight, marginHorizontal: 16, marginTop: 12, borderRadius: 24, overflow: 'hidden', position: 'relative', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 24, elevation: 6 },
  map: { width: '100%', height: '100%' },
  callout: { position: 'absolute', bottom: 10, left: 10, right: 10 },
  calloutContent: { backgroundColor: 'white', borderRadius: 18, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 6 },
  calloutAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  calloutDetails: { marginTop: 8, gap: 4 },
  calloutRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  calloutText: { fontSize: 11, color: '#64748B' },
  mapOverlayBtn: { position: 'absolute', top: 12, right: 12 },
  mapBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },

  /* ─── Status ─── */
  statusStrip: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 18, paddingVertical: 14, paddingHorizontal: 16, marginTop: 14, borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 12, elevation: 2 },
  statusItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  statusValue: { fontSize: 15, fontWeight: '800', color: '#1B1B1B' },
  statusLabel: { fontSize: 10, color: '#94A3B8' },
  statusDiv: { width: 1, height: 22, backgroundColor: '#F1F5F9' },

  /* ─── Section ─── */
  sectionTitle: { fontWeight: '800', fontSize: 17, color: '#1B1B1B' },

  /* ─── Zones ─── */
  zoneChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 50, borderWidth: 1, marginRight: 8 },
  zoneChipText: { fontSize: 12, fontWeight: '600' },

  /* ─── Events ─── */
  eventItem: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'white', borderRadius: 14, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)' },
  eventIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  eventText: { fontSize: 12, color: '#1B1B1B', flex: 1 },
  eventTime: { fontSize: 10, color: '#94A3B8', marginLeft: 8 },

  /* ─── Workers ─── */
  workerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 16, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)' },
  workerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  workerBadge: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 50 },
  workerBadgeText: { fontSize: 9, fontWeight: '700', textTransform: 'capitalize' },

  /* ─── Fallback ─── */
  fallbackContainer: { height: mapHeight, backgroundColor: '#F1F5F9', borderRadius: 24, overflow: 'hidden' },
  fallbackHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10, backgroundColor: 'rgba(255,255,255,0.85)', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.04)' },
  fallbackGrid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', padding: 8, gap: 6, alignContent: 'flex-start' },
  fallbackZoneCard: { width: '31%', flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8, borderRadius: 12, borderWidth: 1.5 },
  fallbackWorkerRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 8, backgroundColor: 'rgba(255,255,255,0.85)' },
  fallbackDot: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  fallbackFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: 'rgba(255,255,255,0.9)', borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.04)' },
})
