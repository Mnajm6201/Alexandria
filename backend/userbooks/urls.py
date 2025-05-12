from django.urls import path
from .views import UpdateUserBookProgressView, GetUserBookProgressView

urlpatterns = [
    path('update-progress/', UpdateUserBookProgressView.as_view(), name='update-book-progress'),
    path('<str:book_id>/progress/', GetUserBookProgressView.as_view(), name='get-book-progress'),
]