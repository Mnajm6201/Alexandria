from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FeaturedShelfViewSet

router = DefaultRouter()
router.register('featured-shelves', FeaturedShelfViewSet)

urlpatterns = [
    path('', include(router.urls)),
]