/*
  Name: BookHeader.tsx
  Date: 03/22/2025
  Description: React client component that displays detailed header information for a book. 
  This component renders the book cover, title, and a list of authors with links to their profile pages.
  It also provides interactive buttons to update the user's reading status (Want to Read, Reading, Read), 
  toggle ownership status, and initiate an add-to-shelf action.

  Input:
    - title: A string representing the title of the book.
    - coverImage (optional): A URL string for the book cover image. If not provided, a placeholder is rendered.
    - authors (optional): An array of Author objects containing an id and name. Each author is linked to their respective profile.
    - userStatus (optional): An object containing:
        - read_status: A string indicating the user's current read status (e.g., 'want_to_read', 'reading', 'read', 'none').
        - is_owned: A boolean indicating whether the user owns the book.

  Output:
    - Displays a responsive header with the book's cover, title, and authors.
    - Provides action buttons for setting the read status, toggling the ownership status, and a placeholder for adding the book to a shelf.
    - Updates internal state to reflect user interactions. API calls are simulated with placeholder functions.

  Notes:
    - Uses Tailwind CSS classes for styling and layout.
    - Implements client-side interactions using React's useState hook.
    - Employs Next.js Link for author profile navigation.
*/
// frontend/src/components/ui/book_details/BookHeader.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import AddToShelfModal from '../shelves/AddToShelfModal'
import { useJWToken } from '../../../utils/getJWToken'

enum ReadStatusOptions {
  WANT_TO_READ = 'Want to Read',
  READING = 'Reading',
  READ = 'Read',
  NONE = 'none'
}

interface Author {
  id: string
  name: string
}

interface UserStatus {
  read_status: string
  is_owned: boolean
}

interface BookHeaderProps {
  title: string
  coverImage?: string
  authors?: Author[]
  userStatus?: UserStatus
  primaryEditionId?: number 
}

