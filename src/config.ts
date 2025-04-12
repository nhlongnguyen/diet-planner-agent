import dotenv from 'dotenv';
import { RetryOptions } from './utils/apiRateLimiting';

// Make sure environment variables are loaded
dotenv.config();

// Check for API key and log status
const apiKey = process.env.OPENAI_API_KEY || '';
if (!apiKey) {
  console.warn('WARNING: OPENAI_API_KEY is not set in the environment variables');
} else {
  console.log(`OpenAI API key loaded (length: ${apiKey.length})`);
}

// Check if mock mode is enabled via env var
const useMockMode = process.env.USE_MOCK_MODE === 'true';
if (useMockMode) {
  console.log('🔧 MOCK MODE ENABLED: Using mock responses instead of calling OpenAI API');
}

// Rate limiting configuration from environment variables with defaults
const rateLimitConfig: RetryOptions = {
  maxRetries: parseInt(process.env.OPENAI_MAX_RETRIES || '5', 10),
  initialDelayMs: parseInt(process.env.OPENAI_INITIAL_DELAY_MS || '1000', 10),
  maxDelayMs: parseInt(process.env.OPENAI_MAX_DELAY_MS || '60000', 10),
  backoffFactor: parseFloat(process.env.OPENAI_BACKOFF_FACTOR || '2'),
};

/**
 * Configuration for the application
 */
export const config = {
  // OpenAI API key from environment variable
  openaiApiKey: apiKey,

  // API model to use
  openaiModel: 'gpt-4o-mini', // Changed to gpt 4o mini

  // Default data storage path
  dataStoragePath: './data',

  // Mock mode flag - when true, the app will use mock responses instead of calling OpenAI
  useMockMode: useMockMode,

  // Rate limiting configuration
  rateLimiting: rateLimitConfig,
};
