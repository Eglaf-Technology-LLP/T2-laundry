import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, IconButton, ActivityIndicator, Portal, Modal, Icon } from 'react-native-paper';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import AppTextInput from '../../components/AppTextInput';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../lib/AuthContext';
import { api } from '../../api/client';
import { ErrorBanner, IconTile, SectionTitle, StatusPill, SurfaceCard, uiStyles } from '../../components/ui';
import { colors, radius, shadow, spacing, type } from '../../theme/tokens';

function Usage({ label, used, total }) {
  const pct = total ? Math.min(100, (used / total) * 100) : 0;
  return (
    <View style={styles.usage}>
      <View style={styles.row}>
        <Text style={styles.dim}>{label}</Text>
        <Text style={styles.navyBold}>{used} / {total}</Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct}%` }]} />
      </View>
    </View>
  );
}

function initials(name) {
  return (name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

export default function AccountScreen({ navigation }) {
  const { profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [membership, setMembership] = useState(null);
  const [plans, setPlans] = useState([]);
  const [orders, setOrders] = useState([]);
  const [upgradingId, setUpgradingId] = useState(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeError, setUpgradeError] = useState('');
  const [confirmation, setConfirmation] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [addingAddress, setAddingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({ label: '', address_text: '' });
  const [addressError, setAddressError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setFullName(profile?.full_name || '');
    setPhone(profile?.phone || '');
  }, [profile]);

  const load = useCallback(() => {
    if (!profile) return;
    setLoading(true);
    Promise.all([
      api.entities.Member.filter({ user_id: profile.id }).then((rows) => setMembership(rows[0] || null)).catch(() => {}),
      api.entities.Order.filter({ user_id: profile.id })
        .then((rows) => setOrders([...rows].sort((a, b) => new Date(b.created_date) - new Date(a.created_date))))
        .catch(() => {}),
      api.entities.SubscriptionPlan.list('price').then(setPlans).catch(() => {}),
      api.entities.Address.list('-is_default').then(setAddresses).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [profile]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      await api.auth.updateProfile({ full_name: fullName, phone });
      await refreshProfile();
    } finally {
      setSavingProfile(false);
    }
  };

  const addAddress = async () => {
    if (!newAddress.address_text.trim()) return;
    setAddressError('');
    try {
      const created = await api.entities.Address.create({
        label: newAddress.label || null,
        address_text: newAddress.address_text,
        is_default: addresses.length === 0,
      });
      setAddresses((prev) => [created, ...prev]);
      setNewAddress({ label: '', address_text: '' });
      setAddingAddress(false);
    } catch (err) {
      setAddressError(err?.message || "Couldn't save that address — please try again.");
    }
  };

  const deleteAddress = async (id) => {
    try {
      await api.entities.Address.delete(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      setAddressError(err?.message || "Couldn't delete that address — please try again.");
    }
  };

  const makeDefault = async (id) => {
    try {
      await Promise.all(addresses.filter((a) => a.is_default).map((a) => api.entities.Address.update(a.id, { is_default: false })));
      await api.entities.Address.update(id, { is_default: true });
      setAddresses((prev) => prev.map((a) => ({ ...a, is_default: a.id === id })));
    } catch (err) {
      setAddressError(err?.message || "Couldn't update that address — please try again.");
    }
  };

  const upgrade = async (plan) => {
    setUpgradingId(plan.id);
    setUpgradeError('');
    try {
      const updated = await api.membership.upgrade(plan.id);
      setMembership(updated);
      setShowUpgrade(false);
      const included = await api.membership.getIncluded(plan.id).catch(() => ({ items: [], services: [] }));
      setConfirmation({ plan, items: included.items, services: included.services });
    } catch (err) {
      setUpgradeError(err?.message || 'Something went wrong — please try again.');
    } finally {
      setUpgradingId(null);
    }
  };

  if (!profile) return null;
  if (loading && !orders.length && !membership) {
    return <ActivityIndicator style={styles.loader} color={colors.navy} />;
  }

  return (
    <KeyboardAwareScrollView
      style={uiStyles.screen}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      enableOnAndroid
      extraScrollHeight={20}>
      <View style={styles.profileHero}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(profile.full_name || profile.email)}</Text>
        </View>
        <View style={styles.flex}>
          <Text style={styles.heroHello}>Welcome,</Text>
          <Text style={styles.heroName} numberOfLines={1}>{profile.full_name || 'there'}.</Text>
          {!!profile.email && <Text style={styles.heroEmail} numberOfLines={1}>{profile.email}</Text>}
        </View>
        {membership && (
          <View style={styles.heroPlan}>
            <Icon source="crown" size={12} color={colors.navy} />
            <Text style={styles.heroPlanText}>{membership.plan_name}</Text>
          </View>
        )}
      </View>

      <SurfaceCard style={styles.card}>
        <SectionTitle title="Profile" right={<IconTile icon="account-edit-outline" size={32} />} />
        <AppTextInput label="Full name" value={fullName} onChangeText={setFullName} left={<AppTextInput.Icon icon="account-outline" />} style={styles.input} />
        <AppTextInput label="Email" value={profile.email || ''} disabled left={<AppTextInput.Icon icon="email-outline" />} style={styles.input} />
        <AppTextInput label="Phone" value={phone} onChangeText={setPhone} left={<AppTextInput.Icon icon="phone-outline" />} style={styles.input} keyboardType="phone-pad" />
        <Button
          mode="contained"
          onPress={saveProfile}
          loading={savingProfile}
          disabled={savingProfile || (fullName === (profile.full_name || '') && phone === (profile.phone || ''))}
          style={uiStyles.btn}
          contentStyle={uiStyles.btnContent}
          labelStyle={uiStyles.btnLabel}>
          Save changes
        </Button>
      </SurfaceCard>

      <SurfaceCard style={styles.card}>
        <SectionTitle
          title="Manage Addresses"
          right={!addingAddress && <Button compact icon="plus" textColor={colors.cyanDark} onPress={() => setAddingAddress(true)}>Add</Button>}
        />

        <ErrorBanner message={addressError} style={styles.blockGap} />

        {addingAddress && (
          <View style={styles.dashedBox}>
            <AppTextInput
              label="Label (e.g. Home, Office)"
              value={newAddress.label}
              onChangeText={(t) => setNewAddress((f) => ({ ...f, label: t }))}
              left={<AppTextInput.Icon icon="tag-outline" />}
              style={styles.input}
            />
            <AppTextInput
              label="Full address"
              value={newAddress.address_text}
              onChangeText={(t) => setNewAddress((f) => ({ ...f, address_text: t }))}
              multiline
              numberOfLines={2}
              left={<AppTextInput.Icon icon="map-marker-outline" />}
              style={styles.input}
            />
            <View style={styles.rowGap}>
              <Button mode="contained" style={[uiStyles.btn, styles.flex]} onPress={addAddress}>Save address</Button>
              <Button mode="outlined" style={uiStyles.btn} onPress={() => { setAddingAddress(false); setNewAddress({ label: '', address_text: '' }); }}>Cancel</Button>
            </View>
          </View>
        )}

        {addresses.map((a) => (
          <View key={a.id} style={styles.addressRow}>
            <IconTile icon={a.is_default ? 'home-map-marker' : 'map-marker-outline'} size={38} tone={a.is_default ? 'cyan' : 'navy'} />
            <View style={styles.flex}>
              <View style={styles.rowGap}>
                <Text style={styles.navyBold}>{a.label || 'Address'}</Text>
                {a.is_default && <StatusPill status="active" label="Default" />}
              </View>
              <Text style={styles.dim}>{a.address_text}</Text>
            </View>
            <View style={styles.addrActions}>
              {!a.is_default && <IconButton icon="star-outline" size={18} iconColor={colors.gold} style={styles.iconBtn} onPress={() => makeDefault(a.id)} accessibilityLabel="Make default" />}
              <IconButton icon="trash-can-outline" size={18} iconColor={colors.error} style={styles.iconBtn} onPress={() => deleteAddress(a.id)} accessibilityLabel="Delete address" />
            </View>
          </View>
        ))}
        {!addresses.length && !addingAddress && (
          <Text style={styles.emptyText}>No saved addresses yet — add one so checkout is a single tap.</Text>
        )}
      </SurfaceCard>

      <SurfaceCard style={styles.card}>
        <SectionTitle title="Membership" right={<IconTile icon="crown-outline" size={32} tone="gold" />} />
        {membership ? (
          <>
            <View style={styles.memberBox}>
              <View style={styles.flex}>
                <Text style={styles.memberName}>{membership.plan_name}</Text>
                <Text style={styles.memberDates}>{membership.start_date} → {membership.end_date || '—'}</Text>
              </View>
              <View style={styles.pillStack}>
                <StatusPill status={membership.payment_status} />
                <StatusPill status={membership.status} />
              </View>
            </View>

            <View style={styles.usageWrap}>
              <Usage label="Bookings this month" used={membership.bookings_used} total={membership.bookings_allowed} />
              <Usage label="Eligible items this month" used={membership.items_used} total={membership.items_allowed} />
            </View>

            <Button
              mode="outlined"
              icon={showUpgrade ? 'chevron-up' : 'arrow-up-bold-circle-outline'}
              onPress={() => setShowUpgrade((v) => !v)}
              style={[uiStyles.btn, styles.outlinedBtn]}
              textColor={colors.navy}>
              {showUpgrade ? 'Hide plans' : 'Upgrade plan'}
            </Button>

            <ErrorBanner message={upgradeError} style={styles.blockGap} />

            {showUpgrade && plans.filter((p) => p.id !== membership.plan_id).map((p) => (
              <View key={p.id} style={styles.planRow}>
                <View style={styles.flex}>
                  <Text style={styles.navyBold}>{p.name}</Text>
                  <Text style={styles.dim}>{p.price} {p.currency}/{p.period}</Text>
                </View>
                <Button mode="contained" compact style={uiStyles.btn} loading={upgradingId === p.id} disabled={upgradingId === p.id} onPress={() => upgrade(p)}>
                  Switch
                </Button>
              </View>
            ))}
          </>
        ) : (
          <View style={styles.noMember}>
            <Text style={[styles.dim, styles.centerText]}>You don't have a membership yet.</Text>
            <Button mode="contained" icon="crown" buttonColor={colors.gold} textColor={colors.navy} style={[uiStyles.btn, styles.blockGap]} labelStyle={uiStyles.btnLabel} onPress={() => navigation.navigate('Subscription')}>
              View plans
            </Button>
          </View>
        )}
      </SurfaceCard>

      <SurfaceCard style={styles.card}>
        <SectionTitle title="Past orders" right={<IconTile icon="history" size={32} tone="navy" />} />
        {orders.map((o) => (
          <View key={o.id} style={styles.orderRow}>
            <IconTile icon="package-variant-closed" size={38} tone="navy" />
            <View style={styles.flex}>
              <Text style={styles.navyBold}>{o.order_code}</Text>
              <Text style={styles.dim}>{o.created_date?.slice(0, 10)}</Text>
            </View>
            <View style={styles.orderRight}>
              <Text style={styles.orderTotal}>{o.total} QAR</Text>
              <StatusPill status={o.status} label={o.status.replace('_', ' ')} />
            </View>
          </View>
        ))}
        {!orders.length && <Text style={styles.emptyText}>No orders yet — this only shows orders placed while logged in.</Text>}
      </SurfaceCard>

      <Portal>
        <Modal visible={!!confirmation} onDismiss={() => setConfirmation(null)} contentContainerStyle={styles.modal}>
          {confirmation && (
            <>
              <View style={styles.modalIcon}>
                <IconTile icon="crown" size={56} tone="gold" />
              </View>
              <Text style={[type.h1, styles.centerText]}>You're on {confirmation.plan.name}</Text>
              <Text style={[styles.dim, styles.modalLead]}>Included in your plan:</Text>
              {confirmation.items.map((i) => <Text key={i.id} style={styles.dim}>• {i.name}</Text>)}
              {confirmation.services.map((s) => <Text key={s.id} style={styles.dim}>• {s.name}</Text>)}
              <Button mode="contained" style={[uiStyles.btn, styles.modalBtn]} contentStyle={uiStyles.btnContent} labelStyle={uiStyles.btnLabel} onPress={() => setConfirmation(null)}>Done</Button>
            </>
          )}
        </Modal>
      </Portal>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centerText: { textAlign: 'center' },
  loader: { marginTop: 60 },
  container: { padding: spacing.lg, paddingBottom: 40 },

  profileHero: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.navy, borderRadius: radius.xxl, padding: spacing.xl, marginBottom: spacing.lg, ...shadow.raised },
  avatar: { width: 58, height: 58, borderRadius: 29, backgroundColor: colors.cyan, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.2)' },
  avatarText: { color: colors.navy, fontSize: 20, fontWeight: '800' },
  heroHello: { color: colors.onDarkMuted, fontSize: 12 },
  heroName: { color: '#fff', fontSize: 20, fontWeight: '800' },
  heroEmail: { color: colors.onDarkMuted, fontSize: 12, marginTop: 2 },
  heroPlan: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.gold, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  heroPlanText: { color: colors.navy, fontSize: 11, fontWeight: '800' },

  card: { marginBottom: spacing.lg },
  input: { marginBottom: spacing.md },
  blockGap: { marginTop: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowGap: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  navyBold: { color: colors.navy, fontWeight: '700', fontSize: 14 },
  dim: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  emptyText: { color: colors.textFaint, fontSize: 13, textAlign: 'center', paddingVertical: spacing.lg },
  dashedBox: { borderWidth: 1.2, borderStyle: 'dashed', borderColor: colors.borderStrong, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },

  addressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surfaceMuted, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.sm, borderWidth: 1, borderColor: colors.border },
  addrActions: { flexDirection: 'row' },
  iconBtn: { margin: 0 },

  memberBox: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.goldSoft, borderRadius: radius.lg, padding: spacing.lg },
  memberName: { color: colors.navy, fontSize: 18, fontWeight: '800' },
  memberDates: { color: colors.goldDark, fontSize: 12, marginTop: 2, fontWeight: '600' },
  pillStack: { gap: 6, alignItems: 'flex-end' },
  usageWrap: { marginTop: spacing.lg },
  usage: { marginBottom: spacing.md },
  barTrack: { height: 8, borderRadius: 4, backgroundColor: colors.border, overflow: 'hidden', marginTop: 6 },
  barFill: { height: '100%', borderRadius: 4, backgroundColor: colors.cyan },
  outlinedBtn: { borderColor: colors.navy, borderWidth: 1.2, marginTop: spacing.xs },
  planRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.sm },
  noMember: { alignItems: 'stretch', paddingVertical: spacing.sm },

  orderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surfaceMuted, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.sm, borderWidth: 1, borderColor: colors.border },
  orderRight: { alignItems: 'flex-end', gap: 4 },
  orderTotal: { color: colors.navy, fontWeight: '800', fontSize: 13 },

  modal: { backgroundColor: colors.surface, margin: spacing.xxl, padding: spacing.xxl, borderRadius: radius.xxl },
  modalIcon: { alignItems: 'center', marginBottom: spacing.md },
  modalLead: { marginTop: spacing.sm, marginBottom: 4 },
  modalBtn: { marginTop: spacing.xl },
});
