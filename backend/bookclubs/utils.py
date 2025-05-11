def get_book_cover(book):
    """
    Utility function to get a book's cover image URL.
    
    Args:
        book: A Book model instance
        
    Returns:
        String: URL of the book's cover image, or None if not found
    """
    if not book:
        return None
    
    try:
        # Get all editions for this book
        editions = book.editions.all().prefetch_related('related_edition_image')
        
        # First try to find an edition with a primary cover image
        for edition in editions:
            cover_images = edition.related_edition_image.filter(is_primary=True)
            if cover_images.exists():
                return cover_images.first().image_url
        
        # If no primary cover image found, get any cover image
        for edition in editions:
            cover_images = edition.related_edition_image.all()
            if cover_images.exists():
                return cover_images.first().image_url
        
        # No cover image found
        return None
    except Exception as e:
        print(f"Error getting cover image for book {book.title}: {str(e)}")
        return None


def get_book_page_count(book):
    """
    Utility function to get a book's page count from its editions.
    
    Args:
        book: A Book model instance
        
    Returns:
        Integer: Page count of the book, or None if not available
    """
    if not book:
        return None
    
    try:
        # Get all editions for this book
        editions = book.editions.all()
        
        if not editions.exists():
            return None
            
        # First try to find an edition with a primary cover image - these are often the main editions
        for edition in editions:
            cover_images = edition.related_edition_image.filter(is_primary=True)
            if cover_images.exists() and edition.page_count:
                return edition.page_count
                
        # If no primary cover edition with page count, look for any edition with page count
        page_count_editions = editions.exclude(page_count__isnull=True).exclude(page_count=0)
        if page_count_editions.exists():
            return page_count_editions.first().page_count
            
        # If still no page count, just return the first edition's page count (which might be None)
        return editions.first().page_count
    except Exception as e:
        print(f"Error getting page count for book {book.title}: {str(e)}")
        return None