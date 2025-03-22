/*
  Name: adapters.ts
  Date: 03/22/2025
  Description: This file defines interfaces for various book-related data structures and provides a function to transform raw API data into a strongly-typed BookData object. It includes interfaces for Author, Edition, Vendor, Library, Review, UserStatus, and BookData. The adaptBookData function safely processes the incoming API data by handling missing or incomplete information, transforming arrays (such as authors, genres, and editions), and combining primary and additional edition data into a single, consistent structure.

  Input:
    - apiData: Raw API data (of any type) containing book details. This data may include information about the primary edition, authors, genres, other editions, and user status.

  Output:
    - Returns a BookData object that conforms to the defined interface. The returned object includes:
        • book_id: A string identifier for the book.
        • title: The title of the book.
        • cover_image: URL for the book cover (if available).
        • authors: An array of Author objects.
        • summary: A summary of the book.
        • page_count: Number of pages (if available).
        • original_publication_date: The publication date derived from the API.
        • isbn: The book's ISBN from the primary edition.
        • genres: An array of genre names.
        • language: The original language of the book.
        • editions: An array combining primary and other editions.
        • vendor_links: An array of Vendor objects (currently initialized as empty).
        • library_availability: An array of Library objects (currently initialized as empty).
        • reviews: An array of Review objects (currently initialized as empty).
        • user_status: User-specific status information (if provided).

  Notes:
    - The function employs fallback values and safe access checks to ensure robustness against incomplete API responses.
    - Some fields, such as vendor_links, library_availability, and reviews, are initialized as empty arrays and can be further populated as needed.
*/
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
  
  export function adaptBookData(apiData: any): BookData {
    // Define arrays with their explicit types
    const vendorLinks: Vendor[] = [];
    const libraryAvailability: Library[] = [];
    const reviews: Review[] = [];
  
    // Fallback for missing data
    if (!apiData) {
      return {
        book_id: '',
        title: 'Untitled Book',
        authors: [],
        summary: '',
        editions: [],
        vendor_links: vendorLinks,
        library_availability: libraryAvailability,
        reviews: reviews
      };
    }
  
    // Handle primary edition data safely
    const primaryEdition = apiData.primary_edition || {};
    
    // Extract cover image from primary edition if available
    const coverImage = primaryEdition.cover_image || undefined;
    
    // Safely handle authors array
    const authors: Author[] = Array.isArray(apiData.authors) 
      ? apiData.authors.map((author: any) => ({
          id: String(author.id || ''),
          name: author.name || '',
          image: author.author_image || undefined
        }))
      : [];
    
    // Transform genres from objects to strings
    const genres: string[] = Array.isArray(apiData.genres)
      ? apiData.genres.map((genre: any) => genre.name || '')
      : [];
    
    // Combine primary edition and other editions
    const editions: Edition[] = [];
    
    if (primaryEdition && Object.keys(primaryEdition).length > 0) {
      editions.push({
        id: String(primaryEdition.id || ''),
        title: apiData.title || 'Unknown title', 
        cover_image: primaryEdition.cover_image || undefined,
        publication_date: primaryEdition.publication_year 
          ? String(primaryEdition.publication_year) 
          : undefined,
        format: primaryEdition.kind || 'Unknown format',
        language: primaryEdition.language || 'Unknown language'
      });
    }
    
    // Safely handle other editions
    if (Array.isArray(apiData.other_editions)) {
      apiData.other_editions.forEach((edition: any) => {
        if (edition) {
          editions.push({
            id: String(edition.id || ''),
            title: apiData.title || 'Unknown title',
            cover_image: edition.cover_image || undefined,
            publication_date: edition.publication_year 
              ? String(edition.publication_year) 
              : undefined,
            format: edition.kind || 'Unknown format',
            language: edition.language || 'Unknown language'
          });
        }
      });
    }
    
    // Create a properly structured book object
    return {
      book_id: apiData.id ? String(apiData.id) : '',
      title: apiData.title || 'Untitled Book',
      cover_image: coverImage,
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