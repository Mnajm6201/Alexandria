'use client'

import React from 'react'
import { BookOpen } from 'lucide-react'

interface CoverImageProps {
  src?: string
  alt: string
  width?: string | number
  height?: string | number
  className?: string
}

export default function CoverImage({ 
  src, 
  alt, 
  width = 'auto', 
  height = 'auto',
  className = '' 
}: CoverImageProps) {
  // Simplify styles calculation for better performance
  const containerStyles = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    aspectRatio: '0.667'
  }
  
  // Simple and direct rendering with minimal logic
  return (
    <div 
      style={containerStyles}
      className={`relative ${className}`}
    >
      {src ? (
        // Plain img tag with minimal attributes for maximum performance
        <img
          src={src}
          alt={alt}
          decoding="async"
          className="w-full h-full object-cover rounded-md shadow-md"
        />
      ) : (
        <div className="w-full h-full bg-gray-200 rounded-md shadow-md flex flex-col items-center justify-center">
          <BookOpen className="h-10 w-10 text-gray-400" />
          <span className="text-gray-500 text-xs">No cover</span>
        </div>
      )}
    </div>
  )
}