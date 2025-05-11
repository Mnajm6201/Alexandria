'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Star, AlertTriangle, ChevronLeft, ChevronRight, Edit, Trash } from 'lucide-react'
import { useJWToken } from '@/utils/getJWToken'
import { Button } from '@/components/ui/button'

// Types
interface Review {
  id: string
  user: number
  user_username: string
  user_profile_pic?: string
  book: number
  content: string
  rating: number
  created_on: string
  flagged_count?: number
}

interface ReviewSectionProps {
  bookId: string
}

export default function ReviewSection({ bookId }: ReviewSectionProps) {
  // States for the application
  const [myReview, setMyReview] = useState<Review | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [otherReviews, setOtherReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalReviews, setTotalReviews] = useState(0)
  
  // Sorting and filtering
  const [sortBy, setSortBy] = useState('created_on')
  const [sortOrder, setSortOrder] = useState('desc')
  const [minRating, setMinRating] = useState(0)
  
  // JWT token for authentication
  const { jwtToken, fetchJWToken } = useJWToken()
  
  // Fetch the user's review on component mount
  useEffect(() => {
    fetchMyReview()
  }, [bookId])
  
  // Fetch other reviews when dependencies change
  useEffect(() => {
    fetchOtherReviews()
  }, [bookId, currentPage, sortBy, sortOrder, minRating, myReview])
  
  // Function to fetch the current user's review
  const fetchMyReview = async () => {
    try {
      const token = jwtToken || await fetchJWToken()
      
      if (!token) {
        // User is not logged in, skip fetching personal review
        return
      }
      
      const response = await fetch(`http://localhost:8000/api/reviews/my_book_review/?book_id=${bookId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.status === 204) {
        // No review found for this user
        setMyReview(null)
        return
      }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch personal review: ${response.status}`)
      }
      
      const data = await response.json()
      setMyReview(data)
    } catch (err) {
      console.error('Error fetching personal review:', err)
      // Don't set error state here, as this is not critical
    }
  }
  
