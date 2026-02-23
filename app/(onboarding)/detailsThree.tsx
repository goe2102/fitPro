import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../constants/Config';
import { CustomButton } from '../../components/CustomButton';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CustomGenderPicker } from '../../components/CustomGenderPicker';
import { CustomInput } from '../../components/CustomInput';
import { useAuth } from '../../context/AuthContext';
import { CustomGoalPicker } from '../../components/CustomGoalPicker';

const DetailsThreeScreen = () => {

  const { colors, spacing } = useAppTheme();
  const { user } = useAuth();

  const scrollRef = useRef<ScrollView>(null);
  const [scrollEnabled, setScrollEnabled] = useState(true);

  const [loading, setLoading] = useState(false);
  const [aimedWeight, setAimedWeight] = useState('');
  const [goal, setGoal] = useState<string | null>('weight_maintaining');

  const handleSubmit = () => {

  }

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
        ref={scrollRef}
        scrollEnabled={scrollEnabled}
      >
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <Pressable
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: colors.card }]}
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={18} color={colors.text} />
          </Pressable>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>Step 3</Text>
          <Text style={[styles.title, { color: colors.text }]}>Your Goals</Text>
          <Text style={[styles.subtitle, { color: colors.tabIconDefault }]}>
            Select what you want to achieve
          </Text>

        <View
          onTouchStart={() => setScrollEnabled(false)}
          onTouchEnd={() => setScrollEnabled(true)}
          onTouchCancel={() => setScrollEnabled(true)}
        >
          <CustomGoalPicker value={goal} onChange={setGoal} />
        </View>

        </View>
      </ScrollView>

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
          title="Next Step"
          onPress={handleSubmit}
          loading={loading}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

export default DetailsThreeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  root: { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: 120 },
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
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 12,
  },
  subtitle: {
    fontSize: 15,
    letterSpacing: 0.1,
    marginBottom: 32,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
});