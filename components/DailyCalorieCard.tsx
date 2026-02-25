import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useAppTheme } from '../constants/Config';
import { useDailyNutrition } from '../hooks/useDailyNutrition';

// ─── Animated SVG circle ─────────────────────────────────────────────────────

const RING_SIZE = 180;
const STROKE_WIDTH = 14;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function CalorieRing({ progress, color, children }: {
  progress: number; // 0–100
  color: string;
  children: React.ReactNode;
}) {
  const animatedProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: progress,
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  // strokeDashoffset: 0 = full ring, CIRCUMFERENCE = empty
  const strokeDashoffset = animatedProgress.interpolate({
    inputRange: [0, 100],
    outputRange: [CIRCUMFERENCE, 0],
  });

  const AnimatedCircle = Animated.createAnimatedComponent(Circle);

  return (
    <View style={ringStyles.container}>
      <Svg width={RING_SIZE} height={RING_SIZE} style={StyleSheet.absoluteFill}>
        {/* Track */}
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RADIUS}
          stroke="rgba(128,128,128,0.12)"
          strokeWidth={STROKE_WIDTH}
          fill="none"
        />
        {/* Progress */}
        <AnimatedCircle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RADIUS}
          stroke={color}
          strokeWidth={STROKE_WIDTH}
          fill="none"
          strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
        />
      </Svg>
      {/* Center content */}
      <View style={ringStyles.center}>{children}</View>
    </View>
  );
}

const ringStyles = StyleSheet.create({
  container: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ─── Macro progress bar ───────────────────────────────────────────────────────

function MacroBar({ label, consumed, target, unit, color, progress }: {
  label: string;
  consumed: number;
  target: number;
  unit: string;
  color: string;
  progress: number; // 0.0–1.0
}) {
  const { colors } = useAppTheme();
  const animWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animWidth, {
      toValue: progress,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const isOver = consumed > target;

  return (
    <View style={macroStyles.wrapper}>
      <View style={macroStyles.labelRow}>
        <View style={[macroStyles.dot, { backgroundColor: color }]} />
        <Text style={[macroStyles.label, { color: colors.text }]}>{label}</Text>
        <Text style={[macroStyles.value, { color: isOver ? '#ef4444' : colors.tabIconDefault }]}>
          {consumed}{unit}
          <Text style={[macroStyles.target, { color: colors.tabIconDefault + '80' }]}>
            /{target}{unit}
          </Text>
        </Text>
      </View>
      <View style={[macroStyles.track, { backgroundColor: color + '22' }]}>
        <Animated.View
          style={[
            macroStyles.fill,
            {
              backgroundColor: isOver ? '#ef4444' : color,
              width: animWidth.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
    </View>
  );
}

const macroStyles = StyleSheet.create({
  wrapper: { marginBottom: 12 },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5, gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { flex: 1, fontSize: 13, fontWeight: '600' },
  value: { fontSize: 13, fontWeight: '700' },
  target: { fontWeight: '400' },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
});

// ─── Stat column (Eaten / Burned / Remaining) ─────────────────────────────────

function StatCol({ label, value, color }: { label: string; value: string; color: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={statStyles.col}>
      <Text style={[statStyles.value, { color }]}>{value}</Text>
      <Text style={[statStyles.label, { color: colors.tabIconDefault }]}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  col: { alignItems: 'center', flex: 1 },
  value: { fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },
  label: { fontSize: 11, fontWeight: '500', marginTop: 2 },
});

// ─── Main Card ────────────────────────────────────────────────────────────────

interface DailyCalorieCardProps {
  style?: ViewStyle;
  dateString?: string;
}

export function DailyCalorieCard({ style, dateString }: DailyCalorieCardProps) {
  const { colors } = useAppTheme();
  const {
    consumed,
    targets,
    remaining,
    progressPercent,
    proteinProgress,
    carbsProgress,
    fatProgress,
    loading,
  } = useDailyNutrition(dateString);

  const isOver = consumed.calories > targets.calories;
  const ringColor = isOver ? '#ef4444' : colors.primary;

  if (loading) {
    return (
      <View style={[styles.card, { backgroundColor: colors.card }, style]}>
        <View style={styles.loadingPlaceholder}>
          <View style={[styles.shimmer, { backgroundColor: colors.background, width: RING_SIZE, height: RING_SIZE, borderRadius: RING_SIZE / 2 }]} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.card }, style]}>

      {/* ── Header ──────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={[styles.dateLabel, { color: colors.tabIconDefault }]}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Daily Calories</Text>
      </View>

      {/* ── Ring + stats row ─────────────────────────────────────── */}
      <View style={styles.ringRow}>
        {/* Left stat */}
        <StatCol
          label="Eaten"
          value={`${consumed.calories}`}
          color={colors.text}
        />

        {/* Ring */}
        <CalorieRing progress={progressPercent} color={ringColor}>
          <Text style={[styles.ringCalories, { color: isOver ? '#ef4444' : colors.text }]}>
            {isOver ? `+${consumed.calories - targets.calories}` : remaining.calories}
          </Text>
          <Text style={[styles.ringLabel, { color: colors.tabIconDefault }]}>
            {isOver ? 'over' : 'kcal left'}
          </Text>
          <Text style={[styles.ringTarget, { color: colors.tabIconDefault + '80' }]}>
            of {targets.calories}
          </Text>
        </CalorieRing>

        {/* Right stat */}
        <StatCol
          label="Burned"
          value="—"
          color={colors.tabIconDefault}
        />
      </View>

      {/* ── Divider ──────────────────────────────────────────────── */}
      <View style={[styles.divider, { backgroundColor: colors.background }]} />

      {/* ── Macro bars ───────────────────────────────────────────── */}
      <View style={styles.macrosSection}>
        <MacroBar
          label="Protein"
          consumed={consumed.protein}
          target={targets.protein}
          unit="g"
          color="#3b82f6"
          progress={proteinProgress}
        />
        <MacroBar
          label="Carbohydrates"
          consumed={consumed.carbs}
          target={targets.carbs}
          unit="g"
          color="#f59e0b"
          progress={carbsProgress}
        />
        <MacroBar
          label="Fat"
          consumed={consumed.fat}
          target={targets.fat}
          unit="g"
          color="#ec4899"
          progress={fatProgress}
        />
      </View>

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  header: { marginBottom: 20 },
  dateLabel: { fontSize: 12, fontWeight: '500', marginBottom: 2 },
  headerTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  ringRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  ringCalories: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 34,
  },
  ringLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  ringTarget: {
    fontSize: 11,
    fontWeight: '400',
    marginTop: 1,
  },
  divider: { height: 1, marginBottom: 20 },
  macrosSection: {},
  loadingPlaceholder: { alignItems: 'center', paddingVertical: 20 },
  shimmer: { opacity: 0.5 },
});