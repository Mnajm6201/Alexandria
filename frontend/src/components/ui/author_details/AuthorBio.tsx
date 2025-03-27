'use client'

import { useState } from 'react'

interface AuthorBioProps {
  biography?: string
}

export default function AuthorBio({ biography }: AuthorBioProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false)
  
  // If biography is empty or very short, don't show expand/collapse
  if (!biography || biography.length < 300) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Biography</h2>
        <p className="text-gray-700 dark:text-gray-300">
          {biography || "No biography available for this author."}
        </p>
      </div>
    )
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Biography</h2>
      <div className="relative">
        <p className="text-gray-700 dark:text-gray-300">
          {isExpanded ? biography : `${biography.substring(0, 250)}...`}
        </p>
        
        <button
          className="mt-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </button>
      </div>
    </div>
  )
}