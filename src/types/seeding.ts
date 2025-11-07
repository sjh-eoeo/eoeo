/**
 * Seeding System Types
 * 
 * 크리에이터 시딩 및 협상 관리를 위한 타입 정의
 */

// ===========================
// Creator Types
// ===========================

/**
 * 크리에이터 카테고리
 */
export type CreatorCategory =
  | '뷰티'
  | '헤어'
  | '푸드'
  | 'Health'
  | 'Diet'
  | 'Lifestyle'
  | 'Vlog'
  | '미분류';

/**
 * 크리에이터 정보
 * 
 * 업로드 형식:
 * - user id / profile link / email / followers / posts / likes / Reasonable Rate / Offer Rate / Category
 * 
 * 테이블 표시:
 * - user id / followers / Reasonable Rate
 * 
 * CSV 다운로드:
 * - user id / email / offer rate
 */
export interface Creator {
  id: string; // 자동 생성
  userId: string; // TikTok user id
  profileLink: string; // TikTok 프로필 링크
  email: string;
  followers: number;
  posts: number;
  likes: number;
  reasonableRate: number; // USD
  offerRate: number; // USD
  category?: CreatorCategory; // 크리에이터 카테고리
  
  // 메타데이터
  createdAt: string;
  updatedAt: string;
  
  // 필터링용
  country?: string;
  tags?: string[];
  notes?: string;
}

// ===========================
// Project Types
// ===========================

export type ProjectStatus = 
  | 'setup' // 프로젝트 생성 중
  | 'reach-out' // 크리에이터에게 연락 중
  | 'response-received' // 회신 받음
  | 'negotiating' // 협상 중
  | 'tracking-sent' // 운송장 발송됨
  | 'content-production' // 컨텐츠 제작 중
  | 'review' // 검토 중
  | 'payment-pending' // 결제 대기
  | 'completed' // 완료
  | 'dropped'; // 중단됨

/**
 * 브랜드 정보
 */
export interface Brand {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

/**
 * 이메일 템플릿
 */
export interface EmailTemplate {
  id: string;
  name: string; // 템플릿 이름 (예: "초기 연락", "후속 연락", "최종 확인")
  subject: string; // 이메일 제목
  body: string; // 이메일 본문
  createdAt: string;
  updatedAt: string;
}

/**
 * 프로젝트 정보
 */
export interface Project {
  id: string;
  name: string;
  brandId: string;
  brandName: string;
  status: ProjectStatus;
  
  // 크리에이터 목록
  selectedCreators: string[]; // Creator IDs
  
  // 담당자 목록
  assignees: string[]; // User emails
  
  // 이메일 템플릿 (최대 3개)
  emailTemplates?: EmailTemplate[];
  
  // 타임스탬프
  createdAt: string;
  updatedAt: string;
  
  // 추가 정보
  description?: string;
  notes?: string;
}

// ===========================
// Reach Out Types
// ===========================

export type ResponseStatus = 
  | 'pending' // 회신 대기
  | 'interested' // 관심 있음
  | 'declined'; // 거절

/**
 * 크리에이터에게 연락한 기록
 */
export interface ReachOut {
  id: string;
  projectId: string;
  creatorId: string;
  creatorUserId: string; // TikTok user id
  creatorEmail: string;
  
  status: ResponseStatus;
  responseDate?: string;
  
  // 메타데이터
  reachOutDate: string;
  updatedAt: string;
  notes?: string;
}

// ===========================
// Negotiation Types
// ===========================

/**
 * 협상 내용
 */
export interface NegotiationTerms {
  videoCount: number; // 제작할 영상 갯수
  amount: number; // 금액
  currency: string; // 화폐 (USD, KRW 등)
  uploadPlatforms: string[]; // 업로드 플랫폼 (TikTok, Instagram, YouTube 등)
  videoScript?: string; // 영상 스크립트
  sparkleCode?: string; // 스파클코드
  contractPeriod?: string; // 계약기간
  productionPeriod?: string; // 제작 기간
  contentReuseAllowed: boolean; // 컨텐츠 2차 가공 여부
  paymentMethod: string; // 결제 방식 (계좌, 페이팔 등)
  paymentDetails?: string; // 결제 상세 정보 (계좌번호, 페이팔 이메일 등)
}

/**
 * 채팅 메시지
 */
export interface ChatMessage {
  id: string;
  negotiationId: string;
  senderId: string; // User email
  senderName: string;
  message: string;
  timestamp: string;
}

/**
 * 협상 기록
 */
export interface Negotiation {
  id: string;
  projectId: string;
  creatorId: string;
  creatorUserId: string;
  creatorEmail: string;
  
  status: 'negotiating' | 'completed' | 'dropped';
  
  // 협상 내용
  terms?: NegotiationTerms;
  
  // 운송장 정보
  trackingNumber?: string;
  trackingDate?: string;
  
  // 채팅 히스토리
  messages: ChatMessage[];
  
  // 타임스탬프
  startedAt: string;
  completedAt?: string;
  updatedAt: string;
  
  notes?: string;
}

// ===========================
// Content Production Types
// ===========================

export type DraftStatus = 
  | 'pending' // 대기 중
  | 'uploaded' // 업로드됨
  | 'under-review' // 검토 중
  | 'revision-requested' // 수정 요청
  | 'approved'; // 승인됨

/**
 * 드래프트 영상
 */
export interface Draft {
  id: string;
  negotiationId: string;
  projectId: string;
  creatorId: string;
  
  // 파일 정보
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadedBy: string; // PH팀 이메일
  uploadedAt: string;
  
  status: DraftStatus;
  
  // 검토 댓글
  comments: ReviewComment[];
  
  // 승인 정보
  approvedBy?: string;
  approvedAt?: string;
  
  updatedAt: string;
}

/**
 * 검토 댓글
 */
export interface ReviewComment {
  id: string;
  draftId: string;
  userId: string; // 댓글 작성자 이메일
  userName: string;
  comment: string;
  timestamp: string;
}

// ===========================
// Payment Types
// ===========================

export type PaymentStatus = 
  | 'pending' // 결제 대기
  | 'processing' // 처리 중
  | 'completed' // 완료
  | 'failed'; // 실패

/**
 * 결제 정보
 */
export interface Payment {
  id: string;
  negotiationId: string;
  projectId: string;
  creatorId: string;
  creatorUserId: string;
  creatorEmail: string;
  
  // 협상된 결제 정보
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentDetails: string;
  
  // 실제 결제 정보
  paidAmount?: number;
  paidDate?: string;
  receiptUrl?: string; // 송금증 업로드
  
  status: PaymentStatus;
  
  // 타임스탬프
  createdAt: string;
  processedAt?: string;
  completedAt?: string;
  
  // 재무팀 확인
  financeApprovedBy?: string;
  financeApprovedAt?: string;
  
  notes?: string;
}

// ===========================
// User Types
// ===========================

export type UserRole = 
  | 'admin' // 전체 권한
  | 'ph-team' // PH팀 (드래프트 업로드)
  | 'hq-team' // 본사팀 (검토 및 승인)
  | 'finance'; // 재무팀 (결제 확인)

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

// ===========================
// CSV Export Types
// ===========================

/**
 * 크리에이터 CSV 다운로드 형식
 */
export interface CreatorCSVExport {
  userId: string;
  email: string;
  offerRate: number;
}

/**
 * 결제 CSV 다운로드 형식
 */
export interface PaymentCSVExport {
  projectName: string;
  creatorUserId: string;
  creatorEmail: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentDetails: string;
  status: PaymentStatus;
}
