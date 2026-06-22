import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { router, usePathname } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withRepeat, withTiming, withSequence, withDelay, interpolate, Extrapolation } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useMemo } from 'react'
import { Icons } from '../../shared/icons'
import GoonaIcon from '../ui/GoonaIcon'
import GoonaMarqueeAlert from '../GoonaMarqueeAlert'
import { generateWeatherAlerts } from '../../utils/weatherIntelligence'
const TAB_ROUTES = [
  { label: 'Home', route: '/(tabs)/dashboard' },
  { label: 'FarmChat', route: '/(tabs)/farmchat' },
  { label: 'Records', route: '/records' },
  { label: 'Recapt', route: '/recapitalization' },
  { label: 'Teams', route: '/team' },
]

const TAB_ICONS = [Icons.house, Icons.messagesSquare, Icons.clipboardList, Icons.naira, Icons.users]

function ActiveOrb() {
  const pulse = useSharedValue(1)

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 120 }),
        withTiming(1.0, { duration: 120 }),
        withTiming(1.10, { duration: 140 }),
        withTiming(1.0, { duration: 180 }),
        withDelay(450, withTiming(1.0, { duration: 1 })),
      ),
      -1,
    )
  }, [])

  const orbStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -4 },
      { scale: pulse.value },
    ],
    shadowOpacity: interpolate(pulse.value, [1, 1.10], [0.35, 0.55], Extrapolation.CLAMP),
    shadowRadius: interpolate(pulse.value, [1, 1.10], [22, 30], Extrapolation.CLAMP),
  }))

  return (
    <Animated.View style={[styles.activeOrb, orbStyle]}>
      <LinearGradient
        colors={['#2E7D32', '#1B5E20']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: 999 }]}
      />
      <View style={styles.orbGlowOuter} pointerEvents="none" />
      <View style={styles.orbGlowInner} pointerEvents="none" />
    </Animated.View>
  )
}

