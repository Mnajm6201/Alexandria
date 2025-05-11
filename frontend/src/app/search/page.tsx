"use client"
import Image from "next/image";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  PlusCircle,
  BookMarked,
  ChevronRight,
  ChevronLeft,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/Header";
import SearchBar from "@/components/ui/SearchBar";
import AddToShelfModal from "@/components/ui/shelves/AddToShelfModal";

// types for results
type Book = {
  type: "book";
  book_id: string;
  title: string;
  summary: string;
  year_published: number;
  cover_image: string | null;
  authors: string[];
  genres: string[];
};

type Author = {
  type: "author";
  author_id: string;
  name: string;
  biography: string | null;
  author_image: string | null;
};

type SearchItem = Book | Author;

export default function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const [results, setResults] = useState<SearchItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query) return;

    setIsLoading(true);
    setError(null);

    fetch(`http://127.0.0.1:8000/api/search-bar/?q=${encodeURIComponent(query)}&limit=20`)
      .then((res) => res.json())
      .then((data) => {
        const books = data.books || [];
        const authors = data.authors || [];
        setResults([...books, ...authors]);
      })
      .catch((err) => {
        console.error("Search error:", err);
        setError("Failed to load search results.");
      })
      .finally(() => setIsLoading(false));
  }, [query]);

  return (
    <div className="min-h-screen flex flex-col bg-amber-50">
      <Header variant="landing" />

      <main className="flex-1 container py-8 mx-auto px-8 md:px-6">
        <div className="mb-9">
          <SearchBar />
        </div>

        {/* Search Results Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-serif font-bold text-amber-900">
            Search Results for "{query}"
          </h1>
        </div>

        {isLoading && <p className="text-amber-700">Loading results...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {/* Results Grid */}
        {!isLoading && results.length === 0 ? ( // render no book found
          <div className="mb-8 rounded-lg border border-amber-200 bg-white p-6 flex flex-col items-center justify-center text-center">
            <h2 className="text-5xl font-serif font-bold text-amber-900 mb-2">404</h2>
            <h3 className="text-2xl font-bold text-amber-900 mb-2">Book Not Found</h3>
            <p className="text-amber-700 mb-2">
              The Library of Alexandria was once the center of the world's knowledge.
            </p>
            <p className="text-amber-700 mb-2">
              Seneca estimated it held nearly 700,000 <span className="italic">volumina</span>.
            </p>
            <p className="text-amber-700 mb-2">
              The fire that broke out in 298 AD destroyed the library... and all of its books.
            </p>
            <p className="text-amber-700 font-medium">
              Perhaps the book you're looking for can be found in its ashes?
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {results.map((item) => {
              if (item.type === "book") {
                return (
                  <div
                    key={`book-${item.book_id}`}
                    className="flex flex-col rounded-lg border border-amber-200 bg-white p-4 sm:flex-row sm:items-start sm:p-6"
                  >
                    <div className="mb-4 flex justify-center sm:mb-0 sm:mr-6">
                      <div className="h-[180px] w-[120px] overflow-hidden rounded-md border border-amber-200 bg-amber-100 shadow-md">
                        <Image
                          src={item.cover_image || "/placeholder.svg?height=180&width=120&text=Book"}
                          alt={item.title}
                          width={120}
                          height={180}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="mb-2 flex flex-col justify-between gap-2 sm:flex-row">
                        <div>
                          <Link
                            href={`/book/${item.book_id}`}
                            className="text-xl font-serif font-bold text-amber-900 hover:underline"
                          >
                            {item.title}
                          </Link>
                          <p className="text-amber-800 italic">
                            by {item.authors?.slice(0,3).join(", ") || "Unknown"} •{" "}
                            {item.year_published - 1 || "Year TBD"}
                          </p>
                        </div>
                      </div>

                      <p className="mb-3 text-amber-800 line-clamp-2 sm:line-clamp-3">
                        {item.summary || "Description coming soon..."}
                      </p>

                      <div className="mb-4 flex flex-wrap gap-2">
                        {item.genres?.slice(0, 3).map((genre, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="bg-amber-50 text-amber-800 border-amber-200"
                          >
                            {genre}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Link href={`/book/${item.book_id}`}>
                          <Button variant="ghost" size="lg" className="text-amber-800 hover:underline px-1">
                            View Book
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              }

              if (item.type === "author") {
                return (
                  <div
                    key={`author-${item.author_id}`}
                    className="flex flex-col rounded-lg border border-amber-200 bg-white p-4 sm:flex-row sm:items-start sm:p-6"
                  >
                    <div className="mb-4 flex justify-center sm:mb-0 sm:mr-6">
                      <div className="h-[120px] w-[120px] overflow-hidden rounded-full border border-amber-200 bg-amber-100 shadow-md">
                        <Image
                          src={item.author_image || "/placeholder.svg?height=120&width=120&text=Author"}
                          alt={item.name}
                          width={120}
                          height={120}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="mb-2">
                        <Link
                          href={`/author/${item.author_id}`}
                          className="text-xl font-serif font-bold text-amber-900 hover:underline"
                        >
                          {item.name}
                        </Link>
                      </div>

                      <p className="mb-4 text-amber-800 line-clamp-3">
                        {item.biography || "Biography coming soon..."}
                      </p>

                      <div className="flex-1">
                        <Link href={`/author/${item.author_id}`}>
                          <Button variant="ghost" size="lg" className="text-amber-800 px-0 hover:underline">
                            View Author
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              }

              return null;
            })}
          </div>
        )}
      </main>

      <footer className="w-full border-t border-amber-200 bg-amber-50 py-4">
        <div className="max-w-6xl mx-auto flex flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left px-4 md:px-6">
          <div className="flex items-center gap-2 justify-center md:justify-start">
            <BookOpen className="h-6 w-6 text-amber-800" />
            <span className="text-lg font-serif font-bold text-amber-900">Alexandria</span>
          </div>
          <p className="text-sm text-amber-700">&copy; {new Date().getFullYear()} Alexandria. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}