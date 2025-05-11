// src/components/ui/ThemeToggle.tsx
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
      style={{ 
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        fontSize: '1.75rem', // Make the emoji larger
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <span role="img" aria-label="Sun" style={{ fontSize: '1.75rem' }}>
          ☀️
        </span>
      ) : (
        <span role="img" aria-label="Moon" style={{ fontSize: '1.75rem' }}>
          🌙
        </span>
      )}
    </button>
  );
}