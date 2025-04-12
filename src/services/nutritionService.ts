import { getNutritionApi } from '../tools/nutritionApi';

/**
 * Service for handling nutrition-related operations
 */
export class NutritionService {
  private nutritionApi = getNutritionApi();

  /**
   * Checks if ingredient data is available
   * @param ingredient - Ingredient name to check
   * @returns True if data is available, false otherwise
   */
  async hasIngredientData(ingredient: string): Promise<boolean> {
    try {
      await this.nutritionApi.getFoodNutritionData(ingredient);
      return true;
    } catch (error) {
      console.warn(`No nutrition data found for: ${ingredient}`);
      return false;
    }
  }

  /**
   * Get nutrition data for a food item
   * @param foodName - Name of the food
   * @returns Food nutrition data
   */
  async getFoodNutritionData(foodName: string) {
    return this.nutritionApi.getFoodNutritionData(foodName);
  }

  /**
   * Search for food items
   * @param query - Search query
   * @param limit - Maximum number of results
   * @returns Matching food items
   */
  async searchFoods(query: string, limit?: number) {
    return this.nutritionApi.searchFoods(query, limit);
  }
}
