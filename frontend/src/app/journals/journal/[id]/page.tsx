import { Header } from "@/components/layout/Header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Book } from "lucide-react"
import Link from "next/link"
import { NewEntryModal } from "@/components/ui/journals/NewEntryModal"
import Head from "next/head"

export default function JournalPage({ params }: { params: { id: string } }) {
  // Mock data for a specific journal
    const journal = {
        id: params.id,
        title: "Dune",
        author: "Frank Herbert",
        cover: "/placeholder.svg?height=300&width=200",
        entries: [
        {
            id: 1,
            title: "Beginning the journey",
            pages: "1-25",
            excerpt: "Initial thoughts on Arrakis and the Atreides family...",
            date: "April 15, 2025",
        },
        {
            id: 2,
            title: "Paul's training",
            pages: "26-50",
            excerpt: "Reflections on the Bene Gesserit teachings and Paul's abilities...",
            date: "April 18, 2025",
        },
        {
            id: 3,
            title: "The spice must flow",
            pages: "51-75",
            excerpt: "Analysis of the economic and political implications of spice...",
            date: "April 20, 2025",
        },
        {
            id: 4,
            title: "Desert power",
            pages: "76-100",
            excerpt: "Thoughts on the Fremen culture and their relationship with the desert...",
            date: "April 23, 2025",
        },
        ],
    }

    return (
        <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-8">
            <Link href="/journals" className="flex items-center text-primary mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Journals
            </Link>

            <div className="flex flex-col md:flex-row gap-8 mb-8">
            <div className="flex-shrink-0">
                <img
                src={journal.cover || "/placeholder.svg"}
                alt={`Cover of ${journal.title}`}
                className="rounded-md w-40 md:w-48"
                />
            </div>
            <div>
                <h1 className="text-3xl font-bold mb-2">{journal.title}</h1>
                <p className="text-lg text-muted-foreground mb-4">by {journal.author}</p>
                <p className="mb-6">Your reading journal for this book contains {journal.entries.length} entries.</p>
                <NewEntryModal journalId={journal.id} bookTitle={journal.title} />
            </div>
            </div>

            <h2 className="text-2xl font-semibold mb-4">Journal Entries</h2>
            <div className="space-y-4">
            {journal.entries.map((entry) => (
                <Link href={`/journals/journal/${journal.id}/entries/${entry.id}`} key={entry.id}>
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                    <div className="flex justify-between">
                        <CardTitle className="text-lg">{entry.title}</CardTitle>
                        <span className="text-sm text-muted-foreground">{entry.date}</span>
                    </div>
                    <CardDescription className="flex items-center">
                        <Book className="h-3 w-3 mr-1" />
                        Pages {entry.pages}
                    </CardDescription>
                    </CardHeader>
                    <CardContent>
                    <p className="text-sm line-clamp-2">{entry.excerpt}</p>
                    </CardContent>
                </Card>
                </Link>
            ))}
            </div>
        </main>
        </div>
    )
}
