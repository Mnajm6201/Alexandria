from rest_framework import serializers
from library.models import UserBook

class UserBookProgressSerializer(serializers.Serializer):
    """
    Serializer for updating a user's reading progress for a book.
    """
    book_id = serializers.CharField(required=True)
    page_num = serializers.IntegerField(required=True, min_value=0)
    
    def validate_book_id(self, value):
        """
        Validate that the book exists and user has a UserBook record for it.
        """
        user = self.context.get('user')
        
        try:
            UserBook.objects.get(user=user, book__book_id=value)
            return value
        except UserBook.DoesNotExist:
            raise serializers.ValidationError("You are not tracking this book. Add it to your shelves first.")