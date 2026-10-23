// Single source of truth for the app's visual language. Screens should pull
// colors/spacing/radii/shadows from here instead of hard-coding hex values,
// so a brand tweak only has to happen in one place.
//
// Palette: navy is the primary brand color (matches the T2 logo), cyan is the
// "fresh" accent for active/progress states, and gold is reserved for
// premium/membership moments so it keeps its meaning.
export const colors = {
  navy: '#0E2346',
  navyLight: '#1C3A6B',
  navySoft: '#E8EDF6',
  cyan: '#06B6D4',
  cyanDark: '#0891B2',
  cyanSoft: '#E0F7FB',
  gold: '#C9A227',
  goldDark: '#9C7A12',
  goldSoft: '#FBF4DF',

  bg: '#F4F7FB',
  surface: '#FFFFFF',
  surfaceMuted: '#F8FAFC',
  border: '#E3E9F1',
  borderStrong: '#CBD5E1',

  text: '#0E2346',
  textBody: '#334155',
  textMuted: '#64748B',
  textFaint: '#94A3B8',
  onDark: '#FFFFFF',
  onDarkMuted: 'rgba(255,255,255,0.72)',

  success: '#059669',
  successSoft: '#D1FAE5',
  error: '#DC2626',
  errorSoft: '#FEE2E2',
  warning: '#D97706',
  warningSoft: '#FEF3C7',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };

export const radius = { sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, pill: 999 };

export const shadow = {
  card: {
    shadowColor: '#0E2346',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  raised: {
    shadowColor: '#0E2346',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 8,
  },
};

export const type = {
  display: { fontSize: 28, lineHeight: 34, fontWeight: '800', color: colors.text },
  h1: { fontSize: 22, lineHeight: 28, fontWeight: '800', color: colors.text },
  h2: { fontSize: 18, lineHeight: 24, fontWeight: '700', color: colors.text },
  h3: { fontSize: 15, lineHeight: 20, fontWeight: '700', color: colors.text },
  body: { fontSize: 14, lineHeight: 20, color: colors.textBody },
  small: { fontSize: 12, lineHeight: 17, color: colors.textMuted },
  caption: { fontSize: 11, lineHeight: 14, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase', color: colors.textFaint },
};

// Order status -> label/icon/tone, shared by tracking, account history and
// anywhere else a status pill is shown.
export const ORDER_STATUS = {
  pending: { label: 'Order Placed', icon: 'clipboard-check-outline' },
  picked_up: { label: 'Picked Up', icon: 'truck-outline' },
  in_facility: { label: 'In Facility', icon: 'washing-machine' },
  quality_check: { label: 'Quality Check', icon: 'shield-check-outline' },
  out_for_delivery: { label: 'Out for Delivery', icon: 'truck-fast-outline' },
  delivered: { label: 'Delivered', icon: 'check-decagram-outline' },
  cancelled: { label: 'Cancelled', icon: 'close-circle-outline' },
};
