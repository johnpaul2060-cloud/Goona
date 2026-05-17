import { useCallback, useRef, useState } from 'react';
import {
  Animated,
  type DimensionValue,
  Dimensions,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Svg, {
  Circle,
  Ellipse,
  Line,
  Path,
  Rect,
  Text as SvgText,
} from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOTAL_SLIDES = 3;
// Height reserved for the animated text carousel (headline + subtitle)
const TEXT_CAROUSEL_HEIGHT = 160;

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SlideData {
  illustration: React.ComponentType;
  headline: string;
  subtitle: string;
  ctaLabel: string;
  hasSkip: boolean;
  blob1Opacity: number;
  blob2Opacity: number;
  contourTop: { top: string; rotate: string };
  contourBottom: { bottom: string; rotate: string };
  floatingCards: React.ReactNode;
}

interface OnboardingScreenProps {
  onDone: () => void;
  onSignIn?: () => void;
}

interface FloatingCardProps {
  top?: DimensionValue;
  bottom?: DimensionValue;
  left?: DimensionValue;
  right?: DimensionValue;
  iconBg: string;
  icon: React.ReactNode;
  label: string;
  value?: string;
}

/* ------------------------------------------------------------------ */
/*  Reusable sub-components                                            */
/* ------------------------------------------------------------------ */

function FloatingCard({ top, bottom, left, right, iconBg, icon, label, value }: FloatingCardProps) {
  return (
    <View style={[styles.floatCard, { top, bottom, left, right }]}>
      <View style={[styles.floatCardIcon, { backgroundColor: iconBg }]}>{icon}</View>
      {value ? (
        <View>
          <Text style={styles.floatCardLabel}>{label}</Text>
          <Text style={styles.floatCardValue}>{value}</Text>
        </View>
      ) : (
        <Text style={styles.floatCardLabel}>{label}</Text>
      )}
    </View>
  );
}

function DotIndicator({ current, total }: { current: number; total: number }) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={[styles.dot, i === current && styles.dotActive]} />
      ))}
    </View>
  );
}

function MiniLogo() {
  return (
    <View style={styles.miniLogo}>
      <Svg width={28} height={28} viewBox="0 0 28 28">
        <Path d="M14 2C14 2 8 9 8 14C8 17 10 20 12 22C11 20 10 18.5 10 17C10 13 13 8 14 2Z" fill="#2E7D32" />
        <Path d="M14 2C14 2 20 9 20 14C20 17 18 20 16 22C17 20 18 18.5 18 17C18 13 15 8 14 2Z" fill="#388E3C" />
        <Path d="M13.5 24C13.5 24 13.5 22 14 21.5C14.5 22 14.5 24 14.5 24H13.5Z" fill="#1B5E20" />
      </Svg>
      <Text style={styles.miniLogoText}>GOONA</Text>
    </View>
  );
}

function ArrowRightIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18">
      <Path d="M4 9H14" stroke="white" strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M10 5L14 9L10 13" stroke="white" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/* ------------------------------------------------------------------ */
/*  SVG illustrations (unchanged, one per slide)                       */
/* ------------------------------------------------------------------ */

