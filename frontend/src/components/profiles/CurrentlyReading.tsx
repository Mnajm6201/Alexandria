"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, PlusCircle, Coffee } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useJWToken } from "@/utils/getJWToken";

interface ReadingBook {
  id: string;
  title: string;
  author: string;
  cover_image?: string;
  current_page?: number;
  total_pages?: number;
  progress_percentage?: number;
  club?: {
    id: string;
    name: string;
  };
}

interface CurrentlyReadingProps {
  userId?: string; // If not provided, shows current user's books
  showAddButton?: boolean;
  limit?: number;
  className?: string;
}

export default function CurrentlyReading({
  userId,
  showAddButton = false,
  limit = 1,
  className = "",
}: CurrentlyReadingProps) {
  const [books, setBooks] = useState<ReadingBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { jwtToken, fetchJWToken } = useJWToken();

  useEffect(() => {
    async function fetchCurrentlyReading() {
      try {
        setLoading(true);

        const token = jwtToken || (await fetchJWToken());

        if (!token) {
          console.error("Authentication required");
          setLoading(false);
          return;
        }

        // Construct the URL based on whether we're fetching for a specific user or the current user
        const url = userId
          ? `http://localhost:8000/api/auth/users/${userId}/currently-reading/`
          : `http://localhost:8000/api/auth/users/me/currently-reading/`;

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch currently reading books");
        }

        const data = await response.json();
        console.log("Currently reading books:", data);
        setBooks(data);
      } catch (err) {
        console.error("Error fetching currently reading books:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch currently reading books"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchCurrentlyReading();
  }, [userId, jwtToken, fetchJWToken]);

  // Format book cover URL
  const getBookCoverUrl = (coverUrl: string | undefined) => {
    if (!coverUrl) return "/placeholder.svg?height=96&width=64";

    return coverUrl.startsWith("http")
      ? coverUrl
      : `http://localhost:8000${coverUrl}`;
  };

  // Loading state
  if (loading) {
    return (
      <div
        className={`rounded-lg border border-amber-200 bg-white p-6 ${className}`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-serif font-bold text-amber-900">
            Currently Reading
          </h2>
        </div>
        <div className="animate-pulse flex space-x-4">
          <div className="bg-amber-100 h-24 w-16 rounded"></div>
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-amber-100 rounded w-2/3"></div>
            <div className="h-4 bg-amber-100 rounded w-1/2"></div>
            <div className="h-4 bg-amber-100 rounded w-3/4"></div>
            <div className="h-2 bg-amber-100 rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className={`rounded-lg border border-amber-200 bg-white p-6 ${className}`}
      >
        <h2 className="text-xl font-serif font-bold text-amber-900 mb-4">
          Currently Reading
        </h2>
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  // No books
  if (books.length === 0) {
    return (
      <div
        className={`rounded-lg border border-amber-200 bg-white p-6 ${className}`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-serif font-bold text-amber-900">
            Currently Reading
          </h2>
          {showAddButton && (
            <Link href="/book">
              <button className="text-sm bg-amber-600 text-white px-3 py-1.5 rounded hover:bg-amber-700 flex items-center">
                <PlusCircle className="h-4 w-4 mr-1" />
                Add Book
              </button>
            </Link>
          )}
        </div>

        <div className="text-center py-6">
          <BookOpen className="h-12 w-12 mx-auto text-amber-300 mb-3" />
          <p className="text-amber-700 mb-2">
            {userId
              ? "This user isn't currently reading any books"
              : "You're not currently reading any books"}
          </p>
          {showAddButton && (
            <Link href="/book">
              <button className="mt-2 px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700">
                Find Books to Read
              </button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  // Display books
  const displayedBooks = limit ? books.slice(0, limit) : books;

  return (
    <div
      className={`rounded-lg border border-amber-200 bg-white p-6 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-serif font-bold text-amber-900">
          Currently Reading
        </h2>
        {showAddButton && (
          <Link href="/book">
            <button className="text-sm bg-amber-600 text-white px-3 py-1.5 rounded hover:bg-amber-700 flex items-center">
              <PlusCircle className="h-4 w-4 mr-1" />
              Add Book
            </button>
          </Link>
        )}
      </div>

      <div className="space-y-6">
        {displayedBooks.map((book) => (
          <div key={book.id} className="flex gap-4">
            <div className="h-24 w-16 flex-shrink-0 overflow-hidden rounded-md bg-amber-200">
              <Image
                src={getBookCoverUrl(book.cover_image)}
                alt={`Cover for ${book.title}`}
                width={64}
                height={96}
                className="h-full w-full object-cover"
                unoptimized
              />
            </div>
            <div className="flex-1 space-y-2">
              <Link
                href={`/book/${book.id}`}
                className="font-medium text-amber-900 hover:underline"
              >
                {book.title}
              </Link>
              <p className="text-sm text-amber-700">by {book.author}</p>

              {/* Progress info */}
              {book.current_page !== undefined && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm text-amber-700">
                    <span>
                      {book.total_pages
                        ? `Page ${book.current_page} of ${book.total_pages}`
                        : `Page ${book.current_page}`}
                    </span>
                    {book.progress_percentage !== undefined && (
                      <span className="text-xs">
                        {Math.round(book.progress_percentage)}%
                      </span>
                    )}
                  </div>

                  <Progress
                    value={book.progress_percentage || 0}
                    className="h-2 bg-amber-100"
                  />
                </div>
              )}

              {/* Book club info */}
              {book.club && (
                <div className="text-xs text-amber-600 mt-1">
                  <Link
                    href={`/club/${book.club.id}`}
                    className="hover:underline"
                  >
                    Reading in {book.club.name}
                  </Link>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Show "View all" if there are more books */}
        {books.length > limit && (
          <div className="text-center">
            <Link
              href={userId ? `/profile/${userId}/reading` : "/profile/reading"}
            >
              <button className="text-sm text-amber-600 hover:text-amber-800 hover:underline">
                View all ({books.length})
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
