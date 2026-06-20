import React from 'react'
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, Platform,
} from 'react-native'
import { router } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import GoonaIcon from './ui/GoonaIcon'
import { Wallet, ArrowRight, X } from 'lucide-react-native'
import Animated, { FadeInUp, SlideInUp } from 'react-native-reanimated'

interface Props {
  visible: boolean
  onClose: () => void
}

export default function WalletRequiredModal({ visible, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <Animated.View entering={SlideInUp.duration(350).springify().damping(20)} style={styles.sheet}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <GoonaIcon icon={X} size={20} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.iconWrap}>
            <GoonaIcon icon={Wallet} size={36} color="#2E7D32" />
          </View>

          <Text style={styles.title}>Almost There</Text>
          <Text style={styles.desc}>
            To start saving and transacting with GOONA Wallet, please activate your wallet.
          </Text>
          <Text style={styles.timeEstimate}>This takes about 2 minutes.</Text>

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.btn}
            onPress={() => { onClose(); router.push('/wallet-activation') }}
          >
            <LinearGradient
              colors={['#2E7D32', '#1B5E20']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.btnGrad}
            >
              <Text style={styles.btnText}>Activate Wallet</Text>
              <GoonaIcon icon={ArrowRight} size={18} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.laterBtn} activeOpacity={0.7} onPress={onClose}>
            <Text style={styles.laterText}>Maybe Later</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: {
    backgroundColor: 'white', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 28, paddingBottom: Platform.OS === 'ios' ? 40 : 28,
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.08, shadowRadius: 30, elevation: 10,
  },
  closeBtn: {
    position: 'absolute', top: 16, right: 16,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', zIndex: 2,
  },
  iconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center',
    marginBottom: 20, marginTop: 8,
  },
  title: {
    fontSize: 22, fontWeight: '800', color: '#1B1B1B',
    textAlign: 'center', marginBottom: 12,
  },
  desc: {
    fontSize: 15, color: '#64748B',
    textAlign: 'center', lineHeight: 22, marginBottom: 8,
  },
  timeEstimate: {
    fontSize: 14, fontWeight: '600', color: '#2E7D32',
    textAlign: 'center', marginBottom: 28,
  },
  btn: {
    width: '100%', borderRadius: 18, overflow: 'hidden', marginBottom: 12,
    shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3, shadowRadius: 30, elevation: 6,
  },
  btnGrad: {
    height: 54, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  btnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  laterBtn: { paddingVertical: 8, paddingHorizontal: 20 },
  laterText: { fontSize: 14, fontWeight: '600', color: '#94A3B8' },
})
