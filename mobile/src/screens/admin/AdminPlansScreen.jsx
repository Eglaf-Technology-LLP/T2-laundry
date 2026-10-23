import React, { useCallback, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Text, IconButton, ActivityIndicator, Chip, FAB } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../api/client';
import { colors, shadow } from '../../theme/tokens';

const NAVY = colors.navy;
const GOLD = colors.goldDark;

export default function AdminPlansScreen({ navigation }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api.entities.SubscriptionPlan.list('price').then(setPlans).finally(() => setLoading(false));
  }, []);
  useFocusEffect(load);

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
                <IconButton icon="pencil-outline" size={18} onPress={() => navigation.navigate('PlanForm', { plan })} />
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
            <Text style={styles.manageLink} onPress={() => navigation.navigate('PlanForm', { plan })}>Manage included items & services</Text>
            {plan.popular && <Chip compact style={styles.bestValueChip} textStyle={styles.bestValueChipText}>Best Value</Chip>}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No plans yet.</Text>}
      />

      <FAB icon="plus" color="#fff" style={styles.fab} onPress={() => navigation.navigate('PlanForm')} label="Add Plan" />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  countText: { color: '#64748b', fontSize: 12, marginBottom: 8 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border, ...shadow.card },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowGap: { flexDirection: 'row', alignItems: 'center' },
  navyBold: { color: NAVY, fontWeight: '700' },
  navy: { color: NAVY, fontWeight: '700' },
  dim: { color: '#94a3b8', fontSize: 11 },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginTop: 8 },
  price: { fontSize: 22, fontWeight: '700', color: NAVY },
  feature: { fontSize: 12, color: '#64748b', marginTop: 4 },
  manageLink: { fontSize: 12, color: '#64748b', marginTop: 8, textDecorationLine: 'underline' },
  bestValueChip: { alignSelf: 'flex-start', backgroundColor: 'rgba(212,175,55,0.15)', marginTop: 8 },
  bestValueChipText: { fontSize: 9, color: GOLD },
  emptyText: { textAlign: 'center', color: '#94a3b8', paddingVertical: 40 },
  fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: NAVY },
});
