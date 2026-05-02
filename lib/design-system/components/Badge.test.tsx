import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Badge } from './Badge';

/**
 * **Validates: Requirements 14.1, 14.2, 14.3, 14.4**
 * 
 * Tests for Badge component covering:
 * - Rendering of all variants (success, warning, danger, info, neutral)
 * - Custom className application
 * - Edge cases
 */
describe('Badge Component', () => {
  describe('Rendering', () => {
    it('should render children correctly', () => {
      render(<Badge>Success</Badge>);
      expect(screen.getByText('Success')).toBeInTheDocument();
    });

    it('should render text content', () => {
      render(<Badge>Active</Badge>);
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('should render numeric content', () => {
      render(<Badge>42</Badge>);
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('should render as a span element', () => {
      const { container } = render(<Badge>Badge</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge.tagName).toBe('SPAN');
    });

    it('should have base styles', () => {
      const { container } = render(<Badge>Badge</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('inline-flex', 'items-center', 'px-2.5', 'py-0.5', 'rounded-full', 'text-xs', 'font-medium');
    });
  });

  describe('Variants', () => {
    it('should apply neutral variant styles by default', () => {
      const { container } = render(<Badge>Badge</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('bg-gray-100', 'text-gray-800');
    });

    it('should apply success variant styles', () => {
      const { container } = render(<Badge variant="success">Success</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('bg-success-light', 'text-success-text');
    });

    it('should apply warning variant styles', () => {
      const { container } = render(<Badge variant="warning">Warning</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('bg-warning-light', 'text-warning-text');
    });

    it('should apply danger variant styles', () => {
      const { container } = render(<Badge variant="danger">Danger</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('bg-danger-light', 'text-danger-text');
    });

    it('should apply info variant styles', () => {
      const { container } = render(<Badge variant="info">Info</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('bg-info-light', 'text-info-text');
    });

    it('should apply neutral variant styles explicitly', () => {
      const { container } = render(<Badge variant="neutral">Neutral</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('bg-gray-100', 'text-gray-800');
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      const { container } = render(<Badge className="custom-class">Badge</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('custom-class');
    });

    it('should merge custom className with base styles', () => {
      const { container } = render(<Badge className="custom-class">Badge</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('custom-class', 'inline-flex', 'rounded-full', 'text-xs');
    });

    it('should allow custom className to override styles', () => {
      const { container } = render(<Badge className="text-lg">Badge</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('text-lg');
    });
  });

  describe('Edge Cases', () => {
    it('should render with empty children', () => {
      const { container } = render(<Badge></Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('inline-flex');
    });

    it('should render with complex children', () => {
      render(
        <Badge>
          <span>Icon</span>
          <span>Text</span>
        </Badge>
      );
      expect(screen.getByText('Icon')).toBeInTheDocument();
      expect(screen.getByText('Text')).toBeInTheDocument();
    });

    it('should handle all variants with custom className', () => {
      const variants: Array<'success' | 'warning' | 'danger' | 'info' | 'neutral'> = ['success', 'warning', 'danger', 'info', 'neutral'];
      
      variants.forEach(variant => {
        const { container, unmount } = render(<Badge variant={variant} className="custom">Badge</Badge>);
        const badge = container.firstChild as HTMLElement;
        expect(badge).toHaveClass('custom');
        unmount();
      });
    });

    it('should render with very long text', () => {
      const longText = 'This is a very long badge text that might wrap';
      render(<Badge>{longText}</Badge>);
      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it('should render with special characters', () => {
      render(<Badge>Status: ✓ Active!</Badge>);
      expect(screen.getByText('Status: ✓ Active!')).toBeInTheDocument();
    });

    it('should maintain inline-flex display for proper alignment', () => {
      const { container } = render(<Badge>Badge</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('inline-flex', 'items-center');
    });

    it('should have consistent padding across all variants', () => {
      const variants: Array<'success' | 'warning' | 'danger' | 'info' | 'neutral'> = ['success', 'warning', 'danger', 'info', 'neutral'];
      
      variants.forEach(variant => {
        const { container, unmount } = render(<Badge variant={variant}>Badge</Badge>);
        const badge = container.firstChild as HTMLElement;
        expect(badge).toHaveClass('px-2.5', 'py-0.5');
        unmount();
      });
    });

    it('should render with zero as children', () => {
      render(<Badge>0</Badge>);
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should render with boolean-like strings', () => {
      render(<Badge>true</Badge>);
      expect(screen.getByText('true')).toBeInTheDocument();
    });
  });
});
