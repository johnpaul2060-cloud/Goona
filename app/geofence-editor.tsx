import React, { useCallback, useState } from 'react'
import {
  View, Text, TouchableOpacity, TextInput, ScrollView,
  StyleSheet, Dimensions, Alert, KeyboardAvoidingView, Platform, BackHandler,
} from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, { FadeInUp } from 'react-native-reanimated'
import GoonaIcon from '../components/ui/GoonaIcon'
import { Icons } from '../shared/icons'

const { width: SCREEN_W } = Dimensions.get('window')

const ZONE_TYPES = [
  { key: 'operational' as const, label: 'Operational Zone', desc: 'Worker-accessible areas with geofence tracking', icon: Icons.mapPin, color: '#22C55E' },
  { key: 'restricted' as const, label: 'Restricted Area', desc: 'Limited access zones with entry alerts', icon: Icons.shieldAlert, color: '#EF4444' },
]

const PRESET_NAMES = ['Poultry House A', 'Poultry House B', 'Hatchery', 'Feed Warehouse', 'Fish Pond', 'Storage Facility', 'Chemical Storage', 'Generator Room', 'Medicine Storage', 'Custom Zone']

export default function GeofenceEditorScreen() {
  const [zoneName, setZoneName] = useState('')
  const [zoneType, setZoneType] = useState<'operational' | 'restricted'>('operational')
  const [showPresets, setShowPresets] = useState(true)
  const hasUnsavedChanges = zoneName.trim().length > 0 || zoneType !== 'operational'

  const requestLeave = useCallback(() => {
    if (!hasUnsavedChanges) {
      router.back()
      return
    }

    Alert.alert('Discard changes?', 'Your zone changes have not been saved.', [
      { text: 'Keep Editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => router.back() },
    ])
  }, [hasUnsavedChanges])

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        requestLeave()
        return true
      })
      return () => sub.remove()
    }, [requestLeave])
  )

  const handleSave = () => {
    if (!zoneName.trim()) {
      Alert.alert('Name Required', 'Please enter a zone name before saving.')
      return
    }
    Alert.alert('Zone Saved', `${zoneName} has been created as a ${zoneType} zone.\n\nCoordinates will be captured from the map editor.\n\nGeofence monitoring is now active for this area.`, [
      { text: 'OK', onPress: () => router.back() },
    ])
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: '#F8F9F5' }}>
      <StatusBar style="dark" />
      <View style={{ position: 'absolute', top: -60, right: -60, width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(0,105,92,0.06)', zIndex: 0 }} pointerEvents="none" />

      <ScrollView style={{ flex: 1, zIndex: 1 }} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* App Bar */}
        <Animated.View entering={FadeInUp.duration(500).springify()} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 54 }}>
          <TouchableOpacity style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10 }} activeOpacity={0.7} onPress={requestLeave}>
            <GoonaIcon icon={Icons.arrowLeft} size={22} color="#1B1B1B" />
          </TouchableOpacity>
          <Text style={{ fontWeight: '700', fontSize: 16, color: '#1B1B1B' }}>Geofence Editor</Text>
          <TouchableOpacity
            onPress={handleSave}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#00695C', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 50 }}
          >
            <GoonaIcon icon={Icons.save} size={14} color="#fff" />
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#fff' }}>Save</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Header */}
        <Animated.View entering={FadeInUp.duration(500).delay(80).springify()} style={{ marginTop: 20 }}>
          <Text style={{ fontWeight: '800', fontSize: 28, lineHeight: 32, color: '#1B1B1B' }}>New Zone</Text>
          <Text style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>Define a geofence zone for your farm.</Text>
        </Animated.View>

        {/* Zone Type Selector */}
        <Animated.View entering={FadeInUp.duration(500).delay(120).springify()} style={{ marginTop: 24 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Zone Type</Text>
          <View style={{ gap: 8 }}>
            {ZONE_TYPES.map(zt => (
              <TouchableOpacity
                key={zt.key}
                onPress={() => { setZoneType(zt.key); setShowPresets(true) }}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 12,
                  backgroundColor: 'white', borderRadius: 18, padding: 16,
                  borderWidth: 2, borderColor: zoneType === zt.key ? zt.color : 'transparent',
                  shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.03, shadowRadius: 12, elevation: 1,
                }}
              >
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: `${zt.color}12`, alignItems: 'center', justifyContent: 'center' }}>
                  <GoonaIcon icon={zt.icon} size={22} color={zt.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '600', fontSize: 14, color: '#1B1B1B' }}>{zt.label}</Text>
                  <Text style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>{zt.desc}</Text>
                </View>
                {zoneType === zt.key && (
                  <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: zt.color, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>{'\u2714'}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Zone Name */}
        <Animated.View entering={FadeInUp.duration(500).delay(180).springify()} style={{ marginTop: 24 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Zone Name</Text>
          <TextInput
            style={{ backgroundColor: 'white', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#1B1B1B', borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 8, elevation: 1 }}
            value={zoneName}
            onChangeText={(t) => { setZoneName(t); setShowPresets(false) }}
            placeholder="Enter zone name..."
            placeholderTextColor="#CBD5E1"
          />
        </Animated.View>

        {/* Preset Names */}
        {showPresets && (
          <Animated.View entering={FadeInUp.duration(500).delay(220).springify()} style={{ marginTop: 16 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#94A3B8', marginBottom: 8 }}>Suggestions</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {PRESET_NAMES.map(name => (
                <TouchableOpacity
                  key={name}
                  onPress={() => { setZoneName(name); setShowPresets(false) }}
                  style={{ paddingVertical: 6, paddingHorizontal: 14, borderRadius: 50, backgroundColor: zoneName === name ? '#00695C' : 'white', borderWidth: 1, borderColor: zoneName === name ? '#00695C' : 'rgba(0,0,0,0.04)' }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '600', color: zoneName === name ? '#fff' : '#475569' }}>{name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Draw Area */}
        <Animated.View entering={FadeInUp.duration(500).delay(280).springify()} style={{ marginTop: 28 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Draw Boundary</Text>
          <TouchableOpacity
            onPress={() => Alert.alert('Draw Boundary', 'Tap on the map to place boundary points.\n\n• Tap to add point\n• Drag to adjust\n• Close polygon to complete\n\nCoordinates will be stored for geofence monitoring.',)}
            style={{ backgroundColor: '#0F172A', borderRadius: 24, height: 200, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
          >
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.08, flexDirection: 'row', flexWrap: 'wrap' }}>
              {Array.from({ length: 20 }).map((_, i) => (
                <View key={i} style={{ width: 2, height: 2, borderRadius: 1, backgroundColor: '#AEEA00', margin: 22 }} />
              ))}
            </View>
            <View style={{ alignItems: 'center', gap: 8 }}>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(174,234,0,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                <Icons.mapPin size={24} color="#AEEA00" strokeWidth={1.5} />
              </View>
              <Text style={{ fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.7)' }}>Tap to draw zone boundary</Text>
              <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Polygon coordinates will be saved</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Info */}
        <Animated.View entering={FadeInUp.duration(500).delay(340).springify()} style={{ marginTop: 20, backgroundColor: 'rgba(0,105,92,0.04)', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: 'rgba(0,105,92,0.06)' }}>
          <Text style={{ fontSize: 11, color: '#00695C', lineHeight: 16 }}>
            Zones monitor worker entry/exit events. Restricted zones generate immediate alerts when unauthorized personnel enter.
          </Text>
        </Animated.View>

        {/* Delete option (for existing zones) */}
        <Animated.View entering={FadeInUp.duration(500).delay(400).springify()} style={{ marginTop: 24 }}>
          <TouchableOpacity
            onPress={() => Alert.alert('Delete Zone', 'This will remove the zone and all associated geofence data.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => router.back() },
            ])}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 }}
          >
            <GoonaIcon icon={Icons.trash2} size={16} color="#EF4444" />
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#EF4444' }}>Delete Zone</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
