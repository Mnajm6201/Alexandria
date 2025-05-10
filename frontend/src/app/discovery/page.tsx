'use client'

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    BookOpen,
    Home,
    Compass,
    BookmarkIcon,
    User,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import SearchBar from "@/components/ui/SearchBar";
import ShelfComponent from "@/components/ui/shelves/ShelfComponent";
import { useRouter } from "next/navigation";
import { useJWToken } from '@/utils/getJWToken';

// Fallback to static data if API fails
import { topRated, topRomance, topFiction } from "@/components/ui/book_details/StaticCurated";

// match the interfaces used in ShelfComponent
interface Edition {
    id: string;
    edition_id: number;
    isbn: string;
    cover_image?: string;
    authors?: Array<{ id: number, name: string }>;
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
    return books.map(book => ({
        id: book.id.toString(),
        edition_id: book.id, 
        isbn: book.isbn || '',
        cover_image: book.cover_image,
        title: book.title,
        authors: book.authors || []
    }));
};

// Convert static items to Edition format
const mapStaticToEditions = (items: any[]): Edition[] => {
    return items.map(item => ({
        id: item.id,
        edition_id: parseInt(item.id),
        isbn: item.isbn || '',
        cover_image: item.cover_image
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
                let token = jwtToken || await fetchJWToken().catch(() => null);
                
                // If couldn't get a token through the normal flow,
                // check if there's one directly in the cookies
                if (!token) {
                    // Direct access to cookies as a backup
                    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
                        const [key, value] = cookie.trim().split('=');
                        acc[key] = value;
                        return acc;
                    }, {} as Record<string, string>);
                    
                    token = cookies.access_token;
                }
                
                if (!token) {
                    setError('Authentication required to view featured content');
                    setLoading(false);
                    return;
                }
                
                const response = await fetch('http://localhost:8000/api/discovery/featured-shelves/', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`Failed to fetch featured shelves: ${response.status}`);
                }
                
                const data = await response.json();
                
                if (Array.isArray(data) && data.length > 0) {
                    setFeaturedShelves(data);
                } else {
                    setError("No featured shelves found");
                }
            } catch (err) {
                setError('Failed to load featured content. Showing fallback recommendations.');
            } finally {
                setLoading(false);
            }
        }
        
        fetchFeaturedShelves();
    }, [jwtToken, fetchJWToken]);

    return (
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
                    {/* Banner section */}
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

                    {/* Loading state */}
                    {loading && (
                        <div className="flex justify-center items-center py-10">
                            <Loader2 className="h-10 w-10 text-amber-600 animate-spin" />
                        </div>
                    )}
                    
                    {/* Dynamic featured shelves */}
                    {!loading && !error && featuredShelves.length > 0 && 
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
                        ))
                    }
                    
                    {/* Fallback static content for either error or no featured shelves */}
                    {(!loading && (error || featuredShelves.length === 0)) && (
                        <>
                            <ShelfComponent
                                id="static-1"
                                name="Top Rated this Week"
                                description=""
                                is_private={false}
                                editions={mapStaticToEditions(topRated)}
                                isOwner={false}
                            />
                            
                            <ShelfComponent
                                id="static-2"
                                name="Popular in Fiction"
                                description=""
                                is_private={false}
                                editions={mapStaticToEditions(topFiction)}
                                isOwner={false}
                            />

                            <ShelfComponent
                                id="static-3"
                                name="Popular in Romance"
                                description=""
                                is_private={false} 
                                editions={mapStaticToEditions(topRomance)}
                                isOwner={false}
                            />
                        </>
                    )}
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