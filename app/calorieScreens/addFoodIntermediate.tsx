import React from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../constants/Config';
import { useDailyNutrition, MealType, getTodayString, dateToString } from '../../hooks/useDailyNutrition';

const MEAL_META: Record<MealType, { label: string; emoji: string; color: string; description: string }> = {
  breakfast: { label: 'Frühstück', emoji: '🌅', color: '#f59e0b', description: 'Morgens starten' },
  lunch: { label: 'Mittagessen', emoji: '☀️', color: '#22c55e', description: 'Mittags tanken' },
  dinner: { label: 'Abendessen', emoji: '🌙', color: '#6366f1', description: 'Abends genießen' },
  snack: { label: 'Snacks', emoji: '🍎', color: '#ec4899', description: 'Zwischendurch' },
};

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

function getDateLabel(dateStr: string): string {
  const today = getTodayString();
  const yesterday = dateToString(new Date(Date.now() - 86400000));
  if (dateStr === today) return 'Heute';
  if (dateStr === yesterday) return 'Gestern';
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('de-DE', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

export default function AddFoodIntermediate() {
  const { colors, spacing } = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams();

  const dateString = (params.dateString as string) ?? getTodayString();
  const { meals } = useDailyNutrition(dateString);

  const handleSelectMeal = (mealType: MealType) => {
    router.push({
      pathname: '/calorieScreens/addFood',
      params: { mealType, dateString },
    });
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <View
        style={[
          styles.header,
          {
            paddingTop: spacing.GLOBAL_MARGIN_TOP,
            paddingHorizontal: spacing.PADDING_HORIZONTAL,
          },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.card }]}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={18} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>Was möchtest du loggen?</Text>
          <Text style={[styles.subtitle, { color: colors.tabIconDefault }]}>
            {getDateLabel(dateString)}
          </Text>
        </View>
      </View>

      {/* ── Meal selector ──────────────────────────────────────── */}
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingHorizontal: spacing.PADDING_HORIZONTAL },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {MEAL_TYPES.map((mt) => {
          const meta = MEAL_META[mt];
          const summary = meals[mt];
          const kcal = summary?.totals.calories ?? 0;
          const count = summary?.entries.length ?? 0;

          return (
            <Pressable
              key={mt}
              onPress={() => handleSelectMeal(mt)}
              style={({ pressed }) => [
                styles.card,
                { backgroundColor: colors.card, opacity: pressed ? 0.82 : 1 },
              ]}
            >
              {/* Left color bar */}
              <View style={[styles.accentBar, { backgroundColor: meta.color }]} />

              {/* Emoji circle */}
              <View style={[styles.emojiWrap, { backgroundColor: meta.color + '18' }]}>
                <Text style={styles.emoji}>{meta.emoji}</Text>
              </View>

              {/* Labels */}
              <View style={styles.cardBody}>
                <Text style={[styles.mealLabel, { color: colors.text }]}>{meta.label}</Text>
                <Text style={[styles.mealSub, { color: colors.tabIconDefault }]}>
                  {count > 0
                    ? `${count} Eintrag${count > 1 ? 'einträge' : ''} · ${kcal} kcal`
                    : meta.description}
                </Text>
              </View>

              {/* Right: kcal badge + arrow */}
              <View style={styles.cardRight}>
                {kcal > 0 && (
                  <View style={[styles.kcalBadge, { backgroundColor: meta.color + '18' }]}>
                    <Text style={[styles.kcalText, { color: meta.color }]}>{kcal} kcal</Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={18} color={colors.tabIconDefault} />
              </View>
            </Pressable>
          );
        })}

        {/* Hint */}
        <View style={[styles.hint, { backgroundColor: colors.card }]}>
          <Ionicons name="information-circle-outline" size={15} color={colors.tabIconDefault} />
          <Text style={[styles.hintText, { color: colors.tabIconDefault }]}>
            Wähle eine Mahlzeit um Lebensmittel zu suchen oder per Barcode zu scannen.
          </Text>
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingBottom: 20,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4, lineHeight: 26 },
  subtitle: { fontSize: 13, fontWeight: '500', marginTop: 2 },
  scroll: { paddingTop: 4, flexGrow: 1 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    marginBottom: 12,
    overflow: 'hidden',
    paddingVertical: 16,
    paddingRight: 16,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  accentBar: { width: 4, alignSelf: 'stretch', borderRadius: 2 },
  emojiWrap: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  emoji: { fontSize: 22 },
  cardBody: { flex: 1 },
  mealLabel: { fontSize: 17, fontWeight: '700', marginBottom: 3 },
  mealSub: { fontSize: 13, fontWeight: '500' },
  cardRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  kcalBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  kcalText: { fontSize: 12, fontWeight: '700' },
  hint: {
    flexDirection: 'row', alignItems: 'flex-start',
    gap: 10, borderRadius: 14, padding: 14, marginTop: 4,
  },
  hintText: { flex: 1, fontSize: 12, lineHeight: 18 },
});