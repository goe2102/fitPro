import React, { useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
} from 'react-native';
import { useAppTheme } from '../constants/Config';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Gender = 'male' | 'female' | 'secret';

interface GenderPickerProps {
  value: Gender | null;
  onChange: (gender: Gender) => void;
}

// ─── Options ──────────────────────────────────────────────────────────────────

const OPTIONS: { value: Gender; label: string; emoji: string }[] = [
  { value: 'male', label: 'Male', emoji: '👨🏻' },
  { value: 'female', label: 'Female', emoji: '👩🏻' },
  { value: 'secret', label: 'Secret', emoji: '🤫' },
];

// ─── Single Option Pill ───────────────────────────────────────────────────────

function GenderOption({
  option,
  isSelected,
  onPress,
}: {
  option: typeof OPTIONS[0];
  isSelected: boolean;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bgAnim = useRef(new Animated.Value(isSelected ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.timing(bgAnim, {
      toValue: isSelected ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [isSelected]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.94,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const backgroundColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.card, colors.primary],
  });

  const textColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.tabIconDefault, '#FFFFFF'],
  });

  return (
    <Animated.View style={{ flex: 1, transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.optionPressable}
      >
        <Animated.View
          style={[
            styles.pill,
            {
              backgroundColor,
              borderColor: isSelected ? colors.primary : 'transparent',
            },
          ]}
        >
          <Text style={styles.emoji}>{option.emoji}</Text>
          <Animated.Text
            style={[styles.label, { color: textColor as any }]}
          >
            {option.label}
          </Animated.Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CustomGenderPicker({ value, onChange }: GenderPickerProps) {
  return (
    <View style={styles.row}>
      {OPTIONS.map((option) => (
        <GenderOption
          key={option.value}
          option={option}
          isSelected={value === option.value}
          onPress={() => onChange(option.value)}
        />
      ))}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 35
  },
  optionPressable: {
    flex: 1,
  },
  pill: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  emoji: {
    fontSize: 18,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});