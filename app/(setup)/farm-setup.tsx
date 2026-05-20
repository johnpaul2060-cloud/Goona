import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, SafeAreaView,
  ScrollView, KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import Svg, { Path, Circle, Line } from 'react-native-svg';

function BackIcon() {
  return (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <Path d="M15 18L9 12L15 6" stroke="#1B1B1B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export default function FarmSetupScreen() {
  const [farmName, setFarmName] = useState('');
  const [location, setLocation] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.blob} pointerEvents="none" />
      <View style={styles.contour1} pointerEvents="none" />
      <View style={styles.contour2} pointerEvents="none" />
      <View style={styles.glowCenter} pointerEvents="none" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollInner}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topNav}>
            <TouchableOpacity style={styles.navBack} onPress={() => router.back()}>
              <BackIcon />
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

          <View style={styles.headerSection}>
            <Text style={styles.headerLabel}>STEP 2 OF 3</Text>
            <Text style={styles.headerTitle}>Farm{'\n'}Setup</Text>
            <Text style={styles.headerSub}>
              Tell us about your farm so we can personalize your experience.
            </Text>
          </View>

          <View style={styles.progressRow}>
            <View style={[styles.progressDot, styles.progressDotActive]} />
            <View style={[styles.progressLine, styles.progressLineActive]} />
            <View style={[styles.progressDot, styles.progressDotActive]} />
            <View style={styles.progressLine} />
            <View style={styles.progressDot} />
          </View>

          <View style={styles.formCard}>
            <View style={styles.fieldGroup}>
              <View style={styles.fieldWrap}>
                <View style={styles.fieldIcon}>
                  <Svg width="18" height="18" viewBox="0 0 18 18">
                    <Path d="M9 2L4 7V14H14V7L9 2Z" stroke="#A0AEA1" strokeWidth="1.3" fill="none" />
                    <Circle cx={9} cy={10} r={1.5} stroke="#A0AEA1" strokeWidth="1.2" fill="none" />
                  </Svg>
                </View>
                <View style={styles.fieldInputWrap}>
                  <Text style={styles.fieldLabel}>FARM NAME</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={farmName}
                    onChangeText={setFarmName}
                    placeholder="Enter your farm name"
                    placeholderTextColor="#A0AEA1"
                  />
                </View>
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.fieldWrap}>
                <View style={styles.fieldIcon}>
                  <Svg width="18" height="18" viewBox="0 0 18 18">
                    <Path d="M9 16C9 16 14 11.5 14 8C14 5 11.5 3 9 3C6.5 3 4 5 4 8C4 11.5 9 16 9 16Z" stroke="#A0AEA1" strokeWidth="1.3" fill="none" />
                    <Circle cx={9} cy={7.5} r={1.5} stroke="#A0AEA1" strokeWidth="1.2" fill="none" />
                  </Svg>
                </View>
                <View style={styles.fieldInputWrap}>
                  <Text style={styles.fieldLabel}>LOCATION</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={location}
                    onChangeText={setLocation}
                    placeholder="State, Country"
                    placeholderTextColor="#A0AEA1"
                  />
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.continueBtn}
              activeOpacity={0.95}
              onPress={() => router.push('/(setup)/farm-structure')}
            >
              <Text style={styles.continueBtnText}>Continue</Text>
              <Svg width="18" height="18" viewBox="0 0 18 18">
                <Path d="M7 13L12 9L7 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.newCycleBtn}
              activeOpacity={0.85}
              onPress={() => router.push('/create-batch')}
            >
              <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <Circle cx="8" cy="8" r="5" stroke="#2E7D32" strokeWidth="1.4" fill="none" />
                <Line x1="8" y1="5.5" x2="8" y2="10.5" stroke="#2E7D32" strokeWidth="1.3" strokeLinecap="round" />
                <Line x1="5.5" y1="8" x2="10.5" y2="8" stroke="#2E7D32" strokeWidth="1.3" strokeLinecap="round" />
              </Svg>
              <Text style={styles.newCycleBtnText}>New Production Cycle</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAF7' },
  flex: { flex: 1 },
  scrollInner: { paddingHorizontal: 24, paddingBottom: 40, flexGrow: 1 },
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
    paddingTop: 10, zIndex: 5,
  },
  navBack: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  navLogo: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  navLogoText: { fontSize: 14, fontWeight: '700', color: '#1B1B1B' },
  navHelp: { fontSize: 14, fontWeight: '500', color: '#616161' },
  headerSection: { marginTop: 28, zIndex: 5 },
  headerLabel: {
    fontSize: 11, fontWeight: '600', color: '#2E7D32', letterSpacing: 2, textTransform: 'uppercase',
  },
  headerTitle: { fontSize: 32, fontWeight: '800', lineHeight: 40, color: '#1B1B1B', marginTop: 8 },
  headerSub: { fontSize: 15, lineHeight: 24, color: '#616161', marginTop: 8, maxWidth: 330 },
  progressRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: 24, gap: 6, zIndex: 5,
  },
  progressDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#D1D5DB' },
  progressDotActive: { width: 28, height: 10, borderRadius: 5, backgroundColor: '#2E7D32' },
  progressLine: { width: 32, height: 2, backgroundColor: '#D1D5DB', borderRadius: 1 },
  progressLineActive: { backgroundColor: '#2E7D32' },
  formCard: {
    backgroundColor: 'white', borderRadius: 28, padding: 24, marginTop: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06, shadowRadius: 20, elevation: 4,
    zIndex: 100, position: 'relative',
  },
  fieldGroup: { marginBottom: 18 },
  fieldWrap: {
    flexDirection: 'row', alignItems: 'center', height: 58, borderRadius: 16,
    backgroundColor: '#F8FAF7', borderWidth: 1.5, borderColor: '#E2E8F0',
    paddingHorizontal: 16, gap: 12,
  },
  fieldIcon: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  fieldInputWrap: { flex: 1, justifyContent: 'center', minWidth: 0 },
  fieldLabel: { fontSize: 10, fontWeight: '500', color: '#A0AEA1', marginBottom: 1 },
  fieldInput: { fontSize: 15, fontWeight: '500', color: '#1B1B1B', padding: 0, margin: 0 },
  continueBtn: {
    width: '100%', height: 58, borderRadius: 18, backgroundColor: '#2E7D32',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 6,
    shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3, shadowRadius: 30, elevation: 6,
  },
  continueBtnText: { fontSize: 16, fontWeight: '600', color: 'white' },
  newCycleBtn: {
    width: '100%', height: 50, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 12, backgroundColor: '#F0FDF4',
    borderWidth: 1.5, borderColor: '#2E7D32',
  },
  newCycleBtnText: { fontSize: 14, fontWeight: '600', color: '#2E7D32' },
});
