import React, { useEffect } from 'react'
import {
  View, Text, TouchableOpacity, Pressable, ScrollView,
  StyleSheet, Dimensions,
} from 'react-native'
import Svg, { Path, Circle, Rect, Line, Defs, RadialGradient, Stop, Ellipse } from 'react-native-svg'
import { StatusBar } from 'expo-status-bar'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence,
  withTiming, withSpring, withDelay, FadeInUp, FadeIn,
} from 'react-native-reanimated'
import BottomDock from '../../components/navigation/BottomDock'

const { width: SCREEN_W } = Dimensions.get('window')

/* ─── Animated pulse dot ─── */
function PulseDot() {
  const opacity = useSharedValue(1)
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(0.3, { duration: 2000 }), withTiming(1, { duration: 2000 })),
      -1, true,
    )
  }, [])
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }))
  return <Animated.View style={[{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#AEEA00' }, style]} />
}

/* ─── Press scale hook ─── */
function usePressScale() {
  const scale = useSharedValue(1)
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
  return {
    style,
    onPressIn: () => { scale.value = withSpring(0.97, { damping: 15, stiffness: 200 }) },
    onPressOut: () => { scale.value = withSpring(1, { damping: 15, stiffness: 200 }) },
  }
}

/* ─── Worker Avatar ─── */
const waStyles = StyleSheet.create({
  wrap: { width: 44, height: 44, position: 'relative', marginRight: 14 },
  grad: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  initials: { color: '#fff', fontWeight: '700', fontSize: 16 },
  dotBase: {
    position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: 5,
    borderWidth: 2, borderColor: 'white',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
})
function WorkerAvatar({ initials, online }: { initials: string; online: boolean }) {
  return (
    <View style={waStyles.wrap}>
      <LinearGradient
        colors={['#0F172A', '#00695C']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={waStyles.grad}
      >
        <Text style={waStyles.initials}>{initials}</Text>
      </LinearGradient>
      <View style={[waStyles.dotBase, { backgroundColor: online ? '#22C55E' : '#94A3B8', shadowColor: online ? '#22C55E' : '#94A3B8' }]} />
    </View>
  )
}

/* ─── Quick Access Card ─── */
function QACard({
  variant, title, desc, tags, icon, onPress,
}: {
  variant: 'dark' | 'light'
  title: string
  desc: string
  tags: string[]
  icon: React.ReactNode
  onPress?: () => void
}) {
  const { style, onPressIn, onPressOut } = usePressScale()
  const isDark = variant === 'dark'
  return (
    <Animated.View style={[style, { flex: 1 }]}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[qaStyles.card, isDark ? qaStyles.dark : qaStyles.light]}
      >
        <View style={[qaStyles.icon, isDark ? qaStyles.iconDark : qaStyles.iconLight]}>
          {icon}
        </View>
        <Text style={[qaStyles.title, isDark ? qaStyles.titleWhite : qaStyles.titleDark]}>{title}</Text>
        <Text style={[qaStyles.desc, isDark ? qaStyles.descWhite : qaStyles.descDark]}>{desc}</Text>
        <View style={qaStyles.tags}>
          {tags.map((t) => (
            <View key={t} style={[
              qaStyles.tag,
              isDark ? qaStyles.tagDarkBg : qaStyles.tagLightBg,
            ]}>
              <Text style={[
                qaStyles.tagText,
                isDark ? qaStyles.tagTextWhite : qaStyles.tagTextDark,
              ]}>{t}</Text>
            </View>
          ))}
        </View>
      </Pressable>
    </Animated.View>
  )
}
const qaStyles = StyleSheet.create({
  card: { borderRadius: 28, padding: 18, overflow: 'hidden' },
  dark: { backgroundColor: '#0F172A' },
  light: { backgroundColor: 'white', borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)' },
  icon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  iconDark: { backgroundColor: 'rgba(255,255,255,0.06)' },
  iconLight: { backgroundColor: '#F1F5F9' },
  title: { fontWeight: '700', fontSize: 15, marginBottom: 3 },
  titleWhite: { color: '#fff' },
  titleDark: { color: '#1B1B1B' },
  desc: { fontSize: 11, lineHeight: 15, marginBottom: 10 },
  descWhite: { color: 'rgba(255,255,255,0.55)' },
  descDark: { color: '#64748B' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  tag: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 50 },
  tagDarkBg: { backgroundColor: 'rgba(255,255,255,0.06)' },
  tagLightBg: { backgroundColor: 'rgba(0,105,92,0.06)' },
  tagText: { fontSize: 8, fontWeight: '600' },
  tagTextWhite: { color: 'rgba(255,255,255,0.5)' },
  tagTextDark: { color: '#00695C' },
})

/* ─── Worker Card ─── */
function WorkerCard({
  initials, name, role, online, lastSeen, tags, index,
}: {
  initials: string; name: string; role: string; online: boolean
  lastSeen: string; tags: string[]; index: number
}) {
  return (
    <Animated.View
      entering={FadeInUp.duration(500).delay(500 + index * 80).springify()}
    >
      <TouchableOpacity style={wcStyles.card} activeOpacity={0.92}>
        <WorkerAvatar initials={initials} online={online} />
        <View style={wcStyles.info}>
          <Text style={wcStyles.name}>{name}</Text>
          <Text style={wcStyles.role}>{role}</Text>
          <Text style={[wcStyles.status, { color: online ? '#22C55E' : '#94A3B8' }]}>
            {online ? 'Online' : 'Offline'} &bull; {lastSeen}
          </Text>
          <View style={wcStyles.tags}>
            {tags.map((t) => (
              <View key={t} style={wcStyles.tag}>
                <Text style={wcStyles.tagText}>{t}</Text>
              </View>
            ))}
          </View>
        </View>
        <Text style={wcStyles.more}>{'\u22EE'}</Text>
      </TouchableOpacity>
    </Animated.View>
  )
}
const wcStyles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'white', borderRadius: 18, padding: 16,
    marginBottom: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03, shadowRadius: 24, elevation: 2,
  },
  info: { flex: 1 },
  name: { fontWeight: '600', fontSize: 14, color: '#1B1B1B' },
  role: { fontSize: 12, color: '#64748B', marginTop: 1 },
  status: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  tags: { flexDirection: 'row', gap: 4, flexWrap: 'wrap', marginTop: 4 },
  tag: {
    paddingVertical: 2, paddingHorizontal: 8, borderRadius: 50,
    backgroundColor: 'rgba(0,105,92,0.05)',
  },
  tagText: { fontSize: 9, fontWeight: '600', color: '#00695C' },
  more: { fontSize: 16, color: '#94A3B8', marginLeft: 4, padding: 4 },
})

