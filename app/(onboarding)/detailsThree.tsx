import React, { useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../constants/Config';
import { CustomButton } from '../../components/CustomButton';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CustomGenderPicker } from '../../components/CustomGenderPicker';
import { CustomInput } from '../../components/CustomInput';
import { useAuth } from '../../context/AuthContext';
import { CustomGoalPicker } from '../../components/CustomGoalPicker';
import { DatePicker } from '../../components/CustomDatePicker';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../constants/FirebaseConfig';
import { safeParseNumber } from '../../methods/utils/stringToNumber';

const DetailsThreeScreen = () => {

  const params = useLocalSearchParams();
  const currentWeight = Number(params.currentWeight);

  const { colors, spacing } = useAppTheme();
  const { user } = useAuth();

  const scrollRef = useRef<ScrollView>(null);
  const [scrollEnabled, setScrollEnabled] = useState(true);

  const [loading, setLoading] = useState(false);
  const [aimedWeight, setAimedWeight] = useState('');
  const [goal, setGoal] = useState<string | null>('weight_maintaining');

  const [aimedDate, setAimedDate] = useState(new Date());

  const disabled = (goal !== 'weight_maintaining' && !aimedWeight.trim());

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert("Error", "You must be logged in to save this data.");
      return;
    }

    if (goal === 'weight_loss' && safeParseNumber(aimedWeight) >= currentWeight) {
      Alert.alert("Error", "You want to lose weight but your aimed Weight is higher than your previous submitted current weight");
      return;
    }

    if (goal === 'weight_gaining' && safeParseNumber(aimedWeight) <= currentWeight) {
      Alert.alert("Error", "You want to gain weight but your aimed Weight is lower than your previous submitted current weight");
      return;
    }

    try {
      setLoading(true);

      const userRef = doc(db, 'users', user.uid);

      const submitAim = safeParseNumber(aimedWeight);

      await setDoc(userRef, {
        aimedWeight: submitAim,
        aimedDate: aimedDate.toISOString(),
        goal: goal,
        isOnboarded: true,
      }, {merge: true});
      
    } catch (error) {
      console.error("Error putting goals to FireStrore: ", error);
    } finally {
      setLoading(false);
    }
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


        <View style={{ height: 20 }} />

        {goal !== 'weight_maintaining' && (
          <View>
            <Text style={[styles.description, { color: colors.text }]}>
              Your weight Goal:
            </Text>
            <CustomInput
              value={aimedWeight}
              label='Aimed Weight'
              onChangeText={(t) => setAimedWeight(t)}
              keyboardType='numeric'
            />

            <View style={{ height: 20 }} />

            <Text style={[styles.description, { color: colors.text }]}>
              When do you want to achive it?
            </Text>
            <DatePicker 
              mode='future'
              value={aimedDate}
              onChange={(d) => setAimedDate(d)}
            />
          </View>
        )}

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
          disabled={disabled}
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
  scroll: { flexGrow: 1, paddingBottom: 140 },
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
  description: {
    fontSize: 15,
    letterSpacing: 0.1,
    marginBottom: 14,
    fontWeight: '500'
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