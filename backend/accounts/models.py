from django.db import models
from library.models import User, UserProfile, Shelf
from django.db.models.signals import post_save
from django.dispatch import receiver


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Create a UserProfile for every new user"""

    if created:
        UserProfile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """Save the UserProile when the User is saved"""
    try:
        # Try to get the profile
        profile = instance.related_user_profile
        profile.save()

    except UserProfile.DoesNotExist:
        UserProfile.objects.create(user=instance)

#  Signal handler to create default shelves
@receiver(post_save, sender=User)
def create_default_shelves(sender, instance, created, **kwargs):
    """Create default shelves for new users"""
    if created:
        # Create the four default shelf types
        default_shelves = [
            {"name": "Want to Read", "shelf_type": "Want to Read", "shelf_desc": "Books you want to read"},
            {"name": "Currently Reading", "shelf_type": "Reading", "shelf_desc": "Books you are currently reading"},
            {"name": "Read", "shelf_type": "Read", "shelf_desc": "Books you have already read"},
            {"name": "Owned", "shelf_type": "Owned", "shelf_desc": "Books you own"}
        ]
        
        for shelf_data in default_shelves:
            Shelf.objects.create(
                user=instance,
                name=shelf_data["name"],
                shelf_type=shelf_data["shelf_type"],
                shelf_desc=shelf_data["shelf_desc"],
                is_private=False
            )