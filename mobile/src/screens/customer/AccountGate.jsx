import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, ActivityIndicator } from 'react-native-paper';
import { useAuth } from '../../lib/AuthContext';
import AccountScreen from './AccountScreen';

// Tab equivalent of the web app's RequireAuth wrapper around /account — a tab
// can't redirect the way a route guard does, so show a login prompt in place
// instead of navigating away from the tab the user just tapped.
export default function AccountGate({ navigation }) {
  const { isLoadingAuth, isAuthenticated } = useAuth();

  if (isLoadingAuth) return <ActivityIndicator style={{ marginTop: 60 }} />;

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <Text variant="headlineSmall" style={styles.title}>Log in to view your account</Text>
        <Text style={styles.subtitle}>Track memberships, addresses and past orders.</Text>
        <Button mode="contained" style={{ marginTop: 20 }} onPress={() => navigation.navigate('Login')}>Log In</Button>
        <Button mode="text" onPress={() => navigation.navigate('Signup')}>Create an account</Button>
      </View>
    );
  }

  return <AccountScreen navigation={navigation} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { color: '#0E2346', fontWeight: '700', textAlign: 'center' },
  subtitle: { color: '#64748b', textAlign: 'center', marginTop: 8 },
});
