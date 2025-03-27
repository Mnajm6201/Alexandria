from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
import datetime
from django.core.exceptions import ValidationError
from mptt.models import MPTTModel, TreeForeignKey
from django.contrib.auth.models import AbstractUser

##### Book Stuff #####

# Book Table
# Uniqueness will be ensured with a hash id with authors and title.
# ManyToMany connection with authors, through normalization table, means that author entities should be created first.
class Book(models.Model):
    """Book Table

    Args:
        models (Model Object): Inheritance Model Object

    Variables:
        title: max_length of 255, not null
        summary: text summary of the book, optional
        average_rating: the average rating of the book, 0.00 - 5.00
        year_published:  Original publication date of book (first edition date).
        original_langauge: Original language of work
        book_id: Hashing normalized title and author list ensures book uniqueness.
        authors: ManyToMany relation through BookAuthor table.
    """
    title = models.CharField(
        max_length=255,
        null=False,
        )
    summary = models.TextField(
        blank=True, 
        null=True
        )
    average_rating = models.DecimalField(
        default=0.00, 
        max_digits=3, 
        decimal_places=2,
        validators = [
            MinValueValidator(0.00),
            MaxValueValidator(5.00)
        ]
        )
    year_published = models.PositiveIntegerField(
        blank=True,
        null=True,
        validators = [
            MinValueValidator(1000),
            MaxValueValidator(datetime.date.today().year + 10)
        ],
    )
    original_language = models.CharField(
        max_length = 50,
        blank = True,
        null = True
    )
    book_id = models.CharField(max_length=64, unique=True)
    authors = models.ManyToManyField("Author", through="BookAuthor")
    genres = models.ManyToManyField("Genre", through="BookGenre")

    class Meta:
        verbose_name = "Book"
        verbose_name_plural = "Books"
        ordering = ['title']
        indexes = [
            models.Index(fields = ['title']),
            models.Index(fields=['year_published']),
            models.Index(fields=['book_id'])
        ]

    def __str__(self):
        return self.title

# Author Table
# This needs work, no way to sepeate authors of the same name.
class Author(models.Model):
    """
    Author Table
    Args:
        models (Model Object): Inheritance of the Model's Object

    Variables: 
        name: name of author
        biography: Text (Optional)
        author_image: URL/Text (Optional)
    """
    name = models.CharField(max_length=250) 
    biography = models.TextField(blank=True, null=True)
    author_image = models.URLField(blank=True, null=True)
    author_id = models.CharField(max_length=64, unique=True)
    
    class Meta:
        verbose_name = "Author"
        verbose_name_plural = "Authors"
        ordering = ['name']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['author_id'])
        ]


    def __str__(self):
        return self.name

# Normalization table used by Book's ManyToMany relationship with Author.
class BookAuthor(models.Model):
    """
    Book Author Table

    Relationships:
    - One Book can have multiple BookAuthor entries (One to Many)
    - One Author can have multiple BookAuthor entries (One to Many)

    """
    book = models.ForeignKey('Book', on_delete=models.CASCADE, related_name='related_book_authors')
    author = models.ForeignKey('Author', on_delete=models.CASCADE, related_name='related_author_books')


    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['book', 'author'], name='unique_book_author')
        ]
        indexes = [
            models.Index(fields=['book', 'author']),
            models.Index(fields=['author', 'book'])
        ]

    def __str__(self):
        return f"Author Name - Book Title: {self.author.name} - {self.book.title}"

# Genres Table used for Book data.
class Genre(models.Model):
    """
    Genres Table

    Variables:
        name: Unique name for each genre, max length of 100.
    """

    name = models.CharField(max_length=100, unique=True)
    class Meta:
        verbose_name = "Genre"
        verbose_name_plural = "Genres"
        ordering = ['name']
        
    def __str__(self):
        return self.name

