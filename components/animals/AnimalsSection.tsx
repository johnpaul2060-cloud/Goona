import React, { useState, useMemo, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet,
} from 'react-native'
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated'
import GoonaIcon from '../ui/GoonaIcon'
import { Icons } from '../../shared/icons'
import { useAnimalStore, type Animal, type AnimalStatus } from '../../store/useAnimalStore'
import type { Batch } from '../../store/useBatchStore'
import AddAnimalSheet from './AddAnimalSheet'
import AnimalDetailSheet from './AnimalDetailSheet'

interface Props {
  batch: Batch
}

const statusCfg: Record<AnimalStatus, { label: string; color: string; bg: string }> = {
  active: { label: 'Active', color: '#16A34A', bg: '#F0FDF4' },
  sold: { label: 'Sold', color: '#F59E0B', bg: '#FFFBEB' },
  deceased: { label: 'Deceased', color: '#EF4444', bg: '#FEF2F2' },
}

function computeAge(iso: string): string {
  const dob = new Date(iso)
  const diff = Date.now() - dob.getTime()
  const years = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000))
  const months = Math.floor((diff % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000))
  if (years > 0) return `${years}y ${months}m`
  if (months > 0) return `${months}m`
  const days = Math.floor(diff / (24 * 60 * 60 * 1000))
  return `${days}d`
}

