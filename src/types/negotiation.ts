// 협상테이블 타입 정의

export interface Creator {
  id: string;
  userId: string;              // TikTok user ID (@username)
  profileLink: string;         // TikTok 프로필 링크
  email: string;
  followers: number;           // 팔로워 수
  posts: number;               // 게시물 수
  likes: number;               // 총 좋아요 수
  reasonableRate: number;      // 적정 단가 (USD)
  offerRate: number;           // 제안 단가 (USD)
  
  // 필터링용 메타데이터
  country?: string;
  tags?: string[];             // 카테고리, 특성
  notes?: string;
  blacklisted?: boolean;
  
  // 통계 (자동 계산)
  stats?: {
    totalProjects: number;
    completedProjects: number;
    activeProjects: number;
    droppedProjects: number;
    totalEarnings: number;
    lastProjectDate?: string;
  };
  
  createdAt: string;
  updatedAt: string;
}

export interface ProjectCategory {
  brand: 'egongegong' | 'eoeo' | '10k' | 'other';
  projectName: string;      // "크리스마스 캠페인 2024"
  productLine?: string;      // "선크림", "립스틱", "파운데이션"
  region?: string;           // "US", "EU", "Asia"
  campaignType?: string;     // "신제품 론칭", "시즌 프로모션"
}

export type ProjectStatus = 
  // 진행 단계
  | 'email-sent'           // 메일 발송
  | 'response-received'    // 회신 도착
  | 'negotiating'          // 협상 중
  | 'agreed'               // 합의 완료
  | 'in-production'        // 제작 중
  | 'draft-review'         // Draft 리뷰
  | 'published'            // 게시 완료
  | 'payment-pending'      // 결제 대기
  | 'completed'            // ✅ 완료
  // 종료 단계
  | 'rejected-by-creator'  // ❌ 크리에이터가 거절
  | 'dropped-by-us';       // ❌ 우리가 Drop

export interface NegotiationHistory {
  date: string;
  from: 'ph-team' | 'hq' | 'creator';
  message: string;
  userId?: string;
  userName?: string;
}

export interface InitialOffer {
  amount: number;
  currency: 'KRW' | 'USD';
  videoCount: number;
  conditions: string;
}

export interface Agreement {
  finalAmount: number;
  currency: 'KRW' | 'USD';
  videoCount: number;
  uploadRequirements: string; // "틱톡, 해시태그 #ABC"
  contractPeriod: {
    start: string;
    end: string;
  };
  sparkCodeExpiry?: string;
  paymentMethod: 'PayPal' | 'Bank Transfer' | 'Other';
  paymentInfo: string; // "choi@email.com" or "국민 123-456"
  specialTerms?: string;
}

export interface PublishedVideo {
  platform: 'tiktok' | 'instagram' | 'youtube';
  url: string;
  publishedAt: string;
  views?: number;
  likes?: number;
  comments?: number;
}

export interface PaymentInfo {
  amount: number;
  currency: 'KRW' | 'USD';
  method: string;
  info: string;
  invoiceFilePath?: string; // 송금증
  paid: boolean;
  paidAt?: string;
}

export interface TerminationInfo {
  terminatedBy: 'creator' | 'company';
  reasons: string[]; // 다중 선택 가능
  customReason?: string;
  terminatedAt: string;
  terminatedByUserId?: string;
  terminatedByUserName?: string;
}

export interface Project {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorEmail: string;
  
  // 카테고리 (필터링용)
  category: ProjectCategory;
  
  // 계약 타입
  contractType: 'single-video' | 'multi-video';
  
  // 상태
  status: ProjectStatus;
  
  // ─────────────────────────────────
  // Phase 1: 메일 & 회신
  // ─────────────────────────────────
  emailSent: boolean;
  emailSentAt?: string;
  responseReceived: boolean;
  responseAt?: string;
  responseType?: 'interested' | 'rejected' | 'negotiating';
  
  // 알림용
  lastUpdatedAt: string;
  needsAttention: boolean; // 48시간 업데이트 없으면 true
  
  // ─────────────────────────────────
  // Phase 2: 협상
  // ─────────────────────────────────
  negotiationHistory: NegotiationHistory[];
  initialOffer: InitialOffer;
  agreement?: Agreement;
  agreedAt?: string;
  
  // ─────────────────────────────────
  // Phase 3: 제작 & Draft
  // ─────────────────────────────────
  draftCount: number;
  latestDraftVersion?: number;
  
  // ─────────────────────────────────
  // Phase 4: 게시
  // ─────────────────────────────────
  publishedVideos: PublishedVideo[];
  
  // ─────────────────────────────────
  // Phase 5: 결제
  // ─────────────────────────────────
  payment?: PaymentInfo;
  
  // ─────────────────────────────────
  // Drop/Reject
  // ─────────────────────────────────
  terminationInfo?: TerminationInfo;
  
  // 담당자
  assignedTo: string; // user ID
  assignedToName: string;
  teamLocation: 'korea' | 'overseas';
  
  // 댓글
  unreadCommentCount: number;
  lastCommentAt?: string;
  
  // 메타
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface ProjectDraft {
  id: string;
  projectId: string;
  version: number;
  videoFilePath: string;
  thumbnailPath?: string;
  uploadedBy: string; // user ID
  uploadedByName: string;
  uploadedAt: string;
  
  // 리뷰
  reviewStatus: 'pending' | 'approved' | 'revision-requested' | 'rejected';
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  
  fileSize?: number;
  duration?: number;
}

export interface ProjectComment {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  userTeam: 'ph-team' | 'hq';
  userRole?: string;
  message: string;
  attachments?: Array<{
    fileName: string;
    filePath: string;
    fileType: string;
  }>;
  mentions?: string[]; // @user IDs
  timestamp: string;
  isRead: boolean;
  isEdited: boolean;
  editedAt?: string;
}

export interface ProjectActivity {
  id: string;
  projectId: string;
  action: string; // "상태 변경", "금액 수정", "Draft 업로드" 등
  description: string;
  oldValue?: any;
  newValue?: any;
  userId: string;
  userName: string;
  timestamp: string;
}

// 필터 타입
export interface ProjectFilter {
  brand?: string[];
  projectName?: string[];
  productLine?: string[];
  region?: string[];
  status?: ProjectStatus[];
  assignedTo?: string[];
  teamLocation?: 'korea' | 'overseas' | 'all';
  dateRange?: {
    start: string;
    end: string;
  };
  includeDropped?: boolean;
  searchQuery?: string;
}

// 통계 타입
export interface ProjectStats {
  total: number;
  byStatus: Record<ProjectStatus, number>;
  byBrand: Record<string, number>;
  byProject: Record<string, number>;
  byProduct: Record<string, number>;
  totalBudget: number;
  totalPaid: number;
  averageResponseTime: number; // 시간 단위
  dropRate: number; // 퍼센트
}

// Drop 사유 옵션
export const DROP_REASONS = [
  'budget-exceeded',
  'low-follower-count',
  'content-quality-concern',
  'slow-response',
  'misaligned-values',
  'other',
] as const;

export type DropReason = typeof DROP_REASONS[number];

export const DROP_REASON_LABELS: Record<DropReason, string> = {
  'budget-exceeded': '예산 초과',
  'low-follower-count': '팔로워 수 부족',
  'content-quality-concern': '콘텐츠 품질 우려',
  'slow-response': '응답 지연',
  'misaligned-values': '브랜드 가치 불일치',
  'other': '기타',
};
