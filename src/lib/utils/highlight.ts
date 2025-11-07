/**
 * Recent Update Highlight Utility
 * 
 * 최근 업데이트된 항목을 시각적으로 표시하기 위한 유틸리티
 */

/**
 * 특정 시간 이내에 업데이트되었는지 확인
 * @param updatedAt - ISO 타임스탬프
 * @param minutes - 비교할 분 단위 (기본: 5분)
 */
export function isRecentlyUpdated(updatedAt: string, minutes: number = 5): boolean {
  if (!updatedAt) return false;
  
  try {
    const updatedTime = new Date(updatedAt).getTime();
    const now = Date.now();
    const diffMinutes = (now - updatedTime) / (1000 * 60);
    
    return diffMinutes <= minutes;
  } catch (error) {
    console.error('Error parsing updatedAt:', error);
    return false;
  }
}

/**
 * 마지막으로 본 이후에 업데이트되었는지 확인
 * @param updatedAt - ISO 타임스탬프
 * @param lastViewedAt - 마지막으로 본 시간
 */
export function isUpdatedSinceLastView(updatedAt: string, lastViewedAt: string | undefined): boolean {
  if (!updatedAt || !lastViewedAt) return false;
  
  try {
    const updatedTime = new Date(updatedAt).getTime();
    const lastViewedTime = new Date(lastViewedAt).getTime();
    
    return updatedTime > lastViewedTime;
  } catch (error) {
    console.error('Error parsing timestamps:', error);
    return false;
  }
}

/**
 * 사용자가 해당 항목의 담당자인지 확인
 * @param assignees - 담당자 이메일 배열
 * @param userEmail - 현재 사용자 이메일
 */
export function isAssignedToUser(assignees: string[] | undefined, userEmail: string | undefined): boolean {
  if (!assignees || !userEmail) return false;
  return assignees.includes(userEmail);
}

/**
 * 최근 업데이트 하이라이트 클래스명 반환
 * @param itemId - 항목 ID
 * @param updatedAt - ISO 타임스탬프
 * @param assignees - 담당자 이메일 배열
 * @param userEmail - 현재 사용자 이메일
 * @param lastViewedAt - 마지막으로 본 시간
 * @param minutes - 비교할 분 단위 (기본: 5분)
 */
export function getRecentUpdateClass(
  itemId: string,
  updatedAt: string,
  assignees: string[] | undefined,
  userEmail: string | undefined,
  lastViewedAt: string | undefined,
  minutes: number = 5
): string {
  // 담당자가 아니면 하이라이트 안함
  if (!isAssignedToUser(assignees, userEmail)) {
    return '';
  }
  
  // 최근 업데이트되지 않았으면 하이라이트 안함
  if (!isRecentlyUpdated(updatedAt, minutes)) {
    return '';
  }
  
  // 마지막으로 본 이후 업데이트되었으면 하이라이트
  if (!lastViewedAt || isUpdatedSinceLastView(updatedAt, lastViewedAt)) {
    return 'bg-yellow-500/15 cursor-pointer hover:bg-yellow-500/25 transition-colors';
  }
  
  return '';
}

/**
 * 새로운 업데이트 뱃지 표시 여부
 */
export function shouldShowNewBadge(
  updatedAt: string,
  assignees: string[] | undefined,
  userEmail: string | undefined,
  lastViewedAt: string | undefined,
  minutes: number = 5
): boolean {
  return (
    isAssignedToUser(assignees, userEmail) && 
    isRecentlyUpdated(updatedAt, minutes) &&
    (!lastViewedAt || isUpdatedSinceLastView(updatedAt, lastViewedAt))
  );
}
