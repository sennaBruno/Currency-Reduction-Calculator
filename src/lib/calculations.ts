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
 * Retrieves all calculations with their steps
 */
export async function getCalculations(): Promise<Calculation[]> {
  try {
    return await prisma.calculation.findMany({
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
 */
export async function getCalculationById(id: string): Promise<Calculation | null> {
  return prisma.calculation.findUnique({
    where: { id },
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
 */
export async function deleteCalculation(id: string): Promise<boolean> {
  try {
    await prisma.calculation.delete({
      where: { id }
    });
    return true;
  } catch (error) {
    console.error('Error deleting calculation:', error);
    return false;
  }
} 