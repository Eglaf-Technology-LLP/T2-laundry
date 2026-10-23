import React from 'react';
import { StyleSheet } from 'react-native';
import { TextInput } from 'react-native-paper';
import { colors, radius } from '../theme/tokens';

// Single source of truth for text field styling — every screen in the app
// should import this instead of react-native-paper's TextInput directly, so
// a look-and-feel change (or another keyboard/accessibility fix) only has
// to happen in one place. Keeps TextInput.Icon/.Affix available the same way
// callers already use them (AppTextInput.Icon).
export default function AppTextInput({ style, ...props }) {
  return (
    <TextInput
      mode="outlined"
      style={[styles.input, style]}
      outlineStyle={styles.outline}
      outlineColor={colors.border}
      activeOutlineColor={colors.cyanDark}
      textColor={colors.text}
      placeholderTextColor={colors.textFaint}
      {...props}
    />
  );
}

AppTextInput.Icon = TextInput.Icon;
AppTextInput.Affix = TextInput.Affix;

const styles = StyleSheet.create({
  input: { marginBottom: 12, backgroundColor: colors.surface, fontSize: 15 },
  outline: { borderRadius: radius.md, borderWidth: 1.2 },
});
