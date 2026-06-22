import React, { useState, useEffect, useMemo } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Platform,
} from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import GoonaIcon from '../components/ui/GoonaIcon'
import { Icons } from '../shared/icons'
import Animated, { FadeInUp, Layout } from 'react-native-reanimated'
import { useNotificationStore, AppNotification, CATEGORY_CONFIG, PRIORITY_CONFIG } from '../store/useNotificationStore'
import WeatherNotificationSync from '../components/WeatherNotificationSync'

const CAT_ICONS: Record<string, React.ElementType> = {
  all: Icons.bell,
  operations: Icons.clipboardList,
  team: Icons.users,
  weather: Icons.mapPin,
  wallet: Icons.trendingUp,
  iq: Icons.sparkles,
  security: Icons.shieldAlert,
}

const CAT_ORDER = ['all', 'operations', 'team', 'weather', 'wallet', 'iq', 'security'] as const

function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function getPriorityBadge(priority: string) {
  const cfg = PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG]
  return cfg || { label: 'Info', color: '#64748B' }
}

function NotificationCard({ n, onRead, onArchive }: { n: AppNotification; onRead: () => void; onArchive: () => void }) {
  const catCfg = CATEGORY_CONFIG[n.category]
  const priCfg = getPriorityBadge(n.priority)
  const IconComp = CAT_ICONS[n.category] || Icons.bell

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onRead}
      onLongPress={onArchive}
      style={[styles.card, n.status === 'unread' && styles.cardUnread, n.pinned && styles.cardPinned]}
    >
      {n.pinned && <View style={styles.pinBar} />}
      <View style={[styles.cardIcon, { backgroundColor: catCfg.color + '15' }]}>
        <GoonaIcon icon={IconComp} size={18} color={catCfg.color} />
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <View style={styles.cardCatRow}>
            <Text style={[styles.cardCategory, { color: catCfg.color }]}>{catCfg.label}</Text>
            <View style={[styles.priorityBadge, { backgroundColor: priCfg.color + '18' }]}>
              <Text style={[styles.priorityText, { color: priCfg.color }]}>{priCfg.label}</Text>
            </View>
          </View>
          <View style={styles.cardActions}>
            {n.status === 'unread' && <View style={styles.unreadDot} />}
            <TouchableOpacity hitSlop={8} onPress={onArchive}>
              <GoonaIcon icon={Icons.x} size={14} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={[styles.cardTitle, n.status === 'unread' && styles.cardTitleUnread]}>{n.title}</Text>
        <Text style={styles.cardDesc} numberOfLines={2}>{n.description}</Text>
        <View style={styles.cardFooter}>
          <GoonaIcon icon={Icons.clock} size={11} color="#94A3B8" />
          <Text style={styles.cardTime}>{timeAgo(n.timestamp)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets()
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const notifications = useNotificationStore((s) => s.notifications)
  const addNotification = useNotificationStore((s) => s.addNotification)
  const markAsRead = useNotificationStore((s) => s.markAsRead)
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead)
  const archiveNotification = useNotificationStore((s) => s.archiveNotification)
  const clearArchived = useNotificationStore((s) => s.clearArchived)
  const seedDemoNotifications = useNotificationStore((s) => s.seedDemoNotifications)
  const [showActions, setShowActions] = useState(false)

  useEffect(() => {
    seedDemoNotifications()
  }, [])

  const filtered = useMemo(() => {
    let items = notifications.filter((n) => n.status !== 'archived')
    if (activeFilter !== 'all') {
      items = items.filter((n) => n.category === activeFilter)
    }
    return items
  }, [notifications, activeFilter])

  const unreadTotal = useMemo(() => notifications.filter((n) => n.status === 'unread').length, [notifications])

  const getUnreadCount = (cat: string) => {
    if (cat === 'all') return unreadTotal
    return notifications.filter((n) => n.category === cat && n.status === 'unread').length
  }

  const unreadForCurrent = useMemo(() =>
    activeFilter === 'all'
      ? unreadTotal
      : notifications.filter((n) => n.category === activeFilter && n.status === 'unread').length,
    [notifications, activeFilter, unreadTotal]
  )

  return (
    <View style={styles.container}>
      <WeatherNotificationSync />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollInner, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── HEADER ─── */}
        <Animated.View entering={FadeInUp.duration(500).springify()} style={styles.topNav}>
          <TouchableOpacity
            style={styles.navBack}
            activeOpacity={0.7}
            onPress={() => { if (router.canGoBack()) { router.back() } else { router.replace('/(tabs)/dashboard' as any) } }}
          >
            <GoonaIcon icon={Icons.arrowLeft} size={24} color="#1B1B1B" />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Notifications</Text>
          <TouchableOpacity
            style={styles.navAction}
            activeOpacity={0.7}
            onPress={() => setShowActions(!showActions)}
          >
            <GoonaIcon icon={Icons.check} size={20} color="#1F2937" />
          </TouchableOpacity>
        </Animated.View>

        {/* ─── HEADER SECTION ─── */}
        <Animated.View entering={FadeInUp.duration(500).delay(80).springify()} style={styles.headerSection}>
          <Text style={styles.headerLabel}>Notification Hub</Text>
          <Text style={styles.headerTitle}>Stay informed{'\n'}about your farm</Text>
        </Animated.View>

        {/* ─── FILTER TABS ─── */}
        <Animated.View entering={FadeInUp.duration(400).delay(140).springify()}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
            contentContainerStyle={styles.filterContent}
          >
            {CAT_ORDER.map((cat) => {
              const active = activeFilter === cat
              const cfg = CATEGORY_CONFIG[cat]
              const count = getUnreadCount(cat)
              const IconComp = CAT_ICONS[cat]
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.filterChip, active && { backgroundColor: cfg.color + '15', borderColor: cfg.color }]}
                  activeOpacity={0.7}
                  onPress={() => setActiveFilter(cat)}
                >
                  <GoonaIcon icon={IconComp} size={14} color={active ? cfg.color : '#64748B'} />
                  <Text style={[styles.filterLabel, active && { color: cfg.color, fontWeight: '700' }]}>{cfg.label}</Text>
                  {count > 0 && (
                    <View style={[styles.filterBadge, { backgroundColor: cfg.color }]}>
                      <Text style={styles.filterBadgeText}>{count > 99 ? '99+' : count}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        </Animated.View>

        {/* ─── ACTIONS BAR ─── */}
        {showActions && (
          <Animated.View entering={FadeInUp.duration(250).springify()} style={styles.actionsBar}>
            <TouchableOpacity
              style={styles.actionBtn}
              activeOpacity={0.7}
              onPress={() => { markAllAsRead(activeFilter === 'all' ? undefined : activeFilter as any); setShowActions(false) }}
            >
              <GoonaIcon icon={Icons.check} size={14} color="#2E7D32" />
              <Text style={styles.actionBtnText}>Mark all as read</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              activeOpacity={0.7}
              onPress={() => { clearArchived(); setShowActions(false) }}
            >
              <GoonaIcon icon={Icons.x} size={14} color="#EF4444" />
              <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Clear archived</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ─── NOTIFICATION LIST ─── */}
        {filtered.length === 0 ? (
          <Animated.View entering={FadeInUp.duration(400).springify()} style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <GoonaIcon icon={Icons.bell} size={32} color="#CBD5E1" />
            </View>
            <Text style={styles.emptyTitle}>All caught up</Text>
            <Text style={styles.emptyDesc}>No {activeFilter !== 'all' ? CATEGORY_CONFIG[activeFilter]?.label.toLowerCase() + ' ' : ''}notifications</Text>
          </Animated.View>
        ) : (
          <>
            {filtered.map((n, i) => (
              <Animated.View
                key={n.id}
                entering={FadeInUp.duration(350).delay(200 + i * 50).springify()}
                layout={Layout.springify()}
              >
                <NotificationCard
                  n={n}
                  onRead={() => markAsRead(n.id)}
                  onArchive={() => archiveNotification(n.id)}
                />
              </Animated.View>
            ))}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF7',
  },
  scroll: {
    flex: 1,
  },
  scrollInner: {
    paddingBottom: 40,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 52,
  },
  navBack: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B1B1B',
    letterSpacing: -0.3,
  },
  navAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  headerLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2E7D32',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1B1B1B',
    letterSpacing: -0.8,
    lineHeight: 32,
  },

  // ─── FILTERS ───
  filterScroll: {
    marginTop: 8,
    marginBottom: 8,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // ─── ACTIONS ───
  actionsBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E7D32',
  },

  // ─── CARD ───
  card: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
  },
  cardUnread: {
    backgroundColor: '#FAFFFA',
    borderColor: 'rgba(46,125,50,0.15)',
  },
  cardPinned: {
    borderLeftWidth: 0,
  },
  pinBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: '#EF4444',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardBody: {
    flex: 1,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  cardCatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  cardCategory: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  priorityBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2E7D32',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1B1B1B',
    marginBottom: 2,
  },
  cardTitleUnread: {
    fontWeight: '800',
  },
  cardDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 6,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardTime: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },

  // ─── EMPTY STATE ───
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1B1B1B',
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 14,
    color: '#94A3B8',
  },
})
