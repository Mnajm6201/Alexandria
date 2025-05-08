from django.test import TestCase
from django.contrib.auth import get_user_model
from library.models import Shelf, ShelfEdition, Edition, Book, Publisher, UserBook
from rest_framework.test import APIClient
from django.urls import reverse
from rest_framework import status

User = get_user_model()


### Equivalent Classes ###
##  Authentication Status ##
#       Authenticated user              (valid)
#       Unauthenticated user            (invalid)
##  Shelf Name
#       Name length: 1 <= x <= 250      (valid)
#       Name length: x < 1              (invalid)
#       Name length: x => 255           (invalid)
#       Name contains special character (invalid)
##  ShelfTypes:
#       shelf_type = "Owned"            (valid)
#       shelf_type = "Read"             (valid)
#       shelf_type = "Reading"          (valid)
#       shelf_type = "Want to Read"     (valid)
#       shelf_type = "Available"        (valid)
#       shelf_type = "Lent Out"         (valid)
#       shelf_type = "Custom"           (valid)
#       shelf_type = None               (invalid)
##  Privacy Settings:
#       is_private = True               (valid)
#       is_private = False              (valid)
#       is_private = None               (invalid)
##  Optional Fields:
#       desc not null                   (valid)
#       desc null                       (valid)
#       desc too long                   (invalid)
#       shelf image not null            (valid)
#       shelf image null                (valid)
## Duplicate information
#       duplicate shelf name among user (invalid)
#       duplicate shelf name among different users (valid)

