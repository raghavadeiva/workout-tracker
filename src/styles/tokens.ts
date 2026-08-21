/**
 * Phase 11.1 — Design System Foundation
 *
 * Typed design tokens for the Hypertrophy workout tracker.
 * Based on Apple's SF Pro design system, translated for the web.
 *
 * Usage:
 *   import { colors, spacing, radius, shadows, motion, typography } from '../styles/tokens';
 *   or reference CSS variables in stylesheets:
 *   var(--color-background), var(--spacing-4), etc.
 */

// ─── Colors ────────────────────────────────────────────────────────────────

export const colors = {
  // Primary
  primary: '#007AFF',
  'primary-hover': '#0062CC',
  'primary-active': '#004A99',

  // System colors (Apple-style semantic names)
  'system-red': '#FF3B30',
  'system-green': '#34C759',
  'system-orange': '#FF9500',

  // Grayscale
  'gray-50': '#FAFAFA',
  'gray-100': '#F5F5F7',
  'gray-200': '#E5E5E7',
  'gray-300': '#D1CECE',
  'gray-400': '#AEAEB2',
  'gray-500': '#8E8E93',
  'gray-600': '#86868B',
  'gray-700': '#6E6E73',
  'gray-800': '#636368',
  'gray-900': '#38383A',

  // Light mode surfaces
  background: '#F8F8F7',
  surface: '#FFFFFF',
  'surface-secondary': '#F2F2F7',
  separator: '#D1CECE',

  // Text
  'text-primary': '#1C1C1E',
  'text-secondary': '#6E6E73',
  'text-tertiary': '#AEAEB2',
  'text-on-primary': '#FFFFFF',

  // Dark mode surfaces (reference only — applied via CSS vars)
  'dark-background': '#000000',
  'dark-surface': '#1C1C1E',
  'dark-surface-secondary': '#2C2C2E',
  'dark-separator': '#38383A',
  'dark-text-primary': '#E0E0E0',
  'dark-text-secondary': '#A1A1A5',
  'dark-text-tertiary': '#86868B',
} as const;

// ─── Spacing (4px grid) ────────────────────────────────────────────────────

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
} as const;

// ─── Border Radius ─────────────────────────────────────────────────────────

export const radius = {
  sm: 12,
  DEFAULT: 16,
  lg: 20,
  xl: 24,
  full: 9999,
} as const;

// ─── Shadows ────────────────────────────────────────────────────────────────

export const shadows = {
  // Subtle elevation (cards, form fields)
  elevated: '0 1px 3px rgba(0, 0, 0, 0.05), 0 2px 8px rgba(0, 0, 0, 0.08)',
  // Floating chrome (headers, tab bar, timer banner)
  floating: '0 1px 3px rgba(0, 0, 0, 0.05), 0 4px 12px rgba(0, 0, 0, 0.08)',
  // Stronger elevation (dropdowns, modals)
  popover: '0 4px 20px rgba(0, 0, 0, 0.12), 0 8px 24px rgba(0, 0, 0, 0.08)',
} as const;

// ─── Motion (springs) ────────────────────────────────────────────────────

export const motion = {
  // Default: critically damped, no overshoot
  default: { type: 'spring' as const, damping: 1.0, stiffness: 300, restDelta: 0.5 },
  // Momentum-driven (flicks, throws): slight bounce
  momentum: { type: 'spring' as const, damping: 0.8, stiffness: 300, restDelta: 0.5 },
  // Snappy micro-interactions (button press, timer tick)
  snappy: { type: 'spring' as const, damping: 1.0, stiffness: 600, restDelta: 0.5 },
  // Stagger delay between sequential elements
  staggerDelay: 16, // ms
} as const;

// ─── Typography ────────────────────────────────────────────────────────────

export const typography = {
  // Heading / display
  display: {
    fontSize: '2rem', // 32px clamped in CSS
    fontWeight: 700,
    lineHeight: 1.05,
    letterSpacing: '-0.02em',
    fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
  },
  largeTitle: {
    fontSize: '1.375rem', // 22px
    fontWeight: 700,
    lineHeight: 1.15,
    letterSpacing: '-0.01em',
    fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
  },
  title: {
    fontSize: '1.125rem', // 18px
    fontWeight: 600,
    lineHeight: 1.2,
    letterSpacing: '-0.005em',
    fontFamily: 'SF Pro Text, -apple-system, BlinkMacSystemFont, sans-serif',
  },
  // Body
  body: {
    fontSize: '1.0625rem', // 17px
    fontWeight: 400,
    lineHeight: 1.45,
    letterSpacing: '0',
    fontFamily: 'SF Pro Text, -apple-system, BlinkMacSystemFont, sans-serif',
  },
  bodyMedium: {
    fontSize: '1.0625rem',
    fontWeight: 500,
    lineHeight: 1.45,
    letterSpacing: '0',
    fontFamily: 'SF Pro Text, -apple-system, BlinkMacSystemFont, sans-serif',
  },
  callout: {
    fontSize: '0.9375rem', // 15px
    fontWeight: 400,
    lineHeight: 1.4,
    letterSpacing: '0.01em',
    fontFamily: 'SF Pro Text, -apple-system, BlinkMacSystemFont, sans-serif',
  },
  caption: {
    fontSize: '0.8125rem', // 13px
    fontWeight: 400,
    lineHeight: 1.35,
    letterSpacing: '0.02em',
    fontFamily: 'SF Pro Text, -apple-system, BlinkMacSystemFont, sans-serif',
  },
  captionMedium: {
    fontSize: '0.8125rem',
    fontWeight: 500,
    lineHeight: 1.35,
    letterSpacing: '0.02em',
    fontFamily: 'SF Pro Text, -apple-system, BlinkMacSystemFont, sans-serif',
  },
  // Mono (numbers: sets, weight, reps, timer)
  mono: {
    fontSize: '1.0625rem',
    fontWeight: 400,
    lineHeight: 1.45,
    letterSpacing: '0',
    fontFamily: 'SF Mono, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },
  monoLarge: {
    fontSize: '1.25rem', // 20px
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: '0',
    fontFamily: 'SF Mono, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },
} as const;

// ─── Touch Targets ─────────────────────────────────────────────────────────

export const touchTargets = {
  minimum: 44,
  preferred: 48,
} as const;

// ─── Z-index scale ─────────────────────────────────────────────────────────

export const zIndex = {
  base: 0,
  dropdown: 40,
  sticky: 40,
  modal: 50,
  popover: 50,
  tooltip: 60,
} as const;

// ─── Export everything as a default for convenient imports ─────────────────

export default {
  colors,
  spacing,
  radius,
  shadows,
  motion,
  typography,
  touchTargets,
  zIndex,
} as const;
