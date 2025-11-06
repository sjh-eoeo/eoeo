import { ROUTES } from '../lib/constants/routes';
import type { UserRole } from '../types';

export interface NavItem {
  path: string;
  label: string;
  requiredRole?: UserRole[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    path: ROUTES.DASHBOARD,
    label: 'Dashboard',
  },
  {
    path: ROUTES.VIDEOS,
    label: 'Videos',
  },
  {
    path: ROUTES.PROFILES,
    label: 'Profiles',
  },
  {
    path: ROUTES.PAYMENTS,
    label: 'Payments',
  },
  {
    path: ROUTES.FINANCE,
    label: 'Finance',
    requiredRole: ['admin', 'finance'],
  },
  {
    path: ROUTES.DOCS,
    label: 'Docs',
  },
  {
    path: ROUTES.SETTINGS,
    label: 'Settings',
  },
  {
    path: ROUTES.ADMIN,
    label: 'Admin',
    requiredRole: ['admin'],
  },
];

export function getVisibleNavItems(userRole: UserRole): NavItem[] {
  return NAV_ITEMS.filter(item => {
    if (!item.requiredRole) return true;
    return item.requiredRole.includes(userRole);
  });
}
