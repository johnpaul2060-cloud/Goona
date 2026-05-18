import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';

function BackIcon() {
  return (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <Path d="M15 18L9 12L15 6" stroke="#1B1B1B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export default function CreateAccountScreen() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

  const isEmailValid = email.length === 0 || emailRegex.test(email);
  const isPasswordValid = password.length === 0 || passwordRegex.test(password);
  const doPasswordsMatch = confirmPassword.length === 0 || password === confirmPassword;

  const canContinue =
    fullName.trim().length > 0 &&
    phone.replace(/\s/g, '').length > 0 &&
    emailRegex.test(email) &&
    passwordRegex.test(password) &&
    password === confirmPassword;

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
            <Text style={styles.headerLabel}>STEP 1 OF 3</Text>
            <Text style={styles.headerTitle}>Create{'\n'}Account</Text>
            <Text style={styles.headerSub}>
              Enter your personal details to set up your secure GOONA profile.
            </Text>
          </View>

          <View style={styles.progressRow}>
            <View style={[styles.progressDot, styles.progressDotActive]} />
            <View style={styles.progressLine} />
            <View style={styles.progressDot} />
            <View style={styles.progressLine} />
            <View style={styles.progressDot} />
          </View>

          <View style={styles.formCard}>
            <View style={styles.fieldGroup}>
              <View style={styles.fieldWrap}>
                <View style={styles.fieldIcon}>
                  <Svg width="18" height="18" viewBox="0 0 18 18">
                    <Circle cx={9} cy={6} r={3} stroke="#A0AEA1" strokeWidth="1.3" fill="none" />
                    <Path d="M4 15C4 12.5 6 11 9 11C12 11 14 12.5 14 15" stroke="#A0AEA1" strokeWidth="1.3" strokeLinecap="round" fill="none" />
                  </Svg>
                </View>
                <View style={styles.fieldInputWrap}>
                  <Text style={styles.fieldLabel}>FULL NAME</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Enter your full name"
                    placeholderTextColor="#A0AEA1"
                    autoCapitalize="words"
                  />
                </View>
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.fieldWrap}>
                <View style={styles.fieldIcon}>
                  <View style={styles.flagBadge}>
                    <Text style={styles.flagText}>🇳🇬</Text>
                  </View>
                </View>
                <View style={styles.fieldInputWrap}>
                  <Text style={styles.fieldLabel}>PHONE NUMBER</Text>
                  <View style={styles.phoneRow}>
                    <Text style={styles.phoneCode}>+234</Text>
                    <View style={styles.phoneDivider} />
                    <TextInput
                      style={[styles.fieldInput, styles.phoneInput]}
                      value={phone}
                      onChangeText={setPhone}
                      placeholder="800 000 0000"
                      placeholderTextColor="#A0AEA1"
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.fieldWrap}>
                <View style={styles.fieldIcon}>
                  <Svg width="18" height="18" viewBox="0 0 18 18">
                    <Rect x="3" y="4" width="12" height="10" rx="1.5" stroke="#A0AEA1" strokeWidth="1.3" fill="none" />
                    <Path d="M3 6L9 10L15 6" stroke="#A0AEA1" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </Svg>
                </View>
                <View style={styles.fieldInputWrap}>
                  <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@example.com"
                    placeholderTextColor="#A0AEA1"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <View style={[styles.passwordWrap, focusedField === 'password' && styles.fieldWrapFocused]}>
                <View style={styles.passwordInputRow}>
                  <View style={styles.fieldIcon}>
                    <Svg width="18" height="18" viewBox="0 0 18 18">
                      <Rect x="3" y="7" width="12" height="8" rx="1.5" stroke="#A0AEA1" strokeWidth="1.3" fill="none" />
                      <Path d="M6 7V5C6 3.5 7 3 9 3C11 3 12 3.5 12 5V7" stroke="#A0AEA1" strokeWidth="1.3" strokeLinecap="round" fill="none" />
                      <Circle cx="9" cy="11" r="1" stroke="#A0AEA1" strokeWidth="0.8" />
                    </Svg>
                  </View>
                  <View style={styles.fieldInputWrap}>
                    <Text style={styles.fieldLabel}>PASSWORD</Text>
                    <TextInput
                      style={styles.fieldInput}
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Enter your password"
                      placeholderTextColor="#A0AEA1"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      onFocus={() => { setFocusedField('password'); console.log('PASSWORD FOCUSED'); }}
                      onBlur={() => { setFocusedField(null); console.log('PASSWORD BLURRED'); }}
                    />
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Svg width="20" height="20" viewBox="0 0 20 20">
                    <Path d="M3 10C3 10 5.5 5 10 5C14.5 5 17 10 17 10C17 10 14.5 15 10 15C5.5 15 3 10 3 10Z" stroke="#A0AEA1" strokeWidth="1.4" fill="none" />
                    <Circle cx={10} cy={10} r={3} stroke="#A0AEA1" strokeWidth="1.2" fill="none" />
                    {!showPassword && (
                      <Line x1={16} y1={4} x2={4} y2={16} stroke="#A0AEA1" strokeWidth="1.3" strokeLinecap="round" />
                    )}
                  </Svg>
                </TouchableOpacity>
              </View>
              {password.length > 0 && !isPasswordValid && (
                <Text style={styles.validationText}>Must contain at least 8 characters, 1 uppercase letter and 1 number.</Text>
              )}
            </View>

            <View style={styles.fieldGroup}>
              <View style={[styles.passwordWrap, focusedField === 'confirmPassword' && styles.fieldWrapFocused, confirmPassword.length > 0 && !doPasswordsMatch && styles.fieldWrapError]}>
                <View style={styles.passwordInputRow}>
                  <View style={styles.fieldIcon}>
                    <Svg width="18" height="18" viewBox="0 0 18 18">
                      <Rect x="3" y="7" width="12" height="8" rx="1.5" stroke="#A0AEA1" strokeWidth="1.3" fill="none" />
                      <Path d="M6 7V5C6 3.5 7 3 9 3C11 3 12 3.5 12 5V7" stroke="#A0AEA1" strokeWidth="1.3" strokeLinecap="round" fill="none" />
                      <Circle cx="9" cy="11" r="1" stroke="#A0AEA1" strokeWidth="0.8" />
                    </Svg>
                  </View>
                  <View style={styles.fieldInputWrap}>
                    <Text style={styles.fieldLabel}>CONFIRM PASSWORD</Text>
                    <TextInput
                      style={styles.fieldInput}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Confirm your password"
                      placeholderTextColor="#A0AEA1"
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      onFocus={() => { setFocusedField('confirmPassword'); console.log('CONFIRM FOCUSED'); }}
                      onBlur={() => { setFocusedField(null); console.log('CONFIRM BLURRED'); }}
                    />
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Svg width="20" height="20" viewBox="0 0 20 20">
                    <Path d="M3 10C3 10 5.5 5 10 5C14.5 5 17 10 17 10C17 10 14.5 15 10 15C5.5 15 3 10 3 10Z" stroke="#A0AEA1" strokeWidth="1.4" fill="none" />
                    <Circle cx={10} cy={10} r={3} stroke="#A0AEA1" strokeWidth="1.2" fill="none" />
                    {!showConfirmPassword && (
                      <Line x1={16} y1={4} x2={4} y2={16} stroke="#A0AEA1" strokeWidth="1.3" strokeLinecap="round" />
                    )}
                  </Svg>
                </TouchableOpacity>
              </View>
              {confirmPassword.length > 0 && !doPasswordsMatch && (
                <Text style={styles.validationTextError}>Passwords do not match</Text>
              )}
            </View>

            <TouchableOpacity
              style={[styles.continueBtn, !canContinue && styles.continueBtnDisabled]}
              activeOpacity={0.95}
              disabled={!canContinue}
              onPress={() => router.push('/farm-setup')}
            >
              <Text style={styles.continueBtnText}>Continue</Text>
              <Svg width="18" height="18" viewBox="0 0 18 18">
                <Path d="M7 13L12 9L7 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomRow}>
            <Text style={styles.bottomText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.bottomLink}>Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');

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
  navBack: {
    width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10,
  },
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
  flagBadge: { width: 22, height: 22, borderRadius: 11, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  flagText: { fontSize: 16 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  phoneCode: { fontSize: 14, fontWeight: '600', color: '#1B1B1B' },
  phoneDivider: { width: 1, height: 16, backgroundColor: '#E2E8F0' },
  phoneInput: { flex: 1 },
  continueBtn: {
    width: '100%', height: 58, borderRadius: 18, backgroundColor: '#2E7D32',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 6,
    shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3, shadowRadius: 30, elevation: 6,
  },
  continueBtnText: { fontSize: 16, fontWeight: '600', color: 'white' },
  bottomRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 24, paddingBottom: 8, zIndex: 5 },
  bottomText: { fontSize: 14, color: '#616161' },
  bottomLink: { fontSize: 14, color: '#2E7D32', fontWeight: '600' },
  fieldRight: { flexShrink: 0, padding: 4 },
  fieldWrapFocused: { borderColor: '#2E7D32' },
  fieldWrapError: { borderColor: '#EF4444' },
  passwordWrap: {
    flexDirection: 'row', alignItems: 'center', height: 58, borderRadius: 16,
    backgroundColor: '#F8FAF7', borderWidth: 1.5, borderColor: '#E2E8F0',
    paddingLeft: 16, paddingRight: 4, overflow: 'hidden',
  },
  passwordInputRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, minWidth: 0 },
  eyeBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  validationText: { fontSize: 11, color: '#EF4444', marginTop: 4, marginLeft: 4, lineHeight: 16 },
  validationTextError: { fontSize: 11, color: '#EF4444', marginTop: 4, marginLeft: 4, fontWeight: '600' },
  continueBtnDisabled: { opacity: 0.4, shadowOpacity: 0.1 },
});
