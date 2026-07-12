import React, { useEffect, useRef } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Dimensions, Share, Animated as RNAnimated,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import GoonaIcon from '../components/ui/GoonaIcon'
import { Icons } from '../shared/icons'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence,
  withTiming, withSpring, FadeInUp,
} from 'react-native-reanimated'

const { width: SW } = Dimensions.get('window')
const HP = 24

/* ─── HELPERS ─── */

function usePressScale(scaleTo = 0.97) {
  const scale = useSharedValue(1)
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
  return {
    style, onPressIn: () => { scale.value = withSpring(scaleTo, { damping: 15, stiffness: 200 }) },
    onPressOut: () => { scale.value = withSpring(1, { damping: 15, stiffness: 200 }) },
  }
}

function PulseDot({ color = '#EF4444', size = 5 }: { color?: string; size?: number }) {
  const opacity = useSharedValue(1)
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(0.3, { duration: 2000 }), withTiming(1, { duration: 2000 })),
      -1, true,
    )
  }, [])
  const aStyle = useAnimatedStyle(() => ({ opacity: opacity.value }))
  return <Animated.View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }, aStyle]} />
}

function OfflineBadge() {
  return (
    <View style={obStyles.badge}>
      <GoonaIcon icon={Icons.cloudOff} size={11} color="#2E7D32" />
      <Text style={obStyles.text}>Offline-ready</Text>
    </View>
  )
}
const obStyles = StyleSheet.create({
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(46,125,50,0.10)',
    paddingVertical: 5, paddingHorizontal: 10, borderRadius: 50,
  },
  text: { fontSize: 10, fontWeight: '600', color: '#2E7D32', letterSpacing: 0.2 },
})

function SectionHeader({ title, tag, tagStyle }: { title: string; tag?: string; tagStyle?: any }) {
  return (
    <View style={shStyles.row}>
      <Text style={shStyles.title}>{title}</Text>
      {tag && <Text style={[shStyles.tag, tagStyle]}>{tag}</Text>}
    </View>
  )
}
const shStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 28, marginBottom: 14 },
  title: { fontSize: 17, fontWeight: '700', color: '#15291A' },
  tag: { fontSize: 12, fontWeight: '600', color: '#8A988C' },
})

/* ─── CONSTANTS ─── */

const GAME_CARDS = [
  {
    key: 'sim', title: 'Live Simulation',
    desc: 'Run realistic poultry cycles with GOONA IQ coaching.',
    colors: ['#1E7A3D', '#3E9A3A'] as const,
    icon: '\u{1F413}', route: '/live-simulation' as const,
  },
  {
    key: 'tycoon', title: 'Farm Tycoon',
    desc: 'Build and grow your agribusiness empire.',
    colors: ['#0F3D2E', '#1F6F4A', '#3E9A3A'] as const,
    icon: '\u{1F3ED}', route: '/goona-academy-tycoon' as const,
  },
  {
    key: 'challenge', title: 'Challenges',
    desc: 'Test your knowledge and earn rewards.',
    colors: ['#B45309', '#E07B1A', '#F2A93B'] as const,
    icon: '\u{1F9E0}', route: '/goona-academy-challenges' as const,
  },
] as const

const LEADERBOARD = [
  { rank: 1, name: 'Adewale Farms', detail: '98% survival rate', region: 'Western', isYou: false },
  { rank: 2, name: 'GreenNest Farms', detail: '42% profit margin', region: 'Eastern', isYou: false },
  { rank: 3, name: 'Ifeanyi Poultry', detail: 'Lowest mortality record', region: 'Central', isYou: false },
  { rank: 7, name: 'You', detail: '94% survival \u00B7 climbing', region: 'Lagos', isYou: true },
]

const RANK_COLORS: Record<number, string> = { 1: '#F59E0B', 2: '#94A3B8', 3: '#CD7F32' }

/* ─── 1 · PROGRESS HERO ─── */

