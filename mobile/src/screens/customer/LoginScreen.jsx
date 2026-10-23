import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import AppTextInput from '../../components/AppTextInput';
import { useAuth } from '../../lib/AuthContext';
import { api } from '../../api/client';
import { AuthHeader, ErrorBanner, SurfaceCard, uiStyles } from '../../components/ui';
import { colors, spacing } from '../../theme/tokens';

export default function LoginScreen({ navigation, route }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const nextScreen = route.params?.next;

  const onSubmit = async () => {
    setError('');
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      // An admin credential logging in here flips AuthContext's role, which
      // makes RootNavigator swap the whole customer navigator (this screen
      // included) for the admin one. Manually navigating on top of that — as
      // the code below does for a normal customer login — races the swap:
      // this screen can already be torn down by the time goBack()/replace()
      // runs, so it does nothing or throws. Let the swap handle it instead.
      const loggedInProfile = await api.auth.getProfile();
      if (loggedInProfile?.role === 'admin') return;
      if (nextScreen) navigation.replace(nextScreen);
      else if (navigation.canGoBack()) navigation.goBack();
    } catch {
      setError('Invalid email or password.');
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

      <SurfaceCard>
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

      <Button mode="text" onPress={() => navigation.navigate('Signup')} textColor={colors.cyanDark} labelStyle={styles.linkLabel} style={styles.linkBtn}>
        Don't have an account? Sign up
      </Button>
      <Button mode="text" icon="shield-account-outline" onPress={() => navigation.navigate('AdminLogin')} textColor={colors.textFaint} compact>
        Staff / Admin login
      </Button>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: { flexGrow: 1, justifyContent: 'center', padding: spacing.xxl },
  input: { marginBottom: 14 },
  error: { marginBottom: spacing.sm },
  btn: { marginTop: spacing.xs },
  linkBtn: { marginTop: spacing.lg },
  linkLabel: { fontWeight: '700' },
});
