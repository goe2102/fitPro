import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { useAppTheme } from '../constants/Config';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GoalOption {
  value: string;
  label: string;
  description?: string;
  emoji: string;
}

interface CustomGoalPickerProps {
  value: string | null;
  onChange: (value: string) => void;
  options?: GoalOption[];
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const DEFAULT_GOALS: GoalOption[] = [
  { value: 'weight_loss', label: 'Lose Weight', description: 'Burn fat & get lean', emoji: '🔥' },
  { value: 'weight_maintaining', label: 'Stay Balanced', description: 'Maintain your current weight', emoji: '⚖️' },
  { value: 'weight_gaining', label: 'Build Mass', description: 'Gain muscle & strength', emoji: '💪' },
];

// ─── Layout constants ─────────────────────────────────────────────────────────

const { width: SW } = Dimensions.get('window');
const CARD_W = SW * 0.62;
const CARD_H = 180;
const PEEK_W = (SW - CARD_W) / 2;   // space on each side of center card
const SIDE_SCALE = 0.82;
const SIDE_OPACITY = 0.45;
const SWIPE_THRESH = 50;

// ─── Component ────────────────────────────────────────────────────────────────

export function CustomGoalPicker({
  value,
  onChange,
  options = DEFAULT_GOALS,
}: CustomGoalPickerProps) {
  const { colors } = useAppTheme();

  const initialIndex = Math.max(0, options.findIndex(o => o.value === value));
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  // One Animated.Value drives the whole carousel position
  // Position 0 = first card centered, 1 = second, etc.
  const position = useRef(new Animated.Value(initialIndex)).current;
  const dragOffset = useRef(new Animated.Value(0)).current;
  const currentIndex = useRef(initialIndex);

  const springTo = (index: number) => {
    const clamped = Math.max(0, Math.min(index, options.length - 1));
    currentIndex.current = clamped;
    setActiveIndex(clamped);
    onChange(options[clamped].value);

    Animated.spring(position, {
      toValue: clamped,
      useNativeDriver: true,
      tension: 68,
      friction: 11,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8,
      onPanResponderMove: (_, g) => {
        dragOffset.setValue(g.dx);
      },
      onPanResponderRelease: (_, g) => {
        dragOffset.setValue(0);
        if (g.dx < -SWIPE_THRESH) springTo(currentIndex.current + 1);
        else if (g.dx > SWIPE_THRESH) springTo(currentIndex.current - 1);
        else springTo(currentIndex.current);
      },
      onPanResponderTerminate: () => {
        dragOffset.setValue(0);
        springTo(currentIndex.current);
      },
    }),
  ).current;

  return (
    <View style={styles.root}>
      {/* Cards */}
      <View style={styles.stage} {...panResponder.panHandlers}>
        {options.map((option, index) => {
          // How far is this card from center? (in card-widths)
          const diff = Animated.subtract(
            new Animated.Value(index),
            position,
          );

          // X translation: center card at 0, others offset by card width
          const translateX = Animated.multiply(diff, new Animated.Value(CARD_W + 16));

          // Scale: center = 1, others = SIDE_SCALE
          const scale = diff.interpolate({
            inputRange: [-1, 0, 1],
            outputRange: [SIDE_SCALE, 1, SIDE_SCALE],
            extrapolate: 'clamp',
          });

          // Opacity
          const opacity = diff.interpolate({
            inputRange: [-1, 0, 1],
            outputRange: [SIDE_OPACITY, 1, SIDE_OPACITY],
            extrapolate: 'clamp',
          });

          const isSelected = index === activeIndex;

          return (
            <Animated.View
              key={option.value}
              style={[
                styles.cardWrap,
                {
                  transform: [{ translateX }, { scale }],
                  opacity,
                  zIndex: isSelected ? 10 : 1,
                },
              ]}
            >
              <Pressable
                onPress={() => springTo(index)}
                style={styles.cardPressable}
              >
                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.primary,
                      borderColor: isSelected ? colors.primary : 'transparent',
                      shadowColor: isSelected ? colors.primary : '#000',
                      shadowOpacity: isSelected ? 0.35 : 0.08,
                    },
                  ]}
                >
                  <Text style={styles.emoji}>{option.emoji}</Text>

                  <Text
                    style={[
                      styles.label,
                      { color: isSelected ? '#fff' : colors.text },
                    ]}
                  >
                    {option.label}
                  </Text>

                  {!!option.description && (
                    <Text
                      style={[
                        styles.description,
                        {
                          color: isSelected
                            ? 'rgba(255,255,255,0.72)'
                            : colors.tabIconDefault,
                        },
                      ]}
                    >
                      {option.description}
                    </Text>
                  )}

                  {isSelected && (
                    <View style={styles.checkBadge}>
                      <Text style={styles.checkmark}>✓</Text>
                    </View>
                  )}
                </View>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      {/* Dot indicators */}
      <View style={styles.dots}>
        {options.map((_, i) => (
          <Pressable key={i} onPress={() => springTo(i)} hitSlop={8}>
            <Animated.View
              style={[
                styles.dot,
                {
                  backgroundColor:
                    i === activeIndex
                      ? colors.primary
                      : colors.tabIconDefault + '45',
                  width: i === activeIndex ? 20 : 6,
                },
              ]}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    gap: 22,
  },
  stage: {
    height: CARD_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardWrap: {
    position: 'absolute',
    width: CARD_W,
  },
  cardPressable: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 24,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 8,
  },
  emoji: {
    fontSize: 46,
    marginBottom: 2,
  },
  label: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  description: {
    fontSize: 13,
    letterSpacing: 0.1,
    textAlign: 'center',
    lineHeight: 18,
  },
  checkBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
});