import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Link } from 'expo-router';
import { useAppTheme } from '../../constants/Config';
import { CustomInput } from '../../components/CustomInput';
import { CustomButton } from '../../components/CustomButton';
import { loginUser } from '../../methods/auth/auth';

export default function LoginScreen() {
  const { colors, spacing } = useAppTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = email.trim().length > 0 && password.length > 0;

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await loginUser(email, password);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: spacing.GLOBAL_MARGIN_TOP,
            paddingHorizontal: spacing.PADDING_HORIZONTAL,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.eyebrow, { color: colors.primary }]}>Welcome back</Text>
        <Text style={[styles.title, { color: colors.text }]}>Log In</Text>

        <View style={styles.fields}>
          <CustomInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          <CustomInput
            label="Password"
            value={password}
            onChangeText={(t) => { setPassword(t); setError(''); }}
            secureTextEntry
            autoComplete="current-password"
          />
          {/* Error shown here, below last field, not tied to field color */}
          {!!error && (
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          )}
        </View>

        <Link
          href="/(auth)/register"
          style={[styles.link, { color: colors.primary }]}
        >
          New here? Create an account
        </Link>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingHorizontal: spacing.PADDING_HORIZONTAL,
            paddingBottom: spacing.BOTTOM_INSET > 0 ? spacing.BOTTOM_INSET + 8 : 24,
            backgroundColor: colors.background,
          },
        ]}
      >
        <CustomButton
          title="Log In"
          onPress={handleLogin}
          loading={loading}
          disabled={!canSubmit}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: 120 },
  eyebrow: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
    opacity: 0.8,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 36,
  },
  fields: { gap: 4 },
  errorText: {
    fontSize: 13,
    marginTop: 2,
    marginLeft: 4,
    letterSpacing: 0.1,
  },
  link: {
    fontSize: 14,
    marginTop: 20,
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 12,
  },
});