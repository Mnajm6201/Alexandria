"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useJWToken } from "@/utils/getJWToken";

export default function ProfileRedirect() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { jwtToken, fetchJWToken } = useJWToken();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function redirectToUserProfile() {
      try {
        if (!isLoaded) return;

        // If user is not logged in, redirect to login
        if (!user) {
          router.push("/sign-in");
          return;
        }

        // Try to get user ID from backend
        try {
          const token = jwtToken || (await fetchJWToken());

          if (!token) {
            console.error("No JWT token available");
            router.push("/me");
            return;
          }

          // Get user profile from API to get the numeric ID
          const response = await fetch(
            "http://localhost:8000/api/auth/profile/",
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            if (data.id) {
              router.push(`/profile/${data.id}`);
            } else {
              // Fall back to "me" route
              router.push("/profile/me");
            }
          } else {
            router.push("/profile/me");
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
          // Use "me" as fallback
          router.push("/profile/me");
        }
      } finally {
        setIsLoading(false);
      }
    }

    redirectToUserProfile();
  }, [router, user, isLoaded, jwtToken, fetchJWToken]);

  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center">
      <div className="text-amber-800 text-xl">Loading your profile...</div>
    </div>
  );
}
