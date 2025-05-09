import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EditionPage from '../app/edition/[isbn]/page';
import { useRouter } from 'next/navigation';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));

// Mock fetch API
global.fetch = jest.fn();

// Mock window.location.pathname
Object.defineProperty(window, 'location', {
  value: {
    pathname: '/edition/9781234567890'
  },
  writable: true
});

describe('EditionPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useRouter.mockReturnValue({
      push: jest.fn()
    });
  });

  test('displays loading state initially', () => {
    render(<EditionPage />);
    expect(screen.getByText(/Loading edition details/i)).toBeInTheDocument();
  });

  test('displays error when fetch fails', async () => {
    global.fetch.mockImplementation(() => 
      Promise.reject(new Error('Failed to fetch'))
    );

    render(<EditionPage />);

    await waitFor(() => {
      expect(screen.getByText(/Error Loading Edition/i)).toBeInTheDocument();
      expect(screen.getByText(/Failed to fetch/i)).toBeInTheDocument();
    });
  });

  test('displays edition details when fetch succeeds', async () => {
    // Mock successful fetch response
    const mockEditionData = {
      id: '1',
      isbn: '9781234567890',
      kind: 'Hardcover',
      publication_year: 2022,
      language: 'English',
      page_count: 320,
      abridged: false,
      book_info: {
        id: 'book123',
        title: 'Test Book Title',
        authors: [{ id: '1', name: 'Test Author' }],
        summary: 'A test book summary',
        genres: [{ id: '1', name: 'Fiction' }]
      },
      cover_image: 'https://example.com/cover.jpg',
      publisher_name: 'Test Publisher',
      other_editions: []
    };

    global.fetch.mockImplementation(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockEditionData)
      })
    );

    render(<EditionPage />);

    await waitFor(() => {
      // Check title with edition info is displayed
      expect(screen.getByText(/Test Book Title \(Hardcover Edition, 2022\)/i)).toBeInTheDocument();
      
      // Check parent book link exists
      expect(screen.getByText(/View main book page/i)).toBeInTheDocument();
      
      // Check edition details
      expect(screen.getByText('320')).toBeInTheDocument(); // Page count
      expect(screen.getByText('Hardcover')).toBeInTheDocument(); // Format
      expect(screen.getByText('English')).toBeInTheDocument(); // Language
      expect(screen.getByText('Test Publisher')).toBeInTheDocument(); // Publisher
      expect(screen.getByText('9781234567890')).toBeInTheDocument(); // ISBN
    });
  });
});