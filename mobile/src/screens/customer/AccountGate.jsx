import React, { useEffect, useLayoutEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { useAuth } from '../../lib/AuthContext';
import AccountScreen from './AccountScreen';
import LoginScreen from './LoginScreen';
import SignupScreen from './SignupScreen';
import { colors } from '../../theme/tokens';

// The last bottom tab: the account page when logged in, otherwise the login
// form itself (tab label "Login"). "Sign up" swaps to the create-account form
// in place — no pushed screen, so there's no back button to deal with — and
// logging in/signing up flips this tab straight to the account page.
export default function AccountGate({ navigation }) {
  const { isLoadingAuth, isAuthenticated } = useAuth();
  const [mode, setMode] = useState('login');

  // Always come back to the login form (not a half-filled sign-up) after a logout.
  useEffect(() => {
    if (!isAuthenticated) setMode('login');
  }, [isAuthenticated]);

  useLayoutEffect(() => {
    const title = isAuthenticated ? 'Account' : mode === 'signup' ? 'Create Account' : 'Log In';
    navigation.setOptions({ title });
  }, [navigation, isAuthenticated, mode]);

  if (isLoadingAuth) return <ActivityIndicator style={styles.loader} color={colors.navy} />;

  if (!isAuthenticated) {
    return mode === 'signup' ? (
      <SignupScreen navigation={navigation} embedded onShowLogin={() => setMode('login')} />
    ) : (
      <LoginScreen navigation={navigation} embedded onShowSignup={() => setMode('signup')} />
    );
  }

  return <AccountScreen navigation={navigation} />;
}

const styles = StyleSheet.create({
  loader: { marginTop: 60 },
});
