// components/bookclub/ClubHeader.tsx
import Image from "next/image";
import { BookOpen, Bell, Share2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

interface ClubHeaderProps {
  clubData: any;
  isJoining: boolean;
  isLeaving: boolean;
  onJoin: () => void;
  onLeave: () => void;
}

export function ClubHeader({
  clubData,
  isJoining,
  isLeaving,
  onJoin,
  onLeave,
}: ClubHeaderProps) {
  const currentBook = clubData.book_details;
  const [imageError, setImageError] = useState(false);

  // Format date helper
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="mb-8 rounded-lg border border-amber-200 bg-white p-6">
      <div className="flex flex-col gap-6 md:flex-row">
        <div className="flex justify-center md:block">
          <div className="h-[200px] w-[130px] overflow-hidden rounded-md border border-amber-200 bg-amber-100 shadow-md">
            {currentBook ? (
              imageError || !currentBook.cover_url ? (
                // Fallback to placeholder if cover_url is missing or image fails to load
                <Image
                  src={`/placeholder.svg?height=200&width=130&text=${
                    currentBook.title.split(" ")[0]
                  }`}
                  alt={currentBook.title}
                  width={130}
                  height={200}
                  className="h-full w-full object-cover"
                />
              ) : (
                // Attempt to load the actual book cover image
                <Image
                  src={currentBook.cover_url}
                  alt={currentBook.title}
                  width={130}
                  height={200}
                  className="h-full w-full object-cover"
                  onError={() => setImageError(true)}
                />
              )
            ) : (
              // No book case
              <div className="flex h-full w-full items-center justify-center bg-amber-100 text-amber-700">
                <BookOpen className="h-16 w-16" />
              </div>
            )}
          </div>
        </div>

        <div className="flex-1">
          <div className="mb-2 flex flex-col justify-between gap-2 sm:flex-row">
            <div>
              <h1 className="text-3xl font-serif font-bold text-amber-900">
                {clubData.name}
              </h1>
              <div className="mt-1 flex flex-wrap gap-2">
                {clubData.tags?.map((tag: string, i: number) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="bg-amber-50 text-amber-800 border-amber-200"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              {clubData.is_user_member ? (
                <Button
                  className="bg-amber-800 text-amber-50 hover:bg-amber-700"
                  onClick={onLeave}
                  disabled={isLeaving}
                >
                  {isLeaving ? "Leaving..." : "Leave Club"}
                </Button>
              ) : (
                <Button
                  className="bg-amber-800 text-amber-50 hover:bg-amber-700"
                  onClick={onJoin}
                  disabled={isJoining}
                >
                  {isJoining ? "Joining..." : "Join Club"}
                </Button>
              )}
              <Button
                variant="outline"
                size="icon"
                className="border-amber-300"
              >
                <Bell className="h-4 w-4 text-amber-800" />
                <span className="sr-only">Notifications</span>
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="border-amber-300"
              >
                <Share2 className="h-4 w-4 text-amber-800" />
                <span className="sr-only">Share</span>
              </Button>
            </div>
          </div>

          <p className="mb-4 text-amber-800">
            {clubData.club_desc || "No description available."}
          </p>

          <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg bg-amber-50 p-3 text-center">
              <div className="text-2xl font-bold text-amber-900">
                {clubData.member_count || 0}
              </div>
              <div className="text-sm text-amber-700">Members</div>
            </div>
            <div className="rounded-lg bg-amber-50 p-3 text-center">
              <div className="text-2xl font-bold text-amber-900">
                {(clubData.reading_history?.length || 0) +
                  (currentBook ? 1 : 0) ||
                  (clubData.book_club_history?.length || 0) +
                    (currentBook ? 1 : 0) ||
                  0}
              </div>
              <div className="text-sm text-amber-700">Books Read</div>
            </div>
            <div className="rounded-lg bg-amber-50 p-3 text-center">
              <div className="text-2xl font-bold text-amber-900">
                {clubData.recent_posts?.length || clubData.posts?.length || 0}
              </div>
              <div className="text-sm text-amber-700">Discussions</div>
            </div>
            <div className="rounded-lg bg-amber-50 p-3 text-center">
              <div className="text-2xl font-bold text-amber-900">
                {clubData.created_on
                  ? formatDate(clubData.created_on).split(" ")[0] +
                    " " +
                    formatDate(clubData.created_on).split(" ")[1] +
                    " " +
                    formatDate(clubData.created_on).split(" ")[2]
                  : "N/A"}
              </div>
              <div className="text-sm text-amber-700">Founded</div>
            </div>
          </div>

          {currentBook && (
            <div>
              <h2 className="mb-2 text-xl font-medium text-amber-900">
                Currently Reading
              </h2>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="flex-1">
                  <h3 className="font-medium text-amber-900">
                    {currentBook.title}
                  </h3>
                  <p className="text-sm text-amber-800">
                    by{" "}
                    {Array.isArray(currentBook.authors)
                      ? currentBook.authors.join(", ")
                      : currentBook.authors || "Unknown"}
                  </p>
                </div>
                {clubData.reading_schedules && (
                  <div className="flex items-center gap-4">
                    {clubData.user_progress && (
                      <div className="text-sm text-amber-700">
                        <span className="font-medium">
                          {Math.min(
                            100,
                            Math.round(
                              (clubData.user_progress.current_page /
                                (clubData.reading_schedules.milestones?.[
                                  clubData.reading_schedules.milestones.length -
                                    1
                                ]?.page_end || 100)) *
                                100
                            )
                          )}
                          %
                        </span>{" "}
                        complete
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-sm text-amber-700">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {formatDate(clubData.reading_schedules.start_date)} -{" "}
                        {formatDate(clubData.reading_schedules.end_date)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              {clubData.user_progress &&
                clubData.reading_schedules?.milestones?.length > 0 && (
                  <Progress
                    value={Math.min(
                      100,
                      Math.round(
                        (clubData.user_progress.current_page /
                          (clubData.reading_schedules.milestones[
                            clubData.reading_schedules.milestones.length - 1
                          ]?.page_end || 100)) *
                          100
                      )
                    )}
                    className="mt-2 h-2 bg-amber-100"
                  />
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