# Normalization table used for Book's ManyToMany relationship with genre.
class BookGenre(models.Model):
    """
    Book Genre Table

    Variables:
        book: Foreign Key from Book
        genre: Foreign Key from Genre

    Class:
        Meta: Unique them together, so it prevents entries from same book-genre pair
    """
    book = models.ForeignKey('Book', on_delete=models.CASCADE, related_name='related_book_genres')
    genre = models.ForeignKey('Genre', on_delete=models.CASCADE, related_name='related_genre_books')

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['book', 'genre'], name='unique_book_genre')
        ]
        indexes = [
            models.Index(fields=['book', 'genre']),
            models.Index(fields=['genre', 'book'])
        ]
        ordering = ['genre__name']

    def __str__(self):
        return f"{self.book.title} - {self.genre.name}"

# Edition Table. This is the center for data uploads.
class Edition(models.Model):
    """
    Edition Table

    Variables:
        book: Foreign Key from Book Table
        isbn: unique serial code for each book, cannot be null
        publisher: Foreign Key from Publisher Table
        kind: Enum: Pick Either ['Hardcover', 'Paperback', 'ebook', 'AudioBook'], since format is a keyword lets go with kind
        publication_year: check valid year, integer
        language: max_length of 50, not null
    """

    # Formatting Choices
    FORMAT_CHOICES = [
        ('Hardcover', 'Hardcover'),
        ('Paperback', 'Paperback'),
        ('eBook', 'eBook'),
        ('Audiobook', 'Audiobook'),
        ('Other', 'Other')
        ]
    
    book = models.ForeignKey("Book", on_delete=models.CASCADE, related_name='editions')
    isbn = models.CharField(max_length=13, unique=True)
    publisher = models.ForeignKey("Publisher", on_delete=models.SET_NULL, related_name='editions', null=True, blank=True)
    kind = models.CharField(max_length=10, choices=FORMAT_CHOICES, null=False)
    publication_year = models.PositiveIntegerField(
            validators=[
                MinValueValidator(1500),
                MaxValueValidator(datetime.date.today().year)]
        )
    language = models.CharField(max_length=50, null=False)
    page_count = models.PositiveIntegerField(null=True, blank=True)
    edition_number = models.PositiveIntegerField(null=True, blank=True)
    abridged = models.BooleanField(default=False)
    class Meta:
        verbose_name = "Edition"
        verbose_name_plural = "Editions"
        ordering = ['-publication_year']
        indexes = [
            models.Index(fields=['isbn']),
            models.Index(fields=['publication_year']),
            models.Index(fields=(['kind']))
        ]

    def __str__(self):
        return f'{self.book.title} - {self.kind} - ({self.isbn}) - ({self.publication_year})'

# Publisher Table, used by edition.
class Publisher(models.Model):
    """
    Publisher Table

    Args:
        models (Model Object): Inheritance of the Model's Object

    Variables:
        name: max_length of 100, publisher's name
        contact_info: contact information for the publisher
    """
    name = models.CharField(max_length=100, unique=True)
    contact_info = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        verbose_name = "Publisher"
        verbose_name_plural = "Publishers"
        ordering = ['name']
        indexes = [
            models.Index(fields=['name'])
        ]

    def __str__(self):
        return self.name  

# Cover Image table connecting to edition.
class CoverImage(models.Model):
    """
    Cover Image Table

    Variables:
        edition: Foreign Key from Edition Table (One To Many Relationship)
        image_url: the cover image of the book, not null (Text)
        is_primary: if it's going to be the primary cover, (default: false)
    """
    edition = models.ForeignKey("Edition", on_delete=models.CASCADE, related_name="related_edition_image")
    image_url = models.URLField()
    is_primary = models.BooleanField(default=False)

    class Meta:
        verbose_name = "CoverImage"
        verbose_name_plural = "CoverImages"

    def __str__(self):
        return f"Book - URL - primary?: {self.edition.book} - {self.image_url} - {self.is_primary}"

##### User Stuff #####

# User Table
class User(AbstractUser):
    """
    User Table

    Inherits from Django's AbstractUser class. 
    Additional Variables:
        trust_level: User's Trust Level in terms of lending books, default 50, maximum 100, minimum 0.
        profile_pic: URL to profile image.
        books: ManyToMany relationship normalized through UserBook.
        achievements: ManyToMany relationship normalized through UserAchievements.
    """
    trust_level = models.IntegerField(
        validators=[
            MinValueValidator(0),
            MaxValueValidator(100),
            ],
        default=50,
        )
    profile_pic = models.URLField(blank=True, null=True)
    books = models.ManyToManyField("Book", through="UserBook")
    achievements = models.ManyToManyField("Achievement", through="UserAchievement")

    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"
        indexes = (
            models.Index(fields=['username']),
            models.Index(fields=['email']),
        )
        ordering = ['username']
        
