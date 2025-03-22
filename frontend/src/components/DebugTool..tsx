/*
  Name: DebugTool.tsx
  Date: 03/22/2025
  Description: Development-only React client component that displays JSON data for debugging purposes. It renders a toggleable modal overlay showing formatted debug data, and is designed to only render in non-production environments. This tool is useful for developers to inspect application state and props during development without exposing sensitive data in production.

  Input:
    - data: The JSON data to be displayed (of any type).
    - title (optional): A string to label the debug data panel. Defaults to "Debug Data".

  Output:
    - Renders a fixed toggle button at the bottom-right of the viewport.
    - When activated, displays a modal overlay containing a formatted JSON representation of the provided data.
    - Provides a close button within the overlay to hide the debug information.

  Notes:
    - Uses React's useState hook to manage the open/closed state of the debug panel.
    - Applies Tailwind CSS classes for styling and layout.
    - Does not render in production builds (when process.env.NODE_ENV equals 'production').
*/
'use client'

import { useState } from 'react'

interface DebugToolProps {
  data: any;
  title?: string;
}

/**
 * Development-only component to display JSON data during debugging
 * Can be toggled on/off by the developer
 */
export default function DebugTool({ data, title = 'Debug Data' }: DebugToolProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  // Don't render anything in production
  if (process.env.NODE_ENV === 'production') {
    return null
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-md shadow-lg text-sm font-medium"
      >
        {isOpen ? 'Hide' : 'Show'} Debug Data
      </button>
      
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-4">
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-[60vh]">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
            
            <div className="p-4 border-t flex justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}