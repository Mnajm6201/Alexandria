"use client";

import { useState, useEffect } from "react";
import {
  BookOpen,
  Edit,
  Save,
  PlusCircle,
  MinusCircle,
  Users,
} from "lucide-react";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { useJWToken } from "@/utils/getJWToken";

interface ReadingProgressProps {
  bookId: string;
  className?: string;
}

interface ClubProgress {
  reading_status: string;
  current_page: number;
  club: {
    id: string;
    name: string;
  };
}

export default function ClubReadingProgress({
  bookId,
  className = "",
}: ReadingProgressProps) {
  const [progressData, setProgressData] = useState<ClubProgress | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [tempPage, setTempPage] = useState(0);
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const { jwtToken, fetchJWToken } = useJWToken();

  // Fetch reading progress
  // In ClubReadingProgress.tsx
  useEffect(() => {
    async function fetchReadingProgress() {
      try {
        setLoading(true);

        const token = jwtToken || (await fetchJWToken());

        if (!token) {
          console.error("Authentication required");
          setLoading(false);
          return;
        }

        // Log the URL we're fetching from
        const url = `http://localhost:8000/api/auth/books/${bookId}/progress/`;
        console.log("Fetching reading progress from:", url);

        // Fetch current user's reading progress for this book
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        // Log the response details
        console.log("Progress response status:", response.status);

        // If 404 or other error status, user isn't reading this book
        if (!response.ok) {
          // Try to get the error message from the response
          try {
            const errorText = await response.text();
            console.error("Error response:", errorText);

            // This isn't an error, just means user isn't reading this book in any club
            if (response.status === 404) {
              setProgressData(null);
            } else {
              setError(
                `Error ${response.status}: ${errorText || "Unknown error"}`
              );
            }
          } catch (e) {
            console.error("Failed to parse error response:", e);
            setError(`Error ${response.status}`);
          }

          setLoading(false);
          return;
        }

        const data = await response.json();
        console.log("Reading progress data:", data);

        if (data.reading) {
          setProgressData({
            reading_status: data.reading_status,
            current_page: data.current_page || 0,
            club: data.club,
          });

          setTempPage(data.current_page || 0);
          setTotalPages(data.total_pages || null);
        } else {
          setProgressData(null);
        }
      } catch (err) {
        console.error("Error fetching reading progress:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch reading progress"
        );
      } finally {
        setLoading(false);
      }
    }

    if (bookId) {
      fetchReadingProgress();
    }
  }, [bookId, jwtToken, fetchJWToken]);

  // Update reading progress
  async function updateProgress() {
    if (!progressData || tempPage === progressData.current_page) {
      setIsEditing(false);
      return;
    }

    try {
      setIsUpdating(true);

      const token = jwtToken || (await fetchJWToken());

      if (!token) {
        console.error("Authentication required");
        setIsUpdating(false);
        return;
      }

      // Check if this would complete the book
      let newStatus = progressData.reading_status;
      if (totalPages && tempPage >= totalPages) {
        newStatus = "Completed";
      } else if (newStatus === "Not Started") {
        newStatus = "Reading";
      }

      // Update reading progress through the club-specific endpoint
      const response = await fetch(
        `http://localhost:8000/api/bookclubs/clubs/${progressData.club.id}/progress/update/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reading_status: newStatus,
            current_page: tempPage,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update reading progress");
      }

      const data = await response.json();
      console.log("Updated progress:", data);

      // Update local state
      setProgressData({
        ...progressData,
        reading_status: data.reading_status,
        current_page: data.current_page,
      });

      setIsEditing(false);
    } catch (err) {
      console.error("Error updating reading progress:", err);
    } finally {
      setIsUpdating(false);
    }
  }

  // Increment/decrement page count
  function adjustPage(increment: boolean) {
    if (increment) {
      setTempPage((prev) =>
        totalPages ? Math.min(prev + 1, totalPages) : prev + 1
      );
    } else {
      setTempPage((prev) => Math.max(prev - 1, 0));
    }
  }

  // Calculate progress percentage
  const progressPercentage =
    totalPages && progressData?.current_page
      ? Math.min(
          Math.round((progressData.current_page / totalPages) * 100),
          100
        )
      : 0;

  // Loading state
  if (loading) {
    return (
      <div
        className={`rounded-lg border border-amber-200 bg-white p-4 ${className}`}
      >
        <div className="animate-pulse space-y-2">
          <div className="h-5 bg-amber-100 rounded w-1/3"></div>
          <div className="h-4 bg-amber-100 rounded w-3/4"></div>
          <div className="h-2 bg-amber-100 rounded w-full mt-4"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className={`rounded-lg border border-amber-200 bg-white p-4 text-red-500 ${className}`}
      >
        {error}
      </div>
    );
  }

  // Not reading in any club
  if (!progressData) {
    return null; // Don't show any UI if not reading
  }

  return (
    <div
      className={`rounded-lg border border-amber-200 bg-white p-4 ${className}`}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-amber-900 flex items-center">
          <BookOpen className="h-4 w-4 mr-1.5" />
          Club Reading Progress
        </h3>

        <Link
          href={`/club/${progressData.club.id}`}
          className="text-amber-600 hover:text-amber-800 text-sm flex items-center"
        >
          <Users className="h-3.5 w-3.5 mr-1" />
          {progressData.club.name}
        </Link>
      </div>

      {!isEditing ? (
        <div className="mt-3">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-sm text-amber-800">
              {progressData.reading_status === "Completed"
                ? "You've completed this book!"
                : `Currently on page ${progressData.current_page}`}
            </span>

            {progressData.reading_status !== "Completed" && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs px-2 py-0.5 bg-amber-50 border border-amber-200 rounded text-amber-800 hover:bg-amber-100"
              >
                <Edit className="h-3 w-3 inline mr-1" />
                Update
              </button>
            )}
          </div>

          <Progress value={progressPercentage} className="h-2 bg-amber-100" />

          <div className="mt-1 flex justify-between items-center text-xs text-amber-600">
            {totalPages ? (
              <>
                <span>Page {progressData.current_page}</span>
                <span>{progressPercentage}%</span>
                <span>Page {totalPages}</span>
              </>
            ) : (
              <span>Page {progressData.current_page}</span>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-3">
          <div className="flex justify-center items-center gap-3 mb-2">
            <button
              onClick={() => adjustPage(false)}
              disabled={tempPage <= 0 || isUpdating}
              className="p-1 text-amber-600 hover:bg-amber-100 rounded-full disabled:opacity-40"
            >
              <MinusCircle className="h-5 w-5" />
            </button>

            <div className="w-20 text-center">
              <span className="font-medium text-amber-900">{tempPage}</span>
              {totalPages && (
                <span className="text-sm text-amber-700"> / {totalPages}</span>
              )}
            </div>

            <button
              onClick={() => adjustPage(true)}
              disabled={isUpdating || (totalPages && tempPage >= totalPages)}
              className="p-1 text-amber-600 hover:bg-amber-100 rounded-full disabled:opacity-40"
            >
              <PlusCircle className="h-5 w-5" />
            </button>
          </div>

          <div className="flex justify-end gap-2 mt-3">
            <button
              onClick={() => {
                setTempPage(progressData.current_page);
                setIsEditing(false);
              }}
              disabled={isUpdating}
              className="px-3 py-1 text-xs bg-white text-amber-800 border border-amber-200 rounded hover:bg-amber-50"
            >
              Cancel
            </button>
            <button
              onClick={updateProgress}
              disabled={isUpdating}
              className="px-3 py-1 text-xs bg-amber-600 text-white rounded hover:bg-amber-700 disabled:opacity-60 flex items-center"
            >
              <Save className="h-3 w-3 mr-1" />
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
