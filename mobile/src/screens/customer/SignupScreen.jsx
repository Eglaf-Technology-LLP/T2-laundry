import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import AppTextInput from '../../components/AppTextInput';
import { useAuth } from '../../lib/AuthContext';
import { AuthHeader, EmptyState, ErrorBanner, SurfaceCard, uiStyles } from '../../components/ui';
import { colors, spacing } from '../../theme/tokens';

// Like LoginScreen: a pushed stack screen (carrying `next`/`plan` to resume
// a checkout or subscribe), or `embedded` in the Account tab, where
// `onShowLogin` swaps back to the login form in place.
export default function SignupScreen({ navigation, route, embedded, onShowLogin }) {
  const { signup } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [needsEmailConfirm, setNeedsEmailConfirm] = useState(false);

  const nextScreen = route?.params?.next;
  const showLogin = () => (onShowLogin ? onShowLogin() : navigation.navigate('Login'));

  const onSubmit = async () => {
    setError('');
    setSubmitting(true);
    try {
      const loggedIn = await signup(email.trim(), password, fullName.trim());
      if (loggedIn) {
        // In the Account tab, the tab re-renders as the account page on its own.
        if (embedded) return;
        if (nextScreen) navigation.replace(nextScreen, { plan: route.params?.plan });
        else navigation.goBack();
      } else {
        setNeedsEmailConfirm(true);
      }
    } catch (e) {
      setError(e?.message || "Couldn't create your account. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (needsEmailConfirm) {
    return (
      <View style={[styles.flex, styles.confirmWrap]}>
        <EmptyState
          icon="email-check-outline"
          title="Check your email"
          message={`We've sent a confirmation link to ${email}. Click it, then come back and log in.`}>
          <Button
            mode="contained"
            style={[uiStyles.btn, styles.confirmBtn]}
            contentStyle={uiStyles.btnContent}
            labelStyle={uiStyles.btnLabel}
            onPress={() => (onShowLogin ? onShowLogin() : navigation.replace('Login'))}>
            Go to login
          </Button>
        </EmptyState>
      </View>
    );
  }

  return (
    <KeyboardAwareScrollView
      style={styles.flex}
      contentContainerStyle={styles.container}
      enableOnAndroid
      extraScrollHeight={20}
      keyboardShouldPersistTaps="handled">
      <AuthHeader title="Create your account" subtitle="Sign up to subscribe to a membership" />

      <SurfaceCard>
        <AppTextInput label="Full name" value={fullName} onChangeText={setFullName} left={<AppTextInput.Icon icon="account-outline" />} style={styles.input} />
        <AppTextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          left={<AppTextInput.Icon icon="email-outline" />}
          style={styles.input}
        />
        <AppTextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          left={<AppTextInput.Icon icon="lock-outline" />}
          right={<AppTextInput.Icon icon={showPassword ? 'eye-off-outline' : 'eye-outline'} onPress={() => setShowPassword((v) => !v)} />}
          style={styles.input}
        />

        <ErrorBanner message={error} style={styles.error} />

        <Button
          mode="contained"
          onPress={onSubmit}
          loading={submitting}
          disabled={submitting || !fullName || !email || !password}
          contentStyle={uiStyles.btnContent}
          labelStyle={uiStyles.btnLabel}
          style={[uiStyles.btn, styles.btn]}>
          Create account
        </Button>
      </SurfaceCard>

      <Button mode="text" onPress={showLogin} textColor={colors.cyanDark} labelStyle={styles.linkLabel} style={styles.linkBtn}>
        Already have an account? Log in
      </Button>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: { flexGrow: 1, justifyContent: 'center', padding: spacing.xxl },
  confirmWrap: { justifyContent: 'center' },
  confirmBtn: { marginTop: spacing.xxl, alignSelf: 'stretch' },
  input: { marginBottom: 14 },
  error: { marginBottom: spacing.sm },
  btn: { marginTop: spacing.xs },
  linkBtn: { marginTop: spacing.lg },
  linkLabel: { fontWeight: '700' },
});
