import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Path,
  Circle,
  Defs,
  Rect,
  RadialGradient,
  Stop,
} from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.88;
const CARD_H_PADDING = 24;
const INPUT_RADIUS = 16;
const CARD_RADIUS = 28;

function BackIcon() {
  return (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <Path d="M15 18L9 12L15 6" stroke="#1B2E1D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function MailIcon() {
  return (
    <Svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <Path d="M3 3H15C15.825 3 16.5 3.675 16.5 4.5V13.5C16.5 14.325 15.825 15 15 15H3C2.175 15 1.5 14.325 1.5 13.5V4.5C1.5 3.675 2.175 3 3 3Z" stroke="#94A3B8" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16.5 4.5L9 10.5L1.5 4.5" stroke="#94A3B8" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LockIcon() {
  return (
    <Svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <Path d="M5.25 8.25V5.25C5.25 3.17893 6.92893 1.5 9 1.5C11.0711 1.5 12.75 3.17893 12.75 5.25V8.25" stroke="#94A3B8" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <Rect x="3" y="8.25" width="12" height="8.25" rx="2" stroke="#94A3B8" strokeWidth="1.3" />
      <Circle cx="9" cy="12.375" r="1.125" fill="#2E7D32" />
    </Svg>
  );
}

function EyeIcon() {
  return (
    <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <Path d="M10 4C5 4 2 10 2 10C2 10 5 16 10 16C15 16 18 10 18 10C18 10 15 4 10 4Z" stroke="#94A3B8" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="10" cy="10" r="3" stroke="#94A3B8" strokeWidth="1.3" />
    </Svg>
  );
}

function EyeOffIcon() {
  return (
    <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <Path d="M3.5 3.5L16.5 16.5" stroke="#94A3B8" strokeWidth="1.3" strokeLinecap="round" />
      <Path d="M10 16C5 16 2 10 2 10C2 10 3.5 7 7 5" stroke="#94A3B8" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M8.5 4.68C9 4.5 9.5 4 10 4C15 4 18 10 18 10C18 10 17 12 14.5 14" stroke="#94A3B8" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="10" cy="10" r="3" stroke="#94A3B8" strokeWidth="1.3" />
      <Path d="M12 8L8 12" stroke="#94A3B8" strokeWidth="1.3" strokeLinecap="round" />
    </Svg>
  );
}

function CheckIcon() {
  return (
    <Svg width="10" height="8" viewBox="0 0 10 8" fill="none">
      <Path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ShieldIcon() {
  return (
    <Svg width="12" height="14" viewBox="0 0 12 14" fill="none">
      <Path d="M6 1L1 3V6.5C1 10 3.5 13 6 13.5C8.5 13 11 10 11 6.5V3L6 1Z" stroke="#2E7D32" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M4.5 7L5.5 8L7.5 5.5" stroke="#2E7D32" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function FaceIdIcon() {
  return (
    <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <Path d="M2 6V3.5C2 2.67157 2.67157 2 3.5 2H6" stroke="#2E7D32" strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M14 2H16.5C17.3284 2 18 2.67157 18 3.5V6" stroke="#2E7D32" strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M18 14V16.5C18 17.3284 17.3284 18 16.5 18H14" stroke="#2E7D32" strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M6 18H3.5C2.67157 18 2 17.3284 2 16.5V14" stroke="#2E7D32" strokeWidth="1.5" strokeLinecap="round" />
      <Circle cx="7" cy="8" r="1" fill="#2E7D32" />
      <Circle cx="13" cy="8" r="1" fill="#2E7D32" />
      <Path d="M10 12C11 12 12 11 12 10" stroke="#2E7D32" strokeWidth="1.3" strokeLinecap="round" />
    </Svg>
  );
}

function FingerprintIcon() {
  return (
    <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <Path d="M10 5C7.5 5 5.5 6.5 5.5 9V11" stroke="#2E7D32" strokeWidth="1.3" strokeLinecap="round" />
      <Path d="M14.5 11V9C14.5 7.5 14 6 13 5" stroke="#2E7D32" strokeWidth="1.3" strokeLinecap="round" />
      <Path d="M2 11V10.5C2 6 4.5 3 10 3" stroke="#2E7D32" strokeWidth="1.3" strokeLinecap="round" />
      <Path d="M18 11V10.5C18 6 15.5 3 10 3" stroke="#2E7D32" strokeWidth="1.3" strokeLinecap="round" />
      <Path d="M10 3V2" stroke="#2E7D32" strokeWidth="1.3" strokeLinecap="round" />
      <Path d="M8 17H12" stroke="#2E7D32" strokeWidth="1.3" strokeLinecap="round" />
      <Path d="M6 14H14" stroke="#2E7D32" strokeWidth="1.3" strokeLinecap="round" />
      <Path d="M9 16V13" stroke="#2E7D32" strokeWidth="1.3" strokeLinecap="round" />
      <Path d="M11 16V13" stroke="#2E7D32" strokeWidth="1.3" strokeLinecap="round" />
    </Svg>
  );
}

function FacebookIcon() {
  return (
    <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <Path d="M17 10C17 6.5 14 3.5 10 3.5C6 3.5 3 6.5 3 10C3 13.5 5.5 16.5 9 17V12.5H7V10H9V8C9 6 10.5 5 12 5C12.5 5 13.5 5 14 5.5V7.5H12.5C11.5 7.5 11 8 11 9V10H13.5L13 12.5H11V17C14.5 16.5 17 13.5 17 10Z" fill="#2E7D32" />
    </Svg>
  );
}

function ApplePersonIcon() {
  return (
    <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <Path d="M14 3C15.5 3 17 4 17 6.5C17 9 14 11 14 11C14 11 11 9 11 6.5C11 4 12.5 3 14 3Z" stroke="#1B1B1B" strokeWidth="1.3" fill="none" />
      <Path d="M6 3C4.5 3 3 4 3 6.5C3 9 6 11 6 11C6 11 9 9 9 6.5C9 4 7.5 3 6 3Z" stroke="#1B1B1B" strokeWidth="1.3" fill="none" />
      <Path d="M10 13L10 17" stroke="#1B1B1B" strokeWidth="1.3" strokeLinecap="round" />
      <Path d="M8 15H12" stroke="#1B1B1B" strokeWidth="1.3" strokeLinecap="round" />
    </Svg>
  );
}

function BlobDecoration() {
  return (
    <Svg
      width={SCREEN_WIDTH * 1.2}
      height={SCREEN_HEIGHT * 0.45}
      viewBox="0 0 400 300"
      style={{ position: 'absolute', top: -40, right: -40 }}
    >
      <Defs>
        <RadialGradient id="blobGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#4CAF50" stopOpacity={0.35} />
          <Stop offset="100%" stopColor="#4CAF50" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Path d="M280 60C320 40 380 80 390 140C400 200 370 250 330 270C290 290 240 280 190 290C140 300 80 320 50 290C20 260 0 220 10 170C20 120 60 80 110 60C160 40 210 50 250 55C260 57 270 58 280 60Z" fill="#E8F5E9" opacity={0.6} />
      <Circle cx="340" cy="130" r="120" fill="url(#blobGlow)" />
    </Svg>
  );
}

function DotGridDecoration() {
  const dotSize = 1.2;
  const spacing = 24;
  const rows = 10;
  const cols = 8;
  const dots = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const opacity = (r + c) % 2 === 0 ? 0.08 : 0.06;
      dots.push(
        <Circle key={`${r}-${c}`} cx={c * spacing + 4} cy={r * spacing + 4} r={dotSize} fill="#2E7D32" opacity={opacity} />
      );
    }
  }
  return (
    <View style={{ position: 'absolute', bottom: 0, left: 0 }}>
      <Svg width={SCREEN_WIDTH * 0.5} height={SCREEN_HEIGHT * 0.35} viewBox="0 0 200 260">
        {dots}
      </Svg>
    </View>
  );
}

function ContourDecoration() {
  return (
    <Svg
      width={SCREEN_WIDTH}
      height={SCREEN_HEIGHT * 0.6}
      viewBox="0 0 390 500"
      style={{ position: 'absolute', bottom: 0, right: 0 }}
    >
      <Path d="M390 400C330 380 280 420 220 440C160 460 100 440 50 460L0 480V500H390V400Z" fill="#F0F9F0" opacity={0.5} />
      <Path d="M390 440C340 430 290 450 240 460C190 470 130 460 70 470L0 490V500H390V440Z" fill="#E8F5E9" opacity={0.4} />
    </Svg>
  );
}

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const chipAnim = useRef(new Animated.Value(0)).current;
  const chipOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.stagger(300, [
        Animated.timing(chipOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(chipAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const chipTranslateY = chipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <BlobDecoration />
      <ContourDecoration />
      <DotGridDecoration />

      <View style={styles.chipsContainer} pointerEvents="none">
        <Animated.View style={[styles.chip, { opacity: chipOpacity, transform: [{ translateY: chipTranslateY }] }]}>
          <View style={styles.chipDot} />
          <Text style={styles.chipText}>Secure Access</Text>
        </Animated.View>
        <Animated.View style={[styles.chip, styles.chipSecond, { opacity: chipOpacity, transform: [{ translateY: chipTranslateY }] }]}>
          <View style={styles.chipDot} />
          <Text style={styles.chipText}>Synced Offline</Text>
        </Animated.View>
        <Animated.View style={[styles.chip, styles.chipThird, { opacity: chipOpacity, transform: [{ translateY: chipTranslateY }] }]}>
          <View style={styles.chipDot} />
          <Text style={styles.chipText}>Farm Data Protected</Text>
        </Animated.View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => router.back()} style={styles.topBarBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <BackIcon />
            </TouchableOpacity>
            <Text style={styles.logoText}>GOONA</Text>
            <TouchableOpacity onPress={() => {}} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.helpText}>Help</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.header}>
            <Text style={styles.welcomeLabel}>Welcome Back</Text>
            <Text style={styles.titleText}>Hello There!</Text>
            <Text style={styles.subtitleText}>
              Login to your account to access{'\n'}all your farm data and insights
            </Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email or Phone Number</Text>
              <View style={[styles.inputWrapper, emailFocused && styles.inputWrapperFocused]}>
                <MailIcon />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#94A3B8"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={[styles.inputWrapper, passwordFocused && styles.inputWrapperFocused]}>
                <LockIcon />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#94A3B8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')} style={styles.forgotRow}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.checkboxRow} onPress={() => setRememberMe(!rememberMe)} activeOpacity={0.7}>
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                {rememberMe && <CheckIcon />}
              </View>
              <Text style={styles.checkboxLabel}>Remember Me</Text>
            </TouchableOpacity>

            <View style={styles.secureBadge}>
              <ShieldIcon />
              <Text style={styles.secureText}>Your data is encrypted and secure</Text>
            </View>

            <TouchableOpacity activeOpacity={0.85} onPress={() => router.replace('/(tabs)')}>
              <LinearGradient colors={['#2E7D32', '#43A047']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.loginButton}>
                <Text style={styles.loginButtonText}>Login</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.orDivider}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.orLine} />
            </View>

            <View style={styles.biometricRow}>
              <TouchableOpacity style={styles.biometricBtn} activeOpacity={0.7}>
                <FaceIdIcon />
                <Text style={styles.biometricText}>Face ID</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.biometricBtn} activeOpacity={0.7}>
                <FingerprintIcon />
                <Text style={styles.biometricText}>Fingerprint</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.socialDivider}>
              <View style={styles.socialLine} />
              <Text style={styles.socialDividerText}>or continue with</Text>
              <View style={styles.socialLine} />
            </View>

            <View style={styles.socialRow}>
              <TouchableOpacity style={styles.socialBtn} activeOpacity={0.7} onPress={() => {}}>
                <FacebookIcon />
                <Text style={styles.socialBtnText}>Google</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialBtn} activeOpacity={0.7} onPress={() => {}}>
                <ApplePersonIcon />
                <Text style={styles.socialBtnText}>Apple</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.bottomRow}>
            <Text style={styles.bottomText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.createAccountText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAF7' },
  scrollContent: { paddingBottom: 40 },

  chipsContainer: {
    position: 'absolute', top: 340, right: 16, zIndex: 3, gap: 8,
  },
  chip: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: 100, gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 6,
  },
  chipSecond: { marginLeft: 12 },
  chipThird: { marginLeft: 24 },
  chipDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2E7D32' },
  chipText: { fontFamily: 'Inter_500Medium', fontSize: 13, color: '#1B2E1D', letterSpacing: 0.2 },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 8, height: 52,
  },
  topBarBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontFamily: 'Poppins_700Bold', fontSize: 22, color: '#1B2E1D', letterSpacing: 2 },
  helpText: { fontFamily: 'Inter_500Medium', fontSize: 14, color: '#2E7D32' },

  header: { paddingHorizontal: 24, paddingTop: 16 },
  welcomeLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#2E7D32', letterSpacing: 0.5, marginBottom: 6 },
  titleText: { fontFamily: 'Poppins_800ExtraBold', fontSize: 34, color: '#1B2E1D', lineHeight: 42, marginBottom: 8 },
  subtitleText: { fontFamily: 'Inter_400Regular', fontSize: 15, color: '#64748B', lineHeight: 22 },

  formCard: {
    width: CARD_WIDTH, alignSelf: 'center', backgroundColor: '#FFFFFF', borderRadius: CARD_RADIUS,
    paddingHorizontal: CARD_H_PADDING, paddingTop: 28, paddingBottom: 28, marginTop: 28,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 20, elevation: 4,
  },

  inputGroup: { marginBottom: 16 },
  inputLabel: { fontFamily: 'Inter_500Medium', fontSize: 13, color: '#475569', marginBottom: 8, letterSpacing: 0.3 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAF7',
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: INPUT_RADIUS, paddingHorizontal: 16, height: 52, gap: 12,
  },
  inputWrapperFocused: {
    borderColor: '#2E7D32', backgroundColor: '#FFFFFF',
    shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 2,
  },
  input: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 15, color: '#1B2E1D', height: '100%', padding: 0 },

  forgotRow: { alignItems: 'flex-end', marginBottom: 16, marginTop: -4 },
  forgotText: { fontFamily: 'Inter_500Medium', fontSize: 13, color: '#2E7D32' },

  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  checkbox: {
    width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: '#CBD5E1',
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF',
  },
  checkboxChecked: { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
  checkboxLabel: { fontFamily: 'Inter_400Regular', fontSize: 14, color: '#475569' },

  secureBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F0F9F0',
    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginBottom: 20,
  },
  secureText: { fontFamily: 'Inter_400Regular', fontSize: 12, color: '#2E7D32', letterSpacing: 0.2 },

  loginButton: {
    height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  loginButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: '#FFFFFF', letterSpacing: 0.5 },

  orDivider: { flexDirection: 'row', alignItems: 'center', marginVertical: 24, gap: 12 },
  orLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  orText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#94A3B8', letterSpacing: 1 },

  biometricRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  biometricBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8F5E9', borderRadius: 16, paddingVertical: 14,
  },
  biometricText: { fontFamily: 'Inter_500Medium', fontSize: 14, color: '#2E7D32' },

  socialDivider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  socialLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  socialDividerText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: '#94A3B8' },

  socialRow: { flexDirection: 'row', gap: 12 },
  socialBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 16, paddingVertical: 14,
  },
  socialBtnText: { fontFamily: 'Inter_500Medium', fontSize: 14, color: '#1B2E1D' },

  bottomRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingTop: 32, paddingBottom: 16 },
  bottomText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: '#64748B' },
  createAccountText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#2E7D32' },
});