export default function AnimalsSection({ batch }: Props) {
  const animals = useAnimalStore((s) => s.animals)
  const deleteAnimal = useAnimalStore((s) => s.deleteAnimal)

  const [expanded, setExpanded] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [editTarget, setEditTarget] = useState<Animal | undefined>(undefined)
  const [detailTarget, setDetailTarget] = useState<Animal | null>(null)

  const batchAnimals = useMemo(() => animals.filter((a) => a.batchId === batch.id), [animals, batch.id])

  const activeCount = useMemo(() => batchAnimals.filter((a) => a.status === 'active').length, [batchAnimals])
  const soldCount = useMemo(() => batchAnimals.filter((a) => a.status === 'sold').length, [batchAnimals])
  const deceasedCount = useMemo(() => batchAnimals.filter((a) => a.status === 'deceased').length, [batchAnimals])

  const summaries = useMemo(() => {
    const result: { key: string; label: string; icon: any; color: string; value: string }[] = []
    if (activeCount > 0) result.push({ key: 'active', label: 'Active', icon: Icons.userCheck, color: '#16A34A', value: String(activeCount) })
    if (soldCount > 0) result.push({ key: 'sold', label: 'Sold', icon: Icons.trendingUp, color: '#F59E0B', value: String(soldCount) })
    if (deceasedCount > 0) result.push({ key: 'deceased', label: 'Deceased', icon: Icons.skull, color: '#EF4444', value: String(deceasedCount) })
    return result
  }, [activeCount, soldCount, deceasedCount])

  const toggleExpand = useCallback(() => setExpanded((v) => !v), [])

  const handleEdit = useCallback((animal: Animal) => {
    setDetailTarget(null)
    setEditTarget(animal)
    setShowAdd(true)
  }, [])

  const handleDelete = useCallback((id: string) => {
    deleteAnimal(id)
  }, [deleteAnimal])

  const handleAddNew = useCallback(() => {
    setEditTarget(undefined)
    setShowAdd(true)
  }, [])

  if (!batchAnimals.length && !expanded) {
    return (
      <Animated.View entering={FadeInUp.duration(500).delay(400).springify()}>
        <View style={styles.animalsCard}>
          <TouchableOpacity style={styles.animalsHeader} activeOpacity={0.7} onPress={toggleExpand}>
            <View style={styles.animalsHeaderLeft}>
              <Text style={styles.secTitle}>Animals</Text>
              <Text style={styles.profiledBadge}>0 profiled</Text>
            </View>
            <TouchableOpacity style={styles.addPill} activeOpacity={0.85} onPress={handleAddNew}>
              <GoonaIcon icon={Icons.plus} size={14} color="#FFFFFF" />
              <Text style={styles.addPillText}>Add Animal</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
        {showAdd && (
          <AddAnimalSheet visible={showAdd} onClose={() => setShowAdd(false)} batchId={batch.id} editAnimal={editTarget} />
        )}
        <AnimalDetailSheet visible={!!detailTarget} onClose={() => setDetailTarget(null)} animal={detailTarget} onEdit={handleEdit} />
      </Animated.View>
    )
  }

  return (
    <Animated.View entering={FadeInUp.duration(500).delay(400).springify()}>
      <View style={styles.animalsCard}>
        {/* Header with chevron */}
        <TouchableOpacity style={styles.animalsHeader} activeOpacity={0.7} onPress={toggleExpand}>
          <View style={styles.animalsHeaderLeft}>
            <Text style={styles.secTitle}>Animals</Text>
            <View style={styles.animalsCountBadge}>
              <Text style={styles.animalsCountText}>{batchAnimals.length}</Text>
            </View>
          </View>
          <View style={styles.animalsHeaderRight}>
            <TouchableOpacity style={styles.addPill} activeOpacity={0.85} onPress={handleAddNew}>
              <GoonaIcon icon={Icons.plus} size={14} color="#FFFFFF" />
              <Text style={styles.addPillText}>Add</Text>
            </TouchableOpacity>
            <View style={[styles.animalsChevron, expanded && styles.animalsChevronOpen]}>
              <GoonaIcon icon={Icons.chevronDown} size={16} color="#64748B" />
            </View>
          </View>
        </TouchableOpacity>

        {/* Premium summary pills (always visible) */}
        {summaries.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.animalsChips} decelerationRate="fast" snapToInterval={120}>
            {summaries.map((s) => (
              <TouchableOpacity
                key={s.key}
                activeOpacity={0.8}
                style={[styles.animalsChipPremium, { backgroundColor: s.color + '0D', borderColor: s.color + '25' }]}
                onPress={() => { if (!expanded) setExpanded(true) }}
              >
                <View style={[styles.animalsChipIcon, { backgroundColor: s.color + '18' }]}>
                  <GoonaIcon icon={s.icon} size={14} color={s.color} />
                </View>
                <View style={styles.animalsChipBody}>
                  <Text style={[styles.animalsChipLabel, { color: s.color }]}>{s.label}</Text>
                  <Text style={[styles.animalsChipValue, { color: s.color }]}>{s.value}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Expanded animal list */}
        {expanded && (
          <Animated.View entering={FadeInDown.duration(250).springify()}>
            <View style={styles.animalsDivider} />

            {batchAnimals.map((animal) => {
              const cfg = statusCfg[animal.status]
              const age = computeAge(animal.dateOfBirth)
              return (
                <TouchableOpacity
                  key={animal.id}
                  style={styles.animalRow}
                  activeOpacity={0.7}
                  onPress={() => setDetailTarget(animal)}
                >
                  <View style={[styles.animalAvatar, { backgroundColor: animal.sex === 'male' ? '#F0FDF4' : '#F5F3FF' }]}>
                    <GoonaIcon
                      icon={animal.sex === 'male' ? Icons.user : Icons.userCheck}
                      size={16}
                      color={animal.sex === 'male' ? '#2E7D32' : '#7C3AED'}
                    />
                  </View>
                  <View style={styles.animalBody}>
                    <View style={styles.animalTop}>
                      <Text style={styles.animalTag}>{animal.tag}</Text>
                      <Text style={styles.animalAge}>{age}</Text>
                    </View>
                    <View style={styles.animalBottom}>
                      <Text style={styles.animalSex}>{animal.sex === 'male' ? 'Male' : 'Female'}</Text>
                      {animal.breed ? <Text style={styles.animalBreed}>{animal.breed}</Text> : null}
                      <View style={[styles.animalStatusDot, { backgroundColor: cfg.color }]} />
                      <Text style={[styles.animalStatusLabel, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.animalDeleteBtn}
                    activeOpacity={0.7}
                    onPress={(e) => {
                      e.stopPropagation()
                      handleDelete(animal.id)
                    }}
                  >
                    <GoonaIcon icon={Icons.x} size={14} color="#CBD5E1" />
                  </TouchableOpacity>
                </TouchableOpacity>
              )
            })}

            {batchAnimals.length > 10 && (
              <Text style={styles.animalsMore}>
                Showing 10 of {batchAnimals.length} — open detail to see all
              </Text>
            )}
          </Animated.View>
        )}
      </View>

      {showAdd && (
        <AddAnimalSheet visible={showAdd} onClose={() => setShowAdd(false)} batchId={batch.id} editAnimal={editTarget} />
      )}
      <AnimalDetailSheet visible={!!detailTarget} onClose={() => setDetailTarget(null)} animal={detailTarget} onEdit={handleEdit} />
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  secTitle: { fontSize: 17, fontWeight: '800', color: '#15291A' },
  animalsCard: {
    backgroundColor: '#FFFFFF', borderRadius: 28, marginHorizontal: 16, marginTop: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
    paddingHorizontal: 20, paddingVertical: 16,
  },
  animalsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  animalsHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  animalsHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  animalsCountBadge: { backgroundColor: '#15291A', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 2 },
  animalsCountText: { fontSize: 12, fontWeight: '800', color: '#FFFFFF' },
  profiledBadge: { fontSize: 12, fontWeight: '700', color: '#94A3B8' },
  animalsChevron: { width: 28, height: 28, borderRadius: 999, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '0deg' }] },
  animalsChevronOpen: { transform: [{ rotate: '180deg' }] },
  addPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#2E7D32', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
  },
  addPillText: { fontSize: 12, fontWeight: '800', color: '#FFFFFF' },
  animalsChips: { paddingVertical: 12, gap: 8 },
  animalsChipPremium: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1,
  },
  animalsChipIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  animalsChipBody: {},
  animalsChipLabel: { fontSize: 11, fontWeight: '600' },
  animalsChipValue: { fontSize: 16, fontWeight: '800' },
  animalsDivider: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 8 },
  animalRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#F8FAFC', gap: 10,
  },
  animalAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  animalBody: { flex: 1, gap: 2 },
  animalTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  animalTag: { fontSize: 15, fontWeight: '700', color: '#1B1B1B' },
  animalAge: { fontSize: 12, fontWeight: '700', color: '#16A34A', backgroundColor: '#F0FDF4', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, overflow: 'hidden' },
  animalBottom: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  animalSex: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  animalBreed: { fontSize: 12, fontWeight: '500', color: '#94A3B8' },
  animalStatusDot: { width: 6, height: 6, borderRadius: 3 },
  animalStatusLabel: { fontSize: 11, fontWeight: '600' },
  animalDeleteBtn: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  animalsMore: { fontSize: 12, fontWeight: '600', color: '#94A3B8', textAlign: 'center', paddingVertical: 12 },
})
