#!/usr/bin/env python
import sys
import os
import pathlib
import traceback

# Get the current directory
SCRIPT_DIR = pathlib.Path(__file__).parent.absolute()

def import_book(title):
    """
    Wrapper Script to search Open Library for book data by title,
    and upload data to database.
    
    Args:
        title: The title of the book to search for and import
    """
    print(f"Starting import process for book: '{title}'")
    
    # Step 1: Fetch data from Open Library API
    print("\n=== FETCHING DATA FROM OPEN LIBRARY API ===")
    fetcher_script = os.path.join(SCRIPT_DIR, 'openlibrary_fetcher.py')
    
    # Run the script directly and display any error output
    try:
        sys.path.insert(0, str(SCRIPT_DIR))
        import openlibrary_fetcher
        orig_argv = sys.argv.copy()
        sys.argv = [fetcher_script, title]
        openlibrary_fetcher.main()
        sys.argv = orig_argv
    except Exception as e:
        print(f"Error fetching data: {e}")
        traceback.print_exc()
        return False
    
    # Check if the required files were created
    required_files = []
    for filename in ['work_data.json', 'editions_data.json', 'authors_data.json']:
        file_path = os.path.join(SCRIPT_DIR, filename)
        required_files.append(file_path)
        if not os.path.exists(file_path):
            print(f"Error: Required file '{filename}' was not created!")
            return False
    
    # Step 2: Upload data to Django database
    print("\n=== UPLOADING DATA TO DJANGO DATABASE ===")
    try:
        import openlibrary_uploader
        orig_argv = sys.argv.copy()
        sys.argv = ['openlibrary_uploader.py'] + required_files
        openlibrary_uploader.main()
        sys.argv = orig_argv
    except Exception as e:
        print(f"Error uploading data: {e}")
        traceback.print_exc()
        return False
    
    print("\n=== IMPORT COMPLETED SUCCESSFULLY ===")
    return True

def main():
    """Main entry point for the wrapper script."""
    if len(sys.argv) < 2:
        print("Usage: python import_book.py 'Book Title'")
        sys.exit(1)
    
    title = sys.argv[1]
    success = import_book(title)
    
    if not success:
        print("Import process failed!")
        sys.exit(1)
    
    print(f"Book '{title}' has been successfully imported into the database.")
    print("All editions, authors, and covers have been added.")

if __name__ == "__main__":
    main()