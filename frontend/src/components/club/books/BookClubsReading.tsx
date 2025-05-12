"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Coffee, Users, ChevronRight, PlusCircle } from "lucide-react";
import { useJWToken } from "@/utils/getJWToken";

interface BookClub {
  id: string;
  name: string;
  description?: string;
  member_count: number;
  is_private: boolean;
  club_image?: string;
  is_member?: boolean;
}

interface BookDetails {
  book_id: string;
  title: string;
  authors: string[];
  cover_url?: string;
  year_published?: number;
}

interface BookClubsReadingProps {
  bookId: string;
  className?: string;
  limit?: number;
  bookDetails?: BookDetails;
}

export default function BookClubsReading({
  bookId,
  className = "",
  limit = 3,
  bookDetails,
}: BookClubsReadingProps) {
  const [clubs, setClubs] = useState<BookClub[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { jwtToken, fetchJWToken } = useJWToken();

  useEffect(() => {
    async function fetchBookClubs() {
      try {
        setLoading(true);

        const token = jwtToken || (await fetchJWToken());

        if (!token) {
          console.error("Authentication required");
          setLoading(false);
          return;
        }

        // Fetch book clubs reading this book
        console.log(`Fetching clubs reading book ${bookId}...`);
        const response = await fetch(
          `http://localhost:8000/api/bookclubs/books/${bookId}/book-clubs/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Error response:", errorData);
          throw new Error(
            errorData.error || `Failed to fetch book clubs: ${response.status}`
          );
        }

        const data = await response.json();
        console.log("Book clubs reading this book:", data);
        setClubs(data);
      } catch (err) {
        console.error("Error fetching book clubs:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch book clubs"
        );
      } finally {
        setLoading(false);
      }
    }

    if (bookId) {
      fetchBookClubs();
    }
  }, [bookId, jwtToken, fetchJWToken]);

  // Format club image URL
  const getClubImageUrl = (imageUrl: string | undefined) => {
    if (!imageUrl) return null;

    return imageUrl.startsWith("http")
      ? imageUrl
      : `http://localhost:8000${imageUrl}`;
  };

  // Loading state
  if (loading) {
    return (
      <div
        className={`rounded-lg border border-amber-200 bg-white p-6 ${className}`}
      >
        <h2 className="text-xl font-bold font-serif text-amber-900 mb-4">
          Book Clubs Reading This
        </h2>
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-amber-100 h-12 w-12"></div>
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-amber-100 rounded w-3/4"></div>
            <div className="h-4 bg-amber-100 rounded w-1/2"></div>
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
        <h2 className="text-xl font-bold font-serif text-amber-900 mb-4">
          Book Clubs Reading This
        </h2>
        <div className="text-red-500 p-4 text-center">
          <p>Error: {error}</p>
          <p className="text-sm mt-2">
            Please check the API endpoint and try again.
          </p>
        </div>
      </div>
    );
  }

  // No clubs found
  if (clubs.length === 0) {
    return (
      <div
        className={`rounded-lg border border-amber-200 bg-white p-6 ${className}`}
      >
        <h2 className="text-xl font-bold font-serif text-amber-900 mb-4">
          Book Clubs Reading This
        </h2>
        <div className="text-center py-6">
          <Coffee className="h-12 w-12 mx-auto text-amber-300 mb-3" />
          <p className="text-amber-700">
            No book clubs are currently reading this book
          </p>
          <Link href="/club">
            <button className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700">
              Start a Book Club
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // Display clubs up to the limit
  const displayedClubs = limit ? clubs.slice(0, limit) : clubs;

  return (
    <div
      className={`rounded-lg border border-amber-200 bg-white p-6 ${className}`}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold font-serif text-amber-900">
          Book Clubs Reading This
        </h2>
        {clubs.length > limit && (
          <Link
            href={`/book/${bookId}/clubs`}
            className="text-amber-600 hover:text-amber-800 flex items-center text-sm"
          >
            View All ({clubs.length})
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        )}
      </div>

      <div className="space-y-4">
        {displayedClubs.map((club) => (
          <Link href={`/club/${club.id}`} key={club.id}>
            <div className="flex items-start gap-4 p-4 border border-amber-100 rounded-lg hover:bg-amber-50 transition-colors">
              {/* Club Image - using book cover as fallback */}
              <div className="h-14 w-14 rounded-full overflow-hidden bg-amber-100 flex-shrink-0">
                {club.club_image ? (
                  <Image
                    src={getClubImageUrl(club.club_image) || ""}
                    alt={club.name}
                    width={56}
                    height={56}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                ) : bookDetails && bookDetails.cover_url ? (
                  // Use book cover image as fallback if available
                  <img
                    src={bookDetails.cover_url}
                    alt={`Cover for ${bookDetails.title}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  // Fallback to club initials if neither club image nor book cover is available
                  <div className="h-full w-full flex items-center justify-center bg-amber-200 text-amber-800 font-bold">
                    {club.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Club Details */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-amber-900 truncate">
                    {club.name}
                  </h3>
                  {club.is_private && (
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                      Private
                    </span>
                  )}
                </div>

                {club.description && (
                  <p className="text-sm text-amber-700 line-clamp-1 mt-1">
                    {club.description}
                  </p>
                )}

                <div className="flex items-center mt-2">
                  <span className="text-xs text-amber-600 flex items-center">
                    <Users className="h-3.5 w-3.5 mr-1" />
                    {club.member_count}{" "}
                    {club.member_count === 1 ? "member" : "members"}
                  </span>

                  {club.is_member && (
                    <span className="ml-3 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                      Member
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}

        <Link href="/club">
          <div className="flex items-center justify-center p-4 border border-dashed border-amber-300 rounded-lg hover:bg-amber-50 transition-colors">
            <div className="flex items-center text-amber-700 font-medium">
              <PlusCircle className="h-5 w-5 mr-2 text-amber-600" />
              Start a Book Club for this book
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
