/**
 * Retry Utility with Exponential Backoff
 * CONSTRUCTORA WM/M&S - "CONSTRUYENDO EL FUTURO"
 * 
 * Provides retry logic with exponential backoff for resilient operations
 */

export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  shouldRetry?: (error: any) => boolean;
  onRetry?: (attempt: number, error: any) => void;
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 16000,
  shouldRetry: (error: any) => {
    // Don't retry on client errors (4xx)
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('401') || errorMessage.includes('403') || 
        errorMessage.includes('404') || errorMessage.includes('422')) {
      return false;
    }
    return true;
  },
  onRetry: () => {},
};

/**
 * Retry an operation with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < opts.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check if we should retry this error
      if (!opts.shouldRetry(error)) {
        throw lastError;
      }
      
      // If this is the last attempt, don't wait
      if (attempt === opts.maxRetries - 1) {
        throw lastError;
      }
      
      // Calculate delay with exponential backoff and jitter
      const delay = Math.min(
        opts.baseDelayMs * Math.pow(2, attempt) + Math.random() * 1000,
        opts.maxDelayMs
      );
      
      // Call onRetry callback
      opts.onRetry(attempt + 1, error);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError || new Error(`Failed after ${opts.maxRetries} retries`);
}

/**
 * Retry with specific backoff for network errors
 */
export async function retryNetworkOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 5
): Promise<T> {
  return retryWithBackoff(operation, {
    maxRetries,
    baseDelayMs: 1000,
    maxDelayMs: 30000,
    shouldRetry: (error: any) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      // Retry on network errors, timeouts, and 5xx errors
      return errorMessage.includes('fetch') || 
             errorMessage.includes('network') || 
             errorMessage.includes('timeout') ||
             errorMessage.includes('5') ||
             errorMessage.includes('ECONNREFUSED') ||
             errorMessage.includes('ETIMEDOUT');
    },
    onRetry: (attempt, error) => {
      console.warn(`Retry attempt ${attempt} for network operation:`, error.message);
    },
  });
}

/**
 * Retry with short backoff for quick operations
 */
export async function retryQuickOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 2
): Promise<T> {
  return retryWithBackoff(operation, {
    maxRetries,
    baseDelayMs: 200,
    maxDelayMs: 1000,
  });
}

/**
 * Create a debounced version of a function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  waitMs: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func(...args);
    }, waitMs);
  };
}

/**
 * Create a throttled version of a function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limitMs: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limitMs);
    }
  };
}