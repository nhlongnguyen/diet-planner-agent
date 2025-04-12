import { DietPlan, UserPreferences } from '../utils/types';
import { getNutritionApi } from '../tools/nutritionApi';
// We're mocking fetch for tests, so no need to import it
// const fetch = require('node-fetch');
import { config } from '../config';
import { NutritionService } from '../services/nutritionService';
import { DailyPlan, OverviewMetrics, DietGoal, DietType, Meal } from '../utils/types';
import { formatDateString } from '../utils/dateUtils';

// Simple fetch interface type
interface FetchResponse {
  ok: boolean;
  status?: number;
  statusText?: string;
  json(): Promise<any>;
}

// Global fetch type
declare global {
  function fetch(url: string, options?: any): Promise<FetchResponse>;
}

/**
 * Diet Planner Agent class
 * Uses OpenAI to generate personalized diet plans
 */
export class DietPlannerAgent {
  private nutritionApi = getNutritionApi();
  private apiKey: string;
  private nutritionService: NutritionService;

  constructor(nutritionService: NutritionService) {
    this.apiKey = config.openaiApiKey;
    this.nutritionService = nutritionService;

    if (!this.apiKey) {
      console.warn('OPENAI_API_KEY is not set in the environment variables');
    }
  }

  /**
   * Generates a diet plan based on user preferences
   * @param userPreferences - Validated user preferences
   * @returns A complete diet plan
   */
  async generateDietPlan(userPreferences: UserPreferences): Promise<DietPlan> {
    console.log(
      'Generating diet plan for user preferences:',
      JSON.stringify(userPreferences, null, 2)
    );

    try {
      // Generate the diet plan using OpenAI
      const dietPlanText = await this.generateDietPlanText(userPreferences);

      // Parse the diet plan into structured data
      const dailyPlans = await this.parseDietPlan(dietPlanText, userPreferences);

      // Calculate the overview metrics
      const overview = this.calculateOverviewMetrics(dailyPlans);

      return {
        userPreferences,
        dailyPlans,
        overview,
      };
    } catch (error) {
      console.error('Error in generateDietPlan:', error);
      throw error; // Propagate the original error instead of wrapping it
    }
  }

  private async generateDietPlanText(preferences: UserPreferences): Promise<string> {
    const prompt = this.createPrompt(preferences);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content:
                'You are a helpful nutritionist assistant that provides personalized diet plans.',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 1500,
        }),
      });

      if (!response.ok) {
        const errorMessage = `OpenAI API error: ${response.status} ${response.statusText}`;
        console.error('Error generating diet plan:', errorMessage);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error generating diet plan text:', error);
      throw error; // Propagate the original error instead of wrapping it
    }
  }

  private createPrompt(preferences: UserPreferences): string {
    const { dietType, goal, calorieTarget, mealsPerDay, planDurationDays, excludedIngredients } =
      preferences;

    let prompt = `Create a ${planDurationDays}-day ${dietType} diet plan for ${goal} with approximately ${calorieTarget} calories per day, spread across ${mealsPerDay} meals per day.`;

    if (excludedIngredients && excludedIngredients.length > 0) {
      prompt += ` Exclude these ingredients: ${excludedIngredients.join(', ')}.`;
    }

    prompt += `\n\nFor each day, provide meals in the following format:
Day X:
- Meal 1: Name and brief description (Cal: X, P: Xg, C: Xg, F: Xg)
- Meal 2: Name and brief description (Cal: X, P: Xg, C: Xg, F: Xg)
etc.

Cal = Calories, P = Protein, C = Carbs, F = Fat
Each meal should include full macronutrient breakdown. Be precise with the numbers.`;

    return prompt;
  }

  private async parseDietPlan(
    planText: string,
    preferences: UserPreferences
  ): Promise<DailyPlan[]> {
    const lines = planText.split('\n');
    const dailyPlans: DailyPlan[] = [];

    let currentDay: number | null = null;
    let currentDailyPlan: DailyPlan | null = null;
    const today = new Date();

    for (const line of lines) {
      const dayMatch = line.match(/Day\s+(\d+)/i);

      if (dayMatch) {
        if (currentDailyPlan) {
          dailyPlans.push(currentDailyPlan);
        }

        currentDay = parseInt(dayMatch[1]);
        const planDate = new Date(today);
        planDate.setDate(today.getDate() + currentDay - 1);

        currentDailyPlan = {
          day: currentDay,
          date: formatDateString(planDate),
          meals: [],
          totalCalories: 0,
          totalProtein: 0,
          totalCarbs: 0,
          totalFat: 0,
        };
      } else if (currentDailyPlan && line.trim().startsWith('-')) {
        const mealMatch = line.match(
          /- Meal\s+(\d+):\s+(.*?)\s+\(Cal:\s+(\d+),\s+P:\s+(\d+)g,\s+C:\s+(\d+)g,\s+F:\s+(\d+)g\)/i
        );

        if (mealMatch) {
          const [, mealNumber, mealDescription, calories, protein, carbs, fat] = mealMatch;

          const meal: Meal = {
            name: `Meal ${mealNumber}`,
            description: mealDescription.trim(),
            totalCalories: parseInt(calories),
            totalProtein: parseInt(protein),
            totalCarbs: parseInt(carbs),
            totalFat: parseInt(fat),
            ingredients: [], // We'll need to extract ingredients later
          };

          // Update ingredients based on the description
          if (meal.description) {
            meal.ingredients = await this.extractIngredients(meal.description);
          }

          currentDailyPlan.meals.push(meal);

          // Update daily totals
          currentDailyPlan.totalCalories += meal.totalCalories;
          currentDailyPlan.totalProtein += meal.totalProtein;
          currentDailyPlan.totalCarbs += meal.totalCarbs;
          currentDailyPlan.totalFat += meal.totalFat;
        }
      }
    }

    if (currentDailyPlan) {
      dailyPlans.push(currentDailyPlan);
    }

    return dailyPlans;
  }

  private async extractIngredients(mealDescription: string): Promise<string[]> {
    // Use a simple approach first: split by commas and common conjunctions
    const potentialIngredients = mealDescription
      .replace(/with|and|,|\+/g, '###')
      .split('###')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    // Filter out non-ingredients and duplicates
    const ingredients: string[] = [];
    for (const ingredient of potentialIngredients) {
      // Check if this is a valid ingredient
      const isIngredient = await this.nutritionService.hasIngredientData(ingredient);
      if (isIngredient && !ingredients.includes(ingredient)) {
        ingredients.push(ingredient);
      }
    }

    return ingredients;
  }

  private calculateOverviewMetrics(dailyPlans: DailyPlan[]): OverviewMetrics {
    if (dailyPlans.length === 0) {
      return {
        averageDailyCalories: 0,
        averageDailyProtein: 0,
        averageDailyCarbs: 0,
        averageDailyFat: 0,
      };
    }

    const totalCalories = dailyPlans.reduce((sum, day) => sum + day.totalCalories, 0);
    const totalProtein = dailyPlans.reduce((sum, day) => sum + day.totalProtein, 0);
    const totalCarbs = dailyPlans.reduce((sum, day) => sum + day.totalCarbs, 0);
    const totalFat = dailyPlans.reduce((sum, day) => sum + day.totalFat, 0);

    return {
      averageDailyCalories: Math.round(totalCalories / dailyPlans.length),
      averageDailyProtein: Math.round(totalProtein / dailyPlans.length),
      averageDailyCarbs: Math.round(totalCarbs / dailyPlans.length),
      averageDailyFat: Math.round(totalFat / dailyPlans.length),
    };
  }
}
