import { withRetry, DEFAULT_RETRY_OPTIONS } from '../apiRateLimiting';

describe('API Rate Limiting', () => {
  // Save the original setTimeout
  const originalSetTimeout = global.setTimeout;

  beforeEach(() => {
    // Mock setTimeout to make tests faster
    jest.useFakeTimers();
    // Make Date.now() more predictable
    jest.spyOn(Date, 'now').mockImplementation(() => 1000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  test('should successfully execute a function without retries', async () => {
    const mockFn = jest.fn().mockResolvedValue('success');

    const result = withRetry(mockFn);

    // Fast-forward until all timers have been executed
    jest.runAllTimers();

    await expect(result).resolves.toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  test('should retry when a rate limit error occurs', async () => {
    const error429 = new Error('429 Too Many Requests');
    Object.defineProperty(error429, 'status', { value: 429 });

    const mockFn = jest
      .fn()
      .mockRejectedValueOnce(error429) // First call fails with 429
      .mockResolvedValueOnce('success'); // Second call succeeds

    const resultPromise = withRetry(mockFn, { initialDelayMs: 100 });

    // Fast-forward until all timers have been executed
    jest.runAllTimers();

    await expect(resultPromise).resolves.toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  test('should retry up to maxRetries times', async () => {
    const error429 = new Error('429 Too Many Requests');
    Object.defineProperty(error429, 'status', { value: 429 });

    const mockFn = jest.fn().mockRejectedValue(error429); // Always fails with 429

    const resultPromise = withRetry(mockFn, { maxRetries: 3, initialDelayMs: 100 });

    // Fast-forward until all timers have been executed
    jest.runAllTimers();

    await expect(resultPromise).rejects.toEqual(error429);
    expect(mockFn).toHaveBeenCalledTimes(3); // Initial call + 2 retries
  });

  test('should not retry for non-rate limit errors', async () => {
    const error500 = new Error('500 Internal Server Error');
    Object.defineProperty(error500, 'status', { value: 500 });

    const mockFn = jest.fn().mockRejectedValue(error500);

    const resultPromise = withRetry(mockFn);

    // Fast-forward until all timers have been executed
    jest.runAllTimers();

    await expect(resultPromise).rejects.toEqual(error500);
    expect(mockFn).toHaveBeenCalledTimes(1); // No retries
  });

  test('should apply exponential backoff', async () => {
    jest.useRealTimers(); // Use real timers for this test

    const error429 = new Error('429 Too Many Requests');
    Object.defineProperty(error429, 'status', { value: 429 });

    const mockFn = jest
      .fn()
      .mockRejectedValueOnce(error429) // First call fails
      .mockRejectedValueOnce(error429) // Second call fails
      .mockResolvedValueOnce('success'); // Third call succeeds

    const setTimeoutSpy = jest.spyOn(global, 'setTimeout');

    // Use deterministic config without jitter for testing
    const result = await withRetry(mockFn, {
      maxRetries: 3,
      initialDelayMs: 100,
      backoffFactor: 2,
      maxDelayMs: 1000,
    });

    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(3);

    // Check that setTimeout was called with exponentially increasing delays
    // First retry should be ~100ms (give or take a bit for jitter)
    expect(setTimeoutSpy).toHaveBeenNthCalledWith(1, expect.any(Function), expect.any(Number));
    expect(setTimeoutSpy.mock.calls[0][1]).toBeGreaterThanOrEqual(80); // Allow for jitter
    expect(setTimeoutSpy.mock.calls[0][1]).toBeLessThanOrEqual(140); // Allow for jitter

    // Second retry should be ~200ms
    expect(setTimeoutSpy).toHaveBeenNthCalledWith(2, expect.any(Function), expect.any(Number));
    expect(setTimeoutSpy.mock.calls[1][1]).toBeGreaterThanOrEqual(160); // Allow for jitter
    expect(setTimeoutSpy.mock.calls[1][1]).toBeLessThanOrEqual(280); // Allow for jitter

    setTimeoutSpy.mockRestore();
  });
});
