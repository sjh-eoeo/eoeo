/**
 * URL 파싱 유틸리티
 * TikTok, Instagram, YouTube 링크를 자동으로 인식하고 플랫폼 구분
 */

export type SocialPlatform = 'tiktok' | 'instagram' | 'youtube';

export interface ParsedUrl {
  platform: SocialPlatform;
  url: string;
  videoId?: string;
}

/**
 * URL에서 플랫폼 감지
 */
export function detectPlatform(url: string): SocialPlatform | null {
  const lowerUrl = url.toLowerCase();
  
  if (lowerUrl.includes('tiktok.com') || lowerUrl.includes('vt.tiktok.com')) {
    return 'tiktok';
  }
  if (lowerUrl.includes('instagram.com') || lowerUrl.includes('instagr.am')) {
    return 'instagram';
  }
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
    return 'youtube';
  }
  
  return null;
}

/**
 * TikTok 비디오 ID 추출
 */
function extractTikTokId(url: string): string | undefined {
  // https://www.tiktok.com/@username/video/1234567890
  // https://vt.tiktok.com/ZS1234567/
  const match = url.match(/\/video\/(\d+)/) || url.match(/\/([A-Za-z0-9_-]+)\/?$/);
  return match?.[1];
}

/**
 * Instagram 비디오 ID 추출
 */
function extractInstagramId(url: string): string | undefined {
  // https://www.instagram.com/p/ABC123/
  // https://www.instagram.com/reel/ABC123/
  const match = url.match(/\/(p|reel)\/([A-Za-z0-9_-]+)/);
  return match?.[2];
}

/**
 * YouTube 비디오 ID 추출
 */
function extractYouTubeId(url: string): string | undefined {
  // https://www.youtube.com/watch?v=VIDEO_ID
  // https://youtu.be/VIDEO_ID
  const match = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?]+)/);
  return match?.[1];
}

/**
 * URL 파싱 (단일)
 */
export function parseUrl(url: string): ParsedUrl | null {
  const trimmedUrl = url.trim();
  if (!trimmedUrl) return null;
  
  const platform = detectPlatform(trimmedUrl);
  if (!platform) return null;
  
  let videoId: string | undefined;
  
  switch (platform) {
    case 'tiktok':
      videoId = extractTikTokId(trimmedUrl);
      break;
    case 'instagram':
      videoId = extractInstagramId(trimmedUrl);
      break;
    case 'youtube':
      videoId = extractYouTubeId(trimmedUrl);
      break;
  }
  
  return {
    platform,
    url: trimmedUrl,
    videoId,
  };
}

/**
 * 여러 URL 파싱 (줄바꿈, 쉼표, 공백으로 구분)
 */
export function parseMultipleUrls(input: string): ParsedUrl[] {
  const urls = input
    .split(/[\n,\s]+/)
    .map(url => url.trim())
    .filter(url => url.length > 0);
  
  const parsed: ParsedUrl[] = [];
  
  for (const url of urls) {
    const result = parseUrl(url);
    if (result) {
      parsed.push(result);
    }
  }
  
  return parsed;
}

/**
 * 플랫폼 이모지
 */
export function getPlatformEmoji(platform: SocialPlatform): string {
  switch (platform) {
    case 'tiktok':
      return '🎵';
    case 'instagram':
      return '📸';
    case 'youtube':
      return '▶️';
  }
}

/**
 * 플랫폼 라벨
 */
export function getPlatformLabel(platform: SocialPlatform): string {
  switch (platform) {
    case 'tiktok':
      return 'TikTok';
    case 'instagram':
      return 'Instagram';
    case 'youtube':
      return 'YouTube';
  }
}
