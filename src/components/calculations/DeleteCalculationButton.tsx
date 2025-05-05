'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { deleteCalculationForUser } from '@/app/actions'

interface DeleteCalculationButtonProps {
  id: string
}

export function DeleteCalculationButton({ id }: DeleteCalculationButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  
  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this calculation?')) {
      try {
        setIsDeleting(true)
        await deleteCalculationForUser(id)
        router.refresh() 
      } catch (error) {
        console.error('Failed to delete calculation:', error)
        alert('Failed to delete calculation. Please try again.')
      } finally {
        setIsDeleting(false)
      }
    }
  }
  
  return (
    <Button 
      variant="outline" 
      size="icon"
      onClick={handleDelete}
      className="text-destructive hover:bg-destructive/10"
      title="Delete Calculation"
      disabled={isDeleting}
    >
      {isDeleting ? (
        <div className="h-4 w-4 border-2 border-current border-t-transparent animate-spin rounded-full" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </Button>
  )
} 