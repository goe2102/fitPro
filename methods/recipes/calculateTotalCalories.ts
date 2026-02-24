import RecipeScreen from "../../app/(tabs)/recipes";
import { Ingredient } from "../../types/GlobalTypes";


interface NutritionResult {
  caloriesPerPortion: number;
  fatsPerPortion: number;
  carbsPerPortion: number;
  proteinPerPortion: number;
  hasCompleteNutData: boolean;
}


export default function calculateTotalRecipeCalories(ingredients: Ingredient[], portionSize: number) : NutritionResult {

  let totalCalories = 0;
  let totalFats = 0;
  let totalCarbs = 0;
  let totalProtein = 0;

  let hasCompleteNutData = true;

  if (!ingredients || ingredients.length === 0 || portionSize <= 0) {
    return {
      caloriesPerPortion: 0,
      fatsPerPortion: 0,
      carbsPerPortion: 0,
      proteinPerPortion: 0,
      hasCompleteNutData: false,
    };
  }

  ingredients.forEach((ing) => {
    const isMissingData =
      ing.calories === undefined || ing.calories === null ||
      ing.fat === undefined || ing.fat === null ||
      ing.carbs === undefined || ing.carbs === null ||
      ing.protein === undefined || ing.protein === null;

      if (isMissingData) {
        hasCompleteNutData = false;
      }

    const amountFactor = (ing.amount || 0) / 100;

    totalCalories += (ing.calories || 0) * amountFactor;
    totalFats += (ing.fat || 0) * amountFactor;
    totalCarbs += (ing.carbs || 0) * amountFactor;
    totalProtein += (ing.protein || 0) * amountFactor;
  });

  return {
    caloriesPerPortion: Math.round(totalCalories / portionSize),
    fatsPerPortion: Number((totalFats / portionSize).toFixed(1)),
    carbsPerPortion: Number((totalCarbs / portionSize).toFixed(1)),
    proteinPerPortion: Number((totalProtein / portionSize).toFixed(1)),
    hasCompleteNutData: hasCompleteNutData
  };
}