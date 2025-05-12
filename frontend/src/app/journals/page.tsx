"use client"
import { Header } from "@/components/layout/Header"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { NewJournalModal } from "@/components/ui/journals/NewJournalModal"
import { motion } from "framer-motion"

export default function Home() {
  // Mock data for journals
    const journals = [
        {
        id: 1,
        title: "Dune",
        author: "Frank Herbert",
        cover: "https://covers.openlibrary.org/b/id/14896631-L.jpg",
        entryCount: 4,
        lastUpdated: "1 day ago",
        },
        {
        id: 2,
        title: "Pride and Prejudice",
        author: "Jane Austen",
        cover: "https://ia902309.us.archive.org/view_archive.php?archive=/20/items/l_covers_0008/l_covers_0008_09.zip&file=0008095021-L.jpg",
        entryCount: 3,
        lastUpdated: "1 day ago",
        },
        {
        id: 3,
        title: "The Great Gatsby",
        author: "F. Scott Fitzgerald",
        cover: "/Gatsby.jpg",
        entryCount: 3,
        lastUpdated: "19 hours ago",
        },
        {
        id: 4,
        title: "1984",
        author: "George Orwell",
        cover: "https://covers.openlibrary.org/b/id/15017403-L.jpg",
        entryCount: 3,
        lastUpdated: "6 hours ago",
        },
    ]

    return (
        <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-8 max-w-7xl mx-auto px-4 md:px-6">
            <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">My Reading Journals</h1>
            {/* Custom style to match header buttons */}
            <div className="new-journal-button">
                <NewJournalModal />
            </div>
            </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {journals.map((journal) => (
                    <motion.div 
                        key={journal.id}
                        whileHover={{ scale: 1.07 }}
                        whileTap={{ scale: 0.9 }}  
                    > 
                        <Link href={`/journals/journal/${journal.id}`}>
                        <Card className="h-full hover:shadow-md transition-shadow">
                            <CardHeader className="pb-2">
                            <CardTitle className="text-lg">{journal.title}</CardTitle>
                            <CardDescription>{journal.author}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex justify-center pb-2">
                            <img
                                src={journal.cover || "/placeholder.svg"}
                                alt={`Cover of ${journal.title}`}
                                className="h-48 object-cover rounded-md"
                            />
                            </CardContent>
                            <CardFooter className="flex flex-col items-start pt-2">
                            <p className="text-sm text-muted-foreground">{journal.entryCount} entries</p>
                            <p className="text-xs text-muted-foreground">Updated {journal.lastUpdated}</p>
                            </CardFooter>
                        </Card>
                        </Link>
                    </motion.div>
                ))}
                </div>
        </main>
        </div>
    )
}