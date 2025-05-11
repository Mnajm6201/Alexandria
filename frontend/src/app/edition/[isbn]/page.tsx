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
import CoverImage from '@/components/ui/CoverImage'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
  isbn: string;
  cover_image?: string;
  publication_date?: string;
  publication_year?: number;
  format?: string;
  kind?: string;
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

interface BookInfo {
  id: string;
  title: string;
  authors: Author[];
  summary?: string;
  average_rating?: number;
  year_published?: number;
  original_language?: string;
  genres?: {id: string, name: string}[];
}

interface EditionData {
  id: string;
  isbn: string;
  kind: string;
  publication_year: number;
  language: string;
  page_count?: number;
  edition_number?: number;
  abridged: boolean;
  book_info: BookInfo;
  cover_image?: string;
  publisher_name?: string;
  other_editions: Edition[];
  user_status?: UserStatus;
  vendor_links?: Vendor[];
  library_availability?: Library[];
  reviews?: Review[];
}

// Default empty edition object
const DEFAULT_EDITION: EditionData = {
  id: '',
  isbn: '',
  kind: '',
  publication_year: 0,
  language: '',
  abridged: false,
  book_info: {
    id: '',
    title: 'Untitled Book',
    authors: []
  },
  other_editions: []
}

export default function EditionPage() {
  // Extract ISBN directly from the URL path
  const [isbn, setIsbn] = useState<string>('');
  const [edition, setEdition] = useState<EditionData>(DEFAULT_EDITION);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  // Get ISBN from URL on first render
  useEffect(() => {
    const pathname = window.location.pathname;
    const match = pathname.match(/\/edition\/([^/]+)/);
    if (match && match[1]) {
      setIsbn(match[1]);
    }
  }, []);

  // Fetch edition data when ISBN is available
  useEffect(() => {
    const fetchEditionDetails = async () => {
      if (!isbn) return;
      
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`http://localhost:8000/api/editions/${isbn}/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || `Failed to fetch edition details (${response.status})`);
        }
        
        const editionData = await response.json();
        console.log('API Response:', editionData);
        
        setEdition(editionData);
      } catch (err) {
        const errorMessage = err instanceof Error 
          ? err.message 
          : 'An unexpected error occurred';
        
        setError(errorMessage);
        console.error('Edition fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEditionDetails();
  }, [isbn]);
  
  if (loading) return (
    <div>
      <Header variant="app" />
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-pulse text-xl text-gray-500 dark:text-gray-300">Loading edition details...</div>
      </div>
    </div>
  );
  
  if (error) return (
    <div>
      <Header variant="app" />
      <div className="flex justify-center items-center min-h-screen p-8">
        <div className="text-red-500 text-center">
          <h2 className="text-2xl font-bold mb-4">Error Loading Edition</h2>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );

  // Create a parent book link
  const ParentBookLink = () => (
    <div className="mb-8 bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Parent Book</h2>
      <div className="flex items-center">
        <Link href={`/book/${edition.book_info.id}`} className="flex items-center hover:bg-gray-50 p-2 rounded">
          <div className="flex-shrink-0 mr-4">
            <CoverImage 
              src={edition.cover_image} 
              alt={edition.book_info.title}
              width={60}
              height={90}
            />
          </div>
          <div>
            <h3 className="font-medium text-blue-600">{edition.book_info.title}</h3>
            <p className="text-sm text-gray-600">
              View main book page
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
  
  return (
    <div>
      <Header variant="app" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BookHeader 
          title={`${edition.book_info.title} (${edition.kind} Edition, ${edition.publication_year})`}
          coverImage={edition.cover_image}
          authors={edition.book_info.authors}
          userStatus={edition.user_status}
          primaryEditionId={parseInt(edition.id)} 
        />

        <div className="mt-8">
          <ParentBookLink />
        </div>
        
        <div className="mt-8">
          <BookSummary summary={edition.book_info.summary} />
        </div>
        
        <div className="mt-8">
          <BookDetails 
            pageCount={edition.page_count}
            publicationDate={String(edition.publication_year)}
            isbn={edition.isbn}
            genres={edition.book_info.genres?.map(g => g.name) || []}
            language={edition.language}
            editionNumber={edition.edition_number}
            format={edition.kind}
            publisher={edition.publisher_name}
            isAbridged={edition.abridged}
          />
        </div>
        
        {edition.other_editions && edition.other_editions.length > 0 && (
          <div className="mt-8">
            <ItemCarousel 
              items={edition.other_editions}
              title="Other Editions"
              onItemClick={(editionItem) => {
                // Navigate to the edition page when clicked
                router.push(`/edition/${editionItem.isbn}`);
              }}
              renderItem={(editionItem) => (
                <div className="flex flex-col">
                  <CoverImage 
                    src={editionItem.cover_image}
                    alt={`Cover for ${edition.book_info.title} (${editionItem.kind})`}
                    width="100%"
                    height="h-72"
                    className="mb-2"
                  />
                  {editionItem.kind && (
                    <span className="mt-2 text-sm text-gray-700 dark:text-gray-300">{editionItem.kind}</span>
                  )}
                  {editionItem.publication_year && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">{editionItem.publication_year}</span>
                  )}
                </div>
              )}
            />
          </div>
        )}
        
        {/* Vendor Links or Placeholder */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">Where to Buy</h2>
              <p className="text-gray-500 dark:text-gray-300 mb-4">Available on Amazon:</p>

              <div className="flex items-center gap-4">
                <Button asChild className="bg-[#FF9900] hover:bg-[#E88B00] text-white rounded-2xl">
                  <Link
                    href={`https://www.amazon.com/s?k=${encodeURIComponent(edition.isbn!)}`}
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
                    href={`https://www.barnesandnoble.com/s/${encodeURIComponent(edition.book_info.title!)}`}
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
        {edition.library_availability && edition.library_availability.length > 0 ? (
          <div className="mt-8">
            <LibraryAvailability libraries={edition.library_availability} />
          </div>
        ) : (
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Library Availability</h2>
            <p className="text-gray-500 dark:text-gray-300 mt-2">Unavailable</p>
          </div>
        )}
        
        <div className="mt-8">
          <ReviewSection 
            reviews={edition.reviews || []} 
            bookId={edition.book_info.id}
          />
        </div>
      </div>
    </div>
  );
}