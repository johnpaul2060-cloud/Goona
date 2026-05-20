import React, { useEffect, useState, useRef, useCallback } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Dimensions, Keyboard,
} from 'react-native'
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg'
import { BlurView } from 'expo-blur'
import Animated, {
  useSharedValue, useAnimatedStyle, withDelay, withTiming,
  withSpring, Easing,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import BottomDock from '../../../components/navigation/BottomDock'

const { width: SCREEN_W } = Dimensions.get('window')
const CARD_HORIZ_W = 148

/* ── HOOKS ── */
function useStaggerEntry(index: number, baseDelay = 100) {
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(20)
  useEffect(() => {
    const delay = baseDelay + index * 70
    opacity.value = withDelay(delay, withTiming(1, { duration: 450, easing: Easing.out(Easing.cubic) }))
    translateY.value = withDelay(delay, withSpring(0, { damping: 17, stiffness: 130 }))
  }, [])
  return useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: translateY.value }] }))
}

function usePressScale() {
  const scale = useSharedValue(1)
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
  return {
    style,
    onPressIn: () => { scale.value = withSpring(0.97, { damping: 15, stiffness: 200 }) },
    onPressOut: () => { scale.value = withSpring(1, { damping: 15, stiffness: 200 }) },
  }
}

/* ── ICONS ── */
function SearchIcon() {
  return (
    <Svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <Circle cx="8" cy="8" r="5.5" stroke="#94A3B8" strokeWidth="1.5" fill="none" />
      <Line x1="12" y1="12" x2="15.5" y2="15.5" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  )
}

function FilterIcon() {
  return (
    <Svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <Line x1="3" y1="5.5" x2="15" y2="5.5" stroke="#1F2937" strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="6.5" y1="9.5" x2="11.5" y2="9.5" stroke="#1F2937" strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="8.5" y1="13.5" x2="9.5" y2="13.5" stroke="#1F2937" strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  )
}

function LockIcon() {
  return (
    <Svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <Rect x="2.5" y="5" width="7" height="5" rx="1" stroke="#94A3B8" strokeWidth="1" fill="none" />
      <Path d="M4 5V3.5C4 2.8 4.5 2.5 6 2.5C7.5 2.5 8 2.8 8 3.5V5" stroke="#94A3B8" strokeWidth="1" fill="none" />
    </Svg>
  )
}

