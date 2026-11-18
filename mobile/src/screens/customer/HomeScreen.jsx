import React, { useCallback, useState } from 'react';
import { View, ScrollView, StyleSheet, ImageBackground, Pressable } from 'react-native';
import { Text, Button, Icon } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../lib/AuthContext';
import { api } from '../../api/client';
import { formatDate } from '../../lib/date';
import { IconTile, SectionTitle, BrandLogo, ScreenHero, HERO_OVERLAP, uiStyles } from '../../components/ui';
import { colors, radius, shadow, spacing, type } from '../../theme/tokens';

const hero = require('../../assets/hero.jpg');

const STEPS = [
  { title: 'Choose your service', desc: 'Select items & care type — wash, iron, dry clean or specialty.', icon: 'gesture-tap' },
  { title: 'We pick up', desc: 'Book a slot or drop at our shop. Free pickup & delivery for members.', icon: 'truck-outline' },
  { title: 'Expert care', desc: 'Specialist cleaning, pressing and a quality check on every item.', icon: 'hand-heart-outline' },
  { title: 'Fresh delivery', desc: 'Track in real-time and receive your wardrobe, immaculate.', icon: 'truck-check-outline' },
];

// The four care types every item is priced for (see ItemCard's
// SERVICE_OPTIONS) — each card just opens the Services catalogue.
const SERVICES = [
  { title: 'Wash', desc: 'Fresh & clean', icon: 'washing-machine', tone: 'cyan' },
  { title: 'Iron', desc: 'Crisp pressing', icon: 'iron-outline', tone: 'navy' },
  { title: 'Wash & Iron', desc: 'Complete care', icon: 'tshirt-crew-outline', tone: 'navy' },
  { title: 'Dry Clean', desc: 'Delicate fabrics', icon: 'hanger', tone: 'cyan' },
];

function firstName(fullName) {
  return (fullName || '').trim().split(/\s+/)[0];
}

