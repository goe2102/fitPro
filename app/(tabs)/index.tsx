import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../constants/Config';
import { DailyCalorieCard } from '../../components/DailyCalorieCard';
import { MealCard } from '../../components/MealCard';
import { DatePickerModal } from '../../components/DatePickerModal';
import { useDailyNutrition, getTodayString, dateToString } from '../../hooks/useDailyNutrition';
import { CustomButton } from '../../components/CustomButton';
import { router } from 'expo-router';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

function getDateHeaderLabel(dateStr: string): string {
  const today = getTodayString();
  const yesterday = dateToString(new Date(Date.now() - 86400000));
  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'short', day: 'numeric',
  });
}

export default function HomeScreen() {
  const { colors, spacing } = useAppTheme();
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const { meals, loading } = useDailyNutrition(selectedDate);

  const isToday = selectedDate === getTodayString();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* ── Date picker modal ───────────────────────────────────── */}
      <DatePickerModal
        visible={dateModalVisible}
        selectedDate={selectedDate}
        onSelect={setSelectedDate}
        onClose={() => setDateModalVisible(false)}
      />

      {/* ── Sticky header ───────────────────────────────────────── */}
      <View
        style={[
          styles.header,
          {
            paddingTop: spacing.GLOBAL_MARGIN_TOP,
            paddingHorizontal: spacing.PADDING_HORIZONTAL,
            backgroundColor: colors.background,
          },
        ]}
      >
        <Pressable
          onPress={() => setDateModalVisible(true)}
          style={styles.datePressable}
          hitSlop={8}
        >
          <Text style={[styles.dateTitle, { color: colors.text }]}>
            {getDateHeaderLabel(selectedDate)}
          </Text>
          <Ionicons name="chevron-down" size={20} color={colors.primary} style={{ marginTop: 2 }} />
        </Pressable>

        {/* Jump back to today if on another day */}
        {!isToday && (
          <Pressable
            onPress={() => setSelectedDate(getTodayString())}
            style={[styles.todayPill, { backgroundColor: colors.primary + '18' }]}
          >
            <Ionicons name="today-outline" size={14} color={colors.primary} />
            <Text style={[styles.todayPillText, { color: colors.primary }]}>Back to Today</Text>
          </Pressable>
        )}
      </View>

      {/* ── Scrollable content ──────────────────────────────────── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingHorizontal: spacing.PADDING_HORIZONTAL, paddingBottom: 110 },
        ]}
      >
        {/* Calorie ring card — accepts dateString prop */}
        <DailyCalorieCard dateString={selectedDate} style={styles.calorieCard} />

        {/* Meal cards */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Meals</Text>
        {MEAL_TYPES.map((mt) => (
          <MealCard
            key={mt}
            mealType={mt}
            summary={meals[mt]}
            dateString={selectedDate}
            
          />
        ))}

        <CustomButton onPress={() => router.push('../ApiDebug')} title='hi'/>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
  },
  datePressable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  todayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  todayPillText: { fontSize: 13, fontWeight: '600' },
  scroll: { paddingTop: 8 },
  calorieCard: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 12,
  },
});