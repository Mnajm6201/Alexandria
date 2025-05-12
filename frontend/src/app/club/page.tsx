"use client";
import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  Users,
  Search,
  Plus,
  Calendar,
  MessageSquare,
  BookMarked,
  ChevronRight,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { CreateBookClubModal } from "@/components/club/CreateBookClubModal";
import { useJWToken } from "@/utils/getJWToken";
import axios from "axios";
import { motion } from "framer-motion";

interface BookClubResponse {
  id: number;
  name: string;
  club_desc: string | null;
  is_private: boolean;
  member_count: number;
  book_title: string | null;
  club_image?: string;
}

interface FormattedBookClub {
  id: number;
  name: string;
  members: number;
  currentBook: string;
  bookCover: string;
  description: string;
  tags: string[];
  nextMeeting: string;
  unreadMessages?: number;
  clubImage?: string; // Ensure this property name matches what we use in JSX
}

export default function BookClubsPage() {
  const [featureClubs, setFeatureClubs] = useState<FormattedBookClub[]>([]);
  const [yourClubs, setYourClubs] = useState<FormattedBookClub[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // authentication token
  const { jwtToken, fetchJWToken } = useJWToken();

  // Load in the jwt token when component is mounted
  useEffect(() => {
    fetchJWToken();
  }, [fetchJWToken]);

  // Fetching book clubs when components are mounted
  useEffect(() => {
    const fetchBookClubs = async () => {
      try {
        const token = jwtToken || (await fetchJWToken());
        setLoading(true);

        // Make an api request to the server
        const response = await fetch(
          "http://localhost:8000/api/bookclubs/clubs/",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        console.log("Response status:", response.status);
        const data = await response.json();
        console.log("API Response data:", data);

        const allClubs = data || [];

        const userClubs = allClubs.filter((club) => club.is_user_member);

        const otherClubs = allClubs.filter((club) => !club.is_user_member);

        const formattedUserClubs: FormattedBookClub[] = userClubs.map(
          (club) => ({
            id: club.id,
            name: club.name,
            members: club.member_count,
            currentBook: club.book_title || "No book selected",
            bookCover: `/placeholder.svg?height=150&width=100&text=${
              club.book_title?.split(" ")[0] || "Book"
            }`,
            description: club.club_desc || "",
            tags: [], 
            nextMeeting: "No upcoming meetings", 
            unreadMessages: 0, 
            clubImage: club.club_image 
              ? `http://localhost:8000${club.club_image}`
              : undefined,
          })
        );

        const formattedFeaturedClubs: FormattedBookClub[] = otherClubs.map(
          (club) => ({
            id: club.id,
            name: club.name,
            members: club.member_count,
            currentBook: club.book_title || "No book selected",
            bookCover: `/placeholder.svg?height=150&width=100&text=${
              club.book_title?.split(" ")[0] || "Book"
            }`,
            description: club.club_desc || "",
            tags: [],
            nextMeeting: "No upcoming meetings",
            clubImage: club.club_image // Make sure this property name matches what we use in JSX
              ? `http://localhost:8000${club.club_image}`
              : undefined,
          })
        );

        console.log("Your clubs with images:", formattedUserClubs);
        console.log("Featured clubs with images:", formattedFeaturedClubs);

        setYourClubs(formattedUserClubs);
        setFeatureClubs(formattedFeaturedClubs);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching book clubs:", err);
        setError("Failed to load book clubs. Please try again later.");
        setLoading(false);
      }
    };

    fetchBookClubs();
  }, [showCreateModal]);

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
  };

  // Simple handling search query for now
  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    // Add your search implementation here
  };

  // If page is loading simple loading page
  if (loading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="text-amber-800 text-xl">Loading book clubs...</div>
      </div>
    );
  }

  // If page has an error show something
  if (error) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="text-red-600 text-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50">
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold text-amber-900">
              Book Clubs
            </h1>
            <p className="text-amber-800">
              Join a community of readers and discuss your favorite books
            </p>
          </div>
          <motion.div 
            whileHover={{ scale: 1.07 }}
            whileTap={{ scale: 0.9 }}  
          > 
            <Button
              className="bg-amber-800 text-amber-50 hover:bg-amber-900 rounded-full"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="h-4 w-4 text-white" />
              Create New Club
            </Button>
          </motion.div>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 rounded-lg border border-amber-200 bg-white p-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-600" />
              <Input
                type="text"
                placeholder="Search book clubs..."
                className="pl-9 border-amber-300 bg-amber-50 focus-visible:ring-amber-600"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e: React.KeyboardEvent) =>
                  e.key === "Enter" && handleSearch()
                }
              />
            </div>
            <div className="flex gap-2">
            <motion.div 
                whileHover={{ scale: 1.07 }}
                whileTap={{ scale: 0.9 }}  
              > 
                <Button
                  className="bg-amber-800 text-amber-50 hover:bg-amber-900 rounded-full"
                  onClick={handleSearch}
                >
                  Search
                </Button>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Your Book Clubs */}
        {yourClubs.length > 0 && (
          <div className="mb-12">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-serif font-bold text-amber-900">
                Your Book Clubs
              </h2>
              <Button variant="ghost" className="text-amber-800">
                View All <ChevronRight className="h-4 w-4 text-white" />
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {yourClubs.map((club) => (
                <Link
                  key={club.id}
                  href={`/club/${club.id}`}
                  className="group rounded-lg border border-amber-200 bg-white p-6 transition-all hover:border-amber-300 hover:shadow-md"
                >
                  <div className="flex gap-4">
                    <div className="relative h-[150px] w-[100px] flex-shrink-0 overflow-hidden rounded-md border border-amber-200 bg-amber-100 shadow-md">
                      {club.clubImage ? (
                        <Image
                          src={club.clubImage}
                          alt={club.name}
                          width={100}
                          height={150}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-amber-100 text-amber-700">
                          <BookOpen className="h-10 w-10" />
                        </div>
                      )}
                      {club.unreadMessages && club.unreadMessages > 0 && (
                        <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-amber-600 text-xs font-medium text-white">
                          {club.unreadMessages}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="mb-2 flex items-start justify-between">
                        <h3 className="text-xl font-medium text-amber-900 group-hover:text-amber-700">
                          {club.name}
                        </h3>
                      </div>
                      <p className="mb-2 text-sm text-amber-800">
                        <span className="font-medium">Currently reading:</span>{" "}
                        {club.currentBook}
                      </p>
                      <div className="mb-3 flex items-center gap-2 text-sm text-amber-700">
                        <Users className="h-4 w-4" />
                        <span>{club.members} members</span>
                        <span className="text-amber-400">•</span>
                        <Calendar className="h-4 w-4" />
                        <span>Next: {club.nextMeeting}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {club.tags &&
                          club.tags.length > 0 &&
                          club.tags.map((tag, i) => (
                            <Badge
                              key={i}
                              variant="outline"
                              className="bg-amber-50 text-amber-800 border-amber-200"
                            >
                              {tag}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Featured Book Clubs */}
        <div className="mb-12">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-serif font-bold text-amber-900">
              Featured Book Clubs
            </h2>
            <Button variant="ghost" className="text-amber-800">
              View All <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featureClubs.map((club) => (
              <div
                key={club.id}
                className="rounded-lg border border-amber-200 bg-white p-6 transition-all hover:border-amber-300 hover:shadow-md"
              >
                <div className="mb-4 flex items-center justify-center">
                  <div className="h-[150px] w-[100px] overflow-hidden rounded-md border border-amber-200 bg-amber-100 shadow-md">
                    {club.clubImage ? (
                      <Image
                        src={club.clubImage}
                        alt={club.name}
                        width={100}
                        height={150}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-amber-100 text-amber-700">
                        <BookOpen className="h-10 w-10" />
                      </div>
                    )}
                  </div>
                </div>
                <h3 className="mb-2 text-center text-xl font-medium text-amber-900">
                  {club.name}
                </h3>
                <p className="mb-3 text-center text-sm text-amber-800">
                  <span className="font-medium">Currently reading:</span>{" "}
                  {club.currentBook}
                </p>
                <p className="mb-4 text-center text-sm text-amber-700 line-clamp-2">
                  {club.description}
                </p>
                <div className="mb-4 flex items-center justify-center gap-3 text-sm text-amber-700">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{club.members}</span>
                  </div>
                  <span className="text-amber-400">•</span>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{club.nextMeeting}</span>
                  </div>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {club.tags &&
                    club.tags.length > 0 &&
                    club.tags.map((tag, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="bg-amber-50 text-amber-800 border-amber-200"
                      >
                        {tag}
                      </Badge>
                    ))}
                </div>
                <div className="mt-4 flex justify-center">
                  <Link href={`/club/${club.id}`}>
                    <Button
                      variant="outline"
                      className="border-amber-300 text-amber-800 rounded-full"
                    >
                      View Club
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Creation of club modal */}
        <div className="rounded-lg border border-amber-200 bg-white p-8">
          <div className="flex flex-col items-center text-center md:flex-row md:items-start md:text-left">
            <div className="mb-6 md:mb-0 md:mr-8 md:w-1/3">
              <h2 className="text-2xl font-serif font-bold text-amber-900">
                Create Your Own Book Club
              </h2>
              <p className="mt-2 text-amber-800">
                Start a community around your favorite books or genres. Invite
                friends, set reading schedules, and host discussions.
              </p>
              <motion.div 
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.9 }}  
              > 
                <Button
                  className="mt-4 bg-amber-800 text-amber-50 hover:bg-amber-900 rounded-full"
                  onClick={() => setShowCreateModal(true)}
                >
                  <Plus className="h-4 w-4 text-white" />
                  Create New Club
                </Button>
              </motion.div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:w-2/3"></div>
          </div>
        </div>
      </main>
      <CreateBookClubModal
        isOpen={showCreateModal}
        onClose={handleCloseCreateModal}
      />
    </div>
  );
}
