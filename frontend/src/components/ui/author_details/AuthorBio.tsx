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
      <div className="bg-card rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-card-foreground mb-4">Biography</h2>
        <p className="text-foreground">
          {biography || "No biography available for this author."}
        </p>
      </div>
    )
  }
  
  return (
    <div className="bg-card rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-card-foreground mb-4">Biography</h2>
      <div className="relative">
        <p className="text-foreground">
          {isExpanded ? biography : `${biography.substring(0, 250)}...`}
        </p>
        
        <button
          className="mt-2 text-link hover:text-link-hover font-medium"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </button>
      </div>
    </div>
  )
}