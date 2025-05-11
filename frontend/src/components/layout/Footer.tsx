// components/layout/Footer.jsx
import Link from "next/link";
import { BookOpen } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full border-t border-amber-200 bg-amber-50 py-6">
      <div className="max-w-6xl mx-auto flex flex-col items-center justify-between gap-4 md:flex-row px-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-amber-800" />
          <span className="text-lg font-serif font-bold text-amber-900">
            Alexandria
          </span>
        </div>
        <p className="text-center text-sm text-amber-700 md:text-left">
          &copy; {new Date().getFullYear()} Alexandria. All rights reserved.
        </p>
        <div className="flex gap-4">
          <Link
            href="#"
            className="text-sm text-amber-700 hover:text-amber-900"
          >
            Terms
          </Link>
          <Link
            href="#"
            className="text-sm text-amber-700 hover:text-amber-900"
          >
            Privacy
          </Link>
          <Link
            href="#"
            className="text-sm text-amber-700 hover:text-amber-900"
          >
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}
