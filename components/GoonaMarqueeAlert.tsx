import { useCallback, useEffect, useRef, useState } from 'react'
import { Text, TouchableOpacity, StyleSheet, LayoutChangeEvent, View } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, cancelAnimation, withDelay, runOnJS } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import GoonaIcon from './ui/GoonaIcon'
import { CircleAlert, ChevronRight } from 'lucide-react-native'
import { useTickerStore } from '../store/useTickerStore'
import { getWeatherInfo, isWeatherMessage, isHighSeverity } from '../utils/weatherIntelligence'

export interface GoonaMarqueeAlertProps {
  messages?: string[]
  speed?: number
  onPress?: (message: string) => void
}

const DEFAULT_MESSAGES = [
  'Consistency builds stronger farms.',
  'Your weekly ₦25,000 recap target is due tomorrow.',
  'GOONA IQ: Feed efficiency may drop this week.',
  '3 worker tasks completed today.',
  'Recovery milestone unlocked. Keep going.',
  'Small daily wins lead to big farm growth.',
  'Recap target: 60% achieved this cycle.',
  'Remember to check your batch health scores.',
]

export default function GoonaMarqueeAlert({
  messages = DEFAULT_MESSAGES,
  speed = 10,
  onPress,
}: GoonaMarqueeAlertProps) {
  const msgIndex = useTickerStore((s) => s.messageIndex)
  const advanceMessage = useTickerStore((s) => s.advanceMessage)
  const [textW, setTextW] = useState(0)
  const [containerW, setContainerW] = useState(0)
  const translateX = useSharedValue(0)
  const mounted = useRef(true)
  const paused = useRef(false)
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const current = messages[msgIndex % messages.length]

  const isWeather = isWeatherMessage(current)
  const isHigh = isHighSeverity(current)
  const weatherIcon = isWeather ? getWeatherInfo(current) : null
  const displayIcon = weatherIcon ? weatherIcon.icon : CircleAlert
  const displayIconColor = weatherIcon ? weatherIcon.color : '#2E7D32'

  const cycle = useCallback(() => {
    paused.current = true
    resumeTimer.current = setTimeout(() => {
      if (!mounted.current) return
      paused.current = false
      advanceMessage()
    }, 400)
  }, [advanceMessage])

  const scroll = useCallback(() => {
    if (textW === 0 || containerW === 0) return
    cancelAnimation(translateX)
    const dist = containerW + textW
    translateX.value = containerW
    translateX.value = withDelay(
      100,
      withTiming(-textW, {
        duration: Math.round(dist * Math.max(speed, 10)),
        easing: Easing.linear,
      }, (done) => {
        if (done) runOnJS(cycle)()
      })
    )
  }, [textW, containerW, speed, translateX, cycle])

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      if (resumeTimer.current) clearTimeout(resumeTimer.current)
    }
  }, [])

  useEffect(() => {
    if (!paused.current && containerW > 0 && textW > 0) scroll()
  }, [msgIndex, scroll, containerW, textW])

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }))

  const handlePress = () => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current)
    cancelAnimation(translateX)
    paused.current = true
    onPress?.(current)
    resumeTimer.current = setTimeout(() => {
      if (!mounted.current) return
      paused.current = false
      scroll()
    }, 3000)
  }

  const onTextLayout = (e: LayoutChangeEvent) => setTextW(e.nativeEvent.layout.width)
  const onContainerLayout = (e: LayoutChangeEvent) => setContainerW(e.nativeEvent.layout.width)

  if (messages.length === 0) return null

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={handlePress}
      style={styles.wrapper}
    >
      <LinearGradient
        colors={isHigh
          ? ['rgba(254,242,242,0.95)', 'rgba(255,241,242,0.8)', 'rgba(254,242,242,0.65)']
          : ['rgba(232,245,233,0.9)', 'rgba(240,253,244,0.7)', 'rgba(232,245,233,0.6)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
        pointerEvents="none"
      />
      <View style={styles.inner}>
        <View style={styles.iconWrap}>
          <GoonaIcon icon={displayIcon} size={14} color={displayIconColor} />
        </View>
        <View style={styles.textContainer} onLayout={onContainerLayout}>
          <Animated.View style={[styles.textRow, animStyle]}>
            <Text
              style={styles.text}
              numberOfLines={1}
              onLayout={onTextLayout}
            >
              {current}
            </Text>
          </Animated.View>
        </View>
        <View style={styles.chevronWrap}>
          <GoonaIcon icon={ChevronRight} size={10} color="#2E7D32" />
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    height: 34,
    marginTop: 10,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(232,245,233,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(46,125,50,0.15)',
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  inner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  iconWrap: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  textContainer: {
    flex: 1,
    overflow: 'hidden',
    height: 22,
    justifyContent: 'center',
  },
  textRow: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    height: 22,
  },
  text: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1B5E20',
    letterSpacing: 0.2,
    includeFontPadding: false,
  },
  chevronWrap: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
})
