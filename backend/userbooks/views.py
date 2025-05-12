from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from library.models import UserBook
from .serializers import UserBookProgressSerializer

class UpdateUserBookProgressView(APIView):
    """
    API view for updating a user's reading progress (page_num) for a book.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = UserBookProgressSerializer(
            data=request.data,
            context={'user': request.user}
        )
        
        if serializer.is_valid():
            book_id = serializer.validated_data['book_id']
            page_num = serializer.validated_data['page_num']
            
            try:
                # Get the UserBook record and update page_num
                user_book = UserBook.objects.get(
                    user=request.user, 
                    book__book_id=book_id
                )
                user_book.page_num = page_num
                user_book.save()
                
                return Response({
                    "success": True,
                    "book_id": book_id,
                    "page_num": page_num,
                    "total_pages": getattr(user_book.book.editions.first(), 'page_count', None)
                })
                
            except Exception as e:
                return Response(
                    {"error": f"Failed to update reading progress: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class GetUserBookProgressView(APIView):
    """
    API view for retrieving a user's reading progress for a book.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, book_id):
        try:
            # Try to get the UserBook record
            user_book = UserBook.objects.get(
                user=request.user,
                book__book_id=book_id
            )
            
            # Get total pages from the first edition (if available)
            primary_edition = user_book.book.editions.filter(is_primary=True).first()
            if not primary_edition:
                primary_edition = user_book.book.editions.first()
                
            total_pages = getattr(primary_edition, 'page_count', None)
            
            return Response({
                "book_id": book_id,
                "page_num": user_book.page_num,
                "read_status": user_book.read_status,
                "total_pages": total_pages,
                "progress_percentage": (user_book.page_num / total_pages * 100) if total_pages else 0
            })
            
        except UserBook.DoesNotExist:
            return Response(
                {"error": "You are not tracking this book"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to get reading progress: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )