import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator } from 'react-native-paper';
import { useAuth } from '../lib/AuthContext';
import CustomerNavigator from './CustomerNavigator';
import AdminNavigator from './AdminNavigator';

export default function RootNavigator() {
  const { isLoadingAuth, role } = useAuth();

  if (isLoadingAuth) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color="#0E2346" />
      </View>
    );
  }

  const isAdmin = role === 'admin';

  // Both navigators have a root route named 'Tabs', so swapping one for the
  // other inside the same container carries the old tab state across (e.g.
  // the admin's Dashboard/Orders routes nested under the customer's Tabs
  // after logout), which breaks tab presses. Keying the container on the
  // role gives each side a fresh navigation state on login/logout.
  return (
    <NavigationContainer key={isAdmin ? 'admin' : 'customer'}>
      {isAdmin ? <AdminNavigator /> : <CustomerNavigator />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
});
