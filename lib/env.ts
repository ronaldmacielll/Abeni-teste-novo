/**
 * Environment Configuration
 * 
 * Validates and exports environment variables
 */

function getEnvVar(key: string, required: boolean = true): string {
  const value = process.env[key]
  
  if (required && !value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  
  return value || ''
}

export const env = {
  clickup: {
    apiKey: getEnvVar('CLICKUP_API_KEY'),
    performanceListId: getEnvVar('CLICKUP_PERFORMANCE_LIST_ID'),
    financialListId: getEnvVar('CLICKUP_FINANCIAL_LIST_ID'),
    baseUrl: 'https://api.clickup.com/api/v2',
  },
  supabase: {
    url: getEnvVar('NEXT_PUBLIC_SUPABASE_URL'),
    anonKey: getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  },
  app: {
    baseUrl: getEnvVar('NEXT_PUBLIC_BASE_URL', false) || 'http://localhost:3000',
    environment: (process.env.NODE_ENV || 'development') as 'development' | 'staging' | 'production',
  },
  jwt: {
    secret: getEnvVar('JWT_SECRET'),
  },
} as const

export type EnvironmentConfig = typeof env
