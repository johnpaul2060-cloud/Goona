import { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  SafeAreaView,
  useWindowDimensions,
  PanResponder,
  Pressable,
  TouchableOpacity,
  LayoutChangeEvent,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Path,
  Circle,
  Rect,
  Line,
  Ellipse,
  Text as SvgText,
} from 'react-native-svg';

const TOTAL_SLIDES = 3;

const C = {
  bg: '#FFFFFF',
  greenDark: '#2E7D32',
  greenPale: '#E8F5E9',
  greenVeryPale: '#F0FDF4',
  textDark: '#1B1B1B',
  textMuted: '#616161',
  textBottom: '#A0AEA1',
  dotInactive: '#DDE5DD',
  shieldBlue: '#EEF3FF',
  redLight: '#FFF1F2',
  goldLight: '#FFFBEB',
};

/* ===================================================================
 * TYPES & DATA
 * =================================================================== */
type FloatingCardData = {
  id: string;
  style: { top?: number; bottom?: number; left?: number; right?: number };
  bgIcon: string;
  label: string;
  value?: string;
  icon: React.ReactNode;
};

type SlideData = {
  headline: string;
  subtitle: string;
  illustration: React.ComponentType<{ size: { w: number; h: number } }>;
  floatingCards: FloatingCardData[];
};

/* ===================================================================
 * ICON COMPONENTS
 * =================================================================== */
function ShieldCheckIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
      <Path d="M7 2L4 4V8C4 10.5 7 12 7 12C7 12 10 10.5 10 8V4L7 2Z" stroke="#16A34A" strokeWidth={1.2} fill="none" />
      <Path d="M5.5 7.5L6.5 8.5L9 6" stroke="#16A34A" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}
function SyncIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
      <Path d="M3 7C3 4.5 5 3 7 3C8.5 3 9.5 3.5 10 4.5" stroke="#1A56FF" strokeWidth={1.2} strokeLinecap="round" />
      <Path d="M11 7C11 9.5 9 11 7 11C5.5 11 4.5 10.5 4 9.5" stroke="#1A56FF" strokeWidth={1.2} strokeLinecap="round" />
    </Svg>
  );
}
function ShieldAlertIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
      <Path d="M7 2L4 4V8C4 10.5 7 12 7 12C7 12 10 10.5 10 8V4L7 2Z" stroke="#EF4444" strokeWidth={1.2} fill="none" />
      <Path d="M7 6V8" stroke="#EF4444" strokeWidth={1.2} strokeLinecap="round" />
      <Circle cx={7} cy={5} r={0.6} fill="#EF4444" />
    </Svg>
  );
}
function FeedIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
      <Rect x={3} y={4} width={8} height={6} rx={1.5} stroke="#2E7D32" strokeWidth={1.2} fill="none" />
      <Path d="M5 7H9" stroke="#2E7D32" strokeWidth={1.2} strokeLinecap="round" />
    </Svg>
  );
}
function MortalityIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
      <Path d="M7 3L8.5 7L13 8.5L8.5 10L7 13L5.5 10L1 8.5L5.5 7Z" stroke="#EF4444" strokeWidth={1.2} strokeLinejoin="round" fill="none" />
    </Svg>
  );
}
function CheckCircleIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
      <Circle cx={7} cy={7} r={4} stroke="#16A34A" strokeWidth={1.2} fill="none" />
      <Path d="M5.5 7L6.5 8L9 5.5" stroke="#16A34A" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}
function ReinvestIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
      <Rect x={3} y={5} width={8} height={6} rx={1.5} stroke="#F9A825" strokeWidth={1.2} fill="none" />
      <Circle cx={7} cy={3} r={2} stroke="#F9A825" strokeWidth={1.2} fill="none" />
    </Svg>
  );
}
function SavingsGoalIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
      <Path d="M7 2L4 4V8C4 10.5 7 12 7 12C7 12 10 10.5 10 8V4L7 2Z" stroke="#16A34A" strokeWidth={1.2} fill="none" />
      <Path d="M6 8L7 9L9 6" stroke="#16A34A" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}
function ExpansionIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
      <Path d="M3 8C3 4.5 5 3 7 3C9 3 11 4.5 11 8" stroke="#1A56FF" strokeWidth={1.2} strokeLinecap="round" />
      <Path d="M4 12C4 10 5.5 9 7 9C8.5 9 10 10 10 12" stroke="#1A56FF" strokeWidth={1.2} strokeLinecap="round" fill="none" />
    </Svg>
  );
}
function ArrowRightIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
      <Path d="M4 9H14" stroke="white" strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M10 5L14 9L10 13" stroke="white" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
function GoonaLogoSmall() {
  return (
    <Svg width={28} height={28} viewBox="0 0 28 28" fill="none">
      <Path d="M14 2C14 2 8 9 8 14C8 17 10 20 12 22C11 20 10 18.5 10 17C10 13 13 8 14 2Z" fill="#2E7D32" />
      <Path d="M14 2C14 2 20 9 20 14C20 17 18 20 16 22C17 20 18 18.5 18 17C18 13 15 8 14 2Z" fill="#388E3C" />
      <Path d="M13.5 24C13.5 24 13.5 22 14 21.5C14.5 22 14.5 24 14.5 24H13.5Z" fill="#1B5E20" />
    </Svg>
  );
}

/* ===================================================================
 * SVG ILLUSTRATIONS
 * =================================================================== */
