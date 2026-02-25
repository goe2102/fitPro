import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../constants/FirebaseConfig';

import { useUserProfile } from './useUserProfile';
import { useAuth } from '../context/AuthContext';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MacroTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  amount: number;
  unit: string;
  mealType: MealType;
  loggedAt: number;
}

export interface MealSummary {
  entries: FoodEntry[];
  totals: MacroTotals;
}

export interface DailyNutritionData {
  consumed: MacroTotals;
  targets: MacroTotals;
  remaining: MacroTotals;
  progressPercent: number;
  proteinProgress: number;
  carbsProgress: number;
  fatProgress: number;
  meals: Record<MealType, MealSummary>;
  loading: boolean;
  dateString: string;
}

export function dateToString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getTodayString(): string {
  return dateToString(new Date());
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

const EMPTY_TOTALS: MacroTotals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
const EMPTY_MEAL: MealSummary = { entries: [], totals: { ...EMPTY_TOTALS } };
const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export function useDailyNutrition(dateString?: string): DailyNutritionData {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const date = dateString ?? getTodayString();

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const entriesRef = collection(db, 'users', user.uid, 'foodLog', date, 'entries');
    const unsub = onSnapshot(entriesRef, (snap) => {
      const fetched: FoodEntry[] = [];
      snap.forEach((doc) => {
        fetched.push({ id: doc.id, ...doc.data() } as FoodEntry);
      });
      // Sort by loggedAt ascending
      fetched.sort((a, b) => a.loggedAt - b.loggedAt);
      setEntries(fetched);
      setLoading(false);
    }, (err) => {
      console.error('[useDailyNutrition]', err);
      setLoading(false);
    });

    return () => unsub();
  }, [user, date]);

  // Build per-meal summaries
  const meals: Record<MealType, MealSummary> = {
    breakfast: { entries: [], totals: { ...EMPTY_TOTALS } },
    lunch: { entries: [], totals: { ...EMPTY_TOTALS } },
    dinner: { entries: [], totals: { ...EMPTY_TOTALS } },
    snack: { entries: [], totals: { ...EMPTY_TOTALS } },
  };

  const consumed: MacroTotals = { ...EMPTY_TOTALS };

  for (const entry of entries) {
    const meal = meals[entry.mealType] ?? meals.snack;
    meal.entries.push(entry);
    meal.totals.calories += entry.calories;
    meal.totals.protein += entry.protein;
    meal.totals.carbs += entry.carbs;
    meal.totals.fat += entry.fat;
    consumed.calories += entry.calories;
    consumed.protein += entry.protein;
    consumed.carbs += entry.carbs;
    consumed.fat += entry.fat;
  }

  // Round
  for (const mt of MEAL_TYPES) {
    meals[mt].totals.calories = Math.round(meals[mt].totals.calories);
    meals[mt].totals.protein = Math.round(meals[mt].totals.protein * 10) / 10;
    meals[mt].totals.carbs = Math.round(meals[mt].totals.carbs * 10) / 10;
    meals[mt].totals.fat = Math.round(meals[mt].totals.fat * 10) / 10;
  }
  consumed.calories = Math.round(consumed.calories);
  consumed.protein = Math.round(consumed.protein * 10) / 10;
  consumed.carbs = Math.round(consumed.carbs * 10) / 10;
  consumed.fat = Math.round(consumed.fat * 10) / 10;

  const targets: MacroTotals = {
    calories: profile?.dailyCalorieTarget ?? 2000,
    protein: profile?.dailyProteinTarget ?? 150,
    carbs: profile?.dailyCarbsTarget ?? 200,
    fat: profile?.dailyFatTarget ?? 65,
  };

  const remaining: MacroTotals = {
    calories: Math.max(0, targets.calories - consumed.calories),
    protein: Math.max(0, targets.protein - consumed.protein),
    carbs: Math.max(0, targets.carbs - consumed.carbs),
    fat: Math.max(0, targets.fat - consumed.fat),
  };

  return {
    consumed,
    targets,
    remaining,
    progressPercent: clamp((consumed.calories / targets.calories) * 100, 0, 100),
    proteinProgress: clamp(consumed.protein / targets.protein, 0, 1),
    carbsProgress: clamp(consumed.carbs / targets.carbs, 0, 1),
    fatProgress: clamp(consumed.fat / targets.fat, 0, 1),
    meals,
    loading,
    dateString: date,
  };
}