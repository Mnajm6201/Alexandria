from rest_framework import serializers
from library.models import Review, Book, User
from django.db.models import Avg

class ReviewSerializer(serializers.ModelSerializer):
    user_username = serializers.SerializerMethodField()
    user_profile_pic = serializers.SerializerMethodField()
    
    class Meta:
        model = Review
        fields = [
            'id', 
            'user', 
            'user_username',
            'user_profile_pic',
            'book', 
            'content', 
            'rating', 
            'created_on', 
            'flagged_count'
        ]
        read_only_fields = ['user', 'flagged_count', 'created_on']
    
    def get_user_username(self, obj):
        return obj.user.username if obj.user else None
    
    def get_user_profile_pic(self, obj):
        return obj.user.profile_pic if obj.user else None
    
    def create(self, validated_data):
        # Get the user from the request
        user = self.context['request'].user
        
        # Check if user already has a review for this book
        book = validated_data.get('book')
        existing_review = Review.objects.filter(user=user, book=book).first()
        
        if existing_review:
            # Update existing review
            existing_review.content = validated_data.get('content', existing_review.content)
            existing_review.rating = validated_data.get('rating', existing_review.rating)
            existing_review.save()
            
            # Update book's average rating
            self._update_book_average_rating(book)
            
            return existing_review
        
        # Create new review
        review = Review.objects.create(
            user=user,
            book=validated_data.get('book'),
            content=validated_data.get('content', ''),
            rating=validated_data.get('rating')
        )
        
        # Update book's average rating
        self._update_book_average_rating(book)
        
        return review
    
    def update(self, instance, validated_data):
        instance.content = validated_data.get('content', instance.content)
        instance.rating = validated_data.get('rating', instance.rating)
        instance.save()
        
        # Update book's average rating
        self._update_book_average_rating(instance.book)
        
        return instance
    
    def _update_book_average_rating(self, book):
        from decimal import Decimal
        
        # Calculate new average from all reviews using aggregate
        reviews = Review.objects.filter(book=book)
        if reviews.exists():
            avg_rating = reviews.aggregate(Avg('rating'))['rating__avg']
            # Convert to Decimal before assigning
            book.average_rating = Decimal(str(avg_rating))
        else:
            # Use Decimal object since thats what we set in the model. 
            book.average_rating = Decimal('0.00')
        book.save()