// src/components/ui/shelves/AddToShelfModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Check, Loader2 } from 'lucide-react'
import { useJWToken } from '../../../utils/getJWToken'

interface Shelf {
  id: number
  name: string
  shelf_type: string
  is_private: boolean
}

interface AddToShelfModalProps {
  isOpen: boolean
  onClose: () => void
  editionId: number
  onSuccess?: () => void
}

const AddToShelfModal: React.FC<AddToShelfModalProps> = ({
  isOpen,
  onClose,
  editionId,
  onSuccess
}) => {
  const { jwtToken, fetchJWToken } = useJWToken()
  const [shelves, setShelves] = useState<Shelf[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<number | null>(null)

  // Fetch user's shelves when modal opens
  useEffect(() => {
    if (!isOpen) return
    
    const fetchShelves = async () => {
      try {
        setLoading(true)
        setError(null)

        const token = jwtToken || await fetchJWToken()
        if (!token) {
          setError('Authentication required')
          return
        }

        const response = await fetch('http://localhost:8000/', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error('Failed to load shelves')
        }

        const data = await response.json()
        setShelves(data)
      } catch (err) {
        console.error('Error fetching shelves:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchShelves()
  }, [isOpen, jwtToken, fetchJWToken])

  // Add edition to shelf
  const handleAddToShelf = async (shelfId: number) => {
    try {
      setAdding(shelfId)
      setError(null)

      const token = jwtToken || await fetchJWToken()
      if (!token) {
        setError('Authentication required')
        return
      }

      const response = await fetch(`http://localhost:8000/${shelfId}/add_edition/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ edition_id: editionId })
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(errorData || 'Failed to add to shelf')
      }

      // Show success indicator
      setSuccess(shelfId)
      
      // Call success callback if provided
      if (onSuccess) {
        setTimeout(() => {
          onSuccess()
        }, 1000) // Delay to show success state
      }
    } catch (err) {
      console.error('Error adding to shelf:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setAdding(null)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-serif font-bold text-amber-900">Add to Shelf</h2>
          <button onClick={onClose} className="text-amber-700 hover:text-amber-900">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="overflow-y-auto flex-grow">
          {loading ? (
            <div className="py-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-amber-600" />
              <p className="mt-2 text-amber-800">Loading your shelves...</p>
            </div>
          ) : shelves.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-amber-800 mb-4">You don't have any shelves yet.</p>
              <button 
                className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 inline-flex items-center"
                onClick={() => {
                  onClose()
                  // You could add logic here to redirect to the shelves page
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create a Shelf
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-amber-200">
              {shelves.map((shelf) => (
                <li key={shelf.id} className="py-3">
                  <button
                    onClick={() => handleAddToShelf(shelf.id)}
                    disabled={adding !== null || success === shelf.id}
                    className="w-full flex items-center justify-between px-3 py-2 rounded hover:bg-amber-50 disabled:opacity-70"
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-medium text-amber-900">{shelf.name}</span>
                      <span className="text-xs text-amber-600">
                        {shelf.is_private ? 'Private' : 'Public'} • {shelf.shelf_type}
                      </span>
                    </div>
                    <div>
                      {adding === shelf.id ? (
                        <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
                      ) : success === shelf.id ? (
                        <Check className="h-5 w-5 text-green-600" />
                      ) : (
                        <Plus className="h-5 w-5 text-amber-600" />
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default AddToShelfModal