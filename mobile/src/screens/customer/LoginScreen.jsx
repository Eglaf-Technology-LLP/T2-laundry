import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import AppTextInput from '../../components/AppTextInput';
import { useAuth, ADMIN_NOT_ALLOWED } from '../../lib/AuthContext';
import { goToTab, TAB_NAMES } from '../../navigation/goToTab';
import { AuthHeader, HERO_OVERLAP, ErrorBanner, SurfaceCard, uiStyles } from '../../components/ui';
import { colors, spacing } from '../../theme/tokens';

// Used two ways: as a pushed stack screen (e.g. from the cart, with a `next`
// route to continue to), and `embedded` inside the Account tab, where the
// tab itself swaps to the account page on login and `onShowSignup` swaps
// this form for the sign-up form in place.
export default function LoginScreen({ navigation, route, embedded, onShowSignup }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const nextScreen = route?.params?.next;

  const onSubmit = async () => {
    setError('');
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      // In the Account tab, going "back" would jump to another tab — the tab
      // re-renders as the account page on its own.
      if (embedded) return;
      if (nextScreen && TAB_NAMES.includes(nextScreen)) goToTab(navigation, nextScreen);
      else if (nextScreen) navigation.replace(nextScreen);
      else if (navigation.canGoBack()) navigation.goBack();
    } catch (e) {
      setError(e?.code === ADMIN_NOT_ALLOWED ? e.message : 'Invalid email or password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAwareScrollView
      style={styles.flex}
      contentContainerStyle={styles.container}
      enableOnAndroid
      extraScrollHeight={20}
      keyboardShouldPersistTaps="handled">
      <AuthHeader title="Welcome back" subtitle="Log in to manage your bookings" />

      <SurfaceCard style={styles.formCard}>
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
          disabled={submitting || !email || !password}
          contentStyle={uiStyles.btnContent}
          labelStyle={uiStyles.btnLabel}
          style={[uiStyles.btn, styles.btn]}>
          Log In
        </Button>
      </SurfaceCard>

      <Button
        mode="text"
        onPress={() => (onShowSignup ? onShowSignup() : navigation.navigate('Signup'))}
        textColor={colors.cyanDark}
        labelStyle={styles.linkLabel}
        style={styles.linkBtn}>
        Don't have an account? Create account
      </Button>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: { flexGrow: 1, padding: spacing.xxl },
  formCard: { marginTop: -HERO_OVERLAP },
  input: { marginBottom: 14 },
  error: { marginBottom: spacing.sm },
  btn: { marginTop: spacing.xs },
  linkBtn: { marginTop: spacing.lg },
  linkLabel: { fontWeight: '700' },
});
