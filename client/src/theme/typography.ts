// src/theme/typography.ts
import { TextStyle } from 'react-native';

export const TYPOGRAPHY: Record<string, TextStyle> = {
  displayLg: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  titleLg: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  titleMd: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
  titleSm: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
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
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  bodyMd: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  bodySm: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
  labelLg: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  labelMd: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  labelSm: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15,
  },
  caption: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 14,
  },
};
export type TypographyType = typeof TYPOGRAPHY;
// Helper function to resolve font weights on different platforms if needed
