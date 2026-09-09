import React, { useCallback, useState } from 'react';
import { View, FlatList, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Text, Portal, Modal, Button, IconButton, Checkbox, ActivityIndicator, Chip, FAB } from 'react-native-paper';
import AppTextInput from '../../components/AppTextInput';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../api/client';

const EMPTY_FORM = {
  name: '', slug: '', tagline: '', price: '0', currency: 'QAR', period: 'month',
  bookings_per_month: '0', eligible_items: '0', features: '', is_vip: false, popular: false, active: true,
};
const NAVY = '#0E2346';
const GOLD = '#B08D2C';

export default function AdminPlansScreen() {
  const [plans, setPlans] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [allServices, setAllServices] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.entities.SubscriptionPlan.list('price'),
      api.entities.Item.list('display_order', 200),
      api.entities.Service.list('name', 50).catch(() => []),
    ]).then(([p, i, s]) => { setPlans(p); setAllItems(i); setAllServices(s); }).finally(() => setLoading(false));
  }, []);
  useFocusEffect(load);

  const openAdd = () => { setForm(EMPTY_FORM); setSelectedItemIds([]); setSelectedServiceIds([]); setEditing({}); };
  const openEdit = async (plan) => {
    setForm({
      name: plan.name || '', slug: plan.slug || '', tagline: plan.tagline || '',
      price: String(plan.price || 0), currency: plan.currency || 'QAR', period: plan.period || 'month',
      bookings_per_month: String(plan.bookings_per_month || 0), eligible_items: String(plan.eligible_items || 0),
      features: (plan.features || []).join('\n'), is_vip: !!plan.is_vip, popular: !!plan.popular, active: plan.active !== false,
    });
    setEditing(plan);
    const [itemIds, serviceIds] = await Promise.all([
      api.entities.PlanItems.listForPlan(plan.id),
      api.entities.PlanServices.listForPlan(plan.id),
    ]);
    setSelectedItemIds(itemIds);
    setSelectedServiceIds(serviceIds);
  };

  const toggleItem = (id) => setSelectedItemIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleService = (id) => setSelectedServiceIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const save = async () => {
    if (!form.name) return;
    const payload = {
      ...form,
      price: +form.price,
      bookings_per_month: +form.bookings_per_month,
      eligible_items: +form.eligible_items,
      features: form.features.split('\n').map((f) => f.trim()).filter(Boolean),
    };
    const planId = editing?.id
      ? (await api.entities.SubscriptionPlan.update(editing.id, payload)).id
      : (await api.entities.SubscriptionPlan.create(payload)).id;

    await Promise.all([
      api.entities.PlanItems.replaceForPlan(planId, selectedItemIds),
      api.entities.PlanServices.replaceForPlan(planId, selectedServiceIds),
    ]);

    setEditing(null);
    load();
  };

  const remove = async (plan) => { await api.entities.SubscriptionPlan.delete(plan.id); load(); };

  if (loading) return <ActivityIndicator style={{ marginTop: 60 }} />;

  return (
    <View style={styles.flex}>
      <FlatList
        data={plans}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: 12, paddingBottom: 90 }}
        ListHeaderComponent={<Text style={styles.countText}>{plans.length} membership plan{plans.length === 1 ? '' : 's'}</Text>}
        renderItem={({ item: plan }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.navyBold}>{plan.is_vip ? '👑 ' : ''}{plan.name}</Text>
                <Text style={styles.dim}>{plan.tagline}</Text>
              </View>
              <View style={styles.rowGap}>
                <IconButton icon="pencil-outline" size={18} onPress={() => openEdit(plan)} />
                <IconButton icon="trash-can-outline" size={18} onPress={() => remove(plan)} />
              </View>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.price}>{plan.price}</Text>
              <Text style={styles.dim}>{plan.currency}/{plan.period}</Text>
            </View>
            <Text style={styles.dim}>{plan.bookings_per_month} bookings · {plan.eligible_items} items /mo</Text>
            {(plan.features || []).slice(0, 4).map((f, i) => <Text key={i} style={styles.feature}>• {f}</Text>)}
            {(plan.features || []).length > 4 && <Text style={styles.dim}>+{plan.features.length - 4} more</Text>}
            <Text style={styles.manageLink} onPress={() => openEdit(plan)}>Manage included items & services</Text>
            {plan.popular && <Chip compact style={styles.bestValueChip} textStyle={{ fontSize: 9, color: GOLD }}>Best Value</Chip>}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No plans yet.</Text>}
      />

      <FAB icon="plus" style={styles.fab} onPress={openAdd} label="Add Plan" />

      <Portal>
        <Modal visible={editing !== null} onDismiss={() => setEditing(null)} contentContainerStyle={styles.modal}>
          <Text variant="titleLarge" style={styles.navy}>{editing?.id ? 'Edit Plan' : 'Add Plan'}</Text>
          <ScrollView style={{ maxHeight: 520, marginTop: 12 }} keyboardShouldPersistTaps="handled">
            <AppTextInput label="Name" value={form.name} onChangeText={(t) => setForm({ ...form, name: t })} style={styles.input} />
            <AppTextInput label="Slug" value={form.slug} onChangeText={(t) => setForm({ ...form, slug: t })} style={styles.input} />
            <AppTextInput label="Tagline" value={form.tagline} onChangeText={(t) => setForm({ ...form, tagline: t })} style={styles.input} />
            <AppTextInput label="Price (QAR)" value={form.price} onChangeText={(t) => setForm({ ...form, price: t })} keyboardType="numeric" style={styles.input} />
            <AppTextInput label="Period" value={form.period} onChangeText={(t) => setForm({ ...form, period: t })} style={styles.input} />
            <AppTextInput label="Bookings / month" value={form.bookings_per_month} onChangeText={(t) => setForm({ ...form, bookings_per_month: t })} keyboardType="numeric" style={styles.input} />
            <AppTextInput label="Eligible items / month" value={form.eligible_items} onChangeText={(t) => setForm({ ...form, eligible_items: t })} keyboardType="numeric" style={styles.input} />
            <AppTextInput label="Features (one per line)" value={form.features} onChangeText={(t) => setForm({ ...form, features: t })} multiline numberOfLines={6} style={styles.input} />

            <Pressable style={styles.checkboxRow} onPress={() => setForm({ ...form, popular: !form.popular })}>
              <Checkbox status={form.popular ? 'checked' : 'unchecked'} /><Text>Best Value ribbon</Text>
            </Pressable>
            <Pressable style={styles.checkboxRow} onPress={() => setForm({ ...form, is_vip: !form.is_vip })}>
              <Checkbox status={form.is_vip ? 'checked' : 'unchecked'} /><Text>Featured on homepage</Text>
            </Pressable>

            <Text style={styles.sectionLabel}>Included items ({selectedItemIds.length} selected)</Text>
            <Text style={styles.helpText}>Orders using these items count against the member's monthly quota. Anything else is billed as a normal paid extra.</Text>
            <View style={styles.checklistBox}>
              {allItems.map((it) => (
                <Pressable key={it.id} style={styles.checklistRow} onPress={() => toggleItem(it.id)}>
                  <Checkbox status={selectedItemIds.includes(it.id) ? 'checked' : 'unchecked'} />
                  <Text style={styles.checklistText}>{it.name} <Text style={styles.dim}>· {it.category}</Text></Text>
                </Pressable>
              ))}
              {!allItems.length && <Text style={styles.dim}>No items yet — add some under Items first.</Text>}
            </View>

            <Text style={styles.sectionLabel}>Included services ({selectedServiceIds.length} selected)</Text>
            <Text style={styles.helpText}>Descriptive only for now — shown as part of the plan, doesn't affect checkout quota.</Text>
            <View style={styles.checklistBox}>
              {allServices.map((s) => (
                <Pressable key={s.id} style={styles.checklistRow} onPress={() => toggleService(s.id)}>
                  <Checkbox status={selectedServiceIds.includes(s.id) ? 'checked' : 'unchecked'} />
                  <Text style={styles.checklistText}>{s.name}</Text>
                </Pressable>
              ))}
              {!allServices.length && <Text style={styles.dim}>No services yet — add some under Services first.</Text>}
            </View>
          </ScrollView>
          <View style={styles.modalActions}>
            <Button mode="outlined" onPress={() => setEditing(null)}>Cancel</Button>
            <Button mode="contained" onPress={save}>{editing?.id ? 'Save Changes' : 'Create Plan'}</Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f8fafc' },
  countText: { color: '#64748b', fontSize: 12, marginBottom: 8 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowGap: { flexDirection: 'row', alignItems: 'center' },
  navyBold: { color: NAVY, fontWeight: '700' },
  navy: { color: NAVY, fontWeight: '700' },
  dim: { color: '#94a3b8', fontSize: 11 },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginTop: 8 },
  price: { fontSize: 22, fontWeight: '700', color: NAVY },
  feature: { fontSize: 12, color: '#64748b', marginTop: 4 },
  manageLink: { fontSize: 12, color: '#64748b', marginTop: 8, textDecorationLine: 'underline' },
  bestValueChip: { alignSelf: 'flex-start', backgroundColor: 'rgba(212,175,55,0.15)', marginTop: 8, height: 22 },
  emptyText: { textAlign: 'center', color: '#94a3b8', paddingVertical: 40 },
  fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: NAVY },
  modal: { backgroundColor: '#fff', margin: 20, padding: 20, borderRadius: 16, maxHeight: '88%' },
  input: { marginTop: 10 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  sectionLabel: { fontSize: 12, fontWeight: '600', color: NAVY, marginTop: 16 },
  helpText: { fontSize: 11, color: '#94a3b8', marginTop: 2, marginBottom: 6 },
  checklistBox: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, maxHeight: 160 },
  checklistRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  checklistText: { fontSize: 13, color: '#334155' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 16 },
});
