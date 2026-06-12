import React, { useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, Animated, Easing } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { router } from 'expo-router'

const PULSE_SIZE = 160
const INNER_SIZE = 120

export default function VerifyIdentityScreen() {
  const scaleAnim = useRef(new Animated.Value(0.9)).current
  const opacityAnim = useRef(new Animated.Value(0.8)).current

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.4,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 0.9,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.8,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ]),
    )
    pulse.start()
    return () => pulse.stop()
  }, [scaleAnim, opacityAnim])

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAF7' }}>
      <StatusBar style="dark" />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
        <Text style={{ fontSize: 24, fontWeight: '800', color: '#1B1B1B', marginBottom: 12 }}>
          Verify Identity
        </Text>
        <Text style={{ fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 20, marginBottom: 48, paddingHorizontal: 8 }}>
          Look at the camera to authenticate your farm account.
        </Text>

        <View style={{ width: PULSE_SIZE, height: PULSE_SIZE, borderRadius: PULSE_SIZE / 2, borderWidth: 4, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center', marginBottom: 40 }}>
          <Animated.View
            style={{
              width: INNER_SIZE,
              height: INNER_SIZE,
              borderRadius: INNER_SIZE / 2,
              backgroundColor: '#2E7D32',
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            }}
          />
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.back()}
          style={{ paddingVertical: 12, paddingHorizontal: 32, backgroundColor: 'white', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 20 }}
        >
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#1F2937' }}>Enter PIN Instead</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}
