import React, { useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { useAppTheme } from '../constants/Config';

export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';

interface DifficultyPickerProps {
  value: DifficultyLevel | null;
  onChange: (v: DifficultyLevel) => void;
}

const OPTIONS: { value: DifficultyLevel; emoji: string; color: string }[] = [
  { value: 'Easy', emoji: '🌱', color: '#34C759' },
  { value: 'Medium', emoji: '⚡', color: '#FF9500' },
  { value: 'Hard', emoji: '🔥', color: '#FF3B30' },
];

function Pill({
  option,
  isSelected,
  onPress,
}: {
  option: typeof OPTIONS[0];
  isSelected: boolean;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const bg = useRef(new Animated.Value(isSelected ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.timing(bg, { toValue: isSelected ? 1 : 0, duration: 180, useNativeDriver: false }).start();
  }, [isSelected]);

  const backgroundColor = bg.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.card, option.color + 'EE'],
  });

  return (
    <Animated.View style={{ flex: 1, transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={() => Animated.spring(scale, { toValue: 0.94, useNativeDriver: true, tension: 300, friction: 10 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 300, friction: 10 }).start()}
        style={styles.pressable}
      >
        <Animated.View style={[styles.pill, { backgroundColor, borderColor: isSelected ? option.color : 'transparent' }]}>
          <Text style={styles.emoji}>{option.emoji}</Text>
          <Text style={[styles.label, { color: isSelected ? '#fff' : colors.tabIconDefault }]}>{option.value}</Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

export function DifficultyPicker({ value, onChange }: DifficultyPickerProps) {
  return (
    <View style={styles.row}>
      {OPTIONS.map(o => (
        <Pill key={o.value} option={o} isSelected={value === o.value} onPress={() => onChange(o.value)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
  pressable: { flex: 1 },
  pill: { height: 54, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', gap: 3 },
  emoji: { fontSize: 16 },
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 0.3 },
});