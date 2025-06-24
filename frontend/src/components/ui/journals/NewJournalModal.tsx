"use client"
import { useState, useEffect } from "react"
import { Book, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import axios from "axios"
import { toast } from "@/hooks/use-toast"
import { useJWToken } from "@/utils/getJWToken"
import { motion } from "framer-motion"

type BookType = {
    book_id: string
    title: string
    authors: string[]
    cover_image?: string | null
    year_published?: number
    summary?: string
}

interface NewJournalModalProps {
    onJournalCreated?: () => void;
}

export function NewJournalModal({ onJournalCreated }: NewJournalModalProps) {
    const [open, setOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedBook, setSelectedBook] = useState<BookType | null>(null)
    const [isPrivate, setIsPrivate] = useState(false)
    const [searchResults, setSearchResults] = useState<BookType[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [searchError, setSearchError] = useState("")
    const {jwtToken, fetchJWToken} = useJWToken()

    useEffect(() => {
        fetchJWToken()
    }, [fetchJWToken])

    useEffect(() => {
        if (!open) {
            setSearchQuery("")
            setSelectedBook(null)
            setSearchResults([])
            setSearchError("")
            setIsPrivate(false)
        }
    }, [open])

    // Search as you type with debounce
    useEffect(() => {
        // Don't search if query is empty
        if (!searchQuery.trim()) {
            setSearchResults([])
            setSearchError("")
            return
        }
        
        setIsSearching(true)
        
        // Create a debounce timer
        const debounceTimer = setTimeout(() => {
            const performSearch = async () => {
                try {
                    let response;
                    try {
                        response = await axios.get(`http://127.0.0.1:8000/api/search-bar/?q=${encodeURIComponent(searchQuery)}`)
                    } catch (error) {
                        const token = await fetchJWToken()
                        if (!token) {
                            throw new Error("Authentication required. Please log in.")
                        }
                        
                        response = await axios.get(`http://127.0.0.1:8000/api/search-bar/?q=${encodeURIComponent(searchQuery)}`, {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        })
                    }
                    
                    if (response.data && response.data.books && Array.isArray(response.data.books)) {
                        const books = response.data.books.map((book: any) => ({
                            book_id: book.book_id,
                            title: book.title,
                            authors: book.authors || [],
                            cover_image: book.cover_image,
                            year_published: book.year_published,
                            summary: book.summary
                        }));
                        
                        setSearchResults(books)
                        if (books.length === 0) {
                            setSearchError("No books found matching your search.")
                        } else {
                            setSearchError("")
                        }
                    } else {
                        setSearchError("Invalid response from server.")
                    }
                } catch (error) {
                    console.error("Error searching for books:", error)
                    
                    if (axios.isAxiosError(error)) {
                        if (error.response?.status === 401) {
                            setSearchError("Authentication error. Please log in again.")
                        } else {
                            setSearchError(`Error: ${error.response?.data?.detail || error.message}`)
                        }
                    } else {
                        setSearchError(error instanceof Error ? error.message : "Failed to search for books.")
                    }
                } finally {
                    setIsSearching(false)
                }
            }
            
            performSearch()
        }, 400) // 400ms debounce
        
        // Clean up the timer if the component unmounts or searchQuery changes again
        return () => clearTimeout(debounceTimer)
    }, [searchQuery, fetchJWToken])
    
    // Simplified mock journal creation function
    const handleCreateJournal = () => {
        if (!selectedBook) {
            console.log("No book selected");
            return;
        }
        
        setIsCreating(true);
        
        // Mock success after a short delay
        setTimeout(() => {
            console.log("Creating journal for book:", selectedBook);
            
            setOpen(false);
            toast({
                title: "Journal Created",
                description: `Journal for "${selectedBook.title}" has been created successfully.`,
            });
            
            // Call the callback if provided
            if (onJournalCreated) {
                onJournalCreated();
            }
            
            setIsCreating(false);
        }, 1000);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <motion.div 
                    whileHover={{ scale: 1.07 }}
                    whileTap={{ scale: 0.9 }}  
                > 
                    <Button className="bg-amber-800 hover:bg-amber-900 rounded-full">
                        <Book className="h-4 w-4 text-white" />
                        New Journal
                    </Button>
                </motion.div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                    <DialogTitle>Create New Reading Journal</DialogTitle>
                    <DialogDescription>Search for a book to create a new reading journal.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="book-search">Search for a book</Label>
                        <div className="flex gap-2">
                            <Input
                                id="book-search"
                                placeholder="Enter book title or author..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <Button 
                                variant="outline" 
                                size="icon" 
                                disabled={true}
                            >
                                <Search className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {isSearching && (
                        <div className="text-center py-4">
                            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                            <p className="mt-2 text-sm text-muted-foreground">Searching...</p>
                        </div>
                    )}

                    {searchError && (
                        <div className="text-red-500 text-sm">{searchError}</div>
                    )}

                    {searchResults.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-medium">Search Results</h3>
                            <div className="grid gap-4 max-h-[300px] overflow-y-auto">
                                {searchResults.map((book) => (
                                    <div
                                        key={book.book_id}
                                        className={`flex items-center p-3 border rounded-md hover:bg-secondary cursor-pointer ${
                                            selectedBook?.book_id === book.book_id ? "bg-secondary border-primary" : ""
                                        }`}
                                        onClick={() => setSelectedBook(book)}
                                    >
                                        <img
                                            src={book.cover_image || `/placeholder.svg?height=120&width=80&text=${encodeURIComponent(book.title)}`}
                                            alt={`Cover of ${book.title}`}
                                            className="h-16 w-12 object-cover rounded mr-4"
                                        />
                                        <div>
                                            <h4 className="font-medium">{book.title}</h4>
                                            <p className="text-sm text-muted-foreground">
                                                {book.authors ? book.authors.join(', ') : 'Unknown author'}
                                            </p>
                                            {book.year_published && (
                                                <p className="text-xs text-muted-foreground">Year: {book.year_published}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {selectedBook && (
                        <div className="flex items-center space-x-2 pt-2">
                            <Checkbox 
                                id="journal-privacy" 
                                checked={isPrivate} 
                                onCheckedChange={(checked) => setIsPrivate(checked === true)}
                            />
                            <Label htmlFor="journal-privacy">Make this journal private</Label>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <motion.div 
                        whileHover={{ scale: 1.07 }}
                        whileTap={{ scale: 0.9 }}  
                    > 
                        <Button 
                            onClick={handleCreateJournal} 
                            disabled={!selectedBook || isCreating}
                            className="rounded-full"
                        >
                            {isCreating ? (
                                <>
                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-current"></div>
                                    Creating...
                                </>
                            ) : (
                                "Create Journal"
                            )}
                        </Button>
                    </motion.div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}