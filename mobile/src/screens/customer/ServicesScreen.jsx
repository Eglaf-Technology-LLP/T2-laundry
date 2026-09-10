import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, FlatList, Pressable } from 'react-native';
import { Text, Chip, Badge } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../api/client';
import { useAuth } from '../../lib/AuthContext';
import { useCart } from '../../lib/CartContext';
import ItemCard from '../../components/ItemCard';
import AppTextInput from '../../components/AppTextInput';
import FilterScrollRow from '../../components/FilterScrollRow';

const NAVY = '#0E2346';
const GOLD = '#B08D2C';

const CategoryChip = memo(function CategoryChip({ name, active, onSelect }) {
  return (
    <Chip selected={active} showSelectedCheck={false} onPress={() => onSelect(name)} style={active ? styles.chipActive : styles.chip} textStyle={active ? { color: '#fff' } : undefined}>
      {name}
    </Chip>
  );
});

export default function ServicesScreen({ navigation }) {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const { lines, planState, setPlanState, addLine, changeQty } = useCart();
  const [items, setItems] = useState([]);
  const [cats, setCats] = useState([]);
  const [activeCat, setActiveCat] = useState('All');
  const [query, setQuery] = useState('');

  useEffect(() => {
    Promise.all([
      api.entities.Item.list('display_order', 100),
      api.entities.Category.list('display_order', 50),
    ]).then(([i, c]) => {
      setItems(i);
      setCats([{ name: 'All', slug: 'all' }, ...c]);
    });
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
        <Text style={styles.subtitle}>Choose items, pick a service, and build your order</Text>

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
        ListEmptyComponent={<Text style={styles.emptyText}>No items found.</Text>}
      />

      {count > 0 && (
        <Pressable style={styles.cartBar} onPress={() => navigation.navigate('Cart')}>
          <Text style={styles.cartBarText}>{count} item{count !== 1 ? 's' : ''}</Text>
          <View style={styles.rowGap}>
            <Text style={styles.cartBarText}>{billedTotal} QAR</Text>
            <Badge>{count}</Badge>
          </View>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f8fafc' },
  listContent: { padding: 16, paddingBottom: 100, gap: 12 },
  columnWrapper: { gap: 12 },
  header: { marginBottom: 4 },
  subtitle: { textAlign: 'center', color: '#64748b' },
  search: { marginTop: 16 },
  catList: { gap: 8, paddingVertical: 12 },
  chip: { backgroundColor: '#fff' },
  chipActive: { backgroundColor: NAVY },
  emptyText: { textAlign: 'center', color: '#94a3b8', paddingVertical: 60 },
  cartBar: { position: 'absolute', bottom: 16, left: 16, right: 16, backgroundColor: NAVY, borderRadius: 18, paddingVertical: 16, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 6 },
  cartBarText: { color: '#fff', fontWeight: '700' },
  rowGap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