# User Book Table. Normalization tabe used by User's ManyToMany relationship with Book.
class UserBook(models.Model):
    """
    User Book Table

    Variables:
        book: Foreign Key from Book (Zero to Many)
        user: Foreign Key from User (Zero to Many)
        read_status: Enum('Read', 'Reading', 'Want to Read'), defaulted to want to read
        page_num: amount of pages, default 0
        is_owned: if it's owned by anyone , boolean: default false
        date_started: optional: starting date
        date_ended: optional: date finished
    """

    # Enum for read status
    READ_STATUS_CHOICES = [
        ('Read', 'Read'),
        ('Reading', 'Reading'),
        ('Want to Read', 'Want to Read')
        ]

    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='related_user_books')
    book = models.ForeignKey('Book', on_delete=models.CASCADE, related_name='related_user_books')
    read_status = models.CharField(max_length=20, choices=READ_STATUS_CHOICES, default='Want to Read')
    page_num = models.PositiveBigIntegerField(default=0)
    is_owned = models.BooleanField(default=False)
    date_started = models.DateField(blank=True, null=True)
    date_ended = models.DateField(blank=True, null=True)
    
    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['user', 'book'], name='unique_user_book')
        ]
        indexes = [
            models.Index(fields=['read_status']),
            models.Index(fields=['is_owned']),
        ]


    def __str__(self):
        return f"{self.user.username} - {self.book.title} - ({self.read_status})"


# Achievement Table
class Achievement(models.Model):
    """
    Achievements Table

    Variables:
        name: name of the achievements, not null and unique and maxlength of 50
        achieve_desc: description of the achievement, TEXT
        achieve_icon: icon of the achievement, TEXT
    """

    name = models.CharField(max_length=50, null=False, unique=True)
    achieve_desc = models.TextField(blank=True, null=True)
    achieve_icon = models.URLField(blank=True, null=True)
    difficulty_lvl = models.PositiveIntegerField(blank=True, null = True)

    class Meta:
        verbose_name = "Achievement"
        verbose_name_plural = "Achievements"
        indexes = (
            models.Index(fields=['name']),
            models.Index(fields=['difficulty_lvl'])
        )
        ordering = ['name']

    def __str__(self):
        return self.name


# User Achievements Table used for normnalization in User's ManyToMany relationship with Achievement.
class UserAchievement(models.Model):
    """
    User Achievements Table

    Variables:
        user: Foreign Key from User Table
        achievement: Foreign Key from Achievement Table
        completed: achievement status, default to false, boolean
        completion_percentage: percentage of completion, default to 0.00, 5 digits and 2 decimal places
    """

    user = models.ForeignKey("User", on_delete=models.CASCADE, related_name="user_achievements")
    achievement= models.ForeignKey("Achievement", on_delete=models.CASCADE, related_name="related_achievement_users")
    completed = models.BooleanField(default=False)
    completion_percentage = models.DecimalField(default=0.00, max_digits=5, decimal_places=2)


    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['user', 'achievement'], name='unique_user_achievement')
        ]
        indexes = [
            models.Index(fields=['completed'])
        ]
        ordering = ['completion_percentage']

    def __str__(self):
        return f"{self.user} - {self.achievement} (Completed: {self.completed})"


# User Profile
class UserProfile(models.Model):
    """
    User Profile Table

    Variables:
        user: One to One relation from User (One to One)
        bio: optional: text of user's biography
        user_location: optional: maxlength of 100
        social_links: optional
    """

    user = models.OneToOneField('User', on_delete=models.CASCADE, related_name="related_user_profile")
    bio = models.TextField(null=True, blank=True)
    user_location = models.CharField(max_length=100, blank=True, null=True)
    social_links = models.CharField(blank=True, null=True)

    class Meta:
        verbose_name = "UserProfile"
        verbose_name_plural = "UserProfiles"
        indexes = [
            models.Index(fields=['user_location'])
        ]

    def __str__(self):
        return f'{self.user.username}'

