// app/club/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import React from "react";
import Link from "next/link";
import Image from "next/image";

// Icons
import { ChevronRight} from "lucide-react";

// UI components
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Token checks (cookie purpose)
import { useJWToken } from "@/utils/getJWToken";

// Components imports
import { ClubHeader } from "@/components/club/ClubHeader";
import { DiscussionsTab } from "@/components/club/discussion/DiscussionsTab";
import { ReadingScheduleTab } from "@/components/club/schedule/ReadingScheduleTab";
import { BooksTab } from "@/components/club/books/BooksTab";
import { MembersTab } from "@/components/club/members/MembersTab";
import { AboutTab } from "@/components/club/about/AboutTab";
import { BookClubAnnouncementSection } from "@/components/club/announcements/BookClubAnnouncementSection";

// Routing pages import
import { useRouter } from "next/navigation";

export default function BookClubDetailPage({
  params,
}: {
  params: { id: string };
}) {
  // Unwrap params
  const router = useRouter();
  const unwrappedParams = React.use(params);
  const clubId = unwrappedParams.id;

  const [clubData, setClubData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("announcements"); // Set default to announcements
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const { jwtToken, fetchJWToken } = useJWToken();

  // Fetch JWT token on mount
  useEffect(() => {
    fetchJWToken();
    
  }, [fetchJWToken]);


  // Function to fetch club details
  const fetchClubDetails = async (forceRefresh = false) => {
    try {
      if (!clubId) return;

      if (forceRefresh) {
        console.log("FORCE REFRESHING club details...");
      }

      const token = jwtToken || (await fetchJWToken());

      if (!token) {
        setError("Authentication required");
        setLoading(false);
        return;
      }

      // Add cache-busting parameter when forcing refresh
      const cacheBuster = forceRefresh ? `?t=${new Date().getTime()}` : "";

      // Fetch club details
      const response = await fetch(
        `http://localhost:8000/api/bookclubs/clubs/${clubId}/${cacheBuster}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          cache: forceRefresh ? "no-store" : "default",
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch club details: ${response.status}`);
      }

      const data = await response.json();
      console.log("data:", data)
      // Check if book changed from previous data
      if (clubData && clubData.book !== data.book) {
        console.log(
          `Book changed! Previous: ${clubData.book}, New: ${data.book}`
        );
      }

      setClubData(data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching club details:", err);
      setError("Failed to load club details. Please try again later.");
      setLoading(false);
    }
  };

  // Fetch club details
  useEffect(() => {
    if (jwtToken) {
      fetchClubDetails();
    }
  }, [jwtToken, clubId]);

  const handleTabChange = (value) => {
    setActiveTab(value);

    // If switching to the books tab, force a refresh of club data
    if (value === "books") {
      console.log("Switching to Books tab - forcing refresh of club data");
      fetchClubDetails(true);
    }
  };

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

      // Refresh club details
      fetchClubDetails();
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
      const data = await response.json();

      // Checking if the club was deleted
      if (data.message && data.message.includes("deleted")) {
        router.push("/club");
      } else {
        // Refresh club details
        fetchClubDetails();
      }
    } catch (err) {
      console.error("Error leaving club:", err);
    } finally {
      setIsLeaving(false);
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

  let isAdmin = false;
  if (clubData && clubData.is_user_member && clubData.members) {

    // Try to detect if user is admin by checking if any of the member records
    isAdmin = clubData.members.some((member) => {
      const isCurrentUserRecord =
        member.is_current_user === true ||
        (clubData.current_user_id &&
          member.user === clubData.current_user_id) ||
        (clubData.members.length === 1 && clubData.is_user_member === true);

      const isCurrentUserAdmin =
        isCurrentUserRecord && member.is_admin === true;

      return isCurrentUserAdmin;
    });
  }

  return (
    <div className="min-h-screen bg-amber-50">
      <main className="max-w-6xl mx-auto px-4 py-2">
        {/* Breadcrumb */}
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
        <ClubHeader
          clubData={clubData}
          isJoining={isJoining}
          isLeaving={isLeaving}
          onJoin={handleJoinClub}
          onLeave={handleLeaveClub}
        />

        {/* Tab navigation */}
        <Tabs
          defaultValue={activeTab}
          className="mb-8"
          onValueChange={handleTabChange}
        >
          <TabsList className="mb-6 grid w-full grid-cols-6 bg-amber-100">
            <TabsTrigger
              value="announcements"
              className="data-[state=active]:bg-amber-800 data-[state=active]:text-amber-50"
            >
              Announcements
            </TabsTrigger>
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

          {/* Announcements Tab */}
          <TabsContent value="announcements" className="mt-0">
            <BookClubAnnouncementSection clubId={parseInt(clubId)} />
          </TabsContent>

          {/* Discussions Tab */}
          <TabsContent value="discussions" className="mt-0">
            <DiscussionsTab
              clubData={clubData}
              clubId={clubId}
              onRefresh={fetchClubDetails}
            />
          </TabsContent>

          {/* Reading Schedule Tab */}
          <TabsContent value="reading-schedule" className="mt-0">
            <ReadingScheduleTab
              clubData={clubData}
              clubId={clubId}
              isAdmin={isAdmin}
              onRefresh={fetchClubDetails}
            />
          </TabsContent>

          {/* Books Tab */}
          <TabsContent value="books" className="mt-0">
            <BooksTab
              clubData={clubData}
              clubId={clubId}
              isAdmin={isAdmin}
              onRefresh={fetchClubDetails}
            />
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="mt-0">
            <MembersTab
              clubData={clubData}
              clubId={clubId}
              isAdmin={isAdmin}
              onRefresh={fetchClubDetails}
            />
          </TabsContent>

          {/* About Tab */}
          <TabsContent value="about" className="mt-0">
            <AboutTab
              clubData={clubData}
              isAdmin={isAdmin}
              onUpdateClub={fetchClubDetails}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
