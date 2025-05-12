"""
  Name: BookPageSerializer.py
  Date: 03/22/2025
  Description: Django REST Framework serializer for the Book Page view. This serializer transforms a Book model instance into a JSON response suitable for a detailed book page. It includes custom representations for authors, primary edition, other editions, and genres using SerializerMethodFields.

  Input:
    - A Book model instance with related objects:
        • authors: Many-to-many relationship for author details.
        • editions: A queryset of edition objects (each with related edition images and publisher).
        • genres: A many-to-many relationship for genre details.
    
  Output:
    - A JSON object with the following fields:
        • id: Unique identifier of the book.
        • title: The book's title.
        • summary: A summary of the book.
        • average_rating: The book's average rating.
        • year_published: The publication year of the book.
        • original_language: The original language in which the book was written.
        • authors: A list of dictionaries with each author's id, name, and image.
        • primary_edition: A dictionary representing the primary edition of the book. The method prioritizes editions with a primary cover image, then any edition with a cover image, and finally falls back to the first edition if necessary.
        • other_editions: A list of dictionaries representing other editions (excluding the primary one) with limited details.
        • genres: A list of dictionaries, each containing the id and name of a genre.

  Notes:
    - The get_authors method extracts essential author information, including an image if available.
    - The get_primary_edition method optimizes the selection of a primary edition by checking for a primary cover image among related edition images. It falls back to other editions if necessary.
    - The get_other_editions method returns simplified data for all editions except the primary one.
    - The get_genres method formats genre information into a simple list of id/name pairs.
    - Prefetching and select_related are used in the methods to optimize database queries.
"""
from rest_framework import serializers
from library.models import Book

class BookPageSerializer(serializers.ModelSerializer):
    """
    Serializer for the Book Page view
    """
    authors = serializers.SerializerMethodField()
    primary_edition = serializers.SerializerMethodField()
    other_editions = serializers.SerializerMethodField()
    genres = serializers.SerializerMethodField()
    
    class Meta:
        model = Book
        fields = [
            'id', 
            'title', 
            'summary', 
            'average_rating', 
            'year_published',
            'original_language', 
            'authors', 
            'primary_edition', 
            'other_editions', 
            'genres'
        ]
    
    def get_authors(self, obj):
        """Return essential author information including images for the book page."""
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
    
    def get_primary_edition(self, obj):
        """
        Find and return the primary edition for display on the book page.
        First tries to find the edition marked as primary, then falls back to
        editions with primary cover images, then any edition with a cover image,
        then defaults to the first edition.
        """
        editions = obj.editions.all().prefetch_related('related_edition_image').select_related('publisher')
        
        # First check for the edition marked as primary
        primary_editions = [edition for edition in editions if edition.is_primary]
        if primary_editions:
            edition = primary_editions[0]
            # Get the cover image
            images = edition.related_edition_image.all()
            primary_images = [img for img in images if img.is_primary]
            cover_image = primary_images[0].image_url if primary_images else None
            
            if not cover_image and images:
                cover_image = images[0].image_url
                
            return {
                'id': edition.id,
                'isbn': edition.isbn,
                'kind': edition.kind,
                'publication_year': edition.publication_year,
                'page_count': edition.page_count,
                'language': edition.language,
                'publisher_name': edition.publisher.name if edition.publisher else None,
                'cover_image': cover_image
            }
        
        # If no primary edition is set, fall back to editions with primary cover images
        for edition in editions:
            images = edition.related_edition_image.all()
            primary_images = [img for img in images if img.is_primary]
            if primary_images:
                return {
                    'id': edition.id,
                    'isbn': edition.isbn,
                    'kind': edition.kind,
                    'publication_year': edition.publication_year,
                    'page_count': edition.page_count,
                    'language': edition.language,
                    'publisher_name': edition.publisher.name if edition.publisher else None,
                    'cover_image': primary_images[0].image_url
                }
        
        # If no edition with primary cover image, try to find any edition with a cover image
        for edition in editions:
            images = edition.related_edition_image.all()
            if images:
                return {
                    'id': edition.id,
                    'isbn': edition.isbn,
                    'kind': edition.kind,
                    'publication_year': edition.publication_year,
                    'page_count': edition.page_count,
                    'language': edition.language,
                    'publisher_name': edition.publisher.name if edition.publisher else None,
                    'cover_image': images[0].image_url
                }
        
        # If no edition with any image, use first edition
        if editions:
            first_edition = editions[0]
            return {
                'id': first_edition.id,
                'isbn': first_edition.isbn,
                'kind': first_edition.kind,
                'publication_year': first_edition.publication_year,
                'page_count': first_edition.page_count,
                'language': first_edition.language,
                'publisher_name': first_edition.publisher.name if first_edition.publisher else None,
                'cover_image': None
            }
        
        return None

    def get_other_editions(self, obj):
        """
        Return a simplified list of other editions (excluding the primary one)
        with limited information.
        """
        primary_id = None
        primary_edition = self.get_primary_edition(obj)
        if primary_edition:
            primary_id = primary_edition['id']
            
        other_editions = []
        for edition in obj.editions.all():
            if edition.id != primary_id:
                # Get a cover image if available
                cover_image = None
                images = edition.related_edition_image.all()
                if images:
                    cover_image = images[0].image_url
                
                other_editions.append({
                    'id': edition.id,
                    'isbn': edition.isbn,
                    'kind': edition.kind,
                    'publication_year': edition.publication_year,
                    'cover_image': cover_image,
                    'publisher_name': edition.publisher.name if edition.publisher else None
                })
                
        return other_editions