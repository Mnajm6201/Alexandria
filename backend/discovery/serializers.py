from rest_framework import serializers
from .models import FeaturedShelf
from library.models import ShelfEdition

class FeaturedShelfSerializer(serializers.ModelSerializer):
    books = serializers.SerializerMethodField()
    
    class Meta:
        model = FeaturedShelf
        fields = ['id', 'display_title', 'description', 'display_type', 'books']
    
    def get_books(self, obj):
        # Get books from the linked shelf
        shelf_editions = ShelfEdition.objects.filter(shelf=obj.shelf)
        
        # Return formatted book data
        result = []
        for shelf_edition in shelf_editions:
            edition = shelf_edition.edition
            result.append({
                'id': edition.id,
                'isbn': edition.isbn,
                'title': edition.book.title,
                'cover_image': self._get_cover_image(edition),
                'authors': [
                    {'id': author.id, 'name': author.name}
                    for author in edition.book.authors.all()
                ]
            })
        return result
    
    def _get_cover_image(self, edition):
        images = edition.related_edition_image.all()
        primary_images = images.filter(is_primary=True)
        
        if primary_images.exists():
            return primary_images.first().image_url
        
        return images.first().image_url if images.exists() else None