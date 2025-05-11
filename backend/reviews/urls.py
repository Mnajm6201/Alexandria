from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ReviewViewSet

router = DefaultRouter()
router.register(r'', ReviewViewSet, basename='review')

app_name = 'reviews'

urlpatterns = [
    path('', include(router.urls)),
]