"""
  Name: edition_page_serializer.py
  Date: 05/08/2025
  Description: Django REST Framework serializer for the Edition Page view. This serializer 
  transforms an Edition model instance into a JSON response for a detailed edition page.
  It includes information on the specific edition: publication year, format, and publisher,
  Also provides basic information about the parent book and other available editions.
"""
from rest_framework import serializers
from library.models import Edition, Book, CoverImage

class EditionPageSerializer(serializers.ModelSerializer):
    """
    Serializer for the Edition Page view
    """
    book_info = serializers.SerializerMethodField()
    cover_image = serializers.SerializerMethodField()
    other_editions = serializers.SerializerMethodField()
    publisher_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Edition
        fields = [
            'id',
            'isbn',
            'kind',
            'publication_year',
            'language',
            'page_count',
            'edition_number',
            'abridged',
            'book_info',
            'cover_image',
            'publisher_name',
            'other_editions'
        ]
    
    def get_book_info(self, obj):
        """Return essential book information for the edition page."""
        book = obj.book
        return {
            'id': book.book_id,
            'title': book.title,
            'authors': [
                {
                    'id': author.author_id,
                    'name': author.name,
                    'author_image': author.author_image
                } 
                for author in book.authors.all()
            ],
            'summary': book.summary,
            'average_rating': book.average_rating,
            'year_published': book.year_published,
            'original_language': book.original_language,
            'genres': [{'id': genre.id, 'name': genre.name} for genre in book.genres.all()]
        }
    
    def get_cover_image(self, obj):
        """Get the cover image URL for the edition."""
        images = obj.related_edition_image.all()
        
        # Try to find primary image first
        primary_images = images.filter(is_primary=True)
        if primary_images.exists():
            return primary_images.first().image_url
        
        # If no primary image, return the first image or None
        return images.first().image_url if images.exists() else None
    
    def get_publisher_name(self, obj):
        """Get the publisher name if available."""
        return obj.publisher.name if obj.publisher else None
    
    def get_other_editions(self, obj):
        """Return all other editions of the same book."""
        editions = obj.book.editions.exclude(pk=obj.pk)
        
        return [
            {
                'id': edition.id,
                'isbn': edition.isbn,
                'kind': edition.kind,
                'publication_year': edition.publication_year,
                'cover_image': self._get_edition_cover(edition)
            }
            for edition in editions
        ]
    
    def _get_edition_cover(self, edition):
        """Helper method to get a cover image for an edition."""
        images = edition.related_edition_image.all()
        primary_images = images.filter(is_primary=True)
        
        if primary_images.exists():
            return primary_images.first().image_url
        
        return images.first().image_url if images.exists() else None