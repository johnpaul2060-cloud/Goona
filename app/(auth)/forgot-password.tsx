import { useEffect, useRef, useState } from 'react';
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
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import GoonaIcon from '../../components/ui/GoonaIcon';
import { Icons } from '../../shared/icons';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';

const SCREEN_WIDTH = Dimensions.get('window').width;
const OTP_AVAILABLE_WIDTH = SCREEN_WIDTH - 96;
const OTP_GAP = 8;
const OTP_BOX_SIZE = Math.min(50, Math.floor((OTP_AVAILABLE_WIDTH - OTP_GAP * 5) / 6));

function Spinner() {
  return (
    <View style={spinnerStyles.container}>
      <View style={spinnerStyles.spinner} />
    </View>
  );
}

const spinnerStyles = StyleSheet.create({
  container: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderTopColor: '#2E7D32',
    borderRadius: 9,
  },
});

function PrimaryButton({
  children,
  onPress,
  disabled,
  loading,
}: {
  children: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.primaryBtn, disabled && styles.btnDisabled]}
      activeOpacity={0.9}
      onPress={onPress}
      disabled={disabled}
    >
      <LinearGradient
        colors={['#2E7D32', '#43A047']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.primaryBtnGradient}
        pointerEvents="none"
      >
        {loading ? <Spinner /> : children}
      </LinearGradient>
    </TouchableOpacity>
  );
}

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: '', color: '#E2E8F0' };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: 'Weak', color: '#EF4444' };
  if (score === 2) return { score: 2, label: 'Medium', color: '#F59E0B' };
  return { score: 3, label: 'Strong Password', color: '#16A34A' };
}

