/**
 * 알림 시스템 유틸리티
 * 48시간 업데이트 체크, 새 댓글/Draft 알림
 * 참여자 기반 필터링
 * 프로젝트 초대 알림
 */

import type { Project } from '../../types/negotiation';
import type { Notification, ProjectInvitation } from '../../types/notification';

const INVITATIONS_STORAGE_KEY = 'project-invitations';
const NOTIFICATIONS_STORAGE_KEY = 'user-notifications';

/**
 * 현재 유저가 프로젝트 참여자인지 확인
 */
export function isProjectParticipant(
  project: Project, 
  userEmail: string,
  projectMetadata?: { id: string; participants: string[] }[]
): boolean {
  // 프로젝트 메타데이터가 있으면 그것을 사용
  if (projectMetadata) {
    const meta = projectMetadata.find(m => 
      m.id === project.category.projectName || 
      m.id.includes(project.category.projectName)
    );
    
    if (meta && meta.participants) {
      return meta.participants.includes(userEmail);
    }
  }
  
  // 프로젝트에 직접 할당된 경우
  if (project.assignedTo === userEmail) {
    return true;
  }
  
  // 기본적으로 모든 admin은 접근 가능
  return false;
}

/**
 * 유저에게 표시할 프로젝트 필터링
 */
export function filterProjectsForUser(
  projects: Project[],
  userEmail: string,
  userRole: 'admin' | 'user' | 'finance' | 'viewer',
  projectMetadata?: { id: string; participants: string[] }[]
): Project[] {
  // Admin은 모든 프로젝트 볼 수 있음
  if (userRole === 'admin') {
    return projects;
  }
  
  // 일반 유저는 참여중인 프로젝트만
  return projects.filter(project => 
    isProjectParticipant(project, userEmail, projectMetadata)
  );
}

/**
 * 48시간 이상 업데이트 없는지 체크
 */
export function needsAttention(project: Project): boolean {
  const now = new Date();
  const lastUpdate = new Date(project.lastUpdatedAt);
  const hoursDiff = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
  
  // 48시간 (2일) 이상
  const is48HoursOld = hoursDiff >= 48;
  
  // 완료/Drop된 프로젝트는 제외
  const isActive = ![
    'completed',
    'dropped-by-us',
    'rejected-by-creator',
    'published',
  ].includes(project.status);
  
  return is48HoursOld && isActive;
}

/**
 * 새 업데이트가 있는지 체크
 */
export function hasNewUpdates(project: Project): boolean {
  return project.unreadCommentCount > 0 || project.draftCount > 0;
}

/**
 * 알림 우선순위 계산
 */
export function getNotificationPriority(project: Project): 'high' | 'medium' | 'low' {
  if (needsAttention(project)) return 'high';
  if (hasNewUpdates(project)) return 'medium';
  return 'low';
}

/**
 * 알림 메시지 생성
 */
export function getNotificationMessage(project: Project): string {
  if (needsAttention(project)) {
    const hoursSince = Math.floor(
      (new Date().getTime() - new Date(project.lastUpdatedAt).getTime()) / (1000 * 60 * 60)
    );
    const daysSince = Math.floor(hoursSince / 24);
    return `${project.creatorName} - ${daysSince}일 동안 업데이트 없음`;
  }
  
  if (project.unreadCommentCount > 0) {
    return `${project.creatorName} - ${project.unreadCommentCount}개의 새 댓글`;
  }
  
  if (project.draftCount > 0) {
    return `${project.creatorName} - Draft v${project.latestDraftVersion} 제출됨`;
  }
  
  return `${project.creatorName}`;
}

/**
 * 프로젝트들의 알림 정리 (참여자 필터링 포함)
 */
export function getNotifications(
  projects: Project[],
  userEmail?: string,
  userRole?: 'admin' | 'user' | 'finance' | 'viewer',
  projectMetadata?: { id: string; participants: string[] }[]
) {
  // 유저 정보가 있으면 필터링
  let filteredProjects = projects;
  if (userEmail && userRole) {
    filteredProjects = filterProjectsForUser(projects, userEmail, userRole, projectMetadata);
  }
  
  const highPriority: Project[] = [];
  const mediumPriority: Project[] = [];
  
  filteredProjects.forEach((project) => {
    const priority = getNotificationPriority(project);
    if (priority === 'high') {
      highPriority.push(project);
    } else if (priority === 'medium') {
      mediumPriority.push(project);
    }
  });
  
  return {
    high: highPriority,
    medium: mediumPriority,
    total: highPriority.length + mediumPriority.length,
  };
}

/**
 * 알림 배지 카운트 (참여자 필터링 포함)
 */
