"""
  Name: BookDetailView.py
  Date: 03/22/2025
  Description: Django REST Framework API view that retrieves detailed information about a specific book.
               It fetches a book record (along with its related authors, editions, and edition images) based on the provided book_id,
               serializes the data using BookPageSerializer, and conditionally appends user-specific status data if the request
               is made by an authenticated user.
  
  Input:
    - HTTP GET request with a path parameter "book_id" representing the unique identifier of the book.
    - Supports OPTIONS method to handle CORS/pre-flight requests.

  Output:
    - On success, returns a JSON response containing the serialized book details.
      If the user is authenticated and has an associated UserBook record, the response includes a "user_status" field
      with "read_status" and "is_owned" values.
    - If the book is not found, returns a JSON error message with a 404 HTTP status code.

  Notes:
    - Utilizes Django's prefetch_related to optimize database queries by pre-loading related objects such as authors and editions.
    - Handles errors gracefully by catching Book.DoesNotExist and returning an appropriate error response.
    - The view adds user-specific data only when the user is authenticated, providing a more personalized experience.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from library.models import Book, UserBook, Author, Edition
from .serializers import BookPageSerializer, AuthorPageSerializer, EditionPageSerializer

class BookDetailView(APIView):
    """
    API view for retrieving detailed information about a specific book.
    """
    def get(self, request, book_id):
        if request.method == 'OPTIONS':
            return Response(status=status.HTTP_200_OK)
        try:
            # Gets record for book based on passed book_id
            book = Book.objects.prefetch_related(
                'authors',
                'editions',
                'editions__related_edition_image'
            ).get(book_id=book_id)
            
            serializer = BookPageSerializer(book)
            data = serializer.data
            
            # Add user-specific data if user is authenticated
            if request.user.is_authenticated:
                user_book = UserBook.objects.filter(user=request.user, book=book).first()
                
                # Add user status if a UserBook exists
                if user_book:
                    data['user_status'] = {
                        'read_status': user_book.read_status,
                        'is_owned': user_book.is_owned
                    }
                
            return Response(data)
        
        # Return error status if book not found
        except Book.DoesNotExist:
            return Response(
                {"error": "Book not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )

class AuthorDetailView(APIView):
    """
    API view for retrieving detailed information about a specific author.
    """
    def get(self, request, author_id):
        if request.method == 'OPTIONS':
            return Response(status=status.HTTP_200_OK)
        try:
            # Get author record based on passed author_id
            author = Author.objects.prefetch_related(
                'related_author_books',  
                'related_author_books__book'
            ).get(author_id=author_id)
            
            serializer = AuthorPageSerializer(author)
            data = serializer.data
            
            return Response(data)
        
        # Return error status if author not found
        except Author.DoesNotExist:
            return Response(
                {"error": "Author not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
class EditionDetailView(APIView):
    """
    API view for retrieving detailed information about a specific edition.
    """
    def get(self, request, isbn):
        if request.method == 'OPTIONS':
            return Response(status=status.HTTP_200_OK)
        try:
            # Get record for edition based on passed isbn
            edition = Edition.objects.prefetch_related(
                'related_edition_image',
                'book',
                'book__authors',
                'book__genres'
            ).select_related('publisher').get(isbn=isbn)
            
            serializer = EditionPageSerializer(edition)
            data = serializer.data
            
            # Add user-specific data if user is authenticated
            if request.user.is_authenticated:
                user_book = UserBook.objects.filter(user=request.user, book=edition.book).first()
                
                # Add user status if a UserBook exists
                if user_book:
                    data['user_status'] = {
                        'read_status': user_book.read_status,
                        'is_owned': user_book.is_owned
                    }
                
            return Response(data)
        
        # Return error status if edition not found
        except Edition.DoesNotExist:
            return Response(
                {"error": "Edition not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
