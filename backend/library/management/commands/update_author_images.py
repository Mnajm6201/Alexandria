# backend/library/management/commands/update_author_images.py

from django.core.management.base import BaseCommand
from django.db import models
from library.models import Author
import requests
import time

class Command(BaseCommand):
    help = 'Updates author images with images from Wikipedia'

    def add_arguments(self, parser):
        parser.add_argument(
            '--batch-size',
            type=int,
            default=50,
            help='Number of authors to process per batch'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be updated without making changes'
        )
        parser.add_argument(
            '--force-all',
            action='store_true',
            help='Force update all authors, even those with existing images'
        )

    def get_wikipedia_image_for_author(self, author_name):
        """
        Attempts to find an image for an author using the Wikipedia API.
        """
        if not author_name or author_name == "Unknown Author":
            return None
            
        try:
            # Simple API call to get the image directly
            search_url = "https://en.wikipedia.org/w/api.php"
            params = {
                "action": "query",
                "format": "json",
                "prop": "pageimages",
                "titles": author_name,
                "piprop": "original",
                "pilimit": 1,
                "redirects": 1
            }
            
            response = requests.get(search_url, params=params, timeout=5)
            if response.status_code != 200:
                return None
                
            data = response.json()
            pages = data.get("query", {}).get("pages", {})
            
            # Get the first page (there should only be one)
            if pages:
                page_id = next(iter(pages))
                page = pages[page_id]
                if "original" in page:
                    return page["original"]["source"]
                    
            return None
            
        except Exception as e:
            self.stdout.write(self.style.WARNING(f"Error fetching image for {author_name}: {e}"))
            return None

    def handle(self, *args, **options):
        batch_size = options['batch_size']
        dry_run = options['dry_run']
        force_all = options['force_all']
        
        if dry_run:
            self.stdout.write(self.style.WARNING("Running in DRY RUN mode - no changes will be made"))
        
        # Get authors with no image or with bad images
        if force_all:
            authors = Author.objects.all()
            self.stdout.write(f"Processing ALL {authors.count()} authors")
        else:
            authors = Author.objects.filter(
                # Find authors with no image or openlibrary images
                models.Q(author_image__isnull=True) | 
                models.Q(author_image__exact='') |
                models.Q(author_image__contains='openlibrary.org')
            )
            self.stdout.write(f"Found {authors.count()} authors needing image updates")
        
        updated_count = 0
        failed_count = 0
        
        # Process in batches to avoid overloading
        for i in range(0, authors.count(), batch_size):
            batch = authors[i:i+batch_size]
            self.stdout.write(f"Processing batch {i//batch_size + 1}")
            
            for author in batch:
                self.stdout.write(f"Processing author: {author.name}")
                
                # Get Wikipedia image
                new_image_url = self.get_wikipedia_image_for_author(author.name)
                

                if new_image_url:
                    if dry_run:
                        self.stdout.write(self.style.SUCCESS(
                            f"[DRY RUN] Would update image for {author.name}: {new_image_url}"
                        ))
                    else:
                        # Check if URL is too long and handle it
                        if len(new_image_url) > 200:
                            self.stdout.write(self.style.WARNING(
                                f"URL for {author.name} is too long ({len(new_image_url)} chars), truncating or using alternate service"
                            ))
                            
                          
                            try:
                                import pyshorteners
                                shortener = pyshorteners.Shortener()
                                short_url = shortener.tinyurl.short(new_image_url)
                                author.author_image = short_url
                            except:
                                author.author_image = f"https://via.placeholder.com/150?text={author.name.replace(' ', '+')}"
                        else:
                            author.author_image = new_image_url
                            
                        author.save()
                        self.stdout.write(self.style.SUCCESS(
                            f"Updated image for {author.name}: {author.author_image}"
                        ))
                else:
                    # If no Wikipedia image found, use a placeholder
                    if not author.author_image or 'openlibrary.org' in author.author_image:
                        placeholder_url = f"https://via.placeholder.com/150?text={author.name.replace(' ', '+')}"
                        
                        if dry_run:
                            self.stdout.write(
                                f"[DRY RUN] Would set placeholder for {author.name}: {placeholder_url}"
                            )
                        else:
                            author.author_image = placeholder_url
                            author.save()
                            self.stdout.write(
                                f"Set placeholder for {author.name}: {placeholder_url}"
                            )
                    else:
                        self.stdout.write(self.style.WARNING(
                            f"Could not find Wikipedia image for {author.name}, keeping existing image"
                        ))
                    failed_count += 1
                
                # Small pause to avoid overwhelming the API
                time.sleep(0.5)
            
            # Larger pause between batches
            if i + batch_size < authors.count():
                self.stdout.write("Pausing between batches...")
                time.sleep(2)
        
        # Output summary
        self.stdout.write("\n" + "="*50)
        self.stdout.write("UPDATE SUMMARY")
        self.stdout.write("="*50)
        
        if dry_run:
            self.stdout.write(self.style.SUCCESS(f"[DRY RUN] Would have updated {updated_count} author images"))
            self.stdout.write(self.style.WARNING(f"[DRY RUN] Would have failed to find images for {failed_count} authors"))
        else:
            self.stdout.write(self.style.SUCCESS(f"Successfully updated {updated_count} author images"))
            self.stdout.write(self.style.WARNING(f"Failed to find images for {failed_count} authors"))