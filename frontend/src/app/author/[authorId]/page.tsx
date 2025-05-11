'use client'

import { useState, useEffect } from 'react'
import { 
  AuthorHeader,
  AuthorBio
} from '@/components/ui/author_details'
import ItemCarousel from '@/components/ui/ItemCarousel'
import CoverImage from '@/components/ui/CoverImage'
import { Header } from "@/components/layout/Header"

interface Book {
  id: string;
  title: string;
  cover_image?: string;
}

interface AuthorData {
  id: string;
  name: string;
  biography?: string;
  author_image?: string;
  books: Book[];
}

const DEFAULT_AUTHOR: AuthorData = {
  id: '',
  name: 'Unknown Author',
  biography: '',
  books: []
};

function adaptAuthorData(apiData: any): AuthorData {
  if (!apiData) return DEFAULT_AUTHOR;

  const books: Book[] = [];
  if (Array.isArray(apiData.books)) {
    apiData.books.forEach((book: any) => {
      books.push({
        id: book.id || '',
        title: book.title || 'Untitled Book',
        cover_image: book.cover_image || undefined
      });
    });
  }

  return {
    id: apiData.id ? String(apiData.id) : '',
    name: apiData.name || 'Unknown Author',
    biography: apiData.biography || '',
    author_image: apiData.author_image || undefined,
    books: books
  };
}

export default function AuthorPage() {
  const [authorId, setAuthorId] = useState<string>('');
  const [author, setAuthor] = useState<AuthorData>(DEFAULT_AUTHOR);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const pathname = window.location.pathname;
    const match = pathname.match(/\/author\/([^/]+)/);
    if (match && match[1]) {
      setAuthorId(match[1]);
    }
  }, []);

  useEffect(() => {
    const fetchAuthorDetails = async () => {
      if (!authorId) return;
      
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`http://localhost:8000/api/authors/${authorId}/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || `Failed to fetch author details (${response.status})`);
        }
        
        const apiData = await response.json();
        const transformedData = adaptAuthorData(apiData);
        setAuthor(transformedData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        console.error('Author fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAuthorDetails();
  }, [authorId]);
  
  if (loading) {
    return (
      <div>
        <Header variant="app" />
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-pulse text-xl">
            Loading author details...
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div>
        <Header variant="app" />
        <div className="flex justify-center items-center min-h-screen p-8">
          <div className="text-red-500 text-center">
            <h2 className="text-2xl font-bold mb-4">Error Loading Author</h2>
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
  }
  
  return (
    <>
      <Header variant="app" />

      
      <div className="author-page max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AuthorHeader 
          name={author.name}
          image={author.author_image}
        />
        
        <div className="mt-8">
          <AuthorBio biography={author.biography} />
        </div>
        
        {author.books && author.books.length > 0 && (
          <div className="mt-8">
            <ItemCarousel 
              items={author.books}
              title={`Books by ${author.name}`}
              onItemClick={(book) => {
                window.location.href = `/book/${book.id}`;
              }}
              renderItem={(book) => (
                <div className="flex flex-col">
                  <CoverImage 
                    src={book.cover_image}
                    alt={`Cover for ${book.title}`}
                    width="100%"
                    height="h-72"
                    className="mb-2"
                  />
                  <span className="mt-2 text-sm font-medium line-clamp-2">
                    {book.title}
                  </span>
                </div>
              )}
            />
          </div>
        )}
      </div>
    </>
  );
}