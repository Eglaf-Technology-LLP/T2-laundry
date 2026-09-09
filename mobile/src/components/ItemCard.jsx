import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, Chip, IconButton } from 'react-native-paper';

const SERVICE_OPTIONS = [
  { key: 'wash_price', label: 'Wash' },
  { key: 'iron_price', label: 'Iron' },
  { key: 'wash_iron_price', label: 'Wash & Iron' },
  { key: 'dryclean_price', label: 'Dry Clean' },
];

const NAVY = '#0E2346';
const GOLD = '#D4AF37';

export default function ItemCard({ item, inPlan, lines = [], onSelectService, onQty }) {
  const available = SERVICE_OPTIONS.filter((o) => (item[o.key] || 0) > 0);
  const lineFor = (key) => lines.find((l) => l.serviceKey === key);
  const total = lines.reduce((s, l) => s + l.price * l.quantity, 0);

  return (
    <View style={styles.card}>
      {item.popular && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularText}>Popular</Text>
        </View>
      )}
      <View style={styles.headerRow}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.category}>{item.category}</Text>
      </View>

      {inPlan && (
        <Chip compact style={styles.planChip} textStyle={styles.planChipText}>
          Included in your plan
        </Chip>
      )}

      {/* One consistent-height row per service — a 2-column grid made the
          inactive (label+price) and active (label+stepper+price) states
          different heights, so rows never lined up. */}
      <View style={styles.serviceList}>
        {available.map((o) => {
          const line = lineFor(o.key);
          const isActive = !!line;

          return (
            <View key={o.key} style={[styles.serviceRow, isActive && styles.serviceRowActive]}>
              <View style={styles.serviceInfo}>
                <Text style={[styles.serviceLabel, isActive && styles.serviceLabelActive]}>{o.label}</Text>
                <Text style={[styles.servicePrice, isActive && styles.servicePriceActive]}>
                  {isActive ? `${item[o.key] * line.quantity} QAR` : `${item[o.key]} QAR`}
                </Text>
              </View>

              {isActive ? (
                <View style={styles.stepper}>
                  <IconButton icon="minus" size={14} iconColor="#fff" style={styles.stepperBtn} onPress={() => onQty(item.id, o.key, -1)} />
                  <Text style={styles.stepperValue}>{line.quantity}</Text>
                  <IconButton icon="plus" size={14} iconColor="#fff" style={styles.stepperBtn} onPress={() => onQty(item.id, o.key, 1)} />
                </View>
              ) : (
                <Pressable style={styles.addBtn} onPress={() => onSelectService(item, o.key)} accessibilityRole="button">
                  <Text style={styles.addBtnText}>Add</Text>
                </Pressable>
              )}
            </View>
          );
        })}
      </View>

      {lines.length > 0 && (
        <View style={styles.summaryRow}>
          <Text style={styles.summaryText}>{lines.length} service{lines.length > 1 ? 's' : ''} selected</Text>
          <Text style={styles.summaryPrice}>{total} QAR</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, backgroundColor: '#fff', borderRadius: 18, padding: 14, elevation: 1, position: 'relative' },
  popularBadge: { position: 'absolute', top: -8, right: 12, backgroundColor: GOLD, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, zIndex: 1 },
  popularText: { fontSize: 9, fontWeight: '700', color: NAVY },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  name: { fontSize: 14, fontWeight: '700', color: NAVY, flex: 1 },
  category: { fontSize: 9, color: '#94a3b8', textTransform: 'uppercase' },
  planChip: { alignSelf: 'flex-start', backgroundColor: '#d1fae5', marginTop: 6, height: 22 },
  planChipText: { fontSize: 9, color: '#047857' },
  serviceList: { marginTop: 10, gap: 6 },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 40,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fafafa',
  },
  serviceRowActive: { backgroundColor: NAVY, borderColor: NAVY },
  serviceInfo: { flex: 1, minWidth: 0 },
  serviceLabel: { fontSize: 12, fontWeight: '600', color: '#334155' },
  serviceLabelActive: { color: '#fff' },
  servicePrice: { fontSize: 10, color: '#94a3b8', marginTop: 1 },
  servicePriceActive: { color: 'rgba(255,255,255,0.75)' },
  addBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: NAVY },
  addBtnText: { fontSize: 11, fontWeight: '700', color: NAVY },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  stepperBtn: { margin: 0, width: 26, height: 26, backgroundColor: 'rgba(255,255,255,0.15)' },
  stepperValue: { color: '#fff', fontSize: 13, fontWeight: '700', width: 20, textAlign: 'center' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#f8fafc', borderRadius: 12, padding: 8, marginTop: 10 },
  summaryText: { fontSize: 11, color: '#64748b' },
  summaryPrice: { fontSize: 12, fontWeight: '700', color: '#B08D2C' },
});
