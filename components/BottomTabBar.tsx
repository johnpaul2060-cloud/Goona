import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native'
import { router, usePathname } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg'

const { width: SCREEN_W } = Dimensions.get('window')
const TAB_ITEMS = ['Home', 'Feed', 'Records', 'Revenue', 'Recapt', 'Team']

const TAB_ROUTES = ['/(tabs)/dashboard', '/(tabs)/farm-feed', '/(tabs)/records', '/(tabs)/sales-revenue', '/(tabs)/recapitalization', '/(tabs)/team']

function TabIcon({ i, active }: { i: number; active: boolean }) {
  const c = active ? '#00695C' : '#94A3B8'
  const w = 1.6
  return (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      {i === 0 && <Path d="M3 10L12 3L21 10V21C21 21.6 20.6 22 20 22H16V16H8V22H4C3.4 22 3 21.6 3 21V10Z" stroke={c} strokeWidth={w} fill="none" />}
      {i === 1 && <><Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z" stroke={c} strokeWidth={w} fill="none" strokeLinejoin="round" /><Path d="M8 9h8M8 13h5" stroke={c} strokeWidth={w} strokeLinecap="round" /></>}
      {i === 2 && <><Rect x="5" y="4" width="14" height="17" rx="2" stroke={c} strokeWidth={w} fill="none" /><Line x1="8" y1="9" x2="16" y2="9" stroke={c} strokeWidth={w} strokeLinecap="round" /><Line x1="8" y1="13" x2="14" y2="13" stroke={c} strokeWidth={w} strokeLinecap="round" /></>}
      {i === 3 && <><Circle cx="12" cy="12" r="9" stroke={c} strokeWidth={w} fill="none" /><Line x1="9" y1="7.5" x2="9" y2="16.5" stroke={c} strokeWidth={w} strokeLinecap="round" /><Line x1="15" y1="7.5" x2="15" y2="16.5" stroke={c} strokeWidth={w} strokeLinecap="round" /><Line x1="7" y1="11.5" x2="17" y2="11.5" stroke={c} strokeWidth={w} strokeLinecap="round" /><Line x1="7" y1="14" x2="17" y2="14" stroke={c} strokeWidth={w} strokeLinecap="round" /></>}
      {i === 4 && <><Circle cx="12" cy="12" r="9" stroke={c} strokeWidth={w} fill="none" /><Path d="M12 4V6" stroke={c} strokeWidth={w} strokeLinecap="round" /><Path d="M8 9.5C8 8.7 8.7 8 9.5 8H14.5C15.3 8 16 8.7 16 9.5V10.5C16 11.3 15.3 12 14.5 12H9.5C8.7 12 8 12.7 8 13.5V14.5C8 15.3 8.7 16 9.5 16H14.5C15.3 16 16 15.3 16 14.5" stroke={c} strokeWidth={w} strokeLinecap="round" fill="none" /></>}
      {i === 5 && <><Circle cx="6" cy="8" r="2" stroke={c} strokeWidth={w} fill="none" /><Circle cx="12" cy="8" r="2" stroke={c} strokeWidth={w} fill="none" /><Circle cx="18" cy="8" r="2" stroke={c} strokeWidth={w} fill="none" /><Path d="M3 17c0-1.8 1.5-3 3-3s3 1.2 3 3" stroke={c} strokeWidth={w} fill="none" strokeLinecap="round" /><Path d="M9 17c0-1.8 1.5-3 3-3s3 1.2 3 3" stroke={c} strokeWidth={w} fill="none" strokeLinecap="round" /><Path d="M15 17c0-1.8 1.5-3 3-3s3 1.2 3 3" stroke={c} strokeWidth={w} fill="none" strokeLinecap="round" /></>}
    </Svg>
  )
}

export default function BottomTabBar({ hidden }: { hidden?: boolean }) {
  const pathname = usePathname()
  const insets = useSafeAreaInsets()

  const activeIndex = (() => {
    if (pathname.includes('farm-feed')) return 1
    if (pathname.includes('records')) return 2
    if (pathname.includes('sales-revenue')) return 3
    if (pathname.includes('recapitalization') || pathname.includes('plan-recapt')) return 4
    if (pathname.includes('team') || pathname.includes('settings') || pathname.includes('goona-iq') || pathname.includes('academy') || pathname.includes('farm-profile') || pathname.includes('device-management') || pathname.includes('permissions')) return 5
    return 0
  })()

  if (hidden) return null

  return (
    <View style={[styles.container, { bottom: insets.bottom > 0 ? insets.bottom - 4 : 18 }]}>
      {TAB_ITEMS.map((tab, i) => {
        const isActive = i === activeIndex
        return (
          <TouchableOpacity
            key={tab}
            style={[styles.navItem, isActive && styles.navItemActive]}
            activeOpacity={0.7}
            onPress={() => {
              const route = TAB_ROUTES[i]
              if (route && i !== activeIndex) router.navigate(route as any)
            }}
          >
            {isActive && <View style={styles.navActivePill} />}
            <View style={styles.navIcon}>
              <TabIcon i={i} active={isActive} />
            </View>
            <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{tab}</Text>
            {isActive && <View style={styles.navIndicator} />}
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute', left: 20, right: 20, height: 74,
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.82)', borderRadius: 30,
    shadowColor: '#000', shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.1, shadowRadius: 40,
    paddingHorizontal: 8,
    zIndex: 999, elevation: 999,
  },
  navItem: { alignItems: 'center', gap: 2, minWidth: 48, paddingVertical: 6, position: 'relative' },
  navIcon: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  navLabel: { fontSize: 11, fontWeight: '500', color: '#94A3B8', zIndex: 1 },
  navLabelActive: { color: '#00695C', fontWeight: '600' },
  navIndicator: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#AEEA00', zIndex: 1 },
  navActivePill: {
    position: 'absolute', top: 2, left: '50%',
    transform: [{ translateX: -20 }],
    width: 44, height: 36, borderRadius: 16, backgroundColor: '#2E7D32',
    shadowColor: '#00695C', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 24, elevation: 6,
    zIndex: 0,
  },
  navItemActive: {},
})
