import React, { useEffect, useState } from 'react'
import {
  View, Text, TouchableOpacity, Pressable,
  StyleSheet, Platform,
} from 'react-native'
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
} from 'react-native-reanimated'
import GoonaIcon from './ui/GoonaIcon'
import { Icons } from '../shared/icons'

const BATCHES = [
  'Broiler Batch A',
  'Layer Batch B',
  'Starter Pen C',
  'Turkey Unit',
  'Poultry Expansion Batch',
]

export default function BatchPickerModal({
  visible, selected, onSelect, onClose,
}: {
  visible: boolean
  selected: string
  onSelect: (batch: string) => void
  onClose: () => void
}) {
  const [isVisible, setIsVisible] = useState(false)
  const translateY = useSharedValue(600)
  const backdropOpacity = useSharedValue(0)

  useEffect(() => {
    if (visible) {
      setIsVisible(true)
      translateY.value = withSpring(0, { damping: 28, stiffness: 200 })
      backdropOpacity.value = withTiming(1, { duration: 250 })
    } else {
      translateY.value = withTiming(600, { duration: 220 })
      backdropOpacity.value = withTiming(0, { duration: 200 })
      setTimeout(() => setIsVisible(false), 250)
    }
  }, [visible])

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }))

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }))

  if (!isVisible) return null

  return (
    <View style={styles.overlay}>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[styles.sheet, sheetStyle]}>
        <View style={styles.sheetHandle} />

        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Select Farm Batch</Text>
          <TouchableOpacity onPress={onClose} style={styles.sheetCloseBtn} activeOpacity={0.7}>
            <GoonaIcon icon={Icons.x} size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        <Text style={styles.sheetSub}>
          Choose the active production batch to log records against.
        </Text>

        <View style={styles.listGroup}>
          {BATCHES.map((batch) => {
            const active = selected === batch
            return (
              <Pressable
                key={batch}
                onPress={() => {
                  onSelect(batch)
                  onClose()
                }}
                style={[styles.batchRow, active && styles.batchRowActive]}
              >
                <View style={[styles.batchDot, active && styles.batchDotActive]}>
                  {active && (
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: 'white' }} />
                  )}
                </View>
                <Text style={[styles.batchLabel, active && styles.batchLabelActive]}>
                  {batch}
                </Text>
                {active && (
                  <View style={styles.checkBadge}>
                    <GoonaIcon icon={Icons.check} size={16} color="white" />
                  </View>
                )}
              </Pressable>
            )
          })}
        </View>

        <TouchableOpacity
          style={styles.doneBtn}
          activeOpacity={0.85}
          onPress={onClose}
        >
          <Text style={styles.doneBtnText}>Cancel</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingHorizontal: 24,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.08,
    shadowRadius: 32,
    elevation: 12,
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center', marginTop: 10, marginBottom: 6,
  },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: 8,
  },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: '#1B1B1B' },
  sheetCloseBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center',
  },
  sheetSub: {
    fontSize: 13, color: '#94A3B8', lineHeight: 19,
    marginTop: 8,
  },
  listGroup: { marginTop: 18, gap: 8 },
  batchRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 16, paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#F8FAF7',
    borderWidth: 1, borderColor: 'transparent',
  },
  batchRowActive: {
    backgroundColor: 'rgba(46,125,50,0.08)',
    borderColor: '#2E7D32',
  },
  batchDot: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: '#D1D5DB',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 14,
  },
  batchDotActive: {
    borderColor: '#2E7D32',
    backgroundColor: '#2E7D32',
  },
  batchLabel: {
    fontSize: 15, fontWeight: '600', color: '#1F2937', flex: 1,
  },
  batchLabelActive: { color: '#2E7D32' },
  checkBadge: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#2E7D32',
    alignItems: 'center', justifyContent: 'center',
  },
  doneBtn: {
    height: 52, borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center',
    marginTop: 18,
  },
  doneBtnText: { fontSize: 16, fontWeight: '600', color: '#64748B' },
})