/* ─── Insight Item ─── */
function InsightItem({ text, index }: { text: string; index: number }) {
  return (
    <Animated.View
      entering={FadeInUp.duration(500).delay(700 + index * 80).springify()}
      style={isStyles.item}
    >
      <Svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginTop: 1, flexShrink: 0 }}>
        <Path d="M8 2L9.5 6.5L14 8L9.5 9.5L8 14L6.5 9.5L2 8L6.5 6.5L8 2Z" stroke="#00695C" strokeWidth="1.2" strokeLinejoin="round" fill="rgba(0,105,92,0.08)" />
      </Svg>
      <Text style={isStyles.text}>{text}</Text>
    </Animated.View>
  )
}
const isStyles = StyleSheet.create({
  item: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: 'white', borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02, shadowRadius: 16, elevation: 1,
  },
  text: { fontSize: 13, lineHeight: 18, color: '#1B1B1B', flex: 1 },
})

/* ─── Hero Card ─── */
function HeroCard() {
  return (
    <Animated.View entering={FadeInUp.duration(600).delay(250).springify()}>
      <LinearGradient
        colors={['#00695C', '#0F766E', '#AEEA00']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={heroStyles.card}
      >
        {/* bg glow orbs */}
        <View style={heroStyles.glow1} pointerEvents="none" />
        <View style={heroStyles.glow2} pointerEvents="none" />

        <View style={heroStyles.label}>
          <PulseDot />
          <Text style={heroStyles.labelText}>TEAM OPERATIONS ACTIVE</Text>
        </View>

        <Text style={heroStyles.farmName}>Adewale Farms</Text>
        <Text style={heroStyles.subtext}>3 Workers &bull; 2 Active Batches &bull; 18 Tasks Today</Text>

        <View style={heroStyles.pills}>
          {[
            { label: 'Online Workers', value: '3' },
            { label: 'Accountability', value: '94%' },
            { label: 'Reminders', value: '4' },
            { label: 'Batch Health', value: '97%' },
          ].map((p) => (
            <View key={p.label} style={heroStyles.pill}>
              <Text style={heroStyles.pillLabel}>{p.label} </Text>
              <Text style={heroStyles.pillValue}>{p.value}</Text>
            </View>
          ))}
        </View>

        {/* network nodes */}
        <View style={heroStyles.nodes}>
          {[
            { label: 'CO', glow: true },
            null,
            { label: 'AF', glow: true },
            null,
            { label: 'KO', glow: false },
          ].map((n, i) =>
            n === null ? (
              <View key={`l${i}`} style={heroStyles.nodeLine} />
            ) : (
              <View key={n.label} style={heroStyles.node}>
                <Text style={heroStyles.nodeText}>{n.label}</Text>
                {n.glow && <View style={heroStyles.nodeGlow} />}
              </View>
            )
          )}
        </View>
      </LinearGradient>
    </Animated.View>
  )
}
const heroStyles = StyleSheet.create({
  card: {
    borderRadius: 34, padding: 28, marginTop: 20, overflow: 'hidden',
    shadowColor: '#00695C', shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.24, shadowRadius: 60, elevation: 8,
  },
  glow1: {
    position: 'absolute', top: '-40%', right: '-20%',
    width: 260, height: 260, borderRadius: 130,
    backgroundColor: 'rgba(174,234,0,0.10)',
  },
  glow2: {
    position: 'absolute', bottom: '-15%', left: '-10%',
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  label: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 50,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 5, paddingHorizontal: 14, marginBottom: 12,
  },
  labelText: {
    fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.5,
  },
  farmName: {
    fontWeight: '800', fontSize: 30, color: '#fff', lineHeight: 32,
    // Using the system font since Poppins may not be available
  },
  subtext: {
    fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2,
  },
  pills: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 14,
  },
  pill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 50,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 5, paddingHorizontal: 12,
  },
  pillLabel: { fontSize: 10, fontWeight: '500', color: 'rgba(255,255,255,0.7)' },
  pillValue: { fontSize: 10, fontWeight: '700', color: '#AEEA00' },
  nodes: {
    position: 'absolute', right: 14, top: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center',
  },
  node: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  nodeText: { fontSize: 8, fontWeight: '700', color: '#AEEA00' },
  nodeGlow: {
    position: 'absolute', top: -3, right: -3,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#22C55E',
    borderWidth: 2, borderColor: 'rgba(0,105,92,0.6)',
    shadowColor: '#22C55E', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6, shadowRadius: 8, elevation: 4,
  },
  nodeLine: { width: 1.5, height: 10, backgroundColor: 'rgba(255,255,255,0.12)' },
})

