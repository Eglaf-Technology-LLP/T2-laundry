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

// Navy block that continues the navigation header into the top of a screen,
// shared by every tab so they all open the same way. It sits inside the
// screen's padded scroll content and bleeds out to the edges with negative
// margins (`bleed` = that padding). `overlap` leaves extra room at the
// bottom for the next element to sit across its edge (marginTop: -OVERLAP).
export const HERO_OVERLAP = 28;

//
// `extend` paints navy above the block for scroll screens, where overscroll /
// iOS bounce would otherwise show a light gap under the navigation header
// (the ScrollView clips it the rest of the time). Pass extend={false} when
// the hero is NOT inside a scroll view — unclipped, it would paint over the
// navigation header and hide its title.
export function ScreenHero({ eyebrow, title, subtitle, icon, right, children, overlap = false, extend = true, bleed = spacing.lg, style }) {
  return (
    <View style={[styles.hero, { marginHorizontal: -bleed, marginTop: -bleed, paddingHorizontal: bleed + 4 }, overlap && styles.heroOverlap, style]}>
      {extend && <View style={styles.heroExtender} pointerEvents="none" />}
      {(!!title || !!icon || !!right) && (
        <View style={styles.heroRow}>
          <View style={styles.flex}>
            {!!eyebrow && <Text style={[type.caption, styles.heroEyebrow]}>{eyebrow}</Text>}
            {!!title && <Text style={styles.heroTitle}>{title}</Text>}
            {!!subtitle && <Text style={styles.heroSub}>{subtitle}</Text>}
          </View>
          {right}
          {!right && !!icon && (
            <View style={styles.heroIcon}>
              <Icon source={icon} size={26} color={colors.cyan} />
            </View>
          )}
        </View>
      )}
      {children}
    </View>
  );
}

// Shared top block for the login / signup / admin sign-in screens: a navy
// hero with the logo; the form card below overlaps its bottom edge.
export function AuthHeader({ title, subtitle, badge, bleed = spacing.xxl }) {
  return (
    <ScreenHero overlap bleed={bleed} style={styles.authHero}>
      <View style={styles.authHeader}>
        <View style={styles.logoRing}>
          <BrandLogo size={56} />
        </View>
        {!!badge && <Text style={[type.caption, styles.authBadge]}>{badge}</Text>}
        <Text style={[styles.heroTitle, styles.center]}>{title}</Text>
        {!!subtitle && <Text style={[styles.heroSub, styles.center]}>{subtitle}</Text>}
      </View>
    </ScreenHero>
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
  hero: { backgroundColor: colors.navy, paddingTop: spacing.sm, paddingBottom: spacing.xxl, borderBottomLeftRadius: radius.xxl, borderBottomRightRadius: radius.xxl, marginBottom: spacing.lg },
  heroOverlap: { paddingBottom: HERO_OVERLAP + spacing.lg, marginBottom: 0 },
  heroExtender: { position: 'absolute', left: 0, right: 0, top: -800, height: 800, backgroundColor: colors.navy },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  heroEyebrow: { color: colors.gold, marginBottom: 4 },
  heroTitle: { color: '#fff', fontSize: 22, lineHeight: 28, fontWeight: '800' },
  heroSub: { color: colors.onDarkMuted, fontSize: 13, lineHeight: 19, marginTop: 4 },
  heroIcon: { width: 52, height: 52, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  authHero: { paddingTop: spacing.lg },
  authHeader: { alignItems: 'center' },
  logoRing: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md, ...shadow.raised },
  authBadge: { color: colors.cyan, marginBottom: 6 },
});
