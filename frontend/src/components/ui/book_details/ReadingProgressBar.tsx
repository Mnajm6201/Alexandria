'use client'

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { useJWToken } from "@/utils/getJWToken"

interface ReadingProgressBarProps {
  bookId: string
  maxPages: number
  initialPage?: number
  onPageChange?: (page: number) => void
  onBookCompleted?: () => void // Added prop for book completion
  className?: string
}

export default function ReadingProgressBar({ 
  bookId, 
  maxPages = 100, 
  initialPage = 1, 
  onPageChange,
  onBookCompleted,
  className = ""
}: ReadingProgressBarProps) {
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { jwtToken, fetchJWToken } = useJWToken()
  
  const progressPercentage = maxPages > 0 ? (currentPage / maxPages) * 100 : 0
  
  // Update state when props change
  useEffect(() => {
    if (initialPage !== undefined && initialPage > 0) {
      setCurrentPage(initialPage)
    }
  }, [initialPage])
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value, 10)
    if (!isNaN(value)) {
      const newPage = Math.max(1, Math.min(value, maxPages))
      setCurrentPage(newPage)
      if (onPageChange) {
        onPageChange(newPage)
      }
      debouncedUpdateProgress(newPage)
    }
  }
  
  // Handle slider change
  const handleSliderChange = (value: number[]) => {
    const newPage = Math.round((value[0] / 100) * maxPages)
    const validPage = Math.max(1, Math.min(newPage, maxPages))
    setCurrentPage(validPage)
    if (onPageChange) {
      onPageChange(validPage)
    }
    debouncedUpdateProgress(validPage)
  }
  
  // Debounce function for API calls
  const debouncedUpdateProgress = (page: number) => {
    // Clear any existing timeout
    if (window.updateProgressTimeout) {
      clearTimeout(window.updateProgressTimeout)
    }
    
    // Set a new timeout
    window.updateProgressTimeout = setTimeout(() => {
      updateProgress(page)
    }, 500)
  }
  
    // Update progress to backend
    const updateProgress = async (page: number) => {
        if (isUpdating || !bookId) return
        
        try {
        setIsUpdating(true)
        setError(null)
        
        const token = jwtToken || await fetchJWToken()
        if (!token) {
            console.error("Authentication required to update progress")
            setError("Authentication required")
            return
        }
        
        console.log('Saving progress:', {
            bookId,
            page,
            maxPages,
            token: token ? 'Token exists' : 'No token'
        })
        
        // First, ensure the book is on the Reading shelf before updating progress
        const shelvesResponse = await fetch('http://localhost:8000/', {
            headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
            }
        })
        
        if (shelvesResponse.ok) {
            const shelves = await shelvesResponse.json()
            const readingShelf = shelves.find((shelf: any) => shelf.shelf_type === 'Reading')
            
            if (readingShelf) {
            console.log('Found Reading shelf:', readingShelf.id)
            }
        }
        
        // Now update the progress
        const response = await fetch('http://localhost:8000/progress/update-progress/', {
            method: 'POST',
            headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
            },
            body: JSON.stringify({
            book_id: bookId,
            page_num: page
            })
        })
        
        if (!response.ok) {
            const errorData = await response.text()
            console.error('Error response from API:', errorData)
            throw new Error(errorData || 'Failed to update reading progress')
        }
        
        try {
            const result = await response.json()
            console.log('Progress update response:', result)
        } catch (e) {
            console.log('Response was not JSON:', await response.text())
        }
        
        // Check if book is completed
        if (page >= maxPages) {
            console.log('Book completed, triggering completion handler')
            if (onBookCompleted) {
            onBookCompleted()
            }
        }
        } catch (err) {
        console.error('Error updating reading progress:', err)
        setError('Failed to update progress')
        } finally {
        setIsUpdating(false)
        }
    }
  
  return (
    <Card className={`w-full max-w-md rounded-[2.5rem] px-4 shadow-md bg-[#fdf8e9] border-[#f5eed8] ${className}`}>
      <CardHeader className="pb-0 pt-2"></CardHeader>
      <CardContent className="space-y-3 px-6 py-4">
        <div className="flex items-center space-x-4">
          <Label
            htmlFor="page-number"
            className="w-24 flex-shrink-0 text-[#4b3621]"
          >
            Page Number:
          </Label>
          <Input
            id="page-number"
            type="number"
            min={1}
            max={maxPages}
            value={currentPage}
            onChange={handleInputChange}
            disabled={isUpdating}
            className="w-24 bg-[#fdf8e9] border-[#e5dcc3] focus-visible:ring-[#4b3621] text-[#4b3621]"
          />
          <span className="text-sm text-[#4b3621]">
            of {maxPages}
          </span>
        </div>
        
        <div className="pt-2">
          <Slider
            value={[progressPercentage]}
            min={0}
            max={100}
            step={1}
            onValueChange={handleSliderChange}
            disabled={isUpdating}
            className="py-2"
          />
        </div>
        
        <div className="relative h-4 w-full overflow-hidden rounded-[1rem] border bg-[#f5eed8] border-[#e5dcc3]">
          <div
            className="h-full transition-all duration-300 bg-gradient-to-r from-[#c9b99b] to-[#a89878]"
            style={{ width: `${progressPercentage}%` }}
            role="progressbar"
            aria-valuenow={currentPage}
            aria-valuemin={1}
            aria-valuemax={maxPages}
          />
        </div>
        
        <div className="flex justify-between text-xs text-[#4b3621]">
          <span>0%</span>
          <span>{Math.round(progressPercentage)}% Complete</span>
          <span>100%</span>
        </div>
        
        {error && (
          <div className="text-red-500 text-sm mt-2">{error}</div>
        )}
      </CardContent>
    </Card>
  )
}

declare global {
  interface Window {
    updateProgressTimeout: ReturnType<typeof setTimeout>;
  }
}