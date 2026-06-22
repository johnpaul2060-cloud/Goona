import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Icons } from '../../shared/icons'
import { FeedPost } from '../../store/useFarmChatStore'

function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const DOT_COLORS: Record<FeedPost['type'], string> = {
  ai_insight: '#20C997',
  voice: '#8B5CF6',
  weather_alert: '#F59E0B',
  feed_record: '#2563EB',
  health_report: '#16A34A',
  funding: '#7C3AED',
  photo: '#2563EB',
  medication: '#16A34A',
  sale: '#7C3AED',
  ai_alert: '#20C997',
  announcement: '#94A3B8',
}

function PostDot({ color }: { color: string }) {
  return <View style={[styles.dot, { backgroundColor: color }]} />
}

function ActorAvatar({ initials, color }: { initials: string; color: string }) {
  return (
    <View style={[styles.avatarCircle, { backgroundColor: color + '20' }]}>
      <Text style={[styles.avatarText, { color }]}>{initials}</Text>
    </View>
  )
}

function CardActions({ post, onLike, onSave, onComment }: { post: FeedPost; onLike: () => void; onSave: () => void; onComment: () => void }) {
  return (
    <View style={styles.cardActions}>
      <TouchableOpacity style={styles.actionBtn} onPress={onLike}>
        <Icons.heart size={16} color={post.liked ? '#EF4444' : '#94A3B8'} />
        <Text style={[styles.actionText, post.liked && { color: '#EF4444' }]}>{post.likes || 0}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionBtn} onPress={onComment}>
        <Icons.messageCircle size={16} color="#94A3B8" />
        <Text style={styles.actionText}>{post.comments || 0}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionBtn} onPress={onSave}>
        <Icons.save size={16} color={post.saved ? '#16A34A' : '#94A3B8'} />
      </TouchableOpacity>
    </View>
  )
}

const RISK_COLORS = { low: '#16A34A', medium: '#F59E0B', high: '#EF4444' }
const RISK_LABELS = { low: 'Low', medium: 'Medium', high: 'High' }

