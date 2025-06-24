"use client"

import { useState, useEffect } from "react"
import { Book, Search, Plus, Loader2, X } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
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
    page_count?: number
}

interface NewJournalModalProps {
    onJournalCreated?: () => void
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
    const [errors, setErrors] = useState<Record<string, string>>({})
    const { jwtToken, fetchJWToken } = useJWToken()

    useEffect(() => {
        if (!open) {
            resetForm()
        }
    }, [open])

    const resetForm = () => {
        setSearchQuery("")
        setSelectedBook(null)
        setSearchResults([])
        setSearchError("")
        setIsPrivate(false)
        setErrors({})
    }

    // Search books with debounce
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([])
            setSearchError("")
            return
        }
        
        setIsSearching(true)
        
        const debounceTimer = setTimeout(() => {
            performSearch()
        }, 500)

        return () => clearTimeout(debounceTimer)
    }, [searchQuery])

    const performSearch = async () => {
        try {
            setSearchError("")
            
            const token = jwtToken || await fetchJWToken()
            if (!token) {
                throw new Error("Authentication required. Please log in.")
            }

            const response = await fetch(
                `http://127.0.0.1:8000/api/search-bar/?q=${encodeURIComponent(searchQuery)}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    }
                }
            )

            if (!response.ok) {
                throw new Error(`Search failed: ${response.status}`)
            }

            const data = await response.json()
            console.log('Search results:', data)
            
            // Handle different response formats
            const books = data.books || data.results || data || []
            setSearchResults(Array.isArray(books) ? books : [])

        } catch (err) {
            console.error('Search error:', err)
            setSearchError(err instanceof Error ? err.message : "Search failed")
            setSearchResults([])
        } finally {
            setIsSearching(false)
        }
    }

    const handleBookSelect = (book: BookType) => {
        setSelectedBook(book)
        setSearchQuery(book.title)
        setSearchResults([])
        
        // Clear any existing errors
        if (errors.book) {
            setErrors(prev => ({ ...prev, book: "" }))
        }
    }

    const clearSelectedBook = () => {
        setSelectedBook(null)
        setSearchQuery("")
        setSearchResults([])
    }

    const validateForm = () => {
        const newErrors: Record<string, string> = {}

        if (!selectedBook) {
            newErrors.book = "Please select a book for your journal"
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        try {
            setIsCreating(true)

            const token = jwtToken || await fetchJWToken()
            if (!token) {
                toast({
                    title: "Error",
                    description: "Authentication required. Please log in.",
                    variant: "destructive",
                })
                return
            }

            const journalData = {
                book: selectedBook!.book_id,
                is_private: isPrivate
            }

            console.log('Creating journal:', journalData)

            const response = await fetch('http://localhost:8000/api/journals/', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(journalData)
            })

            if (!response.ok) {
                const errorData = await response.json()
                console.error('Journal creation failed:', errorData)
                
                // Handle validation errors from backend
                if (response.status === 400 && errorData) {
                    const backendErrors: Record<string, string> = {}
                    Object.keys(errorData).forEach(key => {
                        if (Array.isArray(errorData[key])) {
                            backendErrors[key] = errorData[key][0]
                        } else {
                            backendErrors[key] = errorData[key]
                        }
                    })
                    setErrors(backendErrors)
                    return
                }
                
                throw new Error(errorData.detail || `Failed to create journal: ${response.status}`)
            }

            const createdJournal = await response.json()
            console.log('Journal created successfully:', createdJournal)

            // Reset form and close modal
            resetForm()
            setOpen(false)
            
            if (onJournalCreated) {
                onJournalCreated()
            }

        } catch (err) {
            console.error('Error creating journal:', err)
            toast({
                title: "Error",
                description: err instanceof Error ? err.message : "Failed to create journal. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsCreating(false)
        }
    }

    const getBookCover = (book: BookType) => {
        return book.cover_image || 
               `https://covers.openlibrary.org/b/isbn/${book.book_id}-M.jpg`
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    New Journal
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create New Reading Journal</DialogTitle>
                    <DialogDescription>
                        Search for a book and start documenting your reading journey.
                    </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Book Search Section */}
                    <div className="space-y-4">
                        <Label htmlFor="book-search">Select a Book *</Label>
                        
                        {selectedBook ? (
                            // Selected book display
                            <Card className="p-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-20 rounded overflow-hidden bg-muted flex-shrink-0">
                                        <img
                                            src={getBookCover(selectedBook)}
                                            alt={selectedBook.title}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement
                                                target.src = '/placeholder-book-cover.jpg'
                                            }}
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold truncate">{selectedBook.title}</h4>
                                        <p className="text-sm text-muted-foreground truncate">
                                            by {selectedBook.authors.join(', ')}
                                        </p>
                                        {selectedBook.year_published && (
                                            <p className="text-xs text-muted-foreground">
                                                Published {selectedBook.year_published}
                                            </p>
                                        )}
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={clearSelectedBook}
                                        disabled={isCreating}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            </Card>
                        ) : (
                            // Search interface
                            <div className="space-y-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        id="book-search"
                                        placeholder="Search for a book by title, author, or ISBN..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        disabled={isCreating}
                                        className={`pl-10 ${errors.book ? "border-red-500" : ""}`}
                                    />
                                </div>

                                {/* Search Results */}
                                {isSearching && (
                                    <div className="flex items-center justify-center py-4">
                                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                        <span className="text-sm text-muted-foreground">Searching...</span>
                                    </div>
                                )}

                                {searchError && (
                                    <div className="text-sm text-red-500 bg-red-50 p-3 rounded">
                                        {searchError}
                                    </div>
                                )}

                                {searchResults.length > 0 && (
                                    <div className="max-h-60 overflow-y-auto space-y-2 border rounded-md p-2">
                                        {searchResults.map((book) => (
                                            <motion.div
                                                key={book.book_id}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <Card 
                                                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                                                    onClick={() => handleBookSelect(book)}
                                                >
                                                    <CardContent className="p-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-12 h-16 rounded overflow-hidden bg-muted flex-shrink-0">
                                                                <img
                                                                    src={getBookCover(book)}
                                                                    alt={book.title}
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => {
                                                                        const target = e.target as HTMLImageElement
                                                                        target.src = '/placeholder-book-cover.jpg'
                                                                    }}
                                                                />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="font-medium text-sm truncate">{book.title}</h4>
                                                                <p className="text-xs text-muted-foreground truncate">
                                                                    by {book.authors.join(', ')}
                                                                </p>
                                                                {book.year_published && (
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {book.year_published}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}

                                {searchQuery && !isSearching && searchResults.length === 0 && !searchError && (
                                    <div className="text-sm text-muted-foreground text-center py-4">
                                        No books found. Try a different search term.
                                    </div>
                                )}
                            </div>
                        )}

                        {errors.book && (
                            <p className="text-sm text-red-500">{errors.book}</p>
                        )}
                    </div>

                    {/* Privacy Setting */}
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="is_private"
                            checked={isPrivate}
                            onCheckedChange={(checked) => setIsPrivate(!!checked)}
                            disabled={isCreating}
                        />
                        <Label 
                            htmlFor="is_private" 
                            className="text-sm font-normal cursor-pointer"
                        >
                            Make this journal private
                        </Label>
                    </div>

                    <DialogFooter>
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setOpen(false)}
                            disabled={isCreating}
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={isCreating || !selectedBook}
                            className="gap-2"
                        >
                            {isCreating ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Book className="w-4 h-4" />
                                    Create Journal
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}