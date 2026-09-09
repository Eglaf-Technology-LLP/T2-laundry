import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Text, Button, HelperText, Avatar } from 'react-native-paper';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import AppTextInput from '../../components/AppTextInput';
import { useAuth } from '../../lib/AuthContext';
import { api } from '../../api/client';

const NAVY = '#0E2346';

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
      <Avatar.Icon size={56} icon="shield-account-outline" style={styles.avatar} color="#fff" />
      <Text variant="headlineMedium" style={styles.title}>Admin sign in</Text>
      <Text variant="bodyMedium" style={styles.subtitle}>T2 Laundry command center</Text>

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

      {!!error && <HelperText type="error" visible>{error}</HelperText>}

      <Button mode="contained" onPress={onSubmit} loading={submitting} disabled={submitting || !email || !password} contentStyle={styles.btnContent} style={styles.btn}>
        Sign in
      </Button>
      <Button mode="text" onPress={() => navigation.goBack()} style={styles.linkBtn}>
        Back
      </Button>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  avatar: { alignSelf: 'center', backgroundColor: NAVY, marginBottom: 16 },
  title: { marginBottom: 4, fontWeight: '700', textAlign: 'center', color: NAVY },
  subtitle: { marginBottom: 28, color: '#64748b', textAlign: 'center' },
  input: { marginBottom: 14 },
  btn: { marginTop: 8, borderRadius: 12 },
  btnContent: { paddingVertical: 6 },
  linkBtn: { marginTop: 12 },
});
