import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator } from 'react-native-paper';
import { useAuth } from '../lib/AuthContext';
import CustomerNavigator from './CustomerNavigator';
import AdminNavigator from './AdminNavigator';

export default function RootNavigator() {
  const { isLoadingAuth, role } = useAuth();
  const isAdmin = role === 'admin';

  // After an admin logs out, the customer app mounts fresh (see the key
  // below) and would open on Home — land on Account instead so they can log
  // straight back in. A cold start or a customer logout keeps the defaults
  // (customers can only log out from the Account tab, so they're already there).
  const [lastIsAdmin, setLastIsAdmin] = useState(isAdmin);
  const [customerInitialTab, setCustomerInitialTab] = useState(undefined);
  if (isAdmin !== lastIsAdmin) {
    setLastIsAdmin(isAdmin);
    setCustomerInitialTab(isAdmin ? undefined : 'Account');
  }

  if (isLoadingAuth) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color="#0E2346" />
      </View>
    );
  }

  // Both navigators have a root route named 'Tabs', so swapping one for the
  // other inside the same container carries the old tab state across (e.g.
  // the admin's Dashboard/Orders routes nested under the customer's Tabs
  // after logout), which breaks tab presses. Keying the container on the
  // role gives each side a fresh navigation state on login/logout.
  return (
    <NavigationContainer key={isAdmin ? 'admin' : 'customer'}>
      {isAdmin ? <AdminNavigator /> : <CustomerNavigator initialTab={customerInitialTab} />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
});