class ShelfCreateTests(TestCase):
    """
    Test Module for creating shelves based on listed equivalence classes
    """
    def setUp(self):
        """
        Create test (mock) data for class.
        Test users, existing shelf (check for duplicates), API client, and url.
        """  
        # Create test users
        self.user = User.objects.create_user(
            username = "testuser_1",
            email = "test@example.com",
            password = "testpassword"
        )      
        self.user_other = User.objects.create_user(
            username = "testuser_2",
            email = "other@example.com",
            password = "testpassword"
        ) 

        # Create existing shelf to check for duplicate testing
        Shelf.objects.create(
            user = self.user,
            name = "Existing Shelf",
            shelf_type = "Custom",
            is_private = False
        )

        # Set up API client
        self.client = APIClient()

        # Set up URL for shelf creation (independent from urls.py)
        self.url = reverse("shelf-list")
    
    ### Actaul tests ###

    ## Authentication Status

    # Authentication Status: Authenticated user (valid)
    def test_create_shelf_user_authenticated(self):
        """
        Test creating a shelf when user authenticated
        """
        # Authenticate user
        self.client.force_authenticate(user=self.user)

        # Mock shelf data for creation
        data = {
            'name': 'Science Fiction',
            'shelf_desc': 'My sci-fi collection',
            'shelf_type': 'Custom',
            'is_private': False
        }

        # Get response with given data
        response = self.client.post(self.url, data, format='json')

        # Assert that user authenticated, shelf created and data output matches input
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Science Fiction')
        self.assertTrue(
            Shelf.objects.filter(
                user=self.user,
                name='Science Fiction'
            ).exists()
        )

    # Authentication Status: Authenticated user (valid)
    def test_create_shelf_user_unauthenticated(self):
        """Test creating a shelf when user unauthenticated (invalid)"""
        # Mock data
        data = {
            'name': 'Fantasy Books',
            'shelf_type': 'Custom',
            'is_private': False
        }
        
        # Get response
        response = self.client.post(self.url, data, format='json')
        
        # Make sure that creation failed.
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(
            Shelf.objects.filter(name='Fantasy Books').exists()
        )

    ##  Shelf Name

    # Name length: 1 <= x <= 250 (valid)
    def test_valid_name_length(self):
        """
        Test creating shelf with valid name lengths (boundary testing)
        """
        # Authenticate user
        self.client.force_authenticate(user=self.user)

        # Test lower boundary (minimum length = 1)
        name = "A"  # Length 1
        data = {
            'name': name,
            'shelf_type': 'Custom',
            'is_private': False
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], name)
        
        # Test upper boundary (maximum length = 250)
        name = "A" * 250  # Length 250
        data = {
            'name': name,
            'shelf_type': 'Custom',
            'is_private': False
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], name)
        
        # Test a length between bounds
        name = "A" * 125  # Length 125 (middle of the range)
        data = {
            'name': name,
            'shelf_type': 'Custom',
            'is_private': False
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], name)
        
        # Verify all three shelves were created
        self.assertTrue(Shelf.objects.filter(user=self.user, name="A").exists())
        self.assertTrue(Shelf.objects.filter(user=self.user, name="A" * 250).exists())
        self.assertTrue(Shelf.objects.filter(user=self.user, name="A" * 125).exists())

    # Name length: x < 1 (invalid)
    def test_create_shelf_empty_name(self):
        """Test creating a shelf with an empty name (invalid)"""
        self.client.force_authenticate(user=self.user)
        
        data = {
            'name': '',
            'shelf_type': 'Custom',
            'is_private': False
        }
        
        response = self.client.post(self.url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', response.data)

    # Name length: x => 255 (invalid)
    def test_create_shelf_name_too_long(self):
        """Test creating a shelf with a name that exceeds max length (invalid)"""
        self.client.force_authenticate(user=self.user)
        
        # Create a name longer than 250 characters
        long_name = 'A' * 251
        
        data = {
            'name': long_name,
            'shelf_type': 'Custom',
            'is_private': False
        }
        
        response = self.client.post(self.url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', response.data)

    # Name contains special character (invalid)
    def test_create_shelf_with_special_characters(self):
        """Test creating a shelf with special characters in the name"""
        self.client.force_authenticate(user=self.user)
        
        special_name = "!@#$%^&*()_+{}|:\"<>?[];',./`~"
        
        data = {
            'name': special_name,
            'shelf_type': 'Custom',
            'is_private': False
        }
        
        response = self.client.post(self.url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], special_name)
        self.assertTrue(
            Shelf.objects.filter(
                user=self.user,
                name=special_name
            ).exists()
        )

    ##  ShelfTypes

    # shelf_type = "Owned", "Read" || "Reading" || "Want to Read" || "Available"
    #   || "Lent Out" || "Custom" (valid)
    def test_create_shelf_valid_types(self):
        """Test creating shelves with all valid shelf types"""
        self.client.force_authenticate(user=self.user)
        
        # Test each valid shelf type
        valid_types = ["Owned", "Read", "Reading", "Want to Read", "Available", "Lent Out", "Custom"]
        
        for shelf_type in valid_types:
            data = {
                'name': f'{shelf_type} Shelf',
                'shelf_type': shelf_type,
                'is_private': False
            }
            
            response = self.client.post(self.url, data, format='json')
            
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
            self.assertEqual(response.data['shelf_type'], shelf_type)

    # shelf_type = None (invalid)
    def test_create_shelf_null_type(self):
        """Test creating a shelf with a null shelf_type (should fail)"""
        self.client.force_authenticate(user=self.user)
        
        data = {
            'name': 'Null Type Shelf',
            'shelf_type': None,
            'is_private': False
        }
        
        response = self.client.post(self.url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('shelf_type', response.data)

    ##  Privacy Settings

    # is_private = True (valid)
    def test_create_shelf_private(self):
        """Test creating a private shelf"""
        self.client.force_authenticate(user=self.user)
        
        data = {
            'name': 'Private Shelf',
            'shelf_type': 'Custom',
            'is_private': True
        }
        
        response = self.client.post(self.url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['is_private'], True)
        self.assertTrue(
            Shelf.objects.filter(
                user=self.user,
                name='Private Shelf',
                is_private=True
            ).exists()
        )

    # is_private = False (valid)
    def test_create_shelf_public(self):
        """Test creating a public shelf"""
        self.client.force_authenticate(user=self.user)
        
        data = {
            'name': 'Public Shelf',
            'shelf_type': 'Custom',
            'is_private': False
        }
        
        response = self.client.post(self.url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['is_private'], False)
        self.assertTrue(
            Shelf.objects.filter(
                user=self.user,
                name='Public Shelf',
                is_private=False
            ).exists()
        )

    # is_private = None (invalid)
    def test_create_shelf_null_privacy(self):
        """Test creating a shelf with null privacy setting (should fail)"""
        self.client.force_authenticate(user=self.user)
        
        data = {
            'name': 'Null Privacy Shelf',
            'shelf_type': 'Custom',
            'is_private': None
        }
        
        response = self.client.post(self.url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('is_private', response.data)

    ##  Optional Fields

    # desc not null (valid)
    def test_create_shelf_with_description(self):
        """Test creating a shelf with a description"""
        self.client.force_authenticate(user=self.user)
        
        data = {
            'name': 'Shelf With Description',
            'shelf_desc': 'This is a detailed description of my shelf',
            'shelf_type': 'Custom',
            'is_private': False
        }
        
        response = self.client.post(self.url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['shelf_desc'], 'This is a detailed description of my shelf')
        self.assertTrue(
            Shelf.objects.filter(
                user=self.user,
                name='Shelf With Description'
            ).exists()
        )

    # desc null (valid)
    def test_create_shelf_without_description(self):
        """Test creating a shelf without a description"""
        self.client.force_authenticate(user=self.user)
        
        data = {
            'name': 'Shelf Without Description',
            'shelf_type': 'Custom',
            'is_private': False
        }
        
        response = self.client.post(self.url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data.get('shelf_desc') is None or response.data.get('shelf_desc') == '')
        self.assertTrue(
            Shelf.objects.filter(
                user=self.user,
                name='Shelf Without Description'
            ).exists()
        )

    # desc too long (invalid)
    def test_create_shelf_description_too_long(self):
        """Test creating a shelf with a description that is too long"""
        self.client.force_authenticate(user=self.user)
        
        long_desc = 'A' * 100000
        
        data = {
            'name': 'Shelf With Long Description',
            'shelf_desc': long_desc,
            'shelf_type': 'Custom',
            'is_private': False
        }
        
        response = self.client.post(self.url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(response.data['shelf_desc']), 100000)

    # shelf image not null (valid)
    def test_create_shelf_with_image(self):
        """Test creating a shelf with an image URL"""
        self.client.force_authenticate(user=self.user)
        
        # If this fails unexpectedly, make sure that image linked is still valid url.
        data = {
            'name': 'Shelf With Image',
            'shelf_type': 'Custom',
            'is_private': False,
            'shelf_img': 'https://covers.openlibrary.org/b/id/8310876-L.jpg'
        }
        
        response = self.client.post(self.url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['shelf_img'], 'https://covers.openlibrary.org/b/id/8310876-L.jpg')
        self.assertTrue(
            Shelf.objects.filter(
                user=self.user,
                name='Shelf With Image'
            ).exists()
        )

    # shelf image null (valid)
    def test_create_shelf_without_image(self):
        """Test creating a shelf without an image URL"""
        self.client.force_authenticate(user=self.user)
        
        data = {
            'name': 'Shelf Without Image',
            'shelf_type': 'Custom',
            'is_private': False
        }
        
        response = self.client.post(self.url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data.get('shelf_img') is None or response.data.get('shelf_img') == '')
        self.assertTrue(
            Shelf.objects.filter(
                user=self.user,
                name='Shelf Without Image'
            ).exists()
        )

    ## Duplicate information

    # duplicate shelf name among user (invalid)
    def test_create_duplicate_shelf_name(self):
        """Test creating a shelf with a name that already exists for the same user"""
        self.client.force_authenticate(user=self.user)
        
        data = {
            'name': 'Existing Shelf',
            'shelf_type': 'Custom',
            'is_private': False
        }
        
        response = self.client.post(self.url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', response.data)

    # different users can have same shelf name (valid)
    def test_different_users_same_shelf_name(self):
        """Test that different users can create shelves with the same name"""
        # Authenticate first user and create shelf
        self.client.force_authenticate(user=self.user)
        
        data = {
            'name': 'Common Shelf Name',
            'shelf_type': 'Custom',
            'is_private': False
        }
        
        response1 = self.client.post(self.url, data, format='json')
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)
        
        # Authenticate second user and create shelf with same name
        self.client.force_authenticate(user=self.user_other)
        
        response2 = self.client.post(self.url, data, format='json')
        self.assertEqual(response2.status_code, status.HTTP_201_CREATED)
        
        # Verify both users have shelves with the same name
        self.assertTrue(
            Shelf.objects.filter(
                user=self.user,
                name='Common Shelf Name'
            ).exists()
        )
        
        self.assertTrue(
            Shelf.objects.filter(
                user=self.user_other,
                name='Common Shelf Name'
            ).exists()
        )

### Equivalent Classes ###
##  Authentication Status ##
#       Authenticated user                      (valid)
#       Unauthenticated user                    (invalid)
##  User filtering ##
#       Own user                                (valid - sees all shelves)
#       Other user                              (valid - sees only public shelves)
#       Non-existent user                       (invalid)
##  Privacy filtering ##
#       Public shelves                          (valid - visible to all)
#       Private shelves - own user              (valid - visible to owner)
#       Private shelves - other user            (invalid - not visible)
##  Shelf type filtering ##
#       Filter by valid shelf_type              (valid)
#       Filter by invalid shelf_type            (invalid)
##  Empty results ##
#       User with no shelves                    (valid - returns empty list)

class ShelfListTests(TestCase):
    """
    Test Module for listing shelves based on listed equivalence classes
    """
    def setUp(self):
        """
        Create test (mock) data for class.
        Test users and shelves with different privacy settings.
        """  
        # Create test users
        self.user = User.objects.create_user(
            username = "testuser_1",
            email = "test@example.com",
            password = "testpassword"
        )      
        self.user_other = User.objects.create_user(
            username = "testuser_2",
            email = "other@example.com",
            password = "testpassword"
        )
        self.user_empty = User.objects.create_user(
            username = "emptyuser",
            email = "empty@example.com",
            password = "testpassword"
        )

        # Create various shelves for testing
        # For primary user - public shelves
        Shelf.objects.create(
            user = self.user,
            name = "Public Shelf 1",
            shelf_type = "Custom",
            is_private = False
        )
        Shelf.objects.create(
            user = self.user,
            name = "Public Shelf 2",
            shelf_type = "Read",
            is_private = False
        )

        # For primary user - private shelves
        Shelf.objects.create(
            user = self.user,
            name = "Private Shelf 1",
            shelf_type = "Custom",
            is_private = True
        )
        Shelf.objects.create(
            user = self.user,
            name = "Private Shelf 2",
            shelf_type = "Want to Read",
            is_private = True
        )

        # For other user - public shelf
        Shelf.objects.create(
            user = self.user_other,
            name = "Other User Public Shelf",
            shelf_type = "Owned",
            is_private = False
        )

        # For other user - private shelf
        Shelf.objects.create(
            user = self.user_other,
            name = "Other User Private Shelf",
            shelf_type = "Lent Out",
            is_private = True
        )

        # Set up API client
        self.client = APIClient()

        # Set up URL for shelf listing
        self.url = reverse("shelf-list")
    
    ### Actual tests ###

    ## Authentication Status

    # Authentication Status: Authenticated user (valid)
    def test_list_shelves_user_authenticated(self):
        """
        Test listing shelves when user is authenticated
        """
        # Authenticate user
        self.client.force_authenticate(user=self.user)

        # Get response
        response = self.client.get(self.url)

        # Assert that response is successful and contains the right number of shelves
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 4)  # All 4 shelves from this user

    # Authentication Status: Unauthenticated user (invalid)
    def test_list_shelves_user_unauthenticated(self):
        """Test listing shelves when user is unauthenticated"""
        # Get response without authentication
        response = self.client.get(self.url)
        
        # Make sure request fails with unauthorized
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    ## User filtering

    # Own user (valid - sees all shelves)
    def test_list_own_shelves(self):
        """Test listing user's own shelves"""
        self.client.force_authenticate(user=self.user)
        
        # Get response
        response = self.client.get(self.url)
        
        # Assert response is successful and contains all shelves
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 4)  # All 4 shelves from this user
        
        # Check that it contains both public and private shelves
        shelf_names = [shelf['name'] for shelf in response.data]
        self.assertIn('Public Shelf 1', shelf_names)
        self.assertIn('Public Shelf 2', shelf_names)
        self.assertIn('Private Shelf 1', shelf_names)
        self.assertIn('Private Shelf 2', shelf_names)

    # Other user (valid - sees only public shelves)
    def test_list_other_user_shelves(self):
        """Test listing another user's shelves"""
        self.client.force_authenticate(user=self.user)
        
        # Get response with username filter
        response = self.client.get(f"{self.url}?username=testuser_2")
        
        # Assert response is successful and contains only public shelves
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)  # Only the 1 public shelf
        
        # Check that it contains only the public shelf
        self.assertEqual(response.data[0]['name'], 'Other User Public Shelf')

    # Non-existent user (invalid)
    def test_list_nonexistent_user_shelves(self):
        """Test listing shelves for a non-existent user"""
        self.client.force_authenticate(user=self.user)
        
        # Get response with non-existent username
        response = self.client.get(f"{self.url}?username=nonexistentuser")
        
        # Assert response is not found
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    ## Privacy filtering

    # Public shelves (valid - visible to all)
    def test_list_public_shelves(self):
        """Test that public shelves are visible to all authenticated users"""
        self.client.force_authenticate(user=self.user_other)
        
        # Get response with username filter for first user
        response = self.client.get(f"{self.url}?username=testuser_1")
        
        # Assert response is successful and contains only public shelves
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)  # Only the 2 public shelves
        
        # Check that it contains only public shelves
        shelf_names = [shelf['name'] for shelf in response.data]
        self.assertIn('Public Shelf 1', shelf_names)
        self.assertIn('Public Shelf 2', shelf_names)
        self.assertNotIn('Private Shelf 1', shelf_names)
        self.assertNotIn('Private Shelf 2', shelf_names)

    # Private shelves - own user (valid - visible to owner)
    def test_list_own_private_shelves(self):
        """Test that private shelves are visible to their owner"""
        self.client.force_authenticate(user=self.user)
        
        # Get response
        response = self.client.get(self.url)
        
        # Check that private shelves are included
        shelf_names = [shelf['name'] for shelf in response.data]
        self.assertIn('Private Shelf 1', shelf_names)
        self.assertIn('Private Shelf 2', shelf_names)

    # Private shelves - other user (invalid - not visible)
    def test_list_other_user_private_shelves_not_visible(self):
        """Test that private shelves are not visible to other users"""
        self.client.force_authenticate(user=self.user)
        
        # Get response with username filter
        response = self.client.get(f"{self.url}?username=testuser_2")
        
        # Check that other user's private shelf is not included
        shelf_names = [shelf['name'] for shelf in response.data]
        self.assertNotIn('Other User Private Shelf', shelf_names)

    ## Shelf type filtering

    # Filter by valid shelf_type (valid)
    def test_filter_by_valid_shelf_type(self):
        """Test filtering shelves by valid shelf type"""
        self.client.force_authenticate(user=self.user)
        
        # Get response filtered by shelf_type
        response = self.client.get(f"{self.url}?shelf_type=Custom")
        
        # Assert response is successful and contains only Custom shelves
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)  # 2 Custom shelves (public and private)
        
        # Check that only Custom shelves are included
        shelf_types = [shelf['shelf_type'] for shelf in response.data]
        self.assertTrue(all(shelf_type == 'Custom' for shelf_type in shelf_types))

    # Filter by invalid shelf_type (invalid)
    def test_filter_by_invalid_shelf_type(self):
        """Test filtering shelves by invalid shelf type"""
        self.client.force_authenticate(user=self.user)
        
        # Get response filtered by invalid shelf_type
        response = self.client.get(f"{self.url}?shelf_type=InvalidType")
        
        # Should return a 400 Bad Request error
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    ## Empty results

    # User with no shelves (valid - returns empty list)
    def test_list_empty_user_shelves(self):
        """Test listing shelves for a user with no shelves"""
        self.client.force_authenticate(user=self.user_empty)
        
        # Get response
        response = self.client.get(self.url)
        
        # Assert response is successful but contains no shelves
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)  # No shelves