export default function BookHeader({ 
  title, 
  coverImage, 
  authors = [], 
  userStatus,
  primaryEditionId
}: BookHeaderProps) {
  const [readStatus, setReadStatus] = useState<string>(
    userStatus?.read_status || ReadStatusOptions.NONE
  )
  const [isOwned, setIsOwned] = useState<boolean>(
    userStatus?.is_owned || false
  )
  const [showAddToShelf, setShowAddToShelf] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const { jwtToken, fetchJWToken } = useJWToken()
  
  // Re-sync state when userStatus changes (e.g. after initialization)
  useEffect(() => {
    if (userStatus) {
      setReadStatus(userStatus.read_status || ReadStatusOptions.NONE)
      setIsOwned(userStatus.is_owned || false)
    }
  }, [userStatus])

  // useEffect to check current status on page load
  useEffect(() => {
    const checkCurrentStatus = async () => {
      if (!primaryEditionId) return
      
      try {
        const token = jwtToken || await fetchJWToken()
        if (!token) return
        
        // Fetch all shelves
        const shelvesResponse = await fetch('http://localhost:8000/', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (!shelvesResponse.ok) return
        
        const shelves = await shelvesResponse.json()
        
        // Check each special shelf for this edition
        for (const shelf of shelves) {
          if (![ReadStatusOptions.WANT_TO_READ, ReadStatusOptions.READING, ReadStatusOptions.READ, 'Owned'].includes(shelf.shelf_type)) {
            continue
          }
          
          const editionsResponse = await fetch(`http://localhost:8000/${shelf.id}/editions/`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
          
          if (!editionsResponse.ok) continue
          
          const editions = await editionsResponse.json()
          const hasEdition = editions.some((edition: any) => edition.edition_id === primaryEditionId)
          
          if (hasEdition) {
            // Update state based on which shelf contains the edition
            if (shelf.shelf_type === 'Owned') {
              setIsOwned(true)
            } else {
              setReadStatus(shelf.shelf_type)
            }
          }
        }
      } catch (err) {
        console.error('Error checking shelves:', err)
      }
    }
    
    checkCurrentStatus()
  }, [primaryEditionId, jwtToken, fetchJWToken])

  // Function to add edition to shelf by shelf type
  const addToShelf = async (shelfType: string, editionId: number) => {
    if (!editionId) {
      console.error("No edition available to add to shelf")
      return
    }

    try {
      setIsUpdating(true)
      const token = jwtToken || await fetchJWToken()
      
      if (!token) {
        console.error("Authentication required")
        return
      }

      // First, find the shelf of this type
      const shelvesResponse = await fetch('http://localhost:8000/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!shelvesResponse.ok) {
        throw new Error(`Failed to fetch shelves: ${shelvesResponse.status}`)
      }

      const shelves = await shelvesResponse.json()
      const targetShelf = shelves.find((shelf: any) => shelf.shelf_type === shelfType)

      if (!targetShelf) {
        throw new Error(`${shelfType} shelf not found`)
      }

      // Now add the edition to the found shelf
      const addResponse = await fetch(`http://localhost:8000/${targetShelf.id}/add_edition/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          edition_id: editionId
        })
      })

      if (!addResponse.ok) {
        const errorData = await addResponse.text()
        throw new Error(errorData || `Failed to add to ${shelfType} shelf`)
      }

      // Update UI state based on which shelf was updated
      if (shelfType === ReadStatusOptions.READ || 
          shelfType === ReadStatusOptions.READING || 
          shelfType === ReadStatusOptions.WANT_TO_READ) {
        setReadStatus(shelfType)
      } else if (shelfType === 'Owned') {
        setIsOwned(true)
      }

      console.log(`Successfully added to ${shelfType} shelf`)
    } catch (err) {
      console.error('Error updating shelf:', err)
    } finally {
      setIsUpdating(false)
    }
  }

  // Function to remove edition from shelf by shelf type
  const removeFromShelf = async (shelfType: string, editionId: number) => {
    if (!editionId) {
      console.error("No edition available to remove from shelf")
      return
    }

    try {
      setIsUpdating(true)
      const token = jwtToken || await fetchJWToken()
      
      if (!token) {
        console.error("Authentication required")
        return
      }

      // First, find the shelf of this type
      const shelvesResponse = await fetch('http://localhost:8000/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!shelvesResponse.ok) {
        throw new Error(`Failed to fetch shelves: ${shelvesResponse.status}`)
      }

      const shelves = await shelvesResponse.json()
      const targetShelf = shelves.find((shelf: any) => shelf.shelf_type === shelfType)

      if (!targetShelf) {
        throw new Error(`${shelfType} shelf not found`)
      }

      // Now remove the edition from the found shelf
      const removeResponse = await fetch(`http://localhost:8000/${targetShelf.id}/remove_edition/?edition_id=${editionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!removeResponse.ok) {
        throw new Error(`Failed to remove from ${shelfType} shelf`)
      }

      // Update UI state based on which shelf was updated
      if (shelfType === ReadStatusOptions.READ || 
          shelfType === ReadStatusOptions.READING || 
          shelfType === ReadStatusOptions.WANT_TO_READ) {
        setReadStatus(ReadStatusOptions.NONE)
      } else if (shelfType === 'Owned') {
        setIsOwned(false)
      }

      console.log(`Successfully removed from ${shelfType} shelf`)
    } catch (err) {
      console.error('Error updating shelf:', err)
    } finally {
      setIsUpdating(false)
    }
  }
  
  // Handler for read status buttons - now with toggle functionality
  const handleReadStatusChange = async (newStatus: string) => {
    if (!primaryEditionId) {
      console.error("No edition available for this book")
      return
    }

    // If clicking the same button that's already active, remove from that shelf
    if (readStatus === newStatus) {
      await removeFromShelf(newStatus, primaryEditionId)
    } else {
      // Otherwise add to the new shelf (backend handles removing from other read status shelves)
      await addToShelf(newStatus, primaryEditionId)
    }
  }
  
  // Handler for owned status toggle
  const toggleOwned = async () => {
    if (!primaryEditionId) {
      console.error("No edition available for this book")
      return
    }
    
    if (isOwned) {
      await removeFromShelf('Owned', primaryEditionId)
    } else {
      await addToShelf('Owned', primaryEditionId)
    }
  }
  
  const handleAddToShelf = () => {
    // Open the "Add to Shelf" modal
    setShowAddToShelf(true)
  }
  
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col md:flex-row gap-6">
      {/* Book cover */}
      <div className="flex-shrink-0">
        {coverImage ? (
          <div className="relative w-40 h-60 md:w-48 md:h-72">
            <img
              src={coverImage}
              alt={`Cover image for ${title}`}
              className="object-cover rounded-xl shadow-md w-full h-full"
            />
          </div>
        ) : (
          <div className="w-40 h-60 md:w-48 md:h-72 bg-gray-200 rounded-xl shadow-md flex items-center justify-center">
            <span className="text-gray-500 text-sm">No cover available</span>
          </div>
        )}
      </div>
      
      {/* Book info */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900">{title}</h1>
          {authors.length > 0 && (
            <div className="mt-2">
              <p className="text-base text-gray-600">
                By{' '}
                {authors.map((author, index) => (
                  <span key={author.id}>
                    <Link 
                      href={`/author/${author.id}`} 
                      className="text-blue-500 hover:text-blue-700 font-medium"
                    >
                      {author.name}
                    </Link>
                    {index < authors.length - 1 && ', '}
                  </span>
                ))}
              </p>
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <div className="inline-flex rounded-md shadow-sm">
            <button
              type="button"
              className={`py-2 px-4 text-sm font-medium rounded-l-md border transition duration-200 ${
                readStatus === ReadStatusOptions.WANT_TO_READ 
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
              } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => handleReadStatusChange(ReadStatusOptions.WANT_TO_READ)}
              disabled={isUpdating}
            >
              Want to Read
            </button>
            <button
              type="button"
              className={`py-2 px-4 text-sm font-medium border-t border-b transition duration-200 ${
                readStatus === ReadStatusOptions.READING 
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
              } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => handleReadStatusChange(ReadStatusOptions.READING)}
              disabled={isUpdating}
            >
              Reading
            </button>
            <button
              type="button"
              className={`py-2 px-4 text-sm font-medium rounded-r-md border transition duration-200 ${
                readStatus === ReadStatusOptions.READ 
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
              } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => handleReadStatusChange(ReadStatusOptions.READ)}
              disabled={isUpdating}
            >
              Read
            </button>
          </div>
          
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium rounded-md transition duration-200 ${
              isOwned 
                ? 'bg-green-500 text-white border border-green-500'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
            } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={toggleOwned}
            disabled={isUpdating}
          >
            {isOwned ? 'Owned' : 'I Own This'}
          </button>

          <button
            type="button"
            className="px-4 py-2 text-sm font-medium rounded-md bg-purple-600 text-white border border-purple-600 hover:bg-purple-700 transition duration-200"
            onClick={handleAddToShelf}
          >
            Add to Shelf
          </button>
        </div>
      </div>

      {/* Add to Shelf Modal */}
      {primaryEditionId && (
        <AddToShelfModal
          isOpen={showAddToShelf}
          onClose={() => setShowAddToShelf(false)}
          editionId={primaryEditionId}
          onSuccess={() => {
            setTimeout(() => setShowAddToShelf(false), 1000)
          }}
        />
      )}
    </div>
  )
}