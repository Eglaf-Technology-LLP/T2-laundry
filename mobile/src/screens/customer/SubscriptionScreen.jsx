import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Button, Portal, Modal, ActivityIndicator, Icon } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../lib/AuthContext';
import { api } from '../../api/client';

import { ErrorBanner, IconTile, ScreenHero, HERO_OVERLAP, uiStyles } from '../../components/ui';
import { colors, radius, shadow, spacing, type } from '../../theme/tokens';

const PERKS = [
  { icon: 'truck-fast-outline', label: 'Free pickup' },
  { icon: 'lightning-bolt-outline', label: 'Priority' },
  { icon: 'map-marker-path', label: 'Live tracking' },
];

function PlanCard({ plan, isCurrent, isUpgrade, submitting, onSubscribe, onViewItems }) {
  const featured = plan.popular;
  return (
    <View style={[styles.planCard, featured && styles.planCardFeatured, isCurrent && !featured && styles.planCardCurrent]}>
      <View style={styles.planHead}>
        <IconTile icon={featured ? 'crown' : 'crown-outline'} size={42} tone={featured ? 'gold' : 'navy'} />
        <View style={styles.flex}>
          <Text style={[styles.planName, featured && styles.textWhite]} numberOfLines={1}>{plan.name}</Text>
          {!!plan.tagline && <Text style={[styles.planTagline, featured && styles.textWhiteDim]} numberOfLines={2}>{plan.tagline}</Text>}
        </View>
        {featured && (
          <View style={styles.bestValue}>
            <Icon source="star" size={11} color={colors.navy} />
            <Text style={styles.bestValueText}>Best Value</Text>
          </View>
        )}
      </View>
      <View style={styles.priceRow}>
        <Text style={[styles.planPrice, featured && styles.gold]}>{plan.price}</Text>
        <Text style={[styles.planPeriod, featured && styles.textWhiteDim]}>QAR / {plan.period}</Text>
      </View>
      <View style={[styles.divider, featured && styles.dividerDark]} />
      <View style={styles.featuresList}>
        {(plan.features || []).map((f, i) => (
          <View key={i} style={styles.featureRow}>
            <View style={[styles.check, featured && styles.checkFeatured]}>
              <Icon source="check" size={12} color={featured ? colors.navy : colors.cyanDark} />
            </View>
            <Text style={[styles.feature, featured && styles.textWhiteDim2]}>{f}</Text>
          </View>
        ))}
      </View>
      {isCurrent ? (
        <View style={[styles.currentBadge, featured && styles.currentBadgeFeatured]}>
          <Icon source="check-decagram" size={18} color={featured ? colors.gold : colors.success} />
          <Text style={[styles.currentText, featured && styles.textWhite]}>Your current plan</Text>
        </View>
      ) : (
        <Button
          mode="contained"
          loading={submitting}
          disabled={submitting}
          onPress={onSubscribe}
          buttonColor={featured ? colors.gold : colors.navy}
          textColor={featured ? colors.navy : '#fff'}
          style={uiStyles.btn}
          contentStyle={uiStyles.btnContent}
          labelStyle={uiStyles.btnLabel}>
          {submitting ? (isUpgrade ? 'Upgrading…' : 'Subscribing…') : (isUpgrade ? 'Upgrade to This Plan' : 'Subscribe Now')}
        </Button>
      )}
      <Button
        mode="text"
        icon="format-list-bulleted"
        style={styles.viewItems}
        textColor={featured ? '#fff' : colors.cyanDark}
        onPress={onViewItems}>
        View Items
      </Button>
    </View>
  );
}

