import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, FlatList, TextInput, KeyboardAvoidingView, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Icons } from '../../shared/icons'
import { useFarmChatStore } from '../../store/useFarmChatStore'
import { useAuthStore } from '../../store/useAuthStore'
import { usePrioritizedChat, PRIORITY_COLORS } from '../../store/farmPriorityEngine'
import { FARM_NAME } from '../../constants/farm'
import FeedPostCard from '../../components/farmchat/FeedPostCard'
import ConversationListItem from '../../components/farmchat/ConversationListItem'
import CreateGroupModal from '../../components/farmchat/CreateGroupModal'
import BottomDock from '../../components/navigation/BottomDock'

type InternalTab = 'feed' | 'messages' | 'groups'
type Comment = { id: string; username: string; text: string; timestamp: number }

const DOCK_TOTAL_HEIGHT = 130
const MOCK_COMMENTS: Record<string, Comment[]> = {
  p2: [
    { id: 'c1', username: 'James S.', text: 'Noted, Paul. Will monitor feeding.', timestamp: Date.now() - 1800000 },
    { id: 'c2', username: 'Mary J.', text: 'Waterers checked and clean.', timestamp: Date.now() - 900000 },
  ],
  p7: [
    { id: 'c3', username: 'Paul K.', text: 'Great work, Mary!', timestamp: Date.now() - 3600000 },
  ],
}

function SectionDivider({ label, count }: { label: string; count?: number }) {
  return (
    <View style={styles.sectionDivider}>
      <View style={styles.sectionLine} />
      <View style={styles.sectionLabelRow}>
        <Text style={styles.sectionLabel}>{label}</Text>
        {count !== undefined && (
          <View style={styles.sectionCountBadge}>
            <Text style={styles.sectionCountText}>{count}</Text>
          </View>
        )}
      </View>
      <View style={styles.sectionLine} />
    </View>
  )
}

function isManagement(role: string) {
  return role === 'Owner' || role === 'Manager'
}

function CommentSheet({ postId, comments, onClose, onSend }: { postId: string; comments: Comment[]; onClose: () => void; onSend: (text: string) => void }) {
  const [text, setText] = useState('')
  const inputRef = useRef<TextInput>(null)

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  const handleSend = () => {
    if (!text.trim()) return
    onSend(text.trim())
    setText('')
  }

  return (
    <View style={styles.commentOverlay}>
      <TouchableOpacity style={styles.commentBackdrop} onPress={onClose} activeOpacity={1} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.commentSheet}>
        <View style={styles.commentSheetHandle}>
          <View style={styles.commentHandleBar} />
        </View>
        <View style={styles.commentHeader}>
          <Text style={styles.commentHeaderTitle}>Comments</Text>
          <TouchableOpacity onPress={onClose}>
            <Icons.x size={20} color="#64748B" />
          </TouchableOpacity>
        </View>
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.commentRow}>
              <View style={styles.commentAvatar}>
                <Text style={styles.commentAvatarText}>{item.username[0]}</Text>
              </View>
              <View style={styles.commentBubble}>
                <Text style={styles.commentUsername}>{item.username}</Text>
                <Text style={styles.commentText}>{item.text}</Text>
              </View>
            </View>
          )}
          contentContainerStyle={styles.commentListContent}
          showsVerticalScrollIndicator={false}
        />
        <View style={styles.commentInputRow}>
          <TextInput
            ref={inputRef}
            style={styles.commentInput}
            placeholder="Write a comment..."
            placeholderTextColor="#94A3B8"
            value={text}
            onChangeText={setText}
          />
          <TouchableOpacity style={[styles.commentSendBtn, !text.trim() && styles.commentSendBtnDisabled]} onPress={handleSend} disabled={!text.trim()}>
            <Icons.send size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}

