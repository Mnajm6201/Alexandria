#!/usr/bin/env python
import requests
import json
import time
import sys
import os
from typing import Dict, List, Any, Optional, Tuple

class OpenLibraryFetcher:
    """Fetches book data from Open Library API."""
    
    BASE_URL = "https://openlibrary.org"
    COVERS_URL = "https://covers.openlibrary.org"
    
    def __init__(self, rate_limit_delay: float = 1.0):
        """
        Initialize the fetcher.
        
        Args:
            rate_limit_delay: Seconds to wait between API calls to avoid rate limiting
        """
        self.rate_limit_delay = rate_limit_delay
    
    def search_work(self, title: str) -> Dict[str, Any]:
        """
        Search for a work by title and return the first result.
        
        Args:
            title: The title of the book to search for
            
        Returns:
            Dictionary containing search result data
        """
        params = {
            'q': title,
            'fields': '*,availability',
        }
        
        response = requests.get(f"{self.BASE_URL}/search.json", params=params)
        response.raise_for_status()
        
        data = response.json()
        
        if data['numFound'] == 0:
            raise ValueError(f"No results found for '{title}'")
        
        print(f"Found {data['numFound']} results for '{title}'")
        return data['docs'][0]
    
    def get_work_details(self, work_id: str) -> Dict[str, Any]:
        """
        Get detailed information about a work using its ID.
        
        Args:
            work_id: The Open Library work ID (e.g., 'OL123W')
            
        Returns:
            Dictionary containing work data
        """
        # Add the /works/ prefix if it's not already there
        if not work_id.startswith('/works/'):
            work_id = f"/works/{work_id}"
        
        response = requests.get(f"{self.BASE_URL}{work_id}.json")
        response.raise_for_status()
        
        time.sleep(self.rate_limit_delay)  # Avoid rate limiting
        return response.json()
    
    def get_edition_details(self, edition_id: str) -> Dict[str, Any]:
        """
        Get detailed information about an edition using its ID.
        
        Args:
            edition_id: The Open Library edition ID (e.g., 'OL123M')
            
        Returns:
            Dictionary containing edition data
        """
        # Add the /books/ prefix if it's not already there
        if not edition_id.startswith('/books/'):
            edition_id = f"/books/{edition_id}"
        
        response = requests.get(f"{self.BASE_URL}{edition_id}.json")
        response.raise_for_status()
        
        time.sleep(self.rate_limit_delay)  # Avoid rate limiting
        return response.json()
    
    def get_author_details(self, author_id: str) -> Dict[str, Any]:
        """
        Get detailed information about an author using their ID.
        
        Args:
            author_id: The Open Library author ID (e.g., 'OL123A')
            
        Returns:
            Dictionary containing author data
        """
        # Add the /authors/ prefix if it's not already there
        if not author_id.startswith('/authors/'):
            author_id = f"/authors/{author_id}"
        
        response = requests.get(f"{self.BASE_URL}{author_id}.json")
        response.raise_for_status()
        
        time.sleep(self.rate_limit_delay)  # Avoid rate limiting
        return response.json()
    
    def get_editions_for_work(self, work_id: str) -> List[Dict[str, Any]]:
        """
        Get all editions for a work.
        
        Args:
            work_id: The Open Library work ID (e.g., 'OL123W')
            
        Returns:
            List of dictionaries containing edition data
        """
        # Clean the work_id to ensure proper format
        if work_id.startswith('/works/'):
            work_id = work_id[7:]  # Remove '/works/' prefix
        
        # Create work query string
        work_query = f"key:/works/OL{work_id}W"
        if work_id.startswith('OL') and work_id.endswith('W'):
            work_query = f"key:/works/{work_id}"
        
        # First, get the total number of editions for the work
        initial_params = {
            'q': work_query,
            'fields': 'edition_count',
            'limit': 1
        }
        
        print(f"Fetching edition count for work: {work_query}")
        initial_response = requests.get(f"{self.BASE_URL}/search.json", params=initial_params)
        initial_response.raise_for_status()
        initial_data = initial_response.json()
        
        if not initial_data.get('docs') or len(initial_data['docs']) == 0:
            print(f"No work found with ID: {work_id}")
            return []
        
        total_editions = initial_data['docs'][0].get('edition_count', 0)
        print(f"Work has {total_editions} editions in total")
        
        # Now retrieve all editions directly
        detailed_editions = []
        page = 1
        limit = 100  # Maximum limit per page
        
        while True:

            # Try to get editions directly from the editions endpoint
            editions_url = f"{self.BASE_URL}/works/OL{work_id}W/editions.json"
            if work_id.startswith('OL') and work_id.endswith('W'):
                editions_url = f"{self.BASE_URL}/works/{work_id}/editions.json"
            
            params = {
                'limit': limit,
                'offset': (page - 1) * limit
            }
            
            print(f"Fetching editions page {page} with offset {(page - 1) * limit}")
            try:
                response = requests.get(editions_url, params=params)
                response.raise_for_status()
                
                data = response.json()
                
                entries = data.get('entries', [])
                if not entries:
                    print("No more editions found")
                    break
                
                print(f"Retrieved {len(entries)} editions on page {page}")
                
                # Process each edition
                for edition in entries:
                    try:
                        # Add the edition to list
                        detailed_editions.append(edition)
                        print(f"Added edition: {edition.get('title', 'Unknown')}")
                    except Exception as e:
                        print(f"Error processing edition: {e}")
                
                # Check if all editions have been retrieved.
                if len(entries) < limit or len(detailed_editions) >= total_editions:
                    print("Retrieved all available editions")
                    break
                
                page += 1
                time.sleep(self.rate_limit_delay)  # Avoid rate limiting
                
            except Exception as e:
                print(f"Error fetching editions page {page}: {e}")
                break
        
        print(f"Retrieved {len(detailed_editions)} editions in total")
        return detailed_editions
    
    def get_cover_url(self, cover_id: int, size: str = 'M') -> str:
        """
        Get the URL for a book cover.
        
        Args:
            cover_id: The Open Library cover ID
            size: Size of the cover ('S', 'M', or 'L')
            
        Returns:
            URL for the cover image
        """
        return f"{self.COVERS_URL}/b/id/{cover_id}-{size}.jpg"
    
    def get_author_photo_url(self, author_id: str, size: str = 'M') -> Optional[str]:
        """
        Get the URL for an author's photo.
        
        Args:
            author_id: The Open Library author ID (e.g., 'OL123A')
            size: Size of the photo ('S', 'M', or 'L')
            
        Returns:
            URL for the author photo, or None if not available
        """
        if not author_id.startswith('OL'):
            author_id = f"OL{author_id}"
        
        return f"{self.COVERS_URL}/a/olid/{author_id}-{size}.jpg"

