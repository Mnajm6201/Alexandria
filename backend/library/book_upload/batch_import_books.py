#!/usr/bin/env python
import sys
import os
import pathlib
import time
from datetime import datetime
from import_book import import_book

def batch_import_books(file_path):
    """
    Import multiple books from a text file with one title per line.
    
    Args:
        file_path: Path to a text file containing book titles
    """
    # Verify file exists
    if not os.path.exists(file_path):
        print(f"Error: File '{file_path}' not found.")
        return False
    
    # Read book titles from file
    try:
        with open(file_path, 'r') as f:
            book_titles = [line.strip() for line in f if line.strip()]
    except Exception as e:
        print(f"Error reading file: {e}")
        return False
    
    print(f"Found {len(book_titles)} book titles to import")
    
    # Initialize counters
    successful = []
    failed = []
    
    # Create log directory if it doesn't exist
    log_dir = os.path.join(os.path.dirname(file_path), "import_logs")
    os.makedirs(log_dir, exist_ok=True)
    
    # Create log file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_file = os.path.join(log_dir, f"book_import_{timestamp}.log")
    
    # Process each book
    for i, title in enumerate(book_titles, 1):
        print(f"\n[{i}/{len(book_titles)}] Processing: '{title}'")
        
        # Log to file
        with open(log_file, 'a') as log:
            log.write(f"\n{'='*50}\n")
            log.write(f"[{i}/{len(book_titles)}] IMPORTING: {title}\n")
            log.write(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            log.write(f"{'='*50}\n")
        
        # Use the import_book function
        try:
            result = import_book(title)
            
            if result:
                successful.append(title)
                with open(log_file, 'a') as log:
                    log.write(f"SUCCESS: '{title}' imported successfully\n")
            else:
                failed.append(title)
                with open(log_file, 'a') as log:
                    log.write(f"FAILED: '{title}' import failed\n")
            
            # Short delay between imports to avoid overloading the API
            if i < len(book_titles):
                time.sleep(2)
                
        except Exception as e:
            print(f"Error importing '{title}': {e}")
            failed.append(title)
            with open(log_file, 'a') as log:
                log.write(f"ERROR: Exception while importing '{title}': {str(e)}\n")
    
    # Generate summary
    print("\n\n" + "="*50)
    print(f"IMPORT SUMMARY")
    print("="*50)
    print(f"Total books processed: {len(book_titles)}")
    print(f"Successfully imported: {len(successful)}")
    print(f"Failed imports: {len(failed)}")
    
    if failed:
        print("\nFailed books:")
        for title in failed:
            print(f" - {title}")
    
    # Write summary to log
    with open(log_file, 'a') as log:
        log.write("\n\n" + "="*50 + "\n")
        log.write(f"IMPORT SUMMARY\n")
        log.write("="*50 + "\n")
        log.write(f"Total books processed: {len(book_titles)}\n")
        log.write(f"Successfully imported: {len(successful)}\n")
        log.write(f"Failed imports: {len(failed)}\n")
        
        if failed:
            log.write("\nFailed books:\n")
            for title in failed:
                log.write(f" - {title}\n")
    
    print(f"\nLog file saved to: {log_file}")
    return len(failed) == 0

def main():
    """Main entry point for the batch import script."""
    if len(sys.argv) < 2:
        print("Usage: python batch_import_books.py book_titles.txt")
        sys.exit(1)
    
    file_path = sys.argv[1]
    success = batch_import_books(file_path)
    
    if not success:
        print("Batch import completed with some failures.")
        sys.exit(1)
    
    print("Batch import completed successfully!")

if __name__ == "__main__":
    main()