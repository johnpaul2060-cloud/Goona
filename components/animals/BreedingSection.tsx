import React, { useState, useMemo, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Platform,
} from 'react-native'
import * as Haptics from 'expo-haptics'
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated'
import GoonaIcon from '../ui/GoonaIcon'
import { Icons } from '../../shared/icons'
import { useAnimalStore, type Animal } from '../../store/useAnimalStore'
import {
  useBreedingStore,
  type MatingRecord,
  type BirthEvent,
} from '../../store/useBreedingStore'
import MatingSheet from './MatingSheet'
import BirthSheet from './BirthSheet'

interface Props {
  batchId: string
  livestockType: string
}

function formatDateShort(iso: string): string {
  const d = new Date(iso)
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  return `${day}/${month}`
}

function daysRemaining(iso: string): number {
  const diff = new Date(iso).getTime() - Date.now()
  return Math.ceil(diff / (24 * 60 * 60 * 1000))
}

const statusStyles: Record<string, { label: string; color: string; bg: string }> = {
  mated: { label: 'Mated', color: '#F59E0B', bg: '#FFFBEB' },
  pregnant: { label: 'Pregnant', color: '#7C3AED', bg: '#F5F3FF' },
  delivered: { label: 'Delivered', color: '#16A34A', bg: '#F0FDF4' },
  failed: { label: 'Failed', color: '#EF4444', bg: '#FEF2F2' },
}

