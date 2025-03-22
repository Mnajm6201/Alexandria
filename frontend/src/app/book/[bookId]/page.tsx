/*
  Name: BookPage.tsx
  Date: 03/22/2025
  Description: React client component that displays detailed information for a specific book. It fetches book data from an API endpoint using the provided bookId, transforms the raw API data into a strongly-typed BookData object with the adaptBookData function, and then renders a comprehensive book page composed of various sub-components. These sub-components include:
  
    - BookHeader: Displays the book’s title, cover image, authors, and user status actions.
    - BookSummary: Renders the book's summary with conditional truncation and an expand/collapse feature.
    - BookDetails: Shows detailed book information such as page count, publication date, ISBN, genres, and language.
    - ItemCarousel: Presents the available editions of the book in a horizontally scrollable carousel.
    - VendorLinks: Displays vendor information for purchasing the book (or a fallback if no vendors are available).
    - LibraryAvailability: Shows the library availability information (or a placeholder if not available).
    - ReviewSection: Provides a section to view and submit user reviews, complete with star ratings and pagination.
  
  Input:
    - params: An object containing the bookId as a route parameter.
  
  Output:
    - Renders a fully detailed book page with sections for header, summary, details, editions, vendor links, library availability, and reviews.
    - Displays appropriate loading and error states during the data fetching process.
    - Utilizes a data adapter (adaptBookData) to ensure the raw API data conforms to the BookData interface.

  Notes:
    - Employs React’s useState and useEffect hooks for managing state and side effects.
    - Uses Tailwind CSS for responsive styling and layout.
    - Handles missing or incomplete data gracefully by providing default/fallback UI elements.
    - Designed to work in a client-side rendering environment.
*/
'use client'

import { useState, useEffect } from 'react'
import { 
    BookHeader, 
    BookSummary, 
    BookDetails,
    VendorLinks,
    LibraryAvailability,
    ReviewSection 
} from '@/components/ui/book_details'
import ItemCarousel from '@/components/ui/ItemCarousel'

// Define the types needed for component
interface Author {
  id: string;
  name: string;
  image?: string;
}

interface Edition {
  id: string;
  title?: string;
  cover_image?: string;
  publication_date?: string;
  format?: string;
  language?: string;
}

interface Vendor {
  id: string;
  name: string;
  url: string;
  logo?: string;
  price?: string;
  format?: string;
}

interface Library {
  id: string;
  name: string;
  url: string;
  availability: 'available' | 'checked_out' | 'unknown';
  distance?: string;
  address?: string;
  due_date?: string;
}

interface Review {
  id: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  rating: number;
  content: string;
  date: string;
  likes: number;
}

interface UserStatus {
  read_status: string;
  is_owned: boolean;
}

interface BookData {
  book_id: string;
  title: string;
  cover_image?: string;
  authors: Author[];
  summary?: string;
  page_count?: number;
  original_publication_date?: string;
  isbn?: string;
  genres?: string[];
  language?: string;
  editions: Edition[];
  vendor_links: Vendor[];
  library_availability: Library[];
  reviews: Review[];
  user_status?: UserStatus;
}

// Default empty book object
const DEFAULT_BOOK: BookData = {
  book_id: '',
  title: 'Untitled Book',
  authors: [],
  summary: '',
  editions: [],
  vendor_links: [],
  library_availability: [],
  reviews: []
}

// Define the function with explicit typing
function adaptBookData(apiData: any): BookData {
  if (!apiData) {
    return DEFAULT_BOOK;
  }

  // Create empty arrays
  const authors: Author[] = [];
  const editions: Edition[] = [];
  const genres: string[] = [];
  const vendorLinks: Vendor[] = [];
  const libraryAvailability: Library[] = [];
  const reviews: Review[] = [];

  // Extract authors
  if (Array.isArray(apiData.authors)) {
    apiData.authors.forEach((author: any) => {
      authors.push({
        id: String(author.id || ''),
        name: author.name || '',
        image: author.author_image || undefined
      });
    });
  }

  // Get genres as strings
  if (Array.isArray(apiData.genres)) {
    apiData.genres.forEach((genre: any) => {
      if (genre && genre.name) {
        genres.push(genre.name);
      }
    });
  }

  // Handle primary edition
  const primaryEdition = apiData.primary_edition || {};
  if (primaryEdition && Object.keys(primaryEdition).length > 0) {
    editions.push({
      id: String(primaryEdition.id || ''),
      title: apiData.title || '',
      cover_image: primaryEdition.cover_image || undefined,
      publication_date: primaryEdition.publication_year 
        ? String(primaryEdition.publication_year) 
        : undefined,
      format: primaryEdition.kind || '',
      language: primaryEdition.language || ''
    });
  }

  // Handle other editions
  if (Array.isArray(apiData.other_editions)) {
    apiData.other_editions.forEach((edition: any) => {
      if (edition) {
        editions.push({
          id: String(edition.id || ''),
          title: apiData.title || '',
          cover_image: edition.cover_image || undefined,
          publication_date: edition.publication_year 
            ? String(edition.publication_year) 
            : undefined,
          format: edition.kind || '',
          language: edition.language || ''
        });
      }
    });
  }

  // Return structured book data
  return {
    book_id: apiData.id ? String(apiData.id) : '',
    title: apiData.title || 'Untitled Book',
    cover_image: primaryEdition.cover_image || undefined,
    authors: authors,
    summary: apiData.summary || '',
    page_count: primaryEdition.page_count || undefined,
    original_publication_date: apiData.year_published 
      ? String(apiData.year_published) 
      : undefined,
    isbn: primaryEdition.isbn || undefined,
    genres: genres,
    language: apiData.original_language || undefined,
    editions: editions,
    vendor_links: vendorLinks,
    library_availability: libraryAvailability,
    reviews: reviews,
    user_status: apiData.user_status || undefined
  };
}

