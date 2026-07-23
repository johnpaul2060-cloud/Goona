import { useState, useMemo, useEffect, useRef } from 'react'
import {
  View, Text, TouchableOpacity, TextInput, ScrollView,
  StyleSheet, Platform, ActivityIndicator,
  BackHandler, Keyboard, Dimensions, InteractionManager,
} from 'react-native'
import Animated, {
  FadeInUp, FadeIn,
  useSharedValue, useAnimatedStyle, withTiming,
} from 'react-native-reanimated'
import { router } from 'expo-router'
import { useFarmChatStore } from '../../store/useFarmChatStore'
import GoonaIcon from '../ui/GoonaIcon'
import { Icons } from '../../shared/icons'

const COLORS = ['#16A34A', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4']

interface CreateGroupModalProps {
  visible: boolean
  onClose: () => void
}

const { height: SCREEN_H } = Dimensions.get('window')

export default function CreateGroupModal({ visible, onClose }: CreateGroupModalProps) {
  const allUsers = useFarmChatStore((s) => s.allUsers)
  const createGroup = useFarmChatStore((s) => s.createGroup)

  const [groupName, setGroupName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [created, setCreated] = useState(false)
  const [newGroupId, setNewGroupId] = useState<string | null>(null)
  const [nameError, setNameError] = useState('')
  const [membersError, setMembersError] = useState('')

  const scrollRef = useRef<ScrollView>(null)
  const nameInputRef = useRef<TextInput>(null)

  const availableUsers = useMemo(() => allUsers.filter((u) => u.id !== 'owner'), [allUsers])

  /* ─── Keyboard offset — tracked both as state (for maxHeight) and shared value (for smooth margin) ─── */
  const [kbState, setKbState] = useState(0)
  const kbOffset = useSharedValue(0)

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        const h = e.endCoordinates.height
        setKbState(h)
        kbOffset.value = withTiming(h, { duration: 250 })
      },
    )
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKbState(0)
        kbOffset.value = withTiming(0, { duration: 250 })
      },
    )
    return () => { showSub.remove(); hideSub.remove() }
  }, [])

  const sheetWrapperStyle = useAnimatedStyle(() => ({
    marginBottom: kbOffset.value,
  }))

  /* ─── Auto-focus name input after entry animation ─── */
  useEffect(() => {
    if (!visible || created) return
    const task = InteractionManager.runAfterInteractions(() => {
      setTimeout(() => nameInputRef.current?.focus(), 120)
    })
    return () => task.cancel()
  }, [visible])

  /* ─── Scroll input into view when keyboard appears ─── */
  useEffect(() => {
    if (!visible) return
    const sub = Keyboard.addListener('keyboardDidShow', () => {
      scrollRef.current?.scrollTo({ y: 0, animated: true })
    })
    return () => sub.remove()
  }, [visible])

  /* ─── Android back button closes the modal ─── */
  useEffect(() => {
    if (!visible) return
    const handler = () => { handleCancel(); return true }
    const sub = BackHandler.addEventListener('hardwareBackPress', handler)
    return () => sub.remove()
  }, [visible])

  const toggleMember = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    if (membersError) setMembersError('')
  }

  const reset = () => {
    setGroupName('')
    setDescription('')
    setSelectedIds(new Set())
    setSaving(false)
    setCreated(false)
    setNewGroupId(null)
    setNameError('')
    setMembersError('')
  }

  const handleCancel = () => {
    Keyboard.dismiss()
    reset()
    onClose()
  }

  const handleCreate = () => {
    Keyboard.dismiss()
    let valid = true
    if (!groupName.trim()) {
      setNameError('Group name is required')
      valid = false
    } else {
      setNameError('')
    }
    if (selectedIds.size === 0) {
      setMembersError('Add at least one member')
      valid = false
    } else {
      setMembersError('')
    }
    if (!valid) return

    setSaving(true)
    const id = createGroup(groupName.trim(), description.trim(), Array.from(selectedIds))
    setNewGroupId(id)
    setSaving(false)
    setCreated(true)
  }

  const handleOpenGroup = () => {
    if (newGroupId) {
      Keyboard.dismiss()
      const gid = newGroupId
      reset()
      onClose()
      InteractionManager.runAfterInteractions(() => {
        router.push(`/(tabs)/farmchat/chat/${gid}` as any)
      })
    }
  }

  const selectedCount = selectedIds.size

  if (!visible) return null

  /* ─── Dynamic sheet maxHeight (keyboard-aware) ─── */
  const sheetMaxH = kbState > 0
    ? Math.min(SCREEN_H * 0.85, SCREEN_H - kbState - 40)
    : SCREEN_H * 0.75

  /* ─── Shared sheet renderer ─── */
  function renderSheet(children: React.ReactNode) {
    return (
      <Animated.View
        entering={FadeInUp.duration(350).springify().damping(20)}
        style={[styles.sheet, { maxHeight: sheetMaxH }]}
      >
        <View style={styles.handleRow}>
          <View style={styles.handle} />
        </View>
        {children}
      </Animated.View>
    )
  }

  /* ─── Success state ─── */
  if (created) {
    return (
      <View style={styles.root}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleCancel} />
        <Animated.View style={[styles.sheetOuter, sheetWrapperStyle]}>
          {renderSheet(
            <Animated.View entering={FadeIn.duration(250)} style={styles.successWrap}>
              <View style={styles.successIcon}>
                <GoonaIcon icon={Icons.checkCircle} size={44} color="#16A34A" />
              </View>
              <Text style={styles.successTitle}>Group Created</Text>
              <Text style={styles.successSub}>
                &ldquo;{groupName}&rdquo; is ready with {selectedIds.size + 1} members
              </Text>
              <TouchableOpacity style={styles.openBtn} activeOpacity={0.85} onPress={handleOpenGroup}>
                <Text style={styles.openBtnText}>Open Group</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeBtn} activeOpacity={0.7} onPress={handleCancel}>
                <Text style={styles.closeBtnText}>Back to Groups</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </Animated.View>
      </View>
    )
  }

  /* ─── Form state ─── */
  return (
    <View style={styles.root}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleCancel} />
      <Animated.View style={[styles.sheetOuter, sheetWrapperStyle]}>
        {renderSheet(
          <>
            <ScrollView
              ref={scrollRef}
              style={styles.scrollArea}
              contentContainerStyle={styles.scrollInner}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
            >
              <Text style={styles.title}>Create New Group</Text>

              <Text style={styles.fieldLabel}>Group Name</Text>
              <TextInput
                ref={nameInputRef}
                style={[styles.input, nameError ? styles.inputError : null]}
                placeholder="Enter group name"
                placeholderTextColor="#94A3B8"
                value={groupName}
                onChangeText={(t) => { setGroupName(t); if (nameError) setNameError('') }}
                maxLength={50}
                returnKeyType="next"
                autoCorrect={false}
                onSubmitEditing={() => {
                  scrollRef.current?.scrollTo({ y: 80, animated: true })
                }}
              />
              {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}

              <View style={styles.membersHeader}>
                <Text style={styles.fieldLabel}>Add Members</Text>
                {selectedCount > 0 && (
                  <View style={styles.selectedBadge}>
                    <Text style={styles.selectedBadgeText}>{selectedCount} selected</Text>
                  </View>
                )}
              </View>
              <Text style={styles.fieldHint}>Tap to select team members</Text>
              {membersError ? <Text style={styles.errorText}>{membersError}</Text> : null}

              <View style={styles.membersWrap}>
                {availableUsers.map((u, i) => {
                  const isSelected = selectedIds.has(u.id)
                  const color = COLORS[i % COLORS.length]
                  return (
                    <TouchableOpacity
                      key={u.id}
                      activeOpacity={0.75}
                      style={[styles.memberCard, isSelected && styles.memberCardSelected]}
                      onPress={() => toggleMember(u.id)}
                    >
                      <View style={[styles.memberAvatar, { backgroundColor: color + '20' }]}>
                        <Text style={[styles.memberInitials, { color }]}>
                          {u.name.split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.memberInfo}>
                        <Text style={[styles.memberName, isSelected && styles.memberNameSelected]}>{u.name}</Text>
                        <Text style={styles.memberRole}>{u.role}</Text>
                      </View>
                      <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                        {isSelected && <GoonaIcon icon={Icons.check} size={12} color="#fff" />}
                      </View>
                    </TouchableOpacity>
                  )
                })}
              </View>

              <Text style={styles.fieldLabel}>Description (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="What is this group about?"
                placeholderTextColor="#94A3B8"
                value={description}
                onChangeText={setDescription}
                maxLength={200}
                multiline
                numberOfLines={2}
                textAlignVertical="top"
              />
            </ScrollView>

            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelBtn} activeOpacity={0.7} onPress={handleCancel}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createBtn, saving && styles.createBtnDisabled]}
                activeOpacity={0.85}
                disabled={saving}
                onPress={handleCreate}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.createBtnText}>Create Group</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 1000, elevation: 1000,
  },
  backdrop: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },

  /* ─── Sheet outer — positioned at bottom, raised by keyboard via animated margin ─── */
  sheetOuter: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
  },

  /* ─── Sheet card ─── */
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  handleRow: { alignItems: 'center', paddingTop: 8, paddingBottom: 4 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0' },

  scrollArea: { maxHeight: '100%' },
  scrollInner: { paddingHorizontal: 20, paddingBottom: 4 },

  title: {
    fontSize: 18, fontWeight: '700', color: '#0F172A',
    marginBottom: 14, marginTop: 4,
  },

  fieldLabel: { fontSize: 13, fontWeight: '700', color: '#0F172A', marginBottom: 5, marginTop: 3 },
  fieldHint: { fontSize: 11, color: '#94A3B8', marginBottom: 8, marginTop: -3 },
  input: {
    borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 15, color: '#0F172A', backgroundColor: '#F8FAFC',
  },
  inputError: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  textArea: { minHeight: 56, paddingTop: 11 },
  errorText: {
    fontSize: 11, color: '#EF4444', fontWeight: '500',
    marginTop: 1, marginBottom: 1,
  },

  membersHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 3,
  },
  selectedBadge: {
    backgroundColor: '#16A34A', borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  selectedBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },

  membersWrap: { gap: 7, marginBottom: 6 },
  memberCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8FAFC', borderRadius: 14, padding: 11,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  memberCardSelected: { borderColor: '#16A34A', backgroundColor: '#F0FDF4' },
  memberAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  memberInitials: { fontSize: 12, fontWeight: '700' },
  memberInfo: { flex: 1, marginLeft: 10 },
  memberName: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  memberNameSelected: { color: '#16A34A' },
  memberRole: { fontSize: 11, color: '#64748B', marginTop: 1 },
  checkbox: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: '#CBD5E1',
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: '#16A34A', borderColor: '#16A34A' },

  actions: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 20, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: '#F1F5F9',
    backgroundColor: '#fff',
  },
  cancelBtn: {
    flex: 1, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0',
    paddingVertical: 13, alignItems: 'center',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  createBtn: {
    flex: 1, borderRadius: 12, backgroundColor: '#16A34A',
    paddingVertical: 13, alignItems: 'center',
  },
  createBtnDisabled: { opacity: 0.6 },
  createBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  successWrap: { alignItems: 'center', paddingHorizontal: 20, paddingVertical: 28 },
  successIcon: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: '#F0FDF4',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  successTitle: { fontSize: 20, fontWeight: '800', color: '#16A34A', marginBottom: 6 },
  successSub: {
    fontSize: 14, color: '#64748B', textAlign: 'center',
    marginBottom: 22, lineHeight: 20,
  },
  openBtn: {
    backgroundColor: '#16A34A', borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 48, marginBottom: 10,
  },
  openBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  closeBtn: { paddingVertical: 8 },
  closeBtnText: { fontSize: 13, fontWeight: '600', color: '#94A3B8' },
})
