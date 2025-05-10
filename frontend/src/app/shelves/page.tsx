'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import ShelfComponent from '@/components/ui/shelves/ShelfComponent'
import NewShelfModal from '@/components/ui/shelves/NewShelfModal'
import { useJWToken } from '../../utils/getJWToken'
import { BookOpen, Plus } from 'lucide-react'

interface Edition {
  id: string
  edition_id: number
  edition_title: string
  edition_format: string
  isbn: string
  publication_year: number
  cover_image: string
  authors: Array<{ id: number, name: string }>
}

interface Shelf {
  id: number
  name: string
  shelf_desc: string
  is_private: boolean
  shelf_type: string
  shelf_img?: string
  creation_date: string
}

export default function ShelvesPage() {
  const router = useRouter()
  const { jwtToken, fetchJWToken } = useJWToken()
  const [shelves, setShelves] = useState<Shelf[]>([])
  const [shelfEditions, setShelfEditions] = useState<Record<number, Edition[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCreatingShelf, setIsCreatingShelf] = useState(false)

  // Fetch user's shelves
  useEffect(() => {
    async function fetchShelves() {
      try {
        setLoading(true);
        setError(null);
        
        // Get token
        const token = jwtToken || await fetchJWToken();
        if (!token) {
          router.push('/auth/sign-in');
          return;
        }
        
        console.log('Fetching shelves...');
        const response = await fetch('http://localhost:8000/', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          let errorMessage;
          try {
            const errorData = await response.text();
            console.error('Error response:', errorData);
            errorMessage = 'Failed to load your shelves. Please try again.';
          } catch (e) {
            errorMessage = `Server error: ${response.status}`;
          }
          throw new Error(errorMessage);
        }
        
        // Parse JSON response
        const responseText = await response.text();
        console.log('Response text preview:', responseText.substring(0, 100));
        
        if (!responseText.trim()) {
          console.log('Empty response - treating as empty shelves list');
          setShelves([]);
          setLoading(false);
          return;
        }
        
        try {
          const shelvesData = JSON.parse(responseText);
          console.log('Parsed shelves data:', shelvesData);
          setShelves(shelvesData);
          
          // Only fetch editions if we have shelves
          if (shelvesData && shelvesData.length > 0) {
            for (const shelf of shelvesData) {
              fetchShelfEditions(shelf.id, token);
            }
          }
        } catch (parseError) {
          console.error('Error parsing shelves JSON:', parseError);
          setError('Could not parse server response. Please try again later.');
        }
      } catch (err) {
        console.error('Error fetching shelves:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchShelves();
  }, [jwtToken, fetchJWToken, router]);

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

      console.log(`Editions response status: ${editionsResponse.status}`);

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
  }

  // Create a new shelf 
  const handleCreateShelf = async (shelfData: {
    name: string
    shelf_desc: string
    is_private: boolean
    shelf_type: string
  }) => {
    try {
      setIsCreatingShelf(true);
      
      const token = jwtToken || await fetchJWToken();
      if (!token) {
        router.push('/auth/sign-in');
        return;
      }

      console.log('Creating new shelf:', shelfData);
      
      const response = await fetch('http://localhost:8000/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(shelfData)
      });

      console.log('Create shelf response status:', response.status);
      
      // Log the full response for debugging
      const responseText = await response.text();
      console.log('Create shelf response:', responseText);
      
      if (!response.ok) {
        alert(`Failed to create shelf: ${response.status} ${response.statusText}`);
        return;
      }
      
      try {
        // Only try to parse if there is content
        if (responseText.trim()) {
          const newShelf = JSON.parse(responseText);
          console.log('New shelf created:', newShelf);
          
          // Add new shelf to shelves list
          setShelves(prev => [...prev, newShelf]);
        } else {
          // If empty response but successful status, refresh the shelves list
          window.location.reload();
        }
        
        // Close the modal
        setIsModalOpen(false);
        
        // Clear any previous errors
        setError(null);
      } catch (parseError) {
        console.error('Error parsing new shelf response:', parseError);
        alert('Shelf may have been created, but there was an error processing the response');
        window.location.reload();
      }
    } catch (err) {
      console.error('Error creating shelf:', err);
      alert(err instanceof Error ? err.message : 'Failed to create shelf. Please try again.');
    } finally {
      setIsCreatingShelf(false);
    }
  }

  return (
    <div className="min-h-screen bg-amber-50">
      <Header variant="app" />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-serif font-bold text-amber-900">My Shelves</h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Shelf
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-amber-800">Loading your shelves...</p>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            <p>{error}</p>
          </div>
        ) : shelves.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <BookOpen className="h-16 w-16 mx-auto text-amber-400 mb-4" />
            <h2 className="text-xl font-semibold text-amber-900 mb-2">You don't have any shelves yet</h2>
            <p className="text-amber-700 mb-4">Create your first shelf to organize your books.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700"
            >
              Create Your First Shelf
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {shelves.map((shelf) => (
              <ShelfComponent
                key={shelf.id}
                id={shelf.id.toString()}
                name={shelf.name}
                description={shelf.shelf_desc}
                is_private={shelf.is_private}
                editions={shelfEditions[shelf.id] || []}
                isOwner={true}
                onEdit={(id) => console.log(`Edit shelf ${id}`)}
              />
            ))}
          </div>
        )}
      </main>

      <NewShelfModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleCreateShelf}
        isLoading={isCreatingShelf}
      />
    </div>
  )
}