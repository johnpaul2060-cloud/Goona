export const Colors = {
  primary: '#2E7D32',
  primaryHover: '#1B5E20',
  accent: '#AEEA00',
  background: '#F8FAF7',
  card: '#FFFFFF',
  panelLight: '#F0FDF4',
  textPrimary: '#1B1B1B',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  success: '#16A34A',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#2563EB',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  tabIconDefault: '#687076',
  tabIconSelected: '#2E7D32',
}

export const Gradients = {
  hero: ['#2E7D32', '#1B5E20'] as const,
  glass: ['rgba(255,255,255,0.72)', 'rgba(248,250,252,0.48)'] as const,
}

export const Spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32,
  section: 24, cardPadding: 18, pagePadding: 20,
}

export const BorderRadius = {
  sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 30, full: 999,
}

export const Shadows = {
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 2 },
  lg: { shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 18 }, shadowOpacity: 0.25, shadowRadius: 40, elevation: 8 },
}
