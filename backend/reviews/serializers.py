from rest_framework import serializers
from library.models import Review, Book, User
from django.db.models import Avg
from decimal import Decimal


    
class ReviewSerializer(serializers.ModelSerializer):
    user_username = serializers.SerializerMethodField()
    user_profile_pic = serializers.SerializerMethodField()
    book_title = serializers.SerializerMethodField()
    book_author = serializers.SerializerMethodField()
    book_cover = serializers.SerializerMethodField()
    
    class Meta:
        model = Review
        fields = [
            'id', 
            'user', 
            'user_username',
            'user_profile_pic',
            'book', 
            'book_title',
            'book_author',
            'book_cover',
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
    
    def get_book_title(self, obj):
        return obj.book.title if obj.book else "Unknown Book"
    
    def get_book_author(self, obj):
        if obj.book:
            authors = obj.book.authors.all()
            if authors.exists():
                return authors[0].name
        return "Unknown Author"
    
    def get_book_cover(self, obj):
        if not obj.book:
            return None
        
        # First try to find primary edition
        primary_editions = obj.book.editions.filter(is_primary=True)
        if primary_editions.exists():
            primary_edition = primary_editions.first()
            # Get cover image from primary edition
            primary_covers = primary_edition.related_edition_image.filter(is_primary=True)
            if primary_covers.exists():
                return primary_covers.first().image_url
            
            # If no primary cover, get any cover
            any_covers = primary_edition.related_edition_image.all()
            if any_covers.exists():
                return any_covers.first().image_url
        
        # If no primary edition, check all editions for covers
        for edition in obj.book.editions.all():
            primary_covers = edition.related_edition_image.filter(is_primary=True)
            if primary_covers.exists():
                return primary_covers.first().image_url
            
            any_covers = edition.related_edition_image.all()
            if any_covers.exists():
                return any_covers.first().image_url
                
        return None
    
    def to_internal_value(self, data):
        # Make a mutable copy of the data
        mutable_data = data.copy() if hasattr(data, 'copy') else dict(data)
        
        # If 'book' is in the data and it's a string that's not a digit
        if 'book' in mutable_data and isinstance(mutable_data['book'], str) and not mutable_data['book'].isdigit():
            try:
                # Look up the Book by book_id
                book_id = mutable_data['book']
                book = Book.objects.get(book_id=book_id)
                # Replace the book_id with the actual primary key
                mutable_data['book'] = book.id
            except Book.DoesNotExist:
                raise serializers.ValidationError({'book': f"Book with book_id '{book_id}' not found"})
        
        # Call the parent's to_internal_value with our modified data
        return super().to_internal_value(mutable_data)
    
    def create(self, validated_data):
        # Get the user from the request
        user = self.context['request'].user
        
        # Get the book from validated_data
        book = validated_data.get('book')
        
        # Check if user already has a review for this book
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
        
        # Update book if provided
        if 'book' in validated_data:
            instance.book = validated_data.get('book')
            
        instance.save()
        
        # Update book's average rating
        self._update_book_average_rating(instance.book)
        
        return instance
    
    def _update_book_average_rating(self, book):
        # Calculate new average from all reviews using aggregate
        reviews = Review.objects.filter(book=book)
        if reviews.exists():
            avg_rating = reviews.aggregate(Avg('rating'))['rating__avg']
            # Convert to Decimal before assigning
            book.average_rating = Decimal(str(avg_rating))
        else:
            # Use Decimal object since thats what we set in the model
            book.average_rating = Decimal('0.00')
        book.save()