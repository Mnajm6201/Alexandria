"use client";

import { useState, useEffect } from "react";
import { HomeIcon, Compass, BookmarkIcon, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import SearchBar from "@/components/ui/SearchBar";
import ShelfComponent from "@/components/ui/shelves/ShelfComponent";
import { useRouter } from "next/navigation";
import { useJWToken } from "@/utils/getJWToken";
import { Header } from "@/components/layout/Header";

// Fallback to static data if API fails
import {
  topRated,
  topRomance,
  topFiction,
} from "@/components/ui/book_details/StaticCurated";

// match the interfaces used in ShelfComponent
interface Edition {
  id: string;
  edition_id: number;
  isbn: string;
  cover_image?: string;
  authors?: Array<{ id: number; name: string }>;
  title?: string;
}

interface FeaturedShelf {
  id: number;
  display_title: string;
  description: string;
  display_type: string;
  books: Array<{
    id: number;
    isbn: string;
    title: string;
    cover_image: string;
    authors: Array<{
      id: number;
      name: string;
    }>;
  }>;
}

// Convert API book data to Edition format for ShelfComponent
const mapBooksToEditions = (books: any[]): Edition[] => {
  if (!books || !Array.isArray(books)) {
    return [];
  }
  return books.map((book) => ({
    id: book.id.toString(),
    edition_id: book.id,
    isbn: book.isbn || "",
    cover_image: book.cover_image,
    title: book.title,
    authors: book.authors || [],
  }));
};

// Convert static items to Edition format
const mapStaticToEditions = (items: any[]): Edition[] => {
  return items.map((item) => ({
    id: item.id,
    edition_id: Number.parseInt(item.id),
    isbn: item.isbn || "",
    cover_image: item.cover_image,
  }));
};

export default function DiscoveryPage() {
  const [featuredShelves, setFeaturedShelves] = useState<FeaturedShelf[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { jwtToken, fetchJWToken } = useJWToken();

  useEffect(() => {
    async function fetchFeaturedShelves() {
      try {
        setLoading(true);
        setError(null);

        // Try to get token
        let token = jwtToken || (await fetchJWToken().catch(() => null));

        // If couldn't get a token through the normal flow,
        // check if there's one directly in the cookies
        if (!token) {
          // Direct access to cookies as a backup
          const cookies = document.cookie.split(";").reduce((acc, cookie) => {
            const [key, value] = cookie.trim().split("=");
            acc[key] = value;
            return acc;
          }, {} as Record<string, string>);

          token = cookies.access_token;
        }

        if (!token) {
          setError("Authentication required to view featured content");
          setLoading(false);
          return;
        }

        const response = await fetch(
          "http://localhost:8000/api/discovery/featured-shelves/",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch featured shelves: ${response.status}`
          );
        }

        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
          setFeaturedShelves(data);
        } else {
          setError("No featured shelves found");
        }
      } catch (err) {
        setError(
          "Failed to load featured content. Showing fallback recommendations."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchFeaturedShelves();
  }, [jwtToken, fetchJWToken]);

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{
        background: `linear-gradient(to bottom, var(--background), var(--background))`,
        backgroundImage: `
        radial-gradient(circle at 20% 35%, var(--primary) 0%, transparent 0.5%),
        radial-gradient(circle at 75% 44%, var(--primary) 0%, transparent 0.7%),
        radial-gradient(circle at 46% 56%, var(--primary) 0%, transparent 0.4%),
        radial-gradient(circle at 35% 82%, var(--primary) 0%, transparent 0.6%),
        radial-gradient(circle at 80% 15%, var(--primary) 0%, transparent 0.5%),
        radial-gradient(circle at 95% 65%, var(--primary) 0%, transparent 0.3%),
        radial-gradient(circle at 10% 90%, var(--primary) 0%, transparent 0.4%),
        radial-gradient(circle at 85% 75%, var(--primary) 0%, transparent 0.5%)
      `,
        backgroundBlendMode: "normal, color-burn",
        backgroundSize: "100% 100%, 200% 200%",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Use the shared Header component */}
      <Header variant="app" />

      <main className="flex-grow overflow-auto">
        {/* Hero section with creative design */}
        <div className="relative overflow-hidden">
          {/* Decorative top wave */}
          <div className="absolute top-0 left-0 w-full overflow-hidden leading-none">
            <svg
              className="relative block w-full h-12 md:h-24"
              data-name="Layer 1"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 1200 120"
              preserveAspectRatio="none"
              style={{ fill: "var(--primary)", opacity: 0.1 }}
            >
              <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"></path>
            </svg>
          </div>

          <div className="container mx-auto px-4 pt-16 pb-8 relative z-10">
            {/* Creative search experience */}
            <div className="max-w-3xl mx-auto mb-16 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] opacity-10 rounded-xl transform rotate-1"></div>
              <div className="absolute inset-0 bg-gradient-to-l from-[var(--primary)] to-[var(--accent)] opacity-10 rounded-xl transform -rotate-1"></div>
              <div
                className="relative bg-[var(--card)] p-6 rounded-xl shadow-lg border border-[var(--border)]"
                style={{
                  boxShadow: "0 10px 30px -15px var(--primary)",
                }}
              >
                <h2 className="text-2xl font-bold text-[var(--card-foreground)] mb-4 text-center">
                  Discover Your Next Great Read
                </h2>
                <SearchBar />
              </div>
            </div>

            {/* Banner section with more compact design */}
            <section className="relative mb-12">
              <div
                className="relative overflow-hidden rounded-lg shadow-md border border-[var(--border)]"
                style={{
                  boxShadow: "0 10px 25px -15px var(--primary)",
                }}
              >
                {/* More compact background */}
                <div className="aspect-[21/9] md:aspect-[21/5] bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] relative overflow-hidden">
                  {/* Subtle animated background pattern */}
                  <div
                    className="absolute inset-0 opacity-70"
                    style={{
                      backgroundImage: `
          radial-gradient(circle at 20% 35%, rgba(255,255,255,0.2) 0%, transparent 20%),
          radial-gradient(circle at 75% 44%, rgba(255,255,255,0.15) 0%, transparent 15%)
        `,
                      animation: "pulse 15s infinite alternate",
                    }}
                  ></div>

                  {/* Simplified book elements */}
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-[15%] right-[10%] w-16 h-24 bg-white/20 rounded-md transform rotate-6 backdrop-blur-sm"></div>
                    <div className="absolute bottom-[15%] right-[25%] w-14 h-20 bg-white/15 rounded-md transform -rotate-3 backdrop-blur-sm"></div>
                  </div>

                  {/* Content with better alignment */}
                  <div className="absolute inset-0 flex items-center">
                    <div className="container mx-auto px-6">
                      <div className="max-w-md backdrop-blur-sm bg-black/10 p-4 md:p-6 rounded-lg ml-0 md:ml-8">
                        <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white">
                          Summer Reading Collection
                        </h2>
                        <p className="text-white/90 mb-3 text-sm md:text-base">
                          Dive into our curated list of beach reads and summer
                          adventures
                        </p>
                        <Button
                          size="sm"
                          className="bg-white text-[var(--primary)] hover:bg-white/90"
                        >
                          Explore Collection
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Loading state with creative styling */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full border-4 border-[var(--accent)] opacity-30"></div>
                  <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-t-[var(--primary)] animate-spin"></div>
                </div>
                <p className="mt-6 text-[var(--card-foreground)] font-medium">
                  Discovering books for you...
                </p>
              </div>
            )}

            {/* Dynamic featured shelves with creative styling */}
            {!loading &&
              !error &&
              featuredShelves.length > 0 &&
              featuredShelves.map((shelf) => (
                <ShelfComponent
                  key={shelf.id}
                  id={shelf.id.toString()}
                  name={shelf.display_title}
                  description={shelf.description}
                  is_private={false}
                  editions={mapBooksToEditions(shelf.books)}
                  isOwner={false}
                />
              ))}

            {/* Fallback static content with creative styling */}
            {!loading && (error || featuredShelves.length === 0) && (
              <>
                <ShelfComponent
                  id="static-1"
                  name="Top Rated this Week"
                  description="Highly rated books that readers are loving right now"
                  is_private={false}
                  editions={mapStaticToEditions(topRated)}
                  isOwner={false}
                />

                <ShelfComponent
                  id="static-2"
                  name="Popular in Fiction"
                  description="Trending fiction titles across all genres"
                  is_private={false}
                  editions={mapStaticToEditions(topFiction)}
                  isOwner={false}
                />

                <ShelfComponent
                  id="static-3"
                  name="Popular in Romance"
                  description="Love stories that are capturing readers' hearts"
                  is_private={false}
                  editions={mapStaticToEditions(topRomance)}
                  isOwner={false}
                />
              </>
            )}
          </div>
        </div>
      </main>

      {/* Mobile footer navigation */}
      <footer className="sticky bottom-0 bg-[var(--card)] border-t border-[var(--border)] py-2 md:hidden">
        <nav className="flex justify-around">
          <Button variant="ghost" size="icon">
            <HomeIcon className="h-6 w-6" />
          </Button>
          <Button variant="ghost" size="icon" className="text-[var(--primary)]">
            <Compass className="h-6 w-6" />
          </Button>
          <Button variant="ghost" size="icon">
            <BookmarkIcon className="h-6 w-6" />
          </Button>
          <Button variant="ghost" size="icon">
            <User className="h-6 w-6" />
          </Button>
        </nav>
      </footer>

      <style jsx global>{`
        @keyframes pulse {
          0% {
            opacity: 0.5;
            background-position: 0% 0%;
          }
          50% {
            opacity: 0.7;
            background-position: 100% 100%;
          }
          100% {
            opacity: 0.5;
            background-position: 0% 0%;
          }
        }
      `}</style>
    </div>
  );
}
