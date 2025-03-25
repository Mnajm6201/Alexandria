from django.urls import path
from .views import SearchBarView

urlpatterns = [
    path("search-bar/", SearchBarView.as_view(), name="search_bar"),
]
