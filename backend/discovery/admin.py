from django.contrib import admin
from .models import FeaturedShelf

@admin.register(FeaturedShelf)
class FeaturedShelfAdmin(admin.ModelAdmin):
    list_display = ('display_title', 'shelf', 'display_order', 'is_active')
    list_filter = ('is_active', 'display_type')
    search_fields = ('display_title', 'description', 'shelf__name')
    list_editable = ('display_order', 'is_active')