"use client";

import React, { useState, useEffect } from "react";
import { useJWToken } from "@/utils/getJWToken";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen, PlusCircle, Search, X } from "lucide-react";
import Image from "next/image";

// Type definitions
interface Book {
  book_id: string;
  title: string;
  authors: string[];
  cover_url?: string;
  year_published?: number;
  summary?: string;
}

interface BookDetails {
  id: number;
  book_id: string;
  title: string;
  authors: string[];
  year_published: number;
  summary?: string;
  cover_url?: string;
}

interface ClubBook {
  id: number;
  book: string | number;
  book_details: BookDetails;
}

interface BooksTabProps {
  clubData: any;
  clubId: string;
  isAdmin: boolean;
  onRefresh: () => void;
}

export function BooksTab({
  clubData,
  clubId,
  isAdmin,
  onRefresh,
}: BooksTabProps) {
  // State for books and UI
  const [clubBooks, setClubBooks] = useState<ClubBook[]>([]);
  const [currentBook, setCurrentBook] = useState<ClubBook | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // State for book addition
  const [isAddBookDialogOpen, setIsAddBookDialogOpen] =
    useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  // JWT for authentication
  const { jwtToken, fetchJWToken } = useJWToken();

  // Fetch JWT token on mount
  useEffect(() => {
    fetchJWToken();
  }, [fetchJWToken]);

  // Fetch club books whenever the JWT token or clubId changes
  useEffect(() => {
    if (jwtToken && clubId) {
      fetchClubBooks();
    }
  }, [jwtToken, clubId]);

  // Extract current book from club data if available
  useEffect(() => {
    if (clubData && clubData.book && clubData.book_details) {
      setCurrentBook({
        id: 0,
        book: clubData.book,
        book_details: clubData.book_details,
      });
    }
  }, [clubData]);

  // Function to fetch club reading history (which contains books)
  const fetchClubBooks = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = jwtToken || (await fetchJWToken());

      if (!token) {
        setError("Authentication required");
        setLoading(false);
        return;
      }

      const response = await fetch(
        `http://localhost:8000/api/bookclubs/clubs/${clubId}/history/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch club books: ${response.status}`);
      }

      const data = await response.json();
      setClubBooks(data);
    } catch (err) {
      console.error("Error fetching club books:", err);
      setError("Failed to load club books. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // handle book search
  // handle book search with improved cover image handling
  const handleBookSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setIsSearching(true);
      setError(null);

      const token = jwtToken || (await fetchJWToken());

      if (!token) {
        setError("Authentication required");
        setIsSearching(false);
        return;
      }

      const response = await fetch(
        `http://localhost:8000/api/search-bar/?q=${encodeURIComponent(
          searchQuery
        )}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Raw search API response:", data);

        if (data.books && data.books.length > 0) {
          const transformedResults = data.books.map((book) => {
            // Get book_id as string
            let bookIdValue = book.book_id
              ? String(book.book_id)
              : book.id
              ? String(book.id)
              : `unknown-${Math.random().toString(36).substring(2, 10)}`;

            // Process authors
            let authorArray = ["Unknown Author"];
            if (book.authors) {
              if (Array.isArray(book.authors)) {
                authorArray = book.authors.flat().filter(Boolean);
              } else if (typeof book.authors === "string") {
                authorArray = [book.authors];
              }
            }
            if (authorArray.length === 0) {
              authorArray = ["Unknown Author"];
            }

            // Extract cover URL - check multiple possible locations
            let coverUrl = null;

            // First check if cover_url is directly available
            if (book.cover_url) {
              coverUrl = book.cover_url;
            }
            // Then check primary_edition's cover
            else if (book.primary_edition && book.primary_edition.cover_image) {
              coverUrl = book.primary_edition.cover_image;
            }
            // Then look through editions for cover images
            else if (book.editions && book.editions.length > 0) {
              for (const edition of book.editions) {
                if (edition.cover_images && edition.cover_images.length > 0) {
                  // Find primary cover image if available
                  const primaryImage = edition.cover_images.find(
                    (img) => img.is_primary
                  );
                  if (primaryImage) {
                    coverUrl = primaryImage.image_url;
                    break;
                  } else if (edition.cover_images[0]) {
                    // Otherwise use the first one
                    coverUrl = edition.cover_images[0].image_url;
                    break;
                  }
                } else if (edition.cover_image) {
                  coverUrl = edition.cover_image;
                  break;
                }
              }
            }

            console.log(`Book "${book.title}" cover URL:`, coverUrl);

            return {
              book_id: bookIdValue,
              title: book.title || "Unknown Title",
              authors: authorArray,
              cover_url: coverUrl,
              year_published: book.year_published,
              summary: book.summary,
              // Also store page count if available
              page_count:
                book.page_count ||
                (book.primary_edition
                  ? book.primary_edition.page_count
                  : null) ||
                (book.editions && book.editions.length > 0
                  ? book.editions[0].page_count
                  : null),
            };
          });

          console.log("Transformed search results:", transformedResults);
          setSearchResults(transformedResults);
        } else {
          setSearchResults([]);
          setError("No books found matching your search.");
        }
      } else {
        throw new Error(`Search failed: ${response.status}`);
      }
    } catch (err) {
      console.error("Error searching books:", err);
      setError("Failed to search books. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  // Select a book
  const handleBookSelect = (book: Book) => {
    setSelectedBook(book);
    setSearchResults([]);
    setSearchQuery("");
  };

  // update the club's current book
  const handleAddBookToClub = async () => {
    if (!selectedBook) return;

    try {
      setError(null);

      const token = jwtToken || (await fetchJWToken());
      if (!token) {
        setError("Authentication required");
        return;
      }

      const bookIdValue = selectedBook.book_id;
      if (!bookIdValue) {
        setError(`Invalid book ID: ${bookIdValue}. Book ID is required.`);
        return;
      }

      const requestData = {
        book_id: bookIdValue,
        title: selectedBook.title,
      };

      const response = await fetch(
        `http://localhost:8000/api/bookclubs/clubs/${clubId}/update-book/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        }
      );

      const responseText = await response.text();

      try {
        const responseData = JSON.parse(responseText);

        if (responseData.success) {
          // Update current book with the response data
          setCurrentBook({
            id: 0,
            book: responseData.book_id,
            book_details: responseData.book_details,
          });

          // Close dialog and reset form
          setIsAddBookDialogOpen(false);
          setSelectedBook(null);
          setSearchQuery("");
          setSearchResults([]);

          // Refresh parent component
          if (typeof onRefresh === "function") {
            onRefresh(true);
          }
        } else if (responseData.error) {
          if (
            responseData.recommendations &&
            responseData.recommendations.length > 0
          ) {
            setError(responseData.message || responseData.error);

            // Transform recommendations into search results
            const recommendedBooks = responseData.recommendations.map(
              (book) => ({
                book_id: book.book_id,
                title: book.title,
                authors: book.authors,
                year_published: book.year_published,
                summary: book.summary || "",
                cover_url: book.cover_url || null,
                is_recommendation: true,
              })
            );

            setSearchResults(recommendedBooks);
            alert(
              "The selected book was not found in our database. We've suggested some alternative books you might consider instead."
            );
            return;
          } else {
            setError(responseData.error);
            return;
          }
        }
      } catch (e) {
        console.error("Failed to parse response as JSON", e);
        setError("Failed to process server response. Please try again.");
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to update club book: ${response.status}`);
      }
    } catch (err) {
      console.error("Error updating club book:", err);
      setError(
        err.message || "Failed to update club book. Please try again later."
      );
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="text-amber-800 p-4 text-center">
        Loading book information...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-serif font-bold text-amber-900">Books</h3>

        {/* Only show add book button for admins */}
        {isAdmin && (
          <Button
            onClick={() => setIsAddBookDialogOpen(true)}
            className="bg-amber-800 hover:bg-amber-700 text-amber-50"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Book to Club
          </Button>
        )}
      </div>

      {/* Current Book Section */}
      <div>
        <h4 className="text-lg font-medium text-amber-800 mb-3">
          Current Book
        </h4>

        {currentBook ? (
          <Card className="border-amber-300 bg-amber-50">
            <CardHeader>
              <div className="flex items-start">
                {/* Cover image display */}
                <div className="w-16 h-20 bg-amber-200 rounded overflow-hidden flex items-center justify-center mr-4">
                  {currentBook.book_details.cover_url ? (
                    <Image
                      src={currentBook.book_details.cover_url}
                      alt={currentBook.book_details.title}
                      width={64}
                      height={80}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <BookOpen className="h-8 w-8 text-amber-700" />
                  )}
                </div>

                <div>
                  <CardTitle className="text-amber-900">
                    {currentBook.book_details.title} (
                    {currentBook.book_details.year_published || "N/A"})
                  </CardTitle>
                  <div className="text-sm text-amber-700 mt-1">
                    by{" "}
                    {Array.isArray(currentBook.book_details.authors)
                      ? currentBook.book_details.authors.join(", ")
                      : currentBook.book_details.authors || "Unknown Author"}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-amber-800">
                {currentBook.book_details.summary ||
                  "No summary available for this book."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="text-amber-700 bg-amber-100 p-4 rounded-md">
            No book is currently selected for this club.
            {isAdmin && (
              <div className="mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddBookDialogOpen(true)}
                  className="border-amber-300 text-amber-800"
                >
                  <PlusCircle className="mr-1 h-4 w-4" />
                  Add Book
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Previously Read Books Section */}
      {clubBooks.length > 0 && (
        <div className="mt-8">
          <h4 className="text-lg font-medium text-amber-800 mb-3">
            Previously Read Books
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clubBooks.map((book) => (
              <Card key={book.id} className="border-amber-200 bg-amber-50">
                <CardHeader className="pb-2">
                  <div className="flex items-start">
                    {/* Cover image for history books */}
                    <div className="w-12 h-16 bg-amber-200 rounded overflow-hidden flex items-center justify-center mr-3">
                      {book.book_details.cover_url ? (
                        <Image
                          src={book.book_details.cover_url}
                          alt={book.book_details.title}
                          width={48}
                          height={64}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <BookOpen className="h-6 w-6 text-amber-700" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-amber-900 text-base">
                        {book.book_details.title} (
                        {book.book_details.year_published || "N/A"})
                      </CardTitle>
                      <div className="text-sm text-amber-700">
                        by {book.book_details.authors.join(", ")}
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Add Book Dialog */}
      <Dialog open={isAddBookDialogOpen} onOpenChange={setIsAddBookDialogOpen}>
        <DialogContent className="bg-amber-50">
          <DialogHeader>
            <DialogTitle className="text-amber-900">
              Add Book to Club
            </DialogTitle>
            <DialogDescription className="text-amber-700">
              Search for a book to add to your book club.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="mb-4 text-red-600 text-sm p-2 bg-red-50 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Book Selection */}
            <div>
              <Label htmlFor="book-search" className="text-amber-800">
                Search for a Book
              </Label>

              {selectedBook ? (
                <div className="mt-2 p-3 border border-amber-300 rounded-md flex items-center">
                  <div className="w-8 h-12 bg-amber-200 rounded overflow-hidden flex items-center justify-center mr-3">
                    {selectedBook.cover_url ? (
                      <Image
                        src={selectedBook.cover_url}
                        alt={selectedBook.title}
                        width={32}
                        height={48}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <BookOpen className="h-6 w-6 text-amber-700" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-amber-900">
                      {selectedBook.title}
                    </div>
                    <div className="text-xs text-amber-700">
                      {Array.isArray(selectedBook.authors)
                        ? selectedBook.authors.join(", ")
                        : typeof selectedBook.authors === "string"
                        ? selectedBook.authors
                        : "Unknown Author"}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto text-amber-700"
                    onClick={() => setSelectedBook(null)}
                  >
                    <X className="h-4 w-4" />
                    <span className="ml-1">Clear</span>
                  </Button>
                </div>
              ) : (
                <div className="mt-2 space-y-2">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-amber-600 h-4 w-4" />
                      <Input
                        id="book-search"
                        placeholder="Search by title or author"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 border-amber-300 bg-white"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleBookSearch();
                          }
                        }}
                      />
                    </div>
                    <Button
                      onClick={handleBookSearch}
                      disabled={isSearching || !searchQuery.trim()}
                      className="bg-amber-800 text-amber-50"
                    >
                      Search
                    </Button>
                  </div>

                  {searchResults.length > 0 && (
                    <div className="border border-amber-200 rounded-md max-h-60 overflow-y-auto bg-white">
                      {searchResults.map((book) => (
                        <div
                          key={book.book_id}
                          className="p-2 hover:bg-amber-100 cursor-pointer flex items-center"
                          onClick={() => handleBookSelect(book)}
                        >
                          <div className="w-6 h-9 bg-amber-200 rounded-sm overflow-hidden flex items-center justify-center mr-2">
                            {book.cover_url ? (
                              <Image
                                src={book.cover_url}
                                alt={book.title}
                                width={24}
                                height={36}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <BookOpen className="h-4 w-4 text-amber-700" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-amber-900">
                              {book.title}
                            </div>
                            <div className="text-xs text-amber-700">
                              {Array.isArray(book.authors)
                                ? book.authors.join(", ")
                                : typeof book.authors === "string"
                                ? book.authors
                                : "Unknown Author"}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddBookDialogOpen(false);
                  setSelectedBook(null);
                  setSearchResults([]);
                  setSearchQuery("");
                }}
                className="border-amber-300 text-amber-800"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddBookToClub}
                disabled={!selectedBook}
                className="bg-amber-800 text-amber-50"
              >
                Add to Club
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
