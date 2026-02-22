import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Pressable,
} from 'react-native';
import { useAppTheme } from '../../constants/Config';
import { CustomButton } from '../../components/CustomButton';
import { resendVerification, logoutUser } from '../../methods/auth/auth';
import { auth } from '../../constants/FirebaseConfig';
import { Ionicons } from '@expo/vector-icons';

export default function VerifyScreen() {
  const { colors, spacing } = useAppTheme();
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const checkVerification = async () => {
    setLoading(true);
    await auth.currentUser?.reload();
    if (!auth.currentUser?.emailVerified) {
      Alert.alert('Not verified yet', 'Please tap the link in your email first.');
    }
    setLoading(false);
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await resendVerification();
      Alert.alert('Sent!', 'Check your inbox for a new verification link.');
    } catch {
      Alert.alert('Error', 'Could not resend. Try again shortly.');
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.content,
          {
            paddingTop: spacing.GLOBAL_MARGIN_TOP,
            paddingHorizontal: spacing.PADDING_HORIZONTAL,
          },
        ]}
      >
        <View style={[styles.iconBadge, { backgroundColor: colors.primary + '15' }]}>
          <Ionicons name="mail-outline" size={32} color={colors.primary} />
        </View>

        <Text style={[styles.eyebrow, { color: colors.primary }]}>One more step</Text>
        <Text style={[styles.title, { color: colors.text }]}>Check your email</Text>
        <Text style={[styles.subtitle, { color: colors.tabIconDefault }]}>
          We sent a verification link to your email address. Tap it to activate your account.
        </Text>

        <View style={styles.secondaryActions}>
          <Pressable
            onPress={handleResend}
            disabled={resending}
            style={({ pressed }) => [
              styles.textButton,
              { opacity: pressed || resending ? 0.5 : 1 },
            ]}
          >
            <Text style={[styles.textButtonLabel, { color: colors.primary }]}>
              {resending ? 'Sending…' : 'Resend verification email'}
            </Text>
          </Pressable>

          <Pressable
            onPress={logoutUser}
            style={({ pressed }) => [
              styles.textButton,
              { opacity: pressed ? 0.5 : 1 },
            ]}
          >
            <Text style={[styles.textButtonLabel, { color: colors.tabIconDefault }]}>
              Log out
            </Text>
          </Pressable>
        </View>
      </View>

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
          title="I've verified my email"
          onPress={checkVerification}
          loading={loading}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1, paddingBottom: 120 },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 18,
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
    marginBottom: 14,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.1,
    marginBottom: 36,
  },
  secondaryActions: { gap: 2 },
  textButton: { paddingVertical: 10 },
  textButtonLabel: {
    fontSize: 15,
    fontWeight: '500',
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