function AIInsightCard({ post }: { post: FeedPost }) {
  const riskColor = RISK_COLORS[post.riskLevel || 'low']
  return (
    <LinearGradient
      colors={['#0A3D2E', '#064E3B', '#0D5E46']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.aiCard}
    >
      <View style={styles.aiGlass}>
        <View style={styles.aiBadgeRow}>
          <View style={styles.aiBadge}>
            <Icons.sparkles size={12} color="#20C997" />
            <Text style={styles.aiBadgeText}>GOONA AI</Text>
          </View>
          <Text style={styles.aiBadgeSep}>•</Text>
          <Text style={styles.aiBadgeSub}>Predictive Intelligence</Text>
        </View>

        <View style={styles.aiRiskRow}>
          <View style={[styles.aiRiskBadge, { backgroundColor: riskColor + '20' }]}>
            <Icons.shield size={12} color={riskColor} />
            <Text style={[styles.aiRiskLabel, { color: riskColor }]}>Risk {RISK_LABELS[post.riskLevel || 'low']}</Text>
          </View>
        </View>

        <View style={styles.aiSection}>
          <View style={styles.aiSectionIconWrap}>
            <Icons.alertCircle size={14} color="#94A3B8" />
          </View>
          <Text style={styles.aiSectionText}>{post.riskReason || post.detail}</Text>
        </View>

        <View style={styles.aiSection}>
          <View style={styles.aiSectionIconWrap}>
            <Icons.lightbulb size={14} color="#FBBF24" />
          </View>
          <Text style={styles.aiSectionText}>{post.aiAction || 'Continue current feeding schedule and maintain ventilation settings.'}</Text>
        </View>

        {post.tags && (
          <View style={styles.aiTagRow}>
            {post.tags.map((t, i) => (
              <View key={i} style={styles.aiTag}>
                <Text style={styles.aiTagText}>{t}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </LinearGradient>
  )
}

function VoiceCard({ post }: { post: FeedPost }) {
  return (
    <View style={styles.voicePlayer}>
      <Icons.play size={18} color="#8B5CF6" fill="#8B5CF6" />
      <View style={styles.waveRow}>
        {[3, 5, 4, 7, 6, 8, 5, 9, 7, 10, 8, 6, 7, 5, 8, 6, 9, 7, 5, 4, 6, 8, 5, 7, 6, 9, 7, 5, 8, 6].map((h, i) => (
          <View key={i} style={[styles.waveBar, { height: h + 4, opacity: i < 15 ? 0.4 : 0.2 }]} />
        ))}
      </View>
      <Text style={styles.voiceDuration}>{post.voiceDuration || '0:00'}</Text>
    </View>
  )
}

function AlertCard({ post }: { post: FeedPost }) {
  return (
    <View style={[styles.alertCard, { borderLeftColor: post.alertColor || '#F59E0B' }]}>
      <View style={styles.alertCardRow}>
        <Icons.alertTriangle size={18} color={post.alertColor || '#F59E0B'} />
        <Text style={styles.alertCardText}>{post.detail}</Text>
      </View>
      {post.tags && (
        <View style={styles.tagRow}>
          {post.tags.map((t, i) => (
            <View key={i} style={styles.tagPill}><Text style={styles.tagPillText}>{t}</Text></View>
          ))}
        </View>
      )}
    </View>
  )
}

function FundingCard({ post }: { post: FeedPost }) {
  const pct = post.progressTotal ? Math.min((post.progressCurrent || 0) / post.progressTotal, 1) : 0
  return (
    <View style={styles.fundingCard}>
      <View style={styles.fundingIconRow}>
        <View style={styles.fundingIconWrap}>
          <Icons.wallet size={16} color="#7C3AED" />
        </View>
        <Text style={styles.fundingLabel}>Production Fund</Text>
      </View>
      <Text style={styles.fundingAmount}>{post.detail}</Text>
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${pct * 100}%` }]} />
      </View>
      <Text style={styles.progressLabel}>{post.progressLabel}</Text>
    </View>
  )
}

function PhotoCard({ post }: { post: FeedPost }) {
  return (
    <View style={styles.photoGrid}>
      {Array.from({ length: Math.min(post.images || 2, 2) }).map((_, i) => (
        <View key={i} style={styles.photoCell}>
          <View style={styles.photoPlaceholder}>
            <Icons.image size={24} color="#94A3B8" />
          </View>
        </View>
      ))}
    </View>
  )
}

function MedicationCard() {
  return (
    <View style={styles.medCard}>
      <View style={styles.medCheckRow}>
        <View style={styles.medCheckCircle}>
          <Icons.check size={14} color="#fff" />
        </View>
        <Text style={styles.medCheckText}>Schedule Completed</Text>
      </View>
    </View>
  )
}

export default function FeedPostCard({ post, onLike, onSave, onComment }: { post: FeedPost; onLike: () => void; onSave: () => void; onComment?: () => void }) {
  const dotColor = DOT_COLORS[post.type]
  const isFundingOrSale = post.type === 'funding' || post.type === 'sale'

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <PostDot color={dotColor} />
          <ActorAvatar initials={post.actorInitials} color={post.actorColor} />
          <View style={styles.cardHeaderInfo}>
            <Text style={styles.actorName}>{post.actorName}</Text>
            <View style={styles.actorMetaRow}>
              <Text style={styles.actorRole}>{post.actorRole}</Text>
              <Text style={styles.actorDot}>·</Text>
              <Text style={styles.actorTime}>{timeAgo(post.timestamp)}</Text>
            </View>
          </View>
        </View>
        <Icons.moreHorizontal size={16} color="#94A3B8" />
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardDetail}>{post.detail}</Text>

        {post.type === 'ai_insight' && <AIInsightCard post={post} />}
        {post.type === 'voice' && <VoiceCard post={post} />}
        {(post.type === 'weather_alert' || post.type === 'ai_alert') && <AlertCard post={post} />}
        {post.type === 'funding' && <FundingCard post={post} />}
        {post.type === 'photo' && <PhotoCard post={post} />}
        {post.type === 'medication' && <MedicationCard />}

        {(post.type === 'feed_record' || post.type === 'health_report' || post.type === 'announcement') && (
          <>
            {post.highlight && <Text style={styles.highlight}>{post.highlight}</Text>}
            {post.tags && (
              <View style={styles.tagRow}>
                {post.tags.map((t, i) => (
                  <View key={i} style={styles.tagPill}><Text style={styles.tagPillText}>{t}</Text></View>
                ))}
              </View>
            )}
          </>
        )}

        {post.type === 'sale' && (
          <>
            {post.highlight && (
              <View style={styles.saleHighlightRow}>
                <Icons.shoppingCart size={16} color="#7C3AED" />
                <Text style={styles.saleHighlight}>{post.highlight}</Text>
              </View>
            )}
          </>
        )}
      </View>

      <CardActions post={post} onLike={onLike} onSave={onSave} onComment={onComment || (() => {})} />
    </View>
  )
}

const styles = StyleSheet.create({
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 10, marginTop: 4, flexShrink: 0 },
  avatarCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText: { fontSize: 12, fontWeight: '700' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0 },
  cardHeaderInfo: { marginLeft: 8, flex: 1, minWidth: 0 },
  actorName: { fontSize: 13, fontWeight: '600', color: '#0F172A' },
  actorMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  actorRole: { fontSize: 11, color: '#64748B' },
  actorDot: { fontSize: 11, color: '#CBD5E0' },
  actorTime: { fontSize: 11, color: '#94A3B8' },
  cardBody: { marginBottom: 10 },
  cardDetail: { fontSize: 13, color: '#334155', lineHeight: 19 },
  highlight: { fontSize: 15, fontWeight: '700', color: '#16A34A', marginTop: 4 },
  saleHighlightRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  saleHighlight: { fontSize: 15, fontWeight: '700', color: '#7C3AED' },
  tagRow: { flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  tagPill: { backgroundColor: '#F1F5F9', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  tagPillText: { fontSize: 11, color: '#475569' },
  cardActions: { flexDirection: 'row', gap: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: 12, color: '#94A3B8' },

  /* Premium AI Card */
  aiCard: { borderRadius: 14, marginTop: 10, overflow: 'hidden' },
  aiGlass: { padding: 16, gap: 12 },
  aiBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  aiBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  aiBadgeText: { fontSize: 12, fontWeight: '700', color: '#20C997', letterSpacing: 0.5 },
  aiBadgeSep: { fontSize: 12, color: '#ffffff40' },
  aiBadgeSub: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
  aiRiskRow: { flexDirection: 'row', gap: 8 },
  aiRiskBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  aiRiskLabel: { fontSize: 11, fontWeight: '600' },
  aiSection: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  aiSectionIconWrap: { width: 20, alignItems: 'center', marginTop: 1, flexShrink: 0 },
  aiSectionText: { fontSize: 12, color: '#CBD5E1', lineHeight: 18, flex: 1 },
  aiTagRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 2 },
  aiTag: { backgroundColor: '#ffffff12', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  aiTagText: { fontSize: 11, color: '#20C997', fontWeight: '600' },

  /* Voice */
  voicePlayer: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F8FAFC', borderRadius: 10, padding: 12, marginTop: 8 },
  waveRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2, height: 28 },
  waveBar: { width: 3, backgroundColor: '#8B5CF6', borderRadius: 2 },
  voiceDuration: { fontSize: 12, color: '#64748B', minWidth: 32, textAlign: 'right' },

  /* Alert */
  alertCard: { backgroundColor: '#FFFBEB', borderRadius: 12, padding: 12, borderLeftWidth: 4, marginTop: 8 },
  alertCardRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  alertCardText: { fontSize: 13, color: '#92400E', flex: 1, lineHeight: 19 },

  /* Funding */
  fundingCard: { backgroundColor: '#F5F3FF', borderRadius: 12, padding: 14, marginTop: 8 },
  fundingIconRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  fundingIconWrap: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center' },
  fundingLabel: { fontSize: 12, fontWeight: '600', color: '#6D28D9' },
  fundingAmount: { fontSize: 14, fontWeight: '600', color: '#7C3AED', marginBottom: 8 },
  progressBarBg: { height: 8, backgroundColor: '#EDE9FE', borderRadius: 4, overflow: 'hidden', marginBottom: 4 },
  progressBarFill: { height: '100%', backgroundColor: '#7C3AED', borderRadius: 4 },
  progressLabel: { fontSize: 11, color: '#6B7280' },

  /* Photo */
  photoGrid: { flexDirection: 'row', gap: 6, marginTop: 8 },
  photoCell: { flex: 1, aspectRatio: 1.5 },
  photoPlaceholder: { flex: 1, backgroundColor: '#F1F5F9', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },

  /* Medication */
  medCard: { backgroundColor: '#F0FDF4', borderRadius: 12, padding: 12, marginTop: 8 },
  medCheckRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  medCheckCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#16A34A', alignItems: 'center', justifyContent: 'center' },
  medCheckText: { fontSize: 13, fontWeight: '600', color: '#166534' },
})
