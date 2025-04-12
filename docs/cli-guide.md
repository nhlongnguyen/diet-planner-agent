# Diet Planner Agent - CLI Guide

This guide provides instructions for using the Diet Planner Agent through the command line interface (CLI).

## Table of Contents

1. [Installation](#installation)
2. [Basic Commands](#basic-commands)
3. [Configuration](#configuration)
4. [Examples](#examples)
5. [Advanced Usage](#advanced-usage)
6. [Troubleshooting](#troubleshooting)

## Installation

Before using the CLI, ensure you have installed the package:

```bash
# Clone the repository
git clone <repository-url>
cd diet-planner-agent

# Install dependencies
npm install

# Build the project
npm run build

# Create a symlink for the CLI tool (optional)
npm link
```

## Basic Commands

The Diet Planner Agent CLI provides several commands for generating and managing diet plans.

### Generating a New Diet Plan

```bash
# Interactive mode
npm run cli -- plan create

# Direct mode with arguments
npm run cli -- plan create --diet vegetarian --goal weight_loss --meals 3 --duration 7 --calories 1800 --exclude "mushrooms,eggplant"
```

### Listing Plans

```bash
# List all plans for a user
npm run cli -- plan list --user user-123
```

### Viewing a Plan

```bash
# View a specific plan
npm run cli -- plan view --user user-123 --id plan-456

# View a specific day of a plan
npm run cli -- plan view --user user-123 --id plan-456 --day 3
```

### Updating a Plan

```bash
# Interactive update mode
npm run cli -- plan update --user user-123

# Direct update with arguments
npm run cli -- plan update --user user-123 --diet keto --goal maintenance --calories 2000
```

## Configuration

### Environment Variables

The CLI uses the same environment variables as the main application:

- `OPENAI_API_KEY`: Your OpenAI API key
- `NUTRITION_API_KEY`: Your nutrition API key (if using an external API)

You can set these in your `.env` file or directly in your environment.

### User Profile

The CLI stores user preferences and plans in a local JSON database by default. You can specify a custom location with:

```bash
npm run cli -- --data-path /path/to/data plan ...
```

## Examples

### Creating a Weight Loss Plan with Dietary Restrictions

```bash
npm run cli -- plan create --diet vegan --goal weight_loss --meals 4 --duration 14 --calories 1500 --exclude "nuts,soy,gluten"
```

This command creates a 14-day vegan diet plan for weight loss, with:
- 4 meals per day
- Target of 1500 calories per day
- Excluding nuts, soy, and gluten

### Updating a Plan for Building Muscle

```bash
npm run cli -- plan update --user user-123 --diet high_protein --goal muscle_gain --calories 2800 --meals 5
```

This updates the user's plan to focus on muscle gain with:
- High protein diet type
- Increased calorie target (2800 calories)
- 5 meals per day for more frequent protein intake

### Viewing Plan Statistics

```bash
npm run cli -- plan stats --user user-123 --id plan-456
```

This displays detailed nutrition statistics for the plan, including:
- Average daily calories, protein, carbs, and fat
- Macronutrient ratio
- Meal distribution

## Advanced Usage

### Exporting Plans

You can export diet plans in different formats:

```bash
# Export as JSON
npm run cli -- plan export --user user-123 --id plan-456 --format json --output plan.json

# Export as PDF (requires additional dependencies)
npm run cli -- plan export --user user-123 --id plan-456 --format pdf --output plan.pdf

# Export as CSV (for spreadsheet analysis)
npm run cli -- plan export --user user-123 --id plan-456 --format csv --output plan.csv
```

### Scheduling Recurring Plans

You can set up recurring plan regeneration:

```bash
# Create a new plan every week
npm run cli -- plan schedule --user user-123 --interval weekly --diet vegetarian --goal maintenance
```

### Comparing Plans

Compare nutrition statistics between different plans:

```bash
npm run cli -- plan compare --user user-123 --ids "plan-123,plan-456"
```

## Troubleshooting

### Common Errors

#### Invalid Arguments

If you receive an "Invalid arguments" error, check the command format:

```bash
# Display help for a specific command
npm run cli -- plan create --help
```

#### Connection Issues

If you experience API connection issues:

1. Check your internet connection
2. Verify your API keys in the `.env` file
3. Ensure the services are operational

#### Missing Plans

If a plan is reported as missing:

```bash
# List all plans to verify IDs
npm run cli -- plan list --user user-123

# Check if the user ID is correct
npm run cli -- user show --user user-123
```

### Debug Mode

For detailed logging and troubleshooting:

```bash
# Enable debug mode
npm run cli -- --debug plan create ...
```

### Getting Help

```bash
# Display general help
npm run cli -- --help

# Display help for a specific command
npm run cli -- plan --help
npm run cli -- plan create --help
```