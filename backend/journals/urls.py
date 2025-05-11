# backend/journals/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers
from .views import JournalViewSet, JournalEntryViewSet

router = DefaultRouter()
router.register(r'journals', JournalViewSet, basename='journal')

# Create a nested router for journal entries
journal_router = routers.NestedSimpleRouter(router, r'journals', lookup='journal')
journal_router.register(r'entries', JournalEntryViewSet, basename='journal-entry')

urlpatterns = [
    path('', include(router.urls)),
    path('', include(journal_router.urls)),
]