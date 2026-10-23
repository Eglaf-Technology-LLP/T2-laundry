import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator } from 'react-native-paper';
import { useAuth } from '../lib/AuthContext';
import CustomerNavigator from './CustomerNavigator';

// The mobile app is customer-only. The admin screens/navigators are kept in
// the codebase but not reachable here — admins use the web dashboard, and
// AuthContext refuses admin sign-ins on mobile.
export default function RootNavigator() {
  const { isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color="#0E2346" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <CustomerNavigator />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
});
