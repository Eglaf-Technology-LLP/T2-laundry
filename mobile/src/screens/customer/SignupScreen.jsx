import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, HelperText, Avatar } from 'react-native-paper';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import AppTextInput from '../../components/AppTextInput';
import { useAuth } from '../../lib/AuthContext';

const NAVY = '#0E2346';

export default function SignupScreen({ navigation, route }) {
  const { signup } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [needsEmailConfirm, setNeedsEmailConfirm] = useState(false);

  const nextScreen = route.params?.next;

  const onSubmit = async () => {
    setError('');
    setSubmitting(true);
    try {
      const loggedIn = await signup(email.trim(), password, fullName.trim());
      if (loggedIn) {
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
      <View style={styles.container}>
        <Avatar.Icon size={56} icon="email-check-outline" style={styles.avatar} color="#fff" />
        <Text variant="headlineMedium" style={styles.title}>Check your email</Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          We've sent a confirmation link to {email}. Click it, then come back and log in.
        </Text>
        <Button mode="contained" style={styles.btn} contentStyle={styles.btnContent} onPress={() => navigation.replace('Login')}>Go to login</Button>
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
      <Avatar.Icon size={56} icon="account-plus-outline" style={styles.avatar} color="#fff" />
      <Text variant="headlineMedium" style={styles.title}>Create your account</Text>
      <Text variant="bodyMedium" style={styles.subtitle}>Sign up to subscribe to a membership</Text>

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

      {!!error && <HelperText type="error" visible>{error}</HelperText>}

      <Button
        mode="contained"
        onPress={onSubmit}
        loading={submitting}
        disabled={submitting || !fullName || !email || !password}
        contentStyle={styles.btnContent}
        style={styles.btn}>
        Create account
      </Button>

      <Button mode="text" onPress={() => navigation.navigate('Login')} style={styles.linkBtn}>
        Already have an account? Log in
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
