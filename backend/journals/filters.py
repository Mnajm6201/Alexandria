import django_filters
from library.models import Journal, JournalEntry
from django.db.models import Count, Q

class JournalFilter(django_filters.FilterSet):
    """
    Filter for journals with advanced filtering options.
    """
    has_entries = django_filters.BooleanFilter(method='filter_has_entries')
    book_title = django_filters.CharFilter(field_name='book__title', lookup_expr='icontains')
    
    class Meta:
        model = Journal
        fields = ['user', 'book', 'is_private', 'has_entries', 'book_title']
    
    def filter_has_entries(self, queryset, name, value):
        """Filter journals that have or don't have entries"""
        if value:
            return queryset.annotate(entry_count=Count('entries')).filter(entry_count__gt=0)
        return queryset.annotate(entry_count=Count('entries')).filter(entry_count=0)


class JournalEntryFilter(django_filters.FilterSet):
    """
    Filter for journal entries with advanced filtering options.
    """
    min_word_count = django_filters.NumberFilter(method='filter_min_word_count')
    max_word_count = django_filters.NumberFilter(method='filter_max_word_count')
    content_contains = django_filters.CharFilter(field_name='content', lookup_expr='icontains')
    min_page = django_filters.NumberFilter(field_name='page_num', lookup_expr='gte')
    max_page = django_filters.NumberFilter(field_name='page_num', lookup_expr='lte')
    
    class Meta:
        model = JournalEntry
        fields = [
            'journal', 'is_private', 'min_word_count', 'max_word_count', 
            'content_contains', 'min_page', 'max_page'
        ]
    
    def filter_min_word_count(self, queryset, name, value):
        """Filter entries with at least the specified word count"""
        return queryset.annotate(
            word_count=Count('content', filter=Q(content__contains=' ')) + 1
        ).filter(word_count__gte=value)
    
    def filter_max_word_count(self, queryset, name, value):
        """Filter entries with at most the specified word count"""
        return queryset.annotate(
            word_count=Count('content', filter=Q(content__contains=' ')) + 1
        ).filter(word_count__lte=value)