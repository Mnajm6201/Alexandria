/*
  Name: index.ts
  Date: 03/22/2025
  Description: Central export file that re-exports multiple book-related components for streamlined imports in other parts of the application. 
  The exported components include:

    - BookHeader: Displays book header information such as the cover image, title, authors, and interactive action buttons for updating read status, toggling ownership, and adding to a shelf.
    - BookSummary: Renders the book summary with conditional truncation and an expand/collapse toggle for longer texts.
    - BookDetails: Presents detailed book information including page count, publication date, ISBN, genres, and language, with conditional rendering based on provided data.
    - VendorLinks: Displays a responsive grid of vendor cards with logos, pricing, and format details, linking to external vendor sites.
    - LibraryAvailability: Shows a list of libraries with availability status, location-based features, and due dates, including a button to fetch the user's current location.
    - ReviewSection: Provides a comprehensive review interface allowing users to submit reviews with star ratings, view existing reviews with pagination, and see user details such as avatars and review dates.

  Notes:
    - This file aggregates and centralizes component exports for easier management and importation across the project.
*/
export { default as BookHeader } from './BookHeader'
export { default as BookSummary } from './BookSummary'
export { default as BookDetails } from './BookDetails'
export { default as VendorLinks } from './VendorLinks'
export { default as LibraryAvailability } from './LibraryAvailability'
export { default as ReviewSection } from './ReviewSection'