function SyncIcon() {
  return (
    <Svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <Path d="M10.5 6C10.5 8.5 8.5 10.5 6 10.5C4.5 10.5 3.2 9.7 2.5 8.5" stroke="#0F766E" strokeWidth="1.2" strokeLinecap="round" />
      <Path d="M1.5 6C1.5 3.5 3.5 1.5 6 1.5C7.5 1.5 8.8 2.3 9.5 3.5" stroke="#0F766E" strokeWidth="1.2" strokeLinecap="round" />
      <Path d="M10.5 2V3.5H9" stroke="#0F766E" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M1.5 10V8.5H3" stroke="#0F766E" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

function CloseIcon() {
  return (
    <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <Line x1="5" y1="5" x2="15" y2="15" stroke="#1F2937" strokeWidth="1.6" strokeLinecap="round" />
      <Line x1="15" y1="5" x2="5" y2="15" stroke="#1F2937" strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  )
}

function PriorityHighIcon() {
  return (
    <Svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <Circle cx="7" cy="7" r="5.5" stroke="#EF4444" strokeWidth="1.2" fill="none" />
      <Line x1="7" y1="5" x2="7" y2="8" stroke="#EF4444" strokeWidth="1.3" strokeLinecap="round" />
      <Circle cx="7" cy="10" r="0.6" fill="#EF4444" />
    </Svg>
  )
}

function PriorityMedIcon() {
  return (
    <Svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <Circle cx="7" cy="7" r="5.5" stroke="#F59E0B" strokeWidth="1.2" fill="none" />
      <Line x1="7" y1="5" x2="7" y2="8" stroke="#F59E0B" strokeWidth="1.3" strokeLinecap="round" />
    </Svg>
  )
}

function AttachIcon() {
  return (
    <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <Path d="M8.5 5V10C8.5 10.8 7.8 11.5 7 11.5C6.2 11.5 5.5 10.8 5.5 10V5C5.5 4.2 6.2 3.5 7 3.5C7.8 3.5 8.5 4.2 8.5 5V9" stroke="#94A3B8" strokeWidth="1.3" strokeLinecap="round" />
    </Svg>
  )
}

/* ── DATA ── */
const ANALYTICS_DATA = [
  {
    label: 'Feed Logs',
    value: '1,250 kg',
    trend: '+12%',
    trendUp: true,
    barColor: '#16A34A',
    bars: [35, 50, 60, 45, 75],
    bg: '#F0FDF4',
    iconColor: '#16A34A',
  },
  {
    label: 'Mortality Reports',
    value: '1.8%',
    trend: '-0.4%',
    trendUp: true,
    barColor: '#EF4444',
    bars: [70, 55, 45, 35, 28],
    bg: '#FFF1F2',
    iconColor: '#EF4444',
  },
  {
    label: 'Weight Records',
    value: '1.84 kg',
    trend: '+6%',
    trendUp: true,
    barColor: '#7C3AED',
    bars: [30, 40, 50, 60, 75],
    bg: '#F3E8FF',
    iconColor: '#7C3AED',
  },
  {
    label: 'Financial Records',
    value: '₦480k',
    trend: '+8%',
    trendUp: true,
    barColor: '#1A56FF',
    bars: [40, 55, 45, 65, 70],
    bg: '#EEF3FF',
    iconColor: '#1A56FF',
  },
]

const CATEGORIES = ['All', 'Feed', 'Mortality', 'Weight', 'Medication', 'Financial', 'Worker']

const TIMELINE_RECORDS = [
  {
    category: 'Feed',
    time: '10:32 AM',
    title: '15 bags of Topfeed Grower added',
    desc: 'Quantity: 45kg • Cost: ₦28,500',
    immutable: true,
    verified: true,
    worker: 'CN',
    workerName: 'Chinedu',
    workerRole: 'Feed Supervisor',
    dotColor: '#16A34A',
    badgeColor: '#E8F5E9',
    badgeText: '#2E7D32',
    badgeLabel: 'Verified',
    priority: null,
  },
  {
    category: 'Mortality',
    time: '8:15 AM',
    title: '3 mortalities reported',
    desc: 'Possible heat stress — temperature spiked overnight',
    immutable: true,
    verified: false,
    worker: 'AK',
    workerName: 'Amaka',
    workerRole: 'Health Officer',
    dotColor: '#EF4444',
    badgeColor: '#FFF1F2',
    badgeText: '#DC2626',
    badgeLabel: 'Alert',
    priority: 'high',
  },
  {
    category: 'Weight',
    time: 'Yesterday, 10:00 AM',
    title: 'Sampled weight: 1.84 kg avg',
    desc: '20 birds sampled • Growth rate +6% vs target',
    immutable: true,
    verified: true,
    worker: 'TO',
    workerName: 'Tunde',
    workerRole: 'Farm Tech',
    dotColor: '#7C3AED',
    badgeColor: '#F3E8FF',
    badgeText: '#7C3AED',
    badgeLabel: 'Verified',
    priority: null,
  },
  {
    category: 'Medication',
    time: 'Yesterday, 9:30 AM',
    title: 'Newcastle vaccine administered',
    desc: '241 doses • Batch A-392 • Completed',
    immutable: true,
    verified: true,
    worker: 'CN',
    workerName: 'Chinedu',
    workerRole: 'Feed Supervisor',
    dotColor: '#0F766E',
    badgeColor: '#DDF5F0',
    badgeText: '#0F766E',
    badgeLabel: 'Verified',
    priority: 'medium',
  },
  {
    category: 'Financial',
    time: 'Yesterday, 4:20 PM',
    title: 'Feed purchase recorded',
    desc: '₦285,000 • 15 bags • Payment completed',
    immutable: true,
    verified: false,
    worker: 'AK',
    workerName: 'Amaka',
    workerRole: 'Health Officer',
    dotColor: '#1A56FF',
    badgeColor: '#EEF3FF',
    badgeText: '#1A56FF',
    badgeLabel: 'Pending',
    priority: null,
  },
  {
    category: 'Worker',
    time: 'Yesterday, 2:15 PM',
    title: '8 of 10 workers checked in',
    desc: 'Shift completed • Morning attendance',
    immutable: false,
    verified: true,
    worker: 'TO',
    workerName: 'Tunde',
    workerRole: 'Farm Tech',
    dotColor: '#F59E0B',
    badgeColor: '#FFFBEB',
    badgeText: '#F59E0B',
    badgeLabel: 'Verified',
    priority: 'medium',
  },
]

const MODAL_DETAIL = {
  attachments: ['invoice_001.pdf', 'delivery_note.jpg', 'photo_feeding.jpg'],
  workerInfo: { name: 'Chinedu', role: 'Feed Supervisor', avatar: 'CN', initials: 'CN' },
  syncHistory: [
    { action: 'Created', time: '10:32 AM', by: 'Chinedu' },
    { action: 'Verified', time: '10:45 AM', by: 'James (Owner)' },
    { action: 'Synced', time: '10:47 AM', by: 'Auto' },
  ],
  photos: ['🐓', '🌾', '📋'],
}

/* ── COMPONENTS ── */
function SummaryCard({
  item,
  index,
  onPress,
}: {
  item: (typeof ANALYTICS_DATA)[0]
  index: number
  onPress: () => void
}) {
  const animStyle = useStaggerEntry(index)
  const { style: pressStyle, onPressIn, onPressOut } = usePressScale()
  return (
    <Animated.View style={[animStyle, pressStyle]} onTouchStart={onPressIn} onTouchEnd={onPressOut}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.summaryCard}>
        <View style={styles.summaryTop}>
          <View style={[styles.summaryIconWrap, { backgroundColor: item.bg }]}>
            <Svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <Rect x="3" y="4" width="12" height="10" rx="2" stroke={item.iconColor} strokeWidth="1.4" fill="none" />
              <Line x1="6" y1="8" x2="12" y2="8" stroke={item.iconColor} strokeWidth="1.3" strokeLinecap="round" />
            </Svg>
          </View>
          <Text style={[styles.summaryTrend, { color: item.trendUp ? '#16A34A' : '#EF4444' }]}>{item.trend}</Text>
        </View>
        <Text style={styles.summaryValue}>{item.value}</Text>
        <Text style={styles.summaryLabel}>{item.label}</Text>
        <View style={styles.summaryChart}>
          {item.bars.map((h, j) => (
            <View
              key={j}
              style={[
                styles.summaryBar,
                {
                  height: `${h}%` as any,
                  backgroundColor: j === item.bars.length - 1 ? item.barColor : '#E2E8E0',
                },
              ]}
            />
          ))}
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

function FilterPill({
  label,
  active,
  onPress,
  index,
}: {
  label: string
  active: boolean
  onPress: () => void
  index: number
}) {
  const animStyle = useStaggerEntry(index, 50)
  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        style={[styles.filterPill, active && styles.filterPillActive]}
        activeOpacity={0.8}
        onPress={onPress}
      >
        <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  )
}

function TimelineItem({
  item,
  index,
  onPress,
}: {
  item: (typeof TIMELINE_RECORDS)[0]
  index: number
  onPress: () => void
}) {
  const animStyle = useStaggerEntry(index, 120)
  const { style: pressStyle, onPressIn, onPressOut } = usePressScale()
  const isLast = index === TIMELINE_RECORDS.length - 1
  return (
    <Animated.View style={[animStyle, pressStyle]} onTouchStart={onPressIn} onTouchEnd={onPressOut}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.timelineCardOuter}>
        <View style={styles.timelineLineTrack}>
          <View style={[styles.timelineLine, isLast && { bottom: '50%' }]} />
          <View style={[styles.timelineDot, { backgroundColor: item.dotColor }]} />
        </View>
        <View style={styles.timelineCard}>
          <View style={styles.timelineCardInner}>
            <View style={styles.timelineHead}>
              <Text style={styles.timelineTime}>{item.time}</Text>
              <View style={[styles.timelineBadge, { backgroundColor: item.badgeColor }]}>
                <Text style={[styles.timelineBadgeText, { color: item.badgeText }]}>{item.badgeLabel}</Text>
              </View>
            </View>

            <Text style={styles.timelineTitle} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.timelineDesc} numberOfLines={2}>{item.desc}</Text>

            <View style={styles.timelineMeta}>
              <View style={styles.timelineWorker}>
                <View style={[styles.timelineAvatar, { backgroundColor: item.dotColor }]}>
                  <Text style={styles.timelineAvatarText}>{item.worker}</Text>
                </View>
                <View style={styles.timelineWorkerInfo}>
                  <Text style={styles.timelineWorkerName}>{item.workerName}</Text>
                  <Text style={styles.timelineWorkerRole}>{item.workerRole}</Text>
                </View>
              </View>

              <View style={styles.timelineMetaRight}>
                {item.immutable && (
                  <View style={styles.timelineLockRow}>
                    <LockIcon />
                    <Text style={styles.timelineLockText}>Immutable</Text>
                  </View>
                )}
                {item.verified && (
                  <View style={[styles.timelineSyncBadge, { backgroundColor: '#DDF5F0' }]}>
                    <SyncIcon />
                    <Text style={styles.timelineSyncText}>Synced</Text>
                  </View>
                )}
              </View>
            </View>

            {item.priority === 'high' && (
              <View style={styles.priorityChipHigh}>
                <PriorityHighIcon />
                <Text style={styles.priorityChipHighText}>High Priority</Text>
              </View>
            )}
            {item.priority === 'medium' && (
              <View style={styles.priorityChipMed}>
                <PriorityMedIcon />
                <Text style={styles.priorityChipMedText}>Medium Priority</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

function RecordModal({
  visible,
  onClose,
}: {
  visible: boolean
  onClose: () => void
}) {
  const translateY = useSharedValue(SCREEN_W * 2)
  const backdropOpacity = useSharedValue(0)

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 24, stiffness: 200, mass: 0.8 })
      backdropOpacity.value = withTiming(1, { duration: 250 })
    } else {
      translateY.value = withSpring(SCREEN_W * 2, { damping: 24, stiffness: 200 })
      backdropOpacity.value = withTiming(0, { duration: 200 })
    }
  }, [visible])

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }))

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }))

  if (!visible) return null

  return (
    <View style={styles.modalOverlay}>
      <Animated.View style={[styles.modalBackdrop, backdropStyle]}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[styles.modalSheet, modalStyle]}>
        <View style={styles.modalHandleRow}>
          <View style={styles.modalHandle} />
        </View>
        <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose}>
          <CloseIcon />
        </TouchableOpacity>

        <ScrollView
          style={styles.modalScroll}
          contentContainerStyle={styles.modalScrollInner}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.modalTitle}>Record Details</Text>
          <Text style={styles.modalSubtitle}>15 bags of Topfeed Grower added</Text>

          {/* Worker Info */}
          <View style={styles.modalSection}>
            <Text style={styles.modalSectionTitle}>Worker</Text>
            <View style={styles.modalWorkerRow}>
              <View style={[styles.modalWorkerAvatar, { backgroundColor: '#16A34A' }]}>
                <Text style={styles.modalWorkerAvatarText}>CN</Text>
              </View>
              <View>
                <Text style={styles.modalWorkerName}>Chinedu</Text>
                <Text style={styles.modalWorkerRole}>Feed Supervisor</Text>
              </View>
            </View>
          </View>

          {/* Attachments */}
          <View style={styles.modalSection}>
            <Text style={styles.modalSectionTitle}>Attachments</Text>
            {MODAL_DETAIL.attachments.map((a, i) => (
              <View key={i} style={styles.modalAttachRow}>
                <AttachIcon />
                <Text style={styles.modalAttachText}>{a}</Text>
              </View>
            ))}
          </View>

          {/* Photos */}
          <View style={styles.modalSection}>
            <Text style={styles.modalSectionTitle}>Photos</Text>
            <View style={styles.modalPhotoGrid}>
              {MODAL_DETAIL.photos.map((p, i) => (
                <View key={i} style={styles.modalPhotoItem}>
                  <Text style={{ fontSize: 28 }}>{p}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Sync History */}
          <View style={styles.modalSection}>
            <Text style={styles.modalSectionTitle}>Sync History</Text>
            {MODAL_DETAIL.syncHistory.map((s, i) => (
              <View key={i} style={styles.modalSyncRow}>
                <View style={styles.modalSyncDot} />
                <View style={styles.modalSyncInfo}>
                  <Text style={styles.modalSyncAction}>{s.action}</Text>
                  <Text style={styles.modalSyncMeta}>{s.time} • by {s.by}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </Animated.View>
    </View>
  )
}

/* ── MAIN SCREEN ── */
export default function RecordsDashboardScreen() {
  const insets = useSafeAreaInsets()
  const [searchText, setSearchText] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [modalVisible, setModalVisible] = useState(false)
  const [keyboardH, setKeyboardH] = useState(0)
  const searchRef = useRef<TextInput>(null)
  const [searchFocused, setSearchFocused] = useState(false)

  const searchScale = useSharedValue(1)
  const searchStyle = useAnimatedStyle(() => ({
    transform: [{ scale: searchScale.value }],
  }))

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardWillShow', e => setKeyboardH(e.endCoordinates.height))
    const hideSub = Keyboard.addListener('keyboardWillHide', () => setKeyboardH(0))
    return () => { showSub.remove(); hideSub.remove() }
  }, [])

  const filteredRecords = TIMELINE_RECORDS.filter(r => {
    const matchCategory = activeCategory === 'All' || r.category === activeCategory
    const q = searchText.toLowerCase()
    const matchSearch = !q ||
      r.title.toLowerCase().includes(q) ||
      r.desc.toLowerCase().includes(q) ||
      r.workerName.toLowerCase().includes(q) ||
      r.workerRole.toLowerCase().includes(q)
    return matchCategory && matchSearch
  })

  const onSearchFocus = useCallback(() => {
    setSearchFocused(true)
    searchScale.value = withSpring(1.02, { damping: 15, stiffness: 200 })
  }, [])

  const onSearchBlur = useCallback(() => {
    setSearchFocused(false)
    searchScale.value = withSpring(1, { damping: 15, stiffness: 200 })
  }, [])

  const TOP_BAR_H = 56
  const TOP = insets.top

  return (
    <View style={styles.container}>
      {/* ── STICKY HEADER ── */}
      <BlurView
        intensity={55}
        tint="light"
        style={[styles.headerBlur, { top: 0, paddingTop: TOP + 8 }]}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Records</Text>
            <Text style={styles.headerSub}>All farm records in one place</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.headerBtn, searchFocused && { backgroundColor: '#E8F5E9' }]}
              activeOpacity={0.7}
              onPress={() => searchRef.current?.focus()}
            >
              <SearchIcon />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerBtn} activeOpacity={0.7}>
              <FilterIcon />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search */}
        <Animated.View style={[styles.searchWrap, searchStyle]}>
          <View style={[styles.searchInputRow, searchFocused && styles.searchInputRowFocused]}>
            <SearchIcon />
            <TextInput
              ref={searchRef}
              style={styles.searchInput}
              placeholder="Search records, logs, workers..."
              placeholderTextColor="#A0AEA1"
              value={searchText}
              onChangeText={setSearchText}
              onFocus={onSearchFocus}
              onBlur={onSearchBlur}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')} style={styles.searchClearBtn}>
                <CloseIcon />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </BlurView>

      {/* ── CONTENT ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollInner,
          { paddingTop: TOP + TOP_BAR_H + 140, paddingBottom: keyboardH > 0 ? keyboardH + 140 : 160 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Analytics Cards */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.analyticsScroll}
          contentContainerStyle={styles.analyticsScrollInner}
        >
          {ANALYTICS_DATA.map((item, i) => (
            <SummaryCard
              key={item.label}
              item={item}
              index={i}
              onPress={() => setModalVisible(true)}
            />
          ))}
        </ScrollView>

        {/* Category Filter */}
        <View style={styles.filterRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollInner}
          >
            {CATEGORIES.map((cat, i) => (
              <FilterPill
                key={cat}
                label={cat}
                active={activeCategory === cat}
                index={i}
                onPress={() => setActiveCategory(cat)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Timeline Feed */}
        <View style={styles.timelineSection}>
          {filteredRecords.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No records found</Text>
              <Text style={styles.emptyStateSub}>Try a different search or category</Text>
            </View>
          ) : (
            filteredRecords.map((item, i) => (
              <TimelineItem
                key={`${item.category}-${i}`}
                item={item}
                index={i}
                onPress={() => setModalVisible(true)}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* ── BOTTOM TAB ── */}
      <BottomDock hidden={keyboardH > 0} />

      {/* ── MODAL ── */}
      <RecordModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </View>
  )
}

/* ── STYLES ── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAF7' },

  /* HEADER */
  headerBlur: {
    position: 'absolute', left: 0, right: 0, zIndex: 10,
    borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.04)',
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 20,
  },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#1B1B1B' },
  headerSub: { fontSize: 13, color: '#A0AEA1', marginTop: 1 },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 14, elevation: 3,
  },

  /* SEARCH */
  searchWrap: { paddingHorizontal: 20, marginTop: 10 },
  searchInputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'white', borderRadius: 16, paddingHorizontal: 16, height: 46,
    gap: 10,
    borderWidth: 1.5, borderColor: '#E2E8F0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
  },
  searchInputRowFocused: { borderColor: '#2E7D32', shadowOpacity: 0.1, shadowRadius: 20 },
  searchInput: { flex: 1, fontSize: 14, color: '#1B1B1B', paddingVertical: 0 },
  searchClearBtn: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  /* SCROLL */
  scroll: { flex: 1 },
  scrollInner: { paddingHorizontal: 20 },

  /* ANALYTICS */
  analyticsScroll: { marginBottom: 0, zIndex: 5 },
  analyticsScrollInner: { paddingRight: 0, paddingVertical: 4, gap: 12 },
  summaryCard: {
    width: CARD_HORIZ_W, backgroundColor: 'white', borderRadius: 24, padding: 16,
    marginRight: 0,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05, shadowRadius: 20, elevation: 2,
  },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  summaryIconWrap: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  summaryTrend: { fontSize: 11, fontWeight: '700' },
  summaryValue: { fontSize: 20, fontWeight: '800', color: '#1F2937', marginTop: 8 },
  summaryLabel: { fontSize: 11, color: '#64748B', marginTop: 1 },
  summaryChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 24, marginTop: 8 },
  summaryBar: { width: 5, borderRadius: 2 },

  /* FILTER PILLS */
  filterRow: { marginTop: 16, marginBottom: 16 },
  filterScrollInner: { gap: 8, paddingRight: 20 },
  filterPill: {
    paddingVertical: 7, paddingHorizontal: 16, borderRadius: 100,
    backgroundColor: 'white', borderWidth: 1, borderColor: '#E2E8F0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
  },
  filterPillActive: { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
  filterPillText: { fontSize: 12, fontWeight: '500', color: '#64748B' },
  filterPillTextActive: { color: 'white', fontWeight: '600' },

  /* TIMELINE */
  timelineSection: { marginTop: 0, paddingBottom: 8 },
  timelineCardOuter: { flexDirection: 'row', marginBottom: 18 },
  timelineLineTrack: { width: 20, alignItems: 'center', position: 'relative' },
  timelineLine: {
    position: 'absolute', top: 16, bottom: -18, width: 2,
    backgroundColor: '#E8ECEE',
  },
  timelineDot: {
    width: 10, height: 10, borderRadius: 5, marginTop: 22,
    borderWidth: 2, borderColor: '#F8FAF7', zIndex: 1,
  },
  timelineCard: {
    flex: 1, backgroundColor: 'white', borderRadius: 24, padding: 16, marginLeft: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06, shadowRadius: 28, elevation: 3,
  },
  timelineCardInner: {},
  timelineHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timelineTime: { fontSize: 11, color: '#94A3B8' },
  timelineBadge: { paddingVertical: 2, paddingHorizontal: 10, borderRadius: 100 },
  timelineBadgeText: { fontSize: 9, fontWeight: '600' },
  timelineTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937', marginTop: 8 },
  timelineDesc: { fontSize: 13, color: '#64748B', marginTop: 3, lineHeight: 18 },
  timelineMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  timelineWorker: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timelineAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  timelineAvatarText: { fontSize: 10, fontWeight: '700', color: 'white' },
  timelineWorkerInfo: {},
  timelineWorkerName: { fontSize: 12, fontWeight: '600', color: '#1F2937' },
  timelineWorkerRole: { fontSize: 10, color: '#94A3B8' },
  timelineMetaRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timelineLockRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  timelineLockText: { fontSize: 9, color: '#94A3B8' },
  timelineSyncBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingVertical: 2, paddingHorizontal: 8, borderRadius: 100,
  },
  timelineSyncText: { fontSize: 9, fontWeight: '600', color: '#0F766E' },

  /* PRIORITY CHIPS */
  priorityChipHigh: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 8, paddingVertical: 4, paddingHorizontal: 10,
    borderRadius: 100, backgroundColor: '#FFF1F2', alignSelf: 'flex-start',
  },
  priorityChipHighText: { fontSize: 10, fontWeight: '600', color: '#DC2626' },
  priorityChipMed: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 8, paddingVertical: 4, paddingHorizontal: 10,
    borderRadius: 100, backgroundColor: '#FFFBEB', alignSelf: 'flex-start',
  },
  priorityChipMedText: { fontSize: 10, fontWeight: '600', color: '#F59E0B' },

  /* EMPTY STATE */
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyStateText: { fontSize: 16, fontWeight: '600', color: '#94A3B8' },
  emptyStateSub: { fontSize: 13, color: '#B0BEC5', marginTop: 4 },

  /* MODAL */
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 },
  modalBackdrop: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    maxHeight: '85%',
    backgroundColor: 'white', borderTopLeftRadius: 32, borderTopRightRadius: 32,
    shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.08, shadowRadius: 40, elevation: 20,
  },
  modalHandleRow: { alignItems: 'center', paddingTop: 10 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0' },
  modalCloseBtn: {
    position: 'absolute', top: 14, right: 18,
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center',
  },
  modalScroll: { maxHeight: 500 },
  modalScrollInner: { padding: 24, paddingTop: 8 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#1F2937' },
  modalSubtitle: { fontSize: 14, color: '#64748B', marginTop: 4, lineHeight: 20 },
  modalSection: { marginTop: 20 },
  modalSectionTitle: { fontSize: 13, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  modalWorkerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  modalWorkerAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  modalWorkerAvatarText: { fontSize: 14, fontWeight: '700', color: 'white' },
  modalWorkerName: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
  modalWorkerRole: { fontSize: 12, color: '#64748B' },
  modalAttachRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  modalAttachText: { fontSize: 13, color: '#1F2937' },
  modalPhotoGrid: { flexDirection: 'row', gap: 10 },
  modalPhotoItem: {
    width: 80, height: 80, borderRadius: 16, backgroundColor: '#F0FDF4',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  modalSyncRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  modalSyncDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2E7D32', marginTop: 5 },
  modalSyncInfo: { flex: 1 },
  modalSyncAction: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  modalSyncMeta: { fontSize: 12, color: '#94A3B8', marginTop: 1 },
})


