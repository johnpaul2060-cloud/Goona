import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

export default function LoginScreen() {
  const [rememberMe, setRememberMe] = useState(true);
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.blob} />
      <View style={styles.contour1} />
      <View style={styles.contour2} />
      <View style={styles.dotGrid} />
      <View style={styles.glowCenter} />

      <View style={styles.chip1}>
        <Svg width={14} height={14} viewBox="0 0 14 14">
          <Path d="M7 2L4 4V8C4 10.5 7 12 7 12C7 12 10 10.5 10 8V4L7 2Z" stroke="#2E7D32" strokeWidth={1.3} fill="none" />
          <Path d="M5.5 7.5L6.5 8.5L9 6" stroke="#2E7D32" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </Svg>
        <Text style={styles.chipText}>Secure Access</Text>
      </View>
      <View style={styles.chip2}>
        <Svg width={14} height={14} viewBox="0 0 14 14">
          <Path d="M3 7C3 4.5 5 3 7 3C8.5 3 9.5 3.5 10 4.5" stroke="#2E7D32" strokeWidth={1.2} strokeLinecap="round" />
          <Path d="M11 7C11 9.5 9 11 7 11C5.5 11 4.5 10.5 4 9.5" stroke="#2E7D32" strokeWidth={1.2} strokeLinecap="round" />
        </Svg>
        <Text style={styles.chipText}>Synced Offline</Text>
      </View>
      <View style={styles.chip3}>
        <Svg width={14} height={14} viewBox="0 0 14 14">
          <Rect x={2} y={3} width={10} height={8} rx={2} stroke="#2E7D32" strokeWidth={1.2} fill="none" />
          <Path d="M5 6L6.5 7.5L9.5 4.5" stroke="#2E7D32" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </Svg>
        <Text style={styles.chipText}>Farm Data Protected</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollInner}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.topNav}>
            <TouchableOpacity style={styles.navBack} onPress={() => router.back()}>
              <Svg width={24} height={24} viewBox="0 0 24 24">
                <Path d="M15 18L9 12L15 6" stroke="#1B1B1B" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </TouchableOpacity>
            <View style={styles.navLogo}>
              <Svg width={24} height={24} viewBox="0 0 24 24">
                <Path d="M12 2C12 2 7 8 7 12C7 14.5 8.5 17 10 18.5C9.5 17 9 16 9 15C9 11.5 11 7 12 2Z" fill="#2E7D32" />
                <Path d="M12 2C12 2 17 8 17 12C17 14.5 15.5 17 14 18.5C14.5 17 15 16 15 15C15 11.5 13 7 12 2Z" fill="#388E3C" />
              </Svg>
              <Text style={styles.navLogoText}>GOONA</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.navHelp}>Help</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.headerSection}>
            <Text style={styles.headerLabel}>Welcome Back</Text>
            <Text style={styles.headerTitle}>Login to Your Farm Dashboard</Text>
            <Text style={styles.headerSub}>
              Access your livestock records, reinvestment tracker, farm analytics, and team operations.
            </Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.fieldGroup}>
              <View style={styles.fieldWrap}>
                <View style={styles.fieldIcon}>
                  <Svg width={20} height={20} viewBox="0 0 20 20">
                    <Circle cx={10} cy={7} r={3.5} stroke="#A0AEA1" strokeWidth={1.4} fill="none" />
                    <Path d="M4 17C4 14 6.5 12 10 12C13.5 12 16 14 16 17" stroke="#A0AEA1" strokeWidth={1.4} strokeLinecap="round" fill="none" />
                  </Svg>
                </View>
                <View style={styles.fieldInputWrap}>
                  <Text style={styles.fieldLabel}>Email / Phone</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="Email Address or Phone Number"
                    placeholderTextColor="#A0AEA1"
                    autoCapitalize="none"
                    autoComplete="username"
                    keyboardType="email-address"
                  />
                </View>
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.fieldWrap}>
                <View style={styles.fieldIcon}>
                  <Svg width={20} height={20} viewBox="0 0 20 20">
                    <Rect x={4} y={8} width={12} height={8} rx={2} stroke="#A0AEA1" strokeWidth={1.4} fill="none" />
                    <Path d="M7 8V6C7 4 8 3 10 3C12 3 13 4 13 6V8" stroke="#A0AEA1" strokeWidth={1.4} strokeLinecap="round" fill="none" />
                    <Circle cx={10} cy={12} r={1.2} stroke="#A0AEA1" strokeWidth={1} />
                  </Svg>
                </View>
                <View style={styles.fieldInputWrap}>
                  <Text style={styles.fieldLabel}>Password</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="Password"
                    placeholderTextColor="#A0AEA1"
                    secureTextEntry={!passwordVisible}
                    autoComplete="current-password"
                  />
                </View>
                <TouchableOpacity
                  style={styles.fieldRight}
                  onPress={() => setPasswordVisible(!passwordVisible)}
                >
                  <Svg width={20} height={20} viewBox="0 0 20 20">
                    <Path d="M3 10C3 10 5.5 5 10 5C14.5 5 17 10 17 10C17 10 14.5 15 10 15C5.5 15 3 10 3 10Z" stroke="#A0AEA1" strokeWidth={1.4} fill="none" />
                    {passwordVisible && (
                      <>
                        <Circle cx={10} cy={10} r={3} stroke="#A0AEA1" strokeWidth={1.2} fill="none" />
                      </>
                    )}
                    {!passwordVisible && (
                      <>
                        <Circle cx={10} cy={10} r={3} stroke="#A0AEA1" strokeWidth={1.2} fill="none" />
                        <Line x1={16} y1={4} x2={4} y2={16} stroke="#A0AEA1" strokeWidth={1.3} strokeLinecap="round" />
                      </>
                    )}
                  </Svg>
                </TouchableOpacity>
              </View>
              <View style={styles.forgotRow}>
                <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
                  <Text style={styles.forgotLink}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.rememberRow}>
              <TouchableOpacity
                style={styles.rememberLeft}
                onPress={() => setRememberMe(!rememberMe)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe && (
                    <Svg width={12} height={12} viewBox="0 0 12 12">
                      <Path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                  )}
                </View>
                <Text style={styles.rememberText}>Keep me signed in</Text>
              </TouchableOpacity>
              <View style={styles.secureBadge}>
                <Svg width={16} height={16} viewBox="0 0 16 16">
                  <Path d="M8 3L5 5V8C5 10.5 8 12 8 12C8 12 11 10.5 11 8V5L8 3Z" stroke="#2E7D32" strokeWidth={1.2} fill="none" />
                  <Path d="M6.5 8L7.5 9L10 6.5" stroke="#2E7D32" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </Svg>
                <Text style={styles.secureText}>Secure Login</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.loginBtn} activeOpacity={0.95}>
              <Svg width={20} height={20} viewBox="0 0 20 20">
                <Circle cx={10} cy={7} r={3} stroke="white" strokeWidth={1.4} fill="none" />
                <Path d="M4 17C4 14 6.5 12 10 12C13.5 12 16 14 16 17" stroke="white" strokeWidth={1.4} strokeLinecap="round" fill="none" />
                <Path d="M14 6L17 9L14 12" stroke="white" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <Line x1={8} y1={9} x2={17} y2={9} stroke="white" strokeWidth={1.2} strokeLinecap="round" />
              </Svg>
              <Text style={styles.loginBtnText}>Login to GOONA</Text>
            </TouchableOpacity>

            <View style={styles.orDivider}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>OR QUICK ACCESS</Text>
              <View style={styles.orLine} />
            </View>

            <View style={styles.bioRow}>
              <TouchableOpacity style={styles.bioBtn} activeOpacity={0.8}>
                <Svg width={20} height={20} viewBox="0 0 20 20">
                  <Circle cx={10} cy={7} r={2.5} stroke="#1B1B1B" strokeWidth={1.3} fill="none" />
                  <Path d="M5 16C5 13.5 7 12 10 12C13 12 15 13.5 15 16" stroke="#1B1B1B" strokeWidth={1.3} strokeLinecap="round" fill="none" />
                  <Line x1={2} y1={9} x2={3.5} y2={10} stroke="#1B1B1B" strokeWidth={1.2} strokeLinecap="round" />
                  <Line x1={18} y1={9} x2={16.5} y2={10} stroke="#1B1B1B" strokeWidth={1.2} strokeLinecap="round" />
                  <Line x1={10} y1={2} x2={10} y2={3.5} stroke="#1B1B1B" strokeWidth={1.2} strokeLinecap="round" />
                </Svg>
                <Text style={styles.bioBtnText}>Face ID</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.bioBtn} activeOpacity={0.8}>
                <Svg width={20} height={20} viewBox="0 0 20 20">
                  <Path d="M7 10V7C7 5 8.5 4 10 4C11.5 4 13 5 13 7V10" stroke="#1B1B1B" strokeWidth={1.3} strokeLinecap="round" fill="none" />
                  <Rect x={6} y={10} width={8} height={6} rx={2} stroke="#1B1B1B" strokeWidth={1.3} fill="none" />
                  <Circle cx={10} cy={13} r={0.8} fill="#1B1B1B" />
                </Svg>
                <Text style={styles.bioBtnText}>Fingerprint</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.socialDivider}>
              <View style={styles.socialLine} />
              <Text style={styles.socialText}>CONTINUE WITH</Text>
              <View style={styles.socialLine} />
            </View>

            <View style={styles.socialRow}>
              <TouchableOpacity style={styles.socialBtn} activeOpacity={0.8}>
                <Svg width={20} height={20} viewBox="0 0 20 20">
                  <Path d="M17 10C17 6.5 14 3.5 10 3.5C6 3.5 3 6.5 3 10C3 13.5 5.5 16.5 9 17V12.5H7V10H9V8C9 6 10.5 5 12 5C12.5 5 13.5 5 14 5.5V7.5H12.5C11.5 7.5 11 8 11 9V10H13.5L13 12.5H11V17C14.5 16.5 17 13.5 17 10Z" stroke="#1B1B1B" strokeWidth={1.3} strokeLinejoin="round" fill="none" />
                </Svg>
                <Text style={styles.socialBtnText}>Google</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialBtn} activeOpacity={0.8}>
                <Svg width={20} height={20} viewBox="0 0 20 20">
                  <Path d="M14 3C15.5 3 17 4 17 6.5C17 9 14 11 14 11C14 11 11 9 11 6.5C11 4 12.5 3 14 3Z" stroke="#1B1B1B" strokeWidth={1.3} fill="none" />
                  <Path d="M6 3C4.5 3 3 4 3 6.5C3 9 6 11 6 11C6 11 9 9 9 6.5C9 4 7.5 3 6 3Z" stroke="#1B1B1B" strokeWidth={1.3} fill="none" />
                  <Path d="M10 13L10 17" stroke="#1B1B1B" strokeWidth={1.3} strokeLinecap="round" />
                  <Path d="M8 15H12" stroke="#1B1B1B" strokeWidth={1.3} strokeLinecap="round" />
                </Svg>
                <Text style={styles.socialBtnText}>Apple</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.bottomRow}>
            <Text style={styles.bottomText}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/create-account')}>
              <Text style={styles.bottomLink}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF7',
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollInner: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  blob: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(232,245,233,0.45)',
    zIndex: 0,
  },
  contour1: {
    position: 'absolute',
    width: 380,
    height: 130,
    top: '10%',
    right: '-15%',
    borderWidth: 1,
    borderColor: '#2E7D32',
    borderBottomWidth: 0,
    borderTopLeftRadius: 190,
    borderTopRightRadius: 190,
    opacity: 0.04,
    transform: [{ rotate: '10deg' }],
    zIndex: 0,
  },
  contour2: {
    position: 'absolute',
    width: 300,
    height: 100,
    bottom: '20%',
    left: '-10%',
    borderWidth: 1,
    borderColor: '#2E7D32',
    borderTopWidth: 0,
    borderBottomLeftRadius: 150,
    borderBottomRightRadius: 150,
    opacity: 0.04,
    transform: [{ rotate: '-8deg' }],
    zIndex: 0,
  },
  dotGrid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.03,
    zIndex: 0,
  },
  glowCenter: {
    position: 'absolute',
    top: '38%',
    left: '50%',
    width: 240,
    height: 240,
    marginLeft: -120,
    marginTop: -120,
    borderRadius: 120,
    backgroundColor: 'rgba(232,245,233,0.30)',
    zIndex: 0,
  },
  chip1: {
    position: 'absolute',
    top: '22%',
    right: 12,
    backgroundColor: 'white',
    borderRadius: 100,
    paddingVertical: 6,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    zIndex: 3,
  },
  chip2: {
    position: 'absolute',
    bottom: '38%',
    left: 8,
    backgroundColor: 'white',
    borderRadius: 100,
    paddingVertical: 6,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    zIndex: 3,
  },
  chip3: {
    position: 'absolute',
    bottom: '28%',
    right: 14,
    backgroundColor: 'white',
    borderRadius: 100,
    paddingVertical: 6,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    zIndex: 3,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#475569',
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    zIndex: 5,
  },
  navBack: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  navLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  navLogoText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1B1B1B',
  },
  navHelp: {
    fontSize: 14,
    fontWeight: '500',
    color: '#616161',
  },
  headerSection: {
    marginTop: 28,
    zIndex: 5,
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2E7D32',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 40,
    color: '#1B1B1B',
    marginTop: 8,
  },
  headerSub: {
    fontSize: 15,
    lineHeight: 24,
    color: '#616161',
    marginTop: 8,
    maxWidth: 330,
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 28,
    padding: 24,
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
    zIndex: 5,
  },
  fieldGroup: {
    marginBottom: 18,
  },
  fieldWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 58,
    borderRadius: 16,
    backgroundColor: '#F8FAF7',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    gap: 12,
  },
  fieldIcon: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  fieldInputWrap: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#A0AEA1',
    marginBottom: 1,
  },
  fieldInput: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1B1B1B',
    padding: 0,
    margin: 0,
    fontFamily: Platform.OS === 'ios' ? 'system-ui' : undefined,
  },
  fieldRight: {
    flexShrink: 0,
    padding: 4,
  },
  forgotRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 6,
  },
  forgotLink: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2E7D32',
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  rememberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    borderColor: '#2E7D32',
    backgroundColor: '#2E7D32',
  },
  rememberText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#616161',
  },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  secureText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
  },
  loginBtn: {
    width: '100%',
    height: 58,
    borderRadius: 18,
    backgroundColor: '#2E7D32',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 22,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 6,
  },
  loginBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 20,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E8ECEE',
  },
  orText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: 1.5,
  },
  bioRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  bioBtn: {
    flex: 1,
    height: 54,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  bioBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1B1B1B',
  },
  socialDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 20,
  },
  socialLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E8ECEE',
  },
  socialText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: 1.5,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  socialBtn: {
    flex: 1,
    height: 54,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  socialBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1B1B1B',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    paddingBottom: 8,
    zIndex: 5,
  },
  bottomText: {
    fontSize: 14,
    color: '#616161',
  },
  bottomLink: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
  },
});
