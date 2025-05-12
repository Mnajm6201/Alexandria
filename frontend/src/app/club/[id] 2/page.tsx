"use client";

import { useState, useEffect } from "react";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  Calendar,
  MessageSquare,
  BookMarked,
  ChevronRight,
  Plus,
  Bell,
  Share2,
  BookText,
  User,
  BarChart,
  Search,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useJWToken } from "@/utils/getJWToken";

export default function BookClubDetailPage({
  params,
}: {
  params: { id: string };
}) {
  // Unwrap params
  const unwrappedParams = React.use(params);
  const clubId = unwrappedParams.id;

  // Store the raw club data as is from the API
  const [clubData, setClubData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("discussions");
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const { jwtToken, fetchJWToken } = useJWToken();

  useEffect(() => {
    fetchJWToken();
  }, [fetchJWToken]);

  // Fetch club details
  useEffect(() => {
    const fetchClubDetails = async () => {
      try {
        if (!clubId) return;

        const token = jwtToken || (await fetchJWToken());

        if (!token) {
          setError("Authentication required");
          setLoading(false);
          return;
        }

        // Fetch club details
        const response = await fetch(
          `http://localhost:8000/api/bookclubs/clubs/${clubId}/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch club details: ${response.status}`);
        }

        const data = await response.json();
        console.log("Raw club data:", JSON.stringify(data, null, 2));
        setClubData(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching club details:", err);
        setError("Failed to load club details. Please try again later.");
        setLoading(false);
      }
    };

    if (jwtToken) {
      fetchClubDetails();
    }
  }, [jwtToken, fetchJWToken, clubId]);

  // Join club function
  const handleJoinClub = async () => {
    try {
      setIsJoining(true);

      const token = jwtToken || (await fetchJWToken());

      if (!token) {
        setError("Authentication required");
        setIsJoining(false);
        return;
      }

      const response = await fetch(
        `http://localhost:8000/api/bookclubs/clubs/${clubId}/join/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to join club");
      }

      // Refresh club details to get updated membership status
      const clubResponse = await fetch(
        `http://localhost:8000/api/bookclubs/clubs/${clubId}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (clubResponse.ok) {
        const updatedClub = await clubResponse.json();
        setClubData(updatedClub);
      }
    } catch (err) {
      console.error("Error joining club:", err);
    } finally {
      setIsJoining(false);
    }
  };

  // Leave club function
  const handleLeaveClub = async () => {
    try {
      setIsLeaving(true);

      const token = jwtToken || (await fetchJWToken());

      if (!token) {
        setError("Authentication required");
        setIsLeaving(false);
        return;
      }

      const response = await fetch(
        `http://localhost:8000/api/bookclubs/clubs/${clubId}/leave/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to leave club");
      }

      // Refresh club details to get updated membership status
      const clubResponse = await fetch(
        `http://localhost:8000/api/bookclubs/clubs/${clubId}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (clubResponse.ok) {
        const updatedClub = await clubResponse.json();
        setClubData(updatedClub);
      }
    } catch (err) {
      console.error("Error leaving club:", err);
    } finally {
      setIsLeaving(false);
    }
  };

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

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="text-amber-800 text-xl">
          Loading book club details...
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !clubData) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="text-red-600 text-xl">
          {error || "Failed to load book club"}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50">
      <main className="max-w-6xl mx-auto px-4 py-2">
        <div className="mb-6">
          <div className="flex items-center text-sm text-amber-700">
            <Link href="/club" className="hover:text-amber-900 hover:underline">
              Book Clubs
            </Link>
            <ChevronRight className="mx-2 h-4 w-4" />
            <span className="text-amber-900">
              {clubData.name || "Book Club"}
            </span>
          </div>
        </div>

        {/* Club Header */}
        <div className="mb-8 rounded-lg border border-amber-200 bg-white p-6">
          <div className="flex flex-col gap-6 md:flex-row">
            <div className="flex justify-center md:block">
              <div className="h-[200px] w-[130px] overflow-hidden rounded-md border border-amber-200 bg-amber-100 shadow-md">
                {clubData.book_details ? (
                  <Image
                    src={`/placeholder.svg?height=200&width=130&text=${
                      clubData.book_details.title?.split(" ")[0] || "Book"
                    }`}
                    alt={clubData.book_details.title || "Book cover"}
                    width={130}
                    height={200}
                    className="h-full w-full object-cover"
                  />
                ) : (
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
                    {clubData.name || "Book Club"}
                  </h1>
                </div>
                <div className="flex gap-2">
                  {clubData.is_user_member ? (
                    <Button
                      className="bg-amber-800 text-amber-50 hover:bg-amber-700"
                      onClick={handleLeaveClub}
                      disabled={isLeaving}
                    >
                      {isLeaving ? "Leaving..." : "Leave Club"}
                    </Button>
                  ) : (
                    <Button
                      className="bg-amber-800 text-amber-50 hover:bg-amber-700"
                      onClick={handleJoinClub}
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

              {/* Club stats */}
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
                      (clubData.book_details ? 1 : 0) ||
                      (clubData.book_club_history?.length || 0) +
                        (clubData.book_details ? 1 : 0) ||
                      0}
                  </div>
                  <div className="text-sm text-amber-700">Books Read</div>
                </div>
                <div className="rounded-lg bg-amber-50 p-3 text-center">
                  <div className="text-2xl font-bold text-amber-900">
                    {clubData.recent_posts?.length ||
                      clubData.posts?.length ||
                      0}
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
                        formatDate(clubData.created_on).split(' ')[2]
                        
                      : "N/A"}
                  </div>
                  <div className="text-sm text-amber-700">Founded</div>
                </div>
              </div>

              {/* Current book info if available */}
              {clubData.book_details && (
                <div>
                  <h2 className="mb-2 text-xl font-medium text-amber-900">
                    Currently Reading
                  </h2>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="flex-1">
                      <h3 className="font-medium text-amber-900">
                        {clubData.book_details.title}
                      </h3>
                      <p className="text-sm text-amber-800">
                        by{" "}
                        {Array.isArray(clubData.book_details.authors)
                          ? clubData.book_details.authors.join(", ")
                          : clubData.book_details.authors || "Unknown"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab navigation */}
        <Tabs
          defaultValue={activeTab}
          className="mb-8"
          onValueChange={setActiveTab}
        >
          <TabsList className="mb-6 grid w-full grid-cols-5 bg-amber-100">
            <TabsTrigger
              value="discussions"
              className="data-[state=active]:bg-amber-800 data-[state=active]:text-amber-50"
            >
              Discussions
            </TabsTrigger>
            <TabsTrigger
              value="reading-schedule"
              className="data-[state=active]:bg-amber-800 data-[state=active]:text-amber-50"
            >
              Reading Schedule
            </TabsTrigger>
            <TabsTrigger
              value="books"
              className="data-[state=active]:bg-amber-800 data-[state=active]:text-amber-50"
            >
              Books
            </TabsTrigger>
            <TabsTrigger
              value="members"
              className="data-[state=active]:bg-amber-800 data-[state=active]:text-amber-50"
            >
              Members
            </TabsTrigger>
            <TabsTrigger
              value="about"
              className="data-[state=active]:bg-amber-800 data-[state=active]:text-amber-50"
            >
              About
            </TabsTrigger>
          </TabsList>

          {/* Discussions Tab */}
          <TabsContent value="discussions" className="mt-0">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-2xl font-serif font-bold text-amber-900">
                    Discussions
                  </h2>
                  <Button
                    className="bg-amber-800 text-amber-50 hover:bg-amber-700"
                    disabled={!clubData.is_user_member}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    New Topic
                  </Button>
                </div>

                {clubData.recent_posts?.length > 0 ||
                clubData.posts?.length > 0 ? (
                  <div className="space-y-4">
                    {/* Use whichever posts array is provided by the API */}
                    {(clubData.recent_posts || clubData.posts || []).map(
                      (post: any) => (
                        <div
                          key={post.id}
                          className="rounded-lg border border-amber-200 bg-white p-4 transition-all hover:border-amber-300 hover:shadow-sm"
                        >
                          <div className="flex gap-4">
                            <div className="hidden sm:block">
                              <div className="h-10 w-10 rounded-full overflow-hidden bg-amber-200">
                                <div className="flex h-full w-full items-center justify-center bg-amber-200 text-amber-800">
                                  {(post.username || post.author || "User")
                                    .substring(0, 2)
                                    .toUpperCase()}
                                </div>
                              </div>
                            </div>
                            <div className="flex-1">
                              <Link
                                href={`/club/${clubId}/post/${post.id}`}
                                className="font-medium text-amber-900 hover:underline"
                              >
                                {post.title}
                              </Link>
                              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-amber-700">
                                <span>
                                  Started by{" "}
                                  {post.username || post.author || "User"}
                                </span>
                                <span className="hidden md:inline">•</span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(post.created_on || post.date)}
                                </span>
                                <span className="hidden md:inline">•</span>
                                <span className="flex items-center gap-1">
                                  <MessageSquare className="h-3 w-3" />
                                  {post.comment_count || post.replies || 0}{" "}
                                  replies
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end justify-between text-right">
                              <Badge
                                variant="outline"
                                className="bg-amber-50 text-amber-800 border-amber-200"
                              >
                                Active
                              </Badge>
                              <div className="text-xs text-amber-700">
                                {post.lastActivity || "recently"}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <div className="rounded-lg border border-amber-200 bg-white p-6 text-center">
                    <BookOpen className="mx-auto h-12 w-12 text-amber-300" />
                    <h3 className="mt-2 text-lg font-medium text-amber-900">
                      No Discussions Yet
                    </h3>
                    <p className="mt-1 text-amber-700">
                      Be the first to start a discussion in this book club!
                    </p>
                    {clubData.is_user_member && (
                      <Button className="mt-4 bg-amber-800 text-amber-50 hover:bg-amber-700">
                        <Plus className="mr-2 h-4 w-4" />
                        New Topic
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div>
                {/* Announcements */}
                <div className="rounded-lg border border-amber-200 bg-white p-6">
                  <h3 className="mb-4 text-lg font-medium text-amber-900">
                    Announcements
                  </h3>
                  {clubData.announcements?.length > 0 ? (
                    <>
                      {/* Only show first 3 announcements */}
                      {clubData.announcements
                        .slice(0, 3)
                        .map((announcement: any) => (
                          <div
                            key={announcement.id}
                            className="mb-4 rounded-lg bg-amber-50 p-4"
                          >
                            <h4 className="font-medium text-amber-900">
                              {announcement.title}
                            </h4>
                            <p className="mt-1 text-sm text-amber-800">
                              {announcement.content}
                            </p>
                            <p className="mt-2 text-xs text-amber-700">
                              {formatDate(
                                announcement.created_on || announcement.date
                              )}
                            </p>
                          </div>
                        ))}
                        
                      {/* Show view all button if more than 3 */}
                      {clubData.announcements.length > 3 && (
                        <div className="mt-4">
                          <Button
                            variant="outline"
                            className="w-full border-amber-300 text-amber-800"
                          >
                            View All Announcements
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-amber-700 text-center">
                      No announcements yet.
                    </p>
                  )}
                </div>

                {/* Members preview section */}
                <div className="mt-6 rounded-lg border border-amber-200 bg-white p-6">
                  <h3 className="mb-4 text-lg font-medium text-amber-900">
                    Active Members
                  </h3>

                  {/* Display a few members if we can find them */}
                  {clubData.members?.length > 0 ||
                  clubData.active_members?.length > 0 ? (
                    <div className="space-y-4">
                      {/* Use whichever members array is provided by the API */}
                      {(clubData.members || clubData.active_members || [])
                        .slice(0, 4)
                        .map((member: any) => (
                          <div
                            key={member.id}
                            className="flex items-center gap-3"
                          >
                            <div className="h-10 w-10 rounded-full overflow-hidden bg-amber-200">
                              {member.profile_pic || member.avatar ? (
                                <Image
                                  src={member.profile_pic || member.avatar}
                                  alt={
                                    member.username || member.name || "Member"
                                  }
                                  width={40}
                                  height={40}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-amber-200 text-amber-800">
                                  {(member.username || member.name || "User")
                                    .substring(0, 2)
                                    .toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-amber-900">
                                  {member.username || member.name || "Member"}
                                </span>
                                {(member.is_admin ||
                                  member.role === "Moderator") && (
                                  <Badge className="bg-amber-200 text-amber-800 hover:bg-amber-300">
                                    {member.role || "Mod"}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-amber-700">
                                Joined{" "}
                                {formatDate(
                                  member.join_date || member.joined || ""
                                )}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-amber-700 text-center">
                      Member information not available.
                    </p>
                  )}

                  {/* View all members button */}
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      className="w-full border-amber-300 text-amber-800"
                      onClick={() => setActiveTab("members")}
                    >
                      View All Members
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