function StrengthMeter({ password }: { password: string }) {
  const { score, label, color } = getPasswordStrength(password);
  if (!password) return null;

  return (
    <View style={styles.strengthWrap}>
      <View style={styles.strengthBar}>
        {[1, 2, 3].map((seg) => (
          <View
            key={seg}
            style={[
              styles.strengthSeg,
              { backgroundColor: seg <= score ? color : '#E2E8F0' },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.strengthLabel, { color }]}>{label}</Text>
    </View>
  );
}

function OTPInput({ otp, setOtp }: { otp: string[]; setOtp: (val: string[]) => void }) {
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleOtpChange = (text: string, index: number) => {
    const cleanText = text.replace(/[^0-9]/g, '');

    const updatedOtp = [...otp];
    updatedOtp[index] = cleanText;

    setOtp(updatedOtp);

    if (cleanText && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      const updatedOtp = [...otp];
      updatedOtp[index - 1] = '';
      setOtp(updatedOtp);
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.otpRow}>
      {otp.map((digit, i) => (
        <TextInput
          key={i}
          ref={(ref) => { inputRefs.current[i] = ref; }}
          style={[styles.otpBox, digit.length > 0 && styles.otpBoxFilled]}
          value={digit}
          onChangeText={(text) => handleOtpChange(text, i)}
          onKeyPress={({ nativeEvent }) => handleKeyDown(nativeEvent.key, i)}
          keyboardType="number-pad"
          maxLength={1}
          autoFocus={i === 0}
          selectTextOnFocus
        />
      ))}
    </View>
  );
}

export default function ForgotPasswordScreen() {
  const [currentStep, setCurrentStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(42);
  const [canResend, setCanResend] = useState(false);

  const countdownRef = useRef(countdown);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scaleAnim = useRef(new Animated.Value(0)).current;

  const [emailFocused, setEmailFocused] = useState(false);
  const [newPassFocused, setNewPassFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);

  useEffect(() => {
    countdownRef.current = countdown;
  });

  useEffect(() => {
    if (currentStep === 2) {
      startCountdown();
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [currentStep]);

  useEffect(() => {
    if (currentStep === 4) {
      scaleAnim.setValue(0);
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 60,
        useNativeDriver: true,
      }).start();
    }
  }, [currentStep]);

  const startCountdown = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setCountdown(42);
    setCanResend(false);
    intervalRef.current = setInterval(() => {
      if (countdownRef.current <= 1) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setCanResend(true);
        setCountdown(0);
      } else {
        setCountdown((c) => c - 1);
      }
    }, 1000);
  };

  const handleSendResetCode = () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email or phone number');
      return;
    }
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setCurrentStep(2);
    }, 1200);
  };

  const handleVerifyCode = () => {
    const code = otp.join('');

    console.log('OTP:', otp);
    console.log('OTP Joined:', code);
    console.log('OTP Length:', code.length);

    if (code.length !== 6) {
      Alert.alert(
        'Incomplete Code',
        'Please enter all 6 digits'
      );
      return;
    }

    setCurrentStep(3);
  };

  const handleResetPassword = () => {
    if (newPassword !== confirmPassword || !newPassword) return;
    setCurrentStep(4);
  };

  const confirmMatch = confirmPassword.length > 0 ? newPassword === confirmPassword : null;

  const goBack = () => {
    if (currentStep > 1) {
      if (currentStep === 2) {
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  const renderTopNav = () => (
    <View style={styles.topNav}>
      <TouchableOpacity style={styles.navBack} onPress={goBack}>
        <GoonaIcon icon={Icons.arrowLeft} size={24} color="#1B1B1B" />
      </TouchableOpacity>
      <View style={styles.navLogo}>
        <Svg width="24" height="24" viewBox="0 0 24 24">
          <Path d="M12 2C12 2 7 8 7 12C7 14.5 8.5 17 10 18.5C9.5 17 9 16 9 15C9 11.5 11 7 12 2Z" fill="#2E7D32" />
          <Path d="M12 2C12 2 17 8 17 12C17 14.5 15.5 17 14 18.5C14.5 17 15 16 15 15C15 11.5 13 7 12 2Z" fill="#388E3C" />
        </Svg>
        <Text style={styles.navLogoText}>GOONA</Text>
      </View>
      <View style={styles.navSpacer} />
    </View>
  );

  return (
    <SafeAreaView style={styles.rootContainer} edges={['top']}>
      <View style={styles.decorativeLayer} pointerEvents="none">
        <View style={styles.blob} />
        <View style={styles.contour1} />
        <View style={styles.contour2} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollInner}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderTopNav()}

          {/* STEP 1: Request Reset */}
          {currentStep === 1 && (
            <View>
              <View style={styles.headerSection}>
                <Text style={styles.headerLabel}>Account Recovery</Text>
                <Text style={styles.headerTitle}>Forgot Your{'\n'}Password?</Text>
                <Text style={styles.headerSub}>
                  Enter your email or phone number and we'll send you a secure reset code.
                </Text>
              </View>

              <View style={styles.illWrap}>
                <View style={styles.illGlow} pointerEvents="none" />
                <Svg width="200" height="140" viewBox="0 0 200 140">
                  <Rect x="50" y="30" width="100" height="100" rx="16" fill="white" stroke="#E2E8F0" strokeWidth="0.8" />
                  <Rect x="65" y="44" width="70" height="12" rx="4" fill="#E8F5E9" />
                  <Rect x="65" y="64" width="50" height="6" rx="3" fill="#F1F5F9" />
                  <Rect x="65" y="76" width="60" height="6" rx="3" fill="#F1F5F9" />
                  <Rect x="65" y="88" width="40" height="6" rx="3" fill="#F1F5F9" />
                  <Circle cx="140" cy="50" r="18" fill="white" stroke="#E2E8F0" strokeWidth="0.8" />
                  <Path d="M140 42L136 46V54L140 58L144 54V46L140 42Z" stroke="#2E7D32" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
                  <Path d="M138 50L140 52L142.5 48" stroke="#2E7D32" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </Svg>
              </View>

              <View style={styles.formCard}>
                <View style={[styles.fieldWrap, emailFocused && styles.fieldWrapFocused]}>
                  <View style={styles.fieldIcon}>
                    <GoonaIcon icon={Icons.mail} size={20} color="#A0AEA1" />
                  </View>
                  <View style={styles.fieldInputWrap}>
                    <Text style={styles.fieldLabel}>Email / Phone</Text>
                    <TextInput
                      style={styles.fieldInput}
                      placeholder="Email Address or Phone Number"
                      placeholderTextColor="#A0AEA1"
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      autoComplete="username"
                      onFocus={() => {
                        console.log('EMAIL FOCUS');
                        setEmailFocused(true);
                      }}
                      onBlur={() => {
                        console.log('EMAIL BLUR');
                        setEmailFocused(false);
                      }}
                    />
                  </View>
                </View>

                <PrimaryButton
                  onPress={handleSendResetCode}
                  disabled={!email.trim() || isSending}
                  loading={isSending}
                >
                  {!isSending && <GoonaIcon icon={Icons.send} size={20} color="white" />}
                  <Text style={styles.primaryBtnText}>{isSending ? 'Sending...' : 'Send Reset Code'}</Text>
                </PrimaryButton>

                <View style={styles.securityPill}>
                  <GoonaIcon icon={Icons.shield} size={14} color="#2E7D32" />
                  <Text style={styles.securityPillText}>Secure encrypted recovery</Text>
                </View>
              </View>
            </View>
          )}

          {/* STEP 2: OTP Verification */}
          {currentStep === 2 && (
            <View>
              <View style={styles.headerSection}>
                <Text style={styles.headerLabel}>OTP Verification</Text>
                <Text style={styles.headerTitle}>Verify Reset{'\n'}Code</Text>
                <Text style={styles.headerSub}>
                  We sent a 6-digit secure code to your device.
                </Text>
              </View>

              <View style={styles.formCard}>
                <OTPInput otp={otp} setOtp={setOtp} />

                <View style={styles.countdownRow}>
                  <Text style={styles.countdownText}>
                    {canResend ? (
                      <Text style={styles.resendLink} onPress={startCountdown}>
                        Resend Code
                      </Text>
                    ) : (
                      <>
                        Resend code in{' '}
                        <Text style={styles.countdownTimer}>
                          00:{String(countdown).padStart(2, '0')}
                        </Text>
                      </>
                    )}
                  </Text>
                </View>

                {isVerifying && (
                  <View style={styles.verifyStatus}>
                    <Spinner />
                    <Text style={styles.verifyText}>Verifying securely...</Text>
                  </View>
                )}

                <PrimaryButton
                  onPress={handleVerifyCode}
                  disabled={otp.some((d) => !d) || isVerifying}
                  loading={isVerifying}
                >
                  <Text style={styles.primaryBtnText}>{isVerifying ? 'Verifying...' : 'Verify Code'}</Text>
                </PrimaryButton>

                <View style={styles.securityPill}>
                  <GoonaIcon icon={Icons.shield} size={14} color="#2E7D32" />
                  <Text style={styles.securityPillText}>End-to-end encrypted</Text>
                </View>
              </View>
            </View>
          )}

          {/* STEP 3: New Password */}
          {currentStep === 3 && (
            <View>
              <View style={styles.headerSection}>
                <Text style={styles.headerLabel}>New Password</Text>
                <Text style={styles.headerTitle}>Create a Strong{'\n'}Password</Text>
                <Text style={styles.headerSub}>
                  Your new password should be secure and easy for you to remember.
                </Text>
              </View>

              <View style={styles.formCard}>
                <View style={[styles.fieldWrap, newPassFocused && styles.fieldWrapFocused]}>
                  <View style={styles.fieldIcon}>
                    <GoonaIcon icon={Icons.lock} size={20} color="#A0AEA1" />
                  </View>
                  <View style={styles.fieldInputWrap}>
                    <Text style={styles.fieldLabel}>New Password</Text>
                    <TextInput
                      style={styles.fieldInput}
                      placeholder="Create a strong password"
                      placeholderTextColor="#A0AEA1"
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoComplete="new-password"
                      onFocus={() => setNewPassFocused(true)}
                      onBlur={() => setNewPassFocused(false)}
                    />
                  </View>
                  <TouchableOpacity style={styles.fieldRight} onPress={() => setShowPassword(!showPassword)}>
                    {showPassword ? <GoonaIcon icon={Icons.eye} size={20} color="#A0AEA1" /> : <GoonaIcon icon={Icons.eyeOff} size={20} color="#A0AEA1" />}
                  </TouchableOpacity>
                </View>

                <StrengthMeter password={newPassword} />

                <View style={[styles.fieldWrap, { marginTop: 14 }, confirmFocused && styles.fieldWrapFocused]}>
                  <View style={styles.fieldIcon}>
                    <GoonaIcon icon={Icons.shield} size={20} color="#A0AEA1" />
                  </View>
                  <View style={styles.fieldInputWrap}>
                    <Text style={styles.fieldLabel}>Confirm Password</Text>
                    <TextInput
                      style={styles.fieldInput}
                      placeholder="Re-enter your password"
                      placeholderTextColor="#A0AEA1"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showConfirm}
                      autoCapitalize="none"
                      autoComplete="new-password"
                      onFocus={() => setConfirmFocused(true)}
                      onBlur={() => setConfirmFocused(false)}
                    />
                  </View>
                  <View style={styles.fieldRight}>
                    {confirmMatch === true && <GoonaIcon icon={Icons.circleCheck} size={20} color="#43A047" />}
                    {confirmMatch === false && <GoonaIcon icon={Icons.circleX} size={20} color="#EF4444" />}
                    {confirmMatch === null && <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 1.4, borderColor: '#CBD5E1' }} />}
                  </View>
                </View>

                <View style={styles.tipsCard}>
                  <View style={styles.tipsIcon}>
                    <GoonaIcon icon={Icons.lightbulb} size={18} color="#2E7D32" />
                  </View>
                  <View>
                    <Text style={styles.tipText}>{'  '}Use 8+ characters</Text>
                    <Text style={styles.tipText}>{'  '}Include numbers</Text>
                    <Text style={styles.tipText}>{'  '}Include symbols</Text>
                  </View>
                </View>

                <PrimaryButton
                  onPress={handleResetPassword}
                  disabled={!newPassword || confirmMatch !== true}
                >
                  <GoonaIcon icon={Icons.shieldCheck} size={20} color="white" />
                  <Text style={styles.primaryBtnText}>Reset Password</Text>
                </PrimaryButton>
              </View>
            </View>
          )}

          {/* STEP 4: Success */}
          {currentStep === 4 && (
            <View style={styles.successContainer}>
              <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <View style={styles.successCircle}>
                  <GoonaIcon icon={Icons.circleCheck} size={36} color="#16A34A" />
                </View>
              </Animated.View>

              <Text style={[styles.headerTitle, { marginTop: 8, textAlign: 'center' }]}>
                Password Reset{'\n'}Successful
              </Text>
              <Text style={[styles.headerSub, { marginTop: 8, textAlign: 'center', maxWidth: 280, alignSelf: 'center' }]}>
                Your GOONA account is now secure again.
              </Text>

              <View style={styles.successCard}>
                <View style={styles.successRow}>
                  <View style={[styles.successRowIcon, { backgroundColor: '#F0FDF4' }]}>
                    <GoonaIcon icon={Icons.shieldCheck} size={18} color="#16A34A" />
                  </View>
                  <Text style={styles.successRowLabel}>Secure Access Restored</Text>
                </View>
                <View style={styles.successRow}>
                  <View style={[styles.successRowIcon, { backgroundColor: '#EEF3FF' }]}>
                    <GoonaIcon icon={Icons.shield} size={18} color="#1A56FF" />
                  </View>
                  <Text style={styles.successRowLabel}>Login Protection Active</Text>
                </View>
                <View style={styles.successRow}>
                  <View style={[styles.successRowIcon, { backgroundColor: '#FFF8E1' }]}>
                    <GoonaIcon icon={Icons.eye} size={18} color="#F9A825" />
                  </View>
                  <Text style={styles.successRowLabel}>Offline Sync Preserved</Text>
                </View>
              </View>

              <PrimaryButton onPress={() => router.replace('/(auth)/login')}>
                <Text style={styles.primaryBtnText}>Continue to Login</Text>
              </PrimaryButton>

              <TouchableOpacity onPress={() => router.replace('/(tabs)')}>
                <Text style={styles.secondaryLink}>Back to Home</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#F8FAF7',
  },
  decorativeLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
    elevation: 0,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollInner: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    flexGrow: 1,
  },

  /* Background decorations */
  blob: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(232,245,233,0.45)',
  },
  contour1: {
    position: 'absolute',
    top: '10%',
    right: '-15%',
    width: 380,
    height: 130,
    borderWidth: 1,
    borderColor: '#2E7D32',
    borderBottomWidth: 0,
    borderRadius: 200,
    opacity: 0.04,
    transform: [{ rotate: '10deg' }],
  },
  contour2: {
    position: 'absolute',
    bottom: '20%',
    left: '-10%',
    width: 300,
    height: 100,
    borderWidth: 1,
    borderColor: '#2E7D32',
    borderTopWidth: 0,
    borderRadius: 200,
    opacity: 0.04,
    transform: [{ rotate: '-8deg' }],
  },

  /* Top Nav */
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  navBack: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  navLogoText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: '#1B1B1B',
  },
  navSpacer: {
    width: 36,
  },

  /* Header */
  headerSection: {
    marginTop: 28,
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2E7D32',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 32,
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

  /* Illustration */
  illWrap: {
    alignItems: 'center',
    marginTop: 28,
    position: 'relative',
  },
  illGlow: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 180,
    height: 180,
    marginLeft: -90,
    marginTop: -90,
    borderRadius: 90,
    backgroundColor: 'rgba(232,245,233,0.50)',
  },

  /* Form Card */
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.06,
    shadowRadius: 40,
    elevation: 4,
    zIndex: 100,
    position: 'relative',
  },

  /* Field */
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
  fieldWrapFocused: {
    borderColor: '#2E7D32',
  },
  fieldIcon: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldInputWrap: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'column',
    minWidth: 0,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#A0AEA1',
    lineHeight: 12,
    marginBottom: 1,
    letterSpacing: 0.3,
  },
  fieldInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1B1B1B',
    padding: 0,
    fontFamily: 'Inter_400Regular',
  },
  fieldRight: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 4,
  },

  /* Primary Button */
  primaryBtn: {
    width: '100%',
    height: 58,
    borderRadius: 18,
    marginTop: 22,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 6,
    overflow: 'hidden',
    zIndex: 200,
    position: 'relative',
  },
  primaryBtnGradient: {
    width: '100%',
    height: 58,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  primaryBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  btnDisabled: {
    opacity: 0.5,
  },

  /* Security Pill */
  securityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 16,
  },
  securityPillText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
  },

  /* OTP */
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: OTP_GAP,
    marginTop: 24,
  },
  otpBox: {
    width: OTP_BOX_SIZE,
    height: 56,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAF7',
    fontSize: 20,
    fontWeight: '700',
    color: '#1B1B1B',
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
  },
  otpBoxFilled: {
    borderColor: '#2E7D32',
    backgroundColor: '#F0FDF4',
  },

  /* Countdown */
  countdownRow: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 4,
  },
  countdownText: {
    fontSize: 14,
    color: '#616161',
  },
  countdownTimer: {
    fontWeight: '600',
    color: '#2E7D32',
  },
  resendLink: {
    fontWeight: '600',
    color: '#2E7D32',
    textDecorationLine: 'underline',
  },

  /* Verify Status */
  verifyStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 16,
  },
  verifyText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#616161',
  },

  /* Password Strength */
  strengthWrap: {
    marginTop: 14,
  },
  strengthBar: {
    flexDirection: 'row',
    gap: 6,
  },
  strengthSeg: {
    flex: 1,
    height: 4,
    borderRadius: 100,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
    marginTop: 5,
  },

  /* Tips */
  tipsCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#F1F8F2',
    borderRadius: 18,
    padding: 16,
    marginTop: 18,
  },
  tipsIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipText: {
    fontSize: 12,
    color: '#616161',
    lineHeight: 22,
  },

  /* Success */
  successContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 40,
    elevation: 4,
  },
  successCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginTop: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 30,
    elevation: 4,
  },
  successRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 10,
  },
  successRowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successRowLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  secondaryLink: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    color: '#616161',
    marginTop: 16,
    paddingVertical: 8,
  },
});