function Slide0Ill() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 300 240">
      <Path d="M0 220H300V240H0Z" fill="#E8F5E9" opacity={0.4} />
      <Path d="M0 200H300V220H0Z" fill="#E8F5E9" opacity={0.2} />
      <Rect x={20} y={170} width={3} height={50} fill="#CBD5E1" rx={1} />
      <Rect x={60} y={175} width={3} height={45} fill="#CBD5E1" rx={1} />
      <Rect x={100} y={170} width={3} height={50} fill="#CBD5E1" rx={1} />
      <Line x1={21} y1={180} x2={102} y2={180} stroke="#CBD5E1" strokeWidth={1.5} />
      <Line x1={21} y1={195} x2={102} y2={195} stroke="#CBD5E1" strokeWidth={1.5} />
      <Ellipse cx={160} cy={195} rx={22} ry={26} fill="#E8F5E9" opacity={0.5} />
      <Path d="M145 185C145 185 150 162 160 162C170 162 175 185 175 185H145Z" stroke="#2E7D32" strokeWidth={1.2} fill="none" />
      <Circle cx={160} cy={150} r={15} fill="#D4A574" />
      <Path d="M145 148C146 138 152 135 160 135C168 135 174 138 175 148" fill="#1B1B1B" />
      <Path d="M153 155C155 157 157 158 160 158C163 158 165 157 167 155" stroke="#8B6F4E" strokeWidth={1} strokeLinecap="round" fill="none" />
      <Circle cx={155} cy={149} r={1.5} fill="#1B1B1B" />
      <Circle cx={165} cy={149} r={1.5} fill="#1B1B1B" />
      <Rect x={195} y={138} width={44} height={34} rx={10} fill="white" stroke="#E2E8F0" strokeWidth={0.8} />
      <Path d="M217 144L212 147V153L217 157L222 153V147L217 144Z" stroke="#2E7D32" strokeWidth={1.4} fill="none" strokeLinejoin="round" />
      <Path d="M214 150L216 152L220 148" stroke="#2E7D32" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Ellipse cx={240} cy={208} rx={10} ry={7} fill="#F5F5F0" stroke="#D4C9B8" strokeWidth={0.8} />
      <Circle cx={237} cy={203} r={3} fill="#F5F5F0" stroke="#D4C9B8" strokeWidth={0.6} />
      <Circle cx={236.5} cy={202.5} r={0.7} fill="#1B1B1B" />
      <Ellipse cx={255} cy={212} rx={8} ry={6} fill="#F5F5F0" stroke="#D4C9B8" strokeWidth={0.8} />
      <Circle cx={253} cy={208} r={2.5} fill="#F5F5F0" />
      <Ellipse cx={232} cy={214} rx={7} ry={5} fill="#F5F5F0" stroke="#D4C9B8" strokeWidth={0.7} />
      <Rect x={268} y={170} width={4} height={50} fill="#8B6F4E" rx={1} />
      <Circle cx={270} cy={158} r={18} fill="#E8F5E9" opacity={0.6} />
    </Svg>
  );
}

function Slide1Ill() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 300 240">
      <Rect x={36} y={68} width={110} height={144} rx={14} fill="white" stroke="#E2E8F0" strokeWidth={0.8} />
      <Rect x={50} y={80} width={82} height={12} rx={4} fill="#E8F5E9" />
      <Rect x={50} y={100} width={60} height={6} rx={3} fill="#F1F5F9" />
      <Rect x={50} y={112} width={72} height={6} rx={3} fill="#F1F5F9" />
      <Rect x={50} y={126} width={82} height={36} rx={6} fill="#F8FAF7" />
      <Path d="M54 154L62 148L70 152L78 140L86 146L94 136L102 142L110 132L118 136L126 130" stroke="#2E7D32" strokeWidth={1.5} strokeLinecap="round" fill="none" />
      <Rect x={50} y={170} width={38} height={28} rx={6} fill="#E8F5E9" />
      <SvgText x={60} y={188} fontSize={8} fill="#2E7D32" fontWeight="700">KPI</SvgText>
      <Rect x={94} y={170} width={38} height={28} rx={6} fill="#F0FDF4" />
      <SvgText x={102} y={188} fontSize={8} fill="#16A34A" fontWeight="700">92%</SvgText>
      <Ellipse cx={212} cy={210} rx={9} ry={6} fill="#F5F5F0" stroke="#D4C9B8" strokeWidth={0.7} />
      <Circle cx={210} cy={205} r={2.5} fill="#F5F5F0" />
      <Ellipse cx={224} cy={214} rx={7} ry={5} fill="#F5F5F0" stroke="#D4C9B8" strokeWidth={0.7} />
      <Ellipse cx={200} cy={214} rx={8} ry={6} fill="#F5F5F0" stroke="#D4C9B8" strokeWidth={0.7} />
      <Path d="M260 205C258 205 255 207 255 210C255 212 256 213 258 213L262 213C262 213 264 208 264 205C264 202 262 203 261 203L260 205Z" fill="#D4C9B8" opacity={0.6} />
      <Circle cx={259} cy={203} r={2} fill="#D4C9B8" opacity={0.5} />
      <Ellipse cx={172} cy={218} rx={6} ry={3} fill="#B8D8E8" opacity={0.5} />
      <Path d="M166 218L164 216L164 220L166 218Z" fill="#B8D8E8" opacity={0.5} />
      <Ellipse cx={182} cy={222} rx={5} ry={2.5} fill="#B8D8E8" opacity={0.4} />
      <Rect x={200} y={60} width={48} height={36} rx={8} fill="white" stroke="#E2E8F0" strokeWidth={0.8} />
      <Rect x={208} y={68} width={32} height={4} rx={2} fill="#E8F5E9" />
      <Rect x={208} y={75} width={24} height={3} rx={1.5} fill="#F1F5F9" />
      <Rect x={208} y={81} width={28} height={3} rx={1.5} fill="#F1F5F9" />
      <Rect x={190} y={136} width={44} height={30} rx={8} fill="white" stroke="#E2E8F0" strokeWidth={0.8} />
      <Rect x={198} y={144} width={28} height={4} rx={2} fill="#FFF1F2" />
      <Rect x={198} y={151} width={20} height={3} rx={1.5} fill="#F1F5F9" />
      <Rect x={198} y={157} width={24} height={3} rx={1.5} fill="#F1F5F9" />
    </Svg>
  );
}

