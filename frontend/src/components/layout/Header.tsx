// components/layout/Header.tsx
"use client";

import Link from "next/link";
import { BookOpen, SunMoon } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { Button, buttonVariants } from "@/components/ui/button";
import { useEffect, useState } from "react";

// A header prop for including in each function components to either it's an app header or landing page header
interface HeaderProps {
  variant?: "landing" | "app";
}

export function Header({ variant = "app" }: HeaderProps) {
  const { isSignedIn, signOut } = useAuth();
  const [theme, setTheme] = useState<"light" | "dark">("light");

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
              href="/community"
              className="text-sm font-medium text-amber-900 hover:text-amber-700"
            >
              Community
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
              <Link
                href="/profile"
                className="text-sm font-medium text-amber-900 hover:text-amber-700"
              >
                My Profile
              </Link>
              <Button
                onClick={() => signOut()}
                className="bg-amber-800 text-amber-50 hover:bg-amber-700"
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link
                href="/auth/sign-in"
                className="text-sm font-medium text-amber-900 hover:text-amber-700"
              >
                Log in
              </Link>
              <Link href="/auth/sign-up" className={buttonVariants({ variant: "search" })} >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}