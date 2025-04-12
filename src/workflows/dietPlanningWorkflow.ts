import { DietPlannerAgent } from '../agents/dietPlannerAgent';
import { UserPreferences, DietPlan } from '../utils/types';
import { parseUserInput } from '../utils/validation';
import { MemoryManager } from '../utils/memoryManager';
import { NutritionService } from '../services/nutritionService';

/**
 * Main workflow for generating diet plans
 */
export class DietPlanningWorkflow {
  private dietPlannerAgent: DietPlannerAgent;
  private memoryManager: MemoryManager;
  private nutritionService: NutritionService;

  constructor() {
    this.nutritionService = new NutritionService();
    this.dietPlannerAgent = new DietPlannerAgent(this.nutritionService);
    this.memoryManager = new MemoryManager();
  }

  /**
   * Processes user input and generates a diet plan
   * @param userInput - Raw user input for diet preferences
   * @param userId - Optional user identifier for persistence
   * @returns Diet plan or error information
   */
  async process(
    userInput: unknown,
    userId?: string
  ): Promise<{ success: boolean; data?: DietPlan; planId?: string; error?: string }> {
    try {
      // Validate user input
      const validationResult = parseUserInput(userInput);

      if (!validationResult.success) {
        // Format validation errors for user-friendly display
        const errorMessages = validationResult.error?.errors
          .map((err) => {
            return `${err.path.join('.')}: ${err.message}`;
          })
          .join(', ');

        return {
          success: false,
          error: `Invalid input: ${errorMessages}`,
        };
      }

      // Generate diet plan using the validated preferences
      const dietPlan = await this.dietPlannerAgent.generateDietPlan(validationResult.data!);

      // Save user preferences and plan if userId is provided
      let planId: string | undefined;
      if (userId) {
        await this.memoryManager.saveUserPreferences(userId, validationResult.data!);
        planId = await this.memoryManager.saveDietPlan(userId, dietPlan);
      }

      return {
        success: true,
        data: dietPlan,
        planId,
      };
    } catch (error) {
      console.error('Error in diet planning workflow:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Updates an existing diet plan with new preferences
   * @param updatedPreferences - New user preferences
   * @param userId - User identifier for persistence
   * @returns Updated diet plan
   */
  async updatePlan(
    updatedPreferences: UserPreferences,
    userId: string
  ): Promise<{ success: boolean; data?: DietPlan; planId?: string; error?: string }> {
    try {
      // Generate a new plan with updated preferences
      const newPlan = await this.dietPlannerAgent.generateDietPlan(updatedPreferences);

      // Save updated preferences and plan
      await this.memoryManager.saveUserPreferences(userId, updatedPreferences);
      const planId = await this.memoryManager.saveDietPlan(userId, newPlan);

      return {
        success: true,
        data: newPlan,
        planId,
      };
    } catch (error) {
      console.error('Error updating diet plan:', error);

      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred while updating plan',
      };
    }
  }

  /**
   * Gets a previously generated diet plan
   * @param userId - User identifier
   * @param planId - Plan identifier
   * @returns The stored diet plan
   */
  async getPlan(
    userId: string,
    planId: string
  ): Promise<{ success: boolean; data?: DietPlan; error?: string }> {
    try {
      const plan = await this.memoryManager.loadDietPlan(userId, planId);

      if (!plan) {
        return {
          success: false,
          error: `Plan with ID ${planId} not found for user ${userId}`,
        };
      }

      return {
        success: true,
        data: plan,
      };
    } catch (error) {
      console.error('Error loading diet plan:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error retrieving plan',
      };
    }
  }

  /**
   * Lists all plans for a user
   * @param userId - User identifier
   * @returns List of plan IDs
   */
  async listUserPlans(userId: string): Promise<string[]> {
    return await this.memoryManager.listUserDietPlans(userId);
  }

  /**
   * Gets the user's saved preferences
   * @param userId - User identifier
   * @returns The user's preferences or null if not found
   */
  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    return await this.memoryManager.loadUserPreferences(userId);
  }
}