function Slide2Ill() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 300 240">
      <Rect x={40} y={72} width={100} height={120} rx={14} fill="white" stroke="#E2E8F0" strokeWidth={0.8} />
      <Rect x={54} y={84} width={72} height={20} rx={8} fill="#E8F5E9" />
      <SvgText x={64} y={97} fontSize={8} fill="#2E7D32" fontWeight="700">Savings Wallet</SvgText>
      <SvgText x={54} y={120} fontSize={18} fill="#1B1B1B" fontWeight="800">₦124.5K</SvgText>
      <SvgText x={54} y={130} fontSize={7} fill="#94A3B8">Current balance</SvgText>
      <Rect x={54} y={140} width={72} height={8} rx={4} fill="#F1F5F9" />
      <Rect x={54} y={140} width={50} height={8} rx={4} fill="#2E7D32" />
      <SvgText x={54} y={160} fontSize={7} fill="#94A3B8">Reinvestment Goal: ₦300K</SvgText>
      <Circle cx={176} cy={148} r={12} fill="#F9A825" fillOpacity={0.15} stroke="#F9A825" strokeWidth={1.2} />
      <SvgText x={172} y={152} fontSize={12} fill="#F9A825" fontWeight="700">₦</SvgText>
      <Circle cx={200} cy={144} r={9} fill="#F9A825" fillOpacity={0.1} stroke="#F9A825" strokeWidth={1} />
      <SvgText x={197} y={148} fontSize={9} fill="#F9A825" fontWeight="700">₦</SvgText>
      <Rect x={150} y={80} width={55} height={48} rx={10} fill="white" stroke="#E2E8F0" strokeWidth={0.8} />
      <Rect x={158} y={88} width={39} height={4} rx={2} fill="#E8F5E9" />
      <Path d="M158 112L166 106L174 110L182 100L190 106L198 96" stroke="#2E7D32" strokeWidth={1.5} strokeLinecap="round" fill="none" />
      <Rect x={36} y={196} width={18} height={14} rx={3} fill="#E8F5E9" stroke="#2E7D32" strokeWidth={0.8} />
      <Rect x={8} y={202} width={14} height={8} rx={2} fill="#E8F5E9" stroke="#2E7D32" strokeWidth={0.6} opacity={0.5} />
      <Rect x={62} y={198} width={14} height={12} rx={2} fill="#E8F5E9" stroke="#2E7D32" strokeWidth={0.6} opacity={0.5} />
      <Rect x={260} y={190} width={3} height={20} fill="#8B6F4E" rx={1} />
      <Circle cx={261} cy={182} r={10} fill="#E8F5E9" opacity={0.5} />
      <Rect x={278} y={194} width={2.5} height={16} fill="#8B6F4E" rx={1} />
      <Circle cx={279} cy={187} r={8} fill="#E8F5E9" opacity={0.4} />
    </Svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Slide data (separated from UI rendering)                           */
/* ------------------------------------------------------------------ */

function ShieldIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14">
      <Path d="M7 2L4 4V8C4 10.5 7 12 7 12C7 12 10 10.5 10 8V4L7 2Z" stroke="#16A34A" strokeWidth={1.2} fill="none" />
      <Path d="M5.5 7.5L6.5 8.5L9 6" stroke="#16A34A" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

function SyncIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14">
      <Path d="M3 7C3 4.5 5 3 7 3C8.5 3 9.5 3.5 10 4.5" stroke="#1A56FF" strokeWidth={1.2} strokeLinecap="round" />
      <Path d="M11 7C11 9.5 9 11 7 11C5.5 11 4.5 10.5 4 9.5" stroke="#1A56FF" strokeWidth={1.2} strokeLinecap="round" />
    </Svg>
  );
}

function HeartIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14">
      <Path d="M7 2L4 4V8C4 10.5 7 12 7 12C7 12 10 10.5 10 8V4L7 2Z" stroke="#EF4444" strokeWidth={1.2} fill="none" />
      <Path d="M7 6V8" stroke="#EF4444" strokeWidth={1.2} strokeLinecap="round" />
      <Circle cx={7} cy={5} r={0.6} fill="#EF4444" />
    </Svg>
  );
}

function FeedIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14">
      <Rect x={3} y={4} width={8} height={6} rx={1.5} stroke="#2E7D32" strokeWidth={1.2} fill="none" />
      <Path d="M5 7H9" stroke="#2E7D32" strokeWidth={1.2} strokeLinecap="round" />
    </Svg>
  );
}

function MortalityIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14">
      <Path d="M7 3L8.5 7L13 8.5L8.5 10L7 13L5.5 10L1 8.5L5.5 7Z" stroke="#EF4444" strokeWidth={1.2} strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

function CheckIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14">
      <Circle cx={7} cy={7} r={4} stroke="#16A34A" strokeWidth={1.2} fill="none" />
      <Path d="M5.5 7L6.5 8L9 5.5" stroke="#16A34A" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

function CoinIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14">
      <Rect x={3} y={5} width={8} height={6} rx={1.5} stroke="#F9A825" strokeWidth={1.2} fill="none" />
      <Circle cx={7} cy={3} r={2} stroke="#F9A825" strokeWidth={1.2} fill="none" />
    </Svg>
  );
}

function ShieldCheckSmall() {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14">
      <Path d="M7 2L4 4V8C4 10.5 7 12 7 12C7 12 10 10.5 10 8V4L7 2Z" stroke="#16A34A" strokeWidth={1.2} fill="none" />
      <Path d="M6 8L7 9L9 6" stroke="#16A34A" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

function ExpansionIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14">
      <Path d="M3 8C3 4.5 5 3 7 3C9 3 11 4.5 11 8" stroke="#1A56FF" strokeWidth={1.2} strokeLinecap="round" />
      <Path d="M4 12C4 10 5.5 9 7 9C8.5 9 10 10 10 12" stroke="#1A56FF" strokeWidth={1.2} strokeLinecap="round" fill="none" />
    </Svg>
  );
}

