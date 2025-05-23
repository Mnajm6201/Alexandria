"""
    Name: serializer.py
    Date: 3/20/2025
    Description: This program takes a Book object as an arguement and returns all
    data on book, author list, edition list, with all information on each edition, 
    as JSON.
    Note: Current unused.
"""

from rest_framework import serializers
from library.models import Book, Author, Edition, Publisher, CoverImage, Genre

# Author Serializer
class AuthorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Author
        fields = ['id', 'name', 'biography', 'author_image']

# Publisher Serializer
class PublisherSerializer(serializers.ModelSerializer):
    class Meta:
        model = Publisher
        fields = ['id', 'name', 'contact_info']

# Genre Serializer
class GenreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Genre
        fields = ['id', 'name']

# CoverImage Serializer
class CoverImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = CoverImage
        fields = ['id', 'image_url', 'is_primary']

# Edition Serializer
class EditionSerializer(serializers.ModelSerializer):
    publisher = PublisherSerializer(read_only=True)
    cover_images = CoverImageSerializer(source='related_edition_image', many=True, read_only=True)
    
    class Meta:
        model = Edition
        fields = [
            'id', 'isbn', 'publisher', 'kind', 'publication_year',
            'language', 'page_count', 'edition_number', 'abridged',
            'cover_images'
        ]

# Book Serializer
class BookDetailSerializer(serializers.ModelSerializer):
    authors = AuthorSerializer(many=True, read_only=True)
    editions = EditionSerializer(many=True, read_only=True)
    genres = GenreSerializer(many=True, read_only=True)
    
    class Meta:
        model = Book
        fields = [
            'id', 'title', 'summary', 'average_rating', 
            'year_published', 'original_language',
            'authors', 'editions', 'genres'
        ]

    def get_book_details(self, obj):
        if not obj.book:
            return None

        # Get the book
        book = obj.book
        
        # Return basic book details
        book_details = {
            'id': book.id,
            'book_id': book.book_id,
            'title': book.title,
            'summary': book.summary,
            'authors': [author.name for author in book.authors.all()],
            'year_published': book.year_published
        }
        
        # Add cover image URL if available
        try:
            from library.models import Edition
            editions = Edition.objects.filter(book=book).prefetch_related('related_edition_image')
            
            # Look for editions with images
            for edition in editions:
                cover_images = edition.related_edition_image.all()
                if cover_images.exists():
                    # Prioritize primary images
                    primary_images = [img for img in cover_images if getattr(img, 'is_primary', False)]
                    if primary_images:
                        book_details['cover_url'] = primary_images[0].image_url
                        break
                    else:
                        book_details['cover_url'] = cover_images[0].image_url
                        break
        except Exception as e:
            print(f"Error getting cover image for book details: {str(e)}")
        
        return book_details