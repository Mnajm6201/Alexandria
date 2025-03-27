import { useAuth } from "@clerk/nextjs";
import { useState, useCallback } from "react";

export function useJWToken() {
  const { getToken } = useAuth();
  const [jwtToken, setJwtToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchJWToken = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const clerkToken = await getToken();

      if (!clerkToken) {
        setError("No Clerk token available");
        setIsLoading(false);
        return null;
      }

      const response = await fetch(
        "http://localhost:8000/api/auth/clerk/verify/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ session_token: clerkToken }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        setError(`Failed to get JWT token: ${errorText}`);
        setIsLoading(false);
        return null;
      }

      const data = await response.json();
      setJwtToken(data.access);
      setIsLoading(false);
      return data.access;
    } catch (error) {
      setError(`Error getting JWT Token: ${error.message}`);
      setIsLoading(false);
      return null;
    }
  }, [getToken]);

  return { jwtToken, fetchJWToken, isLoading, error };
}
