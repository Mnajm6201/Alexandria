"""
    Name: serializer.py
    Date: 3/20/2025
    Description: This program takes a Book object as an arguement and returns all
    data on book, author list, edition list, with all information on each edition, 
    as JSON.
"""
from rest_framework import serializers
from .models import Book, Author, Edition, Publisher, CoverImage, Genre

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