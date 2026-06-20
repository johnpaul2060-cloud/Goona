import { View, Text, StyleSheet } from 'react-native'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { useNotificationStore } from '../store/useNotificationStore'

export default function NotificationBadge({ category, size = 18 }: { category?: string; size?: number }) {
  const count = useNotificationStore((s) =>
    category
      ? s.notifications.filter((n) => n.category === category && n.status === 'unread').length
      : s.notifications.filter((n) => n.status === 'unread').length
  )

  if (count === 0) return null

  return (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} style={[styles.badge, { minWidth: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.text, { fontSize: size * 0.6 }]}>{count > 99 ? '99+' : count}</Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
})
