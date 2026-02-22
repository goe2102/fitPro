import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../../constants/Config';
import { CustomInput } from '../../components/CustomInput';
import { CustomButton } from '../../components/CustomButton';
import { registerUser } from '../../methods/auth/auth';
import { Ionicons } from '@expo/vector-icons';

const MIN_PASSWORD_LENGTH = 6;

export default function RegisterScreen() {
  const { colors, spacing } = useAppTheme();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Inline validation
  const passwordTooShort = password.length > 0 && password.length < MIN_PASSWORD_LENGTH;
  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const canSubmit =
    email.trim().length > 0 &&
    password.length >= MIN_PASSWORD_LENGTH &&
    password === confirmPassword;

  const handleRegister = async () => {
    setLoading(true);
    setSubmitError('');
    try {
      await registerUser(email, password);
    } catch (e: any) {
      setSubmitError(e.message);
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
        <Pressable
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: colors.card }]}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={18} color={colors.text} />
        </Pressable>

        <Text style={[styles.eyebrow, { color: colors.primary }]}>Get started</Text>
        <Text style={[styles.title, { color: colors.text }]}>Sign Up</Text>

        <View style={styles.fields}>
          <CustomInput
            label="Email"
            value={email}
            onChangeText={(t) => { setEmail(t); setSubmitError(''); }}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          <CustomInput
            label="Password"
            value={password}
            onChangeText={(t) => { setPassword(t); setSubmitError(''); }}
            secureTextEntry
            autoComplete="new-password"
            // Error text shown below but no border color change
            error={passwordTooShort ? `At least ${MIN_PASSWORD_LENGTH} characters` : undefined}
          />
          <CustomInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={(t) => { setConfirmPassword(t); setSubmitError(''); }}
            secureTextEntry
            autoComplete="new-password"
            error={passwordMismatch ? "Passwords don't match" : undefined}
          />

          {!!submitError && (
            <Text style={[styles.errorText, { color: colors.error }]}>{submitError}</Text>
          )}
        </View>
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
          title="Create Account"
          onPress={handleRegister}
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
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
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
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 12,
  },
});