export default function BottomDock({ hidden }: { hidden?: boolean }) {
  const pathname = usePathname()
  const insets = useSafeAreaInsets()
  const activeIndex = (() => {
    if (pathname === '/(tabs)' || pathname === '/(tabs)/dashboard' || pathname === '/dashboard') return 0
    if (pathname.includes('/farmchat') || pathname.includes('/chat/')) return 1
    if (pathname.includes('records') || pathname.includes('sales') || pathname.includes('record-sale') || pathname.includes('create-batch') || pathname.includes('daily-records') || pathname.includes('batch-details') || pathname.includes('/batches')) return 2
    if (pathname.includes('recapitalization') || pathname.includes('recapt') || pathname.includes('plan-recapt')) return 3
    if (pathname.includes('team') || pathname.includes('teams') || pathname.includes('worker') || pathname.includes('settings') || pathname.includes('goona-iq') || pathname.includes('academy') || pathname.includes('farm-profile') || pathname.includes('device-management') || pathname.includes('permissions') || pathname.includes('workforce') || pathname.includes('farm-boundaries') || pathname.includes('geofence')) return 4
    return 0
  })()

  const tickerMessages = useMemo(() => {
    const core = [
      'Consistency builds stronger farms.',
      'Your weekly recapt target is due tomorrow.',
      'GOONA IQ: Feed efficiency may drop this week.',
      '3 worker tasks completed today.',
      'Recapt milestone unlocked. Keep going.',
      'Small daily wins lead to big farm growth.',
      'Recapt target: 60% achieved this cycle.',
      'Remember to check your batch health scores.',
    ]
    const weather = generateWeatherAlerts(4)
    const merged: string[] = []
    let ci = 0, wi = 0
    while (ci < core.length || wi < weather.length) {
      if (ci < core.length) merged.push(core[ci++])
      if (wi < weather.length && (ci % 2 === 0 || ci === core.length)) merged.push(weather[wi++])
    }
    return merged
  }, [])

  if (hidden) return null

  const bottom = insets.bottom > 0 ? insets.bottom : 16

  return (
    <View style={styles.root} pointerEvents="box-none">
      <View style={[styles.outerWrapper, { bottom }]}>
        <View style={styles.container}>
          <LinearGradient
            colors={['rgba(255,255,255,0.72)', 'rgba(248,250,252,0.48)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: 34 }]}
            pointerEvents="none"
          />
          <View style={styles.blurOverlay} pointerEvents="none" />
          {TAB_ROUTES.map((tab, i) => {
            const isActive = i === activeIndex
            return (
              <DockTabButton
                key={tab.label}
                label={tab.label}
                index={i}
                isActive={isActive}
                onPress={() => {
                  if (i !== activeIndex) {
                    router.navigate({ pathname: tab.route as any } as any)
                  }
                }}
              />
            )
          })}
        </View>
        <GoonaMarqueeAlert
          messages={tickerMessages}
          onPress={(msg) => {
            const t = msg.toLowerCase()
            if (t.includes('recap') || t.includes('target')) {
              router.navigate({ pathname: '/(tabs)/recapitalization' as any } as any)
            } else if (t.includes('worker') || t.includes('task')) {
              router.navigate({ pathname: '/(tabs)/team' as any } as any)
            } else if (t.includes('goona iq') || t.includes('efficiency') || t.includes('insight')) {
              router.navigate({ pathname: '/goona-iq' as any } as any)
            } else if (t.includes('recovery') || t.includes('milestone')) {
              router.navigate({ pathname: '/notifications' as any } as any)
            } else if (t.includes('batch') || t.includes('health')) {
              router.navigate({ pathname: '/(tabs)/dashboard' as any } as any)
             } else if (t.includes('heat') || t.includes('temperature') || t.includes('humidity') ||
                        t.includes('rain') || t.includes('wind') || t.includes('storm') ||
                        t.includes('weather') || t.includes('climate') || t.includes('litter') ||
                        t.includes('disease') || t.includes('biosecurity') || t.includes('flood') ||
                        t.includes('stress') || t.includes('oxygen') || t.includes('dehydration') ||
                        t.includes('feed') || t.includes('appetite') || t.includes('conversion') ||
                        t.includes('harvest') || t.includes('risk') || t.includes('alert') ||
                        t.includes('watch')) {
              router.navigate({ pathname: '/weather-details' as any } as any)
            }
          }}
        />
      </View>
    </View>
  )
}

function DockTabButton({ label, index, isActive, onPress }: {
  label: string
  index: number
  isActive: boolean
  onPress: () => void
}) {
  const scale = useSharedValue(1)

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const onPressIn = () => {
    scale.value = withSpring(0.88, { damping: 14, stiffness: 320 })
  }
  const onPressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 240 })
  }

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={styles.tabTouch}
    >
      <Animated.View style={[styles.tabItem, animStyle]}>
        <View style={styles.iconOrbWrap}>
          {isActive && <ActiveOrb />}
          <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
            <GoonaIcon icon={TAB_ICONS[index]} active={isActive} size={22} />
          </View>
        </View>
        <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]} numberOfLines={1}>
          {label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 999,
    elevation: 999,
  },
  outerWrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 999,
    elevation: 999,
  },
  container: {
    height: 76,
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 34,
    shadowColor: '#1B5E20', shadowOffset: { width: 0, height: 18 }, shadowOpacity: 0.12, shadowRadius: 48,
    paddingHorizontal: 6,
    zIndex: 999, elevation: 999,
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 34,
  },
  tabTouch: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    width: '100%',
    paddingVertical: 6,
    position: 'relative',
  },
  iconOrbWrap: {
    width: 36, height: 36,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  iconWrap: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    borderRadius: 18,
  },
  iconWrapActive: {},
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.2,
    color: '#94A3B8',
    zIndex: 2,
  },
  tabLabelActive: {
    color: '#FFFFFF',
    fontWeight: '600',
    letterSpacing: 0.15,
  },
  activeOrb: {
    position: 'absolute',
    top: -6, left: -6,
    width: 48, height: 48,
    borderRadius: 999,
    zIndex: 1,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 8,
  },
  orbGlowOuter: {
    position: 'absolute',
    top: -6, left: -6,
    width: 60, height: 60,
    borderRadius: 999,
    backgroundColor: 'rgba(46,125,50,0.08)',
    zIndex: 0,
  },
  orbGlowInner: {
    position: 'absolute',
    top: -3, left: -3,
    width: 54, height: 54,
    borderRadius: 999,
    backgroundColor: 'rgba(56,142,60,0.15)',
    zIndex: 0,
  },
})