function Slide1Illustration({ size }: { size: { w: number; h: number } }) {
  return (
    <Svg width={size.w} height={size.h} viewBox="0 0 300 240">
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
function Slide2Illustration({ size }: { size: { w: number; h: number } }) {
  return (
    <Svg width={size.w} height={size.h} viewBox="0 0 300 240">
      <Rect x={36} y={68} width={110} height={144} rx={14} fill="white" stroke="#E2E8F0" strokeWidth={0.8} />
      <Rect x={50} y={80} width={82} height={12} rx={4} fill="#E8F5E9" />
      <Rect x={50} y={100} width={60} height={6} rx={3} fill="#F1F5F9" />
      <Rect x={50} y={112} width={72} height={6} rx={3} fill="#F1F5F9" />
      <Rect x={50} y={126} width={82} height={36} rx={6} fill="#F8FAF7" />
      <Path d="M54 154L62 148L70 152L78 140L86 146L94 136L102 142L110 132L118 136L126 130" stroke="#2E7D32" strokeWidth={1.5} strokeLinecap="round" fill="none" />
      <Rect x={50} y={170} width={38} height={28} rx={6} fill="#E8F5E9" />
      <SvgText x={60} y={188} fontSize={8} fill="#2E7D32" fontWeight={700}>KPI</SvgText>
      <Rect x={94} y={170} width={38} height={28} rx={6} fill="#F0FDF4" />
      <SvgText x={102} y={188} fontSize={8} fill="#16A34A" fontWeight={700}>92%</SvgText>
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
function Slide3Illustration({ size }: { size: { w: number; h: number } }) {
  return (
    <Svg width={size.w} height={size.h} viewBox="0 0 300 240">
      <Rect x={40} y={72} width={100} height={120} rx={14} fill="white" stroke="#E2E8F0" strokeWidth={0.8} />
      <Rect x={54} y={84} width={72} height={20} rx={8} fill="#E8F5E9" />
      <SvgText x={64} y={97} fontSize={8} fill="#2E7D32" fontWeight={700}>Savings Wallet</SvgText>
      <SvgText x={54} y={120} fontSize={18} fill="#1B1B1B" fontWeight={800} fontFamily="Inter">₦124.5K</SvgText>
      <SvgText x={54} y={130} fontSize={7} fill="#94A3B8">Current balance</SvgText>
      <Rect x={54} y={140} width={72} height={8} rx={4} fill="#F1F5F9" />
      <Rect x={54} y={140} width={50} height={8} rx={4} fill="#2E7D32" />
      <SvgText x={54} y={160} fontSize={7} fill="#94A3B8">Reinvestment Goal: ₦300K</SvgText>
      <Circle cx={176} cy={148} r={12} fill="#F9A825" fillOpacity={0.15} stroke="#F9A825" strokeWidth={1.2} />
      <SvgText x={172} y={152} fontSize={12} fill="#F9A825" fontWeight={700}>₦</SvgText>
      <Circle cx={200} cy={144} r={9} fill="#F9A825" fillOpacity={0.1} stroke="#F9A825" strokeWidth={1} />
      <SvgText x={197} y={148} fontSize={9} fill="#F9A825" fontWeight={700}>₦</SvgText>
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

/* ===================================================================
 * SLIDE DATA
 * =================================================================== */
const SLIDES: SlideData[] = [
  {
    headline: 'Secure Your\nFarm Investment',
    subtitle: 'Track livestock, savings, and farm records safely in one trusted platform.',
    illustration: Slide1Illustration,
    floatingCards: [
      { id: 's1-c1', style: { top: 28, right: 6 }, bgIcon: C.greenVeryPale, label: 'Records Secured', icon: <ShieldCheckIcon /> },
      { id: 's1-c2', style: { bottom: 22, left: 4 }, bgIcon: C.shieldBlue, label: 'Offline Sync Active', icon: <SyncIcon /> },
      { id: 's1-c3', style: { bottom: 46, right: 8 }, bgIcon: C.redLight, label: 'Farm Protected', icon: <ShieldAlertIcon /> },
    ],
  },
  {
    headline: 'Manage Livestock\nSmarter',
    subtitle: 'Monitor batches, feeding, expenses, and growth with real-time insights.',
    illustration: Slide2Illustration,
    floatingCards: [
      { id: 's2-c1', style: { top: 18, right: 2 }, bgIcon: C.greenPale, label: 'Feed', value: '218 kg', icon: <FeedIcon /> },
      { id: 's2-c2', style: { bottom: 32, left: 2 }, bgIcon: C.redLight, label: 'Mortality', value: '2 birds', icon: <MortalityIcon /> },
      { id: 's2-c3', style: { bottom: 30, right: 4 }, bgIcon: C.greenVeryPale, label: 'Growth +12%', icon: <CheckCircleIcon /> },
    ],
  },
  {
    headline: 'Grow Your\nFarm Wealth',
    subtitle: 'Save consistently, reinvest profits, and build long-term farm success.',
    illustration: Slide3Illustration,
    floatingCards: [
      { id: 's3-c1', style: { top: 24, right: 3 }, bgIcon: C.goldLight, label: 'Reinvestment', value: '42% Complete', icon: <ReinvestIcon /> },
      { id: 's3-c2', style: { bottom: 34, left: 0 }, bgIcon: C.greenVeryPale, label: 'Savings Goal On Track', icon: <SavingsGoalIcon /> },
      { id: 's3-c3', style: { bottom: 30, right: 2 }, bgIcon: C.shieldBlue, label: 'Farm Expansion', icon: <ExpansionIcon /> },
    ],
  },
];

/* ===================================================================
 * FLOATING CARD
 * =================================================================== */
function FloatingCard({
  card,
  containerSize,
}: {
  card: FloatingCardData;
  containerSize: { w: number; h: number };
}) {
  const s = card.style;
  const pos: any = {};
  if (s.top !== undefined) pos.top = (s.top / 240) * containerSize.h;
  if (s.bottom !== undefined) pos.bottom = (s.bottom / 240) * containerSize.h;
  if (s.left !== undefined) pos.left = (s.left / 300) * containerSize.w;
  if (s.right !== undefined) pos.right = (s.right / 300) * containerSize.w;

  return (
    <View style={[styles.floatCard, pos]}>
      <View style={[styles.floatCardIcon, { backgroundColor: card.bgIcon }]}>
        {card.icon}
      </View>
      {card.value ? (
        <View>
          <Text style={styles.floatCardLabel}>{card.label}</Text>
          <Text style={styles.floatCardValue}>{card.value}</Text>
        </View>
      ) : (
        <Text style={styles.floatCardLabel}>{card.label}</Text>
      )}
    </View>
  );
}

/* ===================================================================
 * DOT INDICATORS
 * =================================================================== */
function DotIndicators({ total, active }: { total: number; active: number }) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={[styles.dotIndicator, i === active && styles.dotIndicatorActive]} />
      ))}
    </View>
  );
}

/* ===================================================================
 * SLIDE CONTENT — the part that animates
 *
 * Contains ONLY the elements that should slide horizontally:
 * blobs, illustration, floating cards, headline, subtitle.
 *
 * ROOT CAUSE OF PREVIOUS BUG:
 * Earlier versions either (a) placed everything including top bar and
 * bottom controls inside the track (making the whole screen feel like
 * it was sliding), or (b) placed headline/subtitle outside the track
 * (making them "teleport" while only the illustration moved).
 *
 * FIX:
 * - Top bar (logo, version, skip) → STATIC, outside track
 * - Illustration + headline + subtitle → INSIDE track (slide together)
 * - Dots + buttons + sign-in → STATIC, outside track (driven by currentSlide state)
 *
 * This keeps the app chrome fixed while the actual onboarding content
 * transitions smoothly — exactly like a native PageView.
 * =================================================================== */
function SlideContent({
  slide,
  slideWidth,
}: {
  slide: SlideData;
  slideWidth: number;
}) {
  const [illSize, setIllSize] = useState({ w: slideWidth - 48, h: (slideWidth - 48) * 0.8 });
  const IllComponent = slide.illustration;

  const handleIllLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) setIllSize({ w: width, h: height });
  };

  return (
    <View style={[styles.slideContent, { width: slideWidth }]}>
      {/* Decorative blobs & contour lines */}
      <View style={[styles.blob1, { right: -50, top: -50 }]} />
      <View style={[styles.blob2, { left: -40, bottom: -40 }]} />
      <View style={styles.contourContainer}>
        <View style={[styles.contourLine, styles.cl1]} />
        <View style={[styles.contourLine, styles.cl2]} />
      </View>

      {/* Illustration */}
      <View style={styles.illArea}>
        <View
          style={[
            styles.illGlow,
            {
              width: illSize.w * 0.73,
              height: illSize.w * 0.73,
              borderRadius: (illSize.w * 0.73) / 2,
            },
          ]}
        />
        <View style={styles.illBox} onLayout={handleIllLayout}>
          <IllComponent size={illSize} />
          {slide.floatingCards.map((card) => (
            <FloatingCard key={card.id} card={card} containerSize={illSize} />
          ))}
        </View>
      </View>

      {/* Headline & subtitle (slide with illustration) */}
      <View style={styles.textArea}>
        <Text style={styles.slideHeadline}>{slide.headline}</Text>
        <Text style={styles.slideSub}>{slide.subtitle}</Text>
      </View>
    </View>
  );
}

