/*
  Name: ItemCarousel.tsx
  Date: 03/22/2025
  Description: React component for displaying a carousel of items. This component accepts an array of items and renders them in a horizontally scrollable view. It prioritizes items with cover images by displaying them before those without, ensuring that visually-rich items are featured prominently.

  Input:
    - items: An array of objects conforming to the Item interface. Each item must have an 'id' and may optionally include a 'cover_image' along with other properties.
    - title (optional): A string to be displayed as the carousel's header. Defaults to "Items" if not provided.
    - onItemClick (optional): A callback function that gets triggered when an item is clicked. The function receives the clicked item as its argument.
    - renderItem (optional): A custom rendering function for individual items. If provided, it overrides the default rendering logic.

  Output:
    - A styled carousel component rendered as a card with a header and a horizontally scrollable section.
    - Each item is displayed as a clickable card. If an item has a cover image, it displays the image; otherwise, it shows a placeholder with the text "No cover".
    - Returns null if there are no items to display.

  Notes:
    - Utilizes Tailwind CSS for styling.
    - Employs lazy loading for images to improve performance.
    - Built as a generic component (using TypeScript generics) to accommodate various item types.
    - Designed to be used in client-side rendering environments.
*/
'use client'
import React from 'react'

interface Item {
  id: string
  isbn?: string // Added isbn property for edition items
  cover_image?: string
  [key: string]: any 
}

interface CarouselProps<T extends Item> {
  items: T[]
  title?: string
  onItemClick?: (item: T) => void // Updated to pass the entire item object
  renderItem?: (item: T) => React.ReactNode
  showBackground?: boolean // New prop to control background visibility
}

export default function ItemCarousel<T extends Item>({ 
  items = [], 
  title = "Items",
  onItemClick,
  renderItem,
  showBackground = false // Default to no background
}: CarouselProps<T>) {
  // Prioritize items with cover images
  const withImages = items.filter(item => item.cover_image)
  const withoutImages = items.filter(item => !item.cover_image)
  const orderedItems = [...withImages, ...withoutImages]

  if (!orderedItems.length) {
    return null
  }

  // Choose the appropriate container class based on showBackground prop
  const containerClass = showBackground 
    ? "bg-white rounded-lg shadow p-6" // Original style with background
    : ""; // No background or padding

  return (
    <div className={containerClass}>
      {title && <h2 className="text-xl font-semibold text-gray-900 mb-4">{title}</h2>}
      
      <div className="w-full overflow-x-auto">
        <div className="flex space-x-4 pb-4">
          {orderedItems.map((item) => (
            <div 
              key={item.id} 
              className="flex-shrink-0 w-48 cursor-pointer"
              onClick={() => onItemClick && onItemClick(item)}
            >
              {renderItem ? renderItem(item) : (
                item.cover_image ? (
                  <img
                    src={item.cover_image}
                    alt="Cover image"
                    className="w-full h-72 object-cover rounded-md shadow-lg"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-72 bg-gray-200 flex items-center justify-center rounded-md">
                    <span className="text-gray-500">No cover</span>
                  </div>
                )
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}