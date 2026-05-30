/**
 * Structured Logger for Instagram Integration
 * Provides consistent logging across all services
 */

import { LOGGING_CONFIG } from '@/lib/config/instagram.config'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogContext {
  [key: string]: any
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: LogContext
  error?: {
    message: string
    stack?: string
    code?: string
  }
}

class Logger {
  private level: LogLevel
  private debugMode: boolean

  constructor(level: LogLevel = 'info', debugMode: boolean = false) {
    this.level = level
    this.debugMode = debugMode
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error']
    const currentIndex = levels.indexOf(this.level)
    const messageIndex = levels.indexOf(level)
    return messageIndex >= currentIndex
  }

  private formatEntry(entry: LogEntry): string {
    const parts: string[] = []

    if (LOGGING_CONFIG.INCLUDE_TIMESTAMPS) {
      parts.push(`[${entry.timestamp}]`)
    }

    parts.push(`[${entry.level.toUpperCase()}]`)
    parts.push(entry.message)

    if (LOGGING_CONFIG.INCLUDE_CONTEXT && entry.context && Object.keys(entry.context).length > 0) {
      parts.push(JSON.stringify(entry.context))
    }

    if (entry.error) {
      parts.push(`Error: ${entry.error.message}`)
      if (this.debugMode && entry.error.stack) {
        parts.push(`Stack: ${entry.error.stack}`)
      }
    }

    return parts.join(' ')
  }

  private createEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error: error
        ? {
            message: error.message,
            stack: error.stack,
            code: (error as any).code,
          }
        : undefined,
    }
  }

  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog('debug')) return

    const entry = this.createEntry('debug', message, context)
    console.debug(this.formatEntry(entry))
  }

  info(message: string, context?: LogContext): void {
    if (!this.shouldLog('info')) return

    const entry = this.createEntry('info', message, context)
    console.log(this.formatEntry(entry))
  }

  warn(message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog('warn')) return

    const entry = this.createEntry('warn', message, context, error)
    console.warn(this.formatEntry(entry))
  }

  error(message: string, error?: Error, context?: LogContext): void {
    if (!this.shouldLog('error')) return

    const entry = this.createEntry('error', message, context, error)
    console.error(this.formatEntry(entry))
  }

  setLevel(level: LogLevel): void {
    this.level = level
  }

  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled
  }
}

// Create singleton instance
export const logger = new Logger(LOGGING_CONFIG.LEVEL, LOGGING_CONFIG.DEBUG_MODE)

// Export for testing
export { Logger }
