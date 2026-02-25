import { ActivityLevel, Gender, Goal, UserProfile } from "../../hooks/useUserProfile";


// ─── Activity Multipliers (Mifflin-St Jeor) ───────────────────────────────────
const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extremely_active: 1.9,
};

const GOAL_CALORIE_DELTA: Record<Goal, number> = {
  weight_loss: -500,
  weight_maintaining: 0,
  weight_gaining: 350,
};

// [protein%, carbs%, fat%]
const GOAL_MACRO_RATIOS: Record<Goal, [number, number, number]> = {
  weight_loss: [0.35, 0.35, 0.30],
  weight_maintaining: [0.30, 0.40, 0.30],
  weight_gaining: [0.30, 0.45, 0.25],
};

export interface CalculatedMetrics {
  age: number;
  bmr: number;
  tdee: number;
  dailyCalorieTarget: number;
  dailyProteinTarget: number;
  dailyCarbsTarget: number;
  dailyFatTarget: number;
}

function calculateAge(birthdayIso: string): number {
  const birth = new Date(birthdayIso);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function calculateBMR(weight: number, height: number, age: number, gender: Gender): number {
  // Mifflin-St Jeor — more accurate than Harris-Benedict for modern populations
  // Male:   10×weight + 6.25×height − 5×age + 5
  // Female: 10×weight + 6.25×height − 5×age − 161
  // Secret: average of both (−78)
  const base = 10 * weight + 6.25 * height - 5 * age;
  if (gender === 'male') return Math.round(base + 5);
  if (gender === 'female') return Math.round(base - 161);
  return Math.round(base - 78);
}

// Accept a plain object with only the fields we need — avoids Partial<> index issues
interface RequiredFields {
  birthday: string;
  weight: number;
  height: number;
  gender: Gender;
  activityLevel: ActivityLevel;
  goal: Goal;
}

export function calculateUserMetrics(profile: Partial<UserProfile>): CalculatedMetrics | null {
  const { birthday, weight, height, gender, activityLevel, goal } = profile;

  // Guard — all fields must be present and non-zero
  if (!birthday || !weight || !height || !gender || !activityLevel || !goal) {
    console.warn('[calculateUserMetrics] Missing required fields', { birthday, weight, height, gender, activityLevel, goal });
    return null;
  }

  // After the guard, cast to the strict types so Record lookups are safe
  const p: RequiredFields = {
    birthday,
    weight,
    height,
    gender: gender as Gender,
    activityLevel: activityLevel as ActivityLevel,
    goal: goal as Goal,
  };

  const age = calculateAge(p.birthday);
  const bmr = calculateBMR(p.weight, p.height, age, p.gender);
  const multiplier = ACTIVITY_MULTIPLIERS[p.activityLevel];
  const tdee = Math.round(bmr * multiplier);

  const delta = GOAL_CALORIE_DELTA[p.goal];
  const dailyCalorieTarget = Math.max(1200, tdee + delta);

  const [proteinRatio, carbsRatio, fatRatio] = GOAL_MACRO_RATIOS[p.goal];

  // Protein: 4 kcal/g | Carbs: 4 kcal/g | Fat: 9 kcal/g
  const dailyProteinTarget = Math.round((dailyCalorieTarget * proteinRatio) / 4);
  const dailyCarbsTarget = Math.round((dailyCalorieTarget * carbsRatio) / 4);
  const dailyFatTarget = Math.round((dailyCalorieTarget * fatRatio) / 9);

  return { age, bmr, tdee, dailyCalorieTarget, dailyProteinTarget, dailyCarbsTarget, dailyFatTarget };
}