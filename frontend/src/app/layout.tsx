import { Inter } from 'next/font/google';
import './globals.css';
import ThemeToggle from '@/components/ui/ThemeToggle';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.className}>
      <body className="antialiased">
        <ThemeToggle />
        {children}
      </body>
    </html>
  );
}