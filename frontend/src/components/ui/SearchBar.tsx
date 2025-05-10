"use client"
/**
 * RESUABLE SEARCH BAR COMPONENT
 */

import React, { useState, useEffect } from "react";   
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "./button";

const SearchBar = () => {
    /**
     * SEARCH RESULTS TYPE
     * This is used to intialize the useState for the results, this ensure type safety and modularity.
     * You can edit this type by adding, deleting, or updating the arrays of values you'll see in the search results.
     * 
     * @IMPORTANT If you add any new models to this search type you MUST import them in the @SearchBarView class in the search
     * function's app's views.py
     */
    type SearchResults = {
        books: { book_id: string; title: string}[];
        authors: { author_id: string; name: string}[];
    }

    // use states
    const [query, setQuery] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [results, setResults] = useState<SearchResults>({ books: [], authors: []});
    const [showDropdown, setShowDropdown] = useState<boolean>(false);
    const router = useRouter();

    /**
     * Keyboard event listener for search results page. Directs users to /search page when "Enter" is pressed, then fetches
     * results for the given query using the SearchBarView
     */
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && query.trim() !== "") {
            router.push(`/search?q=${encodeURIComponent(query)}`);
            setShowDropdown(false);
        }
    };

    const handleSubmit = () => {
        router.push(`/search?q=${encodeURIComponent(query)}`);
    };

    /**
     * Fetches data from endpoint
     * Timesout for 400ms for every keystroke
     * A database call is only made after a 400ms delay after the last keystroke to limit spam calls
     */
    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            if(query.trim() === "") {
                setResults({books: [], authors: []})
                setShowDropdown(false)
                return
            }

            setIsLoading(true)

            fetch(`http://127.0.0.1:8000/api/search-bar/?q=${encodeURIComponent(query)}`)
                .then((res) => res.json())
                .then((data: SearchResults) => {
                    setResults(data)
                    setShowDropdown(true)
                    setIsLoading(false)
                })
                .catch((error) => {
                    console.error("Oops! A unknown search error occurred!", error)
                    setIsLoading(false)
                });
        }, 400); // change delay duration here

        return () => clearTimeout(delayDebounce)
    }, [query]);

    return (
        <div className="mb-8 rounded-lg border border-amber-200 bg-white p-6">
            <div className="flex flex-col gap-4 sm:flex-row">
                <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-600" />
                    <Input
                        type="search"
                        placeholder="Search books by title, ISBN, genre, or author"
                        className="pl-9 border-amber-300 bg-amber-50 focus-visible:ring-amber-600 text-black w-full"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                
                {showDropdown && (results.books.length > 0 || results.authors.length > 0) && (
                    <div className="absolute top-full mt-2 left-0 w-full bg-white border border-amber-200 rounded shadow z-10 max-h-60 overflow-y-auto">
                    {isLoading && <p className="p-2 text-sm text-gray-500">Loading...</p>}
        
                    {/* BOOK RESULTS */}
                    {results.books.length > 0 && (
                        <>
                        <div className="px-3 py-2 text-sm font-semibold text-black border-b">Books</div>
                        {results.books.map((book) => (
                            <div
                            key={`book-${book.book_id}`}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-black"
                            onClick={() => router.push(`/book/${book.book_id}`)}
                            >
                            {book.title}
                            </div>
                        ))}
                        </>
                    )}
        
                    {/* AUTHOR RESULTS */}
                    {results.authors.length > 0 && (
                        <>
                        <div className="px-3 py-2 text-sm font-semibold text-black border-b">Authors</div>
                        {results.authors.map((author) => (
                            <div
                            key={`author-${author.author_id}`}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-black"
                            onClick={() => router.push(`/author/${author.author_id}`)}
                            >
                            {author.name}
                            </div>
                        ))}
                        </>
                    )}
        
                    {results.books.length === 0 && results.authors.length === 0 && (
                        <div className="px-3 py-2 text-sm text-gray-500">No results found.</div>
                    )}
                    </div>
                )}
                </div>
                <div className="flex gap-2">
                    <Button 
                        className="bg-amber-800 text-amber-50 hover:bg-amber-700"
                        onClick={handleSubmit}
                    >
                        <Search className="h-4 w-4" />
                    </Button>
                </div> 
            </div>
        </div>
    );
};

export default SearchBar;