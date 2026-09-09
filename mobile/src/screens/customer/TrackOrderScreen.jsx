import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Button, ActivityIndicator, Card } from 'react-native-paper';
import AppTextInput from '../../components/AppTextInput';
import { api } from '../../api/client';

const STAGES = [
  { key: 'pending', label: 'Order Placed' },
  { key: 'picked_up', label: 'Picked Up' },
  { key: 'in_facility', label: 'In Facility' },
  { key: 'quality_check', label: 'Quality Check' },
  { key: 'out_for_delivery', label: 'Out for Delivery' },
  { key: 'delivered', label: 'Delivered' },
];

export default function TrackOrderScreen() {
  const [code, setCode] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const track = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    setOrder(null);
    try {
      const res = await api.entities.Order.filter({ order_code: code.trim().toUpperCase() });
      if (res.length) setOrder(res[0]);
      else setError('No order found with that code.');
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const currentIndex = order ? STAGES.findIndex((s) => s.key === order.status) : -1;

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text variant="headlineMedium" style={styles.title}>Track your order</Text>
      <Text variant="bodyMedium" style={styles.subtitle}>Enter your order code to follow your garment's journey</Text>

      <AppTextInput
        label="Order code"
        value={code}
        onChangeText={setCode}
        autoCapitalize="characters"
        placeholder="e.g. T2-AB12CD"
        style={styles.input}
        right={<AppTextInput.Icon icon="magnify" onPress={track} />}
        onSubmitEditing={track}
      />
      <Button mode="contained" onPress={track} loading={loading} disabled={loading || !code.trim()} style={styles.trackBtn}>
        Track
      </Button>

      {!!error && <Text style={styles.error}>{error}</Text>}

      {order && (
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.row}>
              <View>
                <Text style={styles.label}>Order Code</Text>
                <Text variant="titleLarge" style={styles.navy}>{order.order_code}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.label}>Total</Text>
                <Text variant="titleLarge" style={styles.gold}>{order.total} {order.currency || 'QAR'}</Text>
              </View>
            </View>

            <View style={styles.stages}>
              {STAGES.map((s, i) => (
                <View key={s.key} style={styles.stageRow}>
                  <View style={[styles.dot, i <= currentIndex && styles.dotActive]} />
                  <Text style={[styles.stageLabel, i <= currentIndex && styles.navy]}>{s.label}</Text>
                </View>
              ))}
            </View>

            <Text variant="titleSmall" style={[styles.navy, styles.sectionTitle]}>Items in this order</Text>
            {(order.items || []).map((it, i) => (
              <View key={i} style={styles.itemRow}>
                <View>
                  <Text style={styles.itemName}>{it.quantity}x {it.name}</Text>
                  <Text style={styles.itemMeta}>{it.service} · {it.category}</Text>
                </View>
                <Text style={styles.gold}>{it.price * it.quantity} QAR</Text>
              </View>
            ))}

            <View style={styles.metaGrid}>
              <View style={styles.metaBox}>
                <Text style={styles.label}>Pickup</Text>
                <Text style={styles.metaValue}>{order.pickup_type} · {order.pickup_slot}</Text>
                {!!order.pickup_date && <Text style={styles.itemMeta}>{order.pickup_date}</Text>}
              </View>
              <View style={styles.metaBox}>
                <Text style={styles.label}>Customer</Text>
                <Text style={styles.metaValue}>{order.customer_name}</Text>
                <Text style={styles.itemMeta}>{order.customer_phone}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}
      {loading && <ActivityIndicator style={{ marginTop: 16 }} />}
    </ScrollView>
  );
}

const NAVY = '#0E2346';
const GOLD = '#B08D2C';

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  title: { fontWeight: '700', textAlign: 'center', color: NAVY },
  subtitle: { textAlign: 'center', color: '#64748b', marginTop: 6, marginBottom: 20 },
  input: { marginBottom: 12 },
  trackBtn: { marginBottom: 8 },
  error: { color: '#dc2626', textAlign: 'center', marginTop: 8 },
  card: { marginTop: 20, borderRadius: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 },
  navy: { color: NAVY, fontWeight: '700' },
  gold: { color: GOLD, fontWeight: '700' },
  stages: { marginTop: 20, gap: 10 },
  stageRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#e2e8f0' },
  dotActive: { backgroundColor: NAVY },
  stageLabel: { color: '#94a3b8', fontSize: 13 },
  sectionTitle: { marginTop: 24, marginBottom: 8 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#f8fafc', borderRadius: 12, padding: 12, marginBottom: 8 },
  itemName: { fontWeight: '600', color: NAVY, fontSize: 13 },
  itemMeta: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  metaGrid: { flexDirection: 'row', gap: 10, marginTop: 12 },
  metaBox: { flex: 1, backgroundColor: '#f8fafc', borderRadius: 12, padding: 12 },
  metaValue: { fontWeight: '600', fontSize: 13, marginTop: 2 },
});