/* ===================================================================
 * MAIN CAROUSEL
 *
 * LAYOUT (fixed → animated → fixed):
 *
 *   SafeAreaView ─────────────────────────────  NEVER moves
 *   ├── TopBar ───────────────────────────────  logo, version, skip (fixed)
 *   ├── Expanded carouselContainer ───────────  overflow hidden (fixed)
 *   │   └── Animated.View track ──────────────  ONLY this translates
 *   │       ├── SlideContent 0 ───────────────  illustration + text
 *   │       ├── SlideContent 1 ───────────────  illustration + text
 *   │       └── SlideContent 2 ───────────────  illustration + text
 *   └── BottomControls ──────────────────────  dots + button + sign-in (fixed)
 *
 * The PanResponder lives on carouselContainer and the track is the
 * only element with a translateX transform. SafeAreaView and its
 * immediate children never animate, so the screen stays stable.
 * =================================================================== */
export default function OnboardingCarousel() {
  const { width: screenWidth } = useWindowDimensions();
  const [currentSlide, setCurrentSlide] = useState(0);

  const currentSlideRef = useRef(0);
  const screenWidthRef = useRef(screenWidth);
  const isAnimating = useRef(false);
  const translateX = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  const animateButton = useCallback((toValue: number) => {
    Animated.spring(buttonScale, {
      toValue,
      useNativeDriver: true,
      friction: 8,
      tension: 160,
    }).start();
  }, [buttonScale]);

  screenWidthRef.current = screenWidth;
  currentSlideRef.current = currentSlide;

  const goToSlide = useCallback(
    (index: number) => {
      if (isAnimating.current) return;
      const target = Math.max(0, Math.min(index, TOTAL_SLIDES - 1));
      isAnimating.current = true;
      currentSlideRef.current = target;
      setCurrentSlide(target);
      Animated.spring(translateX, {
        toValue: -target * screenWidth,
        useNativeDriver: true,
        friction: 12,
        tension: 120,
      }).start(() => {
        isAnimating.current = false;
      });
    },
    [screenWidth, translateX],
  );

  const nextSlide = useCallback(() => {
    if (currentSlide < TOTAL_SLIDES - 1) goToSlide(currentSlide + 1);
  }, [currentSlide, goToSlide]);

  const skipToLast = useCallback(() => {
    goToSlide(TOTAL_SLIDES - 1);
  }, [goToSlide]);

  const handleCreateAccount = useCallback(() => {
    router.push('/(auth)/create-account');
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 5 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_, g) => {
        if (isAnimating.current) return;
        const idx = currentSlideRef.current;
        const w = screenWidthRef.current;
        let offset = -idx * w + g.dx;
        if (idx === 0) offset = Math.min(offset, g.dx * 0.5);
        if (idx === TOTAL_SLIDES - 1)
          offset = Math.max(offset, -(TOTAL_SLIDES - 1) * w + g.dx * 0.5);
        translateX.setValue(offset);
      },
      onPanResponderRelease: (_, g) => {
        if (isAnimating.current) return;
        const idx = currentSlideRef.current;
        const w = screenWidthRef.current;
        const threshold = w * 0.15;
        if (g.dx < -threshold && idx < TOTAL_SLIDES - 1) {
          goToSlide(idx + 1);
        } else if (g.dx > threshold && idx > 0) {
          goToSlide(idx - 1);
        } else {
          Animated.spring(translateX, {
            toValue: -idx * w,
            useNativeDriver: true,
            friction: 12,
            tension: 120,
          }).start();
        }
      },
    }),
  ).current;

  const slide = SLIDES[currentSlide];
  const trackWidth = TOTAL_SLIDES * screenWidth;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* ===== FIXED TOP BAR ===== */}
      <View style={styles.topBar}>
        <View style={styles.logoMini}>
          <GoonaLogoSmall />
          <Text style={styles.logoMiniText}>GOONA</Text>
        </View>
        <View style={styles.topRight}>
          <Text style={styles.versionText}>v1.0</Text>
          {currentSlide < TOTAL_SLIDES - 1 && (
            <Pressable onPress={skipToLast} hitSlop={8}>
              <Text style={styles.skipBtn}>Skip</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* ===== ANIMATED CONTENT (illustration + text only) ===== */}
      <View style={styles.carouselContainer} {...panResponder.panHandlers}>
        <Animated.View style={[styles.track, { width: trackWidth, transform: [{ translateX }] }]}>
          {SLIDES.map((s, i) => (
            <SlideContent key={i} slide={s} slideWidth={screenWidth} />
          ))}
        </Animated.View>
      </View>

      {/* ===== FIXED BOTTOM CONTROLS ===== */}
      <View style={styles.bottomControls}>
        <DotIndicators total={TOTAL_SLIDES} active={currentSlide} />
        <Animated.View style={{ transform: [{ scale: buttonScale }], width: '100%' }}>
        {currentSlide === TOTAL_SLIDES - 1 ? (
          <Pressable onPress={handleCreateAccount} style={styles.ctaButton}
            onPressIn={() => animateButton(0.97)}
            onPressOut={() => animateButton(1)}>
            <LinearGradient colors={['#2E7D32', '#43A047']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.ctaGradient}>
              <Text style={styles.ctaText}>Create Account</Text>
            </LinearGradient>
          </Pressable>
        ) : (
          <Pressable onPress={nextSlide} style={styles.ctaButton}
            onPressIn={() => animateButton(0.97)}
            onPressOut={() => animateButton(1)}>
            <LinearGradient colors={['#2E7D32', '#43A047']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.ctaGradient}>
              <Text style={styles.ctaText}>Next</Text>
              <ArrowRightIcon />
            </LinearGradient>
          </Pressable>
        )}
        </Animated.View>
        <View style={styles.authRow}>
          <Text style={styles.authText}>
            Already have an account?
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              console.log("Navigate to login");
              router.push("/(auth)/login");
            }}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <Text style={styles.signInText}>
              Sign In
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

