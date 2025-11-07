import { ROUTES } from '../lib/constants/routes';
import type { UserRole } from '../types';
import type { AppProject } from '../store/useProjectSelector';

export interface NavItem {
  path: string;
  label: string;
  requiredRole?: UserRole[];
  project: AppProject; // 어느 프로젝트에 속하는지
}

// 10K 프로젝트 메뉴
export const NAV_ITEMS_10K: NavItem[] = [
  {
    path: '/10k/dashboard',
    label: 'Dashboard',
    project: '10k',
  },
  {
    path: '/10k/videos',
    label: 'Videos',
    project: '10k',
  },
  {
    path: '/10k/profiles',
    label: 'Profiles',
    project: '10k',
  },
  {
    path: '/10k/payments',
    label: 'Payments',
    project: '10k',
  },
  {
    path: '/10k/finance',
    label: 'Finance',
    requiredRole: ['admin', 'finance'],
    project: '10k',
  },
  {
    path: '/10k/docs',
    label: 'Docs',
    project: '10k',
  },
  {
    path: '/10k/settings',
    label: 'Settings',
    project: '10k',
  },
  {
    path: '/10k/admin',
    label: 'Admin',
    requiredRole: ['admin'],
    project: '10k',
  },
];

// Seeding System 메뉴
export const NAV_ITEMS_SEEDING: NavItem[] = [
  {
    path: '/seeding/dashboard',
    label: 'Dashboard',
    project: 'negotiation',
  },
  {
    path: '/seeding/creators',
    label: 'Creators',
    project: 'negotiation',
  },
  {
    path: '/seeding/projects',
    label: 'Projects',
    project: 'negotiation',
  },
  {
    path: '/seeding/reach-out',
    label: 'Reach Out',
    project: 'negotiation',
  },
  {
    path: '/seeding/negotiation',
    label: 'Negotiation',
    project: 'negotiation',
  },
  {
    path: '/seeding/production',
    label: 'Production',
    project: 'negotiation',
  },
  {
    path: '/seeding/payment',
    label: 'Payment',
    project: 'negotiation',
  },
  {
    path: '/seeding/finance',
    label: 'Finance',
    requiredRole: ['admin', 'finance'],
    project: 'negotiation',
  },
  {
    path: '/seeding/admin',
    label: 'Admin',
    requiredRole: ['admin'],
    project: 'negotiation',
  },
];

export function getVisibleNavItems(userRole: UserRole, project: AppProject): NavItem[] {
  const navItems = project === '10k' ? NAV_ITEMS_10K : NAV_ITEMS_SEEDING;
  return navItems.filter(item => {
    if (!item.requiredRole) return true;
    return item.requiredRole.includes(userRole);
  });
}
