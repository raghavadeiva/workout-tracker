// Design Tokens — Light Theme Only (revamped from scratch per ui-ux-pro-max skill)
// Product: Productivity Fitness Workout Tool | Style: Vibrant & Block-based

// Z-index scale (per ui-ux-pro-max: use z-* scale, no arbitrary values)
export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  overlay: 30,
  modal: 40,
  toast: 50,
} as const;

// Color tokens — light theme only
// Primary: energy orange (F97316) per ui-ux-pro-max recommendation
// Accent: success green (22C55E) for completed sets / positive actions
export const colors = {
  // Brand
  primary: {
    DEFAULT: '#F97316', // energy orange
    hover: '#EA580C',
    active: '#C2410C',
    foreground: '#FFFFFF',
  },
  accent: {
    DEFAULT: '#22C55E', // success green
    hover: '#16A34A',
    active: '#15803D',
    foreground: '#FFFFFF',
  },
  destructive: {
    DEFAULT: '#EF4444',
    hover: '#DC2626',
    foreground: '#FFFFFF',
  },

  // Neutral scale (light theme)
  background: '#FAFAFA', // card bg from design system
  surface: '#FFFFFF', // main card/surface
  elevated: '#FFFFFF', // elevated cards (with shadow)
  border: '#E5E7EB', // Tailwind gray-200
  muted: '#F3F4F6', // Tailwind gray-100
  mutedText: '#9CA3AF', // Tailwind gray-400
  text: {
    primary: '#111827', // Tailwind gray-900
    secondary: '#4B5563', // Tailwind gray-600
    tertiary: '#6B7280', // Tailwind gray-500
  },

  // Shadow (Apple Design §3 — ambient key)
  shadow: {
    elevated: '0px 1px 3px 0px rgba(0, 0, 0, 0.10), 0px 1px 2px 0px rgba(0, 0, 0, 0.06)',
    floating: '0px 4px 6px -1px rgba(0, 0, 0, 0.10), 0px 2px 4px -1px rgba(0, 0, 0, 0.06)',
    popover: '0px 10px 15px -3px rgba(0, 0, 0, 0.10), 0px 4px 6px -2px rgba(0, 0, 0, 0.05)',
  },
} as const;

// Spacing — 4/8dp rhythm per ui-ux-pro-max guidelines
export const spacing = {
  xs: '0.25rem', // 4
  sm: '0.5rem', // 8
  md: '0.75rem', // 12
  base: '1rem', // 16
  lg: '1.25rem', // 20
  xl: '1.5rem', // 24
  xxl: '2rem', // 32
  xxxl: '3rem', // 48
} as const;

// Border radius
export const radius = {
  sm: '0.375rem', // 6
  base: '0.5rem', // 8
  lg: '0.75rem', // 12
  xl: '1rem', // 16
  xl2: '1.25rem', // 20
  full: '9999px',
} as const;

// Touch targets (Apple Design §4 — minimum 44px)
export const touchTarget = {
  minimum: '44px',
  preferred: '48px',
  icon: '44px',
} as const;

// Typography (Barlow + Barlow Condensed per design system)
export const typography = {
  fontFamily: {
    body: "'Barlow', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    display: "'Barlow Condensed', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    mono: "'SF Mono', 'Fira Code', 'Fira Mono', 'Roboto Mono', monospace",
  },
  fontSize: {
    xs: '0.75rem', // 12
    sm: '0.875rem', // 14
    base: '1rem', // 16
    lg: '1.125rem', // 18
    xl: '1.25rem', // 20
    xl2: '1.5rem', // 24
    xl3: '1.75rem', // 28
    xl4: '2.25rem', // 36
    xl5: '3rem', // 48
  },
} as const;

// Animation — spring physics (Apple Design §4 — critically damped)
export const motion = {
  spring: {
    default: { type: 'spring' as const, damping: 1.0, stiffness: 300 },
    momentum: { type: 'spring' as const, damping: 0.8, stiffness: 100 },
    snappy: { type: 'spring' as const, damping: 0.8, stiffness: 400 },
  },
  duration: {
    instant: 150,
    fast: 200,
    normal: 300,
    slow: 500,
  },
} as const;

// Tab bar
export const tabBar = {
  height: 49,
} as const;

// Export as a flat token object for CSS variable generation
export const tokens = {
  colors,
  spacing,
  radius,
  touchTarget,
  typography,
  motion,
  zIndex,
  tabBar,
} as const;
