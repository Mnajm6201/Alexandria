/*
  Name: LibraryAvailability.tsx
  Date: 03/22/2025
  Description: React client component that displays library availability information. 
  The component renders a list of libraries with details such as name, distance, address, 
  availability status (available, checked out, or unknown), and due date if applicable. 
  It also includes a button to request the user's current location using the Geolocation API. 
  When the location is available, it provides a placeholder for sorting libraries by proximity 
  (ideally handled by backend support). Each library entry includes a link to visit the library's website, 
  enhanced with an external link icon.
  NOTE: Most of the backend logic for this component is missing.

  Input:
    - libraries (optional): An array of Library objects, where each object contains:
        - id: A unique identifier for the library.
        - name: The name of the library.
        - url: A URL to the library's website.
        - availability: A string representing the current availability status ('available', 'checked_out', or 'unknown').
        - distance (optional): A string indicating the distance from the user (if calculated).
        - address (optional): The physical address of the library.
        - due_date (optional): A string representing the due date if the library item is checked out.

  Output:
    - Renders a styled section with a header "Library Availability" and a button to show nearby libraries.
    - Displays a list of libraries with their details including name, distance, address, availability status, and due date (if applicable).
    - Each library entry contains an external link to the library's website, opening in a new tab.

  Notes:
    - Uses Tailwind CSS for styling.
    - Utilizes React's useState hook for managing user location and loading state.
    - Employs the browser's Geolocation API to fetch the user's location.
    - The sorting of libraries by proximity is a placeholder and requires backend support for accurate distance calculation.
*/
'use client'

import { useState } from 'react'
import { ExternalLink, MapPin } from 'lucide-react'

interface UserLocation {
  latitude: number
  longitude: number
}

interface Library {
  id: string
  name: string
  url: string
  availability: 'available' | 'checked_out' | 'unknown'
  distance?: string
  address?: string
  due_date?: string
}

interface LibraryAvailabilityProps {
  libraries?: Library[]
}

export default function LibraryAvailability({ libraries = [] }: LibraryAvailabilityProps) {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [isLoadingLocation, setIsLoadingLocation] = useState<boolean>(false)
  
  const requestLocation = () => {
    if (navigator.geolocation) {
      setIsLoadingLocation(true)
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
          setIsLoadingLocation(false)
        },
        (error) => {
          console.error('Error getting location:', error)
          setIsLoadingLocation(false)
        }
      )
    }
  }
  
  if (!libraries.length) {
    return null
  }
  
  // If we have user location, we could sort libraries by distance
  // This would require backend support with distance calculation
  const sortedLibraries = userLocation 
    ? [...libraries].sort((a, b) => {
        // This is just a placeholder - ideally the backend would handle this
        return 0
      })
    : libraries
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Library Availability</h2>
        
        <button
          type="button"
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
          onClick={requestLocation}
          disabled={isLoadingLocation}
        >
          <MapPin className="h-4 w-4 mr-2" />
          {isLoadingLocation ? 'Finding location...' : 'Show nearby'}
        </button>
      </div>
      
      <div className="space-y-4">
        {sortedLibraries.map((library) => (
          <div 
            key={library.id}
            className="border border-gray-200 rounded-md p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-gray-900">{library.name}</h3>
                {library.distance && (
                  <p className="text-sm text-gray-500">
                    {library.distance} away
                  </p>
                )}
                {library.address && (
                  <p className="text-sm text-gray-500 mt-1">
                    {library.address}
                  </p>
                )}
              </div>
              
              <div className="flex flex-col items-end">
                <div className="text-sm font-medium text-gray-900">
                  {library.availability === 'available' ? (
                    <span className="text-green-600">Available</span>
                  ) : library.availability === 'checked_out' ? (
                    <span className="text-red-600">Checked out</span>
                  ) : (
                    <span className="text-gray-500">Unknown</span>
                  )}
                </div>
                
                {library.due_date && (
                  <p className="text-xs text-gray-500">
                    Due back: {new Date(library.due_date).toLocaleDateString()}
                  </p>
                )}
                
                <a
                  href={library.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                >
                  Visit library
                  <ExternalLink className="h-4 w-4 ml-1" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}