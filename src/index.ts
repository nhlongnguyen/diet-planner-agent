import dotenv from 'dotenv';
import { DietPlanningWorkflow } from './workflows/dietPlanningWorkflow';
import { UserPreferences, DietType, DietGoal } from './utils/types';

// Load environment variables
dotenv.config();

/**
 * Main entry point for the Diet Planner Agent application
 */
async function main(): Promise<void> {
  console.log('Diet Planner Agent starting...');

  try {
    // Initialize the workflow
    const workflow = new DietPlanningWorkflow();

    // Demo user ID
    const userId = 'demo-user';

    // Example user preferences for testing
    const sampleUserPreferences: UserPreferences = {
      dietType: DietType.VEGETARIAN,
      goal: DietGoal.WEIGHT_LOSS,
      excludedIngredients: ['mushrooms', 'eggplant'],
      calorieTarget: 1800,
      mealsPerDay: 3,
      planDurationDays: 3, // Smaller sample for testing
    };

    // Check if the user already has preferences
    const existingPreferences = await workflow.getUserPreferences(userId);

    if (existingPreferences) {
      console.log('Found existing user preferences:', existingPreferences);
      console.log('Listing existing plans...');

      const existingPlans = await workflow.listUserPlans(userId);

      if (existingPlans.length > 0) {
        console.log(`Found ${existingPlans.length} existing plans:`, existingPlans);

        // Load the most recent plan
        const mostRecentPlanId = existingPlans[existingPlans.length - 1];
        console.log(`Loading most recent plan (${mostRecentPlanId})...`);

        const planResult = await workflow.getPlan(userId, mostRecentPlanId);

        if (planResult.success && planResult.data) {
          console.log('Successfully loaded existing plan!', planResult.data.overview);
        } else {
          console.error('Failed to load plan:', planResult.error);
        }
      } else {
        console.log('No existing plans found for this user.');
      }
    }

    // Generate a new plan
    console.log('Generating new diet plan...');
    const result = await workflow.process(sampleUserPreferences, userId);

    if (result.success && result.data) {
      console.log('Diet plan generated successfully!');
      console.log('Plan ID:', result.planId);
      console.log('Diet Plan Overview:', result.data.overview);
      console.log('Sample day:', result.data.dailyPlans[0]);

      // Update the plan with modified preferences
      const updatedPreferences: UserPreferences = {
        ...sampleUserPreferences,
        calorieTarget: 2000, // Changed calorie target
        excludedIngredients: [...(sampleUserPreferences.excludedIngredients || []), 'bell peppers'], // Added exclusion
      };

      console.log('Updating plan with new preferences...');
      const updateResult = await workflow.updatePlan(updatedPreferences, userId);

      if (updateResult.success) {
        console.log('Plan updated successfully!');
        console.log('New Plan ID:', updateResult.planId);
        console.log('Updated Plan Overview:', updateResult.data?.overview);
      } else {
        console.error('Failed to update plan:', updateResult.error);
      }

      // List all plans for the user
      const allPlans = await workflow.listUserPlans(userId);
      console.log(`User now has ${allPlans.length} plans:`, allPlans);
    } else {
      console.error('Failed to generate diet plan:', result.error);
    }
  } catch (error) {
    console.error('Error in Diet Planner Agent:', error);
  }

  console.log('Diet Planner Agent completed!');
}

// Run the application
main().catch((error) => {
  console.error('Error in Diet Planner Agent:', error);
  process.exit(1);
});
