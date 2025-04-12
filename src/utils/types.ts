import { z } from 'zod';

/**
 * Diet types supported by the planner
 */
export enum DietType {
  REGULAR = 'regular',
  VEGETARIAN = 'vegetarian',
  VEGAN = 'vegan',
  KETO = 'keto',
  PALEO = 'paleo',
  LOW_CARB = 'low_carb',
  GLUTEN_FREE = 'gluten_free',
  DAIRY_FREE = 'dairy_free',
}

/**
 * User goals for their diet plan
 */
export enum DietGoal {
  WEIGHT_LOSS = 'weight_loss',
  WEIGHT_GAIN = 'weight_gain',
  MAINTENANCE = 'maintenance',
  MUSCLE_GAIN = 'muscle_gain',
  GENERAL_HEALTH = 'general_health',
}

/**
 * User input schema for diet preferences
 */
export const UserPreferencesSchema = z.object({
  dietType: z.nativeEnum(DietType),
  goal: z.nativeEnum(DietGoal),
  excludedIngredients: z.array(z.string()).optional(),
  calorieTarget: z.number().positive().optional(),
  mealsPerDay: z.number().int().min(1).max(6).default(3),
  planDurationDays: z.number().int().min(1).max(30).default(7),
});

/**
 * User preferences type
 */
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;

/**
 * Food item with nutritional information
 */
export interface FoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
}

/**
 * Meal structure
 */
export interface Meal {
  name: string;
  type?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foods?: FoodItem[];
  description?: string;
  ingredients?: string[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  recipe?: string;
}

/**
 * Daily meal plan
 */
export interface DailyPlan {
  day: number;
  date: string;
  meals: Meal[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

/**
 * Complete diet plan
 */
export interface DietPlan {
  userPreferences: UserPreferences;
  dailyPlans: DailyPlan[];
  overview: {
    averageDailyCalories: number;
    averageDailyProtein: number;
    averageDailyCarbs: number;
    averageDailyFat: number;
  };
}

/**
 * Overview metrics for a diet plan
 */
export interface OverviewMetrics {
  averageDailyCalories: number;
  averageDailyProtein: number;
  averageDailyCarbs: number;
  averageDailyFat: number;
}
