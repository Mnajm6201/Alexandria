from django.contrib import admin
from library.models import Journal, JournalEntry

@admin.register(Journal)
class JournalAdmin(admin.ModelAdmin):
    list_display = ('id', 'get_user', 'get_book', 'is_private', 'created_on', 'updated_on')
    list_filter = ('is_private', 'created_on')
    search_fields = ('user_book__user__username', 'user_book__book__title')
    date_hierarchy = 'created_on'
    
    def get_user(self, obj):
        return obj.user_book.user.username
    get_user.short_description = 'User'
    
    def get_book(self, obj):
        return obj.user_book.book.title
    get_book.short_description = 'Book'
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('user_book__user', 'user_book__book')

@admin.register(JournalEntry)
class JournalEntryAdmin(admin.ModelAdmin):
    list_display = ('id', 'journal', 'title', 'is_private', 'page_num', 'created_on')
    list_filter = ('is_private', 'created_on')
    search_fields = ('title', 'content', 'journal__user_book__book__title')
    date_hierarchy = 'created_on'
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('journal', 'journal__user_book__user', 'journal__user_book__book')