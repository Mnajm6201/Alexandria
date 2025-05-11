"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "../ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { useJWToken } from "@/utils/getJWToken";
import { X, Search, BookOpen, Upload, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface Book {
  book_id: number;
  title: string;
  authors: string[];
  cover_url?: string;
}

interface CreateBookClubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateBookClubModal({
  isOpen,
  onClose,
}: CreateBookClubModalProps) {
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [step, setStep] = useState<number>(1); // 1: Club details, 2: Book selection
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Image upload related states
  const [clubImage, setClubImage] = useState<File | null>(null);
  const [clubImagePreview, setClubImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { jwtToken, fetchJWToken } = useJWToken();
  const router = useRouter();

  useEffect(() => {
    fetchJWToken();
  }, [fetchJWToken]);

  // Reset form when modal is opened
  useEffect(() => {
    if (isOpen) {
      setName("");
      setDescription("");
      setIsPrivate(false);
      setSelectedBook(null);
      setSearchQuery("");
      setSearchResults([]);
      setStep(1);
      setError(null);
      setClubImage(null);
      setClubImagePreview(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setIsSearching(true);
      const token = jwtToken || (await fetchJWToken());

      if (!token) {
        setError("Authentication required");
        setIsSearching(false);
        return;
      }

      const response = await fetch(
        `http://localhost:8000/api/search/books?q=${searchQuery}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (err) {
      console.error("Error searching books:", err);
      setError("Failed to search books");
    } finally {
      setIsSearching(false);
    }
  };

  const handleBookSelect = (book: Book) => {
    setSelectedBook(book);
    setSearchResults([]);
    setSearchQuery("");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type and size
    const validTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!validTypes.includes(file.type)) {
      setError("Please upload a valid image file (JPEG, PNG, or GIF)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      setError("Image size should be less than 5MB");
      return;
    }

    setClubImage(file);
    const imageUrl = URL.createObjectURL(file);
    setClubImagePreview(imageUrl);
    setError(null);
  };

  const handleRemoveImage = () => {
    setClubImage(null);
    setClubImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSubmit = async () => {
    // Validate form
    if (!name.trim()) {
      setError("Club name is required");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const token = jwtToken || (await fetchJWToken());

      if (!token) {
        setError("Authentication required");
        setIsSubmitting(false);
        return;
      }

      const clubData = {
        name,
        club_desc: description,
        is_private: isPrivate,
        book: selectedBook?.book_id || null,
      };

      const response = await fetch(
        "http://localhost:8000/api/bookclubs/clubs/create/",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(clubData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create book club");
      }

      const createdClub = await response.json();

      // If we have a club image, upload it after club creation
      if (clubImage && createdClub.id) {
        try {
          const formData = new FormData();
          formData.append("club_image", clubImage);

          const imageResponse = await fetch(
            `http://localhost:8000/api/bookclubs/clubs/${createdClub.id}/update-image/`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
              },
              body: formData,
            }
          );

          if (!imageResponse.ok) {
            console.error("Failed to upload club image, but club was created");
          }
        } catch (imageErr) {
          console.error("Error uploading club image:", imageErr);
        }
      }

      // Close modal and navigate to the new club
      onClose();
      router.push(`/club/${createdClub.id}`);
    } catch (err) {
      console.error("Error creating book club:", err);
      setError(
        err instanceof Error ? err.message : "Failed to create book club"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-2xl rounded-lg bg-amber-50 p-6 shadow-lg">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-amber-700 hover:text-amber-900"
        >
          <X className="h-6 w-6" />
        </button>

        <h2 className="mb-6 text-2xl font-serif font-bold text-amber-900">
          {step === 1 ? "Create New Book Club" : "Select a Book (Optional)"}
        </h2>

        {error && (
          <div className="mb-4 rounded-md bg-red-100 p-3 text-red-700">
            {error}
          </div>
        )}

        {step === 1 ? (
          // Step 1: Club Details
          <div className="space-y-4">
            <div>
              <Label htmlFor="club-name" className="text-amber-800">
                Club Name *
              </Label>
              <Input
                id="club-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border-amber-300 bg-white focus-visible:ring-amber-600"
                placeholder="Enter a name for your book club"
                required
              />
            </div>

            <div>
              <Label htmlFor="club-description" className="text-amber-800">
                Description
              </Label>
              <Textarea
                id="club-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="border-amber-300 bg-white focus-visible:ring-amber-600"
                placeholder="Describe what your club is about..."
                rows={4}
              />
            </div>

            {/* Club Image Upload */}
            <div>
              <Label htmlFor="club-image" className="text-amber-800">
                Club Image
              </Label>
              <input
                ref={fileInputRef}
                type="file"
                id="club-image"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              {clubImagePreview ? (
                <div className="mt-2 relative">
                  <div className="relative h-40 w-full rounded-md overflow-hidden border border-amber-300">
                    <Image
                      src={clubImagePreview}
                      alt="Club image preview"
                      layout="fill"
                      objectFit="cover"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2 bg-amber-50 border-amber-300 text-amber-800"
                    onClick={handleRemoveImage}
                  >
                    <X className="h-4 w-4" />
                    <span className="ml-1">Remove</span>
                  </Button>
                </div>
              ) : (
                <div
                  onClick={triggerFileInput}
                  className="mt-2 flex flex-col items-center justify-center h-40 border-2 border-dashed border-amber-300 rounded-md bg-amber-50 cursor-pointer hover:bg-amber-100"
                >
                  <ImageIcon className="h-8 w-8 text-amber-600 mb-2" />
                  <p className="text-sm text-amber-700">
                    Click to upload a club image
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    (Max size: 5MB, JPEG/PNG/GIF)
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is-private"
                checked={isPrivate}
                onCheckedChange={(checked) => setIsPrivate(checked as boolean)}
                className="border-amber-400 data-[state=checked]:bg-amber-600"
              />
              <Label htmlFor="is-private" className="text-amber-800">
                Make this club private
              </Label>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="border-amber-300 text-amber-800"
              >
                Cancel
              </Button>
              <Button
                onClick={() => setStep(2)}
                className="bg-amber-800 text-amber-50 hover:bg-amber-700"
              >
                Next: Select Book
              </Button>
            </div>
          </div>
        ) : (
          // Step 2: Book Selection
          <div>
            <div className="mb-4 flex items-center gap-2">
              <div className="flex-1">
                <Label htmlFor="book-search" className="sr-only">
                  Search for a book
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-600" />
                  <Input
                    id="book-search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    className="border-amber-300 bg-white pl-9 focus-visible:ring-amber-600"
                    placeholder="Search for a book by title or author"
                  />
                </div>
              </div>
              <Button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="bg-amber-800 text-amber-50 hover:bg-amber-700"
              >
                {isSearching ? "Searching..." : "Search"}
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="mb-6 max-h-60 overflow-y-auto rounded-md border border-amber-200 bg-white p-2">
                {searchResults.map((book) => (
                  <div
                    key={book.id}
                    className="flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-amber-100"
                    onClick={() => handleBookSelect(book)}
                  >
                    <div className="h-12 w-8 flex-shrink-0 overflow-hidden rounded-sm bg-amber-200">
                      {book.cover_url ? (
                        <Image
                          src={book.cover_url}
                          alt={book.title}
                          width={32}
                          height={48}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-amber-200 text-amber-700">
                          <BookOpen className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-amber-900">{book.title}</p>
                      <p className="text-xs text-amber-700">
                        {book.authors.join(", ")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedBook && (
              <div className="mb-6 rounded-md border border-amber-300 bg-amber-50 p-4">
                <div className="flex items-center gap-4">
                  <div className="h-24 w-16 flex-shrink-0 overflow-hidden rounded-md bg-amber-200">
                    {selectedBook.cover_url ? (
                      <Image
                        src={selectedBook.cover_url}
                        alt={selectedBook.title}
                        width={64}
                        height={96}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-amber-200 text-amber-700">
                        <BookOpen className="h-10 w-10" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-amber-900">
                      {selectedBook.title}
                    </h3>
                    <p className="text-sm text-amber-700">
                      by {selectedBook.authors.join(", ")}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto text-amber-700"
                    onClick={() => setSelectedBook(null)}
                  >
                    <X className="h-4 w-4" />
                    <span className="ml-1">Remove</span>
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-amber-700">
                {!selectedBook &&
                  "You can create a club without selecting a book."}
              </p>

              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="border-amber-300 text-amber-800"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-amber-800 text-amber-50 hover:bg-amber-700"
                >
                  {isSubmitting ? "Creating..." : "Create Book Club"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
