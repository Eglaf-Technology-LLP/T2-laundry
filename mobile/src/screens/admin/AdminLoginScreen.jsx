import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import AppTextInput from '../../components/AppTextInput';
import { useAuth } from '../../lib/AuthContext';
import { api } from '../../api/client';
import { AuthHeader, HERO_OVERLAP, ErrorBanner, SurfaceCard, uiStyles } from '../../components/ui';
import { colors, spacing } from '../../theme/tokens';

export default function AdminLoginScreen({ navigation }) {
  const { login, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    setError('');
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      // login() only proves valid credentials — RootNavigator switches to the
      // admin app based on profile.role, so confirm that role here rather
      // than leaving a non-admin silently signed in on this screen.
      const profile = await api.auth.getProfile();
      if (profile?.role !== 'admin') {
        await logout();
        setError('This account does not have admin access.');
      }
      // On success, AuthContext's role flips to 'admin' and RootNavigator
      // swaps to the admin tabs automatically — nothing else to do here.
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
      <AuthHeader badge="Staff only" title="Admin sign in" subtitle="T2 Laundry command center" />

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
          icon="shield-lock-outline"
          onPress={onSubmit}
          loading={submitting}
          disabled={submitting || !email || !password}
          contentStyle={uiStyles.btnContent}
          labelStyle={uiStyles.btnLabel}
          style={[uiStyles.btn, styles.btn]}>
          Sign in
        </Button>
      </SurfaceCard>

      <Button mode="text" icon="arrow-left" onPress={() => navigation.goBack()} textColor={colors.textMuted} style={styles.linkBtn}>
        Back
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
});
