import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { collection, addDoc } from 'firebase/firestore';
import { useAppTheme } from '../../constants/Config';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../constants/FirebaseConfig';
import { CustomButton } from '../../components/CustomButton';
import { CustomInput } from '../../components/CustomInput';
import { MealType, getTodayString } from '../../hooks/useDailyNutrition';

const MEAL_META: Record<MealType, { label: string; emoji: string; color: string }> = {
  breakfast: { label: 'Breakfast', emoji: '🌅', color: '#f59e0b' },
  lunch: { label: 'Lunch', emoji: '☀️', color: '#22c55e' },
  dinner: { label: 'Dinner', emoji: '🌙', color: '#6366f1' },
  snack: { label: 'Snacks', emoji: '🍎', color: '#ec4899' },
};

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function AddFoodScreen() {
  const { colors, spacing } = useAppTheme();
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();

  const initialMeal = (params.mealType as MealType) ?? 'breakfast';
  const dateString = (params.dateString as string) ?? getTodayString();

  const [selectedMeal, setSelectedMeal] = useState<MealType>(initialMeal);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('100');
  const [unit, setUnit] = useState('g');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [loading, setLoading] = useState(false);

  const canSubmit = name.trim().length > 0 && calories.trim().length > 0;
  const meta = MEAL_META[selectedMeal];

  const handleSubmit = async () => {
    if (!user || !canSubmit) return;
    setLoading(true);
    try {
      await addDoc(
        collection(db, 'users', user.uid, 'foodLog', dateString, 'entries'),
        {
          name: name.trim(),
          amount: Number(amount) || 100,
          unit,
          calories: Number(calories) || 0,
          protein: Number(protein) || 0,
          carbs: Number(carbs) || 0,
          fat: Number(fat) || 0,
          mealType: selectedMeal,
          loggedAt: Date.now(),
        }
      );
      router.back();
    } catch (err) {
      console.error('[AddFood]', err);
      Alert.alert('Error', 'Could not save entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: spacing.GLOBAL_MARGIN_TOP, paddingHorizontal: spacing.PADDING_HORIZONTAL },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Nav ────────────────────────────────────────────── */}
        <View style={styles.navRow}>
          <Pressable
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: colors.card }]}
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={18} color={colors.text} />
          </Pressable>
          <Text style={[styles.navTitle, { color: colors.text }]}>Log Food</Text>
          <View style={{ width: 38 }} />
        </View>

        {/* ── Meal selector ──────────────────────────────────── */}
        <Text style={[styles.label, { color: colors.text }]}>Add to</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.mealRow}
          style={{ marginBottom: 20 }}
        >
          {MEAL_TYPES.map((mt) => {
            const m = MEAL_META[mt];
            const active = selectedMeal === mt;
            return (
              <Pressable
                key={mt}
                onPress={() => setSelectedMeal(mt)}
                style={[
                  styles.mealChip,
                  {
                    backgroundColor: active ? m.color : colors.card,
                    borderColor: active ? m.color : 'transparent',
                  },
                ]}
              >
                <Text style={styles.mealChipEmoji}>{m.emoji}</Text>
                <Text style={[styles.mealChipText, { color: active ? '#fff' : colors.tabIconDefault }]}>
                  {m.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ── Name ───────────────────────────────────────────── */}
        <Text style={[styles.label, { color: colors.text }]}>Food Name</Text>
        <CustomInput
          label="e.g. Chicken Breast, Oat Milk, Banana…"
          value={name}
          onChangeText={setName}
        />

        {/* ── Amount + unit ──────────────────────────────────── */}
        <Text style={[styles.label, { color: colors.text }]}>Amount</Text>
        <View style={styles.amountRow}>
          <View style={{ flex: 1 }}>
            <CustomInput
              label="Amount"
              value={amount}
              onChangeText={(t) => setAmount(t.replace(/[^0-9.]/g, ''))}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={styles.unitToggle}>
            {(['g', 'ml', 'pcs'] as const).map((u) => (
              <Pressable
                key={u}
                onPress={() => setUnit(u)}
                style={[
                  styles.unitBtn,
                  { backgroundColor: unit === u ? meta.color : colors.card },
                ]}
              >
                <Text style={[styles.unitBtnText, { color: unit === u ? '#fff' : colors.tabIconDefault }]}>
                  {u}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ── Nutrition card ─────────────────────────────────── */}
        <Text style={[styles.label, { color: colors.text }]}>Nutritional Values</Text>
        <View style={[styles.nutritionCard, { backgroundColor: colors.card }]}>

          {/* Calories row */}
          <View style={styles.calorieRow}>
            <View style={[styles.calorieIcon, { backgroundColor: meta.color + '18' }]}>
              <Ionicons name="flame" size={20} color={meta.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.calorieMainLabel, { color: colors.text }]}>Calories</Text>
              <Text style={[styles.calorieSubLabel, { color: colors.tabIconDefault }]}>Required</Text>
            </View>
            <View style={styles.calorieInputWrap}>
              <CustomInput
                label="kcal"
                value={calories}
                onChangeText={(t) => setCalories(t.replace(/[^0-9.]/g, ''))}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.background }]} />

          {/* Protein / Carbs / Fat */}
          <View style={styles.macroRow}>
            {[
              { label: 'Protein', val: protein, set: setProtein, color: '#3b82f6' },
              { label: 'Carbs', val: carbs, set: setCarbs, color: '#f59e0b' },
              { label: 'Fat', val: fat, set: setFat, color: '#ec4899' },
            ].map((m) => (
              <View key={m.label} style={styles.macroCol}>
                <View style={[styles.macroDot, { backgroundColor: m.color }]} />
                <Text style={[styles.macroLabel, { color: colors.tabIconDefault }]}>{m.label}</Text>
                <CustomInput
                  label="g"
                  value={m.val}
                  onChangeText={(t) => m.set(t.replace(/[^0-9.]/g, ''))}
                  keyboardType="decimal-pad"
                />
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── Footer ─────────────────────────────────────────────── */}
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
          title={`Add to ${meta.label}`}
          onPress={handleSubmit}
          loading={loading}
          disabled={!canSubmit}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1 },
  navRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 28,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  navTitle: { fontSize: 17, fontWeight: '700' },
  label: { fontSize: 15, fontWeight: '700', marginBottom: 10, marginTop: 4 },
  mealRow: { flexDirection: 'row', gap: 8 },
  mealChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 20, borderWidth: 1.5,
  },
  mealChipEmoji: { fontSize: 15 },
  mealChipText: { fontSize: 13, fontWeight: '600' },
  amountRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: 4 },
  unitToggle: { flexDirection: 'row', gap: 6, paddingTop: 6 },
  unitBtn: { paddingHorizontal: 13, paddingVertical: 11, borderRadius: 10 },
  unitBtnText: { fontSize: 13, fontWeight: '700' },
  nutritionCard: { borderRadius: 18, padding: 16 },
  calorieRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  calorieIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  calorieMainLabel: { fontSize: 15, fontWeight: '700' },
  calorieSubLabel: { fontSize: 11, fontWeight: '500' },
  calorieInputWrap: { width: 90 },
  divider: { height: 1, marginVertical: 14 },
  macroRow: { flexDirection: 'row', gap: 8 },
  macroCol: { flex: 1 },
  macroDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 4 },
  macroLabel: { fontSize: 11, fontWeight: '600', marginBottom: 4 },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingTop: 12, borderTopWidth: 1,
  },
});