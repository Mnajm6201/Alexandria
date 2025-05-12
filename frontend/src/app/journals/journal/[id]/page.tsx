"use client"

import { useParams } from "next/navigation"
import { Header } from "@/components/layout/Header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Book } from "lucide-react"
import Link from "next/link"
import { NewEntryModal } from "@/components/ui/journals/NewEntryModal"
import { motion } from "framer-motion"

type JournalEntry = {
  id: number
  title: string
  pages: string
  excerpt: string
  date: string
}

type Journal = {
  title: string
  author: string
  cover: string
  entries: JournalEntry[]
}

const mockJournals: Record<string, Journal> = {
  "1": {
    title: "Dune",
    author: "Frank Herbert",
    cover: "https://covers.openlibrary.org/b/id/14896631-L.jpg",
    entries: [
      {
        id: 1,
        title: "Beginning the Journey",
        pages: "1-25",
        excerpt: "Initial thoughts on Arrakis and the Atreides family...",
        date: "May 9, 2025",
      },
      {
        id: 2,
        title: "Paul's Training",
        pages: "26-50",
        excerpt: "Reflections on the Bene Gesserit teachings and Paul's abilities...",
        date: "May 9, 2025",
      },
      {
        id: 3,
        title: "The Spice Must Flow",
        pages: "51-75",
        excerpt: "Analysis of the economic and political implications of spice...",
        date: "May 9, 2025",
      },
      {
        id: 4,
        title: "Desert Power",
        pages: "76-100",
        excerpt: "Thoughts on the Fremen culture and their relationship with the desert...",
        date: "May 9, 2025",
      },
    ],
  },
  "2": {
    title: "Pride and Prejudice",
    author: "Jane Austen",
    cover:
      "https://ia902309.us.archive.org/view_archive.php?archive=/20/items/l_covers_0008/l_covers_0008_09.zip&file=0008095021-L.jpg",
    entries: [
      {
        id: 1,
        title: "Meeting the Bennets",
        pages: "1-20",
        excerpt:
          "Introduced to the lively Bennet household and their social aspirations...",
        date: "May 9, 2025",
      },
      {
        id: 2,
        title: "Mr. Darcy's Demeanor",
        pages: "21-40",
        excerpt: "Mr. Darcy appears cold and proud—why is he so misunderstood?",
        date: "May 9, 2025",
      },
      {
        id: 3,
        title: "Elizabeth’s Wit",
        pages: "41-60",
        excerpt:
          "Elizabeth Bennet’s intelligence and wit shine in every scene...",
        date: "May 9, 2025",
      },
    ],
  },
  "3": {
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    cover: "/Gatsby.jpg",
    entries: [
      {
        id: 1,
        title: "The Mysterious Gatsby",
        pages: "1-30",
        excerpt:
          "Introduced to the opulent world of West Egg and the elusive Gatsby...",
        date: "May 10, 2025",
      },
      {
        id: 2,
        title: "A Glimpse of Daisy",
        pages: "31-50",
        excerpt:
          "Nick narrates his growing fascination with Gatsby and Daisy...",
        date: "May 10, 2025",
      },
      {
        id: 3,
        title: "Party and Illusion",
        pages: "51-80",
        excerpt: "Lavish parties mask deep longing and loneliness...",
        date: "May 10, 2025",
      },
    ],
  },
  "4": {
    title: "1984",
    author: "George Orwell",
    cover: "https://covers.openlibrary.org/b/id/15017403-L.jpg",
    entries: [
      {
        id: 1,
        title: "Big Brother is Watching",
        pages: "1-30",
        excerpt: "Winston begins questioning the oppressive regime...",
        date: "May 12, 2025",
      },
      {
        id: 2,
        title: "Thoughtcrime",
        pages: "31-60",
        excerpt: "Introduction to the terrifying concept of thoughtcrime...",
        date: "May 12, 2025",
      },
      {
        id: 3,
        title: "The Diary",
        pages: "61-90",
        excerpt: "Winston writes secret thoughts, risking everything...",
        date: "May 12, 2025",
      },
    ],
  },
}

export default function JournalPage() {
  const params = useParams()
  const journalId = String(params.id)
  const journal = mockJournals[journalId]

  if (!journal) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-8 mx-52 text-red-500">Journal not found.</main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8 mx-52">
        <motion.div whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.9 }}>
          <Link
            href="/journals"
            className="flex items-center text-primary mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Journals
          </Link>
        </motion.div>

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
            <p className="text-lg text-muted-foreground mb-4">
              by {journal.author}
            </p>
            <p className="mb-6">
              Your reading journal for this book contains {journal.entries.length} entries.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Journal Entries</h2>
          <NewEntryModal journalId={journalId} bookTitle={journal.title} />
        </div>

        <div>
          {journal.entries.map((entry) => (
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.9 }} key={entry.id}>
                <Link
                href={`/journals/journal/${journalId}/entries/${entry.id}`}
                className="block mb-6"
                >
                <Card className="hover:shadow-md transition-shadow p-4">
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
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  )
}