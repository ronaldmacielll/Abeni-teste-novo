import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Card } from './Card';

/**
 * **Validates: Requirements 14.1, 14.2, 14.3, 14.4**
 * 
 * Tests for Card component covering:
 * - Rendering of all variants (default, elevated, outlined)
 * - Hover state behavior
 * - Custom className application
 * - Edge cases
 */
describe('Card Component', () => {
  describe('Rendering', () => {
    it('should render children correctly', () => {
      render(<Card>Test Content</Card>);
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should render complex children (nested elements)', () => {
      render(
        <Card>
          <h2>Title</h2>
          <p>Description</p>
        </Card>
      );
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
    });

    it('should have base padding and border radius', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('rounded-lg', 'p-6');
    });
  });

  describe('Variants', () => {
    it('should apply default variant styles', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('bg-white', 'shadow-sm', 'border', 'border-gray-200');
    });

    it('should apply elevated variant styles', () => {
      const { container } = render(<Card variant="elevated">Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('bg-white', 'shadow-lg', 'border', 'border-gray-200');
    });

    it('should apply outlined variant styles', () => {
      const { container } = render(<Card variant="outlined">Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('bg-white', 'border-2', 'border-gray-300');
    });
  });

  describe('Hover State', () => {
    it('should apply hover styles when hover prop is true', () => {
      const { container } = render(<Card hover>Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('hover:shadow-md', 'transition-shadow', 'duration-200');
    });

    it('should not apply hover styles when hover prop is false', () => {
      const { container } = render(<Card hover={false}>Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).not.toHaveClass('hover:shadow-md');
    });

    it('should not apply hover styles by default', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).not.toHaveClass('hover:shadow-md');
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      const { container } = render(<Card className="custom-class">Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('custom-class');
    });

    it('should merge custom className with base styles', () => {
      const { container } = render(<Card className="custom-class">Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('custom-class', 'rounded-lg', 'p-6');
    });
  });

  describe('Edge Cases', () => {
    it('should render with empty children', () => {
      const { container } = render(<Card></Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('rounded-lg');
    });

    it('should handle all variants with hover enabled', () => {
      const variants: Array<'default' | 'elevated' | 'outlined'> = ['default', 'elevated', 'outlined'];
      
      variants.forEach(variant => {
        const { container } = render(<Card variant={variant} hover>Content</Card>);
        const card = container.firstChild as HTMLElement;
        expect(card).toHaveClass('hover:shadow-md');
      });
    });

    it('should render as a div element', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card.tagName).toBe('DIV');
    });
  });
});
