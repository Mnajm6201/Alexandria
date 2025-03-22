"use client"
/**
 * RESUABLE SEARCH BAR COMPONENT
 */

import React, { useState, useEffect } from "react";   
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useSearchParams, useSelectedLayoutSegment } from "next/navigation";

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
        books: { id: number; title: string}[];
        authors: { id: number; name: string}[];
    }

    // use states
    const [query, setQuery] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [results, setResults] = useState<SearchResults>({ books: [], authors: []});
    const [showDropdown, setShowDropdown] = useState<boolean>(false);

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
                    console.error("Oops! A unknown searching error occurred!", error)
                    setIsLoading(false)
                });
        }, 400); // change timeout time here

        return () => clearTimeout(delayDebounce)
    }, [query]);

    return (
        <div className="relative w-full max-w-sm mx-4">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
                type="search"
                placeholder="Search books by title, ISBN, genre, or author"
                className="pl-8 bg-white text-black"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />

            {showDropdown && (results.books.length > 0 || results.authors.length > 0) && (
                <div className="absolute top-full mt-1 left-0 w-full bg-white border rounded shadow z-10 max-h-60 overflow-y-auto">
                {isLoading && <p className="p-2 text-sm text-gray-500">Loading...</p>}

                {/** BOOK RESULTS*/}
                {results.books.length > 0 && (
                    <>
                    <div className="px-3 py-2 text-sm font-semibold text-black border-b">Books</div>
                    {results.books.map((book) => (
                        <div key={`book-${book.id}`} className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-black">
                        {book.title}
                        </div>
                    ))}
                    </>
                )}

                {/** AUTHOR RESULTS*/}
                {results.authors.length > 0 && (
                    <>
                    <div className="px-3 py-2 text-sm font-semibold text-black border-b">Authors</div>
                    {results.authors.map((author) => (
                        <div key={`author-${author.id}`} className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-black">
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
    );
};

export default SearchBar;