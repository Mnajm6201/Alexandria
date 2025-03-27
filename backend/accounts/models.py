from django.db import models
from library.models import User, UserProfile
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

        