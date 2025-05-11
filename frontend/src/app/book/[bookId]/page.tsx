/*
  Name: page.tsx
  Date: 03/23/2025
  Description: React client component that displays detailed information for a specific book.
  This component extracts the bookId directly from the URL.
  
  Output:
    - Renders a fully detailed book page with sections for header, summary, details, editions, 
      vendor links, library availability, and reviews.
    - Displays appropriate loading and error states during the data fetching process.
*/
'use client'

import { useState, useEffect } from 'react'
import { 
    BookHeader, 
    BookSummary, 
    BookDetails,
    LibraryAvailability,
    ReviewSection 
} from '@/components/ui/book_details'
import ItemCarousel from '@/components/ui/ItemCarousel'
import CoverImage from '@/components/ui/CoverImage'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from "@/components/layout/Header"
import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

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
  isbn?: string;
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
  primaryEditionId?: number;
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
  
  // Extract primary edition ID
  let primaryEditionId: number | undefined = undefined;
  if (primaryEdition && primaryEdition.id) {
    primaryEditionId = parseInt(String(primaryEdition.id));
  }
  
  if (primaryEdition && Object.keys(primaryEdition).length > 0) {
    editions.push({
      id: String(primaryEdition.id || ''),
      title: apiData.title || '',
      cover_image: primaryEdition.cover_image || undefined,
      publication_date: primaryEdition.publication_year 
        ? String(primaryEdition.publication_year) 
        : undefined,
      format: primaryEdition.kind || '',
      language: primaryEdition.language || '',
      isbn: primaryEdition.isbn
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
          language: edition.language || '',
          isbn: edition.isbn
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
    primaryEditionId: primaryEditionId, // Added this property
    editions: editions,
    vendor_links: vendorLinks,
    library_availability: libraryAvailability,
    reviews: reviews,
    user_status: apiData.user_status || undefined
  };
}


export default function BookPage() {
  // Extract bookId directly from the URL path to avoid Next.js params issues
  const [bookId, setBookId] = useState<string>('');
  const [book, setBook] = useState<BookData>(DEFAULT_BOOK);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Get bookId from URL on first render
  useEffect(() => {
    const pathname = window.location.pathname;
    const match = pathname.match(/\/book\/([^/]+)/);
    if (match && match[1]) {
      setBookId(match[1]);
    }
  }, []);

  // Fetch book data when bookId is available
  useEffect(() => {
    const fetchBookDetails = async () => {
      if (!bookId) return;
      
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`http://localhost:8000/api/books/${bookId}/`, {
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
    
    fetchBookDetails();
  }, [bookId]);
  
  // Common layout with header for all states
  return (
    <div className="min-h-screen flex flex-col">
      <Header variant="app" />
      
      {loading ? (
        <div className="flex-grow flex justify-center items-center">
          <div className="animate-pulse text-xl text-gray-500 dark:text-gray-300">
            Loading book details...
          </div>
        </div>
      ) : error ? (
        <div className="flex-grow flex justify-center items-center p-8">
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
      ) : (
        <div className="flex-grow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <BookHeader 
              title={book.title}
              coverImage={book.cover_image}
              authors={book.authors}
              userStatus={book.user_status}
              primaryEditionId={book.primaryEditionId}
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
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Editions</h2>
                  
                  <div className="w-full overflow-x-auto">
                    <div className="flex space-x-4 pb-4">
                      {/* Sort editions to prioritize those with cover images */}
                      {[...book.editions]
                        .sort((a, b) => {
                          // Put editions with cover images first
                          if (a.cover_image && !b.cover_image) return -1;
                          if (!a.cover_image && b.cover_image) return 1;
                          return 0;
                        })
                        .map((edition) => (
                          <Link 
                            key={edition.id}
                            href={edition.isbn ? `/edition/${edition.isbn}` : "#"}
                            className="flex-shrink-0 w-48 cursor-pointer"
                            onClick={(e) => {
                              if (!edition.isbn) {
                                e.preventDefault();
                                console.log(`Edition clicked but no ISBN available: ${edition.id}`);
                              } else {
                                console.log(`Navigating to edition: ${edition.isbn}`);
                              }
                            }}
                          >
                            <div className="flex flex-col">
                              <div className="relative h-72 w-full">
                                {edition.cover_image ? (
                                  <img
                                    src={edition.cover_image}
                                    alt={`Cover for ${edition.title || book.title}`}
                                    className="w-full h-full object-cover rounded-md shadow-lg"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-md">
                                    <span className="text-gray-500">No cover</span>
                                  </div>
                                )}
                              </div>
                              
                              {edition.format && (
                                <span className="mt-2 text-sm text-gray-700 dark:text-gray-300">{edition.format}</span>
                              )}
                              
                              {edition.publication_date && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">{edition.publication_date}</span>
                              )}
                              
                              {edition.isbn && (
                                <span className="text-xs text-blue-500 font-medium mt-1 hover:underline">
                                  View edition details →
                                </span>
                              )}
                            </div>
                          </Link>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Vendor Links or Placeholder */}
            <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">Where to Buy</h2>
              <p className="text-gray-500 dark:text-gray-300 mb-4">Available on Amazon:</p>

              <div className="flex items-center gap-4">
                <Button asChild className="bg-[#FF9900] hover:bg-[#E88B00] text-white rounded-2xl">
                  <Link
                    href={`https://www.amazon.com/s?k=${encodeURIComponent(book.isbn!)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-start px-4 py-2"
                  >
                    Buy on Amazon
                    <ShoppingCart className="h-4 w-4" stroke="white" />
                  </Link>
                </Button>

                {/* Barnes & Noble */}
                <Button asChild className="bg-[#FF9900] hover:bg-[#E88B00] text-white rounded-2xl">
                  <Link
                    href={`https://www.barnesandnoble.com/s/${encodeURIComponent(book.title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-start px-4 py-2"
                  >
                    Buy on Barnes & Noble 
                    <ShoppingCart className="h-4 w-4" stroke="white" />
                  </Link>
                </Button>
              </div>
            </div>



            
            {/* Library Availability or Placeholder */}
            {book.library_availability && book.library_availability.length > 0 ? (
              <div className="mt-8">
                <LibraryAvailability libraries={book.library_availability} />
              </div>
            ) : (
              <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Library Availability</h2>
                <p className="text-gray-500 dark:text-gray-300 mt-2">Unavailable</p>
              </div>
            )}
            
            <div className="mt-8">
              <ReviewSection 
                reviews={book.reviews} 
                bookId={book.book_id}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}