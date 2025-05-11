# backend/journals/urls.py

from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import JournalViewSet, JournalEntryViewSet

router = DefaultRouter()
router.register(r'journals', JournalViewSet, basename='journal')

urlpatterns = router.urls + [
    # Custom nested routes without using drf-nested-routers
    path('journals/<int:journal_pk>/entries/', 
         JournalEntryViewSet.as_view({'get': 'list', 'post': 'create'}), 
         name='journal-entry-list'),
    path('journals/<int:journal_pk>/entries/<int:pk>/', 
         JournalEntryViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), 
         name='journal-entry-detail'),
]