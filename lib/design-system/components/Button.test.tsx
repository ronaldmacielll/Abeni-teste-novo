import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Button } from './Button';

/**
 * **Validates: Requirements 14.1, 14.2, 14.3, 14.4**
 * 
 * Tests for Button component covering:
 * - Rendering of all variants (primary, secondary, outline, ghost, danger)
 * - All sizes (sm, md, lg)
 * - User interactions (click, focus, keyboard)
 * - Disabled state
 * - Edge cases
 */
describe('Button Component', () => {
  describe('Rendering', () => {
    it('should render children correctly', () => {
      render(<Button>Click Me</Button>);
      expect(screen.getByText('Click Me')).toBeInTheDocument();
    });

    it('should render complex children (icons + text)', () => {
      render(
        <Button>
          <span>Icon</span>
          <span>Text</span>
        </Button>
      );
      expect(screen.getByText('Icon')).toBeInTheDocument();
      expect(screen.getByText('Text')).toBeInTheDocument();
    });

    it('should render as a button element', () => {
      render(<Button>Button</Button>);
      const button = screen.getByRole('button');
      expect(button.tagName).toBe('BUTTON');
    });

    it('should have base styles', () => {
      render(<Button>Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('inline-flex', 'items-center', 'justify-center', 'rounded-lg', 'font-medium', 'transition-colors', 'duration-200');
    });
  });

  describe('Variants', () => {
    it('should apply primary variant styles by default', () => {
      render(<Button>Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-primary-500', 'text-white', 'hover:bg-primary-600');
    });

    it('should apply secondary variant styles', () => {
      render(<Button variant="secondary">Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-secondary-500', 'text-white', 'hover:bg-secondary-600');
    });

    it('should apply outline variant styles', () => {
      render(<Button variant="outline">Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('border-2', 'border-primary-500', 'text-primary-500', 'hover:bg-primary-50');
    });

    it('should apply ghost variant styles', () => {
      render(<Button variant="ghost">Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-gray-700', 'hover:bg-gray-100');
    });

    it('should apply danger variant styles', () => {
      render(<Button variant="danger">Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-danger-main', 'text-white', 'hover:bg-danger-dark');
    });
  });

  describe('Sizes', () => {
    it('should apply small size styles', () => {
      render(<Button size="sm">Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-3', 'py-1.5', 'text-sm');
    });

    it('should apply medium size styles by default', () => {
      render(<Button>Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-4', 'py-2', 'text-base');
    });

    it('should apply large size styles', () => {
      render(<Button size="lg">Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-6', 'py-3', 'text-lg');
    });
  });

  describe('User Interactions', () => {
    it('should handle click events', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Button</Button>);
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple clicks', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Button</Button>);
      const button = screen.getByRole('button');
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(3);
    });

    it('should be focusable', () => {
      render(<Button>Button</Button>);
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });

    it('should handle keyboard events (Enter)', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Button</Button>);
      const button = screen.getByRole('button');
      button.focus();
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
      expect(handleClick).toHaveBeenCalled();
    });

    it('should handle keyboard events (Space)', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Button</Button>);
      const button = screen.getByRole('button');
      button.focus();
      fireEvent.keyDown(button, { key: ' ', code: 'Space' });
      expect(handleClick).toHaveBeenCalled();
    });
  });

  describe('Disabled State', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed');
    });

    it('should not trigger onClick when disabled', () => {
      const handleClick = jest.fn();
      render(<Button disabled onClick={handleClick}>Button</Button>);
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should not be focusable when disabled', () => {
      render(<Button disabled>Button</Button>);
      const button = screen.getByRole('button');
      button.focus();
      expect(button).not.toHaveFocus();
    });

    it('should apply disabled hover styles for each variant', () => {
      const variants: Array<'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'> = ['primary', 'secondary', 'outline', 'ghost', 'danger'];
      
      variants.forEach(variant => {
        const { unmount } = render(<Button variant={variant} disabled>Button</Button>);
        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
        unmount();
      });
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      render(<Button className="custom-class">Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('should merge custom className with base styles', () => {
      render(<Button className="custom-class">Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class', 'rounded-lg', 'font-medium');
    });
  });

  describe('Props Forwarding', () => {
    it('should forward standard button attributes', () => {
      render(<Button type="submit" name="submit-btn" aria-label="Submit form">Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
      expect(button).toHaveAttribute('name', 'submit-btn');
      expect(button).toHaveAttribute('aria-label', 'Submit form');
    });

    it('should forward data attributes', () => {
      render(<Button data-testid="custom-button" data-value="123">Button</Button>);
      const button = screen.getByTestId('custom-button');
      expect(button).toHaveAttribute('data-value', '123');
    });
  });

  describe('Edge Cases', () => {
    it('should handle all size and variant combinations', () => {
      const sizes: Array<'sm' | 'md' | 'lg'> = ['sm', 'md', 'lg'];
      const variants: Array<'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'> = ['primary', 'secondary', 'outline', 'ghost', 'danger'];
      
      sizes.forEach(size => {
        variants.forEach(variant => {
          const { unmount } = render(<Button size={size} variant={variant}>Button</Button>);
          const button = screen.getByRole('button');
          expect(button).toBeInTheDocument();
          unmount();
        });
      });
    });

    it('should render with empty string as children', () => {
      render(<Button></Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });
});
