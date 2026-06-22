import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Icons } from '../../shared/icons'
import { FarmChatConversation } from '../../store/useFarmChatStore'

export default function ConversationListItem({ conv, onPress, isGroup }: { conv: FarmChatConversation; onPress: () => void; isGroup?: boolean }) {
  const lastMsg = conv.lastMessage
  const initials = conv.name.split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase()
  const color = isGroup ? '#7C3AED' : '#2563EB'

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.avatar, { backgroundColor: color + '20' }]}>
        {isGroup ? (
          <Icons.users size={18} color={color} />
        ) : (
          <Text style={[styles.avatarText, { color }]}>{initials}</Text>
        )}
      </View>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>{conv.name}</Text>
          {isGroup && conv.memberCount && (
            <Text style={styles.memberCount}>{conv.memberCount}</Text>
          )}
        </View>
        {isGroup && conv.groupDescription && (
          <Text style={styles.groupDesc} numberOfLines={1}>{conv.groupDescription}</Text>
        )}
        {lastMsg && (
          <Text style={styles.lastMsg} numberOfLines={1}>{lastMsg.senderName}: {lastMsg.text}</Text>
        )}
      </View>
      <View style={styles.rightCol}>
        {conv.unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{conv.unreadCount}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: '#fff', borderRadius: 12, marginBottom: 8 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 14, fontWeight: '700' },
  content: { flex: 1, marginLeft: 12 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  memberCount: { fontSize: 11, color: '#94A3B8' },
  groupDesc: { fontSize: 11, color: '#64748B', marginTop: 1 },
  lastMsg: { fontSize: 12, color: '#64748B', marginTop: 2 },
  rightCol: { alignItems: 'flex-end', marginLeft: 8 },
  badge: { backgroundColor: '#16A34A', borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeText: { fontSize: 11, color: '#fff', fontWeight: '700' },
})
