from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from library.models import Book
from .serializers import BookInfoSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def book_info(request, book_id):
    """
    Get book information by book_id
    
    Args:
        book_id (str): The unique book_id identifier
        
    Returns:
        JSON response with book information including:
        - book_id
        - title
        - summary
        - average_rating
        - year_published
        - original_language
        - authors (list with id, name, author_image)
        - genres (list with id, name)
        - cover_image (URL using primary image logic)
    """
    try:
        # Get book by book_id (not primary key)
        book = get_object_or_404(Book, book_id=book_id)
        
        # Prefetch related data for optimization
        book = Book.objects.select_related().prefetch_related(
            'authors',
            'genres', 
            'editions__related_edition_image'
        ).get(book_id=book_id)
        
        serializer = BookInfoSerializer(book)
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    except Book.DoesNotExist:
        return Response(
            {"error": "Book not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {"error": f"An error occurred: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )