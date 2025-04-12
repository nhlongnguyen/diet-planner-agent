import readline from 'readline';
import { DietPlanningWorkflow } from './workflows/dietPlanningWorkflow';
import { UserPreferences, DietType, DietGoal, DietPlan } from './utils/types';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

class DietPlannerCLI {
  private workflow: DietPlanningWorkflow;
  private userId: string = 'cli-user';
  private currentPlanId: string | undefined;

  constructor() {
    this.workflow = new DietPlanningWorkflow();
  }

  /**
   * Prompts the user with a question and returns their answer
   */
  private ask(question: string): Promise<string> {
    return new Promise((resolve) => {
      rl.question(`${question} `, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  /**
   * Displays the main menu and handles user selection
   */
  private async mainMenu(): Promise<void> {
    console.clear();
    console.log('==============================');
    console.log('🥗 DIET PLANNER AGENT CLI 🥗');
    console.log('==============================\n');

    console.log('1. Create a new diet plan');
    console.log('2. View existing plans');
    console.log('3. Update current plan');
    console.log('4. View your preferences');
    console.log('5. Quit\n');

    const choice = await this.ask('Enter your choice (1-5):');

    switch (choice) {
      case '1':
        await this.createNewPlan();
        break;
      case '2':
        await this.viewPlans();
        break;
      case '3':
        await this.updatePlan();
        break;
      case '4':
        await this.viewPreferences();
        break;
      case '5':
        this.quit();
        return;
      default:
        console.log('Invalid choice. Please try again.');
        await this.waitForKeypress();
        await this.mainMenu();
    }
  }

  /**
   * Collects user preferences and creates a new diet plan
   */
  private async createNewPlan(): Promise<void> {
    console.clear();
    console.log('=== Create a New Diet Plan ===\n');

    const preferences: Partial<UserPreferences> = {};

    // Diet type
    console.log('Select Diet Type:');
    Object.values(DietType).forEach((type, index) => {
      console.log(
        `${index + 1}. ${type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}`
      );
    });
    const dietTypeChoice = parseInt(await this.ask('Enter choice:')) - 1;
    preferences.dietType = Object.values(DietType)[dietTypeChoice];

    // Diet goal
    console.log('\nSelect Diet Goal:');
    Object.values(DietGoal).forEach((goal, index) => {
      console.log(
        `${index + 1}. ${goal.charAt(0).toUpperCase() + goal.slice(1).replace('_', ' ')}`
      );
    });
    const dietGoalChoice = parseInt(await this.ask('Enter choice:')) - 1;
    preferences.goal = Object.values(DietGoal)[dietGoalChoice];

    // Excluded ingredients
    const excludedInput = await this.ask('\nEnter ingredients to exclude (comma-separated):');
    preferences.excludedIngredients = excludedInput
      ? excludedInput.split(',').map((i) => i.trim())
      : [];

    // Calorie target
    const calorieInput = await this.ask(
      '\nEnter daily calorie target (or press enter for automatic):'
    );
    preferences.calorieTarget = calorieInput ? parseInt(calorieInput) : undefined;

    // Meals per day
    const mealsInput = await this.ask('\nEnter number of meals per day (1-6, default 3):');
    preferences.mealsPerDay = mealsInput ? parseInt(mealsInput) : 3;

    // Plan duration
    const durationInput = await this.ask('\nEnter plan duration in days (1-30, default 7):');
    preferences.planDurationDays = durationInput ? parseInt(durationInput) : 7;

    console.log('\nGenerating your personalized diet plan...');

    try {
      const result = await this.workflow.process(preferences as UserPreferences, this.userId);

      if (result.success && result.data) {
        this.currentPlanId = result.planId;
        console.log('\n✅ Diet plan created successfully!');
        this.displayPlan(result.data);
      } else {
        console.log(`\n❌ Failed to create diet plan: ${result.error}`);
      }
    } catch (error) {
      console.error('Error creating diet plan:', error);
    }

    await this.waitForKeypress();
    await this.mainMenu();
  }

  /**
   * Displays all user plans and allows viewing a specific one
   */
  private async viewPlans(): Promise<void> {
    console.clear();
    console.log('=== Your Diet Plans ===\n');

    try {
      const plans = await this.workflow.listUserPlans(this.userId);

      if (plans.length === 0) {
        console.log('You have no saved diet plans. Create one first!');
        await this.waitForKeypress();
        await this.mainMenu();
        return;
      }

      console.log('Select a plan to view:');
      plans.forEach((planId, index) => {
        console.log(`${index + 1}. Plan ID: ${planId}`);
      });

      const choice = parseInt(await this.ask('Enter plan number:')) - 1;

      if (choice >= 0 && choice < plans.length) {
        const planId = plans[choice];
        const result = await this.workflow.getPlan(this.userId, planId);

        if (result.success && result.data) {
          this.currentPlanId = planId;
          this.displayPlan(result.data);
        } else {
          console.log(`\n❌ Failed to load plan: ${result.error}`);
        }
      } else {
        console.log('Invalid selection.');
      }
    } catch (error) {
      console.error('Error viewing plans:', error);
    }

    await this.waitForKeypress();
    await this.mainMenu();
  }

  /**
   * Updates the current plan with new preferences
   */
  private async updatePlan(): Promise<void> {
    if (!this.currentPlanId) {
      console.log('No current plan selected. Please view or create a plan first.');
      await this.waitForKeypress();
      await this.mainMenu();
      return;
    }

    // Get current preferences as a starting point
    const currentPrefs = await this.workflow.getUserPreferences(this.userId);

    if (!currentPrefs) {
      console.log('Could not find your current preferences. Try creating a new plan.');
      await this.waitForKeypress();
      await this.mainMenu();
      return;
    }

    console.clear();
    console.log('=== Update Your Diet Plan ===\n');
    console.log('Current preferences:');
    console.log(JSON.stringify(currentPrefs, null, 2));
    console.log('\nLeave responses blank to keep current values.\n');

    const updatedPrefs: UserPreferences = { ...currentPrefs };

    // Update diet type
    console.log('Select new Diet Type:');
    Object.values(DietType).forEach((type, index) => {
      const marker = type === currentPrefs.dietType ? '* ' : '  ';
      console.log(
        `${marker}${index + 1}. ${type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}`
      );
    });
    const dietTypeInput = await this.ask('Enter choice (or press enter to keep current):');
    if (dietTypeInput) {
      const dietTypeChoice = parseInt(dietTypeInput) - 1;
      updatedPrefs.dietType = Object.values(DietType)[dietTypeChoice];
    }

    // Similar pattern for other preferences...
    // For brevity, just updating excluded ingredients and calorie target

    // Update excluded ingredients
    const currentExcluded = currentPrefs.excludedIngredients?.join(', ') || 'None';
    const excludedInput = await this.ask(`\nExcluded ingredients (current: ${currentExcluded}):`);
    if (excludedInput) {
      updatedPrefs.excludedIngredients = excludedInput.split(',').map((i) => i.trim());
    }

    // Update calorie target
    const currentCalories = currentPrefs.calorieTarget || 'Auto';
    const calorieInput = await this.ask(`\nCalorie target (current: ${currentCalories}):`);
    if (calorieInput) {
      updatedPrefs.calorieTarget = parseInt(calorieInput);
    }

    console.log('\nUpdating your diet plan...');

    try {
      const result = await this.workflow.updatePlan(updatedPrefs, this.userId);

      if (result.success && result.data) {
        this.currentPlanId = result.planId;
        console.log('\n✅ Diet plan updated successfully!');
        this.displayPlan(result.data);
      } else {
        console.log(`\n❌ Failed to update diet plan: ${result.error}`);
      }
    } catch (error) {
      console.error('Error updating diet plan:', error);
    }

    await this.waitForKeypress();
    await this.mainMenu();
  }

  /**
   * Views the user's current preferences
   */
  private async viewPreferences(): Promise<void> {
    console.clear();
    console.log('=== Your Diet Preferences ===\n');

    try {
      const preferences = await this.workflow.getUserPreferences(this.userId);

      if (preferences) {
        console.log(JSON.stringify(preferences, null, 2));
      } else {
        console.log('You have no saved preferences. Create a diet plan first!');
      }
    } catch (error) {
      console.error('Error viewing preferences:', error);
    }

    await this.waitForKeypress();
    await this.mainMenu();
  }

  /**
   * Displays a diet plan
   */
  private displayPlan(plan: DietPlan): void {
    console.log('\n=== DIET PLAN OVERVIEW ===');
    console.log(`Diet Type: ${plan.userPreferences.dietType}`);
    console.log(`Goal: ${plan.userPreferences.goal}`);
    console.log(`Duration: ${plan.userPreferences.planDurationDays} days`);
    console.log(`Meals per day: ${plan.userPreferences.mealsPerDay}`);

    console.log('\n=== NUTRITIONAL AVERAGES ===');
    console.log(`Calories: ${Math.round(plan.overview.averageDailyCalories)} kcal`);
    console.log(`Protein: ${Math.round(plan.overview.averageDailyProtein)}g`);
    console.log(`Carbs: ${Math.round(plan.overview.averageDailyCarbs)}g`);
    console.log(`Fat: ${Math.round(plan.overview.averageDailyFat)}g`);

    // Display the first day as a preview
    if (plan.dailyPlans.length > 0) {
      const firstDay = plan.dailyPlans[0];

      console.log(`\n=== SAMPLE DAY (Day ${firstDay.day}) ===`);

      firstDay.meals.forEach((meal) => {
        console.log(`\n${meal.type?.toUpperCase() || 'MEAL'}: ${meal.name}`);
        console.log(
          `Calories: ${meal.totalCalories} kcal | Protein: ${meal.totalProtein}g | Carbs: ${meal.totalCarbs}g | Fat: ${meal.totalFat}g`
        );

        if (meal.description) {
          console.log(`Description: ${meal.description}`);
        }

        if (meal.ingredients && meal.ingredients.length > 0) {
          console.log('Key ingredients: ' + meal.ingredients.join(', '));
        }
      });

      console.log(`\nTotal for day: ${firstDay.totalCalories} kcal`);
    }
  }

  /**
   * Waits for a keypress before continuing
   */
  private async waitForKeypress(): Promise<void> {
    console.log('\nPress any key to continue...');
    return new Promise((resolve) => {
      process.stdin.once('data', () => {
        resolve();
      });
    });
  }

  /**
   * Quits the application
   */
  private quit(): void {
    console.log('Thank you for using the Diet Planner Agent CLI! Goodbye.');
    rl.close();
    process.exit(0);
  }

  /**
   * Starts the CLI
   */
  public async start(): Promise<void> {
    try {
      await this.mainMenu();
    } catch (error) {
      console.error('An unexpected error occurred:', error);
      this.quit();
    }
  }
}

// Run the CLI when this file is executed directly
if (require.main === module) {
  const cli = new DietPlannerCLI();
  cli.start().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { DietPlannerCLI };
