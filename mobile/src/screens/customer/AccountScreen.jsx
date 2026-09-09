import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card, Chip, IconButton, ActivityIndicator, Portal, Modal } from 'react-native-paper';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import AppTextInput from '../../components/AppTextInput';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../lib/AuthContext';
import { api } from '../../api/client';

const NAVY = '#0E2346';
const GOLD = '#B08D2C';

function Usage({ label, used, total }) {
  const pct = total ? Math.min(100, (used / total) * 100) : 0;
  return (
    <View style={{ marginBottom: 10 }}>
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
    return <ActivityIndicator style={{ marginTop: 60 }} />;
  }

  return (
    <KeyboardAwareScrollView
      style={styles.flex}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      enableOnAndroid
      extraScrollHeight={20}>
      <Text variant="headlineMedium" style={styles.title}>Welcome, {profile.full_name || 'there'}.</Text>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.navy}>Profile</Text>
          <AppTextInput label="Full name" value={fullName} onChangeText={setFullName} left={<AppTextInput.Icon icon="account-outline" />} style={styles.input} />
          <AppTextInput label="Email" value={profile.email || ''} disabled left={<AppTextInput.Icon icon="email-outline" />} style={styles.input} />
          <AppTextInput label="Phone" value={phone} onChangeText={setPhone} left={<AppTextInput.Icon icon="phone-outline" />} style={styles.input} keyboardType="phone-pad" />
          <Button
            mode="contained"
            onPress={saveProfile}
            loading={savingProfile}
            disabled={savingProfile || (fullName === (profile.full_name || '') && phone === (profile.phone || ''))}>
            Save changes
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.row}>
            <Text variant="titleMedium" style={styles.navy}>Manage Addresses</Text>
            {!addingAddress && <Button compact onPress={() => setAddingAddress(true)}>+ Add</Button>}
          </View>

          {!!addressError && <Text style={styles.error}>{addressError}</Text>}

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
                numberOfLines={3}
                left={<AppTextInput.Icon icon="map-marker-outline" />}
                style={styles.input}
              />
              <View style={styles.rowGap}>
                <Button mode="contained" onPress={addAddress}>Save address</Button>
                <Button mode="outlined" onPress={() => { setAddingAddress(false); setNewAddress({ label: '', address_text: '' }); }}>Cancel</Button>
              </View>
            </View>
          )}

          {addresses.map((a) => (
            <View key={a.id} style={styles.addressRow}>
              <View style={{ flex: 1 }}>
                <View style={styles.rowGap}>
                  <Text style={styles.navyBold}>{a.label || 'Address'}</Text>
                  {a.is_default && <Chip compact style={styles.defaultChip} textStyle={{ fontSize: 10 }}>Default</Chip>}
                </View>
                <Text style={styles.dim}>{a.address_text}</Text>
              </View>
              <View style={styles.rowGap}>
                {!a.is_default && <IconButton icon="star-outline" size={18} onPress={() => makeDefault(a.id)} />}
                <IconButton icon="trash-can-outline" size={18} onPress={() => deleteAddress(a.id)} />
              </View>
            </View>
          ))}
          {!addresses.length && !addingAddress && (
            <Text style={styles.emptyText}>No saved addresses yet — add one so checkout is a single tap.</Text>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.navy}>Membership</Text>
          {membership ? (
            <>
              <View style={[styles.row, { marginTop: 12 }]}>
                <View>
                  <Text style={styles.navyBold}>{membership.plan_name}</Text>
                  <Text style={styles.dim}>{membership.start_date} → {membership.end_date || '—'}</Text>
                </View>
                <View style={styles.rowGap}>
                  <Chip compact>{membership.payment_status}</Chip>
                  <Chip compact>{membership.status}</Chip>
                </View>
              </View>

              <View style={{ marginTop: 16 }}>
                <Usage label="Bookings this month" used={membership.bookings_used} total={membership.bookings_allowed} />
                <Usage label="Eligible items this month" used={membership.items_used} total={membership.items_allowed} />
              </View>

              <Button onPress={() => setShowUpgrade((v) => !v)} style={{ marginTop: 8 }}>
                {showUpgrade ? 'Hide plans' : 'Upgrade plan'}
              </Button>

              {!!upgradeError && <Text style={styles.error}>{upgradeError}</Text>}

              {showUpgrade && plans.filter((p) => p.id !== membership.plan_id).map((p) => (
                <View key={p.id} style={styles.planRow}>
                  <View>
                    <Text style={styles.navyBold}>{p.name}</Text>
                    <Text style={styles.dim}>{p.price} {p.currency}/{p.period}</Text>
                  </View>
                  <Button mode="contained" compact loading={upgradingId === p.id} disabled={upgradingId === p.id} onPress={() => upgrade(p)}>
                    Switch
                  </Button>
                </View>
              ))}
            </>
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: 16 }}>
              <Text style={styles.dim}>You don't have a membership yet.</Text>
              <Button mode="contained" style={{ marginTop: 12 }} onPress={() => navigation.navigate('Subscription')}>
                View plans
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.navy}>Past orders</Text>
          {orders.map((o) => (
            <View key={o.id} style={styles.orderRow}>
              <View style={styles.rowGap}>
                <Text style={styles.navyBold}>{o.order_code}</Text>
                <Text style={styles.dim}>{o.created_date?.slice(0, 10)}</Text>
              </View>
              <View style={styles.rowGap}>
                <Text style={styles.gold}>{o.total} QAR</Text>
                <Chip compact>{o.status.replace('_', ' ')}</Chip>
              </View>
            </View>
          ))}
          {!orders.length && <Text style={styles.emptyText}>No orders yet — this only shows orders placed while logged in.</Text>}
        </Card.Content>
      </Card>

      <Portal>
        <Modal visible={!!confirmation} onDismiss={() => setConfirmation(null)} contentContainerStyle={styles.modal}>
          {confirmation && (
            <>
              <Text variant="titleLarge" style={styles.navy}>You're on {confirmation.plan.name}</Text>
              <Text style={[styles.dim, { marginTop: 8 }]}>Included in your plan:</Text>
              {confirmation.items.map((i) => <Text key={i.id} style={styles.dim}>• {i.name}</Text>)}
              {confirmation.services.map((s) => <Text key={s.id} style={styles.dim}>• {s.name}</Text>)}
              <Button mode="contained" style={{ marginTop: 16 }} onPress={() => setConfirmation(null)}>Done</Button>
            </>
          )}
        </Modal>
      </Portal>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f8fafc' },
  container: { padding: 20, paddingBottom: 40 },
  title: { fontWeight: '700', textAlign: 'center', color: NAVY, marginBottom: 16 },
  card: { marginBottom: 16, borderRadius: 16 },
  input: { marginTop: 10, marginBottom: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowGap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  navy: { color: NAVY, fontWeight: '700' },
  navyBold: { color: NAVY, fontWeight: '600' },
  gold: { color: GOLD, fontWeight: '700' },
  dim: { color: '#64748b', fontSize: 12 },
  error: { color: '#dc2626', fontSize: 12, marginTop: 8 },
  emptyText: { color: '#94a3b8', fontSize: 13, textAlign: 'center', paddingVertical: 16 },
  dashedBox: { borderWidth: 1, borderStyle: 'dashed', borderColor: '#cbd5e1', borderRadius: 12, padding: 12, marginTop: 12 },
  addressRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 12, padding: 12, marginTop: 8 },
  defaultChip: { backgroundColor: '#d1fae5', height: 22 },
  barTrack: { height: 8, borderRadius: 4, backgroundColor: '#e2e8f0', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4, backgroundColor: GOLD },
  planRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, marginTop: 8 },
  orderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 12, padding: 12, marginTop: 8 },
  modal: { backgroundColor: 'white', margin: 24, padding: 20, borderRadius: 16 },
});
