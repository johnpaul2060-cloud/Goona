import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  Alert,
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
import GoonaIcon from '../../components/ui/GoonaIcon';
import { ArrowLeft, User, Lock, Eye, EyeOff, Check, Shield, LogIn, ScanFace, FingerprintPattern, BookOpen, Sprout, Globe, Apple, RefreshCw } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const handleLogin = () => {
    try {
      router.replace('/(tabs)/dashboard');
    } catch {}
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.blob} />
      <View style={styles.contour1} />
      <View style={styles.contour2} />
      <View style={styles.dotGrid} />
      <View style={styles.glowCenter} />

      <View style={styles.chip1} pointerEvents="none">
        <GoonaIcon icon={Shield} size={14} color="#2E7D32" />
        <Text style={styles.chipText}>Secure Access</Text>
      </View>
      <View style={styles.chip2} pointerEvents="none">
        <GoonaIcon icon={RefreshCw} size={14} color="#2E7D32" />
        <Text style={styles.chipText}>Synced Offline</Text>
      </View>
      <View style={styles.chip3} pointerEvents="none">
        <GoonaIcon icon={Shield} size={14} color="#2E7D32" />
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
            <TouchableOpacity style={styles.navBack} onPress={() => { try { router.back() } catch {} }}>
              <GoonaIcon icon={ArrowLeft} size={24} color="#1B1B1B" />
            </TouchableOpacity>
            <View style={styles.navLogo}>
              <Svg width={24} height={24} viewBox="0 0 24 24">
                <Path d="M12 2C12 2 7 8 7 12C7 14.5 8.5 17 10 18.5C9.5 17 9 16 9 15C9 11.5 11 7 12 2Z" fill="#2E7D32" />
                <Path d="M12 2C12 2 17 8 17 12C17 14.5 15.5 17 14 18.5C14.5 17 15 16 15 15C15 11.5 13 7 12 2Z" fill="#388E3C" />
              </Svg>
              <Text style={styles.navLogoText}>GOONA</Text>
            </View>
            <TouchableOpacity onPress={() => Alert.alert('GOONA Support', 'Contact support@goona.ag or visit goona.ag/help')}>
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
                  <GoonaIcon icon={User} size={20} color="#A0AEA1" />
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
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.fieldWrap}>
                <View style={styles.fieldIcon}>
                  <GoonaIcon icon={Lock} size={20} color="#A0AEA1" />
                </View>
                <View style={styles.fieldInputWrap}>
                  <Text style={styles.fieldLabel}>Password</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="Password"
                    placeholderTextColor="#A0AEA1"
                    secureTextEntry={!passwordVisible}
                    autoComplete="current-password"
                    value={password}
                    onChangeText={setPassword}
                  />
                </View>
                <TouchableOpacity
                  style={styles.fieldRight}
                  onPress={() => setPasswordVisible(!passwordVisible)}
                >
                  {passwordVisible ? (
                    <GoonaIcon icon={Eye} size={20} color="#A0AEA1" />
                  ) : (
                    <GoonaIcon icon={EyeOff} size={20} color="#A0AEA1" />
                  )}
                </TouchableOpacity>
              </View>
              <View style={styles.forgotRow}>
              <TouchableOpacity onPress={() => { try { router.push('/(auth)/forgot-password') } catch {} }}>
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
                  {rememberMe && <GoonaIcon icon={Check} size={12} color="white" />}
                </View>
                <Text style={styles.rememberText}>Keep me signed in</Text>
              </TouchableOpacity>
              <View style={styles.secureBadge}>
                <GoonaIcon icon={Shield} size={16} color="#2E7D32" />
                <Text style={styles.secureText}>Secure Login</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.loginBtn} activeOpacity={0.85} onPress={handleLogin}>
              <GoonaIcon icon={LogIn} size={20} color="white" />
              <Text style={styles.loginBtnText}>Login to GOONA</Text>
            </TouchableOpacity>

            <View style={styles.orDivider}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>OR QUICK ACCESS</Text>
              <View style={styles.orLine} />
            </View>

            <View style={styles.bioRow}>
              <TouchableOpacity style={styles.bioBtn} activeOpacity={0.8} onPress={() => Alert.alert('Coming Soon', 'Face ID authentication will be available in the next update.')}>
                <GoonaIcon icon={ScanFace} size={20} color="#1B1B1B" />
                <Text style={styles.bioBtnText}>Face ID</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.bioBtn} activeOpacity={0.8} onPress={() => Alert.alert('Coming Soon', 'Fingerprint authentication will be available in the next update.')}>
                <GoonaIcon icon={FingerprintPattern} size={20} color="#1B1B1B" />
                <Text style={styles.bioBtnText}>Fingerprint</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.qaGrid}>
              <TouchableOpacity style={styles.qaBtn} activeOpacity={0.8} onPress={() => { try { router.push('/goona-academy') } catch {} }}>
                <View style={styles.qaIconWrap}>
                  <GoonaIcon icon={BookOpen} size={22} color="#2E7D32" />
                </View>
                <Text style={styles.qaLabel}>Academy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.qaBtn} activeOpacity={0.8} onPress={() => { try { router.push('/goona-iq') } catch {} }}>
                <View style={styles.qaIconWrap}>
                  <Svg width={22} height={22} viewBox="0 0 22 22">
                    <Path d="M11 2C11 2 6 7 6 11C6 13.5 7.5 15.5 9 17C8.5 15.5 8 14.5 8 13.5C8 10 10 6.5 11 2Z" fill="#2E7D32" />
                    <Path d="M11 2C11 2 16 7 16 11C16 13.5 14.5 15.5 13 17C13.5 15.5 14 14.5 14 13.5C14 10 12 6.5 11 2Z" fill="#388E3C" />
                  </Svg>
                </View>
                <Text style={styles.qaLabel}>GOONA IQ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.qaBtn} activeOpacity={0.8} onPress={() => Alert.alert('Coming Soon', 'Demo Farm experience is under development.')}>
                <View style={styles.qaIconWrap}>
                  <GoonaIcon icon={Sprout} size={22} color="#2E7D32" />
                </View>
                <Text style={styles.qaLabel}>Demo Farm</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.qaBtn} activeOpacity={0.8} onPress={() => Alert.alert('Guest Mode', 'Continue without an account? This limits some features.')}>
                <View style={styles.qaIconWrap}>
                  <GoonaIcon icon={User} size={22} color="#2E7D32" />
                </View>
                <Text style={styles.qaLabel}>Guest</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.socialDivider}>
              <View style={styles.socialLine} />
              <Text style={styles.socialText}>CONTINUE WITH</Text>
              <View style={styles.socialLine} />
            </View>

            <View style={styles.socialRow}>
              <TouchableOpacity style={styles.socialBtn} activeOpacity={0.8} onPress={() => Alert.alert('Coming Soon', 'Google sign-in is under development.')}>
                <GoonaIcon icon={Globe} size={20} color="#1B1B1B" />
                <Text style={styles.socialBtnText}>Google</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialBtn} activeOpacity={0.8} onPress={() => Alert.alert('Coming Soon', 'Apple sign-in is under development.')}>
                <GoonaIcon icon={Apple} size={20} color="#1B1B1B" />
                <Text style={styles.socialBtnText}>Apple</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.bottomRow}>
            <Text style={styles.bottomText}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => { try { router.push('/(auth)/create-account') } catch {} }}>
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
  qaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  qaBtn: {
    width: '47%',
    flexGrow: 1,
    height: 72,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  qaIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F0F7F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qaLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2E7D32',
    letterSpacing: 0.5,
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
