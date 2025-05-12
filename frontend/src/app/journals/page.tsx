import { Header } from "@/components/layout/Header"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { NewJournalModal } from "@/components/ui/journals/NewJournalModal"

export default function Home() {
  // Mock data for journals
    const journals = [
        {
        id: 1,
        title: "Dune",
        author: "Frank Herbert",
        cover: "/placeholder.svg?height=200&width=150",
        entryCount: 12,
        lastUpdated: "2 days ago",
        },
        {
        id: 2,
        title: "Foundation",
        author: "Isaac Asimov",
        cover: "/placeholder.svg?height=200&width=150",
        entryCount: 8,
        lastUpdated: "1 week ago",
        },
        {
        id: 3,
        title: "The Lord of the Rings",
        author: "J.R.R. Tolkien",
        cover: "/placeholder.svg?height=200&width=150",
        entryCount: 15,
        lastUpdated: "3 days ago",
        },
        {
        id: 4,
        title: "1984",
        author: "George Orwell",
        cover: "/placeholder.svg?height=200&width=150",
        entryCount: 5,
        lastUpdated: "1 month ago",
        },
    ]

    return (
        <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-8">
            <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">My Reading Journals</h1>
            <NewJournalModal />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {journals.map((journal) => (
                <Link href={`/journals/journal/${journal.id}`} key={journal.id}>
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
            ))}
            </div>
        </main>
        </div>
    )
}
