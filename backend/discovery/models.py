from django.db import models
from library.models import Shelf

class FeaturedShelf(models.Model):
    shelf = models.ForeignKey(Shelf, on_delete=models.CASCADE, related_name="discovery_features", null=True)
    display_title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    display_order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    display_type = models.CharField(
        max_length=20, 
        choices=[
            ('CAROUSEL', 'Horizontal Carousel'),
            ('GRID', 'Grid Layout'),
            ('HERO', 'Hero Banner'),
        ],
        default='CAROUSEL'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['display_order', 'created_at']
    
    def __str__(self):
        return f"{self.display_title}"