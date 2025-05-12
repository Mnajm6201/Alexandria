import Link from "next/link";
import {
  BookOpen,
  BookMarked,
  Users,
  Search,
  Scroll,
  MessageCircle,
  Star,
  BarChart,
  BookHeart,
  Sparkles,
  Compass,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";

export default function WelcomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-amber-50">
      <Header variant="landing" />
      <main className="flex-1">
        {/* Hero Section - Clean Welcome */}
        <section className="w-full py-16 md:py-24 lg:py-32 relative overflow-hidden">
          {/* Subtle background texture */}
          <div className="absolute inset-0 bg-[url('/papyrus-texture.png')] opacity-5 mix-blend-multiply pointer-events-none"></div>

          <div className="container px-4 md:px-6 mx-auto max-w-7xl relative z-10">
            <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
              <div className="rounded-full bg-amber-100 p-3 mb-6">
                <BookOpen className="h-8 w-8 text-amber-800" />
              </div>

              <h1 className="text-4xl font-serif font-bold tracking-tighter text-amber-900 sm:text-5xl md:text-6xl">
                Alexandria
              </h1>
              <p className="text-xl sm:text-2xl font-serif italic text-amber-800 mt-2">
                The Great Library Reborn
              </p>

              <div className="w-24 h-px bg-amber-300 my-6"></div>

              <p className="text-amber-800 text-lg md:text-xl max-w-2xl font-serif">
                A community-focused sanctuary for book lovers to discover,
                review, discuss, and track books. Inspired by the legendary
                Library of Alexandria, bringing communities together through
                literature.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mt-10">
                <Button className="bg-amber-800 text-amber-50 hover:bg-amber-700 px-6 py-3 text-lg font-serif">
                  Begin Your Odyssey
                </Button>
                <Button className="bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300 px-6 py-3 text-lg font-serif">
                  Explore the Archives
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Core Features Section */}
        <section id="features" className="w-full py-16 md:py-24 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-amber-50 to-amber-100 pointer-events-none"></div>
          <div className="container px-4 md:px-6 mx-auto max-w-7xl relative z-10">
            <div className="flex flex-col items-center text-center mb-12">
              <div className="inline-block rounded-sm bg-amber-200 px-3 py-1 text-sm font-serif italic text-amber-900 mb-4">
                <span>Key Features</span>
              </div>
              <h2 className="text-3xl font-serif font-bold tracking-tighter text-amber-900 sm:text-4xl">
                The Pillars of Alexandria
              </h2>
              <div className="w-24 h-px bg-amber-300 my-6"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Feature 1: Discover */}
              <div className="flex flex-col items-center p-6 bg-amber-50 border border-amber-200 rounded-md shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-200 via-amber-300 to-amber-200"></div>
                <div className="rounded-full bg-amber-100 p-4 mb-4">
                  <Compass className="h-7 w-7 text-amber-800" />
                </div>
                <h3 className="text-xl font-serif font-medium text-amber-900">
                  Discover
                </h3>
                <p className="text-amber-700 font-serif text-center mt-2">
                  Find your next great read through personalized recommendations
                  and curated collections from fellow scholars.
                </p>
              </div>

              {/* Feature 2: Review */}
              <div className="flex flex-col items-center p-6 bg-amber-50 border border-amber-200 rounded-md shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-200 via-amber-300 to-amber-200"></div>
                <div className="rounded-full bg-amber-100 p-4 mb-4">
                  <Star className="h-7 w-7 text-amber-800" />
                </div>
                <h3 className="text-xl font-serif font-medium text-amber-900">
                  Review
                </h3>
                <p className="text-amber-700 font-serif text-center mt-2">
                  Share your thoughts and insights on books you've read,
                  contributing to our collective wisdom.
                </p>
              </div>

              {/* Feature 3: Discuss */}
              <div className="flex flex-col items-center p-6 bg-amber-50 border border-amber-200 rounded-md shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-200 via-amber-300 to-amber-200"></div>
                <div className="rounded-full bg-amber-100 p-4 mb-4">
                  <MessageCircle className="h-7 w-7 text-amber-800" />
                </div>
                <h3 className="text-xl font-serif font-medium text-amber-900">
                  Discuss
                </h3>
                <p className="text-amber-700 font-serif text-center mt-2">
                  Engage in thoughtful conversations with fellow readers in our
                  vibrant community forums and book clubs.
                </p>
              </div>

              {/* Feature 4: Track */}
              <div className="flex flex-col items-center p-6 bg-amber-50 border border-amber-200 rounded-md shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-200 via-amber-300 to-amber-200"></div>
                <div className="rounded-full bg-amber-100 p-4 mb-4">
                  <BarChart className="h-7 w-7 text-amber-800" />
                </div>
                <h3 className="text-xl font-serif font-medium text-amber-900">
                  Track
                </h3>
                <p className="text-amber-700 font-serif text-center mt-2">
                  Chronicle your reading journey, set goals, and maintain your
                  personal library collection.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Community Section */}
        <section
          id="community"
          className="w-full py-16 md:py-24 bg-amber-100 relative"
        >
          <div className="absolute inset-0 bg-[url('/column-pattern.png')] opacity-5 mix-blend-multiply pointer-events-none"></div>

          <div className="container px-4 md:px-6 mx-auto max-w-7xl">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="flex flex-col">
                <div className="inline-block rounded-sm bg-amber-200 px-3 py-1 text-sm font-serif italic text-amber-900 w-fit mb-4">
                  <span>Our Community</span>
                </div>

                <h2 className="text-3xl font-serif font-bold tracking-tighter text-amber-900 sm:text-4xl">
                  Join Our Literary Assembly
                </h2>

                <div className="w-24 h-px bg-amber-300 my-6"></div>

                <p className="text-amber-800 font-serif mb-6">
                  Alexandria brings together passionate readers from around the
                  world. Share your love of books, discover new perspectives,
                  and build meaningful connections through our shared
                  appreciation of literature.
                </p>

                <ul className="space-y-3 text-amber-800 font-serif">
                  <li className="flex items-center gap-3">
                    <div className="rounded-full bg-amber-200 p-1">
                      <BookHeart className="h-4 w-4 text-amber-700" />
                    </div>
                    <span>
                      Join specialized literary circles based on genres and
                      interests
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="rounded-full bg-amber-200 p-1">
                      <Users className="h-4 w-4 text-amber-700" />
                    </div>
                    <span>
                      Participate in monthly reading challenges with fellow
                      members
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="rounded-full bg-amber-200 p-1">
                      <Sparkles className="h-4 w-4 text-amber-700" />
                    </div>
                    <span>
                      Discover hidden literary gems through community
                      recommendations
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="rounded-full bg-amber-200 p-1">
                      <Scroll className="h-4 w-4 text-amber-700" />
                    </div>
                    <span>
                      Contribute your insights to our growing knowledge
                      repository
                    </span>
                  </li>
                </ul>

                <Button className="bg-amber-800 text-amber-50 hover:bg-amber-700 mt-8 w-fit font-serif">
                  Join Our Community
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="aspect-square bg-amber-200 rounded-md p-6 flex flex-col items-center justify-center text-center">
                  <BookMarked className="h-12 w-12 text-amber-800 mb-4" />
                  <h3 className="text-xl font-serif font-medium text-amber-900">
                    Book Clubs
                  </h3>
                  <p className="text-amber-700 font-serif text-sm mt-2">
                    Join monthly discussions on selected works
                  </p>
                </div>

                <div className="aspect-square bg-amber-50 border border-amber-200 rounded-md p-6 flex flex-col items-center justify-center text-center">
                  <Star className="h-12 w-12 text-amber-800 mb-4" />
                  <h3 className="text-xl font-serif font-medium text-amber-900">
                    Reviews
                  </h3>
                  <p className="text-amber-700 font-serif text-sm mt-2">
                    Share and discover thoughtful critiques
                  </p>
                </div>

                <div className="aspect-square bg-amber-50 border border-amber-200 rounded-md p-6 flex flex-col items-center justify-center text-center">
                  <MessageCircle className="h-12 w-12 text-amber-800 mb-4" />
                  <h3 className="text-xl font-serif font-medium text-amber-900">
                    Forums
                  </h3>
                  <p className="text-amber-700 font-serif text-sm mt-2">
                    Engage in literary discussions and debates
                  </p>
                </div>

                <div className="aspect-square bg-amber-200 rounded-md p-6 flex flex-col items-center justify-center text-center">
                  <Users className="h-12 w-12 text-amber-800 mb-4" />
                  <h3 className="text-xl font-serif font-medium text-amber-900">
                    Challenges
                  </h3>
                  <p className="text-amber-700 font-serif text-sm mt-2">
                    Join reading challenges with fellow bibliophiles
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action Section - Meaningful Journey Start */}
        <section className="w-full py-16 md:py-20 relative">
          <div className="absolute inset-0 bg-[url('/papyrus-light.png')] opacity-5 mix-blend-multiply pointer-events-none"></div>

          <div className="container px-4 md:px-6 mx-auto max-w-4xl">
            <div className="flex flex-col items-center text-center">
              <h2 className="text-3xl font-serif font-bold tracking-tighter text-amber-900 sm:text-4xl md:text-5xl">
                Commence Your Scholarly Journey
              </h2>
              <p className="text-amber-800 text-lg font-serif mt-4 max-w-2xl">
                Join countless scholars who have found wisdom within the walls
                of Alexandria.
              </p>

              <div className="w-full mt-12">
                <div className="bg-amber-50 border border-amber-200 rounded-md p-8 shadow-sm">
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="flex flex-col items-center text-center">
                      <div className="rounded-full bg-amber-100 p-3 mb-4">
                        <BookMarked className="h-6 w-6 text-amber-800" />
                      </div>
                      <h3 className="text-lg font-serif font-medium text-amber-900">
                        Create Your Collection
                      </h3>
                      <p className="text-amber-700 font-serif mt-2 text-sm">
                        Begin building your personal library and track your
                        reading progress
                      </p>
                    </div>

                    <div className="flex flex-col items-center text-center">
                      <div className="rounded-full bg-amber-100 p-3 mb-4">
                        <Users className="h-6 w-6 text-amber-800" />
                      </div>
                      <h3 className="text-lg font-serif font-medium text-amber-900">
                        Join Our Community
                      </h3>
                      <p className="text-amber-700 font-serif mt-2 text-sm">
                        Connect with fellow readers who share your literary
                        interests
                      </p>
                    </div>

                    <div className="flex flex-col items-center text-center">
                      <div className="rounded-full bg-amber-100 p-3 mb-4">
                        <Compass className="h-6 w-6 text-amber-800" />
                      </div>
                      <h3 className="text-lg font-serif font-medium text-amber-900">
                        Discover New Worlds
                      </h3>
                      <p className="text-amber-700 font-serif mt-2 text-sm">
                        Uncover your next literary adventure through
                        personalized recommendations
                      </p>
                    </div>
                  </div>

                  <div className="h-px w-full bg-amber-200 my-6"></div>

                  <div className="text-center max-w-2xl mx-auto">
                    <p className="text-amber-800 font-serif mb-6">
                      Become a part of Alexandria's legacy and embark on a
                      journey of literary discovery, meaningful connections, and
                      the joy of shared knowledge.
                    </p>

                    <Button className="bg-amber-800 text-amber-50 hover:bg-amber-700 px-8 py-3 text-lg font-serif">
                      Begin the Odyssey
                    </Button>

                    <p className="text-amber-600 font-serif text-sm mt-4">
                      No scrolls or quills required—just your passion for
                      literature.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-amber-200 bg-amber-50 py-8">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row px-4 md:px-6 mx-auto">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-amber-800" />
            <span className="text-lg font-serif font-bold text-amber-900">
              Alexandria
            </span>
          </div>
          <p className="text-center justify-center text-sm text-amber-700 md:text-left font-serif">
            &copy; {new Date().getFullYear()} Alexandria. All rights reserved to
            the keepers of knowledge.
          </p>
          <div className="flex gap-4">
            <Link
              href="#"
              className="text-sm text-amber-700 hover:text-amber-900 font-serif"
            >
              Decrees
            </Link>
            <Link
              href="#"
              className="text-sm text-amber-700 hover:text-amber-900 font-serif"
            >
              Discretion
            </Link>
            <Link
              href="#"
              className="text-sm text-amber-700 hover:text-amber-900 font-serif"
            >
              Correspondence
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
