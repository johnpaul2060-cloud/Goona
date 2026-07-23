import { useEffect, useCallback } from 'react'
import { View, StyleSheet } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useFarmChatStore, FarmChatMessage, MessageReplyTo } from '../../../../store/useFarmChatStore'
import UnifiedChatScreen from '../../../../components/farmchat/UnifiedChatScreen'

export default function ChatDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const conversations = useFarmChatStore((s) => s.conversations)
  const allMessages = useFarmChatStore((s) => s.messages)
  const sendMessage = useFarmChatStore((s) => s.sendMessage)
  const markAsRead = useFarmChatStore((s) => s.markAsRead)

  const conv = conversations.find((c) => c.id === id)
  const messages = allMessages[id] || []

  useEffect(() => {
    if (id) markAsRead(id)
  }, [id])

  useEffect(() => {
    if (!conv) {
      router.replace('/(tabs)/farmchat')
    }
  }, [conv])

  const handleSend = useCallback((text: string, replyTo?: MessageReplyTo) => {
    if (!id) return
    const msg: FarmChatMessage = {
      id: 'm' + Date.now(),
      senderId: 'owner',
      senderName: 'Paul',
      text,
      timestamp: Date.now(),
      status: 'sent',
    }
    if (replyTo) msg.replyTo = replyTo
    sendMessage(id, msg)
  }, [id, sendMessage])

  const handleBack = useCallback(() => {
    router.back()
  }, [])

  if (!conv) return <View style={styles.container} />

  return (
    <UnifiedChatScreen
      conv={conv}
      messages={messages}
      onSend={handleSend}
      onBack={handleBack}
    />
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
})
