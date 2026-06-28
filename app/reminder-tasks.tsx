import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, Pressable, ScrollView,
  StyleSheet, Dimensions, Modal, TextInput,
  Platform, KeyboardAvoidingView, Keyboard, FlatList, Animated as RNAnimated,
  PanResponder,
} from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  FadeInUp, SlideInUp, Layout,
} from 'react-native-reanimated'
import GoonaIcon from '../components/ui/GoonaIcon'
import { Icons } from '../shared/icons'
import { useAuthStore } from '../store/useAuthStore'
import { useBatchStore } from '../store/useBatchStore'
import {
  useReminderTaskStore, TEAM_MEMBERS,
  type ReminderTaskItem, type Priority, type TaskStatus, type ItemType,
  type SortKey, type TaggedUser, type Visibility, type Attachment, type RepeatFrequency,
} from '../store/useReminderTaskStore'
import { useFarmChatStore } from '../store/useFarmChatStore'

const { width: SW } = Dimensions.get('window')
const IS_SMALL = SW < 375

const PRIORITY_CONFIG = {
  critical: { color: '#EF4444', bg: '#FEF2F2', label: 'Critical', icon: Icons.alertTriangle },
  high: { color: '#F59E0B', bg: '#FFFBEB', label: 'High', icon: Icons.chevronUp },
  medium: { color: '#3B82F6', bg: '#EFF6FF', label: 'Medium', icon: Icons.minus },
  low: { color: '#16A34A', bg: '#F0FDF4', label: 'Low', icon: Icons.chevronDown },
}

const TYPE_CONFIG = {
  task: { icon: Icons.clipboardList, label: 'Task' },
  reminder: { icon: Icons.bell, label: 'Reminder' },
}

const REPEAT_OPTIONS: { key: RepeatFrequency; label: string; icon: any }[] = [
  { key: 'none', label: 'None', icon: Icons.x },
  { key: 'daily', label: 'Daily', icon: Icons.clock },
  { key: 'weekly', label: 'Weekly', icon: Icons.calendar },
  { key: 'biweekly', label: 'Biweekly', icon: Icons.calendar },
  { key: 'monthly', label: 'Monthly', icon: Icons.calendar },
]

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'urgency', label: 'Urgency' },
  { key: 'batch', label: 'Batch' },
  { key: 'created', label: 'Newest' },
]

const TABS: { key: string; label: string; icon: any }[] = [
  { key: 'all', label: 'All', icon: Icons.barChart3 },
  { key: 'tasks', label: 'Tasks', icon: Icons.clipboardList },
  { key: 'reminders', label: 'Reminders', icon: Icons.bell },
]

function usePressScale() {
  const scale = useSharedValue(1)
  const opacity = useSharedValue(1)
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: opacity.value }))
  return {
    style, onPressIn: () => { scale.value = withSpring(0.96, { damping: 15, stiffness: 200 }); opacity.value = withTiming(0.85, { duration: 80 }) },
    onPressOut: () => { scale.value = withSpring(1, { damping: 15, stiffness: 200 }); opacity.value = withTiming(1, { duration: 100 }) },
  }
}

function ProgressRing({ progress, size = 28, strokeWidth = 3, color }: { progress: number; size?: number; strokeWidth?: number; color?: string }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progressVal = Math.min(100, Math.max(0, progress))
  const offset = circumference - (progressVal / 100) * circumference
  const pColor = color || (progressVal >= 100 ? '#16A34A' : progressVal >= 50 ? '#F59E0B' : '#3B82F6')

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Path
          d={`M ${size / 2} ${strokeWidth / 2} A ${radius} ${radius} 0 1 1 ${size / 2 - 0.001} ${strokeWidth / 2}`}
          stroke="#E2E8F0" strokeWidth={strokeWidth} fill="none"
        />
        <Path
          d={`M ${size / 2} ${strokeWidth / 2} A ${radius} ${radius} 0 1 1 ${size / 2 - 0.001} ${strokeWidth / 2}`}
          stroke={pColor} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </Svg>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: size * 0.3, fontWeight: '700', color: pColor }}>{progress}%</Text>
      </View>
    </View>
  )
}

function PriorityBadge({ priority }: { priority: Priority }) {
  const cfg = PRIORITY_CONFIG[priority]
  return (
    <View style={[pStyles.badge, { backgroundColor: cfg.bg }]}>
      <GoonaIcon icon={cfg.icon} size={10} color={cfg.color} />
      <Text style={[pStyles.text, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  )
}
const pStyles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 50, alignSelf: 'flex-start' },
  text: { fontSize: 9, fontWeight: '700' },
})

function AvatarStack({ users, max = 3 }: { users?: TaggedUser[] | null; max?: number }) {
  const safe = Array.isArray(users) ? users : []
  const visible = safe.slice(0, max)
  const remaining = safe.length - max
  if (safe.length === 0) return null
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {visible.map((u, i) => (
        <View
          key={u.id}
          style={{
            width: 22, height: 22, borderRadius: 11,
            backgroundColor: u.avatarColor || '#00695C',
            alignItems: 'center', justifyContent: 'center',
            marginLeft: i > 0 ? -6 : 0,
            borderWidth: 1.5, borderColor: 'white',
          }}
        >
          <Text style={{ fontSize: 8, fontWeight: '700', color: 'white' }}>{u.initials}</Text>
        </View>
      ))}
      {remaining > 0 && (
        <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center', marginLeft: -6, borderWidth: 1.5, borderColor: 'white' }}>
          <Text style={{ fontSize: 8, fontWeight: '600', color: '#64748B' }}>+{remaining}</Text>
        </View>
      )}
    </View>
  )
}

