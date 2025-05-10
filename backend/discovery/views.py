from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import FeaturedShelf
from .serializers import FeaturedShelfSerializer

class FeaturedShelfViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = FeaturedShelf.objects.filter(is_active=True)
    serializer_class = FeaturedShelfSerializer
    permission_classes = [IsAuthenticated]