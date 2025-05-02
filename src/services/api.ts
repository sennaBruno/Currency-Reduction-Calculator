import ky from 'ky';

/**
 * Base API service with utility methods for making API requests
 */
export class ApiService {
  /**
   * Make a GET request to the API
   * @param endpoint The API endpoint to call
   * @returns The response data
   */
  static async get<T>(endpoint: string): Promise<T> {
    try {
      return await ky.get(endpoint, {
        timeout: 8000,
        retry: {
          limit: 2,
          methods: ['GET'],
          statusCodes: [408, 429, 500, 502, 503, 504]
        }
      }).json<T>();
    } catch (error: unknown) {
      console.error(`API GET error (${endpoint}):`, error instanceof Error ? error.message : 'Unknown error');
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch data');
    }
  }
  
  /**
   * Make a POST request to the API
   * @param endpoint The API endpoint to call
   * @param data The data to send in the request body
   * @returns The response data
   */
  static async post<T, U>(endpoint: string, data: T): Promise<U> {
    try {
      return await ky.post(endpoint, {
        json: data,
        timeout: 8000,
        retry: {
          limit: 2,
          methods: ['POST'],
          statusCodes: [408, 429, 500, 502, 503, 504]
        }
      }).json<U>();
    } catch (error: unknown) {
      console.error(`API POST error (${endpoint}):`, error instanceof Error ? error.message : 'Unknown error');
      throw new Error(error instanceof Error ? error.message : 'Failed to submit data');
    }
  }
} 