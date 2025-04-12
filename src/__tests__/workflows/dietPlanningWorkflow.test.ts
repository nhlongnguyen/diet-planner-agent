import { DietPlanningWorkflow } from '../../workflows/dietPlanningWorkflow';
import { DietPlannerAgent } from '../../agents/dietPlannerAgent';
import { MemoryManager } from '../../utils/memoryManager';
import { DietType, DietGoal, UserPreferences, DietPlan } from '../../utils/types';
import { parseUserInput } from '../../utils/validation';
import { ZodError } from 'zod';

// Mock dependencies
jest.mock('../../agents/dietPlannerAgent');
jest.mock('../../utils/memoryManager');
jest.mock('../../utils/validation');

describe('DietPlanningWorkflow', () => {
  let workflow: DietPlanningWorkflow;
  let mockGenerateDietPlan: jest.Mock;
  let mockSaveUserPreferences: jest.Mock;
  let mockSaveDietPlan: jest.Mock;
  let mockLoadDietPlan: jest.Mock;
  let mockLoadUserPreferences: jest.Mock;
  let mockListUserDietPlans: jest.Mock;

  const userId = 'test-user';
  const planId = '12345';

  const validUserPreferences: UserPreferences = {
    dietType: DietType.VEGETARIAN,
    goal: DietGoal.WEIGHT_LOSS,
    excludedIngredients: ['mushrooms'],
    calorieTarget: 1800,
    mealsPerDay: 3,
    planDurationDays: 7,
  };

  const validDietPlan: DietPlan = {
    userPreferences: validUserPreferences,
    dailyPlans: [
      {
        day: 1,
        date: '2023-10-01',
        meals: [],
        totalCalories: 1500,
        totalProtein: 60,
        totalCarbs: 150,
        totalFat: 60,
      },
    ],
    overview: {
      averageDailyCalories: 1500,
      averageDailyProtein: 60,
      averageDailyCarbs: 150,
      averageDailyFat: 60,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Set up mocks with mock functions
    mockGenerateDietPlan = jest.fn().mockResolvedValue(validDietPlan);
    mockSaveUserPreferences = jest.fn().mockResolvedValue(undefined);
    mockSaveDietPlan = jest.fn().mockResolvedValue(planId);
    mockLoadDietPlan = jest.fn().mockResolvedValue(validDietPlan);
    mockLoadUserPreferences = jest.fn().mockResolvedValue(validUserPreferences);
    mockListUserDietPlans = jest.fn().mockResolvedValue([planId]);

    // Mock implementation for parseUserInput
    (parseUserInput as jest.Mock).mockReturnValue({
      success: true,
      data: validUserPreferences,
    });

    // Mock the constructors
    (DietPlannerAgent as jest.Mock).mockImplementation(() => ({
      generateDietPlan: mockGenerateDietPlan,
    }));

    (MemoryManager as jest.Mock).mockImplementation(() => ({
      saveUserPreferences: mockSaveUserPreferences,
      saveDietPlan: mockSaveDietPlan,
      loadDietPlan: mockLoadDietPlan,
      loadUserPreferences: mockLoadUserPreferences,
      listUserDietPlans: mockListUserDietPlans,
    }));

    // Create workflow instance
    workflow = new DietPlanningWorkflow();
  });

  describe('process', () => {
    test('should validate user input and generate a diet plan', async () => {
      const result = await workflow.process(validUserPreferences);

      expect(parseUserInput).toHaveBeenCalledWith(validUserPreferences);
      expect(mockGenerateDietPlan).toHaveBeenCalledWith(validUserPreferences);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(validDietPlan);
    });

    test('should save preferences and plan when userId is provided', async () => {
      const result = await workflow.process(validUserPreferences, userId);

      expect(mockSaveUserPreferences).toHaveBeenCalledWith(userId, validUserPreferences);
      expect(mockSaveDietPlan).toHaveBeenCalledWith(userId, validDietPlan);

      expect(result.success).toBe(true);
      expect(result.planId).toBe(planId);
    });

    test('should not save when userId is not provided', async () => {
      await workflow.process(validUserPreferences);

      expect(mockSaveUserPreferences).not.toHaveBeenCalled();
      expect(mockSaveDietPlan).not.toHaveBeenCalled();
    });

    test('should return validation errors when input is invalid', async () => {
      const mockError = new ZodError([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'number',
          path: ['dietType'],
          message: 'Expected string, received number',
        },
      ]);

      (parseUserInput as jest.Mock).mockReturnValueOnce({
        success: false,
        error: mockError,
      });

      const result = await workflow.process({ dietType: 123 });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid input');
      expect(result.error).toContain('dietType');
    });

    test('should handle errors from diet plan generation', async () => {
      const error = new Error('Failed to generate plan');
      mockGenerateDietPlan.mockRejectedValueOnce(error);

      const result = await workflow.process(validUserPreferences);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to generate plan');
    });
  });

  describe('updatePlan', () => {
    test('should generate new plan with updated preferences', async () => {
      const updatedPreferences: UserPreferences = {
        ...validUserPreferences,
        calorieTarget: 2000,
      };

      const result = await workflow.updatePlan(updatedPreferences, userId);

      expect(mockGenerateDietPlan).toHaveBeenCalledWith(updatedPreferences);
      expect(mockSaveUserPreferences).toHaveBeenCalledWith(userId, updatedPreferences);
      expect(mockSaveDietPlan).toHaveBeenCalledWith(userId, validDietPlan);

      expect(result.success).toBe(true);
      expect(result.planId).toBe(planId);
    });

    test('should handle errors when updating plan', async () => {
      const error = new Error('Update failed');
      mockGenerateDietPlan.mockRejectedValueOnce(error);

      const result = await workflow.updatePlan(validUserPreferences, userId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Update failed');
    });
  });

  describe('getPlan', () => {
    test('should load a diet plan by ID', async () => {
      const result = await workflow.getPlan(userId, planId);

      expect(mockLoadDietPlan).toHaveBeenCalledWith(userId, planId);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validDietPlan);
    });

    test('should return error if plan not found', async () => {
      mockLoadDietPlan.mockResolvedValueOnce(null);

      const result = await workflow.getPlan(userId, planId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    test('should handle errors when loading plan', async () => {
      const error = new Error('Load failed');
      mockLoadDietPlan.mockRejectedValueOnce(error);

      const result = await workflow.getPlan(userId, planId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Load failed');
    });
  });

  describe('listUserPlans', () => {
    test('should list all plans for a user', async () => {
      const plans = await workflow.listUserPlans(userId);

      expect(mockListUserDietPlans).toHaveBeenCalledWith(userId);
      expect(plans).toEqual([planId]);
    });
  });

  describe('getUserPreferences', () => {
    test('should get user preferences', async () => {
      const preferences = await workflow.getUserPreferences(userId);

      expect(mockLoadUserPreferences).toHaveBeenCalledWith(userId);
      expect(preferences).toEqual(validUserPreferences);
    });

    test('should return null if no preferences found', async () => {
      mockLoadUserPreferences.mockResolvedValueOnce(null);

      const preferences = await workflow.getUserPreferences(userId);

      expect(preferences).toBeNull();
    });
  });
});