export default function HomeScreen({ navigation }) {
  const { profile, isAuthenticated } = useAuth();
  const name = firstName(profile?.full_name);
  const [membership, setMembership] = useState(null);

  // The plan the customer is on right now (active + paid — same lookup the
  // cart prices against). Refetched on focus so subscribing or upgrading on
  // the Plans tab shows up as soon as they come back here.
  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated) {
        setMembership(null);
        return undefined;
      }
      let live = true;
      api.membership.getMyPlanState()
        .then((state) => { if (live) setMembership(state.membership); })
        .catch(() => {});
      return () => { live = false; };
    }, [isAuthenticated])
  );

  return (
    <ScrollView style={uiStyles.screen} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <ScreenHero
        overlap
        eyebrow={name ? 'Welcome back' : 'Welcome to T2 Laundry'}
        title={name ? `Hi, ${name} 👋` : 'Fresh starts here'}
        right={
          <View style={styles.logoBadge}>
            <BrandLogo size={40} />
          </View>
        }
      />

      <ImageBackground source={hero} style={styles.hero} imageStyle={styles.heroImage}>
        <View style={styles.heroScrim} />
        <View style={styles.heroBody}>
          <View style={styles.heroTag}>
            <Icon source="star-four-points" size={12} color={colors.navy} />
            <Text style={styles.heroTagText}>Premium garment care</Text>
          </View>
          <Text style={styles.heroTitle}>Fresh clothes,{'\n'}delivered to your door.</Text>
          <Text style={styles.heroSubtitle}>Wash, iron, dry clean and specialty care — booked in seconds, tracked in real time.</Text>
          <Button
            mode="contained"
            icon="calendar-clock"
            onPress={() => navigation.navigate('Services')}
            buttonColor={colors.cyan}
            textColor={colors.navy}
            style={[uiStyles.btn, styles.heroCta]}
            contentStyle={uiStyles.btnContent}
            labelStyle={uiStyles.btnLabel}>
            Schedule Pickup
          </Button>
        </View>
      </ImageBackground>

      <View style={styles.quickRow}>
        <Pressable style={({ pressed }) => [styles.quickCard, pressed && styles.pressed]} onPress={() => navigation.navigate('Services')} accessibilityRole="button">
          <IconTile icon="basket-outline" size={40} />
          <View style={styles.flex}>
            <Text style={type.h3}>Order now</Text>
            <Text style={type.small}>Build your basket</Text>
          </View>
        </Pressable>
        <Pressable style={({ pressed }) => [styles.quickCard, pressed && styles.pressed]} onPress={() => navigation.navigate('Track')} accessibilityRole="button">
          <IconTile icon="map-marker-path" size={40} tone="navy" />
          <View style={styles.flex}>
            <Text style={type.h3}>Track order</Text>
            <Text style={type.small}>Live status</Text>
          </View>
        </Pressable>
      </View>

      <SectionTitle
        title="Our services"
        subtitle="Expert care for every fabric"
        style={styles.sectionGap}
        right={<Text style={styles.link} onPress={() => navigation.navigate('Services')}>See all</Text>}
      />
      <View style={styles.serviceGrid}>
        {SERVICES.map((s) => (
          <Pressable
            key={s.title}
            style={({ pressed }) => [styles.serviceCard, pressed && styles.pressed]}
            onPress={() => navigation.navigate('Services')}
            accessibilityRole="button"
            accessibilityLabel={s.title}>
            <IconTile icon={s.icon} size={48} tone={s.tone} />
            <Text style={[type.h3, styles.serviceTitle]}>{s.title}</Text>
            <Text style={type.small}>{s.desc}</Text>
            <View style={styles.serviceArrow}>
              <Icon source="arrow-right" size={16} color={colors.navy} />
            </View>
          </Pressable>
        ))}
      </View>

      {membership ? (
        <View style={styles.memberBanner}>
          <IconTile icon="crown" size={48} tone="gold" />
          <View style={styles.flex}>
            <Text style={styles.memberEyebrow}>Your current plan</Text>
            <Text style={styles.memberTitle} numberOfLines={1}>{membership.plan_name}</Text>
            {!!membership.end_date && <Text style={styles.memberText}>Valid till {formatDate(membership.end_date)}</Text>}
          </View>
          <View style={styles.memberStats}>
            <Text style={styles.memberStat}>
              <Text style={styles.memberStatValue}>{membership.bookings_used ?? 0}/{membership.bookings_allowed ?? 0}</Text> bookings
            </Text>
            <Text style={styles.memberStat}>
              <Text style={styles.memberStatValue}>{membership.items_used ?? 0}/{membership.items_allowed ?? 0}</Text> items used
            </Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.memberCta, pressed && styles.pressed]}
            onPress={() => navigation.navigate('Subscription')}
            accessibilityRole="button"
            accessibilityLabel="Upgrade plan">
            <Icon source="arrow-up-circle-outline" size={18} color={colors.navy} />
            <Text style={styles.memberCtaText}>Upgrade plan</Text>
            <Icon source="chevron-right" size={18} color={colors.navy} />
          </Pressable>
        </View>
      ) : (
        <Pressable style={({ pressed }) => [styles.memberBanner, pressed && styles.pressed]} onPress={() => navigation.navigate('Subscription')} accessibilityRole="button">
          <IconTile icon="crown" size={48} tone="gold" />
          <View style={styles.flex}>
            <Text style={styles.memberTitle}>Become a T2 member</Text>
            <Text style={styles.memberText}>Free pickup & delivery, priority booking and more.</Text>
          </View>
          <View style={styles.memberCta}>
            <Text style={styles.memberCtaText}>See membership plans</Text>
            <Icon source="chevron-right" size={18} color={colors.navy} />
          </View>
        </Pressable>
      )}

      <Text style={[type.caption, styles.eyebrow]}>The T2 Standard</Text>
      <Text style={type.h2}>A transparent, four-step ritual.</Text>
      <View style={styles.steps}>
        {STEPS.map((s, i) => (
          <View key={s.title} style={styles.stepRow}>
            <View style={styles.stepRail}>
              <View style={styles.stepDot}>
                <Icon source={s.icon} size={18} color={colors.cyanDark} />
              </View>
              {i < STEPS.length - 1 && <View style={styles.stepLine} />}
            </View>
            <View style={styles.stepBody}>
              <Text style={styles.stepNumber}>STEP {String(i + 1).padStart(2, '0')}</Text>
              <Text style={type.h3}>{s.title}</Text>
              <Text style={[type.small, styles.stepDesc]}>{s.desc}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: spacing.lg, paddingBottom: 40 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  logoBadge: { width: 54, height: 54, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },

  hero: { marginTop: -HERO_OVERLAP, borderRadius: radius.xxl, overflow: 'hidden', minHeight: 300, justifyContent: 'flex-end', ...shadow.raised },
  heroImage: { borderRadius: radius.xxl },
  heroScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(14,35,70,0.68)' },
  heroBody: { padding: spacing.xl },
  heroTag: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: colors.gold, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  heroTagText: { fontSize: 11, fontWeight: '800', color: colors.navy, letterSpacing: 0.3 },
  heroTitle: { color: '#fff', fontSize: 27, lineHeight: 33, fontWeight: '800', marginTop: spacing.md },
  heroSubtitle: { color: colors.onDarkMuted, fontSize: 13, lineHeight: 19, marginTop: spacing.sm },
  heroCta: { marginTop: spacing.lg },

  quickRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  quickCard: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, ...shadow.card },

  sectionGap: { marginTop: spacing.xxl },
  link: { color: colors.cyanDark, fontWeight: '700', fontSize: 13 },
  serviceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  serviceCard: { width: '47.8%', flexGrow: 1, backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, ...shadow.card },
  serviceTitle: { marginTop: spacing.md, marginBottom: 2 },
  serviceArrow: { position: 'absolute', top: spacing.lg, right: spacing.lg, width: 28, height: 28, borderRadius: 14, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },

  memberBanner: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.md, backgroundColor: colors.navy, borderRadius: radius.xl, padding: spacing.lg, marginTop: spacing.xxl, ...shadow.raised },
  memberEyebrow: { color: colors.gold, fontSize: 11, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },
  memberTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  memberStats: { flexDirection: 'row', width: '100%', gap: spacing.lg, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.12)', paddingTop: spacing.md },
  memberStat: { color: colors.onDarkMuted, fontSize: 12 },
  memberStatValue: { color: '#fff', fontWeight: '800', fontSize: 14 },
  memberText: { color: colors.onDarkMuted, fontSize: 12, marginTop: 2 },
  memberCta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', backgroundColor: colors.gold, borderRadius: radius.md, paddingVertical: 10, gap: 4 },
  memberCtaText: { color: colors.navy, fontWeight: '800', fontSize: 13 },

  eyebrow: { color: colors.cyanDark, marginTop: spacing.xxxl, marginBottom: 4 },
  steps: { marginTop: spacing.lg, backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  stepRow: { flexDirection: 'row', gap: spacing.md },
  stepRail: { alignItems: 'center', width: 40 },
  stepDot: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.cyanSoft, alignItems: 'center', justifyContent: 'center' },
  stepLine: { flex: 1, width: 2, backgroundColor: colors.border, marginVertical: 4 },
  stepBody: { flex: 1, paddingBottom: spacing.lg },
  stepNumber: { fontSize: 10, fontWeight: '800', color: colors.textFaint, letterSpacing: 1, marginTop: 2 },
  stepDesc: { marginTop: 2 },
});
