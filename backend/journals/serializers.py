from rest_framework import serializers
from library.models import Journal, JournalEntry, Book, User, UserBook

class JournalEntrySerializer(serializers.ModelSerializer):
    """
    Serializer for journal entries.
    Handles validation, creation, and updating of entries.
    """
    user_username = serializers.CharField(source='journal.user_book.user.username', read_only=True)
    book_title = serializers.CharField(source='journal.user_book.book.title', read_only=True)
    word_count = serializers.SerializerMethodField()
    
    class Meta:
        model = JournalEntry
        fields = [
            'id', 'journal', 'title', 'content', 'created_on', 'updated_on', 
            'page_num', 'is_private', 'user_username', 'book_title', 'word_count'
        ]
        read_only_fields = ['created_on', 'updated_on', 'user_username', 'book_title']
    
    def get_word_count(self, obj):
        """Calculate word count for the entry content"""
        return len(obj.content.split()) if obj.content else 0

    def validate_journal(self, value):
        """Ensure user can only add entries to their own journals"""
        request = self.context.get('request')
        if request and request.user and value.user_book.user != request.user:
            raise serializers.ValidationError("You can only add entries to your own journals.")
        return value


class JournalSerializer(serializers.ModelSerializer):
    """
    Serializer for journals.
    Handles creation, updating, and listing of journals with optional entry details.
    """
    user_username = serializers.CharField(source='user_book.user.username', read_only=True)
    book_title = serializers.CharField(source='user_book.book.title', read_only=True)
    user_id = serializers.IntegerField(source='user_book.user.id', read_only=True)
    book_id = serializers.IntegerField(source='user_book.book.id', read_only=True)
    entry_count = serializers.SerializerMethodField()
    latest_entry = serializers.SerializerMethodField()
    entries = JournalEntrySerializer(many=True, read_only=True, source='entries.all')
    
    # Add a book field for input only
    book = serializers.PrimaryKeyRelatedField(
        queryset=Book.objects.all(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Journal
        fields = [
            'id', 'user_book', 'user_id', 'book_id', 'created_on', 'updated_on', 'is_private',
            'user_username', 'book_title', 'entry_count', 'latest_entry', 'entries', 'book'
        ]
        read_only_fields = ['created_on', 'updated_on', 'user_username', 'book_title']
    
    def get_entry_count(self, obj):
        """Get count of entries in this journal"""
        return obj.entries.count()
    
    def get_latest_entry(self, obj):
        """Get the latest entry if any exists"""
        latest = obj.entries.order_by('-updated_on').first()
        if latest:
            return {
                'id': latest.id,
                'title': latest.title,
                'updated_on': latest.updated_on,
                'is_private': latest.is_private
            }
        return None
    
    def validate(self, data):
        """
        Validate that a user doesn't create duplicate journals for the same book
        """
        # Check if we have a book field in input
        book = data.pop('book', None)
        request = self.context.get('request')
        
        # If updating, we skip this validation
        if not self.instance and book and request:
            # Check if user already has a journal for this book
            if Journal.objects.filter(
                user_book__user=request.user,
                user_book__book=book
            ).exists():
                raise serializers.ValidationError("You already have a journal for this book.")
            
            # If not, set a temporary attribute to use in create method
            self._book_for_userbook = book
            
        return data
    
    def create(self, validated_data):
        """Create a new journal with UserBook relationship"""
        request = self.context.get('request')
        
        # Check if we have a book from validation
        book = getattr(self, '_book_for_userbook', None)
        
        if book and request:
            # Get or create UserBook
            user_book, _ = UserBook.objects.get_or_create(
                user=request.user,
                book=book
            )
            
            # Set user_book in validated_data
            validated_data['user_book'] = user_book
        
        return super().create(validated_data)


class JournalListSerializer(JournalSerializer):
    """
    Simplified serializer for listing journals without including entries
    """
    class Meta(JournalSerializer.Meta):
        fields = [
            'id', 'user_book', 'user_id', 'book_id', 'created_on', 'updated_on', 'is_private',
            'user_username', 'book_title', 'entry_count', 'latest_entry'
        ]