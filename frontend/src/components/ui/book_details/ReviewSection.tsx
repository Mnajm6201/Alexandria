/*
  Name: ReviewSection.tsx
  Date: 03/22/2025
  Description: React client component that provides a comprehensive review section for a book. 
  The component allows users to submit a review with a star rating and text, and displays a 
  list of existing reviews with pagination support. It leverages Next.js Image for displaying user avatars, 
  Heroicons for visual star ratings (filled and outlined), and maintains state for user inputs, rating hover 
  interactions, and loading states during review submission.
  NOTE: The API logic to submit the review is missing.

  Input:
    - reviews: An array of review objects, each including:
        - id: Unique identifier for the review.
        - user: An object containing user details (id, name, and optional avatar).
        - rating: Numeric rating value (typically between 1 and 5).
        - content: The textual review content.
        - date: Date string of the review submission.
        - likes: Number of likes for the review.
    - bookId: A string representing the unique identifier of the book being reviewed.

  Output:
    - Renders a review form for users to submit a new review.
    - Displays a paginated list of reviews with user details, star rating visualization, review content, submission date, and like count.
    - Provides interactive star rating selection with hover effects and a "Load more reviews" button for additional reviews.

  Notes:
    - Uses Tailwind CSS for styling.
    - Implements client-side interactions with React's useState hook.
    - Contains placeholder comments for API calls to submit reviews and refresh review data.
*/
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { StarIcon } from '@heroicons/react/24/solid'
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline'

interface User {
  id: string
  name: string
  avatar?: string
}

interface Review {
  id: string
  user: User
  rating: number
  content: string
  date: string
  likes: number
}

interface ReviewSectionProps {
  reviews: Review[]
  bookId: string
}

export default function ReviewSection({ reviews = [], bookId }: ReviewSectionProps) {
  const [userReview, setUserReview] = useState<string>('')
  const [userRating, setUserRating] = useState<number>(0)
  const [hoveredRating, setHoveredRating] = useState<number>(0)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  
  // For pagination if you have many reviews
  const [displayCount, setDisplayCount] = useState<number>(3)
  
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (userRating === 0) {
      alert('Please select a rating')
      return
    }
    
    try {
      setIsSubmitting(true)
      
      // This is a placeholder for your API call to submit a review
      // await submitReview(bookId, userRating, userReview);
      
      // Clear form and refresh reviews
      setUserReview('')
      setUserRating(0)
      // You would typically fetch updated reviews here
      
      alert('Review submitted successfully!')
    } catch (error) {
      console.error('Failed to submit review:', error)
      alert('Failed to submit review. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const renderStarRating = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIcon
            key={star}
            className={`h-5 w-5 ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Reviews</h2>
      
      {/* Review form */}
      <div className="mb-8 border-b pb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Write a Review</h3>
        
        <form onSubmit={handleSubmitReview}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rating
            </label>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="focus:outline-none"
                  onClick={() => setUserRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                >
                  {star <= (hoveredRating || userRating) ? (
                    <StarIcon className="h-8 w-8 text-yellow-400" />
                  ) : (
                    <StarOutlineIcon className="h-8 w-8 text-gray-300" />
                  )}
                </button>
              ))}
            </div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="review" className="block text-sm font-medium text-gray-700 mb-1">
              Your Review
            </label>
            <textarea
              id="review"
              rows={4}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 mt-1 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
              placeholder="Share your thoughts about this book..."
              value={userReview}
              onChange={(e) => setUserReview(e.target.value)}
            ></textarea>
          </div>
          
          <button
            type="submit"
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      </div>
      
      {/* Reviews list */}
      {reviews.length > 0 ? (
        <div className="space-y-6">
          {reviews.slice(0, displayCount).map((review) => (
            <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
              <div className="flex items-start">
                {review.user.avatar ? (
                  <div className="flex-shrink-0 mr-4">
                    <div className="relative h-10 w-10">
                      <Image
                        src={review.user.avatar}
                        alt={review.user.name}
                        fill
                        className="rounded-full object-cover"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex-shrink-0 mr-4">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500 font-medium text-sm">
                        {review.user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                )}
                
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{review.user.name}</h4>
                      <div className="flex items-center mt-1">
                        {renderStarRating(review.rating)}
                        <span className="ml-2 text-sm text-gray-500">
                          {new Date(review.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
                    >
                      <svg
                        className="h-4 w-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905c0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                        ></path>
                      </svg>
                      {review.likes}
                    </button>
                  </div>
                  
                  <div className="mt-2 text-gray-700 whitespace-pre-line">
                    {review.content}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {reviews.length > displayCount && (
            <div className="text-center mt-4">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                onClick={() => setDisplayCount(displayCount + 3)}
              >
                Load more reviews
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-6 text-gray-500">
          No reviews yet. Be the first to review this book!
        </div>
      )}
    </div>
  )
}