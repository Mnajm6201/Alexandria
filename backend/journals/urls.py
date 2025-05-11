from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import JournalViewSet, JournalEntryViewSet

app_name = 'journals'

router = DefaultRouter()
router.register(r'journals', JournalViewSet, basename='journal')
router.register(r'entries', JournalEntryViewSet, basename='entry')

urlpatterns = [
    path('', include(router.urls)),
]