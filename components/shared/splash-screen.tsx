import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Svg, { Circle, Path } from 'react-native-svg';

interface SplashScreenProps {
  onDone?: () => void;
}

export default function SplashScreen({ onDone }: SplashScreenProps) {
  const [activeDot, setActiveDot] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveDot((prev) => (prev + 1) % 3);
    }, 600);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!onDone) return;
    const timer = setTimeout(onDone, 2500);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.bgLayer} pointerEvents="none">
        <View style={styles.centerGlow} />
        <View style={styles.curve1} />
        <View style={styles.curve2} />
        <View style={styles.curve3} />
        <View style={styles.curve4} />
        <View style={styles.curve5} />
      </View>

      <View style={styles.content}>
        <View style={styles.logoSection}>
          <View style={styles.logoGlowLarge} />
          <View style={styles.logoGlowMedium} />
          <Svg width={120} height={120} viewBox="0 0 140 140">
            <Path d="M70 18C70 18 42 42 42 70C42 84 49 96 60 104C54 98 50 90 50 80C50 62 64 48 70 18Z" fill="#2E7D32" />
            <Path d="M70 18C70 18 98 42 98 70C98 84 91 96 80 104C86 98 90 90 90 80C90 62 76 48 70 18Z" fill="#388E3C" />
            <Path d="M68 120C68 120 68 108 70 104C72 108 72 120 72 120H68Z" fill="#1B5E20" />
            <Path d="M70 22C70 22 48 46 48 70C48 80 54 90 62 96C56 88 52 78 52 68C52 50 66 32 70 22Z" fill="#43A047" opacity={0.35} />
            <Circle cx={56} cy={72} r={2.5} fill="#A5D6A7" opacity={0.7} />
            <Circle cx={82} cy={66} r={2} fill="#A5D6A7" opacity={0.5} />
            <Circle cx={64} cy={84} r={1.8} fill="#A5D6A7" opacity={0.6} />
            <Circle cx={76} cy={56} r={1.5} fill="#A5D6A7" opacity={0.4} />
          </Svg>
        </View>

        <Text style={styles.appName}>GOONA</Text>

        <View style={styles.taglineRow}>
          <View style={styles.taglineLine} />
          <Text style={styles.tagline}>Farm Smarter Every Batch</Text>
          <View style={styles.taglineLine} />
        </View>

        <View style={styles.dotsRow}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[styles.dot, activeDot === i ? styles.dotActive : styles.dotInactive]}
            />
          ))}
        </View>
      </View>

      <Text style={styles.bottomText}>Offline-First Livestock Management</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF7',
  },
  bgLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  centerGlow: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 420,
    height: 420,
    marginLeft: -210,
    marginTop: -210,
    borderRadius: 210,
    backgroundColor: 'rgba(46,125,50,0.05)',
  },
  curve1: {
    position: 'absolute',
    width: 600,
    height: 200,
    top: 84,
    left: -78,
    borderWidth: 1.5,
    borderColor: '#E8F5E9',
    borderBottomWidth: 0,
    borderTopLeftRadius: 300,
    borderTopRightRadius: 300,
    opacity: 0.35,
    transform: [{ rotate: '-8deg' }],
  },
  curve2: {
    position: 'absolute',
    width: 500,
    height: 180,
    bottom: 127,
    right: -59,
    borderWidth: 1.5,
    borderColor: '#E8F5E9',
    borderTopWidth: 0,
    borderBottomLeftRadius: 250,
    borderBottomRightRadius: 250,
    opacity: 0.35,
    transform: [{ rotate: '6deg' }],
  },
  curve3: {
    position: 'absolute',
    width: 350,
    height: 120,
    top: '38%',
    right: -105,
    borderWidth: 1.5,
    borderColor: '#E8F5E9',
    borderBottomWidth: 0,
    borderTopLeftRadius: 175,
    borderTopRightRadius: 175,
    opacity: 0.2,
    transform: [{ rotate: '15deg' }],
  },
  curve4: {
    position: 'absolute',
    width: 400,
    height: 140,
    bottom: '30%',
    left: -100,
    borderWidth: 1.5,
    borderColor: '#E8F5E9',
    borderTopWidth: 0,
    borderBottomLeftRadius: 200,
    borderBottomRightRadius: 200,
    opacity: 0.2,
    transform: [{ rotate: '-12deg' }],
  },
  curve5: {
    position: 'absolute',
    width: 280,
    height: 100,
    top: '22%',
    left: '5%',
    borderWidth: 1.5,
    borderColor: '#E8F5E9',
    borderBottomWidth: 0,
    borderTopLeftRadius: 140,
    borderTopRightRadius: 140,
    opacity: 0.15,
    transform: [{ rotate: '-20deg' }],
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  logoSection: {
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
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#1B1B1B',
    lineHeight: 42,
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
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 1,
    color: '#616161',
  },
  dotsRow: {
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
  dotActive: {
    backgroundColor: '#2E7D32',
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
    transform: [{ scale: 1 }],
  },
  dotInactive: {
    backgroundColor: '#C8D6C9',
    transform: [{ scale: 0.85 }],
  },
  bottomText: {
    position: 'absolute',
    bottom: 44,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '400',
    color: '#A0AEA1',
    letterSpacing: 0.5,
    zIndex: 5,
  },
});
