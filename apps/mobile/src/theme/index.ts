/**
 * PROOF Design Tokens
 *
 * Anti-Instagram. Anti-polish. Deliberately minimal.
 * Brutalist design meets raw authenticity.
 */

export const colors = {
  // Core palette — almost monochrome
  black: '#000000',
  white: '#FFFFFF',
  offWhite: '#F5F5F5',
  gray100: '#E8E8E8',
  gray200: '#D0D0D0',
  gray300: '#A0A0A0',
  gray400: '#707070',
  gray500: '#505050',
  gray600: '#333333',
  gray700: '#1A1A1A',

  // Functional
  background: '#000000',
  surface: '#0A0A0A',
  surfaceElevated: '#141414',
  text: '#FFFFFF',
  textSecondary: '#A0A0A0',
  textMuted: '#505050',

  // Verified / trust
  verified: '#FFFFFF',
  verifiedBg: '#1A1A1A',

  // Reactions — muted, not attention-grabbing
  feltThat: '#C8C8C8',
  respect: '#C8C8C8',
  realOne: '#C8C8C8',
  reactionActive: '#FFFFFF',

  // Capture
  captureRing: '#FFFFFF',
  captureRingRecording: '#FF3B30',
  liveIndicator: '#FF3B30',

  // Alerts
  danger: '#FF3B30',
  warning: '#FF9500',

  // Borders
  border: '#1A1A1A',
  borderLight: '#2A2A2A',
} as const;

export const typography = {
  // Clean sans-serif. Nothing fancy. Raw.
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
    mono: 'Courier',
  },
  fontSize: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    xxl: 32,
    hero: 48,
  },
  lineHeight: {
    tight: 1.1,
    normal: 1.4,
    relaxed: 1.6,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    heavy: '800' as const,
  },
} as const;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const borderRadius = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  full: 9999,
} as const;

export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
} as const;

export type Theme = typeof theme;
export default theme;
