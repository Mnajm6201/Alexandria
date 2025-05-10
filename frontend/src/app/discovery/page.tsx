import Link from "next/link";
import {
    Search,
    BookOpen,
    Home,
    Compass,
    BookmarkIcon,
    User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import SearchBar from "@/components/ui/SearchBar";
import ItemCarousel from "@/components/ui/ItemCarousel";
import CoverImage from "@/components/ui/CoverImage";
import { topRated, topRomance, topFiction } from "@/components/ui/book_details/StaticCurated";

export default function DiscoveryPage() {
    return (
        /**
         * NAVBAR AND SEARCH BAR
         */
        <div className="flex flex-col min-h-screen bg-[#F8F5F1]">
        <header className="sticky top-0 z-10 bg-[#F8F5F1] border-b border-[#E2D9C9] p-4">
            <div className="flex items-center justify-between max-w-6xl mx-auto">
            <Link href="/" className="text-2xl font-bold text-[#4A4238]">
                Alexandria
            </Link>
            <div className="relative w-full max-w-sm mx-4">
                <SearchBar />
            </div>
            <Button variant="ghost" size="icon">
                <BookOpen className="h-6 w-6 text-[#4A4238]" />
            </Button>
            </div>
        </header>
        
        {/** FEATURED BOOK COLLECTION */}
        <main className="flex-grow overflow-auto">
            <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
            <section className="relative h-64 rounded-lg overflow-hidden">
                <img
                src="/bettersummer.webp"
                alt=""
                className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-end p-6">
                <div className="text-white">
                    <h2 className="text-2xl font-bold mb-2">
                    Summer Reading Collection
                    </h2>
                    <p className="mb-4">
                    Dive into our curated list of beach reads and summer
                    adventures
                    </p>
                    <Button>Explore Collection</Button>
                </div>
                </div>
            </section>

            {/** SUB FEATURE 1 */}
            <section>
                <ItemCarousel 
                    title="Top Rated this Week"
                    items={topRated}
                />
            </section>
            
            {/** SUB FEATURE 2 */}
            <section>
                <ItemCarousel 
                    title="Popular in Fiction"
                    items={topFiction}
                />
            </section>

            {/** SUB FEATURE 3 */}
            <section>
                <ItemCarousel 
                    title="Popular in Romance"
                    items={topRomance}
                />
            </section>
            </div>
        </main>

        {/** FOOTER */}
        <footer className="sticky bottom-0 bg-white border-t border-[#E2D9C9] py-2 md:hidden">
            <nav className="flex justify-around">
            <Button variant="ghost" size="icon">
                <Home className="h-6 w-6" />
            </Button>
            <Button variant="ghost" size="icon">
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
        </div>
    );
    }
    
    function BookCard() {
    return (
        <div className="w-32 flex-shrink-0">
        <img
            src="/placeholder.svg?height=192&width=128"
            //alt="Book Cover"
            className="w-full h-48 object-cover rounded-xl shadow-md"
        />
        <h3 className="mt-2 text-sm font-medium text-[#4A4238] line-clamp-2">
            Book Title
        </h3>
        <p className="text-xs text-gray-500">Author Name</p>
        </div>
    );
    }

    // ADD BACK TMR:

    // {/** SUB FEATURE 2 */}
    // <section>
    //     <h2 className="text-xl font-semibold mb-4 text-[#4A4238]">
    //     Because You Read "The Great Gatsby"
    //     </h2>
    //     <ScrollArea>
    //     <div className="flex space-x-4 pb-4">
    //         {[1, 2, 3, 4, 5, 6].map((book) => (
    //         <BookCard key={book} />
    //         ))}
    //     </div>
    //     <ScrollBar orientation="horizontal" />
    //     </ScrollArea>
    // </section>
