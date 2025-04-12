/**
 * Utility for handling API rate limiting with exponential backoff
 */

/**
 * Options for the retry mechanism
 */
export interface RetryOptions {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffFactor: number;
}

/**
 * Default retry options
 */
export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 5,
  initialDelayMs: 1000, // 1 second
  maxDelayMs: 60000, // 60 seconds (1 minute)
  backoffFactor: 2, // Double the delay each time
};

/**
 * Sleep for a specified number of milliseconds
 * @param ms - Milliseconds to sleep
 */
const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Executes a function with exponential backoff retry logic for handling rate limiting
 * @param fn - Async function to execute
 * @param options - Retry options
 * @returns The result of the function
 * @throws Error if all retries are exhausted
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const config: RetryOptions = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Only retry on rate limit errors (429)
      if (!isRateLimitError(error)) {
        throw error;
      }

      // Don't sleep on the last attempt
      if (attempt < config.maxRetries - 1) {
        // Calculate backoff delay with exponential increase and some jitter
        const delayMs = Math.min(
          config.initialDelayMs *
            Math.pow(config.backoffFactor, attempt) *
            (0.8 + Math.random() * 0.4),
          config.maxDelayMs
        );

        console.log(
          `Rate limit exceeded. Retrying in ${Math.round(delayMs / 1000)} seconds... (Attempt ${attempt + 1}/${config.maxRetries})`
        );
        await sleep(delayMs);
      }
    }
  }

  // If we reached here, all retries failed
  throw lastError || new Error('All retry attempts failed');
}

/**
 * Check if an error is a rate limit error (HTTP 429)
 * @param error - Error to check
 * @returns True if error is a rate limit error
 */
function isRateLimitError(error: any): boolean {
  // OpenAI specific error format
  if (error?.response?.status === 429) {
    return true;
  }

  // Error message contains 429
  if (error?.message?.includes('429')) {
    return true;
  }

  // If using fetch API and the error contains the status code
  if (error?.status === 429) {
    return true;
  }

  return false;
}
