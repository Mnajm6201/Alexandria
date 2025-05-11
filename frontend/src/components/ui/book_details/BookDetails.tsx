/*
  Name: BookDetails.tsx
  Date: 03/22/2025
  Description: React client component that displays detailed information about a book, including page count, publication date, ISBN, genres, and language. 
  The component formats the publication date into a human-readable format, conditionally renders available book details using Lucid React icons for visual cues, and provides a 
  toggleable list for genres. If the genres array exceeds 15 items, only the first 15 are shown by default with an option to expand or collapse the full list.

  Input:
    - pageCount (optional): A number representing the total number of pages in the book.
    - publicationDate (optional): A string representing the publication date, which is formatted to a readable date.
    - isbn (optional): A string representing the ISBN number of the book.
    - genres (optional): An array of strings indicating the genres of the book (defaults to an empty array).
    - language (optional): A string indicating the language in which the book is written.

  Output:
    - Renders a card-like UI displaying available book details in a responsive grid layout.
    - Each detail (pages, publication date, ISBN, language) is shown if provided.
    - Displays genres as a list of badges. If more than 15 genres are available, a toggle button allows the user to expand/collapse the full list.

  Notes:
    - Utilizes Tailwind CSS for styling.
    - Employs conditional rendering to display only provided details.
    - Uses Lucid React icons for visual enhancement next to each detail.
    - Manages internal state for toggling the display of the complete genre list.
*/
'use client'

import { useState } from 'react'
import { Calendar, BookOpen, Tag, Globe } from 'lucide-react'


interface BookDetailsProps {
  pageCount?: number
  publicationDate?: string
  isbn?: string
  genres?: string[]
  language?: string
}

export default function BookDetails({ 
  pageCount, 
  publicationDate, 
  isbn, 
  genres = [], 
  language 
}: BookDetailsProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Format publication date
  const formattedDate = publicationDate 
    ? new Date(publicationDate).toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }) 
    : 'Unknown'
  
  // Determine genres to display
  const displayGenres = isExpanded ? genres : genres.slice(0, 15)
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Details</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pageCount && (
          <div className="flex items-start">
            <BookOpen className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-500">Pages</p>
              <p className="text-gray-900">{pageCount}</p>
            </div>
          </div>
        )}
        
        {publicationDate && (
          <div className="flex items-start">
            <Calendar className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-500">First published</p>
              <p className="text-gray-900">{formattedDate}</p>
            </div>
          </div>
        )}
        
        {isbn && (
          <div className="flex items-start">
            <div className="h-5 w-5 text-gray-400 mr-2 mt-0.5 flex justify-center items-center">
              <span className="text-xs font-bold">ISBN</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500"></p>
              <p className="text-gray-900">{isbn}</p>
            </div>
          </div>
        )}
        
        {language && (
          <div className="flex items-start">
            <Globe className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-500">Language</p>
              <p className="text-gray-900">{language}</p>
            </div>
          </div>
        )}
      </div>
      
      {genres.length > 0 && (
        <div className="mt-4">
          <div className="flex items-start mb-2">
            <Tag className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
            <p className="text-sm font-medium text-gray-500">Genres</p>
          </div>
          
          <div className="flex flex-wrap gap-2 ml-7">
            {displayGenres.map(genre => (
              <span 
                key={genre} 
                className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded"
              >
                {genre}
              </span>
            ))}
            
            {genres.length > 15 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-blue-600 text-xs font-medium hover:underline focus:outline-none"
              >
                {isExpanded 
                  ? `Show less (${15} of ${genres.length})` 
                  : `Show all (${genres.length})`}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}