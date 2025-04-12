import { FoodItem } from '../utils/types';

/**
 * Interface for nutrition API providers
 */
interface NutritionApiProvider {
  getFoodNutritionData(foodName: string): Promise<FoodItem>;
  searchFoods(query: string, limit?: number): Promise<FoodItem[]>;
}

/**
 * Mock nutrition API provider for development and testing
 */
export class MockNutritionApi implements NutritionApiProvider {
  private readonly mockDatabase: Record<string, FoodItem> = {
    apple: {
      name: 'Apple',
      calories: 95,
      protein: 0.5,
      carbs: 25,
      fat: 0.3,
      fiber: 4.5,
      sugar: 19,
    },
    'chicken breast': {
      name: 'Chicken Breast',
      calories: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6,
    },
    'brown rice': {
      name: 'Brown Rice',
      calories: 215,
      protein: 5,
      carbs: 45,
      fat: 1.8,
      fiber: 3.5,
    },
    broccoli: {
      name: 'Broccoli',
      calories: 55,
      protein: 3.7,
      carbs: 11.2,
      fat: 0.6,
      fiber: 5.1,
    },
    salmon: {
      name: 'Salmon',
      calories: 206,
      protein: 22.1,
      carbs: 0,
      fat: 13.4,
    },
  };

  /**
   * Get nutrition data for a specific food
   * @param foodName - Name of the food to lookup
   * @returns Promise with food nutrition data
   */
  async getFoodNutritionData(foodName: string): Promise<FoodItem> {
    const normalizedName = foodName.toLowerCase();

    const matchedFood = Object.keys(this.mockDatabase).find((key) => normalizedName.includes(key));

    if (matchedFood) {
      return this.mockDatabase[matchedFood];
    }

    // Return a generated placeholder if no match is found
    return {
      name: foodName,
      calories: Math.round(Math.random() * 300) + 50,
      protein: Math.round(Math.random() * 20 * 10) / 10,
      carbs: Math.round(Math.random() * 30 * 10) / 10,
      fat: Math.round(Math.random() * 15 * 10) / 10,
    };
  }

  /**
   * Search for foods matching a query
   * @param query - Search term
   * @param limit - Maximum number of results to return
   * @returns Array of food items matching the query
   */
  async searchFoods(query: string, limit = 5): Promise<FoodItem[]> {
    const normalizedQuery = query.toLowerCase();

    const results = Object.keys(this.mockDatabase)
      .filter((key) => key.includes(normalizedQuery))
      .map((key) => this.mockDatabase[key])
      .slice(0, limit);

    return results.length ? results : [await this.getFoodNutritionData(query)];
  }
}

// Factory function to get the appropriate nutrition API based on environment
export function getNutritionApi(): NutritionApiProvider {
  // TODO: Add support for real APIs like Edamam or Spoonacular

  // For now, return the mock API
  return new MockNutritionApi();
}
