// src/theme/typography.ts
import { TextStyle } from 'react-native';

export const TYPOGRAPHY: Record<string, TextStyle> = {
  displayLg: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
    letterSpacing: -0.64,
  },
  headlineLg: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
  },
  headlineMd: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
  },
  headlineSm: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
  bodyLg: {
    fontSize: 18,
    fontWeight: '400',
    lineHeight: 28,
  },
  bodyMd: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  bodySm: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  labelLg: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    letterSpacing: 0.14,
  },
  labelSm: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
};
export type TypographyType = typeof TYPOGRAPHY;
// Helper function to resolve font weights on different platforms if needed
