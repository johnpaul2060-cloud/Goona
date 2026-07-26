import React, { useMemo } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Modal,
} from 'react-native'
import Animated, { SlideInUp } from 'react-native-reanimated'
import GoonaIcon from '../ui/GoonaIcon'
import { Icons } from '../../shared/icons'
import { useAnimalStore, type Animal } from '../../store/useAnimalStore'

interface Props {
  visible: boolean
  onClose: () => void
  animal: Animal | null
  onEdit: (animal: Animal) => void
}

function formatDateStr(iso: string): string {
  const d = new Date(iso)
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear()
  return `${day} / ${month} / ${year}`
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

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: 'Active', color: '#16A34A', bg: '#F0FDF4' },
  sold: { label: 'Sold', color: '#F59E0B', bg: '#FFFBEB' },
  deceased: { label: 'Deceased', color: '#EF4444', bg: '#FEF2F2' },
}

export default function AnimalDetailSheet({ visible, onClose, animal, onEdit }: Props) {
  const animals = useAnimalStore((s) => s.animals)
  const age = useMemo(() => (animal ? computeAge(animal.dateOfBirth) : ''), [animal?.dateOfBirth])
  const config = animal ? statusConfig[animal.status] : null

  const dam = useMemo(
    () => (animal?.damId ? animals.find((a) => a.id === animal.damId) : null),
    [animal?.damId, animals]
  )
  const sire = useMemo(
    () => (animal?.sireId ? animals.find((a) => a.id === animal.sireId) : null),
    [animal?.sireId, animals]
  )
  const offspringList = useMemo(
    () => (animal?.offspringIds?.length ? animals.filter((a) => animal.offspringIds?.includes(a.id)) : []),
    [animal?.offspringIds, animals]
  )

  if (!animal) return null

  const infoRows: { icon: string; label: string; value: string }[] = [
    { icon: 'fingerprint', label: 'Tag / Name', value: animal.tag },
    { icon: 'calendar', label: 'Date of Birth', value: formatDateStr(animal.dateOfBirth) },
    { icon: 'clock', label: 'Age', value: age },
    { icon: 'user', label: 'Sex', value: animal.sex === 'male' ? 'Male' : 'Female' },
  ]

  if (animal.breed) infoRows.push({ icon: 'book', label: 'Breed', value: animal.breed })
  if (animal.weight != null) infoRows.push({ icon: 'scale', label: 'Weight', value: `${animal.weight} kg` })
  if (animal.height != null) infoRows.push({ icon: 'target', label: 'Height', value: `${animal.height} cm` })

  const IcoMap: Record<string, any> = {
    fingerprint: Icons.fingerprint,
    calendar: Icons.calendar,
    clock: Icons.clock,
    user: Icons.user,
    book: Icons.book,
    scale: Icons.scale,
    target: Icons.target,
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <Animated.View entering={SlideInUp.duration(350).springify().damping(20)} style={styles.sheet}>
          <View style={styles.handle} />
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollInner}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.avatarWrap}>
                <GoonaIcon
                  icon={animal.sex === 'male' ? Icons.user : Icons.userCheck}
                  size={28}
                  color={animal.sex === 'male' ? '#2E7D32' : '#7C3AED'}
                />
              </View>
              <Text style={styles.title}>{animal.tag}</Text>
              {config && (
                <View style={[styles.statusPill, { backgroundColor: config.bg }]}>
                  <View style={[styles.statusDot, { backgroundColor: config.color }]} />
                  <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
                </View>
              )}
            </View>

            {/* Info rows */}
            <View style={styles.card}>
              {infoRows.map((row, i) => {
                const IconComp = IcoMap[row.icon]
                return (
                  <View key={i} style={[styles.infoRow, i < infoRows.length - 1 && styles.infoRowBorder]}>
                    <View style={styles.infoIcon}>
                      <GoonaIcon icon={IconComp} size={18} color="#64748B" />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>{row.label}</Text>
                      <Text style={styles.infoValue}>{row.value}</Text>
                    </View>
                  </View>
                )
              })}
            </View>

            {/* Notes */}
            {animal.notes ? (
              <View style={styles.notesSection}>
                <Text style={styles.notesTitle}>Notes</Text>
                <View style={styles.notesCard}>
                  <Text style={styles.notesText}>{animal.notes}</Text>
                </View>
              </View>
            ) : null}

            {/* Lineage */}
            {(dam || sire) && (
              <View style={styles.lineageSection}>
                <Text style={styles.notesTitle}>Lineage</Text>
                <View style={styles.lineageCard}>
                  {dam && (
                    <View style={styles.lineageRow}>
                      <GoonaIcon icon={Icons.userCheck} size={17} color="#7C3AED" />
                      <View style={styles.lineageContent}>
                        <Text style={styles.lineageLabel}>Dam (Mother)</Text>
                        <Text style={styles.lineageValue}>{dam.tag}</Text>
                      </View>
                    </View>
                  )}
                  {sire && (
                    <View style={styles.lineageRow}>
                      <GoonaIcon icon={Icons.user} size={17} color="#2E7D32" />
                      <View style={styles.lineageContent}>
                        <Text style={styles.lineageLabel}>Sire (Father)</Text>
                        <Text style={styles.lineageValue}>{sire.tag}</Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Offspring */}
            {offspringList.length > 0 && (
              <View style={styles.offspringSection}>
                <Text style={styles.notesTitle}>
                  Offspring ({offspringList.length})
                </Text>
                <View style={styles.offspringCard}>
                  {offspringList.map((kid) => (
                    <View key={kid.id} style={styles.offspringItem}>
                      <View style={[styles.offspringIcon, { backgroundColor: kid.sex === 'male' ? '#F0FDF4' : '#F5F3FF' }]}>
                        <GoonaIcon
                          icon={kid.sex === 'male' ? Icons.user : Icons.userCheck}
                          size={13}
                          color={kid.sex === 'male' ? '#2E7D32' : '#7C3AED'}
                        />
                      </View>
                      <View style={styles.offspringInfo}>
                        <Text style={styles.offspringTag}>{kid.tag}</Text>
                        <Text style={styles.offspringMeta}>
                          {kid.sex === 'male' ? 'Male' : 'Female'} · {computeAge(kid.dateOfBirth)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Edit button */}
            <TouchableOpacity
              style={styles.editBtn}
              activeOpacity={0.85}
              onPress={() => onEdit(animal)}
            >
              <GoonaIcon icon={Icons.edit3} size={18} color="#FFFFFF" />
              <Text style={styles.editText}>Edit Profile</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 32, borderTopRightRadius: 32,
    maxHeight: '90%',
    shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.08, shadowRadius: 30, elevation: 15,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB', alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  scrollInner: { paddingHorizontal: 24, paddingBottom: 30 },
  header: { alignItems: 'center', paddingVertical: 16 },
  avatarWrap: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: '#F0FDF4',
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  title: { fontSize: 22, fontWeight: '800', color: '#15291A' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, marginTop: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '700' },
  card: { backgroundColor: '#F2F6F1', borderRadius: 20, paddingHorizontal: 16, marginTop: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, gap: 12 },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  infoIcon: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, fontWeight: '600', color: '#94A3B8', marginBottom: 1 },
  infoValue: { fontSize: 15, fontWeight: '700', color: '#1B1B1B' },
  notesSection: { marginTop: 16 },
  notesTitle: { fontSize: 13, fontWeight: '700', color: '#1F2937', marginBottom: 8 },
  notesCard: { backgroundColor: '#F2F6F1', borderRadius: 16, padding: 16 },
  notesText: { fontSize: 14, fontWeight: '500', color: '#334155', lineHeight: 22 },
  lineageSection: { marginTop: 16 },
  lineageCard: { backgroundColor: '#F2F6F1', borderRadius: 16, padding: 14, gap: 10 },
  lineageRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  lineageContent: { flex: 1 },
  lineageLabel: { fontSize: 11, fontWeight: '600', color: '#94A3B8', marginBottom: 1 },
  lineageValue: { fontSize: 14, fontWeight: '700', color: '#1B1B1B' },
  offspringSection: { marginTop: 16 },
  offspringCard: { backgroundColor: '#F2F6F1', borderRadius: 16, padding: 12, gap: 8 },
  offspringItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  offspringIcon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  offspringInfo: { flex: 1 },
  offspringTag: { fontSize: 14, fontWeight: '700', color: '#1B1B1B' },
  offspringMeta: { fontSize: 12, fontWeight: '500', color: '#64748B' },
  editBtn: {
    height: 50, borderRadius: 16, backgroundColor: '#2E7D32',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 20,
  },
  editText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
})
