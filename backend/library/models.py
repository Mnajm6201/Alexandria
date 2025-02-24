from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
import datetime
# Database schema

# Author Table
class Author(models.Model):
    """
    Author Table
    Args:
        models (Model Object): Inheritance of the Model's Object

    Variables: 
        Primary_Keys are auto generated in Django if non specified
        name: max_length: 250, char
        biography: Text (Optional)
        author_image: URL/Text (Optional)
    """
    name = models.CharField(max_length=250, unique=True) 
    biography = models.TextField(blank=True, null=True)
    author_image = models.URLField(blank=True, null=True)

    def __str__(self):
        return self.name


# Publisher Schema
class Publisher(models.Model):
    """
    Publisher Table

    Args:
        models (Model Object): Inheritance of the Model's Object

    Variables:
        name: max_length of 100, publisher's name
        contact_info: contact information for the publisher
    """
    name = models.CharField(max_length=100, null=False, unique=True)
    contact_info = models.TextField() # it's mandatory so not setting any paramters


    def __str__(self): # debug to test out if it's locating the database values correctly
        return self.name  

    
# Book Table
class Book(models.Model):
    """Book Table

    Args:
        models (Model Object): Inheritance Model Object

    Variables:
        title: max_length of 255, not null
        summary: summary of the book, optional
        average_rating: the average rating of the book, max_digits = 3, decimal_place = 2
        community: Foreign Key: 
    """
    title = models.CharField(max_length=255, null=False)
    summary = models.TextField(blank=True, null=True)
    average_rating = models.DecimalField(default=0.00, max_digits=3, decimal_places=2)
    community = models.OneToOneField(
        'Community',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='related_book')
    
    def __str__(self):
        return self.title


# Edition Table
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
        ('ebook', 'ebook'),
        ('Audiobook', 'Audiobook')
        ]
    
    book = models.ForeignKey("Book", on_delete=models.CASCADE, related_name='related_editions')
    isbn = models.CharField(max_length=13, unique=True, null=False) # cannot be null
    publisher = models.ForeignKey("Publisher", on_delete=models.CASCADE, related_name='related_publisher_editions')
    kind = models.CharField(max_length=10, choices=FORMAT_CHOICES, null=False)
    publication_year = models.PositiveBigIntegerField(
            validators=[
                MinValueValidator(1500), # Earliest reasonable publication year
                MaxValueValidator(datetime.date.today().year)]
            , null=False# Current year or earlier is the maximum you can have  
        )
    language = models.CharField(max_length=50, null=False)


    def __str__(self):
        return f'{self.book.title} - ({self.kind}) - ({self.isbn})'


# Cover Image table
class CoverImage(models.Model):
    """
    Cover Image Table

    Variables:
        edition: Foreign Key from Edition Table (One To Many Relationship)
        image_url: the cover image of the book, not null (Text)
        is_primary: if it's going to be the primary cover, (default: false)
    """
    edition = models.ForeignKey("Edition", on_delete=models.CASCADE, related_name="related_edition_image")
    image_url = models.TextField(null=False)
    is_primary = models.BooleanField(default=False)

    def __str__(self):
        return f"Book - URL - primary?: {self.edition.book} - {self.image_url} - {self.is_primary}"


class BookAuthor(models.Model):
    """
    Book Author Table

    Relationships:
    - One Book can have multiple BookAuthor entries (One to Many)
    - One Author can have multiple BookAuthor entries (One to Many)

    """
    book = models.ForeignKey('Book', on_delete=models.CASCADE, related_name='related_book_authors')
    author = models.ForeignKey('Author', on_delete=models.CASCADE, related_name='related_author_books')

    def __str__(self):
        return f"Author Name - Book Title: {self.author.name} - {self.book.title}"

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

    def __str__(self):
        return f"Community for {self.book.title}" if self.book else "Community (No Book)"


# Genres Table
class Genres(models.Model):
    """
    Genres Table

    Variables:
        name: Unique name for each genre, max length of 100.
    """

    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


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
    genre = models.ForeignKey('Genres', on_delete=models.CASCADE, related_name='related_genre_books')

    class Meta:
        unique_together = ('book', 'genre')

    def __str__(self):
        return f"{self.book.title} - {self.genre.name}"



# User Table
class User(models.Model):
    """
    User Table

    Variables:
        user_email: User's Email, maxlength of 250, unique, and not null
        username: User's Username, maxlenght of 50, unique, and not null
        password_hash: User's password's hashed function to dehash, not null
        trust_level: User's Trust Level in terms of lending books, default 50, maximum 100, minimum 0
        profile_pic: User's profile picture check if the extensions are ["JPG", "PNG", "WebP"] # working on this
    """

    user_email = models.EmailField(max_length=250, unique=True, null=False)
    username = models.CharField(max_length=50, unique=True, null=False)
    password_hash = models.TextField(null=False)
    trust_level = models.IntegerField(
        validators=[
            MinValueValidator(0),
            MaxValueValidator(100),
            ],
        default=50,
        )

    profile_pic = models.URLField(blank=True, null=True)



# User Book Table
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
        unique_together = ('user', 'book')


    def __str__(self):
        return f"{self.user.username} - {self.book.title} - ({self.read_status})"


# Achievement Table
class Achievements(models.Model):
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


    def __str__(self):
        return self.name


# User Achievements Table
class UserAchievements(models.Model):
    """
    User Achievements Table

    Variables:
        user: Foreign Key from User Table
        achievement: Foreign Key from Achievement Table
        completed: achievement status, default to false, boolean
        completion_percentage: percentage of completion, default to 0.00, 5 digits and 2 decimal places
    """

    user = models.ForeignKey("User", on_delete=models.CASCADE, related_name="user_achievements")
    achievement= models.ForeignKey("Achievements", on_delete=models.CASCADE, related_name="related_achievement_users")
    completed = models.BooleanField(default=False)
    completion_percentage = models.DecimalField(default=0.00, max_digits=5, decimal_places=2)


    class Meta:
        unique_together = ('user', 'achievement')

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

    def __str__(self):
        return self.user


# Club Member Table
class ClubMember(models.Model):
    """
    Club Member Table

    Variables:
        club_user: One to Many relation from User (One to Many)
    """

    club = models.ForeignKey('BookClub', on_delete=models.CASCADE)
    user = models.ForeignKey('User', on_delete=models.CASCADE)

    class Meta:
        unique_together = ('club', 'user')

    def __str__(self):
        return f"{self.user.username} in {self.club.name}"


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

    book = models.ForeignKey(
        Book,
        on_delete=models.CASCADE,
        related_name='related_book_club',
        null=True,
        blank=True
        )

    def __str_(self):
        return self.name

# Post Table
class Post(models.Model):
    pass

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
    def __str__(self):
        return f'Review by {self.user} on {self.book} - {self.rating} stars'

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
    shelf_img = models.TextField(null=True, blank=True)
    is_private = models.BooleanField(default=False)
    shelf_type = models.CharField(max_length=20, choices=SHELF_TYPES, null=False)

    def __str__(self):
        return f"{self.user} {self.name} {self.shelf_type}"
    


