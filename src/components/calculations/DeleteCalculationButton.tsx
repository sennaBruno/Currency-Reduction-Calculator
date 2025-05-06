'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
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
        if (window.location.pathname.includes('/calculation/')) {
          router.push('/history')
        }
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
      disabled={isDeleting}
      title="Delete"
      className="ml-2 text-destructive hover:bg-destructive/10"
    >
      {isDeleting ? (
        <div className="h-4 w-4 border-2 border-current border-t-transparent animate-spin rounded-full" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </Button>
  )
} 