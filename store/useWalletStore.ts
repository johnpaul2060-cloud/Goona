import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

export type WalletStatus = 'not_activated' | 'pending' | 'activated'

export interface KycStep1 {
  firstName: string
  lastName: string
  dateOfBirth: string
  completed: boolean
}

export interface KycStep2 {
  bvn: string
  completed: boolean
}

export interface KycStep3 {
  nin: string
  completed: boolean
}

export interface KycStep4 {
  selfieUri: string | null
  completed: boolean
}

export interface KycStep5 {
  farmName: string
  businessType: string
  cacNumber: string
  completed: boolean
}

export interface KycData {
  step1: KycStep1
  step2: KycStep2
  step3: KycStep3
  step4: KycStep4
  step5: KycStep5
}

interface WalletState {
  walletStatus: WalletStatus
  kyc: KycData

  setWalletStatus: (status: WalletStatus) => void
  setKycStep1: (data: KycStep1) => void
  setKycStep2: (data: KycStep2) => void
  setKycStep3: (data: KycStep3) => void
  setKycStep4: (data: KycStep4) => void
  setKycStep5: (data: KycStep5) => void
  resetKyc: () => void
  resetAll: () => void
}

const defaultKyc: KycData = {
  step1: { firstName: '', lastName: '', dateOfBirth: '', completed: false },
  step2: { bvn: '', completed: false },
  step3: { nin: '', completed: false },
  step4: { selfieUri: null, completed: false },
  step5: { farmName: '', businessType: '', cacNumber: '', completed: false },
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      walletStatus: 'not_activated',
      kyc: {
        step1: { ...defaultKyc.step1 },
        step2: { ...defaultKyc.step2 },
        step3: { ...defaultKyc.step3 },
        step4: { ...defaultKyc.step4 },
        step5: { ...defaultKyc.step5 },
      },

      setWalletStatus: (status) => set({ walletStatus: status }),

      setKycStep1: (data) => set((s) => ({ kyc: { ...s.kyc, step1: data } })),
      setKycStep2: (data) => set((s) => ({ kyc: { ...s.kyc, step2: data } })),
      setKycStep3: (data) => set((s) => ({ kyc: { ...s.kyc, step3: data } })),
      setKycStep4: (data) => set((s) => ({ kyc: { ...s.kyc, step4: data } })),
      setKycStep5: (data) => set((s) => ({ kyc: { ...s.kyc, step5: data } })),

      resetKyc: () => set({
        kyc: {
          step1: { ...defaultKyc.step1 },
          step2: { ...defaultKyc.step2 },
          step3: { ...defaultKyc.step3 },
          step4: { ...defaultKyc.step4 },
          step5: { ...defaultKyc.step5 },
        },
        walletStatus: 'not_activated',
      }),

      resetAll: () => set({
        walletStatus: 'not_activated',
        kyc: {
          step1: { ...defaultKyc.step1 },
          step2: { ...defaultKyc.step2 },
          step3: { ...defaultKyc.step3 },
          step4: { ...defaultKyc.step4 },
          step5: { ...defaultKyc.step5 },
        },
      }),
    }),
    {
      name: 'goona-wallet',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
)

export function getVerificationScore(kyc: KycData): number {
  let score = 0
  if (kyc.step1.completed) score += 16
  if (kyc.step2.completed) score += 22
  if (kyc.step3.completed) score += 22
  if (kyc.step4.completed) score += 22
  if (kyc.step5.completed) score += 18
  return score
}

export function getVerifiedCount(kyc: KycData): { completed: number; total: number } {
  let completed = 0
  if (kyc.step1.completed) completed++
  if (kyc.step2.completed) completed++
  if (kyc.step3.completed) completed++
  if (kyc.step4.completed) completed++
  if (kyc.step5.completed) completed++
  return { completed, total: 5 }
}

export function isKycFullyCompleted(kyc: KycData): boolean {
  return kyc.step1.completed && kyc.step2.completed && kyc.step3.completed && kyc.step4.completed && kyc.step5.completed
}

let _pendingReturnUrl: string | null = null

export function getPendingReturnUrl(): string | null {
  return _pendingReturnUrl
}

export function setPendingReturnUrl(url: string | null): void {
  _pendingReturnUrl = url
}
