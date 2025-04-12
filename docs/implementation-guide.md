# Diet Planner Agent - Implementation Guide

This guide provides information for developers who want to extend or modify the Diet Planner Agent codebase.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Adding New Features](#adding-new-features)
3. [Customizing Diet Plans](#customizing-diet-plans)
4. [Integrating External APIs](#integrating-external-apis)
5. [Testing and Validation](#testing-and-validation)
6. [Performance Considerations](#performance-considerations)

## Architecture Overview

The Diet Planner Agent uses a modular architecture with clear separation of concerns:

```
├── agents/        # AI agent logic
├── tools/         # Utility tools for agents
├── workflows/     # Orchestration workflows
├── utils/         # Helper utilities
├── services/      # External service integrations
└── tests/         # Unit and integration tests
```

### Key Components

- **DietPlanningWorkflow**: The central orchestration class that manages the entire process flow
- **DietPlannerAgent**: Uses LLM to generate diet plans based on user preferences
- **NutritionService**: Provides nutrition data for foods
- **MemoryManager**: Manages persistent storage of user preferences and plans
- **Validation**: Type validation and error formatting

### Data Flow

1. User preferences enter the system through the `process` method of `DietPlanningWorkflow`
2. The workflow validates the input using Zod schemas
3. Valid preferences are passed to the `DietPlannerAgent` to generate a plan
4. The agent uses the `NutritionService` to enrich food items with nutrition data
5. The complete plan is returned and optionally saved via the `MemoryManager`

## Adding New Features

### Adding New Diet Types

To add support for a new diet type:

1. Add the new type to the `DietType` enum in `src/utils/types.ts`:

```typescript
export enum DietType {
  // Existing types...
  MEDITERRANEAN = 'mediterranean',
  // Other new types...
}
```

2. Update the `DietPlannerAgent` to handle the new diet type in the plan generation logic

### Adding New User Preferences

To add new user preferences:

1. Update the `UserPreferencesSchema` in `src/utils/types.ts`:

```typescript
export const UserPreferencesSchema = z.object({
  // Existing fields...
  allergens: z.array(z.string()).optional(),
  // Other new fields...
});
```

2. Update the `UserPreferences` type reference throughout the codebase
3. Modify the `DietPlannerAgent` to incorporate the new preferences into diet plans

### Adding New Agent Capabilities

To add new capabilities to the agent:

1. Add new methods to `DietPlannerAgent` class in `src/agents/dietPlannerAgent.ts`
2. Expose the capabilities through the workflow by adding methods to `DietPlanningWorkflow`

## Customizing Diet Plans

### Modifying Plan Generation Logic

The diet plan generation happens in the `DietPlannerAgent` class. To modify the generation logic:

1. Locate the `generateDietPlan` method in `src/agents/dietPlannerAgent.ts`
2. Adjust the LLM prompts to change how plans are created
3. Add or modify the post-processing of LLM responses

### Customizing Nutrition Calculations

To modify how nutrition data is calculated:

1. Locate the `enrichMealWithNutrition` method in `src/services/nutritionService.ts`
2. Adjust the nutrient calculation logic
3. Update the overview metrics calculation in `DietPlannerAgent` if necessary

## Integrating External APIs

### Replacing Mock Nutrition API

The default implementation uses mock nutrition data. To integrate a real API:

1. Update the `NutritionService` class in `src/services/nutritionService.ts`:

```typescript
async getNutritionData(foodName: string): Promise<FoodItem> {
  try {
    // Replace with actual API call
    const apiKey = process.env.NUTRITION_API_KEY;
    const response = await axios.get(
      `https://api.nutritionapi.com/v1/foods?name=${encodeURIComponent(foodName)}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );
    
    // Map API response to FoodItem
    const data = response.data;
    return {
      name: foodName,
      calories: data.calories,
      protein: data.protein_g,
      carbs: data.carbohydrates_g,
      fat: data.fat_g,
      fiber: data.fiber_g,
      sugar: data.sugar_g
    };
  } catch (error) {
    console.error(`Error fetching nutrition data for ${foodName}:`, error);
    // Fallback to mock data
    return this.getMockNutritionData(foodName);
  }
}
```

2. Ensure the API key is set in your environment variables
3. Add proper error handling for API rate limits and failures

### Adding Recipe API Integration

To add recipe data to meals:

1. Create a new service class in `src/services/recipeService.ts`
2. Implement methods to fetch recipes based on meal names or ingredients
3. Integrate the service with `DietPlannerAgent` to enhance meals with recipes

## Testing and Validation

### Unit Testing Components

When adding new features, ensure you add corresponding unit tests:

1. Create test files in the `src/__tests__` directory
2. Test each component in isolation using mocks for dependencies
3. Ensure input validation is thoroughly tested

Example test for a workflow method:

```typescript
// src/__tests__/workflows/dietPlanningWorkflow.test.ts
import { DietPlanningWorkflow } from '../../workflows/dietPlanningWorkflow';
import { DietType, DietGoal } from '../../utils/types';

describe('DietPlanningWorkflow', () => {
  let workflow: DietPlanningWorkflow;
  
  beforeEach(() => {
    workflow = new DietPlanningWorkflow();
    // Mock dependencies if needed
  });
  
  test('process should validate input correctly', async () => {
    const invalidInput = { wrong: 'format' };
    const result = await workflow.process(invalidInput);
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
  
  test('process should generate diet plan for valid input', async () => {
    const validInput = {
      dietType: DietType.VEGETARIAN,
      goal: DietGoal.WEIGHT_LOSS,
      mealsPerDay: 3,
      planDurationDays: 7
    };
    
    const result = await workflow.process(validInput);
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.dailyPlans.length).toBe(validInput.planDurationDays);
  });
});
```

### Integration Testing

Integration tests should verify the entire workflow:

1. Create tests that exercise the full process from input to output
2. Verify the interaction between components
3. Test edge cases and error conditions

## Performance Considerations

### LLM Cost Optimization

Since the agent uses LLMs, consider these performance optimizations:

1. Cache common responses to avoid redundant LLM calls
2. Use smaller, more efficient models for simpler tasks
3. Batch requests when processing multiple meals or days

### Memory Management

For production use, replace the in-memory storage with a proper database:

1. Create a database adapter in `src/services/databaseService.ts`
2. Implement the same interface as `MemoryManager`
3. Update the workflow to use the database service instead

Example database adapter:

```typescript
// src/services/databaseService.ts
import { UserPreferences, DietPlan } from '../utils/types';
import { Pool } from 'pg'; // PostgreSQL client

export class DatabaseService {
  private pool: Pool;
  
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
  }
  
  async saveUserPreferences(userId: string, preferences: UserPreferences): Promise<void> {
    await this.pool.query(
      'INSERT INTO user_preferences (user_id, preferences) VALUES ($1, $2) ' +
      'ON CONFLICT (user_id) DO UPDATE SET preferences = $2',
      [userId, JSON.stringify(preferences)]
    );
  }
  
  async loadUserPreferences(userId: string): Promise<UserPreferences | null> {
    const result = await this.pool.query(
      'SELECT preferences FROM user_preferences WHERE user_id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0].preferences;
  }
  
  // Implement other methods similarly
}
```