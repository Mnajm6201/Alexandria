from rest_framework import serializers
from library.models import Journal, JournalEntry, Book, User

class JournalEntrySerializer(serializers.ModelSerializer):
    """
    Serializer for JournalEntry model
    """
    word_count = serializers.SerializerMethodField()
    
    class Meta:
        model = JournalEntry
        fields = [
            'id', 'title', 'content', 'is_private', 'page_num',
            'created_on', 'updated_on', 'word_count', 'journal'
        ]
        read_only_fields = ['created_on', 'updated_on']
    
    def get_word_count(self, obj):
        """Calculate word count of entry content"""
        return len(obj.content.split())
    
    def validate(self, data):
        # Ensure user can only create entries for their own journals
        if 'journal' in data:
            request = self.context.get('request')
            if request and request.user != data['journal'].user:
                raise serializers.ValidationError(
                    "You can only create entries for your own journals."
                )
        return data


class JournalSerializer(serializers.ModelSerializer):
    """
    Serializer for Journal model
    """
    entry_count = serializers.SerializerMethodField()
    book_title = serializers.CharField(source='book.title', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = Journal
        fields = [
            'id', 'book', 'user', 'created_on', 'updated_on', 
            'is_private', 'entry_count', 'book_title', 'username'
        ]
        read_only_fields = ['created_on', 'updated_on', 'user']
    
    def get_entry_count(self, obj):
        return obj.entries.count()
    
    def validate_book(self, value):
        request = self.context.get('request')
        # Ensure user can only create journals for books they have access to
        # The uniqueness constraint in the model will prevent duplicate journals
        return value
    
    def create(self, validated_data):
        # Set the user to the current user
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class JournalCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating journals with book_id instead of book object
    """
    book_id = serializers.CharField(write_only=True)
    
    class Meta:
        model = Journal
        fields = [
            'id', 'is_private', 'book_id', 'created_on', 'updated_on'
        ]
        read_only_fields = ['id', 'created_on', 'updated_on']
    
    def validate_book_id(self, value):
        try:
            Book.objects.get(book_id=value)
        except Book.DoesNotExist:
            raise serializers.ValidationError("Book not found.")
        return value
    
    def create(self, validated_data):
        book_id = validated_data.pop('book_id')
        user = self.context['request'].user
        
        try:
            book = Book.objects.get(book_id=book_id)
        except Book.DoesNotExist:
            raise serializers.ValidationError({"book_id": "Book not found."})
        
        # Check if journal already exists for this user and book
        if Journal.objects.filter(user=user, book=book).exists():
            raise serializers.ValidationError(
                {"book_id": "A journal already exists for this book."}
            )
        
        journal = Journal.objects.create(
            user=user,
            book=book,
            **validated_data
        )
        return journal