import { useState } from 'react';
import {
  View, Text, TouchableOpacity, SafeAreaView, ScrollView, StyleSheet, Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import Svg, { Rect, Line } from 'react-native-svg';
import { ArrowLeft, CheckCircle, ArrowRight, Sparkles } from 'lucide-react-native';
import GoonaIcon from '../components/ui/GoonaIcon';

export default function FarmStructureScreen() {
  const [selected, setSelected] = useState<'solo' | 'team' | null>(null);

  const handleSolo = () => {
    router.replace('/(tabs)/dashboard');
  };

  const handleTeam = () => {
    Alert.alert('Team Setup', 'Team settings will be available in the next update.');
  };

  const handleSkip = () => {
    router.replace('/(tabs)/dashboard');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.bgGlow1} pointerEvents="none" />
      <View style={styles.bgGlow2} pointerEvents="none" />
      <View style={styles.bgContours1} pointerEvents="none" />
      <View style={styles.bgContours2} pointerEvents="none" />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollInner}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <GoonaIcon icon={ArrowLeft} size={24} color="#1F2937" />
          </TouchableOpacity>
          <View style={styles.progressPill}>
            <GoonaIcon icon={CheckCircle} size={12} color="#00695C" style={{ marginRight: 4 }} />
            <Text style={styles.progressPillText}>Setup</Text>
          </View>
        </View>

        <View style={styles.headerSection}>
          <Text style={styles.headerHeadline}>How Is Your Farm{"\n"}Operated?</Text>
          <Text style={styles.headerSub}>
            GOONA adapts your workflow based on how your farm is managed.
          </Text>
        </View>

        <View style={styles.optionsSection}>
          <TouchableOpacity
            style={[styles.optionCard, selected === 'solo' && styles.optionCardSelected]}
            onPress={() => setSelected('solo')}
            activeOpacity={0.95}
          >
            <View style={styles.optionIllustrationSolo}>
              <View style={styles.soloBadge}>
                <Text style={styles.soloBadgeText}>AI Ready</Text>
              </View>
              <View style={styles.soloFarmer}>
                <View style={styles.soloBody} />
                <View style={styles.soloHead}>
                  <View style={styles.soloCap} />
                </View>
              </View>
              <View style={styles.soloPhone}>
                <Rect x="1" y="1" width="12" height="18" rx="2" stroke="white" strokeWidth="0.8" fill="none" />
                <Line x1="7" y1="15" x2="7" y2="16" stroke="white" strokeWidth="0.8" strokeLinecap="round" />
              </View>
            </View>

            <Text style={styles.optionTitle}>Solo Farm</Text>
            <Text style={styles.optionDesc}>I manage farm operations myself.</Text>

            <View style={styles.optionTags}>
              <View style={styles.optionTag}><Text style={styles.optionTagText}>Simple Workflow</Text></View>
              <View style={styles.optionTag}><Text style={styles.optionTagText}>Personal Tracking</Text></View>
              <View style={styles.optionTag}><Text style={styles.optionTagText}>AI Assistance</Text></View>
            </View>

            <TouchableOpacity style={styles.soloBtn} onPress={handleSolo} activeOpacity={0.9}>
              <Text style={styles.optionBtnText}>Continue Solo</Text>
              <GoonaIcon icon={ArrowRight} size={18} color="white" />
            </TouchableOpacity>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionCard, selected === 'team' && styles.optionCardSelected]}
            onPress={() => setSelected('team')}
            activeOpacity={0.95}
          >
            <View style={styles.optionIllustrationTeam}>
              <View style={styles.teamRow}>
                <View style={styles.teamMember}>
                  <View style={styles.tmHead}><View style={[styles.tmCap, { backgroundColor: '#1B5E20' }]} /></View>
                  <View style={[styles.tmBody, { backgroundColor: '#2E7D32' }]} />
                </View>
                <View style={styles.teamMember}>
                  <View style={styles.tmHead}><View style={[styles.tmCap, { backgroundColor: '#1E40AF' }]} /></View>
                  <View style={[styles.tmBody, { backgroundColor: '#1A56FF' }]} />
                </View>
                <View style={styles.teamMember}>
                  <View style={styles.tmHead}><View style={[styles.tmCap, { backgroundColor: '#92400E' }]} /></View>
                  <View style={[styles.tmBody, { backgroundColor: '#D97706' }]} />
                </View>
              </View>
            </View>

            <Text style={styles.optionTitle}>Team-Based Farm</Text>
            <Text style={styles.optionDesc}>I work with workers, supervisors, or farmhands.</Text>

            <View style={styles.optionTags}>
              <View style={styles.optionTag}><Text style={styles.optionTagText}>Team Coordination</Text></View>
              <View style={styles.optionTag}><Text style={styles.optionTagText}>Worker Tasks</Text></View>
              <View style={styles.optionTag}><Text style={styles.optionTagText}>Operational Logs</Text></View>
              <View style={styles.optionTag}><Text style={styles.optionTagText}>Smart Reminders</Text></View>
            </View>

            <TouchableOpacity style={styles.teamBtn} onPress={handleTeam} activeOpacity={0.9}>
              <Text style={styles.optionBtnText}>Set Up Team</Text>
              <GoonaIcon icon={ArrowRight} size={18} color="white" />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>

        <View style={styles.iqCard}>
          <View style={styles.iqSparkle}>
            <GoonaIcon icon={Sparkles} size={20} color="#16A34A" />
          </View>
          <Text style={styles.iqText}>
            Most growing farms start <Text style={{ fontWeight: '700', color: '#00695C' }}>solo</Text> and expand into{' '}
            <Text style={{ fontWeight: '700', color: '#00695C' }}>team operations</Text> later. Both options are fully supported.
          </Text>
        </View>

        <View style={styles.bottomInfo}>
          <View style={styles.trustBadge}>
            <GoonaIcon icon={CheckCircle} size={14} color="#00695C" />
            <Text style={styles.trustBadgeText}>You can always add workers later from Team Settings.</Text>
          </View>
          <TouchableOpacity onPress={handleSkip}>
            <Text style={styles.skipLink}>Skip for Now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9F5' },
  scrollInner: { paddingHorizontal: 20, paddingBottom: 40, flexGrow: 1 },
  bgGlow1: {
    position: 'absolute', top: -100, right: -50, width: 340, height: 340,
    borderRadius: 170, backgroundColor: 'rgba(0,105,92,0.06)', zIndex: 0,
  },
  bgGlow2: {
    position: 'absolute', bottom: -80, left: -50, width: 280, height: 280,
    borderRadius: 140, backgroundColor: 'rgba(174,234,0,0.05)', zIndex: 0,
  },
  bgContours1: {
    position: 'absolute', width: 360, height: 120, top: '2%', left: '-15%',
    borderWidth: 1, borderColor: '#00695C', borderBottomWidth: 0,
    borderRadius: 180, opacity: 0.02, transform: [{ rotate: '3deg' }], zIndex: 0,
  },
  bgContours2: {
    position: 'absolute', width: 280, height: 100, bottom: '5%', right: '-15%',
    borderWidth: 1, borderColor: '#00695C', borderTopWidth: 0,
    borderRadius: 140, opacity: 0.02, transform: [{ rotate: '-5deg' }], zIndex: 0,
  },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    height: 56, paddingTop: 4, zIndex: 5,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  progressPill: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 6, paddingHorizontal: 16, borderRadius: 100,
    backgroundColor: 'rgba(174,234,0,0.15)', borderWidth: 1, borderColor: 'rgba(174,234,0,0.2)',
  },
  progressPillText: { fontSize: 12, fontWeight: '600', color: '#00695C', letterSpacing: 0.5 },
  headerSection: { alignItems: 'center', marginTop: 12, zIndex: 5 },
  headerHeadline: {
    fontSize: 34, fontWeight: '800', color: '#1F2937', textAlign: 'center',
    lineHeight: 40, letterSpacing: -0.5,
  },
  headerSub: { fontSize: 16, color: '#64748B', marginTop: 10, lineHeight: 24, textAlign: 'center', maxWidth: 320 },
  optionsSection: { marginTop: 28, gap: 20, zIndex: 5 },
  optionCard: {
    backgroundColor: 'white', borderRadius: 32, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.04, shadowRadius: 40, elevation: 4,
    borderWidth: 2, borderColor: 'transparent',
  },
  optionCardSelected: { borderColor: '#00695C' },
  optionIllustrationSolo: {
    height: 140, borderRadius: 20, backgroundColor: '#E8F5E9',
    alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden',
  },
  soloBadge: {
    position: 'absolute', left: 16, top: 16,
    backgroundColor: 'rgba(255,255,255,0.5)', paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 100,
  },
  soloBadgeText: { fontSize: 10, fontWeight: '700', color: '#16A34A' },
  soloFarmer: { alignItems: 'center', justifyContent: 'center' },
  soloBody: { width: 44, height: 56, borderRadius: 12, backgroundColor: '#2E7D32' },
  soloHead: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#D4A574',
    alignItems: 'center', marginBottom: -6,
  },
  soloCap: { width: 30, height: 10, borderRadius: 4, backgroundColor: '#1B5E20', marginTop: -2 },
  soloPhone: {
    position: 'absolute', right: 16, bottom: 24,
    width: 22, height: 32, borderRadius: 4, backgroundColor: '#1F2937',
    alignItems: 'center', justifyContent: 'center',
  },
  optionIllustrationTeam: {
    height: 140, borderRadius: 20, backgroundColor: '#E0F2FE',
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  teamRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  teamMember: { alignItems: 'center' },
  tmBody: { width: 32, height: 42, borderRadius: 8 },
  tmHead: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#D4A574', marginBottom: 2 },
  tmCap: { width: 22, height: 7, borderRadius: 3, marginTop: -1 },
  optionTitle: { fontSize: 24, fontWeight: '700', color: '#1F2937', marginTop: 18 },
  optionDesc: { fontSize: 15, color: '#64748B', marginTop: 4 },
  optionTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  optionTag: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 100,
    backgroundColor: '#F1F5F1',
  },
  optionTagText: { fontSize: 11, fontWeight: '500', color: '#1F2937' },
  soloBtn: {
    width: '100%', height: 54, borderRadius: 18,
    backgroundColor: '#2E7D32', flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, marginTop: 18,
    shadowColor: '#00695C', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2, shadowRadius: 32, elevation: 6,
  },
  teamBtn: {
    width: '100%', height: 54, borderRadius: 18,
    backgroundColor: '#0F766E', flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, marginTop: 18,
    shadowColor: '#0F766E', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2, shadowRadius: 32, elevation: 6,
  },
  optionBtnText: { fontSize: 16, fontWeight: '600', color: 'white' },
  iqCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#F0FDF4', borderRadius: 22, padding: 16,
    marginTop: 20, borderWidth: 1, borderColor: 'rgba(0,105,92,0.03)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 20, elevation: 1, zIndex: 5,
  },
  iqSparkle: {
    width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  iqText: { fontSize: 13, lineHeight: 19, color: '#1F2937', flex: 1 },
  bottomInfo: { alignItems: 'center', marginTop: 22, zIndex: 5 },
  trustBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 6, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  trustBadgeText: { fontSize: 12, color: '#64748B' },
  skipLink: { marginTop: 16, fontSize: 14, fontWeight: '500', color: '#94A3B8', padding: 8 },
});
