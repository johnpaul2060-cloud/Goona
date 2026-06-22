import { create } from 'zustand'

export interface FeedPost {
  id: string
  type: 'ai_insight' | 'voice' | 'weather_alert' | 'feed_record' | 'health_report' | 'funding' | 'photo' | 'medication' | 'sale' | 'ai_alert' | 'announcement'
  timestamp: number
  actorName: string
  actorRole: string
  actorInitials: string
  actorColor: string
  detail: string
  highlight?: string
  tags?: string[]
  likes?: number
  liked?: boolean
  saved?: boolean
  comments?: number
  voiceDuration?: string
  progressCurrent?: number
  progressTotal?: number
  progressLabel?: string
  images?: number
  isAlert?: boolean
  alertColor?: string
  batch?: string
  location?: string
  riskLevel?: 'low' | 'medium' | 'high'
  riskReason?: string
  aiAction?: string
  visibility?: 'all' | 'management'
}

export type MessageType = 'text' | 'image' | 'video' | 'voice' | 'document' | 'system'
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read'

export interface MessageReplyTo {
  id: string
  senderName: string
  text: string
  type?: MessageType
}

export interface FarmChatMessage {
  id: string
  senderId: string
  senderName: string
  text: string
  timestamp: number
  type?: MessageType
  imageUrl?: string
  fileUrl?: string
  fileName?: string
  fileSize?: number
  voiceDuration?: number
  status?: MessageStatus
  replyTo?: MessageReplyTo
}

export interface FarmChatUser {
  id: string
  name: string
  role: string
  online?: boolean
  lastSeen?: number
}

export interface FarmChatConversation {
  id: string
  type: 'direct' | 'group'
  name: string
  participants: FarmChatUser[]
  lastMessage?: FarmChatMessage
  unreadCount: number
  groupDescription?: string
  memberCount?: number
  isAdmin?: boolean
}

interface FarmChatState {
  feedPosts: FeedPost[]
  conversations: FarmChatConversation[]
  messages: Record<string, FarmChatMessage[]>
  allUsers: FarmChatUser[]
  seedDemoData: () => void
  toggleLike: (postId: string) => void
  toggleSave: (postId: string) => void
  addFeedPost: (post: FeedPost) => void
  sendMessage: (convId: string, msg: FarmChatMessage) => void
  markAsRead: (convId: string) => void
  createConversation: (userId: string) => string | null
}

function generateId() { return Math.random().toString(36).substring(2, 11) }
function minsAgo(m: number) { return Date.now() - m * 60000 }
function hrsAgo(h: number) { return Date.now() - h * 3600000 }

const DEMO_USERS: FarmChatUser[] = [
  { id: 'owner', name: 'Paul', role: 'Farm Owner', online: true },
  { id: 'james', name: 'James S.', role: 'Farm Supervisor', online: true },
  { id: 'mary', name: 'Mary J.', role: 'Farm Hand', online: true },
  { id: 'tunde', name: 'Tunde M.', role: 'Farm Manager', online: true },
  { id: 'chioma', name: 'Chioma', role: 'Accountant', online: false, lastSeen: minsAgo(45) },
  { id: 'emeka', name: 'Emeka', role: 'Security Guard', online: true },
]

const DEMO_CONVERSATIONS: FarmChatConversation[] = [
  { id: 'conv-1', type: 'direct', name: 'James S.', participants: [DEMO_USERS[0], DEMO_USERS[1]], lastMessage: { id: 'm1', senderId: 'james', senderName: 'James S.', text: 'Feed recorded. All birds active ✅', timestamp: minsAgo(30) }, unreadCount: 2 },
  { id: 'conv-2', type: 'direct', name: 'Tunde M.', participants: [DEMO_USERS[0], DEMO_USERS[3]], lastMessage: { id: 'm2', senderId: 'tunde', senderName: 'Tunde M.', text: 'Vaccination schedule for Day 26 is ready', timestamp: hrsAgo(2) }, unreadCount: 0 },
  { id: 'conv-3', type: 'direct', name: 'Chioma', participants: [DEMO_USERS[0], DEMO_USERS[4]], lastMessage: { id: 'm3', senderId: 'chioma', senderName: 'Chioma', text: 'Weekly report ready for review', timestamp: hrsAgo(5) }, unreadCount: 1 },
  { id: 'conv-4', type: 'direct', name: 'Mary J.', participants: [DEMO_USERS[0], DEMO_USERS[2]], lastMessage: { id: 'm4', senderId: 'mary', senderName: 'Mary J.', text: 'Waterers cleaned in Pen 2', timestamp: hrsAgo(8) }, unreadCount: 0 },
  { id: 'group-1', type: 'group', name: 'Batch B Team', participants: DEMO_USERS, lastMessage: { id: 'g1', senderId: 'tunde', senderName: 'Tunde M.', text: 'All hands required at 06:00 for vaccination', timestamp: minsAgo(15) }, unreadCount: 3, groupDescription: 'Layer Batch B production team', memberCount: 6, isAdmin: true },
  { id: 'group-2', type: 'group', name: 'Farm Ops', participants: [DEMO_USERS[0], DEMO_USERS[1], DEMO_USERS[3]], lastMessage: { id: 'g2', senderId: 'james', senderName: 'James S.', text: 'Temperature check done for all pens', timestamp: hrsAgo(3) }, unreadCount: 0, groupDescription: 'Farm operations', memberCount: 3 },
]

