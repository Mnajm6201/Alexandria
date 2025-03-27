from rest_framework import serializers
from django.db.models import OuterRef, Subquery
from library.models import Author, Book, CoverImage

class AuthorPageSerializer(serializers.ModelSerializer):
    """
    Serializer for the Author Page view
    """
    books = serializers.SerializerMethodField()
    
    class Meta:
        model = Author
        fields = [
            'author_id',
            'name',
            'biography',
            'author_image',
            'books'
        ]
    
    def get_books(self, obj):
        """Return a list of books by this author (id, title, cover_image)."""
        # subquery to get cover image
        cover_subquery = CoverImage.objects.filter(
            edition__book=OuterRef('pk'),
            is_primary=True
        ).values('image_url')[:1]
        
        # Get books list sorted by published year
        books = Book.objects.filter(authors=obj).annotate(
            cover_image=Subquery(cover_subquery)
        ).order_by('-year_published')
        
        # Return list of books: dictionary with attributes. 
        return [
            {
                'id': book.book_id,
                'title': book.title,
                'cover_image': book.cover_image
            }
            for book in books
        ]