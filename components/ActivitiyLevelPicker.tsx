import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../constants/Config';

export type ActivityLevel =
  | 'sedentary'
  | 'lightly_active'
  | 'moderately_active'
  | 'very_active'
  | 'extremely_active';

interface ActivityOption {
  value: ActivityLevel;
  label: string;
  emoji: string;
  description: string;
  exampleDays: string;
  calorieBurnModifier: string; // TDEE multiplier label
  multiplier: number; // actual Harris-Benedict multiplier
}

const OPTIONS: ActivityOption[] = [
  {
    value: 'sedentary',
    label: 'Sedentary',
    emoji: '🛋️',
    description: 'Little or no exercise',
    exampleDays: 'Desk job, no planned workouts',
    calorieBurnModifier: '× 1.2  (BMR only)',
    multiplier: 1.2,
  },
  {
    value: 'lightly_active',
    label: 'Lightly Active',
    emoji: '🚶',
    description: 'Light exercise 1–3 days/week',
    exampleDays: 'Short walks, casual cycling',
    calorieBurnModifier: '× 1.375',
    multiplier: 1.375,
  },
  {
    value: 'moderately_active',
    label: 'Moderately Active',
    emoji: '🏃',
    description: 'Moderate exercise 3–5 days/week',
    exampleDays: 'Gym sessions, jogging, swimming',
    calorieBurnModifier: '× 1.55',
    multiplier: 1.55,
  },
  {
    value: 'very_active',
    label: 'Very Active',
    emoji: '🏋️',
    description: 'Hard exercise 6–7 days/week',
    exampleDays: 'Daily training, physical job',
    calorieBurnModifier: '× 1.725',
    multiplier: 1.725,
  },
  {
    value: 'extremely_active',
    label: 'Extremely Active',
    emoji: '🔥',
    description: 'Very hard training or physical job + exercise',
    exampleDays: 'Athlete, construction worker, twice-a-day training',
    calorieBurnModifier: '× 1.9',
    multiplier: 1.9,
  },
];

interface ActivityLevelPickerProps {
  value: ActivityLevel | null;
  onChange: (value: ActivityLevel) => void;
  showHealthHint?: boolean;
}

export function ActivityLevelPicker({
  value,
  onChange,
  showHealthHint = true,
}: ActivityLevelPickerProps) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.wrapper}>
      {OPTIONS.map((opt) => {
        const selected = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={({ pressed }) => [
              styles.option,
              {
                backgroundColor: selected ? colors.primary + '12' : colors.card,
                borderColor: selected ? colors.primary : 'transparent',
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            {/* Left: emoji + text */}
            <Text style={styles.emoji}>{opt.emoji}</Text>
            <View style={styles.textCol}>
              <Text style={[styles.label, { color: colors.text }]}>{opt.label}</Text>
              <Text style={[styles.description, { color: colors.tabIconDefault }]}>
                {opt.description}
              </Text>
              <Text style={[styles.example, { color: colors.tabIconDefault + 'AA' }]}>
                {opt.exampleDays}
              </Text>
            </View>

            {/* Right: multiplier badge + radio */}
            <View style={styles.rightCol}>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: selected ? colors.primary + '20' : colors.background },
                ]}
              >
                <Text style={[styles.badgeText, { color: selected ? colors.primary : colors.tabIconDefault }]}>
                  {opt.calorieBurnModifier}
                </Text>
              </View>
              <View
                style={[
                  styles.radio,
                  {
                    borderColor: selected ? colors.primary : colors.tabIconDefault + '60',
                    backgroundColor: selected ? colors.primary : 'transparent',
                  },
                ]}
              >
                {selected && <Ionicons name="checkmark" size={12} color="#fff" />}
              </View>
            </View>
          </Pressable>
        );
      })}

      {/* Health data hint */}
      {showHealthHint && (
        <View style={[styles.hintCard, { backgroundColor: colors.primary + '0E', borderColor: colors.primary + '30' }]}>
          <Ionicons name="heart-circle-outline" size={22} color={colors.primary} style={{ marginTop: 1 }} />
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={[styles.hintTitle, { color: colors.text }]}>
              Planning to connect Health data?
            </Text>
            <Text style={[styles.hintBody, { color: colors.tabIconDefault }]}>
              If you'll allow FitPro to import your steps and active calories from Apple Health or Google Fit, choose{' '}
              <Text style={{ fontWeight: '700', color: colors.text }}>Sedentary</Text> here.
              Your real daily burn gets added automatically each time the app launches — no double-counting.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

// Export the multiplier so you can use it in calorie calculations
export function getActivityMultiplier(level: ActivityLevel): number {
  return OPTIONS.find((o) => o.value === level)?.multiplier ?? 1.2;
}

const styles = StyleSheet.create({
  wrapper: { gap: 10 },
  option: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  emoji: { fontSize: 22, width: 30, textAlign: 'center', marginTop: 2 },
  textCol: { flex: 1, gap: 2 },
  label: { fontSize: 15, fontWeight: '600' },
  description: { fontSize: 12, fontWeight: '500', lineHeight: 16 },
  example: { fontSize: 11, lineHeight: 15, marginTop: 1 },
  rightCol: { alignItems: 'flex-end', gap: 8, marginTop: 2 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    marginTop: 4,
  },
  hintTitle: { fontSize: 13, fontWeight: '700' },
  hintBody: { fontSize: 12, lineHeight: 18 },
});