const DEMO_FEED: FeedPost[] = [
  { id: 'p1', type: 'ai_insight', timestamp: minsAgo(5), actorName: 'GOONA AI', actorRole: 'Predictive Intelligence', actorInitials: 'GA', actorColor: '#20C997', detail: 'Mortality rate is 1.2% lower than last cycle.', highlight: 'Feeding and temperature improved flock health.', likes: 0, comments: 0, tags: ['Mortality 1.2%', 'Weight Gain +4.7%', 'Feed Conv. 1.62'], batch: 'Batch B', riskLevel: 'low', riskReason: 'Mortality dropped 1.2% below cycle average — flock health is stable.', aiAction: 'Continue current feeding schedule and maintain ventilation settings.', visibility: 'all' },
  { id: 'p2', type: 'voice', timestamp: minsAgo(60), actorName: 'Paul K.', actorRole: 'Farm Owner', actorInitials: 'PK', actorColor: '#8B5CF6', detail: 'Voice update from the farm.', voiceDuration: '0:24', likes: 1, comments: 0, batch: 'Batch B' },
  { id: 'p3', type: 'weather_alert', timestamp: minsAgo(120), actorName: 'Weather Station', actorRole: 'Auto · GOONA Sense', actorInitials: 'WS', actorColor: '#F59E0B', detail: 'Rain may drop temperatures tonight — monitor humidity in Pen 3.', isAlert: true, alertColor: '#F59E0B', likes: 0, comments: 0, tags: ['Batch B', 'Pen 2, 3'] },
  { id: 'p4', type: 'feed_record', timestamp: hrsAgo(4), actorName: 'James S.', actorRole: 'Farm Supervisor', actorInitials: 'JS', actorColor: '#3B82F6', detail: '120kg feed usage recorded for Batch B.', highlight: '120kg', likes: 0, comments: 0, tags: ['Batch B', '13:23'] },
  { id: 'p5', type: 'health_report', timestamp: hrsAgo(6), actorName: 'GOONA Health', actorRole: 'Auto · Module', actorInitials: 'GN', actorColor: '#1E7A3D', detail: 'Daily mortality report submitted — 2 birds (0.16%).', highlight: '2 birds', likes: 0, comments: 0, tags: ['Within threshold ✓'] },
  { id: 'p6', type: 'funding', timestamp: hrsAgo(8), actorName: 'GOONA Finance', actorRole: 'Auto · Module', actorInitials: 'GF', actorColor: '#1E7A3D', detail: '₦150,000 added to Production Fund.', progressCurrent: 620000, progressTotal: 1200000, progressLabel: '₦620k / ₦1.2M', likes: 0, comments: 0, visibility: 'management' },
  { id: 'p7', type: 'photo', timestamp: hrsAgo(10), actorName: 'Mary J.', actorRole: 'Farm Hand', actorInitials: 'MJ', actorColor: '#3B82F6', detail: 'Cleaned waterers in Pen 2.', images: 2, likes: 3, comments: 0, tags: ['Batch B', 'North Pen'] },
  { id: 'p8', type: 'medication', timestamp: hrsAgo(12), actorName: 'GOONA Meds', actorRole: 'Auto · Module', actorInitials: 'GM', actorColor: '#1E7A3D', detail: 'Medication schedule completed ✓', likes: 1, comments: 0, tags: ['Water-based · Batch B'] },
  { id: 'p9', type: 'sale', timestamp: hrsAgo(14), actorName: 'GOONA Sales', actorRole: 'Auto · Module', actorInitials: 'GS', actorColor: '#1E7A3D', detail: 'Egg sales recorded — 38 crates · ₦95,000', highlight: '38 crates', likes: 0, comments: 0, visibility: 'management' },
  { id: 'p10', type: 'ai_alert', timestamp: hrsAgo(16), actorName: 'GOONA AI', actorRole: 'Predictive · Sense', actorInitials: 'GA', actorColor: '#20C997', detail: 'GOONA AI detected elevated humidity risk in Pen 3. Consider adjusting ventilation.', isAlert: true, alertColor: '#20C997', likes: 0, comments: 0 },
  { id: 'p11', type: 'announcement', timestamp: hrsAgo(18), actorName: 'Tunde M.', actorRole: 'Farm Manager', actorInitials: 'TM', actorColor: '#94A3B8', detail: 'Vaccination round scheduled for Day 26. All hands required at 06:00.', highlight: 'Day 26', likes: 5, comments: 0 },
]

