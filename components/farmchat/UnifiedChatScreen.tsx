import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, PanResponder, Animated } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Icons } from '../../shared/icons'
import { FarmChatConversation, FarmChatMessage, MessageReplyTo } from '../../store/useFarmChatStore'

type ActiveCall = 'audio' | 'video' | null

const SWIPE_THRESHOLD = 40

function formatTime(t: number) {
  const d = new Date(t)
  return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0')
}

function bubblePreviewText(msg: FarmChatMessage): string {
  if (msg.type === 'image') return '📷 Photo'
  if (msg.type === 'video') return '🎥 Video'
  if (msg.type === 'voice') return '🎤 Voice note'
  if (msg.type === 'document') return `📎 ${msg.fileName || 'Document'}`
  return msg.text
}

function SwipeableBubble({ msg, isOwn, showSender, onSwipeReply }: {
  msg: FarmChatMessage
  isOwn: boolean
  showSender: boolean
  onSwipeReply: (msg: FarmChatMessage) => void
}) {
  const translateX = useRef(new Animated.Value(0)).current
  const msgRef = useRef(msg)
  const swipeCb = useRef(onSwipeReply)
  msgRef.current = msg
  swipeCb.current = onSwipeReply

  useEffect(() => {
    translateX.setValue(0)
  }, [msg.id])

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderGrant: () => {
        translateX.setValue(0)
      },
      onPanResponderMove: (_, g) => {
        if (g.dx > 0) {
          translateX.setValue(Math.min(g.dx, 80))
        }
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx > SWIPE_THRESHOLD) {
          swipeCb.current(msgRef.current)
        }
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start()
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start()
      },
    })
  ).current

  const msgType = msg.type || 'text'

  const content = (
    <View style={[bubbleStyles.container, isOwn ? bubbleStyles.own : bubbleStyles.other]}>
      {showSender && !isOwn && msgType !== 'system' && (
        <Text style={bubbleStyles.sender}>{msg.senderName}</Text>
      )}
      {msgType === 'system' ? (
        <View style={bubbleStyles.systemRow}>
          <Icons.info size={12} color="#94A3B8" />
          <Text style={bubbleStyles.systemText}>{msg.text}</Text>
        </View>
      ) : (
        <View style={[bubbleStyles.bubble, isOwn ? bubbleStyles.ownBubble : bubbleStyles.otherBubble]}>
          {msg.replyTo && (
            <View style={[bubbleStyles.quoteBlock, isOwn ? bubbleStyles.quoteBlockOwn : bubbleStyles.quoteBlockOther]}>
              <View style={bubbleStyles.quoteLine} />
              <View style={bubbleStyles.quoteContent}>
                <Text style={[bubbleStyles.quoteSender, isOwn && bubbleStyles.quoteSenderOwn]} numberOfLines={1}>
                  {msg.replyTo.senderName}
                </Text>
                <Text style={[bubbleStyles.quoteText, isOwn && bubbleStyles.quoteTextOwn]} numberOfLines={2}>
                  {msg.replyTo.text}
                </Text>
              </View>
            </View>
          )}
          {msgType === 'image' && msg.imageUrl && (
            <View style={bubbleStyles.mediaBlock}>
              <View style={bubbleStyles.imagePlaceholder}>
                <Icons.image size={24} color="#64748B" />
                <Text style={bubbleStyles.mediaLabel}>Photo</Text>
              </View>
            </View>
          )}
          {msgType === 'video' && (
            <View style={bubbleStyles.mediaBlock}>
              <View style={bubbleStyles.imagePlaceholder}>
                <Icons.video size={24} color="#64748B" />
                <Text style={bubbleStyles.mediaLabel}>Video</Text>
              </View>
            </View>
          )}
          {msgType === 'voice' && (
            <View style={bubbleStyles.voiceRow}>
              <Icons.mic size={16} color={isOwn ? '#fff' : '#64748B'} />
              <View style={bubbleStyles.voiceBar} />
              <Text style={[bubbleStyles.voiceDuration, { color: isOwn ? '#fff' : '#64748B' }]}>
                {msg.voiceDuration ? `${msg.voiceDuration}s` : '0:12'}
              </Text>
            </View>
          )}
          {msgType === 'document' && msg.fileName && (
            <View style={bubbleStyles.docRow}>
              <Icons.fileText size={16} color={isOwn ? '#fff' : '#64748B'} />
              <Text style={[bubbleStyles.docName, { color: isOwn ? '#fff' : '#0F172A' }]} numberOfLines={1}>
                {msg.fileName}
              </Text>
            </View>
          )}
          {msg.text ? (
            <Text style={[bubbleStyles.text, isOwn && bubbleStyles.ownText]}>{msg.text}</Text>
          ) : null}
          <View style={bubbleStyles.timeRow}>
            <Text style={[bubbleStyles.time, isOwn && bubbleStyles.ownTime]}>{formatTime(msg.timestamp)}</Text>
            {isOwn && msg.status && (
              <View style={bubbleStyles.statusRow}>
                {msg.status === 'sending' && <Icons.clock size={10} color="#fff" />}
                {msg.status === 'sent' && <Icons.check size={10} color="#fff" />}
                {(msg.status === 'delivered' || msg.status === 'read') && (
                  <Icons.checkCheck size={10} color={msg.status === 'read' ? '#60A5FA' : '#fff'} />
                )}
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  )

  if (msgType === 'system') return content

  return (
    <Animated.View
      style={{ transform: [{ translateX }] }}
      {...panResponder.panHandlers}
    >
      {content}
    </Animated.View>
  )
}

const bubbleStyles = StyleSheet.create({
  container: { marginBottom: 8, maxWidth: '82%' },
  own: { alignSelf: 'flex-end' },
  other: { alignSelf: 'flex-start' },
  sender: { fontSize: 11, color: '#64748B', marginBottom: 2, marginLeft: 4, fontWeight: '600' },
  bubble: { borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, overflow: 'hidden' },
  ownBubble: { backgroundColor: '#16A34A', borderBottomRightRadius: 4 },
  otherBubble: { backgroundColor: '#F1F5F9', borderBottomLeftRadius: 4 },
  text: { fontSize: 14, color: '#0F172A', lineHeight: 20 },
  ownText: { color: '#fff' },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 3, marginTop: 2 },
  time: { fontSize: 10, color: '#94A3B8' },
  ownTime: { color: 'rgba(255,255,255,0.7)' },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  mediaBlock: { marginBottom: 6 },
  imagePlaceholder: { width: 180, height: 120, backgroundColor: '#E2E8F0', borderRadius: 10, alignItems: 'center', justifyContent: 'center', gap: 4 },
  mediaLabel: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  voiceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4, minWidth: 120 },
  voiceBar: { flex: 1, height: 3, backgroundColor: '#D1D5DB', borderRadius: 2 },
  voiceDuration: { fontSize: 11, fontWeight: '600' },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  docName: { fontSize: 12, fontWeight: '600', flex: 1 },
  /* Quoted reply block inside bubble */
  quoteBlock: { flexDirection: 'row', marginBottom: 6, borderRadius: 8, padding: 6 },
  quoteBlockOwn: { backgroundColor: 'rgba(255,255,255,0.12)' },
  quoteBlockOther: { backgroundColor: '#E2E8F0' },
  quoteLine: { width: 3, backgroundColor: '#16A34A', borderRadius: 2, marginRight: 8, alignSelf: 'stretch' },
  quoteContent: { flexShrink: 1 },
  quoteSender: { fontSize: 11, fontWeight: '700', color: '#16A34A', marginBottom: 1 },
  quoteSenderOwn: { color: '#BBF7D0' },
  quoteText: { fontSize: 12, color: '#475569' },
  quoteTextOwn: { color: 'rgba(255,255,255,0.75)' },
  systemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 6 },
  systemText: { fontSize: 11, color: '#94A3B8', fontStyle: 'italic' },
})

