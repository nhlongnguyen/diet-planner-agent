import fs from 'fs';
import path from 'path';
import { MemoryManager } from '../../utils/memoryManager';
import { DietType, DietGoal, UserPreferences, DietPlan } from '../../utils/types';

// Mock fs module
jest.mock('fs', () => {
  // Create a mix of actual fs functions and mocked ones
  const actualFs = jest.requireActual('fs');
  return {
    ...actualFs,
    promises: {
      writeFile: jest.fn(),
      readFile: jest.fn(),
      readdir: jest.fn(),
    },
    existsSync: jest.fn(),
    mkdirSync: jest.fn(),
  };
});

describe('MemoryManager', () => {
  const testBasePath = './test-data';
  let memoryManager: MemoryManager;

  const testUserId = 'test-user';
  const testPlanId = '12345';

  const testPreferences: UserPreferences = {
    dietType: DietType.KETO,
    goal: DietGoal.WEIGHT_LOSS,
    excludedIngredients: ['sugar'],
    calorieTarget: 1800,
    mealsPerDay: 3,
    planDurationDays: 7,
  };

  const testPlan: DietPlan = {
    userPreferences: testPreferences,
    dailyPlans: [
      {
        day: 1,
        date: '2023-10-01',
        meals: [],
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
      },
    ],
    overview: {
      averageDailyCalories: 0,
      averageDailyProtein: 0,
      averageDailyCarbs: 0,
      averageDailyFat: 0,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.promises.writeFile as jest.Mock).mockResolvedValue(undefined);
    (fs.promises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(testPreferences));
    (fs.promises.readdir as jest.Mock).mockResolvedValue(['plan-12345.json', 'plan-67890.json']);

    memoryManager = new MemoryManager(testBasePath);
  });

  describe('constructor', () => {
    test('should create storage directory if it does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValueOnce(false);
      new MemoryManager(testBasePath);
      expect(fs.mkdirSync).toHaveBeenCalledWith(testBasePath, { recursive: true });
    });

    test('should not create storage directory if it exists', () => {
      (fs.existsSync as jest.Mock).mockReturnValueOnce(true);
      new MemoryManager(testBasePath);
      expect(fs.mkdirSync).not.toHaveBeenCalled();
    });
  });

  describe('saveUserPreferences', () => {
    test('should save user preferences to a file', async () => {
      await memoryManager.saveUserPreferences(testUserId, testPreferences);

      const expectedPath = path.join(testBasePath, `${testUserId}-preferences.json`);
      expect(fs.promises.writeFile).toHaveBeenCalledWith(
        expectedPath,
        JSON.stringify(testPreferences, null, 2),
        'utf8'
      );
    });

    test('should throw an error if writing fails', async () => {
      (fs.promises.writeFile as jest.Mock).mockRejectedValueOnce(new Error('Write error'));

      await expect(memoryManager.saveUserPreferences(testUserId, testPreferences)).rejects.toThrow(
        'Failed to save user preferences'
      );
    });
  });

  describe('loadUserPreferences', () => {
    test('should load user preferences from a file', async () => {
      const preferences = await memoryManager.loadUserPreferences(testUserId);

      const expectedPath = path.join(testBasePath, `${testUserId}-preferences.json`);
      expect(fs.promises.readFile).toHaveBeenCalledWith(expectedPath, 'utf8');
      expect(preferences).toEqual(testPreferences);
    });

    test('should return null if file does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValueOnce(false);

      const preferences = await memoryManager.loadUserPreferences(testUserId);
      expect(preferences).toBeNull();
      expect(fs.promises.readFile).not.toHaveBeenCalled();
    });

    test('should return null if reading fails', async () => {
      (fs.promises.readFile as jest.Mock).mockRejectedValueOnce(new Error('Read error'));

      const preferences = await memoryManager.loadUserPreferences(testUserId);
      expect(preferences).toBeNull();
    });
  });

  describe('saveDietPlan', () => {
    test('should save diet plan to a file with the given ID', async () => {
      const planId = await memoryManager.saveDietPlan(testUserId, testPlan, testPlanId);

      expect(planId).toBe(testPlanId);
      const expectedDirectory = path.join(testBasePath, testUserId);
      const expectedPath = path.join(expectedDirectory, `plan-${testPlanId}.json`);

      expect(fs.promises.writeFile).toHaveBeenCalledWith(
        expectedPath,
        JSON.stringify(testPlan, null, 2),
        'utf8'
      );
    });

    test('should create user directory if it does not exist', async () => {
      // Reset the mock to clear any existing calls
      (fs.existsSync as jest.Mock).mockReset();

      // Mock implementation to return false specifically for the user directory
      (fs.existsSync as jest.Mock).mockImplementation((pathString: string) => {
        if (pathString === testBasePath) {
          return true; // Base path exists
        }
        if (pathString === path.join(testBasePath, testUserId)) {
          return false; // User directory doesn't exist
        }
        return true; // Default for any other path
      });

      await memoryManager.saveDietPlan(testUserId, testPlan);

      const expectedDirectory = path.join(testBasePath, testUserId);
      expect(fs.mkdirSync).toHaveBeenCalledWith(expectedDirectory, { recursive: true });
    });

    test('should generate a timestamp ID if none provided', async () => {
      const timestamp = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(timestamp);

      const planId = await memoryManager.saveDietPlan(testUserId, testPlan);

      expect(planId).toBe(timestamp.toString());
      const expectedDirectory = path.join(testBasePath, testUserId);
      const expectedPath = path.join(expectedDirectory, `plan-${timestamp}.json`);

      expect(fs.promises.writeFile).toHaveBeenCalledWith(
        expectedPath,
        JSON.stringify(testPlan, null, 2),
        'utf8'
      );
    });

    test('should throw an error if writing fails', async () => {
      (fs.promises.writeFile as jest.Mock).mockRejectedValueOnce(new Error('Write error'));

      await expect(memoryManager.saveDietPlan(testUserId, testPlan)).rejects.toThrow(
        'Failed to save diet plan'
      );
    });
  });

  describe('loadDietPlan', () => {
    beforeEach(() => {
      (fs.promises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(testPlan));
    });

    test('should load diet plan from a file', async () => {
      const plan = await memoryManager.loadDietPlan(testUserId, testPlanId);

      const expectedPath = path.join(testBasePath, testUserId, `plan-${testPlanId}.json`);
      expect(fs.promises.readFile).toHaveBeenCalledWith(expectedPath, 'utf8');
      expect(plan).toEqual(testPlan);
    });

    test('should return null if file does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValueOnce(false);

      const plan = await memoryManager.loadDietPlan(testUserId, testPlanId);
      expect(plan).toBeNull();
      expect(fs.promises.readFile).not.toHaveBeenCalled();
    });

    test('should return null if reading fails', async () => {
      (fs.promises.readFile as jest.Mock).mockRejectedValueOnce(new Error('Read error'));

      const plan = await memoryManager.loadDietPlan(testUserId, testPlanId);
      expect(plan).toBeNull();
    });
  });

  describe('listUserDietPlans', () => {
    test('should list all diet plans for a user', async () => {
      const planIds = await memoryManager.listUserDietPlans(testUserId);

      const expectedDirectory = path.join(testBasePath, testUserId);
      expect(fs.promises.readdir).toHaveBeenCalledWith(expectedDirectory);
      expect(planIds).toEqual(['12345', '67890']);
    });

    test('should return empty array if user directory does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValueOnce(false);

      const planIds = await memoryManager.listUserDietPlans(testUserId);
      expect(planIds).toEqual([]);
      expect(fs.promises.readdir).not.toHaveBeenCalled();
    });

    test('should return empty array if reading directory fails', async () => {
      (fs.promises.readdir as jest.Mock).mockRejectedValueOnce(new Error('Read error'));

      const planIds = await memoryManager.listUserDietPlans(testUserId);
      expect(planIds).toEqual([]);
    });

    test('should filter out non-plan files', async () => {
      (fs.promises.readdir as jest.Mock).mockResolvedValueOnce([
        'plan-12345.json',
        'other-file.txt',
        'plan-67890.json',
        'random.json',
      ]);

      const planIds = await memoryManager.listUserDietPlans(testUserId);
      expect(planIds).toEqual(['12345', '67890']);
    });
  });
});
