'use client';

import { useState, useEffect } from 'react';
import { useJWToken } from '@/utils/getJWToken';
import ShelfComponent from '@/components/ui/shelves/ShelfComponent';
import { ChevronDown, ChevronRight, BookOpen } from 'lucide-react';

interface Edition {
  id: string;
  edition_id: number;
  edition_title: string;
  edition_format: string;
  isbn: string;
  publication_year: number;
  cover_image: string;
  authors: Array<{ id: number, name: string }>;
}

interface Shelf {
  id: number;
  name: string;
  shelf_desc: string;
  is_private: boolean;
  shelf_type: string;
  shelf_img?: string;
  creation_date: string;
}

interface ProfileShelvesProps {
  userId?: string; 
  className?: string;
  shelfTypes?: string[]; // Specific shelf types to display, in order
}

export default function ProfileShelves({ userId, className = '', shelfTypes = ['Reading', 'Favorites', 'Read', 'Want to Read', 'Owned'] }: ProfileShelvesProps) {
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [shelfEditions, setShelfEditions] = useState<Record<number, Edition[]>>({});
  const [expandedShelfId, setExpandedShelfId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get JWT token
  const { jwtToken, fetchJWToken } = useJWToken();

  // Fetch user's shelves
  useEffect(() => {
    async function fetchShelves() {
      try {
        setLoading(true);
        setError(null);
        
        // Get token
        const token = jwtToken || await fetchJWToken();
        if (!token) {
          setError('Authentication required to view shelves');
          setLoading(false);
          return;
        }
        
        // Build URL based on whether a userId is provided
        const url = userId 
          ? `http://localhost:8000/?username=${encodeURIComponent(userId)}` 
          : 'http://localhost:8000/';
        
        console.log(`Fetching shelves from: ${url}`);
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            setError('Authentication required to view shelves');
          } else if (response.status === 404) {
            setError('User not found');
          } else {
            setError('Failed to load shelves. Please try again.');
          }
          setLoading(false);
          return;
        }
        
        // Parse JSON response
        const responseText = await response.text();
        if (!responseText.trim()) {
          console.log('Empty response - treating as empty shelves list');
          setShelves([]);
          setLoading(false);
          return;
        }
        
        try {
          const shelvesData = JSON.parse(responseText);
          console.log('Parsed shelves data:', shelvesData);
          
          // Filter shelves based on the requested shelf types
          const filteredShelves = shelvesData.filter((shelf: Shelf) => 
            shelfTypes.includes(shelf.shelf_type)
          );
          
          // Sort shelves based on the order in shelfTypes
          const sortedShelves = [...filteredShelves].sort((a, b) => {
            const indexA = shelfTypes.indexOf(a.shelf_type);
            const indexB = shelfTypes.indexOf(b.shelf_type);
            return indexA - indexB;
          });
          
          setShelves(sortedShelves);
          
          // Only fetch editions if we have shelves
          if (sortedShelves && sortedShelves.length > 0) {
            for (const shelf of sortedShelves) {
              fetchShelfEditions(shelf.id, token);
            }
          }
        } catch (parseError) {
          console.error('Error parsing shelves JSON:', parseError);
          setError('Failed to parse server response');
        }
      } catch (err) {
        console.error('Error fetching shelves:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchShelves();
  }, [userId, jwtToken, fetchJWToken, shelfTypes]);

  // Fetch editions for a shelf
  const fetchShelfEditions = async (shelfId: number, token: string) => {
    try {
      console.log(`Fetching editions for shelf ${shelfId}...`);
      const editionsResponse = await fetch(`http://localhost:8000/${shelfId}/editions/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!editionsResponse.ok) {
        console.error(`Failed to fetch editions for shelf ${shelfId}: ${editionsResponse.status}`);
        return;
      }

      const editionsText = await editionsResponse.text();
      
      if (!editionsText.trim()) {
        console.log(`No editions found for shelf ${shelfId}`);
        setShelfEditions(prev => ({
          ...prev,
          [shelfId]: []
        }));
        return;
      }

      try {
        const editionsData = JSON.parse(editionsText);
        console.log(`Retrieved ${editionsData.length} editions for shelf ${shelfId}`);
        
        setShelfEditions(prev => ({
          ...prev,
          [shelfId]: editionsData
        }));
      } catch (parseError) {
        console.error(`Error parsing editions JSON for shelf ${shelfId}:`, parseError);
      }
    } catch (err) {
      console.error(`Error fetching editions for shelf ${shelfId}:`, err);
    }
  };

  // Toggle shelf expansion
  const toggleShelfExpansion = (shelfId: number) => {
    // If clicking the currently expanded shelf, collapse it
    if (expandedShelfId === shelfId) {
      setExpandedShelfId(null);
    } else {
      // Otherwise, expand this shelf and collapse any other
      setExpandedShelfId(shelfId);
    }
  };

  if (loading) {
    return (
      <div className={`${className} text-center py-4`}>
        <div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-2 text-amber-800">Loading shelves...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className} bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative`}>
        <p>{error}</p>
      </div>
    );
  }

  if (shelves.length === 0) {
    return (
      <div className={`${className} bg-amber-100 border border-amber-200 text-amber-800 px-4 py-3 rounded relative`}>
        <p>No shelves to display.</p>
      </div>
    );
  }

  // Determine if the shelves belong to the current user
  const isOwner = !userId;

  return (
    <div className={className}>
      <div className="space-y-4">
        {shelves.map((shelf) => (
          <div key={shelf.id} className="rounded-lg border border-amber-200 bg-white overflow-hidden">
            {/* Shelf Header - Always visible */}
            <div 
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-amber-50" 
              onClick={() => toggleShelfExpansion(shelf.id)}
            >
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-amber-700" />
                <h3 className="text-lg font-serif font-semibold text-amber-900">
                  {shelf.name}
                </h3>
                {shelf.is_private && (
                  <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                    Private
                  </span>
                )}
                <span className="text-sm text-amber-600">
                  {shelfEditions[shelf.id]?.length || 0} books
                </span>
              </div>
              
              {/* Expand/Collapse chevron */}
              {expandedShelfId === shelf.id ? (
                <ChevronDown className="h-5 w-5 text-amber-700" />
              ) : (
                <ChevronRight className="h-5 w-5 text-amber-700" />
              )}
            </div>
            
            {/* Shelf Content - Only visible when expanded */}
            {expandedShelfId === shelf.id && (
              <div className="border-t border-amber-200 p-4">
                <ShelfComponent
                  id={shelf.id.toString()}
                  name="" // Remove duplicate title
                  description=""
                  is_private={shelf.is_private}
                  editions={shelfEditions[shelf.id] || []}
                  isOwner={isOwner}
                  hideHeader={true} 
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )}