import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  LayoutAnimation,
  Platform,
  UIManager,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { doc, deleteDoc } from 'firebase/firestore';
import { useAppTheme } from '../constants/Config';
import { useAuth } from '../context/AuthContext';
import { db } from '../constants/FirebaseConfig';
import { FoodEntry, MealSummary, MealType } from '../hooks/useDailyNutrition';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const MEAL_META: Record<MealType, { label: string; emoji: string; color: string }> = {
  breakfast: { label: 'Breakfast', emoji: '🌅', color: '#f59e0b' },
  lunch: { label: 'Lunch', emoji: '☀️', color: '#22c55e' },
  dinner: { label: 'Dinner', emoji: '🌙', color: '#6366f1' },
  snack: { label: 'Snacks', emoji: '🍎', color: '#ec4899' },
};

interface MealCardProps {
  mealType: MealType;
  summary: MealSummary;
  dateString: string;
}

export function MealCard({ mealType, summary, dateString }: MealCardProps) {
  const { colors } = useAppTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  const meta = MEAL_META[mealType];
  const hasEntries = summary.entries.length > 0;

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((v) => !v);
  };

  const handleAdd = () => {
    router.push({
      pathname: '../calorieScreens/addFood',
      params: { mealType, dateString },
    });
  };

  const handleDelete = (entry: FoodEntry) => {
    Alert.alert(
      'Remove item',
      `Remove "${entry.name}" from ${meta.label}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            if (!user) return;
            try {
              await deleteDoc(
                doc(db, 'users', user.uid, 'foodLog', dateString, 'entries', entry.id)
              );
            } catch (err) {
              console.error('[MealCard] Delete error:', err);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      {/* ── Header row ───────────────────────────────────────────── */}
      <Pressable onPress={toggleExpand} style={styles.header}>
        {/* Left: emoji + title */}
        <View style={[styles.emojiCircle, { backgroundColor: meta.color + '18' }]}>
          <Text style={styles.emoji}>{meta.emoji}</Text>
        </View>
        <View style={styles.titleCol}>
          <Text style={[styles.mealLabel, { color: colors.text }]}>{meta.label}</Text>
          <Text style={[styles.mealSub, { color: colors.tabIconDefault }]}>
            {hasEntries
              ? `${summary.entries.length} item${summary.entries.length > 1 ? 's' : ''}`
              : 'Nothing logged yet'}
          </Text>
        </View>

        {/* Right: calories + chevron */}
        <View style={styles.rightRow}>
          {hasEntries && (
            <View style={[styles.calBadge, { backgroundColor: meta.color + '18' }]}>
              <Text style={[styles.calBadgeText, { color: meta.color }]}>
                {summary.totals.calories} kcal
              </Text>
            </View>
          )}
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={colors.tabIconDefault}
            style={{ marginLeft: 6 }}
          />
        </View>
      </Pressable>

      {/* ── Expanded entries ─────────────────────────────────────── */}
      {expanded && (
        <View style={styles.entriesWrapper}>
          <View style={[styles.divider, { backgroundColor: colors.background }]} />

          {hasEntries ? (
            summary.entries.map((entry) => (
              <View key={entry.id} style={styles.entryRow}>
                <View style={styles.entryLeft}>
                  <Text style={[styles.entryName, { color: colors.text }]} numberOfLines={1}>
                    {entry.name}
                  </Text>
                  <Text style={[styles.entrySub, { color: colors.tabIconDefault }]}>
                    {entry.amount}{entry.unit}
                    {entry.protein > 0 && `  ·  P ${entry.protein}g`}
                    {entry.carbs > 0 && `  C ${entry.carbs}g`}
                    {entry.fat > 0 && `  F ${entry.fat}g`}
                  </Text>
                </View>
                <View style={styles.entryRight}>
                  <Text style={[styles.entryCalories, { color: colors.text }]}>
                    {entry.calories} kcal
                  </Text>
                  <Pressable onPress={() => handleDelete(entry)} hitSlop={10}>
                    <Ionicons name="close-circle" size={18} color={colors.tabIconDefault + '80'} />
                  </Pressable>
                </View>
              </View>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: colors.tabIconDefault }]}>
              Tap + to log your {meta.label.toLowerCase()}
            </Text>
          )}

          {/* Macro summary row (only if entries exist) */}
          {hasEntries && (
            <View style={[styles.macroSummary, { backgroundColor: colors.background }]}>
              {(['protein', 'carbs', 'fat'] as const).map((macro) => (
                <View key={macro} style={styles.macroChip}>
                  <Text style={[styles.macroChipValue, { color: colors.text }]}>
                    {summary.totals[macro]}g
                  </Text>
                  <Text style={[styles.macroChipLabel, { color: colors.tabIconDefault }]}>
                    {macro.charAt(0).toUpperCase() + macro.slice(1)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Add button */}
          <Pressable
            onPress={handleAdd}
            style={({ pressed }) => [
              styles.addBtn,
              { borderColor: meta.color + '50', opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Ionicons name="add" size={18} color={meta.color} />
            <Text style={[styles.addBtnText, { color: meta.color }]}>
              Add to {meta.label}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Quick add button when collapsed */}
      {!expanded && (
        <Pressable
          onPress={handleAdd}
          style={[styles.quickAddBtn, { borderTopColor: colors.background }]}
          hitSlop={4}
        >
          <Ionicons name="add-circle-outline" size={18} color={meta.color} />
          <Text style={[styles.quickAddText, { color: meta.color }]}>Add</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  emojiCircle: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 20 },
  titleCol: { flex: 1 },
  mealLabel: { fontSize: 16, fontWeight: '700' },
  mealSub: { fontSize: 12, fontWeight: '500', marginTop: 1 },
  rightRow: { flexDirection: 'row', alignItems: 'center' },
  calBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  calBadgeText: { fontSize: 13, fontWeight: '700' },
  entriesWrapper: { paddingHorizontal: 16, paddingBottom: 12 },
  divider: { height: 1, marginBottom: 10 },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    gap: 8,
  },
  entryLeft: { flex: 1 },
  entryName: { fontSize: 14, fontWeight: '600' },
  entrySub: { fontSize: 11, marginTop: 1 },
  entryRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  entryCalories: { fontSize: 13, fontWeight: '700' },
  emptyText: { fontSize: 13, paddingVertical: 12, textAlign: 'center' },
  macroSummary: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
    marginBottom: 10,
  },
  macroChip: { flex: 1, alignItems: 'center' },
  macroChipValue: { fontSize: 15, fontWeight: '800' },
  macroChipLabel: { fontSize: 11, fontWeight: '500', marginTop: 1 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginTop: 4,
  },
  addBtnText: { fontSize: 14, fontWeight: '600' },
  quickAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  quickAddText: { fontSize: 13, fontWeight: '600' },
});