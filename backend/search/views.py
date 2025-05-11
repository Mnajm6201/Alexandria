from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q, Case, When, IntegerField
from library.models import Book, Author
from .serializers.book_search_serializer import BookSearchSerializer
from .serializers.author_search_serializer import AuthorSearchSerializer

"""
SEARCH BAR FUNCTION

@params: Takes in a query request to be processed
@returns: In JSON format a list of books that satisfied the query

This function processes the query using filters to search through the database. If the query returns no results, it will return
an *EMPTY* array or arrays. 

If you need to modify the search query filters by removing or adding new fields to search for, you can import the necessary models
and add it to the respective <model>_filters tuple using Django's Q class. You can then pass in that filter as a parameter in the
get_query_set helper function (defined below). 

You can edit which model to use, what fields to search on, what fields to return, and the maximum number of results in the
returned tuples. 
"""
class SearchBarView(APIView):
    def get(self, request):
        query = request.GET.get("q", "").strip()

        try:
            limit = int(request.GET.get("limit", 5))
        except ValueError:
            limit = 5  # default fallback

        if not query:
            return Response({"books": [], "authors": []})

        # BOOKS (gets the full object and skip fields_list so we use BookSearchSerializer to retrieve Book's attributes)
        book_filters = Q(title__icontains=query) | Q(editions__isbn__icontains=query)

        books_queryset = self.get_query_set(
            model=Book,
            field_name="title",
            filters=book_filters,
            query=query,
            limit=limit,
            fields_list=None
        )

        serialized_books = BookSearchSerializer(books_queryset, many=True).data
        books = [{"type": "book", **book} for book in serialized_books]

        # AUTHORS (this does not retrieve the full object, just the fields_list for name and author_id)
        author_filters = Q(name__icontains=query)

        authors_queryset = self.get_query_set(
            model=Author,
            field_name="name",
            filters=author_filters,
            query=query,
            limit=limit,
            fields_list=None
        )

        serialized_authors = AuthorSearchSerializer(authors_queryset, many=True).data
        authors = [{"type": "author", **author} for author in serialized_authors]

        return Response({"books": books, "authors": authors})


    """
    HELPER FUNCTION:

    Returns a query set prioritized by close matches. Titles/names that start with the query string are given highest priority
    Smaller numbers indicate higher priority, larger numbers indicate lower priority, do NOT forget a default value

    @PARAMS:
        model: The table/model class from models.py
        field_name: The field to be searched on (e.g. "title", "name") for priority searching (__istartswith)
        filters: Filters to apply to the search query
        query: The search string
        limit: Maximum number of results to return
        fields_list: List of fields to return to search results (default: empty)
    """
    def get_query_set(self, model, field_name, filters, query, limit, fields_list=None):
        query_set = (
            model.objects.filter(filters)
            .distinct()
            .annotate(
                priority=Case(
                    When(**{f"{field_name}__istartswith": query}, then=0),
                    default=1,
                    output_field=IntegerField()
                )
            )
            .order_by("priority", field_name)
        )

        if fields_list:
            return query_set.values(*fields_list)[:limit]  # old behavior for authors

        return query_set[:limit] 


"""
MODULARIZE CODE:
Have search results be the class that handles the searching
search bar calls the search results with size 5
search page calls the search results with size 20

# Search Results (API.. , num):
# [:num]
# SearchBar --> searchResults(5)
# SearchPage --> searchresults[20]

searchBarView already returns a filtered list of books and authors. if we want the search results to do the same we honestly can
if we want the search results page to contain authors too. for now it will books

we need to modularize the searchBarView to work with search results and the search bar, since search results will use the same
searching property. search bar will return the closest matches of either books or authors. search bar will return the top 5
but search results will return a lot more but we will find a healthy cap to not render so many books (might be fast tho with
indexed searches)

we can have the SearchBarView actually include books or authors in the final returned list (next to each result have a grayed
out word indicating if this result is a book or author *but how we do determine the difference?*), then use those results for
the search bar or search results and from there we can specify how many to return. this will keep it modular so when we edit the
View it take effect in all search areas (if we wanted to add genre searching for example, changing the view to do so will take 
effect everywhere)


INDEXED SEARCHES ARE NOT FAST WITH icontains:

look into this:
Enable trigram search with GIN indexes


SEARCH RESULTS PAGE

PRESSING ENTER RETURNS A LIST MATCHING THAT QUERY

CLICKING THE BOOK NAME OR AUTHOR NAME MAKES A GET REQUEST ON CLICK TO THE RESULTS PAGE OR AUTHOR PAGE

DO BOOK SEARCH RESULTS FIRST!!!
"""

