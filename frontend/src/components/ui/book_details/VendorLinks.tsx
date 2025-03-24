/*
  Name: VendorLinks.tsx
  Date: 03/22/2025
  Description: React client component that displays a grid of vendor links for purchasing a product. Each vendor card includes a logo (or a text fallback if no logo is provided), price, and format details, with links that open in a new tab.

  Input:
    - vendors (optional): An array of Vendor objects, where each object contains:
        - id: A unique identifier for the vendor.
        - name: The vendor's name.
        - url: A link to the vendor's website.
        - logo (optional): A URL to the vendor's logo image.
        - price (optional): The price offered by the vendor.
        - format (optional): The format or edition of the product.

  Output:
    - Renders a responsive grid of vendor cards with clickable links. Each card displays the vendor's logo or name, price, and format if available.

  Notes:
    - Uses Next.js Image component for optimized image handling.
    - Styled with Tailwind CSS for a modern and responsive UI.
*/
'use client'

import Image from 'next/image'

interface Vendor {
  id: string
  name: string
  url: string
  logo?: string
  price?: string
  format?: string
}

interface VendorLinksProps {
  vendors?: Vendor[]
}

export default function VendorLinks({ vendors = [] }: VendorLinksProps) {
  if (!vendors.length) {
    return null
  }
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Where to Buy</h2>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {vendors.map((vendor) => (
          <a
            key={vendor.id}
            href={vendor.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center p-3 border rounded-md hover:bg-gray-50 transition"
          >
            {vendor.logo ? (
              <div className="relative h-8 w-24 mb-2">
                <Image
                  src={vendor.logo}
                  alt={vendor.name}
                  fill
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="h-8 w-24 flex items-center justify-center mb-2">
                <span className="font-medium text-gray-900">{vendor.name}</span>
              </div>
            )}
            
            {vendor.price && (
              <span className="text-gray-900 font-medium">{vendor.price}</span>
            )}
            
            {vendor.format && (
              <span className="text-xs text-gray-500 mt-1">{vendor.format}</span>
            )}
          </a>
        ))}
      </div>
    </div>
  )
}