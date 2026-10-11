import { TextStyle, Platform } from 'react-native';

export const FONTS = {
  regular: Platform.select({ web: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif", default: 'PlusJakartaSans_400Regular' }) as string,
  medium: Platform.select({ web: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif", default: 'PlusJakartaSans_500Medium' }) as string,
  semiBold: Platform.select({ web: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif", default: 'PlusJakartaSans_600SemiBold' }) as string,
  bold: Platform.select({ web: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif", default: 'PlusJakartaSans_700Bold' }) as string,
};

export const TYPOGRAPHY: Record<string, TextStyle> = {
  displayLg: {
    fontFamily: FONTS.bold,
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  titleLg: {
    fontFamily: FONTS.bold,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  titleMd: {
    fontFamily: FONTS.semiBold,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
  titleSm: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  headlineLg: {
    fontFamily: FONTS.semiBold,
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
  },
  headlineMd: {
    fontFamily: FONTS.semiBold,
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
  },
  headlineSm: {
    fontFamily: FONTS.semiBold,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
  bodyLg: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  bodyMd: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  bodySm: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 18,
  },
  labelLg: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  labelMd: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  labelSm: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  caption: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
};

export type TypographyType = typeof TYPOGRAPHY;
