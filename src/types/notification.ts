/**
 * 알림 타입 정의
 */

export type NotificationType = 
  | 'project-invitation'  // 프로젝트 초대
  | 'new-comment'         // 새 댓글
  | 'draft-submitted'     // Draft 제출
  | 'status-changed'      // 상태 변경
  | 'payment-ready'       // 결제 준비
  | 'needs-attention';    // 48시간 이상 업데이트 없음

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  projectId?: string;
  projectName?: string;
  creatorName?: string;
  link?: string;
  priority: 'high' | 'medium' | 'low';
  metadata?: {
    invitedBy?: string;
    commentCount?: number;
    draftVersion?: number;
    oldStatus?: string;
    newStatus?: string;
  };
}

export interface ProjectInvitation {
  notificationId: string;
  projectId: string;
  projectName: string;
  brand: string;
  invitedBy: string;
  invitedAt: string;
  invitedEmail: string;
  isRead: boolean;
}
