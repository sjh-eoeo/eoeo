export type Brand = string;

export interface VideoRecord {
  id: string;
  tiktokId: string;
  videoId: string;
  tiktokProfileUrl?: string;
  videoUrl?: string;
  uploadDate: string;
  brand: Brand;
  notes: string;
  videoFileName?: string;
  videoFilePath?: string;
  views?: number;
  likes?: number;
  gmvBoost?: {
    enabled: boolean;
    dailyBudget?: number; // KRW
    duration?: number; // days
  };
}

export interface Payment {
  id: string;
  tiktokId: string;
  brand: Brand;
  amount: number;
  paymentDate: string;
  invoiceFileName?: string;
  invoiceFilePath?: string;
}

export type PaymentCycle = 'weekly' | 'bi-weekly' | 'monthly';
export type PaymentMethod = 'bank-transfer' | 'paypal';

export interface ContractFile {
  fileName: string;
  filePath: string;
  uploadedAt: string;
}

export interface Profile {
  tiktokId: string;
  brand: Brand;
  tiktokProfileLink?: string;
  contractAmount: number;
  startDate: string;
  endDate: string;
  totalVideoCount: number;
  paymentCycle: PaymentCycle;
  numberOfPayments: number;
  paymentMethod?: PaymentMethod;
  paymentInfo?: string;
  shippingInfo?: Array<{
    carrier: string;
    trackingNumber: string;
    addedAt?: string; // ISO date string when tracking was added
  }>;
  shippingConfirmed?: boolean; // Whether shipping has been confirmed
  shippingConfirmedAt?: string; // ISO date string when confirmed
  // Legacy fields (deprecated)
  trackingNumber?: string;
  shippingCarrier?: string;
  contractFiles?: ContractFile[];
  // Legacy fields (deprecated)
  contractFileName?: string;
  contractFilePath?: string;
}

export type UserStatus = 'pending' | 'approved' | 'rejected';
export type UserRole = 'admin' | 'user' | 'finance';

export interface AppUser {
  uid: string;
  email: string | null;
  status: UserStatus;
  role: UserRole;
}

// Activity Log Types
export type ActivityAction = 
  | 'create'
  | 'update'
  | 'delete'
  | 'upload'
  | 'download'
  | 'approve'
  | 'reject';

export type ActivityCollection = 
  | 'videos'
  | 'profiles'
  | 'payments'
  | 'shipping'
  | 'users'
  | 'brands';

