'use client'

import Image from 'next/image'

interface AuthorHeaderProps {
  name: string
  image?: string
}

export default function AuthorHeader({ name, image }: AuthorHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row items-center md:items-start bg-card rounded-lg shadow p-6">
      {/* Author image */}
      <div className="flex-shrink-0 w-full md:w-48 mb-4 md:mb-0">
        {image ? (
          <div className="relative w-40 h-40 md:w-48 md:h-48 mx-auto md:mx-0">
            <Image
              src={image}
              alt={name}
              fill
              className="object-cover rounded-full shadow-lg"
            />
          </div>
        ) : (
          <div className="bg-accent w-40 h-40 md:w-48 md:h-48 mx-auto md:mx-0 rounded-full shadow-lg flex items-center justify-center">
            <span className="text-3xl font-bold text-muted-foreground">
              {name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>
      
      {/* Author info */}
      <div className="md:ml-8 flex-1 text-center md:text-left">
        <h1 className="text-3xl md:text-4xl font-bold text-card-foreground">
          {name}
        </h1>
        
        <div className="mt-4 flex items-center text-foreground">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 mr-2" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" 
            />
          </svg>
          <span>Author</span>
        </div>
      </div>
    </div>
  )
}