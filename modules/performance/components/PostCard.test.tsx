/**
 * PostCard Component Tests
 * 
 * Tests for the PostCard component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PostCard } from './PostCard';
import type { Post } from '../types/post.types';

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

describe('PostCard Component', () => {
  const mockPost: Post = {
    id: '1',
    title: 'Test Post Title',
    imageUrl: 'https://example.com/image.jpg',
    status: 'Publicado',
    metrics: {
      alcance: 1234,
      engajamento: 567,
      impressoes: 8901,
      cliques: 123,
    },
    createdAt: '2024-01-15T10:00:00Z',
    publishedAt: '2024-01-15T10:00:00Z',
    clientId: 'client-123',
  };

  it('should render post card with all metrics', () => {
    render(<PostCard post={mockPost} />);

    // Check title
    expect(screen.getByText('Test Post Title')).toBeInTheDocument();

    // Check status badge
    expect(screen.getByText('Publicado')).toBeInTheDocument();

    // Check metrics labels
    expect(screen.getByText('Alcance')).toBeInTheDocument();
    expect(screen.getByText('Engajamento')).toBeInTheDocument();
    expect(screen.getByText('Impressões')).toBeInTheDocument();
    expect(screen.getByText('Cliques')).toBeInTheDocument();

    // Check formatted metric values
    expect(screen.getByText('1.234')).toBeInTheDocument(); // Alcance
    expect(screen.getByText('567')).toBeInTheDocument(); // Engajamento
    expect(screen.getByText('8.901')).toBeInTheDocument(); // Impressões
    expect(screen.getByText('123')).toBeInTheDocument(); // Cliques
  });

  it('should display correct badge variant for "Publicado" status', () => {
    render(<PostCard post={mockPost} />);
    
    const badge = screen.getByText('Publicado');
    expect(badge).toHaveClass('bg-success-light', 'text-success-text');
  });

  it('should display correct badge variant for "Agendado" status', () => {
    const scheduledPost = { ...mockPost, status: 'Agendado' as const };
    render(<PostCard post={scheduledPost} />);
    
    const badge = screen.getByText('Agendado');
    expect(badge).toHaveClass('bg-info-light', 'text-info-text');
  });

  it('should display correct badge variant for "Rascunho" status', () => {
    const draftPost = { ...mockPost, status: 'Rascunho' as const };
    render(<PostCard post={draftPost} />);
    
    const badge = screen.getByText('Rascunho');
    expect(badge).toHaveClass('bg-gray-100', 'text-gray-800');
  });

  it('should display correct badge variant for "Arquivado" status', () => {
    const archivedPost = { ...mockPost, status: 'Arquivado' as const };
    render(<PostCard post={archivedPost} />);
    
    const badge = screen.getByText('Arquivado');
    expect(badge).toHaveClass('bg-warning-light', 'text-warning-text');
  });

  it('should display fallback when imageUrl is null', () => {
    const postWithoutImage = { ...mockPost, imageUrl: null };
    render(<PostCard post={postWithoutImage} />);

    expect(screen.getByText('Sem imagem')).toBeInTheDocument();
  });

  it('should display fallback when image fails to load', () => {
    const onImageError = jest.fn();
    const { container } = render(<PostCard post={mockPost} onImageError={onImageError} />);

    // Simulate image error
    const img = container.querySelector('img');
    if (img) {
      img.dispatchEvent(new Event('error'));
    }

    expect(screen.getByText('Sem imagem')).toBeInTheDocument();
    expect(onImageError).toHaveBeenCalled();
  });

  it('should render without title when title is empty', () => {
    const postWithoutTitle = { ...mockPost, title: '' };
    render(<PostCard post={postWithoutTitle} />);

    // Title should not be rendered
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    
    // But metrics should still be visible
    expect(screen.getByText('Alcance')).toBeInTheDocument();
  });

  it('should format large numbers correctly', () => {
    const postWithLargeNumbers = {
      ...mockPost,
      metrics: {
        alcance: 1234567,
        engajamento: 987654,
        impressoes: 5432109,
        cliques: 123456,
      },
    };
    render(<PostCard post={postWithLargeNumbers} />);

    // Check formatted values with thousands separators
    expect(screen.getByText('1.234.567')).toBeInTheDocument();
    expect(screen.getByText('987.654')).toBeInTheDocument();
    expect(screen.getByText('5.432.109')).toBeInTheDocument();
    expect(screen.getByText('123.456')).toBeInTheDocument();
  });

  it('should handle zero values in metrics', () => {
    const postWithZeros = {
      ...mockPost,
      metrics: {
        alcance: 0,
        engajamento: 0,
        impressoes: 0,
        cliques: 0,
      },
    };
    render(<PostCard post={postWithZeros} />);

    // All zeros should be displayed
    const zeros = screen.getAllByText('0');
    expect(zeros).toHaveLength(4);
  });
});
