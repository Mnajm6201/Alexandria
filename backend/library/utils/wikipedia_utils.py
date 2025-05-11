# backend/library/utils/wikipedia_utils.py
import requests
import logging
from typing import Optional
import time

logger = logging.getLogger(__name__)

def get_wikipedia_image_for_author(author_name: str) -> Optional[str]:
    """
    Attempts to find an image for an author using the Wikipedia API.
    
    Args:
        author_name: The name of the author to search for
        
    Returns:
        URL of the author's image if found, None otherwise
    """
    if not author_name or author_name == "Unknown Author":
        return None
        
    try:
        search_url = "https://en.wikipedia.org/w/api.php"
        params = {
            "action": "query",
            "format": "json",
            "prop": "pageimages",
            "titles": author_name,
            "piprop": "original",
            "pilimit": 1,
            "redirects": 1
        }
        
        response = requests.get(search_url, params=params, timeout=5)
        if response.status_code != 200:
            return None
            
        data = response.json()
        pages = data.get("query", {}).get("pages", {})
        
        # Get the first page
        if pages:
            page_id = next(iter(pages))
            page = pages[page_id]
            if "original" in page:
                return page["original"]["source"]
                
        return None
        
    except Exception:
        # Silently fail 
        return None