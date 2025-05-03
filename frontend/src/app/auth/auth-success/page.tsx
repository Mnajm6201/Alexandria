"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

export default function AuthSuccessPage() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const setupAuthToken = async () => {
      if (!isLoaded || !user) return;

      try {
        // Get the session token from Clerk
        const sessionToken = await getToken();
        // Exchange it for your JWT token
        const response = await fetch(
          "http://localhost:8000/api/auth/clerk/verify/",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              session_token: sessionToken,
            }),
          }
        );

        const data = await response.json();

        // Store your tokens in cookies
        document.cookie = `access_token=${data.access}; path=/;`;
        document.cookie = `refresh_token=${data.refresh}; path=/;`;

        // Redirect based on whether user is new
        if (data.is_new_user) {
          router.push("/profile");
        } else {
          router.push("/discovery");
        }
      } catch (error) {
        console.error("Error setting up auth:", error);
        // Default redirect on error
        router.push("/discovery");
      } finally {
        setIsLoading(false);
      }
    };

    setupAuthToken();
  }, [isLoaded, user, getToken, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Setting up your account...</h1>
      <p>Please wait while we prepare your experience.</p>
    </div>
  );
}
