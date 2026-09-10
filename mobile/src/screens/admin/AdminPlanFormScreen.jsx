import React, { memo, useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, Button, Checkbox, ActivityIndicator } from 'react-native-paper';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppTextInput from '../../components/AppTextInput';
import { api } from '../../api/client';

const EMPTY_FORM = {
  name: '', slug: '', tagline: '', price: '0', currency: 'QAR', period: 'month',
  bookings_per_month: '0', eligible_items: '0', features: '', is_vip: false, popular: false, active: true,
};
const NAVY = '#0E2346';

// Toggling one row used to re-render every row in the list (up to ~200 for
// items) since they were all inline JSX in a single big component — each tap
// felt laggy. Memoizing each row so only the one whose `checked` value
// actually flips re-renders fixes that.
const ChecklistRow = memo(function ChecklistRow({ id, label, sublabel, checked, onToggle }) {
  return (
    <Pressable style={styles.checklistRow} onPress={() => onToggle(id)}>
      <Checkbox status={checked ? 'checked' : 'unchecked'} />
      <Text style={styles.checklistText}>
        {label}
        {sublabel ? <Text style={styles.dim}> · {sublabel}</Text> : null}
      </Text>
    </Pressable>
  );
});

export default function AdminPlanFormScreen({ navigation, route }) {
  const plan = route.params?.plan || null;
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState(EMPTY_FORM);
  const [allItems, setAllItems] = useState([]);
  const [allServices, setAllServices] = useState([]);
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: plan ? 'Edit Plan' : 'Add Plan' });
  }, [navigation, plan]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const tasks = [
        api.entities.Item.list('display_order', 200),
        api.entities.Service.list('name', 50).catch(() => []),
      ];
      if (plan) {
        tasks.push(api.entities.PlanItems.listForPlan(plan.id));
        tasks.push(api.entities.PlanServices.listForPlan(plan.id));
      }
      const [items, services, itemIds, serviceIds] = await Promise.all(tasks);
      if (cancelled) return;
      setAllItems(items);
      setAllServices(services);
      if (plan) {
        setForm({
          name: plan.name || '', slug: plan.slug || '', tagline: plan.tagline || '',
          price: String(plan.price || 0), currency: plan.currency || 'QAR', period: plan.period || 'month',
          bookings_per_month: String(plan.bookings_per_month || 0), eligible_items: String(plan.eligible_items || 0),
          features: (plan.features || []).join('\n'), is_vip: !!plan.is_vip, popular: !!plan.popular, active: plan.active !== false,
        });
        setSelectedItemIds(itemIds || []);
        setSelectedServiceIds(serviceIds || []);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [plan]);

  const toggleItem = useCallback((id) => setSelectedItemIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])), []);
  const toggleService = useCallback((id) => setSelectedServiceIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])), []);

  const save = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: +form.price,
        bookings_per_month: +form.bookings_per_month,
        eligible_items: +form.eligible_items,
        features: form.features.split('\n').map((f) => f.trim()).filter(Boolean),
      };
      const planId = plan?.id
        ? (await api.entities.SubscriptionPlan.update(plan.id, payload)).id
        : (await api.entities.SubscriptionPlan.create(payload)).id;

      await Promise.all([
        api.entities.PlanItems.replaceForPlan(planId, selectedItemIds),
        api.entities.PlanServices.replaceForPlan(planId, selectedServiceIds),
      ]);

      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 60 }} />;

  return (
    <View style={styles.flex}>
      <KeyboardAwareScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraScrollHeight={20}>
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
          <ChecklistRow key={it.id} id={it.id} label={it.name} sublabel={it.category} checked={selectedItemIds.includes(it.id)} onToggle={toggleItem} />
        ))}
        {!allItems.length && <Text style={styles.dim}>No items yet — add some under Items first.</Text>}
      </View>

      <Text style={styles.sectionLabel}>Included services ({selectedServiceIds.length} selected)</Text>
      <Text style={styles.helpText}>Descriptive only for now — shown as part of the plan, doesn't affect checkout quota.</Text>
      <View style={styles.checklistBox}>
        {allServices.map((s) => (
          <ChecklistRow key={s.id} id={s.id} label={s.name} checked={selectedServiceIds.includes(s.id)} onToggle={toggleService} />
        ))}
        {!allServices.length && <Text style={styles.dim}>No services yet — add some under Services first.</Text>}
      </View>
      </KeyboardAwareScrollView>

      <View style={[styles.actions, { paddingBottom: 12 + insets.bottom }]}>
        <Button mode="outlined" onPress={() => navigation.goBack()} style={{ flex: 1 }}>Cancel</Button>
        <Button mode="contained" onPress={save} loading={saving} disabled={saving} style={{ flex: 1 }}>
          {plan ? 'Save Changes' : 'Create Plan'}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 28 },
  input: { marginTop: 10 },
  dim: { color: '#94a3b8', fontSize: 11 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  sectionLabel: { fontSize: 12, fontWeight: '600', color: NAVY, marginTop: 16 },
  helpText: { fontSize: 11, color: '#94a3b8', marginTop: 2, marginBottom: 6 },
  checklistBox: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12 },
  checklistRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 6 },
  checklistText: { flex: 1, fontSize: 13, color: '#334155' },
  actions: { flexDirection: 'row', gap: 8, padding: 16, paddingTop: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0' },
});
