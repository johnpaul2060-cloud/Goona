import React from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Dimensions, Linking,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { router } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { ArrowLeft, Pencil, Star, CheckCircle, Plus, Download, Share2, Users, ClipboardList, ShieldCheck } from 'lucide-react-native'
import Animated, { FadeInUp } from 'react-native-reanimated'
import GoonaIcon from '../components/ui/GoonaIcon'
import BottomDock from '../components/navigation/BottomDock'

const { width: SCREEN_W } = Dimensions.get('window')

export default function FarmProfileScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.glowBg} pointerEvents="none" />
      <View style={styles.contour1} pointerEvents="none" />
      <View style={styles.contour2} pointerEvents="none" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollInner}
        showsVerticalScrollIndicator={false}
      >
        {/* APP BAR */}
        <Animated.View entering={FadeInUp.duration(500).springify()} style={styles.appBar}>
          <TouchableOpacity style={styles.appBack} activeOpacity={0.7} onPress={() => router.back()}>
            <GoonaIcon icon={ArrowLeft} size={22} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.appTitle}>Farm Profile</Text>
          <TouchableOpacity style={styles.appIconBtn} activeOpacity={0.85}>
            <GoonaIcon icon={Pencil} size={20} color="#1F2937" />
          </TouchableOpacity>
        </Animated.View>

        {/* HERO CARD */}
        <Animated.View entering={FadeInUp.duration(500).delay(80).springify()}>
          <LinearGradient
            colors={['#2E7D32', '#0F766E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroGl} pointerEvents="none" />
            <View style={styles.heroDots} pointerEvents="none" />
            <View style={[styles.heroCc, { width: 280, height: 90, top: -10, right: -30 }]} pointerEvents="none" />
            <View style={[styles.heroCc, { width: 200, height: 70, bottom: 10, left: -20 }]} pointerEvents="none" />

            <View style={styles.heroAvatar}>
              <Text style={styles.heroAvatarText}>AJ</Text>
            </View>
            <Text style={styles.heroName}>Adewale Farms</Text>
            <Text style={styles.heroSub}>Modern Livestock Production & Farm Operations</Text>
            <View style={styles.heroBadge}>
              <GoonaIcon icon={CheckCircle} size={14} color="white" />
              <Text style={styles.heroBadgeText}>Verified Farm Identity</Text>
            </View>

            <View style={styles.heroMetrics}>
              <View style={styles.heroMetric}>
                <Text style={styles.heroMetricVal}>3</Text>
                <Text style={styles.heroMetricLbl}>Workers</Text>
              </View>
              <View style={styles.heroMetric}>
                <Text style={styles.heroMetricVal}>2</Text>
                <Text style={styles.heroMetricLbl}>Active Batches</Text>
              </View>
              <View style={styles.heroMetric}>
                <Text style={styles.heroMetricVal}>₦4.8M</Text>
                <Text style={styles.heroMetricLbl}>Revenue</Text>
              </View>
              <View style={styles.heroMetric}>
                <Text style={styles.heroMetricVal}>94%</Text>
                <Text style={styles.heroMetricLbl}>Efficiency</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* FARM OWNERSHIP */}
        <Animated.View entering={FadeInUp.duration(500).delay(130).springify()}>
          <View style={styles.secHead}>
            <Text style={styles.secTitle}>Farm Ownership</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(160).springify()} style={styles.ownerCard}>
          <View style={styles.ownerAvatar}>
            <Text style={styles.ownerAvatarText}>AJ</Text>
          </View>
          <View style={styles.ownerInfo}>
            <Text style={styles.ownerName}>Adewale Johnson</Text>
            <Text style={styles.ownerRole}>Farm Owner & Operations Lead</Text>
            <View style={styles.ownerDetails}>
              <View style={styles.ownerDetailRow}>
                <Text style={styles.ownerDetailLbl}>Phone:</Text>
                <Text style={styles.ownerDetailVal}>+234 802 345 6789</Text>
              </View>
              <View style={styles.ownerDetailRow}>
                <Text style={styles.ownerDetailLbl}>Email:</Text>
                <Text style={styles.ownerDetailVal}>adewale@goona.ag</Text>
              </View>
              <View style={styles.ownerDetailRow}>
                <Text style={styles.ownerDetailLbl}>Reg ID:</Text>
                <Text style={styles.ownerDetailVal}>GOO-FRM-2024-001</Text>
              </View>
              <View style={styles.ownerDetailRow}>
                <Text style={styles.ownerDetailLbl}>Location:</Text>
                <Text style={styles.ownerDetailVal}>Oyo State, Nigeria</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* FARM OPERATIONS */}
        <Animated.View entering={FadeInUp.duration(500).delay(200).springify()}>
          <View style={styles.secHead}>
            <Text style={styles.secTitle}>Farm Operations</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(230).springify()} style={styles.opsGrid}>
          <View style={styles.opsCard}>
            <View style={[styles.opsIcon, { backgroundColor: '#E8F5E9' }]}>
              <GoonaIcon icon={Users} size={20} color="#2E7D32" />
            </View>
            <Text style={styles.opsTitle}>Livestock Types</Text>
            <Text style={styles.opsDetail}>Poultry, Layers, Broilers</Text>
          </View>
          <View style={styles.opsCard}>
            <View style={[styles.opsIcon, { backgroundColor: '#F0FDF4' }]}>
              <GoonaIcon icon={ClipboardList} size={20} color="#16A34A" />
            </View>
            <Text style={styles.opsTitle}>Active Batches</Text>
            <Text style={styles.opsDetail}>2 Cycles Running</Text>
          </View>
          <View style={styles.opsCard}>
            <View style={[styles.opsIcon, { backgroundColor: '#EEF3FF' }]}>
              <GoonaIcon icon={Users} size={20} color="#1A56FF" />
            </View>
            <Text style={styles.opsTitle}>Team Overview</Text>
            <Text style={styles.opsDetail}>3 Workers Online</Text>
            <View style={styles.opsAvatars}>
              <View style={[styles.opsAvatar, { backgroundColor: '#D4A574' }]}><Text style={styles.opsAvatarText}>CO</Text></View>
              <View style={[styles.opsAvatar, { backgroundColor: '#E8D5C4' }]}><Text style={styles.opsAvatarText}>AB</Text></View>
              <View style={[styles.opsAvatar, { backgroundColor: '#1A56FF' }]}><Text style={styles.opsAvatarText}>SA</Text></View>
            </View>
          </View>
          <View style={styles.opsCard}>
            <View style={[styles.opsIcon, { backgroundColor: '#F0FDF4' }]}>
              <GoonaIcon icon={ShieldCheck} size={20} color="#16A34A" />
            </View>
            <Text style={styles.opsTitle}>Offline Status</Text>
            <Text style={styles.opsDetail}>Fully Protected</Text>
          </View>
        </Animated.View>

        {/* BUSINESS PERFORMANCE */}
        <Animated.View entering={FadeInUp.duration(500).delay(280).springify()}>
          <View style={styles.secHead}>
            <Text style={styles.secTitle}>Business Performance</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(310).springify()} style={styles.perfCard}>
          <View style={styles.perfRow}>
            <Text style={styles.perfLabel}>Monthly Revenue</Text>
            <View style={styles.perfChart}>
              <View style={[styles.perfBar, { height: '40%', backgroundColor: '#E2E8E0' }]} />
              <View style={[styles.perfBar, { height: '55%', backgroundColor: '#E2E8E0' }]} />
              <View style={[styles.perfBar, { height: '70%', backgroundColor: '#16A34A' }]} />
              <View style={[styles.perfBar, { height: '85%', backgroundColor: '#16A34A' }]} />
            </View>
            <Text style={styles.perfVal}>₦1.2M</Text>
            <Text style={[styles.perfTrend, { color: '#16A34A' }]}>+18%</Text>
          </View>
          <View style={styles.perfDivider} />
          <View style={styles.perfRow}>
            <Text style={styles.perfLabel}>Batch Profitability</Text>
            <View style={styles.perfChart}>
              <View style={[styles.perfBar, { height: '30%', backgroundColor: '#E2E8E0' }]} />
              <View style={[styles.perfBar, { height: '45%', backgroundColor: '#E2E8E0' }]} />
              <View style={[styles.perfBar, { height: '60%', backgroundColor: '#F59E0B' }]} />
              <View style={[styles.perfBar, { height: '80%', backgroundColor: '#16A34A' }]} />
            </View>
            <Text style={styles.perfVal}>₦820k</Text>
            <Text style={[styles.perfTrend, { color: '#16A34A' }]}>+12%</Text>
          </View>
          <View style={styles.perfDivider} />
          <View style={styles.perfRow}>
            <Text style={styles.perfLabel}>Feed Efficiency</Text>
            <View style={styles.perfChart}>
              <View style={[styles.perfBar, { height: '50%', backgroundColor: '#E2E8E0' }]} />
              <View style={[styles.perfBar, { height: '60%', backgroundColor: '#E2E8E0' }]} />
              <View style={[styles.perfBar, { height: '75%', backgroundColor: '#2E7D32' }]} />
              <View style={[styles.perfBar, { height: '90%', backgroundColor: '#2E7D32' }]} />
            </View>
            <Text style={styles.perfVal}>87%</Text>
            <Text style={[styles.perfTrend, { color: '#16A34A' }]}>+8%</Text>
          </View>
          <View style={styles.perfDivider} />
          <View style={styles.perfRow}>
            <Text style={styles.perfLabel}>Mortality Reduction</Text>
            <View style={styles.perfChart}>
              <View style={[styles.perfBar, { height: '80%', backgroundColor: '#EF4444' }]} />
              <View style={[styles.perfBar, { height: '60%', backgroundColor: '#E2E8E0' }]} />
              <View style={[styles.perfBar, { height: '40%', backgroundColor: '#16A34A' }]} />
              <View style={[styles.perfBar, { height: '25%', backgroundColor: '#16A34A' }]} />
            </View>
            <Text style={styles.perfVal}>1.2%</Text>
            <Text style={[styles.perfTrend, { color: '#16A34A' }]}>-32%</Text>
          </View>
        </Animated.View>

        {/* FARM GALLERY */}
        <Animated.View entering={FadeInUp.duration(500).delay(360).springify()}>
          <View style={styles.secHead}>
            <Text style={styles.secTitle}>Farm Gallery</Text>
            <TouchableOpacity><Text style={styles.secLink}>View All</Text></TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(390).springify()} style={styles.galleryGrid}>
          <View style={[styles.galleryItem, styles.galleryItemTall]}><Text style={styles.galleryEmoji}>🐓</Text></View>
          <View style={styles.galleryItem}><Text style={styles.galleryEmoji}>🌿</Text></View>
          <View style={styles.galleryItem}><Text style={styles.galleryEmoji}>🥚</Text></View>
          <View style={styles.galleryItem}><Text style={styles.galleryEmoji}>👥</Text></View>
          <View style={styles.galleryItem}><Text style={styles.galleryEmoji}>🌾</Text></View>
          <TouchableOpacity style={[styles.galleryItem, styles.galleryAdd]} activeOpacity={0.7}>
            <GoonaIcon icon={Plus} size={20} color="#94A3B8" />
          </TouchableOpacity>
        </Animated.View>

        {/* TRUST & COMPLIANCE */}
        <Animated.View entering={FadeInUp.duration(500).delay(430).springify()} style={{ marginTop: 8 }}>
          <View style={styles.secHead}>
            <Text style={styles.secTitle}>Trust & Compliance</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(460).springify()}>
          <LinearGradient
            colors={['#E8F5E9', '#F0FDF4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.trustCard}
          >
            <Text style={styles.trustTitle}>Operational Trust & Compliance</Text>
            <View style={styles.trustGrid}>
              <View style={styles.trustItem}>
                <GoonaIcon icon={ShieldCheck} size={16} color="#16A34A" />
                <Text style={styles.trustText}>Verified Records</Text>
              </View>
              <View style={styles.trustItem}>
                <GoonaIcon icon={ShieldCheck} size={16} color="#2E7D32" />
                <Text style={styles.trustText}>Offline Protected</Text>
              </View>
              <View style={styles.trustItem}>
                <GoonaIcon icon={Download} size={16} color="#2E7D32" />
                <Text style={styles.trustText}>Financial Tracking</Text>
              </View>
              <View style={styles.trustItem}>
                <GoonaIcon icon={Users} size={16} color="#2E7D32" />
                <Text style={styles.trustText}>Team Accountability</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* GOONA IQ INSIGHTS */}
        <Animated.View entering={FadeInUp.duration(500).delay(500).springify()} style={{ marginTop: 8 }}>
          <View style={styles.secHead}>
            <Text style={styles.secTitle}>GOONA IQ Insights</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(530).springify()} style={[styles.insightCard, { backgroundColor: '#E8F5E9' }]}>
          <View style={styles.insightIcon}>
            <GoonaIcon icon={Star} size={16} color="#2E7D32" />
          </View>
          <Text style={styles.insightText}>
            Your poultry operation efficiency improved by <Text style={{ fontWeight: '700', color: '#2E7D32' }}>12%</Text> this cycle.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(560).springify()} style={[styles.insightCard, { backgroundColor: '#E3F2FD' }]}>
          <View style={styles.insightIcon}>
            <GoonaIcon icon={Star} size={16} color="#1A56FF" />
          </View>
          <Text style={styles.insightText}>
            GOONA predicts strong reinvestment readiness <Text style={{ fontWeight: '700', color: '#2E7D32' }}>next cycle</Text>.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(590).springify()} style={[styles.insightCard, { backgroundColor: '#FFFBEB' }]}>
          <View style={styles.insightIcon}>
            <GoonaIcon icon={Star} size={16} color="#F59E0B" />
          </View>
          <Text style={styles.insightText}>
            Mortality trend reduced by <Text style={{ fontWeight: '700', color: '#2E7D32' }}>8%</Text> this month.
          </Text>
        </Animated.View>

        {/* ACTIONS */}
        <Animated.View entering={FadeInUp.duration(500).delay(620).springify()} style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionPill, styles.actionPillPrimary]} activeOpacity={0.85} onPress={() => router.push('/create-batch')}>
            <GoonaIcon icon={Plus} size={14} color="white" />
            <Text style={styles.actionPillPrimaryText}>Edit Farm Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionPill} activeOpacity={0.85}>
            <GoonaIcon icon={Download} size={14} color="#1F2937" />
            <Text style={styles.actionPillText}>Export Report</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionPill} activeOpacity={0.85}>
            <GoonaIcon icon={Share2} size={14} color="#1F2937" />
            <Text style={styles.actionPillText}>Share Farm QR</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionPill} activeOpacity={0.85}>
            <GoonaIcon icon={CheckCircle} size={14} color="#1F2937" />
            <Text style={styles.actionPillText}>Manage Verification</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: 160 }} />
      </ScrollView>

      <BottomDock />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9F5' },

  glowBg: {
    position: 'absolute', top: -50, right: -40, width: 260, height: 260,
    borderRadius: 130, backgroundColor: 'rgba(232,245,233,0.25)', zIndex: 0,
  },
  contour1: {
    position: 'absolute', width: 350, height: 110, top: '5%', left: '-10%',
    borderWidth: 1, borderColor: '#2E7D32', borderBottomWidth: 0,
    borderTopLeftRadius: 175, borderTopRightRadius: 175, opacity: 0.04,
    transform: [{ rotate: '6deg' }], zIndex: 0,
  },
  contour2: {
    position: 'absolute', width: 280, height: 90, bottom: '15%', right: '-10%',
    borderWidth: 1, borderColor: '#2E7D32', borderTopWidth: 0,
    borderBottomLeftRadius: 140, borderBottomRightRadius: 140, opacity: 0.04,
    transform: [{ rotate: '-8deg' }], zIndex: 0,
  },

  scroll: { flex: 1, zIndex: 1 },
  scrollInner: { paddingHorizontal: 16, paddingBottom: 20 },

  /* app bar */
  appBar: {
    flexDirection: 'row', alignItems: 'center', paddingTop: 6, paddingBottom: 2, zIndex: 1,
  },
  appBack: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  appTitle: { fontFamily: 'Poppins', fontWeight: '700', fontSize: 20, color: '#1F2937', flex: 1, marginLeft: 12 },
  appIconBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2,
  },

  /* hero */
  heroCard: {
    borderRadius: 36, padding: 28, marginTop: 12, position: 'relative', overflow: 'hidden',
    shadowColor: '#0F766E', shadowOffset: { width: 0, height: 24 }, shadowOpacity: 0.28, shadowRadius: 55, elevation: 10,
  },
  heroGl: {
    position: 'absolute', top: -20, right: -20, width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.08)', pointerEvents: 'none',
  },
  heroDots: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.04, zIndex: 0,
  },
  heroCc: { position: 'absolute', borderRadius: 50, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  heroAvatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#D4A574', alignItems: 'center', justifyContent: 'center', zIndex: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 3,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.2)',
  },
  heroAvatarText: { fontSize: 28, fontWeight: '800', color: 'white' },
  heroName: { fontFamily: 'Poppins', fontWeight: '800', fontSize: 32, color: 'white', zIndex: 1, letterSpacing: -0.5, marginTop: 4 },
  heroSub: { fontSize: 15, fontWeight: '400', color: 'rgba(255,255,255,0.75)', zIndex: 1, marginTop: -2 },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    paddingVertical: 5, paddingHorizontal: 14, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    marginTop: 10, zIndex: 1,
  },
  heroBadgeText: { fontSize: 12, fontWeight: '500', color: 'white' },
  heroMetrics: { flexDirection: 'row', gap: 8, marginTop: 20, zIndex: 1 },
  heroMetric: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16,
    paddingVertical: 12, paddingHorizontal: 6, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  heroMetricVal: { fontSize: 18, fontWeight: '800', color: 'white' },
  heroMetricLbl: { fontSize: 9, color: 'rgba(255,255,255,0.6)', marginTop: 1, textAlign: 'center' },

  /* section */
  secHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 14 },
  secTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  secLink: { fontSize: 13, fontWeight: '500', color: '#2E7D32' },

  /* owner */
  ownerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: 'white', borderRadius: 28, padding: 22,
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.05, shadowRadius: 35, elevation: 4,
  },
  ownerAvatar: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#D4A574', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  ownerAvatarText: { fontSize: 22, fontWeight: '800', color: 'white' },
  ownerInfo: { flex: 1 },
  ownerName: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  ownerRole: { fontSize: 13, color: '#64748B', marginTop: -1 },
  ownerDetails: { gap: 6, marginTop: 12 },
  ownerDetailRow: { flexDirection: 'row', gap: 4 },
  ownerDetailLbl: { fontSize: 12, color: '#94A3B8' },
  ownerDetailVal: { fontSize: 12, color: '#475569', flex: 1 },

  /* operations */
  opsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  opsCard: {
    width: (SCREEN_W - 44) / 2, backgroundColor: 'white', borderRadius: 24,
    padding: 18, paddingBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 30, elevation: 3,
  },
  opsIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  opsTitle: { fontSize: 14, fontWeight: '600', color: '#1F2937', marginTop: 10 },
  opsDetail: { fontSize: 12, color: '#64748B', marginTop: 2 },
  opsAvatars: { flexDirection: 'row', marginTop: 8 },
  opsAvatar: {
    width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'white', marginRight: -6,
  },
  opsAvatarText: { fontSize: 10, fontWeight: '600', color: 'white' },

  /* performance */
  perfCard: {
    backgroundColor: 'white', borderRadius: 28, padding: 22,
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.05, shadowRadius: 35, elevation: 4,
  },
  perfRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  perfDivider: { height: 1, backgroundColor: '#F1F5F9' },
  perfLabel: { flex: 1, fontSize: 14, fontWeight: '500', color: '#1F2937' },
  perfChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 20, marginRight: 12 },
  perfBar: { width: 4, borderRadius: 2 },
  perfVal: { fontSize: 14, fontWeight: '700', color: '#1F2937', minWidth: 50, textAlign: 'right' },
  perfTrend: { fontSize: 12, fontWeight: '600', minWidth: 40, textAlign: 'right' },

  /* gallery */
  galleryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  galleryItem: {
    width: (SCREEN_W - 48) / 3, height: 90, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8F9F5',
  },
  galleryItemTall: { height: 188 },
  galleryEmoji: { fontSize: 24 },
  galleryAdd: { borderWidth: 2, borderStyle: 'dashed', borderColor: '#CBD5E1', backgroundColor: 'transparent' },

  /* trust */
  trustCard: {
    borderRadius: 30, padding: 24,
    borderWidth: 1, borderColor: 'rgba(46,125,50,0.06)',
    shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 24, elevation: 2,
  },
  trustTitle: { fontSize: 17, fontWeight: '700', color: '#1F2937' },
  trustGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  trustItem: { width: (SCREEN_W - 64) / 2, flexDirection: 'row', alignItems: 'center', gap: 8 },
  trustText: { fontSize: 13, color: '#475569' },

  /* insight */
  insightCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    borderRadius: 24, padding: 18, marginBottom: 10,
  },
  insightIcon: {
    width: 38, height: 38, borderRadius: 12, backgroundColor: 'white',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },
  insightText: { fontSize: 13, lineHeight: 20, color: '#1F2937', flex: 1 },

  /* actions */
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8, paddingBottom: 8 },
  actionPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 10, paddingHorizontal: 20, borderRadius: 100,
    backgroundColor: 'white', borderWidth: 1, borderColor: '#E2E8F0',
  },
  actionPillPrimary: {
    backgroundColor: '#2E7D32', borderColor: 'transparent',
    shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 14, elevation: 4,
  },
  actionPillPrimaryText: { fontSize: 13, fontWeight: '500', color: 'white' },
  actionPillText: { fontSize: 13, fontWeight: '500', color: '#1F2937' },
})


