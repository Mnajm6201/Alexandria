from django.urls import path
from . import views

app_name = 'book'

urlpatterns = [
    path('<str:book_id>/', views.book_info, name='book_info'),
]