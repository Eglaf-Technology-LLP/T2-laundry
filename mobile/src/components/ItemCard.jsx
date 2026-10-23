import React, { memo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, IconButton, Icon } from 'react-native-paper';
import { colors, radius, shadow } from '../theme/tokens';

const SERVICE_OPTIONS = [
  { key: 'wash_price', label: 'Wash' },
  { key: 'iron_price', label: 'Iron' },
  { key: 'wash_iron_price', label: 'Wash & Iron' },
  { key: 'dryclean_price', label: 'Dry Clean' },
];

function ItemCard({ item, inPlan, lines = [], onSelectService, onQty }) {
  const available = SERVICE_OPTIONS.filter((o) => (item[o.key] || 0) > 0);
  const lineFor = (key) => lines.find((l) => l.serviceKey === key);
  const total = lines.reduce((s, l) => s + l.price * l.quantity, 0);

  return (
    <View style={[styles.card, lines.length > 0 && styles.cardSelected]}>
      {item.popular && (
        <View style={styles.popularBadge}>
          <Icon source="fire" size={10} color={colors.navy} />
          <Text style={styles.popularText}>Popular</Text>
        </View>
      )}
      <Text style={styles.category} numberOfLines={1}>{item.category}</Text>
      <Text style={styles.name} numberOfLines={2}>{item.name}</Text>

      {inPlan && (
        <View style={styles.planChip}>
          <Icon source="crown" size={10} color={colors.success} />
          <Text style={styles.planChipText}>Included in your plan</Text>
        </View>
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
                <Text style={[styles.serviceLabel, isActive && styles.serviceLabelActive]} numberOfLines={1}>{o.label}</Text>
                <Text style={[styles.servicePrice, isActive && styles.servicePriceActive]}>
                  {isActive ? `${item[o.key] * line.quantity} QAR` : `${item[o.key]} QAR`}
                </Text>
              </View>

              {isActive ? (
                <View style={styles.stepper}>
                  <IconButton icon="minus" size={14} iconColor="#fff" style={styles.stepperBtn} onPress={() => onQty(item.id, o.key, -1)} accessibilityLabel={`Remove one ${o.label}`} />
                  <Text style={styles.stepperValue}>{line.quantity}</Text>
                  <IconButton icon="plus" size={14} iconColor={colors.navy} style={[styles.stepperBtn, styles.stepperBtnPlus]} onPress={() => onQty(item.id, o.key, 1)} accessibilityLabel={`Add one ${o.label}`} />
                </View>
              ) : (
                <Pressable
                  style={({ pressed }) => [styles.addBtn, pressed && styles.addBtnPressed]}
                  onPress={() => onSelectService(item, o.key)}
                  accessibilityRole="button"
                  accessibilityLabel={`Add ${item.name} ${o.label}`}
                  hitSlop={6}>
                  <Icon source="plus" size={16} color={colors.navy} />
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

// react-navigation's FlatList re-creates `lines.filter(...)` for every card on
// every cart mutation, so a shallow prop comparison would still re-render
// every visible card whenever any single item's quantity changes — compare
// the filtered lines by content instead of reference so only the card(s)
// whose own quantity/services actually changed re-render.
function linesEqual(a, b) {
  if (a.length !== b.length) return false;
  return a.every((l, i) => l.serviceKey === b[i].serviceKey && l.quantity === b[i].quantity);
}

function areEqual(prev, next) {
  return (
    prev.item === next.item &&
    prev.inPlan === next.inPlan &&
    prev.onSelectService === next.onSelectService &&
    prev.onQty === next.onQty &&
    linesEqual(prev.lines, next.lines)
  );
}

export default memo(ItemCard, areEqual);

const styles = StyleSheet.create({
  card: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.xl, padding: 14, borderWidth: 1, borderColor: colors.border, position: 'relative', ...shadow.card },
  cardSelected: { borderColor: colors.cyan, borderWidth: 1.5 },
  popularBadge: { position: 'absolute', top: -9, right: 12, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.gold, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3, zIndex: 1 },
  popularText: { fontSize: 9, fontWeight: '800', color: colors.navy },
  category: { fontSize: 10, fontWeight: '700', color: colors.cyanDark, textTransform: 'uppercase', letterSpacing: 0.6 },
  name: { fontSize: 15, fontWeight: '800', color: colors.navy, marginTop: 2 },
  planChip: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', backgroundColor: colors.successSoft, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3, marginTop: 6 },
  planChipText: { fontSize: 9, fontWeight: '700', color: colors.success },
  serviceList: { marginTop: 12, gap: 6 },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingLeft: 10,
    paddingRight: 6,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  serviceRowActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  serviceInfo: { flex: 1, minWidth: 0 },
  serviceLabel: { fontSize: 12, fontWeight: '700', color: colors.textBody },
  serviceLabelActive: { color: '#fff' },
  servicePrice: { fontSize: 11, color: colors.textMuted, marginTop: 1, fontWeight: '600' },
  servicePriceActive: { color: colors.cyan },
  addBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 1.2, borderColor: colors.navy },
  addBtnPressed: { backgroundColor: colors.navySoft },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  stepperBtn: { margin: 0, width: 26, height: 26, backgroundColor: 'rgba(255,255,255,0.15)' },
  stepperBtnPlus: { backgroundColor: colors.cyan },
  stepperValue: { color: '#fff', fontSize: 13, fontWeight: '800', width: 20, textAlign: 'center' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.cyanSoft, borderRadius: radius.md, paddingHorizontal: 10, paddingVertical: 8, marginTop: 10 },
  summaryText: { fontSize: 11, color: colors.navy, fontWeight: '600' },
  summaryPrice: { fontSize: 13, fontWeight: '800', color: colors.navy },
});
