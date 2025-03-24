/*
  Name: ThemeToggle.tsx
  Date: 03/22/2025
  Description: React client component that provides a toggle button for switching between light and dark themes. 
  On mount, it retrieves the user's theme preference from localStorage (defaulting to "light" if not set) 
  and applies it by setting the "data-theme" attribute on the document's root element. When the button is clicked, 
  the theme toggles between "light" and "dark", updates localStorage, and adjusts the document's attribute accordingly.

  Input:
    - No external props are required.
    - localStorage: Reads the "theme" key to determine the user's preferred theme, defaulting to "light".

  Output:
    - Renders a fixed button at the top-right of the viewport.
    - Displays "🌙" when in light mode and "☀️" when in dark mode.
    - Updates the theme state, localStorage, and the document's "data-theme" attribute upon user interaction.
    - Returns null on the initial render until the component has mounted to prevent hydration mismatches.

  Notes:
    - Uses the "use client" directive to enforce client-side rendering.
    - Employs useEffect to handle client-side only operations.
    - Ensures a smooth user experience by preventing initial render issues related to server-client theme mismatches.
*/
'use client';

import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState('light');

  // Only run on client side
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  // Don't render anything until component is mounted to prevent hydration mismatch
  if (!mounted) return null;

  return (
    <button
      onClick={toggleTheme}
      className="fixed top-4 right-4 z-50 p-2 rounded-full bg-white dark:bg-gray-800 shadow-md"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}