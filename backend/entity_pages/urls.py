"""
  Name: urls.py
  Date: 03/22/2025
  Description: URL configuration for the book API. This file maps the URL pattern for retrieving detailed information about a specific book to the BookDetailView. The endpoint is defined as 'api/books/<str:book_id>/', where the <str:book_id> parameter represents the unique identifier of a book.

  Input:
    - A GET request to the URL endpoint with a book_id as a path parameter.

  Output:
    - The BookDetailView processes the request and returns a JSON response with the book details if found,
      or a 404 error response if the book does not exist.

  Notes:
    - This configuration enables the REST API endpoint for fetching detailed book information.
"""
from django.urls import path
from .views import BookDetailView

urlpatterns = [
    path('api/books/<str:book_id>/', BookDetailView.as_view(), name='book-detail'),
]