export function getNotificationCount(
  projects: Project[],
  userEmail?: string,
  userRole?: 'admin' | 'user' | 'finance' | 'viewer',
  projectMetadata?: { id: string; participants: string[] }[]
): number {
  // 유저 정보가 있으면 필터링
  let filteredProjects = projects;
  if (userEmail && userRole) {
    filteredProjects = filterProjectsForUser(projects, userEmail, userRole, projectMetadata);
  }
  
  return filteredProjects.filter(
    (p) => needsAttention(p) || hasNewUpdates(p)
  ).length;
}

/**
 * 특정 댓글에 대해 알림을 받을 유저들 가져오기
 */
export function getNotificationRecipients(
  project: Project,
  projectMetadata?: { id: string; participants: string[] }[]
): string[] {
  const recipients: string[] = [];
  
  // 프로젝트 메타데이터에서 참여자 가져오기
  if (projectMetadata) {
    const meta = projectMetadata.find(m => 
      m.id === project.category.projectName || 
      m.id.includes(project.category.projectName)
    );
    
    if (meta && meta.participants) {
      recipients.push(...meta.participants);
    }
  }
  
  // 프로젝트 담당자도 포함
  if (project.assignedTo && !recipients.includes(project.assignedTo)) {
    recipients.push(project.assignedTo);
  }
  
  return [...new Set(recipients)]; // 중복 제거
}

/**
 * 유저가 특정 프로젝트의 알림을 받아야 하는지 확인
 */
export function shouldReceiveNotification(
  project: Project,
  userEmail: string,
  userRole: 'admin' | 'user' | 'finance' | 'viewer',
  projectMetadata?: { id: string; participants: string[] }[]
): boolean {
  // Admin은 모든 알림
  if (userRole === 'admin') {
    return true;
  }
  
  // 참여자만 알림 받음
  return isProjectParticipant(project, userEmail, projectMetadata);
}

/**
 * 프로젝트 초대 알림 생성
 */
