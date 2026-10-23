import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { IconButton } from 'react-native-paper';
import { colors, shadow } from '../theme/tokens';

const NAVY = colors.navy;

// Wraps a horizontal filter-chip FlatList with prev/next chevrons — every
// screen with a horizontal filter row (category/status chips) used to make
// people manually swipe to discover chips past the edge, with no sign there
// was more to scroll to. This gives every one of them the same stepper
// controls, each chevron disabling itself once its end of the row is fully
// in view.
const FilterScrollRow = forwardRef(function FilterScrollRow(
  { data, keyExtractor, renderItem, contentContainerStyle, style },
  ref
) {
  const listRef = useRef(null);
  const [visibleRange, setVisibleRange] = useState({ first: 0, last: 0 });
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (!viewableItems.length) return;
    const indices = viewableItems.map((v) => v.index).filter((i) => i != null);
    setVisibleRange({ first: Math.min(...indices), last: Math.max(...indices) });
  });
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 100 });

  const scrollToIndex = (opts) => listRef.current?.scrollToIndex(opts);
  useImperativeHandle(ref, () => ({ scrollToIndex }));

  const goPrev = () => scrollToIndex({ index: Math.max(0, visibleRange.first - 1), animated: true, viewPosition: 0 });
  const goNext = () => scrollToIndex({ index: Math.min(data.length - 1, visibleRange.last + 1), animated: true, viewPosition: 1 });

  const atStart = visibleRange.first <= 0;
  const atEnd = visibleRange.last >= data.length - 1;

  return (
    <View style={[styles.row, style]}>
      <IconButton
        icon="chevron-left"
        size={18}
        iconColor={NAVY}
        disabled={atStart}
        onPress={goPrev}
        style={[styles.navBtn, atStart && styles.navBtnOff]}
        accessibilityLabel="Scroll filters left"
      />
      <FlatList
        ref={listRef}
        data={data}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={contentContainerStyle}
        style={styles.list}
        onViewableItemsChanged={onViewableItemsChanged.current}
        viewabilityConfig={viewabilityConfig.current}
        onScrollToIndexFailed={({ index }) => {
          setTimeout(() => scrollToIndex({ index, animated: true, viewPosition: 0.5 }), 50);
        }}
        renderItem={renderItem}
      />
      <IconButton
        icon="chevron-right"
        size={18}
        iconColor={NAVY}
        disabled={atEnd}
        onPress={goNext}
        style={[styles.navBtn, atEnd && styles.navBtnOff]}
        accessibilityLabel="Scroll filters right"
      />
    </View>
  );
});

export default FilterScrollRow;

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  list: { flex: 1 },
  // Small round "stepper" buttons; once an end of the row is fully in view
  // its button fades out (but keeps its space so the chips don't jump).
  navBtn: { margin: 0, width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, ...shadow.card },
  navBtnOff: { opacity: 0.35, elevation: 0, shadowOpacity: 0 },
});
