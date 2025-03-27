import Link from "next/link";
import Image from "next/image";
import {
  BookOpen,
  BookMarked,
  Users,
  Search,
  BookHeart,
  Coffee,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-amber-50 ">
      <Header variant="landing" />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6 mx-auto max-w-7xl">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_500px]">
              {/* Hero Section */}
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-serif font-bold tracking-tighter text-amber-900 sm:text-5xl xl:text-6xl/none">
                    Your Personal Library, Reimagined
                  </h1>
                  <p className="max-w-[600px] text-amber-800 md:text-xl">
                    Alexandria brings book lovers together. Track your reading
                    journey, discover new favorites, and connect with fellow
                    bibliophiles.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button className="bg-amber-800 text-amber-50 hover:bg-amber-700">
                    Start Your Library
                  </Button>
                  <Button className="border border-amber-800 text-amber-800 hover:bg-amber-100">
                    Explore Books
                  </Button>
                </div>
                <div className="flex items-center space-x-4 text-sm text-amber-700 pt-4">
                  <div className="flex items-center space-x-1">
                    <BookMarked className="h-4 w-4" />
                    <span>10,000+ Books</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>Active Community</span>
                  </div>
                </div>
              </div>
              <div className="relative hidden lg:block">
                <div className="absolute -left-8 top-8 h-[450px] w-[350px] rotate-[-6deg] rounded-2xl bg-amber-200 shadow-lg">
                  <div className="absolute inset-0 bg-[url('/placeholder.svg?height=450&width=350')] bg-cover bg-center opacity-30 mix-blend-overlay" />
                </div>
                <div className="absolute -right-4 top-20 h-[400px] w-[300px] rotate-[6deg] rounded-2xl bg-amber-100 shadow-lg">
                  <div className="absolute inset-0 bg-[url('/placeholder.svg?height=400&width=300')] bg-cover bg-center opacity-30 mix-blend-overlay" />
                </div>
                <div className="relative h-[500px] w-[400px] rounded-2xl bg-amber-300 shadow-xl">
                  <Image
                    src="/Gatsby.jpg"
                    width="500"
                    height="350"
                    alt="Stack of books"
                    className="rounded-2xl object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="w-full py-12 md:py-24 bg-amber-100">
          {/* Features sections */}
          <div className="container px-4 md:px-6 mx-auto max-w-7xl">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-amber-200 px-3 py-1 text-sm font-medium text-amber-900">
                  Features
                </div>
                <h2 className="text-3xl font-serif font-bold tracking-tighter text-amber-900 sm:text-4xl md:text-5xl">
                  Everything a Book Lover Needs
                </h2>
                <p className="max-w-[700px] text-amber-800 md:text-xl/relaxed">
                  Alexandria is designed by readers, for readers. Our platform
                  offers everything you need to enhance your reading experience.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3 md:gap-12 pt-8">
              <div className="flex flex-col items-center space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-6 shadow-sm">
                <div className="rounded-full bg-amber-200 p-3">
                  <BookMarked className="h-6 w-6 text-amber-800" />
                </div>
                <h3 className="text-xl font-medium text-amber-900">
                  Track Your Reading
                </h3>
                <p className="text-center text-amber-700">
                  Log books, set goals, and keep track of your reading progress
                  with our intuitive tools.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-6 shadow-sm">
                <div className="rounded-full bg-amber-200 p-3">
                  <Search className="h-6 w-6 text-amber-800" />
                </div>
                <h3 className="text-xl font-medium text-amber-900">
                  Discover New Books
                </h3>
                <p className="text-center text-amber-700">
                  Get personalized recommendations based on your reading history
                  and preferences.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-6 shadow-sm">
                <div className="rounded-full bg-amber-200 p-3">
                  <Users className="h-6 w-6 text-amber-800" />
                </div>
                <h3 className="text-xl font-medium text-amber-900">
                  Connect with Readers
                </h3>
                <p className="text-center text-amber-700">
                  Join book clubs, participate in discussions, and share your
                  thoughts with fellow book lovers.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="discover" className="w-full py-12 md:py-24">
          <div className="container px-4 md:px-6 mx-auto max-w-7xl">
            <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 items-center">
              <div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="overflow-hidden rounded-lg bg-amber-200 shadow-lg h-48">
                      <Image
                        src="/placeholder.svg?height=200&width=150"
                        alt="Book cover"
                        width={150}
                        height={200}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="overflow-hidden rounded-lg bg-amber-200 shadow-lg h-64">
                      <Image
                        src="/placeholder.svg?height=250&width=180"
                        alt="Book cover"
                        width={180}
                        height={250}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                  <div className="space-y-4 pt-8">
                    <div className="overflow-hidden rounded-lg bg-amber-200 shadow-lg h-64">
                      <Image
                        src="/placeholder.svg?height=250&width=180"
                        alt="Book cover"
                        width={180}
                        height={250}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="overflow-hidden rounded-lg bg-amber-200 shadow-lg h-48">
                      <Image
                        src="/placeholder.svg?height=200&width=150"
                        alt="Book cover"
                        width={150}
                        height={200}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col justify-center space-y-4">
                <div className="inline-block rounded-lg bg-amber-200 px-3 py-1 text-sm font-medium text-amber-900 w-fit">
                  Discover
                </div>
                <h2 className="text-3xl font-serif font-bold tracking-tighter text-amber-900 sm:text-4xl">
                  Find Your Next Great Read
                </h2>
                <p className="text-amber-800">
                  Alexandria&#39;s discovery engine helps you find books
                  you&#39;ll love based on your unique taste. Browse curated
                  collections, explore genres, or let our algorithm suggest your
                  next page-turner.
                </p>
                <ul className="space-y-2 text-amber-800">
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4 text-amber-600" />
                    <span>Personalized recommendations</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4 text-amber-600" />
                    <span>Curated reading lists</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4 text-amber-600" />
                    <span>Genre exploration tools</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4 text-amber-600" />
                    <span>New releases and classics</span>
                  </li>
                </ul>
                <div className="pt-4">
                  <Button className="bg-amber-800 text-amber-50 hover:bg-amber-700">
                    Explore Library
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="community" className="w-full py-12 md:py-24 bg-amber-100">
          <div className="container px-4 md:px-6 mx-auto max-w-7xl">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-amber-200 px-3 py-1 text-sm font-medium text-amber-900">
                  Community
                </div>
                <h2 className="text-3xl font-serif font-bold tracking-tighter text-amber-900 sm:text-4xl md:text-5xl">
                  Connect with Fellow Book Lovers
                </h2>
                <p className="max-w-[700px] text-amber-800 md:text-xl/relaxed">
                  Reading is better together. Join Alexandria&#39;s vibrant
                  community of passionate readers.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 pt-12">
              <div className="flex flex-col items-center space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-6 shadow-sm">
                <BookHeart className="h-10 w-10 text-amber-800 mb-2" />
                <h3 className="text-xl font-medium text-amber-900">
                  Book Clubs
                </h3>
                <p className="text-center text-amber-700">
                  Join virtual book clubs focused on different genres, authors,
                  or themes. Read and discuss together.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-6 shadow-sm">
                <Users className="h-10 w-10 text-amber-800 mb-2" />
                <h3 className="text-xl font-medium text-amber-900">
                  Discussion Forums
                </h3>
                <p className="text-center text-amber-700">
                  Share your thoughts, ask questions, and engage in thoughtful
                  conversations about books.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-6 shadow-sm">
                <Coffee className="h-10 w-10 text-amber-800 mb-2" />
                <h3 className="text-xl font-medium text-amber-900">
                  Reading Challenges
                </h3>
                <p className="text-center text-amber-700">
                  Participate in community reading challenges to discover new
                  books and authors.
                </p>
              </div>
            </div>
            <div className="flex justify-center mt-12">
              <Button className="bg-amber-800 text-amber-50 hover:bg-amber-700">
                Join Our Community
              </Button>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24">
          <div className="container px-4 md:px-6 mx-auto max-w-7xl">
            <div className="grid gap-6 items-center justify-center text-center">
              <div className="space-y-3">
                <h2 className="text-3xl font-serif font-bold tracking-tighter text-amber-900 sm:text-4xl md:text-5xl">
                  Start Your Reading Journey Today
                </h2>
                <p className="mx-auto max-w-[700px] text-amber-800 md:text-xl/relaxed">
                  Join thousands of readers who have already made Alexandria
                  their literary home.
                </p>
              </div>
              <div className="mx-auto w-full max-w-sm space-y-2">
                <form className="flex flex-col gap-2 sm:flex-row">
                  <input
                    className="flex h-10 w-full rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm placeholder:text-amber-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600"
                    placeholder="Enter your email"
                    type="email"
                  />
                  <Button className="bg-amber-800 text-amber-50 hover:bg-amber-700">
                    Get Started
                  </Button>
                </form>
                <p className="text-xs text-amber-700">
                  Join for free. No credit card required.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="w-full border-t border-amber-200 bg-amber-50 py-6">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row px-4 md:px-6">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-amber-800" />
            <span className="text-lg font-serif font-bold text-amber-900">
              Alexandria
            </span>
          </div>
          <p className="text-center justify-center text-sm text-amber-700 md:text-left">
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