# Shelf table
class Shelf (models.Model):
    """
    Shelf table

    Variables:
    user: Foriegn key: the user who the shelf belongs to.
    name: max length 250 char: the given name for shelf
    shelf_desc: text: optional: the given description.
    shelf_img: URL/text: the shelf's user ganted image url.
    is_private: boolean: default False. Represents whether shelf is maked private.
    shelf_type: ENUM: the shelf's type.
    books: ManyToMany field with Edition Table normalized through ShelfEdition.
    created_on: The date the shelf was created.
    """
    SHELF_TYPES = [
        ("Owned", "Owned"),
        ("Read", "Read"),
        ("Reading", "Reading"),
        ("Want to Read", "Want to Read"),
        ("Available", "Available"),
        ("Lent Out", "Lent Out"),
        ("Custom", "Custom"),
    ]
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name="shelves")
    name = models.CharField(max_length=250)
    shelf_desc = models.TextField(null=True, blank=True)
    shelf_img = models.URLField(null=True, blank=True)
    is_private = models.BooleanField(default=False)
    shelf_type = models.CharField(max_length=20, choices=SHELF_TYPES, null=False)
    books = models.ManyToManyField("Edition", through="ShelfEdition")
    creation_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Shelf"
        verbose_name_plural = "Shelves"
        indexes = [
            models.Index(fields=["name"]),
            models.Index(fields=["shelf_type"])
        ]
        ordering = ["name"]

    def __str__(self):
        return f"{self.user} {self.name} {self.shelf_type}"
    
class ShelfEdition(models.Model):
    """
    ShelfBook Table (Normalization Table)

    Variables:
    shelf: Foriegn key to Shelf
    edition: Foriegn key to Edition
    """
    shelf = models.ForeignKey("Shelf", on_delete=models.CASCADE, related_name="shelf_books")
    edition = models.ForeignKey("Edition", on_delete=models.CASCADE, related_name="edition_shelves")

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['shelf', 'edition'], name='unique_shelf_edition')
        ]

    def __str__(self):
        return f'{self.shelf.name} - {self.edition}'

# Journal Entry Table for user created journal associated with specific books.
class JournalEntry(models.Model):
    """
    Journal Entry Model

    Variables:
    user_book: FK to UserBook asscoaites user's journal to a specific book.
    title: Optional string to head journal entry
    content: Text content of the journal entry
    created_on: Date the journal was created
    updated_on: Date the journal was last updated.
    page_num: Optional page number refrence.
    """

    user_book = models.ForeignKey(
        "UserBook",
        on_delete = models.CASCADE,
        related_name = "journal_entries"
    )
    title = models.CharField(max_length=255, null=True, blank=True)
    content = models.TextField()
    created_on = models.DateTimeField(auto_now_add=True)
    updated_on = models.DateTimeField(auto_now=True)
    page_num = models.PositiveIntegerField(null=True, blank=True)
    is_private = models.BooleanField(default=False)
    

    class Meta:
        verbose_name = "JournalEntry"
        verbose_name_plural = "JournalEntries"
        indexes = [
            models.Index(fields=["title"]),
            models.Index(fields=["page_num"]),
            models.Index(fields=["updated_on"]),
        ]
        ordering = ["-updated_on"]
    
    def __str__(self):
        return f"Journal Entry by {self.user_book.user} on {self.user_book.book.title}"


##### Community Stuff #####