// Function to fetch other users' reviews
const fetchOtherReviews = async () => {
  try {
    setIsLoading(true);
    setError(null);
    
    let apiUrl = `http://localhost:8000/api/reviews/other_reviews/?book_id=${bookId}&page=${currentPage}&sort_by=${sortBy}&sort_order=${sortOrder}`;
    
    if (minRating > 0) {
      apiUrl += `&min_rating=${minRating}`;
    }
    
    const token = jwtToken || await fetchJWToken().catch(() => null);
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(apiUrl, { headers });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch reviews: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Response data:", data); // Debug log
    
    // Handle different response formats
    if (data.results && typeof data.count !== 'undefined') {
      // Paginated response
      setOtherReviews(data.results);
      setTotalReviews(data.count);
      setTotalPages(Math.ceil(data.count / 10)); // Assuming 10 items per page
    } else if (Array.isArray(data)) {
      // Non-paginated array response
      setOtherReviews(data);
      setTotalReviews(data.length);
      setTotalPages(1);
    } else {
      // Unknown format
      console.error('Unexpected response format:', data);
      setOtherReviews([]);
      setTotalReviews(0);
      setTotalPages(1);
    }
  } catch (err) {
    console.error('Error fetching other reviews:', err);
    setError(err instanceof Error ? err.message : 'Failed to load reviews');
    setOtherReviews([]);
    setTotalReviews(0);
    setTotalPages(1);
  } finally {
    setIsLoading(false);
  }
};
  
  // Handle review form submission (create or update)
  const handleReviewSubmitted = async (newReview: Review) => {
    setMyReview(newReview)
    setIsEditing(false)
    await fetchOtherReviews() // Refresh other reviews in case this affects pagination
  }
  
  // Handle review deletion
  const handleDeleteReview = async () => {
    if (!myReview) return
    
    try {
      const token = jwtToken || await fetchJWToken()
      
      if (!token) {
        setError('Authentication required')
        return
      }
      
      const response = await fetch(`http://localhost:8000/api/reviews/${myReview.id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error(`Failed to delete review: ${response.status}`)
      }
      
      setMyReview(null)
      fetchOtherReviews() // Refresh other reviews in case this affects pagination
    } catch (err) {
      console.error('Error deleting review:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete review')
    }
  }
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Reviews</h2>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
          {error}
        </div>
      )}
      
      {/* Your Review Section */}
      <div className="mb-10 border-b border-gray-200 pb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Your Review</h3>
        
        {myReview && !isEditing ? (
          <UserReview 
            review={myReview} 
            onEdit={() => setIsEditing(true)} 
            onDelete={handleDeleteReview}
          />
        ) : (
          <UserReviewForm
            bookId={bookId}
            initialReview={isEditing ? myReview : null}
            onReviewSubmitted={handleReviewSubmitted}
            onCancel={isEditing ? () => setIsEditing(false) : undefined}
          />
        )}
      </div>
      
      {/* Other Reviews Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Other Reviews</h3>
          
          <div className="flex gap-4">
            {/* Sorting Controls */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Sort by:</span>
              <select
                className="text-sm border border-gray-300 rounded-md p-1"
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split('-');
                  setSortBy(newSortBy);
                  setSortOrder(newSortOrder);
                  setCurrentPage(1);
                }}
              >
                <option value="created_on-desc">Newest First</option>
                <option value="created_on-asc">Oldest First</option>
                <option value="rating-desc">Highest Rating</option>
                <option value="rating-asc">Lowest Rating</option>
              </select>
            </div>
            
            {/* Rating Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Rating:</span>
              <select
                className="text-sm border border-gray-300 rounded-md p-1"
                value={minRating}
                onChange={(e) => {
                  setMinRating(parseInt(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value="0">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4+ Stars</option>
                <option value="3">3+ Stars</option>
                <option value="2">2+ Stars</option>
                <option value="1">1+ Star</option>
              </select>
            </div>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <div className="w-10 h-10 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
          </div>
        ) : otherReviews.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No other reviews yet.</p>
          </div>
        ) : (
          <div>
            <div className="space-y-6">
              {otherReviews.map(review => (
                <ReviewItem key={review.id} review={review} />
              ))}
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-8">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-l-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="px-4 py-2 border-t border-b border-gray-300 bg-white">
                  Page {currentPage} of {totalPages}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-r-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Component for displaying the user's own review
function UserReview({ review, onEdit, onDelete }: { 
  review: Review, 
  onEdit: () => void, 
  onDelete: () => void 
}) {
  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Display review content with expand/collapse for long reviews
  const [expanded, setExpanded] = useState(false);
  const isLongContent = (review.content || '').length > 300;
  const displayContent = !expanded && isLongContent 
    ? (review.content || '').substring(0, 300) + '...' 
    : review.content;
  
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          <div className="flex-shrink-0 mr-3">
            {review.user_profile_pic ? (
              <img 
                src={`http://localhost:8000${review.user_profile_pic}`}
                alt=""
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-blue-300 flex items-center justify-center">
                <span className="text-blue-700 font-medium">
                  {review.user_username?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
            )}
          </div>
          <div>
            <h4 className="font-medium text-gray-900">{review.user_username}</h4>
            <div className="flex items-center">
              {/* Star Rating */}
              <div className="flex mt-1">
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
                <span className="ml-2 text-sm text-gray-500">
                  {formatDate(review.created_on)}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Edit/Delete buttons */}
        <div className="flex space-x-2">
          <button
            onClick={onEdit}
            className="text-blue-600 hover:text-blue-800"
            aria-label="Edit review"
          >
            <Edit className="h-5 w-5" />
          </button>
          <button
            onClick={onDelete}
            className="text-red-600 hover:text-red-800"
            aria-label="Delete review"
          >
            <Trash className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {/* Review Content */}
      <div className="mt-4 text-gray-700">
        <p>{displayContent}</p>
        
        {isLongContent && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>
    </div>
  );
}

