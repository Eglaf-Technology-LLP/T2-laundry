import React, { useCallback, useState } from 'react';
import { View, FlatList, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Text, Chip, Portal, Modal, Button, IconButton, ActivityIndicator, Card, Menu } from 'react-native-paper';
import AppTextInput from '../../components/AppTextInput';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../api/client';
import { formatDate } from '../../lib/date';
import { colors, shadow } from '../../theme/tokens';

const NAVY = colors.navy;
const GOLD = colors.goldDark;

function Usage({ label, used, total }) {
  const pct = total ? Math.min(100, (used / total) * 100) : 0;
  return (
    <View style={{ marginTop: 8 }}>
      <View style={styles.row}>
        <Text style={styles.dim}>{label}</Text>
        <Text style={styles.navyBold}>{used} / {total}</Text>
      </View>
      <View style={styles.barTrack}><View style={[styles.barFill, { width: `${pct}%` }]} /></View>
    </View>
  );
}

export default function AdminMembersScreen() {
  const [members, setMembers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [planMenuOpen, setPlanMenuOpen] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', plan_id: '', status: 'active' });
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.entities.Member.list(),
      api.entities.SubscriptionPlan.list('price'),
    ]).then(([m, p]) => {
      setMembers(m);
      setPlans(p);
      if (p.length) setForm((f) => (f.plan_id ? f : { ...f, plan_id: p[0].id }));
    }).finally(() => setLoading(false));
  }, []);
  useFocusEffect(load);

  const vipPlanNames = new Set(plans.filter((p) => p.is_vip).map((p) => p.name));

  const create = async () => {
    if (!form.full_name || !form.phone || !form.plan_id) return;
    const plan = plans.find((p) => p.id === form.plan_id);
    await api.entities.Member.create({
      full_name: form.full_name,
      email: form.email,
      phone: form.phone,
      plan_id: form.plan_id,
      plan_name: plan?.name,
      status: form.status,
      start_date: new Date().toISOString().slice(0, 10),
      end_date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      bookings_used: 0,
      bookings_allowed: plan?.bookings_per_month || 4,
      items_used: 0,
      items_allowed: plan?.eligible_items || 20,
    });
    setForm({ full_name: '', email: '', phone: '', plan_id: plans[0]?.id || '', status: 'active' });
    setShowForm(false);
    load();
  };

  const remove = async (m) => { await api.entities.Member.delete(m.id); load(); };
  const markPaid = async (m) => { await api.entities.Member.update(m.id, { payment_status: 'paid' }); load(); };

  const filtered = members.filter((m) => !query || m.full_name.toLowerCase().includes(query.toLowerCase()) || (m.email || '').toLowerCase().includes(query.toLowerCase()));

  const stats = {
    total: members.length,
    vip: members.filter((m) => vipPlanNames.has(m.plan_name)).length,
    active: members.filter((m) => m.status === 'active').length,
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 60 }} />;

  const selectedPlan = plans.find((p) => p.id === form.plan_id);

  return (
    <View style={styles.flex}>
      <FlatList
        data={filtered}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: 12, paddingBottom: 90 }}
        ListHeaderComponent={
          <View>
            <View style={styles.statsRow}>
              <Card style={styles.statCard}><Card.Content><Text style={styles.statValue}>{stats.total}</Text><Text style={styles.dim}>Total Members</Text></Card.Content></Card>
              <Card style={styles.statCard}><Card.Content><Text style={[styles.statValue, styles.gold]}>{stats.vip}</Text><Text style={styles.dim}>VIP Members</Text></Card.Content></Card>
              <Card style={styles.statCard}><Card.Content><Text style={styles.statValue}>{stats.active}</Text><Text style={styles.dim}>Active Now</Text></Card.Content></Card>
            </View>
            <AppTextInput value={query} onChangeText={setQuery} placeholder="Search members…" mode="outlined" dense style={styles.search} left={<AppTextInput.Icon icon="magnify" />} />
          </View>
        }
        renderItem={({ item: m }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.navyBold}>{m.full_name}</Text>
                <Text style={styles.dim}>{m.email || m.phone}</Text>
              </View>
              <View style={styles.rowGap}>
                <Chip compact>{m.status}</Chip>
                <IconButton icon="trash-can-outline" size={16} onPress={() => remove(m)} />
              </View>
            </View>

            <View style={[styles.row, { marginTop: 10 }]}>
              <Text style={vipPlanNames.has(m.plan_name) ? styles.gold : styles.navyBold}>{vipPlanNames.has(m.plan_name) ? '👑 ' : ''}{m.plan_name}</Text>
              <Text style={styles.dim}>{formatDate(m.start_date)} → {formatDate(m.end_date) || '—'}</Text>
            </View>

            <View style={[styles.rowGap, { marginTop: 8 }]}>
              <Chip compact>{m.payment_status || 'pending'}</Chip>
              {m.payment_status !== 'paid' && <Text style={styles.markPaidLink} onPress={() => markPaid(m)}>Mark paid</Text>}
            </View>

            <Usage label="Bookings" used={m.bookings_used} total={m.bookings_allowed} />
            <Usage label="Eligible items" used={m.items_used} total={m.items_allowed} />
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No members.</Text>}
      />

      <Button mode="contained" style={styles.addBtn} onPress={() => setShowForm(true)}>+ Add Member</Button>

      <Portal>
        <Modal visible={showForm} onDismiss={() => setShowForm(false)} contentContainerStyle={styles.modal}>
          <Text variant="titleLarge" style={styles.navy}>Add Member</Text>
          <ScrollView style={{ maxHeight: 380, marginTop: 4 }} keyboardShouldPersistTaps="handled">
            <AppTextInput label="Full name" value={form.full_name} onChangeText={(t) => setForm({ ...form, full_name: t })} style={styles.input} />
            <AppTextInput label="Phone" value={form.phone} onChangeText={(t) => setForm({ ...form, phone: t })} keyboardType="phone-pad" style={styles.input} />
            <AppTextInput label="Email (optional)" value={form.email} onChangeText={(t) => setForm({ ...form, email: t })} style={styles.input} />
            <Menu
              visible={planMenuOpen}
              onDismiss={() => setPlanMenuOpen(false)}
              anchor={
                <Pressable onPress={() => setPlanMenuOpen(true)}>
                  <AppTextInput label="Plan" value={selectedPlan ? `${selectedPlan.name} — ${selectedPlan.price} QAR/${selectedPlan.period}` : ''} editable={false} style={styles.input} />
                </Pressable>
              }>
              {plans.map((p) => (
                <Menu.Item key={p.id} title={`${p.name} — ${p.price} QAR/${p.period}`} onPress={() => { setForm({ ...form, plan_id: p.id }); setPlanMenuOpen(false); }} />
              ))}
            </Menu>
          </ScrollView>
          <View style={styles.modalActions}>
            <Button mode="outlined" onPress={() => setShowForm(false)}>Cancel</Button>
            <Button mode="contained" onPress={create}>Add Member</Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  statCard: { flex: 1, borderRadius: 14 },
  statValue: { fontSize: 22, fontWeight: '700', color: NAVY },
  search: { backgroundColor: '#fff', marginBottom: 10 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border, ...shadow.card },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowGap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  navyBold: { color: NAVY, fontWeight: '700' },
  navy: { color: NAVY, fontWeight: '700' },
  dim: { color: '#94a3b8', fontSize: 11 },
  gold: { color: GOLD, fontWeight: '700' },
  markPaidLink: { color: '#059669', fontSize: 12, fontWeight: '600' },
  barTrack: { height: 6, borderRadius: 3, backgroundColor: '#e2e8f0', overflow: 'hidden', marginTop: 4 },
  barFill: { height: '100%', borderRadius: 3, backgroundColor: GOLD },
  emptyText: { textAlign: 'center', color: '#94a3b8', paddingVertical: 40 },
  addBtn: { position: 'absolute', right: 16, bottom: 16, left: 16, borderRadius: 28 },
  modal: { backgroundColor: '#fff', margin: 20, padding: 20, borderRadius: 24 },
  input: { marginTop: 10 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 16 },
});
