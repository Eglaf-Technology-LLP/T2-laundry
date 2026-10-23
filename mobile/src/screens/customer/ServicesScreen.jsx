import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, FlatList, Pressable } from 'react-native';
import { Text, Icon, ActivityIndicator } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../api/client';
import { useAuth } from '../../lib/AuthContext';
import { useCart } from '../../lib/CartContext';
import ItemCard from '../../components/ItemCard';
import SearchBar from '../../components/SearchBar';
import FilterScrollRow from '../../components/FilterScrollRow';
import { EmptyState, ScreenHero, HERO_OVERLAP } from '../../components/ui';
import { colors, radius, shadow, spacing, type } from '../../theme/tokens';

const CategoryChip = memo(function CategoryChip({ name, count, active, onSelect }) {
  return (
    <Pressable
      onPress={() => onSelect(name)}
      style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && !active && styles.chipPressed]}
      accessibilityRole="button"
      accessibilityState={active ? { selected: true } : {}}>
      {name === 'All' && <Icon source="view-grid-outline" size={15} color={active ? '#fff' : colors.textMuted} />}
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{name}</Text>
      <View style={[styles.chipCount, active && styles.chipCountActive]}>
        <Text style={[styles.chipCountText, active && styles.chipCountTextActive]}>{count}</Text>
      </View>
    </Pressable>
  );
});

export default function ServicesScreen({ navigation }) {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const { lines, planState, setPlanState, addLine, changeQty } = useCart();
  const [items, setItems] = useState([]);
  const [cats, setCats] = useState([]);
  const [activeCat, setActiveCat] = useState('All');
  const [query, setQuery] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      api.entities.Item.list('display_order', 100),
      api.entities.Category.list('display_order', 50),
    ]).then(([i, c]) => {
      setItems(i);
      setCats([{ name: 'All', slug: 'all' }, ...c]);
    }).finally(() => setLoaded(true));
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (isLoadingAuth) return;
      if (!isAuthenticated) { setPlanState({ membership: null, planItemIds: [] }); return; }
      api.membership.getMyPlanState().then(setPlanState).catch(() => {});
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, isLoadingAuth])
  );

  const filtered = useMemo(() => {
    return items.filter((it) => {
      const catOk = activeCat === 'All' || it.category === activeCat;
      const qOk = !query || it.name.toLowerCase().includes(query.toLowerCase());
      return catOk && qOk && it.active;
    });
  }, [items, activeCat, query]);

  // Per-category item counts for the chip badges (same `active` rule as the list).
  const catCounts = useMemo(() => {
    const counts = { All: 0 };
    items.forEach((it) => {
      if (!it.active) return;
      counts.All += 1;
      counts[it.category] = (counts[it.category] || 0) + 1;
    });
    return counts;
  }, [items]);

  const count = lines.reduce((s, l) => s + l.quantity, 0);
  const billedTotal = lines.reduce((s, l) => s + l.price * l.quantity, 0);

  const renderItem = useCallback(
    ({ item }) => (
      <ItemCard
        item={item}
        inPlan={planState.planItemIds.includes(item.id)}
        lines={lines.filter((l) => l.id === item.id)}
        onSelectService={addLine}
        onQty={changeQty}
      />
    ),
    [planState.planItemIds, lines, addLine, changeQty]
  );

  const renderCategory = useCallback(
    ({ item: c }) => <CategoryChip name={c.name} count={catCounts[c.name] || 0} active={activeCat === c.name} onSelect={setActiveCat} />,
    [activeCat, catCounts]
  );

  // Otherwise this rebuilds (and the nested category FlatList re-renders
  // every chip) on every ServicesScreen render — including ones caused by
  // cart quantity changes elsewhere, which have nothing to do with the
  // search box or category list — making category taps feel sluggish.
  const listHeader = useMemo(
    () => (
      <View style={styles.header}>
        <ScreenHero overlap icon="washing-machine" title="What needs care today?" subtitle="Choose items, pick a service, and build your order" />

        <SearchBar value={query} onChangeText={setQuery} placeholder="Search Kurta, Thobe, Bedsheet…" style={styles.search} />

        <View style={styles.filterHead}>
          <Text style={styles.filterTitle}>Categories</Text>
          <Text style={styles.resultText}>
            {filtered.length} item{filtered.length === 1 ? '' : 's'}{activeCat !== 'All' ? ` in ${activeCat}` : ''}
          </Text>
        </View>

        <FilterScrollRow
          data={cats}
          keyExtractor={(c) => c.slug}
          contentContainerStyle={styles.catList}
          renderItem={renderCategory}
        />
      </View>
    ),
    [query, cats, renderCategory, filtered.length, activeCat]
  );

  return (
    <View style={styles.flex}>
      <FlatList
        data={filtered}
        keyExtractor={(it) => it.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={listHeader}
        renderItem={renderItem}
        ListEmptyComponent={
          loaded ? (
            <EmptyState icon="tshirt-crew-outline" title="No items found" message="Try a different search or category." />
          ) : (
            <ActivityIndicator style={styles.loader} color={colors.navy} />
          )
        }
      />

      {count > 0 && (
        <Pressable style={({ pressed }) => [styles.cartBar, pressed && styles.cartBarPressed]} onPress={() => navigation.navigate('Cart')} accessibilityRole="button">
          <View style={styles.cartIcon}>
            <Icon source="basket" size={20} color={colors.navy} />
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{count}</Text>
            </View>
          </View>
          <View style={styles.grow}>
            <Text style={styles.cartBarText}>{count} item{count !== 1 ? 's' : ''}</Text>
            <Text style={styles.cartBarSub}>{billedTotal} QAR</Text>
          </View>
          <View style={styles.rowGap}>
            <Text style={styles.cartBarText}>View order</Text>
            <Icon source="arrow-right" size={18} color="#fff" />
          </View>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  grow: { flex: 1 },
  listContent: { padding: spacing.lg, paddingBottom: 110, gap: spacing.md },
  columnWrapper: { gap: spacing.md },
  header: { marginBottom: 4 },
  search: { marginTop: -HERO_OVERLAP },
  filterHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: spacing.xl, marginBottom: 2 },
  filterTitle: { ...type.h3 },
  resultText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  catList: { gap: spacing.sm, paddingVertical: spacing.sm, paddingHorizontal: 2 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 38, paddingLeft: 14, paddingRight: 6, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.navy, borderColor: colors.navy, ...shadow.card },
  chipPressed: { backgroundColor: colors.navySoft },
  chipText: { fontSize: 13, fontWeight: '700', color: colors.textBody },
  chipTextActive: { color: '#fff' },
  chipCount: { minWidth: 24, height: 24, borderRadius: 12, paddingHorizontal: 6, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  chipCountActive: { backgroundColor: colors.cyan },
  chipCountText: { fontSize: 11, fontWeight: '800', color: colors.textMuted },
  chipCountTextActive: { color: colors.navy },
  loader: { paddingVertical: 60 },
  cartBar: { position: 'absolute', bottom: spacing.lg, left: spacing.lg, right: spacing.lg, backgroundColor: colors.navy, borderRadius: radius.xl, paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: spacing.md, ...shadow.raised },
  cartBarPressed: { opacity: 0.92 },
  cartIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.cyan, alignItems: 'center', justifyContent: 'center' },
  cartBadge: { position: 'absolute', top: -5, right: -5, minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 4, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.navy },
  cartBadgeText: { fontSize: 10, fontWeight: '800', color: colors.navy },
  cartBarText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  cartBarSub: { color: colors.cyan, fontWeight: '700', fontSize: 12, marginTop: 1 },
  rowGap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
