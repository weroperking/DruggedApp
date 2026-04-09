export const colors = {
  primary: {
    green: '#58CC02',
    darkGreen: '#46A302',
  },
  neutral: {
    white: '#FFFFFF',
    offWhite: '#F7F7F7',
    gray: '#AFAFAF',
    charcoal: '#3C3C3C',
    black: '#1C1C1C',
  },
  accent: {
    blue: '#1CB0F6',
    red: '#FF4B4B',
    yellow: '#FFC800',
    purple: '#CE82FF',
  },
  border: {
    light: '#E5E5E5',
    dark: '#8F8F8F',
  },
};

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: colors.neutral.black,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.neutral.black,
  },
  h3: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.neutral.charcoal,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    color: colors.neutral.charcoal,
  },
  small: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: colors.neutral.gray,
  },
  button: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.neutral.white,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 10,
  md: 12,
  lg: 16,
  xl: 20,
  full: 100,
};

export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 0,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 0,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 0,
  },
};