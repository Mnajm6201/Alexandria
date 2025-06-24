// components/layout/Header.tsx
"use client";

import Link from "next/link";
import { BookOpen, SunMoon, User } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { Button, buttonVariants } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useJWToken } from "@/utils/getJWToken";
import { useRouter } from "next/navigation";

import { motion } from "framer-motion";

// A header prop for including in each function components to either it's an app header or landing page header
interface HeaderProps {
  variant?: "landing" | "app";
}

export function Header({ variant = "app" }: HeaderProps) {
  const { isSignedIn, signOut } = useAuth();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const { jwtToken, fetchJWToken } = useJWToken();
  const router = useRouter();


  // variant to specify it's for landing page
  const isLanding = variant === "landing";

  // Effect to initialize theme from localStorage
  useEffect(() => {
    // Get theme from localStorage or use system preference
    const savedTheme = localStorage.getItem('theme') || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    setTheme(savedTheme as "light" | "dark");
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  // Fetch the user ID on component mount when user logs in
  useEffect(() => {
    const fetchUserId = async () => {
      if (!isSignedIn) return;

      try {
        const token = jwtToken || (await fetchJWToken());
        if (!token) return;

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
            setUserId(data.id.toString());
            console.log("User ID fetched:", data.id);
          }
        }
      } catch (error) {
        console.error("Error fetching user ID:", error);
      }
    };

    fetchUserId();
  }, [isSignedIn, jwtToken, fetchJWToken]);


  // Handling profile clicks
  const handleProfileClick = async (e: React.MouseEvent) => {
    if (userId) {
      // If we already have the user ID, navigate directly
      router.push(`/profile/${userId}`);
    } else {
      // Otherwise, fetch it first
      e.preventDefault();
      setLoading(true);

      try {
        const token = jwtToken || (await fetchJWToken());
        if (!token) {
          console.error("No token available");
          router.push("/auth/sign-in");
          return;
        }

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
            setUserId(data.id.toString());
            router.push(`/profile/${data.id}`);
          } else {
            console.error("User ID not found in profile data");
            router.push("/profile");
          }
        } else {
          console.error("Failed to fetch profile");
          router.push("/profile"); 
        }
      } catch (error) {
        console.error("Error navigating to profile:", error);
        router.push("/profile"); 
      } finally {
        setLoading(false);
      }
    }
  };



  // Toggle theme function
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-amber-200 bg-amber-50/80 backdrop-blur-sm">
      <div className="container mx-auto max-w-7xl flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-amber-800" />
          <Link
            href="/"
            className="text-xl font-serif font-bold text-amber-900"
          >
            Alexandria
          </Link>
        </div>

        {/* Navigation links */}
        {isLanding ? (
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="#features"
              className="text-sm font-medium text-amber-900 hover:text-amber-700"
            >
              Features
            </Link>
            <Link
              href="/discovery"
              className="text-sm font-medium text-amber-900 hover:text-amber-700"
            >
              Discover
            </Link>
            <Link
              href="/community"
              className="text-sm font-medium text-amber-900 hover:text-amber-700"
            >
              Community
            </Link>
            <Link
              href="#about"
              className="text-sm font-medium text-amber-900 hover:text-amber-700"
            >
              About
            </Link>
          </nav>
        ) : (
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/discovery"
              className="text-sm font-medium text-amber-900 hover:text-amber-700"
            >
              Discover
            </Link>
            <Link
              href="/journals"
              className="text-sm font-medium text-amber-900 hover:text-amber-700"
            >
              Journals
            </Link>
            <Link
              href="/club"
              className="text-sm font-medium text-amber-900 hover:text-amber-700"
            >
              Book Club
            </Link>
            <Link
              href="/shelves"
              className="text-sm font-medium text-amber-900 hover:text-amber-700"
            >
              Shelves
            </Link>
          </nav>
        )}

        <div className="flex items-center gap-4">
          {/* Theme toggle button */}
          <Button
            onClick={toggleTheme}
            variant="ghost"
            size="icon"
            className="rounded-full"
            aria-label="Toggle theme"
          >
            <SunMoon className="h-5 w-5 text-amber-800" />
          </Button>

          {/* Auth buttons */}
          {isSignedIn ? (
            <div className="flex items-center gap-4">
              <button
                onClick={handleProfileClick}
                className="flex items-center gap-1.5 text-sm font-medium text-amber-900 hover:text-amber-700 disabled:opacity-70"
                disabled={loading}
              >
                My Profile
              </button>
              <motion.div 
                    whileHover={{ scale: 1.07 }}
                    whileTap={{ scale: 0.9 }}  
                > 
                <Button
                  onClick={() => signOut()}
                  className="bg-amber-800 text-amber-50 hover:bg-amber-900 rounded-full"
                >
                  Sign Out
                </Button>
              </motion.div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link
                href="/auth/sign-in"
                className="text-sm font-medium text-amber-900 hover:text-amber-700"
              >
                Log in
              </Link>
              <Link
                href="/auth/sign-up"
                className={buttonVariants({ variant: "search" })}
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}