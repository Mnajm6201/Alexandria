"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import axios, { AxiosError } from "axios";
import Cookies from "js-cookie";

export function AuthSynchronizer() {
  const { isSignedIn, getToken } = useAuth();

  useEffect(() => {
    console.log("Auth state changed:", { isSignedIn });

    if (isSignedIn) {
      console.log("User is signed in, synchronizing with backend");
      synchronizeWithBackend();
    } else {
      console.log("User is signed out, clearing cookies");
      Cookies.remove("access_token");
      Cookies.remove("refresh_token");
    }
  }, [isSignedIn]);

  async function synchronizeWithBackend(): Promise<void> {
    try {
      console.log("Starting backend synchronization...");

      const token = await getToken();
      console.log(
        "Got token:",
        token ? `${token.substring(0, 10)}...` : "No token"
      );

      if (!token) {
        console.log("No token available");
        return;
      }

      console.log("Sending token to backend...");
      try {
        const response = await axios.post(
          "http://localhost:8000/api/auth/clerk/verify/",
          { session_token: token }
        );

        console.log("Backend response:", response.data);

        Cookies.set("access_token", response.data.access, {
          expires: 1 / 24,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
        });

        Cookies.set("refresh_token", response.data.refresh, {
          expires: 1,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
        });

        console.log("Authentication synchronized with backend");
      } catch (error) {
        const axiosError = error as AxiosError;
        if (axiosError.response) {
          console.error(
            "Backend error:",
            axiosError.response.status,
            axiosError.response.data
          );
        } else {
          console.error("Network error:", axiosError.message);
        }
      }
    } catch (error) {
      const typedError = error as Error;
      console.error("General error:", typedError.message);
    }
  }

  return null;
}
