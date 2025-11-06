export const ROUTES = {
  DASHBOARD: '/',
  VIDEOS: '/videos',
  PROFILES: '/profiles',
  PAYMENTS: '/payments',
  FINANCE: '/finance',
  DOCS: '/docs',
  SETTINGS: '/settings',
  ADMIN: '/admin',
} as const;

export type RouteKey = keyof typeof ROUTES;
