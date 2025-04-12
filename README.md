# AI Diet Planner Agent

An intelligent AI-powered diet planning assistant built with TypeScript and the Mastra AI agent framework.

## Features

- Generate personalized diet plans based on user preferences
- Support for various dietary restrictions and goals
- Nutrition data integration for accurate meal planning
- Memory management for personalized user experience

## Tech Stack

- TypeScript
- [Mastra](https://mastra.ai/) AI Agent Framework
- OpenAI LLM Integration
- Zod for validation
- External nutrition APIs

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm (v9 or later)

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

4. Build the project:

```bash
npm run build
```

### Usage

Run the development server:

```bash
npm run dev
```

Or start the production server:

```bash
npm run start
```

## Project Structure

```
diet-planner-agent/
├── src/
│   ├── agents/        # AI agent definitions
│   ├── tools/         # Agent tools and utilities
│   ├── workflows/     # Diet planning workflows
│   ├── utils/         # Helper utilities
│   └── tests/         # Test files
├── dist/              # Compiled output
└── ...                # Config files
```

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

## License

[ISC License](LICENSE)