function ProgressHero() {
  const xpAnim = useRef(new RNAnimated.Value(0)).current
  useEffect(() => {
    RNAnimated.timing(xpAnim, { toValue: 72, duration: 1200, useNativeDriver: false }).start()
  }, [])
  const xpWidth = xpAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] })

  const handleShare = () => {
    Share.share({
      message:
        'I\u2019m a Certified Poultry Strategist on GOONA!\n' +
        'Survival: 94% \u00B7 Profit: +42% \u00B7 Streak: 5 days\n' +
        'Think you can beat my score?',
    })
  }

  return (
    <Animated.View entering={FadeInUp.duration(500).springify()} style={phStyles.card}>
      <View style={phStyles.glow1} pointerEvents="none" />
      <View style={phStyles.glow2} pointerEvents="none" />

      <View style={phStyles.top}>
        <LinearGradient
          colors={['#AEEA00', '#D4FF4D']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={phStyles.seal}
        >
          <Text style={phStyles.sealText}>{'\u{1F3C6}'}</Text>
        </LinearGradient>
        <View style={phStyles.id}>
          <Text style={phStyles.rank}>Strategist \u00B7 Lv 8</Text>
          <View style={phStyles.certRow}>
            <GoonaIcon icon={Icons.star} size={11} color="#D4FF4D" />
            <Text style={phStyles.certText}>Certified Poultry Strategist \u00B7 May 2026</Text>
          </View>
        </View>
        <TouchableOpacity activeOpacity={0.7} onPress={handleShare} style={phStyles.shareBtn}>
          <GoonaIcon icon={Icons.share2} size={17} color="white" />
        </TouchableOpacity>
      </View>

      <View style={phStyles.xpSection}>
        <View style={phStyles.xpRow}>
          <Text style={phStyles.xpLabel}>2,880 / 4,000 XP to Level 9</Text>
          <Text style={phStyles.xpPct}>72%</Text>
        </View>
        <View style={phStyles.bar}>
          <RNAnimated.View style={[phStyles.barFill, { width: xpWidth }]} />
        </View>
      </View>

      <View style={phStyles.statsRow}>
        <View style={phStyles.stat}>
          <Text style={phStyles.statV}>94%</Text>
          <Text style={phStyles.statL}>Survival</Text>
        </View>
        <View style={phStyles.stat}>
          <Text style={phStyles.statV}>+42%</Text>
          <Text style={phStyles.statL}>Profit</Text>
        </View>
        <View style={phStyles.stat}>
          <View style={phStyles.streakRow}>
            <Text style={phStyles.statV}>5</Text>
            <Text style={phStyles.fire}>{'\u{1F525}'}</Text>
          </View>
          <Text style={phStyles.statL}>Day Streak</Text>
        </View>
      </View>

      <View style={phStyles.badges}>
        {['\u{1F3C5} Mortality Strategist', '\u{1F33E} Feed Optimizer', '\u{1F6E1}\uFE0FCrisis Manager'].map(
          (b) => (
            <View key={b} style={phStyles.badge}>
              <Text style={phStyles.badgeText}>{b}</Text>
            </View>
          ),
        )}
      </View>
    </Animated.View>
  )
}

