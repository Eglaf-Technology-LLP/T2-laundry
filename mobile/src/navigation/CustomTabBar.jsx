import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { NAVY, GOLD } from './headerStyle';

const INACTIVE_COLOR = '#9aa1ac';

// A fully custom tab bar (passed as the Navigator's `tabBar` prop) instead of
// fighting react-navigation's built-in tabBarIcon/tabBarButton slots, which
// clip their content to fixed sizes meant for an icon alone — that's what
// kept hiding the label. Here every element is sized by its own content, so
// nothing gets cut off, and the active tab's pill + focus state are fully
// under our control.
export default function CustomTabBar({ state, descriptors, navigation, insets, icons, labels, iconSize = 20, labelSize = 11 }) {
  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const { options } = descriptors[route.key];

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        };
        const onLongPress = () => navigation.emit({ type: 'tabLongPress', target: route.key });

        const color = focused ? '#fff' : INACTIVE_COLOR;

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            onLongPress={onLongPress}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarButtonTestID}
            style={styles.item}>
            {/* key forces a fresh native view whenever a tab's focus state
                flips, instead of Android re-using the old node and — on
                every route except whichever was focused at first mount —
                failing to re-establish the rounded-corner clip on the
                backgroundColor update. */}
            <View key={focused ? 'active' : 'inactive'} style={focused ? styles.pillActive : styles.pill}>
              <Text style={{ fontSize: iconSize, color }}>{icons[route.name]}</Text>
              <Text numberOfLines={1} style={[styles.label, { fontSize: labelSize, color }]}>
                {labels[route.name]}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 2,
    borderTopColor: GOLD,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 8,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  pill: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    // Android can otherwise let backgroundColor bleed past a View's rounded
    // corners (square them off) once a sibling view's elevation/shadow forces
    // a re-composite — overflow: 'hidden' pins the clip every render.
    overflow: 'hidden',
  },
  pillActive: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: NAVY,
  },
  label: {
    fontWeight: '600',
    marginTop: 2,
  },
});
