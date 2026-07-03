import { useState, useMemo } from 'react'
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native'
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated'
import { router } from 'expo-router'
import { useFarmChatStore } from '../../store/useFarmChatStore'
import GoonaIcon from '../ui/GoonaIcon'
import { Icons } from '../../shared/icons'

const COLORS = ['#16A34A', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4']

interface CreateGroupModalProps {
  visible: boolean
  onClose: () => void
}

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

  const availableUsers = useMemo(() => allUsers.filter((u) => u.id !== 'owner'), [allUsers])

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
    reset()
    onClose()
  }

  const handleCreate = () => {
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
      reset()
      onClose()
      router.push(`/(tabs)/chat/${newGroupId}` as any)
    }
  }

  if (!visible) return null

  if (created) {
    return (
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleCancel} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetWrapper}>
          <Animated.View entering={FadeInUp.duration(400).springify()} style={styles.sheet}>
            <View style={styles.handleRow}>
              <View style={styles.handle} />
            </View>
            <Animated.View entering={FadeIn.duration(300)} style={styles.successWrap}>
              <View style={styles.successIcon}>
                <GoonaIcon icon={Icons.checkCircle} size={44} color="#16A34A" />
              </View>
              <Text style={styles.successTitle}>Group Created</Text>
              <Text style={styles.successSub}>
                "{groupName}" is ready with {selectedIds.size + 1} members
              </Text>
              <TouchableOpacity style={styles.openBtn} activeOpacity={0.85} onPress={handleOpenGroup}>
                <Text style={styles.openBtnText}>Open Group</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeBtn} activeOpacity={0.7} onPress={handleCancel}>
                <Text style={styles.closeBtnText}>Back to Groups</Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    )
  }

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleCancel} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetWrapper}>
        <Animated.View entering={FadeInUp.duration(400).springify()} style={styles.sheet}>
          <View style={styles.handleRow}>
            <View style={styles.handle} />
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollInner}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.title}>Create New Group</Text>

            {/* Group Name */}
            <Text style={styles.fieldLabel}>Group Name</Text>
            <TextInput
              style={[styles.input, nameError ? styles.inputError : null]}
              placeholder="e.g. Batch B Team"
              placeholderTextColor="#94A3B8"
              value={groupName}
              onChangeText={(t) => { setGroupName(t); if (nameError) setNameError('') }}
              maxLength={50}
              autoFocus
            />
            {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}

            {/* Add Members */}
            <Text style={styles.fieldLabel}>Add Members</Text>
            <Text style={styles.fieldHint}>Tap to select team members</Text>
            {membersError ? <Text style={styles.errorText}>{membersError}</Text> : null}

            <View style={styles.membersWrap}>
              {availableUsers.map((u, i) => {
                const isSelected = selectedIds.has(u.id)
                return (
                  <TouchableOpacity
                    key={u.id}
                    activeOpacity={0.75}
                    style={[styles.memberCard, isSelected && styles.memberCardSelected]}
                    onPress={() => toggleMember(u.id)}
                  >
                    <View style={[styles.memberAvatar, { backgroundColor: COLORS[i % COLORS.length] + '20' }]}>
                      <Text style={[styles.memberInitials, { color: COLORS[i % COLORS.length] }]}>
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

            {/* Optional Description */}
            <Text style={styles.fieldLabel}>Description (optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="What is this group about?"
              placeholderTextColor="#94A3B8"
              value={description}
              onChangeText={setDescription}
              maxLength={200}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </ScrollView>

          {/* Bottom Actions */}
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
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 60 },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheetWrapper: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' },
  handleRow: { alignItems: 'center', paddingTop: 8, paddingBottom: 4 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0' },
  scroll: { maxHeight: '100%' },
  scrollInner: { paddingHorizontal: 20, paddingBottom: 16 },

  title: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 20, marginTop: 4 },

  fieldLabel: { fontSize: 13, fontWeight: '700', color: '#0F172A', marginBottom: 6, marginTop: 4 },
  fieldHint: { fontSize: 11, color: '#94A3B8', marginBottom: 10, marginTop: -4 },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#0F172A', backgroundColor: '#F8FAFC' },
  inputError: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  textArea: { minHeight: 72, paddingTop: 12 },
  errorText: { fontSize: 11, color: '#EF4444', fontWeight: '500', marginTop: 2, marginBottom: 2 },

  membersWrap: { gap: 8, marginBottom: 12 },
  memberCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 14, padding: 12, borderWidth: 1.5, borderColor: 'transparent' },
  memberCardSelected: { borderColor: '#16A34A', backgroundColor: '#F0FDF4' },
  memberAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  memberInitials: { fontSize: 13, fontWeight: '700' },
  memberInfo: { flex: 1, marginLeft: 10 },
  memberName: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  memberNameSelected: { color: '#16A34A' },
  memberRole: { fontSize: 11, color: '#64748B', marginTop: 1 },
  checkbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: '#16A34A', borderColor: '#16A34A' },

  actions: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  cancelBtn: { flex: 1, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  createBtn: { flex: 1, borderRadius: 12, backgroundColor: '#16A34A', paddingVertical: 14, alignItems: 'center' },
  createBtnDisabled: { opacity: 0.6 },
  createBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  /* Success state */
  successWrap: { alignItems: 'center', paddingHorizontal: 20, paddingVertical: 32 },
  successIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  successTitle: { fontSize: 20, fontWeight: '800', color: '#16A34A', marginBottom: 6 },
  successSub: { fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  openBtn: { backgroundColor: '#16A34A', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 48, marginBottom: 10 },
  openBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  closeBtn: { paddingVertical: 8 },
  closeBtnText: { fontSize: 13, fontWeight: '600', color: '#94A3B8' },
})