export function createProjectInvitation(
  projectId: string,
  projectName: string,
  brand: string,
  invitedBy: string,
  invitedEmails: string[]
): void {
  const existingInvitations = getProjectInvitations();
  const now = new Date().toISOString();
  
  // 이메일 정규화 (소문자, 공백 제거)
  const normalizedEmails = invitedEmails.map(email => email.trim().toLowerCase());
  
  console.log('📧 Creating invitations for normalized emails:', normalizedEmails);
  
  const newInvitations: ProjectInvitation[] = normalizedEmails.map(email => ({
    notificationId: `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    projectId,
    projectName,
    brand,
    invitedBy,
    invitedAt: now,
    invitedEmail: email, // 이미 정규화된 이메일
    isRead: false,
  }));
  
  const updated = [...existingInvitations, ...newInvitations];
  localStorage.setItem(INVITATIONS_STORAGE_KEY, JSON.stringify(updated));
  
  console.log('💾 Saved invitations:', updated.map(inv => ({
    email: inv.invitedEmail,
    project: inv.projectName,
    isRead: inv.isRead
  })));
}

/**
 * 프로젝트 초대 알림 가져오기
 */
export function getProjectInvitations(userEmail?: string): ProjectInvitation[] {
  try {
    const saved = localStorage.getItem(INVITATIONS_STORAGE_KEY);
    if (!saved) {
      // console.log('📭 No invitations in storage');
      return [];
    }
    
    const invitations: ProjectInvitation[] = JSON.parse(saved);
    // console.log('📬 All invitations in storage:', invitations.length);
    
    // 특정 유저의 초대만 필터링
    if (userEmail) {
      // 이메일 정규화 (소문자, 공백 제거)
      const normalizedUserEmail = userEmail.trim().toLowerCase();
      // console.log('🔍 Filtering invitations for:', normalizedUserEmail);
      
      const filtered = invitations.filter(inv => {
        const normalizedInvEmail = inv.invitedEmail.trim().toLowerCase();
        const matches = normalizedInvEmail === normalizedUserEmail;
        
        // if (!matches) {
        //   console.log(`  ❌ "${normalizedInvEmail}" !== "${normalizedUserEmail}"`);
        // } else {
        //   console.log(`  ✅ Found invitation: ${inv.projectName}`);
        // }
        
        return matches;
      });
      
      // console.log(`📊 Found ${filtered.length} invitations for ${normalizedUserEmail}`);
      return filtered;
    }
    
    return invitations;
  } catch (error) {
    console.error('Failed to load project invitations:', error);
    return [];
  }
}

/**
 * 초대 알림 읽음 처리
 */
export function markInvitationAsRead(notificationId: string): void {
  const invitations = getProjectInvitations();
  const updated = invitations.map(inv =>
    inv.notificationId === notificationId ? { ...inv, isRead: true } : inv
  );
  localStorage.setItem(INVITATIONS_STORAGE_KEY, JSON.stringify(updated));
}

/**
 * 모든 알림 가져오기 (프로젝트 업데이트 + 초대)
 */
export function getAllNotifications(
  projects: Project[],
  userEmail?: string,
  userRole?: 'admin' | 'user' | 'finance' | 'viewer',
  projectMetadata?: { id: string; participants: string[] }[]
): Notification[] {
  // console.log('🔔 getAllNotifications called for:', userEmail);
  const notifications: Notification[] = [];
  
  // 1. 프로젝트 초대 알림
  if (userEmail) {
    const invitations = getProjectInvitations(userEmail);
    console.log(`📧 Creating ${invitations.length} invitation notifications`);
    
    invitations.forEach(inv => {
      notifications.push({
        id: inv.notificationId,
        type: 'project-invitation',
        title: '프로젝트 초대',
        message: `${inv.invitedBy}님이 "${inv.projectName}" 프로젝트에 초대했습니다`,
        timestamp: inv.invitedAt,
        isRead: inv.isRead,
        projectId: inv.projectId,
        projectName: inv.projectName,
        link: '/negotiation/notifications', // 초대 알림은 알림 페이지로만 이동
        priority: 'high',
        metadata: {
          invitedBy: inv.invitedBy,
        },
      });
    });
  }
  
  // 2. 프로젝트 업데이트 알림
  const { high, medium } = getNotifications(projects, userEmail, userRole, projectMetadata);
  
  // 긴급 알림 (48시간 이상)
  high.forEach(project => {
    notifications.push({
      id: `attention-${project.id}`,
      type: 'needs-attention',
      title: '업데이트 필요',
      message: getNotificationMessage(project),
      timestamp: project.lastUpdatedAt,
      isRead: false,
      projectId: project.id,
      projectName: project.category.projectName,
      creatorName: project.creatorName,
      link: getProjectLink(project.status),
      priority: 'high',
    });
  });
  
  // 새 업데이트 알림
  medium.forEach(project => {
    if (project.unreadCommentCount > 0) {
      notifications.push({
        id: `comment-${project.id}`,
        type: 'new-comment',
        title: '새 댓글',
        message: `${project.creatorName} - ${project.unreadCommentCount}개의 새 댓글`,
        timestamp: project.lastUpdatedAt,
        isRead: false,
        projectId: project.id,
        projectName: project.category.projectName,
        creatorName: project.creatorName,
        link: getProjectLink(project.status),
        priority: 'medium',
        metadata: {
          commentCount: project.unreadCommentCount,
        },
      });
    }
    
    if (project.draftCount > 0) {
      notifications.push({
        id: `draft-${project.id}`,
        type: 'draft-submitted',
        title: 'Draft 제출',
        message: `${project.creatorName} - Draft v${project.latestDraftVersion} 제출됨`,
        timestamp: project.lastUpdatedAt,
        isRead: false,
        projectId: project.id,
        projectName: project.category.projectName,
        creatorName: project.creatorName,
        link: getProjectLink(project.status),
        priority: 'medium',
        metadata: {
          draftVersion: project.latestDraftVersion,
        },
      });
    }
  });
  
  // 최신순 정렬
  return notifications.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

/**
 * 프로젝트 상태에 따른 링크 반환
 */
function getProjectLink(status: Project['status']): string {
  const routeMap: Record<string, string> = {
    'email-sent': '/negotiation/response-tracking',
    'response-received': '/negotiation/response-tracking',
    'negotiating': '/negotiation/negotiating',
    'agreed': '/negotiation/negotiating',
    'in-production': '/negotiation/draft-review',
    'draft-review': '/negotiation/draft-review',
    'published': '/negotiation/payment-pending',
    'payment-pending': '/negotiation/payment-pending',
    'completed': '/negotiation/completed',
    'rejected-by-creator': '/negotiation/dropped',
    'dropped-by-us': '/negotiation/dropped',
  };
  
  return routeMap[status] || '/negotiation';
}

/**
 * 읽지 않은 알림 개수 (초대 포함)
 */
export function getTotalNotificationCount(
  projects: Project[],
  userEmail?: string,
  userRole?: 'admin' | 'user' | 'finance' | 'viewer',
  projectMetadata?: { id: string; participants: string[] }[]
): number {
  let count = getNotificationCount(projects, userEmail, userRole, projectMetadata);
  
  // 초대 알림 추가
  if (userEmail) {
    const invitations = getProjectInvitations(userEmail);
    const unreadInvitations = invitations.filter(inv => !inv.isRead).length;
    count += unreadInvitations;
  }
  
  return count;
}
