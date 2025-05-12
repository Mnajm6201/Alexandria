"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Users, ChevronRight, Loader2, Plus } from "lucide-react";
import { useJWToken } from "@/utils/getJWToken";
import { Button } from "@/components/ui/button";

interface BookClub {
  id: number;
  name: string;
  description: string;
  is_private: boolean;
  member_count: number;
  club_image?: string;
  joined_date: string;
  is_admin: boolean;
  reading_status?: string;
  current_page?: number;
  book?: {
    id: number;
    book_id: string;
    title: string;
    authors: string[];
    cover_url?: string;
  };
}

interface UserBookClubsProps {
  userId?: string;
  showAddButton?: boolean;
  className?: string;
  limit?: number;
}

export default function UserBookClubs({
  userId,
  showAddButton = false,
  className = "",
  limit = 3,
}: UserBookClubsProps) {
  const [bookClubs, setBookClubs] = useState<BookClub[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { jwtToken, fetchJWToken } = useJWToken();

  useEffect(() => {
    async function fetchUserClubs() {
      try {
        setLoading(true);

        const token = jwtToken || (await fetchJWToken());

        if (!token) {
          console.error("Authentication required");
          setLoading(false);
          return;
        }

        // Use query parameter approach - userId is optional
        const url = userId
          ? `http://localhost:8000/api/auth/users/book-clubs/?user_id=${userId}`
          : "http://localhost:8000/api/auth/users/book-clubs/";

        console.log(`Fetching user clubs from: ${url}`);

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Error fetching clubs: ${errorText}`);
          throw new Error(
            errorText || `Failed to fetch user book clubs (${response.status})`
          );
        }

        const data = await response.json();
        console.log("User book clubs:", data);
        setBookClubs(data);
      } catch (err) {
        console.error("Error fetching user book clubs:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch user book clubs"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchUserClubs();
  }, [userId, jwtToken, fetchJWToken]);

  // Format club image URL
  const getClubImageUrl = (imageUrl: string | undefined) => {
    if (!imageUrl) return null;
    return imageUrl.startsWith("http")
      ? imageUrl
      : `http://localhost:8000${imageUrl}`;
  };

  // Format joined date
  const formatJoinedDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 text-amber-600 animate-spin" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`text-red-500 p-4 text-center ${className}`}>
        <p>Error: {error}</p>
      </div>
    );
  }

  // No clubs found
  if (bookClubs.length === 0) {
    return (
      <div className={`${className}`}>
        <div className="flex flex-col items-center justify-center py-4 space-y-3">
          <p className="text-center text-amber-700">No book clubs joined</p>
          {showAddButton && (
            <Button
              variant="outline"
              size="sm"
              className="border-amber-300 text-amber-800"
              asChild
            >
              <Link href="/club">
                <Plus className="mr-1 h-4 w-4" /> Create a Book Club
              </Link>
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Display clubs (with limit if provided)
  const displayedClubs = limit ? bookClubs.slice(0, limit) : bookClubs;

  return (
    <div className={`space-y-3 ${className}`}>
      {displayedClubs.map((club) => (
        <Link
          key={club.id}
          href={`/club/${club.id}`}
          className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-amber-50 border border-amber-100"
        >
          <div className="h-12 w-12 flex-shrink-0 rounded-full overflow-hidden bg-amber-100">
            {club.club_image ? (
              <Image
                src={getClubImageUrl(club.club_image) || ""}
                alt={club.name}
                width={48}
                height={48}
                className="h-full w-full object-cover"
                unoptimized
              />
            ) : club.book?.cover_url ? (
              <Image
                src={club.book.cover_url}
                alt={club.book.title}
                width={48}
                height={48}
                className="h-full w-full object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-amber-200 text-amber-800">
                {club.name.substring(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-amber-900 truncate">{club.name}</p>
            <p className="text-xs text-amber-700 truncate">
              {club.member_count} members
              {club.is_private && " • Private"}
              {club.is_admin && " • Admin"}
            </p>
          </div>
        </Link>
      ))}

      {bookClubs.length > limit && (
        <div className="text-center pt-2">
          <Button variant="ghost" size="sm" className="text-amber-800" asChild>
            <Link href="/club">
              View All <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      )}

      {showAddButton && (
        <div className="text-center pt-3">
          <Button
            variant="outline"
            size="sm"
            className="border-amber-300 text-amber-800"
            asChild
          >
            <Link href="/club">
              <Plus className="mr-1 h-4 w-4" /> Create a Book Club
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
