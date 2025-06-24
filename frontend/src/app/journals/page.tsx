"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/layout/Header"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { NewJournalModal } from "@/components/ui/journals/NewJournalModal"
import { motion } from "framer-motion"
import { useJWToken } from "@/utils/getJWToken"
import { BookOpen, Calendar, Eye, EyeOff, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface Journal {
  id: number
  book_id: string
  book_title: string
  user_username: string
  user_id: number
  is_private: boolean
  created_on: string
  updated_on: string
  entry_count: number
  latest_entry?: {
    id: number
    title: string
    updated_on: string
    is_private: boolean
  }
}


interface BookInfo {
  book_id: string
  title: string
  summary: string
  average_rating: number
  year_published: number
  original_language: string
  authors: Array<{
    id: string
    name: string
    author_image?: string
  }>
  genres: Array<{
    id: number
    name: string
  }>
  cover_image?: string
}

export default function JournalsPage() {
  const [journals, setJournals] = useState<Journal[]>([])
  const [bookInfoCache, setBookInfoCache] = useState<Record<string, BookInfo>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { jwtToken, fetchJWToken } = useJWToken()

  useEffect(() => {
    fetchJournals()
  }, [])

  const fetchJournals = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = jwtToken || await fetchJWToken()
      if (!token) {
        setError("Authentication required")
        return
      }

      const response = await fetch('http://localhost:8000/api/journals/my_journals/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch journals: ${response.status}`)
      }

      const data = await response.json()
      console.log('Fetched journals:', data)
      
      // Handle both paginated and non-paginated responses
      const journalsData = data.results || data
      setJournals(journalsData)

      // Fetch book info for all unique book_ids
      const uniqueBookIds = [...new Set(journalsData.map((journal: Journal) => journal.book_id))] as string[]
      await fetchBookInfoBatch(uniqueBookIds, token)

    } catch (err) {
      console.error('Error fetching journals:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch journals')
      toast({
        title: "Error",
        description: "Failed to load journals. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchBookInfoBatch = async (bookIds: string[], token: string) => {
    try {
      // Fetch book info for all book IDs in parallel
      const bookPromises = bookIds.map(bookId => fetchBookInfo(bookId, token))
      const bookResults = await Promise.allSettled(bookPromises)
      
      const newBookCache: Record<string, BookInfo> = {}
      bookResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          newBookCache[bookIds[index]] = result.value
        }
      })
      
      setBookInfoCache(prev => ({ ...prev, ...newBookCache }))
    } catch (err) {
      console.error('Error fetching book info batch:', err)
    }
  }

  const fetchBookInfo = async (bookId: string, token: string): Promise<BookInfo | null> => {
    try {
      const response = await fetch(`http://localhost:8000/api/book/${bookId}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        console.warn(`Failed to fetch book info for ${bookId}:`, response.status)
        return null
      }

      return await response.json()
    } catch (err) {
      console.error(`Error fetching book info for ${bookId}:`, err)
      return null
    }
  }

  const handleJournalCreated = () => {
    // Refresh the journals list when a new journal is created
    fetchJournals()
    toast({
      title: "Success",
      description: "Journal created successfully!",
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
    
    return date.toLocaleDateString()
  }

  const getBookCover = (journal: Journal) => {
    // First try to get cover from our book API cache
    const bookInfo = bookInfoCache[journal.book_id]
    if (bookInfo?.cover_image) {
      return bookInfo.cover_image
    }
    
    // Fallback to OpenLibrary using the book_id
    return `https://covers.openlibrary.org/b/isbn/${journal.book_id}-L.jpg`
  }

  const getBookAuthors = (journal: Journal) => {
    const bookInfo = bookInfoCache[journal.book_id]
    if (bookInfo?.authors) {
      return bookInfo.authors.map(author => author.name).join(', ')
    }
    
    // Fallback - we don't have author info in the journal response
    return "Loading authors..."
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-8 max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-muted-foreground">Loading your journals...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-8 max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center gap-4 py-16">
            <BookOpen className="h-16 w-16 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Failed to load journals</h2>
            <p className="text-muted-foreground text-center max-w-md">
              {error}
            </p>
            <Button onClick={fetchJournals} variant="outline">
              Try Again
            </Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-8 max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Reading Journals</h1>
            <p className="text-muted-foreground mt-2">
              {journals.length} journal{journals.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="new-journal-button">
            <NewJournalModal onJournalCreated={handleJournalCreated} />
          </div>
        </div>

        {journals.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16">
            <BookOpen className="h-16 w-16 text-muted-foreground" />
            <h2 className="text-xl font-semibold">No journals yet</h2>
            <p className="text-muted-foreground text-center max-w-md">
              Start your reading journey by creating your first journal. 
              Track your thoughts, insights, and progress as you read.
            </p>
            <NewJournalModal onJournalCreated={handleJournalCreated} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {journals.map((journal) => (
              <motion.div 
                key={journal.id}
                whileHover={{ scale: 1.07 }}
                whileTap={{ scale: 0.9 }}  
              > 
                <Link href={`/journals/journal/${journal.id}`}>
                  <Card className="h-full hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="relative aspect-[3/4] mb-4 rounded-md overflow-hidden bg-muted">
                        <img
                          src={getBookCover(journal)}
                          alt={journal.book_title}
                          className="object-cover w-full h-full"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = '/placeholder-book-cover.jpg'
                          }}
                        />
                      </div>
                      <CardTitle className="text-lg line-clamp-2">
                        {journal.book_title}
                      </CardTitle>
                      <CardDescription>
                        by {getBookAuthors(journal)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <BookOpen className="w-4 h-4" />
                          <span>{journal.entry_count || 0} entries</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          {journal.is_private ? (
                            <>
                              <EyeOff className="w-4 h-4" />
                              <span>Private</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4" />
                              <span>Public</span>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>Updated {formatDate(journal.updated_on)}</span>
                      </div>
                    </CardFooter>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}