const SLIDES: SlideData[] = [
  {
    illustration: Slide0Ill,
    headline: 'Secure Your\nFarm Investment',
    subtitle: 'Track livestock, savings, and farm records safely in one trusted platform.',
    ctaLabel: 'Next',
    hasSkip: true,
    blob1Opacity: 0.5,
    blob2Opacity: 0.3,
    contourTop: { top: '10%', rotate: '10deg' },
    contourBottom: { bottom: '20%', rotate: '-8deg' },
    floatingCards: (
      <>
        <FloatingCard top="28%" right={6} iconBg="#F0FDF4" icon={<ShieldIcon />} label="Records Secured" />
        <FloatingCard bottom="22%" left={4} iconBg="#EEF3FF" icon={<SyncIcon />} label="Offline Sync Active" />
        <FloatingCard bottom="46%" right={8} iconBg="#FFF1F2" icon={<HeartIcon />} label="Farm Protected" />
      </>
    ),
  },
  {
    illustration: Slide1Ill,
    headline: 'Manage Livestock\nSmarter',
    subtitle: 'Monitor batches, feeding, expenses, and growth with real-time insights.',
    ctaLabel: 'Next',
    hasSkip: true,
    blob1Opacity: 0.4,
    blob2Opacity: 0.25,
    contourTop: { top: '15%', rotate: '10deg' },
    contourBottom: { bottom: '15%', rotate: '-8deg' },
    floatingCards: (
      <>
        <FloatingCard top="18%" right={2} iconBg="#E8F5E9" icon={<FeedIcon />} label="Feed" value="218 kg" />
        <FloatingCard bottom="32%" left={2} iconBg="#FFF1F2" icon={<MortalityIcon />} label="Mortality" value="2 birds" />
        <FloatingCard bottom="30%" right={4} iconBg="#F0FDF4" icon={<CheckIcon />} label="Growth +12%" />
      </>
    ),
  },
  {
    illustration: Slide2Ill,
    headline: 'Grow Your\nFarm Wealth',
    subtitle: 'Save consistently, reinvest profits, and build long-term farm success.',
    ctaLabel: 'Create Account',
    hasSkip: false,
    blob1Opacity: 0.45,
    blob2Opacity: 0.25,
    contourTop: { top: '12%', rotate: '6deg' },
    contourBottom: { bottom: '18%', rotate: '-10deg' },
    floatingCards: (
      <>
        <FloatingCard top="24%" right={3} iconBg="#FFFBEB" icon={<CoinIcon />} label="Reinvestment" value="42% Complete" />
        <FloatingCard bottom="34%" left={0} iconBg="#F0FDF4" icon={<ShieldCheckSmall />} label="Savings Goal On Track" />
        <FloatingCard bottom="30%" right={2} iconBg="#EEF3FF" icon={<ExpansionIcon />} label="Farm Expansion" />
      </>
    ),
  },
];

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function OnboardingScreen({ onDone, onSignIn }: OnboardingScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  // Animated value that drives the horizontal offset of the text carousel
  const translateX = useRef(new Animated.Value(0)).current;

  const goToSlide = useCallback(
    (index: number) => {
      const clamped = Math.min(TOTAL_SLIDES - 1, Math.max(0, index));
      setCurrentIndex(clamped);
      Animated.spring(translateX, {
        toValue: -clamped * SCREEN_WIDTH,
        useNativeDriver: true,
        tension: 50,
        friction: 10,
      }).start();
    },
    [translateX],
  );

  const nextSlide = useCallback(() => {
    if (currentIndex < TOTAL_SLIDES - 1) goToSlide(currentIndex + 1);
  }, [currentIndex, goToSlide]);

  // Refs keep the PanResponder closure fresh — avoids stale values
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;
  const goToSlideRef = useRef(goToSlide);
  goToSlideRef.current = goToSlide;

  // PanResponder only captures horizontal swipes, never taps
  //   → onStart returns false so TouchableOpacity children receive taps
  //   → onMove returns true only when horizontal movement exceeds vertical
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > 50 && currentIndexRef.current > 0) {
          goToSlideRef.current(currentIndexRef.current - 1);
        } else if (gesture.dx < -50 && currentIndexRef.current < TOTAL_SLIDES - 1) {
          goToSlideRef.current(currentIndexRef.current + 1);
        }
      },
    }),
  ).current;

  const currentSlide = SLIDES[currentIndex];
  const IllComponent = currentSlide.illustration;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* ---- Background decorations (change per slide, never move) ---- */}
      <View style={[styles.blob1, { opacity: currentSlide.blob1Opacity }]} />
      <View style={[styles.blob2, { opacity: currentSlide.blob2Opacity }]} />
      <View style={[styles.contourLine1, currentSlide.contourTop as any]} />
      <View style={[styles.contourLine2, currentSlide.contourBottom as any]} />

      {/* ---- Swipe-able content area ---- */}
      {/*  Wrapped in PanResponder so users can swipe anywhere in this zone  */}
      <View style={styles.mainArea} {...panResponder.panHandlers}>
        {/* Top bar — fixed, never slides */}
        <View style={styles.topBar}>
          <MiniLogo />
          <View style={styles.topRight}>
            <Text style={styles.version}>v1.0</Text>
            {currentSlide.hasSkip && (
              <TouchableOpacity onPress={() => goToSlide(TOTAL_SLIDES - 1)}>
                <Text style={styles.skipBtn}>Skip</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Illustration — fixed, swaps immediately with currentIndex */}
        <View style={styles.illArea}>
          <View style={styles.illGlow} />
          <View style={styles.illSvgWrap}>
            <IllComponent />
          </View>
          {currentSlide.floatingCards}
        </View>

        {/* ---- Text carousel — ONLY this section slides ---- */}
        <View style={styles.textCarousel}>
          <Animated.View
            style={[
              styles.textTrack,
              { transform: [{ translateX }], width: TOTAL_SLIDES * SCREEN_WIDTH },
            ]}
          >
            {SLIDES.map((s, i) => (
              <View key={i} style={{ width: SCREEN_WIDTH, paddingHorizontal: 24 }}>
                <Text style={styles.headline}>{s.headline}</Text>
                <Text style={styles.subtitle}>{s.subtitle}</Text>
              </View>
            ))}
          </Animated.View>
        </View>
      </View>

      {/* ---- Bottom controls — fixed, always tappable ---- */}
      <DotIndicator current={currentIndex} total={TOTAL_SLIDES} />

      <TouchableOpacity
        style={styles.ctaBtn}
        activeOpacity={0.95}
        onPress={() => {
          if (currentIndex === TOTAL_SLIDES - 1) {
            onDone();
          } else {
            nextSlide();
          }
        }}
      >
        <Text style={styles.ctaText}>{currentSlide.ctaLabel}</Text>
        {currentIndex < TOTAL_SLIDES - 1 && <ArrowRightIcon />}
      </TouchableOpacity>

      <View style={styles.signinRow}>
        <Text style={styles.signinText}>Already have an account? </Text>
        <TouchableOpacity onPress={onSignIn ?? onDone}>
          <Text style={styles.signinLink}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  /* Background decorations — absolute, behind everything */
  blob1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(232,245,233,1)',
    zIndex: 0,
  },
  blob2: {
    position: 'absolute',
    bottom: -40,
    left: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(232,245,233,1)',
    zIndex: 0,
  },
  contourLine1: {
    position: 'absolute',
    width: 380,
    height: 130,
    right: '-20%',
    borderWidth: 1,
    borderColor: '#2E7D32',
    borderBottomWidth: 0,
    borderTopLeftRadius: 190,
    borderTopRightRadius: 190,
    zIndex: 0,
    opacity: 0.12,
  },
  contourLine2: {
    position: 'absolute',
    width: 300,
    height: 100,
    left: '-15%',
    borderWidth: 1,
    borderColor: '#2E7D32',
    borderTopWidth: 0,
    borderBottomLeftRadius: 150,
    borderBottomRightRadius: 150,
    zIndex: 0,
    opacity: 0.12,
  },

  /* Swipe-able middle section */
  mainArea: {
    flex: 1,
    zIndex: 1,
  },

  /* Top bar — fixed */
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 10,
    flexShrink: 0,
    zIndex: 5,
  },
  miniLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniLogoText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1B1B1B',
    letterSpacing: -0.2,
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  version: {
    fontSize: 11,
    fontWeight: '500',
    color: '#CBD5E1',
  },
  skipBtn: {
    fontSize: 14,
    fontWeight: '500',
    color: '#616161',
  },

  /* Illustration — fixed, changes per slide */
  illArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    minHeight: 0,
    paddingVertical: 10,
    zIndex: 1,
  },
  illGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(232,245,233,0.50)',
    zIndex: 0,
  },
  illSvgWrap: {
    width: '100%',
    aspectRatio: 300 / 240,
    zIndex: 1,
  },
  floatCard: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    zIndex: 2,
  },
  floatCardIcon: {
    width: 24,
    height: 24,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  floatCardLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#94A3B8',
  },
  floatCardValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
  },

  /* ---- Text carousel — only this section slides ---- */
  textCarousel: {
    height: TEXT_CAROUSEL_HEIGHT,
    overflow: 'hidden',
    zIndex: 5,
  },
  textTrack: {
    flexDirection: 'row',
    height: '100%',
  },

  /* Bottom text */
  headline: {
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 42,
    color: '#1B1B1B',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 24,
    color: '#616161',
    marginTop: 8,
    textAlign: 'center',
  },

  /* Bottom controls — fixed, outside animated area */
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    zIndex: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DDE5DD',
  },
  dotActive: {
    width: 28,
    borderRadius: 4,
    backgroundColor: '#2E7D32',
  },
  ctaBtn: {
    marginHorizontal: 24,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#2E7D32',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 18,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 6,
    zIndex: 5,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  signinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    marginBottom: 24,
    zIndex: 5,
  },
  signinText: {
    fontSize: 14,
    color: '#A0AEA1',
  },
  signinLink: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
  },
});
