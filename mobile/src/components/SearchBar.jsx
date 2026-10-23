import React from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import { Icon } from 'react-native-paper';
import { colors, radius, shadow } from '../theme/tokens';

// Pill-shaped search field for list screens — lighter than the outlined
// AppTextInput (no floating label), with a clear button once there's text.
export default function SearchBar({ value, onChangeText, placeholder, style }) {
  return (
    <View style={[styles.bar, style]}>
      <Icon source="magnify" size={22} color={colors.cyanDark} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        style={styles.input}
        returnKeyType="search"
        autoCorrect={false}
        selectionColor={colors.cyanDark}
        accessibilityLabel={placeholder}
      />
      {!!value && (
        <Pressable onPress={() => onChangeText('')} hitSlop={10} style={styles.clear} accessibilityRole="button" accessibilityLabel="Clear search">
          <Icon source="close" size={14} color={colors.textMuted} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 52,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.raised,
    shadowOpacity: 0.1,
  },
  input: { flex: 1, fontSize: 15, color: colors.text, paddingVertical: 0 },
  clear: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
});
