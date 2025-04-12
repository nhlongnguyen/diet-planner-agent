import fs from 'fs';
import path from 'path';
import { UserPreferences, DietPlan } from './types';

/**
 * Memory Manager for persisting user preferences and plans
 */
export class MemoryManager {
  private storagePath: string;

  /**
   * Initialize the memory manager
   * @param basePath - Base directory for storage (defaults to ./data)
   */
  constructor(basePath = './data') {
    this.storagePath = basePath;
    this.ensureStorageExists();
  }

  /**
   * Ensure the storage directory exists
   */
  private ensureStorageExists(): void {
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true });
    }
  }

  /**
   * Save user preferences
   * @param userId - Unique identifier for the user
   * @param preferences - User preferences to save
   */
  async saveUserPreferences(userId: string, preferences: UserPreferences): Promise<void> {
    const filePath = path.join(this.storagePath, `${userId}-preferences.json`);

    try {
      await fs.promises.writeFile(filePath, JSON.stringify(preferences, null, 2), 'utf8');
    } catch (error) {
      console.error(`Failed to save user preferences for ${userId}:`, error);
      throw new Error('Failed to save user preferences');
    }
  }

  /**
   * Load user preferences
   * @param userId - Unique identifier for the user
   * @returns User preferences or null if not found
   */
  async loadUserPreferences(userId: string): Promise<UserPreferences | null> {
    const filePath = path.join(this.storagePath, `${userId}-preferences.json`);

    try {
      if (!fs.existsSync(filePath)) {
        return null;
      }

      const data = await fs.promises.readFile(filePath, 'utf8');
      return JSON.parse(data) as UserPreferences;
    } catch (error) {
      console.error(`Failed to load user preferences for ${userId}:`, error);
      return null;
    }
  }

  /**
   * Save a generated diet plan
   * @param userId - Unique identifier for the user
   * @param plan - Diet plan to save
   * @param planId - Optional plan identifier (defaults to timestamp)
   */
  async saveDietPlan(
    userId: string,
    plan: DietPlan,
    planId = Date.now().toString()
  ): Promise<string> {
    const userDirectory = path.join(this.storagePath, userId);

    if (!fs.existsSync(userDirectory)) {
      fs.mkdirSync(userDirectory, { recursive: true });
    }

    const filePath = path.join(userDirectory, `plan-${planId}.json`);

    try {
      await fs.promises.writeFile(filePath, JSON.stringify(plan, null, 2), 'utf8');

      return planId;
    } catch (error) {
      console.error(`Failed to save diet plan for ${userId}:`, error);
      throw new Error('Failed to save diet plan');
    }
  }

  /**
   * Load a specific diet plan
   * @param userId - Unique identifier for the user
   * @param planId - Plan identifier
   * @returns Diet plan or null if not found
   */
  async loadDietPlan(userId: string, planId: string): Promise<DietPlan | null> {
    const filePath = path.join(this.storagePath, userId, `plan-${planId}.json`);

    try {
      if (!fs.existsSync(filePath)) {
        return null;
      }

      const data = await fs.promises.readFile(filePath, 'utf8');
      return JSON.parse(data) as DietPlan;
    } catch (error) {
      console.error(`Failed to load diet plan ${planId} for ${userId}:`, error);
      return null;
    }
  }

  /**
   * List all saved diet plans for a user
   * @param userId - Unique identifier for the user
   * @returns Array of plan IDs
   */
  async listUserDietPlans(userId: string): Promise<string[]> {
    const userDirectory = path.join(this.storagePath, userId);

    try {
      if (!fs.existsSync(userDirectory)) {
        return [];
      }

      const files = await fs.promises.readdir(userDirectory);

      return files
        .filter((file) => file.startsWith('plan-') && file.endsWith('.json'))
        .map((file) => file.replace('plan-', '').replace('.json', ''));
    } catch (error) {
      console.error(`Failed to list diet plans for ${userId}:`, error);
      return [];
    }
  }
}