# Review table
class Review(models.Model):
    """
    Review Table

    Variables:
        book: Foriegn key associated with book table.
        user: Foriegn key associated with user table.
        content: optional: written text of review.
        rating: decimal value 0.00-5.00 representing star rating.
        created_on: Date: date the review is created on.
        flagged_count: integer value, initialized to 0, 
            representing how many times review has been flagged as voilating TOS.
    """
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name="reviews")
    book = models.ForeignKey("Book", on_delete=models.CASCADE, related_name='reviews')
    content = models.TextField(null=True, blank=True)
    created_on = models.DateTimeField(auto_now_add=True)
    flagged_count = models.PositiveBigIntegerField(default=0)
    rating = models.DecimalField(
        max_digits=3, 
        decimal_places=2, 
        validators=[
            MinValueValidator(0.00),
            MaxValueValidator(5.00)
        ],
    )
    class Meta:
        verbose_name = "Review"
        verbose_name_plural = "Reviews"
        indexes = [
            models.Index(fields=["created_on"]),
            models.Index(fields=["rating"]),
        ]
        ordering = ["-created_on"]

    def __str__(self):
        return f'Review by {self.user} on {self.book} - {self.rating} stars'

# Community Table
class Community(models.Model):
    """
    Community Table

    Variables:
        book: Foreign Key, 1 to 1 Relationship with Book
    """
    book = models.OneToOneField(
        Book,
        on_delete=models.CASCADE,
        related_name='related_community',
        null=True,
        blank=True
        )
    users = models.ManyToManyField("User", through="CommunityUser")

    class Meta:
        verbose_name = "Community"
        verbose_name_plural = "Communities"

    def __str__(self):
        return f"Community for {self.book.title}" if self.book else "Community (No Book)"

# CommunityFollower table. Used for normalization in Community's ManyToMany relationship with User
class CommunityUser(models.Model):
    """
    CommunityUser Table

    Variables:
        community: Foriegn Key from Community -- 
            Community has many CommunityFollowers, CommunityFollower has one Community.
        user: Foriegn Key from User --
            User has many CommunityFollowers, CommunityFollower has one User.
    """
    community = models.ForeignKey('Community', on_delete=models.CASCADE, related_name="related_users")
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name="related_communities")

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['community', 'user'], name='unique_community_user')
        ]
    
    def __str__(self):
        return f"{self.user.username} in {self.community}"

# Book Club Table
class BookClub(models.Model):
    """
    Book Club Table

    Variables:
        name: One to Many relation from Club Member (One to Many)
        club_desc: optional: text description of club
        is_private: sets whether or not club is private (default FALSE)
    """

    name = models.CharField(max_length=250, null=False)
    club_desc = models.TextField(null=True, blank=True)
    is_private = models.BooleanField(default=False)
    users = models.ManyToManyField("User", through="ClubMember")
    book = models.ForeignKey(
        Book,
        on_delete=models.CASCADE,
        related_name='related_book_club',
        null=True,
        blank=True
        )
    class Meta:
        verbose_name = "BookClub"
        verbose_name_plural = "BookClubs"
        indexes = [
            models.Index(fields=["name"])
        ]
        ordering = ['name']

    def __str__(self):
        return self.name

# Club Member Table. Used for normalization in Club's ManyToMany relationship to user.
class ClubMember(models.Model):
    """
    Club Member Table

    Variables:
        club_user: One to Many relation from User (One to Many)
    """

    club = models.ForeignKey('BookClub', on_delete=models.CASCADE)
    user = models.ForeignKey('User', on_delete=models.CASCADE)

    class Meta:
      constraints = [
            models.UniqueConstraint(fields=['user', 'club'], name='unique_club_user')
        ]

    def __str__(self):
        return f"{self.user.username} in {self.club.name}"
    
