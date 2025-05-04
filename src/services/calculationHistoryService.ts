import { ApiService } from './api';
import { Calculation } from '@/generated/prisma';

/**
 * Service for calculation history operations
 */
export class CalculationHistoryService {
  /**
   * Get all calculations
   */
  static async getCalculations(): Promise<Calculation[]> {
    try {
      return await ApiService.get<Calculation[]>('/api/calculations');
    } catch (error) {
      console.error("Error fetching calculations:", error);
      throw error;
    }
  }

  /**
   * Get a single calculation by ID
   */
  static async getCalculationById(id: string): Promise<Calculation> {
    try {
      return await ApiService.get<Calculation>(`/api/calculations?id=${id}`);
    } catch (error) {
      console.error(`Error fetching calculation ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a calculation by ID
   */
  static async deleteCalculation(id: string): Promise<boolean> {
    try {
      const response = await ApiService.delete<{ success: boolean }>(`/api/calculations?id=${id}`);
      return response.success;
    } catch (error) {
      console.error(`Error deleting calculation ${id}:`, error);
      throw error;
    }
  }
} 