export default function BreedingSection({ batchId, livestockType }: Props) {
  const animals = useAnimalStore((s) => s.animals)
  const matings = useBreedingStore((s) => s.matings)
  const birthEvents = useBreedingStore((s) => s.birthEvents)
  const updateMating = useBreedingStore((s) => s.updateMating)
  const deleteMating = useBreedingStore((s) => s.deleteMating)

  const [expanded, setExpanded] = useState(false)
  const [showMatingSheet, setShowMatingSheet] = useState(false)
  const [showBirthSheet, setShowBirthSheet] = useState(false)
  const [editingMating, setEditingMating] = useState<MatingRecord | undefined>(undefined)
  const [birthPreSelectedMatingId, setBirthPreSelectedMatingId] = useState<string | undefined>(undefined)

  const batchMatings = useMemo(
    () => matings.filter((m) => m.batchId === batchId).sort((a, b) => new Date(b.matingDate).getTime() - new Date(a.matingDate).getTime()),
    [matings, batchId]
  )
  const batchBirths = useMemo(
    () => birthEvents.filter((b) => b.batchId === batchId).sort((a, b) => new Date(b.birthDate).getTime() - new Date(a.birthDate).getTime()),
    [birthEvents, batchId]
  )

  const pregnantCount = useMemo(() => batchMatings.filter((m) => m.status === 'pregnant').length, [batchMatings])
  const activeMatings = useMemo(() => batchMatings.filter((m) => m.status === 'mated' || m.status === 'pregnant'), [batchMatings])
  const historyMatings = useMemo(() => batchMatings.filter((m) => m.status === 'delivered' || m.status === 'failed'), [batchMatings])

  const getAnimalTag = useCallback((id: string) => {
    const a = animals.find((x) => x.id === id)
    return a?.tag ?? 'Unknown'
  }, [animals])

  const toggleExpand = useCallback(() => setExpanded((v) => !v), [])

  const totalItems = batchMatings.length + batchBirths.length

  if (!totalItems && !expanded) {
    return (
      <Animated.View entering={FadeInUp.duration(500).delay(420).springify()}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.header} activeOpacity={0.7} onPress={toggleExpand}>
            <View style={styles.headerLeft}>
              <Text style={styles.secTitle}>Breeding</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.matePill}
                activeOpacity={0.85}
                onPress={() => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowMatingSheet(true) }}
              >
                <GoonaIcon icon={Icons.plus} size={13} color="#FFFFFF" />
                <Text style={styles.matePillText}>Record Mating</Text>
              </TouchableOpacity>
              <View style={styles.chevron}>
                <GoonaIcon icon={Icons.chevronDown} size={16} color="#64748B" />
              </View>
            </View>
          </TouchableOpacity>
          <Text style={styles.emptyText}>No breeding records yet.</Text>
        </View>
        {showMatingSheet && (
          <MatingSheet visible={showMatingSheet} onClose={() => setShowMatingSheet(false)} batchId={batchId} livestockType={livestockType} />
        )}
        {showBirthSheet && (
          <BirthSheet visible={showBirthSheet} onClose={() => setShowBirthSheet(false)} batchId={batchId} />
        )}
      </Animated.View>
    )
  }

  return (
    <Animated.View entering={FadeInUp.duration(500).delay(420).springify()}>
      <View style={styles.card}>
        {/* HEADER */}
        <TouchableOpacity style={styles.header} activeOpacity={0.7} onPress={toggleExpand}>
          <View style={styles.headerLeft}>
            <Text style={styles.secTitle}>Breeding</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{totalItems}</Text>
            </View>
            {pregnantCount > 0 && (
              <View style={styles.pregBadge}>
                <Text style={styles.pregBadgeText}>{pregnantCount} pregnant</Text>
              </View>
            )}
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.matePill}
              activeOpacity={0.85}
              onPress={() => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowMatingSheet(true) }}
            >
              <GoonaIcon icon={Icons.heart} size={11} color="#FFFFFF" />
              <Text style={styles.matePillText}>Mate</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.birthPill}
              activeOpacity={0.85}
              onPress={() => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowBirthSheet(true) }}
            >
              <GoonaIcon icon={Icons.userPlus} size={11} color="#FFFFFF" />
              <Text style={styles.birthPillText}>Birth</Text>
            </TouchableOpacity>
            <View style={[styles.chevron, expanded && styles.chevronOpen]}>
              <GoonaIcon icon={Icons.chevronDown} size={16} color="#64748B" />
            </View>
          </View>
        </TouchableOpacity>

        {/* PREGNANT SUMMARY PILLS */}
        {activeMatings.length > 0 && !expanded && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} decelerationRate="fast">
            {activeMatings.map((m) => {
              const cfg = statusStyles[m.status]
              const dam = getAnimalTag(m.damId)
              const rem = m.status === 'pregnant' ? daysRemaining(m.expectedDueDate) : null
              return (
                <TouchableOpacity
                  key={m.id}
                  activeOpacity={0.8}
                  style={[styles.chip, { backgroundColor: cfg.bg, borderColor: cfg.color + '30' }]}
                  onPress={() => { if (!expanded) setExpanded(true) }}
                >
                  <View style={[styles.chipIcon, { backgroundColor: cfg.color + '20' }]}>
                    <GoonaIcon icon={m.status === 'pregnant' ? Icons.heart : Icons.userCheck} size={12} color={cfg.color} />
                  </View>
                  <View style={styles.chipBody}>
                    <Text style={[styles.chipLabel, { color: cfg.color }]}>{dam}</Text>
                    <Text style={[styles.chipValue, { color: cfg.color }]}>
                      {rem != null ? (rem > 0 ? `${rem}d` : 'Due!') : formatDateShort(m.matingDate)}
                    </Text>
                  </View>
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        )}

        {/* EXPANDED */}
        {expanded && (
          <Animated.View entering={FadeInDown.duration(250).springify()}>
            <View style={styles.divider} />

            {/* Active pregnancies & matings */}
            {activeMatings.length > 0 && (
              <>
                <Text style={styles.subTitle}>Active {activeMatings.length > 1 ? `(${activeMatings.length})` : ''}</Text>
                {activeMatings.map((m) => {
                  const cfg = statusStyles[m.status]
                  const dam = getAnimalTag(m.damId)
                  const sire = m.sireId ? getAnimalTag(m.sireId) : (m.sireTag || 'External')
                  const rem = m.status === 'pregnant' ? daysRemaining(m.expectedDueDate) : null
                  return (
                    <View key={m.id} style={styles.activeRow}>
                      <TouchableOpacity
                        style={styles.activeRowMain}
                        activeOpacity={0.7}
                        onPress={() => {
                          setEditingMating(m)
                          setShowMatingSheet(true)
                        }}
                      >
                        <View style={[styles.rowIcon, { backgroundColor: cfg.bg }]}>
                          <GoonaIcon icon={Icons.heart} size={15} color={cfg.color} />
                        </View>
                        <View style={styles.rowBody}>
                          <View style={styles.rowTop}>
                            <Text style={styles.rowLabel}>{dam} <Text style={styles.rowMeta}>× {sire}</Text></Text>
                            <View style={[styles.statusDot, { backgroundColor: cfg.color }]} />
                          </View>
                          <View style={styles.rowBottom}>
                            <Text style={styles.rowDetail}>
                              Mated {formatDateShort(m.matingDate)}
                              {rem != null ? ` · Due ${formatDateShort(m.expectedDueDate)}` : ''}
                            </Text>
                            {rem != null && (
                              <Text style={[styles.rowBadge, { color: rem > 0 ? '#7C3AED' : '#EF4444', backgroundColor: rem > 0 ? '#F5F3FF' : '#FEF2F2' }]}>
                                {rem > 0 ? `${rem}d left` : 'Past due'}
                              </Text>
                            )}
                          </View>
                        </View>
                      </TouchableOpacity>
                      {/* Lifecycle actions */}
                      <View style={styles.actionsCol}>
                        {m.status === 'mated' && (
                          <TouchableOpacity
                            style={styles.actionBtnConfirm}
                            activeOpacity={0.7}
                            onPress={() => updateMating(m.id, { status: 'pregnant' })}
                          >
                            <GoonaIcon icon={Icons.checkCheck} size={12} color="#FFFFFF" />
                            <Text style={styles.actionBtnText}>Confirm{'\n'}Pregnant</Text>
                          </TouchableOpacity>
                        )}
                        {(m.status === 'mated' || m.status === 'pregnant') && (
                          <TouchableOpacity
                            style={styles.actionBtnFail}
                            activeOpacity={0.7}
                            onPress={() => updateMating(m.id, { status: 'failed' })}
                          >
                            <GoonaIcon icon={Icons.x} size={12} color="#FFFFFF" />
                            <Text style={styles.actionBtnText}>Mark{'\n'}Failed</Text>
                          </TouchableOpacity>
                        )}
                        {m.status === 'pregnant' && (
                          <TouchableOpacity
                            style={styles.actionBtnBirth}
                            activeOpacity={0.7}
                            onPress={() => {
                              setEditingMating(undefined)
                              setBirthPreSelectedMatingId(m.id)
                              setShowBirthSheet(true)
                            }}
                          >
                            <GoonaIcon icon={Icons.userPlus} size={12} color="#FFFFFF" />
                            <Text style={styles.actionBtnText}>Record{'\n'}Birth</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  )
                })}
              </>
            )}

            {/* Birth events */}
            {batchBirths.length > 0 && (
              <>
                <Text style={styles.subTitle}>Births ({batchBirths.length})</Text>
                {batchBirths.map((b) => {
                  const dam = getAnimalTag(b.damId)
                  return (
                    <View key={b.id} style={styles.row}>
                      <View style={[styles.rowIcon, { backgroundColor: '#F0FDF4' }]}>
                        <GoonaIcon icon={Icons.userPlus} size={15} color="#16A34A" />
                      </View>
                      <View style={styles.rowBody}>
                        <View style={styles.rowTop}>
                          <Text style={styles.rowLabel}>{dam}</Text>
                          <Text style={styles.rowMeta}>{b.offspringCount} offspring</Text>
                        </View>
                        <View style={styles.rowBottom}>
                          <Text style={styles.rowDetail}>{formatDateShort(b.birthDate)}</Text>
                        </View>
                      </View>
                    </View>
                  )
                })}
              </>
            )}

            {/* History */}
            {historyMatings.length > 0 && (
              <>
                <Text style={styles.subTitle}>History ({historyMatings.length})</Text>
                {historyMatings.map((m) => {
                  const cfg = statusStyles[m.status]
                  const dam = getAnimalTag(m.damId)
                  return (
                    <View key={m.id} style={styles.row}>
                      <View style={[styles.rowIcon, { backgroundColor: cfg.bg }]}>
                        <GoonaIcon icon={Icons.heart} size={15} color={cfg.color} />
                      </View>
                      <View style={styles.rowBody}>
                        <View style={styles.rowTop}>
                          <Text style={styles.rowLabel}>{dam}</Text>
                          <View style={[styles.statusDot, { backgroundColor: cfg.color }]} />
                          <Text style={[styles.statusLabel, { color: cfg.color }]}>{cfg.label}</Text>
                        </View>
                        <Text style={styles.rowDetail}>{formatDateShort(m.matingDate)}</Text>
                      </View>
                    </View>
                  )
                })}
              </>
            )}

            {totalItems === 0 && (
              <Text style={styles.emptyText}>No breeding records yet.</Text>
            )}
          </Animated.View>
        )}
      </View>

      {showMatingSheet && (
        <MatingSheet
          visible={showMatingSheet}
          onClose={() => { setShowMatingSheet(false); setEditingMating(undefined) }}
          batchId={batchId}
          livestockType={livestockType}
          editMating={editingMating}
        />
      )}
      {showBirthSheet && (
        <BirthSheet
          visible={showBirthSheet}
          onClose={() => { setShowBirthSheet(false); setBirthPreSelectedMatingId(undefined) }}
          batchId={batchId}
          preSelectedMatingId={birthPreSelectedMatingId}
        />
      )}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  secTitle: { fontSize: 17, fontWeight: '800', color: '#15291A' },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 28, marginHorizontal: 16, marginTop: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 20, elevation: 2,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)',
    paddingHorizontal: 20, paddingVertical: 16,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  countBadge: { backgroundColor: '#15291A', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 2 },
  countText: { fontSize: 12, fontWeight: '800', color: '#FFFFFF' },
  pregBadge: { backgroundColor: '#F5F3FF', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  pregBadgeText: { fontSize: 11, fontWeight: '700', color: '#7C3AED' },
  chevron: { width: 28, height: 28, borderRadius: 999, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  chevronOpen: { backgroundColor: '#E2E8F0' },
  matePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#D9566A', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999,
  },
  matePillText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF' },
  birthPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#8B7EC3', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999,
  },
  birthPillText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF' },
  chips: { paddingVertical: 12, gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1,
  },
  chipIcon: { width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  chipBody: {},
  chipLabel: { fontSize: 11, fontWeight: '600' },
  chipValue: { fontSize: 13, fontWeight: '800' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 8 },
  subTitle: { fontSize: 13, fontWeight: '700', color: '#94A3B8', marginBottom: 6, marginTop: 4 },
  row: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#F8FAFC', gap: 10,
  },
  rowIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  rowBody: { flex: 1, gap: 2 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowLabel: { fontSize: 14, fontWeight: '700', color: '#1B1B1B' },
  rowMeta: { fontSize: 12, fontWeight: '500', color: '#94A3B8' },
  rowBottom: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowDetail: { fontSize: 12, fontWeight: '500', color: '#64748B' },
  rowBadge: { fontSize: 11, fontWeight: '700', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, overflow: 'hidden' },
  statusDot: { width: 7, height: 7, borderRadius: 999 },
  statusLabel: { fontSize: 11, fontWeight: '600' },
  emptyText: { fontSize: 13, fontWeight: '500', color: '#94A3B8', textAlign: 'center', paddingVertical: 16 },
  activeRow: { flexDirection: 'row', alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingVertical: 4 },
  activeRowMain: { flex: 1, paddingVertical: 6 },
  actionsCol: { flexDirection: 'column', gap: 4, paddingLeft: 8, paddingTop: 6 },
  actionBtnConfirm: {
    flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 4,
    borderRadius: 8, backgroundColor: '#7C3AED',
  },
  actionBtnFail: {
    flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 4,
    borderRadius: 8, backgroundColor: '#EF4444',
  },
  actionBtnBirth: {
    flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 4,
    borderRadius: 8, backgroundColor: '#16A34A',
  },
  actionBtnText: { fontSize: 8, fontWeight: '700', color: '#FFFFFF', textAlign: 'center', lineHeight: 10 },
})
