import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, SafeAreaView, Dimensions, Easing } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import Svg, { Path, Circle } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

const COLORS = {
  bg: '#F8FAF7',
  greenDark: '#2E7D32',
  greenMedium: '#388E3C',
  greenDeep: '#1B5E20',
  greenLight: '#43A047',
  greenPale: '#C8D6C9',
  greenDot: '#A5D6A7',
  textDark: '#1B1B1B',
  textMuted: '#616161',
  textBottom: '#A0AEA1',
  curveBorder: '#E8F5E9',
};

export default function SplashScreen() {
  const [activeDot, setActiveDot] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveDot((prev) => (prev + 1) % 3);
    }, 600);
    const timeout = setTimeout(() => {
      router.replace('/(onboarding)/onboarding-1');
    }, 2800);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    pulseAnim.setValue(0);
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 0,
        duration: 250,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [activeDot]);

  const getDotStyle = (index: number) => {
    const isActive = index === activeDot;
    const scale = pulseAnim.interpolate({
      inputRange: [0, 1],
      outputRange: isActive ? [1, 1.25] : [0.85, 0.85],
    });
    return {
      backgroundColor: isActive ? COLORS.greenDark : COLORS.greenPale,
      shadowColor: isActive ? COLORS.greenDark : 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: isActive ? 0.35 : 0,
      shadowRadius: isActive ? 10 : 0,
      elevation: isActive ? 6 : 0,
      transform: [{ scale }],
    };
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.dotGrid} />
      <View style={styles.centerGlow} />

      <View style={styles.curvesContainer}>
        <View style={[styles.curve, styles.curve1]} />
        <View style={[styles.curve, styles.curve2]} />
        <View style={[styles.curve, styles.curve3]} />
        <View style={[styles.curve, styles.curve4]} />
        <View style={[styles.curve, styles.curve5]} />
      </View>

      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <View style={styles.logoContainer}>
          <View style={styles.logoGlowLarge} />
          <View style={styles.logoGlowMedium} />
          <Svg width={140} height={140} viewBox="0 0 140 140">
            <Path
              d="M70 18C70 18 42 42 42 70C42 84 49 96 60 104C54 98 50 90 50 80C50 62 64 48 70 18Z"
              fill={COLORS.greenDark}
            />
            <Path
              d="M70 18C70 18 98 42 98 70C98 84 91 96 80 104C86 98 90 90 90 80C90 62 76 48 70 18Z"
              fill={COLORS.greenMedium}
            />
            <Path
              d="M68 120C68 120 68 108 70 104C72 108 72 120 72 120H68Z"
              fill={COLORS.greenDeep}
            />
            <Path
              d="M70 22C70 22 48 46 48 70C48 80 54 90 62 96C56 88 52 78 52 68C52 50 66 32 70 22Z"
              fill={COLORS.greenLight}
              fillOpacity={0.35}
            />
            <Circle cx={56} cy={72} r={2.5} fill={COLORS.greenDot} fillOpacity={0.7} />
            <Circle cx={82} cy={66} r={2} fill={COLORS.greenDot} fillOpacity={0.5} />
            <Circle cx={64} cy={84} r={1.8} fill={COLORS.greenDot} fillOpacity={0.6} />
            <Circle cx={76} cy={56} r={1.5} fill={COLORS.greenDot} fillOpacity={0.4} />
          </Svg>
        </View>

        <Text style={styles.appName}>GOONA</Text>

        <View style={styles.taglineRow}>
          <View style={styles.taglineLine} />
          <Text style={styles.tagline}>Farm Smarter Every Batch</Text>
          <View style={styles.taglineLine} />
        </View>

        <View style={styles.loadingDots}>
          {[0, 1, 2].map((i) => (
            <Animated.View key={i} style={[styles.dot, getDotStyle(i)]} />
          ))}
        </View>
      </Animated.View>

      <Text style={styles.bottomText}>Offline-First Livestock Management</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    position: 'relative',
  },
  dotGrid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.04,
  },
  centerGlow: {
    position: 'absolute',
    top: height / 2 - 210,
    left: width / 2 - 210,
    width: 420,
    height: 420,
    borderRadius: 210,
    backgroundColor: 'rgba(46,125,50,0.10)',
  },
  curvesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  curve: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: COLORS.curveBorder,
    opacity: 0.35,
  },
  curve1: {
    width: 600,
    height: 200,
    top: '10%',
    left: -60,
    borderRadius: 300,
    borderBottomWidth: 0,
    transform: [{ rotate: '-8deg' }],
  },
  curve2: {
    width: 500,
    height: 180,
    bottom: '15%',
    right: -80,
    borderRadius: 250,
    borderTopWidth: 0,
    transform: [{ rotate: '6deg' }],
  },
  curve3: {
    width: 350,
    height: 120,
    top: '38%',
    right: -100,
    borderRadius: 175,
    borderBottomWidth: 0,
    opacity: 0.2,
    transform: [{ rotate: '15deg' }],
  },
  curve4: {
    width: 400,
    height: 140,
    bottom: '30%',
    left: -80,
    borderRadius: 200,
    borderTopWidth: 0,
    opacity: 0.2,
    transform: [{ rotate: '-12deg' }],
  },
  curve5: {
    width: 280,
    height: 100,
    top: '22%',
    left: '5%',
    borderRadius: 140,
    borderBottomWidth: 0,
    opacity: 0.15,
    transform: [{ rotate: '-20deg' }],
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  logoGlowLarge: {
    position: 'absolute',
    width: 420,
    height: 420,
    borderRadius: 210,
    backgroundColor: 'rgba(232,245,233,0.30)',
  },
  logoGlowMedium: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(232,245,233,0.70)',
  },
  appName: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 34,
    letterSpacing: 2,
    color: COLORS.textDark,
    lineHeight: 38,
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 10,
  },
  taglineLine: {
    width: 24,
    height: 1,
    backgroundColor: '#DDE5DD',
  },
  tagline: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    letterSpacing: 1,
    color: COLORS.textMuted,
  },
  loadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 60,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  bottomText: {
    position: 'absolute',
    bottom: 44,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    letterSpacing: 0.5,
    color: COLORS.textBottom,
  },
});
