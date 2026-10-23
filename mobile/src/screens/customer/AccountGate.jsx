import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, ActivityIndicator } from 'react-native-paper';
import { useAuth } from '../../lib/AuthContext';
import AccountScreen from './AccountScreen';
import { EmptyState, uiStyles } from '../../components/ui';
import { colors, spacing } from '../../theme/tokens';

// Tab equivalent of the web app's RequireAuth wrapper around /account — a tab
// can't redirect the way a route guard does, so show a login prompt in place
// instead of navigating away from the tab the user just tapped.
export default function AccountGate({ navigation }) {
  const { isLoadingAuth, isAuthenticated } = useAuth();

  if (isLoadingAuth) return <ActivityIndicator style={styles.loader} color={colors.navy} />;

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <EmptyState icon="account-lock-outline" title="Log in to view your account" message="Track memberships, addresses and past orders.">
          <View style={styles.actions}>
            <Button mode="contained" style={uiStyles.btn} contentStyle={uiStyles.btnContent} labelStyle={uiStyles.btnLabel} onPress={() => navigation.navigate('Login')}>
              Log In
            </Button>
            <Button mode="outlined" style={[uiStyles.btn, styles.outlined]} contentStyle={uiStyles.btnContent} labelStyle={uiStyles.btnLabel} onPress={() => navigation.navigate('Signup')}>
              Create an account
            </Button>
          </View>
        </EmptyState>
      </View>
    );
  }

  return <AccountScreen navigation={navigation} />;
}

const styles = StyleSheet.create({
  loader: { marginTop: 60 },
  container: { flex: 1, justifyContent: 'center', backgroundColor: colors.bg },
  actions: { alignSelf: 'stretch', gap: spacing.md, marginTop: spacing.xxl },
  outlined: { borderColor: colors.navy, borderWidth: 1.2 },
});