def main():
    """Main entry point for the script."""
    if len(sys.argv) < 2:
        print("Usage: python openlibrary_fetcher.py 'Book Title'")
        sys.exit(1)
    
    title = sys.argv[1]
    fetcher = OpenLibraryFetcher()
    
    try:
        # Search for the work
        search_result = fetcher.search_work(title)
        
        # Extract the work ID
        work_id = search_result.get('key').replace('/works/', '')
        print(f"Found work ID: {work_id}")
        
        # Get detailed work information
        work_data = fetcher.get_work_details(work_id)
        print(f"Retrieved work details for: {work_data.get('title', 'Unknown')}")
        
        # Get author information
        author_keys = []
        for author in work_data.get('authors', []):
            if isinstance(author, dict):
                author_key = author.get('author', {}).get('key')
                if author_key:
                    author_keys.append(author_key)
            elif isinstance(author, str):
                author_keys.append(author)
        
        authors_data = []
        for author_key in author_keys:
            try:
                author_data = fetcher.get_author_details(author_key)
                authors_data.append(author_data)
                print(f"Retrieved author details for: {author_data.get('name', 'Unknown')}")
            except Exception as e:
                print(f"Error retrieving author details for {author_key}: {e}")
        
        # Get all editions for work
        editions_data = fetcher.get_editions_for_work(work_id)
        print(f"Retrieved {len(editions_data)} editions")
        
        # Save the data to JSON files.
        script_dir = os.path.dirname(os.path.abspath(__file__))
        
        with open(os.path.join(script_dir, 'work_data.json'), 'w') as f:
            json.dump(work_data, f, indent=2)
        
        with open(os.path.join(script_dir, 'editions_data.json'), 'w') as f:
            json.dump(editions_data, f, indent=2)
        
        with open(os.path.join(script_dir, 'authors_data.json'), 'w') as f:
            json.dump(authors_data, f, indent=2)
        
        print(f"\nData saved to JSON files in {script_dir}")
        print(f"Total authors: {len(authors_data)}, Total editions: {len(editions_data)}")
        print("Run the uploader script to import this data into your database.")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()