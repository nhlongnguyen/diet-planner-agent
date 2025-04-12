import { DietPlan, UserPreferences } from '../utils/types';
import { getNutritionApi } from '../tools/nutritionApi';
// We're mocking fetch for tests, so no need to import it
// const fetch = require('node-fetch');
import { config } from '../config';
import { NutritionService } from '../services/nutritionService';
import { DailyPlan, OverviewMetrics, DietGoal, DietType, Meal } from '../utils/types';
import { formatDateString } from '../utils/dateUtils';
import { withRetry } from '../utils/apiRateLimiting';

// Simple fetch interface type
interface FetchResponse {
  ok: boolean;
  status?: number;
  statusText?: string;
  json(): Promise<any>;
  text(): Promise<string>;
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
  private model: string;
  private nutritionService: NutritionService;

  constructor(nutritionService: NutritionService) {
    this.apiKey = config.openaiApiKey;
    this.model = config.openaiModel;
    this.nutritionService = nutritionService;

    if (!this.apiKey) {
      console.warn('OPENAI_API_KEY is not set in the environment variables');
    } else {
      console.log('OpenAI API Key length:', this.apiKey.length, 'Model:', this.model);
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
      // Check if mock mode is enabled
      if (config.useMockMode) {
        console.log('Using mock response for diet plan generation');
        return this.getMockDietPlanResponse(preferences);
      }

      // Check if API key is set
      if (!this.apiKey || this.apiKey.trim() === '') {
        throw new Error('OpenAI API key is not set or is empty. Please check your .env file.');
      }

      console.log(
        `Using model: ${this.model} with API key (first 5 chars): ${this.apiKey.substring(0, 5)}...`
      );

      console.log(`Prompt: ${prompt}`);

      // Use the withRetry utility to handle rate limiting
      return await withRetry(async () => {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: this.model,
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
          let errorDetail = '';
          try {
            // Try to get a detailed error message from the response
            const errorJSON = await response.json();
            errorDetail = JSON.stringify(errorJSON);
          } catch (e) {
            // If JSON parsing fails, try getting text content
            try {
              errorDetail = await response.text();
            } catch (textError) {
              errorDetail = 'Could not parse error details';
            }
          }

          const errorMessage = `OpenAI API error: ${response.status} ${response.statusText}. Details: ${errorDetail}`;
          console.error('Error generating diet plan:', errorMessage);

          // Create an error object with status property for rate limiting detection
          const error: any = new Error(errorMessage);
          error.status = response.status;
          throw error;
        }

        const data = await response.json();
        return data.choices[0].message.content.trim();
      }, config.rateLimiting);
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

  /**
   * Generates a mock diet plan for testing without calling the OpenAI API
   */
  private getMockDietPlanResponse(preferences: UserPreferences): string {
    // Create a realistic, properly formatted mock response based on user preferences
    const { dietType, goal, mealsPerDay, planDurationDays, calorieTarget = 2000 } = preferences;

    let response = '';

    // Adjust calories based on goal
    let actualCalories = calorieTarget;
    if (goal === DietGoal.WEIGHT_LOSS) {
      actualCalories = Math.max(1500, calorieTarget - 300);
    } else if (goal === DietGoal.WEIGHT_GAIN) {
      actualCalories = calorieTarget + 300;
    }

    // Calculate macro distributions based on diet type
    let proteinPct = 0.25; // default
    let carbPct = 0.5;
    let fatPct = 0.25;

    if (dietType === DietType.KETO) {
      proteinPct = 0.3;
      carbPct = 0.05;
      fatPct = 0.65;
    } else if (dietType === DietType.LOW_CARB) {
      proteinPct = 0.35;
      carbPct = 0.25;
      fatPct = 0.4;
    }

    // Calculate per meal calories
    const caloriesPerMeal = Math.round(actualCalories / mealsPerDay);

    // Generate plan for each day
    for (let day = 1; day <= planDurationDays; day++) {
      response += `Day ${day}:\n`;

      for (let meal = 1; meal <= mealsPerDay; meal++) {
        const mealType = this.getMealTypeForNumber(meal, mealsPerDay);
        const protein = Math.round((caloriesPerMeal * proteinPct) / 4); // 4 cal per gram of protein
        const carbs = Math.round((caloriesPerMeal * carbPct) / 4); // 4 cal per gram of carbs
        const fat = Math.round((caloriesPerMeal * fatPct) / 9); // 9 cal per gram of fat

        const mealName = this.getRandomMealName(mealType, dietType);

        response += `- Meal ${meal}: ${mealName} (Cal: ${caloriesPerMeal}, P: ${protein}g, C: ${carbs}g, F: ${fat}g)\n`;
      }

      response += '\n';
    }

    return response;
  }

  /**
   * Helper method to get a meal type based on meal number and total meals
   */
  private getMealTypeForNumber(mealNumber: number, totalMeals: number): string {
    if (totalMeals <= 3) {
      if (mealNumber === 1) return 'Breakfast';
      if (mealNumber === totalMeals) return 'Dinner';
      return 'Lunch';
    } else {
      if (mealNumber === 1) return 'Breakfast';
      if (mealNumber === totalMeals) return 'Dinner';
      if (mealNumber === Math.ceil(totalMeals / 2)) return 'Lunch';
      return mealNumber < Math.ceil(totalMeals / 2) ? 'Morning Snack' : 'Afternoon Snack';
    }
  }

  /**
   * Helper method to generate random meal names based on type and diet
   */
  private getRandomMealName(mealType: string, dietType: DietType): string {
    const mealOptions: Record<string, string[]> = {
      Breakfast: [
        'Oatmeal with berries and nuts',
        'Greek yogurt with honey and granola',
        'Scrambled eggs with vegetables',
        'Whole grain toast with avocado',
        'Protein smoothie with spinach and fruit',
      ],
      Lunch: [
        'Grilled chicken salad with mixed greens',
        'Quinoa bowl with roasted vegetables',
        'Turkey and avocado wrap',
        'Lentil soup with whole grain bread',
        'Tuna salad with whole grain crackers',
      ],
      Dinner: [
        'Baked salmon with asparagus and brown rice',
        'Lean beef stir fry with vegetables',
        'Grilled chicken with sweet potato and broccoli',
        'Turkey meatballs with zucchini noodles',
        'Tofu and vegetable curry with brown rice',
      ],
      'Morning Snack': [
        'Apple with almond butter',
        'Protein bar',
        'Greek yogurt with berries',
        'Handful of mixed nuts',
        'Cottage cheese with fruit',
      ],
      'Afternoon Snack': [
        'Hummus with carrot sticks',
        'Hard-boiled egg',
        'Protein shake',
        'String cheese with an apple',
        'Rice cakes with nut butter',
      ],
    };

    // Adjust options for specific diet types
    if (dietType === DietType.VEGAN) {
      mealOptions['Breakfast'] = [
        'Overnight oats with chia seeds and berries',
        'Tofu scramble with vegetables',
        'Whole grain toast with avocado and nutritional yeast',
        'Vegan protein smoothie with plant milk',
        'Quinoa breakfast bowl with fruits and nuts',
      ];

      mealOptions['Lunch'] = [
        'Lentil and vegetable soup',
        'Chickpea salad sandwich',
        'Quinoa and black bean bowl',
        'Vegan wrap with hummus and vegetables',
        'Buddha bowl with tahini dressing',
      ];

      mealOptions['Dinner'] = [
        'Vegan chili with mixed beans',
        'Stir-fried tofu with vegetables and brown rice',
        'Stuffed bell peppers with quinoa and vegetables',
        'Chickpea and vegetable curry',
        'Zucchini noodles with lentil bolognese',
      ];
    }

    if (dietType === DietType.KETO) {
      mealOptions['Breakfast'] = [
        'Avocado and bacon omelette',
        'Keto smoothie with almond milk and MCT oil',
        'Cream cheese pancakes',
        'Chia seed pudding with coconut milk',
        'Cauliflower hash with eggs and cheese',
      ];

      mealOptions['Lunch'] = [
        'Chicken and bacon salad with olive oil dressing',
        'Tuna salad stuffed avocado',
        'Zucchini noodles with alfredo sauce',
        'Cauliflower rice stir-fry with beef',
        'Spinach and feta cheese omelette',
      ];

      mealOptions['Dinner'] = [
        'Baked salmon with asparagus and hollandaise',
        'Ribeye steak with buttered broccoli',
        'Chicken thighs with creamed spinach',
        'Beef and vegetable stir-fry',
        'Pork chops with cabbage slaw',
      ];
    }

    // Get random meal from appropriate options
    const options = mealOptions[mealType] || mealOptions['Lunch'];
    return options[Math.floor(Math.random() * options.length)];
  }
}
