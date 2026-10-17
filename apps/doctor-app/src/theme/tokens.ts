/**
 * MYDR24 design tokens.
 *
 * IMPORTANT: these values were taken visually from the shared MyDoctor24 storyboard
 * canvases. The Figma files could not be opened (login required), so they are NOT verified
 * Figma tokens. Replace them with the exact Figma values once access is available.
 * Every screen reads colours/spacing only from here, so a swap updates the whole app.
 */
export const colors = {
  primary: '#1A5FD6',
  primaryDark: '#1849A9',
  primarySoft: '#EAF1FF',
  bg: '#F4F7FC',
  card: '#FFFFFF',
  border: '#E4E7EC',
  text: '#101828',
  textMuted: '#667085',
  textSoft: '#98A2B3',
  white: '#FFFFFF',

  // Severity / event classes
  critical: '#D92D20',
  criticalSoft: '#FEE4E2',
  urgent: '#F79009',
  urgentSoft: '#FEF0C7',
  advisory: '#CA8504',
  advisorySoft: '#FEF7C3',
  technical: '#2E90FA',
  technicalSoft: '#D1E9FF',
  stable: '#12B76A',
  stableSoft: '#D1FADF',
  delivery: '#7A5AF8',
  deliverySoft: '#EBE9FE',

  // Freshness
  stale: '#98A2B3',
} as const;

export const spacing = { xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 } as const;
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;

export const type = {
  h1: { fontSize: 22, fontWeight: '700' as const, color: colors.text },
  h2: { fontSize: 18, fontWeight: '700' as const, color: colors.text },
  h3: { fontSize: 15, fontWeight: '600' as const, color: colors.text },
  body: { fontSize: 14, color: colors.text },
  small: { fontSize: 12, color: colors.textMuted },
  tiny: { fontSize: 10.5, color: colors.textMuted },
  vital: { fontSize: 22, fontWeight: '700' as const, color: colors.text },
};

export const shadow = {
  shadowColor: '#101828',
  shadowOpacity: 0.06,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
};

/** Minimum touch target (WCAG / platform guidance). */
export const TOUCH = 48;