export default function FarmChatScreen() {
  const insets = useSafeAreaInsets()
  const [internalTab, setInternalTab] = useState<InternalTab>('feed')
  const [postText, setPostText] = useState('')
  const [commentingPostId, setCommentingPostId] = useState<string | null>(null)
  const [localComments, setLocalComments] = useState<Record<string, Comment[]>>(MOCK_COMMENTS)
  const [showCreateGroup, setShowCreateGroup] = useState(false)

  const feedPosts = useFarmChatStore((s) => s.feedPosts)
  const conversations = useFarmChatStore((s) => s.conversations)
  const seedDemoData = useFarmChatStore((s) => s.seedDemoData)
  const toggleLike = useFarmChatStore((s) => s.toggleLike)
  const toggleSave = useFarmChatStore((s) => s.toggleSave)
  const userRole = useAuthStore((s) => s.role)

  useEffect(() => { seedDemoData() }, [])

  const { rankedFeed, pinnedFeedType } = usePrioritizedChat()

  const visiblePosts = useMemo(() => {
    if (isManagement(userRole)) return rankedFeed
    return rankedFeed.filter((p) => p.visibility !== 'management')
  }, [rankedFeed, userRole])

  const openConversation = useCallback((convId: string) => {
    router.push(`/(tabs)/chat/${convId}`)
  }, [])

  const handleCommentSend = useCallback((text: string) => {
    if (!commentingPostId) return
    const newComment: Comment = { id: 'c' + Date.now(), username: 'Paul', text, timestamp: Date.now() }
    setLocalComments((prev) => ({
      ...prev,
      [commentingPostId]: [...(prev[commentingPostId] || []), newComment],
    }))
  }, [commentingPostId])

  const currentComments = commentingPostId ? localComments[commentingPostId] || [] : []

  const direct = conversations.filter((c) => c.type === 'direct')
  const groups = conversations.filter((c) => c.type === 'group')
  const totalMessageUnread = useMemo(() => direct.reduce((s, c) => s + c.unreadCount, 0), [direct])
  const totalGroupUnread = useMemo(() => groups.reduce((s, c) => s + c.unreadCount, 0), [groups])

  const renderFeedHeader = () => (
    <View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.topComposer}>
          <TextInput
            style={styles.topComposerInput}
            placeholder="What's happening in the farm?"
            placeholderTextColor="#94A3B8"
            value={postText}
            onChangeText={setPostText}
            multiline
          />
          <View style={styles.topComposerActions}>
            <View style={styles.topComposerLeft}>
              <TouchableOpacity style={styles.topComposerIconBtn}>
                <Icons.camera size={20} color="#64748B" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.topComposerIconBtn}>
                <Icons.mic size={20} color="#64748B" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.topComposerIconBtn}>
                <Icons.barChart3 size={20} color="#64748B" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.topComposerIconBtn}>
                <Icons.paperclip size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={[styles.topComposerSendBtn, !postText.trim() && styles.topComposerSendBtnDisabled]}>
              <Icons.send size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
      {pinnedFeedType && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' }} />
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#EF4444', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Priority Feed — {pinnedFeedType.replace('_', ' ')}
          </Text>
        </View>
      )}
      <SectionDivider label="Today" count={12} />
    </View>
  )

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <View style={styles.wordmarkRow}>
              <Text style={styles.wordmarkFarm}>Farm</Text>
              <Text style={styles.wordmarkChat}>Chat</Text>
              <View style={styles.osBadge}>
                <Text style={styles.osBadgeText}>OS v2.0</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.farmSelector}>
            <Text style={styles.farmName}>{FARM_NAME}</Text>
            <Icons.chevronDown size={14} color="#64748B" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Top Tabs */}
      <View style={styles.topTabRow}>
        {([
          { key: 'feed' as InternalTab, label: 'Farm Feed', icon: Icons.sprout, badge: 0 },
          { key: 'messages' as InternalTab, label: 'Messages', icon: Icons.messageCircle, badge: totalMessageUnread },
          { key: 'groups' as InternalTab, label: 'Groups', icon: Icons.users, badge: totalGroupUnread },
        ]).map((tab) => {
          const isActive = internalTab === tab.key
          const IconComp = tab.icon
          return (
            <TouchableOpacity key={tab.key} style={styles.topTab} onPress={() => setInternalTab(tab.key)}>
              <View style={styles.topTabInner}>
                <View style={styles.topTabIconWrap}>
                  <IconComp size={16} color={isActive ? '#16A34A' : '#94A3B8'} strokeWidth={2.5} />
                  {tab.badge > 0 && (
                    <View style={styles.topTabIconBadge}>
                      <Text style={styles.topTabIconBadgeText}>{tab.badge > 99 ? '99+' : tab.badge}</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.topTabText, isActive && styles.topTabTextActive]}>{tab.label}</Text>
              </View>
              {isActive && <View style={styles.topTabUnderline} />}
            </TouchableOpacity>
          )
        })}
      </View>

      {/* Content — fills remaining space naturally */}
      {internalTab === 'feed' ? (
        <FlatList
          data={visiblePosts}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => {
            const dotColor = item.isAlert ? '#EF4444' : item.riskLevel === 'high' ? '#F59E0B' : index < 2 && pinnedFeedType && item.type === pinnedFeedType ? '#EF4444' : '#16A34A'
            return (
              <View style={[styles.timelineRow, item.isAlert && { backgroundColor: '#FEF2F2', borderRadius: 12, marginHorizontal: 8, paddingVertical: 4 }]}>
                <View style={styles.timelineLine}>
                  <View style={[styles.timelineDot, { backgroundColor: dotColor }]} />
                  <View style={styles.timelineConnector} />
                </View>
                <View style={styles.timelineContent}>
                  <FeedPostCard
                    post={item}
                    onLike={() => toggleLike(item.id)}
                    onSave={() => toggleSave(item.id)}
                    onComment={() => setCommentingPostId(item.id)}
                  />
                </View>
              </View>
            )
          }}
          ListHeaderComponent={renderFeedHeader}
          contentContainerStyle={{ paddingBottom: DOCK_TOTAL_HEIGHT + 40 }}
          showsVerticalScrollIndicator={false}
        />
      ) : internalTab === 'messages' ? (
        <FlatList
          data={direct}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ConversationListItem conv={item} onPress={() => openConversation(item.id)} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ConversationListItem conv={item} isGroup onPress={() => openConversation(item.id)} />
          )}
          ListHeaderComponent={() => (
            <TouchableOpacity style={styles.createGroupBtn} activeOpacity={0.85} onPress={() => setShowCreateGroup(true)}>
              <Icons.plus size={18} color="#fff" />
              <Text style={styles.createGroupText}>Create New Group</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <BottomDock hidden={showCreateGroup} />

      {/* Comment Sheet */}
      {commentingPostId && (
        <CommentSheet
          postId={commentingPostId}
          comments={currentComments}
          onClose={() => setCommentingPostId(null)}
          onSend={handleCommentSend}
        />
      )}

      <CreateGroupModal visible={showCreateGroup} onClose={() => setShowCreateGroup(false)} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },

  /* Header */
  header: { paddingHorizontal: 16, paddingBottom: 10, backgroundColor: '#fff', zIndex: 10 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  wordmarkRow: { flexDirection: 'row', alignItems: 'center' },
  wordmarkFarm: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  wordmarkChat: { fontSize: 20, fontWeight: '800', color: '#16A34A' },
  osBadge: { backgroundColor: '#F1F5F9', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 8 },
  osBadgeText: { fontSize: 10, fontWeight: '600', color: '#64748B' },
  farmSelector: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F8FAFC', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, flexShrink: 0 },
  farmName: { fontSize: 12, fontWeight: '600', color: '#0F172A' },

  /* Top Tabs */
  topTabRow: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', zIndex: 10 },
  topTab: { paddingVertical: 10, marginRight: 24, position: 'relative' },
  topTabInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  topTabIconWrap: { position: 'relative' },
  topTabText: { fontSize: 14, fontWeight: '600', color: '#94A3B8' },
  topTabTextActive: { color: '#16A34A' },
  topTabUnderline: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, backgroundColor: '#16A34A', borderRadius: 1 },
  topTabIconBadge: { position: 'absolute', top: -6, right: -6, backgroundColor: '#EF4444', borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3, borderWidth: 1.5, borderColor: '#fff' },
  topTabIconBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff' },

  /* Section Divider */
  sectionDivider: { flexDirection: 'row', alignItems: 'center', marginTop: 10, marginBottom: 14, paddingHorizontal: 16, gap: 10 },
  sectionLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionLabel: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  sectionCountBadge: { backgroundColor: '#2563EB', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 },
  sectionCountText: { fontSize: 10, color: '#fff', fontWeight: '700' },

  /* Timeline */
  timelineRow: { flexDirection: 'row', paddingLeft: 12 },
  timelineLine: { alignItems: 'center', width: 16, marginRight: 8, flexShrink: 0 },
  timelineDot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
  timelineConnector: { flex: 1, width: 2, backgroundColor: '#E2E8F0', marginTop: 2 },
  timelineContent: { flex: 1, paddingRight: 12, minWidth: 0 },

  /* Top Floating Composer — X/Facebook style post creation */
  topComposer: { marginHorizontal: 12, marginTop: 12, backgroundColor: '#fff', borderRadius: 16, padding: 14, shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 4 }, shadowRadius: 14, elevation: 4, borderWidth: 1, borderColor: '#E2E8F0' },
  topComposerInput: { fontSize: 15, color: '#0F172A', minHeight: 48, lineHeight: 22, paddingVertical: 4 },
  topComposerActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 10 },
  topComposerLeft: { flexDirection: 'row', gap: 6 },
  topComposerIconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  topComposerSendBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#16A34A', alignItems: 'center', justifyContent: 'center' },
  topComposerSendBtnDisabled: { opacity: 0.5 },

  /* Group */
  createGroupBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#16A34A', borderRadius: 12, paddingVertical: 12, marginBottom: 12 },
  createGroupText: { fontSize: 14, color: '#fff', fontWeight: '600' },

  /* Layout helpers */
  listContent: { padding: 16, paddingBottom: 120 },

  /* Comment Sheet */
  commentOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50 },
  commentBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)' },
  commentSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, maxHeight: '70%', backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  commentSheetHandle: { alignItems: 'center', paddingTop: 8, paddingBottom: 4 },
  commentHandleBar: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0' },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  commentHeaderTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  commentListContent: { padding: 16, paddingBottom: 16 },
  commentRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  commentAvatarText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  commentBubble: { flex: 1, backgroundColor: '#F1F5F9', borderRadius: 14, padding: 10 },
  commentUsername: { fontSize: 12, fontWeight: '700', color: '#0F172A', marginBottom: 2 },
  commentText: { fontSize: 13, color: '#334155', lineHeight: 18 },
  commentInputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#F1F5F9', gap: 8 },
  commentInput: { flex: 1, backgroundColor: '#F1F5F9', borderRadius: 20, paddingHorizontal: 14, fontSize: 14, color: '#0F172A', paddingVertical: 8 },
  commentSendBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#16A34A', alignItems: 'center', justifyContent: 'center' },
  commentSendBtnDisabled: { opacity: 0.5 },
})