// Component for creating or editing a review
function UserReviewForm({ 
  bookId, 
  initialReview = null, 
  onReviewSubmitted, 
  onCancel 
}: { 
  bookId: string, 
  initialReview: Review | null, 
  onReviewSubmitted: (review: Review) => void, 
  onCancel?: () => void 
}) {
  // Form state
  const [content, setContent] = useState(initialReview?.content || '');
  const [rating, setRating] = useState(initialReview ? Number(initialReview.rating) : 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { jwtToken, fetchJWToken } = useJWToken();
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      const token = jwtToken || await fetchJWToken();
      
      if (!token) {
        setError('Authentication required');
        return;
      }
      
      const reviewData = {
        book: bookId,
        content,
        rating
      };
      
      // Determine if we're creating or updating
      const isUpdate = initialReview !== null;
      const method = isUpdate ? 'PUT' : 'POST';
      const url = isUpdate 
        ? `http://localhost:8000/api/reviews/${initialReview.id}/` 
        : 'http://localhost:8000/api/reviews/';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reviewData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to ${isUpdate ? 'update' : 'create'} review: ${response.status}`);
      }
      
      const reviewResponse = await response.json();
      onReviewSubmitted(reviewResponse);
      
    } catch (err) {
      console.error('Error submitting review:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
            {error}
          </div>
        )}
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rating <span className="text-red-500">*</span>
          </label>
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="focus:outline-none"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                aria-label={`Rate ${star} stars`}
              >
                <Star 
                  className={`h-8 w-8 ${
                    star <= (hoveredRating || rating) 
                      ? 'text-yellow-400 fill-yellow-400' 
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
        
        <div className="mb-4">
          <label htmlFor="review-content" className="block text-sm font-medium text-gray-700 mb-1">
            Your Review
          </label>
          <textarea
            id="review-content"
            className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            rows={5}
            placeholder="Share your thoughts about this book..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          ></textarea>
        </div>
        
        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : initialReview ? 'Update Review' : 'Submit Review'}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

// Component for displaying other users' reviews
function ReviewItem({ review }: { review: Review }) {
  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Handle flagging a review
  const handleFlag = async () => {
    try {
      const { jwtToken, fetchJWToken } = useJWToken();
      const token = jwtToken || await fetchJWToken();
      
      if (!token) {
        console.error('Authentication required to flag review');
        return;
      }
      
      const response = await fetch(`http://localhost:8000/api/reviews/${review.id}/flag/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        console.error('Failed to flag review:', response.status);
        return;
      }
      
      alert('Review has been flagged for review.');
      
    } catch (err) {
      console.error('Error flagging review:', err);
    }
  };
  
  // Display review content with expand/collapse for long reviews
  const [expanded, setExpanded] = useState(false);
  const isLongContent = (review.content || '').length > 300;
  const displayContent = !expanded && isLongContent 
    ? (review.content || '').substring(0, 300) + '...' 
    : review.content;
  
  return (
    <div className="border border-gray-200 rounded-lg p-5 hover:bg-gray-50 transition duration-150">
      <div className="flex items-start justify-between">
        <div className="flex items-start">
          <div className="flex-shrink-0 mr-3">
            {review.user_profile_pic ? (
              <img 
                src={`http://localhost:8000${review.user_profile_pic}`}
                alt=""
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-600 font-medium">
                  {review.user_username?.charAt(0).toUpperCase() || '?'}
                </span>
              </div>
            )}
          </div>
          <div>
            <h4 className="font-medium text-gray-900">{review.user_username}</h4>
            <div className="flex items-center">
              {/* Star Rating */}
              <div className="flex mt-1">
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
                <span className="ml-2 text-sm text-gray-500">
                  {formatDate(review.created_on)}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <button
          onClick={handleFlag}
          className="text-gray-500 hover:text-red-600"
          aria-label="Flag inappropriate content"
        >
          <AlertTriangle className="h-5 w-5" />
        </button>
      </div>
      
      {/* Review Content */}
      <div className="mt-4 text-gray-700 pl-12">
        <p>{displayContent}</p>
        
        {isLongContent && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>
    </div>
  );
}