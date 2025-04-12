import { UserPreferences, UserPreferencesSchema } from './types';
import { z } from 'zod';

/**
 * Validates user input against the UserPreferencesSchema
 * @param input - The user input to validate
 * @returns Validated user preferences
 * @throws ZodError if validation fails
 */
export function validateUserInput(input: unknown): UserPreferences {
  return UserPreferencesSchema.parse(input);
}

/**
 * Safely parses user input, returning a Result type
 * @param input - The user input to validate
 * @returns Object containing success status and either data or error
 */
export function parseUserInput(input: unknown): {
  success: boolean;
  data?: UserPreferences;
  error?: z.ZodError;
} {
  try {
    const validatedData = UserPreferencesSchema.parse(input);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error };
    }
    throw error; // Re-throw if it's not a ZodError
  }
}
