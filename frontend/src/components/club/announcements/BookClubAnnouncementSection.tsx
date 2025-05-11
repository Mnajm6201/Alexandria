"use client";

import { useState, useEffect } from "react";
import { AnnouncementList } from "./AnnouncementList";
import { useJWToken } from "@/utils/getJWToken";

interface BookClubAnnouncementSectionProps {
  clubId: number;
}

export function BookClubAnnouncementSection({
  clubId,
}: BookClubAnnouncementSectionProps) {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const { jwtToken, fetchJWToken } = useJWToken();

  useEffect(() => {
    fetchJWToken();
  }, [fetchJWToken]);

  // Check if the current user is an admin of the club
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const token = jwtToken || (await fetchJWToken());

        if (!token) {
          console.error("Authentication required");
          setIsLoading(false);
          return;
        }

        // Fetch club members to determine if user is admin
        const response = await fetch(
          `http://localhost:8000/api/bookclubs/clubs/${clubId}/members/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch club members: ${response.status}`);
        }

        const members = await response.json();
        // Check if we can directly get the current user's membership info
        // This depends on your API structure
        let userIsAdmin = false;

        // Check if any member is marked as the current user and is admin
        for (const member of members) {
          // Different ways the API might indicate current user
          const isCurrentUser =
            member.is_current_user === true ||
            member.is_self === true ||
            member.is_you === true;

          if (isCurrentUser) {
            console.log("Found current user:", member);
            userIsAdmin = member.is_admin === true;
            break;
          }
        }

        // Method 2: If Method 1 fails, check if we're the only member and the club is ours
        if (!userIsAdmin && members.length === 1) {
          // If there's only one member and we have access to the club,
          // we might be that member (especially if we created the club)
          const response2 = await fetch(
            `http://localhost:8000/api/bookclubs/clubs/${clubId}/`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (response2.ok) {
            const clubData = await response2.json();
            if (clubData.is_user_member === true) {
              // We're a member of a single-member club, likely we're the admin
              userIsAdmin = members[0].is_admin === true;
            }
          }
        }
        setIsAdmin(userIsAdmin);
        setIsLoading(false);
      } catch (err) {
        console.error("Error checking admin status:", err);
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [clubId, jwtToken, fetchJWToken]);

  if (isLoading) {
    return <div className="p-4 text-amber-800">Loading...</div>;
  }
  return <AnnouncementList clubId={clubId} isAdmin={isAdmin} />;
}
