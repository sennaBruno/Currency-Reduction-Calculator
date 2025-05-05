'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calculation } from '@/lib/types/Calculation'

interface DownloadButtonProps {
  calculation: Calculation
}

export function DownloadButton({ calculation }: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  
  const handleDownload = async () => {
    try {
      setIsDownloading(true)
      
      const headers = [
        'Step',
        'Description',
        'Calculation',
        'Result',
        'Running Total',
        'Explanation'
      ]
      
      const rows = calculation.steps
        .sort((a, b) => a.order - b.order)
        .map(step => [
          step.order.toString(),
          step.description,
          step.calculationDetails,
          step.resultIntermediate.toString(),
          step.resultRunningTotal.toString(),
          step.explanation || ''
        ])
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n')
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `calculation-${calculation.id}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Failed to download calculation:', error)
      alert('Failed to download calculation. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }
  
  return (
    <Button 
      variant="outline" 
      onClick={handleDownload}
      className="flex items-center gap-2"
      disabled={isDownloading}
    >
      {isDownloading ? (
        <div className="h-4 w-4 border-2 border-current border-t-transparent animate-spin rounded-full" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      Download CSV
    </Button>
  )
} 