// src/theme/index.ts
import { COLORS } from './colors';
import { SPACING, RADIUS, SHADOWS } from './spacing';
import { TYPOGRAPHY } from './typography';

export const theme = {
  colors: COLORS,
  spacing: SPACING,
  radius: RADIUS,
  shadows: SHADOWS,
  typography: TYPOGRAPHY,
};

export type ThemeType = typeof theme;
export { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY };
