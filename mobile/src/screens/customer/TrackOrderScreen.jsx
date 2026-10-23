import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Button, ActivityIndicator, Icon } from 'react-native-paper';
import AppTextInput from '../../components/AppTextInput';
import { api } from '../../api/client';
import { ErrorBanner, IconTile, StatusPill, SurfaceCard, ScreenHero, HERO_OVERLAP, uiStyles } from '../../components/ui';
import { colors, radius, spacing, type, ORDER_STATUS } from '../../theme/tokens';

const STAGES = [
  { key: 'pending', label: 'Order Placed' },
  { key: 'picked_up', label: 'Picked Up' },
  { key: 'in_facility', label: 'In Facility' },
  { key: 'quality_check', label: 'Quality Check' },
  { key: 'out_for_delivery', label: 'Out for Delivery' },
  { key: 'delivered', label: 'Delivered' },
];

export default function TrackOrderScreen({ navigation, route }) {
  const [code, setCode] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const track = async (value = code) => {
    if (!value.trim()) return;
    setLoading(true);
    setError('');
    setOrder(null);
    try {
      const res = await api.entities.Order.filter({ order_code: value.trim().toUpperCase() });
      if (res.length) setOrder(res[0]);
      else setError('No order found with that code.');
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  // "Track My Order" after checkout passes the new order's code — fill it in
  // and look it up straight away, then clear the param so it isn't reused.
  const handedCode = route?.params?.code;
  useEffect(() => {
    if (!handedCode) return;
    setCode(handedCode);
    track(handedCode);
    navigation.setParams({ code: undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handedCode]);

  const currentIndex = order ? STAGES.findIndex((s) => s.key === order.status) : -1;

  return (
    <ScrollView style={uiStyles.screen} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <ScreenHero overlap icon="map-marker-path" title="Track your order" subtitle="Enter your order code to follow your garment's journey" />

      <SurfaceCard style={styles.searchCard}>

        <AppTextInput
          label="Order code"
          value={code}
          onChangeText={setCode}
          autoCapitalize="characters"
          placeholder="e.g. T2-AB12CD"
          style={styles.input}
          left={<AppTextInput.Icon icon="pound" />}
          onSubmitEditing={() => track()}
          returnKeyType="search"
        />
        <Button
          mode="contained"
          icon="magnify"
          onPress={() => track()}
          loading={loading}
          disabled={loading || !code.trim()}
          style={uiStyles.btn}
          contentStyle={uiStyles.btnContent}
          labelStyle={uiStyles.btnLabel}>
          Track
        </Button>
        <ErrorBanner message={error} style={styles.error} />
      </SurfaceCard>

      {loading && <ActivityIndicator style={styles.loader} color={colors.navy} />}

      {order && (
        <>
          <View style={styles.summary}>
            <View style={styles.flex}>
              <Text style={styles.summaryLabel}>Order code</Text>
              <Text style={styles.summaryCode}>{order.order_code}</Text>
              <View style={styles.summaryPill}>
                <StatusPill status={order.status} />
              </View>
            </View>
            <View style={styles.summaryRight}>
              <Text style={styles.summaryLabel}>Total</Text>
              <Text style={styles.summaryTotal}>{order.total} {order.currency || 'QAR'}</Text>
            </View>
          </View>

          <SurfaceCard style={styles.section}>
            <Text style={[type.h3, styles.sectionTitle]}>Order progress</Text>
            {STAGES.map((s, i) => {
              const done = i < currentIndex;
              const current = i === currentIndex;
              const reached = i <= currentIndex;
              return (
                <View key={s.key} style={styles.stageRow}>
                  <View style={styles.rail}>
                    <View style={[styles.node, reached && styles.nodeReached, current && styles.nodeCurrent]}>
                      <Icon source={done ? 'check' : ORDER_STATUS[s.key].icon} size={16} color={reached ? '#fff' : colors.textFaint} />
                    </View>
                    {i < STAGES.length - 1 && <View style={[styles.connector, i < currentIndex && styles.connectorDone]} />}
                  </View>
                  <View style={styles.stageBody}>
                    <Text style={[styles.stageLabel, reached && styles.stageLabelReached]}>{s.label}</Text>
                    {current && <Text style={styles.stageNow}>Current status</Text>}
                  </View>
                </View>
              );
            })}
          </SurfaceCard>

          <SurfaceCard style={styles.section}>
            <Text style={[type.h3, styles.sectionTitle]}>Items in this order</Text>
            {(order.items || []).map((it, i) => (
              <View key={i} style={styles.itemRow}>
                <View style={styles.qtyBadge}>
                  <Text style={styles.qtyText}>{it.quantity}x</Text>
                </View>
                <View style={styles.flex}>
                  <Text style={styles.itemName}>{it.name}</Text>
                  <Text style={styles.itemMeta}>{it.service} · {it.category}</Text>
                </View>
                <Text style={styles.itemPrice}>{it.price * it.quantity} QAR</Text>
              </View>
            ))}
          </SurfaceCard>

          <View style={styles.metaGrid}>
            <SurfaceCard style={styles.metaBox}>
              <IconTile icon="truck-outline" size={34} tone="navy" />
              <Text style={[styles.summaryLabel, styles.metaLabel]}>Pickup</Text>
              <Text style={styles.metaValue}>{order.pickup_type} · {order.pickup_slot}</Text>
              {!!order.pickup_date && <Text style={styles.itemMeta}>{order.pickup_date}</Text>}
            </SurfaceCard>
            <SurfaceCard style={styles.metaBox}>
              <IconTile icon="account-outline" size={34} tone="navy" />
              <Text style={[styles.summaryLabel, styles.metaLabel]}>Customer</Text>
              <Text style={styles.metaValue}>{order.customer_name}</Text>
              <Text style={styles.itemMeta}>{order.customer_phone}</Text>
            </SurfaceCard>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: spacing.lg, paddingBottom: 40 },
  searchCard: { padding: spacing.xl, marginTop: -HERO_OVERLAP },
  input: { marginBottom: spacing.md },
  error: { marginTop: spacing.md },
  loader: { marginTop: spacing.xxl },

  summary: { flexDirection: 'row', backgroundColor: colors.navy, borderRadius: radius.xl, padding: spacing.xl, marginTop: spacing.lg },
  summaryLabel: { fontSize: 10, fontWeight: '700', color: colors.onDarkMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
  summaryCode: { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: 0.5, marginTop: 2 },
  summaryPill: { marginTop: spacing.sm },
  summaryRight: { alignItems: 'flex-end' },
  summaryTotal: { color: colors.gold, fontSize: 20, fontWeight: '800', marginTop: 2 },

  section: { marginTop: spacing.lg },
  sectionTitle: { marginBottom: spacing.md },
  stageRow: { flexDirection: 'row', gap: spacing.md },
  rail: { alignItems: 'center', width: 34 },
  node: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceMuted, borderWidth: 1.5, borderColor: colors.border },
  nodeReached: { backgroundColor: colors.navy, borderColor: colors.navy },
  nodeCurrent: { backgroundColor: colors.cyanDark, borderColor: colors.cyanSoft, borderWidth: 4 },
  connector: { width: 2, flex: 1, minHeight: 14, backgroundColor: colors.border, marginVertical: 2 },
  connectorDone: { backgroundColor: colors.navy },
  stageBody: { flex: 1, paddingTop: 7, paddingBottom: spacing.md },
  stageLabel: { fontSize: 14, color: colors.textFaint, fontWeight: '600' },
  stageLabelReached: { color: colors.navy, fontWeight: '700' },
  stageNow: { fontSize: 11, color: colors.cyanDark, fontWeight: '700', marginTop: 2 },

  itemRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surfaceMuted, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  qtyBadge: { minWidth: 36, height: 36, borderRadius: 10, backgroundColor: colors.cyanSoft, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  qtyText: { fontSize: 12, fontWeight: '800', color: colors.cyanDark },
  itemName: { fontWeight: '700', color: colors.navy, fontSize: 14 },
  itemMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  itemPrice: { fontWeight: '800', color: colors.navy, fontSize: 13 },

  metaGrid: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  metaBox: { flex: 1 },
  metaLabel: { color: colors.textFaint, marginTop: spacing.md },
  metaValue: { fontWeight: '700', fontSize: 13, color: colors.navy, marginTop: 2, textTransform: 'capitalize' },
});
