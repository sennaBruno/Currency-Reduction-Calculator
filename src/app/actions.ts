'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { saveCalculation, getCalculations, getCalculationById, deleteCalculation, CalculationInput } from '@/lib/calculations'
import { revalidatePath } from 'next/cache'

/**
 * Gets the authenticated user's ID from the session
 */
async function getUserId() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getSession()
  
  if (!data.session) {
    redirect('/auth')
  }
  
  return data.session.user.id
}

/**
 * Server action to save a calculation for the authenticated user
 */
export async function saveCalculationForUser(data: Omit<CalculationInput, 'userId'>) {
  const userId = await getUserId()
  
  const result = await saveCalculation({
    ...data,
    userId
  })
  
  revalidatePath('/history')
  return result
}

/**
 * Server action to get all calculations for the authenticated user
 */
export async function getCalculationsForUser() {
  const userId = await getUserId()
  return getCalculations(userId)
}

/**
 * Server action to get a specific calculation for the authenticated user
 */
export async function getCalculationForUser(id: string) {
  const userId = await getUserId()
  const calculation = await getCalculationById(id, userId)
  
  if (!calculation) {
    // Either calculation doesn't exist or doesn't belong to this user
    return null
  }
  
  return calculation
}

/**
 * Server action to delete a calculation for the authenticated user
 */
export async function deleteCalculationForUser(id: string) {
  const userId = await getUserId()
  const success = await deleteCalculation(id, userId)
  
  if (success) {
    revalidatePath('/history')
  }
  
  return success
} 