import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { router, usePathname } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withRepeat, withTiming, Easing, interpolate, Extrapolation } from 'react-native-reanimated'
import Svg, { Path, Circle, Rect, Line, G } from 'react-native-svg'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect } from 'react'

const TAB_ROUTES = [
  { label: 'Home', route: '/(tabs)/dashboard' },
  { label: 'Farmchat', route: '/(tabs)/farm-feed' },
  { label: 'Records', route: '/records' },
  { label: 'Recapt', route: '/recapitalization' },
  { label: 'Teams', route: '/team' },
]

function DockIcon({ i, active }: { i: number; active: boolean }) {
  const c = active ? '#FFFFFF' : '#94A3B8'
  const w = 1.5
  return (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      {i === 0 && <Path d="M3 10L12 3L21 10V21C21 21.6 20.6 22 20 22H16V16H8V22H4C3.4 22 3 21.6 3 21V10Z" stroke={c} strokeWidth={w} strokeLinejoin="round" />}
      {i === 1 && <>
        <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z" stroke={c} strokeWidth={w} strokeLinejoin="round" />
        <Path d="M8 9h8M8 13h5" stroke={c} strokeWidth={w} strokeLinecap="round" />
      </>}
      {i === 2 && <>
        <Rect x="5" y="4" width="14" height="17" rx="2" stroke={c} strokeWidth={w} />
        <Line x1="8" y1="9" x2="16" y2="9" stroke={c} strokeWidth={w} strokeLinecap="round" />
        <Line x1="8" y1="13" x2="14" y2="13" stroke={c} strokeWidth={w} strokeLinecap="round" />
      </>}
      {i === 3 && <G>
        <Line x1="8" y1="4" x2="8" y2="20" stroke={c} strokeWidth={w} strokeLinecap="round" />
        <Line x1="16" y1="4" x2="16" y2="20" stroke={c} strokeWidth={w} strokeLinecap="round" />
        <Line x1="8" y1="4" x2="16" y2="20" stroke={c} strokeWidth={w} strokeLinecap="round" />
        <Line x1="7" y1="11" x2="17" y2="11" stroke={c} strokeWidth={w} strokeLinecap="round" />
        <Line x1="7" y1="15" x2="17" y2="15" stroke={c} strokeWidth={w} strokeLinecap="round" />
      </G>}
      {i === 4 && <>
        <Circle cx="6" cy="8" r="2" stroke={c} strokeWidth={w} />
        <Circle cx="12" cy="8" r="2" stroke={c} strokeWidth={w} />
        <Circle cx="18" cy="8" r="2" stroke={c} strokeWidth={w} />
        <Path d="M3 17c0-1.8 1.5-3 3-3s3 1.2 3 3" stroke={c} strokeWidth={w} strokeLinecap="round" />
        <Path d="M9 17c0-1.8 1.5-3 3-3s3 1.2 3 3" stroke={c} strokeWidth={w} strokeLinecap="round" />
        <Path d="M15 17c0-1.8 1.5-3 3-3s3 1.2 3 3" stroke={c} strokeWidth={w} strokeLinecap="round" />
      </>}
    </Svg>
  )
}

function ActiveGlow() {
  const pulse = useSharedValue(1)

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1.18, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
      -1, true,
    )
  }, [])

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: interpolate(pulse.value, [1, 1.18], [0.35, 0.10], Extrapolation.CLAMP),
  }))

  const innerGlowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pulse.value, [1, 1.18], [1, 1.08], Extrapolation.CLAMP) }],
    opacity: interpolate(pulse.value, [1, 1.18], [0.6, 0.25], Extrapolation.CLAMP),
  }))

  return (
    <>
      <Animated.View style={[styles.glowOuter, glowStyle]} />
      <Animated.View style={[styles.glowInner, innerGlowStyle]} />
      <LinearGradient
        colors={['#2E7D32', '#1B5E20']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.activePlate}
      />
    </>
  )
}

export default function BottomDock({ hidden }: { hidden?: boolean }) {
  const pathname = usePathname()
  const insets = useSafeAreaInsets()
  const dockFloat = useSharedValue(0)

  useEffect(() => {
    dockFloat.value = withRepeat(
      withTiming(-4, { duration: 3500, easing: Easing.inOut(Easing.sin) }),
      -1, true,
    )
  }, [])

  const dockAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: dockFloat.value }],
  }))

  const activeIndex = (() => {
    if (pathname === '/(tabs)' || pathname === '/(tabs)/dashboard' || pathname === '/dashboard') return 0
    if (pathname.includes('farm-feed') || pathname.includes('farmchat')) return 1
    if (pathname.includes('records')) return 2
    if (pathname.includes('recapitalization') || pathname.includes('recapt') || pathname.includes('plan-recapt')) return 3
    if (pathname.includes('team') || pathname.includes('teams') || pathname.includes('settings') || pathname.includes('goona-iq') || pathname.includes('academy') || pathname.includes('farm-profile') || pathname.includes('device-management') || pathname.includes('permissions')) return 4
    return 0
  })()

  if (hidden) return null

  const bottom = insets.bottom > 0 ? insets.bottom : 16

  return (
    <Animated.View style={[styles.container, dockAnimStyle, { bottom }]}>
      <LinearGradient
        colors={['rgba(255,255,255,0.72)', 'rgba(248,250,252,0.48)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
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
    </Animated.View>
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
        {isActive && <ActiveGlow />}
        <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
          <DockIcon i={index} active={isActive} />
        </View>
        <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]} numberOfLines={1}>
          {label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute', left: 16, right: 16, height: 76,
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 34,
    shadowColor: '#1B5E20', shadowOffset: { width: 0, height: 18 }, shadowOpacity: 0.12, shadowRadius: 48,
    paddingHorizontal: 6,
    zIndex: 999, elevation: 999,
    overflow: 'hidden',
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
  iconWrap: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    borderRadius: 22,
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
  glowOuter: {
    position: 'absolute',
    top: 2,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#2E7D32',
    zIndex: 0,
  },
  glowInner: {
    position: 'absolute',
    top: 4,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#388E3C',
    zIndex: 0,
  },
  activePlate: {
    position: 'absolute',
    top: 0,
    width: 44,
    height: 44,
    borderRadius: 22,
    zIndex: 1,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
})
