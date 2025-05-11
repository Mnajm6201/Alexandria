"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Users, ChevronRight } from "lucide-react";
import { useJWToken } from "@/utils/getJWToken";

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
  userId: string;
  className?: string;
  limit?: number;
}

export default function UserBookClubs({
  userId,
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

        const url =
          userId === "me"
            ? `http://localhost:8000/api/auth/users/${userId}/book-clubs/`
            : "http://localhost:8000/api/auth/users/me/book-clubs/";
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
      <div className="space-y-3">
        <div className="animate-pulse h-16 bg-amber-100 rounded-lg w-full"></div>
        <div className="animate-pulse h-16 bg-amber-100 rounded-lg w-full"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-red-500 p-4 text-center">
        <p>Error: {error}</p>
      </div>
    );
  }

  // No clubs found
  if (bookClubs.length === 0) {
    return (
      <p className="text-center text-amber-700 py-2">No book clubs joined</p>
    );
  }

  // Display clubs (with limit if provided)
  const displayedClubs = limit ? bookClubs.slice(0, limit) : bookClubs;

  return (
    <div className="space-y-3">
      {displayedClubs.map((club) => (
        <Link
          key={club.id}
          href={`/club/${club.id}`}
          className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-amber-50"
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
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-amber-200 text-amber-800">
                {club.name.substring(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <p className="font-medium text-amber-900">{club.name}</p>
            <p className="text-xs text-amber-700">
              {club.member_count} members
              {club.is_admin && " • Admin"}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
