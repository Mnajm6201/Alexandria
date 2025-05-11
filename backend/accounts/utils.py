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