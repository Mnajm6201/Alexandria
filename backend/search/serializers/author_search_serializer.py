from rest_framework import serializers
from library.models import Author

class AuthorSearchSerializer(serializers.ModelSerializer):
    biography = serializers.SerializerMethodField()
    author_image = serializers.SerializerMethodField()
    
    class Meta:
        model = Author
        fields = [
            'author_id',
            'name',
            'biography',
            'author_image'
        ]
    
    def get_biography(self, obj):
        return obj.biography if obj.biography else None
    
    def get_author_image(self, obj):
        return obj.author_image if obj.author_image else None