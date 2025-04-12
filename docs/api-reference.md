# Diet Planner Agent - API Reference

This document provides a comprehensive reference for the Diet Planner Agent API, including all classes, methods, and types used throughout the application.

## Table of Contents

- [Workflows](#workflows)
  - [DietPlanningWorkflow](#dietplanningworkflow)
- [Agents](#agents)
  - [DietPlannerAgent](#dietplanneragent)
- [Services](#services)
  - [NutritionService](#nutritionservice)
- [Utils](#utils)
  - [MemoryManager](#memorymanager)
  - [Validation](#validation)
  - [ApiRateLimiting](#apiratelimiting)
- [Types](#types)
  - [Diet Types and Goals](#diet-types-and-goals)
  - [User Preferences](#user-preferences)
  - [Diet Plan Structure](#diet-plan-structure)

## Workflows

### DietPlanningWorkflow

The main workflow class that orchestrates the diet planning process.

```typescript
import { DietPlanningWorkflow } from './workflows/dietPlanningWorkflow';
```

#### Constructor

```typescript
constructor();
```

Creates a new instance of the workflow with the necessary dependencies (DietPlannerAgent, MemoryManager, and NutritionService).

#### Methods

##### `process`

```typescript
async process(
  userInput: unknown,
  userId?: string
): Promise<{
  success: boolean;
  data?: DietPlan;
  planId?: string;
  error?: string
}>
```

Processes user preferences and generates a diet plan.

- **Parameters**:
  - `userInput`: Raw user input (will be validated)
  - `userId`: Optional user identifier for persistence
- **Returns**: Object with success status, plan data, plan ID, and error information if applicable
- **Description**: This method validates the input, generates a diet plan using the agent, and saves the preferences and plan to memory if a userId is provided.

##### `updatePlan`

```typescript
async updatePlan(
  updatedPreferences: UserPreferences,
  userId: string
): Promise<{
  success: boolean;
  data?: DietPlan;
  planId?: string;
  error?: string
}>
```

Updates an existing plan with new preferences.

- **Parameters**:
  - `updatedPreferences`: New user preferences
  - `userId`: User identifier
- **Returns**: Object with success status, updated plan data, new plan ID, and error information if applicable
- **Description**: Generates a new plan based on the updated preferences and saves it to memory.

##### `getPlan`

```typescript
async getPlan(
  userId: string,
  planId: string
): Promise<{
  success: boolean;
  data?: DietPlan;
  error?: string
}>
```

Retrieves a previously generated plan.

- **Parameters**:
  - `userId`: User identifier
  - `planId`: Plan identifier
- **Returns**: Object with success status, plan data, and error information if applicable
- **Description**: Loads a diet plan from memory based on the user ID and plan ID.

##### `listUserPlans`

```typescript
async listUserPlans(userId: string): Promise<string[]>
```

Lists all plans for a specific user.

- **Parameters**:
  - `userId`: User identifier
- **Returns**: Array of plan IDs
- **Description**: Retrieves a list of all plan IDs associated with a user.

##### `getUserPreferences`

```typescript
async getUserPreferences(userId: string): Promise<UserPreferences | null>
```

Gets saved preferences for a specific user.

- **Parameters**:
  - `userId`: User identifier
- **Returns**: User preferences or null if not found
- **Description**: Loads a user's saved preferences from memory.

## Agents

### DietPlannerAgent

The agent responsible for generating diet plans using LLMs.

```typescript
import { DietPlannerAgent } from './agents/dietPlannerAgent';
```

#### Constructor

```typescript
constructor(nutritionService: NutritionService)
```

Creates a new agent with the provided nutrition service.

- **Parameters**:
  - `nutritionService`: Service for fetching nutrition data

#### Methods

##### `generateDietPlan`

```typescript
async generateDietPlan(preferences: UserPreferences): Promise<DietPlan>
```

Generates a diet plan based on user preferences.

- **Parameters**:
  - `preferences`: Validated user preferences
- **Returns**: Complete diet plan
- **Description**: Uses an LLM to generate meal plans based on preferences, enriches them with nutrition data, and calculates overall metrics.

## Services

### NutritionService

Service for retrieving nutrition information for food items.

```typescript
import { NutritionService } from './services/nutritionService';
```

#### Constructor

```typescript
constructor();
```

Creates a new nutrition service instance.

#### Methods

##### `getNutritionData`

```typescript
async getNutritionData(foodName: string): Promise<FoodItem>
```

Retrieves nutrition data for a food item.

- **Parameters**:
  - `foodName`: Name of the food item
- **Returns**: Food item with nutrition information
- **Description**: Fetches nutrition data from an external API or uses mock data if not available.

##### `enrichMealWithNutrition`

```typescript
async enrichMealWithNutrition(meal: Partial<Meal>): Promise<Meal>
```

Enriches a meal with nutrition information.

- **Parameters**:
  - `meal`: Partial meal object
- **Returns**: Complete meal with nutrition information
- **Description**: Adds nutrition data to each food item in a meal and calculates meal totals.

## Utils

### MemoryManager

Manages persistent storage for user preferences and diet plans.

```typescript
import { MemoryManager } from './utils/memoryManager';
```

#### Constructor

```typescript
constructor();
```

Creates a new memory manager instance.

#### Methods

##### `saveUserPreferences`

```typescript
async saveUserPreferences(userId: string, preferences: UserPreferences): Promise<void>
```

Saves user preferences to persistent storage.

- **Parameters**:
  - `userId`: User identifier
  - `preferences`: User preferences
- **Description**: Stores user preferences for future reference.

##### `loadUserPreferences`

```typescript
async loadUserPreferences(userId: string): Promise<UserPreferences | null>
```

Loads user preferences from persistent storage.

- **Parameters**:
  - `userId`: User identifier
- **Returns**: User preferences or null if not found
- **Description**: Retrieves previously saved user preferences.

##### `saveDietPlan`

```typescript
async saveDietPlan(userId: string, plan: DietPlan): Promise<string>
```

Saves a diet plan to persistent storage.

- **Parameters**:
  - `userId`: User identifier
  - `plan`: Diet plan to save
- **Returns**: Plan identifier
- **Description**: Stores a diet plan and associates it with a user.

##### `loadDietPlan`

```typescript
async loadDietPlan(userId: string, planId: string): Promise<DietPlan | null>
```

Loads a diet plan from persistent storage.

- **Parameters**:
  - `userId`: User identifier
  - `planId`: Plan identifier
- **Returns**: Diet plan or null if not found
- **Description**: Retrieves a previously saved diet plan.

##### `listUserDietPlans`

```typescript
async listUserDietPlans(userId: string): Promise<string[]>
```

Lists all diet plans for a user.

- **Parameters**:
  - `userId`: User identifier
- **Returns**: Array of plan IDs
- **Description**: Retrieves a list of all plan IDs associated with a user.

### ApiRateLimiting

Provides utilities for handling API rate limits with exponential backoff.

```typescript
import { withRetry, RetryOptions } from './utils/apiRateLimiting';
```

#### Types

##### `RetryOptions`

```typescript
interface RetryOptions {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffFactor: number;
}
```

Configuration options for retry behavior.

- `maxRetries`: Maximum number of retry attempts
- `initialDelayMs`: Initial delay in milliseconds before the first retry
- `maxDelayMs`: Maximum delay in milliseconds between retries
- `backoffFactor`: Multiplier to increase delay after each retry

#### Functions

##### `withRetry`

```typescript
async function withRetry<T>(fn: () => Promise<T>, options: Partial<RetryOptions> = {}): Promise<T>;
```

Executes a function with exponential backoff retry logic.

- **Parameters**:
  - `fn`: Async function to execute with retry logic
  - `options`: Optional configuration overrides for retry behavior
- **Returns**: The result of the function execution
- **Description**: Automatically retries the function when rate limit errors (HTTP 429) occur, using exponential backoff with jitter.

#### Constants

##### `DEFAULT_RETRY_OPTIONS`

```typescript
const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 5,
  initialDelayMs: 1000, // 1 second
  maxDelayMs: 60000, // 60 seconds (1 minute)
  backoffFactor: 2, // Double the delay each time
};
```

Default configuration for retry behavior.

### Validation

Utilities for validating user input.

```typescript
import { parseUserInput } from './utils/validation';
```

#### Functions

##### `parseUserInput`

```typescript
function parseUserInput(input: unknown): {
  success: boolean;
  data?: UserPreferences;
  error?: z.ZodError;
};
```

Validates and parses user input against the UserPreferences schema.

- **Parameters**:
  - `input`: Raw user input
- **Returns**: Object with validation status, parsed data, and error information if applicable
- **Description**: Uses Zod to validate input against the UserPreferences schema.

## Types

### Diet Types and Goals

```typescript
import { DietType, DietGoal } from './utils/types';
```

#### DietType

Enumerates the diet types supported by the planner.

```typescript
enum DietType {
  REGULAR = 'regular',
  VEGETARIAN = 'vegetarian',
  VEGAN = 'vegan',
  KETO = 'keto',
  PALEO = 'paleo',
  LOW_CARB = 'low_carb',
  GLUTEN_FREE = 'gluten_free',
  DAIRY_FREE = 'dairy_free',
}
```

#### DietGoal

Enumerates the user goals for their diet plan.

```typescript
enum DietGoal {
  WEIGHT_LOSS = 'weight_loss',
  WEIGHT_GAIN = 'weight_gain',
  MAINTENANCE = 'maintenance',
  MUSCLE_GAIN = 'muscle_gain',
  GENERAL_HEALTH = 'general_health',
}
```

### User Preferences

```typescript
import { UserPreferences, UserPreferencesSchema } from './utils/types';
```

#### UserPreferencesSchema

Zod schema for validating user preferences.

```typescript
const UserPreferencesSchema = z.object({
  dietType: z.nativeEnum(DietType),
  goal: z.nativeEnum(DietGoal),
  excludedIngredients: z.array(z.string()).optional(),
  calorieTarget: z.number().positive().optional(),
  mealsPerDay: z.number().int().min(1).max(6).default(3),
  planDurationDays: z.number().int().min(1).max(30).default(7),
});
```

#### UserPreferences

Type for user diet preferences, inferred from the schema.

```typescript
type UserPreferences = z.infer<typeof UserPreferencesSchema>;
```

### Diet Plan Structure

```typescript
import { FoodItem, Meal, DailyPlan, DietPlan, OverviewMetrics } from './utils/types';
```

#### FoodItem

Food item with nutritional information.

```typescript
interface FoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
}
```

#### Meal

Meal structure with nutrition information and foods.

```typescript
interface Meal {
  name: string;
  type?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foods?: FoodItem[];
  description?: string;
  ingredients?: string[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  recipe?: string;
}
```

#### DailyPlan

Daily meal plan with multiple meals.

```typescript
interface DailyPlan {
  day: number;
  date: string;
  meals: Meal[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}
```

#### DietPlan

Complete diet plan with multiple daily plans.

```typescript
interface DietPlan {
  userPreferences: UserPreferences;
  dailyPlans: DailyPlan[];
  overview: {
    averageDailyCalories: number;
    averageDailyProtein: number;
    averageDailyCarbs: number;
    averageDailyFat: number;
  };
}
```

#### OverviewMetrics

Overview metrics for a diet plan.

```typescript
interface OverviewMetrics {
  averageDailyCalories: number;
  averageDailyProtein: number;
  averageDailyCarbs: number;
  averageDailyFat: number;
}
```
