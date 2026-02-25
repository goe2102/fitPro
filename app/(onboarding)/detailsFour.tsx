import React, { useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { doc, setDoc } from 'firebase/firestore';
import { useAppTheme } from '../../constants/Config';
import { CustomButton } from '../../components/CustomButton';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../constants/FirebaseConfig';
import { useUserProfile } from '../../hooks/useUserProfile';
import { calculateUserMetrics } from '../../methods/auth/calculateUserMetrics';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAge(birthdayIso: string): number {
  const birth = new Date(birthdayIso);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
  ) age--;
  return age;
}

const OCCUPATION_LABELS: Record<string, string> = {
  student: '🎓 Student',
  fulltime: '💼 Full-time Employee',
  parttime: '⏰ Part-time Employee',
  freelance: '💻 Freelancer',
  homemaker: '🏠 Homemaker',
  retired: '🌅 Retired',
  unemployed: '🔍 Not currently working',
};

const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: '🛋️ Sedentary',
  lightly_active: '🚶 Lightly Active',
  moderately_active: '🏃 Moderately Active',
  very_active: '🏋️ Very Active',
  extremely_active: '🔥 Extremely Active',
};

const GOAL_LABELS: Record<string, string> = {
  weight_loss: '📉 Lose weight',
  weight_maintaining: '⚖️ Maintain weight',
  weight_gaining: '📈 Gain weight',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={summaryStyles.row}>
      <View style={[summaryStyles.iconBox, { backgroundColor: colors.primary + '15' }]}>
        <Ionicons name={icon} size={16} color={colors.primary} />
      </View>
      <Text style={[summaryStyles.label, { color: colors.tabIconDefault }]}>{label}</Text>
      <Text style={[summaryStyles.value, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

function MetricCard({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={[metricStyles.card, { backgroundColor: colors.card }]}>
      <View style={[metricStyles.dot, { backgroundColor: color }]} />
      <Text style={[metricStyles.value, { color: colors.text }]}>
        {value}<Text style={[metricStyles.unit, { color: colors.tabIconDefault }]}> {unit}</Text>
      </Text>
      <Text style={[metricStyles.label, { color: colors.tabIconDefault }]}>{label}</Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function DetailsFourScreen() {
  const { colors, spacing } = useAppTheme();
  const { user } = useAuth();
  const { profile, loading } = useUserProfile();

  const [healthEnabled, setHealthEnabled] = useState(false);
  const [healthLoading, setHealthLoading] = useState(false);
  const [finishing, setFinishing] = useState(false);

  const metrics = profile ? calculateUserMetrics({ ...profile }) : null;

  // ── Request health permissions (iOS ONLY) ────────────────────────────────
  const requestHealthPermission = async () => {
    if (Platform.OS !== 'ios') {
      Alert.alert('Unavailable', 'Health sync is currently only available on iOS.');
      return;
    }

    setHealthLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const rnh: any = require('react-native-health');
      const AppleHealthKit: any = rnh.default ?? rnh.AppleHealthKit ?? rnh;

      if (!AppleHealthKit?.initHealthKit) {
        Alert.alert('Not available', 'react-native-health is not installed correctly.');
        return;
      }

      const P: any = AppleHealthKit.Constants?.Permissions ?? {};
      const healthKitOptions = {
        permissions: {
          read: [
            P.Steps ?? 'Steps',
            P.ActiveEnergyBurned ?? 'ActiveEnergyBurned',
            P.BasalEnergyBurned ?? 'BasalEnergyBurned',
            P.HeartRate ?? 'HeartRate',
            P.Weight ?? 'Weight',
          ],
          write: [] as string[],
        },
      };

      AppleHealthKit.initHealthKit(healthKitOptions, (err: any) => {
        if (err) {
          console.error('[HealthKit] Init error:', err);
          Alert.alert('Permission denied', 'You can enable this later in Apple Health → FitPro.');
        } else {
          setHealthEnabled(true);
        }
      });
    } catch (err) {
      console.error('[Health] Permission error:', err);
      Alert.alert('Error', 'Could not request health permissions.');
    } finally {
      setHealthLoading(false);
    }
  };

  // ── Finish onboarding ────────────────────────────────────────────────────
  const handleFinish = async () => {
    if (!user || !profile || !metrics) {
      Alert.alert('Error', 'Could not calculate your profile. Please go back and check your details.');
      return;
    }

    setFinishing(true);
    try {
      await setDoc(
        doc(db, 'users', user.uid),
        {
          bmr: metrics.bmr,
          tdee: metrics.tdee,
          dailyCalorieTarget: metrics.dailyCalorieTarget,
          dailyProteinTarget: metrics.dailyProteinTarget,
          dailyCarbsTarget: metrics.dailyCarbsTarget,
          dailyFatTarget: metrics.dailyFatTarget,
          healthDataEnabled: healthEnabled,
          isOnboarded: true,
        },
        { merge: true },
      );

      router.replace('/(tabs)');
    } catch (err) {
      console.error('[DetailsFour] Finish error:', err);
      Alert.alert('Error', 'Could not save your profile. Please try again.');
    } finally {
      setFinishing(false);
    }
  };

  if (loading || !profile) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.tabIconDefault }}>Loading your profile…</Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: spacing.GLOBAL_MARGIN_TOP, paddingHorizontal: spacing.PADDING_HORIZONTAL },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: colors.card }]}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={18} color={colors.text} />
        </Pressable>

        <Text style={[styles.eyebrow, { color: colors.primary }]}>Final Step</Text>
        <Text style={[styles.title, { color: colors.text }]}>You're all set 🎉</Text>
        <Text style={[styles.subtitle, { color: colors.tabIconDefault }]}>
          Here's a summary of what we've calculated for you.
        </Text>

        {/* ── Health Data Card (iOS Only text) ──────────────────────────── */}
        <Pressable
          onPress={healthEnabled ? undefined : requestHealthPermission}
          style={[
            styles.healthCard,
            {
              backgroundColor: healthEnabled ? colors.primary + '12' : colors.card,
              borderColor: healthEnabled ? colors.primary : 'transparent',
            },
          ]}
        >
          <View style={[styles.healthIconCircle, { backgroundColor: healthEnabled ? colors.primary + '20' : colors.background }]}>
            <Ionicons
              name={healthEnabled ? 'heart-circle' : 'heart-circle-outline'}
              size={28}
              color={healthEnabled ? colors.primary : colors.tabIconDefault}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.healthTitle, { color: colors.text }]}>
              {healthEnabled ? '✅  Health Data Connected' : 'Connect Apple Health'}
            </Text>
            <Text style={[styles.healthSub, { color: colors.tabIconDefault }]}>
              {healthEnabled
                ? 'Steps & active calories will sync automatically on app launch.'
                : 'Import steps, active calories & heart rate automatically.'}
            </Text>
          </View>
          {!healthEnabled && (
            <View style={[styles.connectBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.connectBadgeText}>
                {healthLoading ? '…' : 'Connect'}
              </Text>
            </View>
          )}
        </Pressable>

        {/* ── Profile Summary ───────────────────────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: colors.text }]}>Your Profile</Text>
        <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
          <SummaryRow icon="calendar-outline" label="Age" value={`${getAge(profile.birthday)} years old`} />
          <SummaryRow icon="male-female-outline" label="Gender" value={profile.gender === 'secret' ? 'Prefer not to say' : profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)} />
          <SummaryRow icon="resize-outline" label="Height" value={`${profile.height} cm`} />
          <SummaryRow icon="barbell-outline" label="Weight" value={`${profile.weight} kg`} />
          <SummaryRow icon="briefcase-outline" label="Occupation" value={OCCUPATION_LABELS[profile.occupation] ?? profile.occupation} />
          <SummaryRow icon="fitness-outline" label="Activity" value={ACTIVITY_LABELS[profile.activityLevel] ?? profile.activityLevel} />
          <SummaryRow icon="flag-outline" label="Goal" value={GOAL_LABELS[profile.goal] ?? profile.goal} />
          {profile.goal !== 'weight_maintaining' && (
            <SummaryRow
              icon="scale-outline"
              label="Target weight"
              value={`${profile.aimedWeight} kg by ${new Date(profile.aimedDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`}
            />
          )}
        </View>

        {/* ── Calculated Metrics ────────────────────────────────────────── */}
        {metrics && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.text }]}>Your Daily Targets</Text>
            <View style={styles.metricsGrid}>
              <MetricCard label="Calories" value={metrics.dailyCalorieTarget} unit="kcal" color={colors.primary} />
              <MetricCard label="Protein" value={metrics.dailyProteinTarget} unit="g" color="#3b82f6" />
              <MetricCard label="Carbs" value={metrics.dailyCarbsTarget} unit="g" color="#f59e0b" />
              <MetricCard label="Fat" value={metrics.dailyFatTarget} unit="g" color="#ec4899" />
            </View>

            <View style={[styles.bmrRow, { backgroundColor: colors.card }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.bmrLabel, { color: colors.tabIconDefault }]}>Basal Metabolic Rate</Text>
                <Text style={[styles.bmrValue, { color: colors.text }]}>{metrics.bmr} kcal</Text>
                <Text style={[styles.bmrSub, { color: colors.tabIconDefault }]}>Calories burned at complete rest</Text>
              </View>
              <View style={[styles.bmrDivider, { backgroundColor: colors.background }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.bmrLabel, { color: colors.tabIconDefault }]}>Total Daily Burn</Text>
                <Text style={[styles.bmrValue, { color: colors.text }]}>{metrics.tdee} kcal</Text>
                <Text style={[styles.bmrSub, { color: colors.tabIconDefault }]}>Estimated with activity level</Text>
              </View>
            </View>

            <View style={[styles.methodNote, { backgroundColor: colors.card }]}>
              <Ionicons name="information-circle-outline" size={16} color={colors.tabIconDefault} />
              <Text style={[styles.methodNoteText, { color: colors.tabIconDefault }]}>
                Calculated using the Mifflin-St Jeor equation — the most accurate formula for most people. Targets adjust as your weight and activity change.
              </Text>
            </View>
          </>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
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
          title="Finish & Start FitPro 🚀"
          onPress={handleFinish}
          loading={finishing}
          disabled={!metrics}
        />
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1 },
  backButton: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', marginBottom: 28,
  },
  eyebrow: {
    fontSize: 13, fontWeight: '600', letterSpacing: 1.2,
    textTransform: 'uppercase', marginBottom: 8, opacity: 0.8,
  },
  title: { fontSize: 34, fontWeight: '700', letterSpacing: -0.5, marginBottom: 8 },
  subtitle: { fontSize: 15, letterSpacing: 0.1, marginBottom: 28 },
  sectionLabel: { fontSize: 17, fontWeight: '700', letterSpacing: -0.2, marginBottom: 12, marginTop: 8 },
  healthCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 16, borderRadius: 18, borderWidth: 1.5, marginBottom: 28,
  },
  healthIconCircle: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  healthTitle: { fontSize: 15, fontWeight: '700', marginBottom: 3 },
  healthSub: { fontSize: 12, lineHeight: 17 },
  connectBadge: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
  },
  connectBadgeText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  summaryCard: { borderRadius: 18, overflow: 'hidden', marginBottom: 24 },
  metricsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14,
  },
  bmrRow: {
    flexDirection: 'row', borderRadius: 16, padding: 16, gap: 4, marginBottom: 12,
  },
  bmrLabel: { fontSize: 11, fontWeight: '500', marginBottom: 3 },
  bmrValue: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  bmrSub: { fontSize: 11, marginTop: 2, lineHeight: 15 },
  bmrDivider: { width: 1, marginHorizontal: 12 },
  methodNote: {
    flexDirection: 'row', gap: 10, padding: 14, borderRadius: 14, marginBottom: 8,
  },
  methodNoteText: { flex: 1, fontSize: 12, lineHeight: 18 },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingTop: 12, borderTopWidth: 1,
  },
});

const summaryStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 13, gap: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(128,128,128,0.08)',
  },
  iconBox: {
    width: 30, height: 30, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  label: { flex: 1, fontSize: 14, fontWeight: '500' },
  value: { fontSize: 14, fontWeight: '600', textAlign: 'right', maxWidth: '50%' },
});

const metricStyles = StyleSheet.create({
  card: {
    width: '47%', borderRadius: 14, padding: 14,
    gap: 4, alignItems: 'flex-start',
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginBottom: 4 },
  value: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  unit: { fontSize: 13, fontWeight: '500' },
  label: { fontSize: 12, fontWeight: '500' },
});