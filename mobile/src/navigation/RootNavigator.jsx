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

  return (
    <NavigationContainer>
      {role === 'admin' ? <AdminNavigator /> : <CustomerNavigator />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
});
