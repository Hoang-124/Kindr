// src/theme/spacing.ts
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  containerPadding: 20,
  cardGap: 12,
};

export const RADIUS = {
  sm: 8,
  default: 16,
  md: 20,
  lg: 28,
  xl: 40,
  full: 9999,
};

export const SHADOWS = {
  soft: {
    shadowColor: '#3a6758',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  ambient: {
    shadowColor: '#3a6758',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
  },
  card: {
    shadowColor: '#3a6758',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  btn: {
    shadowColor: '#3a6758',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  }
};