/* ─── Floating trust chips ─── */
function TrustChips() {
  const items: { label: string; style: Record<string, number>; icon: string }[] = [
    { label: 'Team Active', style: { top: 160, right: 10 }, icon: 'shield' },
    { label: '3 Online', style: { bottom: 320, left: 8 }, icon: 'sync' },
    { label: 'Coordinated', style: { bottom: 240, right: 12 }, icon: 'check' },
  ]
  return (
    <>
      {items.map((item) => {
        const iconPath = item.icon === 'shield'
          ? 'M7 2L4 4V8C4 10.5 7 12 7 12C7 12 10 10.5 10 8V4L7 2Z'
          : item.icon === 'sync'
            ? 'M3 7C3 4.5 5 3 7 3C8.5 3 9.5 3.5 10 4.5M11 7C11 9.5 9 11 7 11C5.5 11 4.5 10.5 4 9.5'
            : 'M10 3H4C2.9 3 2 3.9 2 5V9C2 10.1 2.9 11 4 11H10C11.1 11 12 10.1 12 9V5C12 3.9 11.1 3 10 3Z'
        const hasCheck = item.icon === 'check'
        return (
          <View
            key={item.label}
            style={[tcStyles.chip, item.style]}
            pointerEvents="none"
          >
            <Svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <Path d={iconPath} stroke="#00695C" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              {hasCheck && <Path d="M5 6L6.5 7.5L9.5 4.5" stroke="#00695C" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />}
            </Svg>
            <Text style={tcStyles.label}>{item.label}</Text>
          </View>
        )
      })}
    </>
  )
}
const tcStyles = StyleSheet.create({
  chip: {
    position: 'absolute', backgroundColor: 'white', borderRadius: 100,
    paddingVertical: 6, paddingHorizontal: 14,
    flexDirection: 'row', alignItems: 'center', gap: 7, zIndex: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 16, elevation: 3,
  },
  label: { fontSize: 11, fontWeight: '500', color: '#475569' },
})

