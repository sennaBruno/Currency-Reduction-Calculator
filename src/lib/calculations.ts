import { prisma } from './db';
import { Calculation } from '../../src/generated/prisma';

/**
 * Types for calculation operations
 */
export type CalculationInput = {
  initialAmount: number;
  finalAmount: number;
  currencyCode?: string;
  title?: string;
  steps: CalculationStepInput[];
  userId?: string;
};

export type CalculationStepInput = {
  order: number;
  description: string;
  calculationDetails: string;
  resultIntermediate: number;
  resultRunningTotal: number;
  explanation?: string;
  stepType: string;
};

/**
 * Saves a new calculation with its steps
 */
export async function saveCalculation(data: CalculationInput): Promise<Calculation> {
  const { steps, ...calculationData } = data;
  
  return prisma.calculation.create({
    data: {
      ...calculationData,
      steps: {
        create: steps
      }
    },
    include: {
      steps: true
    }
  });
}

/**
 * Retrieves all calculations with their steps for a specific user
 * If userId is not provided, returns all calculations (for backward compatibility)
 */
export async function getCalculations(userId?: string): Promise<Calculation[]> {
  try {
    const where = userId ? { userId } : {};
    
    return await prisma.calculation.findMany({
      where,
      include: {
        steps: {
          orderBy: {
            order: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  } catch (error) {
    console.error('Error retrieving calculations:', error);
    // Return empty array instead of throwing - more user-friendly
    return [];
  }
}

/**
 * Retrieves a single calculation by its ID
 * If userId is provided, additionally checks if the calculation belongs to that user
 */
export async function getCalculationById(id: string, userId?: string): Promise<Calculation | null> {
  const where = userId ? { id, userId } : { id };
  
  return prisma.calculation.findFirst({
    where,
    include: {
      steps: {
        orderBy: {
          order: 'asc'
        }
      }
    }
  });
}

/**
 * Deletes a calculation and its steps
 * If userId is provided, checks if the calculation belongs to that user
 */
export async function deleteCalculation(id: string, userId?: string): Promise<boolean> {
  try {
    const where = userId ? { id, userId } : { id };
    
    await prisma.calculation.delete({
      where
    });
    return true;
  } catch (error) {
    console.error('Error deleting calculation:', error);
    return false;
  }
} 