export default function BookPage({ params }: { params: { bookId: string } }) {
  const [book, setBook] = useState<BookData>(DEFAULT_BOOK);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`http://localhost:8000/api/books/${params.bookId}/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || `Failed to fetch book details (${response.status})`);
        }
        
        const apiData = await response.json();
        console.log('API Response:', apiData);
        
        // Transform API data to match component expectations
        const transformedData = adaptBookData(apiData);
        console.log('Transformed data:', transformedData);
        
        setBook(transformedData);
      } catch (err) {
        const errorMessage = err instanceof Error 
          ? err.message 
          : 'An unexpected error occurred';
        
        setError(errorMessage);
        console.error('Book fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (params.bookId) {
      fetchBookDetails();
    }
  }, [params.bookId]);
  
  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-pulse text-xl text-gray-500">Loading book details...</div>
    </div>
  );
  
  if (error) return (
    <div className="flex justify-center items-center min-h-screen p-8">
      <div className="text-red-500 text-center">
        <h2 className="text-2xl font-bold mb-4">Error Loading Book</h2>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Try Again
        </button>
      </div>
    </div>
  );
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <BookHeader 
        title={book.title}
        coverImage={book.cover_image}
        authors={book.authors}
        userStatus={book.user_status}
      />
      
      <div className="mt-8">
        <BookSummary summary={book.summary} />
      </div>
      
      <div className="mt-8">
        <BookDetails 
          pageCount={book.page_count}
          publicationDate={book.original_publication_date}
          isbn={book.isbn}
          genres={book.genres || []}
          language={book.language}
        />
      </div>
      
      {book.editions && book.editions.length > 0 && (
        <div className="mt-8">
          <ItemCarousel 
            items={book.editions}
            title="Editions"
            onItemClick={(edition) => {
              // Navigate to edition page or handle click
              console.log(`Edition clicked: ${edition.id}`);
              // Need to add navigation here
              // i.e. /books/${book.book_id}/editions/${edition.id}`;
            }}
            renderItem={(edition) => (
              <div className="flex flex-col">
                {edition.cover_image ? (
                  <img
                    src={edition.cover_image}
                    alt={`Cover for ${edition.title || book.title}`}
                    className="w-full h-72 object-cover rounded-md shadow-lg"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-72 bg-gray-200 flex items-center justify-center rounded-md">
                    <span className="text-gray-500">No cover</span>
                  </div>
                )}
                {edition.format && (
                  <span className="mt-2 text-sm text-gray-700">{edition.format}</span>
                )}
                {edition.publication_date && (
                  <span className="text-xs text-gray-500">{edition.publication_date}</span>
                )}
              </div>
            )}
          />
        </div>
      )}
      
      {/* Vendor Links or Placeholder */}
      {book.vendor_links && book.vendor_links.length > 0 ? (
        <div className="mt-8">
          <VendorLinks vendors={book.vendor_links} />
        </div>
      ) : (
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900">Where to Buy</h2>
          <p className="text-gray-500 mt-2">No vendors available</p>
        </div>
      )}
      
      {/* Library Availability or Placeholder */}
      {book.library_availability && book.library_availability.length > 0 ? (
        <div className="mt-8">
          <LibraryAvailability libraries={book.library_availability} />
        </div>
      ) : (
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900">Library Availability</h2>
          <p className="text-gray-500 mt-2">Unavailable</p>
        </div>
      )}
      
      <div className="mt-8">
        <ReviewSection 
          reviews={book.reviews} 
          bookId={book.book_id}
        />
      </div>
    </div>
  );
}