/* ─── MAIN SCREEN ─── */
export default function TeamScreen() {
  const insets = useSafeAreaInsets()

  const w1 = useSharedValue(0)
  const w2 = useSharedValue(0)
  const r1 = useSharedValue(0)
  useEffect(() => {
    w1.value = withTiming(1, { duration: 1400 })
    w2.value = withDelay(800, withTiming(1, { duration: 1400 }))
    r1.value = withRepeat(
      withSequence(withTiming(0.5, { duration: 2000 }), withTiming(1, { duration: 2000 })),
      -1, true,
    )
  }, [])

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* ─── background decorations ─── */}
      <View style={styles.bgBlob} pointerEvents="none">
        <View style={styles.bgBlobInner} />
      </View>
      <View style={styles.bgGlowCenter} pointerEvents="none" />
      <View style={styles.bgDotGrid} pointerEvents="none">
        {Array.from({ length: 60 }).map((_, i) => (
          <View key={i} style={[styles.bgDot, {
            left: `${(i % 10) * 11 + 3}%`,
            top: `${Math.floor(i / 10) * 14 + 5}%`,
          }]} />
        ))}
      </View>

      {/* ─── trust chips ─── */}
      <TrustChips />

      {/* ─── background contours ─── */}
      <View style={styles.bgContour1} pointerEvents="none" />
      <View style={styles.bgContour2} pointerEvents="none" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollInner,
          { paddingBottom: 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── TOP NAV ─── */}
        <Animated.View entering={FadeInUp.duration(500).springify()} style={styles.topNav}>
          <TouchableOpacity style={styles.navBack} onPress={() => router.back()} activeOpacity={0.7}>
            <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <Path d="M15 18L9 12L15 6" stroke="#1B1B1B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          <View style={styles.navLogo}>
            <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <Path d="M12 2C12 2 7 8 7 12C7 14.5 8.5 17 10 18.5C9.5 17 9 16 9 15C9 11.5 11 7 12 2Z" fill="#00695C" />
              <Path d="M12 2C12 2 17 8 17 12C17 14.5 15.5 17 14 18.5C14.5 17 15 16 15 15C15 11.5 13 7 12 2Z" fill="#0F766E" />
            </Svg>
            <Text style={styles.navLogoText}>GOONA</Text>
          </View>
          <Text style={styles.navLabel}>Team Hub</Text>
        </Animated.View>

        {/* ─── HEADER ─── */}
        <Animated.View entering={FadeInUp.duration(500).delay(80).springify()} style={styles.headerSection}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Team</Text>
            <Text style={styles.headerSub}>Manage your operational ecosystem.</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.addBtn} activeOpacity={0.85}>
              <Text style={styles.addBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ─── HERO CARD ─── */}
        <HeroCard />

        {/* ─── QUICK ACCESS ─── */}
        <Animated.View entering={FadeInUp.duration(500).delay(350).springify()} style={styles.sectionHdr}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(400).springify()} style={styles.qaGrid}>
          <View style={styles.qaRow}>
            <QACard
              variant="dark"
              title="GOONA IQ"
              desc="AI forecasts, insights, and operational intelligence."
              tags={['Forecasts', 'AI Coach', 'Insights']}
              icon={
                <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: 'rgba(174,234,0,0.3)', alignItems: 'center', justifyContent: 'center' }}>
                  <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: 'rgba(174,234,0,0.3)' }} />
                </View>
              }
              onPress={() => router.push('/goona-iq' as any)}
            />
            <View style={{ width: 14 }} />
            <QACard
              variant="dark"
              title="Academy"
              desc="Train with realistic farm simulations."
              tags={['Simulations', 'Challenges', 'XP']}
              icon={
                <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <Rect x="3" y="6" width="14" height="10" rx="1.5" stroke="rgba(255,255,255,0.5)" strokeWidth="1.3" fill="none" />
                  <Path d="M7 6V4C7 3.4 7.4 3 8 3H12C12.6 3 13 3.4 13 4V6" stroke="rgba(255,255,255,0.5)" strokeWidth="1.3" fill="none" />
                  <Path d="M7 9H13M7 12H11" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" strokeLinecap="round" />
                </Svg>
              }
              onPress={() => router.push('/goona-academy')}
            />
          </View>
          <View style={{ height: 14 }} />
          <View style={styles.qaRow}>
            <QACard
              variant="light"
              title="Farm Profile"
              desc="Achievements, certifications, and farm identity."
              tags={['Badges', 'Rankings', 'Reputation']}
              icon={
                <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <Circle cx="10" cy="10" r="7" stroke="#00695C" strokeWidth="1.3" fill="none" />
                  <Path d="M7 10L9 12L13 8" stroke="#00695C" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </Svg>
              }
              onPress={() => router.push('/farm-profile')}
            />
            <View style={{ width: 14 }} />
            <QACard
              variant="light"
              title="Settings"
              desc="Notifications, security, sync, and preferences."
              tags={['Security', 'Offline', 'AI Prefs']}
              icon={
                <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <Circle cx="10" cy="10" r="2.5" stroke="#00695C" strokeWidth="1.3" fill="none" />
                  <Path d="M10 1.5V4M10 16V18.5M1.5 10H4M16 10H18.5M3.5 3.5L5.5 5.5M14.5 14.5L16.5 16.5M3.5 16.5L5.5 14.5M14.5 5.5L16.5 3.5" stroke="#00695C" strokeWidth="1.2" strokeLinecap="round" />
                </Svg>
              }
              onPress={() => router.push('/settings' as any)}
            />
          </View>
        </Animated.View>

        {/* ─── FARM TEAM ─── */}
        <Animated.View entering={FadeInUp.duration(500).delay(500).springify()} style={styles.sectionHdr}>
          <Text style={styles.sectionTitle}>Farm Team</Text>
        </Animated.View>

        <WorkerCard initials="CO" name="Chinedu Okoro" role="Senior Farmhand" online lastSeen="Last log 12 mins ago" tags={['Feed', 'Mortality', 'Records', 'Weight']} index={0} />
        <WorkerCard initials="AF" name="Aminat Fashola" role="Feed Specialist" online lastSeen="Last log 3 mins ago" tags={['Feed', 'Inventory', 'Records']} index={1} />
        <WorkerCard initials="KO" name="Kola Ogunleye" role="Veterinary Assistant" online={false} lastSeen="Last seen 4h ago" tags={['Health', 'Mortality', 'Records']} index={2} />

        {/* ─── INVITE CARD ─── */}
        <Animated.View entering={FadeInUp.duration(500).delay(700).springify()}>
          <LinearGradient
            colors={['#AEEA00', '#8BC300']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={invStyles.card}
          >
            <Text style={invStyles.title}>Expand Your Workforce</Text>
            <Text style={invStyles.sub}>Invite workers, supervisors, or consultants to your ecosystem.</Text>
            <View style={invStyles.acts}>
              <TouchableOpacity style={invStyles.btnPrimary} activeOpacity={0.85}>
                <Text style={invStyles.btnPrimaryText}>Share QR Invite</Text>
              </TouchableOpacity>
              <TouchableOpacity style={invStyles.btnSecondary} activeOpacity={0.85}>
                <Text style={invStyles.btnSecondaryText}>{'\uD83D\uDCAC'} WhatsApp Invite</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ─── INSIGHTS ─── */}
        <Animated.View entering={FadeInUp.duration(500).delay(700).springify()} style={[styles.sectionHdr, { marginTop: 24 }]}>
          <Text style={styles.sectionTitle}>GOONA IQ Insights</Text>
        </Animated.View>

        <View style={styles.insightsList}>
          <InsightItem
            text="Worker accountability improved by 14% this cycle."
            index={0}
          />
          <InsightItem
            text="Feed efficiency is above benchmark by 8%."
            index={1}
          />
          <InsightItem
            text="Your Academy score ranks top 12% in Oyo State."
            index={2}
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <BottomDock hidden={false} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9F5' },

  /* background */
  bgBlob: {
    position: 'absolute', top: -50, right: -50, width: 320, height: 320, zIndex: 0,
  },
  bgBlobInner: {
    width: 320, height: 320, borderRadius: 160,
    backgroundColor: 'rgba(0,105,92,0.08)',
  },
  bgGlowCenter: {
    position: 'absolute', top: '35%', left: '50%',
    width: 240, height: 240, marginLeft: -120, marginTop: -120,
    borderRadius: 120, zIndex: 0,
    backgroundColor: 'rgba(0,105,92,0.06)',
  },
  bgDotGrid: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, opacity: 0.5,
  },
  bgDot: {
    position: 'absolute', width: 2, height: 2,
    borderRadius: 1, backgroundColor: 'rgba(0,105,92,0.12)',
  },
  bgContour1: {
    position: 'absolute', top: '10%', right: '-15%',
    width: 380, height: 130, zIndex: 0,
    borderWidth: 1, borderColor: 'rgba(46,125,50,0.06)',
    borderTopLeftRadius: 190, borderTopRightRadius: 190,
    borderBottomWidth: 0,
    transform: [{ rotate: '10deg' }],
  },
  bgContour2: {
    position: 'absolute', bottom: '20%', left: '-10%',
    width: 300, height: 100, zIndex: 0,
    borderWidth: 1, borderColor: 'rgba(46,125,50,0.06)',
    borderBottomLeftRadius: 150, borderBottomRightRadius: 150,
    borderTopWidth: 0,
    transform: [{ rotate: '-8deg' }],
  },

  /* scroll */
  scroll: { flex: 1, zIndex: 1 },
  scrollInner: { paddingHorizontal: 24, paddingTop: 0 },

  /* top nav */
  topNav: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingTop: 54,
  },
  navBack: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  navLogo: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  navLogoText: { fontWeight: '700', fontSize: 14, color: '#1B1B1B' },
  navLabel: { fontSize: 14, fontWeight: '500', color: '#616161' },

  /* header */
  headerSection: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginTop: 20,
  },
  headerLeft: { flex: 1 },
  headerTitle: { fontWeight: '800', fontSize: 32, lineHeight: 36, color: '#1B1B1B' },
  headerSub: { fontSize: 14, color: '#64748B', marginTop: 1 },
  headerRight: { flexShrink: 0 },
  addBtn: {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
  },
  addBtnText: { fontSize: 24, color: '#1F2937', lineHeight: 26 },

  /* section header */
  sectionHdr: { marginTop: 24, marginBottom: 14 },
  sectionTitle: { fontWeight: '800', fontSize: 20, color: '#1B1B1B' },

  /* quick access grid */
  qaGrid: {},
  qaRow: { flexDirection: 'row' },

  /* insights list */
  insightsList: { gap: 8 },
})

/* ─── Invite card styles (separate from main styles) ─── */
const invStyles = StyleSheet.create({
  card: {
    borderRadius: 28, padding: 24, marginTop: 14,
    shadowColor: '#AEEA00', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15, shadowRadius: 36, elevation: 6,
  },
  title: { fontWeight: '700', fontSize: 17, color: '#1A2E00' },
  sub: { fontSize: 12, color: 'rgba(26,46,0,0.55)', marginTop: 2, marginBottom: 14 },
  acts: { flexDirection: 'row', gap: 8 },
  btnPrimary: {
    flex: 1, paddingVertical: 11, borderRadius: 14,
    backgroundColor: '#1A2E00', alignItems: 'center',
  },
  btnPrimaryText: { fontWeight: '600', fontSize: 12, color: '#fff' },
  btnSecondary: {
    flex: 1, paddingVertical: 11, borderRadius: 14,
    borderWidth: 1.5, borderColor: 'rgba(26,46,0,0.2)',
    alignItems: 'center',
  },
  btnSecondaryText: { fontWeight: '600', fontSize: 12, color: '#1A2E00' },
})


