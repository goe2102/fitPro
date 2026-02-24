import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../constants/Config';
import { CustomButton } from '../../components/CustomButton';
import { useCookTimer } from '../../context/CookTimerContext';


// ─── Timer Picker Modal ───────────────────────────────────────────────────────

function TimerModal({
  visible,
  stepLabel,
  onStart,
  onClose,
}: {
  visible: boolean;
  stepLabel: string;
  onStart: (seconds: number, label: string) => void;
  onClose: () => void;
}) {
  const { colors, spacing } = useAppTheme();
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');

  const PRESETS = [
    { label: '1 min', s: 60 },
    { label: '3 min', s: 180 },
    { label: '5 min', s: 300 },
    { label: '10 min', s: 600 },
    { label: '15 min', s: 900 },
    { label: '20 min', s: 1200 },
  ];

  const handleStart = (totalSeconds: number) => {
    if (totalSeconds <= 0) return;
    onStart(totalSeconds, stepLabel);
    setMinutes('');
    setSeconds('');
    onClose();
  };

  const customSeconds = (parseInt(minutes || '0') * 60) + parseInt(seconds || '0');

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={modalStyles.backdrop}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[modalStyles.sheet, { backgroundColor: colors.card }]}>

          <View style={modalStyles.handle} />

          <Text style={[modalStyles.title, { color: colors.text }]}>Set a Timer</Text>
          <Text style={[modalStyles.subtitle, { color: colors.tabIconDefault }]}>
            Timer keeps running if you move to the next step
          </Text>

          {/* Presets */}
          <View style={modalStyles.presetsGrid}>
            {PRESETS.map((p) => (
              <Pressable
                key={p.s}
                onPress={() => handleStart(p.s)}
                style={({ pressed }) => [
                  modalStyles.presetBtn,
                  { backgroundColor: colors.background, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Ionicons name="timer-outline" size={16} color={colors.primary} />
                <Text style={[modalStyles.presetText, { color: colors.text }]}>{p.label}</Text>
              </Pressable>
            ))}
          </View>

          {/* Divider */}
          <View style={[modalStyles.divider, { backgroundColor: colors.background }]} />

          {/* Custom input */}
          <Text style={[modalStyles.customLabel, { color: colors.tabIconDefault }]}>
            Custom time
          </Text>
          <View style={modalStyles.customRow}>
            <View style={[modalStyles.customInput, { backgroundColor: colors.background }]}>
              <TextInput
                value={minutes}
                onChangeText={(t) => setMinutes(t.replace(/[^0-9]/g, ''))}
                placeholder="0"
                placeholderTextColor={colors.tabIconDefault}
                keyboardType="number-pad"
                style={[modalStyles.customInputText, { color: colors.text }]}
                maxLength={2}
              />
              <Text style={[modalStyles.customInputUnit, { color: colors.tabIconDefault }]}>min</Text>
            </View>
            <Text style={[modalStyles.colonText, { color: colors.tabIconDefault }]}>:</Text>
            <View style={[modalStyles.customInput, { backgroundColor: colors.background }]}>
              <TextInput
                value={seconds}
                onChangeText={(t) => setSeconds(t.replace(/[^0-9]/g, ''))}
                placeholder="0"
                placeholderTextColor={colors.tabIconDefault}
                keyboardType="number-pad"
                style={[modalStyles.customInputText, { color: colors.text }]}
                maxLength={2}
              />
              <Text style={[modalStyles.customInputUnit, { color: colors.tabIconDefault }]}>sec</Text>
            </View>
            <Pressable
              onPress={() => handleStart(customSeconds)}
              disabled={customSeconds <= 0}
              style={({ pressed }) => [
                modalStyles.startCustomBtn,
                { backgroundColor: colors.primary, opacity: customSeconds <= 0 ? 0.4 : pressed ? 0.8 : 1 },
              ]}
            >
              <Ionicons name="play" size={18} color="#fff" />
            </Pressable>
          </View>

        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Cook Mode Screen ─────────────────────────────────────────────────────────

export default function CookModeScreen() {
  const { colors, spacing } = useAppTheme();
  const router = useRouter();
  const { instructionsData, recipeTitle } = useLocalSearchParams();
  const { startTimer, isRunning, remaining, stopTimer } = useCookTimer();
  const [timerModalVisible, setTimerModalVisible] = useState(false);

  const instructions: string[] = instructionsData
    ? JSON.parse(decodeURIComponent(instructionsData as string))
    : [];

  const [step, setStep] = useState(0);
  const total = instructions.length;
  const isLast = step === total - 1;
  const progress = total > 0 ? (step + 1) / total : 1;

  const goNext = () => {
    if (isLast) {
      stopTimer();
      router.back();
    } else {
      setStep((s) => s + 1);
    }
  };

  const goBack = () => {
    if (step === 0) {
      router.back();
    } else {
      setStep((s) => s - 1);
    }
  };

  if (instructions.length === 0) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>No instructions found.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>

      {/* Timer modal */}
      <TimerModal
        visible={timerModalVisible}
        stepLabel={`Step ${step + 1}${recipeTitle ? ` · ${recipeTitle}` : ''}`}
        onStart={startTimer}
        onClose={() => setTimerModalVisible(false)}
      />

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: spacing.GLOBAL_MARGIN_TOP, paddingHorizontal: spacing.PADDING_HORIZONTAL }]}>
        <Pressable onPress={goBack} style={[styles.backBtn, { backgroundColor: colors.card }]} hitSlop={8}>
          <Ionicons name="arrow-back" size={18} color={colors.text} />
        </Pressable>
        <Text style={[styles.recipeTitle, { color: colors.tabIconDefault }]} numberOfLines={1}>
          {recipeTitle as string || 'Cook Mode'}
        </Text>
        <Text style={[styles.stepCounter, { color: colors.tabIconDefault }]}>
          {step + 1}/{total}
        </Text>
      </View>

      {/* ── Progress bar ─────────────────────────────────────────────────── */}
      <View style={[styles.progressTrack, { backgroundColor: colors.card, marginHorizontal: spacing.PADDING_HORIZONTAL }]}>
        <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${progress * 100}%` }]} />
      </View>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingHorizontal: spacing.PADDING_HORIZONTAL, paddingTop: 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.eyebrow, { color: colors.primary }]}>Step {step + 1}</Text>
        <Text style={[styles.stepText, { color: colors.text }]}>
          {instructions[step]}
        </Text>

        {/* Timer button */}
        <Pressable
          onPress={() => setTimerModalVisible(true)}
          style={({ pressed }) => [
            styles.timerTrigger,
            { backgroundColor: colors.card, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <View style={[styles.timerIconCircle, { backgroundColor: colors.primary + '18' }]}>
            <Ionicons name="timer-outline" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.timerTriggerTitle, { color: colors.text }]}>
              {isRunning ? 'Timer running in background' : 'Set a timer for this step'}
            </Text>
            {isRunning && (
              <Text style={[styles.timerTriggerSub, { color: colors.primary }]}>
                Tap to start a new one · {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')} remaining
              </Text>
            )}
            {!isRunning && (
              <Text style={[styles.timerTriggerSub, { color: colors.tabIconDefault }]}>
                Keeps running when you go to the next step
              </Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.tabIconDefault} />
        </Pressable>

        {/* Step overview dots */}
        <View style={styles.dotsRow}>
          {instructions.map((_, i) => (
            <Pressable key={i} onPress={() => setStep(i)} hitSlop={8}>
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: i === step ? colors.primary : i < step ? colors.primary : colors.card,
                    width: i === step ? 20 : 8,
                    opacity: i < step ? 0.45 : 1,
                  },
                ]}
              />
            </Pressable>
          ))}
        </View>
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
          title={isLast ? '✅  Finished Cooking!' : 'Next Step'}
          onPress={goNext}
        />
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    gap: 12,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  recipeTitle: { flex: 1, fontSize: 14, fontWeight: '500', textAlign: 'center' },
  stepCounter: { fontSize: 14, fontWeight: '600', minWidth: 32, textAlign: 'right' },
  progressTrack: { height: 4, borderRadius: 2, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', borderRadius: 2 },
  scroll: { flexGrow: 1, paddingBottom: 120 },
  eyebrow: {
    fontSize: 13, fontWeight: '600',
    letterSpacing: 1.2, textTransform: 'uppercase',
    marginBottom: 12, opacity: 0.8,
  },
  stepText: {
    fontSize: 24, fontWeight: '600',
    lineHeight: 34, letterSpacing: -0.3,
    marginBottom: 32,
  },
  timerTrigger: {
    flexDirection: 'row', alignItems: 'center',
    gap: 14, padding: 16, borderRadius: 16, marginBottom: 32,
  },
  timerIconCircle: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  timerTriggerTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  timerTriggerSub: { fontSize: 12, fontWeight: '500' },
  dotsRow: { flexDirection: 'row', gap: 6, alignItems: 'center', flexWrap: 'wrap' },
  dot: { height: 8, borderRadius: 4 },
  footer: { paddingTop: 12, borderTopWidth: 1 },
});

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 12,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(128,128,128,0.3)',
    alignSelf: 'center', marginBottom: 20,
  },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 13, marginBottom: 20 },
  presetsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
  },
  presetBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 12, minWidth: '30%',
  },
  presetText: { fontSize: 14, fontWeight: '600' },
  divider: { height: 1, marginVertical: 20 },
  customLabel: { fontSize: 13, fontWeight: '500', marginBottom: 10 },
  customRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  customInput: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: 12, gap: 6,
  },
  customInputText: { flex: 1, fontSize: 22, fontWeight: '700', textAlign: 'center' },
  customInputUnit: { fontSize: 12, fontWeight: '500' },
  colonText: { fontSize: 22, fontWeight: '700' },
  startCustomBtn: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
});