import { NextResponse } from 'next/server';
import { getCalculations, getCalculationById, deleteCalculation } from '../../../lib/calculations';

/**
 * GET /api/calculations - Get all calculations
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (id) {
      const calculation = await getCalculationById(id);
      
      if (!calculation) {
        return NextResponse.json(
          { error: "Calculation not found" },
          { status: 404 }
        );
      }
      
      return NextResponse.json(calculation);
    }
    
    const calculations = await getCalculations();
    return NextResponse.json(calculations);
  } catch (error) {
    console.error('[API /api/calculations Error]:', error);
    return NextResponse.json(
      { error: "Error retrieving calculations" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/calculations - Delete a calculation by ID
 */
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: "Missing calculation ID" },
        { status: 400 }
      );
    }
    
    const success = await deleteCalculation(id);
    
    if (!success) {
      return NextResponse.json(
        { error: "Failed to delete calculation" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API /api/calculations Delete Error]:', error);
    return NextResponse.json(
      { error: "Error deleting calculation" },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic'; 