export default function SubscriptionScreen({ navigation, route }) {
  const { isAuthenticated, isLoadingAuth, profile } = useAuth();
  const [plans, setPlans] = useState([]);
  const [myMembership, setMyMembership] = useState(null);
  const [membershipChecked, setMembershipChecked] = useState(false);
  const [subscribingId, setSubscribingId] = useState(null);
  const [justSubscribed, setJustSubscribed] = useState(null);
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState(null);

  useEffect(() => {
    api.entities.SubscriptionPlan.list('price').then(setPlans).catch(() => {});
  }, []);

  useEffect(() => {
    if (isLoadingAuth) return;
    if (!isAuthenticated || !profile) { setMembershipChecked(true); return; }
    api.entities.Member.filter({ user_id: profile.id })
      .then((rows) => setMyMembership(rows[0] || null))
      .catch(() => {})
      .finally(() => setMembershipChecked(true));
  }, [isAuthenticated, isLoadingAuth, profile]);

  const createFreshMembership = async (plan) => {
    const today = new Date().toISOString().slice(0, 10);
    const end = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    return api.entities.Member.create({
      plan_id: plan.id,
      plan_name: plan.name,
      full_name: profile.full_name || 'Member',
      phone: '',
      status: 'active',
      start_date: today,
      end_date: end,
      bookings_used: 0,
      bookings_allowed: plan.bookings_per_month,
      items_used: 0,
      items_allowed: plan.eligible_items,
    });
  };

  const subscribe = async (plan) => {
    if (isLoadingAuth) return;
    if (!isAuthenticated) {
      navigation.navigate('Signup', { next: 'Subscription', plan: plan.id });
      return;
    }
    setSubscribingId(plan.id);
    setError('');
    try {
      let member;
      if (myMembership) {
        try {
          member = await api.membership.upgrade(plan.id);
        } catch {
          member = await createFreshMembership(plan);
        }
      } else {
        member = await createFreshMembership(plan);
      }
      setMyMembership(member);
      setJustSubscribed(plan.name);
      const included = await api.membership.getIncluded(plan.id).catch(() => ({ items: [], services: [] }));
      setConfirmation({ plan, items: included.items, services: included.services });
    } catch (err) {
      setError(err?.message || 'Something went wrong — please try again.');
    } finally {
      setSubscribingId(null);
    }
  };

  // Completes a subscribe that was interrupted by the signup detour:
  // Subscribe Now -> Signup(plan=X) -> back here still carrying route.params.plan.
  useFocusEffect(
    React.useCallback(() => {
      const pendingPlanId = route.params?.plan;
      if (!pendingPlanId || !membershipChecked || !isAuthenticated || !plans.length) return;
      navigation.setParams({ plan: undefined });
      if (myMembership) return;
      const plan = plans.find((p) => p.id === pendingPlanId);
      if (plan) subscribe(plan);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [route.params?.plan, membershipChecked, isAuthenticated, plans, myMembership])
  );

  return (
    <ScrollView style={uiStyles.screen} contentContainerStyle={styles.container}>
      {/* Kept compact so the first plan card starts within the first screen;
          the whole page scrolls (plan cards vary in length with their
          feature lists, so pinning the hero would squeeze them). */}
      <ScreenHero overlap eyebrow="Membership Plans" title="One membership. Limitless care." icon="crown">
        <View style={styles.perks}>
          {PERKS.map((p) => (
            <View key={p.label} style={styles.perk}>
              <Icon source={p.icon} size={14} color={colors.cyan} />
              <Text style={styles.perkText}>{p.label}</Text>
            </View>
          ))}
        </View>
        {(justSubscribed || myMembership) && (
          <View style={styles.statusPill}>
            <Icon source="check-decagram" size={16} color={colors.success} />
            <Text style={styles.statusText} numberOfLines={2}>
              You're on the {myMembership?.plan_name || justSubscribed} plan · {myMembership?.payment_status === 'paid' ? 'Payment confirmed.' : "Payment pending — we'll follow up to confirm billing."}
            </Text>
          </View>
        )}
      </ScreenHero>

      <ErrorBanner message={error} style={styles.error} />

      {!plans.length && <ActivityIndicator style={styles.loader} color={colors.navy} />}

      <View style={styles.plansWrap}>
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isCurrent={myMembership?.plan_id === plan.id}
            isUpgrade={!!myMembership && myMembership.plan_id !== plan.id}
            submitting={subscribingId === plan.id}
            onSubscribe={() => subscribe(plan)}
            onViewItems={() => navigation.navigate('Services')}
          />
        ))}
      </View>

      <Portal>
        <Modal visible={!!confirmation} onDismiss={() => setConfirmation(null)} contentContainerStyle={styles.modal}>
          {confirmation && (
            <>
              <View style={styles.modalIcon}>
                <IconTile icon="check-circle-outline" size={56} tone="green" />
              </View>
              <Text style={[type.h1, styles.centerText]}>Payment successful!</Text>
              <Text style={[styles.dim, styles.modalLead]}>
                You're now on the {confirmation.plan.name} plan — {confirmation.plan.price} {confirmation.plan.currency}/{confirmation.plan.period}.
              </Text>
              <Text style={[styles.navyBold, styles.modalSection]}>Included items</Text>
              {confirmation.items.length ? confirmation.items.map((i) => <Text key={i.id} style={styles.dim}>• {i.name}</Text>) : <Text style={styles.dim}>Not set up yet.</Text>}
              <Text style={[styles.navyBold, styles.modalSection]}>Included services</Text>
              {confirmation.services.length ? confirmation.services.map((s) => <Text key={s.id} style={styles.dim}>• {s.name}</Text>) : <Text style={styles.dim}>Not set up yet.</Text>}
              <Button mode="contained" style={[uiStyles.btn, styles.modalBtn]} contentStyle={uiStyles.btnContent} labelStyle={uiStyles.btnLabel} onPress={() => setConfirmation(null)}>Got it</Button>
            </>
          )}
        </Modal>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centerText: { textAlign: 'center' },
  container: { padding: spacing.lg, paddingBottom: 40 },
  perks: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.md },
  perk: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  perkText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.successSoft, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 8, marginTop: spacing.md },
  statusText: { flex: 1, color: colors.success, fontSize: 12, fontWeight: '700' },
  // The error (when shown) and the first plan card ride up over the hero's edge.
  error: { marginTop: -HERO_OVERLAP, marginBottom: spacing.md + HERO_OVERLAP },
  loader: { marginTop: 40 },
  navyBold: { color: colors.navy, fontWeight: '700', fontSize: 14 },
  dim: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  plansWrap: { marginTop: -HERO_OVERLAP, gap: spacing.lg },
  planCard: { borderRadius: radius.xxl, padding: spacing.xl, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, ...shadow.card },
  planCardFeatured: { backgroundColor: colors.navy, borderColor: colors.gold, borderWidth: 1.5, ...shadow.raised },
  planCardCurrent: { borderColor: colors.success, borderWidth: 1.5 },
  planHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  bestValue: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.gold, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start' },
  bestValueText: { color: colors.navy, fontSize: 10, fontWeight: '800' },
  planName: { fontSize: 19, fontWeight: '800', color: colors.navy },
  planTagline: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginTop: spacing.md },
  planPrice: { fontSize: 32, lineHeight: 36, fontWeight: '800', color: colors.navy },
  gold: { color: colors.gold },
  planPeriod: { fontSize: 12, color: colors.textFaint, marginBottom: 5, fontWeight: '600' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  dividerDark: { backgroundColor: 'rgba(255,255,255,0.12)' },
  featuresList: { gap: 8, marginBottom: spacing.lg },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  check: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.cyanSoft, alignItems: 'center', justifyContent: 'center' },
  checkFeatured: { backgroundColor: colors.gold },
  feature: { fontSize: 13, color: colors.textBody, flex: 1 },
  currentBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.successSoft, borderRadius: radius.md, paddingVertical: 14 },
  currentBadgeFeatured: { backgroundColor: 'rgba(255,255,255,0.1)' },
  currentText: { color: colors.success, fontWeight: '800' },
  viewItems: { marginTop: 4 },
  textWhite: { color: '#fff' },
  textWhiteDim: { color: colors.onDarkMuted },
  textWhiteDim2: { color: 'rgba(255,255,255,0.88)' },
  modal: { backgroundColor: colors.surface, margin: spacing.xxl, padding: spacing.xxl, borderRadius: radius.xxl },
  modalIcon: { alignItems: 'center', marginBottom: spacing.md },
  modalLead: { marginTop: spacing.sm, textAlign: 'center', fontSize: 13 },
  modalSection: { marginTop: spacing.lg, marginBottom: 4 },
  modalBtn: { marginTop: spacing.xl },
});