# Post table for book club post and community post.
class Post(models.Model):
    """
    Post Model

    Variables:
        user: ForiegnKey to User table (author of the post)
        thumbnail: up to 255 character string that represents the title of post.
        content: Text content of the post
        created_on: Date that the post was created.
        page_num: Optional integer represents the page number that the post is relevant to (or up to).
        flagged_count: Integer, default 0, number of times the post has been flagged for violating TOS.
        like_count: Integer, defualt 0, number of times the post has been liked.

        community: ForiegnKey refrencing comnmunity table.
        club: ForiegnKey refrencing the book club table.

    Functions:
        clean: Ensures data entry not filled with both or neither of the foriegn key types.

    Classes:
        Meta: Serves constaints to ensure data integrity.
    """

    # Should have one and only one of these relations.
    community = models.ForeignKey(
        "Community", 
        on_delete=models.CASCADE, 
        related_name="community_posts", 
        null = True, 
        blank = True
        )
    club = models.ForeignKey(
        "BookClub", 
        on_delete=models.CASCADE, 
        related_name="club_posts", 
        null = True, 
        blank = True
        )
    user = models.ForeignKey(
        "User", 
        on_delete=models.CASCADE, 
        related_name="user_posts"
        )
    title = models.CharField(max_length=250) 
    content = models.TextField(null=True, blank=True)
    created_on = models.DateTimeField(auto_now_add=True)
    flagged_count = models.PositiveIntegerField(default = 0)
    like_count = models.PositiveIntegerField(default = 0)
    page_num = models.PositiveIntegerField(null = True, blank = True)
    
    # Stops bad data from being saved by Djano ORM.
    def clean(self):
        """
        Ensure a post is linked exactly one of (BookClub or Community)
        """
        if self.club and self.community:
            raise ValidationError("A post cannot belong to both a BookClub and a Community.")
        if not self.club and not self.community:
            raise ValidationError("A post must belong to either a BookClub or a Community.")
        super().clean()
    
    def save(self, *args, **kwargs):
        """
        Run validation before saving the post.
        """
        self.full_clean()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Post by {self.user} in {'BookClub' if self.club else 'Community'}"
    
    # Stops bad data from existing in the database (if somehow Django ORM clean is bypassed).
    class Meta:
        constraints = [
            models.CheckConstraint(
                check=(
                    (models.Q(club__isnull=False) & models.Q(community__isnull=True)) |
                    (models.Q(club__isnull=True) & models.Q(community__isnull=False))
                ),
                name="post_must_have_one_relation"
            )
        ]
        verbose_name = "Post"
        verbose_name_plural = "Posts"
        indexes = [
            models.Index(fields=["title"]),
            models.Index(fields=["like_count"]),
            models.Index(fields=["page_num"])
        ]
        ordering = ["-created_on"]

# Comment base class and concrete class for comments.
# We use the Abstract Base Class method to deal with the polymorphism issue of our many comment types.
# To add a new comment type simply add a new concrete class.
# Base comment class:
class BaseComment(MPTTModel):
    """
    Abstract Base Class for Comments.

    Variables:
        user: FK to User table (author of the comment)
        content: Text content of the comment
        created_on: DateTime when the comment was created.
        flagged_count: Number of times the comment was flagged as violating TOS.
        like_count: Number of times the comment was liked.
        page_num: Optional page number refrence.
        parent: TreeForiegnKey using MPTT, whcih allows for deeply nested comments stored in tree structure.
    """

    user = models.ForeignKey(
        "User",
        on_delete=models.CASCADE,
        related_name="%(class)s_comments" 
    )
    content = models.TextField()
    created_on = models.DateTimeField(auto_now_add=True)
    flagged_count = models.PositiveIntegerField(default=0)
    like_count = models.PositiveIntegerField(default=0)
    page_num = models.PositiveIntegerField(null=True, blank=True)
    parent = TreeForeignKey(
        'self',
        on_delete = models.SET_NULL,
        null = True,
        blank = True,
        related_name = "children"
    )
    

    class Meta:
        abstract = True
        ordering = ['-created_on']
        indexes = [
            models.Index(fields=["like_count"]),
            models.Index(fields=["page_num"]),
            models.Index(fields=["created_on"])
        ]
    
    # Tree insertion order specification.
    class MPTTMeta:
        order_insertion_by = ['-created_on']
    
    def __str__(self):
        return f"Comment by {self.user} - {self.content[:20]}"
    
# Concrete Classes
class PostComment(BaseComment):
    """
    Concrete Comment Model for Post Comments
    """
    post = models.ForeignKey("Post", on_delete=models.CASCADE, related_name="comments")

class ReviewComment(BaseComment):
    """
    Concrete Comment Model for Review Comments
    """
    review = models.ForeignKey("Review", on_delete=models.CASCADE, related_name="comments")

class ShelfComment(BaseComment):
    """
    Concrete Comment Model for Shelf Comments
    """
    shelf = models.ForeignKey("Shelf", on_delete=models.CASCADE, related_name="comments")

# Do you see this