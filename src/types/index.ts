export type Brand = string;

export interface VideoRecord {
  id: string;
  tiktokId: string;
  videoId: string;
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
  amount: number;
  paymentDate: string;
  invoiceFileName?: string;
  invoiceFilePath?: string;
}

export type PaymentCycle = 'weekly' | 'bi-weekly' | 'monthly';

export interface ContractFile {
  fileName: string;
  filePath: string;
  uploadedAt: string;
}

export interface Profile {
  tiktokId: string;
  tiktokProfileLink?: string;
  contractAmount: number;
  startDate: string;
  endDate: string;
  totalVideoCount: number;
  paymentCycle: PaymentCycle;
  numberOfPayments: number;
  paymentInfo?: string;
  contractFiles?: ContractFile[];
  // Legacy fields (deprecated)
  contractFileName?: string;
  contractFilePath?: string;
}

export type UserStatus = 'pending' | 'approved' | 'rejected';
export type UserRole = 'admin' | 'user';

export interface AppUser {
  uid: string;
  email: string | null;
  status: UserStatus;
  role: UserRole;
}
