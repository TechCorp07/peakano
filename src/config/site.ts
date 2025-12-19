/**
 * Site-wide configuration
 * Values come from environment variables with fallbacks
 */
export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || 'Medical Imaging Training Platform',
  description: 'Train to annotate medical images with AI-powered assistance',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8010',
  
  // Feature flags
  features: {
    aiAssistant: process.env.NEXT_PUBLIC_ENABLE_AI_ASSISTANT === 'true',
    collaboration: process.env.NEXT_PUBLIC_ENABLE_COLLABORATION === 'true',
  },
  
  // Auth settings
  auth: {
    tokenKey: 'auth_token',
    refreshKey: 'refresh_token',
    userKey: 'user',
  },
} as const;
