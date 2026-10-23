import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, FlatList, Pressable } from 'react-native';
import { Text, Icon, ActivityIndicator } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../api/client';
import { useAuth } from '../../lib/AuthContext';
import { useCart } from '../../lib/CartContext';
import ItemCard from '../../components/ItemCard';
import AppTextInput from '../../components/AppTextInput';
import FilterScrollRow from '../../components/FilterScrollRow';
import { EmptyState } from '../../components/ui';
import { colors, radius, shadow, spacing, type } from '../../theme/tokens';

const CategoryChip = memo(function CategoryChip({ name, active, onSelect }) {
  return (
    <Pressable
      onPress={() => onSelect(name)}
      style={[styles.chip, active && styles.chipActive]}
      accessibilityRole="button"
      accessibilityState={active ? { selected: true } : {}}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{name}</Text>
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
    ({ item: c }) => <CategoryChip name={c.name} active={activeCat === c.name} onSelect={setActiveCat} />,
    [activeCat]
  );

  // Otherwise this rebuilds (and the nested category FlatList re-renders
  // every chip) on every ServicesScreen render — including ones caused by
  // cart quantity changes elsewhere, which have nothing to do with the
  // search box or category list — making category taps feel sluggish.
  const listHeader = useMemo(
    () => (
      <View style={styles.header}>
        <View style={styles.intro}>
          <Text style={type.h1}>What needs care today?</Text>
          <Text style={[type.small, styles.subtitle]}>Choose items, pick a service, and build your order</Text>
        </View>

        <AppTextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search Kurta, Thobe, Bedsheet…"
          left={<AppTextInput.Icon icon="magnify" />}
          style={styles.search}
          returnKeyType="search"
        />

        <FilterScrollRow
          data={cats}
          keyExtractor={(c) => c.slug}
          contentContainerStyle={styles.catList}
          renderItem={renderCategory}
        />
      </View>
    ),
    [query, cats, renderCategory]
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
  intro: { marginBottom: spacing.md },
  subtitle: { marginTop: 4 },
  search: { marginTop: 0 },
  catList: { gap: spacing.sm, paddingVertical: spacing.sm },
  chip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.textBody },
  chipTextActive: { color: '#fff' },
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
