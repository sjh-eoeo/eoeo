/**
 * TokAPI Integration
 * 
 * TikTok 사용자 정보를 가져오기 위한 RapidAPI (tokapi-mobile-version) 통합
 */

const RAPID_API_KEY = "e11796bc42mshaae0083c233b4a3p103901jsn35d206fe131c";
const RAPID_API_HOST = "tokapi-mobile-version.p.rapidapi.com";

export interface TikTokUserInfo {
  userId: string;
  uniqueId: string; // @username
  nickname: string;
  avatarUrl: string;
  signature: string;
  followers: number;
  following: number;
  likes: number;
  videos: number;
  verified: boolean;
}

/**
 * TikTok 프로필 링크에서 username 추출
 * 
 * @param profileLink - TikTok 프로필 링크 (예: https://www.tiktok.com/@username)
 * @returns username (@ 포함)
 */
export function extractUsernameFromLink(profileLink: string): string | null {
  try {
    // https://www.tiktok.com/@username
    // https://vm.tiktok.com/... (short link)
    const url = new URL(profileLink);
    const pathname = url.pathname;
    
    // /@username 형식 추출
    const match = pathname.match(/\/@([^\/]+)/);
    if (match && match[1]) {
      return `@${match[1]}`;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to parse TikTok link:', error);
    return null;
  }
}

/**
 * TikTok username으로 사용자 정보 가져오기
 * 
 * @param username - TikTok username (@ 포함 또는 제외)
 * @returns 사용자 정보
 */
export async function fetchTikTokUserInfo(username: string): Promise<TikTokUserInfo | null> {
  try {
    // @ 제거
    const cleanUsername = username.replace('@', '');
    
    const url = `https://${RAPID_API_HOST}/v1/user/info?username=${cleanUsername}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': RAPID_API_KEY,
        'X-RapidAPI-Host': RAPID_API_HOST,
      },
    });
    
    if (!response.ok) {
      throw new Error(`TokAPI request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // TokAPI 응답 구조에 맞게 파싱
    if (data && data.user) {
      const user = data.user;
      
      return {
        userId: user.id || '',
        uniqueId: user.uniqueId || cleanUsername,
        nickname: user.nickname || '',
        avatarUrl: user.avatarLarger || user.avatarMedium || '',
        signature: user.signature || '',
        followers: user.stats?.followerCount || 0,
        following: user.stats?.followingCount || 0,
        likes: user.stats?.heartCount || 0,
        videos: user.stats?.videoCount || 0,
        verified: user.verified || false,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Failed to fetch TikTok user info:', error);
    return null;
  }
}

/**
 * Post ID로 비디오 정보 가져오기 (10K 시스템에서 사용)
 * 
 * @param postId - TikTok 비디오 ID
 * @returns 비디오 정보
 */
export async function fetchTikTokVideoInfo(postId: string): Promise<any> {
  try {
    const url = `https://${RAPID_API_HOST}/v1/post?post_id=${postId}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': RAPID_API_KEY,
        'X-RapidAPI-Host': RAPID_API_HOST,
      },
    });
    
    if (!response.ok) {
      throw new Error(`TokAPI request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch TikTok video info:', error);
    return null;
  }
}

/**
 * 프로필 링크 유효성 검사
 */
export function isValidTikTokLink(link: string): boolean {
  try {
    const url = new URL(link);
    return (
      url.hostname.includes('tiktok.com') &&
      (url.pathname.startsWith('/@') || url.hostname.startsWith('vm.'))
    );
  } catch {
    return false;
  }
}
