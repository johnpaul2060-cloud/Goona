import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { Icons } from '../../shared/icons';
import GoonaIcon from '../../components/ui/GoonaIcon';

export default function FarmStructureScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.blob} pointerEvents="none" />
      <View style={styles.contour1} pointerEvents="none" />
      <View style={styles.contour2} pointerEvents="none" />
      <View style={styles.glowCenter} pointerEvents="none" />

      <View style={styles.topNav}>
        <TouchableOpacity style={styles.navBack} onPress={() => router.back()}>
          <GoonaIcon icon={Icons.arrowLeft} size={24} color="#1B1B1B" />
        </TouchableOpacity>
        <View style={styles.navLogo}>
          <Svg width={18} height={18} viewBox="0 0 18 18">
            <Path d="M9 2L6 5V9C6 11.5 9 13 9 13C9 13 12 11.5 12 9V5L9 2Z" stroke="#2E7D32" strokeWidth="1.3" fill="none" />
            <Path d="M7.5 8L8.5 9L11 6.5" stroke="#2E7D32" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </Svg>
          <Text style={styles.navLogoText}>GOONA</Text>
        </View>
        <Text style={styles.navHelp}>Help</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.headerLabel}>STEP 3 OF 3</Text>
        <Text style={styles.headerTitle}>Farm{'\n'}Structure</Text>
        <Text style={styles.headerSub}>
          Set up your farm structure — pens, houses, and batch management.
        </Text>

        <View style={styles.progressRow}>
          <View style={[styles.progressDot, styles.progressDotActive]} />
          <View style={[styles.progressLine, styles.progressLineActive]} />
          <View style={[styles.progressDot, styles.progressDotActive]} />
          <View style={[styles.progressLine, styles.progressLineActive]} />
          <View style={[styles.progressDot, styles.progressDotActive]} />
        </View>

        <View style={styles.comingSoon}>
          <Text style={styles.comingTitle}>Coming Soon</Text>
          <Text style={styles.comingText}>
            Farm structure setup will be available in the next update.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.continueBtn}
          activeOpacity={0.95}
          onPress={() => router.push('/(tabs)')}
        >
          <Text style={styles.continueBtnText}>Go to Dashboard</Text>
          <GoonaIcon icon={Icons.arrowRight} size={18} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAF7' },
  blob: {
    position: 'absolute', top: -50, right: -50, width: 320, height: 320,
    borderRadius: 160, backgroundColor: 'rgba(232,245,233,0.45)', zIndex: 0,
  },
  contour1: {
    position: 'absolute', width: 380, height: 130, top: '10%', right: '-15%',
    borderWidth: 1, borderColor: '#2E7D32', borderBottomWidth: 0,
    borderTopLeftRadius: 190, borderTopRightRadius: 190, opacity: 0.04,
    transform: [{ rotate: '10deg' }], zIndex: 0,
  },
  contour2: {
    position: 'absolute', width: 300, height: 100, bottom: '20%', left: '-10%',
    borderWidth: 1, borderColor: '#2E7D32', borderTopWidth: 0,
    borderBottomLeftRadius: 150, borderBottomRightRadius: 150, opacity: 0.04,
    transform: [{ rotate: '-8deg' }], zIndex: 0,
  },
  glowCenter: {
    position: 'absolute', top: '38%', left: '50%', width: 240, height: 240,
    marginLeft: -120, marginTop: -120, borderRadius: 120,
    backgroundColor: 'rgba(232,245,233,0.30)', zIndex: 0,
  },
  topNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingTop: 16, zIndex: 5,
  },
  navBack: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  navLogo: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  navLogoText: { fontSize: 14, fontWeight: '700', color: '#1B1B1B' },
  navHelp: { fontSize: 14, fontWeight: '500', color: '#616161' },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 28 },
  headerLabel: {
    fontSize: 11, fontWeight: '600', color: '#2E7D32', letterSpacing: 2, textTransform: 'uppercase',
  },
  headerTitle: { fontSize: 32, fontWeight: '800', lineHeight: 40, color: '#1B1B1B', marginTop: 8 },
  headerSub: { fontSize: 15, lineHeight: 24, color: '#616161', marginTop: 8, maxWidth: 330 },
  progressRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: 24, gap: 6,
  },
  progressDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#D1D5DB' },
  progressDotActive: { width: 28, height: 10, borderRadius: 5, backgroundColor: '#2E7D32' },
  progressLine: { width: 32, height: 2, backgroundColor: '#D1D5DB', borderRadius: 1 },
  progressLineActive: { backgroundColor: '#2E7D32' },
  comingSoon: {
    backgroundColor: 'white', borderRadius: 28, padding: 24, marginTop: 24,
    alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06, shadowRadius: 20, elevation: 4,
  },
  comingTitle: {
    fontSize: 18, fontWeight: '700', color: '#2E7D32', marginBottom: 8,
  },
  comingText: {
    fontSize: 14, color: '#616161', textAlign: 'center', lineHeight: 22,
  },
  continueBtn: {
    width: '100%', height: 58, borderRadius: 18, backgroundColor: '#2E7D32',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, marginTop: 24,
    shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3, shadowRadius: 30, elevation: 6,
  },
  continueBtnText: { fontSize: 16, fontWeight: '600', color: 'white' },
});
