// src/theme/colors.ts
// Single source of truth aligned with DESIGN.md
export const COLORS = {
  // Brand Primary (Vibrant Coral)
  primary: '#FF6B6B',
  primaryDark: '#E05353',
  primaryLight: '#FFE8E8',
  onPrimary: '#FFFFFF',
  primaryContainer: '#FFE8E8',
  onPrimaryContainer: '#B73232',
  primaryFixedDim: '#FFA8A8',

  // Secondary (Energetic Teal)
  secondary: '#4ECDC4',
  secondaryDark: '#3AB5AC',
  secondaryLight: '#E0F7F5',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#E0F7F5',
  onSecondaryContainer: '#166B64',

  // Tertiary & Currency (Sun Amber Gold / Xu Token)
  tertiary: '#FFD166',
  onTertiary: '#4B3600',
  tertiaryContainer: '#FFF8E1',
  onTertiaryContainer: '#8C6500',
  accentGold: '#FFD166',
  accent: '#FFD166',

  // Canvas & Background (Clean Warm Canvas)
  background: '#F8F9FA',
  onBackground: '#1A1D20',

  // Surfaces & Cards
  surface: '#FFFFFF',
  card: '#FFFFFF',
  onSurface: '#1A1D20',
  surfaceDim: '#F1F3F5',
  surfaceVariant: '#E9ECEF',
  onSurfaceVariant: '#495057',
  
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#F8F9FA',
  surfaceContainer: '#F1F3F5',
  surfaceContainerHigh: '#E9ECEF',
  surfaceContainerHighest: '#DEE2E6',
  surfaceSubtle: '#F1F3F5',

  // Feedback & Status
  success: '#2EC4B6',
  warning: '#FF9F1C',
  error: '#E63946',
  onError: '#FFFFFF',
  errorContainer: '#FFE5E7',
  onErrorContainer: '#9E1B26',

  // Borders & Text Hierarchy
  outline: '#6C757D',
  outlineVariant: '#E2E8F0',
  text: '#1A1D20',
  textMuted: '#6C757D',
  textDim: '#ADB5BD',
  border: 'rgba(0, 0, 0, 0.08)',
  
  // Shadows
  shadowColor: 'rgba(255, 107, 107, 0.12)',
};

export type ColorsType = typeof COLORS;

