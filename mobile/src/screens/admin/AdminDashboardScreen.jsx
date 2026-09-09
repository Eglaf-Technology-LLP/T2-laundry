import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Chip, ActivityIndicator } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../api/client';

const NAVY = '#0E2346';
const GOLD = '#D4AF37';
const STATUS_LABEL = { pending: 'pending', picked_up: 'picked up', in_facility: 'in facility', quality_check: 'quality check', out_for_delivery: 'out for delivery', delivered: 'delivered' };

export default function AdminDashboardScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    Promise.all([
      api.entities.Order.list('-created_date', 100).catch(() => []),
      api.entities.Member.list().catch(() => []),
    ]).then(([o, m]) => { setOrders(o); setMembers(m); }).finally(() => setLoading(false));
  }, []));

  if (loading) return <ActivityIndicator style={{ marginTop: 60 }} />;

  const revenue = orders.reduce((s, o) => s + (o.total || 0), 0);
  const active = orders.filter((o) => !['delivered', 'cancelled'].includes(o.status)).length;
  const vipCount = members.filter((m) => m.plan_name === 'VIP').length;

  const catRevenue = {};
  orders.forEach((o) => (o.items || []).forEach((it) => {
    catRevenue[it.category] = (catRevenue[it.category] || 0) + it.price * it.quantity;
  }));
  const maxCat = Math.max(1, ...Object.values(catRevenue));
  const categories = Object.keys(catRevenue).sort((a, b) => catRevenue[b] - catRevenue[a]);

  const today = new Date();
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
  const chartData = last7Days.map((d) => {
    const dayOrders = orders.filter((o) => o.created_date && new Date(o.created_date).toDateString() === d.toDateString());
    return { day: d.toLocaleDateString(undefined, { weekday: 'short' }), orders: dayOrders.length, revenue: dayOrders.reduce((s, o) => s + (o.total || 0), 0) };
  });
  const maxOrders = Math.max(1, ...chartData.map((d) => d.orders));

  const stats = [
    { label: 'Total Orders', value: orders.length },
    { label: 'Active Orders', value: active },
    { label: 'Revenue (QAR)', value: revenue },
    { label: 'VIP Members', value: vipCount },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.statsGrid}>
        {stats.map((s) => (
          <Card key={s.label} style={styles.statCard}>
            <Card.Content>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.dim}>{s.label}</Text>
            </Card.Content>
          </Card>
        ))}
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.navy}>Weekly Activity</Text>
          <Text style={styles.dim}>Orders per day, last 7 days</Text>
          <View style={styles.chartRow}>
            {chartData.map((d, i) => (
              <View key={i} style={styles.chartCol}>
                <View style={[styles.bar, { height: 8 + (d.orders / maxOrders) * 80 }]} />
                <Text style={styles.chartLabel}>{d.day}</Text>
                <Text style={styles.chartValue}>{d.orders}</Text>
              </View>
            ))}
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.navy}>Revenue Heatmap</Text>
          <Text style={styles.dim}>By category (QAR)</Text>
          <View style={{ marginTop: 12, gap: 10 }}>
            {categories.map((c) => (
              <View key={c}>
                <View style={styles.row}>
                  <Text style={styles.catLabel}>{c}</Text>
                  <Text style={styles.navyBold}>{catRevenue[c]}</Text>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${(catRevenue[c] / maxCat) * 100}%` }]} />
                </View>
              </View>
            ))}
            {!categories.length && <Text style={styles.dim}>No data yet.</Text>}
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.row}>
            <Text variant="titleMedium" style={styles.navy}>Recent Orders</Text>
            <Text style={styles.link} onPress={() => navigation.navigate('Orders')}>View all →</Text>
          </View>
          {orders.slice(0, 6).map((o) => (
            <View key={o.id} style={styles.orderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.navyBold}>{o.order_code}</Text>
                <Text style={styles.dim}>{o.customer_name}</Text>
              </View>
              <Text style={styles.gold}>{o.total} QAR</Text>
              <Chip compact style={{ marginLeft: 8 }}>{STATUS_LABEL[o.status] || o.status}</Chip>
            </View>
          ))}
          {!orders.length && <Text style={styles.dim}>No orders yet.</Text>}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40, backgroundColor: '#f8fafc' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '47%', borderRadius: 16 },
  statValue: { fontSize: 26, fontWeight: '700', color: NAVY },
  dim: { color: '#64748b', fontSize: 12, marginTop: 2 },
  card: { marginTop: 16, borderRadius: 16 },
  navy: { color: NAVY, fontWeight: '700' },
  navyBold: { color: NAVY, fontWeight: '600' },
  gold: { color: GOLD, fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chartRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 20, height: 120 },
  chartCol: { alignItems: 'center', flex: 1 },
  bar: { width: 14, backgroundColor: NAVY, borderRadius: 4 },
  chartLabel: { fontSize: 10, color: '#94a3b8', marginTop: 6 },
  chartValue: { fontSize: 10, fontWeight: '700', color: NAVY },
  catLabel: { fontSize: 12, color: '#475569', flex: 1 },
  barTrack: { height: 8, borderRadius: 4, backgroundColor: '#e2e8f0', overflow: 'hidden', marginTop: 4 },
  barFill: { height: '100%', borderRadius: 4, backgroundColor: GOLD },
  link: { color: GOLD, fontSize: 13, fontWeight: '600' },
  orderRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 12, padding: 10, marginTop: 8 },
});
