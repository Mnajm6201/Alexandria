from rest_framework import serializers
from library.models import Book

class BookInfoSerializer(serializers.ModelSerializer):
    """
    Serializer for Book Info API - returns essential book information
    including cover image using the same logic as entity pages
    """
    authors = serializers.SerializerMethodField()
    genres = serializers.SerializerMethodField()
    cover_image = serializers.SerializerMethodField()
    
    class Meta:
        model = Book
        fields = [
            'book_id',
            'title', 
            'summary', 
            'average_rating', 
            'year_published',
            'original_language',
            'authors',
            'genres',
            'cover_image'
        ]
    
    def get_authors(self, obj):
        """Return author information."""
        return [
            {
                'id': author.author_id, 
                'name': author.name,
                'author_image': author.author_image
            } 
            for author in obj.authors.all()
        ]
    
    def get_genres(self, obj):
        """Return genre information."""
        return [{'id': genre.id, 'name': genre.name} for genre in obj.genres.all()]
    
    def get_cover_image(self, obj):
        """
        Get the primary cover image using the same logic as entity pages:
        1. Find edition marked as primary
        2. Look for primary cover image in that edition
        3. Fall back to any edition with primary cover image
        4. Fall back to any edition with any cover image
        5. Return None if no cover found
        """
        editions = obj.editions.all().prefetch_related('related_edition_image')
        
        # First check for the edition marked as primary
        primary_editions = [edition for edition in editions if edition.is_primary]
        if primary_editions:
            edition = primary_editions[0]
            images = edition.related_edition_image.all()
            primary_images = [img for img in images if img.is_primary]
            if primary_images:
                return primary_images[0].image_url
            if images:
                return images[0].image_url
        
        # If no primary edition is set, fall back to editions with primary cover images
        for edition in editions:
            images = edition.related_edition_image.all()
            primary_images = [img for img in images if img.is_primary]
            if primary_images:
                return primary_images[0].image_url
        
        # If no edition with primary cover image, try to find any edition with a cover image
        for edition in editions:
            images = edition.related_edition_image.all()
            if images:
                return images[0].image_url
        
        # No cover image found
        return None