function AttachmentChip({ attachment }: { attachment: Attachment } & { key?: string }) {
  const typeIcons: Record<string, any> = { document: Icons.fileText, photo: Icons.image, voice_note: Icons.mic }
  return (
    <View style={acStyles.chip}>
      <GoonaIcon icon={typeIcons[attachment.type as string] || Icons.fileText} size={12} color="#64748B" />
      <Text style={acStyles.text} numberOfLines={1}>{attachment.name}</Text>
    </View>
  )
}
const acStyles = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F1F5F9', borderRadius: 8, paddingVertical: 4, paddingHorizontal: 8, marginRight: 4, marginBottom: 4 },
  text: { fontSize: 10, color: '#475569', fontWeight: '500', maxWidth: 100 },
})

function SortPicker({ sortKey, onSelect }: { sortKey: SortKey; onSelect: (k: SortKey) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <View style={{ position: 'relative' }}>
      <TouchableOpacity activeOpacity={0.7} onPress={() => setOpen(!open)} style={spStyles.trigger}>
        <GoonaIcon icon={Icons.filter} size={14} color="#00695C" />
        <Text style={spStyles.triggerText}>{SORT_OPTIONS.find((o) => o.key === sortKey)?.label}</Text>
      </TouchableOpacity>
      {open && (
        <View style={spStyles.dropdown}>
          {(SORT_OPTIONS || []).map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[spStyles.option, sortKey === opt.key && spStyles.optionActive]}
              onPress={() => { onSelect(opt.key); setOpen(false) }}
            >
              <Text style={[spStyles.optionText, sortKey === opt.key && spStyles.optionTextActive]}>{opt.label}</Text>
              {sortKey === opt.key && <GoonaIcon icon={Icons.check} size={14} color="#00695C" />}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  )
}
const spStyles = StyleSheet.create({
  trigger: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,105,92,0.06)', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 14 },
  triggerText: { fontSize: 12, fontWeight: '600', color: '#00695C' },
  dropdown: { position: 'absolute', top: 40, right: 0, backgroundColor: 'white', borderRadius: 16, padding: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 24, elevation: 8, zIndex: 100, minWidth: 120 },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  optionActive: { backgroundColor: 'rgba(0,105,92,0.06)' },
  optionText: { fontSize: 13, fontWeight: '500', color: '#475569' },
  optionTextActive: { color: '#00695C', fontWeight: '700' },
})

function formatTimestamp(dateStr: string, withTime?: boolean): string {
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ''
    const now = Date.now()
    const diff = (d.getTime() - now) / 1000
    const abs = Math.abs(diff)
    const prefix = diff < 0 ? 'Overdue' : ''
    if (prefix) {
      if (abs < 3600) return `${prefix} ${Math.ceil(abs / 60)}m`
      if (abs < 86400) return `${prefix} ${Math.ceil(abs / 3600)}h`
      if (abs < 604800) return `${prefix} ${Math.ceil(abs / 86400)}d`
      return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    }
    if (abs < 3600) return `${Math.ceil(abs / 60)}m`
    if (abs < 86400) return `${Math.ceil(abs / 3600)}h`
    if (abs < 604800) return `${Math.ceil(abs / 86400)}d`
    const parts = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined })
    return withTime ? `${parts} ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` : parts
  } catch { return '' }
}

