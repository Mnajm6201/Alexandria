from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q, Case, When, IntegerField
from library.models import Book, Author

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

        if not query:
            return Response({"books": [], "authors": []})

        # filters for BOOK searches
        book_filters = (
            Q(title__icontains=query) |
            Q(editions__isbn__icontains=query)
        )

        # filters for AUTHOR searches
        author_filters = (
            Q(name__icontains=query)
        )

        # RETURNS BOOKS MATCHING THE SPECIFIED QUERY WITH THE SPECIFIED FIELDS
        books = self.get_query_set(
            model=Book,
            field_name="title",
            filters=book_filters,
            query=query,
            limit=5,
            fields_list=["id", "title"]
        )

        # RETURNS AUTHORS MATCHING THE SPECIFIED QUERY WITH THE SPECIFIED FIELDS
        authors = self.get_query_set(
            model=Author,
            field_name="name",
            filters=author_filters,
            query=query,
            limit=5,
            fields_list=["id", "name"]
        )

        # add any search result other than the ones listed above here:

        return Response({"books": list(books), "authors": list(authors)})


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
            query_set = query_set.values(*fields_list)
        
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


SEARCH RESULTS PAGE

PRESSING ENTER RETURNS A LIST MATCHING THAT QUERY

CLICKING THE BOOK NAME OR AUTHOR NAME MAKES A GET REQUEST ON CLICK TO THE RESULTS PAGE OR AUTHOR PAGE

DO BOOK SEARCH RESULTS FIRST!!!
"""

