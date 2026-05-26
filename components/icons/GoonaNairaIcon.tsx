import { forwardRef } from 'react'
import Svg, { Path, Rect } from 'react-native-svg'
import type { LucideProps } from 'lucide-react-native'

const GoonaNairaIcon = forwardRef<Svg, LucideProps>(({ size = 24, color = '#94A3B8', strokeWidth = 2, ...props }, ref) => (
  <Svg
    ref={ref}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Rect x="3" y="4" width="18" height="16" rx="4" />
    <Path d="M8 8V16" />
    <Path d="M16 8V16" />
    <Path d="M8 8L16 16" />
    <Path d="M6.5 11H17.5" />
    <Path d="M6.5 13H17.5" />
  </Svg>
))

GoonaNairaIcon.displayName = 'GoonaNairaIcon'

export { GoonaNairaIcon }