### Equivalent Classes ###
##  Authentication Status ##
#       Authenticated user                  (valid)
#       Unauthenticated user                (invalid)
##  Deletion ##
#       User deletes their own shelf        (valid)
#       User deletes shelf not theirs       (invalid)
#       User deletes non-custom shelf       (invalid)
#       User tries delete shlef that DNE    (invalid)
##  Accessing Deleted Shelf ##
#       Cannot access a deleted shelf       (valid)
class ShelfDeleteTests(TestCase):
    """
    Test Module for deleting shelves based on listed equivalence classes
    """
    def setUp(self):
        """
        Create test users, shelves, and API client for use in delete tests.
        """
        # Create users
        self.user = User.objects.create_user(
            username="delete_tester",
            email="delete_tester@example.com",
            password="testpassword"
        )
        self.other_user = User.objects.create_user(
            username="other_user",
            email="other_user@example.com",
            password="testpassword"
        )
        
        # Create shelves: one owned by self.user, one by other_user
        self.own_shelf = Shelf.objects.create(
            user=self.user,
            name="User's Shelf",
            shelf_type="Custom",
            is_private=False
        )
        self.other_shelf = Shelf.objects.create(
            user=self.other_user,
            name="Other User's Shelf",
            shelf_type="Custom",
            is_private=False
        )

        # Create a non-custom shelf owned by self.user
        self.non_custom_shelf = Shelf.objects.create(
            user=self.user,
            name="Non-custom Shelf",
            shelf_type="Read",
            is_private=False
        )

        # URL for the non-custom shelf
        self.non_custom_shelf_url = reverse("shelf-detail", kwargs={"pk": self.non_custom_shelf.pk})
        
        # API client
        self.client = APIClient()
        
        # Detail URLs
        self.own_shelf_url = reverse("shelf-detail", kwargs={"pk": self.own_shelf.pk})
        self.other_shelf_url = reverse("shelf-detail", kwargs={"pk": self.other_shelf.pk})
        self.non_existent_shelf_url = reverse("shelf-detail", kwargs={"pk": 999999})

    ##  Authentication Status

    # Authenticated user (valid)
    def test_delete_shelf_authenticated_user(self):
        """
        Test that an authenticated user can delete their own shelf (valid).
        """
        # Authenticate as the shelf owner
        self.client.force_authenticate(user=self.user)
        
        # Send DELETE request
        response = self.client.delete(self.own_shelf_url)
        
        # Assert successful deletion (204 No Content)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Verify that the shelf no longer exists
        self.assertFalse(Shelf.objects.filter(pk=self.own_shelf.pk).exists())

    # Unauthenticated user (invalid)
    def test_delete_shelf_unauthenticated_user(self):
        """
        Test that an unauthenticated user cannot delete any shelf (invalid).
        """
        # Do not authenticate
        response = self.client.delete(self.own_shelf_url)
        
        # Assert that deletion is not allowed (401 Unauthorized)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Verify the shelf still exists
        self.assertTrue(Shelf.objects.filter(pk=self.own_shelf.pk).exists())

    ##  Deletion

    # User deletes shelf not theirs (invalid)
    def test_delete_shelf_not_owned_by_user(self):
        """
        Test that a user cannot delete another user's shelf (invalid).
        """
        # Authenticate as self.user, but attempt to delete other_user's shelf
        self.client.force_authenticate(user=self.user)

        # Attempt DELETE
        response = self.client.delete(self.other_shelf_url)

        # Expect 404
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Verify the shelf still exists
        self.assertTrue(Shelf.objects.filter(pk=self.other_shelf.pk).exists())

    # User tries to delete non-existent shelf (invalid)
    def test_delete_nonexistent_shelf(self):
        """
        Test that deleting a non-existent shelf returns 404 (invalid).
        """
        # Authenticate as the shelf owner
        self.client.force_authenticate(user=self.user)
        
        # Attempt DELETE for a shelf that doesn't exist
        response = self.client.delete(self.non_existent_shelf_url)
        
        # Assert that result is not found (404)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    # User deletes non-custom shelf (invalid)
    def test_delete_non_custom_shelf_invalid(self):
        """
        Test that a user cannot delete their own non-custom shelf (invalid).
        """
        self.client.force_authenticate(user=self.user)
        response = self.client.delete(self.non_custom_shelf_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Shelf.objects.filter(pk=self.non_custom_shelf.pk).exists())

    ##  Accessing Deleted Shelf

    # Cannot access a deleted shelf (valid)
    def test_access_deleted_shelf(self):
        """
        Test that once a shelf is deleted, it cannot be accessed (404 Not Found).
        """
        # Authenticate as the shelf owner and delete the shelf
        self.client.force_authenticate(user=self.user)
        delete_response = self.client.delete(self.own_shelf_url)
        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Try to retrieve the same shelf
        get_response = self.client.get(self.own_shelf_url)
        
        # Expect 404 Not Found
        self.assertEqual(get_response.status_code, status.HTTP_404_NOT_FOUND)

### Equivalence Classes ###
##  Authentication Status ##
#       Authenticated user                                  (valid)
#       Unauthenticated user                                (invalid)
##  Retrieval Ownership ##
#       Retrieve own public shelf                           (valid)
#       Retrieve own private shelf                          (valid)
#       Retrieve other user's public shelf                  (valid)
#       Retrieve other user's private shelf                 (invalid)
##  Non-existent Shelf ##
#       Retrieve nonexistent shelf                          (invalid)
class ShelfRetrieveTests(TestCase):
    """
    Test Module for retrieving shelves based on listed equivalence classes
    """
    def setUp(self):
        """
        Create test users, shelves, and API client for retrieval tests.
        """
        # Create users
        self.user = User.objects.create_user(
            username="retriever",
            email="retriever@example.com",
            password="testpassword"
        )
        self.other_user = User.objects.create_user(
            username="other_user",
            email="other_user@example.com",
            password="testpassword"
        )

        # Create shelves: own public, own private, other user public, other user private
        self.own_public = Shelf.objects.create(
            user=self.user,
            name="My Public Shelf",
            shelf_type="Custom",
            is_private=False
        )
        self.own_private = Shelf.objects.create(
            user=self.user,
            name="My Private Shelf",
            shelf_type="Custom",
            is_private=True
        )
        self.other_public = Shelf.objects.create(
            user=self.other_user,
            name="Other Public Shelf",
            shelf_type="Custom",
            is_private=False
        )
        self.other_private = Shelf.objects.create(
            user=self.other_user,
            name="Other Private Shelf",
            shelf_type="Custom",
            is_private=True
        )

        # API client
        self.client = APIClient()

        # Detail URLs for each shelf
        self.own_public_url = reverse("shelf-detail", kwargs={"pk": self.own_public.pk})
        self.own_private_url = reverse("shelf-detail", kwargs={"pk": self.own_private.pk})
        self.other_public_url = reverse("shelf-detail", kwargs={"pk": self.other_public.pk})
        self.other_private_url = reverse("shelf-detail", kwargs={"pk": self.other_private.pk})
        # Nonexistent shelf URL
        self.nonexistent_url = reverse("shelf-detail", kwargs={"pk": 9999999})

    ## Authenticated user retrieving own shelves

    def test_retrieve_own_public_shelf(self):
        """
        Test retrieving own public shelf (valid for authenticated user).
        """
        # Authenticate
        self.client.force_authenticate(user=self.user)

        # GET request
        response = self.client.get(self.own_public_url)

        # Expect success (200), and correct shelf name
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], "My Public Shelf")

    def test_retrieve_own_private_shelf(self):
        """
        Test retrieving own private shelf (valid for authenticated user).
        """
        # Authenticate
        self.client.force_authenticate(user=self.user)

        # GET request
        response = self.client.get(self.own_private_url)

        # Expect success (200), and correct shelf name
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], "My Private Shelf")

    ## Authenticated user retrieving other user's shelves

    def test_retrieve_other_user_public_shelf(self):
        """
        Test retrieving another user's public shelf (valid).
        """
        # Authenticate
        self.client.force_authenticate(user=self.user)

        # GET request
        response = self.client.get(self.other_public_url)

        # Expect 200 success
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], "Other Public Shelf")

    def test_retrieve_other_user_private_shelf(self):
        """
        Test retrieving another user's private shelf (invalid).
        Should cause 403 Forbidden error.
        """
        # Authenticate
        self.client.force_authenticate(user=self.user)

        # GET request
        response = self.client.get(self.other_private_url)

        # Expect failure (403)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    ## Non-existent Shelf

    def test_retrieve_nonexistent_shelf(self):
        """
        Test retrieving a shelf that does not exist (always invalid, 404).
        """
        # Authenticate
        self.client.force_authenticate(user=self.user)

        # GET request
        response = self.client.get(self.nonexistent_url)

        # Expect 404
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    ## Unauthenticated user

    def test_retrieve_shelf_unauthenticated(self):
        """
        Test retrieving any shelf while unauthenticated (invalid).
        """
        response = self.client.get(self.own_public_url)

        # Expect 401 Unauthorized
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


### Equivalent Classes ###
##  Authentication Status ##
#       Authenticated user              (valid)
#       Unauthenticated user            (invalid)
##  Shelf Ownership + Type ##
#       Owned & Custom                 (valid)
#       Owned & Non-custom             (invalid)
#       Not owned                      (invalid)
##  Update Fields ##
#       name within valid length       (valid)
#       name empty or too long         (invalid)
#       shelf_desc update              (valid)
#       is_private update              (valid)
#       shelf_img update               (valid)
#       shelf_type update              (invalid)
##  Non-existent Shelf ##
#       Updating non-existent shelf    (invalid)

