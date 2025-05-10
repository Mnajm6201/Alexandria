'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import ShelfComponent from '@/components/ui/shelves/ShelfComponent'
import { BookOpen, Lock } from 'lucide-react'
import { useJWToken } from '../../../utils/getJWToken'
import Link from 'next/link'

interface Edition {
  id: string
  edition_id: number
  edition_title: string
  edition_format: string
  isbn: string
  publication_year: number
  cover_image: string
  authors: Array<{ id: number, name: string }>
}

interface Shelf {
  id: number
  name: string
  shelf_desc: string
  is_private: boolean
  shelf_type: string
  shelf_img?: string
  creation_date: string
}

export default function PublicShelvesPage() {
  // Get username from URL
  const [username, setUsername] = useState<string>('')
  const [shelves, setShelves] = useState<Shelf[]>([])
  const [shelfEditions, setShelfEditions] = useState<Record<number, Edition[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userNotFound, setUserNotFound] = useState(false)
  const [authRequired, setAuthRequired] = useState(false)
  
  // Get JWT token
  const { jwtToken, fetchJWToken } = useJWToken()

  // Get username from URL on first render
  useEffect(() => {
    const pathname = window.location.pathname
    const match = pathname.match(/\/shelves\/([^/]+)/)
    if (match && match[1]) {
      setUsername(match[1])
    }
  }, [])

  // Fetch user's public shelves
  useEffect(() => {
    if (!username) return

    async function fetchPublicShelves() {
      try {
        setLoading(true)
        setError(null)
        setUserNotFound(false)
        setAuthRequired(false)
        
        console.log(`Fetching public shelves for user: ${username}`)
        
        // Try to get JWT token if available
        const token = jwtToken || await fetchJWToken().catch(() => null)
        
        // Prepare headers - include auth token if available
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`
        }
        
        const response = await fetch(`http://localhost:8000/?username=${encodeURIComponent(username)}`, {
          method: 'GET',
          headers
        })
        
        console.log('Response status:', response.status)
        
        if (response.status === 401) {
          setAuthRequired(true)
          throw new Error('Authentication required to view shelves')
        }
        
        if (response.status === 404) {
          setUserNotFound(true)
          throw new Error('User not found')
        }
        
        if (!response.ok) {
          let errorMessage
          try {
            const errorData = await response.text()
            console.error('Error response:', errorData)
            errorMessage = 'Failed to load shelves. Please try again.'
          } catch (e) {
            errorMessage = `Server error: ${response.status}`
          }
          throw new Error(errorMessage)
        }
        
        // Parse JSON response
        const responseText = await response.text()
        console.log('Response text preview:', responseText.substring(0, 100))
        
        if (!responseText.trim()) {
          console.log('Empty response - treating as empty shelves list')
          setShelves([])
          setLoading(false)
          return
        }
        
        try {
          const shelvesData = JSON.parse(responseText)
          console.log('Parsed shelves data:', shelvesData)
          setShelves(shelvesData)
          
          // Only fetch editions if we have shelves
          if (shelvesData && shelvesData.length > 0) {
            for (const shelf of shelvesData) {
              fetchShelfEditions(shelf.id, token)
            }
          }
        } catch (parseError) {
          console.error('Error parsing shelves JSON:', parseError)
          setError('Could not parse server response. Please try again later.')
        }
      } catch (err) {
        console.error('Error fetching shelves:', err)
        if (!authRequired && !userNotFound) {
          setError(err instanceof Error ? err.message : 'Unknown error occurred')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchPublicShelves()
  }, [username, jwtToken, fetchJWToken])

  const fetchShelfEditions = async (shelfId: number, token: string | null) => {
    try {
      console.log(`Fetching editions for shelf ${shelfId}...`)
      
      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      const editionsResponse = await fetch(`http://localhost:8000/${shelfId}/editions/`, {
        method: 'GET',
        headers
      })

      console.log(`Editions response status: ${editionsResponse.status}`)

      if (!editionsResponse.ok) {
        console.error(`Failed to fetch editions for shelf ${shelfId}: ${editionsResponse.status}`)
        return
      }

      const editionsText = await editionsResponse.text()
      
      if (!editionsText.trim()) {
        console.log(`No editions found for shelf ${shelfId}`)
        setShelfEditions(prev => ({
          ...prev,
          [shelfId]: []
        }))
        return
      }

      try {
        const editionsData = JSON.parse(editionsText)
        console.log(`Retrieved ${editionsData.length} editions for shelf ${shelfId}`)
        
        setShelfEditions(prev => ({
          ...prev,
          [shelfId]: editionsData
        }))
      } catch (parseError) {
        console.error(`Error parsing editions JSON for shelf ${shelfId}:`, parseError)
      }
    } catch (err) {
      console.error(`Error fetching editions for shelf ${shelfId}:`, err)
    }
  }

  return (
    <div className="min-h-screen bg-amber-50">
      <Header variant="app" />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-serif font-bold text-amber-900">
            {username ? `${username}'s Shelves` : 'Public Shelves'}
          </h1>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-amber-800">Loading shelves...</p>
          </div>
        ) : authRequired ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Lock className="h-16 w-16 mx-auto text-amber-400 mb-4" />
            <h2 className="text-xl font-semibold text-amber-900 mb-2">Sign in Required</h2>
            <p className="text-amber-700 mb-4">You need to be signed in to view this user's shelves.</p>
            <Link href="/auth/sign-in" className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 inline-block">
              Sign In
            </Link>
          </div>
        ) : userNotFound ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <BookOpen className="h-16 w-16 mx-auto text-amber-400 mb-4" />
            <h2 className="text-xl font-semibold text-amber-900 mb-2">User Not Found</h2>
            <p className="text-amber-700">We couldn't find a user with this username.</p>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            <p>{error}</p>
          </div>
        ) : shelves.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <BookOpen className="h-16 w-16 mx-auto text-amber-400 mb-4" />
            <h2 className="text-xl font-semibold text-amber-900 mb-2">No Public Shelves</h2>
            <p className="text-amber-700">This user doesn't have any public shelves to display.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {shelves.map((shelf) => (
              <ShelfComponent
                key={shelf.id}
                id={shelf.id.toString()}
                name={shelf.name}
                description={shelf.shelf_desc}
                is_private={shelf.is_private}
                editions={shelfEditions[shelf.id] || []}
                isOwner={false} // Important: never show edit controls for public view
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}