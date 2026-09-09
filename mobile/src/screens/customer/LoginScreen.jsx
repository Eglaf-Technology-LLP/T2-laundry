import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, HelperText, Avatar } from 'react-native-paper';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import AppTextInput from '../../components/AppTextInput';
import { useAuth } from '../../lib/AuthContext';

const NAVY = '#0E2346';

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
      if (nextScreen) navigation.replace(nextScreen);
      else navigation.goBack();
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
      <Avatar.Icon size={56} icon="lock-outline" style={styles.avatar} color="#fff" />
      <Text variant="headlineMedium" style={styles.title}>Welcome back</Text>
      <Text variant="bodyMedium" style={styles.subtitle}>Log in to manage your bookings</Text>

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
        Log In
      </Button>

      <Button mode="text" onPress={() => navigation.navigate('Signup')} style={styles.linkBtn}>
        Don't have an account? Sign up
      </Button>
      <Button mode="text" onPress={() => navigation.navigate('AdminLogin')} textColor="#94a3b8" compact>
        Staff / Admin login
      </Button>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  avatar: { alignSelf: 'center', backgroundColor: NAVY, marginBottom: 16 },
  title: { textAlign: 'center', marginBottom: 4, fontWeight: '700', color: NAVY },
  subtitle: { textAlign: 'center', marginBottom: 28, color: '#64748b' },
  input: { marginBottom: 14 },
  btn: { marginTop: 8, borderRadius: 12 },
  btnContent: { paddingVertical: 6 },
  linkBtn: { marginTop: 12 },
});
