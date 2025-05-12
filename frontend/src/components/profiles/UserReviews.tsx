'use client'

import { useState, useEffect } from 'react'
import { Star, Calendar } from 'lucide-react'
import { useJWToken } from '@/utils/getJWToken'
import Image from 'next/image'
import Link from 'next/link'

// Types
interface Review {
  id: string
  user: number
  user_username: string
  user_profile_pic?: string
  book: number
  book_title?: string
  book_author?: string
  book_cover?: string
  content: string
  rating: number
  created_on: string
}

interface UserReviewsProps {
  userId?: string | number
  className?: string
  limit?: number
}

export default function UserReviews({ userId, className = '', limit }: UserReviewsProps) {
  // States
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { jwtToken, fetchJWToken } = useJWToken()

  // Fetch user reviews on component mount
  useEffect(() => {
    fetchUserReviews()
  }, [userId])

  // Function to fetch user reviews
  const fetchUserReviews = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const token = jwtToken || await fetchJWToken()
      
      if (!token) {
        setError('Authentication required')
        setIsLoading(false)
        return
      }

      // Determine which endpoint to use based on whether userId is provided
      const endpoint = userId 
        ? `http://localhost:8000/api/reviews/?user_id=${userId}` 
        : 'http://localhost:8000/api/reviews/user_reviews/'

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch reviews: ${response.status}`)
      }

      const data = await response.json()
      
      // Handle different response formats (paginated or array)
      const reviewsData = data.results ? data.results : data
      
      // If limit is specified, apply it
      const limitedReviews = limit ? reviewsData.slice(0, limit) : reviewsData
      
      // Set reviews directly now that backend provides all needed data
      setReviews(limitedReviews)
    } catch (err) {
      console.error('Error fetching user reviews:', err)
      setError(err instanceof Error ? err.message : 'Failed to load reviews')
    } finally {
      setIsLoading(false)
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className={className}>
        <h2 className="text-xl font-serif font-bold text-amber-900 mb-4">My Reviews</h2>
        <div className="flex justify-center items-center py-10">
          <div className="w-10 h-10 border-t-2 border-b-2 border-amber-500 rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={className}>
        <h2 className="text-xl font-serif font-bold text-amber-900 mb-4">My Reviews</h2>
        <div className="text-center py-10 bg-amber-50 rounded-lg">
          <p className="text-amber-700">{error}</p>
        </div>
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <div className={className}>
        <h2 className="text-xl font-serif font-bold text-amber-900 mb-4">My Reviews</h2>
        <div className="text-center py-10 bg-amber-50 rounded-lg">
          <p className="text-amber-700">No reviews yet.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <h2 className="text-xl font-serif font-bold text-amber-900 mb-4">My Reviews</h2>
      
      <div className="space-y-4">
        {reviews.map(review => (
          <div key={review.id} className="bg-white border border-amber-200 rounded-lg p-4">
            <div className="flex">
              {/* Book cover */}
              <div className="w-16 h-24 bg-amber-100 rounded overflow-hidden mr-4 flex-shrink-0 flex items-center justify-center">
                {review.book_cover ? (
                  <Image 
                    src={review.book_cover}
                    alt={review.book_title || "Book cover"}
                    width={64}
                    height={96}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="text-center text-amber-400 text-xs p-2">
                    No<br/>cover
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                {/* Book title and author */}
                <div className="mb-1">
                  <Link href={`/book/${review.book}`} className="font-medium text-amber-900 hover:underline">
                    {review.book_title || "Unknown Book"}
                  </Link>
                  <p className="text-sm text-amber-700">{review.book_author || "Unknown Author"}</p>
                </div>
                
                {/* Star Rating */}
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= Number(review.rating) 
                          ? 'text-yellow-400 fill-yellow-400' 
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                
                {/* Review date */}
                <div className="flex items-center text-xs text-amber-600 mt-1">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span>{formatDate(review.created_on)}</span>
                </div>
              </div>
            </div>
            
            {/* Review content */}
            {review.content && (
              <div className="mt-3 pt-2 border-t border-amber-100 text-amber-800">
                <p className="text-sm">{review.content}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}