function ReminderTaskCard({ item, index, onComplete, onPress, onSwipeAction }: {
  item: ReminderTaskItem; index: number; onComplete: () => void; onPress: () => void; onSwipeAction?: (action: 'complete' | 'reply' | 'delete') => void
}) {
  const [expanded, setExpanded] = useState(false)
  const ps = usePressScale()
  const pCfg = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.medium
  const tCfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.task
  const progressColor = item.status === 'completed' ? '#16A34A' : item.priority === 'critical' ? '#EF4444' : item.priority === 'high' ? '#F59E0B' : '#3B82F6'
  const dragX = useRef(new RNAnimated.Value(0)).current
  const swipeLock = useRef(false)

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, g) =>
      !swipeLock.current && Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
    onPanResponderGrant: () => {},
    onPanResponderMove: (_, g) => {
      dragX.setValue(g.dx)
    },
    onPanResponderRelease: (_, g) => {
      const isRightSwipe = g.dx > SW * 0.3
      const isLeftSwipe = g.dx < -SW * 0.3
      if (isRightSwipe || isLeftSwipe) {
        swipeLock.current = true
        if (isRightSwipe) {
          RNAnimated.spring(dragX, { toValue: SW, useNativeDriver: true, tension: 40, friction: 8 }).start()
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
          setTimeout(() => { onComplete(); swipeLock.current = false; dragX.setValue(0) }, 400)
        } else {
          RNAnimated.spring(dragX, { toValue: -SW * 0.5, useNativeDriver: true, tension: 40, friction: 8 }).start()
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          setTimeout(() => {
            if (onSwipeAction) onSwipeAction('reply')
            RNAnimated.spring(dragX, { toValue: 0, useNativeDriver: true }).start()
            swipeLock.current = false
          }, 300)
        }
      } else {
        RNAnimated.spring(dragX, { toValue: 0, useNativeDriver: true }).start()
        if (Math.abs(g.dx) < 5 && Math.abs(g.dy) < 5) {
          setExpanded((prev) => !prev)
        }
      }
    },
  })).current

  const animatedStyle = {
    transform: [{ translateX: dragX }],
    opacity: dragX.interpolate({
      inputRange: [-SW * 0.5, 0, SW * 0.5],
      outputRange: [0.7, 1, 0],
      extrapolate: 'clamp',
    }),
  }

  const borderAccent = item.status === 'completed' ? '#16A34A' : pCfg.color
  const assignedSafe = Array.isArray(item.assignedTo) ? item.assignedTo : []
  const attachmentsSafe = Array.isArray(item.attachments) ? item.attachments : []

  return (
    <View {...panResponder.panHandlers}>
      <RNAnimated.View style={animatedStyle}>
        <Animated.View entering={FadeInUp.duration(400).delay(100 + index * 60).springify()} layout={Layout.springify()}>
          <View>
            {/* Right hint (Complete) */}
            <View style={{ position: 'absolute', right: 16, top: 0, bottom: 10, justifyContent: 'center', zIndex: 0 }}>
              <View style={{ backgroundColor: '#16A34A', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 8 }}>
                <Text style={{ color: 'white', fontSize: 12, fontWeight: '700' }}>Complete</Text>
              </View>
            </View>
            {/* Left hint (Reply) */}
            <View style={{ position: 'absolute', left: 16, top: 0, bottom: 10, justifyContent: 'center', zIndex: 0 }}>
              <View style={{ backgroundColor: '#3B82F6', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <GoonaIcon icon={Icons.messageSquare} size={11} color="white" />
                <Text style={{ color: 'white', fontSize: 12, fontWeight: '700' }}>Reply</Text>
              </View>
            </View>
            <Animated.View style={[ps.style, tcStyles.card, {
              borderLeftColor: borderAccent,
              opacity: item.status === 'completed' ? 0.6 : 1,
            }]}>
              {/* Header */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                <View style={[tcStyles.typeIcon, { backgroundColor: `${pCfg.color}12` }]}>
                  <GoonaIcon icon={tCfg.icon} size={16} color={pCfg.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <Text style={[tcStyles.badge, { backgroundColor: `${pCfg.color}12`, color: pCfg.color }]}>
                      {tCfg.label}
                    </Text>
                    <Text style={[tcStyles.timestamp]}>by {item.creatorName} · {formatTimestamp(item.createdAt, true)}</Text>
                  </View>
                  <Text style={[tcStyles.title, item.status === 'completed' && { textDecorationLine: 'line-through' }]} numberOfLines={expanded ? undefined : 2}>
                    {item.title}
                  </Text>
                  {expanded && (
                    <Text style={tcStyles.description}>{item.description || ''}</Text>
                  )}
                </View>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={(e) => { e.stopPropagation() }}
                  style={[tcStyles.completeBtn, { backgroundColor: item.status === 'completed' ? '#16A34A' : pCfg.color }]}
                >
                  <GoonaIcon icon={Icons.check} size={14} color="white" />
                </TouchableOpacity>
              </View>

              {/* Meta row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10 }}>
                <PriorityBadge priority={item.priority} />
                <AvatarStack users={assignedSafe} />
                {item.dueDate && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <GoonaIcon icon={Icons.clock} size={10} color="#94A3B8" />
                    <Text style={tcStyles.metaText}>{formatTimestamp(item.dueDate)}</Text>
                  </View>
                )}
              </View>

              {/* Batch & progress */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                {item.batchName && (
                  <View style={tcStyles.batchPill}>
                    <GoonaIcon icon={Icons.package} size={9} color="#00695C" />
                    <Text style={tcStyles.batchPillText}>{item.batchName}</Text>
                  </View>
                )}
                {item.status !== 'completed' && (
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={{ flex: 1, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, overflow: 'hidden' }}>
                      <View style={{ width: `${item.progress}%`, height: 4, backgroundColor: progressColor, borderRadius: 2 }} />
                    </View>
                    <Text style={{ fontSize: 10, fontWeight: '600', color: progressColor }}>{item.progress}%</Text>
                  </View>
                )}
                {item.status === 'completed' && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <GoonaIcon icon={Icons.checkCircle} size={12} color="#16A34A" />
                    <Text style={{ fontSize: 10, fontWeight: '600', color: '#16A34A' }}>Completed</Text>
                  </View>
                )}
              </View>

              {/* Expanded */}
              {expanded && (
                <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' }}>
                  {assignedSafe.length > 0 && (
                    <View style={{ marginBottom: 8 }}>
                      <Text style={{ fontSize: 11, fontWeight: '600', color: '#64748B', marginBottom: 4 }}>Assigned to</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {assignedSafe.map((u) => (
                          <View key={u.id} style={tcStyles.assigneeChip}>
                            <View style={[tcStyles.assigneeDot, { backgroundColor: u.avatarColor || '#00695C' }]}>
                              <Text style={{ fontSize: 8, fontWeight: '700', color: 'white' }}>{u.initials}</Text>
                            </View>
                            <Text style={tcStyles.assigneeName}>{u.name}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                  {item.dueTime && (
                    <View style={{ marginBottom: 8 }}>
                      <Text style={{ fontSize: 11, fontWeight: '600', color: '#64748B' }}>Due at: {item.dueTime}</Text>
                    </View>
                  )}
                  {item.repeatFrequency && item.repeatFrequency !== 'none' && (
                    <View style={{ marginBottom: 8 }}>
                      <Text style={{ fontSize: 11, fontWeight: '600', color: '#64748B' }}>Repeats: {REPEAT_OPTIONS.find(r => r.key === item.repeatFrequency)?.label || item.repeatFrequency}</Text>
                    </View>
                  )}
                  <View style={{ marginBottom: 8 }}>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: '#64748B' }}>Created by {item.creatorName} · {formatTimestamp(item.createdAt, true)}</Text>
                  </View>
                  {attachmentsSafe.length > 0 && (
                    <View style={{ marginTop: 4 }}>
                      <Text style={{ fontSize: 11, fontWeight: '600', color: '#64748B', marginBottom: 4 }}>Attachments</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                        {attachmentsSafe.map((a) => (
                          <AttachmentChip key={a.id} attachment={a} />
                        ))}
                      </View>
                    </View>
                  )}
                  <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={tcStyles.editBtn}>
                    <GoonaIcon icon={Icons.pencil} size={12} color="#00695C" />
                    <Text style={tcStyles.editBtnText}>Edit details</Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity onPress={() => setExpanded(!expanded)} style={tcStyles.expandToggle}>
                <GoonaIcon icon={expanded ? Icons.chevronUp : Icons.chevronDown} size={14} color="#94A3B8" />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.View>
      </RNAnimated.View>
    </View>
  )
}

const tcStyles = StyleSheet.create({
  card: {
    backgroundColor: 'white', borderRadius: 20, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02, shadowRadius: 16, elevation: 2,
    borderLeftWidth: 3,
  },
  typeIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  badge: { fontSize: 9, fontWeight: '700', paddingVertical: 2, paddingHorizontal: 6, borderRadius: 4, overflow: 'hidden', alignSelf: 'flex-start' },
  timestamp: { fontSize: 9, color: '#CBD5E1', fontWeight: '500' },
  title: { fontSize: 14, fontWeight: '600', color: '#1B1B1B', lineHeight: 19, marginTop: 2 },
  description: { fontSize: 12, color: '#64748B', lineHeight: 17, marginTop: 4 },
  metaText: { fontSize: 10, color: '#94A3B8' },
  batchPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,105,92,0.06)', borderRadius: 6, paddingVertical: 3, paddingHorizontal: 8 },
  batchPillText: { fontSize: 9, fontWeight: '600', color: '#00695C' },
  completeBtn: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, backgroundColor: 'rgba(0,105,92,0.06)', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, alignSelf: 'flex-start' },
  editBtnText: { fontSize: 12, fontWeight: '600', color: '#00695C' },
  expandToggle: { position: 'absolute', bottom: 8, right: 16, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  assigneeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F1F5F9', borderRadius: 8, paddingVertical: 4, paddingHorizontal: 8 },
  assigneeDot: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  assigneeName: { fontSize: 11, fontWeight: '500', color: '#1F2937' },
})

function CreateTaskModal({ visible, onClose, onSave, editItem }: {
  visible: boolean
  onClose: () => void
  onSave: (data: any) => void
  editItem?: ReminderTaskItem | null
}) {
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [type, setType] = useState<ItemType>('task')
  const [priority, setPriority] = useState<Priority>('medium')
  const [assignedUsers, setAssignedUsers] = useState<TaggedUser[]>([])
  const [batchId, setBatchId] = useState('')
  const [visibility, setVisibility] = useState<Visibility>('all')
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 86400000))
  const [dueTime, setDueTime] = useState(new Date())
  const [repeatFrequency, setRepeatFrequency] = useState<RepeatFrequency>('none')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [saving, setSaving] = useState(false)
  const [assignSearch, setAssignSearch] = useState('')
  const [showAssignDropdown, setShowAssignDropdown] = useState(false)

  const batches = useBatchStore((s) => s.batches)
  const authUserName = useAuthStore((s) => s.userName)

  useEffect(() => {
    if (editItem) {
      setTitle(editItem.title)
      setDesc(editItem.description)
      setType(editItem.type)
      setPriority(editItem.priority)
      setAssignedUsers(Array.isArray(editItem.assignedTo) ? editItem.assignedTo : [])
      setBatchId(editItem.batchId ?? '')
      setVisibility(editItem.visibility === 'management' ? 'management' : 'all')
      setRepeatFrequency(editItem.repeatFrequency || 'none')
      setDueDate(new Date(editItem.dueDate))
      if (editItem.dueTime) {
        const [h, m] = editItem.dueTime.split(':')
        const t = new Date()
        t.setHours(parseInt(h) || 0, parseInt(m) || 0)
        setDueTime(t)
      }
    }
  }, [editItem])

  const filteredMembers = useMemo(() => {
    if (!assignSearch.trim()) return TEAM_MEMBERS
    const q = assignSearch.toLowerCase()
    return TEAM_MEMBERS.filter((m) => m.name.toLowerCase().includes(q))
  }, [assignSearch])

  const toggleUser = (user: TaggedUser) => {
    setAssignedUsers((prev) => {
      const arr = Array.isArray(prev) ? prev : []
      const exists = arr.find((u) => u.id === user.id)
      if (exists) {
        return arr.filter((u) => u.id !== user.id)
      }
      return [...arr, user]
    })
    setAssignSearch('')
  }

  const handleSave = async () => {
    Keyboard.dismiss()
    setSaving(true)
    await new Promise((r) => setTimeout(r, 300))

    const date = new Date(dueDate)
    date.setHours(dueTime.getHours(), dueTime.getMinutes(), 0, 0)

    onSave({
      type, title: title.trim() || 'Untitled', description: desc.trim(),
      priority, assignedTo: Array.isArray(assignedUsers) ? assignedUsers : [],
      batchId: batchId || undefined, batchName: batches.find((b) => b.id === batchId)?.batchName,
      repeatFrequency: type === 'reminder' ? repeatFrequency : undefined,
      dueDate: date.toISOString(),
      dueTime: `${String(dueTime.getHours()).padStart(2, '0')}:${String(dueTime.getMinutes()).padStart(2, '0')}`,
      status: 'pending' as TaskStatus, progress: 0,
      visibility,
      attachments: [],
      creatorId: 'owner',
      creatorName: authUserName || 'Farm Owner',
    })
    setSaving(false)
    onClose()
  }

  const reset = () => {
    setTitle(''); setDesc(''); setType('task'); setPriority('medium')
    setAssignedUsers([]); setBatchId(''); setVisibility('all'); setRepeatFrequency('none')
    setDueDate(new Date(Date.now() + 86400000))
    setDueTime(new Date()); setSaving(false); setAssignSearch(''); setShowAssignDropdown(false)
  }

  const handleClose = () => { Keyboard.dismiss(); reset(); onClose() }

  const handleDateChange = (_e: DateTimePickerEvent, d?: Date) => {
    if (d) setDueDate(d)
    if (Platform.OS === 'android') setShowDatePicker(false)
  }

  const handleTimeChange = (_e: DateTimePickerEvent, d?: Date) => {
    if (d) setDueTime(d)
    if (Platform.OS === 'android') setShowTimePicker(false)
  }

  const dismissDatePicker = () => setShowDatePicker(false)
  const dismissTimePicker = () => setShowTimePicker(false)

  const assignedSafe = Array.isArray(assignedUsers) ? assignedUsers : []

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' }} onPress={handleClose} />
        <Animated.View entering={SlideInUp.duration(350).springify().damping(20)} style={cmStyles.sheet}>
          <View style={cmStyles.handle} />
          <View style={cmStyles.header}>
            <Text style={cmStyles.headerTitle}>{editItem ? 'Edit' : 'Create'} {type === 'task' ? 'Task' : 'Reminder'}</Text>
            <TouchableOpacity onPress={handleClose} style={cmStyles.closeBtn}>
              <GoonaIcon icon={Icons.x} size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Type */}
            <View style={cmStyles.fieldGroup}>
              <Text style={cmStyles.fieldLabel}>Type</Text>
              <View style={cmStyles.segmented}>
                {(['task', 'reminder'] as ItemType[]).map((t) => (
                  <TouchableOpacity key={t} style={[cmStyles.segBtn, type === t && cmStyles.segBtnActive]} onPress={() => setType(t)}>
                    <GoonaIcon icon={TYPE_CONFIG[t].icon} size={13} color={type === t ? 'white' : '#64748B'} />
                    <Text style={[cmStyles.segText, type === t && cmStyles.segTextActive]}>{TYPE_CONFIG[t].label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Title */}
            <View style={cmStyles.fieldGroup}>
              <Text style={cmStyles.fieldLabel}>Title</Text>
              <View style={cmStyles.inputWrap}>
                <TextInput style={cmStyles.input} placeholder="Enter title" placeholderTextColor="#CBD5E1" value={title} onChangeText={setTitle} />
              </View>
            </View>

            {/* Description */}
            <View style={cmStyles.fieldGroup}>
              <Text style={cmStyles.fieldLabel}>Description</Text>
              <View style={[cmStyles.inputWrap, { minHeight: 64 }]}>
                <TextInput style={[cmStyles.input, { minHeight: 40 }]} placeholder="Add details" placeholderTextColor="#CBD5E1" value={desc} onChangeText={setDesc} multiline />
              </View>
            </View>

            {/* Priority */}
            <View style={cmStyles.fieldGroup}>
              <Text style={cmStyles.fieldLabel}>Priority</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {(['critical', 'high', 'medium', 'low'] as Priority[]).map((p) => {
                    const cfg = PRIORITY_CONFIG[p]
                    return (
                      <TouchableOpacity key={p} style={[cmStyles.chip, priority === p && { borderColor: cfg.color, backgroundColor: cfg.bg }]} onPress={() => setPriority(p)}>
                        <GoonaIcon icon={cfg.icon} size={12} color={priority === p ? cfg.color : '#94A3B8'} />
                        <Text style={[cmStyles.chipText, { color: priority === p ? cfg.color : '#94A3B8' }, priority === p && { fontWeight: '700' }]}>{cfg.label}</Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </ScrollView>
            </View>

            {/* Assign To - Searchable Tagging (Tasks only) */}
            {type === 'task' && (
            <View style={cmStyles.fieldGroup}>
              <Text style={cmStyles.fieldLabel}>Assign To</Text>
              <View style={cmStyles.inputWrap}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <GoonaIcon icon={Icons.user} size={16} color="#94A3B8" />
                  <TextInput
                    style={[cmStyles.input, { flex: 1 }]}
                    placeholder="Search team members..."
                    placeholderTextColor="#CBD5E1"
                    value={assignSearch}
                    onChangeText={(t) => { setAssignSearch(t); setShowAssignDropdown(true) }}
                    onFocus={() => setShowAssignDropdown(true)}
                    onBlur={() => setTimeout(() => setShowAssignDropdown(false), 200)}
                  />
                </View>
              </View>
              {showAssignDropdown && (
                <View style={cmStyles.assignDropdown}>
                  <ScrollView style={{ maxHeight: 160 }} keyboardShouldPersistTaps="handled">
                    {filteredMembers.map((user) => {
                      const selected = assignedSafe.find((u) => u.id === user.id)
                      return (
                        <TouchableOpacity
                          key={user.id}
                          style={[cmStyles.assignRow, selected && cmStyles.assignRowActive]}
                          onPress={() => toggleUser(user)}
                        >
                          <View style={[cmStyles.assignAvatar, { backgroundColor: user.avatarColor || '#00695C' }]}>
                            <Text style={{ fontSize: 10, fontWeight: '700', color: 'white' }}>{user.initials}</Text>
                          </View>
                          <Text style={[cmStyles.assignName, selected && { fontWeight: '700', color: '#00695C' }]}>{user.name}</Text>
                          {selected && <GoonaIcon icon={Icons.check} size={14} color="#00695C" />}
                        </TouchableOpacity>
                      )
                    })}
                    {filteredMembers.length === 0 && (
                      <Text style={{ padding: 12, fontSize: 12, color: '#94A3B8', textAlign: 'center' }}>No members found</Text>
                    )}
                  </ScrollView>
                  <TouchableOpacity style={cmStyles.assignDone} onPress={() => setShowAssignDropdown(false)}>
                    <Text style={cmStyles.assignDoneText}>Done</Text>
                  </TouchableOpacity>
                </View>
              )}
              {assignedSafe.length > 0 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  {assignedSafe.map((u) => (
                    <View key={u.id} style={cmStyles.selectedTag}>
                      <View style={[cmStyles.tagAvatarInner, { backgroundColor: u.avatarColor || '#00695C' }]}>
                        <Text style={{ fontSize: 8, fontWeight: '700', color: 'white' }}>{u.initials}</Text>
                      </View>
                      <Text style={cmStyles.selectedTagText}>{u.name}</Text>
                      <TouchableOpacity onPress={() => toggleUser(u)}>
                        <GoonaIcon icon={Icons.x} size={12} color="#64748B" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
            )}

            {/* Batch */}
            <View style={cmStyles.fieldGroup}>
              <Text style={cmStyles.fieldLabel}>Batch (optional)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
                <TouchableOpacity style={[cmStyles.chip, !batchId && cmStyles.chipActive]} onPress={() => setBatchId('')}>
                  <Text style={[cmStyles.chipText, !batchId && { color: '#00695C' }]}>None</Text>
                </TouchableOpacity>
                {(batches || []).map((b) => (
                  <TouchableOpacity key={b.id} style={[cmStyles.chip, batchId === b.id && cmStyles.chipActive]} onPress={() => setBatchId(b.id)}>
                    <Text style={[cmStyles.chipText, batchId === b.id && { color: '#00695C', fontWeight: '600' }]}>{b.batchName}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Due Date */}
            <View style={cmStyles.fieldGroup}>
              <Text style={cmStyles.fieldLabel}>Due Date</Text>
              <TouchableOpacity style={cmStyles.datePickerBtn} onPress={() => setShowDatePicker(true)}>
                <GoonaIcon icon={Icons.clock} size={16} color="#00695C" />
                <Text style={cmStyles.dateText}>
                  {dueDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <View>
                  <DateTimePicker
                    value={dueDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                    themeVariant="light"
                  />
                  {Platform.OS === 'ios' && (
                    <TouchableOpacity onPress={dismissDatePicker} style={cmStyles.pickerDone}>
                      <Text style={cmStyles.pickerDoneText}>Done</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            {/* Due Time */}
            <View style={cmStyles.fieldGroup}>
              <Text style={cmStyles.fieldLabel}>Due Time (optional)</Text>
              <TouchableOpacity style={cmStyles.datePickerBtn} onPress={() => setShowTimePicker(true)}>
                <GoonaIcon icon={Icons.clock} size={16} color="#00695C" />
                <Text style={cmStyles.dateText}>
                  {dueTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </TouchableOpacity>
              {showTimePicker && (
                <View>
                  <DateTimePicker
                    value={dueTime}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleTimeChange}
                    themeVariant="light"
                  />
                  {Platform.OS === 'ios' && (
                    <TouchableOpacity onPress={dismissTimePicker} style={cmStyles.pickerDone}>
                      <Text style={cmStyles.pickerDoneText}>Done</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            {/* Repeat Frequency (Reminders only) */}
            {type === 'reminder' && (
            <View style={cmStyles.fieldGroup}>
              <Text style={cmStyles.fieldLabel}>Repeat</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {REPEAT_OPTIONS.map((r) => (
                  <TouchableOpacity
                    key={r.key}
                    style={[cmStyles.chip, repeatFrequency === r.key && { borderColor: '#2E7D32', backgroundColor: 'rgba(46,125,50,0.08)' }]}
                    onPress={() => setRepeatFrequency(r.key)}
                  >
                    <GoonaIcon icon={r.key === 'none' ? Icons.x : Icons.refreshCw} size={12} color={repeatFrequency === r.key ? '#2E7D32' : '#94A3B8'} />
                    <Text style={[cmStyles.chipText, repeatFrequency === r.key && { color: '#2E7D32', fontWeight: '600' }]}>{r.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            )}

            {/* Visibility */}
            <View style={cmStyles.fieldGroup}>
              <Text style={cmStyles.fieldLabel}>Visibility</Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TouchableOpacity style={[cmStyles.chip, visibility === 'all' && cmStyles.chipActive]} onPress={() => setVisibility('all')}>
                  <Text style={[cmStyles.chipText, visibility === 'all' && { color: '#00695C', fontWeight: '600' }]}>All Roles</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[cmStyles.chip, visibility === 'management' && cmStyles.chipActive]} onPress={() => setVisibility('management')}>
                  <Text style={[cmStyles.chipText, visibility === 'management' && { color: '#00695C', fontWeight: '600' }]}>Management Only</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          <TouchableOpacity activeOpacity={0.85} onPress={handleSave} disabled={saving}>
            <LinearGradient colors={['#1B5E20', '#2E7D32', '#388E3C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={cmStyles.saveBtn}>
              <GoonaIcon icon={Icons.circleCheck} size={20} color="white" />
              <Text style={cmStyles.saveBtnText}>{saving ? 'Saving...' : editItem ? 'Update' : 'Create'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const cmStyles = StyleSheet.create({
  sheet: { backgroundColor: 'white', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 34 : 20, maxHeight: '85%' },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', alignSelf: 'center', marginTop: 10, marginBottom: 6 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 16 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1B1B1B' },
  closeBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  fieldGroup: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#1F2937', marginBottom: 6 },
  segmented: { flexDirection: 'row', gap: 6 },
  segBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 100, backgroundColor: '#F1F5F9' },
  segBtnActive: { backgroundColor: '#2E7D32' },
  segText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  segTextActive: { color: 'white' },
  inputWrap: { backgroundColor: '#F8FAF7', borderRadius: 14, paddingHorizontal: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  input: { fontSize: 15, fontWeight: '500', color: '#1B1B1B', paddingVertical: 12, paddingHorizontal: 0 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 100, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: 'transparent', marginRight: 6, marginBottom: 6 },
  chipActive: { backgroundColor: 'rgba(46,125,50,0.08)', borderColor: '#2E7D32' },
  chipText: { fontSize: 12, fontWeight: '500', color: '#64748B' },
  assignDropdown: { backgroundColor: 'white', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', marginTop: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 4, overflow: 'hidden' },
  assignRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 14 },
  assignDone: { paddingVertical: 10, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  assignDoneText: { fontSize: 14, fontWeight: '600', color: '#00695C' },
  assignRowActive: { backgroundColor: 'rgba(0,105,92,0.04)' },
  assignAvatar: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  assignName: { fontSize: 13, fontWeight: '500', color: '#1F2937', flex: 1 },
  selectedTag: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,105,92,0.06)', borderRadius: 100, paddingVertical: 4, paddingHorizontal: 10, borderWidth: 1, borderColor: 'rgba(0,105,92,0.15)' },
  tagAvatarInner: { width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  selectedTagText: { fontSize: 11, fontWeight: '500', color: '#00695C' },
  datePickerBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F8FAF7', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  dateText: { fontSize: 14, fontWeight: '500', color: '#1B1B1B' },
  pickerDone: { alignItems: 'center', paddingVertical: 8, marginTop: 4 },
  pickerDoneText: { fontSize: 14, fontWeight: '600', color: '#00695C' },
  saveBtn: { height: 56, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 12, shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 24, elevation: 6 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: 'white' },
})

function StatsBar({ items }: { items: ReminderTaskItem[] }) {
  const safe = Array.isArray(items) ? items : []
  const total = safe.length
  const active = safe.filter((i) => i.status !== 'completed').length
  const completed = safe.filter((i) => i.status === 'completed').length
  const critical = safe.filter((i) => i.priority === 'critical' && i.status !== 'completed').length
  const overdue = safe.filter((i) => new Date(i.dueDate).getTime() < Date.now() && i.status !== 'completed').length
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0

  const stats = [
    { label: 'Active', value: active, color: '#3B82F6' },
    { label: 'Completed', value: completed, color: '#16A34A' },
    { label: 'Critical', value: critical, color: '#EF4444' },
    { label: 'Overdue', value: overdue, color: '#F59E0B' },
  ]

  return (
    <Animated.View entering={FadeInUp.duration(400).springify()} style={sbStyles.card}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text style={sbStyles.title}>Overview</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <ProgressRing progress={progress} size={24} strokeWidth={2.5} />
          <Text style={{ fontSize: 11, fontWeight: '600', color: '#64748B' }}>{progress}% done</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {stats.map((s) => (
          <View key={s.label} style={[sbStyles.statItem, { backgroundColor: `${s.color}08` }]}>
            <Text style={[sbStyles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={sbStyles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>
    </Animated.View>
  )
}
const sbStyles = StyleSheet.create({
  card: { backgroundColor: 'white', borderRadius: 20, padding: 16, marginTop: 14, borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.02, shadowRadius: 16, elevation: 2 },
  title: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  statItem: { flex: 1, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 6, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 9, fontWeight: '600', color: '#64748B', marginTop: 2 },
})

export default function ReminderTasksScreen() {
  const insets = useSafeAreaInsets()
  const role = useAuthStore((s) => s.role)
  const authUserName = useAuthStore((s) => s.userName)
  const [activeTab, setActiveTab] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [editItem, setEditItem] = useState<ReminderTaskItem | null>(null)
  const [swipeReply, setSwipeReply] = useState('')
  const [replyText, setReplyText] = useState('')

  const {
    items, sortKey, setSortKey, initialized, loadFromStorage,
    addItem, updateItem, completeItem,
    getFilteredItems, getSortedItems,
  } = useReminderTaskStore()

  const addFeedPost = useFarmChatStore((s) => s.addFeedPost)

  useEffect(() => { if (!initialized) loadFromStorage() }, [])

  const filtered = useMemo(() => getFilteredItems(role, activeTab as any), [items, role, activeTab])
  const sorted = useMemo(() => getSortedItems(filtered), [filtered, sortKey])

  const sendReply = () => {
    if (!replyText.trim()) return
    Keyboard.dismiss()
    addFeedPost({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      type: 'announcement',
      timestamp: Date.now(),
      actorName: authUserName || 'Farm Owner',
      actorRole: role,
      actorInitials: (authUserName || 'Farm Owner').split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'FO',
      actorColor: '#00695C',
      detail: `${swipeReply}: ${replyText}`,
      highlight: 'Reply',
      tags: ['Reply'],
      visibility: 'all',
    })
    setSwipeReply('')
    setReplyText('')
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  }

  const handleCreate = (data: any) => {
    addItem(data)

    const creatorName = data.creatorName || 'Farm Owner'
    const assigned = Array.isArray(data.assignedTo) ? data.assignedTo : []

    addFeedPost({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      type: 'announcement',
      timestamp: Date.now(),
      actorName: creatorName,
      actorRole: role,
      actorInitials: creatorName.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'FO',
      actorColor: '#00695C',
      detail: `New ${data.type}: "${data.title}" assigned to ${assigned.map((u: TaggedUser) => u.name).join(', ') || 'Unassigned'}`,
      highlight: `Due ${new Date(data.dueDate).toLocaleDateString()}`,
      tags: data.type === 'task' ? ['Task'] : ['Reminder'],
      visibility: data.visibility,
    })

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  }

  const handleEdit = (data: any) => {
    if (editItem) {
      updateItem(editItem.id, data)
      setEditItem(null)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    }
  }

  const handleComplete = (id: string) => {
    completeItem(id)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F8F9F5' }}>
      <StatusBar style="dark" />

      <View style={{ position: 'absolute', top: -50, right: -50, width: 320, height: 320, zIndex: 0 }} pointerEvents="none">
        <View style={{ width: 320, height: 320, borderRadius: 160, backgroundColor: 'rgba(0,105,92,0.08)' }} />
      </View>

      <View style={{ flex: 1, zIndex: 1 }}>
        {/* Top Nav */}
        <Animated.View entering={FadeInUp.duration(500).springify()} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: insets.top + 16 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10 }} activeOpacity={0.7}>
            <GoonaIcon icon={Icons.arrowLeft} size={22} color="#1B1B1B" />
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <GoonaIcon icon={Icons.bell} size={20} color="#00695C" />
            <Text style={{ fontWeight: '700', fontSize: 14, color: '#1B1B1B' }}>GOONA</Text>
          </View>
          <Text style={{ fontSize: 14, fontWeight: '500', color: '#616161' }}>Reminders</Text>
        </Animated.View>

        {/* Header */}
        <Animated.View entering={FadeInUp.duration(500).delay(80).springify()} style={{ paddingHorizontal: 24, marginTop: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ fontWeight: '800', fontSize: IS_SMALL ? 26 : 30, color: '#1F2937' }}>Reminders</Text>
              <Text style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>Tasks, reminders & team assignments</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setShowCreate(true)}
              style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 }}
            >
              <Text style={{ fontSize: 24, color: '#1F2937', lineHeight: 26 }}>+</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Stats */}
        <View style={{ paddingHorizontal: 24 }}>
          <StatsBar items={items} />
        </View>

        {/* Tabs */}
        <Animated.View entering={FadeInUp.duration(400).delay(150).springify()} style={{ paddingHorizontal: 24, marginTop: 16 }}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={TABS}
            keyExtractor={(t) => t.key}
            contentContainerStyle={{ gap: 6 }}
            renderItem={({ item: tab }) => {
              const isActive = activeTab === tab.key
              return (
                <TouchableOpacity
                  style={[rtStyles.tabPill, isActive && rtStyles.tabPillActive]}
                  activeOpacity={0.8}
                  onPress={() => setActiveTab(tab.key)}
                >
                  <GoonaIcon icon={tab.icon} size={13} color={isActive ? '#fff' : '#64748B'} />
                  <Text style={[rtStyles.tabText, isActive && rtStyles.tabTextActive]}>{tab.label}</Text>
                </TouchableOpacity>
              )
            }}
          />
        </Animated.View>

        {/* Sort + Count */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, marginTop: 14 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#64748B' }}>{(sorted || []).length} item{(sorted || []).length !== 1 ? 's' : ''}</Text>
          <SortPicker sortKey={sortKey} onSelect={setSortKey} />
        </View>

        {/* Swipe reply bar */}
        {swipeReply !== '' && (
          <View style={{ paddingHorizontal: 24, paddingVertical: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F1F5F9', borderRadius: 12, padding: 10 }}>
              <GoonaIcon icon={Icons.arrowLeft} size={14} color="#00695C" />
              <Text style={{ fontSize: 12, color: '#64748B', flex: 1 }} numberOfLines={1}>{swipeReply}</Text>
              <TouchableOpacity onPress={() => { setSwipeReply(''); setReplyText('') }}>
                <GoonaIcon icon={Icons.x} size={14} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* List */}
        <FlatList
          data={sorted || []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 10, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <ReminderTaskCard
              item={item}
              index={index}
              onComplete={() => handleComplete(item.id)}
              onPress={() => { setEditItem(item); setShowCreate(true) }}
              onSwipeAction={(action) => {
                if (action === 'complete') handleComplete(item.id)
                if (action === 'reply') {
                  setSwipeReply(`Replying to: ${item.title}`)
                  setReplyText('')
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                }
              }}
            />
          )}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <GoonaIcon icon={Icons.clipboardList} size={48} color="#CBD5E1" />
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#94A3B8', marginTop: 12 }}>No items found</Text>
            </View>
          }
        />
      </View>

      {/* Input bar */}
      {!showCreate && (
        <View style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          paddingBottom: insets.bottom + 8,
          paddingTop: 8, paddingHorizontal: 16,
          backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#F1F5F9',
          shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.03, shadowRadius: 12, elevation: 4,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F8FAF7', borderRadius: 16, paddingLeft: 10, paddingRight: 4, borderWidth: 1, borderColor: '#E2E8F0' }}>
            <TouchableOpacity activeOpacity={0.7} onPress={() => setShowCreate(true)} style={{ padding: 8 }}>
              <GoonaIcon icon={Icons.mic} size={20} color="#00695C" />
            </TouchableOpacity>
            <TextInput
              style={{ flex: 1, fontSize: 15, fontWeight: '500', color: '#1B1B1B', paddingVertical: 10, paddingHorizontal: 0 }}
              placeholder={swipeReply ? 'Type reply...' : 'Quick task...'}
              placeholderTextColor="#CBD5E1"
              value={replyText}
              onChangeText={setReplyText}
              onSubmitEditing={() => {
                if (replyText.trim()) {
                  if (swipeReply) { sendReply() } else { setShowCreate(true) }
                }
              }}
            />
            {swipeReply ? (
              <TouchableOpacity activeOpacity={0.7} onPress={sendReply} style={{ backgroundColor: '#3B82F6', borderRadius: 12, padding: 10 }}>
                <GoonaIcon icon={Icons.send} size={20} color="white" />
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity activeOpacity={0.7} onPress={() => setShowCreate(true)} style={{ padding: 6 }}>
                  <GoonaIcon icon={Icons.image} size={20} color="#00695C" />
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.7} onPress={() => setShowCreate(true)} style={{ padding: 6 }}>
                  <GoonaIcon icon={Icons.fileText} size={20} color="#00695C" />
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setShowCreate(true)}
                  style={{ backgroundColor: '#00695C', borderRadius: 12, padding: 10 }}
                >
                  <GoonaIcon icon={Icons.plus} size={20} color="white" />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      )}

      {/* Create/Edit Modal */}
      <CreateTaskModal
        visible={showCreate}
        onClose={() => { setShowCreate(false); setEditItem(null) }}
        onSave={editItem ? handleEdit : handleCreate}
        editItem={editItem}
      />
    </View>
  )
}

const rtStyles = StyleSheet.create({
  tabPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 50,
    backgroundColor: 'white', borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02, shadowRadius: 6, elevation: 1,
  },
  tabPillActive: { backgroundColor: '#00695C', borderColor: '#00695C', shadowColor: '#00695C', shadowOpacity: 0.2, shadowRadius: 12 },
  tabText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  tabTextActive: { color: '#fff' },
})