const phStyles = StyleSheet.create({
  card: {
    borderRadius: 28, padding: 22, overflow: 'hidden', marginTop: 18,
    backgroundColor: '#1E7A3D',
    shadowColor: '#1E7A3D', shadowOffset: { width: 0, height: 22 }, shadowOpacity: 0.32, shadowRadius: 50, elevation: 8,
  },
  glow1: { position: 'absolute', top: '-50%', right: '-25%', width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(174,234,0,0.22)' },
  glow2: { position: 'absolute', bottom: '-30%', left: '-15%', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.06)' },
  top: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  seal: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#AEEA00', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 4 },
  sealText: { fontSize: 24 },
  id: { flex: 1 },
  rank: { fontSize: 19, fontWeight: '800', color: '#fff' },
  certRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  certText: { fontSize: 11, color: 'rgba(255,255,255,0.78)' },
  shareBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  xpSection: { marginTop: 16 },
  xpRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 7 },
  xpLabel: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
  xpPct: { fontSize: 13, fontWeight: '700', color: '#D4FF4D' },
  bar: { height: 7, backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 10, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 10, backgroundColor: '#AEEA00', shadowColor: '#AEEA00', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 14 },
  statsRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  stat: { flex: 1, backgroundColor: 'rgba(255,255,255,0.10)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 14, paddingVertical: 11, paddingHorizontal: 10, alignItems: 'center' },
  statV: { fontSize: 17, fontWeight: '800', color: '#D4FF4D' },
  statL: { fontSize: 9.5, color: 'rgba(255,255,255,0.6)', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.4 },
  streakRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  fire: { fontSize: 14 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 14 },
  badge: { backgroundColor: 'rgba(255,255,255,0.09)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 50 },
  badgeText: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.82)' },
})

/* ─── 2 · GAME CARD ─── */

function GameCard({
  title, desc, colors, icon, route, index,
}: {
  title: string; desc: string; colors: readonly string[]; icon: string; route: string; index: number
}) {
  const ps = usePressScale()

  return (
    <Animated.View
      entering={FadeInUp.duration(500).delay(100 + index * 80).springify()}
      style={ps.style}
    >
      <TouchableOpacity activeOpacity={0.85} onPress={() => router.push(route as any)}>
        <LinearGradient
          colors={colors as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={gcStyles.card}
        >
          <View style={gcStyles.body}>
            <View style={gcStyles.iconRow}>
              <Text style={gcStyles.icon}>{icon}</Text>
              <View style={gcStyles.textBlock}>
                <Text style={gcStyles.title}>{title}</Text>
                <Text style={gcStyles.desc}>{desc}</Text>
              </View>
            </View>
            <GoonaIcon icon={Icons.chevronRight} size={16} color="rgba(255,255,255,0.7)" />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  )
}

const gcStyles = StyleSheet.create({
  card: {
    borderRadius: 22, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.14, shadowRadius: 24, elevation: 4,
  },
  body: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconRow: { flexDirection: 'row', alignItems: 'center', gap: 13, flex: 1 },
  icon: { fontSize: 28 },
  textBlock: { flex: 1 },
  title: { fontSize: 14, fontWeight: '700', color: '#fff' },
  desc: { fontSize: 11, color: 'rgba(255,255,255,0.72)', lineHeight: 16, marginTop: 2 },
})

/* ─── 3 · COACH MESSAGE ─── */

function CoachMsg({ text, index }: { text: string; index: number }) {
  const boldParts = text.split(/(<b>|<\/b>)/g)
  const rendered = boldParts.map((p, i) => {
    if (p === '<b>' || p === '</b>') return null
    const prev = boldParts[i - 1]
    const next = boldParts[i + 1]
    const isBold = prev === '<b>' || next === '</b>'
    return <Text key={i} style={isBold ? { color: '#2E7D32', fontWeight: '700' } : undefined}>{p}</Text>
  })
  return (
    <Animated.View entering={FadeInUp.duration(400).delay(100 + index * 80).springify()} style={cmStyles.row}>
      <LinearGradient colors={['#2E7D32', '#AEEA00']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={cmStyles.avatar}>
        <Text style={cmStyles.avatarText}>G</Text>
      </LinearGradient>
      <View style={cmStyles.bubble}>
        <Text style={cmStyles.text}>{rendered}</Text>
      </View>
    </Animated.View>
  )
}

const cmStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: 9 },
  avatar: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', shadowColor: '#AEEA00', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.18, shadowRadius: 14, elevation: 3 },
  avatarText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  bubble: { backgroundColor: 'white', borderRadius: 16, borderBottomLeftRadius: 5, padding: 12, fontSize: 13, lineHeight: 19.5, color: '#2A3A2C', flex: 1, shadowColor: '#142819', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 16, elevation: 1 },
  text: { fontSize: 13, lineHeight: 19.5, color: '#2A3A2C' },
})

/* ─── 4 · LEADERBOARD ROW ─── */

function LBRow({ rank, name, detail, region, isYou, index }: {
  rank: number; name: string; detail: string; region: string; isYou: boolean; index: number
}) {
  const rankColor = RANK_COLORS[rank] || '#B8C2BA'
  return (
    <Animated.View
      entering={FadeInUp.duration(400).delay(100 + index * 60).springify()}
      style={[lbStyles.row, isYou && lbStyles.rowYou]}
    >
      <Text style={[lbStyles.rank, { color: rankColor }]}>{rank}</Text>
      <View style={lbStyles.info}>
        <Text style={lbStyles.name}>{name}</Text>
        <Text style={lbStyles.detail}>{detail}</Text>
      </View>
      <Text style={lbStyles.region}>{region}</Text>
    </Animated.View>
  )
}

const lbStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'white', borderRadius: 16, padding: 12, paddingHorizontal: 14, marginBottom: 8, shadowColor: '#142819', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 18, elevation: 1 },
  rowYou: { backgroundColor: '#F6F9F4', borderWidth: 1.5, borderColor: 'rgba(46,125,50,0.18)' },
  rank: { fontSize: 16, fontWeight: '800', width: 26, textAlign: 'center' },
  info: { flex: 1 },
  name: { fontSize: 13, fontWeight: '600', color: '#15291A' },
  detail: { fontSize: 11, color: '#8A988C', marginTop: 1 },
  region: { fontSize: 9, fontWeight: '600', backgroundColor: 'rgba(46,125,50,0.06)', color: '#2E7D32', paddingVertical: 3, paddingHorizontal: 9, borderRadius: 50, overflow: 'hidden' },
})

/* ─── MAIN SCREEN ─── */

export default function GoonaAcademyScreen() {
  const insets = useSafeAreaInsets()

  return (
    <View style={s.container}>
      <StatusBar style="dark" />

      {/* Ambient glow */}
      <View style={s.glow} pointerEvents="none" />
      <View style={s.dotGrid} pointerEvents="none">
        {Array.from({ length: 24 }).map((_, i) => (
          <View key={i} style={[s.dot, { left: `${(i % 6) * 17 + 5}%`, top: `${Math.floor(i / 6) * 22 + 8}%` }]} />
        ))}
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollInner, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 130 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── TOP NAV ─── */}
        <Animated.View entering={FadeInUp.duration(500).springify()} style={s.topNav}>
          <TouchableOpacity onPress={() => router.navigate('/(tabs)/team')} style={s.navBack} activeOpacity={0.7}>
            <GoonaIcon icon={Icons.arrowLeft} size={22} color="#15291A" />
          </TouchableOpacity>
          <View style={s.navLogo}>
            <GoonaIcon icon={Icons.sprout} size={20} color="#2E7D32" />
            <Text style={s.navLogoText}>GOONA</Text>
          </View>
          <OfflineBadge />
        </Animated.View>

        {/* ─── HEADER ─── */}
        <Animated.View entering={FadeInUp.duration(500).delay(50).springify()} style={s.header}>
          <Text style={s.eyebrow}>Play & Learn</Text>
          <Text style={s.title}>GOONA Academy</Text>
          <Text style={s.sub}>
            Master poultry farming through simulations, challenges, and growth tools.
          </Text>
        </Animated.View>

        {/* 1 · PROGRESS HERO */}
        <ProgressHero />

        {/* 2 · GAMES */}
        <SectionHeader title="Games" tag="Play" />
        {GAME_CARDS.map((game, i) => (
          <GameCard
            key={game.key}
            title={game.title}
            desc={game.desc}
            colors={game.colors}
            icon={game.icon}
            route={game.route}
            index={i}
          />
        ))}

        {/* 3 · COACH INSIGHTS */}
        <SectionHeader title="Coach insights" tag="GOONA IQ" />
        <CoachMsg text="Your mortality rate beats <b>82%</b> of simulated farms this cycle." index={0} />
        <CoachMsg text="Feed conversion is above benchmark \u2014 you\u2019re in the <b>top 15%</b> of operators." index={1} />

        {/* 4 · LEADERBOARD */}
        <SectionHeader title="Top operators" tag="This season" />
        {LEADERBOARD.map((item, i) => (
          <LBRow key={item.name} rank={item.rank} name={item.name} detail={item.detail} region={item.region} isYou={item.isYou} index={i} />
        ))}

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9F5' },
  glow: { position: 'absolute', top: -60, right: -60, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(174,234,0,0.08)', zIndex: 0 },
  dotGrid: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, opacity: 0.4 },
  dot: { position: 'absolute', width: 2, height: 2, borderRadius: 1, backgroundColor: 'rgba(46,125,50,0.1)' },
  scroll: { flex: 1, zIndex: 2 },
  scrollInner: { paddingHorizontal: HP },

  topNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navBack: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  navLogo: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  navLogoText: { fontWeight: '700', fontSize: 14, color: '#1B1B1B' },

  header: { marginTop: 24 },
  eyebrow: { fontSize: 11, fontWeight: '700', color: '#2E7D32', letterSpacing: 1.8, textTransform: 'uppercase' },
  title: { fontSize: 28, fontWeight: '800', color: '#15291A', marginTop: 6 },
  sub: { fontSize: 13.5, color: '#5C6B5E', lineHeight: 20, marginTop: 6, maxWidth: 300 },
})