const useFarmChatStore = create<FarmChatState>((set, get) => ({
  feedPosts: [],
  conversations: [],
  messages: {},
  allUsers: DEMO_USERS,

  seedDemoData: () => {
    const state = get()
    if (state.feedPosts.length > 0) return
    set({
      feedPosts: DEMO_FEED,
      conversations: DEMO_CONVERSATIONS,
      messages: {
        'conv-1': [
          { id: 'cm1', senderId: 'james', senderName: 'James S.', text: 'Morning feeding completed for Batch B.', timestamp: minsAgo(45) },
          { id: 'cm2', senderId: 'owner', senderName: 'Paul', text: 'Great! How much feed used?', timestamp: minsAgo(40) },
          { id: 'cm3', senderId: 'james', senderName: 'James S.', text: '120kg total. Birds are eating well.', timestamp: minsAgo(35) },
          { id: 'cm4', senderId: 'james', senderName: 'James S.', text: 'Feed recorded. All birds active ✅', timestamp: minsAgo(30) },
          { id: 'cm5', senderId: 'owner', senderName: 'Paul', text: 'Perfect, keep monitoring intake closely.', timestamp: minsAgo(25), status: 'read', replyTo: { id: 'cm4', senderName: 'James S.', text: 'Feed recorded. All birds active ✅' } },
        ],
        'group-1': [
          { id: 'gm1', senderId: 'tunde', senderName: 'Tunde M.', text: 'Vaccination is scheduled for Day 26. Let\'s prepare.', timestamp: minsAgo(20) },
          { id: 'gm2', senderId: 'james', senderName: 'James S.', text: 'I\'ll prepare the equipment tonight.', timestamp: minsAgo(15) },
          { id: 'gm3', senderId: 'tunde', senderName: 'Tunde M.', text: 'All hands required at 06:00 for vaccination', timestamp: minsAgo(10) },
        ],
      },
    })
  },

  toggleLike: (postId) => {
    set((state) => ({
      feedPosts: state.feedPosts.map((p) =>
        p.id === postId ? { ...p, liked: !p.liked, likes: (p.liked ? (p.likes || 0) - 1 : (p.likes || 0) + 1) } : p
      ),
    }))
  },

  toggleSave: (postId) => {
    set((state) => ({
      feedPosts: state.feedPosts.map((p) =>
        p.id === postId ? { ...p, saved: !p.saved } : p
      ),
    }))
  },

  addFeedPost: (post) => {
    set((state) => ({ feedPosts: [post, ...state.feedPosts] }))
  },

  sendMessage: (convId, msg) => {
    set((state) => ({
      messages: { ...state.messages, [convId]: [...(state.messages[convId] || []), msg] },
      conversations: state.conversations.map((c) =>
        c.id === convId ? { ...c, lastMessage: msg, unreadCount: c.unreadCount + (msg.senderId !== 'owner' ? 1 : 0) } : c
      ),
    }))
  },

  markAsRead: (convId) => {
    set((state) => ({
      conversations: state.conversations.map((c) => c.id === convId ? { ...c, unreadCount: 0 } : c),
    }))
  },

  createConversation: (userId) => {
    const state = get()
    const existing = state.conversations.find((c) => c.type === 'direct' && c.participants.some((p) => p.id === userId))
    if (existing) return existing.id
    const user = state.allUsers.find((u) => u.id === userId)
    if (!user) return null
    const id = 'conv-' + generateId()
    set((s) => ({
      conversations: [...s.conversations, { id, type: 'direct' as const, name: user.name, participants: [s.allUsers[0], user], unreadCount: 0 }],
    }))
    return id
  },
}))

export { useFarmChatStore }