function CallOverlay({ type, onEnd }: { type: 'audio' | 'video'; onEnd: () => void }) {
  const isVideo = type === 'video'
  return (
    <View style={callStyles.overlay}>
      {isVideo && (
        <View style={callStyles.videoGrid}>
          <View style={[callStyles.videoTile, callStyles.remoteVideo]}>
            <Icons.users size={48} color="rgba(255,255,255,0.2)" />
          </View>
          <View style={[callStyles.videoTile, callStyles.localVideo]}>
            <Icons.camera size={20} color="rgba(255,255,255,0.4)" />
          </View>
        </View>
      )}
      <View style={[callStyles.callInfo, isVideo && callStyles.callInfoOverVideo]}>
        <Text style={callStyles.callStatus}>Calling...</Text>
      </View>
      <View style={callStyles.controls}>
        {isVideo && (
          <TouchableOpacity style={callStyles.ctrlBtn}>
            <Icons.video size={22} color="#fff" />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={callStyles.ctrlBtn}>
          <Icons.mic size={22} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={[callStyles.ctrlBtn, callStyles.endCallBtn]} onPress={onEnd}>
          <Icons.phone size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  )
}

const callStyles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#0F172A', zIndex: 100, justifyContent: 'space-between', paddingBottom: 40 },
  videoGrid: { flex: 1, padding: 16, gap: 8 },
  videoTile: { borderRadius: 16, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  remoteVideo: { flex: 1, backgroundColor: '#1E293B' },
  localVideo: { width: 100, height: 140, backgroundColor: '#334155', position: 'absolute', top: 20, right: 16, borderRadius: 12 },
  callInfo: { alignItems: 'center', paddingVertical: 20 },
  callInfoOverVideo: { position: 'absolute', top: 100, left: 0, right: 0 },
  callStatus: { fontSize: 16, color: '#fff', fontWeight: '600' },
  controls: { flexDirection: 'row', justifyContent: 'center', gap: 24, paddingVertical: 16 },
  ctrlBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#334155', alignItems: 'center', justifyContent: 'center' },
  endCallBtn: { backgroundColor: '#EF4444', transform: [{ rotate: '135deg' }] },
})

function InfoSheet({ conv, onClose }: { conv: FarmChatConversation; onClose: () => void }) {
  const isGroup = conv.type === 'group'
  return (
    <View style={infoStyles.overlay}>
      <TouchableOpacity style={infoStyles.backdrop} onPress={onClose} activeOpacity={1} />
      <View style={infoStyles.sheet}>
        <View style={infoStyles.handleRow}>
          <View style={infoStyles.handle} />
        </View>
        <View style={infoStyles.avatarRow}>
          <View style={[infoStyles.avatar, { backgroundColor: isGroup ? '#7C3AED20' : '#2563EB20' }]}>
            {isGroup ? <Icons.users size={24} color="#7C3AED" /> : <Text style={[infoStyles.avatarText, { color: '#2563EB' }]}>{conv.name.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase()}</Text>}
          </View>
          <Text style={infoStyles.name}>{conv.name}</Text>
          {isGroup && conv.groupDescription && <Text style={infoStyles.desc}>{conv.groupDescription}</Text>}
          {!isGroup && <Text style={infoStyles.desc}>Active now</Text>}
        </View>
        <View style={infoStyles.section}>
          <Text style={infoStyles.sectionTitle}>{isGroup ? 'Members' : 'Info'}</Text>
          {isGroup ? (
            conv.participants.map((p) => (
              <View key={p.id} style={infoStyles.memberRow}>
                <View style={infoStyles.memberDot} />
                <View style={infoStyles.memberInfo}>
                  <Text style={infoStyles.memberName}>{p.name}</Text>
                  <Text style={infoStyles.memberRole}>{p.role}</Text>
                </View>
                {p.online && <View style={infoStyles.onlineDot} />}
              </View>
            ))
          ) : (
            conv.participants.filter(p => p.id !== 'owner').map((p) => (
              <View key={p.id} style={infoStyles.memberRow}>
                <View style={infoStyles.memberDot} />
                <Text style={infoStyles.memberName}>{p.name}</Text>
                <Text style={infoStyles.memberRole}>{p.online ? 'Online' : 'Offline'}</Text>
              </View>
            ))
          )}
        </View>
      </View>
    </View>
  )
}

const infoStyles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 60 },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%', paddingBottom: 32 },
  handleRow: { alignItems: 'center', paddingTop: 8, paddingBottom: 4 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0' },
  avatarRow: { alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  avatarText: { fontSize: 20, fontWeight: '700' },
  name: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  desc: { fontSize: 13, color: '#64748B', marginTop: 2 },
  section: { padding: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#94A3B8', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  memberDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#16A34A' },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  memberRole: { fontSize: 11, color: '#64748B' },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#16A34A' },
})

export default function UnifiedChatScreen({ conv, messages, onSend, onBack }: {
  conv: FarmChatConversation
  messages: FarmChatMessage[]
  onSend: (text: string, replyTo?: MessageReplyTo) => void
  onBack: () => void
}) {
  const insets = useSafeAreaInsets()
  const [text, setText] = useState('')
  const [activeCall, setActiveCall] = useState<ActiveCall>(null)
  const [showInfo, setShowInfo] = useState(false)
  const [replyingTo, setReplyingTo] = useState<FarmChatMessage | null>(null)
  const listRef = useRef<FlatList>(null)
  const isGroup = conv.type === 'group'

  const initials = conv.name.split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase()

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100)
    }
  }, [messages.length])

  const handleSend = useCallback(() => {
    if (!text.trim()) return
    const replyTo: MessageReplyTo | undefined = replyingTo
      ? { id: replyingTo.id, senderName: replyingTo.senderName, text: bubblePreviewText(replyingTo), type: replyingTo.type }
      : undefined
    onSend(text.trim(), replyTo)
    setText('')
    setReplyingTo(null)
  }, [text, onSend, replyingTo])

  const handleSwipeReply = useCallback((msg: FarmChatMessage) => {
    if (msg.type === 'system') return
    if (replyingTo?.id === msg.id) {
      setReplyingTo(null)
    } else {
      setReplyingTo(msg)
    }
  }, [replyingTo])

  const cancelReply = useCallback(() => {
    setReplyingTo(null)
  }, [])

  const handleAttach = useCallback(() => {
    const fileTypes = ['PDF', 'Image', 'Document']
    const pick = fileTypes[Math.floor(Math.random() * fileTypes.length)]
    const mockMsg = `📎 ${pick} attachment ready`
  }, [])

  const prevSenderMap = useMemo(() => {
    const map: Record<string, boolean> = {}
    for (let i = 0; i < messages.length; i++) {
      const prev = messages[i - 1]
      map[messages[i].id] = prev ? prev.senderId === messages[i].senderId : false
    }
    return map
  }, [messages])

  const isOwn = (senderId: string) => senderId === 'owner'

  const renderMsg = useCallback(({ item }: { item: FarmChatMessage }) => {
    return (
      <SwipeableBubble
        msg={item}
        isOwn={isOwn(item.senderId)}
        showSender={isGroup && !isOwn(item.senderId) && !prevSenderMap[item.id]}
        onSwipeReply={handleSwipeReply}
      />
    )
  }, [isGroup, prevSenderMap, handleSwipeReply])

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Icons.arrowLeft size={20} color="#0F172A" />
          </TouchableOpacity>
          <View style={[styles.avatar, { backgroundColor: (isGroup ? '#7C3AED' : '#2563EB') + '20' }]}>
            {isGroup ? (
              <Icons.users size={16} color="#7C3AED" />
            ) : (
              <Text style={[styles.avatarText, { color: '#2563EB' }]}>{initials}</Text>
            )}
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{conv.name}</Text>
            <Text style={styles.headerMeta}>
              {isGroup ? `${conv.participants.length} members` : 'Active now'}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerActionBtn} onPress={() => setActiveCall('audio')}>
              <Icons.phone size={18} color="#16A34A" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerActionBtn} onPress={() => setActiveCall('video')}>
              <Icons.video size={18} color="#16A34A" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerActionBtn} onPress={() => setShowInfo(true)}>
              <Icons.info size={18} color="#64748B" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMsg}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
      />

      {/* Reply Preview */}
      {replyingTo && (
        <View style={styles.replyPreviewBar}>
          <View style={styles.replyPreviewLine} />
          <View style={styles.replyPreviewContent}>
            <Text style={styles.replyPreviewSender} numberOfLines={1}>
              {replyingTo.senderName}
            </Text>
            <Text style={styles.replyPreviewText}>
              {bubblePreviewText(replyingTo)}
            </Text>
          </View>
          <TouchableOpacity style={styles.replyPreviewClose} onPress={cancelReply}>
            <Icons.x size={16} color="#64748B" />
          </TouchableOpacity>
        </View>
      )}

      {/* Composer */}
      <View style={[styles.composer, { paddingBottom: insets.bottom + 8 }]}>
        <View style={styles.composerActions}>
          <TouchableOpacity style={styles.composerIconBtn}>
            <Icons.camera size={20} color="#64748B" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.composerIconBtn}>
            <Icons.image size={20} color="#64748B" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.composerIconBtn}>
            <Icons.mic size={20} color="#64748B" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.composerIconBtn} onPress={handleAttach}>
            <Icons.paperclip size={20} color="#64748B" />
          </TouchableOpacity>
        </View>
        <View style={styles.composerRow}>
          <TextInput
            style={styles.input}
            placeholder={isGroup ? 'Message the group...' : 'Type a message...'}
            placeholderTextColor="#94A3B8"
            value={text}
            onChangeText={setText}
            multiline
          />
          <TouchableOpacity style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]} onPress={handleSend} disabled={!text.trim()}>
            <Icons.send size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Call Overlays */}
      {activeCall && <CallOverlay type={activeCall} onEnd={() => setActiveCall(null)} />}

      {/* Info Sheet */}
      {showInfo && <InfoSheet conv={conv} onClose={() => setShowInfo(false)} />}
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { backgroundColor: '#fff', paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: { padding: 4 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 12, fontWeight: '700' },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 15, fontWeight: '600', color: '#0F172A' },
  headerMeta: { fontSize: 11, color: '#64748B' },
  headerActions: { flexDirection: 'row', gap: 4 },
  headerActionBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: 16, paddingTop: 8, paddingBottom: 16 },
  /* Reply preview bar above composer */
  replyPreviewBar: { flexDirection: 'row', alignItems: 'stretch', backgroundColor: '#F8FAFC', borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingHorizontal: 14, paddingVertical: 8, gap: 8 },
  replyPreviewLine: { width: 3, backgroundColor: '#16A34A', borderRadius: 2, alignSelf: 'stretch' },
  replyPreviewContent: { flex: 1 },
  replyPreviewSender: { fontSize: 12, fontWeight: '700', color: '#16A34A', marginBottom: 1 },
  replyPreviewText: { fontSize: 12, color: '#64748B' },
  replyPreviewClose: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  composer: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingHorizontal: 14, paddingTop: 6 },
  composerActions: { flexDirection: 'row', gap: 4, marginBottom: 6 },
  composerIconBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  composerRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  input: { flex: 1, backgroundColor: '#F1F5F9', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#0F172A', maxHeight: 80 },
  sendBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#16A34A', alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.5 },
})
