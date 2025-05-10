// src/components/ui/shelves/EditShelfModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { X, Trash2 } from 'lucide-react'
import { useJWToken } from '../../../utils/getJWToken'

interface Shelf {
  id: number
  name: string
  shelf_desc: string
  is_private: boolean
  shelf_type: string
  creation_date: string
}

interface EditShelfModalProps {
  isOpen: boolean
  onClose: () => void
  shelf: Shelf | null
  onDelete: (shelfId: number) => void
  onUpdate?: (updatedShelf: Shelf) => void
  isLoading: boolean
}

const EditShelfModal = ({
  isOpen,
  onClose,
  shelf,
  onDelete,
  onUpdate,
  isLoading
}: EditShelfModalProps) => {
  const { jwtToken, fetchJWToken } = useJWToken()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [error, setError] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Initialize form with shelf data when it changes
  useEffect(() => {
    if (shelf) {
      setName(shelf.name)
      setDescription(shelf.shelf_desc || '')
      setIsPrivate(shelf.is_private)
      setShowDeleteConfirm(false)
    }
  }, [shelf])


const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!shelf) return;
    
    try {
      setIsUpdating(true);
      const token = jwtToken || await fetchJWToken();
      
      // Simple URL construction
      const url = "http://localhost:8000/" + shelf.id + "/";
      console.log("URL:", url);
      
      // Simple data object
      const data = {
        name: name.trim(),
        shelf_desc: description.trim(),
        is_private: isPrivate
      };
      console.log("Data:", data);
      
     
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      console.log("Response status:", response.status);
      
      if (response.ok) {
        // If successful, update UI and close modal
        if (onUpdate) {
          onUpdate({
            ...shelf,
            name: name.trim(),
            shelf_desc: description.trim(),
            is_private: isPrivate
          });
        }
        onClose();
      } else {
        const text = await response.text();
        console.error("Error response:", text);
        setError(`Failed to update: ${response.status}`);
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Network error");
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isOpen || !shelf) return null

  // delete confirmation
  if (showDeleteConfirm) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <div className="flex flex-col space-y-4">
            <h2 className="text-xl font-serif font-bold text-amber-900">Delete Shelf</h2>
            
            <p className="text-amber-800">
              Are you sure you want to delete the shelf "{shelf.name}"?
            </p>
            
            {shelf.shelf_type !== 'Custom' && (
              <p className="text-sm text-red-500">
                Only custom shelves can be deleted. This is a system {shelf.shelf_type} shelf.
              </p>
            )}
            
            <div className="flex justify-end space-x-3 mt-4">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-amber-800 border border-amber-300 rounded hover:bg-amber-50"
              >
                Cancel
              </button>
              
              <button
                type="button"
                onClick={() => onDelete(shelf.id)}
                disabled={isLoading || shelf.shelf_type !== 'Custom'}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {isLoading ? 'Deleting...' : 'Delete Shelf'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Otherwise show the edit form
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-serif font-bold text-amber-900">Edit Shelf</h2>
          <button onClick={onClose} className="text-amber-700 hover:text-amber-900">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 text-red-500 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="shelf-name" className="block text-amber-800 font-medium mb-1">
              Shelf Name *
            </label>
            <input
              id="shelf-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border border-amber-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="My Favorite Books"
              disabled={shelf.shelf_type !== 'Custom'}
            />
            {shelf.shelf_type !== 'Custom' && (
              <p className="text-xs text-amber-600 mt-1">
                System shelves cannot be renamed
              </p>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="shelf-description" className="block text-amber-800 font-medium mb-1">
              Description (Optional)
            </label>
            <textarea
              id="shelf-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border border-amber-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="A collection of my favorite books"
              rows={3}
              disabled={shelf.shelf_type !== 'Custom'}
            />
          </div>

          <div className="mb-6">
            <label className="flex items-center text-amber-800 font-medium">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="mr-2 h-4 w-4 text-amber-600 border-amber-300 rounded focus:ring-amber-500"
                disabled={shelf.shelf_type !== 'Custom'}
              />
              Make this shelf private
            </label>
          </div>

          <div className="flex justify-between">
            {shelf.shelf_type === 'Custom' && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 text-red-600 border border-red-300 rounded hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 inline mr-1" />
                Delete
              </button>
            )}
            
            <div className={shelf.shelf_type === 'Custom' ? "flex ml-auto" : "flex justify-end w-full"}>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 mr-2 text-amber-800 border border-amber-300 rounded hover:bg-amber-50"
                disabled={isUpdating}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 disabled:opacity-50"
                disabled={isUpdating || shelf.shelf_type !== 'Custom'}
              >
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditShelfModal