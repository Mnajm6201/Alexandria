import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  Search,
  Filter,
  ChevronDown,
  Star,
  StarHalf,
  PlusCircle,
  BookMarked,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/Header";

export default function SearchResults() {
  // Mock search results for "The Great Gatsby"
  const searchResults = [
    {
      id: 1,
      title: "The Great Gatsby",
      author: "F. Scott Fitzgerald",
      cover: "/placeholder.svg?height=180&width=120&text=Gatsby",
      rating: 4.3,
      ratings: "3.8M",
      year: 1925,
      description:
        "The Great Gatsby is a 1925 novel by American writer F. Scott Fitzgerald. Set in the Jazz Age on Long Island, the novel depicts first-person narrator Nick Carraway's interactions with mysterious millionaire Jay Gatsby.",
      genres: ["Classic", "Fiction", "Literature"],
    },
    {
      id: 2,
      title: "The Great Gatsby: A Graphic Novel Adaptation",
      author: "F. Scott Fitzgerald, K. Woodman-Maynard (Adapter)",
      cover: "/placeholder.svg?height=180&width=120&text=Graphic",
      rating: 4.1,
      ratings: "12K",
      year: 2021,
      description:
        "A sumptuously illustrated adaptation of F. Scott Fitzgerald's beloved novel of the 1920s, in a vivid and accessible new format.",
      genres: ["Graphic Novel", "Adaptation", "Fiction"],
    },
    {
      id: 3,
      title: "The Great Gatsby and Other Stories",
      author: "F. Scott Fitzgerald",
      cover: "/placeholder.svg?height=180&width=120&text=Stories",
      rating: 4.2,
      ratings: "156K",
      year: 2021,
      description:
        "This beautiful collectible edition presents Fitzgerald's classic novel along with a selection of his short stories centered on similar themes.",
      genres: ["Classic", "Short Stories", "Fiction"],
    },
    {
      id: 4,
      title: "So We Read On: How The Great Gatsby Came to Be",
      author: "Maureen Corrigan",
      cover: "/placeholder.svg?height=180&width=120&text=SoWeRead",
      rating: 3.9,
      ratings: "2.3K",
      year: 2014,
      description:
        'The "Fresh Air" book critic investigates the enduring power of The Great Gatsby and how it became an American classic.',
      genres: ["Literary Criticism", "Nonfiction", "Biography"],
    },
    {
      id: 5,
      title: "Gatsby: The Definitive Guide",
      author: "Preston So",
      cover: "/placeholder.svg?height=180&width=120&text=GatsbyDev",
      rating: 4.5,
      ratings: "342",
      year: 2021,
      description:
        "Gatsby: The Definitive Guide shows you how to use this popular React-based framework to build static websites that do a lot more than you think.",
      genres: ["Programming", "Web Development", "Technical"],
    },
  ];

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Header */}
        <Header variant="landing"/>


      <main className="container py-8 mx-auto px-8 md:px-6">
        {/* Search Bar */}
        <div className="mb-8 rounded-lg border border-amber-200 bg-white p-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-600" />
              <Input
                type="text"
                placeholder="Search books, authors, ISBN..."
                className="pl-9 border-amber-300 bg-amber-50 focus-visible:ring-amber-600"
                defaultValue="The Great Gatsby"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="border-amber-300 text-amber-800"
              >
                <Filter className="mr-2 h-4 w-4" />
                Filters
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
              <Button className="bg-amber-800 text-amber-50 hover:bg-amber-700">
                Search
              </Button>
            </div>
          </div>

          {/* Active Filters */}
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-300">
              Books
              <button className="ml-1 rounded-full hover:bg-amber-200 p-0.5">
                ×
              </button>
            </Badge>
            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-300">
              Fiction
              <button className="ml-1 rounded-full hover:bg-amber-200 p-0.5">
                ×
              </button>
            </Badge>
            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-300">
              English
              <button className="ml-1 rounded-full hover:bg-amber-200 p-0.5">
                ×
              </button>
            </Badge>
            <button className="text-xs text-amber-700 hover:text-amber-900 hover:underline">
              Clear All
            </button>
          </div>
        </div>

        {/* Search Results */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-serif font-bold text-amber-900">
            Search Results for "The Great Gatsby"
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-amber-700">Sort by:</span>
            <select className="rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-sm text-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-600">
              <option>Relevance</option>
              <option>Popularity</option>
              <option>Rating</option>
              <option>Date Published</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {searchResults.map((book) => (
            <div
              key={book.id}
              className="flex flex-col rounded-lg border border-amber-200 bg-white p-4 sm:flex-row sm:items-start sm:p-6"
            >
              <div className="mb-4 flex justify-center sm:mb-0 sm:mr-6">
                <div className="h-[180px] w-[120px] overflow-hidden rounded-md border border-amber-200 bg-amber-100 shadow-md">
                  <Image
                    src={book.cover || "/placeholder.svg"}
                    alt={book.title}
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
                      href="#"
                      className="text-xl font-serif font-bold text-amber-900 hover:underline"
                    >
                      {book.title}
                    </Link>
                    <p className="text-amber-800">
                      by {book.author} • {book.year}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="flex">
                      {Array.from({ length: Math.floor(book.rating) }).map(
                        (_, i) => (
                          <Star
                            key={i}
                            className="h-4 w-4 fill-amber-500 text-amber-500"
                          />
                        )
                      )}
                      {book.rating % 1 >= 0.5 && (
                        <StarHalf className="h-4 w-4 fill-amber-500 text-amber-500" />
                      )}
                    </div>
                    <span className="text-sm text-amber-700">
                      {book.rating} ({book.ratings})
                    </span>
                  </div>
                </div>

                <p className="mb-3 text-amber-800 line-clamp-2 sm:line-clamp-3">
                  {book.description}
                </p>

                <div className="mb-4 flex flex-wrap gap-2">
                  {book.genres.map((genre, i) => (
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
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-amber-300 text-amber-800"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Want to Read
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-amber-300 text-amber-800"
                  >
                    <BookMarked className="mr-2 h-4 w-4" />
                    Add to Shelf
                  </Button>
                  <Button variant="ghost" size="sm" className="text-amber-800">
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="mt-8 flex items-center justify-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 border-amber-300"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous page</span>
          </Button>
          {[1, 2, 3, 4, 5].map((page) => (
            <Button
              key={page}
              variant={page === 1 ? "default" : "outline"}
              size="sm"
              className={
                page === 1
                  ? "bg-amber-800 text-amber-50 hover:bg-amber-700"
                  : "border-amber-300 text-amber-800"
              }
            >
              {page}
            </Button>
          ))}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 border-amber-300"
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next page</span>
          </Button>
        </div>

        {/* Related Searches */}
        <div className="mt-12 rounded-lg border border-amber-200 bg-white p-6">
          <h2 className="mb-4 text-xl font-serif font-bold text-amber-900">
            Related Searches
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="#"
              className="rounded-lg bg-amber-100 px-3 py-1.5 text-sm text-amber-800 hover:bg-amber-200"
            >
              F. Scott Fitzgerald books
            </Link>
            <Link
              href="#"
              className="rounded-lg bg-amber-100 px-3 py-1.5 text-sm text-amber-800 hover:bg-amber-200"
            >
              Classic American literature
            </Link>
            <Link
              href="#"
              className="rounded-lg bg-amber-100 px-3 py-1.5 text-sm text-amber-800 hover:bg-amber-200"
            >
              1920s fiction
            </Link>
            <Link
              href="#"
              className="rounded-lg bg-amber-100 px-3 py-1.5 text-sm text-amber-800 hover:bg-amber-200"
            >
              Jazz Age novels
            </Link>
            <Link
              href="#"
              className="rounded-lg bg-amber-100 px-3 py-1.5 text-sm text-amber-800 hover:bg-amber-200"
            >
              Books like The Great Gatsby
            </Link>
          </div>
        </div>
      </main>

      <footer className="w-full border-t border-amber-200 bg-amber-50 py-6">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row px-4 md:px-6">
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
    </div>
  );
}
