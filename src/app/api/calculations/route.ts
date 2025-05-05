import { NextResponse } from 'next/server';
import { getCalculations, getCalculationById, deleteCalculation } from '../../../lib/calculations';
import { createClient } from '@/lib/supabase/server';

/**
 * Helper to get userId from session
 */
async function getUserId() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id;
}

/**
 * GET /api/calculations - Get all calculations
 */
export async function GET(request: Request) {
  try {
    const userId = await getUserId();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (id) {
      const calculation = await getCalculationById(id, userId);
      
      if (!calculation) {
        return NextResponse.json(
          { error: "Calculation not found" },
          { status: 404 }
        );
      }
      
      return NextResponse.json(calculation);
    }
    
    const calculations = await getCalculations(userId);
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
    const userId = await getUserId();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: "Missing calculation ID" },
        { status: 400 }
      );
    }
    
    const success = await deleteCalculation(id, userId);
    
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