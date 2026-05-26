import { create } from 'zustand'

interface TickerState {
  messageIndex: number
  advanceMessage: () => void
  resetTicker: () => void
}

export const useTickerStore = create<TickerState>((set) => ({
  messageIndex: 0,
  advanceMessage: () => set((s) => ({ messageIndex: s.messageIndex + 1 })),
  resetTicker: () => set({ messageIndex: 0 }),
}))
