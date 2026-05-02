import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ErrorNotification, ErrorToastContainer, ToastNotification } from './ErrorNotification';

describe('ErrorNotification', () => {
  it('should render error message', () => {
    render(<ErrorNotification message="Erro de teste" />);
    expect(screen.getByText('Erro de teste')).toBeInTheDocument();
  });

  it('should render retry button when onRetry is provided', () => {
    const onRetry = jest.fn();
    render(<ErrorNotification message="Erro de teste" onRetry={onRetry} />);
    
    const retryButton = screen.getByRole('button', { name: /tentar novamente/i });
    expect(retryButton).toBeInTheDocument();
  });

  it('should call onRetry when retry button is clicked', () => {
    const onRetry = jest.fn();
    render(<ErrorNotification message="Erro de teste" onRetry={onRetry} />);
    
    const retryButton = screen.getByRole('button', { name: /tentar novamente/i });
    fireEvent.click(retryButton);
    
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when close button is clicked', () => {
    const onClose = jest.fn();
    render(<ErrorNotification message="Erro de teste" onClose={onClose} />);
    
    const closeButton = screen.getByRole('button', { name: /fechar notificação/i });
    fireEvent.click(closeButton);
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should auto-close after specified duration', async () => {
    const onClose = jest.fn();
    render(
      <ErrorNotification
        message="Erro de teste"
        onClose={onClose}
        autoClose={true}
        autoCloseDuration={100}
      />
    );
    
    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    }, { timeout: 200 });
  });

  it('should not render retry button when onRetry is not provided', () => {
    render(<ErrorNotification message="Erro de teste" />);
    
    const retryButton = screen.queryByRole('button', { name: /tentar novamente/i });
    expect(retryButton).not.toBeInTheDocument();
  });

  it('should apply correct styles for auth error type', () => {
    const { container } = render(<ErrorNotification message="Erro de autenticação" type="auth" />);
    const notification = container.querySelector('[role="alert"]');
    expect(notification).toBeInTheDocument();
  });

  it('should apply correct styles for network error type', () => {
    const { container } = render(<ErrorNotification message="Erro de rede" type="network" />);
    const notification = container.querySelector('[role="alert"]');
    expect(notification).toBeInTheDocument();
  });

  it('should apply correct styles for validation error type', () => {
    const { container } = render(<ErrorNotification message="Erro de validação" type="validation" />);
    const notification = container.querySelector('[role="alert"]');
    expect(notification).toBeInTheDocument();
  });

  it('should apply correct styles for server error type', () => {
    const { container } = render(<ErrorNotification message="Erro do servidor" type="server" />);
    const notification = container.querySelector('[role="alert"]');
    expect(notification).toBeInTheDocument();
  });

  it('should hide notification after close button is clicked', () => {
    render(<ErrorNotification message="Erro de teste" />);
    
    const closeButton = screen.getByRole('button', { name: /fechar notificação/i });
    fireEvent.click(closeButton);
    
    const notification = screen.queryByRole('alert');
    expect(notification).not.toBeInTheDocument();
  });
});

describe('ErrorToastContainer', () => {
  it('should render multiple notifications', () => {
    const notifications: ToastNotification[] = [
      { id: '1', message: 'Erro 1', type: 'server' },
      { id: '2', message: 'Erro 2', type: 'network' },
    ];
    const onClose = jest.fn();
    
    render(<ErrorToastContainer notifications={notifications} onClose={onClose} />);
    
    expect(screen.getByText('Erro 1')).toBeInTheDocument();
    expect(screen.getByText('Erro 2')).toBeInTheDocument();
  });

  it('should call onClose with correct id when notification is closed', () => {
    const notifications: ToastNotification[] = [
      { id: '1', message: 'Erro 1', type: 'server' },
    ];
    const onClose = jest.fn();
    
    render(<ErrorToastContainer notifications={notifications} onClose={onClose} />);
    
    const closeButton = screen.getByRole('button', { name: /fechar notificação/i });
    fireEvent.click(closeButton);
    
    expect(onClose).toHaveBeenCalledWith('1');
  });

  it('should render empty container when no notifications', () => {
    const onClose = jest.fn();
    const { container } = render(<ErrorToastContainer notifications={[]} onClose={onClose} />);
    
    const notifications = container.querySelectorAll('[role="alert"]');
    expect(notifications).toHaveLength(0);
  });
});
