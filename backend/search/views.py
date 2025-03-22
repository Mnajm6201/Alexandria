from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q
from library.models import Book, Author

"""
SEARCH BAR FUNCTION

@params: Takes in a query request to be processed
@returns: In JSON format a list of books that satisfied the query

This function processes the query using filters to search through the database. If the query returns no results, it will return
an *EMPTY* array or arrays. 

If you need to modify the search query filters by removing or adding new fields to search for, you can import the necessary models
and add it to the *filters* tuple using Django's Q class. You can then pass in filters as a parameter in .filter() on any model
object you desire. This will return the top 5 results of each query.
"""
class SearchBarView(APIView):
    def get(self, request):
        query = request.GET.get("q", "")

        if not query:
            return Response({"books": [], "authors": []})

        # can be edited and passed into any .filter() function on any table object
        filters = (
            Q(title__icontains=query) |
            Q(authors__name__icontains=query) |
            Q(genres__name__icontains=query) |
            Q(editions__isbn__icontains=query)
        )

        # returns books that match the *filters* tuple
        books = (
            Book.objects.filter(filters).distinct().values("id", "title")[:5]
        )

        # returns authors that match the name from the Author's table
        authors = (
            Author.objects.filter(name__icontains=query).values("id", "name")[:5]
        )

        return Response({"books": list(books), "authors": list(authors)})
