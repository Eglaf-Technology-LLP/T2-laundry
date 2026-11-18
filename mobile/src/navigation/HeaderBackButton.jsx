import React from 'react';
import { StyleSheet } from 'react-native';
import { IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

// Replaces the platform back button on pushed stack screens so Android and
// iOS show the same plain arrow — iOS's native one is a chevron followed by
// the previous route's title ("Tabs").
export default function HeaderBackButton({ canGoBack, tintColor }) {
  const navigation = useNavigation();
  if (!canGoBack) return null;
  return (
    <IconButton
      icon="arrow-left"
      size={24}
      iconColor={tintColor || '#fff'}
      onPress={() => navigation.goBack()}
      accessibilityLabel="Go back"
      style={styles.button}
    />
  );
}

const styles = StyleSheet.create({
  button: { margin: 0, marginLeft: -8 },
});
