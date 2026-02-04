"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Header } from "@/components/layout/Header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Book, Calendar, Trash2, Loader2, ChevronDown, ChevronUp } from "lucide-react"
import Link from "next/link"
import { NewEntryModal } from "@/components/ui/journals/NewEntryModal"
import { EditEntryModal } from "@/components/ui/journals/EditEntryModal"
import { FormPrivacySlider } from "@/components/ui/privacy-slider"
import { motion, AnimatePresence } from "framer-motion"
import { useJWToken } from "@/utils/getJWToken"
import { toast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface JournalEntry {
  id: number
  title: string
  content: string
  page_num: number | null
  is_private: boolean
  created_on: string
  updated_on: string
}


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

export default function JournalDetailPage() {
  const params = useParams()
  const router = useRouter()
  const journalId = String(params.id)
  
  const [journal, setJournal] = useState<Journal | null>(null)
  const [bookInfo, setBookInfo] = useState<BookInfo | null>(null)
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [entriesLoading, setEntriesLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingEntryId, setDeletingEntryId] = useState<number | null>(null)
  
  // State for interactive features
  const [expandedEntries, setExpandedEntries] = useState<Set<number>>(new Set())
  const [showFullContent, setShowFullContent] = useState<Set<number>>(new Set())
  
  // State for privacy slider
  const [updatingPrivacy, setUpdatingPrivacy] = useState(false)
  
  const { jwtToken, fetchJWToken } = useJWToken()

  useEffect(() => {
    if (journalId) {
      fetchJournal()
      fetchEntries()
    }
  }, [journalId])

  const fetchJournal = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = jwtToken || await fetchJWToken()
      if (!token) {
        setError("Authentication required")
        return
      }

      const response = await fetch(`http://localhost:8000/api/journals/${journalId}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      })

      if (response.status === 404) {
        setError("Journal not found")
        return
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch journal: ${response.status}`)
      }

      const data = await response.json()
      console.log('Fetched journal:', data)
      setJournal(data)

      // Fetch book info using the book_id from the journal
      if (data.book_id) {
        fetchBookInfo(data.book_id, token)
      }

    } catch (err) {
      console.error('Error fetching journal:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch journal')
    } finally {
      setLoading(false)
    }
  }

  const fetchBookInfo = async (bookId: string, token: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/book/${bookId}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      })

      if (response.ok) {
        const data = await response.json()
        setBookInfo(data)
      } else {
        console.warn(`Failed to fetch book info for ${bookId}:`, response.status)
      }
    } catch (err) {
      console.error(`Error fetching book info for ${bookId}:`, err)
    }
  }

  const fetchEntries = async () => {
    try {
      setEntriesLoading(true)

      const token = jwtToken || await fetchJWToken()
      if (!token) {
        return
      }

      const response = await fetch(`http://localhost:8000/api/journals/${journalId}/entries/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch entries: ${response.status}`)
      }

      const data = await response.json()
      // Handle both paginated and non-paginated responses
      const entriesData = data.results || data
      setEntries(entriesData)

    } catch (err) {
      console.error('Error fetching entries:', err)
      toast({
        title: "Error",
        description: "Failed to load journal entries",
        variant: "destructive",
      })
    } finally {
      setEntriesLoading(false)
    }
  }

  const handleJournalPrivacyChange = async (isPrivate: boolean) => {
    if (!journal) return

    try {
      setUpdatingPrivacy(true)

      const token = jwtToken || await fetchJWToken()
      if (!token) {
        toast({
          title: "Error",
          description: "Authentication required",
          variant: "destructive",
        })
        return
      }

      const response = await fetch(`http://localhost:8000/api/journals/${journalId}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_private: isPrivate })
      })

      if (!response.ok) {
        throw new Error(`Failed to update journal privacy: ${response.status}`)
      }

      const updatedJournal = await response.json()
      setJournal(updatedJournal)

      toast({
        title: "Success",
        description: `Journal is now ${isPrivate ? 'private' : 'public'}`,
      })

    } catch (err) {
      console.error('Error updating journal privacy:', err)
      toast({
        title: "Error",
        description: "Failed to update journal privacy",
        variant: "destructive",
      })
    } finally {
      setUpdatingPrivacy(false)
    }
  }

  const handleEntryCreated = () => {
    fetchEntries()
    toast({
      title: "Success",
      description: "Entry created successfully!",
    })
  }

  const handleEntryUpdated = () => {
    fetchEntries()
    toast({
      title: "Success",
      description: "Entry updated successfully!",
    })
  }

  const handleDeleteEntry = async (entryId: number) => {
    try {
      setDeletingEntryId(entryId)

      const token = jwtToken || await fetchJWToken()
      if (!token) {
        toast({
          title: "Error",
          description: "Authentication required",
          variant: "destructive",
        })
        return
      }

      const response = await fetch(`http://localhost:8000/api/entries/${entryId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete entry')
      }

      // Remove the entry from the local state
      setEntries(prev => prev.filter(entry => entry.id !== entryId))
      
      // Clean up expanded/show full content state
      setExpandedEntries(prev => {
        const newSet = new Set(prev)
        newSet.delete(entryId)
        return newSet
      })
      setShowFullContent(prev => {
        const newSet = new Set(prev)
        newSet.delete(entryId)
        return newSet
      })
      
      toast({
        title: "Success",
        description: "Entry deleted successfully",
      })

    } catch (err) {
      console.error('Error deleting entry:', err)
      toast({
        title: "Error", 
        description: "Failed to delete entry",
        variant: "destructive",
      })
    } finally {
      setDeletingEntryId(null)
    }
  }

  // Interactive handlers
  const toggleEntryExpansion = (entryId: number) => {
    setExpandedEntries(prev => {
      const newSet = new Set(prev)
      if (newSet.has(entryId)) {
        newSet.delete(entryId)
      } else {
        newSet.add(entryId)
      }
      return newSet
    })
  }

  const toggleShowFullContent = (entryId: number) => {
    setShowFullContent(prev => {
      const newSet = new Set(prev)
      if (newSet.has(entryId)) {
        newSet.delete(entryId)
      } else {
        newSet.add(entryId)
      }
      return newSet
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + "..."
  }

  const getBookCover = () => {
    if (bookInfo?.cover_image) {
      return bookInfo.cover_image
    }
    
    if (journal?.book_id) {
      return `https://covers.openlibrary.org/b/isbn/${journal.book_id}-L.jpg`
    }
    
    return '/placeholder-book-cover.jpg'
  }

  const getBookAuthors = () => {
    if (bookInfo?.authors) {
      return bookInfo.authors.map(author => author.name).join(', ')
    }
    return "Authors not available"
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-8 mx-52">
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-muted-foreground">Loading journal...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error || !journal) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-8 mx-52">
          <div className="flex flex-col items-center gap-4 py-16">
            <Book className="h-16 w-16 text-muted-foreground" />
            <h2 className="text-xl font-semibold">
              {error === "Journal not found" ? "Journal not found" : "Failed to load journal"}
            </h2>
            <p className="text-muted-foreground text-center max-w-md">
              {error || "Something went wrong while loading the journal."}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.back()}>
                Go Back
              </Button>
              {error !== "Journal not found" && (
                <Button onClick={fetchJournal}>
                  Try Again
                </Button>
              )}
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8 mx-52">
        {/* Back navigation */}
        <Link href="/journals" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Journals
        </Link>

        {/* Journal header */}
        <div className="flex gap-6 mb-8">
          <div className="relative w-32 h-48 rounded-lg overflow-hidden bg-muted flex-shrink-0">
            <img
              src={getBookCover()}
              alt={journal.book_title}
              className="object-cover w-full h-full"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = '/placeholder-book-cover.jpg'
              }}
            />
          </div>
          
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{journal.book_title}</h1>
                <p className="text-lg text-muted-foreground mb-2">
                  by {getBookAuthors()}
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Created {formatDate(journal.created_on)}</span>
                  <span>•</span>
                  <span>{entries.length} entries</span>
                  {bookInfo?.year_published && (
                    <>
                      <span>•</span>
                      <span>Published {bookInfo.year_published}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-3">
                <FormPrivacySlider
                  value={journal.is_private}
                  onValueChange={handleJournalPrivacyChange}
                  disabled={updatingPrivacy}
                  className="self-start"
                />
                {updatingPrivacy && (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span className="text-xs text-muted-foreground">Updating...</span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {journal.is_private ? "Only you can see this journal" : "Public journal - others can view"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Entries section */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Journal Entries</h2>
          <NewEntryModal journalId={parseInt(journalId)} onEntryCreated={handleEntryCreated} />
        </div>

        {entriesLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12">
            <Book className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No entries yet</h3>
            <p className="text-muted-foreground mb-4">
              Start documenting your reading journey by adding your first entry.
            </p>
            <NewEntryModal journalId={parseInt(journalId)} onEntryCreated={handleEntryCreated} />
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => {
              const isExpanded = expandedEntries.has(entry.id)
              const showFull = showFullContent.has(entry.id)
              const needsTruncation = entry.content.length > 150

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader 
                      className="cursor-pointer"
                      onClick={() => toggleEntryExpansion(entry.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <CardTitle className="text-xl">{entry.title}</CardTitle>
                            <div className="flex items-center gap-2">
                              {entry.is_private && (
                                <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full">
                                  Private Entry
                                </span>
                              )}
                              <div className="ml-auto">
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </div>
                            </div>
                          </div>
                          <CardDescription className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatDate(entry.created_on)}
                            </span>
                            {entry.page_num && (
                              <span className="flex items-center gap-1">
                                <Book className="w-4 h-4" />
                                Page {entry.page_num}
                              </span>
                            )}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <CardContent>
                            <div className="mb-4">
                              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                {showFull || !needsTruncation 
                                  ? entry.content 
                                  : truncateContent(entry.content)
                                }
                              </p>
                              {needsTruncation && (
                                <Button 
                                  variant="link" 
                                  className="p-0 h-auto mt-2"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toggleShowFullContent(entry.id)
                                  }}
                                >
                                  {showFull ? "Show less" : "Read more"}
                                </Button>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2 pt-2 border-t">
                              <EditEntryModal entry={entry} onEntryUpdated={handleEntryUpdated} />
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    disabled={deletingEntryId === entry.id}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {deletingEntryId === entry.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="w-4 h-4" />
                                    )}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Entry</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{entry.title}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleDeleteEntry(entry.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </CardContent>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}