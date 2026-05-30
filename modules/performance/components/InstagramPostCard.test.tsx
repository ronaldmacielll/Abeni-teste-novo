/**
 * InstagramPostCard Component Tests
 * 
 * Tests for the InstagramPostCard component
 * Implements Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { InstagramPostCard } from './InstagramPostCard';
import type { Post } from '../types/post.types';

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

describe('InstagramPostCard', () => {
  const mockInstagramPost: Post = {
    id: 'ig-post-1',
    title: 'Test Instagram Post',
    imageUrl: 'https://example.com/image.jpg',
    status: 'Publicado',
    metrics: {
      alcance: 1500,
      engajamento: 250,
      impressoes: 2000,
      cliques: 150,
      likes: 200,
      comments: 50,
    },
    createdAt: '2024-01-15T10:00:00Z',
    publishedAt: '2024-01-15T10:00:00Z',
    clientId: 'client-1',
    source: 'instagram',
    instagramAccountName: 'Test Account',
    instagramAccountId: 'ig-account-1',
  };

  const mockClickUpPost: Post = {
    id: 'cu-post-1',
    title: 'Test ClickUp Post',
    imageUrl: 'https://example.com/image.jpg',
    status: 'Publicado',
    metrics: {
      alcance: 1000,
      engajamento: 200,
      impressoes: 1500,
      cliques: 100,
    },
    createdAt: '2024-01-15T10:00:00Z',
    publishedAt: '2024-01-15T10:00:00Z',
    clientId: 'client-1',
    source: 'clickup',
  };

  describe('Rendering', () => {
    it('should render Instagram post card with all metrics', () => {
      render(<InstagramPostCard post={mockInstagramPost} />);

      // Check for Instagram badge
      expect(screen.getByText('Instagram')).toBeInTheDocument();

      // Check for account name
      expect(screen.getByText(/Test Account/)).toBeInTheDocument();

      // Check for title
      expect(screen.getByText('Test Instagram Post')).toBeInTheDocument();

      // Check for all metrics
      expect(screen.getByText('Alcance')).toBeInTheDocument();
      expect(screen.getByText('Engajamento')).toBeInTheDocument();
      expect(screen.getByText('Impressões')).toBeInTheDocument();
      expect(screen.getByText('Cliques')).toBeInTheDocument();
      expect(screen.getByText('Likes')).toBeInTheDocument();
      expect(screen.getByText('Comentários')).toBeInTheDocument();
    });

    it('should not render ClickUp posts', () => {
      const { container } = render(<InstagramPostCard post={mockClickUpPost} />);
      expect(container.firstChild).toBeNull();
    });

    it('should display formatted metric values', () => {
      render(<InstagramPostCard post={mockInstagramPost} />);

      // Check for formatted numbers (Portuguese locale)
      expect(screen.getByText('1.500')).toBeInTheDocument(); // Alcance
      expect(screen.getByText('250')).toBeInTheDocument(); // Engajamento
      expect(screen.getByText('2.000')).toBeInTheDocument(); // Impressões
      expect(screen.getByText('150')).toBeInTheDocument(); // Cliques
      expect(screen.getByText('200')).toBeInTheDocument(); // Likes
      expect(screen.getByText('50')).toBeInTheDocument(); // Comments
    });

    it('should display fallback when image URL is missing', () => {
      const postWithoutImage = {
        ...mockInstagramPost,
        imageUrl: null,
      };

      render(<InstagramPostCard post={postWithoutImage} />);

      expect(screen.getByText('Sem imagem')).toBeInTheDocument();
    });

    it('should handle missing optional metrics', () => {
      const postWithoutOptionalMetrics = {
        ...mockInstagramPost,
        metrics: {
          alcance: 1500,
          engajamento: 250,
          impressoes: 2000,
          cliques: 150,
          // likes and comments are optional
        },
      };

      render(<InstagramPostCard post={postWithoutOptionalMetrics} />);

      // Should still render with default values
      expect(screen.getByText('Likes')).toBeInTheDocument();
      expect(screen.getByText('Comentários')).toBeInTheDocument();
    });

    it('should handle missing account name gracefully', () => {
      const postWithoutAccountName = {
        ...mockInstagramPost,
        instagramAccountName: undefined,
      };

      render(<InstagramPostCard post={postWithoutAccountName} />);

      // Should still render the card
      expect(screen.getByText('Test Instagram Post')).toBeInTheDocument();
      expect(screen.getByText('Instagram')).toBeInTheDocument();
    });
  });

  describe('Metrics Display', () => {
    it('should display all six metrics for Instagram posts', () => {
      render(<InstagramPostCard post={mockInstagramPost} />);

      const metricLabels = [
        'Alcance',
        'Engajamento',
        'Impressões',
        'Cliques',
        'Likes',
        'Comentários',
      ];

      metricLabels.forEach(label => {
        expect(screen.getByText(label)).toBeInTheDocument();
      });
    });

    it('should use correct icons for each metric', () => {
      const { container } = render(<InstagramPostCard post={mockInstagramPost} />);

      // Check that SVG icons are rendered (lucide-react icons)
      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThan(0);
    });

    it('should format large numbers with thousand separators', () => {
      const postWithLargeMetrics = {
        ...mockInstagramPost,
        metrics: {
          alcance: 1500000,
          engajamento: 250000,
          impressoes: 2000000,
          cliques: 150000,
          likes: 200000,
          comments: 50000,
        },
      };

      render(<InstagramPostCard post={postWithLargeMetrics} />);

      expect(screen.getByText('1.500.000')).toBeInTheDocument();
      expect(screen.getByText('250.000')).toBeInTheDocument();
      expect(screen.getByText('2.000.000')).toBeInTheDocument();
    });
  });

  describe('Image Handling', () => {
    it('should handle image error state', () => {
      const { container } = render(
        <InstagramPostCard post={mockInstagramPost} />
      );

      // Initially should have an img element
      const img = container.querySelector('img');
      expect(img).toBeInTheDocument();
    });

    it('should display fallback when image URL is null', () => {
      const postWithoutImage = {
        ...mockInstagramPost,
        imageUrl: null,
      };

      render(<InstagramPostCard post={postWithoutImage} />);

      // Should show fallback UI
      expect(screen.getByText('Sem imagem')).toBeInTheDocument();
    });
  });

  describe('Responsive Layout', () => {
    it('should render metrics in a grid layout', () => {
      const { container } = render(<InstagramPostCard post={mockInstagramPost} />);

      // Check for grid class
      const gridElement = container.querySelector('.grid');
      expect(gridElement).toBeInTheDocument();
      expect(gridElement).toHaveClass('grid-cols-2');
    });

    it('should have proper card structure', () => {
      const { container } = render(<InstagramPostCard post={mockInstagramPost} />);

      // Check for Card component wrapper
      const card = container.querySelector('[class*="rounded-2xl"]');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero metrics', () => {
      const postWithZeroMetrics = {
        ...mockInstagramPost,
        metrics: {
          alcance: 0,
          engajamento: 0,
          impressoes: 0,
          cliques: 0,
          likes: 0,
          comments: 0,
        },
      };

      render(<InstagramPostCard post={postWithZeroMetrics} />);

      // Check that metrics are displayed (all should be 0)
      expect(screen.getByText('Alcance')).toBeInTheDocument();
      expect(screen.getByText('Engajamento')).toBeInTheDocument();
    });

    it('should handle very long titles', () => {
      const postWithLongTitle = {
        ...mockInstagramPost,
        title: 'This is a very long Instagram post title that should be truncated to prevent layout issues and maintain the card design integrity',
      };

      render(<InstagramPostCard post={postWithLongTitle} />);

      const titleElement = screen.getByText(/This is a very long/);
      expect(titleElement).toHaveClass('line-clamp-2');
    });

    it('should handle missing title', () => {
      const postWithoutTitle = {
        ...mockInstagramPost,
        title: '',
      };

      render(<InstagramPostCard post={postWithoutTitle} />);

      // Should still render the card without errors
      expect(screen.getByText('Instagram')).toBeInTheDocument();
    });
  });
});
