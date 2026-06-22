import React from 'react'
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { router } from 'expo-router'
import { Icons } from '../../shared/icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { FadeInUp } from 'react-native-reanimated'
import GoonaIcon from '../../components/ui/GoonaIcon'
import BottomDock from '../../components/navigation/BottomDock'
import DailyChallenge from '../../components/DailyChallenge'

export default function DailyChallengeScreen() {
  const insets = useSafeAreaInsets()

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.bgBlob} pointerEvents="none" />
      <View style={styles.bgContour1} pointerEvents="none" />
      <View style={styles.bgContour2} pointerEvents="none" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollInner, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 130 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInUp.duration(500).springify()} style={styles.topNav}>
          <TouchableOpacity style={styles.navBack} onPress={() => router.back()} activeOpacity={0.7}>
            <GoonaIcon icon={Icons.arrowLeft} size={22} color="#1B1B1B" />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Daily Challenge</Text>
          <View style={{ width: 36 }} />
        </Animated.View>

        <DailyChallenge />

        <View style={{ height: 20 }} />
      </ScrollView>

      <BottomDock />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAF7' },
  bgBlob: { position: 'absolute', top: -50, right: -50, width: 320, height: 320, borderRadius: 160, backgroundColor: 'rgba(232,245,233,0.35)', zIndex: 0 },
  bgContour1: { position: 'absolute', top: '10%', right: '-15%', width: 380, height: 130, zIndex: 0, borderWidth: 1, borderColor: 'rgba(46,125,50,0.06)', borderTopLeftRadius: 190, borderTopRightRadius: 190, borderBottomWidth: 0, transform: [{ rotate: '10deg' }] },
  bgContour2: { position: 'absolute', bottom: '20%', left: '-10%', width: 300, height: 100, zIndex: 0, borderWidth: 1, borderColor: 'rgba(46,125,50,0.06)', borderBottomLeftRadius: 150, borderBottomRightRadius: 150, borderTopWidth: 0, transform: [{ rotate: '-8deg' }] },
  scroll: { flex: 1, zIndex: 1 },
  scrollInner: { paddingHorizontal: 24 },
  topNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  navBack: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  topTitle: { fontWeight: '700', fontSize: 20, color: '#1B1B1B' },
})