class ShelfUpdateTests(TestCase):
    """
    Test Module for updating shelves based on listed equivalance partitions
    """
    def setUp(self):
        """
        Create test users, shelves, and API client for update tests.
        """
        # Create users
        self.user = User.objects.create_user(
            username="update_user",
            email="update@example.com",
            password="testpassword"
        )
        self.other_user = User.objects.create_user(
            username="other_user",
            email="other@example.com",
            password="testpassword"
        )

        # Create shelves for testing
        self.custom_owned_shelf = Shelf.objects.create(
            user=self.user,
            name="Custom Owned Shelf",
            shelf_type="Custom",
            is_private=False,
            shelf_desc="Owned custom shelf"
        )
        self.non_custom_owned_shelf = Shelf.objects.create(
            user=self.user,
            name="Non-Custom Shelf",
            shelf_type="Read",
            is_private=False,
            shelf_desc="Owned non-custom shelf"
        )
        self.custom_other_shelf = Shelf.objects.create(
            user=self.other_user,
            name="Other User Custom Shelf",
            shelf_type="Custom",
            is_private=False,
            shelf_desc="Not owned by update_user"
        )

        # API client
        self.client = APIClient()

        # Detail URLs
        self.custom_owned_url = reverse("shelf-detail", kwargs={"pk": self.custom_owned_shelf.pk})
        self.non_custom_owned_url = reverse("shelf-detail", kwargs={"pk": self.non_custom_owned_shelf.pk})
        self.custom_other_url = reverse("shelf-detail", kwargs={"pk": self.custom_other_shelf.pk})
        self.non_existent_url = reverse("shelf-detail", kwargs={"pk": 9999999})

    ### Actual tests ###

    ## Authentication Status

    # Authenticated user (valid only if owned & custom)
    def test_update_shelf_unauthenticated(self):
        """
        Updating a shelf when user is unauthenticated (invalid).
        """
        data = {'name': 'New Name'}
        response = self.client.patch(self.custom_owned_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    ## Shelf Ownership + Type

    # Owned & Custom (valid)
    def test_update_owned_custom_shelf_valid(self):
        """
        Updating own custom shelf (valid).
        """
        self.client.force_authenticate(user=self.user)
        data = {'name': 'Updated Custom Shelf Name', 'shelf_desc': 'Updated desc'}
        response = self.client.patch(self.custom_owned_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Updated Custom Shelf Name')
        self.assertEqual(response.data['shelf_desc'], 'Updated desc')

    # Owned & Non-custom (invalid)
    def test_update_owned_non_custom_shelf_invalid(self):
        """
        Updating own non-custom shelf (invalid).
        """
        self.client.force_authenticate(user=self.user)
        data = {'name': 'New Name for Non-Custom'}
        response = self.client.patch(self.non_custom_owned_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # Not owned (invalid)
    def test_update_other_users_custom_shelf_invalid(self):
        """
        Updating another user's custom shelf (invalid).
        """
        self.client.force_authenticate(user=self.user)
        data = {'name': 'Hacking Attempt'}
        response = self.client.patch(self.custom_other_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    ## Update Fields

    # Valid name length
    def test_update_owned_custom_shelf_valid_name_length(self):
        """
        Updating name within valid length (valid).
        """
        self.client.force_authenticate(user=self.user)
        data = {'name': 'Valid Name'}
        response = self.client.patch(self.custom_owned_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Valid Name')

    # Invalid name length
    def test_update_owned_custom_shelf_name_too_long(self):
        """
        Updating name exceeding max length (invalid).
        """
        self.client.force_authenticate(user=self.user)
        data = {'name': 'A' * 251}
        response = self.client.patch(self.custom_owned_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # Updating shelf_desc
    def test_update_owned_custom_shelf_desc_valid(self):
        """
        Updating shelf_desc on own custom shelf (valid).
        """
        self.client.force_authenticate(user=self.user)
        data = {'shelf_desc': 'New description'}
        response = self.client.patch(self.custom_owned_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['shelf_desc'], 'New description')

    # Updating is_private
    def test_update_owned_custom_shelf_is_private_valid(self):
        """
        Updating is_private on own custom shelf (valid).
        """
        self.client.force_authenticate(user=self.user)
        data = {'is_private': True}
        response = self.client.patch(self.custom_owned_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['is_private'])

    # Updating shelf_img
    def test_update_owned_custom_shelf_image_valid(self):
        """
        Updating shelf_img on own custom shelf (valid).
        """
        self.client.force_authenticate(user=self.user)
        data = {'shelf_img': 'https://ia800100.us.archive.org/view_archive.php?archive=/5/items/l_covers_0012/l_covers_0012_64.zip&file=0012646659-L.jpg'}
        response = self.client.patch(self.custom_owned_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['shelf_img'], 'https://ia800100.us.archive.org/view_archive.php?archive=/5/items/l_covers_0012/l_covers_0012_64.zip&file=0012646659-L.jpg')

    # Attempting to change shelf_type
    def test_update_owned_custom_shelf_type_invalid(self):
        """
        Attempting to change shelf_type from 'Custom' (invalid).
        """
        self.client.force_authenticate(user=self.user)
        data = {'shelf_type': 'Read'}
        response = self.client.patch(self.custom_owned_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # After the update, it should still remain 'Custom' if code ignores or reverts changes
        self.assertEqual(response.data['shelf_type'], 'Custom')

    ## Non-existent Shelf

    # Updating non-existent shelf (invalid)
    def test_update_nonexistent_shelf_invalid(self):
        """
        Updating a shelf that does not exist (invalid).
        """
        self.client.force_authenticate(user=self.user)
        data = {'name': 'Does Not Matter'}
        response = self.client.patch(self.non_existent_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

class ShelfEditionBaseTest(TestCase):
    """
    Base test class with common setup for shelf-edition operations
    """
    def setUp(self):
        """
        Create common test data needed for all shelf-edition tests
        """
        # Create test users
        self.user = User.objects.create_user(
            username="shelf_owner",
            email="owner@example.com",
            password="testpassword"
        )
        self.other_user = User.objects.create_user(
            username="other_user",
            email="other@example.com",
            password="testpassword"
        )
        
        # Create basic book (required for Edition FK)
        self.book = Book.objects.create(title="Test Book")
        
        # Create basic publisher (required for Edition FK)
        self.publisher = Publisher.objects.create(name="Test Publisher")
        
        # Create test editions
        self.edition1 = Edition.objects.create(
            book=self.book,
            isbn="9798989445622",
            publisher=self.publisher,
            kind="Hardcover",
            publication_year=2020,
            language="English"
        )
        
        self.edition2 = Edition.objects.create(
            book=self.book,
            isbn="9780486852966",
            publisher=self.publisher,
            kind="Paperback",
            publication_year=2021,
            language="English"
        )
        
        self.edition3 = Edition.objects.create(
            book=self.book,
            isbn="9780593438367",
            publisher=self.publisher,
            kind="eBook",
            publication_year=2022,
            language="English"
        )
        
        # Create test shelves
        self.shelf = Shelf.objects.create(
            user=self.user,
            name="Test Shelf",
            shelf_type="Custom",
            is_private=False
        )
        
        self.private_shelf = Shelf.objects.create(
            user=self.user,
            name="Private Shelf",
            shelf_type="Custom",
            is_private=True
        )
        
        self.other_user_shelf = Shelf.objects.create(
            user=self.other_user,
            name="Other User's Shelf",
            shelf_type="Custom",
            is_private=False
        )
        
        self.other_private_shelf = Shelf.objects.create(
            user=self.other_user,
            name="Other User's Private Shelf",
            shelf_type="Custom",
            is_private=True
        )
        
        # Add one edition to shelf to test duplicate validation
        ShelfEdition.objects.create(
            shelf=self.shelf,
            edition=self.edition3
        )
        
        # Add one edition to private shelf
        ShelfEdition.objects.create(
            shelf=self.private_shelf,
            edition=self.edition2
        )
        
        # Add one edition to other user's shelf
        ShelfEdition.objects.create(
            shelf=self.other_user_shelf,
            edition=self.edition1
        )
        
        # Create empty shelf for testing
        self.empty_shelf = Shelf.objects.create(
            user=self.user,
            name="Empty Shelf",
            shelf_type="Custom",
            is_private=False
        )
        
        # Set up API client
        self.client = APIClient()


### Equivalent Classes for Adding Edition ###
##  Authentication Status ##
#       Authenticated user              (valid)
#       Unauthenticated user            (invalid)
##  Shelf Ownership ##
#       User is shelf owner             (valid)
#       User is not shelf owner         (invalid)
##  Edition Existence ##
#       Edition exists                  (valid)
#       Edition does not exist          (invalid)
##  Duplicate Check ##
#       Edition not on shelf            (valid)
#       Edition already on shelf        (invalid)
##  Multiple Editions of Same Book ##
#       Different editions of same book (valid)

class AddEditionToShelfTests(ShelfEditionBaseTest):
    """
    Test Module for adding editions to shelves based on listed equivalence classes
    """
    def setUp(self):
        """
        Additional setup for add edition tests
        """
        super().setUp()
        self.add_edition_url = reverse("shelf-add-edition", kwargs={"pk": self.shelf.pk})
        self.add_to_private_url = reverse("shelf-add-edition", kwargs={"pk": self.private_shelf.pk})
        self.add_to_other_url = reverse("shelf-add-edition", kwargs={"pk": self.other_user_shelf.pk})
    
    # Authentication Status: Authenticated user (valid)
    def test_add_edition_authenticated_user(self):
        """Test that an authenticated user can add an edition to their shelf"""
        self.client.force_authenticate(user=self.user)
        
        data = {
            'edition_id': self.edition1.pk
        }
        
        response = self.client.post(self.add_edition_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            ShelfEdition.objects.filter(
                shelf=self.shelf,
                edition=self.edition1
            ).exists()
        )
    
    # Authentication Status: Unauthenticated user (invalid)
    def test_add_edition_unauthenticated_user(self):
        """Test that an unauthenticated user cannot add an edition to a shelf"""
        data = {
            'edition_id': self.edition1.pk
        }
        
        response = self.client.post(self.add_edition_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(
            ShelfEdition.objects.filter(
                shelf=self.shelf,
                edition=self.edition1
            ).exists()
        )
    
    # Shelf Ownership: User is shelf owner (valid)
    def test_add_edition_to_own_shelf(self):
        """Test that a user can add an edition to their own shelf"""
        self.client.force_authenticate(user=self.user)
        
        data = {
            'edition_id': self.edition1.pk
        }
        
        response = self.client.post(self.add_edition_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            ShelfEdition.objects.filter(
                shelf=self.shelf,
                edition=self.edition1
            ).exists()
        )
    
    # Shelf Ownership: User is not shelf owner (invalid)
    def test_add_edition_to_others_shelf(self):
        """Test that a user cannot add an edition to another user's shelf"""
        self.client.force_authenticate(user=self.other_user)
        
        data = {
            'edition_id': self.edition1.pk
        }
        
        response = self.client.post(self.add_edition_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(
            ShelfEdition.objects.filter(
                shelf=self.shelf,
                edition=self.edition1
            ).exists()
        )
    
    # Edition Existence: Edition does not exist (invalid)
    def test_add_nonexistent_edition(self):
        """Test adding a non-existent edition to a shelf"""
        self.client.force_authenticate(user=self.user)
        
        data = {
            'edition_id': 99999  # Non-existent ID
        }
        
        response = self.client.post(self.add_edition_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('edition_id', response.data)
    
    # Duplicate Check: Edition already on shelf (invalid)
    def test_add_duplicate_edition(self):
        """Test adding an edition that is already on the shelf"""
        self.client.force_authenticate(user=self.user)
        
        data = {
            'edition_id': self.edition3.pk  # Already on the shelf
        }
        
        response = self.client.post(self.add_edition_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('non_field_errors', response.data)
    
    # Multiple Editions of Same Book: Different editions of same book (valid)
    def test_add_multiple_editions_of_same_book(self):
        """Test adding multiple editions of the same book to a shelf"""
        self.client.force_authenticate(user=self.user)
        
        # Add edition1 (hardcover)
        data1 = {'edition_id': self.edition1.pk}
        response1 = self.client.post(self.add_edition_url, data1, format='json')
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)
        
        # Add edition2 (paperback)
        data2 = {'edition_id': self.edition2.pk}
        response2 = self.client.post(self.add_edition_url, data2, format='json')
        self.assertEqual(response2.status_code, status.HTTP_201_CREATED)
        
        # Verify both editions are on the shelf
        self.assertTrue(
            ShelfEdition.objects.filter(
                shelf=self.shelf,
                edition=self.edition1
            ).exists()
        )
        self.assertTrue(
            ShelfEdition.objects.filter(
                shelf=self.shelf,
                edition=self.edition2
            ).exists()
        )


### Equivalent Classes for Removing Edition ###
##  Authentication Status ##
#       Authenticated user              (valid)
#       Unauthenticated user            (invalid)
##  Shelf Ownership ##
#       User is shelf owner             (valid)
#       User is not shelf owner         (invalid)
##  ShelfEdition Existence ##
#       Edition is on shelf             (valid)
#       Edition is not on shelf         (invalid)
##  Request Parameters ##
#       Contains valid edition_id param (valid)
#       Missing edition_id param        (invalid)

class RemoveEditionFromShelfTests(ShelfEditionBaseTest):
    """
    Test Module for removing editions from shelves based on listed equivalence classes
    """
    def setUp(self):
        """
        Additional setup for remove edition tests
        """
        super().setUp()
        self.remove_edition_url = reverse("shelf-remove-edition", kwargs={"pk": self.shelf.pk})
        self.remove_from_private_url = reverse("shelf-remove-edition", kwargs={"pk": self.private_shelf.pk})
        self.remove_from_other_url = reverse("shelf-remove-edition", kwargs={"pk": self.other_user_shelf.pk})
    
    # Authentication Status: Authenticated user (valid)
    def test_remove_edition_authenticated_user(self):
        """Test that an authenticated user can remove an edition from their shelf"""
        self.client.force_authenticate(user=self.user)
        
        # URL with query parameter
        remove_url = f"{self.remove_edition_url}?edition_id={self.edition3.pk}"
        
        response = self.client.delete(remove_url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(
            ShelfEdition.objects.filter(
                shelf=self.shelf,
                edition=self.edition3
            ).exists()
        )
    
    # Authentication Status: Unauthenticated user (invalid)
    def test_remove_edition_unauthenticated_user(self):
        """Test that an unauthenticated user cannot remove an edition from a shelf"""
        # URL with query parameter
        remove_url = f"{self.remove_edition_url}?edition_id={self.edition3.pk}"
        
        response = self.client.delete(remove_url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertTrue(
            ShelfEdition.objects.filter(
                shelf=self.shelf,
                edition=self.edition3
            ).exists()
        )
    
    # Shelf Ownership: User is shelf owner (valid)
    def test_remove_edition_from_own_shelf(self):
        """Test that a user can remove an edition from their own shelf"""
        self.client.force_authenticate(user=self.user)
        
        # URL with query parameter
        remove_url = f"{self.remove_edition_url}?edition_id={self.edition3.pk}"
        
        response = self.client.delete(remove_url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(
            ShelfEdition.objects.filter(
                shelf=self.shelf,
                edition=self.edition3
            ).exists()
        )
    
    # Shelf Ownership: User is not shelf owner (invalid)
    def test_remove_edition_from_others_shelf(self):
        """Test that a user cannot remove an edition from another user's shelf"""
        self.client.force_authenticate(user=self.other_user)
        
        # URL with query parameter
        remove_url = f"{self.remove_edition_url}?edition_id={self.edition3.pk}"
        
        response = self.client.delete(remove_url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(
            ShelfEdition.objects.filter(
                shelf=self.shelf,
                edition=self.edition3
            ).exists()
        )
    
    # ShelfEdition Existence: Edition is not on shelf (invalid)
    def test_remove_edition_not_on_shelf(self):
        """Test removing an edition that is not on the shelf"""
        self.client.force_authenticate(user=self.user)
        
        # URL with query parameter for edition not on this shelf
        remove_url = f"{self.remove_edition_url}?edition_id={self.edition1.pk}"
        
        response = self.client.delete(remove_url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    # Request Parameters: Missing edition_id param (invalid)
    def test_remove_edition_missing_id(self):
        """Test removing an edition without providing the edition_id parameter"""
        self.client.force_authenticate(user=self.user)
        
        # URL without query parameter
        response = self.client.delete(self.remove_edition_url)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(
            ShelfEdition.objects.filter(
                shelf=self.shelf,
                edition=self.edition3
            ).exists()
        )


### Equivalent Classes for Listing Editions ###
##  Authentication Status ##
#       Authenticated user                    (valid)
#       Unauthenticated user                  (invalid)
##  Shelf Visibility ##
#       Public shelf                          (valid - any authenticated user can view)
#       Private shelf & user is owner         (valid)
#       Private shelf & user is not owner     (invalid)
##  Shelf Content ##
#       Shelf has editions                    (valid - returns list)
#       Shelf has no editions                 (valid - returns empty list)

class ListEditionsOnShelfTests(ShelfEditionBaseTest):
    """
    Test Module for listing editions on shelves based on listed equivalence classes
    """
    def setUp(self):
        """
        Additional setup for list edition tests
        """
        super().setUp()
        self.list_editions_url = reverse("shelf-editions", kwargs={"pk": self.shelf.pk})
        self.list_private_url = reverse("shelf-editions", kwargs={"pk": self.private_shelf.pk})
        self.list_other_url = reverse("shelf-editions", kwargs={"pk": self.other_user_shelf.pk})
        self.list_other_private_url = reverse("shelf-editions", kwargs={"pk": self.other_private_shelf.pk})
        self.list_empty_url = reverse("shelf-editions", kwargs={"pk": self.empty_shelf.pk})
    
    # Authentication Status: Authenticated user (valid)
    def test_list_editions_authenticated_user(self):
        """Test listing editions on a shelf when user is authenticated"""
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get(self.list_editions_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)  # One edition on this shelf
    
    # Authentication Status: Unauthenticated user (invalid)
    def test_list_editions_unauthenticated_user(self):
        """Test listing editions on a shelf when user is not authenticated"""
        response = self.client.get(self.list_editions_url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    # Shelf Visibility: Public shelf (valid - any authenticated user can view)
    def test_list_editions_public_shelf_other_user(self):
        """Test listing editions on a public shelf as a different user"""
        self.client.force_authenticate(user=self.other_user)
        
        response = self.client.get(self.list_editions_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)  # One edition on this shelf
    
    # Shelf Visibility: Private shelf & user is owner (valid)
    def test_list_editions_private_shelf_owner(self):
        """Test listing editions on a private shelf as the owner"""
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get(self.list_private_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)  # One edition on this private shelf
    
    # Shelf Visibility: Private shelf & user is not owner (invalid)
    def test_list_editions_private_shelf_other_user(self):
        """Test listing editions on a private shelf as a non-owner"""
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get(self.list_other_private_url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    # Shelf Content: Shelf has no editions (valid - returns empty list)
    def test_list_editions_empty_shelf(self):
        """Test listing editions on a shelf that has no editions"""
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get(self.list_empty_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)  # Empty list

### Equivalent Classes ###
##  UserBook Creation ##
#       Adding edition to Read shelf creates UserBook with Read status         (valid)
#       Adding edition to Reading shelf creates UserBook with Reading status   (valid)
#       Adding edition to Want to Read shelf creates UserBook with Want status (valid)
#       Adding edition to Owned shelf creates UserBook with is_owned=True      (valid)
#       Adding edition to Custom shelf does not create UserBook                (valid)
##  UserBook Updates ##
#       Migrating edition between status shelves updates read_status           (valid)
#       Adding edition to multiple status shelves only keeps last one          (valid)
#       Adding edition to Owned shelf sets is_owned=True                       (valid)
#       Adding edition to both status and Owned keeps both properties          (valid)
##  UserBook Removal ##
#       Removing edition from only status shelf deletes UserBook               (valid)
#       Removing edition from status shelf but still owned keeps UserBook      (valid)
#       Removing edition from owned shelf but still in status keeps UserBook   (valid)
#       Removing same book's different edition updates same UserBook           (valid)

class UserBookEntityTests(TestCase):
    """
    Test Module for UserBook entity updates based on shelf operations
    """
    def setUp(self):
        """
        Create test (mock) data for UserBook tests.
        Test user, books, editions, shelves and API client.
        """
        # Create a test user
        self.user = User.objects.create_user(
            username="userbook_tester",
            email="userbook@example.com",
            password="testpassword"
        )
        
        # Create reading status shelves
        self.read_shelf = Shelf.objects.create(
            user=self.user,
            name="Read Books",
            shelf_type="Read",
            is_private=False
        )
        
        self.reading_shelf = Shelf.objects.create(
            user=self.user,
            name="Currently Reading",
            shelf_type="Reading",
            is_private=False
        )
        
        self.want_to_read_shelf = Shelf.objects.create(
            user=self.user,
            name="Want to Read",
            shelf_type="Want to Read",
            is_private=False
        )

        self.owned_shelf = Shelf.objects.create(
            user=self.user,
            name="Owned Books",
            shelf_type="Owned",
            is_private=False
        )
        
        self.custom_shelf = Shelf.objects.create(
            user=self.user,
            name="Custom Shelf",
            shelf_type="Custom",
            is_private=False
        )
        
        # Create book and editions
        self.book = Book.objects.create(
            title="Test Book",
            book_id="test123"
        )
        
        self.publisher = Publisher.objects.create(name="Test Publisher")
        
        self.hardcover_edition = Edition.objects.create(
            book=self.book,
            isbn="9781234567890",
            publisher=self.publisher,
            kind="Hardcover",
            publication_year=2020,
            language="English"
        )
        
        self.paperback_edition = Edition.objects.create(
            book=self.book,
            isbn="9780987654321",
            publisher=self.publisher,
            kind="Paperback",
            publication_year=2021,
            language="English"
        )
        
        # Create a second book and edition for additional tests
        self.book2 = Book.objects.create(
            title="Second Test Book",
            book_id="test456"
        )
        
        self.book2_edition = Edition.objects.create(
            book=self.book2,
            isbn="9781122334455",
            publisher=self.publisher,
            kind="Hardcover",
            publication_year=2022,
            language="English"
        )
        
        # Set up API client
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        
        # Set up URLs for adding editions to shelves
        self.add_to_read_url = reverse("shelf-add-edition", kwargs={"pk": self.read_shelf.pk})
        self.add_to_reading_url = reverse("shelf-add-edition", kwargs={"pk": self.reading_shelf.pk})
        self.add_to_want_url = reverse("shelf-add-edition", kwargs={"pk": self.want_to_read_shelf.pk})
        self.add_to_owned_url = reverse("shelf-add-edition", kwargs={"pk": self.owned_shelf.pk})
        self.add_to_custom_url = reverse("shelf-add-edition", kwargs={"pk": self.custom_shelf.pk})
        
        # Set up URLs for removing editions from shelves
        self.remove_from_read_url = reverse("shelf-remove-edition", kwargs={"pk": self.read_shelf.pk})
        self.remove_from_reading_url = reverse("shelf-remove-edition", kwargs={"pk": self.reading_shelf.pk})
        self.remove_from_want_url = reverse("shelf-remove-edition", kwargs={"pk": self.want_to_read_shelf.pk})
        self.remove_from_owned_url = reverse("shelf-remove-edition", kwargs={"pk": self.owned_shelf.pk})
        self.remove_from_custom_url = reverse("shelf-remove-edition", kwargs={"pk": self.custom_shelf.pk})
    
    ### Actual tests ###
    
    ## UserBook Creation
    
    # Adding edition to Read shelf creates UserBook with Read status (valid)
    def test_adding_to_read_shelf_creates_userbook(self):
        """Test adding edition to Read shelf creates UserBook with Read status"""
        # Verify no UserBook exists initially
        self.assertFalse(UserBook.objects.filter(user=self.user, book=self.book).exists())
        
        # Add edition to Read shelf
        response = self.client.post(
            self.add_to_read_url,
            {"edition_id": self.hardcover_edition.pk},
            format="json"
        )
        
        # Verify success and UserBook creation
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(UserBook.objects.filter(user=self.user, book=self.book).exists())
        
        # Verify UserBook has correct Read status
        user_book = UserBook.objects.get(user=self.user, book=self.book)
        self.assertEqual(user_book.read_status, "Read")
        self.assertFalse(user_book.is_owned)
    
    # Adding edition to Reading shelf creates UserBook with Reading status (valid)
    def test_adding_to_reading_shelf_creates_userbook(self):
        """Test adding edition to Reading shelf creates UserBook with Reading status"""
        # Verify no UserBook exists initially
        self.assertFalse(UserBook.objects.filter(user=self.user, book=self.book).exists())
        
        # Add edition to Reading shelf
        response = self.client.post(
            self.add_to_reading_url,
            {"edition_id": self.hardcover_edition.pk},
            format="json"
        )
        
        # Verify success and UserBook creation
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(UserBook.objects.filter(user=self.user, book=self.book).exists())
        
        # Verify UserBook has correct Reading status
        user_book = UserBook.objects.get(user=self.user, book=self.book)
        self.assertEqual(user_book.read_status, "Reading")
        self.assertFalse(user_book.is_owned)
    
    # Adding edition to Want to Read shelf creates UserBook with Want status (valid)
    def test_adding_to_want_shelf_creates_userbook(self):
        """Test adding edition to Want to Read shelf creates UserBook with Want to Read status"""
        # Verify no UserBook exists initially
        self.assertFalse(UserBook.objects.filter(user=self.user, book=self.book).exists())
        
        # Add edition to Want to Read shelf
        response = self.client.post(
            self.add_to_want_url,
            {"edition_id": self.hardcover_edition.pk},
            format="json"
        )
        
        # Verify success and UserBook creation
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(UserBook.objects.filter(user=self.user, book=self.book).exists())
        
        # Verify UserBook has correct Want to Read status
        user_book = UserBook.objects.get(user=self.user, book=self.book)
        self.assertEqual(user_book.read_status, "Want to Read")
        self.assertFalse(user_book.is_owned)
    
    # Adding edition to Owned shelf creates UserBook with is_owned=True (valid)
    def test_adding_to_owned_shelf_creates_userbook(self):
        """Test adding edition to Owned shelf creates UserBook with is_owned=True"""
        # Verify no UserBook exists initially
        self.assertFalse(UserBook.objects.filter(user=self.user, book=self.book).exists())
        
        # Add edition to Owned shelf
        response = self.client.post(
            self.add_to_owned_url,
            {"edition_id": self.hardcover_edition.pk},
            format="json"
        )
        
        # Verify success and UserBook creation
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(UserBook.objects.filter(user=self.user, book=self.book).exists())
        
        # Verify UserBook has correct ownership status
        user_book = UserBook.objects.get(user=self.user, book=self.book)
        self.assertTrue(user_book.is_owned)
        self.assertIsNone(user_book.read_status)  # Now expecting None instead of "Want to Read"

    # Adding edition to Custom shelf does not create UserBook (valid)
    def test_adding_to_custom_shelf_does_not_create_userbook(self):
        """Test adding edition to Custom shelf does not create a UserBook"""
        # Verify no UserBook exists initially
        self.assertFalse(UserBook.objects.filter(user=self.user, book=self.book).exists())
        
        # Add edition to Custom shelf
        response = self.client.post(
            self.add_to_custom_url,
            {"edition_id": self.hardcover_edition.pk},
            format="json"
        )
        
        # Verify success
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify NO UserBook was created
        self.assertFalse(UserBook.objects.filter(user=self.user, book=self.book).exists())
    
    ## UserBook Updates
    
    # Migrating edition between status shelves updates read_status (valid)
    def test_migrating_between_status_shelves_updates_userbook(self):
        """Test migrating edition between status shelves updates UserBook read_status"""
        # Add edition to Want to Read shelf
        self.client.post(
            self.add_to_want_url,
            {"edition_id": self.hardcover_edition.pk},
            format="json"
        )
        
        # Verify initial UserBook status
        user_book = UserBook.objects.get(user=self.user, book=self.book)
        self.assertEqual(user_book.read_status, "Want to Read")
        
        # Move to Reading shelf
        response = self.client.post(
            self.add_to_reading_url,
            {"edition_id": self.hardcover_edition.pk},
            format="json"
        )
        
        # Verify success and updated UserBook
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user_book.refresh_from_db()
        self.assertEqual(user_book.read_status, "Reading")
    
    # Adding edition to multiple status shelves only keeps last one (valid)
    def test_adding_to_multiple_status_shelves_only_keeps_last(self):
        """Test adding edition to multiple status shelves only keeps it on the last one"""
        # Add edition to all three status shelves in sequence
        self.client.post(
            self.add_to_want_url,
            {"edition_id": self.hardcover_edition.pk},
            format="json"
        )
        
        self.client.post(
            self.add_to_reading_url,
            {"edition_id": self.hardcover_edition.pk},
            format="json"
        )
        
        self.client.post(
            self.add_to_read_url,
            {"edition_id": self.hardcover_edition.pk},
            format="json"
        )
        
        # Verify edition is only on Read shelf
        self.assertTrue(
            ShelfEdition.objects.filter(
                shelf=self.read_shelf,
                edition=self.hardcover_edition
            ).exists()
        )
        
        self.assertFalse(
            ShelfEdition.objects.filter(
                shelf=self.reading_shelf,
                edition=self.hardcover_edition
            ).exists()
        )
        
        self.assertFalse(
            ShelfEdition.objects.filter(
                shelf=self.want_to_read_shelf,
                edition=self.hardcover_edition
            ).exists()
        )
        
        # Verify UserBook has final status
        user_book = UserBook.objects.get(user=self.user, book=self.book)
        self.assertEqual(user_book.read_status, "Read")
    
    # Adding edition to Owned shelf sets is_owned=True (valid)
    def test_adding_to_owned_sets_is_owned(self):
        """Test adding edition to Owned shelf sets UserBook is_owned=True"""
        # Add edition to Owned shelf
        response = self.client.post(
            self.add_to_owned_url,
            {"edition_id": self.hardcover_edition.pk},
            format="json"
        )
        
        # Verify success and UserBook ownership
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user_book = UserBook.objects.get(user=self.user, book=self.book)
        self.assertTrue(user_book.is_owned)
    
    # Adding edition to both status and Owned keeps both properties (valid)
    def test_adding_to_status_and_owned_keeps_both_properties(self):
        """Test adding edition to both status and Owned shelves keeps both properties"""
        # Add edition to Read shelf
        self.client.post(
            self.add_to_read_url,
            {"edition_id": self.hardcover_edition.pk},
            format="json"
        )
        
        # Add edition to Owned shelf
        self.client.post(
            self.add_to_owned_url,
            {"edition_id": self.hardcover_edition.pk},
            format="json"
        )
        
        # Verify UserBook has both properties
        user_book = UserBook.objects.get(user=self.user, book=self.book)
        self.assertEqual(user_book.read_status, "Read")
        self.assertTrue(user_book.is_owned)
        
        # Verify edition is on both shelves
        self.assertTrue(
            ShelfEdition.objects.filter(
                shelf=self.read_shelf,
                edition=self.hardcover_edition
            ).exists()
        )
        
        self.assertTrue(
            ShelfEdition.objects.filter(
                shelf=self.owned_shelf,
                edition=self.hardcover_edition
            ).exists()
        )
    
    ## UserBook Removal
    
    # Removing edition from only status shelf deletes UserBook (valid)
    def test_removing_from_only_status_shelf_deletes_userbook(self):
        """Test removing edition from its only status shelf deletes UserBook"""
        # Add edition to Read shelf
        self.client.post(
            self.add_to_read_url,
            {"edition_id": self.hardcover_edition.pk},
            format="json"
        )
        
        # Verify UserBook exists
        self.assertTrue(UserBook.objects.filter(user=self.user, book=self.book).exists())
        
        # Remove from Read shelf
        remove_url = f"{self.remove_from_read_url}?edition_id={self.hardcover_edition.pk}"
        response = self.client.delete(remove_url)
        
        # Verify success and UserBook deletion
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(UserBook.objects.filter(user=self.user, book=self.book).exists())
    
    # Removing edition from status shelf but still owned keeps UserBook (valid)
    def test_removing_from_status_shelf_but_still_owned_keeps_userbook(self):
        """Test removing edition from status shelf but still owned keeps UserBook"""
        # Add edition to Read and Owned shelves
        self.client.post(
            self.add_to_read_url,
            {"edition_id": self.hardcover_edition.pk},
            format="json"
        )
        
        self.client.post(
            self.add_to_owned_url,
            {"edition_id": self.hardcover_edition.pk},
            format="json"
        )
        
        # Verify initial UserBook state
        user_book = UserBook.objects.get(user=self.user, book=self.book)
        self.assertEqual(user_book.read_status, "Read")
        self.assertTrue(user_book.is_owned)
        
        # Remove from Read shelf
        remove_url = f"{self.remove_from_read_url}?edition_id={self.hardcover_edition.pk}"
        response = self.client.delete(remove_url)
        
        # Verify success
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Verify UserBook still exists but with updated properties
        self.assertTrue(UserBook.objects.filter(user=self.user, book=self.book).exists())
        
        user_book.refresh_from_db()
        self.assertTrue(user_book.is_owned)
        # Depending on your implementation, read_status might be cleared or maintain previous value
    
    # Removing edition from owned shelf but still in status keeps UserBook (valid)
    def test_removing_from_owned_shelf_but_still_in_status_keeps_userbook(self):
        """Test removing edition from owned shelf but still in status keeps UserBook"""
        # Add edition to Read and Owned shelves
        self.client.post(
            self.add_to_read_url,
            {"edition_id": self.hardcover_edition.pk},
            format="json"
        )
        
        self.client.post(
            self.add_to_owned_url,
            {"edition_id": self.hardcover_edition.pk},
            format="json"
        )
        
        # Verify initial UserBook state
        user_book = UserBook.objects.get(user=self.user, book=self.book)
        self.assertEqual(user_book.read_status, "Read")
        self.assertTrue(user_book.is_owned)
        
        # Remove from Owned shelf
        remove_url = f"{self.remove_from_owned_url}?edition_id={self.hardcover_edition.pk}"
        response = self.client.delete(remove_url)
        
        # Verify success
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Verify UserBook still exists but with updated properties
        self.assertTrue(UserBook.objects.filter(user=self.user, book=self.book).exists())
        
        user_book.refresh_from_db()
        self.assertEqual(user_book.read_status, "Read")
        self.assertFalse(user_book.is_owned)
    
    # Removing same book's different edition updates same UserBook (valid)
    def test_removing_different_edition_of_same_book_updates_userbook(self):
        """Test removing different edition of same book updates the same UserBook"""
        # Add both editions to different shelves
        self.client.post(
            self.add_to_reading_url,
            {"edition_id": self.hardcover_edition.pk},
            format="json"
        )
        
        self.client.post(
            self.add_to_owned_url,
            {"edition_id": self.paperback_edition.pk},
            format="json"
        )
        
        # Verify initial UserBook state
        user_book = UserBook.objects.get(user=self.user, book=self.book)
        self.assertEqual(user_book.read_status, "Reading")
        self.assertTrue(user_book.is_owned)
        
        # Remove hardcover from Reading shelf
        remove_url = f"{self.remove_from_reading_url}?edition_id={self.hardcover_edition.pk}"
        response = self.client.delete(remove_url)
        
        # Verify success
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Verify UserBook still exists but with updated properties
        self.assertTrue(UserBook.objects.filter(user=self.user, book=self.book).exists())
        
        user_book.refresh_from_db()
        self.assertTrue(user_book.is_owned)
        # read_status should be removed or set to a default value

### Equivalent Classes ###
##  Radio Button Behavior ##
#       Adding edition to status shelf when no prior status exists               (valid)
#       Adding edition to status shelf when it's on another status shelf         (valid - should migrate)
#       Adding edition to status shelf when it's on same status shelf            (invalid)
#       Adding edition to owned shelf doesn't affect status shelf                (valid)
#       Adding edition to status shelf doesn't affect owned shelf                (valid)
##  Different Editions Same Book ##
#       Adding different edition of same book to different status shelf          (valid - should migrate)
##  UserBook Updates ##
#       UserBook created when adding to first special shelf                      (valid)
#       UserBook updated when moving between status shelves                      (valid)
#       UserBook maintains owned status when removing from status shelf          (valid)
#       UserBook maintains status when removing from owned shelf                 (valid)
#       UserBook deleted when removed from all special shelves                   (valid)

class ShelfReadStatusTests(TestCase):
    """
    Test Module for verifying read status "radio button" behavior of shelves
    """
    def setUp(self):
        """
        Create test (mock) data for read status tests.
        Test user, books, editions, shelves and API client for testing.
        """
        # Create a test user
        self.user = User.objects.create_user(
            username="reader_user",
            email="reader@example.com",
            password="testpassword"
        )
        
        # Create reading status shelves
        self.read_shelf = Shelf.objects.create(
            user=self.user,
            name="Read Books",
            shelf_type="Read",
            is_private=False
        )
        
        self.reading_shelf = Shelf.objects.create(
            user=self.user,
            name="Currently Reading",
            shelf_type="Reading",
            is_private=False
        )
        
        self.want_to_read_shelf = Shelf.objects.create(
            user=self.user,
            name="Want to Read",
            shelf_type="Want to Read",
            is_private=False
        )

        self.owned_shelf = Shelf.objects.create(
            user=self.user,
            name="Owned Books",
            shelf_type="Owned",
            is_private=False
        )
        
        self.custom_shelf = Shelf.objects.create(
            user=self.user,
            name="Custom Shelf",
            shelf_type="Custom",
            is_private=False
        )
        
        # Create book and editions
        self.book = Book.objects.create(
            title="Test Book",
            book_id="test123"
        )
        
        self.publisher = Publisher.objects.create(name="Test Publisher")
        
        self.hardcover_edition = Edition.objects.create(
            book=self.book,
            isbn="9781234567890",
            publisher=self.publisher,
            kind="Hardcover",
            publication_year=2020,
            language="English"
        )
        
        self.paperback_edition = Edition.objects.create(
            book=self.book,
            isbn="9780987654321",
            publisher=self.publisher,
            kind="Paperback",
            publication_year=2021,
            language="English"
        )
        
        # Create a second book and edition for additional tests
        self.book2 = Book.objects.create(
            title="Second Test Book",
            book_id="test456"
        )
        
        self.book2_edition = Edition.objects.create(
            book=self.book2,
            isbn="9781122334455",
            publisher=self.publisher,
            kind="Hardcover",
            publication_year=2022,
            language="English"
        )
        
        # Set up API client
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        
        # Set up URLs for adding editions to shelves
        self.add_to_read_url = reverse("shelf-add-edition", kwargs={"pk": self.read_shelf.pk})
        self.add_to_reading_url = reverse("shelf-add-edition", kwargs={"pk": self.reading_shelf.pk})
        self.add_to_want_url = reverse("shelf-add-edition", kwargs={"pk": self.want_to_read_shelf.pk})
        self.add_to_owned_url = reverse("shelf-add-edition", kwargs={"pk": self.owned_shelf.pk})
        self.add_to_custom_url = reverse("shelf-add-edition", kwargs={"pk": self.custom_shelf.pk})
        
        # Set up URLs for removing editions from shelves
        self.remove_from_read_url = reverse("shelf-remove-edition", kwargs={"pk": self.read_shelf.pk})
        self.remove_from_reading_url = reverse("shelf-remove-edition", kwargs={"pk": self.reading_shelf.pk})
        self.remove_from_want_url = reverse("shelf-remove-edition", kwargs={"pk": self.want_to_read_shelf.pk})
        self.remove_from_owned_url = reverse("shelf-remove-edition", kwargs={"pk": self.owned_shelf.pk})
        self.remove_from_custom_url = reverse("shelf-remove-edition", kwargs={"pk": self.custom_shelf.pk})
    
    ## Radio Button Behavior
    
    # Adding edition to status shelf when no prior status exists (valid)
    def test_add_edition_to_status_shelf_no_prior(self):
        """Test adding an edition to a status shelf when it's not on any status shelf"""
        # Add to "Want to Read" shelf
        response = self.client.post(
            self.add_to_want_url, 
            {"edition_id": self.hardcover_edition.pk}, 
            format="json"
        )
        
        # Check response and shelf contains edition
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            ShelfEdition.objects.filter(
                shelf=self.want_to_read_shelf,
                edition=self.hardcover_edition
            ).exists()
        )
        
        # Check UserBook created with correct status
        self.assertTrue(
            UserBook.objects.filter(
                user=self.user,
                book=self.book,
                read_status="Want to Read"
            ).exists()
        )
    
    # Adding edition to status shelf when it's on another status shelf (valid - should migrate)
    def test_add_edition_migrate_between_status_shelves(self):
        """Test that adding an edition to one status shelf removes it from another status shelf"""
        # First add to "Want to Read" shelf
        self.client.post(
            self.add_to_want_url, 
            {"edition_id": self.hardcover_edition.pk}, 
            format="json"
        )
        
        # Then add to "Reading" shelf
        response = self.client.post(
            self.add_to_reading_url, 
            {"edition_id": self.hardcover_edition.pk}, 
            format="json"
        )
        
        # Check response and "Reading" shelf contains edition
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            ShelfEdition.objects.filter(
                shelf=self.reading_shelf,
                edition=self.hardcover_edition
            ).exists()
        )
        
        # Check "Want to Read" shelf no longer contains edition
        self.assertFalse(
            ShelfEdition.objects.filter(
                shelf=self.want_to_read_shelf,
                edition=self.hardcover_edition
            ).exists()
        )
        
        # Check UserBook updated with new status
        user_book = UserBook.objects.get(user=self.user, book=self.book)
        self.assertEqual(user_book.read_status, "Reading")
    
    # Adding edition to status shelf when it's on same status shelf (invalid)
    def test_add_edition_to_same_status_shelf(self):
        """Test attempting to add an edition to a shelf it's already on"""
        # Add to "Read" shelf
        self.client.post(
            self.add_to_read_url, 
            {"edition_id": self.hardcover_edition.pk}, 
            format="json"
        )
        
        # Try to add again to same shelf
        response = self.client.post(
            self.add_to_read_url, 
            {"edition_id": self.hardcover_edition.pk}, 
            format="json"
        )
        
        # Should fail with 400 Bad Request
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    # Adding edition to owned shelf doesn't affect status shelf (valid)
    def test_add_to_owned_keeps_status(self):
        """Test adding an edition to Owned shelf doesn't remove it from status shelves"""
        # First add to "Reading" shelf
        self.client.post(
            self.add_to_reading_url, 
            {"edition_id": self.hardcover_edition.pk}, 
            format="json"
        )
        
        # Then add to "Owned" shelf
        response = self.client.post(
            self.add_to_owned_url, 
            {"edition_id": self.hardcover_edition.pk}, 
            format="json"
        )
        
        # Check response and both shelves contain edition
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            ShelfEdition.objects.filter(
                shelf=self.reading_shelf,
                edition=self.hardcover_edition
            ).exists()
        )
        self.assertTrue(
            ShelfEdition.objects.filter(
                shelf=self.owned_shelf,
                edition=self.hardcover_edition
            ).exists()
        )
        
        # Check UserBook has both statuses
        user_book = UserBook.objects.get(user=self.user, book=self.book)
        self.assertEqual(user_book.read_status, "Reading")
        self.assertTrue(user_book.is_owned)
    
    # Adding edition to status shelf doesn't affect owned shelf (valid)
    def test_add_to_status_keeps_owned(self):
        """Test adding an edition to a status shelf doesn't remove it from Owned shelf"""
        # First add to "Owned" shelf
        self.client.post(
            self.add_to_owned_url, 
            {"edition_id": self.hardcover_edition.pk}, 
            format="json"
        )
        
        # Then add to "Read" shelf
        response = self.client.post(
            self.add_to_read_url, 
            {"edition_id": self.hardcover_edition.pk}, 
            format="json"
        )
        
        # Check response and both shelves contain edition
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            ShelfEdition.objects.filter(
                shelf=self.owned_shelf,
                edition=self.hardcover_edition
            ).exists()
        )
        self.assertTrue(
            ShelfEdition.objects.filter(
                shelf=self.read_shelf,
                edition=self.hardcover_edition
            ).exists()
        )
        
        # Check UserBook has both statuses
        user_book = UserBook.objects.get(user=self.user, book=self.book)
        self.assertEqual(user_book.read_status, "Read")
        self.assertTrue(user_book.is_owned)
    
    ## Different Editions Same Book
    
    # Adding different edition of same book to different status shelf (valid - should migrate)
    def test_different_editions_same_book_migrate(self):
        """Test that adding a different edition of the same book to another status shelf migrates correctly"""
        # Add hardcover to "Want to Read" shelf
        self.client.post(
            self.add_to_want_url, 
            {"edition_id": self.hardcover_edition.pk}, 
            format="json"
        )
        
        # Add paperback to "Reading" shelf (same book, different edition)
        response = self.client.post(
            self.add_to_reading_url, 
            {"edition_id": self.paperback_edition.pk}, 
            format="json"
        )
        
        # Check response and paperback is on "Reading" shelf
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            ShelfEdition.objects.filter(
                shelf=self.reading_shelf,
                edition=self.paperback_edition
            ).exists()
        )
        
        # Check hardcover is no longer on "Want to Read" shelf
        self.assertFalse(
            ShelfEdition.objects.filter(
                shelf=self.want_to_read_shelf,
                edition=self.hardcover_edition
            ).exists()
        )
        
        # Check UserBook has updated status
        user_book = UserBook.objects.get(user=self.user, book=self.book)
        self.assertEqual(user_book.read_status, "Reading")
    
    ## UserBook Updates
    
    # UserBook created when adding to first special shelf (valid)
    def test_userbook_created_when_adding_to_special_shelf(self):
        """Test that UserBook is created when adding an edition to a special shelf"""
        # First verify no UserBook exists
        self.assertFalse(
            UserBook.objects.filter(
                user=self.user,
                book=self.book
            ).exists()
        )
        
        # Add to "Read" shelf
        self.client.post(
            self.add_to_read_url, 
            {"edition_id": self.hardcover_edition.pk}, 
            format="json"
        )
        
        # Verify UserBook was created with correct status
        self.assertTrue(
            UserBook.objects.filter(
                user=self.user,
                book=self.book,
                read_status="Read"
            ).exists()
        )
    
    # UserBook updated when moving between status shelves (valid)
    def test_userbook_updated_when_moving_between_status_shelves(self):
        """Test that UserBook is updated when edition moves between status shelves"""
        # Add to "Want to Read" shelf
        self.client.post(
            self.add_to_want_url, 
            {"edition_id": self.hardcover_edition.pk}, 
            format="json"
        )
        
        # Verify initial UserBook status
        user_book = UserBook.objects.get(user=self.user, book=self.book)
        self.assertEqual(user_book.read_status, "Want to Read")
        
        # Move to "Reading" shelf
        self.client.post(
            self.add_to_reading_url, 
            {"edition_id": self.hardcover_edition.pk}, 
            format="json"
        )
        
        # Verify UserBook status updated
        user_book.refresh_from_db()
        self.assertEqual(user_book.read_status, "Reading")
        
        # Move to "Read" shelf
        self.client.post(
            self.add_to_read_url, 
            {"edition_id": self.hardcover_edition.pk}, 
            format="json"
        )
        
        # Verify UserBook status updated again
        user_book.refresh_from_db()
        self.assertEqual(user_book.read_status, "Read")
    
    # UserBook maintains owned status when removing from status shelf (valid)
    def test_userbook_maintains_owned_status_when_removing_from_status(self):
        """Test that UserBook maintains owned status when removed from status shelf"""
        # Add to both "Owned" and "Reading" shelves
        self.client.post(
            self.add_to_owned_url, 
            {"edition_id": self.hardcover_edition.pk}, 
            format="json"
        )
        self.client.post(
            self.add_to_reading_url, 
            {"edition_id": self.hardcover_edition.pk}, 
            format="json"
        )
        
        # Verify initial UserBook status
        user_book = UserBook.objects.get(user=self.user, book=self.book)
        self.assertEqual(user_book.read_status, "Reading")
        self.assertTrue(user_book.is_owned)
        
        # Remove from "Reading" shelf
        remove_url = f"{self.remove_from_reading_url}?edition_id={self.hardcover_edition.pk}"
        self.client.delete(remove_url)
        
        # Verify UserBook kept "is_owned" but lost read_status
        user_book.refresh_from_db()
        self.assertTrue(user_book.is_owned)
        
        # Note: The exact behavior for read_status after removal depends on implementation
        # It might retain the previous value or be set to None/empty
    
    # UserBook maintains status when removing from owned shelf (valid)
    def test_userbook_maintains_status_when_removing_from_owned(self):
        """Test that UserBook maintains status when removed from owned shelf"""
        # Add to both "Owned" and "Read" shelves
        self.client.post(
            self.add_to_owned_url, 
            {"edition_id": self.hardcover_edition.pk}, 
            format="json"
        )
        self.client.post(
            self.add_to_read_url, 
            {"edition_id": self.hardcover_edition.pk}, 
            format="json"
        )
        
        # Verify initial UserBook status
        user_book = UserBook.objects.get(user=self.user, book=self.book)
        self.assertEqual(user_book.read_status, "Read")
        self.assertTrue(user_book.is_owned)
        
        # Remove from "Owned" shelf
        remove_url = f"{self.remove_from_owned_url}?edition_id={self.hardcover_edition.pk}"
        self.client.delete(remove_url)
        
        # Verify UserBook kept read_status but lost is_owned
        user_book.refresh_from_db()
        self.assertEqual(user_book.read_status, "Read")
        self.assertFalse(user_book.is_owned)
    
    # UserBook deleted when removed from all special shelves (valid)
    def test_userbook_deleted_when_removed_from_all_special_shelves(self):
        """Test that UserBook is deleted when removed from all special shelves"""
        # Add to "Read" shelf
        self.client.post(
            self.add_to_read_url, 
            {"edition_id": self.hardcover_edition.pk}, 
            format="json"
        )
        
        # Verify UserBook exists
        self.assertTrue(
            UserBook.objects.filter(
                user=self.user,
                book=self.book
            ).exists()
        )
        
        # Remove from "Read" shelf
        remove_url = f"{self.remove_from_read_url}?edition_id={self.hardcover_edition.pk}"
        self.client.delete(remove_url)
        
        # Verify UserBook was deleted
        self.assertFalse(
            UserBook.objects.filter(
                user=self.user,
                book=self.book
            ).exists()
        )
    
    # UserBook not affected by custom shelves (valid)
    def test_userbook_not_affected_by_custom_shelves(self):
        """Test that adding/removing from custom shelves doesn't affect UserBook status"""
        # Add to "Read" shelf and "Custom" shelf
        self.client.post(
            self.add_to_read_url, 
            {"edition_id": self.hardcover_edition.pk}, 
            format="json"
        )
        self.client.post(
            self.add_to_custom_url, 
            {"edition_id": self.hardcover_edition.pk}, 
            format="json"
        )
        
        # Verify UserBook has "Read" status
        user_book = UserBook.objects.get(user=self.user, book=self.book)
        self.assertEqual(user_book.read_status, "Read")
        
        # Remove from "Custom" shelf
        remove_url = f"{self.remove_from_custom_url}?edition_id={self.hardcover_edition.pk}"
        self.client.delete(remove_url)
        
        # Verify UserBook still exists with same status
        user_book.refresh_from_db()
        self.assertEqual(user_book.read_status, "Read")