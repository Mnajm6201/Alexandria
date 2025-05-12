'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { motion } from 'framer-motion'

interface NewShelfModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (shelfData: {
    name: string
    shelf_desc: string
    is_private: boolean
    shelf_type: string
  }) => void
  isLoading?: boolean
}

const NewShelfModal: React.FC<NewShelfModalProps> = ({
  isOpen,
  onClose,
  onSave,
  isLoading = false
}) => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate inputs
    if (!name.trim()) {
      setError('Shelf name is required')
      return
    }

    // Submit data
    onSave({
      name: name.trim(),
      shelf_desc: description.trim(),
      is_private: isPrivate,
      shelf_type: 'Custom'
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-serif font-bold text-amber-900">Create New Shelf</h2>
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
            />
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
            />
          </div>

          <div className="mb-6">
            <label className="flex items-center text-amber-800 font-medium">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="mr-2 h-4 w-4 text-amber-600 border-amber-300 rounded focus:ring-amber-500"
              />
              Make this shelf private
            </label>
          </div>

          <div className="flex justify-end">
          <motion.div 
                    whileHover={{ scale: 1.07 }}
                    whileTap={{ scale: 0.9 }}  
                > 
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 mr-2 text-amber-800 border border-amber-300 rounded-full hover:bg-amber-50"
              disabled={isLoading}
            >
              Cancel
            </button>
            </motion.div>
            <motion.div 
                    whileHover={{ scale: 1.07 }}
                    whileTap={{ scale: 0.9 }}  
                > 
            <button
              type="submit"
              className="px-4 py-2 bg-amber-700 text-white rounded-full hover:bg-amber-900 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Shelf'}
            </button>
            </motion.div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewShelfModal