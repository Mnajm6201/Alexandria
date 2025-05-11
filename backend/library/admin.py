from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    Author, Publisher, Book, BookAuthor, Genre, BookGenre, Edition, CoverImage,
    User, UserBook, Achievement, UserAchievement, UserProfile, Shelf, ShelfEdition, Journal,
    JournalEntry, Review, Community, CommunityUser, BookClub, ClubMember,
    Post, PostComment, ReviewComment, ShelfComment, Announcement, ReadingSchedule, ScheduleMilestone
) 


# Customization of the admin table so we able to customize the display for each model

# Creating Inline for easier to edit related data inline instead of switching between models
# Especially for many 2 many relationship tables
class BookAuthorInline(admin.TabularInline):
    """
    TabularInline for BookAuthor to allow inline editing in the BookAdmin
    """

    model = BookAuthor
    extra = 1 # Show an empty row by default for new entries
    autocomplete_fields = ['author']
    ordering = ['author__name']

class BookGenreInline(admin.TabularInline):
    model = BookGenre
    extra = 1
    autocomplete_fields = ['genre']

class EditionInline(admin.TabularInline):
    model = Edition
    extra = 1
    autocomplete_fields = ['book', 'publisher']

class CoverImageInline(admin.TabularInline):
    model = CoverImage
    extra = 1

class UserBookInline(admin.TabularInline):
    model = UserBook
    extra = 1
    autocomplete_fields = ['book']

class UserAchievementInline(admin.TabularInline):
    model = UserAchievement
    extra = 1
    autocomplete_fields = ['achievement']

class ShelfEditionInline(admin.TabularInline):
    model = ShelfEdition
    extra = 1
    autocomplete_fields = ['edition']

class CommunityUserInline(admin.TabularInline):
    model = CommunityUser
    extra = 1
    autocomplete_fields = ['user']

class ClubMemberInline(admin.TabularInline):
    model = ClubMember
    extra = 1
    autocomplete_fields = ['user']


# Book admin
@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    """
    Admin registration of the Book Model

    Variables:
        list_display: Allows us to control what is seen on the admin panel
        search_fields: Allows admin users to search for books by title or author's name, with 2 underscores it allows django
                    to traverse relationships
        list_filter: 
    """
    list_display = ('title', 'year_published', 'average_rating', 'summary')
    search_fields = ('title', 'authors__name')
    list_filter = ('year_published', )
    ordering = ('title',) # Sort it by alphabetically
    inlines = [BookAuthorInline, BookGenreInline, EditionInline]


# Admin section
@admin.register(Author)
class AuthorAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name', )
    inlines = [BookAuthorInline]


# Book Author admin
@admin.register(BookAuthor)
class BookAuthorAdmin(admin.ModelAdmin):
    list_display = ('book', 'author')
    search_fields = ('book__title', 'author__name')
    autocomplete_fields = ['book', 'author']

#Genre admin
@admin.register(Genre)
class GenreAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)
    inlines = [BookGenreInline]

#BookGenre Admin
@admin.register(BookGenre)
class BookGenreAdmin(admin.ModelAdmin):
    list_display = ('book', 'genre')
    search_fields = ('book__title', 'genre__name')


# Publisher Admin
@admin.register(Publisher)
class PublisherAdmin(admin.ModelAdmin):
    list_display = ('name', 'contact_info')
    search_fields = ('name',)

#Edition Admin
@admin.register(Edition)
class EditionAdmin(admin.ModelAdmin):
    list_display = ('book', 'isbn', 'publisher', 'kind', 'publication_year', 'language')
    autocomplete_fields = ['book', 'publisher']
    search_fields = ('isbn',)
    inlines = [CoverImageInline] # Since when it's a new edition, it's basically a new product therefore we would change the coverimage

# Cover Image admin
@admin.register(CoverImage)
class CoverImageAdmin(admin.ModelAdmin):
    list_display = ('edition', 'image_url', 'is_primary')
    search_fields = ('edition__book__title', 'edition__isbn')
    list_filter = ('is_primary',)

# User Admin going to use BaseUserAdmin to preserve Django specialized user management features along with our custom fields
@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = BaseUserAdmin.list_display + ('trust_level',)
    
    # This fields determin how the 'change user' form is organized
    # And we're goign to add in our custom fields as a new section
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Custom Profile Fields', {
            'fields': ('trust_level', 'profile_pic'),
            'classes': ('wide', )
        }),
    )

    # The add_fieldsets determine how the 'add user' form is organized
    # This form is different from the change form and normally only shows essential fields
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
            ('Custom Profile Fields', {
                'fields' : ('trust_level', 'profile_pic'),
                'classes' : ('wide', )
            })
        )

    # Extending from the existing search fields
    search_fields = BaseUserAdmin.search_fields + ('trust_level',)

    # Same with the list_filter
    list_filter = BaseUserAdmin.list_filter + ('trust_level', )

    inlines = [UserBookInline, UserAchievementInline]
    # Keep the order of the users alphabetical from their username
    ordering = ('username',)

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('user', 'book', 'rating', 'created_on', 'flagged_count')
    autocomplete_fields = ['user', 'book']
    list_filter = ('rating', 'created_on', 'flagged_count')


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'zip_code')
    search_fields = ('user__username', 'zip_code')
    

@admin.register(Journal)
class JournalAdmin(admin.ModelAdmin):
    list_display = ("user", "book", "created_on", "updated_on", "is_private")
    search_fields = ('user__username', 'book__title')
    list_filter = ('created_on', 'is_private')

@admin.register(JournalEntry)
class JournalEntryAdmin(admin.ModelAdmin):
    list_display = ("journal", "title", "created_on", "is_private")
    search_fields = ('title', 'journal__book__title', 'journal__user__username')
    list_filter = ('created_on', 'is_private')
    
@admin.register(Community)
class CommunityAdmin(admin.ModelAdmin):
    list_display = ('get_book_title', ) # Since Community can have null therefore we need to do at least show something
    search_fields = ('book__title', 'related_users__user__username') 
    autocomplete_fields = ['book']
    inlines = [CommunityUserInline]
    
    def get_book_title(self, obj):
        return obj.book.title if obj.book else "No Book" # to not show as 'None' rather a string value
    get_book_title.short_description = "Book Title"


@admin.register(CommunityUser)
class CommunityUserAdmin(admin.ModelAdmin):
    list_display = ('community', 'user')
    search_fields = ('community__book__title', 'user__username')


@admin.register(BookClub)
class BookClubAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_private', 'book')
    search_fields = ('name', 'book__title')
    inlines = [ClubMemberInline]

@admin.register(ClubMember)
class ClubMemberAdmin(admin.ModelAdmin):
    list_display = ('club', 'user')
    search_fields = ('club__name', 'user__username')

@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'created_on', 'flagged_count', 'like_count')
    search_fields = ('title', 'user__username', 'community__book__title')
    list_filter = ('created_on', 'flagged_count', 'like_count')


@admin.register(PostComment)
class PostCommentAdmin(admin.ModelAdmin):
    list_display = ('user', 'post', 'created_on', 'flagged_count', 'like_count')
    search_fields = ('user__username', 'post__title')
    list_filter = ('created_on', 'flagged_count', 'like_count')


@admin.register(ReviewComment)
class ReviewCommentAdmin(admin.ModelAdmin):
    list_display = ('user', 'review', 'created_on', 'flagged_count', 'like_count')
    search_fields = ('user__username', 'review__book__title')
    list_filter = ('created_on', 'flagged_count', 'like_count')

@admin.register(ShelfComment)
class ShelfCommentAdmin(admin.ModelAdmin):
    list_display = ('user', 'shelf', 'created_on', 'flagged_count', 'like_count')
    search_fields = ('user__username', 'shelf__name')
    list_filter = ('flagged_count', 'created_on', 'like_count')

@admin.register(Shelf)
class ShelfAdmin(admin.ModelAdmin):
    list_display = ('user', 'name', 'shelf_type', 'is_private', 'creation_date')
    search_fields = ('user__username', 'name')
    list_filter = ('shelf_type', 'is_private')
    inlines = [ShelfEditionInline]

@admin.register(Achievement)
class AchievementAdmin(admin.ModelAdmin):
    list_display = ('name', 'difficulty_lvl')
    search_fields = ('name', )

@admin.register(UserAchievement)
class UserAchievementAdmin(admin.ModelAdmin):
    list_display = ('user', 'achievement', 'completed', 'completion_percentage')
    search_fields = ('achievement', 'user')


@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ('title', 'club', 'created_by', 'created_on', 'is_pinned')
    list_filter = ('is_pinned', 'created_on')
    search_fields = ('title', 'content', 'club__name', 'created_by__username')
    # Newest announcement first
    ordering = ('-created_on', ) 
    date_hierarchy = 'created_on'

@admin.register(ReadingSchedule)
class ReadingScheduleAdmin(admin.ModelAdmin):
    list_display = ('book', 'club', 'start_date', 'end_date', 'is_active')
    list_filter = ('is_active', 'start_date', 'end_date')
    search_fields = ('book__title', 'club__name')
    autocomplete_fields = ['book', 'club']
    date_hierarchy = 'start_date'

@admin.register(ScheduleMilestone)
class ScheduleMilestoneAdmin(admin.ModelAdmin):
    list_display = ('title', 'schedule', 'target_date', 'page_start', 'page_end', 'chapter_start', 'chapter_end')
    search_fields = ('title', 'description', 'schedule__book__title', 'schedule__club__name')
    list_filter = ('target_date',)
    autocomplete_fields = ['schedule']
    date_hierarchy = 'target_date'