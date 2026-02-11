import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical'

export interface ErrorContext {
  [key: string]: any
}

/**
 * Log an error to the database
 * 
 * @param source - Where the error occurred (e.g., 'cron:purchase-numbers', 'api:recording')
 * @param error - The error object or message
 * @param context - Additional context (event_id, user_id, etc.)
 * @param severity - Error severity level
 */
export async function logError(
  source: string,
  error: Error | string,
  context?: ErrorContext,
  severity: ErrorSeverity = 'error'
): Promise<void> {
  try {
    const errorMessage = typeof error === 'string' ? error : error.message
    const errorStack = typeof error === 'string' ? undefined : error.stack
    
    // Log to database
    await supabase.from('error_logs').insert({
      source,
      error_message: errorMessage,
      error_stack: errorStack,
      context: context || null,
      severity
    })
    
    // Also log to console for immediate visibility
    console.error(`[${severity.toUpperCase()}] ${source}:`, errorMessage)
    if (context) {
      console.error('Context:', context)
    }
    
    // Send email for critical errors
    if (severity === 'critical') {
      await sendCriticalErrorEmail(source, errorMessage, context)
    }
    
  } catch (loggingError) {
    // Don't let logging errors break the application
    console.error('Failed to log error:', loggingError)
  }
}

/**
 * Send email notification for critical errors
 */
async function sendCriticalErrorEmail(
  source: string,
  error: string,
  context?: ErrorContext
): Promise<void> {
  try {
    // TODO: Implement email sending
    // For now, just log
    console.error('🚨 CRITICAL ERROR - Email notification needed:', {
      source,
      error,
      context
    })
    
    // Future: Use Resend, SendGrid, or Supabase Edge Functions
    // await fetch('/api/internal/send-error-email', {
    //   method: 'POST',
    //   body: JSON.stringify({ source, error, context })
    // })
  } catch (emailError) {
    console.error('Failed to send critical error email:', emailError)
  }
}

/**
 * Log info message (non-error events worth tracking)
 */
export async function logInfo(
  source: string,
  message: string,
  context?: ErrorContext
): Promise<void> {
  await logError(source, message, context, 'info')
}

/**
 * Log warning (potential issues, not critical)
 */
export async function logWarning(
  source: string,
  message: string,
  context?: ErrorContext
): Promise<void> {
  await logError(source, message, context, 'warning')
}

/**
 * Log critical error (requires immediate attention)
 */
export async function logCritical(
  source: string,
  error: Error | string,
  context?: ErrorContext
): Promise<void> {
  await logError(source, error, context, 'critical')
}

/**
 * Helper to wrap async functions with error logging
 */
export function withErrorLogging<T extends (...args: any[]) => Promise<any>>(
  source: string,
  fn: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args)
    } catch (error: any) {
      await logError(source, error)
      throw error // Re-throw so calling code can handle it
    }
  }) as T
}
