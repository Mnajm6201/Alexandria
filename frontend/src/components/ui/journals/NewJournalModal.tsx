"use client"

import { useState } from "react"
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

    type BookType = {
    id: number
    title: string
    author: string
    cover: string
    }

    export function NewJournalModal() {
    const [open, setOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedBook, setSelectedBook] = useState<BookType | null>(null)

    // Mock search results - in a real app, this would come from an API
    const searchResults: BookType[] = [
        {
        id: 1,
        title: "Dune",
        author: "Frank Herbert",
        cover: "/placeholder.svg?height=120&width=80",
        },
        {
        id: 2,
        title: "Dune Messiah",
        author: "Frank Herbert",
        cover: "/placeholder.svg?height=120&width=80",
        },
        {
        id: 3,
        title: "Children of Dune",
        author: "Frank Herbert",
        cover: "/placeholder.svg?height=120&width=80",
        },
    ]

    const handleCreateJournal = () => {
        // In a real app, this would save the new journal to a database
        console.log("Creating journal for book:", selectedBook)
        setOpen(false)
        setSelectedBook(null)
        setSearchQuery("")
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
            <Button>
            <Book className="mr-2 h-4 w-4" />
            New Journal
            </Button>
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
                <Button variant="outline" size="icon">
                    <Search className="h-4 w-4" />
                </Button>
                </div>
            </div>

            {searchQuery && (
                <div className="space-y-2">
                <h3 className="text-sm font-medium">Search Results</h3>
                <div className="grid gap-4 max-h-[300px] overflow-y-auto">
                    {searchResults.map((book) => (
                    <div
                        key={book.id}
                        className={`flex items-center p-3 border rounded-md hover:bg-secondary cursor-pointer ${
                        selectedBook?.id === book.id ? "bg-secondary border-primary" : ""
                        }`}
                        onClick={() => setSelectedBook(book)}
                    >
                        <img
                        src={book.cover || "/placeholder.svg"}
                        alt={`Cover of ${book.title}`}
                        className="h-16 w-12 object-cover rounded mr-4"
                        />
                        <div>
                        <h4 className="font-medium">{book.title}</h4>
                        <p className="text-sm text-muted-foreground">{book.author}</p>
                        </div>
                    </div>
                    ))}
                </div>
                </div>
            )}
            </div>
            <DialogFooter>
            <Button onClick={handleCreateJournal} disabled={!selectedBook}>
                Create Journal
            </Button>
            </DialogFooter>
        </DialogContent>
        </Dialog>
    )
}
