// components/layout/Header.tsx
"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";

export function Header() {
  const { isSignedIn, signOut } = useAuth();

  return (
    <header className="flex justify-between items-center p-4 border-b">
      <div className="flex items-center">
        <Link href="/" className="text-xl font-bold">
          Alexandria
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {isSignedIn ? (
          <div className="flex items-center gap-4">
            <Link href="/profile" className="text-gray-700 hover:text-blue-600">
              My Profile
            </Link>
            <button
              onClick={() => signOut()}
              className="px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Link
              href="/auth/sign-in"
              className="text-gray-700 hover:text-blue-600"
            >
              Sign In
            </Link>
            <Link
              href="/auth/sign-up"
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
