import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Icon } from 'react-native-paper';
import { colors, shadow } from '../theme/tokens';

// A fully custom tab bar (passed as the Navigator's `tabBar` prop) instead of
// fighting react-navigation's built-in tabBarIcon/tabBarButton slots, which
// clip their content to fixed sizes meant for an icon alone — that's what
// kept hiding the label. Here every element is sized by its own content, so
// nothing gets cut off, and the active tab's pill + focus state are fully
// under our control.
//
// `icons` maps route name -> [inactiveIcon, activeIcon] MaterialCommunityIcons
// names (outline when idle, filled when focused).
export default function CustomTabBar({ state, descriptors, navigation, insets, icons, labels, iconSize = 22, labelSize = 11 }) {
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 6) }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const { options } = descriptors[route.key];
        const [idleIcon, activeIcon] = icons[route.name];

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        };
        const onLongPress = () => navigation.emit({ type: 'tabLongPress', target: route.key });

        const color = focused ? colors.navy : colors.textFaint;

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            onLongPress={onLongPress}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel || labels[route.name]}
            testID={options.tabBarButtonTestID}
            android_ripple={{ color: colors.navySoft, borderless: true }}
            style={styles.item}>
            {/* key forces a fresh native view whenever a tab's focus state
                flips, instead of Android re-using the old node and — on
                every route except whichever was focused at first mount —
                failing to re-establish the rounded-corner clip on the
                backgroundColor update. */}
            <View key={focused ? 'active' : 'inactive'} style={focused ? styles.pillActive : styles.pill}>
              <Icon source={focused ? activeIcon : idleIcon} size={iconSize} color={focused ? colors.cyanDark : color} />
            </View>
            <Text numberOfLines={1} style={[styles.label, { fontSize: labelSize, color }, focused && styles.labelActive]}>
              {labels[route.name]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 8,
    ...shadow.raised,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  pill: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 52,
    height: 30,
    borderRadius: 15,
    // Android can otherwise let backgroundColor bleed past a View's rounded
    // corners (square them off) once a sibling view's elevation/shadow forces
    // a re-composite — overflow: 'hidden' pins the clip every render.
    overflow: 'hidden',
  },
  pillActive: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 52,
    height: 30,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: colors.cyanSoft,
  },
  label: {
    fontWeight: '600',
    marginTop: 3,
  },
  labelActive: {
    fontWeight: '800',
  },
});
