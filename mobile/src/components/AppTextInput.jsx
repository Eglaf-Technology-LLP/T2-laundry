import React from 'react';
import { StyleSheet } from 'react-native';
import { TextInput } from 'react-native-paper';

// Single source of truth for text field styling — every screen in the app
// should import this instead of react-native-paper's TextInput directly, so
// a look-and-feel change (or another keyboard/accessibility fix) only has
// to happen in one place. Keeps TextInput.Icon/.Affix available the same way
// callers already use them (AppTextInput.Icon).
export default function AppTextInput({ style, ...props }) {
  return <TextInput mode="outlined" style={[styles.input, style]} outlineStyle={styles.outline} {...props} />;
}

AppTextInput.Icon = TextInput.Icon;
AppTextInput.Affix = TextInput.Affix;

const styles = StyleSheet.create({
  input: { marginBottom: 12, backgroundColor: '#fff' },
  outline: { borderRadius: 12 },
});
