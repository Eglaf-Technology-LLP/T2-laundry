import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Button, Portal, Modal, ActivityIndicator } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../lib/AuthContext';
import { api } from '../../api/client';

const NAVY = '#0E2346';
const GOLD = '#D4AF37';

function PlanCard({ plan, isCurrent, isUpgrade, submitting, onSubscribe, onViewItems }) {
  const featured = plan.popular;
  return (
    <View style={[styles.planCard, featured && styles.planCardFeatured]}>
      {featured && <Text style={styles.bestValue}>Best Value</Text>}
      <Text style={[styles.planName, featured && styles.textWhite]}>{plan.name}</Text>
      <Text style={[styles.planTagline, featured && styles.textWhiteDim]}>{plan.tagline}</Text>
      <View style={styles.priceRow}>
        <Text style={[styles.planPrice, featured && styles.gold]}>{plan.price}</Text>
        <Text style={[styles.planPeriod, featured && styles.textWhiteDim]}>QAR / {plan.period}</Text>
      </View>
      <View style={styles.featuresList}>
        {(plan.features || []).map((f, i) => (
          <Text key={i} style={[styles.feature, featured && styles.textWhiteDim2]}>✓ {f}</Text>
        ))}
      </View>
      {isCurrent ? (
        <View style={styles.currentBadge}><Text style={[styles.navyBold, featured && styles.textWhite]}>Your current plan</Text></View>
      ) : (
        <Button mode="contained" loading={submitting} disabled={submitting} onPress={onSubscribe} buttonColor={featured ? '#fff' : NAVY} textColor={featured ? NAVY : '#fff'}>
          {submitting ? (isUpgrade ? 'Upgrading…' : 'Subscribing…') : (isUpgrade ? 'Upgrade to This Plan' : 'Subscribe Now')}
        </Button>
      )}
      <Button mode="outlined" style={{ marginTop: 8 }} textColor={featured ? '#fff' : NAVY} onPress={onViewItems}>
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
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.eyebrow}>Membership Plans</Text>
      <Text variant="headlineMedium" style={styles.title}>One membership. Limitless care.</Text>
      <Text style={styles.subtitle}>Free pickup & delivery, priority booking and real-time tracking on every tier.</Text>

      {!!error && <Text style={styles.error}>{error}</Text>}

      {(justSubscribed || myMembership) && (
        <View style={styles.statusBanner}>
          <Text style={styles.navyBold}>You're on the {myMembership?.plan_name || justSubscribed} plan</Text>
          <Text style={styles.dim}>{myMembership?.payment_status === 'paid' ? 'Payment confirmed.' : "Payment pending — we'll follow up to confirm billing."}</Text>
        </View>
      )}

      {!plans.length && <ActivityIndicator style={{ marginTop: 40 }} />}

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
              <Text variant="titleLarge" style={styles.navy}>Payment successful!</Text>
              <Text style={[styles.dim, { marginTop: 8 }]}>
                You're now on the {confirmation.plan.name} plan — {confirmation.plan.price} {confirmation.plan.currency}/{confirmation.plan.period}.
              </Text>
              <Text style={[styles.navyBold, { marginTop: 16 }]}>Included items</Text>
              {confirmation.items.length ? confirmation.items.map((i) => <Text key={i.id} style={styles.dim}>• {i.name}</Text>) : <Text style={styles.dim}>Not set up yet.</Text>}
              <Text style={[styles.navyBold, { marginTop: 12 }]}>Included services</Text>
              {confirmation.services.length ? confirmation.services.map((s) => <Text key={s.id} style={styles.dim}>• {s.name}</Text>) : <Text style={styles.dim}>Not set up yet.</Text>}
              <Button mode="contained" style={{ marginTop: 20 }} onPress={() => setConfirmation(null)}>Got it</Button>
            </>
          )}
        </Modal>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40, backgroundColor: '#f8fafc' },
  eyebrow: { fontSize: 11, color: GOLD, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1 },
  title: { textAlign: 'center', color: NAVY, fontWeight: '700', marginTop: 10 },
  subtitle: { textAlign: 'center', color: '#64748b', marginTop: 10 },
  error: { color: '#dc2626', textAlign: 'center', marginTop: 12 },
  statusBanner: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginTop: 16 },
  navyBold: { color: NAVY, fontWeight: '700' },
  navy: { color: NAVY, fontWeight: '700' },
  dim: { color: '#64748b', fontSize: 12, marginTop: 2 },
  plansWrap: { marginTop: 24, gap: 16 },
  planCard: { borderRadius: 24, padding: 20, backgroundColor: '#fff', elevation: 1 },
  planCardFeatured: { backgroundColor: NAVY },
  bestValue: { alignSelf: 'flex-end', backgroundColor: GOLD, color: NAVY, fontSize: 10, fontWeight: '700', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 4 },
  planName: { fontSize: 20, fontWeight: '700', color: NAVY },
  planTagline: { fontSize: 12, color: '#64748b', marginTop: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginTop: 14 },
  planPrice: { fontSize: 32, fontWeight: '700', color: NAVY },
  gold: { color: GOLD },
  planPeriod: { fontSize: 11, color: '#94a3b8', marginBottom: 4 },
  featuresList: { marginTop: 16, gap: 6 },
  feature: { fontSize: 13, color: '#475569' },
  currentBadge: { backgroundColor: '#f1f5f9', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginBottom: 8 },
  textWhite: { color: '#fff' },
  textWhiteDim: { color: 'rgba(255,255,255,0.7)' },
  textWhiteDim2: { color: 'rgba(255,255,255,0.85)' },
  modal: { backgroundColor: '#fff', margin: 24, padding: 20, borderRadius: 16 },
});
