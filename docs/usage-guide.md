# Diet Planner Agent - Usage Guide

This guide provides comprehensive information on how to use the Diet Planner Agent in your applications.

## Table of Contents

1. [Installation](#installation)
2. [Basic Usage](#basic-usage)
3. [Advanced Usage](#advanced-usage)
4. [API Reference](#api-reference)
5. [Examples](#examples)
6. [Troubleshooting](#troubleshooting)

## Installation

### Prerequisites

Before installing the Diet Planner Agent, ensure you have:

- Node.js (v18 or later)
- npm (v9 or later)
- OpenAI API key

### Installing the Package

```bash
# Clone the repository
git clone <repository-url>
cd diet-planner-agent

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit the .env file with your API keys
```

Required environment variables:
- `OPENAI_API_KEY`: Your OpenAI API key
- `NUTRITION_API_KEY`: Your nutrition API key (if using an external API)

## Basic Usage

### Creating a Diet Plan

The simplest way to create a diet plan is using the `DietPlanningWorkflow` class:

```typescript
import { DietPlanningWorkflow } from './src/workflows/dietPlanningWorkflow';
import { UserPreferences, DietType, DietGoal } from './src/utils/types';

async function createBasicDietPlan() {
  // Initialize the workflow
  const workflow = new DietPlanningWorkflow();
  
  // Define user preferences
  const userPreferences: UserPreferences = {
    dietType: DietType.VEGETARIAN,
    goal: DietGoal.WEIGHT_LOSS,
    excludedIngredients: ['mushrooms', 'eggplant'],
    calorieTarget: 1800,
    mealsPerDay: 3,
    planDurationDays: 7,
  };
  
  // Generate diet plan
  const result = await workflow.process(userPreferences, 'user-123');
  
  if (result.success && result.data) {
    console.log('Diet plan generated successfully!');
    console.log('Plan ID:', result.planId);
    console.log('Diet Plan Overview:', result.data.overview);
    console.log('First day meals:', result.data.dailyPlans[0].meals);
  } else {
    console.error('Failed to generate diet plan:', result.error);
  }
}

// Run the function
createBasicDietPlan();
```

### Retrieving a Diet Plan

To retrieve a previously generated plan:

```typescript
async function getPreviousPlan(userId: string, planId: string) {
  const workflow = new DietPlanningWorkflow();
  
  const result = await workflow.getPlan(userId, planId);
  
  if (result.success && result.data) {
    console.log('Successfully retrieved plan!');
    console.log('Diet Plan Overview:', result.data.overview);
  } else {
    console.error('Failed to retrieve plan:', result.error);
  }
}
```

## Advanced Usage

### Updating an Existing Plan

You can update a plan with new preferences:

```typescript
async function updateExistingPlan(userId: string) {
  const workflow = new DietPlanningWorkflow();
  
  // Get existing preferences
  const existingPreferences = await workflow.getUserPreferences(userId);
  
  if (!existingPreferences) {
    console.error('No existing preferences found for user');
    return;
  }
  
  // Update some preferences
  const updatedPreferences = {
    ...existingPreferences,
    calorieTarget: 2000, // Changed calorie target
    excludedIngredients: [
      ...(existingPreferences.excludedIngredients || []),
      'bell peppers', // Add a new excluded ingredient
    ],
  };
  
  // Generate updated plan
  const result = await workflow.updatePlan(updatedPreferences, userId);
  
  if (result.success && result.data) {
    console.log('Plan updated successfully!');
    console.log('New Plan ID:', result.planId);
    console.log('Updated Plan Overview:', result.data.overview);
  } else {
    console.error('Failed to update plan:', result.error);
  }
}
```

### Listing All Plans for a User

To retrieve all plans for a specific user:

```typescript
async function listUserPlans(userId: string) {
  const workflow = new DietPlanningWorkflow();
  
  const planIds = await workflow.listUserPlans(userId);
  
  console.log(`User has ${planIds.length} plans saved.`);
  console.log('Plan IDs:', planIds);
  
  // Optionally fetch each plan
  for (const planId of planIds) {
    const planResult = await workflow.getPlan(userId, planId);
    if (planResult.success) {
      console.log(`Plan ${planId}:`, planResult.data?.overview);
    }
  }
}
```

## API Reference

### DietPlanningWorkflow

The main workflow class that orchestrates the diet planning process.

#### Constructor

```typescript
constructor()
```

Creates a new instance of the workflow with the necessary dependencies.

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

- `userInput`: Raw user input (will be validated)
- `userId`: Optional user identifier for persistence
- Returns: Object with success status, plan data, plan ID, and error information if applicable

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

- `updatedPreferences`: New user preferences
- `userId`: User identifier
- Returns: Object with success status, updated plan data, new plan ID, and error information if applicable

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

- `userId`: User identifier
- `planId`: Plan identifier
- Returns: Object with success status, plan data, and error information if applicable

##### `listUserPlans`

```typescript
async listUserPlans(userId: string): Promise<string[]>
```

Lists all plans for a specific user.

- `userId`: User identifier
- Returns: Array of plan IDs

##### `getUserPreferences`

```typescript
async getUserPreferences(userId: string): Promise<UserPreferences | null>
```

Gets saved preferences for a specific user.

- `userId`: User identifier
- Returns: User preferences or null if not found

### DietPlannerAgent

The agent responsible for generating diet plans using LLMs.

```typescript
generateDietPlan(preferences: UserPreferences): Promise<DietPlan>
```

Generates a diet plan based on user preferences.

- `preferences`: Validated user preferences
- Returns: Complete diet plan

### Types

#### UserPreferences

```typescript
{
  dietType: DietType;          // Diet type (e.g., VEGETARIAN, VEGAN)
  goal: DietGoal;              // Diet goal (e.g., WEIGHT_LOSS)
  excludedIngredients?: string[]; // Optional ingredients to exclude
  calorieTarget?: number;      // Optional daily calorie target
  mealsPerDay: number;         // Number of meals per day (1-6)
  planDurationDays: number;    // Duration of plan in days (1-30)
}
```

#### DietPlan

```typescript
{
  userPreferences: UserPreferences; // Original user preferences
  dailyPlans: DailyPlan[];         // Array of daily meal plans
  overview: {                      // Overall plan metrics
    averageDailyCalories: number;
    averageDailyProtein: number;
    averageDailyCarbs: number;
    averageDailyFat: number;
  };
}
```

#### DailyPlan

```typescript
{
  day: number;                // Day number (1-based)
  date: string;               // Date string
  meals: Meal[];              // Array of meals for the day
  totalCalories: number;      // Total calories for the day
  totalProtein: number;       // Total protein for the day
  totalCarbs: number;         // Total carbs for the day
  totalFat: number;           // Total fat for the day
}
```

#### Meal

```typescript
{
  name: string;               // Meal name
  type?: 'breakfast' | 'lunch' | 'dinner' | 'snack'; // Optional meal type
  foods?: FoodItem[];         // Optional array of food items
  description?: string;       // Optional meal description
  ingredients?: string[];     // Optional list of ingredients
  totalCalories: number;      // Total calories for the meal
  totalProtein: number;       // Total protein for the meal
  totalCarbs: number;         // Total carbs for the meal
  totalFat: number;           // Total fat for the meal
  recipe?: string;            // Optional recipe instructions
}
```

## Examples

### Complete Example with Error Handling

```typescript
import { DietPlanningWorkflow } from './src/workflows/dietPlanningWorkflow';
import { UserPreferences, DietType, DietGoal } from './src/utils/types';

async function comprehensiveExample() {
  try {
    // Initialize workflow
    const workflow = new DietPlanningWorkflow();
    
    // User ID for persistence
    const userId = 'user-456';
    
    // Check for existing preferences
    const existingPreferences = await workflow.getUserPreferences(userId);
    
    let userPreferences: UserPreferences;
    
    if (existingPreferences) {
      console.log('Found existing preferences:', existingPreferences);
      userPreferences = existingPreferences;
    } else {
      // Define new preferences
      userPreferences = {
        dietType: DietType.KETO,
        goal: DietGoal.WEIGHT_LOSS,
        excludedIngredients: ['peanuts', 'shellfish'],
        calorieTarget: 1600,
        mealsPerDay: 4,
        planDurationDays: 5,
      };
    }
    
    // Generate a diet plan
    console.log('Generating diet plan with preferences:', userPreferences);
    const result = await workflow.process(userPreferences, userId);
    
    if (!result.success) {
      throw new Error(`Failed to generate plan: ${result.error}`);
    }
    
    console.log('Diet plan generated successfully!');
    console.log('Plan ID:', result.planId);
    console.log('Overview:', result.data?.overview);
    
    // List all plans for the user
    const allPlans = await workflow.listUserPlans(userId);
    console.log(`User has ${allPlans.length} total plans`);
    
    // If user has multiple plans, retrieve the oldest one for comparison
    if (allPlans.length > 1) {
      const oldestPlanId = allPlans[0];
      console.log(`Retrieving oldest plan (${oldestPlanId}) for comparison...`);
      
      const oldPlanResult = await workflow.getPlan(userId, oldestPlanId);
      
      if (oldPlanResult.success && oldPlanResult.data) {
        console.log('Oldest plan overview:', oldPlanResult.data.overview);
        console.log('Comparison with new plan:');
        
        const oldPlan = oldPlanResult.data;
        const newPlan = result.data!;
        
        console.log(`Calorie difference: ${
          newPlan.overview.averageDailyCalories - oldPlan.overview.averageDailyCalories
        } calories`);
      }
    }
    
    return result.data;
  } catch (error) {
    console.error('Error in diet planning example:', error);
    throw error;
  }
}

// Run the example
comprehensiveExample()
  .then((plan) => {
    if (plan) {
      console.log('Example completed successfully!');
    }
  })
  .catch((error) => {
    console.error('Example failed:', error);
  });
```

## Troubleshooting

### Common Errors

#### Invalid Input

If you receive an "Invalid input" error, check that your `UserPreferences` object matches the expected schema:

```typescript
// Make sure all required fields are present
const validPreferences: UserPreferences = {
  dietType: DietType.REGULAR,  // Must be a valid DietType enum value
  goal: DietGoal.MAINTENANCE,  // Must be a valid DietGoal enum value
  mealsPerDay: 3,              // Must be between 1-6
  planDurationDays: 7,         // Must be between 1-30
  // Optional fields:
  excludedIngredients: ['mushrooms'],
  calorieTarget: 2000,
};
```

#### Plan Not Found

If you receive a "Plan not found" error when retrieving a plan:

1. Ensure the `userId` and `planId` are correct
2. Check if the plan exists by listing all plans for the user:

```typescript
const allPlans = await workflow.listUserPlans(userId);
console.log('Available plans:', allPlans);
```

#### API Connection Issues

If you experience issues with the OpenAI API or Nutrition API:

1. Check that your API keys are correctly set in the `.env` file
2. Ensure you have sufficient API credits or subscription
3. Check your internet connection
4. Verify the API service is operational