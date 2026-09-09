import React, { useCallback, useState } from 'react';
import { View, FlatList, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Text, Chip, Portal, Modal, Button, IconButton, Checkbox, ActivityIndicator, FAB } from 'react-native-paper';
import AppTextInput from '../../components/AppTextInput';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../api/client';

const EMPTY_CATEGORY = { name: '', slug: '', description: '', icon: 'Shirt' };
const EMPTY_ITEM = { name: '', category: '', wash_price: '0', iron_price: '0', wash_iron_price: '0', dryclean_price: '0', popular: false };
const NAVY = '#0E2346';
const GOLD = '#D4AF37';

export default function AdminItemsScreen() {
  const [items, setItems] = useState([]);
  const [cats, setCats] = useState([]);
  const [filter, setFilter] = useState('All');
  const [query, setQuery] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(EMPTY_ITEM);
  const [showCategories, setShowCategories] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [catForm, setCatForm] = useState(EMPTY_CATEGORY);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([api.entities.Item.list('display_order', 200), api.entities.Category.list('display_order', 50)])
      .then(([i, c]) => { setItems(i); setCats(c); })
      .finally(() => setLoading(false));
  }, []);
  useFocusEffect(load);

  const openAddItem = () => { setForm({ ...EMPTY_ITEM, category: cats[0]?.name || '' }); setEditingItem({}); };
  const openEditItem = (it) => {
    setForm({
      name: it.name || '', category: it.category || '', wash_price: String(it.wash_price || 0), iron_price: String(it.iron_price || 0),
      wash_iron_price: String(it.wash_iron_price || 0), dryclean_price: String(it.dryclean_price || 0), popular: !!it.popular,
    });
    setEditingItem(it);
  };

  const saveItem = async () => {
    if (!form.name || !form.category) return;
    const payload = { ...form, wash_price: +form.wash_price, iron_price: +form.iron_price, wash_iron_price: +form.wash_iron_price, dryclean_price: +form.dryclean_price };
    if (editingItem?.id) await api.entities.Item.update(editingItem.id, payload);
    else await api.entities.Item.create({ ...payload, display_order: items.length + 1, active: true, eligible_subscription: true });
    setEditingItem(null);
    load();
  };

  const togglePopular = async (it) => { await api.entities.Item.update(it.id, { popular: !it.popular }); load(); };
  const togglePublished = async (it) => { await api.entities.Item.update(it.id, { active: !it.active }); load(); };
  const remove = async (it) => { await api.entities.Item.delete(it.id); load(); };

  const openAddCategory = () => { setCatForm(EMPTY_CATEGORY); setEditingCat({}); };
  const openEditCategory = (c) => { setCatForm({ name: c.name || '', slug: c.slug || '', description: c.description || '', icon: c.icon || 'Shirt' }); setEditingCat(c); };
  const saveCategory = async () => {
    if (!catForm.name) return;
    if (editingCat?.id) await api.entities.Category.update(editingCat.id, catForm);
    else await api.entities.Category.create({ ...catForm, display_order: cats.length + 1, active: true });
    setEditingCat(null);
    load();
  };
  const removeCategory = async (c) => {
    await api.entities.Category.delete(c.id);
    if (filter === c.name) setFilter('All');
    load();
  };

  const filtered = items.filter((it) => {
    const cOk = filter === 'All' || it.category === filter;
    const qOk = !query || it.name.toLowerCase().includes(query.toLowerCase());
    return cOk && qOk;
  });

  const num = (v) => (v ? `${v} QAR` : '—');

  if (loading) return <ActivityIndicator style={{ marginTop: 60 }} />;

  return (
    <View style={styles.flex}>
      <View style={styles.filterBar}>
        <AppTextInput value={query} onChangeText={setQuery} placeholder="Search items…" mode="outlined" dense style={styles.search} left={<AppTextInput.Icon icon="magnify" />} />
        <View style={styles.catRow}>
          <FlatList
            data={['All', ...cats.map((c) => c.name)]}
            horizontal
            keyExtractor={(c) => c}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 6 }}
            style={{ flex: 1 }}
            renderItem={({ item: c }) => (
              <Chip selected={filter === c} onPress={() => setFilter(c)} style={filter === c ? styles.chipActive : styles.chip} textStyle={filter === c ? { color: '#fff' } : undefined}>{c}</Chip>
            )}
          />
          <IconButton icon="tag-multiple-outline" mode="outlined" size={18} onPress={() => setShowCategories(true)} />
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ padding: 12, paddingBottom: 90 }}
        renderItem={({ item: it }) => (
          <View style={[styles.itemCard, it.active === false && styles.itemCardInactive]}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <View style={styles.rowGap}>
                  <Text style={styles.navyBold}>{it.name}</Text>
                  {it.active === false && <Chip compact style={{ height: 20 }} textStyle={{ fontSize: 9 }}>Unpublished</Chip>}
                </View>
                <Text style={styles.dim}>{it.category}</Text>
              </View>
              <View style={styles.rowGap}>
                <IconButton icon="pencil-outline" size={18} onPress={() => openEditItem(it)} />
                <IconButton icon={it.active === false ? 'eye-off-outline' : 'eye-outline'} size={18} onPress={() => togglePublished(it)} />
                <IconButton icon={it.popular ? 'star' : 'star-outline'} iconColor={it.popular ? GOLD : undefined} size={18} onPress={() => togglePopular(it)} />
                <IconButton icon="trash-can-outline" size={18} onPress={() => remove(it)} />
              </View>
            </View>
            <View style={styles.priceGrid}>
              {[['Wash', it.wash_price], ['Iron', it.iron_price], ['W&I', it.wash_iron_price], ['Dry Clean', it.dryclean_price]].map(([label, value]) => (
                <View key={label} style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={styles.priceLabel}>{label}</Text>
                  <Text style={styles.priceValue}>{num(value)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No items.</Text>}
      />

      <FAB icon="plus" style={styles.fab} onPress={openAddItem} label="Add Item" />

      <Portal>
        <Modal visible={editingItem !== null} onDismiss={() => setEditingItem(null)} contentContainerStyle={styles.modal}>
          <Text variant="titleLarge" style={styles.navy}>{editingItem?.id ? 'Edit Item' : 'Add Item'}</Text>
          <ScrollView style={{ maxHeight: 420, marginTop: 12 }} keyboardShouldPersistTaps="handled">
            <AppTextInput label="Name" value={form.name} onChangeText={(t) => setForm({ ...form, name: t })} style={styles.input} />
            <Text style={styles.fieldLabel}>Category</Text>
            <View style={styles.rowWrap}>
              {cats.map((c) => (
                <Chip key={c.id} selected={form.category === c.name} onPress={() => setForm({ ...form, category: c.name })} style={styles.chip}>{c.name}</Chip>
              ))}
            </View>
            <AppTextInput label="Wash (QAR)" value={form.wash_price} onChangeText={(t) => setForm({ ...form, wash_price: t })} keyboardType="numeric" style={styles.input} />
            <AppTextInput label="Iron (QAR)" value={form.iron_price} onChangeText={(t) => setForm({ ...form, iron_price: t })} keyboardType="numeric" style={styles.input} />
            <AppTextInput label="Wash & Iron (QAR)" value={form.wash_iron_price} onChangeText={(t) => setForm({ ...form, wash_iron_price: t })} keyboardType="numeric" style={styles.input} />
            <AppTextInput label="Dry Clean (QAR)" value={form.dryclean_price} onChangeText={(t) => setForm({ ...form, dryclean_price: t })} keyboardType="numeric" style={styles.input} />
            <Pressable style={styles.checkboxRow} onPress={() => setForm({ ...form, popular: !form.popular })}>
              <Checkbox status={form.popular ? 'checked' : 'unchecked'} />
              <Text>Mark as popular</Text>
            </Pressable>
          </ScrollView>
          <View style={styles.modalActions}>
            <Button mode="outlined" onPress={() => setEditingItem(null)}>Cancel</Button>
            <Button mode="contained" onPress={saveItem}>{editingItem?.id ? 'Save Changes' : 'Create Item'}</Button>
          </View>
        </Modal>

        <Modal visible={showCategories} onDismiss={() => setShowCategories(false)} contentContainerStyle={styles.modal}>
          <Text variant="titleLarge" style={styles.navy}>Categories</Text>
          <ScrollView style={{ maxHeight: 320, marginTop: 12 }}>
            {cats.map((c) => (
              <View key={c.id} style={styles.catManageRow}>
                <Text style={styles.navyBold}>{c.name}</Text>
                <View style={styles.rowGap}>
                  <IconButton icon="pencil-outline" size={16} onPress={() => openEditCategory(c)} />
                  <IconButton icon="trash-can-outline" size={16} onPress={() => removeCategory(c)} />
                </View>
              </View>
            ))}
            {!cats.length && <Text style={styles.dim}>No categories yet.</Text>}
          </ScrollView>
          <Button mode="outlined" style={{ marginTop: 12 }} onPress={openAddCategory}>+ Add Category</Button>
          <Button mode="text" onPress={() => setShowCategories(false)}>Close</Button>
        </Modal>

        <Modal visible={editingCat !== null} onDismiss={() => setEditingCat(null)} contentContainerStyle={styles.modal}>
          <Text variant="titleLarge" style={styles.navy}>{editingCat?.id ? 'Edit Category' : 'Add Category'}</Text>
          <AppTextInput label="Name" value={catForm.name} onChangeText={(t) => setCatForm({ ...catForm, name: t })} style={styles.input} />
          <AppTextInput label="Slug" value={catForm.slug} onChangeText={(t) => setCatForm({ ...catForm, slug: t })} style={styles.input} />
          <AppTextInput label="Icon (lucide name)" value={catForm.icon} onChangeText={(t) => setCatForm({ ...catForm, icon: t })} style={styles.input} />
          <AppTextInput label="Description" value={catForm.description} onChangeText={(t) => setCatForm({ ...catForm, description: t })} multiline numberOfLines={2} style={styles.input} />
          <View style={styles.modalActions}>
            <Button mode="outlined" onPress={() => setEditingCat(null)}>Cancel</Button>
            <Button mode="contained" onPress={saveCategory}>{editingCat?.id ? 'Save Changes' : 'Create Category'}</Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f8fafc' },
  filterBar: { padding: 12, backgroundColor: '#fff', gap: 8 },
  search: { backgroundColor: '#fff' },
  catRow: { flexDirection: 'row', alignItems: 'center' },
  chip: { backgroundColor: '#fff' },
  chipActive: { backgroundColor: NAVY },
  itemCard: { backgroundColor: '#fff', borderRadius: 16, padding: 12, marginBottom: 10 },
  itemCardInactive: { opacity: 0.6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowGap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6, marginBottom: 4 },
  navyBold: { color: NAVY, fontWeight: '600' },
  navy: { color: NAVY, fontWeight: '700' },
  dim: { color: '#94a3b8', fontSize: 11 },
  priceGrid: { flexDirection: 'row', backgroundColor: '#f8fafc', borderRadius: 10, padding: 8, marginTop: 10 },
  priceLabel: { fontSize: 9, color: '#94a3b8' },
  priceValue: { fontSize: 12, fontWeight: '700', color: NAVY, marginTop: 2 },
  emptyText: { textAlign: 'center', color: '#94a3b8', paddingVertical: 40 },
  fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: NAVY },
  modal: { backgroundColor: '#fff', margin: 20, padding: 20, borderRadius: 16, maxHeight: '85%' },
  input: { marginTop: 10 },
  fieldLabel: { fontSize: 11, color: '#64748b', marginTop: 12 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 16 },
  catManageRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 10, padding: 10, marginBottom: 6 },
});
