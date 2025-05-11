# backend/journals/admin.py

from django.contrib import admin
from library.models import Journal, JournalEntry

@admin.register(Journal)
class JournalAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'book', 'is_private', 'created_on', 'updated_on')
    list_filter = ('is_private', 'created_on')
    search_fields = ('user__username', 'book__title')
    date_hierarchy = 'created_on'

@admin.register(JournalEntry)
class JournalEntryAdmin(admin.ModelAdmin):
    list_display = ('id', 'journal', 'title', 'is_private', 'page_num', 'created_on')
    list_filter = ('is_private', 'created_on')
    search_fields = ('title', 'content', 'journal__book__title')
    date_hierarchy = 'created_on'
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('journal', 'journal__user', 'journal__book')