/* ===================================================================
 * STYLES
 * =================================================================== */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },

  /* Top bar — static, never animates */
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 10,
    flexShrink: 0,
  },
  logoMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoMiniText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
    color: C.textDark,
    letterSpacing: -0.2,
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  versionText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#CBD5E1',
  },
  skipBtn: {
    fontSize: 14,
    fontWeight: '500',
    color: C.textMuted,
    paddingVertical: 6,
  },

  /* Carousel — clips the track, owns PanResponder */
  carouselContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  track: {
    flexDirection: 'row',
    height: '100%',
  },
  slideContent: {
    height: '100%',
    paddingHorizontal: 24,
    position: 'relative',
  },

  /* Decorative */
  blob1: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(232,245,233,0.50)',
    pointerEvents: 'none',
  },
  blob2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(232,245,233,0.30)',
    pointerEvents: 'none',
  },
  contourContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.12,
    overflow: 'hidden',
    pointerEvents: 'none',
  },
  contourLine: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: '#2E7D32',
  },
  cl1: {
    width: 380,
    height: 130,
    top: '10%',
    right: '-20%',
    borderBottomWidth: 0,
    transform: [{ rotate: '10deg' }],
  },
  cl2: {
    width: 300,
    height: 100,
    bottom: '20%',
    left: '-15%',
    borderTopWidth: 0,
    transform: [{ rotate: '-8deg' }],
  },

  /* Illustration area */
  illArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  illGlow: {
    position: 'absolute',
    backgroundColor: 'rgba(232,245,233,0.50)',
    pointerEvents: 'none',
  },
  illBox: {
    width: '100%',
    aspectRatio: 300 / 240,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Floating cards */
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
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
    zIndex: 2,
  },
  floatCardIcon: {
    width: 24,
    height: 24,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
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

  /* Text area (headline + subtitle) */
  textArea: {
    flexShrink: 0,
    paddingBottom: 4,
    alignItems: 'center',
    width: '100%',
  },
  slideHeadline: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 34,
    lineHeight: 42,
    color: C.textDark,
    letterSpacing: -0.3,
    textAlign: 'center',
    width: '100%',
  },
  slideSub: {
    fontSize: 15,
    lineHeight: 24,
    color: C.textMuted,
    marginTop: 8,
    textAlign: 'center',
    width: '100%',
    paddingHorizontal: 8,
  },

  /* Bottom controls — static, driven by currentSlide state */
  bottomControls: {
    flexShrink: 0,
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center',
    width: '100%',
    zIndex: 10,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 22,
  },
  dotIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.dotInactive,
  },
  dotIndicatorActive: {
    width: 28,
    borderRadius: 4,
    backgroundColor: C.greenDark,
  },
  ctaButton: {
    width: '100%',
    height: 56,
    marginTop: 18,
    borderRadius: 18,
    overflow: 'hidden',
  },
  ctaGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: C.greenDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 6,
  },
  ctaText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: 'white',
  },
  authRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
    gap: 6,
    zIndex: 9999,
    elevation: 999,
  },
  authText: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  signInText: {
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: '700',
  },
});
