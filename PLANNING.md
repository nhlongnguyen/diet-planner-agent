# AI Diet Planner Agent – Planning Document

## Tech Stack

- **Language**: TypeScript
- **AI Agent Framework**: [Mastra](https://mastra.ai/) – Native TypeScript framework for building AI agents
- **LLM Provider**: OpenAI (via `@ai-sdk/openai`)
- **Validation**: Zod – Type-safe schema validation
- **Environment Configuration**: dotenv
- **External APIs**: Nutrition and food APIs (e.g., Edamam, Spoonacular, or USDA)
- **Dev Tools**:
  - ESLint (for linting)
  - Prettier (for code formatting)
  - Jest (for testing)

---

## Core Functionalities

- **User Input Handling**:
  - Capture user preferences like diet type, exclusions, goals, and duration.
  - Validate input using Zod schemas.
- **Diet Plan Generation**:
  - Use LLM to generate a personalized diet plan.
  - Adjust based on user dietary rules (e.g., keto, vegan).
- **Nutritional Data Integration**:
  - Fetch and include detailed nutrition data for generated meals from external APIs.
- **Memory Management**:
  - Track user preferences and history using Mastra’s thread memory feature.
- **Validation**:
  - Use Zod to define expected schemas for both input and LLM-generated output.

---

## Coding Best Practices

- **Type Safety**:
  - Use TypeScript interfaces and Zod schemas consistently.
- **Modular Design**:
  - Separate files by purpose: agents, tools, workflows, utilities.
- **Consistent Style**:
  - Use Prettier and ESLint to enforce formatting and linting rules.
- **Error Handling**:
  - Gracefully catch and log errors from API calls and LLM outputs.
- **Testing**:
  - Write unit tests for logic-heavy modules and integration tests for workflows.
