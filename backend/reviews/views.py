from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from library.models import Review, Book
from .serializers import ReviewSerializer
from django.db.models import Avg
from rest_framework.exceptions import PermissionDenied

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of a review to edit or delete it.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True
            
        # Allow the flag action for any authenticated user
        if view.action == 'flag' and request.method == 'POST':
            return True
            
        # Write permissions are only allowed to the owner of the review
        return obj.user == request.user

class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    
    def get_queryset(self):
        queryset = Review.objects.all()
        
        # Filter by book if book_id is provided
        book_id = self.request.query_params.get('book_id', None)
        if book_id:
            queryset = queryset.filter(book__book_id=book_id)
        
        # Filter by user if user_id is provided
        user_id = self.request.query_params.get('user_id', None)
        if user_id:
            queryset = queryset.filter(user__id=user_id)
        
        # Sort results
        sort_by = self.request.query_params.get('sort_by', 'created_on')
        sort_order = self.request.query_params.get('sort_order', 'desc')
        
        if sort_order.lower() == 'asc':
            queryset = queryset.order_by(sort_by)
        else:  # Default to descending
            queryset = queryset.order_by(f'-{sort_by}')
        
        # Hide flagged reviews (if flagged_count >= 3)
        hide_flagged = self.request.query_params.get('hide_flagged', 'true') == 'true'
        if hide_flagged:
            queryset = queryset.filter(flagged_count__lt=3)
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    def perform_destroy(self, instance):
        # Store the book for later use
        book = instance.book
        
        # Delete the review
        instance.delete()
        
        # Update the book's average rating
        self._update_book_average_rating(book)
        
    def _update_book_average_rating(self, book):
        from decimal import Decimal
        
        # Calculate new average from all reviews
        reviews = Review.objects.filter(book=book)
        if reviews.exists():
            avg_rating = reviews.aggregate(Avg('rating'))['rating__avg']
            # Convert to Decimal before assigning
            book.average_rating = Decimal(str(avg_rating))
        else:
            # Using decimal object
            book.average_rating = Decimal('0.00')
        book.save()
    
    @action(detail=True, methods=['post'])
    def flag(self, request, pk=None):
        # Check if the user is authenticated
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, 
                          status=status.HTTP_401_UNAUTHORIZED)
                          
        review = self.get_object()
        review.flagged_count += 1
        review.save()
        return Response({'status': 'review flagged', 'flagged_count': review.flagged_count})
    
    @action(detail=False, methods=['get'])
    def user_reviews(self, request):
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, 
                          status=status.HTTP_401_UNAUTHORIZED)
        
        reviews = Review.objects.filter(user=request.user)
        page = self.paginate_queryset(reviews)
        
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(reviews, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def book_stats(self, request):
        book_id = request.query_params.get('book_id', None)
        if not book_id:
            return Response({'error': 'book_id parameter is required'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        try:
            book = Book.objects.get(book_id=book_id)
        except Book.DoesNotExist:
            return Response({'error': 'Book not found'}, 
                          status=status.HTTP_404_NOT_FOUND)
        
        reviews = Review.objects.filter(book=book)
        review_count = reviews.count()
        
        # Initialize rating counts
        rating_counts = {i: 0 for i in range(1, 6)}
        
        # Count reviews by rating
        for review in reviews:
            # Convert decimal to int for counting
            rating_int = int(review.rating)
            if 1 <= rating_int <= 5:
                rating_counts[rating_int] += 1
        
        stats = {
            'book_id': book.book_id,
            'title': book.title,
            'average_rating': book.average_rating,
            'review_count': review_count,
            'rating_distribution': rating_counts
        }
        
        return Response(stats)