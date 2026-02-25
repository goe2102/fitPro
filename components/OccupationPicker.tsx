import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../constants/Config';

export type Occupation =
  | 'student'
  | 'fulltime'
  | 'parttime'
  | 'freelance'
  | 'homemaker'
  | 'retired'
  | 'unemployed';

interface OccupationOption {
  value: Occupation;
  label: string;
  emoji: string;
  description: string;
}

const OPTIONS: OccupationOption[] = [
  {
    value: 'student',
    label: 'Student',
    emoji: '🎓',
    description: 'School, university or vocational training',
  },
  {
    value: 'fulltime',
    label: 'Full-time Employee',
    emoji: '💼',
    description: 'Working 35+ hours per week',
  },
  {
    value: 'parttime',
    label: 'Part-time Employee',
    emoji: '⏰',
    description: 'Working less than 35 hours per week',
  },
  {
    value: 'freelance',
    label: 'Freelancer / Self-employed',
    emoji: '💻',
    description: 'Running your own business or freelancing',
  },
  {
    value: 'homemaker',
    label: 'Homemaker',
    emoji: '🏠',
    description: 'Managing household and family',
  },
  {
    value: 'retired',
    label: 'Retired',
    emoji: '🌅',
    description: 'No longer in the workforce',
  },
  {
    value: 'unemployed',
    label: 'Not currently working',
    emoji: '🔍',
    description: 'Between jobs or taking a break',
  },
];

interface OccupationPickerProps {
  value: Occupation | null;
  onChange: (value: Occupation) => void;
}

export function OccupationPicker({ value, onChange }: OccupationPickerProps) {
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
            <Text style={styles.emoji}>{opt.emoji}</Text>
            <View style={styles.textCol}>
              <Text style={[styles.label, { color: colors.text }]}>{opt.label}</Text>
              <Text style={[styles.description, { color: colors.tabIconDefault }]}>
                {opt.description}
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
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 10 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  emoji: { fontSize: 24, width: 32, textAlign: 'center' },
  textCol: { flex: 1, gap: 2 },
  label: { fontSize: 15, fontWeight: '600' },
  description: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});