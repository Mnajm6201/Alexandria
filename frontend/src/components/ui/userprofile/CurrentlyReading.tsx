"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { PlusCircle, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useJWToken } from "@/utils/getJWToken";

interface BookProgress {
  id: string;
  title: string;
  author: string;
  cover_image?: string;
  current_page?: number;
  total_pages?: number;
  progress_percentage?: number;
  last_updated?: string;
}

interface CurrentlyReadingProps {
  userId?: string;
  showAddButton?: boolean;
  className?: string;
}

export default function CurrentlyReading({
  userId,
  showAddButton = false,
  className = "",
}: CurrentlyReadingProps) {
  const [books, setBooks] = useState<BookProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { jwtToken, fetchJWToken } = useJWToken();

  useEffect(() => {
    async function fetchCurrentlyReading() {
      try {
        setLoading(true);
        setError(null);

        const token = jwtToken || (await fetchJWToken());

        if (!token) {
          setError("Authentication required");
          setLoading(false);
          return;
        }
        const url = userId
          ? `http://localhost:8000/api/users/${userId}/currently-reading`
          : `http://localhost:8000/api/users/me/currently-reading`;

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch reading data");
        }

        const data = await response.json();
        console.log("Currently reading data:", data);
        setBooks(data);
      } catch (err) {
        console.error("Error fetching currently reading:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch reading data"
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

  return (
    <div
      className={`rounded-lg border border-amber-200 bg-white p-6 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-serif font-bold text-amber-900">
          Currently Reading
        </h2>
        {showAddButton && (
          <Button
            variant="outline"
            size="sm"
            className="border-amber-300 text-amber-800"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Journal Entry
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-4">
          <div className="animate-pulse text-amber-500">Loading books...</div>
        </div>
      ) : error ? (
        <div className="text-red-500 text-center py-4">{error}</div>
      ) : books.length === 0 ? (
        <div className="text-center py-8">
          <BookOpen className="h-12 w-12 mx-auto text-amber-300 mb-3" />
          <p className="text-amber-700">No books currently being read</p>
          <Link href="/books">
            <Button className="mt-4 bg-amber-600 hover:bg-amber-700 text-white">
              Find Books to Read
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {books.map((book) => (
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
                {book.current_page !== undefined && book.total_pages ? (
                  <>
                    <div className="flex items-center gap-2 text-sm text-amber-700">
                      <span>
                        On page {book.current_page} of {book.total_pages}
                      </span>
                      <span className="text-xs">
                        (
                        {Math.round(
                          (book.current_page / book.total_pages) * 100
                        )}
                        %)
                      </span>
                    </div>
                    <Progress
                      value={(book.current_page / book.total_pages) * 100}
                      className="h-2 bg-amber-100"
                    />
                  </>
                ) : book.progress_percentage !== undefined ? (
                  <>
                    <div className="flex items-center gap-2 text-sm text-amber-700">
                      <span>{book.progress_percentage}% complete</span>
                    </div>
                    <Progress
                      value={book.progress_percentage}
                      className="h-2 bg-amber-100"
                    />
                  </>
                ) : (
                  <p className="text-sm italic text-amber-500">
                    Reading in progress
                  </p>
                )}

                {book.last_updated && (
                  <p className="text-xs text-amber-500">
                    Last updated:{" "}
                    {new Date(book.last_updated).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
