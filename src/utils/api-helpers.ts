import { AppError, ErrorCategory } from './errorHandling';

/**
 * Executes a function with exponential backoff retry logic
 * @param fn The async function to execute
 * @param maxRetries Maximum number of retry attempts
 * @param initialDelay Initial delay in milliseconds
 * @param shouldRetry Function to determine if error is retryable
 * @returns Promise resolving with function result
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 300,
  shouldRetry: (error: unknown) => boolean = defaultShouldRetry
): Promise<T> {
  let attempt = 0;
  
  while (true) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      
      if (attempt > maxRetries || !shouldRetry(error)) {
        throw error;
      }
      
      // Calculate exponential backoff delay
      const delay = initialDelay * Math.pow(2, attempt - 1);
      console.log(`Retrying (attempt ${attempt} of ${maxRetries}) after ${delay}ms...`);
      
      // Wait for the calculated delay
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Default function to determine if an error is retryable
 * @param error The error to check
 * @returns True if error should be retried, false otherwise
 */
function defaultShouldRetry(error: unknown): boolean {
  // Don't retry validation errors or client errors
  if (error instanceof AppError) {
    if (error.category === ErrorCategory.VALIDATION) {
      return false;
    }
    
    // Retry server errors (500+) but not client errors (400-499)
    if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
      return false;
    }
  }
  
  // Retry network errors and server errors by default
  return true;
}

/**
 * Class for implementing API request throttling to limit rate
 */
export class ThrottledApiClient {
  private requestQueue: Array<() => Promise<unknown>> = [];
  private processing = false;
  private requestsPerSecond: number;
  
  /**
   * Creates a new throttled API client
   * @param requestsPerSecond Maximum requests per second
   */
  constructor(requestsPerSecond = 2) {
    this.requestsPerSecond = requestsPerSecond;
    console.log(`Throttled API client initialized with ${requestsPerSecond} requests per second limit`);
  }
  
  /**
   * Executes a request through the throttled queue
   * @param requestFn Function that performs the actual request
   * @returns Promise resolving to the request result
   */
  async request<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      if (!this.processing) {
        this.processQueue();
      }
    });
  }
  
  /**
   * Processes the request queue, respecting rate limits
   */
  private async processQueue() {
    this.processing = true;
    
    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      if (request) {
        try {
          await request();
        } catch (error) {
          console.error('Error in throttled request:', error);
        }
        
        // Wait for rate limit
        if (this.requestQueue.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000 / this.requestsPerSecond));
        }
      }
    }
    
    this.processing = false;
  }
} 