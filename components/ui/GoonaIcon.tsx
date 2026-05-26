import { useEffect, type ElementType } from 'react'
import { View, type ViewStyle } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated'
import type { LucideProps } from 'lucide-react-native'

interface GoonaIconProps {
  icon: ElementType<LucideProps>
  size?: number
  color?: string
  active?: boolean
  glow?: boolean
  strokeWidth?: number
  animated?: boolean
  style?: ViewStyle
}

export default function GoonaIcon({
  icon: Icon,
  size = 22,
  color = '#94A3B8',
  active,
  glow,
  strokeWidth = 2,
  animated,
  style,
}: GoonaIconProps) {
  const pulse = useSharedValue(1)

  useEffect(() => {
    if (animated) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 800 }),
          withTiming(1, { duration: 800 }),
        ),
        -1,
        true,
      )
    } else {
      pulse.value = 1
    }
  }, [animated])

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value as unknown as number }],
  }))

  const iconColor = active ? '#FFFFFF' : color
  const glowColor = active ? 'rgba(46,125,50,0.25)' : 'transparent'
  const icon = (
    <Icon size={size} color={iconColor} strokeWidth={strokeWidth} />
  )

  if (!active && !glow && !animated) {
    return (
      <View style={[{ width: size + 4, height: size + 4, alignItems: 'center', justifyContent: 'center' }, style]}>
        {icon}
      </View>
    )
  }

  const Wrapper = animated ? Animated.View : View
  const wrapperStyle = animated ? [wrapperBase(size), animStyle, style] : [wrapperBase(size), style]

  return (
    <Wrapper style={wrapperStyle}>
      {glow && (
        <View
          style={{
            position: 'absolute',
            width: size + 12,
            height: size + 12,
            borderRadius: (size + 12) / 2,
            backgroundColor: glowColor,
          }}
        />
      )}
      {icon}
    </Wrapper>
  )
}

const wrapperBase = (size: number) => ({
  width: size + 4,
  height: size + 4,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
})
