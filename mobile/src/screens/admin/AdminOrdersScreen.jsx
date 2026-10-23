import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, FlatList, StyleSheet, Pressable } from 'react-native';
import { Text, Chip, Portal, Modal, Button, ActivityIndicator } from 'react-native-paper';
import AppTextInput from '../../components/AppTextInput';
import FilterScrollRow from '../../components/FilterScrollRow';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../api/client';
import { colors, shadow } from '../../theme/tokens';

const STAGES = ['pending', 'picked_up', 'in_facility', 'quality_check', 'out_for_delivery', 'delivered'];
const FILTERS = ['all', ...STAGES];
const STAGE_LABELS = { pending: 'Order Placed', picked_up: 'Picked Up', in_facility: 'In Facility', quality_check: 'Quality Check', out_for_delivery: 'Out for Delivery', delivered: 'Delivered' };
const NAVY = colors.navy;
const GOLD = colors.goldDark;

export default function AdminOrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const filterListRef = useRef(null);

  const load = useCallback(() => {
    setLoading(true);
    api.entities.Order.list('-created_date', 100).then(setOrders).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useFocusEffect(load);

  // Tapping a stage near the end of the row otherwise leaves it (and its
  // label) sitting past the visible edge — nothing scrolled it into view, so
  // the only sign a filter is even active is a chip that's still off-screen.
  useEffect(() => {
    const idx = FILTERS.indexOf(filter);
    if (idx > -1) {
      filterListRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.5 });
    }
  }, [filter]);

  const advance = async (o) => {
    const idx = STAGES.indexOf(o.status);
    if (idx < STAGES.length - 1) {
      await api.entities.Order.update(o.id, { status: STAGES[idx + 1] });
      load();
      setSelected((s) => (s && s.id === o.id ? { ...s, status: STAGES[idx + 1] } : s));
    }
  };

  const cancel = async (o) => {
    await api.entities.Order.update(o.id, { status: 'cancelled' });
    load();
    setSelected((s) => (s && s.id === o.id ? { ...s, status: 'cancelled' } : s));
  };

  const filtered = orders.filter((o) => {
    const qOk = !query || o.order_code.toLowerCase().includes(query.toLowerCase()) || o.customer_name.toLowerCase().includes(query.toLowerCase());
    const fOk = filter === 'all' || o.status === filter;
    return qOk && fOk;
  });

  if (loading) return <ActivityIndicator style={{ marginTop: 60 }} />;

  return (
    <View style={styles.flex}>
      <View style={styles.filterBar}>
        <AppTextInput value={query} onChangeText={setQuery} placeholder="Search code or customer…" mode="outlined" dense style={styles.search} left={<AppTextInput.Icon icon="magnify" />} />
        <FilterScrollRow
          ref={filterListRef}
          data={FILTERS}
          keyExtractor={(s) => s}
          contentContainerStyle={{ gap: 6, paddingVertical: 8 }}
          renderItem={({ item: s }) => (
            <Chip
              selected={filter === s}
              showSelectedCheck={false}
              onPress={() => setFilter(s)}
              style={filter === s ? styles.chipActive : styles.chip}
              textStyle={filter === s ? { color: '#fff' } : undefined}>
              {s === 'all' ? 'All' : STAGE_LABELS[s] || s}
            </Chip>
          )}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ padding: 12 }}
        renderItem={({ item: o }) => (
          <Pressable onPress={() => setSelected(o)}>
            <View style={styles.orderCard}>
              <View style={styles.row}>
                <Text style={styles.code}>{o.order_code}</Text>
                <Text style={styles.gold}>{o.total} QAR</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.dim}>{o.customer_name} · {o.customer_phone}</Text>
                <Chip compact>{STAGE_LABELS[o.status] || o.status}</Chip>
              </View>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No orders match.</Text>}
      />

      <Portal>
        <Modal visible={!!selected} onDismiss={() => setSelected(null)} contentContainerStyle={styles.modal}>
          {selected && (
            <View>
              <View style={styles.row}>
                <Text style={styles.code}>{selected.order_code}</Text>
                <Chip compact>{STAGE_LABELS[selected.status] || selected.status}</Chip>
              </View>
              <Text style={styles.dim}>{selected.customer_name} · {selected.customer_phone}</Text>

              <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Logistics Pulse</Text>
              {STAGES.map((s, i) => {
                const activeIdx = STAGES.indexOf(selected.status);
                const done = i <= activeIdx;
                return (
                  <View key={s} style={styles.stageRow}>
                    <View style={[styles.stageDot, done && styles.stageDotDone]}>
                      <Text style={{ color: done ? '#fff' : '#94a3b8', fontSize: 11 }}>{done ? '✓' : i + 1}</Text>
                    </View>
                    <Text style={[styles.stageText, done && styles.navyBold]}>{STAGE_LABELS[s]}</Text>
                  </View>
                );
              })}

              <View style={styles.itemsBox}>
                <Text style={styles.sectionLabel}>Items</Text>
                {(selected.items || []).map((it, i) => (
                  <Text key={i} style={styles.dim}>{it.quantity}x {it.name} · {it.service}</Text>
                ))}
                <Text style={[styles.gold, { marginTop: 8 }]}>Total: {selected.total} QAR</Text>
              </View>

              {selected.status !== 'delivered' && selected.status !== 'cancelled' && (
                <View style={styles.rowGap}>
                  <Button mode="contained" style={{ flex: 1 }} onPress={() => advance(selected)}>Advance</Button>
                  <Button mode="outlined" textColor="#dc2626" onPress={() => cancel(selected)}>Cancel</Button>
                </View>
              )}
            </View>
          )}
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  filterBar: { padding: 12, backgroundColor: '#fff' },
  search: { backgroundColor: '#fff' },
  chip: { backgroundColor: '#fff' },
  chipActive: { backgroundColor: NAVY },
  orderCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border, ...shadow.card, gap: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowGap: { flexDirection: 'row', gap: 8, marginTop: 16 },
  code: { fontWeight: '700', color: NAVY, fontSize: 14 },
  dim: { color: '#64748b', fontSize: 12 },
  gold: { color: GOLD, fontWeight: '700' },
  emptyText: { textAlign: 'center', color: '#94a3b8', paddingVertical: 40 },
  modal: { backgroundColor: '#fff', margin: 20, padding: 20, borderRadius: 24, maxHeight: '85%' },
  navyBold: { color: NAVY, fontWeight: '700' },
  sectionLabel: { fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  stageRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  stageDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' },
  stageDotDone: { backgroundColor: NAVY },
  stageText: { fontSize: 13, color: '#94a3b8' },
  itemsBox: { backgroundColor: colors.bg, borderRadius: 12, padding: 12, marginTop: 16 },
});
