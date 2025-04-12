import { validateUserInput, parseUserInput } from '../../utils/validation';
import { DietType, DietGoal } from '../../utils/types';
import { ZodError } from 'zod';

describe('Validation Utilities', () => {
  // Valid user preferences
  const validUserPreferences = {
    dietType: DietType.VEGETARIAN,
    goal: DietGoal.WEIGHT_LOSS,
    excludedIngredients: ['mushrooms', 'olives'],
    calorieTarget: 1800,
    mealsPerDay: 3,
    planDurationDays: 7,
  };

  describe('validateUserInput', () => {
    test('should validate correct user preferences', () => {
      const result = validateUserInput(validUserPreferences);
      expect(result).toEqual(validUserPreferences);
    });

    test('should set default mealsPerDay if not provided', () => {
      const { mealsPerDay, ...prefsWithoutMeals } = validUserPreferences;
      const result = validateUserInput(prefsWithoutMeals);
      expect(result.mealsPerDay).toBe(3); // Default value from schema
    });

    test('should set default planDurationDays if not provided', () => {
      const { planDurationDays, ...prefsWithoutDuration } = validUserPreferences;
      const result = validateUserInput(prefsWithoutDuration);
      expect(result.planDurationDays).toBe(7); // Default value from schema
    });

    test('should throw for invalid diet type', () => {
      const invalidPrefs = {
        ...validUserPreferences,
        dietType: 'invalid_diet_type' as DietType,
      };
      expect(() => validateUserInput(invalidPrefs)).toThrow(ZodError);
    });

    test('should throw for invalid goal', () => {
      const invalidPrefs = {
        ...validUserPreferences,
        goal: 'invalid_goal' as DietGoal,
      };
      expect(() => validateUserInput(invalidPrefs)).toThrow(ZodError);
    });

    test('should throw for negative calorie target', () => {
      const invalidPrefs = {
        ...validUserPreferences,
        calorieTarget: -100,
      };
      expect(() => validateUserInput(invalidPrefs)).toThrow(ZodError);
    });

    test('should throw for too many meals per day', () => {
      const invalidPrefs = {
        ...validUserPreferences,
        mealsPerDay: 10, // Max is 6
      };
      expect(() => validateUserInput(invalidPrefs)).toThrow(ZodError);
    });

    test('should throw for too many days', () => {
      const invalidPrefs = {
        ...validUserPreferences,
        planDurationDays: 40, // Max is 30
      };
      expect(() => validateUserInput(invalidPrefs)).toThrow(ZodError);
    });
  });

  describe('parseUserInput', () => {
    test('should return success true for valid input', () => {
      const result = parseUserInput(validUserPreferences);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validUserPreferences);
      expect(result.error).toBeUndefined();
    });

    test('should return success false for invalid input', () => {
      const invalidPrefs = {
        ...validUserPreferences,
        dietType: 'invalid_diet_type',
      };
      const result = parseUserInput(invalidPrefs);
      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.error).toBeInstanceOf(ZodError);
    });

    test('should rethrow non-ZodError errors', () => {
      const mockError = new Error('Non-Zod error');
      jest
        .spyOn(require('../../utils/types').UserPreferencesSchema, 'parse')
        .mockImplementation(() => {
          throw mockError;
        });

      expect(() => parseUserInput(validUserPreferences)).toThrow('Non-Zod error');

      // Restore the original implementation
      jest.restoreAllMocks();
    });
  });
});
