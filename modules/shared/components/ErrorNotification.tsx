'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, X, RefreshCw } from 'lucide-react';
import { colors } from '@/lib/design-system/colors';

export type ErrorType = 'auth' | 'network' | 'validation' | 'server';

export interface ErrorNotificationProps {
  message: string;
  type?: ErrorType;
  onRetry?: () => void;
  onClose?: () => void;
  autoClose?: boolean;
  autoCloseDuration?: number;
}

const errorTypeConfig: Record<ErrorType, { bgColor: string; textColor: string; iconColor: string }> = {
  auth: {
    bgColor: colors.warning.light,
    textColor: colors.warning.text,
    iconColor: colors.warning.main,
  },
  network: {
    bgColor: colors.info.light,
    textColor: colors.info.text,
    iconColor: colors.info.main,
  },
  validation: {
    bgColor: colors.warning.light,
    textColor: colors.warning.text,
    iconColor: colors.warning.main,
  },
  server: {
    bgColor: colors.danger.light,
    textColor: colors.danger.text,
    iconColor: colors.danger.main,
  },
};

export const ErrorNotification: React.FC<ErrorNotificationProps> = ({
  message,
  type = 'server',
  onRetry,
  onClose,
  autoClose = false,
  autoCloseDuration = 5000,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const config = errorTypeConfig[type];

  useEffect(() => {
    if (autoClose && autoCloseDuration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoCloseDuration);

      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDuration]);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  const handleRetry = () => {
    onRetry?.();
    handleClose();
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className="fixed top-4 right-4 z-50 w-full max-w-md animate-slide-in-right"
      role="alert"
      aria-live="assertive"
    >
      <div
        className="rounded-lg shadow-lg border"
        style={{
          backgroundColor: config.bgColor,
          borderColor: config.iconColor,
        }}
      >
        <div className="flex items-start gap-3 p-4">
          {/* Icon */}
          <div className="flex-shrink-0">
            <AlertCircle
              className="h-5 w-5"
              style={{ color: config.iconColor }}
              aria-hidden="true"
            />
          </div>

          {/* Message */}
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-medium"
              style={{ color: config.textColor }}
            >
              {message}
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            className="flex-shrink-0 rounded-md p-1 hover:bg-black/5 transition-colors"
            aria-label="Fechar notificação"
          >
            <X
              className="h-4 w-4"
              style={{ color: config.textColor }}
            />
          </button>
        </div>

        {/* Retry button */}
        {onRetry && (
          <div className="px-4 pb-4 pt-0">
            <button
              onClick={handleRetry}
              className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
              style={{
                backgroundColor: config.iconColor,
                color: '#ffffff',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Tentar Novamente
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Toast container for managing multiple notifications
export interface ToastNotification {
  id: string;
  message: string;
  type: ErrorType;
  onRetry?: () => void;
}

export interface ErrorToastContainerProps {
  notifications: ToastNotification[];
  onClose: (id: string) => void;
}

export const ErrorToastContainer: React.FC<ErrorToastContainerProps> = ({
  notifications,
  onClose,
}) => {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          className="pointer-events-auto"
          style={{
            animation: `slide-in-right 0.3s ease-out ${index * 0.1}s both`,
          }}
        >
          <ErrorNotification
            message={notification.message}
            type={notification.type}
            onRetry={notification.onRetry}
            onClose={() => onClose(notification.id)}
            autoClose={true}
            autoCloseDuration={5000}
          />
        </div>
      ))}
    </div>
  );
};
