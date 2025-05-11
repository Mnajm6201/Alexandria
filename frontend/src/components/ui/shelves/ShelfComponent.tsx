'use client'

import React from 'react'
import ItemCarousel from '@/components/ui/ItemCarousel'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Pencil } from 'lucide-react'

interface Edition {
  id: string
  isbn: string
  cover_image?: string
  [key: string]: any
}

interface ShelfProps {
  id: string
  name: string
  description?: string
  is_private: boolean
  editions: Edition[]
  isOwner: boolean
  onEdit?: (shelfId: string) => void
}

const ShelfComponent: React.FC<ShelfProps> = ({
  id,
  name,
  description,
  is_private,
  editions,
  isOwner,
  onEdit
}) => {
  const router = useRouter()

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <h2 className="text-xl font-serif font-bold text-amber-900">{name}</h2>
          {is_private && (
            <div className="ml-2 flex items-center text-amber-600">
              <EyeOff className="h-4 w-4 mr-1" />
              <span className="text-xs">Private</span>
            </div>
          )}
          {!is_private && isOwner && (
            <div className="ml-2 flex items-center text-amber-600">
              <Eye className="h-4 w-4 mr-1" />
              <span className="text-xs">Public</span>
            </div>
          )}
        </div>
        {isOwner && onEdit && (
          <button 
            onClick={() => onEdit(id)}
            className="flex items-center text-amber-600 text-sm hover:text-amber-800"
          >
            <Pencil className="h-4 w-4 mr-1" />
            Edit
          </button>
        )}
      </div>
      
      {description && (
        <p className="text-amber-700 mb-4 text-sm">{description}</p>
      )}
      
      <ItemCarousel 
        items={editions}
        title=""
        onItemClick={(item) => {
          if (item.isbn) {
            router.push(`/edition/${item.isbn}`);
          }
        }}
      />
    </div>
  )
}

export default ShelfComponent