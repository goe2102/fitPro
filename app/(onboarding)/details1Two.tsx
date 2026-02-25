import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAppTheme } from '../../constants/Config';
import { CustomButton } from '../../components/CustomButton';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../constants/FirebaseConfig';
import { OccupationPicker, Occupation } from '../../components/OccupationPicker';
import { ActivityLevelPicker, ActivityLevel } from '../../components/ActivitiyLevelPicker';

const DetailsOneTwoScreen = () => {
  const { user } = useAuth();
  const { colors, spacing } = useAppTheme();
  const [loading, setLoading] = useState(false);

  const [occupation, setOccupation] = useState<Occupation | null>(null);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | null>(null);

  const disabled = !occupation || !activityLevel;

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to save this data.');
      return;
    }
    if (!occupation || !activityLevel) {
      Alert.alert('Missing info', 'Please select your occupation and activity level.');
      return;
    }

    try {
      setLoading(true);
      await setDoc(
        doc(db, 'users', user.uid),
        { occupation, activityLevel },
        { merge: true }
      );
      router.push('/detailsTwo');
    } catch (error) {
      console.error('Error saving occupation/activity:', error);
      Alert.alert('Error', 'Could not save your details. Please try again.');
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
        {/* Back button */}
        <Pressable
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: colors.card }]}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={18} color={colors.text} />
        </Pressable>

        <Text style={[styles.eyebrow, { color: colors.primary }]}>Step 2</Text>
        <Text style={[styles.title, { color: colors.text }]}>Your Lifestyle</Text>
        <Text style={[styles.subtitle, { color: colors.tabIconDefault }]}>
          We use this to calculate your daily calorie needs more accurately.
        </Text>

        {/* ── Occupation ─────────────────────────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: colors.text }]}>What are you doing right now?</Text>
        <OccupationPicker value={occupation} onChange={setOccupation} />

        <View style={{ height: 32 }} />

        {/* ── Activity Level ─────────────────────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: colors.text }]}>How active are you?</Text>
        <Text style={[styles.sectionSub, { color: colors.tabIconDefault }]}>
          This multiplier is applied to your base metabolic rate (BMR) to estimate total daily calories burned.
        </Text>
        <ActivityLevelPicker
          value={activityLevel}
          onChange={setActivityLevel}
          showHealthHint
        />

        <View style={{ height: 120 }} />
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingHorizontal: spacing.PADDING_HORIZONTAL,
            paddingBottom: spacing.BOTTOM_INSET > 0 ? spacing.BOTTOM_INSET + 8 : 24,
            backgroundColor: colors.background,
            borderTopColor: colors.card,
          },
        ]}
      >
        <CustomButton
          title="Next Step"
          onPress={handleSubmit}
          loading={loading}
          disabled={disabled}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

export default DetailsOneTwoScreen;

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1 },
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    letterSpacing: 0.1,
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 6,
  },
  sectionSub: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 14,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 12,
    borderTopWidth: 1,
  },
});