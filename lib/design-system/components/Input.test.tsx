import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Input } from './Input';

/**
 * **Validates: Requirements 14.1, 14.2, 14.3, 14.4**
 * 
 * Tests for Input component covering:
 * - Rendering with different states (default, error, disabled)
 * - User interactions (change, focus, blur)
 * - Label and error message display
 * - Props forwarding and ref handling
 * - Edge cases
 */
describe('Input Component', () => {
  describe('Rendering', () => {
    it('should render input element', () => {
      render(<Input placeholder="Enter text" />);
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('should render label when provided', () => {
      render(<Input label="Username" />);
      expect(screen.getByText('Username')).toBeInTheDocument();
    });

    it('should render label with correct styling', () => {
      render(<Input label="Email" />);
      const label = screen.getByText('Email');
      expect(label).toHaveClass('block', 'text-sm', 'font-medium', 'text-gray-700', 'mb-1');
    });

    it('should render without label when not provided', () => {
      const { container } = render(<Input />);
      const label = container.querySelector('label');
      expect(label).not.toBeInTheDocument();
    });

    it('should render as an input element', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input.tagName).toBe('INPUT');
    });
  });

  describe('States - Default', () => {
    it('should apply default styles', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('w-full', 'rounded-lg', 'border', 'border-gray-300', 'bg-white');
    });

    it('should have focus styles', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('focus:ring-2', 'focus:ring-primary-500', 'focus:border-transparent');
    });

    it('should have transition styles', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('transition-colors', 'duration-200');
    });
  });

  describe('States - Error', () => {
    it('should apply error styles when error prop is true', () => {
      render(<Input error />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-danger-main', 'focus:ring-danger-main', 'focus:border-transparent');
    });

    it('should display error message when error and errorMessage are provided', () => {
      render(<Input error errorMessage="This field is required" />);
      const errorMsg = screen.getByText('This field is required');
      expect(errorMsg).toBeInTheDocument();
      expect(errorMsg).toHaveClass('mt-1', 'text-sm', 'text-danger-text');
    });

    it('should not display error message when error is false', () => {
      render(<Input error={false} errorMessage="This field is required" />);
      expect(screen.queryByText('This field is required')).not.toBeInTheDocument();
    });

    it('should not display error message when errorMessage is not provided', () => {
      const { container } = render(<Input error />);
      const errorMsg = container.querySelector('.text-danger-text');
      expect(errorMsg).not.toBeInTheDocument();
    });
  });

  describe('States - Disabled', () => {
    it('should apply disabled styles when disabled', () => {
      render(<Input disabled />);
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
      expect(input).toHaveClass('bg-gray-100', 'cursor-not-allowed');
    });

    it('should not be editable when disabled', () => {
      render(<Input disabled value="test" />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input).toBeDisabled();
      expect(input.value).toBe('test');
    });

    it('should not be focusable when disabled', () => {
      render(<Input disabled />);
      const input = screen.getByRole('textbox');
      input.focus();
      expect(input).not.toHaveFocus();
    });
  });

  describe('User Interactions', () => {
    it('should handle value changes', () => {
      const handleChange = jest.fn();
      render(<Input onChange={handleChange} />);
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'test value' } });
      expect(handleChange).toHaveBeenCalled();
    });

    it('should update value on change', () => {
      const { rerender } = render(<Input value="" onChange={() => {}} />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      
      rerender(<Input value="new value" onChange={() => {}} />);
      expect(input.value).toBe('new value');
    });

    it('should handle focus events', () => {
      const handleFocus = jest.fn();
      render(<Input onFocus={handleFocus} />);
      const input = screen.getByRole('textbox');
      fireEvent.focus(input);
      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it('should handle blur events', () => {
      const handleBlur = jest.fn();
      render(<Input onBlur={handleBlur} />);
      const input = screen.getByRole('textbox');
      fireEvent.blur(input);
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('should handle keyboard input', () => {
      render(<Input />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'typing test' } });
      expect(input.value).toBe('typing test');
    });

    it('should be focusable', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      input.focus();
      expect(input).toHaveFocus();
    });
  });

  describe('Props Forwarding', () => {
    it('should forward ref correctly', () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<Input ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });

    it('should accept standard input attributes', () => {
      render(<Input type="email" name="email" required />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'email');
      expect(input).toHaveAttribute('name', 'email');
      expect(input).toBeRequired();
    });

    it('should accept placeholder attribute', () => {
      render(<Input placeholder="Enter your email" />);
      const input = screen.getByPlaceholderText('Enter your email');
      expect(input).toHaveAttribute('placeholder', 'Enter your email');
    });

    it('should accept value and defaultValue', () => {
      const { rerender } = render(<Input defaultValue="default" />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.value).toBe('default');
      
      rerender(<Input value="controlled" onChange={() => {}} />);
      expect(input.value).toBe('controlled');
    });

    it('should accept maxLength attribute', () => {
      render(<Input maxLength={10} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('maxLength', '10');
    });

    it('should accept autoComplete attribute', () => {
      render(<Input autoComplete="email" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('autoComplete', 'email');
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      render(<Input className="custom-class" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('custom-class');
    });

    it('should merge custom className with base styles', () => {
      render(<Input className="custom-class" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('custom-class', 'w-full', 'rounded-lg', 'border');
    });
  });

  describe('Edge Cases', () => {
    it('should handle all states together', () => {
      render(<Input label="Test" error errorMessage="Error" disabled />);
      expect(screen.getByText('Test')).toBeInTheDocument();
      expect(screen.getByText('Error')).toBeInTheDocument();
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });

    it('should handle empty label', () => {
      render(<Input label="" />);
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });

    it('should handle empty errorMessage', () => {
      render(<Input error errorMessage="" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-danger-main');
    });

    it('should handle different input types', () => {
      const types = ['text', 'email', 'password', 'number', 'tel', 'url'];
      
      types.forEach(type => {
        const { unmount } = render(<Input type={type as any} />);
        const input = screen.getByRole(type === 'number' ? 'spinbutton' : 'textbox');
        expect(input).toHaveAttribute('type', type);
        unmount();
      });
    });

    it('should maintain wrapper structure', () => {
      const { container } = render(<Input label="Test" error errorMessage="Error" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('w-full');
      expect(wrapper.children.length).toBeGreaterThan(1);
    });
  });
});
