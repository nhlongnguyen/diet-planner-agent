# AI Diet Planner Agent

An intelligent AI-powered diet planning assistant built with TypeScript and the Mastra AI agent framework. This tool generates personalized diet plans based on user preferences, dietary restrictions, and nutritional goals.

## Features

- Generate personalized diet plans based on user preferences
- Support for various dietary restrictions (vegetarian, vegan, keto, etc.)
- Customizable calorie and macronutrient targets
- Exclude specific ingredients based on allergies or preferences
- Nutrition data integration for accurate meal planning
- Memory management for persistent user experience
- Plan retrieval and updating capabilities
- OpenAI API rate limit handling with exponential backoff

## Tech Stack

- TypeScript
- [Mastra](https://mastra.ai/) AI Agent Framework for LLM orchestration
- OpenAI LLM Integration
- Zod for validation and type safety
- External nutrition APIs (mock implementation available)

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm (v9 or later)
- OpenAI API key

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd diet-planner-agent
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
# Edit .env with your API keys
```

Required environment variables:

- `OPENAI_API_KEY`: Your OpenAI API key
- `NUTRITION_API_KEY`: Your nutrition API key (if using an external API)

Optional environment variables for rate limiting:

- `OPENAI_MAX_RETRIES`: Number of retries when hitting rate limits (default: 5)
- `OPENAI_INITIAL_DELAY_MS`: Initial delay between retries in milliseconds (default: 1000)
- `OPENAI_MAX_DELAY_MS`: Maximum delay between retries in milliseconds (default: 60000)
- `OPENAI_BACKOFF_FACTOR`: Factor to increase delay by after each retry (default: 2)

4. Build the project:

```bash
npm run build
```

### Usage

#### Running the Application

```bash
npm run dev  # Development mode with hot-reloading
```

Or in production:

```bash
npm run build
npm run start
```

#### Basic Example

```typescript
import { DietPlanningWorkflow } from './workflows/dietPlanningWorkflow';
import { UserPreferences, DietType, DietGoal } from './utils/types';

async function createDietPlan() {
  // Initialize the workflow
  const workflow = new DietPlanningWorkflow();

  // User preferences
  const userPreferences: UserPreferences = {
    dietType: DietType.VEGETARIAN,
    goal: DietGoal.WEIGHT_LOSS,
    excludedIngredients: ['mushrooms', 'eggplant'],
    calorieTarget: 1800,
    mealsPerDay: 3,
    planDurationDays: 7,
  };

  // Generate a diet plan
  const result = await workflow.process(userPreferences, 'user-123');

  if (result.success && result.data) {
    console.log('Diet plan generated successfully!');
    console.log('Plan ID:', result.planId);
    console.log('Diet Plan Overview:', result.data.overview);
  } else {
    console.error('Failed to generate diet plan:', result.error);
  }
}

createDietPlan();
```

## Project Structure

```
diet-planner-agent/
├── src/
│   ├── agents/        # AI agent definitions
│   │   └── dietPlannerAgent.ts
│   ├── tools/         # Agent tools and utilities
│   ├── workflows/     # Diet planning workflows
│   │   └── dietPlanningWorkflow.ts
│   ├── utils/         # Helper utilities
│   │   ├── types.ts
│   │   ├── validation.ts
│   │   └── memoryManager.ts
│   ├── services/      # External service integrations
│   │   └── nutritionService.ts
│   ├── tests/         # Test files
│   └── index.ts       # Entry point
├── dist/              # Compiled output
└── ...                # Config files
```

## API Reference

### DietPlanningWorkflow

The main workflow class that orchestrates the diet planning process.

#### Methods

- `process(userInput: unknown, userId?: string)`: Processes user preferences and generates a diet plan
- `updatePlan(updatedPreferences: UserPreferences, userId: string)`: Updates an existing plan with new preferences
- `getPlan(userId: string, planId: string)`: Retrieves a previously generated plan
- `listUserPlans(userId: string)`: Lists all plans for a user
- `getUserPreferences(userId: string)`: Gets saved preferences for a user

### UserPreferences

The configuration object for diet plan generation.

```typescript
{
  dietType: DietType;          // E.g., VEGETARIAN, VEGAN, KETO
  goal: DietGoal;              // E.g., WEIGHT_LOSS, MAINTENANCE
  excludedIngredients?: string[]; // Optional ingredients to exclude
  calorieTarget?: number;      // Optional daily calorie target
  mealsPerDay: number;         // Number of meals per day (1-6)
  planDurationDays: number;    // Duration of plan in days (1-30)
}
```

## Rate Limiting

The application includes built-in rate limit handling for OpenAI API calls with exponential backoff:

- Automatically retries requests when hitting rate limits (HTTP 429 errors)
- Uses configurable exponential backoff to space out retries
- Adds small random jitter to prevent thundering herd problems
- Configurable via environment variables

Example configuration in `.env` file:

```
OPENAI_MAX_RETRIES=5
OPENAI_INITIAL_DELAY_MS=1000
OPENAI_MAX_DELAY_MS=60000
OPENAI_BACKOFF_FACTOR=2
```

This helps prevent API failures during high-load periods or when approaching OpenAI's rate limits.

## Development

Run tests:

```bash
npm test
```

Lint code:

```bash
npm run lint
```

Format code:

```bash
npm run format
```

## Error Handling

The application uses a consistent error handling approach:

- All public methods return objects with `success` boolean
- Errors include descriptive messages in the `error` property
- Input validation errors are formatted for readability

## License

[ISC License](LICENSE)
