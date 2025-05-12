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
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    async function redirectToUserProfile() {
      try {
        if (!isLoaded) {
          setDebugInfo((prev) => ({ ...prev, isLoaded: false }));
          return;
        }

        setDebugInfo((prev) => ({ ...prev, isLoaded: true }));

        // If user is not logged in, redirect to login
        if (!user) {
          setDebugInfo((prev) => ({ ...prev, user: null }));
          router.push("/sign-in");
          return;
        }

        setDebugInfo((prev) => ({ ...prev, user: user.id }));

        // Try to get user ID from backend
        try {
          const token = jwtToken || (await fetchJWToken());

          if (!token) {
            console.error("No JWT token available");
            setDebugInfo((prev) => ({ ...prev, token: null }));
            router.push("/me");
            return;
          }

          setDebugInfo((prev) => ({ ...prev, token: "present" }));

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

          setDebugInfo((prev) => ({
            ...prev,
            responseStatus: response.status,
            responseOk: response.ok,
          }));

          if (response.ok) {
            // Log the raw response
            const responseText = await response.text();
            console.log("Raw profile response:", responseText);

            // Parse as JSON
            const data = JSON.parse(responseText);
            console.log("Parsed profile data:", data);

            setDebugInfo((prev) => ({
              ...prev,
              profileData: data,
              hasId: Boolean(data.id),
            }));

            if (data.id) {
              console.log(`Redirecting to profile/${data.id}`);
              router.push(`/profile/${data.id}`);
            } else {
              console.error("No ID found in profile data:", data);
              // Fall back to "me" route
              router.push("/profile/me");
            }
          } else {
            const errorText = await response.text();
            console.error(`Profile API error (${response.status}):`, errorText);
            router.push("/profile/me");
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
          setDebugInfo((prev) => ({ ...prev, error: String(error) }));
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
    <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center">
      <div className="text-amber-800 text-xl mb-4">Loading your profile...</div>

      {/* Debug info in development */}
      {process.env.NODE_ENV !== "production" && (
        <div className="mt-8 bg-gray-100 p-4 rounded-lg max-w-lg overflow-auto">
          <h3 className="font-bold mb-2">Debug Info:</h3>
          <pre className="text-xs">{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
