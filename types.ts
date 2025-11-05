export type Brand = string;

export interface VideoRecord {
  id: string;
  tiktokId: string;
  videoId: string;
  uploadDate: string;
  brand: Brand;
  notes: string;
  videoFileName?: string;
  videoFilePath?: string; // Path in Firebase Storage
}

export interface Payment {
  id:string;
  tiktokId: string;
  amount: number;
  paymentDate: string;
  invoiceFileName?: string;
  invoiceFilePath?: string; // Path in Firebase Storage
}

export interface Profile {
  tiktokId: string;
  tiktokProfileLink?: string;
  contractAmount: number;
  paymentWeek: number; 
  startDate: string; 
  contractFileName?: string;
  contractFilePath?: string; // Path in Firebase Storage
  lastPaymentDate?: string;
  paymentInfo?: string;
}

export type UserStatus = 'pending' | 'approved' | 'rejected';

export interface AppUser {
  uid: string;
  email: string | null;
  status: UserStatus;
  role: 'admin' | 'user';
}