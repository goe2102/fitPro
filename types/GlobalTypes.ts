
export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;

  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

export interface Recipe {

  // required fields

  id: string;
  title: string;
  isPublic: boolean;
  createdAt: number;

  ingredients: Ingredient[];
  difficulty: DifficultyLevel;

  prepTimeMinutes?: number;
  instructions?: string[];
  imageUrl?: string;
  isVegan?: boolean;

  likeCount: number;

  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}