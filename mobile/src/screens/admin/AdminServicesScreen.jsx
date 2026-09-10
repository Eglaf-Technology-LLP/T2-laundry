import React, { useCallback, useState } from 'react';
import { View, FlatList, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Text, Portal, Modal, Button, IconButton, Checkbox, ActivityIndicator, FAB } from 'react-native-paper';
import AppTextInput from '../../components/AppTextInput';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../api/client';

const EMPTY_FORM = { name: '', slug: '', description: '', icon: 'Droplets', base_price: '0', turnaround_hours: '24', currency: 'QAR', active: true };
const NAVY = '#0E2346';
const GOLD = '#B08D2C';

export default function AdminServicesScreen() {
  const [services, setServices] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);

  // services has no display_order column — sort by name only, and swallow
  // errors so a sort mistake here can't blank the whole list (mirrors the
  // web app's fix for a bug where Add Service silently never showed up).
  const load = useCallback(() => {
    setLoading(true);
    api.entities.Service.list('name', 50).then(setServices).catch(() => {}).finally(() => setLoading(false));
  }, []);
  useFocusEffect(load);

  const openAdd = () => { setForm(EMPTY_FORM); setEditing({}); };
  const openEdit = (s) => {
    setForm({
      name: s.name || '', slug: s.slug || '', description: s.description || '', icon: s.icon || 'Droplets',
      base_price: String(s.base_price || 0), turnaround_hours: String(s.turnaround_hours || 24), currency: s.currency || 'QAR', active: s.active !== false,
    });
    setEditing(s);
  };

  const save = async () => {
    if (!form.name) return;
    const payload = { ...form, base_price: +form.base_price, turnaround_hours: +form.turnaround_hours };
    if (editing?.id) await api.entities.Service.update(editing.id, payload);
    else await api.entities.Service.create(payload);
    setEditing(null);
    load();
  };

  const remove = async (s) => { await api.entities.Service.delete(s.id); load(); };

  if (loading) return <ActivityIndicator style={{ marginTop: 60 }} />;

  return (
    <View style={styles.flex}>
      <FlatList
        data={services}
        keyExtractor={(s) => s.id}
        contentContainerStyle={{ padding: 12, paddingBottom: 90 }}
        ListHeaderComponent={<Text style={styles.countText}>{services.length} service{services.length === 1 ? '' : 's'}</Text>}
        renderItem={({ item: s }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.navyBold}>{s.name}</Text>
                <Text style={styles.dim}>{s.turnaround_hours}h turnaround</Text>
              </View>
              <View style={styles.rowGap}>
                <IconButton icon="pencil-outline" size={18} onPress={() => openEdit(s)} />
                <IconButton icon="trash-can-outline" size={18} onPress={() => remove(s)} />
              </View>
            </View>
            <Text style={styles.desc} numberOfLines={2}>{s.description}</Text>
            <Text style={styles.gold}>from {s.base_price} {s.currency || 'QAR'}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No services yet.</Text>}
      />

      <FAB icon="plus" color="#fff" style={styles.fab} onPress={openAdd} label="Add Service" />

      <Portal>
        <Modal visible={editing !== null} onDismiss={() => setEditing(null)} contentContainerStyle={styles.modal}>
          <Text variant="titleLarge" style={styles.navy}>{editing?.id ? 'Edit Service' : 'Add Service'}</Text>
          <ScrollView style={{ maxHeight: 420, marginTop: 4 }} keyboardShouldPersistTaps="handled">
            <AppTextInput label="Name" value={form.name} onChangeText={(t) => setForm({ ...form, name: t })} style={styles.input} />
            <AppTextInput label="Slug" value={form.slug} onChangeText={(t) => setForm({ ...form, slug: t })} style={styles.input} />
            <AppTextInput label="Icon (lucide name)" value={form.icon} onChangeText={(t) => setForm({ ...form, icon: t })} style={styles.input} />
            <AppTextInput label="Description" value={form.description} onChangeText={(t) => setForm({ ...form, description: t })} multiline numberOfLines={2} style={styles.input} />
            <AppTextInput label="Base price (QAR)" value={form.base_price} onChangeText={(t) => setForm({ ...form, base_price: t })} keyboardType="numeric" style={styles.input} />
            <AppTextInput label="Turnaround (hours)" value={form.turnaround_hours} onChangeText={(t) => setForm({ ...form, turnaround_hours: t })} keyboardType="numeric" style={styles.input} />
            <Pressable style={styles.checkboxRow} onPress={() => setForm({ ...form, active: !form.active })}>
              <Checkbox status={form.active ? 'checked' : 'unchecked'} />
              <Text>Active</Text>
            </Pressable>
          </ScrollView>
          <View style={styles.modalActions}>
            <Button mode="outlined" onPress={() => setEditing(null)}>Cancel</Button>
            <Button mode="contained" onPress={save}>{editing?.id ? 'Save Changes' : 'Create Service'}</Button>
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
  desc: { color: '#64748b', fontSize: 12, marginTop: 8 },
  gold: { color: GOLD, fontWeight: '700', marginTop: 8 },
  emptyText: { textAlign: 'center', color: '#94a3b8', paddingVertical: 40 },
  fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: NAVY },
  modal: { backgroundColor: '#fff', margin: 20, padding: 20, borderRadius: 16, maxHeight: '85%' },
  input: { marginTop: 10 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 16 },
});
