/**
 * Tests for WebhookConfiguration Component
 * 
 * Tests rendering, user interactions, and webhook configuration display
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WebhookConfiguration } from './WebhookConfiguration'

describe('WebhookConfiguration Component', () => {
  const defaultProps = {
    accountId: 'test-account-123',
    accountName: 'Test Account',
    webhooksEnabled: false,
    webhookUrl: 'https://example.com/api/instagram/webhooks',
  }

  describe('Rendering', () => {
    it('should render webhook configuration interface', () => {
      render(<WebhookConfiguration {...defaultProps} />)

      expect(screen.getByText('Configuração de Webhooks')).toBeInTheDocument()
      expect(screen.getByText('Test Account')).toBeInTheDocument()
    })

    it('should display webhook status badge', () => {
      const { rerender } = render(
        <WebhookConfiguration {...defaultProps} webhooksEnabled={false} />
      )

      expect(screen.getByText('Desativado')).toBeInTheDocument()

      rerender(
        <WebhookConfiguration {...defaultProps} webhooksEnabled={true} />
      )

      expect(screen.getByText('Ativado')).toBeInTheDocument()
    })

    it('should display webhook URL', () => {
      render(<WebhookConfiguration {...defaultProps} />)

      expect(screen.getByText(defaultProps.webhookUrl)).toBeInTheDocument()
    })

    it('should display copy button', () => {
      render(<WebhookConfiguration {...defaultProps} />)

      expect(screen.getByTitle('Copiar URL')).toBeInTheDocument()
    })

    it('should display toggle button', () => {
      render(<WebhookConfiguration {...defaultProps} />)

      const toggleButton = screen.getByRole('button', { name: '' })
      expect(toggleButton).toBeInTheDocument()
    })

    it('should display instructions when webhooks are enabled', () => {
      render(<WebhookConfiguration {...defaultProps} webhooksEnabled={true} />)

      expect(screen.getByText('Como configurar webhooks no Instagram')).toBeInTheDocument()
      expect(screen.getByText(/Acesse o Instagram App Dashboard/)).toBeInTheDocument()
    })

    it('should not display instructions when webhooks are disabled', () => {
      render(<WebhookConfiguration {...defaultProps} webhooksEnabled={false} />)

      expect(screen.queryByText('Como configurar webhooks no Instagram')).not.toBeInTheDocument()
    })

    it('should display error message when provided', () => {
      const errorMessage = 'Failed to update webhook configuration'
      render(
        <WebhookConfiguration
          {...defaultProps}
          error={errorMessage}
        />
      )

      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
  })

  describe('Copy to Clipboard', () => {
    it('should copy webhook URL to clipboard', async () => {
      const user = userEvent.setup()
      const clipboardSpy = jest.spyOn(navigator.clipboard, 'writeText')

      render(<WebhookConfiguration {...defaultProps} />)

      const copyButton = screen.getByTitle('Copiar URL')
      await user.click(copyButton)

      expect(clipboardSpy).toHaveBeenCalledWith(defaultProps.webhookUrl)

      clipboardSpy.mockRestore()
    })

    it('should show "Copiado" feedback after copying', async () => {
      const user = userEvent.setup()
      jest.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined)

      render(<WebhookConfiguration {...defaultProps} />)

      const copyButton = screen.getByTitle('Copiar URL')
      await user.click(copyButton)

      await waitFor(() => {
        expect(screen.getByText('Copiado')).toBeInTheDocument()
      })
    })

    it('should revert "Copiado" feedback after 2 seconds', async () => {
      const user = userEvent.setup()
      jest.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined)
      jest.useFakeTimers()

      render(<WebhookConfiguration {...defaultProps} />)

      const copyButton = screen.getByTitle('Copiar URL')
      await user.click(copyButton)

      expect(screen.getByText('Copiado')).toBeInTheDocument()

      jest.advanceTimersByTime(2000)

      expect(screen.queryByText('Copiado')).not.toBeInTheDocument()

      jest.useRealTimers()
    })
  })

  describe('Toggle Webhook', () => {
    it('should call onToggleWebhook when toggle button is clicked', async () => {
      const user = userEvent.setup()
      const onToggleWebhook = jest.fn().mockResolvedValue(undefined)

      render(
        <WebhookConfiguration
          {...defaultProps}
          onToggleWebhook={onToggleWebhook}
        />
      )

      const toggleButton = screen.getAllByRole('button')[0]
      await user.click(toggleButton)

      expect(onToggleWebhook).toHaveBeenCalledWith(defaultProps.accountId, true)
    })

    it('should toggle from enabled to disabled', async () => {
      const user = userEvent.setup()
      const onToggleWebhook = jest.fn().mockResolvedValue(undefined)

      render(
        <WebhookConfiguration
          {...defaultProps}
          webhooksEnabled={true}
          onToggleWebhook={onToggleWebhook}
        />
      )

      const toggleButton = screen.getAllByRole('button')[0]
      await user.click(toggleButton)

      expect(onToggleWebhook).toHaveBeenCalledWith(defaultProps.accountId, false)
    })

    it('should disable toggle button while toggling', async () => {
      const user = userEvent.setup()
      const onToggleWebhook = jest.fn(
        () => new Promise(resolve => setTimeout(resolve, 100))
      )

      render(
        <WebhookConfiguration
          {...defaultProps}
          onToggleWebhook={onToggleWebhook}
        />
      )

      const toggleButton = screen.getAllByRole('button')[0]
      await user.click(toggleButton)

      expect(toggleButton).toBeDisabled()
    })

    it('should disable toggle button when isLoading is true', () => {
      render(
        <WebhookConfiguration
          {...defaultProps}
          isLoading={true}
        />
      )

      const toggleButton = screen.getAllByRole('button')[0]
      expect(toggleButton).toBeDisabled()
    })

    it('should handle toggle errors gracefully', async () => {
      const user = userEvent.setup()
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      const onToggleWebhook = jest.fn().mockRejectedValue(new Error('Toggle failed'))

      render(
        <WebhookConfiguration
          {...defaultProps}
          onToggleWebhook={onToggleWebhook}
        />
      )

      const toggleButton = screen.getAllByRole('button')[0]
      await user.click(toggleButton)

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to toggle webhook:',
          expect.any(Error)
        )
      })

      consoleErrorSpy.mockRestore()
    })
  })

  describe('Status Messages', () => {
    it('should display "Webhooks Ativados" when enabled', () => {
      render(<WebhookConfiguration {...defaultProps} webhooksEnabled={true} />)

      expect(screen.getByText('Webhooks Ativados')).toBeInTheDocument()
      expect(screen.getByText('Sincronização em tempo real está ativa')).toBeInTheDocument()
    })

    it('should display "Webhooks Desativados" when disabled', () => {
      render(<WebhookConfiguration {...defaultProps} webhooksEnabled={false} />)

      expect(screen.getByText('Webhooks Desativados')).toBeInTheDocument()
      expect(screen.getByText('Apenas sincronização automática a cada 5 minutos')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper button titles', () => {
      render(<WebhookConfiguration {...defaultProps} />)

      expect(screen.getByTitle('Copiar URL')).toBeInTheDocument()
    })

    it('should have proper labels', () => {
      render(<WebhookConfiguration {...defaultProps} />)

      expect(screen.getByText('URL do Webhook')).toBeInTheDocument()
    })
  })
})
