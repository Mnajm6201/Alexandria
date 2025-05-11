from rest_framework import serializers
from library.models import (
    BookClub, ClubMember, Post, BookClubHistory, Announcement, ReadingSchedule, ScheduleMilestone, PostComment, Book
)
from .utils import get_book_cover, get_book_page_count


'''
Implementation considerations:
Nested Data: considering how deep we want to nest the related data such as (memeber's posts)
Performance: For large clubs, we might want to paginate members/posts
Authorization: Some fields might only be visible to members
Flexibility: Different views might need different serializer configurations
'''

class BookClubSerializer(serializers.ModelSerializer):
    '''
    Serializer for the book club model

    Handles the basic club information including name,
    description, privacy setting, and the associated book.
    '''

    # Member count
    member_count = serializers.SerializerMethodField()

    # Book title
    book_title = serializers.SerializerMethodField()

    # Checking if the current user is a memeber of the book club
    is_user_member = serializers.SerializerMethodField()

    # Use PrimaryKeyRelatedField to ensure we get an ID, not an object
    book = serializers.PrimaryKeyRelatedField(
        queryset=Book.objects.all(),
        required=False,
        allow_null=True
    )

    # Structuring the data
    def get_member_count(self, obj):
        return obj.users.count()

    def get_book_title(self, obj):
        return obj.book.title if obj.book else None

    # if the user is not a memeber we'll filter them out and do somethign on the front that marks that
    # like a join button for false is_user_member
    # and leave for True in is_user_member
    def get_is_user_member(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.users.filter(id=request.user.id).exists()

        return False

    class Meta:
        model = BookClub
        fields = ['id', 'name', 'club_desc', 'is_private', 'book', 'is_user_member', 'member_count', 'book_title', 'about_content', 'club_image']
        # Make book field accept null values if needed
        extra_kwargs = {
            'book': {'required': False, 'allow_null': True},
        }
        
    def update(self, instance, validated_data):
        """
        Custom update method to properly handle book changes
        """
        # Print all incoming data for debugging
        print(f"BookClubSerializer update method received data: {validated_data}")
        
        # Get book data if present (should already be a Book instance due to PrimaryKeyRelatedField)
        book = validated_data.pop('book', None)
        print(f"Book from validated_data: {book}, type: {type(book)}")
        
        # Update regular fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
            
        # Update book field if provided
        if book is not None:
            # Since we're using PrimaryKeyRelatedField, book should already be a Book instance
            instance.book = book
            print(f"Updated book to: {book.title} (ID: {book.id})")
        
        # Save the instance
        instance.save()
        return instance


class ClubMemberSerializer(serializers.ModelSerializer):
    '''
    Serializer for the club member model

    Handles the information, potentially including roles
    or admin status
    '''

    username = serializers.SerializerMethodField()
    profile_pic = serializers.SerializerMethodField()

    # getters to get the members username and profile pic etc
    def get_username(self, obj):
        return obj.user.username

    def get_profile_pic(self, obj):
        return obj.user.profile_pic
    
    class Meta:
        model = ClubMember
        fields = ['id', 'user', 'club', 'username', 'profile_pic', 'is_admin', 'join_date', 'reading_status', 'current_page']


class ClubPostSerializer(serializers.ModelSerializer):
    '''
    Serializer for the club member model

    Handles the discussion posts including content,
    author info, and metrics like comment counts
    '''

    username = serializers.CharField(source='user.username', read_only=True)
    comment_count = serializers.SerializerMethodField()

    def get_comment_count(self, obj):
        return obj.comments.count()
    
    class Meta:
        model = Post
        fields = ['id', 'title', 'content', 'user', 'created_on', 'like_count', 'comment_count', 'username']
        read_only_fields = ['user', 'club', 'created_on', 'like_count', 'comment_count']


class BookClubHistorySerializer(serializers.ModelSerializer):
    book_details = serializers.SerializerMethodField()

    def get_book_details(self, obj):
        if not obj.book:
            return None

        return {
            'id' : obj.book.id,
            'title': obj.book.title,
            'authors': [author.name for author in obj.book.authors.all()],
            'year_published': obj.book.year_published
        }

    class Meta:
        model = BookClubHistory
        fields = ['id', 'book', 'book_details', 'start_date', 'end_date', 'club_rating', 'order']

class AnnouncementSerializer(serializers.ModelSerializer):
    created_by_username = serializers.SerializerMethodField()

    def get_created_by_username(self, obj):
        return obj.created_by.username

    class Meta:
        model = Announcement
        fields =  ['id', 'title', 'content', 'created_by', 'created_by_username', 'created_on', 'is_pinned', 'club']
        read_only_fields = ['created_by', 'created_on', 'club']

    def update(self, instance, validated_data):
        instance.title = validated_data.get('title', instance.title)
        instance.content = validated_data.get('content', instance.content)
        instance.is_pinned = validated_data.get('is_pinned', instance.is_pinned)
        
        # Save the instance
        instance.save()
        return instance
        

class ScheduleMilestoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScheduleMilestone
        fields = ['id', 'title', 'target_date', 'page_start', 'page_end', 'chapter_start', 'chapter_end', 'description']
        read_only_fields = ['schedule']

class ReadingScheduleSerializer(serializers.ModelSerializer):
    milestones = ScheduleMilestoneSerializer(many=True, read_only=True)
    book_details = serializers.SerializerMethodField()

    def get_book_details(self, obj):
        if not obj.book:
            return None

        return {
            'id': obj.book.id,
            'title': obj.book.title,
            'authors': [author.name for author in obj.book.authors.all()],
            'year_published': obj.book.year_published
        }

    class Meta:
        model = ReadingSchedule
        fields = ['id', 'book', 'book_details', 'start_date', 'end_date', 'is_active', 'milestones']
        extra_kwargs = {
            'book': {'required': False, 'allow_null': True},
        }


class BookClubDetailSerializer(serializers.ModelSerializer):
    '''
    Detailed serializer for Book Club with related data

    This expands on the basic serializer to include related
    data like member, recent posts, etc.
    '''

    members = serializers.SerializerMethodField()
    recent_posts = serializers.SerializerMethodField()
    book_details = serializers.SerializerMethodField()
    reading_history = serializers.SerializerMethodField()
    announcements = serializers.SerializerMethodField()
    reading_schedules = serializers.SerializerMethodField()
    is_user_member = serializers.SerializerMethodField()
    member_count = serializers.SerializerMethodField()

    def get_reading_history(self, obj):
        history = BookClubHistory.objects.filter(club=obj).order_by('-end_date')[:5]
        return BookClubHistorySerializer(history, many=True).data

    def get_announcements(self, obj):
        announcements = Announcement.objects.filter(club=obj).order_by('-is_pinned', '-created_on')[:5]
        return AnnouncementSerializer(announcements, many=True).data

    def get_reading_schedules(self, obj):
        active_schedule = ReadingSchedule.objects.filter(club=obj, is_active=True).first()
        if active_schedule:
            return ReadingScheduleSerializer(active_schedule).data

        return None

    def get_is_user_member(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.users.filter(id=request.user.id).exists()
        return False

    def get_member_count(self, obj):
        return obj.users.count()
    
    class Meta:
        model = BookClub
        fields = [
            'id', 'name', 'club_desc', 'is_private', 'book', 'about_content',
            'members', 'recent_posts', 'book_details', 'reading_history',
            'announcements', 'reading_schedules', 'is_user_member', 'member_count',
            'created_on', 'club_image'
        ]

    def get_members(self, obj):
        # Limiting it to 5 members
        members = ClubMember.objects.filter(club=obj)[:5]
        return ClubMemberSerializer(members, many=True).data

    def get_recent_posts(self, obj):
        #Get top 3 most recent posts
        posts = Post.objects.filter(club=obj).order_by('-created_on')[:3]
        return ClubPostSerializer(posts, many=True).data
    

    def get_book_details(self, obj):
        if not obj.book:
            return None

        # Get the book
        book = obj.book
        
        # Get cover image using our utility function
        cover_url = get_book_cover(book)

        # Get the page count
        page_count = get_book_page_count(book)
        # Return book details with cover_url
        return {
            'id': book.id,
            'book_id': book.book_id,
            'title': book.title,
            'summary': book.summary,
            'authors': [author.name for author in book.authors.all()],
            'year_published': book.year_published,
            'cover_url': cover_url,  # Add the cover_url
            'page_count': page_count
        }

# Comment posting seralizers
class PostCommentSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    profile_pic = serializers.CharField(source='user.profile_pic', read_only=True)
    parent_username = serializers.SerializerMethodField()
    children = serializers.SerializerMethodField()

    def get_parent_username(self, obj):
        if obj.parent:
            return obj.parent.user.username

        return None

    def get_children(self, obj):
        children = obj.get_children()
        return PostCommentSerializer(children, many=True).data

    class Meta:
        model = PostComment
        fields = [
            'id', 'content', 'created_on', 'user', 'username', 
            'profile_pic', 'parent', 'parent_username', 'like_count', 
            'children', 'page_num'
        ]
        read_only_fields = ['user', 'created_on', 'like_count']

