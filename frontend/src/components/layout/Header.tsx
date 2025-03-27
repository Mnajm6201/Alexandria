// components/layout/Header.tsx
"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

// A header prop for including in each function components to either it's an app header or landing page header
interface HeaderProps {
  variant?: "landing" | "app";
}

export function Header({ variant = "app" }: HeaderProps) {
  const { isSignedIn, signOut } = useAuth();

  // variant to specify it's for landing page
  const isLanding = variant === "landing";

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

        {/* If we want to change the routing just make the href whever the page is need to route to
        for instance if for discovery page, just do /discovery              */}
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
              href="#community"
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
          // You can add application-specific navigation links here
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
          </nav>
        )}

        <div className="flex items-center gap-4">
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
              <Button className="bg-amber-800 text-amber-50 hover:bg-amber-700">
                Sign up
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
