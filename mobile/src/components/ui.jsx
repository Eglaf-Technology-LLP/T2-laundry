import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { colors, radius, shadow, spacing, type, ORDER_STATUS } from '../theme/tokens';

const logo = require('../assets/logo.png');

// Small presentational building blocks shared across screens, so cards,
// section headings, empty states and status pills look identical everywhere
// instead of each screen re-styling its own copy.

export function SurfaceCard({ style, children, padded = true }) {
  return <View style={[styles.card, padded && styles.cardPadded, style]}>{children}</View>;
}

export function SectionTitle({ title, subtitle, right, style }) {
  return (
    <View style={[styles.sectionRow, style]}>
      <View style={styles.flex}>
        <Text style={type.h3}>{title}</Text>
        {!!subtitle && <Text style={[type.small, styles.sectionSub]}>{subtitle}</Text>}
      </View>
      {right}
    </View>
  );
}

export function IconTile({ icon, size = 44, tone = 'cyan', style }) {
  const tones = {
    cyan: [colors.cyanSoft, colors.cyanDark],
    navy: [colors.navySoft, colors.navy],
    gold: [colors.goldSoft, colors.goldDark],
    green: [colors.successSoft, colors.success],
    dark: ['rgba(255,255,255,0.14)', '#fff'],
  };
  const [bg, fg] = tones[tone] || tones.cyan;
  return (
    <View style={[styles.iconTile, { width: size, height: size, borderRadius: size * 0.32, backgroundColor: bg }, style]}>
      <Icon source={icon} size={size * 0.52} color={fg} />
    </View>
  );
}

export function EmptyState({ icon, title, message, children, style }) {
  return (
    <View style={[styles.empty, style]}>
      <View style={styles.emptyHalo}>
        <IconTile icon={icon} size={72} tone="navy" />
      </View>
      <Text style={[type.h2, styles.center, styles.emptyTitle]}>{title}</Text>
      {!!message && <Text style={[type.body, styles.center, styles.emptyMsg]}>{message}</Text>}
      {children}
    </View>
  );
}

const STATUS_TONES = {
  pending: [colors.warningSoft, colors.warning],
  delivered: [colors.successSoft, colors.success],
  cancelled: [colors.errorSoft, colors.error],
  paid: [colors.successSoft, colors.success],
  active: [colors.successSoft, colors.success],
  unpaid: [colors.warningSoft, colors.warning],
};

export function StatusPill({ status, label }) {
  const [bg, fg] = STATUS_TONES[status] || [colors.cyanSoft, colors.cyanDark];
  const text = label || ORDER_STATUS[status]?.label || String(status || '').replace(/_/g, ' ');
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.pillText, { color: fg }]}>{text}</Text>
    </View>
  );
}

export function BrandLogo({ size = 64, style }) {
  return <Image source={logo} style={[{ width: size * 0.855, height: size }, style]} resizeMode="contain" />;
}

// Shared top block for the login / signup / admin sign-in screens.
export function AuthHeader({ title, subtitle, badge }) {
  return (
    <View style={styles.authHeader}>
      <View style={styles.logoRing}>
        <BrandLogo size={64} />
      </View>
      {!!badge && <Text style={[type.caption, styles.authBadge]}>{badge}</Text>}
      <Text style={[type.h1, styles.center]}>{title}</Text>
      {!!subtitle && <Text style={[type.body, styles.center, styles.authSub]}>{subtitle}</Text>}
    </View>
  );
}

export const uiStyles = StyleSheet.create({
  // Screen-level background shared by every scroll container.
  screen: { flex: 1, backgroundColor: colors.bg },
  btn: { borderRadius: radius.md },
  btnContent: { height: 50 },
  btnLabel: { fontSize: 15, fontWeight: '700', letterSpacing: 0.2 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.errorSoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    marginTop: spacing.sm,
  },
  errorText: { color: colors.error, fontSize: 13, flex: 1 },
});

export function ErrorBanner({ message, style }) {
  if (!message) return null;
  return (
    <View style={[uiStyles.errorBox, style]}>
      <Icon source="alert-circle-outline" size={18} color={colors.error} />
      <Text style={uiStyles.errorText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  card: { backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, ...shadow.card },
  cardPadded: { padding: spacing.lg },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  sectionSub: { marginTop: 2 },
  iconTile: { alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', justifyContent: 'center', padding: spacing.xxl },
  emptyHalo: { padding: 14, borderRadius: 60, backgroundColor: 'rgba(14,35,70,0.04)', marginBottom: spacing.lg },
  emptyTitle: { marginTop: spacing.xs },
  emptyMsg: { marginTop: spacing.sm, color: colors.textMuted, maxWidth: 300 },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, alignSelf: 'flex-start' },
  pillText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  authHeader: { alignItems: 'center', marginBottom: spacing.xxl },
  logoRing: { width: 104, height: 104, borderRadius: 52, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg, ...shadow.card },
  authBadge: { color: colors.cyanDark, marginBottom: 6 },
  authSub: { marginTop: 6, color: colors.textMuted },
});
