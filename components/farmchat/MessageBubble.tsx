import { View, Text, StyleSheet } from 'react-native'

export default function MessageBubble({ text, senderName, isOwn, timestamp }: { text: string; senderName: string; isOwn: boolean; timestamp: number }) {
  const time = new Date(timestamp)
  const timeStr = time.getHours().toString().padStart(2, '0') + ':' + time.getMinutes().toString().padStart(2, '0')

  return (
    <View style={[styles.container, isOwn ? styles.own : styles.other]}>
      {!isOwn && <Text style={styles.sender}>{senderName}</Text>}
      <View style={[styles.bubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
        <Text style={[styles.text, isOwn && styles.ownText]}>{text}</Text>
      </View>
      <Text style={[styles.time, isOwn && styles.ownTime]}>{timeStr}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { marginBottom: 12, maxWidth: '80%' },
  own: { alignSelf: 'flex-end' },
  other: { alignSelf: 'flex-start' },
  sender: { fontSize: 11, color: '#64748B', marginBottom: 2, marginLeft: 4 },
  bubble: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  ownBubble: { backgroundColor: '#16A34A', borderBottomRightRadius: 4 },
  otherBubble: { backgroundColor: '#F1F5F9', borderBottomLeftRadius: 4 },
  text: { fontSize: 14, color: '#0F172A', lineHeight: 20 },
  ownText: { color: '#fff' },
  time: { fontSize: 10, color: '#94A3B8', marginTop: 2, marginHorizontal: 4 },
  ownTime: { textAlign: 'right' },
})
