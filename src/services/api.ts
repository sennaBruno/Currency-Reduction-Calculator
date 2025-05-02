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
    const response = await fetch(endpoint);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }
    
    return await response.json() as T;
  }
  
  /**
   * Make a POST request to the API
   * @param endpoint The API endpoint to call
   * @param data The data to send in the request body
   * @returns The response data
   */
  static async post<T, U>(endpoint: string, data: T): Promise<U> {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }
    
    return await response.json() as U;
  }
} 