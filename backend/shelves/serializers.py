from rest_framework import serializers
from library.models import Shelf, ShelfEdition, Edition

class ShelfSerializer(serializers.ModelSerializer):
    """Serializer for shelf model"""
    
    class Meta:
        model = Shelf
        fields = ['id', 'name', 'shelf_desc', 'shelf_img', 'is_private', 'shelf_type', 'creation_date']
        read_only_fields = ['id', 'creation_date']
        
    def validate_name(self, value):
        """Validate shelf name"""
        request = self.context.get('request')
        user = request.user
        
        # Check for existing shelf with same name for this user
        if request and request.method == 'POST':  # Only apply on creation
            if Shelf.objects.filter(user=user, name=value).exists():
                raise serializers.ValidationError("You already have a shelf with this name.")
                
        return value
    def update(self, instance, validated_data):
        """
        On update (PUT/PATCH), ignore any 'shelf_type' field
        so the shelf_type remains whatever it was originally.
        """
        if 'shelf_type' in validated_data:
            validated_data.pop('shelf_type')
        return super().update(instance, validated_data)
    

class AddEditionToShelfSerializer(serializers.Serializer):
    """
    Serializer for adding an edition to a shelf.
    
    This serializer validates that:
    1. The edition exists
    2. The edition is not already on this shelf
    
    It returns the ShelfEdition object representing the relationship.
    """
    edition_id = serializers.IntegerField(required=True)
    
    def validate_edition_id(self, value):
        """
        Validate that the edition exists.
        """
        try:
            Edition.objects.get(pk=value)
            return value
        except Edition.DoesNotExist:
            raise serializers.ValidationError("Edition does not exist.")
    
    def validate(self, data):
        """
        Validate that the edition is not already on this shelf.
        """
        shelf = self.context.get('shelf')
        edition_id = data.get('edition_id')
        
        if ShelfEdition.objects.filter(shelf=shelf, edition_id=edition_id).exists():
            raise serializers.ValidationError(
                "This edition is already on this shelf."
            )
        
        return data
    
    def create(self, validated_data):
        """
        Create a new ShelfEdition relationship.
        """
        shelf = self.context.get('shelf')
        edition_id = validated_data.get('edition_id')
        
        shelf_edition = ShelfEdition.objects.create(
            shelf=shelf,
            edition_id=edition_id
        )
        
        return shelf_edition

class ShelfEditionSerializer(serializers.ModelSerializer):
    """
    Serializer for ShelfEdition model for read operations.
    """
    edition_id = serializers.IntegerField(source='edition.id')
    edition_title = serializers.CharField(source='edition.book.title', read_only=True)
    edition_format = serializers.CharField(source='edition.kind', read_only=True)
    isbn = serializers.CharField(source='edition.isbn', read_only=True)
    publication_year = serializers.IntegerField(source='edition.publication_year', read_only=True)
    cover_image = serializers.SerializerMethodField()
    authors = serializers.SerializerMethodField()
    
    class Meta:
        model = ShelfEdition
        fields = [
            'id', 'edition_id', 'edition_title', 'edition_format', 
            'isbn', 'publication_year', 'cover_image', 'authors'
        ]
    
    def get_cover_image(self, obj):
        """
        Get the cover image URL for the edition.
        Finds the primary cover image if available, otherwise returns the first cover image.
        """
        images = obj.edition.related_edition_image.all()
        
        # Try to find a primary image first
        primary_images = images.filter(is_primary=True)
        if primary_images.exists():
            return primary_images.first().image_url
        
        # If no primary image, return the first image or None
        return images.first().image_url if images.exists() else None
    
    def get_authors(self, obj):
        """
        Get a list of the book's authors.
        """
        return [
            {'id': author.id, 'name': author.name}
            for author in obj.edition.book.authors.all()
        ]