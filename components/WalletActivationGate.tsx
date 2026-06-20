import React from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, Platform,
} from 'react-native'
import { router } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import GoonaIcon from './ui/GoonaIcon'
import { Wallet, ArrowRight } from 'lucide-react-native'
import Animated, { FadeInUp } from 'react-native-reanimated'
import { useWalletStore } from '../store/useWalletStore'

interface Props {
  children: React.ReactNode
}

export default function WalletActivationGate({ children }: Props) {
  const status = useWalletStore((s) => s.walletStatus)

  if (status === 'activated') {
    return <>{children}</>
  }

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInUp.duration(500).springify()} style={styles.card}>
        <View style={styles.iconWrap}>
          <GoonaIcon icon={Wallet} size={40} color="#2E7D32" />
        </View>

        <Text style={styles.title}>Almost There</Text>
        <Text style={styles.desc}>
          To start saving and transacting with GOONA Wallet, please activate your wallet.
        </Text>
        <Text style={styles.timeEstimate}>This takes about 2 minutes.</Text>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.btn}
          onPress={() => router.push('/wallet-activation')}
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

        <TouchableOpacity style={styles.laterBtn} activeOpacity={0.7} onPress={() => router.back()}>
          <Text style={styles.laterText}>Maybe Later</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#F8FAF7',
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24,
  },
  card: {
    backgroundColor: 'white', borderRadius: 28, padding: 32,
    alignItems: 'center', width: '100%', maxWidth: 400,
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08, shadowRadius: 32, elevation: 6,
  },
  iconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  title: {
    fontSize: 22, fontWeight: '800', color: '#1B1B1B', textAlign: 'center', marginBottom: 12,
  },
  desc: {
    fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 22, marginBottom: 8,
  },
  timeEstimate: {
    fontSize: 14, fontWeight: '600', color: '#2E7D32', textAlign: 'center', marginBottom: 28,
  },
  btn: {
    width: '100%', borderRadius: 18, overflow: 'hidden', marginBottom: 12,
    shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3, shadowRadius: 30, elevation: 6,
  },
  btnGrad: {
    height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  btnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  laterBtn: { paddingVertical: 8, paddingHorizontal: 20 },
  laterText: { fontSize: 14, fontWeight: '600', color: '#94A3B8' },
})
