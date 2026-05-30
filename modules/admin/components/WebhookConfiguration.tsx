/**
 * WebhookConfiguration Component
 * 
 * Allows admins to enable/disable webhooks per account and displays webhook URL
 * Implements Requirements: 20.1, 20.6
 */

'use client';

import React, { useState } from 'react';
import { Card, Badge, Button } from '@/lib/design-system/components';
import { Copy, Check, AlertCircle, Loader } from 'lucide-react';
import { clsx } from 'clsx';

export interface WebhookConfigurationProps {
  accountId: string;
  accountName: string;
  webhooksEnabled: boolean;
  webhookUrl: string;
  onToggleWebhook?: (accountId: string, enabled: boolean) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

/**
 * WebhookConfiguration Component
 * 
 * Renders webhook configuration interface with:
 * - Toggle to enable/disable webhooks
 * - Display of webhook URL
 * - Copy to clipboard functionality
 * - Instructions for Instagram setup
 */
export const WebhookConfiguration: React.FC<WebhookConfigurationProps> = ({
  accountId,
  accountName,
  webhooksEnabled,
  webhookUrl,
  onToggleWebhook,
  isLoading = false,
  error = null,
}) => {
  const [copied, setCopied] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy webhook URL:', err);
    }
  };

  const handleToggleWebhook = async () => {
    if (!onToggleWebhook) return;

    setIsToggling(true);
    try {
      await onToggleWebhook(accountId, !webhooksEnabled);
    } catch (err) {
      console.error('Failed to toggle webhook:', err);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">
              Configuração de Webhooks
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              Conta: {accountName}
            </p>
          </div>
          <Badge variant={webhooksEnabled ? 'success' : 'warning'}>
            {webhooksEnabled ? 'Ativado' : 'Desativado'}
          </Badge>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-400">Erro</p>
              <p className="text-sm text-red-300 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Toggle Section */}
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">
                {webhooksEnabled ? 'Webhooks Ativados' : 'Webhooks Desativados'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {webhooksEnabled
                  ? 'Sincronização em tempo real está ativa'
                  : 'Apenas sincronização automática a cada 5 minutos'}
              </p>
            </div>
            <button
              onClick={handleToggleWebhook}
              disabled={isToggling || isLoading}
              className={clsx(
                'relative inline-flex h-8 w-14 items-center rounded-full transition-colors',
                webhooksEnabled
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-gray-600 hover:bg-gray-700',
                (isToggling || isLoading) && 'opacity-50 cursor-not-allowed'
              )}
            >
              <span
                className={clsx(
                  'inline-block h-6 w-6 transform rounded-full bg-white transition-transform',
                  webhooksEnabled ? 'translate-x-7' : 'translate-x-1'
                )}
              />
              {isToggling && (
                <Loader className="absolute w-4 h-4 animate-spin text-gray-800" />
              )}
            </button>
          </div>
        </div>

        {/* Webhook URL Section */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-white">
            URL do Webhook
          </label>
          <div className="flex gap-2">
            <div className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 flex items-center">
              <code className="text-xs text-gray-300 break-all font-mono">
                {webhookUrl}
              </code>
            </div>
            <button
              onClick={handleCopyUrl}
              className={clsx(
                'px-4 py-3 rounded-lg transition-colors flex items-center gap-2',
                copied
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
              )}
              title="Copiar URL"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span className="text-xs">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span className="text-xs">Copiar</span>
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-400">
            Use esta URL ao configurar webhooks no Instagram App Dashboard
          </p>
        </div>

        {/* Instructions */}
        {webhooksEnabled && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 space-y-3">
            <h4 className="text-sm font-medium text-blue-300">
              Como configurar webhooks no Instagram
            </h4>
            <ol className="text-xs text-blue-200 space-y-2 list-decimal list-inside">
              <li>Acesse o Instagram App Dashboard</li>
              <li>Vá para Configurações → Webhooks</li>
              <li>Clique em "Adicionar URL de Callback"</li>
              <li>Cole a URL acima no campo "Callback URL"</li>
              <li>Insira o token de verificação fornecido</li>
              <li>Clique em "Verificar e Salvar"</li>
              <li>Inscreva-se nos eventos que deseja receber (feed, comments, etc)</li>
            </ol>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <p className="text-xs text-gray-300">
            <strong>Nota:</strong> Webhooks permitem sincronização em tempo real quando posts são publicados ou editados. 
            Se desativados, a sincronização automática continuará funcionando a cada 5 minutos.
          </p>
        </div>
      </div>
    </Card>
  );
};
