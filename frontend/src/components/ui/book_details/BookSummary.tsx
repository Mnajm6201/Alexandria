/*
  Name: BookSummary.tsx
  Date: 03/22/2025
  Description: React client component that displays a book's summary. For short summaries (less than 300 characters), it renders the summary directly. For longer summaries, it initially displays a truncated version (first 250 characters) and provides a toggle button to expand or collapse the full text.

  Input:
    - summary (optional): A string representing the book's summary.

  Output:
    - Renders a card-like UI section with a header "Summary" and the summary text.
    - For long summaries, toggles between a truncated preview and the full summary based on user interaction.

  Notes:
    - Uses Tailwind CSS classes for styling.
    - Utilizes React's useState hook to manage the expand/collapse state.
*/
'use client'

import { useState } from 'react'

interface BookSummaryProps {
  summary?: string
}

export default function BookSummary({ summary }: BookSummaryProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false)
  
  // If summary is short, don't show expand/collapse
  if (!summary || summary.length < 300) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Summary</h2>
        <p className="text-gray-700">{summary}</p>
      </div>
    )
  }
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Summary</h2>
      <div className="relative">
        <p className="text-gray-700">
          {isExpanded ? summary : `${summary.substring(0, 250)}...`}
        </p>
        
        <button
          className="mt-2 text-blue-600 hover:text-blue-800 font-medium"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </button>
      </div>
    </div>
  )
}